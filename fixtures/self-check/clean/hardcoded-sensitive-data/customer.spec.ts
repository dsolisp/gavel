import { test } from '@playwright/test';
import { CustomerFactory } from '../factories/customer-factory';

test('creates customer', async () => {
  const customer = CustomerFactory.create();
  void customer;
});
