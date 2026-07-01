#!/usr/bin/env node
// gavel — route report files to the correct parser

const fs = require('fs');
const path = require('path');
const { parseJUnitXml } = require('./junit');
const { parseAllureResults } = require('./allure');
const { parsePlaywrightJson } = require('./playwright');
const { parseCypressJson } = require('./cypress');

function parseReport(inputPath) {
  const resolved = path.resolve(inputPath);
  const stat = fs.statSync(resolved);

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(resolved);
    if (entries.some((name) => name.endsWith('-result.json'))) {
      return parseAllureResults(resolved);
    }
    throw new Error(`Unknown report directory format: ${resolved}`);
  }

  const lower = resolved.toLowerCase();
  const content = fs.readFileSync(resolved, 'utf8');

  if (lower.endsWith('.xml')) {
    return parseJUnitXml(content);
  }

  if (lower.endsWith('.json')) {
    const json = JSON.parse(content);
    if (json.format && json.failures) {
      return json;
    }
    if (json.suites && (json.config || json.stats)) {
      return parsePlaywrightJson(json);
    }
    if (json.stats && (json.runs || json.results || json.tests)) {
      return parseCypressJson(json);
    }
    if (Array.isArray(json)) {
      if (json.some((item) => item.status && item.title)) {
        return parsePlaywrightJson(json);
      }
      return {
        format: 'json-list',
        passed: json.filter((item) => item.status === 'passed').length,
        failed: json.filter((item) => item.status === 'failed').length,
        skipped: json.filter((item) => item.status === 'skipped').length,
        total: json.length,
        passRate: 0,
        failures: json
          .filter((item) => item.status === 'failed' || item.status === 'broken')
          .map((item) => ({
            test: item.name || item.title,
            message: item.statusDetails?.message || item.error?.message || item.status,
            file: item.file || item.spec || 'unknown',
          })),
      };
    }
  }

  throw new Error(`Unsupported report format: ${resolved}`);
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const inputPath = args.find((arg) => !arg.startsWith('--'));

  if (!inputPath) {
    console.error('Usage: node scripts/parsers/index.js <report-file-or-allure-dir> [--json]');
    process.exit(2);
  }

  const report = parseReport(inputPath);
  report.passRate =
    report.total > 0 ? Number(((report.passed / report.total) * 100).toFixed(1)) : 0;

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { parseReport };
