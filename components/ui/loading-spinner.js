class LoadingSpinner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
      <style>
        .s{width:48px;height:48px;border-radius:999px;
          border:4px solid rgba(255,215,0,.25);border-top-color:#ffd700;
          animation:spin 1s linear infinite;margin:20px;}
        @keyframes spin{to{transform:rotate(360deg)}}
      </style>
      <div class="s"></div>
    `;
    }
}

customElements.define('loading-spinner', LoadingSpinner);
