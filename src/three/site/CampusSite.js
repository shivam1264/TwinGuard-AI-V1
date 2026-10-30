import * as THREE from 'three';
import { RoadNetwork } from './RoadNetwork.js';
import { PedestrianNetwork } from './PedestrianNetwork.js';
import { FuturePlotManager } from './FuturePlotManager.js';
import { CampusBuildingsManager } from './CampusBuildingsManager.js';
import { ParkingManager } from './ParkingManager.js';
import { LandscapeManager } from './LandscapeManager.js';
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

    // 3. Assemble Semantic Scenegraph
    this.group.add(this.landscapeManager.group);
    this.group.add(this.roadNetwork.group);
    this.group.add(this.pedestrianNetwork.group);
    this.group.add(this.parkingManager.group);
    this.group.add(this.futurePlotManager.group);
    this.group.add(this.buildingsManager.group);
  }

  initSharedMaterials() {
    // ------------------------------------------------------------------------
    // A. High-Resolution Primary Road Texture (Crisp White Markings + Dashed Center)
    // ------------------------------------------------------------------------
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 1024;
    roadCanvas.height = 1024;
    const rCtx = roadCanvas.getContext('2d');

    // Deep rich charcoal asphalt
    rCtx.fillStyle = '#1c222c';
    rCtx.fillRect(0, 0, 1024, 1024);

    // Fine mineral aggregate noise
    for (let i = 0; i < 9000; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 24 - 12);
      rCtx.fillStyle = `rgb(${28 + shade}, ${34 + shade}, ${44 + shade})`;
      rCtx.fillRect(rx, ry, 2, 2);
    }

    // Outer Solid White Demarcation Borders (26px wide, sharp & visible from 400m)
    rCtx.fillStyle = '#f8fafc';
    rCtx.fillRect(36, 0, 24, 1024);
    rCtx.fillRect(964, 0, 24, 1024);

    // Center Dashed White Separation Line (Clean 5.5m stripe per tile)
    rCtx.fillRect(501, 260, 22, 504);

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // B. Plain Asphalt (For Roundabout, Intersections & Parking Bays)
    // ------------------------------------------------------------------------
    const plainCanvas = document.createElement('canvas');
    plainCanvas.width = 512;
    plainCanvas.height = 512;
    const pCtx = plainCanvas.getContext('2d');
    pCtx.fillStyle = '#1c222c';
    pCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 4000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const shade = Math.floor(Math.random() * 22 - 11);
      pCtx.fillStyle = `rgb(${28 + shade}, ${34 + shade}, ${44 + shade})`;
      pCtx.fillRect(px, py, 2, 2);
    }
    const plainTex = new THREE.CanvasTexture(plainCanvas);
    plainTex.wrapS = THREE.RepeatWrapping;
    plainTex.wrapT = THREE.RepeatWrapping;
    plainTex.repeat.set(16, 16);
    plainTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // C. Architectural Concrete Pavers (For Pedestrian Walkways)
    // ------------------------------------------------------------------------
    const paverCanvas = document.createElement('canvas');
    paverCanvas.width = 512;
    paverCanvas.height = 512;
    const pvCtx = paverCanvas.getContext('2d');
    pvCtx.fillStyle = '#cbd5e1';
    pvCtx.fillRect(0, 0, 512, 512);

    const paverW = 64;
    const paverH = 32;
    let rowIdx = 0;
    for (let y = 0; y < 512; y += paverH) {
      const offset = (rowIdx % 2 === 0) ? 0 : paverW * 0.5;
      for (let x = -offset; x < 512; x += paverW) {
        const shade = Math.floor(Math.random() * 18 - 9);
        pvCtx.fillStyle = `rgb(${210 + shade}, ${220 + shade}, ${230 + shade})`;
        pvCtx.fillRect(x + 1.5, y + 1.5, paverW - 3, paverH - 3);
      }
      rowIdx++;
    }
    const paverTex = new THREE.CanvasTexture(paverCanvas);
    paverTex.wrapS = THREE.RepeatWrapping;
    paverTex.wrapT = THREE.RepeatWrapping;
    paverTex.repeat.set(2, 8);
    paverTex.anisotropy = 4;

    // ------------------------------------------------------------------------
    // D. Civic Plaza Large-Format Granite Paving
    // ------------------------------------------------------------------------
    const plazaCanvas = document.createElement('canvas');
    plazaCanvas.width = 512;
    plazaCanvas.height = 512;
    const plCtx = plazaCanvas.getContext('2d');
    plCtx.fillStyle = '#e2e8f0';
    plCtx.fillRect(0, 0, 512, 512);

    const slabSize = 64;
    for (let y = 0; y < 512; y += slabSize) {
      for (let x = 0; x < 512; x += slabSize) {
        const tone = Math.floor(Math.random() * 14 - 7);
        plCtx.fillStyle = `rgb(${226 + tone}, ${232 + tone}, ${240 + tone})`;
        plCtx.fillRect(x + 1, y + 1, slabSize - 2, slabSize - 2);
      }
    }
    const plazaTex = new THREE.CanvasTexture(plazaCanvas);
    plazaTex.wrapS = THREE.RepeatWrapping;
    plazaTex.wrapT = THREE.RepeatWrapping;
    plazaTex.repeat.set(6, 6);

    // ------------------------------------------------------------------------
    // E. Natural Master Campus Meadow Turf
    // ------------------------------------------------------------------------
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 1024;
    grassCanvas.height = 1024;
    const gCtx = grassCanvas.getContext('2d');
    gCtx.fillStyle = '#223812'; // Deep rich natural green base
    gCtx.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 22000; i++) {
      const gx = Math.random() * 1024;
      const gy = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 28 - 14);
      gCtx.fillStyle = `rgb(${34 + shade}, ${56 + shade}, ${18 + shade})`;
      gCtx.fillRect(gx, gy, 3, 3);
    }
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(36, 36);

    // ------------------------------------------------------------------------
    // F. Manicured Courtyard Turf (Subtly richer emerald tone)
    // ------------------------------------------------------------------------
    const courtyardCanvas = document.createElement('canvas');
    courtyardCanvas.width = 512;
    courtyardCanvas.height = 512;
    const cCtx = courtyardCanvas.getContext('2d');
    cCtx.fillStyle = '#1c3410';
    cCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 6000; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const shade = Math.floor(Math.random() * 22 - 11);
      cCtx.fillStyle = `rgb(${28 + shade}, ${52 + shade}, ${16 + shade})`;
      cCtx.fillRect(cx, cy, 2, 2);
    }
    const courtyardTex = new THREE.CanvasTexture(courtyardCanvas);
    courtyardTex.wrapS = THREE.RepeatWrapping;
    courtyardTex.wrapT = THREE.RepeatWrapping;
    courtyardTex.repeat.set(8, 8);

    // ------------------------------------------------------------------------
    // G. Development Parcel Sod / Graded Pad
    // ------------------------------------------------------------------------
    const parcelCanvas = document.createElement('canvas');
    parcelCanvas.width = 512;
    parcelCanvas.height = 512;
    const parCtx = parcelCanvas.getContext('2d');
    parCtx.fillStyle = '#5c6e3e'; // Rich warm golden-sage sod pad
    parCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const shade = Math.floor(Math.random() * 24 - 12);
      parCtx.fillStyle = `rgb(${92 + shade}, ${110 + shade}, ${62 + shade})`;
      parCtx.fillRect(px, py, 2.5, 2.5);
    }
    const parcelTex = new THREE.CanvasTexture(parcelCanvas);
    parcelTex.wrapS = THREE.RepeatWrapping;
    parcelTex.wrapT = THREE.RepeatWrapping;
    parcelTex.repeat.set(4, 4);

    // ------------------------------------------------------------------------
    // Assemble Materials (with side: THREE.DoubleSide to guarantee visibility!)
    // ------------------------------------------------------------------------
    const primaryAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e242d,
      map: plainTex,
      roughness: 0.8,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const secondaryAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x242d38,
      map: plainTex,
      roughness: 0.82,
      metalness: 0.06,
      side: THREE.DoubleSide
    });

    const emergencyAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x202834,
      map: plainTex,
      roughness: 0.8,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const plainAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1c222c,
      map: plainTex,
      roughness: 0.85,
      metalness: 0.06,
      side: THREE.DoubleSide
    });

    const paverMat = new THREE.MeshStandardMaterial({
      map: paverTex,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const plazaStoneMat = new THREE.MeshStandardMaterial({
      map: plazaTex,
      roughness: 0.65,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Crisp white/light architectural stone curb
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.96,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const courtyardTurfMat = new THREE.MeshStandardMaterial({
      map: courtyardTex,
      roughness: 0.94,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const parcelTurfMat = new THREE.MeshStandardMaterial({
      map: parcelTex,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // Sports Complex Materials
    const tartanTrackMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const courtBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const courtGreenMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Lake Water Material
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0e3846,
      roughness: 0.1,
      metalness: 0.85,
      side: THREE.DoubleSide
    });

    // Arboriculture Materials
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.88,
      metalness: 0.02
    });

    const deciduousCrownMat = new THREE.MeshStandardMaterial({
      color: 0x1e4620,
      roughness: 0.82,
      metalness: 0.02
    });

    const coniferCrownMat = new THREE.MeshStandardMaterial({
      color: 0x163824,
      roughness: 0.78,
      metalness: 0.02
    });

    const ornamentalCrownMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.85,
      metalness: 0.02
    });

    const blossomCrownMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.8,
      metalness: 0.02
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
      deciduousCrownMat,
      coniferCrownMat,
      ornamentalCrownMat,
      blossomCrownMat
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
