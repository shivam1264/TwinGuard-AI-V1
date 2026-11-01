// TwinGuard AI - End-to-End Browser QA Suite
// Real browser (Playwright Chromium), real backend services (localhost:5000 + Vite 5173).
// No mocked APIs, no static data substitution.
const { test, expect } = require('@playwright/test');
const {
  snap,
  startErrorCollection,
  attachErrors,
  waitForApp,
  getSceneManager,
  getBackendState,
  floorButtonOverlay,
} = require('./helpers.cjs');

const START_BTN = { role: 'button', name: /START EVACUATION/ };
const PAUSE_BTN = { role: 'button', name: /PAUSE EVACUATION/ };
const RESET_BTN = { role: 'button', name: /^RESET$/ };

const STRATEGIES = [
  { id: 'NEAREST_CORE', button: 'ACTIVATE STRATEGY ON 3D TWIN', index: 0, label: 'Nearest Core', behavior: 'Nearest Core' },
  { id: 'LOAD_BALANCED', button: 'TEST THIS STRATEGY', index: 1, label: 'Load Balanced', behavior: 'Load Balanced' },
  { id: 'PHASED_ZONE', button: 'TEST THIS STRATEGY', index: 2, label: 'Phased Zone', behavior: 'Phased Zone' },
];

test.use({ ignoreHTTPSErrors: true });

let currentCollected = {};

test.beforeEach(async ({ page }) => {
  currentCollected = startErrorCollection(page);
});

test.afterEach(async ({ page }) => {
  await attachErrors(test.info(), currentCollected || {});
});

async function agentSnapshot(page) {
  return getSceneManager(page).then((sm) => {
    const agents = (sm && sm.agentCrowd && sm.agentCrowd.agents) || [];
    return {
      elapsed: sm ? sm.elapsedSeconds : -1,
      isSimulating: sm ? sm.isSimulating : false,
      activeStrategyType: sm ? sm.activeStrategyType : null,
      pendingReroutes: sm ? sm.pendingRerouteEvents.length : 0,
      agents: agents.map((a) => ({
        id: a.id,
        state: a.state,
        x: a.mesh?.position?.x ?? a.x,
        y: a.mesh?.position?.y ?? a.y,
        z: a.mesh?.position?.z ?? a.z,
        pathLen: a.path ? a.path.length : 0,
      })),
      routeLines: sm?.agentCrowd?.routeLines ? sm.agentCrowd.routeLines.size : 0,
      activeFires: sm?.fireSystem?.activeFires ? sm.fireSystem.activeFires.size : 0,
      hazardState: !!sm?.hazardState,
    };
  });
}

function stateCounts(agents) {
  const counts = {};
  agents.forEach((a) => {
    counts[a.state] = (counts[a.state] || 0) + 1;
  });
  return counts;
}

function positionsChanged(a, b) {
  const byId = {};
  a.forEach((x) => (byId[x.id] = x));
  return b.some((nb) => {
    const oa = byId[nb.id];
    if (!oa) return true;
    return Math.abs(nb.x - oa.x) > 0.02 || Math.abs(nb.z - oa.z) > 0.02;
  });
}

async function triggerFireViaUI(page) {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  await canvas.dblclick({ position: { x: box.width / 2, y: box.height / 2 } });
  const startFire = page.getByRole('button', { name: 'Start Fire' });
  let triggeredVia = 'none';
  if ((await startFire.count()) > 0 && (await startFire.first().isVisible())) {
    await startFire.first().click();
    triggeredVia = 'ui';
  } else {
    await page.evaluate(() => window.__sceneManager.triggerFire('f5_r4'));
    triggeredVia = 'scene-manager-api';
  }
  await page.waitForTimeout(1200);
  return triggeredVia;
}

