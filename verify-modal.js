// Verifica que los modales respeten zonas seguras y no desborden en móvil.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'screenshots', 'modal');
const CASES = [
  { name: 'galaxy-s21', w: 360, h: 800, t: 24, b: 0 },
  { name: 'iphone-12', w: 390, h: 844, t: 47, b: 34 },
  { name: 'iphone-14promax', w: 430, h: 932, t: 59, b: 34 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let fails = 0;

  for (const c of CASES) {
    const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
    try { await page.waitForLoadState('load', { timeout: 25000 }); } catch (e) {}
    await page.addStyleTag({ content: `:root{--sat:${c.t}px!important;--sab:${c.b}px!important;}` });
    await page.waitForTimeout(1200);

    // abrir el modal con más texto (11 = CONTROL TOTAL)
    await page.evaluate(() => window.openPopup(11));
    await page.waitForTimeout(700);

    const r = await page.evaluate((ins) => {
      const de = document.documentElement, vh = window.innerHeight, vw = de.clientWidth;
      const mc = document.querySelector('#popup-11 .modal-content');
      const close = document.querySelector('#popup-11 .modal-close');
      const b = mc.getBoundingClientRect(), cb = close.getBoundingClientRect();
      return {
        modalTop: Math.round(b.top), modalBottom: Math.round(vh - b.bottom),
        modalLeft: Math.round(b.left), modalRight: Math.round(vw - b.right),
        modalW: Math.round(b.width), modalH: Math.round(b.height),
        scrollable: mc.scrollHeight > mc.clientHeight,
        contentFullyReachable: mc.scrollHeight <= mc.clientHeight + 1 || getComputedStyle(mc).overflowY === 'auto',
        closeW: Math.round(cb.width), closeH: Math.round(cb.height),
        hOverflow: de.scrollWidth > de.clientWidth + 1,
        respectsTop: b.top >= ins.t - 0.5,
        respectsBottom: (vh - b.bottom) >= ins.b - 0.5,
        fitsWidth: b.width <= vw + 0.5,
      };
    }, c);

    await page.addStyleTag({ content: `body::before,body::after{content:'';position:fixed;left:0;right:0;z-index:99999;pointer-events:none;background:rgba(255,0,80,.3)}body::before{top:0;height:${c.t}px}body::after{bottom:0;height:${c.b}px}` });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, c.name + '.png') });

    const ok = r.respectsTop && r.respectsBottom && r.fitsWidth && !r.hOverflow && r.closeH >= 44 && r.closeW >= 44 && r.contentFullyReachable;
    if (!ok) fails++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${c.name} (${c.w}x${c.h} insets T${c.t} B${c.b})`);
    console.log('   ', JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} fallo(s)` : '\nModales OK en todos los casos');
})();