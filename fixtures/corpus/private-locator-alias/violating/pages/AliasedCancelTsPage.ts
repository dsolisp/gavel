export class AliasedCancelTsPage {
  constructor(
    private locators: {
      note: { fill(v: string): Promise<void> };
      cancel: { click(): Promise<void> };
    },
  ) {}

  private get cancel() {
    return this.locators.cancel;
  }

  async dismiss(note: string) {
    await this.locators.note.fill(note);
    await this.cancel.click();
  }
}
