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

const behaveFresh = run(process.execPath, [
  path.join(root, 'scripts/check-profile-freshness.js'),
  path.join(root, 'fixtures/profiles/behave-fresh'),
  '--json',
]);

if (behaveFresh.status !== 0) {
  console.error('Expected fresh Behave fixture to pass freshness check.');
  console.error(behaveFresh.stdout || behaveFresh.stderr);
  process.exit(1);
}

const behaveStale = run(process.execPath, [
  path.join(root, 'scripts/check-profile-freshness.js'),
  path.join(root, 'fixtures/profiles/behave-stale'),
  '--json',
]);

if (behaveStale.status === 0) {
  console.error('Expected stale Behave fixture to fail freshness check.');
  process.exit(1);
}

for (const [label, fixturePath] of [
  ['pytest-playwright', 'fixtures/profiles/pytest-playwright-fresh'],
  ['robot', 'fixtures/profiles/robot-fresh'],
  ['playwright-dotnet', 'fixtures/profiles/playwright-dotnet-fresh'],
  ['appium-dotnet', 'fixtures/profiles/appium-dotnet-fresh'],
  ['selenium-dotnet', 'fixtures/profiles/selenium-dotnet-fresh'],
]) {
  const result = run(process.execPath, [
    path.join(root, 'scripts/check-profile-freshness.js'),
    path.join(root, fixturePath),
    '--json',
  ]);
  if (result.status !== 0) {
    console.error(`Expected fresh ${label} fixture to pass freshness check.`);
    console.error(result.stdout || result.stderr);
    process.exit(1);
  }
  const dotnetExpectations = {
    'playwright-dotnet': { framework: 'playwright_dotnet', profile: 'gavel-playwright' },
    'appium-dotnet': { framework: 'appium_dotnet', profile: 'gavel-appium' },
    'selenium-dotnet': { framework: 'selenium_dotnet', profile: 'gavel-selenium' },
  };
  if (dotnetExpectations[label]) {
    const { framework, profile } = dotnetExpectations[label];
    const payload = JSON.parse(result.stdout);
    if (payload.framework !== framework || payload.profile !== profile) {
      console.error(`${label} fixture must resolve to ${framework} → ${profile}`);
      console.error(result.stdout);
      process.exit(1);
    }
  }
}

const areaMap = require(path.join(root, 'scripts/area-map.js'));
const resolved = areaMap.resolveAppSearchPaths('tests/e2e/catalog', {
  'tests/e2e/catalog': { appPaths: ['src/features/catalog'] },
});
if (!resolved.paths.includes('src/features/catalog')) {
  console.error('area-map resolution failed.');
  process.exit(1);
}

const requiredProfileSnippets = [
  ['skills/gavel-playwright/SKILL.md', 'getByRole'],
  ['skills/gavel-cypress/SKILL.md', 'cy.get'],
  ['skills/gavel-selenium/SKILL.md', 'find_element'],
  ['skills/gavel-appium/SKILL.md', 'AppiumBy'],
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

console.log('Profile fixtures OK: freshness, area-map, and profile snippets verified.');
