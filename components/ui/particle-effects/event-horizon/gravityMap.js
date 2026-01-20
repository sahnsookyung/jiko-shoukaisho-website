/**
 * Generates the displacement map texture (Schwarzschild lensing).
 * 
 * @param {number} size - The width/height of the square canvas (e.g. 512).
 * @returns {string} The data URL of the generated image.
 */
export const createGravityMap = (size) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    const center = size / 2;
    const mass = 30;

    // Schwarzschild Radius (The Black Hole Size)
    // This should actually be R_s = 2GM/c^2 but we not gonna see anything so we just break the laws.
    const rs = size * 0.05;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;

            const dx = x - center;
            const dy = y - center;
            const dist = Math.hypot(dx, dy);

            let red = 128;
            let green = 128;
            let blue = 0;
            let alpha = 255; // Default to opaque

            if (dist < rs) {
                // --- INSIDE HORIZON ---
                // No displacement (keep neutral to avoid tearing)
                // Mark as HOLE (Blue = 255)
                // red/green remain 128 (neutral)
                blue = 255;
            } else if (dist < center) {
                // --- GRAVITY LENSING ---
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

                // --- SOFT EDGE MASKING ---
                // As we approach the edge of the canvas (center), fade alpha to 0
                // This prevents the "square" box artifact
                if (dist > center * 0.95) {
                    alpha = 255 * (1 - (dist - center * 0.95) / (center * 0.05));
                    alpha = Math.max(0, alpha);
                }

            } else {
                // --- OUTSIDE CANVAS RADIUS ---
                // Make the corners of the square transparent.
                // Because we composite OVER neutral gray in the SVG, 
                // this makes the lens shape perfectly circular.
                alpha = 0;
            }

            data[i] = red;
            data[i + 1] = green;
            data[i + 2] = blue;
            data[i + 3] = alpha;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
};
