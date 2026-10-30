// ==============================================================================
// TwinGuard AI - AI Module: ScenarioEngine (Phase 1)
// Self-contained emergency scenario configuration & demographic engine
// ==============================================================================

export const HAZARD_TYPES = {
  FIRE: { id: 'FIRE', label: 'Thermal & Flame Hazard', color: '#ef4444' },
  SMOKE: { id: 'SMOKE', label: 'Toxic Smoke Ingress', color: '#64748b' },
  ELECTRICAL: { id: 'ELECTRICAL', label: 'Electrical / Equipment Failure', color: '#f59e0b' },
  STRUCTURAL: { id: 'STRUCTURAL', label: 'Structural Wall / Ceiling Collapse', color: '#dc2626' }
};

export const SEVERITY_LEVELS = {
  LOW: { id: 'LOW', label: 'Level 1 - Minor / Contained', temp: 55, radius: 4.0, penalty: 200, color: '#f59e0b' },
  MEDIUM: { id: 'MEDIUM', label: 'Level 2 - Moderate Flare', temp: 72, radius: 5.5, penalty: 450, color: '#f97316' },
  HIGH: { id: 'HIGH', label: 'Level 3 - Heavy Flashover', temp: 86, radius: 7.0, penalty: 800, color: '#ef4444' },
  CATASTROPHIC: { id: 'CATASTROPHIC', label: 'Level 4 - Catastrophic Breach', temp: 98, radius: 9.5, penalty: 1500, color: '#991b1b' }
};

export const MOBILITY_PROFILES = {
  STANDARD: {
    id: 'STANDARD',
    label: 'Standard Staff',
    description: 'Unimpeded walking cadence (1.20 - 1.45 m/s)',
    speedMin: 3.2,
    speedMax: 3.8,
    reactionMin: 2.0,
    reactionMax: 6.0,
    color: '#0284c7'
  },
  SLOW: {
    id: 'SLOW',
    label: 'Slow / Senior',
    description: 'Reduced walking cadence (0.75 - 0.95 m/s)',
    speedMin: 1.9,
    speedMax: 2.4,
    reactionMin: 5.0,
    reactionMax: 12.0,
    color: '#eab308'
  },
  ASSISTED: {
    id: 'ASSISTED',
    label: 'Assisted / Wheelchair',
    description: 'Requires assistance or wide passage (0.45 - 0.65 m/s)',
    speedMin: 1.2,
    speedMax: 1.6,
    reactionMin: 10.0,
    reactionMax: 25.0,
    color: '#a855f7'
  }
};

export const PRESET_SCENARIOS = {
  STANDARD_OFFICE_FIRE: {
    id: 'STANDARD_OFFICE_FIRE',
    name: 'Standard Office Fire (Level 4)',
    category: 'Commercial Baseline',
    description: 'Electrical fire in Level 4 AI Computing Lab 03. All emergency cores and exits are operational.',
    hazard: {
      type: 'FIRE',
      floor: 4,
      roomId: 'f4_r3',
      severity: 'HIGH',
      tempCelsius: 86,
      smokeSpreadRadius: 7.0,
      diffusionRate: 1.0
    },
    structuralFailures: {
      blockedExits: [],
      elevatorLocked: true,
      hvacCompromised: false,
      damagedCorridors: []
    },
    demographics: {
      standardRatio: 0.80,
      slowRatio: 0.15,
      assistedRatio: 0.05,
      reactionDelayMin: 2.0,
      reactionDelayMax: 6.5
    },
    populationMultiplier: 1.0
  },
  CORE_A_BLOCKED: {
    id: 'CORE_A_BLOCKED',
    name: 'Stairwell A Blocked (Smoke Ingress)',
    category: 'Structural Compromise',
    description: 'West Wing fire breaches Stairwell A core with toxic smoke. Evacuees must divert entirely to Core B.',
    hazard: {
      type: 'FIRE',
      floor: 5,
      roomId: 'f5_r1',
      severity: 'CATASTROPHIC',
      tempCelsius: 96,
      smokeSpreadRadius: 9.0,
      diffusionRate: 1.4
    },
    structuralFailures: {
      blockedExits: ['exit_west'],
      elevatorLocked: true,
      hvacCompromised: true,
      damagedCorridors: [{ floor: 5, wing: 'west' }]
    },
    demographics: {
      standardRatio: 0.75,
      slowRatio: 0.20,
      assistedRatio: 0.05,
      reactionDelayMin: 3.0,
      reactionDelayMax: 10.0
    },
    populationMultiplier: 1.0
  },
  HIGH_DENSITY_SUMMIT: {
    id: 'HIGH_DENSITY_SUMMIT',
    name: 'Executive Summit (High Density L10 & L1)',
    category: 'Overcrowded Event',
    description: 'Annual global summit in Penthouse Boardroom (L10) and Public Lobby (L1). Elevated crush hazard.',
    hazard: {
      type: 'SMOKE',
      floor: 8,
      roomId: 'f8_r2',
      severity: 'MEDIUM',
      tempCelsius: 74,
      smokeSpreadRadius: 6.0,
      diffusionRate: 0.9
    },
    structuralFailures: {
      blockedExits: [],
      elevatorLocked: true,
      hvacCompromised: false,
      damagedCorridors: []
    },
    demographics: {
      standardRatio: 0.85,
      slowRatio: 0.10,
      assistedRatio: 0.05,
      reactionDelayMin: 1.5,
      reactionDelayMax: 5.5
    },
    populationMultiplier: 1.7
  },
  NIGHT_SHIFT_SKELETON: {
    id: 'NIGHT_SHIFT_SKELETON',
    name: 'Night Shift (Low Density, Delayed Reaction)',
    category: 'Off-Peak Hours',
    description: 'Overnight facilities and server maintenance. Sparse population, longer investigative delay.',
    hazard: {
      type: 'ELECTRICAL',
      floor: 3,
      roomId: 'f3_r5',
      severity: 'MEDIUM',
      tempCelsius: 68,
      smokeSpreadRadius: 5.0,
      diffusionRate: 0.6
    },
    structuralFailures: {
      blockedExits: [],
      elevatorLocked: true,
      hvacCompromised: false,
      damagedCorridors: []
    },
    demographics: {
      standardRatio: 0.90,
      slowRatio: 0.10,
      assistedRatio: 0.00,
      reactionDelayMin: 8.0,
      reactionDelayMax: 22.0
    },
    populationMultiplier: 0.35
  }
};

