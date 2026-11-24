import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { installPlayerAdGate } from '../../src/core/player-gate.js';
import { playerPageScript, applyPlayerPageScript } from '../../src/core/page-scripts.js';
import { DEFAULTS } from '../../src/config/defaults.js';
import { validateSettings } from '../../src/core/settings.js';

test('configured player hook preserves media source and restores the original ad gate', () => {
  const target = {};
  const configure = installPlayerAdGate(target);
  vm.runInContext(
    `
    function Player() { this.source = 'content.m3u8'; }
    HTML5Player = Player;
    Player.prototype = { _checkVideoAdsCommon() { return true; } };
    var player = new HTML5Player();
  `,
    vm.createContext(target),
  );
  assert.equal(target.player._checkVideoAdsCommon('preroll'), false);
  assert.equal(target.player.source, 'content.m3u8');
  configure(false);
  assert.equal(target.player._checkVideoAdsCommon('postroll'), true);
  configure(true);
  assert.equal(target.player._checkVideoAdsCommon('postroll'), false);
  const unsupported = { HTML5Player: function () {} };
  installPlayerAdGate(unsupported);
  assert(new unsupported.HTML5Player());
});

test('old switches migrate without enabling any player domain or losing custom filters', () => {
  const legacy = validateSettings({
    schemaVersion: 1,
    sites: { retiredPlatform: false, anotherRetiredPlatform: true, youtube: false },
    customDomains: ['ads.example.com'],
  });
  assert.deepEqual(legacy.playerDomains, []);
  assert.deepEqual(legacy.sites, { youtube: false, facebook: true, tiktok: true });
  assert.deepEqual(legacy.customDomains, ['ads.example.com']);
  assert.throws(() => validateSettings({ schemaVersion: 1, sites: { retiredPlatform: 'false' } }));
  assert.deepEqual(
    validateSettings({
      playerDomains: [
        'https://video.example.com/*',
        'https://*.video.example.com/*',
        'VIDEO.example.com',
      ],
    }).playerDomains,
    ['video.example.com'],
  );
  for (const value of [
    'http://video.example.com/*',
    'https://video.example.com/watch/*',
    'https://video.example.com:443/*',
    'https://video.example.com/?x=1',
    'https://*/*',
    'https://video.example.com@attacker.test/*',
  ])
    assert.throws(() => validateSettings({ playerDomains: [value] }));
  assert.throws(() => validateSettings({ playerDomains: Array(251).fill('example.com') }));
  const settings = validateSettings({
    playerDomains: ['VIDEO.example.com', 'video.example.com'],
    disabledSites: ['private.example.com'],
  });
  assert.deepEqual(playerPageScript(settings).matches, [
    'https://video.example.com/*',
    'https://*.video.example.com/*',
  ]);
  assert.deepEqual(playerPageScript(settings).excludeMatches, [
    'https://private.example.com/*',
    'https://*.private.example.com/*',
  ]);
  assert(
    playerPageScript({
      ...settings,
      sites: { ...settings.sites, youtube: false },
    }).excludeMatches.includes('https://*.youtube.com/*'),
  );
  assert.equal(playerPageScript(DEFAULTS), null);
  assert.equal(playerPageScript({ ...settings, network: false }), null);
  assert.equal(playerPageScript({ ...settings, enabled: false }), null);
});

test('upgrade removes unrecognized persisted registrations, updates opt-in domains, and clears registration', async () => {
  const registered = new Map([
    ['retired-player-script', { id: 'retired-player-script' }],
    ['another-retired-script', { id: 'another-retired-script' }],
  ]);
  const scripting = {
    getRegisteredContentScripts: async () => [...registered.values()],
    unregisterContentScripts: async ({ ids }) => ids.forEach((id) => registered.delete(id)),
    registerContentScripts: async (scripts) =>
      scripts.forEach((script) => registered.set(script.id, script)),
    updateContentScripts: async (scripts) =>
      scripts.forEach((script) => registered.set(script.id, script)),
  };
  registered.set('leaf-content-guard-youtube-json', { id: 'leaf-content-guard-youtube-json' });
  await applyPlayerPageScript(DEFAULTS, scripting);
  assert.deepEqual([...registered.keys()], ['leaf-content-guard-youtube-json']);
  registered.delete('leaf-content-guard-youtube-json');
  await applyPlayerPageScript({ ...DEFAULTS, playerDomains: ['video.example.com'] }, scripting);
  assert.equal(registered.size, 1);
  await applyPlayerPageScript({ ...DEFAULTS, playerDomains: ['other.example.com'] }, scripting);
  assert(
    registered.get('leaf-content-guard-player-ads').matches.includes('https://other.example.com/*'),
  );
  assert(
    !registered
      .get('leaf-content-guard-player-ads')
      .matches.includes('https://video.example.com/*'),
  );
  await applyPlayerPageScript(DEFAULTS, scripting);
  assert.equal(registered.size, 0);
});
