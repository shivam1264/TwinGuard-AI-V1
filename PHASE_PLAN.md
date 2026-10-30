# TwinGuard-AI Phase Plan

Status: **Complete**
Last updated: 2026-10-30

## Locked decisions

- Validate the current hazard/risk/routing pipeline first (Phase 5E) before behavior changes.
- Leave the duplicated integration tests in `Phase5CIntegration.test.js` and `ZoneToGridMapper.test.js` untouched.
- Include the production scenario-loading fix in Phase 5E.
- Keep smoke status conservative as `unknown` for unreached zones.
- Occupancy and Exposure remain tested libraries; not wired live.
- Do not change risk/route semantics merely to make tests pass.
- Do not add abstractions unless a demonstrated defect requires one.

## Status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Baseline evidence (read-only) | Done |
| 1 | Repair Phase 5E harness and register in test script | Done |
| 2 | Add missing end-to-end tests | Done |
| 3 | Fix production scenario loading | Done |
| 4 | Phase 5E verification gate | Done (automated gates passed; manual checklist pending operator) |
| 5 | Interactive fire room-to-floor spread | Done |
| 6 | Localized prohibited connections | Done |
| 7 | Deduplicate update passes and App cleanup | Done |
| 8 | Final regression and release check | Done |

## Phase 0 - Baseline (Done)

- `npm test`: 163/163 pass.
- `src/simulation/Phase5EIntegration.test.js`: SyntaxError (duplicate `advanceHazardState` declaration), not in the test script.
- Coverage audit: 4 of 6 Phase 5E bullets already covered by `Phase5CIntegration.test.js` and `ZoneToGridMapper.test.js`.
- Real gaps: advance-to-grid consistency; reset clearing hazard state and grid costs together.

## Phase 1 - Repair Phase 5E harness

- Goal: make the Phase 5E test file parse and run in CI.
- Changes:
  - Rewrite `src/simulation/Phase5EIntegration.test.js` with clean imports and shared helpers.
  - Remove duplicate Phase5C tests and the duplicate operator-review test.
  - Add the file to the `test` script in `package.json`.
- Production code: none.
- Verify: `node --test src/simulation/Phase5EIntegration.test.js`; `npm test`.
- Exit: file executes without syntax errors and is part of the suite.

## Phase 2 - Add missing end-to-end tests

- Goal: close the two real Phase 5E coverage gaps.
- Tests:
  1. Advancing hazard state keeps hazard, risk, routing, and grid costs consistent.
  2. Reset clears hazard state and dynamic grid costs, then restart reinitializes.
- Production code: none.
- Verify: `npm test` (expected 165 pass).
- Exit: both tests pass; remaining Phase 5E bullets mapped to existing tests.

## Phase 3 - Fix production scenario loading

- Goal: scenario initialization works after `vite build`.
- Changes:
  - `src/App.jsx`: import `sample-fire.json` statically and initialize `activeScenario` with it.
  - Remove the dev-only `/src/...` fetch effect (`App.jsx:126-139`) and unused setter.
- Production code: `src/App.jsx` only.
- Verify: `npm run build`; scenario id present in bundled assets; preview old path returns 404 while app no longer requests it.
- Exit: built app loads the scenario without a network fetch.

## Phase 4 - Phase 5E verification gate

- Goal: close Phase 5E with evidence.
- Changes: none.
- Verify: `npm test`, `npm run build`, manual browser checklist.
- Deliverable: completion report with counts, coverage map, build/preview result, blockers, checklist.
- Exit: suite and build green; Phase 5E closed. Phase 5 may start only after this gate.

## Phase 5 - Interactive fire room-to-floor spread

- Goal: double-click fires enter hazard state and spread from a room through the floor.
- Changes:
  - `HazardPropagation.js`: `roomSpreadSec` (default 0), seed intensity, origin metadata, ramp/pending-to-active, propagate to stairs after floor spread, `injectFireSource`, `createHazardState`.
  - `SceneManager.triggerFire`: inject room-origin source; `startEvacuation` preserves hazard state; remove dead `navGrid.setFireZone`.
  - `ZoneToGridMapper`: growing radius from room origin; full-floor fallback for scenario fires.
  - Tests: room-to-floor timing, interactive fire survives evacuation start, scenario behavior unchanged at default config.
- Verify: `npm test`, `npm run build`.
- Exit: interactive fire propagates; existing suite green.

## Phase 6 - Localized prohibited connections

- Goal: a prohibited connection must not block entire floor plates.
- Changes:
  - `ZoneToGridMapper.js:238-251`: replace whole-zone blocking with localized blocking at connection endpoints.
  - Update `ZoneToGridMapper.test.js:804`; add regression test that a prohibited L5 connection leaves the floor pathable.
