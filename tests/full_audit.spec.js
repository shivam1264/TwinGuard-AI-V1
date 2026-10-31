import { test } from '@playwright/test';

test.setTimeout(180000); // 3 minutes timeout for comprehensive capture

const SCREENSHOT_DIR = 'C:/Users/mehra/OneDrive/Desktop/Gwaliow-3/project-audit/screenshots';

test('systematic UI audit of all screens, modals, panels, and views', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Helper function to capture screenshot
  const snap = async (filename) => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${filename}` });
    console.log(`Captured: ${filename}`);
  };

  // ==========================================
  // SECTION 1: DEFAULT MAIN DASHBOARD & VIEWPORTS
  // ==========================================
  // 01. Default Dashboard (Toolbars collapsed as configured)
  await snap('01_dashboard_default.png');

  // 02. Left Sidebar Expanded (3D View Mode)
  await page.click('button[title="Expand Menu"], button[title="Collapse Menu"]').catch(() => {});
  await page.waitForTimeout(300);
  await snap('02_left_sidebar_expanded.png');

  // 03. Right Sidebar Expanded (Command & Telemetry)
  await page.evaluate(() => {
    // Find right toggle button or click via selector
    const btns = Array.from(document.querySelectorAll('button'));
    const rightToggle = btns.find(b => b.title && b.title.includes('Telemetry'));
    if (rightToggle) rightToggle.click();
  });
  await page.waitForTimeout(300);
  await snap('03_both_sidebars_expanded.png');

  // Re-collapse sidebars for clean view
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.forEach(b => {
      if (b.title && (b.title.includes('Collapse') || b.title.includes('Hide'))) b.click();
    });
  });
  await page.waitForTimeout(300);

  // 04. Digital Twin Viewport: Exterior (Default)
  await snap('04_digital_twin_exterior.png');

  // 05. Digital Twin Viewport: Interior Cutaway
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const intBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Interior');
    if (intBtn) intBtn.click();
  });
  await snap('05_digital_twin_interior.png');

  // 06. Digital Twin Viewport: Top View
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const topBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Top View');
    if (topBtn) topBtn.click();
  });
  await snap('06_digital_twin_top_view.png');

  // Return to Exterior
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const extBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Exterior');
    if (extBtn) extBtn.click();
  });
  await page.waitForTimeout(400);

  // 07. Floor Level Isolation: Level 5
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const l5Btn = btns.find(b => b.textContent && b.textContent.trim() === 'L5');
    if (l5Btn) l5Btn.click();
  });
  await snap('07_floor_level_l5_isolated.png');

  // 08. Exploded BIM Stack View
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expBtn = btns.find(b => b.title && b.title.includes('Exploded'));
    if (expBtn) expBtn.click();
  });
  await snap('08_exploded_bim_stack.png');

  // Reset to All Floors
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expBtn = btns.find(b => b.title && b.title.includes('Exploded'));
    if (expBtn) expBtn.click();
  });
  await page.waitForTimeout(400);

  // ==========================================
  // SECTION 2: SATELLITE GIS TACTICAL MINI-MAP
  // ==========================================
  // 09. GIS Tactical Mini-Map Open (Standby State)
  await page.evaluate(() => {
    if (window.__twinguardApp) window.__twinguardApp.toggleGis();
  });
  await page.waitForTimeout(600);
  await snap('09_gis_minimap_standby.png');

  // 10. GIS Tactical Mini-Map Expanded Mode
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expBtn = btns.find(b => b.title && b.title.includes('Expand Tactical View'));
    if (expBtn) expBtn.click();
  });
  await page.waitForTimeout(500);
  await snap('10_gis_minimap_expanded.png');

  // Restore compact GIS
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const minBtn = btns.find(b => b.title && b.title.includes('Compact Mini-Map'));
    if (minBtn) minBtn.click();
  });
  await page.waitForTimeout(400);

  // ==========================================
  // SECTION 3: TOP HEADER DESTINATIONS & MODALS
  // ==========================================
  // 11. Modal: AI Scenarios Studio
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('AI Scenarios'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await snap('11_modal_ai_scenarios_studio.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕') || b.textContent.includes('Close')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 12. Modal: AI Evacuation Strategy Ranker (TOPSIS)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Strategy Ranker'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await snap('12_modal_strategy_ranker.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 13. Modal: Incident Command Center
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Incidents'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await snap('13_modal_incidents_center.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 14. Modal: Safety Compliance Audit Reports
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Reports'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await snap('14_modal_reports_compliance.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 15. Modal: System Settings
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Settings'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await snap('15_modal_settings.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 16. Facility Info: Full In-Viewport Building Info Page
  await page.evaluate(() => {
    const el = document.querySelector('div[title*="Facility Location"]');
    if (el) el.click();
  });
  await page.waitForTimeout(500);
  await snap('16_page_building_info.png');

  // Return to 3D View from Info Page
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const backBtn = btns.find(b => b.textContent && (b.textContent.includes('Back') || b.textContent.includes('3D View')));
    if (backBtn) backBtn.click();
  });
  await page.waitForTimeout(400);

  // 17. Modal: Mobile Evacuee Companion QR Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const qrBtn = btns.find(b => b.title && b.title.includes('QR'));
    if (qrBtn) qrBtn.click();
  });
  await page.waitForTimeout(500);
  await snap('17_modal_evacuee_qr.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // ==========================================
  // SECTION 4: SIDEBAR DESTINATIONS & MODALS
  // ==========================================
  // 18. Modal: CCTV 100-Camera Multiviewer
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cctvBtn = btns.find(b => b.title && b.title.includes('CCTV'));
    if (cctvBtn) cctvBtn.click();
  });
  await page.waitForTimeout(500);
  await snap('18_modal_cctv_multiviewer.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 19. Modal: Bottleneck Analytics & AI Forecaster
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const anaBtn = btns.find(b => b.title && (b.title.includes('Telemetry') || b.title.includes('Systems')));
    if (anaBtn) anaBtn.click();
  });
  await page.waitForTimeout(500);
  await snap('19_modal_bottleneck_analytics.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 20. Modal: Emergency Rapid Intervention Control
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const emBtn = btns.find(b => b.title && b.title.includes('Emergency'));
    if (emBtn) emBtn.click();
  });
  await page.waitForTimeout(500);
  await snap('20_modal_emergency_control.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // 21. Modal: Room Inspection Details
  await page.evaluate(() => {
    // Trigger modal for Room f5_r4
    if (window.__sceneManager && window.__sceneManager.onRoomClick) {
      window.__sceneManager.onRoomClick({ id: 'f5_r4', floor: 5, name: 'Cyber Defense SOC • Studio 04', peopleCount: 3 });
    }
  });
  await page.waitForTimeout(400);
  await snap('21_modal_room_inspection.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button'));
    const x = closeBtns.find(b => b.title && (b.title.includes('Close') || b.textContent.includes('✕')));
    if (x) x.click();
  });
  await page.waitForTimeout(400);

  // ==========================================
  // SECTION 5: EMERGENCY SIMULATION LIFECYCLE
  // ==========================================
  // 22. Emergency Triggered: Fire Hazard Active in 3D Scene
  await page.evaluate(() => {
    if (window.__twinguardApp?.sceneManager) {
      window.__twinguardApp.sceneManager.triggerFire('f5_r4');
    }
  });
  await page.waitForTimeout(500);
  await snap('22_emergency_fire_ignited.png');

  // 23. Evacuation Dispatched: Crowd Moving & Real-Road GIS Vehicle Active (t = 12s)
  await page.evaluate(() => {
    if (window.__twinguardApp) {
      window.__twinguardApp.startEvacuation();
      const em = window.__twinguardApp.sceneManager?.emergencyManager;
      if (em) {
        em.elapsedTime = 12.0;
        em.gisProgress = 12.0 / 30.0;
        em.phase = 'EN_ROUTE';
      }
    }
  });
  await page.waitForTimeout(800);
  await snap('23_emergency_evacuation_enroute.png');

  // 24. Campus Gate Arrival: GIS Handoff to 3D Digital Twin (t = 30s)
  await page.evaluate(() => {
    const em = window.__twinguardApp?.sceneManager?.emergencyManager;
    if (em) {
      em.elapsedTime = 30.0;
      em.gisProgress = 1.0;
      em.phase = 'AT_CAMPUS_GATE';
    }
  });
  await page.waitForTimeout(800);
  await snap('24_emergency_gate_handoff.png');

  // 25. Responder Arrival: On Scene Staging at Main Building (t = 45s)
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
  await snap('25_emergency_responder_onscene.png');

  // 26. Scenario Reset: System back to Standby
  await page.evaluate(() => {
    if (window.__twinguardApp) {
      window.__twinguardApp.reset();
    }
  });
  await page.waitForTimeout(600);
  await snap('26_scenario_reset_standby.png');

  // ==========================================
  // SECTION 6: COMPANION & RESPONSIVE VIEWS
  // ==========================================
  // 27. Mobile Evacuee Companion View (?view=evacuee on Mobile Viewport)
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro
  await page.goto('http://localhost:5173/?view=evacuee', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snap('27_mobile_companion_view.png');

  // 28. Mobile Evacuee 3D Floor Map
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const mapTab = btns.find(b => b.textContent && b.textContent.includes('3D Map'));
    if (mapTab) mapTab.click();
  });
  await page.waitForTimeout(800);
  await snap('28_mobile_companion_3d_map.png');

  // 29. Laptop / Compact Desktop Viewport (1200 x 750)
  await page.setViewportSize({ width: 1200, height: 750 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snap('29_viewport_compact_desktop.png');

  console.log('ALL 29 AUDIT SCREENSHOTS CAPTURED SUCCESSFULLY!');
});

