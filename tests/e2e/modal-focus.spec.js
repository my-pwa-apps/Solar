import { test, expect } from '@playwright/test';

test('focus trap excludes hidden/disabled controls and restores stacked dialogs', async ({ page }) => {
  await page.goto('/robots.txt');
  await page.setContent('<button id="opener">Open</button><section id="outer"><button id="first">First</button><button disabled>Disabled</button><button id="last">Last</button><button hidden>Hidden</button></section><section id="inner"><button id="only">Only</button></section>');
  await page.locator('#opener').focus();
  await page.evaluate(async () => {
    const { trapFocus } = await import('/src/modules/FocusTrap.js');
    window.releaseOuter = trapFocus(document.getElementById('outer'));
    window.makeTrap = trapFocus;
  });
  await expect(page.locator('#first')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#last')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#first')).toBeFocused();
  await page.locator('#last').focus();
  await page.evaluate(() => { window.releaseInner = window.makeTrap(document.getElementById('inner')); });
  await page.keyboard.press('Tab');
  await expect(page.locator('#only')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#only')).toBeFocused();
  await page.evaluate(() => window.releaseInner());
  await expect(page.locator('#last')).toBeFocused();
  await page.evaluate(() => { document.getElementById('first').disabled = true; document.getElementById('last').disabled = true; });
  await page.keyboard.press('Tab');
  await expect(page.locator('#outer')).toBeFocused();
  await page.evaluate(() => window.releaseOuter());
  await expect(page.locator('#opener')).toBeFocused();
});

test('all onboarding steps and fatal recovery contain real keyboard navigation', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto('/');
  const overlay = page.locator('#onboarding-overlay');
  await expect(overlay).toBeVisible({ timeout: 60_000 });
  for (let step = 1; step <= 3; step++) {
    const last = page.locator(step === 3 ? '#onboarding-start' : '#onboarding-next');
    await last.focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#onboarding-skip')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
    if (step < 3) await page.keyboard.press('Enter');
  }
  await page.keyboard.press('Enter');
  await expect(overlay).toBeHidden();
  await page.locator('#help-button').click();
  await expect(page.locator('#help-modal')).toBeVisible();
  await page.locator('#help-close-btn').click();
  await expect(page.locator('#help-modal')).toBeHidden();
  await page.locator('#settings-button').click();
  await expect(page.locator('#settings-modal')).toBeVisible();
  await page.locator('#settings-close-btn').click();
  await expect(page.locator('#settings-modal')).toBeHidden();
  await page.evaluate(async () => {
    const { showFatalError } = await import('/src/modules/FatalError.js');
    showFatalError('Test recovery');
  });
  await page.locator('#fatal-error summary').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#fatal-error button').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#fatal-error summary')).toBeFocused();
});