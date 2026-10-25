import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isYouTubeApi,
  pruneYouTubeAds,
  pruneYouTubeAdsInPlace,
} from '../../src/core/youtube-json.js';

test('JSON filtering preserves playback and organic content without mutating input', () => {
  const input = {
    adPlacements: [1],
    playerAds: [2],
    streamingData: { formats: [{ url: 'keep' }] },
    playabilityStatus: { status: 'OK' },
    items: [{ adSlotRenderer: {} }, { videoRenderer: { title: 'organic' } }],
  };
  const copy = structuredClone(input);
  const result = pruneYouTubeAds(input);
  assert.equal(result.removed, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(result.value)), {
    streamingData: input.streamingData,
    playabilityStatus: input.playabilityStatus,
    items: [input.items[1]],
  });
  assert.deepEqual(input, copy);
});

test('YouTube API matcher does not touch media, unrelated hosts or lookalikes', () => {
  assert(
    isYouTubeApi('/youtubei/v1/player?prettyPrint=false', 'https://www.youtube.com/watch?v=test'),
  );
  assert(
    !isYouTubeApi(
      'https://youtube.com.attacker.test/youtubei/v1/player',
      'https://www.youtube.com',
    ),
  );
  assert(!isYouTubeApi('https://googlevideo.com/videoplayback', 'https://www.youtube.com'));
  assert(!isYouTubeApi('/youtubei/v1/player-other', 'https://www.youtube.com'));
  assert(isYouTubeApi('/youtubei/v1/get_watch?prettyPrint=false', 'https://www.youtube.com'));
  assert(!isYouTubeApi('/youtubei/v1/get_watch-other', 'https://www.youtube.com'));
});

test('deep data fails without modifying the source', () => {
  const input = { adSlots: [] };
  let pointer = input;
  for (let index = 0; index < 110; index++) {
    pointer.child = {};
    pointer = pointer.child;
  }
  assert.throws(() => pruneYouTubeAds(input));
  assert.deepEqual(input.adSlots, []);
});

test('initial player data is pruned in place with stable references and array order', () => {
  const organic = { videoRenderer: { id: 'keep' } };
  const items = [{ adSlotRenderer: {} }, { displayAdRenderer: {} }, organic];
  const input = {
    playerAds: [1],
    nested: { adSlots: [2], items },
    streamingData: { formats: ['keep'] },
  };
  const nested = input.nested;
  assert.equal(pruneYouTubeAdsInPlace(input), 4);
  assert.equal(input.nested, nested);
  assert.equal(input.nested.items, items);
  assert.equal(items[0], organic);
  assert.equal(items.length, 1);
  assert.deepEqual(input.streamingData, { formats: ['keep'] });
});

test('initial data planning failure does not partially strip earlier fields', () => {
  const input = { playerAds: [1], nested: Object.freeze({ adSlots: [2] }) };
  assert.throws(() => pruneYouTubeAdsInPlace(input));
  assert.deepEqual(input.playerAds, [1]);
  assert.deepEqual(input.nested.adSlots, [2]);
});
