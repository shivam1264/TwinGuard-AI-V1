import { CampusEnvironment } from './CampusEnvironment.js';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FLOOR_THEMES, ROOM_TEMPLATES, getRoomFurnishingType } from '../simulation/Doorways.js';
import { TextureHelper } from './TextureHelper.js';

export class Building3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.floorHeight = 3.8; // Realistic commercial floor-to-floor height
    this.totalFloors = 10;
    this.floorMode = 'ALL';
    this.facadeMode = 'FULL'; // 'FULL' (default Appearance), 'CUTAWAY', 'TRANSPARENT'
    this.viewMode = 'FULL_EXTERIOR';

    // === Layer Subgroups for Professional Digital Twin Layer Filtering ===
    this.layers = {
      structure: new THREE.Group(),
      architecture: new THREE.Group(),
      facade: new THREE.Group(),
      furniture: new THREE.Group(),
      mep: new THREE.Group(),
      environment: new THREE.Group()
    };

    this.group.add(this.layers.environment);
    this.group.add(this.layers.structure);
    this.group.add(this.layers.architecture);
    this.group.add(this.layers.facade);
    this.group.add(this.layers.furniture);
    this.group.add(this.layers.mep);

    // Floor groups preserved for backward compatibility
    this.floorGroups = {};
    for (let f = 1; f <= this.totalFloors; f++) {
      this.floorGroups[f] = new THREE.Group();
      this.layers.architecture.add(this.floorGroups[f]);
    }

    this.stairsGroup = new THREE.Group();
    this.elevatorGroup = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.facadeCutawayGroup = new THREE.Group();

    this.layers.architecture.add(this.stairsGroup);
    this.layers.architecture.add(this.elevatorGroup);
    this.layers.mep.add(this.roofGroup);
    this.layers.facade.add(this.facadeCutawayGroup);

    this.cutawayProgress = 0.0; // 0.0 = Full Exterior (default Appearance), 1.0 = Cutaway (De-appearance)
    this.targetCutawayProgress = 0.0;

    this.hvacFans = []; // For subtle mechanical rotation in update()
    this.stairCoreMeshes = []; // For dual-mode exterior vs inspection toggling

    // === High-Performance Shared Architectural Materials (PBR) ===

    // 1. Crisp Architectural Concrete
    this.concreteTex = TextureHelper.createConcreteTexture();
    this.concreteMat = new THREE.MeshStandardMaterial({
      map: this.concreteTex,
      roughness: 0.65,
      metalness: 0.1
    });

    // 2. Anodized Aluminum Spandrel Panels with Horizontal Shadow Reveals
    this.spandrelTex = TextureHelper.createSpandrelPanelTexture();
    this.spandrelMat = new THREE.MeshStandardMaterial({
      map: this.spandrelTex,
      roughness: 0.35,
      metalness: 0.65
    });

    // 3. Crisp Matte White Architectural Dividing Walls
    this.whiteWallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05
    });

    // 4. Warm Architectural Honey Oak Fluted Slat Accent Back Walls
    this.flutedWoodTex = TextureHelper.createFlutedWoodTexture();
    this.woodAccentWallMat = new THREE.MeshStandardMaterial({
      map: this.flutedWoodTex,
      roughness: 0.55,
      metalness: 0.05
    });

    // 5. Dark Charcoal / Black Structural Columns & Framing
    this.columnMat = new THREE.MeshStandardMaterial({
      color: 0x1f2733,
      roughness: 0.45,
      metalness: 0.35
    });

    // 6. Vertical Architectural Sunshade Fins / Louvers
    this.finMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.85
    });

    // Floor & Architectural Surface Textures
    this.woodTex = TextureHelper.createWoodTexture();
    this.carpetTex = TextureHelper.createCarpetTexture();
    this.tileTex = TextureHelper.createTileTexture();
    this.ceilingTex = TextureHelper.createCeilingTileTexture();
    this.plazaTex = TextureHelper.createPlazaPavingTexture();
    this.asphaltTex = TextureHelper.createAsphaltRoadTexture();
    this.grassTex = TextureHelper.createGrassLawnTexture();
    this.crosswalkTex = TextureHelper.createCrosswalkTexture();
    this.waterTex = TextureHelper.createWaterCausticsTexture();
    this.treeBarkTex = TextureHelper.createTreeBarkTexture();
    this.treeFoliageTex = TextureHelper.createTreeFoliageTexture();
    this.treeGrateTex = TextureHelper.createTreeGrateTexture();
    this.tactileTex = TextureHelper.createTactilePaverTexture();
    this.terrazzoTex = TextureHelper.createTerrazzoTexture ? TextureHelper.createTerrazzoTexture() : null;
    this.roofMembraneTex = TextureHelper.createRoofMembraneTexture ? TextureHelper.createRoofMembraneTexture() : null;
    this.louverTex = TextureHelper.createMetalLouverTexture ? TextureHelper.createMetalLouverTexture() : null;
    this.stairTreadTex = TextureHelper.createConcreteStairTexture ? TextureHelper.createConcreteStairTexture() : this.concreteTex;
    this.antiSlipNosingTex = TextureHelper.createAntiSlipNosingTexture ? TextureHelper.createAntiSlipNosingTexture() : null;
    this.precastFacadeTex = TextureHelper.createPrecastFacadeTexture ? TextureHelper.createPrecastFacadeTexture() : this.concreteTex;
    this.exitSignLeftTex = TextureHelper.createExitSignLeftTexture();
    this.exitSignRightTex = TextureHelper.createExitSignRightTexture();

    this.woodFloorMat = new THREE.MeshStandardMaterial({
      map: this.woodTex,
      roughness: 0.35,
      metalness: 0.15
    });

    this.carpetFloorMat = new THREE.MeshStandardMaterial({
      map: this.carpetTex,
      roughness: 0.75,
      metalness: 0.1
    });

    this.tileFloorMat = new THREE.MeshStandardMaterial({
      map: this.tileTex,
      roughness: 0.25,
      metalness: 0.25
    });

    this.terrazzoMat = new THREE.MeshStandardMaterial({
      map: this.terrazzoTex,
      roughness: 0.25,
      metalness: 0.2
    });

    this.ceilingMat = new THREE.MeshStandardMaterial({
      map: this.ceilingTex,
      roughness: 0.85,
      metalness: 0.05
    });

    // Exterior Architectural Granite Plaza Paver Material (Realistic Multi-tone Stone)
    this.plazaMat = new THREE.MeshStandardMaterial({
      map: this.plazaTex,
      roughness: 0.72,
      metalness: 0.12
    });

    // Photorealistic Bitumen Asphalt Road Surface
    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: this.asphaltTex,
      roughness: 0.90,
      metalness: 0.05
    });

    // Manicured Campus Grass Lawn Surface
    this.grassMat = new THREE.MeshStandardMaterial({
      map: this.grassTex,
      roughness: 0.92,
      metalness: 0.02
    });

    // Pedestrian Zebra Crosswalk Material
    this.crosswalkMat = new THREE.MeshStandardMaterial({
      map: this.crosswalkTex,
      roughness: 0.65,
      metalness: 0.08
    });

    // Tactile Warning Blister Paver Material
    this.tactileMat = new THREE.MeshStandardMaterial({
      map: this.tactileTex,
      roughness: 0.65,
      metalness: 0.1
    });

    // Architectural Reflecting Pool Water & Basalt Coping
    this.waterMat = new THREE.MeshStandardMaterial({
      map: this.waterTex,
      color: 0x0284c7,
      transparent: true,
      opacity: 0.78,
      roughness: 0.04,
      metalness: 0.2
    });
    this.poolCopingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.3
    });

    // Architectural 3D Tree Trunk, Foliage & Urban Plaza Grate Materials
    this.treeTrunkMat = new THREE.MeshStandardMaterial({
      map: this.treeBarkTex,
      roughness: 0.92,
      metalness: 0.05
    });
    this.treeFoliageMat = new THREE.MeshStandardMaterial({
      map: this.treeFoliageTex,
      color: 0x2e6b26,
      roughness: 0.78,
      metalness: 0.02
    });
    this.cypressFoliageMat = new THREE.MeshStandardMaterial({
      map: this.treeFoliageTex,
      color: 0x163814,
      roughness: 0.85,
      metalness: 0.02
    });
    this.treeGrateMat = new THREE.MeshStandardMaterial({
      map: this.treeGrateTex,
      roughness: 0.45,
      metalness: 0.85
    });
    this.treeMulchMat = new THREE.MeshStandardMaterial({
      color: 0x20140c,
      roughness: 0.95,
      metalness: 0.02
    });

    // Modern Executive & EV Vehicle Materials
    this.carBodyDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.12,
      metalness: 0.85
    });
    this.carBodyWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.75
    });
    this.carBodyBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.14,
      metalness: 0.82
    });
    this.carGlassMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      transparent: true,
      opacity: 0.75,
      roughness: 0.05,
      metalness: 0.9
    });
    this.carWheelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.3
    });

    // Modern Park Bench Materials
    this.benchWoodMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.45,
      metalness: 0.05
    });
    this.benchFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8
    });

    // High-Visibility Safety Red Fire Hydrant Material
    this.fireHydrantMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.4
    });

    // Architectural Chamfered Concrete Curb Stone
    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      metalness: 0.15
    });

    // Modern Planter Box Material
    this.planterMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.2
    });

    // Lush Green Hedge Foliage Material
    this.hedgeFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x245820,
      roughness: 0.85,
      metalness: 0.05
    });

    // Modern Architectural Street Lamp Materials
    this.streetLampPoleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.85
    });
    this.streetLampLuminaireMat = new THREE.MeshBasicMaterial({
      color: 0xfffcf0
    });

    // Pedestrian Pathway Stainless Steel & Glow Bollards
    this.bollardSteelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.85
    });
    this.bollardGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    // Painted Road Striping (Crisp White & Safety Yellow)
    this.roadStripeWhiteMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc
    });
    this.roadStripeYellowMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b
    });

    this.roofMembraneMat = new THREE.MeshStandardMaterial({
      map: this.roofMembraneTex,
      roughness: 0.85,
      metalness: 0.1
    });

    this.louverMat = new THREE.MeshStandardMaterial({
      map: this.louverTex,
      roughness: 0.45,
      metalness: 0.7
    });

    this.hvacUnitMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.8
    });

    this.foliageMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.65,
      metalness: 0.05
    });
    this.trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3f2719,
      roughness: 0.85,
      metalness: 0.05
    });
    this.bollardMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.9
    });

    // 7. Glowing Recessed Ceiling Light Fixtures
    this.ceilingLightMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      emissive: 0xfff5ea,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });

    this.linearLightMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf0,
      emissive: 0xfffbf0,
      emissiveIntensity: 1.6,
      roughness: 0.1
    });

    this.downlightMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      emissive: 0xfff5ea,
      emissiveIntensity: 1.8,
      roughness: 0.2
    });

    this.tableWoodMat = new THREE.MeshStandardMaterial({
      color: 0xb46b38,
      roughness: 0.4,
      metalness: 0.1
    });

    this.tableLegMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.85
    });

    this.railingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3
    });

    // 10. Ultra-Fast Architectural Reflective Glass (Full PMREM Sky & Cloud Reflection)
    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.30,
      roughness: 0.04,
      metalness: 0.55
    });

    this.glassExteriorMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.72,
      roughness: 0.08,
      metalness: 0.75
    });

    this.mullionMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.3
    });

    // Upgraded Materials for Realistic Stairs & Building Envelope
    this.stairTreadMat = new THREE.MeshStandardMaterial({
      map: this.stairTreadTex,
      roughness: 0.65,
      metalness: 0.15
    });

    this.antiSlipNosingMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.75,
      roughness: 0.25
    });

    this.precastFacadeMat = new THREE.MeshStandardMaterial({
      map: this.precastFacadeTex,
      roughness: 0.68,
      metalness: 0.12
    });

    this.fireDoorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.5
    });

    this.stairWallMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      roughness: 0.8,
      metalness: 0.05
    });

    this.stairLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffedd5,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });

    this.walkwayGratingMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.8
    });

    this.exitSignLeftMat = new THREE.MeshStandardMaterial({
      map: this.exitSignLeftTex,
      emissive: 0x059669,
      emissiveIntensity: 1.6,
      roughness: 0.2
    });

    this.exitSignRightMat = new THREE.MeshStandardMaterial({
      map: this.exitSignRightTex,
      emissive: 0x059669,
      emissiveIntensity: 1.6,
      roughness: 0.2
    });

    this.exitPortalSignTexWest = TextureHelper.createExitPortalSignTexture('WEST EMERGENCY EXIT A');
    this.exitPortalSignTexEast = TextureHelper.createExitPortalSignTexture('EAST EMERGENCY EXIT B');
    this.exitPortalSignTexSouth = TextureHelper.createExitPortalSignTexture('MAIN PLAZA EVACUATION GATE');
    this.hazardStripesTex = TextureHelper.createHazardStripesTexture();
    this.fireDoorSignTex = TextureHelper.createFireDoorSignTexture();
    this.exitRunwayTex = TextureHelper.createExitRunwayTexture();

    this.exitPortalSignMatWest = new THREE.MeshStandardMaterial({
      map: this.exitPortalSignTexWest,
      emissive: 0x059669,
      emissiveIntensity: 1.9,
      roughness: 0.15
    });
    this.exitPortalSignMatEast = new THREE.MeshStandardMaterial({
      map: this.exitPortalSignTexEast,
      emissive: 0x059669,
      emissiveIntensity: 1.9,
      roughness: 0.15
    });
    this.exitPortalSignMatSouth = new THREE.MeshStandardMaterial({
      map: this.exitPortalSignTexSouth,
      emissive: 0x059669,
      emissiveIntensity: 1.9,
      roughness: 0.15
    });

    this.fireDoorRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.35,
      metalness: 0.2
    });

    this.panicBarSilverMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.9
    });
    this.panicBarGreenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    this.hazardPlateMat = new THREE.MeshStandardMaterial({
      map: this.hazardStripesTex,
      roughness: 0.4,
      metalness: 0.3
    });

    this.fireDoorDecalMat = new THREE.MeshStandardMaterial({
      map: this.fireDoorSignTex,
      roughness: 0.3,
      metalness: 0.1
    });

    this.exitRunwayMat = new THREE.MeshStandardMaterial({
      map: this.exitRunwayTex,
      roughness: 0.6,
      metalness: 0.1
    });

    this.plaqueMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.85
    });

    this.elevatorDoorMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.25
    });

    this.deskTopWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.40,
      metalness: 0.05
    });

    this.workstationDividerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.1
    });
    this.acousticDividerMat = this.workstationDividerMat;

    this.screenDisplayCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d4e6,
      emissiveIntensity: 1.1,
      roughness: 0.15
    });

    this.screenDisplayOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.95,
      roughness: 0.2
    });

    this.chairLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.15
    });
    this.chairMeshMat = this.chairLeatherMat;

    this.chairLeatherCognacMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.40,
      metalness: 0.1
    });

    this.screenBezelMat = this.columnMat;
    this.coffeeTableEspressoMat = this.columnMat;

    this.sofaFabricSlateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.75,
      metalness: 0.05
    });

    this.sofaFabricSandMat = new THREE.MeshStandardMaterial({
      color: 0xd6c7b2,
      roughness: 0.80,
      metalness: 0.05
    });

    this.areaRugMat = this.carpetFloorMat;
    this.areaRugCreamMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05
    });

    this.plantPotMat = this.potMat;
    this.plantLeafMat = this.foliageMat;
    this.whiteboardMat = this.whiteWallMat;

    this.confTableMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.4
    });

    this.cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.6
    });

    this.loungeSofaMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.6,
      metalness: 0.05
    });

    this.potMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.1
    });

    // === Pre-Merged Reusable Geometries for High-Speed Instancing ===
    // 1. Modern Architectural Open-Frame Workstation Desk
    const deskTop = new THREE.BoxGeometry(1.45, 0.026, 0.75);
    deskTop.translate(0, 0.72, 0);

    const legGeo = new THREE.BoxGeometry(0.032, 0.707, 0.032);
    const legFL = legGeo.clone().translate(-0.68, 0.353, 0.33);
    const legFR = legGeo.clone().translate(0.68, 0.353, 0.33);
    const legBL = legGeo.clone().translate(-0.68, 0.353, -0.33);
    const legBR = legGeo.clone().translate(0.68, 0.353, -0.33);

    const apronGeoX = new THREE.BoxGeometry(1.36, 0.03, 0.02);
    const apronF = apronGeoX.clone().translate(0, 0.695, 0.33);
    const apronB = apronGeoX.clone().translate(0, 0.695, -0.33);

    this.deskGeo = BufferGeometryUtils.mergeGeometries([
      deskTop, legFL, legFR, legBL, legBR, apronF, apronB
    ]);
    this.workstationDesksGeo = this.deskGeo;

    // 2. High-End Modern Ergonomic Task Chair
    const chairParts = [];
    for (let sp = 0; sp < 5; sp++) {
      const angle = (sp * Math.PI * 2) / 5;
      const spoke = new THREE.BoxGeometry(0.028, 0.025, 0.24);
      spoke.translate(0, 0.035, 0.12);
      spoke.rotateY(angle);
      chairParts.push(spoke);

      const caster = new THREE.BoxGeometry(0.025, 0.035, 0.035);
      caster.translate(Math.sin(angle) * 0.24, 0.02, Math.cos(angle) * 0.24);
      chairParts.push(caster);
    }

    const cylinder = new THREE.CylinderGeometry(0.024, 0.028, 0.34, 10);
    cylinder.translate(0, 0.20, 0);
    chairParts.push(cylinder);

    const tiltMech = new THREE.BoxGeometry(0.18, 0.05, 0.16);
    tiltMech.translate(0, 0.38, 0);
    chairParts.push(tiltMech);

    const seatCushion = new THREE.BoxGeometry(0.46, 0.05, 0.44);
    seatCushion.translate(0, 0.44, 0);
    chairParts.push(seatCushion);

    const backrest = new THREE.BoxGeometry(0.42, 0.46, 0.03);
    backrest.translate(0, 0.70, -0.20);
    chairParts.push(backrest);

    const spineBar = new THREE.BoxGeometry(0.04, 0.34, 0.03);
    spineBar.translate(0, 0.54, -0.21);
    chairParts.push(spineBar);

    const armL_Post = new THREE.BoxGeometry(0.025, 0.18, 0.03);
    armL_Post.translate(-0.24, 0.52, -0.02);
    chairParts.push(armL_Post);
    const armL_Pad = new THREE.BoxGeometry(0.06, 0.02, 0.20);
    armL_Pad.translate(-0.24, 0.61, -0.02);
    chairParts.push(armL_Pad);

    const armR_Post = new THREE.BoxGeometry(0.025, 0.18, 0.03);
    armR_Post.translate(0.24, 0.52, -0.02);
    chairParts.push(armR_Post);
    const armR_Pad = new THREE.BoxGeometry(0.06, 0.02, 0.20);
    armR_Pad.translate(0.24, 0.61, -0.02);
    chairParts.push(armR_Pad);

    this.chairGeo = BufferGeometryUtils.mergeGeometries(chairParts);
    this.taskChairGeo = this.chairGeo;

    // 3. Widescreen 27-inch Monitor with Stand, Keyboard & Mouse
    const screenBezel = new THREE.BoxGeometry(0.62, 0.36, 0.016);
    screenBezel.translate(0, 0.26, 0);

    const standArm = new THREE.CylinderGeometry(0.014, 0.016, 0.18, 8);
    standArm.translate(0, 0.12, -0.04);

    const standBase = new THREE.BoxGeometry(0.18, 0.008, 0.14);
    standBase.translate(0, 0.004, -0.02);

    const kbd = new THREE.BoxGeometry(0.42, 0.006, 0.12);
    kbd.translate(0, 0.004, 0.16);

    const mouse = new THREE.BoxGeometry(0.06, 0.010, 0.10);
    mouse.translate(0.26, 0.005, 0.16);

    this.monitorFrameGeo = BufferGeometryUtils.mergeGeometries([
      screenBezel, standArm, standBase, kbd, mouse
    ]);
    this.screenGeo = this.monitorFrameGeo;

    const disp = new THREE.BoxGeometry(0.60, 0.34, 0.006);
    disp.translate(0, 0.26, 0.007);
    this.monitorDisplayGeo = disp;

    // 4. Large Executive Conference Table
    const confParts = [];
    const cTop = new THREE.BoxGeometry(3.8, 0.045, 1.35);
    cTop.translate(0, 0.73, 0);
    confParts.push(cTop);

    const pylonL = new THREE.BoxGeometry(0.32, 0.70, 0.65);
    pylonL.translate(-1.15, 0.35, 0);
    confParts.push(pylonL);

    const pylonR = new THREE.BoxGeometry(0.32, 0.70, 0.65);
    pylonR.translate(1.15, 0.35, 0);
    confParts.push(pylonR);

    const footL = new THREE.BoxGeometry(0.36, 0.03, 0.85);
    footL.translate(-1.15, 0.015, 0);
    confParts.push(footL);

    const footR = new THREE.BoxGeometry(0.36, 0.03, 0.85);
    footR.translate(1.15, 0.015, 0);
    confParts.push(footR);

    this.confTableGeo = BufferGeometryUtils.mergeGeometries(confParts);

    // 5. Minimalist Architectural Coffee Table
    const ctTop = new THREE.BoxGeometry(1.30, 0.024, 0.65);
    ctTop.translate(0, 0.36, 0);
    const ctLeg = new THREE.BoxGeometry(0.022, 0.35, 0.022);
    const ctLeg1 = ctLeg.clone().translate(-0.58, 0.175, 0.26);
    const ctLeg2 = ctLeg.clone().translate(0.58, 0.175, 0.26);
    const ctLeg3 = ctLeg.clone().translate(-0.58, 0.175, -0.26);
    const ctLeg4 = ctLeg.clone().translate(0.58, 0.175, -0.26);
    this.coffeeTableGeo = BufferGeometryUtils.mergeGeometries([ctTop, ctLeg1, ctLeg2, ctLeg3, ctLeg4]);

    // 6. Contemporary Low-Profile 3-Seat Sofa
    const sfParts = [];
    const sfSeat = new THREE.BoxGeometry(2.10, 0.22, 0.80);
    sfSeat.translate(0, 0.22, 0);
    sfParts.push(sfSeat);

    const sfBack = new THREE.BoxGeometry(2.10, 0.44, 0.20);
    sfBack.translate(0, 0.54, -0.30);
    sfParts.push(sfBack);

    const sfArmL = new THREE.BoxGeometry(0.16, 0.32, 0.82);
    sfArmL.translate(-1.05, 0.38, 0);
    sfParts.push(sfArmL);

    const sfArmR = new THREE.BoxGeometry(0.16, 0.32, 0.82);
    sfArmR.translate(1.05, 0.38, 0);
    sfParts.push(sfArmR);

    this.sectionalSofaGeo = BufferGeometryUtils.mergeGeometries(sfParts);
    this.sofaGeo = this.sectionalSofaGeo;

    this.dividerGeo = new THREE.BoxGeometry(1.45, 0.38, 0.03);
    this.acousticDividerGeo = this.dividerGeo;
    this.areaRugGeo = new THREE.BoxGeometry(3.8, 0.015, 2.8);
    this.wallTvFrameGeo = new THREE.BoxGeometry(2.4, 1.4, 0.08);
    this.wallTvScreenGeo = new THREE.BoxGeometry(2.28, 1.28, 0.09);

    const potGeos = [];
    const pBody = new THREE.CylinderGeometry(0.28, 0.20, 0.58, 20);
    pBody.translate(0, 0.38, 0);
    potGeos.push(pBody);
    const pRim = new THREE.CylinderGeometry(0.30, 0.28, 0.05, 20);
    pRim.translate(0, 0.65, 0);
    potGeos.push(pRim);
    const pSoil = new THREE.CylinderGeometry(0.27, 0.27, 0.04, 16);
    pSoil.translate(0, 0.63, 0);
    potGeos.push(pSoil);
    const pStandRing = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12);
    pStandRing.translate(0, 0.10, 0);
    potGeos.push(pStandRing);
    for (let l = 0; l < 3; l++) {
      const legAng = (l * Math.PI * 2) / 3;
      const legX = Math.cos(legAng) * 0.18;
      const legZ = Math.sin(legAng) * 0.18;
      const leg = new THREE.CylinderGeometry(0.022, 0.03, 0.20, 8);
      leg.translate(legX, 0.10, legZ);
      potGeos.push(leg);
    }
    this.indoorPlantPotGeo = BufferGeometryUtils.mergeGeometries(potGeos);

    const foliageGeos = [];
    for (let st = 0; st < 6; st++) {
      const stAng = (st * Math.PI * 2) / 6 + 0.2;
      const stStem = new THREE.CylinderGeometry(0.012, 0.022, 0.52, 6);
      stStem.rotateZ(0.25);
      stStem.rotateY(stAng);
      stStem.translate(Math.cos(stAng) * 0.08, 0.84, Math.sin(stAng) * 0.08);
      foliageGeos.push(stStem);
    }
    const leafAngles = [0.1, 0.85, 1.6, 2.35, 3.1, 3.85, 4.6, 5.35];
    const leafTilts = [0.65, 0.55, 0.72, 0.58, 0.68, 0.60, 0.75, 0.62];
    const leafLengths = [0.46, 0.52, 0.44, 0.50, 0.48, 0.54, 0.45, 0.51];
    const leafWidths = [0.20, 0.24, 0.19, 0.23, 0.21, 0.25, 0.19, 0.22];
    for (let i = 0; i < leafAngles.length; i++) {
      const ang = leafAngles[i];
      const tilt = leafTilts[i];
      const len = leafLengths[i];
      const wid = leafWidths[i];
      const leafG = new THREE.BoxGeometry(wid, 0.012, len);
      leafG.rotateX(tilt);
      leafG.rotateY(ang);
      const dist = 0.22;
      leafG.translate(Math.cos(ang) * dist, 0.86, Math.sin(ang) * dist);
      foliageGeos.push(leafG);
    }
    this.indoorPlantLeafGeo = BufferGeometryUtils.mergeGeometries(foliageGeos);

    // Initializing Rooms Data & Systems
    this.roomsData = this.generateRoomsData();

    this.createEnvironment();
    this.buildAllFloors();
    this.buildStairwellCores();
    this.buildElevatorBank();
    this.buildRooftopHelipad();
    this.buildHeroEntrance();
    this.buildGroundExits();

    this.updateFacadeCutaway();
  }

  generateRoomsData() {
    const rooms = [];
    for (let floor = 1; floor <= this.totalFloors; floor++) {
      const theme = FLOOR_THEMES[floor];
      const floorBaseY = (floor - 1) * this.floorHeight;

      ROOM_TEMPLATES.forEach((tmpl, idx) => {
        const roomId = 'f' + floor + '_' + tmpl.idSuffix;
        const roomNumber = '' + floor + (idx < 9 ? '0' + (idx + 1) : idx + 1);
        const roomName = 'Rm ' + roomNumber + ' — ' + theme.prefix + ' ' + tmpl.nameSuffix;

        rooms.push({
          id: roomId,
          floor,
          roomNumber,
          name: roomName,
          camId: 'CAM-' + floor + (idx < 9 ? '0' + (idx + 1) : idx + 1),
          color: floor >= 9 ? 0x9d4edd : (floor >= 5 ? 0x00f0ff : 0x00ff88),
          center: { x: tmpl.centerX, y: floorBaseY, z: tmpl.centerZ },
          bounds: { minX: tmpl.minX, maxX: tmpl.maxX, minZ: tmpl.minZ, maxZ: tmpl.maxZ },
          camPos: { x: tmpl.centerX - 6, y: floorBaseY + 4.5, z: tmpl.centerZ + 6 },
          furnishingType: getRoomFurnishingType(floor, idx)
        });
      });
    }
    return rooms;
  }

  createEnvironment() {
    // Upgraded photorealistic architectural campus environment & 3D city skyline
    this.campusEnv = new CampusEnvironment(this.scene, this.layers.environment);
  }

  buildAllFloors() {
    for (let f = 1; f <= this.totalFloors; f++) {
      this.buildFloor(f);
    }
  }

  buildFloor(floorNum) {
    const group = this.floorGroups[floorNum];
    const baseY = (floorNum - 1) * this.floorHeight;
    const slabW = 60;
    const slabD = 48;
    const wallH = 3.46;
    const wallCenterY = baseY + 0.175 + wallH / 2;

    // 0. Architectural Corner Piers for this Floor Layer
    const cornerSize = 1.2;
    const cornerH = (floorNum === this.totalFloors) ? this.floorHeight + 0.6 : this.floorHeight;
    const cornerCenterY = baseY + cornerH / 2;
    const cornerCorners = [
      { x: -29.5, z: 23.5 },
      { x: 29.5, z: 23.5 },
      { x: -29.5, z: -23.5 },
      { x: 29.5, z: -23.5 }
    ];
    const cGeos = [];
    cornerCorners.forEach(c => {
      const cg = new THREE.BoxGeometry(cornerSize, cornerH, cornerSize);
      cg.translate(c.x, cornerCenterY, c.z);
      cGeos.push(cg);
    });
    if (cGeos.length > 0) {
      const cMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(cGeos), this.precastFacadeMat);
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      cMesh.userData = { floor: floorNum, architecturalLayer: 'STRUCTURE' };
      group.add(cMesh);
    }

    // 1. Architectural Floor Slab
    let floorMat;
    if (floorNum >= 9) {
      floorMat = this.woodFloorMat;
    } else if (floorNum >= 3) {
      floorMat = this.carpetFloorMat;
    } else if (floorNum === 1) {
      floorMat = this.terrazzoMat;
    } else {
      floorMat = this.tileFloorMat;
    }

    const slabGeo = new THREE.BoxGeometry(slabW, 0.35, slabD);
    const slab = new THREE.Mesh(slabGeo, floorMat);
    slab.position.set(0, baseY, 0);
    slab.receiveShadow = true;
    group.add(slab);

    // Architectural floor slab is structurally grounded and clean (no protruding external beams or wireframe lines)
    // Exterior spandrels are managed cleanly inside the facade envelope groups.

    // 3. Executive Charcoal Corridor Runner with Luminous Edge Guidance
    const runnerGeo = new THREE.PlaneGeometry(50, 1.6);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.2
    });
    const runner = new THREE.Mesh(runnerGeo, runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, baseY + 0.18, 0);
    runner.receiveShadow = true;
    group.add(runner);

    const guideGeo = new THREE.PlaneGeometry(50, 0.05);
    const guideMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 });
    for (const gz of [-0.78, 0.78]) {
      const guide = new THREE.Mesh(guideGeo, guideMat);
      guide.rotation.x = -Math.PI / 2;
      guide.position.set(0, baseY + 0.182, gz);
      group.add(guide);
    }

    // 4. Crisp Matte White Partition Dividing Walls
    const divGeos = [];
    const divGeoBase = new THREE.BoxGeometry(0.35, wallH, 20.8);
    const dividers = [-15.0, -6.0, 3.0, 14.0];
    for (const zSide of [13.0, -13.0]) {
      for (const dx of dividers) {
        const g = divGeoBase.clone();
        g.translate(dx, wallCenterY, zSide);
        divGeos.push(g);
      }
    }
    if (divGeos.length > 0) {
      const mergedDivGeo = BufferGeometryUtils.mergeGeometries(divGeos);
      const divMesh = new THREE.Mesh(mergedDivGeo, this.whiteWallMat);
      divMesh.castShadow = true;
      divMesh.receiveShadow = true;
      divMesh.userData = { floor: floorNum, architecturalLayer: 'INTERIOR_ARCHITECTURE' };
      group.add(divMesh);
    }

    // 5. Structural Concrete Columns
    const colGeos = [];
    const colGeoBase = new THREE.BoxGeometry(0.42, wallH, 0.42);
    const colXPositions = [-24.5, -15.0, -6.0, 3.0, 14.0, 24.5];
    const colZPositions = [23.5, 2.6, -2.6, -23.5];
    for (const cx of colXPositions) {
      for (const cz of colZPositions) {
        const g = colGeoBase.clone();
        g.translate(cx, wallCenterY, cz);
        colGeos.push(g);
      }
    }
    if (colGeos.length > 0) {
      const mergedColGeo = BufferGeometryUtils.mergeGeometries(colGeos);
      const colMesh = new THREE.Mesh(mergedColGeo, this.concreteMat);
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      group.add(colMesh);
    }

    // 6. Instanced Room Furnishings per Floor
    this.buildFloorFurnishingsInstanced(group, floorNum, baseY);

    const roomCentersX = [-19.5, -10.5, -1.5, 8.5, 19.0];

    // 7. Recessed Ceiling Light Fixtures
    const lightGeos = [];
    const lightGeoBase = new THREE.BoxGeometry(4.2, 0.04, 1.4);
    for (const zPos of [12.5, -12.5]) {
      for (const xPos of roomCentersX) {
        const g = lightGeoBase.clone();
        g.translate(xPos, baseY + 3.61, zPos);
        lightGeos.push(g);
      }
    }
    if (lightGeos.length > 0) {
      const mergedLightGeo = BufferGeometryUtils.mergeGeometries(lightGeos);
      const lightMesh = new THREE.Mesh(mergedLightGeo, this.ceilingLightMat);
      group.add(lightMesh);
    }

    // Suspended Acoustic Ceiling Grid along Corridor
    const ceilGeo = new THREE.PlaneGeometry(50, 5.0);
    const ceilMesh = new THREE.Mesh(ceilGeo, this.ceilingMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(0, baseY + 3.61, 0);
    group.add(ceilMesh);

    // Continuous Dual Recessed Warm LED Linear Light Strips along Corridor
    const ledStripBase = new THREE.BoxGeometry(49.0, 0.04, 0.12);
    for (const ledZ of [-1.1, 1.1]) {
      const led = new THREE.Mesh(ledStripBase, this.linearLightMat);
      led.position.set(0, baseY + 3.59, ledZ);
      group.add(led);
    }

    // Recessed Circular Downlight Pucks at Door Entrances
    for (const dx of roomCentersX) {
      for (const dz of [-2.4, 2.4]) {
        const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), this.downlightMat);
        dl.position.set(dx, baseY + 3.59, dz);
        group.add(dl);
      }
    }

    // Suspended Illuminated Exit Signs (Clamped below ceiling void; no roof penetration)
    const exitSignGeo = new THREE.BoxGeometry(0.88, 0.44, 0.04);
    const exitWest = new THREE.Mesh(exitSignGeo, this.exitSignLeftMat);
    exitWest.position.set(-24.2, baseY + 2.85, 0);
    group.add(exitWest);

    if (floorNum < this.totalFloors) {
      const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8);
      const rodW1 = new THREE.Mesh(rodGeo, this.columnMat);
      rodW1.position.set(-24.2 - 0.32, baseY + 3.05, 0);
      group.add(rodW1);
      const rodW2 = new THREE.Mesh(rodGeo, this.columnMat);
      rodW2.position.set(-24.2 + 0.32, baseY + 3.05, 0);
      group.add(rodW2);
    }

    const exitEast = new THREE.Mesh(exitSignGeo, this.exitSignRightMat);
    exitEast.position.set(24.2, baseY + 2.85, 0);
    group.add(exitEast);

    if (floorNum < this.totalFloors) {
      const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8);
      const rodE1 = new THREE.Mesh(rodGeo, this.columnMat);
      rodE1.position.set(24.2 - 0.32, baseY + 3.05, 0);
      group.add(rodE1);
      const rodE2 = new THREE.Mesh(rodGeo, this.columnMat);
      rodE2.position.set(24.2 + 0.32, baseY + 3.05, 0);
      group.add(rodE2);
    }

    // Corridor Balustrades along open front edge
    const balGeos = [];
    const balGeoBase = new THREE.BoxGeometry(6.5, 1.1, 0.08);
    const balXPositions = [-22, -13, -4, 5, 14, 22];
    for (const bx of balXPositions) {
      const g = balGeoBase.clone();
      g.translate(bx, baseY + 0.175 + 0.55, 2.4);
      balGeos.push(g);
    }
    if (balGeos.length > 0) {
      const mergedBalGeo = BufferGeometryUtils.mergeGeometries(balGeos);
      const balMesh = new THREE.Mesh(mergedBalGeo, this.railingMat);
      group.add(balMesh);
    }

    // === Permanent Structural Architectural Envelope (Shear Walls & Service Rear Facade) ===
    // 1. West End Architectural Shear Wall (x = -30) with punched ribbon vision slots
    this.createArchitecturalEndWall(group, baseY, -30, -24, -3.2, wallH, true);
    this.createArchitecturalEndWall(group, baseY, -30, 3.2, 24, wallH, true);

    // 2. East End Architectural Shear Wall (x = +30) with punched ribbon vision slots
    this.createArchitecturalEndWall(group, baseY, 30, -24, -3.2, wallH, false);
    this.createArchitecturalEndWall(group, baseY, 30, 3.2, 24, wallH, false);

    // 3. Rear North Architectural Facade (z = -24) with solid MEP service core & punched window bays
    this.createRearArchitecturalFacade(group, baseY, -24, wallH);

    // === Dynamic Front Facade Group (Full Exterior / Cutaway Section) ===
    // Slices away cleanly in Cutaway Section (C) for complete 10-floor interior digital-twin inspection
    const facadeFloorGroup = new THREE.Group();
    facadeFloorGroup.userData = { floor: floorNum };

    this.createFrontArchitecturalFacade(facadeFloorGroup, baseY, 24, wallH, floorNum);

    this.facadeCutawayGroup.add(facadeFloorGroup);

    // Back Accent Walls
    this.createCaramelBackWall(group, baseY, 2.6, wallH, true, floorNum);
    this.createCaramelBackWall(group, baseY, -2.6, wallH, false, floorNum);
  }

  // === Architectural End Wall: Solid Precast Shear Wall with Punched Ribbon Vision Glazing ===
  createArchitecturalEndWall(targetGroup, baseY, x, z1, z2, height, isWest) {
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    const midZ = (minZ + maxZ) / 2;
    const wallY = baseY + 0.175 + height / 2;
    const wallThick = 0.38;
    const wallX = x + (x > 0 ? -wallThick / 2 : wallThick / 2);

    const solidGeos = [];
    const spandrelGeos = [];
    const glassGeos = [];
    const mullionGeos = [];

    // Ribbon Vision Glazing Window aperture in middle section of wing
    // zSpan is ~20.8m. Window aperture: midZ - 3.6 to midZ + 3.6 (7.2m width)
    const winMinZ = midZ - 3.6;
    const winMaxZ = midZ + 3.6;
    const winH = 2.0; // 2m high vision window
    const winSillY = baseY + 0.175 + 0.95; // 0.95m sill height above floor

    // 1. Solid precast shear wall outer zone (towards corner)
    const spanOuter = Math.abs(maxZ - winMaxZ);
    if (spanOuter > 0.1) {
      const gOuter = new THREE.BoxGeometry(wallThick, height, spanOuter);
      gOuter.translate(wallX, wallY, (maxZ + winMaxZ) / 2);
      solidGeos.push(gOuter);
    }

    // 2. Solid precast shear wall inner zone (towards stair core)
    const spanInner = Math.abs(winMinZ - minZ);
    if (spanInner > 0.1) {
      const gInner = new THREE.BoxGeometry(wallThick, height, spanInner);
      gInner.translate(wallX, wallY, (winMinZ + minZ) / 2);
      solidGeos.push(gInner);
    }

    // 3. Spandrel wall panel beneath the window sill
    const gSpandrel = new THREE.BoxGeometry(wallThick, 0.95, winMaxZ - winMinZ);
    gSpandrel.translate(wallX, baseY + 0.175 + 0.95 / 2, midZ);
    solidGeos.push(gSpandrel);

    // 4. Header wall panel above the window
    const headerH = height - (0.95 + winH);
    if (headerH > 0.05) {
      const gHeader = new THREE.BoxGeometry(wallThick, headerH, winMaxZ - winMinZ);
      gHeader.translate(wallX, baseY + 0.175 + 0.95 + winH + headerH / 2, midZ);
      solidGeos.push(gHeader);
    }

    // 5. Recessed Vision Glazing in Window Aperture
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, winH, winMaxZ - winMinZ), this.glassExteriorMat);
    glass.position.set(wallX, winSillY + winH / 2, midZ);
    targetGroup.add(glass);

    // 6. Architectural Dark Aluminum Mullions & Perimeter Window Frame
    const frameSurround = new THREE.BoxGeometry(wallThick + 0.06, 0.10, winMaxZ - winMinZ);
    frameSurround.translate(wallX, winSillY, midZ);
    mullionGeos.push(frameSurround);

    const frameHeader = new THREE.BoxGeometry(wallThick + 0.06, 0.10, winMaxZ - winMinZ);
    frameHeader.translate(wallX, winSillY + winH, midZ);
    mullionGeos.push(frameHeader);

    for (let mz = winMinZ + 2.4; mz < winMaxZ - 0.2; mz += 2.4) {
      const vm = new THREE.BoxGeometry(wallThick + 0.08, winH, 0.12);
      vm.translate(wallX, winSillY + winH / 2, mz);
      mullionGeos.push(vm);
    }

    // Merge & add
    if (solidGeos.length > 0) {
      const solidMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(solidGeos), this.precastFacadeMat);
      solidMesh.castShadow = true;
      solidMesh.receiveShadow = true;
      targetGroup.add(solidMesh);
    }
    if (mullionGeos.length > 0) {
      const mullMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(mullionGeos), this.mullionMat);
      mullMesh.castShadow = true;
      targetGroup.add(mullMesh);
    }
  }

  // === Rear North Architectural Facade: Solid MEP Service Core + Alternating Ribbon Bays ===
  createRearArchitecturalFacade(targetGroup, baseY, z, height) {
    const wallY = baseY + 0.175 + height / 2;
    const solidGeos = [];
    const mullionGeos = [];
    const glassMat = this.glassExteriorMat;

    // 1. Solid Central MEP & Elevator Service Core Tower Wall (x: -4.0 to 6.2)
    const coreW = 10.2;
    const coreMidX = 1.1;
    const coreWall = new THREE.BoxGeometry(coreW, height, 0.40);
    coreWall.translate(coreMidX, wallY, z + 0.20);
    solidGeos.push(coreWall);

    // 2. Corner Solid Shear Zones (x: -30 to -24, and 24 to 30)
    const cornerW = 6.0;
    const cWest = new THREE.BoxGeometry(cornerW, height, 0.40);
    cWest.translate(-27.0, wallY, z + 0.20);
    solidGeos.push(cWest);

    const cEast = new THREE.BoxGeometry(cornerW, height, 0.40);
    cEast.translate(27.0, wallY, z + 0.20);
    solidGeos.push(cEast);

    // 3. Office Window Bays: West Bay (x: -24 to -4.0, span 20m) & East Bay (x: 6.2 to 24, span 17.8m)
    const bays = [
      { minX: -24, maxX: -4.0 },
      { minX: 6.2, maxX: 24 }
    ];

    bays.forEach(bay => {
      const span = bay.maxX - bay.minX;
      const midX = (bay.minX + bay.maxX) / 2;
      const winH = 2.1;
      const winSillY = baseY + 0.175 + 0.90;

      // Spandrel wall panel under sill
      const sp = new THREE.BoxGeometry(span, 0.90, 0.35);
      sp.translate(midX, baseY + 0.175 + 0.45, z + 0.18);
      solidGeos.push(sp);

      // Header panel above window
      const hH = height - (0.90 + winH);
      if (hH > 0.05) {
        const hd = new THREE.BoxGeometry(span, hH, 0.35);
        hd.translate(midX, baseY + 0.175 + 0.90 + winH + hH / 2, z + 0.18);
        solidGeos.push(hd);
      }

      // Recessed vision glass
      const gl = new THREE.Mesh(new THREE.BoxGeometry(span, winH, 0.06), glassMat);
      gl.position.set(midX, winSillY + winH / 2, z + 0.18);
      targetGroup.add(gl);

      // Window frames and mullions
      const sillF = new THREE.BoxGeometry(span, 0.08, 0.20);
      sillF.translate(midX, winSillY, z + 0.18);
      mullionGeos.push(sillF);

      const headF = new THREE.BoxGeometry(span, 0.08, 0.20);
      headF.translate(midX, winSillY + winH, z + 0.18);
      mullionGeos.push(headF);

      for (let mx = bay.minX + 3.2; mx < bay.maxX - 0.2; mx += 3.2) {
        const vm = new THREE.BoxGeometry(0.14, winH, 0.22);
        vm.translate(mx, winSillY + winH / 2, z + 0.18);
        mullionGeos.push(vm);
      }
    });

    if (solidGeos.length > 0) {
      const solidMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(solidGeos), this.precastFacadeMat);
      solidMesh.castShadow = true;
      solidMesh.receiveShadow = true;
      targetGroup.add(solidMesh);
    }
    if (mullionGeos.length > 0) {
      const mullMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(mullionGeos), this.mullionMat);
      mullMesh.castShadow = true;
      targetGroup.add(mullMesh);
    }
  }

  // === Front Primary Architectural Facade: Clean, Minimal, Coherent ===
  createFrontArchitecturalFacade(targetGroup, baseY, z, height, floorNum) {
    const isGround = floorNum === 1;
    const isExterior = this.facadeMode === 'FULL';
    const glassMat = isExterior ? this.glassExteriorMat : this.glassMat;

    // Structural Pilasters dividing facade into clean 6-bay architectural rhythm
    // Piers terminate flush inside corner piers (x: -29.4 to 29.4)
    const pilasterX = [-29.4, -19.6, -9.8, 0, 9.8, 19.6, 29.4];
    const pilasterGeos = [];
    const pBase = new THREE.BoxGeometry(0.60, height, 0.28);
    pilasterX.forEach(px => {
      const p = pBase.clone();
      p.translate(px, baseY + 0.175 + height / 2, z - 0.14);
      pilasterGeos.push(p);
    });

    if (pilasterGeos.length > 0) {
      const pilasterMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(pilasterGeos), this.precastFacadeMat);
      pilasterMesh.castShadow = true;
      pilasterMesh.receiveShadow = true;
      targetGroup.add(pilasterMesh);
    }

    // Facade Bays between pilasters
    for (let i = 0; i < pilasterX.length - 1; i++) {
      const x1 = pilasterX[i] + 0.30;
      const x2 = pilasterX[i + 1] - 0.30;
      const span = x2 - x1;
      const midX = (x1 + x2) / 2;

      // Clean horizontal spandrel fascia band strictly between pilasters (no protrusion)
      const spandrel = new THREE.Mesh(new THREE.BoxGeometry(span, 0.55, 0.12), this.spandrelMat);
      spandrel.position.set(midX, baseY + 0.175 + 0.275, z - 0.12);
      targetGroup.add(spandrel);

      if (isGround && (i === 2 || i === 3)) {
        // Ground Floor Recessed Double-Door Entrance Portal
        if (i === 2) {
          // Centered grand entrance spanning across center
          const portalW = span * 2 + 0.60;
          const portalMidX = 0;
          const portalSurround = new THREE.Mesh(new THREE.BoxGeometry(portalW, height, 0.35), this.columnMat);
          portalSurround.position.set(portalMidX, baseY + 0.175 + height / 2, z - 0.18);
          targetGroup.add(portalSurround);

          const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(portalW - 1.2, 2.7, 0.08), glassMat);
          doorGlass.position.set(portalMidX, baseY + 0.175 + 1.35, z - 0.18);
          targetGroup.add(doorGlass);

          // Stainless door pull rails
          const pullGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
          const pullL = new THREE.Mesh(pullGeo, this.spandrelMat);
          pullL.position.set(portalMidX - 0.5, baseY + 0.175 + 1.2, z - 0.12);
          targetGroup.add(pullL);
          const pullR = new THREE.Mesh(pullGeo, this.spandrelMat);
          pullR.position.set(portalMidX + 0.5, baseY + 0.175 + 1.2, z - 0.12);
          targetGroup.add(pullR);

          // Cantilevered Entrance Canopy (extends 2.6m outward)
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(portalW + 1.0, 0.14, 2.6), this.columnMat);
          canopy.position.set(portalMidX, baseY + 0.175 + 3.1, z + 1.15);
          targetGroup.add(canopy);

          const canopyGlow = new THREE.Mesh(new THREE.PlaneGeometry(portalW + 0.6, 2.0), this.ceilingLightMat);
          canopyGlow.rotation.x = Math.PI / 2;
          canopyGlow.position.set(portalMidX, baseY + 0.175 + 3.02, z + 1.15);
          targetGroup.add(canopyGlow);
        }
      } else {
        // Standard Clean Modern Architectural Vision Glazing
        const winH = height - 0.55;
        const winY = baseY + 0.175 + 0.55 + winH / 2;
        const glass = new THREE.Mesh(new THREE.BoxGeometry(span, winH, 0.06), glassMat);
        glass.position.set(midX, winY, z - 0.16);
        targetGroup.add(glass);

        // Slim architectural division mullions (clean 3-pane ratio per bay)
        const paneW = span / 3;
        for (let m = 1; m < 3; m++) {
          const mx = x1 + m * paneW;
          const mull = new THREE.Mesh(new THREE.BoxGeometry(0.08, winH, 0.10), this.mullionMat);
          mull.position.set(mx, winY, z - 0.15);
          targetGroup.add(mull);
        }

        // Horizontal transom bar at 2.2m
        const transom = new THREE.Mesh(new THREE.BoxGeometry(span, 0.08, 0.10), this.mullionMat);
        transom.position.set(midX, baseY + 0.175 + 2.2, z - 0.15);
        targetGroup.add(transom);
      }
    }
  }

  createCaramelBackWall(targetGroup, baseY, z, wallH, isSouth, floorNum) {
    const doorXPositions = [-19.5, -10.5, -1.5, 8.5, 19.0];
    const doorW = 2.2;
    const doorH = 2.4;
    const headerH = wallH - doorH;
    const wallCenterY = baseY + 0.175 + wallH / 2;

    const caramelGeos = [];
    const baseboardGeos = [];
    const frameGeos = [];
    const glassGeos = [];
    const handleGeos = [];
    const plaqueGeos = [];
    const plaqueBadgeGeos = [];

    const seg1G = new THREE.BoxGeometry(3.0, wallH, 0.35);
    seg1G.translate(-23.5, wallCenterY, z);
    caramelGeos.push(seg1G);

    const bb1 = new THREE.BoxGeometry(3.0, 0.14, 0.38);
    bb1.translate(-23.5, baseY + 0.175 + 0.07, z);
    baseboardGeos.push(bb1);

    for (let i = 0; i < doorXPositions.length - 1; i++) {
      const x1 = doorXPositions[i] + doorW / 2;
      const x2 = doorXPositions[i + 1] - doorW / 2;
      const span = x2 - x1;
      const midX = (x1 + x2) / 2;

      const wallG = new THREE.BoxGeometry(span, wallH, 0.35);
      wallG.translate(midX, wallCenterY, z);
      caramelGeos.push(wallG);

      const bb = new THREE.BoxGeometry(span, 0.14, 0.38);
      bb.translate(midX, baseY + 0.175 + 0.07, z);
      baseboardGeos.push(bb);
    }

    const segEndG = new THREE.BoxGeometry(3.0, wallH, 0.35);
    segEndG.translate(23.0, wallCenterY, z);
    caramelGeos.push(segEndG);

    const bbEnd = new THREE.BoxGeometry(3.0, 0.14, 0.38);
    bbEnd.translate(23.0, baseY + 0.175 + 0.07, z);
    baseboardGeos.push(bbEnd);

    const jambBase = new THREE.BoxGeometry(0.1, doorH, 0.36);
    const topFrameBase = new THREE.BoxGeometry(doorW, 0.08, 0.36);
    const doorLeafBase = new THREE.BoxGeometry(0.95, doorH - 0.08, 0.06);
    const glassVisionBase = new THREE.BoxGeometry(0.24, 1.2, 0.07);
    const handleBase = new THREE.BoxGeometry(0.04, 0.45, 0.12);
    const plaqueBase = new THREE.BoxGeometry(0.48, 0.24, 0.02);
    const plaqueBadgeBase = new THREE.BoxGeometry(0.42, 0.18, 0.025);
    const lintelBase = new THREE.BoxGeometry(doorW, headerH, 0.35);

    doorXPositions.forEach((doorX) => {
      const lintelG = lintelBase.clone();
      lintelG.translate(doorX, baseY + 0.175 + doorH + headerH / 2, z);
      caramelGeos.push(lintelG);

      const lJambG = jambBase.clone();
      lJambG.translate(doorX - doorW / 2 + 0.05, baseY + 0.175 + doorH / 2, z);
      frameGeos.push(lJambG);

      const rJambG = jambBase.clone();
      rJambG.translate(doorX + doorW / 2 - 0.05, baseY + 0.175 + doorH / 2, z);
      frameGeos.push(rJambG);

      const topFrameG = topFrameBase.clone();
      topFrameG.translate(doorX, baseY + 0.175 + doorH + 0.04, z);
      frameGeos.push(topFrameG);

      const doorLeafG = doorLeafBase.clone();
      doorLeafG.translate(doorX - doorW / 2 + 0.52, baseY + 0.175 + (doorH - 0.08) / 2, z);
      frameGeos.push(doorLeafG);

      const glassG = glassVisionBase.clone();
      glassG.translate(doorX - doorW / 2 + 0.62, baseY + 0.175 + 1.2, z);
      glassGeos.push(glassG);

      const handleG = handleBase.clone();
      handleG.translate(doorX - doorW / 2 + 0.9, baseY + 0.175 + 0.95, z);
      handleGeos.push(handleG);

      const signSide = doorX + doorW / 2 + 0.45;
      const plaqueG = plaqueBase.clone();
      plaqueG.translate(signSide, baseY + 0.175 + 1.45, z + (isSouth ? -0.19 : 0.19));
      plaqueGeos.push(plaqueG);

      const badgeG = plaqueBadgeBase.clone();
      badgeG.translate(signSide, baseY + 0.175 + 1.45, z + (isSouth ? -0.20 : 0.20));
      plaqueBadgeGeos.push(badgeG);
    });

    if (caramelGeos.length > 0) {
      targetGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(caramelGeos), this.woodAccentWallMat));
    }
    if (baseboardGeos.length > 0) {
      targetGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(baseboardGeos), this.columnMat));
    }
    if (frameGeos.length > 0) {
      targetGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(frameGeos), this.columnMat));
    }
    if (glassGeos.length > 0) {
      targetGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(glassGeos), this.glassMat));
    }
    if (handleGeos.length > 0) {
      targetGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(handleGeos), this.elevatorDoorMat));
    }
    if (plaqueGeos.length > 0) {
      targetGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(plaqueGeos), this.plaqueMat));
    }
    if (plaqueBadgeGeos.length > 0) {
      targetGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(plaqueBadgeGeos), this.screenDisplayCyanMat));
    }
  }

    // === ARCHITECTURAL REALISTIC STAIRS & DUAL-MODE ENCLOSURE ===
  buildStairwellCores() {
    const totalH = this.totalFloors * this.floorHeight;
    this.createStairwellCore(-28, 0, totalH, 'WEST EMERGENCY CORE A');
    this.createStairwellCore(28, 0, totalH, 'EAST EMERGENCY CORE B');
  }

  createStairwellCore(x, z, totalH, label) {
    const isWest = x < 0;
    const shaftW = 5.6;
    const shaftD = 6.8;
    const wallThick = 0.28;
    const extWallX = isWest ? x - shaftW / 2 + wallThick / 2 : x + shaftW / 2 - wallThick / 2;
    const intWallX = isWest ? x + shaftW / 2 - wallThick / 2 : x - shaftW / 2 + wallThick / 2;

    const flight1X = isWest ? x + 0.95 : x - 0.95;
    const flight2X = isWest ? x - 0.95 : x + 0.95;
    const flightWidth = 1.40;
    const riserCount = 11;
    const riserH = 1.90 / riserCount;
    const treadRunZ = 2.00 / (riserCount - 1);

    const flightZ_Start = -0.75;
    const flightZ_End = -2.75;
    const flightLength = Math.hypot(flightZ_End - flightZ_Start, 1.90);
    const pitchAngle = Math.atan2(1.90, Math.abs(flightZ_End - flightZ_Start));

    const stringerBase = new THREE.BoxGeometry(flightWidth, 0.16, flightLength);
    const riserBase = new THREE.BoxGeometry(flightWidth, riserH, 0.04);
    const treadBase = new THREE.BoxGeometry(flightWidth, 0.045, 0.28);
    const nosingBase = new THREE.BoxGeometry(flightWidth, 0.02, 0.04);
    const postBase = new THREE.BoxGeometry(0.035, 0.90, 0.035);
    const railBarBase = new THREE.BoxGeometry(0.04, 0.04, flightLength + 0.2);

    for (let f = 1; f <= this.totalFloors; f++) {
      const flY = (f - 1) * this.floorHeight;
      const floorWallH = this.floorHeight;
      const floorWallCenterY = flY + floorWallH / 2;
      const group = this.floorGroups[f];

      // A. Per-Floor Stairwell Exterior Enclosure Walls (in facadeCutawayGroup)
      // Height matches floor height so each floor layer carries its outer envelope cleanly
      const extWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, floorWallH, shaftD), this.precastFacadeMat);
      extWall.position.set(extWallX, floorWallCenterY, z - 1.2);
      extWall.castShadow = true;
      extWall.receiveShadow = true;
      extWall.userData = { floor: f, architecturalLayer: 'EXTERIOR_ENVELOPE' };
      this.facadeCutawayGroup.add(extWall);

      const northWall = new THREE.Mesh(new THREE.BoxGeometry(shaftW, floorWallH, wallThick), this.precastFacadeMat);
      northWall.position.set(x, floorWallCenterY, z - 1.2 - shaftD / 2 + wallThick / 2);
      northWall.castShadow = true;
      northWall.receiveShadow = true;
      northWall.userData = { floor: f, architecturalLayer: 'EXTERIOR_ENVELOPE' };
      this.facadeCutawayGroup.add(northWall);

      const southWall = new THREE.Mesh(new THREE.BoxGeometry(shaftW, floorWallH, wallThick), this.precastFacadeMat);
      southWall.position.set(x, floorWallCenterY, z - 1.2 + shaftD / 2 - wallThick / 2);
      southWall.castShadow = true;
      southWall.receiveShadow = true;
      southWall.userData = { floor: f, architecturalLayer: 'EXTERIOR_ENVELOPE' };
      this.facadeCutawayGroup.add(southWall);

      const intWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, floorWallH, shaftD), this.stairWallMat);
      intWall.position.set(intWallX, floorWallCenterY, z - 1.2);
      intWall.receiveShadow = true;
      intWall.userData = { floor: f, architecturalLayer: 'EXTERIOR_ENVELOPE' };
      this.facadeCutawayGroup.add(intWall);

      // Vision slit glazing
      const slitMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.45), this.glassExteriorMat);
      slitMesh.position.set(extWallX + (isWest ? -0.1 : 0.1), flY + 1.9, z - 1.2);
      slitMesh.userData = { floor: f, architecturalLayer: 'EXTERIOR_ENVELOPE' };
      this.facadeCutawayGroup.add(slitMesh);

      // B. Per-Floor Stair Flights, Landings, Handrails, and Safety Components (in floorGroups[f])
      const fLandingGeos = [];
      const fStringerGeos = [];
      const fRiserGeos = [];
      const fTreadGeos = [];
      const fNosingGeos = [];
      const fRailingGeos = [];
      const fDoorFrameGeos = [];
      const fDoorLeafGeos = [];
      const fPushBarGeos = [];
      const fExitSignGeos = [];
      const fBulkheadGeos = [];

      // Floor Landing Slab
      const floorLanding = new THREE.BoxGeometry(3.8, 0.22, 1.8);
      floorLanding.translate(x, flY + 0.11, 0.0);
      fLandingGeos.push(floorLanding);

      if (f < this.totalFloors) {
        // Intermediate Mid-Landing
        const midLanding = new THREE.BoxGeometry(3.8, 0.22, 1.8);
        midLanding.translate(x, flY + 1.9 + 0.11, -3.25);
        fLandingGeos.push(midLanding);

        // Support beam
        const midBeam = new THREE.BoxGeometry(3.8, 0.35, 0.24);
        midBeam.translate(x, flY + 1.9 - 0.175, -4.0);
        fLandingGeos.push(midBeam);

        // Flight 1: Upper Landing (flY + 3.8) descending to Mid-Landing (flY + 1.9)
        const str1 = stringerBase.clone();
        str1.rotateX(-pitchAngle);
        str1.translate(flight1X, flY + 2.85 - 0.08, -1.75);
        fStringerGeos.push(str1);

        for (let s = 0; s < riserCount; s++) {
          const stepY = flY + 3.8 - (s + 1) * riserH;
          const stepZ = flightZ_Start - s * treadRunZ;

          const rG = riserBase.clone();
          rG.translate(flight1X, stepY + riserH / 2, stepZ + 0.10);
          fRiserGeos.push(rG);

          const tG = treadBase.clone();
          tG.translate(flight1X, stepY + riserH, stepZ);
          fTreadGeos.push(tG);

          const nG = nosingBase.clone();
          nG.translate(flight1X, stepY + riserH + 0.015, stepZ + 0.12);
          fNosingGeos.push(nG);

          if (s % 2 === 0) {
            const postL = postBase.clone();
            postL.translate(flight1X - flightWidth / 2 + 0.04, stepY + riserH + 0.45, stepZ);
            fRailingGeos.push(postL);

            const postR = postBase.clone();
            postR.translate(flight1X + flightWidth / 2 - 0.04, stepY + riserH + 0.45, stepZ);
            fRailingGeos.push(postR);
          }
        }

        const rail1L = railBarBase.clone();
        rail1L.rotateX(-pitchAngle);
        rail1L.translate(flight1X - flightWidth / 2 + 0.04, flY + 2.85 + 0.90, -1.75);
        fRailingGeos.push(rail1L);

        const rail1R = railBarBase.clone();
        rail1R.rotateX(-pitchAngle);
        rail1R.translate(flight1X + flightWidth / 2 - 0.04, flY + 2.85 + 0.90, -1.75);
        fRailingGeos.push(rail1R);

        // Flight 2: Mid-Landing (flY + 1.9) descending to Lower Landing (flY)
        const str2 = stringerBase.clone();
        str2.rotateX(pitchAngle);
        str2.translate(flight2X, flY + 0.95 - 0.08, -1.75);
        fStringerGeos.push(str2);

        for (let s = 0; s < riserCount; s++) {
          const stepY = flY + 1.9 - (s + 1) * riserH;
          const stepZ = flightZ_End + s * treadRunZ;

          const rG = riserBase.clone();
          rG.translate(flight2X, stepY + riserH / 2, stepZ - 0.10);
          fRiserGeos.push(rG);

          const tG = treadBase.clone();
          tG.translate(flight2X, stepY + riserH, stepZ);
          fTreadGeos.push(tG);

          const nG = nosingBase.clone();
          nG.translate(flight2X, stepY + riserH + 0.015, stepZ - 0.12);
          fNosingGeos.push(nG);

          if (s % 2 === 0) {
            const postL = postBase.clone();
            postL.translate(flight2X - flightWidth / 2 + 0.04, stepY + riserH + 0.45, stepZ);
            fRailingGeos.push(postL);

            const postR = postBase.clone();
            postR.translate(flight2X + flightWidth / 2 - 0.04, stepY + riserH + 0.45, stepZ);
            fRailingGeos.push(postR);
          }
        }

        const rail2L = railBarBase.clone();
        rail2L.rotateX(pitchAngle);
        rail2L.translate(flight2X - flightWidth / 2 + 0.04, flY + 0.95 + 0.90, -1.75);
        fRailingGeos.push(rail2L);

        const rail2R = railBarBase.clone();
        rail2R.rotateX(pitchAngle);
        rail2R.translate(flight2X + flightWidth / 2 - 0.04, flY + 0.95 + 0.90, -1.75);
        fRailingGeos.push(rail2R);

        const guardMidBack = new THREE.BoxGeometry(3.8, 1.10, 0.04);
        guardMidBack.translate(x, flY + 1.9 + 0.55, -4.15);
        fRailingGeos.push(guardMidBack);

        const guardMidSide = new THREE.BoxGeometry(0.04, 1.10, 1.8);
        guardMidSide.translate(isWest ? x - 1.9 : x + 1.9, flY + 1.9 + 0.55, -3.25);
        fRailingGeos.push(guardMidSide);

        const guardCentral = new THREE.BoxGeometry(0.04, 1.10, 2.4);
        guardCentral.translate(x, flY + 1.9 + 0.55, -1.75);
        fRailingGeos.push(guardCentral);
      }

      // Fire Door & Header
      const doorX = isWest ? -25.4 : 25.4;
      const dFrameGeo = new THREE.BoxGeometry(0.14, 2.25, 1.25);
      dFrameGeo.translate(doorX, flY + 1.125, 0.0);
      fDoorFrameGeos.push(dFrameGeo);

      const dLeafGeo = new THREE.BoxGeometry(0.05, 2.15, 0.95);
      dLeafGeo.translate(doorX, flY + 1.075, 0.0);
      fDoorLeafGeos.push(dLeafGeo);

      const pushBarGeo = new THREE.BoxGeometry(0.08, 0.06, 0.85);
      pushBarGeo.translate(doorX + (isWest ? 0.04 : -0.04), flY + 0.95, 0.0);
      fPushBarGeos.push(pushBarGeo);

      const exSignG = new THREE.BoxGeometry(0.08, 0.32, 0.75);
      exSignG.translate(doorX, flY + 2.45, 0.0);
      fExitSignGeos.push(exSignG);

      const bulkG = new THREE.BoxGeometry(0.28, 0.14, 0.08);
      bulkG.translate(x, flY + 2.45, 0.85);
      fBulkheadGeos.push(bulkG);

      // Merge and add directly to floorGroups[f] so stairs move with their owning floor
      if (fLandingGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fLandingGeos), this.tileFloorMat));
      }
      if (fStringerGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fStringerGeos), this.concreteMat));
      }
      if (fTreadGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fTreadGeos), this.stairTreadMat));
      }
      if (fRiserGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fRiserGeos), this.columnMat));
      }
      if (fNosingGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fNosingGeos), this.antiSlipNosingMat));
      }
      if (fRailingGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fRailingGeos), this.railingMat));
      }
      if (fDoorFrameGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fDoorFrameGeos), this.mullionMat));
      }
      if (fDoorLeafGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fDoorLeafGeos), this.fireDoorMat));
      }
      if (fPushBarGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fPushBarGeos), this.panicBarSilverMat));
      }
      if (fExitSignGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fExitSignGeos), isWest ? this.exitSignLeftMat : this.exitSignRightMat));
      }
      if (fBulkheadGeos.length > 0) {
        group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(fBulkheadGeos), this.stairLightMat));
      }
    }
  }

  buildElevatorBank() {
    const totalH = this.totalFloors * this.floorHeight;
    const shaftX = [1.2, 3.2, 5.2];
    const shaftZ = -1.8;
    const shaftW = 1.7;
    const shaftD = 1.45;

    this.elevatorCars = [];
    const portalMat = this.columnMat;
    const doorLeafMat = this.spandrelMat;
    const indicatorMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.6,
      roughness: 0.2
    });

    // 1. Hierarchical Elevator Core Walls & Lobby Doors per Floor Layer
    for (let f = 1; f <= this.totalFloors; f++) {
      const group = this.floorGroups[f];
      const baseY = (f - 1) * this.floorHeight;
      const frontZ = shaftZ + shaftD / 2 + 0.10;
      const coreH = this.floorHeight;
      const coreCenterY = baseY + coreH / 2;

      // Shaft Shear Walls for Floor f
      const coreBack = new THREE.Mesh(new THREE.BoxGeometry(6.6, coreH, 0.35), this.precastFacadeMat);
      coreBack.position.set(3.2, coreCenterY, shaftZ - shaftD / 2 - 0.175);
      coreBack.castShadow = true;
      coreBack.receiveShadow = true;
      group.add(coreBack);

      const coreWest = new THREE.Mesh(new THREE.BoxGeometry(0.35, coreH, shaftD + 0.35), this.precastFacadeMat);
      coreWest.position.set(0.15, coreCenterY, shaftZ);
      group.add(coreWest);

      const coreEast = new THREE.Mesh(new THREE.BoxGeometry(0.35, coreH, shaftD + 0.35), this.precastFacadeMat);
      coreEast.position.set(6.25, coreCenterY, shaftZ);
      group.add(coreEast);

      [2.2, 4.2].forEach(divX => {
        const divWall = new THREE.Mesh(new THREE.BoxGeometry(0.20, coreH, shaftD), this.columnMat);
        divWall.position.set(divX, coreCenterY, shaftZ);
        group.add(divWall);
      });

      // Solid architectural lobby fascia above doors
      const fascia = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.0, 0.22), portalMat);
      fascia.position.set(3.2, baseY + 0.175 + 2.9, frontZ);
      group.add(fascia);

      // 3 Elevator Landing Portals, Sliding Doors & Lanterns for Floor f
      shaftX.forEach((sx, idx) => {
        const frameW = 1.45;
        const frameH = 2.45;
        const portalFrame = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, 0.14), portalMat);
        portalFrame.position.set(sx, baseY + 0.175 + frameH / 2, frontZ);
        group.add(portalFrame);

        const leafW = 0.58;
        const leafH = 2.30;
        const leafThick = 0.05;

        const doorLeft = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafThick), doorLeafMat);
        doorLeft.position.set(sx - leafW / 2 - 0.01, baseY + 0.175 + leafH / 2, frontZ + 0.03);
        group.add(doorLeft);

        const doorRight = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafThick), doorLeafMat);
        doorRight.position.set(sx + leafW / 2 + 0.01, baseY + 0.175 + leafH / 2, frontZ + 0.03);
        group.add(doorRight);

        const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.04), indicatorMat);
        indicator.position.set(sx, baseY + 0.175 + frameH + 0.18, frontZ + 0.06);
        group.add(indicator);
      });

      const callPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.04), portalMat);
      callPanel.position.set(2.2, baseY + 0.175 + 1.25, frontZ + 0.08);
      group.add(callPanel);

      const callButton = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), indicatorMat);
      callButton.position.set(2.2, baseY + 0.175 + 1.25, frontZ + 0.11);
      group.add(callButton);
    }

    // 2. Animated Elevator Cabs inside the Shafts
    shaftX.forEach((sx, idx) => {
      const carGroup = new THREE.Group();

      const carFloor = new THREE.Mesh(new THREE.BoxGeometry(shaftW - 0.22, 0.08, shaftD - 0.22), this.terrazzoMat);
      carFloor.position.y = 0.04;
      carGroup.add(carFloor);

      const carRoof = new THREE.Mesh(new THREE.BoxGeometry(shaftW - 0.22, 0.08, shaftD - 0.22), portalMat);
      carRoof.position.y = 2.65;
      carGroup.add(carRoof);

      const carLight = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), this.ceilingLightMat);
      carLight.rotation.x = Math.PI / 2;
      carLight.position.y = 2.63;
      carGroup.add(carLight);

      const carWalls = new THREE.Mesh(
        new THREE.BoxGeometry(shaftW - 0.24, 2.55, shaftD - 0.24),
        new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1
        })
      );
      carWalls.position.y = 1.35;
      carGroup.add(carWalls);

      const initY = (idx * 3 + 1) * this.floorHeight;
      carGroup.position.set(sx, initY, shaftZ);
      this.elevatorGroup.add(carGroup);

      this.elevatorCars.push({
        mesh: carGroup,
        y: initY,
        minY: 0.1,
        maxY: (this.totalFloors - 1) * this.floorHeight,
        speed: 3.5 + idx * 0.8,
        direction: idx % 2 === 0 ? 1 : -1
      });
    });
  }

  buildRooftopHelipad() {
    const roofY = this.totalFloors * this.floorHeight;
    const slabW = 60;
    const slabD = 48;

    // 1. Continuous Parapet Wall around Perimeter with Metal Coping Caps
    const parapetH = 1.3;
    const parapetThick = 0.35;
    const parapetGeos = [];

    const pS = new THREE.BoxGeometry(slabW, parapetH, parapetThick);
    pS.translate(0, roofY + parapetH / 2, 24 - parapetThick / 2);
    parapetGeos.push(pS);

    const pN = new THREE.BoxGeometry(slabW, parapetH, parapetThick);
    pN.translate(0, roofY + parapetH / 2, -24 + parapetThick / 2);
    parapetGeos.push(pN);

    const pW = new THREE.BoxGeometry(parapetThick, parapetH, slabD);
    pW.translate(-30 + parapetThick / 2, roofY + parapetH / 2, 0);
    parapetGeos.push(pW);

    const pE = new THREE.BoxGeometry(parapetThick, parapetH, slabD);
    pE.translate(30 - parapetThick / 2, roofY + parapetH / 2, 0);
    parapetGeos.push(pE);

    const parapetMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(parapetGeos), this.concreteMat);
    parapetMesh.castShadow = true;
    parapetMesh.receiveShadow = true;
    this.roofGroup.add(parapetMesh);

    // Parapet Metal Coping Cap
    const copingGeos = [];
    const copingCapS = new THREE.BoxGeometry(slabW + 0.1, 0.08, parapetThick + 0.1);
    copingCapS.translate(0, roofY + parapetH + 0.04, 24 - parapetThick / 2);
    copingGeos.push(copingCapS);

    const copingCapN = new THREE.BoxGeometry(slabW + 0.1, 0.08, parapetThick + 0.1);
    copingCapN.translate(0, roofY + parapetH + 0.04, -24 + parapetThick / 2);
    copingGeos.push(copingCapN);

    const copingCapW = new THREE.BoxGeometry(parapetThick + 0.1, 0.08, slabD + 0.1);
    copingCapW.translate(-30 + parapetThick / 2, roofY + parapetH + 0.04, 0);
    copingGeos.push(copingCapW);

    const copingCapE = new THREE.BoxGeometry(parapetThick + 0.1, 0.08, slabD + 0.1);
    copingCapE.translate(30 - parapetThick / 2, roofY + parapetH + 0.04, 0);
    copingGeos.push(copingCapE);

    const copingMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(copingGeos), this.finMat);
    this.roofGroup.add(copingMesh);

    // Stainless Steel Lightning Rod Masts at Parapet Corners
    const mastGeo = new THREE.CylinderGeometry(0.02, 0.035, 2.6, 8);
    const mastCorners = [
      { x: -29.8, z: 23.8 }, { x: 29.8, z: 23.8 },
      { x: -29.8, z: -23.8 }, { x: 29.8, z: -23.8 }
    ];
    mastCorners.forEach(mc => {
      const mast = new THREE.Mesh(mastGeo, this.mullionMat);
      mast.position.set(mc.x, roofY + parapetH + 1.3, mc.z);
      this.roofGroup.add(mast);
    });

    // Solid Structural Reinforced Concrete Roof Slab
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.45, slabD), this.concreteMat);
    roofSlab.position.set(0, roofY + 0.225, 0);
    roofSlab.receiveShadow = true;
    this.roofGroup.add(roofSlab);

    // 2. Main Waterproofed Roof Membrane Deck
    const roofDeckGeo = new THREE.PlaneGeometry(slabW - 0.7, slabD - 0.7);
    const roofDeck = new THREE.Mesh(roofDeckGeo, this.roofMembraneMat);
    roofDeck.rotation.x = -Math.PI / 2;
    roofDeck.position.set(0, roofY + 0.455, 0);
    roofDeck.receiveShadow = true;
    this.roofGroup.add(roofDeck);

    // 3. Central Architectural Mechanical Penthouse
    const phW = 22;
    const phD = 14;
    const phH = 4.2;

    // Heavy Concrete Mounting Curb underneath Penthouse in dark architectural slate
    const phCurb = new THREE.Mesh(new THREE.BoxGeometry(phW + 0.6, 0.45, phD + 0.6), this.columnMat);
    phCurb.position.set(-6, roofY + 0.4, -4);
    phCurb.receiveShadow = true;
    this.roofGroup.add(phCurb);

    const phBodyGeo = new THREE.BoxGeometry(phW, phH, phD);
    const phMesh = new THREE.Mesh(phBodyGeo, this.spandrelMat);
    phMesh.position.set(-6, roofY + phH / 2 + 0.45, -4);
    phMesh.castShadow = true;
    phMesh.receiveShadow = true;
    this.roofGroup.add(phMesh);

    // Acoustic Metal Louver Panels on Penthouse Exterior
    const louverS = new THREE.Mesh(new THREE.PlaneGeometry(phW - 2, phH - 1.2), this.louverMat);
    louverS.position.set(-6, roofY + phH / 2 + 0.45, -4 + phD / 2 + 0.02);
    this.roofGroup.add(louverS);

    const louverN = new THREE.Mesh(new THREE.PlaneGeometry(phW - 2, phH - 1.2), this.louverMat);
    louverN.rotation.y = Math.PI;
    louverN.position.set(-6, roofY + phH / 2 + 0.45, -4 - phD / 2 - 0.02);
    this.roofGroup.add(louverN);

    // 4. Dual Industrial Rooftop Package Chillers with Heavy Plinths & Rotating Axial Fans
    const chillerPositions = [
      { x: 12, z: -12 },
      { x: 12, z: -3 }
    ];

    chillerPositions.forEach(cp => {
      // Concrete Chiller Mounting Plinth in dark architectural slate
      const cPlinth = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.45, 4.4), this.columnMat);
      cPlinth.position.set(cp.x, roofY + 0.4, cp.z);
      cPlinth.receiveShadow = true;
      this.roofGroup.add(cPlinth);

      const chBody = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.2, 3.6), this.hvacUnitMat);
      chBody.position.set(cp.x, roofY + 1.1 + 0.45, cp.z);
      chBody.castShadow = true;
      chBody.receiveShadow = true;
      this.roofGroup.add(chBody);

      // Louver grilles along chiller sides
      const chLouver = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.8), this.louverMat);
      chLouver.position.set(cp.x, roofY + 1.1 + 0.45, cp.z + 1.82);
      this.roofGroup.add(chLouver);

      // Rotating Twin Axial Ventilation Fans
      for (const fx of [-1.5, 1.5]) {
        const fanCowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.85, 0.85, 0.4, 16),
          this.columnMat
        );
        fanCowl.position.set(cp.x + fx, roofY + 2.4 + 0.45, cp.z);
        this.roofGroup.add(fanCowl);

        const fanBlade = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.05, 0.22),
          this.finMat
        );
        fanBlade.position.set(cp.x + fx, roofY + 2.5 + 0.45, cp.z);
        this.roofGroup.add(fanBlade);

        this.hvacFans.push({
          mesh: fanBlade,
          speed: 8.5 + fx * 1.5
        });
      }
    });

    // 5. Galvanized Roof Maintenance Walkway Grating Paths
    const walkwayGeos = [];
    const ww1 = new THREE.BoxGeometry(1.2, 0.03, 18);
    ww1.translate(5.8, roofY + 0.47, -7);
    walkwayGeos.push(ww1);

    const ww2 = new THREE.BoxGeometry(14, 0.03, 1.2);
    ww2.translate(13, roofY + 0.47, 6);
    walkwayGeos.push(ww2);

    const wwMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(walkwayGeos), this.walkwayGratingMat);
    wwMesh.receiveShadow = true;
    this.roofGroup.add(wwMesh);

    // 6. Rooftop Helipad
    const heliX = 14;
    const heliZ = 12;
    const heliRadius = 7.8;

    const padOctagon = new THREE.CylinderGeometry(heliRadius, heliRadius, 0.16, 8);
    const padMesh = new THREE.Mesh(padOctagon, this.concreteMat);
    padMesh.position.set(heliX, roofY + 0.54, heliZ);
    padMesh.receiveShadow = true;
    this.roofGroup.add(padMesh);

    // Circular Luminous Touchdown Perimeter Ring
    const ringGeo = new THREE.RingGeometry(heliRadius - 1.2, heliRadius - 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffea00, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(heliX, roofY + 0.63, heliZ);
    this.roofGroup.add(ringMesh);

    // Giant 'H' Landing Identification Marker in Shaded Titanium
    const barGeoV = new THREE.PlaneGeometry(0.7, 4.4);
    const barGeoH = new THREE.PlaneGeometry(2.4, 0.7);
    const hMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.65, metalness: 0.05, side: THREE.DoubleSide });

    const hBarL = new THREE.Mesh(barGeoV, hMat);
    hBarL.rotation.x = -Math.PI / 2;
    hBarL.position.set(heliX - 1.2, roofY + 0.635, heliZ);
    this.roofGroup.add(hBarL);

    const hBarR = new THREE.Mesh(barGeoV, hMat);
    hBarR.rotation.x = -Math.PI / 2;
    hBarR.position.set(heliX + 1.2, roofY + 0.635, heliZ);
    this.roofGroup.add(hBarR);

    const hBarM = new THREE.Mesh(barGeoH, hMat);
    hBarM.rotation.x = -Math.PI / 2;
    hBarM.position.set(heliX, roofY + 0.635, heliZ);
    this.roofGroup.add(hBarM);
  }

  buildHeroEntrance() {
    const entranceGroup = new THREE.Group();
    const portalH = 5.2;

    // 1. Massive Double-Height Architectural Portal Frame in Dark Granite
    const portalMat = this.columnMat;
    const lPillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, portalH, 1.4), portalMat);
    lPillar.position.set(-7, portalH / 2, 24.2);
    lPillar.castShadow = true;
    entranceGroup.add(lPillar);

    const rPillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, portalH, 1.4), portalMat);
    rPillar.position.set(7, portalH / 2, 24.2);
    rPillar.castShadow = true;
    entranceGroup.add(rPillar);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(15.4, 1.2, 1.4), portalMat);
    lintel.position.set(0, portalH - 0.6, 24.2);
    lintel.castShadow = true;
    entranceGroup.add(lintel);

    // 2. Backlit Building Identity Signage
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.55, 0.08),
      this.columnMat
    );
    signBoard.position.set(0, portalH - 0.6, 24.95);
    entranceGroup.add(signBoard);

    const signLuminous = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.38, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00d4e6,
        emissiveIntensity: 1.6,
        roughness: 0.2
      })
    );
    signLuminous.position.set(0, portalH - 0.6, 25.0);
    entranceGroup.add(signLuminous);

    // 3. Deep Cantilevered Entrance Canopy with Tension Tie Rods
    const canopyW = 16.0;
    const canopyD = 5.8;
    const canopyH = 0.25;

    const canopySlab = new THREE.Mesh(
      new THREE.BoxGeometry(canopyW, canopyH, canopyD),
      this.spandrelMat
    );
    canopySlab.position.set(0, 4.4, 24.2 + canopyD / 2);
    canopySlab.castShadow = true;
    canopySlab.receiveShadow = true;
    entranceGroup.add(canopySlab);

    // Stainless Steel Tension Rods anchoring Canopy
    const rodGeo = new THREE.CylinderGeometry(0.035, 0.035, 5.2, 12);
    rodGeo.rotateX(0.78);

    const rodL = new THREE.Mesh(rodGeo, this.bollardMat);
    rodL.position.set(-6.8, 6.2, 25.8);
    entranceGroup.add(rodL);

    const rodR = new THREE.Mesh(rodGeo, this.bollardMat);
    rodR.position.set(6.8, 6.2, 25.8);
    entranceGroup.add(rodR);

    // Underside Recessed LED Downlights
    for (let lx = -6.0; lx <= 6.0; lx += 3.0) {
      for (let lz = 25.5; lz <= 28.5; lz += 1.5) {
        const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16), this.downlightMat);
        spot.position.set(lx, 4.26, lz);
        entranceGroup.add(spot);
      }
    }

    // 4. Central Revolving Glass Entry Drum + Automated Sliding Doors
    const drumR = 1.4;
    const drumGeo = new THREE.CylinderGeometry(drumR, drumR, 3.4, 24, 1, true);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.08
    });
    const drumMesh = new THREE.Mesh(drumGeo, drumMat);
    drumMesh.position.set(0, 1.7, 24.2);
    entranceGroup.add(drumMesh);

    // Rotating 3-Wing Glass Leaves
    const wingGeo = new THREE.BoxGeometry(drumR - 0.05, 3.2, 0.04);
    for (let w = 0; w < 3; w++) {
      const wing = new THREE.Mesh(wingGeo, this.mullionMat);
      wing.rotation.y = (w * Math.PI * 2) / 3;
      wing.position.set(
        Math.cos((w * Math.PI * 2) / 3) * (drumR / 2),
        1.7,
        24.2 + Math.sin((w * Math.PI * 2) / 3) * (drumR / 2)
      );
      entranceGroup.add(wing);
    }

    // Flanking Automated Sliding Glass Doors
    const doorLeafGeo = new THREE.BoxGeometry(1.6, 3.4, 0.06);
    const doorL = new THREE.Mesh(doorLeafGeo, drumMat);
    doorL.position.set(-3.2, 1.7, 24.2);
    entranceGroup.add(doorL);

    const doorR = new THREE.Mesh(doorLeafGeo, drumMat);
    doorR.position.set(3.2, 1.7, 24.2);
    entranceGroup.add(doorR);

    // 5. Dark Charcoal Granite Entrance Threshold Apron
    const apronGeo = new THREE.BoxGeometry(14.0, 0.06, 6.5);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.25,
      metalness: 0.3
    });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(0, 0.03, 25.5);
    apron.receiveShadow = true;
    entranceGroup.add(apron);

    this.layers.architecture.add(entranceGroup);
  }

  buildGroundExits() {
    const exits = [
      {
        id: 'exit_west',
        name: 'EXIT A (WEST CORE)',
        x: -29.2,
        y: 0.0,
        z: 0.0,
        rotY: Math.PI / 2,
        musterX: -38,
        musterZ: 0,
        signMat: this.exitPortalSignMatWest
      },
      {
        id: 'exit_east',
        name: 'EXIT B (EAST CORE)',
        x: 29.2,
        y: 0.0,
        z: 0.0,
        rotY: -Math.PI / 2,
        musterX: 38,
        musterZ: 0,
        signMat: this.exitPortalSignMatEast
      },
      {
        id: 'exit_south',
        name: 'EXIT C (SOUTH PLAZA GATE)',
        x: 0.0,
        y: 0.0,
        z: 23.5,
        rotY: 0,
        musterX: 0,
        musterZ: 36,
        signMat: this.exitPortalSignMatSouth
      }
    ];

    const portalW = 3.6;
    const portalH = 3.4;
    const postThick = 0.38;

    exits.forEach(ex => {
      const exitGroup = new THREE.Group();
      exitGroup.position.set(ex.x, ex.y, ex.z);
      exitGroup.rotation.y = ex.rotY;

      // 1. Heavy Steel Portal Frame
      const postGeo = new THREE.BoxGeometry(postThick, portalH, postThick);
      const postL = new THREE.Mesh(postGeo, this.columnMat);
      postL.position.set(-portalW / 2 + postThick / 2, portalH / 2, 0);
      postL.castShadow = true;
      exitGroup.add(postL);

      const postR = new THREE.Mesh(postGeo, this.columnMat);
      postR.position.set(portalW / 2 - postThick / 2, portalH / 2, 0);
      postR.castShadow = true;
      exitGroup.add(postR);

      const lintelGeo = new THREE.BoxGeometry(portalW, postThick, postThick);
      const lintel = new THREE.Mesh(lintelGeo, this.columnMat);
      lintel.position.set(0, portalH - postThick / 2, 0);
      lintel.castShadow = true;
      exitGroup.add(lintel);

      // 2. High-Luminance Emergency Exit Portal Signboard
      const signGeo = new THREE.BoxGeometry(portalW - 0.2, 0.55, 0.12);
      const sign = new THREE.Mesh(signGeo, ex.signMat);
      sign.position.set(0, portalH + 0.32, 0.05);
      exitGroup.add(sign);

      // 3. Double Panic Fire Doors
      const doorW = (portalW - postThick * 2 - 0.08) / 2;
      const doorH = portalH - postThick - 0.06;
      const doorLeafGeo = new THREE.BoxGeometry(doorW, doorH, 0.08);

      const dLeft = new THREE.Mesh(doorLeafGeo, this.fireDoorRedMat);
      dLeft.position.set(-doorW / 2 - 0.02, doorH / 2 + 0.02, 0);
      exitGroup.add(dLeft);

      const dRight = new THREE.Mesh(doorLeafGeo, this.fireDoorRedMat);
      dRight.position.set(doorW / 2 + 0.02, doorH / 2 + 0.02, 0);
      exitGroup.add(dRight);

      // Panic Push Bars
      const barGeo = new THREE.BoxGeometry(doorW - 0.18, 0.08, 0.08);
      const barL = new THREE.Mesh(barGeo, this.panicBarGreenMat);
      barL.position.set(-doorW / 2 - 0.02, 1.05, 0.08);
      exitGroup.add(barL);

      const barR = new THREE.Mesh(barGeo, this.panicBarGreenMat);
      barR.position.set(doorW / 2 + 0.02, 1.05, 0.08);
      exitGroup.add(barR);

      this.layers.architecture.add(exitGroup);

      // 4. Circular Safety Muster Assembly Zone on Plaza
      const musterR = 5.2;
      const musterRingGeo = new THREE.RingGeometry(musterR - 0.45, musterR, 48);
      const musterRing = new THREE.Mesh(
        musterRingGeo,
        new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide })
      );
      musterRing.rotation.x = -Math.PI / 2;
      musterRing.position.set(ex.musterX, 0.02, ex.musterZ);
      this.layers.environment.add(musterRing);

      const innerZone = new THREE.Mesh(
        new THREE.CircleGeometry(musterR - 0.48, 36),
        new THREE.MeshBasicMaterial({ color: 0x059669, side: THREE.DoubleSide, transparent: true, opacity: 0.22 })
      );
      innerZone.rotation.x = -Math.PI / 2;
      innerZone.position.set(ex.musterX, 0.015, ex.musterZ);
      this.layers.environment.add(innerZone);

      // 5. High-Visibility Emergency Runway Guide Path
      const dist = Math.hypot(ex.musterX - ex.x, ex.musterZ - ex.z);
      const runwayW = 2.4;
      const runwayGeo = new THREE.PlaneGeometry(
        ex.id === 'exit_south' ? runwayW : dist,
        ex.id === 'exit_south' ? dist : runwayW
      );
      const runway = new THREE.Mesh(runwayGeo, this.exitRunwayMat);
      runway.rotation.x = -Math.PI / 2;
      runway.position.set((ex.x + ex.musterX) / 2, 0.02, (ex.z + ex.musterZ) / 2);
      this.layers.environment.add(runway);

      // Runway Edge Lines
      const edgeGeo = new THREE.PlaneGeometry(
        ex.id === 'exit_south' ? 0.08 : dist,
        ex.id === 'exit_south' ? dist : 0.08
      );
      const edge1 = new THREE.Mesh(edgeGeo, new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      const edge2 = new THREE.Mesh(edgeGeo, new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      edge1.rotation.x = -Math.PI / 2;
      edge2.rotation.x = -Math.PI / 2;

      if (ex.id === 'exit_south') {
        edge1.position.set(ex.x - runwayW / 2, 0.025, (ex.z + ex.musterZ) / 2);
        edge2.position.set(ex.x + runwayW / 2, 0.025, (ex.z + ex.musterZ) / 2);
      } else {
        edge1.position.set((ex.x + ex.musterX) / 2, 0.025, ex.z - runwayW / 2);
        edge2.position.set((ex.x + ex.musterX) / 2, 0.025, ex.z + runwayW / 2);
      }
      this.layers.environment.add(edge1);
      this.layers.environment.add(edge2);
    });
  }

  // === Digital Twin Presentation Modes & Layer Filters ===
  getElevatorStatus() {
    if (!this.elevatorCars || this.elevatorCars.length === 0) {
      return [
        { shaft: 'Shaft A (West)', floor: '07', dest: '01', direction: 'Moving ↓' },
        { shaft: 'Shaft B (Center)', floor: '03', dest: '10', direction: 'Moving ↑' },
        { shaft: 'Shaft C (East)', floor: '05', dest: '01', direction: 'Moving ↓' }
      ];
    }
    const shaftNames = ['Shaft A (West)', 'Shaft B (Center)', 'Shaft C (East)'];
    return this.elevatorCars.map((car, idx) => {
      const currentFloor = Math.min(10, Math.max(1, Math.round(car.y / this.floorHeight) + 1));
      const destFloor = car.direction > 0 ? 10 : 1;
      return {
        shaft: shaftNames[idx] || `Shaft ${String.fromCharCode(65 + idx)}`,
        floor: currentFloor < 10 ? `0${currentFloor}` : `${currentFloor}`,
        dest: destFloor < 10 ? `0${destFloor}` : `${destFloor}`,
        direction: car.direction > 0 ? 'Moving ↑' : 'Moving ↓'
      };
    });
  }

  setViewMode(mode) {
    this.viewMode = mode;

    if (mode === 'FULL_EXTERIOR') {
      this.facadeMode = 'FULL';
      this.glassExteriorMat.opacity = 0.72;
      this.updateFacadeCutaway();
    } else if (mode === 'TRANSPARENT_FACADE') {
      this.facadeMode = 'FULL';
      this.glassExteriorMat.opacity = 0.22;
      this.updateFacadeCutaway();
    } else if (mode === 'CUTAWAY') {
      this.facadeMode = 'CUTAWAY';
      this.updateFacadeCutaway();
    } else if (mode === 'SECTIONAL_CUT') {
      this.facadeMode = 'CUTAWAY';
      this.updateFacadeCutaway();
    } else if (mode === 'EXPLODED') {
      this.setFloorMode('EXPLODED');
    }
    return this.viewMode;
  }

  setLayerVisibility(layerName, isVisible) {
    if (this.layers[layerName]) {
      this.layers[layerName].visible = isVisible;
    }
  }

  toggleFacadeMode() {
    if (this.facadeMode === 'CUTAWAY') {
      this.facadeMode = 'FULL';
      this.viewMode = 'FULL_EXTERIOR';
      this.targetCutawayProgress = 0.0;
    } else {
      this.facadeMode = 'CUTAWAY';
      this.viewMode = 'CUTAWAY';
      this.targetCutawayProgress = 1.0;
    }
    this.updateFacadeCutaway();
    return this.facadeMode;
  }

  setFacadeMode(mode) {
    this.facadeMode = mode;
    if (mode === 'FULL') {
      this.targetCutawayProgress = 0.0;
    } else {
      this.targetCutawayProgress = 1.0;
    }
    this.updateFacadeCutaway();
  }

  updateFacadeCutaway() {
    const isShowingFacade = (this.facadeMode === 'FULL' || this.facadeMode === 'TRANSPARENT');
    if (!this.facadeCutawayGroup) return;

    const activeMode = this.floorMode || 'ALL';
    this.facadeCutawayGroup.children.forEach(sub => {
      const fl = sub.userData && sub.userData.floor ? sub.userData.floor : 1;
      if (activeMode === 'ALL' || activeMode === 'EXPLODED') {
        sub.visible = isShowingFacade;
      } else {
        const targetFloor = parseInt(activeMode, 10);
        sub.visible = isShowingFacade && (fl === targetFloor);
      }
    });


  }

  applyCutawayTransition(t) {
    // t: 0.0 (Full Exterior) to 1.0 (Cutaway)
    const fade = 1.0 - t;
    if (this.glassExteriorMat) {
      this.glassExteriorMat.opacity = 0.72 * fade;
    }
    if (this.facadeCutawayGroup) {
      this.facadeCutawayGroup.visible = t < 0.98;
    }

    if (t <= 0.02) {
      if (this.facadeCutawayGroup) this.facadeCutawayGroup.visible = true;
      if (this.glassExteriorMat) this.glassExteriorMat.opacity = 0.72;
    }
  }

    setFloorMode(mode) {
    this.floorMode = mode;

    for (let f = 1; f <= this.totalFloors; f++) {
      const group = this.floorGroups[f];

      if (mode === 'ALL') {
        group.visible = true;
        group.position.y = 0;
        this.roofGroup.visible = true;
        this.roofGroup.position.y = 0;
      } else if (mode === 'EXPLODED') {
        group.visible = true;
        group.position.y = (f - 1) * 5.0;
        this.roofGroup.visible = true;
        this.roofGroup.position.y = (this.totalFloors - 1) * 5.0;
      } else {
        const targetFloor = parseInt(mode, 10);
        group.visible = (f === targetFloor);
        group.position.y = 0;
        this.roofGroup.visible = false;
      }
    }

    if (this.facadeCutawayGroup) {
      const isShowingFacade = (this.facadeMode === 'FULL' || this.facadeMode === 'TRANSPARENT');
      this.facadeCutawayGroup.children.forEach(sub => {
        const fl = (sub.userData && sub.userData.floor !== undefined) ? sub.userData.floor : 1;

        if (mode === 'ALL') {
          sub.visible = isShowingFacade;
          sub.position.y = 0;
        } else if (mode === 'EXPLODED') {
          sub.visible = isShowingFacade;
          sub.position.y = (fl - 1) * 5.0;
        } else {
          const targetFloor = parseInt(mode, 10);
          sub.visible = isShowingFacade && (fl === targetFloor);
          sub.position.y = 0;
        }
      });
    }
  }

  update(delta) {
    // Smooth Animated Cutaway Fade Transition
    if (this.cutawayProgress !== this.targetCutawayProgress) {
      const step = delta * 3.2; // ~0.3s smooth transition
      if (this.targetCutawayProgress > this.cutawayProgress) {
        this.cutawayProgress = Math.min(this.targetCutawayProgress, this.cutawayProgress + step);
      } else {
        this.cutawayProgress = Math.max(this.targetCutawayProgress, this.cutawayProgress - step);
      }
      this.applyCutawayTransition(this.cutawayProgress);
    }

    if (this.elevatorCars && this.elevatorCars.length > 0) {
      this.elevatorCars.forEach(car => {
        car.y += car.speed * car.direction * delta;
        if (car.y >= car.maxY) {
          car.y = car.maxY;
          car.direction = -1;
        } else if (car.y <= car.minY) {
          car.y = car.minY;
          car.direction = 1;
        }
        car.mesh.position.y = car.y;
      });
    }

    if (this.hvacFans && this.hvacFans.length > 0) {
      this.hvacFans.forEach(fan => {
        fan.mesh.rotation.y += fan.speed * delta;
      });
    }
  }

