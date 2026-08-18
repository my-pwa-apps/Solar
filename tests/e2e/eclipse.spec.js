import { test, expect } from '@playwright/test';

/**
 * Browser-side eclipse tests: rendering, Earth orientation and the date panel.
 *
 * The ephemeris and shadow geometry are pure maths and are covered far faster by
 * `npm run test:unit` (tests/unit/astro.test.mjs). Only behaviour that genuinely
 * needs a GPU and a DOM lives here.
 *
 * Note: the page runs under a strict CSP with no 'unsafe-eval', so these tests
 * use plain page.evaluate bodies. Stringifying a helper and rebuilding it with
 * `new Function` inside the page is blocked and fails every assertion.
 */

const AUG_2026 = Date.UTC(2026, 7, 12, 17, 47, 6);   // greatest eclipse, UTC
const LEON_TOTALITY = Date.UTC(2026, 7, 12, 18, 29, 32);

async function bootApp(page) {
  await page.goto('/');
  await page.waitForFunction(
    () => document.querySelector('#loading')?.classList.contains('hidden'),
    null,
    { timeout: 120_000 }
  );
}
test.describe('eclipse rendering and date controls', () => {
  test('Earth is oriented so the real sub-solar point faces the Sun', async ({ page }) => {
    await bootApp(page);

    const r = await page.evaluate((t) => {
      const ssm = window.app.solarSystemModule;
      window.app.timeSpeed = 0;
      ssm.seekToDate(new Date(t));

      const earth = ssm.planets.earth;
      const ew = new earth.position.constructor();
      earth.getWorldPosition(ew);
      // Direction to the Sun (at the origin), expressed in Earth object space.
      const local = ew.clone().negate().normalize().add(ew);
      earth.worldToLocal(local);
      local.normalize();

      const su = ssm.eclipseRenderer.uniforms.uSunDirObj.value;
      return {
        sceneLat: Math.asin(local.y) * 180 / Math.PI,
        sceneLon: Math.atan2(-local.z, local.x) * 180 / Math.PI,
        ephemLat: Math.asin(su.y) * 180 / Math.PI,
        ephemLon: Math.atan2(-su.z, su.x) * 180 / Math.PI
      };
    }, LEON_TOTALITY);

    // Without this alignment the shadow would land on the scene's night side.
    expect(Math.abs(r.sceneLat - r.ephemLat)).toBeLessThan(0.5);
    expect(Math.abs(r.sceneLon - r.ephemLon)).toBeLessThan(0.5);
    // Sanity: mid-August solar declination is about +14 degrees.
    expect(r.ephemLat).toBeGreaterThan(12);
    expect(r.ephemLat).toBeLessThan(17);
  });

  test('seeking to totality darkens the globe where the shadow falls', async ({ page }) => {
    await bootApp(page);

    const r = await page.evaluate((t) => {
      const ssm = window.app.solarSystemModule;
      const sm = window.app.sceneManager;
      window.app.timeSpeed = 0;
      ssm.seekToDate(new Date(t));

      const e = ssm.currentEclipse;
      const earth = ssm.planets.earth;
      const V = earth.position.constructor;
      const lat = e.latDeg * Math.PI / 180, lon = e.lonDeg * Math.PI / 180;
      const objDir = new V(
        Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)
      );
      const surface = objDir.clone();
      earth.localToWorld(surface);
      const ew = new V();
      earth.getWorldPosition(ew);
      const outward = surface.clone().sub(ew).normalize();
      sm.camera.position.copy(ew).addScaledVector(outward, 1.9);
      sm.camera.lookAt(ew);
      ssm.focusedObject = null;

      const u = ssm.eclipseRenderer.uniforms;
      const gl = sm.renderer.getContext();
      const grab = () => {
        sm.renderer.render(sm.scene, sm.camera);
        const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
        const px = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return px;
      };

      u.uEclipseIntensity.value = 0;
      const off = grab();
      u.uEclipseIntensity.value = 1;
      const on = grab();

      let darkened = 0, maxDrop = 0;
      for (let i = 0; i < off.length; i += 4) {
        const a = off[i] + off[i + 1] + off[i + 2];
        const b = on[i] + on[i + 1] + on[i + 2];
        const drop = a - b;
        if (drop > 8) { darkened++; if (drop > maxDrop) maxDrop = drop; }
      }
      return { type: e.type, lat: e.latDeg, lon: e.lonDeg, darkened, maxDrop };
    }, LEON_TOTALITY);

    expect(r.type).toBe('total');
    // Northern Spain
    expect(r.lat).toBeGreaterThan(40);
    expect(r.lat).toBeLessThan(45);
    expect(r.lon).toBeGreaterThan(-9);
    expect(r.lon).toBeLessThan(1);
    // The shadow must actually reach the framebuffer, and go properly dark.
    expect(r.darkened).toBeGreaterThan(500);
    expect(r.maxDrop).toBeGreaterThan(120);
  });

  test('the Moon is placed between Earth and the Sun during totality', async ({ page }) => {
    await bootApp(page);

    const r = await page.evaluate((t) => {
      const ssm = window.app.solarSystemModule;
      window.app.timeSpeed = 0;
      ssm.seekToDate(new Date(t));

      // The mesh is repositioned by the render loop, not by seekToDate, so
      // wait for a couple of frames before measuring.
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const earth = ssm.planets.earth;
          const V = earth.position.constructor;
          const moon = (earth.userData.moons || []).find((m) => m.userData?.id === 'moon');
          if (!moon) { resolve({ moonFound: false }); return; }

          const earthW = new V(); earth.getWorldPosition(earthW);
          const moonW = new V(); moon.getWorldPosition(moonW);
          const toSun = earthW.clone().negate().normalize();   // Sun is at the origin
          const toMoon = moonW.clone().sub(earthW).normalize();

          resolve({
            moonFound: true,
            angleDeg: Math.acos(Math.max(-1, Math.min(1, toSun.dot(toMoon)))) * 180 / Math.PI,
            moonIsSunward: moonW.length() < earthW.length(),
            localY: moon.position.y
          });
        }));
      });
    }, AUG_2026);

    expect(r.moonFound).toBe(true);
    // At totality the Moon must sit on the Earth-Sun line, not merely somewhere
    // on its circular scene orbit. The original guard compared a localised
    // display name and never fired, leaving the Moon 120 degrees away.
    expect(r.angleDeg).toBeLessThan(2);
    expect(r.moonIsSunward).toBe(true);
    // The default circular orbit pins the Moon to the ecliptic plane; a
    // non-zero y proves the ephemeris override actually ran.
    expect(Math.abs(r.localY)).toBeGreaterThan(0.001);
  });

  test('the date panel drives the simulation and Now returns to today', async ({ page }) => {
    await bootApp(page);
    await page.evaluate(() => { window.app.timeSpeed = 0; });

    const input = page.locator('#sim-date-input');
    await expect(input).toHaveValue(/^\d{4}-\d{2}-\d{2}T/);

    await input.fill('2026-08-12T18:29:32');
    await input.dispatchEvent('change');
    await page.waitForTimeout(500);

    await expect(page.locator('#eclipse-status')).not.toHaveClass(/hidden/);
    await expect(page.locator('#eclipse-status')).toContainText(/eclipse/i);
    await expect(page.locator('#sim-date-display')).toContainText('2026');

    // Drive the button through the DOM: the panel may be collapsed from a
    // previous session, and this test is about the wiring, not the layout.
    await page.evaluate(() => document.getElementById('time-now').click());
    await page.waitForTimeout(500);

    const driftDays = await page.evaluate(() => {
      const jd = window.app.solarSystemModule.simulatedJD;
      return Math.abs(jd - (Date.now() / 86400000 + 2440587.5));
    });
    expect(driftDays).toBeLessThan(1);
  });

  test('the app opens at today\'s date', async ({ page }) => {
    await bootApp(page);
    const drift = await page.evaluate(() => {
      const jd = window.app.solarSystemModule.simulatedJD;
      return Math.abs(jd - (Date.now() / 86400000 + 2440587.5));
    });
    // Time runs accelerated once loaded, so allow for the boot sequence.
    expect(drift).toBeLessThan(3);
  });
});
