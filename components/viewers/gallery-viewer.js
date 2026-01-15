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

        const images = this._data.images || [];
        const current = images[this.idx];

        this.shadowRoot.innerHTML = `
      <style>
        .wrap{position:relative;width:min(800px, 94vw); margin:auto;}
        .frame{width:100%;height:auto;display:block;}
        
        .viewfinder{position:absolute;left:8%;right:8%;top:8%;bottom:8%;
          background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center;
          overflow:hidden;}
          
        img{max-width:100%; max-height:100%; object-fit:contain; animation: fadeIn 0.4s ease;}
        
        .caption{position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); 
            color:white; padding:10px; text-align:center; font-family:sans-serif; font-size:14px;}
            
        .controls{position:absolute; bottom:20px; left:0; right:0; display:flex; justify-content:center; gap:20px; z-index:10;}
        
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
      </style>
      <div class="wrap">
        <div class="viewfinder">
            ${current ? `<img src="${current.src}" alt="${current.caption}">` : '<div style="color:white">No images</div>'}
            ${current?.caption ? `<div class="caption">${current.caption}</div>` : ''}
        </div>
        <div class="frame" style="position:relative; z-index: 2; pointer-events:none;">${this._frameSvg}</div>
        <div class="controls">
            <navigation-arrows></navigation-arrows>
        </div>
      </div>
    `;

        const arrows = this.shadowRoot.querySelector('navigation-arrows');
        arrows.setAttribute('can-prev', String(this.idx > 0));
        arrows.setAttribute('can-next', String(this.idx < images.length - 1));

        arrows.addEventListener('prev', () => this.prev());
        arrows.addEventListener('next', () => this.next());
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
