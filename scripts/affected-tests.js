#!/usr/bin/env node
// gavel — affected test discovery via import/reference tracing
//
// Usage:
//   node scripts/affected-tests.js <repo-root> --git
//   node scripts/affected-tests.js <repo-root> --changed path/a.ts,path/b.ts
//   node scripts/affected-tests.js <repo-root> --changed path/a.ts --framework playwright --json

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { detectFramework, extractTags, isTestFile } = require('./extract-tags');

const SUPPORT_RE = /(locators?|pages?|actions?|components?|services?|support|lib|helpers?)\//i;

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'bin',
  'obj',
  'packages',
  '.vs',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
  'allure-results',
  'allure-report',
  '.claude',
  '.qoder',
  '.cursor',
  '.vscode',
]);

const FRAMEWORK_COMMANDS = {
  playwright: (files) => `npx playwright test ${files.join(' ')}`,
  cypress: (files) => `npx cypress run --spec ${files.join(',')}`,
  pytest: (files) => `pytest ${files.join(' ')}`,
  webdriverio: (files) => `npx wdio run wdio.conf.ts --spec ${files.join(',')}`,
  cucumber: (files) => `npx cucumber-js ${files.join(' ')}`,
  junit: (files) => {
    const classes = files
      .map((file) => path.basename(file, path.extname(file)))
      .join(',');
    return `mvn test -Dtest=${classes}`;
  },
  nunit: (files) => {
    const filters = files
      .map((file) => path.basename(file, path.extname(file)))
      .join('|');
    return `dotnet test --filter "FullyQualifiedName~${filters}"`;
  },
};

function parseArgs(argv) {
  const repoRoot = argv.find((arg) => !arg.startsWith('--'));
  const jsonOutput = argv.includes('--json');
  const useGit = argv.includes('--git');
  const frameworkIdx = argv.indexOf('--framework');
  const framework = frameworkIdx >= 0 ? argv[frameworkIdx + 1] : null;
  const frameworkExplicit = frameworkIdx >= 0;
  const changedIdx = argv.indexOf('--changed');
  const changed =
    changedIdx >= 0
      ? argv[changedIdx + 1].split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  const tagIdx = argv.indexOf('--tag');
  const tag = tagIdx >= 0 ? argv[tagIdx + 1] : null;
  const tagFwIdx = argv.indexOf('--tag-framework');
  const tagFramework = tagFwIdx >= 0 ? argv[tagFwIdx + 1] : 'auto';

  return { repoRoot, jsonOutput, useGit, framework, frameworkExplicit, changed, tag, tagFramework };
}

function walkFiles(dir, matcher, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, matcher, files);
      continue;
    }
    if (matcher(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function gitChangedFiles(repoRoot) {
  const output = execSync('git diff --name-only --diff-filter=ACMR HEAD', {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function moduleKeys(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  const noExt = filePath.replace(/\\/g, '/').replace(/\.[^.]+$/, '');
  return new Set([base, noExt, `./${noExt}`, `../${noExt}`]);
}

function extractImportTokens(content) {
  const tokens = new Set();
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      tokens.add(match[1]);
    }
  }
  return tokens;
}

function resolveImportPath(fromFile, token) {
  if (!token.startsWith('.')) {
    return null;
  }

  const base = path.resolve(path.dirname(fromFile), token);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }

  return null;
}

function buildDependentsGraph(repoRoot) {
  const sourceFiles = walkFiles(repoRoot, (file) => /\.(ts|tsx|js|jsx)$/.test(file));
  const dependents = new Map();

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const token of extractImportTokens(content)) {
      const resolved = resolveImportPath(file, token);
      if (!resolved) {
        continue;
      }
      if (!dependents.has(resolved)) {
        dependents.set(resolved, new Set());
      }
      dependents.get(resolved).add(path.normalize(file));
    }
  }

  return dependents;
}

function findReachableFiles(dependents, startFiles) {
  const reachable = new Set(startFiles.map((file) => path.normalize(file)));
  const queue = [...reachable];

  while (queue.length > 0) {
    const current = queue.shift();
    const next = dependents.get(current);
    if (!next) {
      continue;
    }
    for (const file of next) {
      if (!reachable.has(file)) {
        reachable.add(file);
        queue.push(file);
      }
    }
  }

  return reachable;
}

function specReferencesTarget(specContent, targetPath, repoRoot) {
  const relTarget = path.relative(repoRoot, targetPath).replace(/\\/g, '/');
  const targetNoExt = relTarget.replace(/\.[^.]+$/, '');
  const tokens = extractImportTokens(specContent);
  const keys = moduleKeys(targetPath);

  for (const token of tokens) {
    const normalized = token.replace(/\\/g, '/');
    if (
      normalized === relTarget ||
      normalized === targetNoExt ||
      normalized.endsWith(`/${path.basename(targetNoExt)}`) ||
      keys.has(normalized)
    ) {
      return true;
    }
  }

  for (const key of keys) {
    if (specContent.includes(key)) {
      return true;
    }
  }

  return false;
}

