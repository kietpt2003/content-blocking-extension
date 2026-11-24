// Native YouTube actions carry page-owned objects, so inspect them in MAIN world.
const IDLE =
  /(?:video paused[.!?]?\s*continue watching|continue watching\?|video (?:đã )?tạm dừng[.!?]?\s*(?:bạn có muốn )?tiếp tục xem|tiếp tục xem\?)/iu;

export function isYouTubeIdleText(text) {
  return typeof text === 'string' && IDLE.test(text.replace(/\s+/gu, ' '));
}

export class YouTubeIdle {
  constructor(document) {
    this.document = document;
    this.onAction = (event) => this.handleAction(event);
  }

  configure(active) {
    this.document.removeEventListener('yt-action', this.onAction, true);
    this.idlePause = null;
    this.active = active === true;
    if (this.active) this.document.addEventListener('yt-action', this.onAction, true);
  }

  handleAction(event) {
    if (!this.active) return;
    const action = event.detail;
    // YouTube sends the idle dialog and PAUSE_PLAYER as separate native actions.
    // In a background tab the dialog's render/click handlers can wait for a frame
    // until the tab is visible again. Acknowledge this specific flow before render.
    if (action?.actionName === 'yt-signal-action-pause-player') {
      const pending = this.idlePause;
      this.idlePause = null;
      if (
        pending?.target === event.target &&
        Date.now() <= pending.deadline &&
        action.args?.[0]?.signalAction?.signal === 'PAUSE_PLAYER'
      )
        event.stopImmediatePropagation();
      return;
    }
    if (action?.actionName !== 'yt-open-popup-action' || this.document.visibilityState !== 'hidden')
      return;
    const popup = action.args?.[0]?.openPopupAction;
    const dialog = popup?.popup?.confirmDialogRenderer;
    if (popup?.popupType !== 'DIALOG' || !dialog) return;
    const text = (dialog.dialogMessages || [])
      .map((message) => message.simpleText || message.runs?.map((run) => run.text).join('') || '')
      .join(' ');
    const confirm = dialog.confirmButton?.buttonRenderer;
    const acknowledgements =
      confirm?.serviceEndpoint?.signalServiceEndpoint?.actions ||
      confirm?.command?.signalServiceEndpoint?.actions;
    if (
      !isYouTubeIdleText(text) ||
      confirm?.isDisabled ||
      !acknowledgements?.some(
        (command) => command.signalAction?.signal === 'ACKNOWLEDGE_YOUTHERE',
      ) ||
      !dialog.onClosedActions?.some((command) => command.signalAction?.signal === 'PLAY_PLAYER')
    )
      return;
    const video = this.document.querySelector('#movie_player video, .html5-video-player video');
    if (!video || video.paused || video.ended || video.closest('.ad-showing, .ad-interrupting'))
      return;
    this.idlePause = { target: event.target, deadline: Date.now() + 1000 };
    event.stopImmediatePropagation();
    event.target.dispatchEvent(
      new this.document.defaultView.CustomEvent('yt-action', {
        bubbles: true,
        composed: true,
        detail: {
          actionName: 'yt-signal-action-acknowledge-youthere',
          optionalAction: true,
          args: [{ signalAction: { signal: 'ACKNOWLEDGE_YOUTHERE' } }, event.target],
          returnValue: [],
        },
      }),
    );
  }
}
