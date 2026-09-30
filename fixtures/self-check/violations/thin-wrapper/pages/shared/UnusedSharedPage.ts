export class UnusedSharedPage {
  constructor(private locators: { submitButton: { click(): Promise<void> } }) {}

  // Shared + callSites <= 1 — should flag shared-yagni
  async orphanSubmit() {
    await this.locators.submitButton.click();
  }
}
