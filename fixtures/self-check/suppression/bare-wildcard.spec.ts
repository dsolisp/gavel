import { test } from '@playwright/test';

test('bare ignore suppresses every tag on the line (back-compat)', async ({ page }) => {
  const examplePage = new ExamplePage(page); examplePage.locator('button').click(); // gavel-ignore
});
