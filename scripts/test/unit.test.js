#!/usr/bin/env node
// gavel unit tests — parser, cluster, suite-health

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseJUnitXml } = require('../parsers/junit');
const { clusterFailures } = require('../cluster-failures');
const { buildSuiteHealthSummary, formatSuiteHealth } = require('../suite-health');
const { resolveGavelConfig, validateGavelConfig } = require('../load-gavel-config');
const { validateEnvelope, schema: envelopeSchema } = require('../validate-envelope');
const { toSarif } = require('../to-sarif');

const root = path.join(__dirname, '..', '..');

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/cli.js'), ...args], {
    cwd: options.cwd || root,
    encoding: 'utf8',
  });
}

test('parseJUnitXml reads failure count and file paths', () => {
  const xml = fs.readFileSync(path.join(root, 'fixtures/reports/junit/sample-failures.xml'), 'utf8');
  const result = parseJUnitXml(xml);
  assert.equal(result.failed, 2);
  assert.match(result.failures[0].file, /catalog/);
});

test('clusterFailures groups by area and error pattern', () => {
  const failures = [
    { test: 'export draft', file: 'tests/e2e/catalog/export.spec.ts', message: 'Timeout 30000ms' },
    { test: 'publish export', file: 'tests/e2e/catalog/publish.spec.ts', message: 'Timeout 30000ms' },
  ];
  const clusters = clusterFailures({ failures });
  assert.ok(clusters.length >= 1);
  assert.equal(clusters[0].count, 2);
});

test('buildSuiteHealthSummary counts dead code and constitution tags', () => {
  const autofix = [
    { tag: 'dead-pom', severity: 'delete', autofix: 'safe', file: 'pages/Unused.ts' },
    { tag: 'dead-locator', severity: 'delete', autofix: 'safe', file: 'locators/Unused.ts' },
  ];
  const selfCheck = [
    { tag: 'manual-wait', severity: 'blocker', autofix: 'review', file: 'tests/wait.spec.ts' },
    { tag: 'bare-test-fail', severity: 'fix', autofix: 'review', file: 'tests/fail.spec.ts' },
  ];
  const summary = buildSuiteHealthSummary(autofix, selfCheck, root);
  assert.equal(summary.deadPoms, 1);
  assert.equal(summary.manualWaits, 1);
  assert.equal(summary.bareTestFail, 1);
  assert.equal(summary.rawViolations, 4);
  assert.equal(summary.weightedViolations, 4);
  assert.deepEqual(summary.byLabel, {});
  const formatted = formatSuiteHealth(summary);
  assert.doesNotMatch(formatted, /Weighted violations/);
  assert.doesNotMatch(formatted, /By path category/);
});

test('path weights group findings by label and scale counts', () => {
  const paths = JSON.parse(
    fs.readFileSync(path.join(root, 'fixtures/config/paths-weighting.example.json'), 'utf8'),
  ).paths;
  const legacy = Array.from({ length: 4 }, (_, i) => ({
    tag: 'manual-wait',
    severity: 'blocker',
    autofix: 'review',
    file: `tests/legacy/v1-checkout/case-${i}.spec.ts`,
  }));
  const active = Array.from({ length: 2 }, (_, i) => ({
    tag: 'selector-leak',
    severity: 'fix',
    autofix: 'review',
    file: `tests/e2e/checkout/flow-${i}.spec.ts`,
  }));
  const summary = buildSuiteHealthSummary([], [...legacy, ...active], root, { paths });
  assert.equal(summary.byLabel.legacy.raw, 4);
  assert.equal(summary.byLabel.legacy.weighted, 1);
  assert.equal(summary.byLabel.active.raw, 2);
  assert.equal(summary.byLabel.active.weighted, 2);
  assert.equal(summary.rawViolations, 6);
  assert.equal(summary.weightedViolations, 3);
  const formatted = formatSuiteHealth(summary);
  assert.match(formatted, /Weighted violations: 3 \(raw: 6\)/);
  assert.match(formatted, /legacy: 4 raw → 1 weighted/);
  assert.match(formatted, /active: 2 raw → 2 weighted/);

  assert.throws(
    () => validateGavelConfig({ paths: [{ pattern: 'x/**', label: 'x', weight: 3 }] }),
    /paths\[\]\.weight must be a number between 0 and 2/,
  );
  assert.throws(
    () => validateGavelConfig({ paths: [{ pattern: 'x/**', weight: 1 }] }),
    /paths\[\]\.label must be a non-empty string/,
  );
});

