#!/usr/bin/env node
// gavel — validate gavel-baseline.json against schemas/gavel-baseline.schema.json
// Usage:
//   node scripts/verify-baseline-schema.js              # golden fixtures
//   node scripts/verify-baseline-schema.js <file.json>  # single file (exit 0/1)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const schema = JSON.parse(
  fs.readFileSync(path.join(root, 'schemas', 'gavel-baseline.schema.json'), 'utf8'),
);

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function check(value, node, where, errors) {
  if (node.enum) {
    if (!node.enum.includes(value)) errors.push(`${where}: must be one of ${node.enum.join(', ')}`);
    return;
  }
  if (node.type) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    const actual = typeOf(value);
    const ok = types.some((t) => (t === 'integer' ? Number.isInteger(value) : actual === t));
    if (!ok) {
      errors.push(`${where}: expected ${types.join('|')}, got ${actual}`);
      return;
    }
  }
  if (node.pattern && typeof value === 'string' && !new RegExp(node.pattern).test(value)) {
    errors.push(`${where}: must match ${node.pattern}`);
  }
  if (node.minLength !== undefined && typeof value === 'string' && value.length < node.minLength) {
    errors.push(`${where}: must be at least ${node.minLength} characters`);
  }
  if (node.minimum !== undefined && typeof value === 'number' && value < node.minimum) {
    errors.push(`${where}: must be >= ${node.minimum}`);
  }
  if (node.maximum !== undefined && typeof value === 'number' && value > node.maximum) {
    errors.push(`${where}: must be <= ${node.maximum}`);
  }
  if (typeOf(value) === 'object' && node.type === 'object') {
    for (const key of node.required || []) {
      if (!(key in value)) errors.push(`${where}: missing required field "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      const childNode = (node.properties || {})[key];
      if (!childNode) {
        if (node.additionalProperties === false) errors.push(`${where}: unknown field "${key}"`);
        continue;
      }
      check(child, childNode, `${where}.${key}`, errors);
    }
  }
  if (node.type === 'array' && node.items && Array.isArray(value)) {
    value.forEach((item, index) => check(item, node.items, `${where}[${index}]`, errors));
  }
}

function validateBaseline(doc) {
  const errors = [];
  check(doc, schema, 'baseline', errors);
  return errors;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main(argv) {
  const fileArg = argv.find((arg) => !arg.startsWith('-'));
  if (fileArg) {
    const target = path.resolve(fileArg);
    const errors = validateBaseline(readJson(target));
    if (errors.length) {
      console.error(`${path.relative(root, target) || target} invalid:\n  ${errors.join('\n  ')}`);
      process.exit(1);
    }
    console.log(`${path.relative(root, target) || target}: OK`);
    process.exit(0);
  }

  const fixturesDir = path.join(root, 'fixtures', 'baseline');
  const validPath = path.join(fixturesDir, 'valid.json');
  const invalidPath = path.join(fixturesDir, 'invalid-missing-field.json');

  const validErrors = validateBaseline(readJson(validPath));
  if (validErrors.length) {
    console.error(`fixtures/baseline/valid.json should pass:\n  ${validErrors.join('\n  ')}`);
    process.exit(1);
  }

  const invalidErrors = validateBaseline(readJson(invalidPath));
  if (!invalidErrors.length) {
    console.error('fixtures/baseline/invalid-missing-field.json should fail schema validation');
    process.exit(1);
  }
  if (!invalidErrors.some((e) => e.includes('snippetHash'))) {
    console.error(
      `invalid fixture should report missing snippetHash, got:\n  ${invalidErrors.join('\n  ')}`,
    );
    process.exit(1);
  }

  console.log('Baseline schema OK: valid accepted, invalid rejected.');
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { validateBaseline };
