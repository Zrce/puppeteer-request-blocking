
//LCP https://gist.github.com/addyosmani/c053f68aead473d7585b45c9e8dce31e
const calcLCP = () => {
    window.largestContentfulPaint = 0;

    const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            observer.takeRecords();
            observer.disconnect();
            console.log('LCP:', window.largestContentfulPaint);
        }
    });
}

module.exports = {
    calcLCP
};
