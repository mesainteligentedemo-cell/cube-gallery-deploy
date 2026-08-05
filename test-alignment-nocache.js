const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const viewport = { width: 1400, height: 800 };
  await page.setViewportSize(viewport);

  // Forzar recarga sin caché
  await page.goto('https://www.victor-ia.com.mx?t=' + Date.now(), { waitUntil: 'networkidle' });

  const oddModules = [0, 2, 4, 6, 8, 10];

  for (const idx of oddModules) {
    const selector = `#s${idx}`;
    const section = await page.$(selector);

    if (section) {
      const box = await section.boundingBox();
      const textCard = await page.$(`${selector} .text-card`);
      const textCardBox = await textCard?.boundingBox();

      console.log(`\n=== Módulo ${idx + 1} (s${idx}) ===`);
      console.log(`Section: x=${box.x}, width=${box.width}`);
      console.log(`Text-card: x=${textCardBox?.x || 0}, width=${textCardBox?.width || 0}`);

      const textX = textCardBox?.x || 0;
      const sectionWidth = box.width;
      const percentFromLeft = (textX / 1400) * 100;

      console.log(`Posición: ${percentFromLeft.toFixed(1)}% desde la izquierda`);
      console.log(textX < 300 ? '✓ CORRECTO (a la izquierda)' : '✗ INCORRECTO (centrado)');
    }
  }

  await browser.close();
})();