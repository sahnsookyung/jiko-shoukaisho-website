// utils/frame-svg.js
// Shared helpers extracted from the existing viewer implementations.
// Adds bounded memoization to avoid re-parsing identical SVG strings.

const CACHE = new Map(); // key -> { parsed, img }
const MAX_ENTRIES = 200;

function cacheGet(key) {
    const val = CACHE.get(key);
    if (!val) return null;
    // Refresh insertion order (simple LRU behavior).
    CACHE.delete(key);
    CACHE.set(key, val);
    return val;
}

function cacheSet(key, val) {
    if (CACHE.has(key)) CACHE.delete(key);
    CACHE.set(key, val);

    while (CACHE.size > MAX_ENTRIES) {
        const firstKey = CACHE.keys().next().value;
        CACHE.delete(firstKey);
    }
}

function makeKey(svgString, defaultW, defaultH) {
    // Defaults affect computed viewBox when width/height are missing or invalid.
    return `${defaultW}x${defaultH}::${svgString}`;
}

function ensureFinitePositive(n) {
    return Number.isFinite(n) && n > 0;
}

function parseDimsFromViewBox(viewBox) {
    const parts = String(viewBox).trim().split(/\s+|,/);
    const w = Number.parseFloat(parts[2]);
    const h = Number.parseFloat(parts[3]);
    if (!ensureFinitePositive(w) || !ensureFinitePositive(h)) return null;
    return { w, h };
}

/**
 * Matches the Gallery/Timeline/Thought behavior:
 * - parse svg
 * - ensure viewBox (fallback to width/height or defaults)
 * - strip width/height so CSS controls sizing
 * - return cleanSvgString + cssRatio + ratioVal
 */
export function parseFrameSvg(svgString, { defaultW = 1000, defaultH = 1000 } = {}) {
    if (!svgString) return null;

    const key = makeKey(svgString, defaultW, defaultH);
    const cached = cacheGet(key);
    if (cached?.parsed) return cached.parsed;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // Some environments insert <parsererror> nodes for invalid XML.
    if (doc.querySelector && doc.querySelector('parsererror')) return null;

    const svgEl = doc.documentElement;
    if (!svgEl || String(svgEl.nodeName).toLowerCase() !== 'svg') return null;

    let w;
    let h;

    const viewBox = svgEl.getAttribute('viewBox');
    const vb = viewBox ? parseDimsFromViewBox(viewBox) : null;

    if (vb) {
        w = vb.w;
        h = vb.h;
    } else {
        w = Number.parseFloat(svgEl.getAttribute('width'));
        h = Number.parseFloat(svgEl.getAttribute('height'));

        w = ensureFinitePositive(w) ? w : defaultW;
        h = ensureFinitePositive(h) ? h : defaultH;

        svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    // Let CSS sizing control layout.
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    svgEl.style.display = 'block';

    const cleanSvgString = svgEl.outerHTML;
    const cssRatio = `${w} / ${h}`;
    const ratioVal = w / h;

    const parsed = { cleanSvgString, cssRatio, ratioVal, w, h };

    const entry = cached ?? {};
    entry.parsed = parsed;
    cacheSet(key, entry);

    return parsed;
}

/**
 * Matches the LaptopViewer behavior:
 * - parse dimensions similarly
 * - return a data URI using encodeURIComponent (not base64)
 *
 * Note: encodes the *cleaned* SVG so the <img> path matches the inline-svg path.
 */
export function processSvgForImg(svgString, { defaultW = 1376, defaultH = 768 } = {}) {
    if (!svgString) return null;

    const key = makeKey(svgString, defaultW, defaultH);
    const cached = cacheGet(key);
    if (cached?.img) return cached.img;

    const parsed = parseFrameSvg(svgString, { defaultW, defaultH });
    if (!parsed) return null;

    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(parsed.cleanSvgString)}`;
    const img = { src, w: parsed.w, h: parsed.h };

    const entry = cached ?? {};
    entry.img = img;
    cacheSet(key, entry);

    return img;
}

// Optional: useful for tests / hot-reload debugging.
export function clearFrameSvgCache() {
    CACHE.clear();
}
