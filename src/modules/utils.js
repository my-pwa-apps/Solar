// ===========================
// CONSTANTS & CONFIG
// ===========================
import * as THREE from 'three';

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
 // logarithmicDepthBuffer disabled on mobile/Quest: the EXT_frag_depth extension
 // fails inside the WebXR framebuffer on Quest browsers, rendering all objects black.
 // Desktop gets it for better depth precision; mobile/Quest does not need it.
 logarithmicDepthBuffer: !IS_MOBILE
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
 },
 CONSTELLATION: {
 // Constellation rendering constants
 DISTANCE: 10000, // Distance from origin for constellation stars
 STAR_BASE_SIZE: 25, // Base size multiplier for stars (increased from 15 for brightness)
 GLOW_MULTIPLIER: 3, // Glow size multiplier relative to star size (increased from 2x)
 STAR_OPACITY: 1.0, // Star core opacity (fully opaque)
 GLOW_OPACITY: 0.6, // Glow opacity (increased from 0.3 for brightness)
 LINE_COLOR: 0x6699FF, // Constellation line color (bright blue)
 LINE_OPACITY: 0.7, // Line opacity (increased from 0.4 for visibility)
 LINE_WIDTH: 3, // Line thickness (increased from 2)
 STAR_SEGMENTS: 16, // Sphere segments for stars
 GLOW_SEGMENTS: 16 // Sphere segments for glow
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
 
 /**
  * Create a spacecraft material from preset type
  * Common materials used across multiple spacecraft (Hubble, JWST, Voyager, etc.)
  * @param {string} type - Material type: 'gold', 'silver', 'dark', 'solarPanel', 'body', 'structure', 'white'
  * @returns {THREE.MeshStandardMaterial}
  */
 static createSpacecraftMaterial(type) {
 const presets = {
 // Gold foil/thermal blankets (common on JWST, Juno, Voyager)
 gold: {
 color: 0xD4AF37,
 roughness: 0.2,
 metalness: 0.9,
 emissive: 0x4A3000,
 emissiveIntensity: 0.1
 },
 // Bright gold (for JWST mirror)
 goldBright: {
 color: 0xFFD700,
 roughness: 0.1,
 metalness: 1.0,
 emissive: 0xFFAA00,
 emissiveIntensity: 0.2
 },
 // Silver/aluminum body (common on Hubble, spacecraft buses)
 silver: {
 color: 0xC0C0C0,
 roughness: 0.3,
 metalness: 0.9
 },
 // White painted surfaces (Hubble body)
 white: {
 color: 0xFFFFFF,
 roughness: 0.2,
 metalness: 0.9
 },
 // Dark instruments/cameras
 dark: {
 color: 0x1a1a1a,
 roughness: 0.1,
 metalness: 0.5
 },
 // Gray body (Juno, Voyager buses)
 body: {
 color: 0x2a2a2a,
 roughness: 0.4,
 metalness: 0.7
 },
 // Solar panels (blue tint with slight glow)
 solarPanel: {
 color: 0x0a1a3d,
 roughness: 0.2,
 metalness: 0.9,
 emissive: 0x051020,
 emissiveIntensity: 0.15
 },
 // Structural elements/trusses
 structure: {
 color: 0x444444,
 roughness: 0.6,
 metalness: 0.8
 },
 // White/light gray heat shield
 shield: {
 color: 0xE8E8E8,
 roughness: 0.2,
 metalness: 0.5,
 side: THREE.DoubleSide
 }
 };
 
 if (!presets[type]) {
 console.warn(`Unknown spacecraft material type: ${type}, using silver as fallback`);
 return MaterialFactory.createStandardMaterial(presets.silver);
 }
 
 return MaterialFactory.createStandardMaterial(presets[type]);
 }
}

// ===========================
// GEOMETRY FACTORY
// ===========================

/**
 * Factory for creating THREE.js geometries with caching support
 * Reduces memory usage by reusing identical geometries across multiple meshes
 */
export class GeometryFactory {
 /**
  * Create or retrieve a cached sphere geometry
  * @param {number} radius - Sphere radius
  * @param {number} widthSegments - Number of horizontal segments (default: 32)
  * @param {number} heightSegments - Number of vertical segments (default: widthSegments)
  * @param {Map} cache - Geometry cache (optional, recommended for memory efficiency)
  * @returns {THREE.SphereGeometry}
  */
 static createSphere(radius, widthSegments = 32, heightSegments = null, cache = null) {
 heightSegments = heightSegments || widthSegments;
 const key = `sphere_${radius.toFixed(3)}_${widthSegments}_${heightSegments}`;
 
 if (cache && cache.has(key)) {
 return cache.get(key);
 }
 
 const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
 
 if (cache) {
 cache.set(key, geometry);
 }
 
 return geometry;
 }
 