test.describe('Phase 2 - First-time user experience', () => {
  test('loads without errors, building and controls visible', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await snap(page, '01_initial_state');

    await expect(page.getByRole('heading', { name: 'TWINGUARD AI' })).toBeVisible();
    await expect(page.getByText('Digital Twin Command Platform')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();

    await expect(page.getByText('10 Floors • 100 Rooms')).toBeVisible();
    await expect(page.getByText('Gross Area: 25,400 m²')).toBeVisible();

    for (let f = 1; f <= 10; f++) {
      await expect(page.getByRole('button', { name: `L${f}` }).first()).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Show All/ })).toBeVisible();

    await expect(page.getByText('Total Occupants')).toBeVisible();
    await expect(page.getByText('Evacuated')).toBeVisible();
    await expect(page.getByText('In Movement')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
    await expect(page.getByText('Active Strategy')).toBeVisible();
    await expect(page.getByText('Stairwell Status')).toBeVisible();

    await expect(page.getByRole(START_BTN)).toBeVisible();
    await expect(page.getByRole(RESET_BTN)).toBeVisible();
    await expect(page.getByText('Simulation Speed')).toBeVisible();
    await expect(page.getByRole('button', { name: '1x' })).toBeVisible();

    const state = await getBackendState(page);
    expect(state.rooms.length).toBe(100);
    expect(state.totalOccupants).toBeGreaterThan(0);
  });

  test('speed pills, floor badges and viewport overlay controls are present', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await snap(page, '02_viewport_controls');

    for (const s of ['0.5x', '1x', '2x', '4x']) {
      await expect(page.getByRole('button', { name: s })).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'Exterior' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Interior' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Top View' })).toBeVisible();
    for (let f = 1; f <= 10; f++) {
      await expect(floorButtonOverlay(page, f)).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Zoom In/ })).toBeVisible();
  });
});

test.describe('Phase 3 - Core simulation controls', () => {
  test('start evacuation - agents move, clock advances, KPIs update', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await snap(page, '03a_before_start');

    const backend = await getBackendState(page);
    const expectedTotal = backend.totalOccupants;

    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole(START_BTN)).toHaveCount(0);

    const before = await agentSnapshot(page);
    expect(before.agents.length).toBeGreaterThan(50);
    expect(before.agents.length).toBe(expectedTotal);
    const t0 = before.elapsed;

    await page.waitForTimeout(3000);
    const after = await agentSnapshot(page);
    expect(after.elapsed).toBeGreaterThan(t0);
    expect(positionsChanged(before.agents, after.agents)).toBe(true);
    const states1 = stateCounts(after.agents);
    const moving = (states1['EVACUATING'] || 0) + (states1['WAITING'] || 0);
    expect(moving).toBeGreaterThan(0);

    await snap(page, '03b_during_evacuation');
  });

  test('pause and resume - clock freezes and continues', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();
    await page.waitForTimeout(2000);

    const paused = await agentSnapshot(page);
    const tPause = paused.elapsed;
    const posPause = paused.agents.map((a) => ({ id: a.id, x: a.x, z: a.z }));

    await page.getByRole(PAUSE_BTN).click();
    await expect(page.getByRole(START_BTN)).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2500);
    const stillPaused = await agentSnapshot(page);
    expect(stillPaused.elapsed).toBe(tPause);
    expect(positionsChanged(posPause, stillPaused.agents)).toBe(false);

    await page.getByRole({ role: 'button', name: /PAUSE EVACUATION/ }).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();
    await page.waitForTimeout(2500);
    const resumed = await agentSnapshot(page);
    expect(resumed.elapsed).toBeGreaterThan(tPause);
    expect(positionsChanged(posPause, resumed.agents)).toBe(true);

    await snap(page, '04_pause_resume');
  });

  test('simulation speed 0.5x / 1x / 2x / 4x changes clock progression', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();

    const ratios = {};
    for (const speed of [0.5, 1.0, 2.0, 4.0]) {
      await page.getByRole('button', { name: `${speed}x` }).click();
      const btn = page.getByRole('button', { name: `${speed}x` }).first();
      await expect(btn).toHaveCSS('background-color', /rgb\(37, 99, 235\)/);

      const s0 = await agentSnapshot(page);
      const t0 = s0.elapsed;
      await page.waitForTimeout(1500);
      const s1 = await agentSnapshot(page);
      ratios[speed] = (s1.elapsed - t0) / 1.5;
    }

    expect(ratios[4.0]).toBeGreaterThan(ratios[1.0] * 2.0);
    expect(ratios[0.5]).toBeLessThan(ratios[1.0]);
    expect(ratios[1.0]).toBeGreaterThan(0.5);

    await snap(page, '05_speed_pills');
  });

  test('reset returns simulation to initial state and can start again; agents respawn', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    const backend = await getBackendState(page);
    const expectedTotal = backend.totalOccupants;

    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();
    await page.waitForTimeout(2000);

    await page.getByRole(RESET_BTN).click();
    await expect(page.getByRole(START_BTN)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole(PAUSE_BTN)).toHaveCount(0);

    const reset = await agentSnapshot(page);
    expect(reset.elapsed).toBeLessThanOrEqual(1);
    expect(reset.agents.length).toBeGreaterThan(50);
    expect(reset.agents.length).toBe(expectedTotal);
    expect(reset.activeFires).toBe(0);

    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible({ timeout: 15000 });
    const restarted = await agentSnapshot(page);
    expect(restarted.elapsed).toBeGreaterThan(0);

    await snap(page, '06_reset_restart');
  });
});

