#!/usr/bin/env node
// gavel — load optional repo-level gavel.config.json

const fs = require('fs');
const path = require('path');

const CONFIG_NAMES = ['gavel.config.json', 'gavel-self-check.config.json'];

function loadGavelConfig(repoRoot) {
  if (!repoRoot) {
    return {};
  }

  for (const name of CONFIG_NAMES) {
    const configPath = path.join(repoRoot, name);
    if (!fs.existsSync(configPath)) {
      continue;
    }
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      throw new Error(`${name}: ${error.message}`);
    }
  }

  return {};
}

module.exports = { loadGavelConfig, CONFIG_NAMES };
