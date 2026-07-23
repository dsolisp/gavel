#!/usr/bin/env node
// gavel — compare project framework versions to gavel profile current releases
//
// Usage:
//   node scripts/check-profile-freshness.js <target-repo-root> [--json]

const fs = require('fs');
const path = require('path');

const PROFILE_RELEASES = {
  playwright: {
    ecosystem: 'node',
    packages: ['@playwright/test', 'playwright'],
    profile: 'gavel-playwright',
    current: '1.61.1',
  },
  cypress: {
    ecosystem: 'node',
    packages: ['cypress'],
    profile: 'gavel-cypress',
    current: '15.18.0',
  },
  webdriverio: {
    ecosystem: 'node',
    packages: ['webdriverio', '@wdio/cli'],
    profile: 'gavel-webdriverio',
    current: '9.29.0',
  },
  selenium: {
    ecosystem: 'node',
    packages: ['selenium-webdriver', 'selenium'],
    profile: 'gavel-selenium',
    current: '4.45.0',
  },
  cucumber: {
    ecosystem: 'node',
    packages: ['@cucumber/cucumber', 'cucumber'],
    profile: 'gavel-cucumber',
    current: '13.0.0',
  },
  selenium_py: {
    ecosystem: 'python',
    packages: ['selenium'],
    profile: 'gavel-selenium',
    current: '4.45.0',
  },
  behave: {
    ecosystem: 'python',
    packages: ['behave'],
    profile: 'gavel-cucumber',
    current: '1.3.3',
  },
  pytest_playwright: {
    ecosystem: 'python',
    packages: ['pytest-playwright'],
    profile: 'gavel-playwright',
    current: '0.6.2',
  },
  robot: {
    ecosystem: 'python',
    packages: ['robotframework'],
    profile: 'gavel-run',
    current: '7.2.0',
  },
  pytest: {
    ecosystem: 'python',
    packages: ['pytest'],
    profile: 'gavel-run',
    current: '8.4.0',
  },
  playwright_dotnet: {
    ecosystem: 'dotnet',
    packages: [
      'Microsoft.Playwright',
      'Microsoft.Playwright.NUnit',
      'Microsoft.Playwright.MSTest',
      'Microsoft.Playwright.Xunit',
    ],
    profile: 'gavel-playwright',
    current: '1.61.0',
  },
  appium_dotnet: {
    ecosystem: 'dotnet',
    packages: ['Appium.WebDriver'],
    profile: 'gavel-appium',
    current: '8.3.2',
  },
  selenium_dotnet: {
    ecosystem: 'dotnet',
    packages: ['Selenium.WebDriver'],
    profile: 'gavel-selenium',
    current: '4.45.0',
  },
};

function parseSemver(version) {
  const match = String(version).replace(/^[\^~>=<]+/, '').match(/(\d+)\.(\d+)\.(\d+)/);
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

function parseRequirementsTxt(repoRoot) {
  const reqPath = path.join(repoRoot, 'requirements.txt');
  if (!fs.existsSync(reqPath)) {
    return {};
  }

  const deps = {};
  for (const line of fs.readFileSync(reqPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*(.*)$/);
    if (match) {
      deps[match[1].toLowerCase()] = match[2].trim() || '*';
    }
  }
  return deps;
}

function parsePyprojectToml(repoRoot) {
  const pyprojectPath = path.join(repoRoot, 'pyproject.toml');
  if (!fs.existsSync(pyprojectPath)) {
    return {};
  }

  const deps = {};
  const content = fs.readFileSync(pyprojectPath, 'utf8');
  const depSection = content.match(/\[project\.dependencies\]([\s\S]*?)(\n\[|$)/);
  if (!depSection) {
    return deps;
  }

  for (const line of depSection[1].split('\n')) {
    const match = line.trim().match(/^["']([A-Za-z0-9_.-]+)(?:[=<>!~].*)?["'],?$/);
    if (match) {
      deps[match[1].toLowerCase()] = line.trim();
    }
  }
  return deps;
}

const EXCLUDED_DOTNET_DIRS = new Set([
  'node_modules',
  '.git',
  'bin',
  'obj',
  'packages',
  '.vs',
  'dist',
  'build',
  'coverage',
]);

function walkCsprojFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DOTNET_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCsprojFiles(fullPath, files);
      continue;
    }
    if (entry.name.endsWith('.csproj')) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseCsprojPackages(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const deps = {};

  const selfClosingRe = /<PackageReference\b([^>]*)\/?>/gi;
  let match = selfClosingRe.exec(content);
  while (match) {
    const attrs = match[1];
    const include = attrs.match(/\bInclude="([^"]+)"/i);
    const version = attrs.match(/\bVersion="([^"]+)"/i);
    if (include && version) {
      deps[include[1]] = version[1];
    }
    match = selfClosingRe.exec(content);
  }

  const childRe =
    /<PackageReference\b([^>]*)>\s*<Version>([^<]+)<\/Version>/gi;
  match = childRe.exec(content);
  while (match) {
    const include = match[1].match(/\bInclude="([^"]+)"/i);
    if (include && !deps[include[1]]) {
      deps[include[1]] = match[2].trim();
    }
    match = childRe.exec(content);
  }

  return deps;
}

