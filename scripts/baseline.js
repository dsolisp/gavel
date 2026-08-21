#!/usr/bin/env node
// gavel — baseline write/check CLI
//
// Usage:
//   node scripts/baseline.js write [repo-root] [--output gavel-baseline.json] [--config path]
//   node scripts/baseline.js check [repo-root] [--baseline gavel-baseline.json] [--config path]

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fingerprint } = require('./to-sarif');
const { validateBaseline } = require('./verify-baseline-schema');

const USAGE = 'Usage: gavel baseline <write|check> [repo-root] [--output|--baseline path] [--config path] [--preset name]';

function printUsage() {
  console.log(USAGE);
}

function parseArgs(argv) {
  const sub = argv[0] && !argv[0].startsWith('--') ? argv[0] : null;
  const rest = sub ? argv.slice(1) : argv;

  let output = null;
  let baseline = null;
  let config = null;
  let preset = null;
  let repoRoot = null;

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--output' && i + 1 < rest.length) {
      output = rest[i + 1];
      i += 1;
    } else if (arg.startsWith('--output=')) {
      output = arg.slice('--output='.length);
    } else if (arg === '--baseline' && i + 1 < rest.length) {
      baseline = rest[i + 1];
      i += 1;
    } else if (arg.startsWith('--baseline=')) {
      baseline = arg.slice('--baseline='.length);
    } else if (arg === '--config' && i + 1 < rest.length) {
      config = rest[i + 1];
      i += 1;
    } else if (arg.startsWith('--config=')) {
      config = arg.slice('--config='.length);
    } else if (arg === '--preset' && i + 1 < rest.length) {
      preset = rest[i + 1];
      i += 1;
    } else if (arg.startsWith('--preset=')) {
      preset = arg.slice('--preset='.length);
    } else if (!arg.startsWith('--') && !repoRoot) {
      repoRoot = arg;
    }
  }

  return { sub, output, baseline, config, preset, repoRoot };
}

function runSelfCheckJson(repoRoot, configPath, preset) {
  const script = path.join(__dirname, 'self-check.js');
  const args = [script, repoRoot, '--json'];
  if (configPath) {
    args.push('--config', configPath);
  }
  if (preset) {
    args.push('--preset', preset);
  }
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (result.status === 2) {
    if (result.stderr) process.stderr.write(result.stderr);
    return { status: 2, findings: [] };
  }
  if (!result.stdout) {
    return { status: 0, findings: [] };
  }
  try {
    const payload = JSON.parse(result.stdout);
    return { status: result.status || 0, findings: payload.findings || [] };
  } catch {
    if (result.stderr) process.stderr.write(result.stderr);
    return { status: 2, findings: [] };
  }
}

function loadPreviousBaseline(filePath) {
  try {
    const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const errors = validateBaseline(doc);
    if (errors.length === 0) {
      return new Map(doc.findings.map((f) => [`${f.path}\0${f.rule}\0${f.snippetHash}`, f.createdAt]));
    }
  } catch { /* ignore */ }
  return null;
}

function writeCommand(args) {
  const repoRoot = path.resolve(args.repoRoot || process.cwd());
  const outputPath = path.resolve(repoRoot, args.output || 'gavel-baseline.json');

  const scan = runSelfCheckJson(repoRoot, args.config, args.preset);
  if (scan.status === 2) {
    process.exit(2);
  }

  const now = new Date().toISOString();
  const previousBaseline = fs.existsSync(outputPath) ? loadPreviousBaseline(outputPath) : null;

  const seen = new Set();
  const entries = [];

  for (const finding of scan.findings) {
    const hash = fingerprint({ file: finding.file, tag: finding.tag, snippet: finding.text });
    const key = `${finding.file}\0${finding.tag}\0${hash}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const createdAt = (previousBaseline && previousBaseline.get(key)) || now;
    entries.push({
      path: finding.file,
      rule: finding.tag,
      snippetHash: hash,
      createdAt,
    });
  }

  const doc = {
    schemaVersion: '1.0.0',
    generatedAt: now,
    findings: entries,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(doc, null, 2)}\n`);
  process.exit(0);
}

function gitChangedFiles(repoRoot) {
  try {
    const result = spawnSync('git', ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (result.status !== 0) return null;
    const files = result.stdout.split('\n').map((line) => line.trim().replace(/\\/g, '/')).filter(Boolean);
    return files.length > 0 ? new Set(files) : null;
  } catch {
    return null;
  }
}

function checkCommand(args) {
  const repoRoot = path.resolve(args.repoRoot || process.cwd());
  const baselinePath = path.resolve(repoRoot, args.baseline || 'gavel-baseline.json');

  if (!fs.existsSync(baselinePath)) {
    console.error(`Baseline file not found: ${baselinePath}`);
    process.exit(2);
  }

  let baselineDoc;
  try {
    baselineDoc = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  } catch (error) {
    console.error(`Invalid baseline file: ${error.message}`);
    process.exit(2);
  }

  const errors = validateBaseline(baselineDoc);
  if (errors.length > 0) {
    console.error(`Invalid baseline schema:\n  ${errors.join('\n  ')}`);
    process.exit(2);
  }

  const scan = runSelfCheckJson(repoRoot, args.config, args.preset);
  if (scan.status === 2) {
    process.exit(2);
  }

  const baselineSet = new Set(baselineDoc.findings.map((f) => `${f.path}\0${f.rule}\0${f.snippetHash}`));
  const changedFiles = gitChangedFiles(repoRoot);

  const currentFindings = scan.findings.map((finding) => ({
    file: finding.file,
    tag: finding.tag,
    line: finding.line,
    text: finding.text,
    hash: fingerprint({ file: finding.file, tag: finding.tag, snippet: finding.text }),
  }));

  const newFindings = [];
  for (const finding of currentFindings) {
    if (changedFiles && !changedFiles.has(finding.file)) continue;
    const key = `${finding.file}\0${finding.tag}\0${finding.hash}`;
    if (!baselineSet.has(key)) {
      newFindings.push(finding);
    }
  }

  if (newFindings.length === 0) {
    console.log('baseline check: OK — no new findings');
    process.exit(0);
  }

  for (const finding of newFindings) {
    console.log(`${finding.tag} ${finding.file}:${finding.line} — ${finding.text}`);
  }
  process.exit(1);
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const args = parseArgs(argv);

  if (!args.sub) {
    printUsage();
    process.exit(2);
  }

  if (args.sub !== 'write' && args.sub !== 'check') {
    console.error(`Unknown subcommand: ${args.sub}`);
    printUsage();
    process.exit(2);
  }

  if (args.sub === 'write') writeCommand(args);
  else checkCommand(args);
}

main();
