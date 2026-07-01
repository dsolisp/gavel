#!/usr/bin/env node
// gavel — verify audit-autofix dry-run and apply on fixtures

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { findDeadLocators } = require('./audit-autofix');

const root = path.join(__dirname, '..');
const fixtureRoot = path.join(root, 'fixtures', 'audit-autofix');
const locatorFile = path.join(fixtureRoot, 'locators', 'AuditFixtureLocators.ts');

const before = fs.readFileSync(locatorFile, 'utf8');
const dead = findDeadLocators(fixtureRoot);

if (!dead.some((item) => item.symbol === 'unusedButton')) {
  console.error('Expected unusedButton to be flagged as dead locator.');
  process.exit(1);
}

if (dead.some((item) => item.symbol === 'usedButton')) {
  console.error('usedButton should not be flagged as dead.');
  process.exit(1);
}

const dryRun = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-autofix.js'), fixtureRoot],
  { encoding: 'utf8' },
);

if (dryRun.status !== 0) {
  console.error(dryRun.stderr || dryRun.stdout);
  process.exit(1);
}

const apply = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-autofix.js'), fixtureRoot, '--apply'],
  { encoding: 'utf8' },
);

if (apply.status !== 0) {
  console.error(apply.stderr || apply.stdout);
  process.exit(1);
}

const after = fs.readFileSync(locatorFile, 'utf8');
if (after.includes('unusedButton')) {
  console.error('apply mode should remove unusedButton.');
  process.exit(1);
}

fs.writeFileSync(locatorFile, before);
console.log('Audit autofix OK: dry-run and apply verified on fixtures.');
