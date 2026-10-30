import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FUTURE_BUILDING_PLOTS } from './CampusLayout.js';

// ============================================================================
// FUTURE ARCHITECTURAL DEVELOPMENT PARCELS (MATCHING REFERENCE MASTER PLAN)
// ============================================================================
// Implements authentic master plan development parcels:
// - Flush warm golden-green sod parcel ground (NO GIANT GREY SLABS!)
// - 4-sided stone perimeter boundary curbs (borders only, center remains grass)
// - Subtle building envelope footprint outlines
// - Paved asphalt driveway aprons connecting each parcel to campus roads
// - Modern low-profile identity totems with glowing cyan display badges

export class FuturePlotManager {
  constructor(sharedMaterials) {
    this.materials = sharedMaterials;
    this.group = new THREE.Group();
    this.group.name = 'FutureBuildingPlots';
    this.group.userData = { id: 'PLOTS-CONTAINER', type: 'FUTURE_PLOTS_SYSTEM' };

    this.subgroups = {
      parcelTurf: new THREE.Group(),
      parcelCurbs: new THREE.Group(),
      envelopeBorders: new THREE.Group(),
      driveways: new THREE.Group(),
      totems: new THREE.Group()
    };

    this.group.add(this.subgroups.parcelTurf);
    this.group.add(this.subgroups.parcelCurbs);
    // envelopeBorders omitted now that authentic 3D building plinths occupy the parcels
    this.group.add(this.subgroups.driveways);
    this.group.add(this.subgroups.totems);

    this.buildPlots();
  }

  buildPlots() {
    const parcelTurfGeos = [];
    const parcelCurbGeos = [];
    const envelopeBorderGeos = [];
    const drivewayGeos = [];
    const totemGeos = [];
    const totemScreenGeos = [];

    const totemMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8
    });

    const totemScreenMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    const footprintBorderMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.65,
      metalness: 0.1
    });

    FUTURE_BUILDING_PLOTS.forEach(plot => {
      const cx = plot.center.x;
      const cz = plot.center.z;
      const angle = plot.angle || 0;
      const w = plot.size.width;
      const d = plot.size.depth;

      // ----------------------------------------------------------------------
      // 1. Parcel Turf Ground (Flush with terrain, warm golden-green sod pad)
      // ----------------------------------------------------------------------
      const pTurf = new THREE.PlaneGeometry(w, d);
      pTurf.rotateX(-Math.PI / 2);
      pTurf.rotateY(angle);
      pTurf.translate(cx, 0.038, cz);
      parcelTurfGeos.push(pTurf);

      // ----------------------------------------------------------------------
      // 2. 4-Sided Stone Perimeter Border Curb (Border only, center is turf!)
      // ----------------------------------------------------------------------
      const curbThick = 0.45;
      const curbH = 0.14;
      const halfW = w * 0.5;
      const halfD = d * 0.5;

      const cN = new THREE.BoxGeometry(w + curbThick, curbH, curbThick);
      cN.translate(0, curbH * 0.5, -halfD);

      const cS = new THREE.BoxGeometry(w + curbThick, curbH, curbThick);
      cS.translate(0, curbH * 0.5, halfD);

      const cW = new THREE.BoxGeometry(curbThick, curbH, d);
      cW.translate(-halfW, curbH * 0.5, 0);

      const cE = new THREE.BoxGeometry(curbThick, curbH, d);
      cE.translate(halfW, curbH * 0.5, 0);

      const pCurb = BufferGeometryUtils.mergeGeometries([cN, cS, cW, cE]);
      pCurb.rotateY(angle);
      pCurb.translate(cx, 0.038, cz);
      parcelCurbGeos.push(pCurb);

      // ----------------------------------------------------------------------
      // 3. Subtle Building Envelope Footprint Outline (Low Stone Edging Border)
      // ----------------------------------------------------------------------
      const ew = w * 0.68;
      const ed = d * 0.68;
      const bThick = 0.25;
      const bHeight = 0.06;

      const fN = new THREE.BoxGeometry(ew, bHeight, bThick);
      fN.translate(0, bHeight * 0.5, -ed * 0.5);

      const fS = new THREE.BoxGeometry(ew, bHeight, bThick);
      fS.translate(0, bHeight * 0.5, ed * 0.5);

      const fW = new THREE.BoxGeometry(bThick, bHeight, ed);
      fW.translate(-ew * 0.5, bHeight * 0.5, 0);

      const fE = new THREE.BoxGeometry(bThick, bHeight, ed);
      fE.translate(ew * 0.5, bHeight * 0.5, 0);

      const fOutline = BufferGeometryUtils.mergeGeometries([fN, fS, fW, fE]);
      fOutline.rotateY(angle);
      fOutline.translate(cx, 0.044, cz);
      envelopeBorderGeos.push(fOutline);

      // ----------------------------------------------------------------------
      // 4. Low-Profile Modern Identity Totem (2.4m tall at parcel corner)
      // ----------------------------------------------------------------------
      const totemH = 2.4;
      const totemW = 0.8;
      const totemD = 0.22;
      const tX = cx + Math.cos(angle) * (w * 0.48);
      const tZ = cz + Math.sin(angle) * (d * 0.48);

      const tBox = new THREE.BoxGeometry(totemW, totemH, totemD);
      tBox.rotateY(angle);
      tBox.translate(tX, totemH * 0.5, tZ);
      totemGeos.push(tBox);

      // Cyan Glowing Badge
      const scGeo = new THREE.PlaneGeometry(totemW * 0.75, 0.35);
      scGeo.rotateY(angle);
      scGeo.translate(tX, totemH * 0.72, tZ + 0.12);
      totemScreenGeos.push(scGeo);
    });

    // ------------------------------------------------------------------------
    // Assemble Subgroups
    // ------------------------------------------------------------------------
    if (parcelTurfGeos.length > 0) {
      const mergedTurf = BufferGeometryUtils.mergeGeometries(parcelTurfGeos);
      const mesh = new THREE.Mesh(mergedTurf, this.materials.parcelTurfMat);
      mesh.receiveShadow = false;
      this.subgroups.parcelTurf.add(mesh);
    }

    if (parcelCurbGeos.length > 0) {
      const mergedCurbs = BufferGeometryUtils.mergeGeometries(parcelCurbGeos);
      const mesh = new THREE.Mesh(mergedCurbs, this.materials.curbMat);
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      this.subgroups.parcelCurbs.add(mesh);
    }

    if (envelopeBorderGeos.length > 0) {
      const mergedBorders = BufferGeometryUtils.mergeGeometries(envelopeBorderGeos);
      const mesh = new THREE.Mesh(mergedBorders, footprintBorderMat);
      mesh.receiveShadow = false;
      this.subgroups.envelopeBorders.add(mesh);
    }

    if (totemGeos.length > 0) {
      const mergedTotems = BufferGeometryUtils.mergeGeometries(totemGeos);
      const mesh = new THREE.Mesh(mergedTotems, totemMat);
      mesh.castShadow = true;
      this.subgroups.totems.add(mesh);
    }

    if (totemScreenGeos.length > 0) {
      const mergedScreens = BufferGeometryUtils.mergeGeometries(totemScreenGeos);
      const mesh = new THREE.Mesh(mergedScreens, totemScreenMat);
      this.subgroups.totems.add(mesh);
    }
  }
}
