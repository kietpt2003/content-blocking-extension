import {
  GENERIC_SELECTORS,
  YOUTUBE_SELECTORS,
  VLXX_SELECTORS,
  VIET69_SELECTORS,
  VNSEXTOP_SELECTORS,
} from '../config/defaults.js';
import { domainMatches, siteForHost } from '../core/settings.js';
import { youtubeSkipControls } from './youtube-controls.js';
import {
  FACEBOOK_SIDEBAR_ROOT,
  FACEBOOK_SIDEBAR_HEADINGS,
  facebookSidebarAdContainer,
  isFacebookSidebarAd,
} from './facebook-sidebar.js';

function safeMatch(element, selector) {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function markerIn(element, selector) {
  return safeMatch(element, selector) || Boolean(element.querySelector(selector));
}

function ownedFacebookMarker(container, marker) {
  const article = marker.closest('[role="article"]');
  if (container.matches('[role="article"]')) return article === container;
  if (article?.parentElement?.closest('[role="article"]')) return false;
  return marker.closest('[data-pagelet^="FeedUnit_"]') === container;
}

export function reasonFor(element, host, settings) {
  if (GENERIC_SELECTORS.some((selector) => safeMatch(element, selector))) return 'generic';
  for (const rule of settings.customCosmetic) {
    if (domainMatches(host, rule.domain) && safeMatch(element, rule.selector)) return 'custom';
  }
  const site = siteForHost(host);
  if (site === 'vlxx' && VLXX_SELECTORS.some((selector) => safeMatch(element, selector)))
    return site;
  if (site === 'viet69' && VIET69_SELECTORS.some((selector) => safeMatch(element, selector)))
    return site;
  if (site === 'vnsextop' && VNSEXTOP_SELECTORS.some((selector) => safeMatch(element, selector)))
    return site;
  if (site === 'facebook' && isFacebookSidebarAd(element)) return 'facebook';
  if (site === 'youtube' && YOUTUBE_SELECTORS.some((selector) => safeMatch(element, selector))) {
    // YouTube can put Skip inside the overlay. Hiding that ancestor also makes
    // the button unreachable to the user.
    return youtubeSkipControls(element).length ? null : 'youtube';
  }
  if (site === 'facebook' && safeMatch(element, '[role="article"], [data-pagelet^="FeedUnit_"]')) {
    if (element.parentElement?.closest('[role="article"]')) return null;
    // Scope detection to ad metadata/links. Never match arbitrary post text.
    const marker =
      '[data-sponsored="true"], [data-ad-label], a[href*="/ads/about/"], a[href*="/ads/ad_preferences/"]';
    const markers = [...element.querySelectorAll(marker)];
    if (safeMatch(element, marker)) markers.push(element);
    if (markers.some((node) => ownedFacebookMarker(element, node))) return 'facebook';
    const labels = element.querySelectorAll('a[aria-label], span[aria-label]');
    if (
      [...labels].some(
        (node) =>
          ownedFacebookMarker(element, node) &&
          /^(sponsored|được tài trợ|tài trợ|quảng cáo)$/iu.test(
            (node.getAttribute('aria-label') || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim(),
          ),
      )
    )
      return 'facebook';
  }
  if (
    site === 'tiktok' &&
    safeMatch(
      element,
      '[data-e2e="recommend-list-item-container"], [data-e2e="recommend-list-item"], [data-e2e="search_top-item"]',
    )
  ) {
    if (
      markerIn(
        element,
        '[data-e2e="ad-label"], [data-e2e="video-sponsored"], [data-e2e="sponsored-tag"], [data-sponsored="true"]',
      )
    )
      return 'tiktok';
  }
  return null;
}

export function candidateSelectors(host, settings) {
  const selectors = [...GENERIC_SELECTORS];
  for (const rule of settings.customCosmetic) {
    if (domainMatches(host, rule.domain)) selectors.push(rule.selector);
  }
  const site = siteForHost(host);
  if (site === 'youtube') selectors.push(...YOUTUBE_SELECTORS);
  if (site === 'vlxx') selectors.push(...VLXX_SELECTORS);
  if (site === 'viet69') selectors.push(...VIET69_SELECTORS);
  if (site === 'vnsextop') selectors.push(...VNSEXTOP_SELECTORS);
  if (site === 'facebook')
    selectors.push('[role="article"]', '[data-pagelet^="FeedUnit_"]', FACEBOOK_SIDEBAR_HEADINGS);
  if (site === 'tiktok')
    selectors.push(
      '[data-e2e="recommend-list-item-container"]',
      '[data-e2e="recommend-list-item"]',
      '[data-e2e="search_top-item"]',
    );
  return selectors;
}

export function candidateTarget(element, host) {
  if (siteForHost(host) === 'facebook' && element.matches(FACEBOOK_SIDEBAR_HEADINGS))
    return facebookSidebarAdContainer(element) ?? element;
  return element;
}

export function candidateContext(element, host) {
  // Lazy image links can appear next to the heading, outside its subtree.
  if (siteForHost(host) === 'facebook') return element?.closest(FACEBOOK_SIDEBAR_ROOT) ?? element;
  return element;
}