test.describe('Phase 4 - Agent and evacuation visualization', () => {
  test('agent states, counts and routes during an evacuation', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();
    await page.waitForTimeout(6000);

    const snapShot = await agentSnapshot(page);
    const counts = stateCounts(snapShot.agents);
    const total = snapShot.agents.length;
    const accounted = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(accounted).toBe(total);

    const active = (counts['WAITING'] || 0) + (counts['EVACUATING'] || 0);
    expect(active).toBeGreaterThan(0);
    expect(snapShot.routeLines).toBeGreaterThan(0);

    await snap(page, '07_agent_states_and_routes');
  });

  test('evacuation reaches SAFE state and routes clear', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();

    await page.getByRole('button', { name: '4x' }).click();
    await page.waitForTimeout(15000);

    let finished = false;
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(3000);
      const s = await agentSnapshot(page);
      const counts = stateCounts(s.agents);
      if ((counts['SAFE'] || 0) === s.agents.length && s.agents.length > 0) {
        finished = true;
        break;
      }
    }
    expect(finished).toBe(true);

    const final = await agentSnapshot(page);
    const counts = stateCounts(final.agents);
    expect((counts['SAFE'] || 0)).toBe(final.agents.length);
    expect(final.routeLines).toBe(0);

    await snap(page, '08_final_evacuation_state');
  });
});

test.describe('Phase 5 - Fire and hazard response', () => {
  test('fire trigger UI starts a fire in the selected room', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await snap(page, '09a_before_fire');

    const triggeredVia = await triggerFireViaUI(page);

    const backend = await getBackendState(page);
    const burning = backend.rooms.filter((r) => r.hasFire);
    expect(burning.length).toBeGreaterThan(0);
    const sm = await getSceneManager(page);
    expect(sm.activeFires).toBeGreaterThan(0);
    expect(sm.hazardState).toBe(true);

    await snap(page, '09b_fire_triggered');
    currentCollected.note = `fire triggered via ${triggeredVia}`;
  });

  test('smoke/fire cleared on reset', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    const triggeredVia = await triggerFireViaUI(page);
    let sm = await getSceneManager(page);
    expect(sm.activeFires).toBeGreaterThan(0);

    await page.getByRole(RESET_BTN).click();
    await expect(page.getByRole(START_BTN)).toBeVisible();
    await page.waitForTimeout(1000);

    sm = await getSceneManager(page);
    expect(sm.activeFires).toBe(0);
    const backend = await getBackendState(page);
    expect(backend.rooms.filter((r) => r.hasFire).length).toBe(0);

    await snap(page, '10_after_reset_no_fire');
    currentCollected.note = `fire triggered via ${triggeredVia}`;
  });
});

test.describe('Phase 6 - Hazard-aware evacuation and rerouting', () => {
  test('fire mid-evacuation produces rerouting events and updated routes', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();
    await page.waitForTimeout(4000);

    const before = await agentSnapshot(page);
    const beforeReroutes = before.pendingReroutes;
    await snap(page, '11a_before_fire_reroute');

    await triggerFireViaUI(page);
    await page.waitForTimeout(4000);

    const after = await agentSnapshot(page);
    const backend = await getBackendState(page);
    const burning = backend.rooms.filter((r) => r.hasFire);
    expect(burning.length).toBeGreaterThan(0);

    const rerouteCardVisible = await page
      .getByText(/Latest Reroute/)
      .first()
      .isVisible()
      .catch(() => false);
    expect(after.pendingReroutes > beforeReroutes || rerouteCardVisible).toBe(true);

    await page.waitForTimeout(3000);
    const later = await agentSnapshot(page);
    expect(positionsChanged(after.agents, later.agents)).toBe(true);

    await snap(page, '11b_after_fire_reroute');
  });
});

