#!/usr/bin/env node
// gavel — verify all expected skill SKILL.md files exist

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const CORE_SKILLS = [
  'gavel',
  'gavel-review',
  'gavel-audit',
  'gavel-debt',
  'gavel-gain',
  'gavel-help',
  'gavel-detect',
  'gavel-playwright',
  'gavel-selenium',
  'gavel-appium',
  'gavel-cypress',
  'gavel-webdriverio',
  'gavel-cucumber',
  'gavel-robot',
  'gavel-plan',
  'gavel-e2e',
  'gavel-api',
  'gavel-run',
  'gavel-analyze',
  'gavel-impact',
  'gavel-bug',
  'gavel-triage',
  'gavel-auth',
  'gavel-heal',
  'gavel-flake',
  'gavel-init',
  'gavel-self-check',
  'gavel-ci-check',
  'gavel-oms',
  'gavel-pr-prep',
];

const COMPANION_SKILLS = ['gavel-ci', 'gavel-env', 'gavel-hub', 'gavel-close'];

const EXPECTED_AGENTS = [
  'gavel-orchestrator',
  'gavel-generator',
  'gavel-healer',
  'gavel-api-specialist',
  'gavel-impact',
  'gavel-fail-audit',
  'gavel-refactor',
];

let failed = false;

for (const skill of CORE_SKILLS) {
  const skillPath = path.join(root, 'skills', skill, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    console.error(`MISSING: skills/${skill}/SKILL.md`);
    failed = true;
  }
}

for (const skill of COMPANION_SKILLS) {
  const skillPath = path.join(root, 'companion/skills', skill, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    console.error(`MISSING: companion/skills/${skill}/SKILL.md`);
    failed = true;
  }
}

const agentsDir = path.join(root, 'agents');
for (const agent of EXPECTED_AGENTS) {
  const agentPath = path.join(agentsDir, `${agent}.md`);
  if (!fs.existsSync(agentPath)) {
    console.error(`MISSING: agents/${agent}.md`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `All ${CORE_SKILLS.length} core skills, ${COMPANION_SKILLS.length} companion skills, and ${EXPECTED_AGENTS.length} agents verified.`,
);
