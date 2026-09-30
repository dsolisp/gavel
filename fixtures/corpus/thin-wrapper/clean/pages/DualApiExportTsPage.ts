export class DualApiExportTsPage {
  constructor(private locators: { exportButton: { click(): Promise<void> } }) {}

  public get exportButton() {
    return this.locators.exportButton;
  }

  async prepareAndExport(label: string) {
    await this.locators.exportButton.click();
    await this.locators.exportButton.click();
  }
}
