import { installPlayerAdGate } from '../core/player-gate.js';

// Registered only on domains explicitly configured by the user.
// Supports HTML5Player._checkVideoAdsCommon; other player APIs are untouched.
const setEnabled = installPlayerAdGate(window);
document.addEventListener('leaf-content-guard:player-settings', (event) => {
  try {
    const settings = JSON.parse(event.detail);
    if (typeof settings.enabled === 'boolean') setEnabled(settings.enabled);
  } catch {
    // Ignore malformed page events.
  }
});
document.dispatchEvent(new CustomEvent('leaf-content-guard:player-ready'));
