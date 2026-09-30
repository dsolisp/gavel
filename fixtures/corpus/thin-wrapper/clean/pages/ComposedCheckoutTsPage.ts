export class ComposedCheckoutTsPage {
  constructor(
    private locators: {
      card: { fill(v: string): Promise<void> };
      payButton: { click(): Promise<void> };
    },
  ) {}

  async checkout(card: string) {
    await this.locators.card.fill(card);
    await this.locators.payButton.click();
  }
}
