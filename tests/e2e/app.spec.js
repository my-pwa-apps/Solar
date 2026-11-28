import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Read from package.json rather than hardcoding: a hardcoded literal turned every
// routine version bump into three unrelated test failures, and asserted nothing
// beyond "someone remembered to edit the spec".
const APP_VERSION = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8')
).version;

function collectDiagnostics(page) {
  const diagnostics = [];

  page.on('pageerror', (error) => {
    diagnostics.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.push(`console error: ${message.text()}`);
    }
  });

  page.on('requestfailed', (request) => {
    const resourceType = request.resourceType();
    const failure = request.failure()?.errorText || 'unknown failure';
    if (['document', 'script', 'stylesheet', 'font', 'manifest', 'xhr', 'fetch'].includes(resourceType)) {
      diagnostics.push(`request failed: ${resourceType} ${request.url()} (${failure})`);
    }
  });

  return diagnostics;
}

async function prepareStableFirstRun(page) {
  await page.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    localStorage.setItem('orbitsVisible', 'all');
    localStorage.setItem('constellationsVisible', 'false');
    localStorage.setItem('labelsVisible', 'false');
    localStorage.setItem('scaleMode', 'educational');
    localStorage.setItem('bloomEnabled', 'false');
    localStorage.setItem('space_voyage_sound', 'false');
  });
}

async function openApp(page) {
  await prepareStableFirstRun(page);
  await page.goto('/');

  await page.waitForFunction(() => {
    const app = window.app;
    const loading = document.querySelector('#loading');
    return Boolean(
      app?._experienceStarted &&
      app?.sceneManager?.renderer?.domElement instanceof HTMLCanvasElement &&
      app?.solarSystemModule?.planets?.earth &&
      app?.solarSystemModule?.labels?.length > 0 &&
      loading?.classList.contains('hidden')
    );
  }, { timeout: 60_000 });
}

async function openModalFromButton(page, buttonSelector, modalSelector) {
  const modal = page.locator(modalSelector);
  await page.locator(buttonSelector).click({ force: true });
  try {
    await expect(modal).not.toHaveClass(/hidden/, { timeout: 3_000 });
  } catch {
    await page.locator(buttonSelector).dispatchEvent('click');
    await expect(modal).not.toHaveClass(/hidden/);
  }
}

test('Saturn rings remain in the equatorial plane and render in front of the globe', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const { solarSystemModule: solar, sceneManager } = window.app;
    sceneManager.renderer.setAnimationLoop(null);
    const saturn = solar.planets.saturn;
    const ring = saturn.userData.rings[0];
    const axis = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const alignments = [];
    for (const angle of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
      saturn.rotation.y = angle;
      saturn.updateWorldMatrix(true, true);
      saturn.getWorldQuaternion(quaternion);
      axis.set(0, 1, 0).applyQuaternion(quaternion);
      ring.getWorldQuaternion(quaternion);
      normal.set(0, 0, 1).applyQuaternion(quaternion);
      alignments.push(Math.abs(axis.dot(normal)));
    }

    const renderer = sceneManager.renderer;
    const scene = new THREE.Scene();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshBasicMaterial({ color: 0x0033ff }));
    const material = ring.material.clone();
    material.uniforms.useTexture.value = false;
    material.uniforms.ringColor.value.set(0xffffff);
    material.uniforms.ringOpacity.value = 1;
    const testRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.8, 128), material);
    testRing.rotation.x = Math.PI / 2;
    scene.add(sphere, testRing);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 3, 7);
    camera.lookAt(0, 0, 0);
    const target = new THREE.WebGLRenderTarget(128, 128);
    const oldTarget = renderer.getRenderTarget();
    const render = () => {
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      const pixels = new Uint8Array(128 * 128 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 128, 128, pixels);
      return pixels;
    };
    testRing.visible = false;
    const globe = render();
    testRing.visible = true;
    const actual = render();
    const referenceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, depthWrite: false });
    testRing.material = referenceMaterial;
    const reference = render();
    let frontPixels = 0;
    let mismatchedPixels = 0;
    for (let i = 0; i < globe.length; i += 4) {
      if (globe[i + 2] < 100) continue;
      const expectedFront = reference[i] > 100;
      const actualFront = actual[i] > 100;
      if (expectedFront) frontPixels++;
      if (expectedFront !== actualFront) mismatchedPixels++;
    }
    renderer.setRenderTarget(oldTarget);
    target.dispose();
    sphere.geometry.dispose();
    sphere.material.dispose();
    testRing.geometry.dispose();
    material.dispose();
    referenceMaterial.dispose();
    return { alignments, frontPixels, mismatchedPixels };
  });
  expect(result.alignments.every(value => value > 0.99999)).toBe(true);
  expect(result.frontPixels).toBeGreaterThan(20);
  expect(result.mismatchedPixels).toBeLessThan(5);
});

test('chase follows moving targets, preserves camera input, and reset cancels fly-in', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const { solarSystemModule: solar, sceneManager: sm } = window.app;
    sm.renderer.setAnimationLoop(null);
    const camera = sm.camera;
    const controls = sm.controls;
    const parent = solar.planets.earth;
    const moon = Object.values(solar.moons).find(item => item.userData.parentPlanet?.toLowerCase() === 'earth');
    const world = new THREE.Vector3();
    const parentPos = new THREE.Vector3();
    const follow = (object, coRotate) => {
      solar.focusedObject = object;
      solar.cameraFollowMode = true;
      solar.cameraCoRotateMode = coRotate;
      solar._cameraFollowObject = null;
      object.getWorldPosition(world);
      controls.target.copy(world);
      camera.position.copy(world).add(new THREE.Vector3(2, 1, 0));
      solar.updateCameraTracking(camera, controls);
    };
    follow(moon, true);
    parent.getWorldPosition(parentPos);
    camera.position.copy(world).addScaledVector(world.clone().sub(parentPos).normalize(), 2);
    camera.position.y += 1;
    controls.target.add(new THREE.Vector3(0, 0.2, 0));
    camera.position.add(new THREE.Vector3(0, 0.2, 0));
    const distance = camera.position.distanceTo(controls.target);
    const pan = controls.target.distanceTo(world);
    moon.userData.angle += Math.PI / 2;
    solar._updateMoonPosition(moon);
    solar.updateCameraTracking(camera, controls);
    moon.getWorldPosition(world);
    parent.getWorldPosition(parentPos);
    const radial = world.clone().sub(parentPos).normalize();
    const offset = camera.position.clone().sub(controls.target);
    const after = {
      distance: camera.position.distanceTo(controls.target),
      pan: controls.target.distanceTo(world),
      radialDot: offset.normalize().dot(radial)
    };
    const moving = [
      [solar.planets.mars, false],
      [solar.satellites[0], true],
      [solar.comets[0], true],
      [solar.exoplanets[0], false],
      [solar.spacecraft.find(item => item.userData.trajectory), false]
    ];
    const centered = moving.map(([object, coRotate]) => {
      follow(object, coRotate);
      solar.update(0.1, 100000, camera, controls);
      object.getWorldPosition(world);
      return controls.target.distanceTo(world);
    });
    const comet = solar.comets[0];
    follow(comet, true);
    comet.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.4);
    solar.updateCameraTracking(camera, controls);
    comet.getWorldPosition(world);
    const cometError = controls.target.distanceTo(world);
    solar.resetCameraTracking();
    sm.pauseMode = 'orbital';
    solar.update(1, 1, camera, controls);
    const planetCraft = solar.spacecraft.filter(item => item.userData.orbitPlanet);
    const relativePositions = planetCraft.map(item => item.getWorldPosition(new THREE.Vector3()).sub(item.parent.getWorldPosition(new THREE.Vector3())));
    solar.update(1, 1, camera, controls);
    const craftDrift = planetCraft.map((item, index) => item.getWorldPosition(new THREE.Vector3())
      .sub(item.parent.getWorldPosition(new THREE.Vector3())).distanceTo(relativePositions[index]));
    sm.pauseMode = 'none';
    solar.focusOnObject(parent, camera, controls);
    solar.updateCameraTracking(camera, controls);
    const disabledDuringFlyIn = !solar.cameraFollowMode;
    solar.resetCameraTracking();
    sm.resetCamera();
    const resetPosition = camera.position.clone();
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      distance, pan, after, centered, cometError, craftDrift, disabledDuringFlyIn,
      resetError: camera.position.distanceTo(resetPosition),
      resetFocus: solar.focusedObject, damping: controls.enableDamping
    };
  });
  expect(result.after.distance).toBeCloseTo(result.distance, 6);
  expect(result.after.pan).toBeCloseTo(result.pan, 6);
  expect(result.after.radialDot).toBeGreaterThan(0.7);
  expect(result.centered.every(value => value < 1e-6)).toBe(true);
  expect(result.cometError).toBeLessThan(1e-6);
  expect(result.craftDrift.length).toBeGreaterThanOrEqual(2);
  expect(result.craftDrift.every(value => value < 1e-6)).toBe(true);
  expect(result.disabledDuringFlyIn).toBe(true);
  expect(result.resetError).toBeLessThan(1e-6);
  expect(result.resetFocus).toBeNull();
  expect(result.damping).toBe(true);
});

test('focus selects the correct follow mode without moving the XR camera', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const { solarSystemModule: solar, sceneManager: sm } = window.app;
    sm.renderer.setAnimationLoop(null);
    const targets = [
      Object.values(solar.moons).find(item => item.userData.parentPlanet?.toLowerCase() === 'earth'),
      solar.comets[0],
      solar.exoplanets[0],
      solar.spacecraft.find(item => item.userData.trajectory)
    ];
    const modes = [];
    for (const target of targets) {
      solar.focusOnObject(target, sm.camera, sm.controls);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      modes.push([solar.cameraFollowMode, solar.cameraCoRotateMode]);
    }
    solar.focusOnObject(targets[0], sm.camera, sm.controls);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const moonPos = targets[0].getWorldPosition(new THREE.Vector3());
    const earthPos = solar.planets.earth.getWorldPosition(new THREE.Vector3());
    const radial = moonPos.clone().sub(earthPos).normalize();
    const moonOffset = sm.camera.position.clone().sub(moonPos).normalize();
    const moonOutward = radial.dot(moonOffset);
    const cameraBefore = sm.camera.position.clone();
    sm.renderer.xr.isPresenting = true;
    solar.focusOnObject(solar.planets.saturn, sm.camera, sm.controls);
    solar.updateCameraTracking(sm.camera, sm.controls);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const xrCameraError = sm.camera.position.distanceTo(cameraBefore);
    sm.renderer.xr.isPresenting = false;
    return { modes, moonOutward, xrCameraError };
  });
  expect(result.modes).toEqual([[true, true], [true, true], [true, false], [true, false]]);
  expect(result.moonOutward).toBeGreaterThan(0.9);
  expect(result.xrCameraError).toBeLessThan(1e-6);
});

