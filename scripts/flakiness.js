#!/usr/bin/env node
// gavel — flakiness scoring from CI history (roadmap v0.11.0 #10)
//
// Turns retry counts and pass/fail flips into a per-test flakiness score the
// gavel-flake / gavel-gain agents consume via the `gavel flakiness` CLI to rank
// the worst offenders instead of guessing. Report-only; not wired into
// suite-health.js and scores nothing to a merge gate.
//
// A test is flaky when it produced more than one attempt with a mixed outcome
// (at least one failed attempt and at least one pass), or was rerun by the
// framework. score = failedAttempts / totalAttempts (0..1).
//
// Supports:
//   - Playwright JSON reporter  (test.results[] with per-retry status)
//   - JUnit / Surefire XML       (flakyFailure/rerunFailure + duplicate testcases)
//
// Usage:
//   node scripts/flakiness.js <report.json|report.xml> [--json]

const fs = require('fs');
const path = require('path');

function scoreOutcome(attempts, failures, eventualPass) {
  // Flaky == mixed outcome: retried at least once with both a failed and a
  // non-failed attempt. A test that fails every attempt is a real failure that
  // happened to be retried, not flake.
  const flaky = attempts > 1 && failures > 0 && failures < attempts;
  const score = attempts > 0 ? Number((failures / attempts).toFixed(3)) : 0;
  return { attempts, failures, retries: Math.max(0, attempts - 1), flaky, eventualPass, score };
}

// --- Playwright JSON --------------------------------------------------------

function collectPlaywrightTests(node, inheritedFile, out) {
  const file = node.file || inheritedFile || '';
  for (const spec of node.specs || []) {
    const specFile = spec.file || file;
    for (const test of spec.tests || []) {
      out.push({
        test: spec.title || test.title || 'unknown-test',
        file: specFile,
        results: test.results || [],
      });
    }
  }
  for (const child of node.suites || []) {
    collectPlaywrightTests(child, file, out);
  }
  return out;
}

function scorePlaywright(report) {
  const raw = collectPlaywrightTests({ suites: report.suites || [] }, '', []);
  const tests = raw.map(({ test, file, results }) => {
    // Skipped attempts are not signal — they neither pass nor fail, so counting
    // them dilutes the score and can mark a skipped+passed pair as flaky.
    const graded = results.filter((r) => r.status && r.status !== 'skipped');
    const attempts = graded.length;
    const failures = graded.filter((r) => r.status !== 'passed').length;
    const eventualPass = attempts > 0 && graded[graded.length - 1].status === 'passed';
    return { test, file, ...scoreOutcome(attempts, failures, eventualPass) };
  });
  return finalize('playwright', tests);
}

// --- JUnit / Surefire XML ---------------------------------------------------

