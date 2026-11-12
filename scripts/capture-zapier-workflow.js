const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  const htmlPath = path.resolve(__dirname, '../public/zapier-style-workflow.html');
  const outputPath = path.resolve(__dirname, '../public/product-workflow-zapier-style.png');

  console.log(`Target HTML: ${htmlPath}`);
  console.log(`Target PNG: ${outputPath}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Use 1200 width with deviceScaleFactor: 2 for 4K crisp rendering
  const context = await browser.newContext({
    viewport: { width: 1200, height: 2600 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });

  // Ensure all web fonts (Plus Jakarta Sans & JetBrains Mono) are completely rendered
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });

  // Small delay to ensure any layout reflow settles
  await page.waitForTimeout(600);

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Document scrollHeight: ${scrollHeight}px`);

  // Capture full page screenshot
  await page.screenshot({
    path: outputPath,
    fullPage: true
  });

  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`Capture complete! Output: ${outputPath}`);
  console.log(`File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(1)} KB)`);

  if (stats.size < 50000) {
    throw new Error('Generated screenshot is suspiciously small');
  }
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