test('preserves labels, belt distributions and rendering optimizations', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const app = window.app;
    const sceneManager = app.sceneManager;
    const solar = app.solarSystemModule;
    const renderer = sceneManager.renderer;
    renderer.setAnimationLoop(null);

    const label = solar.labels[0];
    const canvas = label.material.map.image;
    const canvasPixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let opaquePixels = 0;
    for (let i = 3; i < canvasPixels.length; i += 4) {
      if (canvasPixels[i] > 0) opaquePixels++;
    }

    const target = new THREE.WebGLRenderTarget(128, 32);
    const labelScene = new THREE.Scene();
    const sprite = new THREE.Sprite(label.material);
    sprite.scale.set(2, 2, 1);
    labelScene.add(sprite);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;
    const oldTarget = renderer.getRenderTarget();
    const oldColor = renderer.getClearColor(new THREE.Color()).clone();
    const oldAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0, 0);
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(labelScene, camera);
    const pixels = new Uint8Array(128 * 32 * 4);
    renderer.readRenderTargetPixels(target, 0, 0, 128, 32, pixels);
    renderer.setRenderTarget(oldTarget);
    renderer.setClearColor(oldColor, oldAlpha);
    target.dispose();
    let renderedPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) renderedPixels++;
    }

    const makeCloud = (points) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      const group = new THREE.Group();
      group.add(new THREE.Points(geometry, new THREE.PointsMaterial()));
      return group;
    };
    const mock = {
      asteroidBelt: makeCloud([120, 0, 0, 155, 1, 0]),
      kuiperBelt: makeCloud([1990, 0, 0, 2790, 2, 0]),
      oortCloud: makeCloud([3000, 0, 0, 9000, 0, 0]),
      realisticScale: true
    };
    const clouds = [mock.asteroidBelt, mock.kuiperBelt, mock.oortCloud].map(group => group.children[0]);
    const original = clouds.map(cloud => Array.from(cloud.geometry.attributes.position.array));
    solar.updateBelts.call(mock);
    const scaled = clouds.map(cloud => ({
      positions: Array.from(cloud.geometry.attributes.position.array),
      bound: cloud.geometry.boundingSphere.radius
    }));
    mock.realisticScale = false;
    solar.updateBelts.call(mock);
    const restored = clouds.map(cloud => Array.from(cloud.geometry.attributes.position.array));
    clouds.forEach(cloud => {
      cloud.geometry.dispose();
      cloud.material.dispose();
    });

    const jetInstances = solar.comets.map(comet => {
      const jets = comet.children.find(child => child.isInstancedMesh);
      return jets?.count;
    });
    const comet = solar.comets[0];
    const jets = comet.children.find(child => child.isInstancedMesh);
    comet.updateWorldMatrix(true, true);
    const instanceMatrix = new THREE.Matrix4();
    jets.getMatrixAt(0, instanceMatrix);
    const jetCenter = new THREE.Vector3().setFromMatrixPosition(instanceMatrix).applyMatrix4(jets.matrixWorld);
    const raycaster = new THREE.Raycaster(jetCenter.clone().add(new THREE.Vector3(0, 0, 1)), new THREE.Vector3(0, 0, -1));
    const jetHit = raycaster.intersectObject(jets).some(hit => Number.isInteger(hit.instanceId));
    const galaxies = solar.galaxies.filter(galaxy => galaxy.userData.type === 'backgroundGalaxy');
    const galaxiesCulled = galaxies.length > 0 && galaxies.every(galaxy => galaxy.frustumCulled);
    const bumpDimensions = ['earth', 'mars', 'mercury']
      .map(name => solar.planets[name].material.bumpMap.image.width);
    const dwarfSegments = solar.planets.pluto.geometry.parameters.widthSegments;
    const planetSegments = solar.planets.earth.geometry.parameters.widthSegments;
    const materials = new Set();
    solar.constellations.forEach(constellation => constellation.traverse(child => {
      if (child.material) materials.add(child.material);
    }));
    const materialCacheComplete = materials.size === solar._constellationMaterials.length
      && solar._constellationMaterials.every(material => materials.has(material));
    const fadeCamera = new THREE.PerspectiveCamera();
    fadeCamera.position.set(18000, 0, 0);
    solar.update(0.016, 0, fadeCamera, sceneManager.controls);
    const faded = solar._constellationMaterials.every(material =>
      Math.abs(material.opacity - (material.userData.originalOpacity ?? 1) * 0.5) < 1e-6);
    fadeCamera.position.set(100, 0, 0);
    solar.update(0.016, 0, fadeCamera, sceneManager.controls);
    const fadeRestored = solar._constellationMaterials.every(material =>
      material.opacity === (material.userData.originalOpacity ?? 1));
    const { TEXTURE_CACHE, warmupTextureCache } = await import('/src/modules/TextureCache.js');
    const originalGet = TEXTURE_CACHE.get;
    const cacheKey = 'earth_bump_1024_canvas';
    const previousCanvas = TEXTURE_CACHE.cache.get(cacheKey);
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 16;
    mockCanvas.height = 8;
    const mockURL = mockCanvas.toDataURL();
    const warmedKeys = [];
    TEXTURE_CACHE.get = async key => {
      warmedKeys.push(key);
      return key === 'earth_bump_1024' ? mockURL : null;
    };
    try {
      await warmupTextureCache();
    } finally {
      TEXTURE_CACHE.get = originalGet;
    }
    const warmedCanvas = TEXTURE_CACHE.cache.get(cacheKey);
    const warmupSize = [warmedCanvas.width, warmedCanvas.height];
    if (previousCanvas) TEXTURE_CACHE.cache.set(cacheKey, previousCanvas);
    else TEXTURE_CACHE.cache.delete(cacheKey);

    let postProcessing = null;
    if (sceneManager.composer) {
      const composer = sceneManager.composer;
      sceneManager._pendingDprChange = 0.6;
      const setAnimationLoop = renderer.setAnimationLoop;
      let renderFrame;
      renderer.setAnimationLoop = callback => { renderFrame = callback; };
      sceneManager.animate(() => {});
      renderer.setAnimationLoop = setAnimationLoop;
      renderFrame();
      const adaptiveRatio = composer._pixelRatio;
      const ratio = 0.6;
      sceneManager.onResize();
      const resizedWidth = composer.renderTarget1.width;
      renderer.setSize(160, 90, false);
      composer.setSize(160, 90);
      sceneManager.bloomPass.enabled = true;
      sceneManager.bloomPass.strength = 0;
      composer.render();
      const capture = () => {
        const image = document.createElement('canvas');
        image.width = renderer.domElement.width;
        image.height = renderer.domElement.height;
        const context = image.getContext('2d');
        context.drawImage(renderer.domElement, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      const strengthZero = capture();
      sceneManager.toggleBloom(false);
      renderer.info.autoReset = false;
      renderer.info.reset();
      composer.render();
      const disabledCalls = renderer.info.render.calls;
      const disabled = capture();
      let totalDifference = 0;
      for (let i = 0; i < disabled.length; i++) totalDifference += Math.abs(disabled[i] - strengthZero[i]);
      sceneManager.bloomPass.strength = sceneManager._bloomStrength;
      sceneManager.toggleBloom(true);
      renderer.info.reset();
      composer.render();
      const enabledCalls = renderer.info.render.calls;
      renderer.info.autoReset = true;
      postProcessing = {
        adaptiveRatio,
        ratio: composer._pixelRatio,
        resizedWidth,
        expectedWidth: Math.floor(window.innerWidth * ratio),
        averageDifference: totalDifference / disabled.length,
        reenabled: sceneManager.bloomPass.enabled,
        savedCalls: enabledCalls - disabledCalls
      };
    }
    let disposedJets = 0;
    solar.comets.forEach(item => {
      item.children.find(child => child.isInstancedMesh)
        .addEventListener('dispose', () => { disposedJets++; });
    });
    solar.cleanup(sceneManager.scene);
    return {
      labelWidth: canvas.width, labelHeight: canvas.height, opaquePixels, renderedPixels,
      original, scaled, restored, jetInstances, jetHit, galaxiesCulled, bumpDimensions,
      dwarfSegments, planetSegments, materialCacheComplete, faded, fadeRestored,
      warmedKeys, warmupSize, postProcessing, disposedJets
    };
  });

  expect(result.labelWidth).toBe(512);
  expect(result.labelHeight).toBe(64);
  expect(result.opaquePixels).toBeGreaterThan(100);
  expect(result.renderedPixels).toBeGreaterThan(100);
  expect(result.scaled[0].positions[0]).toBeCloseTo(320);
  expect(result.scaled[1].positions[3]).toBeGreaterThan(8250);
  expect(result.scaled[2].bound).toBeGreaterThan(19000);
  for (let cloud = 0; cloud < result.original.length; cloud++) {
    for (let i = 0; i < result.original[cloud].length; i++) {
      expect(result.restored[cloud][i]).toBeCloseTo(result.original[cloud][i], 2);
    }
  }
  expect(result.jetInstances).toEqual([5, 5, 5, 5, 5, 5]);
  expect(result.jetHit).toBe(true);
  expect(result.disposedJets).toBe(6);
  expect(result.galaxiesCulled).toBe(true);
  expect(result.bumpDimensions.every(width => width <= 1024)).toBe(true);
  expect(result.dwarfSegments).toBeLessThanOrEqual(64);
  expect(result.planetSegments).toBeGreaterThanOrEqual(result.dwarfSegments);
  expect(result.materialCacheComplete && result.faded && result.fadeRestored).toBe(true);
  expect(result.warmedKeys).toContain('earth_bump_1024');
  expect(result.warmedKeys).toHaveLength(2);
  expect(result.warmupSize).toEqual([16, 8]);
  if (result.postProcessing) {
    expect(result.postProcessing.adaptiveRatio).toBe(0.6);
    expect(result.postProcessing.ratio).toBe(0.6);
    expect(result.postProcessing.resizedWidth).toBe(result.postProcessing.expectedWidth);
    expect(result.postProcessing.averageDifference).toBeLessThan(1);
    expect(result.postProcessing.reenabled).toBe(true);
    expect(result.postProcessing.savedCalls).toBeGreaterThanOrEqual(10);
  }
});

