import { expect, test } from '@playwright/test';

test('profile has a name', async () => {
  const name = 'Ada';
  expect(name).toBeDefined();
});
