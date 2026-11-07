import { installXVideosAdGate } from '../core/xvideos-player.js';

const setEnabled = installXVideosAdGate(window);
document.addEventListener('home-blocker:xvideos-settings', (event) => {
  try {
    const settings = JSON.parse(event.detail);
    if (typeof settings.enabled === 'boolean') setEnabled(settings.enabled);
  } catch {
    // Ignore malformed page events.
  }
});
document.dispatchEvent(new CustomEvent('home-blocker:xvideos-ready'));
