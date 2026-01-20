// components/korean-words-bg/korean-words-bg.ts

// Ancient words configuration
const koreanWords: string[] = [
    "하늘", "땅", "바람", "구름", "별", "달", "해",
    "왕국", "전설", "역사", "기억", "영원", "시간",
    "사랑", "운명", "약속", "평화", "희망", "꿈",
    "검", "방패", "전사", "영웅", "용기",
    "눈물", "미소", "아침", "노을", "바다", "강",
    "달빛", "불꽃", "그림자", "메아리", "천하", "만세"
];

const config = {
    fontSize: 26,
    baseSpeed: 120
};

interface WatermarkController {
    start: () => void;
    stop: () => void;
}

export function initWatermark(): WatermarkController {
    let resizeListener: (() => void) | null = null;
    let intervals: ReturnType<typeof setInterval>[] = [];
    let activeTimeouts: ReturnType<typeof setTimeout>[] = [];

    const stop = () => {
        const container = document.getElementById('ancient-bg');
        if (container) container.innerHTML = '';

        if (resizeListener) {
            window.removeEventListener('resize', resizeListener);
            resizeListener = null;
        }

        intervals.forEach(id => clearInterval(id));
        intervals = [];

        activeTimeouts.forEach(id => clearTimeout(id));
        activeTimeouts = [];
    };

    const start = () => {
        const container = document.getElementById('ancient-bg');
        if (!container) return;

        // Clear and rebuild
        stop(); // Ensure clean slate

        container.innerHTML = '';
        const width = window.innerWidth;
        const height = window.innerHeight;
        const colCount = Math.floor(width / config.fontSize);

        for (let i = 0; i < colCount; i++) {
            createColumn(container, height);
        }

        // Handle Resize
        resizeListener = () => {
            container.innerHTML = '';
            // Clear existing intervals on resize to prevent piling up
            intervals.forEach(clearInterval);
            intervals = [];
            activeTimeouts.forEach(clearTimeout);
            activeTimeouts = [];

            const newColCount = Math.floor(window.innerWidth / config.fontSize);
            for (let i = 0; i < newColCount; i++) {
                createColumn(container, window.innerHeight);
            }
        };
        window.addEventListener('resize', resizeListener);
    };

    function createColumn(container: HTMLElement, screenHeight: number) {
        const col = document.createElement('div');
        col.classList.add('bg-column');
        col.style.fontSize = config.fontSize + "px";
        col.style.width = config.fontSize + "px";

        // Randomize speed
        const speedMod = Math.random() * 0.7 + 0.8;
        const columnChars: HTMLElement[] = [];
        let currentHeight = 0;
        let safety = 0;

        // Fill column
        while (currentHeight < screenHeight + 100 && safety < 100) {
            const word = koreanWords[Math.floor(Math.random() * koreanWords.length)];

            for (let char of word) {
                const span = document.createElement('span');
                span.classList.add('bg-char');
                span.innerText = char;
                col.appendChild(span);
                columnChars.push(span);
            }

            const spacer = document.createElement('span');
            spacer.classList.add('bg-char', 'word-spacer');
            spacer.innerHTML = '&nbsp;';
            col.appendChild(spacer);
            columnChars.push(spacer);

            currentHeight += (word.length + 1) * config.fontSize * 1.2;
            safety++;
        }

        container.appendChild(col);
        startRainEffect(columnChars, speedMod);
    }

    function startRainEffect(chars: HTMLElement[], speedMod: number) {
        let activeIndex = 0;
        const startDelay = Math.random() * 6000;

        const timeoutId = setTimeout(() => {
            const intervalId = setInterval(() => {
                if (activeIndex < chars.length) {
                    chars[activeIndex].classList.add('glowing');

                    // Trail cleanup
                    let prevIndex = activeIndex - 1;
                    if (prevIndex >= 0) chars[prevIndex].classList.remove('glowing');

                    let prevIndex2 = activeIndex - 2;
                    if (prevIndex2 >= 0) chars[prevIndex2].classList.remove('glowing');
                } else {
                    let lastIndex = activeIndex - 1;
                    if (lastIndex >= 0 && lastIndex < chars.length) {
                        chars[lastIndex].classList.remove('glowing');
                    }
                }

                activeIndex++;
                if (activeIndex > chars.length + 5) activeIndex = 0;

            }, config.baseSpeed * speedMod);

            intervals.push(intervalId);
        }, startDelay);

        activeTimeouts.push(timeoutId);
    }

    // Auto-start on init if desired, or let consumption code handle it.
    start();

    return { start, stop };
}
