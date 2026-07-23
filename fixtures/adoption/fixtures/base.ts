// Playwright fixtures. authedPage is consumed by a spec; adminPage is not.
import { test as base } from '@playwright/test';

export const test = base.extend({
  authedPage: async ({ page }, use) => {
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await use(page);
  },
});
