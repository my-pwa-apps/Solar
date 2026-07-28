import { expect, test } from '@playwright/test';

/**
 * Regression coverage for keyboard shortcut scoping.
 *
 * Three defects motivated these tests:
 *  1. Shortcuts fired while a browser/OS modifier was held, so Ctrl+R reset the
 *     camera on its way to reloading and Ctrl+S toggled scale mode.
 *  2. Shortcuts fired while the navigation <select> had focus, so native
 *     type-ahead ("Saturn") silently toggled scale, orbits and labels.
 *  3. Escape closed all three overlays at once instead of only the frontmost,
 *     so dismissing a modal also threw away the info panel behind it.
 */

async function openApp(page) {
  await page.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    localStorage.setItem('space_voyage_sound', 'false');
    localStorage.setItem('scaleMode', 'educational');
    localStorage.setItem('orbitsVisible', 'all');
    localStorage.setItem('labelsVisible', 'false');
  });
  await page.goto('/');
  await page.waitForFunction(() => {
    return Boolean(window.app?._experienceStarted &&
      document.querySelector('#loading')?.classList.contains('hidden'));
  }, { timeout: 60_000 });
}

/** Reads the toggles that the affected shortcuts mutate. */
function readToggleState(page) {
  return page.evaluate(() => ({
    realisticScale: Boolean(window.app?.solarSystemModule?.realisticScale),
    orbits: window.app?.solarSystemModule?.orbitMode ?? null,
    labels: Boolean(window.app?.solarSystemModule?.labelsVisible)
  }));
}

test.describe('keyboard shortcut scoping', () => {
  test('modifier chords do not trigger app shortcuts', async ({ page }) => {
    await openApp(page);
    const before = await readToggleState(page);

    // 's' = scale, 'o' = orbits, 'l' = labels. With a modifier held these must
    // keep their native browser meaning and change nothing in the app.
    for (const key of ['s', 'o', 'l']) {
      await page.keyboard.press(`Control+${key}`);
      await page.keyboard.press(`Alt+${key}`);
    }
    await page.waitForTimeout(250);

    expect(await readToggleState(page)).toEqual(before);
  });

  test('typing in a focused form control does not trigger shortcuts', async ({ page }) => {
    await openApp(page);

    const searchInput = page.locator('#nav-search');
    const hasSearch = await searchInput.count();
    test.skip(hasSearch === 0, 'navigation search input not present');

    const before = await readToggleState(page);
    await searchInput.focus();
    // Every character here is also a shortcut key.
    await searchInput.fill('');
    await searchInput.pressSequentially('solar');
    await page.waitForTimeout(250);

    expect(await readToggleState(page)).toEqual(before);
    await expect(searchInput).toHaveValue('solar');
  });

  test('unmodified shortcut still works, proving the guard is not over-broad', async ({ page }) => {
    await openApp(page);
    const before = await readToggleState(page);

    // Do not click the page: the WebGL canvas covers the viewport and swallows
    // pointer events, so an actionability-checked click never resolves. Blur
    // any focused control directly instead.
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.keyboard.press('s');
    await page.waitForTimeout(400);

    const after = await readToggleState(page);
    expect(after.realisticScale).not.toBe(before.realisticScale);
  });

  test('Escape closes only the frontmost overlay', async ({ page }) => {
    await openApp(page);

    const infoPanel = page.locator('#info-panel');
    const helpModal = page.locator('#help-modal');

    // Open the info panel first, then stack the help modal on top of it.
    await page.evaluate(() => {
      window.app.uiManager.updateInfoPanel({
        name: 'Test Object',
        description: 'Opened directly to stack overlays for this regression test.'
      });
    });
    await expect(infoPanel).not.toHaveClass(/hidden/, { timeout: 5_000 });

    await page.locator('#help-button').click({ force: true });
    await expect(helpModal).not.toHaveClass(/hidden/, { timeout: 5_000 });

    await page.keyboard.press('Escape');

    await expect(helpModal).toHaveClass(/hidden/, { timeout: 5_000 });
    // The panel underneath must survive — this is the actual regression.
    await expect(infoPanel).not.toHaveClass(/hidden/);

    await page.keyboard.press('Escape');
    await expect(infoPanel).toHaveClass(/hidden/, { timeout: 5_000 });
  });
});
