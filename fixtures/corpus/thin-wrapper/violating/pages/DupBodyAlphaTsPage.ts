export class DupBodyAlphaTsPage {
  constructor(private locators: { okButton: { click(): Promise<void> } }) {}

  async confirmDupTs() {
    await this.locators.okButton.click();
  }
}
