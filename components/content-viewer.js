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
        :host {
            position: fixed; inset: 0; display: none; 
            align-items: center; justify-content: center; z-index: 1000;
        }
        :host(.visible) { display: flex; }
        
        .backdrop {
            position: absolute; inset: 0; 
            background: rgba(0,0,0,.0); 
            transition: background .25s ease-out;
            cursor: pointer;
        }
        :host(.visible) .backdrop { background: rgba(0,0,0,.85); }
        
        .wrap {
            position: relative; width: 100%; height: 100%;
            pointer-events: none; /* Let clicks pass through wrapper */
            display: flex; align-items: center; justify-content: center;
        }

        .panel {
            width: 100%; height: 100%; 
            pointer-events: none; /* Let clicks pass through panel */
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transform: scale(.96); 
            transition: opacity .3s ease-out, transform .3s ease-out;
        }
        :host(.visible) .panel { opacity: 1; transform: scale(1); }
        
        .close {
            position: absolute; top: 30px; right: 30px; 
            width: 44px; height: 44px; border-radius: 50%;
            border: 2px solid #ffd700; background: rgba(0, 0, 0, 0.5);
            cursor: pointer; z-index: 100; pointer-events: auto;
            transition: background 0.2s;
        }
        .close:hover { background: rgba(255, 215, 0, 0.25); }
        .close:before, .close:after {
            content: ''; position: absolute; left: 50%; top: 50%; 
            width: 20px; height: 2px; background: #ffd700; 
            transform-origin: center;
        }
        .close:before { transform: translate(-50%, -50%) rotate(45deg); }
        .close:after { transform: translate(-50%, -50%) rotate(-45deg); }
        
        @media (max-width: 600px) {
            .close { top: 15px; right: 15px; width: 36px; height: 36px; }
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

    isVisible() { return this.classList.contains('visible'); }
    requestClose() { this.dispatchEvent(new CustomEvent('close-request')); }

    async show(cfg) {
        this.classList.add('visible');
        const panel = this.shadowRoot.querySelector('.panel');
        panel.innerHTML = `<loading-spinner></loading-spinner>`;

        try {
            await import(`./viewers/${cfg.component}.js`);

            const [frameSvg, data] = await Promise.all([
                loadSVG(`assets/images/output_svgs/min/${cfg.containerSVG}.svg`),
                loadJSON(cfg.contentPath)
            ]);

            const el = document.createElement(cfg.component);

            // 1. Set host to ignore events (so empty space clicks through)
            el.style.pointerEvents = 'none';

            // 2. MONKEY PATCH: Override render to persist our style fix
            // This ensures that even when you click "Next" or "Prev", the fix stays.
            const originalRender = el.render.bind(el);
            el.render = function () {
                // Call the original render (which wipes shadowRoot)
                originalRender();

                // Immediately re-inject our fix
                if (this.shadowRoot) {
                    const style = document.createElement('style');
                    style.textContent = `
                        /* Force specific internal areas to accept mouse events */
                        .wrap, 
                        .content-area, 
                        .content, 
                        .viewfinder, 
                        .controls,
                        .nav,
                        button, 
                        a { 
                            pointer-events: auto !important; 
                        }
                    `;
                    this.shadowRoot.appendChild(style);
                }
            };

            // 3. Set data (which triggers the first render + our patch)
            el.frameSvg = frameSvg;
            el.data = data;
            el.config = cfg;

            panel.innerHTML = '';
            panel.appendChild(el);

            el.tabIndex = -1;
            el.focus();

        } catch (e) {
            console.error('Failed to load viewer', e);
            panel.innerHTML = `<div style="color:white;padding:20px;text-align:center;">Failed to load content.<br>Please try again.</div>`;
        }
    }

    hide() {
        this.classList.remove('visible');
        setTimeout(() => {
            const panel = this.shadowRoot.querySelector('.panel');
            if (panel) panel.innerHTML = '';
        }, 300);
    }
}

customElements.define('content-viewer', ContentViewer);
