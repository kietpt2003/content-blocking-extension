const SCRIPT_ID = 'home-blocker-youtube-json';

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

const XVIDEOS_SCRIPT_ID = 'home-blocker-xvideos-ads';

export function xvideosPageScript(settings) {
  if (!settings.enabled || !settings.network || !settings.sites.xvideos) return null;
  return {
    id: XVIDEOS_SCRIPT_ID,
    matches: ['https://xvideos.com/*', 'https://*.xvideos.com/*'],
    excludeMatches: settings.disabledSites.flatMap((domain) => [
      `https://${domain}/*`,
      `https://*.${domain}/*`,
    ]),
    js: ['xvideos-main.js'],
    world: 'MAIN',
    runAt: 'document_start',
    allFrames: true,
    persistAcrossSessions: true,
  };
}

export async function applyXVideosPageScript(settings, scripting) {
  const [existing] = await scripting.getRegisteredContentScripts({ ids: [XVIDEOS_SCRIPT_ID] });
  const script = xvideosPageScript(settings);
  if (!script) {
    if (existing) await scripting.unregisterContentScripts({ ids: [XVIDEOS_SCRIPT_ID] });
  } else if (existing) await scripting.updateContentScripts([script]);
  else await scripting.registerContentScripts([script]);
}
