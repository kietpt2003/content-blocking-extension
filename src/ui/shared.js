export async function getSettings() {
  const result = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  if (!result?.ok) throw new Error(result?.error || 'Không đọc được cấu hình.');
  return result.settings;
}

export async function updateSettings(patch) {
  const result = await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', patch });
  if (!result?.ok) throw new Error(result?.error || 'Không lưu được cấu hình.');
  return result.settings;
}

export function notice(message, error = false) {
  const status = document.querySelector('#status');
  status.textContent = message;
  status.dataset.error = String(error);
}
