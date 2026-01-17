# Interactive SVG Portfolio - Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Core Implementation](#core-implementation)
4. [Component Implementations](#component-implementations)
5. [Lazy Loading Strategy](#lazy-loading-strategy)
6. [Hover Tooltips](#hover-tooltips)
7. [Accessibility](#accessibility)
8. [Testing & Optimization](#testing--optimization)

---

## Architecture Overview

### Goals
- Single-screen experience: the main SVG stays visible; clicking an interactive region opens an overlay viewer on top of the scene.
- Clickable targets can be either a single SVG element (`<path id="...">`) or a subgroup (`<g id="...">`) and should map to different content.
- All “content views” (resume, thoughts, galleries, timeline) are presented inside **purpose-built SVG containers** (e.g., laptop screen, thought bubble, camera viewfinder, scroll).

### Principles (Separation of Concerns + SOLID-ish)
- **Data/config** is separate from UI and interaction code.
- **Event handling** is centralized (event delegation) rather than attaching listeners to every path.
- **Rendering** is componentized (Web Components), keeping each viewer focused on one responsibility.
- **Lazy loading** for SVG containers and content data to keep initial load light.

### High-level Flow
1. Page loads and inlines the main SVG (so CSS + JS can access internal IDs).
2. Hovering over an interactive region shows a tooltip label/description.
3. Clicking an interactive region opens the content viewer.
4. The viewer lazy-loads:
   - The SVG “container frame” (laptop/bubble/camera/scroll)
   - The content data (resume JSON, thoughts list, gallery index, timeline)
   - The viewer component module (dynamic `import()`)
5. User exits by:
   - Clicking the backdrop
   - Clicking the close button
   - Pressing `Esc`

---

## File Structure

```
/
├── index.html                          # Main page
├── style.css                           # Global styles (SVG + layout)
├── app.js                              # Main controller
│
├── config/
│   └── content-map.js                  # Mapping: SVG id -> content config
│
├── components/
│   ├── content-viewer.js               # Overlay container (loads sub-viewers lazily)
│   ├── tooltip-display.js              # Hover tooltip
│   ├── viewers/
│   │   ├── laptop-viewer.js            # Resume / about viewer
│   │   ├── thought-viewer.js           # Thoughts pager (arrows + keyboard)
│   │   ├── gallery-viewer.js           # Camera/gallery viewer
│   │   └── timeline-viewer.js          # Timeline / scroll carousel
│   └── ui/
│       ├── navigation-arrows.js        # Reusable prev/next arrows
│       └── loading-spinner.js          # Loading indicator
│
├── utils/
│   ├── svg-loader.js                   # Inline main SVG, lazy-load SVG frames + JSON
│   ├── keyboard-nav.js                 # Optional: shared keyboard behaviors
│   └── focus-trap.js                   # Optional: focus management for overlay
│
├── assets/
│   ├── images/output_svgs/min/         # SVG frames
│   │   ├── book.svg 
│   │   ├── camera-viewfinder.svg
│   │   ├── laptop-screen.svg
│   │   ├── main.svg
│   │   ├── navigation-sprites.svg
│   │   ├── scroll.svg
│   │
│   ├── content/                        # Data files
│   │   ├── resume.json
│   │   ├── about.json
│   │   ├── thoughts/
│   │   │   ├── index.json
│   │   │   └── thought-001.md (optional)
│   │   ├── travel/
│   │   │   ├── iceland/index.json
│   │   │   ├── europe/index.json
│   │   │   ├── japan/index.json
│   │   │   └── skydiving/index.json
│   │   └── timeline.json
│   │
│   └── images/
│       └── (travel photos)
│
└── tests/
    └── (optional)
```

---

## Core Implementation

### 1) `index.html`

Use an `<object>` tag to load the main SVG file, then inline it with JS so internal IDs become queryable/stylable.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Soo Kyung Ahn</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div class="container">
    <object
      class="main-svg"
      data="images/inkscape_svg/main.min.interactiveLayerApplied-optimized.svg"
      type="image/svg+xml"
      id="main-svg-object"
    ></object>
  </div>

  <!-- Components + App bootstrap -->
  <script type="module" src="/app.js"></script>
</body>
</html>
```

---

### 2) Content map (`config/content-map.js`)

A single source of truth: map an SVG id (path or group) to:
- label + description (tooltip)
- which “viewer type” should render it
- which SVG frame to load
- which data file(s) to load

```js
export const contentMap = {
  laptop: {
    id: 'laptop',
    label: 'Resume & Experience',
    description: 'View my professional background',
    type: 'resume',
    containerSVG: 'laptop-screen',
    contentPath: 'assets/content/resume.json',
    component: 'laptop-viewer'
  },

  philosopher: {
    id: 'philosopher',
    label: 'Thoughts & Reflections',
    description: 'Read my thoughts page-by-page',
    type: 'thoughts',
    containerSVG: 'thought-bubble',
    contentPath: 'assets/content/thoughts/index.json',
    component: 'thought-viewer'
  },

  'iceland-mountains': {
    id: 'iceland-mountains',
    label: 'Iceland Adventure',
    description: 'Photos from Iceland',
    type: 'gallery',
    containerSVG: 'camera-viewfinder',
    contentPath: 'assets/content/travel/iceland/index.json',
    component: 'gallery-viewer'
  },

  europe: {
    id: 'europe',
    label: 'Europe',
    description: 'Photos from Europe',
    type: 'gallery',
    containerSVG: 'camera-viewfinder',
    contentPath: 'assets/content/travel/europe/index.json',
    component: 'gallery-viewer'
  },

  japan: {
    id: 'japan',
    label: 'Japan',
    description: 'Photos from Japan',
    type: 'gallery',
    containerSVG: 'camera-viewfinder',
    contentPath: 'assets/content/travel/japan/index.json',
    component: 'gallery-viewer'
  },

  'plane-skydiver': {
    id: 'plane-skydiver',
    label: 'Skydiving',
    description: 'Photos from the sky',
    type: 'gallery',
    containerSVG: 'camera-viewfinder',
    contentPath: 'assets/content/travel/skydiving/index.json',
    component: 'gallery-viewer'
  },

  scroll: {
    id: 'scroll',
    label: 'Timeline',
    description: 'A scroll-based story carousel',
    type: 'timeline',
    containerSVG: 'scroll-unfurled',
    contentPath: 'assets/content/timeline.json',
    component: 'timeline-viewer'
  },

  person: {
    id: 'person',
    label: 'About Me',
    description: 'A short intro',
    type: 'about',
    containerSVG: 'laptop-screen',
    contentPath: 'assets/content/about.json',
    component: 'laptop-viewer'
  }
};

export function getContentConfig(id) {
  return contentMap[id] || null;
}
```

---

### 3) App controller (`app.js`)

Responsibilities:
- Inline the main SVG
- Attach one click handler and hover handlers to `#interactive-overlays`
- Resolve clicked target to a config entry (path id or parent group id)
- Open/close viewer

```js
import { getContentConfig } from './config/content-map.js';
import { inlineSVG } from './utils/svg-loader.js';

import './components/content-viewer.js';
import './components/tooltip-display.js';

class PortfolioApp {
  async init() {
    await inlineSVG();

    this.viewer = document.createElement('content-viewer');
    document.body.appendChild(this.viewer);

    this.tooltip = document.createElement('tooltip-display');
    document.body.appendChild(this.tooltip);

    this.overlays = document.querySelector('#interactive-overlays');

    this.overlays?.addEventListener('click', (e) => this.onClick(e));

    // Hover: use capture so we catch enters/leaves as the pointer moves between paths
    this.overlays?.addEventListener('mouseenter', (e) => this.onEnter(e), true);
    this.overlays?.addEventListener('mouseleave', (e) => this.onLeave(e), true);
    this.overlays?.addEventListener('mousemove', (e) => this.onMove(e));

    this.viewer.addEventListener('close-request', () => this.viewer.hide());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.viewer.isVisible()) this.viewer.hide();
    });
  }

  resolveConfigFromEventTarget(target) {
    if (!target) return null;

    // 1) Try direct id
    if (target.id) {
      const direct = getContentConfig(target.id);
      if (direct) return direct;
    }

    // 2) Try nearest parent group with id
    const group = target.closest('g[id]');
    if (group?.id) {
      const fromGroup = getContentConfig(group.id);
      if (fromGroup) return fromGroup;
    }

    return null;
  }

  onClick(e) {
    const target = e.target;
    const cfg = this.resolveConfigFromEventTarget(target);
    if (!cfg) return;

    this.tooltip.hide();
    this.viewer.show(cfg);
  }

  onEnter(e) {
    const target = e.target;
    const cfg = this.resolveConfigFromEventTarget(target);
    if (!cfg) return;

    this.tooltip.show(cfg, e);
  }

  onLeave(e) {
    // Hide if leaving interactive region entirely
    const related = e.relatedTarget;
    const stillOverInteractive = !!this.resolveConfigFromEventTarget(related);
    if (!stillOverInteractive) this.tooltip.hide();
  }

  onMove(e) {
    this.tooltip.updatePosition(e);
  }
}

new PortfolioApp().init();
```

---

## Component Implementations

### 4) Lazy SVG + JSON loader (`utils/svg-loader.js`)

This file does 3 jobs:
1. Inline the main SVG.
2. Lazy load SVG “frames” (containers) on demand.
3. Lazy load content JSON on demand.

```js
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
```

---

### 5) Tooltip component (`components/tooltip-display.js`)

Shows label + description near cursor on hover.

```js
class TooltipDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{position:fixed;z-index:999;pointer-events:none;opacity:0;transform:translateY(8px);
          transition:opacity .15s ease-out, transform .15s ease-out;}
        :host(.visible){opacity:1;transform:translateY(0);}
        .tip{background:rgba(10,10,10,.92);border:2px solid #ffd700;border-radius:10px;
          padding:10px 12px;max-width:260px;box-shadow:0 6px 30px rgba(255,215,0,.18);
          font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
        .label{color:#ffd700;font-weight:650;font-size:14px;margin-bottom:4px;}
        .desc{color:#d0d0d0;font-size:12px;line-height:1.35;}
        .hint{color:#9a9a9a;font-size:11px;margin-top:6px;font-style:italic;}
      </style>
      <div class="tip">
        <div class="label"></div>
        <div class="desc"></div>
        <div class="hint">Click to open</div>
      </div>
    `;
  }

  show(cfg, e) {
    this.shadowRoot.querySelector('.label').textContent = cfg.label;
    this.shadowRoot.querySelector('.desc').textContent = cfg.description;
    this.updatePosition(e);
    this.classList.add('visible');
  }

  hide() {
    this.classList.remove('visible');
  }

  updatePosition(e) {
    const pad = 16;
    const tip = this.shadowRoot.querySelector('.tip');
    const r = tip.getBoundingClientRect();

    let x = e.clientX + pad;
    let y = e.clientY + pad;

    if (x + r.width > window.innerWidth) x = e.clientX - r.width - pad;
    if (y + r.height > window.innerHeight) y = e.clientY - r.height - pad;

    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
  }
}

customElements.define('tooltip-display', TooltipDisplay);
```

---

### 6) Content viewer shell (`components/content-viewer.js`)

Responsibilities:
- Backdrop + close controls
- Lazy-load viewer modules
- Lazy-load SVG container frame and content JSON
- Render the correct viewer component

```js
import { loadSVG, loadJSON } from '../utils/svg-loader.js';
import './ui/loading-spinner.js';

class ContentViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._visible = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:1000;}
        :host(.visible){display:flex;}
        .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.0);transition:background .25s ease-out;}
        :host(.visible) .backdrop{background:rgba(0,0,0,.85);}
        .wrap{position:relative;max-width:95vw;max-height:95vh;}
        .panel{opacity:0;transform:scale(.96);transition:opacity .3s ease-out, transform .3s ease-out;}
        :host(.visible) .panel{opacity:1;transform:scale(1);}
        .close{position:absolute;top:-44px;right:-44px;width:38px;height:38px;border-radius:999px;
          border:2px solid #ffd700;background:rgba(255,215,0,.12);cursor:pointer;}
        .close:hover{background:rgba(255,215,0,.25)}
        .close:before,.close:after{content:'';position:absolute;left:50%;top:50%;width:18px;height:2px;
          background:#ffd700;transform-origin:center;}
        .close:before{transform:translate(-50%,-50%) rotate(45deg);}
        .close:after{transform:translate(-50%,-50%) rotate(-45deg);}
      </style>
      <div class="backdrop"></div>
      <div class="wrap">
        <button class="close" aria-label="Close"></button>
        <div class="panel">
          <loading-spinner></loading-spinner>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.requestClose());
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.requestClose());
  }

  isVisible() {
    return this.classList.contains('visible');
  }

  requestClose() {
    this.dispatchEvent(new CustomEvent('close-request'));
  }

  async show(cfg) {
    this.classList.add('visible');

    const panel = this.shadowRoot.querySelector('.panel');
    panel.innerHTML = `<loading-spinner></loading-spinner>`;

    // Lazy-load the viewer module
    await import(`./viewers/${cfg.component}.js`);

    // Lazy-load frame svg + JSON content
    const [frameSvg, data] = await Promise.all([
      loadSVG(`assets/images/output_svgs/min/${cfg.containerSVG}.svg`),
      loadJSON(cfg.contentPath)
    ]);

    const el = document.createElement(cfg.component);
    el.frameSvg = frameSvg;
    el.data = data;
    el.config = cfg;

    panel.innerHTML = '';
    panel.appendChild(el);
  }

  hide() {
    this.classList.remove('visible');
    // Optional: clear panel content after transition
    setTimeout(() => {
      const panel = this.shadowRoot.querySelector('.panel');
      if (panel) panel.innerHTML = '';
    }, 300);
  }
}

