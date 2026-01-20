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
        filterContainer: HTMLElement | null;
        lensElement: SVGFEImageElement | null;
        displacementMap: SVGElement | null;
        holeMatrix: SVGElement | null;
    };
}

/**
 * Updates the references in the state object.
 * @param {EHState} state - The control state.
 */
export const cacheRefs = (state: EHState): void => {
    state.refs.appContainer ??= document.querySelector('.container');
    state.refs.filterContainer ??= document.getElementById(IDS.filterSvg);
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
        filterContainer = document.createElementNS(svgNS, "svg") as unknown as HTMLElement;
        filterContainer.id = IDS.filterSvg;

        filterContainer.style.position = "absolute";
        filterContainer.style.width = "0";
        filterContainer.style.height = "0";
        filterContainer.style.zIndex = "-1";

        filterContainer.innerHTML = buildFilterMarkup({
            gradientUrl,
            neutralIntercept,
            diameter: state.config.diameter,
            strength: state.config.strength,
            debug
        });
        document.body.appendChild(filterContainer);

        state.refs.filterContainer = filterContainer;
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
