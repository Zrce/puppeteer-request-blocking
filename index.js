//Config 
const site = "https://www.blick.ch/community/bund-lockert-corona-massnahmen-laesst-du-die-korken-knallen-und-holst-jetzt-deine-hochzeitsfeier-nach-id15909552.html"
const filename = "blick-article-NEW4"
const runs = 10

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const nexus5 = devices.devicesMap['Nexus 5'];
const fs = require("fs");
const mkdirp = require('mkdirp');

const { getJsUrls } = require("./getUrls");
const { getTimeFromPerformanceMetrics, extractDataFromPerformanceMetrics, } = require("./helpers");
const { calcLCP } = require("./lcp");
const { calcJank } = require("./cls");

let lcpAllRequest = 0
let clsAllRequest = 0
let scriptDurationAllRequest = 0

//Setup connection throttling
const okConnection = {
    'offline': false,
    'downloadThroughput': 5 * 1024 * 1024 / 8,
    'uploadThroughput': 4 * 1024 * 1024 / 8,
    'latency': 40
};

//Run withozt the JS file passed
const runWithout = async (without) => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        timeout: 10000
    });

    const page = await browser.newPage()
    //Emulated Phone
    await page.emulate(nexus5);

    //Request Interception: Block the URL in "without"
    if (without !== false) {
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().includes(without.url)) {
                interceptedRequest.abort();
            } else {
                interceptedRequest.continue();
            }
        });
    }

    //Access Chrome DevTools Protocol
    const client = await page.target().createCDPSession()

    await client.send('Network.enable');
    await client.send('Network.clearBrowserCache');
    await client.send('Performance.enable');
    await client.send('ServiceWorker.enable');
    await client.send('Network.emulateNetworkConditions', okConnection);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    //Cache disabled
    await page.setCacheEnabled(false);

    //LCP / CLS
    await page.evaluateOnNewDocument(calcLCP);
    await page.evaluateOnNewDocument(calcJank);

    await page.goto(site, { waitUntil: 'load', timeout: 60000 }); //Is networkidle2 really needed here .... 
    await page.waitFor(10000)

    let lcp = await page.evaluate(() => { return window.largestContentfulPaint; });
    let cls = await page.evaluate(() => { return window.cumulativeLayoutShiftScore; });

    //Scripting Duration 
    const metrics = await client.send('Performance.getMetrics');
    const scriptDuration = getTimeFromPerformanceMetrics(metrics, 'ScriptDuration')

    //Screenshot
    if(without.file !== undefined) {
        await page.screenshot({ path: 'results/' + filename + '/' + without.file + '.png' });
    }

    await browser.close();

    //Output
    if (without !== false) {
        console.log('WITHOUT ' + without.file)
        console.log('LCP --------------------> ' + lcp.toFixed(2));
        console.log('CLS --------------------> ' + cls.toFixed(4));
        console.log('ScriptDuration ---------> ' + scriptDuration.toFixed(2));
        await fs.appendFile('results/' + filename + '/data.csv', site + ', ' + without.url + ', ' + without.async + ', ' + without.defer + ', ' + lcp.toFixed(2) + ', ' + cls.toFixed(2) + ', ' + scriptDuration.toFixed(4) + '\r\n', function (err) {
            if (err) throw err;
        });
        console.log("==============================================")
    } else {
        console.log('With no request blocked')
        //set all Requests KPIs
        lcpAllRequest = lcp
        clsAllRequest = cls
        scriptDurationAllRequest = scriptDuration
        console.log('LCP --------------------> ' + lcp.toFixed(2));
        console.log('CLS --------------------> ' + cls.toFixed(4));
        console.log('ScriptDuration ---------> ' + scriptDuration.toFixed(2));
        await fs.appendFile('results/' + filename + '/data.csv', site + ', nothing blocked, -, -,' + lcp.toFixed(2) + ', ' + cls.toFixed(4) + ', ' + scriptDuration.toFixed(2) + '\r\n', function (err) {
            if (err) throw err;
        });
        console.log("==============================================")
    }
};

//Start
const start = async () => {

    //Creat folder 
    await fs.promises.mkdir('results/' + filename, { recursive: true })

    //data.csv column names if file does not already exist
    if (!fs.existsSync('results/' + filename + '/data.csv')) {
        await fs.appendFile('results/' + filename + '/data.csv', 'Site, Blocked URL, Async, Defer, LCP, CLS, Script Duration\r\n', function (err) {
            if (err) throw err;
        });
    }

    //10 runs??? 
    for (let i = 0; i < runs; i++) {
        //Get JS Ressource URLs
        const jsUrls = await getJsUrls(site)

        console.log("############################################## Run: " + i + " for " + site)

        try {
            await runWithout(false)
        } catch (error) {
            //console.log(error)
        }

        //Test without all of them
        for (let index = 0; index < jsUrls.length; index++) {
            try {
                await runWithout(jsUrls[index])
            } catch (error) {
                //console.log(error)
            }
        }
    }
}

start()