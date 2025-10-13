// ===========================
// CONSTANTS & CONFIG
// ===========================

// Debug configuration - enable with URL parameters: ?debug=true&debug-vr=true&debug-textures=true
export const DEBUG = {
 enabled: new URLSearchParams(window.location.search).has('debug'),
 VR: new URLSearchParams(window.location.search).has('debug-vr'),
 TEXTURES: new URLSearchParams(window.location.search).has('debug-textures'),
 PERFORMANCE: new URLSearchParams(window.location.search).has('debug-performance')
};

// Mobile & Performance Detection
export const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
export const IS_LOW_POWER = navigator.hardwareConcurrency < 4;
export const QUALITY_PRESET = (IS_MOBILE || IS_LOW_POWER) ? 'low' : 'high';

export const CONFIG = {
 RENDERER: {
 antialias: !IS_MOBILE, // Disable AA on mobile for performance
 alpha: true,
 powerPreference: 'high-performance',
 maxPixelRatio: IS_MOBILE ? 1.5 : 2, // Lower on mobile
 logarithmicDepthBuffer: true
 },
 CAMERA: {
 fov: 75,
 near: 0.1,
 far: 50000,
 // Start position adjusted for new proportional educational scale
 // Earth is at 51 units, so start at ~100 units for good overview
 startPos: { x: 0, y: 100, z: 200 }
 },
 CONTROLS: {
 dampingFactor: 0.05,
 minDistance: 0.001, // Changed from 5 to 0.001 - allows extreme close-up of ISS and small objects
 maxDistance: 10000,
 enablePan: true,
 zoomSpeed: 1.2
 },
 PERFORMANCE: {
 targetFPS: 60,
 frameTime: 1000 / 60,
 maxDeltaTime: 0.1
 },
 QUALITY: {
 // Adaptive quality based on device
 textureSize: IS_MOBILE ? 1024 : 4096,
 sphereSegments: IS_MOBILE ? 32 : 128,
 lowPowerSegments: 32,
 particleSize: 2,
 particleCount: IS_MOBILE ? 1000 : 5000,
 shadows: !IS_MOBILE // Disable shadows on mobile
 }
};

// Suppress harmless WebGL shader validation warnings
const originalWarn = console.warn;
console.warn = function(...args) {
 const msg = args.join(' ');
 // Filter out known harmless WebGL shader warnings
 if (msg.includes('THREE.WebGLProgram') && msg.includes('VALIDATE_STATUS')) {
 // Suppress - this is a harmless validation warning that doesn't affect functionality
 return;
 }
 if (msg.includes('Vertex shader is not compiled')) {
 // Suppress - shader compiles successfully despite warning
 return;
 }
 originalWarn.apply(console, args);
};

// Log configuration (only if debug enabled)
if (DEBUG.enabled) {
 console.log('[Space Voyage] Debug Mode Enabled');
 console.log('[Device]', IS_MOBILE ? 'Mobile' : 'Desktop');
 console.log('[Quality]', QUALITY_PRESET);
 console.log('[Textures]', CONFIG.QUALITY.textureSize);
 console.log('[Geometry]', CONFIG.QUALITY.sphereSegments + ' segments');
}

// ===========================
// TEXTURE GENERATION UTILITIES
// ===========================

/**
 * Reusable utilities for procedural texture generation
 * Eliminates duplicate code across 20+ texture creation functions
 */
export class TextureGeneratorUtils {
 /**
  * Create and setup a canvas for texture generation
  * @param {number} size - Canvas size (width = height)
  * @returns {Object} { canvas, ctx, imageData, data }
  */
 static createCanvas(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 return { canvas, ctx, imageData, data };
 }
 
 /**
  * Simple deterministic pseudo-random noise function
  * @param {number} x - X coordinate
  * @param {number} y - Y coordinate
  * @param {number} seed - Random seed (default: 0)
  * @returns {number} Noise value between 0 and 1
  */
 static noise(x, y, seed = 0) {
 const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
 return n - Math.floor(n);
 }
 
 /**
  * Fractal Brownian Motion - multi-octave noise for natural patterns
  * @param {number} x - X coordinate
  * @param {number} y - Y coordinate
  * @param {number} octaves - Number of noise layers (default: 4)
  * @param {Function} noiseFunc - Noise function to use (default: TextureGeneratorUtils.noise)
  * @returns {number} FBM value between 0 and 1
  */
 static fbm(x, y, octaves = 4, noiseFunc = TextureGeneratorUtils.noise) {
 let value = 0;
 let amplitude = 1;
 let frequency = 1;
 let maxValue = 0;
 
 for (let i = 0; i < octaves; i++) {
 value += noiseFunc(x * frequency, y * frequency, i) * amplitude;
 maxValue += amplitude;
 amplitude *= 0.5;
 frequency *= 2;
 }
 
 return value / maxValue;
 }
 
