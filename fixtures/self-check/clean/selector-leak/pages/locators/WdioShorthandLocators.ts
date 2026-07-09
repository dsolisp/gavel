// @ts-nocheck
// Locator class: $() shorthand is allowed here — selector-leak stays quiet.
export class WdioShorthandLocators {
  get emailInput() {
    return $('[role="textbox"][aria-label="Email"]');
  }

  get allButtons() {
    return $$('button');
  }
}
