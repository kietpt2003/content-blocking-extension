export const SITE_DOMAINS = {
  youtube: ['youtube.com', 'youtube-nocookie.com'],
  facebook: ['facebook.com'],
  tiktok: ['tiktok.com'],
};

export const DEFAULTS = {
  schemaVersion: 1,
  enabled: true,
  network: true,
  cosmetic: true,
  youtubeData: true,
  sites: { youtube: true, facebook: true, tiktok: true },
  disabledSites: [],
  customDomains: [],
  customCosmetic: [],
};

export const NETWORK_DOMAINS = [
  'youtu.be',
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adnxs.com',
  'adsrvr.org',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
];

export const NETWORK_PATHS = [
  {
    // Found in adBreakServiceRenderer.getAdBreakUrl in the user's player response.
    domains: ['youtube.com'],
    initiatorDomains: ['youtube.com'],
    resourceTypes: ['xmlhttprequest'],
    regex: '^https?://([^/]+\\.)?youtube\\.com/get_midroll_info(?:\\?|$)',
  },
  {
    // Narrow uAssets rule: do not block the shared googlevideo.com media CDN.
    // https://github.com/uBlockOrigin/uAssets/blob/master/filters/filters.txt
    domains: ['googlevideo.com'],
    initiatorDomains: ['youtube.com'],
    resourceTypes: ['xmlhttprequest'],
    regex:
      '^https?://([^/]+\\.)?googlevideo\\.com/initplayback\\?source=youtube&([^&]*&)*c=TVHTML5&([^&]*&)*oad=',
  },
  {
    domains: ['youtube.com'],
    regex: '^https?://([^/]+\\.)?youtube\\.com/(pagead/|api/stats/ads[/?])',
  },
  { domains: ['facebook.com'], regex: '^https?://([^/]+\\.)?facebook\\.com/tr[/?]' },
];

export const GENERIC_SELECTORS = [
  'ins.adsbygoogle',
  '[id^="google_ads_iframe_"]',
  'iframe[src*="doubleclick.net/"]',
  '[data-advertisement="true"]',
];

export const YOUTUBE_SELECTORS = [
  'ytd-ad-slot-renderer',
  'ytm-ad-slot-renderer',
  'ytd-display-ad-renderer',
  'ytd-promoted-video-renderer',
  'ytd-promoted-sparkles-web-renderer',
  'ytd-in-feed-ad-layout-renderer',
  'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)',
  '.ytp-ad-overlay-container',
  '.ytp-ad-player-overlay',
  '.ytp-ad-image-overlay',
  '.ytp-ad-text-overlay',
];
