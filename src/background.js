import { DEFAULTS } from './config/defaults.js';
import { validateSettings } from './core/settings.js';
import { compileNetworkRules } from './core/network.js';
import './network-capture.js';
import { applyYouTubePageScript, applyXVideosPageScript } from './core/page-scripts.js';

let queue = Promise.resolve();
function serial(operation) {
  const next = queue.then(operation);
  queue = next.catch(() => {});
  return next;
}

async function readSettings() {
  const stored = await chrome.storage.local.get('settings');
  return validateSettings(stored.settings ?? DEFAULTS);
}

async function applyRules(settings) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: compileNetworkRules(settings),
  });
}

async function applyPolicy(settings) {
  await applyRules(settings);
  await applyYouTubePageScript(settings, chrome.scripting);
  await applyXVideosPageScript(settings, chrome.scripting);
}

async function saveSettings(patch) {
  const previous = await readSettings();
  const settings = validateSettings({ ...previous, ...patch });
  try {
    await applyPolicy(settings);
    await chrome.storage.local.set({ settings });
  } catch (error) {
    await applyPolicy(previous);
    throw error;
  }
  return settings;
}

const ready = serial(async () => {
  const settings = await readSettings();
  await applyPolicy(settings);
  await chrome.storage.local.set({ settings });
  await chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: true,
  });
  return settings;
});
ready.catch((error) => console.error('Không thể khởi tạo bộ lọc:', error.message));

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  const trustedUI = sender.url?.startsWith(chrome.runtime.getURL(''));
  if (!message || !['GET_SETTINGS', 'UPDATE_SETTINGS', 'RESET_SETTINGS'].includes(message.type))
    return false;
  (async () => {
    await ready;
    if (message.type === 'GET_SETTINGS') return readSettings();
    if (!trustedUI) throw new Error('Chỉ trang cài đặt extension được thay đổi bộ lọc.');
    return serial(() =>
      saveSettings(message.type === 'RESET_SETTINGS' ? structuredClone(DEFAULTS) : message.patch),
    );
  })().then(
    (settings) => respond({ ok: true, settings }),
    (error) => respond({ ok: false, error: error.message }),
  );
  return true;
});

chrome.runtime.onInstalled.addListener(() => ready.catch(() => {}));
chrome.runtime.onStartup.addListener(() => ready.catch(() => {}));
