import { domainMatches } from '../core/settings.js';
import { getSettings, notice, updateSettings } from './shared.js';
import { t } from './i18n.js';

let settings;
let host = '';
let tabId;
let diagnosticReport = null;
let recording = false;
const enabled = document.querySelector('#enabled');
const xvideos = document.querySelector('#xvideos');
const vlxx = document.querySelector('#vlxx');
const viet69 = document.querySelector('#viet69');
const vnsextop = document.querySelector('#vnsextop');
const toggle = document.querySelector('#site-toggle');
document.querySelector('#version').textContent = chrome.runtime.getManifest().version;

let hiddenCount = 0;
function renderHidden() {
  const number = document.createElement('b');
  number.id = 'hidden';
  number.textContent = String(hiddenCount);
  const [before, after] = t('popup_hidden').split('{count}');
  document.querySelector('#hidden-summary').replaceChildren(before, number, after);
}
document.addEventListener('home-blocker:language-changed', () => {
  if (settings) void render().catch((error) => notice(error.message, true));
});

async function render() {
  settings = await getSettings();
  document.querySelector('#host').textContent = host || t('unsupported_page');
  renderHidden();
  enabled.checked = settings.enabled;
  enabled.disabled = false;
  xvideos.checked = settings.sites.xvideos;
  xvideos.disabled = false;
  vlxx.checked = settings.sites.vlxx;
  vlxx.disabled = false;
  viet69.checked = settings.sites.viet69;
  viet69.disabled = false;
  vnsextop.checked = settings.sites.vnsextop;
  vnsextop.disabled = false;
  toggle.textContent = settings.disabledSites.some((domain) => domainMatches(host, domain))
    ? t('site_enable')
    : t('site_disable');
  toggle.disabled = !host;
  const youtubePanel = document.querySelector('#youtube-panel');
  youtubePanel.hidden = !domainMatches(host, 'youtube.com');
  diagnosticReport = {
    extensionVersion: chrome.runtime.getManifest().version,
    host,
    pageVersion: null,
    youtubeDataRequested: settings.youtubeData,
    youtube: null,
  };
  if (!youtubePanel.hidden) {
    document.querySelector('#youtube-state').textContent = t('youtube_missing');
    document.querySelector('#youtube-counts').textContent = '';
  }
  if (tabId) {
    try {
      const state = await chrome.tabs.sendMessage(
        tabId,
        { type: 'GET_PAGE_STATUS' },
        { frameId: 0 },
      );
      hiddenCount = state.hidden;
      renderHidden();
      diagnosticReport = {
        extensionVersion: chrome.runtime.getManifest().version,
        pageVersion: state.version,
        host,
        youtubeDataRequested: settings.youtubeData,
        youtube: state.youtube,
      };
      const panel = document.querySelector('#youtube-panel');
      panel.hidden = !domainMatches(host, 'youtube.com');
      if (!panel.hidden) {
        const data = state.youtube;
        document.querySelector('#youtube-state').textContent = !data
          ? settings.youtubeData
            ? t('youtube_json_missing')
            : t('youtube_json_off')
          : data.version !== chrome.runtime.getManifest().version
            ? t('youtube_old')
            : data.enabled
              ? t('youtube_on')
              : t('youtube_off');
        document.querySelector('#youtube-counts').textContent = data
          ? t('youtube_counts', {
              initial: data.initialChanged,
              fetchChanged: data.fetchChanged,
              fetchInspected: data.fetchInspected,
              xhrChanged: data.xhrChanged,
              xhrInspected: data.xhrInspected,
            })
          : '';
      }
    } catch {
      hiddenCount = 0;
      renderHidden();
    }
    if (!youtubePanel.hidden) {
      try {
        const result = await chrome.runtime.sendMessage({ type: 'GET_NETWORK_DIAGNOSTICS', tabId });
        if (!result.ok) throw new Error(result.error);
        const siteExcluded = settings.disabledSites.some((domain) => domainMatches(host, domain));
        const networkEnabled =
          settings.enabled && settings.network && settings.sites.youtube && !siteExcluded;
        diagnosticReport.network = {
          enabled: networkEnabled,
          configured: settings.network,
          globalEnabled: settings.enabled,
          siteEnabled: settings.sites.youtube,
          siteExcluded,
          ...result.network,
        };
        recording = result.network.capture.recording;
        document.querySelector('#network-state').textContent = t('network_state', {
          state: t(networkEnabled ? 'network_on' : 'network_off'),
          rules: result.network.blockRuleCount,
          requests: result.network.capture.requests.length,
          recording: recording ? t('network_recording') : '',
        });
        document.querySelector('#capture-network').textContent = recording
          ? t('capture_stop')
          : t('capture_start');
      } catch (error) {
        document.querySelector('#network-state').textContent = error.message;
      }
    }
  }
}

document.querySelector('#capture-network').addEventListener('click', async () => {
  try {
    const result = await chrome.runtime.sendMessage({
      type: recording ? 'STOP_NETWORK_CAPTURE' : 'START_NETWORK_CAPTURE',
      tabId,
      reloadTab: !recording,
    });
    if (!result.ok) throw new Error(result.error);
    await render();
    notice(recording ? 'capture_started' : 'capture_stopped');
  } catch (error) {
    notice(error.message, true);
  }
});
document.querySelector('#clear-network').addEventListener('click', async () => {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'CLEAR_NETWORK_CAPTURE', tabId });
    if (!result.ok) throw new Error(result.error);
    await render();
    notice('capture_cleared');
  } catch (error) {
    notice(error.message, true);
  }
});

for (const [input, site, label] of [
  [xvideos, 'xvideos', 'XVideos'],
  [vlxx, 'vlxx', 'VLXX'],
  [viet69, 'viet69', 'Viet69'],
  [vnsextop, 'vnsextop', 'VNSexTop'],
]) {
  input.addEventListener('change', async () => {
    input.disabled = true;
    try {
      await updateSettings({ sites: { ...settings.sites, [site]: input.checked } });
      await render();
      notice('ads_updated', false, { site: label });
    } catch (error) {
      notice(error.message, true);
      await render();
    }
  });
}

enabled.addEventListener('change', async () => {
  enabled.disabled = true;
  try {
    await updateSettings({ enabled: enabled.checked });
    await render();
    notice('updated');
  } catch (error) {
    notice(error.message, true);
    await render();
  }
});
document.querySelector('#copy-diagnostics').addEventListener('click', async () => {
  try {
    await render();
    await navigator.clipboard.writeText(JSON.stringify(diagnosticReport, null, 2));
    notice('copied');
  } catch (error) {
    notice('error_copy', true, { error: error.message });
  }
});
toggle.addEventListener('click', async () => {
  toggle.disabled = true;
  try {
    const exceptions = settings.disabledSites.filter((domain) => !domainMatches(host, domain));
    if (exceptions.length === settings.disabledSites.length) exceptions.push(host);
    await updateSettings({ disabledSites: exceptions });
    await render();
    notice('site_updated');
  } catch (error) {
    notice(error.message, true);
    await render();
  }
});
document
  .querySelector('#options')
  .addEventListener('click', () => chrome.runtime.openOptionsPage());

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  try {
    const url = new URL(tab?.url);
    if (['http:', 'https:'].includes(url.protocol)) host = url.hostname;
  } catch {
    /* Browser-owned pages cannot be filtered. */
  }
  document.querySelector('#host').textContent = host || t('unsupported_page');
  await render();
})().catch((error) => notice(error.message, true));
