#!/usr/bin/env node
// gavel — before/after refactor score (line count + violation delta)

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function countLines(repoRoot, globs = ['**/*.{ts,tsx,js,jsx}']) {
  const EXCLUDED = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
  let total = 0;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (EXCLUDED.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        total += fs.readFileSync(fullPath, 'utf8').split('\n').length;
      }
    }
  }

  walk(path.resolve(repoRoot));
  return total;
}

function runSelfCheck(repoRoot) {
  const script = path.join(__dirname, 'self-check.js');
  const result = spawnSync(process.execPath, [script, repoRoot, '--json'], {
    encoding: 'utf8',
  });
  if (!result.stdout) {
    return { violationCount: 0, summary: {} };
  }
  return JSON.parse(result.stdout);
}

function main() {
  const args = process.argv.slice(2);
  const beforePath = args.find((arg) => arg.startsWith('--before='))?.slice('--before='.length);
  const repoRoot = args.find((arg) => !arg.startsWith('--'));

  if (!repoRoot) {
    console.error('Usage: node scripts/refactor-score.js <target-repo-root> [--before=<snapshot.json>]');
    process.exit(2);
  }

  const resolved = path.resolve(repoRoot);
  const after = runSelfCheck(resolved);
  const linesAfter = countLines(resolved);

  let before = beforePath && fs.existsSync(beforePath) ? JSON.parse(fs.readFileSync(beforePath, 'utf8')) : null;

  if (!before) {
    before = { violationCount: after.violationCount, lines: linesAfter, summary: after.summary };
  }

  const lineDelta = linesAfter - (before.lines ?? linesAfter);
  const violationDelta = after.violationCount - (before.violationCount ?? after.violationCount);

  const report = {
    repo: resolved,
    linesBefore: before.lines ?? linesAfter,
    linesAfter,
    lineDelta,
    violationsBefore: before.violationCount ?? after.violationCount,
    violationsAfter: after.violationCount,
    violationDelta,
    summaryBefore: before.summary ?? {},
    summaryAfter: after.summary ?? {},
  };

  console.log('Refactor score:');
  console.log(`  Lines: ${report.linesBefore} → ${report.linesAfter} (${lineDelta >= 0 ? '+' : ''}${lineDelta})`);
  console.log(
    `  Violations: ${report.violationsBefore} → ${report.violationsAfter} (${violationDelta >= 0 ? '+' : ''}${violationDelta})`,
  );

  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  }

  process.exit(violationDelta > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { countLines, runSelfCheck };
