import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';

function makeFakeInstance(overrides = {}) {
  const camera = new THREE.PerspectiveCamera(44, 1, 1.2, 4200);
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const target = new THREE.Vector3(0, 0, 0);
  const controls = {
    target,
    minDistance: 2.5,
    maxDistance: 640,
    updates: 0,
    update() {
      this.updates += 1;
    }
  };

  const instance = {
    isDisposed: false,
    camera,
    controls,
    ...overrides
  };
  Object.setPrototypeOf(instance, SceneManager.prototype);
  return { instance, camera, controls, target };
}

function distanceToTarget(instance) {
  return instance.camera.position.distanceTo(instance.controls.target);
}

test('zoomIn moves camera closer to target without throwing', () => {
  const { instance } = makeFakeInstance();
  const before = distanceToTarget(instance);
  assert.doesNotThrow(() => SceneManager.prototype.zoomIn.call(instance, 1));
  assert.ok(distanceToTarget(instance) < before);
  assert.ok(instance.controls.updates >= 1);
});

test('zoomOut moves camera farther from target without throwing', () => {
  const { instance } = makeFakeInstance();
  const before = distanceToTarget(instance);
  assert.doesNotThrow(() => SceneManager.prototype.zoomOut.call(instance, 1));
  assert.ok(distanceToTarget(instance) > before);
  assert.ok(instance.controls.updates >= 1);
});

test('zoomIn respects minDistance (cannot go below it)', () => {
  const camera = new THREE.PerspectiveCamera(44, 1, 1.2, 4200);
  camera.position.set(0, 0, 60); // 60 m from target, well above minDistance 30
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const target = new THREE.Vector3(0, 0, 0);
  const controls = { target, minDistance: 30, maxDistance: 640, updates: 0, update() { this.updates += 1; } };
  const instance = { isDisposed: false, camera, controls };
  Object.setPrototypeOf(instance, SceneManager.prototype);
  const before = distanceToTarget(instance);
  SceneManager.prototype.zoomIn.call(instance, 100);
  assert.ok(distanceToTarget(instance) <= before);
  assert.ok(distanceToTarget(instance) >= 30 - 1e-6);
});

test('zoomOut respects maxDistance (cannot go above it)', () => {
  const { instance } = makeFakeInstance({ controls: { target: new THREE.Vector3(0, 0, 0), minDistance: 2.5, maxDistance: 23, updates: 0, update() { this.updates += 1; } } });
  const before = distanceToTarget(instance);
  SceneManager.prototype.zoomOut.call(instance, 100);
  assert.ok(distanceToTarget(instance) >= before);
  assert.ok(distanceToTarget(instance) <= 23 + 1e-6);
});

test('disposed instance is handled defensively (no throw, no movement)', () => {
  const { instance } = makeFakeInstance({ isDisposed: true });
  const before = distanceToTarget(instance);
  assert.doesNotThrow(() => SceneManager.prototype.zoomIn.call(instance, 1));
  assert.doesNotThrow(() => SceneManager.prototype.zoomOut.call(instance, 1));
  assert.equal(distanceToTarget(instance), before);
});

test('missing controls is handled defensively (no throw)', () => {
  const { camera } = makeFakeInstance();
  const instance = { isDisposed: false, camera, controls: null };
  Object.setPrototypeOf(instance, SceneManager.prototype);
  assert.doesNotThrow(() => SceneManager.prototype.zoomIn.call(instance, 1));
  assert.doesNotThrow(() => SceneManager.prototype.zoomOut.call(instance, 1));
});

test('zoomIn/zoomOut do not change camera orientation', () => {
  const { instance } = makeFakeInstance();
  const lookBefore = instance.camera.getWorldDirection(new THREE.Vector3()).clone();
  SceneManager.prototype.zoomIn.call(instance, 2);
  SceneManager.prototype.zoomOut.call(instance, 2);
  const lookAfter = instance.camera.getWorldDirection(new THREE.Vector3());
  assert.ok(lookBefore.equals(lookAfter));
});
