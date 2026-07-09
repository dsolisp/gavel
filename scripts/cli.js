#!/usr/bin/env node
// gavel — unified CLI entry point

const path = require('path');
const { spawnSync } = require('child_process');
const { RULES } = require('./self-check');
const { parseConfigFlag, resolveGavelConfig } = require('./load-gavel-config');

const scripts = { audit: 'audit-report.js', review: 'self-check.js', 'self-check': 'self-check.js', analyze: 'analyze-ci.js', 'affected-tests': 'affected-tests.js', detect: 'detect.js' };
const valueFlags = new Set(['--config', '--app-repo', '--area-map', '--commits', '--project', '--framework', '--changed', '--tag', '--tag-framework']);
const severityRank = { info: 0, warning: 1, error: 2, blocker: 3 };
const ruleSeverity = Object.fromEntries(RULES.map((rule) => [rule.id, rule.severity]));

function publicCommandName() {
  const name = path.basename(process.argv[1] || 'gavel');
  return name.startsWith('gavel-') ? name.slice('gavel-'.length) : null;
}

function printHelp() {
  console.log('Usage: gavel <command> [args] [--config gavel.config.json]');
  console.log('Commands: audit, review, self-check, analyze, affected-tests, detect');
}

function hasPositional(args) {
  for (let i = 0; i < args.length; i += 1) {
    if (valueFlags.has(args[i])) {
      i += 1;
      continue;
    }
    if (!args[i].startsWith('--')) return true;
  }
  return false;
}

function addDefaultRoot(command, args) {
  if (['audit', 'review', 'self-check', 'detect', 'affected-tests'].includes(command) && !hasPositional(args)) {
    return [process.cwd(), ...args];
  }
  return args;
}

function scriptArgs(command, args, configSource) {
  const out = addDefaultRoot(command, [...args]);
  if (command === 'audit' && !out.includes('--with-self-check')) out.push('--with-self-check');
  if (configSource && configSource !== 'package.json#gavel' && ['audit', 'review', 'self-check'].includes(command)) out.push('--config', configSource);
  return out;
}

function runScript(command, args, capture = false) {
  const result = spawnSync(process.execPath, [path.join(__dirname, scripts[command]), ...args], {
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.status === null) {
    if (capture) return { status: 2, stdout: '', stderr: String(result.error || 'failed') };
    console.error(result.error || 'failed');
    return { status: 2 };
  }
  return result;
}

function threshold(config) {
  return config.failThreshold || 'warning';
}

function selfCheckExit(report, config) {
  const failAt = threshold(config);
  if (failAt === 'off') return 0;
  const min = severityRank[failAt] ?? severityRank.warning;
  return (report.findings || []).some((finding) => {
    const severity = ruleSeverity[finding.tag] || 'warning';
    return (severityRank[severity] ?? 1) >= min;
  }) ? 1 : 0;
}

function auditExit(report, config) {
  const failAt = threshold(config);
  if (failAt === 'off') return 0;
  const min = severityRank[failAt] ?? severityRank.warning;
  const findings = report.suiteHealth?.scoredFindings || [];
  const actionable = findings.filter((finding) => {
    const mapped = { blocker: 'blocker', fix: 'error', cleanup: 'warning', delete: 'warning' }[finding.severity] || 'warning';
    return (config.reportOnlyExits || finding.autofix !== 'report-only') && (severityRank[mapped] ?? 1) >= min;
  });
  return actionable.length > 0 ? 1 : 0;
}

function jsonReportExit(command, args, config) {
  const jsonArgs = args.includes('--json') ? args : [...args, '--json'];
  const result = runScript(command, jsonArgs, true);
  if (![0, 1].includes(result.status)) return result.status || 2;
  try {
    const report = JSON.parse(result.stdout);
    return command === 'audit' ? auditExit(report, config) : selfCheckExit(report, config);
  } catch {
    return result.status || 0;
  }
}

function main() {
  const alias = publicCommandName();
  const argv = process.argv.slice(2);
  const command = alias || argv[0];
  const rawArgs = alias ? argv : argv.slice(1);

  if (!command || ['-h', '--help', 'help'].includes(command)) {
    printHelp();
    process.exit(0);
  }
  if (command === 'companion') {
    if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
      console.log('Companion workflows are optional and hidden from default help.');
      console.log('See companion/README.md for env, hub, issue, and PR-prep workflows.');
    } else console.error('Usage: gavel companion --help');
    process.exit(rawArgs.includes('--help') || rawArgs.includes('-h') ? 0 : 2);
  }
  if (!scripts[command]) {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(2);
  }

  const { args, configPath, sawConfig } = parseConfigFlag(rawArgs);
  if (sawConfig && !configPath) return console.error('Usage error: --config requires a path'), process.exit(2);
  if (command === 'analyze' && !hasPositional(args) && process.stdin.isTTY) return console.error('Usage: gavel analyze <report-path> [--json|--envelope|--json-envelope]'), process.exit(2);
  let resolved;
  try {
    resolved = resolveGavelConfig({ configPath, cwd: process.cwd() });
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const finalArgs = scriptArgs(command, args, resolved.source);
  const result = runScript(command, finalArgs);
  if (command === 'audit' && !resolved.source) {
    console.error('Hint: add gavel.config.json for thresholds, allowlists, and $schema editor autocomplete.');
  }
  if (['audit', 'review', 'self-check'].includes(command) && [0, 1].includes(result.status)) {
    process.exit(jsonReportExit(command === 'review' ? 'self-check' : command, finalArgs, resolved.config));
  }
  process.exit(result.status || 0);
}

main();
