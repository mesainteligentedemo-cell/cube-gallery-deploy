const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--disable-web-resources', '--disable-extensions-except=']
  });
  const page = await browser.newPage({
    ignoreHTTPSErrors: true
  });

  // Deshabilitar caché
  await page.context().clearCookies();
  await page.route('**/*', (route) => {
    const response = route.continue();
    return response;
  });

  const viewport = { width: 1400, height: 800 };
  await page.setViewportSize(viewport);

  // URL con timestamp agresivo
  const url = `https://www.victor-ia.com.mx?nocache=${Date.now()}&rand=${Math.random()}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Esperar a que el CSS se aplique
  await page.waitForTimeout(2000);

  const oddModules = [0, 2, 4, 6, 8, 10];

  for (const idx of oddModules) {
    const selector = `#s${idx}`;
    const section = await page.$(selector);

    if (section) {
      const box = await section.boundingBox();
      const textCard = await page.$(`${selector} .text-card`);
      const textCardBox = await textCard?.boundingBox();

      console.log(`\n=== Módulo ${idx + 1} ===`);
      console.log(`Text-card: x=${textCardBox?.x || 0}, width=${textCardBox?.width || 0}`);

      const textX = textCardBox?.x || 0;
      const percent = (textX / 1400) * 100;
      console.log(`Posición: ${percent.toFixed(1)}% desde la izquierda`);
    }
  }

  await browser.close();
})();