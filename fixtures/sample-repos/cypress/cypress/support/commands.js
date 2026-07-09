// cypress/support/commands.js — shared actions as custom commands.
import { LoginActions } from '../pages/loginActions';

const login = new LoginActions();

Cypress.Commands.add('login', (email, password) => {
  login.visit();
  login.signIn(email, password);
});
