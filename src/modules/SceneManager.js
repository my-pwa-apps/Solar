// ===========================
// SCENE MANAGER MODULE
// ===========================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { CONFIG, DEBUG, IS_MOBILE } from './utils.js';
export class SceneManager {
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
 this.previousButtonStates = [{}, {}];
 
 // Grab-to-rotate state
 this.grabRotateState = {
 active: false,
 controllerIndex: -1,
 startPosition: new THREE.Vector3(),
 startDollyRotation: new THREE.Euler(),
 lastPosition: new THREE.Vector3()
 };
 
 // Pre-allocate reusable objects for VR hot paths (avoid per-frame allocations)
 this._vrRaycaster = new THREE.Raycaster();
 this._vrTempMatrix = new THREE.Matrix4();
 this._vrCameraForward = new THREE.Vector3();
 this._vrCameraRight = new THREE.Vector3();
 this._vrUpVector = new THREE.Vector3(0, 1, 0);
 this._vrTempPosition = new THREE.Vector3();
 this._vrGrabDelta = new THREE.Vector3(); // For grab-to-rotate delta calc
 
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
 // Ensure canvas has proper styling
 this.renderer.domElement.style.display = 'block';
 this.renderer.domElement.style.width = '100%';
 this.renderer.domElement.style.height = '100%';
 
 container.appendChild(this.renderer.domElement);
 if (DEBUG.enabled) {
 console.log(`[Scene] Canvas ${this.renderer.domElement.width}×${this.renderer.domElement.height} → #${container.id}, colorSpace=${this.renderer.outputColorSpace}`);
 }
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
 
