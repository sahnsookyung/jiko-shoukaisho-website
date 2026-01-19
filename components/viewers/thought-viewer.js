import DOMPurify from 'dompurify';
import '../ui/navigation-arrows.js';
import { parseFrameSvg } from './utils/frame-svg.js';
import { escapeHtml } from '../../utils/string-utils.js';

class ThoughtViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.page = 0;       // Current thought index
    this.spreadIndex = 0;  // Current spread (0 = first 2 pages)
  }

  set frameSvg(v) { this._frameSvg = v; this.render(); }
  set data(v) { this._data = v; this.page = 0; this.spreadIndex = 0; this.render(); }
  set config(v) { this._config = v; }

  connectedCallback() {
    this._onKey = (e) => {
      if (!this.isConnected) return;
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    };
    document.addEventListener('keydown', this._onKey);

    // Reset spread index on resize
    this._onResize = () => {
      this.spreadIndex = 0;
      this.updateSpread();
    };
    window.addEventListener('resize', this._onResize);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKey);
    window.removeEventListener('resize', this._onResize);
  }

  render() {
    if (!this._frameSvg || !this._data) return;

    // 1. PARSE & CLEAN SVG (util)
    const parsed = parseFrameSvg(this._frameSvg, { defaultW: 1000, defaultH: 1000 });
    if (!parsed) return;

    const { cleanSvgString, cssRatio, ratioVal } = parsed;

    const thoughts = this._data.thoughts || [];
    const item = thoughts[this.page];

    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: flex; 
          width: 100%; 
          height: 100%; 
          align-items: center; 
          justify-content: center;
          overflow: hidden; 
        }

        .wrap {
          position: relative;
          
          /* Lock shape to SVG */
          aspect-ratio: ${cssRatio};

          /* Fit to Screen Logic (95% to match other viewers) */
          width: min(95vw, calc(95vh * ${ratioVal}));
          
          /* Enable Container Queries for children */
          container-type: inline-size; 

          margin: auto;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }

        .frame { width: 100%; height: 100%; display: block; }
        
        .content {
          position: absolute;
          left: 20%; right: 20%; top: 14%; bottom: 15%;
          
          /* Hide overflow: Content is purely paged now */
          overflow: hidden; 
          padding-right: 0;
          
          font-family: 'Marck Script', 'Caslon', cursive;
          
          /* 
             2.8cqw means "2.8% of the wrapper's width"
          */
          font-size: clamp(16px, 2.8cqw, 26px); 

          color: #1f1f1f; 
          line-height: 1.3;
        }
        
        .pages-container {
          height: 100%;
          
          /* 
             Two Columns = Left Page & Right Page
             Text flows from Left -> Right automatically.
          */
          column-count: 2;
          column-gap: 8%; /* Visual gutter between the two rects */
          column-fill: auto; /* Fill left rect, then right rect */
          
          /* Logic to enforce width matching container */
          width: 100%;
        }

        .pages-container h2, .pages-container p, .pages-container div {
          /* Allow text to break across pages naturally, like a real book */
          /* break-inside: avoid; <-- REMOVED to prevent column jumping */
        }

        .nav {
          position: absolute;
          left: 50%; bottom: 6%; transform: translateX(-50%);
          display: flex; gap: 14px; align-items: center;
          background: rgba(255,255,255,.9);
          padding: 8px 14px; border-radius: 999px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .count{font:12px system-ui;color:#555;min-width:64px;text-align:center;}
      </style>
      
      <div class="wrap">
        <div class="frame">${cleanSvgString}</div>
        <div class="content">
          <div class="pages-container">
            <h2 style="margin-top:0">${escapeHtml(item?.title ?? '')}</h2>
            <p style="margin-top:0;margin-left:0.2em;margin-bottom:1em"><em>${escapeHtml(item?.date ?? '')}</em></p>
            <div style="margin-left:0.2em">${DOMPurify.sanitize(item?.content ?? '')}</div>
          </div>
        </div>
        <div class="nav">
          <navigation-arrows></navigation-arrows>
          <div class="count">${this.page + 1} / ${thoughts.length}</div>
        </div>
      </div>
    `;

    const arrows = this.shadowRoot.querySelector('navigation-arrows');
    if (arrows) {
      this._updateArrows(arrows);

      // Prevent duplicate listeners by checking if we have a new element
      if (this._arrows !== arrows) {
        // defined bound handlers if not present
        this._onArrowsPrev = this._onArrowsPrev || this.prev.bind(this);
        this._onArrowsNext = this._onArrowsNext || this.next.bind(this);

        if (this._arrows) {
          this._arrows.removeEventListener('prev', this._onArrowsPrev);
          this._arrows.removeEventListener('next', this._onArrowsNext);
        }

        this._arrows = arrows;
        this._arrows.addEventListener('prev', this._onArrowsPrev);
        this._arrows.addEventListener('next', this._onArrowsNext);
      }
    }

    // Initial display
    this.updateSpread();
  }

  _hasMoreSpreads() {
    const track = this.shadowRoot.querySelector('.pages-container');
    const content = this.shadowRoot.querySelector('.content');
    if (!track || !content) return false;

    // Check if there are more "spreads" (columns off-screen)
    const currentPos = (this.spreadIndex + 1) * content.clientWidth;
    return currentPos < track.scrollWidth - 5;
  }

  _updateArrows(arrows) {
    if (!arrows) return;
    const thoughts = this._data?.thoughts || [];
    const hasNextPage = this.page < thoughts.length - 1;
    const canNext = this._hasMoreSpreads() || hasNextPage;

    arrows.setAttribute('can-prev', String(this.page > 0 || this.spreadIndex > 0));
    arrows.setAttribute('can-next', String(canNext));
  }

  updateSpread() {
    const track = this.shadowRoot.querySelector('.pages-container');
    if (!track) return;

    // Shift the view to show the current "Spread" (pair of pages)
    // We must account for the column-gap (8%) in the stride
    // Stride = 100% width + 8% gap
    track.style.transform = `translateX(calc(${-this.spreadIndex} * 108%))`;
  }

  prev() {
    if (this.spreadIndex > 0) {
      this.spreadIndex--;
      this.updateSpread();
      this._updateArrows(this.shadowRoot.querySelector('navigation-arrows')); // update State
    } else if (this.page > 0) {
      this.page--;
      this.spreadIndex = 0;
      this.render();
    }
  }

  next() {
    const track = this.shadowRoot.querySelector('.pages-container');
    const content = this.shadowRoot.querySelector('.content');
    if (!track || !content) return;

    // Check if there are more "spreads" (columns off-screen)
    const currentPos = (this.spreadIndex + 1) * content.clientWidth;

    // If layout extends beyond current view
    if (currentPos < track.scrollWidth - 5) {
      this.spreadIndex++;
      this.updateSpread();
      this._updateArrows(this.shadowRoot.querySelector('navigation-arrows'));
    } else {
      // Next thought
      const thoughts = this._data?.thoughts || [];
      if (this.page < thoughts.length - 1) {
        this.page++;
        this.spreadIndex = 0;
        this.render();
      }
    }
  }
}

if (!customElements.get('thought-viewer')) {
  customElements.define('thought-viewer', ThoughtViewer);
}
