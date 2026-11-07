import { NETWORK_DOMAINS, NETWORK_PATHS, SITE_DOMAINS } from '../config/defaults.js';

export function compileNetworkRules(settings) {
  if (!settings.enabled || !settings.network) return [];
  let id = 1;
  const rules = [...new Set([...NETWORK_DOMAINS, ...settings.customDomains])].map((domain) => ({
    id: id++,
    priority: 1,
    action: { type: 'block' },
    condition: { requestDomains: [domain], excludedResourceTypes: ['main_frame'] },
  }));
  for (const entry of NETWORK_PATHS) {
    rules.push({
      id: id++,
      priority: 1,
      action: entry.action ?? { type: 'block' },
      condition: {
        requestDomains: entry.domains,
        regexFilter: entry.regex,
        ...(entry.resourceTypes
          ? { resourceTypes: entry.resourceTypes }
          : { excludedResourceTypes: ['main_frame'] }),
        ...(entry.initiatorDomains ? { initiatorDomains: entry.initiatorDomains } : {}),
      },
    });
  }
  const exceptions = new Set(settings.disabledSites);
  for (const [site, enabled] of Object.entries(settings.sites)) {
    if (!enabled) SITE_DOMAINS[site].forEach((domain) => exceptions.add(domain));
  }
  for (const domain of exceptions) {
    rules.push({
      id: id++,
      priority: 1000,
      action: { type: 'allow' },
      condition: { initiatorDomains: [domain] },
    });
    rules.push({
      id: id++,
      priority: 1000,
      action: { type: 'allowAllRequests' },
      condition: { requestDomains: [domain], resourceTypes: ['main_frame', 'sub_frame'] },
    });
  }
  return rules;
}
