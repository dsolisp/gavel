#!/usr/bin/env node
// gavel — documentation drift guardrail for the gavel package itself

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function listSkillDirs(baseDir) {
  const dir = path.join(root, baseDir);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readText(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

const pkg = readJson('package.json');
const version = pkg.version;
const coreSkills = listSkillDirs('skills');
const companionSkills = listSkillDirs('companion/skills');

const parserDir = path.join(root, 'scripts', 'parsers');
const parsers = fs
  .readdirSync(parserDir)
  .filter((file) => file.endsWith('.js') && file !== 'index.js')
  .sort();

const docsReadme = readText('docs/README.md');
const versionLine = docsReadme.match(/Version:\s+\*\*([0-9.]+)\*\*/);
if (!versionLine || versionLine[1] !== version) {
  fail(`docs/README.md version must be **${version}**`);
}

const pluginVersion = readText('plugin.yaml').match(/^version:\s*([0-9.]+)/m);
if (!pluginVersion || pluginVersion[1] !== version) {
  fail(`plugin.yaml version must be ${version}`);
}

const docsToScan = [
  'README.md',
  'QUICKSTART.md',
  'agents/gavel-orchestrator.md',
  'skills/gavel-help/SKILL.md',
  'templates/apply-safe-workflow.md',
];

for (const relPath of docsToScan) {
  const content = readText(relPath);
  const staleCaveats = [...content.matchAll(/available in v(\d+\.\d+\.\d+)/gi)];
  for (const match of staleCaveats) {
    if (compareSemver(match[1], version) <= 0) {
      fail(`${relPath}: stale "available in v${match[1]}" caveat (already shipped in ${version})`);
    }
  }
}

const readme = readText('README.md');
if (readme.includes('fork of ponytail') || readme.includes('git fetch upstream')) {
  fail('README.md still contains ponytail fork/upstream sync language');
}

for (const parser of parsers) {
  const stem = parser.replace('.js', '');
  if (!readme.includes(stem) && !docsReadme.includes(stem)) {
    fail(`docs missing parser reference: ${stem}`);
  }
}

const plugin = readText('plugin.yaml');
for (const skill of coreSkills) {
  if (!plugin.includes(`- ${skill}`)) {
    fail(`plugin.yaml missing core skill: ${skill}`);
  }
}

for (const skill of companionSkills) {
  if (plugin.includes(`- ${skill}`)) {
    fail(`plugin.yaml lists companion skill as core: ${skill}`);
  }
}

const envelopeSchema = readJson('schemas/result-envelope.schema.json');
const envelopeDoc = readText('templates/result-envelope.md');
const embedded = [...envelopeDoc.matchAll(/```json\n([\s\S]*?)```/g)].map((match) => JSON.parse(match[1]));
if (embedded.length !== envelopeSchema.examples.length) {
  fail(`templates/result-envelope.md must embed all ${envelopeSchema.examples.length} schema examples (found ${embedded.length} json blocks)`);
} else {
  envelopeSchema.examples.forEach((example, index) => {
    if (JSON.stringify(example) !== JSON.stringify(embedded[index])) {
      fail(`templates/result-envelope.md: embedded example ${index + 1} drifted from schemas/result-envelope.schema.json`);
    }
  });
}

if (failed) {
  process.exit(1);
}

console.log(
  `Docs OK: version ${version}, ${coreSkills.length} core skills, ${companionSkills.length} companion skills, ${parsers.length} parsers.`,
);

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) {
      return pa[i] - pb[i];
    }
  }
  return 0;
}
