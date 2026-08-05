const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('🔍 Verificando que los bordes dorados han sido removidos...\n');

    await page.goto('https://www.victor-ia.com.mx', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const borderCheck = await page.evaluate(() => {
      const results = [];

      for (let i = 0; i < 12; i++) {
        const wrapper = document.querySelector(`#s${i} .module-wrapper`);
        const quadrant = document.querySelector(`#s${i} .quadrant`);

        if (!wrapper || !quadrant) continue;

        const wrapperStyle = window.getComputedStyle(wrapper);
        const quadrantStyle = window.getComputedStyle(quadrant);

        const wrapperBorder = wrapperStyle.border;
        const quadrantBorder = quadrantStyle.border;
        const quadrantBorderRight = quadrantStyle.borderRight;
        const quadrantBorderBottom = quadrantStyle.borderBottom;

        const hasNoBorder = wrapperBorder.includes('0px') || wrapperBorder === 'none';
        const quadHasNoBorder = quadrantBorder.includes('0px') || quadrantBorder === 'none';

        results.push({
          module: `s${i}`,
          wrapperBorder: hasNoBorder ? '✅ Removed' : `❌ ${wrapperBorder}`,
          quadrantBorder: quadHasNoBorder ? '✅ Removed' : `❌ ${quadrantBorder}`
        });
      }

      return results;
    });

    console.table(borderCheck);

    const allClean = borderCheck.every(r =>
      r.wrapperBorder.includes('✅') &&
      r.quadrantBorder.includes('✅')
    );

    console.log(`\n${allClean ? '✅ CONFIRMADO: Todos los bordes dorados han sido removidos' : '❌ Algunos bordes aún están presentes'}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();