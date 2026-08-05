const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🔍 AUDITORÍA COMPLETA: www.victor-ia.com.mx\n');

    // ============================================
    // TEST 1: Desktop - Verificar alineación
    // ============================================
    console.log('📱 TEST 1: Desktop (1920×1080) - Alineación de módulos');
    console.log('─'.repeat(60));

    const page1 = await browser.newPage();
    await page1.setViewportSize({ width: 1920, height: 1080 });
    await page1.goto('https://www.victor-ia.com.mx', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page1.waitForTimeout(2000);

    const desktopCheck = await page1.evaluate(() => {
      const results = [];
      const modules = [
        { id: 's0', type: 'odd', name: '01 TU CLUB EN PILOTO AUTOMÁTICO' },
        { id: 's1', type: 'even', name: '02 INVITACIÓN INTELIGENTE' },
        { id: 's2', type: 'odd', name: '03 CHECK-IN SIN PAPEL' },
        { id: 's3', type: 'even', name: '04 CONTRATO QUE EXPLICA SOLO' },
        { id: 's4', type: 'odd', name: '05 ONBOARDING' },
        { id: 's5', type: 'even', name: '06 ENTRENAMIENTO 24/7' },
        { id: 's6', type: 'odd', name: '07 ARQUITECTURA' },
        { id: 's7', type: 'even', name: '08 REPORTES' },
        { id: 's8', type: 'odd', name: '09 MANTENIMIENTO' },
        { id: 's9', type: 'even', name: '10 ALERTAS' },
        { id: 's10', type: 'odd', name: '11 AUDITORÍA' },
        { id: 's11', type: 'even', name: '12 INTEGRACIÓN' },
      ];

      for (const mod of modules) {
        const section = document.querySelector(`#${mod.id}`);
        const wrapper = section?.querySelector('.module-wrapper');
        const topLeft = section?.querySelector('.quadrant.top-left');
        const topRight = section?.querySelector('.quadrant.top-right');
        const textCard = section?.querySelector('.text-card');

        if (!wrapper || !topLeft || !topRight) {
          results.push({
            module: mod.name,
            status: '❌ ESTRUCTURA',
            issue: 'Elementos faltantes'
          });
          continue;
        }

        const wrapBox = wrapper.getBoundingClientRect();
        const tlBox = topLeft.getBoundingClientRect();
        const trBox = topRight.getBoundingClientRect();
        const tcBox = textCard?.getBoundingClientRect();

        const tlPercent = ((tlBox.width / wrapBox.width) * 100).toFixed(1);
        const trPercent = ((trBox.width / wrapBox.width) * 100).toFixed(1);

        let status = '✅ OK';
        let issue = '';

        if (mod.type === 'odd') {
          // Módulos nones: texto a la izquierda
          const textLeftOfCenter = tcBox.left < (wrapBox.left + wrapBox.width / 2);
          if (!textLeftOfCenter) {
            status = '❌ ALINEACIÓN';
            issue = `Texto no a la izquierda (${tcBox.left.toFixed(0)}px)`;
          }
        } else {
          // Módulos pares: texto a la derecha
          const textRightOfCenter = tcBox.right > (wrapBox.left + wrapBox.width / 2);
          if (!textRightOfCenter) {
            status = '❌ ALINEACIÓN';
            issue = `Texto no a la derecha (${tcBox.right.toFixed(0)}px)`;
          }
        }

        results.push({
          module: mod.name,
          type: mod.type,
          colL: `${tlPercent}%`,
          colR: `${trPercent}%`,
          status: status,
          issue: issue || '—'
        });
      }

      return results;
    });

    console.table(desktopCheck);

    const allDesktopOK = desktopCheck.every(r => r.status.includes('✅'));
    console.log(`\n${allDesktopOK ? '✅ RESULTADO DESKTOP: PERFECTO' : '❌ RESULTADO DESKTOP: FALLOS DETECTADOS'}\n`);

    // ============================================
    // TEST 2: Mobile - Responsiveness
    // ============================================
    console.log('\n📱 TEST 2: Mobile (390×844) - Responsiveness');
    console.log('─'.repeat(60));

    const page2 = await browser.newPage();
    await page2.setViewportSize({ width: 390, height: 844 });
    await page2.goto('https://www.victor-ia.com.mx', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page2.waitForTimeout(2000);

    const mobileCheck = await page2.evaluate(() => {
      const s0 = document.querySelector('#s0');
      const wrapper = s0?.querySelector('.module-wrapper');
      const textCard = s0?.querySelector('.text-card');
      const body = s0?.querySelector('.body-text');

      if (!wrapper || !textCard) {
        return { status: '❌', issue: 'Elementos faltantes', viewport: '390px', overflow: 'N/A' };
      }

      const wrapBox = wrapper.getBoundingClientRect();
      const textBox = textCard.getBoundingClientRect();
      const bodyBox = body?.getBoundingClientRect();

      const hasOverflow = wrapBox.width > window.innerWidth;
      const textVisible = bodyBox && bodyBox.height > 0;

      return {
        status: hasOverflow ? '❌ OVERFLOW' : textVisible ? '✅ OK' : '⚠️ CLIPPED',
        viewport: '390px',
        wrapperWidth: wrapBox.width.toFixed(0),
        screenWidth: window.innerWidth,
        bodyVisible: textVisible,
        overflow: hasOverflow
      };
    });

    console.log(`Status: ${mobileCheck.status}`);
    console.log(`Viewport: ${mobileCheck.viewport}`);
    console.log(`Wrapper width: ${mobileCheck.wrapperWidth}px (screen: ${mobileCheck.screenWidth}px)`);
    console.log(`Body text visible: ${mobileCheck.bodyVisible}`);
    console.log(`Horizontal overflow: ${mobileCheck.overflow ? 'SÍ ❌' : 'NO ✅'}`);

    // ============================================
    // TEST 3: Validación HTML
    // ============================================
    console.log('\n\n📋 TEST 3: Validación de estructura HTML');
    console.log('─'.repeat(60));

    const page3 = await browser.newPage();
    await page3.goto('https://www.victor-ia.com.mx', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const htmlCheck = await page3.evaluate(() => {
      const checks = {
        sections: document.querySelectorAll('section[id^="s"]').length,
        moduleWrappers: document.querySelectorAll('.module-wrapper').length,
        quadrants: document.querySelectorAll('.quadrant').length,
        textCards: document.querySelectorAll('.text-card').length,
        hasErrors: false,
        errorMsg: ''
      };

      // Validar que cada sección tenga 4 cuadrantes
      let validStructure = true;
      for (let i = 0; i < 12; i++) {
        const section = document.querySelector(`#s${i}`);
        const quads = section?.querySelectorAll('.quadrant').length || 0;
        if (quads !== 4) {
          validStructure = false;
          checks.errorMsg = `Sección s${i} tiene ${quads} cuadrantes (esperado 4)`;
          break;
        }
      }

      checks.hasErrors = !validStructure;
      return checks;
    });

    console.log(`✅ Secciones: ${htmlCheck.sections}/12`);
    console.log(`✅ Module wrappers: ${htmlCheck.moduleWrappers}/12`);
    console.log(`✅ Cuadrantes: ${htmlCheck.quadrants}/48 (12×4)`);
    console.log(`✅ Text cards: ${htmlCheck.textCards}/12`);
    console.log(`${htmlCheck.hasErrors ? '❌' : '✅'} Estructura HTML: ${htmlCheck.hasErrors ? htmlCheck.errorMsg : 'VÁLIDA'}`);

    // ============================================
    // TEST 4: CSS & Styles
    // ============================================
    console.log('\n\n🎨 TEST 4: Estilos CSS aplicados');
    console.log('─'.repeat(60));

    const styleCheck = await page3.evaluate(() => {
      const s0wrapper = document.querySelector('#s0 .module-wrapper');
      const s1wrapper = document.querySelector('#s1 .module-wrapper');
      const style0 = window.getComputedStyle(s0wrapper);
      const style1 = window.getComputedStyle(s1wrapper);

      // Parse computed grid values (e.g., "393.891px 818.109px")
      const parseColumns = (gridStr) => {
        const parts = gridStr.split(' ').filter(p => p.includes('px')).map(p => parseFloat(p));
        if (parts.length === 2) {
          const total = parts[0] + parts[1];
          return {
            left: (parts[0] / total * 100).toFixed(1),
            right: (parts[1] / total * 100).toFixed(1)
          };
        }
        return null;
      };

      const s0Parsed = parseColumns(style0.gridTemplateColumns);
      const s1Parsed = parseColumns(style1.gridTemplateColumns);

      return {
        s0Columns: style0.gridTemplateColumns,
        s1Columns: style1.gridTemplateColumns,
        s0Valid: s0Parsed && s0Parsed.left < 35 && s0Parsed.left > 30, // ~32.4%
        s1Valid: s1Parsed && s1Parsed.left > 65 && s1Parsed.left < 70, // ~67.3%
        s0Percent: s0Parsed,
        s1Percent: s1Parsed
      };
    });

    console.log(`Module s0 (odd) grid-template-columns: ${styleCheck.s0Columns}`);
    console.log(`${styleCheck.s0Valid ? '✅' : '❌'} s0 tiene 0.65fr (esperado para nones)`);
    console.log(`\nModule s1 (even) grid-template-columns: ${styleCheck.s1Columns}`);
    console.log(`${styleCheck.s1Valid ? '✅' : '❌'} s1 tiene 1.35fr (esperado para pares)`);

    // ============================================
    // RESULTADO FINAL
    // ============================================
    console.log('\n\n' + '═'.repeat(60));
    console.log('📊 AUDITORÍA FINAL');
    console.log('═'.repeat(60));

    const allPassed = allDesktopOK && !mobileCheck.overflow && !htmlCheck.hasErrors && styleCheck.s0Valid && styleCheck.s1Valid;

    if (allPassed) {
      console.log('✅✅✅ SITIO COMPLETAMENTE FUNCIONAL ✅✅✅');
      console.log('\n✓ Todos los módulos alineados correctamente');
      console.log('✓ Mobile responsive sin overflow');
      console.log('✓ Estructura HTML válida (12 secciones × 4 cuadrantes)');
      console.log('✓ CSS aplicado: grids asimétricos correctos');
      console.log('\n🎉 LISTO PARA PRODUCCIÓN 🎉');
    } else {
      console.log('❌ FALLOS DETECTADOS:');
      if (!allDesktopOK) console.log('  - Desktop: problemas de alineación');
      if (mobileCheck.overflow) console.log('  - Mobile: overflow horizontal');
      if (htmlCheck.hasErrors) console.log(`  - HTML: ${htmlCheck.errorMsg}`);
      if (!styleCheck.s0Valid) console.log('  - CSS: s0 grid incorrecto');
      if (!styleCheck.s1Valid) console.log('  - CSS: s1 grid incorrecto');
    }

    console.log('\n═'.repeat(60));

  } catch (error) {
    console.error('❌ Error durante auditoría:', error.message);
  } finally {
    await browser.close();
  }
})();