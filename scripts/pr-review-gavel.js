const fs = require('fs');
const path = require('path');
const { RULES } = require('./self-check');
const { REVIEW_RULES } = require('./review-rules');

function onChangedLine(finding, lines) {
  return Number.isInteger(finding.line) && lines.includes(finding.line);
}

function scanDelta(root, changedLines, beforeLoader = () => '') {
  const findings = [];
  for (const [file, lines] of Object.entries(changedLines)) {
    const fullPath = path.join(root, file);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue;
    const after = fs.readFileSync(fullPath, 'utf8');
    for (const rule of RULES) {
      const hits = rule.test(file, after) || [];
      findings.push(...hits.filter((finding) => onChangedLine(finding, lines)).map((finding) => ({
        ...finding, tag: rule.id, file, severity: rule.severity,
      })));
    }
    const pair = { beforePath: file, afterPath: file, before: beforeLoader(file), after };
    for (const rule of REVIEW_RULES) {
      const hits = rule.test(pair) || [];
      findings.push(...hits.filter((finding) => onChangedLine(finding, lines)));
    }
  }
  return findings;
}

function gavelCheck(findings) {
  const blocking = findings.some((finding) => ['blocker', 'error'].includes(finding.severity));
  return {
    name: 'gavel-delta', required: true,
    status: blocking ? 'failed' : 'passed',
    attributableToPullRequest: blocking,
  };
}

module.exports = { gavelCheck, scanDelta };