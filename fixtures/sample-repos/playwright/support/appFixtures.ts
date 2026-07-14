import { test as base } from '@playwright/test';
import { LoginActions } from '../pages/actions/LoginActions';
import { LoginLocators } from '../pages/locators/LoginLocators';

// Fixture DI: specs receive `loginPage` and `loginLocators` from the
// runner. No direct `new LoginActions(page)` in spec files.
export const test = base.extend<{
  loginPage: LoginActions;
  loginLocators: LoginLocators;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginActions(page));
  },
  loginLocators: async ({ page }, use) => {
    await use(new LoginLocators(page));
  },
});

export { expect } from '@playwright/test';
