import { test } from '@playwright/test';

test('uses env URL with fallback default', async ({ request }) => {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  await request.get(baseUrl);
});
