const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });

  const url = `https://www.victor-ia.com.mx?nocache=${Date.now()}`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const oddModules = [0, 2, 4, 6, 8, 10];

    for (const idx of oddModules) {
      const sectionSelector = `#s${idx}`;
      const section = await page.$(sectionSelector);

      if (section) {
        const filename = `screenshot-odd-module-${idx + 1}.png`;
        await page.screenshot({ path: filename, clip: await section.boundingBox() });
        console.log(`✓ Screenshot saved: ${filename}`);
      }
    }

    console.log('\n✅ All odd module screenshots captured');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();