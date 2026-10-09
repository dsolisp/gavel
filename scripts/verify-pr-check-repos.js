#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const PROJECTS = {
  BNMovil: { prefix: 'BNMovil', stack: 'Appium/NUnit' },
  BNMovil_Huawei: { prefix: 'BNMovil', stack: 'Appium/NUnit' },
  BNM_iOS: { prefix: 'BNMovil', stack: 'Appium/NUnit' },
  BNM_Empresarial: { prefix: 'BNME', stack: 'Playwright/NUnit' },
  BNServicios: { prefix: 'BN_Servicios', stack: 'Playwright/NUnit' },
  BNSinpeMovil: { prefix: '', stack: 'Playwright/NUnit' },
  IBC_UI: { prefix: '', stack: 'Playwright/NUnit' },
  IBP_UI: { prefix: 'IBP', stack: 'Playwright/NUnit' },
};

function verifyProject(workspace, name) {
  const project = PROJECTS[name];
  assert.ok(project, `Unknown project: ${name}`);
  const source = path.join(workspace, name);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gavel-real-pr-'));
  const repository = path.join(temporary, 'repository');
  const git = (...args) => execFileSync('git', ['-C', repository, '-c', 'user.name=Gavel verification',
    '-c', 'user.email=verification@example.invalid', ...args], { encoding: 'utf8' }).trim();
  const check = (base, head) => {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'cli.js'), 'pr-check',
      repository, '--base', base, '--head', head, '--json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    assert.ok([0, 1].includes(result.status), `${name}: ${result.stderr}`);
    return { exit: result.status, report: JSON.parse(result.stdout) };
  };
  const commit = (parent, files, message) => {
    git('read-tree', parent);
    for (const [file, content] of Object.entries(files)) {
      const object = execFileSync('git', ['-C', repository, 'hash-object', '-w', '--stdin'],
        { input: content, encoding: 'utf8' }).trim();
      git('update-index', '--add', '--cacheinfo', `100644,${object},${file}`);
    }
    return git('commit-tree', git('write-tree'), '-p', parent, '-m', message);
  };
  try {
    execFileSync('git', ['clone', '--quiet', '--shared', '--no-checkout', source, repository], { stdio: 'pipe' });
    const base = git('rev-parse', 'HEAD');
    const control = check(base, base);
    assert.equal(control.exit, 0, `${name}: historical debt blocked an empty delta`);
    const testFile = path.posix.join(project.prefix, 'tests', 'GavelGateProbeTest.cs');
    const pageFile = path.posix.join(project.prefix, 'pages', 'GavelGateProbePage.cs');
    const locatorFile = path.posix.join(project.prefix, 'locators', 'GavelGateProbeLocators.cs');
    const appium = project.stack.startsWith('Appium');
    const testContent = [
      'using NUnit.Framework;', 'using System.Threading;', 'public class GavelGateProbeTest', '{',
      '  [Test]', '  public void Probe()', '  {', '    Thread.Sleep(1234);',
      '    var probe = new GavelGateProbePage();', '  }', '}', '',
    ].join('\n');
    const pageContent = appium
      ? 'using OpenQA.Selenium;\npublic class GavelGateProbePage\n{\n  public void Probe(IWebDriver driver)\n  {\n    driver.FindElement(By.XPath("//fixture"));\n  }\n}\n'
      : 'using Microsoft.Playwright;\npublic class GavelGateProbePage\n{\n  public void Probe(IPage page)\n  {\n    page.Locator("//fixture");\n  }\n}\n';
    const locatorContent = appium
      ? 'using OpenQA.Selenium;\npublic class GavelGateProbeLocators\n{\n  public By GavelUnusedProbe => By.XPath("//fixture");\n}\n'
      : 'using Microsoft.Playwright;\npublic class GavelGateProbeLocators(IPage page)\n{\n  public ILocator GavelUnusedProbe => page.Locator("//fixture");\n}\n';
    const probe = commit(base, { [testFile]: testContent, [pageFile]: pageContent,
      [locatorFile]: locatorContent }, 'Temporary new-code violation probes');
    const negative = check(base, probe);
    assert.equal(negative.exit, 1, `${name}: new violations did not block`);
    const expected = { 'manual-wait': [testFile, 8], 'no-di': [testFile, 9],
      'selector-leak': [pageFile, 6], 'dead-locator': [locatorFile, 4] };
    for (const [tag, [file, line]] of Object.entries(expected)) {
      assert.ok(negative.report.findings.some((finding) => finding.tag === tag
        && finding.file === file && finding.line === line), `${name}: missing exact evidence for ${tag}`);
    }
    assert.ok(negative.report.findings.every((finding) => [testFile, pageFile, locatorFile].includes(finding.file)),
      `${name}: old repository findings leaked into the PR verdict`);
    const harmless = commit(probe, { [testFile]: testContent.replace('    Thread.Sleep(1234);',
      '    Thread.Sleep(1234);\n    var harmless = true;') }, 'Temporary clean edit inside faulty method');
    const clean = check(probe, harmless);
    assert.equal(clean.exit, 0, `${name}: existing method debt blocked an innocent change`);
    return { project: name, stack: project.stack, base, control: control.exit, newCode: negative.exit,
      cleanEdit: clean.exit, checkedRules: Object.keys(expected), introduced: negative.report.findings.length };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function main() {
  const workspace = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
  const selected = process.argv.slice(3);
  for (const name of selected.length ? selected : Object.keys(PROJECTS)) {
    process.stdout.write(`${JSON.stringify(verifyProject(workspace, name))}\n`);
  }
}

module.exports = { verifyProject };
if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}