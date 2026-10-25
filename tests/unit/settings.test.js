import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULTS } from '../../src/config/defaults.js';
import {
  domainMatches,
  filteringEnabled,
  normalizeDomain,
  parseCosmetic,
  validateSettings,
} from '../../src/core/settings.js';
import { compileNetworkRules } from '../../src/core/network.js';

test('domain boundaries do not match suffix lookalikes', () => {
  assert.equal(domainMatches('www.youtube.com', 'youtube.com'), true);
  assert.equal(domainMatches('notyoutube.com', 'youtube.com'), false);
  assert.equal(domainMatches('youtube.com.attacker.test', 'youtube.com'), false);
  assert.equal(normalizeDomain(' ADS.Example.COM. '), 'ads.example.com');
});

test('settings normalize duplicates and reject unsafe or unsupported input', () => {
  assert.deepEqual(
    validateSettings({ customDomains: ['Ads.Example.com', 'ads.example.com'] }).customDomains,
    ['ads.example.com'],
  );
  for (const input of [
    null,
    { enabled: 'false' },
    { unknown: true },
    { sites: { instagram: true } },
    { customDomains: ['https://ads.example.com'] },
    { customCosmetic: [{ domain: 'example.com', selector: '</style>' }] },
    { schemaVersion: 2 },
  ]) {
    assert.throws(() => validateSettings(input));
  }
});

test('per-site switches and exceptions take precedence', () => {
  const settings = validateSettings({ sites: { youtube: false }, disabledSites: ['example.com'] });
  assert.equal(filteringEnabled(settings, 'www.youtube.com'), false);
  assert.equal(filteringEnabled(settings, 'm.example.com'), false);
  assert.equal(filteringEnabled(settings, 'www.facebook.com'), true);
});

test('network disable clears all generated rules and rules have unique ids', () => {
  const settings = validateSettings({
    customDomains: ['ads.example.com'],
    disabledSites: ['news.example.com'],
  });
  const rules = compileNetworkRules(settings);
  assert.equal(new Set(rules.map((rule) => rule.id)).size, rules.length);
  assert(
    rules.some(
      (rule) =>
        rule.action.type === 'block' && rule.condition.requestDomains?.includes('ads.example.com'),
    ),
  );
  assert(rules.some((rule) => rule.action.type === 'allowAllRequests' && rule.priority > 1));
  assert.deepEqual(compileNetworkRules({ ...DEFAULTS, enabled: false }), []);
  assert.deepEqual(compileNetworkRules({ ...DEFAULTS, network: false }), []);
  assert(
    !rules.some(
      (rule) =>
        rule.action.type === 'block' &&
        rule.condition.requestDomains?.includes('googlevideo.com') &&
        !rule.condition.regexFilter,
    ),
  );
});

test('cosmetic text preserves CSS selectors containing hashes', () => {
  assert.deepEqual(parseCosmetic('! comment\nexample.com###ad-slot'), [
    { domain: 'example.com', selector: '#ad-slot' },
  ]);
  assert.throws(() => parseCosmetic('.advertisement'));
});
