// ===========================
// TEXTURE CACHE SYSTEM
// ===========================
import * as THREE from 'three';
import { DEBUG, IS_LOW_POWER, IS_MOBILE } from './utils.js';

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
 });
 }

 async get(key) {
 // Check memory cache first
 if (this.cache.has(key)) {
 if (DEBUG.PERFORMANCE) console.log(`🗄️ Cache HIT (memory): ${key}`);
 return this.cache.get(key);
 }

 // Check IndexedDB
 try {
 await this.initPromise;
 const tx = this.db.transaction([this.storeName], 'readonly');
 const store = tx.objectStore(this.storeName);
 
 return new Promise((resolve, reject) => {
 const request = store.get(key);
 request.onsuccess = () => {
 if (request.result) {
 if (DEBUG.PERFORMANCE) console.log(`🗄️ Cache HIT (IndexedDB): ${key}`);
 this.cache.set(key, request.result); // Promote to memory cache
 resolve(request.result);
 } else {
 if (DEBUG.PERFORMANCE) console.log(`❌ Cache MISS: ${key}`);
 resolve(null);
 }
 };
 request.onerror = () => reject(request.error);
 });
 } catch (error) {
 console.warn('Cache read error:', error);
 return null;
 }
 }

 async set(key, dataURL) {
 // Set in memory cache
 this.cache.set(key, dataURL);

 // Set in IndexedDB for persistence
 try {
 await this.initPromise;
 const tx = this.db.transaction([this.storeName], 'readwrite');
 const store = tx.objectStore(this.storeName);
 
 return new Promise((resolve, reject) => {
 const request = store.put(dataURL, key);
 request.onsuccess = () => {
 if (DEBUG.PERFORMANCE) console.log(`💾 Cache SET: ${key} (${(dataURL.length / 1024).toFixed(0)}KB)`);
 resolve();
 };
 request.onerror = () => {
 console.warn('Cache write error:', request.error);
 resolve(); // Don't reject, just continue
 };
 });
 } catch (error) {
 console.warn('Cache write error:', error);
 }
 }

 async clear() {
 this.cache.clear();
 try {
 await this.initPromise;
 const tx = this.db.transaction([this.storeName], 'readwrite');
 const store = tx.objectStore(this.storeName);
 await new Promise((resolve, reject) => {
 const request = store.clear();
 request.onsuccess = () => resolve();
 request.onerror = () => reject(request.error);
 });
 console.log('[Cache] Texture cache cleared');
 } catch (error) {
 console.warn('Cache clear error:', error);
 }
 }
}

// Global texture cache instance
export const TEXTURE_CACHE = new TextureCache();

// Warm up cache with essential textures (run in background)
// This preloads from IndexedDB into memory so synchronous lookups work
export async function warmupTextureCache() {
 const essentialTextures = [
 'earth_texture_4096',
 'moon_texture_2048',
 'mars_texture_2048'
 ];

 if (!IS_MOBILE && !IS_LOW_POWER) {
 essentialTextures.push('earth_bump_4096', 'earth_normal_4096', 'earth_specular_4096');
 }
 
 console.log('🔥 Warming up texture cache from IndexedDB...');
 let cached = 0;
 
 for (const key of essentialTextures) {
 const dataURL = await TEXTURE_CACHE.get(key);
 if (dataURL) {
 cached++;
 console.log(`  ✅ Loaded ${key} into memory`);
 
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
 console.log(`    📦 Canvas cached: ${canvasKey}`);
 resolve();
 };
 img.onerror = () => resolve(); // Skip if error
 });
 }
 }
 }
 
 console.log(`🔥 Texture cache warmup: ${cached}/${essentialTextures.length} textures loaded into memory`);
 
 return cached === essentialTextures.length;
}

// Helper function to wrap texture generation with caching
export async function cachedTextureGeneration(cacheKey, generatorFn) {
 // Try to load from cache
 const cachedDataURL = await TEXTURE_CACHE.get(cacheKey);
 if (cachedDataURL) {
 const startTime = performance.now();
 return new Promise((resolve) => {
 const img = new Image();
 img.onload = () => {
 const canvas = img;
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 if (DEBUG.PERFORMANCE) {
 console.log(`⚡ Loaded ${cacheKey} from cache in ${(performance.now() - startTime).toFixed(0)}ms`);
 }
 resolve(texture);
 };
 img.src = cachedDataURL;
 });
 }
 
 // Generate texture if not cached
 const startTime = performance.now();
 const { canvas, texture } = await generatorFn();
 
 // Cache for future use
 const dataURL = canvas.toDataURL('image/png');
 TEXTURE_CACHE.set(cacheKey, dataURL).catch(err => 
 console.warn('Failed to cache texture:', err)
 );
 
 if (DEBUG.PERFORMANCE) {
 console.log(`🎨 Generated ${cacheKey} in ${(performance.now() - startTime).toFixed(0)}ms`);
 }
 
 return texture;
}
