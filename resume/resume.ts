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
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizeInlineHtml(value: string): string {
    const template = document.createElement('template');
    template.innerHTML = DOMPurify.sanitize(value, { ADD_ATTR: ['target', 'rel'] });
    template.content.querySelectorAll('a').forEach((anchor) => {
        if (anchor.getAttribute('target')?.toLowerCase() !== '_blank') return;
        anchor.setAttribute('rel', 'noopener noreferrer');
    });
    return template.innerHTML;
}

function splitHighlights(highlights: string[] = []) {
    const links: string[] = [];
    const bullets: string[] = [];
    const stack: string[] = [];
    for (const highlight of highlights) {
        if (/<a[\s>]/i.test(highlight)) links.push(highlight);
        else if (highlight.startsWith('Tech Stack:')) stack.push(highlight.slice('Tech Stack:'.length).trim());
        else bullets.push(highlight);
    }
    return { links, bullets, stack };
}

function renderHighlights(highlights: string[] = []): string {
    return highlights.length
        ? `<ul class="highlights">${highlights.map(text => `<li>${sanitizeInlineHtml(text)}</li>`).join('')}</ul>`
        : '';
}

function renderProject(item: ResumeItem, index: number): string {
    const { links, bullets, stack } = splitHighlights(item.highlights);
    const name = escapeHtml(item.role || 'Project');
    return `
        <details class="project" id="project-${slugify(item.role || String(index))}" ${index === 0 ? 'open' : ''}>
            <summary class="project-summary" aria-labelledby="project-name-${index}">
                <span class="project-heading">
                    <span class="project-name" id="project-name-${index}">${name}</span>
                    <span class="disclosure-mark" aria-hidden="true"></span>
                </span>
                ${item.description ? `<span class="project-description">${sanitizeInlineHtml(item.description)}</span>` : ''}
            </summary>
            <div class="project-body">
                ${links.length ? `<div class="project-links">${links.map(sanitizeInlineHtml).join('')}</div>` : ''}
                ${renderHighlights(bullets)}
                ${stack.length ? `<p class="project-stack"><span>Built with</span> ${stack.map(sanitizeInlineHtml).join('; ')}</p>` : ''}
                ${item.company ? `<p>${escapeHtml(item.company)}</p>` : ''}
                ${item.period ? `<p class="entry-period">${escapeHtml(item.period)}</p>` : ''}
            </div>
        </details>
    `;
}

function renderEntry(item: ResumeItem): string {
    return `
        <article class="experience-entry">
            <div class="entry-heading">
                <div>
                    ${item.company ? `<p class="entry-company">${escapeHtml(item.company)}</p>` : ''}
                    ${item.role ? `<h3 class="entry-role">${escapeHtml(item.role)}</h3>` : ''}
                </div>
                ${item.period ? `<p class="entry-period">${escapeHtml(item.period)}</p>` : ''}
            </div>
            ${item.description ? `<p class="entry-description">${sanitizeInlineHtml(item.description)}</p>` : ''}
            ${renderHighlights(item.highlights)}
        </article>
    `;
}

function renderSkills(items: ResumeItem[]): string {
    return items.map(item => `
        ${item.description ? `<p class="skills-intro">${sanitizeInlineHtml(item.description)}</p>` : ''}
        <dl class="skill-list">
            ${(item.highlights || []).map(highlight => {
                const separator = highlight.indexOf(':');
                const label = separator < 0 ? 'Skills' : highlight.slice(0, separator);
                const detail = separator < 0 ? highlight : highlight.slice(separator + 1).trim();
                return `<div class="skill-group"><dt>${escapeHtml(label)}</dt><dd>${sanitizeInlineHtml(detail)}</dd></div>`;
            }).join('')}
        </dl>
    `).join('');
}

function renderSection(section: ResumeSection): string {
    const sectionId = slugify(section.title);
    const projects = sectionId === 'projects';
    const body = projects
        ? `<div id="project-list">${section.items.map(renderProject).join('')}</div>`
        : sectionId === 'technical-skills'
            ? renderSkills(section.items)
            : section.items.map(renderEntry).join('');

    return `
        <section id="${sectionId}" class="resume-section ${sectionId}" aria-labelledby="${sectionId}-title">
            <div class="section-heading">
                <h2 id="${sectionId}-title">${escapeHtml(section.title)}</h2>
                ${projects && section.items.length ? '<button class="text-button project-toggle" type="button" aria-controls="project-list">Expand all</button>' : ''}
            </div>
            ${section.items.length ? body : '<p class="empty-message">No entries to show yet.</p>'}
        </section>
    `;
}

