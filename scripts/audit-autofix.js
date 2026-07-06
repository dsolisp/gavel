#!/usr/bin/env node
// gavel — safe-only audit autofix (dead locators, POMs, factories)
//
// Usage:
//   node scripts/audit-autofix.js <target-repo-root>              # dry-run (default)
//   node scripts/audit-autofix.js <target-repo-root> --apply
//   node scripts/audit-autofix.js <target-repo-root> --json
//   node scripts/audit-autofix.js <target-repo-root> --audit-format

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
  '.venv',
  'venv',
  'venv-enhanced',
  '.venv-ci',
]);

const LOCATOR_RE = /locators?\//i;
const POM_RE = /(?:^|\/)(?:pages?|page-objects?)\//i;
const FACTORY_RE = /(?:^|\/)(?:factories?|test-data|lib\/test-data)\//i;
const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;

const SYMBOL_RE = /^\s+(?:async\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/gm;
const CLASS_EXPORT_RE = /export\s+(?:default\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const FACTORY_FN_RE = /export\s+(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const FACTORY_CONST_RE = /export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g;

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

function relPath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
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

function extractClassNames(content) {
  const names = [];
  let match = CLASS_EXPORT_RE.exec(content);
  while (match) {
    names.push(match[1]);
    match = CLASS_EXPORT_RE.exec(content);
  }
  return names;
}

function extractFactoryExports(content) {
  const names = [];
  let match = FACTORY_FN_RE.exec(content);
  while (match) {
    names.push(match[1]);
    match = FACTORY_FN_RE.exec(content);
  }
  match = FACTORY_CONST_RE.exec(content);
  while (match) {
    names.push(match[1]);
    match = FACTORY_CONST_RE.exec(content);
  }
  return names;
}

function buildContentCache(repoRoot) {
  const cache = new Map();
  const files = walkFiles(repoRoot, (file) => CODE_FILE_RE.test(file));
  for (const file of files) {
    cache.set(path.normalize(file), fs.readFileSync(file, 'utf8'));
  }
  return cache;
}

function countExternalReferences(repoRoot, symbol, definingFile, contentCache) {
  const cache = contentCache || buildContentCache(repoRoot);
  const pattern = new RegExp(`\\b${symbol}\\b`);
  let external = 0;
  const normalizedDefining = path.normalize(definingFile);

  for (const [file, content] of cache) {
    const matches = content.match(pattern);
    if (!matches) {
      continue;
    }
    if (file === normalizedDefining) {
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
    return removeExportedFunctionBlock(content, symbol);
  }

  return removeBraceBlock(content, match.index);
}

function removeExportedFunctionBlock(content, symbol) {
  const signature = new RegExp(
    `^export\\s+(?:async\\s+)?function\\s+${symbol}\\s*\\([^)]*\\)[^{]*\\{`,
    'm',
  );
  const match = signature.exec(content);
  if (!match) {
    return removeExportedConstBlock(content, symbol);
  }
  return removeBraceBlock(content, match.index);
}

function removeExportedConstBlock(content, symbol) {
  const signature = new RegExp(`^export\\s+const\\s+${symbol}\\s*=`, 'm');
  const match = signature.exec(content);
  if (!match) {
    return null;
  }

  let end = match.index;
  if (content.slice(match.index).trimStart().includes('=>')) {
    const braceStart = content.indexOf('{', match.index);
    if (braceStart >= 0) {
      end = findBraceEnd(content, braceStart);
    } else {
      const lineEnd = content.indexOf('\n', match.index);
      end = lineEnd >= 0 ? lineEnd + 1 : content.length;
    }
  } else {
    const semi = content.indexOf(';', match.index);
    end = semi >= 0 ? semi + 1 : content.length;
  }

  let start = match.index;
  while (start > 0 && content[start - 1] !== '\n') {
    start -= 1;
  }
  while (end < content.length && (content[end] === '\r' || content[end] === '\n')) {
    end += 1;
  }
  return content.slice(0, start) + content.slice(end);
}

function findBraceEnd(content, openIndex) {
  let braceDepth = 0;
  let started = false;
  for (let i = openIndex; i < content.length; i += 1) {
    const char = content[i];
    if (char === '{') {
      braceDepth += 1;
      started = true;
    } else if (char === '}') {
      braceDepth -= 1;
      if (started && braceDepth === 0) {
        return i + 1;
      }
    }
  }
  return content.length;
}

function removeBraceBlock(content, startIndex) {
  const braceStart = content.indexOf('{', startIndex);
  if (braceStart < 0) {
    return null;
  }
  const end = findBraceEnd(content, braceStart);
  if (end <= startIndex) {
    return null;
  }

  let start = startIndex;
  while (start > 0 && content[start - 1] !== '\n') {
    start -= 1;
  }
  let blockEnd = end;
  while (blockEnd < content.length && (content[blockEnd] === '\r' || content[blockEnd] === '\n')) {
    blockEnd += 1;
  }
  return content.slice(0, start) + content.slice(blockEnd);
}

function findDeadLocators(repoRoot, contentCache) {
  const cache = contentCache || buildContentCache(repoRoot);
  const locatorFiles = walkFiles(
    repoRoot,
    (file) => LOCATOR_RE.test(file.replace(/\\/g, '/')) && CODE_FILE_RE.test(file),
  );

  const dead = [];

  for (const filePath of locatorFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const symbols = extractSymbols(content);
    for (const symbol of symbols) {
      const externalRefs = countExternalReferences(repoRoot, symbol.name, filePath, cache);
      if (externalRefs === 0) {
        dead.push({
          tag: 'dead-locator',
          autofix: 'safe',
          severity: 'cleanup',
          symbol: symbol.name,
          file: relPath(repoRoot, filePath),
          kind: 'method',
        });
      }
    }
  }

  return dead;
}

function findDeadPoms(repoRoot, contentCache) {
  const cache = contentCache || buildContentCache(repoRoot);
  const pomFiles = walkFiles(
    repoRoot,
    (file) => POM_RE.test(file.replace(/\\/g, '/')) && CODE_FILE_RE.test(file),
  );

  const dead = [];

  for (const filePath of pomFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const classNames = extractClassNames(content);
    if (classNames.length === 0) {
      continue;
    }

    const allUnused = classNames.every(
      (className) => countExternalReferences(repoRoot, className, filePath, cache) === 0,
    );

    if (allUnused) {
      dead.push({
        tag: 'dead-pom',
        autofix: 'safe',
        severity: 'cleanup',
        symbol: classNames.join(','),
        file: relPath(repoRoot, filePath),
        kind: 'file',
      });
    }
  }

  return dead;
}

function findUnusedFactories(repoRoot, contentCache) {
  const cache = contentCache || buildContentCache(repoRoot);
  const factoryFiles = walkFiles(
    repoRoot,
    (file) => FACTORY_RE.test(file.replace(/\\/g, '/')) && CODE_FILE_RE.test(file),
  );

  const dead = [];

  for (const filePath of factoryFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const exports = extractFactoryExports(content);
    for (const exportName of exports) {
      const externalRefs = countExternalReferences(repoRoot, exportName, filePath, cache);
      if (externalRefs === 0) {
        dead.push({
          tag: 'unused-factory',
          autofix: 'safe',
          severity: 'cleanup',
          symbol: exportName,
          file: relPath(repoRoot, filePath),
          kind: 'export',
        });
      }
    }
  }

  return dead;
}

function findAutofixCandidates(repoRoot) {
  const cache = buildContentCache(repoRoot);
  return [...findDeadPoms(repoRoot, cache), ...findUnusedFactories(repoRoot, cache), ...findDeadLocators(repoRoot, cache)];
}

function formatAuditLine(item) {
  const label = item.symbol;
  if (item.tag === 'dead-pom') {
    return `${item.severity} ${item.autofix} ${item.tag} page object never referenced. Delete file. [${item.file}]`;
  }
  if (item.tag === 'unused-factory') {
    return `${item.severity} ${item.autofix} ${item.tag} export never imported. Delete export. [${item.file}]`;
  }
  return `${item.severity} ${item.autofix} ${item.tag} ${label} never referenced. Delete getter. [${item.file}]`;
}

function isFileEmptyOrExportsOnly(content) {
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/import\s+[\s\S]*?;[\r\n]*/g, '')
    .replace(/export\s+[\s\S]*?;[\r\n]*/g, '')
    .replace(/export\s+[\s\S]*?\{[\s\S]*?\}[\r\n]*/g, '')
    .trim();
  return stripped.length === 0;
}

function applyCandidate(repoRoot, item) {
  const fullPath = path.join(repoRoot, item.file);

  if (item.kind === 'file') {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const updated = removeMethodBlock(content, item.symbol);
  if (updated === null) {
    return false;
  }

  if (isFileEmptyOrExportsOnly(updated)) {
    fs.unlinkSync(fullPath);
    return true;
  }

  fs.writeFileSync(fullPath, updated);
  return true;
}

function summarize(candidates) {
  const byTag = {};
  for (const item of candidates) {
    byTag[item.tag] = (byTag[item.tag] || 0) + 1;
  }
  return byTag;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const jsonOutput = args.includes('--json');
  const auditFormat = args.includes('--audit-format');
  const repoRoot = args.find((arg) => !arg.startsWith('--'));

  if (!repoRoot) {
    console.error(
      'Usage: node scripts/audit-autofix.js <target-repo-root> [--apply] [--json] [--audit-format]',
    );
    process.exit(2);
  }

  const resolved = path.resolve(repoRoot);
  const candidates = findAutofixCandidates(resolved);
  const applied = [];

  if (apply) {
    for (const item of candidates) {
      if (applyCandidate(resolved, item)) {
        applied.push(item);
      }
    }
  }

  const report = {
    mode: apply ? 'apply' : 'dry-run',
    candidateCount: candidates.length,
    byTag: summarize(candidates),
    candidates,
    applied,
    auditLines: candidates.map(formatAuditLine),
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  if (auditFormat) {
    for (const line of report.auditLines) {
      console.log(line);
    }
    const counts = report.byTag;
    console.log('');
    console.log('Autofix summary:');
    console.log(`  Dead POMs: ${counts['dead-pom'] || 0}`);
    console.log(`  Unused factories: ${counts['unused-factory'] || 0}`);
    console.log(`  Dead locators: ${counts['dead-locator'] || 0}`);
    console.log(`  Total safe candidates: ${candidates.length}`);
    process.exit(0);
  }

  console.log(`Audit autofix — ${resolved} (${report.mode})`);
  console.log(`Safe candidates: ${candidates.length}`);
  for (const item of candidates) {
    console.log(formatAuditLine(item));
  }
  if (apply) {
    console.log(`Applied removals: ${applied.length}`);
  } else if (candidates.length > 0) {
    console.log('Dry-run only. Pass --apply to remove confirmed dead code.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findDeadLocators,
  findDeadPoms,
  findUnusedFactories,
  findAutofixCandidates,
  formatAuditLine,
  countExternalReferences,
  buildContentCache,
  removeMethodBlock,
  applyCandidate,
};
