import { candidateSelectors, candidateTarget, candidateContext, reasonFor } from './detectors.js';

export class DomEngine {
  constructor(document, host) {
    this.document = document;
    this.host = host;
    this.hidden = new Map();
    this.roots = new Set();
    this.timer = null;
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Recheck the containing post when metadata changes inside it.
        this.roots.add(
          candidateContext(
            mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement,
            this.host,
          ),
        );
        for (const node of mutation.addedNodes) if (node.nodeType === 1) this.roots.add(node);
      }
      if (this.roots.size > 100) this.roots = new Set([this.document.documentElement]);
      this.schedule();
    });
  }

  configure(settings, active) {
    this.stop();
    this.settings = settings;
    this.active = Boolean(active && this.document.documentElement);
    if (!this.active) return;
    this.observer.observe(this.document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: [
        'aria-label',
        'aria-disabled',
        'data-sponsored',
        'data-ad-label',
        'data-advertisement',
        'data-e2e',
        'class',
        'style',
        'href',
        'disabled',
      ],
    });
    this.roots.add(this.document.documentElement);
    this.scan();
  }

  schedule() {
    if (this.timer === null)
      this.timer = setTimeout(() => {
        this.timer = null;
        this.scan();
      }, 100);
  }

  restore(element, original) {
    if (original.value) element.style.setProperty('display', original.value, original.priority);
    else element.style.removeProperty('display');
    element.removeAttribute('data-content-blocker-hidden');
    this.hidden.delete(element);
  }

  hide(element, reason) {
    if (!this.hidden.has(element)) {
      this.hidden.set(element, {
        value: element.style.getPropertyValue('display'),
        priority: element.style.getPropertyPriority('display'),
        reason,
      });
    }
    if (
      element.style.getPropertyValue('display') !== 'none' ||
      element.style.getPropertyPriority('display') !== 'important'
    ) {
      element.style.setProperty('display', 'none', 'important');
    }
    if (element.getAttribute('data-content-blocker-hidden') !== reason)
      element.setAttribute('data-content-blocker-hidden', reason);
  }

  scan() {
    if (!this.active) return;
    for (const [element, original] of this.hidden) {
      if (!element.isConnected || !reasonFor(element, this.host, this.settings))
        this.restore(element, original);
    }
    const selectors = candidateSelectors(this.host, this.settings);
    const roots = [...this.roots];
    this.roots.clear();
    const candidates = new Set();
    for (const root of roots) {
      if (!root?.isConnected) continue;
      for (const selector of selectors) {
        try {
          if (root.matches(selector)) candidates.add(root);
          root.querySelectorAll(selector).forEach((node) => candidates.add(node));
          const parent = root.closest(selector);
          if (parent) candidates.add(parent);
        } catch {
          /* Invalid custom CSS never stops the other rules. */
        }
      }
    }
    for (const element of candidates) {
      const target = candidateTarget(element, this.host);
      const reason = reasonFor(target, this.host, this.settings);
      if (reason) this.hide(target, reason);
    }
  }

  stop() {
    this.observer.disconnect();
    clearTimeout(this.timer);
    this.timer = null;
    this.roots.clear();
    for (const [element, original] of this.hidden) this.restore(element, original);
    this.active = false;
  }

  status() {
    const reasons = {};
    for (const { reason } of this.hidden.values()) reasons[reason] = (reasons[reason] || 0) + 1;
    return {
      active: this.active,
      hidden: this.hidden.size,
      reasons,
    };
  }
}
