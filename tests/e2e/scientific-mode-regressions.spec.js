import { expect, test } from '@playwright/test';

async function openApp(page) {
  await page.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    localStorage.setItem('space_voyage_sound', 'false');
  });
  await page.goto('/');
  await page.waitForFunction(
    () => Boolean(window.app?._experienceStarted && document.querySelector('#loading')?.classList.contains('hidden')),
    { timeout: 60_000 }
  );
}

test('scientific seek, live positions, retrograde moons and paused mode round trips stay coherent', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const THREE = await import('three');
    const app = window.app;
    const solar = app.solarSystemModule;
    const { camera, controls, renderer } = app.sceneManager;
    renderer.setAnimationLoop(null);

    app.applyScaleMode('scientific', { persist: false });
    solar.seekToDate('2025-01-01T00:00:00Z');
    const liveStart = solar.planets.mars.position.clone();
    solar.update(1, 1, camera, controls);
    const livePosition = solar.planets.mars.position.clone();
    const liveJD = solar.simulatedJD;
    solar.seekToDate(new Date((liveJD - 2440587.5) * 86400000));
    const seekPosition = solar.planets.mars.position.clone();
    const liveSeekError = livePosition.distanceTo(seekPosition);

    const triton = solar.moons.triton;
    const neptune = solar.planets.neptune;
    const tilt = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      neptune.userData.axialTilt * Math.PI / 180
    );
    const toParentEquatorial = () => triton.position.clone()
      .applyQuaternion(neptune.quaternion)
      .applyQuaternion(tilt.clone().invert());
    const before = toParentEquatorial();
    solar.update(1, 1, camera, controls);
    const after = toParentEquatorial();
    const angularMomentumY = before.z * after.x - before.x * after.z;
    const orbitFrame = neptune.quaternion.clone().multiply(triton.userData.orbitLine.quaternion);
    const orbitFrameError = orbitFrame.angleTo(tilt);

    app.uiManager.setSpeed(0);
    app.applyScaleMode('educational', { persist: false });
    solar.seekToDate('2025-01-01T00:00:00.123Z');
    solar.seekToJulianDate(solar.simulatedJD + 0.123456 / 86400);
    const trackedBodies = [
      solar.planets.earth,
      solar.planets.mars,
      solar.moons.moon,
      solar.moons.triton,
      solar.comets[0]
    ];
    const readPositions = () => trackedBodies.map(body => {
      const position = body.getWorldPosition(new THREE.Vector3());
      return [position.x, position.y, position.z];
    });
    const positionsBefore = readPositions();
    const phasesBefore = trackedBodies.map(body => [body.userData.meanAnomaly, body.userData.angle]);
    const jdBefore = solar.simulatedJD;
    const focused = solar.planets.earth;
    solar.focusedObject = focused;
    solar.cameraFollowMode = true;
    solar.cameraCoRotateMode = false;
    solar._cameraFollowObject = focused;
    focused.getWorldPosition(solar._cameraFollowLastTargetPos);
    controls.target.copy(solar._cameraFollowLastTargetPos);
    camera.position.copy(controls.target).add(new THREE.Vector3(0, 10, 50));

    app.applyScaleMode('scientific', { persist: false });
    app.applyScaleMode('educational', { persist: false });
    solar.updateCameraTracking(camera, controls);
    const positionsAfter = readPositions();
    const phasesAfter = trackedBodies.map(body => [body.userData.meanAnomaly, body.userData.angle]);
    const positionError = Math.max(...positionsBefore.flatMap((position, index) =>
      position.map((value, axis) => Math.abs(value - positionsAfter[index][axis]))
    ));
    const phaseError = Math.max(...phasesBefore.flatMap((phase, index) =>
      phase.map((value, component) => Math.abs(value - phasesAfter[index][component]))
    ));
    const dateErrorSeconds = Math.abs(solar.simulatedJD - jdBefore) * 86400;
    const focusPreserved = solar.focusedObject === focused;
    const chaseTargetError = controls.target.distanceTo(focused.getWorldPosition(new THREE.Vector3()));

    return {
      liveSeekError,
      liveStartMoved: liveStart.distanceTo(livePosition),
      angularMomentumY,
      orbitFrameError,
      positionError,
      phaseError,
      dateErrorSeconds,
      focusPreserved,
      chaseTargetError
    };
  });

  expect(result.liveStartMoved).toBeGreaterThan(0);
  expect(result.liveSeekError).toBeLessThan(0.001);
  expect(result.angularMomentumY).toBeGreaterThan(0);
  expect(result.orbitFrameError).toBeLessThan(1e-7);
  expect(result.positionError).toBeLessThan(1e-8);
  expect(result.phaseError).toBeLessThan(1e-12);
  expect(result.dateErrorSeconds).toBeLessThan(1e-8);
  expect(result.focusPreserved).toBe(true);
  expect(result.chaseTargetError).toBeLessThan(1e-8);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.evaluate(() => {
    const { solarSystemModule, sceneManager } = window.app;
    sceneManager.camera.position.x += 100;
    sceneManager.camera.position.y += 50;
    sceneManager.camera.position.z += 100;
    sceneManager.controls.target.set(0, 0, 0);
    const before = sceneManager.camera.position.clone();
    solarSystemModule.focusOnObject(
      solarSystemModule.planets.earth,
      sceneManager.camera,
      sceneManager.controls
    );
    return {
      activeAfterReturn: solarSystemModule._focusTransitionActive,
      cameraMoved: sceneManager.camera.position.distanceTo(before) > 0.1
    };
  });
  expect(reducedMotion.activeAfterReturn).toBe(false);
  expect(reducedMotion.cameraMoved).toBe(true);
});
