// Space Voyage - Interactive 3D Solar System & VR Experience
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ===========================
// TEXTURE CACHE SYSTEM
// ===========================
class TextureCache {
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
 if (DEBUG.PERFORMANCE) console.log(` Cache HIT (memory): ${key}`);
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
 if (DEBUG.PERFORMANCE) console.log(` Cache HIT (IndexedDB): ${key}`);
 this.cache.set(key, request.result); // Promote to memory cache
 resolve(request.result);
 } else {
 if (DEBUG.PERFORMANCE) console.log(` Cache MISS: ${key}`);
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
 if (DEBUG.PERFORMANCE) console.log(` Cache SET: ${key} (${(dataURL.length / 1024).toFixed(0)}KB)`);
 resolve();
 };
 request.onerror = () => {
 console.warn('Cache write error:', error);
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
 await store.clear();
 console.log('[Cache] Texture cache cleared');
 } catch (error) {
 console.warn('Cache clear error:', error);
 }
 }
}

// Global texture cache instance
const TEXTURE_CACHE = new TextureCache();

// Warm up cache with essential textures (run in background)
async function warmupTextureCache() {
 const essentialTextures = [
 'earth_texture_4096',
 'moon_texture_2048',
 'mars_texture_2048'
 ];
 
 let cached = 0;
 for (const key of essentialTextures) {
 if (await TEXTURE_CACHE.get(key)) {
 cached++;
 }
 }
 
 if (DEBUG.PERFORMANCE) {
 console.log(` Texture cache: ${cached}/${essentialTextures.length} essential textures cached`);
 }
 
 return cached === essentialTextures.length;
}

// Helper function to wrap texture generation with caching
async function cachedTextureGeneration(cacheKey, generatorFn) {
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
 console.log(` Loaded ${cacheKey} from cache in ${(performance.now() - startTime).toFixed(0)}ms`);
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
 console.log(` Generated ${cacheKey} in ${(performance.now() - startTime).toFixed(0)}ms`);
 }
 
 return texture;
}

// ===========================
// CONSTANTS & CONFIG
// ===========================

// Debug configuration - enable with URL parameters: ?debug=true&debug-vr=true&debug-textures=true
const DEBUG = {
 enabled: new URLSearchParams(window.location.search).has('debug'),
 VR: new URLSearchParams(window.location.search).has('debug-vr'),
 TEXTURES: new URLSearchParams(window.location.search).has('debug-textures'),
 PERFORMANCE: new URLSearchParams(window.location.search).has('debug-performance')
};

// Mobile & Performance Detection
const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const IS_LOW_POWER = navigator.hardwareConcurrency < 4;
const QUALITY_PRESET = (IS_MOBILE || IS_LOW_POWER) ? 'low' : 'high';

const CONFIG = {
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
 startPos: { x: 0, y: 50, z: 100 }
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
// SCENE MANAGER
// ===========================
class SceneManager {
 constructor() {
 this.scene = new THREE.Scene();
 this.camera = new THREE.PerspectiveCamera(
 CONFIG.CAMERA.fov,
 window.innerWidth / window.innerHeight,
 CONFIG.CAMERA.near,
 CONFIG.CAMERA.far
 );
 this.renderer = null;
 this.controls = null;
 this.raycaster = new THREE.Raycaster();
 this.mouse = new THREE.Vector2();
 this.lights = {};
 this.resizeTimeout = null;
 this.labelsVisible = false; // Initialize labels as hidden
 
 // Track previous button states for VR controllers to detect press (not hold)
 this.previousButtonStates = [
 {}, // Controller 0
 {} // Controller 1
 ];
 
 this.init();
 }

 init() {
 try {
 this.setupRenderer();
 this.setupCamera();
 this.setupControls();
 this.setupLighting();
 this.setupXR();
 this.setupEventListeners();
 } catch (error) {
 console.error('Error initializing scene:', error);
 this.showError('Failed to initialize 3D scene. Please refresh the page.');
 }
 }

 setupRenderer() {
 this.renderer = new THREE.WebGLRenderer(CONFIG.RENDERER);
 this.renderer.setSize(window.innerWidth, window.innerHeight);
 this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.RENDERER.maxPixelRatio));
 this.renderer.xr.enabled = true;
 this.renderer.shadowMap.enabled = true;
 this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
 this.renderer.toneMappingExposure = 1.2; // Increased to brighten dark areas
 
 // Performance optimizations
 this.renderer.sortObjects = false; // Skip sorting for better performance
 this.renderer.outputColorSpace = THREE.SRGBColorSpace;
 
 // Add WebGL context loss/restore handlers
 this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
 event.preventDefault();
 console.warn('[WebGL] Context lost - attempting recovery...');
 // Three.js setAnimationLoop handles this internally
 }, false);
 
 this.renderer.domElement.addEventListener('webglcontextrestored', () => {
 console.log('[WebGL] Context restored');
 // Three.js setAnimationLoop will automatically restart
 }, false);
 
 const container = document.getElementById('canvas-container');
 if (container) {
 container.appendChild(this.renderer.domElement);
 } else {
 throw new Error('Canvas container not found');
 }
 
 // Setup CSS2D label renderer
 this.labelRenderer = new CSS2DRenderer();
 this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
 this.labelRenderer.domElement.style.position = 'absolute';
 this.labelRenderer.domElement.style.top = '0px';
 this.labelRenderer.domElement.style.pointerEvents = 'none';
 container.appendChild(this.labelRenderer.domElement);
 
 // Label visibility state - start hidden
 this.labelsVisible = false;

 // VR UI state
 this.vrStatusMessage = ' Use Laser to Click Buttons';
 this.vrFlashAction = null;
 this.vrFlashTimeout = null;
 this.vrMenuTitle = ' Space Voyage VR';
 this.vrQuickNavMap = new Map();
 }

 setupCamera() {
 const { x, y, z } = CONFIG.CAMERA.startPos;
 this.camera.position.set(x, y, z);
 }

 setupControls() {
 this.controls = new OrbitControls(this.camera, this.renderer.domElement);
 this.controls.enableDamping = true;
 this.controls.dampingFactor = CONFIG.CONTROLS.dampingFactor;
 this.controls.minDistance = CONFIG.CONTROLS.minDistance;
 this.controls.maxDistance = CONFIG.CONTROLS.maxDistance;
 this.controls.enablePan = CONFIG.CONTROLS.enablePan;
 this.controls.zoomSpeed = CONFIG.CONTROLS.zoomSpeed;
 this.controls.rotateSpeed = 0.5;
 this.controls.update();
 }

 setupEventListeners() {
 window.addEventListener('resize', () => {
 clearTimeout(this.resizeTimeout);
 this.resizeTimeout = setTimeout(() => this.onResize(), 150);
 }, { passive: true });
 }

 setupLighting() {
 // Ambient light - provides base illumination so dark sides are visible
 this.lights.ambient = new THREE.AmbientLight(0x444466, 0.6);
 this.scene.add(this.lights.ambient);

 // Hemisphere light for space lighting (starlight from above/below)
 this.lights.hemisphere = new THREE.HemisphereLight(0x5555aa, 0x222244, 0.4);
 this.scene.add(this.lights.hemisphere);

 // Camera light - helps viewing dark sides without overpowering
 this.lights.camera = new THREE.PointLight(0x8899dd, 0.8, 600);
 this.camera.add(this.lights.camera);
 this.scene.add(this.camera);
 
 if (DEBUG.enabled) {
 if (DEBUG.enabled) console.log('[Lighting] Ambient lighting enhanced');
 }
 }

 setupXR() {
 try {
 if (DEBUG.VR) console.log('[XR] Setting up WebXR');
 
 // Create a dolly (rig) for VR movement (but don't add camera yet - only in VR mode)
 this.dolly = new THREE.Group();
 this.dolly.position.set(0, 50, 150); // Start away from Sun
 this.scene.add(this.dolly);
 
 // Store original camera parent for switching back
 this.cameraOriginalParent = this.camera.parent;

 // Controller models
 this.controllerModelFactory = new XRControllerModelFactory();
 
 // Initialize XR controllers
 this.controllers = [];
 
 // Initialize XR controllers
 this.controllers = [];
 this.controllerGrips = [];
 this.lasersVisible = true; // Toggle for laser pointers
 
 // Setup two controllers
 for (let i = 0; i < 2; i++) {
 // Controller for pointing/selecting
 const controller = this.renderer.xr.getController(i);
 controller.addEventListener('selectstart', () => this.onSelectStart(controller, i));
 controller.addEventListener('selectend', () => this.onSelectEnd(controller, i));
 controller.addEventListener('squeezestart', () => this.onSqueezeStart(controller, i));
 controller.userData.index = i;
 this.dolly.add(controller);
 this.controllers.push(controller);
 
 // Controller grip for models
 const controllerGrip = this.renderer.xr.getControllerGrip(i);
 
 // Thin laser line - subtle and precise
 const laserGeometry = new THREE.CylinderGeometry(0.001, 0.001, 10, 6);
 const laserMaterial = new THREE.MeshBasicMaterial({ 
 color: 0x00ffff,
 transparent: true,
 opacity: 0.6
 });
 
 const laser = new THREE.Mesh(laserGeometry, laserMaterial);
 laser.rotation.x = Math.PI / 2; // Rotate to point forward
 laser.position.set(0, 0, -5); // Position at center of 10m length
 laser.name = 'laser';
 laser.visible = true; // Can be toggled
 controller.add(laser);
 
 // Small, clear target point where laser hits
 const pointerGeometry = new THREE.SphereGeometry(0.01, 8, 8);
 const pointerMaterial = new THREE.MeshBasicMaterial({ 
 color: 0x00ffff,
 transparent: true,
 opacity: 0.8
 });
 const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
 pointer.position.set(0, 0, -10);
 pointer.name = 'pointer';
 pointer.visible = true; // Can be toggled
 controller.add(pointer);
 
 // Subtle outer ring for better visibility
 const glowGeometry = new THREE.SphereGeometry(0.015, 8, 8);
 const glowMaterial = new THREE.MeshBasicMaterial({ 
 color: 0x00ffff,
 transparent: true,
 opacity: 0.2,
 blending: THREE.AdditiveBlending,
 depthWrite: false // Don't block objects behind the glow
 });
 const glow = new THREE.Mesh(glowGeometry, glowMaterial);
 pointer.add(glow);
 
 // Add a cone at controller tip for direction indicator
 const coneGeometry = new THREE.ConeGeometry(0.02, 0.4, 8);
 const coneMaterial = new THREE.MeshBasicMaterial({ 
 color: 0x00ffff
 });
 const cone = new THREE.Mesh(coneGeometry, coneMaterial);
 cone.rotation.x = Math.PI / 2; // Point forward
 cone.position.set(0, 0, -0.2);
 cone.name = 'cone';
 controller.add(cone);
 
 this.dolly.add(controllerGrip);
 this.controllerGrips.push(controllerGrip);
 }
 
 // Setup VR UI Panel
 this.setupVRUI();
 
 // Custom VR Button - Only show if VR is supported
 if (navigator.xr) {
 navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
 if (supported) {
 const vrButton = document.createElement('button');
 vrButton.id = 'VRButton';
 vrButton.style.cssText = 'position: fixed; bottom: 80px; right: 20px; width: 50px; height: 50px; cursor: pointer; padding: 0; border: 2px solid #fff; border-radius: 50%; background: rgba(0,0,0,0.8); color: #fff; font-size: 24px; text-align: center; line-height: 50px; opacity: 0.9; outline: none; z-index: 999; transition: all 0.3s;';
 vrButton.innerHTML = ''; // VR headset emoji
 vrButton.title = 'Enter VR Mode';
 
 // Hover effect
 vrButton.onmouseenter = () => {
 vrButton.style.opacity = '1';
 vrButton.style.transform = 'scale(1.1)';
 };
 vrButton.onmouseleave = () => {
 vrButton.style.opacity = '0.9';
 vrButton.style.transform = 'scale(1)';
 };
 
 vrButton.onclick = async () => {
 try {
 // Explicitly request immersive-vr mode
 const session = await navigator.xr.requestSession('immersive-vr', {
 requiredFeatures: ['local-floor']
 });
 await this.renderer.xr.setSession(session);

 } catch (error) {
 console.error('[VR] Failed to start VR session:', error);
 alert('Could not enter VR mode: ' + error.message);
 }
 };
 
 const vrContainer = document.getElementById('vr-button');
 if (vrContainer) {
 vrContainer.appendChild(vrButton);
 vrContainer.classList.remove('hidden');
 }
 }
 });
 }

 // Custom AR Button - Only show if AR is supported
 if (navigator.xr) {
 navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
 if (supported) {
 const arButton = document.createElement('button');
 arButton.id = 'ARButton';
 arButton.style.cssText = 'position: fixed; bottom: 80px; right: 150px; width: 50px; height: 50px; cursor: pointer; padding: 0; border: 2px solid #fff; border-radius: 50%; background: rgba(0,0,0,0.8); color: #fff; font-size: 24px; text-align: center; line-height: 50px; opacity: 0.9; outline: none; z-index: 999; transition: all 0.3s;';
 arButton.innerHTML = ''; // Mobile device for AR
 arButton.title = 'Enter AR Mode';
 
 // Hover effect
 arButton.onmouseenter = () => {
 arButton.style.opacity = '1';
 arButton.style.transform = 'scale(1.1)';
 };
 arButton.onmouseleave = () => {
 arButton.style.opacity = '0.9';
 arButton.style.transform = 'scale(1)';
 };
 
 arButton.onclick = async () => {
 try {
 // Explicitly request immersive-ar mode
 const session = await navigator.xr.requestSession('immersive-ar', {
 requiredFeatures: ['local-floor'],
 optionalFeatures: ['dom-overlay', 'hit-test']
 });
 await this.renderer.xr.setSession(session);
 } catch (error) {
 console.error('[AR] Failed to start AR session:', error);
 alert('Could not enter AR mode: ' + error.message);
 }
 };
 
 const arContainer = document.getElementById('ar-button');
 if (arContainer) {
 arContainer.appendChild(arButton);
 arContainer.classList.remove('hidden');
 }
 }
 });
 }

 // Handle XR session start
 this.renderer.xr.addEventListener('sessionstart', () => {
 const session = this.renderer.xr.getSession();
 if (DEBUG.VR) console.log(`[XR] Session started: ${session.mode}`);
 
 // Move camera to dolly for VR
 if (this.dolly && this.camera) {
 // Remove camera from scene
 if (this.camera.parent) {
 this.camera.parent.remove(this.camera);
 }
 // Add camera to dolly
 this.dolly.add(this.camera);
 // Reset camera local position
 this.camera.position.set(0, 0, 0);
 // Position dolly for good initial view
 this.dolly.position.set(0, 50, 150);
 }
 
 // Set background based on session type
 if (session.mode === 'immersive-ar' || 
 session.environmentBlendMode === 'additive' || 
 session.environmentBlendMode === 'alpha-blend') {
 this.scene.background = null; // Transparent for AR
 } else {
 // VR mode - keep starfield background
 this.scene.background = new THREE.Color(0x000011);
 }
 
 // Show welcome message and instructions
 if (DEBUG.enabled || DEBUG.VR) {
 console.log('[VR Controls]');
 console.log('  Left Stick: Move forward/back/strafe');
 console.log('  Right Stick: Turn left/right, move up/down');
 console.log('  Trigger: Sprint mode');
 console.log('  Grip: Toggle VR menu');
 console.log('  Point + Trigger: Select objects');
 console.log('  TIP: Press GRIP BUTTON to open VR menu!');
 }
 
 // Hide VR UI panel initially - let user toggle with grip
 if (this.vrUIPanel) {
 this.vrUIPanel.visible = false;
 }
 });

 // Handle XR session end
 this.renderer.xr.addEventListener('sessionend', () => {
 if (DEBUG.VR) console.log('[XR] Session ended');
 
 // Restore camera to scene
 if (this.dolly && this.camera && this.camera.parent === this.dolly) {
 this.dolly.remove(this.camera);
 this.scene.add(this.camera);
 // Restore camera position from dolly position
 this.camera.position.copy(this.dolly.position);
 }
 
 this.scene.background = new THREE.Color(0x000000);
 // Hide VR UI panel
 if (this.vrUIPanel) this.vrUIPanel.visible = false;
 });
 } catch (error) {
 console.warn('WebXR not supported:', error);
 }
 }

 setupVRUI() {
 if (!this.dolly) return;

 if (this.vrUIPanel && this.vrUIPanel.parent) {
 this.vrUIPanel.parent.remove(this.vrUIPanel);
 }

 const canvas = document.createElement('canvas');
 canvas.width = 1024;
 canvas.height = 640;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });

 this.vrUICanvas = canvas;
 this.vrUIContext = ctx;
 this.vrButtons = [];
 this.vrQuickNavMap = new Map();
 this.vrStatusMessage = this.vrStatusMessage || ' Use Laser to Click Buttons';
 this.vrMenuTitle = this.vrMenuTitle || ' Space Voyage VR';

 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;

 const aspect = canvas.width / canvas.height;
 const panelHeight = 1.9;
 const panelWidth = panelHeight * aspect;

 const geometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
 const material = new THREE.MeshBasicMaterial({
 map: texture,
 transparent: true,
 side: THREE.DoubleSide
 });

 this.vrUIPanel = new THREE.Mesh(geometry, material);
 this.vrUIPanel.position.set(0, 1.6, -2.5);
 this.vrUIPanel.visible = false;
 this.dolly.add(this.vrUIPanel);

 if (DEBUG.enabled || DEBUG.VR) {
 console.log('[VR] UI Panel created');
 }

 this.drawVRMenu();
 }

 requestVRMenuRefresh() {
 if (!this.vrUIContext) return;
 this.drawVRMenu();
 }

 getVRMenuState() {
 const app = window.app || {};
 const module = app.solarSystemModule;
 return {
 timeSpeed: app.timeSpeed ?? 1,
 orbitsVisible: module?.orbitsVisible ?? true,
 labelsVisible: this.labelsVisible,
 realisticScale: module?.realisticScale ?? false,
 lasersVisible: this.lasersVisible,
 focusedObject: module?.focusedObject || null,
 statusMessage: this.vrStatusMessage,
 flashAction: this.vrFlashAction
 };
 }

 getVRQuickNavTargets() {
 const app = window.app || {};
 const module = app.solarSystemModule;
 if (module && typeof module.getQuickNavTargets === 'function') {
 return module.getQuickNavTargets();
 }
 return [];
 }

 drawVRMenu() {
 if (!this.vrUIContext || !this.vrUICanvas) return;

 const ctx = this.vrUIContext;
 const canvas = this.vrUICanvas;
 const app = window.app || {};
 const module = app.solarSystemModule;
 const state = this.getVRMenuState();

 ctx.clearRect(0, 0, canvas.width, canvas.height);

 // Fluent Design: Acrylic background with gradient
 const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
 bgGradient.addColorStop(0, 'rgba(30, 30, 40, 0.95)');
 bgGradient.addColorStop(0.5, 'rgba(20, 20, 35, 0.97)');
 bgGradient.addColorStop(1, 'rgba(15, 15, 30, 0.98)');
 ctx.fillStyle = bgGradient;
 ctx.fillRect(0, 0, canvas.width, canvas.height);

 // Fluent Design: Add subtle noise texture for acrylic effect
 for (let i = 0; i < 300; i++) {
 ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
 const x = Math.random() * canvas.width;
 const y = Math.random() * canvas.height;
 const size = Math.random() * 2;
 ctx.fillRect(x, y, size, size);
 }

 // Fluent Design: Title with glow effect
 ctx.shadowColor = '#0078D4';
 ctx.shadowBlur = 20;
 ctx.fillStyle = '#0078D4';
 ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(this.vrMenuTitle, canvas.width / 2, 70);
 ctx.shadowBlur = 0;

 const columnWidth = 210;
 const columnSpacing = 20;
 const columns = 4;
 const buttonHeight = 68;
 const rowHeight = 90;
 const startX = (canvas.width - (columnWidth * columns + columnSpacing * (columns - 1))) / 2;
 const startY = 140;

 const buttons = [];
 this.vrQuickNavMap = new Map();

 const blendWithWhite = (hex, amount = 0.3) => {
 const num = parseInt(hex.replace('#', ''), 16);
 const r = (num >> 16) & 0xff;
 const g = (num >> 8) & 0xff;
 const b = num & 0xff;
 const mix = (channel) => Math.round(channel + (255 - channel) * amount);
 return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
 };

 const drawButton = ({ col, row, colSpan = 1, label, action, baseColor = '#2c3e50', active = false }) => {
 const width = columnWidth * colSpan + columnSpacing * (colSpan - 1);
 const x = startX + col * (columnWidth + columnSpacing);
 const y = startY + row * rowHeight;

 // Fluent Design: Soft shadow
 ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
 ctx.shadowBlur = 8;
 ctx.shadowOffsetX = 0;
 ctx.shadowOffsetY = 4;

 // Fluent Design: Acrylic button with gradient
 const buttonGradient = ctx.createLinearGradient(x, y, x, y + buttonHeight);
 if (active) {
 // Active state: Accent color gradient
 buttonGradient.addColorStop(0, baseColor);
 buttonGradient.addColorStop(1, blendWithWhite(baseColor, -0.1));
 } else {
 // Inactive state: Subtle gradient
 buttonGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
 buttonGradient.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
 }
 ctx.fillStyle = buttonGradient;
 ctx.fillRect(x, y, width, buttonHeight);

 // Fluent Design: Border with accent color
 ctx.shadowBlur = 0;
 ctx.strokeStyle = active ? baseColor : 'rgba(255, 255, 255, 0.15)';
 ctx.lineWidth = active ? 3 : 1.5;
 ctx.strokeRect(x, y, width, buttonHeight);

 // Fluent Design: Inner highlight
 if (!active) {
 ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
 ctx.lineWidth = 1;
 ctx.strokeRect(x + 1, y + 1, width - 2, buttonHeight - 2);
 }

 // Button text with proper contrast
 ctx.fillStyle = active ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
 ctx.font = active ? 'bold 28px "Segoe UI", Arial, sans-serif' : '600 28px "Segoe UI", Arial, sans-serif';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(label, x + width / 2, y + buttonHeight / 2);

 // Flash effect for interactions
 if (this.vrFlashAction === action) {
 ctx.fillStyle = 'rgba(0, 120, 212, 0.4)';
 ctx.fillRect(x, y, width, buttonHeight);
 }

 buttons.push({ x, y, w: width, h: buttonHeight, action, label });
 };

 const earthName = module?.planets?.earth?.userData?.name;

 drawButton({
 col: 0,
 row: 0,
 label: state.timeSpeed === 0 ? '⏸ Paused' : '⏸ Pause',
 action: 'speed0',
 baseColor: '#D13438',
 active: state.timeSpeed === 0
 });

 drawButton({
 col: 1,
 row: 0,
 label: state.timeSpeed > 0 ? ' Playing' : ' Play',
 action: 'speed1',
 baseColor: '#107C10',
 active: state.timeSpeed > 0
 });

 drawButton({
 col: 2,
 row: 0,
 label: ' Reset View',
 action: 'reset',
 baseColor: '#0078D4'
 });

 drawButton({
 col: 3,
 row: 0,
 label: state.lasersVisible ? ' Lasers ON' : ' Lasers OFF',
 action: 'togglelasers',
 baseColor: '#00B7C3',
 active: state.lasersVisible
 });

 drawButton({
 col: 0,
 row: 1,
 label: state.orbitsVisible ? ' Orbits ON' : ' Orbits OFF',
 action: 'orbits',
 baseColor: '#0078D4',
 active: state.orbitsVisible
 });

 drawButton({
 col: 1,
 row: 1,
 label: state.labelsVisible ? ' Labels ON' : ' Labels OFF',
 action: 'labels',
 baseColor: '#8764B8',
 active: state.labelsVisible
 });

 drawButton({
 col: 2,
 row: 1,
 label: state.realisticScale ? ' Realistic' : ' Educational',
 action: 'scale',
 baseColor: '#FF8C00',
 active: state.realisticScale
 });

 this.vrQuickNavMap.set('earth', module?.planets?.earth || null);

 drawButton({
 col: 3,
 row: 1,
 label: ' Focus Earth',
 action: 'focus:earth',
 baseColor: '#10893E',
 active: earthName ? state.focusedObject?.userData?.name === earthName : false
 });

 const quickTargets = this.getVRQuickNavTargets().slice(0, 8);

 quickTargets.forEach((target, index) => {
 const row = 2 + Math.floor(index / columns);
 const col = index % columns;
 const isActive = state.focusedObject === target.object;
 drawButton({
 col,
 row,
 label: target.label,
 action: `focus:${target.id}`,
 baseColor: '#005A9E',
 active: isActive
 });
 this.vrQuickNavMap.set(target.id, target.object);
 });

 const extraRow = 2 + Math.ceil(quickTargets.length / columns);

 drawButton({
 col: 0,
 row: extraRow,
 colSpan: 2,
 label: ' Close Menu',
 action: 'hide',
 baseColor: '#69797E'
 });

 drawButton({
 col: 2,
 row: extraRow,
 colSpan: 2,
 label: ' Exit VR',
 action: 'exitvr',
 baseColor: '#D13438'
 });

 const statusHeight = 90;
 const statusY = canvas.height - statusHeight;
 
 // Fluent Design: Status bar with gradient
 const statusGradient = ctx.createLinearGradient(0, statusY, 0, canvas.height);
 statusGradient.addColorStop(0, 'rgba(0, 120, 212, 0.15)');
 statusGradient.addColorStop(1, 'rgba(0, 120, 212, 0.25)');
 ctx.fillStyle = statusGradient;
 ctx.fillRect(0, statusY, canvas.width, statusHeight);

 // Fluent Design: Top border
 ctx.strokeStyle = 'rgba(0, 120, 212, 0.5)';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.moveTo(0, statusY);
 ctx.lineTo(canvas.width, statusY);
 ctx.stroke();

 // Status text with subtle glow
 ctx.shadowColor = '#0078D4';
 ctx.shadowBlur = 8;
 ctx.fillStyle = '#ffffff';
 ctx.font = '600 28px "Segoe UI", Arial, sans-serif';
 ctx.fillText(state.statusMessage, canvas.width / 2, statusY + statusHeight / 2);
 ctx.shadowBlur = 0;

 this.vrButtons = buttons;
 if (this.vrUIPanel) {
 this.vrUIPanel.material.map.needsUpdate = true;
 }
 }

 focusVRTarget(targetId) {
 const app = window.app || this;
 const module = app.solarSystemModule;
 if (!module) return false;

 let target = this.vrQuickNavMap.get(targetId);
 if (!target && typeof module.getQuickNavTargets === 'function') {
 const fallback = module.getQuickNavTargets().find(item => item.id === targetId);
 target = fallback?.object;
 }

 if (!target) {
 this.updateVRStatus(' Target not available');
 return false;
 }

 module.focusOnObject(target, this.camera, this.controls);

 if (typeof module.getObjectInfo === 'function') {
 const info = module.getObjectInfo(target);
 app.uiManager?.updateInfoPanel(info);
 }

 app.uiManager?.setQuickNavValue?.(targetId);

 const name = target.userData?.name || 'Object';
 this.updateVRStatus(` Selected: ${name}`);
 this.requestVRMenuRefresh();
 return true;
 }

 onSelectStart(controller, index) {
 // Handle controller trigger press
 if (DEBUG.VR) console.log(`[VR] Controller ${index} trigger pressed`);
 controller.userData.selecting = true;
 
 // Check if grip button is also held for zoom
 const session = this.renderer.xr.getSession();
 let gripHeld = false;
 if (session) {
 const inputSources = session.inputSources;
 for (let i = 0; i < inputSources.length; i++) {
 const gamepad = inputSources[i].gamepad;
 if (gamepad && gamepad.buttons[1] && gamepad.buttons[1].pressed) {
 gripHeld = true;
 break;
 }
 }
 }
 
 // Setup raycaster for pointing
 const raycaster = new THREE.Raycaster();
 const tempMatrix = new THREE.Matrix4();
 tempMatrix.identity().extractRotation(controller.matrixWorld);
 
 raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
 raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
 
 // First, check for VR UI interaction
 if (this.vrUIPanel && this.vrUIPanel.visible) {
 if (DEBUG.VR) console.log('[VR] Checking UI button clicks');
 const intersects = raycaster.intersectObject(this.vrUIPanel);
 
 if (intersects.length > 0) {
 const uv = intersects[0].uv;
 const canvasWidth = this.vrUICanvas?.width || 1024;
 const canvasHeight = this.vrUICanvas?.height || 640;
 const x = uv.x * canvasWidth;
 const y = (1 - uv.y) * canvasHeight;
 console.log(`[VR] UI clicked at (${Math.round(x)}, ${Math.round(y)})`);
 
 // Check which button was clicked
 let buttonFound = false;
 this.vrButtons.forEach(btn => {
 if (x >= btn.x && x <= btn.x + btn.w && 
 y >= btn.y && y <= btn.y + btn.h) {
 console.log(`[VR] Button clicked: "${btn.label}" - Action: ${btn.action}`);
 this.handleVRAction(btn.action);
 this.flashVRButton(btn);
 buttonFound = true;
 }
 });
 
 if (!buttonFound) {
 console.log(`[VR] No button at (${Math.round(x)}, ${Math.round(y)})`);
 }
 return; // Don't check for object selection if we clicked UI
 }
 }
 
 // If UI wasn't clicked, check for object selection (planets, moons, etc.)
 const intersects = raycaster.intersectObjects(this.scene.children, true);
 
 if (intersects.length > 0) {
 const hitObject = intersects[0].object;
 if (DEBUG.VR) console.log('[VR] Selected:', hitObject.name || hitObject.type);
 
 // Try to focus on the selected object
 const app = window.app || this;
 if (app.solarSystemModule) {
 const module = app.solarSystemModule;
 
 // Check if it's a planet or celestial body
 if (hitObject.name && module.focusOnObject) {
 // If grip+trigger held, zoom VERY close for inspection
 if (gripHeld) {
 this.zoomToObject(hitObject, 'close');
 if (DEBUG.VR) console.log('[VR] Zooming to:', hitObject.name);
 if (this.vrUIPanel) {
 this.updateVRStatus(` Inspecting: ${hitObject.name}`);
 }
 } else {
 // Normal focus
 module.focusOnObject(hitObject, this.camera, this.controls);
 if (DEBUG.VR) console.log('[VR] Focused on:', hitObject.name);
 if (this.vrUIPanel) {
 this.updateVRStatus(` Selected: ${hitObject.name}`);
 }
 }
 }
 }
 }
 }
 
 onSelectEnd(controller, index) {
 // Handle controller trigger release
 controller.userData.selecting = false;
 }
 
 onSqueezeStart(controller, index) {
 // Toggle VR UI with grip button (when not holding trigger)
 const session = this.renderer.xr.getSession();
 let triggerHeld = false;
 if (session) {
 const inputSources = session.inputSources;
 for (let i = 0; i < inputSources.length; i++) {
 const gamepad = inputSources[i].gamepad;
 if (gamepad && gamepad.buttons[0] && gamepad.buttons[0].pressed) {
 triggerHeld = true;
 break;
 }
 }
 }
 
 // Only toggle menu if trigger not held (grip alone = menu, grip+trigger = zoom)
 if (!triggerHeld && this.vrUIPanel) {
 this.vrUIPanel.visible = !this.vrUIPanel.visible;
 
 // Position panel in front of user when showing
 if (this.vrUIPanel.visible) {
 // Place 2.5 meters in front, at eye level
 this.vrUIPanel.position.set(0, 1.6, -2.5);
 // Face the user (rotate to face +Z direction)
 this.vrUIPanel.rotation.set(0, 0, 0);
 
 // Always force lasers ON when menu opens
 // This ensures user can interact with the menu even if lasers were hidden
 this.lasersVisible = true;
 this.controllers.forEach(controller => {
 const laser = controller.getObjectByName('laser');
 const pointer = controller.getObjectByName('pointer');
 if (laser) laser.visible = true;
 if (pointer) pointer.visible = true;
 });
 
 if (DEBUG.VR) {
 console.log('[VR] Lasers enabled for menu interaction');
 console.log('[VR] Menu OPENED');
 console.log('[VR] Position:', this.vrUIPanel.position);
 console.log('[VR] Press grip button again to close');
 }
 } else {
 if (DEBUG.VR) console.log('[VR] Menu CLOSED');
 // Lasers keep their current state when menu closes (user may have toggled them in menu)
 }
 
 // Update status text on panel
 if (this.vrUIPanel.visible) {
 this.updateVRStatus('VR Menu Active - Use laser to interact');
 }
 } else if (triggerHeld) {
 if (DEBUG.VR) console.log(' Grip+Trigger held - zoom mode (menu disabled)');
 } else if (!this.vrUIPanel) {
 console.warn(' VR UI Panel not initialized!');
 }
 }
 
 zoomToObject(object, zoomLevel = 'normal') {
 // VR zoom function - moves dolly close to object
 if (!this.dolly || !object) return;
 
 const targetPosition = new THREE.Vector3();
 object.getWorldPosition(targetPosition);
 
 // Calculate distance based on object size and zoom level
 let objectRadius = 1;
 if (object.userData && object.userData.radius) {
 objectRadius = object.userData.radius;
 } else if (object.geometry && object.geometry.boundingSphere) {
 object.geometry.computeBoundingSphere();
 objectRadius = object.geometry.boundingSphere.radius;
 }
 
 // Distance multipliers
 let distanceMultiplier;
 switch(zoomLevel) {
 case 'close':
 distanceMultiplier = 2.5; // Very close for inspection
 break;
 case 'medium':
 distanceMultiplier = 5;
 break;
 case 'far':
 default:
 distanceMultiplier = 10;
 break;
 }
 
 const distance = objectRadius * distanceMultiplier;
 
 // Get camera direction
 const xrCamera = this.renderer.xr.getCamera();
 const cameraDirection = new THREE.Vector3();
 xrCamera.getWorldDirection(cameraDirection);
 
 // Move dolly to position behind object (from camera perspective)
 const newPosition = targetPosition.clone().sub(
 cameraDirection.multiplyScalar(distance)
 );
 
 // Smoothly move dolly
 this.dolly.position.copy(newPosition);
 
 console.log(`?? VR Zoomed to ${object.userData?.name || 'object'} at distance ${distance.toFixed(2)}`);
 }
 
 handleVRAction(action) {
 console.log(` Executing VR Action: "${action}"`);

 const app = window.app || this;
 if (!app) {
 console.error(' VR Action failed: app not found');
 return;
 }

 if (!action) {
 this.updateVRStatus(' No action provided');
 return;
 }

 const scheduleRefresh = (delay = 0) => {
 if (delay > 0) {
 setTimeout(() => this.requestVRMenuRefresh(), delay);
 } else {
 this.requestVRMenuRefresh();
 }
 };

 if (action.startsWith('focus:')) {
 const targetId = action.split(':')[1];
 if (!targetId) {
 this.updateVRStatus(' No target specified');
 return;
 }
 const success = this.focusVRTarget(targetId);
 if (success) {
 scheduleRefresh(80);
 }
 return;
 }

 switch (action) {
 case 'speed0':
 app.timeSpeed = 0;
 this.updateVRStatus('⏸ Paused');
 scheduleRefresh();
 break;

 case 'speed1':
 app.timeSpeed = 1;
 this.updateVRStatus(' Playing');
 scheduleRefresh();
 break;

 case 'orbits':
 document.getElementById('toggle-orbits')?.click();
 this.updateVRStatus(' Orbits toggled');
 scheduleRefresh(120);
 break;

 case 'labels':
 document.getElementById('toggle-details')?.click();
 this.updateVRStatus(' Labels toggled');
 scheduleRefresh(120);
 break;

 case 'scale':
 document.getElementById('toggle-scale')?.click();
 this.updateVRStatus(' Scale mode switched');
 scheduleRefresh(120);
 break;

 case 'togglelasers':
 this.lasersVisible = !this.lasersVisible;
 this.controllers.forEach(controller => {
 const laser = controller.getObjectByName('laser');
 const pointer = controller.getObjectByName('pointer');
 if (laser) laser.visible = this.lasersVisible;
 if (pointer) pointer.visible = this.lasersVisible;
 });
 this.updateVRStatus(` Lasers ${this.lasersVisible ? 'ON' : 'OFF'}`);
 scheduleRefresh();
 break;

 case 'reset':
 this.resetCamera();
 if (app.solarSystemModule) {
 app.solarSystemModule.focusedObject = null;
 }
 this.updateVRStatus(' View reset');
 scheduleRefresh();
 break;

 case 'earth':
 this.handleVRAction('focus:earth');
 break;

 case 'hide':
 if (DEBUG.VR) console.log(' Hiding VR menu');
 if (this.vrUIPanel) {
 this.vrUIPanel.visible = false;
 }
 this.updateVRStatus('VR menu hidden');
 break;

 case 'exitvr':
 if (DEBUG.VR) console.log(' Exiting VR mode');
 if (this.renderer.xr.isPresenting) {
 const session = this.renderer.xr.getSession();
 session?.end().then(() => console.log(' VR session ended'))
 .catch(err => console.error(' Error ending VR session:', err));
 }
 break;

 default:
 console.warn(` Unknown VR action: "${action}"`);
 this.updateVRStatus(` Unknown action: ${action}`);
 break;
 }
 }

 flashVRButton(btn) {
 this.vrFlashAction = btn?.action || null;
 this.requestVRMenuRefresh();
 if (this.vrFlashTimeout) {
 clearTimeout(this.vrFlashTimeout);
 }
 this.vrFlashTimeout = setTimeout(() => {
 this.vrFlashAction = null;
 this.requestVRMenuRefresh();
 }, 180);
 }

 updateVRStatus(message) {
 this.vrStatusMessage = message || 'Ready';
 this.requestVRMenuRefresh();
 }

 updateVRUI() {
 this.requestVRMenuRefresh();
 }
 
 updateLaserPointers() {
 // Update laser pointer colors based on what they're pointing at
 if (!this.renderer.xr.isPresenting || !this.controllers) return;
 
 // Check if sprint mode is active (check trigger buttons)
 let sprintActive = false;
 const session = this.renderer.xr.getSession();
 if (session) {
 const inputSources = session.inputSources;
 for (let i = 0; i < inputSources.length; i++) {
 const gamepad = inputSources[i].gamepad;
 if (gamepad && gamepad.buttons.length > 0 && gamepad.buttons[0].pressed) {
 sprintActive = true;
 break;
 }
 }
 }
 
 this.controllers.forEach((controller, index) => {
 const laser = controller.getObjectByName('laser');
 const pointer = controller.getObjectByName('pointer');
 const cone = controller.getObjectByName('cone');
 
 if (!laser) return;
 
 // Setup raycaster
 const raycaster = new THREE.Raycaster();
 const tempMatrix = new THREE.Matrix4();
 tempMatrix.identity().extractRotation(controller.matrixWorld);
 
 raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
 raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
 
 // Check what we're pointing at
 const intersects = raycaster.intersectObjects(this.scene.children, true);
 
 // Change color based on sprint mode and what we're hitting
 if (sprintActive) {
 // SPRINT MODE - ORANGE/RED laser
 laser.material.color.setHex(0xff6600);
 if (pointer) pointer.material.color.setHex(0xff6600);
 if (cone) cone.material.color.setHex(0xff6600);
 } else if (intersects.length > 0 && intersects[0].distance < 10) {
 // Pointing at something - make it GREEN
 laser.material.color.setHex(0x00ff00);
 if (pointer) pointer.material.color.setHex(0x00ff00);
 if (cone) cone.material.color.setHex(0x00ff00);
 } else {
 // Not pointing at anything - CYAN
 laser.material.color.setHex(0x00ffff);
 if (pointer) pointer.material.color.setHex(0x00ffff);
 if (cone) cone.material.color.setHex(0x00ffff);
 }
 
 // Update pointer position
 if (intersects.length > 0 && intersects[0].distance < 10) {
 const hitDistance = Math.min(intersects[0].distance, 10);
 if (pointer) pointer.position.set(0, 0, -hitDistance);
 } else {
 if (pointer) pointer.position.set(0, 0, -10);
 }
 });
 }
 
 updateXRMovement() {
 // Only update in VR/AR mode
 if (!this.renderer.xr.isPresenting) return;
 
 // Ensure dolly exists
 if (!this.dolly) {
 console.warn(' Dolly not found!');
 return;
 }
 
 // Get controller inputs for movement
 const session = this.renderer.xr.getSession();
 if (!session) return;
 
 const inputSources = session.inputSources;
 
 // FIX: Use DOLLY rotation for consistent movement direction
 // Get dolly's forward direction (based on its rotation)
 const dollyForward = new THREE.Vector3(0, 0, -1);
 dollyForward.applyQuaternion(this.dolly.quaternion);
 dollyForward.y = 0; // Keep horizontal
 dollyForward.normalize();
 
 // Get dolly's right direction (perpendicular to forward)
 const dollyRight = new THREE.Vector3();
 dollyRight.crossVectors(dollyForward, new THREE.Vector3(0, 1, 0)).normalize();
 
 // Track if trigger is held for sprint
 let sprintMultiplier = 1.0;
 
 for (let i = 0; i < inputSources.length; i++) {
 const inputSource = inputSources[i];
 const gamepad = inputSource.gamepad;
 const handedness = inputSource.handedness;
 
 if (!gamepad) {
 if (Math.random() < 0.01) {
 console.warn(` No gamepad for controller ${i}`);
 }
 continue;
 }
 
 // ============================================
 // THUMBSTICK PRESS (Button 3) - TOGGLE PAUSE
 // ============================================
 const thumbstickButton = gamepad.buttons[3]; // Thumbstick press
 if (thumbstickButton && thumbstickButton.pressed) {
 // Check if this is a new press (not held from previous frame)
 const prevState = this.previousButtonStates[i][3] || false;
 if (!prevState) {
 // NEW PRESS - Toggle pause
 const app = window.app || this;
 if (app.timeSpeed === 0) {
 app.timeSpeed = 1;
 this.updateVRStatus(' Playing');
 if (DEBUG.VR) console.log(' Thumbstick pressed - PLAY');
 } else {
 app.timeSpeed = 0;
 this.updateVRStatus('⏸ Paused');
 if (DEBUG.VR) console.log(' Thumbstick pressed - PAUSE');
 }
 this.requestVRMenuRefresh();
 }
 this.previousButtonStates[i][3] = true;
 } else {
 this.previousButtonStates[i][3] = false;
 }
 
 // Check trigger for sprint (button 0 = trigger)
 if (gamepad.buttons.length > 0 && gamepad.buttons[0].pressed) {
 sprintMultiplier = 3.0;
 }
 
 // Get thumbstick axes (Quest uses axes 2 & 3)
 let stickX = 0, stickY = 0;
 if (gamepad.axes.length >= 4) {
 stickX = gamepad.axes[2];
 stickY = gamepad.axes[3];
 } else if (gamepad.axes.length >= 2) {
 stickX = gamepad.axes[0];
 stickY = gamepad.axes[1];
 }
 
 const deadzone = 0.15;
 
 // ============================================
 // LEFT CONTROLLER: MOVEMENT (like FPS games)
 // ============================================
 if (handedness === 'left') {
 const baseSpeed = 0.25 * sprintMultiplier;
 
 // Forward/Backward & Strafe
 if (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone) {
 // FORWARD/BACKWARD: Push stick FORWARD to move FORWARD
 // Use dolly's forward direction (not camera) for consistent movement
 // In VR controllers, pushing stick forward gives NEGATIVE Y value
 this.dolly.position.add(dollyForward.clone().multiplyScalar(-stickY * baseSpeed));
 
 // STRAFE LEFT/RIGHT: Use dolly's right direction
 this.dolly.position.add(dollyRight.clone().multiplyScalar(stickX * baseSpeed));
 }
 
 // UP/DOWN with X/Y buttons
 if (gamepad.buttons[4] && gamepad.buttons[4].pressed) {
 // X button: Move DOWN
 this.dolly.position.y -= baseSpeed * 0.8;
 }
 if (gamepad.buttons[5] && gamepad.buttons[5].pressed) {
 // Y button: Move UP
 this.dolly.position.y += baseSpeed * 0.8;
 }
 }
 
 // ============================================
 // RIGHT CONTROLLER: TURN & VERTICAL
 // ============================================
 if (handedness === 'right') {
 const turnSpeed = 0.03;
 const vertSpeed = 0.25 * sprintMultiplier;
 
 // TURN LEFT/RIGHT
 if (Math.abs(stickX) > deadzone) {
 this.dolly.rotation.y -= stickX * turnSpeed;
 }
 
 // VERTICAL MOVEMENT
 if (Math.abs(stickY) > deadzone) {
 // Negative Y = up, Positive Y = down (inverted for intuitive)
 this.dolly.position.y += -stickY * vertSpeed;
 }
 
 // UP/DOWN with A/B buttons
 if (gamepad.buttons[4] && gamepad.buttons[4].pressed) {
 // A button: Move DOWN
 this.dolly.position.y -= 0.2 * sprintMultiplier;
 }
 if (gamepad.buttons[5] && gamepad.buttons[5].pressed) {
 // B button: Move UP
 this.dolly.position.y += 0.2 * sprintMultiplier;
 }
 }
 }
 }

 onResize() {
 this.camera.aspect = window.innerWidth / window.innerHeight;
 this.camera.updateProjectionMatrix();
 this.renderer.setSize(window.innerWidth, window.innerHeight);
 if (this.labelRenderer) {
 this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
 }
 }

 clear() {
 // Properly dispose of all objects to prevent memory leaks
 const objectsToRemove = [];
 this.scene.traverse((object) => {
 if (object !== this.camera && !Object.values(this.lights).includes(object)) {
 objectsToRemove.push(object);
 }
 });

 objectsToRemove.forEach(object => {
 if (object.geometry) object.geometry.dispose();
 if (object.material) {
 if (Array.isArray(object.material)) {
 object.material.forEach(mat => mat.dispose());
 } else {
 object.material.dispose();
 }
 }
 this.scene.remove(object);
 });
 }

 resetCamera() {
 const { x, y, z } = CONFIG.CAMERA.startPos;
 this.camera.position.set(x, y, z);
 this.controls.target.set(0, 0, 0);
 this.controls.update();
 }

 animate(callback) {
 this.renderer.setAnimationLoop(() => {
 try {
 this.controls.update();
 callback();
 this.renderer.render(this.scene, this.camera);
 if (this.labelRenderer) {
 this.labelRenderer.render(this.scene, this.camera);
 }
 } catch (error) {
 console.error(' ERROR in animation loop:', error);
 console.error(' Stack:', error.stack);
 // Don't stop the loop, just log the error
 }
 });
 }

 updateBrightness(multiplier) {
 if (this.lights.ambient) {
 this.lights.ambient.intensity = 0.3 + (multiplier * 1.5);
 }
 if (this.lights.hemisphere) {
 this.lights.hemisphere.intensity = 0.2 + (multiplier * 0.8);
 }
 if (this.lights.camera) {
 this.lights.camera.intensity = multiplier * 2;
 }
 }

 showError(message) {
 const loading = document.getElementById('loading');
 if (loading) {
 loading.querySelector('h2').textContent = '?? Error';
 loading.querySelector('#loading-text').textContent = message;
 loading.classList.remove('hidden');
 }
 }

 dispose() {
 // Clean up resources
 this.clear();
 if (this.renderer) {
 this.renderer.dispose();
 }
 if (this.controls) {
 this.controls.dispose();
 }
 window.removeEventListener('resize', this.onResize);
 }
}

// ===========================
// UI MANAGER
// ===========================
class UIManager {
 constructor() {
 // Cache DOM elements
 this.elements = {
 loading: document.getElementById('loading'),
 infoPanel: document.getElementById('info-panel'),
 controls: document.getElementById('controls'),
 explorer: document.getElementById('object-list'),
 helpModal: document.getElementById('help-modal'),
 objectName: document.getElementById('object-name'),
 objectType: document.getElementById('object-type'),
 objectDistance: document.getElementById('object-distance'),
 objectSize: document.getElementById('object-size'),
 objectDescription: document.getElementById('object-description'),
 explorerTitle: document.getElementById('explorer-title'),
 explorerContent: document.getElementById('explorer-content'),
 helpContent: document.getElementById('help-content'),
 loadingText: document.getElementById('loading-text'),
 loadingProgressBar: document.getElementById('loading-progress-bar'),
 loadingPercentage: document.getElementById('loading-percentage')
 };
 
 this.validateElements();
 }

 validateElements() {
 const missing = [];
 for (const [key, element] of Object.entries(this.elements)) {
 if (!element) missing.push(key);
 }
 if (missing.length > 0) {
 console.warn('Missing UI elements:', missing);
 }
 }

 showLoading(message = 'Loading...') {
 if (this.elements.loadingText) {
 this.elements.loadingText.textContent = message;
 }
 if (this.elements.loading) {
 this.elements.loading.classList.remove('hidden');
 }
 }

 updateLoadingProgress(progress, message = null) {
 // Update progress bar (0-100)
 if (this.elements.loadingProgressBar) {
 this.elements.loadingProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
 }
 
 // Update percentage text
 if (this.elements.loadingPercentage) {
 this.elements.loadingPercentage.textContent = `${Math.round(progress)}%`;
 }
 
 // Update message if provided
 if (message && this.elements.loadingText) {
 this.elements.loadingText.textContent = message;
 }
 }

 hideLoading() {
 if (this.elements.loading) {
 this.elements.loading.classList.add('hidden');
 }
 // Show controls and info panel (explorer removed - using header dropdown instead)
 ['infoPanel', 'controls'].forEach(key => {
 if (this.elements[key]) {
 this.elements[key].classList.remove('hidden');
 }
 });
 }

 updateInfoPanel(info) {
 const updates = {
 objectName: info.name,
 objectType: info.type,
 objectDistance: info.distance,
 objectSize: info.size,
 objectDescription: info.description
 };

 for (const [key, value] of Object.entries(updates)) {
 if (this.elements[key]) {
 this.elements[key].textContent = value;
 }
 }

 if (this.elements.infoPanel) {
 this.elements.infoPanel.classList.remove('hidden');
 }
 }

 updateExplorer(title, categories) {
 if (this.elements.explorerTitle) {
 this.elements.explorerTitle.textContent = title;
 }

 if (!this.elements.explorerContent) return;

 // Use DocumentFragment for better performance
 const fragment = document.createDocumentFragment();
 
 categories.forEach(category => {
 const categoryDiv = document.createElement('div');
 categoryDiv.className = 'object-category';
 
 const header = document.createElement('h4');
 header.textContent = category.title;
 categoryDiv.appendChild(header);
 
 category.items.forEach(item => {
 const itemDiv = document.createElement('div');
 itemDiv.className = 'object-item';
 itemDiv.textContent = item.name;
 itemDiv.onclick = item.onClick;
 categoryDiv.appendChild(itemDiv);
 });
 
 fragment.appendChild(categoryDiv);
 });

 this.elements.explorerContent.innerHTML = '';
 this.elements.explorerContent.appendChild(fragment);
 }

 showHelp(content) {
 if (this.elements.helpContent) {
 this.elements.helpContent.innerHTML = content;
 }
 if (this.elements.helpModal) {
 this.elements.helpModal.classList.remove('hidden');
 }
 }

 closeInfoPanel() {
 if (this.elements.infoPanel) {
 this.elements.infoPanel.classList.add('hidden');
 }
 }

 closeHelpModal() {
 if (this.elements.helpModal) {
 this.elements.helpModal.classList.add('hidden');
 }
 }
 
 setupSolarSystemUI(solarSystemModule, sceneManager) {
 // Setup explorer panel with Solar System content
 const focusCallback = (obj) => {
 if (obj) {
 const info = solarSystemModule.getObjectInfo(obj);
 this.updateInfoPanel(info);
 solarSystemModule.focusOnObject(obj, sceneManager.camera, sceneManager.controls);
 }
 };
 
 if (solarSystemModule && typeof solarSystemModule.getExplorerContent === 'function') {
 const explorerContent = solarSystemModule.getExplorerContent(focusCallback);
 if (explorerContent && Array.isArray(explorerContent)) {
 this.updateExplorer(' Explore the Solar System', explorerContent);
 } else {
 console.error(' getExplorerContent returned invalid data:', explorerContent);
 }
 } else {
 console.error(' solarSystemModule or getExplorerContent method not found');
 }
 
 // Setup time speed control
 this.setupTimeSpeedControl();
 
 // Hide loading
 this.hideLoading();
 }
 
 setupTimeSpeedControl() {
 const timeSpeedSlider = document.getElementById('time-speed');
 const timeSpeedLabel = document.getElementById('time-speed-label');
 
 if (!timeSpeedSlider || !timeSpeedLabel) {
 console.warn('Time speed controls not found');
 return;
 }
 
 // Original speed scale: 0 to 10 with 0.5 increments (matches keyboard shortcuts)
 const updateSpeed = (value) => {
 const speed = parseFloat(value);
 
 // Update app timeSpeed
 if (window.app) {
 window.app.timeSpeed = speed;
 }
 
 // Update label
 if (speed === 0) {
 timeSpeedLabel.textContent = 'Paused';
 } else if (speed === 1) {
 timeSpeedLabel.textContent = '1x Real-time';
 } else {
 timeSpeedLabel.textContent = `${speed}x`;
 }
 
 console.log(`[Speed] Changed to: ${speed}x`);
 };
 
 // Add event listener
 timeSpeedSlider.addEventListener('input', (e) => {
 updateSpeed(e.target.value);
 });
 
 // Initialize with current slider value
 updateSpeed(timeSpeedSlider.value);
 }
}
// ===========================
// SOLAR SYSTEM MODULE
// ===========================
class SolarSystemModule {
 constructor(uiManager) {
 this.uiManager = uiManager;
 this.objects = [];
 this.planets = {};
 this.moons = {};
 this.sun = null;
 this.starfield = null;
 this.asteroidBelt = null;
 this.kuiperBelt = null;
 this.orbits = [];
 this.focusedObject = null;
 this.distantStars = [];
 this.nebulae = [];
 this.galaxies = [];
 this.comets = [];
 this.satellites = [];
 this.spacecraft = [];
 this.constellations = [];
 
 // Scale mode: false = educational (compressed), true = realistic (vast)
 this.realisticScale = false;
 
 // Comet tails visibility: false = hidden (better for VR/AR)
 this.cometTailsVisible = false;
 
 // Orbits visibility: true = visible by default
 this.orbitsVisible = true;
 
 // Constellations visibility: true = visible by default
 this.constellationsVisible = true;
 
 // Geometry cache for reuse
 this.geometryCache = new Map();
 
 // Real astronomical data for day/night cycles
 this.ASTRONOMICAL_DATA = {
 mercury: {
 rotationPeriod: 1407.6, // hours (58.6 Earth days)
 axialTilt: 0.034, // degrees
 retrograde: false,
 orbitalPeriod: 88 // Earth days
 },
 venus: {
 rotationPeriod: 5832.5, // hours (243 Earth days)
 axialTilt: 177.4, // degrees (almost upside down)
 retrograde: true, // rotates backwards!
 orbitalPeriod: 225 // Earth days
 },
 earth: {
 rotationPeriod: 23.93, // hours
 axialTilt: 23.44, // degrees
 retrograde: false,
 orbitalPeriod: 365.25 // Earth days (baseline)
 },
 mars: {
 rotationPeriod: 24.62, // hours
 axialTilt: 25.19, // degrees
 retrograde: false,
 orbitalPeriod: 687 // Earth days
 },
 jupiter: {
 rotationPeriod: 9.93, // hours (fastest rotation!)
 axialTilt: 3.13, // degrees
 retrograde: false,
 orbitalPeriod: 4333 // Earth days (~11.9 years)
 },
 saturn: {
 rotationPeriod: 10.66, // hours
 axialTilt: 26.73, // degrees
 retrograde: false,
 orbitalPeriod: 10759 // Earth days (~29.5 years)
 },
 uranus: {
 rotationPeriod: 17.24, // hours
 axialTilt: 97.77, // degrees (rotates on its side!)
 retrograde: true,
 orbitalPeriod: 30687 // Earth days (~84 years)
 },
 neptune: {
 rotationPeriod: 16.11, // hours
 axialTilt: 28.32, // degrees
 retrograde: false,
 orbitalPeriod: 60190 // Earth days (~165 years)
 },
 moon: {
 rotationPeriod: 655.7, // hours (27.3 Earth days - tidally locked)
 axialTilt: 6.68, // degrees
 retrograde: false,
 orbitalPeriod: 27.3 // Earth days
 }
 };
 
 // Time acceleration factor (1 = real-time, higher = faster)
 this.timeAcceleration = 360; // 360x faster = 1 Earth day in 4 minutes
 this.realTimeStart = Date.now();
 }
 
 getGeometry(type, ...params) {
 const key = `${type}_${params.join('_')}`;
 if (!this.geometryCache.has(key)) {
 let geometry;
 if (type === 'sphere') {
 geometry = new THREE.SphereGeometry(...params);
 } else if (type === 'ring') {
 geometry = new THREE.RingGeometry(...params);
 }
 this.geometryCache.set(key, geometry);
 }
 return this.geometryCache.get(key);
 }

 async init(scene) {
 const initStartTime = performance.now();
 const t = window.t || ((key) => key);
 
 // Define all loading steps with progress and tasks
 const loadingSteps = [
 { progress: 5, message: t('creatingSun'), task: () => this.createSun(scene) },
 { progress: 8, message: t('creatingMercury'), task: () => {} },
 { progress: 12, message: t('creatingVenus'), task: () => {} },
 { progress: 16, message: t('creatingEarth'), task: () => {} },
 { progress: 20, message: t('creatingMars'), task: () => this.createInnerPlanets(scene) },
 { progress: 25, message: t('creatingJupiter'), task: () => {} },
 { progress: 30, message: t('creatingSaturn'), task: () => {} },
 { progress: 35, message: t('creatingUranus'), task: () => {} },
 { progress: 40, message: t('creatingNeptune'), task: () => this.createOuterPlanets(scene) },
 { progress: 45, message: t('creatingAsteroidBelt'), task: () => this.createAsteroidBelt(scene) },
 { progress: 50, message: t('creatingKuiperBelt'), task: () => this.createKuiperBelt(scene) },
 { progress: 55, message: t('creatingStarfield'), task: () => this.createStarfield(scene) },
 { progress: 60, message: t('creatingOrbitalPaths'), task: () => this.createOrbitalPaths(scene) },
 { progress: 65, message: t('creatingConstellations'), task: () => this.createConstellations(scene) },
 { progress: 70, message: t('creatingDistantStars'), task: () => this.createDistantStars(scene) },
 { progress: 75, message: t('creatingNebulae'), task: () => this.createNebulae(scene) },
 { progress: 80, message: t('creatingGalaxies'), task: () => this.createGalaxies(scene) },
 { progress: 85, message: t('creatingNearbyStars'), task: () => this.createNearbyStars(scene) },
 { progress: 88, message: t('creatingExoplanets'), task: () => this.createExoplanets(scene) },
 { progress: 91, message: t('creatingComets'), task: () => this.createComets(scene) },
 { progress: 94, message: t('creatingSatellites'), task: () => this.createSatellites(scene) },
 { progress: 97, message: t('creatingSpacecraft'), task: () => this.createSpacecraft(scene) },
 { progress: 100, message: t('creatingLabels'), task: () => this.createLabels() }
 ];

 // Execute steps sequentially with UI updates
 const executeStep = async (stepIndex) => {
 if (stepIndex >= loadingSteps.length) {
 // All steps complete
 if (this.uiManager && typeof this.refreshExplorerContent === 'function') {
 this.refreshExplorerContent();
 }
 
 const totalTime = performance.now() - initStartTime;
 if (DEBUG.PERFORMANCE) {
 console.log(` Full initialization completed in ${totalTime.toFixed(0)}ms`);
 console.log(` Total objects: Planets=${Object.keys(this.planets).length}, Satellites=${this.satellites.length}, Spacecraft=${this.spacecraft.length}`);
 }
 
 // Signal that loading is complete
 if (window.app && typeof window.app.startExperience === 'function') {
 window.app.startExperience();
 }
 return;
 }

 const step = loadingSteps[stepIndex];

 // Update UI first
 if (this.uiManager) {
 this.uiManager.updateLoadingProgress(step.progress, step.message);
 }

 // Yield to browser to allow UI repaint
 await new Promise(resolve => requestAnimationFrame(resolve));

 // Execute the loading task
 try {
 await step.task();
 } catch (error) {
 console.error(` Error in loading step ${stepIndex}:`, error);
 }

 // Move to next step
 await executeStep(stepIndex + 1);
 };

 // Start the loading sequence
 await executeStep(0);
 }

 createSun(scene) {
 // HYPERREALISTIC Sun with realistic size
 // Sun: 1,391,000 km / 12,742 km = 109.2 (should be MASSIVE)
 // But we'll scale it down to 15 for visibility while still being impressive
 const sunRadius = 15; // Compromise between realism and usability
 const sunGeometry = new THREE.SphereGeometry(sunRadius, 128, 128); // Higher detail
 
 // Load real NASA Sun texture (with procedural fallback)
 const sunTexture = this.createSunTextureReal(2048);
 const sunBumpMap = this.createSunBumpMap(2048);
 
 const sunMaterial = new THREE.MeshStandardMaterial({
 map: sunTexture,
 bumpMap: sunBumpMap,
 bumpScale: 0.5,
 emissive: 0xff6600,
 emissiveMap: sunTexture,
 emissiveIntensity: 2.5,
 toneMapped: false,
 roughness: 1.0,
 metalness: 0.0
 });
 
 this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
 this.sun.userData = {
 name: 'Sun',
 type: 'Star',
 distance: 0,
 radius: sunRadius,
 description: ' The Sun is a G-type main-sequence star (yellow dwarf) containing 99.86% of the Solar System\'s mass. Surface temperature: 5,778K. Age: 4.6 billion years. It fuses 600 million tons of hydrogen into helium every second!',
 funFact: 'The Sun is so big that 1.3 million Earths could fit inside it!',
 realSize: '1,391,000 km diameter'
 };
 
 // Sun lighting - PointLight from center with NO DECAY for realistic solar system lighting
 // In space, light doesn't decay with distance (inverse square law applies but over HUGE distances)
 // BALANCED: Reduced intensity to prevent washing out textures on sunny side
 const sunLight = new THREE.PointLight(0xFFFAE8, 9, 0, 0); // Warm white, reduced intensity (10→9)
 sunLight.name = 'sunLight';
 sunLight.position.set(0, 0, 0);
 sunLight.castShadow = CONFIG.QUALITY.shadows;
 sunLight.shadow.mapSize.width = 4096; // Higher resolution shadows
 sunLight.shadow.mapSize.height = 4096;
 sunLight.shadow.camera.near = 1;
 sunLight.shadow.camera.far = 5000; // Increased for distant planets
 sunLight.shadow.bias = -0.0005; // Reduce shadow artifacts
 sunLight.shadow.radius = 2; // Softer shadows
 scene.add(sunLight);
 this.sun.userData.sunLight = sunLight;
 
 // Ambient light - significantly increased to see dark sides clearly
 const ambientLight = new THREE.AmbientLight(0x444466, 2.0); // Bright ambient for dark side visibility
 ambientLight.name = 'ambientLight';
 scene.add(ambientLight);
 
 if (DEBUG.enabled) {
 console.log(' Lighting: Sun intensity 9 (warm white), Ambient 2.0, Tone mapping 1.2');
 console.log(' - Enhanced dark side visibility with increased ambient light');
 console.log(' - Higher exposure prevents dark tone crushing');
 console.log(' - Ambient light makes dark sides clearly visible');
 console.log(' - Sun light reaches all planets without decay');
 console.log(' - Eclipses will cast 4K shadows');
 }
 
 // Multi-layer corona for realistic glow
 const coronaLayers = [
 { size: 11.5, color: 0xffdd88, opacity: 0.25 },
 { size: 13, color: 0xffaa44, opacity: 0.18 },
 { size: 15, color: 0xff8822, opacity: 0.12 },
 { size: 18, color: 0xff6600, opacity: 0.06 }
 ];
 
 coronaLayers.forEach(layer => {
 const coronaGeometry = new THREE.SphereGeometry(layer.size, 32, 32);
 const coronaMaterial = new THREE.MeshBasicMaterial({
 color: layer.color,
 transparent: true,
 opacity: layer.opacity,
 side: THREE.BackSide,
 blending: THREE.AdditiveBlending,
 depthWrite: false, // Don't block objects behind the glow
 depthTest: true // But still respect depth for proper rendering
 });
 const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
 this.sun.add(corona);
 });
 
 // Add solar flare particles
 const flareGeometry = new THREE.BufferGeometry();
 const flareCount = 200;
 const flarePositions = new Float32Array(flareCount * 3);
 const flareSizes = new Float32Array(flareCount);
 
 for (let i = 0; i < flareCount; i++) {
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const r = 10.5 + Math.random() * 2;
 
 flarePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
 flarePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
 flarePositions[i * 3 + 2] = r * Math.cos(phi);
 flareSizes[i] = 1 + Math.random() * 3;
 }
 
 flareGeometry.setAttribute('position', new THREE.BufferAttribute(flarePositions, 3));
 flareGeometry.setAttribute('size', new THREE.BufferAttribute(flareSizes, 1));
 
 const flareMaterial = new THREE.PointsMaterial({
 color: 0xffff00,
 size: 2,
 transparent: true,
 opacity: 0.8,
 blending: THREE.AdditiveBlending,
 sizeAttenuation: false
 });
 
 const flares = new THREE.Points(flareGeometry, flareMaterial);
 this.sun.add(flares);
 this.sun.userData.flares = flares;
 
 scene.add(this.sun);
 this.objects.push(this.sun);
 }

 createInnerPlanets(scene) {
 // REALISTIC SIZES (Earth radius = 1.0 as base)
 // Mercury: 4,879 km / 12,742 km = 0.383
 this.planets.mercury = this.createPlanet(scene, {
 name: 'Mercury',
 radius: 0.383,
 color: 0x8C7853,
 distance: 20,
 speed: 0.04,
 rotationSpeed: 0.004,
 tilt: 0.034,
 description: ' Mercury is the smallest planet and closest to the Sun. Its surface is covered with craters like our Moon. Temperature ranges from -180°C at night to 430°C during the day - the largest temperature swing in the solar system!',
 funFact: 'A year on Mercury (88 Earth days) is shorter than its day (176 Earth days)!',
 realSize: '4,879 km diameter',
 moons: 0
 });

 // Venus: 12,104 km / 12,742 km = 0.950
 this.planets.venus = this.createPlanet(scene, {
 name: 'Venus',
 radius: 0.950,
 color: 0xFFC649,
 distance: 30,
 speed: 0.015,
 rotationSpeed: -0.001,
 tilt: 2.64,
 description: ' Venus is the hottest planet with surface temperature of 465°C due to extreme greenhouse effect. Its atmosphere is 96% CO2 with clouds of sulfuric acid. Venus rotates backwards compared to most planets!',
 funFact: 'Venus is the brightest planet in our sky and is often called Earth\'s "evil twin"',
 realSize: '12,104 km diameter',
 moons: 0,
 emissive: 0xFFC649,
 emissiveIntensity: 0.3
 });

 // Earth: BASE = 1.0 (12,742 km)
 this.planets.earth = this.createPlanet(scene, {
 name: 'Earth',
 radius: 1.0,
 color: 0x2233FF,
 distance: 45,
 speed: 0.01,
 rotationSpeed: 0.02,
 tilt: 23.44,
 description: ' Earth is our home, the only known planet with life! 71% is covered by water, creating the blue color visible from space. The atmosphere protects us from harmful radiation and meteors.',
 funFact: 'Earth is the only planet not named after a god. It travels at 107,000 km/h around the Sun!',
 realSize: '12,742 km diameter',
 moons: 1,
 atmosphere: true
 });

        // Moon: 3,474 km / 12,742 km = 0.273
        // Real distance: 384,400 km / Earth radius (6,371 km) = ~60 Earth radii
        // Real orbital period: 27.32 days vs Earth's 365.25 days = 13.37x faster
        this.createMoon(this.planets.earth, {
            name: 'Moon',
            radius: 0.273,
            color: 0xAAAAAA,
            distance: 4, // Increased from 3 for better visibility
            speed: 0.1337, // 13.37x Earth's speed (0.01 * 13.37) - completes ~13 orbits per Earth year
            rotationSpeed: 0.004, // Moon rotates (tidally locked)
            description: ' Earth\'s Moon is the fifth largest moon in the solar system. It creates tides, stabilizes Earth\'s tilt, and was formed 4.5 billion years ago when a Mars-sized object hit Earth!',
            funFact: 'The Moon is slowly moving away from Earth at 3.8 cm per year!'
        }); // Mars: 6,779 km / 12,742 km = 0.532
 this.planets.mars = this.createPlanet(scene, {
 name: 'Mars',
 radius: 0.532,
 color: 0xCD5C5C,
 distance: 60,
 speed: 0.008,
 rotationSpeed: 0.018,
 tilt: 25.19,
 description: ' Mars, the Red Planet, gets its color from iron oxide (rust). It has the largest volcano (Olympus Mons - 22 km high) and canyon (Valles Marineris - 4,000 km long) in the solar system. Water ice exists at its poles!',
 funFact: 'Mars has seasons like Earth, and its day is only 37 minutes longer than ours!',
 realSize: '6,779 km diameter',
 moons: 2
        });

        // Phobos: ~22 km / 12,742 km = 0.0017 (tiny!)
        // Orbital period: 0.319 days (7.65 hours) vs Mars's 687 days = 2153x faster
        this.createMoon(this.planets.mars, {
            name: 'Phobos',
            radius: 0.002, // Minimum visible size
            color: 0x666666,
            distance: 1.5,
            speed: 17.22, // 2153x Mars's speed (0.008 * 2153) - orbits 3 times per Mars day!
            description: 'Phobos orbits Mars faster than Mars rotates! It rises in the west and sets in the east.'
        });
        // Deimos: ~12 km / 12,742 km = 0.0009
        // Orbital period: 1.263 days (30.3 hours) vs Mars's 687 days = 544x faster
        this.createMoon(this.planets.mars, {
            name: 'Deimos',
            radius: 0.0015, // Minimum visible size
            color: 0x888888,
            distance: 2.5,
            speed: 4.35, // 544x Mars's speed (0.008 * 544)
            description: 'Deimos is the smaller of Mars\' two moons and takes 30 hours to orbit.'
        });
    } createOuterPlanets(scene) {
 // Jupiter: 139,820 km / 12,742 km = 10.97 (MASSIVE!)
 this.planets.jupiter = this.createPlanet(scene, {
 name: 'Jupiter',
 radius: 10.97,
 color: 0xDAA520,
 distance: 100,
 speed: 0.002,
 rotationSpeed: 0.04,
 tilt: 3.13,
 description: ' Jupiter is the largest planet - all other planets could fit inside it! The Great Red Spot is a storm larger than Earth that has raged for at least 400 years. Jupiter has 95 known moons!',
 funFact: 'Jupiter\'s gravity shields Earth from many asteroids and comets!',
 realSize: '139,820 km diameter',
 moons: 4,
 rings: true
 });

 // Jupiter's Galilean moons (realistic sizes)
        // Io: 3,643 km / 12,742 km = 0.286
        // Orbital period: 1.769 days vs Jupiter's 4333 days = 2449x faster
        this.createMoon(this.planets.jupiter, {
            name: 'Io',
            radius: 0.286,
            color: 0xFFFF00,
            distance: 8,
            speed: 4.898, // 2449x Jupiter's speed (0.002 * 2449)
            description: 'Io is the most volcanically active body in the solar system!'
        });
        // Europa: 3,122 km / 12,742 km = 0.245
        // Orbital period: 3.551 days vs Jupiter's 4333 days = 1220x faster
        this.createMoon(this.planets.jupiter, {
            name: 'Europa',
            radius: 0.245,
            color: 0xCCBB99,
            distance: 10,
            speed: 2.44, // 1220x Jupiter's speed (0.002 * 1220)
            description: 'Europa has a global ocean beneath its ice - a potential place for life!'
        });
        // Ganymede: 5,268 km / 12,742 km = 0.413 (larger than Mercury!)
        // Orbital period: 7.155 days vs Jupiter's 4333 days = 606x faster
        this.createMoon(this.planets.jupiter, {
            name: 'Ganymede',
            radius: 0.413,
            color: 0x996633,
            distance: 12,
            speed: 1.212, // 606x Jupiter's speed (0.002 * 606)
            description: 'Ganymede is the largest moon in the solar system, bigger than Mercury!'
        });
        // Callisto: 4,821 km / 12,742 km = 0.378
        // Orbital period: 16.689 days vs Jupiter's 4333 days = 260x faster
        this.createMoon(this.planets.jupiter, {
            name: 'Callisto',
            radius: 0.378,
            color: 0x777777,
            distance: 14,
            speed: 0.52, // 260x Jupiter's speed (0.002 * 260)
            description: 'Callisto is the most heavily cratered object in the solar system!'
        }); // Saturn: 116,460 km / 12,742 km = 9.14 (almost as big as Jupiter!)
 this.planets.saturn = this.createPlanet(scene, {
 name: 'Saturn',
 radius: 9.14,
 color: 0xFAD5A5,
 distance: 150,
 speed: 0.0009,
 rotationSpeed: 0.038,
 tilt: 26.73,
 description: ' Saturn is famous for its spectacular ring system made of ice and rock particles. It\'s the least dense planet - it would float in water! Saturn has 146 known moons including Titan, which has a thick atmosphere.',
 funFact: 'Saturn\'s rings are only 10 meters thick but 280,000 km wide!',
 realSize: '116,460 km diameter',
 moons: 3,
 rings: true,
 prominentRings: true
 });


        // Titan: 5,150 km / 12,742 km = 0.404 (bigger than Mercury!)
        // Orbital period: 15.945 days vs Saturn's 10759 days = 675x faster
        this.createMoon(this.planets.saturn, {
            name: 'Titan',
            radius: 0.404,
            color: 0xFFAA33,
            distance: 10,
            speed: 0.608, // 675x Saturn's speed (0.0009 * 675)
            description: 'Titan has lakes and rivers of liquid methane - the only place besides Earth with liquid on its surface!'
        });
        // Enceladus: 504 km / 12,742 km = 0.040
        // Orbital period: 1.370 days vs Saturn's 10759 days = 7854x faster
        this.createMoon(this.planets.saturn, {
            name: 'Enceladus',
            radius: 0.040,
            color: 0xFFFFFF,
            distance: 7,
            speed: 7.07, // 7854x Saturn's speed (0.0009 * 7854)
            description: 'Enceladus shoots water geysers into space from its subsurface ocean!'
        });
        // Rhea: 1,527 km / 12,742 km = 0.120
        // Orbital period: 4.518 days vs Saturn's 10759 days = 2382x faster
        this.createMoon(this.planets.saturn, {
            name: 'Rhea',
            radius: 0.120,
            color: 0xCCCCCC,
            distance: 12,
            speed: 2.144, // 2382x Saturn's speed (0.0009 * 2382)
            description: 'Rhea may have its own ring system!'
        }); // Uranus: 50,724 km / 12,742 km = 3.98
 this.planets.uranus = this.createPlanet(scene, {
 name: 'Uranus',
 radius: 3.98,
 color: 0x4FD0E7,
 distance: 200,
 speed: 0.0004,
 rotationSpeed: 0.03,
 tilt: 97.77,
 description: ' Uranus is unique - it rotates on its side! This means its poles take turns facing the Sun during its 84-year orbit. Made of water, methane, and ammonia ices, it appears blue-green due to methane in its atmosphere.',
 funFact: 'Uranus was the first planet discovered with a telescope (1781)!',
 realSize: '50,724 km diameter',
 moons: 2,
 rings: true
 });

        // Titania: 1,578 km / 12,742 km = 0.124
        // Orbital period: 8.706 days vs Uranus's 30687 days = 3526x faster
        this.createMoon(this.planets.uranus, {
            name: 'Titania',
            radius: 0.124,
            color: 0xAAAAAA,
            distance: 5,
            speed: 1.410, // 3526x Uranus's speed (0.0004 * 3526)
            description: 'Titania is Uranus\' largest moon with massive canyons!'
        });
        // Miranda: 472 km / 12,742 km = 0.037
        // Orbital period: 1.413 days vs Uranus's 30687 days = 21722x faster
        this.createMoon(this.planets.uranus, {
            name: 'Miranda',
            radius: 0.037,
            color: 0x999999,
            distance: 3.5,
            speed: 8.689, // 21722x Uranus's speed (0.0004 * 21722)
            description: 'Miranda has the most dramatic terrain in the solar system with cliffs 20 km high!'
        }); // Neptune: 49,244 km / 12,742 km = 3.86
 this.planets.neptune = this.createPlanet(scene, {
 name: 'Neptune',
 radius: 3.86,
 color: 0x4169E1,
 distance: 250,
 speed: 0.0001,
 rotationSpeed: 0.032,
 tilt: 28.32,
 description: ' Neptune is the windiest planet with storms reaching 2,100 km/h! Its beautiful blue color comes from methane. Neptune has a large dark spot (storm) similar to Jupiter\'s Great Red Spot.',
 funFact: 'Neptune was discovered by math before being seen - its gravity affected Uranus\'s orbit!',
 realSize: '49,244 km diameter',
 moons: 1,
 rings: true
 });

        // Triton: 2,707 km / 12,742 km = 0.212
        // Orbital period: 5.877 days (retrograde) vs Neptune's 60190 days = 10242x faster
        this.createMoon(this.planets.neptune, {
            name: 'Triton',
            radius: 0.212,
            color: 0xFFCCCC,
            distance: 5,
            speed: -1.024, // -10242x Neptune's speed (negative for retrograde orbit)
            description: 'Triton orbits backwards and has nitrogen geysers! It\'s likely a captured Kuiper Belt object.'
        }); // Pluto: 2,377 km / 12,742 km = 0.187
 this.planets.pluto = this.createPlanet(scene, {
 name: 'Pluto',
 radius: 0.187,
 color: 0xD4A373,
 distance: 300,
 speed: 0.00004,
 rotationSpeed: 0.015,
 tilt: 122.53,
 description: '? Pluto is a dwarf planet in the Kuiper Belt. It has a heart-shaped glacier (Tombaugh Regio), mountains of water ice, and five moons. Pluto and its largest moon Charon are tidally locked - they always show the same face to each other!',
 funFact: 'A year on Pluto lasts 248 Earth years! It hasn\'t completed one orbit since its discovery in 1930.',
 realSize: '2,377 km diameter',
        moons: 1,
            dwarf: true
        });

        // Charon: 1,212 km / 12,742 km = 0.095 (half the size of Pluto!)
        // Orbital period: 6.387 days vs Pluto's 90560 days = 14178x faster
        this.createMoon(this.planets.pluto, {
            name: 'Charon',
            radius: 0.095,
            color: 0xAAAAAA,
            distance: 1.2,
            speed: 0.567, // 14178x Pluto's speed (0.00004 * 14178)
            description: 'Charon is so large relative to Pluto that they form a binary system!'
        });
    } createProceduralTexture(type, size = 512) {
 // Create canvas for procedural texture
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 // Simple noise function (deterministic pseudo-random)
 const noise = (x, y, seed = 0) => {
 const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
 return n - Math.floor(n);
 };
 
 // Multi-octave noise for more natural patterns
 const fbm = (x, y, octaves = 4) => {
 let value = 0;
 let amplitude = 1;
 let frequency = 1;
 let maxValue = 0;
 
 for (let i = 0; i < octaves; i++) {
 value += noise(x * frequency, y * frequency, i) * amplitude;
 maxValue += amplitude;
 amplitude *= 0.5;
 frequency *= 2;
 }
 return value / maxValue;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 switch(type) {
 case 'earth':
 // Earth: Blue oceans, green/brown continents, white poles
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Latitude effect (poles are white)
 const lat = Math.abs(ny - 0.5) * 2; // 0 at equator, 1 at poles
 
 // Continent noise
 const continentNoise = fbm(nx * 4, ny * 4, 6);
 
 // Ice caps at poles
 if (lat > 0.85) {
 // Polar ice caps
 const iceVariation = noise(nx * 20, ny * 20) * 30;
 data[idx] = 240 + iceVariation; // R
 data[idx + 1] = 248 + iceVariation; // G
 data[idx + 2] = 255; // B
 } else if (continentNoise > 0.52) {
 // Land (green/brown)
 const landVariation = noise(nx * 15, ny * 15) * 0.3;
 const greenness = (1 - lat) * 0.4; // More green at equator
 data[idx] = 100 + landVariation * 100; // R
 data[idx + 1] = 80 + greenness * 100; // G
 data[idx + 2] = 50 + landVariation * 50; // B
 } else {
 // Ocean (blue with depth variation)
 const depth = (0.52 - continentNoise) * 2;
 data[idx] = 20 + depth * 30; // R
 data[idx + 1] = 50 + depth * 80; // G
 data[idx + 2] = 120 + depth * 100; // B
 }
 data[idx + 3] = 255; // Alpha
 }
 }
 break;
 
 case 'mars':
 // Mars: Red with darker regions (ancient seas), white poles
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 const lat = Math.abs(ny - 0.5) * 2;
 
 const craterNoise = fbm(nx * 8, ny * 8, 5);
 
 if (lat > 0.88) {
 // Polar ice caps (CO2 and water ice)
 const iceVar = noise(nx * 25, ny * 25) * 40;
 data[idx] = 220 + iceVar;
 data[idx + 1] = 200 + iceVar;
 data[idx + 2] = 190 + iceVar;
 } else {
 // Rusty red surface with variation
 const rust = craterNoise;
 data[idx] = 150 + rust * 100; // R
 data[idx + 1] = 70 + rust * 60; // G
 data[idx + 2] = 30 + rust * 30; // B
 }
 data[idx + 3] = 255;
 }
 }
 break;
 
 case 'moon':
 // Moon: Gray with craters
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Crater patterns
 const craters = fbm(nx * 10, ny * 10, 6);
 const gray = 120 + craters * 80;
 
 data[idx] = gray;
 data[idx + 1] = gray;
 data[idx + 2] = gray * 0.95; // Slight brown tint
 data[idx + 3] = 255;
 }
 }
 break;
 
 case 'jupiter':
 // Jupiter: Horizontal bands
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const ny = y / size;
 
 // Horizontal bands with turbulence
 const bandPattern = Math.sin(ny * Math.PI * 8) * 0.5 + 0.5;
 const turbulence = fbm(x / size * 3, ny * 2, 4) * 0.3;
 const band = bandPattern + turbulence;
 
 if (band > 0.6) {
 // Light bands (tan/cream)
 data[idx] = 230 + turbulence * 20;
 data[idx + 1] = 200 + turbulence * 30;
 data[idx + 2] = 150 + turbulence * 20;
 } else {
 // Dark bands (orange/brown)
 data[idx] = 180 + turbulence * 40;
 data[idx + 1] = 120 + turbulence * 30;
 data[idx + 2] = 60 + turbulence * 20;
 }
 data[idx + 3] = 255;
 }
 }
 break;
 
 case 'saturn':
 // Saturn: Subtle pale bands
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const ny = y / size;
 
 const bandPattern = Math.sin(ny * Math.PI * 6) * 0.3 + 0.7;
 const turbulence = fbm(x / size * 2, ny * 1.5, 3) * 0.2;
 
 data[idx] = 240 * (bandPattern + turbulence);
 data[idx + 1] = 210 * (bandPattern + turbulence);
 data[idx + 2] = 160 * (bandPattern + turbulence);
 data[idx + 3] = 255;
 }
 }
 break;
 }
 
 ctx.putImageData(imageData, 0, 0);
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }

 createCloudTexture(size = 512) {
 // Create wispy cloud patterns
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y, seed = 0) => {
 const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const fbm = (x, y, octaves = 4) => {
 let value = 0;
 let amplitude = 1;
 let frequency = 1;
 let maxValue = 0;
 
 for (let i = 0; i < octaves; i++) {
 value += noise(x * frequency, y * frequency, i) * amplitude;
 maxValue += amplitude;
 amplitude *= 0.5;
 frequency *= 2;
 }
 return value / maxValue;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Wispy cloud pattern
 const cloud = fbm(nx * 6, ny * 6, 6);
 const cloudIntensity = Math.max(0, (cloud - 0.4) * 2);
 
 // White clouds
 const brightness = 255;
 data[idx] = brightness;
 data[idx + 1] = brightness;
 data[idx + 2] = brightness;
 data[idx + 3] = cloudIntensity * 255; // Alpha channel for transparency
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 // ===== HYPERREALISTIC TEXTURE GENERATORS =====
 
 createSunTexture(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 // Gradient from core to edge
 const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
 gradient.addColorStop(0, '#FFFF00');
 gradient.addColorStop(0.5, '#FFCC00');
 gradient.addColorStop(1, '#FF8800');
 ctx.fillStyle = gradient;
 ctx.fillRect(0, 0, size, size);
 
 // Add granulation (convection cells)
 for (let i = 0; i < 5000; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 2 + Math.random() * 4;
 const brightness = 0.85 + Math.random() * 0.15;
 
 ctx.fillStyle = `rgba(255, ${Math.floor(200 * brightness)}, 0, 0.3)`;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 // Add sunspots (cooler, darker regions)
 for (let i = 0; i < 30; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 10 + Math.random() * 30;
 
 // Sunspot umbra (dark center)
 const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
 spotGradient.addColorStop(0, 'rgba(30, 20, 0, 0.8)');
 spotGradient.addColorStop(0.6, 'rgba(100, 60, 0, 0.4)');
 spotGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
 
 ctx.fillStyle = spotGradient;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createSunBumpMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 // Base gray
 ctx.fillStyle = '#808080';
 ctx.fillRect(0, 0, size, size);
 
 // Add granulation bumps
 for (let i = 0; i < 3000; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 2 + Math.random() * 3;
 const height = Math.random();
 
 const gray = Math.floor(128 + height * 80);
 ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 // REMOVED: createEarthNightLights() - was 105 lines of unused city lights code
 
 createEarthTextureReal(size) {
 // Generate procedural city lights for Earth's night side
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 // Start with black (space/ocean)
 ctx.fillStyle = 'black';
 ctx.fillRect(0, 0, size, size);
 
 // Major populated regions (approximate coordinates on texture)
 const cityRegions = [
 // North America
 { x: 0.15, y: 0.35, w: 0.20, h: 0.15, density: 0.8, color: '#ffcc66' },
 // Europe
 { x: 0.52, y: 0.30, w: 0.12, h: 0.10, density: 0.9, color: '#ffdd77' },
 // East Asia (China, Japan, Korea)
 { x: 0.75, y: 0.35, w: 0.15, h: 0.12, density: 1.0, color: '#ffee88' },
 // India
 { x: 0.68, y: 0.42, w: 0.08, h: 0.08, density: 0.85, color: '#ffdd77' },
 // South America (Brazil)
 { x: 0.28, y: 0.62, w: 0.08, h: 0.12, density: 0.6, color: '#ffcc66' },
 // Australia (East Coast)
 { x: 0.82, y: 0.68, w: 0.08, h: 0.08, density: 0.5, color: '#ffcc66' },
 // Middle East
 { x: 0.58, y: 0.42, w: 0.08, h: 0.06, density: 0.5, color: '#ffcc66' },
 // Southeast Asia
 { x: 0.73, y: 0.50, w: 0.08, h: 0.08, density: 0.7, color: '#ffdd77' },
 // Africa (North)
 { x: 0.52, y: 0.50, w: 0.10, h: 0.08, density: 0.3, color: '#ffbb55' },
 // Southern Africa
 { x: 0.54, y: 0.68, w: 0.06, h: 0.06, density: 0.4, color: '#ffcc66' }
 ];
 
 // Draw city lights for each region
 cityRegions.forEach(region => {
 const centerX = region.x * size;
 const centerY = region.y * size;
 const width = region.w * size;
 const height = region.h * size;
 
 // Number of light clusters based on density
 const numClusters = Math.floor(width * height * region.density * 0.01);
 
 for (let i = 0; i < numClusters; i++) {
 // Random position within region
 const x = centerX + (Math.random() - 0.5) * width;
 const y = centerY + (Math.random() - 0.5) * height;
 
 // City cluster size
 const clusterSize = 2 + Math.random() * 6;
 const intensity = 0.5 + Math.random() * 0.5;
 
 // Create glow effect
 const gradient = ctx.createRadialGradient(x, y, 0, x, y, clusterSize);
 gradient.addColorStop(0, region.color);
 gradient.addColorStop(0.5, `rgba(255, 204, 102, ${intensity * 0.5})`);
 gradient.addColorStop(1, 'rgba(255, 204, 102, 0)');
 
 ctx.fillStyle = gradient;
 ctx.beginPath();
 ctx.arc(x, y, clusterSize, 0, Math.PI * 2);
 ctx.fill();
 
 // Add some individual bright spots (major cities)
 if (Math.random() < 0.1) {
 ctx.fillStyle = '#ffffdd';
 ctx.beginPath();
 ctx.arc(x, y, 1, 0, Math.PI * 2);
 ctx.fill();
 }
 }
 });
 }
 
 // REMOVED: createEarthNightLights() - was 105 lines of unused city lights code
 
 createEarthTextureReal(size) {
 // Create procedural texture as fallback first
 const proceduralTexture = this.createEarthTexture(size);
 
 // Try to load real NASA Earth texture and swap it in when ready
 const loader = new THREE.TextureLoader();
 loader.setCrossOrigin('anonymous');
 
 // Try multiple Earth texture sources (CORS-friendly, in order of quality)
 const textureURLs = [
 // GitHub CDN - Blue Marble 4K (WORKS! No CORS issues)
 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
 // Alternative: 8K version (higher quality but larger)
 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_8k.jpg',
 // Fallback: Another GitHub source
 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
 ];
 
 let currentURLIndex = 0;
 
 const tryLoadTexture = () => {
 if (currentURLIndex >= textureURLs.length) {
 if (DEBUG.TEXTURES) console.warn(' All NASA Earth texture sources failed, using procedural');
 return;
 }
 
 const url = textureURLs[currentURLIndex];
 if (DEBUG.TEXTURES) console.log(` Loading Earth texture from source ${currentURLIndex + 1}/${textureURLs.length}`);
 
 loader.load(
 url,
 (tex) => {
 if (DEBUG.TEXTURES) console.log(' Real Earth texture loaded successfully!');
 
 // Apply proper texture settings for best quality
 tex.colorSpace = THREE.SRGBColorSpace;
 tex.anisotropy = 16; // Maximum quality filtering
 tex.needsUpdate = true;
 
 // Update the material's map to use the real texture
 if (this.planets && this.planets.earth) {
 this.planets.earth.material.map = tex;
 this.planets.earth.material.needsUpdate = true;
 if (DEBUG.TEXTURES) console.log(' Earth material updated with real NASA texture');
 }
 },
 (progress) => {
 if (DEBUG.TEXTURES && progress.lengthComputable) {
 const percent = (progress.loaded / progress.total * 100).toFixed(0);
 console.log(` Loading NASA Earth texture: ${percent}%`);
 }
 },
 (err) => {
 if (DEBUG.TEXTURES) console.warn(` Source ${currentURLIndex + 1} failed, trying next...`);
 currentURLIndex++;
 tryLoadTexture(); // Try next URL
 }
 );
 };
 
 tryLoadTexture();
 
 // Return procedural texture immediately (real texture will swap in when loaded)
 return proceduralTexture;
 }
 
 // Generic planet texture loader with fallback
 loadPlanetTextureReal(planetName, textureURLs, proceduralFunction, size = 2048) {
 // Create procedural texture as fallback first
 const proceduralTexture = proceduralFunction.call(this, size);
 
 // Try to load real NASA texture and swap it in when ready
 const loader = new THREE.TextureLoader();
 loader.setCrossOrigin('anonymous');
 
 let currentURLIndex = 0;
 
 const tryLoadTexture = () => {
 if (currentURLIndex >= textureURLs.length) {
 console.warn(`?? All ${planetName} texture sources failed`);
 console.warn(` Using beautiful procedural ${planetName} instead`);
 return;
 }
 
 const url = textureURLs[currentURLIndex];
 console.log(`?? Loading ${planetName} texture from source ${currentURLIndex + 1}/${textureURLs.length}...`);
 
 loader.load(
 url,
 (tex) => {
 console.log(`? Real ${planetName} texture loaded successfully!`);
 
 // Apply proper texture settings
 tex.colorSpace = THREE.SRGBColorSpace;
 tex.anisotropy = 16;
 tex.needsUpdate = true;
 
 // Update the material's map to use the real texture
 const planet = this.planets[planetName.toLowerCase()];
 if (planet && planet.material) {
 planet.material.map = tex;
 planet.material.needsUpdate = true;
 console.log(`?? ${planetName} material updated with real NASA texture!`);
 }
 },
 undefined,
 (err) => {
 console.warn(`?? ${planetName} source ${currentURLIndex + 1} failed, trying next...`);
 currentURLIndex++;
 tryLoadTexture();
 }
 );
 };
 
 tryLoadTexture();
 return proceduralTexture;
 }
 
 // Sun real texture loader
 createSunTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/sunmap.jpg'
 ];
 return this.loadPlanetTextureReal('Sun', textureURLs, this.createSunTexture, size);
 }
 
 // Mercury real texture loader
 createMercuryTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg'
 ];
 return this.loadPlanetTextureReal('Mercury', textureURLs, this.createMercuryTexture, size);
 }
 
 // Venus real texture loader
 createVenusTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg'
 ];
 return this.loadPlanetTextureReal('Venus', textureURLs, this.createVenusTexture, size);
 }
 
 // Mars real texture loader
 createMarsTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg'
 ];
 return this.loadPlanetTextureReal('Mars', textureURLs, this.createMarsTexture, size);
 }
 
 // Jupiter real texture loader
 createJupiterTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg'
 ];
 return this.loadPlanetTextureReal('Jupiter', textureURLs, this.createJupiterTexture, size);
 }
 
 // Saturn real texture loader
 createSaturnTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg'
 ];
 return this.loadPlanetTextureReal('Saturn', textureURLs, this.createSaturnTexture, size);
 }
 
 // Uranus real texture loader
 createUranusTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg'
 ];
 return this.loadPlanetTextureReal('Uranus', textureURLs, this.createUranusTexture, size);
 }
 
 // Neptune real texture loader
 createNeptuneTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg'
 ];
 return this.loadPlanetTextureReal('Neptune', textureURLs, this.createNeptuneTexture, size);
 }
 
 // Moon real texture loader
 createMoonTextureReal(size) {
 const textureURLs = [
 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg',
 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg'
 ];
 return this.loadPlanetTextureReal('Moon', textureURLs, this.createMoonTexture, size);
 }
 
 async createEarthTexture(size) {
 const cacheKey = `earth_texture_${size}`;
 
 // Try to load from cache
 const cachedDataURL = await TEXTURE_CACHE.get(cacheKey);
 if (cachedDataURL) {
 return new Promise((resolve) => {
 const img = new Image();
 img.onload = () => {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d');
 ctx.drawImage(img, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 resolve(texture);
 };
 img.src = cachedDataURL;
 });
 }
 
 // Generate texture if not cached
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 // Enhanced Perlin-like noise with seed variations
 const noise = (x, y, seed = 0) => {
 const angle = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
 return Math.abs(angle - Math.floor(angle));
 };
 
 // Turbulent fractal brownian motion
 const turbulence = (x, y, size) => {
 let value = 0, initialSize = size;
 while (size >= 1) {
 value += noise(x / size, y / size) * size;
 size /= 2.0;
 }
 return value / initialSize;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 
 // Convert to spherical coordinates for realistic mapping
 const lon = (x / size) * Math.PI * 2;
 const lat = (y / size) * Math.PI - Math.PI / 2;
 
 // Distance from poles
 const latNorm = Math.abs(lat) / (Math.PI / 2);
 
 // Multi-frequency continent generation
 const nx = x / size;
 const ny = y / size;
 
 // REALISTIC EARTH-LIKE CONTINENTS
 // Approximate major landmasses using mathematical patterns
 
 // Convert to normalized coordinates (0-1)
 const lonNorm = lon / (Math.PI * 2); // 0 to 1
 const latNorm01 = (lat + Math.PI / 2) / Math.PI; // 0 to 1
 
 // Americas (Western Hemisphere, lon ~0.75-0.95)
 const americas = Math.exp(-Math.pow((lonNorm - 0.85) * 6, 2)) * 
 (1 - Math.abs(latNorm01 - 0.5) * 1.5);
 
 // Eurasia-Africa (Eastern Hemisphere, lon ~0-0.4)
 const eurasia = Math.exp(-Math.pow(lonNorm * 4, 2)) * 
 (1 - Math.abs(latNorm01 - 0.55) * 1.2) * 1.2;
 const africa = Math.exp(-Math.pow((lonNorm - 0.15) * 8, 2)) * 
 Math.exp(-Math.pow((latNorm01 - 0.35) * 4, 2)) * 1.5;
 
 // Australia (lon ~0.55-0.65, lat ~0.2-0.3)
 const australia = Math.exp(-Math.pow((lonNorm - 0.6) * 12, 2)) * 
 Math.exp(-Math.pow((latNorm01 - 0.25) * 8, 2)) * 0.8;
 
 // Antarctica (bottom, all longitudes)
 const antarctica = Math.exp(-Math.pow((latNorm01 - 0.05) * 8, 2)) * 0.9;
 
 // Greenland (lon ~0.95-1.0, lat ~0.75-0.85)
 const greenland = Math.exp(-Math.pow((lonNorm - 0.97) * 20, 2)) * 
 Math.exp(-Math.pow((latNorm01 - 0.8) * 10, 2)) * 0.7;
 
 // Combine all continents
 const continents = Math.max(americas, eurasia, africa, australia, antarctica, greenland);
 
 // Add mountain ranges and terrain detail
 const mountains = Math.sin(lon * 15 + lat * 8) * 0.15 * continents;
 const terrain = noise(nx * 10, ny * 10, 0) * 0.2 * continents;
 const details = noise(nx * 30, ny * 30, 1) * 0.1;
 
 // Final elevation: continents provide base, details add variation
 // Range: approximately -0.2 to +1.5
 const elevation = continents * 0.8 + mountains + terrain + details - 0.2;
 
 // DEBUG: Log elevation range and raw values
 if (x === 512 && y % 200 === 0) {
 console.log(`?? Elevation: ${elevation.toFixed(4)} (continents:${continents.toFixed(3)}, details:${details.toFixed(3)}) at lat ${(lat * 180/Math.PI).toFixed(1)} lon ${(lon * 180/Math.PI).toFixed(1)}`);
 }
 
 // EXTRA DEBUG: Track min/max elevation
 if (!window._earthElevationStats) {
 window._earthElevationStats = { min: Infinity, max: -Infinity, samples: 0 };
 }
 window._earthElevationStats.min = Math.min(window._earthElevationStats.min, elevation);
 window._earthElevationStats.max = Math.max(window._earthElevationStats.max, elevation);
 window._earthElevationStats.samples++;
 
 // Polar ice caps - Arctic and Antarctic
 if (latNorm > 0.92 || latNorm01 < 0.08) {
 const iceVariation = noise(nx * 30, ny * 30, 1) * 20;
 data[idx] = 240 + iceVariation;
 data[idx + 1] = 250 + iceVariation;
 data[idx + 2] = 255;
 }
 // Land areas - elevation ranges from -0.2 to +1.5
 // Use threshold of 0.15 for realistic ~30% land coverage
 else if (elevation > 0.15) {
 const landHeight = (elevation - 0.15) * 2;
 const climate = (1 - latNorm) * 0.7; // Warmer at equator
 const precipitation = turbulence(nx * 6, ny * 6, 64) / 100;
 
 // Snow-capped mountains
 if (landHeight > 0.7) {
 const snowMix = Math.min(1, (landHeight - 0.7) * 5);
 data[idx] = 140 + snowMix * 100;
 data[idx + 1] = 130 + snowMix * 110;
 data[idx + 2] = 120 + snowMix * 120;
 }
 // Deserts
 else if (precipitation < 0.3 || latNorm > 0.7) {
 const sandVar = noise(nx * 40, ny * 40, 2) * 30;
 data[idx] = 194 + sandVar;
 data[idx + 1] = 178 + sandVar * 0.8;
 data[idx + 2] = 128 + sandVar * 0.5;
 }
 // Forests - BRIGHTER greens
 else if (climate > 0.4 && precipitation > 0.5) {
 const forestVar = noise(nx * 25, ny * 25, 3) * 40;
 data[idx] = 60 + forestVar * 0.8; // Brighter green
 data[idx + 1] = 180 - forestVar * 0.3; // Brighter
 data[idx + 2] = 60 + forestVar * 0.5;
 }
 // Grasslands/plains - BRIGHTER
 else {
 const grassVar = noise(nx * 30, ny * 30, 4) * 35;
 data[idx] = 130 + grassVar; // Brighter base
 data[idx + 1] = 170 - grassVar * 0.3;
 data[idx + 2] = 50 + grassVar * 0.8;
 }
 }
 // Shallow water - BRIGHT for visibility (between 0.05 and 0.15)
 else if (elevation > 0.05) {
 const shallow = (elevation - 0.05) * 30;
 data[idx] = 100 + shallow * 3; // Bright aqua
 data[idx + 1] = 200 - shallow;
 data[idx + 2] = 240 - shallow * 2;
 }
 // Deep ocean - BRIGHTER blues for visibility (below 0.05)
 else {
 const depth = Math.max(0, 0.05 - elevation) * 2;
 data[idx] = Math.max(40, 70 - depth * 10); // Much brighter base
 data[idx + 1] = Math.max(80, 130 - depth * 30);
 data[idx + 2] = Math.max(150, 200 - depth * 30);
 }
 
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 
 // DEBUG: Count land vs ocean pixels
 let landPixels = 0, oceanPixels = 0, icePixels = 0, forcedLandPixels = 0;
 let greenestPixel = { r: 0, g: 0, b: 0, idx: 0 };
 for (let i = 0; i < data.length; i += 4) {
 const r = data[i], g = data[i+1], b = data[i+2];
 if (r > 200 && g > 200 && b > 200) {
 icePixels++;
 } else if (g > b && g > 100) {
 landPixels++;
 // Track greenest pixel (should be forest)
 if (g > greenestPixel.g) {
 greenestPixel = { r, g, b, idx: i/4 };
 }
 } else {
 oceanPixels++;
 }
 }
 const totalPixels = size * size;
 if (DEBUG.TEXTURES) {
 console.log(` Earth texture: ${(landPixels/totalPixels*100).toFixed(1)}% land, ${(oceanPixels/totalPixels*100).toFixed(1)}% ocean, ${(icePixels/totalPixels*100).toFixed(1)}% ice`);
 }
 
 // Cache the texture for future use
 const dataURL = canvas.toDataURL('image/png');
 TEXTURE_CACHE.set(cacheKey, dataURL).catch(err => 
 console.warn('Failed to cache texture:', err)
 );
 
 // Create texture BEFORE adding clouds
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 
 // DEBUG: Log elevation statistics (only if debug enabled)
 if (DEBUG.TEXTURES && window._earthElevationStats) {
 const stats = window._earthElevationStats;
 console.log(` Elevation: min=${stats.min.toFixed(4)}, max=${stats.max.toFixed(4)}`);
 console.log(` Continents: Americas, Eurasia, Africa, Australia, Antarctica`);
 }
 
 // ULTIMATE TEST: Create a downloadable preview
 if (DEBUG.TEXTURES) {
 try {
 console.log('??? TEXTURE PREVIEW: Right-click and "Open in new tab" to see the actual texture:');
 console.log(dataURL.substring(0, 100) + '...');
 console.log(' Copy this and paste in browser to view Earth texture:');
 console.log(' %c[VIEW EARTH TEXTURE]', 'color: #00ff00; font-size: 16px; font-weight: bold; background: #000; padding: 5px;');
 console.log(' Length:', dataURL.length, 'bytes');
 // Store for inspection
 window._earthTextureDataURL = dataURL;
 console.log(' Stored in: window._earthTextureDataURL');
 } catch (e) {
 console.error('? Failed to create texture preview:', e);
 }
 }
 
 return texture;
 }
 
 createEarthBumpMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y, seed = 0) => {
 const angle = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
 return Math.abs(angle - Math.floor(angle));
 };
 
 const turbulence = (x, y, size) => {
 let value = 0, initialSize = size;
 while (size >= 1) {
 value += noise(x / size, y / size) * size;
 size /= 2.0;
 }
 return value / initialSize;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size * 2, ny = y / size * 2;
 
 // Match land areas from main texture
 const continents = turbulence(nx * 4, ny * 4, 128);
 const mountains = turbulence(nx * 8, ny * 8, 64) * 0.5;
 const details = turbulence(nx * 16, ny * 16, 32) * 0.25;
 const elevation = (continents + mountains + details) / 200;
 
 let gray;
 if (elevation > 0.48) {
 // Land: higher elevation (LOWERED from 0.53 to 0.48)
 const landHeight = (elevation - 0.48) * 10;
 const mountainNoise = turbulence(nx * 12, ny * 12, 128) / 100;
 gray = Math.floor(140 + landHeight * 80 + mountainNoise * 60);
 } else {
 // Ocean: lower elevation
 gray = Math.floor(100 - (0.48 - elevation) * 80);
 }
 
 data[idx] = Math.max(0, Math.min(255, gray));
 data[idx + 1] = Math.max(0, Math.min(255, gray));
 data[idx + 2] = Math.max(0, Math.min(255, gray));
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createEarthNormalMap(size) {
 // Normal map for mountain ranges and ocean trenches
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y, seed = 0) => {
 const angle = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
 return Math.abs(angle - Math.floor(angle));
 };
 
 const turbulence = (x, y, size) => {
 let value = 0, initialSize = size;
 while (size >= 1) {
 value += noise(x / size, y / size) * size;
 size /= 2.0;
 }
 return value / initialSize;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 // Calculate normals from height map
 for (let y = 1; y < size - 1; y++) {
 for (let x = 1; x < size - 1; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size * 2, ny = y / size * 2;
 
 // Sample height at neighboring pixels
 const h = turbulence(nx, ny, 128) / 128;
 const hL = turbulence((x - 1) / size * 2, ny, 128) / 128;
 const hR = turbulence((x + 1) / size * 2, ny, 128) / 128;
 const hU = turbulence(nx, (y - 1) / size * 2, 128) / 128;
 const hD = turbulence(nx, (y + 1) / size * 2, 128) / 128;
 
 // Calculate gradients
 const dX = (hR - hL) * 2;
 const dY = (hD - hU) * 2;
 
 // Convert to normal map RGB (blue = up, red = x, green = y)
 data[idx] = Math.floor((dX + 1) * 127.5); // R: -1 to 1 -> 0 to 255
 data[idx + 1] = Math.floor((dY + 1) * 127.5); // G: -1 to 1 -> 0 to 255
 data[idx + 2] = 200; // B: mostly pointing up
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createEarthSpecularMap(size) {
 // Oceans are shiny, land is rough
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const fbm = (x, y) => {
 return noise(x * 6, y * 6) * 0.6 + noise(x * 12, y * 12) * 0.4;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 const continentNoise = fbm(nx, ny);
 
 // Ocean = dark (smooth/shiny), Land = light (rough)
 const roughness = continentNoise > 0.48 ? 200 : 50;
 
 data[idx] = roughness;
 data[idx + 1] = roughness;
 data[idx + 2] = roughness;
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMoonTexture(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Base regolith color (gray)
 let gray = 100 + noise(nx * 40, ny * 40) * 60;
 
 // Maria (dark basalt plains)
 const maria = noise(nx * 5, ny * 5);
 if (maria < 0.3) {
 gray *= 0.6; // Darker regions
 }
 
 // Ray systems (bright ejecta)
 const rays = noise(nx * 80, ny * 80);
 if (rays > 0.9) {
 gray = Math.min(255, gray * 1.4);
 }
 
 data[idx] = gray;
 data[idx + 1] = gray * 0.98;
 data[idx + 2] = gray * 0.96;
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 
 // Add craters
 for (let i = 0; i < 200; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 5 + Math.random() * 40;
 
 // Crater shadow
 const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
 craterGradient.addColorStop(0, 'rgba(20, 20, 20, 0.8)');
 craterGradient.addColorStop(0.3, 'rgba(80, 80, 80, 0.4)');
 craterGradient.addColorStop(0.7, 'rgba(140, 140, 140, 0.2)');
 craterGradient.addColorStop(1, 'rgba(160, 160, 160, 0)');
 
 ctx.fillStyle = craterGradient;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMoonBumpMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 ctx.fillStyle = '#808080';
 ctx.fillRect(0, 0, size, size);
 
 // Add crater depth
 for (let i = 0; i < 200; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 5 + Math.random() * 40;
 
 // Dark center (depression)
 const depthGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
 depthGradient.addColorStop(0, '#202020');
 depthGradient.addColorStop(0.5, '#606060');
 depthGradient.addColorStop(0.9, '#A0A0A0');
 depthGradient.addColorStop(1, '#808080');
 
 ctx.fillStyle = depthGradient;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMoonNormalMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 ctx.fillStyle = '#8080FF';
 ctx.fillRect(0, 0, size, size);
 
 // Add crater rim normals
 for (let i = 0; i < 200; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 5 + Math.random() * 40;
 
 // Draw crater rim with normal variation
 ctx.strokeStyle = `rgba(255, 128, 200, 0.3)`;
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.stroke();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMarsTexture(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const fbm = (x, y, octaves = 6) => {
 let value = 0, amp = 1, freq = 1, maxVal = 0;
 for (let i = 0; i < octaves; i++) {
 value += noise(x * freq, y * freq) * amp;
 maxVal += amp;
 amp *= 0.5;
 freq *= 2;
 }
 return value / maxVal;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 const lat = Math.abs(ny - 0.5) * 2;
 
 // Polar ice caps
 if (lat > 0.9) {
 data[idx] = 255;
 data[idx + 1] = 240;
 data[idx + 2] = 230;
 } else {
 // Rusty red surface with canyons
 const terrain = fbm(nx * 8, ny * 8, 7);
 const canyon = fbm(nx * 15, ny * 15, 3);
 
 // Olympus Mons and Valles Marineris simulation
 const r = 150 + terrain * 80 - (canyon < 0.3 ? 40 : 0);
 const g = 70 + terrain * 50 - (canyon < 0.3 ? 30 : 0);
 const b = 30 + terrain * 30 - (canyon < 0.3 ? 20 : 0);
 
 data[idx] = Math.max(0, Math.min(255, r));
 data[idx + 1] = Math.max(0, Math.min(255, g));
 data[idx + 2] = Math.max(0, Math.min(255, b));
 }
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMarsBumpMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Mountains and canyons
 const elevation = noise(nx * 20, ny * 20) * 0.5 + noise(nx * 40, ny * 40) * 0.5;
 const gray = Math.floor(128 + elevation * 100);
 
 data[idx] = gray;
 data[idx + 1] = gray;
 data[idx + 2] = gray;
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMarsNormalMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 ctx.fillStyle = '#8080FF';
 ctx.fillRect(0, 0, size, size);
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMercuryTexture(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Base gray-brown color
 let gray = 120 + noise(nx * 30, ny * 30) * 60;
 
 // Ray systems
 if (noise(nx * 100, ny * 100) > 0.92) {
 gray = Math.min(255, gray * 1.3);
 }
 
 data[idx] = gray;
 data[idx + 1] = gray * 0.9;
 data[idx + 2] = gray * 0.8;
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 
 // Add craters
 for (let i = 0; i < 300; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 3 + Math.random() * 25;
 
 const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
 craterGradient.addColorStop(0, 'rgba(30, 25, 20, 0.7)');
 craterGradient.addColorStop(0.5, 'rgba(100, 90, 80, 0.3)');
 craterGradient.addColorStop(1, 'rgba(140, 130, 120, 0)');
 
 ctx.fillStyle = craterGradient;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createMercuryBumpMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 ctx.fillStyle = '#808080';
 ctx.fillRect(0, 0, size, size);
 
 // Crater depressions
 for (let i = 0; i < 300; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 3 + Math.random() * 25;
 
 const depthGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
 depthGradient.addColorStop(0, '#303030');
 depthGradient.addColorStop(0.7, '#606060');
 depthGradient.addColorStop(1, '#808080');
 
 ctx.fillStyle = depthGradient;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createVenusTexture(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const fbm = (x, y, octaves = 5) => {
 let value = 0, amp = 1, freq = 1, maxVal = 0;
 for (let i = 0; i < octaves; i++) {
 value += noise(x * freq, y * freq) * amp;
 maxVal += amp;
 amp *= 0.5;
 freq *= 2;
 }
 return value / maxVal;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Swirling sulfuric acid clouds
 const cloudPattern = fbm(nx * 6, ny * 8, 6);
 const swirl = Math.sin(nx * Math.PI * 10 + cloudPattern * 3) * 0.5 + 0.5;
 
 const brightness = 180 + cloudPattern * 60 + swirl * 20;
 
 data[idx] = Math.min(255, brightness * 1.1); // R
 data[idx + 1] = Math.min(255, brightness * 0.85); // G
 data[idx + 2] = Math.min(255, brightness * 0.5); // B
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createJupiterTexture(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const fbm = (x, y, octaves = 4) => {
 let value = 0, amp = 1, freq = 1, maxVal = 0;
 for (let i = 0; i < octaves; i++) {
 value += noise(x * freq, y * freq) * amp;
 maxVal += amp;
 amp *= 0.5;
 freq *= 2;
 }
 return value / maxVal;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Horizontal bands with turbulence
 const bandY = ny * 12; // 12 major bands
 const bandPattern = Math.sin(bandY * Math.PI) * 0.5 + 0.5;
 const turbulence = fbm(nx * 8, ny * 4, 5) * 0.4;
 const combined = bandPattern + turbulence;
 
 let r, g, b;
 
 // Great Red Spot (around 20% from top, 30% from left)
 const spotDist = Math.sqrt(Math.pow(nx - 0.3, 2) + Math.pow(ny - 0.35, 2));
 if (spotDist < 0.08) {
 const spotIntensity = 1 - (spotDist / 0.08);
 r = 200 + spotIntensity * 40;
 g = 80 + spotIntensity * 30;
 b = 60 + spotIntensity * 20;
 } else if (combined > 0.6) {
 // Light cream bands
 r = 220 + turbulence * 30;
 g = 200 + turbulence * 25;
 b = 160 + turbulence * 20;
 } else if (combined > 0.4) {
 // Medium orange bands
 r = 190 + turbulence * 40;
 g = 140 + turbulence * 30;
 b = 80 + turbulence * 25;
 } else {
 // Dark brown bands
 r = 140 + turbulence * 30;
 g = 90 + turbulence * 20;
 b = 50 + turbulence * 15;
 }
 
 data[idx] = Math.min(255, r);
 data[idx + 1] = Math.min(255, g);
 data[idx + 2] = Math.min(255, b);
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createJupiterBumpMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Atmospheric turbulence
 const elevation = noise(nx * 20, ny * 8) * 0.7 + noise(nx * 40, ny * 16) * 0.3;
 const gray = Math.floor(128 + elevation * 40);
 
 data[idx] = gray;
 data[idx + 1] = gray;
 data[idx + 2] = gray;
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createSaturnTexture(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const fbm = (x, y, octaves = 4) => {
 let value = 0, amp = 1, freq = 1, maxVal = 0;
 for (let i = 0; i < octaves; i++) {
 value += noise(x * freq, y * freq) * amp;
 maxVal += amp;
 amp *= 0.5;
 freq *= 2;
 }
 return value / maxVal;
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Subtle horizontal bands
 const bandY = ny * 15;
 const bandPattern = Math.sin(bandY * Math.PI) * 0.3 + 0.7;
 const turbulence = fbm(nx * 6, ny * 3, 4) * 0.2;
 const combined = bandPattern + turbulence;
 
 // Pale gold/cream colors
 const r = 210 + combined * 40;
 const g = 190 + combined * 35;
 const b = 140 + combined * 30;
 
 data[idx] = Math.min(255, r);
 data[idx + 1] = Math.min(255, g);
 data[idx + 2] = Math.min(255, b);
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }
 
 createSaturnBumpMap(size) {
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y) => {
 const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Subtle atmospheric variation
 const elevation = noise(nx * 15, ny * 6) * 0.8 + noise(nx * 30, ny * 12) * 0.2;
 const gray = Math.floor(128 + elevation * 30);
 
 data[idx] = gray;
 data[idx + 1] = gray;
 data[idx + 2] = gray;
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }

 createUranusTexture(size) {
 // Uranus: Featureless cyan-blue atmosphere with subtle banding
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y, seed) => {
 const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Latitude-based faint banding
 const latitude = ny;
 const band = Math.sin(latitude * Math.PI * 12) * 0.02;
 
 // Very subtle atmospheric variations
 const clouds = noise(nx * 8, ny * 8, 1) * 0.03;
 const detail = noise(nx * 20, ny * 20, 2) * 0.015;
 
 // Base cyan-blue color with methane tint
 const brightness = 0.65 + band + clouds + detail;
 data[idx] = Math.floor(79 * brightness); // R: Cyan-blue
 data[idx + 1] = Math.floor(212 * brightness); // G
 data[idx + 2] = Math.floor(232 * brightness); // B
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }

 createNeptuneTexture(size) {
 // Neptune: Deep blue atmosphere with Great Dark Spot and wind features
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y, seed) => {
 const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Dynamic cloud bands
 const latitude = ny;
 const band = Math.sin(latitude * Math.PI * 15) * 0.08;
 const wave = Math.sin((nx * 5 + ny * 2) * Math.PI) * 0.04;
 
 // Great Dark Spot (similar to Jupiter's Red Spot)
 const spotX = 0.3, spotY = 0.35;
 const distToSpot = Math.sqrt(Math.pow((nx - spotX) * 2, 2) + Math.pow(ny - spotY, 2));
 const darkSpot = distToSpot < 0.15 ? -0.25 * (1 - distToSpot / 0.15) : 0;
 
 // Swirling atmospheric features
 const swirl = noise(nx * 12 + ny * 2, ny * 10, 1) * 0.06;
 const detail = noise(nx * 25, ny * 25, 2) * 0.03;
 
 // Deep blue with white clouds
 const brightness = 0.55 + band + wave + swirl + detail + darkSpot;
 data[idx] = Math.floor(46 * brightness); // R: Deep blue
 data[idx + 1] = Math.floor(95 * brightness); // G
 data[idx + 2] = Math.floor(181 * brightness); // B
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }

 createPlutoTexture(size) {
 // Pluto: Heart-shaped Tombaugh Regio, nitrogen ice, reddish-brown terrain
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 
 const noise = (x, y, seed) => {
 const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
 return n - Math.floor(n);
 };
 
 const imageData = ctx.createImageData(size, size);
 const data = imageData.data;
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Create the famous "heart" (Tombaugh Regio)
 const heartCenterX = 0.4, heartCenterY = 0.45;
 const toCenter = {
 x: (nx - heartCenterX) * 1.8,
 y: (ny - heartCenterY) * 1.2
 };
 
 // Heart shape equation
 const heartDist = Math.pow(toCenter.x * toCenter.x + toCenter.y * toCenter.y - 0.04, 3) - 
 toCenter.x * toCenter.x * toCenter.y * toCenter.y * toCenter.y * 200;
 const isHeart = heartDist < 0;
 
 // Base terrain variations
 const terrain = noise(nx * 15, ny * 15, 1) * 0.4;
 const mountains = noise(nx * 30, ny * 30, 2) * 0.2;
 const detail = noise(nx * 50, ny * 50, 3) * 0.1;
 
 // Tholins (reddish-brown organic compounds)
 const tholin = terrain + mountains + detail;
 
 if (isHeart) {
 // Sputnik Planitia - bright nitrogen ice
 const iceBrightness = 0.9 + noise(nx * 40, ny * 40, 4) * 0.1;
 data[idx] = Math.floor(240 * iceBrightness);
 data[idx + 1] = Math.floor(235 * iceBrightness);
 data[idx + 2] = Math.floor(220 * iceBrightness);
 } else {
 // Reddish-brown terrain with tholins
 const baseBrightness = 0.5 + tholin;
 data[idx] = Math.floor(212 * baseBrightness); // R: Reddish-brown
 data[idx + 1] = Math.floor(163 * baseBrightness); // G
 data[idx + 2] = Math.floor(115 * baseBrightness); // B
 }
 
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 return texture;
 }

 createPlanetMaterial(config) {
 // Create HYPERREALISTIC materials with advanced texturing
 const name = config.name.toLowerCase();
 console.log(`?? Creating material for planet: "${name}" (original: "${config.name}")`);
 
 // Base material properties
 let materialProps = {
 roughness: 0.9,
 metalness: 0.0,
 emissive: config.emissive || 0x000000,
 emissiveIntensity: config.emissiveIntensity || 0
 };

 // Planet-specific hyperrealistic materials with high-quality textures
 switch(name) {
 case 'earth':
 // Earth: ULTRA HYPER-REALISTIC with real NASA textures + procedural fallback
 const earthTexture = this.createEarthTextureReal(4096); // 4K resolution!
 const earthBump = this.createEarthBumpMap(4096);
 const earthSpecular = this.createEarthSpecularMap(4096);
 const earthNormal = this.createEarthNormalMap(4096);
 
 // ULTRA realistic material with PBR (Physically Based Rendering)
 // NO emissive - planets don't emit light, they only reflect it
 const earthMaterial = new THREE.MeshStandardMaterial({
 map: earthTexture,
 
 // Normal map for surface detail (mountains, valleys)
 normalMap: earthNormal,
 normalScale: new THREE.Vector2(1.2, 1.2),
 
 // Bump map for elevation
 bumpMap: earthBump,
 bumpScale: 0.08,
 
 // Roughness map (water = smooth/shiny, land = rough)
 roughnessMap: earthSpecular,
 roughness: 0.4, // Increased for better light response
 
 // Metalness (oceans have slight reflection)
 metalness: 0.1, // Reduced - Earth is not metallic
 
 // NO emissive - let the sun's light create day/night naturally
 emissive: 0x000000,
 emissiveIntensity: 0,
 
 // Advanced rendering
 envMapIntensity: 1.2,
 transparent: false,
 side: THREE.FrontSide,
 flatShading: false,
 toneMapped: true
 });
 
 return earthMaterial;
 
 case 'mars':
 // Mars: REAL NASA texture with rusty red surface with canyons, polar caps
 const marsTexture = this.createMarsTextureReal(2048);
 const marsBump = this.createMarsBumpMap(2048);
 const marsNormal = this.createMarsNormalMap(2048);
 
 return new THREE.MeshStandardMaterial({
 map: marsTexture,
 normalMap: marsNormal,
 normalScale: new THREE.Vector2(1.2, 1.2),
 bumpMap: marsBump,
 bumpScale: 0.08,
 roughness: 0.95,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'venus':
 // Venus: REAL NASA texture with thick yellowish sulfuric acid clouds
 const venusTexture = this.createVenusTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: venusTexture,
 color: 0xe8c468,
 roughness: 0.3,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'mercury':
 // Mercury: REAL NASA texture heavily cratered surface
 const mercuryTexture = this.createMercuryTextureReal(2048);
 const mercuryBump = this.createMercuryBumpMap(2048);
 
 return new THREE.MeshStandardMaterial({
 map: mercuryTexture,
 bumpMap: mercuryBump,
 bumpScale: 0.1,
 roughness: 0.95,
 metalness: 0.02,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'jupiter':
 // Jupiter: REAL NASA texture with hyperrealistic bands and Great Red Spot
 const jupiterTexture = this.createJupiterTextureReal(2048);
 const jupiterBump = this.createJupiterBumpMap(1024);
 
 return new THREE.MeshStandardMaterial({
 map: jupiterTexture,
 bumpMap: jupiterBump,
 bumpScale: 0.02,
 roughness: 0.6,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'saturn':
 // Saturn: REAL NASA texture with pale gold and detailed banding
 const saturnTexture = this.createSaturnTextureReal(2048);
 const saturnBump = this.createSaturnBumpMap(1024);
 
 return new THREE.MeshStandardMaterial({
 map: saturnTexture,
 bumpMap: saturnBump,
 bumpScale: 0.015,
 roughness: 0.55,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'uranus':
 // Uranus: REAL NASA texture with cyan atmosphere and methane
 const uranusTexture = this.createUranusTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: uranusTexture,
 roughness: 0.3,
 metalness: 0.1,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'neptune':
 // Neptune: REAL NASA texture with deep blue and Great Dark Spot
 const neptuneTexture = this.createNeptuneTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: neptuneTexture,
 roughness: 0.3,
 metalness: 0.1,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'pluto':
 // Pluto: Hyperrealistic with Tombaugh Regio heart
 const plutoTexture = this.createPlutoTexture(2048);
 return new THREE.MeshStandardMaterial({
 map: plutoTexture,
 roughness: 0.85,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 default:
 // Default material
 console.warn(`?? DEFAULT MATERIAL CASE for planet "${name}" - using simple color: 0x${config.color?.toString(16)}`);
 return new THREE.MeshStandardMaterial({
 color: config.color,
 ...materialProps
 });
 }
 }

 createPlanet(scene, config) {
 // Use cached geometry or create new
 const segments = CONFIG.QUALITY.sphereSegments;
 const geometry = this.getGeometry('sphere', config.radius, segments, segments);
 
 // Create hyperrealistic material based on planet type
 const material = this.createPlanetMaterial(config);

 const planet = new THREE.Mesh(geometry, material);
 planet.position.set(config.distance, 0, 0);
 planet.castShadow = false; // Planets don't cast shadows on each other (unrealistic at solar system scale)
 planet.receiveShadow = true; // But can receive shadows from moons
 planet.rotation.z = (config.tilt || 0) * Math.PI / 180;

 // Get real astronomical data for this planet
 const planetKey = config.name.toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[planetKey] || {};
 
 planet.userData = {
 name: config.name,
 type: config.dwarf ? 'Dwarf Planet' : 'Planet',
 distance: config.distance,
 radius: config.radius,
 angle: Math.random() * Math.PI * 2,
 speed: config.speed,
 rotationSpeed: config.rotationSpeed,
 description: config.description,
 funFact: config.funFact,
 realSize: config.realSize,
 moonCount: config.moons || 0,
 moons: [],
 
 // Real astronomical data for day/night cycle
 realRotationPeriod: astroData.rotationPeriod || 24, // hours
 axialTilt: astroData.axialTilt || 0, // degrees
 retrograde: astroData.retrograde || false, // rotation direction
 rotationPhase: Math.random() * Math.PI * 2 // starting rotation angle
 };

 // Add atmosphere for Earth with clouds
 if (config.atmosphere) {
 // TEMPORARILY DISABLED FOR DEBUGGING - Testing if clouds are causing blue sphere
 if (DEBUG.enabled) console.log('?? ATMOSPHERE DISABLED FOR DEBUGGING - If Earth shows continents now, clouds were the issue!');
 
 /* DISABLED CLOUD LAYER - TESTING
 // Cloud layer with procedural patterns - VERY subtle
 const cloudGeometry = new THREE.SphereGeometry(config.radius * 1.015, 32, 32);
 const cloudTexture = this.createCloudTexture(512);
 const cloudMaterial = new THREE.MeshStandardMaterial({
 map: cloudTexture,
 transparent: true,
 opacity: 0.15, // Very subtle - was 0.25
 roughness: 0.9,
 metalness: 0.0,
 side: THREE.FrontSide,
 alphaMap: cloudTexture,
 depthWrite: false // Don't block view of surface
 });
 const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
 clouds.userData.isCloud = true;
 planet.add(clouds);
 planet.userData.clouds = clouds;
 */
 }

 // NOTE: Great Red Spot removed - now included in Jupiter's NASA texture!
 // The procedurally generated 3D spot was redundant and looked odd
 // compared to the real NASA imagery which already shows the Great Red Spot
 
 // Add rings for gas giants with realistic appearance
 if (config.rings) {
 const ringGeometry = new THREE.RingGeometry(
 config.radius * 1.3,
 config.radius * 2.2,
 128
 );
 
 // Create realistic ring material with color variation
 let ringColor = 0x888888;
 let ringOpacity = 0.3;
 
 if (config.prominentRings) {
 // Saturn's rings: ice and rock particles (tan/beige)
 ringColor = 0xd4c5b0;
 ringOpacity = 0.85;
 } else if (config.name === 'Jupiter') {
 ringColor = 0x997755;
 ringOpacity = 0.2;
 } else if (config.name === 'Uranus') {
 ringColor = 0x6688aa;
 ringOpacity = 0.3;
 } else if (config.name === 'Neptune') {
 ringColor = 0x5577aa;
 ringOpacity = 0.25;
 }
 
 const ringMaterial = new THREE.MeshStandardMaterial({
 color: ringColor,
 side: THREE.DoubleSide,
 transparent: true,
 opacity: ringOpacity,
 roughness: 0.8,
 metalness: 0.1,
 depthWrite: false // Don't block moons passing through rings
 });
 const rings = new THREE.Mesh(ringGeometry, ringMaterial);
 rings.rotation.x = Math.PI / 2;
 rings.castShadow = false; // Rings don't cast meaningful shadows at solar system scale
 rings.receiveShadow = true; // But can receive shadows from moons
 planet.add(rings);
 }

 scene.add(planet);
 this.objects.push(planet);
 
 // DIAGNOSTIC: Verify planet was added
 console.log(`? Planet "${config.name}" added to scene:`);
 console.log(` - Position: (${planet.position.x}, ${planet.position.y}, ${planet.position.z})`);
 console.log(` - Radius: ${config.radius}`);
 console.log(` - Material type: ${planet.material.type}`);
 console.log(` - Material color: 0x${planet.material.color?.getHexString()}`);
 console.log(` - Has texture map: ${!!planet.material.map}`);
 console.log(` - Visible: ${planet.visible}`);
 console.log(` - In scene: ${planet.parent === scene}`);
 
 return planet;
 }

 createMoon(planet, config) {
 const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
 
 // Enhanced moon materials based on specific moons
 let moonMaterial;
 const moonName = config.name.toLowerCase();
 
 if (moonName.includes('moon') && !moonName.includes('ganymede') && !moonName.includes('callisto')) {
 // Earth's Moon: REAL NASA texture with deep craters and maria
 const moonTexture = this.createMoonTextureReal(2048);
 const moonBump = this.createMoonBumpMap(2048);
 const moonNormal = this.createMoonNormalMap(2048);
 
 moonMaterial = new THREE.MeshStandardMaterial({
 map: moonTexture,
 normalMap: moonNormal,
 normalScale: new THREE.Vector2(2.0, 2.0), // Deep craters!
 bumpMap: moonBump,
 bumpScale: 0.15, // Pronounced elevation
 roughness: 0.98,
 metalness: 0.02
 });
 } else if (moonName.includes('io')) {
 // Io: Yellow/orange volcanic surface
 moonMaterial = new THREE.MeshStandardMaterial({
 color: 0xffdd44,
 roughness: 0.7,
 metalness: 0.0,
 emissive: 0xff6600,
 emissiveIntensity: 0.15
 });
 } else if (moonName.includes('europa')) {
 // Europa: Icy white/cream with blue tint
 moonMaterial = new THREE.MeshStandardMaterial({
 color: 0xeeddcc,
 roughness: 0.3,
 metalness: 0.2
 });
 } else if (moonName.includes('titan')) {
 // Titan: Orange atmosphere
 moonMaterial = new THREE.MeshStandardMaterial({
 color: 0xffa033,
 roughness: 0.6,
 metalness: 0.0,
 emissive: 0x663300,
 emissiveIntensity: 0.1
 });
 } else if (moonName.includes('enceladus')) {
 // Enceladus: Bright white ice
 moonMaterial = new THREE.MeshStandardMaterial({
 color: 0xffffff,
 roughness: 0.2,
 metalness: 0.3
 });
 } else if (moonName.includes('triton')) {
 // Triton: Pinkish nitrogen ice
 moonMaterial = new THREE.MeshStandardMaterial({
 color: 0xffcccc,
 roughness: 0.4,
 metalness: 0.1
 });
 } else {
 // Default moon material
 moonMaterial = new THREE.MeshStandardMaterial({
 color: config.color,
 roughness: 0.9,
 metalness: 0.1
 });
 }

 const moon = new THREE.Mesh(geometry, moonMaterial);
 moon.castShadow = true;
 moon.receiveShadow = true;

 // Get real astronomical data for this moon
 const moonKey = config.name.toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[moonKey] || {};
 
 moon.userData = {
 name: config.name,
 type: 'Moon',
 parentPlanet: planet.userData.name,
 distance: config.distance,
 radius: config.radius,
 angle: Math.random() * Math.PI * 2,
 speed: config.speed,
 rotationSpeed: config.rotationSpeed || 0.001, // Add rotation
 description: config.description,
 
 // Real astronomical data for day/night cycle
 realRotationPeriod: astroData.rotationPeriod || 655.7, // hours (default: Moon's period)
 axialTilt: astroData.axialTilt || 0,
 retrograde: astroData.retrograde || false,
 rotationPhase: Math.random() * Math.PI * 2
 };

 // Store moon reference
 this.moons[config.name.toLowerCase()] = moon;
 planet.userData.moons.push(moon);
 this.objects.push(moon);
 planet.add(moon);
 
 console.log(`[Moon] Created "${config.name}" for ${planet.userData.name} at distance ${config.distance} (Total moons: ${planet.userData.moons.length})`);
 }

 createAsteroidBelt(scene) {
 // ===== HYPER-REALISTIC ASTEROID BELT =====
 // Multiple size classes: dust, small, medium, large asteroids
 const asteroidBeltGroup = new THREE.Group();
 asteroidBeltGroup.name = 'asteroidBelt';
 
 // Asteroid belt is between Mars and Jupiter
 // Educational: Mars=60, Jupiter=100, so belt at 75-90
 // Realistic: Mars=227.9, Jupiter=778.6, so belt at ~300-500 AU (2.2-3.2 AU real)
 const baseDistance = this.realisticScale ? 350 : 75;
 const distanceSpread = this.realisticScale ? 150 : 15;
 
 // Large asteroids (visible as small irregular rocks)
 const largeCount = 150;
 const largeGeometry = new THREE.BufferGeometry();
 const largePositions = new Float32Array(largeCount * 3);
 const largeColors = new Float32Array(largeCount * 3);
 const largeSizes = new Float32Array(largeCount);
 
 for (let i = 0; i < largeCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = baseDistance + Math.random() * distanceSpread;
 const height = (Math.random() - 0.5) * 4;
 
 largePositions[i * 3] = distance * Math.cos(angle);
 largePositions[i * 3 + 1] = height;
 largePositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Varied rocky colors: dark gray, brown, reddish
 const colorType = Math.random();
 if (colorType < 0.4) {
 // C-type: dark carbonaceous
 const gray = 0.25 + Math.random() * 0.15;
 largeColors[i * 3] = gray;
 largeColors[i * 3 + 1] = gray * 0.95;
 largeColors[i * 3 + 2] = gray * 0.9;
 } else if (colorType < 0.7) {
 // S-type: stony, gray-brown
 const base = 0.4 + Math.random() * 0.2;
 largeColors[i * 3] = base;
 largeColors[i * 3 + 1] = base * 0.85;
 largeColors[i * 3 + 2] = base * 0.7;
 } else {
 // M-type: metallic, lighter gray
 const metal = 0.5 + Math.random() * 0.25;
 largeColors[i * 3] = metal * 0.95;
 largeColors[i * 3 + 1] = metal;
 largeColors[i * 3 + 2] = metal * 0.9;
 }
 
 largeSizes[i] = 0.5 + Math.random() * 0.8; // Varied sizes
 }
 
 largeGeometry.setAttribute('position', new THREE.BufferAttribute(largePositions, 3));
 largeGeometry.setAttribute('color', new THREE.BufferAttribute(largeColors, 3));
 largeGeometry.setAttribute('size', new THREE.BufferAttribute(largeSizes, 1));
 
 const largeMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.9
 });
 
 const largeAsteroids = new THREE.Points(largeGeometry, largeMaterial);
 asteroidBeltGroup.add(largeAsteroids);
 
 // Medium asteroids (more numerous, smaller)
 const mediumCount = 800;
 const mediumGeometry = new THREE.BufferGeometry();
 const mediumPositions = new Float32Array(mediumCount * 3);
 const mediumColors = new Float32Array(mediumCount * 3);
 const mediumSizes = new Float32Array(mediumCount);
 
 for (let i = 0; i < mediumCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 2) + Math.random() * (distanceSpread + 4); // Wider spread
 const height = (Math.random() - 0.5) * 5;
 
 mediumPositions[i * 3] = distance * Math.cos(angle);
 mediumPositions[i * 3 + 1] = height;
 mediumPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 const gray = 0.35 + Math.random() * 0.25;
 const brownTint = Math.random() * 0.15;
 mediumColors[i * 3] = gray;
 mediumColors[i * 3 + 1] = gray * (0.9 - brownTint);
 mediumColors[i * 3 + 2] = gray * (0.85 - brownTint * 1.5);
 
 mediumSizes[i] = 0.25 + Math.random() * 0.4;
 }
 
 mediumGeometry.setAttribute('position', new THREE.BufferAttribute(mediumPositions, 3));
 mediumGeometry.setAttribute('color', new THREE.BufferAttribute(mediumColors, 3));
 mediumGeometry.setAttribute('size', new THREE.BufferAttribute(mediumSizes, 1));
 
 const mediumMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.75
 });
 
 const mediumAsteroids = new THREE.Points(mediumGeometry, mediumMaterial);
 asteroidBeltGroup.add(mediumAsteroids);
 
 // Dust and small debris (very numerous, creates density)
 const dustCount = 2500;
 const dustGeometry = new THREE.BufferGeometry();
 const dustPositions = new Float32Array(dustCount * 3);
 const dustColors = new Float32Array(dustCount * 3);
 const dustSizes = new Float32Array(dustCount);
 
 for (let i = 0; i < dustCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 5) + Math.random() * (distanceSpread + 10); // Widest spread
 const height = (Math.random() - 0.5) * 6;
 
 dustPositions[i * 3] = distance * Math.cos(angle);
 dustPositions[i * 3 + 1] = height;
 dustPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 const brightness = 0.3 + Math.random() * 0.3;
 dustColors[i * 3] = brightness;
 dustColors[i * 3 + 1] = brightness * 0.9;
 dustColors[i * 3 + 2] = brightness * 0.85;
 
 dustSizes[i] = 0.1 + Math.random() * 0.15;
 }
 
 dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
 dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
 dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
 
 const dustMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.5
 });
 
 const dust = new THREE.Points(dustGeometry, dustMaterial);
 asteroidBeltGroup.add(dust);
 
 asteroidBeltGroup.userData = {
 name: 'Asteroid Belt',
 type: 'Asteroid Belt',
 description: ' The asteroid belt contains millions of rocky objects between Mars and Jupiter. Ceres, the largest object here, is a dwarf planet! Most asteroids are leftover material from the formation of the solar system 4.6 billion years ago.',
 funFact: 'Despite what movies show, asteroids are very far apart - spacecraft can pass through safely!',
 count: largeCount + mediumCount + dustCount,
 radius: 40
 };
 
 scene.add(asteroidBeltGroup);
 this.asteroidBelt = asteroidBeltGroup;
 this.objects.push(asteroidBeltGroup);
 
 if (DEBUG.enabled) console.log(` Asteroid belt: ${largeCount + mediumCount + dustCount} particles`);
 }

 createKuiperBelt(scene) {
 // ===== HYPER-REALISTIC KUIPER BELT =====
 // Icy worlds with varied compositions: water ice, methane ice, nitrogen ice
 const kuiperBeltGroup = new THREE.Group();
 kuiperBeltGroup.name = 'kuiperBelt';
 
 // Kuiper belt is beyond Neptune (30-50 AU real)
 // Educational: Neptune=250, Pluto=300, so belt at 280-380
 // Realistic: Neptune=4495, Pluto=5906, so belt at ~5000-7500
 const baseDistance = this.realisticScale ? 5000 : 280;
 const distanceSpread = this.realisticScale ? 2500 : 100;
 
 // Large Kuiper Belt Objects (KBOs) - Pluto-like dwarf planets
 const largeKBOCount = 200;
 const largeKBOGeometry = new THREE.BufferGeometry();
 const largeKBOPositions = new Float32Array(largeKBOCount * 3);
 const largeKBOColors = new Float32Array(largeKBOCount * 3);
 const largeKBOSizes = new Float32Array(largeKBOCount);
 
 for (let i = 0; i < largeKBOCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = baseDistance + Math.random() * distanceSpread;
 const height = (Math.random() - 0.5) * 35; // Larger vertical spread
 
 largeKBOPositions[i * 3] = distance * Math.cos(angle);
 largeKBOPositions[i * 3 + 1] = height;
 largeKBOPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Varied icy compositions
 const iceType = Math.random();
 if (iceType < 0.4) {
 // Water ice: white-gray
 const ice = 0.7 + Math.random() * 0.25;
 largeKBOColors[i * 3] = ice * 0.9;
 largeKBOColors[i * 3 + 1] = ice * 0.95;
 largeKBOColors[i * 3 + 2] = ice;
 } else if (iceType < 0.7) {
 // Methane ice: reddish-brown (like Pluto)
 const base = 0.6 + Math.random() * 0.2;
 largeKBOColors[i * 3] = base;
 largeKBOColors[i * 3 + 1] = base * 0.75;
 largeKBOColors[i * 3 + 2] = base * 0.6;
 } else {
 // Nitrogen/CO ice: bluish-white
 const blue = 0.75 + Math.random() * 0.2;
 largeKBOColors[i * 3] = blue * 0.85;
 largeKBOColors[i * 3 + 1] = blue * 0.9;
 largeKBOColors[i * 3 + 2] = blue;
 }
 
 largeKBOSizes[i] = 0.6 + Math.random() * 1.0; // Larger than asteroids
 }
 
 largeKBOGeometry.setAttribute('position', new THREE.BufferAttribute(largeKBOPositions, 3));
 largeKBOGeometry.setAttribute('color', new THREE.BufferAttribute(largeKBOColors, 3));
 largeKBOGeometry.setAttribute('size', new THREE.BufferAttribute(largeKBOSizes, 1));
 
 const largeKBOMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.85
 });
 
 const largeKBOs = new THREE.Points(largeKBOGeometry, largeKBOMaterial);
 kuiperBeltGroup.add(largeKBOs);
 
 // Medium icy bodies (cubewanos, classical KBOs)
 const mediumKBOCount = 1200;
 const mediumKBOGeometry = new THREE.BufferGeometry();
 const mediumKBOPositions = new Float32Array(mediumKBOCount * 3);
 const mediumKBOColors = new Float32Array(mediumKBOCount * 3);
 const mediumKBOSizes = new Float32Array(mediumKBOCount);
 
 for (let i = 0; i < mediumKBOCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 5) + Math.random() * (distanceSpread + 15);
 const height = (Math.random() - 0.5) * 40;
 
 mediumKBOPositions[i * 3] = distance * Math.cos(angle);
 mediumKBOPositions[i * 3 + 1] = height;
 mediumKBOPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Mostly water ice with some variation
 const ice = 0.65 + Math.random() * 0.25;
 const tint = Math.random() * 0.1;
 mediumKBOColors[i * 3] = ice * (0.9 - tint);
 mediumKBOColors[i * 3 + 1] = ice * (0.92 + tint * 0.5);
 mediumKBOColors[i * 3 + 2] = ice * (0.95 + tint);
 
 mediumKBOSizes[i] = 0.35 + Math.random() * 0.5;
 }
 
 mediumKBOGeometry.setAttribute('position', new THREE.BufferAttribute(mediumKBOPositions, 3));
 mediumKBOGeometry.setAttribute('color', new THREE.BufferAttribute(mediumKBOColors, 3));
 mediumKBOGeometry.setAttribute('size', new THREE.BufferAttribute(mediumKBOSizes, 1));
 
 const mediumKBOMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.7
 });
 
 const mediumKBOs = new THREE.Points(mediumKBOGeometry, mediumKBOMaterial);
 kuiperBeltGroup.add(mediumKBOs);
 
 // Small icy debris and cometary nuclei
 const smallKBOCount = 3000;
 const smallKBOGeometry = new THREE.BufferGeometry();
 const smallKBOPositions = new Float32Array(smallKBOCount * 3);
 const smallKBOColors = new Float32Array(smallKBOCount * 3);
 const smallKBOSizes = new Float32Array(smallKBOCount);
 
 for (let i = 0; i < smallKBOCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 10) + Math.random() * (distanceSpread + 30); // Widest spread
 const height = (Math.random() - 0.5) * 45;
 
 smallKBOPositions[i * 3] = distance * Math.cos(angle);
 smallKBOPositions[i * 3 + 1] = height;
 smallKBOPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Faint icy particles
 const brightness = 0.6 + Math.random() * 0.3;
 smallKBOColors[i * 3] = brightness * 0.88;
 smallKBOColors[i * 3 + 1] = brightness * 0.93;
 smallKBOColors[i * 3 + 2] = brightness * 0.98;
 
 smallKBOSizes[i] = 0.15 + Math.random() * 0.25;
 }
 
 smallKBOGeometry.setAttribute('position', new THREE.BufferAttribute(smallKBOPositions, 3));
 smallKBOGeometry.setAttribute('color', new THREE.BufferAttribute(smallKBOColors, 3));
 smallKBOGeometry.setAttribute('size', new THREE.BufferAttribute(smallKBOSizes, 1));
 
 const smallKBOMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.55
 });
 
 const smallKBOs = new THREE.Points(smallKBOGeometry, smallKBOMaterial);
 kuiperBeltGroup.add(smallKBOs);
 
 // Scattered disk objects (highly eccentric, distant)
 const scatteredCount = 600;
 const scatteredGeometry = new THREE.BufferGeometry();
 const scatteredPositions = new Float32Array(scatteredCount * 3);
 const scatteredColors = new Float32Array(scatteredCount * 3);
 const scatteredSizes = new Float32Array(scatteredCount);
 
 for (let i = 0; i < scatteredCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance + 70) + Math.random() * (distanceSpread * 0.8); // Further out
 const height = (Math.random() - 0.5) * 60; // Much larger inclination
 
 scatteredPositions[i * 3] = distance * Math.cos(angle);
 scatteredPositions[i * 3 + 1] = height;
 scatteredPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Very faint, distant objects with subtle blue tint
 const faint = 0.5 + Math.random() * 0.25;
 scatteredColors[i * 3] = faint * 0.85;
 scatteredColors[i * 3 + 1] = faint * 0.9;
 scatteredColors[i * 3 + 2] = faint;
 
 scatteredSizes[i] = 0.3 + Math.random() * 0.4;
 }
 
 scatteredGeometry.setAttribute('position', new THREE.BufferAttribute(scatteredPositions, 3));
 scatteredGeometry.setAttribute('color', new THREE.BufferAttribute(scatteredColors, 3));
 scatteredGeometry.setAttribute('size', new THREE.BufferAttribute(scatteredSizes, 1));
 
 const scatteredMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.45
 });
 
 const scatteredObjects = new THREE.Points(scatteredGeometry, scatteredMaterial);
 kuiperBeltGroup.add(scatteredObjects);
 
 kuiperBeltGroup.userData = {
 name: 'Kuiper Belt',
 type: 'Kuiper Belt',
 description: ' The Kuiper Belt is a region beyond Neptune filled with icy bodies and dwarf planets including Pluto! It\'s like a giant donut of frozen objects left over from the solar system\'s formation. Short-period comets come from here!',
 funFact: 'The Kuiper Belt is 20 times wider than the asteroid belt and contains billions of objects!',
 count: largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount,
 radius: 60
 };
 
 scene.add(kuiperBeltGroup);
 this.kuiperBelt = kuiperBeltGroup;
 this.objects.push(kuiperBeltGroup);
 
 if (DEBUG.enabled) console.log(` Kuiper Belt: ${largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount} objects`);
 }

 createOrbitalPaths(scene) {
 // Planet orbital paths around the Sun
 const orbitalData = [
 { distance: 20, color: 0x6688AA }, // Mercury
 { distance: 30, color: 0x6688AA }, // Venus
 { distance: 45, color: 0x6688AA }, // Earth
 { distance: 60, color: 0x6688AA }, // Mars
 { distance: 100, color: 0x6688AA }, // Jupiter
 { distance: 150, color: 0x6688AA }, // Saturn
 { distance: 200, color: 0x6688AA }, // Uranus
 { distance: 250, color: 0x6688AA }, // Neptune
 { distance: 300, color: 0x6688AA } // Pluto
 ];

 orbitalData.forEach(orbit => {
 const curve = new THREE.EllipseCurve(
 0, 0,
 orbit.distance, orbit.distance,
 0, 2 * Math.PI,
 false,
 0
 );

 const points = curve.getPoints(128);
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: orbit.color,
 transparent: true,
 opacity: 0.5 // Increased from 0.2 for better visibility
 });

 const orbitLine = new THREE.Line(geometry, material);
 orbitLine.rotation.x = Math.PI / 2;
 orbitLine.visible = this.orbitsVisible; // Respect initial visibility setting
 scene.add(orbitLine);
 this.orbits.push(orbitLine);
 });
 
        // Moon orbital paths around their planets
        Object.values(this.planets).forEach(planet => {
            if (planet.userData.moons && planet.userData.moons.length > 0) {
                console.log(`Creating orbital paths for ${planet.userData.moons.length} moon(s) of ${planet.userData.name}`);
                planet.userData.moons.forEach(moon => {
                    const moonDistance = moon.userData.distance;
                    console.log(`  - Creating orbit for ${moon.userData.name} at distance ${moonDistance}`);
                    
                    const curve = new THREE.EllipseCurve(
                        0, 0,
                        moonDistance, moonDistance,
                        0, 2 * Math.PI,
                        false,
                        0
                    );

                    const points = curve.getPoints(128); // More points for smoother orbits
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({
                        color: 0xAADDFF, // Brighter cyan for better visibility
                        transparent: true,
                        opacity: 0.7, // Increased from 0.4 for better visibility
                        linewidth: 2, // Thicker lines (note: may not work on all platforms)
                        depthTest: true,
                        depthWrite: false // Prevent z-fighting
                    });

                    const orbitLine = new THREE.Line(geometry, material);
                    orbitLine.rotation.x = Math.PI / 2;
                    orbitLine.visible = this.orbitsVisible; // Respect initial visibility setting
                    orbitLine.renderOrder = 1; // Render after planets to prevent z-fighting
                    planet.add(orbitLine); // Add to planet so it moves with the planet
                    this.orbits.push(orbitLine);
 });
 }
 });
 }

 createStarfield(scene) {
 // Enhanced starfield based on real astronomical data
 // Uses Hertzsprung-Russell diagram for realistic stellar populations
 const starGeometry = new THREE.BufferGeometry();
 const starCount = 8000; // Increased for richer sky
 const positions = new Float32Array(starCount * 3);
 const colors = new Float32Array(starCount * 3);
 const sizes = new Float32Array(starCount);

 // Astronomical stellar distribution based on HR diagram
 // O-type: 0.00003%, B-type: 0.13%, A-type: 0.6%, F-type: 3%, G-type: 7.6%, K-type: 12.1%, M-type: 76.45%
 const stellarPopulation = [
 // [probability, baseTemp, tempVariance, baseLuminosity, name]
 { prob: 0.0000003, temp: 40000, variance: 10000, lum: 3.5, name: 'O-type (Blue Supergiants)' }, // Rare
 { prob: 0.0013, temp: 18000, variance: 8000, lum: 2.8, name: 'B-type (Blue Giants)' },
 { prob: 0.006, temp: 9000, variance: 1500, lum: 2.2, name: 'A-type (White)' },
 { prob: 0.03, temp: 7000, variance: 500, lum: 1.8, name: 'F-type (Yellow-White)' },
 { prob: 0.076, temp: 5800, variance: 300, lum: 1.4, name: 'G-type (Yellow, Sun-like)' },
 { prob: 0.121, temp: 4800, variance: 500, lum: 1.2, name: 'K-type (Orange Dwarfs)' },
 { prob: 0.7645, temp: 3200, variance: 700, lum: 0.9, name: 'M-type (Red Dwarfs)' }
 ];

 // Convert Kelvin temperature to RGB using Planck's law approximation
 const kelvinToRGB = (temp) => {
 // Simplified black body radiation color
 temp = temp / 100;
 let r, g, b;

 // Red
 if (temp <= 66) {
 r = 255;
 } else {
 r = temp - 60;
 r = 329.698727446 * Math.pow(r, -0.1332047592);
 r = Math.max(0, Math.min(255, r));
 }

 // Green
 if (temp <= 66) {
 g = temp;
 g = 99.4708025861 * Math.log(g) - 161.1195681661;
 } else {
 g = temp - 60;
 g = 288.1221695283 * Math.pow(g, -0.0755148492);
 }
 g = Math.max(0, Math.min(255, g));

 // Blue
 if (temp >= 66) {
 b = 255;
 } else if (temp <= 19) {
 b = 0;
 } else {
 b = temp - 10;
 b = 138.5177312231 * Math.log(b) - 305.0447927307;
 b = Math.max(0, Math.min(255, b));
 }

 return { r: r / 255, g: g / 255, b: b / 255 };
 };

 // Determine stellar type based on probability distribution
 const getStarType = () => {
 const rand = Math.random();
 let cumulative = 0;
 for (const type of stellarPopulation) {
 cumulative += type.prob;
 if (rand < cumulative) return type;
 }
 return stellarPopulation[stellarPopulation.length - 1]; // Default to M-type
 };

 for (let i = 0; i < starCount; i++) {
 // Uniform spherical distribution using Marsaglia method
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const radius = 15000 + Math.random() * 10000;

 positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
 positions[i * 3 + 2] = radius * Math.cos(phi);

 // Assign realistic color based on stellar type
 const starType = getStarType();
 const temp = starType.temp + (Math.random() - 0.5) * starType.variance;
 const rgb = kelvinToRGB(temp);

 colors[i * 3] = rgb.r;
 colors[i * 3 + 1] = rgb.g;
 colors[i * 3 + 2] = rgb.b;

 // Size based on luminosity with some variance
 const luminosity = starType.lum + Math.random() * 0.5;
 sizes[i] = luminosity;
 }

 starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

 const starMaterial = new THREE.PointsMaterial({
 size: 2,
 vertexColors: true,
 transparent: true,
 opacity: 0.9,
 sizeAttenuation: false,
 blending: THREE.AdditiveBlending
 });

 this.starfield = new THREE.Points(starGeometry, starMaterial);
 this.starfield.name = 'starfield';
 this.starfield.frustumCulled = false;
 scene.add(this.starfield);

 if (DEBUG.enabled) {
 console.log(' Starfield created with 8,000 stars based on H-R diagram stellar distribution');
 }
 }

 async loadTextureWithFallback(url, fallbackColor) {
 // Try to load real imagery, fallback to color if it fails
 return new Promise((resolve) => {
 const loader = new THREE.TextureLoader();
 loader.load(
 url,
 (texture) => {
 console.log(` Loaded texture: ${url}`);
 resolve(texture);
 },
 undefined,
 (error) => {
 console.warn(` Failed to load ${url}, using fallback color`);
 // Create circular gradient texture as fallback (no visible edges)
 const canvas = document.createElement('canvas');
 canvas.width = 128;
 canvas.height = 128;
 const ctx = canvas.getContext('2d');
 
 // Create radial gradient (bright center, fades to transparent)
 const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
 gradient.addColorStop(0, fallbackColor);
 gradient.addColorStop(0.5, fallbackColor + '80'); // 50% opacity
 gradient.addColorStop(1, fallbackColor + '00'); // Transparent
 
 ctx.fillStyle = gradient;
 ctx.fillRect(0, 0, 128, 128);
 
 const texture = new THREE.CanvasTexture(canvas);
 resolve(texture);
 }
 );
 });
 }

 createDistantStars(scene) {
 // Create recognizable star systems and bright stars
 this.distantStars = [];
 
 const brightStars = [
 { name: 'Sirius', color: 0xFFFFFF, size: 8, distance: 8000, angle: 0, tilt: 0.5, description: ' Sirius is the brightest star in Earth\'s night sky! It\'s actually a binary system with two stars orbiting each other. Located 8.6 light-years away in the constellation Canis Major.' },
 { name: 'Betelgeuse', color: 0xFF4500, size: 12, distance: 7500, angle: Math.PI / 3, tilt: 0.8, description: ' Betelgeuse is a red supergiant star nearing the end of its life! It\'s so big that if placed at our Sun\'s position, it would extend past Mars. Will explode as a supernova someday!' },
 { name: 'Rigel', color: 0x87CEEB, size: 10, distance: 8500, angle: Math.PI * 2 / 3, tilt: -0.6, description: ' Rigel is a blue supergiant, one of the most luminous stars visible to the naked eye! It\'s 40,000 times more luminous than our Sun and located 860 light-years away.' },
 { name: 'Vega', color: 0xF0F8FF, size: 7, distance: 7800, angle: Math.PI, tilt: 0.3, description: ' Vega is one of the brightest stars in the northern sky! It was the North Star 12,000 years ago and will be again in 13,000 years due to Earth\'s axial precession.' },
 { name: 'Polaris', color: 0xFFFACD, size: 6, distance: 9000, angle: Math.PI * 1.5, tilt: 0.9, description: ' Polaris, the North Star, has guided travelers for centuries! It\'s actually a triple star system and is currently very close to true north due to Earth\'s rotation axis.' }
 ];

 brightStars.forEach(async (starData) => {
 const geometry = new THREE.SphereGeometry(starData.size, 32, 32);
 
 // Use texture if provided, otherwise use color
 let material;
 if (starData.texture) {
 const texture = await this.loadTextureWithFallback(starData.texture, `#${starData.color.toString(16).padStart(6, '0')}`);
 material = new THREE.MeshBasicMaterial({
 map: texture,
 transparent: true,
 opacity: 0.9
 });
 } else {
 material = new THREE.MeshBasicMaterial({
 color: starData.color,
 transparent: true,
 opacity: 0.9
 });
 }
 
 const star = new THREE.Mesh(geometry, material);
 const x = starData.distance * Math.cos(starData.angle);
 const z = starData.distance * Math.sin(starData.angle);
 const y = starData.distance * starData.tilt;
 star.position.set(x, y, z);
 
 // Add glow
 const glowGeo = new THREE.SphereGeometry(starData.size * 1.5, 16, 16);
 const glowMat = new THREE.MeshBasicMaterial({
 color: starData.color,
 transparent: true,
 opacity: 0.3,
 side: THREE.BackSide,
 depthWrite: false // Don't block objects behind the glow
 });
 const glow = new THREE.Mesh(glowGeo, glowMat);
 star.add(glow);
 
 star.userData = {
 name: starData.name,
 type: 'Distant Star',
 radius: starData.size,
 description: starData.description,
 distance: 'Light-years away',
 realSize: `${starData.size} solar radii`,
 funFact: starData.name === 'Betelgeuse' ? 'Betelgeuse could go supernova any day now (astronomically speaking - could be tomorrow or 100,000 years!)' : 
 starData.name === 'Sirius' ? 'Sirius is actually getting closer to us - it will be at its closest in about 60,000 years!' :
 'This star is visible to the naked eye from Earth!'
 };
 
 scene.add(star);
 this.objects.push(star);
 this.distantStars.push(star);
 });
 }

 createNebulae(scene) {
 // Create colorful nebulae with procedural generation
 this.nebulae = [];
 
 const nebulaeData = [
 { 
 name: 'Orion Nebula', 
 color: 0xFF69B4, 
 position: { x: 6000, y: 1000, z: 3000 }, 
 size: 400, 
 type: 'emission', // Star-forming region
 description: ' The Orion Nebula is a stellar nursery where new stars are being born! It\'s 1,344 light-years away and is visible to the naked eye as a fuzzy patch in Orion\'s sword. Contains over 3,000 stars!'
 },
 { 
 name: 'Crab Nebula', 
 color: 0x87CEEB, 
 position: { x: -5500, y: -800, z: 4500 }, 
 size: 300, 
 type: 'supernova', // Supernova remnant with filaments
 description: ' The Crab Nebula is the remnant of a supernova explosion observed by Chinese astronomers in 1054 AD! At its center is a pulsar spinning 30 times per second!'
 },
 { 
 name: 'Ring Nebula', 
 color: 0x9370DB, 
 position: { x: 4500, y: 1500, z: -5000 }, 
 size: 250, 
 type: 'planetary', // Planetary nebula (ring shape)
 description: ' The Ring Nebula is a planetary nebula - the glowing remains of a dying Sun-like star! The star at its center has blown off its outer layers, creating this beautiful ring.'
 }
 ];

 for (const nebData of nebulaeData) {
 const group = new THREE.Group();
 
 // Create procedural nebula with particles
 const particleCount = 8000;
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(particleCount * 3);
 const colors = new Float32Array(particleCount * 3);
 const sizes = new Float32Array(particleCount);
 
 const color = new THREE.Color(nebData.color);
 
 for (let i = 0; i < particleCount; i++) {
 let x, y, z;
 
 if (nebData.type === 'planetary') {
 // Ring shape for planetary nebula
 const angle = Math.random() * Math.PI * 2;
 const radius = nebData.size * 0.4 + Math.random() * nebData.size * 0.3;
 const thickness = (Math.random() - 0.5) * nebData.size * 0.15;
 x = Math.cos(angle) * radius;
 y = Math.sin(angle) * radius;
 z = thickness;
 } else if (nebData.type === 'supernova') {
 // Filamentary structure for supernova remnant
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.random() * Math.PI;
 const r = Math.pow(Math.random(), 0.3) * nebData.size;
 x = r * Math.sin(phi) * Math.cos(theta);
 y = r * Math.sin(phi) * Math.sin(theta);
 z = r * Math.cos(phi);
 } else {
 // Cloudy emission nebula
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.random() * Math.PI;
 const r = Math.pow(Math.random(), 0.5) * nebData.size;
 x = r * Math.sin(phi) * Math.cos(theta);
 y = r * Math.sin(phi) * Math.sin(theta);
 z = r * Math.cos(phi);
 }
 
 positions[i * 3] = x;
 positions[i * 3 + 1] = y;
 positions[i * 3 + 2] = z;
 
 // Color variation
 const colorVariation = 0.8 + Math.random() * 0.4;
 colors[i * 3] = color.r * colorVariation;
 colors[i * 3 + 1] = color.g * colorVariation;
 colors[i * 3 + 2] = color.b * colorVariation;
 
 sizes[i] = Math.random() * 3 + 1;
 }
 
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
 
 const material = new THREE.PointsMaterial({
 size: 2,
 vertexColors: true,
 transparent: true,
 opacity: 0.8,
 blending: THREE.AdditiveBlending,
 sizeAttenuation: true,
 depthWrite: false
 });
 
 const particles = new THREE.Points(geometry, material);
 group.add(particles);
 
 group.position.set(nebData.position.x, nebData.position.y, nebData.position.z);
 
 group.userData = {
 name: nebData.name,
 type: 'Nebula',
 radius: nebData.size,
 description: nebData.description,
 distance: 'Thousands of light-years',
 funFact: nebData.name === 'Orion Nebula' ? 'New stars are being born here right now!' :
 nebData.name === 'Crab Nebula' ? 'It\'s expanding at 1,500 km/s!' :
 'Planetary nebulae have nothing to do with planets - they just look round like planets through old telescopes!',
 basePosition: { x: nebData.position.x, y: nebData.position.y, z: nebData.position.z }
 };
 
 scene.add(group);
 this.objects.push(group);
 this.nebulae.push(group);
 }
 }

 createConstellations(scene) {
 // Create famous star constellations visible from Earth
 this.constellations = [];
 
 // Constellation data: star positions (RA/Dec converted to 3D) and connections
 const constellationsData = [
 // === ZODIAC CONSTELLATIONS (12 Signs) ===
 {
 name: 'Aries (The Ram)',
 description: ' Aries is the first sign of the zodiac! Look for the bright stars Hamal and Sheratan. In Greek mythology, Aries represents the golden ram that saved Phrixus and Helle.',
 stars: [
 { name: 'Hamal', ra: 31.8, dec: 23.5, mag: 2.0, color: 0xFFA500 },
 { name: 'Sheratan', ra: 28.7, dec: 20.8, mag: 2.6, color: 0xFFFFE0 },
 { name: 'Mesarthim', ra: 28.4, dec: 19.3, mag: 3.9, color: 0xFFFFF0 }
 ],
 lines: [[0,1], [1,2]] // Ram's head
 },
 {
 name: 'Taurus (The Bull)',
 description: ' Taurus contains the bright red star Aldebaran, the bull\'s eye! Also home to the Pleiades star cluster. In mythology, Zeus transformed into a bull to win Europa.',
 stars: [
 { name: 'Aldebaran', ra: 68.9, dec: 16.5, mag: 0.9, color: 0xFF6347 }, // Red giant
 { name: 'Elnath', ra: 81.6, dec: 28.6, mag: 1.7, color: 0xE0FFFF },
 { name: 'Alcyone', ra: 56.9, dec: 24.1, mag: 2.9, color: 0xE0FFFF }, // Pleiades
 { name: 'Zeta Tauri', ra: 84.4, dec: 21.1, mag: 3.0, color: 0xFFFFE0 }
 ],
 lines: [[0,1], [0,2], [1,3]] // Bull's head and horns
 },
 {
 name: 'Gemini (The Twins)',
 description: ' Gemini features the bright twins Castor and Pollux! In mythology, they were inseparable brothers, the Dioscuri, known for their bond and bravery.',
 stars: [
 { name: 'Pollux', ra: 116.3, dec: 28.0, mag: 1.2, color: 0xFFA500 },
 { name: 'Castor', ra: 113.6, dec: 31.9, mag: 1.6, color: 0xFFFFF0 },
 { name: 'Alhena', ra: 99.4, dec: 16.4, mag: 1.9, color: 0xFFFFF0 },
 { name: 'Mebsuta', ra: 100.0, dec: 25.1, mag: 3.0, color: 0xFFFFE0 }
 ],
 lines: [[0,1], [0,2], [1,3], [2,3]] // Twin figures
 },
 {
 name: 'Cancer (The Crab)',
 description: ' Cancer is faint but contains the beautiful Beehive Cluster (M44)! In mythology, Cancer was the crab sent by Hera to distract Hercules during his battle.',
 stars: [
 { name: 'Altarf', ra: 124.1, dec: 9.2, mag: 3.5, color: 0xFFA500 },
 { name: 'Acubens', ra: 134.6, dec: 11.9, mag: 4.3, color: 0xFFFFF0 },
 { name: 'Asellus Australis', ra: 130.1, dec: 18.2, mag: 3.9, color: 0xFFA500 },
 { name: 'Asellus Borealis', ra: 131.2, dec: 21.5, mag: 4.7, color: 0xFFFFF0 }
 ],
 lines: [[0,1], [0,2], [2,3]] // Crab shape
 },
 {
 name: 'Leo (The Lion)',
 description: ' Leo is home to the bright star Regulus! The "Sickle" asterism forms the lion\'s head. In mythology, Leo represents the Nemean Lion slain by Hercules.',
 stars: [
 { name: 'Regulus', ra: 152.1, dec: 11.9, mag: 1.4, color: 0xE0FFFF },
 { name: 'Denebola', ra: 177.4, dec: 14.6, mag: 2.1, color: 0xFFFFF0 },
 { name: 'Algieba', ra: 154.9, dec: 19.8, mag: 2.0, color: 0xFFA500 },
 { name: 'Zosma', ra: 168.5, dec: 20.5, mag: 2.6, color: 0xFFFFF0 }
 ],
 lines: [[0,2], [0,3], [3,1], [2,3]] // Lion's body
 },
 {
 name: 'Virgo (The Maiden)',
 description: ' Virgo is the second largest constellation! The bright star Spica represents wheat in the maiden\'s hand. Home to thousands of galaxies in the Virgo Cluster.',
 stars: [
 { name: 'Spica', ra: 201.3, dec: -11.2, mag: 1.0, color: 0xE0FFFF },
 { name: 'Vindemiatrix', ra: 195.5, dec: 10.9, mag: 2.8, color: 0xFFFFE0 },
 { name: 'Porrima', ra: 190.4, dec: -1.4, mag: 2.7, color: 0xFFFFF0 },
 { name: 'Zavijava', ra: 177.7, dec: 1.8, mag: 3.6, color: 0xFFFFF0 }
 ],
 lines: [[0,2], [2,3], [3,1]] // Maiden figure
 },
 {
 name: 'Libra (The Scales)',
 description: ' Libra represents the scales of justice! Its brightest stars are Zubenelgenubi and Zubeneschamali, meaning "southern claw" and "northern claw" in Arabic.',
 stars: [
 { name: 'Zubeneschamali', ra: 229.3, dec: -9.4, mag: 2.6, color: 0xE0FFFF },
 { name: 'Zubenelgenubi', ra: 222.7, dec: -16.0, mag: 2.8, color: 0xFFFFE0 },
 { name: 'Brachium', ra: 233.9, dec: -25.3, mag: 3.3, color: 0xFFA500 }
 ],
 lines: [[0,1], [1,2]] // Scale balance
 },
 {
 name: 'Scorpius (The Scorpion)',
 description: ' Scorpius represents the scorpion that killed Orion in Greek mythology! The bright red star Antares marks the scorpion\'s heart. Look for the curved tail with the stinger!',
 stars: [
 { name: 'Antares', ra: 247.4, dec: -26.4, mag: 1.0, color: 0xFF4500 }, // Red supergiant
 { name: 'Shaula', ra: 263.4, dec: -37.1, mag: 1.6, color: 0xE0FFFF },
 { name: 'Sargas', ra: 264.3, dec: -43.0, mag: 1.9, color: 0xFFFFE0 },
 { name: 'Dschubba', ra: 240.1, dec: -22.6, mag: 2.3, color: 0xE0FFFF },
 { name: 'Graffias', ra: 241.4, dec: -19.8, mag: 2.6, color: 0xFFFFE0 }
 ],
 lines: [[4,3], [3,0], [0,1], [1,2]] // Scorpion curve
 },
 {
 name: 'Sagittarius (The Archer)',
 description: ' Sagittarius aims his arrow at the heart of Scorpius! The "Teapot" asterism is easy to spot. Points toward the center of our Milky Way galaxy!',
 stars: [
 { name: 'Kaus Australis', ra: 276.0, dec: -34.4, mag: 1.8, color: 0xE0FFFF },
 { name: 'Nunki', ra: 283.8, dec: -26.3, mag: 2.0, color: 0xE0FFFF },
 { name: 'Ascella', ra: 290.7, dec: -29.9, mag: 2.6, color: 0xFFFFF0 },
 { name: 'Kaus Media', ra: 274.4, dec: -29.8, mag: 2.7, color: 0xFFA500 },
 { name: 'Kaus Borealis', ra: 276.9, dec: -25.4, mag: 2.8, color: 0xFFA500 }
 ],
 lines: [[0,3], [3,4], [4,1], [1,2], [2,0]] // Teapot shape
 },
 {
 name: 'Capricornus (The Sea-Goat)',
 description: ' Capricornus is one of the oldest constellations! Represents a creature with the head of a goat and tail of a fish. Associated with the god Pan in Greek mythology.',
 stars: [
 { name: 'Deneb Algedi', ra: 326.8, dec: -16.1, mag: 2.9, color: 0xFFFFF0 },
 { name: 'Dabih', ra: 305.3, dec: -14.8, mag: 3.1, color: 0xFFA500 },
 { name: 'Nashira', ra: 325.0, dec: -16.7, mag: 3.7, color: 0xFFFFF0 },
 { name: 'Algedi', ra: 304.5, dec: -12.5, mag: 3.6, color: 0xFFFFE0 }
 ],
 lines: [[1,3], [1,0], [0,2]] // Sea-goat body
 },
 {
 name: 'Aquarius (The Water-Bearer)',
 description: ' Aquarius represents the water-bearer pouring from his urn! Home to several famous deep-sky objects including the Helix Nebula. One of the oldest named constellations.',
 stars: [
 { name: 'Sadalsuud', ra: 322.9, dec: -5.6, mag: 2.9, color: 0xFFFFE0 },
 { name: 'Sadalmelik', ra: 331.4, dec: -0.3, mag: 3.0, color: 0xFFFFE0 },
 { name: 'Skat', ra: 346.2, dec: -15.8, mag: 3.3, color: 0xFFFFF0 },
 { name: 'Albali', ra: 315.9, dec: -9.5, mag: 3.8, color: 0xFFFFF0 }
 ],
 lines: [[3,0], [0,1], [1,2]] // Water flow
 },
 {
 name: 'Pisces (The Fish)',
 description: ' Pisces shows two fish tied together! Represents Aphrodite and Eros who transformed into fish to escape the monster Typhon. Contains the vernal equinox point!',
 stars: [
 { name: 'Alpherg', ra: 2.0, dec: 2.8, mag: 3.8, color: 0xFFFFE0 },
 { name: 'Alrescha', ra: 8.0, dec: 2.8, mag: 3.8, color: 0xFFFFF0 },
 { name: 'Fumalsamakah', ra: 351.0, dec: 6.9, mag: 4.5, color: 0xFFFFF0 },
 { name: 'Delta Piscium', ra: 357.5, dec: 7.6, mag: 4.4, color: 0xFFFFF0 }
 ],
 lines: [[2,3], [3,0], [0,1]] // Two fish connected
 },
 
 // === FAMOUS NON-ZODIAC CONSTELLATIONS ===
 {
 name: 'Orion (The Hunter)',
 description: '? Orion is one of the most recognizable constellations! Look for the three stars in a row forming Orion\'s Belt. The bright red star Betelgeuse marks his shoulder, and blue Rigel marks his foot.',
 stars: [
 { name: 'Betelgeuse', ra: 88.8, dec: 7.4, mag: 0.5, color: 0xFF4500 }, // Red supergiant
 { name: 'Rigel', ra: 78.6, dec: -8.2, mag: 0.1, color: 0x87CEEB }, // Blue supergiant
 { name: 'Bellatrix', ra: 81.3, dec: 6.3, mag: 1.6, color: 0xB0C4DE },
 { name: 'Alnitak', ra: 85.2, dec: -1.9, mag: 1.8, color: 0xE0FFFF }, // Belt star 1
 { name: 'Alnilam', ra: 84.1, dec: -1.2, mag: 1.7, color: 0xE0FFFF }, // Belt star 2
 { name: 'Mintaka', ra: 83.0, dec: -0.3, mag: 2.2, color: 0xE0FFFF }, // Belt star 3
 { name: 'Saiph', ra: 86.9, dec: -9.7, mag: 2.1, color: 0xB0E0E6 }
 ],
 lines: [[0,2], [2,3], [3,4], [4,5], [5,1], [1,6], [6,3]] // Connect stars
 },
 {
 name: 'Big Dipper (Ursa Major)',
 description: ' The Big Dipper is actually part of Ursa Major (Great Bear)! The two stars at the end of the "cup" point to Polaris, the North Star. Used for navigation for thousands of years!',
 stars: [
 { name: 'Dubhe', ra: 165.9, dec: 61.8, mag: 1.8, color: 0xFFFFE0 },
 { name: 'Merak', ra: 165.5, dec: 56.4, mag: 2.4, color: 0xFFFFF0 },
 { name: 'Phecda', ra: 178.5, dec: 53.7, mag: 2.4, color: 0xFFFFF0 },
 { name: 'Megrez', ra: 183.9, dec: 57.0, mag: 3.3, color: 0xFFFFF0 },
 { name: 'Alioth', ra: 193.5, dec: 55.96, mag: 1.8, color: 0xFFFFE0 },
 { name: 'Mizar', ra: 200.9, dec: 54.9, mag: 2.2, color: 0xFFFFF0 },
 { name: 'Alkaid', ra: 206.9, dec: 49.3, mag: 1.9, color: 0xFFFFE0 }
 ],
 lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6]] // Dipper shape
 },
 {
 name: 'Little Dipper (Ursa Minor)',
 description: ' The Little Dipper contains Polaris, the North Star! Polaris marks the end of the Little Dipper\'s handle and stays nearly fixed in the northern sky. Essential for celestial navigation!',
 stars: [
 { name: 'Polaris', ra: 37.95, dec: 89.26, mag: 2.0, color: 0xFFFACD }, // North Star!
 { name: 'Yildun', ra: 263.05, dec: 86.58, mag: 4.4, color: 0xFFFFF0 },
 { name: 'Epsilon UMi', ra: 256.47, dec: 81.83, mag: 4.2, color: 0xFFFFE0 },
 { name: 'Kochab', ra: 222.68, dec: 74.16, mag: 2.1, color: 0xFFA500 }, // Orange giant
 { name: 'Pherkad', ra: 230.18, dec: 71.83, mag: 3.0, color: 0xFFFFF0 },
 { name: 'Zeta UMi', ra: 228.32, dec: 77.79, mag: 4.3, color: 0xFFFFF0 },
 { name: 'Eta UMi', ra: 246.81, dec: 75.75, mag: 5.0, color: 0xFFFFF0 }
 ],
 lines: [[0,1], [1,6], [6,2], [2,5], [5,3], [3,4]] // Little Dipper shape
 },
 {
 name: 'Southern Cross (Crux)',
 description: ' The Southern Cross is the smallest constellation but one of the most famous in the Southern Hemisphere! Used for navigation, it points towards the South Celestial Pole.',
 stars: [
 { name: 'Acrux', ra: 186.6, dec: -63.1, mag: 0.8, color: 0xE0FFFF },
 { name: 'Mimosa', ra: 191.9, dec: -59.7, mag: 1.3, color: 0xE0FFFF },
 { name: 'Gacrux', ra: 187.8, dec: -57.1, mag: 1.6, color: 0xFF6347 }, // Red giant
 { name: 'Delta Crucis', ra: 183.8, dec: -58.7, mag: 2.8, color: 0xFFFFE0 }
 ],
 lines: [[2,0], [0,1], [3,1], [3,2]] // Cross shape
 },
 {
 name: 'Cassiopeia (The Queen)',
 description: ' Cassiopeia looks like a W or M depending on the season! In Greek mythology, Cassiopeia was a vain queen. The constellation is circumpolar in northern latitudes, meaning it never sets.',
 stars: [
 { name: 'Schedar', ra: 10.1, dec: 56.5, mag: 2.2, color: 0xFFA500 },
 { name: 'Caph', ra: 2.3, dec: 59.1, mag: 2.3, color: 0xFFFFF0 },
 { name: 'Gamma Cas', ra: 14.2, dec: 60.7, mag: 2.5, color: 0xE0FFFF },
 { name: 'Ruchbah', ra: 21.5, dec: 60.2, mag: 2.7, color: 0xFFFFF0 },
 { name: 'Segin', ra: 25.6, dec: 63.7, mag: 3.4, color: 0xFFFFE0 }
 ],
 lines: [[0,1], [1,2], [2,3], [3,4]] // W shape
 },
 {
 name: 'Cygnus (The Swan)',
 description: ' Cygnus the Swan flies along the Milky Way! Also called the Northern Cross. In mythology, Zeus disguised himself as a swan. Home to many deep-sky objects!',
 stars: [
 { name: 'Deneb', ra: 310.4, dec: 45.3, mag: 1.3, color: 0xE0FFFF }, // Supergiant
 { name: 'Albireo', ra: 292.7, dec: 27.9, mag: 3.1, color: 0xFFA500 }, // Beautiful double star
 { name: 'Sadr', ra: 305.6, dec: 40.3, mag: 2.2, color: 0xFFFFE0 },
 { name: 'Gienah', ra: 312.3, dec: 33.9, mag: 2.5, color: 0xFFFFF0 },
 { name: 'Delta Cygni', ra: 296.2, dec: 45.1, mag: 2.9, color: 0xE0FFFF }
 ],
 lines: [[0,2], [2,1], [2,3], [2,4]] // Cross/Swan shape
 },
 {
 name: 'Lyra (The Lyre)',
 description: ' Lyra represents the lyre of Orpheus! Contains Vega, the 5th brightest star in the night sky. Also home to the Ring Nebula, a famous planetary nebula!',
 stars: [
 { name: 'Vega', ra: 279.2, dec: 38.8, mag: 0.0, color: 0xE0FFFF }, // Very bright!
 { name: 'Sheliak', ra: 282.5, dec: 33.4, mag: 3.5, color: 0xE0FFFF },
 { name: 'Sulafat', ra: 284.7, dec: 32.7, mag: 3.2, color: 0xE0FFFF },
 { name: 'Delta Lyrae', ra: 283.8, dec: 36.9, mag: 4.3, color: 0xE0FFFF }
 ],
 lines: [[0,3], [0,1], [1,2]] // Lyre shape
 },
 {
 name: 'Andromeda (The Princess)',
 description: ' Andromeda was the princess chained to a rock and rescued by Perseus! This constellation contains the Andromeda Galaxy (M31), our nearest large galaxy neighbor!',
 stars: [
 { name: 'Alpheratz', ra: 2.1, dec: 29.1, mag: 2.1, color: 0xE0FFFF },
 { name: 'Mirach', ra: 17.4, dec: 35.6, mag: 2.1, color: 0xFF6347 }, // Red giant
 { name: 'Almach', ra: 30.9, dec: 42.3, mag: 2.2, color: 0xFFA500 },
 { name: 'Delta Andromedae', ra: 8.5, dec: 31.1, mag: 3.3, color: 0xFFFFF0 }
 ],
 lines: [[0,3], [3,1], [1,2]] // Princess figure
 },
 {
 name: 'Perseus (The Hero)',
 description: ' Perseus the hero who slayed Medusa! Home to the bright star Mirfak and the famous variable star Algol ("Demon Star"). Contains the Double Cluster!',
 stars: [
 { name: 'Mirfak', ra: 51.1, dec: 49.9, mag: 1.8, color: 0xFFFFE0 },
 { name: 'Algol', ra: 47.0, dec: 40.9, mag: 2.1, color: 0xE0FFFF }, // The Demon Star
 { name: 'Atik', ra: 54.1, dec: 32.3, mag: 2.9, color: 0xE0FFFF },
 { name: 'Gamma Persei', ra: 48.0, dec: 53.5, mag: 2.9, color: 0xFFFFE0 }
 ],
 lines: [[3,0], [0,1], [1,2]] // Hero with sword
 }
 ];
 
 constellationsData.forEach(constData => {
 const group = new THREE.Group();
 const starMeshes = [];
 
 // Convert RA/Dec to 3D positions at distance 10000
 constData.stars.forEach(star => {
 // Convert RA (0-360°) and Dec (-90 to +90°) to radians
 const raRad = (star.ra * Math.PI) / 180;
 const decRad = (star.dec * Math.PI) / 180;
 const distance = 10000;
 
 // Spherical to Cartesian coordinates
 // We view from INSIDE the celestial sphere (like from Earth)
 // So we INVERT the coordinates to see them correctly
 const x = -distance * Math.cos(decRad) * Math.cos(raRad);
 const y = distance * Math.sin(decRad);
 const z = -distance * Math.cos(decRad) * Math.sin(raRad);
 
 // Create star
 const starSize = 15 * Math.pow(2.5, -star.mag); // Brighter = larger
 const starGeom = new THREE.SphereGeometry(starSize, 8, 8);
 const starMat = new THREE.MeshBasicMaterial({
 color: star.color,
 transparent: true,
 opacity: 0.9
 });
 
 const starMesh = new THREE.Mesh(starGeom, starMat);
 starMesh.position.set(x, y, z);
 group.add(starMesh);
 starMeshes.push(starMesh);
 
 // Add glow
 const glowGeom = new THREE.SphereGeometry(starSize * 2, 8, 8);
 const glowMat = new THREE.MeshBasicMaterial({
 color: star.color,
 transparent: true,
 opacity: 0.3,
 blending: THREE.AdditiveBlending,
 depthWrite: false // Don't block objects behind the glow
 });
 const glow = new THREE.Mesh(glowGeom, glowMat);
 starMesh.add(glow);
 });
 
 // Draw constellation lines
 constData.lines.forEach(line => {
 const points = [
 starMeshes[line[0]].position,
 starMeshes[line[1]].position
 ];
 const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
 const lineMat = new THREE.LineBasicMaterial({
 color: 0x4488FF,
 transparent: true,
 opacity: 0.4,
 linewidth: 2
 });
 const lineMesh = new THREE.Line(lineGeom, lineMat);
 group.add(lineMesh);
 });
 
 // Add constellation metadata
 group.userData = {
 name: constData.name,
 type: 'Constellation',
 description: constData.description,
 distance: '100s to 1000s of light-years',
 starCount: constData.stars.length
 };
 
 scene.add(group);
 this.objects.push(group);
 this.constellations.push(group);
 });
 
 console.log(`? Created ${this.constellations.length} constellations with star patterns!`);
 }

 createGalaxies(scene) {
 // Create distant galaxies with procedural generation
 this.galaxies = [];
 
 const galaxiesData = [
 { 
 name: 'Andromeda Galaxy', 
 position: { x: 12000, y: 2000, z: -8000 }, 
 size: 600, 
 type: 'spiral', 
 description: ' The Andromeda Galaxy is our nearest large galactic neighbor, 2.5 million light-years away! It contains 1 trillion stars and is on a collision course with the Milky Way (don\'t worry, collision in 4.5 billion years).'
 },
 { 
 name: 'Whirlpool Galaxy', 
 position: { x: -10000, y: -1500, z: -9000 }, 
 size: 400, 
 type: 'spiral', 
 description: ' The Whirlpool Galaxy (M51) is famous for its beautiful spiral arms! It\'s interacting with a smaller companion galaxy, creating stunning tidal forces and new star formation.'
 },
 { 
 name: 'Sombrero Galaxy', 
 position: { x: -8000, y: 3000, z: 7000 }, 
 size: 350, 
 type: 'elliptical', 
 description: ' The Sombrero Galaxy looks like a Mexican hat! It has a bright nucleus, an unusually large central bulge, and a prominent dust lane. Contains 2,000 globular clusters!'
 }
 ];

 for (const galData of galaxiesData) {
 const group = new THREE.Group();
 
 // Create procedural spiral or elliptical structure
 if (galData.type === 'spiral') {
 // Spiral arms
 const spiralCount = 8000;
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(spiralCount * 3);
 const colors = new Float32Array(spiralCount * 3);
 
 for (let i = 0; i < spiralCount; i++) {
 const angle = (i / spiralCount) * Math.PI * 6; // Multiple spirals
 const distance = (i / spiralCount) * galData.size;
 const spiral = 0.3;
 
 positions[i * 3] = distance * Math.cos(angle) + (Math.random() - 0.5) * 30;
 positions[i * 3 + 1] = (Math.random() - 0.5) * galData.size * 0.1;
 positions[i * 3 + 2] = distance * Math.sin(angle) * spiral + (Math.random() - 0.5) * 30;
 
 const brightness = 0.7 + Math.random() * 0.3;
 colors[i * 3] = brightness;
 colors[i * 3 + 1] = brightness * 0.9;
 colors[i * 3 + 2] = brightness * 1.1;
 }
 
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 
 const material = new THREE.PointsMaterial({
 size: 3,
 vertexColors: true,
 transparent: true,
 opacity: 0.8,
 blending: THREE.AdditiveBlending
 });
 
 const spiral = new THREE.Points(geometry, material);
 group.add(spiral);
 } else {
 // Elliptical galaxy
 const ellipCount = 5000;
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(ellipCount * 3);
 const colors = new Float32Array(ellipCount * 3);
 
 for (let i = 0; i < ellipCount; i++) {
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const radius = Math.pow(Math.random(), 0.7) * galData.size;
 
 positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
 positions[i * 3 + 2] = radius * Math.cos(phi);
 
 const brightness = 0.8 + Math.random() * 0.2;
 colors[i * 3] = brightness * 1.0;
 colors[i * 3 + 1] = brightness * 0.9;
 colors[i * 3 + 2] = brightness * 0.7;
 }
 
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 
 const material = new THREE.PointsMaterial({
 size: 3,
 vertexColors: true,
 transparent: true,
 opacity: 0.7,
 blending: THREE.AdditiveBlending
 });
 
 const elliptical = new THREE.Points(geometry, material);
 group.add(elliptical);
 }
 
 // Core
 const coreGeo = new THREE.SphereGeometry(galData.size * 0.1, 32, 32);
 const coreMat = new THREE.MeshBasicMaterial({
 color: 0xFFFFDD,
 transparent: true,
 opacity: 0.9
 });
 const core = new THREE.Mesh(coreGeo, coreMat);
 group.add(core);
 
 group.position.set(galData.position.x, galData.position.y, galData.position.z);
 group.rotation.x = Math.random() * Math.PI * 0.3;
 group.rotation.y = Math.random() * Math.PI * 2;
 
 group.userData = {
 name: galData.name,
 type: 'Galaxy',
 radius: galData.size,
 description: galData.description,
 distance: 'Millions of light-years',
 realSize: '100,000+ light-years across',
 funFact: galData.name === 'Andromeda Galaxy' ? 'Andromeda is approaching us at 110 km/s!' :
 galData.name === 'Whirlpool Galaxy' ? 'You can see this galaxy with a good pair of binoculars!' :
 'Despite billions of stars, galaxies are mostly empty space!',
 basePosition: { x: galData.position.x, y: galData.position.y, z: galData.position.z }
 };
 
 scene.add(group);
 this.objects.push(group);
 this.galaxies.push(group);
 }
 }

 createNearbyStars(scene) {
 // Create Alpha Centauri system (our nearest stellar neighbor)
 this.nearbyStars = [];
 
 // Alpha Centauri A & B (binary system) - 4.37 light-years away
 const alphaCentauriGroup = new THREE.Group();
 
 // Alpha Centauri A (Sun-like star)
 const alphaAGeo = new THREE.SphereGeometry(12, 64, 64);
 const alphaAMat = new THREE.MeshBasicMaterial({
 color: 0xFFFAE3,
 emissive: 0xFFFAE3,
 emissiveIntensity: 1.5,
 toneMapped: false
 });
 const alphaA = new THREE.Mesh(alphaAGeo, alphaAMat);
 alphaA.position.set(8000, 1000, -6000);
 
 // Glow for Alpha Centauri A
 const glowAGeo = new THREE.SphereGeometry(18, 32, 32);
 const glowAMat = new THREE.MeshBasicMaterial({
 color: 0xFFFFAA,
 transparent: true,
 opacity: 0.3,
 blending: THREE.AdditiveBlending
 });
 const glowA = new THREE.Mesh(glowAGeo, glowAMat);
 alphaA.add(glowA);
 
 alphaA.userData = {
 name: ' Alpha Centauri A',
 type: 'Star',
 description: ' Alpha Centauri A is very similar to our Sun! It\'s part of a triple star system that is our closest stellar neighbor at 4.37 light-years away. With its companion Alpha Centauri B, they orbit each other every 80 years.',
 distance: '4.37 light-years',
 realSize: '1.22 times the Sun\'s diameter',
 funFact: 'Alpha Centauri is visible from the Southern Hemisphere and is the third brightest star in our night sky!'
 };
 
 alphaCentauriGroup.add(alphaA);
 
 // Proxima Centauri (red dwarf, technically closest star) - 4.24 light-years
 const proximaGeo = new THREE.SphereGeometry(6, 32, 32);
 const proximaMat = new THREE.MeshBasicMaterial({
 color: 0xFF6347,
 emissive: 0xFF4444,
 emissiveIntensity: 1.2,
 toneMapped: false
 });
 const proxima = new THREE.Mesh(proximaGeo, proximaMat);
 proxima.position.set(8500, 800, -6200);
 
 // Glow for Proxima
 const glowPGeo = new THREE.SphereGeometry(10, 32, 32);
 const glowPMat = new THREE.MeshBasicMaterial({
 color: 0xFF6666,
 transparent: true,
 opacity: 0.4,
 blending: THREE.AdditiveBlending
 });
 const glowP = new THREE.Mesh(glowPGeo, glowPMat);
 proxima.add(glowP);
 
 proxima.userData = {
 name: ' Proxima Centauri',
 type: 'Red Dwarf Star',
 description: ' Proxima Centauri is a small red dwarf star and the closest star to our Solar System at just 4.24 light-years! It\'s much cooler and dimmer than our Sun, but it has at least two planets, including potentially habitable Proxima Centauri b.',
 distance: '4.24 light-years (40 trillion km!)',
 realSize: '0.14 times the Sun\'s diameter',
 funFact: 'Despite being our closest star, Proxima is too dim to see with the naked eye!'
 };
 
 alphaCentauriGroup.add(proxima);
 
 scene.add(alphaCentauriGroup);
 this.objects.push(alphaA);
 this.objects.push(proxima);
 this.nearbyStars.push(alphaA);
 this.nearbyStars.push(proxima);
 
 // Kepler-452 (Sun-like star for Kepler-452b) - 1,400 light-years away
 const kepler452Geo = new THREE.SphereGeometry(13, 64, 64);
 const kepler452Mat = new THREE.MeshBasicMaterial({
 color: 0xFFFAD4,
 emissive: 0xFFFAD4,
 emissiveIntensity: 1.5,
 toneMapped: false
 });
 const kepler452 = new THREE.Mesh(kepler452Geo, kepler452Mat);
 kepler452.position.set(-9000, 2500, 8450); // Near Kepler-452b
 
 // Glow for Kepler-452
 const glowK452Geo = new THREE.SphereGeometry(20, 32, 32);
 const glowK452Mat = new THREE.MeshBasicMaterial({
 color: 0xFFFFAA,
 transparent: true,
 opacity: 0.3,
 blending: THREE.AdditiveBlending
 });
 const glowK452 = new THREE.Mesh(glowK452Geo, glowK452Mat);
 kepler452.add(glowK452);
 
 kepler452.userData = {
 name: ' Kepler-452 (Sun-like Star)',
 type: 'G-type Star',
 description: ' Kepler-452 is a Sun-like star that hosts Earth\'s "cousin" planet Kepler-452b! It\'s 1.5 billion years older than our Sun and 20% brighter. The star is 1,400 light-years away in the constellation Cygnus.',
 distance: '1,400 light-years',
 realSize: '1.11 times the Sun\'s diameter',
 funFact: 'Kepler-452 is 6 billion years old - it shows us what our Sun might be like in 1.5 billion years!'
 };
 
 scene.add(kepler452);
 this.objects.push(kepler452);
 this.nearbyStars.push(kepler452);
 
 // TRAPPIST-1 (ultra-cool red dwarf) - 40 light-years away
 const trappist1Geo = new THREE.SphereGeometry(5, 32, 32);
 const trappist1Mat = new THREE.MeshBasicMaterial({
 color: 0xFF5533,
 emissive: 0xFF4422,
 emissiveIntensity: 1.3,
 toneMapped: false
 });
 const trappist1 = new THREE.Mesh(trappist1Geo, trappist1Mat);
 trappist1.position.set(7000, -3000, -8950); // Near TRAPPIST-1e
 
 // Glow for TRAPPIST-1
 const glowT1Geo = new THREE.SphereGeometry(9, 32, 32);
 const glowT1Mat = new THREE.MeshBasicMaterial({
 color: 0xFF6644,
 transparent: true,
 opacity: 0.4,
 blending: THREE.AdditiveBlending
 });
 const glowT1 = new THREE.Mesh(glowT1Geo, glowT1Mat);
 trappist1.add(glowT1);
 
 trappist1.userData = {
 name: ' TRAPPIST-1 (Red Dwarf)',
 type: 'Ultra-cool Red Dwarf',
 description: ' TRAPPIST-1 is an ultra-cool red dwarf with 7 Earth-sized planets! Three of them are in the habitable zone. The entire system is so compact that all 7 planets orbit closer to their star than Mercury does to our Sun.',
 distance: '40 light-years',
 realSize: '0.12 times the Sun\'s diameter (barely larger than Jupiter!)',
 funFact: 'TRAPPIST-1 is named after the telescope that discovered it - The TRAnsiting Planets and PlanetesImals Small Telescope!'
 };
 
 scene.add(trappist1);
 this.objects.push(trappist1);
 this.nearbyStars.push(trappist1);
 
 // Kepler-186 (red dwarf) - 500 light-years away
 const kepler186Geo = new THREE.SphereGeometry(7, 32, 32);
 const kepler186Mat = new THREE.MeshBasicMaterial({
 color: 0xFF6B4A,
 emissive: 0xFF5533,
 emissiveIntensity: 1.2,
 toneMapped: false
 });
 const kepler186 = new THREE.Mesh(kepler186Geo, kepler186Mat);
 kepler186.position.set(-8000, -2000, 9450); // Near Kepler-186f
 
 // Glow for Kepler-186
 const glowK186Geo = new THREE.SphereGeometry(11, 32, 32);
 const glowK186Mat = new THREE.MeshBasicMaterial({
 color: 0xFF7755,
 transparent: true,
 opacity: 0.4,
 blending: THREE.AdditiveBlending
 });
 const glowK186 = new THREE.Mesh(glowK186Geo, glowK186Mat);
 kepler186.add(glowK186);
 
 kepler186.userData = {
 name: ' Kepler-186 (Red Dwarf)',
 type: 'M-type Red Dwarf',
 description: ' Kepler-186 is a red dwarf star with 5 known planets! Kepler-186f was the first Earth-sized planet discovered in the habitable zone of another star. The star is cooler than our Sun, giving it an orange-red glow.',
 distance: '500 light-years',
 realSize: '0.54 times the Sun\'s diameter',
 funFact: 'Plants on Kepler-186f would likely photosynthesize using infrared light and appear dark red or black!'
 };
 
 scene.add(kepler186);
 this.objects.push(kepler186);
 this.nearbyStars.push(kepler186);
 
 console.log(` Created ${this.nearbyStars.length} nearby stars and exoplanet host stars`);
 }

 createExoplanets(scene) {
 // Create famous discovered exoplanets
 this.exoplanets = [];
 
 const exoplanetsData = [
 {
 name: ' Proxima Centauri b',
 position: { x: 8520, y: 800, z: -6200 },
 radius: 1.1,
 color: 0x4A7BA7,
 description: ' Proxima Centauri b is the closest known exoplanet to Earth! It orbits in the habitable zone of Proxima Centauri, meaning liquid water could exist on its surface. Discovered in 2016, it\'s only 4.24 light-years away.',
 distance: '4.24 light-years',
 realSize: '~1.17 Earth masses',
 funFact: 'With current technology, it would take 6,300 years to reach Proxima b!'
 },
 {
 name: ' Kepler-452b',
 position: { x: -9000, y: 2500, z: 8500 },
 radius: 1.6,
 color: 0x5D8AA8,
 description: ' Kepler-452b is called "Earth\'s cousin"! It\'s about 60% larger than Earth and orbits a Sun-like star in the habitable zone. Its year is 385 days long. Could it have life? We don\'t know yet!',
 distance: '1,400 light-years',
 realSize: '1.6 times Earth\'s radius',
 funFact: 'Kepler-452b is 6 billion years old - 1.5 billion years older than Earth!'
 },
 {
 name: ' TRAPPIST-1e',
 position: { x: 7000, y: -3000, z: -9000 },
 radius: 0.92,
 color: 0x3A7CA5,
 description: ' TRAPPIST-1e is part of an amazing system with 7 Earth-sized planets! It orbits a cool red dwarf star and is in the habitable zone. The system is so compact that all 7 planets would fit inside Mercury\'s orbit!',
 distance: '40 light-years',
 realSize: '0.92 times Earth\'s radius',
 funFact: 'From TRAPPIST-1e, you could see the other planets as large as our Moon in the sky!'
 },
 {
 name: ' Kepler-186f',
 position: { x: -8000, y: -2000, z: 9500 },
 radius: 1.1,
 color: 0x2E5F6F,
 description: ' Kepler-186f was the first Earth-sized planet discovered in another star\'s habitable zone! It receives about one-third the light Earth gets from the Sun, so plants there (if any!) might appear black or red instead of green.',
 distance: '500 light-years',
 realSize: '1.1 times Earth\'s radius',
 funFact: 'Kepler-186f orbits a red dwarf, so its sky would glow orange-red!'
 }
 ];
 
 exoplanetsData.forEach(exoData => {
 const geometry = new THREE.SphereGeometry(exoData.radius, 32, 32);
 
 // Create Earth-like texture for exoplanets
 const canvas = document.createElement('canvas');
 canvas.width = 512;
 canvas.height = 256;
 const ctx = canvas.getContext('2d');
 
 // Base ocean color
 ctx.fillStyle = `rgb(${(exoData.color >> 16) & 255}, ${(exoData.color >> 8) & 255}, ${exoData.color & 255})`;
 ctx.fillRect(0, 0, 512, 256);
 
 // Add some land masses
 ctx.fillStyle = 'rgba(100, 140, 80, 0.7)';
 for (let i = 0; i < 8; i++) {
 ctx.beginPath();
 ctx.arc(Math.random() * 512, Math.random() * 256, 20 + Math.random() * 40, 0, Math.PI * 2);
 ctx.fill();
 }
 
 // Add clouds
 ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
 for (let i = 0; i < 15; i++) {
 ctx.beginPath();
 ctx.arc(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 20, 0, Math.PI * 2);
 ctx.fill();
 }
 
 const texture = new THREE.CanvasTexture(canvas);
 const material = new THREE.MeshStandardMaterial({
 map: texture,
 roughness: 0.8,
 metalness: 0.1,
 emissive: exoData.color,
 emissiveIntensity: 0.1
 });
 
 const planet = new THREE.Mesh(geometry, material);
 planet.position.set(exoData.position.x, exoData.position.y, exoData.position.z);
 
 // Add subtle glow
 const glowGeo = new THREE.SphereGeometry(exoData.radius * 1.2, 32, 32);
 const glowMat = new THREE.MeshBasicMaterial({
 color: 0x88AAFF,
 transparent: true,
 opacity: 0.15,
 blending: THREE.AdditiveBlending
 });
 const glow = new THREE.Mesh(glowGeo, glowMat);
 planet.add(glow);
 
 planet.userData = {
 name: exoData.name,
 type: 'Exoplanet',
 description: exoData.description,
 distance: exoData.distance,
 realSize: exoData.realSize,
 funFact: exoData.funFact
 };
 
 scene.add(planet);
 this.objects.push(planet);
 this.exoplanets.push(planet);
 });
 
 console.log(` Created ${this.exoplanets.length} famous exoplanets!`);
 }

 createComets(scene) {
 // Create comets with REALISTIC sizes (typically 1-60 km)
 // Halley: ~15 km, Hale-Bopp: ~60 km, NEOWISE: ~5 km
 this.comets = [];
 
 const cometsData = [
 // Halley: 15 km / 12,742 km = 0.0012
 { name: 'Halley\'s Comet', distance: 200, eccentricity: 0.967, speed: 0.001, size: 0.002, description: ' Halley\'s Comet is the most famous comet! It returns to Earth\'s vicinity every 75-76 years. Last seen in 1986, it will return in 2061. When you see it, you\'re viewing a 4.6 billion year old cosmic snowball!' },
 // Hale-Bopp: 60 km / 12,742 km = 0.0047
 { name: 'Comet Hale-Bopp', distance: 250, eccentricity: 0.995, speed: 0.0008, size: 0.005, description: ' Hale-Bopp was one of the brightest comets of the 20th century, visible to the naked eye for 18 months in 1996-1997! Its nucleus is unusually large at 60 km in diameter.' },
 // NEOWISE: 5 km / 12,742 km = 0.0004
 { name: 'Comet NEOWISE', distance: 180, eccentricity: 0.999, speed: 0.0012, size: 0.001, description: ' Comet NEOWISE was a spectacular sight in July 2020! It won\'t return for about 6,800 years. Comets are \"dirty snowballs\" made of ice, dust, and rock from the solar system\'s formation.' }
 ];

 cometsData.forEach((cometData, index) => {
 const cometGroup = new THREE.Group();
 
 // ===== HYPER-REALISTIC NUCLEUS =====
 // Irregular, potato-shaped icy-rocky core with surface details
 const nucleusGeometry = new THREE.IcosahedronGeometry(cometData.size, 2);
 
 // Deform vertices for irregular shape
 const positions = nucleusGeometry.attributes.position.array;
 for (let i = 0; i < positions.length; i += 3) {
 const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
 const distortion = 0.15 + Math.random() * 0.2; // Irregular shape
 vertex.multiplyScalar(distortion + 1.0);
 positions[i] = vertex.x;
 positions[i + 1] = vertex.y;
 positions[i + 2] = vertex.z;
 }
 nucleusGeometry.attributes.position.needsUpdate = true;
 nucleusGeometry.computeVertexNormals();
 
 const nucleusMaterial = new THREE.MeshStandardMaterial({
 color: 0x3a3a3a, // Dark gray-black (dirty ice + rock)
 roughness: 0.95,
 metalness: 0.05,
 emissive: 0x1a1a1a,
 emissiveIntensity: 0.1
 });
 
 const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
 cometGroup.add(nucleus);
 
 // Surface ice patches (bright spots)
 for (let i = 0; i < 8; i++) {
 const patchGeometry = new THREE.SphereGeometry(cometData.size * 0.15, 8, 8);
 const patchMaterial = new THREE.MeshStandardMaterial({
 color: 0xe8f4f8,
 roughness: 0.7,
 metalness: 0.1,
 emissive: 0x6699cc,
 emissiveIntensity: 0.3
 });
 const patch = new THREE.Mesh(patchGeometry, patchMaterial);
 patch.position.set(
 (Math.random() - 0.5) * cometData.size * 1.5,
 (Math.random() - 0.5) * cometData.size * 1.5,
 (Math.random() - 0.5) * cometData.size * 1.5
 );
 cometGroup.add(patch);
 }
 
 // Coma - glowing cloud with gradient opacity
 const comaLayers = 3;
 for (let layer = 0; layer < comaLayers; layer++) {
 const layerSize = cometData.size * (2.5 + layer * 0.8);
 const layerOpacity = 0.25 - layer * 0.08;
 const comaGeo = new THREE.SphereGeometry(layerSize, 32, 32);
 const comaMat = new THREE.MeshBasicMaterial({
 color: layer === 0 ? 0xaaddff : 0x88ccff,
 transparent: true,
 opacity: layerOpacity,
 side: THREE.BackSide,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 const coma = new THREE.Mesh(comaGeo, comaMat);
 cometGroup.add(coma);
 }
 
 // ===== HYPER-REALISTIC DUST TAIL =====
 // Curved, yellowish, with turbulent structure
 const dustParticles = 400;
 const dustTailGeometry = new THREE.BufferGeometry();
 const dustTailPositions = new Float32Array(dustParticles * 3);
 const dustTailColors = new Float32Array(dustParticles * 3);
 const dustTailSizes = new Float32Array(dustParticles);
 
 for (let i = 0; i < dustParticles; i++) {
 const t = i / dustParticles;
 const spread = t * 12; // Expanding spread
 const curve = t * t * 15; // Parabolic curve
 
 dustTailPositions[i * 3] = curve + (Math.random() - 0.5) * spread * 0.5;
 dustTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
 dustTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;
 
 // Size decreases with distance, with variation
 dustTailSizes[i] = (4 + Math.random() * 2) * (1 - t * 0.8);
 
 // Gradient: bright white-yellow → orange-red → dark
 const brightness = 1 - t * 0.7;
 dustTailColors[i * 3] = Math.min(1, 0.9 + t * 0.3) * brightness; // R
 dustTailColors[i * 3 + 1] = Math.max(0.3, 0.85 - t * 0.4) * brightness; // G 
 dustTailColors[i * 3 + 2] = Math.max(0, 1.0 - t * 0.9) * brightness; // B
 }
 
 dustTailGeometry.setAttribute('position', new THREE.BufferAttribute(dustTailPositions, 3));
 dustTailGeometry.setAttribute('color', new THREE.BufferAttribute(dustTailColors, 3));
 dustTailGeometry.setAttribute('size', new THREE.BufferAttribute(dustTailSizes, 1));
 
 const dustTailMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.75,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 
 const dustTail = new THREE.Points(dustTailGeometry, dustTailMaterial);
 cometGroup.add(dustTail);
 
 // ===== HYPER-REALISTIC ION TAIL =====
 // Straight, narrow, blue plasma stream
 const ionParticles = 300;
 const ionTailGeometry = new THREE.BufferGeometry();
 const ionTailPositions = new Float32Array(ionParticles * 3);
 const ionTailColors = new Float32Array(ionParticles * 3);
 const ionTailSizes = new Float32Array(ionParticles);
 
 for (let i = 0; i < ionParticles; i++) {
 const t = i / ionParticles;
 const spread = t * 4; // Narrower than dust tail
 const length = t * 25; // Longer than dust tail
 
 ionTailPositions[i * 3] = length + (Math.random() - 0.5) * 0.5;
 ionTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
 ionTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;
 
 // Size variation with wispy structures
 ionTailSizes[i] = (2.5 + Math.random() * 1.5) * (1 - t * 0.85);
 
 // Blue plasma gradient
 const intensity = (1 - t * 0.6) * (0.7 + Math.random() * 0.3);
 ionTailColors[i * 3] = 0.5 * intensity; // R
 ionTailColors[i * 3 + 1] = 0.8 * intensity; // G
 ionTailColors[i * 3 + 2] = 1.0 * intensity; // B
 }
 
 ionTailGeometry.setAttribute('position', new THREE.BufferAttribute(ionTailPositions, 3));
 ionTailGeometry.setAttribute('color', new THREE.BufferAttribute(ionTailColors, 3));
 ionTailGeometry.setAttribute('size', new THREE.BufferAttribute(ionTailSizes, 1));
 
 const ionTailMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.65,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 
 const ionTail = new THREE.Points(ionTailGeometry, ionTailMaterial);
 cometGroup.add(ionTail);
 
 cometGroup.userData = {
 name: cometData.name,
 type: 'Comet',
 radius: cometData.size,
 actualSize: cometData.size, // Store actual size for zoom calculations
 distance: cometData.distance,
 angle: Math.random() * Math.PI * 2,
 speed: cometData.speed,
 eccentricity: cometData.eccentricity,
 description: cometData.description,
 realSize: '1-60 km nucleus',
 funFact: 'Comets have two tails: a curved dust tail (yellowish) and a straight ion tail (blue) - both always point away from the Sun!',
 dustTail: dustTail,
 ionTail: ionTail,
 isComet: true // Flag for special zoom handling
 };
 
 scene.add(cometGroup);
 this.objects.push(cometGroup);
 this.comets.push(cometGroup);
 
 if (DEBUG.enabled) console.log(` ${cometData.name} created`);
 });
 }

 createHyperrealisticISS(satData) {
 if (DEBUG.enabled) console.log(' Creating ISS with all modules');
 
 // Complete ISS model with ALL modules as of October 2025
 // Real ISS: 109m long × 73m wide × 20m tall, 419,725 kg
 // 16 pressurized modules + truss + solar arrays + radiators
 const iss = new THREE.Group();
 const scale = 0.001; // Increased from 0.0003 for better visibility when zoomed in
 
 // Materials
 const moduleMaterial = new THREE.MeshStandardMaterial({
 color: 0xE8E8E8, // White/silver modules
 roughness: 0.5,
 metalness: 0.7
 });
 
 const russianMaterial = new THREE.MeshStandardMaterial({
 color: 0xD4AF37, // Gold/bronze (Russian modules)
 roughness: 0.4,
 metalness: 0.8
 });
 
 const solarPanelMaterial = new THREE.MeshStandardMaterial({
 color: 0x1a3d5c, // Dark blue solar panels
 roughness: 0.2,
 metalness: 0.9,
 emissive: 0x0a1a2e,
 emissiveIntensity: 0.1
 });
 
 const trussMaterial = new THREE.MeshStandardMaterial({
 color: 0x8B8B8B, // Gray truss
 roughness: 0.6,
 metalness: 0.8
 });
 
 // Helper function to create a module
 const createModule = (length, diameter, material, name) => {
 const geometry = new THREE.CylinderGeometry(scale * diameter, scale * diameter, scale * length, 16);
 const module = new THREE.Mesh(geometry, material);
 module.name = name;
 return module;
 };
 
 // ========== INTEGRATED TRUSS STRUCTURE (ITS) ==========
 // Main backbone - 109m long
 const mainTrussGeometry = new THREE.BoxGeometry(scale * 109, scale * 0.5, scale * 0.5);
 const mainTruss = new THREE.Mesh(mainTrussGeometry, trussMaterial);
 mainTruss.position.set(0, 0, 0);
 mainTruss.name = 'Main Truss';
 iss.add(mainTruss);
 
 // ========== RUSSIAN SEGMENT (launched 1998-2021) ==========
 // 1. Zarya (FGB) - First module, launched Nov 20, 1998
 const zarya = createModule(12.6, 4.1, russianMaterial, 'Zarya (FGB)');
 zarya.rotation.z = Math.PI / 2;
 zarya.position.set(-scale * 20, 0, 0);
 iss.add(zarya);
 
 // 2. Zvezda - Service module, launched Jul 12, 2000
 const zvezda = createModule(13.1, 4.15, russianMaterial, 'Zvezda');
 zvezda.rotation.z = Math.PI / 2;
 zvezda.position.set(-scale * 30, 0, 0);
 iss.add(zvezda);
 
 // 3. Pirs - Docking compartment, launched Sep 14, 2001 (deorbited Jul 2021)
 // Now replaced by Nauka
 
 // 4. Poisk (MRM-2) - Docking module, launched Nov 10, 2009
 const poisk = createModule(4.0, 2.55, russianMaterial, 'Poisk (MRM-2)');
 poisk.position.set(-scale * 30, scale * 5, 0);
 iss.add(poisk);
 
 // 5. Rassvet (MRM-1) - Mini research module, launched May 14, 2010
 const rassvet = createModule(6.0, 2.35, russianMaterial, 'Rassvet (MRM-1)');
 rassvet.position.set(-scale * 20, -scale * 4, 0);
 iss.add(rassvet);
 
 // 6. Nauka - Multipurpose laboratory, launched Jul 21, 2021
 const nauka = createModule(13.0, 4.25, russianMaterial, 'Nauka');
 nauka.rotation.z = Math.PI / 2;
 nauka.position.set(-scale * 38, 0, scale * 2);
 iss.add(nauka);
 
 // 7. Prichal - Docking module, launched Nov 24, 2021
 const prichal = createModule(3.0, 2.0, russianMaterial, 'Prichal');
 prichal.position.set(-scale * 38, -scale * 4, scale * 2);
 iss.add(prichal);
 
 // ========== US SEGMENT ==========
 // 8. Unity (Node 1) - First US module, launched Dec 4, 1998
 const unity = createModule(5.5, 4.57, moduleMaterial, 'Unity (Node 1)');
 unity.rotation.z = Math.PI / 2;
 unity.position.set(-scale * 10, 0, 0);
 iss.add(unity);
 
 // 9. Destiny - US Laboratory, launched Feb 7, 2001
 const destiny = createModule(8.5, 4.27, moduleMaterial, 'Destiny Lab');
 destiny.rotation.z = Math.PI / 2;
 destiny.position.set(-scale * 2, 0, 0);
 iss.add(destiny);
 
 // 10. Quest - Airlock, launched Jul 12, 2001
 const quest = createModule(5.5, 4.0, moduleMaterial, 'Quest Airlock');
 quest.position.set(-scale * 10, 0, -scale * 5);
 iss.add(quest);
 
 // 11. Harmony (Node 2) - Connecting module, launched Oct 23, 2007
 const harmony = createModule(7.2, 4.4, moduleMaterial, 'Harmony (Node 2)');
 harmony.rotation.z = Math.PI / 2;
 harmony.position.set(scale * 8, 0, 0);
 iss.add(harmony);
 
 // 12. Tranquility (Node 3) - Life support, launched Feb 8, 2010
 const tranquility = createModule(6.7, 4.48, moduleMaterial, 'Tranquility (Node 3)');
 tranquility.position.set(scale * 8, 0, -scale * 6);
 iss.add(tranquility);
 
 // 13. Cupola - Observation module, launched Feb 8, 2010
 const cupolaGeometry = new THREE.ConeGeometry(scale * 2.0, scale * 1.5, 8);
 const cupola = new THREE.Mesh(cupolaGeometry, moduleMaterial);
 cupola.position.set(scale * 8, -scale * 5, -scale * 6);
 cupola.name = 'Cupola';
 iss.add(cupola);
 
 // 14. Leonardo (PMM) - Permanent Multipurpose Module, launched Feb 24, 2011
 const leonardo = createModule(6.4, 4.57, moduleMaterial, 'Leonardo (PMM)');
 leonardo.position.set(scale * 8, scale * 4, 0);
 iss.add(leonardo);
 
 // ========== INTERNATIONAL PARTNER MODULES ==========
 // 15. Columbus - European laboratory, launched Feb 7, 2008
 const columbus = createModule(6.9, 4.48, moduleMaterial, 'Columbus (ESA)');
 columbus.rotation.x = Math.PI / 2;
 columbus.position.set(scale * 8, 0, scale * 6);
 iss.add(columbus);
 
 // 16. Kibo (JEM) - Japanese Experiment Module, launched Mar 11 & May 31, 2008
 const kiboMain = createModule(11.2, 4.4, moduleMaterial, 'Kibo PM');
 kiboMain.rotation.x = Math.PI / 2;
 kiboMain.position.set(scale * 12, 0, -scale * 10);
 iss.add(kiboMain);
 
 // Kibo Logistics Module
 const kiboLogistics = createModule(4.2, 4.4, moduleMaterial, 'Kibo ELM');
 kiboLogistics.position.set(scale * 12, scale * 4, -scale * 10);
 iss.add(kiboLogistics);
 
 // Kibo External Facility
 const kiboExternal = new THREE.BoxGeometry(scale * 5, scale * 0.3, scale * 4);
 const kiboExt = new THREE.Mesh(kiboExternal, moduleMaterial);
 kiboExt.position.set(scale * 12, -scale * 3.5, -scale * 10);
 kiboExt.name = 'Kibo EF';
 iss.add(kiboExt);
 
 // ========== COMMERCIAL MODULES ==========
 // 17. BEAM (Bigelow Expandable Activity Module) - launched Apr 8, 2016
 const beam = createModule(4.0, 3.2, moduleMaterial, 'BEAM');
 beam.position.set(scale * 8, -scale * 4, -scale * 6);
 iss.add(beam);
 
 // ========== SOLAR ARRAYS ==========
 // 8 solar arrays (4 pairs) - 73m total wingspan
 const solarArrayGeometry = new THREE.BoxGeometry(scale * 11.58, scale * 0.05, scale * 34.2);
 
 // Port arrays (P4/P6)
 const p6_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 p6_1.position.set(-scale * 40, scale * 8, 0);
 p6_1.name = 'P6 Array 1';
 iss.add(p6_1);
 
 const p6_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 p6_2.position.set(-scale * 40, -scale * 8, 0);
 p6_2.name = 'P6 Array 2';
 iss.add(p6_2);
 
 const p4_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 p4_1.position.set(-scale * 25, scale * 8, 0);
 p4_1.name = 'P4 Array 1';
 iss.add(p4_1);
 
 const p4_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 p4_2.position.set(-scale * 25, -scale * 8, 0);
 p4_2.name = 'P4 Array 2';
 iss.add(p4_2);
 
 // Starboard arrays (S4/S6)
 const s4_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 s4_1.position.set(scale * 25, scale * 8, 0);
 s4_1.name = 'S4 Array 1';
 iss.add(s4_1);
 
 const s4_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 s4_2.position.set(scale * 25, -scale * 8, 0);
 s4_2.name = 'S4 Array 2';
 iss.add(s4_2);
 
 const s6_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 s6_1.position.set(scale * 40, scale * 8, 0);
 s6_1.name = 'S6 Array 1';
 iss.add(s6_1);
 
 const s6_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
 s6_2.position.set(scale * 40, -scale * 8, 0);
 s6_2.name = 'S6 Array 2';
 iss.add(s6_2);
 
 // ========== RADIATORS ==========
 // Heat dissipation panels
 const radiatorGeometry = new THREE.BoxGeometry(scale * 15, scale * 0.05, scale * 4.5);
 const radiatorMaterial = new THREE.MeshStandardMaterial({
 color: 0xC0C0C0,
 roughness: 0.3,
 metalness: 0.9
 });
 
 for (let i = 0; i < 6; i++) {
 const radiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
 radiator.position.set(-scale * 35 + i * scale * 12, 0, scale * 8);
 radiator.name = `Radiator ${i + 1}`;
 iss.add(radiator);
 }
 
 // ========== ROBOTIC ARMS ==========
 // Canadarm2 - 17.6m long
 const canadarmGeometry = new THREE.CylinderGeometry(scale * 0.35, scale * 0.35, scale * 17.6, 12);
 const canadarm = new THREE.Mesh(canadarmGeometry, trussMaterial);
 canadarm.rotation.z = Math.PI / 4;
 canadarm.position.set(scale * 5, scale * 10, 0);
 canadarm.name = 'Canadarm2';
 iss.add(canadarm);
 
 // Dextre (Special Purpose Dexterous Manipulator)
 const dextreGeometry = new THREE.BoxGeometry(scale * 3.5, scale * 1.5, scale * 1.5);
 const dextre = new THREE.Mesh(dextreGeometry, trussMaterial);
 dextre.position.set(scale * 5, scale * 18, 0);
 dextre.name = 'Dextre';
 iss.add(dextre);
 
 // Japanese robotic arm (on Kibo)
 const jemRMSGeometry = new THREE.CylinderGeometry(scale * 0.25, scale * 0.25, scale * 10, 10);
 const jemRMS = new THREE.Mesh(jemRMSGeometry, trussMaterial);
 jemRMS.rotation.x = Math.PI / 3;
 jemRMS.position.set(scale * 12, scale * 5, -scale * 10);
 jemRMS.name = 'JEM RMS';
 iss.add(jemRMS);
 
 // ========== VISIBILITY AIDS ==========
 // Larger glow for distance visibility
 const glowGeometry = new THREE.SphereGeometry(scale * 10, 16, 16);
 const glowMaterial = new THREE.MeshBasicMaterial({
 color: 0xFFFFFF,
 transparent: true,
 opacity: 0.5
 });
 const glow = new THREE.Mesh(glowGeometry, glowMaterial);
 glow.name = 'Visibility Glow';
 iss.add(glow);
 
 // Larger center marker
 const markerGeometry = new THREE.SphereGeometry(scale * 3, 8, 8);
 const markerMaterial = new THREE.MeshBasicMaterial({
 color: 0xFFD700,
 emissive: 0xFFD700,
 emissiveIntensity: 0.8
 });
 const marker = new THREE.Mesh(markerGeometry, markerMaterial);
 marker.name = 'Center Marker';
 iss.add(marker);
 
 // Enable shadows for all meshes
 iss.traverse((child) => {
 if (child instanceof THREE.Mesh) {
 child.castShadow = true;
 child.receiveShadow = true;
 }
 });
 
 // Count all children for verification
 let moduleCount = 0;
 iss.traverse((child) => {
 if (child instanceof THREE.Mesh) {
 moduleCount++;
 }
 });
 
 console.log(` ISS created with ${moduleCount} mesh components (scale: ${scale})`);
 console.log(' - 17 pressurized modules, 8 solar arrays, 6 radiators, 3 robotic arms');
 
 return iss;
 }

 createSatellites(scene) {
 // Create Earth satellites (ISS and important satellites)
 this.satellites = [];
 
 const satellitesData = [
 { 
 name: 'ISS (International Space Station)', 
 distance: 1.05, // Orbital altitude: 408-410 km above Earth's surface (scaled)
 speed: 15.5, // REAL SPEED: 7.66 km/s (27,576 km/h), 15.5 orbits/day, 92.68 min/orbit
 // Animation: speed * timeSpeed * 0.01 = angle increment
 // At timeSpeed=1: 15.5 * 1 * 0.01 = 0.155 rad/frame = realistic orbital motion
 size: 0.03,
 color: 0xCCCCCC,
 description: ' ISS orbits at 408 km altitude, traveling at 7.66 km/s (27,576 km/h). One orbit takes 92.68 minutes. Continuously inhabited since Nov 2, 2000 (25 years!). Collaboration of NASA, Roscosmos, ESA, JAXA, CSA. Completed 180,000+ orbits as of Oct 2025.',
 funFact: 'ISS is 109m long, 73m wide, masses 419,725 kg. Pressurized volume equals a Boeing 747! Visible to naked eye as brightest "star" after Venus.',
 realSize: '109m × 73m × 20m, 419,725 kg',
 orbitTime: '92.68 minutes',
 modules: '17 pressurized modules: Zarya, Unity, Zvezda, Destiny, Quest, Harmony, Columbus, Kibo (3 parts), Poisk, Tranquility, Cupola, Rassvet, Leonardo, BEAM, Nauka, Prichal. Plus 8 solar arrays, 6 radiators, 3 robotic arms (Canadarm2, Dextre, JEM RMS).'
 },
 { 
 name: 'Hubble Space Telescope', 
 distance: 1.08, // Orbital altitude: ~535 km (varies due to atmospheric drag)
 speed: 15.1, // Orbital velocity: 7.59 km/s (27,300 km/h)
 size: 0.02,
 color: 0x4169E1,
 description: ' Launched April 24, 1990 on Space Shuttle Discovery. Orbits at ~535 km altitude. Made 1.6+ million observations as of Oct 2025. 2.4m primary mirror observes UV, visible, and near-IR. Five servicing missions (1993-2009) upgraded instruments.',
 funFact: 'Can resolve objects 0.05 arcseconds apart - like seeing two fireflies 10,000 km away! Deepest image (eXtreme Deep Field) shows 5,500 galaxies, some 13.2 billion light-years away.',
 realSize: '13.2m long 4.2m diameter, 11,110 kg',
 orbitTime: '95 minutes'
 },
 { 
 name: 'GPS Satellites', 
 distance: 3.5, // Medium Earth Orbit (MEO): 20,180 km altitude (26,560 km from Earth center)
 speed: 2, // Orbital velocity: 3.87 km/s, period: 11h 58min (2 orbits/day)
 size: 0.025,
 color: 0x00FF00,
 description: ' GPS (NAVSTAR) constellation: 31 operational satellites (as of Oct 2025) in 6 orbital planes, 55° inclination. Each satellite orbits at 20,180 km altitude. Transmits L-band signals (1.2-1.5 GHz). Rubidium/cesium atomic clocks accurate to 10⁻⁴ seconds.',
 funFact: 'Need 4 satellites for 3D position fix (trilateration + clock correction). System provides 5-10m accuracy. Military signal (P/Y code) accurate to centimeters!',
 realSize: 'GPS III: 2,161 kg, 7.8m solar span',
 orbitTime: '11h 58min'
 },
 { 
 name: 'James Webb Space Telescope', 
 distance: 250, // At Sun-Earth L2 Lagrange point, 1.5 million km from Earth (scaled)
 speed: 0.01, // Halo orbit around L2, period synced with Earth (1 year)
 size: 0.04,
 color: 0xFFD700,
 description: ' Launched Dec 25, 2021. Reached L2 point Jan 24, 2022. First images released July 12, 2022. Observes infrared (0.6-28.5 μm). 6.5m segmented beryllium mirror (18 hexagons) with 25 m² collecting area - 6x Hubble! Sunshield: 21.2m × 14.2m, 5 layers.',
 funFact: 'Operating at -233C (-388F)! Can detect heat signature of a bumblebee at Moon distance. Discovered earliest galaxies at z=14 (280 million years after Big Bang).',
 realSize: '6.5m mirror, 21.2m 14.2m sunshield, 6,161 kg',
 orbitTime: 'L2 halo orbit: ~6 months period'
 },
 { 
 name: 'Starlink Constellation', 
 distance: 1.09, // Multiple shells: 340 km, 550 km, 570 km, 1,150 km, 1,275 km
 speed: 15, // Orbital velocity: ~7.6 km/s at 550 km altitude
 size: 0.015,
 color: 0xFF6B6B,
 description: ' SpaceX Starlink: 5,400+ operational satellites as of Oct 2025 (largest constellation ever). Provides broadband internet globally. Ku/Ka-band phased array antennas. Ion thrusters for station-keeping and deorbit. Gen2 satellites: 1,250 kg, laser inter-satellite links.',
 funFact: 'Launches 20-23 satellites per Falcon 9 flight. Over 300 launches! FCC approved up to 42,000 satellites. Each satellite deorbits after 5-7 years.',
 realSize: 'V1.5: 260 kg, 2.8m 1.4m 0.12m flat',
 orbitTime: '95 minutes (550 km shell)'
 }
 ];

 if (!this.planets.earth) {
 console.warn('Earth not found, cannot create satellites');
 return;
 }

 satellitesData.forEach((satData, index) => {
 let satellite;
 
 // Create hyperrealistic ISS with all modules
 if (satData.name.includes('ISS')) {
 satellite = this.createHyperrealisticISS(satData);
 } else {
 // Simple satellite body for others
 const geometry = new THREE.BoxGeometry(satData.size, satData.size * 0.5, satData.size * 0.3);
 const material = new THREE.MeshStandardMaterial({
 color: satData.color,
 roughness: 0.4,
 metalness: 0.8,
 emissive: satData.color,
 emissiveIntensity: 0.3
 });
 
 satellite = new THREE.Mesh(geometry, material);
 
 // Add solar panels for most satellites
 if (satData.name !== 'Starlink Constellation') {
 const panelGeometry = new THREE.BoxGeometry(satData.size * 2, satData.size * 0.02, satData.size * 0.8);
 const panelMaterial = new THREE.MeshStandardMaterial({
 color: 0x1a3d5c,
 roughness: 0.2,
 metalness: 0.9
 });
 
 const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
 panel1.position.x = satData.size * 1.2;
 satellite.add(panel1);
 
 const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
 panel2.position.x = -satData.size * 1.2;
 satellite.add(panel2);
 }
 
 // Add antenna for communication satellites
 if (satData.name.includes('GPS') || satData.name.includes('Starlink')) {
 const antennaGeometry = new THREE.CylinderGeometry(0.005, 0.005, satData.size * 0.8);
 const antennaMaterial = new THREE.MeshStandardMaterial({
 color: 0x888888,
 roughness: 0.3,
 metalness: 0.9
 });
 const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
 antenna.position.y = satData.size * 0.6;
 satellite.add(antenna);
 }
 }
 
 satellite.userData = {
 name: satData.name,
 type: 'Satellite',
 radius: satData.size,
 distance: satData.distance,
 angle: (Math.PI * 2 / satellitesData.length) * index, // Spread them out
 speed: satData.speed,
 description: satData.description,
 funFact: satData.funFact,
 realSize: satData.realSize,
 orbitTime: satData.orbitTime,
 planet: this.planets.earth,
 inclination: (index * 30) * Math.PI / 180 // Different orbital inclinations
 };
 
 scene.add(satellite);
 this.objects.push(satellite);
 this.satellites.push(satellite);
 });
 }

 createSpacecraft(scene) {
 // Deep space probes and interplanetary missions
 this.spacecraft = [];
 
 const spacecraftData = [
 {
 name: 'Voyager 1',
 distance: 300, // ~24.3 billion km from Sun as of Oct 2025 (162 AU) - scaled for visualization
 angle: Math.PI * 0.7, // Direction: 35 north of ecliptic plane
 speed: 0.0001, // Traveling at 17 km/s relative to Sun
 size: 0.08,
 color: 0xC0C0C0,
 type: 'probe',
 description: ' Voyager 1 is the farthest human-made object from Earth! Launched Sept 5, 1977, it entered interstellar space on Aug 25, 2012. Currently 24.3 billion km (162 AU) from Sun. It carries the Golden Record with sounds and images of Earth.',
 funFact: 'Voyager 1 travels at 17 km/s (61,200 km/h). Its radio signals take 22.5 hours to reach Earth!',
 realSize: '825.5 kg, 3.7m antenna dish',
 launched: 'September 5, 1977',
 status: 'Active in Interstellar Space (since Aug 2012)'
 },
 {
 name: 'Voyager 2',
 distance: 280, // ~20.3 billion km from Sun as of Oct 2025 (135 AU) - scaled
 angle: Math.PI * 1.2, // Direction: Different trajectory than V1
 speed: 0.0001, // Traveling at 15.4 km/s relative to Sun
 size: 0.08,
 color: 0xB0B0B0,
 type: 'probe',
 description: ' Voyager 2 is the only spacecraft to visit all four giant planets! Jupiter (Jul 1979), Saturn (Aug 1981), Uranus (Jan 1986), Neptune (Aug 1989). Entered interstellar space Nov 5, 2018. Now 20.3 billion km (135 AU) from Sun.',
 funFact: 'Voyager 2 discovered 16 moons across the giant planets, Neptune\'s Great Dark Spot, and Triton\'s geysers!',
 realSize: '825.5 kg, 3.7m antenna dish',
 launched: 'August 20, 1977',
 status: 'Active in Interstellar Space (since Nov 2018)'
 },
 {
 name: 'New Horizons',
 distance: 85, // ~8.9 billion km from Sun as of Oct 2025 (59 AU) - beyond Pluto orbit
 angle: Math.PI * 0.3,
 speed: 0.0002, // Traveling at 14.31 km/s relative to Sun
 size: 0.06,
 color: 0x4169E1,
 type: 'probe',
 description: ' New Horizons gave us the first close-up images of Pluto on July 14, 2015! It revealed water ice mountains up to 3,500m tall, vast nitrogen glaciers, and the famous heart-shaped Tombaugh Regio. Now 59 AU from Sun, exploring Kuiper Belt.',
 funFact: 'New Horizons traveled 9.5 years and 5 billion km to reach Pluto at 58,536 km/h. It carries 1 oz of Clyde Tombaugh\'s ashes!',
 realSize: '478 kg, 0.7 2.1 2.7m (piano-sized)',
 launched: 'January 19, 2006',
 status: 'Active in Kuiper Belt'
 },
 {
 name: 'Parker Solar Probe',
 distance: 12, // Highly elliptical orbit: 6.9 million km (perihelion) to 108 million km (aphelion)
 angle: 0,
 speed: 0.5, // Peak velocity: 192 km/s (690,000 km/h) at perihelion - fastest human-made object
 size: 0.05,
 color: 0xFF6B35,
 type: 'probe',
 description: ' Parker Solar Probe is "touching" the Sun! Launched Aug 12, 2018, it flies through the Sun\'s corona. At closest approach (6.9 million km from surface), it reaches 192 km/s (690,000 km/h)! Heat shield withstands 1,377°C while instruments stay at 30°C.',
 funFact: 'Parker completed 21 orbits as of Oct 2025. Final perihelion in Dec 2025 will reach 6.9 million km - into the corona!',
 realSize: '685 kg, 3m tall, 2.3m heat shield',
 launched: 'August 12, 2018',
 status: 'Active, 7-year mission (ends 2025)'
 },
 {
 name: 'Juno (Jupiter)',
 orbitPlanet: 'jupiter',
 distance: 11.5, // Highly elliptical polar orbit: 4,200 km to 8.1 million km from Jupiter's cloud tops
 angle: 0,
 speed: 3.0, // Orbital period: 53.5 days
 size: 0.05,
 color: 0xFFD700,
 type: 'orbiter',
 description: ' Juno entered Jupiter orbit July 4, 2016. Studies composition, gravity field, magnetic field, and polar auroras. Discovered Jupiter\'s core is larger and "fuzzy", massive polar cyclones, and atmospheric ammonia distribution. Extended mission until Sept 2025.',
 funFact: 'First solar-powered spacecraft at Jupiter! Three 9m solar panels generate 500W. Carries three LEGO figurines: Galileo, Jupiter, and Juno!',
 realSize: '3,625 kg, 20m solar panel span',
 launched: 'August 5, 2011',
 status: 'Active in Jupiter Orbit (63+ orbits)'
 },
 {
 name: 'Cassini-Huygens Legacy (Saturn)',
 orbitPlanet: 'saturn',
 distance: 9.6, // Orbited Saturn 294 times before Grand Finale
 angle: 0,
 speed: 2.5,
 size: 0.06,
 color: 0xDAA520,
 type: 'memorial',
 description: ' Cassini orbited Saturn June 30, 2004 - Sept 15, 2017 (13 years). Discovered liquid methane/ethane lakes on Titan, water geysers on Enceladus, new rings, 7 new moons. Huygens probe landed on Titan Jan 14, 2005. Ended with atmospheric entry "Grand Finale".',
 funFact: 'Discovered Enceladus\' subsurface ocean! Water geysers shoot 250kg/s into space. Cassini flew through plumes, detected H2, organics - ingredients for life!',
 realSize: '5,600 kg, 6.8m tall, 4m wide',
 launched: 'October 15, 1997',
 status: 'Mission Ended Sept 15, 2017 (Memorial)'
 },
 {
 name: 'Pioneer 10',
 distance: 320, // ~19.9 billion km from Sun (133 AU) - last contact Jan 2003
 angle: Math.PI * 0.5, // Direction: toward Aldebaran in Taurus
 speed: 0.00009, // Traveling at 12.2 km/s relative to Sun
 size: 0.07,
 color: 0xA0A0A0,
 type: 'memorial',
 description: ' Pioneer 10 was the first spacecraft to travel through the asteroid belt and first to visit Jupiter (Dec 3, 1973)! Launched March 2, 1972, it carried the famous Pioneer plaque showing humans and Earth\'s location. Last contact: Jan 23, 2003 at 12.2 billion km.',
 funFact: 'Pioneer 10 carries a gold plaque designed by Carl Sagan showing a man, woman, and Earth\'s location - a message to any aliens who might find it!',
 realSize: '258 kg, 2.74m antenna dish',
 launched: 'March 2, 1972',
 status: 'Silent since Jan 2003 (Memorial)'
 },
 {
 name: 'Pioneer 11',
 distance: 290, // ~15.9 billion km from Sun (106 AU) - last contact Nov 1995
 angle: Math.PI * 1.4, // Direction: toward constellation Aquila
 speed: 0.00008, // Traveling at 11.4 km/s relative to Sun
 size: 0.07,
 color: 0x909090,
 type: 'memorial',
 description: ' Pioneer 11 was the first spacecraft to visit Saturn (Sept 1, 1979)! Also flew by Jupiter (Dec 2, 1974). Launched April 5, 1973, it discovered Saturn\'s F ring and a new moon. Also carries the Pioneer plaque. Last contact: Nov 24, 1995 at 6.5 billion km.',
 funFact: 'Pioneer 11 used Jupiter\'s gravity to slingshot to Saturn - the first gravity-assist maneuver to another planet!',
 realSize: '259 kg, 2.74m antenna dish',
 launched: 'April 5, 1973',
 status: 'Silent since Nov 1995 (Memorial)'
 }
 ];

 spacecraftData.forEach(craft => {
 // Create HYPER-REALISTIC spacecraft with detailed geometry
 const spacecraftGroup = new THREE.Group();
 
 // Main body - octagonal/box shape for probes
 if (craft.type === 'probe' || craft.type === 'orbiter') {
 // Central bus/body - box shape
 const bodyGeometry = new THREE.BoxGeometry(craft.size * 0.8, craft.size * 0.6, craft.size * 0.8);
 const bodyMaterial = new THREE.MeshStandardMaterial({
 color: craft.color,
 roughness: 0.4,
 metalness: 0.7,
 emissive: craft.color,
 emissiveIntensity: 0.1
 });
 const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
 spacecraftGroup.add(body);
 
 // High-gain antenna dish - realistic parabolic shape
 const dishGeometry = new THREE.CylinderGeometry(craft.size * 1.5, craft.size * 1.8, craft.size * 0.15, 24);
 const dishMaterial = new THREE.MeshStandardMaterial({
 color: 0xF0F0F0,
 roughness: 0.2,
 metalness: 0.95,
 envMapIntensity: 1.5
 });
 const dish = new THREE.Mesh(dishGeometry, dishMaterial);
 dish.rotation.x = Math.PI / 2;
 dish.position.set(0, craft.size * 0.4, 0);
 spacecraftGroup.add(dish);
 
 // Dish support struts - tripod
 for (let i = 0; i < 3; i++) {
 const angle = (i / 3) * Math.PI * 2;
 const strutGeometry = new THREE.CylinderGeometry(craft.size * 0.02, craft.size * 0.02, craft.size * 0.5);
 const strutMaterial = new THREE.MeshStandardMaterial({
 color: 0x404040,
 roughness: 0.7,
 metalness: 0.9
 });
 const strut = new THREE.Mesh(strutGeometry, strutMaterial);
 strut.position.set(
 Math.cos(angle) * craft.size * 0.5,
 craft.size * 0.15,
 Math.sin(angle) * craft.size * 0.5
 );
 strut.rotation.x = Math.PI / 2;
 strut.rotation.z = angle;
 spacecraftGroup.add(strut);
 }
 
 // RTG (Radioisotope Thermoelectric Generator) boom - characteristic long boom
 const rtgBoomGeometry = new THREE.CylinderGeometry(craft.size * 0.04, craft.size * 0.04, craft.size * 2.5);
 const rtgBoomMaterial = new THREE.MeshStandardMaterial({
 color: 0x606060,
 roughness: 0.6,
 metalness: 0.85
 });
 const rtgBoom = new THREE.Mesh(rtgBoomGeometry, rtgBoomMaterial);
 rtgBoom.position.set(craft.size * 1.2, 0, 0);
 rtgBoom.rotation.z = Math.PI / 2;
 spacecraftGroup.add(rtgBoom);
 
 // RTG unit at end of boom - cylindrical
 const rtgGeometry = new THREE.CylinderGeometry(craft.size * 0.15, craft.size * 0.15, craft.size * 0.4, 8);
 const rtgMaterial = new THREE.MeshStandardMaterial({
 color: 0x2A2A2A,
 roughness: 0.5,
 metalness: 0.8,
 emissive: 0xFF4400,
 emissiveIntensity: 0.3 // RTGs glow slightly from heat
 });
 const rtg = new THREE.Mesh(rtgGeometry, rtgMaterial);
 rtg.position.set(craft.size * 2.4, 0, 0);
 rtg.rotation.z = Math.PI / 2;
 spacecraftGroup.add(rtg);
 
 // Science instruments boom on opposite side
 const scienceBoomGeometry = new THREE.CylinderGeometry(craft.size * 0.03, craft.size * 0.03, craft.size * 1.8);
 const scienceBoomMaterial = new THREE.MeshStandardMaterial({
 color: 0x505050,
 roughness: 0.7,
 metalness: 0.8
 });
 const scienceBoom = new THREE.Mesh(scienceBoomGeometry, scienceBoomMaterial);
 scienceBoom.position.set(-craft.size * 0.9, 0, 0);
 scienceBoom.rotation.z = Math.PI / 2;
 spacecraftGroup.add(scienceBoom);
 
 // Instruments cluster - small boxes
 for (let i = 0; i < 2; i++) {
 const instGeometry = new THREE.BoxGeometry(craft.size * 0.12, craft.size * 0.12, craft.size * 0.08);
 const instMaterial = new THREE.MeshStandardMaterial({
 color: 0x808080,
 roughness: 0.5,
 metalness: 0.7
 });
 const inst = new THREE.Mesh(instGeometry, instMaterial);
 inst.position.set(-craft.size * 1.8, i * craft.size * 0.15 - craft.size * 0.07, 0);
 spacecraftGroup.add(inst);
 }
 
 } else {
 // Memorial/generic - still make it detailed
 const bodyGeometry = new THREE.OctahedronGeometry(craft.size * 0.7);
 const bodyMaterial = new THREE.MeshStandardMaterial({
 color: craft.color,
 roughness: 0.4,
 metalness: 0.8,
 emissive: craft.color,
 emissiveIntensity: 0.2
 });
 const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
 spacecraftGroup.add(body);
 
 // Add some detail
 const panelGeometry = new THREE.BoxGeometry(craft.size * 0.3, craft.size * 0.05, craft.size * 1.0);
 const panelMaterial = new THREE.MeshStandardMaterial({
 color: 0x1A1A2E,
 roughness: 0.3,
 metalness: 0.9
 });
 const panel = new THREE.Mesh(panelGeometry, panelMaterial);
 panel.position.set(craft.size * 0.5, 0, 0);
 spacecraftGroup.add(panel);
 }
 
 // Add subtle visibility glow - proportional to actual size
 const glowSize = craft.size * 2.5; // Subtle glow for visibility
 const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
 const glowMaterial = new THREE.MeshBasicMaterial({
 color: craft.color,
 transparent: true,
 opacity: 0.3,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 const glow = new THREE.Mesh(glowGeometry, glowMaterial);
 spacecraftGroup.add(glow);
 
 // Add small bright navigation marker for distant spacecraft
 if (craft.distance > 200) {
 const markerGeometry = new THREE.SphereGeometry(craft.size * 0.5, 8, 8);
 const markerMaterial = new THREE.MeshBasicMaterial({
 color: 0xFFFFFF,
 transparent: true,
 opacity: 0.95,
 blending: THREE.AdditiveBlending
 });
 const marker = new THREE.Mesh(markerGeometry, markerMaterial);
 spacecraftGroup.add(marker);
 }
 
 spacecraftGroup.userData = {
 name: craft.name,
 type: craft.type,
 description: craft.description,
 funFact: craft.funFact,
 realSize: craft.realSize,
 launched: craft.launched,
 status: craft.status,
 distance: craft.distance,
 angle: craft.angle,
 speed: craft.speed,
 orbitPlanet: craft.orbitPlanet,
 isMoon: craft.isMoon || false,
 isSpacecraft: true,
 actualSize: craft.size,
 radius: craft.size
 };
 
 if (DEBUG.enabled) console.log(` ${craft.name} created`);
 
 // Position spacecraft
 if (craft.orbitPlanet) {
 // Orbiter around planet
 const planet = this.planets[craft.orbitPlanet];
 if (planet) {
 spacecraftGroup.position.x = craft.distance * Math.cos(craft.angle);
 spacecraftGroup.position.z = craft.distance * Math.sin(craft.angle);
 planet.add(spacecraftGroup);
 }
 } else {
 // Deep space probe - position in solar system
 spacecraftGroup.position.x = craft.distance * Math.cos(craft.angle);
 spacecraftGroup.position.z = craft.distance * Math.sin(craft.angle);
 scene.add(spacecraftGroup);
 }
 
 this.objects.push(spacecraftGroup);
 this.spacecraft.push(spacecraftGroup);
 });
 
 console.log(` Created ${this.spacecraft.length} spacecraft and probes!`);
 }

 update(deltaTime, timeSpeed, camera, controls) {
 // Safety check for deltaTime
 if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
 console.warn(' Invalid deltaTime:', deltaTime, '- skipping frame');
 return;
 }
 
 // Update camera tracking for focused objects (before other updates)
 this.updateCameraTracking(camera, controls);
 
 // Get pause mode from sceneManager
 const app = window.app || {};
 const sceneManager = app.sceneManager || {};
 const pauseMode = sceneManager.pauseMode || 'none';
 
 // Calculate effective time speeds based on pause mode
 let orbitalSpeed = timeSpeed;
 let rotationSpeed = timeSpeed;
 let moonSpeed = timeSpeed;
 
 if (pauseMode === 'all') {
 // Pause everything
 orbitalSpeed = 0;
 rotationSpeed = 0;
 moonSpeed = 0;
 } else if (pauseMode === 'orbital') {
 // Pause only solar orbits, keep rotations and moon orbits
 orbitalSpeed = 0;
 rotationSpeed = timeSpeed;
 moonSpeed = timeSpeed;
 }
 // else 'none' - everything moves normally
 
 // Update all planets
 Object.values(this.planets).forEach(planet => {
 if (planet && planet.userData) {
 // Calculate angle increment based on speed
 const angleIncrement = planet.userData.speed * orbitalSpeed * deltaTime;
 
 // Safety check for angle increment
 if (isNaN(angleIncrement) || !isFinite(angleIncrement)) {
 console.error(' Invalid angleIncrement for', planet.userData.name, ':', angleIncrement);
 return;
 }
 
 // Solar orbit (affected by orbital pause)
 planet.userData.angle += angleIncrement;
 
 // Safety check for angle
 if (isNaN(planet.userData.angle) || !isFinite(planet.userData.angle)) {
 console.error(' Invalid angle for', planet.userData.name, '- resetting to 0');
 planet.userData.angle = 0;
 }
 
 planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
 planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
 
 // REALISTIC PLANET ROTATION based on real astronomical data
 if (planet.userData.realRotationPeriod && rotationSpeed > 0) {
 // Calculate elapsed real time in hours
 const elapsedMs = Date.now() - this.realTimeStart;
 const elapsedHours = (elapsedMs / 1000 / 3600) * this.timeAcceleration;
 
 // Calculate rotation angle based on real rotation period
 const rotationsComplete = elapsedHours / planet.userData.realRotationPeriod;
 let rotationAngle = (rotationsComplete * Math.PI * 2) + planet.userData.rotationPhase;
 
 // Reverse rotation for retrograde planets (Venus, Uranus)
 if (planet.userData.retrograde) {
 rotationAngle = -rotationAngle;
 }
 
 // Apply rotation
 planet.rotation.y = rotationAngle;
 
 // Apply axial tilt (already set during creation, but ensure it stays)
 planet.rotation.z = (planet.userData.axialTilt || 0) * Math.PI / 180;
 }
 
 // Rotate clouds slightly faster than planet for Earth
 if (planet.userData.clouds && rotationSpeed > 0) {
 planet.userData.clouds.rotation.y = planet.rotation.y * 1.05; // 5% faster
 }

 // Update moons - orbit around their parent planet
 if (planet.userData.moons && planet.userData.moons.length > 0) {
 planet.userData.moons.forEach(moon => {
 if (moon.userData) {
 // Calculate moon angle increment
 const moonAngleIncrement = moon.userData.speed * moonSpeed * deltaTime;
 
 // Moons orbit their planet
 moon.userData.angle += moonAngleIncrement;
 
 // IMPORTANT: Since moon is a child of planet (planet.add(moon)),
 // these positions are RELATIVE to the planet's position, not world coordinates!
 // This keeps the moon orbiting around its parent planet correctly.
 moon.position.x = moon.userData.distance * Math.cos(moon.userData.angle);
 moon.position.z = moon.userData.distance * Math.sin(moon.userData.angle);
 moon.position.y = 0; // Keep moons in planet's equatorial plane
 
 // REALISTIC MOON ROTATION based on real astronomical data
 if (moon.userData.realRotationPeriod && rotationSpeed > 0) {
 // Calculate elapsed real time in hours
 const elapsedMs = Date.now() - this.realTimeStart;
 const elapsedHours = (elapsedMs / 1000 / 3600) * this.timeAcceleration;
 
 // Calculate rotation angle based on real rotation period
 const rotationsComplete = elapsedHours / moon.userData.realRotationPeriod;
 let rotationAngle = (rotationsComplete * Math.PI * 2) + moon.userData.rotationPhase;
 
 // Reverse rotation for retrograde moons
 if (moon.userData.retrograde) {
 rotationAngle = -rotationAngle;
 }
 
 // Apply rotation
 moon.rotation.y = rotationAngle;
 
 // Apply axial tilt
 moon.rotation.z = (moon.userData.axialTilt || 0) * Math.PI / 180;
 }
 
 // Debug: Log moon position occasionally (Moon and Io)
 if (DEBUG.enabled && Math.random() < 0.001) {
 if (moon.userData.name.includes('Moon') || moon.userData.name.includes('Io')) {
 const worldPos = new THREE.Vector3();
 moon.getWorldPosition(worldPos);
 console.log(` ${moon.userData.name} orbiting ${planet.userData.name}: angle=${moon.userData.angle.toFixed(2)}, local=(${moon.position.x.toFixed(1)}, ${moon.position.y.toFixed(1)}, ${moon.position.z.toFixed(1)}), world=(${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)}, ${worldPos.z.toFixed(1)}), planet at=(${planet.position.x.toFixed(1)}, ${planet.position.y.toFixed(1)}, ${planet.position.z.toFixed(1)})`);
 }
 }
 }
 });
 }
 }
 });
 
 // Keep camera focused on selected object if it's moving
 if (this.focusedObject && camera && controls) {
 const targetPosition = new THREE.Vector3();
 this.focusedObject.getWorldPosition(targetPosition);
 
 // Calculate the offset from target to camera
 const cameraOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
 
 // Update both target and camera position to maintain relative view
 controls.target.copy(targetPosition);
 camera.position.copy(targetPosition).add(cameraOffset);
 
 controls.update();
 }

 // Rotate asteroid and Kuiper belts slowly
 const effectiveTimeSpeed = timeSpeed;
 if (this.asteroidBelt) {
 const rotationIncrement = 0.0001 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.asteroidBelt.rotation.y += rotationIncrement;
 }
 }
 if (this.kuiperBelt) {
 const rotationIncrement = 0.00005 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.kuiperBelt.rotation.y += rotationIncrement;
 }
 }

 // Rotate sun and animate surface activity
 if (this.sun) {
 const rotationIncrement = 0.001 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.sun.rotation.y += rotationIncrement;
 }
 
 // Animate solar flares (optimized - update every 2 frames)
 if (this.sun.userData.flares && (this._sunFlareFrame || 0) % 2 === 0) {
 const time = Date.now() * 0.001;
 const sizes = this.sun.userData.flares.geometry.attributes.size.array;
 const len = sizes.length;
 
 // Pre-calculate random values (less Math.random() calls)
 for (let i = 0; i < len; i++) {
 sizes[i] = 1 + Math.sin(time + i * 0.5) * 1.5 + (i % 3) * 0.2;
 }
 this.sun.userData.flares.geometry.attributes.size.needsUpdate = true;
 }
 this._sunFlareFrame = (this._sunFlareFrame || 0) + 1;
 }

 // Twinkle stars slightly (optimized - only every 5 frames)
 if (this.starfield && this._starTwinkleFrame % 5 === 0 && Math.random() < 0.3) {
 const sizes = this.starfield.geometry.attributes.size.array;
 // Reduce updates to 30 stars instead of 50
 for (let i = 0; i < 30; i++) {
 const idx = Math.floor(Math.random() * sizes.length);
 sizes[idx] = 1 + Math.random() * 2;
 }
 this.starfield.geometry.attributes.size.needsUpdate = true;
 }
 this._starTwinkleFrame = (this._starTwinkleFrame || 0) + 1;
 
 // Update comets with elliptical orbits (optimized)
 if (this.comets) {
 this.comets.forEach(comet => {
 const userData = comet.userData;
 const angleIncrement = userData.speed * effectiveTimeSpeed;
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 }
 
 // Elliptical orbit calculation
 const e = userData.eccentricity;
 const a = userData.distance;
 const angle = userData.angle;
 
 // Pre-calculate trig values (avoid redundant calculations)
 const cosAngle = Math.cos(angle);
 const sinAngle = Math.sin(angle);
 
 // Simplified elliptical orbit
 const r = a * (1 - e * e) / (1 + e * cosAngle);
 comet.position.x = r * cosAngle;
 comet.position.z = r * sinAngle;
 comet.position.y = Math.sin(angle * 0.5) * 20;
 
 // Show/hide comet tails based on toggle
 if (userData.dustTail) {
 userData.dustTail.visible = this.cometTailsVisible;
 }
 if (userData.ionTail) {
 userData.ionTail.visible = this.cometTailsVisible;
 }
 
 // Only update tails if they're visible
 if (!this.cometTailsVisible) {
 userData.frameCount = (userData.frameCount || 0) + 1;
 return;
 }
 
 // Cache direction vectors (reuse objects to avoid GC)
 if (!userData._sunDir) userData._sunDir = new THREE.Vector3();
 if (!userData._velDir) userData._velDir = new THREE.Vector3();
 
 userData._sunDir.set(-comet.position.x, -comet.position.y, -comet.position.z).normalize();
 userData._velDir.set(Math.cos(angle + Math.PI/2), 0, Math.sin(angle + Math.PI/2)).normalize();
 
 // Update dust tail (only every 3 frames for performance)
 if (userData.dustTail && userData.frameCount % 3 === 0) {
 const dustPositions = userData.dustTail.geometry.attributes.position.array;
 const dustSizes = userData.dustTail.geometry.attributes.size.array;
 
 const curveFactor = 0.3;
 for (let i = 0; i < 200; i++) {
 const t = i / 200;
 const length = 80 * t;
 
 // Curve effect - pre-calculated
 const dirX = userData._sunDir.x + userData._velDir.x * curveFactor * t;
 const dirY = userData._sunDir.y + userData._velDir.y * curveFactor * t;
 const dirZ = userData._sunDir.z + userData._velDir.z * curveFactor * t;
 const normFactor = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
 
 // Add spread
 const spread = (Math.random() - 0.5) * 15 * t;
 const spreadPerpendicular = (Math.random() - 0.5) * 8 * t;
 
 dustPositions[i * 3] = dirX * normFactor * length + spread;
 dustPositions[i * 3 + 1] = dirY * normFactor * length + spreadPerpendicular;
 dustPositions[i * 3 + 2] = dirZ * normFactor * length + spread;
 
 // Vary size (less random() calls)
 dustSizes[i] = 3 * (1 - t * 0.7) * (0.9 + (i % 5) * 0.05);
 }
 userData.dustTail.geometry.attributes.position.needsUpdate = true;
 userData.dustTail.geometry.attributes.size.needsUpdate = true;
 }
 
 // Update ion tail (only every 2 frames for performance)
 if (userData.ionTail && userData.frameCount % 2 === 0) {
 const ionPositions = userData.ionTail.geometry.attributes.position.array;
 const sunDirX = userData._sunDir.x;
 const sunDirY = userData._sunDir.y;
 const sunDirZ = userData._sunDir.z;
 
 for (let i = 0; i < 150; i++) {
 const t = i / 150;
 const length = 120 * t;
 const spread = (Math.random() - 0.5) * 3 * t;
 
 ionPositions[i * 3] = sunDirX * length + spread;
 ionPositions[i * 3 + 1] = sunDirY * length + spread;
 ionPositions[i * 3 + 2] = sunDirZ * length + spread;
 }
 userData.ionTail.geometry.attributes.position.needsUpdate = true;
 }
 
 userData.frameCount = (userData.frameCount || 0) + 1;
 });
 }
 
 // Update satellites orbiting Earth
 if (this.satellites) {
 this.satellites.forEach(satellite => {
 const userData = satellite.userData;
 if (userData.planet) {
 const angleIncrement = userData.speed * effectiveTimeSpeed * 0.01; // Scale down for realistic orbit times
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 }
 
 // Get Earth's world position
 const earthPosition = new THREE.Vector3();
 userData.planet.getWorldPosition(earthPosition);
 
 // Calculate satellite position relative to Earth with inclination
 const cosAngle = Math.cos(userData.angle);
 const sinAngle = Math.sin(userData.angle);
 const cosIncl = Math.cos(userData.inclination);
 const sinIncl = Math.sin(userData.inclination);
 
 satellite.position.x = earthPosition.x + userData.distance * cosAngle;
 satellite.position.y = earthPosition.y + userData.distance * sinAngle * sinIncl;
 satellite.position.z = earthPosition.z + userData.distance * sinAngle * cosIncl;
 
 // Debug: Log satellite positions (especially ISS)
 if (Math.random() < 0.001) {
 if (userData.name.includes('ISS')) {
 console.log(` ISS: Earth at (${earthPosition.x.toFixed(1)}, ${earthPosition.y.toFixed(1)}, ${earthPosition.z.toFixed(1)}), ISS at (${satellite.position.x.toFixed(1)}, ${satellite.position.y.toFixed(1)}, ${satellite.position.z.toFixed(1)}), distance=${userData.distance}, visible=${satellite.visible}, children=${satellite.children.length}`);
 }
 }
 
 // Rotate satellite to face Earth (only if not ISS - ISS has fixed orientation)
 if (!userData.name.includes('ISS')) {
 satellite.lookAt(earthPosition);
 }
 }
 });
 }
 
 // Update spacecraft (Voyagers, probes, orbiters)
 if (this.spacecraft) {
 // Get numeric speed multiplier
 const effectiveTimeSpeed = timeSpeed;
 
 this.spacecraft.forEach(craft => {
 const userData = craft.userData;
 
 // Deep space probes keep moving away
 if (!userData.orbitPlanet && userData.speed) {
 const angleIncrement = userData.speed * effectiveTimeSpeed * 0.001;
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 craft.position.x = userData.distance * Math.cos(userData.angle);
 craft.position.z = userData.distance * Math.sin(userData.angle);
 }
 }
 
 // Orbiters around planets (Juno, Cassini legacy, etc)
 if (userData.orbitPlanet && userData.speed && userData.type === 'orbiter') {
 const angleIncrement = userData.speed * effectiveTimeSpeed * 0.01;
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 const radius = userData.distance;
 craft.position.x = radius * Math.cos(userData.angle);
 craft.position.z = radius * Math.sin(userData.angle);
 craft.position.y = Math.sin(userData.angle * 2) * radius * 0.1; // Inclined orbit
 }
 }
 
 // Rotate spacecraft slowly
 if (userData.type === 'probe' || userData.type === 'orbiter') {
 const rotationIncrement = 0.002 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 craft.rotation.y += rotationIncrement;
 }
 }
 });
 }
 
 // Rotate nebulae slowly (optimized - pre-calculate time)
 if (this.nebulae) {
 const effectiveTimeSpeed = timeSpeed;
 const time = Date.now() * 0.0005;
 const scale = 1 + Math.sin(time) * 0.05;
 
 this.nebulae.forEach(nebula => {
 const rotationIncrement = 0.0001 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 nebula.rotation.y += rotationIncrement;
 }
 // Pulsing effect (shared calculation)
 nebula.scale.setScalar(scale);
 });
 }
 
 // Rotate galaxies
 if (this.galaxies) {
 const effectiveTimeSpeed = timeSpeed;
 this.galaxies.forEach(galaxy => {
 const rotationIncrement = 0.0002 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 galaxy.rotation.y += rotationIncrement;
 }
 });
 }
 
 // Twinkle distant stars
 if (this.distantStars) {
 this.distantStars.forEach(star => {
 if (Math.random() < 0.01) {
 const scale = 0.9 + Math.random() * 0.2;
 star.scale.setScalar(scale);
 }
 });
 }
 }

 cleanup(scene) {
 // Dispose materials only (geometries are cached and reused)
 this.objects.forEach(obj => {
 if (obj.material) {
 if (Array.isArray(obj.material)) {
 obj.material.forEach(mat => mat.dispose());
 } else {
 obj.material.dispose();
 }
 }
 scene.remove(obj);
 });
 
 // Clean up starfield
 if (this.starfield) {
 if (this.starfield.geometry) this.starfield.geometry.dispose();
 if (this.starfield.material) this.starfield.material.dispose();
 scene.remove(this.starfield);
 }

 // Clean up orbital paths
 this.orbits.forEach(orbit => {
 if (orbit.geometry) orbit.geometry.dispose();
 if (orbit.material) orbit.material.dispose();
 scene.remove(orbit);
 });

 // Remove sun light
 const sunLight = scene.getObjectByName('sunLight');
 if (sunLight) scene.remove(sunLight);

 // Dispose cached geometries when fully cleaning up
 this.geometryCache.forEach(geo => geo.dispose());
 this.geometryCache.clear();

 this.objects = [];
 this.planets = {};
 this.moons = {};
 this.sun = null;
 this.starfield = null;
 this.asteroidBelt = null;
 this.kuiperBelt = null;
 this.orbits = [];
 }

 getSelectableObjects() {
 return this.objects;
 }
 
 toggleOrbits(visible) {
 this.orbitsVisible = visible;
 this.orbits.forEach(orbit => {
 orbit.visible = visible;
 });
 console.log(` Orbit paths ${visible ? 'shown' : 'hidden'}`);
 }
 
 toggleConstellations(visible) {
 this.constellationsVisible = visible;
 this.constellations.forEach(constellation => {
 constellation.visible = visible;
 });
 console.log(` Constellations ${visible ? 'shown' : 'hidden'}`);
 }
 
 updateScale() {
 // Update all planetary positions based on scale mode
 const scaleFactors = this.realisticScale ? {
 // Realistic scale (AU converted to scene units, 1 AU = 150 units)
 mercury: 57.9,
 venus: 108.2,
 earth: 150,
 mars: 227.9,
 jupiter: 778.6,
 saturn: 1433.5,
 uranus: 2872.5,
 neptune: 4495.1,
 pluto: 5906.4
 } : {
 // Educational scale (compressed for visibility)
 mercury: 20,
 venus: 30,
 earth: 45,
 mars: 60,
 jupiter: 100,
 saturn: 150,
 uranus: 200,
 neptune: 250,
 pluto: 300
 };
 
 // Update planet distances
 Object.entries(this.planets).forEach(([name, planet]) => {
 if (planet && planet.userData) {
 const newDistance = scaleFactors[name];
 if (newDistance) {
 planet.userData.distance = newDistance;
 }
 }
 });
 
 // Recreate orbital paths with new distances
 this.updateOrbitalPaths();
 
 // Update asteroid belt and Kuiper belt positions
 this.updateBelts();
 
 // Update spacecraft positions
 this.updateSpacecraftPositions();
 
 // Update comet positions
 this.updateCometPositions();
 
 // Update nebulae and galaxies positions
 this.updateDeepSpaceObjects();
 
 if (DEBUG.enabled) console.log(`Scale: ${this.realisticScale ? 'Realistic' : 'Educational'}`);
 }
 
 updateOrbitalPaths() {
 // Remove existing orbital paths
 this.orbits.forEach(orbit => {
 if (orbit.parent) {
 orbit.parent.remove(orbit);
 }
 if (orbit.geometry) orbit.geometry.dispose();
 if (orbit.material) orbit.material.dispose();
 });
 this.orbits = [];
 
 // Recreate orbital paths for all planets
 const planetsToOrbit = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
 
 planetsToOrbit.forEach(planetName => {
 const planet = this.planets[planetName];
 if (planet && planet.userData) {
 const distance = planet.userData.distance;
 const points = [];
 const segments = 128;
 
 for (let i = 0; i <= segments; i++) {
 const angle = (i / segments) * Math.PI * 2;
 points.push(new THREE.Vector3(
 distance * Math.cos(angle),
 0,
 distance * Math.sin(angle)
 ));
 }
 
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: 0x6688AA,
 transparent: true,
 opacity: 0.5
 });
 
 const orbit = new THREE.Line(geometry, material);
 orbit.visible = this.orbitsVisible;
 orbit.userData = { type: 'orbit', planet: planetName };
 
 planet.parent.add(orbit);
 this.orbits.push(orbit);
 }
 });
 
 // Also update Pluto if it exists
 if (this.planets.pluto && this.planets.pluto.userData) {
 const distance = this.planets.pluto.userData.distance;
 const points = [];
 const segments = 128;
 
 for (let i = 0; i <= segments; i++) {
 const angle = (i / segments) * Math.PI * 2;
 points.push(new THREE.Vector3(
 distance * Math.cos(angle),
 0,
 distance * Math.sin(angle)
 ));
 }
 
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: 0x6688AA,
 transparent: true,
 opacity: 0.5
 });
 
 const orbit = new THREE.Line(geometry, material);
 orbit.visible = this.orbitsVisible;
 orbit.userData = { type: 'orbit', planet: 'pluto' };
 
 this.planets.pluto.parent.add(orbit);
 this.orbits.push(orbit);
 }
 
 // Recreate moon orbital paths
 Object.values(this.planets).forEach(planet => {
 if (planet.userData.moons && planet.userData.moons.length > 0) {
 console.log(`[Orbits] Recreating ${planet.userData.moons.length} moon orbit(s) for ${planet.userData.name}`);
 planet.userData.moons.forEach(moon => {
 const moonDistance = moon.userData.distance;
 
 const curve = new THREE.EllipseCurve(
 0, 0,
 moonDistance, moonDistance,
 0, 2 * Math.PI,
 false,
 0
 );
 
 const points = curve.getPoints(128);
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: 0xAADDFF, // Brighter cyan for better visibility
 transparent: true,
 opacity: 0.7,
 linewidth: 2,
 depthTest: true,
 depthWrite: false
 });
 
 const orbitLine = new THREE.Line(geometry, material);
 orbitLine.rotation.x = Math.PI / 2;
 orbitLine.visible = this.orbitsVisible;
 orbitLine.renderOrder = 1;
 orbitLine.userData = { type: 'moonOrbit', moon: moon.userData.name, planet: planet.userData.name };
 planet.add(orbitLine);
 this.orbits.push(orbitLine);
 });
 }
 });
 
 if (DEBUG.enabled) console.log(` Orbits updated: ${this.orbits.length} (including moon orbits)`);
 }

 updateBelts() {
 // Update asteroid belt positions based on scale
 if (this.asteroidBelt && this.asteroidBelt.children) {
 // Define scale parameters for both modes
 const oldParams = this.realisticScale ? 
 { base: 75, spread: 15 } : // We're switching FROM educational TO realistic
 { base: 350, spread: 150 }; // We're switching FROM realistic TO educational
 
 const newParams = this.realisticScale ? 
 { base: 350, spread: 150 } : // Switching TO realistic
 { base: 75, spread: 15 }; // Switching TO educational
 
 this.asteroidBelt.children.forEach(particleSystem => {
 if (particleSystem.geometry && particleSystem.geometry.attributes.position) {
 const positions = particleSystem.geometry.attributes.position.array;
 const particleCount = positions.length / 3;
 
 for (let i = 0; i < particleCount; i++) {
 const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
 const currentDist = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 2] * positions[i * 3 + 2]);
 const height = positions[i * 3 + 1];
 
 // Normalize from current scale to 0-1 range
 const normalizedDist = Math.max(0, Math.min(1, (currentDist - oldParams.base) / oldParams.spread));
 
 // Apply to new scale
 const newDistance = newParams.base + (normalizedDist * newParams.spread);
 
 positions[i * 3] = newDistance * Math.cos(angle);
 positions[i * 3 + 2] = newDistance * Math.sin(angle);
 }
 
 particleSystem.geometry.attributes.position.needsUpdate = true;
 }
 });
 }
 
 // Update Kuiper belt positions based on scale
 if (this.kuiperBelt && this.kuiperBelt.children) {
 // Define scale parameters for both modes
 const oldParams = this.realisticScale ? 
 { base: 280, spread: 100 } : // We're switching FROM educational TO realistic
 { base: 5000, spread: 2500 }; // We're switching FROM realistic TO educational
 
 const newParams = this.realisticScale ? 
 { base: 5000, spread: 2500 } : // Switching TO realistic
 { base: 280, spread: 100 }; // Switching TO educational
 
 this.kuiperBelt.children.forEach(particleSystem => {
 if (particleSystem.geometry && particleSystem.geometry.attributes.position) {
 const positions = particleSystem.geometry.attributes.position.array;
 const particleCount = positions.length / 3;
 
 for (let i = 0; i < particleCount; i++) {
 const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
 const currentDist = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 2] * positions[i * 3 + 2]);
 const height = positions[i * 3 + 1];
 
 // Normalize from current scale to 0-1 range
 const normalizedDist = Math.max(0, Math.min(1, (currentDist - oldParams.base) / oldParams.spread));
 
 // Apply to new scale
 const newDistance = newParams.base + (normalizedDist * newParams.spread);
 
 positions[i * 3] = newDistance * Math.cos(angle);
 positions[i * 3 + 2] = newDistance * Math.sin(angle);
 }
 
 particleSystem.geometry.attributes.position.needsUpdate = true;
 }
 });
 }
 
 if (DEBUG.enabled) console.log(` Belts updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }
 
 updateSpacecraftPositions() {
 // Update spacecraft positions based on scale mode
 if (!this.spacecraft || this.spacecraft.length === 0) return;
 
 // Scale factors for spacecraft distances
 const spacecraftScaleFactors = this.realisticScale ? {
 // Realistic scale - use much larger distances
 'Voyager 1': 4500, // 162 AU - way beyond planets
 'Voyager 2': 4200, // 135 AU
 'New Horizons': 2950, // 59 AU - beyond Neptune 
 'Parker Solar Probe': 20, // Close to Sun
 'Pioneer 10': 4800, // 133 AU
 'Pioneer 11': 4400 // 106 AU
 } : {
 // Educational scale - compressed for visibility
 'Voyager 1': 300,
 'Voyager 2': 280,
 'New Horizons': 85,
 'Parker Solar Probe': 12,
 'Pioneer 10': 320,
 'Pioneer 11': 290
 };
 
 this.spacecraft.forEach(spacecraft => {
 const userData = spacecraft.userData;
 if (!userData || userData.orbitPlanet) return; // Skip orbiters - they stay relative to planet
 
 const newDistance = spacecraftScaleFactors[userData.name];
 if (newDistance && userData.angle !== undefined) {
 // Update stored distance
 userData.distance = newDistance;
 
 // Update position
 spacecraft.position.x = newDistance * Math.cos(userData.angle);
 spacecraft.position.z = newDistance * Math.sin(userData.angle);
 
 if (DEBUG.enabled) console.log(` ${userData.name}: ${newDistance} units`);
 }
 });
 
 if (DEBUG.enabled) console.log(` Spacecraft positions updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }
 
 updateCometPositions() {
 // Update comet orbit distances based on scale mode
 if (!this.comets || this.comets.length === 0) return;
 
 // Scale factors for comet distances (semi-major axis of their elliptical orbits)
 const cometScaleFactors = this.realisticScale ? {
 // Realistic scale - Halley's Comet: ~35 AU, Hale-Bopp: ~250 AU, NEOWISE: ~10 AU
 'Halley\'s Comet': 5250, // ~35 AU
 'Comet Hale-Bopp': 37500, // ~250 AU
 'Comet NEOWISE': 1500 // ~10 AU
 } : {
 // Educational scale - compressed for visibility
 'Halley\'s Comet': 200,
 'Comet Hale-Bopp': 250,
 'Comet NEOWISE': 180
 };
 
 this.comets.forEach(comet => {
 const userData = comet.userData;
 if (!userData || !userData.name) return;
 
 const newDistance = cometScaleFactors[userData.name];
 if (newDistance !== undefined) {
 // Update stored distance (semi-major axis)
 userData.distance = newDistance;
 
 // Recalculate position based on current angle and eccentricity
 const e = userData.eccentricity;
 const a = userData.distance;
 const angle = userData.angle || 0;
 
 const cosAngle = Math.cos(angle);
 const sinAngle = Math.sin(angle);
 
 // Elliptical orbit formula
 const r = a * (1 - e * e) / (1 + e * cosAngle);
 comet.position.x = r * cosAngle;
 comet.position.z = r * sinAngle;
 comet.position.y = Math.sin(angle * 0.5) * 20;
 
 if (DEBUG.enabled) console.log(` ${userData.name}: ${newDistance} units (e=${e})`);
 }
 });
 
 if (DEBUG.enabled) console.log(` Comet positions updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }
 
 updateDeepSpaceObjects() {
 // Update nebulae and galaxies positions based on scale mode
 const deepSpaceScale = this.realisticScale ? 2.5 : 1.0;
 
 // Update nebulae
 if (this.nebulae && this.nebulae.length > 0) {
 this.nebulae.forEach(nebula => {
 if (nebula.userData && nebula.userData.basePosition) {
 // Scale position from stored base position
 nebula.position.x = nebula.userData.basePosition.x * deepSpaceScale;
 nebula.position.y = nebula.userData.basePosition.y * deepSpaceScale;
 nebula.position.z = nebula.userData.basePosition.z * deepSpaceScale;
 }
 });
 }
 
 // Update galaxies
 if (this.galaxies && this.galaxies.length > 0) {
 this.galaxies.forEach(galaxy => {
 if (galaxy.userData && galaxy.userData.basePosition) {
 // Scale position from stored base position
 galaxy.position.x = galaxy.userData.basePosition.x * deepSpaceScale;
 galaxy.position.y = galaxy.userData.basePosition.y * deepSpaceScale;
 galaxy.position.z = galaxy.userData.basePosition.z * deepSpaceScale;
 }
 });
 }
 
 if (DEBUG.enabled) console.log(` Deep space objects updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }

 getObjectInfo(object) {
 const userData = object.userData;
 const t = window.t || ((key) => key);
 
 // Translate object name
 const nameKey = userData.name?.toLowerCase().replace(/\s+/g, '');
 let translatedName = userData.name || 'Unknown';
 if (nameKey && window.t && window.t(nameKey) !== nameKey) {
 translatedName = t(nameKey);
 }
 
 // Translate object type
 const typeKey = 'type' + userData.type?.replace(/\s+/g, '');
 let translatedType = userData.type || 'Object';
 if (typeKey && window.t && window.t(typeKey) !== typeKey) {
 translatedType = t(typeKey);
 }
 
 // Safely format distance
 let distanceText;
 if (userData.distance === 0) {
 distanceText = t('centerSolarSystem');
 } else if (userData.parentPlanet) {
 // Translate parent planet name too
 const parentKey = userData.parentPlanet?.toLowerCase().replace(/\s+/g, '');
 const translatedParent = (parentKey && window.t && window.t(parentKey) !== parentKey) ? t(parentKey) : userData.parentPlanet;
 distanceText = `${t('orbitsParent')} ${translatedParent}`;
 } else if (typeof userData.distance === 'number') {
 distanceText = `${userData.distance.toFixed(1)} ${t('millionKmFromSun')}`;
 } else {
 distanceText = t('distanceVaries');
 }
 
 // Get translated description based on object name
 let description = userData.description || t('noDescription');
 const descKey = 'desc' + userData.name?.replace(/\s+/g, '');
 if (window.t && window.t(descKey) !== descKey) {
 description = t(descKey);
 }
 
 let info = {
 name: translatedName,
 type: translatedType,
 distance: distanceText,
 size: userData.realSize || (userData.radius ? `${userData.radius.toFixed(2)} units` : 'Unknown size'),
 description: description
 };

 // Add fun facts for kids (translated)
 if (userData.funFact) {
 const funFactKey = 'funFact' + userData.name?.replace(/\s+/g, '');
 let funFact = userData.funFact;
 if (window.t && window.t(funFactKey) !== funFactKey) {
 funFact = t(funFactKey);
 }
 info.description += `\n\n ${funFact}`;
 }

 // Add moon count for planets (translated)
 if (userData.moonCount > 0) {
 const moonText = userData.moonCount > 1 ? t('majorMoons') : t('majorMoon');
 info.description += `\n\n ${t('moonCount')} ${userData.moonCount} ${moonText} ${t('shownHere')}`;
 }

 return info;
 }

 focusOnObject(object, camera, controls) {
 if (!object || !object.userData) {
 console.warn(' Cannot focus on invalid object');
 return;
 }
 
 // Determine actual object size (not inflated glow size)
 const userData = object.userData;
 let actualRadius;
 
 if (userData.isSpacecraft || userData.isComet) {
 // Use actual size for spacecraft and comets, not glow/tail size
 actualRadius = userData.actualSize || 0.1;
 } else if (userData.type === 'Constellation') {
 // Constellations: use calculated radius (star pattern spread)
 actualRadius = userData.radius || 500;
 } else if (userData.type === 'Galaxy' || userData.type === 'Nebula') {
 // Distant deep-sky objects
 actualRadius = userData.radius || 300;
 } else {
 actualRadius = userData.radius || 10;
 }
 
 // Calculate appropriate viewing distance based on object type
 let distance;
 if (userData.type === 'Constellation') {
 // Constellations: Position camera to view the star pattern
 // They're at distance ~10000, so we need to be relatively close but not inside
 distance = actualRadius * 3; // View from 3x the pattern size
 } else if (userData.type === 'Galaxy') {
 // Galaxies: Distant objects, zoom to appreciate structure
 distance = actualRadius * 4;
 } else if (userData.type === 'Nebula') {
 // Nebulae: Clouds in space, zoom to show details
 distance = actualRadius * 3.5;
 } else if (userData.isSpacecraft && userData.distance > 100) {
 // Distant spacecraft: zoom in close enough to see them clearly
 distance = Math.max(actualRadius * 10, 5);
 } else if (userData.isSpacecraft) {
 // Nearby spacecraft: moderate zoom
 distance = Math.max(actualRadius * 8, 3);
 } else if (userData.isComet) {
 // Comets: zoom to see nucleus and inner coma details
 distance = Math.max(actualRadius * 12, 2);
 } else {
 // Regular objects: standard zoom
 distance = Math.max(actualRadius * 5, 10);
 }
 
 const targetPosition = new THREE.Vector3();
 object.getWorldPosition(targetPosition);
 
 // Store reference for tracking with enhanced data
 this.focusedObject = object;
 this.focusedObjectDistance = distance;
 this.focusedObjectStartTime = performance.now();
 this.cameraFollowMode = false; // Will be enabled after initial transition
 
 if (DEBUG.enabled) console.log(` Focus: ${object.userData.name} (r:${actualRadius.toFixed(2)}, d:${distance.toFixed(2)})`);
 
 // Determine if this is a fast-moving object that needs special tracking
 const isOrbiter = userData.orbitPlanet || (userData.isSpacecraft && userData.speed);
 const isFastOrbiter = isOrbiter && userData.speed > 0.5;
 
 // For orbiters, enable continuous tracking
 if (isOrbiter) {
 this.cameraFollowMode = true;
 if (DEBUG.enabled) console.log(` Tracking mode enabled for ${object.userData.name}`);
 }
 
 // Configure controls for focused object inspection
 const minDist = Math.max(actualRadius * 0.5, 0.5); // Allow zooming to half the radius
 const maxDist = Math.max(actualRadius * 100, 1000); // Allow zooming far out
 controls.minDistance = minDist;
 controls.maxDistance = maxDist;
 
 // Enable full rotation around object
 controls.enableRotate = true;
 controls.enableZoom = true;
 controls.enablePan = true;
 controls.autoRotate = false;
 
 // Smooth camera transition
 const startPos = camera.position.clone();
 const startTarget = controls.target.clone();
 
 // For fast orbiters (like ISS), calculate relative offset instead of absolute position
 let useRelativeOffset = false;
 let parentPlanet = null;
 let relativeOffset = null;
 
 if (isFastOrbiter && userData.orbitPlanet) {
 parentPlanet = this.planets[userData.orbitPlanet.toLowerCase()];
 if (parentPlanet) {
 useRelativeOffset = true;
 relativeOffset = targetPosition.clone().sub(parentPlanet.position);
 if (DEBUG.enabled) console.log(` Fast orbiter: using relative offset from ${userData.orbitPlanet}`);
 }
 }
 
 const endPos = new THREE.Vector3(
 targetPosition.x,
 targetPosition.y + distance * 0.3,
 targetPosition.z + distance
 );
 
 const duration = isFastOrbiter ? 1000 : 1500; // Faster transition for fast orbiters
 const startTime = performance.now();
 
 const animate = () => {
 const elapsed = performance.now() - startTime;
 const progress = Math.min(elapsed / duration, 1);
 const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
 
 // Update target position differently based on object type
 if (useRelativeOffset && progress < 1) {
 // For fast orbiters during transition: maintain relative offset from parent
 const planetPos = parentPlanet.position.clone();
 targetPosition.copy(planetPos).add(relativeOffset);
 endPos.set(
 targetPosition.x,
 targetPosition.y + distance * 0.3,
 targetPosition.z + distance
 );
 } else if (progress < 1) {
 // For regular objects or final frame: use actual position
 object.getWorldPosition(targetPosition);
 }
 
 camera.position.lerpVectors(startPos, endPos, eased);
 controls.target.copy(targetPosition);
 controls.update();
 
 if (progress < 1) {
 requestAnimationFrame(animate);
 } else {
 // Transition complete - enable smooth following
 if (isOrbiter) {
 this.cameraFollowMode = true;
 if (DEBUG.enabled) console.log(` Camera follow mode ENABLED for ${object.userData.name}`);
 }
 }
 };
 
 animate();
 }
 
 updateCameraTracking(camera, controls) {
 // Update tracking indicator UI
 const trackingIndicator = document.getElementById('tracking-indicator');
 if (!trackingIndicator) return;
 
 // Show/hide tracking indicator based on tracking mode
 if (!this.focusedObject || !this.cameraFollowMode) {
 trackingIndicator.classList.remove('active');
 return;
 }
 
 // Show tracking indicator with object name
 trackingIndicator.classList.add('active');
 const trackingText = trackingIndicator.querySelector('.tracking-text');
 if (trackingText && this.focusedObject.userData && this.focusedObject.userData.name) {
 trackingText.textContent = `Tracking: ${this.focusedObject.userData.name}`;
 }
 
 // Update camera to follow focused object smoothly
 const object = this.focusedObject;
 const targetPosition = new THREE.Vector3();
 object.getWorldPosition(targetPosition);
 
 // Determine smooth factor based on object speed
 const userData = object.userData;
 const isFastOrbiter = userData.orbitPlanet && userData.speed && userData.speed > 0.5;
 
 // Fast orbiters need more aggressive tracking to prevent camera lag/spinning
 const smoothFactor = isFastOrbiter ? 0.25 : 0.1; // Higher = more responsive, lower = smoother
 
 // Smoothly update controls target to follow the object
 const currentTarget = controls.target.clone();
 controls.target.lerpVectors(currentTarget, targetPosition, smoothFactor);
 
 // Calculate offset from target to camera
 const offset = camera.position.clone().sub(currentTarget);
 
 // Move camera to maintain the same relative position
 camera.position.copy(targetPosition).add(offset);
 
 controls.update();
 }

 createLabels() {
 // Create CSS2D labels for all major objects
 this.labels = [];
 
 // Helper function to create a label
 const createLabel = (object, text) => {
 if (!object || !object.userData) return;
 
 const labelDiv = document.createElement('div');
 labelDiv.className = 'object-label';
 labelDiv.textContent = text || object.userData.name;
 labelDiv.style.color = 'white';
 labelDiv.style.fontSize = '14px';
 labelDiv.style.fontFamily = "'Poppins', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
 labelDiv.style.padding = '2px 6px';
 labelDiv.style.background = 'rgba(0, 0, 0, 0.7)';
 labelDiv.style.borderRadius = '4px';
 labelDiv.style.pointerEvents = 'none';
 labelDiv.style.userSelect = 'none';
 
 const label = new CSS2DObject(labelDiv);
 label.position.set(0, object.userData.radius * 1.5 || 5, 0);
 label.visible = false; // Start hidden
 object.add(label);
 
 object.userData.label = label;
 this.labels.push(label);
 };
 
 // Add labels to Sun
 if (this.sun) {
 createLabel(this.sun, ' Sun');
 }
 
 // Add labels to planets
 Object.entries(this.planets).forEach(([name, planet]) => {
 if (planet) {
 const emoji = {
 'mercury': '', 'venus': '', 'earth': '', 'mars': '',
 'jupiter': '', 'saturn': '', 'uranus': '', 'neptune': ''
 }[name.toLowerCase()] || '';
 createLabel(planet, `${emoji} ${planet.userData.name}`);
 
 // Add labels to moons
 if (planet.userData.moons) {
 planet.userData.moons.forEach(moon => {
 createLabel(moon, ` ${moon.userData.name}`);
 });
 }
 }
 });
 
 // Add labels to spacecraft
 if (this.spacecraft) {
 this.spacecraft.forEach(craft => {
 createLabel(craft, ` ${craft.userData.name}`);
 });
 }
 
 // Add labels to satellites
 if (this.satellites) {
 this.satellites.forEach(sat => {
 createLabel(sat, ` ${sat.userData.name}`);
 });
 }
 
 // Add labels to distant stars
 if (this.distantStars) {
 this.distantStars.forEach(star => {
 createLabel(star, ` ${star.userData.name}`);
 });
 }
 
 // Add labels to nebulae
 if (this.nebulae) {
 this.nebulae.forEach(nebula => {
 createLabel(nebula, ` ${nebula.userData.name}`);
 });
 }
 
 // Add labels to constellations
 if (this.constellations) {
 this.constellations.forEach(constellation => {
 createLabel(constellation, ` ${constellation.userData.name}`);
 });
 }
 }

 toggleLabels(visible) {
 console.log(` toggleLabels called with visible=${visible}, labels.length=${this.labels?.length || 0}`);
 
 if (!this.labels || this.labels.length === 0) {
 console.warn(' No labels to toggle - labels array is empty or undefined');
 console.log(' this.labels:', this.labels);
 return;
 }
 
 // Use the passed visibility state, or toggle based on first label's current state
 const newVisibility = visible !== undefined ? visible : !this.labels[0].visible;
 
 this.labels.forEach((label, index) => {
 label.visible = newVisibility;
 if (index < 3 && DEBUG.enabled) {
 console.log(` Label ${index}: ${label.element?.textContent || 'no text'} -> visible=${newVisibility}`);
 }
 });
 
 console.log(` Labels now: ${newVisibility ? 'VISIBLE ' : 'HIDDEN '} (${this.labels.length} labels toggled)`);
 }

 getExplorerContent(focusCallback) {
 const categories = [
 {
 title: ' The Sun',
 items: [
 { name: ' Sun', onClick: () => focusCallback(this.sun) }
 ]
 },
 {
 title: ' Inner Planets (Rocky)',
 items: [
 { name: ' Mercury', onClick: () => focusCallback(this.planets.mercury) },
 { name: ' Venus', onClick: () => focusCallback(this.planets.venus) },
 { name: ' Earth', onClick: () => focusCallback(this.planets.earth) },
 { name: ' Moon', onClick: () => focusCallback(this.moons.moon) },
 { name: ' Mars', onClick: () => focusCallback(this.planets.mars) },
 { name: ' Phobos', onClick: () => focusCallback(this.moons.phobos) },
 { name: ' Deimos', onClick: () => focusCallback(this.moons.deimos) }
 ]
 },
 {
 title: ' Asteroid Belt',
 items: [
 { name: ' Asteroid Belt', onClick: () => focusCallback(this.asteroidBelt) }
 ]
 },
 {
 title: ' Outer Planets (Gas Giants)',
 items: [
 { name: ' Jupiter', onClick: () => focusCallback(this.planets.jupiter) },
 { name: ' Io', onClick: () => focusCallback(this.moons.io) },
 { name: ' Europa', onClick: () => focusCallback(this.moons.europa) },
 { name: ' Ganymede', onClick: () => focusCallback(this.moons.ganymede) },
 { name: ' Callisto', onClick: () => focusCallback(this.moons.callisto) },
 { name: ' Saturn', onClick: () => focusCallback(this.planets.saturn) },
 { name: ' Titan', onClick: () => focusCallback(this.moons.titan) },
 { name: ' Enceladus', onClick: () => focusCallback(this.moons.enceladus) },
 { name: ' Rhea', onClick: () => focusCallback(this.moons.rhea) }
 ]
 },
 {
 title: ' Ice Giants',
 items: [
 { name: ' Uranus', onClick: () => focusCallback(this.planets.uranus) },
 { name: ' Titania', onClick: () => focusCallback(this.moons.titania) },
 { name: ' Miranda', onClick: () => focusCallback(this.moons.miranda) },
 { name: ' Neptune', onClick: () => focusCallback(this.planets.neptune) },
 { name: ' Triton', onClick: () => focusCallback(this.moons.triton) }
 ]
 },
 {
 title: ' Kuiper Belt & Dwarf Planets',
 items: [
 { name: ' Pluto', onClick: () => focusCallback(this.planets.pluto) },
 { name: ' Charon', onClick: () => focusCallback(this.moons.charon) },
 { name: ' Kuiper Belt', onClick: () => focusCallback(this.kuiperBelt) }
 ]
 },
 {
 title: ' Comets',
 items: this.comets.map(comet => ({
 name: ` ${comet.userData.name}`,
 onClick: () => focusCallback(comet)
 }))
 },
 {
 title: ' Satellites & Space Stations',
 items: this.satellites.map(sat => ({
 name: ` ${sat.userData.name}`,
 onClick: () => focusCallback(sat)
 }))
 },
 {
 title: ' Spacecraft & Probes',
 items: this.spacecraft.map(craft => ({
 name: ` ${craft.userData.name}`,
 onClick: () => focusCallback(craft)
 }))
 },
 {
 title: ' Distant Stars',
 items: this.distantStars.map(star => ({
 name: ` ${star.userData.name}`,
 onClick: () => focusCallback(star)
 }))
 },
 {
 title: ' Nebulae',
 items: this.nebulae.map(nebula => ({
 name: ` ${nebula.userData.name}`,
 onClick: () => focusCallback(nebula)
 }))
 },
 {
 title: ' Galaxies',
 items: this.galaxies.map(galaxy => ({
 name: ` ${galaxy.userData.name}`,
 onClick: () => focusCallback(galaxy)
 }))
 },
 {
 title: ' Constellations',
 items: this.constellations.map(constellation => ({
 name: ` ${constellation.userData.name}`,
 onClick: () => focusCallback(constellation)
 }))
 }
 ];
 
 // Debug logging for constellations
 console.log(`[Explorer] Constellations array length: ${this.constellations?.length || 0}`);
 if (this.constellations?.length > 0) {
 console.log(`[Explorer] First constellation: ${this.constellations[0]?.userData?.name}`);
 }
 
 // Filter out categories with no items (empty arrays)
 const filtered = categories.filter(category => category.items && category.items.length > 0);
 console.log(`[Explorer] Total categories: ${categories.length}, After filter: ${filtered.length}`);
 return filtered;
 }
 
 getQuickNavTargets() {
 // Returns array of quick navigation targets for VR menu and quick nav dropdown
 const targets = [];
 
 // Add key solar system objects
 if (this.planets.earth) targets.push({ id: 'earth', label: ' Earth', object: this.planets.earth });
 if (this.planets.mars) targets.push({ id: 'mars', label: ' Mars', object: this.planets.mars });
 if (this.planets.jupiter) targets.push({ id: 'jupiter', label: ' Jupiter', object: this.planets.jupiter });
 if (this.planets.saturn) targets.push({ id: 'saturn', label: ' Saturn', object: this.planets.saturn });
 
 // Add some moons
 if (this.moons.moon) targets.push({ id: 'moon', label: ' Moon', object: this.moons.moon });
 if (this.moons.europa) targets.push({ id: 'europa', label: ' Europa', object: this.moons.europa });
 if (this.moons.titan) targets.push({ id: 'titan', label: ' Titan', object: this.moons.titan });
 
 // Add some interesting objects
 if (this.satellites && this.satellites.length > 0) {
 const iss = this.satellites.find(s => s.userData.name.includes('ISS'));
 if (iss) targets.push({ id: 'iss', label: ' ISS', object: iss });
 }
 
 if (this.spacecraft && this.spacecraft.length > 0) {
 const voyager1 = this.spacecraft.find(s => s.userData.name.includes('Voyager 1'));
 if (voyager1) targets.push({ id: 'voyager-1', label: ' Voyager 1', object: voyager1 });
 }
 
 if (this.nebulae && this.nebulae.length > 0) {
 const orion = this.nebulae.find(n => n.userData.name.includes('Orion'));
 if (orion) targets.push({ id: 'orion-nebula', label: ' Orion Nebula', object: orion });
 }
 
 if (this.galaxies && this.galaxies.length > 0) {
 const andromeda = this.galaxies.find(g => g.userData.name.includes('Andromeda'));
 if (andromeda) targets.push({ id: 'andromeda-galaxy', label: ' Andromeda', object: andromeda });
 }
 
 return targets;
 }
 
 refreshExplorerContent() {
 // Refresh the explorer menu with all loaded objects
 if (!this.uiManager) return;
 
 const focusCallback = (obj) => {
 if (obj) {
 const info = this.getObjectInfo(obj);
 this.uiManager.updateInfoPanel(info);
 this.focusOnObject(obj, window.app?.sceneManager?.camera, window.app?.sceneManager?.controls);
 }
 };
 
 const explorerContent = this.getExplorerContent(focusCallback);
 if (explorerContent && Array.isArray(explorerContent)) {
 this.uiManager.updateExplorer(' Explore the Solar System', explorerContent);
 console.log(` Explorer menu refreshed with ${explorerContent.length} categories`);
 }
 }
}


// ===========================
// TOPIC MANAGER
// ===========================
// TOPIC MANAGER (UNUSED - Commented out for single-topic app)
// ===========================
/* UNUSED CLASS - Kept for reference if multi-topic support needed in future
class TopicManager {
 constructor(sceneManager, uiManager) {
 this.sceneManager = sceneManager;
 this.uiManager = uiManager;
 this.currentModule = null;
 this.currentTopicId = null;
 // Initialize with default slider value (5 = 1000x speed)
 this.timeSpeed = 1000;
 this.brightnessMultiplier = 0.5;
 this.clickTimeout = null;
 
 // Modules - Only Solar System experience retained
 this.modules = {
 'solar-system': new SolarSystemModule(uiManager)
 // Other modules removed - focusing on solar system only
 };

 this.setupControls();
 }

 setupControls() {
 // Topic navigation with event delegation
 const navButtons = document.querySelectorAll('.nav-btn');
 navButtons.forEach(btn => {
 btn.addEventListener('click', () => this.handleTopicChange(btn), { passive: true });
 });

 // Time speed control (slider)
 const timeSpeedSlider = document.getElementById('time-speed');
 const timeSpeedLabel = document.getElementById('time-speed-label');
 
 // Time speed presets (seconds of simulated time per real second)
 // Earth orbit = 31,557,600 seconds (1 year)
 // For smooth animation: lower values = slower, more visible movement
 const speedValues = [
 0, // 0: Paused
 0.1, // 1: 0.1 sec/sec (nearly real-time, very slow)
 1, // 2: 1 sec/sec (real-time)
 10, // 3: 10 sec/sec
 100, // 4: 100 sec/sec
 1000, // 5: 1000 sec/sec (default - ~16 min/sec)
 10000, // 6: 10000 sec/sec (~2.7 hrs/sec)
 100000, // 7: 100000 sec/sec (~1 day/sec)
 500000, // 8: 500000 sec/sec (~5 days/sec)
 1000000, // 9: 1000000 sec/sec (~11 days/sec)
 5000000, // 10: 5000000 sec/sec (~58 days/sec)
 10000000, // 11: 10000000 sec/sec (~115 days/sec)
 525960 // 12: Earth orbit in 1 minute (max speed)
 ];

 const speedLabels = [
 'Paused',
 '0.1x',
 '1x Real-time',
 '10x',
 '100x',
 '1000x',
 '10,000x',
 '~1 day/sec',
 '~5 days/sec',
 '~11 days/sec',
 '~2 months/sec',
 '~4 months/sec',
 'Earth orbit/min'
 ];
 
 const updateSpeed = (index) => {
 const speed = speedValues[index];
 this.timeSpeed = speed;
 
 // Update App's timeSpeed as well
 if (window.app) {
 window.app.timeSpeed = speed;
 }
 
 // Update label
 if (timeSpeedLabel) {
 timeSpeedLabel.textContent = speedLabels[index];
 }
 
 // Always log speed changes for debugging
 console.log(`⏱ Speed changed to: ${speedLabels[index]} (${speed}x)`);
 };
 
 if (timeSpeedSlider) {
 timeSpeedSlider.addEventListener('input', (e) => {
 updateSpeed(parseInt(e.target.value, 10));
 }, { passive: true });
 
 // Set initial speed
 updateSpeed(parseInt(timeSpeedSlider.value, 10));
 }

 // Scale toggle button
 const scaleButton = document.getElementById('toggle-scale');
 if (scaleButton) {
 scaleButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 this.solarSystemModule.realisticScale = !this.solarSystemModule.realisticScale;
 scaleButton.classList.toggle('active');
 scaleButton.textContent = this.solarSystemModule.realisticScale ? 
 '?? Realistic Scale' : '?? Educational Scale';
 
 // Recalculate positions with new scale
 this.solarSystemModule.updateScale();
 }
 }, { passive: true });
 }
 
 // Labels toggle button
 const labelsButton = document.getElementById('toggle-details');
 if (labelsButton) {
 // Set initial button state
 labelsButton.textContent = ' Labels OFF';
 labelsButton.classList.remove('toggle-on');
 
 labelsButton.addEventListener('click', () => {
 const currentModule = this.solarSystemModule;
 if (currentModule && currentModule.toggleLabels) {
 // Toggle visibility using SceneManager's labelsVisible state
 if (this.sceneManager) {
 this.sceneManager.labelsVisible = !this.sceneManager.labelsVisible;
 currentModule.toggleLabels(this.sceneManager.labelsVisible);
 labelsButton.classList.toggle('toggle-on', this.sceneManager.labelsVisible);
 labelsButton.textContent = this.sceneManager.labelsVisible ? 
 ' Labels ON' : ' Labels OFF';
 if (DEBUG.enabled) console.log(` Labels toggled: ${this.sceneManager.labelsVisible ? 'ON' : 'OFF'}`);
 }
 }
 }, { passive: true });
 }
 
 // Reset view button
 const resetButton = document.getElementById('reset-view');
 if (resetButton) {
 resetButton.addEventListener('click', () => {
 // Clear focus from any object
 if (this.solarSystemModule) {
 this.solarSystemModule.focusedObject = null;
 }
 this.sceneManager.resetCamera();
 }, { passive: true });
 }

 // Tracking indicator close button
 const trackingClose = document.querySelector('#tracking-indicator .tracking-close');
 if (trackingClose) {
 trackingClose.addEventListener('click', () => {
 if (this.solarSystemModule) {
 this.solarSystemModule.cameraFollowMode = false;
 }
 }, { passive: true });
 }

 // Canvas click for object selection (debounced)
 this.sceneManager.renderer.domElement.addEventListener('click', (e) => {
 if (this.clickTimeout) return;
 this.clickTimeout = setTimeout(() => {
 this.clickTimeout = null;
 }, 300);
 this.handleCanvasClick(e);
 });
 }

 handleTopicChange(btn) {
 const topic = btn.dataset.topic;
 if (topic === this.currentTopicId) return; // Already loaded
 
 this.loadTopic(topic);
 document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 }

 async loadTopic(topicId) {
 try {
 this.uiManager.showLoading(`Loading ${topicId}...`);

 // Cleanup current module
 if (this.currentModule) {
 this.currentModule.cleanup(this.sceneManager.scene);
 }

 // Clear scene
 this.sceneManager.clear();

 // Load new module
 const module = this.modules[topicId];
 if (module) {
 await module.init(this.sceneManager.scene);
 this.currentModule = module;
 this.currentTopicId = topicId;
 
 // Update explorer with focus callback
 const focusCallback = (obj) => {
 if (obj) {
 const info = module.getObjectInfo(obj);
 this.uiManager.updateInfoPanel(info);
 module.focusOnObject(obj, this.sceneManager.camera, this.sceneManager.controls);
 }
 };
 
 this.uiManager.updateExplorer(
 `?? Explore ${topicId}`, 
 module.getExplorerContent(focusCallback)
 );
 } else {
 console.warn(`Module ${topicId} not yet implemented`);
 this.uiManager.showLoading(`${topicId} coming soon!`);
 setTimeout(() => this.loadTopic('solar-system'), 2000);
 return;
 }

 this.uiManager.hideLoading();
 // Don't reset camera automatically - user might have an object focused
 // this.sceneManager.resetCamera();
 this.sceneManager.updateBrightness(this.brightnessMultiplier);
 } catch (error) {
 console.error('Error loading topic:', error);
 this.uiManager.showLoading('Error loading topic. Please refresh.');
 }
 }

 handleCanvasClick(event) {
 if (!this.currentModule || event.target.tagName !== 'CANVAS') return;

 const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
 this.sceneManager.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
 this.sceneManager.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

 this.sceneManager.raycaster.setFromCamera(this.sceneManager.mouse, this.sceneManager.camera);
 const intersects = this.sceneManager.raycaster.intersectObjects(
 this.currentModule.getSelectableObjects(), 
 false
 );

 if (intersects.length > 0) {
 const object = intersects[0].object;
 const info = this.currentModule.getObjectInfo(object);
 this.uiManager.updateInfoPanel(info);
 this.currentModule.focusOnObject(object, this.sceneManager.camera, this.sceneManager.controls);
 }
 }

 update(deltaTime) {
 if (this.currentModule) {
 this.currentModule.update(deltaTime, this.timeSpeed, this.sceneManager.camera, this.sceneManager.controls);
 }
 }
}
*/ // END OF UNUSED TopicManager CLASS

// Function to toggle pause
let isPaused = false;
function togglePause() {
 isPaused = !isPaused;
 if (isPaused) {
 // Logic to pause the game
 // For example, set app.timeSpeed = 0 or call a pause function
 if (window.app) {
 window.app.timeSpeed = 0;
 if (window.app.sceneManager) {
 window.app.sceneManager.vrStatusMessage = '⏸ Paused';
 window.app.sceneManager.requestVRMenuRefresh();
 }
 }
 } else {
 // Logic to resume the game
 if (window.app) {
 window.app.timeSpeed = 1;
 if (window.app.sceneManager) {
 window.app.sceneManager.vrStatusMessage = ' Playing';
 window.app.sceneManager.requestVRMenuRefresh();
 }
 }
 }
}

// Update the VR navigation setup to include thumbstick press
function setupVRNavigation() {
 // This assumes you have a way to get the VR controllers
 if (window.app && window.app.sceneManager && window.app.sceneManager.controllers) {
 window.app.sceneManager.controllers.forEach(controller => {
 // Listen for thumbstick press (WebXR Gamepad API)
 if (controller && controller.gamepad) {
 controller.addEventListener('selectstart', () => {
 // Existing selectstart logic if needed
 });
 // Listen for thumbstick press
 controller.addEventListener('thumbstickdown', togglePause); // Custom event, see below
 }
 });
 }
}

// Polyfill for thumbstick press event (since WebXR does not emit 'thumbstickdown' directly)
function setupThumbstickListeners() {
 if (window.app && window.app.sceneManager && window.app.sceneManager.controllers) {
 window.app.sceneManager.controllers.forEach(controller => {
 if (controller && controller.gamepad) {
 let lastThumbstickPressed = false;
 function checkThumbstick() {
 const gp = controller.gamepad;
 if (gp && gp.buttons && gp.buttons.length > 2) {
 const pressed = gp.buttons[3]?.pressed; // Button 3 is usually thumbstick
 if (pressed && !lastThumbstickPressed) {
 // Dispatch custom event
 controller.dispatchEvent({ type: 'thumbstickdown' });
 }
 lastThumbstickPressed = pressed;
 }
 requestAnimationFrame(checkThumbstick);
 }
 checkThumbstick();
 }
 });
 }
}

// Call the setup functions after VR controllers are initialized
setTimeout(() => {
 setupVRNavigation();
 setupThumbstickListeners();
}, 2000); // Delay to ensure controllers are available

// ===========================
// MAIN APPLICATION
// ===========================
class App {
 constructor() {
 this.sceneManager = null;
 this.uiManager = null;
 this.solarSystemModule = null;
 this.lastTime = 0;
 this.timeSpeed = 1; // Default to 1x real-time (original default)
 this.brightness = 100; // Default brightness percentage
 
 // Make this app instance globally accessible for VR and other modules
 window.app = this;
 
 this.init();
 }

 async init() {
 const appStartTime = performance.now();
 
 try {
 // Check cache status
 const cacheReady = await warmupTextureCache();
 if (cacheReady && DEBUG.PERFORMANCE) {
 console.log(' Fast start: All essential textures cached');
 }
 
 // Initialize managers
 this.sceneManager = new SceneManager();
 this.uiManager = new UIManager();
 
 const t = window.t || ((key) => key);
 this.uiManager.showLoading(t('initializing'));
 this.uiManager.updateLoadingProgress(0, t('settingUpScene'));
 
 // Setup global UI functions
 this.setupGlobalFunctions();
 this.uiManager.updateLoadingProgress(10, t('initializingControls'));
 
 // Setup help button
 this.setupHelpButton();
 this.uiManager.updateLoadingProgress(15, t('loadingSolarSystem'));

 // Load Solar System module directly
 const moduleStartTime = performance.now();
 this.solarSystemModule = new SolarSystemModule(this.uiManager);
 this.uiManager.updateLoadingProgress(20, t('creatingSun'));
 
 // The init method now handles its own async loading and will call startExperience() when done
 await this.solarSystemModule.init(this.sceneManager.scene);
 
 if (DEBUG.PERFORMANCE) {
 const totalTime = performance.now() - appStartTime;
 console.log(` Module loaded in ${totalTime.toFixed(0)}ms`);
 }
 } catch (error) {
 console.error(' Failed to initialize Space Voyage:', error);
 this.sceneManager?.showError('Failed to start Space Voyage. Please refresh the page.');
 }
 }
 
 startExperience() {
 // Called by SolarSystemModule after all assets are loaded
 console.log(' Starting experience...');
 
 // Setup UI for Solar System
 this.uiManager.setupSolarSystemUI(this.solarSystemModule, this.sceneManager);
 
 // Setup controls
 this.setupControls();
 
 // Hide loading screen
 this.uiManager.hideLoading();
 
 console.log(' Starting animation loop...');
 console.log(' Sun position:', this.solarSystemModule.sun?.position);
 console.log(' Earth position:', this.solarSystemModule.planets?.earth?.position);
 
 // Start animation loop
 this.sceneManager.animate(() => {
 // Initialize timing on first frame
 if (!this.lastTime) {
 this.lastTime = performance.now();
 return;
 }
 
 const currentTime = performance.now();
 const deltaTime = Math.min((currentTime - this.lastTime) / 1000, CONFIG.PERFORMANCE.maxDeltaTime);
 this.lastTime = currentTime;
 
 // Update XR controller movement and laser pointers
 this.sceneManager.updateXRMovement();
 this.sceneManager.updateLaserPointers();
 
 // Update Solar System module every frame
 if (this.solarSystemModule) {
 this.solarSystemModule.update(deltaTime, this.timeSpeed, 
 this.sceneManager.camera, this.sceneManager.controls);
 }
 });
 
 console.log(` Space Voyage ready!`);
 console.log(` Planets loaded: ${Object.keys(this.solarSystemModule.planets).length}`);
 console.log(` Objects in scene: ${this.solarSystemModule.objects.length}`);
 }

 setupGlobalFunctions() {
 // Close info panel
 window.closeInfoPanel = () => {
 this.uiManager.closeInfoPanel();
 };
 
 // Close help modal
 window.closeHelpModal = () => {
 this.uiManager.closeHelpModal();
 };
 }

 setupHelpButton() {
 const helpButton = document.getElementById('help-button');
 if (helpButton) {
 helpButton.addEventListener('click', () => {
 this.uiManager.showHelp(`
 <h3> Controls</h3>
 <p> <strong>Click & Drag:</strong> Rotate view around selected object</p>
 <p> <strong>Scroll:</strong> Zoom in/out (closer or farther from object)</p>
 <p> <strong>Right Click & Drag:</strong> Pan camera position</p>
 <p> <strong>Click Objects:</strong> Select and focus on object</p>
 <p> <strong>Explorer Panel:</strong> Click object names to jump to them</p>
 
 <h3>⌨ Keyboard Shortcuts</h3>
 <p>⌨ <span class="keyboard-shortcut">H</span> Show this help</p>
 <p>⌨ <span class="keyboard-shortcut">R</span> Reset camera view</p>
 <p>⌨ <span class="keyboard-shortcut">O</span> Toggle orbital paths</p>
 <p>⌨ <span class="keyboard-shortcut">D</span> Toggle object labels</p>
 <p>⌨ <span class="keyboard-shortcut">S</span> Toggle realistic scale</p>
 <p>⌨ <span class="keyboard-shortcut">L</span> Toggle VR laser pointers (in VR)</p>
 <p>⌨ <span class="keyboard-shortcut">F</span> Toggle FPS counter</p>
 <p>⌨ <span class="keyboard-shortcut">+/-</span> Speed up/slow down time</p>
 <p>⌨ <span class="keyboard-shortcut">ESC</span> Close panels</p>
 
 <h3> Object Inspection</h3>
 <p> <strong>After selecting an object:</strong></p>
 <p> - Drag to rotate camera around the object</p>
 <p> - Scroll to zoom in for close-up views</p>
 <p> - View object from all sides and angles</p>
 <p> - Camera stays focused as object moves in orbit</p>
 
 <h3> Settings</h3>
 <p>⏱ <strong>Speed Slider:</strong> 0x to 10x animation speed</p>
 <p> <strong>Brightness Slider:</strong> Adjust lighting for dark objects</p>
 <p> <strong>Reset Button:</strong> Return camera to starting position</p>
 
 <h3> VR Mode</h3>
 <p> Click "Enter VR" button (bottom right)</p>
 <p> Requires WebXR-compatible VR headset</p>
 <p> <strong>VR Controls:</strong></p>
 <p> - Left stick: Move forward/backward/strafe</p>
 <p> - Right stick: Turn left/right, move up/down</p>
 <p> - Trigger (hold): Sprint mode while moving</p>
 <p> - Grip button: Toggle VR menu (pause, controls, etc.)</p>
 <p> - Point + Trigger: Select planets</p>
 <p> - L key or VR menu: Toggle laser pointers for better immersion</p>
 
 <h3> Tips</h3>
 <p> Increase brightness to see dark sides of planets</p>
 <p> Use speed slider to watch orbits in fast-forward</p>
 <p> Click objects directly or use the explorer panel</p>
 <p> Zoom in close to see surface details and textures</p>
 <p> Rotate around objects to view from all angles</p>
 
 <h3> Performance</h3>
 <p> Optimized for 60 FPS on modern devices</p>
 <p> Adaptive quality for mobile devices</p>
 <p> Hardware-accelerated WebGL rendering</p>
 <p> Press <span class="keyboard-shortcut">F</span> to show FPS counter</p>
 
 <h3> Explore the Solar System!</h3>
 <p> Navigate through our solar system</p>
 <p> Learn about the Sun, planets, moons, and more</p>
 <p> Discover fascinating facts about each celestial body</p>
 `);
 }, { passive: true });
 }
 
 // Setup keyboard shortcuts
 this.setupKeyboardShortcuts();
 
 // Setup FPS counter
 this.setupFPSCounter();
 }
 
 setupControls() {
 // Time speed control is handled by UIManager
 // App.timeSpeed is updated by UIManager's updateSpeed function via window.app
 
 // Orbit toggle button
 const orbitsButton = document.getElementById('toggle-orbits');
 if (orbitsButton) {
 // Set initial state based on default visibility
 if (this.solarSystemModule && this.solarSystemModule.orbitsVisible) {
 orbitsButton.classList.add('toggle-on');
 }
 
 orbitsButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 const visible = !this.solarSystemModule.orbitsVisible;
 this.solarSystemModule.toggleOrbits(visible);
 orbitsButton.classList.toggle('toggle-on', visible);
 console.log(` Orbits toggled: ${visible ? 'ON' : 'OFF'}`);
 }
 });
 }
 
 // Constellation toggle button
 const constellationsButton = document.getElementById('toggle-constellations');
 if (constellationsButton) {
 // Set initial state based on default visibility
 if (this.solarSystemModule && this.solarSystemModule.constellationsVisible) {
 constellationsButton.classList.add('toggle-on');
 }
 
 constellationsButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 const visible = !this.solarSystemModule.constellationsVisible;
 this.solarSystemModule.toggleConstellations(visible);
 constellationsButton.classList.toggle('toggle-on', visible);
 console.log(` Constellations toggled: ${visible ? 'ON' : 'OFF'}`);
 }
 });
 }

 // Scale toggle button
 const scaleButton = document.getElementById('toggle-scale');
 if (scaleButton) {
 scaleButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 const t = window.t || ((key) => key);
 this.solarSystemModule.realisticScale = !this.solarSystemModule.realisticScale;
 scaleButton.classList.toggle('active');
 scaleButton.textContent = this.solarSystemModule.realisticScale ? 
 t('toggleScaleRealistic') : t('toggleScale');
 
 // Recalculate positions with new scale
 this.solarSystemModule.updateScale();
 }
 });
 }
 
 // Labels toggle button
 const labelsButton = document.getElementById('toggle-details');
 if (labelsButton) {
 // Use translation function if available, otherwise fallback to English
 const t = window.t || ((key) => key);
 labelsButton.textContent = t('toggleLabels');
 labelsButton.classList.remove('toggle-on');
 
 labelsButton.addEventListener('click', () => {
 if (this.solarSystemModule && this.solarSystemModule.toggleLabels) {
 if (this.sceneManager) {
 this.sceneManager.labelsVisible = !this.sceneManager.labelsVisible;
 this.solarSystemModule.toggleLabels(this.sceneManager.labelsVisible);
 labelsButton.classList.toggle('toggle-on', this.sceneManager.labelsVisible);
 labelsButton.textContent = this.sceneManager.labelsVisible ? 
 t('toggleLabelsOn') : t('toggleLabels');
 console.log(` Labels toggled: ${this.sceneManager.labelsVisible ? 'ON' : 'OFF'}`);
 }
 }
 });
 }
 
 // Reset view button
 const resetButton = document.getElementById('reset-view');
 if (resetButton) {
 resetButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 this.solarSystemModule.focusedObject = null;
 }
 this.sceneManager.resetCamera();
 });
 }
 // Canvas click for object selection
 this.sceneManager.renderer.domElement.addEventListener('click', (e) => {
 this.handleCanvasClick(e);
 });
 
 // Navigation dropdown
 const dropdown = document.getElementById('object-dropdown');
 if (dropdown) {
 dropdown.addEventListener('change', (e) => {
 const value = e.target.value;
 if (!value) return; // Ignore the placeholder option
 
 console.log(` Dropdown navigation to: ${value}`);
 
 // Reset dropdown to placeholder
 dropdown.value = '';
 
 // Find and focus on the selected object
 if (this.solarSystemModule) {
 let targetObject = null;
 
 // Map dropdown values to actual objects
 switch(value) {
 case 'sun':
 targetObject = this.solarSystemModule.sun;
 break;
 case 'mercury':
 case 'venus':
 case 'earth':
 case 'mars':
 case 'jupiter':
 case 'saturn':
 case 'uranus':
 case 'neptune':
 targetObject = this.solarSystemModule.planets[value];
 break;
 case 'moon':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Moon');
 break;
 case 'pluto':
 targetObject = this.solarSystemModule.planets.pluto;
 break;
 // Moons
 case 'phobos':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Phobos');
 break;
 case 'deimos':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Deimos');
 break;
 case 'io':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Io');
 break;
 case 'europa':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Europa');
 break;
 case 'ganymede':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Ganymede');
 break;
 case 'callisto':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Callisto');
 break;
 case 'titan':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Titan');
 break;
 case 'enceladus':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Enceladus');
 break;
 case 'rhea':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Rhea');
 break;
 case 'titania':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Titania');
 break;
 case 'miranda':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Miranda');
 break;
 case 'triton':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Triton');
 break;
 case 'charon':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Charon');
 break;
 // Nearby Stars
 case 'alpha-centauri':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Alpha Centauri A');
 break;
 case 'proxima-centauri':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Proxima Centauri');
 break;
 // Exoplanets
 case 'proxima-b':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Proxima Centauri b');
 break;
 case 'kepler-452b':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Kepler-452b');
 break;
 case 'trappist-1e':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' TRAPPIST-1e');
 break;
 case 'kepler-186f':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === ' Kepler-186f');
 break;
 // Spacecraft & Satellites
 case 'iss':
 targetObject = this.solarSystemModule.satellites?.find(s => s.userData.name.includes('ISS') || s.userData.name.includes('International Space Station'));
 break;
 case 'hubble':
 targetObject = this.solarSystemModule.satellites?.find(s => s.userData.name.includes('Hubble'));
 break;
 case 'voyager-1':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('Voyager 1'));
 break;
 case 'voyager-2':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('Voyager 2'));
 break;
 case 'new-horizons':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('New Horizons'));
 break;
 case 'parker-solar-probe':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('Parker Solar Probe'));
 break;
 case 'juno':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('Juno'));
 break;
 case 'cassini':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('Cassini'));
 break;
 case 'pioneer-10':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('Pioneer 10'));
 break;
 case 'pioneer-11':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('Pioneer 11'));
 break;
 // Nebulae
 case 'orion-nebula':
 targetObject = this.solarSystemModule.nebulae?.find(n => n.userData.name.includes('Orion'));
 break;
 case 'crab-nebula':
 targetObject = this.solarSystemModule.nebulae?.find(n => n.userData.name.includes('Crab'));
 break;
 case 'ring-nebula':
 targetObject = this.solarSystemModule.nebulae?.find(n => n.userData.name.includes('Ring'));
 break;
 // Galaxies
 case 'andromeda-galaxy':
 targetObject = this.solarSystemModule.galaxies?.find(g => g.userData.name.includes('Andromeda'));
 break;
 case 'whirlpool-galaxy':
 targetObject = this.solarSystemModule.galaxies?.find(g => g.userData.name.includes('Whirlpool'));
 break;
 case 'sombrero-galaxy':
 targetObject = this.solarSystemModule.galaxies?.find(g => g.userData.name.includes('Sombrero'));
 break;
 // Constellations - Zodiac
 case 'constellation-aries':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Aries'));
 break;
 case 'constellation-taurus':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Taurus'));
 break;
 case 'constellation-gemini':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Gemini'));
 break;
 case 'constellation-cancer':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Cancer'));
 break;
 case 'constellation-leo':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Leo'));
 break;
 case 'constellation-virgo':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Virgo'));
 break;
 case 'constellation-libra':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Libra'));
 break;
 case 'constellation-scorpius':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Scorpius'));
 break;
 case 'constellation-sagittarius':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Sagittarius'));
 break;
 case 'constellation-capricornus':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Capricornus'));
 break;
 case 'constellation-aquarius':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Aquarius'));
 break;
 case 'constellation-pisces':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Pisces'));
 break;
 // Constellations - Other
 case 'constellation-orion':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Orion'));
 break;
 case 'constellation-big-dipper':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Big Dipper') || c.userData.name.includes('Ursa Major'));
 break;
 case 'constellation-little-dipper':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Little Dipper') || c.userData.name.includes('Ursa Minor'));
 break;
 case 'constellation-southern-cross':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Southern Cross') || c.userData.name.includes('Crux'));
 break;
 case 'constellation-cassiopeia':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Cassiopeia'));
 break;
 case 'constellation-cygnus':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Cygnus'));
 break;
 case 'constellation-lyra':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Lyra'));
 break;
 case 'constellation-andromeda':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Andromeda') && c.userData.name.includes('Princess'));
 break;
 case 'constellation-perseus':
 targetObject = this.solarSystemModule.constellations?.find(c => c.userData.name.includes('Perseus'));
 break;
 }
 
 if (targetObject) {
 const info = this.solarSystemModule.getObjectInfo(targetObject);
 this.uiManager.updateInfoPanel(info);
 console.log(` [Nav] Navigating to: ${info.name} (type: ${targetObject.userData.type || 'planet'})`);
 this.solarSystemModule.focusOnObject(targetObject, this.sceneManager.camera, this.sceneManager.controls);
 } else {
 console.warn(` [Nav] Object not found: ${value}`);
 }
 }
 });
 }
 }
 
 handleCanvasClick(event) {
 console.log(' Canvas clicked!');
 if (!this.solarSystemModule) {
 console.warn(' No solar system module!');
 return;
 }
 
 console.log(` Checking ${this.solarSystemModule.objects.length} objects for intersection...`);
 
 const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
 const mouse = new THREE.Vector2(
 ((event.clientX - rect.left) / rect.width) * 2 - 1,
 -((event.clientY - rect.top) / rect.height) * 2 + 1
 );

 this.sceneManager.raycaster.setFromCamera(mouse, this.sceneManager.camera);
 const intersects = this.sceneManager.raycaster.intersectObjects(this.solarSystemModule.objects, true);

 console.log(` Found ${intersects.length} intersections`);
 if (intersects.length > 0) {
 let target = intersects[0].object;
 while (target.parent && !target.userData.name) {
 target = target.parent;
 }

 if (target.userData && target.userData.name) {
 const info = this.solarSystemModule.getObjectInfo(target);
 this.uiManager.updateInfoPanel(info);
 this.solarSystemModule.focusOnObject(target, this.sceneManager.camera, this.sceneManager.controls);
 }
 }
 }
 
 setupKeyboardShortcuts() {
 document.addEventListener('keydown', (e) => {
 // Ignore if typing in input
 if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
 
 switch(e.key.toLowerCase()) {
 case 'h':
 document.getElementById('help-button')?.click();
 break;
 case 'r':
 document.getElementById('reset-view')?.click();
 break;
 case 'o':
 document.getElementById('toggle-orbits')?.click();
 break;
 case 'd':
 document.getElementById('toggle-details')?.click();
 break;
 case 's':
 document.getElementById('toggle-scale')?.click();
 break;
 case 'f':
 const fpsCounter = document.getElementById('fps-counter');
 if (fpsCounter) {
 fpsCounter.classList.toggle('hidden');
 }
 break;
 case 'l':
 // Toggle VR laser pointers (only works in VR)
 if (this.sceneManager.renderer.xr.isPresenting) {
 this.sceneManager.lasersVisible = !this.sceneManager.lasersVisible;
 this.sceneManager.controllers.forEach(controller => {
 const laser = controller.getObjectByName('laser');
 const pointer = controller.getObjectByName('pointer');
 if (laser) laser.visible = this.sceneManager.lasersVisible;
 if (pointer) pointer.visible = this.sceneManager.lasersVisible;
 });
 console.log(` Laser pointers ${this.sceneManager.lasersVisible ? 'visible' : 'hidden'}`);
 }
 break;
 case '+':
 case '=':
 // Increase speed
 const speedSliderUp = document.getElementById('time-speed');
 if (speedSliderUp) {
 const currentValue = parseFloat(speedSliderUp.value);
 const newValue = Math.min(10, currentValue + 0.5);
 speedSliderUp.value = newValue;
 speedSliderUp.dispatchEvent(new Event('input'));
 }
 break;
 case '-':
 case '_':
 // Decrease speed
 const speedSliderDown = document.getElementById('time-speed');
 if (speedSliderDown) {
 const currentValue = parseFloat(speedSliderDown.value);
 const newValue = Math.max(0, currentValue - 0.5);
 speedSliderDown.value = newValue;
 speedSliderDown.dispatchEvent(new Event('input'));
 }
 break;
 case 'escape':
 this.uiManager.closeInfoPanel();
 this.uiManager.closeHelpModal();
 break;
 case ' ':
 case 'space':
 // SPACE = Toggle between Paused and Normal speed
 e.preventDefault();
 const spaceSpeedSlider = document.getElementById('time-speed');
 if (spaceSpeedSlider) {
 if (this.timeSpeed === 0) {
 // If paused, go to normal (5 = 1x speed)
 spaceSpeedSlider.value = '5';
 console.log(' PLAY (Normal Speed)');
 } else {
 // If playing, pause
 spaceSpeedSlider.value = '0';
 console.log('⏸ PAUSE');
 }
 spaceSpeedSlider.dispatchEvent(new Event('input'));
 }
 break;
 case 'i':
 // Find and focus on ISS
 if (this.solarSystemModule?.spacecraft) {
 const iss = this.solarSystemModule.spacecraft.find(s => s.userData.name.includes('ISS'));
 if (iss) {
 this.solarSystemModule.focusOnObject(iss, this.sceneManager.camera, this.sceneManager.controls);
 console.log(' Focusing on International Space Station');
 }
 }
 break;
 case 'v':
 // Cycle through Voyager probes
 if (this.solarSystemModule?.spacecraft) {
 const voyagers = this.solarSystemModule.spacecraft.filter(s => s.userData.name.includes('Voyager'));
 if (voyagers.length > 0) {
 this._voyagerIndex = ((this._voyagerIndex || 0) + 1) % voyagers.length;
 this.solarSystemModule.focusOnObject(voyagers[this._voyagerIndex], this.sceneManager.camera, this.sceneManager.controls);
 console.log(` Focusing on ${voyagers[this._voyagerIndex].userData.name}`);
 }
 }
 break;
 case 'm':
 // Cycle through Mars rovers
 if (this.solarSystemModule?.spacecraft) {
 const rovers = this.solarSystemModule.spacecraft.filter(s => s.userData.type === 'rover');
 if (rovers.length > 0) {
 this._roverIndex = ((this._roverIndex || 0) + 1) % rovers.length;
 this.solarSystemModule.focusOnObject(rovers[this._roverIndex], this.sceneManager.camera, this.sceneManager.controls);
 console.log(` Focusing on ${rovers[this._roverIndex].userData.name}`);
 }
 }
 break;
 case 'p':
 // Cycle through deep space probes
 if (this.spacecraft) {
 const probes = this.spacecraft.filter(s => s.userData.type === 'probe');
 if (probes.length > 0) {
 this._probeIndex = ((this._probeIndex || 0) + 1) % probes.length;
 this.focusOnObject(probes[this._probeIndex], this.camera, this.controls);
 console.log(`??? Focusing on ${probes[this._probeIndex].userData.name}`);
 }
 }
 break;
 }
 }, { passive: true });
 }
 
 setupFPSCounter() {
 let frameCount = 0;
 let lastTime = performance.now();
 const fpsValue = document.getElementById('fps-value');
 const fpsCounter = document.getElementById('fps-counter');
 
 const updateFPS = () => {
 frameCount++;
 const currentTime = performance.now();
 
 if (currentTime >= lastTime + 1000) {
 const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
 if (fpsValue) {
 fpsValue.textContent = fps;
 }
 
 // Update color based on FPS
 if (fpsCounter) {
 fpsCounter.classList.remove('good', 'warning', 'bad');
 if (fps >= 55) {
 fpsCounter.classList.add('good');
 } else if (fps >= 30) {
 fpsCounter.classList.add('warning');
 } else {
 fpsCounter.classList.add('bad');
 }
 }
 
 frameCount = 0;
 lastTime = currentTime;
 }
 
 requestAnimationFrame(updateFPS);
 };
 
 updateFPS();
 }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', () => new App());
} else {
 new App();
}



