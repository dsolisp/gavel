class BaseLoginPage {
  constructor(protected locators: { submit: { click(): Promise<void> }; email: { fill(v: string): Promise<void> } }) {}

  submit = this.locators.submit;
}

export class ComposedShadowFreePage extends BaseLoginPage {
  // Unrelated composed method — must stay clean (not a thin wrapper, not a locator shadow)
  async prepare(email: string) {
    await this.locators.email.fill(email);
    await this.locators.submit.click();
  }
}
