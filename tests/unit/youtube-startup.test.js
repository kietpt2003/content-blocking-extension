import assert from 'node:assert/strict';
import test from 'node:test';
import { YouTubeStartup } from '../../src/content/youtube-startup.js';

function harness({ playlist = false, url = 'https://www.youtube.com/watch?v=current' } = {}) {
  let now = 0;
  const tasks = new Map();
  const listeners = new Map();
  const signals = new Map();
  const calls = [];
  const response = {
    videoDetails: { videoId: 'current' },
    playabilityStatus: { status: 'OK' },
    streamingData: { serverAbrStreamingUrl: 'https://media.example.test/sabr' },
  };
  let playlistId = playlist ? 'queue' : null;
  const data = { playlistId: 'queue', contents: ['current', 'next'], currentIndex: 0 };
  const manager = {
    getPlaylistData: () => data,
    setPlaylistData: (value) => calls.push(['playlist', value]),
    setPlayerPlaybackControlData: (value) => {
      calls.push(['control', value]);
      playlistId = value.playlistPanelRenderer.playlistId;
    },
  };
  const player = {
    getPlayerResponse: () => response,
    getCurrentTime: () => 0,
    getPlaylistId: () => playlistId,
    loadVideoById: (...args) => {
      calls.push(['reload', ...args]);
      playlistId = null;
    },
    addEventListener: (name, fn) => signals.set(name, fn),
    removeEventListener: (name) => signals.delete(name),
  };
  const video = {
    tagName: 'VIDEO',
    paused: false,
    ended: false,
    readyState: 0,
    isConnected: true,
    ad: false,
    closest(selector) {
      return selector.includes('ad-showing') ? (this.ad ? player : null) : player;
    },
  };
  const document = {
    defaultView: {
      performance: { now: () => now },
      location: { href: url },
      setTimeout: (fn, ms) => {
        const key = {};
        tasks.set(key, { fn, at: now + ms });
        return key;
      },
      clearTimeout: (key) => tasks.delete(key),
    },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    querySelector: (selector) => (selector === 'yt-playlist-manager' ? manager : video),
  };
  const startup = new YouTubeStartup(document, () => calls.push(['recovered']));
  startup.configure(true);
  const emit = (name) => listeners.get(name)?.({ target: video });
  const signal = () => signals.get('onSnackbarMessage')?.(1);
  const tick = (ms) => {
    const end = now + ms;
    while (true) {
      const next = [...tasks]
        .filter(([, task]) => task.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      tasks.delete(next[0]);
      now = next[1].at;
      next[1].fn();
    }
    now = end;
  };
  return {
    setPlaylistId: (value) => {
      playlistId = value;
    },
    startup,
    document,
    response,
    player,
    video,
    manager,
    data,
    calls,
    emit,
    signal,
    tick,
  };
}

test('startup retries once only after the native interruption signal and grace period', () => {
  const h = harness();
  h.emit('waiting');
  h.tick(700);
  assert.deepEqual(h.calls, []); // Slow network alone is not a reason to reload.
  h.signal();
  assert.deepEqual(h.calls, [['reload', 'current', 0], ['recovered']]);
  h.signal();
  h.emit('waiting');
  h.tick(5000);
  assert.equal(h.calls.filter(([name]) => name === 'reload').length, 1);
});

test('fast startup, user pause, disabled policy, ad media, live/error and stale navigation do not reload', () => {
  for (const scenario of [
    'ready',
    'pause',
    'disabled',
    'ad',
    'live',
    'error',
    'wrong-video',
    'navigate',
    'url-changed',
    'no-sabr',
    'detached',
  ]) {
    const h = harness();
    h.emit('waiting');
    h.signal();
    if (scenario === 'ready') {
      h.video.readyState = 1;
      h.emit('loadedmetadata');
    }
    if (scenario === 'pause') {
      h.video.paused = true;
      h.emit('pause');
    }
    if (scenario === 'disabled') h.startup.configure(false);
    if (scenario === 'ad') h.video.ad = true;
    if (scenario === 'live') h.response.videoDetails.isLiveContent = true;
    if (scenario === 'error') h.response.playabilityStatus.status = 'LOGIN_REQUIRED';
    if (scenario === 'wrong-video') h.response.videoDetails.videoId = 'other';
    if (scenario === 'navigate') h.emit('yt-navigate-start');
    if (scenario === 'url-changed')
      h.document.defaultView.location.href = h.document.defaultView.location.href.replace(
        'v=current',
        'v=other',
      );
    if (scenario === 'no-sabr') delete h.response.streamingData.serverAbrStreamingUrl;
    if (scenario === 'detached') h.video.isConnected = false;
    h.tick(5000);
    assert.deepEqual(h.calls, [], scenario);
  }
});

test('recovery preserves requested start position and accepts a new SPA navigation', () => {
  const h = harness({ url: 'https://www.youtube.com/watch?v=current&t=2m3s' });
  h.emit('waiting');
  h.signal();
  h.tick(700);
  assert.deepEqual(h.calls[0], ['reload', 'current', 123]);
  h.emit('yt-navigate-start');
  h.response.playerConfig = { playbackStartConfig: { startSeconds: 65 } };
  h.emit('waiting');
  h.signal();
  h.tick(700);
  assert.deepEqual(h.calls[2], ['reload', 'current', 65]);
});

test('native playlist data is restored after metadata and restoration stops on navigation', () => {
  const h = harness({ playlist: true, url: 'https://www.youtube.com/watch?v=current&list=queue' });
  h.emit('waiting');
  h.signal();
  h.tick(700);
  assert.equal(h.player.getPlaylistId(), null);
  h.tick(250);
  assert.equal(
    h.calls.some(([name]) => name === 'playlist'),
    false,
  );
  h.video.readyState = 1;
  h.emit('loadedmetadata');
  h.tick(250);
  assert.equal(h.player.getPlaylistId(), 'queue');
  assert.deepEqual(h.calls.slice(2), [
    ['playlist', h.data],
    ['control', { playlistPanelRenderer: h.data }],
  ]);
  // A later native /next response can clear the queue again during startup.
  h.setPlaylistId(null);
  h.tick(250);
  assert.equal(h.player.getPlaylistId(), 'queue');
  const next = harness({ playlist: true });
  next.emit('waiting');
  next.signal();
  next.tick(700);
  next.emit('yt-navigate-start');
  next.video.readyState = 1;
  next.tick(5000);
  assert.equal(
    next.calls.some(([name]) => name === 'playlist'),
    false,
  );
});

test('playlist recovery is skipped if native queue restoration is unavailable', () => {
  const h = harness({ playlist: true });
  delete h.manager.setPlayerPlaybackControlData;
  h.emit('waiting');
  h.signal();
  h.tick(5000);
  assert.deepEqual(h.calls, []);
});

test('tracking parameter normalization does not cancel recovery of the same video', () => {
  const h = harness({ url: 'https://www.youtube.com/watch?v=current&autoplay=0&feature=share' });
  h.emit('waiting');
  h.signal();
  h.document.defaultView.location.href = 'https://www.youtube.com/watch?v=current';
  h.tick(700);
  assert.deepEqual(h.calls[0], ['reload', 'current', 0]);
});