test('gavel config resolution prefers --config, cwd config, package metadata, defaults', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-config-'));
  assert.deepEqual(resolveGavelConfig({ cwd: dir }).config, {});

  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ gavel: { failThreshold: 'off' } }));
  assert.equal(resolveGavelConfig({ cwd: dir }).config.failThreshold, 'off');

  fs.writeFileSync(path.join(dir, 'gavel.config.json'), JSON.stringify({ failThreshold: 'error' }));
  assert.equal(resolveGavelConfig({ cwd: dir }).config.failThreshold, 'error');

  fs.writeFileSync(path.join(dir, 'explicit.json'), JSON.stringify({ failThreshold: 'blocker' }));
  assert.equal(resolveGavelConfig({ cwd: dir, configPath: 'explicit.json' }).config.failThreshold, 'blocker');
});

test('hardcoded-env detects spec values without exposing credentials', () => {
  const violations = runCli(['self-check', 'fixtures/self-check/violations', '--json']);
  const report = JSON.parse(violations.stdout);
  const findings = report.findings.filter((finding) => finding.tag === 'hardcoded-env');

  assert.deepEqual(findings.map((finding) => finding.line), [4, 5, 6, 7, 8, 9, 10]);
  assert.ok(findings.every((finding) => finding.text === 'hardcoded environment value'));
  assert.doesNotMatch(violations.stdout, /do-not-report-this-value/);

  const clean = runCli(['self-check', 'fixtures/self-check/clean', '--json']);
  assert.equal(JSON.parse(clean.stdout).findings.some((finding) => finding.tag === 'hardcoded-env'), false);
});

test('hardcoded-env excludes configured fixture paths and sample repos', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-hardcoded-env-'));
  fs.mkdirSync(path.join(repo, 'tests', 'fixtures'), { recursive: true });
  fs.writeFileSync(
    path.join(repo, 'tests', 'fixtures', 'credentials.spec.ts'),
    'const secret = "fixture-only";\n',
  );
  const configPath = path.join(repo, 'gavel.config.json');
  fs.writeFileSync(configPath, JSON.stringify({ fixturePaths: ['tests/fixtures'] }));

  const configured = runCli(['self-check', repo, '--config', configPath, '--json']);
  assert.equal(JSON.parse(configured.stdout).findings.some((finding) => finding.tag === 'hardcoded-env'), false);

  for (const framework of ['playwright', 'cypress', 'selenium', 'webdriverio']) {
    const sample = runCli(['self-check', `fixtures/sample-repos/${framework}`, '--json']);
    assert.equal(JSON.parse(sample.stdout).findings.some((finding) => finding.tag === 'hardcoded-env'), false);
  }
});

test('no-teardown requires cleanup in the same describe block', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-no-teardown-'));
  const specPath = path.join(repo, 'orders.spec.ts');
  fs.writeFileSync(specPath, [
    "import { test } from '@playwright/test';",
    "test.describe('clean orders', () => {",
    '  test.afterEach(async () => {});',
    '});',
    "test.describe('unclean orders', () => {",
    "  test('creates an order', async ({ request }) => {",
    "    await request.post('/orders', { data: {} });",
    '  });',
    '});',
  ].join('\n'));

  const report = JSON.parse(runCli(['self-check', repo, '--json']).stdout);
  const findings = report.findings.filter((finding) => finding.tag === 'no-teardown');
  assert.deepEqual(findings.map((finding) => finding.line), [7]);
  assert.match(findings[0].text, /misses cross-file fixtures/);
});

test('complex-locator itemizes fragility and honors selector allowlists', () => {
  const violations = JSON.parse(runCli(['self-check', 'fixtures/self-check/violations', '--json']).stdout);
  const findings = violations.findings.filter((finding) => finding.tag === 'complex-locator');
  assert.deepEqual(findings.map((finding) => finding.text), [
    'generated class +3, broad text +2 → 5',
    'XPath axis +3, positional index +2 → 5',
  ]);

  const clean = runCli(['self-check', 'fixtures/self-check/clean', '--json']);
  assert.equal(JSON.parse(clean.stdout).findings.some((finding) => finding.tag === 'complex-locator'), false);
});

