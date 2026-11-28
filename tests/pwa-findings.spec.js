import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from '@playwright/test';
import { clearPWAOwnedStorage } from '../src/modules/PWAStorage.js';

// ESLint directly depends on espree. Resolve it from ESLint's installation,
// not from a possibly non-existent hoisted dependency in the project root.
const require = createRequire(import.meta.url);
const eslintRequire = createRequire(require.resolve('eslint'));
const espree = eslintRequire('espree');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const swSource = await fs.readFile(path.join(repoRoot, 'sw.js'), 'utf8');
const cacheVersion = swSource.match(/const CACHE_VERSION = '([^']+)'/)[1];

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'PWA unit and static checks run once.');
});

function createServiceWorker({ cacheContents = {}, fetchResponse, putError } = {}) {
  const cacheData = new Map(
    Object.entries(cacheContents).map(([name, entries]) => [name, new Map(Object.entries(entries))])
  );
  const messages = [];
  const fetchCalls = [];
  const cacheDeletes = [];
  const handlers = new Map();
  const client = { postMessage: (message) => messages.push(message) };
  const cacheStorage = {
    async keys() {
      return [...cacheData.keys()];
    },
    async open(name) {
      if (!cacheData.has(name)) cacheData.set(name, new Map());
      const entries = cacheData.get(name);
      return {
        async match(key) {
          const cacheKey = typeof key === 'string' ? key : key.url;
          return entries.get(cacheKey)?.clone() || null;
        },
        async put(key, response) {
          if (putError) throw putError;
          const cacheKey = typeof key === 'string' ? key : key.url;
          entries.set(cacheKey, response.clone());
        },
        async add() {},
        async addAll() {},
        async keys() {
          return [...entries.keys()];
        },
        async delete(key) {
          return entries.delete(typeof key === 'string' ? key : key.url);
        }
      };
    },
    async delete(name) {
      cacheDeletes.push(name);
      return cacheData.delete(name);
    }
  };
  const self = {
    location: new URL('https://example.test/Solar/sw.js'),
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
    skipWaiting: async () => {},
    clients: {
      claim: async () => {},
      matchAll: async () => [client]
    }
  };
  const fetch = async (request) => {
    fetchCalls.push(request.url);
    return fetchResponse?.clone() || new Response('network response', { status: 200 });
  };
  vm.runInNewContext(swSource, {
    self,
    caches: cacheStorage,
    location: self.location,
    URL,
    Request,
    Response,
    Promise,
    Set,
    Map,
    Error,
    String,
    console: { warn() {}, error() {}, log() {} },
    fetch
  });
  return { handlers, cacheData, cacheDeletes, fetchCalls, messages, self };
}

async function dispatchFetch(worker, request) {
  let responsePromise;
  const waits = [];
  worker.handlers.get('fetch')({
    request,
    respondWith(promise) {
      responsePromise = promise;
    },
    waitUntil(promise) {
      waits.push(promise);
    }
  });
  const response = await responsePromise;
  await Promise.all(waits);
  return response;
}

test('activation only deletes caches with Space Voyage cache names', async () => {
  const worker = createServiceWorker({
    cacheContents: {
      'space-voyage-v0.0.1': {},
      [`space-voyage-v${cacheVersion}`]: {},
      'other-app-cache': {},
      'space-voyage-sibling-app': {}
    }
  });
  let activation;
  worker.handlers.get('activate')({ waitUntil(promise) { activation = promise; } });
  await activation;

  assert.deepEqual(worker.cacheDeletes, ['space-voyage-v0.0.1']);
  assert.deepEqual(
    [...worker.cacheData.keys()].sort(),
    ['other-app-cache', 'space-voyage-sibling-app', `space-voyage-v${cacheVersion}`].sort()
  );
});

