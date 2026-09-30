export class DupBodyBetaTsPage {
  constructor(private locators: { okButton: { click(): Promise<void> } }) {}

  async confirmDupTsAlt() {
    await this.locators.okButton.click();
  }
}
