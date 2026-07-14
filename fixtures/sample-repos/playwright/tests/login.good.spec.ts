import { test, expect } from '../support/appFixtures';
import { UserFactory } from '../support/factories';

test.describe('Login', () => {
  test('valid credentials redirect to dashboard @smoke', async ({ loginPage, loginLocators }) => {
    const user = UserFactory.create({ role: 'trader' });

    await test.step('Navigate to login', async () => {
      await loginPage.navigateTo('/login');
    });

    await test.step('Sign in with factory credentials', async () => {
      await loginPage.signIn(user.email, user.password);
    });

    await test.step('Verify dashboard is visible', async () => {
      await expect(loginLocators.dashboardHeading).toBeVisible();
    });
  });

  test('invalid credentials show error @regression', async ({ loginPage, loginLocators }) => {
    await test.step('Navigate to login', async () => {
      await loginPage.navigateTo('/login');
    });

    await test.step('Submit wrong credentials', async () => {
      await loginPage.signIn('wrong@example.test', 'wrongpass');
    });

    await test.step('Verify error message appears', async () => {
      await expect(loginLocators.errorMessage).toBeVisible();
    });
  });
});
