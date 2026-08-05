const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });

  await page.goto('https://www.victor-ia.com.mx', { waitUntil: 'networkidle' });

  const textCard = await page.$('#s0 .text-card');
  const quadrant = await page.$('#s0 .quadrant:nth-child(1)');

  if (textCard) {
    const textCardStyles = await textCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        maxWidth: computed.maxWidth,
        display: computed.display,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
      };
    });
    console.log('Text-card styles:', textCardStyles);
  } else {
    console.log('Text-card not found');
  }

  if (quadrant) {
    const quadrantStyles = await quadrant.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        display: computed.display,
        alignItems: computed.alignItems,
        padding: computed.padding,
      };
    });
    console.log('Quadrant styles:', quadrantStyles);
  } else {
    console.log('Quadrant not found');
  }

  await browser.close();
})();