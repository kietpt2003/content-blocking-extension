// Only inspect YouTube UI surfaces, never titles, comments or page-wide text.
const SURFACES = [
  'ytd-enforcement-message-view-model',
  'yt-enforcement-message-view-model',
  'ytd-enforcement-message-renderer',
  'yt-confirm-dialog-renderer',
  'ytd-confirm-dialog-renderer',
  'tp-yt-paper-dialog',
  'dialog',
  '[role="dialog"]',
  'ytd-toast',
  'tp-yt-paper-toast',
  // Current desktop YouTube snackbar, observed in the signed-in Chrome profile.
  '.ytSnackbarContainerSnackbarContainer',
  'snackbar-view-model',
  'yt-notification-action-renderer',
  'ytd-notification-action-renderer',
  '.ytp-toast',
  '.ytp-suggested-action',
  '.ytp-popup',
  '.ytp-error',
  '.ytp-pause-overlay',
].join(',');
const DIALOGS = 'tp-yt-paper-dialog, dialog, [role="dialog"]';
const ENFORCEMENT =
  'ytd-enforcement-message-view-model, yt-enforcement-message-view-model, ytd-enforcement-message-renderer';
const IDLE =
  /(?:video paused[.!?]?\s*continue watching|continue watching\?|video (?:đã )?tạm dừng[.!?]?\s*(?:bạn có muốn )?tiếp tục xem|tiếp tục xem\?)/iu;
const INTERRUPTIONS =
  /(?:experiencing interruptions?\??|bạn (?:đang )?gặp (?:phải )?(?:sự cố )?gián đoạn)/iu;