function scoreJUnit(xml) {
  const groups = new Map(); // key -> { test, file, attempts, failures }
  // Match self-closing testcases separately from paired ones. A single `[^>]*`
  // attr class swallows the `/` of a `/>`, so a self-closing tag would fuse with
  // the *next* `</testcase>` and undercount attempts — the self-closing branch is
  // tried first so `<testcase .../>` is a standalone attempt, not a wrapper.
  const cases = [...xml.matchAll(/<testcase\b([^>]*?)\/>|<testcase\b([^>]*?)>([\s\S]*?)<\/testcase>/g)];
  for (const match of cases) {
    const attrs = match[1] !== undefined ? match[1] : match[2] || '';
    const body = match[3] || '';
    const name = (attrs.match(/\bname="([^"]*)"/) || [])[1] || 'unknown-test';
    const classname = (attrs.match(/classname="([^"]*)"/) || [])[1] || '';
    const file = (attrs.match(/file="([^"]*)"/) || [])[1] || classname;
    const key = `${classname}#${name}`;
    if (!groups.has(key)) {
      groups.set(key, { test: name, file, attempts: 0, failures: 0, retried: false, lastOutcome: null });
    }
    const group = groups.get(key);
    // Surefire retry markers: the test ran multiple times within one testcase.
    const flakyFailures = (body.match(/<flakyFailure\b/g) || []).length;
    const rerunFailures = (body.match(/<rerunFailure\b/g) || []).length;
    const primaryFailed = /<failure\b|<error\b/.test(body);
    const skipped = /<skipped\b/.test(body);

    if (flakyFailures + rerunFailures > 0) {
      group.retried = true;
      // Rerun blocks are prior attempts; the primary result is the final one.
      group.attempts += flakyFailures + rerunFailures + 1;
      group.failures += flakyFailures + rerunFailures + (primaryFailed ? 1 : 0);
      group.lastOutcome = primaryFailed ? 'fail' : 'pass';
    } else if (!skipped) {
      group.attempts += 1;
      if (primaryFailed) group.failures += 1;
      // Duplicate <testcase> blocks are attempts in document order; the last one
      // seen is the final outcome, so eventualPass is derived from result order,
      // not the order-blind failures<attempts (which mislabels pass-then-fail).
      group.lastOutcome = primaryFailed ? 'fail' : 'pass';
    }
    if (groups.size > 1 || group.attempts > 1) group.file = file;
  }

  const tests = [...groups.values()].map(({ test, file, attempts, failures, lastOutcome }) => {
    const eventualPass = lastOutcome ? lastOutcome === 'pass' : failures < attempts;
    return { test, file, ...scoreOutcome(attempts, failures, eventualPass) };
  });
  return finalize('junit', tests);
}

function finalize(format, tests) {
  const scored = tests
    .filter((t) => t.attempts > 0)
    .sort((a, b) => b.score - a.score || b.attempts - a.attempts);
  return {
    format,
    testCount: scored.length,
    flakyCount: scored.filter((t) => t.flaky).length,
    tests: scored,
  };
}

function scoreFlakiness(content) {
  // Strip a UTF-8 BOM before *both* the format sniff and the parse: trimStart()
  // treats U+FEFF as whitespace, so sniffing on a trimmed copy while parsing the
  // raw string threw "Unexpected token" on BOM-prefixed Playwright reports.
  const body = content.replace(/^\uFEFF/, '').trimStart();
  if (body.startsWith('{')) {
    return scorePlaywright(JSON.parse(body));
  }
  // Fail closed on anything that is neither a JSON object nor XML — a JSON array,
  // primitive, or empty input must not be silently sniffed as empty JUnit (exit 0).
  if (!body.startsWith('<')) {
    throw new Error('Unrecognized report: expected a Playwright JSON object ("{...}") or JUnit/Surefire XML ("<...>").');
  }
  return scoreJUnit(body);
}

function formatFlakiness(summary, limit = 10) {
  const lines = [
    `Flakiness (${summary.format}): ${summary.flakyCount} flaky / ${summary.testCount} tests`,
  ];
  for (const test of summary.tests.filter((t) => t.flaky).slice(0, limit)) {
    lines.push(`  ${(test.score * 100).toFixed(0)}%  ${test.test} (${test.file}) — ${test.failures}/${test.attempts} attempts`);
  }
  if (summary.flakyCount === 0) {
    lines.push('  No flaky tests detected.');
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const inputPath = args.find((arg) => !arg.startsWith('--'));

  if (!inputPath) {
    console.error('Usage: node scripts/flakiness.js <report.json|report.xml> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(inputPath);
  let summary;
  try {
    summary = scoreFlakiness(fs.readFileSync(resolved, 'utf8'));
  } catch (err) {
    // Malformed / unrecognized input is a usage error, not a clean report.
    console.error(`flakiness: ${err.message}`);
    process.exit(2);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  console.log(formatFlakiness(summary));
}

if (require.main === module) {
  main();
}

module.exports = { scoreFlakiness, scorePlaywright, scoreJUnit, formatFlakiness };
