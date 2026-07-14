// Good spec: uses fixture factories (no direct `new` in spec), no manual waits,
// no `it.skip`, no inline suppressions, no raw selectors.
import { getLoginActions, getLoginLocators } from '../../support/page-fixtures';
import { UserFactory } from '../../support/factories';

describe('Login (good)', () => {
  let loginPage: ReturnType<typeof getLoginActions>;
  let loginLocators: ReturnType<typeof getLoginLocators>;

  beforeEach(async () => {
    loginPage = getLoginActions();
    loginLocators = getLoginLocators();
    await loginPage.navigateTo('/login');
  });

  it('valid credentials redirect to dashboard @smoke', async () => {
    const user = UserFactory.create({ role: 'trader' });

    await loginPage.signIn(user.email, user.password);

    await expect(loginLocators.dashboardHeading).toBeDisplayed();
  });

  it('invalid credentials show error @regression', async () => {
    await loginPage.signIn('wrong@example.test', 'wrongpass');

    await expect(loginLocators.errorMessage).toBeDisplayed();
  });

  it('factory user builds with unique credentials', async () => {
    const a = UserFactory.create();
    const b = UserFactory.create();

    await expect(a.email).not.toEqual(b.email);
  });
});
