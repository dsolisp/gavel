import axios from 'axios';
import { test } from '@playwright/test';

test.describe('orders', () => {
  test.afterEach(async () => {
    await axios.delete('/orders/latest');
  });

  test('creates an order', async () => {
    await axios.post('/orders', { symbol: 'ABC' });
  });
});
