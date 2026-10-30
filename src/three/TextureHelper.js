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

  // Outdoor Granite Plaza Pavers (surrounding ground landscape)
  static createPlazaPavingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Light architectural limestone / travertine paving
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        const shade = Math.floor(Math.random() * 14 - 7);
        ctx.fillStyle = `rgb(${238 + shade}, ${242 + shade}, ${246 + shade})`;
        ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Subtle granite travertine flecks
        for (let s = 0; s < 12; s++) {
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.6)' : 'rgba(148,163,184,0.35)';
          ctx.fillRect(x + Math.random() * (tileSize - 4), y + Math.random() * (tileSize - 4), 2, 2);
        }
      }
    }

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
    texture.repeat.set(24, 24);
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

}
