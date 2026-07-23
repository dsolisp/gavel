import { test } from '@playwright/test';

test('multiline env fallback default', async ({ request }) => {
  const baseUrl =
    process.env.API_URL ||
    'http://localhost:3000';
  await request.get(baseUrl);
});
