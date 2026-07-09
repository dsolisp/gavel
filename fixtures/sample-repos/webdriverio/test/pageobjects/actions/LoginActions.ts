import { LoginLocators } from '../locators/LoginLocators';

// Action class: receives the locator class, owns user workflows.
// Specs own assertions; actions return state or perform interactions.
export class LoginActions {
  private locators = new LoginLocators();

  async navigateTo(path: string): Promise<void> {
    await browser.url(path);
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.locators.emailInput.waitForDisplayed();
    await this.locators.emailInput.setValue(email);
    await this.locators.passwordInput.setValue(password);
    await this.locators.signInButton.click();
  }
}
