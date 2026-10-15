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
  expect(appState.moonCount).toBeGreaterThan(10);
  expect(appState.dropdownOptions).toBeGreaterThan(70);
  expect(diagnostics).toEqual([]);
});

test('keeps core navigation and controls working', async ({ page }) => {
  test.setTimeout(300_000);
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
  // Evaluated in-page rather than via expect.poll: polling round-trips contend
  // with the render loop and can stall long enough to exhaust the test timeout,
  // even though the dropdown has already been restored.
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('#object-dropdown option'))
      .filter((option) => option.value).length > 70,
    null,
    { timeout: 15_000 }
  );

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
  await scale.click();
  await expect(scale).toHaveAttribute('aria-pressed', 'true');

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
  await page.locator('button[aria-label="Close help dialog"]').click();
  await expect(page.locator('#help-modal')).toHaveClass(/hidden/);

  await openModalFromButton(page, '#settings-button', '#settings-modal');
  await expect(page.locator('#settings-modal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#settings-modal')).toContainText(`v${APP_VERSION}`);
  await page.locator('button[aria-label="Close settings dialog"]').click();
  await expect(page.locator('#settings-modal')).toHaveClass(/hidden/);

  expect(diagnostics).toEqual([]);
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

test('announces service worker status and restores focus when dismissed', async ({ page }) => {
  await openApp(page);

  await page.locator('#help-button').focus();
  await page.evaluate(() => {
    navigator.serviceWorker.dispatchEvent(new MessageEvent('message', {
      data: { type: 'SW_INSTALL_FAILED', message: 'simulated install failure' }
    }));
  });

  const notification = page.locator('#update-notification');
  await expect(notification).not.toHaveClass(/hidden/);
  await expect(notification).toHaveAttribute('aria-hidden', 'false');
  await expect(notification.locator('.update-text')).toHaveText('Offline setup failed. Reload to try again.');
  await expect(page.locator('#update-reload')).toBeFocused();

  await page.locator('#update-dismiss').click();
  await expect(notification).toHaveClass(/hidden/);
  await expect(notification).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#help-button')).toBeFocused();

  const actionCount = await page.evaluate(async () => {
    const { serviceWorkerManager } = await import('/src/modules/ServiceWorkerManager.js');
    window.__notificationActionCount = 0;
    const showTestNotification = () => serviceWorkerManager._showNotification({
      message: 'Test',
      icon: '!',
      actionLabel: 'Run',
      onAction: () => { window.__notificationActionCount += 1; }
    });

    showTestNotification();
    document.getElementById('update-dismiss').click();
    showTestNotification();
    document.getElementById('update-reload').click();
    return window.__notificationActionCount;
  });
  expect(actionCount).toBe(1);
});

test('service worker update lifecycle activates once and records the new version', async ({ page }) => {
  await openApp(page);

  const lifecycle = await page.evaluate(async () => {
    const { ServiceWorkerManager } = await import('/src/modules/ServiceWorkerManager.js');
    let reloads = 0;
    let skipWaitingMessages = 0;
    const manager = new ServiceWorkerManager({ reloadPage: () => { reloads += 1; } });
    const installing = new EventTarget();
    installing.state = 'installing';
    const waiting = {
      postMessage(message) {
        if (message?.type === 'SKIP_WAITING') skipWaitingMessages += 1;
      }
    };
    const registration = new EventTarget();
    registration.installing = installing;
    registration.waiting = waiting;
    manager.registration = registration;
    manager.setupUpdateListener();

    registration.dispatchEvent(new Event('updatefound'));
    installing.state = 'installed';
    installing.dispatchEvent(new Event('statechange'));
    const notificationShown = !document.getElementById('update-notification').classList.contains('hidden');
    document.getElementById('update-reload').click();

    manager.handleMessage({ type: 'SW_ACTIVATED', version: 'test-next-version' });
    manager._reloadOnce(); // controllerchange signal
    manager.handleMessage({ type: 'SW_SKIP_WAITING_COMPLETE', version: 'test-next-version' });

    return {
      notificationShown,
      skipWaitingMessages,
      reloads,
      activeVersion: manager.activeVersion
    };
  });

  expect(lifecycle).toEqual({
    notificationShown: true,
    skipWaitingMessages: 1,
    reloads: 1,
    activeVersion: 'test-next-version'
  });
});

test('distinguishes unavailable persistent storage from exhausted cache quota', async ({ page }) => {
  await openApp(page);

  const unavailableStatus = await page.evaluate(async () => {
    const { TEXTURE_CACHE } = await import('/src/modules/TextureCache.js');
    await TEXTURE_CACHE.initPromise;
    const originalDb = TEXTURE_CACHE.db;
    const originalReason = TEXTURE_CACHE.unavailableReason;
    TEXTURE_CACHE.db = null;
    TEXTURE_CACHE.unavailableReason = new DOMException('blocked for test', 'SecurityError');
    await window.app.uiManager.updateStorageDiagnostics();
    const status = document.getElementById('storage-status');
    const result = { text: status.textContent, state: status.dataset.state };
    TEXTURE_CACHE.db = originalDb;
    TEXTURE_CACHE.unavailableReason = originalReason;
    return result;
  });

  expect(unavailableStatus.state).toBe('unavailable');
  expect(unavailableStatus.text).toContain('Persistent cache unavailable');

  await page.evaluate(async () => {
    const { ServiceWorkerManager } = await import('/src/modules/ServiceWorkerManager.js');
    const manager = new ServiceWorkerManager({ reloadPage: () => {} });
    manager.handleMessage({
      type: 'SW_QUOTA_EXCEEDED',
      storage: { usage: 100, quota: 100, persisted: false }
    });
  });

  const notification = page.locator('#update-notification');
  await expect(notification).not.toHaveClass(/hidden/);
  await expect(notification.locator('.update-text')).toContainText('Storage is full');
  await expect(page.locator('#canvas-container canvas')).toBeVisible();
});

test('service worker trims, retries, and reports actual quota exhaustion', async ({ page, context, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium' || testInfo.project.name !== 'desktop-chromium',
    'Origin quota override is a Chromium CDP capability tested once.');
  await openApp(page);

  const cdp = await context.newCDPSession(page);
  await cdp.send('Storage.overrideQuotaForOrigin', {
    origin: new URL(page.url()).origin,
    quotaSize: 1
  });

  const message = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No quota message received')), 15_000);
      const onMessage = (event) => {
        if (event.data?.type !== 'SW_QUOTA_EXCEEDED') return;
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('message', onMessage);
        resolve(event.data);
      };
      navigator.serviceWorker.addEventListener('message', onMessage);
      registration.active.postMessage({
        type: 'CACHE_URLS',
        urls: [`/robots.txt?quota-test=${Date.now()}`]
      });
    });
  });

  expect(message.type).toBe('SW_QUOTA_EXCEEDED');
  expect(message.storage).toMatchObject({ quota: expect.any(Number) });
  await expect(page.locator('#canvas-container canvas')).toBeVisible();
});