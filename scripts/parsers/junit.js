#!/usr/bin/env node
// gavel — JUnit XML report parser skeleton (Phase 4 CI Intelligence)
//
// Usage:
//   node scripts/parsers/junit.js <path-to-junit.xml> [--json]

const fs = require('fs');
const path = require('path');

function parseJUnitXml(xml) {
  const suites = [...xml.matchAll(/<testsuite\b([^>]*)>([\s\S]*?)<\/testsuite>/g)];
  const failures = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let total = 0;

  for (const [, attrs, body] of suites) {
    const suiteName = (attrs.match(/name="([^"]*)"/) || [])[1] || 'unknown-suite';
    const cases = [...body.matchAll(/<testcase\b([^>]*)(?:\/>|>([\s\S]*?)<\/testcase>)/g)];

    for (const [, caseAttrs, caseBody = ''] of cases) {
      total += 1;
      const name = (caseAttrs.match(/name="([^"]*)"/) || [])[1] || 'unknown-test';
      const classname = (caseAttrs.match(/classname="([^"]*)"/) || [])[1] || '';
      const file = (caseAttrs.match(/file="([^"]*)"/) || [])[1] || classname;
      const hasFailure = /<failure\b/.test(caseBody);
      const hasSkipped = /<skipped\b/.test(caseBody);

      if (hasSkipped) {
        skipped += 1;
        continue;
      }
      if (hasFailure) {
        failed += 1;
        const message = (caseBody.match(/<failure[^>]*>([\s\S]*?)<\/failure>/) || [])[1] || '';
        failures.push({
          test: name,
          file,
          suite: suiteName,
          message: message.trim().split('\n')[0],
        });
        continue;
      }
      passed += 1;
    }
  }

  return {
    format: 'junit',
    passed,
    failed,
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
    console.error('Usage: node scripts/parsers/junit.js <path-to-junit.xml> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(inputPath);
  const xml = fs.readFileSync(resolved, 'utf8');
  const report = parseJUnitXml(xml);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`JUnit report: ${resolved}`);
  console.log(`Passed: ${report.passed}  Failed: ${report.failed}  Skipped: ${report.skipped}`);
  console.log(`Pass rate: ${report.passRate}%`);
  for (const failure of report.failures.slice(0, 20)) {
    console.log(`- ${failure.test} (${failure.file}) — ${failure.message}`);
  }
  if (report.failures.length > 20) {
    console.log(`... ${report.failures.length - 20} more failures`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseJUnitXml };
