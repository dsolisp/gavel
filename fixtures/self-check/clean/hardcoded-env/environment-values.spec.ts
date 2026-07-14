import { test } from '@playwright/test';

test('uses configured environment values', async ({ request }) => {
  await request.get(process.env.API_URL);
  const apiKey = process.env.API_KEY;
  await request.get(`${process.env.API_URL}/health`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
});
