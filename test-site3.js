const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', err => {
    console.log('PAGE_ERROR:', err.message.substring(0, 200));
    console.log('STACK:', err.stack);
  });

  const BASE = 'https://wcd-education-platform.vercel.app';

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Download the chunk that has the error source
  console.log('=== Downloading error source chunks ===');

  // Get HTML to find JS files
  const html = await page.content();

  // Extract JS chunk URLs
  const jsChunks = [];
  const matches = html.matchAll(/src="([^"]*\.js)"/g);
  for (const m of matches) {
    jsChunks.push(m[1]);
  }
  console.log('JS chunks:', jsChunks.length);

  // Download the chunk with ah function (3037ac2odzxr6.js)
  const targetChunk = '3037ac2odzxr6.js';
  for (const chunk of jsChunks) {
    if (chunk.includes(targetChunk) || chunk.includes('3037ac2')) {
      console.log('\nFound target chunk:', chunk);
      const content = await page.evaluate(async (url) => {
        const res = await fetch(url);
        return await res.text();
      }, chunk);

      // Find the 'ah' function around line 26, position 938
      // Search for function that calls useCallback
      const useCallbackIdx = content.indexOf('useCallback');
      if (useCallbackIdx > -1) {
        console.log('\nuseCallback found at index:', useCallbackIdx);
        const context = content.substring(Math.max(0, useCallbackIdx - 500), useCallbackIdx + 200);
        console.log('Context around useCallback:');
        console.log(context);
      }

      // Look for framer-motion or sonner imports
      if (content.includes('framer-motion') || content.includes('framer')) {
        console.log('\n>>> CONTAINS framer-motion <<<');
      }
      if (content.includes('sonner')) {
        console.log('\n>>> CONTAINS sonner <<<');
      }
      if (content.includes('toast') || content.includes('Toaster')) {
        console.log('\n>>> CONTAINS toast/Toaster <<<');
      }
      if (content.includes('useTheme')) {
        console.log('\n>>> CONTAINS useTheme <<<');
      }

      // Search for "ah" function definition
      const ahIdx = content.indexOf('function ah');
      if (ahIdx > -1) {
        const ahContext = content.substring(ahIdx, ahIdx + 300);
        console.log('\nah function:', ahContext);
      }

      // Just search for the area around position 938 (from error line 26:938)
      // Split by newlines
      const lines = content.split('\n');
      if (lines.length >= 26) {
        const line26 = lines[25]; // 0-indexed
        console.log('\nLine 26 (first 500 chars):', line26.substring(0, 500));
        // Position 938
        if (line26.length > 938) {
          console.log('At position 938:', line26.substring(930, 1030));
        }
      }

      break;
    }
  }

  await browser.close();
})();