test('gavel-review applies assert-drop severities and scoped suppression', () => {
  const diffRoot = 'fixtures/self-check/diff/assert-drop';
  assert.equal(runCli(['review', `${diffRoot}/assertion-deleted/before.spec.ts`, `${diffRoot}/assertion-deleted/after.spec.ts`, '--json']).status, 1);
  assert.equal(runCli(['review', `${diffRoot}/strength-downgrade/before.spec.ts`, `${diffRoot}/strength-downgrade/after.spec.ts`, '--json']).status, 0);

  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-assert-drop-'));
  const before = path.join(repo, 'before.spec.ts');
  const after = path.join(repo, 'after.spec.ts');
  fs.writeFileSync(before, "test('keeps title', () => {\n  expect(value).toBe('ok');\n});\n");
  fs.writeFileSync(after, "test('keeps title', () => {\n  // gavel-ignore: assert-drop — intentional refactor\n});\n");
  assert.equal(runCli(['review', before, after, '--json']).status, 0);
});

test('package publishes unified gavel bins and config schema', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of ['gavel', 'gavel-audit', 'gavel-review', 'gavel-self-check', 'gavel-analyze', 'gavel-affected-tests', 'gavel-detect']) {
    assert.equal(pkg.bin[name], './scripts/cli.js');
  }
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas/gavel-config.schema.json'), 'utf8'));
  assert.ok(schema.properties.failThreshold.enum.includes('warning'));
  assert.equal(schema.properties.fixturePaths.items.type, 'string');
  assert.equal(schema.properties.factoryPaths.items.type, 'string');
  assert.equal(schema.properties.excludePaths.items.type, 'string');
  assert.deepEqual(schema.properties.excludePaths.default, [
    'scripts/**',
    'fixtures/**',
    'tools/**',
    'utility_scripts/**',
  ]);
  assert.deepEqual(schema.properties.paths.items.required, ['pattern', 'weight', 'label']);
  assert.equal(schema.properties.paths.items.properties.weight.minimum, 0);
  assert.equal(schema.properties.paths.items.properties.weight.maximum, 2);
  assert.equal(schema.properties.selectorAllowlist.properties.componentPrefixes.items.type, 'string');
  assert.equal(schema.properties.selectorAllowlist.properties.customElements.type, 'boolean');
});

test('excludePaths skips utility scripts; empty override rescans them', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-exclude-'));
  fs.mkdirSync(path.join(repo, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'pages'), { recursive: true });
  fs.writeFileSync(
    path.join(repo, 'scripts', 'utility.js'),
    'await page.waitForTimeout(1000);\n',
  );
  fs.writeFileSync(
    path.join(repo, 'pages', 'FooPage.ts'),
    'await page.waitForTimeout(1000);\n',
  );

  const defaulted = JSON.parse(runCli(['self-check', repo, '--json']).stdout);
  assert.equal(defaulted.excludedFileCount, 1);
  assert.equal(defaulted.findings.some((finding) => finding.file === 'scripts/utility.js'), false);
  assert.ok(defaulted.findings.some((finding) => finding.tag === 'manual-wait' && finding.file === 'pages/FooPage.ts'));

  const configPath = path.join(repo, 'gavel.config.json');
  fs.writeFileSync(configPath, JSON.stringify({ excludePaths: [] }));
  const overridden = JSON.parse(runCli(['self-check', repo, '--config', configPath, '--json']).stdout);
  assert.equal(overridden.excludedFileCount, 0);
  assert.ok(overridden.findings.some((finding) => finding.tag === 'manual-wait' && finding.file === 'scripts/utility.js'));

  assert.throws(() => validateGavelConfig({ excludePaths: 'scripts/**' }), /excludePaths must be an array of strings/);
});

