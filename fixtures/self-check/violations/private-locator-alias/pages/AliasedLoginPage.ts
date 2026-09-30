export class AliasedLoginPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      submit: { click(): Promise<void> };
    },
  ) {}

  // 1:1 private alias — should fire private-locator-alias
  private submit = this.locators.submit;

  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.submit.click();
  }
}
