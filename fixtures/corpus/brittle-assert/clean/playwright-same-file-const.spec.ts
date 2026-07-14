import { expect, test } from '@playwright/test';

const NOT_FOUND = 'Not found.';

test('same-file const is domain invariant', async () => {
  const message = NOT_FOUND;
  expect(message).toBe(NOT_FOUND);
});
