export class ComposedNoAliasTsPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      submit: { click(): Promise<void> };
    },
  ) {}

  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.locators.submit.click();
  }
}
