#!/usr/bin/env node
// gavel — remediation-adoption scanner (roadmap v0.11.0 #8, #9)
//
// Report-only. Surfaces two adoption gaps that compile + tests never catch:
//   #8 unused-helper  — remediation helpers (wait_for_* / poll_* / retry_*)
//                       defined in lib/support but never called by any test.
//   #9 unused-fixture — DI fixtures defined (Playwright test.extend / pytest
//                       @pytest.fixture) but never consumed by a spec.
//
// A definition counts as *adopted* only when a TEST file references it — a
// helper referenced solely by another helper, or a fixture wired only to
// another fixture, is still an adoption gap for the suite.
//
// Usage:
//   node scripts/adoption-scan.js <target-repo-root> [--json]

const fs = require('fs');
const path = require('path');
const { walkFiles, relPath, EXCLUDED_DIRS } = require('./audit-autofix');
const { TEST_FILE_RE } = require('./self-check');

const REF_CODE_RE = /\.(ts|tsx|js|jsx|py)$/;

// Remediation-helper naming across ecosystems (snake + camel). The roadmap
// anchors on wait_for_* / poll_* / retry_*; camel equivalents cover JS/TS.
const HELPER_NAME_RE = /^(?:wait_for_|waitFor|poll_|pollUntil|pollFor|retry_|retryWith|retryUntil)/;

// Helper definitions live in shared support directories, not in specs.
const HELPER_DIR_RE = /(?:^|\/)(?:lib|libs|support|helpers?|utils?)\//i;

// Fixture definitions live in fixture modules / conftest, not in specs.
const FIXTURE_FILE_RE = /(?:(?:^|\/)fixtures?\/|(?:^|\/)conftest\.py$|(?:^|\/)[\w.-]*fixtures?\.(?:ts|tsx|js|jsx|py)$)/i;

function buildRefCache(repoRoot) {
  const cache = new Map();
  for (const file of walkFiles(repoRoot, (f) => REF_CODE_RE.test(f))) {
    cache.set(path.normalize(file), fs.readFileSync(file, 'utf8'));
  }
  return cache;
}

// Count references to `symbol` that appear inside a TEST file, excluding the
// defining file itself. Adoption is measured by spec usage, not helper-to-helper
// or fixture-to-fixture wiring. Cache keys are absolute paths; TEST_FILE_RE
// matches on the suffix, so the absolute path works directly.
function countTestReferences(symbol, definingFile, cache) {
  const pattern = new RegExp(`\\b${symbol}\\b`);
  const normalizedDefining = path.normalize(definingFile);
  let refs = 0;
  for (const [file, content] of cache) {
    if (file === normalizedDefining) continue;
    if (!TEST_FILE_RE.test(file.replace(/\\/g, '/'))) continue;
    const matches = content.match(pattern);
    if (matches) refs += matches.length;
  }
  return refs;
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

// --- #8 helper extraction ---------------------------------------------------

function extractHelperDefs(content) {
  const defs = [];
  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/g, // TS/JS export function
    /export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g, // TS/JS export const arrow
    /^\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, // Python def
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(content);
    while (match) {
      if (HELPER_NAME_RE.test(match[1])) {
        defs.push({ name: match[1], line: lineOf(content, match.index) });
      }
      match = pattern.exec(content);
    }
  }
  return defs;
}

function findUnusedHelpers(repoRoot, cache = buildRefCache(repoRoot)) {
  const helperFiles = walkFiles(
    repoRoot,
    (file) => HELPER_DIR_RE.test(file.replace(/\\/g, '/'))
      && REF_CODE_RE.test(file)
      && !TEST_FILE_RE.test(file.replace(/\\/g, '/')),
  );
  const gaps = [];
  for (const filePath of helperFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const def of extractHelperDefs(content)) {
      if (countTestReferences(def.name, filePath, cache) === 0) {
        gaps.push({
          tag: 'unused-helper',
          autofix: 'report-only',
          severity: 'report',
          symbol: def.name,
          file: relPath(repoRoot, filePath),
          line: def.line,
          message: 'remediation helper defined but never adopted by a test',
        });
      }
    }
  }
  return gaps;
}

// --- #9 fixture extraction --------------------------------------------------

