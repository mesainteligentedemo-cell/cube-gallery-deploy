// Simula recortes reales (notch / Dynamic Island / home indicator) y verifica
// que nada quede bajo ellos. Chromium headless resuelve env() a 0px, así que
// inyectamos los valores como overrides de los tokens --sat/--sar/--sab/--sal.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = process.env.AUDIT_URL || 'http://localhost:8080/index.html';
const OUT = path.join(__dirname, 'screenshots', 'safe-areas');

// insets reales de dispositivos
const CASES = [
  { name: 'iphone-12-portrait',      w: 390, h: 844, t: 47, r: 0,  b: 34, l: 0 },
  { name: 'iphone-14pro-portrait',   w: 393, h: 852, t: 59, r: 0,  b: 34, l: 0 }, // Dynamic Island
  { name: 'iphone-14promax-portrait',w: 430, h: 932, t: 59, r: 0,  b: 34, l: 0 },
  { name: 'galaxy-s21-portrait',     w: 360, h: 800, t: 24, r: 0,  b: 0,  l: 0 },
  { name: 'iphone-14pro-landscape',  w: 852, h: 393, t: 0,  r: 59, b: 21, l: 59 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;

  for (const c of CASES) {
    const ctx = await browser.newContext({
      viewport: { width: c.w, height: c.h },
      isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    try { await page.waitForLoadState('load', { timeout: 25000 }); } catch (e) {}

    // inyectar insets simulados
    await page.addStyleTag({ content: `:root{--sat:${c.t}px!important;--sar:${c.r}px!important;--sab:${c.b}px!important;--sal:${c.l}px!important;}` });
    await page.waitForTimeout(1500);

    const r = await page.evaluate((ins) => {
      const de = document.documentElement;
      const vw = de.clientWidth, vh = window.innerHeight;
      const out = { intrusions: [], hOverflow: de.scrollWidth > de.clientWidth + 1, scrollW: de.scrollWidth, clientW: de.clientWidth, cardVsCube: null, ui: {} };

      const check = (label, el) => {
        if (!el) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') { out.ui[label] = 'hidden'; return; }
        const b = el.getBoundingClientRect();
        out.ui[label] = { t: Math.round(b.top), b: Math.round(vh - b.bottom), l: Math.round(b.left), r: Math.round(vw - b.right), w: Math.round(b.width), h: Math.round(b.height) };
        if (b.top < ins.t - 0.5)          out.intrusions.push(`${label} invade zona superior (top ${b.top.toFixed(0)} < ${ins.t})`);
        if (vh - b.bottom < ins.b - 0.5)  out.intrusions.push(`${label} invade zona inferior (bottom ${(vh - b.bottom).toFixed(0)} < ${ins.b})`);
        if (b.left < ins.l - 0.5)         out.intrusions.push(`${label} invade zona izquierda (left ${b.left.toFixed(0)} < ${ins.l})`);
        if (vw - b.right < ins.r - 0.5)   out.intrusions.push(`${label} invade zona derecha (right ${(vw - b.right).toFixed(0)} < ${ins.r})`);
      };

      check('hud', document.getElementById('hud'));
      check('theme_toggle', document.getElementById('theme_toggle'));
      check('credit', document.getElementById('credit'));
      check('face_caption', document.getElementById('face_caption'));

      // tarjeta visible actual vs bandas seguras
      const cards = [...document.querySelectorAll('.text-card')].filter(el => {
        const b = el.getBoundingClientRect();
        return b.top < vh && b.bottom > 0;
      });
      cards.forEach((el, i) => check('text-card#' + i, el));

      // ¿la tarjeta pisa el cubo?
      const scene = document.getElementById('scene');
      if (scene && cards[0]) {
        const s = scene.getBoundingClientRect(), c0 = cards[0].getBoundingClientRect();
        out.cardVsCube = { sceneBottom: Math.round(s.bottom), cardTop: Math.round(c0.top), gap: Math.round(c0.top - s.bottom) };
      }

      // botones táctiles
      out.smallTaps = [...document.querySelectorAll('button,a')].filter(el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const b = el.getBoundingClientRect();
        return b.width > 0 && b.height > 0 && (b.height < 44 || b.width < 44);
      }).length;

      return out;
    }, c);

    // pintar overlays de zona segura para inspección visual
    await page.addStyleTag({ content: `
      body::before,body::after{content:'';position:fixed;left:0;right:0;z-index:99999;pointer-events:none;background:rgba(255,0,80,.28)}
      body::before{top:0;height:${c.t}px}
      body::after{bottom:0;height:${c.b}px}
    `});
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, c.name + '.png') });

    const ok = r.intrusions.length === 0 && !r.hOverflow && r.smallTaps === 0;
    if (!ok) failures++;
    console.log(`\n${ok ? 'OK  ' : 'FAIL'} ${c.name}  (${c.w}x${c.h}, insets T${c.t} R${c.r} B${c.b} L${c.l})`);
    console.log('  overflow-h:', r.hOverflow, `(${r.scrollW}/${r.clientW})`, '| taps<44px:', r.smallTaps);
    console.log('  cubo→tarjeta gap:', r.cardVsCube ? r.cardVsCube.gap + 'px' : 'n/a');
    console.log('  UI:', JSON.stringify(r.ui));
    if (r.intrusions.length) console.log('  INTRUSIONES:\n   - ' + r.intrusions.join('\n   - '));
    await ctx.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} caso(s) con problemas` : '\nTodos los casos pasan');
  process.exit(failures ? 1 : 0);
})();