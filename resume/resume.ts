import DOMPurify from 'dompurify';

interface SocialLink {
    platform: string;
    url: string;
    icon: string;
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

interface ResumeData {
    name?: string;
    title?: string;
    pdfUrl?: string;
    sections?: ResumeSection[];
    links?: SocialLink[];
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeInlineHtml(value: string): string {
    return DOMPurify.sanitize(value, {
        ADD_ATTR: ['target', 'rel'],
    });
}

function splitHighlights(highlights: string[] = []): { links: string[]; bullets: string[] } {
    return highlights.reduce(
        (acc, entry) => {
            if (/<a[\s>]/i.test(entry)) {
                acc.links.push(entry);
            } else {
                acc.bullets.push(entry);
            }
            return acc;
        },
        { links: [], bullets: [] } as { links: string[]; bullets: string[] }
    );
}

function renderSocialLinks(links: SocialLink[] = []): string {
    return links
        .map((link) => {
            const label = escapeHtml(link.platform);
            const url = escapeHtml(link.url);
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        })
        .join('');
}

function renderSummaryCard(summarySection?: ResumeSection): string {
    const summaryItem = summarySection?.items?.[0];
    if (!summaryItem?.description) return '';

    return `
        <section class="summary-card" aria-labelledby="summary-card-title" data-reveal="2">
            <p class="summary-label">Overview</p>
            <p id="summary-card-title" class="summary-text">${sanitizeInlineHtml(summaryItem.description)}</p>
        </section>
    `;
}

function renderProjectLinks(links: string[]): string {
    if (!links.length) return '';

    const chips = links
        .map((link) => sanitizeInlineHtml(link).replace(/<a\b/i, '<a class="project-link-chip"'))
        .join('');

    return `<div class="entry-links">${chips}</div>`;
}

function renderHighlights(highlights: string[]): string {
    if (!highlights.length) return '';

    const items = highlights
        .map((highlight) => `<li>${sanitizeInlineHtml(highlight)}</li>`)
        .join('');

    return `<ul class="entry-highlights">${items}</ul>`;
}

function renderEntry(item: ResumeItem): string {
    const { links, bullets } = splitHighlights(item.highlights);
    const role = escapeHtml(item.role || '');
    const company = item.company ? `<span class="entry-company">${escapeHtml(item.company)}</span>` : '';
    const period = item.period ? `<span class="entry-period">${escapeHtml(item.period)}</span>` : '';
    const description = item.description
        ? `<p class="entry-description">${sanitizeInlineHtml(item.description)}</p>`
        : '';

    return `
        <article class="entry-card">
            <div class="entry-head">
                <div class="entry-title-group">
                    ${role ? `<h3 class="entry-role">${role}</h3>` : ''}
                    ${company}
                </div>
                ${period}
            </div>
            ${description}
            ${renderProjectLinks(links)}
            ${renderHighlights(bullets)}
        </article>
    `;
}

function renderSection(section: ResumeSection, index: number): string {
    const sectionId = slugify(section.title);
    const entries = (section.items || []).map(renderEntry).join('');
    const countLabel = `${section.items?.length || 0} ${section.items?.length === 1 ? 'entry' : 'entries'}`;

    return `
        <section id="${sectionId}" class="resume-section" aria-labelledby="${sectionId}-title" data-reveal="${Math.min(index + 2, 5)}">
            <div class="section-header">
                <div>
                    <h2 id="${sectionId}-title" class="section-title">${escapeHtml(section.title)}</h2>
                </div>
                <span class="section-count">${escapeHtml(countLabel)}</span>
            </div>
            <div class="section-stack">
                ${entries}
            </div>
        </section>
    `;
}

function renderNavigation(sections: ResumeSection[]): string {
    const visibleSections = sections.filter((section) => section.title.toLowerCase() !== 'summary');

    return visibleSections
        .map((section, index) => {
            const sectionId = slugify(section.title);
            return `
                <a href="#${sectionId}">
                    <span>${escapeHtml(section.title)}</span>
                    <span>${String(index + 1).padStart(2, '0')}</span>
                </a>
            `;
        })
        .join('');
}

function renderResume(data: ResumeData): string {
    const allSections = data.sections || [];
    const summarySection = allSections.find((section) => section.title.toLowerCase() === 'summary');
    const mainSections = allSections.filter((section) => section.title.toLowerCase() !== 'summary');
    const resumeTitle = escapeHtml(data.title || 'Software Engineer');
    const resumeName = escapeHtml(data.name || 'Resume');
    const pdfUrl = data.pdfUrl ? escapeHtml(data.pdfUrl) : '';

    return `
        <div class="resume-layout">
            <aside class="resume-rail" aria-label="Resume navigation">
                <section class="rail-panel" data-reveal="1">
                    <p class="rail-kicker">Sections</p>
                    <nav class="rail-nav">
                        ${renderNavigation(mainSections)}
                    </nav>
                </section>

                <section class="rail-panel" data-reveal="2">
                    <p class="rail-kicker">Quick Links</p>
                    <div class="rail-actions">
                        ${pdfUrl ? `<a class="action-link" href="${pdfUrl}" download>Download PDF</a>` : ''}
                        <a class="back-link" href="/">Back to Portfolio</a>
                    </div>
                </section>

                <section class="rail-panel" data-reveal="3">
                    <p class="rail-kicker">Profiles</p>
                    <div class="rail-links">
                        ${renderSocialLinks(data.links)}
                    </div>
                </section>
            </aside>

            <div class="resume-main">
                <header class="hero-panel" data-reveal="1">
                    <div class="hero-header">
                        <span class="eyebrow">Resume</span>
                        <h1 class="hero-title">${resumeName}</h1>
                        <p class="hero-subtitle">${resumeTitle}</p>
                        <div class="hero-actions">
                            ${pdfUrl ? `<a class="action-link" href="${pdfUrl}" download>Download Resume (PDF)</a>` : ''}
                        </div>
                    </div>
                </header>

                ${renderSummaryCard(summarySection)}
                ${mainSections.map((section, index) => renderSection(section, index)).join('')}
            </div>
        </div>
    `;
}

function renderError(message: string): void {
    const app = document.getElementById('resume-app');
    if (!app) return;

    app.innerHTML = `
        <section class="resume-error">
            <div>
                <h1>Resume unavailable</h1>
                <p>${escapeHtml(message)}</p>
            </div>
        </section>
    `;
}

async function init(): Promise<void> {
    const app = document.getElementById('resume-app');
    if (!app) return;

    try {
        const response = await fetch('/content/resume.json');
        if (!response.ok) {
            throw new Error(`Failed to load resume content (${response.status})`);
        }

        const data = (await response.json()) as ResumeData;
        app.innerHTML = renderResume(data);
        document.title = `${data.name || 'Resume'} | Resume`;
    } catch (error) {
        console.error(error);
        renderError('The resume content could not be loaded right now. Please try again shortly.');
    }
}

void init();
