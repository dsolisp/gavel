#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { AzureDevOpsClient } = require('./azure-devops-client');
const { calculateVerdict, voteFor } = require('./pr-review-core');
const { validateReview } = require('./pr-review-contract');
const { parseUnifiedDiff } = require('./pr-diff-context');
const { redact, untrustedDataEnvelope } = require('./pr-review-redaction');
const { createModelClient } = require('./model-client');
const { reconcileThreads } = require('./pr-review-comments');
const { gavelCheck, scanDelta } = require('./pr-review-gavel');
const { createSnapshot, isDuplicateSnapshot } = require('./pr-review-snapshot');
const { iterationPathsMatch, mergeScopedFindings, selectIncrementalScope } = require('./pr-review-incremental');

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function pipelineContext(env) {
  return {
    reason: env.BUILD_REASON,
    pullRequestId: env.SYSTEM_PULLREQUEST_PULLREQUESTID,
    sourceBranch: env.SYSTEM_PULLREQUEST_SOURCEBRANCH,
    targetBranch: env.SYSTEM_PULLREQUEST_TARGETBRANCH,
    repositoryId: env.BUILD_REPOSITORY_ID,
    repositoryName: env.BUILD_REPOSITORY_NAME,
    sourceVersion: env.BUILD_SOURCEVERSION,
    collectionUri: env.SYSTEM_COLLECTIONURI,
    project: env.SYSTEM_TEAMPROJECT,
  };
}

function missingPipelineFields(context) {
  return Object.entries(context)
    .filter(([key, value]) => key !== 'repositoryName' && !value)
    .map(([key]) => key);
}

function deterministicChecks(env) {
  const status = env.GAVEL_DETERMINISTIC_STATUS;
  if (!status) return [];
  return [{
    name: 'deterministic-pipeline', required: true,
    status: status === 'Succeeded' ? 'passed' : 'failed',
    attributableToPullRequest: false,
  }];
}

function validateConfig(config) {
  const errors = [];
  if (config.schemaVersion !== '1.0') errors.push('schemaVersion must be 1.0');
  if (!['shadow', 'advisory', 'controlled'].includes(config.mode)) errors.push('mode must be shadow, advisory, or controlled');
  if (!config.model || !['disabled', 'fixture'].includes(config.model.provider)) errors.push('model.provider is not implemented or approved');
  if (!(config.minimumConfidence >= 0 && config.minimumConfidence <= 1)) errors.push('minimumConfidence must be between 0 and 1');
  if (Object.values(config.votes || {}).includes(-10) && config.allowRejectedVote !== true) {
    errors.push('vote -10 requires allowRejectedVote=true and explicit policy approval');
  }
  if (config.maxModelCalls !== 1) errors.push('maxModelCalls must be 1');
  if (config.incremental?.enabled !== undefined && typeof config.incremental.enabled !== 'boolean') {
    errors.push('incremental.enabled must be boolean');
  }
  if (config.incremental?.enabled === true && config.mode !== 'shadow') {
    errors.push('incremental review requires shadow mode until the approved Blob snapshot store is implemented');
  }
  if (config.publish?.comments && (!config.botId || config.botId === 'unconfigured')) {
    errors.push('botId is required before comments can be enabled');
  }
  if (config.publish?.vote && config.mode !== 'controlled') errors.push('voting is allowed only in controlled mode');
  if (config.publish?.vote && (!config.reviewerId || config.reviewerId === 'unconfigured')) {
    errors.push('reviewerId is required before voting can be enabled');
  }
  return errors;
}

function gitDiff(root, base, head) {
  const mergeBase = execFileSync('git', ['merge-base', base, head], { cwd: root, encoding: 'utf8' }).trim();
  return execFileSync('git', ['diff', '--no-ext-diff', '--unified=3', mergeBase, head], {
    cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  });
}

function gitDiffBetween(root, base, head) {
  return execFileSync('git', ['diff', '--no-ext-diff', '--unified=3', base, head], {
    cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  });
}

function conservativeReview(commit, reason, checks = []) {
  return {
    schemaVersion: '1.0', reviewedCommit: commit, verdict: 'NEEDS_HUMAN_REVIEW',
    summary: reason, confidence: 0, findings: [], missingContext: [reason], checksConsidered: checks.map((check) => check.name),
  };
}

