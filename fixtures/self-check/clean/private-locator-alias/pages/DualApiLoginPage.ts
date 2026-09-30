export class DualApiLoginPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      submit: { click(): Promise<void> };
    },
  ) {}

  // Public re-export — dual API stays clean
  public get submit() {
    return this.locators.submit;
  }

  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.locators.submit.click();
  }
}
