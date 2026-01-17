/**
 * ID constants for DOM elements used in the filter.
 */
export const IDS = {
    filterSvg: 'event-horizon-svg-container',
    filter: 'event-horizon-filter',
    displacement: 'eh-displacement',
    blackHole: 'eh-blackhole'
};

/**
 * Color matrix values to make the black hole opaque black.
 */
export const BLACK_HOLE_MATRIX_ENABLED =
    `0 0 0 0 0
     0 0 0 0 0
     0 0 0 0 0
     0 0 20 -12 0`;

/**
 * Color matrix values to make the black hole fully transparent.
 */
export const BLACK_HOLE_MATRIX_DISABLED =
    `0 0 0 0 0
     0 0 0 0 0
     0 0 0 0 0
     0 0 0 0 0`;

/**
 * Calculates the exact intercept needed to map Neutral Gray (128) to 0.5.
 * This prevents the displacement map from shifting pixels when no force is applied.
 * @returns {number} The calibration intercept.
 */
export const getNeutralIntercept = () => (0.5 - 128 / 255);

/**
 * Determines settings based on current viewport size.
 * @returns {{diameter: number, strength: number}} The calculated configuration.
 */
export const getConfig = () => {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    return {
        // The diameter affects the Schwarzschild radius as we use it in the feImage
        diameter: Math.max(150, minDim * 0.05),
        strength: Math.min(500, window.innerWidth * 0.05)
    };
};
