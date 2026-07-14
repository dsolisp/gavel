import { test } from '@playwright/test';

const baseUrl = 'http://localhost:3000';
const apiKey = 'configured-fixture-value';

test('provides test settings', async () => {
  await test.step('read settings', async () => {
    console.log(baseUrl, apiKey);
  });
});
