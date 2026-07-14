import { expect, test } from '@playwright/test';

test('title equals multi-word prose', async () => {
  const title = 'Welcome back, user!';
  expect(title).toEqual('Welcome back, user!');
});
