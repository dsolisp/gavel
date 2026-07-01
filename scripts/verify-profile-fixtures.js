#!/usr/bin/env node
// gavel — verify framework profile fixtures and freshness script

const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  return result;
}

const fresh = run(process.execPath, [
  path.join(root, 'scripts/check-profile-freshness.js'),
  path.join(root, 'fixtures/profiles/playwright'),
  '--json',
]);

if (fresh.status !== 0) {
  console.error('Expected fresh Playwright fixture to pass freshness check.');
  console.error(fresh.stdout || fresh.stderr);
  process.exit(1);
}

const stale = run(process.execPath, [
  path.join(root, 'scripts/check-profile-freshness.js'),
  path.join(root, 'fixtures/profiles/cypress-stale'),
  '--json',
]);

if (stale.status === 0) {
  console.error('Expected stale Cypress fixture to fail freshness check.');
  process.exit(1);
}

const requiredProfileSnippets = [
  ['skills/gavel-playwright/SKILL.md', 'getByRole'],
  ['skills/gavel-cypress/SKILL.md', 'cy.get'],
  ['skills/gavel-selenium/SKILL.md', 'find_element'],
  ['skills/gavel-webdriverio/SKILL.md', '$'],
  ['skills/gavel-cucumber/SKILL.md', 'Given'],
];

const fs = require('fs');
for (const [relPath, snippet] of requiredProfileSnippets) {
  const content = fs.readFileSync(path.join(root, relPath), 'utf8');
  if (!content.includes(snippet)) {
    console.error(`Profile missing required snippet "${snippet}": ${relPath}`);
    process.exit(1);
  }
}

console.log('Profile fixtures OK: freshness checks and profile snippets verified.');
