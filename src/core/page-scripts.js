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