const AD_BLOCKER =
  /(?:ad\s*blockers? (?:are not allowed|violate)|(?:you(?:'|’)?re|you are) using an ad\s*blocker|trình chặn quảng cáo.{0,100}(?:không được phép|vi phạm)|(?:không được phép|vi phạm).{0,100}trình chặn quảng cáo)/iu;
const CONFIRM =
  '#confirm-button button, button#confirm-button, #confirm-button[role="button"], #confirm-button [role="button"]';
const DISMISS =
  '#dismiss-button button, button#dismiss-button, #close-button button, button#close-button, button[aria-label="Close"], button[aria-label="Đóng"], [role="button"][aria-label="Close"], [role="button"][aria-label="Đóng"]';

export function youtubePromptKind(element) {
  if (element.matches(ENFORCEMENT)) return 'ad-blocker';
  const text = (element.textContent || '').replace(/\s+/gu, ' ').trim();
  if (IDLE.test(text)) return 'idle';
  if (AD_BLOCKER.test(text)) return 'ad-blocker';
  if (INTERRUPTIONS.test(text)) return 'interruptions';
  return null;
}

export class YouTubePrompts {
  constructor(document) {
    this.document = document;
    this.hidden = new Map();
    this.scroll = new Map();
    this.attempts = new WeakMap();
    this.resumed = new WeakSet();
    this.queued = false;
    this.observer = new MutationObserver(() => this.schedule());
  }

  configure(active) {
    this.stop();
    if (!active || !this.document.documentElement) return;
    this.active = true;
    this.observer.observe(this.document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open', 'opened', 'aria-hidden', 'disabled'],
    });
    // Retry late event listeners and prompts reused without a DOM mutation.
    this.timer = setInterval(() => this.scan(), 1000);
    this.scan();
  }

  schedule() {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (this.active) this.scan();
    });
  }

  visible(element) {
    for (let node = element; node?.nodeType === 1; node = node.parentElement) {
      if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
      const style = this.document.defaultView.getComputedStyle(node);
      if ((style.display === 'none' && !this.hidden.has(node)) || style.visibility === 'hidden')
        return false;
    }
    return true;
  }

  hide(element, reason, source = element) {
    if (!this.hidden.has(element))
      this.hidden.set(element, {
        value: element.style.getPropertyValue('display'),
        priority: element.style.getPropertyPriority('display'),
        reason,
        source,
      });
    if (
      element.style.getPropertyValue('display') !== 'none' ||
      element.style.getPropertyPriority('display') !== 'important'
    )
      element.style.setProperty('display', 'none', 'important');
  }

  restore(element, original) {
    if (original.value) element.style.setProperty('display', original.value, original.priority);
    else element.style.removeProperty('display');
    this.hidden.delete(element);
    this.resumed.delete(element);
    this.attempts.delete(element);
  }

  click(surface, selector, label) {
    const buttons = [...surface.querySelectorAll(selector)];
    if (label)
      buttons.push(
        ...[...surface.querySelectorAll('button, [role="button"]')].filter((button) =>
          label.test((button.getAttribute('aria-label') || button.textContent || '').trim()),
        ),
      );
    const button = buttons.find(
      (node) =>
        !node.disabled && node.getAttribute('aria-disabled') !== 'true' && this.visible(node),
    );
    if (!button || Date.now() - (this.attempts.get(surface) || 0) < 1000) return false;
    this.attempts.set(surface, Date.now());
    button.click();
    return true;
  }

  scan() {
    if (!this.active) return;
    for (const [element, original] of this.hidden) {
      if (
        original.reason !== 'backdrop' &&
        (!element.isConnected ||
          !original.source.isConnected ||
          youtubePromptKind(original.source) !== original.reason ||
          !this.visible(original.source))
      )
        this.restore(element, original);
    }
    const dialogs = new Set();
    const processed = new Set();
    for (const surface of this.document.querySelectorAll(SURFACES)) {
      const kind = youtubePromptKind(surface);
      if (!kind || !this.visible(surface)) continue;
      const dialog = surface.closest(DIALOGS);
      const target = dialog || surface;
      if (dialog) dialogs.add(dialog);
      if (processed.has(target)) continue;
      processed.add(target);
      if (kind === 'idle') {
        // Confirm YouTube's own idle flow. Never resume an ordinary user pause.
        const video = this.document.querySelector('#movie_player video, .html5-video-player video');
        const paused = video?.paused;
        if (this.click(surface, CONFIRM, /^(?:yes|continue watching|có|tiếp tục xem)$/iu)) {
          if (
            paused &&
            !this.resumed.has(target) &&
            !video.ended &&
            !video.closest('.ad-showing, .ad-interrupting')
          ) {
            this.resumed.add(target);
            void video.play().catch(() => {});
          }
        }
      } else if (kind === 'ad-blocker') {
        // Only dismiss/close; never choose Allow ads, sign-in or Premium actions.
        this.click(surface, DISMISS, /^(?:close|dismiss|đóng)$/iu);
      }
      // Keep the node alive: YouTube can still finish its dialog lifecycle.
      this.hide(target, kind, surface);
    }
    const otherDialog = [...this.document.querySelectorAll(DIALOGS)].some(
      (dialog) => !dialogs.has(dialog) && this.visible(dialog),
    );
    const blockedDialog = [...dialogs].some((dialog) => this.visible(dialog));
    this.updateScroll(blockedDialog && !otherDialog);
    for (const backdrop of this.document.querySelectorAll('tp-yt-iron-overlay-backdrop')) {
      if (blockedDialog && !otherDialog) this.hide(backdrop, 'backdrop');
      else if (this.hidden.has(backdrop)) this.restore(backdrop, this.hidden.get(backdrop));
    }
  }

  updateScroll(unlock) {
    if (!unlock) {
      for (const [element, properties] of this.scroll) {
        for (const [property, original] of properties) {
          if (original.value)
            element.style.setProperty(property, original.value, original.priority);
          else element.style.removeProperty(property);
        }
      }
      this.scroll.clear();
      return;
    }
    for (const element of [this.document.documentElement, this.document.body]) {
      if (!element) continue;
      const style = this.document.defaultView.getComputedStyle(element);
      if (![style.overflowX, style.overflowY].includes('hidden')) continue;
      if (!this.scroll.has(element))
        this.scroll.set(
          element,
          ['overflow-x', 'overflow-y'].map((property) => [
            property,
            {
              value: element.style.getPropertyValue(property),
              priority: element.style.getPropertyPriority(property),
            },
          ]),
        );
      element.style.setProperty('overflow', 'auto', 'important');
    }
  }

  stop() {
    this.active = false;
    this.observer.disconnect();
    clearInterval(this.timer);
    this.updateScroll(false);
    for (const [element, original] of this.hidden) this.restore(element, original);
    this.attempts = new WeakMap();
  }
}
