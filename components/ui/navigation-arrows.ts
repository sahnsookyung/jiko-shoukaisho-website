class NavigationArrows extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.render();
    }

    static get observedAttributes(): string[] {
        return ['can-prev', 'can-next'];
    }

    attributeChangedCallback(): void {
        this.render();
    }

    render(): void {
        if (!this.shadowRoot) return;

        const canPrev = this.getAttribute('can-prev') !== 'false';
        const canNext = this.getAttribute('can-next') !== 'false';

        this.shadowRoot.innerHTML = `
      <style>
        .row{display:flex;gap:10px}
        button{width:38px;height:38px;border-radius:999px;border:2px solid #ffd700;
          background:rgba(255,215,0,.1);cursor:pointer;display:flex;align-items:center;justify-content:center;
          color: #ffd700; font-size: 16px; transition: all 0.2s ease;}
        button:hover:not(:disabled){background:rgba(255,215,0,.25);}
        button:disabled{opacity:.35;cursor:not-allowed;border-color:#555;color:#555;}
      </style>
      <div class="row">
        <button class="prev" ${canPrev ? '' : 'disabled'} aria-label="Previous">←</button>
        <button class="next" ${canNext ? '' : 'disabled'} aria-label="Next">→</button>
      </div>
    `;

        const prevBtn = this.shadowRoot.querySelector('.prev');
        const nextBtn = this.shadowRoot.querySelector('.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!canPrev) return;
                this.dispatchEvent(new CustomEvent('prev', { bubbles: true }));
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!canNext) return;
                this.dispatchEvent(new CustomEvent('next', { bubbles: true }));
            });
        }
    }
}

customElements.define('navigation-arrows', NavigationArrows);
