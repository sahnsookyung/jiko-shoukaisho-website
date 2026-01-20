interface TooltipConfig {
  label?: string;
  description?: string;
}

class TooltipDisplay extends HTMLElement {
  private _posRetryCount = 0;
  private readonly _maxPosRetries = 10;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (this.shadowRoot) {
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
  }

  show(cfg: TooltipConfig, e: MouseEvent): void {
    if (!cfg || !e || !this.shadowRoot) return;
    const labelEl = this.shadowRoot.querySelector('.label');
    const descEl = this.shadowRoot.querySelector('.desc');

    if (labelEl) labelEl.textContent = cfg.label ?? '';
    if (descEl) descEl.textContent = cfg.description ?? '';

    this._posRetryCount = 0;
    this.updatePosition(e);
    this.classList.add('visible');
  }

  hide(): void {
    this.classList.remove('visible');
  }

  updatePosition(e: MouseEvent): void {
    if (!e || !this.shadowRoot) return;
    const pad = 16;
    const tip = this.shadowRoot.querySelector('.tip') as HTMLElement;
    if (!tip) return; // Guard if not rendered yet

    const r = tip.getBoundingClientRect();

    // If dimensions are 0 (layout not ready), defer measurement
    if (r.width === 0 || r.height === 0) {
      if (this._posRetryCount < this._maxPosRetries) {
        this._posRetryCount++;
        requestAnimationFrame(() => this.updatePosition(e));
      } else {
        console.warn('Tooltip measurement failed after max retries; falling back to basic position.');
        this._applyDefaultPosition(e);
      }
      return;
    }

    this._posRetryCount = 0; // Reset on success

    let x = e.clientX + pad;
    let y = e.clientY + pad;

    if (x + r.width > window.innerWidth) x = e.clientX - r.width - pad;
    if (y + r.height > window.innerHeight) y = e.clientY - r.height - pad;

    // Clamp to avoid negative values
    x = Math.max(0, x);
    y = Math.max(0, y);

    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
  }

  private _applyDefaultPosition(e: MouseEvent): void {
    const pad = 16;
    this.style.left = `${e.clientX + pad}px`;
    this.style.top = `${e.clientY + pad}px`;
  }
}

customElements.define('tooltip-display', TooltipDisplay);
