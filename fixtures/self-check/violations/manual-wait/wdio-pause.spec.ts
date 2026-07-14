// @ts-nocheck
// VIOLATION: manual-wait — browser.pause() is a fixed timeout wait.
// WebdriverIO's browser.pause() is the equivalent of waitForTimeout().
describe('Example', () => {
  it('waits with browser.pause', async () => {
    await browser.pause(2000);
  });
});
