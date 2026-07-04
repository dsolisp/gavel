@smoke @ci.fast
Feature: Login

  @regression @e2e-smoke
  Scenario: Valid login succeeds
    Given a registered user
    When they log in with valid credentials
    Then they see the dashboard