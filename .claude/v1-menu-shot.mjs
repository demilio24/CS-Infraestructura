import puppeteer from 'puppeteer';
import path from 'path';

const file = 'file:///' + path.resolve('../Mandy_VeLUS_Design/v1.html').split(path.sep).join('/');
const outDir = path.resolve('./screenshots');

const browser = await puppeteer.launch({ headless: 'new' });
const p = await browser.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await p.goto(file, { waitUntil: 'networkidle0', timeout: 45000 });
await new Promise(r => setTimeout(r, 1200));

// Click hamburger to open menu
await p.click('#hamburger');
await new Promise(r => setTimeout(r, 800));
await p.screenshot({ path: outDir + '/v1-new-mobile-menu-open.png' });

await browser.close();
console.log('done');
