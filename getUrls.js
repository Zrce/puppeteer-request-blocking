const puppeteer = require('puppeteer');

//Collect the JS Files
const getJsUrls = async (site) => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        devtools: true
    });

    const page = await browser.newPage();

    //Get js files from interceptedRequest
    const jsUrls = []
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().includes(".js")) {
            let url = interceptedRequest.url()
            let file = url.match("([^\/]+[^\/]|[^\/]+[\/])$")[0].split("?")[0];
            jsUrls.push({ 'url': url, 'file': file, 'async': '?', 'defer': '?' })
        }
        interceptedRequest.continue();
    });

    await page.goto(site, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitFor(10000)

    //Get all script tags on page to check for async / defer
    const scriptsOnPage = await page.$$eval('script', el => el.map(o => o.getAttribute('src')))

    for (let [i, src] of scriptsOnPage.entries()) {
        
        const async = await page.evaluate(el => el.async, (await page.$$('script'))[i])
        const defer = await page.evaluate(el => el.defer, (await page.$$('script'))[i])
        try {
            const file = src.match("([^\/]+[^\/]|[^\/]+[\/])$")[0].split("?")[0];
            const indexInJsUrls = jsUrls.findIndex(x => (x.file).search(file) >= 0); 
            let oldObj = jsUrls[indexInJsUrls]
            oldObj.async = async
            oldObj.defer = defer
            jsUrls[indexInJsUrls] = oldObj
        } catch (error) {
            console.log("No async / defer info for " + src)
        }
    }

    await browser.close();
    return jsUrls
};

module.exports = {
    getJsUrls
};