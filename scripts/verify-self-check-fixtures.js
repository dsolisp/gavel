#!/usr/bin/env node
// gavel — verify self-check golden fixtures detect every Constitution rule

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const fixturesDir = path.join(root, 'fixtures', 'self-check', 'violations');

const EXPECTED_TAGS = [
  'expect-in-action',
  'selector-leak',
  'manual-wait',
  'no-di',
  'no-step',
];

if (!fs.existsSync(fixturesDir)) {
  console.error(`MISSING fixtures directory: ${fixturesDir}`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [path.join(root, 'scripts', 'self-check.js'), fixturesDir, '--json'],
  { encoding: 'utf8' },
);

if (result.status === null) {
  console.error(result.error || 'Failed to run self-check');
  process.exit(1);
}

const report = JSON.parse(result.stdout);
const found = new Set(Object.keys(report.summary || {}));
const missing = EXPECTED_TAGS.filter((tag) => !found.has(tag));

if (missing.length > 0) {
  console.error(`Self-check fixtures missing tags: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(
  `Self-check fixtures OK: ${EXPECTED_TAGS.length} rules detected (${report.violationCount} findings).`,
);