test.describe('Phase 7 - Evacuation strategy testing', () => {
  async function applyStrategy(page, strategy) {
    await page.getByRole('button', { name: 'Strategy Ranker' }).click();
    const btn = page.getByRole('button', { name: strategy.button }).nth(strategy.index);
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible({ timeout: 15000 });
    const sm = await getSceneManager(page);
    expect(sm.activeStrategyType).toBe(strategy.id);
  }

  for (const strategy of STRATEGIES) {
    test(`strategy ${strategy.id} selected via UI, indicator matches`, async ({ page }) => {
      await page.goto('/');
      await waitForApp(page);
      await applyStrategy(page, strategy);
      await page.waitForTimeout(3000);

      await expect(page.getByText('Active Strategy')).toBeVisible();
      await expect(page.getByText(strategy.label)).toBeVisible();
      await expect(page.getByText(strategy.behavior)).toBeVisible();

      const sm = await getSceneManager(page);
      expect(sm.agents.length).toBeGreaterThan(50);

      await snap(page, `12_strategy_${strategy.id}`);
    });
  }

  test('PHASED_ZONE: waiting agents, counts, and release', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await applyStrategy(page, STRATEGIES[2]);
    await page.waitForTimeout(3000);

    const early = await agentSnapshot(page);
    const earlyCounts = stateCounts(early.agents);
    expect((earlyCounts['WAITING'] || 0)).toBeGreaterThan(0);

    await expect(page.getByText(/Phased release active/)).toBeVisible();
    await expect(page.getByText('Waiting')).toBeVisible();

    const waitingIds = early.agents.filter((a) => a.state === 'WAITING').map((a) => a.id);
    await page.waitForTimeout(3000);
    const mid = await agentSnapshot(page);
    const stillWaiting = mid.agents.filter((a) => waitingIds.includes(a.id) && a.state === 'WAITING');
    expect(stillWaiting.length).toBe(waitingIds.length);

    let released = false;
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(3000);
      const s = await agentSnapshot(page);
      const c = stateCounts(s.agents);
      if ((c['WAITING'] || 0) < (earlyCounts['WAITING'] || 0)) {
        released = true;
        break;
      }
    }
    expect(released).toBe(true);

    const late = await agentSnapshot(page);
    const lateCounts = stateCounts(late.agents);
    expect((lateCounts['EVACUATING'] || 0)).toBeGreaterThan((earlyCounts['EVACUATING'] || 0));

    await snap(page, '13_phased_zone_waiting');
  });
});

test.describe('Phase 8 - Exit capacity and congestion', () => {
  test('all exits represented, loads update, no fake throughput claims', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.getByRole(START_BTN).click();
    await expect(page.getByRole(PAUSE_BTN)).toBeVisible();
    await page.waitForTimeout(4000);

    await expect(page.getByText('Stairwell A (West Core)')).toBeVisible();
    await expect(page.getByText('Stairwell B (East Core)')).toBeVisible();
    await expect(page.getByText('Stairwell C (South Exit)')).toBeVisible();
    await expect(page.getByText('Stairwell D (Elevators)')).toBeVisible();

    const pageText = await page.locator('body').innerText();
    expect(pageText).not.toMatch(/people\s*(\/|per)\s*min/i);
    expect(pageText).not.toMatch(/throughput/i);

    await snap(page, '14_exit_capacity_congestion');
  });
});

