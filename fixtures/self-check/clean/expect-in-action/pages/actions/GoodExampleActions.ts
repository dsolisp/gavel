// Action class: workflows only — assertions live in specs, so expect-in-action stays quiet.
import type { ExamplePageLocators } from '../locators/ExamplePageLocators';

export class GoodExampleActions {
  constructor(private readonly locators: ExamplePageLocators) {}

  async submitOrder() {
    await this.locators.saveButton.click();
    await this.locators.confirmButton.click();
  }
}
