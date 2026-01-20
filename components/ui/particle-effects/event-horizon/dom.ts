import { IDS, getNeutralIntercept, EHConfig } from './config';
import { createGravityMap } from './gravityMap';
import { buildFilterMarkup } from './filterMarkup';

export interface EHState {
    animationId: number | null;
    resizeListener: (() => void) | null;
    mouseListener: ((e: MouseEvent) => void) | null;
    config: EHConfig | null;
    effectEnabled: boolean;
    refs: {
        appContainer: HTMLElement | null;
        filterContainer: SVGSVGElement | null;
        lensElement: SVGFEImageElement | null;
        displacementMap: SVGFEDisplacementMapElement | null;
        holeMatrix: SVGFEColorMatrixElement | null;
    };
}

/**
 * Updates the references in the state object.
 * @param {EHState} state - The control state.
 */
export const cacheRefs = (state: EHState): void => {
    state.refs.appContainer ??= document.querySelector('.container');

    if (!state.refs.filterContainer) {
        const el = document.getElementById(IDS.filterSvg);
        if (el instanceof SVGSVGElement) {
            state.refs.filterContainer = el;
        }
    }

    if (state.refs.filterContainer) {
        state.refs.lensElement = state.refs.filterContainer.querySelector('feImage');
        state.refs.displacementMap = state.refs.filterContainer.querySelector(`#${IDS.displacement}`);
        state.refs.holeMatrix = state.refs.filterContainer.querySelector(`#${IDS.blackHole}`);
    }
};

/**
 * Creates and appends the SVG filter to the DOM if not present.
 * @param {EHState} state - The control state.
 * @param {boolean} debug - Enable debug visualizations.
 */
export const ensureFilterInstalled = (state: EHState, debug: boolean = false): void => {
    cacheRefs(state);

    let filterContainer = state.refs.filterContainer;

    if (!filterContainer && state.config) {
        const gradSize = 512;
        const gradientUrl = createGravityMap(gradSize);
        const neutralIntercept = getNeutralIntercept();

        const svgNS = "http://www.w3.org/2000/svg";
        const svgEl = document.createElementNS(svgNS, "svg");
        svgEl.id = IDS.filterSvg;

        svgEl.style.position = "absolute";
        svgEl.style.width = "0";
        svgEl.style.height = "0";
        svgEl.style.zIndex = "-1";

        svgEl.innerHTML = buildFilterMarkup({
            gradientUrl,
            neutralIntercept,
            diameter: state.config.diameter,
            strength: state.config.strength,
            debug
        });
        document.body.appendChild(svgEl);

        state.refs.filterContainer = svgEl;
    }

    cacheRefs(state);
};

/**
 * Applies the SVG filter to the main application container.
 * @param {EHState} state - The control state.
 */
export const applyFilterToApp = (state: EHState): void => {
    cacheRefs(state);
    if (!state.refs.appContainer) return;

    state.refs.appContainer.style.filter = `url(#${IDS.filter})`;
    state.refs.appContainer.style.willChange = "filter";
};
