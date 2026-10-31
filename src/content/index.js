import { DEFAULTS } from '../config/defaults.js';
import { filteringEnabled, siteForHost, validateSettings } from '../core/settings.js';
import { DomEngine } from './dom-engine.js';
import { YouTubePrompts } from './youtube-prompts.js';

let host = location.hostname;
if (!host && document.referrer) {
  try {
    host = new URL(document.referrer).hostname;
  } catch {
    /* Opaque origin. */
  }
}
const engine = new DomEngine(document, host);
const youtubePrompts = siteForHost(host) === 'youtube' ? new YouTubePrompts(document) : null;
let settings = structuredClone(DEFAULTS);
let settingsLoaded = false;
let youtubeDiagnostics = null;

document.addEventListener('home-blocker:diagnostics', (event) => {
  try {
    const value = JSON.parse(event.detail);
    if (typeof value.version !== 'string' || value.version.length > 30) return;
    const safe = { version: value.version, enabled: value.enabled === true, hooks: {} };
    for (const key of ['fetch', 'xhr', 'initial']) safe.hooks[key] = value.hooks?.[key] === true;
    for (const key of [
      'fetchInspected',
      'fetchChanged',
      'xhrInspected',
      'xhrChanged',
      'initialInspected',
      'initialChanged',
      'removedFields',
      'unsupported',
    ]) {
      safe[key] =
        Number.isSafeInteger(value[key]) && value[key] >= 0 ? Math.min(value[key], 1000000) : 0;
    }
    youtubeDiagnostics = safe;
  } catch {
    /* Page events are untrusted; never forward body, URL or arbitrary fields. */
  }
});

function sendPageState() {
  // The registered MAIN script already has the correct startup policy. Do not
  // overwrite it with DEFAULTS while the real storage response is pending.
  if (!settingsLoaded) return;
  document.dispatchEvent(
    new CustomEvent('home-blocker:settings', {
      detail: JSON.stringify({
        youtubeData: filteringEnabled(settings, host) && settings.youtubeData,
      }),
    }),
  );
}

function apply(value) {
  try {
    settings = validateSettings(value);
  } catch {
    settings = structuredClone(DEFAULTS);
  }
  settingsLoaded = true;
  engine.configure(settings, filteringEnabled(settings, host) && settings.cosmetic);
  youtubePrompts?.configure(engine.active);
  sendPageState();
}

document.addEventListener('home-blocker:ready', sendPageState);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) apply(changes.settings.newValue ?? DEFAULTS);
});
chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === 'GET_PAGE_STATUS') {
    document.dispatchEvent(new CustomEvent('home-blocker:diagnostics-request'));
    respond({
      host,
      version: chrome.runtime.getManifest().version,
      youtube: youtubeDiagnostics,
      youtubeAdState: {
        adShowing: Boolean(
          document.querySelector(
            '#movie_player.ad-showing, #movie_player.ad-interrupting, .html5-video-player.ad-showing, .html5-video-player.ad-interrupting',
          ),
        ),
      },
      ...engine.status(),
    });
  }
});
chrome.runtime
  .sendMessage({ type: 'GET_SETTINGS' })
  .then((result) => {
    if (result.ok) apply(result.settings);
  })
  .catch(() => {
    engine.stop();
    youtubePrompts?.stop();
  });
document.addEventListener(
  'DOMContentLoaded',
  () => {
    if (settingsLoaded) apply(settings);
  },
  { once: true },
);
