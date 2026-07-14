import { test } from '@playwright/test';
import { OrderFactory } from '../support/OrderFactory';

test('prepares an order through the factory', async () => {
  const order = OrderFactory.create();
  await test.step('use factory data', async () => {
    console.log(order.symbol);
  });
});
