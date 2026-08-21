#!/usr/bin/env node
// gavel — Constitution violation scanner for target automation repos
//
// Usage:
//   node scripts/self-check.js <target-repo-root>
//   node scripts/self-check.js <target-repo-root> --json

const fs = require('fs');
const path = require('path');
const { loadGavelConfig, parseConfigFlag } = require('./load-gavel-config');
const { toSarif, formatFlag } = require('./to-sarif');
const { isExcludedPath } = require('./glob-match');

let config = {};
let allowlist = [];
let scanRoot = '';

// Matches *.spec.*, *.test.*, *.cy.{js,ts} (Cypress), Python test_*/#_test,
// and C# *Test.cs / *Tests.cs (NUnit/xUnit/MSTest) plus *.spec.cs / *.test.cs
const TEST_FILE_RE =
  /\.(spec|test|cy)\.(ts|js|tsx|jsx|py|java|cs|feature)$|(^|\/)(test_.+|.+_test)\.[a-z]+$|(^|\/)[^/]+Tests?\.cs$/;
const LOCATOR_FILE_RE = /locators?\//i;
const ACTION_PAGE_FILE_RE = /(?:pages?|actions?)\//i;

// Recognized skip-marker prefixes; configurable via gavel.config.json skipPrefixes.
const DEFAULT_SKIP_PREFIXES = [
  'SEED-DATA',
  'ENV-LIMIT',
  'HEADLESS',
  'BROKER-DOWN',
  'FLAKY-UPSTREAM',
  'WIP',
  'KNOWN-BUG',
];

function findMatches(content, pattern, filePath = '') {
  const hits = [];
  const lines = content.split('\n');
  const isPython = filePath.endsWith('.py');
  let inBlock = false;
  let blockQuote = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    let isComment = false;

    if (inBlock) {
      isComment = true;
      if (blockQuote === '/*' && trimmed.endsWith('*/')) inBlock = false;
      else if (blockQuote && trimmed.endsWith(blockQuote)) inBlock = false;
      // Handle cases where the closing quote is not at the very end but the line is mostly comment
      else if (blockQuote === '"""' && trimmed.includes('"""')) inBlock = false;
      else if (blockQuote === "'''" && trimmed.includes("'''")) inBlock = false;
    } else {
      if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        isComment = true;
      } else if (trimmed.startsWith('/*')) {
        isComment = true;
        if (!trimmed.endsWith('*/') || trimmed.length < 4) {
          inBlock = true;
          blockQuote = '/*';
        }
      } else if (isPython && (trimmed.startsWith('"""') || trimmed.startsWith("'''"))) {
        isComment = true;
        const q = trimmed.startsWith('"""') ? '"""' : "'''";
        // Check if it ends on the same line (need at least 6 chars for """...""")
        if (trimmed.length < 6 || !trimmed.endsWith(q)) {
          inBlock = true;
          blockQuote = q;
        }
      }
    }

    // Suppression is a finding-filter concern (see isTagIgnored), not a detection-time
    // skip — a line can carry a scoped ignore for one tag while another rule's hit on
    // the same line still needs to surface.
    if (!isComment) {
      if (pattern.global) pattern.lastIndex = 0;
      if (pattern.test(line)) {
        hits.push({ line: i + 1, text: trimmed });
      }
    }
  }
  return hits;
}

function isConfiguredPath(filePath, paths = []) {
  return paths.some((entry) => filePath === entry || filePath.startsWith(`${entry.replace(/\/+$/, '')}/`));
}

function findHardcodedEnvMatches(filePath, content) {
  if (
    !TEST_FILE_RE.test(filePath)
    || LOCATOR_FILE_RE.test(filePath)
    || /(^|\/)(?:config|configs|settings|docs?|snapshots?|__snapshots__|generated)(\/|$)/i.test(filePath)
    || isConfiguredPath(filePath, config.fixturePaths)
    || isConfiguredPath(filePath, config.factoryPaths)
    || scanRoot.replace(/\\/g, '/').includes('/fixtures/sample-repos/')
  ) {
    return [];
  }

  const patterns = [
    /\b(?:fetch|request(?:\.(?:get|post|put|patch|delete))?)\s*\(\s*['"]https?:\/\/(?:[^/'"\s]+\.)?(?:localhost|staging|dev)(?:[.:/]|['"])/i,
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    /https?:\/\/[^'"\s]+:\d{2,5}(?:\/|['"])/,
    /['"](?:\/(?:home|Users)\/|[A-Za-z]:\\+(?:Users|home)\\+)/,
    /\b(?:password|token|secret|api[_-]?key)\s*[:=]\s*['"][^'"]+/i,
  ];
  const maskedLines = maskEnvFallbacks(content).split('\n');
  const hits = new Map();
  for (const pattern of patterns) {
    for (const hit of findMatches(content, pattern, filePath)) {
      // A value that is the fallback default of an env wrapper is not a hardcoded
      // value — the environment variable is the primary source (roadmap #4). We
      // mask *only the fallback expression*, never the whole line: a credential or
      // an LHS `process.env.X = 'literal'` assignment sharing the line is still a
      // real finding. Re-test the masked line — if the value survives masking it
      // lives outside any env-fallback and stands as a violation.
      if (!patternMatches(pattern, maskedLines[hit.line - 1] || '')) continue;
      hits.set(hit.line, { line: hit.line, text: 'hardcoded environment value' });
    }
  }
  return [...hits.values()];
}

// Blank a substring's characters (line offsets preserved) so downstream line
// splitting and matching stay aligned; newlines are kept.
function blankNonNewline(text) {
  return text.replace(/[^\n]/g, ' ');
}

// Env-wrapper call whose parenthesized argument region carries the fallback
// default (may span lines): os.environ.get('X', DEFAULT) / os.getenv('X', DEFAULT)
// / System.getenv(...) / Environment.GetEnvironmentVariable(...).
const ENV_CALL_RE = /\b(?:os\.environ\.get|os\.getenv|System\.getenv|Environment\.GetEnvironmentVariable)\s*\(([\s\S]*?)\)/g;

// Trailing fallback operand after an env access: `process.env.X || DEFAULT`,
// `process.env.X ?? DEFAULT`, or Python `os.getenv('X') or DEFAULT`. An LHS
// assignment `process.env.X = 'literal'` has no ||/??/or operand, so nothing is
// masked and the literal is flagged.
const ENV_ACCESS_SRC = '(?:process\\.env(?:\\.\\w+|\\[[^\\]\\n]*\\])?|(?:os\\.environ\\.get|os\\.getenv|System\\.getenv|Environment\\.GetEnvironmentVariable)\\s*\\([^)\\n]*\\))';
const ENV_FALLBACK_RE = new RegExp(`(${ENV_ACCESS_SRC}\\s*(?:\\|\\||\\?\\?|\\bor\\b)\\s*)(['"][^'"\\n]*['"]|[^;,)\\s\\n]+)`, 'g');

// Mask only the fallback-default expression(s) of env-wrapper accesses.
function maskEnvFallbacks(content) {
  let out = content.replace(ENV_CALL_RE, (m, inner) => m.replace(inner, blankNonNewline(inner)));
  out = out.replace(ENV_FALLBACK_RE, (m, head, operand) => head + blankNonNewline(operand));
  return out;
}

// Stateless single-line test (patterns are non-global today; reset lastIndex
// defensively so a future /g pattern cannot leak state between lines).
function patternMatches(pattern, line) {
  pattern.lastIndex = 0;
  return pattern.test(line);
}

function findDescribeBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];

  for (let start = 0; start < lines.length; start += 1) {
    if (!/\b(?:test\.)?describe\s*\(/.test(lines[start])) {
      continue;
    }
    let depth = 0;
    for (let end = start; end < lines.length; end += 1) {
      depth += (lines[end].match(/\{/g) || []).length;
      depth -= (lines[end].match(/\}/g) || []).length;
      if (depth <= 0 && end > start) {
        blocks.push({ start: start + 1, end: end + 1 });
        break;
      }
    }
  }
  return blocks;
}

function findPostYieldCleanup(content, filePath) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!findMatches(lines[i], /\byield\b/, filePath).length) {
      continue;
    }
    for (let line = i + 1; line < lines.length; line += 1) {
      if (lines[line].trim() && !lines[line].trim().startsWith('#')) {
        return [{ line: line + 1 }];
      }
    }
  }
  return [];
}

