const { findMatches } = require('./self-check');

const ASSERTION_RE = /\bexpect\s*\(|\bassert(?:\.|Equals|Equal|That)\s*\(|\bassert\s+/;
const EXISTENCE_RE = /\btoBe(?:Defined|Truthy)\s*\(|\bassertNotNull\s*\(|\bis not None\b/;
const EARLY_RETURN_RE = /^\s*(?:return(?:\s*;|\s)|pytest\.skip\s*\(|test\.skip\s*\()/;
const STRONG_ASSERT_RE = /\bto(?:Be|Equal|Contain|HaveText)\s*\(|\bcontains\s*\(|\bschema\b/i;

function testBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  for (let start = 0; start < lines.length; start += 1) {
    const title = lines[start].match(/\b(?:test|it)\s*\(\s*(['"`])(.+?)\1/);
    if (!title) continue;
    let depth = 0;
    for (let end = start; end < lines.length; end += 1) {
      depth += (lines[end].match(/\{/g) || []).length;
      depth -= (lines[end].match(/\}/g) || []).length;
      if (depth <= 0 && end > start) {
        blocks.push({ title: title[2], start: start + 1, lines: lines.slice(start, end + 1) });
        break;
      }
    }
  }
  return blocks;
}

function assertionLines(block) {
  return findMatches(block.lines.join('\n'), ASSERTION_RE).map(({ line }) => ({
    line: block.start + line - 1,
    text: block.lines[line - 1].trim(),
  }));
}

function primarySubject(assertion) {
  const match = assertion.text.match(/\bexpect\s*\((.+?)\)\s*\./);
  return match && match[1];
}

function isConsolidated(before, after) {
  const beforeAssertions = assertionLines(before);
  const afterAssertions = assertionLines(after);
  return beforeAssertions.length >= 2
    && afterAssertions.length === 1
    && primarySubject(beforeAssertions[0]) === primarySubject(afterAssertions[0])
    && !EXISTENCE_RE.test(afterAssertions[0].text);
}

function hasSuppression(block) {
  return block.lines.some((line) => /gavel-ignore:\s*assert-drop\b\s*(?:—|-)\s*\S/.test(line));
}

function finding(subCase, block, afterPath, line = block.start) {
  const blocker = subCase !== 'strength-downgrade';
  return {
    tag: 'assert-drop',
    subCase,
    severity: blocker ? 'blocker' : 'info',
    envelopeSeverity: blocker ? 'blocker' : 'report',
    ...(blocker ? {} : { confidence: 'medium' }),
    file: afterPath,
    line,
    message: `assert-drop: ${subCase}`,
  };
}

function scanAssertDrop(pair) {
  const beforeByTitle = new Map(testBlocks(pair.before).map((block) => [block.title, block]));
  const findings = [];
  for (const after of testBlocks(pair.after)) {
    const before = beforeByTitle.get(after.title);
    if (!before || hasSuppression(after)) continue;
    const beforeAssertions = assertionLines(before);
    const afterAssertions = assertionLines(after);
    const earlyReturn = findMatches(after.lines.join('\n'), EARLY_RETURN_RE)
      .find(({ line }) => line < afterAssertions[0]?.line - after.start + 1);
    if (earlyReturn && assertionLines(before).length === afterAssertions.length) {
      findings.push(finding('early-return', after, pair.afterPath, after.start + earlyReturn.line - 1));
    } else if (beforeAssertions.length > afterAssertions.length && !isConsolidated(before, after)) {
      findings.push(finding('assertion-deleted', after, pair.afterPath));
    } else if (beforeAssertions.some(({ text }) => STRONG_ASSERT_RE.test(text))
      && afterAssertions.some(({ text }) => EXISTENCE_RE.test(text))) {
      findings.push(finding('strength-downgrade', after, pair.afterPath));
    }
  }
  return findings;
}

const REVIEW_RULES = [{
  id: 'assert-drop',
  class: 'assertion',
  severity: 'blocker',
  envelopeSeverity: 'blocker',
  message: 'Assertion deleted, bypassed, or weakened while the test title is unchanged',
  remediation: 'Keep the assertion, consolidate with equal coverage, or rename the test when behavior intentionally changes.',
  test: scanAssertDrop,
}];

module.exports = { REVIEW_RULES, scanAssertDrop };
