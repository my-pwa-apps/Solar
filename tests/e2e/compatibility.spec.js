import { expect, test } from '@playwright/test';

test('supported desktop browsers boot the 3D experience with keyboard access', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    localStorage.setItem('bloomEnabled', 'false');
    localStorage.setItem('space_voyage_sound', 'false');
  });

  await page.goto('/');
  await page.waitForFunction(() => {
    const loading = document.getElementById('loading');
    return Boolean(
      window.app?._experienceStarted &&
      document.querySelector('#canvas-container canvas') &&
      loading?.classList.contains('hidden')
    );
  }, null, { timeout: 90_000 });

  await expect(page.locator('#canvas-container canvas')).toBeVisible();
  await expect(page.locator('#main-header')).toBeVisible();
  await expect(page.locator('#help-button')).toHaveAccessibleName(/help/i);

  if (testInfo.project.name.includes('webkit')) {
    // Safari only includes links in sequential Tab navigation when the user's
    // macOS Full Keyboard Access preference is enabled. Programmatic focus plus
    // keyboard activation verifies the app contract independent of that OS setting.
    await page.locator('.skip-link').focus();
  } else {
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#canvas-container')).toBeFocused();
});