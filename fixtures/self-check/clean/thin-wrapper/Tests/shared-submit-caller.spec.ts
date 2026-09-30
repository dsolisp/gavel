import { SharedSubmitPage } from '../pages/shared/SharedSubmitPage';

export async function runSharedTwice(page: SharedSubmitPage) {
  await page.sharedSubmit();
  await page.sharedSubmit();
}
