#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseConfigFlag, loadGavelConfig } = require('./load-gavel-config');
const { REVIEW_RULES } = require('./review-rules');

function usage() {
  console.error('Usage: node scripts/review.js <before-file> <after-file> [--json] [--config path]');
}

function main(argv) {
  const { args, configPath } = parseConfigFlag(argv);
  const json = args.includes('--json');
  const files = args.filter((arg) => !arg.startsWith('--'));
  if (files.length !== 2) {
    usage();
    process.exit(2);
  }
  const [beforePath, afterPath] = files.map((file) => path.resolve(file));
  if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
    console.error('Before and after files must exist.');
    process.exit(2);
  }
  let config;
  try {
    config = loadGavelConfig(path.dirname(afterPath), { configPath, cwd: process.cwd() });
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  const pair = {
    beforePath,
    afterPath: path.relative(process.cwd(), afterPath).replace(/\\/g, '/'),
    before: fs.readFileSync(beforePath, 'utf8'),
    after: fs.readFileSync(afterPath, 'utf8'),
  };
  const findings = REVIEW_RULES.flatMap((rule) => rule.test(pair))
    .filter((finding) => !config.allowlist?.some((entry) =>
      (entry.file === '*' || pair.afterPath.endsWith(entry.file))
      && (entry.tag === '*' || entry.tag === finding.tag)
      && (!entry.line || entry.line === finding.line)));
  const report = { before: beforePath, after: pair.afterPath, findings };
  if (json) {
    fs.writeSync(1, `${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const finding of findings) {
      console.log(`${finding.severity} ${finding.tag} ${finding.file}:${finding.line} — ${finding.subCase}`);
    }
  }
  process.exit(findings.some((finding) => finding.severity === 'blocker')
    || (config.reportOnlyExits && findings.length) ? 1 : 0);
}

main(process.argv.slice(2));
