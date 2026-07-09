#!/usr/bin/env node
// gavel — ranked gavel-audit output from audit-autofix + optional self-check
//
// Usage:
//   node scripts/audit-report.js <target-repo-root> [--json]
//   node scripts/audit-report.js <target-repo-root> --with-self-check

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { findAutofixCandidates, formatAuditLine } = require('./audit-autofix');
const { buildSuiteHealthSummary, formatSuiteHealth, scoreFinding } = require('./suite-health');
const { loadGavelConfig, parseConfigFlag } = require('./load-gavel-config');
const { RULES } = require('./self-check');
const { ENVELOPE_SCHEMA_VERSION } = require('./ci-analysis-envelope');
const { validateEnvelope } = require('./validate-envelope');
const { toSarif, formatFlag } = require('./to-sarif');

const RULE_META = Object.fromEntries(RULES.map((rule) => [rule.id, rule]));

function runSelfCheck(repoRoot, configPath = null) {
  const script = path.join(__dirname, 'self-check.js');
  const args = [script, repoRoot, '--json'];
  if (configPath) {
    args.push('--config', configPath);
  }
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
  });
  if (!result.stdout) {
    return [];
  }
  try {
    const payload = JSON.parse(result.stdout);
    return (payload.findings || []).map(mapSelfCheckFinding);
  } catch {
    return [];
  }
}

// Envelope severity comes from the RULES registry (rule.envelopeSeverity).
// Default 'fix' covers config-driven scans outside the registry (test-id-*).
const TAG_AUTOFIX = {
  'skip-marker': 'report-only',
  'test-id-duplicate': 'report-only',
  'test-id-gap': 'report-only',
};

function mapSelfCheckFinding(finding) {
  return {
    severity: RULE_META[finding.tag]?.envelopeSeverity || 'fix',
    autofix: TAG_AUTOFIX[finding.tag] || 'review',
    tag: finding.tag,
    message: finding.description,
    file: finding.file,
    line: finding.line,
    snippet: finding.text,
  };
}

function formatSelfCheckLine(finding) {
  const location = finding.line ? `${finding.file}:L${finding.line}` : finding.file;
  const prefix = finding.critical ? 'critical ' : '';
  return `${prefix}${finding.severity} ${finding.autofix} ${finding.tag} ${finding.message}. [${location}]`;
}

function rankFindings(autofixFindings, selfCheckFindings, repoRoot, config = loadGavelConfig(repoRoot)) {
  const severityRank = { blocker: 0, fix: 1, cleanup: 2, delete: 3 };
  const autofixRank = { safe: 0, review: 1, 'report-only': 2 };

  const combined = [
    ...autofixFindings.map((item) => ({ source: 'autofix', line: formatAuditLine(item), item })),
    ...selfCheckFindings.map((item) => ({
      source: 'self-check',
      line: formatSelfCheckLine(item),
      item,
    })),
  ];

  combined.sort((a, b) => {
    const aScore = scoreFinding(a.item, repoRoot, config).impactScore;
    const bScore = scoreFinding(b.item, repoRoot, config).impactScore;
    if (aScore !== bScore) {
      return aScore - bScore;
    }
    const aSev = severityRank[a.item.severity] ?? 9;
    const bSev = severityRank[b.item.severity] ?? 9;
    if (aSev !== bSev) {
      return aSev - bSev;
    }
    const aFix = autofixRank[a.item.autofix] ?? 9;
    const bFix = autofixRank[b.item.autofix] ?? 9;
    return aFix - bFix;
  });

  return combined;
}

function buildAuditEnvelope(report, ranked) {
  return {
    schema: `gavel-result-envelope/${ENVELOPE_SCHEMA_VERSION}`,
    generatedAt: new Date().toISOString(),
    status: 'DONE',
    project: path.basename(report.repo),
    findings: ranked.map(({ item }) => ({
      tag: item.tag,
      severity: item.severity,
      file: item.file,
      ...(item.line ? { line: item.line } : {}),
      ...(item.message ? { message: item.message } : {}),
      ...(item.snippet ? { snippet: item.snippet } : {}),
      ...(RULE_META[item.tag]?.confidence ? { confidence: RULE_META[item.tag].confidence } : {}),
    })),
  };
}

function main() {
  const { args, configPath } = parseConfigFlag(process.argv.slice(2));
  const jsonOutput = args.includes('--json');
  const jsonEnvelope = args.includes('--json-envelope');
  const auditFormat = args.includes('--audit-format');
  const withSelfCheck = args.includes('--with-self-check');
  const format = formatFlag(args);
  if (format && format !== 'sarif') {
    console.error('Usage: --format supports only "sarif"');
    process.exit(2);
  }
  const repoRoot = args.find((arg) => !arg.startsWith('--') && arg !== 'sarif');

  if (!repoRoot) {
    console.error('Usage: node scripts/audit-report.js <target-repo-root> [--with-self-check] [--json] [--json-envelope] [--audit-format]');
    process.exit(2);
  }

  const resolved = path.resolve(repoRoot);
  let config = {};
  try {
    config = loadGavelConfig(resolved, { configPath, cwd: process.cwd() });
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  const autofixCandidates = findAutofixCandidates(resolved);
  const selfCheckFindings = withSelfCheck ? runSelfCheck(resolved, configPath) : [];
  const scoredSelfCheck = selfCheckFindings.map((finding) => scoreFinding(finding, resolved, config));
  const ranked = rankFindings(autofixCandidates, scoredSelfCheck, resolved, config);
  const health = buildSuiteHealthSummary(autofixCandidates, scoredSelfCheck, resolved, config);

  const report = {
    repo: resolved,
    autofixCount: autofixCandidates.length,
    selfCheckCount: selfCheckFindings.length,
    byTag: health.byTag,
    byArea: health.byArea,
    suiteHealth: health,
    lines: ranked.map((entry) => entry.line),
  };

  if (jsonOutput) {
    // fs.writeSync (not console.log) so large payloads fully flush before process.exit.
    fs.writeSync(1, `${JSON.stringify(report, null, 2)}\n`);
    process.exit(0);
  }

  if (jsonEnvelope) {
    const envelope = buildAuditEnvelope(report, ranked);
    const errors = validateEnvelope(envelope);
    if (errors.length > 0) {
      console.error(`Invalid result envelope:\n${errors.join('\n')}`);
      process.exit(2);
    }
    fs.writeSync(1, `${JSON.stringify(envelope, null, 2)}\n`);
    process.exit(0);
  }

  if (format === 'sarif') {
    const findings = ranked.map(({ item }) => ({
      tag: item.tag,
      severity: item.severity,
      message: item.message || (item.symbol ? `${item.tag}: ${item.symbol}` : item.tag),
      file: item.file,
      line: item.line,
      snippet: item.snippet || item.symbol,
    }));
    fs.writeSync(1, `${JSON.stringify(toSarif(findings, RULE_META), null, 2)}\n`);
    process.exit(0);
  }

  if (auditFormat) {
    for (const line of report.lines) {
      console.log(line);
    }
    console.log('');
    console.log(formatSuiteHealth(health));
    process.exit(0);
  }

  console.log(`Gavel audit report — ${resolved}`);
  for (const entry of ranked) {
    console.log(entry.line);
  }

  console.log('');
  console.log(formatSuiteHealth(health));
}

if (require.main === module) {
  main();
}

module.exports = { rankFindings, formatSelfCheckLine };
