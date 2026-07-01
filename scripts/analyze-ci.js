#!/usr/bin/env node
// gavel — parse CI report, cluster failures, optional commit correlation
//
// Usage:
//   node scripts/analyze-ci.js <report-path> [--app-repo path] [--commits 15] [--json]
//   node scripts/parsers/junit.js results.xml --json | node scripts/analyze-ci.js --json

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseReport } = require('./parsers/index');
const { clusterFailures } = require('./cluster-failures');

function parseArgs(argv) {
  const jsonOutput = argv.includes('--json');
  const appRepoIdx = argv.indexOf('--app-repo');
  const commitsIdx = argv.indexOf('--commits');
  const inputPath = argv.find(
    (arg, index) =>
      !arg.startsWith('--') &&
      (index === 0 || !['--app-repo', '--commits'].includes(argv[index - 1])),
  );

  return {
    inputPath,
    jsonOutput,
    appRepo: appRepoIdx >= 0 ? argv[appRepoIdx + 1] : null,
    commitLimit: commitsIdx >= 0 ? Number(argv[commitsIdx + 1]) : 15,
  };
}

function readReport(inputPath) {
  if (inputPath) {
    return parseReport(inputPath);
  }
  return JSON.parse(fs.readFileSync(0, 'utf8'));
}

function areaToAppGlob(area) {
  const normalized = String(area).replace(/\\/g, '/');
  const segment = normalized.split('/').filter(Boolean).pop() || normalized;
  return `**/*${segment}*`;
}

function correlateCommits(appRepo, area, limit) {
  if (!appRepo || !fs.existsSync(appRepo)) {
    return [];
  }

  const glob = areaToAppGlob(area);
  try {
    const output = execSync(`git -C "${appRepo}" log -${limit} --oneline -- "${glob}"`, {
      encoding: 'utf8',
    });
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const space = line.indexOf(' ');
        return {
          hash: space > 0 ? line.slice(0, space) : line,
          message: space > 0 ? line.slice(space + 1) : '',
        };
      });
  } catch {
    return [];
  }
}

function classifyCluster(pattern, count) {
  if (pattern === 'locator-timeout' && count >= 3) {
    return 'test-maintenance-drift';
  }
  if (pattern === 'env') {
    return 'env';
  }
  if (pattern === 'auth') {
    return 'env';
  }
  if (pattern === 'assertion-mismatch') {
    return 'investigate';
  }
  return 'inconclusive';
}

function buildAnalysis(report, options) {
  const clusters = clusterFailures(report).map((cluster) => {
    const classification = classifyCluster(cluster.pattern, cluster.count);
    const suspectCommits =
      classification === 'test-maintenance-drift'
        ? correlateCommits(options.appRepo, cluster.area, options.commitLimit)
        : [];

    return {
      area: cluster.area,
      pattern: cluster.pattern,
      count: cluster.count,
      tests: cluster.tests.slice(0, 10),
      classification,
      suspectCommits,
      nextAction:
        classification === 'test-maintenance-drift'
          ? 'gavel-impact → gavel-healer'
          : classification === 'env'
            ? 'gavel-env'
            : 'gavel-heal',
    };
  });

  return {
    summary: {
      format: report.format,
      total: report.total,
      failed: report.failed,
      passRate: report.passRate,
    },
    clusters,
    impactReady: Boolean(options.appRepo),
    note: options.appRepo
      ? 'Suspect commits searched in application repo by area keyword.'
      : 'Pass --app-repo to enable commit correlation (gavel-impact).',
  };
}

function main() {
  const { inputPath, jsonOutput, appRepo, commitLimit } = parseArgs(process.argv.slice(2));
  const report = readReport(inputPath);
  report.passRate =
    report.total > 0 ? Number(((report.passed / report.total) * 100).toFixed(1)) : 0;

  const analysis = buildAnalysis(report, {
    appRepo: appRepo ? path.resolve(appRepo) : null,
    commitLimit,
  });

  if (jsonOutput) {
    console.log(JSON.stringify(analysis, null, 2));
    return;
  }

  console.log(`CI analysis — pass rate ${analysis.summary.passRate}% (${analysis.summary.failed} failed)`);
  for (const cluster of analysis.clusters) {
    console.log(
      `- ${cluster.area} [${cluster.pattern}] x${cluster.count} → ${cluster.classification}`,
    );
    if (cluster.suspectCommits.length > 0) {
      console.log(`  suspect: ${cluster.suspectCommits[0].hash} ${cluster.suspectCommits[0].message}`);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildAnalysis, correlateCommits, areaToAppGlob };
