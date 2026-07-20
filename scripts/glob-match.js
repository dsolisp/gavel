#!/usr/bin/env node
// gavel — minimal glob matching (no dependencies)

function matchGlob(relPath, pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '@@GLOBSTAR@@')
    .replace(/\*/g, '[^/]*')
    .replace(/@@GLOBSTAR@@/g, '.*');
  return new RegExp(`^${escaped}$`).test(relPath);
}

function isExcludedPath(relPath, patterns) {
  return patterns.some((pattern) => matchGlob(relPath, pattern));
}

module.exports = { matchGlob, isExcludedPath };
