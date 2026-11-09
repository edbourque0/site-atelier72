import { Component } from '@theme/component';

/** Matches the section's CSS breakpoint for the mobile video. */
const MOBILE_QUERY = '(max-width: 749px)';

/**
 * Brand hero: background video with play/pause and optional sound toggle.
 * Autoplay is skipped when the visitor prefers reduced motion.
 *
 * With a single video, the markup autoplays it. With a desktop and a mobile video, neither
 * autoplays from markup (both use preload="none"); this component plays only the one shown at
 * the current viewport width and swaps them when the viewport crosses the breakpoint, so only
 * the visible video downloads. Play/pause and sound controls act on the visible video.
 *
 * @typedef {object} Refs
 * @property {HTMLButtonElement} [playToggle]
 * @property {HTMLButtonElement} [soundToggle]
 *
 * @extends Component<Refs>
 */
class BrandHero extends Component {
  /** @type {AbortController | undefined} */
  #abortController;

  /** @type {MediaQueryList} */
  #mobileQuery = window.matchMedia(MOBILE_QUERY);

  /** True once the visitor pauses with the button, so a breakpoint swap doesn't restart playback. */
  #pausedByVisitor = false;

  connectedCallback() {
    super.connectedCallback();

    const videos = this.videos;
    if (videos.length === 0) return;

    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    for (const video of videos) {
      video.addEventListener('play', () => this.#syncPlayState(), { signal });
      video.addEventListener('pause', () => this.#syncPlayState(), { signal });
    }

    if (this.#prefersReducedMotion) {
      this.#pausedByVisitor = true;
      for (const video of videos) {
        video.removeAttribute('autoplay');
        video.pause();
      }
    }

    if (this.#hasResponsiveVideos) {
      this.#mobileQuery.addEventListener('change', () => this.#showActiveVideo(), { signal });
      this.#showActiveVideo();
    }

    this.#syncPlayState();
    this.#syncSoundState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  /** @returns {HTMLVideoElement[]} */
  get videos() {
    return Array.from(this.querySelectorAll('video'));
  }

  /**
   * The video shown at the current viewport width.
   * @returns {HTMLVideoElement | null}
   */
  get video() {
    if (!this.#hasResponsiveVideos) return this.querySelector('video');

    const selector = this.#mobileQuery.matches ? '.brand-hero__video--mobile' : '.brand-hero__video--desktop';
    return this.querySelector(`video${selector}`) ?? this.querySelector('video');
  }

  /** Toggles playback. Bound with on:click="/togglePlay". */
  togglePlay = async () => {
    const video = this.video;
    if (!video) return;

    if (video.paused) {
      this.#pausedByVisitor = false;
      await this.#play(video);
    } else {
      this.#pausedByVisitor = true;
      video.pause();
    }
  };

  /** Toggles sound. Bound with on:click="/toggleSound". */
  toggleSound = () => {
    const video = this.video;
    if (!video) return;

    const muted = !video.muted;
    for (const each of this.videos) each.muted = muted;
    this.#syncSoundState();
  };

  get #hasResponsiveVideos() {
    return this.querySelector('video.brand-hero__video--mobile') !== null;
  }

  get #prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Pauses the hidden video and starts the visible one unless the visitor paused playback. */
  async #showActiveVideo() {
    const active = this.video;
    if (!active) return;

    for (const video of this.videos) {
      if (video !== active && !video.paused) video.pause();
    }

    if (!this.#pausedByVisitor) await this.#play(active);
    this.#syncPlayState();
  }

  /** @param {HTMLVideoElement} video */
  async #play(video) {
    try {
      await video.play();
    } catch {
      // Playback can be blocked by the browser; the button keeps its paused state.
    }
  }

  #syncPlayState() {
    const video = this.video;
    if (!video) return;

    this.toggleAttribute('data-paused', video.paused);
    const label = video.paused ? this.dataset.labelPlay : this.dataset.labelPause;
    if (label) this.refs.playToggle?.setAttribute('aria-label', label);
  }

  #syncSoundState() {
    const video = this.video;
    if (!video) return;

    this.toggleAttribute('data-sound', !video.muted);
    this.refs.soundToggle?.setAttribute('aria-pressed', String(!video.muted));
    const label = video.muted ? this.dataset.labelUnmute : this.dataset.labelMute;
    if (label) this.refs.soundToggle?.setAttribute('aria-label', label);
  }
}

if (!customElements.get('brand-hero')) {
  customElements.define('brand-hero', BrandHero);
}
