export class XPathLocators {
  readonly firstAncestor = this.page.locator('xpath=//button/ancestor::section[1]');
}