function matchingBrace(content, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < content.length; i += 1) {
    if (content[i] === '{') depth += 1;
    else if (content[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return content.length;
}

// Playwright / JS fixtures: keys of the object literal passed to `.extend({...})`.
function extractExtendFixtures(content) {
  const defs = [];
  const extendRe = /\.extend\s*(?:<[^>]*>)?\s*\(\s*\{/g;
  let match = extendRe.exec(content);
  while (match) {
    const braceOpen = content.indexOf('{', match.index);
    const braceClose = matchingBrace(content, braceOpen);
    const body = content.slice(braceOpen + 1, braceClose);
    const bodyOffset = braceOpen + 1;
    // Top-level keys only (brace depth 1 within the object body).
    let depth = 0;
    const lines = body.split('\n');
    let cursor = bodyOffset;
    for (const rawLine of lines) {
      if (depth === 0) {
        const key = rawLine.match(/^\s*([A-Za-z_$][\w$]*)\s*:/);
        if (key) {
          defs.push({ name: key[1], line: lineOf(content, cursor) });
        }
      }
      depth += (rawLine.match(/\{/g) || []).length;
      depth -= (rawLine.match(/\}/g) || []).length;
      cursor += rawLine.length + 1;
    }
    match = extendRe.exec(content);
  }
  return defs;
}

// pytest fixtures: `@pytest.fixture` / `@fixture` decorator followed by `def name(`,
// possibly across intervening decorator lines. Line-based to keep the regexes simple.
function extractPytestFixtures(content) {
  const defs = [];
  const lines = content.split('\n');
  let pendingFixture = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*@(?:pytest\.)?fixture\b/.test(line)) {
      pendingFixture = true;
      continue;
    }
    if (!pendingFixture) continue;
    const def = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (def) {
      defs.push({ name: def[1], line: i + 1 });
      pendingFixture = false;
    } else if (!/^\s*@/.test(line) && line.trim() !== '') {
      // Non-decorator, non-def content resets the pending state.
      pendingFixture = false;
    }
  }
  return defs;
}

function findUnusedFixtures(repoRoot, cache = buildRefCache(repoRoot)) {
  const fixtureFiles = walkFiles(
    repoRoot,
    (file) => FIXTURE_FILE_RE.test(file.replace(/\\/g, '/')) && REF_CODE_RE.test(file),
  );
  const gaps = [];
  for (const filePath of fixtureFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const defs = filePath.endsWith('.py')
      ? extractPytestFixtures(content)
      : extractExtendFixtures(content);
    for (const def of defs) {
      if (countTestReferences(def.name, filePath, cache) === 0) {
        gaps.push({
          tag: 'unused-fixture',
          autofix: 'report-only',
          severity: 'report',
          symbol: def.name,
          file: relPath(repoRoot, filePath),
          line: def.line,
          message: 'fixture defined but never consumed by a spec',
        });
      }
    }
  }
  return gaps;
}

function findAdoptionGaps(repoRoot) {
  const cache = buildRefCache(repoRoot);
  return [...findUnusedHelpers(repoRoot, cache), ...findUnusedFixtures(repoRoot, cache)];
}

function formatAdoptionLine(item) {
  const location = item.line ? `${item.file}:L${item.line}` : item.file;
  return `${item.severity} ${item.autofix} ${item.tag} ${item.symbol} — ${item.message}. [${location}]`;
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const repoRoot = args.find((arg) => !arg.startsWith('--'));

  if (!repoRoot) {
    console.error('Usage: node scripts/adoption-scan.js <target-repo-root> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(repoRoot);
  const gaps = findAdoptionGaps(resolved);
  const byTag = gaps.reduce((acc, item) => {
    acc[item.tag] = (acc[item.tag] || 0) + 1;
    return acc;
  }, {});

  if (jsonOutput) {
    console.log(JSON.stringify({ repo: resolved, count: gaps.length, byTag, gaps }, null, 2));
    process.exit(0);
  }

  console.log(`Adoption scan — ${resolved}`);
  console.log(`  Unused remediation helpers: ${byTag['unused-helper'] || 0}`);
  console.log(`  Unused fixtures: ${byTag['unused-fixture'] || 0}`);
  for (const item of gaps) {
    console.log(formatAdoptionLine(item));
  }
  if (gaps.length === 0) {
    console.log('No adoption gaps found.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findUnusedHelpers,
  findUnusedFixtures,
  findAdoptionGaps,
  extractHelperDefs,
  extractExtendFixtures,
  extractPytestFixtures,
  formatAdoptionLine,
  HELPER_NAME_RE,
};
