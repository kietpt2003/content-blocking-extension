const AD_KEYS = new Set(['adPlacements', 'playerAds', 'adSlots']);
const AD_RENDERERS = new Set([
  'adSlotRenderer',
  'displayAdRenderer',
  'promotedSparklesWebRenderer',
  'inFeedAdLayoutRenderer',
]);

export function pruneYouTubeAds(value) {
  let removed = 0;
  let visited = 0;
  function visit(node, depth = 0) {
    if (++visited > 50000 || depth > 100) throw new Error('JSON quá lớn để lọc.');
    if (Array.isArray(node)) {
      return node
        .filter((item) => {
          const ad =
            item &&
            typeof item === 'object' &&
            Object.keys(item).some((key) => AD_RENDERERS.has(key));
          if (ad) removed += 1;
          return !ad;
        })
        .map((item) => visit(item, depth + 1));
    }
    if (node && typeof node === 'object') {
      const result = Object.create(null);
      for (const [key, item] of Object.entries(node)) {
        if (AD_KEYS.has(key)) removed += 1;
        else result[key] = visit(item, depth + 1);
      }
      return result;
    }
    return node;
  }
  return {
    value: visit(value),
    get removed() {
      return removed;
    },
  };
}

// Plan first so a traversal error cannot leave partially modified player data.
export function pruneYouTubeAdsInPlace(value) {
  const operations = [];
  const seen = new WeakSet();
  let visited = 0;
  function visit(node, depth = 0) {
    if (++visited > 50000 || depth > 100) throw new Error('JSON quá lớn để lọc.');
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        if (
          item &&
          typeof item === 'object' &&
          Object.keys(item).some((key) => AD_RENDERERS.has(key))
        ) {
          if (Object.isSealed(node) || Object.isFrozen(node)) throw new Error('Readonly array.');
          operations.push(() => node.splice(index, 1));
        } else visit(item, depth + 1);
      });
    } else {
      for (const [key, item] of Object.entries(node)) {
        if (AD_KEYS.has(key)) {
          if (!Object.getOwnPropertyDescriptor(node, key)?.configurable)
            throw new Error('Readonly field.');
          operations.push(() => {
            delete node[key];
          });
        } else visit(item, depth + 1);
      }
    }
  }
  visit(value);
  for (const operation of operations.reverse()) operation();
  return operations.length;
}

export function isYouTubeApi(value, base) {
  try {
    const url = new URL(value, base);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) &&
      /^\/youtubei\/v1\/(player|next|browse|get_watch)(?:\/|$)/.test(url.pathname)
    );
  } catch {
    return false;
  }
}
