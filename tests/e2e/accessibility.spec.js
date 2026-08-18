import { expect, test } from '@playwright/test';

async function prepareStableFirstRun(page) {
  await page.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    localStorage.setItem('space_voyage_sound', 'false');
  });
}

async function openApp(page) {
  await prepareStableFirstRun(page);
  await page.goto('/');
  await page.waitForFunction(
    () => Boolean(window.app?._experienceStarted && document.querySelector('#loading')?.classList.contains('hidden')),
    { timeout: 60_000 }
  );
}

test.describe('accessibility affordances', () => {
  test('skip link is the first tab stop and moves focus to the 3D view', async ({ page }) => {
    await openApp(page);

    // Start from a known place: focus lives wherever boot left it otherwise.
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.keyboard.press('Tab');

    const firstStop = await page.evaluate(() => document.activeElement?.className || '');
    expect(firstStop).toContain('skip-link');

    await page.keyboard.press('Enter');
    await expect(page.locator('#canvas-container')).toBeFocused();
  });

  test('decorative icons are hidden from assistive technology', async ({ page }) => {
    await openApp(page);

    const unlabelledIcons = await page.evaluate(
      () => [...document.querySelectorAll('svg')].filter((svg) => svg.getAttribute('aria-hidden') !== 'true').length
    );
    expect(unlabelledIcons).toBe(0);
  });

  test('camera fly-to is skipped when the user prefers reduced motion', async ({ page, browser }) => {
    // Measure inside the page: a Playwright round-trip per poll is the same order
    // of magnitude as the animation being measured, so it cannot arbitrate this.
    const timeFlyTo = (target) =>
      target.evaluate(async () => {
        const ssm = window.app.solarSystemModule;
        const start = performance.now();
        ssm.focusOnObject(ssm.planets.mars, window.app.sceneManager.camera, window.app.sceneManager.controls);
        while (ssm._focusTransitionActive && performance.now() - start < 5000) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return performance.now() - start;
      });

    const motionContext = await browser.newContext();
    const motionPage = await motionContext.newPage();
    await openApp(motionPage);
    const fullMotionMs = await timeFlyTo(motionPage);
    await motionContext.close();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openApp(page);
    const reducedMotionMs = await timeFlyTo(page);

    // Guards against the assertion becoming vacuous if focusOnObject ever gains
    // an unconditional fast path.
    expect(fullMotionMs, 'default motion should animate the camera').toBeGreaterThan(500);
    expect(reducedMotionMs, 'reduced motion should cut straight to the target').toBeLessThan(200);
  });
});

test.describe('fatal error recovery', () => {
  test('offers reload and cache-clear actions instead of a stuck spinner', async ({ page }) => {
    await openApp(page);

    await page.evaluate(async () => {
      const { showFatalError } = await import('./src/modules/FatalError.js');
      showFatalError('Simulated boot failure', new Error('kaboom'));
    });

    const overlay = page.locator('#fatal-error');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('role', 'alertdialog');
    await expect(overlay.locator('button')).toHaveCount(2);
    await expect(page.locator('#loading')).toHaveClass(/hidden/);

    // The report must carry enough context to be actionable in a bug report.
    const details = await overlay.locator('pre').textContent();
    expect(details).toContain('kaboom');
    expect(details).toMatch(/^v\d+\.\d+\.\d+/);
  });
});
