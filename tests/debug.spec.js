import { test } from '@playwright/test';

test('capture live app state', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('PAGE_TITLE:', title);

  const bodyHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 300));
  console.log('BODY_START:', bodyHtml);

  // Take screenshot
  await page.screenshot({ path: 'C:/Users/mehra/.gemini/antigravity/brain/af55c96f-0cb7-416f-9b74-e37647f02400/qa_debug_raw.png' });
});

