#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { parseUnifiedDiff, DEFAULT_LIMITS } = require('./pr-diff-context');
const { safeRelativePath } = require('./pr-review-contract');
const { loadGavelConfig } = require('./load-gavel-config');
const { findDeadLocators } = require('./audit-autofix');
const { isExcludedPath } = require('./glob-match');

const CODE_FILE = /\.(cs|ts|tsx|js|jsx|py|java|feature)$/i;
const NON_LOCAL_RULES = new Set(['no-step', 'no-teardown', 'fat-method', 'thin-wrapper', 'test-id-duplicate', 'test-id-gap']);

function git(root, args, encoding = 'utf8') {
  return execFileSync('git', ['-C', root, ...args], { encoding, maxBuffer: 64 * 1024 * 1024 });
}

function resolveCommit(root, ref) {
  return git(root, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
}

function snapshot(root, commit, destination) {
  const entries = git(root, ['ls-tree', '-rz', commit]).split('\0').filter(Boolean);
  const files = [];
  for (const entry of entries) {
    const separator = entry.indexOf('\t');
    const file = entry.slice(separator + 1);
    const [mode, type, object] = entry.slice(0, separator).split(' ');
    if (!safeRelativePath(file) || /[\r\n]/.test(file)) throw new Error('Unsupported repository path');
    if (!CODE_FILE.test(file) && !/\.(?:csproj)$/i.test(file)
      && !/(?:^|\/)(?:gavel\.config|package)\.json$/.test(file)) continue;
    if (!['100644', '100755'].includes(mode) || type !== 'blob') throw new Error('Symlinks/submodules require an explicit scanning policy');
    files.push({ file, object });
  }
  if (!files.length) return;
  const contents = execFileSync('git', ['-C', root, 'cat-file', '--batch'], {
    input: files.map(({ object }) => object).join('\n') + '\n', maxBuffer: 64 * 1024 * 1024,
  });
  let offset = 0;
  for (const { file, object } of files) {
    const end = contents.indexOf(10, offset);
    const [hash, type, sizeText] = contents.subarray(offset, end).toString('utf8').split(' ');
    const size = Number(sizeText);
    if (end < offset || hash !== object || type !== 'blob' || !Number.isSafeInteger(size) || size < 0
      || end + 1 + size >= contents.length) throw new Error('Incomplete Git object stream');
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const content = contents.subarray(end + 1, end + 1 + size);
    fs.writeFileSync(target, CODE_FILE.test(file)
      ? content.toString('utf8').replace(/\bgavel-(?:ignore|allow)\b/g, 'pr-check-inline-suppression-disabled')
      : content);
    offset = end + 2 + size;
  }
}

function delta(root, base, head) {
  const tokens = git(root, ['diff', '--name-status', '-z', '--find-renames', base, head, '--']).split('\0');
  const changedLines = {};
  const previousPaths = {};
  let addedCount = 0;
  let bytes = 0;
  for (let index = 0; index < tokens.length && tokens[index];) {
    const status = tokens[index++];
    const beforePath = tokens[index++];
    const afterPath = /^[RC]/.test(status) ? tokens[index++] : beforePath;
    if (status === 'D' || !CODE_FILE.test(afterPath)) continue;
    if (!safeRelativePath(afterPath) || /[\r\n]/.test(afterPath)) throw new Error('Unsupported changed path');
    previousPaths[afterPath] = status === 'A' || status.startsWith('C') ? null : beforePath;
    const patch = git(root, ['-c', 'core.quotePath=false', 'diff', '--no-ext-diff', '--no-textconv',
      '--unified=0', '--find-renames', base, head, '--', beforePath, afterPath]);
    if (/^Binary files /m.test(patch)) throw new Error('Binary source file cannot be scanned');
    const normalized = patch.replace(/^\+\+\+ .*$/m, `+++ b/${afterPath}`);
    const parsed = parseUnifiedDiff(normalized);
    if (!parsed.complete) throw new Error(`Incomplete diff: ${parsed.reasons.join('; ')}`);
    changedLines[afterPath] = parsed.changedLines[afterPath] || [];
    addedCount += parsed.lines;
    bytes += parsed.bytes;
  }
  if (Object.keys(changedLines).length > DEFAULT_LIMITS.maxFiles
    || addedCount > DEFAULT_LIMITS.maxLines || bytes > DEFAULT_LIMITS.maxBytes) {
    throw new Error('PR diff exceeds supported limits; validation incomplete');
  }
  return { changedLines, previousPaths };
}

function scan(root, configPath) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'self-check.js'), root,
    '--config', configPath, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (![0, 1].includes(result.status)) throw new Error('Static scanner failed');
  const report = JSON.parse(result.stdout);
  if (!Array.isArray(report.findings)) throw new Error('Invalid scanner report');
  const policy = loadGavelConfig(root, { configPath, cwd: root });
  const dead = findDeadLocators(root).filter((finding) =>
    !isExcludedPath(finding.file, policy.excludePaths ?? ['scripts/**', 'fixtures/**', 'tools/**', 'utility_scripts/**'])
    && !policy.allowlist?.some((entry) => (entry.file === '*' || finding.file.endsWith(entry.file))
      && (entry.tag === '*' || entry.tag === finding.tag) && (!entry.line || entry.line === finding.line)))
    .map((finding) => ({ ...finding, text: finding.symbol }));
  return [...report.findings, ...dead];
}