customElements.define('content-viewer', ContentViewer);
```

---

### 7) Example viewer: thoughts pager (`components/viewers/thought-viewer.js`)

Key behaviors:
- Renders an SVG thought bubble frame.
- Displays a “page” of text from a list.
- Supports next/prev via buttons and arrow keys.

```js
import '../ui/navigation-arrows.js';

class ThoughtViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.page = 0;
  }

  set frameSvg(v) { this._frameSvg = v; this.render(); }
  set data(v) { this._data = v; this.page = 0; this.render(); }
  set config(v) { this._config = v; }

  connectedCallback() {
    this._onKey = (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    };
    document.addEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKey);
  }

  render() {
    if (!this._frameSvg || !this._data) return;

    const thoughts = this._data.thoughts || [];
    const item = thoughts[this.page];

    this.shadowRoot.innerHTML = `
      <style>
        .wrap{position:relative;width:min(900px,92vw);}
        .frame{width:100%;height:auto;display:block;}
        .content{position:absolute;left:10%;right:10%;top:16%;bottom:18%;
          overflow:auto;padding:18px 20px;font-family:Georgia,serif;color:#1f1f1f;
          animation:fade .25s ease-out;}
        .nav{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);
          display:flex;gap:14px;align-items:center;background:rgba(255,255,255,.86);
          padding:8px 14px;border-radius:999px;}
        .count{font:12px system-ui;color:#555;min-width:64px;text-align:center;}
        @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      </style>
      <div class="wrap">
        <div class="frame">${this._frameSvg}</div>
        <div class="content">
          <h2>${item?.title ?? ''}</h2>
          <p><em>${item?.date ?? ''}</em></p>
          <div>${item?.content ?? ''}</div>
        </div>
        <div class="nav">
          <navigation-arrows></navigation-arrows>
          <div class="count">${this.page + 1} / ${thoughts.length}</div>
        </div>
      </div>
    `;

    const arrows = this.shadowRoot.querySelector('navigation-arrows');
    arrows.setAttribute('can-prev', String(this.page > 0));
    arrows.setAttribute('can-next', String(this.page < thoughts.length - 1));

    arrows.addEventListener('prev', () => this.prev());
    arrows.addEventListener('next', () => this.next());
  }

  prev() {
    if (this.page > 0) { this.page--; this.render(); }
  }

  next() {
    const thoughts = this._data?.thoughts || [];
    if (this.page < thoughts.length - 1) { this.page++; this.render(); }
  }
}