test('batches graphics while preserving picking, filters and resource ownership', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const app = window.app;
    const solar = app.solarSystemModule;
    const manager = app.sceneManager;
    const renderer = manager.renderer;
    renderer.setAnimationLoop(null);

    solar.toggleConstellations(true);
    const big = solar.constellations.find(group => group.userData.name === 'bigDipper');
    const little = solar.constellations.find(group => group.userData.name === 'littleDipper');
    const star = big.children.find(child => child.userData.name === 'Dubhe');
    const batches = big.children.filter(child => child.isInstancedMesh);
    const matrix = new THREE.Matrix4();
    batches[0].getMatrixAt(0, matrix);
    const instancePosition = new THREE.Vector3().setFromMatrixPosition(matrix);
    manager.scene.updateMatrixWorld(true);
    const starPosition = star.getWorldPosition(new THREE.Vector3());
    const starRay = new THREE.Raycaster(starPosition.clone().add(new THREE.Vector3(0, 0, 100)), new THREE.Vector3(0, 0, -1));
    starRay.layers.enable(1);
    const starPicked = starRay.intersectObject(big, true).some(hit => hit.object === star);
    const oldCameraPosition = manager.camera.position.clone();
    const oldCameraQuaternion = manager.camera.quaternion.clone();
    manager.camera.position.copy(starPosition).add(new THREE.Vector3(0, 0, 100));
    manager.camera.lookAt(starPosition);
    manager.camera.updateMatrixWorld(true);
    const rect = renderer.domElement.getBoundingClientRect();
    const namedStar = app._raycastNamedObject({
      clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2
    }, true);
    const namedStarPicked = namedStar?.userData?.name === star.userData.name
      && namedStar.userData.isConstellationStar;
    manager.camera.position.copy(oldCameraPosition);
    manager.camera.quaternion.copy(oldCameraQuaternion);
    manager.camera.updateMatrixWorld(true);
    solar.highlightConstellation(big);
    const polaris = little.children.find(child => child.userData.name === 'Polaris');
    const polarisVisible = little.visible && polaris.visible && polaris.layers.isEnabled(0)
      && little.children.filter(child => child.isInstancedMesh).every(child => !child.visible)
      && solar._polarisPointerLine.visible;
    solar.resetConstellationHighlight();
    const polarisReset = !polaris.layers.isEnabled(0) && little.children
      .filter(child => child.isInstancedMesh).every(child => child.visible);
    const isolatedScene = new THREE.Scene();
    isolatedScene.add(big);
    const starCamera = new THREE.PerspectiveCamera(120, 1, 1, 50000);
    starCamera.lookAt(starPosition);
    renderer.info.autoReset = false;
    starCamera.layers.set(1);
    renderer.info.reset();
    renderer.render(isolatedScene, starCamera);
    const originalStarCalls = renderer.info.render.calls;
    starCamera.layers.set(0);
    renderer.info.reset();
    renderer.render(isolatedScene, starCamera);
    const batchedStarCalls = renderer.info.render.calls;
    renderer.info.autoReset = true;
    manager.scene.add(big);

    const comparePointPicking = () => {
      manager.scene.updateMatrixWorld(true);
      let comparisons = 0;
      let equal = true;
      for (const group of [solar.asteroidBelt, solar.kuiperBelt, solar.oortCloud]) {
        for (const cloud of group.children) {
          const positions = cloud.geometry.attributes.position;
          for (const index of [0, Math.floor(positions.count / 2), positions.count - 1]) {
            const point = new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(cloud.matrixWorld);
            const ray = new THREE.Raycaster(point.clone().add(new THREE.Vector3(5, 8, 7)),
              new THREE.Vector3(-5, -8, -7).normalize());
            ray.params.Points.threshold = 0.25;
            const indexed = [];
            const original = [];
            cloud.raycast(ray, indexed);
            THREE.Points.prototype.raycast.call(cloud, ray, original);
            const summarize = hits => hits.map(hit => [hit.index, hit.distance]).sort((a, b) => a[0] - b[0]);
            const a = summarize(indexed);
            const b = summarize(original);
            equal &&= a.length === b.length && a.every((hit, i) =>
              hit[0] === b[i][0] && Math.abs(hit[1] - b[i][1]) < 1e-6);
            comparisons++;
          }
        }
      }
      return { equal, comparisons };
    };
    const pickingBefore = comparePointPicking();
    const benchmarkCloud = solar.oortCloud.children[1];
    const benchmarkRay = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(1, 0, 0));
    const measurePicking = method => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) method.call(benchmarkCloud, benchmarkRay, []);
      return performance.now() - start;
    };
    const indexedMs = measurePicking(benchmarkCloud.raycast);
    const linearMs = measurePicking(THREE.Points.prototype.raycast);
    solar.realisticScale = true;
    solar.updateScale();
    const pickingAfter = comparePointPicking();
    const planetBatches = solar.orbits.filter(orbit => orbit.userData.type === 'orbit');
    const orbitCounts = {
      planets: planetBatches.filter(orbit => !orbit.userData.isDwarf).length,
      dwarfs: planetBatches.filter(orbit => orbit.userData.isDwarf).length,
      comets: solar.cometOrbits.length
    };
    const cometVertices = solar.cometOrbits[0].geometry.attributes.position;
    const cometPerihelion = solar.comets[0].userData.distance * (1 - solar.comets[0].userData.eccentricity);
    const orbitGeometryValid = cometVertices.count === solar.comets.length * 256 * 2
      && Math.abs(cometVertices.getX(0) - cometPerihelion) < 0.01
      && Math.abs(cometVertices.getY(0)) < 1e-6
      && Math.abs(cometVertices.getZ(0)) < 1e-6;
    const filters = {};
    for (const mode of ['planets', 'dwarfs', 'moons', 'comets', 'none']) {
      solar.setOrbitMode(mode);
      filters[mode] = [
        planetBatches.find(orbit => !orbit.userData.isDwarf).visible,
        planetBatches.find(orbit => orbit.userData.isDwarf).visible,
        solar.orbits.find(orbit => orbit.userData.type === 'moonOrbit').visible,
        solar.cometOrbits[0].visible
      ];
    }

    const cloud = solar.asteroidBelt.children[0];
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0], 3));
    pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1], 3));
    pointsGeometry.setAttribute('particleSize', new THREE.Float32BufferAttribute([2, 8], 1));
    const pointScene = new THREE.Scene();
    pointScene.add(new THREE.Points(pointsGeometry, cloud.material));
    const pointCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    pointCamera.position.z = 10;
    const target = new THREE.WebGLRenderTarget(64, 64);
    const oldTarget = renderer.getRenderTarget();
    const oldColor = renderer.getClearColor(new THREE.Color()).clone();
    const oldAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0, 0);
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(pointScene, pointCamera);
    const pixels = new Uint8Array(64 * 64 * 4);
    renderer.readRenderTargetPixels(target, 0, 0, 64, 64, pixels);
    renderer.setRenderTarget(oldTarget);
    renderer.setClearColor(oldColor, oldAlpha);
    target.dispose();
    pointsGeometry.dispose();
    let leftPixels = 0;
    let rightPixels = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        if (pixels[(y * 64 + x) * 4 + 3] > 0) {
          if (x < 32) leftPixels++;
          else rightPixels++;
        }
      }
    }

    const craft = solar.spacecraft[0];
    craft.updateWorldMatrix(true, true);
    const craftPosition = craft.getWorldPosition(new THREE.Vector3());
    solar._cameraWorldPosition.copy(craftPosition).add(new THREE.Vector3(100000, 0, 0));
    solar._updateSpacecraftLOD(manager.camera);
    const farLOD = craft.userData.lod.marker.visible && !craft.userData.lod.detail.visible;
    const markerPosition = craft.userData.lod.marker.getWorldPosition(new THREE.Vector3());
    const markerRay = new THREE.Raycaster(markerPosition.clone().add(new THREE.Vector3(0, 0, craft.userData.lod.radius * 3)), new THREE.Vector3(0, 0, -1));
    const markerPickable = markerRay.intersectObject(craft.userData.lod.marker).length > 0;
    solar._cameraWorldPosition.copy(craftPosition);
    solar._updateSpacecraftLOD(manager.camera);
    const nearLOD = craft.userData.lod.detail.visible && !craft.userData.lod.marker.visible;

    const light = solar.sun.userData.sunLight;
    const shadowsSupported = renderer.shadowMap.enabled;
    solar.focusedObject = solar.planets.earth;
    solar._updateFocusedShadows();
    const earthShadows = light.castShadow && solar.planets.earth.castShadow && solar.moons.moon.castShadow
      && !solar.planets.mars.castShadow;
    let shadowDifference = 0;
    if (shadowsSupported) {
      const shadowScene = new THREE.Scene();
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      const occluder = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      plane.receiveShadow = true;
      occluder.castShadow = true;
      occluder.position.z = 3;
      const shadowCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 30);
      shadowCamera.position.set(3, 0, 10);
      shadowCamera.lookAt(0, 0, 0);
      const oldLightPosition = light.position.clone();
      const oldFar = light.shadow.camera.far;
      light.position.set(0, 0, 10);
      light.shadow.camera.far = 30;
      light.shadow.camera.updateProjectionMatrix();
      shadowScene.add(light, plane, occluder, new THREE.AmbientLight(0xffffff, 0.05));
      const shadowTarget = new THREE.WebGLRenderTarget(96, 96);
      renderer.setRenderTarget(shadowTarget);
      renderer.render(shadowScene, shadowCamera);
      const withShadow = new Uint8Array(96 * 96 * 4);
      renderer.readRenderTargetPixels(shadowTarget, 0, 0, 96, 96, withShadow);
      light.castShadow = false;
      renderer.render(shadowScene, shadowCamera);
      const withoutShadow = new Uint8Array(96 * 96 * 4);
      renderer.readRenderTargetPixels(shadowTarget, 0, 0, 96, 96, withoutShadow);
      for (let i = 0; i < withShadow.length; i += 4) {
        if (withoutShadow[i] > withShadow[i] + 5) shadowDifference++;
      }
      renderer.setRenderTarget(null);
      shadowTarget.dispose();
      plane.geometry.dispose();
      plane.material.dispose();
      occluder.geometry.dispose();
      occluder.material.dispose();
      light.position.copy(oldLightPosition);
      light.shadow.camera.far = oldFar;
      light.shadow.camera.updateProjectionMatrix();
      light.castShadow = true;
      manager.scene.add(light);
    }
    solar.focusedObject = solar.moons.moon;
    solar._updateFocusedShadows();
    const moonShadows = light.castShadow && solar.planets.earth.castShadow && solar.moons.moon.castShadow;
    solar.focusedObject = solar.planets.venus;
    solar._updateFocusedShadows();
    const moonlessShadows = light.castShadow;

    const placeholder = new THREE.Texture();
    placeholder.userData.planetPlaceholder = true;
    let placeholderDisposals = 0;
    placeholder.addEventListener('dispose', () => { placeholderDisposals++; });
    const replacement = new THREE.Texture();
    const fallbackMoon = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({ map: placeholder }));
    solar.moons.testfallback = fallbackMoon;
    solar._applyProceduralPlanetTexture('testFallback', replacement);
    const moonFallbackApplied = fallbackMoon.material.map === replacement;
    solar.objects.push(fallbackMoon);

    let labelDisposals = 0;
    let cometTextureDisposals = 0;
    let orbitDisposals = 0;
    solar.labels[0].material.map.addEventListener('dispose', () => { labelDisposals++; });
    solar.comets[0].children.find(child => child.isSprite).material.map
      .addEventListener('dispose', () => { cometTextureDisposals++; });
    solar.exoplanetOrbits[0].mesh.geometry.addEventListener('dispose', () => { orbitDisposals++; });
    const solarAmbient = solar.sun.userData.ambientLight;
    solar.cleanup(manager.scene);
    const cleanupReleased = solar.focusedObject === null && solar._planetArray === null
      && !manager.scene.children.includes(solarAmbient);
    return {
      batchCount: batches.length, instanceMatches: instancePosition.distanceTo(star.position) < 0.002,
      starPicked, namedStarPicked, namedStarName: namedStar?.userData?.name, polarisVisible, polarisReset, originalStarCalls, batchedStarCalls,
      pickingBefore, pickingAfter, orbitCounts, orbitGeometryValid, filters, indexedMs, linearMs,
      leftPixels, rightPixels, farLOD, markerPickable, nearLOD, shadowsSupported, earthShadows,
      moonShadows, moonlessShadows, shadowDifference, labelDisposals, cometTextureDisposals, orbitDisposals,
      placeholderDisposals, moonFallbackApplied, cleanupReleased
    };
  });
  expect(result.batchCount).toBe(2);
  expect(result.instanceMatches).toBe(true);
  expect(result.starPicked).toBe(true);
  expect(result.namedStarPicked, `selected ${result.namedStarName}`).toBe(true);
  expect(result.polarisVisible).toBe(true);
  expect(result.polarisReset).toBe(true);
  expect(result.batchedStarCalls).toBeLessThan(result.originalStarCalls);
  console.log(`Constellation calls: ${result.originalStarCalls} → ${result.batchedStarCalls}; point picking (100 rays): ${result.linearMs.toFixed(1)} ms → ${result.indexedMs.toFixed(1)} ms`);
  expect(result.pickingBefore).toEqual({ equal: true, comparisons: 30 });
  expect(result.pickingAfter).toEqual({ equal: true, comparisons: 30 });
  expect(result.orbitCounts).toEqual({ planets: 1, dwarfs: 1, comets: 1 });
  expect(result.orbitGeometryValid).toBe(true);
  expect(result.filters).toEqual({
    planets: [true, false, false, false],
    dwarfs: [false, true, false, false],
    moons: [false, false, true, false],
    comets: [false, false, false, true],
    none: [false, false, false, false]
  });
  expect(result.leftPixels).toBeGreaterThan(0);
  expect(result.rightPixels).toBeGreaterThan(result.leftPixels * 3);
  expect(result.farLOD).toBe(true);
  expect(result.markerPickable).toBe(true);
  expect(result.nearLOD).toBe(true);
  if (result.shadowsSupported) expect(result.earthShadows && result.moonShadows).toBe(true);
  if (result.shadowsSupported) expect(result.shadowDifference).toBeGreaterThan(0);
  expect(result.moonlessShadows).toBe(false);
  expect(result.placeholderDisposals).toBe(1);
  expect(result.moonFallbackApplied).toBe(true);
  expect(result.cleanupReleased).toBe(true);
  expect([result.labelDisposals, result.cometTextureDisposals, result.orbitDisposals]).toEqual([1, 1, 1]);
});

