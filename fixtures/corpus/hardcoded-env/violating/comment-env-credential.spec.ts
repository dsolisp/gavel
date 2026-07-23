import { test } from '@playwright/test';

test('credential literal with an env comment', async () => {
  const password = 'do-not-use-hardcoded'; // process.env.PASSWORD
});
