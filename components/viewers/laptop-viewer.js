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

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        .wrap { 
          position: relative; 
          width: auto; 
          height: auto; 
          max-width: 90vw; 
          max-height: 90vh; 
          aspect-ratio: 1376/768; /* Approximate laptop aspect ratio */
          display: flex; 
          align-items: center; 
          justify-content: center;
        }
        .frame { width: 100%; height: 100%; display: block; }
        .frame svg { width: 100%; height: 100%; display: block; }
        /* Adjust these percentages to match your laptop SVG screen area */
        .content-area{position:absolute;left:13%;right:13%;top:7%;bottom:12%;
          background:#fff;overflow:auto;padding:30px;
          font-family: 'Poiret One', system-ui, -apple-system, sans-serif; color:#333; line-height:1.6;}
        
        h1{font-size:24px;border-bottom:2px solid #eee;padding-bottom:10px;margin-bottom:20px;}
        h2{font-size:18px;color:#555;margin-top:24px;margin-bottom:8px;}
        .job{margin-bottom:24px;}
        .job-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;}
        .role{font-weight:600;font-size:16px;}
        .company{color:#666;}
        .period{font-size:14px;color:#888;}
        ul{padding-left:20px;margin-top:8px;}
        li{margin-bottom:6px;}
      </style>
      <div class="wrap">
        <div class="frame">${this._frameSvg}</div>
        <div class="content-area">
          ${this.renderContent()}
        </div>
      </div>
    `;
  }

  renderContent() {
    const d = this._data;

    // For 'about' simple format
    if (d.text) {
      const bodyContent = Array.isArray(d.text)
        ? d.text.map(p => `<p>${p}</p>`).join('')
        : d.text; // Assume raw HTML string if not array

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

