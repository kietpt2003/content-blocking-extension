import { YouTubeIdle } from './youtube-idle.js';

const idle = new YouTubeIdle(document);
// Remain inactive until the isolated content script has loaded the real policy.
document.addEventListener('leaf-content-guard:idle-settings', (event) => {
  try {
    idle.configure(JSON.parse(event.detail).enabled === true);
  } catch {
    // Ignore malformed page events.
  }
});
document.dispatchEvent(new CustomEvent('leaf-content-guard:idle-ready'));
