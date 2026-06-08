const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    logs.push({ type: 'PAGE_ERROR', text: err.message, stack: err.stack?.substring(0, 500) });
  });

  // Test on Vercel
  const BASE = 'https://wcd-education-platform.vercel.app';

  console.log('=== Loading main page ===');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page loaded. Title:', await page.title());
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/z/my-project/download/step1-home.png', fullPage: false });

  // Check errors on home page
  const homeErrors = logs.filter(l => l.type === 'error' || l.type === 'PAGE_ERROR');
  console.log('Errors on home:', homeErrors.length);
  homeErrors.forEach(e => console.log(`  [${e.type}] ${e.text.substring(0, 200)}`));

  // 2. Click "Теория" in sidebar
  console.log('\n=== Clicking Теория ===');
  const theoryBtn = page.locator('button:has-text("Теория")').first();
  const count = await theoryBtn.count();
  console.log('Теория button found:', count > 0);

  if (count > 0) {
    await theoryBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/z/my-project/download/step2-theory.png', fullPage: false });

    // Check page content
    const mainContent = await page.locator('main').textContent().catch(() => 'EMPTY');
    console.log('Main content:', mainContent?.substring(0, 150));
  }

  // 3. Click "Лаборатория"
  console.log('\n=== Clicking Лаборатория ===');
  const labBtn = page.locator('button:has-text("Лаборатория")').first();
  const labCount = await labBtn.count();
  console.log('Лаборатория button found:', labCount > 0);

  if (labCount > 0) {
    await labBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/z/my-project/download/step3-lab.png', fullPage: false });

    const mainContent = await page.locator('main').textContent().catch(() => 'EMPTY');
    console.log('Main content:', mainContent?.substring(0, 150));
  }

  // 4. Click "О проекте"
  console.log('\n=== Clicking О проекте ===');
  const aboutBtn = page.locator('button:has-text("О проекте")').first();
  if (await aboutBtn.count() > 0) {
    await aboutBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/z/my-project/download/step4-about.png', fullPage: false });
  }

  // 5. Click "Главная"  
  console.log('\n=== Clicking Главная ===');
  const homeBtn = page.locator('button:has-text("Главная")').first();
  if (await homeBtn.count() > 0) {
    await homeBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/z/my-project/download/step5-home2.png', fullPage: false });
  }

  // Final error report
  const allErrors = logs.filter(l => l.type === 'error' || l.type === 'PAGE_ERROR');
  console.log('\n============ ALL ERRORS ============');
  if (allErrors.length === 0) {
    console.log('NO ERRORS!');
  } else {
    allErrors.forEach((e, i) => {
      console.log(`\n--- Error ${i + 1} ---`);
      console.log(`Type: ${e.type}`);
      console.log(`Message: ${e.text.substring(0, 500)}`);
      if (e.stack) console.log(`Stack: ${e.stack}`);
    });
  }

  // All console logs
  console.log('\n============ ALL LOGS ============');
  logs.filter(l => l.type !== 'warning' && l.type !== 'log').forEach(l => {
    console.log(`[${l.type}] ${l.text.substring(0, 300)}`);
  });

  await browser.close();
})();
