#!/usr/bin/env node
// gavel — serialize findings to SARIF 2.1.0 (pure serialization; no enrichment)
// gavel: emits the SARIF subset Gavel needs (driver + results + partialFingerprints).
//        helpUri is intentionally omitted until per-rule doc pages ship (v1.0).

const crypto = require('crypto');
const { version } = require('../package.json');

// SARIF level is one of none|note|warning|error. Map both Gavel severity
// vocabularies (self-check: blocker|error|warning|info; audit envelope:
// blocker|fix|cleanup|delete|report) onto it. Required serialization, not
// enrichment — SARIF has no Gavel-native severities.
const SARIF_LEVEL = {
  blocker: 'error',
  error: 'error',
  fix: 'error',
  warning: 'warning',
  cleanup: 'warning',
  info: 'note',
  report: 'note',
  delete: 'note',
};

// Fingerprint = path + rule + stable snippet hash. Line numbers are excluded on
// purpose so a finding survives unrelated edits (baseline gating, v0.8).
function fingerprint(finding) {
  const key = `${finding.file}\n${finding.tag}\n${finding.snippet || ''}`;
  return crypto.createHash('sha256').update(key).digest('hex');
}

// findings: { tag, severity, message, file, line?, snippet?, fix? }
// ruleMeta: optional { [tag]: { message } } — static rule descriptions from the
// RULES registry. The driver.rules dictionary must stay static, so per-finding
// messages never leak into it; rules without registry metadata carry id/name only.
function toSarif(findings, ruleMeta = {}) {
  const rules = [];
  const ruleIndex = new Map();
  for (const finding of findings) {
    if (!ruleIndex.has(finding.tag)) {
      ruleIndex.set(finding.tag, rules.length);
      const rule = { id: finding.tag, name: finding.tag };
      const staticText = ruleMeta[finding.tag]?.message;
      if (staticText) rule.shortDescription = { text: staticText };
      rules.push(rule);
    }
  }

  const results = findings.map((finding) => {
    const region = Number.isInteger(finding.line) && finding.line > 0 ? { region: { startLine: finding.line } } : {};
    const result = {
      ruleId: finding.tag,
      ruleIndex: ruleIndex.get(finding.tag),
      level: SARIF_LEVEL[finding.severity] || 'warning',
      message: { text: finding.message || finding.tag },
      locations: [{ physicalLocation: { artifactLocation: { uri: finding.file, uriBaseId: 'SRCROOT' }, ...region } }],
      partialFingerprints: { 'gavelSnippetHash/v1': fingerprint(finding) },
    };
    // Remediation hint (roadmap #3): SARIF consumers (GitHub Code Scanning,
    // SonarQube) render the fix description inline. Gavel emits the guidance text
    // only — no artifactChanges, since it does not compute concrete edits here.
    if (finding.fix) {
      result.fixes = [{ description: { text: finding.fix } }];
    }
    return result;
  });

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: { driver: { name: 'Gavel', informationUri: 'https://github.com/dsolisp/gavel', version, rules } },
        originalUriBaseIds: { SRCROOT: { description: { text: 'Repository root the scan ran against.' } } },
        results,
      },
    ],
  };
}

// Reads --format <value> or --format=<value>; returns the value or null.
function formatFlag(args) {
  const i = args.indexOf('--format');
  if (i >= 0) {
    return args[i + 1] || '';
  }
  const eq = args.find((arg) => arg.startsWith('--format='));
  return eq ? eq.slice('--format='.length) : null;
}

module.exports = { toSarif, SARIF_LEVEL, formatFlag, fingerprint };
