import '../ui/navigation-arrows.js';
import { parseFrameSvg } from './utils/frame-svg.js';

class GalleryViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.idx = 0;
    }

    set frameSvg(v) { this._frameSvg = v; this.render(); }
    set data(v) { this._data = v; this.idx = 0; this.render(); }
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

        // 1. PARSE & CLEAN SVG (util)
        const parsed = parseFrameSvg(this._frameSvg, { defaultW: 1000, defaultH: 1000 });
        if (!parsed) return;

        const { cleanSvgString, cssRatio, ratioVal } = parsed;

        const images = this._data.images || [];
        const current = images[this.idx];

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
          
          /* Fit to Screen Logic */
          width: min(95vw, calc(95vh * ${ratioVal}));
          
          container-type: inline-size;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .frame { 
            width: 100%; 
            height: 100%; 
            display: block; 
            position: relative; 
            z-index: 1;         
            pointer-events: none;
            opacity: 0.9;
        }
        
        /* The container for the actual photo */
        .viewfinder {
            position: absolute;
            /* Adjust these percentages to fit the "hole" in your specific gallery SVG */
            left: 13%; right: 13%; top: 17%; bottom: 17%;
            
            background: rgba(233, 205, 141, 0.5); 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center;
            overflow: hidden;
            z-index: 2 /* Image sits BEHIND the frame */
        }
          
        img {
            max-width: 100%; 
            max-height: 100%; 
            object-fit: cover; 
            animation: fadeIn 0.4s ease;
            user-select: none;
        }
        
        .caption {
            position: absolute; 
            bottom: 0; left: 0; right: 0; 
            background: rgba(0,0,0,0.6); 
            color: white; 
            padding: 10px; 
            text-align: center; 
            font-family: sans-serif; 
            font-size: clamp(12px, 2cqw, 16px);
        }
            
        .controls {
            position: absolute; 
            bottom: 5%; 
            left: 0; 
            right: 0; 
            display: flex; 
            justify-content: center; 
            gap: 20px; 
            z-index: 10; /* Controls sit on top of everything */
        }
        
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
      </style>
      
      <div class="wrap">
        <div class="frame">${cleanSvgString}</div>
        <div class="viewfinder">
            ${current ? `<img src="${current.src}" alt="${current.caption || ''}">` : '<div style="color:white">No images</div>'}
            ${current?.caption ? `<div class="caption">${current.caption}</div>` : ''}
        </div>
        <div class="controls">
            <navigation-arrows></navigation-arrows>
        </div>
      </div>
    `;

        const arrows = this.shadowRoot.querySelector('navigation-arrows');
        if (arrows) {
            arrows.setAttribute('can-prev', String(this.idx > 0));
            arrows.setAttribute('can-next', String(this.idx < images.length - 1));
            arrows.addEventListener('prev', () => this.prev());
            arrows.addEventListener('next', () => this.next());
        }
    }

    prev() {
        if (this.idx > 0) { this.idx--; this.render(); }
    }

    next() {
        const images = this._data.images || [];
        if (this.idx < images.length - 1) { this.idx++; this.render(); }
    }
}

customElements.define('gallery-viewer', GalleryViewer);
