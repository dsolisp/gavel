const path = require('path');
const { safeRelativePath } = require('./pr-review-contract');

const DEFAULT_LIMITS = Object.freeze({ maxFiles: 100, maxLines: 5000, maxBytes: 500000 });

function parseUnifiedDiff(diff, limits = DEFAULT_LIMITS) {
  const effective = { ...DEFAULT_LIMITS, ...limits };
  const result = { changedLines: {}, files: [], bytes: Buffer.byteLength(diff), lines: 0, complete: true, reasons: [] };
  let file = null;
  let targetLine = 0;

  if (result.bytes > effective.maxBytes) result.reasons.push(`diff exceeds maxBytes ${effective.maxBytes}`);
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith('+++ ')) {
      const raw = line.slice(4).trim();
      file = raw === '/dev/null' ? null : raw.replace(/^b\//, '');
      if (file && (!safeRelativePath(file) || path.extname(file).toLowerCase() === '.lock')) {
        result.reasons.push(`unsupported path: ${file}`);
        file = null;
      }
      if (file && !result.changedLines[file]) {
        result.files.push(file);
        result.changedLines[file] = [];
      }
      continue;
    }
    if (file && /^Binary files .* differ$/.test(line)) {
      result.reasons.push(`binary file requires human review: ${file}`);
      file = null;
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      targetLine = Number(hunk[1]);
      continue;
    }
    if (!file || line.startsWith('--- ')) continue;
    if (line.startsWith('+')) {
      result.changedLines[file].push(targetLine);
      result.lines += 1;
      targetLine += 1;
    } else if (!line.startsWith('-') && !line.startsWith('\\')) targetLine += 1;
  }

  if (result.files.length > effective.maxFiles) result.reasons.push(`diff exceeds maxFiles ${effective.maxFiles}`);
  if (result.lines > effective.maxLines) result.reasons.push(`diff exceeds maxLines ${effective.maxLines}`);
  result.complete = result.reasons.length === 0;
  return result;
}

module.exports = { DEFAULT_LIMITS, parseUnifiedDiff };