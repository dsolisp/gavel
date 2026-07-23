#!/usr/bin/env node
// gavel — multi-framework tag extraction for test discovery
//
// Usage:
//   node scripts/extract-tags.js <repo-root> [--framework auto|playwright|pytest|junit|nunit|cucumber]
//   node scripts/extract-tags.js <repo-root> --tag smoke

const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', 'bin', 'obj', 'packages', '.vs', 'dist', 'build', 'coverage',
  'playwright-report', 'test-results', 'allure-results', 'allure-report',
  '.claude', '.qoder', '.cursor', '.vscode',
]);

// Matches real-world test file naming per ecosystem, not just `.spec./.test.`:
//   TS/JS   — login.spec.ts, login.test.tsx
//   pytest  — test_login.py, login_test.py (PEP 8 discovery convention)
//   JUnit   — LoginTest.java, TestLogin.java, LoginTests.java, LoginIT.java
//   NUnit   — LoginTest.cs, LoginTests.cs, login.spec.cs, login.test.cs
//   Cucumber/Behave — any *.feature file (tags live above Feature/Scenario)
function isTestFile(filePath) {
  const base = path.basename(filePath);
  return (
    /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(base) ||
    /^test_[\w-]+\.py$/.test(base) ||
    /^[\w-]+_test\.py$/.test(base) ||
    /\.(spec|test)\.py$/.test(base) ||
    /^(Test[\w-]+|[\w-]+Tests?)\.cs$/.test(base) ||
    /\.(spec|test)\.cs$/.test(base) ||
    /^(Test[A-Z]\w*|[A-Z]\w*(Test|Tests|IT))\.java$/.test(base) ||
    /\.feature$/.test(base)
  );
}

const FRAMEWORK_TAG_PATTERNS = {
  playwright: [
    /(?:describe|it|test)\s*\(\s*['"`]@([\w][\w.-]*)/g,
    /['"`]@([\w][\w.-]*)['"`]/g,
  ],
  pytest: [
    /@pytest\.mark\.([\w][\w.-]*)/g,
  ],
  junit: [
    /@Tag\s*\(\s*['"]([\w][\w.-]*)['"]\s*\)/g,
    /@Category\s*\(\s*([^)]+)\s*\)/g,
  ],
  nunit: [
    /\[(?:Category|TestCategory)\s*\(\s*([^)]+)\s*\)\]/g,
    /\[Trait\s*\(\s*"[^"]+"\s*,\s*"([^"]+)"\s*\)\]/g,
  ],
  cucumber: [
    /^\s*((?:@[\w][\w.-]*(?:\s+|$))+)/gm,
  ],
};

const RESERVED_TAGS = new Set([
  'param', 'returns', 'example', 'override', 'deprecated', 'see', 'throws',
]);

function walkFiles(dir, matcher, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
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

function detectFramework(filePath) {
  if (/\.py$/.test(filePath)) return 'pytest';
  if (/\.feature$/.test(filePath)) return 'cucumber';
  if (/\.java$/.test(filePath)) return 'junit';
  // All C# runners report under the `nunit` label — it is a C#-family key, not a
  // claim the file is NUnit. Tag extraction is runner-agnostic: the `nunit` pattern
  // set matches NUnit [Category], MSTest [TestCategory], and xUnit [Trait] alike.
  // A PackageReference sniff to name the exact runner is intentionally out of scope
  // (it would add a freshness/profile surface — see dotnet-ecosystem-v0.10.0 non-goals).
  if (/\.cs$/.test(filePath)) return 'nunit';
  if (/\.(ts|tsx|js|jsx)$/.test(filePath)) return 'playwright';
  return 'playwright';
}

function addTag(tags, rawTag) {
  const raw = String(rawTag || '').trim();
  if (!raw) return;

  const tagMatches = [...raw.matchAll(/@([\w][\w.-]*)/g)];
  if (tagMatches.length > 0) {
    for (const match of tagMatches) {
      const tag = match[1].toLowerCase();
      if (!RESERVED_TAGS.has(tag)) tags.add(tag);
    }
    return;
  }

  const quoted = [...raw.matchAll(/["']([\w][\w.-]*)["']/g)];
  if (quoted.length > 0) {
    for (const match of quoted) {
      const tag = match[1].toLowerCase();
      if (!RESERVED_TAGS.has(tag)) tags.add(tag);
    }
    return;
  }

  const tag = raw.toLowerCase();
  if (!RESERVED_TAGS.has(tag)) tags.add(tag);
}

function extractTags(repoRoot, framework = 'auto') {
  const specFiles = walkFiles(repoRoot, isTestFile);
  const tagMap = new Map();

  for (const file of specFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fw = framework === 'auto' ? detectFramework(file) : framework;
    const patterns = FRAMEWORK_TAG_PATTERNS[fw] || [];
    const tags = new Set();
    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) {
        addTag(tags, match[1]);
      }
    }
    for (const tag of tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag).push(path.relative(repoRoot, file).replace(/\\/g, '/'));
    }
  }
  return tagMap;
}

function main() {
  const args = process.argv.slice(2);
  const repoRoot = args.find((arg) => !arg.startsWith('--'));
  const fwIdx = args.indexOf('--framework');
  const framework = fwIdx >= 0 ? args[fwIdx + 1] : 'auto';
  const tagIdx = args.indexOf('--tag');
  const filterTag = tagIdx >= 0 ? args[tagIdx + 1] : null;
  const jsonOutput = args.includes('--json');

  if (!repoRoot) {
    console.error('Usage: node scripts/extract-tags.js <repo-root> [--framework auto|playwright|pytest|junit|nunit|cucumber] [--tag <name>] [--json]');
    process.exit(2);
  }

  const resolvedRoot = path.resolve(repoRoot);
  const tagMap = extractTags(resolvedRoot, framework);

  if (filterTag) {
    const files = tagMap.get(filterTag.toLowerCase()) || [];
    if (jsonOutput) {
      console.log(JSON.stringify({ tag: filterTag, files }, null, 2));
    } else {
      console.log(`Tag @${filterTag}: ${files.length} file(s)`);
      for (const file of files) console.log(`- ${file}`);
    }
    return;
  }

  if (jsonOutput) {
    const obj = {};
    for (const [tag, files] of tagMap) obj[tag] = files;
    console.log(JSON.stringify(obj, null, 2));
    return;
  }

  for (const [tag, files] of tagMap) {
    console.log(`@${tag}: ${files.length} file(s)`);
    for (const file of files) console.log(`  - ${file}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractTags, detectFramework, isTestFile };
