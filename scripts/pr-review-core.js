const crypto = require('crypto');

const VERDICTS = new Set(['APPROVE', 'REQUEST_CHANGES', 'NEEDS_HUMAN_REVIEW', 'REVIEW_FAILED']);
const DEFAULT_VOTES = Object.freeze({
  APPROVE: 10,
  REQUEST_CHANGES: -5,
  NEEDS_HUMAN_REVIEW: 0,
  REVIEW_FAILED: 0,
});

function findingFingerprint(finding) {
  const key = [finding.file, finding.category, finding.evidence].join('\n');
  return crypto.createHash('sha256').update(key).digest('hex');
}

function isBlockingFinding(finding, blockingP2 = false) {
  if (!finding.blocking || finding.confidence < 0.8 || !finding.evidence) return false;
  return finding.severity === 'P0'
    || finding.severity === 'P1'
    || (finding.severity === 'P2' && blockingP2);
}

function calculateVerdict(input) {
  if (input.technicalFailure || !input.contractValid || input.staleCommit) return 'REVIEW_FAILED';

  const checks = input.checks || [];
  const failedRequiredChecks = checks.filter((check) => check.required && check.status === 'failed');
  if (failedRequiredChecks.some((check) => check.attributableToPullRequest)) return 'REQUEST_CHANGES';

  const missingRequiredCheck = checks.some((check) => check.required && check.status !== 'passed');
  const missingContext = input.missingContext || [];
  if (!input.diffComplete || !input.providerApproved || missingRequiredCheck || missingContext.length > 0) {
    return 'NEEDS_HUMAN_REVIEW';
  }

  if ((input.findings || []).some((finding) => isBlockingFinding(finding, input.blockingP2))) {
    return 'REQUEST_CHANGES';
  }

  if (input.confidence < input.minimumConfidence) return 'NEEDS_HUMAN_REVIEW';
  return 'APPROVE';
}

function voteFor(verdict, votes = DEFAULT_VOTES) {
  if (!VERDICTS.has(verdict)) throw new Error(`Unknown verdict: ${verdict}`);
  const vote = votes[verdict];
  if (![10, 5, 0, -5, -10].includes(vote)) throw new Error(`Invalid Azure DevOps vote: ${vote}`);
  return vote;
}

module.exports = {
  DEFAULT_VOTES,
  VERDICTS,
  calculateVerdict,
  findingFingerprint,
  isBlockingFinding,
  voteFor,
};