test('keeps time, spacecraft navigation, search and physical information consistent', async ({ page }) => {
  await openApp(page);
  await page.waitForFunction(() => window.app.solarSystemModule.satellites.some(s => s.userData.name?.includes('ISS'))
    && window.app.solarSystemModule.spacecraft.some(s => s.userData.type === 'probe'), { timeout: 60_000 });
  await page.evaluate(() => window.app.sceneManager.renderer.setAnimationLoop(null));
  await page.locator('#object-dropdown').selectOption('earth');
  await page.evaluate(() => document.activeElement.blur());

  for (const [key, expected] of [['i', /ISS/], ['v', /Voyager/], ['p', /.+/]]) {
    await page.keyboard.press(key);
    await expect(page.locator('#object-name')).toHaveText(expected);
    expect(await page.evaluate(() => window.app.uiManager.infoObject === window.app.solarSystemModule.focusedObject)).toBe(true);
  }
  await page.evaluate(() => window.app.uiManager.closeInfoPanel());
  await page.keyboard.press('i');
  await expect(page.locator('#info-panel')).not.toHaveClass(/hidden/);
  await expect(page.locator('#object-name')).toContainText('ISS');

  await page.locator('#nav-search').fill('no-such-object-123');
  await expect(page.locator('#object-dropdown option')).toHaveCount(1);
  await page.locator('#nav-search').press('Escape');
  await expect(page.locator('#nav-search')).toHaveValue('');
  await expect.poll(() => page.locator('#object-dropdown option[value]').count()).toBeGreaterThan(70);

  await page.evaluate(() => {
    document.activeElement.blur();
    window.app.applyScaleMode('scientific', { persist: false });
    window.app.solarSystemModule.seekToDate(new Date('2020-01-15T12:00:00Z'));
    window.app.updateSimulationDate(true);
  });
  await page.keyboard.press('Space');
  await expect(page.locator('#simulation-date')).toHaveAttribute('datetime', '2020-01-15');
  await page.keyboard.press(']');
  await expect(page.locator('#simulation-date')).toHaveAttribute('datetime', '2020-02-15');
  await page.keyboard.press('[');
  await expect(page.locator('#simulation-date')).toHaveAttribute('datetime', '2020-01-15');
  await page.evaluate(() => {
    window.app.solarSystemModule.seekToDate(new Date('2020-01-31T12:00:00Z'));
    window.app.updateSimulationDate(true);
  });
  await page.keyboard.press(']');
  await expect(page.locator('#simulation-date')).toHaveAttribute('datetime', '2020-02-29');
  await page.keyboard.press('n');
  await expect(page.locator('#simulation-date')).toHaveAttribute('datetime', new Date().toISOString().slice(0, 10));
  await page.locator('#speed-toggle').click();
  await expect(page.locator('#simulation-date')).toBeVisible();

  const astronomy = await page.evaluate(async () => {
    const ssm = window.app.solarSystemModule;
    const moonSizes = Object.values(ssm.moons).map(moon => ssm.getObjectInfo(moon).size);
    const nebulaSizes = ssm.nebulae.map(nebula => ssm.getObjectInfo(nebula).size);
    const regions = [ssm.asteroidBelt, ssm.kuiperBelt, ssm.oortCloud].map(object => ssm.getObjectInfo(object).size);
    const cometDistances = ssm.comets.map(comet => ssm.getObjectInfo(comet).distance);
    const translations = [];
    for (const lang of ['en', 'nl', 'fr', 'de', 'es', 'pt']) {
      await window.setLanguage(lang);
      translations.push({
        date: document.querySelector('.simulation-date').textContent,
        moon: ssm.getObjectInfo(ssm.moons.phobos).size,
        comet: ssm.getObjectInfo(ssm.comets[0]).distance,
        size: ssm.getObjectInfo(ssm.planets.earth).size,
        nebula: ssm.getObjectInfo(ssm.nebulae[0]).size
      });
    }
    return { moonSizes, nebulaSizes, regions, cometDistances, translations };
  });
  expect(astronomy.moonSizes).toHaveLength(19);
  expect(astronomy.nebulaSizes).toHaveLength(7);
  for (const size of [...astronomy.moonSizes, ...astronomy.nebulaSizes, ...astronomy.regions]) {
    expect(size).not.toContain('unavailable');
  }
  for (const distance of astronomy.cometDistances) {
    expect(distance).toContain('AU');
    expect(distance).toContain('not current distance');
  }
  expect(astronomy.cometDistances[0]).toMatch(/^17\.8\d AU/);
  for (const localized of astronomy.translations.slice(1)) {
    expect(localized.date).not.toContain('Simulated date');
    expect(localized.moon).not.toContain('mean diameter');
    expect(localized.comet).not.toContain('estimated orbital');
    expect(localized.nebula).not.toContain('light-years');
  }
  expect(astronomy.translations[2].size).toContain('de diamètre');

  if (await page.evaluate(() => navigator.maxTouchPoints === 0)) {
    await page.evaluate(() => {
      localStorage.removeItem('space_voyage_gesture_hints_seen');
      window.app.setupMobileGestureHints();
    });
    await page.waitForTimeout(2200);
    await expect(page.locator('#gesture-hints')).toHaveClass(/hidden/);
  }
});

test('keeps dragged panel positions separate across desktop and mobile', async ({ page }) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await openApp(page);
  await page.evaluate(() => window.app.sceneManager.renderer.setAnimationLoop(null));
  await page.locator('#object-dropdown').selectOption('earth');
  const title = await page.locator('#object-name').boundingBox();
  await page.mouse.move(title.x + 30, title.y + 8);
  await page.mouse.down();
  await page.mouse.move(70, 125);
  await page.mouse.up();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('panel-position-info-panel-desktop')));
  expect(saved.y).toBeLessThan(160);
  await page.evaluate(position => localStorage.setItem('panel-position-info-panel', JSON.stringify(position)), saved);
  await page.evaluate(() => window.app.uiManager.closeInfoPanel());
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('panel-position-info-panel-desktop')))).toEqual(saved);
  await page.locator('#object-dropdown').selectOption('earth');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const boxes = await page.evaluate(() => {
    const info = document.querySelector('#info-panel').getBoundingClientRect();
    const speed = document.querySelector('#speed-control').getBoundingClientRect();
    return { overlap: info.left < speed.right && info.right > speed.left && info.top < speed.bottom && info.bottom > speed.top };
  });
  expect(boxes.overlap).toBe(false);
  await page.reload();
  await page.waitForFunction(() => window.app?._experienceStarted && window.app?.solarSystemModule?.labels?.length > 0, { timeout: 60_000 });
  await page.evaluate(() => window.app.sceneManager.renderer.setAnimationLoop(null));
  await page.locator('#object-dropdown').selectOption('earth');
  expect(await page.evaluate(() => document.querySelector('#info-panel').getBoundingClientRect().top)).toBeGreaterThan(160);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(() => page.locator('#info-panel').evaluate(element => parseFloat(element.style.top))).toBeCloseTo(saved.y, 0);
});

