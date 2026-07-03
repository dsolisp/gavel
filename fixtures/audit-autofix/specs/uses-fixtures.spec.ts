import { UsedPage } from '../pages/UsedPage';
import { UsedMixed } from '../pages/MixedPage';
import { createUsed } from '../factories/UsedFactory';

export function runUsedFlow() {
  const page = new UsedPage();
  const mixed = new UsedMixed();
  return page.open() + createUsed().id + mixed.open();
}
