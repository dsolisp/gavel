export class DupBodyBetaPage {
  constructor(private locators: { submitButton: { click(): Promise<void> } }) {}

  // Same body as DupBodyAlphaPage — should flag move
  async otherSubmit() {
    await this.locators.submitButton.click();
  }
}