test('boots the full 3D app without critical browser errors', async ({ page }) => {
  const diagnostics = collectDiagnostics(page);
  await openApp(page);

  await expect(page).toHaveTitle(/Space Voyage/);
  await expect(page.locator('#main-header')).toBeVisible();
  await expect(page.locator('#main-footer')).toBeVisible();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('#canvas-container canvas')).toBeVisible();

  const appState = await page.evaluate(() => ({
    version: window.APP_VERSION,
    hasCamera: Boolean(window.app.sceneManager.camera),
    hasScene: Boolean(window.app.sceneManager.scene),
    hasControls: Boolean(window.app.sceneManager.controls),
    hasEarth: Boolean(window.app.solarSystemModule.planets.earth),
    hasMarsNormalMap: Boolean(window.app.solarSystemModule.planets.mars.material.normalMap),
    starTwinkleFrame: window.app.solarSystemModule._starTwinkleFrame,
    j2000JulianDate: window.app.solarSystemModule.toJulianDate(new Date('2000-01-01T12:00:00Z')),
    keplerEquationResidual: (() => {
      const meanAnomaly = 1;
      const eccentricity = 0.2;
      const eccentricAnomaly = window.app.solarSystemModule._solveKepler(meanAnomaly, eccentricity);
      return Math.abs(eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly);
    })(),
    exoplanetOrbitPositionError: Math.max(...window.app.solarSystemModule.exoplanets.map((planet) => {
      const { angle, hostStarPos, orbitRadius, orbitTilt } = planet.userData;
      return Math.max(
        Math.abs(planet.position.x - (hostStarPos.x + orbitRadius * Math.cos(angle))),
        Math.abs(planet.position.y - (hostStarPos.y - orbitRadius * Math.sin(angle) * Math.sin(orbitTilt))),
        Math.abs(planet.position.z - (hostStarPos.z + orbitRadius * Math.sin(angle) * Math.cos(orbitTilt)))
      );
    })),
    moonCount: Object.keys(window.app.solarSystemModule.moons || {}).length,
    dropdownOptions: document.querySelectorAll('#object-dropdown option[value]').length
  }));

  expect(appState).toMatchObject({
    version: APP_VERSION,
    hasCamera: true,
    hasScene: true,
    hasControls: true,
    hasEarth: true
  });
  expect(appState.hasMarsNormalMap).toBe(false);
  expect(appState.starTwinkleFrame).toBeGreaterThan(0);
  expect(appState.j2000JulianDate).toBeCloseTo(2451545, 6);
  expect(appState.keplerEquationResidual).toBeLessThan(1e-10);
  expect(appState.exoplanetOrbitPositionError).toBeLessThan(1e-6);
  expect(appState.moonCount).toBeGreaterThan(10);
  expect(appState.dropdownOptions).toBeGreaterThan(70);
  expect(diagnostics).toEqual([]);
});

test.describe('legacy cache compatibility', () => {
test.use({ serviceWorkers: 'block' });

test('initializes translations when an older cached app entry is served', async ({ page }) => {
  let intercepted = false;
  await page.route('**/src/main.js*', async (route) => {
    intercepted = true;
    const response = await route.fetch();
    const source = await response.text();
    const legacyEntry = source.replace(/^import '\.\/i18n\.js\?v=[^']+';\r?\n/m, '');
    expect(legacyEntry).not.toBe(source);
    await route.fulfill({ response, body: legacyEntry });
  });

  await openApp(page);
  expect(intercepted).toBe(true);
  await page.locator('#object-dropdown').selectOption('earth');
  await expect(page.locator('#object-name')).toHaveText('Earth');
  await expect(page.locator('#object-type')).toHaveText('Planet');
  await expect(page.locator('#object-description')).toHaveText(/Earth/i);
  await expect(page.locator('#object-fun-fact')).toContainText('Earth');
  await expect(page.locator('#object-distance')).not.toContainText('scaledUnitsFromSun');
});

test('initializes a cached classic translation script before the app entry', async ({ page }) => {
  await page.route('**/src/i18n.js*', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: "const translations = { descEarth: 'Legacy Earth description' }; window.t = key => translations[key] || key;"
  }));
  await page.route('**/src/main.js*', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: "window.translationAtAppStart = window.t('descEarth');"
  }));

  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.translationAtAppStart))
    .toBe('Legacy Earth description');
});
});

test('loads a saved locale before app initialization', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('appLanguage', 'fr');
  });
  await openApp(page);

  const localization = await page.evaluate(() => ({
    language: document.documentElement.lang,
    translatedTitle: document.querySelector('[data-i18n="appTitle"]').textContent,
    titleFromI18n: window.t('appTitle')
  }));

  expect(localization.language).toBe('fr');
  expect(localization.translatedTitle).toBe(localization.titleFromI18n);
  expect(localization.translatedTitle).not.toBe('Space Voyage');

  await openModalFromButton(page, '#settings-button', '#settings-modal');
  await page.locator('#language-selector').selectOption('en');
  await expect.poll(() => page.evaluate(() => window.getCurrentLanguage())).toBe('en');
  await expect(page.locator('[data-i18n="appTitle"]')).toHaveText('Space Voyage');
});

test('preserves the selected information and speed when changing language', async ({ page }) => {
  await openApp(page);
  await page.locator('#object-dropdown').selectOption('saturn');
  await page.locator('#reset-view').click();
  await page.locator('#time-speed').evaluate((input) => {
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await openModalFromButton(page, '#settings-button', '#settings-modal');

  for (const language of ['nl', 'fr', 'de', 'es', 'pt', 'en']) {
    await page.locator('#language-selector').selectOption(language);
    await expect.poll(() => page.evaluate(() => window.getCurrentLanguage())).toBe(language);
    const expected = await page.evaluate(() => {
      const { solarSystemModule, uiManager } = window.app;
      return {
        info: solarSystemModule.getObjectInfo(uiManager.infoObject),
        paused: window.t('paused')
      };
    });
    await expect(page.locator('#object-name')).toHaveText(expected.info.name);
    await expect(page.locator('#object-description')).toHaveText(expected.info.description);
    await expect(page.locator('#object-fun-fact')).toContainText(expected.info.funFact);
    await expect(page.locator('#time-speed-label')).toHaveText(expected.paused);
    await expect(page.locator('#speed-timing-label')).toHaveText(await page.evaluate(() => window.t('educationalMotion')));
    await expect(page.locator('#speed-timing-label')).not.toHaveText('educationalMotion');
  }
});

test('uses one real-time clock in scientific mode and keeps the selected speed', async ({ page }) => {
  await openApp(page);
  const measurements = await page.evaluate(() => {
    const app = window.app;
    const ssm = app.solarSystemModule;
    app.applyScaleMode('scientific', { persist: false });
    const moon = ssm.moons.moon.userData;
    const comet = ssm.comets[0].userData;
    const exoplanet = ssm.exoplanets[0].userData;
    const satellite = ssm.satellites[0].userData;
    const read = () => ({
      jd: ssm.simulatedJD,
      earth: ssm.planets.earth.userData.meanAnomaly,
      moon: moon.meanAnomaly,
      comet: comet.meanAnomaly,
      exoplanet: exoplanet.angle,
      satellite: satellite.angle
    });
    const step = (speed) => {
      const before = read();
      ssm.update(5, speed, app.sceneManager.camera, app.sceneManager.controls);
      const after = read();
      return Object.fromEntries(Object.keys(before).map(key => [key, after[key] - before[key]]));
    };
    const scientific = step(1);
    const paused = step(0);
    const reverse = step(-1);
    ssm.seekToDate('2030-01-01T00:00:00Z');
    const expectedExoplanetAngle = (((ssm.simulatedJD - 2451545) / 11.2 * 2 * Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const exoplanetAngle = exoplanet.angle;
    const seekErrors = [];
    {
      ssm.seekToDate('2030-01-01T00:00:00Z');
      ssm.update(1, 86400, app.sceneManager.camera, app.sceneManager.controls);
      const objects = [ssm.planets.mercury, ssm.moons.moon, ssm.moons.triton, ssm.comets[0], ssm.exoplanets[0]];
      const steppedAngles = objects.map(object => object.userData.angle);
      ssm.seekToDate('2030-01-02T00:00:00Z');
      seekErrors.push(...objects.map((object, index) => {
        const difference = object.userData.angle - steppedAngles[index];
        return Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference)));
      }));
    }
    return { scientific, paused, reverse, cometPeriod: comet.orbitalPeriod, exoplanetAngle, expectedExoplanetAngle, seekErrors };
  });
  const m = measurements.scientific;
  expect(m.jd).toBeCloseTo(5 / 86400, 9);
  expect(m.earth).toBeCloseTo(0.98560028 * Math.PI * 5 / (180 * 86400), 12);
  expect(m.moon).toBeCloseTo(2 * Math.PI * 5 / (27.321661 * 86400), 12);
  expect(m.comet).toBeCloseTo(2 * Math.PI * 5 / (measurements.cometPeriod * 86400), 12);
  expect(m.exoplanet).toBeCloseTo(2 * Math.PI * 5 / (11.2 * 86400), 12);
  expect(m.satellite).toBeCloseTo(15.5 * 2 * Math.PI * 5 / 86400, 12);
  for (const value of Object.values(measurements.paused)) expect(value).toBe(0);
  expect(measurements.reverse.earth).toBeCloseTo(-measurements.scientific.earth, 12);
  expect(measurements.reverse.jd).toBeCloseTo(-measurements.scientific.jd, 9);
  expect(measurements.exoplanetAngle).toBeCloseTo(measurements.expectedExoplanetAngle, 10);
  for (const error of measurements.seekErrors) expect(error).toBeLessThan(1e-8);

  await page.locator('#time-speed').evaluate((input) => {
    input.value = '100';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#time-speed-label')).toHaveText('525960x');
  await expect(page.locator('#time-speed')).toHaveAttribute('aria-valuenow', '100');
  await page.locator('#object-dropdown').selectOption('iss');
  await expect.poll(() => page.evaluate(() => window.app.timeSpeed)).toBeCloseTo(525960, 2);
  await page.locator('#object-dropdown').selectOption('earth');
  await expect.poll(() => page.evaluate(() => window.app.timeSpeed)).toBeCloseTo(525960, 2);
  await page.evaluate(() => window.app.uiManager.setSpeed(10));
  await expect.poll(() => page.evaluate(() => window.app.timeSpeed)).toBeCloseTo(10, 6);
});

test('keeps belts outside the inner planets when restoring and repeating scale modes', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    const app = window.app;
    const solar = app.solarSystemModule;
    app.sceneManager.renderer.setAnimationLoop(null);
    const clouds = [solar.asteroidBelt, solar.kuiperBelt, solar.oortCloud];
    const snapshot = () => clouds.map(group => group.children.map(cloud =>
      Array.from(cloud.geometry.attributes.position.array)));
    const original = snapshot().flat(2);
    const innerRadius = () => Math.min(...solar.asteroidBelt.children.flatMap(cloud => {
      const positions = cloud.geometry.attributes.position;
      return Array.from({ length: positions.count }, (_, i) =>
        Math.hypot(positions.getX(i), positions.getZ(i)));
    }));
    const educationalInner = innerRadius();
    let repeatError = 0;
    for (const mode of ['educational', 'educational', 'scientific', 'scientific', 'educational']) {
      const before = snapshot().flat(2);
      const sameMode = app.getCurrentScaleMode() === mode;
      app.applyScaleMode(mode, { persist: false });
      if (sameMode) {
        repeatError = Math.max(repeatError, ...snapshot().flat(2).map((value, i) =>
          Math.abs(value - before[i])));
      }
    }
    const restored = snapshot().flat(2);
    return {
      educationalInner, repeatError,
      roundTripError: Math.max(...restored.map((value, i) => Math.abs(value - original[i]))),
      marsDistance: solar.planets.mars.userData.distance,
      jupiterDistance: solar.planets.jupiter.userData.distance
    };
  });
  expect(result.educationalInner).toBeGreaterThanOrEqual(119.99);
  expect(result.educationalInner).toBeGreaterThan(result.marsDistance);
  expect(result.educationalInner).toBeLessThan(result.jupiterDistance);
  expect(result.repeatError).toBe(0);
  expect(result.roundTripError).toBeLessThan(0.002);
});

