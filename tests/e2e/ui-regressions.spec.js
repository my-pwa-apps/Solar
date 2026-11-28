import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const appHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const importMap = appHtml.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1];

test.use({ serviceWorkers: 'block' });

async function setupPage(page) {
  await page.goto('/robots.txt');
  await page.setContent(`
    <html lang="en"><head>
      <link id="pwa-manifest" rel="manifest" href="./manifest.json">
      <script type="importmap">${importMap}</script>
    </head>
    <body>
      <button id="outside">Outside</button>
      <span id="speed-mode-label"></span><small id="speed-timing-label" data-i18n="educationalMotion"></small>
      <div id="settings-modal" class="hidden">
        <button id="settings-close-btn">Close</button>
        <select id="language-selector"><option value="en">English</option><option value="fr">French</option><option value="nl">Dutch</option></select>
        <input id="sound-toggle" type="checkbox" style="display:none">
      </div>
      <div id="help-modal" class="hidden"><button id="help-close-btn">Close help</button><div id="help-content"></div></div>
      <div id="onboarding-overlay" class="hidden">
        <div class="onboarding-step active" data-step="1"></div><div class="onboarding-step" data-step="2"></div><div class="onboarding-step" data-step="3"></div>
        <button id="onboarding-skip">Skip</button><button id="onboarding-next">Next</button><button id="onboarding-start" class="hidden">Start</button>
      </div>
      <div id="install-prompt" class="hidden"><div class="install-icon"></div><h3 id="install-title"></h3><p></p><div class="install-buttons"><button id="install-accept">Install</button><button id="install-dismiss">Dismiss</button></div></div>
      <style>.hidden { display: none; }</style>
    </body></html>
  `);
}

