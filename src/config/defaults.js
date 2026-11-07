export const SITE_DOMAINS = {
  youtube: ['youtube.com', 'youtube-nocookie.com'],
  facebook: ['facebook.com'],
  tiktok: ['tiktok.com'],
  xvideos: ['xvideos.com'],
  vlxx: ['vlxx.app', 'vlxx.phd'],
  viet69: ['viet69.be'],
};

export const DEFAULTS = {
  schemaVersion: 1,
  enabled: true,
  network: true,
  cosmetic: true,
  youtubeData: true,
  sites: { youtube: true, facebook: true, tiktok: true, xvideos: true, vlxx: true, viet69: true },
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
    // Live Viet69 .app-ad slot: bn.js creates the __clb-spot iframe and images.
    domains: ['vertigovitalitywieldable.com'],
    initiatorDomains: ['viet69.be'],
    regex: '^https://([^/]+\\.)?vertigovitalitywieldable\\.com/',
  },
  {
    // Observed Viet69 banner and click/popunder scripts. Keep the player API,
    // emb.cd-vs.com iframe and cdn.viedn.net site/player assets available.
    domains: ['cdn2.vietadx.net'],
    initiatorDomains: ['viet69.be'],
    resourceTypes: ['script'],
    regex: '^https://cdn2\\.vietadx\\.net/v/v-(main|top|underplayer)-adx\\.js(?:\\?|$)',
  },
  {
    // embed-vast.js waits for this supplier before it can initialize the player.
    // Supply an empty schedule instead of blocking it and leaving playback stuck.
    domains: ['cdn.adxcontent.com'],
    initiatorDomains: ['vlxx.app', 'vlxx.phd', 'play.vlstream.net'],
    resourceTypes: ['script'],
    regex: '^https://cdn\\.adxcontent\\.com/vlxx/vl-inplayer-adx\\.js(?:\\?|$)',
    action: { type: 'redirect', redirect: { extensionPath: '/vlxx-no-ads.js' } },
  },
  {
    domains: ['cdn.adxcontent.com'],
    initiatorDomains: ['vlxx.app', 'vlxx.phd'],
    resourceTypes: ['script'],
    regex: '^https://cdn\\.adxcontent\\.com/vlxx/vl-(top|underplayer|main)-adx\\.js(?:\\?|$)',
  },
  {
    domains: ['cdn.adxcontent.com'],
    initiatorDomains: ['vlxx.app', 'vlxx.phd', 'play.vlstream.net'],
    resourceTypes: ['xmlhttprequest'],
    regex: '^https://cdn\\.adxcontent\\.com/vlxx/tvc/[a-zA-Z0-9_-]+\\.xml(?:\\?|$)',
  },
  {
    // Observed VAST endpoint on xvideos.com. Leave the content HLS CDN alone.
    domains: ['pemsrv.com'],
    initiatorDomains: ['xvideos.com'],
    resourceTypes: ['xmlhttprequest'],
    regex: '^https?://([^/]+\\.)?pemsrv\\.com/v1/vast\\.php(?:\\?|$)',
  },
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

export const VLXX_SELECTORS = [
  '#vl-top-adx',
  '#vl-header-adx',
  '#vl-underplayer-adx',
  '#vl-native-adx',
  '.banner-preload',
  '.catfish-top',
  '.catfish-bottom',
  '.banner-catfish-top',
  '.banner-catfish-bottom',
];

export const VIET69_SELECTORS = [...VLXX_SELECTORS, '.app-ad'];

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