function discoverAffectedSpecs(repoRoot, changedFiles) {
  const normalizedChanged = changedFiles.map((file) =>
    path.normalize(path.isAbsolute(file) ? file : path.join(repoRoot, file)),
  );
  const changedSpecs = normalizedChanged.filter((file) => isTestFile(file));
  const changedSupport = normalizedChanged.filter(
    (file) =>
      !isTestFile(file) &&
      (SUPPORT_RE.test(file) || /fixtures?\//i.test(file) || /lib\//i.test(file)),
  );

  if (changedSupport.length === 0 && changedSpecs.length > 0) {
    return {
      strategy: 'direct-spec-changes',
      specs: changedSpecs,
      intermediateFiles: [],
      escalateFullSuite: normalizedChanged.some((file) =>
        /playwright\.config|wdio\.conf|cypress\.config|pytest\.ini|pom\.xml/i.test(file),
      ),
    };
  }

  const dependents = buildDependentsGraph(repoRoot);
  const reachable = findReachableFiles(dependents, normalizedChanged);
  const specs = [...reachable].filter((file) => isTestFile(file)).sort();

  return {
    strategy: 'import-trace-transitive',
    specs,
    intermediateFiles: [...reachable]
      .filter((file) => !isTestFile(file) && !normalizedChanged.includes(file))
      .map((file) => path.relative(repoRoot, file).replace(/\\/g, '/'))
      .sort(),
    escalateFullSuite:
      normalizedChanged.some((file) => /fixtures?\//i.test(file) || /lib\//i.test(file)) ||
      changedSupport.length > 5,
  };
}

function toRepoRelative(repoRoot, files) {
  return files.map((file) => path.relative(repoRoot, file).replace(/\\/g, '/'));
}

function inferFrameworkFromFiles(files) {
  const frameworks = new Set(files.map((file) => detectFramework(file)));
  if (frameworks.size === 1) {
    return [...frameworks][0];
  }
  return 'playwright';
}

function main() {
  const { repoRoot, jsonOutput, useGit, framework, frameworkExplicit, changed, tag, tagFramework } = parseArgs(
    process.argv.slice(2),
  );

  if (!repoRoot) {
    console.error(
      'Usage: node scripts/affected-tests.js <repo-root> (--tag <name> | --git | --changed a.ts,b.ts) [--framework playwright] [--tag-framework auto|playwright|pytest|junit|nunit|cucumber] [--json]',
    );
    process.exit(2);
  }

  const resolvedRoot = path.resolve(repoRoot);

  // Tag-based discovery (highest precedence)
  if (tag) {
    const tagMap = extractTags(resolvedRoot, tagFramework);
    const matchedFiles = tagMap.get(tag.toLowerCase()) || [];
    const matchedSpecs = matchedFiles.filter((file) => isTestFile(path.join(resolvedRoot, file)));
    const effectiveFramework = frameworkExplicit
      ? framework
      : tagFramework !== 'auto'
        ? tagFramework
        : inferFrameworkFromFiles(matchedSpecs);
    const commandBuilder = FRAMEWORK_COMMANDS[effectiveFramework] || FRAMEWORK_COMMANDS.playwright;
    const command =
      matchedSpecs.length > 0 ? commandBuilder(matchedSpecs) : 'no tagged specs found';

    const result = {
      repo: resolvedRoot,
      framework: effectiveFramework,
      strategy: 'tag-discovery',
      tag,
      tagFramework,
      affectedSpecs: matchedSpecs,
      recommendedCommand: command,
      escalateFullSuite: false,
      note: `Discovered specs with @${tag} tag.`,
    };

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`Affected tests (tag @${tag}) — ${resolvedRoot}`);
    console.log(`Strategy: tag-discovery`);
    console.log(`Affected specs: ${result.affectedSpecs.length}`);
    for (const spec of result.affectedSpecs) {
      console.log(`- ${spec}`);
    }
    console.log(`\nRecommended (${effectiveFramework}):`);
    console.log(result.recommendedCommand);
    return;
  }

  const changedFiles = useGit
    ? gitChangedFiles(resolvedRoot).map((file) => path.join(resolvedRoot, file))
    : changed.map((file) =>
        path.isAbsolute(file) ? file : path.join(resolvedRoot, file),
      );

  if (changedFiles.length === 0) {
    console.error('No changed files found.');
    process.exit(2);
  }

  const discovery = discoverAffectedSpecs(resolvedRoot, changedFiles);
  const relativeSpecs = toRepoRelative(resolvedRoot, discovery.specs);
  const effectiveFramework = framework || 'playwright';
  const commandBuilder = FRAMEWORK_COMMANDS[effectiveFramework] || FRAMEWORK_COMMANDS.playwright;
  const command =
    relativeSpecs.length > 0 ? commandBuilder(relativeSpecs) : 'no affected specs found';

  const result = {
    repo: resolvedRoot,
    framework: effectiveFramework,
    strategy: discovery.strategy,
    changedFiles: toRepoRelative(
      resolvedRoot,
      changedFiles.map((file) => (path.isAbsolute(file) ? file : path.join(resolvedRoot, file))),
    ),
    affectedSpecs: relativeSpecs,
    intermediateFiles: discovery.intermediateFiles || [],
    recommendedCommand: command,
    escalateFullSuite: discovery.escalateFullSuite,
    note: discovery.escalateFullSuite
      ? 'Shared layer changed — run full suite if targeted run passes.'
      : 'Run targeted command first, then expand if needed.',
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Affected tests — ${resolvedRoot}`);
  console.log(`Strategy: ${result.strategy}`);
  console.log(`Affected specs: ${result.affectedSpecs.length}`);
  for (const spec of result.affectedSpecs) {
    console.log(`- ${spec}`);
  }
  console.log(`\nRecommended (${effectiveFramework}):`);
  console.log(result.recommendedCommand);
  if (result.escalateFullSuite) {
    console.log('\nEscalation: shared layer changed — consider full suite after targeted run.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  discoverAffectedSpecs,
  specReferencesTarget,
  buildDependentsGraph,
  findReachableFiles,
};
