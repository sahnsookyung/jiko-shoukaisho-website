import { processSvgForImg } from './utils/frame-svg.js';

class LaptopViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set frameSvg(v) { this._frameSvg = v; this.render(); }
  set cutoutSvg(v) { this._cutoutSvg = v; this.render(); }
  set data(v) { this._data = v; this.render(); }

  connectedCallback() {
    this.render();
  }

  _processSvg(svgString) {
    return processSvgForImg(svgString, { defaultW: 1376, defaultH: 768 });
  }

  render() {
    if (!this._frameSvg || !this._data) return;

    const frameObj = this._processSvg(this._frameSvg);
    if (!frameObj) return;

    // Optional Cutout
    const cutoutObj = this._processSvg(this._cutoutSvg);

    // Calculate Aspect Ratio from the Frame
    const cssRatio = `${frameObj.w} / ${frameObj.h}`;
    const ratioVal = frameObj.w / frameObj.h;

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
          aspect-ratio: ${cssRatio};
          width: min(95vw, calc(95vh * ${ratioVal}));
          margin: auto;
          display: flex; 
          align-items: center; 
          justify-content: center;
          container-type: inline-size;
        }

        /* 
           STRICT LAYERING 
           Using z-index to force the order:
           1. Cutout (Bottom)
           2. Content (Middle)
           3. Frame (Top)
        */

        .layer-cutout { 
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 0;
            object-fit: fill; /* Ensures SVG stretches exactly like the frame */
            pointer-events: none;
        }

        .layer-content {
            position: absolute;
            z-index: 1;
            
            /* Positioning: Defines the outer boundary */
            left: 14%; 
            right: 14%; 
            top: 8%; 
            bottom: 12%;

            background: rgba(255, 255, 255, 0.9);
            overflow: auto;
            
            /* Fluid padding (matches your font logic) */
            /* Scales between 15px and 40px based on container width */
            /* 
            Top:    Larger (scales 20px-60px)
            Right:  Standard (scales 15px-40px)
            Bottom: Larger (scales 20px-60px)
            Left:   Standard (scales 15px-40px)
            */
            padding: clamp(40px, 8cqw, 80px) clamp(15px, 6cqw, 80px) clamp(20px, 8cqw, 60px) clamp(15px, 6cqw, 60px);


            pointer-events: auto; 
            
            font-family: 'Poiret One', system-ui, -apple-system, sans-serif; 
            color: #333;
            scrollbar-width: thin;
        }

        .layer-frame { 
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 2;
            object-fit: fill;
            pointer-events: none;
        }

        /* Typography */
        h1{font-size: clamp(20px, 4cqw, 28px); border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:20px;}
        h2{font-size: clamp(16px, 3cqw, 22px); color:#555; margin-top:24px; margin-bottom:8px;}
        p, li, span { font-size: clamp(14px, 2.5cqw, 18px); line-height: 1.6; }
        
        .job{margin-bottom:24px;}
        .job-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;}
        .role{font-weight:600;}
        .company{color:#666;}
        .period{font-size:0.9em;color:#888;}
        ul{padding-left:20px;margin-top:8px;}
        li{margin-bottom:6px;}
      </style>
      
      <div class="wrap">
        <!-- Layer 1: The Screen Cutout (Background) -->
        ${cutoutObj ? `<img class="layer-cutout" src="${cutoutObj.src}" />` : ''}

        <!-- Layer 2: The Content (Middle) -->
        <div class="layer-content">
          ${this.renderContent()}
        </div>
        
        <!-- Layer 3: The Frame (Top) -->
        <img class="layer-frame" src="${frameObj.src}" />
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
