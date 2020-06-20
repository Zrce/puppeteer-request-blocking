# puppeteer-request-blocking

Puppeteer script which blocks every Javascript using Puppeteer's setRequestInterception and run a performance / web vitals tests

More about:
https://medium.com/@WillmannTobias/use-puppeteer-to-block-single-javascripts-for-speed-tests-200cecfb8790

# Install
npm install to install 
```
"fs": "0.0.1-security",
"mkdirp": "^1.0.4",
"puppeteer": "^3.3.0"
```

# How to run
Open index.js and setup the URL you want to test, some filename and the number of tests you want to run:

```javascript
const site = "https://www.blick.ch/community/bund-lockert-corona-massnahmen-laesst-du-die-korken-knallen-und-holst-jetzt-deine-hochzeitsfeier-nach-id15909552.html"
const filename = "blick-article-NEW3"
const runs = 10
```

Start the script with 
```
node index.js
```

# Results 
The script will create a folder 
```
/results/#your-filename#/
```

Within the folder you will find data.csv with the test results + screenshots. 
Screenshots are named by the file/Javascript which was request blocked. These Screenshots can be used for a first check if something is broken with the Script being blocked
