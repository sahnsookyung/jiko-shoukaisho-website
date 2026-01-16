class LaptopViewer extends HTMLElement {
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

    // 1. CLEAN SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(this._frameSvg, "image/svg+xml");
    const svgEl = doc.documentElement;

    if (svgEl.nodeName !== 'svg') return;

    // Get exact dimensions
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

    // Standardize SVG
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    svgEl.style.display = 'block';

    const cleanSvgString = svgEl.outerHTML;
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
          /* Fit to screen */
          width: min(95vw, calc(95vh * ${ratioVal}));
          margin: auto;
          display: flex; 
          align-items: center; 
          justify-content: center;
          
          container-type: inline-size;
        }

        /* FRAME: Fills the wrapper completely on top */
        .frame { 
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 2; 
            pointer-events: none; /* Pass clicks to content */
        }

        /* CONTENT: Sits behind frame */
        .content-area {
            position: absolute;
            z-index: 1; 
            
            /* Proven alignment values from previous step */
            left: 14%; 
            right: 14%; 
            top: 8%; 
            bottom: 12%;

            background: #fff; 
            overflow: auto;
            padding: 30px;
            
            /* Re-enable interactions */
            pointer-events: auto; 
            
            font-family: 'Poiret One', system-ui, -apple-system, sans-serif; 
            color: #333; 
            line-height: 1.6;
            scrollbar-width: thin;
        }
        
        /* Typography */
        h1{font-size: clamp(20px, 4cqw, 28px); border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:20px;}
        h2{font-size: clamp(16px, 3cqw, 22px); color:#555; margin-top:24px; margin-bottom:8px;}
        p, li, span { font-size: clamp(14px, 2.5cqw, 18px); }
        
        .job{margin-bottom:24px;}
        .job-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;}
        .role{font-weight:600;}
        .company{color:#666;}
        .period{font-size:0.9em;color:#888;}
        ul{padding-left:20px;margin-top:8px;}
        li{margin-bottom:6px;}
      </style>
      
      <div class="wrap">
        <!-- The Content Layer -->
        <div class="content-area">
          ${this.renderContent()}
        </div>
        
        <!-- The Frame Layer -->
        <div class="frame">${cleanSvgString}</div>
      </div>
    `;
  }

  renderContent() {
    const d = this._data;

    // For 'about' simple format
    if (d.text) {
      const bodyContent = Array.isArray(d.text)
        ? d.text.map(p => `<p>${p}</p>`).join('')
        : d.text;

      return `
            <h1>${d.title || 'About Me'}</h1>
            <div class="body-text">
                ${bodyContent}
            </div>
        `;
    }

    // For 'resume' structured format
    return `
      <h1>${d.name}</h1>
      <p style="margin-top:-16px;color:#666;margin-bottom:24px;">${d.title}</p>
      
      ${(d.sections || []).map(section => {
      const items = (section.items || []).map(item => {
        const highlightsHtml = item.highlights
          ? `<ul>${item.highlights.map(h => `<li>${h}</li>`).join('')}</ul>`
          : '';

        const descHtml = item.description ? `<p>${item.description}</p>` : '';
        const companyHtml = item.company ? `<span class="company">@ ${item.company}</span>` : '';

        return `
              <div class="job">
                <div class="job-header">
                  <div><span class="role">${item.role}</span> ${companyHtml}</div>
                  <span class="period">${item.period}</span>
                </div>
                ${descHtml}
                ${highlightsHtml}
              </div>`;
      }).join('');

      return `<h2>${section.title}</h2>${items}`;
    }).join('')}
    `;
  }
}

customElements.define('laptop-viewer', LaptopViewer);
