// Remediation helpers. waitForToast is adopted by a spec; waitForModal is not.

export async function waitForToast(page: Page, text: string): Promise<void> {
  await page.getByRole('status').filter({ hasText: text }).waitFor();
}

export const waitForModal = async (page: Page): Promise<void> => {
  await page.getByRole('dialog').waitFor();
};