customElements.define('thought-viewer', ThoughtViewer);
```

---

### 8) Shared arrows (`components/ui/navigation-arrows.js`)

```js
class NavigationArrows extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['can-prev', 'can-next'];
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const canPrev = this.getAttribute('can-prev') !== 'false';
    const canNext = this.getAttribute('can-next') !== 'false';

    this.shadowRoot.innerHTML = `
      <style>
        .row{display:flex;gap:10px}
        button{width:38px;height:38px;border-radius:999px;border:2px solid #ffd700;
          background:rgba(255,215,0,.1);cursor:pointer;}
        button:disabled{opacity:.35;cursor:not-allowed;}
      </style>
      <div class="row">
        <button class="prev" ${canPrev ? '' : 'disabled'} aria-label="Previous">←</button>
        <button class="next" ${canNext ? '' : 'disabled'} aria-label="Next">→</button>
      </div>
    `;

    this.shadowRoot.querySelector('.prev').addEventListener('click', () => {
      if (!canPrev) return;
      this.dispatchEvent(new CustomEvent('prev', { bubbles: true }));
    });

    this.shadowRoot.querySelector('.next').addEventListener('click', () => {
      if (!canNext) return;
      this.dispatchEvent(new CustomEvent('next', { bubbles: true }));
    });
  }
}