function resolveIterationContext(iterations, head) {
  const values = Array.isArray(iterations) ? iterations : iterations?.value || [];
  const ordered = values
    .filter((iteration) => Number.isInteger(iteration.id) && iteration.id > 0)
    .sort((left, right) => left.id - right.id);
  const current = ordered.findLast((iteration) => iteration.sourceRefCommit?.commitId === head);
  if (!current) return { mode: 'full-required', reason: 'current head is absent from Azure DevOps iterations' };
  if (current.id === 1) return { mode: 'initial', iterationId: 1, compareTo: 0, reason: current.reason || 'create' };
  const previous = ordered.findLast((iteration) => iteration.id < current.id);
  if (!previous?.sourceRefCommit?.commitId) {
    return { mode: 'full-required', iterationId: current.id, reason: 'previous iteration commit is unavailable' };
  }
  return {
    mode: 'incremental-candidate', iterationId: current.id, compareTo: previous.id,
    baseCommit: previous.sourceRefCommit.commitId, reason: current.reason || 'push',
  };
}

async function resolveReviewDiff(options, client, iteration, target, head) {
  let scope = selectIncrementalScope(options.config, iteration, options.previousSnapshot);
  if (scope.mode === 'incremental') {
    try {
      const text = options.incrementalDiff ?? gitDiffBetween(options.root, scope.baseCommit, head);
      const diff = parseUnifiedDiff(text, options.config.limits);
      const changes = options.iterationChanges
        ?? (client ? await client.getIterationChanges(scope.iterationId, scope.compareTo) : null);
      if (changes && iterationPathsMatch(changes.changeEntries || [], diff.files)) return { text, diff, scope };
      scope = { mode: 'full', reason: 'Azure DevOps iteration changes do not match the local diff' };
    } catch {
      scope = { mode: 'full', reason: 'incremental diff could not be verified locally' };
    }
  }
  const text = options.diff ?? gitDiff(options.root, target, head);
  return { text, diff: parseUnifiedDiff(text, options.config.limits), scope };
}

async function publishReview(client, review, commit, operations, config) {
  if (config.mode === 'shadow') return [];
  const applied = [];
  if (config.publish?.comments) {
    for (const operation of operations) {
      if (operation.action === 'create') {
        await client.createThread({
          comments: [{ parentCommentId: 0, content: operation.content, commentType: 1 }],
          status: 'active',
          ...(operation.threadContext ? { threadContext: operation.threadContext } : {}),
        });
      } else if (operation.action === 'update') {
        await client.updateComment(operation.threadId, operation.commentId, operation.content);
        if (operation.status) await client.updateThread(operation.threadId, { status: operation.status });
      } else if (operation.action === 'close') await client.updateThread(operation.threadId, { status: 'fixed' });
      applied.push(operation.action);
    }
  }
  if (config.publish?.status) {
    const state = { APPROVE: 'succeeded', REQUEST_CHANGES: 'failed', NEEDS_HUMAN_REVIEW: 'pending', REVIEW_FAILED: 'error' }[review.verdict];
    await client.setCommitStatus(commit, {
      state, description: `Gavel PR review: ${review.verdict}`,
      context: { name: 'azure-devops-pr-reviewer', genre: 'continuous-integration' },
    });
    applied.push('status');
  }
  if (config.mode === 'controlled' && config.publish?.vote) {
    if (!config.reviewerId || config.reviewerId === 'unconfigured') throw new Error('reviewerId is required for voting');
    await client.setVote(config.reviewerId, voteFor(review.verdict, config.votes));
    applied.push('vote');
  }
  return applied;
}

