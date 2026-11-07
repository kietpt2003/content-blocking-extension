import { DEFAULTS, SITE_DOMAINS } from '../config/defaults.js';
import { LANGUAGES, translate } from './i18n.js';

export function domainMatches(host, domain) {
  host = host.toLowerCase().replace(/\.$/, '');
  return host === domain || host.endsWith(`.${domain}`);
}

export function normalizeDomain(value, language = 'vi') {
  if (typeof value !== 'string') throw new Error(translate(language, 'error_domain_type'));
  const domain = value.trim().toLowerCase().replace(/\.$/, '');
  if (
    domain.length > 253 ||
    !domain ||
    domain.split('.').some((part) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part))
  ) {
    throw new Error(translate(language, 'error_domain', { value }));
  }
  return domain;
}

function domainList(value, name, language) {
  if (!Array.isArray(value) || value.length > 250) {
    throw new Error(translate(language, 'error_domain_limit', { name: translate(language, name) }));
  }
  return [...new Set(value.map((domain) => normalizeDomain(domain, language)))].sort();
}

export function validateSettings(input, language = input?.language ?? 'vi') {
  const t = (key, parameters) => translate(language, key, parameters);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(t('error_settings_object'));
  }
  if (Object.keys(input).some((key) => !Object.hasOwn(DEFAULTS, key))) {
    throw new Error(t('error_settings_unknown'));
  }
  const merged = { ...structuredClone(DEFAULTS), ...input };
  if (merged.schemaVersion !== 1) throw new Error(t('error_schema'));
  if (!LANGUAGES.includes(merged.language)) throw new Error(t('error_language'));
  for (const field of ['enabled', 'network', 'cosmetic', 'youtubeData']) {
    if (typeof merged[field] !== 'boolean') throw new Error(t('error_boolean', { field }));
  }
  if (!merged.sites || typeof merged.sites !== 'object' || Array.isArray(merged.sites)) {
    throw new Error(t('error_sites'));
  }
  if (Object.keys(merged.sites).some((key) => !Object.hasOwn(SITE_DOMAINS, key))) {
    throw new Error(t('error_site_unknown'));
  }
  merged.sites = { ...DEFAULTS.sites, ...merged.sites };
  if (Object.values(merged.sites).some((value) => typeof value !== 'boolean')) {
    throw new Error(t('error_site_boolean'));
  }
  merged.disabledSites = domainList(merged.disabledSites, 'domain_list_excluded', language);
  merged.customDomains = domainList(merged.customDomains, 'domain_list_custom', language);
  if (!Array.isArray(merged.customCosmetic) || merged.customCosmetic.length > 100) {
    throw new Error(t('error_cosmetic_limit'));
  }
  merged.customCosmetic = merged.customCosmetic.map((rule) => {
    if (
      !rule ||
      typeof rule !== 'object' ||
      Object.keys(rule).some((key) => !['domain', 'selector'].includes(key)) ||
      typeof rule.selector !== 'string' ||
      !rule.selector.trim() ||
      rule.selector.length > 500 ||
      /[{}<>]/.test(rule.selector)
    )
      throw new Error(t('error_cosmetic'));
    return { domain: normalizeDomain(rule.domain, language), selector: rule.selector.trim() };
  });
  return merged;
}

export function siteForHost(host) {
  return Object.keys(SITE_DOMAINS).find((site) =>
    SITE_DOMAINS[site].some((domain) => domainMatches(host, domain)),
  );
}

export function filteringEnabled(settings, host) {
  const site = siteForHost(host);
  return (
    settings.enabled &&
    !settings.disabledSites.some((domain) => domainMatches(host, domain)) &&
    (!site || settings.sites[site])
  );
}

export function parseLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('!'));
}

export function parseCosmetic(text, language = 'vi') {
  return parseLines(text).map((line) => {
    const separator = line.indexOf('##');
    if (separator <= 0) throw new Error(translate(language, 'error_cosmetic_format', { line }));
    return { domain: line.slice(0, separator), selector: line.slice(separator + 2) };
  });
}
