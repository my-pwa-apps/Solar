import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });
test.describe.configure({ mode: 'serial' });

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

async function openApp(page, search = '') {
  await page.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    localStorage.setItem('orbitsVisible', 'all');
    localStorage.setItem('constellationsVisible', 'false');
    localStorage.setItem('labelsVisible', 'false');
    localStorage.setItem('scaleMode', 'educational');
    localStorage.setItem('bloomEnabled', 'false');
    localStorage.setItem('space_voyage_sound', 'false');
    localStorage.setItem('space_voyage_language', 'en');
  });

  await page.goto(`/${search}`);
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

async function setSlider(page, value) {
  await page.locator('#time-speed').evaluate((input, sliderValue) => {
    input.value = String(sliderValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function openAndCloseModal(page, buttonSelector, modalSelector, closeSelector) {
  await page.locator(buttonSelector).click({ force: true });
  await expect(page.locator(modalSelector)).not.toHaveClass(/hidden/);
  await page.locator(closeSelector).click({ force: true });
  await expect(page.locator(modalSelector)).toHaveClass(/hidden/);
}

test('full functionality: every navigation target and all main controls work', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Full functionality sweep runs once and includes a mobile viewport check.');
  test.setTimeout(900_000);

  const diagnostics = collectDiagnostics(page);
  await openApp(page, '?debug-performance');

  await expect(page.locator('#fps-counter')).not.toHaveClass(/hidden/);

  await page.goto('/');
  await page.waitForFunction(() => {
    const app = window.app;
    const loading = document.querySelector('#loading');
    return Boolean(app?._experienceStarted && loading?.classList.contains('hidden'));
  }, { timeout: 60_000 });

  await page.evaluate(() => {
    window.__fullNavigationFocusCalls = [];
    window.app.solarSystemModule.focusOnObject = (object) => {
      window.app.solarSystemModule.focusedObject = object;
      window.__fullNavigationFocusCalls.push(object?.userData?.name || object?.name || 'unnamed');
    };
  });

  const targets = await page.evaluate(() => Array.from(document.querySelectorAll('#object-dropdown option[value]'))
    .filter((option) => option.value)
    .map((option) => ({ value: option.value, label: option.textContent.trim() })));
  expect(targets.length).toBeGreaterThan(100);

  for (const target of targets) {
    await test.step(`navigate to ${target.label}`, async () => {
      const result = await page.evaluate((value) => {
        const object = window.app.findObjectByNavigationValue(value);
        if (!object) return { resolved: false, value };

        const expected = window.app.solarSystemModule.getObjectInfo(object);
        const dropdown = document.querySelector('#object-dropdown');
        dropdown.value = value;
        dropdown.dispatchEvent(new Event('change', { bubbles: true }));

        return {
          resolved: true,
          expected,
          actual: {
            name: document.querySelector('#object-name')?.textContent || '',
            type: document.querySelector('#object-type')?.textContent || '',
            description: document.querySelector('#object-description')?.textContent || '',
            infoVisible: !document.querySelector('#info-panel')?.classList.contains('hidden'),
            focusCalls: window.__fullNavigationFocusCalls.length
          }
        };
      }, target.value);

      expect(result.resolved, `Navigation target should resolve: ${target.value}`).toBe(true);
      expect(result.actual.infoVisible, `${target.value} should open the info panel`).toBe(true);
      expect(result.actual.name, `${target.value} should show the expected name`).toBe(result.expected.name);
      expect(result.actual.type, `${target.value} should show a type`).not.toBe('-');
      expect(result.actual.description.trim().length, `${target.value} should show a description`).toBeGreaterThan(0);
      expect(result.actual.focusCalls, `${target.value} should request a focus operation`).toBeGreaterThan(0);
    });
  }

  await test.step('search result navigation restores full navigation list', async () => {
    await page.locator('#nav-search').fill('jupiter');
    await expect(page.locator('#object-dropdown option')).toHaveCount(3);
    const result = await page.evaluate(() => {
      const dropdown = document.querySelector('#object-dropdown');
      dropdown.value = 'jupiter';
      dropdown.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        objectName: document.querySelector('#object-name')?.textContent || '',
        searchValue: document.querySelector('#nav-search')?.value || '',
        optionCount: Array.from(document.querySelectorAll('#object-dropdown option[value]'))
          .filter((option) => option.value).length
      };
    });

    expect(result).toMatchObject({
      searchValue: '',
      optionCount: targets.length
    });
  });

  await test.step('footer buttons and speed controls respond', async () => {
    const toggleIds = ['#toggle-constellations', '#toggle-details', '#toggle-scale'];
    for (const id of toggleIds) {
      const button = page.locator(id);
      const before = await button.getAttribute('aria-pressed');
      await button.click();
      await expect(button).not.toHaveAttribute('aria-pressed', before);
    }

    const orbitLabels = [];
    for (let index = 0; index < 6; index++) {
      await page.locator('#toggle-orbits').click();
      orbitLabels.push((await page.locator('#toggle-orbits .btn-text').textContent()).trim());
    }
    expect(new Set(orbitLabels).size).toBeGreaterThanOrEqual(4);

    await setSlider(page, 0);
    await expect(page.locator('#time-speed-label')).toHaveText('Paused');
    await setSlider(page, 100);
    await expect(page.locator('#time-speed-label')).toHaveText('100x');

    await page.locator('#speed-toggle').click();
    await expect(page.locator('#speed-control')).toHaveClass(/collapsed/);
    await page.locator('#speed-toggle').click();
    await expect(page.locator('#speed-control')).not.toHaveClass(/collapsed/);

    await page.locator('#reset-view').click();
    await expect(page.locator('#canvas-container canvas')).toBeVisible();
  });

  await test.step('modals, settings options, random discovery, and sound option work', async () => {
    await openAndCloseModal(page, '#help-button', '#help-modal', 'button[aria-label="Close help dialog"]');

    await page.locator('#settings-button').click();
    await expect(page.locator('#settings-modal')).not.toHaveClass(/hidden/);
    await expect(page.locator('#settings-modal')).toContainText('v2.10.302');

    const languages = await page.locator('#language-selector option').evaluateAll((options) =>
      options.map((option) => option.value)
    );
    expect(languages).toEqual(['en', 'nl', 'fr', 'de', 'es', 'pt']);

    await page.locator('#language-selector').selectOption('nl');
    await expect(page.locator('#language-selector')).toHaveValue('nl');
    await page.locator('#language-selector').selectOption('en');
    await expect(page.locator('#language-selector')).toHaveValue('en');

    const soundToggle = page.locator('#sound-toggle');
    const soundChecked = await soundToggle.isChecked();
    await soundToggle.setChecked(!soundChecked);
    await expect(soundToggle).toBeChecked({ checked: !soundChecked });

    await page.locator('button[aria-label="Close settings dialog"]').click({ force: true });
    await expect(page.locator('#settings-modal')).toHaveClass(/hidden/);

    await page.locator('#random-discovery').click();
    await expect(page.locator('#info-panel')).not.toHaveClass(/hidden/);
    await expect(page.locator('#object-name')).not.toHaveText(/select an object/i);
  });

  await test.step('mobile layout keeps critical controls reachable', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#object-dropdown').selectOption('earth');
    await expect(page.locator('#info-panel')).not.toHaveClass(/hidden/);

    const layout = await page.evaluate(() => {
      const close = document.querySelector('#info-panel .close-btn');
      const closeRect = close.getBoundingClientRect();
      const topAtClose = document.elementFromPoint(
        closeRect.left + closeRect.width / 2,
        closeRect.top + closeRect.height / 2
      );
      return {
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        closeClickable: close === topAtClose || close.contains(topAtClose),
        visibleFooterButtons: Array.from(document.querySelectorAll('#main-footer button'))
          .filter((button) => {
            const rect = button.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }).length
      };
    });

    expect(layout).toMatchObject({
      horizontalOverflow: false,
      closeClickable: true
    });
    expect(layout.visibleFooterButtons).toBeGreaterThanOrEqual(8);
  });

  expect(diagnostics).toEqual([]);
});