#!/usr/bin/env node
// gavel — corpus precision runner (fixtures/corpus/<tag>/labels.json)
// Precision = true positives / flagged findings for the measured tag.
// Empty corpus (no tag dirs with labels.json) → exit 0.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const corpusRoot = path.join(root, 'fixtures', 'corpus');
const labelsSchema = JSON.parse(
  fs.readFileSync(path.join(root, 'schemas', 'corpus-labels.schema.json'), 'utf8'),
);

const GRADUATION = {
  'report-to-warning': 0.9,
  'warning-to-blocker': 0.95,
};

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function check(value, node, where, errors) {
  if (node.enum) {
    if (!node.enum.includes(value)) errors.push(`${where}: must be one of ${node.enum.join(', ')}`);
    return;
  }
  if (node.type) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    const actual = node.type === 'integer' || types.includes('integer')
      ? (Number.isInteger(value) ? 'integer' : typeOf(value))
      : typeOf(value);
    const ok = types.some((t) => (t === 'integer' ? Number.isInteger(value) : typeOf(value) === t));
    if (!ok) {
      errors.push(`${where}: expected ${types.join('|')}, got ${actual}`);
      return;
    }
  }
  if (node.minLength !== undefined && typeof value === 'string' && value.length < node.minLength) {
    errors.push(`${where}: must be at least ${node.minLength} characters`);
  }
  if (node.minimum !== undefined && typeof value === 'number' && value < node.minimum) {
    errors.push(`${where}: must be >= ${node.minimum}`);
  }
  if (node.maximum !== undefined && typeof value === 'number' && value > node.maximum) {
    errors.push(`${where}: must be <= ${node.maximum}`);
  }
  if (typeOf(value) === 'object' && node.type === 'object') {
    for (const key of node.required || []) {
      if (!(key in value)) errors.push(`${where}: missing required field "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      const childNode = (node.properties || {})[key];
      if (!childNode) {
        if (node.additionalProperties === false) errors.push(`${where}: unknown field "${key}"`);
        continue;
      }
      check(child, childNode, `${where}.${key}`, errors);
    }
  }
  if (node.type === 'array' && node.items && Array.isArray(value)) {
    value.forEach((item, index) => check(item, node.items, `${where}[${index}]`, errors));
  }
}

function validateLabels(doc) {
  const errors = [];
  check(doc, labelsSchema, 'labels', errors);
  return errors;
}

function parseArgs(argv) {
  let threshold = GRADUATION['report-to-warning'];
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') json = true;
    else if (argv[i] === '--threshold') {
      const raw = argv[i + 1];
      i += 1;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        console.error('Usage: --threshold <0..1>');
        process.exit(2);
      }
      threshold = n;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/verify-corpus-precision.js [--threshold 0.9] [--json]');
      process.exit(0);
    }
  }
  return { threshold, json };
}

function listTagDirs() {
  if (!fs.existsSync(corpusRoot)) return [];
  return fs
    .readdirSync(corpusRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(corpusRoot, name, 'labels.json')))
    .sort();
}

function runSelfCheck(dir) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', 'self-check.js'), dir, '--json'],
    { encoding: 'utf8' },
  );
  if (result.status === null) {
    throw new Error(String(result.error || `self-check failed for ${dir}`));
  }
  // status 0/1 both produce JSON; other statuses are usage/config errors
  if (![0, 1].includes(result.status)) {
    throw new Error(`self-check exited ${result.status}: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function findingKey(file, line, tag) {
  return `${file.replace(/\\/g, '/')}::${line}::${tag}`;
}

function measureTag(tagName, threshold) {
  const tagDir = path.join(corpusRoot, tagName);
  const labelsPath = path.join(tagDir, 'labels.json');
  const doc = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

  const schemaErrors = validateLabels(doc);
  if (schemaErrors.length) {
    throw new Error(`${path.relative(root, labelsPath)} invalid:\n  ${schemaErrors.join('\n  ')}`);
  }
  if (doc.tag !== tagName) {
    throw new Error(`${path.relative(root, labelsPath)}: tag "${doc.tag}" must match directory "${tagName}"`);
  }

  for (const sample of doc.samples) {
    const samplePath = path.join(tagDir, sample.file);
    if (!fs.existsSync(samplePath)) {
      throw new Error(`${tagName}: missing sample file ${sample.file}`);
    }
    const expected = sample.expectedFindings || [];
    if (sample.label === 'violating' && expected.length === 0) {
      throw new Error(`${tagName}: violating sample ${sample.file} needs expectedFindings`);
    }
    if (sample.label === 'clean' && expected.length > 0) {
      throw new Error(`${tagName}: clean sample ${sample.file} must not declare expectedFindings`);
    }
    for (const exp of expected) {
      if (exp.tag !== tagName) {
        throw new Error(`${tagName}: expectedFindings tag must be "${tagName}" (got "${exp.tag}" on ${sample.file})`);
      }
    }
  }

  const languages = [...new Set(doc.samples.map((s) => s.language))].sort();
  if (doc.samples.length > 0 && languages.length < 2) {
    throw new Error(`${tagName}: corpus requires ≥2 languages (found ${languages.join(', ') || 'none'})`);
  }

  const report = runSelfCheck(tagDir);
  const sampleFiles = new Set(doc.samples.map((s) => s.file.replace(/\\/g, '/')));

  // Build expected map keyed by file::line::tag → field locks (subCase/replaceable/...
  // Optional locks let the corpus assert field-level correctness, not just tag presence.
  const expectedByKey = new Map();
  for (const sample of doc.samples) {
    for (const exp of sample.expectedFindings || []) {
      const key = findingKey(sample.file.replace(/\\/g, '/'), exp.line, exp.tag);
      expectedByKey.set(key, exp);
    }
  }
  const expectedKeys = new Set(expectedByKey.keys());

  const taggedFindings = (report.findings || []).filter(
    (f) => f.tag === tagName && sampleFiles.has(String(f.file).replace(/\\/g, '/')),
  );

  const falsePositiveFindings = [];
  const fieldMismatchFindings = [];
  let truePositives = 0;
  const matchedExpected = new Set();

  for (const finding of taggedFindings) {
    const file = String(finding.file).replace(/\\/g, '/');
    const key = findingKey(file, finding.line, finding.tag);
    if (expectedKeys.has(key)) {
      // Field-level lock check: a finding on the right line+tag with the wrong
      // subCase/replaceable/pollingLoop/suggestion is a precision failure.
      const exp = expectedByKey.get(key);
      const mismatches = [];
      if (exp.subCase !== undefined && finding.subCase !== exp.subCase) {
        mismatches.push(`subCase: expected ${exp.subCase}, got ${finding.subCase}`);
      }
      if (exp.replaceable !== undefined && finding.replaceable !== exp.replaceable) {
        mismatches.push(`replaceable: expected ${exp.replaceable}, got ${finding.replaceable}`);
      }
      if (exp.pollingLoop !== undefined && Boolean(finding.pollingLoop) !== exp.pollingLoop) {
        mismatches.push(`pollingLoop: expected ${exp.pollingLoop}, got ${Boolean(finding.pollingLoop)}`);
      }
      if (exp.suggestion !== undefined && finding.suggestion !== exp.suggestion) {
        mismatches.push(`suggestion: expected ${exp.suggestion}, got ${finding.suggestion}`);
      }
      if (mismatches.length > 0) {
        fieldMismatchFindings.push({ file, line: finding.line, tag: finding.tag, mismatches });
      } else {
        truePositives += 1;
        matchedExpected.add(key);
      }
    } else {
      falsePositiveFindings.push({ file, line: finding.line, tag: finding.tag });
    }
  }

  const falseNegativeFindings = [];
  for (const key of expectedKeys) {
    if (!matchedExpected.has(key)) {
      const [file, line, tag] = key.split('::');
      falseNegativeFindings.push({ file, line: Number(line), tag });
    }
  }

  const flagged = taggedFindings.length;
  const falsePositives = falsePositiveFindings.length;
  const falseNegatives = falseNegativeFindings.length;
  const fieldMismatches = fieldMismatchFindings.length;
  const precision = flagged === 0 ? null : truePositives / flagged;
  // Contract-first corpora (Implementation Contract #9) may land before the RULES
  // scanner. Until the tag is registered, precision is n/a and FNs do not fail verify.
  const { RULES } = require('./self-check');
  const pendingScanner = !RULES.some((rule) => rule.id === tagName);
  const pass = pendingScanner
    ? true
    : fieldMismatches === 0 &&
      falseNegatives === 0 &&
      (flagged === 0 ? truePositives === 0 : precision !== null && precision + Number.EPSILON >= threshold);

  return {
    tag: tagName,
    precision,
    truePositives,
    falsePositives,
    falseNegatives,
    fieldMismatches,
    flagged,
    languages,
    pass,
    pendingScanner,
    falsePositiveFindings,
    falseNegativeFindings,
    fieldMismatchFindings,
  };
}

function main() {
  const { threshold, json } = parseArgs(process.argv.slice(2));
  const tagDirs = listTagDirs();

  if (tagDirs.length === 0) {
    if (json) {
      const empty = {
        schemaVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        threshold,
        tags: [],
      };
      fs.writeSync(1, `${JSON.stringify(empty, null, 2)}\n`);
    } else {
      console.log('Corpus precision: no corpus directories found (fixtures/corpus/<tag>/labels.json).');
    }
    process.exit(0);
  }

  const tags = [];
  let failed = false;
  for (const tagName of tagDirs) {
    try {
      const row = measureTag(tagName, threshold);
      tags.push(row);
      if (!row.pass) failed = true;
    } catch (error) {
      console.error(error.message || error);
      process.exit(1);
    }
  }

  const payload = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    threshold,
    tags,
  };

  if (json) {
    fs.writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  } else {
    console.log(`Corpus precision (threshold ${threshold}):`);
    for (const row of tags) {
      const pct = row.precision === null ? 'n/a' : `${(row.precision * 100).toFixed(1)}%`;
      const pending = row.pendingScanner ? ' pendingScanner' : '';
      console.log(
        `  ${row.tag}: precision=${pct}${pending} TP=${row.truePositives} FP=${row.falsePositives} FN=${row.falseNegatives} FM=${row.fieldMismatches} languages=${row.languages.join(',')} ${row.pass ? 'PASS' : 'FAIL'}`,
      );
      for (const fp of row.falsePositiveFindings) {
        console.log(`    FP ${fp.file}:${fp.line}`);
      }
      for (const fn of row.falseNegativeFindings) {
        console.log(`    FN ${fn.file}:${fn.line}`);
      }
      for (const fm of row.fieldMismatchFindings) {
        console.log(`    FM ${fm.file}:${fm.line} — ${fm.mismatches.join('; ')}`);
      }
    }
  }

  process.exit(failed ? 1 : 0);
}

module.exports = {
  GRADUATION,
  validateLabels,
  measureTag,
  listTagDirs,
  findingKey,
};

if (require.main === module) {
  main();
}
