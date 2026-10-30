import * as THREE from 'three';
import { RoadNetwork } from './RoadNetwork.js';
import { PedestrianNetwork } from './PedestrianNetwork.js';
import { FuturePlotManager } from './FuturePlotManager.js';
import { CampusBuildingsManager } from './CampusBuildingsManager.js';
import { ParkingManager } from './ParkingManager.js';
import { LandscapeManager } from './LandscapeManager.js';
import { WorldEnvironmentManager } from './WorldEnvironmentManager.js';
import {
  CAMPUS_BOUNDS,
  CAMPUS_DISTRICTS,
  FUTURE_BUILDING_PLOTS,
  PARKING_FACILITIES,
  CENTRAL_ASSEMBLY_PLAZA,
  CAMPUS_LAKE,
  SPORTS_COMPLEX,
  CAMPUS_ENTRANCES
} from './CampusLayout.js';

// ============================================================================
// TWIN GUARD CAMPUS MASTER SITE — ORCHESTRATOR & HIGH-FIDELITY MATERIALS
// ============================================================================
// Orchestrates the 40-hectare smart campus master plan.
// Provides shared procedural textures, high-performance materials,
// and coordinates all additive site subsystems.

export class CampusSite {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'Site';
    this.group.userData = { id: 'SITE-001', type: 'CAMPUS_MASTER_PLAN', name: 'Twin Guard Innovation Campus' };
    this.scene.add(this.group);

    // 1. Initialize High-Fidelity Materials Palette
    this.materials = this.initSharedMaterials();

    // 2. Additive Site Subsystems (strictly non-destructive around Hero Building)
    this.landscapeManager = new LandscapeManager(this.materials);
    this.roadNetwork = new RoadNetwork(this.materials);
    this.pedestrianNetwork = new PedestrianNetwork(this.materials);
    this.parkingManager = new ParkingManager(this.materials);
    this.futurePlotManager = new FuturePlotManager(this.materials);
    this.buildingsManager = new CampusBuildingsManager(this.materials);
    this.worldEnvironment = new WorldEnvironmentManager(this.materials);

