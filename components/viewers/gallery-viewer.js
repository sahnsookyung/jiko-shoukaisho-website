import '../ui/navigation-arrows.js';

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

        // Remove fixed dimensions
        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.display = 'block';

        const cleanSvgString = svgEl.outerHTML;

        // Calculate ratio
        const cssRatio = `${w} / ${h}`;
        const ratioVal = w / h;

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
            z-index: 2;         /* SVG sits ON TOP of the image (good for borders/glare) */
            pointer-events: none; /* Let clicks pass through frame to controls if needed */
        }
        
        /* The container for the actual photo */
        .viewfinder {
            position: absolute;
            /* Adjust these percentages to fit the "hole" in your specific gallery SVG */
            left: 8%; right: 8%; top: 8%; bottom: 8%;
            
            background: #000; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center;
            overflow: hidden;
            z-index: 1; /* Image sits BEHIND the frame */
        }
          
        img {
            max-width: 100%; 
            max-height: 100%; 
            object-fit: contain; 
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
        <!-- 1. The Image Layer -->
        <div class="viewfinder">
            ${current ? `<img src="${current.src}" alt="${current.caption || ''}">` : '<div style="color:white">No images</div>'}
            ${current?.caption ? `<div class="caption">${current.caption}</div>` : ''}
        </div>

        <!-- 2. The SVG Frame Layer (Overlays the image) -->
        <div class="frame">${cleanSvgString}</div>

        <!-- 3. The Controls Layer -->
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
