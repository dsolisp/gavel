import { expect } from 'chai';
import { loginLocators } from './loginLocators';

// Service object: receives the locator helpers, owns user workflows.
// No assertions here — specs own `.should()`.
export class LoginActions {
  visit(path = '/login') {
    cy.visit(path);
  }

  signIn(email, password) {
    loginLocators.emailInput().clear().type(email);
    loginLocators.passwordInput().clear().type(password);
    loginLocators.signInButton().click();
  }
}
