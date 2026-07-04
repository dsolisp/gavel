#!/usr/bin/env node
// gavel — parse CI report, cluster failures, optional commit correlation
//
// Usage:
//   node scripts/analyze-ci.js <report-path> [--app-repo path] [--area-map path] [--commits 15] [--json] [--envelope] [--json-envelope]
//   node scripts/analyze-ci.js playwright-report/ --envelope --project MySuite
//   node scripts/parsers/junit.js results.xml --json | node scripts/analyze-ci.js --json

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseReport } = require('./parsers/index');
const { clusterFailures } = require('./cluster-failures');
const { loadAreaMap, resolveAppSearchPaths } = require('./area-map');
const { formatCiAnalysisEnvelope, buildJsonEnvelope } = require('./ci-analysis-envelope');

function parseArgs(argv) {
  const jsonOutput = argv.includes('--json');
  const envelopeOutput = argv.includes('--envelope');
  const jsonEnvelopeOutput = argv.includes('--json-envelope');
  const flagValues = new Set(['--app-repo', '--commits', '--area-map', '--project']);
  const appRepoIdx = argv.indexOf('--app-repo');
  const commitsIdx = argv.indexOf('--commits');
  const areaMapIdx = argv.indexOf('--area-map');
  const projectIdx = argv.indexOf('--project');
  const inputPath = argv.find(
    (arg, index) => !arg.startsWith('--') && !flagValues.has(argv[index - 1]),
  );

  return {
    inputPath,
    jsonOutput,
    envelopeOutput,
    jsonEnvelopeOutput,
    project: projectIdx >= 0 ? argv[projectIdx + 1] : 'automation-suite',
    appRepo: appRepoIdx >= 0 ? argv[appRepoIdx + 1] : null,
    areaMapPath: areaMapIdx >= 0 ? argv[areaMapIdx + 1] : null,
    commitLimit: commitsIdx >= 0 ? Number(argv[commitsIdx + 1]) : 15,
  };
}

function readReport(inputPath) {
  if (inputPath) {
    return parseReport(inputPath);
  }
  return JSON.parse(fs.readFileSync(0, 'utf8'));
}

function correlateCommits(appRepo, area, limit, areaMap) {
  if (!appRepo || !fs.existsSync(appRepo)) {
    return { commits: [], mapping: null };
  }

  const mapping = resolveAppSearchPaths(area, areaMap);
  const seen = new Set();
  const commits = [];

  for (const searchPath of mapping.paths) {
    try {
      const output = execSync(
        `git -C "${appRepo}" log -${limit} --oneline -- "${searchPath}"`,
        { encoding: 'utf8' },
      );
      for (const line of output.trim().split('\n').filter(Boolean)) {
        const space = line.indexOf(' ');
        const hash = space > 0 ? line.slice(0, space) : line;
        if (seen.has(hash)) {
          continue;
        }
        seen.add(hash);
        commits.push({
          hash,
          message: space > 0 ? line.slice(space + 1) : '',
          searchPath,
        });
      }
    } catch {
      // path may not exist in app repo — try next mapped path
    }
  }

  return { commits, mapping };
}

function classifyCluster(pattern, count) {
  if (pattern === 'locator-timeout' && count >= 3) {
    return 'test-maintenance-drift';
  }
  if (pattern === 'locator-timeout') {
    return 'flake';
  }
  if (pattern === 'env' || pattern === 'auth') {
    return 'env';
  }
  if (pattern === 'assertion-mismatch') {
    return 'investigate';
  }
  if (pattern === 'app-error') {
    return 'app-regression';
  }
  if (pattern === 'seed') {
    return 'seed';
  }
  if (pattern === 'flake') {
    return 'flake';
  }
  return 'inconclusive';
}

function buildAnalysis(report, options) {
  const clusters = clusterFailures(report).map((cluster) => {
    const classification = classifyCluster(cluster.pattern, cluster.count);
    const correlation = options.appRepo
      ? correlateCommits(options.appRepo, cluster.area, options.commitLimit, options.areaMap)
      : { commits: [], mapping: null };

    return {
      area: cluster.area,
      pattern: cluster.pattern,
      count: cluster.count,
      tests: cluster.tests.slice(0, 10),
      classification,
      appSearchPaths: correlation.mapping?.paths || [],
      mappingSource: correlation.mapping?.source || null,
      suspectCommits: correlation.commits,
      nextAction:
        classification === 'test-maintenance-drift'
          ? 'gavel-impact → gavel-healer'
          : classification === 'env'
            ? 'gavel-env'
            : classification === 'seed'
              ? 'gavel-env (seed verification)'
              : classification === 'app-regression'
                ? 'gavel-bug (confirm + report)'
                : classification === 'flake'
                  ? 'gavel-flake (triage)'
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
    areaMapLoaded: Boolean(options.areaMap),
    note: options.appRepo
      ? options.areaMap
        ? 'Suspect commits auto-correlated per cluster using area-map paths.'
        : 'Suspect commits auto-correlated per cluster by area keyword heuristic. Pass --area-map for accuracy.'
      : 'Pass --app-repo to enable commit correlation (gavel-impact).',
  };
}

function main() {
  const { inputPath, jsonOutput, envelopeOutput, jsonEnvelopeOutput, project, appRepo, areaMapPath, commitLimit } =
    parseArgs(process.argv.slice(2));
  const report = readReport(inputPath);
  report.passRate =
    report.total > 0 ? Number(((report.passed / report.total) * 100).toFixed(1)) : 0;

  const areaMap = areaMapPath ? loadAreaMap(areaMapPath) : null;
  const analysis = buildAnalysis(report, {
    appRepo: appRepo ? path.resolve(appRepo) : null,
    areaMap,
    commitLimit,
  });

  if (envelopeOutput) {
    console.log(formatCiAnalysisEnvelope(analysis, { project }));
    return;
  }

  if (jsonEnvelopeOutput) {
    console.log(JSON.stringify(buildJsonEnvelope(analysis, { project }), null, 2));
    return;
  }

  if (jsonOutput) {
    console.log(JSON.stringify(analysis, null, 2));
    return;
  }

  console.log(`CI analysis — pass rate ${analysis.summary.passRate}% (${analysis.summary.failed} failed)`);
  for (const cluster of analysis.clusters) {
    console.log(
      `- ${cluster.area} [${cluster.pattern}] x${cluster.count} → ${cluster.classification}`,
    );
    if (cluster.appSearchPaths.length > 0) {
      console.log(`  app paths: ${cluster.appSearchPaths.join(', ')} (${cluster.mappingSource})`);
    }
    if (cluster.suspectCommits.length > 0) {
      console.log(
        `  suspect: ${cluster.suspectCommits[0].hash} ${cluster.suspectCommits[0].message}`,
      );
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildAnalysis, correlateCommits, classifyCluster, formatCiAnalysisEnvelope };
