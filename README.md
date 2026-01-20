# Interactive Portfolio (자기소개서 / 自己紹介書)

Hi! This is an interactive portal website that showcases who I am, including both my professional background and glimpses into my personal life.

## Overview

The website is designed as a single-screen interactive experience. The user interacts with a main, highly optimized SVG landscape. Clicking on various "interactive regions" triggers overlays that display specific content through purpose-built viewers.

## Key Features

### 1. Interactive SVG Landscape
- **Dynamic Overlays**: Hand-drawn interactive layers are mapped to specific content.
- **Responsive Tooltips**: Hovering over interactive regions provides immediate context and descriptions.
- **Seamless Navigation**: Transitions between the main view and content overlays are smooth and non-disruptive.

### 2. Multi-Purpose Content Viewers
- **Laptop Viewer**: Displays a digital resume, experience, and about sections.
- **Thought Viewer**: A paginated bubble for reading reflections, supporting keyboard navigation.
- **Gallery Viewer** (Camera Viewfinder): Showcases travel photography (Iceland, Europe, Japan, etc.) with local assets and captions.
- **Timeline Viewer** (Scroll): A scrollable carousel for storytelling and chronological events.

### 3. Special Effects
- **Event Horizon Effect**: A real-time `Three.js` particle system that follows the mouse, simulating a gravity well with redshift color interpolation.
- **Korean "Waterfall" Effect**: A thematic background effect featuring falling Korean characters, paying homage to traditional aesthetics (Ancient Korean Style).
- **Toggleable Controls**: Users can independently toggle these high-fidelity visual effects on or off.

## Tech Stack

- **Core**: Vanilla JavaScript, HTML5, Semantic CSS.
- **Graphics**: SVG (Scalable Vector Graphics), [Three.js](https://threejs.org/) for particle simulations.
- **Components**: Custom Web Components for modular and reusable viewers.
- **Security**: [DOMPurify](https://github.com/cure53/dompurify) for sanitizing user-provided content.
- **Build Tool**: [Vite](https://vitejs.dev/) for a fast development experience and optimized production builds.

## Asset Optimization Pipeline

A rigorous pipeline was used to ensure high visual quality while maintaining a small footprint:
1. **Generation**: Initial designs were refined using AI-assisted prompt searching.
2. **Vectorization**: JPEGs were converted to SVGs using `Vtracer` for near-lossless zooming.
3. **Minification**: SVGs were minified using `svgo`.
4. **Layering**: Inkscape was used to create precise bezier-path layers for interaction.
5. **Node Reduction**: Path simplification in Inkscape (`Ctrl + L`) yielded size reductions of ~80%.
6. **Precision Tuning**: Filesize was further reduced by limiting decimal precision in coordinate data.

## Development

To run the project locally, ensure you have Node.js installed, then run:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## TODO
- Add a new graphic and add a section for portfolio as we build.
- Add more content to website.

---
*Created by Soo Kyung Ahn*