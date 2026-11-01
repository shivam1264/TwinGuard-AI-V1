import { test } from '@playwright/test';

test.setTimeout(60000);

test('capture tactical mini-map states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Open GIS Tactical Mini-Map
  await page.evaluate(() => {
    if (window.__twinguardApp) {
      window.__twinguardApp.toggleGis();
    }
  });
  await page.waitForTimeout(1000);

  // Capture Standby state
  await page.screenshot({ path: 'C:/Users/mehra/.gemini/antigravity/brain/af55c96f-0cb7-416f-9b74-e37647f02400/qa_minimap_1_standby.png' });
  console.log('Saved qa_minimap_1_standby.png');

  // 2. Dispatch En Route (t = 14s, vehicle is at ~46% of road)
  await page.evaluate(() => {
    const em = window.__twinguardApp?.sceneManager?.emergencyManager;
    if (em) {
      if (!em.isActive) em.dispatch('exit_south');
      em.elapsedTime = 14.0;
      em.gisProgress = 14.0 / 30.0;
      em.phase = 'EN_ROUTE';
    }
  });
  await page.waitForTimeout(800);

  // Capture En Route state
  await page.screenshot({ path: 'C:/Users/mehra/.gemini/antigravity/brain/af55c96f-0cb7-416f-9b74-e37647f02400/qa_minimap_2_enroute.png' });
  console.log('Saved qa_minimap_2_enroute.png');

  // 3. Arrival at Campus Gate (t = 30s)
  await page.evaluate(() => {
    const em = window.__twinguardApp?.sceneManager?.emergencyManager;
    if (em) {
      em.elapsedTime = 30.0;
      em.gisProgress = 1.0;
      em.phase = 'AT_CAMPUS_GATE';
    }
  });
  await page.waitForTimeout(800);

  // Capture Gate Arrival state
  await page.screenshot({ path: 'C:/Users/mehra/.gemini/antigravity/brain/af55c96f-0cb7-416f-9b74-e37647f02400/qa_minimap_3_gate.png' });
  console.log('Saved qa_minimap_3_gate.png');

  // 4. On Scene Arrival (t = 45s)
  await page.evaluate(() => {
    const em = window.__twinguardApp?.sceneManager?.emergencyManager;
    if (em) {
      em.elapsedTime = 45.0;
      em.gisProgress = 1.0;
      em.campusProgress = 1.0;
      em.phase = 'ON_SCENE';
      em.isArrived = true;
    }
  });
  await page.waitForTimeout(800);

  // Capture On Scene state
  await page.screenshot({ path: 'C:/Users/mehra/.gemini/antigravity/brain/af55c96f-0cb7-416f-9b74-e37647f02400/qa_minimap_4_onscene.png' });
  console.log('Saved qa_minimap_4_onscene.png');

  // 5. Reset to Standby
  await page.evaluate(() => {
    if (window.__twinguardApp) {
      window.__twinguardApp.reset();
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/Users/mehra/.gemini/antigravity/brain/af55c96f-0cb7-416f-9b74-e37647f02400/qa_minimap_5_reset.png' });
  console.log('Saved qa_minimap_5_reset.png');
});
