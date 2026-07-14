#!/usr/bin/env node
// gavel — validate result envelopes against schemas/result-envelope.schema.json
// gavel: subset validator (type, required, properties, additionalProperties, items,
// enum, pattern, minimum) — swap for a full JSON Schema library only if the schema outgrows it.

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'result-envelope.schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

function typeOf(value) {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function check(value, node, where, errors) {
  if (node.enum) {
    if (!node.enum.includes(value)) {
      errors.push(`${where}: must be one of ${node.enum.join(', ')}`);
    }
    return;
  }
  if (node.type) {
    const ok = node.type === 'integer' ? Number.isInteger(value) : typeOf(value) === node.type;
    if (!ok) {
      errors.push(`${where}: expected ${node.type}, got ${typeOf(value)}`);
      return;
    }
  }
  if (node.pattern && !new RegExp(node.pattern).test(value)) {
    errors.push(`${where}: does not match ${node.pattern}`);
  }
  if (node.minimum !== undefined && value < node.minimum) {
    errors.push(`${where}: must be >= ${node.minimum}`);
  }
  if (node.type === 'object') {
    for (const key of node.required || []) {
      if (!(key in value)) {
        errors.push(`${where}: missing required field "${key}"`);
      }
    }
    for (const [key, child] of Object.entries(value)) {
      const childNode = (node.properties || {})[key];
      if (!childNode) {
        if (node.additionalProperties === false) {
          errors.push(`${where}: unknown field "${key}"`);
        }
        continue;
      }
      check(child, childNode, `${where}.${key}`, errors);
    }
  }
  if (node.type === 'array' && node.items) {
    value.forEach((item, index) => check(item, node.items, `${where}[${index}]`, errors));
  }
}

function validateEnvelope(envelope) {
  const errors = [];
  check(envelope, schema, 'envelope', errors);
  return errors;
}

module.exports = { validateEnvelope, schema };
