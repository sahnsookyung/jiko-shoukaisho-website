/**
 * Creates and manages the effect toggle controls for Korean background and Event Horizon effects.
 * @param {Object} watermarkCtrl - Controller for the Korean background watermark effect
 * @param {Object} horizonCtrl - Controller for the Event Horizon effect
 * @returns {HTMLElement} The container element with toggle controls
 */
export function createEffectControls(watermarkCtrl, horizonCtrl) {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed; top: 50%; left: 20px; transform: translateY(-50%);
        display: flex; flex-direction: column; gap: 10px; z-index: 0;
        font-family: sans-serif;

        /* center all children */
        align-items: center;
        text-align: center;
    `;

    const heading = document.createElement('div');
    heading.innerHTML = 'Effect<br>Control'; // stacked text
    heading.style.cssText = `
        font-size: 10px;
        font-weight: 600;
        color: #bb7422ff;
        margin-bottom: 5px;
        line-height: 1.05;
    `;
    container.appendChild(heading);

    const createToggle = (symbol, label, onClick, initialState = true) => {
        const btn = document.createElement('div');
        btn.innerHTML = symbol;
        btn.title = label;
        btn.style.cssText = `
            font-size: 28px; cursor: pointer; user-select: none;
            opacity: ${initialState ? '1' : '0.6'};
            transition: opacity 0.5s; color: #bb7422ff;
        `;
        let active = initialState;
        btn.addEventListener('click', () => {
            active = !active;
            btn.style.opacity = active ? '0.9' : '0.3';
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

    return container;
}
