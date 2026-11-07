import vi from '../locales/vi.js';
import en from '../locales/en.js';
import zhCN from '../locales/zh-CN.js';

export const CATALOGS = { vi, en, 'zh-CN': zhCN };
export const LANGUAGES = Object.keys(CATALOGS);

export function normalizeLanguage(language) {
  return typeof language === 'string' && Object.hasOwn(CATALOGS, language) ? language : 'vi';
}

export function translate(language, key, parameters = {}) {
  const template = CATALOGS[normalizeLanguage(language)][key]?.message ?? vi[key]?.message ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(parameters, name) ? String(parameters[name]) : match,
  );
}
