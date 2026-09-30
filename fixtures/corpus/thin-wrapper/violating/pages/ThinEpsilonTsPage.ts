export class ThinEpsilonTsPage {
  constructor(private locators: { epsilonButton: { click(): Promise<void> } }) {}

  async clickEpsilon() {
    await this.locators.epsilonButton.click();
  }
}
