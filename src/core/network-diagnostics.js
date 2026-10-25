const CLIENTS = new Set([
  'WEB',
  'MWEB',
  'WEB_REMIX',
  'WEB_EMBEDDED_PLAYER',
  'TVHTML5',
  'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
  'ANDROID',
  'IOS',
]);
const PATHS = [
  '/videoplayback',
  '/initplayback',
  '/youtubei/v1/player',
  '/youtubei/v1/next',
  '/youtubei/v1/get_watch',
  '/youtubei/v1/browse',
  '/pagead/',
  '/api/stats/ads',
  '/api/stats/watchtime',
  '/api/stats/playback',
  '/api/stats/qoe',
  '/ptracking',
  '/youtubei/v1/log_event',
  '/youtubei/v1/get_midroll_info',
];

// Never retain full URLs, video IDs, signatures, headers or response bodies.
export function summarizeRequest(details) {
  try {
    const url = new URL(details.url);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (/\.(?:woff2?|ttf|otf)$/i.test(url.pathname)) return null;
    const path =
      PATHS.find((value) =>
        value.endsWith('/') ? url.pathname.startsWith(value) : url.pathname === value,
      ) ?? '[other]';
    const params = {};
    if (url.searchParams.has('c'))
      params.client = CLIENTS.has(url.searchParams.get('c'))
        ? url.searchParams.get('c')
        : '[other]';
    if (url.searchParams.has('source'))
      params.source = ['youtube', 'yt_ads'].includes(url.searchParams.get('source'))
        ? url.searchParams.get('source')
        : '[other]';
    for (const name of ['oad', 'adformat'])
      if (url.searchParams.has(name)) params[name] = 'present';
    if (url.searchParams.has('ctier'))
      params.tier = ['A', 'L', 'H'].includes(url.searchParams.get('ctier'))
        ? url.searchParams.get('ctier')
        : '[other]';
    return { host: url.hostname, path, type: details.type, parameters: params };
  } catch {
    return null;
  }
}

export function captureReport(capture, now = Date.now()) {
  if (!capture) return { recording: false, requests: [] };
  return {
    recording: capture.recording && now < capture.expiresAt,
    remainingSeconds: Math.max(0, Math.ceil((capture.expiresAt - now) / 1000)),
    limit: 200,
    startedWithReload: capture.startedWithReload === true,
    droppedRequests: capture.droppedRequests ?? 0,
    requests: capture.requests.map(({ requestId, ...request }) => request),
  };
}
