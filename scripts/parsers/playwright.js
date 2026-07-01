#!/usr/bin/env node
// gavel — Playwright JSON report parser
//
// Usage:
//   node scripts/parsers/playwright.js <report.json> [--json]

const fs = require('fs');
const path = require('path');

function walkSuites(suites, failures, counters) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      const specFile = spec.file || suite.file || 'unknown';
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          counters.total += 1;
          if (result.status === 'skipped') {
            counters.skipped += 1;
            continue;
          }
          if (result.status === 'passed' || result.status === 'expected') {
            counters.passed += 1;
            continue;
          }
          counters.failed += 1;
          failures.push({
            test: [suite.title, spec.title, test.title].filter(Boolean).join(' > '),
            file: specFile,
            suite: suite.title || 'unknown-suite',
            message:
              result.error?.message ||
              result.errors?.[0]?.message ||
              result.status ||
              'failed',
          });
        }
      }
    }
    if (suite.suites) {
      walkSuites(suite.suites, failures, counters);
    }
  }
}

function parsePlaywrightJson(json) {
  const failures = [];
  const counters = { passed: 0, failed: 0, skipped: 0, total: 0 };

  if (Array.isArray(json)) {
    for (const entry of json) {
      counters.total += 1;
      if (entry.status === 'passed') {
        counters.passed += 1;
      } else if (entry.status === 'skipped') {
        counters.skipped += 1;
      } else {
        counters.failed += 1;
        failures.push({
          test: entry.title || entry.name || 'unknown',
          file: entry.file || entry.location?.file || 'unknown',
          message: entry.error?.message || entry.status || 'failed',
        });
      }
    }
  } else if (json.suites) {
    walkSuites(json.suites, failures, counters);
  } else if (json.stats) {
    counters.passed = json.stats.expected ?? json.stats.passes ?? 0;
    counters.failed = json.stats.unexpected ?? json.stats.failures ?? 0;
    counters.skipped = json.stats.skipped ?? 0;
    counters.total = counters.passed + counters.failed + counters.skipped;
    for (const error of json.errors || []) {
      counters.failed += 1;
      counters.total += 1;
      failures.push({
        test: error.title || 'runner-error',
        file: error.location?.file || 'unknown',
        message: error.message || 'runner error',
      });
    }
  }

  return {
    format: 'playwright',
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
    console.error('Usage: node scripts/parsers/playwright.js <playwright-report.json> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(inputPath);
  const json = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const report = parsePlaywrightJson(json);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Playwright report: ${resolved}`);
  console.log(`Passed: ${report.passed}  Failed: ${report.failed}  Skipped: ${report.skipped}`);
  console.log(`Pass rate: ${report.passRate}%`);
}

if (require.main === module) {
  main();
}

module.exports = { parsePlaywrightJson };