test('fatal recovery clears only app caches, registration and database, awaiting completion', async () => {
  const registrationCalls = [];
  const makeRegistration = (scope, scriptURL, name) => ({
    scope,
    active: { scriptURL },
    async unregister() {
      registrationCalls.push(name);
      return true;
    }
  });
  const registrations = [
    makeRegistration('https://example.test/Solar/', 'https://example.test/Solar/sw.js', 'app'),
    makeRegistration('https://example.test/', 'https://example.test/sw.js', 'root'),
    makeRegistration('https://example.test/Solar/', 'https://example.test/other.js', 'same-scope-other-worker')
  ];
  const deletedCaches = [];
  const deletionRequests = [];
  const serviceWorkerContainer = { getRegistrations: async () => registrations };
  const cacheStorage = {
    async keys() {
      return ['space-voyage-v0.0.1', `space-voyage-runtime-v${cacheVersion}`, 'other-app-cache'];
    },
    async delete(name) {
      deletedCaches.push(name);
      return true;
    }
  };
  const databaseFactory = {
    deleteDatabase(name) {
      const request = {};
      deletionRequests.push({ name, request });
      return request;
    }
  };
  let settled = false;
  const resultPromise = clearPWAOwnedStorage({
    serviceWorkerContainer,
    cacheStorage,
    databaseFactory,
    documentBase: 'https://example.test/Solar/index.html'
  }).then((result) => {
    settled = true;
    return result;
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false, 'cleanup must wait for the IndexedDB delete result');
  assert.equal(deletionRequests[0].name, 'SolarSystemTextureCache');
  deletionRequests[0].request.onsuccess();
  assert.deepEqual(await resultPromise, []);
  assert.deepEqual(registrationCalls, ['app']);
  assert.deepEqual(deletedCaches.sort(), [`space-voyage-runtime-v${cacheVersion}`, 'space-voyage-v0.0.1'].sort());
});

test('fatal recovery reports blocked owned IndexedDB deletion', async () => {
  const result = await clearPWAOwnedStorage({
    databaseFactory: {
      deleteDatabase() {
        const request = {};
        queueMicrotask(() => { request.onblocked(); });
        return request;
      }
    },
    documentBase: 'https://example.test/Solar/index.html',
    serviceWorkerContainer: null,
    cacheStorage: null
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].store, 'IndexedDB');
  assert.match(result[0].message, /blocked/);
});

test('fatal recovery reports an owned service worker that was not unregistered', async () => {
  const result = await clearPWAOwnedStorage({
    serviceWorkerContainer: {
      async getRegistrations() {
        return [{
          scope: 'https://example.test/Solar/',
          active: { scriptURL: 'https://example.test/Solar/sw.js' },
          async unregister() { return false; }
        }];
      }
    },
    documentBase: 'https://example.test/Solar/index.html',
    cacheStorage: null,
    databaseFactory: null
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].store, 'service worker');
  assert.match(result[0].message, /not removed/);
});

test('fatal recovery waits for all cache deletions and reports failures', async () => {
  const deleted = [];
  const result = await clearPWAOwnedStorage({
    cacheStorage: {
      async keys() {
        return ['space-voyage-v1.2.3', 'space-voyage-runtime-v1.2.3', 'unrelated-cache'];
      },
      async delete(name) {
        deleted.push(name);
        if (name === 'space-voyage-v1.2.3') throw new Error('cache is in use');
        return true;
      }
    },
    documentBase: null,
    serviceWorkerContainer: null,
    databaseFactory: null
  });
  assert.deepEqual(deleted.sort(), ['space-voyage-runtime-v1.2.3', 'space-voyage-v1.2.3'].sort());
  assert.equal(result.length, 1);
  assert.equal(result[0].store, 'Cache Storage');
  assert.match(result[0].message, /cache is in use/);
});

test('an already-waiting update is shown accessibly and dismiss/reopen does not duplicate actions', async () => {
  const source = await fs.readFile(path.join(repoRoot, 'src/modules/ServiceWorkerManager.js'), 'utf8');
  const executable = source
    .replace("import { DEBUG } from './utils.js';", '')
    .replace('export class ServiceWorkerManager', 'class ServiceWorkerManager')
    .replace('export const serviceWorkerManager = new ServiceWorkerManager();', '');

  function fakeElement() {
    const listeners = new Map();
    const classes = new Set(['hidden']);
    const attributes = new Map([['aria-hidden', 'true']]);
    return {
      classList: {
        add: (value) => classes.add(value),
        remove: (value) => classes.delete(value),
        contains: (value) => classes.has(value)
      },
      setAttribute: (name, value) => attributes.set(name, value),
      getAttribute: (name) => attributes.get(name),
      addEventListener(type, callback) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(callback);
      },
      removeEventListener(type, callback) {
        listeners.get(type)?.delete(callback);
      },
      click() {
        for (const listener of [...(listeners.get('click') || [])]) listener();
      }
    };
  }
  const notification = fakeElement();
  const reload = fakeElement();
  const dismiss = fakeElement();
  const nodes = {
    'update-notification': notification,
    'update-reload': reload,
    'update-dismiss': dismiss
  };
  const messages = [];
  const registrationListeners = new Map();
  const serviceWorkerListeners = new Map();
  let reloadCount = 0;
  const registration = {
    waiting: { postMessage: (message) => messages.push(message.type) },
    addEventListener(type, listener) {
      if (!registrationListeners.has(type)) registrationListeners.set(type, []);
      registrationListeners.get(type).push(listener);
    }
  };
  const serviceWorker = {
    controller: {},
    register: async () => registration,
    addEventListener(type, listener) {
      serviceWorkerListeners.set(type, listener);
    }
  };
  const context = {
    DEBUG: { enabled: false },
    navigator: { serviceWorker },
    document: { getElementById: (id) => nodes[id] },
    window: { location: { reload() { reloadCount++; } } },
    console
  };
  const Manager = vm.runInNewContext(`${executable}\nServiceWorkerManager;`, context);
  const manager = new Manager();
  await manager.register();
  assert.equal(notification.classList.contains('hidden'), false);
  assert.equal(notification.getAttribute('aria-hidden'), 'false');
  assert.equal(registrationListeners.get('updatefound').length, 1);

  dismiss.click();
  assert.equal(notification.classList.contains('hidden'), true);
  assert.equal(notification.getAttribute('aria-hidden'), 'true');
  await manager.register();
  assert.equal(notification.classList.contains('hidden'), false);
  assert.equal(notification.getAttribute('aria-hidden'), 'false');
  assert.equal(registrationListeners.get('updatefound').length, 1);
  reload.click();
  assert.deepEqual(messages, ['SKIP_WAITING']);
  serviceWorkerListeners.get('message')({ data: { type: 'SW_SKIP_WAITING_COMPLETE' } });
  assert.equal(reloadCount, 0, 'skipWaiting acknowledgement must not reload under the old controller');
  serviceWorkerListeners.get('controllerchange')();
  serviceWorkerListeners.get('controllerchange')();
  assert.equal(reloadCount, 1, 'controllerchange reloads exactly once');
});