export class ScenarioEngine {
  constructor(initialScenario = PRESET_SCENARIOS.STANDARD_OFFICE_FIRE) {
    this.currentScenario = JSON.parse(JSON.stringify(initialScenario));
  }

  getScenario() {
    return this.currentScenario;
  }

  setScenario(newScenario) {
    this.currentScenario = JSON.parse(JSON.stringify(newScenario));
    return this.currentScenario;
  }

  loadPreset(presetId) {
    if (PRESET_SCENARIOS[presetId]) {
      this.currentScenario = JSON.parse(JSON.stringify(PRESET_SCENARIOS[presetId]));
      return this.currentScenario;
    }
    return null;
  }

  updateConfig(updates) {
    this.currentScenario = {
      ...this.currentScenario,
      ...updates,
      hazard: { ...this.currentScenario.hazard, ...(updates.hazard || {}) },
      structuralFailures: { ...this.currentScenario.structuralFailures, ...(updates.structuralFailures || {}) },
      demographics: { ...this.currentScenario.demographics, ...(updates.demographics || {}) }
    };
    return this.currentScenario;
  }

  // Apply scenario to room definitions
  applyToRooms(baseRooms) {
    const scenario = this.currentScenario;
    const mult = scenario.populationMultiplier || 1.0;
    const hazardRoomId = scenario.hazard?.roomId;
    const hazardSeverity = scenario.hazard?.severity || 'HIGH';
    const hazardTemp = SEVERITY_LEVELS[hazardSeverity]?.temp || 86;

    return baseRooms.map((room) => {
      const isHazardRoom = room.id === hazardRoomId;

      let roomCount = room.peopleCount || 2;
      if (mult !== 1.0) {
        roomCount = Math.max(1, Math.round(roomCount * mult));
      }

      if (scenario.id === 'HIGH_DENSITY_SUMMIT') {
        if (room.floor === 10 || room.floor === 1) {
          roomCount = Math.round(roomCount * 1.8);
        }
      }

      return {
        ...room,
        hasFire: isHazardRoom,
        fireIntensity: isHazardRoom ? (hazardSeverity === 'CATASTROPHIC' ? 1.5 : 1.0) : 0,
        tempCelsius: isHazardRoom ? hazardTemp : 22,
        smokeLevel: isHazardRoom ? 90 : 0,
        peopleCount: roomCount
      };
    });
  }

  // Apply scenario to exit definitions
  applyToExits(baseExits) {
    const blocked = this.currentScenario.structuralFailures?.blockedExits || [];

    return baseExits.map((exit) => {
      const isBlocked = blocked.includes(exit.id);
      return {
        ...exit,
        isBlocked,
        status: isBlocked ? 'BLOCKED / SMOKE COMPROMISED' : 'Operational',
        color: isBlocked ? '#ef4444' : (exit.color || '#00ff88'),
        load: isBlocked ? 0 : (exit.load || 0)
      };
    });
  }

  // Generate demographic assignment for an individual agent
  generateAgentProfile(index, totalAgents) {
    const d = this.currentScenario.demographics;
    const standardThreshold = d.standardRatio;
    const slowThreshold = standardThreshold + d.slowRatio;

    const rand = ((index * 9301 + 49297) % 233280) / 233280;

    let profileType = MOBILITY_PROFILES.STANDARD;
    if (rand > slowThreshold) {
      profileType = MOBILITY_PROFILES.ASSISTED;
    } else if (rand > standardThreshold) {
      profileType = MOBILITY_PROFILES.SLOW;
    }

    const speedSpread = profileType.speedMax - profileType.speedMin;
    const speedSeed = ((index * 37) % 100) / 100;
    const assignedSpeed = profileType.speedMin + speedSpread * speedSeed;

    const delaySpread = d.reactionDelayMax - d.reactionDelayMin;
    const delaySeed = Math.pow(((index * 71) % 100) / 100, 1.4);
    const reactionDelay = Number((d.reactionDelayMin + delaySpread * delaySeed).toFixed(1));

    return {
      mobilityType: profileType.id,
      mobilityLabel: profileType.label,
      mobilityColor: profileType.color,
      speed: Number(assignedSpeed.toFixed(2)),
      reactionDelay,
      remainingHesitation: reactionDelay
    };
  }

  exportToJSON() {
    return JSON.stringify(this.currentScenario, null, 2);
  }

  importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.hazard && parsed.structuralFailures && parsed.demographics) {
        this.currentScenario = parsed;
        return { success: true, scenario: parsed };
      }
      return { success: false, error: 'Invalid scenario schema: missing required fields' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

