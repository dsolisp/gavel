#!/usr/bin/env node
// gavel — mechanical boundary guard: enforces the Boundary Rule
// (test-code artifact → Gavel; workflow artifact → Bailiff / companion)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function ok(message) {
  console.log(`  OK: ${message}`);
}

// --- helpers ---

function readText(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function walkDir(dir, predicate) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, predicate));
    } else if (predicate(entry.name, full)) {
      results.push(path.relative(root, full));
    }
  }
  return results;
}

function parsePluginYaml(text) {
  const skills = [];
  const commands = [];
  let section = null;
  for (const line of text.split('\n')) {
    const m = line.match(/^(\w+):/);
    if (m) {
      section = m[1] === 'provides_skills' || m[1] === 'provides_commands' ? m[1] : null;
      continue;
    }
    if (section) {
      const item = line.match(/^\s*-\s+(\S+)/);
      if (item) {
        if (section === 'provides_skills') skills.push(item[1]);
        else commands.push(item[1]);
      } else if (line.trim() !== '') {
        section = null; // non-list entry ends the section
      }
    }
  }
  return { skills, commands };
}

function coreSkillFiles() {
  const skillsDir = path.join(root, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join('skills', e.name, 'SKILL.md'))
    .filter((rel) => fs.existsSync(path.join(root, rel)));
}

// ============================================================
// Check 1: No Bailiff *code* — planning docs may live under docs/
// ============================================================
console.log('1. Bailiff file check...');
const BAILIFF_DOC_ALLOWLIST = new Set([
  path.normalize('docs/BAILIFF.md'),
]);
const bailiffFiles = walkDir(root, (name) => /bailiff/i.test(name));
const disallowed = bailiffFiles.filter((f) => !BAILIFF_DOC_ALLOWLIST.has(path.normalize(f)));
if (disallowed.length > 0) {
  disallowed.forEach((f) => fail(`Boundary violation: bailiff file found: ${f}`));
} else if (bailiffFiles.length > 0) {
  ok(`No bailiff code; planning docs allowed: ${[...BAILIFF_DOC_ALLOWLIST].join(', ')}`);
} else {
  ok('No bailiff* files in repo');
}

// ============================================================
// Check 2: Companion skills absent from plugin.yaml
// ============================================================
console.log('2. Companion skills in plugin.yaml...');
const companionNames = ['gavel-ci', 'gavel-close', 'gavel-env', 'gavel-hub'];
const plugin = parsePluginYaml(readText('plugin.yaml'));
const allManifested = new Set([...plugin.skills, ...plugin.commands]);
for (const name of companionNames) {
  if (allManifested.has(name)) {
    fail(`Boundary violation: companion skill "${name}" listed in plugin.yaml`);
  }
}
ok('No companion skills in plugin.yaml');

// ============================================================
// Check 3: Core skills reference no companion/ paths
//   Exception: "gavel companion --help" mentions are allowed
// ============================================================
console.log('3. Core skills referencing companion/ paths...');
const skillFiles = coreSkillFiles();
for (const relPath of skillFiles) {
  const content = readText(relPath);
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    // Only flag lines that contain a companion/ path reference
    if (/companion\//.test(line) || /companion\/README/i.test(line)) {
      // Allow the documented "gavel companion --help" exception
      if (/gavel companion --help/.test(line)) continue;
      fail(`Boundary violation: ${relPath}:${i + 1} references companion/ path`);
    }
  }
}
ok('No core skills reference companion/ paths');

// ============================================================
// Check 4: Default help/README do not route first-run users to companion
// ============================================================
console.log('4. README/help routing to companion workflows...');
const publicFacing = ['README.md', 'skills/gavel-help/SKILL.md'];
for (const relPath of publicFacing) {
  if (!fs.existsSync(path.join(root, relPath))) continue;
  const content = readText(relPath);
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    // A line referencing companion/ paths (not gavel companion --help) is routing
    if (/companion\//.test(line) && !/gavel companion --help/.test(line)) {
      fail(`Boundary violation: ${relPath}:${i + 1} routes users to companion/ path`);
    }
  }
}
ok('README and help do not route to companion');

// ============================================================
// Result
// ============================================================
if (failed) {
  console.error('\nBoundary guard FAILED — violations detected.');
  process.exit(1);
}
console.log('\nBoundary guard OK — all Boundary Rule checks passed.');
