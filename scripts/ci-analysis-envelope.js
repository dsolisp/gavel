#!/usr/bin/env node
// gavel — format analyze-ci.js output as gavel-analyze result envelope markdown

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

function formatCiAnalysisEnvelope(analysis, meta = {}) {
  const { summary, clusters, note } = analysis;
  const project = meta.project || 'unknown-project';
  const date = meta.date || new Date().toISOString().slice(0, 10);
  const rootCause = primaryClassification(clusters);
  const status = summary.failed > 0 && clusters.length > 0 ? 'DONE' : 'INCOMPLETE';

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

### Classification
- **Root cause:** ${rootCause}
- **Suspect commit(s):** ${formatSuspectCommits(clusters)}
- **Remaining risk:** ${summary.failed > 0 ? `${summary.failed} failures across ${clusters.length} cluster(s)` : 'none'}

### CI Summary — ${project} — ${date}

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

module.exports = { formatCiAnalysisEnvelope, primaryClassification };
