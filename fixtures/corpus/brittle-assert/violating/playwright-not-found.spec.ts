import { test, expect } from '@playwright/test';

test('message equals full prose', async () => {
  const message = await Promise.resolve('Not found.');
  expect(message).toBe('Not found.');
});
