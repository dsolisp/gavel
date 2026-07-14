#!/usr/bin/env node
// gavel — verify self-check golden fixtures detect every Constitution rule

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { RULES } = require('./self-check');

const root = path.join(__dirname, '..');
const fixturesDir = path.join(root, 'fixtures', 'self-check', 'violations');
const cleanDir = path.join(root, 'fixtures', 'self-check', 'clean');

const EXPECTED_TAGS = RULES.map((rule) => rule.id);

// RULES contract gate: every rule maps to an envelope severity; confidence, when set, is valid
for (const rule of RULES) {
  if (!['blocker', 'fix', 'cleanup', 'delete', 'report'].includes(rule.envelopeSeverity)) {
    console.error(`Rule ${rule.id} has invalid envelopeSeverity: ${rule.envelopeSeverity}`);
    process.exit(1);
  }
  if (rule.confidence !== undefined && !['high', 'medium', 'low'].includes(rule.confidence)) {
    console.error(`Rule ${rule.id} has invalid confidence: ${rule.confidence}`);
    process.exit(1);
  }
}

if (!fs.existsSync(fixturesDir)) {
  console.error(`MISSING fixtures directory: ${fixturesDir}`);
  process.exit(1);
}

function runSelfCheck(dir) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', 'self-check.js'), dir, '--json'],
    { encoding: 'utf8' },
  );
  if (result.status === null) {
    console.error(result.error || 'Failed to run self-check');
    process.exit(1);
  }
  return JSON.parse(result.stdout);
}

const report = runSelfCheck(fixturesDir);
const found = new Set(Object.keys(report.summary || {}));
const missing = EXPECTED_TAGS.filter((tag) => !found.has(tag));

if (missing.length > 0) {
  console.error(`Self-check fixtures missing tags: ${missing.join(', ')}`);
  process.exit(1);
}

const missingClean = EXPECTED_TAGS.filter((tag) => !fs.existsSync(path.join(cleanDir, tag)));

if (missingClean.length > 0) {
  console.error(`Self-check clean fixtures missing for tags: ${missingClean.join(', ')}`);
  process.exit(1);
}

const cleanReport = runSelfCheck(cleanDir);

if (cleanReport.violationCount > 0) {
  console.error('Self-check clean fixtures produced false positives:');
  for (const finding of cleanReport.findings) {
    console.error(`  ${finding.tag} ${finding.file}:${finding.line} — ${finding.text}`);
  }
  process.exit(1);
}

console.log(
  `Self-check fixtures OK: ${EXPECTED_TAGS.length} rules detected (${report.violationCount} findings), clean samples clean.`,
);
