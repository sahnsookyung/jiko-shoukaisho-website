import { IDS } from './config';

interface FilterMarkupParams {
    gradientUrl: string;
    neutralIntercept: number;
    diameter: number;
    strength: number;
    debug?: boolean;
}

/**
 * Validates and sanitizes a URL for use in SVG attributes.
 * Allows only data:, same-origin, or http(s) URLs.
 */
function validateUrl(url: string): string {
    const trimmed = url.trim();
    // Allow data: URLs (used by createGravityMap via canvas.toDataURL)
    // Allow same-origin relative paths (e.g. /assets/...)
    // Allow http: or https:
    if (/^(data:image\/[^;]+;base64,|data:image\/svg\+xml;|\/|https?:\/\/)/i.test(trimmed)) {
        return trimmed;
    }
    console.warn('Blocked potentially unsafe URL:', trimmed);
    return 'about:blank';
}

/**
 * Constructs the SVG filter string.
 * We interpolate the calculated intercept to ensure perfect calibration.
 * 
 * @param {FilterMarkupParams} params
 * @returns {string} The innerHTML for the SVG.
 */
export const buildFilterMarkup = ({ gradientUrl, neutralIntercept, diameter, strength, debug }: FilterMarkupParams): string => {
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
                    <!-- Note: gradientUrl is generated internally via canvas.toDataURL() in gravityMap.ts -->
                    <feImage href="${validateUrl(gradientUrl)}" result="lensImage" x="0" y="0" width="${diameter}" height="${diameter}" preserveAspectRatio="none" />
                    
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
