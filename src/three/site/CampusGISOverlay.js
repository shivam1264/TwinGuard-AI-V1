// ============================================================================
// TWIN GUARD CAMPUS — 3D GIS & EMERGENCY OVERLAY VISUALIZATION
// ============================================================================
// Phase 10 & 11: Institutional, clean architectural overlay for the 3D Digital
// Twin. Renders ground decals for assembly points, route flow splines for
// evacuation paths, emergency vehicle ingress routes, and hazard barricades.
//
// Key Principles:
// 1. Reusable Meshes & Zero Per-Frame Allocations: High performance.
// 2. Subtle & Institutional: No cartoon graphics or excessive glow.
// 3. Ground-Clamped: Floats just above pavement (Y = 0.05m - 0.10m) to avoid z-fighting.
// ============================================================================

import * as THREE from 'three';
import { ASSEMBLY_STATUS } from './CampusSpatialModel.js';

export class CampusGISOverlay {
  constructor(scene, spatialModel) {
    this.scene = scene;
    this.spatialModel = spatialModel;

    this.group = new THREE.Group();
    this.group.name = 'CampusGISOverlay';
    this.group.userData = { id: 'GIS-OVERLAY', type: 'EMERGENCY_VISUALIZATION' };
    this.scene.add(this.group);

    // Layer subgroups
    this.assemblyGroup = new THREE.Group();
    this.assemblyGroup.name = 'GIS_AssemblyPoints';
    this.group.add(this.assemblyGroup);

    this.routesGroup = new THREE.Group();
    this.routesGroup.name = 'GIS_Routes';
    this.group.add(this.routesGroup);

    this.blockagesGroup = new THREE.Group();
    this.blockagesGroup.name = 'GIS_Blockages';
    this.group.add(this.blockagesGroup);

    this.stagingGroup = new THREE.Group();
    this.stagingGroup.name = 'GIS_StagingAreas';
    this.group.add(this.stagingGroup);

    this.assemblyMarkers = new Map();
    this.activeEvacRouteMesh = null;
    this.activeVehicleRouteMesh = null;
    this.pulseTime = 0;

    this.initAssemblyMarkers();
    this.initStagingMarkers();
  }

  // --------------------------------------------------------------------------
  // 1. ASSEMBLY POINT GROUND DECALS
  // --------------------------------------------------------------------------
  initAssemblyMarkers() {
    if (!this.spatialModel) return;

    this.spatialModel.getAllAssemblyPoints().forEach(ap => {
      const markerGroup = new THREE.Group();
      markerGroup.position.set(ap.position.x, 0.04, ap.position.z);

      // A. Outer Pulse Ring
      const ringGeom = new THREE.RingGeometry(ap.radius * 0.75, ap.radius * 0.85, 48);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.getColorForStatus(ap.status),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      markerGroup.add(ringMesh);

      // B. Inner Core Disc
      const coreGeom = new THREE.CircleGeometry(ap.radius * 0.65, 36);
      coreGeom.rotateX(-Math.PI / 2);
      const coreMat = new THREE.MeshBasicMaterial({
        color: this.getColorForStatus(ap.status),
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      markerGroup.add(coreMesh);

      // C. Center Target Beacon
      const beaconGeom = new THREE.CircleGeometry(2.5, 24);
      beaconGeom.rotateX(-Math.PI / 2);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });
      const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
      markerGroup.add(beaconMesh);

      this.assemblyGroup.add(markerGroup);
      this.assemblyMarkers.set(ap.id, {
        group: markerGroup,
        ringMesh,
        coreMesh,
        baseRadius: ap.radius,
        ap
      });
    });
  }

  getColorForStatus(status) {
    switch (status) {
      case ASSEMBLY_STATUS.SAFE:
        return 0x10b981; // Institutional Emerald Green
      case ASSEMBLY_STATUS.CAUTION:
        return 0xf59e0b; // Amber Caution
      case ASSEMBLY_STATUS.RESTRICTED:
      case ASSEMBLY_STATUS.FULL:
      case ASSEMBLY_STATUS.BLOCKED:
        return 0xef4444; // Emergency Crimson
      default:
        return 0x3b82f6; // Cyan Blue
    }
  }

  updateAssemblyMarkerStatus(assemblyId, status) {
    const marker = this.assemblyMarkers.get(assemblyId);
    if (!marker) return;
    const color = this.getColorForStatus(status);
    marker.ringMesh.material.color.setHex(color);
    marker.coreMesh.material.color.setHex(color);
  }

