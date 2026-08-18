// ===========================
// TEXTURE CACHE SYSTEM
// ===========================
import { DEBUG, CONFIG, APP_VERSION } from './utils.js';

export class TextureCache {
 constructor() {
 this.cache = new Map();
 this.maxMemoryCacheSize = 200; // Evict oldest entries beyond this limit
 this.dbName = 'SolarSystemTextureCache';
 this.dbVersion = 1;
 this.storeName = 'textures';
 this.textureVersion = APP_VERSION; // Single source of truth — stays in sync with APP_VERSION in utils.js
 this.db = null;
 this.unavailableReason = null; // Set when IndexedDB cannot be opened; memory cache still works
 this.initPromise = this.initDB();
 }

 /**
  * Opens the persistent store. Never rejects: IndexedDB is unavailable in Safari
  * private mode, in sandboxed iframes and under some enterprise policies, and a
  * rejected `initPromise` that nobody awaits surfaces as an unhandled rejection
  * on every boot. Failure degrades to the in-memory cache only, and is recorded
  * on `unavailableReason` so it can be diagnosed instead of guessed at.
  */
 async initDB() {
 this.unavailableReason = null;
 return new Promise((resolve) => {
 let request;
 try {
 request = indexedDB.open(this.dbName, this.dbVersion);
 } catch (error) {
 this.unavailableReason = error;
 if (DEBUG && DEBUG.enabled) console.warn('[Cache] IndexedDB unavailable:', error);
 resolve(null);
 return;
 }

 const fail = (reason) => {
 this.unavailableReason = reason;
 if (DEBUG && DEBUG.enabled) console.warn('[Cache] IndexedDB unavailable:', reason);
 resolve(null);
 };

 request.onerror = () => fail(request.error);
 request.onblocked = () => fail(new Error('IndexedDB blocked by another tab'));
 request.onsuccess = () => {
 this.db = request.result;
 this._checkVersion().then(() => resolve(this.db)).catch(() => resolve(this.db));
 };

 request.onupgradeneeded = (event) => {
 const db = event.target.result;
 if (!db.objectStoreNames.contains(this.storeName)) {
 db.createObjectStore(this.storeName);
 }
 };
 });
 }

 async _checkVersion() {
 try {
 const tx = this.db.transaction([this.storeName], 'readonly');
 const store = tx.objectStore(this.storeName);
 const stored = await new Promise((resolve) => {
 const req = store.get('__texture_cache_version__');
 req.onsuccess = () => resolve(req.result);
 req.onerror = () => resolve(null);
 });
 if (stored !== this.textureVersion) {
 if (DEBUG && DEBUG.enabled) console.log(`[Cache] Texture version changed (${stored} → ${this.textureVersion}), clearing stale textures`);
 // Clear and re-stamp in ONE transaction. Split across two, a tab closed in
 // between leaves an empty store still tagged with the old version, so the
 // next boot clears an already-empty store and re-downloads everything again.
 const writeTx = this.db.transaction([this.storeName], 'readwrite');
 const writeStore = writeTx.objectStore(this.storeName);
 writeStore.clear();
 writeStore.put(this.textureVersion, '__texture_cache_version__');
 await new Promise((resolve) => {
 writeTx.oncomplete = () => resolve();
 writeTx.onerror = () => resolve();
 writeTx.onabort = () => resolve();
 });
 this.cache.clear();
 }
 } catch (e) {
 if (DEBUG && DEBUG.enabled) console.warn('[Cache] Version check error:', e);
 }
 }

 async get(key) {
 // Check memory cache first
 if (this.cache.has(key)) {
 if (DEBUG && DEBUG.PERFORMANCE) console.log(`🗄️ Cache HIT (memory): ${key}`);
 return this.cache.get(key);
 }

 // Check IndexedDB
 try {
 await this.initPromise;
 if (!this.db) return null;
 const tx = this.db.transaction([this.storeName], 'readonly');
 const store = tx.objectStore(this.storeName);
 
 return new Promise((resolve) => {
 const request = store.get(key);
 request.onsuccess = () => {
 if (request.result) {
 if (DEBUG && DEBUG.PERFORMANCE) console.log(`🗄️ Cache HIT (IndexedDB): ${key}`);
 this.cache.set(key, request.result); // Promote to memory cache
 resolve(request.result);
 } else {
 if (DEBUG && DEBUG.PERFORMANCE) console.log(`❌ Cache MISS: ${key}`);
 resolve(null);
 }
 };
 // A read failure is a cache miss, not an application error. Rejecting here
 // escaped the surrounding try/catch (the promise is returned, not awaited)
 // and surfaced as an unhandled rejection in every texture-loading path.
 request.onerror = () => {
 if (DEBUG && DEBUG.enabled) console.warn('Cache read error:', request.error);
 resolve(null);
 };
 });
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.warn('Cache read error:', error);
 return null;
 }
 }

