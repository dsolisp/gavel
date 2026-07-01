#!/usr/bin/env node
// gavel — Cypress JSON report parser
//
// Usage:
//   node scripts/parsers/cypress.js <cypress-results.json> [--json]

const fs = require('fs');
const path = require('path');

function collectTests(node, fileHint, failures, counters) {
  for (const test of node.tests || []) {
    counters.total += 1;
    if (test.state === 'passed') {
      counters.passed += 1;
      continue;
    }
    if (test.state === 'skipped' || test.state === 'pending') {
      counters.skipped += 1;
      continue;
    }
    counters.failed += 1;
    failures.push({
      test: test.title || 'unknown',
      file: test.file || fileHint || 'unknown',
      suite: node.title || 'unknown-suite',
      message: test.displayError || test.err?.message || test.state || 'failed',
    });
  }

  for (const child of node.suites || []) {
    collectTests(child, fileHint, failures, counters);
  }
}

function parseCypressJson(json) {
  const failures = [];
  const counters = { passed: 0, failed: 0, skipped: 0, total: 0 };

  if (json.stats) {
    counters.passed = json.stats.passes ?? 0;
    counters.failed = json.stats.failures ?? 0;
    counters.skipped = json.stats.pending ?? json.stats.skipped ?? 0;
    counters.total = json.stats.tests ?? counters.passed + counters.failed + counters.skipped;
  }

  const runs = json.runs || json.results || [json];
  for (const run of runs) {
    const fileHint = run.file || run.spec?.absolute || run.spec?.relative;
    for (const suite of run.suites || []) {
      collectTests(suite, fileHint, failures, counters);
    }
    for (const test of run.tests || []) {
      counters.total += 1;
      if (test.state === 'passed') {
        counters.passed += 1;
      } else if (test.state === 'skipped' || test.state === 'pending') {
        counters.skipped += 1;
      } else {
        counters.failed += 1;
        failures.push({
          test: test.title || 'unknown',
          file: test.file || fileHint || 'unknown',
          message: test.displayError || test.err?.message || test.state || 'failed',
        });
      }
    }
  }

  if (counters.total === 0 && json.stats) {
    counters.total = counters.passed + counters.failed + counters.skipped;
  }

  return {
    format: 'cypress',
    passed: counters.passed,
    failed: counters.failed,
    skipped: counters.skipped,
    total: counters.total,
    passRate: counters.total > 0 ? Number(((counters.passed / counters.total) * 100).toFixed(1)) : 0,
    failures,
  };
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const inputPath = args.find((arg) => !arg.startsWith('--'));

  if (!inputPath) {
    console.error('Usage: node scripts/parsers/cypress.js <cypress-results.json> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(inputPath);
  const json = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const report = parseCypressJson(json);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Cypress report: ${resolved}`);
  console.log(`Passed: ${report.passed}  Failed: ${report.failed}  Skipped: ${report.skipped}`);
  console.log(`Pass rate: ${report.passRate}%`);
}

if (require.main === module) {
  main();
}

module.exports = { parseCypressJson };
