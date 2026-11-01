# Graph Report - TwinGuard-AI-V1  (2026-10-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 949 nodes · 2099 edges · 38 communities (20 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f24b156`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- evacuation_verification.js
- ExposureAssessment.js
- CampusLayout.js
- .constructor
- MasterAIEngine
- BuildingGraph.js
- SceneManager.js
- CampusBuildingsManager
- SceneManager
- LandscapeManager
- package.json
- RiskAssessment.js
- EmergencyVehiclesManager
- RoutingHazardAdapter.js
- HazardPropagation.js
- ZoneToGridMapper
- capture_cdp.cjs
- StrategyValidation.test.js
- AgentCrowd
- NavGrid
- compilerOptions
- server/index.js
- NavigationGraph
- ScenarioEngine
- dependencies
- FireParticles
- SafetyAnalystLLM
- SimulationClock
- BuildingGraph
- scripts
- ControlledClock
- ControlledClock
- RouteOptimizationEngine
- vite

## God Nodes (most connected - your core abstractions)
1. `SceneManager` - 45 edges
2. `loadBuilding()` - 40 edges
3. `CampusBuildingsManager` - 35 edges
4. `ZoneToGridMapper` - 29 edges
5. `Building3D` - 28 edges
6. `createTowerGraph()` - 28 edges
7. `LandscapeManager` - 27 edges
8. `MasterAIEngine` - 26 edges
9. `NavGrid` - 26 edges
10. `TextureHelper` - 26 edges

## Surprising Connections (you probably didn't know these)
- `advanceInSteps()` --calls--> `advanceHazardState()`  [EXTRACTED]
  src/simulation/HazardPropagation.test.js → src/simulation/HazardPropagation.js
- `App()` --calls--> `SceneManager`  [EXTRACTED]
  src/App.jsx → src/three/SceneManager.js
- `createHarness()` --calls--> `ZoneToGridMapper`  [EXTRACTED]
  src/simulation/Phase5EIntegration.test.js → src/simulation/ZoneToGridMapper.js
- `createHarness()` --calls--> `NavGrid`  [EXTRACTED]
  src/simulation/Phase5EIntegration.test.js → src/simulation/NavGrid.js
- `createTestScenario()` --calls--> `NavGrid`  [EXTRACTED]
  src/simulation/StrategyValidation.test.js → src/simulation/NavGrid.js

## Import Cycles
- None detected.

## Communities (38 total, 18 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.05
Nodes (47): lucide-react, react, AIEngine, EVACUATION_STRATEGIES, MultiStrategyRanker, StrategyRanker, AnalystLLM, createCase3Scenario() (+39 more)

### Community 1 - "evacuation_verification.js"
Cohesion: 0.02
Nodes (81): altPath, autoMgr, blockedExitPath, building100Occupants, case3LowerAgentsA, case3UpperAgentsA, connectivity, crowdOptimizer (+73 more)

### Community 2 - "ExposureAssessment.js"
Cohesion: 0.06
Nodes (68): accumulateComponent(), buildAggregate(), classifyComponent(), classifyZone(), computeZone(), createComponentAccumulator(), createUnalignedResult(), createUnknownZone() (+60 more)

### Community 3 - "CampusLayout.js"
Cohesion: 0.06
Nodes (27): three, CAMPUS_BOUNDS, CAMPUS_DISTRICTS, CAMPUS_ENTRANCES, CAMPUS_LAKE, CAMPUS_LAWNS, CAMPUS_ROUNDABOUT, CAMPUS_ROUNDABOUTS (+19 more)

### Community 5 - "MasterAIEngine"
Cohesion: 0.07
Nodes (4): BehavioralCrowdEngine, SpatialGrid, MasterAIEngine, ScenarioEngine

### Community 6 - "BuildingGraph.js"
Cohesion: 0.09
Nodes (37): applyScenario(), CONNECTION_TYPES, createConnection(), createExitZone(), createFloorZone(), createStairwellZone(), createTowerGraph(), EXIT_DEFINITIONS (+29 more)

