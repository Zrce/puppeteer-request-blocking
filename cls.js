//CLS https://gist.github.com/martinschierle/0b43f3a56da39aa5aa8f8f9dc431f903
const calcJank = () => {
    window.cumulativeLayoutShiftScore = 0;

    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
                console.log("New observer entry for cls: " + entry.value);
                window.cumulativeLayoutShiftScore += entry.value;
            }
        }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            observer.takeRecords();
            observer.disconnect();
            console.log('CLS:', window.cumulativeLayoutShiftScore);
        }
    });
}

module.exports = {
    calcJank
};
