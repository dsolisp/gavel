const fs = require('fs');
const path = require('path');
const { validateSchema } = require('./json-schema-validator');

const schema = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'schemas', 'azure-devops-pr-review.schema.json'),
  'utf8',
));

function safeRelativePath(file) {
  const normalized = file.replace(/\\/g, '/');
  return normalized === path.posix.normalize(normalized)
    && !path.posix.isAbsolute(normalized)
    && normalized !== '..'
    && !normalized.startsWith('../');
}

function intersectsChangedLine(finding, changedLines) {
  const lines = changedLines[finding.file];
  if (!lines) return false;
  return lines.some((line) => line >= finding.startLine && line <= finding.endLine);
}

function validateReview(review, options = {}) {
  const errors = validateSchema(review, schema, 'review');
  if (errors.length > 0) return errors;
  if (options.expectedCommit && review.reviewedCommit.toLowerCase() !== options.expectedCommit.toLowerCase()) {
    errors.push('review.reviewedCommit: does not match the current PR commit');
  }

  const ids = new Set();
  for (const [index, finding] of review.findings.entries()) {
    const where = `review.findings[${index}]`;
    if (!safeRelativePath(finding.file)) errors.push(`${where}.file: unsafe repository path`);
    if (finding.endLine < finding.startLine) errors.push(`${where}: endLine must be >= startLine`);
    if (ids.has(finding.id)) errors.push(`${where}.id: duplicate finding id`);
    ids.add(finding.id);
    if (options.changedLines && !intersectsChangedLine(finding, options.changedLines)) {
      errors.push(`${where}: finding does not intersect the pull request delta`);
    }
  }
  return errors;
}

module.exports = { schema, safeRelativePath, validateReview };