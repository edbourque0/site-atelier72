import { Component } from '@theme/component';

/**
 * Brand hero: background video with play/pause and optional sound toggle.
 * Autoplay is skipped when the visitor prefers reduced motion.
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

  connectedCallback() {
    super.connectedCallback();

    const video = this.video;
    if (!video) return;

    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    video.addEventListener('play', () => this.#syncPlayState(), { signal });
    video.addEventListener('pause', () => this.#syncPlayState(), { signal });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.removeAttribute('autoplay');
      video.pause();
    }

    this.#syncPlayState();
    this.#syncSoundState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  /** @returns {HTMLVideoElement | null} */
  get video() {
    return this.querySelector('video');
  }

  /** Toggles playback. Bound with on:click="/togglePlay". */
  togglePlay = async () => {
    const video = this.video;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        // Playback can be blocked by the browser; the button keeps its paused state.
      }
    } else {
      video.pause();
    }
  };

  /** Toggles sound. Bound with on:click="/toggleSound". */
  toggleSound = () => {
    const video = this.video;
    if (!video) return;

    video.muted = !video.muted;
    this.#syncSoundState();
  };

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
