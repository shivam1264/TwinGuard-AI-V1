import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getRoomDoorway } from '../simulation/Doorways.js';

// ============================================================================
// REALISTIC PROCEDURAL BUILDING FIRE & SMOKE SYSTEM
// ============================================================================

// 1. Classic 2D Simplex Noise for Real-Time GPU Convective Turbulence
const SIMPLEX_NOISE_GLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

// 2. Procedural Flame Vertex Shader:
// Base (pos.y = 0) stays locked to the furniture source; upper flame tongues sway, flutter, and elongate
const FLAME_VERTEX_SHADER = `
uniform float uTime;
uniform float uTurbulence;
uniform float uHeight;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Normalized height from base: 0.0 at furniture attachment, 1.0 at flame tip
  float hFactor = clamp(pos.y / max(uHeight, 0.2), 0.0, 1.0);
  // Quadratic sway factor ensures the base is 100% stable on the furniture/floor,
  // while upper flame tongues sway dynamically with turbulent draft
  float sway = pow(hFactor, 1.35);

  // Layered aerodynamic draft and convection wind flutter
  float windX = (sin(uTime * 6.5 + pos.y * 3.0) * 0.16 + sin(uTime * 12.5 + pos.y * 6.2) * 0.08) * uTurbulence * sway;
  float windZ = (cos(uTime * 5.8 + pos.y * 2.8) * 0.16 + cos(uTime * 11.0 + pos.y * 5.5) * 0.08) * uTurbulence * sway;

  pos.x += windX;
  pos.z += windZ;

  // Upward convective breathing along the plume height
  pos.y += sin(uTime * 8.2 + pos.x * 3.0) * 0.07 * sway * uTurbulence;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

// 3. Procedural Flame Fragment Shader:
// Layered simplex noise creates irregular tongues of flame rising upward,
// with deep dark-red base, vivid orange middle, and yellow/white-hot core only where combustion is densest
const FLAME_FRAGMENT_SHADER = `
${SIMPLEX_NOISE_GLSL}

