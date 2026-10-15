import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { expect, test } from '@playwright/test';

test('real workers preserve release consistency, failed updates and sibling storage', async ({ browser }, testInfo) => {
  test.skip(!['desktop-chromium', 'mobile-chromium'].includes(testInfo.project.name), 'Worker lifecycle is covered in Chromium.');
  const workerSource = await readFile('sw.js', 'utf8');
  const root = resolve('.');
  let release = 'one';
  let failedEngine = true;
  let navigationUnavailable = false;
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    response.setHeader('Cache-Control', 'no-store');
    try {
      if (pathname === '/sw.js') {
        response.setHeader('Content-Type', 'text/javascript');
        response.end(workerSource
          .replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = '${release}';`)
          .replace(/const CORE_CACHE_FILES = \[[\s\S]*?\];/, `const CORE_CACHE_FILES = ['./', './index.html', './src/main.js', './src/modules/ServiceWorkerManager.js', './src/modules/utils.js'];`)
          .replace(/const ASSET_CACHE_FILES = \[[\s\S]*?\];/, `const ASSET_CACHE_FILES = ['./optional-missing.webp'];`));
      } else if (pathname === '/' || pathname === '/index.html') {
        response.setHeader('Content-Type', 'text/html');
        if (navigationUnavailable === 'stall') return;
        if (navigationUnavailable) { response.writeHead(503); response.end('Unavailable'); return; }
        response.end(`<!doctype html><html data-shell="${release}"><head><script type="importmap">{"imports":{"three":"/vendor/three@0.183.2/build/three.module.js"}}</script></head><body>
          <div id="update-notification" class="hidden" aria-hidden="true"><span class="update-text"></span><span class="update-icon"></span><button id="update-reload">Update</button><button id="update-dismiss">Dismiss</button></div>
          <script type="module" src="/src/main.js?v=${release}"></script></body></html>`);
      } else if (pathname === '/src/main.js') {
        response.setHeader('Content-Type', 'text/javascript');
        response.end(`import { serviceWorkerManager } from '/src/modules/ServiceWorkerManager.js'; document.documentElement.dataset.module = '${release}'; window.manager = serviceWorkerManager; serviceWorkerManager.init();`);
      } else if (pathname === '/optional-missing.webp' || (failedEngine && pathname.endsWith('/three.core.js'))) {
        response.writeHead(503); response.end('Injected failure');
      } else if (pathname === '/sibling/sw.js') {
        response.setHeader('Content-Type', 'text/javascript');
        response.end("self.addEventListener('install', () => self.skipWaiting());");
      } else {
        const target = resolve(root, `.${pathname}`);
        if (!target.startsWith(`${root}\\`) && !target.startsWith(`${root}/`)) { response.writeHead(403); response.end(); return; }
        response.setHeader('Content-Type', extname(target) === '.js' ? 'text/javascript' : 'application/octet-stream');
        response.end(await readFile(target));
      }
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const url = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    let page = await context.newPage();
    await page.goto(`${url}/index.html`);
    const failure = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const installing = registration.installing;
      if (installing?.state !== 'redundant') await new Promise(resolveState => {
        installing.addEventListener('statechange', () => { if (installing.state === 'redundant') resolveState(); });
      });
      return { active: !!registration.active, state: installing?.state };
    });
    expect(failure).toEqual({ active: false, state: 'redundant' });
    failedEngine = false;
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller && document.documentElement.dataset.module === 'one');
    await page.evaluate(async () => {
      const sibling = await navigator.serviceWorker.register('/sibling/sw.js', { scope: '/sibling/' });
      if (!sibling.active) await new Promise(resolveState => {
        sibling.installing.addEventListener('statechange', event => { if (event.target.state === 'activated') resolveState(); });
      });
      await (await caches.open('sibling-offline')).put('/sentinel', new Response('preserve'));
      await new Promise((resolveDb, rejectDb) => {
        const request = indexedDB.open('SiblingData', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('data');
        request.onerror = () => rejectDb(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('data', 'readwrite');
          transaction.objectStore('data').put('preserve', 'sentinel');
          transaction.oncomplete = () => { database.close(); resolveDb(); };
        };
      });
    });

    release = 'broken';
    failedEngine = true;
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/');
      await registration.update();
      const installing = registration.installing;
      if (installing && installing.state !== 'redundant') await new Promise(resolveState => installing.addEventListener('statechange', () => { if (installing.state === 'redundant') resolveState(); }));
    });
    await page.reload();
    expect(await page.evaluate(() => ({ shell: document.documentElement.dataset.shell, module: document.documentElement.dataset.module }))).toEqual({ shell: 'one', module: 'one' });

    const keeper = await context.newPage();
    await keeper.goto(url);
    await keeper.waitForFunction(() => document.documentElement.dataset.module === 'one');
    release = 'two';
    failedEngine = false;
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration('/')).update(); });
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration('/'))?.waiting);
    await page.close();
    page = await context.newPage();
    await page.goto(url);
    await expect(page.locator('#update-notification')).toHaveAttribute('aria-hidden', 'false');
    expect(await page.evaluate(() => ({ shell: document.documentElement.dataset.shell, module: document.documentElement.dataset.module }))).toEqual({ shell: 'one', module: 'one' });
    let navigations = 0;
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
    await page.locator('#update-reload').click();
    await page.waitForFunction(() => document.documentElement.dataset.module === 'two');
    expect(await page.locator('html').getAttribute('data-shell')).toBe('two');
    expect(navigations).toBe(1);
    await keeper.close();

    navigationUnavailable = true;
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.module === 'two');
    navigationUnavailable = 'stall';
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.module === 'two');
    await context.setOffline(true);
    await page.close();
    page = await context.newPage();
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.module === 'two');
    expect(await page.locator('html').getAttribute('data-shell')).toBe('two');
    await context.setOffline(false);
    navigationUnavailable = false;
    release = 'one';
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration('/')).update(); });
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration('/'))?.waiting);
    await expect(page.locator('#update-notification')).toHaveAttribute('aria-hidden', 'false');
    await page.locator('#update-reload').click();
    await page.waitForFunction(() => document.documentElement.dataset.module === 'one');
    expect(await page.locator('html').getAttribute('data-shell')).toBe('one');
    const survivors = await page.evaluate(async () => {
      const { clearAppStorage } = await import('/src/modules/StorageRecovery.js');
      await clearAppStorage();
      const registrations = await navigator.serviceWorker.getRegistrations();
      const databaseValue = await new Promise(resolveDb => {
        const request = indexedDB.open('SiblingData');
        request.onsuccess = () => {
          const database = request.result;
          const get = database.transaction('data').objectStore('data').get('sentinel');
          get.onsuccess = () => { database.close(); resolveDb(get.result); };
        };
      });
      return { scopes: registrations.map(registration => new URL(registration.scope).pathname), cache: await (await caches.open('sibling-offline')).match('/sentinel').then(response => response.text()), databaseValue };
    });
    expect(survivors).toEqual({ scopes: ['/sibling/'], cache: 'preserve', databaseValue: 'preserve' });
  } finally {
    await context.close();
    await new Promise(resolveClose => server.close(resolveClose));
  }
});