### Community 7 - "SceneManager.js"
Cohesion: 0.13
Nodes (12): loadBuilding(), CrowdOptimizer, EDGE_STATUS, EDGE_TYPES, NODE_TYPES, getExitRouteCondition(), ROUTE_CONDITIONS, createOptimizer() (+4 more)

### Community 11 - "package.json"
Cohesion: 0.12
Nodes (23): description, devDependencies, autoprefixer@^10.6.2, concurrently@^10.0.6, graphify@^1.0.0, postcss@^8.5.32, tailwindcss@^4.3.3, @tailwindcss/postcss@^4.3.3 (+15 more)

### Community 12 - "RiskAssessment.js"
Cohesion: 0.19
Nodes (21): FIRE_STATUSES, HAZARD_SCHEMA_VERSION, SMOKE_STATUSES, assessFire(), ASSESSMENT_STATUSES, assessRisk(), assessSmoke(), classifyScore() (+13 more)

### Community 14 - "RoutingHazardAdapter.js"
Cohesion: 0.18
Nodes (18): CONNECTION_STATUSES, ROUTE_STATUSES, buildRoutingHazardContext(), combineConditions(), CONDITION_SEVERITY, connectionCondition(), createRoutingHazardPolicy(), DEFAULT_ROUTING_HAZARD_POLICY (+10 more)

### Community 15 - "HazardPropagation.js"
Cohesion: 0.19
Nodes (20): advanceHazardState(), buildFireState(), buildSmokeState(), chooseFireContribution(), chooseHigher(), computeFireContributions(), computeHopDistances(), computePotentialFireZones() (+12 more)

### Community 16 - "ZoneToGridMapper"
Cohesion: 0.17
Nodes (4): totalHazardCost(), clamp(), createZoneToGridMapper(), ZoneToGridMapper

### Community 17 - "capture_cdp.cjs"
Cohesion: 0.10
Nodes (12): distDir, fs, http, path, server, { spawn }, content, fs (+4 more)

### Community 19 - "StrategyValidation.test.js"
Cohesion: 0.18
Nodes (6): createHazardState(), Pathfinder, createMockAgent(), createTestScenario(), runStrategy(), STRATEGY_TYPES

### Community 21 - "NavGrid"
Cohesion: 0.19
Nodes (5): goal, navGrid, navGrid2, start, NavGrid

### Community 22 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, baseUrl, checkJs, jsx, module, moduleResolution, paths (+4 more)

### Community 23 - "server/index.js"
Cohesion: 0.15
Nodes (10): express@^4.21.2, express, app, exits, FLOOR_THEMES, initialRooms, io, ROOM_TEMPLATES (+2 more)

### Community 26 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, cors@^2.8.5, lucide-react@^1.16.0, react@^18.3.1, react-dom@^18.3.1, socket.io@^4.8.1, socket.io-client@^4.8.1, three@^0.170.0 (+4 more)

### Community 31 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, dev:client, preview, server, test

### Community 35 - "vite"
Cohesion: 0.40
Nodes (4): vite@^6.0.7, @vitejs/plugin-react@^4.3.4, vite, @vitejs/plugin-react

## Knowledge Gaps
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `CampusLayout.js` to `App.jsx`, `evacuation_verification.js`, `SceneManager.js`, `package.json`, `EmergencyVehiclesManager`, `dependencies`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.052507836990595615 - nodes in this community are weakly interconnected._
- **Why does `loadBuilding()` connect `SceneManager.js` to `ExposureAssessment.js`, `BuildingGraph.js`, `RiskAssessment.js`, `RoutingHazardAdapter.js`, `HazardPropagation.js`, `StrategyValidation.test.js`, `BuildingGraph`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `evacuation_verification.js` be split into smaller, more focused modules?**
  _Cohesion score 0.024096385542168676 - nodes in this community are weakly interconnected._
- **Why does `SceneManager` connect `SceneManager` to `App.jsx`, `.constructor`, `SceneManager.js`, `EmergencyVehiclesManager`, `.animate`, `AgentCrowd`, `SimulationClock`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `ExposureAssessment.js` be split into smaller, more focused modules?**
  _Cohesion score 0.057942057942057944 - nodes in this community are weakly interconnected._
- **Should `CampusLayout.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06433566433566433 - nodes in this community are weakly interconnected._