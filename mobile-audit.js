// Mobile safe-area + layout audit across phone viewports
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = process.env.AUDIT_URL || 'http://localhost:8080/index.html';
const TAG = process.env.AUDIT_TAG || 'before';
const OUT = path.join(__dirname, 'screenshots', TAG);

const VIEWPORTS = [
  { name: 'galaxy-s21', width: 360, height: 800, dsf: 3 },
  { name: 'iphone-12',  width: 390, height: 844, dsf: 3 },
  { name: 'iphone-14pro', width: 393, height: 852, dsf: 3 },
  { name: 'iphone-14promax', width: 430, height: 932, dsf: 3 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    try { await page.waitForLoadState('load', { timeout: 25000 }); } catch (e) { /* imágenes lentas: seguimos */ }
    await page.waitForTimeout(2000);

    const metrics = await page.evaluate(() => {
      const de = document.documentElement;
      const res = {
        scrollWidth: de.scrollWidth,
        clientWidth: de.clientWidth,
        scrollHeight: de.scrollHeight,
        innerHeight: window.innerHeight,
        horizontalOverflow: de.scrollWidth > de.clientWidth,
        overflowingElements: [],
        smallTapTargets: [],
        sections: [],
        fixedUI: {},
      };

      // horizontal overflow offenders
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.right > de.clientWidth + 1 || r.left < -1) {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' && cs.visibility === 'hidden') return;
          res.overflowingElements.push({
            sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
            left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
          });
        }
      });
      res.overflowingElements = res.overflowingElements.slice(0, 15);

      // tap targets < 44px
      document.querySelectorAll('button, a, .cta, .cta-back, .modal-close, #theme_toggle').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.height < 44 || r.width < 44) {
          res.smallTapTargets.push({
            sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''),
            w: Math.round(r.width), h: Math.round(r.height),
          });
        }
      });
      res.smallTapTargets = res.smallTapTargets.slice(0, 12);

      // per-section geometry
      document.querySelectorAll('section').forEach(s => {
        const card = s.querySelector('.text-card');
        const r = s.getBoundingClientRect();
        res.sections.push({
          id: s.id,
          h: Math.round(r.height),
          vhRatio: +(r.height / window.innerHeight).toFixed(2),
          cardH: card ? Math.round(card.getBoundingClientRect().height) : null,
          cardW: card ? Math.round(card.getBoundingClientRect().width) : null,
          emptyRatio: card ? +(1 - card.getBoundingClientRect().height / r.height).toFixed(2) : null,
        });
      });

      // fixed UI positions
      ['hud', 'theme_toggle', 'face_caption', 'credit', 'scene_strip'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        res.fixedUI[id] = {
          display: cs.display,
          top: Math.round(r.top), right: Math.round(de.clientWidth - r.right),
          bottom: Math.round(window.innerHeight - r.bottom), left: Math.round(r.left),
          w: Math.round(r.width), h: Math.round(r.height),
        };
      });

      // safe-area support probe
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
      document.body.appendChild(probe);
      const pcs = getComputedStyle(probe);
      res.safeArea = { top: pcs.paddingTop, bottom: pcs.paddingBottom };
      probe.remove();

      res.viewportMeta = document.querySelector('meta[name=viewport]')?.content || null;
      return res;
    });

    metrics.viewport = vp.name + ' ' + vp.width + 'x' + vp.height;
    report.push(metrics);

    await page.screenshot({ path: path.join(OUT, vp.name + '-top.png') });
    // scroll into s1 and s5 for mid-page look
    for (const sid of ['s1', 's5', 's11']) {
      await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      }, sid);
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(OUT, vp.name + '-' + sid + '.png') });
    }
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  // console summary
  for (const r of report) {
    console.log('\n=== ' + r.viewport + ' ===');
    console.log('viewport meta:', r.viewportMeta);
    console.log('safe-area env():', JSON.stringify(r.safeArea));
    console.log('h-overflow:', r.horizontalOverflow, '(scrollW', r.scrollWidth, 'vs clientW', r.clientWidth + ')');
    if (r.overflowingElements.length) console.log('  offenders:', r.overflowingElements.map(o => o.sel + ' [' + o.left + '→' + o.right + ']').join('\n            '));
    console.log('total scrollHeight:', r.scrollHeight, '=', (r.scrollHeight / r.innerHeight).toFixed(1) + ' screens');
    console.log('small tap targets:', r.smallTapTargets.length, r.smallTapTargets.map(t => t.sel + ' ' + t.w + 'x' + t.h).slice(0, 6).join(', '));
    console.log('sections (h/vh, cardH, emptyRatio):');
    r.sections.forEach(s => console.log('  ' + s.id.padEnd(4), String(s.h).padStart(5) + 'px', (s.vhRatio + 'vh').padStart(7), 'card ' + s.cardW + 'x' + s.cardH, 'empty ' + Math.round((s.emptyRatio || 0) * 100) + '%'));
    console.log('fixed UI:', JSON.stringify(r.fixedUI, null, 1));
  }
})();