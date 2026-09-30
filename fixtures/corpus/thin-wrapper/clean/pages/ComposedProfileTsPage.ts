export class ComposedProfileTsPage {
  constructor(
    private locators: {
      name: { fill(v: string): Promise<void> };
      saveButton: { click(): Promise<void> };
    },
  ) {}

  async saveProfile(name: string) {
    await this.locators.name.fill(name);
    await this.locators.saveButton.click();
  }
}
