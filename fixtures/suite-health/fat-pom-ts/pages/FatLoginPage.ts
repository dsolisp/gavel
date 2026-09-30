export class FatLoginPage {
  constructor(private page: { getByRole(role: string, opts: { name: string }): { click(): Promise<void> } }) {}

  // Creates a selector AND performs an action — fat POM
  submitButton = this.page.getByRole('button', { name: 'Submit' });

  async signIn() {
    await this.submitButton.click();
  }
}
