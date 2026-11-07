import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULTS } from '../../src/config/defaults.js';
import { compileNetworkRules } from '../../src/core/network.js';
import { filteringEnabled, validateSettings } from '../../src/core/settings.js';

test('VLXX settings support both domains, preserve older choices and reject invalid flags', () => {
  const settings = validateSettings({ sites: { xvideos: false } });
  assert.equal(settings.sites.vlxx, true);
  assert.equal(settings.sites.xvideos, false);
  const disabled = validateSettings({ sites: { vlxx: false } });
  for (const host of ['vlxx.app', 'www.vlxx.app', 'vlxx.phd']) {
    assert.equal(filteringEnabled(settings, host), true);
    assert.equal(filteringEnabled(disabled, host), false);
  }
  assert.equal(filteringEnabled(disabled, 'notvlxx.app'), true);
  assert.throws(() => validateSettings({ sites: { vlxx: 0 } }));
});

test('VLXX rules redirect only the ad supplier and keep player bootstrap and content URLs', () => {
  const rules = compileNetworkRules(DEFAULTS);
  const scoped = rules.filter((r) => r.condition.requestDomains?.includes('cdn.adxcontent.com'));
  const matches = (url) => scoped.filter((r) => new RegExp(r.condition.regexFilter).test(url));
  const [supplier] = matches('https://cdn.adxcontent.com/vlxx/vl-inplayer-adx.js?v=123');
  assert.equal(supplier.action.type, 'redirect');
  assert.equal(supplier.action.redirect.extensionPath, '/vlxx-no-ads.js');
  assert.deepEqual(supplier.condition.resourceTypes, ['script']);
  for (const path of [
    'vl-top-adx.js',
    'vl-main-adx.js',
    'vl-underplayer-adx.js',
    'tvc/man88.xml',
  ]) {
    assert.equal(matches('https://cdn.adxcontent.com/vlxx/' + path)[0].action.type, 'block');
  }
  for (const url of [
    'https://play.vlstream.net/static/1788013375/embed-vast.js',
    'https://cdn.vlplayer.com/jwplayer/jwplayer.js',
    'https://cdn.adxcontent.com/another-site/vl-main-adx.js',
    'https://cdn.adxcontent.com/vlxx/content.m3u8',
    'https://cdn.adxcontent.com/vlxx/vl-inplayer-adx.js.backup',
    'https://cdn.adxcontent.com.attacker.test/vlxx/vl-inplayer-adx.js',
  ])
    assert.equal(matches(url).length, 0);
  for (const rule of scoped) {
    assert(!rule.condition.initiatorDomains.includes('news.example.com'));
  }
});
