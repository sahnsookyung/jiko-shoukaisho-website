export const contentMap = {
    laptop: {
        id: 'laptop',
        label: 'Resume & Experience',
        description: 'View my professional background',
        type: 'resume',
        containerSVG: 'laptop-frame',
        cutoutSVG: 'laptop-screen-cutout',
        contentPath: 'assets/content/resume.json',
        component: 'laptop-viewer'
    },

    philosopher: {
        id: 'philosopher',
        label: 'Thoughts & Reflections',
        description: 'Read my thoughts page-by-page',
        type: 'thoughts',
        containerSVG: 'book',
        contentPath: 'assets/content/thoughts/index.json',
        component: 'thought-viewer'
    },

    'iceland-mountains': {
        id: 'iceland-mountains',
        label: 'Iceland Adventure',
        description: 'Photos from Iceland',
        type: 'gallery',
        containerSVG: 'camera-viewfinder-2',
        contentPath: 'assets/content/travel/iceland/index.json',
        component: 'gallery-viewer'
    },

    europe: {
        id: 'europe',
        label: 'Europe',
        description: 'Photos from Europe',
        type: 'gallery',
        containerSVG: 'camera-viewfinder-2',
        contentPath: 'assets/content/travel/europe/index.json',
        component: 'gallery-viewer'
    },

    japan: {
        id: 'japan',
        label: 'Japan',
        description: 'Photos from Japan',
        type: 'gallery',
        containerSVG: 'camera-viewfinder-2',
        contentPath: 'assets/content/travel/japan/index.json',
        component: 'gallery-viewer'
    },

    'plane-skydiver': {
        id: 'plane-skydiver',
        label: 'Skydiving',
        description: 'Photos from the sky',
        type: 'gallery',
        containerSVG: 'camera-viewfinder-2',
        contentPath: 'assets/content/travel/skydiving/index.json',
        component: 'gallery-viewer'
    },

    scroll: {
        id: 'scroll',
        label: 'Timeline',
        description: 'A scroll-based story carousel',
        type: 'timeline',
        containerSVG: 'scroll',
        contentPath: 'assets/content/timeline.json',
        component: 'timeline-viewer'
    },

    person: {
        id: 'person',
        label: 'About Me',
        description: 'A short intro',
        type: 'about',
        containerSVG: 'laptop-frame',
        cutoutSVG: 'laptop-screen-cutout',
        contentPath: 'assets/content/about.json',
        component: 'laptop-viewer'
    }
};

export function getContentConfig(id) {
    return contentMap[id] || null;
}
