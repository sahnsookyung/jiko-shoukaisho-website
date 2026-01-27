export const isSafari = (): boolean => {
    if (typeof navigator === 'undefined') return false;

    // Check for Safari
    // Safari's user agent contains "Safari" and does not contain "Chrome" (Chrome has both)
    const ua = navigator.userAgent;
    const isSafari = ua.includes('Safari') && !ua.includes('Chrome');

    return isSafari;
};
