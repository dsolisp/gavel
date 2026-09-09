const SEVERITIES = ['P0', 'P1', 'P2', 'P3', 'INFO'];

function findingCounts(findings) {
  return Object.fromEntries(SEVERITIES.map((severity) => [
    severity,
    findings.filter((finding) => finding.severity === severity).length,
  ]));
}

function formatWalkthrough(review, commit, marker) {
  const counts = findingCounts(review.findings);
  const checks = review.checksConsidered.length > 0 ? review.checksConsidered.join(', ') : 'None reported';
  return [
    marker,
    '## Gavel PR walkthrough',
    '',
    `**${review.verdict}** for \`${commit}\``,
    '',
    review.summary,
    '',
    '| Confidence | P0 | P1 | P2 | P3 | Info |',
    '| ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${(review.confidence * 100).toFixed(0)}% | ${counts.P0} | ${counts.P1} | ${counts.P2} | ${counts.P3} | ${counts.INFO} |`,
    '',
    `**Checks considered:** ${checks}`,
  ].join('\n');
}

module.exports = { findingCounts, formatWalkthrough };