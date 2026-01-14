import { loadSVG, loadJSON } from '../utils/svg-loader.js';
import './ui/loading-spinner.js';

class ContentViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._visible = false;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
      <style>
        :host{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:1000;}
        :host(.visible){display:flex;}
        .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.0);transition:background .25s ease-out;}
        :host(.visible) .backdrop{background:rgba(0,0,0,.85);}
        .wrap{position:relative;max-width:95vw;max-height:95vh;}
        .panel{opacity:0;transform:scale(.96);transition:opacity .3s ease-out, transform .3s ease-out;}
        :host(.visible) .panel{opacity:1;transform:scale(1);}
        .close{position:absolute;top:-44px;right:-44px;width:38px;height:38px;border-radius:999px;
          border:2px solid #ffd700;background:rgba(255,215,0,.12);cursor:pointer;}
        .close:hover{background:rgba(255,215,0,.25)}
        .close:before,.close:after{content:'';position:absolute;left:50%;top:50%;width:18px;height:2px;
          background:#ffd700;transform-origin:center;}
        .close:before{transform:translate(-50%,-50%) rotate(45deg);}
        .close:after{transform:translate(-50%,-50%) rotate(-45deg);}
        
        @media (max-width: 600px) {
            .close { top: -40px; right: 0; }
        }
      </style>
      <div class="backdrop"></div>
      <div class="wrap">
        <button class="close" aria-label="Close"></button>
        <div class="panel">
          <loading-spinner></loading-spinner>
        </div>
      </div>
    `;

        this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.requestClose());
        this.shadowRoot.querySelector('.close').addEventListener('click', () => this.requestClose());
    }

    isVisible() {
        return this.classList.contains('visible');
    }

    requestClose() {
        this.dispatchEvent(new CustomEvent('close-request'));
    }

    async show(cfg) {
        this.classList.add('visible');

        const panel = this.shadowRoot.querySelector('.panel');
        panel.innerHTML = `<loading-spinner></loading-spinner>`;

        try {
            // Lazy-load the viewer module
            await import(`./viewers/${cfg.component}.js`);

            // Lazy-load frame svg + JSON content
            const [frameSvg, data] = await Promise.all([
                loadSVG(`assets/svg-containers/${cfg.containerSVG}.svg`),
                loadJSON(cfg.contentPath)
            ]);

            const el = document.createElement(cfg.component);
            el.frameSvg = frameSvg;
            el.data = data;
            el.config = cfg;

            panel.innerHTML = '';
            panel.appendChild(el);
        } catch (e) {
            console.error('Failed to load viewer', e);
            panel.innerHTML = `<div style="color:white;padding:20px;">Failed to load content. Please try again.</div>`;
        }
    }

    hide() {
        this.classList.remove('visible');
        // Optional: clear panel content after transition
        setTimeout(() => {
            const panel = this.shadowRoot.querySelector('.panel');
            if (panel) panel.innerHTML = '';
        }, 300);
    }
}

customElements.define('content-viewer', ContentViewer);
