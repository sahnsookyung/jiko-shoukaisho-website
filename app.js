import { getContentConfig } from './config/content-map.js';
import { inlineSVG } from './utils/svg-loader.js';

import './components/content-viewer.js';
import './components/tooltip-display.js';

import { initWatermark } from './components/korean-words-bg/korean-words-bg.js';
import { initEventHorizon } from './components/ui/particle-effects/event-horizon/index.js';

class PortfolioApp {
    async init() {
        this.watermarkCtrl = initWatermark();
        this.horizonCtrl = initEventHorizon(); // mouse pointer effect

        await inlineSVG();

        this.viewer = document.createElement('content-viewer');
        document.body.appendChild(this.viewer);

        this.tooltip = document.createElement('tooltip-display');
        document.body.appendChild(this.tooltip);

        this.overlays = document.querySelector('#interactive-overlays');

        this.overlays?.addEventListener('click', (e) => this.onClick(e));

        // Hover: use capture so we catch enters/leaves as the pointer moves between paths
        this.overlays?.addEventListener('mouseenter', (e) => this.onEnter(e), true);
        this.overlays?.addEventListener('mouseleave', (e) => this.onLeave(e), true);
        this.overlays?.addEventListener('mousemove', (e) => this.onMove(e));

        this.viewer.addEventListener('close-request', () => this.viewer.hide());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.viewer.isVisible()) this.viewer.hide();
        });

        this.addEffectControls();
    }

    addEffectControls() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed; top: 50%; left: 20px; transform: translateY(-50%);
            display: flex; flex-direction: column; gap: 10px; z-index: 9999;
            font-family: sans-serif;
        `;

        const createToggle = (symbol, label, onClick, initialState = true) => {
            const btn = document.createElement('div');
            btn.innerHTML = symbol;
            btn.title = label;
            btn.style.cssText = `
                font-size: 24px; cursor: pointer; user-select: none;
                opacity: ${initialState ? '0.9' : '0.3'};
                transition: opacity 0.3s; color: #4a3b2a;
            `;
            let active = initialState;
            btn.addEventListener('click', () => {
                active = !active;
                btn.style.opacity = active ? '0.9' : '0.3';
                onClick(active);
            });
            return btn;
        };

        const toggleWatermark = createToggle('㉿', 'Toggle Korean background effect (on, off)', (active) => {
            active ? this.watermarkCtrl?.start() : this.watermarkCtrl?.stop();
        });

        const toggleEventHorizon = createToggle('⦵', 'Toggle event horizon effect (on, off)', (active) => {
            active ? this.horizonCtrl?.start() : this.horizonCtrl?.stop();
        });

        container.appendChild(toggleWatermark);
        container.appendChild(toggleEventHorizon);
        document.body.appendChild(container);
    }

    resolveConfigFromEventTarget(target) {
        if (!target) return null;

        // 1) Try direct id
        if (target.id) {
            const direct = getContentConfig(target.id);
            if (direct) return direct;
        }

        // 2) Try nearest parent group with id
        const group = target.closest('g[id]');
        if (group?.id) {
            const fromGroup = getContentConfig(group.id);
            if (fromGroup) return fromGroup;
        }

        return null;
    }

    onClick(e) {
        const target = e.target;
        // Walk up slightly to find path if clicked on nested element (though paths usually don't have children)
        const cfg = this.resolveConfigFromEventTarget(target);
        if (!cfg) return;

        this.tooltip.hide();
        this.viewer.show(cfg);
    }

    onEnter(e) {
        const target = e.target;
        const cfg = this.resolveConfigFromEventTarget(target);
        if (!cfg) return;

        this.tooltip.show(cfg, e);
    }

    onLeave(e) {
        // Hide if leaving interactive region entirely
        const related = e.relatedTarget;

        // Check if we moved to another interactive element or completely out
        const stillOverInteractive = !!this.resolveConfigFromEventTarget(related);

        // If we moved to something that isn't interactive, hide tooltip
        if (!stillOverInteractive) this.tooltip.hide();
    }

    onMove(e) {
        this.tooltip.updatePosition(e);
    }
}

new PortfolioApp().init();
