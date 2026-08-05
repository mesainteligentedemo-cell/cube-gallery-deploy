// Compara el layout de escritorio contra la versión previa (git HEAD)
// para garantizar que los cambios móviles no alteraron el desktop.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'screenshots', 'desktop');
const VIEWPORTS = [
  { name: 'desktop-1920', w: 1920, h: 1080 },
  { name: 'desktop-1440', w: 1440, h: 900 },
  { name: 'tablet-1024', w: 1024, h: 768 },
];

const grab = async (browser, url, vp) => {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await page.waitForLoadState('load', { timeout: 25000 }); } catch (e) {}
  await page.waitForTimeout(1800);
  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const s0 = document.getElementById('s0');
    const card = s0.querySelector('.text-card');
    const wrap = s0.querySelector('.module-wrapper');
    const cube = document.getElementById('cube');
    const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), t: Math.round(b.top), l: Math.round(b.left) }; };
    const cs = el => el ? getComputedStyle(el) : null;
    return {
      scrollHeight: de.scrollHeight,
      sectionH: Math.round(s0.getBoundingClientRect().height),
      sectionPad: cs(s0).padding,
      wrapper: r(wrap),
      wrapperDisplay: cs(wrap).display,
      wrapperCols: cs(wrap).gridTemplateColumns,
      card: r(card),
      cardPad: cs(card).padding,
      cubeSize: cs(cube).width,
      h1Size: cs(s0.querySelector('h1')).fontSize,
      bodySize: cs(s0.querySelector('.body-text')).fontSize,
      creditDisplay: cs(document.getElementById('credit')).display,
      captionDisplay: cs(document.getElementById('face_caption')).display,
      stripDisplay: cs(document.getElementById('scene_strip')).display,
      toggle: r(document.getElementById('theme_toggle')),
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });
  const shot = await page.screenshot();
  await ctx.close();
  return { m, shot };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let diffs = 0;
  for (const vp of VIEWPORTS) {
    const cur = await grab(browser, 'http://localhost:8080/index.html', vp);
    const old = await grab(browser, 'http://localhost:8081/index.html', vp);
    fs.writeFileSync(path.join(OUT, vp.name + '-after.png'), cur.shot);
    fs.writeFileSync(path.join(OUT, vp.name + '-before.png'), old.shot);

    const keys = Object.keys(cur.m);
    const changed = keys.filter(k => JSON.stringify(cur.m[k]) !== JSON.stringify(old.m[k]));
    console.log(`\n=== ${vp.name} (${vp.w}x${vp.h}) ===`);
    if (!changed.length) {
      console.log('  IDÉNTICO — sin cambios de layout en escritorio');
    } else {
      changed.forEach(k => {
        console.log(`  DIFF ${k}:\n    antes: ${JSON.stringify(old.m[k])}\n    ahora: ${JSON.stringify(cur.m[k])}`);
      });
      diffs += changed.length;
    }
  }
  await browser.close();
  console.log(diffs ? `\n${diffs} diferencia(s) — revisar si son intencionales` : '\nEscritorio 100% sin cambios');
})();