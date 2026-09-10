import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkRateLimit,
  createWish,
  fulfillWish,
  getFulfilledWishes,
  getMirrorWishes,
  getPersonalSky,
  getWishById,
  isSpamLike,
  listConstellations,
  listWishes,
  saveWish,
  unsaveWish,
} from './storageDb';

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

test('save and unsave wish updates saved collection', async () => {
  const anon = `user-${Date.now()}-save`;
  const wish = await createWish({ text: 'I wish for quiet waters', category: 'peace' }, anon);
  assert.ok('id' in wish);

  // Save wish
  const saveRes = await saveWish(wish.id, anon);
  assert.deepEqual(saveRes, { saved: true });

  // Get personal sky and verify saved wish is present
  const sky = await getPersonalSky(anon);
  assert.ok(sky.savedWishes.some((w) => w.id === wish.id));
  assert.ok(sky.ownWishes.some((w) => w.id === wish.id));

  // Unsave wish
  const unsaveRes = await unsaveWish(wish.id, anon);
  assert.deepEqual(unsaveRes, { saved: false });

  // Verify removed from saved collection
  const skyAfter = await getPersonalSky(anon);
  assert.ok(!skyAfter.savedWishes.some((w) => w.id === wish.id));
});

test('voluntary wish fulfillment and Morning Sky retrieval', async () => {
  const owner = `user-${Date.now()}-fulfill`;
  const stranger = `user-${Date.now()}-stranger`;
  const wish = await createWish({ text: 'I hope I finish my painting', category: 'growth' }, owner);
  assert.ok('id' in wish);

  // Stranger cannot fulfill owner wish
  const forbidden = await fulfillWish(wish.id, stranger, 'Not mine');
  assert.ok(forbidden && 'code' in forbidden && forbidden.code === 'FORBIDDEN');

  // Owner fulfills wish
  const fulfilled = await fulfillWish(wish.id, owner, 'It is finally on the wall.');
  assert.ok(fulfilled && 'fulfilledAt' in fulfilled && fulfilled.fulfilledAt !== null);
  assert.equal(fulfilled.fulfillmentNote, 'It is finally on the wall.');

  // Morning sky includes this wish
  const morningSky = await getFulfilledWishes();
  assert.ok(morningSky.some((w) => w.id === wish.id));
});

test('constellations list categories with counts and descriptions', async () => {
  const constellations = await listConstellations();
  assert.ok(Array.isArray(constellations));
  assert.ok(constellations.length > 0);
  const hope = constellations.find((c) => c.slug === 'hope');
  if (hope) {
    assert.equal(typeof hope.wishCount, 'number');
    assert.ok(hope.description && hope.description.length > 0);
  }
});

test('mirror returns related wishes excluding source wish', async () => {
  const anon = `user-${Date.now()}-mirror`;
  const wish1 = await createWish({ text: 'I wish to find courage today', category: 'hope' }, anon);
  assert.ok('id' in wish1);

  const mirror = await getMirrorWishes(wish1.id, 3);
  assert.equal(mirror.message, "You're not the only one.");
  assert.ok(Array.isArray(mirror.relatedWishes));
  // Source wish must be excluded
  assert.ok(!mirror.relatedWishes.some((w) => w.id === wish1.id));
});

test('regression: private wishes do not leak across public queries', async () => {
  const owner = `user-${Date.now()}-priv-owner`;
  const stranger = `user-${Date.now()}-priv-stranger`;

  // 1. Create private wish
  const privateWish = await createWish(
    {
      text: 'My intimate private reflection and secrets ' + Date.now(),
      category: 'peace',
      visibility: 'private',
    },
    owner
  );
  assert.ok('id' in privateWish);
  assert.equal(privateWish.visibility, 'private');

  // 2. Must not appear in listWishes()
  const publicWishes = await listWishes();
  assert.equal(publicWishes.some((w) => w.id === privateWish.id), false);

  // 3. Must not be retrievable via public getWishById()
  const retrievedWish = await getWishById(privateWish.id);
  assert.equal(retrievedWish, undefined);

  // 4. Must not be saveable by stranger (defense in depth)
  const saveResult = await saveWish(privateWish.id, stranger);
  assert.equal(saveResult, undefined);

  // 5. Owner can fulfill their private wish
  const fulfilledPrivate = await fulfillWish(privateWish.id, owner, 'Resolved quietly.');
  assert.ok(fulfilledPrivate && 'fulfilledAt' in fulfilledPrivate && fulfilledPrivate.fulfilledAt !== null);

  // 6. Must not appear in Morning Sky (getFulfilledWishes)
  const morningSky = await getFulfilledWishes();
  assert.equal(morningSky.some((w) => w.id === privateWish.id), false);

  // 7. Create another wish in the same category and test Mirror search
  const echoWish = await createWish(
    {
      text: 'Seeking peace and intimate reflection ' + Date.now(),
      category: 'peace',
      visibility: 'public',
    },
    stranger
  );
  assert.ok('id' in echoWish);

  const mirrorResults = await getMirrorWishes(echoWish.id);
  assert.equal(mirrorResults.relatedWishes.some((w) => w.id === privateWish.id), false);

  // 8. Owner can still see their own private wish in Personal Sky
  const ownerSky = await getPersonalSky(owner);
  assert.ok(ownerSky.ownWishes.some((w) => w.id === privateWish.id));
});