 /**
  * Create or retrieve a cached cylinder geometry
  * @param {number} radiusTop - Radius at top
  * @param {number} radiusBottom - Radius at bottom
  * @param {number} height - Cylinder height
  * @param {number} radialSegments - Number of segments around circumference (default: 32)
  * @param {Map} cache - Geometry cache (optional)
  * @returns {THREE.CylinderGeometry}
  */
 static createCylinder(radiusTop, radiusBottom, height, radialSegments = 32, cache = null) {
 const key = `cylinder_${radiusTop.toFixed(3)}_${radiusBottom.toFixed(3)}_${height.toFixed(3)}_${radialSegments}`;
 
 if (cache && cache.has(key)) {
 return cache.get(key);
 }
 
 const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
 
 if (cache) {
 cache.set(key, geometry);
 }
 
 return geometry;
 }
 
 /**
  * Create or retrieve a cached box geometry
  * @param {number} width - Width (x-axis)
  * @param {number} height - Height (y-axis)
  * @param {number} depth - Depth (z-axis)
  * @param {Map} cache - Geometry cache (optional)
  * @returns {THREE.BoxGeometry}
  */
 static createBox(width, height, depth, cache = null) {
 const key = `box_${width.toFixed(3)}_${height.toFixed(3)}_${depth.toFixed(3)}`;
 
 if (cache && cache.has(key)) {
 return cache.get(key);
 }
 
 const geometry = new THREE.BoxGeometry(width, height, depth);
 
 if (cache) {
 cache.set(key, geometry);
 }
 
 return geometry;
 }
 
 /**
  * Create or retrieve a cached cone geometry
  * @param {number} radius - Radius at base
  * @param {number} height - Cone height
  * @param {number} radialSegments - Number of segments (default: 32)
  * @param {Map} cache - Geometry cache (optional)
  * @returns {THREE.ConeGeometry}
  */
 static createCone(radius, height, radialSegments = 32, cache = null) {
 const key = `cone_${radius.toFixed(3)}_${height.toFixed(3)}_${radialSegments}`;
 
 if (cache && cache.has(key)) {
 return cache.get(key);
 }
 
 const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
 
 if (cache) {
 cache.set(key, geometry);
 }
 
 return geometry;
 }
 
 /**
  * Create or retrieve a cached torus geometry
  * @param {number} radius - Torus radius
  * @param {number} tube - Tube radius
  * @param {number} radialSegments - Segments around the tube (default: 16)
  * @param {number} tubularSegments - Segments along the torus (default: 32)
  * @param {Map} cache - Geometry cache (optional)
  * @returns {THREE.TorusGeometry}
  */
 static createTorus(radius, tube, radialSegments = 16, tubularSegments = 32, cache = null) {
 const key = `torus_${radius.toFixed(3)}_${tube.toFixed(3)}_${radialSegments}_${tubularSegments}`;
 
 if (cache && cache.has(key)) {
 return cache.get(key);
 }
 
 const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
 
 if (cache) {
 cache.set(key, geometry);
 }
 
 return geometry;
 }
}

// ===========================
// COORDINATE UTILITIES
// ===========================

/**
 * Utilities for coordinate system conversions
 */
export class CoordinateUtils {
 /**
  * Convert spherical celestial coordinates (RA/Dec) to Cartesian 3D coordinates
  * Used for positioning stars and constellations on the celestial sphere
  * @param {number} ra - Right Ascension in degrees (0-360°)
  * @param {number} dec - Declination in degrees (-90° to +90°)
  * @param {number} distance - Distance from origin
  * @returns {Object} {x, y, z} Cartesian coordinates
  */
 static sphericalToCartesian(ra, dec, distance) {
 // Convert RA and Dec to radians
 const raRad = (ra * Math.PI) / 180;
 const decRad = (dec * Math.PI) / 180;
 
 // Spherical to Cartesian coordinates
 // We view from INSIDE the celestial sphere (like from Earth)
 // So we INVERT the coordinates to see them correctly
 const x = -distance * Math.cos(decRad) * Math.cos(raRad);
 const y = distance * Math.sin(decRad);
 const z = -distance * Math.cos(decRad) * Math.sin(raRad);
 
 return { x, y, z };
 }
}

// ===========================
// CONSTELLATION FACTORY
// ===========================

/**
 * Factory for creating constellation visual elements
 * Eliminates duplicate code in constellation rendering
 */
