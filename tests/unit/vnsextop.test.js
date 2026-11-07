import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULTS } from '../../src/config/defaults.js';
import { compileNetworkRules } from '../../src/core/network.js';
import { filteringEnabled, validateSettings } from '../../src/core/settings.js';

test('VNSexTop defaults migrate existing site choices and validate its switch', () => {
  const settings = validateSettings({ sites: { viet69: false, vlxx: false } });
  assert.equal(settings.sites.vnsextop, true);
  assert.equal(settings.sites.viet69, false);
  assert.equal(settings.sites.vlxx, false);
  const disabled = validateSettings({ sites: { vnsextop: false } });
  assert.equal(filteringEnabled(disabled, 'vnsextop1.pro'), false);
  assert.equal(filteringEnabled(disabled, 'www.vnsextop1.pro'), false);
  assert.equal(filteringEnabled(disabled, 'notvnsextop1.pro'), true);
  assert.equal(filteringEnabled(disabled, 'viet69.be'), true);
  assert.throws(() => validateSettings({ sites: { vnsextop: 'false' } }));
});

test('VNSexTop ad sources are scoped to its initiator and do not block the site or player', () => {
  const rule = compileNetworkRules(DEFAULTS).find((r) =>
    r.condition.requestDomains?.includes('earmuffpostnasalrisotto.com'),
  );
  assert.deepEqual(rule.condition.initiatorDomains, ['vnsextop1.pro']);
  assert.deepEqual(rule.condition.excludedResourceTypes, ['main_frame']);
  const pattern = new RegExp(rule.condition.regexFilter);
  for (const host of rule.condition.requestDomains) assert(pattern.test(`https://${host}/on.js`));
  for (const url of [
    'https://earmuffpostnasalrisotto.com.attacker.test/bn.js',
    'https://vnsextop1.pro/wp-content/themes/kakael/assets/js/main.js',
    'https://vnsextop1.pro/wp-content/themes/kakael/assets/js/DPlayer.min.js',
    'https://b.dfplayer.cc/bf.html?did=2256',
    'https://b.dfplayer.cc/content.m3u8',
  ])
    assert.equal(pattern.test(url), false);
});
