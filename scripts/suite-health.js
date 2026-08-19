#!/usr/bin/env node
// gavel — suite health summary and area-impact scoring

const fs = require('fs');
const path = require('path');
const { loadGavelConfig } = require('./load-gavel-config');
const { normalizeArea } = require('./area-map');
const { matchGlob } = require('./glob-match');
const { hasCSharpFiles } = require('./audit-autofix');
const { findMatches } = require('./self-check');

const FAT_POM_EXCLUDED = new Set([
  'node_modules', '.git', 'bin', 'obj', 'packages', '.vs',
  'dist', 'build', 'coverage', 'playwright-report', 'test-results',
  'allure-results', 'allure-report', '.next', '.nuxt', 'out',
  '.venv', 'venv', 'venv-enhanced', '.venv-ci',
  '.claude', '.qoder', '.cursor', '.vscode',
]);

const POM_PATH_RE = /(?:^|\/)(?:pages?|page-objects?)\//i;
const POM_BASENAME_RE = /Page\.cs$/;
const LOCATOR_DIR_RE = /locators?\//i;
const LOCATOR_SIGNAL_RE = /\bILocator\b|\bGetByRole\b|\bGetByText\b|\bGetByLabel\b|\bGetByTestId\b|\.Locator\s*\(|\bFindElement\b|\bAppiumBy\.[A-Za-z]|\bMobileBy\.[A-Za-z]/g;
const ACTION_SIGNAL_RE = /\.Click\s*\(|ClickAsync\s*\(|\.Fill\s*\(|FillAsync\s*\(|GotoAsync\s*\(|\bNavigate\w*\s*\(|\bSendKeys\s*\(|\bTap\s*\(|TypeAsync\s*\(/g;

function isFatPomExcluded(dirName) {
  return FAT_POM_EXCLUDED.has(dirName);
}

function countFatPomFiles(repoRoot) {
  let count = 0;
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (isFatPomExcluded(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx|js|jsx|py|java|cs)$/.test(entry.name)) continue;
      const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
      if (LOCATOR_DIR_RE.test(rel)) continue;
      if (!POM_PATH_RE.test(rel) && !POM_BASENAME_RE.test(entry.name)) continue;
      const content = fs.readFileSync(full, 'utf8');
      const hasLocator = findMatches(content, LOCATOR_SIGNAL_RE, rel).length > 0;
      const hasAction = findMatches(content, ACTION_SIGNAL_RE, rel).length > 0;
      if (hasLocator && hasAction) count += 1;
    }
  }
  walk(repoRoot);
  return count;
}

function areaForFile(filePath, areaMap) {
  if (!filePath) {
    return null;
  }
  const normalized = normalizeArea(filePath);
  if (!areaMap) {
    const segment = normalized.split('/').slice(0, 2).join('/');
    return segment || normalized;
  }
  const keys = Object.keys(areaMap).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (normalized === key || normalized.startsWith(`${key}/`)) {
      return key;
    }
  }
  return normalized.split('/').slice(0, 2).join('/') || normalized;
}

function isCriticalArea(area, config) {
  const critical = [
    ...(config.criticalAreas || []),
    ...(config.criticalTags || []),
  ].map(normalizeArea);

  if (!area) {
    return false;
  }
  return critical.some((entry) => area === entry || area.startsWith(`${entry}/`));
}

function loadAreaMapFromConfig(repoRoot, config) {
  if (config.areaMap && typeof config.areaMap === 'object') {
    return config.areaMap;
  }

  const mapPath = path.join(repoRoot, 'gavel-area-map.json');
  if (fs.existsSync(mapPath)) {
    return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  }

  return null;
}

function resolvePathCategory(filePath, paths = []) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return { label: null, weight: 1 };
  }
  const normalized = (filePath || '').replace(/\\/g, '/');
  const ordered = [...paths].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const entry of ordered) {
    if (matchGlob(normalized, entry.pattern)) {
      return { label: entry.label, weight: entry.weight };
    }
  }
  return { label: 'default', weight: 1 };
}

function scoreFinding(finding, repoRoot, config = loadGavelConfig(repoRoot)) {
  const areaMap = loadAreaMapFromConfig(repoRoot, config);
  const area = areaForFile(finding.file, areaMap);
  const critical = isCriticalArea(area, config);
  const severityRank = { blocker: 0, fix: 1, cleanup: 2, delete: 3 };
  const base = severityRank[finding.severity] ?? 5;
  const { label: pathLabel, weight: pathWeight } = resolvePathCategory(finding.file, config.paths);
  return {
    ...finding,
    area,
    impactScore: base - (critical ? 2 : 0),
    critical,
    pathLabel,
    pathWeight,
  };
}

function buildSuiteHealthSummary(
  autofixFindings,
  selfCheckFindings,
  repoRoot,
  config = loadGavelConfig(repoRoot),
  excludedFileCount = 0,
) {
  const byTag = {};
  const byArea = {};
  const byLabel = {};
  let criticalCount = 0;
  let weightedViolations = 0;
  const hasPaths = Array.isArray(config.paths) && config.paths.length > 0;

  const all = [...autofixFindings, ...selfCheckFindings].map((finding) =>
    scoreFinding(finding, repoRoot, config),
  );

  for (const finding of all) {
    byTag[finding.tag] = (byTag[finding.tag] || 0) + 1;
    const area = finding.area || 'unknown';
    byArea[area] = (byArea[area] || 0) + 1;
    if (finding.critical) {
      criticalCount += 1;
    }
    weightedViolations += finding.pathWeight;
    if (hasPaths && finding.pathLabel) {
      if (!byLabel[finding.pathLabel]) {
        byLabel[finding.pathLabel] = { raw: 0, weighted: 0 };
      }
      byLabel[finding.pathLabel].raw += 1;
      byLabel[finding.pathLabel].weighted += finding.pathWeight;
    }
  }

  const csharp = hasCSharpFiles(repoRoot);
  const deadPomsCount = autofixFindings.filter((item) => item.tag === 'dead-pom').length;
  const deadLocatorsCount = autofixFindings.filter((item) => item.tag === 'dead-locator').length;
  const unusedFactoriesCount = autofixFindings.filter((item) => item.tag === 'unused-factory').length;

  const summary = {
    deadPoms: csharp ? null : deadPomsCount,
    deadLocators: csharp ? null : deadLocatorsCount,
    unusedFactories: csharp ? null : unusedFactoriesCount,
    deadCodeStatus: csharp ? 'n/a (csharp)' : undefined,
    leakFiles: new Set(selfCheckFindings.filter((item) => item.tag === 'selector-leak').map((item) => item.file)).size,
    fatPomFiles: countFatPomFiles(repoRoot),
    selectorLeaks: selfCheckFindings.filter((item) => item.tag === 'selector-leak').length,
    manualWaits: selfCheckFindings.filter((item) => item.tag === 'manual-wait').length,
    skipMarkers: selfCheckFindings.filter((item) => item.tag === 'skip-marker').length,
    bareTestFail: selfCheckFindings.filter((item) => item.tag === 'bare-test-fail').length,
    constitutionViolations: selfCheckFindings.length,
    safeAutofixCandidates: csharp ? null : autofixFindings.length,
    safeAutofixStatus: csharp ? 'n/a (csharp)' : undefined,
    criticalAreaViolations: criticalCount,
    excludedFileCount,
    rawViolations: all.length,
    weightedViolations,
    byTag,
    byArea,
    byLabel,
    scoredFindings: all.sort((a, b) => a.impactScore - b.impactScore),
  };

  return summary;
}

function fmtDeadCode(value) {
  return value === null ? 'n/a (csharp)' : String(value);
}

function formatSuiteHealth(summary) {
  const lines = [
    'Suite health:',
    `  Dead POMs: ${fmtDeadCode(summary.deadPoms)}`,
    `  Dead locators: ${fmtDeadCode(summary.deadLocators)}`,
    `  Unused factories: ${fmtDeadCode(summary.unusedFactories)}`,
    `  Selector leaks: ${summary.selectorLeaks}`,
    `  Fat POM files: ${summary.fatPomFiles}`,
    `  Leak files: ${summary.leakFiles}`,
    `  Manual waits: ${summary.manualWaits}`,
    `  Skip/quarantine markers: ${summary.skipMarkers}`,
    `  Bare test.fail markers: ${summary.bareTestFail}`,
    `  Constitution violations: ${summary.constitutionViolations}`,
    `  Critical-area violations: ${summary.criticalAreaViolations}`,
    `  Safe autofix candidates: ${fmtDeadCode(summary.safeAutofixCandidates)}`,
    `  Excluded files: ${summary.excludedFileCount ?? 0}`,
  ];

  if (summary.freshness && summary.freshness.detected && summary.freshness.status !== 'fresh') {
    lines.push(`  Profile freshness: ${summary.freshness.package} ${summary.freshness.installed} < pin ${summary.freshness.profileCurrent} (${summary.freshness.status})`);
  }

  if (summary.packageMismatch) {
    const entries = Object.entries(summary.packageMismatch.packages);
    const parts = entries.map(([pkg, ver]) => `${pkg} ${ver}`);
    lines.push(`  Package mismatch: ${parts.join(' vs ')} (mixed Microsoft.Playwright* versions in ${summary.packageMismatch.file})`);
  }

  const topAreas = Object.entries(summary.byArea)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topAreas.length > 0) {
    lines.push('  Top areas:');
    for (const [area, count] of topAreas) {
      lines.push(`    ${area}: ${count}`);
    }
  }

  const labels = Object.entries(summary.byLabel || {});
  if (labels.length > 0) {
    lines.push(`  Weighted violations: ${summary.weightedViolations} (raw: ${summary.rawViolations})`);
    lines.push('  By path category:');
    labels
      .sort((a, b) => b[1].weighted - a[1].weighted)
      .forEach(([label, counts]) => {
        lines.push(`    ${label}: ${counts.raw} raw → ${counts.weighted} weighted`);
      });
  }

  return lines.join('\n');
}

module.exports = {
  areaForFile,
  buildSuiteHealthSummary,
  formatSuiteHealth,
  isCriticalArea,
  resolvePathCategory,
  scoreFinding,
};
