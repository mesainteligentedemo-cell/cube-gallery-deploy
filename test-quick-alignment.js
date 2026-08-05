const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  try {
    console.log('📡 Loading site...');
    const url = `https://www.victor-ia.com.mx?t=${Date.now()}`;
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    console.log('✓ Site loaded. Waiting for elements...');
    await page.waitForSelector('#s0 .quadrant.top-left', { timeout: 10000 });

    console.log('✓ Elements found. Checking alignment...\n');

    const results = await page.evaluate(() => {
      const results = [];
      const oddModules = [0, 2, 4, 6, 8, 10];

      for (const idx of oddModules) {
        const topLeft = document.querySelector(`#s${idx} .quadrant.top-left`);
        const topRight = document.querySelector(`#s${idx} .quadrant.top-right`);

        if (topLeft && topRight) {
          const tlBox = topLeft.getBoundingClientRect();
          const trBox = topRight.getBoundingClientRect();

          const aligned = Math.abs(tlBox.top - trBox.top) < 2;

          results.push({
            module: idx + 1,
            topLeftY: tlBox.top.toFixed(2),
            topRightY: trBox.top.toFixed(2),
            aligned: aligned ? '✓' : '✗',
            heightTL: tlBox.height.toFixed(0),
            heightTR: trBox.height.toFixed(0)
          });
        }
      }

      return results;
    });

    console.table(results);

    const allAligned = results.every(r => r.aligned === '✓');
    console.log(`\n${allAligned ? '✅ PERFECT: All odd modules aligned!' : '❌ Some modules still misaligned'}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();