test('keeps moon positions, tidal locking and orbit traces independent of planetary spin', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const { keplerianPosition } = await import('./src/modules/ephemeris.js');
    const app = window.app;
    const solar = app.solarSystemModule;
    app.sceneManager.renderer.setAnimationLoop(null);
    let positionError = 0;
    let lockingError = 0;
    let orbitError = 0;
    let seekError = 0;
    const azimuthSteps = [];
    for (const mode of ['educational', 'scientific']) {
      app.applyScaleMode(mode, { persist: false });
      solar.seekToDate('2030-01-01T00:00:00Z');
      const moon = solar.moons.moon;
      const expectedPosition = body => {
        const ud = body.userData;
        const e = mode === 'scientific' ? ud.orbitalEccentricity : 0;
        const inc = mode === 'scientific' ? ud.orbitalInclination : 0;
        const p = keplerianPosition(
          ud.distance, e, ud.angle, inc,
          mode === 'scientific' ? ud.orbitalAscendingNode : 0,
          mode === 'scientific' ? ud.orbitalPeriapsis : 0
        );
        const tilt = mode === 'scientific' ? body.parent.userData.axialTilt * Math.PI / 180 : 0;
        const parentEquatorialTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
        return new THREE.Vector3(p.x, p.y, p.z).applyQuaternion(parentEquatorialTilt);
      };
      const relativePosition = body => body.position.clone().applyQuaternion(body.parent.quaternion);
      seekError = Math.max(seekError, relativePosition(moon).distanceTo(expectedPosition(moon)));
      let previousAzimuth = Math.atan2(relativePosition(moon).z, relativePosition(moon).x);
      // Sample more than a lunar orbit while Earth spins through every orientation.
      for (let frame = 0; frame < 240; frame++) {
        solar.update(0.125, mode === 'scientific' ? 86400 : 1, app.sceneManager.camera, app.sceneManager.controls);
        for (const body of [moon, solar.moons.miranda, solar.moons.triton]) {
          const actual = relativePosition(body);
          positionError = Math.max(positionError, actual.distanceTo(expectedPosition(body)));
          const worldRotation = body.parent.quaternion.clone().multiply(body.quaternion);
          const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(worldRotation);
          lockingError = Math.max(lockingError, facing.distanceTo(actual.clone().normalize().negate()));
          const orbitRotation = body.parent.quaternion.clone().multiply(body.userData.orbitLine.quaternion);
          const tilt = mode === 'scientific' ? body.parent.userData.axialTilt * Math.PI / 180 : 0;
          const expectedOrbitRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
          orbitError = Math.max(orbitError, orbitRotation.angleTo(expectedOrbitRotation));
        }
        const relative = relativePosition(moon);
        const azimuth = Math.atan2(relative.z, relative.x);
        azimuthSteps.push(Math.atan2(Math.sin(azimuth - previousAzimuth), Math.cos(azimuth - previousAzimuth)));
        previousAzimuth = azimuth;
      }
    }
    return { positionError, lockingError, orbitError, seekError, azimuthSteps };
  });
  expect(result.positionError).toBeLessThan(1e-10);
  expect(result.seekError).toBeLessThan(1e-10);
  expect(result.lockingError).toBeLessThan(1e-10);
  expect(result.orbitError).toBeLessThan(1e-7);
  for (const increment of result.azimuthSteps) expect(increment).toBeGreaterThan(0);
});

test('uses watchable educational pacing and real scientific periods while preserving pause', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#time-speed-label')).toHaveText('1x');
  await expect(page.locator('#speed-mode-label')).toHaveText('Educational');
  await expect(page.locator('.simulation-date')).toBeHidden();
  await expect(page.locator('#speed-timing-label')).toBeVisible();
  const result = await page.evaluate(() => {
    const app = window.app;
    app.sceneManager.renderer.setAnimationLoop(null);
    const solar = app.solarSystemModule;
    const measurements = [];
    let inverseError = 0;
    for (const mode of ['educational', 'scientific']) {
      app.applyScaleMode(mode, { persist: false });
      const jd = solar.simulatedJD;
      const earth = solar.planets.earth.userData.meanAnomaly;
      const moon = solar.moons.moon.userData.meanAnomaly;
      const spin = solar.planets.earth.rotation.y;
      const speed = app.timeSpeed;
      solar.update(1, speed, app.sceneManager.camera, app.sceneManager.controls);
      measurements.push({
        speed, elapsedDays: solar.simulatedJD - jd,
        earthStep: solar.planets.earth.userData.meanAnomaly - earth,
        moonStep: solar.moons.moon.userData.meanAnomaly - moon,
        spinStep: solar.planets.earth.rotation.y - spin,
        ratio: (solar.moons.moon.userData.meanAnomaly - moon) /
          (solar.planets.earth.userData.meanAnomaly - earth)
      });
      for (const value of mode === 'educational' ? [0, 0.001, 0.1, 0.5, 1, 5, 10] : [0, 0.1, 0.5, 1, 10, 86400, 525960]) {
        const roundTrip = app.uiManager.sliderToSpeed(app.uiManager.speedToSlider(value));
        inverseError = Math.max(inverseError, Math.abs(roundTrip - value));
      }
    }
    app.uiManager.setSpeed(0);
    app.applyScaleMode('educational', { persist: false });
    const paused = app.timeSpeed;
    app.applyScaleMode('scientific', { persist: false });
    return { measurements, inverseError, paused, scientificPaused: app.timeSpeed };
  });
  expect(result.measurements[0].speed).toBe(1);
  expect(result.measurements[0].earthStep).toBeCloseTo(2 * Math.PI / 120, 10);
  expect(result.measurements[0].moonStep).toBeCloseTo(2 * Math.PI / 20, 10);
  expect(result.measurements[0].spinStep).toBeCloseTo(-2 * Math.PI / 30, 10);
  expect(result.measurements[1].speed).toBe(1);
  expect(result.measurements[1].elapsedDays).toBeCloseTo(1 / 86400, 8);
  expect(result.measurements[1].ratio).toBeCloseTo(360 / 0.98560028 / 27.321661, 5);
  expect(result.inverseError).toBeLessThan(1e-8);
  expect(result.paused).toBe(0);
  expect(result.scientificPaused).toBe(0);
  await expect(page.locator('#speed-mode-label')).toHaveText('Scientific');
  await expect(page.locator('#time-speed-label')).toHaveText('Paused');
  await expect(page.locator('.simulation-date')).toBeVisible();
  await expect(page.locator('#speed-timing-label')).toBeHidden();
});

test('scales educational motion with the slider and supports pause and reverse', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    const app = window.app;
    const solar = app.solarSystemModule;
    app.sceneManager.renderer.setAnimationLoop(null);
    const earth = solar.planets.earth;
    const moon = solar.moons.moon;
    const read = () => ({
      earth: earth.userData.meanAnomaly,
      moon: moon.userData.meanAnomaly,
      spin: earth.rotation.y,
      neptune: solar.planets.neptune.userData.meanAnomaly,
      satellite: solar.satellites[0].userData.angle,
      exoplanet: solar.exoplanets[0].userData.angle
    });
    const step = (seconds, speed) => {
      const before = read();
      solar.update(seconds, speed, app.sceneManager.camera, app.sceneManager.controls);
      const after = read();
      return Object.fromEntries(Object.keys(before).map(key => [key, after[key] - before[key]]));
    };
    const normal = step(1, app.timeSpeed);
    const paused = step(1, 0);
    const reverse = step(1, -1);
    const fullMoonOrbit = step(20, 1).moon;
    const fullEarthOrbit = step(120, 1).earth;
    const slider = document.getElementById('time-speed');
    slider.value = '100';
    slider.dispatchEvent(new Event('input'));
    const fast = step(1, app.timeSpeed);
    const fastLabel = document.getElementById('time-speed-label').textContent;
    slider.value = '25';
    slider.dispatchEvent(new Event('input'));
    const slow = step(1, app.timeSpeed);
    const scientificDate = new Date((solar.simulatedJD - 2440587.5) * 86400000);
    app.applyScaleMode('scientific', { persist: false });
    const switchedPhases = [earth.userData.meanAnomaly, moon.userData.meanAnomaly];
    solar.seekToDate(scientificDate);
    return {
      normal, paused, reverse, fast, slow, fastLabel, fullMoonOrbit, fullEarthOrbit,
      scientificPhaseError: Math.max(...switchedPhases.map((value, i) =>
        Math.abs(value - [earth.userData.meanAnomaly, moon.userData.meanAnomaly][i])))
    };
  });
  expect(result.fullMoonOrbit).toBeCloseTo(2 * Math.PI, 10);
  expect(result.fullEarthOrbit).toBeCloseTo(2 * Math.PI, 10);
  expect(result.fastLabel).toBe('10x');
  for (const [key, value] of Object.entries(result.normal)) {
    expect(Math.abs(value)).toBeGreaterThan(0.01);
    expect(result.paused[key]).toBe(0);
    expect(result.reverse[key]).toBeCloseTo(-value, 10);
    expect(result.fast[key]).toBeCloseTo(value * 10, 10);
    expect(result.slow[key]).toBeCloseTo(value * 0.25, 10);
  }
  expect(result.scientificPhaseError).toBeLessThan(1e-8);
});

