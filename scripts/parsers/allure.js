#!/usr/bin/env node
// gavel — Allure results parser skeleton (Phase 4 CI Intelligence)
//
// Usage:
//   node scripts/parsers/allure.js <allure-results-dir> [--json]

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseAllureResults(resultsDir) {
  const files = fs
    .readdirSync(resultsDir)
    .filter((name) => name.endsWith('-result.json'))
    .map((name) => path.join(resultsDir, name));

  const failures = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let broken = 0;

  for (const filePath of files) {
    const result = readJson(filePath);
    const status = result.status || 'unknown';
    const testName = result.name || result.fullName || path.basename(filePath);
    const suite = (result.labels || []).find((label) => label.name === 'suite')?.value || 'unknown-suite';
    const feature = (result.labels || []).find((label) => label.name === 'feature')?.value || suite;

    if (status === 'passed') {
      passed += 1;
      continue;
    }
    if (status === 'skipped') {
      skipped += 1;
      continue;
    }
    if (status === 'broken') {
      broken += 1;
    } else {
      failed += 1;
    }

    const message =
      result.statusDetails?.message ||
      (result.statusDetails?.trace || '').split('\n')[0] ||
      status;

    failures.push({
      test: testName,
      area: feature,
      suite,
      status,
      message,
      file: filePath,
    });
  }

  const total = passed + failed + skipped + broken;

  return {
    format: 'allure',
    passed,
    failed,
    broken,
    skipped,
    total,
    passRate: total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0,
    failures,
  };
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const inputPath = args.find((arg) => !arg.startsWith('--'));

  if (!inputPath) {
    console.error('Usage: node scripts/parsers/allure.js <allure-results-dir> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    console.error(`Allure results directory not found: ${resolved}`);
    process.exit(2);
  }

  const report = parseAllureResults(resolved);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Allure report: ${resolved}`);
  console.log(
    `Passed: ${report.passed}  Failed: ${report.failed}  Broken: ${report.broken}  Skipped: ${report.skipped}`,
  );
  console.log(`Pass rate: ${report.passRate}%`);
  for (const failure of report.failures.slice(0, 20)) {
    console.log(`- [${failure.status}] ${failure.test} (${failure.area}) — ${failure.message}`);
  }
  if (report.failures.length > 20) {
    console.log(`... ${report.failures.length - 20} more failures`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseAllureResults };
