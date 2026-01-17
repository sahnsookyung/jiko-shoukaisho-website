export function initEventHorizon(debug = false) {
    // --- DYNAMIC CONFIGURATION ---
    const getConfig = () => {
        const minDim = Math.min(window.innerWidth, window.innerHeight);
        return {
            radius: Math.max(110, minDim * 0.05),
            strength: Math.min(500, window.innerWidth * 0.05)
        };
    };

    let config = getConfig();
    const gradSize = 512;

    // --- PHYSICS GENERATOR: SCHWARZSCHILD LENSING + HOLE MASK ---
    const createGravityMap = (size) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;
        const center = size / 2;
        const mass = 30;

        // Schwarzschild Radius (The Black Hole Size)
        const rs = size * 0.05; // This should actually be R_s = 2GM/c^2 but we not gonna see anything so we just break the laws.

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;

                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let red = 128;
                let green = 128;
                let blue = 0; // Blue channel reserves the "Hole Mask"

                if (dist < rs) {
                    // --- INSIDE HORIZON ---
                    // No displacement (keep neutral to avoid tearing)
                    // Mark as HOLE (Blue = 255)
                    red = 128;
                    green = 128;
                    blue = 255;
                } else if (dist < center) {
                    // --- GRAVITY LENSING ---
                    // Force = 1/r (Schwarzschild-like)
                    const relDist = dist - rs;
                    let force = mass / Math.max(1, relDist);

                    // Smooth edges
                    const edgeFade = Math.pow(1 - (dist / center), 0.5);
                    force *= edgeFade;
                    force = Math.min(force, 3.0); // Cap force

                    const dirX = dx / dist;
                    const dirY = dy / dist;

                    red = 128 - (dirX * force * 127);
                    green = 128 - (dirY * force * 127);
                    blue = 0; // Not a hole
                }

                data[i] = red;
                data[i + 1] = green;
                data[i + 2] = blue;
                data[i + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL();
    };

    const gradientUrl = createGravityMap(gradSize);

    const svgNS = "http://www.w3.org/2000/svg";
    const filterContainer = document.createElementNS(svgNS, "svg");

    filterContainer.style.position = "absolute";
    filterContainer.style.width = "0";
    filterContainer.style.height = "0";
    filterContainer.style.zIndex = "-1";

    // --- CONDITIONAL DEBUG STRINGS ---
    // 1. Define the Debug Layer (Must be OUTSIDE feMerge)
    const debugDefinition = debug ? `
        <feColorMatrix in="calibratedMap" type="matrix" 
                       values="1 0 0 0 0  
                               0 1 0 0 0  
                               0 0 1 0 0  
                               0 0 0 0.8 0" result="debugLayer" />` : '';

    // 2. Merge the Debug Layer (Must be INSIDE feMerge)
    const debugMergeNode = debug ? `<feMergeNode in="debugLayer" />` : '';

    filterContainer.innerHTML = `
        <defs>
            <filter id="event-horizon-filter" x="-50%" y="-50%" width="200%" height="200%" 
                    primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                
                <!-- 1. BASE MAP SETUP -->
                <feFlood flood-color="#808080" flood-opacity="1" result="neutralBackground" />
                <feImage href="${gradientUrl}" result="lensImage" x="0" y="0" width="${config.radius}" height="${config.radius}" preserveAspectRatio="none" />
                <feComposite in="lensImage" in2="neutralBackground" operator="over" result="mergedMap" />
                <feGaussianBlur in="mergedMap" stdDeviation="3" result="smoothMap" />

                <!-- 2. CALIBRATION (R=X, G=Y, B=HoleMask) -->
                <!-- Note: Neutral Gray #808080 has B=128 (0.5). Our Hole has B=255 (1.0). Lens has B=0. -->
                <feComponentTransfer in="smoothMap" result="calibratedMap">
                    <feFuncR type="linear" slope="1" intercept="-0.00196"/>
                    <feFuncG type="linear" slope="1" intercept="-0.00196"/>
                    <feFuncB type="linear" slope="1" intercept="-0.00196"/> <!-- Keep Blue intact -->
                    <feFuncA type="linear" slope="0" intercept="1"/> 
                </feComponentTransfer>

                <!-- 3. DISPLACEMENT (The Lensing Effect) -->
                <feDisplacementMap in="SourceGraphic" in2="calibratedMap" 
                                   scale="${config.strength}" 
                                   xChannelSelector="R" yChannelSelector="G" 
                                   result="distortedContent" />

                <!-- 4. BLACK HOLE CREATION -->
                <!-- We threshold the Blue channel. If Blue > 0.6 (Hole), we make it Opaque Black. -->
                <!-- Matrix logic: Alpha = 20*Blue - 12. -->
                <!-- If B=0.5 (Background) -> 10 - 12 = -2 (Transparent) -->
                <!-- If B=1.0 (Hole)       -> 20 - 12 = 8  (Opaque) -->
                <feColorMatrix in="calibratedMap" type="matrix"
                               values="0 0 0 0 0
                                       0 0 0 0 0
                                       0 0 0 0 0
                                       0 0 20 -12 0" result="blackHoleLayer" />

                <!-- 5. OPTIONAL DEBUG DEFINITION -->
                ${debugDefinition}

                <!-- 6. FINAL MERGE -->
                <feMerge>
                    <feMergeNode in="distortedContent" />
                    <feMergeNode in="blackHoleLayer" />
                    ${debugMergeNode}
                </feMerge>

            </filter>
        </defs>
    `;
    document.body.appendChild(filterContainer);

    const appContainer = document.querySelector('.container');
    if (appContainer) {
        appContainer.style.filter = "url(#event-horizon-filter)";
        appContainer.style.willChange = "filter";
    }

    const lensElement = filterContainer.querySelector('feImage');
    const displacementMap = filterContainer.querySelector('feDisplacementMap');

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    function handleResize() {
        config = getConfig();
        if (displacementMap) displacementMap.setAttribute('scale', config.strength);
        if (lensElement) {
            lensElement.setAttribute('width', config.radius);
            lensElement.setAttribute('height', config.radius);
        }
    }
    window.addEventListener('resize', handleResize);

    window.addEventListener('mousemove', (e) => {
        let localX = e.clientX;
        let localY = e.clientY;

        if (appContainer) {
            const rect = appContainer.getBoundingClientRect();
            localX = e.clientX - rect.left;
            localY = e.clientY - rect.top;
        }

        targetX = localX - (config.radius / 2);
        targetY = localY - (config.radius / 2);
    });

    function animate() {
        currentX += (targetX - currentX) * 0.15;
        currentY += (targetY - currentY) * 0.15;

        if (lensElement) {
            lensElement.setAttribute('x', currentX);
            lensElement.setAttribute('y', currentY);
        }
        requestAnimationFrame(animate);
    }
    animate();
}
