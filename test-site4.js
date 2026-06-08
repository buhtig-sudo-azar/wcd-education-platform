const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', err => {
    console.log('PAGE_ERROR:', err.message.substring(0, 200));
  });

  const BASE = 'https://wcd-education-platform.vercel.app';
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Download the target chunk
  const content = await page.evaluate(async () => {
    const res = await fetch('/_next/static/chunks/3037ac2odzxr6.js');
    return await res.text();
  });

  // Find the ah function (FloatingDock) - get more context
  const ahIdx = content.indexOf('function ah()');
  if (ahIdx > -1) {
    // Get 3000 chars starting from ah function
    const ahCode = content.substring(ahIdx, ahIdx + 3000);
    console.log('=== FloatingDock (ah) function ===');
    console.log(ahCode);
  }

  // Also check what module 57688 is (ax = e.i(57688))
  const mod57688 = content.indexOf('57688');
  if (mod57688 > -1) {
    const ctx = content.substring(Math.max(0, mod57688 - 100), mod57688 + 300);
    console.log('\n=== Module 57688 context ===');
    console.log(ctx);
  }

  // Check for the x function (zustand selector?)
  // "let e=x(e=>e.currentView)" - x is likely useNavigationStore
  const xDef = content.indexOf('var x=');
  if (xDef === -1) {
    // Try other patterns
    const patterns = ['let x=', 'const x=', 'var x='];
    for (const p of patterns) {
      const idx = content.indexOf(p, ahIdx - 500);
      if (idx > -1 && idx < ahIdx) {
        console.log('\n=== x definition near ah ===');
        console.log(content.substring(idx, idx + 200));
        break;
      }
    }
  }

  await browser.close();
})();