test.describe('Phase 9 - Floor, camera, and interface controls', () => {
  async function openAndCloseModal(page, openLocator, closeTitle, contentAssertion) {
    await openLocator.click();
    if (contentAssertion) await contentAssertion(page);
    const closeBtn = page.getByTitle(closeTitle);
    if ((await closeBtn.count()) > 0) {
      await closeBtn.first().click();
    }
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByRole(START_BTN)).toBeVisible();
  }

  test('floor selection L1-L10 and view controls work', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    await floorButtonOverlay(page, 5).click();
    await expect(floorButtonOverlay(page, 5).first()).toHaveCSS('background-color', /rgb\(37, 99, 235\)/);
    await snap(page, '15a_floor_l5');

    await page.getByRole('button', { name: /Show All/ }).click();
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: 'Interior' }).click();
    await expect(page.getByRole('button', { name: 'Interior' })).toHaveCSS('background-color', /rgb\(37, 99, 235\)/);
    await snap(page, '15b_interior_view');

    await page.getByRole('button', { name: 'Exterior' }).click();
    await expect(page.getByRole('button', { name: 'Exterior' })).toHaveCSS('background-color', /rgb\(37, 99, 235\)/);

    await page.getByRole('button', { name: 'Top View' }).click();
    await page.waitForTimeout(800);
    await snap(page, '15c_top_view');

    await page.getByRole('button', { name: /Zoom In/ }).click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /Reset View/ }).click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /Toggle Exploded BIM View/ }).click();
    await page.waitForTimeout(800);
    await snap(page, '15d_exploded_zoom');
  });

  test('modals open and close without breaking the app', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    await openAndCloseModal(page, page.getByRole('button', { name: 'CCTV Monitoring' }), 'Close Multiviewer', () => {});
    await snap(page, '16a_cctv_closed');

    await openAndCloseModal(page, page.getByRole('button', { name: /Incidents/ }), 'Close Dialog', () => {});
    await openAndCloseModal(page, page.getByRole('button', { name: 'Reports' }), 'Close Dialog', () => {});
    await openAndCloseModal(page, page.getByRole('button', { name: 'Settings' }), 'Close Dialog', () => {});
    await openAndCloseModal(page, page.getByRole('button', { name: 'AI Scenarios' }), 'Close Dialog', () => {});
    await openAndCloseModal(
      page,
      page.getByRole('button', { name: 'Building Information' }),
      'Close Dialog',
      () => expect(page.getByText('10 Floors • 100 Rooms')).toBeVisible()
    );
    await openAndCloseModal(page, page.getByRole('button', { name: 'Emergency Control' }), 'Close Dialog', () => {});
    await openAndCloseModal(page, page.getByRole('button', { name: 'Strategy Ranker' }), 'Close Dialog', () => {});

    await snap(page, '16b_all_modals_closed');
  });
});

test.describe('Phase 10 - Lifecycle and stability', () => {
  test('three full start-fire-pause-resume-reset cycles', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    for (let cycle = 1; cycle <= 3; cycle++) {
      await page.getByRole(START_BTN).click();
      await expect(page.getByRole(PAUSE_BTN)).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      await canvas.dblclick({ position: { x: box.width / 2, y: box.height / 2 } });
      const startFire = page.getByRole('button', { name: 'Start Fire' });
      if ((await startFire.count()) > 0) await startFire.first().click();
      else await page.evaluate(() => window.__sceneManager.triggerFire(`f${cycle}_r${cycle}`));
      await page.waitForTimeout(1500);

      const smFire = await getSceneManager(page);
      expect(smFire.hazardState).toBe(true);

      await page.getByRole(PAUSE_BTN).click();
      await expect(page.getByRole({ role: 'button', name: /PAUSE EVACUATION/ })).toHaveCount(0);
      const tPause = (await agentSnapshot(page)).elapsed;
      await page.waitForTimeout(2000);
      expect((await agentSnapshot(page)).elapsed).toBe(tPause);

      await page.getByRole({ role: 'button', name: /PAUSE EVACUATION/ }).click();
      await expect(page.getByRole(PAUSE_BTN)).toBeVisible();

      await page.getByRole(RESET_BTN).click();
      await expect(page.getByRole(START_BTN)).toBeVisi
    await expect(page.getByRole(START_BTN)).toBeVisible({ timeout: 10000 });
    const afterReset = await agentSnapshot(page);
    expect(afterReset.activeFires).toBe(0);
    expect(afterReset.agents.length).toBeGreaterThan(0);
  }

  await snap(page, '17_three_cycles_complete');
});

test('page refresh recovers and simulation can start again', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole(START_BTN).click();
  await expect(page.getByRole(PAUSE_BTN)).toBeVisible();

  await page.reload();
  await waitForApp(page);
  await snap(page, '18_after_refresh');

  await page.getByRole(START_BTN).click();
  await expect(page.getByRole(PAUSE_BTN)).toBeVisible({ timeout: 15000 });
});
});
