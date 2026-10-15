export async function clearAppStorage({ scope = new URL('../../', import.meta.url).href, closeTextureCache = () => {} } = {}) {
    const jobs = [];
    if (globalThis.navigator?.serviceWorker) {
        jobs.push(navigator.serviceWorker.getRegistrations().then(registrations =>
            Promise.all(registrations.filter(registration => registration.scope === scope)
                .map(registration => registration.unregister()))));
    }
    if (globalThis.caches) {
        jobs.push(caches.keys().then(keys => Promise.all(keys
            .filter(key => /^space-voyage-(?:v|runtime-v|images-v)/.test(key))
            .map(key => caches.delete(key)))));
    }
    if (globalThis.indexedDB) {
        jobs.push((async () => {
            closeTextureCache();
            await new Promise(resolve => {
                const request = indexedDB.deleteDatabase('SolarSystemTextureCache');
                const deadline = setTimeout(resolve, 3000);
                const finish = () => { clearTimeout(deadline); resolve(); };
                request.onsuccess = finish;
                request.onerror = finish;
            });
        })());
    }
    await Promise.allSettled(jobs);
}