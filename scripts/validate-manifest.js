#!/usr/bin/env node
// gavel — validate plugin.yaml manifest against skills/ and agents/

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function readYamlList(content, key) {
  const items = [];
  const lines = content.split(/\r?\n/);
  let inBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (line.startsWith(`${key}:`)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      const match = line.match(/^  - (.+)$/);
      if (match) {
        items.push(match[1].trim());
        continue;
      }
      if (line.trim() !== '' && !line.startsWith(' ')) {
        inBlock = false;
      }
    }
  }

  return items;
}

function readSkillFrontmatter(skillPath) {
  const content = fs.readFileSync(skillPath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const meta = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      meta[kv[1]] = kv[2].trim();
    }
  }
  return meta;
}

function listSkillDirs() {
  const skillsDir = path.join(root, 'skills');
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listAgents() {
  const agentsDir = path.join(root, 'agents');
  return fs
    .readdirSync(agentsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.basename(file, '.md'))
    .sort();
}

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

const pluginPath = path.join(root, 'plugin.yaml');
if (!fs.existsSync(pluginPath)) {
  fail('MISSING: plugin.yaml');
  process.exit(1);
}

const pluginContent = fs.readFileSync(pluginPath, 'utf8');
const manifestSkills = readYamlList(pluginContent, 'provides_skills');
const manifestCommands = readYamlList(pluginContent, 'provides_commands');
const skillDirs = listSkillDirs();
const agents = listAgents();

const publicSkills = new Set(manifestSkills);
const internalSkills = [];

for (const skill of skillDirs) {
  const skillPath = path.join(root, 'skills', skill, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    fail(`MISSING: skills/${skill}/SKILL.md`);
    continue;
  }

  const meta = readSkillFrontmatter(skillPath);
  const isInternal = meta.internal === 'true';

  if (isInternal) {
    internalSkills.push(skill);
    if (publicSkills.has(skill)) {
      fail(`INTERNAL skill listed as public in plugin.yaml: ${skill}`);
    }
    continue;
  }

  if (!publicSkills.has(skill)) {
    fail(`PUBLIC skill missing from plugin.yaml provides_skills: ${skill}`);
  }
}

for (const skill of manifestSkills) {
  const skillPath = path.join(root, 'skills', skill, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    fail(`plugin.yaml lists missing skill: ${skill}`);
  }
}

for (const command of manifestCommands) {
  if (!publicSkills.has(command) && !internalSkills.includes(command)) {
    fail(`plugin.yaml command without matching public skill: ${command}`);
  }
}

const expectedAgents = [
  'gavel-orchestrator',
  'gavel-generator',
  'gavel-healer',
  'gavel-api-specialist',
  'gavel-impact',
  'gavel-fail-audit',
  'gavel-refactor',
];

for (const agent of expectedAgents) {
  if (!agents.includes(agent)) {
    fail(`MISSING agent: agents/${agent}.md`);
  }
}

const adapterTargets = [
  ['AGENTS.md', path.join(root, 'AGENTS.md')],
  ['.cursor/rules/gavel.mdc', path.join(root, '.cursor', 'rules', 'gavel.mdc')],
];

for (const [label, filePath] of adapterTargets) {
  if (!fs.existsSync(filePath)) {
    fail(`MISSING adapter source: ${label}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `Manifest OK: ${manifestSkills.length} public skills, ${internalSkills.length} internal, ${agents.length} agents.`,
);
