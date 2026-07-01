#!/usr/bin/env node
// gavel — resolve automation test areas to application repo search paths

const fs = require('fs');
const path = require('path');

function loadAreaMap(mapPath) {
  if (!mapPath) {
    return null;
  }
  const resolved = path.resolve(mapPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Area map not found: ${resolved}`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

function normalizeArea(area) {
  return String(area).replace(/\\/g, '/').replace(/\/+$/, '');
}

function findMapEntry(area, areaMap) {
  if (!areaMap) {
    return null;
  }

  const normalized = normalizeArea(area);
  if (areaMap[normalized]) {
    return areaMap[normalized];
  }

  const keys = Object.keys(areaMap).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (normalized === key || normalized.startsWith(`${key}/`)) {
      return areaMap[key];
    }
  }

  return null;
}

function defaultAppGlob(area) {
  const normalized = normalizeArea(area);
  const segment = normalized.split('/').filter(Boolean).pop() || normalized;
  return `**/*${segment}*`;
}

function resolveAppSearchPaths(area, areaMap) {
  const entry = findMapEntry(area, areaMap);
  if (!entry) {
    return { paths: [defaultAppGlob(area)], source: 'heuristic' };
  }

  if (Array.isArray(entry)) {
    return { paths: entry, source: 'area-map' };
  }

  if (typeof entry === 'string') {
    return { paths: [entry], source: 'area-map' };
  }

  const paths = entry.appPaths || (entry.appRepoGlob ? [entry.appRepoGlob] : []);
  if (paths.length === 0) {
    return { paths: [defaultAppGlob(area)], source: 'heuristic-fallback' };
  }

  return { paths, source: 'area-map' };
}

module.exports = { loadAreaMap, resolveAppSearchPaths, findMapEntry, defaultAppGlob };
