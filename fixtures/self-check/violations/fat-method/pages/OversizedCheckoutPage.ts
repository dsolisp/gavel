export class OversizedCheckoutPage {
  constructor(
    private locators: {
      email: { fill(v: string): Promise<void> };
      card: { fill(v: string): Promise<void> };
      address: { fill(v: string): Promise<void> };
      city: { fill(v: string): Promise<void> };
      zip: { fill(v: string): Promise<void> };
      terms: { check(): Promise<void> };
      newsletter: { check(): Promise<void> };
      continueBtn: { click(): Promise<void> };
      placeOrder: { click(): Promise<void> };
    },
  ) {}

  async completeCheckout(email: string, card: string, address: string, city: string, zip: string) {
    await this.locators.email.fill(email);
    await this.locators.card.fill(card);
    await this.locators.address.fill(address);
    await this.locators.city.fill(city);
    await this.locators.zip.fill(zip);
    await this.locators.terms.check();
    await this.locators.newsletter.check();
    await this.locators.continueBtn.click();
    let step = 'review';
    step = 'confirm';
    step = 'place';
    step = 'done';
    step = 'a';
    step = 'b';
    step = 'c';
    step = 'd';
    step = 'e';
    step = 'f';
    step = 'g';
    step = 'h';
    step = 'i';
    step = 'j';
    step = 'k';
    step = 'l';
    step = 'm';
    step = 'n';
    await this.locators.placeOrder.click();
    void step;
  }
}
