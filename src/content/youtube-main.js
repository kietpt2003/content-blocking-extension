import { version } from '../../package.json';
import { YouTubeStartup } from './youtube-startup.js';
import { isYouTubeApi, pruneYouTubeAds, pruneYouTubeAdsInPlace } from '../core/youtube-json.js';

const LIMIT = 2 * 1024 * 1024;
// This script is registered only while JSON filtering is allowed by policy.
// Start before inline player bootstrap instead of waiting for async settings.
let enabled = true;
let generation = 0;
const counters = {
  fetchInspected: 0,
  fetchChanged: 0,
  xhrInspected: 0,
  xhrChanged: 0,
  initialInspected: 0,
  initialChanged: 0,
  removedFields: 0,
  unsupported: 0,
  startupRecoveries: 0,
};
const hooks = { fetch: false, xhr: false, initial: false };
const startup = new YouTubeStartup(document, () => {
  counters.startupRecoveries++;
  publish();
});
startup.configure(enabled);

function publish() {
  document.dispatchEvent(
    new CustomEvent('home-blocker:diagnostics', {
      detail: JSON.stringify({ version, enabled, hooks, ...counters }),
    }),
  );
}

function cleanObject(value, source, inPlace = false) {
  if (!value || typeof value !== 'object') return value;
  counters[`${source}Inspected`]++;
  try {
    const result = inPlace
      ? { removed: pruneYouTubeAdsInPlace(value), value }
      : pruneYouTubeAds(value);
    if (result.removed) {
      counters[`${source}Changed`]++;
      counters.removedFields += result.removed;
      return result.value;
    }
  } catch {
    counters.unsupported++;
  } finally {
    publish();
  }
  return value;
}

function cleanText(text, source) {
  if (typeof text !== 'string' || text.length > LIMIT) return text;
  try {
    const original = JSON.parse(text);
    const cleaned = cleanObject(original, source);
    return cleaned === original ? text : JSON.stringify(cleaned);
  } catch {
    counters.unsupported++;
    publish();
    return text;
  }
}

function cleanInitialData() {
  if (!enabled) return;
  for (const name of ['ytInitialPlayerResponse', 'ytInitialData']) {
    try {
      cleanObject(window[name], 'initial', true);
    } catch {
      /* Site-owned accessor. */
    }
  }
  try {
    const args = window.ytplayer?.config?.args;
    if (args?.raw_player_response) cleanObject(args.raw_player_response, 'initial', true);
    if (typeof args?.player_response === 'string')
      args.player_response = cleanText(args.player_response, 'initial');
  } catch {
    /* Unknown site-owned data shape. */
  }
}

for (const name of ['ytInitialPlayerResponse', 'ytInitialData']) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, name);
    if (
      descriptor &&
      (!descriptor.configurable ||
        descriptor.get ||
        descriptor.set ||
        descriptor.writable === false)
    )
      continue;
    let current = window[name];
    Object.defineProperty(window, name, {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      get() {
        return current;
      },
      set(value) {
        current = value;
        if (enabled) cleanObject(current, 'initial', true);
      },
    });
    hooks.initial = true;
  } catch {
    /* Do not replace protected page properties. */
  }
}

document.addEventListener('home-blocker:settings', (event) => {
  try {
    enabled = JSON.parse(event.detail).youtubeData === true;
  } catch {
    enabled = false;
  }
  generation++;
  startup.configure(enabled);
  cleanInitialData();
  publish();
});
document.addEventListener('home-blocker:diagnostics-request', publish);
for (const event of ['DOMContentLoaded', 'yt-navigate-finish', 'yt-page-data-updated']) {
  document.addEventListener(event, cleanInitialData);
}

async function boundedText(response) {
  if (Number(response.headers.get('content-length')) > LIMIT || !response.body) return null;
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > LIMIT) {
      void reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await Reflect.apply(originalFetch, this, args);
  const input = args[0];
  const url = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
  if (
    !enabled ||
    !isYouTubeApi(url, location.href) ||
    response.status !== 200 ||
    !response.headers.get('content-type')?.includes('json')
  )
    return response;
  try {
    const text = await boundedText(response.clone());
    if (text === null || !enabled) return response;
    const cleaned = cleanText(text, 'fetch');
    if (cleaned === text) return response;
    const headers = new Headers(response.headers);
    for (const key of [
      'content-length',
      'content-encoding',
      'etag',
      'content-md5',
      'digest',
      'content-digest',
    ])
      headers.delete(key);
    headers.set('cache-control', 'no-store');
    const changed = new Response(cleaned, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    for (const key of ['url', 'redirected', 'type'])
      Object.defineProperty(changed, key, { value: response[key] });
    return changed;
  } catch {
    counters.unsupported++;
    publish();
    return response;
  }
};
hooks.fetch = true;

// Native getters let site listeners observe the filtered body regardless of
// event registration order. Non-JSON types keep their native behavior.
const xhrRecords = new WeakMap();
const prototype = XMLHttpRequest.prototype;
const originalOpen = prototype.open;
const textDescriptor = Object.getOwnPropertyDescriptor(prototype, 'responseText');
const responseDescriptor = Object.getOwnPropertyDescriptor(prototype, 'response');

function canFilterXHR(xhr) {
  return (
    enabled &&
    xhr.readyState === 4 &&
    xhr.status === 200 &&
    isYouTubeApi(xhr.responseURL || xhrRecords.get(xhr)?.url, location.href) &&
    xhr.getResponseHeader('content-type')?.includes('json')
  );
}

if (textDescriptor?.configurable && responseDescriptor?.configurable) {
  prototype.open = function (...args) {
    const result = Reflect.apply(originalOpen, this, args);
    xhrRecords.set(this, { url: String(args[1]), generation: -1 });
    return result;
  };
  function transform(xhr, raw) {
    if (!canFilterXHR(xhr)) return raw;
    const record = xhrRecords.get(xhr);
    if (!record) return raw;
    // A completed XHR has one immutable body until open() is called again.
    // Cache one filtered result per open()/policy generation.
    if (record.generation === generation) return record.cleaned;
    record.generation = generation;
    record.cleaned = typeof raw === 'string' ? cleanText(raw, 'xhr') : cleanObject(raw, 'xhr');
    return record.cleaned;
  }
  Object.defineProperty(prototype, 'responseText', {
    ...textDescriptor,
    get() {
      return transform(this, textDescriptor.get.call(this));
    },
  });
  Object.defineProperty(prototype, 'response', {
    ...responseDescriptor,
    get() {
      const raw = responseDescriptor.get.call(this);
      return ['', 'text', 'json'].includes(this.responseType) ? transform(this, raw) : raw;
    },
  });
  hooks.xhr = true;
}
publish();
document.dispatchEvent(new CustomEvent('home-blocker:ready'));
