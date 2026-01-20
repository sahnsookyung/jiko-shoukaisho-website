import DOMPurify from 'dompurify';
import { processSvgForImg } from './utils/frame-svg';
import { escapeHtml } from '../../utils/string-utils';

interface SocialLink {
  platform: string;
  url: string;
  icon: 'github' | 'linkedin';
}

interface ResumeItem {
  role?: string;
  company?: string;
  period?: string;
  description?: string;
  highlights?: string[];
}

interface ResumeSection {
  title: string;
  items: ResumeItem[];
}

interface LaptopData {
  title?: string;
  name?: string;
  text?: string | string[];
  sections?: ResumeSection[];
  links?: SocialLink[];
}

interface SvgImg {
  src: string;
  w: number;
  h: number;
}

class LaptopViewer extends HTMLElement {
  private _frameSvg?: string;
  private _cutoutSvg?: string;
  private _data?: LaptopData;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set frameSvg(v: string) { this._frameSvg = v; this.render(); }
  set cutoutSvg(v: string) { this._cutoutSvg = v; this.render(); }
  set data(v: LaptopData) { this._data = v; this.render(); }

  connectedCallback(): void {
    this.render();
  }

  private _processSvg(svgString?: string): SvgImg | null {
    if (!svgString) return null;
    return processSvgForImg(svgString, { defaultW: 1376, defaultH: 768 });
  }

  render(): void {
    if (!this._frameSvg || !this._data || !this.shadowRoot) return;

    const frameObj = this._processSvg(this._frameSvg);
    if (!frameObj) return;

    // Optional Cutout
    const cutoutObj = this._processSvg(this._cutoutSvg);

    // Calculate Aspect Ratio from the Frame
    const cssRatio = `${frameObj.w} / ${frameObj.h}`;
    const ratioVal = frameObj.w / frameObj.h;

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
          aspect-ratio: ${cssRatio};
          width: min(95vw, calc(95vh * ${ratioVal}));
          margin: auto;
          display: flex; 
          align-items: center; 
          justify-content: center;
          container-type: inline-size;
        }

        /* 
           STRICT LAYERING 
           Using z-index to force the order:
           1. Cutout (Bottom)
           2. Content (Middle)
           3. Frame (Top)
        */

        .layer-cutout { 
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 0;
            object-fit: fill; /* Ensures SVG stretches exactly like the frame */
            pointer-events: none;
        }

        .layer-content {
            position: absolute;
            z-index: 1;
            
            /* Positioning: Defines the outer boundary */
            left: 14%; 
            right: 14%; 
            top: 8%; 
            bottom: 12%;

            background: rgba(255, 255, 255, 0.9);
            overflow: auto;
            
            /* Fluid padding (matches your font logic) */
            /* Scales between 15px and 40px based on container width */
            /* 
            Top:    Larger (scales 20px-60px)
            Right:  Standard (scales 15px-40px)
            Bottom: Larger (scales 20px-60px)
            Left:   Standard (scales 15px-40px)
            */
            padding: clamp(40px, 8cqw, 80px) clamp(15px, 6cqw, 80px) clamp(20px, 8cqw, 60px) clamp(15px, 6cqw, 60px);


            pointer-events: var(--viewer-pointer-events, auto); 
            
            font-family: 'Poiret One', system-ui, -apple-system, sans-serif; 
            color: #333;
            scrollbar-width: thin;
        }

        .layer-frame { 
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 2;
            object-fit: fill;
            pointer-events: none;
        }