customElements.define('navigation-arrows', NavigationArrows);
```

---

### 9) Loading spinner (`components/ui/loading-spinner.js`)

```js
class LoadingSpinner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .s{width:48px;height:48px;border-radius:999px;
          border:4px solid rgba(255,215,0,.25);border-top-color:#ffd700;
          animation:spin 1s linear infinite;margin:20px;}
        @keyframes spin{to{transform:rotate(360deg)}}
      </style>
      <div class="s"></div>
    `;
  }
}

customElements.define('loading-spinner', LoadingSpinner);
```

---

## Lazy Loading Strategy

### What is lazy-loaded
- Viewer component JS modules: `import('./viewers/<component>.js')`
- Viewer SVG “frame” (container): `assets/svg-containers/<name>.svg`
- Content JSON: `assets/content/.../*.json`

### Optional preloading
After initial load, you can preload the most likely content in idle time to improve perceived speed.

```js
// After init
requestIdleCallback(async () => {
  // pick 1–2 common entry points
  await Promise.all([
    fetch('assets/svg-containers/laptop-screen.svg'),
    fetch('assets/content/resume.json')
  ]);
});
```

---

## Hover Tooltips

### Requirements covered
- Show a short label + description on hover.
- Follow cursor.
- Stay within viewport edges.

