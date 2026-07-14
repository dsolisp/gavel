import { expect, test } from '@jest/globals';

test('short token without prose punctuation', () => {
  const code = 'OK';
  expect(code).toBe('OK');
});
