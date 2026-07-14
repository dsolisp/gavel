#!/usr/bin/env node
// gavel — load optional repo-level gavel.config.json

const fs = require('fs');
const path = require('path');

const CONFIG_NAME = 'gavel.config.json';
const CONFIG_NAMES = [CONFIG_NAME];

function readJson(filePath, label = filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

function parseConfigFlag(argv) {
  const args = [];
  let configPath = null;
  let sawConfig = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--config') {
      sawConfig = true;
      configPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (argv[i].startsWith('--config=')) {
      sawConfig = true;
      configPath = argv[i].slice('--config='.length);
      continue;
    }
    args.push(argv[i]);
  }
  return { args, configPath, sawConfig };
}

function validateGavelConfig(config, source = CONFIG_NAME) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${source}: config must be an object`);
  }
  const stringArrays = ['criticalAreas', 'criticalTags'];
  for (const key of stringArrays) {
    if (config[key] && (!Array.isArray(config[key]) || config[key].some((item) => typeof item !== 'string'))) {
      throw new Error(`${source}: ${key} must be an array of strings`);
    }
  }
  if (config.allowlist && !Array.isArray(config.allowlist)) {
    throw new Error(`${source}: allowlist must be an array`);
  }
  if (config.failThreshold && !['off', 'info', 'warning', 'error', 'blocker'].includes(config.failThreshold)) {
    throw new Error(`${source}: failThreshold must be off, info, warning, error, or blocker`);
  }
  if (config.reportOnlyExits !== undefined && typeof config.reportOnlyExits !== 'boolean') {
    throw new Error(`${source}: reportOnlyExits must be boolean`);
  }
  return config;
}

function loadGavelConfig(repoRoot, options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  if (options.configPath) {
    const configPath = path.resolve(cwd, options.configPath);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file does not exist: ${configPath}`);
    }
    return validateGavelConfig(readJson(configPath, configPath), configPath);
  }

  const cwdConfig = path.join(cwd, CONFIG_NAME);
  if (fs.existsSync(cwdConfig)) {
    return validateGavelConfig(readJson(cwdConfig, CONFIG_NAME), CONFIG_NAME);
  }

  const packagePath = path.join(cwd, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = readJson(packagePath, 'package.json');
    if (pkg.gavel !== undefined) {
      return validateGavelConfig(pkg.gavel, 'package.json#gavel');
    }
  }

  return {};
}

function resolveGavelConfig(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const config = loadGavelConfig(cwd, options);
  let source = null;
  if (options.configPath) {
    source = path.resolve(cwd, options.configPath);
  } else if (fs.existsSync(path.join(cwd, CONFIG_NAME))) {
    source = path.join(cwd, CONFIG_NAME);
  } else if (fs.existsSync(path.join(cwd, 'package.json')) && readJson(path.join(cwd, 'package.json'), 'package.json').gavel) {
    source = 'package.json#gavel';
  }
  return { config, source };
}

module.exports = { loadGavelConfig, resolveGavelConfig, parseConfigFlag, validateGavelConfig, CONFIG_NAMES };
