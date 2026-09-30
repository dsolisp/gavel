export class ThinLoginPage {
  constructor(private locators: { submitButton: { click(): Promise<void> } }) {}

  // callSites <= 1 — should flag delete
  async submit() {
    await this.locators.submitButton.click();
  }
}
