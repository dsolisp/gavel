export class LoginActions {
  constructor(private locators: LoginLocators) {}
  async submit() {
    await this.locators.submitButton.click();
  }
}