test('cached shell and modules remain from the installed worker release', async () => {
  const worker = createServiceWorker({
    cacheContents: {
      [`space-voyage-v${cacheVersion}`]: {
        'https://example.test/Solar/': new Response('old installed shell'),
        'https://example.test/Solar/src/main.js': new Response('old installed module')
      },
      'unrelated-cache': {
        'https://example.test/Solar/': new Response('unrelated shell')
      }
    },
    fetchResponse: new Response('new network version')
  });
  const shell = await dispatchFetch(worker, {
    url: 'https://example.test/Solar/',
    mode: 'navigate',
    destination: 'document',
    method: 'GET'
  });
  const module = await dispatchFetch(worker, {
    url: 'https://example.test/Solar/src/main.js?v=0.0.0',
    mode: 'cors',
    destination: 'script',
    method: 'GET'
  });

  assert.equal(await shell.text(), 'old installed shell');
  assert.equal(await module.text(), 'old installed module');
  assert.deepEqual(worker.fetchCalls, []);
});

test('a same-path entry in an unrelated cache is never served to the app', async () => {
  const worker = createServiceWorker({
    cacheContents: {
      'other-app-cache': {
        'https://example.test/Solar/': new Response('unrelated shell')
      }
    },
    fetchResponse: new Response('network shell')
  });
  const response = await dispatchFetch(worker, {
    url: 'https://example.test/Solar/',
    mode: 'navigate',
    destination: 'document',
    method: 'GET'
  });
  assert.equal(await response.text(), 'network shell');
  assert.deepEqual(worker.fetchCalls, ['https://example.test/Solar/']);
});

test('network responses survive cache write failures for navigation, script and image requests', async () => {
  for (const [url, mode, destination] of [
    ['https://example.test/Solar/next.html', 'navigate', 'document'],
    ['https://example.test/Solar/new.js', 'cors', 'script'],
    ['https://example.test/Solar/new.webp', 'no-cors', 'image']
  ]) {
    const worker = createServiceWorker({
      putError: Object.assign(new Error('quota exceeded'), { name: 'QuotaExceededError' }),
      fetchResponse: new Response(`network:${destination}`, { status: 200 })
    });
    const response = await dispatchFetch(worker, { url, mode, destination, method: 'GET' });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), `network:${destination}`);
    assert.deepEqual(worker.fetchCalls, [url]);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(worker.messages.some((message) => message.type === 'SW_CACHE_WRITE_FAILED'), true);
  }
});

