// VIOLATION FILE: each violation demonstrates one Gavel self-check rule.
// Run `node scripts/self-check.js fixtures/sample-repos/cypress` to see
// the findings. Do not copy this file into a real suite.
//
// Note: Cypress's spec file pattern is `.cy.js` rather than `.spec.js`.
// Several self-check rules (no-di, no-step, skip-marker, bare-test-fail,
// test-fail-order) gate on `*.spec.*` or `*.test.*` and therefore do
// not fire on `.cy.js` files. The patterns below are still demonstrated
// for documentation; the canonical triggers live in pages/loginActionsBad.js
// (expect-in-action, selector-leak) and the manual-wait / ignore-no-reason
// triggers below.

import { LoginActions } from '../pages/loginActions';
import { LoginActionsBad } from '../pages/loginActionsBad';

const loginPage = new LoginActions();
const badLoginPage = new LoginActionsBad();

describe('Login (bad)', () => {
  it.skip('should show error on bad credentials', () => {
    loginPage.signIn('wrong@example.test', 'wrong');
  });

  it('valid credentials redirect to dashboard', () => {
    cy.wait(2000);

    // gavel-ignore

    badLoginPage.signIn('user@example.test', 'pw-1234');
    cy.contains('Dashboard').should('be.visible');
  });

  it('alternate sign-in path exercises the bad action', () => {
    badLoginPage.signIn('user@example.test', 'pw-1234');
    cy.contains('Dashboard').should('be.visible');
  });

  it('login form rejects empty email', () => {
    cy.visit('/login');
    cy.contains('Sign in').click();
    cy.wait(500);
    cy.contains('Email is required').should('be.visible');
  });

  it('login form rejects empty password', () => {
    cy.visit('/login');
    cy.contains('Email').type('user@example.test');
    cy.contains('Sign in').click();
    cy.wait(500);
    cy.contains('Password is required').should('be.visible');
  });

  it('rate limit kicks in after many attempts', () => {
    for (let i = 0; i < 5; i += 1) {
      cy.visit('/login');
      cy.contains('Email').type('user@example.test');
      cy.contains('Password').type(`wrong-${i}`);
      cy.contains('Sign in').click();
      cy.wait(100);
    }
    cy.contains('Too many attempts').should('be.visible');
  });

  it('full happy-path journey exercises every input', () => {
    cy.visit('/login');
    cy.contains('Email').type('user@example.test');
    cy.contains('Password').type('pw-1234');
    cy.contains('Sign in').click();
    cy.contains('Dashboard').should('be.visible');
  });

  it('full error-path journey shows the error state', () => {
    cy.visit('/login');
    cy.contains('Email').type('user@example.test');
    cy.contains('Password').type('wrong');
    cy.contains('Sign in').click();
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('session persists across page reloads', () => {
    cy.visit('/login');
    cy.contains('Email').type('user@example.test');
    cy.contains('Password').type('pw-1234');
    cy.contains('Sign in').click();
    cy.reload();
    cy.contains('Dashboard').should('be.visible');
  });

  it('logout returns to the login page', () => {
    cy.visit('/login');
    cy.contains('Email').type('user@example.test');
    cy.contains('Password').type('pw-1234');
    cy.contains('Sign in').click();
    cy.contains('Sign out').click();
    cy.contains('Sign in').should('be.visible');
  });
});