function findStateCreationSignals(content, filePath) {
  const patterns = [
    /\bINSERT\s+INTO\b/i,
    /\bfetch\s*\([^,\n]+,\s*\{[^}\n]*\bmethod\s*:\s*['"](?:POST|PUT)['"]/i,
    /\b(?:axios|request|supertest)(?:\s*\([^)]*\))?\s*\.\s*(?:post|put)\s*\(/i,
    /\.(?:PostAsync|PutAsync)\s*\(/i,
  ];
  return patterns.flatMap((pattern) => findMatches(content, pattern, filePath));
}

function cleanupSignals(content, filePath) {
  const hits = findMatches(content, /\b(?:afterEach|tearDown|addfinalizer)\s*\(|\b@AfterEach\b|\[TearDown\]|\[OneTimeTearDown\]|\[TestCleanup\]|\bDisposeAsync\b|\.Dispose\s*\(|\bvoid\s+Dispose\s*\(|\bIDisposable\b|\bIAsyncDisposable\b/, filePath);
  return [...hits, ...findPostYieldCleanup(content, filePath)];
}

function blockForLine(blocks, line, end) {
  return blocks.filter((block) => line >= block.start && line <= block.end)
    .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0] || { start: 1, end };
}

function splitCSharpTestBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let pendingTest = false;
  let depth = 0;
  let inMethod = false;
  let methodBodyDepth = 0;
  let current = null;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();

    if (/^\s*\[(Test\b|TestCase\b|TestCaseSource\b|Fact\b|Theory\b)/.test(trimmed)) {
      pendingTest = true;
    }

    const opens = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;

    for (let j = 0; j < opens; j += 1) {
      if (pendingTest && !inMethod) {
        pendingTest = false;
        inMethod = true;
        depth += 1;
        methodBodyDepth = depth;
        current = { startLine: i + 1, lines: [lines[i]] };
        continue;
      }
      depth += 1;
      if (inMethod && current) current.lines.push(lines[i]);
    }

    for (let j = 0; j < closes; j += 1) {
      depth -= 1;
      if (inMethod && current) current.lines.push(lines[i]);
      if (inMethod && depth < methodBodyDepth) {
        if (current) blocks.push(current);
        inMethod = false;
        current = null;
      }
    }

    if (!opens && !closes && inMethod && current) {
      current.lines.push(lines[i]);
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

function findNoTeardownMatches(filePath, content) {
  if (!TEST_FILE_RE.test(filePath)) return [];
  const isCSharp = filePath.endsWith('.cs');
  const blocks = isCSharp
    ? [{ start: 1, end: content.split('\n').length }]
    : findDescribeBlocks(content);
  const teardown = cleanupSignals(content, filePath);
  return findStateCreationSignals(content, filePath)
    .filter((creation) => {
      const block = blockForLine(blocks, creation.line, content.split('\n').length);
      return !teardown.some(({ line }) => line >= block.start && line <= block.end);
    })
    .map(({ line }) => ({
      line,
      text: 'inline state creation without teardown; misses cross-file fixtures and cannot prove runtime orphaning',
    }));
}

function literalSelector(line) {
  const match = line.match(/(?:\.?\s*(?:locator|Locator)|(?:querySelector(?:All)?|QuerySelector(?:All)?)|\$(?:\$)?|(?:AppiumBy|MobileBy|By)\.XPath|FindElement\s*\(\s*By\.XPath)\s*\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/);
  return match && match.slice(1).find((value) => value !== undefined);
}

function locatorExpressions(content, filePath) {
  const lines = content.split('\n');
  return findMatches(content, /(?:\.?\s*(?:locator|Locator)|(?:querySelector(?:All)?|QuerySelector(?:All)?)|\$(?:\$)?|(?:AppiumBy|MobileBy|By)\.XPath|FindElement\s*\(\s*By\.XPath)\s*\(\s*['"`]/, filePath)
    .map(({ line }) => ({ line, selector: literalSelector(lines[line - 1]) }))
    .filter(({ selector }) => selector !== undefined);
}

function combinatorHops(selector) {
  if (selector.startsWith('xpath=')) return 0;
  const simplified = selector.replace(/\[[^\]]*]|:[\w-]+\([^)]*\)/g, '').trim();
  return simplified ? simplified.split(/\s*>\s*|\s+/).filter(Boolean).length - 1 : 0;
}

function selectorFragility(selector) {
  const contributions = [];
  const add = (label, points) => contributions.push(`${label} ${points > 0 ? '+' : ''}${points}`);
  if (/\b[\w-]+::/.test(selector)) add('XPath axis', 3);
  if (/\[\s*\d+\s*\]|:nth-child\s*\(/.test(selector)) add('positional index', 2);
  if (/\[class[*^$]?=['"][^'"]*(?:sc-|css-)/.test(selector)) add('generated class', 3);
  if (/(?<!@)\btext=|:has-text\s*\(/.test(selector)) add('broad text', 2);
  if (/#\w+_\w+/.test(selector)) add('generated id', 5);
  if (/^(?:\/\/|xpath=)/.test(selector)) add('xpath string', 5);
  const hops = combinatorHops(selector);
  if (hops > 2) add('deep combinators', hops - 2);

  const allowlist = config.selectorAllowlist || {};
  if ((allowlist.componentPrefixes || []).some((prefix) => selector.trim().startsWith(prefix))) add('component prefix', -3);
  if (allowlist.customElements && /(?:^|[\s>])[a-z][\w-]*-[\w-]+/.test(selector)) add('custom element', -2);
  const score = Math.max(0, contributions.reduce((total, entry) => total + Number(entry.match(/-?\d+$/)[0]), 0));
  return { contributions, score };
}

function findComplexLocatorMatches(filePath, content) {
  const isLocatorDir = LOCATOR_FILE_RE.test(filePath);
  const isPageDir = ACTION_PAGE_FILE_RE.test(filePath);
  const isCSharp = filePath.endsWith('.cs');
  const isTestSpec = TEST_FILE_RE.test(filePath);
  if (!isLocatorDir && !isPageDir && !(isCSharp && !isTestSpec)) return [];
  return locatorExpressions(content, filePath)
    .map(({ line, selector }) => ({ line, ...selectorFragility(selector) }))
    .filter(({ score }) => score >= 5)
    .map(({ line, contributions, score }) => ({ line, text: `${contributions.join(', ')} → ${score}` }));
}

function proseLiteral(line) {
  const match = line.match(/(['"])(.*?)\1/);
  return match && isProseValue(match[2]);
}

// A literal is prose (drift-prone product copy) when it contains whitespace or
// ends with sentence punctuation, and is not a numeric/boolean/null constant.
function isProseValue(value) {
  if (value === undefined || value === null) return false;
  const trimmed = value.trim();
  if (/^(?:true|false|null|nil|none)$/i.test(trimmed)) return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return false;
  return /\s/.test(value) || /[.!?]$/.test(value);
}

// Python bare-assert message stripping (roadmap #5): `assert <comparison>, <message>`.
// Only the comparison should be inspected for prose — a prose error message is
// not a brittle assertion. Splits on the first top-level comma outside quotes/brackets.
function stripAssertMessage(line) {
  if (!/^\s*assert\b/.test(line)) return line;
  // `assert (cond, "msg")` is the Python tuple footgun: the whole expression is
  // wrapped in one paren, so the message comma sits at paren-depth 1, not 0. When
  // assert opens directly with `(`, split at that depth too so the message is not
  // scanned as a comparison literal.
  const wrapped = /^\s*assert\s*\(/.test(line);
  let depth = 0;
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === quote && line[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    else if (ch === ',' && (depth === 0 || (wrapped && depth === 1))) return line.slice(0, i);
  }
  return line;
}

// Argument-position / subject-first prose (roadmap #11): inspect the prose of
// the equality matcher's *compared* argument(s), not the first quoted string on
// the line and not a trailing failure-message argument. This catches prose in a
// compared position — `expect(x).toBe("Not found.")`,
// `assertEquals(actual, "Access denied.")` (prose 2nd arg), `Is.EqualTo("Welcome home!")` —
// while ignoring both a prose *subject* before the matcher
// (`"Payment rejected.".Should().Be(actual)` → clean) and a trailing assertion
// *message* argument (`assert.equal(status, 404, "Status should be Not Found.")` → clean).
const MATCHER_CALL_RE = /(?:\.(?:toBe|toEqual|isEqualTo|Be)|Is\.EqualTo|assert\.(?:strictEqual|deepEqual|equal)|assertEquals|assertEqual|AreEqual|equal_to)\s*\(/i;

// Function-style equality assertions compare their first two positional arguments;
// any further argument is a human-readable failure message, not a compared value:
//   assert.equal(actual, expected, msg) / assertEquals(a, b, msg) /
//   Assert.AreEqual(a, b, msg) / unittest self.assertEqual(a, b, msg).
// Method-style matchers (subject.toBe(x) / .Be(x) / Is.EqualTo(x)) take the
// expected value as their first argument; anything after is a because/reason string.
const FUNCTION_STYLE_MATCHER_RE = /^\s*(?:assert\.(?:strictEqual|deepEqual|equal)|assertEquals|assertEqual|AreEqual)\s*\(/i;

function expectedProseLiteral(line) {
  // Scan *every* matcher call on the line, not just the first: FluentAssertions
  // chains expose more than one equality — `x.Should().Be("OK").And.Be("Payment
  // rejected.")` — where a short-token first `.Be` must not shadow prose in a
  // later `.And.Be`. Any compared-position prose literal in any call flags.
  const scanner = new RegExp(MATCHER_CALL_RE.source, 'gi');
  let matcher;
  while ((matcher = scanner.exec(line)) !== null) {
    const openIdx = matcher.index + matcher[0].length - 1;
    const args = matcherArgs(line, openIdx);
    const comparedCount = FUNCTION_STYLE_MATCHER_RE.test(matcher[0]) ? 2 : 1;
    if (args.slice(0, comparedCount).flat().some(isProseValue)) return true;
  }
  return false;
}

// Split the matcher call's balanced argument list (opening at `openIdx`) into
// top-level arguments, returning the string literals found in each. Commas
// inside nested calls, arrays, objects, or string literals never split an
// argument, so the trailing message arg stays a distinct entry that callers can
// drop. Stops when the matcher call's own parens close.
function matcherArgs(line, openIdx) {
  const args = [];
  let current = [];
  let depth = 0;
  let quote = null;
  let buf = '';
  for (let i = openIdx; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === quote && line[i - 1] !== '\\') { current.push(buf); buf = ''; quote = null; } else buf += ch;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth += 1; continue; }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth -= 1;
      if (depth === 0) { args.push(current); break; }
      continue;
    }
    if (ch === ',' && depth === 1) { args.push(current); current = []; }
  }
  return args;
}

function importedConstants(content) {
  const names = new Set();
  for (const match of content.matchAll(/import\s+\{([^}]+)\}|from\s+\S+\s+import\s+([A-Z][A-Z0-9_]*)|import\s+static\s+\S+\.([A-Z][A-Z0-9_]*)/g)) {
    for (const group of match.slice(1)) {
      if (!group) continue;
      for (const name of group.match(/[A-Z][A-Z0-9_]*/g) || []) names.add(name);
    }
  }
  return names;
}

function sameFileConstants(content) {
  const names = new Set();
  for (const match of content.matchAll(/(?:const|final\s+\w+|static\s+final\s+\w+)\s+([A-Z][A-Z0-9_]*)|^([A-Z][A-Z0-9_]*)\s*=/gm)) {
    names.add(match[1] || match[2]);
  }
  return names;
}

// Equality-assertion shapes across ecosystems. C# forms: classic Assert.AreEqual,
// NUnit constraint Assert.That(x, Is.EqualTo(y)), and FluentAssertions .Should().Be()
// — including chained forms like .Should().NotBeNull().And.Be(y).
const EQUALITY_ASSERTION_RE = /\.(?:toBe|toEqual|isEqualTo)\s*\(|\bassert\.(?:equal|strictEqual|deepEqual)\s*\(|\b(?:assertEquals|assertEqual|equal_to)\s*\(|\bassert\s+.+\s==\s|\bAssert\.AreEqual\s*\(|\bIs\.EqualTo\s*\(|\.Should\(\)\.Be\s*\(|\.And\.Be\s*\(/;

// Matcher-style equality: the compared value sits in an *argument position*
// (toBe/Be/EqualTo/AreEqual/assertEquals/equal_to…). Excludes the bare
// `assert a == b` form, whose comparison literal is inline, not an argument.
const MATCHER_EQUALITY_RE = /\.(?:toBe|toEqual|isEqualTo)\s*\(|\bassert\.(?:equal|strictEqual|deepEqual)\s*\(|\b(?:assertEquals|assertEqual|equal_to)\s*\(|\bAssert\.AreEqual\s*\(|\bIs\.EqualTo\s*\(|\.Should\(\)\.Be\s*\(|\.And\.Be\s*\(/;

function isEqualityAssertion(line) {
  return EQUALITY_ASSERTION_RE.test(line);
}

function hasMatcherEquality(line) {
  return MATCHER_EQUALITY_RE.test(line);
}

function importedConstantAssertion(line, imported, constants) {
  return (line.match(/\b[A-Z][A-Z0-9_]*\b/g) || [])
    .some((name) => imported.has(name) && !constants.has(name));
}

function findBrittleAssertMatches(filePath, content) {
  if (!TEST_FILE_RE.test(filePath)) return [];
  const lines = content.split('\n');
  const imported = importedConstants(content);
  const constants = sameFileConstants(content);
  return findMatches(content, EQUALITY_ASSERTION_RE, filePath)
    .filter(({ line }) => isEqualityAssertion(lines[line - 1]))
    .filter(({ line }) => {
      // #5: inspect only the comparison, not a trailing Python assert message.
      const comparison = stripAssertMessage(lines[line - 1]);
      if (importedConstantAssertion(comparison, imported, constants)) return true;
      // #11: for matcher-style equality, inspect the *expected argument* literal
      // only. The first quoted string may be the subject (`"actual".Should().Be(x)`),
      // which is not the comparison target — OR-ing proseLiteral there false-positives.
      if (hasMatcherEquality(comparison)) return expectedProseLiteral(comparison);
      // Bare `assert a == "prose"`: the comparison literal is inline, not an argument.
      return proseLiteral(comparison);
    })
    .map(({ line }) => ({ line, text: lines[line - 1].trim() }));
}

// Classify a manual-wait finding by the next 3 lines of context.
//   redundant — the following code already has its own wait/timeout/retry pattern.
//   stale-read — the following code reads DOM state, so the sleep creates a race.
//   intentional — neither; may be a legitimate bot/animation/safety delay.
function classifyManualWaitSubCase(lines, lineNumber) {
  const context = lines.slice(lineNumber, lineNumber + 3).join('\n');
  const redundantPattern =
    /waitFor(?!Timeout)\w+\s*\(|WaitFor(?!Timeout)\w+Async\s*\(|expect\.poll\s*\(|Expect\.Poll|Expect\s*\(|ToBeVisibleAsync\s*\(|cy\.wait\s*\(\s*['"`@]/;
  const staleReadPattern =
    /evaluate\s*\(|EvaluateAsync\s*\(|innerHTML|InnerText|textContent|TextContent|getAttribute|GetAttributeAsync|\$eval/;
  if (redundantPattern.test(context)) return 'redundant';
  if (staleReadPattern.test(context)) return 'stale-read';
  return 'intentional';
}

// Classify whether an intentional wait is replaceable with a state-driven alternative.
// Inspects previous 5 + next 5 lines for polling loops, API calls, or assertions.
// Returns { replaceable: true|false|'unknown', suggestion?: string }
function classifyReplaceability(lines, lineNumber) {
  const start = Math.max(0, lineNumber - 5);
  const end = Math.min(lines.length, lineNumber + 6);
  const context = lines.slice(start, end).join('\n');
  const currentLine = lines[lineNumber] || '';

  // Signal-driven threading.Event (with a .set() caller) is the correct pattern;
  // an unset Event + wait(timeout=N) is a sleep rename, not a remediation — do not
  // short-circuit on .wait(timeout) alone.
  if (/threading\.Event|Event\(\)/.test(context) && /\.set\(\)/.test(context)) {
    return { replaceable: false };
  }
  if (/ManualResetEventSlim|EventWaitHandle/.test(context) && /\.Set\(\)/.test(context)) {
    return { replaceable: false };
  }

  // Polling loop: while condition + sleep (Python time.sleep or C# Thread.Sleep)
  const prevLines = lines.slice(Math.max(0, lineNumber - 3), lineNumber).join('\n');
  if (/\bwhile\b.*:/.test(prevLines) && /time\.sleep/.test(currentLine)) {
    return { replaceable: true, suggestion: 'threading.Event.wait()' };
  }
  if (/\bwhile\s*\(/.test(prevLines) && /Thread\.Sleep/.test(currentLine)) {
    return { replaceable: true, suggestion: 'ManualResetEventSlim.Wait()' };
  }

  // After API call or assertion — likely replaceable with expect.poll() / Expect.Poll
  if (/\b(?:fetch|axios|request|supertest|HttpClient|GetAsync|PostAsync|\.(?:get|post|put|patch|delete))\s*\(/.test(prevLines)
    || /\b(?:expect|assert|Expect|Assert)\b/.test(prevLines)) {
    return { replaceable: true, suggestion: 'expect.poll()' };
  }

  // No signals detected — genuinely intentional or unknown
  return { replaceable: false };
}

// Detect busy-wait polling loops around a time.sleep line.
// Heuristic: preceding 3 lines contain a while header whose condition reads
// a boolean variable/state (not a counter/timer), and no threading.Event or
// time.monotonic() appears within 10 lines.
function isPollingLoop(lines, lineNumber) {
  const currentLine = lines[lineNumber] || '';
  const isPythonSleep = /time\.sleep/.test(currentLine);
  const isCSharpSleep = /Thread\.Sleep/.test(currentLine);
  if (!isPythonSleep && !isCSharpSleep) {
    return false;
  }

  const prevLines = lines.slice(Math.max(0, lineNumber - 3), lineNumber);
  const whileLine = prevLines.find((line) =>
    (isPythonSleep && /\bwhile\b.*:/.test(line)) || (isCSharpSleep && /\bwhile\s*\(/.test(line)),
  );
  if (!whileLine) return false;

  let condition;
  if (isPythonSleep) {
    const conditionMatch = whileLine.match(/\bwhile\s+(.+):/);
    if (!conditionMatch) return false;
    condition = conditionMatch[1].trim();
    if (!/^(not\s+)?(?:[A-Za-z_][A-Za-z0-9_.]*|True|False)$/.test(condition)) return false;
    if (/\b(?:\d+|time\.|monotonic|counter|count|index|attempt|len\(|range\()/.test(condition)) return false;
  } else {
    const conditionMatch = whileLine.match(/\bwhile\s*\(([^)]+)\)/);
    if (!conditionMatch) return false;
    condition = conditionMatch[1].trim();
    if (!/^!?\s*[A-Za-z_][A-Za-z0-9_.]*(\s*(==|!=)\s*(false|true))?$/.test(condition)) return false;
    if (/\b(?:DateTime|TimeSpan|counter|Count|Attempt|\d+)/i.test(condition)) return false;
  }

  const start = Math.max(0, lineNumber - 5);
  const end = Math.min(lines.length, lineNumber + 6);
  const context = lines.slice(start, end).join('\n');
  if (/threading\.Event|time\.monotonic|ManualResetEventSlim|EventWaitHandle/.test(context)) return false;

  return true;
}

// Parse the duration of a manual-wait call from its source line.
//   waitForTimeout(3000), browser.pause(2000), Thread.sleep(1500), Thread.Sleep(1500),
//   WaitForTimeoutAsync(3000), Task.Delay(3000), cy.wait(5000) → ms
//   time.sleep(2), Task.Delay(TimeSpan.FromSeconds(2)) → seconds converted to ms
//   Variables/expressions/unparseable arguments → null (unknown)
function parseManualWaitDuration(text) {
  const msMatch = text.match(
    /(?:waitForTimeout|WaitForTimeoutAsync|browser\.pause|Thread\.sleep|Thread\.Sleep|cy\.wait)\s*\(\s*(\d+)\s*\)?/,
  );
  if (msMatch) return Number(msMatch[1]);
  const taskDelayMsMatch = text.match(/Task\.Delay\s*\(\s*(\d+)\s*\)/);
  if (taskDelayMsMatch) return Number(taskDelayMsMatch[1]);
  const taskDelaySecMatch = text.match(/Task\.Delay\s*\(\s*TimeSpan\.FromSeconds\s*\(\s*(\d+(?:\.\d+)?)\s*\)/);
  if (taskDelaySecMatch) return Math.round(Number(taskDelaySecMatch[1]) * 1000);
  const implicitWaitSecMatch = text.match(/ImplicitWait\s*=\s*TimeSpan\.FromSeconds\s*\(\s*(\d+(?:\.\d+)?)\s*\)/);
  if (implicitWaitSecMatch) return Math.round(Number(implicitWaitSecMatch[1]) * 1000);
  const implicitWaitMsMatch = text.match(/ImplicitWait\s*=\s*TimeSpan\.FromMilliseconds\s*\(\s*(\d+)\s*\)/);
  if (implicitWaitMsMatch) return Number(implicitWaitMsMatch[1]);
  const secMatch = text.match(/time\.sleep\s*\(\s*(\d+(?:\.\d+)?)\s*\)?/);
  if (secMatch) return Math.round(Number(secMatch[1]) * 1000);
  return null;
}

// Recognized skip prefixes suppress skip-marker findings even without a reason
// comment. Matching is case-insensitive and treats hyphens/underscores as equal
// so `SEED-DATA` in config matches `SEED_DATA` in source.
function matchesSkipPrefix(text, prefixes) {
  const normalizedText = text.toUpperCase().replace(/[-_]/g, '');
  return prefixes.some((prefix) => {
    const normalizedPrefix = prefix.toUpperCase().replace(/[-_]/g, '');
    return normalizedText.includes(normalizedPrefix);
  });
}

function getSkipPrefixes() {
  const configured = Array.isArray(config.skipPrefixes) ? config.skipPrefixes : [];
  return [...new Set([...DEFAULT_SKIP_PREFIXES, ...configured])];
}

// Matches `gavel-ignore` / deprecated `gavel-allow`, bare or tag-scoped:
//   gavel-ignore              — wildcard, suppresses every tag on the line (back-compat)
//   gavel-ignore: *           — explicit wildcard
//   gavel-ignore: no-di       — suppresses only that tag
//   gavel-ignore: a, b        — suppresses only the listed tags
const INLINE_IGNORE_RE = /gavel-(?:ignore|allow)(?:\s*:\s*(\*|[\w-]+(?:\s*,\s*[\w-]+)*))?/g;

function isTagIgnored(content, line, tag) {
  const lines = content.split('\n');
  const index = line - 1;
  const context = [lines[index - 1] || '', lines[index] || '', lines[index + 1] || ''].join('\n');

  INLINE_IGNORE_RE.lastIndex = 0;
  let match = INLINE_IGNORE_RE.exec(context);
  while (match) {
    const spec = match[1];
    if (!spec) {
      // Bare gavel-ignore is the exact pattern the ignore-no-reason rule
      // reports; letting it suppress itself would hide accountability gaps.
      return tag !== 'ignore-no-reason';
    }
    if (spec === '*') {
      return true;
    }
    if (spec.split(',').some((entry) => entry.trim() === tag)) {
      return true;
    }
    match = INLINE_IGNORE_RE.exec(context);
  }
  return false;
}

function isAllowlisted(file, tag, line) {
  return allowlist.some((entry) => {
    const fileMatch = entry.file === '*' || entry.file === file;
    const tagMatch = entry.tag === '*' || entry.tag === tag;
    const lineMatch = !entry.line || entry.line === line;
    return fileMatch && tagMatch && lineMatch;
  });
}

function splitTestBlocks(content) {
  const blocks = [];
  const lines = content.split('\n');
  let current = null;
  let depth = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const startsTest = /\b(?:test|it)\s*(?:\.(?:only|skip|fixme|fail))?\s*\(/.test(line);

    if (startsTest && depth === 0) {
      if (current) {
        blocks.push(current);
      }
      current = { startLine: i + 1, lines: [line] };
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      continue;
    }

    if (current) {
      current.lines.push(line);
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      if (depth <= 0) {
        blocks.push(current);
        current = null;
        depth = 0;
      }
    }
  }

  if (current) {
    blocks.push(current);
  }

  return blocks;
}

// Gate 1 for no-di: infrastructure base classes that wire fixture DI in
// [SetUp]/[TearDown] are not spec bodies. Only the no-di rule skips these —
// other test-only rules still need BaseTest.cs as a test file.
const NO_DI_INFRA_RE = /^(?:BaseTest\.cs|.+TestBase\.cs|.+TestsBase\.cs)$/;

function isNoDiInfrastructureFile(filePath) {
  const basename = filePath.replace(/\\/g, '/').replace(/^.*\//, '');
  return NO_DI_INFRA_RE.test(basename);
}

// Gate 2 for no-di: on .cs files, only fire inside methods whose attribute is
// [Test], [TestCase], [TestCaseSource], [Fact], or [Theory]. Constructions in
// [SetUp], [TearDown], etc. are NUnit/xUnit fixture DI, not spec-body violations.
// Strategy: use findMatches for comment-aware detection, then filter by lines
// that fall within a test-method body (tracked via brace depth + attributes).
const CS_ATTR_RE = /^\s*\[(Test\b|TestCase\b|TestCaseSource\b|Fact\b|Theory\b|SetUp\b|OneTimeSetUp\b|TearDown\b|OneTimeTearDown\b|TestInitialize\b|ClassInitialize\b|TestCleanup\b|ClassCleanup\b)/;
const CS_TEST_ATTR_RE = /\[(Test\b|TestCase\b|TestCaseSource\b|Fact\b|Theory\b)/;
const CS_SETUP_ATTR_RE = /\[(SetUp\b|OneTimeSetUp\b|TearDown\b|OneTimeTearDown\b|TestInitialize\b|ClassInitialize\b|TestCleanup\b|ClassCleanup\b)/;
const CS_BRACE_RE = /[{}]/g;

function findCSharpTestMethodMatches(content, pattern, filePath) {
  const allMatches = findMatches(content, pattern, filePath);
  if (allMatches.length === 0) return [];

  const lines = content.split('\n');
  const testMethodLines = new Set();
  let depth = 0;
  let pendingTestAttr = false;
  let inTestMethod = false;
  let methodBodyDepth = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();

    if (CS_ATTR_RE.test(trimmed)) {
      if (CS_TEST_ATTR_RE.test(trimmed)) {
        pendingTestAttr = true;
      } else if (CS_SETUP_ATTR_RE.test(trimmed)) {
        pendingTestAttr = false;
      }
    }

    const braces = trimmed.match(CS_BRACE_RE) || [];

    // Process opens before closes so that `{ }` on one line enters and exits
    // the method in the correct order.
    for (const brace of braces) {
      if (brace === '{') {
        if (pendingTestAttr && !inTestMethod) {
          pendingTestAttr = false;
          depth += 1;
          inTestMethod = true;
          methodBodyDepth = depth;
          continue;
        }
        depth += 1;
      } else {
        if (inTestMethod && depth - 1 < methodBodyDepth) {
          inTestMethod = false;
        }
        depth -= 1;
        if (depth < 0) depth = 0;
      }
    }

    if (inTestMethod) {
      testMethodLines.add(i + 1);
    }
  }

  return allMatches.filter((m) => testMethodLines.has(m.line));
}

// RULES contract (irreversible — frozen at v1.0):
//   id — rule tag (string)
//   severity — self-check/failThreshold vocabulary: blocker | error | warning | info
//   envelopeSeverity — audit envelope vocabulary: blocker | fix | cleanup | delete | report
//   class — constitution | locator | assertion | data | workflow
//   scope — test-only (specs only) | all-files (non-excluded paths)
//   message — one-line finding description
//   remediation — how to fix, referencing AGENTS.md
//   test — detection function
//   confidence (optional) — high | medium | low, heuristic rules only; deterministic rules omit it
const RULES = [
  {
    id: 'expect-in-action',
    severity: 'error',
    envelopeSeverity: 'blocker',
    class: 'assertion',
    scope: 'all-files',
    message: 'Assertion APIs in action/page/locator files',
    remediation: 'Move assertions into spec files; locator, action, and page classes stay assertion-free (AGENTS.md: Page Object Discipline).',
    test: (filePath, content) => {
      if (LOCATOR_FILE_RE.test(filePath) || /pages?\//i.test(filePath) || /actions?\//i.test(filePath)) {
        return findMatches(content, /\b(expect|Expect|assertEquals|assertThat)\s*\(|\bassert\s*\(|\bassert\s+[a-zA-Z(]|\bAssert\.[A-Za-z]\w*\s*\(|\.Should\s*\(\s*\)/g, filePath);
      }
      return [];
    },
  },
  {
    id: 'selector-leak',
    severity: 'error',
    envelopeSeverity: 'fix',
    class: 'locator',
    scope: 'all-files',
    message: 'Raw selector chains outside locator classes',
    remediation: 'Expose the element as a named locator in a locator class and call it by name (AGENTS.md: Selector Boundary Rule).',
    test: (filePath, content) => {
      if (LOCATOR_FILE_RE.test(filePath)) {
        return [];
      }
      if (!/(pages?|actions?|components?)\//i.test(filePath) && !TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const matches = findMatches(
        content,
        /\.(?:getByRole|GetByRole|getByText|GetByText|getByLabel|GetByLabel|getByPlaceholder|GetByPlaceholder|getByTestId|GetByTestId|locator|Locator|findElement(?:s)?|FindElement(?:s)?|find_element(?:s)?)\s*\(|(?:querySelector(?:All)?|QuerySelector(?:All)?)\s*\(|\.closest\s*\(|\.matches\s*\(|\$\$\s*\(|page\.\$\s*\(|\$\s*\(|\bAppiumBy\.[A-Za-z]|\bMobileBy\.[A-Za-z]/g,
        filePath,
      );
      // Python locator-constant unpacking: find_element(*locators.NAME) is NOT a leak
      return matches.filter((m) => {
        const line = content.split('\n')[m.line - 1] || '';
        return !/\*locators?\./.test(line);
      });
    },
  },
  {
    id: 'manual-wait',
    severity: 'error',
    envelopeSeverity: 'blocker',
    class: 'assertion',
    scope: 'all-files',
    message: 'Manual sleeps or arbitrary polling',
    remediation: 'Replace manual waits with the framework\'s native retrying/eventual assertions (AGENTS.md: Assertion Discipline).',
    test: (filePath, content) => {
      const lines = content.split('\n');
      return findMatches(
        content,
        /waitForTimeout\s*\(|page\.waitForTimeout|WaitForTimeoutAsync\s*\(|page\.WaitForTimeoutAsync|time\.sleep\s*\(|Thread\.sleep\s*\(|Thread\.Sleep\s*\(|Task\.Delay\s*\(|cy\.wait\s*\(\s*\d+|browser\.pause\s*\(|WaitForLoadStateAsync\s*\(\s*LoadState\.NetworkIdle|WaitForLoadStateAsync\s*\(\s*["']networkidle["']|waitForLoadState\s*\(\s*['"]networkidle['"]|WaitForLoadStateAsync\s*\(\s*\)|\.Timeouts\(\)\s*\.ImplicitWait\b|ImplicitWait\s*=|manage\(\)\s*\.timeouts\(\)\s*\.implicitlyWait/g,
        filePath,
      ).filter((hit) => {
        if (/Thread\.Sleep|Task\.Delay|time\.sleep|Thread\.sleep|waitForTimeout|WaitForTimeoutAsync|cy\.wait|browser\.pause|ImplicitWait|implicitlyWait/.test(hit.text)) return true;
        return !/\.Until\s*\(\s*ExpectedConditions\b|wait\.Until\s*\(\s*ExpectedConditions\b|Until\s*\(\s*ExpectedConditions\./.test(hit.text);
      }).map((hit) => {
        let subCase = classifyManualWaitSubCase(lines, hit.line);
        const isParameterlessLoadState = /WaitForLoadStateAsync\s*\(\s*\)/.test(hit.text);
        const isLoadStateWait = /WaitForLoadState|waitForLoadState/.test(hit.text);
        const isImplicitWait = /ImplicitWait|implicitlyWait/.test(hit.text);
        const result = {
          ...hit,
          subCase,
          durationMs: parseManualWaitDuration(hit.text),
        };
        if (isParameterlessLoadState) {
          result.confidence = 'low';
        }
        if (isLoadStateWait && subCase === 'intentional') {
          result.suggestion = 'Expect(locator).ToBeVisibleAsync() / WaitForURLAsync';
        }
        if (isLoadStateWait) {
          result.loadStateWait = true;
        }
        if (isImplicitWait) {
          result.implicitWait = true;
        }
        if (isPollingLoop(lines, hit.line - 1)) {
          result.subCase = 'intentional';
          result.pollingLoop = true;
          result.suggestion = filePath.endsWith('.cs')
            ? 'ManualResetEventSlim.Wait()'
            : 'threading.Event.wait()';
        }
        if (result.subCase === 'intentional') {
          const replaceability = classifyReplaceability(lines, hit.line - 1);
          result.replaceable = replaceability.replaceable;
          if (replaceability.suggestion && !result.suggestion) {
            result.suggestion = replaceability.suggestion;
          }
        }
        return result;
      });
    },
  },
  {
    id: 'no-di',
    severity: 'error',
    envelopeSeverity: 'blocker',
    class: 'constitution',
    scope: 'test-only',
    message: 'Direct page object construction in specs',
    remediation: 'Inject page objects through the runner\'s fixture/DI mechanism (AGENTS.md: Test Constitution MUST DO #1).',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const constructionRe = /\bnew\s+[A-Z][A-Za-z0-9_]*(Page|Actions?|Component|Locators?)\s*\(/g;
      if (isNoDiInfrastructureFile(filePath)) {
        return [];
      }
      if (filePath.endsWith('.cs')) {
        return findCSharpTestMethodMatches(content, constructionRe, filePath);
      }
      return findMatches(content, constructionRe, filePath);
    },
  },
  {
    id: 'no-step',
    severity: 'warning',
    envelopeSeverity: 'fix',
    class: 'workflow',
    scope: 'test-only',
    message: 'Large specs without step grouping',
    remediation: 'Group multi-test specs with the runner\'s native step primitive, e.g. test.step() (AGENTS.md: Test Constitution MUST DO #4).',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath) || filePath.endsWith('.feature')) {
        return [];
      }
      // gavel: no-step — NUnit/Playwright.NET has no test.step() analog in v0.10.0; defer C# grouping
      if (filePath.endsWith('.cs')) {
        return [];
      }
      const testCount = (content.match(/\b(?:test|it)\s*\(/g) || []).length;
      const stepCount = (content.match(/test\.step\s*\(/g) || []).length;
      if (testCount >= 2 && stepCount === 0 && content.split('\n').length > 80) {
        return [{ line: 1, text: 'spec has multiple tests and no test.step() grouping' }];
      }
      return [];
    },
  },
  {
    id: 'bare-test-fail',
    severity: 'warning',
    envelopeSeverity: 'fix',
    class: 'workflow',
    scope: 'test-only',
    message: 'test.fail() without issue tracker reference',
    remediation: 'Add a bug/ticket reference next to the expected-failure marker (AGENTS.md: Expected-Failure Expiry Policy).',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const hits = [];
      const lines = content.split('\n');
      const ticketRe = /[A-Z][A-Z0-9]+-\d+|PROJ-\d+|#\d+/;
      const isCSharp = filePath.endsWith('.cs');
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        // JS/Python patterns
        if (/\btest\.fail\s*\(|\bit\.failing\s*\(|\bpytest\.mark\.xfail\b/.test(line)) {
          const context = `${lines[i - 1] || ''}\n${line}\n${lines[i + 1] || ''}`;
          if (!ticketRe.test(context)) {
            hits.push({ line: i + 1, text: line.trim() });
          }
          continue;
        }
        if (!isCSharp) continue;
        // C#: Assert.Fail( without ticket
        if (/\bAssert\.Fail\s*\(/.test(line) && !/\bAssert\.Throws</.test(line)) {
          const context = `${lines[i - 1] || ''}\n${line}\n${lines[i + 1] || ''}`;
          if (!ticketRe.test(context)) {
            hits.push({ line: i + 1, text: line.trim() });
          }
          continue;
        }
        // C#: bare Assert.Throws< without follow-up assert and no ticket
        if (/\bAssert\.Throws(?:Async)?<[^>]*>\s*\(/.test(line)) {
          const context = `${lines[i - 1] || ''}\n${line}\n${lines[i + 1] || ''}`;
          if (ticketRe.test(context)) continue;
          const hasFollowUp = (i + 1 < lines.length && /\b(?:Assert\.That|Expect\s*\(|Assert\.AreEqual|\.Should\s*\()/.test(lines[i + 1]))
            || (i + 2 < lines.length && /\b(?:Assert\.That|Expect\s*\(|Assert\.AreEqual|\.Should\s*\()/.test(lines[i + 2]));
          if (hasFollowUp) continue;
          const allMatches = findMatches(content, /\b(?:Assert\.That|Expect\s*\(|Assert\.AreEqual|Assert\.Fail|\.Should\s*\()/, filePath);
          const methodAsserts = allMatches.filter((m) => m.line !== i + 1);
          if (methodAsserts.length === 0) {
            hits.push({ line: i + 1, text: line.trim() });
          }
        }
      }
      return hits;
    },
  },
  {
    id: 'test-fail-order',
    severity: 'error',
    envelopeSeverity: 'fix',
    class: 'workflow',
    scope: 'test-only',
    message: 'test.fail() must precede assertions in the same test',
    remediation: 'Move the expected-failure marker above the first assertion in the test block (AGENTS.md: Test Constitution MUST DO #7).',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const isCSharp = filePath.endsWith('.cs');
      const hits = [];

      if (!isCSharp) {
        for (const block of splitTestBlocks(content)) {
          const failIdx = block.lines.findIndex((line) =>
            /\btest\.fail\s*\(|\bit\.failing\s*\(/.test(line),
          );
          if (failIdx < 0) {
            continue;
          }
          const assertIdx = block.lines.findIndex((line) =>
            /\bexpect\s*\(|\bassert\b|\bassertEquals\b|\bassertThat\b/.test(line),
          );
          if (assertIdx >= 0 && failIdx > assertIdx) {
            hits.push({
              line: block.startLine + failIdx,
              text: block.lines[failIdx].trim(),
            });
          }
        }
      } else {
        // C#: Assert.Fail after assert in same method
        for (const block of splitCSharpTestBlocks(content)) {
          const assertIdx = block.lines.findIndex((line) =>
            /\b(?:Assert\.That|Expect\s*\(|Assert\.AreEqual|\.Should\s*\()/.test(line),
          );
          const failIdx = block.lines.findIndex((line) =>
            /\bAssert\.Fail\s*\(/.test(line),
          );
          if (assertIdx >= 0 && failIdx > assertIdx) {
            hits.push({
              line: block.startLine + failIdx,
              text: block.lines[failIdx].trim(),
            });
          }
        }
        // C#: [Test(Order=n)] suite-order coupling
        if (/\[Test\s*\([^\)]*Order\s*=/.test(content)) {
          const orderedLines = findMatches(content, /\[Test\s*\([^\)]*Order\s*=/, filePath);
          if (orderedLines.length > 0) {
            hits.push({
              line: orderedLines[0].line,
              text: orderedLines[0].text,
            });
          }
        }
      }

      return hits;
    },
  },
  {
    id: 'skip-marker',
    severity: 'warning',
    envelopeSeverity: 'fix',
    class: 'workflow',
    scope: 'test-only',
    message: 'Skip, quarantine, or WIP marker without reason',
    remediation: 'Add a reason and ticket reference to the skip/quarantine/WIP marker (AGENTS.md: Expected-Failure Expiry Policy).',
    test: (filePath, content) => {
      if (!TEST_FILE_RE.test(filePath)) {
        return [];
      }
      const hits = [];
      const lines = content.split('\n');
      const skipPrefixes = getSkipPrefixes();
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!/\btest\.skip\s*\(|\btest\.fixme\s*\(|\bit\.skip\s*\(|\b@wip\b|\b@quarantine\b|\b@flaky\b|@pytest\.mark\.skip\b|\[Ignore(?:\("|\])|\bAssert\.Ignore\s*\(|\[Fact\s*\(\s*Skip\s*=|\[Theory\s*\(\s*Skip\s*=/.test(line)) {
          continue;
        }
        const context = `${lines[i - 1] || ''}\n${line}\n${lines[i + 1] || ''}`;
        const hasReason = /reason:|\/\/|\/\*|because|ticket|[A-Z][A-Z0-9]+-\d+/.test(context);
        const hasRecognizedPrefix = matchesSkipPrefix(context, skipPrefixes);
        if (!hasReason && !hasRecognizedPrefix) {
          hits.push({ line: i + 1, text: line.trim() });
        }
      }
      return hits;
    },
  },
  {
    id: 'ignore-no-reason',
    severity: 'info',
    envelopeSeverity: 'report',
    class: 'workflow',
    scope: 'all-files',
    message: 'Bare gavel-ignore without tag or reason',
    remediation: 'Use gavel-ignore: <tag> with a reason comment, or remove the suppression (AGENTS.md: Expected-Failure Expiry Policy).',
    test: (filePath, content) => {
      // Context-aware: only fire on test, locator, or action/page files.
      const isTestFile = TEST_FILE_RE.test(filePath);
      const isLocatorFile = LOCATOR_FILE_RE.test(filePath);
      const isActionPageFile = ACTION_PAGE_FILE_RE.test(filePath);
      if (!isTestFile && !isLocatorFile && !isActionPageFile) {
        return [];
      }

      const hits = [];
      const lines = content.split('\n');
      const reasonRe = /reason|because|ticket|TODO|FIXME|[A-Z][A-Z0-9]+-\d+|explain/i;
      const bareIgnoreRe = /\bgavel-ignore\b(?!\s*:)/g;
      const isMd = filePath.endsWith('.md');
      let inFencedBlock = false;

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const trimmed = line.trim();

        // Track fenced code blocks in .md files
        if (isMd && trimmed.startsWith('```')) {
          inFencedBlock = !inFencedBlock;
          continue;
        }

        bareIgnoreRe.lastIndex = 0;
        const match = bareIgnoreRe.exec(line);
        if (!match) {
          continue;
        }

        // Suppress inside fenced code blocks in .md files
        if (inFencedBlock) {
          continue;
        }

        // Suppress when gavel-ignore appears in a string literal (quoted context)
        const before = line.slice(0, match.index);
        const singleQ = (before.match(/'/g) || []).length;
        const doubleQ = (before.match(/"/g) || []).length;
        const backtickQ = (before.match(/`/g) || []).length;
        if (singleQ % 2 === 1 || doubleQ % 2 === 1 || backtickQ % 2 === 1) {
          continue;
        }

        // Deterministic: ignore must live inside a comment on this line.
        const slashIdx = line.indexOf('//');
        const hashIdx = line.indexOf('#');
        const commentStart = Math.min(
          slashIdx >= 0 ? slashIdx : Infinity,
          hashIdx >= 0 ? hashIdx : Infinity,
        );
        if (commentStart === Infinity || match.index < commentStart) {
          continue;
        }

        const context = `${lines[i - 1] || ''}\n${line}\n${lines[i + 1] || ''}`;
        if (!reasonRe.test(context)) {
          hits.push({ line: i + 1, text: trimmed });
        }
      }
      return hits;
    },
  },
  {
    id: 'hardcoded-env',
    severity: 'error',
    envelopeSeverity: 'blocker',
    class: 'data',
    scope: 'test-only',
    message: 'Hardcoded environment value in a test spec',
    remediation: 'Use environment variables, .env files, or config modules instead of hardcoded URLs, paths, IPs, ports, or credentials (AGENTS.md: Test Constitution WON\'T DO #3).',
    test: findHardcodedEnvMatches,
  },
  {
    id: 'no-teardown',
    severity: 'info',
    envelopeSeverity: 'report',
    class: 'data',
    scope: 'test-only',
    confidence: 'low',
    message: 'Inline state creation without file-local teardown; misses cross-file fixtures and cannot prove runtime orphaning',
    remediation: 'Add cleanup in the same file or suite with afterEach, tearDown, addfinalizer, post-yield teardown, or @AfterEach. This static rule cannot assess cross-file fixtures or runtime orphaning.',
    test: findNoTeardownMatches,
  },
  {
    id: 'complex-locator',
    severity: 'info',
    envelopeSeverity: 'report',
    class: 'locator',
    scope: 'all-files',
    confidence: 'low',
    message: 'Fragile locator expression scored at least 5',
    remediation: 'Use Locator Priority rung 1 accessibility locators before stable test IDs, structural selectors, or XPath (AGENTS.md: Locator Priority).',
    test: findComplexLocatorMatches,
  },
  {
    id: 'brittle-assert',
    severity: 'warning',
    envelopeSeverity: 'fix',
    class: 'assertion',
    scope: 'test-only',
    confidence: 'medium',
    message: 'Equality assertion against prose likely to drift with product copy',
    remediation: 'Use a native partial matcher: Playwright toContain() or expect(locator).toHaveText(/partial/); pytest assert "substring" in value; JUnit assertThat(actual).contains(expected); Cypress should(\'contain\', \'partial\').',
    test: findBrittleAssertMatches,
  },
];

const DEFAULT_EXCLUDE_PATHS = ['scripts/**', 'fixtures/**', 'tools/**', 'utility_scripts/**'];

function shouldRunRule(rule, relPath) {
  if (rule.scope === 'test-only' && !TEST_FILE_RE.test(relPath)) {
    return false;
  }
  return true;
}

const RULE_SEVERITY = Object.fromEntries(RULES.map((rule) => [rule.id, rule.severity]));
const RULE_META = Object.fromEntries(RULES.map((rule) => [rule.id, rule]));

// Concise, agent-actionable remediation hints keyed by rule id (roadmap #1).
// Distinct from the verbose `remediation` field on each rule (which references
// AGENTS.md): a `fix:` hint is the one-line path an AI agent follows. The RULES
// contract stays frozen at v1.0 — hints live here, not on the rule objects.
// manual-wait is intentionally absent: its hint is context-aware (see manualWaitFixHint, #2).
const FIX_HINTS = {
  'expect-in-action': 'move the assertion into a spec file; keep locator/action/page classes assertion-free',
  'selector-leak': 'extract the selector to a named locator in a locator class and call it by name',
  'no-di': 'inject the page object through the runner fixture/DI mechanism instead of constructing it',
  'no-step': 'group the flow with the runner native step primitive (e.g. test.step())',
  'bare-test-fail': 'add a bug/ticket reference next to the expected-failure marker',
  'test-fail-order': 'move the expected-failure marker above the first assertion in the test block',
  'skip-marker': 'add a reason and ticket reference to the skip/quarantine/WIP marker',
  'ignore-no-reason': 'use gavel-ignore: <tag> with a reason comment, or remove the suppression',
  'hardcoded-env': 'read the value from an env var, .env file, or config module',
  'no-teardown': 'add teardown in the same file/suite (afterEach, tearDown, addfinalizer, post-yield, @AfterEach)',
  'complex-locator': 'prefer a rung-1 accessibility locator or stable test id over structural/XPath selectors',
  'brittle-assert': 'use a partial matcher (toContain / toHaveText(/partial/); "substring" in value; assertThat(actual).contains(expected))',
  'test-id-duplicate': 'make the test id unique per spec, or consolidate the duplicated tests',
  'test-id-gap': 'renumber to close the gap, or document the intentional skip in the id scheme',
};

// Context-aware manual-wait fix hint driven by subCase/replaceable (roadmap #2).
// Returns null when the wait cannot be classified.
function manualWaitFixHint(finding) {
  switch (finding.subCase) {
    case 'redundant':
      return 'remove — subsequent code already waits';
    case 'stale-read':
      if (finding.loadStateWait && finding.file && finding.file.endsWith('.cs')) {
        return 'replace with Expect(locator).ToBeVisibleAsync() / WaitForURLAsync on the specific DOM state';
      }
      return 'replace with expect.poll / pollUntil on the specific DOM state';
    case 'intentional':
      if (finding.implicitWait) {
        return 'replace ImplicitWait with WebDriverWait / wait.Until(ExpectedConditions.*) or Expect on observable state';
      }
      if (finding.replaceable === true) {
        return `replace with ${finding.suggestion || 'a signal-driven wait'} (see gavel-refactor)`;
      }
      return 'rename for clarity or gavel-ignore with a reason';
    default:
      return null;
  }
}

// Context-aware selector-leak fix hint: MobileBy is deprecated, steer to AppiumBy.
function selectorLeakFixHint(finding) {
  if (/MobileBy\./.test(finding.text || '')) {
    return 'MobileBy is deprecated — use AppiumBy.*; extract the selector to a named locator in a locator class';
  }
  return FIX_HINTS['selector-leak'];
}

// Resolve the fix hint for a finding: context-aware for manual-wait and selector-leak, static otherwise.
function fixHintFor(finding) {
  if (finding.tag === 'manual-wait') {
    return manualWaitFixHint(finding);
  }
  if (finding.tag === 'selector-leak') {
    return selectorLeakFixHint(finding);
  }
  return FIX_HINTS[finding.tag] || null;
}

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'bin',
  'obj',
  'packages',
  '.vs',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
  'allure-results',
  'allure-report',
  '.next',
  '.nuxt',
  'out',
  '.venv',
  'venv',
  'venv-enhanced',
  '.venv-ci',
  '.claude',
  '.qoder',
  '.cursor',
  '.vscode',
]);

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|py|java|cs|feature)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanTestIds(files, repoRoot) {
  if (!config.testIdPrefix && !config.testIdPattern) {
    return [];
  }

  const pattern = new RegExp(
    config.testIdPattern || `${config.testIdPrefix}-(\\d+)`,
    'g',
  );
  const ids = new Map();
  const findings = [];

  for (const filePath of files) {
    const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    if (!TEST_FILE_RE.test(relPath)) {
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    let match = pattern.exec(content);
    while (match) {
      const id = match[0];
      if (!ids.has(id)) {
        ids.set(id, []);
      }
      ids.get(id).push(relPath);
      match = pattern.exec(content);
    }
    pattern.lastIndex = 0;
  }

  for (const [id, locations] of ids.entries()) {
    if (locations.length > 1) {
      findings.push({
        tag: 'test-id-duplicate',
        description: 'Duplicate test ID across specs',
        file: locations[0],
        line: 1,
        text: `${id} appears in ${locations.join(', ')}`,
      });
    }
  }

  const numericIds = [...ids.keys()]
    .map((id) => {
      const match = id.match(/(\d+)$/);
      return match ? Number(match[1]) : null;
    })
    .filter((value) => value !== null)
    .sort((a, b) => a - b);

  if (numericIds.length >= 2 && config.enforceConsecutiveTestIds) {
    for (let i = 1; i < numericIds.length; i += 1) {
      if (numericIds[i] - numericIds[i - 1] > 1) {
        findings.push({
          tag: 'test-id-gap',
          description: 'Gap in consecutive test ID sequence',
          file: 'suite',
          line: 1,
          text: `Missing IDs between ${numericIds[i - 1]} and ${numericIds[i]}`,
        });
        break;
      }
    }
  }

  return findings;
}

function main() {
  const { args, configPath, preset } = parseConfigFlag(process.argv.slice(2));
  const jsonOutput = args.includes('--json');
  const format = formatFlag(args);
  if (format && format !== 'sarif') {
    console.error('Usage: --format supports only "sarif"');
    process.exit(2);
  }
  const targetRoot = args.find((arg) => !arg.startsWith('--') && arg !== 'sarif');

  if (!targetRoot) {
    console.error('Usage: node scripts/self-check.js <target-repo-root> [--json]');
    process.exit(2);
  }

  const resolvedRoot = path.resolve(targetRoot);
  if (!fs.existsSync(resolvedRoot)) {
    console.error(`Target path does not exist: ${resolvedRoot}`);
    process.exit(2);
  }

  try {
    config = loadGavelConfig(resolvedRoot, { configPath, cwd: process.cwd(), preset });
    allowlist = Array.isArray(config.allowlist) ? config.allowlist : [];
    scanRoot = resolvedRoot;
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const findings = [];
  const excludePaths = config.excludePaths ?? DEFAULT_EXCLUDE_PATHS;
  const usingDefaultExcludePaths = !config.excludePaths;
  if (usingDefaultExcludePaths && !jsonOutput && !format && DEFAULT_EXCLUDE_PATHS.length > 0) {
    console.error(`Note: excluding ${DEFAULT_EXCLUDE_PATHS.length} default paths (${DEFAULT_EXCLUDE_PATHS.join(', ')}). Set "excludePaths": [] in gavel.config.json to scan all paths.`);
  }
  const walked = walkFiles(resolvedRoot);
  const scanned = [];
  let excludedFileCount = 0;

  for (const filePath of walked) {
    const relPath = path.relative(resolvedRoot, filePath).replace(/\\/g, '/');
    if (isExcludedPath(relPath, excludePaths)) {
      excludedFileCount += 1;
      continue;
    }
    scanned.push(filePath);
  }

  for (const filePath of scanned) {
    const relPath = path.relative(resolvedRoot, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    for (const rule of RULES) {
      if (!shouldRunRule(rule, relPath)) {
        continue;
      }
      const hits = rule.test(relPath, content);
      for (const hit of hits) {
        if (isAllowlisted(relPath, rule.id, hit.line) || isTagIgnored(content, hit.line, rule.id)) {
          continue;
        }
        const finding = {
          tag: rule.id,
          description: rule.message,
          file: relPath,
          line: hit.line,
          text: hit.text,
        };
        if (hit.subCase) {
          finding.subCase = hit.subCase;
          if (hit.subCase === 'intentional') {
            if (hit.replaceable === true) {
              finding.severity = 'info';
              finding.envelopeSeverity = 'report';
            } else {
              finding.severity = 'warning';
              finding.envelopeSeverity = 'fix';
            }
          } else {
            finding.severity = 'error';
            finding.envelopeSeverity = 'blocker';
          }
        }
        if (hit.replaceable !== undefined) {
          finding.replaceable = hit.replaceable;
        }
        if (hit.suggestion) {
          finding.suggestion = hit.suggestion;
        }
        if (hit.pollingLoop) {
          finding.pollingLoop = true;
        }
        if (hit.durationMs !== undefined) {
          finding.durationMs = hit.durationMs;
        }
        if (hit.confidence) {
          finding.confidence = hit.confidence;
        }
        if (hit.implicitWait) {
          finding.implicitWait = true;
        }
        const fix = fixHintFor(finding);
        if (fix) {
          finding.fix = fix;
        }
        findings.push(finding);
      }
    }
  }

  findings.push(...scanTestIds(scanned, resolvedRoot));

  // Attach fix hints uniformly: test-id findings are pushed outside the per-rule
  // loop above, so this pass guarantees every violation carries a `fix:` hint.
  for (const finding of findings) {
    if (!finding.fix) {
      const fix = fixHintFor(finding);
      if (fix) finding.fix = fix;
    }
  }

  findings.sort((a, b) => a.tag.localeCompare(b.tag) || a.file.localeCompare(b.file));

  const summary = findings.reduce((acc, finding) => {
    acc[finding.tag] = (acc[finding.tag] || 0) + 1;
    return acc;
  }, {});

  const report = {
    target: resolvedRoot,
    scannedFiles: scanned.length,
    excludedFileCount,
    violationCount: findings.length,
    summary,
    findings,
  };

  if (jsonOutput) {
    // fs.writeSync (not console.log) so large payloads fully flush before process.exit.
    fs.writeSync(1, `${JSON.stringify(report, null, 2)}\n`);
    process.exit(findings.length > 0 ? 1 : 0);
  }

  if (format === 'sarif') {
    const sarif = toSarif(findings.map((finding) => ({
      tag: finding.tag,
      severity: finding.severity || RULE_SEVERITY[finding.tag] || 'warning',
      message: finding.description,
      file: finding.file,
      line: finding.line,
      snippet: finding.text,
      fix: finding.fix,
    })), RULE_META);
    fs.writeSync(1, `${JSON.stringify(sarif, null, 2)}\n`);
    process.exit(findings.length > 0 ? 1 : 0);
  }

  console.log(`Gavel self-check — ${resolvedRoot}`);
  console.log(`Scanned ${scanned.length} files. Excluded: ${excludedFileCount}. Violations: ${findings.length}`);

  if (findings.length === 0) {
    console.log('No Constitution violations detected.');
    process.exit(0);
  }

  for (const finding of findings) {
    const fixSuffix = finding.fix ? `\n  fix: ${finding.fix}` : '';
    console.log(`${finding.tag} ${finding.file}:${finding.line} — ${finding.text}${fixSuffix}`);
  }

  console.log('\nSummary:');
  for (const [tag, count] of Object.entries(summary)) {
    console.log(`  ${tag}: ${count}`);
  }

  process.exit(1);
}

module.exports = { RULES, findMatches, TEST_FILE_RE, parseManualWaitDuration, FIX_HINTS, manualWaitFixHint, fixHintFor, isNoDiInfrastructureFile, splitCSharpTestBlocks };

if (require.main === module) {
  main();
}
