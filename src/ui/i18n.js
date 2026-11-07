import { normalizeLanguage, translate } from '../core/i18n.js';

let language = 'vi';
export const getLanguage = () => language;
export const t = (key, parameters) => translate(language, key, parameters);

export function localizePage() {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
}

export function setLanguage(value) {
  const next = normalizeLanguage(value);
  const changed = language !== next;
  if (!changed) return;
  language = next;
  localizePage();
  if (changed) document.dispatchEvent(new Event('home-blocker:language-changed'));
}

localizePage();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) setLanguage(changes.settings.newValue?.language);
});
