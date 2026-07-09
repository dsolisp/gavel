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
const { buildSuiteHealthSummary } = require('../suite-health');
const { resolveGavelConfig } = require('../load-gavel-config');
const { validateEnvelope, schema: envelopeSchema } = require('../validate-envelope');

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

test('package publishes unified gavel bins and config schema', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of ['gavel', 'gavel-audit', 'gavel-review', 'gavel-self-check', 'gavel-analyze', 'gavel-affected-tests', 'gavel-detect']) {
    assert.equal(pkg.bin[name], './scripts/cli.js');
  }
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas/gavel-config.schema.json'), 'utf8'));
  assert.ok(schema.properties.failThreshold.enum.includes('warning'));
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
  fs.symlinkSync(path.join(root, 'scripts/cli.js'), alias);
  const aliasResult = spawnSync(alias, ['fixtures/self-check/clean', '--json'], { cwd: root, encoding: 'utf8' });
  assert.equal(aliasResult.status, 0);
});

test('unified CLI core commands run', () => {
  assert.equal(runCli(['review', 'fixtures/self-check/clean', '--json']).status, 0);
  assert.equal(runCli(['detect', '.', '--json']).status, 0);
  assert.equal(runCli(['affected-tests', 'fixtures/affected-tests', '--tag', 'smoke', '--json']).status, 0);
  assert.equal(runCli(['analyze', 'fixtures/reports/junit/sample-failures.xml', '--json']).status, 0);
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