test('renders Earth without white specular glare while retaining sunlight shading', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const app = window.app;
    app.sceneManager.renderer.setAnimationLoop(null);
    const earth = app.solarSystemModule.planets.earth;
    const material = earth.material.clone();
    const ocean = new THREE.DataTexture(new Uint8Array([0, 80, 160, 255]), 1, 1);
    ocean.needsUpdate = true;
    material.map = ocean;
    material.bumpMap = null;
    const scene = new THREE.Scene();
    const globe = new THREE.Mesh(earth.geometry, material);
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(0, 0, 10);
    scene.add(globe, light);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, earth.geometry.parameters.radius * 4);
    const renderer = app.sceneManager.renderer;
    const previousTarget = renderer.getRenderTarget();
    const target = new THREE.WebGLRenderTarget(64, 64);
    const pixels = new Uint8Array(64 * 64 * 4);
    const render = () => {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, 64, 64, pixels);
      let red = 0;
      let blue = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        red = Math.max(red, pixels[i]);
        blue = Math.max(blue, pixels[i + 2]);
      }
      return { red, blue };
    };
    const lit = render();
    light.position.z = -10;
    const night = render();
    renderer.setRenderTarget(previousTarget);
    target.dispose();
    material.dispose();
    ocean.dispose();
    return { lit, night, hasTexture: earth.material.map?.isTexture, hasTerrain: earth.material.bumpMap?.isTexture };
  });
  expect(result.lit.red).toBeLessThanOrEqual(1);
  expect(result.lit.blue).toBeGreaterThan(40);
  expect(result.night.blue).toBeLessThan(result.lit.blue / 4);
  expect(result.hasTexture && result.hasTerrain).toBe(true);
});

test('preserves the simulation clock when loading starts the experience early', async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      if (delay === 30000 && typeof callback === 'function' && String(callback).includes('Loading timeout')) {
        const startWhenEarthExists = () => {
          if (!window.app.solarSystemModule.planets.earth) {
            return originalSetTimeout(startWhenEarthExists, 25);
          }
          callback(...args);
          window.__earlyStartJD = window.app.solarSystemModule.simulatedJD;
          window.app.uiManager.setSpeed(10);
        };
        return originalSetTimeout(startWhenEarthExists, 25);
      }
      return originalSetTimeout(callback, delay, ...args);
    };
  });
  await openApp(page);
  const result = await page.evaluate(() => ({
    startJD: window.__earlyStartJD,
    currentJD: window.app.solarSystemModule.simulatedJD,
    speed: window.app.timeSpeed
  }));
  expect(result.startJD).toBeGreaterThan(2460000);
  expect(result.currentJD).toBeGreaterThan(result.startJD);
  expect(result.speed).toBeCloseTo(10, 6);
});

test('shows meaningful sizes and accurate moon wording', async ({ page }) => {
  await openApp(page);
  for (const target of ['earth', 'mars']) {
    await page.locator('#object-dropdown').selectOption(target);
    await expect(page.locator('#object-description')).not.toContainText('many more small ones');
  }
  await page.locator('#object-dropdown').selectOption('moon');
  await expect(page.locator('#object-size')).toHaveText('3,474 km diameter');
  await page.locator('#object-dropdown').selectOption('orion-nebula');
  await expect(page.locator('#object-size')).toHaveText('~25 light-years across');
  await page.locator('#object-dropdown').selectOption('constellation-orion');
  await expect(page.locator('#object-size')).toContainText('region of the sky');
  await page.locator('#object-dropdown').selectOption('crab-nebula');
  await expect(page.locator('#object-size')).toHaveText('Physical size unavailable');
});

test('keeps mobile footer controls visible and reachable', async ({ page }) => {
  await openApp(page);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('#object-dropdown').selectOption('earth');
    const bounds = await page.evaluate(() => {
      const footer = document.querySelector('#main-footer').getBoundingClientRect();
      const panel = document.querySelector('#info-panel').getBoundingClientRect();
      return {
        footerTop: footer.top,
        panelBottom: panel.bottom,
        buttons: Array.from(document.querySelectorAll('.footer-controls button'))
          .filter(button => button.id !== 'toggle-bloom' || getComputedStyle(button).display !== 'none')
          .map(button => {
          const rect = button.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
        })
      };
    });
    for (const button of bounds.buttons) {
      expect(button.left).toBeGreaterThanOrEqual(0);
      expect(button.right).toBeLessThanOrEqual(width);
      expect(button.bottom).toBeLessThanOrEqual(844);
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
    }
    expect(bounds.panelBottom).toBeLessThanOrEqual(bounds.footerTop);
    await page.locator('#settings-button').click();
    await expect(page.locator('#settings-modal')).not.toHaveClass(/hidden/);
    await page.locator('#settings-close-btn').click();
  }
});

test('keeps Mercury outside the corona in education mode across scale switches', async ({ page }) => {
  await openApp(page);

  const measureCorona = () => page.evaluate(() => {
    const { sun, planets } = window.app.solarSystemModule;
    const shells = sun.children.filter(child => child.isMesh && child.geometry.type === 'SphereGeometry');
    return {
      shellCount: shells.length,
      innerRadius: Math.min(...shells.map(shell => shell.geometry.parameters.radius * shell.scale.x)),
      outerRadius: Math.max(...shells.map(shell => shell.geometry.parameters.radius * shell.scale.x)),
      sunRadius: sun.userData.radius,
      mercuryInnerEdge: planets.mercury.userData.distance - planets.mercury.userData.radius
    };
  });

  const initial = await measureCorona();
  expect(initial.shellCount).toBe(4);
  expect(initial.innerRadius).toBeGreaterThan(initial.sunRadius);
  expect(initial.mercuryInnerEdge - initial.outerRadius).toBeGreaterThan(1);

  const scale = page.locator('#toggle-scale');
  await scale.click();
  await expect(scale).toHaveAttribute('aria-pressed', 'true');
  const scientific = await measureCorona();
  expect(scientific.outerRadius).toBeGreaterThan(initial.outerRadius);
  expect(scientific.outerRadius).toBeLessThan(scientific.mercuryInnerEdge);

  await scale.click();
  await expect(scale).toHaveAttribute('aria-pressed', 'false');
  expect(await measureCorona()).toEqual(initial);
});

test('keeps hosted systems, JWST and physical facts consistent across visual scales', async ({ page }) => {
  await openApp(page);

  const scale = page.locator('#toggle-scale');
  const readModel = () => page.evaluate(() => {
    const ssm = window.app.solarSystemModule;
    const exoplanet = ssm.exoplanets[0];
    const exoplanetData = exoplanet.userData;
    const orbit = ssm.exoplanetOrbits[0];
    const earth = ssm.planets.earth;
    const jwst = ssm.jwst;
    const offset = [
      jwst.position.x - earth.position.x,
      jwst.position.y - earth.position.y,
      jwst.position.z - earth.position.z
    ];
    const offsetLength = Math.hypot(...offset);
    const earthLength = Math.hypot(earth.position.x, earth.position.y, earth.position.z);
    const haumea = ssm.planets.haumea;
    const quaoar = ssm.planets.quaoar;

    return {
      orbitPositionError: Math.abs(
        exoplanet.position.distanceTo(exoplanetData.hostStarPos) - exoplanetData.orbitRadius
      ),
      orbitScale: orbit.mesh.scale.x,
      hostScale: exoplanetData.hostStarPos.x / exoplanetData.baseHostStarPos.x,
      ringPositionScale: orbit.mesh.position.x / orbit.basePosition.x,
      jwstOffset: offsetLength,
      jwstRadialAlignment: (
        offset[0] * earth.position.x +
        offset[1] * earth.position.y +
        offset[2] * earth.position.z
      ) / (offsetLength * earthLength),
      jupiterDistance: ssm.getObjectInfo(ssm.planets.jupiter).distance,
      missingMoons: ['mimas', 'iapetus', 'ariel', 'umbriel', 'oberon']
        .filter(id => !ssm.moons[id]),
      haumeaShape: (() => {
        haumea.geometry.computeBoundingBox();
        const { min, max } = haumea.geometry.boundingBox;
        const sizeX = max.x - min.x;
        const sizeY = max.y - min.y;
        const sizeZ = max.z - min.z;
        return [sizeX / sizeY, sizeZ / sizeY];
      })(),
      haumeaRingCount: haumea.userData.rings.length,
      quaoarRingCount: quaoar.userData.rings.length,
      alphaCentauriB: ssm.nearbyStars.some(star => star.userData.name === 'alphaCentauriB')
    };
  });

  const educational = await readModel();
  expect(educational.jupiterDistance).toContain('5.20 AU');
  expect(educational.missingMoons).toEqual([]);
  expect(educational.haumeaShape[0]).toBeCloseTo(1.46 / 1.07, 1);
  expect(educational.haumeaShape[1]).toBeCloseTo(0.64 / 1.07, 1);
  expect(educational.haumeaRingCount).toBe(1);
  expect(educational.quaoarRingCount).toBe(2);
  expect(educational.alphaCentauriB).toBe(true);

  const missingLocalizedFacts = await page.evaluate(async () => {
    const requiredKeys = [
      'descMimas', 'descIapetus', 'descAriel', 'descUmbriel', 'descOberon',
      'descAlphaCentauriB', 'averageOrbitalDistance', 'fromSun'
    ];
    const missing = [];
    await window.setLanguage('en');
    const english = Object.fromEntries(requiredKeys.map(key => [key, window.t(key)]));
    for (const language of ['en', 'nl', 'fr', 'de', 'es', 'pt']) {
      await window.setLanguage(language);
      for (const key of requiredKeys) {
        if (window.t(key) === key || (language !== 'en' && window.t(key) === english[key])) {
          missing.push(`${language}:${key}`);
        }
      }
    }
    await window.setLanguage('en');
    return missing;
  });
  expect(missingLocalizedFacts).toEqual([]);

  await page.locator('#object-dropdown').selectOption('mimas');
  await expect(page.locator('#object-name')).toHaveText('Mimas');
  await page.locator('#object-dropdown').selectOption('alpha-centauri-b');
  await expect(page.locator('#object-name')).toHaveText('Alpha Centauri B');

  await scale.click();
  await expect(scale).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await readModel()).orbitPositionError).toBeLessThan(1e-6);
  const scientific = await readModel();
  expect(scientific.orbitScale).toBeCloseTo(2.5);
  expect(scientific.hostScale).toBeCloseTo(2.5);
  expect(scientific.ringPositionScale).toBeCloseTo(2.5);
  expect(scientific.jwstOffset).toBeCloseTo(1.5, 2);
  expect(scientific.jwstRadialAlignment).toBeCloseTo(1, 5);
  expect(scientific.jupiterDistance).toContain('5.20 AU');
});

