#!/usr/bin/env node
// gavel — Cucumber JSON report parser
//
// Handles Cucumber.js / Cucumber-JVM / Behave JSON output (array-of-features shape).
//
// Usage:
//   node scripts/parsers/cucumber.js <cucumber-results.json> [--json]

const fs = require('fs');
const path = require('path');

function parseCucumberJson(json) {
  const failures = [];
  const counters = { passed: 0, failed: 0, skipped: 0, total: 0 };

  for (const feature of json) {
    for (const scenario of feature.elements || []) {
      const stepStatuses = (scenario.steps || []).map((s) => s.result?.status);
      const hasFailed = stepStatuses.includes('failed');
      const hasSkipped = stepStatuses.includes('skipped') && !hasFailed;
      counters.total += 1;
      if (hasFailed) {
        counters.failed += 1;
        const failedStep = scenario.steps.find((s) => s.result?.status === 'failed');
        failures.push({
          test: scenario.name || 'unknown',
          file: feature.uri || 'unknown',
          suite: feature.name || 'unknown-suite',
          message: failedStep?.result?.error_message || 'failed',
        });
      } else if (hasSkipped) {
        counters.skipped += 1;
      } else {
        counters.passed += 1;
      }
    }
  }

  return {
    format: 'cucumber',
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
    console.error('Usage: node scripts/parsers/cucumber.js <cucumber-results.json> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(inputPath);
  const json = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const report = parseCucumberJson(json);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Cucumber report: ${resolved}`);
  console.log(`Passed: ${report.passed}  Failed: ${report.failed}  Skipped: ${report.skipped}`);
  console.log(`Pass rate: ${report.passRate}%`);
}

if (require.main === module) {
  main();
}

module.exports = { parseCucumberJson };
