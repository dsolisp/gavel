import { test } from '@playwright/test';

test('calls dev endpoint', async ({ request }) => {
  await request.get('http://dev.internal.test/api');
});
