import assert from 'node:assert/strict';
import test from 'node:test';
import { checkRateLimit, isSpamLike } from './storageDb';

test('spam screening flags obvious URLs and flooding', () => {
  assert.equal(isSpamLike('Visit https://example.com now'), true);
  assert.equal(isSpamLike('I hope tomorrow feels gentler.'), false);
  assert.equal(isSpamLike('!!!!!!!!!!!!!!'), true);
});

test('rate limiting blocks the sixth wish for one identity', () => {
  const identity = `test-${Date.now()}-${Math.random()}`;
  assert.deepEqual(Array.from({ length: 5 }, () => checkRateLimit(identity, 'createWish')), [true, true, true, true, true]);
  assert.equal(checkRateLimit(identity, 'createWish'), false);
});

test('rate-limit buckets are independent per identity', () => {
  const first = `test-${Date.now()}-a`;
  const second = `test-${Date.now()}-b`;
  for (let count = 0; count < 5; count += 1) checkRateLimit(first, 'createWish');
  assert.equal(checkRateLimit(first, 'createWish'), false);
  assert.equal(checkRateLimit(second, 'createWish'), true);
});