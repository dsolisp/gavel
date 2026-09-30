export class AliasedSubmitTsPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      submit: { click(): Promise<void> };
    },
  ) {}

  private submit = this.locators.submit;

  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.submit.click();
  }
}