export class ConstellationFactory {
 /**
  * Create a star mesh with proper size based on magnitude
  * @param {Object} star - Star data {name, ra, dec, mag, color}
  * @param {Object} position - 3D position {x, y, z}
  * @param {Object} geometryCache - Geometry cache for reuse (optional)
  * @returns {THREE.Mesh} Star mesh
  */
 static createStar(star, position, geometryCache = null) {
 const starSize = CONFIG.CONSTELLATION.STAR_BASE_SIZE * Math.pow(2.5, -star.mag);
 
 // Try to get cached geometry or create new one
 let starGeom;
 const cacheKey = `star_${starSize.toFixed(2)}`;
 if (geometryCache && geometryCache.has(cacheKey)) {
 starGeom = geometryCache.get(cacheKey);
 } else {
 starGeom = new THREE.SphereGeometry(
 starSize,
 CONFIG.CONSTELLATION.STAR_SEGMENTS,
 CONFIG.CONSTELLATION.STAR_SEGMENTS
 );
 if (geometryCache) geometryCache.set(cacheKey, starGeom);
 }
 
 const starMat = new THREE.MeshBasicMaterial({
 color: star.color,
 transparent: true,
 opacity: CONFIG.CONSTELLATION.STAR_OPACITY
 });
 // Store original opacity for highlighting effects
 starMat.userData = { originalOpacity: CONFIG.CONSTELLATION.STAR_OPACITY };
 
 const starMesh = new THREE.Mesh(starGeom, starMat);
 starMesh.position.set(position.x, position.y, position.z);
 
 return starMesh;
 }
 
 /**
  * Create a glow effect mesh for a star
  * @param {Object} star - Star data {color}
  * @param {number} starSize - Size of the parent star
  * @param {Object} geometryCache - Geometry cache for reuse (optional)
  * @returns {THREE.Mesh} Glow mesh
  */
 static createGlow(star, starSize, geometryCache = null) {
 const glowSize = starSize * CONFIG.CONSTELLATION.GLOW_MULTIPLIER;
 
 // Try to get cached geometry or create new one
 let glowGeom;
 const cacheKey = `glow_${glowSize.toFixed(2)}`;
 if (geometryCache && geometryCache.has(cacheKey)) {
 glowGeom = geometryCache.get(cacheKey);
 } else {
 glowGeom = new THREE.SphereGeometry(
 glowSize,
 CONFIG.CONSTELLATION.GLOW_SEGMENTS,
 CONFIG.CONSTELLATION.GLOW_SEGMENTS
 );
 if (geometryCache) geometryCache.set(cacheKey, glowGeom);
 }
 
 const glowMat = new THREE.MeshBasicMaterial({
 color: star.color,
 transparent: true,
 opacity: CONFIG.CONSTELLATION.GLOW_OPACITY,
 blending: THREE.AdditiveBlending,
 depthWrite: false // Don't block objects behind the glow
 });
 // Store original opacity for highlighting effects
 glowMat.userData = { originalOpacity: CONFIG.CONSTELLATION.GLOW_OPACITY };
 
 return new THREE.Mesh(glowGeom, glowMat);
 }
 
 /**
  * Create constellation line connecting two stars
  * @param {THREE.Vector3} pos1 - First star position
  * @param {THREE.Vector3} pos2 - Second star position
  * @returns {THREE.Line} Line mesh
  */
 static createLine(pos1, pos2) {
 const points = [pos1, pos2];
 const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
 const lineMat = new THREE.LineBasicMaterial({
 color: CONFIG.CONSTELLATION.LINE_COLOR,
 transparent: true,
 opacity: CONFIG.CONSTELLATION.LINE_OPACITY,
 linewidth: CONFIG.CONSTELLATION.LINE_WIDTH
 });
 // Store original opacity for highlighting effects
 lineMat.userData = { originalOpacity: CONFIG.CONSTELLATION.LINE_OPACITY };
 
 return new THREE.Line(lineGeom, lineMat);
 }
 
 /**
  * Calculate constellation center and bounding radius
  * @param {Array<THREE.Mesh>} starMeshes - Array of star meshes
  * @returns {Object} {center: THREE.Vector3, radius: number}
  */
 static calculateCenter(starMeshes) {
 let centerX = 0, centerY = 0, centerZ = 0;
 let maxDist = 0;
 
 starMeshes.forEach(star => {
 centerX += star.position.x;
 centerY += star.position.y;
 centerZ += star.position.z;
 });
 
 const count = starMeshes.length;
 const center = new THREE.Vector3(centerX / count, centerY / count, centerZ / count);
 
 starMeshes.forEach(star => {
 const dist = star.position.distanceTo(center);
 if (dist > maxDist) maxDist = dist;
 });
 
 return { center, radius: maxDist };
 }
}