uniform float uTime;
uniform float uIntensity;
uniform float uTurbulence;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  // Multi-frequency upward scrolling convective noise layers
  vec2 coord1 = vec2(vUv.x * 2.8, vUv.y * 1.6 - uTime * 3.8);
  vec2 coord2 = vec2(vUv.x * 5.2 + 2.1, vUv.y * 3.0 - uTime * 6.2);
  vec2 coord3 = vec2(vUv.x * 8.5 - 1.4, vUv.y * 4.8 - uTime * 9.0);

  float n1 = snoise(coord1);
  float n2 = snoise(coord2);
  float n3 = snoise(coord3);

  float turb = n1 * 0.55 + n2 * 0.30 + n3 * 0.15; // [-1.0, 1.0]

  // Flame tongue silhouette:
  // Parabolic taper from wide base to pointed flame tongues
  float centerDist = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at lateral edges
  // Perturb edge with noise so flame tongues separate, lick, and flutter naturally
  float edge = centerDist + turb * 0.65 * vUv.y * uTurbulence;

  // Horizontal flame body envelope (solid body with soft feathered outer edges)
  float body = 1.0 - smoothstep(0.0, 1.05, edge);

  // Vertical flame envelope with dancing tips
  float tipFade = 1.0 - smoothstep(0.15, 1.0, vUv.y + turb * 0.35 * uTurbulence);

  float flameDensity = body * tipFade * uIntensity;
  if (flameDensity <= 0.02) discard;

  // Combustion temperature gradient:
  // Concentrated in lower center (combustion core), dropping off toward tips and sides
  float combustion = pow(clamp(flameDensity, 0.0, 1.0), 1.25) * (1.15 - vUv.y * 0.65);

  // Physically grounded building fire color palette:
  vec3 colDarkRed    = vec3(0.58, 0.08, 0.01); // Deep crimson/charcoal boundary
  vec3 colDeepOrange = vec3(0.95, 0.28, 0.02); // Rich burning orange body
  vec3 colWarmAmber  = vec3(1.0,  0.62, 0.06); // Fiery luminous amber
  vec3 colYellow     = vec3(1.0,  0.88, 0.22); // Hot combustion yellow
  vec3 colWhiteCore  = vec3(1.0,  0.98, 0.85); // Incandescent white-hot core

  vec3 col;
  if (combustion < 0.25) {
    col = mix(colDarkRed, colDeepOrange, combustion / 0.25);
  } else if (combustion < 0.55) {
    col = mix(colDeepOrange, colWarmAmber, (combustion - 0.25) / 0.30);
  } else if (combustion < 0.82) {
    col = mix(colWarmAmber, colYellow, (combustion - 0.55) / 0.27);
  } else {
    // White-hot core only where combustion is highest in the inner core
    col = mix(colYellow, colWhiteCore, (combustion - 0.82) / 0.18);
  }

  // Soft edges alpha feathering (no spherical particles, soft luminous tongues)
  float alpha = smoothstep(0.02, 0.28, flameDensity) * clamp(1.0 - vUv.y * 0.2, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`;

// 4. Smoke Billboard Vertex Shader (Facing camera via viewMatrix, non-uniform scaling for ceiling spreading)
const SMOKE_VERTEX_SHADER = `
attribute vec4 aInstanceData;     // x, y, z = world pos, w = rotation angle
attribute vec2 aInstanceScale;    // x = scaleX, y = scaleY
attribute float aInstanceOpacity; // opacity [0..1]
varying vec2 vUv;
varying float vOpacity;

void main() {
  vUv = uv;
  vOpacity = aInstanceOpacity;

  // Screen-aligned billboard vectors derived directly from viewMatrix
  vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

  // Rotate billboard in screen plane for realistic rolling smoke turbulence
  float c = cos(aInstanceData.w);
  float s = sin(aInstanceData.w);
  vec3 rotRight = camRight * c - camUp * s;
  vec3 rotUp    = camRight * s + camUp * c;

  vec3 worldPos = aInstanceData.xyz + rotRight * position.x * aInstanceScale.x + rotUp * position.y * aInstanceScale.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
}
`;

// 5. Smoke Billboard Fragment Shader:
const SMOKE_FRAGMENT_SHADER = `
uniform sampler2D uSmokeTexture;
varying vec2 vUv;
varying float vOpacity;

void main() {
  vec4 tex = texture2D(uSmokeTexture, vUv);
  if (tex.a * vOpacity < 0.01) discard;

  // Authentic dark slate/charcoal volumetric tone (absorptive, believable building fire smoke)
  vec3 smokeColor = vec3(0.22, 0.24, 0.28) * (0.8 + 0.3 * tex.r);
  gl_FragColor = vec4(smokeColor, tex.a * vOpacity);
}
`;

// Helper: Calculate realistic combustible furniture source coordinates for each room type
function getFireSourcePositions(room) {
  const floor = room.floor || 1;
  const baseY = (floor - 1) * 3.8;
  const cx = room.center.x;
  const cz = room.center.z;
  const type = room.furnishingType || 'TECH_WORKSTATIONS';
  const backSign = cz > 0 ? 1 : -1;

  let primary, secondary;

  switch (type) {
    case 'TECH_WORKSTATIONS': {
      // Primary: Pod Left (Front Workstation Desk & Monitor Terminal)
      const podLeftX = cx - 2.2;
      const podLeftZ = cz + 1.5 * backSign;
      const desk1Z = podLeftZ - 0.42 * backSign;
      primary = {
        x: podLeftX,
        y: baseY + 0.74, // Top surface of workstation desk
        z: desk1Z,
        type: 'WORKSTATION_DESK',
        floorY: baseY + 0.02
      };

      // Secondary: Adjacent Workstation Desk in Pod Right
      const podRightX = cx + 2.2;
      const podRightZ = cz + 1.5 * backSign;
      const desk2Z = podRightZ - 0.42 * backSign;
      secondary = {
        x: podRightX,
        y: baseY + 0.74,
        z: desk2Z,
        type: 'ADJACENT_DESK',
        floorY: baseY + 0.02
      };
      break;
    }

    case 'CONFERENCE_BOARDROOM':
    case 'PRESIDENTIAL_BOARDROOM': {
      // Primary: Conference Table Center & Presentation Electronics
      primary = {
        x: cx - 0.8,
        y: baseY + 0.74,
        z: cz,
        type: 'CONFERENCE_TABLE',
        floorY: baseY + 0.02
      };
      // Secondary: Adjacent Cognac Executive Leather Chair
      secondary = {
        x: cx + 1.2,
        y: baseY + 0.45,
        z: cz + 0.85,
        type: 'CONFERENCE_CHAIR',
        floorY: baseY + 0.02
      };
      break;
    }

    case 'EXECUTIVE_OFFICE': {
      // Primary: Executive Timber Desk
      primary = {
        x: cx,
        y: baseY + 0.74,
        z: cz - 1.0,
        type: 'EXECUTIVE_DESK',
        floorY: baseY + 0.02
      };
      // Secondary: Visitor Armchair / Credenza
      secondary = {
        x: cx + 1.2,
        y: baseY + 0.45,
        z: cz + 0.4,
        type: 'OFFICE_CHAIR',
        floorY: baseY + 0.02
      };
      break;
    }

    default: {
      // Lounge / Cafe / Reception Seating
      primary = {
        x: cx - 1.2,
        y: baseY + 0.45,
        z: cz,
        type: 'LOUNGE_SEATING',
        floorY: baseY + 0.02
      };
      secondary = {
        x: cx + 1.2,
        y: baseY + 0.45,
        z: cz + 0.8 * backSign,
        type: 'COFFEE_TABLE',
        floorY: baseY + 0.02
      };
      break;
    }
  }

  return { primary, secondary };
}

// ============================================================================
// MAIN FIRE & SMOKE SYSTEM
// ============================================================================

export class FireParticles {
  constructor(scene, onFireSpread = null, building = null) {
    this.scene = scene;
    this.onFireSpread = onFireSpread;
    this.building = building;
    this.activeFires = new Map(); // roomId -> FireInstance
    this.floorMode = 'ALL';
    this.group = new THREE.Group(); // Master container for BIM layer toggling
    this.scene.add(this.group);

    // Shared procedural textures
    this.textures = this.initTextures();
  }

  initTextures() {
    // 1. Organic Multi-Lobe Billowing Smoke Puff Texture (NOT a circle or sphere!)
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 128;
    smokeCanvas.height = 128;
    const sCtx = smokeCanvas.getContext('2d');
    sCtx.clearRect(0, 0, 128, 128);

    // Composite 8 soft overlapping cloudy lobes to form an asymmetrical, organic billowing smoke puff
    const lobes = [
      { x: 64, y: 64, r: 44, a: 0.52 },
      { x: 52, y: 54, r: 35, a: 0.40 },
      { x: 76, y: 52, r: 34, a: 0.38 },
      { x: 46, y: 72, r: 32, a: 0.35 },
      { x: 78, y: 72, r: 34, a: 0.35 },
      { x: 64, y: 42, r: 28, a: 0.32 },
      { x: 58, y: 82, r: 27, a: 0.28 },
      { x: 72, y: 84, r: 25, a: 0.26 }
    ];

    lobes.forEach(lobe => {
      const grad = sCtx.createRadialGradient(lobe.x, lobe.y, 0, lobe.x, lobe.y, lobe.r);
      grad.addColorStop(0.0, `rgba(45, 48, 54, ${lobe.a})`);
      grad.addColorStop(0.45, `rgba(55, 60, 68, ${lobe.a * 0.72})`);
      grad.addColorStop(0.8, `rgba(75, 80, 88, ${lobe.a * 0.32})`);
      grad.addColorStop(1.0, 'rgba(85, 90, 100, 0.0)');
      sCtx.fillStyle = grad;
      sCtx.beginPath();
      sCtx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI * 2);
      sCtx.fill();
    });
    const smokeTex = new THREE.CanvasTexture(smokeCanvas);

    // 2. Scorched Carbon Char Decal Texture (Burnt wood/ash with glowing ember cracks)
    const charCanvas = document.createElement('canvas');
    charCanvas.width = 256;
    charCanvas.height = 256;
    const cCtx = charCanvas.getContext('2d');
    cCtx.clearRect(0, 0, 256, 256);

    const cGrad = cCtx.createRadialGradient(128, 128, 0, 128, 128, 120);
    cGrad.addColorStop(0.0, 'rgba(255, 85, 10, 0.88)'); // Glowing inner coal
    cGrad.addColorStop(0.22, 'rgba(180, 40, 5, 0.78)'); // Charred glowing ember
    cGrad.addColorStop(0.55, 'rgba(38, 22, 18, 0.82)'); // Dark burnt wood/ash
    cGrad.addColorStop(0.85, 'rgba(14, 14, 14, 0.70)'); // Black carbon scorch boundary
    cGrad.addColorStop(1.0, 'rgba(10, 10, 10, 0.0)');   // Feathers softly into clean floor
    cCtx.fillStyle = cGrad;
    cCtx.beginPath();
    cCtx.arc(128, 128, 120, 0, Math.PI * 2);
    cCtx.fill();

    // Scorched thermal fracture cracks radiating outward
    cCtx.strokeStyle = 'rgba(255, 110, 15, 0.45)';
    cCtx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      cCtx.beginPath();
      const angle = (i / 7) * Math.PI * 2 + 0.3;
      const r1 = 12 + Math.random() * 18;
      const r2 = 65 + Math.random() * 35;
      cCtx.moveTo(128 + Math.cos(angle) * r1, 128 + Math.sin(angle) * r1);
      cCtx.lineTo(128 + Math.cos(angle + 0.22) * (r1 + r2) * 0.5, 128 + Math.sin(angle + 0.22) * (r1 + r2) * 0.5);
      cCtx.lineTo(128 + Math.cos(angle - 0.12) * r2, 128 + Math.sin(angle - 0.12) * r2);
      cCtx.stroke();
    }
    const charTex = new THREE.CanvasTexture(charCanvas);

    // 3. Delicate Flying Spark / Hot Ash Fleck Texture
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = 32;
    sparkCanvas.height = 32;
    const spCtx = sparkCanvas.getContext('2d');
    spCtx.clearRect(0, 0, 32, 32);

    const spGrad = spCtx.createRadialGradient(16, 16, 0, 16, 16, 14);
    spGrad.addColorStop(0.0, 'rgba(255, 255, 230, 1.0)');
    spGrad.addColorStop(0.35, 'rgba(255, 180, 40, 0.85)');
    spGrad.addColorStop(0.75, 'rgba(220, 60, 5, 0.45)');
    spGrad.addColorStop(1.0, 'rgba(160, 20, 0, 0.0)');
    spCtx.fillStyle = spGrad;
    spCtx.fillRect(0, 0, 32, 32);
    const sparkTex = new THREE.CanvasTexture(sparkCanvas);

    return { smokeTex, charTex, sparkTex };
  }

  // Create multi-planar intersecting flame tongue cluster geometry
  createFlameGeometry(width, height) {
    const geometries = [];
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, 0.35, -0.4];
    const widths = [width, width * 0.9, width * 0.95, width * 0.85, width * 0.72, width * 0.65];
    const heights = [height, height * 0.92, height * 1.05, height * 0.88, height * 1.12, height * 0.8];
    const offsets = [
      { x: 0, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: 0 },
      { x: width * 0.14, z: -width * 0.12 },
      { x: -width * 0.14, z: width * 0.1 }
    ];

    for (let i = 0; i < angles.length; i++) {
      const w = widths[i];
      const h = heights[i];
      // Vertical segment subdivisions (8x16) enable smooth vertex shader aerodynamic swaying
      const plane = new THREE.PlaneGeometry(w, h, 8, 16);
      // Shift so base y = 0 touches furniture surface exactly
      plane.translate(0, h / 2, 0);
      plane.rotateY(angles[i]);
      plane.translate(offsets[i].x, 0, offsets[i].z);
      geometries.push(plane);
    }

    return BufferGeometryUtils.mergeGeometries(geometries);
  }

  spawnFire(roomId, defaultPos = { x: 0, y: 0.2, z: 0 }, roomData = null) {
    if (this.activeFires.has(roomId)) {
      return;
    }

    const room = roomData || (this.building ? this.building.roomsData.find(r => r.id === roomId) : null);
    const floor = room?.floor || parseInt(roomId.replace(/\D/g, '').slice(0, 2), 10) || 1;
    const baseY = (floor - 1) * (this.building ? this.building.floorHeight : 3.8);

    // Identify precise combustible furniture locations in this room
    const sources = room ? getFireSourcePositions(room) : {
      primary: { x: defaultPos.x, y: baseY + 0.74, z: defaultPos.z, floorY: baseY + 0.02 },
      secondary: { x: defaultPos.x + 1.8, y: baseY + 0.74, z: defaultPos.z, floorY: baseY + 0.02 }
    };

    const doorway = getRoomDoorway(roomId);
    const roomBounds = room?.bounds || {
      minX: sources.primary.x - 4.5,
      maxX: sources.primary.x + 4.5,
      minZ: sources.primary.z - 4.5,
      maxZ: sources.primary.z + 4.5
    };

    // Container for all fire & smoke elements of this incident
    const fireGroup = new THREE.Group();
    // Fire elements are positioned in room/floor canonical coordinates
    fireGroup.position.set(0, 0, 0);

    const disposables = [];

    // === 1. CHARRED THERMAL SCORCH DECALS ===
    const charMat = new THREE.MeshBasicMaterial({
      map: this.textures.charTex,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      opacity: 0.88
    });
    disposables.push({ material: charMat });

    // A. Scorched mark on top of the burning desk/furniture surface
    const deskCharGeo = new THREE.PlaneGeometry(1.6, 1.2);
    const deskCharMesh = new THREE.Mesh(deskCharGeo, charMat);
    deskCharMesh.rotation.x = -Math.PI / 2;
    deskCharMesh.position.set(sources.primary.x, sources.primary.y + 0.015, sources.primary.z);
    fireGroup.add(deskCharMesh);
    disposables.push({ geometry: deskCharGeo });

    // B. Burnt carbon hotspot on the floor beneath the burning furniture
    const floorCharGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const floorCharMesh = new THREE.Mesh(floorCharGeo, charMat);
    floorCharMesh.rotation.x = -Math.PI / 2;
    floorCharMesh.position.set(sources.primary.x, sources.primary.floorY, sources.primary.z);
    fireGroup.add(floorCharMesh);
    disposables.push({ geometry: floorCharGeo });

    // C. Secondary furniture scorch decal (ignites in State 2 - Developing)
    const secCharGeo = new THREE.PlaneGeometry(1.5, 1.2);
    const secCharMesh = new THREE.Mesh(secCharGeo, charMat);
    secCharMesh.rotation.x = -Math.PI / 2;
    secCharMesh.position.set(sources.secondary.x, sources.secondary.y + 0.015, sources.secondary.z);
    secCharMesh.visible = false;
    fireGroup.add(secCharMesh);
    disposables.push({ geometry: secCharGeo });

    // === 2. LOCALIZED WARM RADIANT HEAT & LIGHT ===
    // Localized point light illuminates nearby floor, furniture, and dividing walls with natural quadratic falloff
    const fireLight = new THREE.PointLight(0xff5511, 2.0, 10, 1.8);
    fireLight.position.set(sources.primary.x, sources.primary.y + 0.8, sources.primary.z);
    fireLight.castShadow = false;
    fireGroup.add(fireLight);

    // === 3. PROCEDURAL FLAME MESHES (Primary Furniture + Secondary Furniture) ===
    const flameMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.5 },
        uTurbulence: { value: 0.5 },
        uHeight: { value: 1.2 }
      },
      vertexShader: FLAME_VERTEX_SHADER,
      fragmentShader: FLAME_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending
    });
    disposables.push({ material: flameMat });

    // Primary flame cluster anchored on desk/equipment surface
    const primFlameGeo = this.createFlameGeometry(1.2, 1.6);
    const primFlameMesh = new THREE.Mesh(primFlameGeo, flameMat);
    primFlameMesh.position.set(sources.primary.x, sources.primary.y, sources.primary.z);
    primFlameMesh.scale.set(0.5, 0.5, 0.5);
    primFlameMesh.frustumCulled = false;
    fireGroup.add(primFlameMesh);
    disposables.push({ geometry: primFlameGeo });

    // Secondary flame cluster on adjacent furniture (chair/desk)
    const secFlameGeo = this.createFlameGeometry(1.0, 1.4);
    const secFlameMat = flameMat.clone();
    const secFlameMesh = new THREE.Mesh(secFlameGeo, secFlameMat);
    secFlameMesh.position.set(sources.secondary.x, sources.secondary.y, sources.secondary.z);
    secFlameMesh.scale.set(0.3, 0.3, 0.3);
    secFlameMesh.visible = false;
    secFlameMesh.frustumCulled = false;
    fireGroup.add(secFlameMesh);
    disposables.push({ geometry: secFlameGeo, material: secFlameMat });

    // === 4. DELICATE FLYING EMBER ASH FLECKS ===
    const sparkCount = 20;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = sources.primary.x + (Math.random() - 0.5) * 0.4;
      sparkPositions[i * 3 + 1] = sources.primary.y + Math.random() * 0.5;
      sparkPositions[i * 3 + 2] = sources.primary.z + (Math.random() - 0.5) * 0.4;

      sparkVelocities.push({
        y: Math.random() * 2.2 + 1.2,
        vx: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.8,
        life: Math.random() * 2.0,
        maxLife: Math.random() * 1.8 + 1.2
      });
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      size: 0.18,
      map: this.textures.sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    sparkPoints.frustumCulled = false;
    fireGroup.add(sparkPoints);
    disposables.push({ geometry: sparkGeo, material: sparkMat });

    // === 5. VOLUMETRIC BILLOWING SMOKE PLUME & CEILING LAYER ===
    // Instanced GPU quads facing the camera, billboarded with rotation and non-uniform ceiling flattening
    const maxSmokeCount = 120;
    const smokeQuadGeo = new THREE.PlaneGeometry(1, 1);
    const smokeInstGeo = new THREE.InstancedBufferGeometry();
    smokeInstGeo.index = smokeQuadGeo.index;
    smokeInstGeo.attributes.position = smokeQuadGeo.attributes.position;
    smokeInstGeo.attributes.uv = smokeQuadGeo.attributes.uv;

    const smokeInstanceData = new Float32Array(maxSmokeCount * 4); // x, y, z, rotation
    const smokeInstanceScale = new Float32Array(maxSmokeCount * 2); // scaleX, scaleY
    const smokeInstanceOpacity = new Float32Array(maxSmokeCount); // opacity

    smokeInstGeo.setAttribute('aInstanceData', new THREE.InstancedBufferAttribute(smokeInstanceData, 4));
    smokeInstGeo.setAttribute('aInstanceScale', new THREE.InstancedBufferAttribute(smokeInstanceScale, 2));
    smokeInstGeo.setAttribute('aInstanceOpacity', new THREE.InstancedBufferAttribute(smokeInstanceOpacity, 1));

    const smokeShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uSmokeTexture: { value: this.textures.smokeTex }
      },
      vertexShader: SMOKE_VERTEX_SHADER,
      fragmentShader: SMOKE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    const smokeMesh = new THREE.Mesh(smokeInstGeo, smokeShaderMat);
    smokeMesh.frustumCulled = false;
    fireGroup.add(smokeMesh);
    disposables.push({ geometry: smokeInstGeo, material: smokeShaderMat, meshGeo: smokeQuadGeo });

    // Smoke particle simulation records
    const smokeParticles = [];
    for (let i = 0; i < maxSmokeCount; i++) {
      smokeParticles.push({
        active: false,
        x: sources.primary.x,
        y: sources.primary.y + 0.4,
        z: sources.primary.z,
        startY: sources.primary.y + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: Math.random() * 0.9 + 0.7,
        vz: (Math.random() - 0.5) * 0.25,
        scaleX: 0.5,
        scaleY: 0.5,
        targetScale: 2.2 + Math.random() * 1.0,
        opacity: 0.0,
        maxOpacity: 0.38 + Math.random() * 0.18,
        life: 0.0,
        maxLife: 6.5 + Math.random() * 3.0,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        seed: Math.random() * Math.PI * 2,
        phase: 'PLUME',
        ceilingStartLife: 0.0
      });
    }

    // === LAYERED & EXPLODED VIEW SYNCHRONIZATION ===
    // If the building floor group exists, add fireGroup directly as a child of that floorGroup!
    // This guarantees that when a floor is lifted in Exploded / Layered mode by +Y,
    // the fire source, flames, smoke, and lights move by the EXACT same transform!
    const floorGroup = this.building?.floorGroups?.[floor];
    if (floorGroup) {
      floorGroup.add(fireGroup);
    } else {
      this.group.add(fireGroup);
    }

    // Create Fire Instance state record
    const fireInstance = {
      roomId,
      floor,
      floorGroup,
      group: fireGroup,
      basePos: sources.primary,
      primarySource: sources.primary,
      secondarySource: sources.secondary,
      hasSecondaryIgnited: false,
      doorway,
      roomBounds,
      ceilingY: baseY + 3.35, // Suspended ceiling plenum boundary

      // Visual nodes
      light: fireLight,
      primFlameMesh,
      primFlameMat: flameMat,
      secFlameMesh,
      secFlameMat,
      deskCharMesh,
      floorCharMesh,
      secCharMesh,
      sparkPoints,
      sparkGeo,
      sparkPositions,
      sparkVelocities,
      smokeMesh,
      smokeInstGeo,
      smokeInstanceData,
      smokeInstanceScale,
      smokeInstanceOpacity,
      smokeParticles,
      disposables,

      // State progression
      elapsedTime: 0,
      state: 'IGNITION',
      intensityStateNum: 1,
      intensityFactor: 0.35,
      hasSpreadToAdjacentRoom: false
    };

    this.activeFires.set(roomId, fireInstance);
  }

  // Smooth continuous fire intensity state calculation
  getFireStateMetrics(elapsedTime) {
    if (elapsedTime < 5.0) {
      // 0 -> 5s: IGNITION
      const t = elapsedTime / 5.0;
      return {
        stateName: 'IGNITION',
        stateNum: 1,
        factor: 0.35 + t * 0.25, // 0.35 -> 0.60
        flameScale: 0.5 + t * 0.3, // 0.5 -> 0.8
        turbulence: 0.4 + t * 0.2,
        lightIntensity: 1.6 + t * 1.2,
        lightRadius: 7.0,
        activeSmokeCount: Math.round(15 + t * 15),
        secondaryIgnited: false
      };
    } else if (elapsedTime < 14.0) {
      // 5 -> 14s: DEVELOPING FIRE
      const t = (elapsedTime - 5.0) / 9.0;
      return {
        stateName: 'DEVELOPING',
        stateNum: 2,
        factor: 0.60 + t * 0.35, // 0.60 -> 0.95
        flameScale: 0.8 + t * 0.4, // 0.8 -> 1.2
        turbulence: 0.6 + t * 0.25,
        lightIntensity: 2.8 + t * 1.8,
        lightRadius: 10.0,
        activeSmokeCount: Math.round(30 + t * 35),
        secondaryIgnited: t >= 0.5 // Secondary nearby furniture ignites halfway through developing!
      };
    } else if (elapsedTime < 28.0) {
      // 14 -> 28s: ACTIVE FIRE
      const t = (elapsedTime - 14.0) / 14.0;
      return {
        stateName: 'ACTIVE',
        stateNum: 3,
        factor: 0.95 + t * 0.40, // 0.95 -> 1.35
        flameScale: 1.2 + t * 0.35, // 1.2 -> 1.55
        turbulence: 0.85 + t * 0.25,
        lightIntensity: 4.6 + t * 1.5,
        lightRadius: 13.0,
        activeSmokeCount: Math.round(65 + t * 35),
        secondaryIgnited: true
      };
    } else {
      // 28s+: SEVERE FIRE
      const t = Math.min(1.0, (elapsedTime - 28.0) / 10.0);
      return {
        stateName: 'SEVERE',
        stateNum: 4,
        factor: 1.35 + t * 0.25, // 1.35 -> 1.60
        flameScale: 1.55 + t * 0.2, // 1.55 -> 1.75
        turbulence: 1.1 + t * 0.2,
        lightIntensity: 6.1 + t * 1.2,
        lightRadius: 16.0,
        activeSmokeCount: 110,
        secondaryIgnited: true,
        readyToSpread: elapsedTime >= 30.0
      };
    }
  }

  // Deterministic, gradual propagation to adjacent connected space
  attemptSpread(fire) {
    if (!this.onFireSpread || !fire.roomId) return;

    // Room ID format: f{floor}_r{roomNum}
    const match = fire.roomId.match(/f(\d+)_r(\d+)/i);
    if (!match) return;

    const floor = parseInt(match[1], 10);
    const roomNum = parseInt(match[2], 10);

    // North wing: 1 to 5. South wing: 6 to 10.
    const isNorthWing = roomNum <= 5;
    const minR = isNorthWing ? 1 : 6;
    const maxR = isNorthWing ? 5 : 10;

    const candidates = [];
    if (roomNum + 1 <= maxR) candidates.push(roomNum + 1);
    if (roomNum - 1 >= minR) candidates.push(roomNum - 1);

    if (candidates.length === 0) return;

    // Select first unburned adjacent room along the corridor
    const unburned = candidates.filter(r => !this.activeFires.has(`f${floor}_r${r}`));
    if (unburned.length === 0) return;

    const nextRoomNum = unburned[0];
    const targetRoomId = `f${floor}_r${nextRoomNum}`;

    this.onFireSpread(fire.roomId, targetRoomId, floor, nextRoomNum);
  }

  extinguishFire(roomId) {
    if (this.activeFires.has(roomId)) {
      const fire = this.activeFires.get(roomId);

      if (fire.group.parent) {
        fire.group.parent.remove(fire.group);
      }

      if (fire.light) {
        fire.light.dispose?.();
      }

      fire.disposables.forEach(item => {
        item.geometry?.dispose();
        item.material?.dispose();
        item.meshGeo?.dispose();
      });

      this.activeFires.delete(roomId);
    }
  }

  extinguishAll() {
    this.activeFires.forEach((fire, roomId) => {
      this.extinguishFire(roomId);
    });
    this.activeFires.clear();
  }

  setFloorMode(mode) {
    this.floorMode = mode;
    this.activeFires.forEach((fire, roomId) => {
      const floorNum = fire.floor || 1;
      if (mode === 'ALL' || mode === 'EXPLODED') {
        fire.group.visible = true;
      } else {
        const targetFloor = parseInt(mode, 10);
        fire.group.visible = (floorNum === targetFloor);
      }
    });
  }

  update(delta, camera = null) {
    const timeNow = performance.now() * 0.001;

    this.activeFires.forEach(fire => {
      fire.elapsedTime += delta;

      // 1. Fire State Metrics (Continuous & Smooth)
      const metrics = this.getFireStateMetrics(fire.elapsedTime);
      fire.state = metrics.stateName;
      fire.intensityStateNum = metrics.stateNum;
      fire.intensityFactor = metrics.factor;

      if (metrics.readyToSpread && !fire.hasSpreadToAdjacentRoom) {
        fire.hasSpreadToAdjacentRoom = true;
        this.attemptSpread(fire);
      }

      // 2. Realistic Heat Flicker on Localized Point Light
      const flicker = 1.0 + Math.sin(timeNow * 11.3) * 0.08 + Math.sin(timeNow * 19.7) * 0.05 + Math.cos(timeNow * 6.4) * 0.04;
      fire.light.intensity = metrics.lightIntensity * flicker;
      fire.light.distance = metrics.lightRadius;

      // 3. Update Primary Procedural Flame Uniforms & Scale
      fire.primFlameMat.uniforms.uTime.value = timeNow;
      fire.primFlameMat.uniforms.uIntensity.value = metrics.factor;
      fire.primFlameMat.uniforms.uTurbulence.value = metrics.turbulence;
      fire.primFlameMat.uniforms.uHeight.value = 1.6 * metrics.flameScale;

      const scalePulse = metrics.flameScale * (1.0 + Math.sin(timeNow * 6.0) * 0.035);
      fire.primFlameMesh.scale.set(scalePulse, scalePulse, scalePulse);

      // 4. Secondary Nearby Furniture Flame (Ignition halfway through Developing)
      if (metrics.secondaryIgnited) {
        if (!fire.hasSecondaryIgnited) {
          fire.hasSecondaryIgnited = true;
          fire.secFlameMesh.visible = true;
          fire.secCharMesh.visible = true;
        }
        fire.secFlameMat.uniforms.uTime.value = timeNow + 3.14;
        fire.secFlameMat.uniforms.uIntensity.value = metrics.factor * 0.85;
        fire.secFlameMat.uniforms.uTurbulence.value = metrics.turbulence;
        fire.secFlameMat.uniforms.uHeight.value = 1.4 * (metrics.flameScale * 0.8);

        const secScale = metrics.flameScale * 0.75 * (1.0 + Math.sin(timeNow * 7.2) * 0.035);
        fire.secFlameMesh.scale.set(secScale, secScale, secScale);
      }

      // 5. Update Delicate Airborne Ember Flecks
      const sparkPos = fire.sparkPositions;
      for (let i = 0; i < fire.sparkVelocities.length; i++) {
        const vel = fire.sparkVelocities[i];
        vel.life += delta;

        sparkPos[i * 3] += (vel.vx + Math.sin(timeNow * 6.0 + i) * 0.15) * delta;
        sparkPos[i * 3 + 1] += vel.y * delta * fire.intensityFactor;
        sparkPos[i * 3 + 2] += (vel.vz + Math.cos(timeNow * 5.5 + i) * 0.15) * delta;

        if (vel.life > vel.maxLife || sparkPos[i * 3 + 1] > fire.ceilingY) {
          vel.life = 0;
          // Spawn near primary or secondary flame source
          const src = (metrics.secondaryIgnited && Math.random() > 0.6) ? fire.secondarySource : fire.primarySource;
          sparkPos[i * 3] = src.x + (Math.random() - 0.5) * 0.4;
          sparkPos[i * 3 + 1] = src.y + 0.2;
          sparkPos[i * 3 + 2] = src.z + (Math.random() - 0.5) * 0.4;
          vel.y = Math.random() * 2.2 + 1.2;
          vel.vx = (Math.random() - 0.5) * 0.8;
          vel.vz = (Math.random() - 0.5) * 0.8;
        }
      }
      fire.sparkGeo.attributes.position.needsUpdate = true;

      // 6. Update Volumetric Smoke Particles with Ceiling Accumulation & Doorway Flow
      const instData = fire.smokeInstanceData;
      const instScale = fire.smokeInstanceScale;
      const instOpacity = fire.smokeInstanceOpacity;

      const doorX = fire.doorway.door.x;
      const doorZ = fire.doorway.door.z;
      const doorWidth = fire.doorway.width || 2.2;
      const bounds = fire.roomBounds;
      const ceilingY = fire.ceilingY;

      for (let i = 0; i < fire.smokeParticles.length; i++) {
        const p = fire.smokeParticles[i];

        if (i < metrics.activeSmokeCount) {
          if (!p.active) {
            p.active = true;
            this.resetSmokeParticle(p, fire, metrics);
          }

          p.life += delta;
          p.rot += p.rotSpeed * delta;

          if (p.life > p.maxLife) {
            this.resetSmokeParticle(p, fire, metrics);
          }

          if (p.phase === 'PLUME') {
            // A. Upward Buoyant Rise
            p.y += p.vy * delta * fire.intensityFactor;
            p.x += (p.vx + Math.sin(timeNow * 2.5 + p.seed) * 0.12) * delta;
            p.z += (p.vz + Math.cos(timeNow * 2.2 + p.seed) * 0.12) * delta;

            // Expand as smoke rises through the thermal column
            const hFraction = Math.min(1.0, Math.max(0.0, (p.y - p.startY) / (ceilingY - p.startY)));
            const currScale = p.scaleX + (p.targetScale * 0.65 - p.scaleX) * hFraction * delta * 2.5;
            p.scaleX = currScale;
            p.scaleY = currScale;

            // Smooth opacity fade in
            p.opacity = Math.min(p.maxOpacity, p.maxOpacity * (p.life / 0.7));

            // Ceiling Impingement Check
            if (p.y >= ceilingY - 0.12) {
              p.phase = 'CEILING';
              p.ceilingStartLife = p.life;
              p.y = ceilingY - 0.10 + Math.sin(timeNow * 1.5 + p.seed) * 0.04;
              // Flatten into shallow ceiling smoke blanket
              p.scaleY = p.scaleX * 0.55;
              p.scaleX = p.scaleX * 1.4;
            }
          } else {
            // B. Ceiling Layer Radial Spread & Room Containment
            p.y = ceilingY - 0.10 + Math.sin(timeNow * 1.5 + p.seed) * 0.04;

            const dx = p.x - fire.primarySource.x;
            const dz = p.z - fire.primarySource.z;
            const dist = Math.hypot(dx, dz) || 0.1;
            const radialSpeed = (0.7 + 0.5 * fire.intensityFactor);

            p.x += (dx / dist) * radialSpeed * delta;
            p.z += (dz / dist) * radialSpeed * delta;

            // Further horizontal expansion in shallow ceiling layer
            p.scaleX = Math.min(p.targetScale * 1.5, p.scaleX + delta * 0.28);
            p.scaleY = p.scaleX * 0.48;

            // Gradual dissipation at outer ceiling boundary
            const ceilingAge = p.life - p.ceilingStartLife;
            if (ceilingAge > 3.0) {
              p.opacity = Math.max(0.0, p.maxOpacity * (1.0 - (ceilingAge - 3.0) / 3.0));
            }

            // C. ARCHITECTURAL WALL CONTAINMENT & DOORWAY MIGRATION
            // Side dividing walls (X axis):
            if (p.x < bounds.minX + 0.35) {
              p.x = bounds.minX + 0.35;
            } else if (p.x > bounds.maxX - 0.35) {
              p.x = bounds.maxX - 0.35;
            }

            // North/South Room Walls:
            const isNorthWing = doorZ < 0; // Door at z = -2.6
            if (isNorthWing) {
              // Exterior North wall at minZ
              if (p.z < bounds.minZ + 0.35) {
                p.z = bounds.minZ + 0.35;
              }
              // South interior dividing wall at maxZ (-2.6)
              if (p.z > bounds.maxZ - 0.2) {
                const isNearDoor = Math.abs(p.x - doorX) <= (doorWidth * 0.5 + 0.2);
                if (isNearDoor) {
                  // Corridor migration: smoke drifts out through open doorway into corridor ceiling
                  if (p.z > 0.2) p.z = 0.2;
                } else {
                  // Blocked by solid wall
                  p.z = bounds.maxZ - 0.2;
                }
              }
            } else {
              // South Wing: Door at z = 2.6
              // Exterior South wall at maxZ
              if (p.z > bounds.maxZ - 0.35) {
                p.z = bounds.maxZ - 0.35;
              }
              // North interior dividing wall at minZ (2.6)
              if (p.z < bounds.minZ + 0.2) {
                const isNearDoor = Math.abs(p.x - doorX) <= (doorWidth * 0.5 + 0.2);
                if (isNearDoor) {
                  // Corridor migration: smoke drifts out through doorway into corridor ceiling
                  if (p.z < -0.2) p.z = -0.2;
                } else {
                  // Blocked by solid wall
                  p.z = bounds.minZ + 0.2;
                }
              }
            }
          }

          // Populate GPU Instance Attributes
          instData[i * 4] = p.x;
          instData[i * 4 + 1] = p.y;
          instData[i * 4 + 2] = p.z;
          instData[i * 4 + 3] = p.rot;

          instScale[i * 2] = p.scaleX;
          instScale[i * 2 + 1] = p.scaleY;

          instOpacity[i] = p.opacity;
        } else {
          // Inactive smoke particle hidden
          p.active = false;
          instOpacity[i] = 0.0;
        }
      }

      fire.smokeInstGeo.attributes.aInstanceData.needsUpdate = true;
      fire.smokeInstGeo.attributes.aInstanceScale.needsUpdate = true;
      fire.smokeInstGeo.attributes.aInstanceOpacity.needsUpdate = true;
    });
  }

  resetSmokeParticle(p, fire, metrics) {
    const src = (metrics.secondaryIgnited && Math.random() > 0.55) ? fire.secondarySource : fire.primarySource;
    p.x = src.x + (Math.random() - 0.5) * 0.5;
    p.y = src.y + 0.4 + Math.random() * 0.3;
    p.z = src.z + (Math.random() - 0.5) * 0.5;
    p.startY = p.y;
    p.vx = (Math.random() - 0.5) * 0.25;
    p.vy = Math.random() * 0.9 + 0.75;
    p.vz = (Math.random() - 0.5) * 0.25;
    p.scaleX = 0.5 + Math.random() * 0.25;
    p.scaleY = p.scaleX;
    p.targetScale = 2.2 + Math.random() * 1.0;
    p.opacity = 0.0;
    p.maxOpacity = 0.36 + Math.random() * 0.18;
    p.life = 0.0;
    p.maxLife = 6.0 + Math.random() * 3.0;
    p.rot = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 0.35;
    p.phase = 'PLUME';
    p.ceilingStartLife = 0.0;
  }
}
