#!/usr/bin/env node
// gavel — Constitution violation scanner for target automation repos
//
// Usage:
//   node scripts/self-check.js <target-repo-root>
//   node scripts/self-check.js <target-repo-root> --json

const fs = require('fs');
const path = require('path');
const { loadGavelConfig } = require('./load-gavel-config');

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const targetRoot = args.find((arg) => !arg.startsWith('--'));

if (!targetRoot) {
  console.error('Usage: node scripts/self-check.js <target-repo-root> [--json]');
  process.exit(2);
}

const resolvedRoot = path.resolve(targetRoot);
if (!fs.existsSync(resolvedRoot)) {
  console.error(`Target path does not exist: ${resolvedRoot}`);
  process.exit(2);
}

const config = loadGavelConfig(resolvedRoot);
const allowlist = Array.isArray(config.allowlist) ? config.allowlist : [];

const TEST_FILE_RE = /\.(spec|test)\.(ts|js|tsx|jsx|py|java|feature)$/;
const LOCATOR_FILE_RE = /locators?\//i;

function findMatches(content, pattern, filePath = '') {
  const hits = [];
  const lines = content.split('\n');
  const isPython = filePath.endsWith('.py');
  let inBlock = false;
  let blockQuote = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    let isComment = false;

    if (inBlock) {
      isComment = true;
      if (blockQuote === '/*' && trimmed.endsWith('*/')) inBlock = false;
      else if (blockQuote && trimmed.endsWith(blockQuote)) inBlock = false;
      // Handle cases where the closing quote is not at the very end but the line is mostly comment
      else if (blockQuote === '"""' && trimmed.includes('"""')) inBlock = false;
      else if (blockQuote === "'''" && trimmed.includes("'''")) inBlock = false;
    } else {
      if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        isComment = true;
      } else if (trimmed.startsWith('/*')) {
        isComment = true;
        if (!trimmed.endsWith('*/') || trimmed.length < 4) {
          inBlock = true;
          blockQuote = '/*';
        }
      } else if (isPython && (trimmed.startsWith('"""') || trimmed.startsWith("'''"))) {
        isComment = true;
        const q = trimmed.startsWith('"""') ? '"""' : "'''";
        // Check if it ends on the same line (need at least 6 chars for """...""")
        if (trimmed.length < 6 || !trimmed.endsWith(q)) {
          inBlock = true;
          blockQuote = q;
        }
      }
    }

    if (!isComment && !trimmed.includes('gavel-ignore')) {
      if (pattern.global) pattern.lastIndex = 0;
      if (pattern.test(line)) {
        hits.push({ line: i + 1, text: trimmed });
      }
    }
  }
  return hits;
}

function hasInlineAllow(content, line, tag) {
  const lines = content.split('\n');
  const index = line - 1;
  const context = [lines[index - 1] || '', lines[index] || '', lines[index + 1] || ''].join('\n');
  const allowPattern = new RegExp(`gavel-allow:\\s*(\\*|${tag})`);
  return allowPattern.test(context);
}

function isAllowlisted(file, tag, line) {
  return allowlist.some((entry) => {
    const fileMatch = entry.file === '*' || entry.file === file;
    const tagMatch = entry.tag === '*' || entry.tag === tag;
    const lineMatch = !entry.line || entry.line === line;
    return fileMatch && tagMatch && lineMatch;
  });
}

function splitTestBlocks(content) {
  const blocks = [];
  const lines = content.split('\n');
  let current = null;
  let depth = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const startsTest = /\b(?:test|it)\s*(?:\.(?:only|skip|fixme|fail))?\s*\(/.test(line);

    if (startsTest && depth === 0) {
      if (current) {
        blocks.push(current);
      }
      current = { startLine: i + 1, lines: [line] };
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      continue;
    }

    if (current) {
      current.lines.push(line);
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      if (depth <= 0) {
        blocks.push(current);
        current = null;
        depth = 0;
      }
    }
  }

  if (current) {
    blocks.push(current);
  }

  return blocks;
}

