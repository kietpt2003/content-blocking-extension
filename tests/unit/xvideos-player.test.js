import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { installXVideosAdGate } from '../../src/core/xvideos-player.js';
import { xvideosPageScript } from '../../src/core/page-scripts.js';
import { DEFAULTS } from '../../src/config/defaults.js';
import { compileNetworkRules } from '../../src/core/network.js';
import { filteringEnabled, validateSettings } from '../../src/core/settings.js';

test('late prototype assignment blocks both ad types while preserving construction and content', () => {
  const target = {};
  const setEnabled = installXVideosAdGate(target);
  const context = vm.createContext(target);
  vm.runInContext(
    `
    function Player() { this.source = 'content.m3u8'; this.calls = []; }
    HTML5Player = Player;
    Player.prototype = {
      _checkVideoAdsCommon(type) { this.calls.push(type); return type === 'preroll'; }
    };
    var player = new HTML5Player();
  `,
    context,
  );
  const { player } = target;
  assert(player instanceof target.Player);
  assert.equal(player.source, 'content.m3u8');
  assert.equal(player._checkVideoAdsCommon('preroll'), false);
  assert.equal(player._checkVideoAdsCommon('postroll'), false);
  assert.equal(player.calls.length, 0);
  setEnabled(false);
  assert.equal(player._checkVideoAdsCommon('preroll'), true);
  assert.equal(player._checkVideoAdsCommon('postroll'), false);
  assert.deepEqual(Array.from(player.calls), ['preroll', 'postroll']);
  setEnabled(true);
  assert.equal(player._checkVideoAdsCommon('preroll'), false);
});

test('missing player ad API leaves the constructor usable', () => {
  const target = { HTML5Player: function () {} };
  installXVideosAdGate(target);
  assert(new target.HTML5Player());
});

test('registration respects network policy and website exceptions', () => {
  assert.equal(xvideosPageScript({ ...DEFAULTS, enabled: false }), null);
  assert.equal(xvideosPageScript({ ...DEFAULTS, network: false }), null);
  assert.equal(
    xvideosPageScript({ ...DEFAULTS, sites: { ...DEFAULTS.sites, xvideos: false } }),
    null,
  );
  const script = xvideosPageScript({ ...DEFAULTS, disabledSites: ['xvideos.com'] });
  assert.equal(script.world, 'MAIN');
  assert.equal(script.runAt, 'document_start');
  assert(script.excludeMatches.includes('https://*.xvideos.com/*'));
});

test('older settings enable XVideos by default and its switch exempts only that website', () => {
  const older = validateSettings({ sites: { youtube: false, facebook: true, tiktok: true } });
  assert.equal(older.sites.xvideos, true);
  assert.equal(older.sites.youtube, false);
  const settings = validateSettings({ sites: { xvideos: false } });
  assert.equal(filteringEnabled(settings, 'www.xvideos.com'), false);
  assert.equal(filteringEnabled(settings, 'xvideos.com'), false);
  assert.equal(filteringEnabled(settings, 'www.youtube.com'), true);
  assert.equal(filteringEnabled(settings, 'notxvideos.com'), true);
  assert(
    compileNetworkRules(settings).some(
      (rule) =>
        rule.action.type === 'allow' && rule.condition.initiatorDomains?.includes('xvideos.com'),
    ),
  );
  assert.throws(() => validateSettings({ sites: { xvideos: 'false' } }));
});

test('VAST network fallback is limited to the observed ad endpoint and initiator', () => {
  const rule = compileNetworkRules(DEFAULTS).find((r) =>
    r.condition.requestDomains?.includes('pemsrv.com'),
  );
  assert.deepEqual(rule.condition.initiatorDomains, ['xvideos.com']);
  assert.deepEqual(rule.condition.resourceTypes, ['xmlhttprequest']);
  const pattern = new RegExp(rule.condition.regexFilter);
  assert(pattern.test('https://s.pemsrv.com/v1/vast.php?zone=1'));
  assert(!pattern.test('https://s.pemsrv.com/content.m3u8'));
  assert(!pattern.test('https://notpemsrv.com/v1/vast.php'));
});
