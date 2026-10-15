import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
const version = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url))).version;
const origin = 'https://example.test';
const base = `${origin}/Solar/`;

function worker({ rejected = '', networkStatus = 200 } = {}) {
    const handlers = {};
    const stores = new Map();
    const messages = [];
    const requests = [];
    const open = async (name) => {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name);
        return {
            async addAll(urls) {
                if (urls.some(url => url.endsWith(rejected)) && rejected) throw new Error('Download failed');
                for (const url of urls) store.set(new URL(url, base).href, `release ${version}: ${url}`);
            },
            async add(url) {
                if (rejected && url.endsWith(rejected)) throw new Error('Media failed');
                store.set(new URL(url, base).href, url);
            },
            async match(key) {
                const value = store.get(new URL(key.url || key, base).href);
                return value === undefined ? undefined : new Response(value);
            },
            async put(key, response) { store.set(key, await response.text()); },
            async keys() { return [...store.keys()]; },
            async delete(key) { return store.delete(key); }
        };
    };
    vm.runInNewContext(source, {
        URL, Response, AbortController, setTimeout, clearTimeout,
        console: { error() {}, warn() {} }, location: { origin },
        self: {
            location: `${base}sw.js`, navigator: {},
            addEventListener(type, handler) { handlers[type] = handler; },
            clients: { claim: async () => {}, matchAll: async () => [{ postMessage(message) { messages.push(message); } }] }
        },
        caches: { open, keys: async () => [...stores.keys()], delete: async name => stores.delete(name) },
        fetch: async (request) => { requests.push(request); return new Response('network', { status: networkStatus }); }
    });
    return {
        stores, messages, requests,
        async dispatch(type) {
            let completion;
            handlers[type]({ waitUntil(promise) { completion = promise; } });
            await completion;
        },
        async fetch(path, destination = 'script') {
            let response;
            handlers.fetch({
                request: { url: new URL(path, base).href, method: 'GET', destination, mode: destination === 'document' ? 'navigate' : 'cors' },
                respondWith(promise) { response = promise; }, waitUntil() {}
            });
            return response;
        }
    };
}

test('required engine failure rejects installation without a partial shell', async () => {
    const runtime = worker({ rejected: 'three.core.js' });
    await assert.rejects(runtime.dispatch('install'), /Download failed/);
    assert.equal(runtime.stores.get(`space-voyage-v${version}`).size, 0);
    assert.ok(runtime.messages.some(message => message.type === 'SW_INSTALL_FAILED'));
    assert.ok(!runtime.messages.some(message => message.type === 'SW_INSTALLED'));
});

test('optional media failure still permits installation', async () => {
    const runtime = worker({ rejected: 'sun.webp' });
    await runtime.dispatch('install');
    assert.ok(runtime.messages.some(message => message.type === 'SW_INSTALLED'));
});

test('activation preserves sibling caches but removes owned previous releases', async () => {
    const runtime = worker();
    runtime.stores.set('another-app-offline', new Map([['sentinel', 'keep']]));
    runtime.stores.set('space-voyage-vold', new Map());
    await runtime.dispatch('install');
    await runtime.dispatch('activate');
    assert.equal(runtime.stores.get('another-app-offline').get('sentinel'), 'keep');
    assert.ok(!runtime.stores.has('space-voyage-vold'));
});

test('controlled navigation and modules stay in the active release during host failure', async () => {
    const runtime = worker({ networkStatus: 503 });
    runtime.stores.set('space-voyage-vold', new Map([[`${base}src/main.js`, 'old module']]));
    await runtime.dispatch('install');
    const shell = await runtime.fetch('?planet=earth', 'document');
    assert.equal(shell.status, 200);
    assert.match(await shell.text(), new RegExp(`release ${version}`));
    const module = await runtime.fetch('src/main.js?v=next');
    assert.match(await module.text(), new RegExp(`release ${version}`));
    assert.equal(runtime.requests.length, 0);
});

test('missing mandatory modules fail closed rather than mixing releases', async () => {
    const runtime = worker();
    await runtime.dispatch('install');
    runtime.stores.get(`space-voyage-v${version}`).delete(`${base}src/main.js`);
    assert.equal((await runtime.fetch('src/main.js')).type, 'error');
    assert.equal(runtime.requests.length, 0);
});