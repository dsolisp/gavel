// @ts-nocheck
// VIOLATION: selector-leak — $('...'), $$('...'), and page.$('...') shorthand
// outside locator classes. WebdriverIO/Cypress $()/$$() and Playwright's
// page.$() are all raw selector calls that belong in locator classes.
export class WdioShorthandPage {
  private page: any;

  async clickEmail() {
    await $('[role="textbox"]').click();
  }

  async countButtons() {
    return $$('button').length;
  }

  async getEmailHandle() {
    return this.page.$('#email');
  }
}
