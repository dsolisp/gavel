import axios from 'axios';
import { test } from '@playwright/test';

test.describe('orders', () => {
  test('creates an order', async () => {
    await axios.post('/orders', { symbol: 'ABC' });
  });
});
