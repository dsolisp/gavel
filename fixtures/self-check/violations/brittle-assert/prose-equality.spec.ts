import { expect, test } from '@playwright/test';

test('compares the full message', () => {
  const message = 'Not found.';
  expect(message).toBe('Not found.');
});
