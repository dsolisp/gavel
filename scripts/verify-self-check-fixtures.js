#!/usr/bin/env node
// gavel — verify self-check golden fixtures detect every Constitution rule

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { RULES, TEST_FILE_RE } = require('./self-check');
const { REVIEW_RULES } = require('./review-rules');

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
  if (!['test-only', 'all-files'].includes(rule.scope)) {
    console.error(`Rule ${rule.id} has invalid scope: ${rule.scope}`);
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

const manualWaits = report.findings.filter((finding) => finding.tag === 'manual-wait');
const subCases = new Set(manualWaits.map((finding) => finding.subCase));
const subCaseCounts = manualWaits.reduce((acc, finding) => {
  acc[finding.subCase] = (acc[finding.subCase] || 0) + 1;
  return acc;
}, {});
const expectedSubCases = ['redundant', 'stale-read', 'intentional'];
const missingSubCases = expectedSubCases.filter((subCase) => !subCases.has(subCase));

if (missingSubCases.length > 0) {
  console.error(`manual-wait fixtures missing sub-cases: ${missingSubCases.join(', ')}`);
  process.exit(1);
}

for (const subCase of expectedSubCases) {
  if ((subCaseCounts[subCase] || 0) < 2) {
    console.error(`manual-wait sub-case ${subCase} has fewer than 2 fixtures (${subCaseCounts[subCase] || 0})`);
    process.exit(1);
  }
}

const missingDuration = manualWaits.find((finding) => !('durationMs' in finding));
if (missingDuration) {
  console.error(`manual-wait finding missing durationMs: ${missingDuration.file}:${missingDuration.line}`);
  process.exit(1);
}

const waitPatterns = [
  { name: 'waitForTimeout', predicate: (text) => /waitForTimeout\s*\(/.test(text) },
  { name: 'time.sleep', predicate: (text) => /time\.sleep\s*\(/.test(text) },
  { name: 'Thread.sleep', predicate: (text) => /Thread\.sleep\s*\(/.test(text) },
  { name: 'Thread.Sleep', predicate: (text) => /Thread\.Sleep\s*\(/.test(text) },
  { name: 'Task.Delay', predicate: (text) => /Task\.Delay\s*\(/.test(text) },
  { name: 'WaitForTimeoutAsync', predicate: (text) => /WaitForTimeoutAsync\s*\(/.test(text) },
  { name: 'cy.wait', predicate: (text) => /cy\.wait\s*\(/.test(text) },
  { name: 'browser.pause', predicate: (text) => /browser\.pause\s*\(/.test(text) },
];
for (const { name, predicate } of waitPatterns) {
  const matching = manualWaits.filter((finding) => predicate(finding.text));
  if (!matching.some((finding) => finding.durationMs !== null)) {
    console.error(`manual-wait fixtures missing parseable duration for ${name}`);
    process.exit(1);
  }
}

// Replaceability analysis: intentional findings must have replaceable field
const intentionalFindings = manualWaits.filter((f) => f.subCase === 'intentional');
const missingReplaceable = intentionalFindings.find((f) => !('replaceable' in f));
if (missingReplaceable) {
  console.error(`manual-wait intentional finding missing replaceable field: ${missingReplaceable.file}:${missingReplaceable.line}`);
  process.exit(1);
}
const replaceableCount = intentionalFindings.filter((f) => f.replaceable === true).length;
const nonReplaceableCount = intentionalFindings.filter((f) => f.replaceable === false).length;
if (replaceableCount < 1) {
  console.error(`manual-wait fixtures need at least 1 replaceable intentional finding (found ${replaceableCount})`);
  process.exit(1);
}
if (nonReplaceableCount < 1) {
  console.error(`manual-wait fixtures need at least 1 non-replaceable intentional finding (found ${nonReplaceableCount})`);
  process.exit(1);
}

const pollingLoopCount = manualWaits.filter((f) => f.pollingLoop === true).length;
if (pollingLoopCount < 1) {
  console.error(`manual-wait fixtures need at least 1 polling-loop finding (found ${pollingLoopCount})`);
  process.exit(1);
}

console.log(
  `Self-check fixtures OK: ${EXPECTED_TAGS.length} rules detected (${report.violationCount} findings), clean samples clean.`,
);

// C# file surface (v0.10.0 item #1): *Tests.cs scanned; helper .cs not test-only
const csharpNoDiFinding = report.findings.find(
  (finding) => /no-di\/LoginTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!csharpNoDiFinding) {
  console.error('C# file surface: expected no-di finding in violations/no-di/LoginTests.cs');
  process.exit(1);
}
if (csharpNoDiFinding.tag !== 'no-di') {
  console.error(`C# file surface: expected no-di on LoginTests.cs, got ${csharpNoDiFinding.tag}`);
  process.exit(1);
}

// v0.12 session 02: xUnit [Fact] construction fires no-di
const csharpFactNoDi = report.findings.find(
  (finding) => /no-di\/FactConstructionTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!csharpFactNoDi || csharpFactNoDi.tag !== 'no-di') {
  console.error('C# no-di Gate 2: expected no-di finding in violations/no-di/FactConstructionTests.cs');
  process.exit(1);
}

const csharpManualWaitFinding = report.findings.find(
  (finding) => /manual-wait\/ThreadSleepTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!csharpManualWaitFinding || csharpManualWaitFinding.tag !== 'manual-wait') {
  console.error('C# manual-wait: expected manual-wait finding in violations/manual-wait/ThreadSleepTests.cs');
  process.exit(1);
}

const networkIdleFinding = report.findings.find(
  (finding) => /manual-wait\/NetworkIdleTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!networkIdleFinding || networkIdleFinding.tag !== 'manual-wait') {
  console.error('C# manual-wait: expected manual-wait finding in violations/manual-wait/NetworkIdleTests.cs');
  process.exit(1);
}

const networkIdleRedundantFinding = report.findings.find(
  (finding) => /manual-wait\/NetworkIdleRedundantTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!networkIdleRedundantFinding || networkIdleRedundantFinding.tag !== 'manual-wait' || networkIdleRedundantFinding.subCase !== 'redundant') {
  console.error('C# manual-wait: expected manual-wait finding with subCase redundant in violations/manual-wait/NetworkIdleRedundantTests.cs');
  process.exit(1);
}

// v0.12 session 07: C# rule parity (no-teardown, bare-test-fail, test-fail-order)
const csharpNoTeardown = report.findings.find(
  (finding) => /no-teardown\/NoCleanupTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!csharpNoTeardown || csharpNoTeardown.tag !== 'no-teardown') {
  console.error('C# no-teardown: expected no-teardown finding in violations/no-teardown/NoCleanupTests.cs');
  process.exit(1);
}

const csharpBareAssertFail = report.findings.find(
  (finding) => /bare-test-fail\/BareAssertFailTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!csharpBareAssertFail || csharpBareAssertFail.tag !== 'bare-test-fail') {
  console.error('C# bare-test-fail: expected bare-test-fail finding in violations/bare-test-fail/BareAssertFailTests.cs');
  process.exit(1);
}

const csharpAssertBeforeFail = report.findings.find(
  (finding) => /test-fail-order\/AssertBeforeFailTests\.cs$/i.test(finding.file.replace(/\\/g, '/')),
);
if (!csharpAssertBeforeFail || csharpAssertBeforeFail.tag !== 'test-fail-order') {
  console.error('C# test-fail-order: expected test-fail-order finding in violations/test-fail-order/AssertBeforeFailTests.cs');
  process.exit(1);
}

const csharpCases = [
  { path: 'Tests/LoginTests.cs', expectTest: true },
  { path: 'Tests/LoginTest.cs', expectTest: true },
  { path: 'login.spec.cs', expectTest: true },
  { path: 'login.test.cs', expectTest: true },
  { path: 'Support/LoginHelper.cs', expectTest: false },
  { path: 'Pages/LoginPage.cs', expectTest: false },
  { path: 'Pages/Locators/LoginLocators.cs', expectTest: false },
];
for (const { path: samplePath, expectTest } of csharpCases) {
  const matched = TEST_FILE_RE.test(samplePath);
  if (matched !== expectTest) {
    console.error(
      `C# TEST_FILE_RE: ${samplePath} expected test=${expectTest}, got ${matched}`,
    );
    process.exit(1);
  }
}

// v0.12 session 09: MobileBy selector-leak fix hint mentions AppiumBy
const mobileByFinding = report.findings.find(
  (finding) => /MobileByLoginActions\.cs$/i.test(finding.file.replace(/\\/g, '/')) && finding.tag === 'selector-leak',
);
if (!mobileByFinding) {
  console.error('MobileBy selector-leak: expected selector-leak finding in violations/selector-leak/pages/actions/MobileByLoginActions.cs');
  process.exit(1);
}
if (!/AppiumBy/.test(mobileByFinding.fix || '')) {
  console.error('MobileBy selector-leak: fix hint must mention AppiumBy');
  console.error(`  got fix: ${mobileByFinding.fix}`);
  process.exit(1);
}

// v0.12 session 09: ImplicitWait fires manual-wait
const implicitWaitFinding = report.findings.find(
  (finding) => /manual-wait\/ImplicitWaitTests\.cs$/i.test(finding.file.replace(/\\/g, '/')) && finding.tag === 'manual-wait',
);
if (!implicitWaitFinding) {
  console.error('ImplicitWait manual-wait: expected manual-wait finding in violations/manual-wait/ImplicitWaitTests.cs');
  process.exit(1);
}
if (!implicitWaitFinding.implicitWait) {
  console.error('ImplicitWait manual-wait: finding must have implicitWait flag');
  process.exit(1);
}

const diffRoot = path.join(root, 'fixtures', 'self-check', 'diff', 'assert-drop');
for (const entry of fs.readdirSync(diffRoot, { withFileTypes: true }).filter((item) => item.isDirectory())) {
  const caseDir = path.join(diffRoot, entry.name);
  const meta = JSON.parse(fs.readFileSync(path.join(caseDir, 'meta.json'), 'utf8'));
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', 'review.js'), path.join(caseDir, 'before.spec.ts'), path.join(caseDir, 'after.spec.ts'), '--json'],
    { encoding: 'utf8' },
  );
  if (![0, 1].includes(result.status)) {
    console.error(`Diff fixture ${entry.name} failed to run:\n${result.stderr}`);
    process.exit(1);
  }
  const findings = JSON.parse(result.stdout).findings;
  const expected = meta.expectedFindings || [];
  if (findings.length !== expected.length || expected.some((item) =>
    !findings.some((finding) => finding.subCase === item.subCase && finding.line === item.line && finding.file.endsWith(item.file)))) {
    console.error(`Diff fixture ${entry.name} findings do not match meta.json`);
    process.exit(1);
  }
}

if (!REVIEW_RULES.some((rule) => rule.id === 'assert-drop')) {
  console.error('REVIEW_RULES missing assert-drop');
  process.exit(1);
}
