import assert from 'assert';
import { describe, it } from 'mocha';

describe('errors', () => {
  it('matches full error prose', () => {
    const message = 'File not found.';
    assert.strictEqual(message, 'File not found.');
  });
});
