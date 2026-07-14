#!/usr/bin/env node
// gavel — format analyze-ci.js output as gavel-analyze result envelope markdown/json

// Schema versioning rules:
//   MAJOR (x.0.0) — breaking shape changes; consumers must update
//   MINOR (1.x.0) — new optional fields; consumers can ignore
//   PATCH (1.0.x) — doc/typo fixes only
// Source of truth: schemas/result-envelope.schema.json
// 1.1.0 — optional findings[].confidence for heuristic rules (RULES registry)
const ENVELOPE_SCHEMA_VERSION = '1.1.0';

function primaryClassification(clusters) {
  if (!clusters || clusters.length === 0) {
    return 'none';
  }
  const drift = clusters.find((c) => c.classification === 'test-maintenance-drift');
  if (drift) {
    return 'test-maintenance-drift';
  }
  const env = clusters.find((c) => c.classification === 'env');
  if (env) {
    return 'env';
  }
  return clusters[0].classification;
}

function formatSuspectCommits(clusters) {
  for (const cluster of clusters || []) {
    if (cluster.suspectCommits?.length > 0) {
      const top = cluster.suspectCommits[0];
      return `${top.hash} — ${top.message}`;
    }
  }
  return 'n/a';
}

function formatNextAction(clusters) {
  if (!clusters || clusters.length === 0) {
    return 'none';
  }
  const ranked = [...clusters].sort((a, b) => b.count - a.count);
  return ranked[0].nextAction || 'gavel-heal';
}

function envelopeStatus(summary, clusters) {
  if (summary.total > 0 && summary.failed === 0) {
    return 'DONE';
  }
  return summary.failed > 0 && clusters.length > 0 ? 'DONE' : 'INCOMPLETE';
}

function formatCiAnalysisEnvelope(analysis, meta = {}) {
  const { summary, clusters, note } = analysis;
  const project = meta.project || 'unknown-project';
  const date = meta.date || new Date().toISOString().slice(0, 10);
  const rootCause = primaryClassification(clusters);
  const status = envelopeStatus(summary, clusters);

  const leadLine = `${project} — ${summary.passRate}% pass — ${summary.failed} failed — root cause: ${rootCause} — action: ${formatNextAction(clusters)}`;

  const clusterLines = (clusters || [])
    .map(
      (cluster) =>
        `| ${cluster.area} | ${cluster.pattern} | ${cluster.count} | ${cluster.classification} | ${cluster.nextAction} |`,
    )
    .join('\n');

  const commitLines = (clusters || [])
    .flatMap((cluster) => cluster.suspectCommits || [])
    .slice(0, 5)
    .map((commit) => `- \`${commit.hash}\` ${commit.message} (${commit.searchPath})`)
    .join('\n');

  return `## Gavel Result

**Status:** ${status}

### Lead Summary
${leadLine}

### Worker Handoff — ${project} — ${date}

| Metric | Value |
|--------|------:|
| Format | ${summary.format} |
| Total | ${summary.total} |
| Failed | ${summary.failed} |
| Pass rate | ${summary.passRate}% |

### Failure Clusters

| Area | Pattern | Count | Classification | Next Action |
|------|---------|------:|----------------|-------------|
${clusterLines || '| — | — | 0 | — | — |'}

### Suspect Commits
${commitLines || 'n/a — pass --app-repo and --area-map for correlation'}

### Next Action
${formatNextAction(clusters)}

_${note || ''}_`;
}

function buildJsonEnvelope(analysis, meta = {}) {
  const { summary, clusters, note } = analysis;
  const project = meta.project || 'unknown-project';
  const rootCause = primaryClassification(clusters);
  const status = envelopeStatus(summary, clusters);

  return {
    schema: `gavel-result-envelope/${ENVELOPE_SCHEMA_VERSION}`,
    generatedAt: new Date().toISOString(),
    status,
    project,
    date: new Date().toISOString().slice(0, 10),
    leadSummary: {
      passRate: summary.passRate,
      failed: summary.failed,
      total: summary.total,
      format: summary.format,
      rootCause,
      nextAction: formatNextAction(clusters),
    },
    clusters: clusters.map((c) => ({
      area: c.area,
      pattern: c.pattern,
      count: c.count,
      classification: c.classification,
      nextAction: c.nextAction,
      suspectCommits: (c.suspectCommits || []).slice(0, 3).map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        searchPath: commit.searchPath,
      })),
    })),
    note,
  };
}

module.exports = {
  formatCiAnalysisEnvelope,
  buildJsonEnvelope,
  primaryClassification,
  envelopeStatus,
  ENVELOPE_SCHEMA_VERSION,
};
