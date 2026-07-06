import { test, expect } from '@playwright/test';

test('asserts before fail marker', async ({ page }) => {
  await expect(page.getByRole('heading')).toBeVisible();
  test.fail('PROJ-123 known UI regression');
});
