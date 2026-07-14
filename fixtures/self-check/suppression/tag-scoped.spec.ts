import { test } from '@playwright/test';

test('tag-scoped ignore suppresses only the named tag', async ({ page }) => {
  const examplePage = new ExamplePage(page); examplePage.locator('button').click(); // gavel-ignore: no-di
});
