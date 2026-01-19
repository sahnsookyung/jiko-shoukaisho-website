const svgCache = new Map();
const jsonCache = new Map();

export async function inlineSVG() {
    const objects = document.querySelectorAll('object.main-svg[type="image/svg+xml"]');

    await Promise.all([...objects].map(async (obj) => {
        try {
            const res = await fetch(obj.data);

            if (!res.ok) {
                console.error(`Failed to fetch SVG: ${res.status} ${res.statusText} for ${obj.data}`);
                return;
            }

            const text = await res.text();
            const doc = new DOMParser().parseFromString(text, 'image/svg+xml');

            // Check for parsing errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                console.error('SVG parsing error:', parserError.textContent, 'for', obj.data);
                return;
            }

            const svg = doc.querySelector('svg');
            if (!svg) {
                console.error('No <svg> element found in:', obj.data);
                console.log('First 200 chars of response:', text.substring(0, 200));
                return;
            }

            if (obj.id) svg.id = obj.id;
            if (obj.className) svg.classList.add(...obj.classList.value.split(/\s+/).filter(Boolean));

            obj.replaceWith(svg);
        } catch (error) {
            console.error('Error loading SVG:', obj.data, error);
        }
    }));
}

export async function loadSVG(path) {
    if (svgCache.has(path)) return svgCache.get(path);

    const res = await fetch(path);
    const text = await res.text();
    svgCache.set(path, text);
    return text;
}

export async function loadJSON(path) {
    if (jsonCache.has(path)) return jsonCache.get(path);

    const res = await fetch(path);
    const data = await res.json();
    jsonCache.set(path, data);
    return data;
}