function collectCsprojDeps(repoRoot) {
  const deps = {};
  for (const filePath of walkCsprojFiles(repoRoot)) {
    Object.assign(deps, parseCsprojPackages(filePath));
  }
  return deps;
}

function detectNodeFramework(packageJson) {
  if (!packageJson) {
    return null;
  }
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const [framework, meta] of Object.entries(PROFILE_RELEASES)) {
    if (meta.ecosystem !== 'node') {
      continue;
    }
    for (const pkg of meta.packages) {
      if (deps[pkg]) {
        return { framework, package: pkg, installed: deps[pkg], ...meta };
      }
    }
  }
  return null;
}

function detectPythonFramework(repoRoot) {
  const deps = { ...parseRequirementsTxt(repoRoot), ...parsePyprojectToml(repoRoot) };
  for (const [framework, meta] of Object.entries(PROFILE_RELEASES)) {
    if (meta.ecosystem !== 'python') {
      continue;
    }
    for (const pkg of meta.packages) {
      const installed = deps[pkg.toLowerCase()];
      if (installed) {
        return { framework, package: pkg, installed, ...meta };
      }
    }
  }
  return null;
}

function detectDotnetFramework(repoRoot) {
  const deps = collectCsprojDeps(repoRoot);
  // Precedence: Appium.WebDriver (a superset of the Selenium C# client) → Playwright.NET
  // → Selenium.WebDriver. An Appium repo also carries Selenium.WebDriver transitively,
  // so the most specific package must win first.
  const order = ['appium_dotnet', 'playwright_dotnet', 'selenium_dotnet'];
  for (const framework of order) {
    const meta = PROFILE_RELEASES[framework];
    if (!meta) {
      continue;
    }
    for (const pkg of meta.packages) {
      if (deps[pkg]) {
        return { framework, package: pkg, installed: deps[pkg], ...meta };
      }
    }
  }
  return null;
}

function detectFramework(repoRoot) {
  return (
    detectDotnetFramework(repoRoot)
    || detectNodeFramework(readPackageJson(repoRoot))
    || detectPythonFramework(repoRoot)
  );
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
  const detected = detectFramework(resolved);

  if (!detected) {
    const output = {
      repo: resolved,
      detected: false,
      message: 'No supported framework package detected in package.json, requirements.txt, pyproject.toml, or *.csproj.',
    };
    console.log(jsonOutput ? JSON.stringify(output, null, 2) : output.message);
    process.exit(0);
  }

  const freshness = compareFreshness(detected.installed, detected.current);
  const output = {
    repo: resolved,
    detected: true,
    ecosystem: detected.ecosystem,
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
  console.log(`Ecosystem: ${output.ecosystem}`);
  console.log(`Framework: ${output.framework} (${output.package}@${output.installed})`);
  console.log(`Profile: ${output.profile} (current ${output.profileCurrent})`);
  console.log(`Status: ${output.freshness} — ${output.detail}`);
  process.exit(freshness.status.startsWith('stale') ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  compareFreshness,
  detectFramework,
  detectDotnetFramework,
  PROFILE_RELEASES,
  parseRequirementsTxt,
  parsePyprojectToml,
  parseCsprojPackages,
  collectCsprojDeps,
};
