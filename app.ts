import { getContentConfig, ContentConfig } from './config/content-map';
import { inlineSVG } from './utils/svg-loader';

import './components/content-viewer';
import './components/tooltip-display';

import { initWatermark } from './components/korean-words-bg/korean-words-bg';
import { initEventHorizon } from './components/ui/particle-effects/event-horizon/index';
import { createEffectControls } from './components/ui/effect-controls';
import './components/ui/social-links';

interface EffectController {
    start(): void;
    stop(): void;
    setEnabled?: (enabled: boolean) => void;
    isEnabled?: () => boolean;
}

interface ContentViewerElement extends HTMLElement {
    show(cfg: ContentConfig): Promise<void>;
    hide(): void;
    isVisible(): boolean;
}

interface TooltipDisplayElement extends HTMLElement {
    show(cfg: ContentConfig, e: MouseEvent): void;
    hide(): void;
    updatePosition(e: MouseEvent): void;
}

class PortfolioApp {
    private watermarkCtrl?: EffectController;
    private horizonCtrl?: EffectController;
    private viewer?: ContentViewerElement;
    private tooltip?: TooltipDisplayElement;
    private overlays: HTMLElement | null = null;

    async init(): Promise<void> {
        this.watermarkCtrl = initWatermark();
        this.horizonCtrl = initEventHorizon(); // mouse pointer effect

        await inlineSVG();

        this.viewer = document.createElement('content-viewer') as ContentViewerElement;
        document.body.appendChild(this.viewer);

        this.tooltip = document.createElement('tooltip-display') as TooltipDisplayElement;
        document.body.appendChild(this.tooltip);

        const style = document.createElement('style');
        style.textContent = `
            #sidebar-controls {
                position: fixed;
                left: clamp(10px, 2vw, 20px);
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                gap: clamp(10px, 3vmin, 30px);
                z-index: 100;
                pointer-events: none;
                padding: 10px 5px;
                border-radius: 12px;
                transition: all 0.3s ease;
            }

            @media (max-width: 768px) {
                #sidebar-controls {
                    top: 15px;
                    transform: none;
                    flex-direction: row;
                    align-items: center;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(15, 15, 15, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.15);
                    padding: 6px 15px;
                    gap: 20px;
                    border-radius: 20px;
                }
            }
        `;
        document.head.appendChild(style);

        const sidebarControls = document.createElement('div');
        sidebarControls.id = 'sidebar-controls';

        const socialLinks = document.createElement('social-links-fixed');
        socialLinks.style.pointerEvents = 'auto';
        sidebarControls.appendChild(socialLinks);

        this.addEffectControls(sidebarControls);
        document.body.appendChild(sidebarControls);

        // Handle responsive attributes for custom components
        const mql = globalThis.matchMedia('(max-width: 768px)');
        const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
            const layout = e.matches ? 'horizontal' : 'vertical';
            socialLinks.setAttribute('layout', layout);
            const controls = sidebarControls.querySelector('div'); // effect-controls container
            if (controls) controls.setAttribute('layout', layout);
        };
        mql.addEventListener('change', handleResize);
        handleResize(mql);

        this.overlays = document.getElementById('interactive-overlays');

        this.overlays?.addEventListener('click', (e) => this.onClick(e));

        // Hover: use capture so we catch enters/leaves as the pointer moves between paths
        this.overlays?.addEventListener('mouseenter', (e) => this.onEnter(e), true);
        this.overlays?.addEventListener('mouseleave', (e) => this.onLeave(e), true);
        this.overlays?.addEventListener('mousemove', (e) => this.onMove(e));

        this.viewer?.addEventListener('close-request', () => this.viewer?.hide());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.viewer?.isVisible()) this.viewer.hide();
        });


    }

    private addEffectControls(container: HTMLElement): void {
        if (this.watermarkCtrl && this.horizonCtrl) {
            const controls = createEffectControls(this.watermarkCtrl, this.horizonCtrl);
            controls.style.pointerEvents = 'auto'; // Re-enable pointer events for controls
            container.appendChild(controls);
        }
    }

    private resolveConfigFromEventTarget(target: EventTarget | null): ContentConfig | null {
        if (!target) return null;
        const el = target as HTMLElement;

        // 1) Try direct id
        if (el.id) {
            const direct = getContentConfig(el.id);
            if (direct) return direct;
        }

        // 2) Try nearest parent group with id
        const group = el.closest('g[id]') as HTMLElement;
        if (group?.id) {
            const fromGroup = getContentConfig(group.id);
            if (fromGroup) return fromGroup;
        }

        return null;
    }

    private onClick(e: MouseEvent): void {
        const target = e.target;
        const cfg = this.resolveConfigFromEventTarget(target);
        if (!cfg) return;

        this.tooltip?.hide();
        this.viewer?.show(cfg);
    }

    private onEnter(e: MouseEvent): void {
        const target = e.target;
        const cfg = this.resolveConfigFromEventTarget(target);
        if (!cfg) return;

        this.tooltip?.show(cfg, e);
    }

    private onLeave(e: MouseEvent): void {
        const related = e.relatedTarget;

        // Check if we moved to another interactive element or completely out
        const stillOverInteractive = !!this.resolveConfigFromEventTarget(related);

        // If we moved to something that isn't interactive, hide tooltip
        if (!stillOverInteractive) this.tooltip?.hide();
    }

    private onMove(e: MouseEvent): void {
        this.tooltip?.updatePosition(e);
    }
}

(async () => {
    try {
        await new PortfolioApp().init();
    } catch (err) {
        console.error('Portfolio initialization failed:', err);
    }
})();
