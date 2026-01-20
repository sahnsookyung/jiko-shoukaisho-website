import { getContentConfig, ContentConfig } from './config/content-map';
import { inlineSVG } from './utils/svg-loader';

import './components/content-viewer';
import './components/tooltip-display';

import { initWatermark } from './components/korean-words-bg/korean-words-bg';
import { initEventHorizon } from './components/ui/particle-effects/event-horizon/index';
import { createEffectControls } from './components/ui/effect-controls';

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

        this.overlays = document.querySelector('#interactive-overlays') as HTMLElement | null;

        this.overlays?.addEventListener('click', (e) => this.onClick(e));

        // Hover: use capture so we catch enters/leaves as the pointer moves between paths
        this.overlays?.addEventListener('mouseenter', (e) => this.onEnter(e), true);
        this.overlays?.addEventListener('mouseleave', (e) => this.onLeave(e), true);
        this.overlays?.addEventListener('mousemove', (e) => this.onMove(e));

        this.viewer.addEventListener('close-request', () => this.viewer?.hide());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.viewer?.isVisible()) this.viewer.hide();
        });

        this.addEffectControls();
    }

    private addEffectControls(): void {
        if (this.watermarkCtrl && this.horizonCtrl) {
            const controls = createEffectControls(this.watermarkCtrl, this.horizonCtrl);
            document.body.appendChild(controls);
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
        const group = el.closest('g[id]') as HTMLElement | null;
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

new PortfolioApp().init().catch((err) => {
    console.error('Portfolio initialization failed:', err);
});
