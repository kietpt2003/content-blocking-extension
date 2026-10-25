import { summarizeRequest, captureReport } from './core/network-diagnostics.js';

let capture = null;
let queue = Promise.resolve();
let stopTimer = null;
const KEY = 'youtubeNetworkCapture';
const loaded = chrome.storage.session.get(KEY).then((stored) => {
  capture = stored[KEY] ?? null;
  arm();
});
function serial(operation) {
  const next = queue.then(() => loaded).then(operation);
  queue = next.catch(() => {});
  return next;
}
function detach() {
  clearTimeout(stopTimer);
  chrome.webRequest.onBeforeRequest.removeListener(before);
  chrome.webRequest.onCompleted.removeListener(completed);
  chrome.webRequest.onErrorOccurred.removeListener(failed);
}
function arm() {
  detach();
  if (!capture?.recording || Date.now() >= capture.expiresAt) return;
  const filter = {
    urls: ['http://*/*', 'https://*/*'],
    tabId: capture.tabId,
    types: ['media', 'xmlhttprequest', 'ping', 'other'],
  };
  chrome.webRequest.onBeforeRequest.addListener(before, filter);
  chrome.webRequest.onCompleted.addListener(completed, filter);
  chrome.webRequest.onErrorOccurred.addListener(failed, filter);
  const startedAt = capture.startedAt;
  stopTimer = setTimeout(() => {
    void serial(async () => {
      if (!capture || capture.startedAt !== startedAt || Date.now() < capture.expiresAt) return;
      capture.recording = false;
      detach();
      await persist();
    }).catch(() => {});
  }, capture.expiresAt - Date.now());
}
async function persist() {
  if (capture) await chrome.storage.session.set({ [KEY]: capture });
  else await chrome.storage.session.remove(KEY);
}
function record(details, outcome) {
  if (!capture?.recording || details.tabId !== capture.tabId || Date.now() >= capture.expiresAt)
    return;
  const startedAt = capture.startedAt;
  const request = summarizeRequest(details);
  if (!request) return;
  void serial(async () => {
    if (!capture?.recording || capture.startedAt !== startedAt || details.tabId !== capture.tabId)
      return;
    let item = capture.requests.find((value) => value.requestId === details.requestId);
    if (!item) {
      if (outcome !== 'started') return;
      if (capture.requests.length >= 200) {
        capture.requests.shift();
        capture.droppedRequests = (capture.droppedRequests ?? 0) + 1;
      }
      item = {
        requestId: details.requestId,
        atMs: Math.max(0, Math.round(details.timeStamp - startedAt)),
        ...request,
        adAtObservation: null,
      };
      capture.requests.push(item);
      if (outcome === 'started') {
        try {
          const state = await chrome.tabs.sendMessage(
            details.tabId,
            { type: 'GET_PAGE_STATUS' },
            { frameId: 0 },
          );
          item.adAtObservation =
            typeof state.youtubeAdState?.adShowing === 'boolean'
              ? state.youtubeAdState.adShowing
              : null;
          item.stateObservedAtMs = Date.now() - capture.startedAt;
        } catch {
          /* Content script may be reloading. */
        }
      }
    }
    item.outcome = outcome;
    await persist();
  }).catch(() => {});
}
function before(details) {
  record(details, 'started');
}
function completed(details) {
  record(details, 'completed');
}
function failed(details) {
  record(details, details.error === 'net::ERR_BLOCKED_BY_CLIENT' ? 'blockedByClient' : 'failed');
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    ![
      'START_NETWORK_CAPTURE',
      'STOP_NETWORK_CAPTURE',
      'GET_NETWORK_DIAGNOSTICS',
      'CLEAR_NETWORK_CAPTURE',
    ].includes(message?.type)
  )
    return false;
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(''))) {
    respond({ ok: false, error: 'Chỉ giao diện extension được đọc/ghi chẩn đoán mạng.' });
    return false;
  }
  serial(async () => {
    if (!Number.isInteger(message.tabId)) throw new Error('Tab không hợp lệ.');
    if (message.type === 'START_NETWORK_CAPTURE') {
      const tab = await chrome.tabs.get(message.tabId);
      const url = new URL(tab.url);
      if (
        url.protocol !== 'https:' ||
        !(url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com'))
      )
        throw new Error('Chỉ ghi request trên tab YouTube.');
      const now = Date.now();
      capture = {
        tabId: message.tabId,
        startedAt: now,
        expiresAt: now + 60000,
        recording: true,
        requests: [],
        startedWithReload: message.reloadTab === true,
      };
      arm();
      await persist();
      if (message.reloadTab === true)
        await chrome.tabs.reload(message.tabId, { bypassCache: true });
    } else if (message.type !== 'GET_NETWORK_DIAGNOSTICS' && capture?.tabId === message.tabId) {
      detach();
      if (message.type === 'CLEAR_NETWORK_CAPTURE') capture = null;
      else capture.recording = false;
      await persist();
    }
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    return {
      ok: true,
      network: {
        blockRuleCount: rules.filter((rule) => rule.action.type === 'block').length,
        capture: captureReport(capture?.tabId === message.tabId ? capture : null),
      },
    };
  }).then(respond, (error) => respond({ ok: false, error: error.message }));
  return true;
});
chrome.tabs.onRemoved.addListener((tabId) => {
  void serial(async () => {
    if (capture?.tabId !== tabId) return;
    detach();
    capture = null;
    await persist();
  }).catch(() => {});
});
