import { parseCosmetic, parseLines, validateSettings } from '../core/settings.js';
import { getSettings, notice, updateSettings } from './shared.js';

const fields = ['enabled', 'network', 'cosmetic', 'youtubeData'];
const sites = ['youtube', 'facebook', 'tiktok', 'xvideos', 'vlxx', 'viet69'];
const byId = (id) => document.getElementById(id);
document.querySelector('.version').textContent = chrome.runtime.getManifest().version;

function populate(settings) {
  fields.forEach((key) => {
    byId(key).checked = settings[key];
  });
  sites.forEach((key) => {
    byId(key).checked = settings.sites[key];
  });
  byId('customDomains').value = settings.customDomains.join('\n');
  byId('disabledSites').value = settings.disabledSites.join('\n');
  byId('customCosmetic').value = settings.customCosmetic
    .map((rule) => `${rule.domain}##${rule.selector}`)
    .join('\n');
}

function validateCSS(settings) {
  for (const { selector } of settings.customCosmetic) {
    try {
      document.querySelector(selector);
    } catch {
      throw new Error(`CSS selector không hợp lệ: ${selector}`);
    }
  }
  return settings;
}

byId('settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  byId('save').disabled = true;
  try {
    const settings = validateCSS(
      validateSettings({
        ...Object.fromEntries(fields.map((key) => [key, byId(key).checked])),
        sites: Object.fromEntries(sites.map((key) => [key, byId(key).checked])),
        customDomains: parseLines(byId('customDomains').value),
        disabledSites: parseLines(byId('disabledSites').value),
        customCosmetic: parseCosmetic(byId('customCosmetic').value),
      }),
    );
    populate(await updateSettings(settings));
    notice('Đã lưu. HTML cập nhật ngay; request đã tải hoặc JSON cũ cần tải lại trang.');
  } catch (error) {
    notice(error.message, true);
  } finally {
    byId('save').disabled = false;
  }
});

byId('export').addEventListener('click', async () => {
  try {
    const blob = new Blob([JSON.stringify(await getSettings(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'home-content-blocker.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice('Đã xuất cấu hình đang lưu.');
  } catch (error) {
    notice(error.message, true);
  }
});
byId('import').addEventListener('click', () => byId('file').click());
byId('file').addEventListener('change', async () => {
  try {
    const file = byId('file').files[0];
    if (!file) return;
    if (file.size > 128 * 1024) throw new Error('File cấu hình tối đa 128 KiB.');
    populate(validateCSS(validateSettings(JSON.parse(await file.text()))));
    notice('Đã đọc file. Bấm Lưu cấu hình để áp dụng.');
  } catch (error) {
    notice(error.message, true);
  } finally {
    byId('file').value = '';
  }
});
byId('reset').addEventListener('click', async () => {
  if (!confirm('Khôi phục bộ lọc mặc định và xóa các quy tắc riêng?')) return;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'RESET_SETTINGS' });
    if (!result.ok) throw new Error(result.error);
    populate(result.settings);
    notice('Đã khôi phục mặc định.');
  } catch (error) {
    notice(error.message, true);
  }
});
getSettings()
  .then((settings) => {
    populate(settings);
    notice('Cấu hình được lưu cục bộ trên Chrome này.');
  })
  .catch((error) => notice(error.message, true));