test('modal tab order excludes hidden controls and restores nested focus', async ({ page }) => {
  await setupPage(page);
  await page.evaluate(async () => {
    const { UIManager } = await import('/src/modules/UIManager.js');
    const { pwaManager } = await import('/src/modules/PWAManager.js');
    window.testUI = new UIManager();
    window.testPWA = pwaManager;
    document.querySelector('#outside').focus();
    window.testUI.showSettings();
  });

  await expect(page.locator('#settings-close-btn')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#language-selector')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#settings-close-btn')).toBeFocused();

  await page.locator('#outside').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#settings-close-btn')).toBeFocused();
  await page.locator('#language-selector').evaluate(element => { element.disabled = true; });
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#settings-close-btn')).toBeFocused();
  await page.locator('#language-selector').evaluate(element => { element.disabled = false; });
  await page.locator('#language-selector').focus();
  await page.evaluate(() => window.testUI.showHelp('Help'));
  await expect(page.locator('#help-close-btn')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#help-close-btn')).toBeFocused();
  await page.evaluate(() => window.testUI.closeHelpModal());
  await expect(page.locator('#language-selector')).toBeFocused();

  await page.evaluate(() => window.testPWA.setInstallPromptVisibility(true));
  await expect(page.locator('#install-accept')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#install-dismiss')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#install-accept')).toBeFocused();
  await page.evaluate(() => window.testPWA.setInstallPromptVisibility(false));
  await expect(page.locator('#language-selector')).toBeFocused();
  await page.evaluate(() => window.testUI.closeSettingsModal());
  await expect(page.locator('#outside')).toBeFocused();
});

test('onboarding traps focus as its buttons change and restores focus on close', async ({ page }) => {
  await setupPage(page);
  await page.evaluate(async () => {
    localStorage.removeItem('space_voyage_onboarding_complete');
    const { UIManager } = await import('/src/modules/UIManager.js');
    const { setupOnboarding } = await import('/src/modules/AppFeatures.js');
    document.querySelector('#outside').focus();
    setupOnboarding(new UIManager());
  });
  await expect(page.locator('#onboarding-skip')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#onboarding-next')).toBeFocused();
  await page.locator('#onboarding-next').click();
  await page.locator('#onboarding-next').click();
  await page.locator('#onboarding-skip').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#onboarding-start')).toBeFocused();
  await page.locator('#onboarding-start').click();
  await expect(page.locator('#outside')).toBeFocused();
});

test('iOS install instructions focus and dismiss their only visible button', async ({ page }) => {
  await setupPage(page);
  await page.evaluate(async () => {
    const { pwaManager } = await import('/src/modules/PWAManager.js');
    document.querySelector('#outside').focus();
    pwaManager.showIOSInstructions();
  });
  await expect(page.locator('#install-dismiss')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#install-dismiss')).toBeFocused();
  await page.locator('#install-dismiss').click();
  await expect(page.locator('#install-prompt')).toBeHidden();
  await expect(page.locator('#outside')).toBeFocused();
});

test('scientific mode labels moon positions as illustrative', async ({ page }) => {
  await setupPage(page);
  const keys = await page.evaluate(async () => {
    const { UIManager } = await import('/src/modules/UIManager.js');
    window.t = key => key;
    window.app = { timeSpeed: 0 };
    const ui = new UIManager();
    ui.setSpeedMode('scientific');
    const label = document.querySelector('#speed-timing-label');
    const scientific = { key: label.dataset.i18n, hidden: label.hidden, text: label.textContent };
    ui.setSpeedMode('educational');
    return { scientific, educational: { key: label.dataset.i18n, hidden: label.hidden, text: label.textContent } };
  });
  expect(keys.scientific).toEqual({ key: 'scientificMoonPhasesApproximate', hidden: false, text: 'scientificMoonPhasesApproximate' });
  expect(keys.educational).toEqual({ key: 'educationalMotion', hidden: false, text: 'educationalMotion' });
});

test('a stale language load cannot commit while the latest request is pending', async ({ page }) => {
  await setupPage(page);
  await page.evaluate(() => localStorage.setItem('appLanguage', 'en'));
  let releaseDutch;
  let dutchRequested;
  const gate = new Promise(resolve => { releaseDutch = resolve; });
  const requested = new Promise(resolve => { dutchRequested = resolve; });
  await page.route('**/src/locales/nl.js', async route => {
    dutchRequested();
    await gate;
    await route.continue();
  });
  await page.evaluate(() => import('/src/i18n.js'));
  await page.evaluate(() => {
    window.earlierLanguage = window.setLanguage('fr');
    window.latestLanguage = window.setLanguage('nl');
  });
  await requested;
  expect(await page.evaluate(() => window.earlierLanguage)).toBe(false);
  expect(await page.evaluate(() => window.getCurrentLanguage())).toBe('en');
  releaseDutch();
  expect(await page.evaluate(() => window.latestLanguage)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('nl');
});

test('the last selected language wins when an earlier import resolves later', async ({ page }) => {
  await setupPage(page);
  await page.evaluate(() => localStorage.setItem('appLanguage', 'en'));
  let releaseFrench;
  let frenchRequested;
  const gate = new Promise(resolve => { releaseFrench = resolve; });
  const requested = new Promise(resolve => { frenchRequested = resolve; });
  await page.route('**/src/locales/fr.js', async route => {
    frenchRequested();
    await gate;
    await route.continue();
  });
  await page.evaluate(() => import('/src/i18n.js'));
  await page.evaluate(() => { window.earlierLanguage = window.setLanguage('fr'); });
  await requested;
  await page.locator('#settings-modal').evaluate(element => element.classList.remove('hidden'));
  await page.selectOption('#language-selector', 'nl');
  await expect.poll(() => page.evaluate(() => window.getCurrentLanguage())).toBe('nl');
  releaseFrench();
  expect(await page.evaluate(() => window.earlierLanguage)).toBe(false);
  expect(await page.evaluate(() => ({
    language: window.getCurrentLanguage(),
    document: document.documentElement.lang,
    selector: document.querySelector('#language-selector').value,
    manifest: document.querySelector('#pwa-manifest').getAttribute('href'),
    saved: localStorage.getItem('appLanguage')
  }))).toEqual({ language: 'nl', document: 'nl', selector: 'nl', manifest: expect.stringContaining('manifest.nl.json'), saved: 'nl' });
});

test('a failed latest language selection restores the committed language', async ({ page }) => {
  await setupPage(page);
  await page.evaluate(() => localStorage.setItem('appLanguage', 'en'));
  let releaseFrench;
  let frenchRequested;
  const gate = new Promise(resolve => { releaseFrench = resolve; });
  const requested = new Promise(resolve => { frenchRequested = resolve; });
  await page.route('**/src/locales/fr.js', async route => {
    frenchRequested();
    await gate;
    await route.continue();
  });
  await page.route('**/src/locales/nl.js', route => route.abort());
  await page.evaluate(() => import('/src/i18n.js'));
  await page.evaluate(() => { window.earlierLanguage = window.setLanguage('fr'); });
  await requested;
  await page.locator('#settings-modal').evaluate(element => element.classList.remove('hidden'));
  await page.selectOption('#language-selector', 'nl');
  await expect.poll(() => page.locator('#language-selector').inputValue()).toBe('en');
  releaseFrench();
  expect(await page.evaluate(() => window.earlierLanguage)).toBe(false);
  expect(await page.evaluate(() => ({
    language: window.getCurrentLanguage(),
    document: document.documentElement.lang,
    selector: document.querySelector('#language-selector').value,
    manifest: document.querySelector('#pwa-manifest').getAttribute('href'),
    saved: localStorage.getItem('appLanguage')
  }))).toEqual({ language: 'en', document: 'en', selector: 'en', manifest: expect.stringContaining('manifest.json'), saved: 'en' });
});

test('a failed initial locale load keeps the English fallback consistent', async ({ page }) => {
  await setupPage(page);
  await page.evaluate(() => localStorage.setItem('appLanguage', 'fr'));
  await page.route('**/src/locales/fr.js', route => route.abort());
  await page.evaluate(() => import('/src/i18n.js'));
  expect(await page.evaluate(() => ({
    language: window.getCurrentLanguage(),
    document: document.documentElement.lang,
    selector: document.querySelector('#language-selector').value,
    manifest: document.querySelector('#pwa-manifest').getAttribute('href'),
    saved: localStorage.getItem('appLanguage')
  }))).toEqual({ language: 'en', document: 'en', selector: 'en', manifest: expect.stringContaining('manifest.json'), saved: 'en' });
});
