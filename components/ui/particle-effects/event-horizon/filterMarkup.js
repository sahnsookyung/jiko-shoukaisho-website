import { IDS } from './config.js';

/**
 * Constructs the SVG filter string.
 * We interpolate the calculated intercept to ensure perfect calibration.
 * 
 * @param {Object} params
 * @param {string} params.gradientUrl - Data URL of the gravity map.
 * @param {number} params.neutralIntercept - Calculated intercept for calibration.
 * @param {number} params.diameter - Size of the lens image.
 * @param {number} params.strength - Scale of the displacement.
 * @param {boolean} [params.debug] - Whether to include debug layers.
 * @returns {string} The innerHTML for the SVG.
 */
export const buildFilterMarkup = ({ gradientUrl, neutralIntercept, diameter, strength, debug }) => {
    // --- CONDITIONAL DEBUG STRINGS ---
    const debugDefinition = debug ? `
            <feColorMatrix in="calibratedMap" type="matrix" 
                        values="1 0 0 0 0  
                                0 1 0 0 0  
                                0 0 1 0 0  
                                0 0 0 0.8 0" result="debugLayer" />` : '';

    const debugMergeNode = debug ? `<feMergeNode in="debugLayer" />` : '';

    return `
            <defs>
                <filter id="${IDS.filter}" x="-50%" y="-50%" width="200%" height="200%" 
                        primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    
                    <!-- 1. BASE MAP SETUP -->
                    <!-- The Neutral Background fills the infinite space -->
                    <feFlood id="eh-neutral-background" flood-color="#808080" flood-opacity="1" result="neutralBackground" />
                    
                    <!-- The Lens Image (a rectangle with transparent corners: i.e. effectively a circle) -->
                    <feImage href="${gradientUrl}" result="lensImage" x="0" y="0" width="${diameter}" height="${diameter}" preserveAspectRatio="none" />
                    
                    <!-- Composite OVER: Transparent corners reveal the perfect neutral background -->
                    <feComposite in="lensImage" in2="neutralBackground" operator="over" result="mergedMap" />
                    
                    <!-- Gaussian blur for effect smoothening -->
                    <feGaussianBlur in="mergedMap" stdDeviation="3" result="smoothMap" />

                    <!-- 2. CALIBRATION (R=X, G=Y, B=HoleMask) -->
                    <!-- Note: Neutral Gray #808080 has B=128 (0.5). Our Hole has B=255 (1.0). Lens has B=0. -->
                    <feComponentTransfer in="smoothMap" result="calibratedMap">
                        <feFuncR type="linear" slope="1" intercept="${neutralIntercept}"/>
                        <feFuncG type="linear" slope="1" intercept="${neutralIntercept}"/>
                        <feFuncB type="linear" slope="1" intercept="${neutralIntercept}"/> 
                        <feFuncA type="linear" slope="0" intercept="1"/> 
                    </feComponentTransfer>

                    <!-- Neutral map for "disabled" state -->
                    <feComponentTransfer in="neutralBackground" result="neutralMap">
                        <feFuncR type="linear" slope="1" intercept="${neutralIntercept}"/>
                        <feFuncG type="linear" slope="1" intercept="${neutralIntercept}"/>
                        <feFuncB type="linear" slope="1" intercept="${neutralIntercept}"/> 
                        <feFuncA type="linear" slope="0" intercept="1"/> 
                    </feComponentTransfer>

                    <!-- 3. DISPLACEMENT (The Lensing Effect) -->
                    <feDisplacementMap id="${IDS.displacement}" in="SourceGraphic" in2="calibratedMap" 
                                    scale="${strength}" 
                                    xChannelSelector="R" yChannelSelector="G" 
                                    result="distortedContent" />

                    <!-- 4. BLACK HOLE CREATION -->
                    <!-- We threshold the Blue channel. If Blue > 0.6 (Hole), we make it Opaque Black. -->
                    <!-- Matrix logic: Alpha = 20*Blue - 12. -->
                    <!-- If B=0.5 (Background) -> 10 - 12 = -2 (Transparent) -->
                    <!-- If B=1.0 (Hole)       -> 20 - 12 = 8  (Opaque) -->
                    <feColorMatrix id="${IDS.blackHole}" in="calibratedMap" type="matrix"
                                values="0 0 0 0 0
                                        0 0 0 0 0
                                        0 0 0 0 0
                                        0 0 20 -12 0" result="blackHoleLayer" />

                    <!-- 5. DEBUG -->
                    ${debugDefinition}

                    <!-- 6. MERGE -->
                    <feMerge>
                        <feMergeNode in="distortedContent" />
                        <feMergeNode in="blackHoleLayer" />
                        ${debugMergeNode}
                    </feMerge>

                </filter>
            </defs>
    `;
};
