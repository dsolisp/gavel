#!/usr/bin/env node
// gavel — Playwright HTML report directory parser
//
// Usage:
//   node scripts/parsers/playwright-html.js <playwright-report-dir> [--json]
//
// Reads JSON chunks under playwright-report/data/ (HTML reporter output).

const fs = require('fs');
const path = require('path');
const { parsePlaywrightJson } = require('./playwright');

const EXCLUDED = new Set(['trace', 'assets']);

function walkJsonFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(fullPath, files);
      continue;
    }
    if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function mergeReports(reports) {
  const merged = {
    format: 'playwright-html',
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    passRate: 0,
    failures: [],
  };

  for (const report of reports) {
    merged.passed += report.passed;
    merged.failed += report.failed;
    merged.skipped += report.skipped;
    merged.total += report.total;
    merged.failures.push(...report.failures);
  }

  merged.passRate =
    merged.total > 0 ? Number(((merged.passed / merged.total) * 100).toFixed(1)) : 0;
  return merged;
}

function parsePlaywrightHtmlReport(reportDir) {
  const resolved = path.resolve(reportDir);
  const dataDir = fs.existsSync(path.join(resolved, 'data'))
    ? path.join(resolved, 'data')
    : resolved;

  const jsonFiles = walkJsonFiles(dataDir);
  const reports = [];

  for (const filePath of jsonFiles) {
    try {
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      reports.push(parsePlaywrightJson(json));
    } catch {
      // skip non-report json chunks
    }
  }

  if (reports.length === 0) {
    const indexPath = path.join(resolved, 'index.html');
    if (fs.existsSync(indexPath)) {
      throw new Error(
        `Playwright HTML report found at ${resolved} but no parseable JSON chunks in data/. Re-run with JSON reporter or upload data/*.json artifacts.`,
      );
    }
    throw new Error(`Not a Playwright HTML report directory: ${resolved}`);
  }

  return mergeReports(reports);
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const inputPath = args.find((arg) => !arg.startsWith('--'));

  if (!inputPath) {
    console.error('Usage: node scripts/parsers/playwright-html.js <playwright-report-dir> [--json]');
    process.exit(2);
  }

  const report = parsePlaywrightHtmlReport(inputPath);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Playwright HTML report: ${path.resolve(inputPath)}`);
  console.log(`Passed: ${report.passed}  Failed: ${report.failed}  Skipped: ${report.skipped}`);
  console.log(`Pass rate: ${report.passRate}%`);
}

if (require.main === module) {
  main();
}

module.exports = { parsePlaywrightHtmlReport, walkJsonFiles };
