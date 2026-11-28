import { expect, test } from '@playwright/test';
test('XR repeated snap, stationary grip, and haptic identity behave correctly', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Focused XR checks only need to run once.');
  await page.goto('/?emulate-vr');
  await page.waitForFunction(() => window.app?.sceneManager, null, { timeout: 30_000 });

  const result = await page.evaluate(() => {
    const sm = window.app.sceneManager;
    sm.previousButtonStates = [{}, {}];
    sm._vrSnapCooldown = [false, false];
    sm._vrMovementLastTime = null;
    sm._vrTriggerPressed = { left: false, right: false };
    sm.vrSnapTurn = true;

    let now = 1000;
    const originalNow = performance.now;
    Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
    sm.renderer.xr.isPresenting = true;
    sm.dolly.position.set(0, 0, 0);
    sm.dolly.rotation.set(0, 0, 0);
    sm.camera.position.set(0, 0, 0);
    sm.camera.lookAt(0, 0, -1);

    const rightSource = {
      handedness: 'right',
      gamepad: { axes: [0, 0, 1, 0], buttons: Array.from({ length: 6 }, () => ({ pressed: false })) }
    };
    const session = { inputSources: [rightSource] };
    sm.renderer.xr.getSession = () => session;

    sm.controllers = sm.controllers?.length ? sm.controllers : [
      { position: { x: 0, y: 0, z: 0 }, userData: {} },
      { position: { x: 0, y: 0, z: 0 }, userData: {} }
    ];
    sm.controllers[0].userData.handedness = 'left';
    sm.controllers[1].userData.handedness = 'right';
    sm.controllers[0].position.x = 0;
    sm.controllers[0].position.y = 0;
    sm.controllers[0].position.z = 0;
    sm.controllers[1].position.x = 0;
    sm.controllers[1].position.y = 0;
    sm.controllers[1].position.z = 0;

    sm.updateXRMovement();
    now += 100;
    rightSource.gamepad.axes = [0, 0, 0, 0];
    sm.updateXRMovement();
    const centeredCooldown = sm._vrSnapCooldown[1];
    now += 100;
    rightSource.gamepad.axes = [0, 0, 1, 0];
    sm.updateXRMovement();
    const snapYawAfterTwo = sm.dolly.rotation.y;

    sm.dolly.rotation.set(0, 0, 0);
    sm.controllers[0].position.x = 0.25;
    sm.controllers[0].position.y = 0;
    sm.controllers[0].position.z = 0;
    sm.grabRotateState.active = true;
    sm.grabRotateState.controllerIndex = 0;
    sm.grabRotateState.lastPosition.set(0, 0, 0);
    rightSource.gamepad.axes = [0, 0, 0, 0];
    session.inputSources = [];
    for (let i = 0; i < 12; i++) sm.updateXRMovement();
    const grabYawAfterStationary = sm.dolly.rotation.y;

    const pulses = { left: [], right: [] };
    const leftSource = {
      handedness: 'left',
      gamepad: { hapticActuators: [{ pulse: (intensity, duration) => pulses.left.push([intensity, duration]) }] }
    };
    const rightHapticSource = {
      handedness: 'right',
      gamepad: { hapticActuators: [{ pulse: (intensity, duration) => pulses.right.push([intensity, duration]) }] }
    };
    session.inputSources = [rightHapticSource, leftSource];
    sm.triggerVRHaptic(1, 0.4, 55);
    sm.triggerVRHaptic('left', 0.3, 40);

    Object.defineProperty(performance, 'now', { configurable: true, value: originalNow });
    sm.renderer.xr.isPresenting = false;

    return { snapYawAfterTwo, centeredCooldown, grabYawAfterStationary, pulses };
  });

  expect(Math.abs(result.snapYawAfterTwo)).toBeGreaterThan(Math.PI / 5);
  expect(result.centeredCooldown).toBe(false);
  expect(Math.abs(result.grabYawAfterStationary)).toBeLessThan(1);
  expect(result.pulses.right).toEqual([[0.4, 55]]);
  expect(result.pulses.left).toEqual([[0.3, 40]]);
});

