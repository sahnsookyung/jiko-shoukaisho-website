const svgCache = new Map();
const jsonCache = new Map();

export async function inlineSVG() {
    const objects = document.querySelectorAll('object.main-svg[type="image/svg+xml"]');

    await Promise.all([...objects].map(async (obj) => {
        const res = await fetch(obj.data);
        const text = await res.text();

        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');

        if (obj.id) svg.id = obj.id;
        if (obj.className) svg.classList.add(...obj.classList.value.split(/\s+/).filter(Boolean));

        obj.replaceWith(svg);
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
