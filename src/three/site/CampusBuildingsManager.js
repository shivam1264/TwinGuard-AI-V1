import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FUTURE_BUILDING_PLOTS } from './CampusLayout.js';

// ============================================================================
// TWIN GUARD CAMPUS BUILDINGS MANAGER — EXTERIOR ARCHITECTURAL SYSTEMS
// ============================================================================
// Generates distinct, high-fidelity architectural exterior building structures
// across all 11 designated campus development parcels.
//
// DESIGN PRINCIPLES:
// 1. Exterior Envelope Only (No interior rooms/walls modeled - lightweight 60 FPS)
// 2. Clear Visual & Skyline Hierarchy (Heights 11.5m to 30.5m, below 40m Hero Building)
// 3. District-Specific Architectural Typologies:
//    - Stepped High-Rise Glass Tower (Plot P01 - Innovation Tower)
//    - L-Shaped Dual Wing with Corner Atrium (Plot P02 - Advanced Computing Lab)
//    - Courtyard Cleanroom Pavilion with Pyramid Skylight (Plot P03 - Microelectronics)
//    - Cascading Stepped Green Terraces (Plot P07 - Life Sciences & Genomics)
//    - Elongated Modular Academic Hall with Pylons (Plot P08 - Engineering Complex)
//    - Modernist Corporate Office with Cantilever (Plot P04 - Executive Strategy & R&D)
//    - High-Tech Data Center Fortress (Plot P05 - Supercomputing & Data Hub)
//    - Dual-Volume Robotics Hangar with Helipad (Plot P06 - Autonomous Robotics)
//    - Sculptural Civic Forum with Curved Glass Arc (Plot P09 - Student Forum)
//    - Deconstructivist Interlocking Studio Cubes (Plot P10 - Design & Media Arts)
//    - Industrial Utility Plant with Loading Docks (Plot P12 - Central Energy Plant)
// 4. Detailed Rooftop MEP (Stone parapets, chillers, cooling towers, fan cowls, vents, solar arrays)
// 5. Geometries merged per material per building for ultra-fast single-pass rendering.

export class CampusBuildingsManager {
  constructor(sharedMaterials) {
    this.sharedMaterials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'CampusBuildings';
    this.group.userData = { id: 'BUILDINGS-CONTAINER', type: 'CAMPUS_BUILDINGS_SYSTEM' };

    // Initialize specialized architectural facade materials & textures
    this.materials = this.initBuildingMaterials();

    // Build all 11 campus buildings
    this.buildCampusBuildings();
  }

