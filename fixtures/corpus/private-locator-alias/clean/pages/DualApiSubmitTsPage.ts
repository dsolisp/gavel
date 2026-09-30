export class DualApiSubmitTsPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      submit: { click(): Promise<void> };
    },
  ) {}

  public get submit() {
    return this.locators.submit;
  }

  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.locators.submit.click();
  }
}
