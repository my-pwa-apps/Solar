import { test, expect } from '@playwright/test';

test('Quest and generic controller models decode locally online and offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Local model decoding and worker caching are checked once.');
  const external = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url()); });
  await page.addInitScript(() => localStorage.setItem('space_voyage_onboarding_complete', 'true'));
  await page.goto('/');
  await page.waitForFunction(() => window.app?._experienceStarted && !!navigator.serviceWorker.controller);
  await page.evaluate(() => window.app.sceneManager.renderer.setAnimationLoop(null));
  const decode = () => page.evaluate(async () => {
    const { Group } = await import('three');
    const { XRControllerModelFactory } = await import('three/addons/webxr/XRControllerModelFactory.js');
    const path = window.app.sceneManager.controllerModelFactory.path;
    const profiles = await (await fetch(`${path}/profilesList.json`)).json();
    const results = [];
    for (const profile of [...Object.keys(profiles), 'unknown-controller']) {
      for (const handedness of ['left', 'right']) {
        const meshCount = await new Promise((resolveModel, rejectModel) => {
          const deadline = setTimeout(() => rejectModel(new Error(`Model timeout: ${profile}/${handedness}`)), 15000);
          const factory = new XRControllerModelFactory(null, scene => {
            clearTimeout(deadline);
            let meshes = 0;
            scene.traverse(object => { if (object.isMesh) meshes++; });
            resolveModel(meshes);
          }).setPath(path);
          const grip = new Group();
          grip.add(factory.createControllerModel(grip));
          grip.dispatchEvent({ type: 'connected', data: {
            targetRayMode: 'tracked-pointer', handedness, profiles: [profile],
            gamepad: { buttons: Array.from({ length: 6 }, () => ({ value: 0, touched: false, pressed: false })), axes: [0, 0, 0, 0] }
          } });
        });
        results.push({ profile, handedness, meshCount });
      }
    }
    return { local: new URL(path).origin === location.origin, attached: window.app.sceneManager.controllerGrips.every(grip => grip.children.some(child => 'motionController' in child)), results };
  });
  for (const offline of [false, true]) {
    await context.setOffline(offline);
    const decoded = await decode();
    expect(decoded.local).toBe(true);
    expect(decoded.attached).toBe(true);
    expect(decoded.results).toHaveLength(16);
    expect(decoded.results.every(result => result.meshCount > 0)).toBe(true);
  }
  expect(external).toEqual([]);
});