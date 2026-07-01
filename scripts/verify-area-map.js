#!/usr/bin/env node
// gavel — verify area-map validation script

const path = require('path');
const { spawnSync } = require('child_process');
const { validateAreaMap } = require('./validate-area-map');

const root = path.join(__dirname, '..');

const valid = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/validate-area-map.js'), path.join(root, 'fixtures/config/area-map.example.json')],
  { encoding: 'utf8' },
);

if (valid.status !== 0) {
  console.error('Expected valid area-map example to pass.');
  process.exit(1);
}

const invalidErrors = validateAreaMap(
  JSON.parse(require('fs').readFileSync(path.join(root, 'fixtures/config/area-map.invalid.json'), 'utf8')),
);

if (invalidErrors.length === 0) {
  console.error('Expected invalid area-map fixture to produce errors.');
  process.exit(1);
}

console.log('Area map validation OK.');
