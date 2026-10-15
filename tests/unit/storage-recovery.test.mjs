import test from 'node:test';
import assert from 'node:assert/strict';
import { clearAppStorage } from '../../src/modules/StorageRecovery.js';

test('recovery completes when database deletion is denied or remains blocked', async context => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
    context.mock.timers.enable({ apis: ['setTimeout'] });
    try {
        globalThis.indexedDB = { deleteDatabase() { throw new Error('Storage denied'); } };
        await clearAppStorage();
        let request;
        globalThis.indexedDB = { deleteDatabase() { request = {}; return request; } };
        let completed = false;
        const completion = clearAppStorage().then(() => { completed = true; });
        await Promise.resolve();
        assert.equal(completed, false);
        assert.equal(typeof request.onsuccess, 'function');
        context.mock.timers.tick(3000);
        await completion;
        assert.equal(completed, true);
        const failed = clearAppStorage();
        request.onerror();
        await failed;
    } finally {
        if (original) Object.defineProperty(globalThis, 'indexedDB', original);
        else delete globalThis.indexedDB;
    }
});

test('recovery preserves sibling stores and waits for owned database deletion', async () => {
    const original = Object.fromEntries(['navigator', 'caches', 'indexedDB'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    const deleted = [];
    let request;
    let completed = false;
    try {
        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
            serviceWorker: { getRegistrations: async () => [
                { scope: 'https://example.test/Solar/', unregister: async () => deleted.push('owned worker') },
                { scope: 'https://example.test/Other/', unregister: async () => deleted.push('sibling worker') }
            ] }
        } });
        globalThis.caches = { keys: async () => ['space-voyage-vold', 'space-voyage-runtime-vold', 'other-cache'], delete: async key => deleted.push(key) };
        globalThis.indexedDB = { deleteDatabase(name) { deleted.push(name); request = {}; return request; } };
        const completion = clearAppStorage({ scope: 'https://example.test/Solar/', closeTextureCache: () => deleted.push('closed') }).then(() => { completed = true; });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(completed, false);
        request.onsuccess();
        await completion;
        assert.deepEqual(deleted.sort(), ['SolarSystemTextureCache', 'closed', 'owned worker', 'space-voyage-runtime-vold', 'space-voyage-vold'].sort());
    } finally {
        for (const [name, descriptor] of Object.entries(original)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});