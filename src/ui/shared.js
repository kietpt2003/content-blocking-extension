import { setLanguage, t } from './i18n.js';

export async function getSettings() {
  const result = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  if (!result?.ok) throw new Error(result?.error || t('error_get_settings'));
  setLanguage(result.settings.language);
  return result.settings;
}

export async function updateSettings(patch) {
  const result = await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', patch });
  if (!result?.ok) throw new Error(result?.error || t('error_save_settings'));
  setLanguage(result.settings.language);
  return result.settings;
}

let lastNotice;
export function notice(message, error = false, parameters = {}) {
  lastNotice = { message, error, parameters };
  const status = document.querySelector('#status');
  status.textContent = t(message, parameters);
  status.dataset.error = String(error);
}
document.addEventListener('home-blocker:language-changed', () => {
  if (lastNotice) notice(lastNotice.message, lastNotice.error, lastNotice.parameters);
});
