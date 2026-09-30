export class ThinGammaTsPage {
  constructor(private locators: { gammaButton: { click(): Promise<void> } }) {}

  async clickGamma() {
    await this.locators.gammaButton.click();
  }
}