Implementation is handled by `tooltip-display` plus `mouseenter/mouseleave/mousemove` delegation in `app.js`.

---

## Accessibility

### Recommended behaviors
- Overlay should close on `Esc`.
- Close button should be a real `<button>` with an accessible label.
- Backdrop click closes the overlay.
- Consider focus management:
  - When opened: focus the close button.
  - While open: trap focus inside overlay.
  - When closed: return focus to last clicked SVG element.

(If you decide to treat it as a proper modal, add `role="dialog"`, `aria-modal="true"`, and an accessible title.)

---

## Testing & Optimization

### Manual testing checklist
- Hover tooltip shows for every interactive region.
- Clicking each region opens the correct viewer.
- Viewer loads quickly on second open (cache works).
- ESC closes viewer.
- Backdrop click closes viewer.
- Keyboard navigation works in thoughts/timeline.
- Mobile: viewer fits screen; close button reachable.

### Performance notes
- Keep the main SVG optimized (paths simplified, metadata removed, unnecessary layers removed).
- Prefer JSON indexes for galleries/thoughts so you don’t fetch many files up-front.
- Consider compressing images and serving modern formats.

---

## Example Content Files

### `assets/content/resume.json`
```json
{
  "name": "Soo Kyung Ahn",
  "title": "Software Engineer",
  "sections": [
    {
      "title": "Experience",
      "items": [
        {
          "company": "Tech Corp",
          "role": "Senior Developer",
          "period": "2020 - Present",
          "description": "Led development of...",
          "highlights": [
            "Improved performance by 40%",
            "Mentored 5 junior developers"
          ]
        }
      ]
    }
  ]
}
```

### `assets/content/thoughts/index.json`
```json
{
  "thoughts": [
    {
      "id": "001",
      "title": "On Simplicity",
      "date": "January 2026",
      "content": "Simplicity is not about having less, it's about making room for what matters most..."
    },
    {
      "id": "002",
      "title": "The Nature of Learning",
      "date": "December 2025",
      "content": "Every expert was once a beginner..."
    }
  ]
}
```

### `assets/content/travel/iceland/index.json`
```json
{
  "title": "Iceland Adventure",
  "photos": [
    { "src": "assets/images/iceland/photo1.jpg", "caption": "Northern lights", "date": "March 2025" },
    { "src": "assets/images/iceland/photo2.jpg", "caption": "Gullfoss", "date": "March 2025" }
  ]
}
```

### `assets/content/timeline.json`
```json
{
  "entries": [
    {
      "year": "2026",
      "title": "Now",
      "text": "Building an interactive SVG portfolio",
      "storySvg": "assets/svg-containers/story-2026.svg"
    }
  ]
}
```
