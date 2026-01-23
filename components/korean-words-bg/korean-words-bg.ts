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
    baseSpeed: 120,
    columnSpacing: 2 // Reduce density by spacing columns
};

interface WatermarkController {
    start: () => void;
    stop: () => void;
}

interface Column {
    element: HTMLElement;
    chars: HTMLElement[];
    activeIndex: number;
    speed: number;
    lastUpdate: number;
}

export function initWatermark(): WatermarkController {
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    let animationFrameId: number | null = null;
    let columns: Column[] = [];
    let lastFrameTime = 0;
    let handleResize: (() => void) | null = null;

    const stop = () => {
        const container = document.getElementById('ancient-bg');
        if (container) container.innerHTML = '';

        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
            resizeTimeout = null;
        }

        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (handleResize) {
            window.removeEventListener('resize', handleResize);
            handleResize = null;
        }

        columns = [];
    };

    // Single animation loop for all columns
    const animate = (currentTime: number) => {
        if (!lastFrameTime) lastFrameTime = currentTime;

        // Update each column based on its individual speed
        columns.forEach(col => {
            const timeSinceLastUpdate = currentTime - col.lastUpdate;

            if (timeSinceLastUpdate >= col.speed) {
                // Update this column's active character
                if (col.activeIndex >= 0 && col.activeIndex < col.chars.length) {
                    // Add glow to current character
                    col.chars[col.activeIndex].style.opacity = '1';

                    // Fade out previous characters
                    const prev1 = col.activeIndex - 1;
                    if (prev1 >= 0) {
                        col.chars[prev1].style.opacity = '0.6';
                    }

                    const prev2 = col.activeIndex - 2;
                    if (prev2 >= 0) {
                        col.chars[prev2].style.opacity = '0';
                    }
                }

                // Clean up trailing glow when past the end
                if (col.activeIndex >= col.chars.length) {
                    const lastIndex = col.activeIndex - 1;
                    if (lastIndex >= 0 && lastIndex < col.chars.length) {
                        col.chars[lastIndex].style.opacity = '0';
                    }
                }

                col.activeIndex++;

                // Reset column when animation completes
                if (col.activeIndex > col.chars.length + 5) {
                    // Reset all chars to invisible
                    col.chars.forEach(char => char.style.opacity = '0');
                    col.activeIndex = 0;
                }

                col.lastUpdate = currentTime;
            }
        });

        lastFrameTime = currentTime;
        animationFrameId = requestAnimationFrame(animate);
    };

    const start = () => {
        const container = document.getElementById('ancient-bg');
        if (!container) return;

        // Clear and rebuild
        stop();

        container.innerHTML = '';
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Reduce column count for better performance
        const colCount = Math.floor(width / (config.fontSize * config.columnSpacing));

        for (let i = 0; i < colCount; i++) {
            createColumn(container, height);
        }

        // Start single animation loop
        lastFrameTime = 0;
        animationFrameId = requestAnimationFrame(animate);

        // Debounced resize handler
        handleResize = () => { // Assign the function to the declared variable
            if (resizeTimeout) clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
                container.innerHTML = '';
                columns = [];

                const newColCount = Math.floor(window.innerWidth / (config.fontSize * config.columnSpacing));
                for (let i = 0; i < newColCount; i++) {
                    createColumn(container, window.innerHeight);
                }
            }, 100); // Wait 100ms after resize stops
        };

        window.addEventListener('resize', handleResize);
    };

    function createColumn(container: HTMLElement, screenHeight: number) {
        const col = document.createElement('div');
        col.classList.add('bg-column');
        col.style.fontSize = config.fontSize + "px";
        col.style.width = config.fontSize + "px";

        // Randomize speed for variety
        const speedMod = Math.random() * 0.7 + 0.8;
        const columnChars: HTMLElement[] = [];
        let currentHeight = 0;
        let safety = 0;

        // Fill column with characters
        while (currentHeight < screenHeight + 100 && safety < 100) {
            const word = koreanWords[Math.floor(Math.random() * koreanWords.length)];

            for (let char of word) {
                const span = document.createElement('span');
                span.classList.add('bg-char');
                span.textContent = char;

                // Use opacity for GPU-accelerated animation
                span.style.opacity = '0';
                span.style.transition = 'opacity 0.3s ease';

                col.appendChild(span);
                columnChars.push(span);
            }

            const spacer = document.createElement('span');
            spacer.classList.add('bg-char', 'word-spacer');
            spacer.innerHTML = '&nbsp;';
            spacer.style.opacity = '0';
            col.appendChild(spacer);
            columnChars.push(spacer);

            currentHeight += (word.length + 1) * config.fontSize * 1.2;
            safety++;
        }

        container.appendChild(col);

        // Add to columns array with randomized starting position
        // Each column starts at a random point in its cycle for natural staggering
        const randomStartIndex = Math.floor(Math.random() * (columnChars.length + 10));

        columns.push({
            element: col,
            chars: columnChars,
            activeIndex: randomStartIndex, // Random starting position
            speed: config.baseSpeed * speedMod,
            lastUpdate: performance.now()
        });
    }

    // Auto-start on init if desired, or let consumption code handle it.
    start();

    return { start, stop };
}