const RULES = [
  {
    tag: 'expect-in-action',
    description: 'Assertion APIs in action/page/locator files',
    test: (filePath, content) => {
      if (LOCATOR_FILE_RE.test(filePath) || /pages?\//i.test(filePath) || /actions?\//i.test(filePath)) {
        return findMatches(content, /\b(expect|assert|assertEquals|assertThat)\s*\(/g, filePath);
      }
      return [];
    },
  },
  {
    tag: 'selector-leak',
    description: 'Raw selector chains outside locator classes',
    test: (filePath, content) => {
      if (LOCATOR_FILE_RE.test(filePath)) {
        return [];
      }
      if (!/(pages?|actions?|components?)\//i.test(filePath) && !TEST_FILE_RE.test(filePath)) {
        return [];
      }
      return findMatches(
        content,
        /\.(getByRole|getByText|getByLabel|getByPlaceholder|getByTestId|locator|findElement(s)?|find_element(s)?)\s*\(|querySelector(All)?\s*\(|\.closest\s*\(|\.matches\s*\(/g,
        filePath,
      );
    },
  },
  {
    tag: 'manual-wait',
    description: 'Manual sleeps or arbitrary polling',
    test: (filePath, content) =>
      findMatches(
        content,
        /waitForTimeout\s*\(|page\.waitForTimeout|time\.sleep\s*\(|Thread\.sleep\s*\(|cy\.wait\s*\(\s*\d+/g,
        filePath,
      ),
  },
  {
    tag: 'no-di',
    description: 'Direct page object construction in specs',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      return findMatches(content, /\bnew\s+[A-Z][A-Za-z0-9_]*(Page|Actions?|Component|Locators?)\s*\(/g, filePath);
    },
  },
  {
    tag: 'no-step',
    description: 'Large specs without step grouping',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath) || filePath.endsWith('.feature')) {
        return [];
      }
      const testCount = (content.match(/\btest\s*\(/g) || []).length;
      const stepCount = (content.match(/test\.step\s*\(/g) || []).length;
      if (testCount >= 2 && stepCount === 0 && content.split('\n').length > 80) {
        return [{ line: 1, text: 'spec has multiple tests and no test.step() grouping' }];
      }
      return [];
    },
  },
  {
    tag: 'bare-test-fail',
    description: 'test.fail() without issue tracker reference',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const hits = [];
      const lines = content.split('\n');
      const ticketRe = /[A-Z][A-Z0-9]+-\d+|PROJ-\d+|#\d+/;
      for (let i = 0; i < lines.length; i += 1) {
        if (!/\btest\.fail\s*\(|\bit\.failing\s*\(|\bpytest\.mark\.xfail\b/.test(lines[i])) {
          continue;
        }
        const context = `${lines[i - 1] || ''}\n${lines[i]}\n${lines[i + 1] || ''}`;
        if (!ticketRe.test(context)) {
          hits.push({ line: i + 1, text: lines[i].trim() });
        }
      }
      return hits;
    },
  },
  {
    tag: 'test-fail-order',
    description: 'test.fail() must precede assertions in the same test',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const hits = [];
      for (const block of splitTestBlocks(content)) {
        const failIdx = block.lines.findIndex((line) =>
          /\btest\.fail\s*\(|\bit\.failing\s*\(/.test(line),
        );
        if (failIdx < 0) {
          continue;
        }
        const assertIdx = block.lines.findIndex((line) =>
          /\bexpect\s*\(|\bassert\b|\bassertEquals\b|\bassertThat\b/.test(line),
        );
        if (assertIdx >= 0 && failIdx > assertIdx) {
          hits.push({
            line: block.startLine + failIdx,
            text: block.lines[failIdx].trim(),
          });
        }
      }
      return hits;
    },
  },
  {
    tag: 'skip-marker',
    description: 'Skip, quarantine, or WIP marker without reason',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const hits = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!/\btest\.skip\s*\(|\btest\.fixme\s*\(|\bit\.skip\s*\(|\b@wip\b|\b@quarantine\b|\b@flaky\b/.test(line)) {
          continue;
        }
        const context = `${lines[i - 1] || ''}\n${line}\n${lines[i + 1] || ''}`;
        if (!/reason:|\/\/|\/\*|because|ticket|[A-Z][A-Z0-9]+-\d+/.test(context)) {
          hits.push({ line: i + 1, text: line.trim() });
        }
      }
      return hits;
    },
  },
];

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
  'allure-results',
  'allure-report',
  '.next',
  '.nuxt',
  'out',
  '.venv',
  'venv',
  'venv-enhanced',
  '.venv-ci',
]);

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|py|java|feature)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanTestIds(files, repoRoot) {
  if (!config.testIdPrefix && !config.testIdPattern) {
    return [];
  }

  const pattern = new RegExp(
    config.testIdPattern || `${config.testIdPrefix}-(\\d+)`,
    'g',
  );
  const ids = new Map();
  const findings = [];

  for (const filePath of files) {
    const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    if (!TEST_FILE_RE.test(relPath)) {
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    let match = pattern.exec(content);
    while (match) {
      const id = match[0];
      if (!ids.has(id)) {
        ids.set(id, []);
      }
      ids.get(id).push(relPath);
      match = pattern.exec(content);
    }
    pattern.lastIndex = 0;
  }

  for (const [id, locations] of ids.entries()) {
    if (locations.length > 1) {
      findings.push({
        tag: 'test-id-duplicate',
        description: 'Duplicate test ID across specs',
        file: locations[0],
        line: 1,
        text: `${id} appears in ${locations.join(', ')}`,
      });
    }
  }

  const numericIds = [...ids.keys()]
    .map((id) => {
      const match = id.match(/(\d+)$/);
      return match ? Number(match[1]) : null;
    })
    .filter((value) => value !== null)
    .sort((a, b) => a - b);

  if (numericIds.length >= 2 && config.enforceConsecutiveTestIds) {
    for (let i = 1; i < numericIds.length; i += 1) {
      if (numericIds[i] - numericIds[i - 1] > 1) {
        findings.push({
          tag: 'test-id-gap',
          description: 'Gap in consecutive test ID sequence',
          file: 'suite',
          line: 1,
          text: `Missing IDs between ${numericIds[i - 1]} and ${numericIds[i]}`,
        });
        break;
      }
    }
  }

  return findings;
}

const findings = [];
const files = walkFiles(resolvedRoot);

for (const filePath of files) {
  const relPath = path.relative(resolvedRoot, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rule of RULES) {
    const hits = rule.test(relPath, content);
    for (const hit of hits) {
      if (isAllowlisted(relPath, rule.tag, hit.line) || hasInlineAllow(content, hit.line, rule.tag)) {
        continue;
      }
      findings.push({
        tag: rule.tag,
        description: rule.description,
        file: relPath,
        line: hit.line,
        text: hit.text,
      });
    }
  }
}

findings.push(...scanTestIds(files, resolvedRoot));

findings.sort((a, b) => a.tag.localeCompare(b.tag) || a.file.localeCompare(b.file));

const summary = findings.reduce((acc, finding) => {
  acc[finding.tag] = (acc[finding.tag] || 0) + 1;
  return acc;
}, {});

const report = {
  target: resolvedRoot,
  scannedFiles: files.length,
  violationCount: findings.length,
  summary,
  findings,
};

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(findings.length > 0 ? 1 : 0);
}

console.log(`Gavel self-check — ${resolvedRoot}`);
console.log(`Scanned ${files.length} files. Violations: ${findings.length}`);

if (findings.length === 0) {
  console.log('No Constitution violations detected.');
  process.exit(0);
}

for (const finding of findings) {
  console.log(`${finding.tag} ${finding.file}:${finding.line} — ${finding.text}`);
}

console.log('\nSummary:');
for (const [tag, count] of Object.entries(summary)) {
  console.log(`  ${tag}: ${count}`);
}

process.exit(1);
