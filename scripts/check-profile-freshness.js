#!/usr/bin/env node
// gavel — compare project framework versions to gavel profile current releases
//
// Usage:
//   node scripts/check-profile-freshness.js <target-repo-root> [--json]

const fs = require('fs');
const path = require('path');

const PROFILE_RELEASES = {
  playwright: { packages: ['@playwright/test', 'playwright'], profile: 'gavel-playwright', current: '1.61.1' },
  cypress: { packages: ['cypress'], profile: 'gavel-cypress', current: '15.18.0' },
  webdriverio: { packages: ['webdriverio', '@wdio/cli'], profile: 'gavel-webdriverio', current: '9.29.0' },
  selenium: { packages: ['selenium'], profile: 'gavel-selenium', current: '4.45.0' },
  cucumber: { packages: ['@cucumber/cucumber', 'cucumber'], profile: 'gavel-cucumber', current: '13.0.0' },
};

function parseSemver(version) {
  const match = String(version).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function compareFreshness(installed, current) {
  const a = parseSemver(installed);
  const b = parseSemver(current);
  if (!a || !b) {
    return { status: 'unknown', detail: 'non-semver version' };
  }
  if (a.major < b.major) {
    return { status: 'stale-major', detail: 'major version behind profile' };
  }
  if (a.major > b.major) {
    return { status: 'ahead-major', detail: 'project ahead of profile current release' };
  }
  if (a.minor < b.minor - 1) {
    return { status: 'stale-minor', detail: 'more than one minor behind profile' };
  }
  if (a.minor < b.minor) {
    return { status: 'stale-patch', detail: 'one minor behind profile' };
  }
  return { status: 'fresh', detail: 'within profile current release window' };
}

function readPackageJson(repoRoot) {
  const pkgPath = path.join(repoRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function detectFramework(packageJson) {
  if (!packageJson) {
    return null;
  }
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const [framework, meta] of Object.entries(PROFILE_RELEASES)) {
    for (const pkg of meta.packages) {
      if (deps[pkg]) {
        return { framework, package: pkg, installed: deps[pkg], ...meta };
      }
    }
  }
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const repoRoot = args.find((arg) => !arg.startsWith('--'));

  if (!repoRoot) {
    console.error('Usage: node scripts/check-profile-freshness.js <target-repo-root> [--json]');
    process.exit(2);
  }

  const resolved = path.resolve(repoRoot);
  const packageJson = readPackageJson(resolved);
  const detected = detectFramework(packageJson);

  if (!detected) {
    const output = { repo: resolved, detected: false, message: 'No supported JS framework package detected.' };
    console.log(jsonOutput ? JSON.stringify(output, null, 2) : output.message);
    process.exit(0);
  }

  const freshness = compareFreshness(detected.installed.replace(/^[\^~>=<]+/, ''), detected.current);
  const output = {
    repo: resolved,
    detected: true,
    framework: detected.framework,
    package: detected.package,
    installed: detected.installed,
    profile: detected.profile,
    profileCurrent: detected.current,
    freshness: freshness.status,
    detail: freshness.detail,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(output, null, 2));
    process.exit(freshness.status.startsWith('stale') ? 1 : 0);
  }

  console.log(`Profile freshness — ${resolved}`);
  console.log(`Framework: ${output.framework} (${output.package}@${output.installed})`);
  console.log(`Profile: ${output.profile} (current ${output.profileCurrent})`);
  console.log(`Status: ${output.freshness} — ${output.detail}`);
  process.exit(freshness.status.startsWith('stale') ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { compareFreshness, detectFramework, PROFILE_RELEASES };
