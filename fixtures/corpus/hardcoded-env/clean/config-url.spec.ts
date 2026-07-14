import { test } from '@playwright/test';

test('uses config module for URL', async ({ request }) => {
  await request.get(`${process.env.BASE_URL}/health`);
});