        /* Typography */
        h1{font-size: clamp(20px, 4cqw, 28px); border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:20px;}
        h2{font-size: clamp(16px, 3cqw, 22px); color:#555; margin-top:24px; margin-bottom:8px;}
        p, li, span { font-size: clamp(14px, 2.5cqw, 18px); line-height: 1.6; }
        
        .job{margin-bottom:24px;}
        .job-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;}
        .role{font-weight:600;}
        .company{color:#666;}
        .period{font-size:0.9em;color:#888;}
        ul{padding-left:20px;margin-top:8px;}
        li{margin-bottom:6px;}

        /* Social Links */
        .social-links {
          display: flex;
          gap: 20px;
          margin-top: 24px;
          padding-bottom: 20px;
          width: 100%;
        }
        
        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #555;
          text-decoration: none;
          transition: all 0.2s ease;
          opacity: 0.8;
        }

        .social-link:hover {
          color: #000;
          transform: translateY(-2px);
          opacity: 1;
        }

        .social-link svg {
          width: 28px;
          height: 28px;
          fill: currentColor;
        }
      </style>
      
      <div class="wrap">
        <!-- Layer 1: The Screen Cutout (Background) -->
        ${cutoutObj ? `<img class="layer-cutout" src="${cutoutObj.src}" />` : ''}

        <!-- Layer 2: The Content (Middle) -->
        <div class="layer-content">
          ${this.renderContent()}
        </div>
        
        <!-- Layer 3: The Frame (Top) -->
        <img class="layer-frame" src="${frameObj.src}" />
      </div>
    `;
  }

  private renderContent(): string {
    const d = this._data;
    if (!d) return '';

    // For 'about' simple format
    if (d.text) {
      return this._renderAboutContent(d);
    }

    // For 'resume' structured format
    return this._renderResumeContent(d);
  }

  private _renderAboutContent(d: LaptopData): string {
    const bodyContent = Array.isArray(d.text)
      ? d.text.map(p => `<p>${DOMPurify.sanitize(p)}</p>`).join('')
      : `<p>${DOMPurify.sanitize(d.text as string)}</p>`;

    return `
      <h1>${escapeHtml(d.title || 'About Me')}</h1>
      <div class="body-text">
          ${bodyContent}
      </div>
      ${this._renderSocialLinks(d.links)}
    `;
  }

  private _renderResumeContent(d: LaptopData): string {
    const sectionsHtml = (d.sections || []).map(s => this._renderResumeSection(s)).join('');

    return `
      <h1>${escapeHtml(d.name || '')}</h1>
      <p style="margin-top:-16px;color:#666;margin-bottom:24px;">${escapeHtml(d.title || '')}</p>
      ${sectionsHtml}
      ${this._renderSocialLinks(d.links)}
    `;
  }

  private _renderResumeSection(section: ResumeSection): string {
    const items = (section.items || []).map(item => this._renderResumeItem(item)).join('');
    return `<h2>${escapeHtml(section.title || '')}</h2>${items}`;
  }

  private _renderResumeItem(item: ResumeItem): string {
    const highlightsHtml = this._renderHighlights(item.highlights);
    const descHtml = item.description ? `<p>${DOMPurify.sanitize(item.description)}</p>` : '';
    const companyHtml = item.company ? `<span class="company">@ ${escapeHtml(item.company)}</span>` : '';

    return `
      <div class="job">
        <div class="job-header">
          <div><span class="role">${escapeHtml(item.role || '')}</span> ${companyHtml}</div>
          <span class="period">${escapeHtml(item.period || '')}</span>
        </div>
        ${descHtml}
        ${highlightsHtml}
      </div>`;
  }

  private _renderHighlights(highlights?: string[]): string {
    if (!highlights?.length) return '';
    const items = highlights.map(h => `<li>${DOMPurify.sanitize(h)}</li>`).join('');
    return `<ul>${items}</ul>`;
  }

  private _renderSocialLinks(links?: SocialLink[]): string {
    if (!links?.length) return '';

    const icons: Record<string, string> = {
      github: '<svg viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/></svg>',
      linkedin: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    };

    const linksHtml = links.map(link => this._renderSocialLink(link, icons)).join('');

    return `
      <div class="social-links">
        ${linksHtml}
      </div>
    `;
  }

  private _renderSocialLink(link: SocialLink, icons: Record<string, string>): string {
    return `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="social-link" title="${escapeHtml(link.platform)}" aria-label="${escapeHtml(link.platform)}">
        ${icons[link.icon] || ''}
      </a>`;
  }
}

customElements.define('laptop-viewer', LaptopViewer);
