export class WaitOnlyTsPage {
  constructor(private locators: { panel: { waitFor(): Promise<void>; click(): Promise<void> } }) {}

  async waitForPanel() {
    await this.locators.panel.waitFor();
  }

  async openPanel() {
    await this.locators.panel.waitFor();
    await this.locators.panel.click();
  }
}
