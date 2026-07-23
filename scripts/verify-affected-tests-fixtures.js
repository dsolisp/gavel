#!/usr/bin/env node
// gavel — verify affected-tests tag discovery fixtures

const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function runJson(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  return JSON.parse(result.stdout);
}

const fixtureRoot = path.join(root, 'fixtures', 'affected-tests');

// Test 1: --tag smoke with auto-detect should find both fixture files
const smokeAuto = runJson(process.execPath, [
  path.join(root, 'scripts/affected-tests.js'),
  fixtureRoot,
  '--tag', 'smoke',
  '--json',
]);

if (smokeAuto.affectedSpecs.length < 1) {
  console.error('Tag discovery @smoke (auto) did not find any specs.');
  process.exit(1);
}

// Test 2: --tag smoke --tag-framework pytest should find only the Python file
// (real pytest naming: test_login.py — not the old contrived "sample.test.py")
const smokePytest = runJson(process.execPath, [
  path.join(root, 'scripts/affected-tests.js'),
  fixtureRoot,
  '--tag', 'smoke',
  '--tag-framework', 'pytest',
  '--json',
]);

const hasPyFile = smokePytest.affectedSpecs.some((f) => f.endsWith('.py'));
const hasTsFile = smokePytest.affectedSpecs.some((f) => f.endsWith('.ts'));
if (!hasPyFile) {
  console.error('Tag discovery @smoke --tag-framework pytest did not find test_login.py.');
  process.exit(1);
}
if (hasTsFile) {
  console.error('Tag discovery @smoke --tag-framework pytest should not find .ts file.');
  process.exit(1);
}
if (!smokePytest.recommendedCommand.startsWith('pytest ')) {
  console.error('Tag discovery @smoke --tag-framework pytest should recommend pytest command.');
  process.exit(1);
}

// Test 3: --tag regression should find the Playwright file
const regressionAuto = runJson(process.execPath, [
  path.join(root, 'scripts/affected-tests.js'),
  fixtureRoot,
  '--tag', 'regression',
  '--json',
]);

if (regressionAuto.affectedSpecs.length < 1) {
  console.error('Tag discovery @regression did not find any specs.');
  process.exit(1);
}

// Test 4: extract-tags standalone should return tag map
const tagMap = runJson(process.execPath, [
  path.join(root, 'scripts/extract-tags.js'),
  fixtureRoot,
  '--json',
]);

if (!tagMap.smoke || tagMap.smoke.length < 1) {
  console.error('extract-tags did not find @smoke tag.');
  process.exit(1);
}

// Test 5: real-world file naming must be discovered, not just `.spec./.test.`
// literal naming. This is the regression guard for the v0.5.0 tag-discovery gap.
const hasJUnitFile = tagMap.smoke.some((f) => f.endsWith('LoginTest.java'));
if (!hasJUnitFile) {
  console.error('extract-tags did not find @Tag("smoke") in LoginTest.java (JUnit naming).');
  process.exit(1);
}

const hasPytestFile = tagMap.smoke.some((f) => f.endsWith('test_login.py'));
if (!hasPytestFile) {
  console.error('extract-tags did not find @pytest.mark.smoke in test_login.py (pytest naming).');
  process.exit(1);
}

const hasFeatureFile = tagMap.smoke.some((f) => f.endsWith('login.feature'));
if (!hasFeatureFile) {
  console.error('extract-tags did not find @smoke in login.feature (bare Cucumber naming, auto-detected).');
  process.exit(1);
}

if (!tagMap['ci.fast'] || !tagMap['ci.fast'].some((f) => f.endsWith('LoginTest.java'))) {
  console.error('extract-tags did not find dotted JUnit tag @Tag("ci.fast").');
  process.exit(1);
}

if (!tagMap['ci.fast'].some((f) => f.endsWith('login.feature'))) {
  console.error('extract-tags did not find dotted Cucumber tag on a multi-tag line.');
  process.exit(1);
}

if (!tagMap['e2e-smoke'] || !tagMap['e2e-smoke'].some((f) => f.endsWith('LoginTest.java'))) {
  console.error('extract-tags did not find hyphenated JUnit tag @Tag("e2e-smoke").');
  process.exit(1);
}

if (!tagMap['e2e-smoke'].some((f) => f.endsWith('login.feature'))) {
  console.error('extract-tags did not find hyphenated Cucumber tag on a multi-tag line.');
  process.exit(1);
}

// SpecFlow/Reqnroll: a .feature paired with a thin [Binding] Steps.cs. Its @tags
// are discovered via the same cucumber pattern (contract: dotnet-ecosystem-v0.10.0
// extract-tags table). Steps.cs is a binding, not a spec, so it is not a tag source.
if (!tagMap['checkout-smoke'] || !tagMap['checkout-smoke'].some((f) => f.endsWith('Checkout.feature'))) {
  console.error('extract-tags did not find @checkout-smoke in Checkout.feature (SpecFlow/Reqnroll naming).');
  process.exit(1);
}

if (!tagMap['payments.regression'] || !tagMap['payments.regression'].some((f) => f.endsWith('Checkout.feature'))) {
  console.error('extract-tags did not find dotted SpecFlow tag @payments.regression in Checkout.feature.');
  process.exit(1);
}

const hasNunitFile = tagMap.smoke.some((f) => f.endsWith('LoginTests.cs'));
if (!hasNunitFile) {
  console.error('extract-tags did not find [Category("smoke")] in LoginTests.cs (NUnit naming).');
  process.exit(1);
}

if (!tagMap['ci.fast'].some((f) => f.endsWith('LoginTests.cs'))) {
  console.error('extract-tags did not find dotted NUnit tag [Category("ci.fast")].');
  process.exit(1);
}

if (!tagMap['e2e-smoke'].some((f) => f.endsWith('LoginTests.cs'))) {
  console.error('extract-tags did not find hyphenated NUnit tag [Category("e2e-smoke")].');
  process.exit(1);
}

// Test 6: --tag smoke --tag-framework nunit should find only the C# file
const smokeNunit = runJson(process.execPath, [
  path.join(root, 'scripts/affected-tests.js'),
  fixtureRoot,
  '--tag', 'smoke',
  '--tag-framework', 'nunit',
  '--json',
]);

const hasCsFile = smokeNunit.affectedSpecs.some((f) => f.endsWith('.cs'));
if (!hasCsFile) {
  console.error('Tag discovery @smoke --tag-framework nunit did not find LoginTests.cs.');
  process.exit(1);
}
if (smokeNunit.affectedSpecs.some((f) => f.endsWith('.ts') || f.endsWith('.py') || f.endsWith('.java'))) {
  console.error('Tag discovery @smoke --tag-framework nunit should not find non-.cs files.');
  process.exit(1);
}
if (!smokeNunit.recommendedCommand.startsWith('dotnet test')) {
  console.error('Tag discovery @smoke --tag-framework nunit should recommend dotnet test command.');
  process.exit(1);
}

console.log(
  'Affected-tests tag fixtures OK: smoke (auto), smoke (pytest), smoke (nunit), regression, extract-tags, ' +
    'real-world naming (test_*.py, *Test.java, *Tests.cs, *.feature), dotted/hyphenated tags, multi-tag lines, ' +
    'SpecFlow/Reqnroll (.feature + Steps.cs).',
);
