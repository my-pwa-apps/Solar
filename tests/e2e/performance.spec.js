import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const BUDGETS = {
  desktop: {
    firstFrameMs: 60_000,
    transferBytes: 25 * 1024 * 1024,
    longTaskTotalMs: 30_000
  },
  mobile: {
    firstFrameMs: 90_000,
    transferBytes: 25 * 1024 * 1024,
    longTaskTotalMs: 45_000
  }
};

test('cold load stays within the startup performance budget', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('firefox') || testInfo.project.name.includes('webkit'),
    'Startup budgets are calibrated for Chromium.');

  const profile = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
  const budget = BUDGETS[profile];

  await page.addInitScript(() => {
    localStorage.setItem('space_voyage_onboarding_complete', 'true');
    localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
    window.__longTasks = [];
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__longTasks.push({ startTime: entry.startTime, duration: entry.duration });
          }
        });
        observer.observe({ type: 'longtask', buffered: true });
      } catch {
        // Long Task API is optional; the artifact records an empty list when unavailable.
      }
    }
  });

  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto('/');
  await page.waitForFunction(() => performance.getEntriesByName('first-frame').length > 0, null, {
    timeout: budget.firstFrameMs
  });

  const browserMetrics = await page.evaluate(() => {
    const mark = (name) => performance.getEntriesByName(name, 'mark')[0]?.startTime ?? null;
    const cutoff = mark('first-frame');
    const longTasks = (window.__longTasks || []).filter(task => task.startTime < cutoff);
    const resources = performance.getEntriesByType('resource').filter(entry => entry.responseEnd <= cutoff);
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      marks: {
        appStart: mark('app-start'),
        experienceStart: mark('experience-start'),
        loadingHidden: mark('loading-hidden'),
        firstFrame: mark('first-frame')
      },
      firstFrameMs: performance.getEntriesByName('navigation-to-first-frame', 'measure')[0]?.duration ?? null,
      appToFirstFrameMs: performance.getEntriesByName('app-to-first-frame', 'measure')[0]?.duration ?? null,
      transferBytes: (navigation?.transferSize || 0) + resources.reduce((total, entry) => total + entry.transferSize, 0),
      renderErrors: performance.getEntriesByName('render-error').length,
      longTaskCount: longTasks.length,
      longTaskTotalMs: longTasks.reduce((total, task) => total + Math.min(task.duration, cutoff - task.startTime), 0)
    };
  });
  const pixels = await page.evaluate(() => {
    const manager = window.app.sceneManager;
    if (manager.composer) manager.composer.render();
    else manager.renderer.render(manager.scene, manager.camera);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    context.drawImage(manager.renderer.domElement, 0, 0, 64, 64);
    const data = context.getImageData(0, 0, 64, 64).data;
    let nonblack = 0;
    const colors = new Set();
    for (let index = 0; index < data.length; index += 4) {
      if (data[index] + data[index + 1] + data[index + 2] > 30) nonblack++;
      colors.add(`${data[index]},${data[index + 1]},${data[index + 2]}`);
    }
    return { nonblack, colors: colors.size };
  });

  const result = {
    project: testInfo.project.name,
    recordedAt: new Date().toISOString(),
    ...browserMetrics,
    measurementWindow: 'navigation start through first successful render',
    transferScope: 'completed page resources including navigation; excludes worker precache and unfinished transfers',
    pixels,
    budgets: budget
  };
  const artifact = JSON.stringify(result, null, 2);
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/performance-${testInfo.project.name}.json`, artifact);
  await testInfo.attach('performance-budget', { body: artifact, contentType: 'application/json' });

  expect(result.firstFrameMs).not.toBeNull();
  expect(errors).toEqual([]);
  expect(result.renderErrors).toBe(0);
  expect(pixels.nonblack).toBeGreaterThan(10);
  expect(pixels.colors).toBeGreaterThan(10);
  expect(result.longTaskTotalMs).toBeLessThanOrEqual(result.firstFrameMs);
  expect(result.firstFrameMs).toBeLessThan(budget.firstFrameMs);
  expect(result.transferBytes).toBeLessThan(budget.transferBytes);
  expect(result.longTaskTotalMs).toBeLessThan(budget.longTaskTotalMs);
});

test('navigation timing includes a delayed blocking translation script', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'The timing boundary regression runs once.');
  const context = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('space_voyage_onboarding_complete', 'true'));
    await page.route('**/src/i18n.js*', async route => {
      const response = await route.fetch();
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ response });
    });
    await page.goto('http://127.0.0.1:4173/');
    await page.waitForFunction(() => performance.getEntriesByName('first-frame').length > 0);
    const timing = await page.evaluate(() => ({
      appStart: performance.getEntriesByName('app-start')[0].startTime,
      firstFrame: performance.getEntriesByName('first-frame')[0].startTime,
      navigation: performance.getEntriesByName('navigation-to-first-frame')[0].duration,
      app: performance.getEntriesByName('app-to-first-frame')[0].duration,
      script: performance.getEntriesByType('resource').find(entry => entry.name.includes('/src/i18n.js')).duration
    }));
    expect(timing.script).toBeGreaterThanOrEqual(500);
    expect(timing.appStart).toBeGreaterThanOrEqual(timing.script);
    expect(timing.navigation).toBe(timing.firstFrame);
    expect(timing.navigation - timing.app).toBeCloseTo(timing.appStart, 1);
  } finally {
    await context.close();
  }
});