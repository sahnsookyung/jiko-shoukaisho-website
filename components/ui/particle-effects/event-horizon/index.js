import { IDS, getConfig, BLACK_HOLE_MATRIX_ENABLED, BLACK_HOLE_MATRIX_DISABLED } from './config.js';
import { ensureFilterInstalled, applyFilterToApp, cacheRefs } from './dom.js';

/**
 * Initializes the Event Horizon effect (Black Hole Gravitational Lensing).
 * 
 * @param {boolean} debug - If true, displays the underlying displacement map for debugging.
 * @returns {{start: Function, stop: Function, setEnabled: Function, isEnabled: Function}} Control methods.
 */
export function initEventHorizon(debug = false) {
    const STATE = {
        animationId: null,
        resizeListener: null,
        mouseListener: null,
        config: null,
        effectEnabled: true,
        refs: {
            appContainer: null,
            filterContainer: null,
            lensElement: null,
            displacementMap: null,
            holeMatrix: null
        }
    };

    /**
     * Toggles the visual effect without removing the filter from the DOM.
     * This prevents layout shifts by swapping the input map to a neutral one.
     * 
     * @param {boolean} enabled 
     */
    const setEffectEnabled = (enabled) => {
        STATE.effectEnabled = enabled;
        cacheRefs(STATE);

        if (!STATE.refs.filterContainer) return;

        // SWAP LOGIC: calibratedMap vs neutralMap
        if (STATE.refs.displacementMap) {
            STATE.refs.displacementMap.setAttribute('in2', enabled ? 'calibratedMap' : 'neutralMap');
        }

        if (STATE.refs.holeMatrix) {
            STATE.refs.holeMatrix.setAttribute('values', enabled ? BLACK_HOLE_MATRIX_ENABLED : BLACK_HOLE_MATRIX_DISABLED);
        }
    };

    const bindInput = () => {
        cacheRefs(STATE);
        if (!STATE.refs.appContainer) return;

        const lensElement = STATE.refs.lensElement;
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        STATE.resizeListener = () => {
            STATE.config = getConfig();
            // Update scale on resize only
            if (STATE.refs.displacementMap) {
                STATE.refs.displacementMap.setAttribute('scale', STATE.config.strength);
            }
            if (lensElement) {
                lensElement.setAttribute('width', STATE.config.diameter);
                lensElement.setAttribute('height', STATE.config.diameter);
            }
        };
        window.addEventListener('resize', STATE.resizeListener);

        STATE.mouseListener = (e) => {
            let localX = e.clientX;
            let localY = e.clientY;
            if (STATE.refs.appContainer) {
                const rect = STATE.refs.appContainer.getBoundingClientRect();
                localX = e.clientX - rect.left;
                localY = e.clientY - rect.top;
            }
            targetX = localX - (STATE.config.diameter / 2);
            targetY = localY - (STATE.config.diameter / 2);
        };
        window.addEventListener('mousemove', STATE.mouseListener);

        const animate = () => {
            currentX += (targetX - currentX) * 0.15;
            currentY += (targetY - currentY) * 0.15;
            if (lensElement) {
                lensElement.setAttribute('x', currentX);
                lensElement.setAttribute('y', currentY);
            }
            STATE.animationId = requestAnimationFrame(animate);
        };
        STATE.animationId = requestAnimationFrame(animate);
    };

    const unbindInput = () => {
        if (STATE.animationId) {
            cancelAnimationFrame(STATE.animationId);
            STATE.animationId = null;
        }
        if (STATE.resizeListener) {
            window.removeEventListener('resize', STATE.resizeListener);
            STATE.resizeListener = null;
        }
        if (STATE.mouseListener) {
            window.removeEventListener('mousemove', STATE.mouseListener);
            STATE.mouseListener = null;
        }
    };

    const start = () => {
        stop();
        STATE.config = getConfig();
        ensureFilterInstalled(STATE, debug);
        applyFilterToApp(STATE);
        setEffectEnabled(true);
        bindInput();
    };

    const stop = () => {
        unbindInput();
        const filterContainer = document.getElementById(IDS.filterSvg);
        if (filterContainer) {
            const displacementMap = filterContainer.querySelector(`#${IDS.displacement}`);
            if (displacementMap) {
                displacementMap.setAttribute('in2', 'neutralMap');
            }
            const holeMatrix = filterContainer.querySelector(`#${IDS.blackHole}`);
            if (holeMatrix) {
                holeMatrix.setAttribute('values', BLACK_HOLE_MATRIX_DISABLED);
            }
        }
        // Note: We leave the filter SVG in the DOM and the filter property on appContainer
        // to avoid "jumping" when re-enabling.
    };

    start();

    return {
        start,
        stop,
        setEnabled: setEffectEnabled,
        isEnabled: () => STATE.effectEnabled
    };
}