test('unified CLI exit codes, hidden companion help, and alias path work', () => {
  assert.equal(runCli(['self-check', 'fixtures/self-check/clean', '--json']).status, 0);
  assert.equal(runCli(['self-check', 'fixtures/self-check/violations', '--json']).status, 1);
  assert.equal(runCli(['nope']).status, 2);

  const help = runCli(['--help']);
  assert.equal(help.status, 0);
  assert.doesNotMatch(help.stdout, /companion/);
  assert.match(runCli(['companion', '--help']).stdout, /Companion workflows/);

  const emptyRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-empty-'));
  const audit = runCli(['audit', emptyRepo, '--json']);
  assert.equal(audit.status, 0);
  assert.match(audit.stderr, /gavel\.config\.json/);

  const aliasDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-alias-'));
  const alias = path.join(aliasDir, 'gavel-self-check');
  // Windows without Developer Mode cannot create symlinks (EPERM); skip the alias assertion there.
  try {
    fs.symlinkSync(path.join(root, 'scripts/cli.js'), alias);
  } catch (e) {
    if (e.code === 'EPERM' || e.code === 'ENOSYS') return;
    throw e;
  }
  // Invoke via node so the assertion does not depend on shebang + execute bit
  // (CI still exercises publicCommandName via basename of argv[1] = gavel-self-check).
  const aliasResult = spawnSync(process.execPath, [alias, 'fixtures/self-check/clean', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(aliasResult.status, 0);
});

test('unified CLI core commands run', () => {
  assert.equal(runCli(['review', 'fixtures/self-check/diff/assert-drop/consolidated/before.spec.ts', 'fixtures/self-check/diff/assert-drop/consolidated/after.spec.ts', '--json']).status, 0);
  assert.equal(runCli(['detect', '.', '--json']).status, 0);
  assert.equal(runCli(['affected-tests', 'fixtures/affected-tests', '--tag', 'smoke', '--json']).status, 0);
  assert.equal(runCli(['analyze', 'fixtures/reports/junit/sample-failures.xml', '--json']).status, 0);
});


test('toSarif emits conformant SARIF 2.1.0: rule ids = tags, level mapping, stable fingerprints, no helpUri', () => {
  const findings = [
    { tag: 'no-di', severity: 'blocker', message: 'Direct page object construction', file: 'tests/a.spec.ts', line: 12, snippet: 'new LoginPage()' },
    { tag: 'no-di', severity: 'blocker', message: 'Direct page object construction', file: 'tests/b.spec.ts', line: 3, snippet: 'new HomePage()' },
    { tag: 'dead-locator', severity: 'cleanup', message: 'dead-locator: unusedButton', file: 'locators/Login.ts' },
  ];
  const sarif = toSarif(findings);

  assert.equal(sarif.version, '2.1.0');
  const driver = sarif.runs[0].tool.driver;
  assert.equal(driver.name, 'Gavel');

  const rules = driver.rules;
  assert.deepEqual(rules.map((rule) => rule.id), ['no-di', 'dead-locator']);
  assert.ok(rules.every((rule) => rule.id === rule.name));
  assert.ok(rules.every((rule) => rule.helpUri === undefined));
  // Without registry metadata the rule dictionary stays static (id/name only) —
  // per-finding messages (e.g. 'dead-locator: unusedButton') never leak into it.
  assert.ok(rules.every((rule) => rule.shortDescription === undefined));
  const withMeta = toSarif(findings, { 'dead-locator': { message: 'Unused locator declaration' } });
  const metaRules = withMeta.runs[0].tool.driver.rules;
  assert.equal(metaRules[0].shortDescription, undefined);
  assert.equal(metaRules[1].shortDescription.text, 'Unused locator declaration');
  assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uriBaseId, 'SRCROOT');

  const results = sarif.runs[0].results;
  assert.equal(results.length, 3);
  assert.equal(results[0].ruleId, 'no-di');
  assert.equal(results[0].ruleIndex, 0);
  assert.equal(results[0].level, 'error');
  assert.equal(results[2].level, 'warning');
  assert.equal(results[0].locations[0].physicalLocation.region.startLine, 12);
  assert.equal(results[2].locations[0].physicalLocation.region, undefined);

  const fp = (result) => result.partialFingerprints['gavelSnippetHash/v1'];
  assert.match(fp(results[0]), /^[0-9a-f]{64}$/);
  assert.notEqual(fp(results[0]), fp(results[1]));
  assert.equal(fp(results[0]), fp(toSarif(findings).runs[0].results[0]));
});

test('tag-scoped gavel-ignore suppresses only the named tag; bare ignore is wildcard; gavel-allow works as deprecated alias', () => {
  const result = runCli(['self-check', 'fixtures/self-check/suppression', '--json']);
  const report = JSON.parse(result.stdout);
  const tagsFor = (file) => report.findings.filter((f) => f.file.endsWith(file)).map((f) => f.tag).sort();

  // Same line has both a no-di and a selector-leak violation. Scoping the ignore to
  // `no-di` must not hide the unrelated selector-leak finding on that line.
  assert.deepEqual(tagsFor('tag-scoped.spec.ts'), ['selector-leak']);

  // Bare `gavel-ignore` (no tag) stays a wildcard for back-compat: both tags suppressed,
  // but the bare ignore itself is reported by the `ignore-no-reason` accountability rule.
  assert.deepEqual(tagsFor('bare-wildcard.spec.ts'), ['ignore-no-reason']);

  // Deprecated `gavel-allow: <tag>` alias behaves exactly like scoped `gavel-ignore`.
  assert.deepEqual(tagsFor('deprecated-allow.spec.ts'), ['selector-leak']);

  assert.equal(report.findings.some((f) => f.tag === 'no-di'), false);
});

test('--format sarif produces parseable SARIF for self-check and audit', () => {
  const runScript = (script, args) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { cwd: root, encoding: 'utf8' });
  for (const [script, target] of [['self-check.js', 'fixtures/self-check/violations'], ['audit-report.js', 'fixtures/audit-autofix']]) {
    const run = runScript(script, [target, '--format', 'sarif']);
    assert.ok([0, 1].includes(run.status));
    const sarif = JSON.parse(run.stdout);
    assert.equal(sarif.version, '2.1.0');
    assert.equal(sarif.runs[0].tool.driver.name, 'Gavel');
    assert.ok(sarif.runs[0].results.every((result) => result.ruleId && result.partialFingerprints['gavelSnippetHash/v1']));
  }
  assert.equal(runScript('self-check.js', ['fixtures/self-check/clean', '--format', 'xml']).status, 2);
});