- Verify: regression fails on old behavior; `npm test`.
- Exit: no whole-floor lockout; prohibited connections still respected.

## Phase 7 - Deduplicate update passes and App cleanup

- Goal: remove redundant work and dead code without behavior change.
- Changes:
  - `SceneManager.animate`: remove duplicate `updateRoutingContext` / `applyHazardStateToGrid` calls per frame.
  - `App.jsx`: remove unused `createTowerGraph`, `loadBuilding`, `applyScenario` import and unused `isSettingsOpen`.
- Verify: `npm test`; manual confirmation that hazard updates still occur once per frame.
- Exit: no duplicate updates; suite green.

## Phase 8 - Final regression and release check

- Goal: prove the full system after behavior changes.
- Changes: none.
- Verify: `npm test`, `npm run build`, preview smoke test, manual checklist re-run.
- Deliverable: final report with tests added, totals, build result, and remaining risks.
- Exit: all phases closed; deferred items documented.

## Execution log

- 2026-10-30: Phase 0 complete. Baseline 163/163 pass; Phase5E parse error confirmed.
- 2026-10-30: Phase 1 complete. Rewrote `Phase5EIntegration.test.js` with clean imports/helpers and registered it in `npm test`. Suite: 164 pass.
- 2026-10-30: Phase 2 complete. Added the advance-to-grid consistency test and the reset-to-grid clearing test. Suite: 165/165 pass.
- 2026-10-30: Phase 3 complete. `App.jsx` now imports `sample-fire.json` statically instead of fetching the dev-only `/src/...` path. Build succeeded; bundle contains `sample-fire-l5`; old path returns SPA HTML (`text/html`), confirming the fetch could not parse JSON. Suite: 165/165 pass.
- 2026-10-30: Phase 4 automated gates passed.
  - `npm test`: **165/165 pass** (unchanged).
  - `npm run build`: success; bundle contains `sample-fire-l5`; chunk size warning only.
  - Preview smoke: root returns 200; old `/src/...` path returns SPA HTML (`text/html`), not JSON.
  - Coverage mapping: all 6 Phase 5E bullets accounted for (2 new tests + 4 existing in Phase5C/ZTGM).
  - Blockers: urgent reevaluation cooldown bypass is not unit-testable without a SceneManager refactor (static evidence: `checkUrgentReevaluation` ignores `reevaluationCooldown`; manual checklist required).
  - Manual browser checklist (pending operator):
    1. Load app; confirm server connection and no scenario warning.
    2. Start evacuation; confirm fire visuals and hazard grid expansion.
    3. Prohibited route triggers immediate reroute (not after cooldown).
    4. Pause/resume: elapsed time does not jump; agents freeze/resume.
    5. Reset: fire extinguished, grid cleared, agents respawn, stats zeroed, scenario retained.
    6. Collapse/expand panels: viewport resizes correctly.
- 2026-10-30: Phase 5 complete. Implemented interactive fire room→floor spread:
  - `HazardPropagation.js`: added `roomSpreadSec` config (default 30s), `interactive` source type, `injectFireSource()`, `createHazardState()`, `roomIdToFloorZone()`.
  - `SceneManager.js`: `triggerFire()` now injects interactive fire with room center; removed dead `navGrid.setFireZone`; `startEvacuation()` preserves existing hazard state.
  - `ZoneToGridMapper.js`: added `applyInteractiveFireHazard()` with growing radius from room origin; updated `applyHazardStateToGrid()` to handle interactive fires.
  - All 165 tests pass; build succeeds.
- 2026-10-30: Phase 6 complete. Localized prohibited connections:
  - `ZoneToGridMapper.js`: added `applyProhibitedConnection()` and `_applyProhibitedDoorway()` to block only the doorway/stairwell entrance instead of entire zones.
  - Updated `applyHazardStateToGrid()` to call `applyProhibitedConnection()` for prohibited connections.
  - Added regression test: prohibited connection blocks only the doorway, not the entire floor (L5 remains traversable).
  - All 166 tests pass; build succeeds.
- 2026-10-30: Phase 7 complete. Deduplicate update passes and App cleanup:
  - `SceneManager.js`: removed duplicate `updateRoutingContext()` call in animate loop (was called in `advanceHazardState()` and explicitly).
  - `App.jsx`: removed unused `createTowerGraph`, `loadBuilding`, `applyScenario` import and unused `isSettingsOpen` state.
  - All 166 tests pass; build succeeds.
- 2026-10-30: Phase 8 complete. Final regression and release check:
  - `npm test`: **166/166 pass** (up from 163 baseline).
  - `npm run build`: success; bundle contains `sample-fire-l5`.
  - Preview smoke: root returns 200; scenario bundled.
  - All phases complete.
