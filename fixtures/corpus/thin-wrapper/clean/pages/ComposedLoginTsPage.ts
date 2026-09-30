export class ComposedLoginTsPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      submitButton: { click(): Promise<void> };
    },
  ) {}

  get submitButton() {
    return this.locators.submitButton;
  }

  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.locators.submitButton.click();
  }
}
