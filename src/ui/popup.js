import { domainMatches } from '../core/settings.js';
import { getSettings, notice, updateSettings } from './shared.js';

let settings;
let host = '';
let tabId;
let diagnosticReport = null;
let recording = false;
const enabled = document.querySelector('#enabled');
const xvideos = document.querySelector('#xvideos');
const vlxx = document.querySelector('#vlxx');
const viet69 = document.querySelector('#viet69');
const toggle = document.querySelector('#site-toggle');
document.querySelector('#version').textContent = chrome.runtime.getManifest().version;

async function render() {
  settings = await getSettings();
  enabled.checked = settings.enabled;
  enabled.disabled = false;
  xvideos.checked = settings.sites.xvideos;
  xvideos.disabled = false;
  vlxx.checked = settings.sites.vlxx;
  vlxx.disabled = false;
  viet69.checked = settings.sites.viet69;
  viet69.disabled = false;
  toggle.textContent = settings.disabledSites.some((domain) => domainMatches(host, domain))
    ? 'Bật lại trên website này'
    : 'Tạm tắt trên website này';
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
    document.querySelector('#youtube-state').textContent =
      'Chưa nhận được bộ lọc. Đóng tab rồi mở lại video sau khi Reload extension.';
    document.querySelector('#youtube-counts').textContent = '';
  }
  if (tabId) {
    try {
      const state = await chrome.tabs.sendMessage(
        tabId,
        { type: 'GET_PAGE_STATUS' },
        { frameId: 0 },
      );
      document.querySelector('#hidden').textContent = state.hidden;
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
            ? 'JSON chưa chạy trên tab này. Kiểm tra công tắc/ngoại lệ và tải lại tab sau khi bật.'
            : 'Lọc JSON đang tắt. Chặn mạng hoạt động theo cấu hình riêng.'
          : data.version !== chrome.runtime.getManifest().version
            ? 'Tab đang chạy script cũ. Hãy đóng tab và mở lại video.'
            : data.enabled
              ? 'Lọc dữ liệu đang bật.'
              : 'Lọc dữ liệu đang tắt hoặc website được bỏ qua.';
        document.querySelector('#youtube-counts').textContent = data
          ? `Sửa dữ liệu ban đầu: ${data.initialChanged}; fetch: ${data.fetchChanged}/${data.fetchInspected}; XHR: ${data.xhrChanged}/${data.xhrInspected}.`
          : '';
      }
    } catch {
      document.querySelector('#hidden').textContent = '0';
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
        document.querySelector('#network-state').textContent =
          `Chặn mạng: ${networkEnabled ? 'bật' : 'tắt'}; rule chặn: ${result.network.blockRuleCount}; đã ghi: ${result.network.capture.requests.length} request${recording ? ' (đang ghi)' : ''}.`;
        document.querySelector('#capture-network').textContent = recording
          ? 'Dừng ghi request'
          : 'Ghi 60 giây và tải lại tab';
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
    notice(
      recording
        ? 'Đã bật ghi trước khi tải lại tab. Khi quảng cáo xuất hiện, dừng ghi rồi sao chép chẩn đoán.'
        : 'Đã dừng ghi request.',
    );
  } catch (error) {
    notice(error.message, true);
  }
});
document.querySelector('#clear-network').addEventListener('click', async () => {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'CLEAR_NETWORK_CAPTURE', tabId });
    if (!result.ok) throw new Error(result.error);
    await render();
    notice('Đã xóa bản ghi request.');
  } catch (error) {
    notice(error.message, true);
  }
});

for (const [input, site, label] of [
  [xvideos, 'xvideos', 'XVideos'],
  [vlxx, 'vlxx', 'VLXX'],
  [viet69, 'viet69', 'Viet69'],
]) {
  input.addEventListener('change', async () => {
    input.disabled = true;
    try {
      await updateSettings({ sites: { ...settings.sites, [site]: input.checked } });
      await render();
      notice(`Đã cập nhật chặn QC ${label}. Tải lại clip để áp dụng đầy đủ.`);
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
    notice('Đã cập nhật.');
  } catch (error) {
    notice(error.message, true);
    await render();
  }
});
document.querySelector('#copy-diagnostics').addEventListener('click', async () => {
  try {
    await render();
    await navigator.clipboard.writeText(JSON.stringify(diagnosticReport, null, 2));
    notice('Đã sao chép; không có cookie, token, URL phát video hoặc nội dung trang.');
  } catch (error) {
    notice(`Không sao chép được: ${error.message}`, true);
  }
});
toggle.addEventListener('click', async () => {
  toggle.disabled = true;
  try {
    const exceptions = settings.disabledSites.filter((domain) => !domainMatches(host, domain));
    if (exceptions.length === settings.disabledSites.length) exceptions.push(host);
    await updateSettings({ disabledSites: exceptions });
    await render();
    notice('Đã cập nhật. Tải lại trang nếu nội dung cũ chưa trở lại.');
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
  document.querySelector('#host').textContent = host || 'Trang này không hỗ trợ lọc';
  await render();
})().catch((error) => notice(error.message, true));
