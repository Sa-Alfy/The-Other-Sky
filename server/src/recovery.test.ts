import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressInfo } from 'node:net';
import { WORDLIST } from './wordlist';
import { generateRecoveryPhrase, hashRecoveryPhrase, verifyRecoveryPhrase, isValidPhraseFormat } from './recovery';
import { createRecoveryPhrase, recoverUserByPhrase, createWish, getPersonalSky } from './storageDb';
import app, { sessionCookieName, recoverRateLimiter } from './index';

test('wordlist contains exactly 2048 unique words for 44-bit entropy', () => {
  assert.equal(WORDLIST.length, 2048);
  const unique = new Set(WORDLIST);
  assert.equal(unique.size, 2048);
});

test('generating recovery phrase produces well-formed 4-word phrase from wordlist', () => {
  const phrase = generateRecoveryPhrase();
  assert.ok(typeof phrase === 'string');
  assert.equal(isValidPhraseFormat(phrase), true);

  const parts = phrase.split('-');
  assert.equal(parts.length, 4);
  for (const part of parts) {
    assert.ok(WORDLIST.includes(part), `Word "${part}" must be in the 2048-word list`);
  }
});

test('bcrypt hashing and verification for recovery phrase', async () => {
  const phrase = generateRecoveryPhrase();
  const hash = await hashRecoveryPhrase(phrase);
  assert.ok(hash.startsWith('$2'), 'Hash should be a bcrypt hash');

  const matches = await verifyRecoveryPhrase(phrase, hash);
  assert.equal(matches, true);

  const wrongMatches = await verifyRecoveryPhrase('wrong-wrong-wrong-wrong', hash);
  assert.equal(wrongMatches, false);
});

test('generating a phrase for a user without one succeeds, and second attempt conflicts', async () => {
  const anonymousId = `user-${Date.now()}-recovery-gen`;
  
  // First generation succeeds
  const result1 = await createRecoveryPhrase(anonymousId);
  assert.ok('phrase' in result1, 'First generation should return phrase');
  assert.equal(isValidPhraseFormat(result1.phrase), true);

  // Second generation returns conflict
  const result2 = await createRecoveryPhrase(anonymousId);
  assert.ok('error' in result2);
  assert.equal(result2.code, 'CONFLICT');
});

test('recovering with correct phrase reassigns identity; incorrect phrase fails generically', async () => {
  const originalAnonId = `user-${Date.now()}-owner`;
  
  // Create a wish for this owner
  const wish = await createWish({ text: 'My precious sky wish ' + Date.now(), category: 'hope' }, originalAnonId);
  assert.ok('id' in wish);

  // Generate recovery phrase
  const phraseResult = await createRecoveryPhrase(originalAnonId);
  assert.ok('phrase' in phraseResult);
  const phrase = phraseResult.phrase;

  // Recover with correct phrase
  const recoveredUser = await recoverUserByPhrase(phrase);
  assert.ok(recoveredUser, 'Should find user with correct phrase');
  assert.equal(recoveredUser.anonymous_id, originalAnonId);

  // Confirm Personal Sky for recovered identity contains the wish
  const sky = await getPersonalSky(recoveredUser.anonymous_id);
  assert.ok(sky.ownWishes.some((w) => w.id === wish.id));
  assert.equal(sky.hasRecoveryPhrase, true);

  // Recover with incorrect phrase fails generically
  const failedUser = await recoverUserByPhrase('abandon-abandon-abandon-abandon');
  assert.equal(failedUser, null);
});

test('HTTP endpoint POST /api/me/recovery-phrase and POST /api/me/recover flows', async () => {
  // Reset rate limiter state so prior tests don't pollute this one
  recoverRateLimiter.resetKey('127.0.0.1');
  recoverRateLimiter.resetKey('::ffff:127.0.0.1');
  recoverRateLimiter.resetKey('::1');

  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. First visit gets a session cookie
    const initRes = await fetch(`${baseUrl}/api/me/sky`);
    assert.equal(initRes.status, 200);
    const cookieHeader = initRes.headers.get('set-cookie');
    assert.ok(cookieHeader, 'Initial request should receive session cookie');
    const sidCookie = cookieHeader.split(';')[0]; // e.g. othersky_sid=<value>
    const sidValue = sidCookie.split('=').slice(1).join('='); // the anonymous_id value

    // 2. Generate recovery phrase
    const genRes = await fetch(`${baseUrl}/api/me/recovery-phrase`, {
      method: 'POST',
      headers: { Cookie: sidCookie },
    });
    assert.equal(genRes.status, 201);
    const genBody = await genRes.json();
    assert.equal(genBody.success, true);
    assert.ok(genBody.data.phrase);
    const phrase = genBody.data.phrase;
    assert.equal(isValidPhraseFormat(phrase), true);

    // 3. Second attempt to generate phrase for the same session returns 409 Conflict
    const genConflictRes = await fetch(`${baseUrl}/api/me/recovery-phrase`, {
      method: 'POST',
      headers: { Cookie: sidCookie },
    });
    assert.equal(genConflictRes.status, 409);
    const genConflictBody = await genConflictRes.json();
    assert.equal(genConflictBody.success, false);
    assert.equal(genConflictBody.error.code, 'CONFLICT');

    // 4. Recovery with invalid phrase returns generic 401
    const badRecoverRes = await fetch(`${baseUrl}/api/me/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase: 'invalid-invalid-invalid-invalid' }),
    });
    assert.equal(badRecoverRes.status, 401);
    const badRecoverBody = await badRecoverRes.json();
    assert.equal(badRecoverBody.success, false);
    assert.equal(badRecoverBody.error.message, 'Invalid recovery phrase.');

    // 5. Recovery with valid phrase returns 200 and reissues session cookie
    const goodRecoverRes = await fetch(`${baseUrl}/api/me/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase }),
    });
    assert.equal(goodRecoverRes.status, 200);
    const goodRecoverBody = await goodRecoverRes.json();
    assert.equal(goodRecoverBody.success, true);
    assert.equal(goodRecoverBody.data.recovered, true);

    // The recovery response must set a cookie whose value matches the original identity
    const recoveredCookieHeader = goodRecoverRes.headers.get('set-cookie');
    assert.ok(recoveredCookieHeader, 'Recovery must set session cookie');
    const recoveredSidValue = recoveredCookieHeader.split(';')[0].split('=').slice(1).join('=');
    assert.equal(
      recoveredSidValue,
      sidValue,
      'Recovered session cookie value should match the original anonymous identity'
    );
  } finally {
    server.close();
  }
});

test('rate limiting on POST /api/me/recover blocks 6th rapid attempt from the same IP', async () => {
  recoverRateLimiter.resetKey('127.0.0.1');
  recoverRateLimiter.resetKey('::ffff:127.0.0.1');
  recoverRateLimiter.resetKey('::1');

  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const attempts: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${baseUrl}/api/me/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: 'test-attempt-phrase-' + i }),
      });
      attempts.push(res.status);
    }

    // First 5 attempts return 401 (Invalid recovery phrase)
    assert.deepEqual(attempts.slice(0, 5), [401, 401, 401, 401, 401]);
    // 6th attempt is blocked with 429 Too Many Requests
    assert.equal(attempts[5], 429);
  } finally {
    server.close();
  }
});
