#!/usr/bin/env node
// gavel — static test stack detection

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function fileExists(root, names) {
  return names.find((name) => fs.existsSync(path.join(root, name))) || null;
}

function detectStack(repoRoot) {
  const root = path.resolve(repoRoot || process.cwd());
  const pkg = readJson(path.join(root, 'package.json'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const evidence = [];
  const frameworks = [];

  function add(name, proof) {
    if (!frameworks.includes(name)) frameworks.push(name);
    evidence.push(proof);
  }

  if (deps['@playwright/test'] || fileExists(root, ['playwright.config.ts', 'playwright.config.js'])) add('playwright', '@playwright/test or playwright.config');
  if (deps.cypress || fileExists(root, ['cypress.config.ts', 'cypress.config.js'])) add('cypress', 'cypress dependency or config');
  if (deps.webdriverio || deps['@wdio/cli'] || fileExists(root, ['wdio.conf.ts', 'wdio.conf.js'])) add('webdriverio', 'wdio dependency or config');
  if (deps['@cucumber/cucumber'] || deps['cucumber-js']) add('cucumber-js', 'cucumber-js dependency');
  if (fileExists(root, ['pytest.ini', 'pyproject.toml', 'requirements.txt'])) add('pytest', 'pytest config or Python dependency file');
  if (fileExists(root, ['pom.xml', 'build.gradle', 'build.gradle.kts'])) add('junit', 'JVM test build file');

  const { detectDotnetFramework } = require('./check-profile-freshness');
  const dotnet = detectDotnetFramework(root);
  const DOTNET_FRAMEWORK_LABELS = {
    appium_dotnet: 'appium-dotnet',
    playwright_dotnet: 'playwright-dotnet',
    selenium_dotnet: 'selenium-csharp',
  };
  const seleniumCsprojFallback = !dotnet && hasSeleniumCsproj(root);
  let dotnetProfile;
  if (dotnet) {
    // .NET framework leads the stack; its profile drives the audit.
    frameworks.unshift(DOTNET_FRAMEWORK_LABELS[dotnet.framework] || dotnet.framework);
    evidence.unshift(`${dotnet.package} in *.csproj → ${dotnet.profile}`);
    dotnetProfile = dotnet.profile;
  } else if (seleniumCsprojFallback) {
    // ChromeDriver-only projects without the base Selenium.WebDriver package.
    frameworks.unshift('selenium-csharp');
    evidence.unshift('Selenium.WebDriver(.ChromeDriver) in *.csproj → gavel-selenium');
    dotnetProfile = 'gavel-selenium';
  }

  return {
    repo: root,
    primary: frameworks[0] || 'unknown',
    frameworks: [...new Set(frameworks)],
    evidence,
    profile: dotnetProfile,
    note: frameworks.length === 0 ? 'No known test stack markers found.' : 'Static detection only; no tests or browsers were run.',
  };
}

function hasSeleniumCsproj(repoRoot) {
  const { collectCsprojDeps } = require('./check-profile-freshness');
  const deps = collectCsprojDeps(repoRoot);
  return Boolean(deps['Selenium.WebDriver'] || deps['Selenium.WebDriver.ChromeDriver']);
}

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const repoRoot = args.find((arg) => !arg.startsWith('--')) || process.cwd();
  const result = detectStack(repoRoot);

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Gavel detect — ${result.repo}`);
  console.log(`Primary stack: ${result.primary}`);
  if (result.frameworks.length > 0) console.log(`Detected: ${result.frameworks.join(', ')}`);
  if (result.profile) console.log(`Profile: ${result.profile}`);
  for (const item of result.evidence) console.log(`- ${item}`);
  console.log(result.note);
}

if (require.main === module) {
  main();
}

module.exports = { detectStack };
