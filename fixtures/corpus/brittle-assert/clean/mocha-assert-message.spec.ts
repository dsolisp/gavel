import assert from 'assert';
import { describe, it } from 'mocha';

describe('errors', () => {
  it('asserts a status code with a prose failure message', () => {
    const status = 404;
    assert.equal(status, 404, 'Status should be Not Found.');
  });
});
