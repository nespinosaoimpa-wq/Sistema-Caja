const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR STACK:', err.stack || err.toString());
  });

  try {
    await page.goto('http://localhost:3000/pos', { waitUntil: 'networkidle0' });
  } catch (err) {
    console.log('GOTO ERROR:', err);
  }
  
  await browser.close();
})();
