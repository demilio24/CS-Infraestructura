const puppeteer = require('puppeteer');
const path = require('path');

const pages = [
  {
    html: path.resolve(__dirname, '..', 'Nils', 'funnel', 'vsl.html'),
    pdf: path.resolve(__dirname, '..', 'Nils', 'funnel', 'vsl.pdf'),
  },
  {
    html: path.resolve(__dirname, '..', 'Nils', 'funnel', 'review.html'),
    pdf: path.resolve(__dirname, '..', 'Nils', 'funnel', 'review.pdf'),
  },
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });

  for (const { html, pdf } of pages) {
    console.log(`Processing: ${html}`);
    const page = await browser.newPage();

    await page.setViewport({ width: 1400, height: 900 });

    const fileUrl = 'file:///' + html.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // Extra delay for fonts / animations to settle
    await new Promise(r => setTimeout(r, 2000));

    // Measure full page height
    const bodyHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
    });

    console.log(`  Page height: ${bodyHeight}px`);

    // Inject print CSS to avoid any page-break artifacts
    await page.addStyleTag({
      content: `
        @media print {
          * {
            page-break-inside: avoid !important;
            page-break-before: auto !important;
            page-break-after: auto !important;
            break-inside: avoid !important;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
        }
      `,
    });

    // Export as a single continuous page
    await page.pdf({
      path: pdf,
      printBackground: true,
      width: '8.27in',
      height: `${bodyHeight}px`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log(`  Saved: ${pdf}`);
    await page.close();
  }

  await browser.close();
  console.log('Done — both PDFs exported.');
})();
