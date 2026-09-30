import { SharedSubmitTsPage } from '../pages/shared/SharedSubmitTsPage';

export async function runSharedSubmitTsTwice(page: SharedSubmitTsPage) {
  await page.sharedSubmitTs();
  await page.sharedSubmitTs();
}
