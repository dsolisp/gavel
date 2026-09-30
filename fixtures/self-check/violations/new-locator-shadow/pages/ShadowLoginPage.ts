class BaseLoginPage {
  constructor(protected locators: { submit: { click(): Promise<void> }; other: { click(): Promise<void> } }) {}

  submit = this.locators.submit;
}

export class ShadowLoginPage extends BaseLoginPage {
  // Same-name locator shadow — should fire new-locator-shadow
  submit = this.locators.other;

  async signIn() {
    await this.locators.submit.click();
  }
}
