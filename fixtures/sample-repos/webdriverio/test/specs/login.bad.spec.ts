// VIOLATION FILE: each violation demonstrates one Gavel self-check rule.
// Run from the gavel repo root:
//
//   node scripts/self-check.js fixtures/sample-repos/webdriverio
//
// The actions_bad.ts file is the canonical expect-in-action and selector-leak
// trigger. The spec below adds the other patterns to make every applicable
// rule fire.
import { LoginActions } from '../pageobjects/actions/LoginActions';
import { LoginLocators } from '../pageobjects/locators/LoginLocators';
import { LoginActionsBad } from '../pageobjects/actions/LoginActionsBad';

describe('Login (bad)', () => {
  const loginPage = new LoginActions();
  const loginLocators = new LoginLocators();
  const badLoginPage = new LoginActionsBad();

  it('valid credentials redirect to dashboard', async () => {
    await $('[role="textbox"][aria-label="Email"]').setValue('user@example.test');
    await $('[role="textbox"][aria-label="Password"]').setValue('pw-1234');
    await $('button[type="submit"]').click();

    // manual-wait: blocking on a fixed timeout is the wrong way to wait
    // for the dashboard; the framework's auto-retry assertion does the job.
    await browser.waitForTimeout(2000);

    // ignore-no-reason: bare inline suppression without a tag or reason.
    // gavel-ignore

    await expect(loginLocators.dashboardHeading).toBeDisplayed();
  });

  it('bad action class is exercised by the spec', async () => {
    await badLoginPage.signIn('user@example.test', 'pw-1234');
  });

  it.skip('should show error on bad credentials', async () => {
    await loginPage.signIn('wrong@example.test', 'wrong');
  });

  it('placeholder smoke test with suppression', async () => {
    // gavel-ignore
    expect(1).toBe(1);
  });

  it('full happy path journey exercises every input', async () => {
    await $('[role="textbox"][aria-label="Email"]').setValue('user@example.test');
    await $('[role="textbox"][aria-label="Password"]').setValue('pw-1234');
    await $('button[type="submit"]').click();
    await expect(loginLocators.dashboardHeading).toBeDisplayed();
  });

  it('full error path journey shows the error state', async () => {
    await $('[role="textbox"][aria-label="Email"]').setValue('user@example.test');
    await $('[role="textbox"][aria-label="Password"]').setValue('wrong');
    await $('button[type="submit"]').click();
    await expect(loginLocators.errorMessage).toBeDisplayed();
  });

  it('rate limit kicks in after many attempts', async () => {
    for (let i = 0; i < 3; i += 1) {
      await $('[role="textbox"][aria-label="Email"]').setValue('user@example.test');
      await $('[role="textbox"][aria-label="Password"]').setValue(`wrong-${i}`);
      await $('button[type="submit"]').click();
      await browser.waitForTimeout(100);
    }
    // manual-wait: browser.pause() is a fixed timeout — same violation as waitForTimeout.
    await browser.pause(2000);
    await expect(loginLocators.errorMessage).toBeDisplayed();
  });

  it('count buttons on the page', async () => {
    const buttons = $$('button');
    await expect(buttons.length).toBeGreaterThan(0);
  });

  it('session persists across page reloads', async () => {
    await $('[role="textbox"][aria-label="Email"]').setValue('user@example.test');
    await $('[role="textbox"][aria-label="Password"]').setValue('pw-1234');
    await $('button[type="submit"]').click();
    await browser.reloadSession();
    await expect(loginLocators.dashboardHeading).toBeDisplayed();
  });

  it('logout returns to the login page', async () => {
    await $('[role="textbox"][aria-label="Email"]').setValue('user@example.test');
    await $('[role="textbox"][aria-label="Password"]').setValue('pw-1234');
    await $('button[type="submit"]').click();
    await $('button=Sign out').click();
    await expect(loginLocators.dashboardHeading).toBeDisplayed();
  });
});
