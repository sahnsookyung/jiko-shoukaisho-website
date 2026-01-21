import DOMPurify from 'dompurify';
import { processSvgForImg } from './utils/frame-svg';
import { escapeHtml } from '../../utils/string-utils';
import { SOCIAL_ICONS } from '../../utils/social-icons';

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

    const linksHtml = links.map(link => this._renderSocialLink(link)).join('');

    return `
      <div class="social-links">
        ${linksHtml}
      </div>
    `;
  }

  private _renderSocialLink(link: SocialLink): string {
    return `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="social-link" title="${escapeHtml(link.platform)}" aria-label="${escapeHtml(link.platform)}">
        ${SOCIAL_ICONS[link.icon] || ''}
      </a>`;
  }
}

customElements.define('laptop-viewer', LaptopViewer);
