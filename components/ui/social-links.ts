import { SOCIAL_ICONS } from '../../utils/social-icons';

class SocialLinksFixed extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.render();
    }

    render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: flex;
                flex-direction: column;
                gap: clamp(8px, 1.5vmin, 20px);
                z-index: 100;
                align-items: center;
            }

            :host([layout="horizontal"]) {
                flex-direction: row;
                gap: 15px;
            }

            .social-link {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #555; /* Matches effect-controls color */
                text-decoration: none;
                transition: transform 0.3s ease, opacity 0.3s ease;
                opacity: 0.7;
            }

            .social-link:hover {
                transform: scale(1.1);
                opacity: 1;
            }

            .social-link svg {
                width: clamp(16px, 2.5vmin, 26px);
                height: clamp(16px, 2.5vmin, 26px);
                fill: currentColor;
            }
        </style>
        
        <a href="https://github.com/sahnsookyung" target="_blank" rel="noopener noreferrer" class="social-link" title="GitHub" aria-label="GitHub">
            ${SOCIAL_ICONS.github}
        </a>
        <a href="https://www.linkedin.com/in/soo-kyung-ahn-9a7aa012a/" target="_blank" rel="noopener noreferrer" class="social-link" title="LinkedIn" aria-label="LinkedIn">
            ${SOCIAL_ICONS.linkedin}
        </a>
        `;
    }
}

customElements.define('social-links-fixed', SocialLinksFixed);
