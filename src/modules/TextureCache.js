// ===========================
// TEXTURE CACHE SYSTEM
// ===========================
import { DEBUG, CONFIG } from './utils.js';

export class TextureCache {
 constructor() {
 this.cache = new Map();
 this.dbName = 'SolarSystemTextureCache';
 this.dbVersion = 1;
 this.storeName = 'textures';
 this.db = null;
 this.initPromise = this.initDB();
 }

 async initDB() {
 return new Promise((resolve, reject) => {
 const request = indexedDB.open(this.dbName, this.dbVersion);
 
 request.onerror = () => reject(request.error);
 request.onsuccess = () => {
 this.db = request.result;
 resolve(this.db);
 };
 
 request.onupgradeneeded = (event) => {
 const db = event.target.result;
 if (!db.objectStoreNames.contains(this.storeName)) {
 db.createObjectStore(this.storeName);
 }
 };

 request.onblocked = () => {
 reject(new Error('IndexedDB blocked by another tab'));
 };
 });
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
 
 return new Promise((resolve, reject) => {
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
 request.onerror = () => reject(request.error);
 });
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.warn('Cache read error:', error);
 return null;
 }
 }

 async set(key, dataURL) {
 // Set in memory cache
 this.cache.set(key, dataURL);

 // Set in IndexedDB for persistence
 try {
 await this.initPromise;
 if (!this.db) return;
 const tx = this.db.transaction([this.storeName], 'readwrite');
 const store = tx.objectStore(this.storeName);
 
 return new Promise((resolve, reject) => {
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
 const size = key.includes('4096') ? 4096 : 2048;
 canvas.width = size;
 canvas.height = size;
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
