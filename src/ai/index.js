// ==============================================================================
// TwinGuard AI - Master AI Engine Facade
// Centralized, decoupled entry point for all AI/ML submodules
// ==============================================================================

import {
  ScenarioEngine,
  PRESET_SCENARIOS,
  HAZARD_TYPES,
  SEVERITY_LEVELS,
  MOBILITY_PROFILES
} from './ScenarioEngine.js';

import { BehavioralCrowdEngine } from './BehavioralCrowdEngine.js';

import {
  MultiStrategyRanker,
  StrategyRanker,
  EVACUATION_STRATEGIES
} from './MultiStrategyRanker.js';

import { SafetyAnalystLLM, AnalystLLM } from './SafetyAnalystLLM.js';
import { BottleneckPredictor, MLBottleneckPredictor } from './BottleneckPredictor.js';

class MasterAIEngine {
  constructor() {
    this.scenario = new ScenarioEngine();
    this.crowd = new BehavioralCrowdEngine();
    this.ranker = StrategyRanker;
    this.analyst = AnalystLLM;
    this.bottleneck = MLBottleneckPredictor;
    this.activeScenario = this.scenario.getScenario();
    this.activeStrategy = EVACUATION_STRATEGIES.STRATEGY_B; // Default to Smart Balanced Strategy
    this.listeners = new Set();
  }

  // Subscribe to AI state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.activeScenario = this.scenario.getScenario();
    this.listeners.forEach((cb) => cb(this.activeScenario, this.activeStrategy));
  }

  // --- Phase 1: Scenario & Demographic API ---

  getActiveScenario() {
    return this.scenario.getScenario();
  }

  setScenario(newScenario) {
    const updated = this.scenario.setScenario(newScenario);
    this.crowd.reset();
    this.notify();
    return updated;
  }

  loadPreset(presetId) {
    const loaded = this.scenario.loadPreset(presetId);
    if (loaded) {
      this.crowd.reset();
      this.notify();
    }
    return loaded;
  }

  updateScenarioConfig(updates) {
    const updated = this.scenario.updateConfig(updates);
    this.notify();
    return updated;
  }

  applyScenarioToRooms(baseRooms) {
    return this.scenario.applyToRooms(baseRooms);
  }

  applyScenarioToExits(baseExits) {
    return this.scenario.applyToExits(baseExits);
  }

  generateAgentProfile(index, totalAgents) {
    return this.scenario.generateAgentProfile(index, totalAgents);
  }

  exportScenarioJSON() {
    return this.scenario.exportToJSON();
  }

  importScenarioJSON(jsonStr) {
    const res = this.scenario.importFromJSON(jsonStr);
    if (res.success) {
      this.crowd.reset();
      this.notify();
    }
    return res;
  }

  // --- Phase 2: Microscopic Behavioral Crowd Engine API ---

  updateCrowdPhysics(agents, delta, simSpeed, fireLocations = [], floorMode = 'ALL') {
    return this.crowd.updateCrowdPhysics(agents, delta, simSpeed, fireLocations, floorMode);
  }

  getCrowdTelemetry() {
    return this.crowd.telemetry;
  }

  resetCrowd() {
    this.crowd.reset();
  }

  // --- Phase 3: Multi-Strategy Simulation & Ranking API ---

  getActiveStrategy() {
    return this.activeStrategy;
  }

  setActiveStrategy(strategy) {
    this.activeStrategy = strategy;
    this.notify();
    return this.activeStrategy;
  }

  rankStrategies(scenario = null, rooms = [], exits = []) {
    const targetScenario = scenario || this.getActiveScenario();
    return this.ranker.rankStrategies(targetScenario, rooms, exits);
  }

  simulateSingleStrategy(strategyConfig, scenario, rooms, exits) {
    return this.ranker.simulateStrategy(strategyConfig, scenario, rooms, exits);
  }

  // --- Phase 4: AI Safety Analyst & Incident Commander LLM API ---

  generateIncidentBriefing(scenario = null, rankingResult = null, telemetry = null) {
    const targetScenario = scenario || this.getActiveScenario();
    return this.analyst.generateIncidentBriefing(targetScenario, rankingResult, telemetry || this.getCrowdTelemetry());
  }

  auditNFPACompliance(scenario = null, rankingResult = null) {
    const targetScenario = scenario || this.getActiveScenario();
    return this.analyst.auditNFPACompliance(targetScenario, rankingResult);
  }

  async askSafetyAnalyst(question, scenario = null, rankingResult = null) {
    const targetScenario = scenario || this.getActiveScenario();
    return this.analyst.askSafetyAnalyst(question, targetScenario, rankingResult);
  }

  setGeminiApiKey(apiKey) {
    this.analyst.setApiKey(apiKey);
  }

  getEngineStatus() {
    return this.analyst.getEngineStatus();
  }

  hasLiveGeminiEnabled() {
    return this.analyst.hasLiveGeminiEnabled();
  }

  // --- Phase 5: Predictive Neural Bottleneck Forecaster API ---

  async predictBottleneck(params) {
    return this.bottleneck.predictBottleneck(params);
  }

  async getBottleneckSensitivityCurve(params) {
    return this.bottleneck.getSensitivityCurve(params);
  }

  async checkMLMicroserviceHealth() {
    return this.bottleneck.checkHealth();
  }
}


// Export singleton instance as primary API
export const AIEngine = new MasterAIEngine();

// Also export metadata and presets for UI components
export {
  PRESET_SCENARIOS,
  HAZARD_TYPES,
  SEVERITY_LEVELS,
  MOBILITY_PROFILES,
  BehavioralCrowdEngine,
  MultiStrategyRanker,
  StrategyRanker,
  EVACUATION_STRATEGIES,
  SafetyAnalystLLM,
  AnalystLLM,
  BottleneckPredictor,
  MLBottleneckPredictor
};
