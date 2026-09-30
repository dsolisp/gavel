export class ComposedLoginPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      submitButton: { click(): Promise<void> };
    },
  ) {}

  // Dual API: public re-export (not a thin wrapper).
  get submitButton() {
    return this.locators.submitButton;
  }

  // Composed flow: multiple native interactions — not thin-wrapper.
  async signIn(email: string) {
    await this.locators.email.fill(email);
    await this.locators.submitButton.click();
  }
}
