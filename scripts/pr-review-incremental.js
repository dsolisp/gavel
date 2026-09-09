const { validateSnapshot } = require('./pr-review-snapshot');

function selectIncrementalScope(config, iteration, snapshot) {
  if (config.incremental?.enabled !== true) return { mode: 'full', reason: 'incremental review is disabled' };
  if (iteration.mode !== 'incremental-candidate') return { mode: 'full', reason: iteration.reason };
  if (iteration.reason !== 'push') return { mode: 'full', reason: `iteration reason ${iteration.reason} requires full review` };
  if (validateSnapshot(snapshot).length > 0) return { mode: 'full', reason: 'valid previous snapshot is unavailable' };
  if (!['APPROVE', 'REQUEST_CHANGES'].includes(snapshot.status)) {
    return { mode: 'full', reason: `previous snapshot status ${snapshot.status} is incomplete` };
  }
  if (snapshot.iterationId !== iteration.compareTo || snapshot.headSha !== iteration.baseCommit) {
    return { mode: 'full', reason: 'previous snapshot does not match the iteration base' };
  }
  return {
    mode: 'incremental', iterationId: iteration.iterationId,
    compareTo: iteration.compareTo, baseCommit: iteration.baseCommit,
  };
}

function findingInScope(finding, changedLines) {
  const lines = changedLines[finding.file] || [];
  const start = finding.startLine ?? finding.line;
  const end = finding.endLine ?? finding.line;
  return Number.isInteger(start) && Number.isInteger(end)
    && lines.some((line) => line >= start && line <= end);
}

function mergeScopedFindings(previous, current, changedLines) {
  return [...previous.filter((finding) => !findingInScope(finding, changedLines)), ...current];
}

function iterationPathsMatch(changeEntries, diffFiles) {
  const expected = new Set(changeEntries
    .filter((change) => !change.item?.isFolder)
    .map((change) => change.item?.path?.replace(/^\//, ''))
    .filter(Boolean));
  const actual = new Set(diffFiles);
  return expected.size === actual.size && [...expected].every((file) => actual.has(file));
}

module.exports = { findingInScope, iterationPathsMatch, mergeScopedFindings, selectIncrementalScope };