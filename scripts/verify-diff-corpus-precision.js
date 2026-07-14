#!/usr/bin/env node
// gavel — diff-corpus precision runner (fixtures/self-check/diff/<tag>/<case>/)
// Runs gavel-review (scripts/review.js) against before/after pairs and
// compares findings to meta.json expectedFindings.
//
// Exit 0 if precision ≥ threshold, exit 1 otherwise.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const diffRoot = path.join(root, 'fixtures', 'self-check', 'diff');

const GRADUATION = {
  'report-to-fix': 0.9,
  'fix-to-blocker': 0.95,
};

function parseArgs(argv) {
  let threshold = GRADUATION['report-to-fix'];
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') json = true;
    else if (argv[i] === '--threshold') {
      const n = Number(argv[i + 1]);
      i += 1;
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        console.error('Usage: --threshold <0..1>');
        process.exit(2);
      }
      threshold = n;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/verify-diff-corpus-precision.js [--threshold 0.9] [--json]');
      process.exit(0);
    }
  }
  return { threshold, json };
}

function listTagDirs() {
  if (!fs.existsSync(diffRoot)) return [];
  return fs.readdirSync(diffRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function listCases(tagDir) {
  const tagPath = path.join(diffRoot, tagDir);
  return fs.readdirSync(tagPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(tagPath, name, 'meta.json')))
    .sort();
}

function runReview(beforeFile, afterFile) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', 'review.js'), beforeFile, afterFile, '--json'],
    { encoding: 'utf8', cwd: root },
  );
  // review.js exits 1 on blocker findings, 0 on clean — both produce valid JSON
  if (![0, 1].includes(result.status)) {
    throw new Error(`review.js exited ${result.status}: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function findingKey(file, line, subCase) {
  return `${file}::${line}::${subCase}`;
}

function measureTag(tagName, threshold) {
  const cases = listCases(tagName);
  if (cases.length === 0) return null;

  const expectedKeys = new Set();
  const cleanCases = [];
  for (const caseName of cases) {
    const meta = JSON.parse(fs.readFileSync(
      path.join(diffRoot, tagName, caseName, 'meta.json'), 'utf8'));
    if (meta.label === 'clean') {
      cleanCases.push(caseName);
    }
    for (const exp of meta.expectedFindings || []) {
      expectedKeys.add(findingKey(exp.file, exp.line, exp.subCase));
    }
  }

  let truePositives = 0;
  const falsePositiveFindings = [];
  const matchedExpected = new Set();

  for (const caseName of cases) {
    const casePath = path.join(diffRoot, tagName, caseName);
    const beforeFile = path.join(casePath, 'before.spec.ts');
    const afterFile = path.join(casePath, 'after.spec.ts');
    const meta = JSON.parse(fs.readFileSync(path.join(casePath, 'meta.json'), 'utf8'));

    if (!fs.existsSync(beforeFile) || !fs.existsSync(afterFile)) {
      throw new Error(`${tagName}/${caseName}: missing before.spec.ts or after.spec.ts`);
    }

    const report = runReview(beforeFile, afterFile);
    const tagFindings = (report.findings || []).filter((f) => f.tag === tagName);

    for (const finding of tagFindings) {
      const afterRel = path.relative(casePath, afterFile).replace(/\\/g, '/');
      const key = findingKey(afterRel, finding.line, finding.subCase);
      if (expectedKeys.has(key)) {
        truePositives += 1;
        matchedExpected.add(key);
      } else {
        falsePositiveFindings.push({
          caseName,
          file: afterRel,
          line: finding.line,
          subCase: finding.subCase,
        });
      }
    }
  }

  const falseNegativeFindings = [];
  for (const key of expectedKeys) {
    if (!matchedExpected.has(key)) {
      const [file, line, subCase] = key.split('::');
      falseNegativeFindings.push({ file, line: Number(line), subCase });
    }
  }

  const flagged = truePositives + falsePositiveFindings.length;
  const precision = flagged === 0 ? null : truePositives / flagged;
  const pass = falseNegativeFindings.length === 0
    && (flagged === 0 ? true : precision !== null && precision + Number.EPSILON >= threshold);

  return {
    tag: tagName,
    precision,
    truePositives,
    falsePositives: falsePositiveFindings.length,
    falseNegatives: falseNegativeFindings.length,
    flagged,
    totalCases: cases.length,
    cleanCases: cleanCases.length,
    pass,
    falsePositiveFindings,
    falseNegativeFindings,
  };
}

function main() {
  const { threshold, json } = parseArgs(process.argv.slice(2));
  const tagDirs = listTagDirs();

  if (tagDirs.length === 0) {
    if (json) {
      fs.writeSync(1, `${JSON.stringify({
        schemaVersion: '1.0.0', generatedAt: new Date().toISOString(), threshold, tags: [],
      }, null, 2)}\n`);
    } else {
      console.log('Diff-corpus precision: no diff fixture directories found.');
    }
    process.exit(0);
  }

  const tags = [];
  let failed = false;
  for (const tagName of tagDirs) {
    try {
      const row = measureTag(tagName, threshold);
      if (row) {
        tags.push(row);
        if (!row.pass) failed = true;
      }
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
    console.log(`Diff-corpus precision (threshold ${threshold}):`);
    for (const row of tags) {
      const pct = row.precision === null ? 'n/a' : `${(row.precision * 100).toFixed(1)}%`;
      console.log(
        `  ${row.tag}: precision=${pct} TP=${row.truePositives} FP=${row.falsePositives} FN=${row.falseNegatives} cases=${row.totalCases}(${row.cleanCases} clean) ${row.pass ? 'PASS' : 'FAIL'}`);
      for (const fp of row.falsePositiveFindings) {
        console.log(`    FP ${fp.caseName}/${fp.file}:${fp.line} (${fp.subCase})`);
      }
      for (const fn of row.falseNegativeFindings) {
        console.log(`    FN ${fn.file}:${fn.line} (${fn.subCase})`);
      }
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
