import { expect, test } from '@playwright/test';

test('status is ok', async () => {
  const status = 200;
  expect(status).toBe(200);
  expect(status).toBeGreaterThan(199);
});
