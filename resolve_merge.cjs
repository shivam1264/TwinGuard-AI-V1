const fs = require('fs');

// 1. Resolve ControlPanel.jsx
let cp = fs.readFileSync('src/components/ControlPanel.jsx', 'utf8');
const headIdx = cp.indexOf('<<<<<<< HEAD');
const endIdx = cp.indexOf('>>>>>>> origin/main') + '>>>>>>> origin/main'.length;

if (headIdx !== -1 && endIdx !== -1) {
  const replacement = `        {/* Center 2: Simulation Speed */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="text-[10px] text-slate-400 px-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> SPEED:
          </span>
          {[1.0, 2.0, 4.0].map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={\`px-2 py-0.5 rounded transition-all \${
                simSpeed === spd
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Right: Camera Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-hud text-slate-400 uppercase flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" /> CAM:
          </span>
          <button
            onClick={() => onSetCameraPreset('HERO_VIEW')}
            className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-hud font-bold rounded border border-cyan-500/50 transition-colors shadow-[0_0_8px_rgba(0,240,255,0.3)]"
          >
            Hero View (H)
          </button>
          <button
            onClick={() => onSetCameraPreset('ISOMETRIC')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 text-xs font-hud rounded border border-slate-700 transition-colors"
          >
            Isometric
          </button>
          <button
            onClick={() => onSetCameraPreset('TOP_DOWN')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 text-xs font-hud rounded border border-slate-700 transition-colors"
          >
            Top Down
          </button>
          <button
            onClick={() => onSetCameraPreset('CAMPUS_OVERVIEW')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 text-xs font-hud rounded border border-slate-700 transition-colors"
          >
            Campus Site
          </button>
          <button
            onClick={() => onSetCameraPreset('STAIRS_FOCUS')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 text-xs font-hud rounded border border-slate-700 transition-colors"
          >
            Stair Shaft
          </button>
        </div>`;
  cp = cp.slice(0, headIdx) + replacement + cp.slice(endIdx);
  fs.writeFileSync('src/components/ControlPanel.jsx', cp, 'utf8');
  console.log('Successfully resolved ControlPanel.jsx');
}

// 2. Resolve SceneManager.js
let sm = fs.readFileSync('src/three/SceneManager.js', 'utf8');

// Replace Conflict 1: initScene camera
sm = sm.replace(
  /<<<<<<< HEAD[\s\S]*?this\.camera = new THREE\.PerspectiveCamera\(42, width \/ height, 1\.5, 2800\);[\s\S]*?=======[\s\S]*?this\.camera = new THREE\.PerspectiveCamera\(38, width \/ height, 0\.4, 25000\);[\s\S]*?>>>>>>> origin\/main/,
  `    const width = this.container.clientWidth || window.innerWidth || 1200;
    const height = this.container.clientHeight || (window.innerHeight - 56) || 800;
    // Set near to 1.5 and far to 25000 for full architectural depth, campus master plan, and giant sky vault
    this.camera = new THREE.PerspectiveCamera(38, width / height, 1.5, 25000);`
);

// Replace Conflict 2: sunLight position
sm = sm.replace(
  /<<<<<<< HEAD[\s\S]*?sunLight\.position\.set\(120, 220, 160\);[\s\S]*?=======[\s\S]*?sunLight\.position\.set\(45, 68, 50\);[\s\S]*?>>>>>>> origin\/main/,
  `    // Directional Sunlight angled across campus with soft architectural shadows
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 2.2);
    sunLight.position.set(120, 220, 160);`
);

// Replace Conflict 3: shadow bounds
sm = sm.replace(
  /<<<<<<< HEAD[\s\S]*?sunLight\.shadow\.camera\.far = 650;[\s\S]*?sunLight\.shadow\.camera\.bottom = -280;[\s\S]*?=======[\s\S]*?sunLight\.shadow\.camera\.bottom = -110;[\s\S]*?>>>>>>> origin\/main/,
  `    sunLight.shadow.camera.far = 650;
    sunLight.shadow.camera.left = -280;
    sunLight.shadow.camera.right = 280;
    sunLight.shadow.camera.top = 280;
    sunLight.shadow.camera.bottom = -280;`
);

// Replace Conflict 4: setCameraPreset
sm = sm.replace(
  /<<<<<<< HEAD[\s\S]*?targetPos\.set\(0, 20, 70\);[\s\S]*?targetLook\.set\(0, 19, 0\);[\s\S]*?=======[\s\S]*?targetPos\.set\(-44, 18, 58\);[\s\S]*?targetLook\.set\(0, 17, 0\);[\s\S]*?>>>>>>> origin\/main/,
  `    if (presetName === 'CAMPUS_OVERVIEW') {
      targetPos.set(0, 310, 340);
      targetLook.set(0, 10, 20);
    } else if (presetName === 'HERO_VIEW' || presetName === 'DEFAULT') {
      // Golden Ratio 3/4 Perspective framing south plaza, entrance canopy, and west corner
      targetPos.set(-44, 18, 58);
      targetLook.set(0, 17, 0);`
);

fs.writeFileSync('src/three/SceneManager.js', sm, 'utf8');
console.log('Successfully resolved SceneManager.js');
