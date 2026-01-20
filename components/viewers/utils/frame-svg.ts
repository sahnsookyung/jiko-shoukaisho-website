// components/viewers/utils/frame-svg.ts
// Shared helpers extracted from the existing viewer implementations.
// Adds bounded memoization to avoid re-parsing identical SVG strings.

interface ParsedSvg {
    cleanSvgString: string;
    cssRatio: string;
    ratioVal: number;
    w: number;
    h: number;
}

interface SvgImg {
    src: string;
    w: number;
    h: number;
}

interface CacheEntry {
    parsed?: ParsedSvg;
    img?: SvgImg;
}

const CACHE = new Map<string, CacheEntry>(); // key -> { parsed, img }
const MAX_ENTRIES = 200;

function cacheGet(key: string): CacheEntry | null {
    const val = CACHE.get(key);
    if (!val) return null;
    // Refresh insertion order (simple LRU behavior).
    CACHE.delete(key);
    CACHE.set(key, val);
    return val;
}

function cacheSet(key: string, val: CacheEntry): void {
    if (CACHE.has(key)) CACHE.delete(key);
    CACHE.set(key, val);

    while (CACHE.size > MAX_ENTRIES) {
        const firstKey = CACHE.keys().next().value;
        if (firstKey !== undefined) {
            CACHE.delete(firstKey);
        }
    }
}

function makeKey(svgString: string, defaultW: number, defaultH: number): string {
    // Defaults affect computed viewBox when width/height are missing or invalid.
    return `${defaultW}x${defaultH}::${svgString}`;
}

function ensureFinitePositive(n: number): boolean {
    return Number.isFinite(n) && n > 0;
}

function parseDimsFromViewBox(viewBox: string): { w: number; h: number } | null {
    const parts = String(viewBox).trim().split(/\s+|,/);
    const w = Number.parseFloat(parts[2]);
    const h = Number.parseFloat(parts[3]);
    if (!ensureFinitePositive(w) || !ensureFinitePositive(h)) return null;
    return { w, h };
}

interface ParseOptions {
    defaultW?: number;
    defaultH?: number;
}

/**
 * Matches the Gallery/Timeline/Thought behavior:
 * - parse svg
 * - ensure viewBox (fallback to width/height or defaults)
 * - strip width/height so CSS controls sizing
 * - return cleanSvgString + cssRatio + ratioVal
 */
export function parseFrameSvg(svgString: string, { defaultW = 1000, defaultH = 1000 }: ParseOptions = {}): ParsedSvg | null {
    if (!svgString) return null;

    const key = makeKey(svgString, defaultW, defaultH);
    const cached = cacheGet(key);
    if (cached?.parsed) return cached.parsed;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // Some environments insert <parsererror> nodes for invalid XML.
    if (doc.querySelector?.('parsererror')) return null;

    const svgEl = doc.documentElement as unknown as SVGSVGElement;
    if (!svgEl || String(svgEl.nodeName).toLowerCase() !== 'svg') return null;

    let w: number;
    let h: number;

    const viewBox = svgEl.getAttribute('viewBox');
    const vb = viewBox ? parseDimsFromViewBox(viewBox) : null;

    if (vb) {
        w = vb.w;
        h = vb.h;
    } else {
        const wAttr = svgEl.getAttribute('width');
        const hAttr = svgEl.getAttribute('height');

        const wParsed = wAttr ? Number.parseFloat(wAttr) : Number.NaN;
        const hParsed = hAttr ? Number.parseFloat(hAttr) : Number.NaN;

        w = ensureFinitePositive(wParsed) ? wParsed : defaultW;
        h = ensureFinitePositive(hParsed) ? hParsed : defaultH;

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

    const parsed: ParsedSvg = { cleanSvgString, cssRatio, ratioVal, w, h };

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
export function processSvgForImg(svgString: string, { defaultW = 1376, defaultH = 768 }: ParseOptions = {}): SvgImg | null {
    if (!svgString) return null;

    const key = makeKey(svgString, defaultW, defaultH);
    const cached = cacheGet(key);
    if (cached?.img) return cached.img;

    const parsed = parseFrameSvg(svgString, { defaultW, defaultH });
    if (!parsed) return null;

    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(parsed.cleanSvgString)}`;
    const img: SvgImg = { src, w: parsed.w, h: parsed.h };

    const entry = cached ?? {};
    entry.img = img;
    cacheSet(key, entry);

    return img;
}

// Optional: useful for tests / hot-reload debugging.
export function clearFrameSvgCache(): void {
    CACHE.clear();
}