buildFloorFurnishingsInstanced(group, floorNum, baseY) {
    const dummy = new THREE.Object3D();

    const buckets = {
      workstationDesks: [],
      acousticDividers: [],
      taskChairsMesh: [],
      taskChairsLeather: [],
      monitors: [],
      displaysCyan: [],
      displaysOrange: [],
      confTablesWood: [],
      confTablesEspresso: [],
      sectionalSofasSlate: [],
      sectionalSofasSand: [],
      coffeeTables: [],
      areaRugsSlate: [],
      areaRugsCream: [],
      indoorPlantPots: [],
      indoorPlantFoliage: [],
      wallTvs: [],
      wallTvScreensCyan: [],
      wallTvScreensOrange: [],
      whiteboards: []
    };

    const roomCentersX = [-19.5, -10.5, -1.5, 8.5, 19.0];

    const addChair = (x, y, z, rotY, isCognac) => {
      if (isCognac) {
        buckets.taskChairsLeather.push({ pos: [x, y, z], rotY });
      } else {
        buckets.taskChairsMesh.push({ pos: [x, y, z], rotY });
      }
    };

    const addMonitor = (x, y, z, rotY, isOrange) => {
      buckets.monitors.push({ pos: [x, y, z], rotY });
      const sin = Math.sin(rotY);
      const cos = Math.cos(rotY);
      const dispX = x + sin * 0.012;
      const dispZ = z + cos * 0.012;
      if (isOrange) {
        buckets.displaysOrange.push({ pos: [dispX, y, dispZ], rotY });
      } else {
        buckets.displaysCyan.push({ pos: [dispX, y, dispZ], rotY });
      }
    };

    const addPlant = (x, z) => {
      buckets.indoorPlantPots.push({ pos: [x, baseY, z], rotY: 0 });
      buckets.indoorPlantFoliage.push({ pos: [x, baseY, z], rotY: 0 });
    };

    const getRoomRightWallX = (cx) => {
      if (cx <= -15.0) return -15.0 - 0.20;
      if (cx <= -6.0)  return -6.0 - 0.20;
      if (cx <= 3.0)   return 3.0 - 0.20;
      if (cx <= 14.0)  return 14.0 - 0.20;
      return 24.5 - 0.25;
    };

    const addWallTv = (cx, cz, isOrange) => {
      const sideWallX = getRoomRightWallX(cx);
      const rotY = -Math.PI / 2;
      buckets.wallTvs.push({ pos: [sideWallX, baseY + 1.95, cz], rotY });
      const scrX = sideWallX - 0.03;
      if (isOrange) {
        buckets.wallTvScreensOrange.push({ pos: [scrX, baseY + 1.95, cz], rotY });
      } else {
        buckets.wallTvScreensCyan.push({ pos: [scrX, baseY + 1.95, cz], rotY });
      }
    };

    // 10 Rooms per floor: 0-4 (North Wing z=-12.5), 5-9 (South Wing z=12.5)
    for (let i = 0; i < 10; i++) {
      const roomIdx = i;
      const cx = roomCentersX[i % 5];
      const cz = i < 5 ? -12.5 : 12.5;
      const type = getRoomFurnishingType(floorNum, roomIdx);

      switch (type) {
        case 'TECH_WORKSTATIONS': {
          const backSign = cz > 0 ? 1 : -1;
          // 2 Clean, Spacious 2-person workstation pods (total 4 desks per room)
          // Wide 2.4m central walking aisle directly connecting to doorway!
          // 1.6m perimeter clearance to side walls!
          const pods = [
            { px: cx - 2.2, pz: cz + 1.5 * backSign },
            { px: cx + 2.2, pz: cz + 1.5 * backSign }
          ];

          pods.forEach((pod, podIdx) => {
            // Desk 1 (Front): faces into the desk
            const d1Z = pod.pz - 0.42 * backSign;
            buckets.workstationDesks.push({ pos: [pod.px, baseY, d1Z], rotY: 0 });

            // Chair 1: placed 0.62m away, facing desk squarely
            const c1RotY = backSign > 0 ? 0 : Math.PI;
            const c1Z = d1Z - 0.62 * backSign;
            addChair(pod.px, baseY, c1Z, c1RotY, false);

            // Monitor 1: on desk facing Chair 1
            const m1RotY = backSign > 0 ? 0 : Math.PI;
            addMonitor(pod.px, baseY + 0.74, d1Z, m1RotY, false);

            // Desk 2 (Rear): opposite desk in the pod
            const d2Z = pod.pz + 0.42 * backSign;
            buckets.workstationDesks.push({ pos: [pod.px, baseY, d2Z], rotY: 0 });

            // Chair 2: placed 0.62m away facing Desk 2
            const c2RotY = backSign > 0 ? Math.PI : 0;
            const c2Z = d2Z + 0.62 * backSign;
            addChair(pod.px, baseY, c2Z, c2RotY, false);

            // Monitor 2: on desk facing Chair 2
            const m2RotY = backSign > 0 ? Math.PI : 0;
            addMonitor(pod.px, baseY + 0.74, d2Z, m2RotY, podIdx % 2 === 1);
          });

          // Breakout architectural plant in rear zone
          addPlant(cx, cz - 4.2 * backSign);
          break;
        }

        case 'CONFERENCE_BOARDROOM':
        case 'PRESIDENTIAL_BOARDROOM': {
          const isPres = type === 'PRESIDENTIAL_BOARDROOM';
          if (isPres) {
            buckets.confTablesEspresso.push({ pos: [cx, baseY, cz], rotY: 0 });
          } else {
            buckets.confTablesWood.push({ pos: [cx, baseY, cz], rotY: 0 });
          }

          // 6 Executive Cognac Leather Chairs evenly spaced
          [-1.2, 0, 1.2].forEach(dx => {
            addChair(cx + dx, baseY, cz - 0.85, 0, true);
            addChair(cx + dx, baseY, cz + 0.85, Math.PI, true);
          });

          addWallTv(cx, cz, false);
          addPlant(cx - 3.2, cz + 2.0);
          break;
        }

        case 'EXECUTIVE_OFFICE': {
          // Executive Desk & Chair
          buckets.confTablesEspresso.push({ pos: [cx, baseY, cz - 1.0], rotY: 0, scale: [0.55, 1.0, 0.65] });
          addChair(cx, baseY, cz - 1.65, 0, true);
          addMonitor(cx, baseY + 0.74, cz - 1.0, 0, false);

          // 2 Visitor Chairs in front of desk
          addChair(cx - 0.75, baseY, cz - 0.35, Math.PI, false);
          addChair(cx + 0.75, baseY, cz - 0.35, Math.PI, false);

          addWallTv(cx, cz, true);
          addPlant(cx + 2.8, cz - 1.8);
          break;
        }

        case 'RECEPTION_LOBBY': {
          // Reception Desk
          buckets.workstationDesks.push({ pos: [cx, baseY, cz - 0.1], rotY: 0, scale: [1.2, 1, 1] });
          addChair(cx, baseY, cz - 0.50, 0, false);
          addMonitor(cx, baseY + 0.74, cz - 0.1, 0, false);

          // Waiting Lounge on side
          buckets.sectionalSofasSlate.push({ pos: [cx - 2.2, baseY, cz + 1.2], rotY: Math.PI * 0.15, scale: [0.75, 1, 1] });
          buckets.coffeeTables.push({ pos: [cx - 1.4, baseY, cz + 1.2], rotY: 0, scale: [0.7, 1, 0.7] });
          addPlant(cx + 2.6, cz + 1.4);
          break;
        }

        case 'CAFE_LOUNGE': {
          const backSign = cz > 0 ? 1 : -1;
          // 2 widely spaced cafe groupings
          [1.5 * backSign, -2.5 * backSign].forEach(dz => {
            buckets.coffeeTables.push({ pos: [cx, baseY, cz + dz], rotY: 0, scale: [0.8, 1.2, 0.8] });
            addChair(cx - 1.8, baseY, cz + dz, 0, false);
            addChair(cx + 1.8, baseY, cz + dz, Math.PI, false);
          });
          addPlant(cx + 3.0, cz);
          break;
        }

        case 'LUXURY_PENTHOUSE_LIVING':
        case 'LIVING_LOUNGE': {
          const isPent = type === 'LUXURY_PENTHOUSE_LIVING';
          if (isPent) {
            buckets.areaRugsCream.push({ pos: [cx, baseY + 0.015, cz], rotY: 0 });
            buckets.sectionalSofasSand.push({ pos: [cx, baseY, cz + 1.10], rotY: Math.PI });
          } else {
            buckets.areaRugsSlate.push({ pos: [cx, baseY + 0.015, cz], rotY: 0 });
            buckets.sectionalSofasSlate.push({ pos: [cx, baseY, cz + 1.10], rotY: Math.PI });
          }

          buckets.coffeeTables.push({ pos: [cx, baseY, cz], rotY: 0 });
          addChair(cx - 1.6, baseY, cz - 0.10, Math.PI * 0.45, true);
          addChair(cx + 1.6, baseY, cz - 0.10, -Math.PI * 0.45, true);

          addWallTv(cx, cz, true);
          addPlant(cx + 3.0, cz - 2.0);
          break;
        }

        default:
          break;
      }
    }

    const mapMesh = (items, geo, mat) => {
      if (!geo || !mat || !items || items.length === 0) return;
      const count = items.length;
      const instMesh = new THREE.InstancedMesh(geo, mat, count);
      for (let idx = 0; idx < count; idx++) {
        const it = items[idx];
        dummy.position.set(it.pos[0], it.pos[1], it.pos[2]);
        dummy.rotation.set(0, it.rotY || 0, 0);
        if (it.scale) {
          dummy.scale.set(it.scale[0], it.scale[1], it.scale[2]);
        } else {
          dummy.scale.set(1, 1, 1);
        }
        dummy.updateMatrix();
        instMesh.setMatrixAt(idx, dummy.matrix);
      }
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.computeBoundingSphere();
      instMesh.matrixAutoUpdate = false;
      instMesh.updateMatrix();
      group.add(instMesh);
    };

    mapMesh(buckets.workstationDesks, this.workstationDesksGeo, this.deskTopWhiteMat);
    mapMesh(buckets.acousticDividers, this.acousticDividerGeo, this.acousticDividerMat);
    mapMesh(buckets.taskChairsMesh, this.taskChairGeo, this.chairMeshMat);
    mapMesh(buckets.taskChairsLeather, this.taskChairGeo, this.chairLeatherCognacMat);
    mapMesh(buckets.monitors, this.monitorFrameGeo, this.screenBezelMat);
    mapMesh(buckets.displaysCyan, this.monitorDisplayGeo, this.screenDisplayCyanMat);
    mapMesh(buckets.displaysOrange, this.monitorDisplayGeo, this.screenDisplayOrangeMat);
    mapMesh(buckets.confTablesWood, this.confTableGeo, this.tableWoodMat);
    mapMesh(buckets.confTablesEspresso, this.confTableGeo, this.coffeeTableEspressoMat);
    mapMesh(buckets.sectionalSofasSlate, this.sectionalSofaGeo, this.sofaFabricSlateMat);
    mapMesh(buckets.sectionalSofasSand, this.sectionalSofaGeo, this.sofaFabricSandMat);
    mapMesh(buckets.coffeeTables, this.coffeeTableGeo, this.coffeeTableEspressoMat);
    mapMesh(buckets.areaRugsSlate, this.areaRugGeo, this.areaRugMat);
    mapMesh(buckets.areaRugsCream, this.areaRugGeo, this.areaRugCreamMat);
    mapMesh(buckets.indoorPlantPots, this.indoorPlantPotGeo, this.plantPotMat);
    mapMesh(buckets.indoorPlantFoliage, this.indoorPlantFoliageGeo, this.plantLeafMat);
    mapMesh(buckets.wallTvs, this.wallTvFrameGeo, this.screenBezelMat);
    mapMesh(buckets.wallTvScreensCyan, this.wallTvScreenGeo, this.screenDisplayCyanMat);
    mapMesh(buckets.wallTvScreensOrange, this.wallTvScreenGeo, this.screenDisplayOrangeMat);
    mapMesh(buckets.whiteboards, this.wallTvFrameGeo, this.whiteboardMat);
  }
}
