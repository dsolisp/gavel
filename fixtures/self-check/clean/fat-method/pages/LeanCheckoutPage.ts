export class LeanCheckoutPage {
  constructor(
    private locators: {
      card: { fill(v: string): Promise<void> };
      pay: { click(): Promise<void> };
      note: { fill(v: string): Promise<void> };
    },
  ) {}

  // Three actions — under fat-method threshold
  async pay(card: string) {
    await this.locators.card.fill(card);
    await this.locators.note.fill('ok');
    await this.locators.pay.click();
  }
}
