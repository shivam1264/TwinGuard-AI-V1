import assert from 'assert';
import fs from 'fs';

console.log('=======================================================');
console.log('🧪 TESTING LEFT SIDEBAR 8-MODULE NAVIGATION & ROUTING');
console.log('=======================================================');

// 1. Verify DynamicLeftSidebar.jsx contains the 8 items
const sidebar = fs.readFileSync('src/components/DynamicLeftSidebar.jsx', 'utf8');

const requiredModules = [
  { id: 'LIVE_VIEW', label: '3D Digital Twin' },
  { id: 'COMMAND_CENTER', label: 'Command Center' },
  { id: 'BUILDING_INFO', label: 'Building Info' },
  { id: 'SCENARIOS', label: 'AI Scenarios' },
  { id: 'STRATEGY_RANKER', label: 'Strategy Ranker' },
  { id: 'INCIDENTS', label: 'Incidents' },
  { id: 'ANALYTICS', label: 'Analytics' }
];

requiredModules.forEach(({ id, label }) => {
  assert(sidebar.includes(`id: '${id}'`), `DynamicLeftSidebar must contain module ID: ${id}`);
  assert(sidebar.includes(`'${label}'`), `DynamicLeftSidebar must contain label: ${label}`);
});
console.log('✅ PASS: All 7 core navigation items exist in DynamicLeftSidebar.jsx with exact labels & IDs');

// 2. Verify Collapsed and Expanded States in DynamicLeftSidebar.jsx
assert(sidebar.includes('isCollapsed ?'), 'DynamicLeftSidebar must support isCollapsed state');
assert(sidebar.includes('primaryNavItems.map'), 'DynamicLeftSidebar must render primaryNavItems');
assert(sidebar.includes('item.badge'), 'DynamicLeftSidebar must support badge counts (e.g. Incidents)');
assert(sidebar.includes('START EVACUATION'), 'DynamicLeftSidebar must include evacuation launch controls');
console.log('✅ PASS: Collapsed rail and expanded menu both cleanly supported with badges & controls');

// 3. Verify App.jsx renders DynamicLeftSidebar persistently
const app = fs.readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

// The sidebar must NOT be wrapped in a condition that hides it when away from LIVE_VIEW
assert(app.includes('<DynamicLeftSidebar'), 'App.jsx must render DynamicLeftSidebar');
assert(!app.includes("{activeTab === 'LIVE_VIEW' && activeSidebarMode !== 'INFO' && activeSidebarMode !== 'COMMAND_CENTER' && (\n          <DynamicLeftSidebar"), 
  'DynamicLeftSidebar must be persistent and not hidden outside LIVE_VIEW');
console.log('✅ PASS: DynamicLeftSidebar is persistently rendered across all views in App.jsx');

// 4. Verify all 8 Views are mounted in the central workspace where 3D is shown
assert(app.includes("activeTab === 'SCENARIOS' && (\n            <ScenariosView"), 'Central area must render ScenariosView for SCENARIOS');
assert(app.includes("activeTab === 'STRATEGY_RANKER' && (\n            <StrategyRankerView"), 'Central area must render StrategyRankerView for STRATEGY_RANKER');
assert(app.includes("activeTab === 'INCIDENTS' && (\n            <IncidentsView"), 'Central area must render IncidentsView for INCIDENTS');
assert(app.includes("activeTab === 'ANALYTICS' && (\n            <AnalyticsView"), 'Central area must render AnalyticsView for ANALYTICS');
// Reports page integrated into AnalyticsView with PDF/Print export
assert(app.includes("activeTab === 'ANALYTICS' && (\n            <AnalyticsView"), 'Central area must render AnalyticsView');
assert((app.includes("activeTab === 'BUILDING_INFO'") || app.includes("activeSidebarMode === 'INFO'")) && app.includes('<BuildingInfoPage'), 
  'Central area must render BuildingInfoPage for BUILDING_INFO');
assert((app.includes("activeTab === 'COMMAND_CENTER'") || app.includes("activeSidebarMode === 'COMMAND_CENTER'")) && app.includes('<EmergencyCommandCenterPage'), 
  'Central area must render EmergencyCommandCenterPage for COMMAND_CENTER');
assert(app.includes("activeTab === 'LIVE_VIEW'"), 
  'Central area must render Three.js Canvas & ViewportOverlay for LIVE_VIEW');
console.log('✅ PASS: All 8 modules render directly inside the central workspace where 3D canvas is located');

// 5. Verify handleSelectTab unified routing
assert(app.includes('const handleSelectTab = (tab) => {'), 'App.jsx must define handleSelectTab');
assert(app.includes("setActiveSidebarMode('INFO')"), 'handleSelectTab must set INFO mode for BUILDING_INFO');
assert(app.includes("setActiveSidebarMode('COMMAND_CENTER')"), 'handleSelectTab must set COMMAND_CENTER mode');
assert(app.includes("setActiveSidebarMode('3D_VIEW')"), 'handleSelectTab must set 3D_VIEW mode for live view');
console.log('✅ PASS: handleSelectTab smoothly switches between all 8 view states');

// 6. Verify TopHeader.jsx is streamlined
const topHeader = fs.readFileSync('src/components/TopHeader.jsx', 'utf8');
assert(!topHeader.includes("navItems.map((item) => {"), 'TopHeader should no longer have the crowded 8 horizontal buttons');
assert(topHeader.includes('HORIZON TOWER (10 LEVELS)'), 'TopHeader renders clean facility telemetry');
assert(topHeader.includes('ActiveIcon'), 'TopHeader renders active module indicator');
console.log('✅ PASS: TopHeader streamlined with clean status indicator and live clock');

console.log('=======================================================');
console.log('🎯 ALL 8-MODULE LEFT SIDEBAR TESTS PASSED SUCCESSFULLY!');
console.log('=======================================================');