 /**
  * Turbulence pattern for chaotic effects
  * @param {number} x - X coordinate
  * @param {number} y - Y coordinate
  * @param {number} size - Turbulence size
  * @param {Function} noiseFunc - Noise function to use (default: TextureGeneratorUtils.noise)
  * @returns {number} Turbulence value
  */
 static turbulence(x, y, size, noiseFunc = TextureGeneratorUtils.noise) {
 let value = 0;
 let initialSize = size;
 
 while (size >= 1) {
 value += noiseFunc(x / size, y / size) * size;
 size /= 2.0;
 }
 
 return value / initialSize;
 }
 
 /**
  * Finalize texture - convert canvas to THREE.CanvasTexture
  * @param {HTMLCanvasElement} canvas - Canvas element
  * @returns {THREE.CanvasTexture} Three.js texture
  */
 static finalizeTexture(canvas) {
 // Import THREE dynamically (already available globally)
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 /**
  * Apply imageData to canvas context
  * @param {CanvasRenderingContext2D} ctx - Canvas context
  * @param {ImageData} imageData - Image data to apply
  */
 static applyImageData(ctx, imageData) {
 ctx.putImageData(imageData, 0, 0);
 }
}

// ===========================
// MATERIAL FACTORY
// ===========================

/**
 * Factory for creating THREE.js materials with common defaults
 * Eliminates duplicate material creation code across 40+ instances
 */
export class MaterialFactory {
 /**
  * Create a MeshStandardMaterial with common defaults
  * @param {Object} config - Material configuration
  * @param {THREE.Texture} config.map - Diffuse texture map
  * @param {THREE.Texture} config.bumpMap - Bump map texture
  * @param {number} config.bumpScale - Bump scale (default: 0.02)
  * @param {THREE.Texture} config.normalMap - Normal map texture
  * @param {number} config.roughness - Surface roughness (default: 0.5)
  * @param {number} config.metalness - Surface metalness (default: 0.0)
  * @param {number|string} config.emissive - Emissive color (default: 0x000000)
  * @param {number} config.emissiveIntensity - Emissive intensity (default: 0)
  * @param {number|string} config.color - Base color (optional, used if no map)
  * @param {number} config.opacity - Opacity (default: 1.0)
  * @param {boolean} config.transparent - Transparent flag (default: false)
  * @returns {THREE.MeshStandardMaterial}
  */
 static createStandardMaterial(config = {}) {
 const material = {
 roughness: config.roughness !== undefined ? config.roughness : 0.5,
 metalness: config.metalness !== undefined ? config.metalness : 0.0,
 emissive: config.emissive !== undefined ? config.emissive : 0x000000,
 emissiveIntensity: config.emissiveIntensity !== undefined ? config.emissiveIntensity : 0
 };
 
 // Add optional properties only if provided
 if (config.map) material.map = config.map;
 if (config.bumpMap) {
 material.bumpMap = config.bumpMap;
 material.bumpScale = config.bumpScale !== undefined ? config.bumpScale : 0.02;
 }
 if (config.normalMap) material.normalMap = config.normalMap;
 if (config.color) material.color = typeof config.color === 'number' ? config.color : parseInt(config.color.replace('#', '0x'));
 if (config.opacity !== undefined) material.opacity = config.opacity;
 if (config.transparent) material.transparent = config.transparent;
 
 return new THREE.MeshStandardMaterial(material);
 }
 
 /**
  * Create a MeshBasicMaterial (for emissive/unlit objects)
  * @param {Object} config - Material configuration
  * @param {THREE.Texture} config.map - Texture map
  * @param {number|string} config.color - Base color
  * @param {number} config.opacity - Opacity (default: 1.0)
  * @param {boolean} config.transparent - Transparent flag (default: false)
  * @param {boolean} config.side - Side to render (default: THREE.FrontSide)
  * @returns {THREE.MeshBasicMaterial}
  */
 static createBasicMaterial(config = {}) {
 const material = {};
 
 if (config.map) material.map = config.map;
 if (config.color) material.color = typeof config.color === 'number' ? config.color : parseInt(config.color.replace('#', '0x'));
 if (config.opacity !== undefined) material.opacity = config.opacity;
 if (config.transparent) material.transparent = config.transparent;
 if (config.side) material.side = config.side;
 
 return new THREE.MeshBasicMaterial(material);
 }
 
 /**
  * Create a simple colored MeshStandardMaterial
  * @param {number|string} color - Color value
  * @param {Object} options - Additional options (roughness, metalness, etc.)
  * @returns {THREE.MeshStandardMaterial}
  */
 static createColoredMaterial(color, options = {}) {
 return MaterialFactory.createStandardMaterial({
 color,
 ...options
 });
 }
}