async function run(options) {
  const context = options.context;
  if (context.reason !== 'PullRequest') return { exitCode: 0, artifact: { status: 'SKIPPED', reason: 'Not a pull request build' } };
  const missing = missingPipelineFields(context);
  if (missing.length > 0) return { exitCode: 2, artifact: { status: 'REVIEW_FAILED', missingPipelineFields: missing } };

  const client = options.client;
  const initialPr = options.pullRequest || await client.getPullRequest();
  const head = initialPr.lastMergeSourceCommit?.commitId;
  const target = initialPr.lastMergeTargetCommit?.commitId;
  if (!head || !target) return { exitCode: 3, artifact: { status: 'REVIEW_FAILED', reason: 'PR commit metadata unavailable' } };

  const iterations = options.iterations ?? (client ? await client.getIterations(true) : []);
  const iteration = resolveIterationContext(iterations, head);
  const resolvedDiff = await resolveReviewDiff(options, client, iteration, target, head);
  const { text: diffText, diff, scope } = resolvedDiff;
  const currentDeterministicFindings = options.deterministicFindings || scanDelta(
    options.root,
    diff.changedLines,
    (file) => {
      try {
        const beforeCommit = scope.mode === 'incremental' ? scope.baseCommit : target;
        return execFileSync('git', ['show', `${beforeCommit}:${file}`], { cwd: options.root, encoding: 'utf8' });
      } catch {
        return '';
      }
    },
  );
  const deterministicFindings = scope.mode === 'incremental'
    ? mergeScopedFindings(options.previousSnapshot.activeDeterministicFindings, currentDeterministicFindings, diff.changedLines)
    : currentDeterministicFindings;
  const checks = [...options.checks, gavelCheck(deterministicFindings)];
  const snapshotInput = { context, iteration, head, diff: diffText, config: options.config, checks };
  if (isDuplicateSnapshot(options.previousSnapshot, snapshotInput)) {
    const currentPr = options.currentPullRequest || (options.pullRequest ? initialPr : await client.getPullRequest());
    const staleCommit = currentPr.lastMergeSourceCommit?.commitId !== head;
    return {
      exitCode: staleCommit ? 4 : 0,
      snapshot: options.previousSnapshot,
      artifact: redact({
        schemaVersion: '1.0', mode: options.config.mode, reviewedCommit: head,
        status: staleCommit ? 'REVIEW_FAILED' : 'SKIPPED_DUPLICATE',
        reason: staleCommit ? 'PR commit changed before duplicate validation' : 'Identical review snapshot already exists',
        iteration, plannedMutations: [], appliedMutations: [],
      }),
    };
  }
  const metadata = options.metadata || (client ? {
    workItems: (await client.getWorkItems()).value || [],
    statuses: (await client.getPullRequestStatuses()).value || [],
  } : { workItems: [], statuses: [] });
  if (client && options.config.context?.readPolicies) {
    metadata.policies = (await client.getPolicyEvaluations(initialPr.repository?.project?.id)).value || [];
  }
  const modelResult = await options.model.review({
    payload: untrustedDataEnvelope({
      commit: head, diff: diffText, metadata,
      priorActiveFindings: scope.mode === 'incremental' ? options.previousSnapshot.activeFindings : [],
    }),
  });
  const suggested = modelResult.available
    ? modelResult.response
    : conservativeReview(head, modelResult.reason, checks);
  const contractErrors = validateReview(suggested, { expectedCommit: head, changedLines: diff.changedLines });
  const currentPr = options.currentPullRequest || (options.pullRequest ? initialPr : await client.getPullRequest());
  const staleCommit = currentPr.lastMergeSourceCommit?.commitId !== head;
  const activeFindings = scope.mode === 'incremental'
    ? mergeScopedFindings(options.previousSnapshot.activeFindings, suggested.findings, diff.changedLines)
    : suggested.findings;
  const effectiveVerdict = calculateVerdict({
    contractValid: contractErrors.length === 0,
    technicalFailure: false,
    staleCommit,
    diffComplete: diff.complete,
    providerApproved: options.config.model.provider !== 'disabled',
    checks,
    missingContext: suggested.missingContext,
    findings: activeFindings,
    confidence: suggested.confidence,
    minimumConfidence: options.config.minimumConfidence,
    blockingP2: options.config.blockingP2,
  });
  const review = { ...suggested, findings: activeFindings, verdict: effectiveVerdict };
  const snapshot = createSnapshot({ ...snapshotInput, review, deterministicFindings });
  const threads = options.threads ?? (client ? (await client.getThreads()).value || [] : []);
  const reviewedLines = scope.mode === 'incremental' ? diff.changedLines : undefined;
  const commentPlan = reconcileThreads(review, head, threads, options.config.botId || 'unconfigured', reviewedLines);
  const appliedMutations = staleCommit ? [] : await publishReview(client, review, head, commentPlan, options.config);
  return {
    exitCode: staleCommit ? 4 : 0,
    snapshot,
    artifact: redact({
      schemaVersion: '1.0', mode: options.config.mode, reviewedCommit: head, status: effectiveVerdict,
      vote: options.config.mode === 'controlled' && options.config.publish?.vote ? voteFor(effectiveVerdict, options.config.votes) : 0,
      recommendedVote: voteFor(effectiveVerdict, options.config.votes),
      diff: { files: diff.files.length, lines: diff.lines, complete: diff.complete, reasons: diff.reasons },
      iteration, reviewScope: scope,
      context: { workItems: metadata.workItems.length, statuses: metadata.statuses.length, policies: metadata.policies?.length || 0 },
      deterministicFindings, contractErrors, review,
      plannedMutations: options.config.mode === 'shadow' ? [] : commentPlan, appliedMutations,
    }),
  };
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const configPath = argumentValue(argv, '--config');
  const outputPath = argumentValue(argv, '--output') || path.resolve('pr-review-audit.json');
  const fixturePath = argumentValue(argv, '--fixture');
  const snapshotInputPath = argumentValue(argv, '--snapshot-input');
  const snapshotOutputPath = argumentValue(argv, '--snapshot-output');
  if (!configPath) throw new Error('Usage: gavel ado-pr-review --config <path> [--output path] [--fixture path]');
  const config = JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8'));
  const configErrors = validateConfig(config);
  if (configErrors.length > 0) throw new Error(`Invalid PR review config: ${configErrors.join('; ')}`);
  const fixture = fixturePath ? JSON.parse(fs.readFileSync(path.resolve(fixturePath), 'utf8')) : null;
  const previousSnapshot = snapshotInputPath && fs.existsSync(path.resolve(snapshotInputPath))
    ? JSON.parse(fs.readFileSync(path.resolve(snapshotInputPath), 'utf8'))
    : null;
  const context = fixture?.context || pipelineContext(env);
  if (!fixture && context.reason === 'PullRequest' && !env.SYSTEM_ACCESSTOKEN) {
    throw new Error('SYSTEM_ACCESSTOKEN is required for Azure DevOps API access');
  }
  const client = fixture || context.reason !== 'PullRequest' ? null : new AzureDevOpsClient({
    ...context, token: env.SYSTEM_ACCESSTOKEN,
    allowWrites: config.mode !== 'shadow' && Object.values(config.publish || {}).some(Boolean),
    timeoutMs: config.timeoutMs, retries: config.retries,
  });
  const result = await run({
    root: process.cwd(), config, context, client, pullRequest: fixture?.pullRequest,
    currentPullRequest: fixture?.currentPullRequest, diff: fixture?.diff, checks: fixture?.checks || deterministicChecks(env),
    threads: fixture ? fixture.threads || [] : undefined, metadata: fixture?.metadata,
    iterations: fixture?.iterations, previousSnapshot,
    model: createModelClient(fixture?.model || config.model),
  });
  fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(result.artifact, null, 2)}\n`);
  if (snapshotOutputPath && result.snapshot) {
    fs.writeFileSync(path.resolve(snapshotOutputPath), `${JSON.stringify(redact(result.snapshot), null, 2)}\n`);
  }
  return result.exitCode;
}

if (require.main === module) {
  main().then((exitCode) => { process.exitCode = exitCode; }).catch((error) => {
    const output = argumentValue(process.argv.slice(2), '--output') || path.resolve('pr-review-audit.json');
    const failure = redact({ schemaVersion: '1.0', status: 'REVIEW_FAILED', reason: error.message });
    try { fs.writeFileSync(path.resolve(output), `${JSON.stringify(failure, null, 2)}\n`); } catch {}
    console.error('PR review failed; see the sanitized audit artifact.');
    process.exitCode = 3;
  });
}

module.exports = {
  conservativeReview, deterministicChecks, main, pipelineContext, publishReview,
  resolveIterationContext, resolveReviewDiff, run, validateConfig,
};