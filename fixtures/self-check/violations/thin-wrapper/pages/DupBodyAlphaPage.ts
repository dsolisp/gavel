export class DupBodyAlphaPage {
  constructor(private locators: { submitButton: { click(): Promise<void> } }) {}

  // Same body as DupBodyBetaPage — should flag move
  async dupSubmit() {
    await this.locators.submitButton.click();
  }
}
