import { test } from '@playwright/test';

test('credential literal beside an env read', async () => {
  const password = 'do-not-use-hardcoded'; const url = process.env.API_URL;
});
