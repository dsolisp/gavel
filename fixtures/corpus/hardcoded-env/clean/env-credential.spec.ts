import { test } from '@playwright/test';

test('reads credential from environment', async () => {
  const apiKey = process.env.API_KEY;
});
