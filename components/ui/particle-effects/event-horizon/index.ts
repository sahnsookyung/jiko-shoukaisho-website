import { IDS, getConfig, BLACK_HOLE_MATRIX_ENABLED, BLACK_HOLE_MATRIX_DISABLED } from './config';
import { ensureFilterInstalled, applyFilterToApp, cacheRefs, EHState } from './dom';


export interface EHController {
    start(): void;
    stop(): void;
    setEnabled(enabled: boolean): void;
    isEnabled(): boolean;
}

/**
 * Initializes the Event Horizon effect (Black Hole Gravitational Lensing).
 * 
 * @param {boolean} debug - If true, displays the underlying displacement map for debugging.
 * @returns {EHController} Control methods.
 */
export function initEventHorizon(debug: boolean = false, autoStart = true): EHController {
    const STATE: EHState = {
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
    const setEffectEnabled = (enabled: boolean): void => {
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

    const bindInput = (): void => {
        cacheRefs(STATE);
        if (!STATE.refs.appContainer) return;

        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        STATE.resizeListener = () => {
            STATE.config = getConfig();
            // Update scale on resize only
            if (STATE.refs.displacementMap && STATE.config) {
                STATE.refs.displacementMap.setAttribute('scale', String(STATE.config.strength));
            }
            if (STATE.refs.lensElement && STATE.config) {
                STATE.refs.lensElement.setAttribute('width', String(STATE.config.diameter));
                STATE.refs.lensElement.setAttribute('height', String(STATE.config.diameter));
            }
        };
        globalThis.addEventListener('resize', STATE.resizeListener);

        STATE.mouseListener = (e: MouseEvent) => {
            let localX = e.clientX;
            let localY = e.clientY;
            if (STATE.refs.appContainer) {
                const rect = STATE.refs.appContainer.getBoundingClientRect();
                localX = e.clientX - rect.left;
                localY = e.clientY - rect.top;
            }
            if (STATE.config) {
                targetX = localX - (STATE.config.diameter / 2);
                targetY = localY - (STATE.config.diameter / 2);
            }
        };
        globalThis.addEventListener('mousemove', STATE.mouseListener);

        const animate = (): void => {
            currentX += (targetX - currentX) * 0.15;
            currentY += (targetY - currentY) * 0.15;
            if (STATE.refs.lensElement) {
                STATE.refs.lensElement.setAttribute('x', String(currentX));
                STATE.refs.lensElement.setAttribute('y', String(currentY));
            }
            STATE.animationId = requestAnimationFrame(animate);
        };
        STATE.animationId = requestAnimationFrame(animate);
    };

    const unbindInput = (): void => {
        if (STATE.animationId) {
            cancelAnimationFrame(STATE.animationId);
            STATE.animationId = null;
        }
        if (STATE.resizeListener) {
            globalThis.removeEventListener('resize', STATE.resizeListener);
            STATE.resizeListener = null;
        }
        if (STATE.mouseListener) {
            globalThis.removeEventListener('mousemove', STATE.mouseListener);
            STATE.mouseListener = null;
        }
    };

    const start = (): void => {
        stop();
        // Safari check moved to init call site
        STATE.config = getConfig();
        ensureFilterInstalled(STATE, debug);
        applyFilterToApp(STATE);
        setEffectEnabled(true);
        bindInput();
    };

    const stop = (): void => {
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
    };

    if (autoStart) {
        start();
    }

    return {
        start,
        stop,
        setEnabled: setEffectEnabled,
        isEnabled: () => STATE.effectEnabled
    };
}