function renderResume(data: ResumeData): string {
    const sections = data.sections || [];
    const summary = sections.find(section => section.title.toLowerCase() === 'summary');
    const mainSections = sections.filter(section => section.title.toLowerCase() !== 'summary');
    const name = escapeHtml(data.name || 'Resume');
    const links = (data.links || []).map(link => `
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.platform)}<span aria-hidden="true"> ↗</span></a>
    `).join('');

    return `
        <header class="site-header">
            <a class="portfolio-link" href="/" aria-label="Back to portfolio">sookyungahn.com</a>
            <div class="header-actions">
                ${links}
                ${data.pdfUrl ? `<a class="pdf-link" href="${escapeHtml(data.pdfUrl)}" download>Download PDF<span aria-hidden="true"> ↓</span></a>` : ''}
            </div>
        </header>

        <main id="main-content" tabindex="-1">
            <header class="masthead">
                <p class="document-label">Resume</p>
                <h1>${name}</h1>
                <p class="profession">${escapeHtml(data.title || 'Software Engineer')}</p>
            </header>

            <div class="document-layout">
                <aside class="document-index">
                    <nav aria-label="Resume sections">
                        ${mainSections.map(section => `<a href="#${slugify(section.title)}">${escapeHtml(section.title)}</a>`).join('')}
                    </nav>
                </aside>
                <div class="document-body">
                    ${summary?.items.map(item => item.description ? `<p class="introduction">${sanitizeInlineHtml(item.description)}</p>` : '').join('') || ''}
                    ${mainSections.length ? mainSections.map(renderSection).join('') : '<p class="empty-message">Resume details are not available yet.</p>'}
                </div>
            </div>
        </main>

        <footer class="site-footer">
            <p>${name}</p>
            <label class="appearance-control">Appearance
                <select id="appearance" aria-label="Color theme">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </label>
            <a href="#main-content">Back to top<span aria-hidden="true"> ↑</span></a>
        </footer>
    `;
}

function initializeInteractions(root: HTMLElement): () => void {
    const events = new AbortController();
    const options = { signal: events.signal };
    const projects = Array.from(root.querySelectorAll<HTMLDetailsElement>('.project'));
    const toggle = root.querySelector<HTMLButtonElement>('.project-toggle');
    const updateToggle = () => {
        if (toggle) toggle.textContent = projects.every(project => project.open) ? 'Collapse all' : 'Expand all';
    };
    toggle?.addEventListener('click', () => {
        const open = !projects.every(project => project.open);
        projects.forEach(project => { project.open = open; });
        updateToggle();
    }, options);
    projects.forEach(project => project.addEventListener('toggle', updateToggle, options));
    updateToggle();

    // Expand project permalinks, including those opened directly in a new tab.
    const revealHash = () => {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target instanceof HTMLDetailsElement && target.classList.contains('project')) target.open = true;
        target?.scrollIntoView();
    };
    window.addEventListener('hashchange', revealHash, options);
    if (window.location.hash) revealHash();

    const navigation = Array.from(root.querySelectorAll<HTMLAnchorElement>('.document-index a'));
    const visible = new Set<string>();
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
        });
        const active = [...navigation].reverse().find(link => visible.has(link.hash.slice(1)));
        if (!active) return;
        navigation.forEach(link => {
            if (link === active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }, { rootMargin: '-10% 0px -55% 0px' });
    root.querySelectorAll('.resume-section').forEach(section => observer.observe(section));

    const appearance = root.querySelector<HTMLSelectElement>('#appearance');
    const themeKey = 'resume-appearance';
    if (appearance) {
        try {
            const saved = localStorage.getItem(themeKey);
            if (saved === 'light' || saved === 'dark') appearance.value = saved;
        } catch { /* System appearance remains usable when storage is unavailable. */ }
        const applyAppearance = () => { document.documentElement.dataset.theme = appearance.value; };
        applyAppearance();
        appearance.addEventListener('change', () => {
            applyAppearance();
            try { localStorage.setItem(themeKey, appearance.value); } catch { /* The current page still updates. */ }
        }, options);
    }

    // Browser printing includes all project notes and then restores the reader's choices.
    let printState: boolean[] | undefined;
    window.addEventListener('beforeprint', () => {
        printState ??= projects.map(project => project.open);
        projects.forEach(project => { project.open = true; });
    }, options);
    window.addEventListener('afterprint', () => {
        if (!printState) return;
        projects.forEach((project, index) => { project.open = printState![index]; });
        printState = undefined;
    }, options);

    return () => { events.abort(); observer.disconnect(); };
}

let dispose = () => {};

async function init(): Promise<void> {
    const app = document.getElementById('resume-app');
    if (!app) return;
    dispose();
    try {
        const response = await fetch('/content/resume.json');
        if (!response.ok) throw new Error(`Failed to load resume content (${response.status})`);
        const data = (await response.json()) as ResumeData;
        app.innerHTML = renderResume(data);
        document.title = `${data.name || 'Resume'} | Resume`;
        dispose = initializeInteractions(app);
    } catch (error) {
        console.error(error);
        app.innerHTML = `
            <main id="main-content" class="resume-error" tabindex="-1">
                <p class="document-label">Resume</p>
                <h1>Unable to load the resume.</h1>
                <p>Please reload the page to try again.</p>
                <a href="/resume/">Reload resume</a>
                <a href="/">Back to portfolio</a>
            </main>
        `;
    }
}

window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
void init();
