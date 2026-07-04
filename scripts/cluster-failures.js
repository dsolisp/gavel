#!/usr/bin/env node
// gavel — cluster parsed CI failures by area and error pattern
//
// Usage:
//   node scripts/cluster-failures.js <parsed-report.json>
//   node scripts/parsers/junit.js results.xml --json | node scripts/cluster-failures.js

const fs = require('fs');

function readInput() {
  if (process.argv[2]) {
    return JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  }
  return JSON.parse(fs.readFileSync(0, 'utf8'));
}

function areaFromFailure(failure) {
  const file = failure.file || failure.test || '';
  const parts = String(file).replace(/\\/g, '/').split('/');
  const testsIdx = parts.findIndex((part) =>
    ['tests', 'specs', 'e2e', 'features'].includes(part),
  );
  if (testsIdx >= 0 && parts[testsIdx + 1]) {
    return parts.slice(testsIdx, testsIdx + 2).join('/');
  }
  return failure.area || failure.suite || 'unknown';
}

function errorPattern(message) {
  const text = String(message || '').toLowerCase();
  if (text.includes('seed') || text.includes('fixture data') ||
      text.includes('test data not found') || text.includes('seed data missing')) {
    return 'seed';
  }
  // Web-first assertions (Playwright, Cypress) legitimately say "retrying" in
  // their own timeout messages — e.g. "expect(locator).toBeVisible() failed,
  // retrying" or Cypress "Timed out retrying after 4000ms". Bare "retry" is
  // not a flake signal on its own; require explicit flake vocabulary instead.
  if (text.includes('flaky') || text.includes('intermittent') || text.includes('race condition')) {
    return 'flake';
  }
  if (text.includes('expected') && text.includes('received')) {
    return 'assertion-mismatch';
  }
  if (text.includes('timeout') || text.includes('timed out') ||
      text.includes('not found') || text.includes('not attached')) {
    return 'locator-timeout';
  }
  if (text.includes('5xx') || text.includes('status code 5') ||
      text.includes('stack trace') || /\bunhandled\b/.test(text)) {
    return 'app-error';
  }
  if (text.includes('401') || text.includes('403') || text.includes('unauthorized')) {
    return 'auth';
  }
  if (text.includes('econnrefused') || text.includes('502') || text.includes('503') || text.includes('connection refused')) {
    return 'env';
  }
  return 'other';
}

function clusterFailures(report) {
  const clusters = new Map();

  for (const failure of report.failures || []) {
    const area = areaFromFailure(failure);
    const pattern = errorPattern(failure.message);
    const key = `${area}::${pattern}`;
    if (!clusters.has(key)) {
      clusters.set(key, { area, pattern, count: 0, tests: [] });
    }
    const cluster = clusters.get(key);
    cluster.count += 1;
    cluster.tests.push(failure.test || failure.file || 'unknown');
  }

  return [...clusters.values()].sort((a, b) => b.count - a.count);
}

function suggestAction(pattern, count) {
  if (pattern === 'locator-timeout' && count >= 3) {
    return 'test-maintenance-drift → gavel-impact → gavel-healer';
  }
  if (pattern === 'locator-timeout') {
    return 'flake → gavel-flake (single timeout)';
  }
  if (pattern === 'auth') {
    return 'env or fixture auth → gavel-env / gavel-auth';
  }
  if (pattern === 'env') {
    return 'ENV ISSUE → gavel-env';
  }
  if (pattern === 'assertion-mismatch') {
    return 'app vs test divergence → gavel-heal';
  }
  if (pattern === 'app-error') {
    return 'APP BUG SUSPECTED → gavel-bug (confirm + report)';
  }
  if (pattern === 'seed') {
    return 'SEED ISSUE → gavel-env (seed verification)';
  }
  if (pattern === 'flake') {
    return 'FLAKE → gavel-flake (triage)';
  }
  return 'review individually → gavel-heal';
}

function main() {
  const report = readInput();
  const clusters = clusterFailures(report);

  const output = {
    format: report.format,
    total: report.total,
    failed: report.failed,
    passRate: report.passRate,
    clusters: clusters.map((cluster) => ({
      ...cluster,
      tests: cluster.tests.slice(0, 10),
      action: suggestAction(cluster.pattern, cluster.count),
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { clusterFailures, areaFromFailure, errorPattern };
