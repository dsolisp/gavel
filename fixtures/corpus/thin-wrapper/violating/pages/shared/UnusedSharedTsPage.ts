export class UnusedSharedTsPage {
  constructor(private locators: { orphanButton: { click(): Promise<void> } }) {}

  async orphanSubmitTs() {
    await this.locators.orphanButton.click();
  }
}