 // Add event listeners to detect user interaction with controls
 // When user manually controls camera, disable follow mode
 this.controls.addEventListener('start', () => {
 if (window.app && window.app.solarSystemModule) {
 window.app.solarSystemModule.cameraFollowMode = false;
 window.app.solarSystemModule.cameraCoRotateMode = false;
 if (DEBUG.enabled) console.log(' [Controls] User interaction detected - follow and co-rotate modes disabled');
 }
 });
 }

 setupEventListeners() {
 window.addEventListener('resize', () => {
 clearTimeout(this.resizeTimeout);
 this.resizeTimeout = setTimeout(() => this.onResize(), 150);
 }, { passive: true });
 }

 setupLighting() {
 // Set scene background to dark space color
 this.scene.background = new THREE.Color(0x000011);
 
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
 console.log('[Lighting] Ambient lighting enhanced');
 }
 }

 setupXR() {
 try {
 if (DEBUG.VR) console.log('[XR] Setting up WebXR');
 
 // Create a dolly (rig) for VR movement (but don't add camera yet - only in VR mode)
 this.dolly = new THREE.Group();
 this.dolly.position.set(0, 100, 200); // Start away from Sun (updated for new educational scale)
 this.scene.add(this.dolly);
 
 // Store original camera parent for switching back
 this.cameraOriginalParent = this.camera.parent;

 // Controller models
 this.controllerModelFactory = new XRControllerModelFactory();
 
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
 controller.addEventListener('squeezeend', () => this.onSqueezeEnd(controller, i));
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
 vrButton.innerHTML = '<span style="font-weight: 600; font-size: 16px;">VR</span>'; // Clear text label
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
 arButton.style.cssText = 'position: fixed; bottom: 80px; right: 80px; width: 50px; height: 50px; cursor: pointer; padding: 0; border: 2px solid #fff; border-radius: 50%; background: rgba(0,0,0,0.8); color: #fff; font-size: 24px; text-align: center; line-height: 50px; opacity: 0.9; outline: none; z-index: 999; transition: all 0.3s;';
 arButton.innerHTML = '<span style="font-weight: 600; font-size: 16px;">AR</span>'; // Clear text label
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
 // Position dolly at solar-system plane level (y=0) so the Sun/planets
 // are directly ahead at eye level, not 27° below the user's gaze.
 this.dolly.position.set(0, 0, 200);
 this.dolly.rotation.set(0, 0, 0); // Ensure no stale rotation
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
 
 if (DEBUG.VR) console.log('[VR] Controls: LStick=move, RStick=turn/up-down, LTrigger=sprint, LGrip=rotate, X=menu, Trigger=select');
 
 // Hide VR UI panel initially - let user toggle with X button
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
 
 this.scene.background = new THREE.Color(0x000011); // Restore original space background
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
 canvas.width = 1400;
 canvas.height = 1000;
 const ctx = canvas.getContext('2d', { willReadFrequently: true });

 this.vrUICanvas = canvas;
 this.vrUIContext = ctx;
 this.vrButtons = [];
 this.vrQuickNavMap = new Map();
 this.vrStatusMessage = this.vrStatusMessage || '✨ Use Laser to Click Buttons';
 this.vrMenuTitle = this.vrMenuTitle || '🌌 Space Voyage VR';
 
 // Navigation state for scrollable object list
 this.vrNavState = {
 currentPage: 'controls',   // 'controls' | 'navigate' | 'info'
 currentCategory: 'solar',
 scrollOffset: 0,
 itemsPerPage: 16
 };
 this.vrLastObjectInfo = null;

 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;

 const aspect = canvas.width / canvas.height;
 const panelHeight = 2.4;
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
 console.log('[VR] UI Panel created (enhanced navigation)');
 }

 this.drawVRMenu();
 }

 requestVRMenuRefresh() {
 if (!this.vrUIContext) return;
 // Debounce: coalesce rapid refresh requests into a single redraw
 if (this._vrMenuRefreshTimer) clearTimeout(this._vrMenuRefreshTimer);
 this._vrMenuRefreshTimer = setTimeout(() => {
 this._vrMenuRefreshTimer = null;
 this.drawVRMenu();
 }, 16); // ~1 frame at 60fps
 }

 getVRMenuState() {
 const app = window.app || {};
 const module = app.solarSystemModule;
 const ns = this.vrNavState || {};
 return {
 timeSpeed: app.timeSpeed ?? 1,
 orbitsVisible: module?.orbitsVisible ?? true,
 labelsVisible: this.labelsVisible,
 realisticScale: module?.realisticScale ?? false,
 constellationsVisible: module?.constellationsVisible ?? true,
 lasersVisible: this.lasersVisible,
 focusedObject: module?.focusedObject || null,
 statusMessage: this.vrStatusMessage,
 flashAction: this.vrFlashAction,
 currentPage: ns.currentPage || 'controls',
 currentCategory: ns.currentCategory || 'solar',
 scrollOffset: ns.scrollOffset || 0,
 audioEnabled: window.audioManager?.enabled ?? true,
 lastObjectInfo: this.vrLastObjectInfo || null
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
 
 getVRNavCatalog() {
 return [
 { id: 'solar', label: '☀️ Solar', items: [
 { id: 'sun', label: '☀️ Sun' },
 { id: 'mercury', label: '☿ Mercury' },
 { id: 'venus', label: '♀ Venus' },
 { id: 'earth', label: '🌍 Earth' },
 { id: 'mars', label: '♂ Mars' },
 { id: 'jupiter', label: '♃ Jupiter' },
 { id: 'saturn', label: '♄ Saturn' },
 { id: 'uranus', label: '♅ Uranus' },
 { id: 'neptune', label: '♆ Neptune' }
 ]},
 { id: 'moons', label: '🌙 Moons', items: [
 { id: 'moon', label: '🌙 Moon' },
 { id: 'phobos', label: 'Phobos' },
 { id: 'deimos', label: 'Deimos' },
 { id: 'io', label: 'Io' },
 { id: 'europa', label: 'Europa' },
 { id: 'ganymede', label: 'Ganymede' },
 { id: 'callisto', label: 'Callisto' },
 { id: 'titan', label: 'Titan' },
 { id: 'enceladus', label: 'Enceladus' },
 { id: 'rhea', label: 'Rhea' },
 { id: 'titania', label: 'Titania' },
 { id: 'miranda', label: 'Miranda' },
 { id: 'triton', label: 'Triton' },
 { id: 'charon', label: 'Charon' }
 ]},
 { id: 'dwarf', label: '🔭 Dwarf', items: [
 { id: 'pluto', label: 'Pluto' },
 { id: 'ceres', label: 'Ceres' },
 { id: 'haumea', label: 'Haumea' },
 { id: 'makemake', label: 'Makemake' },
 { id: 'eris', label: 'Eris' },
 { id: 'orcus', label: 'Orcus' },
 { id: 'quaoar', label: 'Quaoar' },
 { id: 'gonggong', label: 'Gonggong' },
 { id: 'sedna', label: 'Sedna' }
 ]},
 { id: 'comets', label: '☄️ Comets', items: [
 { id: 'halley', label: "Halley's" },
 { id: 'hale-bopp', label: 'Hale-Bopp' },
 { id: 'hyakutake', label: 'Hyakutake' },
 { id: 'lovejoy', label: 'Lovejoy' },
 { id: 'encke', label: 'Encke' },
 { id: 'swift-tuttle', label: 'Swift-Tuttle' }
 ]},
 { id: 'craft', label: '🛰️ Craft', items: [
 { id: 'iss', label: 'ISS' },
 { id: 'hubble', label: 'Hubble' },
 { id: 'jwst', label: 'JWST' },
 { id: 'voyager-1', label: 'Voyager 1' },
 { id: 'voyager-2', label: 'Voyager 2' },
 { id: 'new-horizons', label: 'New Horizons' },
 { id: 'juno', label: 'Juno' },
 { id: 'cassini', label: 'Cassini' },
 { id: 'pioneer-10', label: 'Pioneer 10' },
 { id: 'pioneer-11', label: 'Pioneer 11' },
 { id: 'gps-navstar', label: 'GPS Navstar' }
 ]},
 { id: 'deepsky', label: '🌌 Deep Sky', items: [
 { id: 'orion-nebula', label: 'Orion Nebula' },
 { id: 'crab-nebula', label: 'Crab Nebula' },
 { id: 'ring-nebula', label: 'Ring Nebula' },
 { id: 'andromeda-galaxy', label: 'Andromeda' },
 { id: 'whirlpool-galaxy', label: 'Whirlpool' },
 { id: 'sombrero-galaxy', label: 'Sombrero' },
 { id: 'alpha-centauri', label: 'Alpha Cen.' },
 { id: 'proxima-centauri', label: 'Proxima Cen.' }
 ]},
 { id: 'constellations', label: '✨ Stars', items: [
 { id: 'constellation-orion', label: 'Orion' },
 { id: 'constellation-big-dipper', label: 'Big Dipper' },
 { id: 'constellation-little-dipper', label: 'Little Dipper' },
 { id: 'constellation-southern-cross', label: 'Southern Cross' },
 { id: 'constellation-cassiopeia', label: 'Cassiopeia' },
 { id: 'constellation-cygnus', label: 'Cygnus' },
 { id: 'constellation-lyra', label: 'Lyra' },
 { id: 'constellation-andromeda', label: 'Andromeda' },
 { id: 'constellation-perseus', label: 'Perseus' },
 { id: 'constellation-aries', label: 'Aries' },
 { id: 'constellation-taurus', label: 'Taurus' },
 { id: 'constellation-gemini', label: 'Gemini' },
 { id: 'constellation-cancer', label: 'Cancer' },
 { id: 'constellation-leo', label: 'Leo' },
 { id: 'constellation-virgo', label: 'Virgo' },
 { id: 'constellation-libra', label: 'Libra' },
 { id: 'constellation-scorpius', label: 'Scorpius' },
 { id: 'constellation-sagittarius', label: 'Sagittarius' },
 { id: 'constellation-capricornus', label: 'Capricornus' },
 { id: 'constellation-aquarius', label: 'Aquarius' },
 { id: 'constellation-pisces', label: 'Pisces' }
 ]}
 ];
 }


 drawVRMenu() {
 if (!this.vrUIContext || !this.vrUICanvas) return;
 const ctx = this.vrUIContext;
 const W = this.vrUICanvas.width;   // 1400
 const H = this.vrUICanvas.height;  // 1000
 const state = this.getVRMenuState();

 // ─────────────────── layout constants ──────────────────────
 const EDGE = 26, COL_GAP = 14;
 const COLS = 4;
 const COL_W = Math.floor((W - EDGE * 2 - COL_GAP * (COLS - 1)) / COLS);
 const colX = c => EDGE + c * (COL_W + COL_GAP);
 const BTN_H = 96, ROW_GAP = 12;
 const rowY  = r => 162 + r * (BTN_H + ROW_GAP);
 const CONTENT_Y = 162;
 const FOOT_Y    = H - 88 - 108;
 const closeW    = Math.floor((W - EDGE * 2 - COL_GAP) / 2);

 this.vrButtons = [];

 // ─────────────────── btn() helper ──────────────────────────
 const btn = (label, action, x, y, w, h, opts = {}) => {
 const isActive   = opts.active   ?? false;
 const isDanger   = opts.danger   ?? false;
 const isSuccess  = opts.success  ?? false;
 const isFlashing = state.flashAction === action;

 ctx.save();

 let topCol, botCol, bdrCol, txtCol;
 if (isFlashing) {
 topCol = '#FFF176'; botCol = '#FFD600'; bdrCol = '#FF8F00'; txtCol = '#1a0e00';
 } else if (isDanger) {
 topCol = opts.bg  || '#2e0d0d'; botCol = opts.bg2 || '#1a0606';
 bdrCol = opts.border || '#882222'; txtCol = opts.text || '#FFAAAA';
 } else if (isSuccess) {
 topCol = '#0e2a0e'; botCol = '#061606';
 bdrCol = '#2a8822'; txtCol = '#AAFFAA';
 } else if (isActive) {
 topCol = '#1e5a98'; botCol = '#0d2d50';
 bdrCol = '#5BC0F5'; txtCol = '#FFFFFF';
 } else {
 topCol = opts.bg  || '#162030'; botCol = opts.bg2 || '#0c1420';
 bdrCol = opts.border || '#2a4060'; txtCol = opts.text || '#B0D4F0';
 }

 const fg = ctx.createLinearGradient(x, y, x, y + h);
 fg.addColorStop(0, topCol); fg.addColorStop(1, botCol);
 ctx.fillStyle = fg;
 ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();

 if (isActive) { ctx.shadowColor = '#4A90D9'; ctx.shadowBlur = 14; }
 ctx.strokeStyle = bdrCol;
 ctx.lineWidth = isActive ? 1.5 : 1;
 ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.stroke();
 ctx.shadowBlur = 0;

 if (opts.sublabel) {
 ctx.fillStyle = isActive ? 'rgba(255,255,255,0.6)' : 'rgba(130,170,200,0.7)';
 ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText(opts.sublabel, x + w / 2, y + h * 0.68, w - 12);
 ctx.fillStyle = txtCol;
 ctx.font = opts.font || 'bold 22px Arial';
 ctx.fillText(label, x + w / 2, y + h * 0.35, w - 12);
 } else {
 ctx.fillStyle = txtCol;
 ctx.font = opts.font || 'bold 22px Arial';
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText(label, x + w / 2, y + h / 2, w - 16);
 }

 ctx.restore();
 if (action) this.vrButtons.push({ x, y, w, h, label, action });
 };

 // ─────────────────── section label helper ──────────────────
 const sectionLabel = (text, lx, ly, lw) => {
 const m = ctx.measureText(text);
 ctx.fillStyle = '#243040';
 ctx.fillRect(lx, ly + 9, lw, 1);
 ctx.fillStyle = '#0c1828';
 ctx.fillRect(lx, ly - 2, m.width + 14, 20);
 ctx.fillStyle = '#4a7a9a';
 ctx.font = 'bold 14px Arial';
 ctx.textAlign = 'left'; ctx.textBaseline = 'top';
 ctx.fillText(text, lx, ly - 1);
 };

 // ─────────────────── background + stars ────────────────────
 const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
 bgGrad.addColorStop(0, '#060a14');
 bgGrad.addColorStop(0.5, '#08101e');
 bgGrad.addColorStop(1, '#04080f');
 ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

 // nebula accent glow
 const nebGrad = ctx.createRadialGradient(W * 0.78, H * 0.22, 0, W * 0.78, H * 0.22, W * 0.45);
 nebGrad.addColorStop(0, 'rgba(60, 20, 100, 0.12)');
 nebGrad.addColorStop(0.5, 'rgba(20, 10, 60, 0.06)');
 nebGrad.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = nebGrad; ctx.fillRect(0, 0, W, H);

 // deterministic star field (seeded LCG)
 let sr = 98273;
 const srand = () => { sr = (sr * 1103515245 + 12345) & 0x7fffffff; return sr / 0x7fffffff; };
 for (let i = 0; i < 90; i++) {
 const sx = srand() * W, sy = srand() * (H - 100) + 5;
 const sa = 0.12 + srand() * 0.55;
 const ss = 0.4 + srand() * 1.4;
 ctx.fillStyle = `rgba(180,210,255,${sa.toFixed(2)})`;
 ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2); ctx.fill();
 }

 // ─────────────────── title bar ─────────────────────────────
 const hdrGrad = ctx.createLinearGradient(0, 0, W, 0);
 hdrGrad.addColorStop(0, '#08101e'); hdrGrad.addColorStop(0.5, '#0e1e34'); hdrGrad.addColorStop(1, '#08101e');
 ctx.fillStyle = hdrGrad; ctx.fillRect(0, 0, W, 74);

 ctx.save();
 const titleGrad = ctx.createLinearGradient(W/2 - 220, 0, W/2 + 220, 0);
 titleGrad.addColorStop(0, '#8EC5FC');
 titleGrad.addColorStop(0.45, '#D0EAFF');
 titleGrad.addColorStop(0.75, '#C8B8FF');
 titleGrad.addColorStop(1, '#E0C3FC');
 ctx.fillStyle = titleGrad;
 ctx.font = 'bold 34px Arial';
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.shadowColor = '#4A90D9'; ctx.shadowBlur = 18;
 ctx.fillText('\uD83C\uDF0C Space Voyage VR', W / 2, 37);
 ctx.restore();

 // glowing title divider
 const divGrad = ctx.createLinearGradient(0, 74, W, 74);
 divGrad.addColorStop(0, 'rgba(74,144,217,0)');
 divGrad.addColorStop(0.3, 'rgba(74,144,217,0.9)');
 divGrad.addColorStop(0.7, 'rgba(123,184,245,0.9)');
 divGrad.addColorStop(1, 'rgba(74,144,217,0)');
 ctx.fillStyle = divGrad; ctx.fillRect(0, 74, W, 2);

 // ─────────────────── page tabs ─────────────────────────────
 const TABS = [
 { id: 'controls', label: '\u2699\uFE0F  Controls' },
 { id: 'navigate', label: '\uD83E\uDDED  Navigate' },
 { id: 'info',     label: '\u2139\uFE0F  Info' }
 ];
 const TW = Math.floor(W / TABS.length);
 TABS.forEach((t, i) => {
 const active = state.currentPage === t.id;
 const tabBg = active
 ? ctx.createLinearGradient(i*TW, 80, i*TW, 152)
 : ctx.createLinearGradient(i*TW, 80, i*TW, 152);
 if (active) { tabBg.addColorStop(0, '#0f2640'); tabBg.addColorStop(1, '#0a1a2e'); }
 else        { tabBg.addColorStop(0, '#080f1a'); tabBg.addColorStop(1, '#060c14'); }
 ctx.fillStyle = tabBg;
 ctx.fillRect(i * TW, 80, TW - 2, 72);

 if (active) {
 ctx.save();
 const glowGrad = ctx.createLinearGradient(i*TW, 148, (i+1)*TW-2, 148);
 glowGrad.addColorStop(0, 'rgba(74,144,217,0.2)');
 glowGrad.addColorStop(0.5, '#5BC0F5');
 glowGrad.addColorStop(1, 'rgba(74,144,217,0.2)');
 ctx.shadowColor = '#4A90D9'; ctx.shadowBlur = 8;
 ctx.fillStyle = glowGrad; ctx.fillRect(i * TW, 148, TW - 2, 4);
 ctx.restore();
 }

 ctx.fillStyle = active ? '#E8F4FF' : '#4a6a8a';
 ctx.font = active ? 'bold 26px Arial' : '24px Arial';
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText(t.label, i * TW + TW / 2, 116);
 this.vrButtons.push({ x: i * TW, y: 80, w: TW - 2, h: 68, label: t.label, action: `page:${t.id}` });
 });
 ctx.fillStyle = '#1a2a3a'; ctx.fillRect(0, 152, W, 2);

 // ─────────────────── status bar ────────────────────────────
 const stBarGrad = ctx.createLinearGradient(0, H-88, 0, H);
 stBarGrad.addColorStop(0, '#0c1520'); stBarGrad.addColorStop(1, '#080e18');
 ctx.fillStyle = stBarGrad; ctx.fillRect(0, H - 88, W, 88);
 ctx.fillStyle = '#1e3040'; ctx.fillRect(0, H - 88, W, 1);
 const msg = state.statusMessage || '\u2728 Ready';
 const msgColor = msg.includes('\u26A0') ? '#FFB347' : msg.includes('\u2714') ? '#66CC88' : '#7AAACE';
 ctx.fillStyle = msgColor;
 ctx.font = '21px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText(msg, W / 2, H - 44);

 // ─────────────────── shared footer buttons ─────────────────
 btn('\uD83D\uDEAA Close Menu', 'hide', EDGE, FOOT_Y, closeW, BTN_H);
 btn('\u274C Exit VR', 'exitvr', EDGE + closeW + COL_GAP, FOOT_Y, closeW, BTN_H, { danger: true });

 // ═══════════════════════════════════════════════════════════
 // CONTROLS PAGE
 // ═══════════════════════════════════════════════════════════
 if (state.currentPage === 'controls') {
 const spd = state.timeSpeed;
 const s0 = spd === 0, s1 = spd === 1, s10 = spd === 10, s100 = spd >= 100;

 sectionLabel('TIME SCALE', EDGE, rowY(0) - 22, W - EDGE * 2);
 btn('\u23F8 Pause', 'speed0',  colX(0), rowY(0), COL_W, BTN_H, { active: s0,   sublabel: '0\u00D7' });
 btn('\u25B6 Play',  'speed1',  colX(1), rowY(0), COL_W, BTN_H, { active: s1,   sublabel: '1\u00D7' });
 btn('\u23E9 Fast',  'speed10', colX(2), rowY(0), COL_W, BTN_H, { active: s10,  sublabel: '10\u00D7' });
 btn('\u23E9\u23E9 Max', 'speed100', colX(3), rowY(0), COL_W, BTN_H, { active: s100, sublabel: '100\u00D7' });

 sectionLabel('TOOLS', EDGE, rowY(1) - 22, W - EDGE * 2);
 btn('\uD83D\uDD04 Reset',    'reset',       colX(0), rowY(1), COL_W, BTN_H);
 btn('\uD83C\uDFB2 Discover', 'discover',    colX(1), rowY(1), COL_W, BTN_H);
 btn(state.audioEnabled ? '\uD83D\uDD0A Sound' : '\uD83D\uDD07 Sound',
 'sound', colX(2), rowY(1), COL_W, BTN_H, { active: state.audioEnabled });
 btn('\uD83C\uDFAF Lasers', 'togglelasers', colX(3), rowY(1), COL_W, BTN_H, { active: state.lasersVisible });

 sectionLabel('DISPLAY', EDGE, rowY(2) - 22, W - EDGE * 2);
 btn('\uD83E\uDE90 Orbits',       'orbits',         colX(0), rowY(2), COL_W, BTN_H, { active: state.orbitsVisible });
 btn('\uD83C\uDFF7\uFE0F Labels', 'labels',          colX(1), rowY(2), COL_W, BTN_H, { active: state.labelsVisible });
 btn('\u2B50 Stars',              'constellations',  colX(2), rowY(2), COL_W, BTN_H, { active: state.constellationsVisible });
 btn('\uD83D\uDCCF Scale',        'scale',           colX(3), rowY(2), COL_W, BTN_H, { active: state.realisticScale });
 }

 // ═══════════════════════════════════════════════════════════
 // NAVIGATE PAGE
 // ═══════════════════════════════════════════════════════════
 else if (state.currentPage === 'navigate') {
 const catalog = this.getVRNavCatalog();
 const CAT_H = 50;
 const catW  = Math.floor(W / catalog.length);

 catalog.forEach((cat, i) => {
 const active = state.currentCategory === cat.id;
 const cbg = active
 ? (() => { const g = ctx.createLinearGradient(i*catW, CONTENT_Y, i*catW, CONTENT_Y+CAT_H); g.addColorStop(0,'#12304e'); g.addColorStop(1,'#0a1e32'); return g; })()
 : (() => { const g = ctx.createLinearGradient(i*catW, CONTENT_Y, i*catW, CONTENT_Y+CAT_H); g.addColorStop(0,'#0a1220'); g.addColorStop(1,'#060c16'); return g; })();
 ctx.fillStyle = cbg;
 ctx.fillRect(i * catW, CONTENT_Y, catW - 1, CAT_H);

 if (active) {
 ctx.save();
 ctx.shadowColor = '#3A80D0'; ctx.shadowBlur = 8;
 const cbdr = ctx.createLinearGradient(i*catW, 0, (i+1)*catW, 0);
 cbdr.addColorStop(0,'rgba(74,144,217,0.3)'); cbdr.addColorStop(0.5,'#4A90D9'); cbdr.addColorStop(1,'rgba(74,144,217,0.3)');
 ctx.fillStyle = cbdr; ctx.fillRect(i * catW, CONTENT_Y + CAT_H - 3, catW - 1, 3);
 ctx.restore();
 }
 ctx.fillStyle = active ? '#D8EEFF' : '#3a5a7a';
 ctx.font = active ? 'bold 18px Arial' : '16px Arial';
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText(cat.label, i * catW + catW / 2, CONTENT_Y + CAT_H / 2);
 this.vrButtons.push({ x: i*catW, y: CONTENT_Y, w: catW-1, h: CAT_H, label: cat.label, action: `cat:${cat.id}` });
 });

 const curCat = catalog.find(c => c.id === state.currentCategory) || catalog[0];
 const items  = curCat.items;
 const PER = 16;
 const offset = state.scrollOffset || 0;
 const page = items.slice(offset, offset + PER);
 const ITEM_H = 72, ITEM_GAP = 8;
 const GRID_Y = CONTENT_Y + CAT_H + 10;
 const ITEM_W = Math.floor((W - EDGE * 2 - COL_GAP * (COLS - 1)) / COLS);

 page.forEach((item, idx) => {
 const col = idx % COLS, row = Math.floor(idx / COLS);
 const ix = EDGE + col * (ITEM_W + COL_GAP);
 const iy = GRID_Y + row * (ITEM_H + ITEM_GAP);
 btn(item.label, `navigate-to:${item.id}`, ix, iy, ITEM_W, ITEM_H, { font: 'bold 19px Arial' });
 });

 const totalPages = Math.ceil(items.length / PER);
 const curPage = Math.floor(offset / PER) + 1;
 const PAG_Y = GRID_Y + 4 * (ITEM_H + ITEM_GAP) + 8;
 const pAgW  = Math.floor((W - EDGE*2 - COL_GAP*2) / 3);
 const pMidW = W - EDGE*2 - pAgW*2 - COL_GAP*2;

 if (offset > 0) btn('\u25C4 Prev', 'scroll:prev', EDGE, PAG_Y, pAgW, BTN_H);
 ctx.fillStyle = '#4a7090'; ctx.font = '20px Arial';
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText(`${curPage} / ${totalPages}`, EDGE + pAgW + COL_GAP + pMidW/2, PAG_Y + BTN_H/2);
 if (offset + PER < items.length) btn('Next \u25BA', 'scroll:next', EDGE + pAgW + COL_GAP + pMidW + COL_GAP, PAG_Y, pAgW, BTN_H);
 }

 // ═══════════════════════════════════════════════════════════
 // INFO PAGE
 // ═══════════════════════════════════════════════════════════
 else if (state.currentPage === 'info') {
 const info = state.lastObjectInfo;

 if (info) {
 // helper: type → accent colors + icon
 const typeStyle = (t) => {
 const tl = (t || '').toLowerCase();
 if (tl.includes('star')) return { icon: '\u2B50', accent: '#FFD700', dim:'#3d2e00', badge:'#2a1e00' };
 if (tl.includes('gas'))  return { icon: '\uD83E\uDE90', accent: '#88AAEE', dim:'#1a1e40', badge:'#0e1428' };
 if (tl.includes('moon')) return { icon: '\uD83C\uDF19', accent: '#AAAACC', dim:'#1e1e30', badge:'#12121e' };
 if (tl.includes('planet')) return { icon: '\uD83C\uDF0D', accent: '#44CC88', dim:'#0e2a1a', badge:'#081a10' };
 if (tl.includes('dwarf')) return { icon: '\uD83D\uDD34', accent: '#CC8844', dim:'#2a1a0a', badge:'#1a1006' };
 if (tl.includes('comet') || tl.includes('comet')) return { icon: '\u2604\uFE0F', accent: '#88CCFF', dim:'#0a2030', badge:'#061520' };
 if (tl.includes('nebula')) return { icon: '\uD83C\uDF0B', accent: '#CC88FF', dim:'#1e0a30', badge:'#120620' };
 if (tl.includes('galaxy')) return { icon: '\uD83C\uDF00', accent: '#FF88CC', dim:'#2a0a1a', badge:'#1a0610' };
 if (tl.includes('constellation')) return { icon: '\u2728', accent: '#FFCC88', dim:'#2a1e00', badge:'#1a1200' };
 if (tl.includes('spacecraft') || tl.includes('station')) return { icon: '\uD83D\uDEF8', accent: '#80CCFF', dim:'#0a1e30', badge:'#061220' };
 return { icon: '\u2022', accent: '#70B0E0', dim:'#0a1a2a', badge:'#060e1a' };
 };

 const ts = typeStyle(info.type);

 // ── glowing object name ──────────────────────────
 const NAME_Y = CONTENT_Y + 56;
 ctx.save();
 const nameGlow = ctx.createRadialGradient(W/2, NAME_Y, 0, W/2, NAME_Y, 300);
 nameGlow.addColorStop(0, `rgba(${ts.accent === '#FFD700' ? '200,150,0' : '30,80,160'},0.18)`);
 nameGlow.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = nameGlow; ctx.fillRect(0, NAME_Y - 60, W, 120);

 const nameGrad = ctx.createLinearGradient(W/2 - 250, 0, W/2 + 250, 0);
 nameGrad.addColorStop(0, ts.accent);
 nameGrad.addColorStop(0.5, '#FFFFFF');
 nameGrad.addColorStop(1, ts.accent);
 ctx.fillStyle = nameGrad;
 ctx.font = 'bold 46px Arial';
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.shadowColor = ts.accent; ctx.shadowBlur = 22;
 ctx.fillText(info.name || 'Unknown Object', W / 2, NAME_Y, W - EDGE*2);
 ctx.restore();

 // ── type badge ───────────────────────────────────
 const BADGE_Y = NAME_Y + 46;
 const typeLabel = (info.type || 'Celestial Object').toUpperCase();
 ctx.font = 'bold 17px Arial';
 const tw = ctx.measureText(ts.icon + '  ' + typeLabel).width + 28;
 const bx = W/2 - tw/2;
 ctx.fillStyle = ts.badge;
 ctx.beginPath(); ctx.roundRect(bx, BADGE_Y, tw, 28, 14); ctx.fill();
 ctx.strokeStyle = ts.accent + '88';
 ctx.lineWidth = 1;
 ctx.beginPath(); ctx.roundRect(bx, BADGE_Y, tw, 28, 14); ctx.stroke();
 ctx.fillStyle = ts.accent;
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText(ts.icon + '  ' + typeLabel, W/2, BADGE_Y + 14);

 // ── stat tiles ───────────────────────────────────
 const STAT_Y = BADGE_Y + 44;
 const STAT_H = 84;
 const statW  = Math.floor((W - EDGE*2 - COL_GAP*2) / 3);
 const stats  = [
 { lbl: 'DISTANCE',  val: info.distance != null
 ? (info.distance.toFixed ? info.distance.toFixed(2) + ' AU' : info.distance + ' AU')
 : '—',
 icon: '\uD83D\uDD2D' },
 { lbl: 'DIAMETER',  val: info.size != null
 ? (info.size.toFixed ? Math.round(info.size).toLocaleString() + ' km' : info.size + ' km')
 : '—',
 icon: '\uD83D\uDCCF' },
 { lbl: 'PERIOD',    val: info.orbitalPeriod != null
 ? (info.orbitalPeriod < 5 ? info.orbitalPeriod.toFixed(2) + ' yrs' : Math.round(info.orbitalPeriod) + ' yrs')
 : (info.rotationPeriod != null ? info.rotationPeriod.toFixed(1) + ' hrs rot' : '—'),
 icon: '\u23F3' }
 ];

 stats.forEach((st, i) => {
 const sx = EDGE + i * (statW + COL_GAP);
 const sg = ctx.createLinearGradient(sx, STAT_Y, sx, STAT_Y + STAT_H);
 sg.addColorStop(0, '#10202e'); sg.addColorStop(1, '#081420');
 ctx.fillStyle = sg;
 ctx.beginPath(); ctx.roundRect(sx, STAT_Y, statW, STAT_H, 10); ctx.fill();
 ctx.strokeStyle = '#1e3a54'; ctx.lineWidth = 1;
 ctx.beginPath(); ctx.roundRect(sx, STAT_Y, statW, STAT_H, 10); ctx.stroke();

 ctx.fillStyle = '#4a7090';
 ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
 ctx.fillText(st.icon + ' ' + st.lbl, sx + statW/2, STAT_Y + 10);

 ctx.fillStyle = '#C8E8FF';
 ctx.font = 'bold 22px Arial'; ctx.textBaseline = 'middle';
 ctx.fillText(st.val, sx + statW/2, STAT_Y + STAT_H - 28, statW - 12);
 });

 // ── description ──────────────────────────────────
 const DESC_Y  = STAT_Y + STAT_H + 18;
 const DESC_H  = FOOT_Y - DESC_Y - 12;
 const desc = info.description || 'No description available.';

 const descBg = ctx.createLinearGradient(EDGE, DESC_Y, EDGE, DESC_Y + DESC_H);
 descBg.addColorStop(0, '#0c1e30'); descBg.addColorStop(1, '#080f1e');
 ctx.fillStyle = descBg;
 ctx.beginPath(); ctx.roundRect(EDGE, DESC_Y, W - EDGE*2, DESC_H, 12); ctx.fill();
 ctx.strokeStyle = '#1e3a54'; ctx.lineWidth = 1;
 ctx.beginPath(); ctx.roundRect(EDGE, DESC_Y, W - EDGE*2, DESC_H, 12); ctx.stroke();

 // left accent bar
 ctx.save();
 const accentBar = ctx.createLinearGradient(EDGE, DESC_Y, EDGE, DESC_Y + DESC_H);
 accentBar.addColorStop(0, ts.accent); accentBar.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = accentBar; ctx.fillRect(EDGE + 1, DESC_Y + 1, 3, DESC_H - 2);
 ctx.restore();

 ctx.fillStyle = '#8ab8d8';
 ctx.font = '20px Arial';
 ctx.textAlign = 'left'; ctx.textBaseline = 'top';
 const words = desc.split(' ');
 let line = '', lineY = DESC_Y + 16;
 const maxW = W - EDGE*2 - 28;
 for (const word of words) {
 const test = line ? line + ' ' + word : word;
 if (ctx.measureText(test).width > maxW && line) {
 if (lineY + 24 < DESC_Y + DESC_H - 10) ctx.fillText(line, EDGE + 16, lineY);
 line = word; lineY += 26;
 } else { line = test; }
 }
 if (line && lineY + 24 < DESC_Y + DESC_H - 10) ctx.fillText(line, EDGE + 16, lineY);

 } else {
 // No info – placeholder with gentle animation hint
 const cx = W/2, cy = CONTENT_Y + 260;
 const phGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160);
 phGlow.addColorStop(0, 'rgba(60,120,200,0.12)'); phGlow.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = phGlow; ctx.fillRect(cx-200, cy-80, 400, 160);

 ctx.fillStyle = '#2a4860';
 ctx.font = '58px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillText('\uD83D\uDD2D', cx, cy - 40);

 ctx.fillStyle = '#3a6080';
 ctx.font = 'bold 28px Arial';
 ctx.fillText('Point & select an object', cx, cy + 30);
 ctx.fillStyle = '#2a4860';
 ctx.font = '22px Arial';
 ctx.fillText('in space to see its details here', cx, cy + 66);
 }

 // Info page footer – replace with Navigate / Controls
 this.vrButtons = this.vrButtons.filter(b => b.action !== 'hide' && b.action !== 'exitvr');
 btn('\uD83E\uDDED Navigate', 'page:navigate', EDGE, FOOT_Y, closeW, BTN_H, { success: true });
 btn('\u2699\uFE0F Controls',  'page:controls', EDGE + closeW + COL_GAP, FOOT_Y, closeW, BTN_H);
 }

 // ─────────────────── flush texture ─────────────────────────
 if (this.vrUIPanel?.material?.map) {
 this.vrUIPanel.material.map.needsUpdate = true;
 }
 }


 focusVRTarget(targetId) {
 const app = window.app || this;
 const module = app.solarSystemModule;
 if (!module) return false;

 let target = this.vrQuickNavMap?.get(targetId);
 if (!target && typeof module.getQuickNavTargets === 'function') {
 const fallback = module.getQuickNavTargets().find(item => item.id === targetId);
 target = fallback?.object;
 }

 if (!target) {
 this.updateVRStatus('⚠️ Target not available: ' + targetId);
 return false;
 }

 module.focusOnObject(target, this.camera, this.controls);

 const info = typeof module.getObjectInfo === 'function' ? module.getObjectInfo(target) : null;
 if (info) {
 this.vrLastObjectInfo = info;
 app.uiManager?.updateInfoPanel(info);
 if (this.vrNavState) this.vrNavState.currentPage = 'info';
 }

 app.uiManager?.setQuickNavValue?.(targetId);
 const name = target.userData?.name || 'Object';
 this.updateVRStatus('✔ Selected: ' + name);
 this.requestVRMenuRefresh();
 return true;
 }

 navigateVRTarget(value) {
 const app = window.app || this;
 if (!app || typeof app.findObjectByNavigationValue !== 'function') {
 // fallback: try focusVRTarget
 this.focusVRTarget(value);
 return;
 }
 const target = app.findObjectByNavigationValue(value);
 if (!target) {
 this.updateVRStatus('⚠️ Not found: ' + value);
 return;
 }
 const module = app.solarSystemModule;
 if (module?.focusOnObject) module.focusOnObject(target, this.camera, this.controls);
 const info = typeof module?.getObjectInfo === 'function' ? module.getObjectInfo(target) : null;
 if (info) {
 this.vrLastObjectInfo = info;
 app.uiManager?.updateInfoPanel(info);
 }
 if (this.vrNavState) this.vrNavState.currentPage = 'info';
 const name = target.userData?.name || value;
 this.updateVRStatus('✔ → ' + name);
 this.requestVRMenuRefresh();
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
 
 // Setup raycaster for pointing (reuse pre-allocated objects)
 this._vrTempMatrix.identity().extractRotation(controller.matrixWorld);
 
 this._vrRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
 this._vrRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._vrTempMatrix);
 
 // Use local reference for readability
 const raycaster = this._vrRaycaster;
 
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
 if (DEBUG.VR) console.log(`[VR] UI clicked at (${Math.round(x)}, ${Math.round(y)})`);
 
 // Check which button was clicked
 let buttonFound = false;
 this.vrButtons.forEach(btn => {
 if (x >= btn.x && x <= btn.x + btn.w && 
 y >= btn.y && y <= btn.y + btn.h) {
 if (DEBUG.VR) console.log(`[VR] Button clicked: "${btn.label}" - Action: ${btn.action}`);
 this.handleVRAction(btn.action);
 this.flashVRButton(btn);
 this.triggerVRHaptic(index, 0.4, 60); // Light haptic click
 buttonFound = true;
 }
 });
 
 if (DEBUG.VR && !buttonFound) {
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
 // Fetch object info for display
 const infoForPanel = typeof module.getObjectInfo === 'function' ? module.getObjectInfo(hitObject) : null;
 const objName = hitObject.userData?.name || hitObject.name || 'Object';

 // If grip+trigger held, zoom VERY close for inspection
 if (gripHeld) {
 this.zoomToObject(hitObject, 'close');
 if (DEBUG.VR) console.log('[VR] Zooming to:', hitObject.name);
 if (infoForPanel) {
 this.vrLastObjectInfo = infoForPanel;
 app.uiManager?.updateInfoPanel(infoForPanel);
 if (this.vrNavState) this.vrNavState.currentPage = 'info';
 }
 if (this.vrUIPanel) {
 this.vrUIPanel.visible = true;
 this.updateVRStatus('\uD83D\uDD0D Inspecting: ' + objName);
 }
 this.requestVRMenuRefresh();
 this.triggerVRHaptic(index, 0.8, 100); // Stronger pulse for close zoom
 } else {
 // Normal focus – focus camera and show info page
 module.focusOnObject(hitObject, this.camera, this.controls);
 if (DEBUG.VR) console.log('[VR] Focused on:', hitObject.name);
 if (infoForPanel) {
 this.vrLastObjectInfo = infoForPanel;
 app.uiManager?.updateInfoPanel(infoForPanel);
 if (this.vrNavState) this.vrNavState.currentPage = 'info';
 }
 if (this.vrUIPanel) {
 this.vrUIPanel.visible = true;
 this.updateVRStatus('\u2714\uFE0F ' + objName);
 }
 this.requestVRMenuRefresh();
 this.triggerVRHaptic(index, 0.6, 80); // Medium pulse for selection
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
 // LEFT GRIP: Start grab-to-rotate mode
 const handedness = controller.userData?.handedness || 
 (index === 0 ? 'left' : 'right');
 
 if (handedness === 'left' && !this.grabRotateState.active) {
 // Start grab-to-rotate with left controller
 this.grabRotateState.active = true;
 this.grabRotateState.controllerIndex = index;
 
 // Store starting position and rotation
 controller.getWorldPosition(this.grabRotateState.startPosition);
 this.grabRotateState.startDollyRotation.copy(this.dolly.rotation);
 this.grabRotateState.lastPosition.copy(this.grabRotateState.startPosition);
 
 this.triggerVRHaptic(index, 0.5, 80); // Confirm grab start
 if (DEBUG.VR) console.log('🤚 [VR] Grab-to-rotate STARTED (LEFT GRIP)');
 this.updateVRStatus('🤚 Grab & Move to Rotate View');
 }
 }
 
 onSqueezeEnd(controller, index) {
 // Grip released - End grab-to-rotate
 if (this.grabRotateState.active && this.grabRotateState.controllerIndex === index) {
 this.grabRotateState.active = false;
 this.grabRotateState.controllerIndex = -1;
 
 if (DEBUG.VR) console.log('✋ [VR] Grab-to-rotate ENDED');
 this.updateVRStatus('✨ Ready for interaction');
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
 } else if (object.geometry) {
 object.geometry.computeBoundingSphere();
 if (object.geometry.boundingSphere) {
 objectRadius = object.geometry.boundingSphere.radius;
 }
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
 if (DEBUG.VR) console.log(`[VR] Zoomed to ${object.userData?.name || 'object'} at distance ${distance.toFixed(2)}`);
 }
 
 handleVRAction(action) {
 if (DEBUG.VR) console.log('[VR] Action: "' + action + '"');

 const app = window.app || this;
 if (!app || !action) return;

 const scheduleRefresh = (delay = 0) => {
 if (delay > 0) setTimeout(() => this.requestVRMenuRefresh(), delay);
 else this.requestVRMenuRefresh();
 };

 // ── page switching ────────────────────────────────────────
 if (action.startsWith('page:')) {
 const page = action.split(':')[1];
 if (this.vrNavState) this.vrNavState.currentPage = page;
 scheduleRefresh(); return;
 }

 // ── category switch ───────────────────────────────────────
 if (action.startsWith('cat:')) {
 const cat = action.split(':')[1];
 if (this.vrNavState) { this.vrNavState.currentCategory = cat; this.vrNavState.scrollOffset = 0; }
 scheduleRefresh(); return;
 }

 // ── direct navigation ─────────────────────────────────────
 if (action.startsWith('navigate-to:')) {
 this.navigateVRTarget(action.slice(12)); return;
 }

 // ── pagination ────────────────────────────────────────────
 if (action.startsWith('scroll:')) {
 const dir = action.split(':')[1];
 const ns  = this.vrNavState;
 if (ns) {
 const catalog = this.getVRNavCatalog();
 const curCat  = catalog.find(c => c.id === ns.currentCategory) || catalog[0];
 const total   = curCat?.items?.length || 0;
 const PER     = 16;
 if (dir === 'next') ns.scrollOffset = Math.min(ns.scrollOffset + PER, Math.max(0, total - PER));
 else                ns.scrollOffset = Math.max(0, ns.scrollOffset - PER);
 }
 scheduleRefresh(); return;
 }

 // ── legacy focus: prefix ──────────────────────────────────
 if (action.startsWith('focus:')) {
 const targetId = action.split(':')[1];
 if (targetId) this.focusVRTarget(targetId);
 return;
 }

 // ── legacy nav: prefix ────────────────────────────────────
 if (action.startsWith('nav:')) {
 const sub = action.split(':')[1];
 if (sub === 'back') {
 if (this.vrNavState) this.vrNavState.currentPage = 'navigate';
 } else {
 if (this.vrNavState) { this.vrNavState.currentPage = 'navigate'; this.vrNavState.currentCategory = sub; }
 }
 scheduleRefresh(); return;
 }

 switch (action) {
 case 'speed0':
 app.timeSpeed = 0;
 this.updateVRStatus('⏸ Paused');
 scheduleRefresh(); break;

 case 'speed1':
 app.timeSpeed = 1;
 this.updateVRStatus('▶ Real Time (1×)');
 scheduleRefresh(); break;

 case 'speed10':
 app.timeSpeed = 10;
 this.updateVRStatus('⏩ Fast (10×)');
 scheduleRefresh(); break;

 case 'speed100':
 app.timeSpeed = 100;
 this.updateVRStatus('⏩⏩ Max Speed (100×)');
 scheduleRefresh(); break;

 case 'orbits':
 document.getElementById('toggle-orbits')?.click();
 this.updateVRStatus('🪐 Orbits toggled');
 scheduleRefresh(120); break;

 case 'labels':
 document.getElementById('toggle-details')?.click();
 this.updateVRStatus('🏷️ Labels toggled');
 scheduleRefresh(120); break;

 case 'constellations':
 document.getElementById('toggle-constellations')?.click();
 this.updateVRStatus('⭐ Stars/Constellations toggled');
 scheduleRefresh(120); break;

 case 'scale':
 document.getElementById('toggle-scale')?.click();
 this.updateVRStatus('📏 Scale mode switched');
 scheduleRefresh(120); break;

 case 'sound': {
 const am = window.audioManager;
 if (am) {
 am.enabled = !am.enabled;
 try { localStorage.setItem('space_voyage_sound', am.enabled ? 'true' : 'false'); } catch(_) {}
 this.updateVRStatus(am.enabled ? '🔊 Sound ON' : '🔇 Sound OFF');
 } else {
 this.updateVRStatus('⚠️ Audio not available');
 }
 scheduleRefresh(); break;
 }

 case 'discover': {
 const pool = ['sun','mercury','venus','earth','moon','mars','jupiter','saturn',
 'uranus','neptune','pluto','io','europa','titan','enceladus',
 'triton','ganymede','callisto','ceres','eris','haumea'];
 this.navigateVRTarget(pool[Math.floor(Math.random() * pool.length)]);
 break;
 }

 case 'togglelasers':
 this.lasersVisible = !this.lasersVisible;
 this.controllers.forEach(ctrl => {
 const laser = ctrl.getObjectByName('laser');
 const pointer = ctrl.getObjectByName('pointer');
 const cone = ctrl.getObjectByName('cone');
 if (laser)   laser.visible   = this.lasersVisible;
 if (pointer) pointer.visible = this.lasersVisible;
 if (cone)    cone.visible    = this.lasersVisible;
 });
 this.updateVRStatus('🎯 Lasers ' + (this.lasersVisible ? 'ON' : 'OFF'));
 scheduleRefresh(); break;

 case 'reset':
 this.resetCamera();
 if (app.solarSystemModule) app.solarSystemModule.focusedObject = null;
 this.vrLastObjectInfo = null;
 this.updateVRStatus('🔄 View reset');
 scheduleRefresh(); break;

 case 'earth':
 this.navigateVRTarget('earth'); break;

 case 'hide':
 if (this.vrUIPanel) this.vrUIPanel.visible = false;
 this.updateVRStatus('🚪 Menu closed'); break;

 case 'exitvr':
 if (this.renderer.xr.isPresenting) {
 const session = this.renderer.xr.getSession();
 session?.end().catch(err => console.error('[VR] Error ending session:', err));
 } break;

 default:
 if (DEBUG.VR) console.warn('[VR] Unknown action: "' + action + '"');
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

 /**
 * Trigger haptic vibration on the specified controller.
 * @param {number} controllerIndex - 0 or 1
 * @param {number} intensity - 0.0 (off) to 1.0 (max)
 * @param {number} durationMs - vibration time in milliseconds
 */
 triggerVRHaptic(controllerIndex, intensity = 0.5, durationMs = 60) {
 try {
 const session = this.renderer?.xr?.getSession();
 if (!session) return;
 let srcIndex = 0;
 for (const inputSource of session.inputSources) {
 if (srcIndex === controllerIndex) {
 const actuators = inputSource.gamepad?.hapticActuators;
 if (actuators && actuators.length > 0) {
 actuators[0].pulse(intensity, durationMs);
 }
 break;
 }
 srcIndex++;
 }
 } catch (e) {
 // Haptics are optional; swallow errors silently
 }
 }

 updateLaserPointers() {
 // Skip entirely when lasers are hidden — avoids expensive per-frame raycasting
 if (!this.renderer.xr.isPresenting || !this.controllers || !this.lasersVisible) return;
 
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

 // Limit raycast range to cover solar system scene (ignores distant background stars)
 const prevFar = this._vrRaycaster.far;
 this._vrRaycaster.far = 2000;
 const LASER_DEFAULT_LENGTH = 10; // visual length of the laser beam in meters

 this.controllers.forEach((controller, index) => {
 const laser = controller.getObjectByName('laser');
 const pointer = controller.getObjectByName('pointer');
 const cone = controller.getObjectByName('cone');
 
 if (!laser || !laser.visible) return;
 
 // Setup raycaster (reuse pre-allocated objects)
 this._vrTempMatrix.identity().extractRotation(controller.matrixWorld);
 
 this._vrRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
 this._vrRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._vrTempMatrix);
 
 // Use local reference for readability
 const raycaster = this._vrRaycaster;
 
 // Check what we're pointing at (deep traversal, limited to 2000 units)
 const intersects = raycaster.intersectObjects(this.scene.children, true);
 
 const hasHit = intersects.length > 0;
 // Visual laser length — clamped to default max so the beam stays short even for distant objects
 const hitDist = hasHit ? intersects[0].distance : LASER_DEFAULT_LENGTH;
 const visualDist = Math.min(hitDist, LASER_DEFAULT_LENGTH);
 
 // Change color based on sprint mode and whether anything is hit (at any distance)
 if (sprintActive) {
 // SPRINT MODE - ORANGE/RED laser
 laser.material.color.setHex(0xff6600);
 if (pointer) pointer.material.color.setHex(0xff6600);
 if (cone) cone.material.color.setHex(0xff6600);
 } else if (hasHit) {
 // Pointing at something (near or far) - GREEN
 laser.material.color.setHex(0x00ff00);
 if (pointer) pointer.material.color.setHex(0x00ff00);
 if (cone) cone.material.color.setHex(0x00ff00);
 } else {
 // Not pointing at anything - CYAN
 laser.material.color.setHex(0x00ffff);
 if (pointer) pointer.material.color.setHex(0x00ffff);
 if (cone) cone.material.color.setHex(0x00ffff);
 }
 
 // Dynamic laser length: scale cylinder to reach exactly the hit point (or default)
 // Cylinder Y-axis maps to -Z (forward) due to rotation.x = PI/2 applied at creation
 laser.scale.y = visualDist / LASER_DEFAULT_LENGTH;
 laser.position.z = -(visualDist / 2);
 
 // Move pointer dot to hit point
 if (pointer) pointer.position.set(0, 0, -visualDist);
 });

 // Restore raycaster far to default so other code is unaffected
 this._vrRaycaster.far = prevFar;
 }
 
 updateXRMovement() {
 // Only update in VR/AR mode
 if (!this.renderer.xr.isPresenting) return;
 
 // Ensure dolly exists
 if (!this.dolly) {
 console.warn('⚠️ Dolly not found!');
 return;
 }
 
 // Grab-to-rotate removed - Left GRIP is now dedicated to menu toggle
 // Use right thumbstick X-axis for turning instead
 
 // Get controller inputs for movement
 const session = this.renderer.xr.getSession();
 if (!session) return;
 
 const inputSources = session.inputSources;
 
 // FIX: Use CAMERA (HMD) direction for consistent movement, not dolly
 // This ensures "forward" always means "where you're looking"
 // even after grab-rotating the world
 const xrCamera = this.renderer.xr.getCamera();
 
 // Get camera's forward direction (where user is looking) - reuse pre-allocated vectors
 const cameraForward = this._vrCameraForward;
 xrCamera.getWorldDirection(cameraForward);
 cameraForward.y = 0; // Keep horizontal (no flying up/down when looking up/down)
 
 // Safety check: if looking straight up/down, use a default forward
 if (cameraForward.length() < 0.1) {
 cameraForward.set(0, 0, -1); // Default forward
 }
 cameraForward.normalize();
 
 // Get camera's right direction (perpendicular to forward) - reuse pre-allocated vectors
 const cameraRight = this._vrCameraRight;
 cameraRight.crossVectors(cameraForward, this._vrUpVector);
 
 // Safety check: if cross product is zero, use default right
 if (cameraRight.length() < 0.1) {
 cameraRight.set(1, 0, 0); // Default right
 }
 cameraRight.normalize();
 
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
 // X BUTTON (Button 4 on LEFT controller) - TOGGLE VR MENU
 // ============================================
 if (handedness === 'left' && gamepad.buttons[4]) {
 const xButton = gamepad.buttons[4];
 if (xButton.pressed) {
 // Check if this is a new press (not held from previous frame)
 const prevState = this.previousButtonStates[i][4] || false;
 if (!prevState) {
 // NEW PRESS - Toggle VR menu
 if (!this.vrUIPanel) {
 console.warn('⚠️ VR UI Panel not initialized!');
 } else {
 this.vrUIPanel.visible = !this.vrUIPanel.visible;
 
 // Position panel in front of user when showing
 if (this.vrUIPanel.visible) {
 this.vrUIPanel.position.set(0, 1.6, -2.5);
 this.vrUIPanel.rotation.set(0, 0, 0);
 
 // Always force lasers ON when menu opens
 this.lasersVisible = true;
 this.controllers.forEach(ctrl => {
 const laser = ctrl.getObjectByName('laser');
 const pointer = ctrl.getObjectByName('pointer');
 if (laser) laser.visible = true;
 if (pointer) pointer.visible = true;
 });
 
 if (DEBUG.VR) console.log('📋 [VR] Menu TOGGLED (X button)');
 this.updateVRStatus(this.vrUIPanel.visible ? 
 '📋 VR Menu Active' : '✨ Ready for interaction');
 this.requestVRMenuRefresh();
 }
 }
 }
 this.previousButtonStates[i][4] = true;
 } else {
 this.previousButtonStates[i][4] = false;
 }
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
 this.updateVRStatus('â¸ Paused');
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
 
 // Forward/Backward & Strafe (only if NOT grab-rotating)
 if (!this.grabRotateState.active && 
 (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone)) {
 // FORWARD/BACKWARD: Push stick FORWARD to move where you're LOOKING
 // Most VR controllers: forward = negative Y, backward = positive Y
 // We want: forward stick → move forward → add to position
 // So we negate: -(-1) = +1 for forward movement
 this.dolly.position.add(cameraForward.clone().multiplyScalar(-stickY * baseSpeed));
 
 // STRAFE LEFT/RIGHT: Use camera's right direction
 // Right stick = positive X, left stick = negative X
 this.dolly.position.add(cameraRight.clone().multiplyScalar(stickX * baseSpeed));
 }
 
 // UP/DOWN with Y button (X button now used for menu)
 if (gamepad.buttons[5] && gamepad.buttons[5].pressed) {
 // Y button: Toggle between UP/DOWN based on thumbstick Y
 if (Math.abs(stickY) > deadzone) {
 // Use thumbstick Y to control up/down when Y is held
 this.dolly.position.y += -stickY * baseSpeed * 0.8;
 } else {
 // Default: Y button moves UP
 this.dolly.position.y += baseSpeed * 0.8;
 }
 }
 }
 
 // ============================================
 // RIGHT CONTROLLER: TURN & VERTICAL
 // ============================================
 if (handedness === 'right') {
 const turnSpeed = 0.03;
 const vertSpeed = 0.25 * sprintMultiplier;
 
 // TURN LEFT/RIGHT (only if NOT grab-rotating)
 if (!this.grabRotateState.active && Math.abs(stickX) > deadzone) {
 this.dolly.rotation.y -= stickX * turnSpeed;
 }
 
 // VERTICAL MOVEMENT (Up/Down in world space)
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
 
 // ============================================
 // GRAB-TO-ROTATE UPDATE (Active when LEFT GRIP held)
 // ============================================
 if (this.grabRotateState.active) {
 const controller = this.controllers[this.grabRotateState.controllerIndex];
 if (controller) {
 // Reuse pre-allocated vectors — no heap allocation on the hot path
 const currentPosition = this._vrTempPosition;
 controller.getWorldPosition(currentPosition);
 
 // Calculate movement delta using pre-allocated vector
 const delta = this._vrGrabDelta.subVectors(
 currentPosition, 
 this.grabRotateState.lastPosition
 );
 
 // Convert controller movement to rotation
 // Horizontal movement (X) → Yaw rotation (Y-axis)
 // Vertical movement (Y) → Pitch rotation (X-axis) 
 const rotationSensitivity = 2.5;
 this.dolly.rotation.y -= delta.x * rotationSensitivity;
 this.dolly.rotation.x -= delta.y * rotationSensitivity;
 
 // Clamp X rotation to prevent flipping upside down
 const maxPitch = Math.PI / 3; // 60 degrees
 this.dolly.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.dolly.rotation.x));
 
 // Update last position for next frame
 this.grabRotateState.lastPosition.copy(currentPosition);
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
 const lightObjects = new Set(Object.values(this.lights));
 
 this.scene.traverse((object) => {
 // Skip scene root, camera, dolly (VR rig), and lights
 if (object === this.scene || object === this.camera || 
 object === this.dolly || lightObjects.has(object)) {
 return;
 }
 objectsToRemove.push(object);
 });

 objectsToRemove.forEach(object => {
 if (object.geometry) object.geometry.dispose();
 if (object.material) {
 const materials = Array.isArray(object.material) ? object.material : [object.material];
 materials.forEach(mat => {
 // Dispose all texture maps to free GPU memory
 if (mat.map) mat.map.dispose();
 if (mat.normalMap) mat.normalMap.dispose();
 if (mat.bumpMap) mat.bumpMap.dispose();
 if (mat.emissiveMap) mat.emissiveMap.dispose();
 if (mat.specularMap) mat.specularMap.dispose();
 if (mat.roughnessMap) mat.roughnessMap.dispose();
 if (mat.metalnessMap) mat.metalnessMap.dispose();
 mat.dispose();
 });
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
 let frameCount = 0;
 this.renderer.setAnimationLoop(() => {
 try {
 // Skip OrbitControls while XR is presenting - the XR session owns the
 // camera pose; running controls.update() would fight the headset tracking.
 if (!this.renderer.xr.isPresenting) {
 this.controls.update();
 }
 callback();
 this.renderer.render(this.scene, this.camera);
 if (this.labelRenderer) {
 this.labelRenderer.render(this.scene, this.camera);
 }
 
 // Debug first frame
 if (frameCount === 0 && DEBUG.enabled) {
 console.log(`[Scene] First frame: ${this.scene.children.length} children, canvas ${this.renderer.domElement.width}×${this.renderer.domElement.height}`);
 }
 frameCount++;
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
 
 // Clear any pending VR flash timeout
 if (this.vrFlashTimeout) {
 clearTimeout(this.vrFlashTimeout);
 this.vrFlashTimeout = null;
 }
 
 // End active XR session
 if (this.renderer?.xr?.isPresenting) {
 this.renderer.xr.getSession()?.end().catch(() => {});
 }
 
 // Dispose label renderer
 if (this.labelRenderer?.domElement?.parentNode) {
 this.labelRenderer.domElement.parentNode.removeChild(this.labelRenderer.domElement);
 }
 
 if (this.renderer) {
 this.renderer.dispose();
 if (this.renderer.domElement?.parentNode) {
 this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
 }
 }
 if (this.controls) {
 this.controls.dispose();
 }
 
 // Clear resize timeout
 if (this.resizeTimeout) {
 clearTimeout(this.resizeTimeout);
 }
 }
}