function publicFinding(finding) {
  return { tag: finding.tag, file: finding.file, line: finding.line,
    ...(finding.subCase ? { subCase: finding.subCase } : {}) };
}

function identity(finding) {
  return JSON.stringify([finding.tag, finding.subCase || '', (finding.text || '').trim()]);
}

function introducedFindings(before, after, changedLines, previousPaths) {
  const findings = [];
  const unattributed = [];
  for (const [file, added] of Object.entries(changedLines)) {
    const remaining = new Map();
    for (const finding of before.filter((entry) => entry.file === previousPaths[file])) {
      const key = identity(finding);
      remaining.set(key, (remaining.get(key) || 0) + 1);
    }
    const hits = after.filter((entry) => entry.file === file);
    hits.sort((left, right) => Number(added.includes(left.line)) - Number(added.includes(right.line)));
    for (const finding of hits) {
      const key = identity(finding);
      const count = remaining.get(key) || 0;
      if (count > 0) {
        remaining.set(key, count - 1);
      } else if (!NON_LOCAL_RULES.has(finding.tag) && Number.isInteger(finding.line) && added.includes(finding.line)) {
        findings.push(publicFinding(finding));
      } else {
        unattributed.push(publicFinding(finding));
      }
    }
  }
  return { findings, unattributed };
}

function runCheck(root, baseRef, headRef, configPath) {
  const base = resolveCommit(root, baseRef);
  const head = resolveCommit(root, headRef);
  const { changedLines, previousPaths } = delta(root, base, head);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-pr-check-'));
  try {
    const beforeRoot = path.join(temporary, 'before');
    const afterRoot = path.join(temporary, 'after');
    fs.mkdirSync(beforeRoot);
    fs.mkdirSync(afterRoot);
    snapshot(root, base, beforeRoot);
    snapshot(root, head, afterRoot);
    const policy = loadGavelConfig(beforeRoot, { configPath, cwd: beforeRoot });
    const trustedConfig = path.join(temporary, 'policy.json');
    fs.writeFileSync(trustedConfig, JSON.stringify(policy));
    const result = introducedFindings(scan(beforeRoot, trustedConfig), scan(afterRoot, trustedConfig),
      changedLines, previousPaths);
    return { schemaVersion: '1.0', base, head, status: result.findings.length ? 'FAILED' : 'PASSED',
      changedFiles: Object.keys(changedLines).length, ...result };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function main(args) {
  if (args.includes('--help')) {
    console.log('Usage: gavel pr-check [repo] --base <commit> --head <commit> [--config trusted.json] [--json] [--out report.json]');
    return 0;
  }
  let root = process.cwd();
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (['--base', '--head', '--config', '--out'].includes(argument)) {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${argument} requires a value`);
      options[argument.slice(2)] = args[++index];
    } else if (argument === '--json') options.json = true;
    else if (argument.startsWith('--')) throw new Error(`Unknown option: ${argument}`);
    else root = path.resolve(argument);
  }
  if (!options.base || !options.head) throw new Error('--base and --head are required');
  const report = runCheck(root, options.base, options.head, options.config ? path.resolve(options.config) : undefined);
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (options.out) fs.writeFileSync(path.resolve(options.out), output);
  if (options.json) fs.writeSync(1, output);
  else {
    console.log(`Gavel PR check: ${report.status}; new violations=${report.findings.length}; unattributed=${report.unattributed.length}`);
    for (const finding of report.findings) console.log(`${finding.tag} ${finding.file}:${finding.line}`);
  }
  return report.findings.length ? 1 : 0;
}

module.exports = { runCheck, introducedFindings };
if (require.main === module) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) { console.error(`Gavel PR check incomplete: ${error.message}`); process.exitCode = 2; }
}