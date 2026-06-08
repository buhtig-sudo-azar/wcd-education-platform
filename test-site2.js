const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('pageerror', err => {
    logs.push({ type: 'PAGE_ERROR', message: err.message, stack: err.stack });
  });

  const BASE = 'https://wcd-education-platform.vercel.app';

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Click Теория
  const theoryBtn = page.locator('button:has-text("Теория")').first();
  await theoryBtn.click();
  await page.waitForTimeout(3000);

  // Print full error
  if (logs.length > 0) {
    console.log('=== FULL ERROR ===');
    logs.forEach((e, i) => {
      console.log(`Error ${i + 1}:`);
      console.log(e.stack);
    });
  } else {
    console.log('No errors!');
  }

  await browser.close();
})();
