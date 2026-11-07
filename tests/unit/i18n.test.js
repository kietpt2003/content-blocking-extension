import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { CATALOGS, LANGUAGES, normalizeLanguage, translate } from '../../src/core/i18n.js';
import { DEFAULTS } from '../../src/config/defaults.js';
import { validateSettings, parseCosmetic } from '../../src/core/settings.js';
import { compileNetworkRules } from '../../src/core/network.js';

test('all supported languages have complete messages and matching interpolation parameters', () => {
  const keys = Object.keys(CATALOGS.vi).sort();
  const parameters = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const language of LANGUAGES) {
    assert.deepEqual(Object.keys(CATALOGS[language]).sort(), keys);
    for (const key of keys) {
      const message = CATALOGS[language][key].message;
      assert.equal(typeof message, 'string', `${language}.${key}`);
      assert(message.trim(), `${language}.${key}`);
      assert.deepEqual(
        parameters(message),
        parameters(CATALOGS.vi[key].message),
        `${language}.${key}`,
      );
    }
  }
});

test('translations fall back safely and treat parameters as literal text', () => {
  for (const language of [undefined, 'fr', 'constructor', {}, null]) {
    assert.equal(normalizeLanguage(language), 'vi');
    assert.equal(translate(language, 'save'), 'Lưu cấu hình');
  }
  assert.equal(translate('en', 'missing_key'), 'missing_key');
  assert.equal(translate('en', 'popup_hidden', { count: 12 }), '12 hidden elements');
  assert.equal(translate('zh-CN', 'popup_hidden', { count: 12 }), '已隐藏 12 个元素');
  assert(
    translate('en', 'error_css', { selector: '<img src=x onerror=alert(1)>' }).includes(
      '<img src=x onerror=alert(1)>',
    ),
  );
});

test('static UI translation keys exist in every catalog', () => {
  for (const page of ['options', 'popup']) {
    const html = readFileSync(new URL(`../../src/ui/${page}.html`, import.meta.url), 'utf8');
    for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) {
      for (const language of LANGUAGES)
        assert(CATALOGS[language][key], `${page}: ${language}.${key}`);
    }
  }
});

test('language migration preserves filtering policy and validation errors follow the chosen language', () => {
  const migrated = validateSettings({
    sites: { xvideos: false },
    customDomains: ['ads.example.com'],
  });
  assert.equal(migrated.language, 'vi');
  assert.equal(migrated.sites.xvideos, false);
  assert.deepEqual(migrated.customDomains, ['ads.example.com']);
  for (const language of LANGUAGES) {
    assert.equal(validateSettings({ language }).language, language);
    assert.deepEqual(compileNetworkRules({ ...DEFAULTS, language }), compileNetworkRules(DEFAULTS));
    assert.throws(() => validateSettings({ language, customDomains: ['https://invalid.test'] }), {
      message: translate(language, 'error_domain', { value: 'https://invalid.test' }),
    });
    assert.throws(() => parseCosmetic('invalid', language), {
      message: translate(language, 'error_cosmetic_format', { line: 'invalid' }),
    });
  }
  for (const language of ['fr', '', false, null, 'zh_CN'])
    assert.throws(() => validateSettings({ language }));
});
