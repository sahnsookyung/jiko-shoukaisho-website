import { IDS, getNeutralIntercept } from './config.js';
import { createGravityMap } from './gravityMap.js';
import { buildFilterMarkup } from './filterMarkup.js';

/**
 * Updates the references in the state object.
 * @param {Object} state - The control state.
 */
export const cacheRefs = (state) => {
    if (!state.refs.appContainer) {
        state.refs.appContainer = document.querySelector('.container');
    }
    if (!state.refs.filterContainer) {
        state.refs.filterContainer = document.getElementById(IDS.filterSvg);
    }
    if (state.refs.filterContainer) {
        state.refs.lensElement = state.refs.filterContainer.querySelector('feImage');
        state.refs.displacementMap = state.refs.filterContainer.querySelector(`#${IDS.displacement}`);
        state.refs.holeMatrix = state.refs.filterContainer.querySelector(`#${IDS.blackHole}`);
    }
};

/**
 * Creates and appends the SVG filter to the DOM if not present.
 * @param {Object} state - The control state.
 * @param {boolean} debug - Enable debug visualizations.
 */
export const ensureFilterInstalled = (state, debug = false) => {
    cacheRefs(state);

    let filterContainer = state.refs.filterContainer;

    if (!filterContainer) {
        const gradSize = 512;
        const gradientUrl = createGravityMap(gradSize);
        const neutralIntercept = getNeutralIntercept();

        const svgNS = "http://www.w3.org/2000/svg";
        filterContainer = document.createElementNS(svgNS, "svg");
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
 * @param {Object} state - The control state.
 */
export const applyFilterToApp = (state) => {
    cacheRefs(state);
    if (!state.refs.appContainer) return;

    state.refs.appContainer.style.filter = `url(#${IDS.filter})`;
    state.refs.appContainer.style.willChange = "filter";
};
