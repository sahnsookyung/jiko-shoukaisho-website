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

        this.shadowRoot.innerHTML = `
      <style>
        .wrap{position:relative;width:min(600px, 90vw); margin:auto;}
        .frame{width:100%;height:auto;display:block;}
        .content-area{position:absolute;left:15%;right:15%;top:12%;bottom:12%;
          overflow:auto;padding:20px; font-family: 'Georgia', serif; color:#2c1a0b; text-align:center;}
        
        .timeline-item{margin-bottom:40px; border-bottom:1px solid rgba(0,0,0,0.1); padding-bottom:30px;}
        .timeline-item:last-child{border-bottom:none;}
        .year{font-size:24px;font-weight:bold;color:#8B4513;margin-bottom:8px;}
        .title{font-size:18px;margin-bottom:12px;font-style:italic;}
        .desc{line-height:1.5;font-size:15px;}
      </style>
      <div class="wrap">
        <div class="frame">${this._frameSvg}</div>
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
