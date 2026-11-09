import { Component } from '@theme/component';

/**
 * Replaces the server-rendered fallback items with the store's live best sellers.
 * The feed is this section file rendered by the Section Rendering API on
 * /collections/all?sort_by=best-selling, so ranking follows Shopify's best-selling sort.
 * Without JavaScript, or if the request fails, the fallback items stay in place.
 *
 * @typedef {object} Refs
 * @property {HTMLOListElement} grid
 *
 * @extends Component<Refs>
 */
class RankedProducts extends Component {
  requiredRefs = ['grid'];

  /** @type {AbortController | undefined} */
  #abortController;

  connectedCallback() {
    super.connectedCallback();
    this.#loadBestSellers();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  async #loadBestSellers() {
    const { feedUrl, count } = this.dataset;
    if (!feedUrl) return;

    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      const response = await fetch(feedUrl, { signal: this.#abortController.signal });
      if (!response.ok) return;

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const limit = Number(count) || 5;
      const items = Array.from(doc.querySelectorAll('.ranked-products__item')).slice(0, limit);
      if (items.length === 0 || !this.isConnected) return;

      this.refs.grid.replaceChildren(...items.map((item) => document.importNode(item, true)));
      this.setAttribute('data-live', '');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.warn('Best sellers could not be loaded; showing the fallback products.', error);
    }
  }
}

if (!customElements.get('ranked-products')) {
  customElements.define('ranked-products', RankedProducts);
}
