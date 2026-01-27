/**
 * Controller interface for effects.
 */
interface EffectController {
    start(): void;
    stop(): void;
}

/**
 * Creates and manages the effect toggle controls for Korean background and Event Horizon effects.
 * @param {EffectController} watermarkCtrl - Controller for the Korean background watermark effect
 * @param {EffectController} horizonCtrl - Controller for the Event Horizon effect
 * @returns {HTMLElement} The container element with toggle controls
 */
export function createEffectControls(
    watermarkCtrl: EffectController | undefined,
    horizonCtrl: EffectController | undefined
): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex; flex-direction: column; gap: clamp(4px, 1vmin, 10px); z-index: 0;
        font-family: sans-serif;
        align-items: center;
        text-align: center;
    `;



    const heading = document.createElement('div');
    heading.innerHTML = 'Effect<br>Control'; // stacked text
    heading.style.cssText = `
        font-size: clamp(7px, 1vmin, 10px);
        font-weight: 600;
        color: #bb7422ff;
        margin-bottom: clamp(1px, 0.5vmin, 5px);
        line-height: 1.05;
    `;
    container.appendChild(heading);

    const createToggle = (symbol: string, label: string, onClick: (active: boolean) => void, initialState = true): HTMLElement => {
        const btn = document.createElement('div');
        btn.innerHTML = symbol;
        btn.title = label;
        btn.style.cssText = `
            font-size: clamp(18px, 3.5vmin, 28px); cursor: pointer; user-select: none;
            opacity: ${initialState ? '0.9' : '0.6'};
            transition: opacity 0.5s; color: #bb7422ff;
        `;
        let active = initialState;
        btn.addEventListener('click', () => {
            active = !active;
            btn.style.opacity = active ? '0.9' : '0.6';
            onClick(active);
        });
        return btn;
    };

    const toggleWatermark = createToggle('㉿', 'Toggle Korean background effect (on, off)', (active) => {
        active ? watermarkCtrl?.start() : watermarkCtrl?.stop();
    });

    const toggleEventHorizon = createToggle('⦵', 'Toggle event horizon effect (on, off)', (active) => {
        active ? horizonCtrl?.start() : horizonCtrl?.stop();
    });

    container.appendChild(toggleWatermark);
    container.appendChild(toggleEventHorizon);

    const updateLayout = () => {
        const isHorizontal = container.getAttribute('layout') === 'horizontal';
        container.style.flexDirection = isHorizontal ? 'row' : 'column';
        container.style.gap = isHorizontal ? '20px' : 'clamp(4px, 1vmin, 10px)';
        heading.style.display = isHorizontal ? 'none' : 'block';
    };

    const observer = new MutationObserver(updateLayout);
    observer.observe(container, { attributes: true, attributeFilter: ['layout'] });
    updateLayout(); // Initial run

    return container;
}
