const STARTUP_GRACE_MS = 700;

function requestedStart(url, response, player) {
  const current = player.getCurrentTime?.();
  if (Number.isFinite(current) && current > 0) return current;
  const configured = response.playerConfig?.playbackStartConfig?.startSeconds;
  if (Number.isFinite(configured) && configured >= 0) return configured;
  const value = url.searchParams.get('start') || url.searchParams.get('t') || '';
  if (/^\d+(?:\.\d+)?$/u.test(value)) return Number(value);
  const parts = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/u.exec(value);
  return parts
    ? Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60 + Number(parts[3] || 0)
    : 0;
}

// Recover only the initial, empty SABR stream after YouTube itself reports an
// interruption. Use the native player/API and the existing JSON filter.
export class YouTubeStartup {
  constructor(document, onRecovery = () => {}) {
    this.document = document;
    this.view = document.defaultView;
    this.onRecovery = onRecovery;
    this.active = false;
    this.onWaiting = (event) => this.wait(event.target);
    this.onReady = (event) => {
      if (event.target === this.waiting?.video) {
        this.completed = true;
        this.clearWait();
      }
    };
    this.onNavigate = () => this.reset();
    this.onSignal = (message) => {
      if (message !== 1 || !this.waiting) return;
      this.interrupted = true;
      if (this.view.performance.now() - this.waiting.since >= STARTUP_GRACE_MS) this.recover();
    };
  }

  configure(active) {
    if (Boolean(active) === this.active) return;
    this.active = Boolean(active);
    this.reset();
    const method = this.active ? 'addEventListener' : 'removeEventListener';
    this.document[method]('waiting', this.onWaiting, true);
    for (const event of ['loadedmetadata', 'playing', 'pause', 'ended'])
      this.document[method](event, this.onReady, true);
    this.document[method]('yt-navigate-start', this.onNavigate);
  }

  clearWait() {
    this.view.clearTimeout(this.timer);
    this.timer = null;
    this.waiting = null;
  }

  reset() {
    this.clearWait();
    this.view.clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    this.player?.removeEventListener('onSnackbarMessage', this.onSignal);
    this.player = null;
    this.attempted = false;
    this.completed = false;
    this.interrupted = false;
  }

  wait(video) {
    if (
      !this.active ||
      this.attempted ||
      this.completed ||
      video?.tagName !== 'VIDEO' ||
      video.paused ||
      video.readyState !== 0 ||
      video.closest('.ad-showing, .ad-interrupting')
    )
      return;
    const player = video.closest('#movie_player, .html5-video-player');
    if (
      typeof player?.getPlayerResponse !== 'function' ||
      typeof player.loadVideoById !== 'function'
    )
      return;
    if (this.waiting?.video === video) return;
    this.clearWait();
    if (this.player !== player) {
      this.player?.removeEventListener('onSnackbarMessage', this.onSignal);
      this.player = player;
      player.addEventListener('onSnackbarMessage', this.onSignal);
    }
    this.waiting = { video, since: this.view.performance.now(), url: this.view.location.href };
    this.timer = this.view.setTimeout(() => this.recover(), STARTUP_GRACE_MS);
  }

  recover() {
    this.view.clearTimeout(this.timer);
    this.timer = null;
    const waiting = this.waiting;
    if (!this.active || !waiting || !this.interrupted || this.attempted || this.completed) return;
    const { video, url: originalUrl } = waiting;
    if (
      !video.isConnected ||
      video.paused ||
      video.ended ||
      video.readyState !== 0 ||
      video.closest('.ad-showing, .ad-interrupting')
    )
      return;
    try {
      const url = new URL(originalUrl);
      const videoId = url.pathname === '/watch' ? url.searchParams.get('v') : null;
      const currentUrl = new URL(this.view.location.href);
      // YouTube removes tracking/autoplay parameters during bootstrap. Compare
      // playback identity instead of treating that normalization as navigation.
      if (
        currentUrl.pathname !== url.pathname ||
        currentUrl.searchParams.get('v') !== videoId ||
        currentUrl.searchParams.get('list') !== url.searchParams.get('list')
      )
        return;
      const response = this.player.getPlayerResponse();
      if (
        !videoId ||
        response?.videoDetails?.videoId !== videoId ||
        response.playabilityStatus?.status !== 'OK' ||
        response.videoDetails.isLive ||
        response.videoDetails.isLiveContent ||
        !response.streamingData?.serverAbrStreamingUrl
      )
        return;
      const playlistId = this.player.getPlaylistId?.() || url.searchParams.get('list');
      const manager = playlistId ? this.document.querySelector('yt-playlist-manager') : null;
      const playlist = manager?.getPlaylistData?.();
      // A native single-video reload clears its queue. Do not recover a playlist
      // unless YouTube provides the data and both setters needed to restore it.
      if (
        playlistId &&
        (playlist?.playlistId !== playlistId ||
          typeof manager?.setPlaylistData !== 'function' ||
          typeof manager?.setPlayerPlaybackControlData !== 'function')
      )
        return;
      const start = requestedStart(url, response, this.player);
      this.attempted = true;
      this.player.loadVideoById(videoId, start);
      this.onRecovery();
      if (playlist) this.restorePlaylist(manager, playlist, videoId, 0);
    } catch {
      // Unknown native player shapes keep the normal YouTube loading path.
    }
  }

  restorePlaylist(manager, playlist, videoId, attempt) {
    if (!this.active || attempt >= 20) return;
    this.restoreTimer = this.view.setTimeout(() => {
      try {
        if (this.player?.getPlayerResponse?.()?.videoDetails?.videoId !== videoId) return;
        const video = this.document.querySelector('#movie_player video');
        if (video?.readyState > 0 && !this.player.getPlaylistId?.()) {
          manager.setPlaylistData(playlist);
          manager.setPlayerPlaybackControlData({ playlistPanelRenderer: playlist });
        }
        // The asynchronous /next response can clear a queue that was already
        // restored. Watch the complete startup window, without reloading media.
        this.restorePlaylist(manager, playlist, videoId, attempt + 1);
      } catch {
        // A navigation or removed playlist manager cancels restoration.
      }
    }, 250);
  }
}
