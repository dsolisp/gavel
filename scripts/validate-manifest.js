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

function listSkillDirs(baseDir) {
  const skillsDir = path.join(root, baseDir);
  if (!fs.existsSync(skillsDir)) {
    return [];
  }
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
const skillDirs = listSkillDirs('skills');
const companionSkillDirs = listSkillDirs('companion/skills');
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

for (const skill of companionSkillDirs) {
  const skillPath = path.join(root, 'companion/skills', skill, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    fail(`MISSING: companion/skills/${skill}/SKILL.md`);
    continue;
  }
  if (publicSkills.has(skill)) {
    fail(`COMPANION skill listed as core in plugin.yaml: ${skill}`);
  }
}

for (const skill of manifestSkills) {
  const skillPath = path.join(root, 'skills', skill, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    fail(`plugin.yaml lists missing core skill: ${skill}`);
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

// ── Skill-copy sync ──────────────────────────────────────────────────
// Check that AI workspace mirror directories stay in sync with skills/.
// Mirrors live one level above the gavel repo (e.g. ../.cursor/skills/).

const MIRROR_DIRS = [
  ['.cursor/skills', path.join(root, '..', '.cursor', 'skills')],
  ['.qoder/skills', path.join(root, '..', '.qoder', 'skills')],
];

function readSkillVersion(skillDir) {
  const skillMd = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) return null;
  return fs.readFileSync(skillMd, 'utf8').replace(/\r\n/g, '\n');
}

for (const [label, mirrorDir] of MIRROR_DIRS) {
  if (!fs.existsSync(mirrorDir)) continue; // mirror not installed — skip

  const mirrorEntries = fs
    .readdirSync(mirrorDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  // All known source skills (core + companion) for "extra in mirror" check
  const allSourceSkills = new Set([...skillDirs, ...companionSkillDirs]);

  const mirrorGavelSkills = mirrorEntries.filter(
    (name) => name === 'gavel' || name.startsWith('gavel-'),
  );

  // Skills in source but missing from mirror
  for (const skill of skillDirs) {
    if (!mirrorEntries.includes(skill)) {
      fail(`SKILL-SYNC: ${skill} present in skills/ but missing from ${label}/`);
    }
  }

  // Skills in mirror but missing from source (core or companion)
  for (const skill of mirrorGavelSkills) {
    if (!allSourceSkills.has(skill)) {
      fail(`SKILL-SYNC: ${skill} present in ${label}/ but missing from skills/ and companion/skills/`);
    }
  }

  // Version / content mismatches (core skills)
  for (const skill of skillDirs) {
    if (!mirrorEntries.includes(skill)) continue;
    const sourceContent = readSkillVersion(path.join(root, 'skills', skill));
    const mirrorContent = readSkillVersion(path.join(mirrorDir, skill));
    if (sourceContent && mirrorContent && sourceContent !== mirrorContent) {
      fail(`SKILL-SYNC: ${skill} content differs between skills/ and ${label}/`);
    }
  }

  // Version / content mismatches (companion skills)
  for (const skill of companionSkillDirs) {
    if (!mirrorEntries.includes(skill)) continue;
    const sourceContent = readSkillVersion(path.join(root, 'companion', 'skills', skill));
    const mirrorContent = readSkillVersion(path.join(mirrorDir, skill));
    if (sourceContent && mirrorContent && sourceContent !== mirrorContent) {
      fail(`SKILL-SYNC: ${skill} content differs between companion/skills/ and ${label}/`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `Manifest OK: ${manifestSkills.length} core skills, ${companionSkillDirs.length} companion skills, ${internalSkills.length} internal, ${agents.length} agents.`,
);
