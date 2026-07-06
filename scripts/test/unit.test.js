#!/usr/bin/env node
// gavel unit tests — parser, cluster, suite-health

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parseJUnitXml } = require('../parsers/junit');
const { clusterFailures } = require('../cluster-failures');
const { buildSuiteHealthSummary } = require('../suite-health');

const root = path.join(__dirname, '..', '..');

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
