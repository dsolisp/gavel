import { test } from '@playwright/test';

test('uses explicit port in URL', async ({ request }) => {
  await request.get('https://api.example.test:8080/health');
});
