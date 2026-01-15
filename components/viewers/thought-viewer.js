import '../ui/navigation-arrows.js';

class ThoughtViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.page = 0;
  }

  set frameSvg(v) { this._frameSvg = v; this.render(); }
  set data(v) { this._data = v; this.page = 0; this.render(); }
  set config(v) { this._config = v; }

  connectedCallback() {
    this._onKey = (e) => {
      if (!this.isConnected) return;
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    };
    document.addEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKey);
  }

  render() {
    if (!this._frameSvg || !this._data) return;

    // 1. PARSE & CLEAN SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(this._frameSvg, "image/svg+xml");
    const svgEl = doc.documentElement;

    if (svgEl.nodeName !== 'svg') return;

    // Get the exact dimensions
    let viewBox = svgEl.getAttribute('viewBox');
    let w, h;

    if (viewBox) {
      const parts = viewBox.split(/\s+|,/);
      w = parseFloat(parts[2]);
      h = parseFloat(parts[3]);
    } else {
      w = parseFloat(svgEl.getAttribute('width')) || 1000;
      h = parseFloat(svgEl.getAttribute('height')) || 1000;
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    // Remove fixed dimensions so CSS can control size
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    svgEl.style.display = 'block';

    const cleanSvgString = svgEl.outerHTML;

    // Calculate ratio
    const cssRatio = `${w} / ${h}`;
    const ratioVal = w / h;

    const thoughts = this._data.thoughts || [];
    const item = thoughts[this.page];

    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: flex; 
          width: 100%; 
          height: 100%; 
          align-items: center; 
          justify-content: center;
          overflow: hidden; 
        }

        .wrap {
          position: relative;
          
          /* Lock shape to SVG */
          aspect-ratio: ${cssRatio};

          /* Fit to Screen Logic (95% to match your other viewers) */
          width: min(95vw, calc(95vh * ${ratioVal}));
          
          /* Enable Container Queries for children */
          container-type: inline-size; 

          margin: auto;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }

        .frame { width: 100%; height: 100%; display: block; }
        
        .content {
          position: absolute;
          left: 18%; right: 15%; top: 22%; bottom: 25%;
          
          overflow-y: auto; overflow-x: hidden;
          padding-right: 20px;
          
          font-family: 'Italianno', cursive; 
          
          /* 
             Fix: This works now because .wrap has container-type: inline-size 
             2.8cqw means "2.8% of the wrapper's width"
          */
          font-size: clamp(16px, 2.8cqw, 32px); 

          color: #1f1f1f; 
          line-height: 1.3;
          scrollbar-width: thin;
          scrollbar-color: #ffd700 rgba(0,0,0,0.05);
        }
        
        .nav {
          position: absolute;
          left: 50%; bottom: 6%; transform: translateX(-50%);
          display: flex; gap: 14px; align-items: center;
          background: rgba(255,255,255,.9);
          padding: 8px 14px; border-radius: 999px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .count{font:12px system-ui;color:#555;min-width:64px;text-align:center;}
        
        .content::-webkit-scrollbar { width: 6px; }
        .content::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .content::-webkit-scrollbar-thumb { background-color: #ffd700; border-radius: 10px; }
      </style>
      
      <div class="wrap">
        <div class="frame">${cleanSvgString}</div>
        <div class="content">
          <h2 style="margin-top:0">${item?.title ?? ''}</h2>
          <p style="margin-top:0;margin-bottom:1em"><em>${item?.date ?? ''}</em></p>
          <div>${item?.content ?? ''}</div>
        </div>
        <div class="nav">
          <navigation-arrows></navigation-arrows>
          <div class="count">${this.page + 1} / ${thoughts.length}</div>
        </div>
      </div>
    `;

    const arrows = this.shadowRoot.querySelector('navigation-arrows');
    if (arrows) {
      arrows.setAttribute('can-prev', String(this.page > 0));
      arrows.setAttribute('can-next', String(this.page < thoughts.length - 1));
      arrows.addEventListener('prev', () => this.prev());
      arrows.addEventListener('next', () => this.next());
    }
  }

  prev() {
    if (this.page > 0) { this.page--; this.render(); }
  }

  next() {
    const thoughts = this._data?.thoughts || [];
    if (this.page < thoughts.length - 1) { this.page++; this.render(); }
  }
}

customElements.define('thought-viewer', ThoughtViewer);
