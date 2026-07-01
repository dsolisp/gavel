#!/usr/bin/env node
// gavel — verify report parser fixtures

const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function runJson(command, args, input) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    input,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  return JSON.parse(result.stdout);
}

const junit = runJson(process.execPath, [
  path.join(root, 'scripts/parsers/junit.js'),
  path.join(root, 'fixtures/reports/junit/billing-failures.xml'),
  '--json',
]);

const allure = runJson(process.execPath, [
  path.join(root, 'scripts/parsers/allure.js'),
  path.join(root, 'fixtures/reports/allure'),
  '--json',
]);

const playwright = runJson(process.execPath, [
  path.join(root, 'scripts/parsers/playwright.js'),
  path.join(root, 'fixtures/reports/playwright/billing-report.json'),
  '--json',
]);

const cypress = runJson(process.execPath, [
  path.join(root, 'scripts/parsers/cypress.js'),
  path.join(root, 'fixtures/reports/cypress/billing-results.json'),
  '--json',
]);

if (junit.failed < 2 || allure.failed < 1 || playwright.failed < 2 || cypress.failed < 2) {
  console.error('Parser fixtures did not produce expected failures.');
  process.exit(1);
}

const clusters = runJson(
  process.execPath,
  [path.join(root, 'scripts/cluster-failures.js')],
  JSON.stringify(junit),
);

if (!clusters.clusters || clusters.clusters.length === 0) {
  console.error('cluster-failures produced no clusters.');
  process.exit(1);
}

const playwrightHtml = runJson(process.execPath, [
  path.join(root, 'scripts/parsers/playwright-html.js'),
  path.join(root, 'fixtures/reports/playwright-html'),
  '--json',
]);

if (playwrightHtml.failed < 2) {
  console.error('Playwright HTML fixture did not produce expected failures.');
  process.exit(1);
}

const analysis = runJson(
  process.execPath,
  [path.join(root, 'scripts/analyze-ci.js'), '--json'],
  JSON.stringify(playwright),
);

if (!analysis.clusters || analysis.clusters.length === 0) {
  console.error('analyze-ci produced no clusters.');
  process.exit(1);
}

const envelope = spawnSync(
  process.execPath,
  [
    path.join(root, 'scripts/analyze-ci.js'),
    path.join(root, 'fixtures/reports/playwright/billing-report.json'),
    '--envelope',
    '--project',
    'fixture-suite',
  ],
  { encoding: 'utf8' },
);

if (envelope.status !== 0 || !envelope.stdout.includes('## Gavel Result')) {
  console.error('analyze-ci --envelope did not render result block.');
  process.exit(1);
}

const htmlEnvelope = spawnSync(
  process.execPath,
  [
    path.join(root, 'scripts/analyze-ci.js'),
    path.join(root, 'fixtures/reports/playwright-html'),
    '--envelope',
    '--project',
    'fixture-html-suite',
  ],
  { encoding: 'utf8' },
);

if (htmlEnvelope.status !== 0 || !htmlEnvelope.stdout.includes('## Gavel Result')) {
  console.error('analyze-ci playwright-report/ one-shot --envelope failed.');
  process.exit(1);
}

console.log('Parser fixtures OK: junit, allure, playwright, playwright-html, cypress, cluster, analyze-ci, envelope, html one-shot.');
