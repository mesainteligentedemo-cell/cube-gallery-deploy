const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  // Viewport móvil a desktop
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    console.log('Loading https://www.victor-ia.com.mx...');
    await page.goto('https://www.victor-ia.com.mx', { waitUntil: 'networkidle', timeout: 120000 });

    console.log('✓ Page loaded. Capturing full screenshot...');
    await page.screenshot({ path: 'full-page-screenshot.png', fullPage: true });
    console.log('✓ Screenshot: full-page-screenshot.png');

    // Scroll to first odd module and screenshot
    await page.locator('#s0').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const s0 = await page.$('#s0');
    const box0 = await s0.boundingBox();
    await page.screenshot({
      path: 'module-s0.png',
      clip: { x: box0.x, y: box0.y, width: box0.width, height: box0.height }
    });
    console.log('✓ Screenshot: module-s0.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();