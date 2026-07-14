#!/usr/bin/env node
// gavel — verify area-map generation and validation

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { validateAreaMap } = require('./validate-area-map');
const { generateAreaMap } = require('./generate-area-map');

const root = path.join(__dirname, '..');
let failures = 0;

function assert(condition, label) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

// --- Existing fixture tests (validation) ---

const valid = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/validate-area-map.js'), path.join(root, 'fixtures/config/area-map.example.json')],
  { encoding: 'utf8' },
);
assert(valid.status === 0, 'valid area-map example passes validation');

const invalidErrors = validateAreaMap(
  JSON.parse(fs.readFileSync(path.join(root, 'fixtures/config/area-map.invalid.json'), 'utf8')),
);
assert(invalidErrors.length > 0, 'invalid area-map fixture produces errors');

// --- Overrides validation ---

const overrideErrors = validateAreaMap({
  'tests/e2e/catalog': { appPaths: ['src/catalog'] },
  _overrides: {
    exclude: ['tests/e2e/legacy/**'],
    rename: { 'tests/e2e/old': 'tests/e2e/new' },
    criticality: { 'tests/e2e/catalog': 'high' },
  },
});
assert(overrideErrors.length === 0, `overrides with valid structure passes: got ${JSON.stringify(overrideErrors)}`);

const badOverrideErrors = validateAreaMap({
  'tests/e2e/catalog': { appPaths: ['src/catalog'] },
  _overrides: { criticality: { 'tests/e2e/catalog': 'super-high' } },
});
assert(badOverrideErrors.some((e) => e.includes('criticality')), 'bad criticality value rejected');

// --- Generation from mock repo ---

function makeTmpRepo(structure) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-area-map-'));
  for (const [filePath, content] of Object.entries(structure)) {
    const full = path.join(tmp, filePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content || '');
  }
  return tmp;
}

// Mock repo: tests/e2e/catalog + tests/e2e/users + tests/api/orders + features/billing
const mockRepo = makeTmpRepo({
  'tests/e2e/catalog/search.spec.ts': `import { CatalogService } from '../../src/features/catalog/service';\n`,
  'tests/e2e/catalog/list.spec.ts': `import { CatalogService } from '../../src/features/catalog/service';\n`,
  'tests/e2e/users/profile.spec.ts': `import { UserService } from '../../src/features/users/service';\n`,
  'tests/api/orders/create.spec.ts': '',
  'tests/api/orders/list.spec.ts': '',
  'features/billing/invoice.feature.ts': '',
});

const generated = generateAreaMap(mockRepo);

assert(generated['tests/e2e/catalog'] !== undefined, 'tests/e2e/catalog area generated');
assert(generated['tests/e2e/users'] !== undefined, 'tests/e2e/users area generated');
assert(generated['tests/api/orders'] !== undefined, 'tests/api/orders area generated');
assert(generated['features/billing'] !== undefined, 'features/billing area generated');

// catalog specs import src/features/catalog → appPaths populated
const catalogPaths = generated['tests/e2e/catalog'].appPaths;
assert(Array.isArray(catalogPaths) && catalogPaths.some((p) => p.includes('catalog')),
  `catalog appPaths derived from imports: ${JSON.stringify(catalogPaths)}`);

// orders specs have no imports → fallback glob
assert(generated['tests/api/orders'].appRepoGlob !== undefined,
  'orders area falls back to appRepoGlob when no imports');

// Generation is deterministic: same input → same output
const generated2 = generateAreaMap(mockRepo);
assert(JSON.stringify(generated) === JSON.stringify(generated2), 'generation is deterministic');

// --- Overrides applied during generation ---

const withOverrides = generateAreaMap(mockRepo, {
  exclude: ['tests/api/orders/**'],
  criticality: { 'tests/e2e/catalog': 'high' },
});
assert(withOverrides['tests/api/orders'] === undefined, 'exclude override removes orders area');
assert(withOverrides['tests/e2e/catalog'].criticality === 'high', 'criticality override applied');
assert(withOverrides._overrides !== undefined, '_overrides section preserved in output');
assert(Array.isArray(withOverrides._overrides.exclude), 'exclude list preserved in _overrides');

const renamedMap = generateAreaMap(mockRepo, {
  rename: { 'tests/e2e/users': 'tests/e2e/accounts' },
});
assert(renamedMap['tests/e2e/users'] === undefined, 'rename removes old key');
assert(renamedMap['tests/e2e/accounts'] !== undefined, 'rename adds new key');
assert(renamedMap._overrides.rename['tests/e2e/users'] === 'tests/e2e/accounts', 'rename preserved in _overrides');

// --- Override round-trip: load from existing map, re-generate ---

const mapWithOverrides = {
  'tests/e2e/catalog': { appPaths: ['src/features/catalog'] },
  'tests/e2e/users': { appPaths: ['src/features/users'] },
  _overrides: {
    criticality: { 'tests/e2e/catalog': 'critical' },
  },
};
fs.writeFileSync(path.join(mockRepo, 'gavel-area-map.json'), JSON.stringify(mapWithOverrides));
const roundTrip = generateAreaMap(mockRepo, mapWithOverrides._overrides);
assert(roundTrip['tests/e2e/catalog'].criticality === 'critical', 'round-trip preserves criticality override');

// --- Validate generated output ---

const genErrors = validateAreaMap(generated);
assert(genErrors.length === 0, `generated area-map passes validation: ${JSON.stringify(genErrors)}`);

const overrideGenErrors = validateAreaMap(withOverrides);
assert(overrideGenErrors.length === 0, `generated area-map with overrides passes validation: ${JSON.stringify(overrideGenErrors)}`);

// --- Cleanup ---
fs.rmSync(mockRepo, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log('Area map generation + validation OK.');
