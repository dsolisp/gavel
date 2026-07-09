// Locator helpers: every selector lives here. Specs call these helpers,
// not `cy.get(...)` directly.
export const loginLocators = {
  emailInput: () => cy.get('[role="textbox"][aria-label="Email"]'),
  passwordInput: () => cy.get('[role="textbox"][aria-label="Password"]'),
  signInButton: () => cy.get('button[role="button"]').contains('Sign in'),
  dashboardHeading: () => cy.get('h1').contains('Dashboard'),
  errorMessage: () => cy.contains('Invalid credentials'),
};