test('XR locomotion displacement is approximately frame-rate independent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Focused XR checks only need to run once.');
  await page.goto('/?emulate-vr');
  await page.waitForFunction(() => window.app?.sceneManager, null, { timeout: 30_000 });

  const distances = await page.evaluate(() => {
    const sm = window.app.sceneManager;
    sm.renderer.xr.isPresenting = true;
    sm.controllers = sm.controllers?.length ? sm.controllers : [
      { position: { x: 0, y: 0, z: 0 }, userData: {} },
      { position: { x: 0, y: 0, z: 0 }, userData: {} }
    ];
    sm.controllers[0].userData.handedness = 'left';
    sm.controllers[1].userData.handedness = 'right';
    sm.grabRotateState.active = false;

    const leftSource = {
      handedness: 'left',
      gamepad: {
        axes: [0, -1, 0, 0],
        buttons: Array.from({ length: 6 }, () => ({ pressed: false }))
      }
    };
    sm.renderer.xr.getSession = () => ({ inputSources: [leftSource] });

    const originalNow = performance.now;
    const run = (hz) => {
      let now = 5000;
      Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
      sm.dolly.position.set(0, 0, 0);
      sm.dolly.rotation.set(0, 0, 0);
      sm.camera.position.set(0, 0, 0);
      sm.camera.lookAt(0, 0, -1);
      sm._vrMovementLastTime = null;
      sm.previousButtonStates = [{}, {}];
      sm._vrRadialVisible = false;
      const start = sm.dolly.position.clone();
      for (let i = 0; i < hz; i++) {
        now += 1000 / hz;
        sm.updateXRMovement();
      }
      return sm.dolly.position.distanceTo(start);
    };

    const at72 = run(72);
    const at120 = run(120);
    Object.defineProperty(performance, 'now', { configurable: true, value: originalNow });
    sm.renderer.xr.isPresenting = false;
    return { at72, at120 };
  });

  expect(distances.at72).toBeGreaterThan(0);
  expect(distances.at120).toBeGreaterThan(0);
  expect(Math.abs(distances.at72 - distances.at120) / Math.max(distances.at72, distances.at120)).toBeLessThan(0.05);
});

test('VR speed feedback is mode-aware and localized', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Focused XR checks only need to run once.');
  await page.goto('/?emulate-vr');
  await page.waitForFunction(() => window.app?._experienceStarted, null, { timeout: 60_000 });

  const result = await page.evaluate(async () => {
    const sm = window.app.sceneManager;
    const app = window.app;
    const nl = (await import('/src/locales/nl.js')).default;
    document.documentElement.lang = 'nl';
    window.t = (key) => nl[key] || key;

    app.solarSystemModule.scientificMode = false;
    app.uiManager.setSpeedMode('educational');
    sm.handleVRAction('speed10');
    const educationalFastStatus = sm.vrStatusMessage;
    const educationalFastTime = app.timeSpeed;
    sm.handleVRAction('speed100');
    const educationalStatus = sm.vrStatusMessage;
    const educationalTime = app.timeSpeed;

    app.solarSystemModule.scientificMode = true;
    app.uiManager.setSpeedMode('scientific');
    sm.handleVRAction('speed10');
    const scientificFastStatus = sm.vrStatusMessage;
    const scientificFastTime = app.timeSpeed;
    sm.handleVRAction('speed100');
    const scientificStatus = sm.vrStatusMessage;
    const scientificTime = app.timeSpeed;

    const catalogBefore = sm.getVRNavCatalog();
    const earthLabelNl = catalogBefore.find(c => c.id === 'solar').items.find(i => i.id === 'earth').label;
    return {
      educationalFastStatus, educationalFastTime, educationalStatus, educationalTime,
      scientificFastStatus, scientificFastTime, scientificStatus, scientificTime,
      earthLabelNl
    };
  });

  expect(result.educationalStatus).toContain('10');
  expect(result.educationalStatus).not.toContain('525960');
  expect(result.educationalStatus).not.toContain('525,960');
  expect(result.educationalTime).toBe(10);
  expect(result.educationalFastTime).toBeCloseTo(5);
  expect(result.educationalFastStatus).toContain('(5×,');
  expect(result.scientificStatus).toContain(String(Math.round(result.scientificTime)));
  expect(result.scientificTime).toBeGreaterThan(10);
  expect(result.scientificFastTime).toBeCloseTo(10);
  expect(result.earthLabelNl).not.toContain('Earth');
});
