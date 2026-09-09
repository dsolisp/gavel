const crypto = require('crypto');
const { safeRelativePath, validateReview } = require('./pr-review-contract');

const SNAPSHOT_FIELDS = [
  'schemaVersion', 'repositoryId', 'pullRequestId', 'iterationId', 'headSha',
  'inputFingerprint', 'status', 'activeFindings', 'activeDeterministicFindings',
];

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function inputFingerprint({ diff, config, checks }) {
  const input = {
    diff,
    checks: checks.map(({ name, required, status, attributableToPullRequest }) => ({
      name, required, status, attributableToPullRequest,
    })),
    policy: {
      blockingP2: config.blockingP2 === true,
      minimumConfidence: config.minimumConfidence,
      modelProvider: config.model.provider,
    },
  };
  return crypto.createHash('sha256').update(stableJson(input)).digest('hex');
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return ['snapshot must be an object'];
  const errors = [];
  const unknown = Object.keys(snapshot).filter((key) => !SNAPSHOT_FIELDS.includes(key));
  if (unknown.length > 0) errors.push(`snapshot has unknown fields: ${unknown.join(', ')}`);
  if (snapshot.schemaVersion !== '1.1') errors.push('snapshot schemaVersion must be 1.1');
  if (typeof snapshot.repositoryId !== 'string' || !snapshot.repositoryId) errors.push('snapshot repositoryId is required');
  if (typeof snapshot.pullRequestId !== 'string' || !snapshot.pullRequestId) errors.push('snapshot pullRequestId is required');
  if (snapshot.iterationId !== null && (!Number.isInteger(snapshot.iterationId) || snapshot.iterationId < 1)) {
    errors.push('snapshot iterationId must be null or a positive integer');
  }
  if (!/^[0-9a-f]{40}$/i.test(snapshot.headSha || '')) errors.push('snapshot headSha must be a 40-character SHA');
  if (!/^[0-9a-f]{64}$/i.test(snapshot.inputFingerprint || '')) errors.push('snapshot inputFingerprint must be SHA-256');
  if (typeof snapshot.status !== 'string' || !snapshot.status) errors.push('snapshot status is required');
  if (!Array.isArray(snapshot.activeFindings)) errors.push('snapshot activeFindings must be an array');
  if (!Array.isArray(snapshot.activeDeterministicFindings)) errors.push('snapshot activeDeterministicFindings must be an array');
  if (errors.length === 0) {
    errors.push(...validateReview({
      schemaVersion: '1.0', reviewedCommit: snapshot.headSha, verdict: snapshot.status,
      summary: 'Snapshot validation.', confidence: 1, findings: snapshot.activeFindings,
      missingContext: [], checksConsidered: [],
    }, { expectedCommit: snapshot.headSha }).map((error) => `snapshot activeFindings: ${error}`));
    for (const [index, finding] of snapshot.activeDeterministicFindings.entries()) {
      if (!finding || typeof finding !== 'object') errors.push(`snapshot activeDeterministicFindings[${index}] must be an object`);
      else {
        if (typeof finding.file !== 'string' || !safeRelativePath(finding.file)) {
          errors.push(`snapshot activeDeterministicFindings[${index}].file is unsafe`);
        }
        if (!Number.isInteger(finding.line) || finding.line < 1) {
          errors.push(`snapshot activeDeterministicFindings[${index}].line must be a positive integer`);
        }
      }
    }
  }
  return errors;
}

function createSnapshot({ context, iteration, head, diff, config, checks, review, deterministicFindings = [] }) {
  return {
    schemaVersion: '1.1',
    repositoryId: context.repositoryId,
    pullRequestId: String(context.pullRequestId),
    iterationId: iteration.iterationId || null,
    headSha: head,
    inputFingerprint: inputFingerprint({ diff, config, checks }),
    status: review.verdict,
    activeFindings: review.findings,
    activeDeterministicFindings: deterministicFindings,
  };
}

function isDuplicateSnapshot(snapshot, input) {
  if (validateSnapshot(snapshot).length > 0 || snapshot.status === 'REVIEW_FAILED') return false;
  return snapshot.repositoryId === input.context.repositoryId
    && snapshot.pullRequestId === String(input.context.pullRequestId)
    && snapshot.iterationId === (input.iteration.iterationId || null)
    && snapshot.headSha === input.head
    && snapshot.inputFingerprint === inputFingerprint(input);
}

module.exports = { createSnapshot, inputFingerprint, isDuplicateSnapshot, stableJson, validateSnapshot };