  // --------------------------------------------------------------------------
  // 2. EMERGENCY STAGING AREA MARKERS
  // --------------------------------------------------------------------------
  initStagingMarkers() {
    if (!this.spatialModel) return;

    // Command post marker
    const commandPost = this.spatialModel.commandStagingAreas.get('COMMAND-STAGING-MAIN');
    if (commandPost) {
      const cpGroup = new THREE.Group();
      cpGroup.position.set(commandPost.position.x, 0.05, commandPost.position.z);

      const ringGeom = new THREE.RingGeometry(4.5, 5.2, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6, // Tactical Blue
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      cpGroup.add(new THREE.Mesh(ringGeom, ringMat));
      this.stagingGroup.add(cpGroup);
    }
  }

  // --------------------------------------------------------------------------
  // 3. EVACUATION ROUTE SPLINE VISUALIZATION (PHASE 11)
  // --------------------------------------------------------------------------
  showEvacuationRoute(route) {
    this.clearEvacuationRoute();
    if (!route || !route.waypoints3D || route.waypoints3D.length < 2) return;

    const points = route.waypoints3D.map(p => new THREE.Vector3(p.x, Math.max(0.08, (p.y || 0) + 0.08), p.z));

    // Create continuous smooth 3D ribbon path
    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = 'catmullrom';
    curve.tension = 0.25;

    const divisions = Math.max(20, points.length * 8);
    const smoothPoints = curve.getPoints(divisions);
    const lineGeom = new THREE.BufferGeometry().setFromPoints(smoothPoints);

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4, // Cyan Egress Pulse
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });

    const routeLine = new THREE.Line(lineGeom, lineMat);
    routeLine.name = 'ActiveEvacuationRouteLine';
    this.routesGroup.add(routeLine);
    this.activeEvacRouteMesh = routeLine;

    // Add start / exit waymarkers
    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    const destBeacon = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 3.2, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.9, depthWrite: false })
    );
    destBeacon.position.copy(endPoint);
    destBeacon.position.y = 0.06;
    this.routesGroup.add(destBeacon);
  }

  clearEvacuationRoute() {
    if (this.activeEvacRouteMesh) {
      if (this.activeEvacRouteMesh.geometry) this.activeEvacRouteMesh.geometry.dispose();
      if (this.activeEvacRouteMesh.material) this.activeEvacRouteMesh.material.dispose();
      this.routesGroup.remove(this.activeEvacRouteMesh);
      this.activeEvacRouteMesh = null;
    }
    // Remove temporary destination beacons
    while (this.routesGroup.children.length > 0) {
      const child = this.routesGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this.routesGroup.remove(child);
    }
  }

  // --------------------------------------------------------------------------
  // 4. EMERGENCY RESPONDER VEHICLE ROUTE (PHASE 9 & 11)
  // --------------------------------------------------------------------------
  showEmergencyVehicleRoute(route) {
    this.clearEmergencyVehicleRoute();
    if (!route || !route.waypoints3D || route.waypoints3D.length < 2) return;

    const points = route.waypoints3D.map(p => new THREE.Vector3(p.x, Math.max(0.10, (p.y || 0) + 0.10), p.z));

    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = 'catmullrom';
    curve.tension = 0.2;

    const divisions = Math.max(24, points.length * 6);
    const smoothPoints = curve.getPoints(divisions);
    const lineGeom = new THREE.BufferGeometry().setFromPoints(smoothPoints);

    const lineMat = new THREE.LineDashedMaterial({
      color: 0xff5722, // Fluorescent Emergency Orange
      linewidth: 4,
      scale: 1,
      dashSize: 3,
      gapSize: 1.5,
      transparent: true,
      opacity: 0.98
    });

    const routeLine = new THREE.Line(lineGeom, lineMat);
    routeLine.computeLineDistances();
    routeLine.name = 'ActiveEmergencyVehicleRouteLine';
    this.routesGroup.add(routeLine);
    this.activeVehicleRouteMesh = routeLine;
  }

  clearEmergencyVehicleRoute() {
    if (this.activeVehicleRouteMesh) {
      if (this.activeVehicleRouteMesh.geometry) this.activeVehicleRouteMesh.geometry.dispose();
      if (this.activeVehicleRouteMesh.material) this.activeVehicleRouteMesh.material.dispose();
      this.routesGroup.remove(this.activeVehicleRouteMesh);
      this.activeVehicleRouteMesh = null;
    }
  }

  // --------------------------------------------------------------------------
  // 5. ROAD & PATH BLOCKAGE DECALS (PHASE 4)
  // --------------------------------------------------------------------------
  showBlockedMarker(position, width = 10.0) {
    const blockMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 2.8).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xef4444, // Red Barricade
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      })
    );
    blockMesh.position.set(position.x, 0.06, position.z);
    this.blockagesGroup.add(blockMesh);
  }

  clearBlockageMarkers() {
    while (this.blockagesGroup.children.length > 0) {
      const child = this.blockagesGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this.blockagesGroup.remove(child);
    }
  }

  // --------------------------------------------------------------------------
  // 6. FRAME-BY-FRAME TICK
  // --------------------------------------------------------------------------
  update(delta) {
    this.pulseTime += delta;
    const pulse = Math.sin(this.pulseTime * 2.5);

    // Subtle breathing pulse for assembly point outer rings
    this.assemblyMarkers.forEach(marker => {
      const scale = 1.0 + pulse * 0.04;
      marker.ringMesh.scale.set(scale, scale, scale);
    });
  }

  setVisibility(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.clearEvacuationRoute();
    this.clearEmergencyVehicleRoute();
    this.clearBlockageMarkers();
    this.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    this.scene.remove(this.group);
  }
}

