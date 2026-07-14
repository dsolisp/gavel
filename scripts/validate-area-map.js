#!/usr/bin/env node
// gavel — validate gavel-area-map.json structure
//
// Usage:
//   node scripts/validate-area-map.js <area-map.json>
//   node scripts/validate-area-map.js  (validates fixtures/config/area-map.example.json)

const fs = require('fs');
const path = require('path');

const AREA_KEY_RE = /^(tests|specs|e2e|features)\//;
const PATH_RE = /^[^\s*?]+$/;
const VALID_CRITICALITY = ['low', 'medium', 'high', 'critical'];

function validateEntry(key, value, errors) {
  if (typeof key !== 'string' || !AREA_KEY_RE.test(key.replace(/\\/g, '/'))) {
    errors.push(`Key must start with tests/, specs/, e2e/, or features/: ${key}`);
  }

  if (typeof value === 'string') {
    if (!PATH_RE.test(value)) {
      errors.push(`Invalid path for ${key}: ${value}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      errors.push(`Empty path array for ${key}`);
    }
    for (const item of value) {
      if (typeof item !== 'string' || !PATH_RE.test(item)) {
        errors.push(`Invalid path in array for ${key}: ${item}`);
      }
    }
    return;
  }

  if (value && typeof value === 'object') {
    const paths = value.appPaths || [];
    const glob = value.appRepoGlob;
    if (glob && typeof glob !== 'string') {
      errors.push(`appRepoGlob must be a string for ${key}`);
    }
    if (!glob && paths.length === 0) {
      errors.push(`Entry ${key} needs appPaths or appRepoGlob`);
    }
    for (const item of paths) {
      if (typeof item !== 'string' || !PATH_RE.test(item)) {
        errors.push(`Invalid appPaths entry for ${key}: ${item}`);
      }
    }
    return;
  }

  errors.push(`Invalid entry type for ${key}`);
}

function validateOverrides(overrides, errors) {
  if (overrides && typeof overrides !== 'object') {
    errors.push('_overrides must be an object');
    return;
  }
  if (overrides.exclude !== undefined) {
    if (!Array.isArray(overrides.exclude) || overrides.exclude.some((v) => typeof v !== 'string')) {
      errors.push('_overrides.exclude must be an array of strings');
    }
  }
  if (overrides.rename !== undefined) {
    if (!overrides.rename || typeof overrides.rename !== 'object' || Array.isArray(overrides.rename)) {
      errors.push('_overrides.rename must be an object');
    } else {
      for (const [from, to] of Object.entries(overrides.rename)) {
        if (typeof to !== 'string') errors.push(`_overrides.rename["${from}"] must be a string`);
      }
    }
  }
  if (overrides.criticality !== undefined) {
    if (!overrides.criticality || typeof overrides.criticality !== 'object' || Array.isArray(overrides.criticality)) {
      errors.push('_overrides.criticality must be an object');
    } else {
      for (const [key, level] of Object.entries(overrides.criticality)) {
        if (!VALID_CRITICALITY.includes(level)) {
          errors.push(`_overrides.criticality["${key}"] must be one of: ${VALID_CRITICALITY.join(', ')}`);
        }
      }
    }
  }
}

function validateAreaMap(map) {
  const errors = [];

  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    return ['Area map must be a JSON object'];
  }

  const keys = Object.keys(map);
  if (keys.length === 0) {
    errors.push('Area map is empty');
  }

  for (const key of keys) {
    if (key === '_overrides') {
      validateOverrides(map[key], errors);
      continue;
    }
    validateEntry(key, map[key], errors);
  }

  return errors;
}

function main() {
  const arg = process.argv[2];
  const target = arg
    ? path.resolve(arg)
    : path.join(__dirname, '..', 'fixtures', 'config', 'area-map.example.json');

  if (!fs.existsSync(target)) {
    console.error(`Area map not found: ${target}`);
    process.exit(2);
  }

  const map = JSON.parse(fs.readFileSync(target, 'utf8'));
  const errors = validateAreaMap(map);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  console.log(`Area map OK: ${target} (${Object.keys(map).length} entries).`);
}

if (require.main === module) {
  main();
}

module.exports = { validateAreaMap };
