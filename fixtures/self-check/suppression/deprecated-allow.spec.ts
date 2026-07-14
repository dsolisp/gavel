import { test } from '@playwright/test';

test('deprecated allow alias still works, tag-scoped', async ({ page }) => {
  const examplePage = new ExamplePage(page); examplePage.locator('button').click(); // gavel-allow: no-di
});
