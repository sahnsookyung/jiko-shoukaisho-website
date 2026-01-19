class LoadingSpinner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .spinner {
          width: 48px; height: 48px; border-radius: 999px;
          border: 4px solid rgba(255, 215, 0, .25); border-top-color: #ffd700;
          animation: spin 1s linear infinite; margin: 20px;
        }
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; 
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
      <div class="spinner" role="status" aria-label="Loading">
        <span class="sr-only">Loading...</span>
      </div>
    `;
  }
}

customElements.define('loading-spinner', LoadingSpinner);
