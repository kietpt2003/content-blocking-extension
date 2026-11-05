import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULTS } from '../../src/config/defaults.js';
import { youtubePageScript, applyYouTubePageScript } from '../../src/core/page-scripts.js';

test('early MAIN hook is registered by default and respects disabled policy and exceptions', () => {
  assert.equal(youtubePageScript(DEFAULTS).runAt, 'document_start');
  for (const settings of [
    { ...DEFAULTS, youtubeData: false },
    { ...DEFAULTS, youtubeData: true, enabled: false },
    { ...DEFAULTS, youtubeData: true, sites: { ...DEFAULTS.sites, youtube: false } },
  ])
    assert.equal(youtubePageScript(settings), null);
  const script = youtubePageScript({
    ...DEFAULTS,
    youtubeData: true,
    disabledSites: ['m.youtube.com'],
  });
  assert.equal(script.runAt, 'document_start');
  assert.equal(script.world, 'MAIN');
  assert.deepEqual(script.excludeMatches, ['https://m.youtube.com/*', 'https://*.m.youtube.com/*']);
});

test('policy updates replace the same registered hook and unregister it when disabled', async () => {
  const calls = [];
  let existing;
  const scripting = {
    getRegisteredContentScripts: async () => (existing ? [existing] : []),
    registerContentScripts: async ([script]) => {
      existing = script;
      calls.push('register');
    },
    updateContentScripts: async ([script]) => {
      existing = script;
      calls.push('update');
    },
    unregisterContentScripts: async () => {
      existing = null;
      calls.push('unregister');
    },
  };
  await applyYouTubePageScript({ ...DEFAULTS, youtubeData: true }, scripting);
  await applyYouTubePageScript(
    { ...DEFAULTS, youtubeData: true, disabledSites: ['youtube.com'] },
    scripting,
  );
  assert(existing.excludeMatches.includes('https://*.youtube.com/*'));
  await applyYouTubePageScript({ ...DEFAULTS, youtubeData: false }, scripting);
  assert.deepEqual(calls, ['register', 'update', 'unregister']);
});
