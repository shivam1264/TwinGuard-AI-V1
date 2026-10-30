import * as THREE from 'three';

// Generates procedural realistic architectural textures using Canvas
export class TextureHelper {
  // Wood Parquet Floor (for Boardroom and Executive Offices)
  static createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, 0, 512, 512);

    // Wood planks
    const plankH = 64;
    for (let y = 0; y < 512; y += plankH) {
      for (let x = 0; x < 512; x += 128) {
        const offset = (y / plankH) % 2 === 0 ? 0 : 64;
        const px = (x + offset) % 512;

        const shade = Math.floor(Math.random() * 30 - 15);
        ctx.fillStyle = `rgb(${110 + shade}, ${72 + shade}, ${42 + shade})`;
        ctx.fillRect(px + 1, y + 1, 126, plankH - 2);

        // Subtle grain lines
        ctx.strokeStyle = 'rgba(50, 30, 15, 0.25)';
        ctx.lineWidth = 1;
        for (let g = 0; g < 4; g++) {
          const gy = y + 8 + g * 14;
          ctx.beginPath();
          ctx.moveTo(px, gy);
          ctx.lineTo(px + 126, gy + (Math.random() * 4 - 2));
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  // Modern Office Carpet Tile (Warm Slate/Charcoal with subtle weave)
  static createCarpetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    // Fine carpet weave dots
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const shade = Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgb(${26 + shade}, ${36 + shade}, ${52 + shade})`;
        ctx.fillRect(x, y, 3, 3);
      }
    }

    // Tile seams
    ctx.strokeStyle = 'rgba(10, 15, 25, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }

  // Polished Marble / Porcelain Tile (for Lobby, Corridors & Cafeteria)
  static createTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 128;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        const shade = Math.floor(Math.random() * 16 - 8);
        ctx.fillStyle = `rgb(${18 + shade}, ${28 + shade}, ${44 + shade})`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Marble subtle streak
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 20);
        ctx.quadraticCurveTo(x + 60, y + 70, x + 110, y + 100);
        ctx.stroke();
      }
    }

    // Grid grout line
    ctx.strokeStyle = '#050a14';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  // Realistic illuminated Room Identification Plate
  static createRoomSignTexture(roomCode, departmentName) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background panel
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 256, 128);

    // Glowing cyan cyber border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 120);

    // Header bar
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(4, 4, 248, 32);

    ctx.fillStyle = '#050a14';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(roomCode, 128, 20);

    // Department subtitle
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(departmentName || 'COMMERCIAL SUITE', 128, 64);

    // Small status indicator
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(40, 100, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ONLINE • SECURE', 58, 104);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Illuminated Emergency Exit Sign (Standard ISO Green Sign with Directional Pointer)
  static createExitSignTexture(direction = 'right') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Vibrant Safety Green Background
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#059669');
    grad.addColorStop(1, '#065f46');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // High-visibility crisp border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 236);

    // Inner subtle glow border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 472, 216);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 80px "Arial Black", "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';

    if (direction === 'left') {
      // Arrow pointing Left (towards West stairs)
      ctx.textAlign = 'left';
      // Left Arrow
      ctx.beginPath();
      ctx.moveTo(40, 128);
      ctx.lineTo(110, 65);
      ctx.lineTo(110, 95);
      ctx.lineTo(150, 95);
      ctx.lineTo(150, 161);
      ctx.lineTo(110, 161);
      ctx.lineTo(110, 191);
      ctx.closePath();
      ctx.fill();

      // Text "EXIT"
      ctx.fillText('EXIT', 180, 128);
    } else {
      // Arrow pointing Right (towards East stairs)
      ctx.textAlign = 'left';
      ctx.fillText('EXIT', 60, 128);

      // Right Arrow
      ctx.beginPath();
      ctx.moveTo(472, 128);
      ctx.lineTo(402, 65);
      ctx.lineTo(402, 95);
      ctx.lineTo(362, 95);
      ctx.lineTo(362, 161);
      ctx.lineTo(402, 161);
      ctx.lineTo(402, 191);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  }

  static createExitSignLeftTexture() {
    return this.createExitSignTexture('left');
  }

  static createExitSignRightTexture() {
    return this.createExitSignTexture('right');
  }

  // Modern Architectural Fluted Acoustic Timber Slat Panels (for Corridor & Executive walls)
  static createFlutedWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e140d'; // Deep shadow groove background
    ctx.fillRect(0, 0, 512, 512);

    const slatW = 16;
    const gap = 3;
    for (let x = 0; x < 512; x += slatW + gap) {
      const shade = Math.floor(Math.random() * 20 - 10);
      const r = 195 + shade;
      const g = 140 + shade;
      const b = 92 + shade;

      // Slat face gradient (rounded 3D illusion)
      const grad = ctx.createLinearGradient(x, 0, x + slatW, 0);
      grad.addColorStop(0, `rgb(${r - 25}, ${g - 20}, ${b - 15})`);
      grad.addColorStop(0.3, `rgb(${r + 15}, ${g + 15}, ${b + 10})`);
      grad.addColorStop(0.85, `rgb(${r}, ${g}, ${b})`);
      grad.addColorStop(1, `rgb(${r - 35}, ${g - 30}, ${b - 20})`);

      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, slatW, 512);

      // Subtle vertical wood grain
      ctx.strokeStyle = 'rgba(75, 42, 20, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const gx = x + 3 + i * 4;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx + (Math.random() * 2 - 1), 512);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 1);
    return texture;
  }

  // Suspended Architectural Acoustic Ceiling Tile Grid with micro-perforations
  static createCeilingTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f1f5f9'; // Off-white acoustic tile
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    // Micro acoustic texture dots
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    for (let y = 4; y < 512; y += 8) {
      for (let x = 4; x < 512; x += 8) {
        if (Math.random() > 0.4) {
          ctx.beginPath();
          ctx.arc(x, y, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Modern flush T-bar grid joints
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 8);
    return texture;
  }

  // Authentic Wind-Swept High-Altitude Cirrus & Altocumulus Cloud Layers (ZERO circles)
  static createNaturalWispyCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, 2048, 1024);

    // 1. Long horizontal wavy cloud bands (Wind-sheared tropospheric cloud decks - smooth sinusoids, ZERO circles)
    const drawWispyBand = (baseY, thickness, opacity, freq1, freq2) => {
      ctx.save();
      const grad = ctx.createLinearGradient(0, baseY - thickness, 0, baseY + thickness);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(0.25, `rgba(255, 255, 255, ${opacity * 0.6})`);
      grad.addColorStop(0.50, `rgba(255, 255, 255, ${opacity})`);
      grad.addColorStop(0.75, `rgba(255, 255, 255, ${opacity * 0.6})`);
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= 2048; x += 16) {
        const wave = Math.sin(x * freq1) * (thickness * 0.4) + Math.cos(x * freq2) * (thickness * 0.25);
        ctx.lineTo(x, baseY + wave - thickness * 0.5);
      }
      ctx.lineTo(2048, baseY + thickness * 0.5);
      for (let x = 2048; x >= 0; x -= 16) {
        const wave = Math.sin(x * freq1) * (thickness * 0.4) + Math.cos(x * freq2) * (thickness * 0.25);
        ctx.lineTo(x, baseY + wave + thickness * 0.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Layer multiple smooth, natural cloud bands
    drawWispyBand(220, 50, 0.35, 0.003, 0.007);
    drawWispyBand(320, 70, 0.42, 0.002, 0.005);
    drawWispyBand(420, 85, 0.48, 0.0018, 0.004);
    drawWispyBand(520, 60, 0.30, 0.0025, 0.006);

    // 2. Feathery Cirrus Streamers (Wind-blown ice filaments drawn with smooth cubic Beziers, ZERO circles)
    ctx.save();
    for (let i = 0; i < 90; i++) {
      const startX = Math.random() * 2048;
      const startY = 140 + Math.random() * 460;
      const length = 200 + Math.random() * 550;
      const tilt = Math.random() * 40 - 20;

      const cGrad = ctx.createLinearGradient(startX, startY, startX + length, startY + tilt);
      cGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      cGrad.addColorStop(0.3, `rgba(255, 255, 255, ${0.15 + Math.random() * 0.25})`);
      cGrad.addColorStop(0.7, `rgba(255, 255, 255, ${0.10 + Math.random() * 0.20})`);
      cGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

      ctx.strokeStyle = cGrad;
      ctx.lineWidth = 4 + Math.random() * 18;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(
        startX + length * 0.33, startY + (Math.random() * 30 - 15),
        startX + length * 0.66, startY + (Math.random() * 30 - 15),
        startX + length, startY + tilt
      );
      ctx.stroke();
    }
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.needsUpdate = true;
    return texture;
  }

  // Realistic Shimmering Aquatic Caustics (for Plaza Reflecting Water Pool)
  static createWaterCausticsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep architectural turquoise/cyan pool water base
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, 512, 512);

    // Caustic light refraction rings & voronoi web
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
    ctx.lineWidth = 2.5;

    for (let c = 0; c < 120; c++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const r = 18 + Math.random() * 32;

      ctx.beginPath();
      ctx.ellipse(rx, ry, r, r * (0.6 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.stroke();

      // Interior turquoise glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  // Natural Weathered Wood Bark Texture (Furrowed ridges & organic grain)
  static createTreeBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep weathered oak bark foundation
    ctx.fillStyle = '#261a12';
    ctx.fillRect(0, 0, 512, 512);

    // Natural vertical bark ridges with organic waving
    const barkShades = ['#3a261a', '#4a3222', '#2f1e14', '#523a28', '#1f130b', '#342217'];
    for (let x = 0; x < 512; x += 3) {
      const shade = barkShades[Math.floor(Math.random() * barkShades.length)];
      ctx.fillStyle = shade;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      let curX = x;
      for (let y = 0; y <= 512; y += 32) {
        curX += (Math.random() - 0.5) * 3;
        ctx.lineTo(curX, y);
      }
      ctx.lineTo(curX + 2.5, 512);
      ctx.lineTo(x + 2.5, 0);
      ctx.closePath();
      ctx.fill();

      // Deep shadow fissures
      if (Math.random() > 0.65) {
        ctx.fillStyle = 'rgba(10, 5, 2, 0.75)';
        ctx.fillRect(curX, 0, 1.2, 512);
      }
    }

    // Subtle lichen & moss flecks
    ctx.fillStyle = 'rgba(84, 98, 70, 0.35)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  // Realistic Multi-Toned Botanical Foliage Texture (Lush leaves with sunlit highlights)
  static createTreeFoliageTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep forest green leaf background
    ctx.fillStyle = '#1c3d15';
    ctx.fillRect(0, 0, 512, 512);

    // Multi-shade leaf blade layers (dense organic leaf shapes, NO geometric circles)
    const leafTones = [
      '#26541d', '#316b25', '#3d822f', '#4b9a39',
      '#214a19', '#57a842', '#183812', '#64b84c'
    ];

    for (let i = 0; i < 8500; i++) {
      const lx = Math.random() * 512;
      const ly = Math.random() * 512;
      const lw = 3 + Math.random() * 6;
      const lh = 5 + Math.random() * 10;
      const rot = Math.random() * Math.PI;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.fillStyle = leafTones[Math.floor(Math.random() * leafTones.length)];

      // Elliptical leaf blade with pointed tip
      ctx.beginPath();
      ctx.ellipse(0, 0, lw / 2, lh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle light center rib
      if (Math.random() > 0.6) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(-0.4, -lh / 2, 0.8, lh);
      }
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  // Architectural Cast-Iron Tree Grate Texture (Plaza pavement integration)
  static createTreeGrateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark cast-iron finish
    ctx.fillStyle = '#1e2530';
    ctx.fillRect(0, 0, 512, 512);

    // Center circular mulch earth hole
    ctx.fillStyle = '#22150c';
    ctx.beginPath();
    ctx.arc(256, 256, 110, 0, Math.PI * 2);
    ctx.fill();

    // Cast-iron concentric ventilation slots
    ctx.strokeStyle = '#0f141c';
    ctx.lineWidth = 4;
    for (let r = 130; r < 240; r += 20) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial drainage ribs
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(a) * 120, 256 + Math.sin(a) * 120);
      ctx.lineTo(256 + Math.cos(a) * 240, 256 + Math.sin(a) * 240);
      ctx.stroke();
    }

    // Outer border frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 500);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Tactile Blister Paving for Pedestrian Crosswalk Transitions
  static createTactilePaverTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Safety yellow ground
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 0, 256, 256);

    // Blister warning bumps
    const bumpStep = 32;
    for (let y = 16; y < 256; y += bumpStep) {
      for (let x = 16; x < 256; x += bumpStep) {
        const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 8);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.7, '#f59e0b');
        grad.addColorStop(1, '#b45309');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    return texture;
  }

  // Outdoor Architectural Granite Plaza Pavers (Realistic multi-tone stonework)
  static createPlazaPavingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep slate stone background
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 1024, 1024);

    const tileW = 128;
    const tileH = 64;
    const stonePalettes = [
      { r: 120, g: 135, b: 152 }, // Slate blue-grey
      { r: 135, g: 148, b: 162 }, // Medium granite
      { r: 148, g: 160, b: 174 }, // Light granite
      { r: 108, g: 122, b: 138 }, // Warm charcoal granite
      { r: 158, g: 170, b: 182 }, // Pearl granite
    ];

    let row = 0;
    for (let y = 0; y < 1024; y += tileH) {
      const isOffset = (row % 2 === 1);
      const offsetX = isOffset ? tileW / 2 : 0;
      row++;

      for (let x = -tileW; x < 1024 + tileW; x += tileW) {
        const px = x + offsetX;
        if (px + tileW < 0 || px > 1024) continue;

        // Pick distinct stone palette with subtle variation
        const pal = stonePalettes[Math.floor(Math.random() * stonePalettes.length)];
        const varShade = Math.floor((Math.random() - 0.5) * 16);
        const cr = Math.min(255, Math.max(0, pal.r + varShade));
        const cg = Math.min(255, Math.max(0, pal.g + varShade));
        const cb = Math.min(255, Math.max(0, pal.b + varShade));

        ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
        const drawX = Math.max(0, px + 2);
        const drawW = Math.min(tileW - 4, 1024 - drawX);
        const drawY = y + 2;
        const drawH = tileH - 4;
        ctx.fillRect(drawX, drawY, drawW, drawH);

        // Top-left bevel specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(drawX, drawY, drawW, 1);
        ctx.fillRect(drawX, drawY, 1, drawH);

        // Bottom-right bevel shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(drawX, drawY + drawH - 1, drawW, 1);
        ctx.fillRect(drawX + drawW - 1, drawY, 1, drawH);

        // Natural granite flecks & quartz crystals
        for (let s = 0; s < 18; s++) {
          const fx = drawX + Math.random() * drawW;
          const fy = drawY + Math.random() * drawH;
          ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(30, 41, 59, 0.4)';
          ctx.fillRect(fx, fy, 1.5, 1.5);
        }
      }
    }

    // Clean recessed grout expansion joints
    ctx.strokeStyle = '#273343';
    ctx.lineWidth = 3;
    for (let y = 0; y <= 1024; y += tileH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  // Photorealistic Bitumen Asphalt Road Surface
  static createAsphaltRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep Charcoal Asphalt Base
    ctx.fillStyle = '#222831';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine speckled mineral aggregates
    const aggregateColors = ['#1a1f26', '#2d3748', '#384252', '#4a5568', '#161b22', '#28303d'];
    for (let i = 0; i < 22000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() > 0.85 ? 2.5 : 1.5;
      ctx.fillStyle = aggregateColors[Math.floor(Math.random() * aggregateColors.length)];
      ctx.fillRect(x, y, size, size);
    }

    // Subtle tar texture streaks
    ctx.fillStyle = 'rgba(15, 20, 26, 0.25)';
    for (let j = 0; j < 35; j++) {
      const y = Math.random() * 1024;
      const h = 4 + Math.random() * 12;
      ctx.fillRect(0, y, 1024, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(14, 14);
    return texture;
  }

  // Lush Manicured Green Lawn Turf (Campus park borders)
  static createGrassLawnTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep vibrant grass base
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, 512, 512);

    // Mower lawn bands (alternating subtle tone stripes)
    const bandW = 64;
    for (let x = 0; x < 512; x += bandW) {
      if ((x / bandW) % 2 === 0) {
        ctx.fillStyle = 'rgba(62, 123, 52, 0.22)';
        ctx.fillRect(x, 0, bandW, 512);
      }
    }

    // Fine grass blade texture
    const bladeColors = ['#3d7b34', '#498e3e', '#275022', '#529946', '#22461d', '#5ba84f'];
    for (let i = 0; i < 18000; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      ctx.fillStyle = bladeColors[Math.floor(Math.random() * bladeColors.length)];
      ctx.fillRect(gx, gy, 1.2, 3.2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    return texture;
  }

  // High-Visibility Crosswalk Zebra Stripes
  static createCrosswalkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Asphalt ground behind stripes
    ctx.fillStyle = '#222831';
    ctx.fillRect(0, 0, 512, 256);

    // Thick white zebra stripes
    ctx.fillStyle = '#f8fafc';
    const stripeW = 38;
    const gap = 24;
    for (let x = 16; x < 512; x += stripeW + gap) {
      ctx.fillRect(x, 18, stripeW, 220);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  // Ultra-High-Definition Illuminated Emergency Exit Portal Overhead Signboard (ISO 7010 standard)
  static createExitPortalSignTexture(gateLabel = 'EMERGENCY EXIT') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Vibrant Safety Green Background with soft glow gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#059669');
    grad.addColorStop(1, '#065f46');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);

    // High-visibility crisp border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 1004, 236);

    // Inner subtle glow border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, 980, 212);

    // === ISO 7010 Running Man Pictogram on the Left ===
    ctx.fillStyle = '#ffffff';

    // Open Door Outline
    ctx.fillRect(60, 48, 14, 160); // door left post
    ctx.fillRect(60, 48, 64, 14);  // door lintel
    ctx.fillRect(110, 48, 14, 160); // door right post

    // Running Figure
    // Head
    ctx.beginPath();
    ctx.arc(175, 82, 18, 0, Math.PI * 2);
    ctx.fill();

    // Body / Torso (leaning forward)
    ctx.save();
    ctx.translate(165, 110);
    ctx.rotate(0.3);
    ctx.fillRect(-10, 0, 20, 52);
    ctx.restore();

    // Running Legs
    // Left leg (bent back)
    ctx.beginPath();
    ctx.moveTo(160, 155);
    ctx.lineTo(135, 185);
    ctx.lineTo(120, 180);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Right leg (lunging forward through door)
    ctx.beginPath();
    ctx.moveTo(172, 155);
    ctx.lineTo(185, 195);
    ctx.lineTo(205, 205);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(165, 118);
    ctx.lineTo(195, 132);
    ctx.lineTo(210, 118);
    ctx.stroke();

    // === Center Text: Bold, Clear, Impossible to Miss ===
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px "Arial Black", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gateLabel, 550, 105);

    // Subtitle instruction
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('PUSH CRASH BAR TO OPEN • KEEP CLEAR AT ALL TIMES', 550, 175);

    // === Right Side: Large Directional Arrow ===
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(880, 68);
    ctx.lineTo(950, 128);
    ctx.lineTo(880, 188);
    ctx.lineTo(880, 150);
    ctx.lineTo(830, 150);
    ctx.lineTo(830, 106);
    ctx.lineTo(880, 106);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  }

  // Diagonal Safety Yellow & Black Caution Hazard Stripes for Threshold
  static createHazardStripesTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#eab308'; // Safety yellow
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#18181b'; // Carbon black
    const stripeW = 32;
    for (let x = -256; x < 512; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW + 256, 256);
      ctx.lineTo(x + 256, 256);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 1);
    return texture;
  }

  // Safety Red Fire Exit Door Decal (with Panic Hardware Push Badge)
  static createFireDoorSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b91c1c'; // Deep fire safety red
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 240);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EMERGENCY FIRE EXIT', 256, 75);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('PUSH BAR TO OPEN', 256, 135);

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ALARM WILL SOUND WHEN OPENED', 256, 185);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Directional Safety Runway with Glowing Chevrons leading to Assembly Area
  static createExitRunwayTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Deep safety green ground
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 256);

    // Glowing Chevrons pointing forward
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let x = 60; x < 512; x += 130) {
      ctx.beginPath();
      ctx.moveTo(x - 30, 60);
      ctx.lineTo(x + 20, 128);
      ctx.lineTo(x - 30, 196);
      ctx.stroke();
    }

    // Border guidance lines
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 512, 12);
    ctx.fillRect(0, 244, 512, 12);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 1);
    return texture;
  }

  // Precast Architectural Concrete with formwork tie holes & fine mineral aggregate
  static createConcreteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(Math.random() * 30 - 15);
      ctx.fillStyle = 'rgba(' + (160 + shade) + ', ' + (174 + shade) + ', ' + (192 + shade) + ', 0.25)';
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 256, 256);
    ctx.strokeRect(256, 0, 256, 256);
    ctx.strokeRect(0, 256, 256, 256);
    ctx.strokeRect(256, 256, 256, 256);

    const tieCoords = [
      [24, 24], [232, 24], [24, 232], [232, 232],
      [280, 24], [488, 24], [280, 232], [488, 232],
      [24, 280], [232, 280], [24, 488], [232, 488],
      [280, 280], [488, 280], [280, 488], [488, 488]
    ];
    tieCoords.forEach(([tx, ty]) => {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(tx, ty, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  // Architectural Anodized Aluminum Spandrel Panels with Crisp Horizontal Shadow Reveals
  static createSpandrelPanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#334155');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 512, 1);
    }

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 512, 4);
    ctx.fillRect(0, 252, 512, 4);
    ctx.fillRect(0, 0, 4, 256);
    ctx.fillRect(254, 0, 4, 256);
    ctx.fillRect(508, 0, 4, 256);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.fillRect(4, 5, 504, 1.5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }

  // Commercial EPDM / TPO Rooftop Membrane with heat-welded seams & protective aggregate
  static createRoofMembraneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(Math.random() * 24 - 12);
      ctx.fillStyle = 'rgb(' + (51 + shade) + ', ' + (65 + shade) + ', ' + (85 + shade) + ')';
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = '#1e293b';
    for (let y = 0; y < 512; y += 128) {
      ctx.fillRect(0, y, 512, 6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, y + 6, 512, 1);
      ctx.fillStyle = '#1e293b';
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  // Dark Architectural Louvers for Mechanical Penthouse & HVAC Chiller Enclosures
  static createMetalLouverTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 128, 256);

    const louverH = 16;
    for (let y = 0; y < 256; y += louverH) {
      const bladeGrad = ctx.createLinearGradient(0, y, 0, y + louverH);
      bladeGrad.addColorStop(0, '#475569');
      bladeGrad.addColorStop(0.35, '#334155');
      bladeGrad.addColorStop(0.85, '#1e293b');
      bladeGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bladeGrad;
      ctx.fillRect(0, y, 128, louverH - 3);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(0, y, 128, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    return texture;
  }

  // Polished Architectural Terrazzo with fine marble flecks for Lobby & Entrance
  static createTerrazzoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    const colors = ['#94a3b8', '#64748b', '#cbd5e1', '#b45309', '#0284c7', '#334155'];
    for (let i = 0; i < 900; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const r = Math.random() * 3.5 + 1.2;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, 0, 256, 256);
    ctx.strokeRect(256, 0, 256, 256);
    ctx.strokeRect(0, 256, 256, 256);
    ctx.strokeRect(256, 256, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  // Vehicular Entrance Loop Asphalt with Crisp White Road Demarcation
  static createAsphaltRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(Math.random() * 20 - 10);
      ctx.fillStyle = 'rgb(' + (30 + shade) + ', ' + (41 + shade) + ', ' + (59 + shade) + ')';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(16, 0, 6, 512);
    ctx.fillRect(490, 0, 6, 512);

    for (let y = 20; y < 512; y += 64) {
      ctx.fillRect(253, y, 6, 36);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10);
    return texture;
  }

  // Architectural Precast Concrete Stair Tread Texture
  static createConcreteStairTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = Math.floor(Math.random() * 24 - 12);
      ctx.fillStyle = 'rgb(' + (100 + shade) + ', ' + (116 + shade) + ', ' + (139 + shade) + ')';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    ctx.fillStyle = '#334155';
    for (let y = 16; y < 48; y += 8) {
      ctx.fillRect(0, y, 256, 2.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }

  // High-Contrast Anti-Slip Photoluminescent Nosing Strip
  static createAntiSlipNosingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 128, 32);

    ctx.fillStyle = '#0f172a';
    for (let x = -32; x < 160; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 10, 0);
      ctx.lineTo(x + 2, 32);
      ctx.lineTo(x - 8, 32);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }

  // Architectural Precast Exterior Facade Panel with Grooved Joints
  static createPrecastFacadeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(Math.random() * 20 - 10);
      ctx.fillStyle = 'rgb(' + (203 + shade) + ', ' + (213 + shade) + ', ' + (225 + shade) + ')';
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 504, 504);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, 500, 500);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  // Illuminated Emergency Exit Sign (ISO 7010 Running-Man)
  static createEmergencyExitSignTexture(isLeft = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = '#ecfdf5';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 240, 112);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', 140, 64);

    ctx.fillStyle = '#ffffff';
    const arrowX = isLeft ? 48 : 210;
    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(arrowX - 16, 64);
      ctx.lineTo(arrowX + 8, 44);
      ctx.lineTo(arrowX + 8, 56);
      ctx.lineTo(arrowX + 24, 56);
      ctx.lineTo(arrowX + 24, 72);
      ctx.lineTo(arrowX + 8, 72);
      ctx.lineTo(arrowX + 8, 84);
    } else {
      ctx.moveTo(arrowX + 16, 64);
      ctx.lineTo(arrowX - 8, 44);
      ctx.lineTo(arrowX - 8, 56);
      ctx.lineTo(arrowX - 24, 56);
      ctx.lineTo(arrowX - 24, 72);
      ctx.lineTo(arrowX - 8, 72);
      ctx.lineTo(arrowX - 8, 84);
    }
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }


  // Realistic Modern Office Glass Curtain Wall Texture (for surrounding skyline & commercial mid-rises)
  static createSurroundingBuildingGlassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep architectural blue/grey reflective glass tint
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    const floorH = 64;
    const windowW = 32;

    for (let y = 0; y < 512; y += floorH) {
      // Dark spandrel / floor slab band
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, y, 512, 12);

      // Window panes with randomized warm interior lighting & blinds
      for (let x = 0; x < 512; x += windowW) {
        const isLit = (Math.sin(x * 12.3 + y * 7.1) > 0.15);
        const hasBlinds = (Math.cos(x * 5.4 + y * 9.2) > 0.3);

        if (isLit) {
          // Warm LED interior office illumination
          ctx.fillStyle = hasBlinds ? '#fef08a' : '#fef9c3';
          ctx.fillRect(x + 2, y + 14, windowW - 4, floorH - 16);

          if (hasBlinds) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
            for (let by = y + 16; by < y + floorH - 4; by += 4) {
              ctx.fillRect(x + 2, by, windowW - 4, 1.5);
            }
          }
        } else {
          // Cool tinted reflective sky reflection
          const grad = ctx.createLinearGradient(x, y + 14, x + windowW, y + floorH);
          grad.addColorStop(0, '#1e3a5f');
          grad.addColorStop(0.5, '#2d4a6f');
          grad.addColorStop(1, '#15253b');
          ctx.fillStyle = grad;
          ctx.fillRect(x + 2, y + 14, windowW - 4, floorH - 16);
        }

        // Vertical Aluminum Mullions
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y + 12, 2, floorH - 12);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 8);
    return texture;
  }

  // Precast Concrete / Granite Architectural Facade Panels (for nearby campus buildings)
  static createCommercialFacadeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 512, 512);

    const panelW = 128;
    const panelH = 64;

    for (let y = 0; y < 512; y += panelH) {
      for (let x = 0; x < 512; x += panelW) {
        const offset = (y / panelH) % 2 === 0 ? 0 : panelW / 2;
        const px = (x + offset) % 512;
        const shade = Math.floor(Math.sin(px * 3 + y * 7) * 8);

        ctx.fillStyle = `rgb(${203 + shade}, ${213 + shade}, ${225 + shade})`;
        ctx.fillRect(px + 1, y + 1, panelW - 2, panelH - 2);

        // Shadow reveal groove
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, y, panelW, panelH);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  // Parking Lot Surface with Stall Striping & EV Markings
  static createParkingLotTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich dark asphalt
    ctx.fillStyle = '#262c36';
    ctx.fillRect(0, 0, 512, 512);

    // Fine asphalt aggregate noise
    for (let i = 0; i < 4000; i++) {
      const g = Math.floor(Math.random() * 30 + 35);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // White parking bay divider lines (vertical stalls)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    for (let x = 32; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 220);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 292);
      ctx.lineTo(x, 492);
      ctx.stroke();
    }

    // Stall end limit lines
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(492, 20);
    ctx.moveTo(20, 492);
    ctx.lineTo(492, 492);
    ctx.stroke();

    // Central driving aisle directional arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(256, 236);
    ctx.lineTo(240, 260);
    ctx.lineTo(250, 260);
    ctx.lineTo(250, 276);
    ctx.lineTo(262, 276);
    ctx.lineTo(262, 260);
    ctx.lineTo(272, 260);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  // Premium Architectural Granite Pedestrian Paver Texture
  static createPaverStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    const stoneW = 64;
    const stoneH = 32;

    for (let y = 0; y < 512; y += stoneH) {
      for (let x = 0; x < 512; x += stoneW) {
        const offset = (y / stoneH) % 2 === 0 ? 0 : stoneW / 2;
        const px = (x + offset) % 512;
        const v = Math.floor(Math.sin(px * 11 + y * 13) * 12);

        ctx.fillStyle = `rgb(${235 + v}, ${238 + v}, ${242 + v})`;
        ctx.fillRect(px + 1.5, y + 1.5, stoneW - 3, stoneH - 3);

        // Fine granite speckles
        for (let s = 0; s < 12; s++) {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.25)';
          ctx.fillRect(px + Math.random() * (stoneW - 4), y + Math.random() * (stoneH - 4), 1.5, 1.5);
        }
      }
    }

    // Shadow joint lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y <= 512; y += stoneH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

}
