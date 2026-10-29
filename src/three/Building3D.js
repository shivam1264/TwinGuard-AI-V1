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
    this.facadeMode = 'CUTAWAY'; // 'CUTAWAY' or 'FULL'

    this.floorGroups = {};
    for (let f = 1; f <= this.totalFloors; f++) {
      this.floorGroups[f] = new THREE.Group();
      this.group.add(this.floorGroups[f]);
    }

    this.stairsGroup = new THREE.Group();
    this.elevatorGroup = new THREE.Group();
    this.roofGroup = new THREE.Group();
    this.facadeCutawayGroup = new THREE.Group();

    this.group.add(this.stairsGroup);
    this.group.add(this.elevatorGroup);
    this.group.add(this.roofGroup);
    this.group.add(this.facadeCutawayGroup);

    // === High-Performance Shared Architectural Materials (Zero Texture Flush) ===

    // 1. Crisp Matte White Architectural Dividing Walls
    this.whiteWallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05
    });

    // 2. Warm Architectural Honey Oak Fluted Slat Accent Back Walls
    this.flutedWoodTex = TextureHelper.createFlutedWoodTexture();
    this.woodAccentWallMat = new THREE.MeshStandardMaterial({
      map: this.flutedWoodTex,
      roughness: 0.55,
      metalness: 0.05
    });

    // 3. Dark Charcoal / Black Structural Columns & Framing
    this.columnMat = new THREE.MeshStandardMaterial({
      color: 0x1f2733,
      roughness: 0.45,
      metalness: 0.35
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

    // Acoustic False Ceiling Tile Material
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

    // 7. Glowing Recessed Ceiling Light Fixtures
    this.ceilingLightMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      emissive: 0xfff5ea,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });

    // Sleek Recessed Continuous Linear LED Light Strips
    this.linearLightMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf0,
      emissive: 0xfffbf0,
      emissiveIntensity: 1.6,
      roughness: 0.1
    });

    // Recessed Circular Ceiling Downlight Pucks
    this.downlightMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      emissive: 0xfff5ea,
      emissiveIntensity: 1.8,
      roughness: 0.2
    });

    // 8. Minimalist Architectural Timber Tables
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

    // 9. Black Architectural Balustrades & Railings
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

    this.mullionMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.3
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

    // === Ultra-High-Visibility Emergency Exit Portal Textures & Materials ===
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

    // High-Visibility Industrial Fire Safety Red Doors
    this.fireDoorRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.35,
      metalness: 0.2
    });

    // Panic Push Crash Hardware
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

    // Hazard Caution Striped Threshold Plate
    this.hazardPlateMat = new THREE.MeshStandardMaterial({
      map: this.hazardStripesTex,
      roughness: 0.4,
      metalness: 0.3
    });

    // Door Warning Decal Badge
    this.fireDoorDecalMat = new THREE.MeshStandardMaterial({
      map: this.fireDoorSignTex,
      roughness: 0.3,
      metalness: 0.1
    });

    // Evacuation Runway to Assembly Muster Zone
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

    // === Shared Specialized Furniture & Decor Materials ===
    this.deskTopWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.05
    });

    this.deskTopDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.1
    });

    this.chairMeshMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Obsidian ergonomic mesh chair
      roughness: 0.65,
      metalness: 0.1
    });

    this.chairLeatherCognacMat = new THREE.MeshStandardMaterial({
      color: 0x6b3614, // Warm executive cognac leather
      roughness: 0.35,
      metalness: 0.1
    });

    this.chairChromeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.85
    });

    this.screenBezelMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.3,
      metalness: 0.8
    });

    this.screenDisplayCyanMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // High-tech cyan IDE/dashboard glow
      side: THREE.DoubleSide
    });

    this.screenDisplayOrangeMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Living room OLED cinema warm glow
      side: THREE.DoubleSide
    });

    this.acousticDividerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant cyan/blue acoustic desk screen
      roughness: 0.8,
      metalness: 0.05
    });

    this.sofaFabricSlateMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate grey sectional couch
      roughness: 0.75,
      metalness: 0.05
    });

    this.sofaFabricSandMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Luxury camel/amber velvet
      roughness: 0.65,
      metalness: 0.05
    });

    this.coffeeTableEspressoMat = new THREE.MeshStandardMaterial({
      color: 0x26150b, // Dark espresso walnut
      roughness: 0.3,
      metalness: 0.1
    });

    this.areaRugMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Soft floor rug
      roughness: 0.9,
      metalness: 0.02
    });

    this.areaRugCreamMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Cream modern Scandinavian rug
      roughness: 0.9,
      metalness: 0.02
    });

    this.plantLeafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Lush tropical botanical emerald green
      roughness: 0.45,
      metalness: 0.05
    });

    this.plantPotMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pristine Scandinavian architectural ceramic
      roughness: 0.28,
      metalness: 0.08
    });

    this.whiteboardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1
    });

    // === High-Performance Pre-Merged Geometries (Zero Lag / Ultra Low Draw Calls) ===
    // 1. Task Chair (Base + Stem + Seat + Back merged into 1 geometry)
    const baseG = new THREE.CylinderGeometry(0.26, 0.26, 0.03, 8);
    baseG.translate(0, 0.02, 0);
    const stemG = new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8);
    stemG.translate(0, 0.22, 0);
    const seatG = new THREE.BoxGeometry(0.52, 0.07, 0.50);
    seatG.translate(0, 0.45, 0);
    const backG = new THREE.BoxGeometry(0.48, 0.52, 0.06);
    backG.translate(0, 0.72, -0.22);
    this.taskChairGeo = BufferGeometryUtils.mergeGeometries([baseG, stemG, seatG, backG]);

    // 2. Dual Workstation Desks (Tops + Legs merged into 1 geometry)
    const dTop1 = new THREE.BoxGeometry(1.8, 0.06, 0.9);
    dTop1.translate(0, 0.76, -0.48);
    const dTop2 = new THREE.BoxGeometry(1.8, 0.06, 0.9);
    dTop2.translate(0, 0.76, 0.48);
    const dLeg1 = new THREE.BoxGeometry(0.06, 0.74, 0.86);
    dLeg1.translate(-0.85, 0.38, -0.48);
    const dLeg2 = new THREE.BoxGeometry(0.06, 0.74, 0.86);
    dLeg2.translate(0.85, 0.38, -0.48);
    const dLeg3 = new THREE.BoxGeometry(0.06, 0.74, 0.86);
    dLeg3.translate(-0.85, 0.38, 0.48);
    const dLeg4 = new THREE.BoxGeometry(0.06, 0.74, 0.86);
    dLeg4.translate(0.85, 0.38, 0.48);
    this.workstationDesksGeo = BufferGeometryUtils.mergeGeometries([dTop1, dTop2, dLeg1, dLeg2, dLeg3, dLeg4]);

    // 3. Acoustic Divider
    this.acousticDividerGeo = new THREE.BoxGeometry(1.8, 0.38, 0.035);

    // 4. Desktop Monitor (Base + Stem + Frame merged)
    const mBase = new THREE.BoxGeometry(0.24, 0.02, 0.16);
    mBase.translate(0, 0.01, 0);
    const mStem = new THREE.BoxGeometry(0.04, 0.20, 0.04);
    mStem.translate(0, 0.11, 0);
    const mFrame = new THREE.BoxGeometry(0.68, 0.38, 0.02);
    mFrame.translate(0, 0.30, 0);
    this.monitorFrameGeo = BufferGeometryUtils.mergeGeometries([mBase, mStem, mFrame]);

    this.monitorDisplayGeo = new THREE.PlaneGeometry(0.64, 0.34);

    // 5. Sectional Plush Sofa (Main Seat + Back + Arm + Chaise + Armchair merged)
    const sSeat = new THREE.BoxGeometry(2.4, 0.36, 0.95);
    sSeat.translate(-0.3, 0.18, -0.55);
    const sBack = new THREE.BoxGeometry(2.4, 0.54, 0.26);
    sBack.translate(-0.3, 0.45, -0.95);
    const sArm = new THREE.BoxGeometry(0.22, 0.46, 0.95);
    sArm.translate(-1.55, 0.35, -0.55);
    const sChaise = new THREE.BoxGeometry(0.95, 0.36, 1.45);
    sChaise.translate(1.40, 0.18, 0.15);
    const sArmchair = new THREE.BoxGeometry(0.88, 0.34, 0.85);
    sArmchair.translate(-1.45, 0.17, 0.85);
    this.sectionalSofaGeo = BufferGeometryUtils.mergeGeometries([sSeat, sBack, sArm, sChaise, sArmchair]);

    // 6. Conference Table (Table top + 2 Pedestals merged)
    const cTop = new THREE.BoxGeometry(4.6, 0.08, 1.6);
    cTop.translate(0, 0.76, 0);
    const cPed1 = new THREE.CylinderGeometry(0.32, 0.42, 0.72, 12);
    cPed1.translate(-1.5, 0.37, 0);
    const cPed2 = new THREE.CylinderGeometry(0.32, 0.42, 0.72, 12);
    cPed2.translate(1.5, 0.37, 0);
    this.confTableGeo = BufferGeometryUtils.mergeGeometries([cTop, cPed1, cPed2]);

    // 7. Coffee Table & Rug
    this.coffeeTableGeo = new THREE.BoxGeometry(1.5, 0.34, 0.8);
    this.areaRugGeo = new THREE.BoxGeometry(4.2, 0.015, 3.2);

    // 8. Realistic Architectural Ceramic Planter Pot (Gamla)
    const potGeos = [];
    // Ceramic Tapered Pot Body
    const pBody = new THREE.CylinderGeometry(0.28, 0.20, 0.58, 20);
    pBody.translate(0, 0.38, 0);
    potGeos.push(pBody);

    // Architectural Lip Rim
    const pRim = new THREE.CylinderGeometry(0.30, 0.28, 0.05, 20);
    pRim.translate(0, 0.65, 0);
    potGeos.push(pRim);

    // Dark Potting Soil Bed
    const pSoil = new THREE.CylinderGeometry(0.27, 0.27, 0.04, 16);
    pSoil.translate(0, 0.63, 0);
    potGeos.push(pSoil);

    // Modern Tripod Stand Base (Ring + 3 Tapered Legs)
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

    // Realistic Multi-Leaf Tropical Foliage (Fiddle Leaf / Monstera Fronds)
    const foliageGeos = [];
    // Central Stems
    for (let st = 0; st < 6; st++) {
      const stAng = (st * Math.PI * 2) / 6 + 0.2;
      const stStem = new THREE.CylinderGeometry(0.012, 0.022, 0.52, 6);
      stStem.rotateZ(0.25);
      stStem.rotateY(stAng);
      stStem.translate(Math.cos(stAng) * 0.08, 0.84, Math.sin(stAng) * 0.08);
      foliageGeos.push(stStem);
    }

    // Arching Organic Fan Leaves (Radially dispersed with natural variation)
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

    // Center upright tender new leaf shoots
    const upShoot1 = new THREE.BoxGeometry(0.18, 0.012, 0.48);
    upShoot1.rotateX(0.22);
    upShoot1.rotateY(0.4);
    upShoot1.translate(0.04, 1.05, 0.04);
    foliageGeos.push(upShoot1);

    const upShoot2 = new THREE.BoxGeometry(0.16, 0.012, 0.42);
    upShoot2.rotateX(0.26);
    upShoot2.rotateY(3.4);
    upShoot2.translate(-0.04, 0.98, -0.04);
    foliageGeos.push(upShoot2);

    this.indoorPlantFoliageGeo = BufferGeometryUtils.mergeGeometries(foliageGeos);

    // 9. Wall OLED TV
    this.wallTvFrameGeo = new THREE.BoxGeometry(2.4, 1.25, 0.05);
    this.wallTvScreenGeo = new THREE.PlaneGeometry(2.32, 1.17);



    // Generate 100 Rooms Data
    this.roomsData = this.generateRoomsData();

    this.createEnvironment();
    this.buildAllFloors();
    this.buildStairwellCores();
    this.buildElevatorBank();
    this.buildRooftopHelipad();
    this.buildGroundExits();

    this.updateFacadeCutaway();
  }

  generateRoomsData() {
    const rooms = [];
    for (let floor = 1; floor <= this.totalFloors; floor++) {
      const theme = FLOOR_THEMES[floor];
      const floorBaseY = (floor - 1) * this.floorHeight;

      ROOM_TEMPLATES.forEach((tmpl, idx) => {
        const roomId = `f${floor}_${tmpl.idSuffix}`;
        const roomNumber = `${floor}${idx < 9 ? '0' + (idx + 1) : idx + 1}`;
        const roomName = `Rm ${roomNumber} • ${theme.prefix} ${tmpl.nameSuffix}`;

        rooms.push({
          id: roomId,
          floor,
          roomNumber,
          name: roomName,
          camId: `CAM-${floor}${idx < 9 ? '0' + (idx + 1) : idx + 1}`,
          color: floor >= 9 ? 0x9d4edd : (floor >= 5 ? 0x00f0ff : 0x00ff88),
          center: { x: tmpl.centerX, y: floorBaseY, z: tmpl.centerZ },
          bounds: { minX: tmpl.minX, maxX: tmpl.maxX, minZ: tmpl.minZ, maxZ: tmpl.maxZ },
          camPos: { x: tmpl.centerX - 6, y: floorBaseY + 4.5, z: tmpl.centerZ + 6 },
          camLookAt: { x: tmpl.centerX, y: floorBaseY + 1.0, z: tmpl.centerZ }
        });
      });
    }
    return rooms;
  }

  createEnvironment() {
    // 1. Expansive Manicured Green Lawn / Campus Grounds (360m x 360m)
    // Fades smoothly into the atmospheric distance fog
    const lawnGeo = new THREE.PlaneGeometry(360, 360);
    const lawn = new THREE.Mesh(lawnGeo, this.grassMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = -0.06;
    this.group.add(lawn);

    // 2. Central Multi-tone Architectural Granite Pedestrian Plaza
    // Sits at y = 0.02, bounds: 94m wide (x: -47 to +47) by 86m deep (z: -43 to +43)
    const plazaGeo = new THREE.PlaneGeometry(94, 86);
    const plaza = new THREE.Mesh(plazaGeo, this.plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    this.group.add(plaza);

    // 3. Elevated Building Podium Base (Foundation base in dark charcoal stone)
    const podiumGeo = new THREE.BoxGeometry(66, 0.28, 54);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
      metalness: 0.25
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(0, -0.12, 0);
    this.group.add(podium);

    // 4. Perimeter 2-Lane Bitumen Asphalt Ring Road (Encircles the entire plaza campus)
    // Road runs along South (z: 43 to 61), North (z: -43 to -61), West (x: -47 to -65), East (x: 47 to 65)
    const roadGeos = [];
    const roadThick = 0.08;
    const roadH = 18; // Road width (2 standard 3.5m lanes + shoulders = 18m)

    // South Road Section (Length 130m, Width 18m)
    const sRoad = new THREE.BoxGeometry(130, roadThick, roadH);
    sRoad.translate(0, -roadThick / 2 + 0.02, 52);
    roadGeos.push(sRoad);

    // North Road Section (Length 130m, Width 18m)
    const nRoad = new THREE.BoxGeometry(130, roadThick, roadH);
    nRoad.translate(0, -roadThick / 2 + 0.02, -52);
    roadGeos.push(nRoad);

    // West Road Section (Length 18m, Width 86m)
    const wRoad = new THREE.BoxGeometry(roadH, roadThick, 86);
    wRoad.translate(-56, -roadThick / 2 + 0.02, 0);
    roadGeos.push(wRoad);

    // East Road Section (Length 18m, Width 86m)
    const eRoad = new THREE.BoxGeometry(roadH, roadThick, 86);
    eRoad.translate(56, -roadThick / 2 + 0.02, 0);
    roadGeos.push(eRoad);

    const mergedRoadGeo = BufferGeometryUtils.mergeGeometries(roadGeos);
    const roadMesh = new THREE.Mesh(mergedRoadGeo, this.asphaltMat);
    this.group.add(roadMesh);

    // 5. Painted Road Markings (Crisp White Boundaries & Dashed Yellow Centerlines)
    const whiteLineGeos = [];
    const yellowDashGeos = [];

    // Helper: Yellow dashed centerline strips
    const addYellowDashes = (startX, startZ, endX, endZ) => {
      const isHorizontal = Math.abs(endX - startX) > Math.abs(endZ - startZ);
      const dashLen = 2.4;
      const gapLen = 2.4;
      if (isHorizontal) {
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        for (let x = minX + 2; x < maxX - 2; x += dashLen + gapLen) {
          const d = new THREE.PlaneGeometry(dashLen, 0.22);
          d.rotateX(-Math.PI / 2);
          d.translate(x + dashLen / 2, 0.035, startZ);
          yellowDashGeos.push(d);
        }
      } else {
        const minZ = Math.min(startZ, endZ);
        const maxZ = Math.max(startZ, endZ);
        for (let z = minZ + 2; z < maxZ - 2; z += dashLen + gapLen) {
          const d = new THREE.PlaneGeometry(0.22, dashLen);
          d.rotateX(-Math.PI / 2);
          d.translate(startX, 0.035, z + dashLen / 2);
          yellowDashGeos.push(d);
        }
      }
    };

    // Centerlines
    addYellowDashes(-63, 52, 63, 52);   // South Road
    addYellowDashes(-63, -52, 63, -52); // North Road
    addYellowDashes(-56, -41, -56, 41); // West Road
    addYellowDashes(56, -41, 56, 41);   // East Road

    // White Edge Lines
    const addWhiteEdge = (x, z, len, isX) => {
      const g = isX ? new THREE.PlaneGeometry(len, 0.18) : new THREE.PlaneGeometry(0.18, len);
      g.rotateX(-Math.PI / 2);
      g.translate(x, 0.034, z);
      whiteLineGeos.push(g);
    };

    // South Road Edges
    addWhiteEdge(0, 43.2, 126, true);
    addWhiteEdge(0, 60.8, 126, true);
    // North Road Edges
    addWhiteEdge(0, -43.2, 126, true);
    addWhiteEdge(0, -60.8, 126, true);
    // West Road Edges
    addWhiteEdge(-47.2, 0, 84, false);
    addWhiteEdge(-64.8, 0, 84, false);
    // East Road Edges
    addWhiteEdge(47.2, 0, 84, false);
    addWhiteEdge(64.8, 0, 84, false);

    if (whiteLineGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(whiteLineGeos), this.roadStripeWhiteMat));
    }
    if (yellowDashGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(yellowDashGeos), this.roadStripeYellowMat));
    }

    // 6. Pedestrian Zebra Crosswalks (Connecting Building Exits to Outer Grounds)
    // South Grand Exit C Crosswalk: crossing from z = 43 to 61 at x = 0 (Width 8.5m)
    const southCrosswalk = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 18), this.crosswalkMat);
    southCrosswalk.rotation.x = -Math.PI / 2;
    southCrosswalk.position.set(0, 0.036, 52);
    this.group.add(southCrosswalk);

    // West Emergency Exit A Crosswalk: crossing from x = -47 to -65 at z = 0 (Width 6.0m)
    const westCrosswalk = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.0), this.crosswalkMat);
    westCrosswalk.rotation.x = -Math.PI / 2;
    westCrosswalk.position.set(-56, 0.036, 0);
    this.group.add(westCrosswalk);

    // East Emergency Exit B Crosswalk: crossing from x = 47 to 65 at z = 0 (Width 6.0m)
    const eastCrosswalk = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.0), this.crosswalkMat);
    eastCrosswalk.rotation.x = -Math.PI / 2;
    eastCrosswalk.position.set(56, 0.036, 0);
    this.group.add(eastCrosswalk);

    // 7. Chamfered Granite Curbs (Elevated borders between Plaza, Road, and Outer Grass)
    const curbGeos = [];
    const curbW = 0.35;
    const curbH = 0.18;

    const addCurbBlock = (x, z, lenX, lenZ) => {
      const c = new THREE.BoxGeometry(lenX, curbH, lenZ);
      c.translate(x, curbH / 2 + 0.01, z);
      curbGeos.push(c);
    };

    // Plaza Perimeter Curbs (with openings for exits)
    // South Border (z = 43): opening from x = -6 to 6 for Exit C
    addCurbBlock(-26.5, 43, 41, curbW);
    addCurbBlock(26.5, 43, 41, curbW);
    // North Border (z = -43)
    addCurbBlock(0, -43, 94, curbW);
    // West Border (x = -47): opening from z = -5 to 5 for Exit A
    addCurbBlock(-47, -24, curbW, 38);
    addCurbBlock(-47, 24, curbW, 38);
    // East Border (x = 47): opening from z = -5 to 5 for Exit B
    addCurbBlock(47, -24, curbW, 38);
    addCurbBlock(47, 24, curbW, 38);

    // Outer Road Boundary Curbs (Bordering the park lawn)
    addCurbBlock(0, 61, 130, curbW);
    addCurbBlock(0, -61, 130, curbW);
    addCurbBlock(-65, 0, curbW, 122);
    addCurbBlock(65, 0, curbW, 122);

    if (curbGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(curbGeos), this.curbMat));
    }

    // 8. Modern Architectural Concrete Planters with Dense Green Hedge Foliage
    const planterGeos = [];
    const hedgeGeos = [];

    const addPlanterHedge = (px, pz, isRotated) => {
      const pw = isRotated ? 1.0 : 4.2;
      const pd = isRotated ? 4.2 : 1.0;
      const ph = 0.52;

      const pBox = new THREE.BoxGeometry(pw, ph, pd);
      pBox.translate(px, ph / 2 + 0.02, pz);
      planterGeos.push(pBox);

      const hw = isRotated ? 0.76 : 3.9;
      const hd = isRotated ? 3.9 : 0.76;
      const hh = 0.55;
      const hBox = new THREE.BoxGeometry(hw, hh, hd);
      hBox.translate(px, ph + hh / 2 - 0.05, pz);
      hedgeGeos.push(hBox);
    };

    // South Plaza Edge Planters
    for (const sx of [-38, -28, -18, 18, 28, 38]) {
      addPlanterHedge(sx, 41.2, false);
    }
    // North Plaza Edge Planters
    for (const nx of [-38, -22, -6, 10, 26, 40]) {
      addPlanterHedge(nx, -41.2, false);
    }
    // West Plaza Edge Planters
    for (const wz of [-34, -20, 20, 34]) {
      addPlanterHedge(-45.2, wz, true);
    }
    // East Plaza Edge Planters
    for (const ez of [-34, -20, 20, 34]) {
      addPlanterHedge(45.2, ez, true);
    }

    if (planterGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(planterGeos), this.planterMat));
    }
    if (hedgeGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(hedgeGeos), this.hedgeFoliageMat));
    }

    // 9. Modern Architectural LED Street Lamps (Slender poles with overhead luminaire heads)
    const poleGeos = [];
    const luminaireGeos = [];

    const addStreetLamp = (lx, lz, rotY) => {
      // Main Vertical Pole (6.5m high)
      const pole = new THREE.CylinderGeometry(0.09, 0.12, 6.5, 12);
      pole.translate(0, 3.25, 0);

      // Top Cantilever Arm (extends 2.2m outward)
      const arm = new THREE.BoxGeometry(0.09, 0.09, 2.2);
      arm.translate(0, 6.45, 1.1);

      // Merged Pole Structure
      const lampStructure = BufferGeometryUtils.mergeGeometries([pole, arm]);
      lampStructure.rotateY(rotY);
      lampStructure.translate(lx, 0.02, lz);
      poleGeos.push(lampStructure);

      // Glowing LED Luminaire Head (Points downward)
      const head = new THREE.BoxGeometry(0.36, 0.08, 1.2);
      const headSin = Math.sin(rotY);
      const headCos = Math.cos(rotY);
      head.rotateY(rotY);
      head.translate(lx + headSin * 1.8, 6.38, lz + headCos * 1.8);
      luminaireGeos.push(head);
    };

    // Place lamps around perimeter road
    const lampPositions = [
      // South Road (Facing North toward road)
      { x: -50, z: 62.2, rot: Math.PI },
      { x: -20, z: 62.2, rot: Math.PI },
      { x:  20, z: 62.2, rot: Math.PI },
      { x:  50, z: 62.2, rot: Math.PI },
      // North Road (Facing South toward road)
      { x: -50, z: -62.2, rot: 0 },
      { x: -20, z: -62.2, rot: 0 },
      { x:  20, z: -62.2, rot: 0 },
      { x:  50, z: -62.2, rot: 0 },
      // West Road (Facing East toward road)
      { x: -66.2, z: -25, rot: Math.PI / 2 },
      { x: -66.2, z:  25, rot: Math.PI / 2 },
      // East Road (Facing West toward road)
      { x:  66.2, z: -25, rot: -Math.PI / 2 },
      { x:  66.2, z:  25, rot: -Math.PI / 2 },
    ];
    lampPositions.forEach(l => addStreetLamp(l.x, l.z, l.rot));

    if (poleGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(poleGeos), this.streetLampPoleMat));
    }
    if (luminaireGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(luminaireGeos), this.streetLampLuminaireMat));
    }

    // 10. Stainless Steel Illuminated Safety Bollards (Flanking Walkways to Exits)
    const bollardGeos = [];
    const bollardGlowGeos = [];

    const addBollard = (bx, bz) => {
      const post = new THREE.CylinderGeometry(0.12, 0.12, 0.88, 12);
      post.translate(bx, 0.44 + 0.02, bz);
      bollardGeos.push(post);

      const ring = new THREE.CylinderGeometry(0.128, 0.128, 0.08, 12);
      ring.translate(bx, 0.78 + 0.02, bz);
      bollardGlowGeos.push(ring);
    };

    // Pathway to South Exit C (x: -5 to +5, z: 24 to 40)
    for (const bz of [26, 30, 34, 38]) {
      addBollard(-5.2, bz);
      addBollard(5.2, bz);
    }
    // Pathway to West Exit A (x: -30 to -44, z: -4 to +4)
    for (const bx of [-31, -35, -39, -43]) {
      addBollard(bx, -4.2);
      addBollard(bx, 4.2);
    }
    // Pathway to East Exit B (x: 30 to 44, z: -4 to +4)
    for (const bx of [31, 35, 39, 43]) {
      addBollard(bx, -4.2);
      addBollard(bx, 4.2);
    }

    if (bollardGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(bollardGeos), this.bollardSteelMat));
    }
    if (bollardGlowGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(bollardGlowGeos), this.bollardGlowMat));
    }

    // 11. Architectural Water Court / Reflecting Pool (Front Plaza Flank x: 14 to 30, z: 20 to 28)
    const poolW = 16;
    const poolD = 7;
    const poolBorderW = 0.5;
    const poolCopingGeos = [];

    // Basalt granite pool rim border
    const copSouth = new THREE.BoxGeometry(poolW + poolBorderW * 2, 0.28, poolBorderW);
    copSouth.translate(22, 0.14, 27.5);
    poolCopingGeos.push(copSouth);
    const copNorth = new THREE.BoxGeometry(poolW + poolBorderW * 2, 0.28, poolBorderW);
    copNorth.translate(22, 0.14, 20.5);
    poolCopingGeos.push(copNorth);
    const copWest = new THREE.BoxGeometry(poolBorderW, 0.28, poolD);
    copWest.translate(14 - poolBorderW / 2, 0.14, 24);
    poolCopingGeos.push(copWest);
    const copEast = new THREE.BoxGeometry(poolBorderW, 0.28, poolD);
    copEast.translate(30 + poolBorderW / 2, 0.14, 24);
    poolCopingGeos.push(copEast);

    this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(poolCopingGeos), this.poolCopingMat));

    // Shimmering Pool Water Basin Surface
    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(poolW, poolD), this.waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(22, 0.18, 24);
    this.group.add(waterMesh);

    // 12. Architectural 3D Trees (Photorealistic Broadleaf Oak Shade Trees & Italian Cypress Spires)
    const treeTrunkGeos = [];
    const deciduousFoliageGeos = [];
    const cypressFoliageGeos = [];
    const treeGrateGeos = [];
    const treeMulchGeos = [];

    // Helper: Oriented tapered branch/stem segment between two 3D points
    const createBranch = (p1, p2, r1, r2, radialSegments = 6) => {
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(r2, r1, len, radialSegments);
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
      geo.applyQuaternion(quat);
      geo.translate(mid.x, mid.y, mid.z);
      return geo;
    };

    // Helper: Organic ruffled leaf cluster (billowing botanical pod with vertex noise perturbation)
    const createOrganicPod = (radius, scaleY = 1.0, seed = 1.0) => {
      const geo = new THREE.IcosahedronGeometry(radius, 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const noise = Math.sin(x * 3.2 + seed) * 0.14 +
                      Math.cos(y * 3.8 + z * 2.5 + seed * 1.5) * 0.14 +
                      Math.sin(z * 4.1 + x * 2.2) * 0.08;
        pos.setXYZ(i, (x + noise * x) * 1.0, (y + noise * y) * scaleY, (z + noise * z) * 1.0);
      }
      geo.computeVertexNormals();
      return geo;
    };

    let treeSeedCounter = 10.0;

    // Helper: Add Broadleaf Oak Shade Tree (Architectural specimen with realistic branch scaffold & billowing canopy)
    const addDeciduousTree = (tx, tz, scale = 1.0) => {
      const seed = treeSeedCounter++;

      // 1. Root Flare Buttresses (4 organic anchor roots merging into earth)
      for (let r = 0; r < 4; r++) {
        const ang = (r * Math.PI) / 2 + 0.35 * Math.sin(seed + r);
        const rx = Math.cos(ang) * 0.72 * scale;
        const rz = Math.sin(ang) * 0.72 * scale;
        treeTrunkGeos.push(createBranch([tx + rx, 0.02, tz + rz], [tx, 0.75 * scale, tz], 0.16 * scale, 0.34 * scale, 6));
      }

      // 2. Crooked Organic Main Trunk with natural curvature
      const midTrunkX = tx + 0.14 * scale * Math.sin(seed * 0.7);
      const midTrunkZ = tz + 0.12 * scale * Math.cos(seed * 0.9);
      const splitX = tx - 0.08 * scale * Math.cos(seed * 0.8);
      const splitZ = tz + 0.09 * scale * Math.sin(seed * 0.6);

      treeTrunkGeos.push(createBranch([tx, 0.7 * scale, tz], [midTrunkX, 2.1 * scale, midTrunkZ], 0.35 * scale, 0.27 * scale, 7));
      treeTrunkGeos.push(createBranch([midTrunkX, 2.1 * scale, midTrunkZ], [splitX, 3.5 * scale, splitZ], 0.27 * scale, 0.21 * scale, 7));

      // 3. Four Major Scaffold Boughs spreading outward & upward
      const boughs = [
        { dx:  1.6 * scale, dy: 4.8 * scale, dz:  0.8 * scale, r: 0.12 * scale, sdx:  0.8 * scale, sdz:  0.5 * scale },
        { dx: -1.7 * scale, dy: 4.7 * scale, dz:  0.7 * scale, r: 0.12 * scale, sdx: -0.7 * scale, sdz:  0.6 * scale },
        { dx:  0.3 * scale, dy: 4.9 * scale, dz: -1.7 * scale, r: 0.12 * scale, sdx:  0.4 * scale, sdz: -0.7 * scale },
        { dx: -0.1 * scale, dy: 5.4 * scale, dz:  0.2 * scale, r: 0.13 * scale, sdx: -0.3 * scale, sdz: -0.2 * scale },
      ];

      boughs.forEach((b) => {
        const bp = [tx + b.dx, b.dy, tz + b.dz];
        treeTrunkGeos.push(createBranch([splitX, 3.5 * scale, splitZ], bp, 0.18 * scale, b.r, 6));
        // Secondary branch offshoot
        const sbp = [bp[0] + b.sdx, b.dy + 0.9 * scale, bp[2] + b.sdz];
        treeTrunkGeos.push(createBranch(bp, sbp, b.r, 0.06 * scale, 5));
      });

      // 4. Multi-Layer Voluminous Billowing Leaf Masses (18 organic perturbed pods)
      const podLayers = [
        // Lower Canopy Skirt (broad umbrella spread)
        { y: 4.5 * scale, count: 7, rDist: 2.2 * scale, pr: 1.55 * scale, scaleY: 0.95 },
        // Mid Canopy Dome (dense, lush central volume)
        { y: 5.8 * scale, count: 7, rDist: 1.45 * scale, pr: 1.65 * scale, scaleY: 1.05 },
        // Crown Apex (lofty sunlit crown tops)
        { y: 6.9 * scale, count: 4, rDist: 0.55 * scale, pr: 1.45 * scale, scaleY: 1.00 },
      ];

      podLayers.forEach((l, lIdx) => {
        for (let p = 0; p < l.count; p++) {
          const ang = (p / l.count) * Math.PI * 2 + lIdx * 0.9 + (p % 2) * 0.25;
          const px = tx + Math.cos(ang) * l.rDist;
          const pz = tz + Math.sin(ang) * l.rDist;
          const pod = createOrganicPod(l.pr, l.scaleY, seed + lIdx * 3.5 + p);
          pod.translate(px, l.y, pz);
          deciduousFoliageGeos.push(pod);
        }
      });

      // 5. Urban Cast-Iron Tree Grate or Organic Mulch Bed at Base
      const isUrbanPlaza = Math.abs(tx) <= 40 && Math.abs(tz) <= 40;
      if (isUrbanPlaza) {
        // Cast-Iron Tree Grate
        const grateGeo = new THREE.PlaneGeometry(2.3 * scale, 2.3 * scale);
        grateGeo.rotation.x = -Math.PI / 2;
        grateGeo.translate(tx, 0.035, tz);
        treeGrateGeos.push(grateGeo);

        // Inner Mulch Soil Earth Bed
        const mulchGeo = new THREE.CircleGeometry(0.85 * scale, 16);
        mulchGeo.rotation.x = -Math.PI / 2;
        mulchGeo.translate(tx, 0.03, tz);
        treeMulchGeos.push(mulchGeo);
      } else {
        // Natural Park Lawn Mulch Ring
        const mulchGeo = new THREE.RingGeometry(0.25 * scale, 1.7 * scale, 16);
        mulchGeo.rotation.x = -Math.PI / 2;
        mulchGeo.translate(tx, 0.025, tz);
        treeMulchGeos.push(mulchGeo);
      }
    };

    // Helper: Add Columnar Italian Cypress Tree (Elegant Mediterranean evergreen spire)
    const addCypressTree = (cx, cz, scale = 1.0) => {
      const seed = treeSeedCounter++;

      // 1. Central Trunk Stem
      const trunk = new THREE.CylinderGeometry(0.12 * scale, 0.22 * scale, 2.4 * scale, 7);
      trunk.translate(cx, (2.4 * scale) / 2 + 0.02, cz);
      treeTrunkGeos.push(trunk);

      // 2. Vertically-Overlapping Flame-Shaped Foliage Pods (12 pods)
      const cypressLayers = [
        { y: 2.2 * scale, r: 0.72 * scale, count: 3, rDist: 0.28 * scale, scaleY: 1.35 },
        { y: 3.6 * scale, r: 0.88 * scale, count: 4, rDist: 0.32 * scale, scaleY: 1.45 },
        { y: 5.0 * scale, r: 0.74 * scale, count: 3, rDist: 0.22 * scale, scaleY: 1.50 },
        { y: 6.3 * scale, r: 0.54 * scale, count: 1, rDist: 0.00 * scale, scaleY: 1.65 },
        { y: 7.2 * scale, r: 0.38 * scale, count: 1, rDist: 0.00 * scale, scaleY: 1.70 }
      ];

      cypressLayers.forEach((l, lIdx) => {
        for (let p = 0; p < l.count; p++) {
          const ang = (p / l.count) * Math.PI * 2 + lIdx * 0.8 + (p % 2) * 0.3;
          const px = cx + Math.cos(ang) * l.rDist;
          const pz = cz + Math.sin(ang) * l.rDist;
          const pod = createOrganicPod(l.r, l.scaleY, seed + lIdx * 2.3 + p);
          pod.translate(px, l.y, pz);
          cypressFoliageGeos.push(pod);
        }
      });

      // 3. Base Mulch Soil Ring
      const mulchGeo = new THREE.RingGeometry(0.15 * scale, 0.95 * scale, 14);
      mulchGeo.rotation.x = -Math.PI / 2;
      mulchGeo.translate(cx, 0.025, cz);
      treeMulchGeos.push(mulchGeo);
    };

    // Tree Layout:
    // Placed along South plaza & park
    addDeciduousTree(-35, 34, 1.1);
    addDeciduousTree(-22, 34, 0.95);
    addDeciduousTree(-10, 34, 1.05);
    addDeciduousTree(36, 34, 1.15);

    // Outer Park Lawn Trees
    addDeciduousTree(-74, 30, 1.3);
    addDeciduousTree(-74, -20, 1.25);
    addDeciduousTree(-74, -45, 1.2);
    addDeciduousTree(74, 30, 1.3);
    addDeciduousTree(74, -20, 1.25);
    addDeciduousTree(74, -45, 1.2);
    addDeciduousTree(-40, 72, 1.2);
    addDeciduousTree(0, 72, 1.35);
    addDeciduousTree(40, 72, 1.2);
    addDeciduousTree(-40, -72, 1.25);
    addDeciduousTree(0, -72, 1.3);
    addDeciduousTree(40, -72, 1.2);

    // Columnar Cypress Trees framing the walkways & building flanks
    addCypressTree(-16, 26, 1.0);
    addCypressTree(-12, 26, 0.9);
    addCypressTree(12, 26, 0.9);
    addCypressTree(16, 26, 1.0);
    addCypressTree(-38, -12, 1.05);
    addCypressTree(-38, 12, 1.05);
    addCypressTree(38, -12, 1.05);
    addCypressTree(38, 12, 1.05);
    addCypressTree(-42, -32, 1.1);
    addCypressTree(42, -32, 1.1);

    if (treeTrunkGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(treeTrunkGeos), this.treeTrunkMat));
    }
    if (deciduousFoliageGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(deciduousFoliageGeos), this.treeFoliageMat));
    }
    if (cypressFoliageGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(cypressFoliageGeos), this.cypressFoliageMat));
    }
    if (treeGrateGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(treeGrateGeos), this.treeGrateMat));
    }
    if (treeMulchGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(treeMulchGeos), this.treeMulchMat));
    }

    // 13. Modern Park Benches (Teak timber slats with dark steel frames)
    const benchWoodGeos = [];
    const benchSteelGeos = [];

    const addBench = (bx, bz, rotY) => {
      // Wood Seat Slats
      for (let s = 0; s < 3; s++) {
        const slat = new THREE.BoxGeometry(2.2, 0.04, 0.16);
        slat.translate(0, 0.46, s * 0.18 - 0.18);
        slat.rotateY(rotY);
        slat.translate(bx, 0.02, bz);
        benchWoodGeos.push(slat);
      }
      // Wood Backrest Slats
      for (let b = 0; b < 2; b++) {
        const slat = new THREE.BoxGeometry(2.2, 0.14, 0.04);
        slat.translate(0, 0.70 + b * 0.16, -0.32);
        slat.rotateY(rotY);
        slat.translate(bx, 0.02, bz);
        benchWoodGeos.push(slat);
      }
      // Steel Legs
      for (const lx of [-0.95, 0.95]) {
        const leg = new THREE.BoxGeometry(0.06, 0.85, 0.6);
        leg.translate(lx, 0.425, -0.05);
        leg.rotateY(rotY);
        leg.translate(bx, 0.02, bz);
        benchSteelGeos.push(leg);
      }
    };

    addBench(-28, 30, 0);
    addBench(-18, 30, 0);
    addBench(26, 32, Math.PI);
    addBench(-35, -28, Math.PI / 2);
    addBench(35, -28, -Math.PI / 2);

    if (benchWoodGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(benchWoodGeos), this.benchWoodMat));
    }
    if (benchSteelGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(benchSteelGeos), this.benchFrameMat));
    }

    // 14. Luxury Executive & EV Vehicles Parked along Curbs
    const carDarkGeos = [];
    const carWhiteGeos = [];
    const carBlueGeos = [];
    const carGlassGeos = [];
    const carWheelGeos = [];

    const addCar = (cx, cz, rotY, colorType) => {
      // Sleek Aerodynamic Lower Body
      const bodyLower = new THREE.BoxGeometry(2.1, 0.62, 4.6);
      bodyLower.translate(0, 0.45, 0);

      // Cabin Canopy Upper Body
      const cabin = new THREE.BoxGeometry(1.85, 0.52, 2.5);
      cabin.translate(0, 0.95, -0.2);

      const carStructure = BufferGeometryUtils.mergeGeometries([bodyLower, cabin]);
      carStructure.rotateY(rotY);
      carStructure.translate(cx, 0.02, cz);

      if (colorType === 'dark') carDarkGeos.push(carStructure);
      else if (colorType === 'white') carWhiteGeos.push(carStructure);
      else carBlueGeos.push(carStructure);

      // Dark Privacy Glass Canopy
      const windshield = new THREE.BoxGeometry(1.88, 0.48, 2.54);
      windshield.translate(0, 0.95, -0.2);
      windshield.rotateY(rotY);
      windshield.translate(cx, 0.02, cz);
      carGlassGeos.push(windshield);

      // 4 Wheels
      for (const wx of [-1.02, 1.02]) {
        for (const wz of [-1.4, 1.4]) {
          const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12);
          wheel.rotateZ(Math.PI / 2);
          wheel.translate(wx, 0.34, wz);
          wheel.rotateY(rotY);
          wheel.translate(cx, 0.02, cz);
          carWheelGeos.push(wheel);
        }
      }
    };

    // Parked along South drop-off & perimeter road
    addCar(-16, 46.5, 0, 'dark');  // Obsidian Executive Sedan
    addCar(18, 46.5, 0, 'white');   // Pearl White EV Sedan
    addCar(-53, -15, Math.PI / 2, 'blue'); // Sapphire Blue Luxury Sedan
    addCar(53, 16, -Math.PI / 2, 'dark');  // Executive Sedan
    addCar(24, -46.5, Math.PI, 'white');   // EV Crossover

    if (carDarkGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carDarkGeos), this.carBodyDarkMat));
    }
    if (carWhiteGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carWhiteGeos), this.carBodyWhiteMat));
    }
    if (carBlueGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carBlueGeos), this.carBodyBlueMat));
    }
    if (carGlassGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carGlassGeos), this.carGlassMat));
    }
    if (carWheelGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(carWheelGeos), this.carWheelMat));
    }

    // 15. Industrial Fire Hydrants near Exits (West A, East B, South C)
    const hydrantGeos = [];
    const addHydrant = (hx, hz) => {
      const barrel = new THREE.CylinderGeometry(0.14, 0.16, 0.75, 10);
      barrel.translate(0, 0.375, 0);
      const cap = new THREE.SphereGeometry(0.15, 8, 8);
      cap.translate(0, 0.75, 0);
      const nozzle1 = new THREE.CylinderGeometry(0.06, 0.06, 0.38, 8);
      nozzle1.rotateZ(Math.PI / 2);
      nozzle1.translate(0, 0.52, 0);
      const hMesh = BufferGeometryUtils.mergeGeometries([barrel, cap, nozzle1]);
      hMesh.translate(hx, 0.02, hz);
      hydrantGeos.push(hMesh);
    };

    addHydrant(-31, 6);  // Near West Exit A
    addHydrant(31, 6);   // Near East Exit B
    addHydrant(7.5, 25); // Near South Exit C

    if (hydrantGeos.length > 0) {
      this.group.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(hydrantGeos), this.fireHydrantMat));
    }

    // 16. Tactile Warning Blister Paver Strips at Crosswalk Approaches
    const tactileSouth = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.2), this.tactileMat);
    tactileSouth.rotation.x = -Math.PI / 2;
    tactileSouth.position.set(0, 0.038, 42.4);
    this.group.add(tactileSouth);

    const tactileWest = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 6.0), this.tactileMat);
    tactileWest.rotation.x = -Math.PI / 2;
    tactileWest.position.set(-46.4, 0.038, 0);
    this.group.add(tactileWest);

    const tactileEast = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 6.0), this.tactileMat);
    tactileEast.rotation.x = -Math.PI / 2;
    tactileEast.position.set(46.4, 0.038, 0);
    this.group.add(tactileEast);

    // 17. Dedicated Emergency Assembly Muster Zones
    this.createMusterZone(-38, 0, 'MUSTER ZONE A (WEST)');
    this.createMusterZone(38, 0, 'MUSTER ZONE B (EAST)');
    this.createMusterZone(0, 36, 'MUSTER ZONE C (SOUTH)');
  }

  createMusterZone(x, z, label) {
    // 1. Dual Concentric Safety Boundary Rings
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(4.8, 5.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.85, side: THREE.DoubleSide })
    );
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.set(x, 0.03, z);
    this.group.add(outerRing);

    const innerDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 24),
      new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.5 })
    );
    innerDisc.rotation.x = -Math.PI / 2;
    innerDisc.position.set(x, 0.028, z);
    this.group.add(innerDisc);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 1.8, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.set(x, 0.031, z);
    this.group.add(innerRing);

    // 2. 3D Architectural Emergency Assembly Point Totem / Monolith
    const totemY = 1.8;
    const totemPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 3.6, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 })
    );
    totemPillar.position.set(x, totemY, z + (z >= 0 ? 5.6 : -5.6));
    this.group.add(totemPillar);

    const totemSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 1.2, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x10b981, emissiveIntensity: 1.4 })
    );
    totemSign.position.set(x, totemY + 0.8, z + (z >= 0 ? 5.6 : -5.6));
    this.group.add(totemSign);

    const totemBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 2.0 })
    );
    totemBeacon.position.set(x, 3.75, z + (z >= 0 ? 5.6 : -5.6));
    this.group.add(totemBeacon);
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
    // Clear floor-to-ceiling architectural height:
    // Floor-to-floor height is 3.8m. Slabs are 0.35m thick.
    // Distance from floor surface (baseY + 0.175) to ceiling soffit (baseY + 3.625) = 3.45m.
    // We set 3.46m so walls, pillars and lintels firmly connect into the ceiling slab with zero gap!
    const wallH = 3.46;
    const wallCenterY = baseY + 0.175 + wallH / 2;

    // Architectural Floor Slab with Real Textures
    // L9-L10: Rich Wood Parquet | L3-L8: Slate Carpet Tile | L1-L2: Polished Marble Tile
    let floorMat;
    if (floorNum >= 9) {
      floorMat = this.woodFloorMat;
    } else if (floorNum >= 3) {
      floorMat = this.carpetFloorMat;
    } else {
      floorMat = this.tileFloorMat;
    }

    const slabGeo = new THREE.BoxGeometry(slabW, 0.35, slabD);
    const slab = new THREE.Mesh(slabGeo, floorMat);
    slab.position.set(0, baseY, 0);
    slab.receiveShadow = true;
    group.add(slab);

    // Glowing Cyan Edge Contour Lines (Cyber/Digital Twin feel)
    const edgeGeo = new THREE.EdgesGeometry(slabGeo);
    const edgeLine = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 })
    );
    edgeLine.position.copy(slab.position);
    group.add(edgeLine);

    // Executive Charcoal Corridor Runner with Luminous Edge Guidance
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

    // Cyan Photoluminescent Safety Inlay Guidance Lines
    const guideGeo = new THREE.PlaneGeometry(50, 0.05);
    const guideMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 });
    for (const gz of [-0.78, 0.78]) {
      const guide = new THREE.Mesh(guideGeo, guideMat);
      guide.rotation.x = -Math.PI / 2;
      guide.position.set(0, baseY + 0.182, gz);
      group.add(guide);
    }

    // Crisp Matte White Partition Dividing Walls (Connects 100% floor to ceiling) - Merged into 1 draw call!
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
      group.add(divMesh);
    }

    // Slim Architectural Structural Columns (Connects seamlessly to ceiling slab) - Merged into 1 draw call!
    const colGeos = [];
    const colGeoBase = new THREE.BoxGeometry(0.38, wallH, 0.38);
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
      const colMesh = new THREE.Mesh(mergedColGeo, this.columnMat);
      group.add(colMesh);
    }

    // Diverse Architectural Room Furnishings per Floor - 100% High Performance Instanced Rendering!
    this.buildFloorFurnishingsInstanced(group, floorNum, baseY);

    const roomCentersX = [-19.5, -10.5, -1.5, 8.5, 19.0];

    // Recessed Glowing Ceiling Light Fixtures (Mounted flush against ceiling slab) - Merged into 1 draw call!
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

    // Modern Suspended Acoustic Ceiling Grid along Corridor (z = -2.5 to 2.5)
    const ceilGeo = new THREE.PlaneGeometry(50, 5.0);
    const ceilMesh = new THREE.Mesh(ceilGeo, this.ceilingMat);
    ceilMesh.rotation.x = Math.PI / 2; // Facing downward into corridor
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

    // Suspended Illuminated International Exit Signs at East & West Corridor Ends
    // West Corridor Sign: Arrow points strictly LEFT (◄ EXIT) towards West Stairwell Core (-28)
    const exitSignGeo = new THREE.BoxGeometry(0.88, 0.44, 0.04);
    const exitWest = new THREE.Mesh(exitSignGeo, this.exitSignLeftMat);
    exitWest.position.set(-24.2, baseY + 3.12, 0);
    group.add(exitWest);

    // Twin Suspension Rods & Mounting Top Bar for West Sign
    const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.38, 8);
    const rodW1 = new THREE.Mesh(rodGeo, this.columnMat);
    rodW1.position.set(-24.2 - 0.32, baseY + 3.42, 0);
    group.add(rodW1);
    const rodW2 = new THREE.Mesh(rodGeo, this.columnMat);
    rodW2.position.set(-24.2 + 0.32, baseY + 3.42, 0);
    group.add(rodW2);

    // East Corridor Sign: Arrow points strictly RIGHT (EXIT ►) towards East Stairwell Core (+28)
    const exitEast = new THREE.Mesh(exitSignGeo, this.exitSignRightMat);
    exitEast.position.set(24.2, baseY + 3.12, 0);
    group.add(exitEast);

    // Twin Suspension Rods & Mounting Top Bar for East Sign
    const rodE1 = new THREE.Mesh(rodGeo, this.columnMat);
    rodE1.position.set(24.2 - 0.32, baseY + 3.42, 0);
    group.add(rodE1);
    const rodE2 = new THREE.Mesh(rodGeo, this.columnMat);
    rodE2.position.set(24.2 + 0.32, baseY + 3.42, 0);
    group.add(rodE2);

    // Corridor Balustrades (Along open front cutaway edge at z = 2.4) - Merged into 1 draw call!
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

    // === Architectural Glass Curtain Walls ===
    // 1. Left Wing Front Glass Curtain (x: -30 to -3.5, z = 24) - Always present in Cutaway View (Exact original look!)
    this.createFacadeCurtainWall(group, baseY, -30, -3.5, 24, wallH);

    // 2. Full Façade Group (Shown ONLY in Full Façade mode; completely hidden in Cutaway View)
    const facadeFloorGroup = new THREE.Group();
    facadeFloorGroup.userData = { floor: floorNum };

    // Front Right Wing (x: -3.5 to 30, z = 24)
    this.createFacadeCurtainWall(facadeFloorGroup, baseY, -3.5, 30, 24, wallH);

    // Rear North Glass Facade (x: -30 to 30, z = -24)
    this.createFacadeCurtainWall(facadeFloorGroup, baseY, -30, 30, -24, wallH);

    // West End Glass Facade (x = -30, flanking stairwell tower)
    this.createFacadeCurtainWallZ(facadeFloorGroup, baseY, -30, -24, -3.2, wallH);
    this.createFacadeCurtainWallZ(facadeFloorGroup, baseY, -30, 3.2, 24, wallH);

    // East End Glass Facade (x = +30, flanking stairwell tower)
    this.createFacadeCurtainWallZ(facadeFloorGroup, baseY, 30, -24, -3.2, wallH);
    this.createFacadeCurtainWallZ(facadeFloorGroup, baseY, 30, 3.2, 24, wallH);

    this.facadeCutawayGroup.add(facadeFloorGroup);

    // Back Accent Walls (Floor to Ceiling)
    this.createCaramelBackWall(group, baseY, 2.6, wallH, true, floorNum);
    this.createCaramelBackWall(group, baseY, -2.6, wallH, false, floorNum);
  }

  createFacadeCurtainWall(targetGroup, baseY, x1, x2, z, height) {
    const span = Math.abs(x2 - x1);
    const midX = (x1 + x2) / 2;

    const glass = new THREE.Mesh(new THREE.BoxGeometry(span, height, 0.08), this.glassMat);
    glass.position.set(midX, baseY + 0.175 + height / 2, z);
    targetGroup.add(glass);

    const mullionGeos = [];
    const mullionBase = new THREE.BoxGeometry(0.18, height, 0.3);
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let mx = minX; mx <= maxX + 0.1; mx += 4.5) {
      const g = mullionBase.clone();
      g.translate(mx, baseY + 0.175 + height / 2, z);
      mullionGeos.push(g);
    }
    if (mullionGeos.length > 0) {
      const mergedMullions = BufferGeometryUtils.mergeGeometries(mullionGeos);
      const mullionMesh = new THREE.Mesh(mergedMullions, this.mullionMat);
      targetGroup.add(mullionMesh);
    }
  }

  createFacadeCurtainWallZ(targetGroup, baseY, x, z1, z2, height) {
    const span = Math.abs(z2 - z1);
    const midZ = (z1 + z2) / 2;

    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, span), this.glassMat);
    glass.position.set(x, baseY + 0.175 + height / 2, midZ);
    targetGroup.add(glass);

    const mullionGeos = [];
    const mullionBase = new THREE.BoxGeometry(0.3, height, 0.18);
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    for (let mz = minZ; mz <= maxZ + 0.1; mz += 4.0) {
      const g = mullionBase.clone();
      g.translate(x, baseY + 0.175 + height / 2, mz);
      mullionGeos.push(g);
    }
    if (mullionGeos.length > 0) {
      const mergedMullions = BufferGeometryUtils.mergeGeometries(mullionGeos);
      const mullionMesh = new THREE.Mesh(mergedMullions, this.mullionMat);
      targetGroup.add(mullionMesh);
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

    // Wall Segment 1
    const seg1G = new THREE.BoxGeometry(3.0, wallH, 0.35);
    seg1G.translate(-23.5, wallCenterY, z);
    caramelGeos.push(seg1G);

    const bb1 = new THREE.BoxGeometry(3.0, 0.14, 0.38);
    bb1.translate(-23.5, baseY + 0.175 + 0.07, z);
    baseboardGeos.push(bb1);

    // Wall Spans between doors
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

    // End Wall Segment
    const segEndG = new THREE.BoxGeometry(3.0, wallH, 0.35);
    segEndG.translate(23.0, wallCenterY, z);
    caramelGeos.push(segEndG);

    const bbEnd = new THREE.BoxGeometry(3.0, 0.14, 0.38);
    bbEnd.translate(23.0, baseY + 0.175 + 0.07, z);
    baseboardGeos.push(bbEnd);

    // Door Openings, Lintels, Frames, Leaves, Vision Panels, Handles, Plaques
    const jambBase = new THREE.BoxGeometry(0.1, doorH, 0.36);
    const topFrameBase = new THREE.BoxGeometry(doorW, 0.08, 0.36);
    const doorLeafBase = new THREE.BoxGeometry(0.95, doorH - 0.08, 0.06);
    const glassVisionBase = new THREE.BoxGeometry(0.24, 1.2, 0.07);
    const handleBase = new THREE.BoxGeometry(0.04, 0.45, 0.12);
    const plaqueBase = new THREE.BoxGeometry(0.48, 0.24, 0.02);
    const plaqueBadgeBase = new THREE.BoxGeometry(0.42, 0.18, 0.025);
    const lintelBase = new THREE.BoxGeometry(doorW, headerH, 0.35);

    doorXPositions.forEach((doorX) => {
      // 1. Lintel
      const lintelG = lintelBase.clone();
      lintelG.translate(doorX, baseY + 0.175 + doorH + headerH / 2, z);
      caramelGeos.push(lintelG);

      // 2. Door Frame Jambs
      const lJambG = jambBase.clone();
      lJambG.translate(doorX - doorW / 2 + 0.05, baseY + 0.175 + doorH / 2, z);
      frameGeos.push(lJambG);

      const rJambG = jambBase.clone();
      rJambG.translate(doorX + doorW / 2 - 0.05, baseY + 0.175 + doorH / 2, z);
      frameGeos.push(rJambG);

      // 3. Top Frame
      const topFrameG = topFrameBase.clone();
      topFrameG.translate(doorX, baseY + 0.175 + doorH + 0.04, z);
      frameGeos.push(topFrameG);

      // 4. Door Leaf
      const doorLeafG = doorLeafBase.clone();
      doorLeafG.translate(doorX - doorW / 2 + 0.52, baseY + 0.175 + (doorH - 0.08) / 2, z);
      frameGeos.push(doorLeafG);

      // 5. Glass Vision Panel
      const glassG = glassVisionBase.clone();
      glassG.translate(doorX - doorW / 2 + 0.62, baseY + 0.175 + 1.2, z);
      glassGeos.push(glassG);

      // 6. Handle
      const handleG = handleBase.clone();
      handleG.translate(doorX - doorW / 2 + 0.9, baseY + 0.175 + 0.95, z);
      handleGeos.push(handleG);

      // 7. Electronic Room Plaque with illuminated status indicator
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


  buildStairwellCores() {
    const totalH = this.totalFloors * this.floorHeight;
    this.createStairwellCore(-28, 0, totalH, 'WEST EMERGENCY CORE A');
    this.createStairwellCore(28, 0, totalH, 'EAST EMERGENCY CORE B');
  }

  createStairwellCore(x, z, totalH, label) {
    // 1. Transparent Architectural Glass Curtain Tower (Encloses upper floors L2-L10, leaving L1 open to exit lobby)
    const groundClearance = this.floorHeight; // 3.8m
    const upperCoreH = totalH - groundClearance;
    const coreGeo = new THREE.BoxGeometry(5.2, upperCoreH, 6.4);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.22,
      roughness: 0.12,
      metalness: 0.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(x, groundClearance + upperCoreH / 2, z);
    this.stairsGroup.add(core);

    // 2. Heavy Structural Steel Corner Columns (4 corners of the stairwell tower)
    const colGeo = new THREE.BoxGeometry(0.24, totalH, 0.24);
    for (const cx of [x - 2.5, x + 2.5]) {
      for (const cz of [z - 3.1, z + 3.1]) {
        const col = new THREE.Mesh(colGeo, this.columnMat);
        col.position.set(cx, totalH / 2, cz);
        this.stairsGroup.add(col);
      }
    }

    const treadGeos = [];
    const nosingGeos = [];
    const landingGeos = [];
    const railingGeos = [];

    const isWest = x < 0;
    const flight1X = isWest ? x + 0.85 : x - 0.85; // Inner flight
    const flight2X = isWest ? x - 0.85 : x + 0.85; // Outer flight

    const treadBase = new THREE.BoxGeometry(1.35, 0.14, 0.28);
    const nosingBase = new THREE.BoxGeometry(1.35, 0.035, 0.05);
    const postBase = new THREE.BoxGeometry(0.04, 0.9, 0.04);

    for (let f = 1; f <= this.totalFloors; f++) {
      const flY = (f - 1) * this.floorHeight;

      // A. Main Floor Level Landing (Connects to Corridor Door at z = 0)
      const floorLanding = new THREE.BoxGeometry(3.6, 0.22, 1.8);
      floorLanding.translate(x, flY + 0.11, z);
      landingGeos.push(floorLanding);

      // B. Mid-Flight Intermediate Landing (Switchback at North End)
      const midLanding = new THREE.BoxGeometry(3.6, 0.18, 1.3);
      midLanding.translate(x, flY + 1.9, z - 2.75);
      landingGeos.push(midLanding);

      // C. Flight 1 Treads (Inner flight: descends from z = -0.85 down to z = -2.65, y = flY + 1.9)
      const stepsCount = 8;
      for (let s = 0; s < stepsCount; s++) {
        const stepY = flY + 3.8 - (s + 1) * (1.9 / stepsCount);
        const stepZ = -0.85 - s * (1.75 / (stepsCount - 1));

        const tr = treadBase.clone();
        tr.translate(flight1X, stepY, stepZ);
        treadGeos.push(tr);

        const ns = nosingBase.clone();
        ns.translate(flight1X, stepY + 0.07, stepZ + 0.13);
        nosingGeos.push(ns);

        if (s % 2 === 0) {
          const postL = postBase.clone();
          postL.translate(flight1X - 0.65, stepY + 0.52, stepZ);
          railingGeos.push(postL);

          const postR = postBase.clone();
          postR.translate(flight1X + 0.65, stepY + 0.52, stepZ);
          railingGeos.push(postR);
        }
      }

      // Continuous Sloped Handrail Bar for Flight 1
      const handrail1 = new THREE.BoxGeometry(0.05, 0.05, 2.2);
      handrail1.rotateX(0.72);
      handrail1.translate(flight1X - 0.65, flY + 2.85 + 0.45, z - 1.72);
      railingGeos.push(handrail1);

      // D. Flight 2 Treads (Outer flight: descends from z = -2.65 down to z = -0.85, y = flY + 0.175)
      for (let s = 0; s < stepsCount; s++) {
        const stepY = flY + 1.9 - (s + 1) * (1.725 / stepsCount);
        const stepZ = -2.65 + s * (1.75 / (stepsCount - 1));

        const tr = treadBase.clone();
        tr.translate(flight2X, stepY, stepZ);
        treadGeos.push(tr);

        const ns = nosingBase.clone();
        ns.translate(flight2X, stepY + 0.07, stepZ - 0.13);
        nosingGeos.push(ns);

        if (s % 2 === 0) {
          const postL = postBase.clone();
          postL.translate(flight2X - 0.65, stepY + 0.52, stepZ);
          railingGeos.push(postL);

          const postR = postBase.clone();
          postR.translate(flight2X + 0.65, stepY + 0.52, stepZ);
          railingGeos.push(postR);
        }
      }

      // Continuous Sloped Handrail Bar for Flight 2
      const handrail2 = new THREE.BoxGeometry(0.05, 0.05, 2.2);
      handrail2.rotateX(-0.72);
      handrail2.translate(flight2X + 0.65, flY + 1.05 + 0.45, z - 1.72);
      railingGeos.push(handrail2);

      // Safety Guardrail along Mid-Landing back wall
      const midGuard = new THREE.BoxGeometry(3.6, 0.9, 0.04);
      midGuard.translate(x, flY + 1.9 + 0.45, z - 3.35);
      railingGeos.push(midGuard);
    }

    if (landingGeos.length > 0) {
      this.stairsGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(landingGeos), this.tileFloorMat));
    }
    if (treadGeos.length > 0) {
      this.stairsGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(treadGeos), this.columnMat));
    }
    if (nosingGeos.length > 0) {
      const nosingMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.85,
        roughness: 0.2
      });
      this.stairsGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(nosingGeos), nosingMat));
    }
    if (railingGeos.length > 0) {
      this.stairsGroup.add(new THREE.Mesh(BufferGeometryUtils.mergeGeometries(railingGeos), this.railingMat));
    }
  }

  // === PANORAMIC GLASS ELEVATOR BANK: Shifted to side wall (z = -1.8), 100% open corridor ===
  buildElevatorBank() {
    const totalH = this.totalFloors * this.floorHeight;
    const shaftX = [1.2, 3.2, 5.2]; // 3 panoramic glass elevators side-by-side
    const shaftZ = -1.8; // Set against North side wall, leaving corridor & green runner completely clear!
    const shaftW = 1.7;
    const shaftD = 1.35;

    this.elevatorCars = [];

    const frameMat = this.mullionMat;
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.26,
      roughness: 0.08,
      metalness: 0.75
    });

    shaftX.forEach((x, idx) => {
      // 1. Sleek 4 Corner Structural Steel Guide Posts
      const postGeo = new THREE.BoxGeometry(0.08, totalH, 0.08);
      [
        { px: x - shaftW / 2, pz: shaftZ - shaftD / 2 },
        { px: x + shaftW / 2, pz: shaftZ - shaftD / 2 },
        { px: x - shaftW / 2, pz: shaftZ + shaftD / 2 },
        { px: x + shaftW / 2, pz: shaftZ + shaftD / 2 }
      ].forEach(pos => {
        const post = new THREE.Mesh(postGeo, frameMat);
        post.position.set(pos.px, totalH / 2, pos.pz);
        this.elevatorGroup.add(post);
      });

      // 2. Panoramic Glass Shaft Enclosures
      // Front Observation Glass Facing the Corridor
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(shaftW - 0.1, totalH, 0.03), glassMat);
      frontGlass.position.set(x, totalH / 2, shaftZ + shaftD / 2);
      this.elevatorGroup.add(frontGlass);

      // Left & Right Glass Walls
      const sideGlassGeo = new THREE.BoxGeometry(0.03, totalH, shaftD - 0.1);
      const leftGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      leftGlass.position.set(x - shaftW / 2, totalH / 2, shaftZ);
      this.elevatorGroup.add(leftGlass);

      const rightGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      rightGlass.position.set(x + shaftW / 2, totalH / 2, shaftZ);
      this.elevatorGroup.add(rightGlass);

      // Rear Structural Wall (Flush with North caramel wall)
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(shaftW, totalH, 0.06), this.columnMat);
      backWall.position.set(x, totalH / 2, shaftZ - shaftD / 2);
      this.elevatorGroup.add(backWall);

      // Vertical Counterweight Guide Rails
      const railGeo = new THREE.BoxGeometry(0.04, totalH, 0.04);
      const leftRail = new THREE.Mesh(railGeo, frameMat);
      leftRail.position.set(x - 0.35, totalH / 2, shaftZ - shaftD / 2 + 0.08);
      this.elevatorGroup.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, frameMat);
      rightRail.position.set(x + 0.35, totalH / 2, shaftZ - shaftD / 2 + 0.08);
      this.elevatorGroup.add(rightRail);

      // 3. Illuminated Panoramic Lift Cabin (Car)
      const carGroup = new THREE.Group();

      // Titanium Floor & Roof Platters
      const platterGeo = new THREE.BoxGeometry(shaftW - 0.18, 0.12, shaftD - 0.18);
      const carFloor = new THREE.Mesh(platterGeo, frameMat);
      carFloor.position.y = 0.06;
      carGroup.add(carFloor);

      const carRoof = new THREE.Mesh(platterGeo, frameMat);
      carRoof.position.y = 2.38;
      carGroup.add(carRoof);

      // Car Glowing Interior Downlight (Warm white LED canopy)
      const lightGeo = new THREE.BoxGeometry(shaftW - 0.32, 0.02, shaftD - 0.32);
      const carCeilingLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      carCeilingLight.position.y = 2.32;
      carGroup.add(carCeilingLight);

      // Panoramic Glass Observation Front & Sides
      const carFrontGlass = new THREE.Mesh(new THREE.BoxGeometry(shaftW - 0.22, 2.2, 0.02), glassMat);
      carFrontGlass.position.set(0, 1.2, (shaftD - 0.18) / 2);
      carGroup.add(carFrontGlass);

      const carSideGlassGeo = new THREE.BoxGeometry(0.02, 2.2, shaftD - 0.22);
      const carLeftGlass = new THREE.Mesh(carSideGlassGeo, glassMat);
      carLeftGlass.position.set(-(shaftW - 0.18) / 2, 1.2, 0);
      carGroup.add(carLeftGlass);

      const carRightGlass = new THREE.Mesh(carSideGlassGeo, glassMat);
      carRightGlass.position.set((shaftW - 0.18) / 2, 1.2, 0);
      carGroup.add(carRightGlass);

      // Interior Cyan Accent Ambient Bar
      const accent = new THREE.Mesh(
        new THREE.BoxGeometry(shaftW - 0.3, 0.04, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      accent.position.set(0, 0.9, -(shaftD - 0.28) / 2);
      carGroup.add(accent);

      // Initial Cabin Position
      const initialY = (idx * 3 + 1) * this.floorHeight;
      carGroup.position.set(x, initialY, shaftZ);
      this.elevatorGroup.add(carGroup);

      this.elevatorCars.push({
        mesh: carGroup,
        minY: 0.1,
        maxY: (this.totalFloors - 1) * this.floorHeight + 0.1,
        speed: 2.2 + idx * 0.9,
        direction: idx % 2 === 0 ? 1 : -1,
        y: initialY
      });

      // 4. Per-Floor Landing Doors & Glowing Call Display HUD
      for (let f = 1; f <= this.totalFloors; f++) {
        const flY = (f - 1) * this.floorHeight;

        // Structural Floor Trim Ring
        const ring = new THREE.Mesh(new THREE.BoxGeometry(shaftW + 0.08, 0.16, shaftD + 0.08), frameMat);
        ring.position.set(x, flY + 0.08, shaftZ);
        this.elevatorGroup.add(ring);

        // Brushed Metallic Sliding Landing Doors
        const doorGeo = new THREE.BoxGeometry(0.52, 2.3, 0.04);
        const leftDoor = new THREE.Mesh(doorGeo, this.elevatorDoorMat);
        leftDoor.position.set(x - 0.28, flY + 1.15 + 0.16, shaftZ + shaftD / 2 + 0.02);
        this.elevatorGroup.add(leftDoor);

        const rightDoor = new THREE.Mesh(doorGeo, this.elevatorDoorMat);
        rightDoor.position.set(x + 0.28, flY + 1.15 + 0.16, shaftZ + shaftD / 2 + 0.02);
        this.elevatorGroup.add(rightDoor);

        // Digital Floor Indicator HUD Display (Cyan Glowing Header)
        const display = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.14, 0.02),
          new THREE.MeshBasicMaterial({ color: 0x00f0ff })
        );
        display.position.set(x, flY + 2.45 + 0.16, shaftZ + shaftD / 2 + 0.03);
        this.elevatorGroup.add(display);

        // Call Button Indicator
        const button = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.14, 0.02),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        button.position.set(x + shaftW / 2 + 0.08, flY + 1.15 + 0.16, shaftZ + shaftD / 2 + 0.02);
        this.elevatorGroup.add(button);
      }
    });
  }

  buildRooftopHelipad() {
    const roofY = this.totalFloors * this.floorHeight;

    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(60, 0.35, 48), this.whiteWallMat);
    roofSlab.position.set(0, roofY, 0);
    this.roofGroup.add(roofSlab);

    const pad = new THREE.Mesh(new THREE.CircleGeometry(8.5, 24), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, roofY + 0.18, 0);
    this.roofGroup.add(pad);

    const padRing = new THREE.Mesh(new THREE.RingGeometry(8.0, 8.4, 24), new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }));
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.set(0, roofY + 0.19, 0);
    this.roofGroup.add(padRing);
  }


  buildGroundExits() {
    const exits = [
      { id: 'exit_west', name: 'West Emergency Exit A', x: -29, z: 0, rot: -Math.PI / 2, width: 5.2, musterX: -38, musterZ: 0, signMat: this.exitPortalSignMatWest },
      { id: 'exit_east', name: 'East Emergency Exit B', x: 29, z: 0, rot: Math.PI / 2, width: 5.2, musterX: 38, musterZ: 0, signMat: this.exitPortalSignMatEast },
      { id: 'exit_south', name: 'South Grand Plaza Exit', x: 0, z: 23, rot: 0, width: 8.5, musterX: 0, musterZ: 36, signMat: this.exitPortalSignMatSouth }
    ];

    exits.forEach(ex => {
      // Create local coordinate space for each exit
      // Local +Z points OUTSIDE towards the muster zone; Local -Z points INSIDE into the building
      // Local X is across the doorway width; Local Y is vertical
      const exitGroup = new THREE.Group();
      exitGroup.position.set(ex.x, 0, ex.z);
      exitGroup.rotation.y = ex.rot;
      this.group.add(exitGroup);

      const jambW = 0.45;
      const doorH = 2.65;
      const portalH = 3.6;
      const portalD = 0.55;
      const doorOpenW = ex.width - jambW * 2; // e.g. 4.3m wide clear walk-through opening!

      // 1. Heavy Architectural Portal Frame (Left & Right Jambs - CENTER IS 100% OPEN!)
      const jambGeo = new THREE.BoxGeometry(jambW, portalH, portalD);
      const leftJamb = new THREE.Mesh(jambGeo, this.columnMat);
      leftJamb.position.set(-ex.width / 2 + jambW / 2, portalH / 2, 0);
      exitGroup.add(leftJamb);

      const rightJamb = new THREE.Mesh(jambGeo, this.columnMat);
      rightJamb.position.set(ex.width / 2 - jambW / 2, portalH / 2, 0);
      exitGroup.add(rightJamb);

      // Top Transom Header Beam across the opening
      const headerH = portalH - doorH; // 0.95m
      const headerGeo = new THREE.BoxGeometry(ex.width, headerH, portalD);
      const headerBeam = new THREE.Mesh(headerGeo, this.columnMat);
      headerBeam.position.set(0, doorH + headerH / 2, 0);
      exitGroup.add(headerBeam);

      // 2. Ultra-Bright Double-Sided Illuminated Emergency Exit Signboards
      const signW = Math.min(doorOpenW + 0.1, 4.4);
      const signH = 0.65;
      const signGeo = new THREE.BoxGeometry(signW, signH, 0.08);

      // Exterior Facing Sign (Facing Outside Plaza, +Z)
      const signExt = new THREE.Mesh(signGeo, ex.signMat);
      signExt.position.set(0, doorH + headerH / 2, portalD / 2 + 0.05);
      exitGroup.add(signExt);

      // Interior Facing Sign (Facing Inside Corridor/Stairwell, -Z)
      const signInt = new THREE.Mesh(signGeo, ex.signMat);
      signInt.position.set(0, doorH + headerH / 2, -portalD / 2 - 0.05);
      signInt.rotation.y = Math.PI; // Flipped to face into the building!
      exitGroup.add(signInt);

      // 3. Green Safety Downward Emergency Floodlight (Washes threshold in safety green!)
      const floodLight = new THREE.PointLight(0x00ff88, 3.8, 12, 1.2);
      floodLight.position.set(0, doorH, 0.2);
      exitGroup.add(floodLight);

      // 4. Caution Hazard Striped Threshold Safety Plate
      const threshGeo = new THREE.BoxGeometry(doorOpenW + 0.15, 0.03, portalD + 0.5);
      const thresh = new THREE.Mesh(threshGeo, this.hazardPlateMat);
      thresh.position.set(0, 0.015, 0);
      exitGroup.add(thresh);

      // 5. Authentic Double Fire Exit Doors (Wide Open Outward at 82°)
      const leafW = doorOpenW / 2 - 0.04;
      const leafH = doorH - 0.06;
      const leafThick = 0.08;

      // --- Left Fire Door Leaf ---
      const leftPivot = new THREE.Group();
      leftPivot.position.set(-doorOpenW / 2, 0, portalD / 2);
      leftPivot.rotation.y = -Math.PI / 2.2; // Swung wide open outward against outside wall

      const leftSlab = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafThick), this.fireDoorRedMat);
      leftSlab.position.set(leafW / 2, leafH / 2, 0);
      leftPivot.add(leftSlab);

      // Vision Lite (Inspection Window) on Left Door
      const winGeo = new THREE.BoxGeometry(0.32, 1.1, leafThick + 0.02);
      const leftWin = new THREE.Mesh(winGeo, this.glassMat);
      leftWin.position.set(leafW * 0.65, 1.65, 0);
      leftPivot.add(leftWin);

      // Stainless Steel Panic Push Crash Bar on Left Door
      const barBaseL = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.85, 0.06, 0.06), this.panicBarSilverMat);
      barBaseL.position.set(leafW * 0.5, 1.05, -leafThick / 2 - 0.04);
      leftPivot.add(barBaseL);

      const barPadL = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.45, 0.04, 0.02), this.panicBarGreenMat);
      barPadL.position.set(leafW * 0.5, 1.05, -leafThick / 2 - 0.075);
      leftPivot.add(barPadL);

      // Warning Badge on push side
      const leftBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), this.fireDoorDecalMat);
      leftBadge.position.set(leafW * 0.5, 1.45, -leafThick / 2 - 0.045);
      leftBadge.rotation.y = Math.PI;
      leftPivot.add(leftBadge);

      exitGroup.add(leftPivot);

      // --- Right Fire Door Leaf ---
      const rightPivot = new THREE.Group();
      rightPivot.position.set(doorOpenW / 2, 0, portalD / 2);
      rightPivot.rotation.y = Math.PI / 2.2; // Swung wide open outward against outside wall

      const rightSlab = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, leafThick), this.fireDoorRedMat);
      rightSlab.position.set(-leafW / 2, leafH / 2, 0);
      rightPivot.add(rightSlab);

      // Vision Lite (Inspection Window) on Right Door
      const rightWin = new THREE.Mesh(winGeo, this.glassMat);
      rightWin.position.set(-leafW * 0.65, 1.65, 0);
      rightPivot.add(rightWin);

      // Stainless Steel Panic Push Crash Bar on Right Door
      const barBaseR = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.85, 0.06, 0.06), this.panicBarSilverMat);
      barBaseR.position.set(-leafW * 0.5, 1.05, -leafThick / 2 - 0.04);
      rightPivot.add(barBaseR);

      const barPadR = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.45, 0.04, 0.02), this.panicBarGreenMat);
      barPadR.position.set(-leafW * 0.5, 1.05, -leafThick / 2 - 0.075);
      rightPivot.add(barPadR);

      // Warning Badge on push side
      const rightBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), this.fireDoorDecalMat);
      rightBadge.position.set(-leafW * 0.5, 1.45, -leafThick / 2 - 0.045);
      rightBadge.rotation.y = Math.PI;
      rightPivot.add(rightBadge);

      exitGroup.add(rightPivot);

      // 6. Architectural Cantilevered Entrance Canopy
      const canopyD = 2.4;
      const canopyGeo = new THREE.BoxGeometry(ex.width + 0.8, 0.35, canopyD);
      const canopy = new THREE.Mesh(canopyGeo, this.columnMat);
      canopy.position.set(0, portalH + 0.175, canopyD / 2 - portalD / 4);
      exitGroup.add(canopy);

      // Underside Downlights under canopy
      for (const lx of [-ex.width * 0.28, ex.width * 0.28]) {
        const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), this.downlightMat);
        dl.position.set(lx, portalH, canopyD / 2);
        exitGroup.add(dl);
      }

      // 7. Industrial Strobe Siren Emergency Beacon atop Canopy
      const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.15, 16), this.columnMat);
      beaconBase.position.set(0, portalH + 0.35 + 0.075, canopyD / 2);
      exitGroup.add(beaconBase);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 2.8,
        roughness: 0.1
      });
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.4, 16), beaconMat);
      beacon.position.set(0, portalH + 0.35 + 0.35, canopyD / 2);
      exitGroup.add(beacon);

      // 8. High-Visibility Directional Safety Evacuation Runway to Muster Zone
      const dist = Math.hypot(ex.musterX - ex.x, ex.musterZ - ex.z);
      const runwayW = 3.6;
      const runwayGeo = new THREE.PlaneGeometry(dist, runwayW);
      const runway = new THREE.Mesh(runwayGeo, this.exitRunwayMat);
      runway.rotation.x = -Math.PI / 2;
      runway.position.set((ex.x + ex.musterX) / 2, 0.02, (ex.z + ex.musterZ) / 2);
      if (ex.rot === 0) {
        runway.rotation.z = Math.PI / 2;
      }
      this.group.add(runway);

      // Glowing Cyan Edge Rails
      const edgeG = new THREE.PlaneGeometry(dist, 0.12);
      const edgeM = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
      const edge1 = new THREE.Mesh(edgeG, edgeM);
      const edge2 = new THREE.Mesh(edgeG, edgeM);
      edge1.rotation.x = -Math.PI / 2;
      edge2.rotation.x = -Math.PI / 2;
      if (ex.rot === 0) {
        edge1.rotation.z = Math.PI / 2;
        edge2.rotation.z = Math.PI / 2;
        edge1.position.set(ex.x - runwayW / 2, 0.025, (ex.z + ex.musterZ) / 2);
        edge2.position.set(ex.x + runwayW / 2, 0.025, (ex.z + ex.musterZ) / 2);
      } else {
        edge1.position.set((ex.x + ex.musterX) / 2, 0.025, ex.z - runwayW / 2);
        edge2.position.set((ex.x + ex.musterX) / 2, 0.025, ex.z + runwayW / 2);
      }
      this.group.add(edge1);
      this.group.add(edge2);
    });
  }

  toggleFacadeMode() {
    this.facadeMode = this.facadeMode === 'CUTAWAY' ? 'FULL' : 'CUTAWAY';
    this.updateFacadeCutaway();
    return this.facadeMode;
  }

  setFacadeMode(mode) {
    this.facadeMode = mode;
    this.updateFacadeCutaway();
  }

  updateFacadeCutaway() {
    const isFull = this.facadeMode === 'FULL';
    if (!this.facadeCutawayGroup) return;

    const activeMode = this.floorMode || 'ALL';
    this.facadeCutawayGroup.children.forEach(sub => {
      const fl = sub.userData?.floor || 1;
      if (activeMode === 'ALL' || activeMode === 'EXPLODED') {
        sub.visible = isFull;
      } else {
        const targetFloor = parseInt(activeMode, 10);
        sub.visible = isFull && (fl === targetFloor);
      }
    });
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
        this.stairsGroup.visible = true;
        this.elevatorGroup.visible = true;
      } else if (mode === 'EXPLODED') {
        group.visible = true;
        group.position.y = (f - 1) * 5.0;
        this.roofGroup.visible = true;
        this.roofGroup.position.y = (this.totalFloors - 1) * 5.0;
        this.stairsGroup.visible = true;
        this.elevatorGroup.visible = true;
      } else {
        const targetFloor = parseInt(mode, 10);
        group.visible = f === targetFloor;
        group.position.y = 0;
        this.roofGroup.visible = false;
        this.stairsGroup.visible = true;
        this.elevatorGroup.visible = true;
      }
    }

    if (this.facadeCutawayGroup) {
      this.facadeCutawayGroup.children.forEach(sub => {
        const fl = sub.userData?.floor || 1;
        if (mode === 'ALL') {
          sub.visible = this.facadeMode === 'FULL';
          sub.position.y = 0;
        } else if (mode === 'EXPLODED') {
          sub.visible = this.facadeMode === 'FULL';
          sub.position.y = (fl - 1) * 5.0;
        } else {
          const targetFloor = parseInt(mode, 10);
          sub.visible = this.facadeMode === 'FULL' && (fl === targetFloor);
          sub.position.y = 0;
        }
      });
    }
  }

  // Animate the 3 panoramic glass elevators gliding smoothly between floors
  update(delta) {
    if (!this.elevatorCars || this.elevatorCars.length === 0) return;

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

  // === Ultra-Fast High-Performance Instanced Room Furnishing (Zero Lag / Pure 60 FPS) ===
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
        buckets.displaysOrange.push({ pos: [dispX, y + 0.30, dispZ], rotY });
      } else {
        buckets.displaysCyan.push({ pos: [dispX, y + 0.30, dispZ], rotY });
      }
    };

    const addPlant = (x, z) => {
      buckets.indoorPlantPots.push({ pos: [x, baseY, z], rotY: 0 });
      buckets.indoorPlantFoliage.push({ pos: [x, baseY, z], rotY: 0 });
    };

    const getRoomRightWallX = (cx) => {
      if (cx <= -15.0) return -15.0 - 0.20; // x = -15.20 (Room 0/5)
      if (cx <= -6.0)  return -6.0 - 0.20;  // x = -6.20  (Room 1/6)
      if (cx <= 3.0)   return 3.0 - 0.20;   // x = 2.80   (Room 2/7 - Boardroom)
      if (cx <= 14.0)  return 14.0 - 0.20;  // x = 13.80  (Room 3/8)
      return 24.5 - 0.25;                   // x = 24.25  (Room 4/9)
    };

    const addWallTv = (cx, cz, isOrange) => {
      const sideWallX = getRoomRightWallX(cx);
      const rotY = -Math.PI / 2; // Mounted on side divider wall, facing into the room towards the table
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
          // 6 Workstation desk pods (3 rows x 2 columns) with central aisle & generous spacing
          const deskPods = [
            { dx: -2.3, dz:  5.2 * backSign }, // Row 1 (Back-Left)
            { dx:  2.3, dz:  5.2 * backSign }, // Row 1 (Back-Right)
            { dx: -2.3, dz:  0.0 * backSign }, // Row 2 (Mid-Left)
            { dx:  2.3, dz:  0.0 * backSign }, // Row 2 (Mid-Right)
            { dx: -2.3, dz: -5.2 * backSign }, // Row 3 (Front-Left)
            { dx:  2.3, dz: -5.2 * backSign }, // Row 3 (Front-Right)
          ];

          deskPods.forEach((pod, podIdx) => {
            const px = cx + pod.dx;
            const pz = cz + pod.dz;
            buckets.workstationDesks.push({ pos: [px, baseY, pz], rotY: 0 });
            buckets.acousticDividers.push({ pos: [px, baseY + 0.98, pz], rotY: 0 });

            // 4 Workstation Chairs per desk pod
            addChair(px - 0.85, baseY, pz - 0.90, 0, false);
            addChair(px + 0.85, baseY, pz - 0.90, 0, false);
            addChair(px - 0.85, baseY, pz + 0.90, Math.PI, false);
            addChair(px + 0.85, baseY, pz + 0.90, Math.PI, false);

            // 4 Monitors facing agents
            const isAlt = podIdx % 2 === 1;
            addMonitor(px - 0.85, baseY + 0.76, pz - 0.30, 0, isAlt);
            addMonitor(px + 0.85, baseY + 0.76, pz - 0.30, 0, !isAlt);
            addMonitor(px - 0.85, baseY + 0.76, pz + 0.30, Math.PI, !isAlt);
            addMonitor(px + 0.85, baseY + 0.76, pz + 0.30, Math.PI, isAlt);
          });

          // Elegant architectural indoor plants
          addPlant(cx - 3.4, cz + 7.2 * backSign);
          addPlant(cx + 3.4, cz + 7.2 * backSign);
          addPlant(cx + 3.4, cz - 6.5 * backSign);
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

          // Executive Cognac Leather Swivel Chairs
          for (const dx of [-1.4, 0, 1.4]) {
            addChair(cx + dx, baseY, cz - 1.15, 0, true);
            addChair(cx + dx, baseY, cz + 1.15, Math.PI, true);
          }
          if (isPres) {
            addChair(cx - 2.5, baseY, cz, Math.PI / 2, true);
            addChair(cx + 2.5, baseY, cz, -Math.PI / 2, true);
          }

          addWallTv(cx, cz, false);
          addPlant(cx - 3.0, cz + 1.8);
          break;
        }

        case 'LUXURY_PENTHOUSE_LIVING':
        case 'LIVING_LOUNGE': {
          const isPent = type === 'LUXURY_PENTHOUSE_LIVING';
          if (isPent) {
            buckets.areaRugsCream.push({ pos: [cx, baseY + 0.015, cz], rotY: 0 });
            buckets.sectionalSofasSand.push({ pos: [cx, baseY, cz], rotY: 0 });
          } else {
            buckets.areaRugsSlate.push({ pos: [cx, baseY + 0.015, cz], rotY: 0 });
            buckets.sectionalSofasSlate.push({ pos: [cx, baseY, cz], rotY: 0 });
          }

          buckets.coffeeTables.push({ pos: [cx - 0.10, baseY + 0.17, cz + 0.15], rotY: 0 });
          addWallTv(cx, cz, true);
          addPlant(cx + 2.8, cz - 2.0);
          break;
        }

        case 'EXECUTIVE_OFFICE': {
          buckets.confTablesEspresso.push({ pos: [cx, baseY, cz - 0.45], rotY: 0, scale: [0.65, 1.0, 0.75] });
          addChair(cx, baseY, cz - 1.05, 0, true);
          addChair(cx - 0.85, baseY, cz + 0.85, Math.PI, false);
          addChair(cx + 0.85, baseY, cz + 0.85, Math.PI, false);
          addMonitor(cx, baseY + 0.76, cz - 0.45, 0, false);
          buckets.whiteboards.push({ pos: [cx + 3.4, baseY + 1.9, cz], rotY: -Math.PI / 2 });
          addPlant(cx - 2.8, cz - 1.8);
          break;
        }

        case 'RECEPTION_LOBBY': {
          buckets.workstationDesks.push({ pos: [cx, baseY, cz], rotY: 0 });
          addChair(cx, baseY, cz - 0.65, 0, false);
          addMonitor(cx, baseY + 0.76, cz - 0.15, 0, false);
          buckets.sectionalSofasSlate.push({ pos: [cx - 2.0, baseY, cz + 1.4], rotY: 0, scale: [0.65, 1, 1] });
          buckets.sectionalSofasSlate.push({ pos: [cx + 2.0, baseY, cz + 1.4], rotY: 0, scale: [0.65, 1, 1] });
          buckets.coffeeTables.push({ pos: [cx, baseY + 0.18, cz + 1.4], rotY: 0 });
          addPlant(cx - 2.8, cz);
          addPlant(cx + 2.8, cz);
          break;
        }

        case 'CAFE_LOUNGE': {
          const backSign = cz > 0 ? 1 : -1;
          for (const dz of [4.8 * backSign, 0, -4.8 * backSign]) {
            for (const dx of [-1.5, 1.5]) {
              buckets.coffeeTables.push({ pos: [cx + dx, baseY + 0.36, cz + dz], rotY: 0 });
              addChair(cx + dx, baseY, cz + dz - 0.65, 0, false);
              addChair(cx + dx, baseY, cz + dz + 0.65, Math.PI, false);
            }
          }
          addPlant(cx + 2.8, cz + 6.8 * backSign);
          addPlant(cx - 2.8, cz - 6.8 * backSign);
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

