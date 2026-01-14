class TooltipDisplay extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
      <style>
        :host{position:fixed;z-index:999;pointer-events:none;opacity:0;transform:translateY(8px);
          transition:opacity .15s ease-out, transform .15s ease-out;}
        :host(.visible){opacity:1;transform:translateY(0);}
        .tip{background:rgba(10,10,10,.92);border:2px solid #ffd700;border-radius:10px;
          padding:10px 12px;max-width:260px;box-shadow:0 6px 30px rgba(255,215,0,.18);
          font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
        .label{color:#ffd700;font-weight:650;font-size:14px;margin-bottom:4px;}
        .desc{color:#d0d0d0;font-size:12px;line-height:1.35;}
        .hint{color:#9a9a9a;font-size:11px;margin-top:6px;font-style:italic;}
      </style>
      <div class="tip">
        <div class="label"></div>
        <div class="desc"></div>
        <div class="hint">Click to open</div>
      </div>
    `;
    }

    show(cfg, e) {
        this.shadowRoot.querySelector('.label').textContent = cfg.label;
        this.shadowRoot.querySelector('.desc').textContent = cfg.description;
        this.updatePosition(e);
        this.classList.add('visible');
    }

    hide() {
        this.classList.remove('visible');
    }

    updatePosition(e) {
        const pad = 16;
        const tip = this.shadowRoot.querySelector('.tip');
        if (!tip) return; // Guard if not rendered yet

        const r = tip.getBoundingClientRect();

        let x = e.clientX + pad;
        let y = e.clientY + pad;

        if (x + r.width > window.innerWidth) x = e.clientX - r.width - pad;
        if (y + r.height > window.innerHeight) y = e.clientY - r.height - pad;

        this.style.left = `${x}px`;
        this.style.top = `${y}px`;
    }
}

customElements.define('tooltip-display', TooltipDisplay);
