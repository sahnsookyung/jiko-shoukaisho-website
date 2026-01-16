import '../ui/navigation-arrows.js';

class TimelineViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set frameSvg(v) { this._frameSvg = v; this.render(); }
  set data(v) { this._data = v; this.render(); }
  set config(v) { this._config = v; }

  connectedCallback() {
    this.render();
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
      w = parseFloat(svgEl.getAttribute('width')) || 1376;
      h = parseFloat(svgEl.getAttribute('height')) || 768;
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    // Remove fixed dimensions so CSS can control size
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    svgEl.style.display = 'block';

    const cleanSvgString = svgEl.outerHTML;

    // Calculate ratio for CSS
    const cssRatio = `${w} / ${h}`;
    const ratioVal = w / h;

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

          /* Fit to Screen Logic (95% to match others) */
          width: min(95vw, calc(95vh * ${ratioVal}));
          
          /* Allow child elements to use container query units */
          container-type: inline-size;

          margin: auto;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }

        .frame { width: 100%; height: 100%; display: block; }
        
        .content-area {
          position: absolute;
          /* Adjust these percentages based on your specific scroll/parchment SVG */
          left: 14%; right: 14%; top: 12%; bottom: 12%;
          
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0; /* Removing gap, using padding on items for spacing */
          overflow-x: auto;
          overflow-y: hidden;
          padding: 20px;
          
          font-family: 'Italianno', cursive;
          scrollbar-width: thin;
          scrollbar-color: #5c4033 rgba(0,0,0,0.05); 
        }
        
        .content-area::-webkit-scrollbar { height: 8px; }
        .content-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
        .content-area::-webkit-scrollbar-thumb { background-color: #5c4033; border-radius: 10px; border: 1px solid #e0d0b0; }

        .timeline-item {
          /* Allow content to define width, but ensure minimums so it's not too squashed */
          flex: 0 0 clamp(200px, 25cqw, 280px);
          min-width: 200px; 
          
          text-align: center;
          
          /* Symmetric padding ensures the border (right) is visually centered between contents */
          padding: 0 clamp(20px, 4cqw, 40px);
          
          border-right: 1px solid rgba(139, 69, 19, 0.2);
        }
        .timeline-item:last-child { border-right: none; }

        .year { 
          font-size: clamp(24px, 4cqw, 32px); 
          font-weight: bold; 
          color: #8B4513; 
          margin-bottom: 8px; 
        }
        .title { 
          font-size: clamp(18px, 3cqw, 24px); 
          margin-bottom: 12px; 
          color: #2c1a0b; 
        }
        .desc { 
          font-size: clamp(16px, 2.5cqw, 20px); 
          line-height: 1.4; 
          color: #4a3b2a; 
        }
      </style>
      <div class="wrap">
        <div class="frame">${cleanSvgString}</div>
        <div class="content-area">
          ${(this._data.events || []).map(evt => `
            <div class="timeline-item">
                <div class="year">${evt.year}</div>
                <div class="title">${evt.title}</div>
                <div class="desc">${evt.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('timeline-viewer', TimelineViewer);
