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
 // Ensure canvas has proper styling
 this.renderer.domElement.style.display = 'block';
 this.renderer.domElement.style.width = '100%';
 this.renderer.domElement.style.height = '100%';
 
 container.appendChild(this.renderer.domElement);
 console.log('✅ Canvas added to DOM');
 console.log('📐 Canvas size:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
 console.log('📦 Container:', container.id);
 console.log('🎨 Renderer output:', this.renderer.outputColorSpace);
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
 if (DEBUG.enabled) console.log('[Lighting] Ambient lighting enhanced');
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
 // Position dolly for good initial view (updated for new educational scale)
 this.dolly.position.set(0, 100, 200);
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
 constellationsVisible: module?.constellationsVisible ?? true,
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
 label: state.timeSpeed === 0 ? 'â¸ Paused' : 'â¸ Pause',
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
 label: state.constellationsVisible ? ' Constellations ON' : ' Constellations OFF',
 action: 'constellations',
 baseColor: '#FFB900',
 active: state.constellationsVisible
 });

 drawButton({
 col: 3,
 row: 1,
 label: state.realisticScale ? ' Realistic' : ' Educational',
 action: 'scale',
 baseColor: '#FF8C00',
 active: state.realisticScale
 });

 this.vrQuickNavMap.set('earth', module?.planets?.earth || null);

 drawButton({
 col: 0,
 row: 2,
 label: ' Focus Earth',
 action: 'focus:earth',
 baseColor: '#10893E',
 active: earthName ? state.focusedObject?.userData?.name === earthName : false
 });

 const quickTargets = this.getVRQuickNavTargets().slice(0, 7);

 quickTargets.forEach((target, index) => {
 const adjustedIndex = index + 1; // Account for Earth button at row 2, col 0
 const row = 2 + Math.floor(adjustedIndex / columns);
 const col = adjustedIndex % columns;
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

 const extraRow = 2 + Math.ceil((quickTargets.length + 1) / columns);

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
 this.updateVRStatus('â¸ Paused');
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

 case 'constellations':
 document.getElementById('toggle-constellations')?.click();
 this.updateVRStatus(' Constellations toggled');
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
 let frameCount = 0;
 this.renderer.setAnimationLoop(() => {
 try {
 this.controls.update();
 callback();
 this.renderer.render(this.scene, this.camera);
 if (this.labelRenderer) {
 this.labelRenderer.render(this.scene, this.camera);
 }
 
 // Debug first frame
 if (frameCount === 0) {
 console.log('🎬 First frame rendered!');
 console.log('📊 Scene children:', this.scene.children.length);
 console.log('📷 Camera position:', this.camera.position);
 console.log('🎯 Camera looking at:', this.controls.target);
 console.log('🖼️ Canvas dimensions:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
 console.log('🎨 Background:', this.scene.background);
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
 if (this.renderer) {
 this.renderer.dispose();
 }
 if (this.controls) {
 this.controls.dispose();
 }
 window.removeEventListener('resize', this.onResize);
 }
}

