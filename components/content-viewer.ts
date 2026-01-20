import { loadSVG, loadJSON } from '../utils/svg-loader';
import { ContentConfig } from '../config/content-map';
import './ui/loading-spinner';

interface ViewerElement extends HTMLElement {
    render(): void;
    frameSvg: string;
    cutoutSvg?: string;
    data: any;
    config: ContentConfig;
}

class ContentViewer extends HTMLElement {
    private _reqId: number = 0;
    private _abortController: AbortController | null = null;
    private readonly _onBackdropClick: () => void;
    private readonly _onCloseClick: () => void;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._onBackdropClick = this.requestClose.bind(this);
        this._onCloseClick = this.requestClose.bind(this);
    }

    connectedCallback(): void {
        this._renderShell();
        this._addListeners();
    }

    disconnectedCallback(): void {
        this._removeListeners();
    }

    private _renderShell(): void {
        if (!this.shadowRoot || this.shadowRoot.innerHTML.trim() !== '') return;

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
    }

    private _addListeners(): void {
        if (!this.shadowRoot) return;
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        const closeBtn = this.shadowRoot.querySelector('.close');

        if (backdrop) backdrop.addEventListener('click', this._onBackdropClick);
        if (closeBtn) closeBtn.addEventListener('click', this._onCloseClick);
    }

    private _removeListeners(): void {
        if (!this.shadowRoot) return;
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        const closeBtn = this.shadowRoot.querySelector('.close');

        if (backdrop) backdrop.removeEventListener('click', this._onBackdropClick);
        if (closeBtn) closeBtn.removeEventListener('click', this._onCloseClick);
    }

    isVisible(): boolean { return this.classList.contains('visible'); }
    requestClose(): void { this.dispatchEvent(new CustomEvent('close-request')); }

    async show(cfg: ContentConfig): Promise<void> {
        // Create a new request token
        this._reqId++;
        const reqId = this._reqId;

        this.classList.add('visible');
        if (!this.shadowRoot) return;
        const panel = this.shadowRoot.querySelector('.panel') as HTMLElement;
        if (!panel) return;

        panel.innerHTML = `<loading-spinner></loading-spinner>`;

        try {
            if (!/^[a-z0-9-]+$/i.test(cfg.component)) {
                throw new Error('Invalid component name');
            }
            if (!/^[a-z0-9_-]+$/i.test(cfg.containerSVG)) {
                throw new Error('Invalid containerSVG name');
            }
            if (cfg.cutoutSVG && !/^[a-z0-9_-]+$/i.test(cfg.cutoutSVG)) {
                throw new Error('Invalid cutoutSVG name');
            }
            if (this._abortController) this._abortController.abort();
            this._abortController = new AbortController();
            const signal = this._abortController.signal;

            await import(`./viewers/${cfg.component}.ts`);
            if (reqId !== this._reqId) return;

            const promises: [Promise<string>, Promise<any>, Promise<string | undefined>] = [
                loadSVG(`/site-component-images/output_svgs/min/${cfg.containerSVG}.svg`, signal),
                loadJSON(cfg.contentPath, signal),
                cfg.cutoutSVG ? loadSVG(`/site-component-images/output_svgs/min/${cfg.cutoutSVG}.svg`, signal) : Promise.resolve(undefined)
            ];

            const results = await Promise.all(promises);
            if (reqId !== this._reqId) return;
            const frameSvg = results[0];
            const data = results[1];
            const cutoutSvg = results[2];

            const el = document.createElement(cfg.component) as ViewerElement;

            // 1. Set host to ignore events (so empty space clicks through)
            el.style.pointerEvents = 'none';
            // 2. Set custom property so internal interactive areas can opt-in
            el.style.setProperty('--viewer-pointer-events', 'auto');

            // 3. Set data (which triggers the first render + our patch)
            el.frameSvg = frameSvg;
            if (cutoutSvg) el.cutoutSvg = cutoutSvg;
            el.data = data;
            el.config = cfg;

            panel.innerHTML = '';
            panel.appendChild(el);

            el.tabIndex = -1;
            el.focus();

        } catch (e: any) {
            if (reqId !== this._reqId || e.name === 'AbortError') return;
            console.error('Failed to load viewer', e);
            panel.innerHTML = `<div style="color:white;padding:20px;text-align:center;">Failed to load content.<br>Please try again.</div>`;
        }
    }

    hide(): void {
        this._reqId++;
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        this.classList.remove('visible');
        if (this.shadowRoot) {
            const panel = this.shadowRoot.querySelector('.panel');
            if (panel) panel.innerHTML = '';
        }
    }
}

customElements.define('content-viewer', ContentViewer);
