// ============================================================================
// TwinGuard AI - Emergency Vehicles & Rapid Intervention Dispatch System
// Simulates 3 Support Units: Fire Extinguisher Engine, Ambulance, Rescue Team
// Invariant: Arrives at nearest Ground Exit Gate within exactly 30.0s of fire
// ============================================================================

import * as THREE from 'three';

export class EmergencyVehiclesManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'EmergencyVehiclesSystem';
    this.scene.add(this.group);

    this.transitDuration = 30.0; // Exactly 30 seconds to arrive
    this.elapsedTime = 0.0;
    this.isActive = false;
    this.isArrived = false;
    this.isSirenMuted = true;
    this.isSprayActive = false;

    this.targetGate = { id: 'exit_west', name: 'West Gate (Stair Core A)', side: 'west' };
    this.hazardFloor = 7;

    // AudioContext for synthetic emergency siren
    this.audioCtx = null;
    this.sirenOsc = null;
    this.sirenGain = null;

    // Vehicle Groups
    this.fireEngine = null;
    this.ambulance = null;
    this.rescueTeam = null;

    // Flashing Strobe Lights List
    this.strobes = [];

    // On-Scene Perimeter Staging Markers
    this.perimeterGroup = new THREE.Group();
    this.perimeterGroup.name = 'EmergencyStagingPerimeter';
    this.perimeterGroup.visible = false;
    this.group.add(this.perimeterGroup);

    // Foam / Water Spray System
    this.sprayGroup = new THREE.Group();
    this.sprayGroup.visible = false;
    this.group.add(this.sprayGroup);

    this.buildVehicles();
    this.buildPerimeterDecorations();
    this.buildSpraySystem();
    this.reset();
  }

  // ==========================================================================
  // 1. PROCEDURAL 3D VEHICLE GENERATION
  // ==========================================================================

  buildVehicles() {
    this.fireEngine = this.createFireEngine();
    this.ambulance = this.createAmbulance();
    this.rescueTeam = this.createRescueUnit();

    this.group.add(this.fireEngine);
    this.group.add(this.ambulance);
    this.group.add(this.rescueTeam);
  }

  // 🚒 Fire Extinguisher Squad / Heavy Fire Engine (Engine 1)
  createFireEngine() {
    const root = new THREE.Group();
    root.name = 'Unit_FireEngine_1';

    // Materials
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.25, roughness: 0.35 });
    const darkRedMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.2, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.3 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.2 });
    const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const yellowStripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });

    // Main Chassis Body (7.4m long, 2.5m wide, 2.6m high)
    const bodyGeo = new THREE.BoxGeometry(2.5, 1.8, 7.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, redMat);
    bodyMesh.position.y = 1.3;
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Front Cab Roof (White top)
    const cabRoofGeo = new THREE.BoxGeometry(2.46, 0.2, 2.8);
    const cabRoof = new THREE.Mesh(cabRoofGeo, whiteMat);
    cabRoof.position.set(0, 2.25, 2.2);
    root.add(cabRoof);

    // Windshield & Front Windows
    const windshieldGeo = new THREE.BoxGeometry(2.35, 0.8, 0.1);
    const windshield = new THREE.Mesh(windshieldGeo, darkGlassMat);
    windshield.position.set(0, 1.65, 3.72);
    windshield.rotation.x = -0.15;
    root.add(windshield);

    // Side Windows
    const sideWinGeo = new THREE.BoxGeometry(2.54, 0.7, 1.4);
    const sideWin = new THREE.Mesh(sideWinGeo, darkGlassMat);
    sideWin.position.set(0, 1.65, 2.4);
    root.add(sideWin);

    // Chrome Front Bumper & Grill
    const bumperGeo = new THREE.BoxGeometry(2.6, 0.45, 0.4);
    const bumper = new THREE.Mesh(bumperGeo, silverMat);
    bumper.position.set(0, 0.5, 3.8);
    root.add(bumper);

    // Equipment Lockers (Diamond plate silver sides)
    const lockerGeo = new THREE.BoxGeometry(2.54, 1.2, 4.2);
    const lockerMesh = new THREE.Mesh(lockerGeo, silverMat);
    lockerMesh.position.set(0, 1.3, -1.2);
    root.add(lockerMesh);

    // Side Yellow Chevron Safety Stripes
    const stripeGeo = new THREE.BoxGeometry(2.56, 0.2, 7.2);
    const stripeMesh = new THREE.Mesh(stripeGeo, yellowStripeMat);
    stripeMesh.position.set(0, 0.85, 0);
    root.add(stripeMesh);

    // Roof Extension Ladder (Silver)
    const ladderGeo = new THREE.BoxGeometry(0.8, 0.18, 4.8);
    const ladderMesh = new THREE.Mesh(ladderGeo, silverMat);
    ladderMesh.position.set(0.65, 2.3, -1.2);
    root.add(ladderMesh);

    // Roof Water Monitor / Deck Gun Nozzle
    const monitorBaseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 12);
    const monitorBase = new THREE.Mesh(monitorBaseGeo, darkRedMat);
    monitorBase.position.set(-0.5, 2.35, 0.8);
    const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.8, 12);
    const nozzle = new THREE.Mesh(nozzleGeo, silverMat);
    nozzle.position.set(-0.5, 2.6, 1.1);
    nozzle.rotation.x = Math.PI / 4;
    root.add(monitorBase);
    root.add(nozzle);

    // Wheels (6 wheels: 1 front axle, 2 rear dual axles)
    const wheelPositions = [
      { x: -1.25, z: 2.3 }, { x: 1.25, z: 2.3 },
      { x: -1.25, z: -1.4 }, { x: 1.25, z: -1.4 },
      { x: -1.25, z: -2.7 }, { x: 1.25, z: -2.7 }
    ];
    root.userData.wheels = [];

    wheelPositions.forEach(pos => {
      const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.34, 16);
      const wheelMesh = new THREE.Mesh(wheelGeo, rubberMat);
      wheelMesh.rotation.z = Math.PI / 2;
      wheelMesh.position.set(pos.x, 0.46, pos.z);
      wheelMesh.castShadow = true;

      // Silver Rim
      const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.36, 12);
      const rimMesh = new THREE.Mesh(rimGeo, silverMat);
      rimMesh.rotation.z = Math.PI / 2;
      rimMesh.position.set(pos.x, 0.46, pos.z);

      root.add(wheelMesh);
      root.add(rimMesh);
      root.userData.wheels.push(wheelMesh, rimMesh);
    });

    // Emergency Flashing Strobe Light Bar (Red & Blue)
    const lightBarGeo = new THREE.BoxGeometry(1.6, 0.15, 0.3);
    const barMesh = new THREE.Mesh(lightBarGeo, silverMat);
    barMesh.position.set(0, 2.38, 2.4);
    root.add(barMesh);

    const redLight = new THREE.PointLight(0xff0000, 3.5, 18);
    redLight.position.set(-0.6, 2.5, 2.4);
    root.add(redLight);

    const blueLight = new THREE.PointLight(0x0066ff, 3.5, 18);
    blueLight.position.set(0.6, 2.5, 2.4);
    root.add(blueLight);

    const redBeaconGeo = new THREE.BoxGeometry(0.4, 0.18, 0.25);
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const redBeacon = new THREE.Mesh(redBeaconGeo, redBeaconMat);
    redBeacon.position.set(-0.55, 2.45, 2.4);
    root.add(redBeacon);

    const blueBeaconGeo = new THREE.BoxGeometry(0.4, 0.18, 0.25);
    const blueBeaconMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
    const blueBeacon = new THREE.Mesh(blueBeaconGeo, blueBeaconMat);
    blueBeacon.position.set(0.55, 2.45, 2.4);
    root.add(blueBeacon);

    this.strobes.push({ lightA: redLight, lightB: blueLight, meshA: redBeacon, meshB: blueBeacon });

    return root;
  }

  // 🚑 Ambulance (Medic 1)
  createAmbulance() {
    const root = new THREE.Group();
    root.name = 'Unit_Ambulance_1';

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const redStripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const blueCrossMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 });
    const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });

    // Modular Ambulance Box Body (6.2m long, 2.4m wide, 2.4m high)
    const boxGeo = new THREE.BoxGeometry(2.4, 1.7, 4.2);
    const boxMesh = new THREE.Mesh(boxGeo, whiteMat);
    boxMesh.position.set(0, 1.3, -0.8);
    boxMesh.castShadow = true;
    root.add(boxMesh);

    // Front Cab
    const cabGeo = new THREE.BoxGeometry(2.2, 1.4, 2.0);
    const cabMesh = new THREE.Mesh(cabGeo, whiteMat);
    cabMesh.position.set(0, 1.15, 2.1);
    root.add(cabMesh);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(2.1, 0.7, 0.1);
    const windshield = new THREE.Mesh(windshieldGeo, darkGlassMat);
    windshield.position.set(0, 1.4, 3.05);
    windshield.rotation.x = -0.2;
    root.add(windshield);

    // High-Visibility Reflective Red Waist Stripe
    const stripeGeo = new THREE.BoxGeometry(2.44, 0.35, 4.22);
    const stripeMesh = new THREE.Mesh(stripeGeo, redStripeMat);
    stripeMesh.position.set(0, 1.15, -0.8);
    root.add(stripeMesh);

    // Star of Life / Medical Cross Signage (Left & Right sides)
    const crossVGeo = new THREE.BoxGeometry(2.46, 0.6, 0.2);
    const crossV = new THREE.Mesh(crossVGeo, blueCrossMat);
    crossV.position.set(0, 1.5, -0.8);
    const crossHGeo = new THREE.BoxGeometry(2.46, 0.2, 0.6);
    const crossH = new THREE.Mesh(crossHGeo, blueCrossMat);
    crossH.position.set(0, 1.5, -0.8);
    root.add(crossV);
    root.add(crossH);

    // Wheels (4 wheels)
    const wheelPositions = [
      { x: -1.15, z: 1.9 }, { x: 1.15, z: 1.9 },
      { x: -1.2, z: -1.6 }, { x: 1.2, z: -1.6 }
    ];
    root.userData.wheels = [];

    wheelPositions.forEach(pos => {
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
      const wheelMesh = new THREE.Mesh(wheelGeo, rubberMat);
      wheelMesh.rotation.z = Math.PI / 2;
      wheelMesh.position.set(pos.x, 0.42, pos.z);
      wheelMesh.castShadow = true;

      const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 12);
      const rimMesh = new THREE.Mesh(rimGeo, silverMat);
      rimMesh.rotation.z = Math.PI / 2;
      rimMesh.position.set(pos.x, 0.42, pos.z);

      root.add(wheelMesh);
      root.add(rimMesh);
      root.userData.wheels.push(wheelMesh, rimMesh);
    });

    // Amber & Blue Light Bar
    const barGeo = new THREE.BoxGeometry(1.5, 0.15, 0.3);
    const barMesh = new THREE.Mesh(barGeo, silverMat);
    barMesh.position.set(0, 2.22, 1.8);
    root.add(barMesh);

    const blueLight = new THREE.PointLight(0x0088ff, 3.2, 16);
    blueLight.position.set(-0.5, 2.35, 1.8);
    root.add(blueLight);

    const amberLight = new THREE.PointLight(0xff9900, 3.2, 16);
    amberLight.position.set(0.5, 2.35, 1.8);
    root.add(amberLight);

    const blueBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.2), new THREE.MeshBasicMaterial({ color: 0x0088ff }));
    blueBeacon.position.set(-0.5, 2.28, 1.8);
    const amberBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.2), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    amberBeacon.position.set(0.5, 2.28, 1.8);
    root.add(blueBeacon);
    root.add(amberBeacon);

    this.strobes.push({ lightA: blueLight, lightB: amberLight, meshA: blueBeacon, meshB: amberBeacon });

    return root;
  }

  // 🚨 Rescue Team / Incident Command Tactical Unit (Rescue 1)
  createRescueUnit() {
    const root = new THREE.Group();
    root.name = 'Unit_RescueTeam_1';

    const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35 });
    const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    // Heavy Tactical Rescue Truck Body (6.0m long, 2.4m wide, 2.4m high)
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.6, 6.0);
    const bodyMesh = new THREE.Mesh(bodyGeo, redMat);
    bodyMesh.position.set(0, 1.25, 0);
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Dark Tactical Cabin & Windows
    const cabGeo = new THREE.BoxGeometry(2.35, 0.9, 2.4);
    const cabMesh = new THREE.Mesh(cabGeo, charcoalMat);
    cabMesh.position.set(0, 1.7, 1.4);
    root.add(cabMesh);

    const winGeo = new THREE.BoxGeometry(2.42, 0.6, 1.8);
    const winMesh = new THREE.Mesh(winGeo, darkGlassMat);
    winMesh.position.set(0, 1.7, 1.4);
    root.add(winMesh);

    // Front Heavy-Duty Bull Bar & Winch
    const bullBarGeo = new THREE.BoxGeometry(2.5, 0.7, 0.3);
    const bullBar = new THREE.Mesh(bullBarGeo, charcoalMat);
    bullBar.position.set(0, 0.65, 3.1);
    root.add(bullBar);

    // Roof Equipment Rack & Tactical Floodlights
    const rackGeo = new THREE.BoxGeometry(1.8, 0.25, 3.2);
    const rackMesh = new THREE.Mesh(rackGeo, charcoalMat);
    rackMesh.position.set(0, 2.2, -0.8);
    root.add(rackMesh);

    // Wheels (4 big off-road tactical tires)
    const wheelPositions = [
      { x: -1.2, z: 1.8 }, { x: 1.2, z: 1.8 },
      { x: -1.2, z: -1.8 }, { x: 1.2, z: -1.8 }
    ];
    root.userData.wheels = [];

    wheelPositions.forEach(pos => {
      const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 16);
      const wheelMesh = new THREE.Mesh(wheelGeo, rubberMat);
      wheelMesh.rotation.z = Math.PI / 2;
      wheelMesh.position.set(pos.x, 0.48, pos.z);
      wheelMesh.castShadow = true;

      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12);
      const rimMesh = new THREE.Mesh(rimGeo, silverMat);
      rimMesh.rotation.z = Math.PI / 2;
      rimMesh.position.set(pos.x, 0.48, pos.z);

      root.add(wheelMesh);
      root.add(rimMesh);
      root.userData.wheels.push(wheelMesh, rimMesh);
    });

    // Dual Red & White Strobe Light Bar
    const redLight = new THREE.PointLight(0xff1100, 3.5, 18);
    redLight.position.set(-0.6, 2.35, 1.6);
    const whiteLight = new THREE.PointLight(0xffffff, 3.0, 18);
    whiteLight.position.set(0.6, 2.35, 1.6);
    root.add(redLight);
    root.add(whiteLight);

    const redBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    redBeacon.position.set(-0.6, 2.25, 1.6);
    const whiteBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    whiteBeacon.position.set(0.6, 2.25, 1.6);
    root.add(redBeacon);
    root.add(whiteBeacon);

    this.strobes.push({ lightA: redLight, lightB: whiteLight, meshA: redBeacon, meshB: whiteBeacon });

    return root;
  }

  // ==========================================================================
  // 2. ON-SCENE PERIMETER & TRIAGE FIELD SETUP
  // ==========================================================================

  buildPerimeterDecorations() {
    this.perimeterGroup.clear();

    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3 });
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const stretcherMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const tarpMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 });

    // 1. Triage Medical Tent (Yellow/Green)
    const tentGeo = new THREE.ConeGeometry(2.4, 2.2, 4);
    const tentMesh = new THREE.Mesh(tentGeo, tentMat);
    tentMesh.rotation.y = Math.PI / 4;
    tentMesh.position.set(0, 1.1, 0);
    this.perimeterGroup.add(tentMesh);

    // 2. Medical Triage Tarps / Ground Mat
    const tarpGeo = new THREE.PlaneGeometry(6.0, 4.0);
    const tarpMesh = new THREE.Mesh(tarpGeo, tarpMat);
    tarpMesh.rotation.x = -Math.PI / 2;
    tarpMesh.position.set(0, 0.05, 3.5);
    this.perimeterGroup.add(tarpMesh);

    // 3. Stretcher Cots on Tarp
    [-1.8, 0, 1.8].forEach(xOff => {
      const cotGeo = new THREE.BoxGeometry(1.8, 0.3, 0.8);
      const cotMesh = new THREE.Mesh(cotGeo, stretcherMat);
      cotMesh.rotation.y = Math.PI / 2;
      cotMesh.position.set(xOff, 0.2, 3.5);
      this.perimeterGroup.add(cotMesh);
    });

    // 4. Traffic / Safety Cones
    const conePositions = [
      { x: -5, z: -4 }, { x: -3, z: -5 }, { x: 3, z: -5 }, { x: 5, z: -4 },
      { x: -6, z: 5 }, { x: 6, z: 5 }
    ];
    conePositions.forEach(p => {
      const coneGeo = new THREE.ConeGeometry(0.2, 0.6, 12);
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(p.x, 0.3, p.z);
      this.perimeterGroup.add(cone);
    });
  }

  // Water / Foam Spray from Fire Engine
  buildSpraySystem() {
    this.sprayGroup.clear();
    const sprayCount = 65;
    const sprayGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const sprayMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.75 });

    this.sprayParticles = [];
    for (let i = 0; i < sprayCount; i++) {
      const mesh = new THREE.Mesh(sprayGeo, sprayMat);
      mesh.visible = false;
      this.sprayGroup.add(mesh);
      this.sprayParticles.push({
        mesh,
        life: Math.random(),
        speed: 18 + Math.random() * 8,
        spreadX: (Math.random() - 0.5) * 2.5,
        spreadY: (Math.random() - 0.5) * 1.5
      });
    }
  }

  // ==========================================================================
  // 3. ROUTE TRAJECTORY & SPLINE GENERATION
  // ==========================================================================

  getRoadSplineForGate(gateSide) {
    let targetPoints = [];

    if (gateSide === 'west') {
      // Drives North along entrance avenue, enters West Ring, and stages at Ground West Gate
      targetPoints = [
        new THREE.Vector3(0, 0.1, 215),
        new THREE.Vector3(0, 0.1, 150),
        new THREE.Vector3(0, 0.1, 86),
        new THREE.Vector3(-25, 0.1, 65),
        new THREE.Vector3(-45, 0.1, 35),
        new THREE.Vector3(-44, 0.1, 0) // Final West Gate Staging
      ];
    } else if (gateSide === 'east') {
      // Drives North along entrance avenue, enters East Ring, and stages at Ground East Gate
      targetPoints = [
        new THREE.Vector3(0, 0.1, 215),
        new THREE.Vector3(0, 0.1, 150),
        new THREE.Vector3(0, 0.1, 86),
        new THREE.Vector3(25, 0.1, 65),
        new THREE.Vector3(45, 0.1, 35),
        new THREE.Vector3(44, 0.1, 0) // Final East Gate Staging
      ];
    } else {
      // South / Main Front Gate
      targetPoints = [
        new THREE.Vector3(0, 0.1, 215),
        new THREE.Vector3(0, 0.1, 150),
        new THREE.Vector3(0, 0.1, 86),
        new THREE.Vector3(0, 0.1, 55),
        new THREE.Vector3(0, 0.1, 40) // Forecourt drop-off apron
      ];
    }

    return new THREE.CatmullRomCurve3(targetPoints);
  }

  // ==========================================================================
  // 4. DISPATCH & SIMULATION TIMING (30-SECOND ARRIVAL INVARIANT)
  // ==========================================================================

  dispatch(targetExitId = null, fireLocations = []) {
    this.isActive = true;
    this.elapsedTime = 0.0;
    this.isArrived = false;

    // Detect target gate based on hazard location
    if (targetExitId) {
      const side = targetExitId.includes('west') ? 'west' : (targetExitId.includes('east') ? 'east' : 'south');
      this.targetGate = {
        id: targetExitId,
        name: side === 'west' ? 'West Gate (Stair Core A)' : (side === 'east' ? 'East Gate (Stair Core B)' : 'Front / Main Gate (South)'),
        side
      };
    } else if (fireLocations && fireLocations.length > 0) {
      const fire = fireLocations[0];
      const fx = fire.x || 0;
      const rId = fire.roomId || '';
      this.hazardFloor = fire.floor || 7;

      if (fx < -5.0 || rId.endsWith('_r1') || rId.endsWith('_r2') || rId.endsWith('_r6') || rId.endsWith('_r7')) {
        this.targetGate = { id: 'exit_west', name: 'West Gate (Stair Core A)', side: 'west' };
      } else if (fx > 5.0 || rId.endsWith('_r4') || rId.endsWith('_r5') || rId.endsWith('_r9') || rId.endsWith('_r10')) {
        this.targetGate = { id: 'exit_east', name: 'East Gate (Stair Core B)', side: 'east' };
      } else {
        this.targetGate = { id: 'exit_south', name: 'Front / Main Gate (South)', side: 'south' };
      }
    }

    this.activeSpline = this.getRoadSplineForGate(this.targetGate.side);
    this.perimeterGroup.visible = false;
    this.sprayGroup.visible = false;

    // Position perimeter group at final staging zone
    if (this.targetGate.side === 'west') {
      this.perimeterGroup.position.set(-42, 0.1, 6.0);
    } else if (this.targetGate.side === 'east') {
      this.perimeterGroup.position.set(42, 0.1, 6.0);
    } else {
      this.perimeterGroup.position.set(0, 0.1, 34.0);
    }

    this.updateVehiclePositions(0.0);
  }

  update(delta, currentSimTime = null, isSimulating = true) {
    if (!this.isActive) return;

    if (currentSimTime !== null && isSimulating) {
      this.elapsedTime = currentSimTime;
    } else if (isSimulating) {
      this.elapsedTime += delta;
    }

    // Normalized transit progress: Exactly 0.0 -> 1.0 over 30.0 seconds
    const rawProgress = Math.min(1.0, this.elapsedTime / this.transitDuration);

    // Smoothstep acceleration and deceleration into staging
    const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

    this.updateVehiclePositions(progress);

    // Strobe light animation (~4.5 Hz frequency)
    const flashPhase = Math.sin(this.elapsedTime * 28.0);
    const stateA = flashPhase > 0;

    this.strobes.forEach(s => {
      s.lightA.intensity = stateA ? 4.5 : 0.0;
      s.lightB.intensity = stateA ? 0.0 : 4.5;
      if (s.meshA) s.meshA.material.opacity = stateA ? 1.0 : 0.2;
      if (s.meshB) s.meshB.material.opacity = stateA ? 0.2 : 1.0;
    });

    // Check 30-Second Arrival Threshold
    if (this.elapsedTime >= this.transitDuration && !this.isArrived) {
      this.isArrived = true;
      this.perimeterGroup.visible = true;
    }

    // Animate water/foam spray if enabled
    if (this.isSprayActive && this.fireEngine) {
      this.updateSprayParticles(delta);
    }
  }

  updateVehiclePositions(progress) {
    if (!this.activeSpline) return;

    // Offsets along spline for convoy spacing: Engine 1 leads, Rescue 1 follows, Medic 1 trails
    const engineP = Math.min(1.0, Math.max(0.0, progress));
    const rescueP = Math.min(1.0, Math.max(0.0, progress - 0.045));
    const medicP = Math.min(1.0, Math.max(0.0, progress - 0.090));

    // Update Fire Engine
    if (this.fireEngine) {
      const pt = this.activeSpline.getPoint(engineP);
      const tangent = this.activeSpline.getTangent(engineP);
      this.fireEngine.position.copy(pt);
      if (progress < 0.999) {
        this.fireEngine.lookAt(pt.clone().add(tangent));
      } else {
        // Parked heading facing building gate
        const targetX = this.targetGate.side === 'west' ? -29.2 : (this.targetGate.side === 'east' ? 29.2 : 0);
        this.fireEngine.lookAt(targetX, 0.1, this.fireEngine.position.z);
      }
      this.rotateWheels(this.fireEngine, progress < 1.0 ? 12 : 0);
    }

    // Update Rescue Team Unit
    if (this.rescueTeam) {
      const pt = this.activeSpline.getPoint(rescueP);
      const tangent = this.activeSpline.getTangent(rescueP);
      const lateralShift = this.targetGate.side === 'west' ? -2.5 : (this.targetGate.side === 'east' ? 2.5 : 4.0);
      this.rescueTeam.position.set(pt.x + lateralShift * (1 - progress * 0.5), pt.y, pt.z + (progress >= 1.0 ? 5.5 : 0));
      if (progress < 0.999) {
        this.rescueTeam.lookAt(pt.clone().add(tangent));
      } else {
        const targetX = this.targetGate.side === 'west' ? -29.2 : (this.targetGate.side === 'east' ? 29.2 : 0);
        this.rescueTeam.lookAt(targetX, 0.1, this.rescueTeam.position.z);
      }
      this.rotateWheels(this.rescueTeam, progress < 1.0 ? 12 : 0);
    }

    // Update Ambulance Unit
    if (this.ambulance) {
      const pt = this.activeSpline.getPoint(medicP);
      const tangent = this.activeSpline.getTangent(medicP);
      const lateralShift = this.targetGate.side === 'west' ? -4.5 : (this.targetGate.side === 'east' ? 4.5 : -4.0);
      this.ambulance.position.set(pt.x + lateralShift * (1 - progress * 0.5), pt.y, pt.z + (progress >= 1.0 ? 11.5 : 0));
      if (progress < 0.999) {
        this.ambulance.lookAt(pt.clone().add(tangent));
      } else {
        const targetX = this.targetGate.side === 'west' ? -29.2 : (this.targetGate.side === 'east' ? 29.2 : 0);
        this.ambulance.lookAt(targetX, 0.1, this.ambulance.position.z);
      }
      this.rotateWheels(this.ambulance, progress < 1.0 ? 12 : 0);
    }
  }

  rotateWheels(vehicle, speed) {
    if (vehicle.userData && vehicle.userData.wheels) {
      vehicle.userData.wheels.forEach(w => {
        w.rotation.x += speed * 0.05;
      });
    }
  }

  updateSprayParticles(delta) {
    if (!this.fireEngine || !this.sprayParticles) return;
    const nozzlePos = this.fireEngine.position.clone().add(new THREE.Vector3(0, 2.6, 0));
    const targetBuildingX = this.targetGate.side === 'west' ? -26.0 : (this.targetGate.side === 'east' ? 26.0 : 0.0);
    const targetDir = new THREE.Vector3(targetBuildingX - nozzlePos.x, 14.0, -nozzlePos.z).normalize();

    this.sprayParticles.forEach(p => {
      p.life += delta * 1.4;
      if (p.life > 1.0) {
        p.life = 0.0;
        p.mesh.position.copy(nozzlePos);
        p.mesh.visible = true;
      }

      // Ballistic water arc trajectory
      const t = p.life;
      p.mesh.position.x = nozzlePos.x + targetDir.x * (p.speed * t) + p.spreadX * t;
      p.mesh.position.z = nozzlePos.z + targetDir.z * (p.speed * t);
      p.mesh.position.y = nozzlePos.y + (targetDir.y * p.speed * t) - 9.8 * t * t * 0.45;
      p.mesh.scale.setScalar(0.8 + t * 2.5);
    });
  }

  toggleSpray() {
    this.isSprayActive = !this.isSprayActive;
    this.sprayGroup.visible = this.isSprayActive;
    return this.isSprayActive;
  }

  // ==========================================================================
  // 5. AUDIO SYNTHESIS: WEB AUDIO API EMERGENCY SIREN
  // ==========================================================================

  toggleSirenAudio() {
    if (this.isSirenMuted) {
      try {
        if (!this.audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        this.sirenOsc = this.audioCtx.createOscillator();
        this.sirenGain = this.audioCtx.createGain();

        this.sirenOsc.type = 'sawtooth';
        this.sirenGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime); // Low non-intrusive volume

        // Two-tone wail frequency modulation (680Hz to 960Hz)
        const now = this.audioCtx.currentTime;
        for (let i = 0; i < 60; i++) {
          this.sirenOsc.frequency.setValueAtTime(680, now + i * 1.2);
          this.sirenOsc.frequency.linearRampToValueAtTime(960, now + i * 1.2 + 0.6);
          this.sirenOsc.frequency.linearRampToValueAtTime(680, now + i * 1.2 + 1.2);
        }

        this.sirenOsc.connect(this.sirenGain);
        this.sirenGain.connect(this.audioCtx.destination);
        this.sirenOsc.start();
        this.isSirenMuted = false;
      } catch (err) {
        console.warn('AudioContext siren error:', err);
      }
    } else {
      this.muteSiren();
    }
    return !this.isSirenMuted;
  }

  muteSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch (_) {}
      this.sirenOsc = null;
    }
    this.isSirenMuted = true;
  }

  // ==========================================================================
  // 6. STATUS TELEMETRY FOR UI CONSUMPTION
  // ==========================================================================

  getStatus() {
    const rawProgress = Math.min(1.0, this.elapsedTime / this.transitDuration);
    const pct = Math.round(rawProgress * 100);
    const remainingSec = Math.max(0, this.transitDuration - this.elapsedTime);

    let status = 'STANDBY';
    if (this.isActive) {
      status = this.isArrived ? 'ON_SCENE' : 'EN_ROUTE';
    }

    return {
      isActive: this.isActive,
      isArrived: this.isArrived,
      status,
      elapsedSeconds: Math.floor(this.elapsedTime),
      etaSeconds: Number(remainingSec.toFixed(1)),
      progress: pct,
      targetGate: { ...this.targetGate },
      hazardFloor: this.hazardFloor,
      isSirenActive: !this.isSirenMuted,
      isSprayActive: this.isSprayActive,
      units: [
        {
          id: 'engine_1',
          name: 'Engine 1 (Fire Extinguisher)',
          type: 'FIRE',
          vehicle: 'Heavy Tactical Pumper & Foam Monitor',
          capacity: '4,000L Foam/Water • 50m Monitor',
          status: this.isArrived ? 'ON SCENE (STAGED)' : (this.isActive ? `EN ROUTE (${remainingSec.toFixed(0)}s ETA)` : 'STANDBY')
        },
        {
          id: 'medic_1',
          name: 'Medic 1 (Ambulance)',
          type: 'EMS',
          vehicle: 'Advanced Life Support (ALS) Unit',
          capacity: 'Field Triage • Cardiac & Burn Trauma Care',
          status: this.isArrived ? 'ON SCENE (TRIAGE ACTIVE)' : (this.isActive ? `EN ROUTE (${remainingSec.toFixed(0)}s ETA)` : 'STANDBY')
        },
        {
          id: 'rescue_1',
          name: 'Rescue 1 (Rescue Team)',
          type: 'RESCUE',
          vehicle: 'Tactical Search & Incident Command Unit',
          capacity: 'Heavy Hydraulic Extraction • Smoke Ejectors',
          status: this.isArrived ? 'ON SCENE (PERIMETER SECURED)' : (this.isActive ? `EN ROUTE (${remainingSec.toFixed(0)}s ETA)` : 'STANDBY')
        }
      ]
    };
  }

  reset() {
    this.isActive = false;
    this.elapsedTime = 0.0;
    this.isArrived = false;
    this.muteSiren();
    this.isSprayActive = false;
    this.perimeterGroup.visible = false;
    this.sprayGroup.visible = false;

    // Reset initial staging at South Entrance
    if (this.fireEngine) {
      this.fireEngine.position.set(0, 0.1, 215);
      this.fireEngine.rotation.set(0, Math.PI, 0);
    }
    if (this.ambulance) {
      this.ambulance.position.set(-3, 0.1, 222);
      this.ambulance.rotation.set(0, Math.PI, 0);
    }
    if (this.rescueTeam) {
      this.rescueTeam.position.set(3, 0.1, 222);
      this.rescueTeam.rotation.set(0, Math.PI, 0);
    }
  }

  dispose() {
    this.reset();
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (_) {}
    }
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}

