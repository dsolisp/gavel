#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { run } = require('./ado-pr-review');
const { createModelClient } = require('./model-client');
const { evaluateReviewCases } = require('./pr-review-evaluation');

const SOURCE_COMMIT = 'a'.repeat(40);
const TARGET_COMMIT = 'b'.repeat(40);
const config = {
  schemaVersion: '1.0',
  mode: 'shadow',
  model: { provider: 'fixture' },
  minimumConfidence: 0.8,
  maxModelCalls: 1,
  limits: { maxFiles: 20, maxLines: 500, maxBytes: 100000 },
};
const context = {
  reason: 'PullRequest',
  pullRequestId: '1',
  sourceBranch: 'refs/heads/evaluation',
  targetBranch: 'refs/heads/main',
  repositoryId: 'evaluation-repository',
  repositoryName: 'evaluation-repository',
  sourceVersion: SOURCE_COMMIT,
  collectionUri: 'https://dev.azure.com/evaluation/',
  project: 'evaluation',
};
const pullRequest = {
  lastMergeSourceCommit: { commitId: SOURCE_COMMIT },
  lastMergeTargetCommit: { commitId: TARGET_COMMIT },
};

function threshold(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1`);
  }
  return value;
}

async function executeCase(reviewCase) {
  const result = await run({
    root: path.join(__dirname, '..'),
    config,
    context,
    pullRequest,
    diff: reviewCase.diff,
    checks: [{ name: 'evaluation', required: true, status: 'passed' }],
    threads: [],
    deterministicFindings: [],
    model: createModelClient({ provider: 'fixture', response: reviewCase.modelResponse }),
  });
  if (result.exitCode !== 0 || result.artifact.contractErrors.length > 0) {
    throw new Error(`${reviewCase.id}: reviewer execution failed: ${result.artifact.contractErrors.join('; ')}`);
  }
  return { ...reviewCase, actualFindings: result.artifact.review.findings };
}

async function main() {
  const corpusPath = path.join(__dirname, '..', 'fixtures', 'ado-pr-review', 'evaluation-corpus.json');
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  const minimumPrecision = threshold('--min-precision', 0.9);
  const minimumRecall = threshold('--min-recall', 0.9);
  const executedCases = await Promise.all(corpus.cases.map(executeCase));
  const metrics = evaluateReviewCases(executedCases);
  const pass = metrics.precision !== null
    && metrics.recall !== null
    && metrics.precision >= minimumPrecision
    && metrics.recall >= minimumRecall;
  const result = {
    schemaVersion: '1.0',
    corpusVersion: corpus.schemaVersion,
    cases: corpus.cases.length,
    minimumPrecision,
    minimumRecall,
    ...metrics,
    pass,
  };

  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else console.log(`PR review corpus: precision=${metrics.precision} recall=${metrics.recall} cases=${corpus.cases.length} ${pass ? 'PASS' : 'FAIL'}`);
  return pass ? 0 : 1;
}

main().then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  console.error(error.message);
  process.exitCode = 2;
});