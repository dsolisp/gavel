import { test } from '@playwright/test';

test('fetches from localhost', async () => {
  await fetch('http://localhost:3000/health');
});
