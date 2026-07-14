// Fixture factory: page object construction lives here, not in specs.
// Specs call these getters inside beforeEach and reuse the result across tests.
import { LoginActions } from '../test/pageobjects/actions/LoginActions';
import { LoginLocators } from '../test/pageobjects/locators/LoginLocators';

export function getLoginActions(): LoginActions {
  return new LoginActions();
}

export function getLoginLocators(): LoginLocators {
  return new LoginLocators();
}
