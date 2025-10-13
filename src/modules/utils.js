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
