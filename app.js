import { getContentConfig } from './config/content-map.js';
import { inlineSVG } from './utils/svg-loader.js';

import './components/content-viewer.js';
import './components/tooltip-display.js';

class PortfolioApp {
    async init() {
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