 async set(key, dataURL) {
 // Evict oldest entries if memory cache is at capacity
 if (this.cache.size >= this.maxMemoryCacheSize && !this.cache.has(key)) {
 const oldest = this.cache.keys().next().value;
 this.cache.delete(oldest);
 }
 // Set in memory cache
 this.cache.set(key, dataURL);

 // Set in IndexedDB for persistence
 try {
 await this.initPromise;
 if (!this.db) return;
 const tx = this.db.transaction([this.storeName], 'readwrite');
 const store = tx.objectStore(this.storeName);
 
 return new Promise((resolve) => {
 const request = store.put(dataURL, key);
 request.onsuccess = () => {
 if (DEBUG && DEBUG.PERFORMANCE) console.log(`💾 Cache SET: ${key} (${typeof dataURL === 'string' ? (dataURL.length / 1024).toFixed(0) + 'KB' : 'blob'})`);
 resolve();
 };
 request.onerror = () => {
 if (DEBUG && DEBUG.enabled) console.warn('Cache write error:', request.error);
 resolve(); // Don't reject, just continue
 };
 });
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.warn('Cache write error:', error);
 }
 }

 async clear() {
 this.cache.clear();
 try {
 await this.initPromise;
 if (!this.db) return;
 const tx = this.db.transaction([this.storeName], 'readwrite');
 const store = tx.objectStore(this.storeName);
 await new Promise((resolve, reject) => {
 const request = store.clear();
 request.onsuccess = () => resolve();
 request.onerror = () => reject(request.error);
 });
 if (DEBUG && DEBUG.enabled) console.log('[Cache] Texture cache cleared');
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.warn('[Cache] Cache clear error:', error);
 }
 }
}

// Global texture cache instance
export const TEXTURE_CACHE = new TextureCache();

// Warm up cache with essential textures (run in background)
// This preloads from IndexedDB into memory so synchronous lookups work
export async function warmupTextureCache() {
 // Build keys dynamically based on actual texture size config
 // On mobile CONFIG.QUALITY.textureSize=1024, on desktop 4096
 const textureSize = CONFIG.QUALITY?.textureSize || 4096;
 const moonSize = Math.min(textureSize, 2048);

 const essentialTextures = [
 `earth_texture_${textureSize}`,
 `earth_bump_${textureSize}`,
 `earth_normal_${textureSize}`,
 `earth_specular_${textureSize}`,
 `moon_texture_${moonSize}`,
 `mars_texture_${moonSize}`
 ];
 
 if (DEBUG && DEBUG.PERFORMANCE) console.log('Warming up texture cache from IndexedDB...');
 let cached = 0;
 
 for (const key of essentialTextures) {
 const dataURL = await TEXTURE_CACHE.get(key);
 if (dataURL) {
 cached++;
 if (DEBUG && DEBUG.PERFORMANCE) console.log(`  Loaded ${key} into memory`);
 
 // For bump/normal/specular maps, also create and cache Canvas objects
 // This allows synchronous access in createEarthBumpMap/Normal/Specular
 if (key.includes('bump') || key.includes('normal') || key.includes('specular')) {
 const canvasKey = `${key}_canvas`;
 
 // Create canvas from data URL (async)
 const img = new Image();
 img.src = dataURL;
 await new Promise((resolve) => {
 img.onload = () => {
 const canvas = document.createElement('canvas');
 // Size from the decoded image, not from the key. Keys carry the configured
 // texture size (1024 on mobile, 4096 on desktop); the old `key.includes('4096')`
 // test silently produced a 2048 canvas for every non-desktop key, leaving
 // three quarters of every mobile bump/normal/specular map transparent.
 canvas.width = img.naturalWidth || img.width;
 canvas.height = img.naturalHeight || img.height;
 const ctx = canvas.getContext('2d');
 ctx.drawImage(img, 0, 0);
 
 // Store canvas in memory for synchronous access
 TEXTURE_CACHE.cache.set(canvasKey, canvas);
 if (DEBUG && DEBUG.PERFORMANCE) console.log(`    Canvas cached: ${canvasKey}`);
 resolve();
 };
 img.onerror = () => resolve(); // Skip if error
 });
 }
 }
 }
 
 if (DEBUG && DEBUG.PERFORMANCE) console.log(`Texture cache warmup: ${cached}/${essentialTextures.length} textures loaded into memory`);
 
 return cached === essentialTextures.length;
}
