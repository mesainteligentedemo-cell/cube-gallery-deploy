const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Esperar a que se cargue completamente
  await page.goto('https://cube-gallery-deploy.vercel.app', {
    waitUntil: 'networkidle2'
  });
  
  const screenshotsDir = 'C:\Users\inbou\cube-gallery-deploy\screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Verificar cada módulo
  console.log('🔍 AUDITANDO CADA MÓDULO...\n');
  
  for (let i = 0; i < 12; i++) {
    // Navegar a cada sección
    await page.goto(`https://cube-gallery-deploy.vercel.app#s${i}`, {
      waitUntil: 'networkidle0'
    });
    
    // Esperar a que cargue la imagen
    await page.waitForTimeout(2000);
    
    // Tomar screenshot
    const filename = path.join(screenshotsDir, `module-${i}.png`);
    await page.screenshot({ path: filename });
    
    // Obtener información
    const data = await page.evaluate(() => {
      const title = document.querySelector('#face_caption_name')?.textContent || 'NO ENCONTRADO';
      const imgs = Array.from(document.querySelectorAll('.face img')).map((img, idx) => ({
        idx: idx,
        src: img.src ? '✓ Cargada' : '✗ No cargada',
        alt: img.alt?.substring(0, 30) || 'SIN ALT'
      }));
      return { title, imgs };
    });
    
    console.log(`✓ Módulo ${i}: ${data.title}`);
    data.imgs.forEach(img => {
      console.log(`    Cara ${img.idx}: ${img.src}`);
    });
    console.log('');
  }
  
  console.log('📸 Screenshots guardados en: C:\Users\inbou\cube-gallery-deploy\screenshots');
  await browser.close();
})();
