const puppeteer = require('puppeteer');
const http = require('http-server');
const path = require('path');

(async () => {
  // Start HTTP server
  const server = http.createServer({
    root: path.resolve(__dirname, '..'),
    cache: -1
  });
  await new Promise((resolve) => server.listen(8091, resolve));
  console.log('Server started on port 8091');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8091/Nils/nils-presentation.html', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for page to be ready
  await new Promise(r => setTimeout(r, 1000));

  const screenshotDir = path.resolve(__dirname, 'screenshots');

  // Click to slide 2
  await page.click('body');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotDir, 'pres-slide2-v2.png'), fullPage: false });
  console.log('Slide 2 captured');

  // Click to slide 3
  await page.click('body');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotDir, 'pres-slide3-v2.png'), fullPage: false });
  console.log('Slide 3 captured');

  // Click to slide 4
  await page.click('body');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotDir, 'pres-slide4-v2.png'), fullPage: false });
  console.log('Slide 4 captured');

  await browser.close();
  server.close();
  console.log('Done!');
})();
