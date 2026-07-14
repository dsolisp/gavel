import { test } from '@playwright/test';

test('uses configured env URL', async ({ request }) => {
  await request.get(process.env.API_URL);
});
