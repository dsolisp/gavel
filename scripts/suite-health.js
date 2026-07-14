#!/usr/bin/env node
// gavel — suite health summary and area-impact scoring

const fs = require('fs');
const path = require('path');
const { loadGavelConfig } = require('./load-gavel-config');
const { findMapEntry, normalizeArea } = require('./area-map');

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

function scoreFinding(finding, repoRoot, config = loadGavelConfig(repoRoot)) {
  const areaMap = loadAreaMapFromConfig(repoRoot, config);
  const area = areaForFile(finding.file, areaMap);
  const critical = isCriticalArea(area, config);
  const severityRank = { blocker: 0, fix: 1, cleanup: 2, delete: 3 };
  const base = severityRank[finding.severity] ?? 5;
  return {
    ...finding,
    area,
    impactScore: base - (critical ? 2 : 0),
    critical,
  };
}

function buildSuiteHealthSummary(autofixFindings, selfCheckFindings, repoRoot, config = loadGavelConfig(repoRoot)) {
  const byTag = {};
  const byArea = {};
  let criticalCount = 0;

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
  }

  return {
    deadPoms: autofixFindings.filter((item) => item.tag === 'dead-pom').length,
    deadLocators: autofixFindings.filter((item) => item.tag === 'dead-locator').length,
    unusedFactories: autofixFindings.filter((item) => item.tag === 'unused-factory').length,
    selectorLeaks: selfCheckFindings.filter((item) => item.tag === 'selector-leak').length,
    manualWaits: selfCheckFindings.filter((item) => item.tag === 'manual-wait').length,
    skipMarkers: selfCheckFindings.filter((item) => item.tag === 'skip-marker').length,
    bareTestFail: selfCheckFindings.filter((item) => item.tag === 'bare-test-fail').length,
    constitutionViolations: selfCheckFindings.length,
    safeAutofixCandidates: autofixFindings.length,
    criticalAreaViolations: criticalCount,
    byTag,
    byArea,
    scoredFindings: all.sort((a, b) => a.impactScore - b.impactScore),
  };
}

function formatSuiteHealth(summary) {
  const lines = [
    'Suite health:',
    `  Dead POMs: ${summary.deadPoms}`,
    `  Dead locators: ${summary.deadLocators}`,
    `  Unused factories: ${summary.unusedFactories}`,
    `  Selector leaks: ${summary.selectorLeaks}`,
    `  Manual waits: ${summary.manualWaits}`,
    `  Skip/quarantine markers: ${summary.skipMarkers}`,
    `  Bare test.fail markers: ${summary.bareTestFail}`,
    `  Constitution violations: ${summary.constitutionViolations}`,
    `  Critical-area violations: ${summary.criticalAreaViolations}`,
    `  Safe autofix candidates: ${summary.safeAutofixCandidates}`,
  ];

  const topAreas = Object.entries(summary.byArea)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topAreas.length > 0) {
    lines.push('  Top areas:');
    for (const [area, count] of topAreas) {
      lines.push(`    ${area}: ${count}`);
    }
  }

  return lines.join('\n');
}

module.exports = {
  areaForFile,
  buildSuiteHealthSummary,
  formatSuiteHealth,
  isCriticalArea,
  scoreFinding,
};
