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
  }
});

test('uses one real-time clock for orbital motion and keeps the selected speed', async ({ page }) => {
  await openApp(page);
  const measurements = await page.evaluate(() => {
    const app = window.app;
    const ssm = app.solarSystemModule;
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
    const educational = step(1);
    ssm.setScientificMode(true, { rebuildOrbits: false });
    const scientific = step(1);
    const paused = step(0);
    const reverse = step(-1);
    ssm.seekToDate('2030-01-01T00:00:00Z');
    const expectedExoplanetAngle = (((ssm.simulatedJD - 2451545) / 11.2 * 2 * Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const exoplanetAngle = exoplanet.angle;
    const seekErrors = [];
    for (const scientificMode of [false, true]) {
      ssm.setScientificMode(scientificMode, { rebuildOrbits: false });
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
    return { educational, scientific, paused, reverse, cometPeriod: comet.orbitalPeriod, exoplanetAngle, expectedExoplanetAngle, seekErrors };
  });
  for (const mode of ['educational', 'scientific']) {
    const m = measurements[mode];
    expect(m.jd).toBeCloseTo(5 / 86400, 9);
    expect(m.earth).toBeCloseTo(0.98560028 * Math.PI * 5 / (180 * 86400), 12);
    expect(m.moon).toBeCloseTo(2 * Math.PI * 5 / (27.321661 * 86400), 12);
    expect(m.comet).toBeCloseTo(2 * Math.PI * 5 / (measurements.cometPeriod * 86400), 12);
    expect(m.exoplanet).toBeCloseTo(2 * Math.PI * 5 / (11.2 * 86400), 12);
    expect(m.satellite).toBeCloseTo(15.5 * 2 * Math.PI * 5 / 86400, 12);
  }
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
          window.app.uiManager.setSpeed(100);
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
  expect(result.currentJD).toBeGreaterThan(result.startJD + 20 / 86400);
  expect(result.speed).toBeCloseTo(100, 6);
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
      if (o.isMesh) spacecraftMeshCount++;
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