const APP_CACHE_NAME_PATTERN = /^space-voyage-(?:v|runtime-v|images-v)\d+(?:\.\d+)*$/;
const APP_DATABASE_NAMES = ['SolarSystemTextureCache'];

function workerScriptUrl(documentBase) {
    return new URL('./sw.js', documentBase).href;
}

function appScopeUrl(documentBase) {
    return new URL('./', documentBase).href;
}

function ownsRegistration(registration, documentBase) {
    const expectedScope = appScopeUrl(documentBase);
    const expectedScript = workerScriptUrl(documentBase);
    const workers = [registration.active, registration.installing, registration.waiting].filter(Boolean);
    return registration.scope === expectedScope &&
        workers.some((worker) => worker.scriptURL === expectedScript);
}

function deleteDatabase(databaseFactory, name) {
    return new Promise((resolve, reject) => {
        let request;
        try {
            request = databaseFactory.deleteDatabase(name);
        } catch (error) {
            reject(error);
            return;
        }

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Database deletion failed'));
        request.onblocked = () => reject(new Error('Database deletion was blocked by an open connection'));
    });
}

async function awaitAll(operations) {
    const results = await Promise.allSettled(operations);
    const errors = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason && result.reason.message ? result.reason.message : String(result.reason));
    if (errors.length) throw new Error(errors.join('; '));
}

/**
 * Clear only storage explicitly owned by this app installation.
 * Returns per-store failures so the recovery UI can report incomplete cleanup.
 */
export async function clearPWAOwnedStorage({
    serviceWorkerContainer = globalThis.navigator?.serviceWorker,
    cacheStorage = globalThis.caches,
    databaseFactory = globalThis.indexedDB,
    documentBase = globalThis.document?.baseURI
} = {}) {
    const failures = [];
    const attempt = async (store, operation) => {
        try {
            await operation();
        } catch (error) {
            failures.push({
                store,
                message: error && error.message ? error.message : String(error)
            });
        }
    };
    const jobs = [];

    if (serviceWorkerContainer && documentBase) {
        jobs.push(attempt('service worker', async () => {
            const registrations = await serviceWorkerContainer.getRegistrations();
            await awaitAll(
                registrations
                    .filter((registration) => ownsRegistration(registration, documentBase))
                    .map(async (registration) => {
                        if (!await registration.unregister()) {
                            throw new Error('Owned service worker registration was not removed');
                        }
                    })
            );
        }));
    }

    if (cacheStorage) {
        jobs.push(attempt('Cache Storage', async () => {
            const names = await cacheStorage.keys();
            await awaitAll(
                names
                    .filter((name) => APP_CACHE_NAME_PATTERN.test(name))
                    .map((name) => cacheStorage.delete(name))
            );
        }));
    }

    if (databaseFactory?.deleteDatabase) {
        for (const name of APP_DATABASE_NAMES) {
            jobs.push(attempt('IndexedDB', () => deleteDatabase(databaseFactory, name)));
        }
    }

    await Promise.all(jobs);
    return failures;
}
