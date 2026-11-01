# TwinGuard AI — Multi-Agent Team Collaboration & Architecture Rules

> **CRITICAL NOTICE FOR ALL ANTIGRAVITY AGENTS:**
> A 5-member engineering team is actively building this codebase in parallel across different machines using Antigravity agents.
> You MUST read and strictly adhere to these rules before making ANY code modifications.

---

## 1. ABSOLUTE PRESERVATION RULES (ZERO REGRESSION)
1. **Never delete, roll back, or overwrite existing functionality**:
   - If a file already has working features (3D viewport, GIS maps, strategy rankers, scenarios, evacuee companion, analytics, floor selectors), your task is strictly **additive**.
   - Inspect the file thoroughly before writing code. Never truncate existing helper functions, imports, docstrings, or hooks.
2. **Never resurrect zombie or deprecated code**:
   - Do NOT bring back previously removed components (e.g. `RightSidebar`).
   - Check `git log -n 5` if you are unsure whether a component was deliberately deleted.
3. **Dual Clock Architecture in Three.js (`src/three/SceneManager.js`)**:
   - The render frame clock (`THREE.Clock`) MUST remain decoupled from the simulation clock (`SimulationClock`).
   - Never collapse these two clocks into one, or keyboard shortcuts (`C`, `H`, `W`, `A`, `S`, `D`, `Q`, `E`) and camera controls will freeze.
4. **Site Map (Leaflet) Invalidation**:
   - Always keep `debounceMoveend: false` on size invalidations so tiles load immediately when expanded without white borders.
   - Maintain dark tactical background `#0b1528`.
5. **Fluid 3D Viewport**:
   - The Three.js canvas element MUST have `width: 100%`, `height: 100%`, `position: absolute`, and `inset: 0` so it dynamically adapts to window resizing without requiring page refresh.

---

## 2. SHARED FILE EDITING PROTOCOL (`src/App.jsx`, `src/index.css`)
- Files like `src/App.jsx` are shared touchpoints for all 5 team members.
- **Rule**: When editing `src/App.jsx`, ONLY modify the exact lines relevant to your assigned task. Never reorganize, reorder, or rewrite other views or modals.
- Preserve existing state variables, handler functions, and modal toggles.

---

## 3. STRICT GIT & PUSH RULES
1. **Never push to `main` without explicit user command**:
   - Even if your build and tests pass, **DO NOT run `git push`** unless the user explicitly types: *"push the code"* or *"git push"*.
   - Suggest pushing, explain what was committed, and let the user decide.
2. **Conflict Resolution Policy**:
   - If a `git merge` or `git pull` results in a merge conflict, do NOT blindly discard remote changes in favor of local changes (or vice-versa).
   - Carefully inspect both blocks (`<<<<<<< HEAD` and `>>>>>>>`) and combine the logic so that **BOTH team members' features survive intact**.
   - Immediately run `npm test` after conflict resolution.

---

## 4. MANDATORY PRE-COMPLETION VERIFICATION GATEWAY
Before reporting to the user that any task is complete:
1. **Unit Test Verification**: Run `npm test -- --run` (all 235+ tests must pass).
2. **Build Verification**: Run `npm run build` (Vite production bundle must compile with 0 errors).
3. **Git Status Cleanliness**: Check `git status` to ensure no accidental debris or leftover temporary files exist.
