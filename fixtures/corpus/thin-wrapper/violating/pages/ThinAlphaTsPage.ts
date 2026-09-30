export class ThinAlphaTsPage {
  constructor(private locators: { alphaButton: { click(): Promise<void> } }) {}

  async clickAlpha() {
    await this.locators.alphaButton.click();
  }
}
