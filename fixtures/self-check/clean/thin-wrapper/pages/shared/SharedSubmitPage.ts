export class SharedSubmitPage {
  constructor(private locators: { submitButton: { click(): Promise<void> } }) {}

  // Shared + callSites > 1 (see tests) — must stay clean
  async sharedSubmit() {
    await this.locators.submitButton.click();
  }
}
