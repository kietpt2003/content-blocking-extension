import { parseCosmetic, parseLines, validateSettings } from '../core/settings.js';
import { getSettings, notice, updateSettings } from './shared.js';
import { getLanguage, setLanguage, t } from './i18n.js';

const fields = ['enabled', 'network', 'cosmetic', 'youtubeData'];
const sites = ['youtube', 'facebook', 'tiktok', 'xvideos', 'vlxx', 'viet69', 'vnsextop'];
const byId = (id) => document.getElementById(id);
document.querySelector('.version').textContent = chrome.runtime.getManifest().version;

function populate(settings) {
  setLanguage(settings.language);
  byId('language').value = settings.language;
  fields.forEach((key) => {
    byId(key).checked = settings[key];
  });
  sites.forEach((key) => {
    byId(key).checked = settings.sites[key];
  });
  byId('customDomains').value = settings.customDomains.join('\n');
  byId('disabledSites').value = settings.disabledSites.join('\n');
  byId('customCosmetic').value = settings.customCosmetic
    .map((rule) => `${rule.domain}##${rule.selector}`)
    .join('\n');
}

function validateCSS(settings) {
  for (const { selector } of settings.customCosmetic) {
    try {
      document.querySelector(selector);
    } catch {
      throw new Error(t('error_css', { selector }));
    }
  }
  return settings;
}

byId('settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  byId('save').disabled = true;
  try {
    const settings = validateCSS(
      validateSettings({
        language: byId('language').value,
        ...Object.fromEntries(fields.map((key) => [key, byId(key).checked])),
        sites: Object.fromEntries(sites.map((key) => [key, byId(key).checked])),
        customDomains: parseLines(byId('customDomains').value),
        disabledSites: parseLines(byId('disabledSites').value),
        customCosmetic: parseCosmetic(byId('customCosmetic').value, getLanguage()),
      }),
    );
    populate(await updateSettings(settings));
    notice('saved');
  } catch (error) {
    notice(error.message, true);
  } finally {
    byId('save').disabled = false;
  }
});

byId('export').addEventListener('click', async () => {
  try {
    const blob = new Blob([JSON.stringify(await getSettings(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'home-content-blocker.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice('exported');
  } catch (error) {
    notice(error.message, true);
  }
});
byId('import').addEventListener('click', () => byId('file').click());
byId('file').addEventListener('change', async () => {
  try {
    const file = byId('file').files[0];
    if (!file) return;
    if (file.size > 128 * 1024) throw new Error(t('error_file_size'));
    let imported;
    try {
      imported = JSON.parse(await file.text());
    } catch {
      throw new Error(t('error_json'));
    }
    populate(validateCSS(validateSettings(imported, getLanguage())));
    notice('imported');
  } catch (error) {
    notice(error.message, true);
  } finally {
    byId('file').value = '';
  }
});
byId('reset').addEventListener('click', async () => {
  if (!confirm(t('reset_confirm'))) return;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'RESET_SETTINGS' });
    if (!result.ok) throw new Error(result.error);
    populate(result.settings);
    notice('reset_done');
  } catch (error) {
    notice(error.message, true);
  }
});
document.addEventListener('home-blocker:language-changed', () => {
  byId('language').value = getLanguage();
});
byId('language').addEventListener('change', async () => {
  const language = byId('language');
  language.disabled = true;
  try {
    await updateSettings({ language: language.value });
    notice('language_saved');
  } catch (error) {
    language.value = getLanguage();
    notice(error.message, true);
  } finally {
    language.disabled = false;
  }
});
getSettings()
  .then((settings) => {
    populate(settings);
    notice('settings_local');
  })
  .catch((error) => notice(error.message, true));
