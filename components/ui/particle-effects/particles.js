import * as THREE from 'three';

export function initParticles() {
    // --- CONFIGURATION ---
    const CONFIG = {
        particleCount: 20,
        spawnRadius: 0.1,
        killRadius: 0.1,      // Increased slightly for visual effect
        spawnRate: 150,
        gravityStrength: 7,
        swirlStrength: 0.15,
        // Colors for Redshift Effect
        colorOut: new THREE.Color(0x00ffff), // Cyan (Outer)
        colorIn: new THREE.Color(0xff0000)  // Red (Inner/Event Horizon)
    };

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Styling: Fullscreen background
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '9999'; // On top of everything
    renderer.domElement.style.pointerEvents = 'none'; // Click-through

    document.body.appendChild(renderer.domElement);

    // --- VISUALS: THE BLACK HOLE ---

    // 1. The Void (Black Circle to cover vanishing particles)
    const holeGeo = new THREE.CircleGeometry(CONFIG.killRadius - 0.2, 32);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHole = new THREE.Mesh(holeGeo, holeMat);
    scene.add(blackHole);

    // 2. The Glow (Accretion Ring)
    const ringGeo = new THREE.RingGeometry(CONFIG.killRadius - 0.2, CONFIG.killRadius + 0.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const glowRing = new THREE.Mesh(ringGeo, ringMat);
    scene.add(glowRing);

    // --- MOUSE TRACKING ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(9999, 9999);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const targetPos = new THREE.Vector3(0, 0, 0);

    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // --- PARTICLE SYSTEM ---
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CONFIG.particleCount * 3);
    const velocities = new Float32Array(CONFIG.particleCount * 3);
    const lifes = new Float32Array(CONFIG.particleCount);

    // NEW: Colors attribute for per-particle color
    const colors = new Float32Array(CONFIG.particleCount * 3);

    for (let i = 0; i < CONFIG.particleCount; i++) {
        positions[i * 3] = 99999;
        lifes[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Add color attribute

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true, // IMPORTANT: Use per-particle colors
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // --- ANIMATION LOOP ---
    function animate() {
        requestAnimationFrame(animate);

        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, targetPos);

        // Move the visual Black Hole to mouse
        blackHole.position.copy(targetPos);
        glowRing.position.copy(targetPos);

        const pos = geometry.attributes.position.array;
        const col = geometry.attributes.color.array; // Access color array

        let spawnedThisFrame = 0;

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const i3 = i * 3;
            const isAlive = lifes[i] === 1;

            if (!isAlive) {
                if (spawnedThisFrame < CONFIG.spawnRate) {
                    spawnedThisFrame++;
                    lifes[i] = 1;
                    const angle = Math.random() * Math.PI * 2;
                    pos[i3] = targetPos.x + Math.cos(angle) * CONFIG.spawnRadius;
                    pos[i3 + 1] = targetPos.y + Math.sin(angle) * CONFIG.spawnRadius;
                    pos[i3 + 2] = 0;

                    // Initial Color (Cyan)
                    col[i3] = CONFIG.colorOut.r;
                    col[i3 + 1] = CONFIG.colorOut.g;
                    col[i3 + 2] = CONFIG.colorOut.b;

                    velocities[i3] = -Math.sin(angle) * CONFIG.swirlStrength;
                    velocities[i3 + 1] = Math.cos(angle) * CONFIG.swirlStrength;
                    velocities[i3 + 2] = 0;
                }
            } else {
                const dx = targetPos.x - pos[i3];
                const dy = targetPos.y - pos[i3 + 1];
                const dz = targetPos.z - pos[i3 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < (CONFIG.killRadius * CONFIG.killRadius)) {
                    lifes[i] = 0;
                    pos[i3] = 99999;
                    continue;
                }

                // --- GRAVITY ---
                const force = CONFIG.gravityStrength / (distSq + 0.1);
                velocities[i3] += dx * force * 0.01;
                velocities[i3 + 1] += dy * force * 0.01;
                velocities[i3 + 2] += dz * force * 0.01;

                velocities[i3] *= 0.98;
                velocities[i3 + 1] *= 0.98;
                velocities[i3 + 2] *= 0.98;

                pos[i3] += velocities[i3];
                pos[i3 + 1] += velocities[i3 + 1];
                pos[i3 + 2] += velocities[i3 + 2];

                // --- REDSHIFT EFFECT ---
                // Calculate how close it is (0.0 = at center, 1.0 = at spawn)
                const dist = Math.sqrt(distSq);
                let t = (dist - CONFIG.killRadius) / (CONFIG.spawnRadius - CONFIG.killRadius);
                t = Math.max(0, Math.min(1, t)); // Clamp between 0 and 1

                // Interpolate Color: Cyan (Outer) -> Red (Inner)
                col[i3] = THREE.MathUtils.lerp(CONFIG.colorIn.r, CONFIG.colorOut.r, t * t);
                col[i3 + 1] = THREE.MathUtils.lerp(CONFIG.colorIn.g, CONFIG.colorOut.g, t * t);
                col[i3 + 2] = THREE.MathUtils.lerp(CONFIG.colorIn.b, CONFIG.colorOut.b, t * t);
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true; // IMPORTANT: Update colors

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}
