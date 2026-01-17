export function initEventHorizon(debug = false) {
    // --- DYNAMIC CONFIGURATION ---
    const getConfig = () => {
        const minDim = Math.min(window.innerWidth, window.innerHeight);
        return {
            radius: Math.max(15, minDim * 0.05), // Size of the event horizon
            strength: Math.min(500, window.innerWidth * 0.05) // Strength of the gravity
        };
    };

    let config = getConfig();
    const gradSize = 512;

    // --- PHYSICS GENERATOR: GRAVITY MAP ---
    // Instead of a simple gradient, we generate a vector field.
    // Red channel   = X-force (0=Left, 255=Right, 128=Neutral)
    // Green channel = Y-force (0=Up, 255=Down, 128=Neutral)
    const createGravityMap = (size) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;
        const center = size / 2;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;

                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = center;

                let red = 128;   // Neutral Gray
                let green = 128; // Neutral Gray

                // Only apply gravity within the radius
                if (dist < maxDist && dist > 0) {
                    // --- THE EVENT HORIZON EQUATION ---
                    // We want a "Lensing" effect: Pushing background OUTWARD.
                    // This creates the illusion that space is bending around the center.

                    // Force Profile: Stronger near center, fades to edge.
                    // Using quadratic falloff for smooth "gravity well" look.
                    const force = Math.pow(1 - (dist / maxDist), 2);

                    // Normalized Direction (-1 to 1)
                    const dirX = dx / dist;
                    const dirY = dy / dist;

                    // Apply Vector Force
                    // To push Right (positive dx), we need to fetch from Left.
                    // feDisplacementMap Logic:
                    // scale * (Color - 0.5) = Displacement
                    // To fetch Left (negative shift), Color must be < 128.
                    // So for Right side (dirX > 0), we want Red < 128.
                    red = 128 - (dirX * force * 127);
                    green = 128 - (dirY * force * 127);
                }

                data[i] = red;
                data[i + 1] = green;
                data[i + 2] = 128; // Blue (unused)
                data[i + 3] = 255; // Alpha (Opaque)
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

    // Build filter with conditional debug overlay
    const debugOverlay = debug ? `
                <!-- DEBUG OVERLAY: Visualize the gravity well -->
                <feColorMatrix in="calibratedMap" type="matrix" 
                               values="1 0 0 0 0
                                       0 1 0 0 0
                                       0 0 1 0 0
                                       0 0 0 0.2 0" result="semiTransparentMap" />
                <feMerge>
                    <feMergeNode in="distortedContent" />
                    <feMergeNode in="semiTransparentMap" />
                </feMerge>` : '';

    filterContainer.innerHTML = `
        <defs>
            <filter id="event-horizon-filter" x="-50%" y="-50%" width="200%" height="200%" 
                    primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                
                <!-- 1. Flood Neutral Gray (Zero Gravity Base) -->
                <feFlood flood-color="#808080" flood-opacity="1" result="neutralBackground" />

                <!-- 2. Lens Image (The Gravity Well) -->
                <feImage href="${gradientUrl}" result="lensImage" x="0" y="0" width="${config.radius}" height="${config.radius}" preserveAspectRatio="none" />

                <!-- 3. Composite (Place lens on neutral background) -->
                <feComposite in="lensImage" in2="neutralBackground" operator="over" result="mergedMap" />

                <!-- 4. Smooth (Removes pixelation from the map) -->
                <feGaussianBlur in="mergedMap" stdDeviation="2" result="smoothMap" />

                <!-- 5. Calibration (-0.002 bias fix for #808080 to be exactly 0 shift) -->
                <feComponentTransfer in="smoothMap" result="calibratedMap">
                    <feFuncR type="linear" slope="1" intercept="-0.0019607843"/>
                    <feFuncG type="linear" slope="1" intercept="-0.0019607843"/>
                    <feFuncA type="linear" slope="0" intercept="1"/> 
                </feComponentTransfer>

                <!-- 6. Displace -->
                <feDisplacementMap class="displacement-map" in="SourceGraphic" in2="calibratedMap" 
                                   scale="${config.strength}" 
                                   xChannelSelector="R" yChannelSelector="G" 
                                   result="distortedContent" />
                ${debugOverlay}
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
    const displacementMap = filterContainer.querySelector('.displacement-map');

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

    // --- MOUSE TRACKING ---
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
