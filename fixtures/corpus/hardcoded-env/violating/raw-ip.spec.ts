import { test } from '@playwright/test';

test('uses raw IP address', async ({ request }) => {
  await request.get('http://192.168.1.100/api');
});
