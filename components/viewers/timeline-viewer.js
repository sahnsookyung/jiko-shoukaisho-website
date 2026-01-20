import '../ui/navigation-arrows.js';
import { escapeHtml } from '../../utils/string-utils.js';
import { parseFrameSvg } from './utils/frame-svg.js';

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

    // 1. PARSE & CLEAN SVG (util)
    const parsed = parseFrameSvg(this._frameSvg, { defaultW: 1376, defaultH: 768 });
    if (!parsed) return;

    const { cleanSvgString, cssRatio, ratioVal } = parsed;

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
          container-type: inline-size;
          margin: auto;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }

        .frame { width: 100%; height: 100%; display: block; }
        
        /* 1. SCROLL VIEWPORT: Fixed to the frame, handles scrolling */
        .content-area {
          position: absolute;
          left: 14%; right: 14%; top: 12%; bottom: 12%;
          
          display: flex;
          /* Centers the strip vertically within the frame */
          align-items: center; 
          
          overflow-x: auto;
          overflow-y: hidden;
          
          /* Horizontal padding for the scroll track */
          padding: 0 20px;
          
          font-family: 'Bilbo Swash Caps', cursive;
          scrollbar-width: thin;
          scrollbar-color: #5c4033 rgba(0,0,0,0.05); 
        }
        
        .content-area::-webkit-scrollbar { height: 8px; }
        .content-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
        .content-area::-webkit-scrollbar-thumb { background-color: #5c4033; border-radius: 10px; border: 1px solid #e0d0b0; }

        /* 2. INNER STRIP: Wraps items to sync their height */
        .timeline-strip {
          display: flex;
          flex-direction: row;
          
          /* Crucial: Stretches all items to the height of the tallest one */
          align-items: stretch; 
          
          /* Ensures the strip expands horizontally */
          width: max-content; 
          
          /* Vertical padding creates breathing room inside the borders */
          padding: 20px 0;
        }

        /* 3. ITEMS: The actual content cells */
        .timeline-item {
          flex: 0 0 clamp(200px, 25cqw, 280px);
          min-width: 200px; 
          text-align: center;
          padding: 0 clamp(20px, 4cqw, 40px);
          
          border-right: 1px solid rgba(139, 69, 19, 0.2);
          
          /* Flex column ensures text is centered vertically within the stretched border */
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .timeline-item:last-child { border-right: none; }

        .year { 
          font-size: clamp(24px, 4cqw, 32px); 
          font-weight: bold; 
          color: #8B4513; 
          margin-bottom: 8px; 
        }
        .title { 
          font-size: clamp(18px, 3cqw, 36px); 
          margin-bottom: 12px; 
          color: #2c1a0b; 
        }
        .desc { 
          font-size: clamp(16px, 2.5cqw, 24px); 
          line-height: 1.4; 
          color: #4a3b2a; 
        }
      </style>
      
      <div class="wrap">
        <div class="frame">${cleanSvgString}</div>
        
        <div class="content-area">
          <div class="timeline-strip">
            ${(this._data.events || []).map(evt => `
              <div class="timeline-item">
                  <div class="year">${escapeHtml(evt.year)}</div>
                  <div class="title">${escapeHtml(evt.title)}</div>
                  <div class="desc">${escapeHtml(evt.description)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
      </div>
    `;
  }
}

customElements.define('timeline-viewer', TimelineViewer);
