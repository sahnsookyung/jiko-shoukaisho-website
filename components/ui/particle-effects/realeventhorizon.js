import * as THREE from 'three';

export function initParticles() {
    // --- CONFIGURATION ---
    const CONFIG = {
        particleCount: 10,
        spawnRadius: 0.15,
        killRadius: 0.02,
        spawnRate: 15,
        gravityStrength: 5,
        swirlStrength: 0.1,
        color: 0x00ffff
    };

    // =========================================================
    // 1. THE EVENT HORIZON DISTORTION (Dynamic SVG Filter)
    // =========================================================

    // We inject an SVG filter that uses a PointLight to create a localized "bump" map.
    // The DisplacementMap then uses this lighting map to warp the source graphic.
    const svgNS = "http://www.w3.org/2000/svg";
    const filterContainer = document.createElementNS(svgNS, "svg");
    filterContainer.style.position = "absolute";
    filterContainer.style.width = "0";
    filterContainer.style.height = "0";
    filterContainer.style.zIndex = "-1";

    filterContainer.innerHTML = `
        <defs>
            <filter id="event-horizon-filter" color-interpolation-filters="sRGB">
                
                <!-- 1. LIGHTING MAP (The Gravity Well) -->
                <!-- surfaceScale="200": Makes the 'cone' of gravity very deep/steep -->
                <!-- diffuseConstant="1.5": Boosts the intensity so the distortion is visible -->
                <feDiffuseLighting in="SourceGraphic" lighting-color="white" 
                                   surfaceScale="200" diffuseConstant="1.5" 
                                   result="lightMap">
                    <!-- z="30": Moving light closer to surface makes the falloff sharper (1/r style) -->
                    <fePointLight id="horizon-light" x="0" y="0" z="30" />
                </feDiffuseLighting>

                <!-- 2. DISPLACEMENT (The Swirl/Bulge) -->
                <!-- scale="80": Strength of the warp -->
                <!-- We read the luminance (R+G+B) via 'R' channel to decide how much to shift -->
                <feDisplacementMap in="SourceGraphic" in2="lightMap" 
                                   scale="80" xChannelSelector="R" yChannelSelector="G" />
            </filter>
        </defs>
    `;


    document.body.appendChild(filterContainer);

    // Apply this filter to your main content container
    const appContainer = document.querySelector('.container');
    if (appContainer) {
        // We use a style string to ensure it applies
        appContainer.style.filter = "url(#event-horizon-filter)";
        // Optional: Ensure it uses hardware acceleration to prevent lag
        appContainer.style.willChange = "filter";
    }

    // =========================================================
    // 2. THREE.JS PARTICLE SYSTEM (The Matter)
    // =========================================================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Setup Canvas: Fixed, Topmost, Click-through
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '9999';
    renderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(renderer.domElement);

    // Visual Singularity (Black Hole Center)
    // The Visual Shadow (Photon Capture Radius)
    // 2.6 * Rs is the approximate size of the black hole shadow
    // We adjust the multiplier '200' to match your scale 
    // If Rs=0.02 * 200 = 4.0 units visual radius. 
    // Let's make the visual shadow noticeably larger than the kill point.
    const holeGeo = new THREE.CircleGeometry(CONFIG.killRadius * 20, 32); // 2.6 * 200 = 520
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const singularity = new THREE.Mesh(holeGeo, holeMat);
    scene.add(singularity);

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(CONFIG.particleCount * 3);
    const pLifes = new Float32Array(CONFIG.particleCount); // 0=dead, 1=alive

    // Init off-screen
    for (let i = 0; i < CONFIG.particleCount; i++) {
        pPos[i * 3] = 999; pLifes[i] = 0;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
        color: CONFIG.color,
        size: 0.1,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);

    // =========================================================
    // 3. ANIMATION LOOP
    // =========================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(999, 999);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const targetPos = new THREE.Vector3();

    // Reference to the SVG light element we need to move
    const lightSource = document.getElementById('horizon-light');

    window.addEventListener('mousemove', (e) => {
        // 1. Update Three.js Mouse (Standard Normalized: -1 to +1)
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // 2. Update Event Horizon Distortion (Pixel Coordinates)
        if (lightSource) {
            // Get the bounding box of the element the filter is applied to
            // This ensures we calculate 'x' and 'y' relative to that element
            const container = document.querySelector('.container');
            const rect = container.getBoundingClientRect();

            // Calculate mouse position RELATIVE to the container
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;

            lightSource.setAttribute('x', localX);
            lightSource.setAttribute('y', localY);
        }
    });

    function animate() {
        requestAnimationFrame(animate);

        // Update Physics Target (3D World Space)
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, targetPos);

        // Move Singularity Mesh
        singularity.position.copy(targetPos);

        // Particle Physics
        const pos = pGeo.attributes.position.array;
        let spawned = 0;

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const i3 = i * 3;

            // Check if particle is "Dead" (0) or "Alive" (1)
            if (pLifes[i] === 0) {
                // ... Spawn logic (Keep as is) ...
                if (spawned < CONFIG.spawnRate) {
                    // ...
                }
            } else {
                // === UPDATE GOES HERE (The "Alive" Block) ===

                const dx = targetPos.x - pos[i3];
                const dy = targetPos.y - pos[i3 + 1];

                // Calculate distance
                const d = Math.sqrt(dx * dx + dy * dy);

                // 1. CHECK KILL RADIUS (Event Horizon)
                // This is where we ensure they vanish at the correct physical point
                if (d < CONFIG.killRadius) {
                    pLifes[i] = 0;
                    pos[i3] = 999;
                    continue; // Skip the rest of physics for this particle
                }

                // 2. GRAVITY PHYSICS
                // We keep your swirl + gravity logic here
                const f = CONFIG.gravityStrength / (d * d + 0.01);
                const angle = Math.atan2(dy, dx);

                pos[i3] += dx * f * 0.01;
                pos[i3 + 1] += dy * f * 0.01;

                pos[i3] += -Math.sin(angle) * CONFIG.swirlStrength;
                pos[i3 + 1] += Math.cos(angle) * CONFIG.swirlStrength;
            }
        }
        pGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}
