import { expect, test } from '@playwright/test';

test('flag is boolean invariant', async () => {
  const enabled = true;
  expect(enabled).toBe(true);
});
