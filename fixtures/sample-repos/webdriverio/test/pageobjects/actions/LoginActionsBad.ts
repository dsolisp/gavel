// VIOLATION FILE: expect-in-action + selector-leak.
//
// This action class demonstrates two rules:
// - expect-in-action: `expect` calls belong in spec files, not action classes.
// - selector-leak: raw selector chains belong in locator classes, not action
//   classes. The spec also demonstrates WebdriverIO's `$('...')` shorthand
//   which the scanner now detects.
//
// The canonical pattern lives in LoginActions.ts; this file exists to
// demonstrate the rules that Gavel's self-check reports.
import { LoginLocators } from '../locators/LoginLocators';

export class LoginActionsBad {
  private locators = new LoginLocators();

  async signIn(email: string, password: string): Promise<void> {
    // expect-in-action: an action class must not call `expect`. The
    // spec is the assertion layer.
    expect(email).toBeTruthy();
    expect(password).toBeTruthy();

    // selector-leak: raw querySelector chain inside the action class. Move
    // the selector into LoginLocators and reference it by name.
    await browser.execute(
      (selector) => document.querySelector(selector),
      '[role="textbox"][aria-label="Email"]',
    );
    await browser.execute(
      (selector) => document.querySelector(selector),
      '[role="textbox"][aria-label="Password"]',
    );
    await this.locators.signInButton.click();
  }
}
