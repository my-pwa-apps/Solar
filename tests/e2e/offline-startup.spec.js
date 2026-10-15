import { test, expect } from '@playwright/test';

test('a fresh offline document boots the complete app with decoded textures', async ({ page, context }, testInfo) => {
  test.skip(!['desktop-chromium', 'mobile-chromium'].includes(testInfo.project.name), 'Offline startup requires the worker-enabled projects.');
  await context.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    localStorage.setItem('bloomEnabled', 'false');
  });
  await page.goto('/');
  await page.waitForFunction(() => window.app?._experienceStarted && navigator.serviceWorker.controller);
  await page.close();
  await context.setOffline(true);
  const offline = await context.newPage();
  const errors = [];
  offline.on('pageerror', error => errors.push(error.message));
  await offline.goto('/?planet=earth');
  await offline.waitForFunction(() => window.app?._experienceStarted && document.querySelector('#loading').classList.contains('hidden'));
  await offline.locator('#object-dropdown').selectOption('earth');
  const state = await offline.evaluate(() => {
    const app = window.app;
    app.timeSpeed = 0;
    const manager = app.sceneManager;
    manager.renderer.render(manager.scene, manager.camera);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    context.drawImage(manager.renderer.domElement, 0, 0, 64, 64);
    const pixels = context.getImageData(0, 0, 64, 64).data;
    const colors = new Set();
    for (let index = 0; index < pixels.length; index += 4) colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`);
    const image = app.solarSystemModule.planets.earth.material.map.image;
    return { controlled: !!navigator.serviceWorker.controller, colors: colors.size, decodedWidth: image.naturalWidth || image.width, renderErrors: performance.getEntriesByName('render-error').length };
  });
  expect(state.controlled).toBe(true);
  expect(state.colors).toBeGreaterThan(10);
  expect(state.decodedWidth).toBeGreaterThan(0);
  expect(state.renderErrors).toBe(0);
  expect(errors).toEqual([]);
  await testInfo.attach('offline-startup', { body: await offline.screenshot(), contentType: 'image/png' });
});