test('makes constellation stars informative and includes other object classes in discovery', async ({ page }) => {
  await openApp(page);

  const astronomyInfo = await page.evaluate(() => {
    const app = window.app;
    const ssm = app.solarSystemModule;
    const sirius = ssm.constellations
      .flatMap((constellation) => constellation.children)
      .find((object) => object.userData.name === 'Sirius');
    const siriusInfo = ssm.getObjectInfo(sirius);
    const extraDiscoveryValues = [
      'halley',
      'orion-nebula',
      'andromeda-galaxy',
      'proxima-b',
      'jwst',
      'iss',
      'constellation-orion'
    ];

    return {
      siriusDescription: siriusInfo.description,
      siriusFact: siriusInfo.funFact,
      discoveryTargetsResolve: extraDiscoveryValues.map(
        (value) => Boolean(app.findObjectByNavigationValue(value))
      )
    };
  });

  expect(astronomyInfo.siriusDescription).toContain('brightest star');
  expect(astronomyInfo.siriusFact).not.toContain('visible to the naked eye');
  expect(astronomyInfo.discoveryTargetsResolve).toEqual(Array(7).fill(true));
});

test('keeps core navigation and controls working', async ({ page }) => {
  const diagnostics = collectDiagnostics(page);
  await openApp(page);

  await page.locator('#object-dropdown').selectOption('earth');
  await expect(page.locator('#info-panel')).not.toHaveClass(/hidden/);
  await expect(page.locator('#object-name')).toContainText(/Earth/i);

  await page.locator('#nav-search').fill('jupiter');
  await expect(page.locator('#object-dropdown option')).toHaveCount(3);
  await page.locator('#object-dropdown').selectOption('jupiter');
  await expect(page.locator('#object-name')).toHaveText('Jupiter');
  await expect(page.locator('#nav-search')).toHaveValue('');
  await expect.poll(() => page.locator('#object-dropdown option[value]').evaluateAll((options) => options.filter((option) => option.value).length)).toBeGreaterThan(70);

  const constellations = page.locator('#toggle-constellations');
  await expect(constellations).toHaveAttribute('aria-pressed', 'false');
  await constellations.click();
  await expect(constellations).toHaveAttribute('aria-pressed', 'true');

  const labels = page.locator('#toggle-details');
  await expect(labels).toHaveAttribute('aria-pressed', 'false');
  await labels.click();
  await expect(labels).toHaveAttribute('aria-pressed', 'true');

  const scale = page.locator('#toggle-scale');
  await expect(scale).toHaveAttribute('aria-pressed', 'false');
  // Select 'planets' orbit mode and verify toggling scale preserves planet-only orbits
  await page.evaluate(() => window.app.applyOrbitMode('planets'));
  await scale.click();
  await expect(scale).toHaveAttribute('aria-pressed', 'true');
  const orbitVisibilityAfterScale = await page.evaluate(() => {
    const orbits = window.app.solarSystemModule.orbits;
    const planetOrbit = orbits.find((o) => o.userData.type === 'orbit' && !o.userData.isDwarf);
    const dwarfOrbit = orbits.find((o) => o.userData.type === 'orbit' && o.userData.isDwarf);
    const moonOrbit = orbits.find((o) => o.userData.type === 'moonOrbit');
    return {
      mode: window.app.solarSystemModule.orbitMode,
      planetVisible: planetOrbit?.visible ?? null,
      dwarfVisible: dwarfOrbit?.visible ?? null,
      moonVisible: moonOrbit?.visible ?? null
    };
  });
  expect(orbitVisibilityAfterScale).toEqual({
    mode: 'planets',
    planetVisible: true,
    dwarfVisible: false,
    moonVisible: false
  });

  // Verify VR controller trigger selection resolves objects via userData.name
  const vrSelectedName = await page.evaluate(() => {
    const sm = window.app.sceneManager;
    const ssm = window.app.solarSystemModule;
    const mars = ssm.planets.mars;
    if (!mars) return { error: 'missing mars' };
    // Create a mock controller at a known world position just in front of Mars along +Z,
    // aiming its local -Z axis directly at Mars's center.
    mars.updateMatrixWorld(true);
    const mockCtrl = mars.clone(false);
    mockCtrl.userData = {};
    mockCtrl.position.set(mars.position.x, mars.position.y, mars.position.z + 5);
    mockCtrl.quaternion.identity();
    mockCtrl.scale.set(1, 1, 1);
    mockCtrl.updateMatrixWorld(true);
    sm.onSelectStart(mockCtrl, 0);
    return ssm.focusedObject?.userData?.name || null;
  });
  expect(vrSelectedName).toBe('mars');

  // Verify draw-call optimizations:
  // 1) Each constellation batches its lines into a single THREE.LineSegments object
  // 2) Spacecraft/satellite static sub-meshes sharing materials are merged via mergeGeometries
  const drawCallStats = await page.evaluate(() => {
    const ssm = window.app.solarSystemModule;
    let constellationLineObjects = 0;
    ssm.constellations.forEach(c => c.traverse(o => {
      if (o.isLine || o.isLineSegments) constellationLineObjects++;
    }));
    let spacecraftMeshCount = 0;
    [...ssm.satellites, ...ssm.spacecraft].forEach(s => s.traverse(o => {
      if (o.isMesh && o !== s.userData.lod?.marker) spacecraftMeshCount++;
    }));
    return {
      constellationCount: ssm.constellations.length,
      constellationLineObjects,
      spacecraftMeshCount
    };
  });
  expect(drawCallStats.constellationLineObjects).toBe(drawCallStats.constellationCount);
  expect(drawCallStats.spacecraftMeshCount).toBeLessThanOrEqual(65);

  const speed = page.locator('#time-speed');
  await speed.evaluate((input) => {
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#time-speed-label')).toHaveText('Paused');
  await expect.poll(() => page.evaluate(() => window.app.timeSpeed)).toBe(0);

  await page.locator('#info-panel .close-btn').click();
  await expect(page.locator('#info-panel')).toHaveClass(/hidden/);

  await openModalFromButton(page, '#help-button', '#help-modal');
  await expect(page.locator('#help-modal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#help-content')).toContainText(/Mouse|Touch|VR|Keyboard/i);
  await page.locator('button[aria-label="Close help dialog"]').click({ force: true });
  await expect(page.locator('#help-modal')).toHaveClass(/hidden/);

  await openModalFromButton(page, '#settings-button', '#settings-modal');
  await expect(page.locator('#settings-modal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#settings-modal')).toContainText(`v${APP_VERSION}`);
  await page.locator('button[aria-label="Close settings dialog"]').click({ force: true });
  await expect(page.locator('#settings-modal')).toHaveClass(/hidden/);

  // Verify #speed-control stays at its CSS top (~72px) on window resize (does not jump to 100px)
  const speedTopAfterResize = await page.evaluate(async () => {
    window.dispatchEvent(new Event('resize'));
    await new Promise((r) => setTimeout(r, 200));
    return Math.round(document.getElementById('speed-control').getBoundingClientRect().top);
  });
  expect(speedTopAfterResize).toBeLessThan(90);

  // Verify PWA URL shortcut (?planet=mars) focuses Mars on startup
  await page.goto('/?planet=mars');
  await page.waitForFunction(() => Boolean(window.app?._experienceStarted && document.querySelector('#loading')?.classList.contains('hidden')), { timeout: 60_000 });
  await expect(page.locator('#object-name')).toHaveText('Mars');

  expect(diagnostics).toEqual([]);
});

test('preserves astronomical info and uses consistent scientific AU scale', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    const app = window.app;
    const solarSystem = app.solarSystemModule;
    const proximaB = solarSystem.exoplanets.find((planet) => planet.userData.name === 'Proxima Centauri b');
    const proximaInfo = solarSystem.getObjectInfo(proximaB);
    app.applyScaleMode('scientific', { persist: false });
    const earth = solarSystem.planets.earth;
    solarSystem.update(1 / 60, 1, app.sceneManager.camera, app.sceneManager.controls);
    const daysSinceJ2000 = solarSystem.simulatedJD - 2451545;
    const gmst = ((280.46061837 + 360.98564736629 * daysSinceJ2000) % 360 + 360) % 360 * Math.PI / 180;
    const expectedEarthRotation = Math.atan2(earth.position.z, earth.position.x) + Math.PI +
      solarSystem._sunRA(daysSinceJ2000) - gmst;

    return {
      proximaInfo,
      earthRotationError: Math.abs(earth.rotation.y - expectedEarthRotation),
      dwarfPlanetDistances: {
        ceres: solarSystem.planets.ceres.userData.distance,
        haumea: solarSystem.planets.haumea.userData.distance,
        sedna: solarSystem.planets.sedna.userData.distance
      }
    };
  });

  expect(result.proximaInfo.distance).toBe('4.24 light-years');
  expect(result.proximaInfo.funFact).toBeTruthy();
  expect(result.proximaInfo.description).not.toContain(result.proximaInfo.funFact);
  expect(result.earthRotationError).toBeLessThan(1e-10);
  expect(result.dwarfPlanetDistances).toEqual({
    ceres: 415.5,
    haumea: 6450,
    sedna: 75900
  });
});

test('registers PWA assets and service worker', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service worker assertions are covered in Chromium.');

  const diagnostics = collectDiagnostics(page);
  await openApp(page);

  const manifestResponse = await page.request.get('/manifest.json');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toContain('Space Voyage');
  expect(manifest.icons.length).toBeGreaterThan(0);

  const serviceWorkerState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const registration = await navigator.serviceWorker.ready;
    return {
      supported: true,
      scope: registration.scope,
      scriptURL: registration.active?.scriptURL,
      state: registration.active?.state
    };
  });

  expect(serviceWorkerState).toMatchObject({
    supported: true,
    state: 'activated'
  });
  expect(serviceWorkerState.scriptURL).toContain('/sw.js');

  expect(diagnostics).toEqual([]);
});