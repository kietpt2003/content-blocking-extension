import { SITE_DOMAINS } from '../config/defaults.js';

const SCRIPT_ID = 'leaf-content-guard-youtube-json';

export function youtubePageScript(settings) {
  if (!settings.enabled || !settings.youtubeData || !settings.sites.youtube) return null;
  return {
    id: SCRIPT_ID,
    matches: ['https://youtube.com/*', 'https://*.youtube.com/*'],
    excludeMatches: settings.disabledSites.flatMap((domain) => [
      `https://${domain}/*`,
      `https://*.${domain}/*`,
    ]),
    js: ['youtube-main.js'],
    world: 'MAIN',
    runAt: 'document_start',
    allFrames: true,
    persistAcrossSessions: true,
  };
}

export async function applyYouTubePageScript(settings, scripting) {
  const [existing] = await scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  const script = youtubePageScript(settings);
  if (!script) {
    if (existing) await scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  } else if (existing) await scripting.updateContentScripts([script]);
  else await scripting.registerContentScripts([script]);
}

const PLAYER_SCRIPT_ID = 'leaf-content-guard-player-ads';

export function playerPageScript(settings) {
  if (!settings.enabled || !settings.network || !settings.playerDomains.length) return null;
  const excluded = [
    ...settings.disabledSites,
    ...Object.entries(settings.sites).flatMap(([site, enabled]) =>
      enabled ? [] : SITE_DOMAINS[site],
    ),
  ];
  return {
    id: PLAYER_SCRIPT_ID,
    matches: settings.playerDomains.flatMap((domain) => [
      `https://${domain}/*`,
      `https://*.${domain}/*`,
    ]),
    excludeMatches: [...new Set(excluded)].flatMap((domain) => [
      `https://${domain}/*`,
      `https://*.${domain}/*`,
    ]),
    js: ['player-main.js'],
    world: 'MAIN',
    runAt: 'document_start',
    allFrames: true,
    persistAcrossSessions: true,
  };
}

export async function applyPlayerPageScript(settings, scripting) {
  const scripts = await scripting.getRegisteredContentScripts();
  const activeIds = new Set([SCRIPT_ID, PLAYER_SCRIPT_ID]);
  const retiredIds = scripts.filter(({ id }) => !activeIds.has(id)).map(({ id }) => id);
  if (retiredIds.length) await scripting.unregisterContentScripts({ ids: retiredIds });
  const existing = scripts.some(({ id }) => id === PLAYER_SCRIPT_ID);
  const script = playerPageScript(settings);
  if (!script) {
    if (existing) await scripting.unregisterContentScripts({ ids: [PLAYER_SCRIPT_ID] });
  } else if (existing) await scripting.updateContentScripts([script]);
  else await scripting.registerContentScripts([script]);
}
