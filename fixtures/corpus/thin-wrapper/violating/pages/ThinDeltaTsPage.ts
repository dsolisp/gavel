export class ThinDeltaTsPage {
  constructor(private locators: { deltaButton: { click(): Promise<void> } }) {}

  async clickDelta() {
    await this.locators.deltaButton.click();
  }
}
