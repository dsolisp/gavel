import { test } from '@playwright/test';

test('writes a hardcoded url to process.env', async () => {
  process.env.API_URL = 'http://localhost:3000';
});
