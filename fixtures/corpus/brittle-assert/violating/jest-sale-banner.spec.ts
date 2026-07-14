import { expect, test } from '@jest/globals';

test('banner equals punctuated prose', () => {
  const banner = 'Sale ends Friday!';
  expect(banner).toEqual('Sale ends Friday!');
});
