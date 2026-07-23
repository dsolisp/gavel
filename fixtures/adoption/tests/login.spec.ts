// Consumes the toast helper and the authed fixture; the modal helper and admin fixture stay unadopted.
import { test } from '../fixtures/base';
import { waitForToast } from '../lib/waits';

test('shows a toast after saving', async ({ authedPage }) => {
  await authedPage.getByRole('button', { name: 'Save' }).click();
  await waitForToast(authedPage, 'Saved');
});
