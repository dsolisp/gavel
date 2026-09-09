function sameFinding(expected, actual) {
  return expected.severity === actual.severity
    && expected.category === actual.category
    && expected.file === actual.file
    && actual.endLine >= expected.startLine
    && actual.startLine <= expected.endLine;
}

function evaluateReviewCases(cases) {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const reviewCase of cases) {
    const unmatched = [...reviewCase.expectedFindings];
    for (const finding of reviewCase.actualFindings) {
      const match = unmatched.findIndex((expected) => sameFinding(expected, finding));
      if (match === -1) falsePositives += 1;
      else {
        truePositives += 1;
        unmatched.splice(match, 1);
      }
    }
    falseNegatives += unmatched.length;
  }

  const flagged = truePositives + falsePositives;
  const expected = truePositives + falseNegatives;
  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision: flagged === 0 ? null : truePositives / flagged,
    recall: expected === 0 ? null : truePositives / expected,
  };
}

module.exports = { evaluateReviewCases, sameFinding };