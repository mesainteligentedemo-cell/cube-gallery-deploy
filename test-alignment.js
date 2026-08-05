const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const viewport = { width: 1400, height: 800 };
  await page.setViewportSize(viewport);

  await page.goto('https://www.victor-ia.com.mx', { waitUntil: 'networkidle' });

  // Verificar módulos nones (1, 3, 5, 7, 9, 11)
  const oddModules = [0, 2, 4, 6, 8, 10]; // s0, s2, s4, s6, s8, s10

  for (const idx of oddModules) {
    const selector = `#s${idx}`;
    const section = await page.$(selector);

    if (section) {
      const box = await section.boundingBox();
      const textCard = await page.$(`${selector} .text-card`);
      const textCardBox = await textCard?.boundingBox();

      console.log(`\n=== Módulo ${idx + 1} (s${idx}) ===`);
      console.log(`Section bounds:`, box);
      console.log(`Text-card bounds:`, textCardBox);

      // Screenshot
      await page.screenshot({
        path: `./screenshots/modulo-${idx + 1}.png`,
        clip: { x: box.x, y: box.y, width: box.width, height: box.height }
      });
      console.log(`Screenshot saved: modulo-${idx + 1}.png`);

      // Verificar si el texto está a la izquierda
      const textX = textCardBox?.x || 0;
      const sectionWidth = box.width;
      const isLeft = textX < sectionWidth * 0.4;

      console.log(`Text position: ${isLeft ? 'LEFT ✓' : 'CENTERED ✗ (need to fix)'}`);
    }
  }

  await browser.close();
})();