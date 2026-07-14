import { test } from '@playwright/test';

test('calls staging endpoint', async ({ request }) => {
  await request.get('https://staging.api.test/health');
});
