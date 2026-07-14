#!/usr/bin/env node
// gavel — generate gavel-area-map.json deterministically from directory structure
//
// Usage:
//   node scripts/generate-area-map.js [repo-root] [--output <path>]
//
// The area map groups test spec files by directory prefix.
// Directory prefix is the primary grouping key.
// Spec imports add secondary aliases only when unambiguous.
// Manual overrides (exclude, rename, criticality) replace generated entries by path glob.
// Generation never reads tickets, product docs, or live routes.

const fs = require('fs');
const path = require('path');

const TEST_DIRS = ['tests', 'specs', 'e2e', 'features'];
const SPEC_EXT_RE = /\.(spec|test|feature)\.(js|ts|jsx|tsx|py|java|cs|rb)$/;
const IMPORT_RE = /(?:import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
const SKIP_DIRS = new Set(['node_modules', '__pycache__', '.git', '.next', 'dist', 'build']);

function walkSpecs(dir, root) {
  const entries = [];
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return entries; }
  for (const item of items) {
    if (SKIP_DIRS.has(item.name) || item.name.startsWith('.')) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) entries.push(...walkSpecs(full, root));
    else if (SPEC_EXT_RE.test(item.name)) entries.push(path.relative(root, full).replace(/\\/g, '/'));
  }
  return entries;
}

function areaKey(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const dir = normalized.split('/').slice(0, -1).join('/');
  // tests/e2e/catalog/search.spec.ts → tests/e2e/catalog
  // features/billing/invoice.feature.ts → features/billing
  return dir || normalized;
}

function extractImports(filePath, root) {
  let content;
  try { content = fs.readFileSync(path.join(root, filePath), 'utf8'); } catch { return []; }
  const imports = [];
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(content)) !== null) {
    const raw = m[1] || m[2];
    if (raw && raw.startsWith('.')) {
      const specDir = path.dirname(path.join(root, filePath));
      const resolved = path.relative(root, path.resolve(specDir, raw)).replace(/\\/g, '/');
      imports.push(resolved.replace(/\.[^/]+$/, ''));
    }
  }
  return imports;
}

function appPathsFromImports(specFiles, root) {
  // Collect all resolved import targets per area, deduplicated and sorted.
  const importCounts = {};
  for (const spec of specFiles) {
    const imports = extractImports(spec, root);
    for (const imp of imports) {
      importCounts[imp] = (importCounts[imp] || 0) + 1;
    }
  }
  // Return sorted app paths for deterministic output.
  return Object.keys(importCounts).sort();
}

function generateAreaMap(repoRoot, overrides = {}) {
  const absRoot = path.resolve(repoRoot);

  // 1. Collect spec files grouped by area key (directory prefix).
  const groups = {};
  for (const testDir of TEST_DIRS) {
    const absDir = path.join(absRoot, testDir);
    if (!fs.existsSync(absDir)) continue;
    for (const spec of walkSpecs(absDir, absRoot)) {
      const key = areaKey(spec);
      if (!groups[key]) groups[key] = [];
      groups[key].push(spec);
    }
  }

  // 2. Build area map: primary grouping from directory prefix, app paths from spec imports.
  const areaMap = {};
  for (const key of Object.keys(groups).sort()) {
    const appPaths = appPathsFromImports(groups[key], absRoot);
    const lastSeg = key.split('/').pop();
    areaMap[key] = appPaths.length > 0
      ? { appPaths }
      : { appRepoGlob: `**/*${lastSeg}*` };
  }

  // 3. Apply overrides: exclude, rename, criticality.
  const exclude = (overrides.exclude || []);
  const rename = overrides.rename || {};
  const criticality = overrides.criticality || {};

  // Exclude entries matching any glob (simple prefix match for v1).
  for (const glob of exclude) {
    const prefix = glob.replace(/\/\*\*$/, '').replace(/\*$/, '');
    for (const key of Object.keys(areaMap)) {
      if (key === prefix || key.startsWith(prefix + '/')) delete areaMap[key];
    }
  }

  // Rename entries (key swap).
  for (const [from, to] of Object.entries(rename)) {
    if (areaMap[from]) {
      areaMap[to] = areaMap[from];
      delete areaMap[from];
    }
  }

  // Apply criticality metadata to entries.
  for (const [key, level] of Object.entries(criticality)) {
    if (areaMap[key]) {
      areaMap[key].criticality = level;
    }
  }

  // 4. Attach overrides section for round-trip fidelity.
  const result = {};
  for (const key of Object.keys(areaMap).sort()) {
    result[key] = areaMap[key];
  }
  if (exclude.length || Object.keys(rename).length || Object.keys(criticality).length) {
    result._overrides = {};
    if (exclude.length) result._overrides.exclude = exclude;
    if (Object.keys(rename).length) result._overrides.rename = rename;
    if (Object.keys(criticality).length) result._overrides.criticality = criticality;
  }

  return result;
}

function loadExistingOverrides(areaMapPath) {
  if (!areaMapPath || !fs.existsSync(areaMapPath)) return {};
  try {
    const existing = JSON.parse(fs.readFileSync(areaMapPath, 'utf8'));
    return existing._overrides || {};
  } catch { return {}; }
}

function main() {
  const argv = process.argv.slice(2);
  let repoRoot = '.';
  let outputPath = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--output' || argv[i] === '-o') {
      outputPath = argv[++i];
    } else if (!argv[i].startsWith('-')) {
      repoRoot = argv[i];
    }
  }

  const absRoot = path.resolve(repoRoot);
  const existingMapPath = path.join(absRoot, 'gavel-area-map.json');
  const overrides = loadExistingOverrides(existingMapPath);
  const result = generateAreaMap(absRoot, overrides);
  const json = JSON.stringify(result, null, 2) + '\n';

  if (outputPath) {
    fs.writeFileSync(path.resolve(outputPath), json);
    console.error(`Area map written: ${outputPath} (${Object.keys(result).filter(k => k !== '_overrides').length} areas).`);
  } else {
    process.stdout.write(json);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateAreaMap, areaKey, walkSpecs };
