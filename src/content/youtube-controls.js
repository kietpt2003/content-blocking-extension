// Known Skip controls are ad-specific; label matching stays inside ad UI.
export const YOUTUBE_SKIP_SELECTOR =
  '.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-container button, .ytp-ad-skip-button-slot button, button[aria-label="Skip ad"], button[aria-label="Skip ads"], button[aria-label="Bỏ qua quảng cáo"]';
const AD_UI =
  '.video-ads, .ytp-ad-module, .ytp-ad-action-interstitial, .ytp-ad-skip-button-slot, .ytp-ad-skip-button-container';
const SKIP_LABEL = /^(?:skip(?:\s+ads?)?|bỏ qua(?:\s+quảng cáo)?)$/iu;

export function youtubeSkipControls(root) {
  const controls = new Set(root.querySelectorAll(YOUTUBE_SKIP_SELECTOR));
  for (const control of root.querySelectorAll('button, [role="button"]')) {
    if (!control.closest(AD_UI)) continue;
    const label = control.getAttribute('aria-label') || control.textContent || '';
    if (SKIP_LABEL.test(label.trim())) controls.add(control);
  }
  return [...controls];
}
