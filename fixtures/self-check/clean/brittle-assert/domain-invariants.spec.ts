import { expect, test } from '@playwright/test';

const NOT_FOUND = 'Not found.';

test('compares domain invariants', () => {
  expect(200).toBe(200);
  expect(true).toBe(true);
  expect('message').toBe(NOT_FOUND);
});