    // 3. Assemble Semantic Scenegraph
    this.group.add(this.landscapeManager.group);
    this.group.add(this.roadNetwork.group);
    this.group.add(this.pedestrianNetwork.group);
    this.group.add(this.parkingManager.group);
    this.group.add(this.futurePlotManager.group);
    this.group.add(this.buildingsManager.group);
    this.group.add(this.worldEnvironment.group);
  }

  initSharedMaterials() {
    // ------------------------------------------------------------------------
    // A. Primary Road Texture (Matte Charcoal Gray + Subtle Muted Dashed Center)
    // ------------------------------------------------------------------------
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 1024;
    roadCanvas.height = 1024;
    const rCtx = roadCanvas.getContext('2d');

    // Rich matte charcoal asphalt (NOT pure black!)
    rCtx.fillStyle = '#262e38';
    rCtx.fillRect(0, 0, 1024, 1024);

    // Fine mineral aggregate stippling
    for (let i = 0; i < 14000; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 20 - 10);
      rCtx.fillStyle = `rgb(${38 + shade}, ${46 + shade}, ${56 + shade})`;
      rCtx.fillRect(rx, ry, 2, 2);
    }

    // Subtle, muted dashed centerline (NO harsh white outer border geometry)
    rCtx.fillStyle = 'rgba(215, 222, 230, 0.42)';
    rCtx.fillRect(504, 260, 16, 504);

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.colorSpace = THREE.SRGBColorSpace;
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // B. Plain Secondary & Roundabout Asphalt (Clean Matte Charcoal)
    // ------------------------------------------------------------------------
    const plainCanvas = document.createElement('canvas');
    plainCanvas.width = 512;
    plainCanvas.height = 512;
    const pCtx = plainCanvas.getContext('2d');
    pCtx.fillStyle = '#2c3541';
    pCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 6000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const shade = Math.floor(Math.random() * 18 - 9);
      pCtx.fillStyle = `rgb(${44 + shade}, ${53 + shade}, ${65 + shade})`;
      pCtx.fillRect(px, py, 2, 2);
    }
    const plainTex = new THREE.CanvasTexture(plainCanvas);
    plainTex.colorSpace = THREE.SRGBColorSpace;
    plainTex.wrapS = THREE.RepeatWrapping;
    plainTex.wrapT = THREE.RepeatWrapping;
    plainTex.repeat.set(8, 8);
    plainTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // C. Architectural Sandstone Pavers (For Walkways)
    // ------------------------------------------------------------------------
    const paverCanvas = document.createElement('canvas');
    paverCanvas.width = 512;
    paverCanvas.height = 512;
    const pvCtx = paverCanvas.getContext('2d');
    pvCtx.fillStyle = '#ded8cc';
    pvCtx.fillRect(0, 0, 512, 512);

    pvCtx.strokeStyle = '#b8b0a2';
    pvCtx.lineWidth = 3;
    for (let x = 0; x <= 512; x += 64) {
      pvCtx.beginPath();
      pvCtx.moveTo(x, 0);
      pvCtx.lineTo(x, 512);
      pvCtx.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      pvCtx.beginPath();
      pvCtx.moveTo(0, y);
      pvCtx.lineTo(512, y);
      pvCtx.stroke();
    }

    for (let i = 0; i < 6000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const shade = Math.floor(Math.random() * 26 - 13);
      pvCtx.fillStyle = `rgb(${222 + shade}, ${216 + shade}, ${204 + shade})`;
      pvCtx.fillRect(px, py, 2, 2);
    }

    const paverTex = new THREE.CanvasTexture(paverCanvas);
    paverTex.colorSpace = THREE.SRGBColorSpace;
    paverTex.wrapS = THREE.RepeatWrapping;
    paverTex.wrapT = THREE.RepeatWrapping;
    paverTex.repeat.set(2, 6);
    paverTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // D. Plaza Paving Stone
    // ------------------------------------------------------------------------
    const plazaCanvas = document.createElement('canvas');
    plazaCanvas.width = 512;
    plazaCanvas.height = 512;
    const plCtx = plazaCanvas.getContext('2d');
    plCtx.fillStyle = '#e8e4dc';
    plCtx.fillRect(0, 0, 512, 512);

    plCtx.strokeStyle = '#c4beb2';
    plCtx.lineWidth = 2.5;
    for (let x = 0; x <= 512; x += 48) {
      plCtx.beginPath();
      plCtx.moveTo(x, 0);
      plCtx.lineTo(x, 512);
      plCtx.stroke();
    }
    for (let y = 0; y <= 512; y += 48) {
      plCtx.beginPath();
      plCtx.moveTo(0, y);
      plCtx.lineTo(512, y);
      plCtx.stroke();
    }

    const plazaTex = new THREE.CanvasTexture(plazaCanvas);
    plazaTex.colorSpace = THREE.SRGBColorSpace;
    plazaTex.wrapS = THREE.RepeatWrapping;
    plazaTex.wrapT = THREE.RepeatWrapping;
    plazaTex.repeat.set(10, 10);
    plazaTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // E. Natural Master Campus Meadow Turf
    // ------------------------------------------------------------------------
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 1024;
    grassCanvas.height = 1024;
    const gCtx = grassCanvas.getContext('2d');
    gCtx.fillStyle = '#2d5a22';
    gCtx.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 30000; i++) {
      const gx = Math.random() * 1024;
      const gy = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 32 - 16);
      gCtx.fillStyle = `rgb(${45 + shade}, ${90 + shade}, ${34 + Math.floor(shade * 0.7)})`;
      gCtx.fillRect(gx, gy, 3, 3);
    }
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.colorSpace = THREE.SRGBColorSpace;
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(24, 24);
    grassTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // F. Manicured Quad Lawn with Directional Mowing Stripes
    // ------------------------------------------------------------------------
    const courtyardCanvas = document.createElement('canvas');
    courtyardCanvas.width = 1024;
    courtyardCanvas.height = 1024;
    const cCtx = courtyardCanvas.getContext('2d');
    cCtx.fillStyle = '#346d25';
    cCtx.fillRect(0, 0, 1024, 1024);

    const stripeW = 96;
    for (let y = 0; y < 1024; y += stripeW * 2) {
      cCtx.fillStyle = 'rgba(76, 152, 54, 0.42)';
      cCtx.fillRect(0, y, 1024, stripeW);
      cCtx.fillStyle = 'rgba(38, 86, 26, 0.42)';
      cCtx.fillRect(0, y + stripeW, 1024, stripeW);
    }

    for (let i = 0; i < 20000; i++) {
      const cx = Math.random() * 1024;
      const cy = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 24 - 12);
      cCtx.fillStyle = `rgb(${52 + shade}, ${109 + shade}, ${37 + Math.floor(shade * 0.6)})`;
      cCtx.fillRect(cx, cy, 2.5, 2.5);
    }
    const courtyardTex = new THREE.CanvasTexture(courtyardCanvas);
    courtyardTex.colorSpace = THREE.SRGBColorSpace;
    courtyardTex.wrapS = THREE.RepeatWrapping;
    courtyardTex.wrapT = THREE.RepeatWrapping;
    courtyardTex.repeat.set(1, 1);
    courtyardTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // G. Development Parcel Turf
    // ------------------------------------------------------------------------
    const parcelCanvas = document.createElement('canvas');
    parcelCanvas.width = 512;
    parcelCanvas.height = 512;
    const parCtx = parcelCanvas.getContext('2d');
    parCtx.fillStyle = '#3a6828';
    parCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 6000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const shade = Math.floor(Math.random() * 24 - 12);
      parCtx.fillStyle = `rgb(${58 + shade}, ${104 + shade}, ${40 + shade})`;
      parCtx.fillRect(px, py, 2, 2);
    }
    const parcelTex = new THREE.CanvasTexture(parcelCanvas);
    parcelTex.colorSpace = THREE.SRGBColorSpace;
    parcelTex.wrapS = THREE.RepeatWrapping;
    parcelTex.wrapT = THREE.RepeatWrapping;
    parcelTex.repeat.set(4, 4);

    // ------------------------------------------------------------------------
    // 3 HIERARCHICAL ASPHALT MATERIALS (Subtle charcoal gray palette)
    // ------------------------------------------------------------------------
    // Class A Primary Road: Matte charcoal gray with subtle centerline
    const primaryAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: roadTex,
      roughness: 0.85,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    // Class B Secondary Road: Slightly lighter charcoal gray
    const secondaryAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: plainTex,
      roughness: 0.86,
      metalness: 0.03,
      side: THREE.DoubleSide
    });

    // Class C Service / Emergency Road
    const emergencyAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x363f4c,
      map: plainTex,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const plainAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: plainTex,
      roughness: 0.86,
      metalness: 0.03,
      side: THREE.DoubleSide
    });

    const paverMat = new THREE.MeshStandardMaterial({
      map: paverTex,
      roughness: 0.72,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    const plazaStoneMat = new THREE.MeshStandardMaterial({
      map: plazaTex,
      roughness: 0.65,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    // Architectural Concrete Curb: Neutral light slate/concrete gray (NOT bright white outline!)
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.75,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.94,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const courtyardTurfMat = new THREE.MeshStandardMaterial({
      map: courtyardTex,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const parcelTurfMat = new THREE.MeshStandardMaterial({
      map: parcelTex,
      roughness: 0.94,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const tartanTrackMat = new THREE.MeshStandardMaterial({
      color: 0xc83e2b,
      roughness: 0.75,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const courtBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1e40af,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const courtGreenMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.08,
      metalness: 0.88,
      side: THREE.DoubleSide
    });

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.9,
      metalness: 0.02
    });

    const palmTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a4638,
      roughness: 0.88,
      metalness: 0.02
    });

    // 12 Species Crown Materials - All Natural Green Palette
    // 1. Avenue Tree: Rich lush green
    const deciduousCrownMat = new THREE.MeshStandardMaterial({
      color: 0x27632a,
      roughness: 0.82,
      metalness: 0.02
    });

    // 2. Flowering Tree (Converted to soft fresh spring green)
    const blossomCrownMat = new THREE.MeshStandardMaterial({
      color: 0x3d7e35,
      roughness: 0.80,
      metalness: 0.02
    });

    // 3. Ornamental Tree (Converted to bright warm botanical green)
    const yellowCrownMat = new THREE.MeshStandardMaterial({
      color: 0x4d8830,
      roughness: 0.80,
      metalness: 0.02
    });

    // 4. Shade Tree (Medium-Large dense emerald green)
    const shadeCrownMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.82,
      metalness: 0.02
    });

    // 5. Palm Tree (Tropical arching fronds)
    const palmFrondMat = new THREE.MeshStandardMaterial({
      color: 0x347c2c,
      roughness: 0.75,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // 6. Columnar Tree (Italian Cypress / Columnar Poplar dark evergreen)
    const columnarCrownMat = new THREE.MeshStandardMaterial({
      color: 0x1b4324,
      roughness: 0.85,
      metalness: 0.02
    });

    // 7. Small Landscape Tree (Courtyard olive green)
    const ornamentalCrownMat = new THREE.MeshStandardMaterial({
      color: 0x3c853f,
      roughness: 0.8,
      metalness: 0.02
    });

    // 8. Flowering Red/Orange (Converted to vibrant foliage green)
    const redCrownMat = new THREE.MeshStandardMaterial({
      color: 0x2d6e32,
      roughness: 0.80,
      metalness: 0.02
    });

    // 9. Jacaranda-like Tree (Converted to rich medium forest green)
    const jacarandaCrownMat = new THREE.MeshStandardMaterial({
      color: 0x246331,
      roughness: 0.80,
      metalness: 0.02
    });

    // 10. Light Canopy Tree (Airy birch / acacia light lime-green)
    const lightCanopyMat = new THREE.MeshStandardMaterial({
      color: 0x65a30d,
      roughness: 0.8,
      metalness: 0.02
    });

    // 11. Shrub Tree Multi-stem (Fresh hedge green)
    const shrubBushMat = new THREE.MeshStandardMaterial({
      color: 0x1d5f24,
      roughness: 0.86,
      metalness: 0.02
    });

    // 12. Conifer Tree Evergreen (Deep spruce blue-pine green)
    const coniferCrownMat = new THREE.MeshStandardMaterial({
      color: 0x133820,
      roughness: 0.88,
      metalness: 0.02
    });

    const shrubMat = new THREE.MeshStandardMaterial({
      color: 0x1d4722,
      roughness: 0.85,
      metalness: 0.02
    });

    const mulchMat = new THREE.MeshStandardMaterial({
      color: 0x2e1c12,
      roughness: 0.95,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    return {
      primaryAsphaltMat,
      secondaryAsphaltMat,
      emergencyAsphaltMat,
      plainAsphaltMat,
      paverMat,
      plazaStoneMat,
      curbMat,
      grassMat,
      courtyardTurfMat,
      parcelTurfMat,
      tartanTrackMat,
      courtBlueMat,
      courtGreenMat,
      waterMat,
      trunkMat,
      palmTrunkMat,
      deciduousCrownMat,
      coniferCrownMat,
      ornamentalCrownMat,
      blossomCrownMat,
      yellowCrownMat,
      shadeCrownMat,
      palmFrondMat,
      columnarCrownMat,
      redCrownMat,
      jacarandaCrownMat,
      lightCanopyMat,
      shrubBushMat,
      shrubMat,
      mulchMat
    };
  }

  getSiteMetadata() {
    return {
      bounds: CAMPUS_BOUNDS,
      districts: CAMPUS_DISTRICTS,
      futurePlots: FUTURE_BUILDING_PLOTS,
      parkingFacilities: PARKING_FACILITIES,
      assemblyPlaza: CENTRAL_ASSEMBLY_PLAZA,
      lake: CAMPUS_LAKE,
      sportsComplex: SPORTS_COMPLEX,
      entrances: CAMPUS_ENTRANCES
    };
  }

  setVisibility(isVisible) {
    this.group.visible = isVisible;
  }

  dispose() {
    this.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.scene.remove(this.group);
  }
}
