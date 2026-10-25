import { DEFAULTS, SITE_DOMAINS } from '../config/defaults.js';

export function domainMatches(host, domain) {
  host = host.toLowerCase().replace(/\.$/, '');
  return host === domain || host.endsWith(`.${domain}`);
}

export function normalizeDomain(value) {
  if (typeof value !== 'string') throw new Error('Domain phải là chuỗi.');
  const domain = value.trim().toLowerCase().replace(/\.$/, '');
  if (
    domain.length > 253 ||
    !domain ||
    domain.split('.').some((part) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part))
  ) {
    throw new Error(
      `Domain không hợp lệ: ${value}. Chỉ nhập hostname, không nhập URL hoặc wildcard.`,
    );
  }
  return domain;
}

function domainList(value, name) {
  if (!Array.isArray(value) || value.length > 250) {
    throw new Error(`${name}: tối đa 250 domain.`);
  }
  return [...new Set(value.map(normalizeDomain))].sort();
}

export function validateSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Cấu hình phải là object JSON.');
  }
  if (Object.keys(input).some((key) => !Object.hasOwn(DEFAULTS, key))) {
    throw new Error('Cấu hình chứa trường không được hỗ trợ.');
  }
  const merged = { ...structuredClone(DEFAULTS), ...input };
  if (merged.schemaVersion !== 1) throw new Error('schemaVersion phải là 1.');
  for (const field of ['enabled', 'network', 'cosmetic', 'youtubeData']) {
    if (typeof merged[field] !== 'boolean') throw new Error(`${field} phải là boolean.`);
  }
  if (!merged.sites || typeof merged.sites !== 'object' || Array.isArray(merged.sites)) {
    throw new Error('sites không hợp lệ.');
  }
  if (Object.keys(merged.sites).some((key) => !Object.hasOwn(SITE_DOMAINS, key))) {
    throw new Error('Website không được hỗ trợ trong sites.');
  }
  merged.sites = { ...DEFAULTS.sites, ...merged.sites };
  if (Object.values(merged.sites).some((value) => typeof value !== 'boolean')) {
    throw new Error('Công tắc website phải là boolean.');
  }
  merged.disabledSites = domainList(merged.disabledSites, 'Danh sách ngoại lệ');
  merged.customDomains = domainList(merged.customDomains, 'Domain tùy chỉnh');
  if (!Array.isArray(merged.customCosmetic) || merged.customCosmetic.length > 100) {
    throw new Error('Tối đa 100 quy tắc HTML tùy chỉnh.');
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
      throw new Error('Quy tắc HTML cần domain và CSS selector hợp lệ.');
    return { domain: normalizeDomain(rule.domain), selector: rule.selector.trim() };
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

export function parseCosmetic(text) {
  return parseLines(text).map((line) => {
    const separator = line.indexOf('##');
    if (separator <= 0) throw new Error(`Quy tắc HTML cần dạng domain##selector: ${line}`);
    return { domain: line.slice(0, separator), selector: line.slice(separator + 2) };
  });
}
