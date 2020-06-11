const puppeteer = require('puppeteer');

//Collect the JS Files
const getJsUrls = async (site) => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        devtools: true
    });

    const page = await browser.newPage();

    const jsUrls = []
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().includes(".js") && !interceptedRequest.url().includes('assets')) {  //assets is unique to internal scripts of blick
            const url = interceptedRequest.url()
            jsUrls.push({ 'url': url })
        }
        interceptedRequest.continue();
    });

    await page.goto('https://www.' + site, { waitUntil: 'networkidle0', timeout: 60000 });

    //Get all script on page to check for async / defer
    const scriptsOnPage = await page.$$eval('script', el => el.map(o => o.getAttribute('src')))

    for (const [i, src] of scriptsOnPage.entries()) {
        const async = await page.evaluate(el => el.async, (await page.$$('script'))[i])
        const defer = await page.evaluate(el => el.defer, (await page.$$('script'))[i])
        if(src !== null) {
            const urlAsyncDefer = { 'url': src, 'async': async, 'defer': defer}
            const indexInJsUrls = jsUrls.findIndex(x => x.url === src); //this should maybe be wildcard search
            jsUrls[indexInJsUrls] = urlAsyncDefer
        }
    }

    await browser.close();
    return jsUrls
};

module.exports = {
    getJsUrls
};