export class ThinBetaTsPage {
  constructor(private locators: { betaButton: { click(): Promise<void> } }) {}

  async clickBeta() {
    await this.locators.betaButton.click();
  }
}
