const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });

  await page.goto(`https://www.victor-ia.com.mx?nocache=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Screenshot del módulo 01
  const section = await page.$('#s0');
  const box = await section.boundingBox();

  await page.screenshot({
    path: './screenshot-s0.png',
    fullPage: false
  });

  console.log('Screenshot saved: screenshot-s0.png');
  console.log('Section bounds:', box);

  await browser.close();
})();