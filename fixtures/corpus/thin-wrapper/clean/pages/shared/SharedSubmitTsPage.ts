export class SharedSubmitTsPage {
  constructor(private locators: { sharedButton: { click(): Promise<void> } }) {}

  async sharedSubmitTs() {
    await this.locators.sharedButton.click();
  }
}
