#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function run(script, env, input = '') {
  return spawnSync(process.execPath, [path.join(root, 'hooks', script)], {
    env: { ...process.env, ...env },
    input,
    encoding: 'utf8',
  });
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ponytail-hooks-'));
const home = path.join(temp, 'home');
const pluginData = path.join(temp, 'plugin-data');
fs.mkdirSync(home, { recursive: true });

const codexEnv = {
  HOME: home,
  PLUGIN_DATA: pluginData,
  PONYTAIL_DEFAULT_MODE: 'ultra',
};
const codexState = path.join(pluginData, '.ponytail-active');

let result = run('ponytail-activate.js', codexEnv);
assert.equal(result.status, 0, result.stderr);
assert.equal(fs.readFileSync(codexState, 'utf8'), 'ultra');
let output = JSON.parse(result.stdout);
assert.equal(output.systemMessage, 'PONYTAIL:ULTRA');
assert.match(
  output.hookSpecificOutput.additionalContext,
  /PONYTAIL MODE ACTIVE — level: ultra/,
);

result = run(
  'ponytail-mode-tracker.js',
  codexEnv,
  JSON.stringify({ prompt: '@ponytail lite' }),
);
assert.equal(result.status, 0, result.stderr);
assert.equal(fs.readFileSync(codexState, 'utf8'), 'lite');
output = JSON.parse(result.stdout);
assert.equal(output.systemMessage, 'PONYTAIL:LITE');

result = run(
  'ponytail-mode-tracker.js',
  codexEnv,
  JSON.stringify({ prompt: 'normal mode' }),
);
assert.equal(result.status, 0, result.stderr);
assert.equal(fs.existsSync(codexState), false);
output = JSON.parse(result.stdout);
assert.equal(output.systemMessage, 'PONYTAIL:OFF');

const claudeEnv = {
  HOME: home,
  PONYTAIL_DEFAULT_MODE: 'full',
};
delete claudeEnv.PLUGIN_DATA;

result = run('ponytail-activate.js', claudeEnv);
assert.equal(result.status, 0, result.stderr);
assert.equal(
  fs.readFileSync(path.join(home, '.claude', '.ponytail-active'), 'utf8'),
  'full',
);

fs.rmSync(temp, { recursive: true, force: true });
console.log('hook compatibility checks passed');