function getImports(ast) {
  const imports = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportAllDeclaration') {
      if (node.source) imports.push(node.source.value);
    } else if (node.type === 'ImportExpression') {
      assert.equal(node.source.type, 'Literal', 'offline graph requires literal dynamic imports');
      imports.push(node.source.value);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'parent') continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(ast);
  return imports;
}

function resolveImport(specifier, importer, rootUrl, importMap) {
  let mapped = specifier;
  let resolutionBase = new URL(rootUrl);
  const imports = importMap.imports || {};
  if (Object.hasOwn(imports, specifier)) {
    mapped = imports[specifier];
  } else {
    const prefix = Object.keys(imports)
      .filter((key) => key.endsWith('/') && specifier.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];
    if (prefix) mapped = imports[prefix] + specifier.slice(prefix.length);
  }
  if (mapped === specifier && !specifier.startsWith('.') && !specifier.startsWith('/')) {
    throw new Error(`Unmapped bare import ${specifier} in ${importer}`);
  }
  if (!Object.hasOwn(imports, specifier) && mapped === specifier) {
    resolutionBase = new URL(importer, rootUrl);
  }
  const resolved = new URL(mapped, resolutionBase);
  assert.equal(resolved.origin, new URL(rootUrl).origin, `external module is not offline-cached: ${specifier}`);
  return decodeURIComponent(resolved.pathname).replace(/^\/+/, '');
}

async function walkModuleGraph({ sources, entries, rootUrl, importMap }) {
  const visited = new Set();
  const queue = [...entries];
  while (queue.length) {
    const file = path.posix.normalize(queue.pop());
    if (visited.has(file)) continue;
    visited.add(file);
    const source = sources ? sources.get(file) : await fs.readFile(path.join(repoRoot, file), 'utf8');
    const ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
    for (const specifier of getImports(ast)) {
      queue.push(resolveImport(specifier, file, rootUrl, importMap));
    }
  }
  return visited;
}

test('precache dependency closure walks app entries, dynamic imports and transitive addons', async () => {
  const html = await fs.readFile(path.join(repoRoot, 'index.html'), 'utf8');
  const sw = await fs.readFile(path.join(repoRoot, 'sw.js'), 'utf8');
  const importMapMatch = html.match(/<script\s+type="importmap">([\s\S]*?)<\/script>/i);
  assert.ok(importMapMatch, 'index.html should define the module import map');
  const importMap = JSON.parse(importMapMatch[1]);
  const entries = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.m?js)(?:\?[^"']*)?["'][^>]*>/gi)]
    .map((match) => new URL(match[1], 'https://example.test/').pathname.replace(/^\/+/, ''));
  const reached = await walkModuleGraph({
    entries,
    rootUrl: 'https://example.test/',
    importMap
  });
  const coreMatch = sw.match(/const CORE_CACHE_FILES = \[([\s\S]*?)\];/);
  assert.ok(coreMatch);
  const precached = new Set([...coreMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1].replace(/^\.\//, '')));
  const missing = [...reached].filter((file) => !precached.has(file));
  assert.deepEqual(missing, []);

  const fixture = new Map([
    ['src/bootstrap/start.js', "import './feature.js'; import('./lazy.js');"],
    ['src/bootstrap/feature.js', "export { value } from 'three/addons/example.js';"],
    ['src/bootstrap/lazy.js', "import '../new-module.js';"],
    ['src/new-module.js', 'export const value = 1;'],
    ['vendor/three/examples/jsm/example.js', "import '../../build/three.module.js';"],
    ['vendor/three/build/three.module.js', "import './three.core.js';"],
    ['vendor/three/build/three.core.js', 'export const core = true;']
  ]);
  const fixtureGraph = await walkModuleGraph({
    sources: fixture,
    entries: ['src/bootstrap/start.js'],
    rootUrl: 'https://example.test/',
    importMap: {
      imports: {
        'three/addons/': './vendor/three/examples/jsm/',
        three: './vendor/three/build/three.module.js'
      }
    }
  });
  const deliberatelyIncompleteManifest = new Set(['src/bootstrap/start.js']);
  const fixtureMissing = [...fixtureGraph].filter((file) => !deliberatelyIncompleteManifest.has(file));
  assert.ok(fixtureMissing.includes('src/bootstrap/lazy.js'));
  assert.ok(fixtureMissing.includes('src/new-module.js'));
  assert.ok(fixtureMissing.includes('vendor/three/examples/jsm/example.js'));
  assert.ok(
    fixtureMissing.includes('vendor/three/build/three.core.js'),
    `fixture graph: ${[...fixtureGraph].join(', ')}`
  );
});
