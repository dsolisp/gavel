#!/usr/bin/env node
// gavel — Constitution violation scanner for target automation repos
//
// Usage:
//   node scripts/self-check.js <target-repo-root>
//   node scripts/self-check.js <target-repo-root> --json

const fs = require('fs');
const path = require('path');

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

const TEST_FILE_RE = /\.(spec|test)\.(ts|js|tsx|jsx|py|java|feature)$/;
const ACTION_FILE_RE = /(pages?|actions?|components?|locators?)\//i;
const LOCATOR_FILE_RE = /locators?\//i;

const RULES = [
  {
    tag: 'expect-in-action',
    description: 'Assertion APIs in action/page/locator files',
    test: (filePath, content) => {
      if (LOCATOR_FILE_RE.test(filePath) || /pages?\//i.test(filePath) || /actions?\//i.test(filePath)) {
        return findMatches(content, /\b(expect|assert|assertEquals|assertThat)\s*\(/g);
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
        /\.(getByRole|getByText|getByLabel|getByPlaceholder|getByTestId|locator)\s*\(|querySelector(All)?\s*\(|find_element(s)?\s*\(|\.closest\s*\(|\.matches\s*\(/g,
      );
    },
  },
  {
    tag: 'manual-wait',
    description: 'Manual sleeps or arbitrary polling',
    test: (_filePath, content) =>
      findMatches(
        content,
        /waitForTimeout\s*\(|page\.waitForTimeout|time\.sleep\s*\(|Thread\.sleep\s*\(|cy\.wait\s*\(\s*\d+/g,
      ),
  },
  {
    tag: 'no-di',
    description: 'Direct page object construction in specs',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      return findMatches(content, /\bnew\s+[A-Z][A-Za-z0-9_]*(Page|Actions?|Component|Locators?)\s*\(/g);
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
];

function findMatches(content, pattern) {
  const hits = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (pattern.global) {
      pattern.lastIndex = 0;
    }
    if (pattern.test(line)) {
      hits.push({ line: i + 1, text: line.trim() });
    }
  }
  return hits;
}

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

const findings = [];
const files = walkFiles(resolvedRoot);

for (const filePath of files) {
  const relPath = path.relative(resolvedRoot, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rule of RULES) {
    const hits = rule.test(relPath, content);
    for (const hit of hits) {
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
