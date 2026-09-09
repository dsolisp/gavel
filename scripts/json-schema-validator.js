function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateNode(value, schema, location, errors) {
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location}: must be one of ${schema.enum.join(', ')}`);
    return;
  }
  if (schema.type) {
    const validType = schema.type === 'integer' ? Number.isInteger(value) : valueType(value) === schema.type;
    if (!validType) {
      errors.push(`${location}: expected ${schema.type}, got ${valueType(value)}`);
      return;
    }
  }
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${location}: invalid format`);
  if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${location}: must be >= ${schema.minimum}`);
  if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${location}: must be <= ${schema.maximum}`);
  if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location}: too short`);
  if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${location}: too long`);
  if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${location}: too many items`);

  if (schema.type === 'object') {
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${location}: missing required field "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      const childSchema = (schema.properties || {})[key];
      if (!childSchema) {
        if (schema.additionalProperties === false) errors.push(`${location}: unknown field "${key}"`);
      } else validateNode(child, childSchema, `${location}.${key}`, errors);
    }
  }
  if (schema.type === 'array' && schema.items) {
    value.forEach((item, index) => validateNode(item, schema.items, `${location}[${index}]`, errors));
  }
}

function validateSchema(value, schema, root = 'value') {
  const errors = [];
  validateNode(value, schema, root, errors);
  return errors;
}

module.exports = { validateSchema };