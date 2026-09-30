export class DualApiPage {
  constructor(
    private locators: {
      submit: { click(): Promise<void> };
      email: { fill(v: string): Promise<void> };
    },
  ) {}

  // Re-export only — not selector creation; must not count as fat POM by itself
  private submit = this.locators.submit;

  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.submit.click();
  }
}
