/// <reference types="cypress" />
import { UserFactory } from '../support/factories';
import { loginLocators } from '../pages/loginLocators';

// Page object instantiation lives in support/commands.js (`cy.login`).
// Specs receive behavior via custom commands and locator helpers — no
// `new` keyword appears in spec files.
describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('valid credentials redirect to dashboard @smoke', () => {
    const user = UserFactory.create({ role: 'trader' });

    cy.login(user.email, user.password);
    loginLocators.dashboardHeading().should('be.visible');
  });

  it('invalid credentials show error @regression', () => {
    cy.login('wrong@example.test', 'wrongpass');
    loginLocators.errorMessage().should('be.visible');
  });
});
