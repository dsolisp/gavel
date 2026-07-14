import assert from 'assert';
import { describe, it } from 'mocha';

describe('counts', () => {
  it('zero is numeric', () => {
    const count = 0;
    assert.equal(count, 0);
  });
});
