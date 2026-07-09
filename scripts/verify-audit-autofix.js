#!/usr/bin/env node
// gavel — verify audit-autofix dry-run and apply on fixtures

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  findDeadLocators,
  findDeadPoms,
  findUnusedFactories,
  findAutofixCandidates,
} = require('./audit-autofix');
const { validateEnvelope } = require('./validate-envelope');

const root = path.join(__dirname, '..');
const fixtureRoot = path.join(root, 'fixtures', 'audit-autofix');
const locatorFile = path.join(fixtureRoot, 'locators', 'AuditFixtureLocators.ts');
const unusedPomFile = path.join(fixtureRoot, 'pages', 'UnusedPage.ts');
const unusedFactoryFile = path.join(fixtureRoot, 'factories', 'UnusedFactory.ts');
const mixedPageFile = path.join(fixtureRoot, 'pages', 'MixedPage.ts');

function restore(filePath, before) {
  fs.writeFileSync(filePath, before);
}

const locatorBefore = fs.readFileSync(locatorFile, 'utf8');
const pomBefore = fs.readFileSync(unusedPomFile, 'utf8');
const factoryBefore = fs.readFileSync(unusedFactoryFile, 'utf8');
const mixedPageBefore = fs.readFileSync(mixedPageFile, 'utf8');

const deadLocators = findDeadLocators(fixtureRoot);
if (!deadLocators.some((item) => item.symbol === 'unusedButton')) {
  console.error('Expected unusedButton to be flagged as dead locator.');
  process.exit(1);
}
if (deadLocators.some((item) => item.symbol === 'usedButton')) {
  console.error('usedButton should not be flagged as dead.');
  process.exit(1);
}

const deadPoms = findDeadPoms(fixtureRoot);
if (!deadPoms.some((item) => item.file.endsWith('pages/UnusedPage.ts'))) {
  console.error('Expected UnusedPage.ts to be flagged as dead POM.');
  process.exit(1);
}
if (deadPoms.some((item) => item.file.endsWith('pages/UsedPage.ts'))) {
  console.error('UsedPage.ts should not be flagged as dead POM.');
  process.exit(1);
}
// Multi-class POM: MixedPage.ts has UsedMixed (referenced) and UnusedMixed (not referenced).
// File must NOT be flagged as dead-pom because not ALL classes are unused.
if (deadPoms.some((item) => item.file.endsWith('pages/MixedPage.ts'))) {
  console.error('MixedPage.ts should not be flagged as dead POM — UsedMixed is referenced.');
  process.exit(1);
}

const unusedFactories = findUnusedFactories(fixtureRoot);
if (!unusedFactories.some((item) => item.symbol === 'createUnused')) {
  console.error('Expected createUnused to be flagged as unused factory.');
  process.exit(1);
}
if (unusedFactories.some((item) => item.symbol === 'createUsed')) {
  console.error('createUsed should not be flagged as unused factory.');
  process.exit(1);
}

const dryRun = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-autofix.js'), fixtureRoot, '--audit-format'],
  { encoding: 'utf8' },
);
if (dryRun.status !== 0 || !dryRun.stdout.includes('dead-pom')) {
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

if (fs.existsSync(unusedPomFile)) {
  console.error('apply mode should delete UnusedPage.ts.');
  process.exit(1);
}

const locatorAfter = fs.readFileSync(locatorFile, 'utf8');
if (locatorAfter.includes('unusedButton')) {
  console.error('apply mode should remove unusedButton.');
  process.exit(1);
}

if (fs.existsSync(unusedFactoryFile)) {
  const factoryAfter = fs.readFileSync(unusedFactoryFile, 'utf8');
  if (factoryAfter.includes('createUnused')) {
    console.error('apply mode should remove createUnused export or delete file.');
    process.exit(1);
  }
}

const auditReport = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-report.js'), fixtureRoot],
  { encoding: 'utf8' },
);
if (auditReport.status !== 0 || !auditReport.stdout.includes('Suite health')) {
  console.error(auditReport.stderr || auditReport.stdout);
  process.exit(1);
}

// --json output must be valid JSON with expected fields
const autofixJson = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-autofix.js'), fixtureRoot, '--json'],
  { encoding: 'utf8' },
);
if (autofixJson.status !== 0) {
  console.error('audit-autofix --json exited non-zero.');
  console.error(autofixJson.stderr || autofixJson.stdout);
  process.exit(1);
}
let autofixPayload;
try {
  autofixPayload = JSON.parse(autofixJson.stdout);
} catch {
  console.error('audit-autofix --json produced invalid JSON.');
  process.exit(1);
}
if (typeof autofixPayload.candidateCount !== 'number' || !Array.isArray(autofixPayload.candidates)) {
  console.error('audit-autofix --json missing candidateCount or candidates array.');
  process.exit(1);
}

// audit-report --json must be valid JSON with ranked lines
const reportJson = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-report.js'), fixtureRoot, '--json'],
  { encoding: 'utf8' },
);
if (reportJson.status !== 0) {
  console.error('audit-report --json exited non-zero.');
  console.error(reportJson.stderr || reportJson.stdout);
  process.exit(1);
}
let reportPayload;
try {
  reportPayload = JSON.parse(reportJson.stdout);
} catch {
  console.error('audit-report --json produced invalid JSON.');
  process.exit(1);
}
if (typeof reportPayload.autofixCount !== 'number' || !Array.isArray(reportPayload.lines)) {
  console.error('audit-report --json missing autofixCount or lines array.');
  process.exit(1);
}

// audit-report --audit-format must produce audit-format output with summary
const reportAuditFormat = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-report.js'), fixtureRoot, '--audit-format'],
  { encoding: 'utf8' },
);
if (reportAuditFormat.status !== 0 || !reportAuditFormat.stdout.includes('Suite health')) {
  console.error('audit-report --audit-format did not produce expected output.');
  console.error(reportAuditFormat.stderr || reportAuditFormat.stdout);
  process.exit(1);
}

// audit-report --json-envelope must emit a schema-valid result envelope
const envelopeJson = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/audit-report.js'), fixtureRoot, '--with-self-check', '--json-envelope'],
  { encoding: 'utf8' },
);
if (envelopeJson.status !== 0) {
  console.error('audit-report --json-envelope exited non-zero.');
  console.error(envelopeJson.stderr || envelopeJson.stdout);
  process.exit(1);
}
const envelopePayload = JSON.parse(envelopeJson.stdout);
const envelopeErrors = validateEnvelope(envelopePayload);
if (envelopeErrors.length > 0 || envelopePayload.findings.length === 0) {
  console.error(`audit-report envelope failed schema validation:\n${envelopeErrors.join('\n')}`);
  process.exit(1);
}

restore(locatorFile, locatorBefore);
restore(unusedPomFile, pomBefore);
restore(unusedFactoryFile, factoryBefore);
restore(mixedPageFile, mixedPageBefore);

const remaining = findAutofixCandidates(fixtureRoot);
if (remaining.length === 0) {
  console.error('Expected autofix candidates after fixture restore.');
  process.exit(1);
}

console.log('Audit autofix OK: locators, POMs, multi-class POM, factories, audit-format, audit-report, JSON output, result envelope verified.');
