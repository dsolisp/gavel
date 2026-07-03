#!/usr/bin/env node
// gavel — ranked gavel-audit output from audit-autofix + optional self-check
//
// Usage:
//   node scripts/audit-report.js <target-repo-root> [--json]
//   node scripts/audit-report.js <target-repo-root> --with-self-check

const path = require('path');
const { spawnSync } = require('child_process');
const { findAutofixCandidates, formatAuditLine } = require('./audit-autofix');

function runSelfCheck(repoRoot) {
  const script = path.join(__dirname, 'self-check.js');
  const result = spawnSync(process.execPath, [script, repoRoot, '--json'], {
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

const TAG_META = {
  'expect-in-action': { severity: 'blocker', autofix: 'review' },
  'manual-wait': { severity: 'blocker', autofix: 'review' },
  'no-di': { severity: 'blocker', autofix: 'review' },
  'selector-leak': { severity: 'fix', autofix: 'review' },
  'no-step': { severity: 'fix', autofix: 'review' },
};

function mapSelfCheckFinding(finding) {
  const meta = TAG_META[finding.tag] || { severity: 'fix', autofix: 'review' };
  return {
    severity: meta.severity,
    autofix: meta.autofix,
    tag: finding.tag,
    message: finding.description,
    file: finding.file,
    line: finding.line,
  };
}

function formatSelfCheckLine(finding) {
  const location = finding.line ? `${finding.file}:L${finding.line}` : finding.file;
  return `${finding.severity} ${finding.autofix} ${finding.tag} ${finding.message}. [${location}]`;
}

function rankFindings(autofixFindings, selfCheckFindings) {
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

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const auditFormat = args.includes('--audit-format');
  const withSelfCheck = args.includes('--with-self-check');
  const repoRoot = args.find((arg) => !arg.startsWith('--'));

  if (!repoRoot) {
    console.error('Usage: node scripts/audit-report.js <target-repo-root> [--with-self-check] [--json] [--audit-format]');
    process.exit(2);
  }

  const resolved = path.resolve(repoRoot);
  const autofixCandidates = findAutofixCandidates(resolved);
  const selfCheckFindings = withSelfCheck ? runSelfCheck(resolved) : [];
  const ranked = rankFindings(autofixCandidates, selfCheckFindings);

  const byTag = {};
  for (const entry of ranked) {
    byTag[entry.item.tag] = (byTag[entry.item.tag] || 0) + 1;
  }

  const report = {
    repo: resolved,
    autofixCount: autofixCandidates.length,
    selfCheckCount: selfCheckFindings.length,
    byTag,
    lines: ranked.map((entry) => entry.line),
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  if (auditFormat) {
    for (const line of report.lines) {
      console.log(line);
    }
    console.log('');
    console.log('Suite health (autofix scan):');
    console.log(`  Dead POMs: ${autofixCandidates.filter((item) => item.tag === 'dead-pom').length}`);
    console.log(
      `  Unused factories: ${autofixCandidates.filter((item) => item.tag === 'unused-factory').length}`,
    );
    console.log(
      `  Dead locators: ${autofixCandidates.filter((item) => item.tag === 'dead-locator').length}`,
    );
    if (withSelfCheck) {
      console.log(`  Constitution violations: ${selfCheckFindings.length}`);
    }
    console.log(`  Safe autofix candidates: ${autofixCandidates.length}`);
    process.exit(0);
  }

  console.log(`Gavel audit report — ${resolved}`);
  for (const entry of ranked) {
    console.log(entry.line);
  }

  console.log('');
  console.log('Suite health (autofix scan):');
  console.log(`  Dead POMs: ${autofixCandidates.filter((item) => item.tag === 'dead-pom').length}`);
  console.log(
    `  Unused factories: ${autofixCandidates.filter((item) => item.tag === 'unused-factory').length}`,
  );
  console.log(
    `  Dead locators: ${autofixCandidates.filter((item) => item.tag === 'dead-locator').length}`,
  );
  if (withSelfCheck) {
    console.log(`  Constitution violations: ${selfCheckFindings.length}`);
  }
  console.log(`  Safe autofix candidates: ${autofixCandidates.length}`);
}

if (require.main === module) {
  main();
}

module.exports = { rankFindings, formatSelfCheckLine };
