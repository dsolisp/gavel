const { findingFingerprint } = require('./pr-review-core');
const { formatWalkthrough } = require('./pr-review-formatter');

const SUMMARY_MARKER = '<!-- gavel-pr-review:summary -->';

function findingMarker(finding) {
  return `<!-- gavel-pr-review:finding:${findingFingerprint(finding)} -->`;
}

function firstComment(thread) {
  return (thread.comments || [])[0] || {};
}

function ownMarkedThreads(threads, botId) {
  return threads.filter((thread) => {
    const comment = firstComment(thread);
    return comment.author?.id === botId && comment.content?.includes('<!-- gavel-pr-review:');
  });
}

function summaryBody(review, commit) {
  return formatWalkthrough(review, commit, SUMMARY_MARKER);
}

function findingBody(finding, commit) {
  return `${findingMarker(finding)}\n**${finding.severity} ${finding.category}** on \`${commit}\`\n\n${finding.evidence}\n\nImpact: ${finding.impact}\n\nRecommended: ${finding.recommendation}`;
}

function findingThreadContext(finding) {
  const filePath = finding.file.startsWith('/') ? finding.file : `/${finding.file}`;
  return {
    filePath,
    rightFileStart: { line: finding.startLine, offset: 1 },
    rightFileEnd: { line: finding.endLine, offset: 1 },
  };
}

function threadInScope(thread, reviewedLines) {
  if (!reviewedLines) return true;
  const context = thread.threadContext;
  const file = context?.filePath?.replace(/^\//, '');
  const start = context?.rightFileStart?.line;
  const end = context?.rightFileEnd?.line ?? start;
  if (!file || !Number.isInteger(start) || !Number.isInteger(end)) return false;
  return (reviewedLines[file] || []).some((line) => line >= start && line <= end);
}

function reconcileThreads(review, commit, threads, botId, reviewedLines) {
  const own = ownMarkedThreads(threads, botId);
  const operations = [];
  const summary = own.find((thread) => firstComment(thread).content.includes(SUMMARY_MARKER));
  const desiredSummary = summaryBody(review, commit);
  if (!summary) operations.push({ action: 'create', kind: 'summary', content: desiredSummary });
  else if (firstComment(summary).content !== desiredSummary) {
    operations.push({ action: 'update', kind: 'summary', threadId: summary.id, commentId: firstComment(summary).id, content: desiredSummary });
  }

  const activeMarkers = new Set();
  for (const finding of review.findings) {
    const marker = findingMarker(finding);
    activeMarkers.add(marker);
    const existing = own.find((thread) => firstComment(thread).content.includes(marker));
    const content = findingBody(finding, commit);
    if (!existing) operations.push({
      action: 'create', kind: 'finding', content, threadContext: findingThreadContext(finding),
    });
    else if (firstComment(existing).content !== content || existing.status === 'closed') {
      operations.push({ action: 'update', kind: 'finding', threadId: existing.id, commentId: firstComment(existing).id, status: 'active', content });
    }
  }

  for (const thread of own) {
    const content = firstComment(thread).content || '';
    const marker = content.match(/<!-- gavel-pr-review:finding:[a-f0-9]{64} -->/)?.[0];
    if (marker && !activeMarkers.has(marker) && thread.status !== 'closed' && threadInScope(thread, reviewedLines)) {
      operations.push({ action: 'close', kind: 'finding', threadId: thread.id });
    }
  }
  return operations;
}

module.exports = { SUMMARY_MARKER, findingMarker, findingThreadContext, reconcileThreads, threadInScope };