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

const enterpriseDoc = readText('docs/ENTERPRISE.md');
const sarifTemplate = readText('templates/github-actions/gavel-audit-sarif.yml');
const expectedPin = `@dsolisp/gavel@${version}`;
if (!sarifTemplate.includes(expectedPin)) {
  fail(`templates/github-actions/gavel-audit-sarif.yml must pin ${expectedPin}`);
}
if (!sarifTemplate.includes('upload-sarif@v3')) {
  fail('templates/github-actions/gavel-audit-sarif.yml must upload SARIF via github/codeql-action/upload-sarif@v3');
}
if (!sarifTemplate.includes('steps.gavel.outcome')) {
  fail('templates/github-actions/gavel-audit-sarif.yml must fail the job when the audit step fails');
}
for (const [doc, needle] of [
  [readme, 'docs/ENTERPRISE.md'],
  [readme, 'templates/github-actions/gavel-audit-sarif.yml'],
  [enterpriseDoc, 'templates/github-actions/gavel-audit-sarif.yml'],
  [enterpriseDoc, 'sonar.sarifReportPaths'],
]) {
  if (!doc.includes(needle)) {
    fail(`missing enterprise CI link or recipe reference: ${needle}`);
  }
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
  if (plugin.includes(`- ${skill}\n`) || plugin.endsWith(`- ${skill}`)) {
    fail(`plugin.yaml lists companion skill as core: ${skill}`);
  }
}

const envelopeSchema = readJson('schemas/result-envelope.schema.json');
const envelopeDoc = readText('templates/result-envelope.md');
const embedded = [...envelopeDoc.matchAll(/```json\r?\n([\s\S]*?)```/g)].map((match) => JSON.parse(match[1]));
if (embedded.length !== envelopeSchema.examples.length) {
  fail(`templates/result-envelope.md must embed all ${envelopeSchema.examples.length} schema examples (found ${embedded.length} json blocks)`);
} else {
  envelopeSchema.examples.forEach((example, index) => {
    if (JSON.stringify(example) !== JSON.stringify(embedded[index])) {
      fail(`templates/result-envelope.md: embedded example ${index + 1} drifted from schemas/result-envelope.schema.json`);
    }
  });
}

// CLI completeness: every `gavel <cmd>` verb wired in scripts/cli.js must appear
// as a row in docs/CLI_MATRIX.md (and vice versa) so the matrix cannot silently
// omit an irreversible command. `explain` and `companion` are inline (not in the
// scripts map) but are still contract verbs the matrix must document.
const cliSource = readText('scripts/cli.js');
const scriptsLiteral = cliSource.match(/const scripts = \{([^}]*)\}/);
if (!scriptsLiteral) {
  fail('scripts/cli.js: could not locate the `const scripts = {...}` command map');
} else {
  const cliMatrix = readText('docs/CLI_MATRIX.md');
  const scriptCommands = [...scriptsLiteral[1].matchAll(/(?:'([^']+)'|([A-Za-z-]+))\s*:/g)].map(
    (m) => m[1] || m[2],
  );
  const inlineCommands = ['explain', 'companion'];
  for (const command of [...scriptCommands, ...inlineCommands]) {
    if (!cliMatrix.includes(`\`gavel ${command}`)) {
      fail(`docs/CLI_MATRIX.md missing row for CLI command: gavel ${command}`);
    }
  }
  const documented = [...cliMatrix.matchAll(/\| `gavel ([a-z][a-z-]*)/g)].map((m) => m[1]);
  const known = new Set([...scriptCommands, ...inlineCommands]);
  for (const command of documented) {
    if (!known.has(command)) {
      fail(`docs/CLI_MATRIX.md documents unknown CLI command: gavel ${command} (not in scripts/cli.js)`);
    }
  }
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
