const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    console.log('🚀 Loading www.victor-ia.com.mx...');
    await page.goto('https://www.victor-ia.com.mx', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Esperar un poco más para que todo se renderice
    await page.waitForTimeout(3000);

    // Verificar si existen los elementos
    const s0exists = await page.$('#s0') !== null;
    console.log(`✓ Page loaded. s0 element exists: ${s0exists}`);

    if (s0exists) {
      // Ejecutar verificación en el cliente
      const check = await page.evaluate(() => {
        const s0 = document.querySelector('#s0');
        const topLeft = s0.querySelector('.quadrant.top-left');
        const topRight = s0.querySelector('.quadrant.top-right');

        if (!topLeft || !topRight) return { error: 'Quadrants not found' };

        const tlRect = topLeft.getBoundingClientRect();
        const trRect = topRight.getBoundingClientRect();

        return {
          topLeftY: tlRect.top,
          topRightY: trRect.top,
          topLeftHeight: tlRect.height,
          topRightHeight: trRect.height,
          aligned: Math.abs(tlRect.top - trRect.top) < 2
        };
      });

      console.log('\n=== Module s0 Alignment Check ===');
      console.log(`Top-left Y: ${check.topLeftY?.toFixed(2)}`);
      console.log(`Top-right Y: ${check.topRightY?.toFixed(2)}`);
      console.log(`Top-left height: ${check.topLeftHeight?.toFixed(0)}px`);
      console.log(`Top-right height: ${check.topRightHeight?.toFixed(0)}px`);
      console.log(`Alignment: ${check.aligned ? '✓ ALIGNED' : '✗ MISALIGNED'}`);

      if (check.error) {
        console.log('Error:', check.error);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();