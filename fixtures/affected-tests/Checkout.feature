@checkout-smoke @payments.regression
Feature: Checkout

  Scenario: Card payment succeeds
    Given a signed-in shopper
    When they pay with a saved card
    Then the order is confirmed
