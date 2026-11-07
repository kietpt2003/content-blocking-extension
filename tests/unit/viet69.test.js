import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULTS } from '../../src/config/defaults.js';
import { compileNetworkRules } from '../../src/core/network.js';
import { filteringEnabled, validateSettings } from '../../src/core/settings.js';

test('Viet69 settings migrate without changing other sites and honor domain boundaries', () => {
  const settings = validateSettings({ sites: { vlxx: false, xvideos: false } });
  assert.equal(settings.sites.viet69, true);
  assert.equal(settings.sites.vlxx, false);
  assert.equal(settings.sites.xvideos, false);
  const disabled = validateSettings({ sites: { viet69: false } });
  assert.equal(filteringEnabled(disabled, 'viet69.be'), false);
  assert.equal(filteringEnabled(disabled, 'www.viet69.be'), false);
  assert.equal(filteringEnabled(disabled, 'notviet69.be'), true);
  assert.equal(filteringEnabled(disabled, 'vlxx.app'), true);
  assert.throws(() => validateSettings({ sites: { viet69: 'false' } }));
});

test('Viet69 only blocks observed ad scripts, leaving its site and player resources intact', () => {
  const rule = compileNetworkRules(DEFAULTS).find((r) =>
    r.condition.requestDomains?.includes('cdn2.vietadx.net'),
  );
  assert.equal(rule.action.type, 'block');
  assert.deepEqual(rule.condition.initiatorDomains, ['viet69.be']);
  assert.deepEqual(rule.condition.resourceTypes, ['script']);
  const pattern = new RegExp(rule.condition.regexFilter);
  for (const name of ['main', 'top', 'underplayer']) {
    assert(pattern.test(`https://cdn2.vietadx.net/v/v-${name}-adx.js?v=123`));
  }
  for (const url of [
    'https://cdn.viedn.net/wp-content/themes/detube/custom.js',
    'https://viet69.be/get.video.php',
    'https://emb.cd-vs.com/assets/main-d6702a2c.js',
    'https://cdn2.vietadx.net/v/content.m3u8',
    'https://cdn2.vietadx.net/other/v-main-adx.js',
    'https://cdn2.vietadx.net/v/v-main-adx.js.backup',
    'https://cdn2.vietadx.net.attacker.test/v/v-main-adx.js',
  ])
    assert.equal(pattern.test(url), false);
});

test('Viet69 secondary banner host is blocked only for Viet69 subresources', () => {
  const rule = compileNetworkRules(DEFAULTS).find((r) =>
    r.condition.requestDomains?.includes('vertigovitalitywieldable.com'),
  );
  assert.deepEqual(rule.condition.initiatorDomains, ['viet69.be']);
  assert.deepEqual(rule.condition.excludedResourceTypes, ['main_frame']);
  const pattern = new RegExp(rule.condition.regexFilter);
  assert(pattern.test('https://vertigovitalitywieldable.com/bn.js'));
  assert(pattern.test('https://vertigovitalitywieldable.com/banner.jpg'));
  assert(!pattern.test('https://vertigovitalitywieldable.com.attacker.test/bn.js'));
  assert(!pattern.test('https://emb.cd-vs.com/bn.js'));
});
