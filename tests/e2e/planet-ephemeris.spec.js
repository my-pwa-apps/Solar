import { expect, test } from '@playwright/test';

async function bootApp(page) {
  await page.goto('/');
  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('hidden'),
    null,
    { timeout: 120_000 }
  );
}

test('all eight rendered planets follow simulated UTC in the J2000 ecliptic frame', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Full 3D ephemeris integration runs once.');
  await bootApp(page);

  const result = await page.evaluate(async () => {
    const { PLANET_IDS, planetEclipticPosition } = await import('/src/modules/astro/PlanetEphemeris.js');
    const solarSystem = window.app.solarSystemModule;
    window.app.timeSpeed = 0;
    const dates = [
      Date.UTC(2024, 0, 1),
      Date.UTC(2026, 7, 19),
      Date.UTC(2030, 0, 1)
    ];
    const errors = [];

    for (const scientificMode of [false, true]) {
      solarSystem.setScientificMode(scientificMode);
      for (const timestamp of dates) {
        solarSystem.seekToDate(new Date(timestamp));
        for (const planetId of PLANET_IDS) {
          const planet = solarSystem.planets[planetId];
          const expected = planetEclipticPosition(planetId, solarSystem.simulatedJD);
          const actualLength = planet.position.length();
          const expectedLength = Math.hypot(expected.x, expected.y, expected.z);
          const cosine = planet.position.dot(expected)
            / (actualLength * expectedLength);
          const angleDeg = Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
          errors.push({ scientificMode, timestamp, planetId, angleDeg });
        }
      }
    }

    solarSystem.setScientificMode(true);
    solarSystem.seekToDate(new Date(Date.UTC(2026, 7, 19)));
    solarSystem.update(
      1,
      100,
      window.app.sceneManager.camera,
      window.app.sceneManager.controls
    );
    for (const planetId of PLANET_IDS) {
      const planet = solarSystem.planets[planetId];
      const expected = planetEclipticPosition(planetId, solarSystem.simulatedJD);
      const cosine = planet.position.dot(expected)
        / (planet.position.length() * Math.hypot(expected.x, expected.y, expected.z));
      errors.push({
        scientificMode: true,
        timestamp: 'live-update',
        planetId,
        angleDeg: Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI
      });
    }

    return errors;
  });

  expect(result).toHaveLength(56);
  for (const sample of result) {
    const instant = sample.timestamp === 'live-update'
      ? sample.timestamp
      : new Date(sample.timestamp).toISOString();
    expect(sample.angleDeg, `${sample.planetId} at ${instant}, scientific=${sample.scientificMode}`)
      .toBeLessThan(0.001);
  }
});

test('Earth rotation axis stays fixed in inertial space across a year', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Full 3D ephemeris integration runs once.');
  await bootApp(page);

  const result = await page.evaluate(() => {
    const solarSystem = window.app.solarSystemModule;
    const earth = solarSystem.planets.earth;
    const Vector = earth.position.constructor;
    const localPole = new Vector(0, 1, 0);
    const expected = new Vector(
      0,
      Math.cos(23.439291111 * Math.PI / 180),
      -Math.sin(23.439291111 * Math.PI / 180)
    );
    const samples = [];

    for (let month = 0; month <= 12; month++) {
      solarSystem.seekToDate(new Date(Date.UTC(2026, month, 1, 12)));
      const actual = localPole.clone().applyQuaternion(earth.quaternion).normalize();
      const angleDeg = Math.acos(Math.max(-1, Math.min(1, actual.dot(expected))))
        * 180 / Math.PI;
      samples.push(angleDeg);
    }
    return samples;
  });

  expect(result).toHaveLength(13);
  for (const angleDeg of result) expect(angleDeg).toBeLessThan(0.01);
});

test('scientific moon orbits use physical planet-radius ratios', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Full 3D scale integration runs once.');
  await bootApp(page);

  const result = await page.evaluate(() => {
    const solarSystem = window.app.solarSystemModule;
    const modes = {};

    for (const scientificMode of [false, true]) {
      solarSystem.setScientificMode(scientificMode);
      modes[scientificMode ? 'scientific' : 'educational'] = Object.values(solarSystem.moons)
        .map((moon) => ({
          id: moon.userData.id,
          parentId: moon.parent.userData.id,
          distance: moon.userData.distance,
          scientificDistance: moon.userData.scientificDistance,
          parentRadius: moon.parent.userData.radius,
          moonRadius: moon.userData.radius,
          eccentricity: moon.userData.orbitalEccentricity || 0
        }));
    }

    return modes;
  });

  const semimajorAxisKm = {
    moon: 384400, phobos: 9376, deimos: 23463, io: 421700,
    europa: 671100, ganymede: 1070400, callisto: 1882700,
    enceladus: 238020, rhea: 527108, titan: 1221870,
    titania: 435910, miranda: 129900, triton: 354759, charon: 19596
  };
  const parentRadiusKm = {
    earth: 6371, mars: 3389.5, jupiter: 69911, saturn: 58232,
    uranus: 25362, neptune: 24622, pluto: 1188.3
  };

  expect(result.scientific).toHaveLength(14);
  for (const moon of result.scientific) {
    const actualRatio = moon.distance / moon.parentRadius;
    const expectedRatio = semimajorAxisKm[moon.id] / parentRadiusKm[moon.parentId];
    expect(Math.abs(actualRatio / expectedRatio - 1), `${moon.id} orbital-radius ratio`)
      .toBeLessThan(0.1);
  }

  for (const [mode, moons] of Object.entries(result)) {
    for (const moon of moons) {
      const periapsis = moon.distance * (1 - moon.eccentricity);
      expect(periapsis, `${moon.id} must clear ${moon.parentId} in ${mode} mode`)
        .toBeGreaterThan(moon.parentRadius + moon.moonRadius);
    }
  }
});
