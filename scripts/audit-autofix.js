#!/usr/bin/env node
// gavel — safe-only audit autofix (dead locator symbols)
//
// Usage:
//   node scripts/audit-autofix.js <target-repo-root>              # dry-run (default)
//   node scripts/audit-autofix.js <target-repo-root> --apply    # remove confirmed dead symbols
//   node scripts/audit-autofix.js <target-repo-root> --json

const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
]);

const LOCATOR_RE = /locators?\//i;
const SYMBOL_RE = /^\s+(?:async\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/gm;

function walkFiles(dir, matcher, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, matcher, files);
      continue;
    }
    if (matcher(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractSymbols(content) {
  const symbols = [];
  const skip = new Set(['constructor', 'if', 'for', 'while', 'switch', 'catch']);
  let match = SYMBOL_RE.exec(content);
  while (match) {
    const name = match[1];
    if (!skip.has(name) && !name.startsWith('_')) {
      symbols.push({ name, index: match.index });
    }
    match = SYMBOL_RE.exec(content);
  }
  return symbols;
}

function countExternalReferences(repoRoot, symbol, definingFile) {
  const files = walkFiles(repoRoot, (file) => /\.(ts|tsx|js|jsx)$/.test(file));
  const pattern = new RegExp(`\\b${symbol}\\b`);
  let external = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(pattern);
    if (!matches) {
      continue;
    }
    if (path.normalize(file) === path.normalize(definingFile)) {
      if (matches.length > 1) {
        external += matches.length - 1;
      }
      continue;
    }
    external += matches.length;
  }

  return external;
}

function removeMethodBlock(content, symbol) {
  const signature = new RegExp(
    `^\\s+(?:async\\s+)?${symbol}\\s*\\([^)]*\\)\\s*(?::\\s*[^{]+)?\\s*\\{`,
    'm',
  );
  const match = signature.exec(content);
  if (!match) {
    return null;
  }

  let braceDepth = 0;
  let started = false;
  let end = match.index;

  for (let i = match.index; i < content.length; i += 1) {
    const char = content[i];
    if (char === '{') {
      braceDepth += 1;
      started = true;
    } else if (char === '}') {
      braceDepth -= 1;
      if (started && braceDepth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end <= match.index) {
    return null;
  }

  let start = match.index;
  while (start > 0 && content[start - 1] !== '\n') {
    start -= 1;
  }

  let blockEnd = end;
  while (blockEnd < content.length && (content[blockEnd] === '\r' || content[blockEnd] === '\n')) {
    blockEnd += 1;
  }

  return content.slice(0, start) + content.slice(blockEnd);
}

function findDeadLocators(repoRoot) {
  const locatorFiles = walkFiles(
    repoRoot,
    (file) => LOCATOR_RE.test(file.replace(/\\/g, '/')) && /\.(ts|tsx|js|jsx)$/.test(file),
  );

  const dead = [];

  for (const filePath of locatorFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const symbols = extractSymbols(content);
    for (const symbol of symbols) {
      const externalRefs = countExternalReferences(repoRoot, symbol.name, filePath);
      if (externalRefs === 0) {
        dead.push({
          tag: 'dead-locator',
          autofix: 'safe',
          symbol: symbol.name,
          file: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
        });
      }
    }
  }

  return dead;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const jsonOutput = args.includes('--json');
  const repoRoot = args.find((arg) => !arg.startsWith('--'));

  if (!repoRoot) {
    console.error('Usage: node scripts/audit-autofix.js <target-repo-root> [--dry-run|--apply] [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(repoRoot);
  const dead = findDeadLocators(resolved);
  const applied = [];

  if (apply) {
    for (const item of dead) {
      const fullPath = path.join(resolved, item.file);
      const updated = removeMethodBlock(fs.readFileSync(fullPath, 'utf8'), item.symbol);
      if (updated) {
        fs.writeFileSync(fullPath, updated);
        applied.push(item);
      }
    }
  }

  const report = {
    mode: apply ? 'apply' : 'dry-run',
    deadLocatorCount: dead.length,
    candidates: dead,
    applied,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  console.log(`Audit autofix — ${resolved} (${report.mode})`);
  console.log(`Dead locator symbols: ${dead.length}`);
  for (const item of dead) {
    console.log(`safe dead-locator ${item.symbol} in ${item.file}`);
  }
  if (apply) {
    console.log(`Applied removals: ${applied.length}`);
  } else if (dead.length > 0) {
    console.log('Dry-run only. Pass --apply to remove confirmed dead symbols.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { findDeadLocators, countExternalReferences, removeMethodBlock };