  // ==========================================================================
  // 1. HIGH-FIDELITY ARCHITECTURAL FACADE MATERIALS & PROCEDURAL TEXTURES
  // ==========================================================================
  initBuildingMaterials() {
    // A. Blue Reflective Curtain Wall (Innovation Tower, Executive R&D)
    const curtainBlueTex = this.createCurtainWallTexture({
      glassTop: '#2563eb',
      glassBottom: '#1e293b',
      spandrelColor: '#e2e8f0', // Crisp aluminum-white spandrel
      mullionColor: '#0f172a',
      floors: 6
    });

    // B. Teal / Seafoam Bio-Molecular Curtain Wall (Life Sciences)
    const curtainTealTex = this.createCurtainWallTexture({
      glassTop: '#0d9488',
      glassBottom: '#042f2e',
      spandrelColor: '#cbd5e1',
      mullionColor: '#0f172a',
      floors: 6
    });

    // C. Ribbon Window Cladding (Advanced Computing, Robotics Wing)
    const ribbonWindowTex = this.createRibbonWindowTexture({
      wallColor: '#1e293b',
      glassColor: '#1e40af',
      mullionColor: '#020617'
    });

    // D. Architectural Terracotta Modular Facade (Engineering Complex)
    const terracottaTex = this.createTerracottaTexture();

    // E. Ultra-Clean Precast White Architectural Concrete (Microelectronics)
    const cleanroomTex = this.createCleanroomTexture();

    // F. Dark Graphite High-Tech Louvered Cladding (Supercomputing Data Hub)
    const dataHubTex = this.createDataHubTexture();

    // G. Industrial Corrugated Metal Cladding (Central Energy Plant)
    const industrialTex = this.createIndustrialPanelTexture();

    // H. Solar PV Photovoltaic Array Texture
    const solarTex = this.createSolarPanelTexture();

    // I. Autonomous Drone Helipad Texture
    const helipadTex = this.createHelipadTexture();

    // J. Commercial Loading Dock Roll-up Bay Door Texture
    const bayDoorTex = this.createBayDoorTexture();

    // K. Civic Forum Limestone Texture (Student Forum)
    const civicForumTex = this.createCivicForumTexture();

    // Materials Palette
    const glassBlueMat = new THREE.MeshStandardMaterial({
      map: curtainBlueTex,
      roughness: 0.18,
      metalness: 0.8
    });

    const glassTealMat = new THREE.MeshStandardMaterial({
      map: curtainTealTex,
      roughness: 0.18,
      metalness: 0.8
    });

    const ribbonDarkMat = new THREE.MeshStandardMaterial({
      map: ribbonWindowTex,
      roughness: 0.35,
      metalness: 0.55
    });

    const terracottaMat = new THREE.MeshStandardMaterial({
      map: terracottaTex,
      roughness: 0.55,
      metalness: 0.2
    });

    const cleanroomWhiteMat = new THREE.MeshStandardMaterial({
      map: cleanroomTex,
      roughness: 0.55,
      metalness: 0.15
    });

    const dataHubGraphiteMat = new THREE.MeshStandardMaterial({
      map: dataHubTex,
      roughness: 0.45,
      metalness: 0.4
    });

    const industrialPanelMat = new THREE.MeshStandardMaterial({
      map: industrialTex,
      roughness: 0.5,
      metalness: 0.5
    });

    const civicForumMat = new THREE.MeshStandardMaterial({
      map: civicForumTex,
      roughness: 0.6,
      metalness: 0.15
    });

    const concretePlinthMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Architectural slate concrete
      roughness: 0.8,
      metalness: 0.1
    });

    // Architectural Roof Parapet Coping (Light Stone / Anodized Aluminum - NO BLACK WIRE LOOK!)
    const parapetCopingMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.45,
      metalness: 0.4
    });

    const metalTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75
    });

    const roofMembraneMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Soft slate roof membrane
      roughness: 0.85,
      metalness: 0.1
    });

    const mepChillerMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.4,
      metalness: 0.6
    });

    const solarPanelMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.15,
      metalness: 0.9
    });

    const helipadMat = new THREE.MeshStandardMaterial({
      map: helipadTex,
      roughness: 0.7,
      metalness: 0.15
    });

    const bayDoorMat = new THREE.MeshStandardMaterial({
      map: bayDoorTex,
      roughness: 0.45,
      metalness: 0.6
    });

    const yellowBollardMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.3,
      metalness: 0.4
    });

    return {
      glassBlueMat,
      glassTealMat,
      ribbonDarkMat,
      terracottaMat,
      cleanroomWhiteMat,
      dataHubGraphiteMat,
      industrialPanelMat,
      civicForumMat,
      concretePlinthMat,
      parapetCopingMat,
      metalTrimMat,
      roofMembraneMat,
      mepChillerMat,
      solarPanelMat,
      helipadMat,
      bayDoorMat,
      yellowBollardMat
    };
  }

  // ==========================================================================
  // 2. PROCEDURAL CANVAS TEXTURE GENERATORS
  // ==========================================================================
  createCurtainWallTexture({ glassTop, glassBottom, spandrelColor, mullionColor, floors }) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const floorH = 512 / floors;
    const spandrelH = floorH * 0.28;
    const glassH = floorH - spandrelH;

    for (let f = 0; f < floors; f++) {
      const yTop = f * floorH;

      // Spandrel band
      ctx.fillStyle = spandrelColor;
      ctx.fillRect(0, yTop, 512, spandrelH);

      // Spandrel highlights & shadow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(0, yTop, 512, 1.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, yTop + spandrelH - 1.5, 512, 1.5);

      // Glass window band
      const glassGrad = ctx.createLinearGradient(0, yTop + spandrelH, 0, yTop + floorH);
      glassGrad.addColorStop(0, glassTop);
      glassGrad.addColorStop(1, glassBottom);
      ctx.fillStyle = glassGrad;
      ctx.fillRect(0, yTop + spandrelH, 512, glassH);

      // Glass subtle reflection sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(0, yTop + spandrelH, 512, glassH * 0.4);
    }

    // Vertical structural mullions
    const mullionSpacing = 64;
    for (let x = 0; x < 512; x += mullionSpacing) {
      ctx.fillStyle = mullionColor;
      ctx.fillRect(x - 1.5, 0, 3, 512);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x - 1.5, 0, 1, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  createRibbonWindowTexture({ wallColor, glassColor, mullionColor }) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const floors = 6;
    const floorH = 512 / floors;
    const ribbonH = floorH * 0.52;
    const wallH = floorH - ribbonH;

    for (let f = 0; f < floors; f++) {
      const yTop = f * floorH;

      // Solid stone/metal wall band
      ctx.fillStyle = wallColor;
      ctx.fillRect(0, yTop, 512, wallH);

      // Glass ribbon
      ctx.fillStyle = glassColor;
      ctx.fillRect(0, yTop + wallH, 512, ribbonH);

      // Glass highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, yTop + wallH, 512, ribbonH * 0.4);

      // Shadow reveal under wall
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, yTop + wallH, 512, 2);
    }

    // Mullions
    for (let x = 0; x < 512; x += 48) {
      ctx.fillStyle = mullionColor;
      ctx.fillRect(x - 1.5, 0, 3, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  createTerracottaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9a3412';
    ctx.fillRect(0, 0, 512, 512);

    const tileW = 64;
    const tileH = 32;
    for (let y = 0; y < 512; y += tileH) {
      for (let x = 0; x < 512; x += tileW) {
        const shade = Math.floor(Math.random() * 20 - 10);
        ctx.fillStyle = `rgb(${154 + shade}, ${52 + shade}, ${18 + shade})`;
        ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

        // Bronze glass window insert on every 2nd tile
        if ((x / tileW) % 2 === 1 && (y / tileH) % 3 !== 0) {
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(x + 4, y + 4, tileW - 8, tileH - 8);
          ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
          ctx.fillRect(x + 4, y + 4, tileW - 8, (tileH - 8) * 0.5);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  createCleanroomTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    const floors = 5;
    const floorH = 512 / floors;
    for (let f = 0; f < floors; f++) {
      const y = f * floorH;
      // Precision narrow ribbon window
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, y + floorH * 0.45, 512, floorH * 0.35);

      // Reflective blue-cyan tint
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.fillRect(0, y + floorH * 0.45, 512, floorH * 0.2);

      // Panel joint line
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, y, 512, 2);
    }

    for (let x = 0; x < 512; x += 64) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x, 0, 2, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  createCivicForumTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm architectural limestone / travertine base
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 512, 512);

    // Ashlar stone masonry lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Grand horizontal ribbon glass windows on floors 2, 3, 4
    for (let f = 1; f < 4; f++) {
      const y = f * 128;
      const glassGrad = ctx.createLinearGradient(0, y, 0, y + 64);
      glassGrad.addColorStop(0, '#1e40af');
      glassGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(0, y, 512, 60);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, y, 512, 20);

      // Mullions
      ctx.fillStyle = '#0f172a';
      for (let x = 0; x < 512; x += 48) {
        ctx.fillRect(x, y, 3, 60);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  createDataHubTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Horizontal louver slats
    const louverH = 16;
    for (let y = 0; y < 512; y += louverH) {
      const grad = ctx.createLinearGradient(0, y, 0, y + louverH);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, 512, louverH - 3);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, y, 512, 1);
    }

    // Cyan LED security accent lines
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.fillRect(0, 126, 512, 3);
    ctx.fillRect(0, 254, 512, 3);
    ctx.fillRect(0, 382, 512, 3);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  createIndustrialPanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 256, 256);

    // Corrugated metal vertical ribs
    const ribW = 16;
    for (let x = 0; x < 256; x += ribW) {
      const grad = ctx.createLinearGradient(x, 0, x + ribW, 0);
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(0.4, '#475569');
      grad.addColorStop(0.9, '#334155');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, ribW, 256);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, 0, 1.5, 256);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  createSolarPanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let y = 0; y <= 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    for (let x = 0; x <= 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 0, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  createHelipadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark tarmac pad
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    // White perimeter square
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 12;
    ctx.strokeRect(32, 32, 448, 448);

    // Yellow circle
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, Math.PI * 2);
    ctx.stroke();

    // Bold yellow letter H
    ctx.fillStyle = '#eab308';
    const barW = 34;
    const hH = 180;
    const hW = 140;
    ctx.fillRect(256 - hW * 0.5, 256 - hH * 0.5, barW, hH);
    ctx.fillRect(256 + hW * 0.5 - barW, 256 - hH * 0.5, barW, hH);
    ctx.fillRect(256 - hW * 0.5, 256 - barW * 0.5, hW, barW);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  createBayDoorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 256, 256);

    const slatH = 28;
    for (let y = 0; y < 256; y += slatH) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, y, 256, slatH - 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, y, 256, 1.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, y + slatH - 3, 256, 3);
    }

    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = (x / 32) % 2 === 0 ? '#eab308' : '#0f172a';
      ctx.fillRect(x, 226, 32, 30);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // ==========================================================================
  // 3. ARCHITECTURAL COMPONENT GENERATORS (ROOF, CANOPY, MEP, PARAPET)
  // ==========================================================================

  // 4-Sided Perimeter Parapet Coping
  createParapetGeometry(w, d, h = 1.0, thick = 0.45, elevY = 0) {
    const halfW = w * 0.5;
    const halfD = d * 0.5;
    const n = new THREE.BoxGeometry(w + thick, h, thick);
    n.translate(0, elevY + h * 0.5, -halfD);

    const s = new THREE.BoxGeometry(w + thick, h, thick);
    s.translate(0, elevY + h * 0.5, halfD);

    const wt = new THREE.BoxGeometry(thick, h, d);
    wt.translate(-halfW, elevY + h * 0.5, 0);

    const e = new THREE.BoxGeometry(thick, h, d);
    e.translate(halfW, elevY + h * 0.5, 0);

    return BufferGeometryUtils.mergeGeometries([n, s, wt, e]);
  }

  // Rooftop HVAC Chiller Unit with twin circular fan cowls
  createChillerGeometry(x, y, z, w = 3.6, d = 2.4, h = 1.8) {
    const body = new THREE.BoxGeometry(w, h, d);
    body.translate(x, y + h * 0.5, z);

    const fan1 = new THREE.CylinderGeometry(0.7, 0.7, 0.35, 16);
    fan1.translate(x - w * 0.25, y + h + 0.175, z);

    const fan2 = new THREE.CylinderGeometry(0.7, 0.7, 0.35, 16);
    fan2.translate(x + w * 0.25, y + h + 0.175, z);

    return BufferGeometryUtils.mergeGeometries([body, fan1, fan2]);
  }

  // Industrial Cylindrical Cooling Tower
  createCoolingTowerGeometry(x, y, z, radius = 2.2, height = 2.8) {
    const cylinder = new THREE.CylinderGeometry(radius * 0.88, radius, height, 20);
    cylinder.translate(x, y + height * 0.5, z);

    const cowl = new THREE.CylinderGeometry(radius * 0.95, radius * 0.88, 0.4, 20);
    cowl.translate(x, y + height + 0.2, z);

    return BufferGeometryUtils.mergeGeometries([cylinder, cowl]);
  }

  // Slender Cantilevered Entrance Canopy with Twin Columns
  createEntranceCanopyGeometries(x, y, z, w = 12, d = 4.5, h = 0.35, colH = 4.5) {
    const slab = new THREE.BoxGeometry(w, h, d);
    slab.translate(x, y + colH, z);

    const colR = 0.18;
    const col1 = new THREE.CylinderGeometry(colR, colR, colH, 12);
    col1.translate(x - w * 0.4, y + colH * 0.5, z + d * 0.4);

    const col2 = new THREE.CylinderGeometry(colR, colR, colH, 12);
    col2.translate(x + w * 0.4, y + colH * 0.5, z + d * 0.4);

    const apron = new THREE.BoxGeometry(w + 2.0, 0.18, d + 2.0);
    apron.translate(x, y + 0.09, z);

    return {
      canopy: slab,
      columns: BufferGeometryUtils.mergeGeometries([col1, col2]),
      apron
    };
  }

  // Solar Photovoltaic Rack (Angled Panels)
  createSolarRackGeometry(startX, y, startZ, countX = 3, countZ = 2, panelW = 3.2, panelD = 1.8, tilt = 0.35) {
    const geos = [];
    for (let ix = 0; ix < countX; ix++) {
      for (let iz = 0; iz < countZ; iz++) {
        const p = new THREE.PlaneGeometry(panelW, panelD);
        p.rotateX(-Math.PI * 0.5 + tilt);
        p.translate(startX + ix * (panelW + 0.8), y + 0.6, startZ + iz * (panelD + 1.2));
        geos.push(p);
      }
    }
    return BufferGeometryUtils.mergeGeometries(geos);
  }

  // ==========================================================================
  // 4. MASTER BUILDINGS COMPOSITION (ALL 11 BUILDINGS)
  // ==========================================================================
  buildCampusBuildings() {
    FUTURE_BUILDING_PLOTS.forEach(plot => {
      let buildingGroup = null;

      switch (plot.id) {
        case 'PLOT-P01':
          buildingGroup = this.buildInnovationTower(plot);
          break;
        case 'PLOT-P02':
          buildingGroup = this.buildAdvancedComputingLab(plot);
          break;
        case 'PLOT-P03':
          buildingGroup = this.buildMicroelectronicsPavilion(plot);
          break;
        case 'PLOT-P07':
          buildingGroup = this.buildLifeSciencesGenomics(plot);
          break;
        case 'PLOT-P08':
          buildingGroup = this.buildEngineeringComplex(plot);
          break;
        case 'PLOT-P04':
          buildingGroup = this.buildExecutiveStrategyRD(plot);
          break;
        case 'PLOT-P05':
          buildingGroup = this.buildSupercomputingDataHub(plot);
          break;
        case 'PLOT-P06':
          buildingGroup = this.buildAutonomousRoboticsComplex(plot);
          break;
        case 'PLOT-P09':
          buildingGroup = this.buildStudentForumArena(plot);
          break;
        case 'PLOT-P10':
          buildingGroup = this.buildDesignMediaCenter(plot);
          break;
        case 'PLOT-P12':
          buildingGroup = this.buildCentralEnergyPlant(plot);
          break;
        default:
          break;
      }

      if (buildingGroup) {
        this.group.add(buildingGroup);
      }
    });
  }

  // --------------------------------------------------------------------------
  // PLOT P01: INNOVATION TOWER (8 Storeys, Technology Flagship High-Rise)
  // --------------------------------------------------------------------------
  buildInnovationTower(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;
    const podiumH = 11.4; // Floors 1-3
    const towerH = 19.0;  // Floors 4-8 (Total height ~30.7m)

    // 1. Concrete Plinth
    const plinth = new THREE.BoxGeometry(40, plinthH, 32);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // 2. Podium (Floors 1-3)
    const podium = new THREE.BoxGeometry(38, podiumH, 30);
    podium.translate(0, baseY + plinthH + podiumH * 0.5, 0);
    glassGeos.push(podium);

    // Podium Roof Terrace Parapet & Floor
    const podRoofY = baseY + plinthH + podiumH;
    parapetGeos.push(this.createParapetGeometry(38, 30, 0.9, 0.4, podRoofY));
    const podRoofFloor = new THREE.PlaneGeometry(37.5, 29.5);
    podRoofFloor.rotateX(-Math.PI * 0.5);
    podRoofFloor.translate(0, podRoofY + 0.05, 0);
    roofGeos.push(podRoofFloor);

    // 3. Setback Tower (Floors 4-8)
    const tower = new THREE.BoxGeometry(28, towerH, 22);
    tower.translate(0, podRoofY + towerH * 0.5, 0);
    glassGeos.push(tower);

    // 4. Tower Roof Parapet & Floor
    const towerRoofY = podRoofY + towerH;
    parapetGeos.push(this.createParapetGeometry(28, 22, 1.0, 0.45, towerRoofY));
    const towerRoofFloor = new THREE.PlaneGeometry(27.5, 21.5);
    towerRoofFloor.rotateX(-Math.PI * 0.5);
    towerRoofFloor.translate(0, towerRoofY + 0.05, 0);
    roofGeos.push(towerRoofFloor);

    // 5. Rooftop Louvered Elevator Penthouse
    const phH = 3.8;
    const penthouse = new THREE.BoxGeometry(14, phH, 10);
    penthouse.translate(0, towerRoofY + phH * 0.5, 0);
    mepGeos.push(penthouse);

    // 6. Communications Spire / Antenna
    const spireH = 9.0;
    const spire = new THREE.CylinderGeometry(0.08, 0.22, spireH, 8);
    spire.translate(0, towerRoofY + phH + spireH * 0.5, 0);
    trimGeos.push(spire);

    // 7. HVAC Chiller Units
    mepGeos.push(this.createChillerGeometry(-7.5, towerRoofY, 4, 3.8, 2.4, 1.8));
    mepGeos.push(this.createChillerGeometry(7.5, towerRoofY, 4, 3.8, 2.4, 1.8));

    // 8. West Entrance Canopy & Apron
    const canopyData = this.createEntranceCanopyGeometries(0, baseY, 16.5, 14, 4.5, 0.4, 4.8);
    trimGeos.push(canopyData.canopy, canopyData.columns);
    concreteGeos.push(canopyData.apron);

    // Vertical Sunshade Fins
    for (let x = -12; x <= 12; x += 4) {
      const fin = new THREE.BoxGeometry(0.2, towerH, 0.5);
      fin.translate(x, podRoofY + towerH * 0.5, 11.25);
      trimGeos.push(fin);
    }

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.glassBlueMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P02: ADVANCED COMPUTING LAB (6 Storeys, L-Shaped Dual Wing)
  // --------------------------------------------------------------------------
  buildAdvancedComputingLab(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;
    const bHeight = 22.8; // 6 Storeys

    // Wing A: North-South (16m wide x 34m deep)
    const wingA = new THREE.BoxGeometry(16, bHeight, 34);
    wingA.translate(-7, baseY + plinthH + bHeight * 0.5, 2);
    glassGeos.push(wingA);

    // Wing B: East-West (24m wide x 16m deep)
    const wingB = new THREE.BoxGeometry(24, bHeight, 16);
    wingB.translate(11, baseY + plinthH + bHeight * 0.5, -7);
    glassGeos.push(wingB);

    // Plinth
    const plinthA = new THREE.BoxGeometry(17.5, plinthH, 35.5);
    plinthA.translate(-7, baseY + plinthH * 0.5, 2);
    const plinthB = new THREE.BoxGeometry(25.5, plinthH, 17.5);
    plinthB.translate(11, baseY + plinthH * 0.5, -7);
    concreteGeos.push(plinthA, plinthB);

    // Inner Corner Glass Atrium
    const atriumR = 7.5;
    const atrium = new THREE.CylinderGeometry(atriumR, atriumR, bHeight, 16, 1, false, 0, Math.PI * 0.5);
    atrium.translate(1, baseY + plinthH + bHeight * 0.5, 1);
    glassGeos.push(atrium);

    // Roof Parapets
    const roofY = baseY + plinthH + bHeight;
    const parA = this.createParapetGeometry(16, 34, 1.0, 0.45, roofY);
    parA.translate(-7, 0, 2);
    const parB = this.createParapetGeometry(24, 16, 1.0, 0.45, roofY);
    parB.translate(11, 0, -7);
    parapetGeos.push(parA, parB);

    // Roof Floor Planes
    const rfA = new THREE.PlaneGeometry(15.5, 33.5);
    rfA.rotateX(-Math.PI * 0.5);
    rfA.translate(-7, roofY + 0.05, 2);
    const rfB = new THREE.PlaneGeometry(23.5, 15.5);
    rfB.rotateX(-Math.PI * 0.5);
    rfB.translate(11, roofY + 0.05, -7);
    roofGeos.push(rfA, rfB);

    // Dual HVAC Chiller Banks
    mepGeos.push(this.createChillerGeometry(-7, roofY, 10, 3.6, 2.4, 1.8));
    mepGeos.push(this.createChillerGeometry(-7, roofY, -6, 3.6, 2.4, 1.8));
    mepGeos.push(this.createChillerGeometry(15, roofY, -7, 3.6, 2.4, 1.8));

    // Louvered Acoustic MEP Screen
    const screen = new THREE.BoxGeometry(10, 2.4, 8);
    screen.translate(-7, roofY + 1.2, 2);
    mepGeos.push(screen);

    // Entrance Canopy at Inner Corner
    const canopyData = this.createEntranceCanopyGeometries(5, baseY, 11, 10, 4.0, 0.35, 4.2);
    trimGeos.push(canopyData.canopy, canopyData.columns);
    concreteGeos.push(canopyData.apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.ribbonDarkMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P03: MICROELECTRONICS PAVILION (5 Storeys, Courtyard Architecture)
  // --------------------------------------------------------------------------
  buildMicroelectronicsPavilion(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;
    const bHeight = 19.0; // 5 Storeys

    // Courtyard Perimeter Block (40m x 36m, inner 16m x 14m)
    const plinth = new THREE.BoxGeometry(42, plinthH, 38);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    const nWing = new THREE.BoxGeometry(40, bHeight, 11);
    nWing.translate(0, baseY + plinthH + bHeight * 0.5, -12.5);
    const sWing = new THREE.BoxGeometry(40, bHeight, 11);
    sWing.translate(0, baseY + plinthH + bHeight * 0.5, 12.5);
    const wWing = new THREE.BoxGeometry(12, bHeight, 14);
    wWing.translate(-14, baseY + plinthH + bHeight * 0.5, 0);
    const eWing = new THREE.BoxGeometry(12, bHeight, 14);
    eWing.translate(14, baseY + plinthH + bHeight * 0.5, 0);

    glassGeos.push(nWing, sWing, wWing, eWing);

    // Central Glass Pyramid Skylight
    const pyrH = 3.2;
    const pyramid = new THREE.ConeGeometry(9.5, pyrH, 4);
    pyramid.rotateY(Math.PI * 0.25);
    pyramid.translate(0, baseY + plinthH + bHeight + pyrH * 0.5, 0);
    glassGeos.push(pyramid);

    // Roof Parapet Coping
    const roofY = baseY + plinthH + bHeight;
    parapetGeos.push(this.createParapetGeometry(40, 36, 1.0, 0.45, roofY));

    // Solar PV Array on South Wing Roof
    const solarRack = this.createSolarRackGeometry(-12, roofY, 9, 3, 2, 3.2, 1.8, 0.35);
    if (solarRack) trimGeos.push(solarRack);

    mepGeos.push(this.createChillerGeometry(-12, roofY, -12.5, 3.8, 2.4, 1.8));
    mepGeos.push(this.createChillerGeometry(12, roofY, -12.5, 3.8, 2.4, 1.8));

    // West Cantilevered Glass Entrance Cube
    const cubeW = 12;
    const cubeH = 5.2;
    const cubeD = 4.5;
    const entryCube = new THREE.BoxGeometry(cubeW, cubeH, cubeD);
    entryCube.translate(-21, baseY + cubeH * 0.5, 0);
    glassGeos.push(entryCube);

    const canopyData = this.createEntranceCanopyGeometries(-22, baseY, 0, 10, 3.5, 0.35, 4.5);
    trimGeos.push(canopyData.canopy);
    concreteGeos.push(canopyData.apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.cleanroomWhiteMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P07: LIFE SCIENCES & GENOMICS (6 Storeys, Stepped Green Terraces)
  // --------------------------------------------------------------------------
  buildLifeSciencesGenomics(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;

    // Plinth
    const plinth = new THREE.BoxGeometry(40, plinthH, 36);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Tier 1 (South): 2 Storeys (7.6m) with Rooftop Garden
    const t1H = 7.6;
    const tier1 = new THREE.BoxGeometry(38, t1H, 10);
    tier1.translate(0, baseY + plinthH + t1H * 0.5, 11);
    glassGeos.push(tier1);

    const t1RoofY = baseY + plinthH + t1H;
    parapetGeos.push(this.createParapetGeometry(38, 10, 0.9, 0.4, t1RoofY));
    const t1Turf = new THREE.PlaneGeometry(37, 9);
    t1Turf.rotateX(-Math.PI * 0.5);
    t1Turf.translate(0, t1RoofY + 0.05, 11);
    roofGeos.push(t1Turf);

    // Tier 2 (Center): 4 Storeys (15.2m) with Solar Array
    const t2H = 15.2;
    const tier2 = new THREE.BoxGeometry(38, t2H, 12);
    tier2.translate(0, baseY + plinthH + t2H * 0.5, 0);
    glassGeos.push(tier2);

    const t2RoofY = baseY + plinthH + t2H;
    parapetGeos.push(this.createParapetGeometry(38, 12, 0.9, 0.4, t2RoofY));
    const solarT2 = this.createSolarRackGeometry(-10, t2RoofY, -2, 3, 2, 3.2, 1.8, 0.35);
    if (solarT2) trimGeos.push(solarT2);

    // Tier 3 (North): 6 Storeys (22.8m) Main Laboratory Block
    const t3H = 22.8;
    const tier3 = new THREE.BoxGeometry(38, t3H, 12);
    tier3.translate(0, baseY + plinthH + t3H * 0.5, -11);
    glassGeos.push(tier3);

    const t3RoofY = baseY + plinthH + t3H;
    parapetGeos.push(this.createParapetGeometry(38, 12, 1.0, 0.45, t3RoofY));
    mepGeos.push(this.createChillerGeometry(-8, t3RoofY, -11, 3.8, 2.4, 1.8));
    mepGeos.push(this.createChillerGeometry(8, t3RoofY, -11, 3.8, 2.4, 1.8));

    // South Entrance Canopy
    const canopyData = this.createEntranceCanopyGeometries(0, baseY, 17.5, 12, 4.0, 0.35, 4.2);
    trimGeos.push(canopyData.canopy, canopyData.columns);
    concreteGeos.push(canopyData.apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.glassTealMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P08: ENGINEERING COMPLEX (5 Storeys, Elongated Modular Academic Hall)
  // --------------------------------------------------------------------------
  buildEngineeringComplex(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;
    const bHeight = 19.0; // 5 Storeys

    // Plinth
    const plinth = new THREE.BoxGeometry(48, plinthH, 26);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Main Body (46m wide x 24m deep x 19m high)
    const body = new THREE.BoxGeometry(46, bHeight, 24);
    body.translate(0, baseY + plinthH + bHeight * 0.5, 0);
    glassGeos.push(body);

    // Expressed Structural Grid: 8 Vertical Pylons on front & back
    for (let x = -21; x <= 21; x += 6) {
      const pylonF = new THREE.BoxGeometry(0.8, bHeight + 0.6, 0.8);
      pylonF.translate(x, baseY + plinthH + (bHeight + 0.6) * 0.5, 12.2);
      const pylonB = new THREE.BoxGeometry(0.8, bHeight + 0.6, 0.8);
      pylonB.translate(x, baseY + plinthH + (bHeight + 0.6) * 0.5, -12.2);
      concreteGeos.push(pylonF, pylonB);
    }

    // Roof Parapet & Equipment
    const roofY = baseY + plinthH + bHeight;
    parapetGeos.push(this.createParapetGeometry(46, 24, 1.0, 0.45, roofY));

    // Twin Penthouse Enclosures
    const ph1 = new THREE.BoxGeometry(10, 3.2, 8);
    ph1.translate(-14, roofY + 1.6, 0);
    const ph2 = new THREE.BoxGeometry(10, 3.2, 8);
    ph2.translate(14, roofY + 1.6, 0);
    mepGeos.push(ph1, ph2);

    // 4 Industrial Exhaust Flues
    for (let i = 0; i < 4; i++) {
      const flue = new THREE.CylinderGeometry(0.3, 0.3, 4.0, 12);
      flue.translate(-5 + i * 3.5, roofY + 2.0, 4);
      trimGeos.push(flue);
    }

    // South Entrance Portico
    const canopyData = this.createEntranceCanopyGeometries(0, baseY, 13.5, 12, 4.2, 0.4, 4.5);
    trimGeos.push(canopyData.canopy, canopyData.columns);
    concreteGeos.push(canopyData.apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.terracottaMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P04: EXECUTIVE STRATEGY & R&D (5 Storeys, Modernist Corporate Cantilever)
  // --------------------------------------------------------------------------
  buildExecutiveStrategyRD(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;
    const lowerH = 15.2; // Floors 1-4
    const pentH = 3.8;   // Floor 5 Executive Suite

    // Plinth
    const plinth = new THREE.BoxGeometry(40, plinthH, 30);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Lower Corporate Block (Floors 1-4)
    const lowerBlock = new THREE.BoxGeometry(38, lowerH, 28);
    lowerBlock.translate(0, baseY + plinthH + lowerH * 0.5, 0);
    glassGeos.push(lowerBlock);

    // 5th Floor Recessed Executive Suite
    const pentY = baseY + plinthH + lowerH;
    const pent = new THREE.BoxGeometry(26, pentH, 18);
    pent.translate(0, pentY + pentH * 0.5, 0);
    glassGeos.push(pent);

    // Terrace Parapet around lower roof
    parapetGeos.push(this.createParapetGeometry(38, 28, 0.9, 0.4, pentY));

    // Floating Architectural Roof Canopy over penthouse
    const canopyRoof = new THREE.BoxGeometry(30, 0.4, 22);
    canopyRoof.translate(0, pentY + pentH + 0.2, 0);
    parapetGeos.push(canopyRoof);

    // Compact Rooftop Chiller
    mepGeos.push(this.createChillerGeometry(8, pentY + pentH + 0.45, 0, 3.2, 2.0, 1.6));

    // Grand Floating Entrance Portico
    const canopyData = this.createEntranceCanopyGeometries(0, baseY, 16.5, 14, 5.2, 0.4, 5.0);
    trimGeos.push(canopyData.canopy, canopyData.columns);
    concreteGeos.push(canopyData.apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.glassBlueMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P05: SUPERCOMPUTING & DATA HUB (4 Storeys, High-Tech Fortress)
  // --------------------------------------------------------------------------
  buildSupercomputingDataHub(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.4;
    const bHeight = 15.5; // 4 Storeys

    // Heavy Plinth
    const plinth = new THREE.BoxGeometry(44, plinthH, 36);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Main Solid Monolith
    const monolith = new THREE.BoxGeometry(42, bHeight, 34);
    monolith.translate(0, baseY + plinthH + bHeight * 0.5, 0);
    glassGeos.push(monolith);

    // Roof Parapet
    const roofY = baseY + plinthH + bHeight;
    parapetGeos.push(this.createParapetGeometry(42, 34, 1.0, 0.45, roofY));

    // Heavy Industrial Cooling Plant: 4 Large Cylindrical Cooling Towers
    mepGeos.push(this.createCoolingTowerGeometry(-12, roofY, -8, 2.2, 2.8));
    mepGeos.push(this.createCoolingTowerGeometry(-5, roofY, -8, 2.2, 2.8));
    mepGeos.push(this.createCoolingTowerGeometry(5, roofY, -8, 2.2, 2.8));
    mepGeos.push(this.createCoolingTowerGeometry(12, roofY, -8, 2.2, 2.8));

    // 2 Backup Generator Enclosures with Silencers
    const gen1 = new THREE.BoxGeometry(6, 2.5, 4);
    gen1.translate(-8, roofY + 1.25, 8);
    const gen2 = new THREE.BoxGeometry(6, 2.5, 4);
    gen2.translate(8, roofY + 1.25, 8);
    mepGeos.push(gen1, gen2);

    // Secure Biometric Entrance Vestibule
    const vest = new THREE.BoxGeometry(10, 4.2, 4);
    vest.translate(0, baseY + 2.1, 18);
    concreteGeos.push(vest);

    const canopyData = this.createEntranceCanopyGeometries(0, baseY, 19.5, 8, 3.2, 0.35, 4.0);
    trimGeos.push(canopyData.canopy);
    concreteGeos.push(canopyData.apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.dataHubGraphiteMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P06: AUTONOMOUS ROBOTICS COMPLEX (Dual Volume Hangar + 5-Storey Wing)
  // --------------------------------------------------------------------------
  buildAutonomousRoboticsComplex(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;

    // Plinth
    const plinth = new THREE.BoxGeometry(42, plinthH, 36);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Volume 1: High-Bay Testing Hangar (22m wide x 24m deep x 11m high)
    const hangarH = 11.0;
    const hangar = new THREE.BoxGeometry(22, hangarH, 24);
    hangar.translate(-9, baseY + plinthH + hangarH * 0.5, 0);
    glassGeos.push(hangar);

    // Hangar Roof Parapet & Drone Helipad
    const hangarRoofY = baseY + plinthH + hangarH;
    parapetGeos.push(this.createParapetGeometry(22, 24, 0.8, 0.4, hangarRoofY));
    const helipad = new THREE.PlaneGeometry(16, 16);
    helipad.rotateX(-Math.PI * 0.5);
    helipad.translate(-9, hangarRoofY + 0.05, 0);
    const helipadMesh = new THREE.Mesh(helipad, this.materials.helipadMat);
    helipadMesh.receiveShadow = true;
    group.add(helipadMesh);

    // 2 Commercial Rollup Hangar Doors on South Facade
    const door1 = new THREE.PlaneGeometry(6.5, 5.0);
    door1.translate(-13, baseY + 2.5, 12.05);
    const door2 = new THREE.PlaneGeometry(6.5, 5.0);
    door2.translate(-5, baseY + 2.5, 12.05);
    const doorsMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries([door1, door2]), this.materials.bayDoorMat);
    group.add(doorsMesh);

    // Volume 2: 5-Storey Engineering Lab Wing (18m wide x 30m deep x 19m high)
    const labH = 19.0;
    const labWing = new THREE.BoxGeometry(18, labH, 30);
    labWing.translate(11, baseY + plinthH + labH * 0.5, 0);
    glassGeos.push(labWing);

    const labRoofY = baseY + plinthH + labH;
    parapetGeos.push(this.createParapetGeometry(18, 30, 1.0, 0.45, labRoofY));
    mepGeos.push(this.createChillerGeometry(11, labRoofY, -6, 3.6, 2.4, 1.8));

    // Lab Entrance Canopy
    const canopyData = this.createEntranceCanopyGeometries(11, baseY, 16.5, 10, 4.0, 0.35, 4.2);
    trimGeos.push(canopyData.canopy, canopyData.columns);
    concreteGeos.push(canopyData.apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.ribbonDarkMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P09: STUDENT FORUM & CONFERENCE ARENA (4 Storeys, Sculptural Civic Forum)
  // --------------------------------------------------------------------------
  buildStudentForumArena(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;
    const bHeight = 15.5; // 4 Storeys

    // Plinth
    const plinth = new THREE.BoxGeometry(40, plinthH, 36);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Main Auditorium Volume clad in Civic Limestone Facade
    const auditorium = new THREE.BoxGeometry(36, bHeight, 26);
    auditorium.translate(0, baseY + plinthH + bHeight * 0.5, -4);
    glassGeos.push(auditorium);

    // Grand Curved Panoramic Facade facing North towards Assembly Plaza
    const arcSegments = 10;
    const arcRadius = 18;
    const arcAngleTotal = Math.PI * 0.65;
    const arcH = 8.0;

    for (let i = 0; i < arcSegments; i++) {
      const a1 = -arcAngleTotal * 0.5 + (i / arcSegments) * arcAngleTotal;
      const a2 = -arcAngleTotal * 0.5 + ((i + 1) / arcSegments) * arcAngleTotal;
      const x1 = Math.sin(a1) * arcRadius;
      const z1 = Math.cos(a1) * arcRadius;
      const x2 = Math.sin(a2) * arcRadius;
      const z2 = Math.cos(a2) * arcRadius;

      const segW = Math.hypot(x2 - x1, z2 - z1);
      const segAngle = Math.atan2(x2 - x1, z2 - z1);

      const panel = new THREE.BoxGeometry(segW, arcH, 0.4);
      panel.rotateY(segAngle);
      panel.translate((x1 + x2) * 0.5, baseY + plinthH + arcH * 0.5, (z1 + z2) * 0.5 - 4);
      glassGeos.push(panel);
    }

    // Grand Entrance Colonnade: 4 Tall Round Columns
    for (let c = -12; c <= 12; c += 8) {
      const col = new THREE.CylinderGeometry(0.4, 0.4, 7.8, 16);
      col.translate(c, baseY + 3.9, 11);
      concreteGeos.push(col);
    }

    // Grand Curved Portico Roof
    const portico = new THREE.BoxGeometry(32, 0.5, 6);
    portico.translate(0, baseY + 7.9, 11);
    parapetGeos.push(portico);

    // Roof Parapet & Skylight Lantern
    const roofY = baseY + plinthH + bHeight;
    parapetGeos.push(this.createParapetGeometry(36, 26, 1.0, 0.45, roofY));

    const lantern = new THREE.CylinderGeometry(4.5, 4.5, 1.8, 16);
    lantern.translate(0, roofY + 0.9, -4);
    glassGeos.push(lantern);

    mepGeos.push(this.createChillerGeometry(-10, roofY, -10, 3.6, 2.4, 1.8));

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.civicForumMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P10: DESIGN & DIGITAL MEDIA ARTS CENTER (5 Storeys, Interlocking Cubes)
  // --------------------------------------------------------------------------
  buildDesignMediaCenter(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.35;

    // Plinth
    const plinth = new THREE.BoxGeometry(38, plinthH, 32);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Cube 1 (Dark Zinc Cube, 5 Storeys, 18m)
    const cube1H = 18.0;
    const cube1 = new THREE.BoxGeometry(22, cube1H, 24);
    cube1.translate(-6, baseY + plinthH + cube1H * 0.5, 0);
    glassGeos.push(cube1);

    // Cube 2 (White Stone Cube, 4 Storeys, 14.5m offset)
    const cube2H = 14.5;
    const cube2 = new THREE.BoxGeometry(18, cube2H, 20);
    cube2.rotateY(0.15);
    cube2.translate(9, baseY + plinthH + cube2H * 0.5, -2);
    glassGeos.push(cube2);

    // Cantilevered 3rd-Floor Glass Gallery Cube
    const galH = 4.5;
    const gallery = new THREE.BoxGeometry(14, galH, 6);
    gallery.translate(-6, baseY + plinthH + 8.5 + galH * 0.5, 14.5);
    glassGeos.push(gallery);

    // Cantilever Support Columns
    const col1 = new THREE.CylinderGeometry(0.25, 0.25, 8.5, 12);
    col1.translate(-11, baseY + 4.25, 16);
    const col2 = new THREE.CylinderGeometry(0.25, 0.25, 8.5, 12);
    col2.translate(-1, baseY + 4.25, 16);
    trimGeos.push(col1, col2);

    // Roof Parapets
    const c1RoofY = baseY + plinthH + cube1H;
    parapetGeos.push(this.createParapetGeometry(22, 24, 0.9, 0.4, c1RoofY));

    // North Glass Clerestory Studio Penthouse
    const clerestory = new THREE.BoxGeometry(12, 2.2, 5);
    clerestory.translate(-6, c1RoofY + 1.1, 0);
    glassGeos.push(clerestory);

    mepGeos.push(this.createChillerGeometry(8, baseY + plinthH + cube2H, -2, 3.2, 2.0, 1.6));

    // Sheltered Entrance Apron under cantilever
    const apron = new THREE.BoxGeometry(16, 0.18, 8);
    apron.translate(-6, baseY + 0.09, 13);
    concreteGeos.push(apron);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.cleanroomWhiteMat });
    return group;
  }

  // --------------------------------------------------------------------------
  // PLOT P12: CENTRAL ENERGY PLANT & LOGISTICS DEPOT (3 Storeys, Industrial Utility)
  // --------------------------------------------------------------------------
  buildCentralEnergyPlant(plot) {
    const group = new THREE.Group();
    group.name = plot.id;
    group.position.set(plot.center.x, 0, plot.center.z);
    group.rotation.y = plot.angle || 0;
    group.userData = { ...plot };

    const concreteGeos = [];
    const glassGeos = [];
    const parapetGeos = [];
    const trimGeos = [];
    const mepGeos = [];
    const roofGeos = [];

    const baseY = 0.038;
    const plinthH = 0.4;
    const bHeight = 11.5; // 3 Storeys

    // Heavy Industrial Concrete Apron
    const plinth = new THREE.BoxGeometry(46, plinthH, 30);
    plinth.translate(0, baseY + plinthH * 0.5, 0);
    concreteGeos.push(plinth);

    // Main Plant Hall (44m wide x 26m deep x 11.5m high)
    const hall = new THREE.BoxGeometry(44, bHeight, 26);
    hall.translate(0, baseY + plinthH + bHeight * 0.5, -2);
    glassGeos.push(hall);

    // Raised Concrete Loading Dock (18m wide x 6m deep x 1.2m high)
    const dockH = 1.2;
    const dock = new THREE.BoxGeometry(20, dockH, 6);
    dock.translate(-8, baseY + dockH * 0.5, 13.5);
    concreteGeos.push(dock);

    // 3 Commercial Sectional Roll-up Bay Doors on South Facade
    const bay1 = new THREE.PlaneGeometry(4.8, 4.0);
    bay1.translate(-14, baseY + dockH + 2.0, 11.05);
    const bay2 = new THREE.PlaneGeometry(4.8, 4.0);
    bay2.translate(-8, baseY + dockH + 2.0, 11.05);
    const bay3 = new THREE.PlaneGeometry(4.8, 4.0);
    bay3.translate(-2, baseY + dockH + 2.0, 11.05);
    const baysMesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries([bay1, bay2, bay3]), this.materials.bayDoorMat);
    group.add(baysMesh);

    // 6 Yellow Safety Bollards along loading dock
    for (let i = 0; i < 6; i++) {
      const bollard = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 12);
      bollard.translate(-17 + i * 3.6, baseY + dockH + 0.55, 16.2);
      const bMesh = new THREE.Mesh(bollard, this.materials.yellowBollardMat);
      bMesh.castShadow = true;
      group.add(bMesh);
    }

    // Heavy Rooftop MEP Equipment
    const roofY = baseY + plinthH + bHeight;
    parapetGeos.push(this.createParapetGeometry(44, 26, 1.0, 0.5, roofY));

    // 3 Dual-Cell Industrial Cooling Towers
    mepGeos.push(this.createCoolingTowerGeometry(-12, roofY, -6, 2.0, 2.6));
    mepGeos.push(this.createCoolingTowerGeometry(0, roofY, -6, 2.0, 2.6));
    mepGeos.push(this.createCoolingTowerGeometry(12, roofY, -6, 2.0, 2.6));

    // 4 Tall Stainless Steel Exhaust Stacks (+6m tall)
    for (let s = 0; s < 4; s++) {
      const stack = new THREE.CylinderGeometry(0.35, 0.35, 6.0, 16);
      stack.translate(-14 + s * 4.5, roofY + 3.0, 6);
      trimGeos.push(stack);
    }

    // High-Voltage Electrical Transformer Cage
    const cage = new THREE.BoxGeometry(8, 2.6, 6);
    cage.translate(14, roofY + 1.3, 6);
    mepGeos.push(cage);

    this.finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat: this.materials.industrialPanelMat });
    return group;
  }

  // ==========================================================================
  // 5. HELPER: GEOMETRY MERGING & FINALIZATION
  // ==========================================================================
  finalizeBuildingGroup(group, { concreteGeos, glassGeos, parapetGeos, trimGeos, mepGeos, roofGeos, glassMat }) {
    if (concreteGeos && concreteGeos.length > 0) {
      const merged = BufferGeometryUtils.mergeGeometries(concreteGeos);
      const mesh = new THREE.Mesh(merged, this.materials.concretePlinthMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    if (glassGeos && glassGeos.length > 0) {
      const merged = BufferGeometryUtils.mergeGeometries(glassGeos);
      const mesh = new THREE.Mesh(merged, glassMat || this.materials.glassBlueMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    if (parapetGeos && parapetGeos.length > 0) {
      const merged = BufferGeometryUtils.mergeGeometries(parapetGeos);
      const mesh = new THREE.Mesh(merged, this.materials.parapetCopingMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    if (trimGeos && trimGeos.length > 0) {
      const merged = BufferGeometryUtils.mergeGeometries(trimGeos);
      const mesh = new THREE.Mesh(merged, this.materials.metalTrimMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    if (mepGeos && mepGeos.length > 0) {
      const merged = BufferGeometryUtils.mergeGeometries(mepGeos);
      const mesh = new THREE.Mesh(merged, this.materials.mepChillerMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    if (roofGeos && roofGeos.length > 0) {
      const merged = BufferGeometryUtils.mergeGeometries(roofGeos);
      const mesh = new THREE.Mesh(merged, this.materials.roofMembraneMat);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
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
  }
}