test('result envelope schema examples validate; invalid envelopes report errors', () => {
  assert.ok(envelopeSchema.examples.length >= 2);
  for (const example of envelopeSchema.examples) {
    assert.deepEqual(validateEnvelope(example), []);
  }
  assert.ok(validateEnvelope({}).some((error) => error.includes('missing required field')));
  assert.ok(validateEnvelope({ ...envelopeSchema.examples[0], status: 'MAYBE' }).some((error) => error.includes('status')));

  const bad = JSON.parse(JSON.stringify(envelopeSchema.examples[1]));
  bad.findings[2].confidence = 'certain';
  bad.extra = true;
  const errors = validateEnvelope(bad);
  assert.ok(errors.some((error) => error.includes('confidence')));
  assert.ok(errors.some((error) => error.includes('unknown field "extra"')));
});

test('corpus labels schema accepts valid docs and rejects unknown fields', () => {
  const { validateLabels, GRADUATION, listTagDirs } = require('../verify-corpus-precision');
  assert.equal(GRADUATION['report-to-warning'], 0.9);
  assert.equal(GRADUATION['warning-to-blocker'], 0.95);
  assert.ok(Array.isArray(listTagDirs()));
  assert.ok(listTagDirs().includes('brittle-assert'));

  const valid = {
    schemaVersion: '1.0.0',
    tag: 'brittle-assert',
    samples: [
      {
        file: 'violating/a.spec.ts',
        label: 'violating',
        language: 'ts',
        framework: 'playwright',
        rationale: 'prose equality',
        expectedFindings: [{ line: 4, tag: 'brittle-assert' }],
      },
      {
        file: 'clean/b.py',
        label: 'clean',
        language: 'py',
        framework: 'pytest',
        rationale: 'contains matcher',
      },
    ],
  };
  assert.deepEqual(validateLabels(valid), []);
  assert.ok(validateLabels({}).some((error) => error.includes('missing required field')));
  assert.ok(validateLabels({ ...valid, extra: true }).some((error) => error.includes('unknown field')));
});
