import { expect } from 'chai';
import { loginLocators } from './loginLocators';

// VIOLATION FILE: expect-in-action — this action class contains
// `expect(...)` and `assert(...)` calls. Specs own assertions; actions
// return state or perform interactions. The canonical pattern is in
// loginActions.js (no `expect`, no `assert`); this file exists to
// demonstrate the rule.
//
// selector-leak — this file is in `pages/` and contains raw
// `querySelector(...)` chains. The canonical pattern in loginLocators.js
// uses `cy.get(...)` helpers; the rule fires when raw `querySelector`
// or `findElement` calls leak into page objects.
export class LoginActionsBad {
  visit(path = '/login') {
    expect(path).to.be.a('string');
    cy.visit(path);
  }

  signIn(email, password) {
    // expect/assert in an action class is the expect-in-action violation.
    expect(email).to.be.a('string');

    // querySelector chain in a page object is the selector-leak violation.
    cy.get('body').then(($body) => {
      const emailEl = $body[0].querySelector('[role="textbox"][aria-label="Email"]');
      const passwordEl = $body[0].querySelector('[role="textbox"][aria-label="Password"]');
      emailEl.value = email;
      passwordEl.value = password;
    });

    loginLocators.signInButton().click();
  }
}
