const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });

  // URL con cache buster
  const url = `https://www.victor-ia.com.mx?nocache=${Date.now()}`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const oddModules = [0, 2, 4, 6, 8, 10]; // Módulos nones: s0, s2, s4, s6, s8, s10
    const results = [];

    for (const idx of oddModules) {
      const sectionId = `s${idx}`;
      const moduleSelector = `#${sectionId} .module-wrapper`;
      const topLeftSelector = `#${sectionId} .quadrant.top-left`;
      const topRightSelector = `#${sectionId} .quadrant.top-right`;
      const textCardSelector = `#${sectionId} .quadrant.top-left .text-card`;

      try {
        const moduleBox = await page.locator(moduleSelector).boundingBox();
        const topLeftBox = await page.locator(topLeftSelector).boundingBox();
        const topRightBox = await page.locator(topRightSelector).boundingBox();
        const textCardBox = await page.locator(textCardSelector).boundingBox();

        const verticalAlignment = topLeftBox?.y === topRightBox?.y ? '✓ ALIGNED' : '✗ MISALIGNED';
        const textLeftPosition = textCardBox?.x || 0;
        const textLeftPercent = ((textLeftPosition / moduleBox.width) * 100).toFixed(1);

        results.push({
          module: `${idx + 1}`,
          topLeftY: topLeftBox?.y,
          topRightY: topRightBox?.y,
          alignment: verticalAlignment,
          textLeftPercent: `${textLeftPercent}%`,
          textCardX: textCardBox?.x,
          textCardWidth: textCardBox?.width,
        });

        console.log(`\n=== Módulo ${idx + 1} (s${idx}) ===`);
        console.log(`Top-left Y: ${topLeftBox?.y}, Top-right Y: ${topRightBox?.y}`);
        console.log(`Vertical Alignment: ${verticalAlignment}`);
        console.log(`Text position from left: ${textLeftPercent}% of module width`);
        console.log(`Text card bounds: x=${textCardBox?.x}, width=${textCardBox?.width}`);
      } catch (e) {
        console.log(`\n⚠️  Módulo ${idx + 1} — Error: ${e.message}`);
      }
    }

    console.log('\n========== SUMMARY ==========');
    console.table(results);

    // Verificar si TODOS los módulos están alineados
    const allAligned = results.every(r => r.alignment === '✓ ALIGNED');
    console.log(`\n✅ RESULT: ${allAligned ? 'ALL ODD MODULES PERFECTLY ALIGNED' : '❌ SOME MODULES STILL MISALIGNED'}`);

  } catch (error) {
    console.error('❌ Navigation error:', error.message);
  } finally {
    await browser.close();
  }
})();