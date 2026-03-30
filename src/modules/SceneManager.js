// ===========================
// SCENE MANAGER MODULE
// ===========================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { CONFIG, DEBUG, IS_MOBILE } from './utils.js';
import { safeSetItem } from './storage.js';

// Properties that MeshBasicMaterial does NOT support as uniforms.
// If any are truthy on a MeshBasicMaterial, Three.js refreshUniformsCommon crashes.
const BASIC_MAT_BANNED_PROPS = ['emissive','emissiveMap','normalMap','bumpMap','displacementMap'];

// Module-level constant: VR menu page tabs — defined once, never reallocated on each drawVRMenu() call.
const _VR_TABS = [
 { id: 'controls', label: '\u2699\uFE0F  Controls' },
 { id: 'navigate', label: '\uD83E\uDDED  Navigate' },
 { id: 'info',     label: '\u2139\uFE0F  Info' }
];

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
 this._vrMoveScratch = new THREE.Vector3(); // For zero-alloc movement additions
 this._vrTurnQuat = new THREE.Quaternion(); // For zero-alloc quaternion turning
 this._vrBillboardPos = new THREE.Vector3(); // For _billboardVRPanel (hot during panel drag)
 this._vrForwardScratch = new THREE.Vector3(); // For _positionMenuAtEyeLevel / _showVRInfoOverlay
 this._vrRightScratch = new THREE.Vector3(); // For _showVRInfoOverlay right-side offset
 this._vrTargetPos = new THREE.Vector3(); // For zoomToObject / teleportVRToObject
 this._vrDirScratch = new THREE.Vector3(); // For zoomToObject / teleportVRToObject
 this._vrPosScratch = new THREE.Vector3(); // For zoomToObject / teleportVRToObject
 this._vrNearCheckPos = new THREE.Vector3(); // For dynamic VR near-plane adjustment
 this._vrLaserFrame = 0; // For throttling expensive laser raycasts
 this._vrIntersections = []; // Reused raycast results buffer (avoids per-frame array alloc)
 this._vrReticle = null; // Teleport aim reticle — created in setupVR, positioned in updateLaserPointers
 this._vrWarpEffect = null; // Warp streak LineSegments — created lazily on first warp activate
 this._vrWarpPositions = null; // Pre-allocated Float32Array for warp streaks
 this._vrWarpTravel = new THREE.Vector3(); // Net dolly translation this frame (world-space)
 this._vrWarpLocalDir = new THREE.Vector3(); // Travel direction converted into dolly-local space
 this._vrWarpQuat = new THREE.Quaternion(); // Reused orientation for warp effect alignment
 this._vrWarpInverseQuat = new THREE.Quaternion(); // Reused inverse dolly rotation for warp alignment
 this._vrBothTriggerFrames = 0; // Count consecutive frames both triggers are held (debounce warp)
 // Radial quick-nav wheel
 this._vrRadialCanvas = null; // 512×512 canvas for the wheel
 this._vrRadialCtx = null;
 this._vrRadialPanel = null; // THREE.Mesh — child of left controller
 this._vrRadialHot = -1; // Currently highlighted sector index (-1 = none)
 this._vrRadialPressFrames = 0; // How many frames left thumbstick has been held
 this._vrRadialVisible = false;

 // Post-processing composer (desktop only)
 this.composer = null;
 this.bloomPass = null;

 // Adaptive pixel ratio runtime state
 this._adaptivePixelRatio = Math.min(window.devicePixelRatio, CONFIG.RENDERER.maxPixelRatio);
 this._adaptiveFpsFrameCount = 0;
 this._adaptiveFpsSampleStart = performance.now();
 this._pendingDprChange = null; // DPR resize is applied at frame START, not frame END, to avoid blank-frame flash

 // Panel drag state — right grip moves the open menu panel
 this.vrPanelDrag = { active: false, controllerIndex: -1 };
 this._vrPanelDragOffset = new THREE.Vector3();

 // Saved desktop camera state for restore after XR session ends
 this._preVRCameraPosition = null;
 this._preVRCameraQuaternion = null;
 this._preVRControlsTarget = null;

 // VR menu dirty flag (replaces the old setTimeout debounce
 // to avoid closure/timer allocations on every rapid input event)
 this._vrMenuDirty = false;

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
 this.setupPostProcessing();

 // Desktop VR emulation: apply VR camera position so you can see
 // exactly what the headset sees, without needing a headset.
 if (DEBUG.EMULATE_VR) {
 this.applyVREmulation();
 }
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.error('Error initializing scene:', error);
 this.showError('Failed to initialize 3D scene. Please refresh the page.');
 }
 }

 setupRenderer() {
 this.renderer = new THREE.WebGLRenderer(CONFIG.RENDERER);
 this.renderer.setSize(window.innerWidth, window.innerHeight);
 this.renderer.setPixelRatio(this._adaptivePixelRatio);
 this.renderer.xr.enabled = true;
 this.renderer.shadowMap.enabled = CONFIG.QUALITY.shadows;
 this.renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap deprecated in Three.js r167
 this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
 this.renderer.toneMappingExposure = 1.35; // Slightly higher to compensate for darker ambient lights
 // Suppress harmless WebGL shader VALIDATE_STATUS warnings via the official API.
 // Previously this was done via a console.warn monkey-patch which was a global side-effect.
 this.renderer.debug.checkShaderErrors = false;
 
 // Performance optimizations
 this.renderer.sortObjects = true; // Required for correct transparent blending
 this.renderer.outputColorSpace = THREE.SRGBColorSpace;
 
 // Add WebGL context loss/restore handlers
 this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
 event.preventDefault();
 if (DEBUG && DEBUG.enabled) console.warn('[WebGL] Context lost - attempting recovery...');
 // Three.js setAnimationLoop handles this internally
 }, false);
 
 this.renderer.domElement.addEventListener('webglcontextrestored', () => {
 if (DEBUG && DEBUG.enabled) console.log('[WebGL] Context restored');
 // Three.js setAnimationLoop will automatically restart
 }, false);
 
 const container = document.getElementById('canvas-container');
 if (container) {
 // Ensure canvas has proper styling
 this.renderer.domElement.style.display = 'block';
 this.renderer.domElement.style.width = '100%';
 this.renderer.domElement.style.height = '100%';
 
 container.appendChild(this.renderer.domElement);
 if (DEBUG && DEBUG.enabled) {
 console.log(`[Scene] Canvas ${this.renderer.domElement.width}×${this.renderer.domElement.height} → #${container.id}, colorSpace=${this.renderer.outputColorSpace}`);
 }
 } else {
 throw new Error('Canvas container not found');
 }
 
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
 
 // Track the last wheel timestamp so we can distinguish a zoom-only
 // interaction from a drag/pan — wheel zoom should keep auto-orbit running.
 this._lastWheelTime = 0;
 // Capture phase fires before OrbitControls' bubble-phase wheel handler, so
 // zoomSpeed is updated before OrbitControls reads it for the current tick.
 // Logarithmic adaptive factor: full speed at <=100 units, ~0.43x at 44000 units,
 // preventing the imprecise "too fast" feeling when zooming back from the Milky Way.
 this.renderer.domElement.addEventListener('wheel', () => {
 this._lastWheelTime = performance.now();
 const dist = this.camera.position.distanceTo(this.controls.target);
 const base = Math.max(dist, 100);
 const logFactor = Math.log10(100) / Math.log10(base);
 this.controls.zoomSpeed = CONFIG.CONTROLS.zoomSpeed * Math.max(0.2, logFactor);
 }, { capture: true, passive: true });

 // Add event listeners to detect user interaction with controls
 // Note: Do not toggle follow/co-rotate modes on controls input here.
 // SolarSystemModule owns tracking policy based on focused object type.
 this.controls.addEventListener('start', () => {
 const mod = window.app?.solarSystemModule;
 if (mod) {
 // If the OrbitControls 'start' fired within 50 ms of a wheel event it's
 // a scroll-zoom. Notify via onControlsZoom so auto-orbit is preserved.
 // Otherwise it's a drag or pan — let onControlsInteractionStart stop it.
 const isWheelZoom = (performance.now() - this._lastWheelTime) < 50;
 if (isWheelZoom) {
 if (typeof mod.onControlsZoom === 'function') mod.onControlsZoom();
 } else if (typeof mod.onControlsInteractionStart === 'function') {
 mod.onControlsInteractionStart();
 }
 }
 if (DEBUG && DEBUG.enabled) console.log('[Controls] User interaction started');
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
 
 // Ambient light - subtle fill so dark sides retain detail.
 // SolarSystemModule.createSun() adds its own ambient (0x202030, 0.08) on top.
 this.lights.ambient = new THREE.AmbientLight(0x111122, 0.12);
 this.scene.add(this.lights.ambient);

 // Hemisphere light - extremely subtle sky/ground tint
 this.lights.hemisphere = new THREE.HemisphereLight(0x223344, 0x080811, 0.04);
 this.scene.add(this.lights.hemisphere);

 // No camera-attached fill light — it creates a visible specular
 // hotspot on whatever surface the user is looking at directly.
 // The Sun PointLight + ambient provide sufficient illumination.
 this.scene.add(this.camera);
 
 if (DEBUG && DEBUG.enabled) {
 console.log('[Lighting] Scene lighting configured: low ambient fill + sun PointLight in SolarSystemModule');
 }
 }

 setupPostProcessing() {
 // Post-processing is desktop-only for performance.
 // During WebXR presentation, fall back to direct renderer.render() —
 // the XR compositor doesn't support EffectComposer render targets.
 this.bloomEnabled = true; // toggled via toggleBloom()
 if (IS_MOBILE) return;

 try {
 this.composer = new EffectComposer(this.renderer);

 // Pass 1 — render scene normally
 this.composer.addPass(new RenderPass(this.scene, this.camera));

 // Pass 2 — UnrealBloom: glowing Sun corona + bright stars
 // High threshold (0.85) ensures only the sun and very bright elements bloom;
 // planets stay below the threshold and are unaffected.
 this._bloomStrength = 0.55; // stored so toggle can restore it
 this.bloomPass = new UnrealBloomPass(
 new THREE.Vector2(window.innerWidth, window.innerHeight),
 this._bloomStrength, // strength — noticeable but not over-the-top
 0.5, // radius — spread of the glow
 0.82 // threshold — only very bright pixels bloom
 );
 this.composer.addPass(this.bloomPass);

 // Pass 3 — SMAA: high-quality antialiasing (better than MSAA for transparencies)
 const smaaPass = new SMAAPass(
 window.innerWidth * this.renderer.getPixelRatio(),
 window.innerHeight * this.renderer.getPixelRatio()
 );
 this.composer.addPass(smaaPass);

 // Pass 4 — OutputPass: colour-space conversion + tone-mapping for final canvas output
 this.composer.addPass(new OutputPass());

 if (DEBUG && DEBUG.enabled) {
 console.log('[PostFX] EffectComposer initialised: Bloom (strength=0.55 thresh=0.82) + SMAA + OutputPass');
 }
 } catch (e) {
 // Always log — this failure silently disables the bloom button so it must be visible.
 console.error('[PostFX] Failed to initialise post-processing, falling back to direct render:', e);
 this.composer = null;
 }
 }

 /** Enable or disable bloom at runtime.
 * Sets strength to 0 (off) or restores saved strength (on) —
 * avoids the EffectComposer buffer-swap issue that occurs when a
 * pass is fully disabled mid-chain. */
 toggleBloom(enabled) {
 this.bloomEnabled = enabled;
 if (this.bloomPass) {
 this.bloomPass.strength = enabled ? (this._bloomStrength || 0.55) : 0;
 }
 if (DEBUG.enabled) console.log(`[PostFX] Bloom ${enabled ? 'ON' : 'OFF'}`);
 }

 setupXR() {
 try {
 if (DEBUG.VR) console.log('[XR] Setting up WebXR');
 
 // Create dolly (VR locomotion rig) at the scene origin.
 // The camera lives INSIDE the dolly from app start - this is the correct
 // Three.js WebXR pattern. It avoids the race condition where XR renders
 // its first frame before sessionstart fires and caches camera.parent = scene,
 // which would permanently ignore the dolly offset.
 // In desktop mode: dolly stays at (0,0,0) so camera.world == camera.local.
 // In VR/AR mode: dolly is repositioned to VR start; XR adds the HMD offset.
 this.dolly = new THREE.Group();
 this.dolly.position.set(0, 0, 0);
 this.scene.add(this.dolly);

 // Move camera into the dolly immediately (removes it from scene automatically).
 // setupCamera() already set camera.position = CONFIG.CAMERA.startPos (0,100,200),
 // so with dolly at origin the camera world position is unchanged.
 this.dolly.add(this.camera);

 // Use 'local' reference space: origin at the viewer's starting position,
 // no floor-tracking calibration required. More reliable across headsets.
 this.renderer.xr.setReferenceSpaceType('local');

 // Controller models
 this.controllerModelFactory = new XRControllerModelFactory();
 
 // Initialize XR controllers
 this.controllers = [];
 this.controllerGrips = [];
 this.lasersVisible = true; // Toggle for laser pointers
 this.vrStarshipMode = false; // Starship mode: 20× speed boost (activated by both triggers)
 this.vrSnapTurn = true; // Snap turn (default on) vs smooth turn — reduces VR sickness
 this._vrSnapCooldown = [false, false]; // Per-controller snap cooldown (prevent multiple snaps per hold)
 this._vrWarpToggleCooldown = 0; // Debounce: frames before warp can toggle again
 
 // Shared materials for controller visuals (same colour both sides → one material each)
 const laserMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
 const pointerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
 const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
 const coneMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

 // Shared geometries (identical for both controllers)
 const laserGeo = new THREE.CylinderGeometry(0.001, 0.001, 10, 6);
 const pointerGeo = new THREE.SphereGeometry(0.01, 8, 8);
 const glowGeo = new THREE.SphereGeometry(0.015, 8, 8);
 const coneGeo = new THREE.ConeGeometry(0.02, 0.4, 8);

 // Setup two controllers
 for (let i = 0; i < 2; i++) {
 // Controller for pointing/selecting
 const controller = this.renderer.xr.getController(i);
 controller.addEventListener('selectstart', () => this.onSelectStart(controller, i));
 controller.addEventListener('selectend', () => this.onSelectEnd(controller, i));
 controller.addEventListener('squeezestart', () => this.onSqueezeStart(controller, i));
 controller.addEventListener('squeezeend', () => this.onSqueezeEnd(controller, i));
 controller.addEventListener('connected', (event) => {
 controller.userData.handedness = event.data?.handedness || (i === 0 ? 'left' : 'right');
 if (DEBUG.VR) console.log(`[XR] Controller ${i} connected: ${controller.userData.handedness}`);
 });
 controller.addEventListener('disconnected', () => {
 controller.userData.handedness = null;
 if (DEBUG.VR) console.log(`[XR] Controller ${i} disconnected`);
 });
 controller.userData.index = i;
 this.dolly.add(controller);
 this.controllers.push(controller);

 // Controller grip for models
 const controllerGrip = this.renderer.xr.getControllerGrip(i);

 // Laser beam
 const laser = new THREE.Mesh(laserGeo, laserMat.clone()); // clone so each ctrl has own colour state
 laser.rotation.x = Math.PI / 2;
 laser.position.set(0, 0, -5);
 laser.name = 'laser';
 controller.add(laser);

 // Hit-point dot
 const pointer = new THREE.Mesh(pointerGeo, pointerMat.clone());
 pointer.position.set(0, 0, -10);
 pointer.name = 'pointer';
 controller.add(pointer);

 // Glow ring around dot
 const glow = new THREE.Mesh(glowGeo, glowMat);
 pointer.add(glow);

 // Direction cone at tip
 const cone = new THREE.Mesh(coneGeo, coneMat.clone());
 cone.rotation.x = Math.PI / 2;
 cone.position.set(0, 0, -0.2);
 cone.name = 'cone';
 controller.add(cone);

 // Cache refs so updateLaserPointers never needs getObjectByName per frame
 controller.userData.laserMesh = laser;
 controller.userData.pointerMesh = pointer;
 controller.userData.coneMesh = cone;

 this.dolly.add(controllerGrip);
 this.controllerGrips.push(controllerGrip);
 }
 
 // Setup VR UI Panel
 this.setupVRUI();

 // Teleport aim reticle — a flat ring shown at intersection point when controller aims at an object
 {
 const reticleGeo = new THREE.RingGeometry(0.08, 0.13, 32);
 const reticleMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false });
 this._vrReticle = new THREE.Mesh(reticleGeo, reticleMat);
 this._vrReticle.visible = false;
 this._vrReticle.renderOrder = 10;
 this._vrReticle.frustumCulled = false;
 this.scene.add(this._vrReticle);
 }
 
 // Custom VR Button - Only show if VR is supported
 if (navigator.xr) {
 navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
 if (supported) {
 const vrButton = document.createElement('button');
 vrButton.id = 'VRButton';
 vrButton.style.cssText = 'position: fixed; bottom: 80px; right: 20px; width: 50px; height: 50px; cursor: pointer; padding: 0; border: 2px solid #fff; border-radius: 50%; background: rgba(0,0,0,0.8); color: #fff; font-size: 24px; text-align: center; line-height: 50px; opacity: 0.9; outline: none; z-index: 999; transition: all 0.3s; font-weight: 600; font-size: 16px;';
 vrButton.textContent = 'VR';
 vrButton.title = 'Enter VR Mode';
 vrButton.setAttribute('aria-label', 'Enter VR Mode');
 
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
 // 'local' reference space is set globally in setupXR via setReferenceSpaceType.
 // We list 'local-floor' as optional so Quest can use floor-level origin if
 // room calibration is set up, but the session does NOT require it.
 const session = await navigator.xr.requestSession('immersive-vr', {
 optionalFeatures: ['local-floor', 'bounded-floor']
 });
 await this.renderer.xr.setSession(session);
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.error('[VR] Failed to start VR session:', error);
 console.warn('Could not enter VR mode: ' + error.message);
 }
 };
 
 const vrContainer = document.getElementById('vr-button');
 if (vrContainer) {
 vrContainer.appendChild(vrButton);
 vrContainer.classList.remove('hidden');
 }
 }
 }).catch((err) => {
 if (DEBUG && DEBUG.enabled) console.warn('[VR] XR support check failed:', err);
 });
 }

 // Custom AR Button - Only show if AR is supported
 if (navigator.xr) {
 navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
 if (supported) {
 const arButton = document.createElement('button');
 arButton.id = 'ARButton';
 arButton.style.cssText = 'position: fixed; bottom: 80px; right: 80px; width: 50px; height: 50px; cursor: pointer; padding: 0; border: 2px solid #fff; border-radius: 50%; background: rgba(0,0,0,0.8); color: #fff; font-size: 24px; text-align: center; line-height: 50px; opacity: 0.9; outline: none; z-index: 999; transition: all 0.3s; font-weight: 600; font-size: 16px;';
 arButton.textContent = 'AR';
 arButton.title = 'Enter AR Mode';
 arButton.setAttribute('aria-label', 'Enter AR Mode');
 
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
 const session = await navigator.xr.requestSession('immersive-ar', {
 optionalFeatures: ['local-floor', 'bounded-floor', 'dom-overlay', 'hit-test']
 });
 await this.renderer.xr.setSession(session);
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.error('[AR] Failed to start AR session:', error);
 console.warn('Could not enter AR mode: ' + error.message);
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
 try {
 const session = this.renderer.xr.getSession();
 if (DEBUG.VR) console.log(`[XR] Session started: ${session.mode}`);
 document.body.classList.add('xr-active');
 
 // Save desktop camera state so we can restore it after the session ends.
 this._preVRCameraPosition = this.camera.position.clone();
 this._preVRCameraQuaternion = this.camera.quaternion.clone();
 this._preVRControlsTarget = this.controls.target.clone();

 // The camera is already parented to the dolly (done in setupXR).
 // Just move the dolly to the VR start position and reset the camera's
 // local transform so the HMD pose is the sole source of camera movement.
 this.dolly.position.set(0, 0, 200);
 this.dolly.rotation.set(0, 0, 0);
 this.camera.position.set(0, 0, 0);
 this.camera.quaternion.set(0, 0, 0, 1);
 this.dolly.updateMatrixWorld(true);

 // Without logarithmicDepthBuffer on mobile/Quest, widen the near plane
        // significantly to improve depth precision for the compressed educational scale.
        // This prevents Z-fighting on large distant geometries like Saturn's rings.
        this.camera.near = 10.0;

 if (DEBUG.enabled || DEBUG.VR) console.log(`[XR] Dolly at (${this.dolly.position.x}, ${this.dolly.position.y}, ${this.dolly.position.z}), camera near=${this.camera.near}, far=${this.camera.far}`);
 if (DEBUG.enabled || DEBUG.VR) console.log(`[XR] Scene children: ${this.scene.children.length}`);
 
 // Set background based on session type
 if (session.mode === 'immersive-ar' ||
 session.environmentBlendMode === 'additive' ||
 session.environmentBlendMode === 'alpha-blend') {
 this.scene.background = null; // Transparent for AR
 } else {
 // VR mode - keep starfield background
 this.scene.background = new THREE.Color(0x000011);
 }
 
 if (DEBUG.enabled || DEBUG.VR) console.log('[VR] Controls: LStick=move, RStick=turn/up-down, LTrigger=sprint, LGrip=rotate, X=menu, Trigger=select');

 // Re-init button-state map for however many input sources exist.
 // Done here (not per-frame) so the hot loop needs no guard.
 this.previousButtonStates = [];

 // Clear per-session error-suppression flags so a new session
 // produces fresh diagnostics in the console.

 // Hide VR UI panel initially — user opens it with X button
 if (this.vrUIPanel) this.vrUIPanel.visible = false;

 } catch (error) {
 console.error('[XR] ERROR in sessionstart handler:', error, error.stack);
 }
 });

 // Handle XR session end
 this.renderer.xr.addEventListener('sessionend', () => {
 if (DEBUG.enabled || DEBUG.VR) console.log('[XR] Session ended');
 document.body.classList.remove('xr-active');
 
 // Return dolly to origin so desktop camera world == camera local
 this.dolly.position.set(0, 0, 0);
 this.dolly.rotation.set(0, 0, 0);

 // Restore the camera state that was saved when the session started
 if (this._preVRCameraPosition) {
 this.camera.position.copy(this._preVRCameraPosition);
 }
 if (this._preVRCameraQuaternion) {
 this.camera.quaternion.copy(this._preVRCameraQuaternion);
 }
 if (this._preVRControlsTarget) {
 this.controls.target.copy(this._preVRControlsTarget);
 this.controls.update();
 }

 // Restore desktop near value
 this.camera.near = CONFIG.CAMERA.near;
 this.camera.updateProjectionMatrix();
 
 this.scene.background = new THREE.Color(0x000011); // Restore original space background
 // Hide VR UI panel
 if (this.vrUIPanel) this.vrUIPanel.visible = false;

 // Reset grab/drag state to prevent stale flags in next session
 if (this.grabRotateState) this.grabRotateState.active = false;
 if (this.vrPanelDrag) this.vrPanelDrag.active = false;
 });
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.warn('WebXR not supported:', error);
 }
 }

 /**
  * Desktop VR Emulation — ?emulate-vr in the URL
  * Applies the same camera setup that sessionstart does, so you can see
  * on a flat desktop screen exactly what the VR headset shows. Useful for
  * diagnosing black-screen issues without needing a headset.
  *
  * Also adds an on-screen HUD showing VR diagnostics.
  */
 applyVREmulation() {
 console.log('%c[VR-Emulate] Activating desktop VR emulation mode', 'color: #00ff88; font-weight: bold; font-size: 14px');

 // Replicate what sessionstart does
 document.body.classList.add('xr-active');
 this.dolly.position.set(0, 0, 200);
 this.dolly.rotation.set(0, 0, 0);
 this.camera.position.set(0, 0, 0);
 this.camera.quaternion.set(0, 0, 0, 1);
 this.dolly.updateMatrixWorld(true);

this.camera.near = 10.0;
 this.camera.updateProjectionMatrix();

 // Point camera towards origin (where the Sun/planets are)
 this.camera.lookAt(0, 0, 0);

 // Disable OrbitControls target reset — keep looking at origin
 this.controls.target.set(0, 0, 0);
 this.controls.update();

 // Log diagnostic info
 const worldPos = new THREE.Vector3();
 this.camera.getWorldPosition(worldPos);
 console.log(`[VR-Emulate] Camera world position: (${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)}, ${worldPos.z.toFixed(1)})`);
 console.log(`[VR-Emulate] Camera near=${this.camera.near}, far=${this.camera.far}`);
 console.log(`[VR-Emulate] Dolly position: (${this.dolly.position.x}, ${this.dolly.position.y}, ${this.dolly.position.z})`);
 console.log(`[VR-Emulate] Scene children: ${this.scene.children.length}`);

 // Add on-screen VR debug HUD
 this._createVRDebugHUD();
 }

 /** On-screen diagnostic overlay for VR emulation mode */
 _createVRDebugHUD() {
 const hud = document.createElement('div');
 hud.id = 'vr-debug-hud';
 hud.style.cssText = `
 position: fixed; top: 10px; left: 10px; z-index: 10000;
 background: rgba(0,0,0,0.85); color: #00ff88; padding: 12px 16px;
 font: 12px monospace; border: 1px solid #00ff88; border-radius: 6px;
 pointer-events: none; max-width: 400px; line-height: 1.6;
 `;
 document.body.appendChild(hud);

 // Update HUD every second
 const updateHUD = () => {
 if (!this.camera || !this.dolly) return;
 const wp = new THREE.Vector3();
 this.camera.getWorldPosition(wp);

 // Count visible meshes
 let meshCount = 0, visibleMeshes = 0;
 this.scene.traverse(obj => {
 if (obj.isMesh) {
 meshCount++;
 if (obj.visible) visibleMeshes++;
 }
 });

 hud.innerHTML = `
 <div style="color:#ffaa00;font-weight:bold;margin-bottom:4px">🥽 VR EMULATION MODE</div>
 <div>Dolly: (${this.dolly.position.x.toFixed(1)}, ${this.dolly.position.y.toFixed(1)}, ${this.dolly.position.z.toFixed(1)})</div>
 <div>Camera World: (${wp.x.toFixed(1)}, ${wp.y.toFixed(1)}, ${wp.z.toFixed(1)})</div>
 <div>Near: ${this.camera.near} | Far: ${this.camera.far}</div>
 <div>FOV: ${this.camera.fov.toFixed(0)}°</div>
 <div>Meshes: ${visibleMeshes}/${meshCount} visible</div>
 <div>Scene children: ${this.scene.children.length}</div>
 <div style="margin-top:6px;color:#888">Use OrbitControls to look around from VR start pos</div>
 `;
 };

 updateHUD();
 this._vrDebugHUDInterval = setInterval(updateHUD, 1000);
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
 // Mark dirty; the animate loop flushes at most once per frame — zero allocations.
 this._vrMenuDirty = true;
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
 scientificMode: module?.scientificMode ?? false,
 constellationsVisible: module?.constellationsVisible ?? true,
 lasersVisible: this.lasersVisible,
 focusedObject: module?.focusedObject || null,
 statusMessage: this.vrStatusMessage,
 flashAction: this.vrFlashAction,
 currentPage: ns.currentPage || 'controls',
 currentCategory: ns.currentCategory || 'solar',
 scrollOffset: ns.scrollOffset || 0,
 audioEnabled: window.audioManager?.enabled ?? true,
 lastObjectInfo: this.vrLastObjectInfo || null,
 starshipMode: this.vrStarshipMode,
 snapTurn: this.vrSnapTurn
 };
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
 { id: 'constellation-orions-belt', label: 'Orion\'s Belt' },
 { id: 'constellation-ursa-major', label: 'Ursa Major' },
 { id: 'constellation-big-dipper', label: 'Big Dipper' },
 { id: 'constellation-little-dipper', label: 'Little Dipper' },
 { id: 'constellation-southern-cross', label: 'Southern Cross' },
 { id: 'constellation-cassiopeia', label: 'Cassiopeia' },
 { id: 'constellation-cygnus', label: 'Cygnus' },
 { id: 'constellation-lyra', label: 'Lyra' },
 { id: 'constellation-andromeda', label: 'Andromeda' },
 { id: 'constellation-perseus', label: 'Perseus' },
 { id: 'constellation-canis-major', label: 'Canis Major' },
 { id: 'constellation-aquila', label: 'Aquila' },
 { id: 'constellation-pegasus', label: 'Pegasus' },
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
 const W = this.vrUICanvas.width;
 const H = this.vrUICanvas.height;
 const state = this.getVRMenuState();
 const info = state.lastObjectInfo;

 const PAD = 28;
 const RAIL_W = 286;
 const GAP = 18;
 const SHELL_R = 28;
 const HEADER_H = 132;
 const STATUS_H = 58;
 const ACTION_H = 68;
 const MAIN_X = PAD + RAIL_W + GAP;
 const MAIN_Y = PAD;
 const MAIN_W = W - MAIN_X - PAD;
 const MAIN_H = H - PAD * 2;
 const BODY_X = MAIN_X + 24;
 const BODY_Y = MAIN_Y + HEADER_H + 20;
 const BODY_W = MAIN_W - 48;
 const ACTION_Y = H - PAD - ACTION_H - 18;
 const BODY_BOTTOM = ACTION_Y - 18;

 const pagePalette = {
 controls: { accent: '#F97316', soft: 'rgba(249,115,22,0.18)', edge: 'rgba(249,115,22,0.45)' },
 navigate: { accent: '#38BDF8', soft: 'rgba(56,189,248,0.18)', edge: 'rgba(56,189,248,0.45)' },
 info: { accent: '#34D399', soft: 'rgba(52,211,153,0.18)', edge: 'rgba(52,211,153,0.45)' }
 };
 const currentPalette = pagePalette[state.currentPage] || pagePalette.controls;
 const pageMeta = {
 controls: {
 title: 'Flight Controls',
 subtitle: 'Time flow, overlays, utilities, and comfort settings.'
 },
 navigate: {
 title: 'Navigation Grid',
 subtitle: 'Jump directly to planets, moons, spacecraft, and deep-sky targets.'
 },
 info: {
 title: 'Object Intel',
 subtitle: info ? 'Live telemetry for the currently selected target.' : 'Select an object to inspect it here.'
 }
 };

 this.vrButtons = [];

 const rr = (x, y, w, h, r = 18) => {
 ctx.beginPath();
 ctx.roundRect(x, y, w, h, r);
 };

 const panel = (x, y, w, h, opts = {}) => {
 const radius = opts.radius ?? 24;
 const top = opts.top || 'rgba(14,22,34,0.94)';
 const bottom = opts.bottom || 'rgba(7,11,20,0.98)';
 const border = opts.border || 'rgba(120,160,210,0.16)';
 ctx.save();
 const fill = ctx.createLinearGradient(x, y, x, y + h);
 fill.addColorStop(0, top);
 fill.addColorStop(1, bottom);
 ctx.fillStyle = fill;
 rr(x, y, w, h, radius);
 ctx.fill();
 if (opts.glow) {
 ctx.shadowColor = opts.glow;
 ctx.shadowBlur = opts.glowBlur ?? 20;
 rr(x, y, w, h, radius);
 ctx.strokeStyle = opts.glow;
 ctx.lineWidth = 1;
 ctx.stroke();
 }
 ctx.shadowBlur = 0;
 rr(x, y, w, h, radius);
 ctx.strokeStyle = border;
 ctx.lineWidth = opts.lineWidth ?? 1;
 ctx.stroke();
 if (opts.highlight) {
 const hi = ctx.createLinearGradient(x, y, x + w, y);
 hi.addColorStop(0, 'rgba(255,255,255,0)');
 hi.addColorStop(0.3, opts.highlight);
 hi.addColorStop(0.7, opts.highlight);
 hi.addColorStop(1, 'rgba(255,255,255,0)');
 ctx.fillStyle = hi;
 ctx.fillRect(x + 18, y + 1, w - 36, 2);
 }
 ctx.restore();
 };

 const sectionTitle = (text, x, y, w, accent = currentPalette.accent, subtext = '') => {
 ctx.save();
 ctx.fillStyle = accent;
 ctx.fillRect(x, y + 7, 4, 18);
 ctx.fillStyle = 'rgba(255,255,255,0.05)';
 ctx.fillRect(x + 12, y + 15, w - 12, 1);
 ctx.fillStyle = '#E8F4FF';
 ctx.font = 'bold 18px Arial';
 ctx.textAlign = 'left';
 ctx.textBaseline = 'top';
 ctx.fillText(text, x + 14, y);
 if (subtext) {
 ctx.fillStyle = 'rgba(137,173,207,0.72)';
 ctx.font = '15px Arial';
 ctx.fillText(subtext, x + 14, y + 26, w - 16);
 }
 ctx.restore();
 };

 const statusPill = (text, x, y, w, accent) => {
 panel(x, y, w, 34, {
 radius: 17,
 top: 'rgba(11,23,36,0.94)',
 bottom: 'rgba(8,13,24,0.98)',
 border: accent + '66',
 highlight: accent + 'AA'
 });
 ctx.save();
 ctx.fillStyle = accent;
 ctx.font = 'bold 15px Arial';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(text, x + w / 2, y + 17, w - 16);
 ctx.restore();
 };

 const chip = (text, x, y, w, accent, opts = {}) => {
 panel(x, y, w, 34, {
 radius: 17,
 top: opts.top || 'rgba(9,16,26,0.92)',
 bottom: opts.bottom || 'rgba(6,10,18,0.98)',
 border: opts.border || 'rgba(110,145,190,0.22)',
 highlight: accent + '99'
 });
 ctx.save();
 ctx.fillStyle = opts.text || '#D9EBFF';
 ctx.font = opts.font || 'bold 14px Arial';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(text, x + w / 2, y + 17, w - 12);
 ctx.restore();
 };

 const tile = (label, action, x, y, w, h, opts = {}) => {
 const active = opts.active ?? false;
 const danger = opts.danger ?? false;
 const flash = state.flashAction === action;
 const accent = opts.accent || currentPalette.accent;
 const top = danger
 ? '#311015'
 : active
 ? 'rgba(28,48,64,0.98)'
 : opts.top || 'rgba(13,22,34,0.96)';
 const bottom = danger
 ? '#1b070b'
 : active
 ? 'rgba(9,14,25,0.99)'
 : opts.bottom || 'rgba(7,11,20,0.99)';
 const border = danger
 ? 'rgba(239,68,68,0.58)'
 : active
 ? accent
 : opts.border || 'rgba(112,145,186,0.18)';

 panel(x, y, w, h, {
 radius: opts.radius ?? 18,
 top,
 bottom,
 border,
 glow: flash ? '#FFD966' : active ? accent + 'AA' : '',
 glowBlur: flash ? 18 : 14,
 highlight: flash ? '#FFD966' : active ? accent + 'CC' : 'rgba(255,255,255,0.08)'
 });

 if (opts.badge) {
 ctx.save();
 ctx.fillStyle = accent;
 ctx.font = 'bold 12px Arial';
 ctx.textAlign = 'left';
 ctx.textBaseline = 'top';
 ctx.fillText(opts.badge, x + 16, y + 12);
 ctx.restore();
 }

 ctx.save();
 ctx.fillStyle = danger ? '#FFD3D3' : active ? '#FFFFFF' : '#E5F0FF';
 ctx.textAlign = opts.align === 'left' ? 'left' : 'center';
 ctx.textBaseline = 'middle';
 ctx.font = opts.font || 'bold 22px Arial';
 const tx = opts.align === 'left' ? x + 18 : x + w / 2;
 const ty = opts.meta ? y + h * 0.42 : y + h * 0.5;
 ctx.fillText(label, tx, ty, opts.align === 'left' ? w - 36 : w - 18);
 if (opts.meta) {
 ctx.fillStyle = active ? 'rgba(255,255,255,0.76)' : 'rgba(142,175,205,0.78)';
 ctx.font = '15px Arial';
 ctx.fillText(opts.meta, tx, y + h * 0.72, opts.align === 'left' ? w - 36 : w - 18);
 }
 ctx.restore();

 if (action) this.vrButtons.push({ x, y, w, h, label, action });
 };

 const wrapText = (text, x, y, maxW, lineH, maxLines, color = '#9BC3E2', font = '20px Arial') => {
 ctx.save();
 ctx.fillStyle = color;
 ctx.font = font;
 ctx.textAlign = 'left';
 ctx.textBaseline = 'top';
 const words = String(text || '').split(' ');
 let line = '';
 let lineIndex = 0;
 for (let i = 0; i < words.length; i++) {
 const candidate = line ? line + ' ' + words[i] : words[i];
 if (ctx.measureText(candidate).width > maxW && line) {
 ctx.fillText(line, x, y + lineIndex * lineH, maxW);
 line = words[i];
 lineIndex++;
 if (lineIndex >= maxLines - 1) break;
 } else {
 line = candidate;
 }
 }
 if (line && lineIndex < maxLines) ctx.fillText(line, x, y + lineIndex * lineH, maxW);
 ctx.restore();
 };

 const typeStyle = (t) => {
 const tl = (t || '').toLowerCase();
 if (tl.includes('star')) return { icon: '⭐', accent: '#FACC15', badge: '#291f07' };
 if (tl.includes('gas')) return { icon: '🪐', accent: '#93C5FD', badge: '#111a2d' };
 if (tl.includes('moon')) return { icon: '🌙', accent: '#D4D4D8', badge: '#181822' };
 if (tl.includes('spacecraft') || tl.includes('station')) return { icon: '🛸', accent: '#7DD3FC', badge: '#0d1b29' };
 if (tl.includes('comet')) return { icon: '☄️', accent: '#A5F3FC', badge: '#0c1820' };
 if (tl.includes('galaxy')) return { icon: '🌀', accent: '#F9A8D4', badge: '#28111d' };
 if (tl.includes('nebula')) return { icon: '🌋', accent: '#C084FC', badge: '#20112a' };
 if (tl.includes('constellation')) return { icon: '✨', accent: '#FDBA74', badge: '#2a190b' };
 if (tl.includes('dwarf')) return { icon: '🔴', accent: '#FB923C', badge: '#291508' };
 if (tl.includes('planet') || tl.includes('exoplanet')) return { icon: '🌍', accent: '#4ADE80', badge: '#0d2113' };
 return { icon: '•', accent: '#7DD3FC', badge: '#0d1b29' };
 };

 const pageHeader = pageMeta[state.currentPage] || pageMeta.controls;

 const bg = ctx.createLinearGradient(0, 0, W, H);
 bg.addColorStop(0, '#02040a');
 bg.addColorStop(0.5, '#040914');
 bg.addColorStop(1, '#02050d');
 ctx.fillStyle = bg;
 ctx.fillRect(0, 0, W, H);

 const orbA = ctx.createRadialGradient(W * 0.14, H * 0.12, 0, W * 0.14, H * 0.12, 300);
 orbA.addColorStop(0, currentPalette.soft);
 orbA.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = orbA;
 ctx.fillRect(0, 0, W, H);

 const orbB = ctx.createRadialGradient(W * 0.88, H * 0.82, 0, W * 0.88, H * 0.82, 360);
 orbB.addColorStop(0, 'rgba(168,85,247,0.12)');
 orbB.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = orbB;
 ctx.fillRect(0, 0, W, H);

 let seed = 44021;
 const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
 for (let i = 0; i < 64; i++) {
 const sx = rand() * W;
 const sy = rand() * H;
 const r = 0.5 + rand() * 1.2;
 ctx.fillStyle = `rgba(200,225,255,${(0.08 + rand() * 0.4).toFixed(2)})`;
 ctx.beginPath();
 ctx.arc(sx, sy, r, 0, Math.PI * 2);
 ctx.fill();
 }
 ctx.strokeStyle = 'rgba(120,160,210,0.06)';
 ctx.lineWidth = 1;
 for (let gx = 120; gx < W; gx += 120) {
 ctx.beginPath();
 ctx.moveTo(gx, 40);
 ctx.lineTo(gx - 70, H - 40);
 ctx.stroke();
 }

 panel(PAD, PAD, W - PAD * 2, H - PAD * 2, {
 radius: SHELL_R,
 top: 'rgba(7,12,22,0.92)',
 bottom: 'rgba(4,7,14,0.98)',
 border: 'rgba(123,164,213,0.12)',
 glow: currentPalette.edge,
 glowBlur: 26,
 highlight: currentPalette.edge
 });

 panel(PAD + 12, PAD + 12, RAIL_W - 24, H - PAD * 2 - 24, {
 radius: 24,
 top: 'rgba(11,17,28,0.95)',
 bottom: 'rgba(7,10,18,0.98)',
 border: 'rgba(109,142,184,0.14)',
 highlight: 'rgba(255,255,255,0.08)'
 });

 ctx.save();
 ctx.fillStyle = '#7C95B4';
 ctx.font = 'bold 14px Arial';
 ctx.textAlign = 'left';
 ctx.textBaseline = 'top';
 ctx.fillText('SPACE VOYAGE / VR', PAD + 30, PAD + 26);
 ctx.fillStyle = '#F4F7FB';
 ctx.font = 'bold 36px Arial';
 ctx.fillText('Command Deck', PAD + 30, PAD + 52);
 ctx.fillStyle = 'rgba(157,183,212,0.76)';
 ctx.font = '18px Arial';
 ctx.fillText('Fast control surfaces built for hand-held VR use.', PAD + 30, PAD + 98, RAIL_W - 54);
 ctx.restore();

 const railChipW = Math.floor((RAIL_W - 84) / 2);
 chip(state.starshipMode ? 'WARP ON' : 'WARP READY', PAD + 30, PAD + 136, railChipW, '#22D3EE', {
 text: state.starshipMode ? '#CFFAFE' : '#9AD4E5'
 });
 chip(state.lasersVisible ? 'LASERS ON' : 'LASERS OFF', PAD + 30 + railChipW + 12, PAD + 136, railChipW, '#A78BFA', {
 text: state.lasersVisible ? '#E9DDFF' : '#BCAFE4'
 });

 let tabY = PAD + 192;
 _VR_TABS.forEach((tab) => {
 const active = state.currentPage === tab.id;
 tile(tab.label, `page:${tab.id}`, PAD + 24, tabY, RAIL_W - 48, 74, {
 active,
 accent: pagePalette[tab.id]?.accent || currentPalette.accent,
 font: active ? 'bold 24px Arial' : 'bold 22px Arial',
 meta: active ? 'ACTIVE PAGE' : ''
 });
 tabY += 88;
 });

 panel(PAD + 24, H - PAD - 238, RAIL_W - 48, 126, {
 radius: 20,
 top: 'rgba(12,18,30,0.96)',
 bottom: 'rgba(7,11,19,0.98)',
 border: 'rgba(109,142,184,0.12)',
 highlight: 'rgba(255,255,255,0.06)'
 });
 sectionTitle('QUICK GESTURES', PAD + 38, H - PAD - 222, RAIL_W - 76, currentPalette.accent);
 ctx.save();
 ctx.fillStyle = 'rgba(164,189,217,0.82)';
 ctx.font = '17px Arial';
 ctx.textAlign = 'left';
 ctx.textBaseline = 'top';
 ctx.fillText('X  open / close menu', PAD + 40, H - PAD - 180);
 ctx.fillText('Right grip  drag panel', PAD + 40, H - PAD - 152);
 ctx.fillText('Left stick hold  radial quick-jump', PAD + 40, H - PAD - 124);
 ctx.restore();

 tile('Close Menu', 'hide', PAD + 24, H - PAD - 94, RAIL_W - 48, 44, {
 accent: '#94A3B8',
 font: 'bold 18px Arial'
 });
 tile('Exit VR', 'exitvr', PAD + 24, H - PAD - 44, RAIL_W - 48, 44, {
 danger: true,
 font: 'bold 18px Arial'
 });

 panel(MAIN_X, MAIN_Y, MAIN_W, HEADER_H, {
 radius: 26,
 top: 'rgba(11,18,30,0.96)',
 bottom: 'rgba(7,11,19,0.98)',
 border: currentPalette.edge,
 highlight: currentPalette.edge,
 glow: currentPalette.soft,
 glowBlur: 20
 });

 ctx.save();
 ctx.fillStyle = 'rgba(127,152,182,0.76)';
 ctx.font = 'bold 14px Arial';
 ctx.textAlign = 'left';
 ctx.textBaseline = 'top';
 ctx.fillText('ACTIVE WORKSPACE', MAIN_X + 30, MAIN_Y + 24);
 ctx.fillStyle = '#F4F7FB';
 ctx.font = 'bold 40px Arial';
 ctx.fillText(pageHeader.title, MAIN_X + 30, MAIN_Y + 46, MAIN_W - 320);
 ctx.fillStyle = 'rgba(163,191,219,0.80)';
 ctx.font = '20px Arial';
 ctx.fillText(pageHeader.subtitle, MAIN_X + 30, MAIN_Y + 92, MAIN_W - 360);
 ctx.restore();

 const statusText = state.statusMessage || '✨ Ready';
 const statusColor = statusText.includes('⚠') ? '#F59E0B' : statusText.includes('✔') ? '#34D399' : currentPalette.accent;
 statusPill(statusText, MAIN_X + MAIN_W - 344, MAIN_Y + 24, 314, statusColor);
 chip('v' + (window.APP_VERSION || ''), MAIN_X + MAIN_W - 144, MAIN_Y + 74, 114, '#94A3B8', {
 font: 'bold 15px Arial',
 text: 'rgba(218,231,247,0.72)'
 });

 if (state.currentPage === 'controls') {
 const fullW = BODY_W;
 const halfGap = 16;
 const halfW = Math.floor((fullW - halfGap) / 2);
 const rowTop = BODY_Y;
 const timeH = 190;
 const midY = rowTop + timeH + 16;
 const midH = 214;
 const locoY = midY + midH + 16;
 const locoH = BODY_BOTTOM - locoY;

 panel(BODY_X, rowTop, fullW, timeH, {
 radius: 24,
 top: 'rgba(20,16,9,0.96)',
 bottom: 'rgba(11,8,6,0.99)',
 border: 'rgba(245,158,11,0.28)',
 highlight: 'rgba(245,158,11,0.62)'
 });
 sectionTitle('TIME FLOW', BODY_X + 22, rowTop + 18, fullW - 44, '#F59E0B', 'Pick a simulation pace instantly.');
 const timeTileY = rowTop + 78;
 const timeTileW = Math.floor((fullW - 22 * 2 - 12 * 3) / 4);
 const timeActions = [
 { label: '⏸ Pause', action: 'speed0', active: state.timeSpeed === 0, meta: '0×' },
 { label: '▶ Live', action: 'speed1', active: state.timeSpeed === 1, meta: '1×' },
 { label: '⏩ Fast', action: 'speed10', active: state.timeSpeed === 10, meta: '10×' },
 { label: '⏩⏩ Max', action: 'speed100', active: state.timeSpeed >= 100, meta: '100×' }
 ];
 timeActions.forEach((item, idx) => {
 tile(item.label, item.action, BODY_X + 22 + idx * (timeTileW + 12), timeTileY, timeTileW, 88, {
 active: item.active,
 accent: '#F59E0B',
 meta: item.meta,
 font: 'bold 23px Arial'
 });
 });

 panel(BODY_X, midY, halfW, midH, {
 radius: 24,
 top: 'rgba(9,16,29,0.96)',
 bottom: 'rgba(6,10,18,0.99)',
 border: 'rgba(59,130,246,0.26)',
 highlight: 'rgba(59,130,246,0.56)'
 });
 sectionTitle('VISUAL LAYERS', BODY_X + 22, midY + 18, halfW - 44, '#60A5FA', 'World overlays and scale modes.');
 const visualGridY = midY + 74;
 const visualTileW = Math.floor((halfW - 22 * 2 - 12) / 2);
 const visualTileH = 56;
 const visualItems = [
 { label: '🛰 Orbits', action: 'orbits', active: state.orbitsVisible },
 { label: '🏷 Labels', action: 'labels', active: state.labelsVisible },
 { label: '⭐ Stars', action: 'constellations', active: state.constellationsVisible },
 { label: '📏 Scale', action: 'scale', active: state.realisticScale }
 ];
 visualItems.forEach((item, idx) => {
 const col = idx % 2;
 const row = Math.floor(idx / 2);
 tile(item.label, item.action, BODY_X + 22 + col * (visualTileW + 12), visualGridY + row * (visualTileH + 12), visualTileW, visualTileH, {
 active: item.active,
 accent: '#3B82F6',
 font: 'bold 20px Arial'
 });
 });

 panel(BODY_X + halfW + halfGap, midY, halfW, midH, {
 radius: 24,
 top: 'rgba(23,11,31,0.96)',
 bottom: 'rgba(11,6,18,0.99)',
 border: 'rgba(168,85,247,0.26)',
 highlight: 'rgba(168,85,247,0.56)'
 });
 sectionTitle('SHIP TOOLS', BODY_X + halfW + halfGap + 22, midY + 18, halfW - 44, '#C084FC', 'Reset, discover, sound, and laser pointer controls.');
 const toolX = BODY_X + halfW + halfGap + 22;
 const toolTileW = Math.floor((halfW - 22 * 2 - 12) / 2);
 const toolItems = [
 { label: '🔄 Reset', action: 'reset', active: false },
 { label: '🎲 Discover', action: 'discover', active: false },
 { label: state.audioEnabled ? '🔊 Sound' : '🔇 Sound', action: 'sound', active: state.audioEnabled },
 { label: '🎯 Lasers', action: 'togglelasers', active: state.lasersVisible }
 ];
 toolItems.forEach((item, idx) => {
 const col = idx % 2;
 const row = Math.floor(idx / 2);
 tile(item.label, item.action, toolX + col * (toolTileW + 12), visualGridY + row * (visualTileH + 12), toolTileW, visualTileH, {
 active: item.active,
 accent: '#A855F7',
 font: 'bold 20px Arial'
 });
 });

 panel(BODY_X, locoY, fullW, locoH, {
 radius: 24,
 top: 'rgba(8,23,24,0.96)',
 bottom: 'rgba(4,13,16,0.99)',
 border: 'rgba(16,185,129,0.30)',
 highlight: 'rgba(16,185,129,0.56)'
 });
 sectionTitle('LOCOMOTION', BODY_X + 22, locoY + 18, fullW - 44, '#10B981', 'Warp is pressure-based: hold both triggers only while you want speed.');
 const warpBoxX = BODY_X + 22;
 const warpBoxY = locoY + 68;
 const warpBoxW = fullW - 44;
 const warpBoxH = Math.max(76, locoH - 90);
 panel(warpBoxX, warpBoxY, warpBoxW, warpBoxH, {
 radius: 20,
 top: state.starshipMode ? 'rgba(8,44,54,0.98)' : 'rgba(8,18,24,0.96)',
 bottom: state.starshipMode ? 'rgba(3,22,28,0.99)' : 'rgba(5,12,17,0.99)',
 border: state.starshipMode ? 'rgba(34,211,238,0.42)' : 'rgba(41,96,110,0.24)',
 highlight: state.starshipMode ? 'rgba(34,211,238,0.74)' : 'rgba(255,255,255,0.06)',
 glow: state.starshipMode ? 'rgba(34,211,238,0.42)' : ''
 });
 if (state.starshipMode) {
 ctx.save();
 rr(warpBoxX, warpBoxY, warpBoxW, warpBoxH, 20);
 ctx.clip();
 let ws = 10811;
 const wr = () => { ws = (ws * 1103515245 + 12345) & 0x7fffffff; return ws / 0x7fffffff; };
 for (let i = 0; i < 24; i++) {
 const ly = warpBoxY + 10 + wr() * (warpBoxH - 20);
 const len = 30 + wr() * 180;
 const lx = warpBoxX + wr() * (warpBoxW - len - 20);
 ctx.strokeStyle = `rgba(103,232,249,${(0.08 + wr() * 0.28).toFixed(2)})`;
 ctx.lineWidth = 1 + wr() * 1.3;
 ctx.beginPath();
 ctx.moveTo(lx, ly);
 ctx.lineTo(lx + len, ly);
 ctx.stroke();
 }
 ctx.restore();
 }
 ctx.save();
 ctx.fillStyle = state.starshipMode ? '#CFFAFE' : '#DDF2F2';
 ctx.font = 'bold 28px Arial';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(state.starshipMode ? '🚀 Warp drive engaged' : '🚀 Warp drive standby', warpBoxX + warpBoxW / 2, warpBoxY + 28, warpBoxW - 32);
 ctx.fillStyle = state.starshipMode ? 'rgba(173,244,255,0.92)' : 'rgba(146,201,203,0.78)';
 ctx.font = '19px Arial';
 ctx.fillText(state.starshipMode ? 'Release either trigger to drop back to normal speed.' : 'Press and hold both triggers together to accelerate to 20×.', warpBoxX + warpBoxW / 2, warpBoxY + warpBoxH - 26, warpBoxW - 48);
 ctx.restore();
 tile(`🔄 Snap Turn  ${state.snapTurn ? 'ON (30°)' : 'OFF (smooth)'}`, 'snapTurn', warpBoxX + 18, warpBoxY + warpBoxH / 2 - 18, warpBoxW - 36, 52, {
 active: state.snapTurn,
 accent: '#10B981',
 font: 'bold 21px Arial'
 });
 }
 else if (state.currentPage === 'navigate') {
 const catalog = this.getVRNavCatalog();
 const topCardH = 124;
 const gridY = BODY_Y + topCardH + 18;
 const footerY = BODY_BOTTOM - 74;
 const itemGap = 12;
 const cols = 4;
 const itemW = Math.floor((BODY_W - itemGap * (cols - 1)) / cols);
 const itemH = 74;
 const catGap = 10;
 const catW = Math.floor((BODY_W - catGap * (catalog.length - 1)) / catalog.length);

 panel(BODY_X, BODY_Y, BODY_W, topCardH, {
 radius: 24,
 top: 'rgba(8,18,32,0.96)',
 bottom: 'rgba(5,11,20,0.99)',
 border: 'rgba(56,189,248,0.28)',
 highlight: 'rgba(56,189,248,0.58)'
 });
 sectionTitle('DESTINATION CLASS', BODY_X + 22, BODY_Y + 16, BODY_W - 44, '#38BDF8', 'Choose a group, then tap a destination card.');
 catalog.forEach((cat, idx) => {
 const active = state.currentCategory === cat.id;
 tile(cat.label, `cat:${cat.id}`, BODY_X + idx * (catW + catGap), BODY_Y + 58, catW, 44, {
 active,
 accent: '#38BDF8',
 radius: 22,
 font: active ? 'bold 18px Arial' : '17px Arial'
 });
 });

 const curCat = catalog.find(c => c.id === state.currentCategory) || catalog[0];
 const items = curCat?.items || [];
 const perPage = 16;
 const offset = state.scrollOffset || 0;
 const page = items.slice(offset, offset + perPage);
 const pageCount = Math.max(1, Math.ceil(items.length / perPage));
 const currentPage = Math.floor(offset / perPage) + 1;

 panel(BODY_X, gridY, BODY_W, footerY - gridY - 16, {
 radius: 24,
 top: 'rgba(10,17,29,0.96)',
 bottom: 'rgba(6,10,18,0.99)',
 border: 'rgba(86,160,210,0.18)',
 highlight: 'rgba(255,255,255,0.06)'
 });
 sectionTitle('TARGET GRID', BODY_X + 22, gridY + 16, BODY_W - 44, '#7DD3FC', `${items.length} destinations in ${curCat.label}.`);
 page.forEach((item, idx) => {
 const col = idx % cols;
 const row = Math.floor(idx / cols);
 tile(item.label, `navigate-to:${item.id}`, BODY_X + 22 + col * (itemW + itemGap), gridY + 58 + row * (itemH + itemGap), itemW - 22, itemH, {
 align: 'left',
 accent: '#38BDF8',
 font: 'bold 20px Arial',
 meta: 'Jump now'
 });
 });

 const navBtnW = 182;
 if (offset > 0) tile('◀ Previous', 'scroll:prev', BODY_X, footerY, navBtnW, 56, {
 accent: '#60A5FA',
 font: 'bold 20px Arial'
 });
 chip(`${currentPage} / ${pageCount}`, BODY_X + Math.floor((BODY_W - 180) / 2), footerY + 11, 180, '#7DD3FC', {
 font: 'bold 18px Arial'
 });
 if (offset + perPage < items.length) tile('Next ▶', 'scroll:next', BODY_X + BODY_W - navBtnW, footerY, navBtnW, 56, {
 accent: '#60A5FA',
 font: 'bold 20px Arial'
 });
 tile('🛰 Reset to solar-system overview', 'reset', BODY_X, BODY_BOTTOM - 8, BODY_W, 52, {
 accent: '#38BDF8',
 font: 'bold 22px Arial'
 });
 }
 else if (state.currentPage === 'info') {
 if (info) {
 const ts = typeStyle(info.type);
 const heroH = 184;
 const descY = BODY_Y + heroH + 18;
 const descH = BODY_BOTTOM - descY - 8;
 panel(BODY_X, BODY_Y, BODY_W, heroH, {
 radius: 24,
 top: 'rgba(8,24,20,0.96)',
 bottom: 'rgba(6,13,15,0.99)',
 border: ts.accent + '44',
 highlight: ts.accent + '88',
 glow: ts.accent + '33',
 glowBlur: 18
 });
 ctx.save();
 const halo = ctx.createRadialGradient(BODY_X + BODY_W * 0.18, BODY_Y + 78, 0, BODY_X + BODY_W * 0.18, BODY_Y + 78, 140);
 halo.addColorStop(0, ts.accent + '33');
 halo.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = halo;
 ctx.fillRect(BODY_X, BODY_Y, BODY_W, heroH);
 ctx.restore();
 ctx.save();
 ctx.fillStyle = '#D7E6F5';
 ctx.font = 'bold 16px Arial';
 ctx.textAlign = 'left';
 ctx.textBaseline = 'top';
 ctx.fillText('SELECTED OBJECT', BODY_X + 28, BODY_Y + 22);
 ctx.fillStyle = '#FFFFFF';
 ctx.font = 'bold 46px Arial';
 ctx.fillText(info.name || 'Unknown Object', BODY_X + 28, BODY_Y + 48, BODY_W - 280);
 ctx.restore();
 chip(`${ts.icon}  ${(info.type || 'Celestial Object').toUpperCase()}`, BODY_X + 28, BODY_Y + 110, 280, ts.accent, {
 top: ts.badge,
 bottom: ts.badge,
 border: ts.accent + '55',
 text: ts.accent,
 font: 'bold 16px Arial'
 });

 const stats = [
 { label: 'Distance', value: info.distance != null ? (info.distance.toFixed ? info.distance.toFixed(2) + ' AU' : info.distance + ' AU') : '—' },
 { label: 'Diameter', value: info.size != null ? (info.size.toFixed ? Math.round(info.size).toLocaleString() + ' km' : info.size + ' km') : '—' },
 { label: 'Period', value: info.orbitalPeriod != null ? (info.orbitalPeriod < 5 ? info.orbitalPeriod.toFixed(2) + ' yrs' : Math.round(info.orbitalPeriod) + ' yrs') : (info.rotationPeriod != null ? info.rotationPeriod.toFixed(1) + ' hrs rot' : '—') }
 ];
 const statW = 188;
 stats.forEach((stat, idx) => {
 panel(BODY_X + BODY_W - 28 - statW * (3 - idx) - 12 * (2 - idx), BODY_Y + 32, statW, 108, {
 radius: 18,
 top: 'rgba(11,21,26,0.96)',
 bottom: 'rgba(6,10,16,0.99)',
 border: 'rgba(158,197,208,0.16)',
 highlight: 'rgba(255,255,255,0.07)'
 });
 ctx.save();
 const sx = BODY_X + BODY_W - 28 - statW * (3 - idx) - 12 * (2 - idx);
 ctx.fillStyle = 'rgba(134,171,186,0.78)';
 ctx.font = 'bold 14px Arial';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'top';
 ctx.fillText(stat.label.toUpperCase(), sx + statW / 2, BODY_Y + 48, statW - 20);
 ctx.fillStyle = '#F4F7FB';
 ctx.font = 'bold 23px Arial';
 ctx.textBaseline = 'middle';
 ctx.fillText(stat.value, sx + statW / 2, BODY_Y + 102, statW - 18);
 ctx.restore();
 });

 panel(BODY_X, descY, BODY_W, descH, {
 radius: 24,
 top: 'rgba(9,18,25,0.96)',
 bottom: 'rgba(5,10,16,0.99)',
 border: 'rgba(103,152,171,0.18)',
 highlight: 'rgba(255,255,255,0.07)'
 });
 sectionTitle('FIELD NOTES', BODY_X + 22, descY + 16, BODY_W - 44, ts.accent, 'A concise description of the selected target.');
 wrapText(info.description || 'No description available.', BODY_X + 24, descY + 62, BODY_W - 48, 28, Math.max(4, Math.floor((descH - 78) / 28)), 'rgba(169,205,222,0.86)', '21px Arial');
 }
 else {
 panel(BODY_X, BODY_Y, BODY_W, BODY_BOTTOM - BODY_Y, {
 radius: 24,
 top: 'rgba(8,22,20,0.96)',
 bottom: 'rgba(5,12,13,0.99)',
 border: 'rgba(52,211,153,0.22)',
 highlight: 'rgba(52,211,153,0.56)'
 });
 ctx.save();
 const cx = BODY_X + BODY_W / 2;
 const cy = BODY_Y + (BODY_BOTTOM - BODY_Y) / 2 - 24;
 const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
 glow.addColorStop(0, 'rgba(52,211,153,0.18)');
 glow.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = glow;
 ctx.fillRect(BODY_X, BODY_Y, BODY_W, BODY_BOTTOM - BODY_Y);
 ctx.fillStyle = '#8DE2C1';
 ctx.font = '64px Arial';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText('◎', cx, cy - 54);
 ctx.fillStyle = '#F4F7FB';
 ctx.font = 'bold 34px Arial';
 ctx.fillText('Point at an object to inspect it', cx, cy + 10, BODY_W - 80);
 ctx.fillStyle = 'rgba(160,206,192,0.82)';
 ctx.font = '22px Arial';
 ctx.fillText('Trigger selects the target and opens this page with stats and notes.', cx, cy + 56, BODY_W - 120);
 ctx.restore();
 }
 }

 panel(MAIN_X, H - PAD - STATUS_H, MAIN_W, STATUS_H, {
 radius: 20,
 top: 'rgba(8,12,20,0.98)',
 bottom: 'rgba(5,8,14,0.99)',
 border: 'rgba(113,148,187,0.12)',
 highlight: 'rgba(255,255,255,0.06)'
 });
 ctx.save();
 ctx.fillStyle = statusColor;
 ctx.font = '20px Arial';
 ctx.textAlign = 'left';
 ctx.textBaseline = 'middle';
 ctx.fillText(statusText, MAIN_X + 24, H - PAD - STATUS_H / 2, MAIN_W - 210);
 ctx.fillStyle = 'rgba(202,218,236,0.34)';
 ctx.font = '15px Arial';
 ctx.textAlign = 'right';
 ctx.fillText('v' + (window.APP_VERSION || ''), MAIN_X + MAIN_W - 22, H - PAD - STATUS_H / 2);
 ctx.restore();

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

 // Always call focusOnObject to set focusedObject, chase-cam, time speed etc.
 module.focusOnObject(target, this.camera, this.controls);

 // In VR the XR session owns camera.position — focusOnObject's camera moves
 // are ignored. Teleport the dolly instead so the user actually goes there.
 if (this.renderer.xr.isPresenting) {
 this.teleportVRToObject(target);
 // Dismiss nav menu; show compact info overlay to the side
 this._showVRInfoOverlay();
 } else {
 const info = typeof module.getObjectInfo === 'function' ? module.getObjectInfo(target) : null;
 if (info) {
 this.vrLastObjectInfo = info;
 window.app?.uiManager?.updateInfoPanel(info);
 if (this.vrNavState) this.vrNavState.currentPage = 'info';
 }
 }

 window.app?.uiManager?.setQuickNavValue?.(targetId);
 const name = target.userData?.name || 'Object';
 this.updateVRStatus('✔ → ' + name);
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

 // Always call focusOnObject to set focusedObject, chase-cam, time speed etc.
 if (module?.focusOnObject) module.focusOnObject(target, this.camera, this.controls);

 // In VR the XR session owns camera.position — focusOnObject's camera moves
 // are ignored. Teleport the dolly instead so the user actually goes there.
 if (this.renderer.xr.isPresenting) {
 this.teleportVRToObject(target);
 // Dismiss nav menu; show compact info overlay to the side
 this._showVRInfoOverlay();
 }

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
 // IMP-10: Expand logical hit target to at least 80px height to compensate for controller jitter
 const MIN_HIT_H = 80;
 let buttonFound = false;
 for (const btn of this.vrButtons) {
 const hitExpand = Math.max(0, (MIN_HIT_H - btn.h) / 2);
 if (x >= btn.x && x <= btn.x + btn.w && 
 y >= btn.y - hitExpand && y <= btn.y + btn.h + hitExpand) {
 if (DEBUG.VR) console.log(`[VR] Button clicked: "${btn.label}" - Action: ${btn.action}`);
 this.handleVRAction(btn.action);
 this.flashVRButton(btn);
 this.triggerVRHaptic(index, 0.4, 60); // Light haptic click
 buttonFound = true;
 break;
 }
 }
 
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
 }
 this._showVRInfoOverlay();
 this.updateVRStatus('\uD83D\uDD0D Inspecting: ' + objName);
 this.requestVRMenuRefresh();
 this.triggerVRHaptic(index, 0.8, 100); // Stronger pulse for close zoom
 } else {
 // Normal focus – teleport dolly, show info overlay to the side
 module.focusOnObject(hitObject, this.camera, this.controls);
 if (this.renderer.xr.isPresenting) this.teleportVRToObject(hitObject);
 if (DEBUG.VR) console.log('[VR] Focused on:', hitObject.name);
 if (infoForPanel) {
 this.vrLastObjectInfo = infoForPanel;
 app.uiManager?.updateInfoPanel(infoForPanel);
 }
 this._showVRInfoOverlay();
 this.updateVRStatus('\u2714\uFE0F ' + objName);
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
 const handedness = controller.userData?.handedness ||
 (index === 0 ? 'left' : 'right');

 // RIGHT GRIP while menu is open: drag the panel to reposition it
 if (handedness === 'right' && this.vrUIPanel?.visible) {
 this.vrPanelDrag.active = true;
 this.vrPanelDrag.controllerIndex = index;
 // Both panel and controller are children of dolly — offset is dolly-local
 this._vrPanelDragOffset.subVectors(this.vrUIPanel.position, controller.position);
 this.triggerVRHaptic(index, 0.4, 50);
 if (DEBUG.VR) console.log('[VR] Panel drag START');
 this.updateVRStatus('✋ Move panel — release grip to drop');
 return; // Don’t start grab-to-rotate while dragging panel
 }

 // LEFT GRIP: grab-to-rotate the scene
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
 // End panel drag (right grip)
 if (this.vrPanelDrag.active && this.vrPanelDrag.controllerIndex === index) {
 this.vrPanelDrag.active = false;
 this.vrPanelDrag.controllerIndex = -1;
 this._billboardVRPanel(); // face user wherever it landed
 this.triggerVRHaptic(index, 0.2, 30);
 if (DEBUG.VR) console.log('[VR] Panel drag END');
 this.updateVRStatus('✨ Ready for interaction');
 return;
 }
 // End grab-to-rotate (left grip)
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
 
 const targetPosition = this._vrTargetPos;
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
 const cameraDirection = this._vrDirScratch;
 xrCamera.getWorldDirection(cameraDirection);
 
 // Move dolly to position behind object (from camera perspective)
 const newPosition = this._vrPosScratch.copy(targetPosition).sub(
 cameraDirection.multiplyScalar(distance)
 );
 
 // Smoothly move dolly
 this.dolly.position.copy(newPosition);
 if (DEBUG.VR) console.log(`[VR] Zoomed to ${object.userData?.name || 'object'} at distance ${distance.toFixed(2)}`);
 }

 /**
 * Teleport the VR dolly to a good viewing position for the given object.
 * This is the VR equivalent of focusOnObject() camera movement — in VR the
 * XR session owns camera.position so we must move the dolly instead.
 */
 teleportVRToObject(object) {
 if (!this.dolly || !object) return;

 const ud = object.userData || {};
 const targetPos = this._vrTargetPos;
 object.getWorldPosition(targetPos);

 // Mirror the distance logic from SolarSystemModule.focusOnObject
 const radius = ud.radius || ud.actualSize || 1;
 let distance;
 if (ud.type === 'constellation' || ud.type === 'galaxy' || ud.type === 'nebula') {
 distance = (ud.radius || 500) * 3;
 } else if (ud.isSpacecraft && ud.orbitPlanet) {
 distance = Math.max(radius * 8, 0.5);
 } else if (ud.type === 'moon' || ud.parentPlanet) {
 distance = Math.max(radius * 3, 0.3);
 } else if (ud.type === 'DwarfPlanet') {
 distance = Math.max(radius * 2, 0.3);
 } else if (ud.isComet) {
 distance = 40;
 } else if (ud.isSpacecraft) {
 distance = Math.max(radius * 5, 1);
 } else if (ud.type === 'asteroidBelt' || ud.type === 'kuiperBelt') {
 distance = radius * 3;
 } else if (ud.type === 'oortCloud') {
 distance = radius * 0.6;
 } else if (ud.type === 'heliopause') {
 distance = radius * 0.5;
 } else {
 // Planets: allow close surface views (1.5x radius = just above surface)
 distance = Math.max(radius * 2.5, 2);
 }

 // Direction from origin → target (planets orbit sun at origin, so this
 // places the user "outside" the object with origin/sun behind them).
 // For objects near origin (sun) use a default approach vector.
 const approachDir = this._vrDirScratch;
 const flatDist = Math.sqrt(targetPos.x * targetPos.x + targetPos.z * targetPos.z);
 if (flatDist > 1) {
 approachDir.set(targetPos.x / flatDist, 0, targetPos.z / flatDist);
 } else {
 approachDir.set(0, 0, 1); // default: come from +Z for sun/origin
 }

 // Position dolly behind/slightly above the object
 const newDollyPos = this._vrPosScratch.set(
 targetPos.x + approachDir.x * distance,
 targetPos.y + distance * 0.3,
 targetPos.z + approachDir.z * distance
 );

 // Rotate dolly so the user faces the object.
 // dx/dz is the vector from dolly toward the target (i.e. -approachDir * distance).
 // We need atan2(-dx, -dz) = atan2(approachDir.x, approachDir.z) so the camera's
 // -Z axis points at the target (Three.js: dolly.rotation.y=θ → camera faces (-sinθ, 0, -cosθ)).
 const dx = targetPos.x - newDollyPos.x;
 const dz = targetPos.z - newDollyPos.z;
 const facing = Math.atan2(-dx, -dz); // ← was atan2(dx, dz) which faced AWAY from target

 this.dolly.position.copy(newDollyPos);
 this.dolly.rotation.set(0, facing, 0);
 this.dolly.updateMatrixWorld(true);

 // Adjust near clip plane for small objects in VR (prevents "donut" clipping)
 const nearForVR = Math.min(10.0, Math.max(radius * 0.5, 0.01));
 this.camera.near = nearForVR;
 this.camera.updateProjectionMatrix();

 const name = ud.name || object.name || 'object';
 if (DEBUG.VR) {
 console.log(`[VR] Teleported to "${name}" — dolly (${newDollyPos.x.toFixed(1)}, ${newDollyPos.y.toFixed(1)}, ${newDollyPos.z.toFixed(1)}), dist=${distance.toFixed(1)}, near=${nearForVR.toFixed(3)}, facing ${(facing * 180 / Math.PI).toFixed(1)}°`);
 }
 }


 // ═══════════════════════════════════════════════════════════
 // RADIAL QUICK-NAV WHEEL (left thumbstick hold)
 // ═══════════════════════════════════════════════════════════

 _vrRadialItems() {
    return [
      { id: 'sun',     label: '\u2600\uFE0F Sun',      color: '#FFD700' },
      { id: 'mercury', label: '\u263F Mercury',  color: '#A8A8A8' },
      { id: 'venus',   label: '\u2640 Venus',    color: '#E8C87A' },
      { id: 'earth',   label: '\uD83C\uDF0D Earth',    color: '#4FC3F7' },
      { id: 'mars',    label: '\u2642 Mars',     color: '#EF5350' },
      { id: 'jupiter', label: '\u2643 Jupiter',  color: '#FFA726' },
      { id: 'saturn',  label: '\u2644 Saturn',   color: '#FFCC80' },
      { id: 'neptune', label: '\u2646 Neptune',  color: '#5C6BC0' },
    ];
  }

  _ensureVRRadialPanel() {
    if (this._vrRadialPanel) return;
    const SZ = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SZ; canvas.height = SZ;
    this._vrRadialCanvas = canvas;
    this._vrRadialCtx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(0.52, 0.52);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    this._vrRadialPanel = new THREE.Mesh(geo, mat);
    this._vrRadialPanel.renderOrder = 20;
    this._vrRadialPanel.frustumCulled = false;
    const leftCtrl = this.controllers[0];
    if (leftCtrl) {
      this._vrRadialPanel.position.set(0, 0.06, -0.06);
      this._vrRadialPanel.rotation.x = -Math.PI / 5;
      leftCtrl.add(this._vrRadialPanel);
    } else { this.dolly.add(this._vrRadialPanel); }
    this._vrRadialPanel.visible = false;
  }

  _drawVRRadialWheel() {
    this._ensureVRRadialPanel();
    const ctx = this._vrRadialCtx; if (!ctx) return;
    const SZ = 512, CX = SZ / 2, CY = SZ / 2;
    const R_OUT = 230, R_IN = 68, R_LABEL = 160;
    const items = this._vrRadialItems();
    const SLICE = (Math.PI * 2) / items.length; const GAP = 0.04;
    ctx.clearRect(0, 0, SZ, SZ);
    const rimGlow = ctx.createRadialGradient(CX, CY, R_IN, CX, CY, R_OUT + 10);
    rimGlow.addColorStop(0, 'rgba(0,180,255,0.06)'); rimGlow.addColorStop(1, 'rgba(0,60,120,0.18)');
    ctx.fillStyle = rimGlow; ctx.beginPath(); ctx.arc(CX, CY, R_OUT + 10, 0, Math.PI * 2); ctx.fill();
    items.forEach((item, idx) => {
      const hot = this._vrRadialHot === idx;
      const startA = -Math.PI / 2 + idx * SLICE + GAP / 2, endA = startA + SLICE - GAP;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, R_OUT, startA, endA); ctx.closePath();
      const grad = ctx.createRadialGradient(CX, CY, R_IN, CX, CY, R_OUT);
      grad.addColorStop(0, hot ? item.color + 'CC' : 'rgba(10,20,40,0.92)');
      grad.addColorStop(1, hot ? item.color + '44' : 'rgba(6,12,28,0.88)');
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = hot ? item.color : 'rgba(60,120,180,0.45)';
      ctx.lineWidth = hot ? 2.5 : 1; ctx.stroke();
      if (hot) { ctx.save(); ctx.shadowColor = item.color; ctx.shadowBlur = 16; ctx.stroke(); ctx.restore(); }
      ctx.restore();
      const midA = startA + (SLICE - GAP) / 2;
      ctx.save();
      ctx.font = hot ? 'bold 26px Arial' : '22px Arial';
      ctx.fillStyle = hot ? item.color : 'rgba(180,220,255,0.8)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (hot) { ctx.shadowColor = item.color; ctx.shadowBlur = 10; }
      ctx.fillText(item.label, CX + Math.cos(midA) * R_LABEL, CY + Math.sin(midA) * R_LABEL);
      ctx.restore();
    });
    const holeBg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R_IN);
    holeBg.addColorStop(0, 'rgba(4,10,24,0.96)'); holeBg.addColorStop(1, 'rgba(8,16,36,0.90)');
    ctx.fillStyle = holeBg; ctx.beginPath(); ctx.arc(CX, CY, R_IN, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(60,130,200,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(CX, CY, R_IN, 0, Math.PI * 2); ctx.stroke();
    const hotItem = this._vrRadialHot >= 0 ? items[this._vrRadialHot] : null;
    ctx.fillStyle = hotItem ? hotItem.color : 'rgba(100,160,200,0.6)';
    ctx.font = hotItem ? 'bold 18px Arial' : '15px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(hotItem ? 'Release \u2192 go' : 'Tilt to choose', CX, CY);
    if (this._vrRadialPanel?.material?.map) this._vrRadialPanel.material.map.needsUpdate = true;
  }

  _showVRRadialWheel() {
    this._ensureVRRadialPanel();
    this._vrRadialHot = -1; this._vrRadialVisible = true;
    this._drawVRRadialWheel();
    if (this._vrRadialPanel) this._vrRadialPanel.visible = true;
    this.triggerVRHaptic(0, 0.25, 60);
  }

  _hideVRRadialWheel() {
    this._vrRadialVisible = false;
    if (this._vrRadialPanel) this._vrRadialPanel.visible = false;
  }

  _confirmVRRadialSelection() {
    const hot = this._vrRadialHot;
    this._hideVRRadialWheel();
    if (hot >= 0) {
      const item = this._vrRadialItems()[hot];
      this.triggerVRHaptic(0, 0.5, 80); this.triggerVRHaptic(1, 0.3, 60);
      this.navigateVRTarget(item.id);
    }
  }

 /**
 * Place the menu panel directly in the user’s current line of sight at eye level.
 * Uses the HMD camera position + forward direction in dolly-local space.
 */
 _positionMenuAtEyeLevel() {
 if (!this.vrUIPanel) return;
 // camera.position is dolly-local and reflects actual HMD position in VR
 const eyeY = this.camera.position.y;
 // Horizontal forward direction in dolly space
 const forward = this._vrForwardScratch.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
 forward.y = 0;
 if (forward.lengthSq() < 0.01) forward.set(0, 0, -1);
 forward.normalize();
 const dist = 2.2;
 this.vrUIPanel.position.set(
 this.camera.position.x + forward.x * dist,
 eyeY, // exact eye height — no vertical offset
 this.camera.position.z + forward.z * dist
 );
 this._billboardVRPanel();
 }

 /**
 * Rotate the panel to face the user (yaw only — keeps panel vertical, no tilt).
 * lookAt() requires WORLD-space coords. camera.position is dolly-local, so we
 * must call getWorldPosition() — otherwise the billboard breaks after any dolly move.
 */
 _billboardVRPanel() {
 if (!this.vrUIPanel) return;
 // Get camera world position (correct even after dolly has been moved/rotated)
 this.camera.getWorldPosition(this._vrBillboardPos);
 this.vrUIPanel.lookAt(this._vrBillboardPos);
 // Strip pitch/roll so panel stays perfectly vertical (yaw only)
 const yRot = this.vrUIPanel.rotation.y;
 this.vrUIPanel.rotation.set(0, yRot, 0);
 }

 // ═══════════════════════════════════════════════════════════
 // WARP EFFECT — 3D star-streak tunnel attached to dolly
 // ═══════════════════════════════════════════════════════════

 /** Lazy-create and show the warp streak LineSegments effect. */
 _activateVRWarpEffect() {
 if (!this.dolly) return;
 if (!this._vrWarpEffect) {
 const COUNT = 220;
 const pos = new Float32Array(COUNT * 6); // 2 verts × 3 floats each
 // Spread streaks in a tube along -Z (forward in camera space = away from scene)
 for (let i = 0; i < COUNT; i++) {
 const theta = Math.random() * Math.PI * 2;
 const r = 0.4 + Math.random() * 9;
 const z = -(5 + Math.random() * 180);
 const len = 2 + Math.random() * 16;
 const x = Math.cos(theta) * r, y = Math.sin(theta) * r;
 const i6 = i * 6;
 pos[i6] = x; pos[i6 + 1] = y; pos[i6 + 2] = z;
 pos[i6 + 3] = x * 0.88; pos[i6 + 4] = y * 0.88; pos[i6 + 5] = z + len;
 }
 const geo = new THREE.BufferGeometry();
 geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
 const mat = new THREE.LineBasicMaterial({
 color: 0x00CCFF,
 transparent: true,
 opacity: 0.72,
 blending: THREE.AdditiveBlending,
 depthWrite: false,
 });
 this._vrWarpEffect = new THREE.LineSegments(geo, mat);
 this._vrWarpPositions = pos;
 this.dolly.add(this._vrWarpEffect);
 }
 this._vrWarpEffect.visible = true;
 this._vrWarpEffect.position.copy(this.camera.position); // track HMD in dolly space
 }

 /** Hide the warp streak effect. */
 _deactivateVRWarpEffect() {
 if (this._vrWarpEffect) this._vrWarpEffect.visible = false;
 }

 _alignVRWarpEffect(travelWorld) {
 if (!this._vrWarpEffect || !this.dolly || !travelWorld || travelWorld.lengthSq() < 0.0001) return;
 this._vrWarpInverseQuat.copy(this.dolly.quaternion).invert();
 this._vrWarpLocalDir.copy(travelWorld).normalize().applyQuaternion(this._vrWarpInverseQuat);
 this._vrWarpQuat.setFromUnitVectors(this._vrForwardScratch.set(0, 0, -1), this._vrWarpLocalDir);
 this._vrWarpEffect.quaternion.copy(this._vrWarpQuat);
 }

 /**
 * Per-frame update: scroll all streaks toward the camera, recycle ones that pass it.
 * Called only while warp is active. Uses pre-allocated Float32Array — zero heap alloc.
 */
 _updateVRWarpEffect() {
 const pos = this._vrWarpPositions;
 if (!pos) return;
 const COUNT = pos.length / 6;
 const speed = 2.8; // units per frame at 72 Hz — feels fast without being nauseating
 for (let i = 0; i < COUNT; i++) {
 const i6 = i * 6;
 pos[i6 + 2] += speed; // scroll start Z toward camera (+Z = toward)
 pos[i6 + 5] += speed; // scroll end Z
 // Recycle when the back end passes the camera (+2 units behind)
 if (pos[i6 + 5] > 2) {
 const theta = Math.random() * Math.PI * 2;
 const r = 0.4 + Math.random() * 9;
 const z = -(140 + Math.random() * 60);
 const len = 2 + Math.random() * 16;
 const x = Math.cos(theta) * r, y = Math.sin(theta) * r;
 pos[i6] = x; pos[i6 + 1] = y; pos[i6 + 2] = z;
 pos[i6 + 3] = x * 0.88; pos[i6 + 4] = y * 0.88; pos[i6 + 5] = z + len;
 }
 }
 this._vrWarpEffect.geometry.attributes.position.needsUpdate = true;
 }

 /**
 * After navigating to an object: switch the panel to the info page and
 * move it to the right side of the view so it doesn’t block the scene.
 */
 _showVRInfoOverlay() {
 if (!this.vrUIPanel) return;
 if (this.vrNavState) this.vrNavState.currentPage = 'info';
 // Place panel to the right of where the user is facing, slightly lower
 const forward = this._vrForwardScratch.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
 forward.y = 0;
 if (forward.lengthSq() < 0.01) forward.set(0, 0, -1);
 forward.normalize();
 const right = this._vrRightScratch.crossVectors(forward, this._vrUpVector).normalize();
 const dist = 2.0;
 this.vrUIPanel.position.set(
 this.camera.position.x + forward.x * dist + right.x * 1.2,
 this.camera.position.y - 0.1, // slightly below eye level for comfort
 this.camera.position.z + forward.z * dist + right.z * 1.2
 );
 this._billboardVRPanel();
 this.vrUIPanel.visible = true;
 this.requestVRMenuRefresh();
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
 if (window.app?.solarSystemModule?.scientificMode) {
 this.updateVRStatus('🧪 Scientific mode enabled');
 } else {
 this.updateVRStatus('📚 Educational mode enabled');
 }
 scheduleRefresh(120); break;

 case 'sound': {
 const am = window.audioManager;
 if (am) {
 am.enabled = !am.enabled;
 safeSetItem('space_voyage_sound', am.enabled ? 'true' : 'false');
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
 this._setLasersVisible(!this.lasersVisible);
 this.updateVRStatus('🎯 Lasers ' + (this.lasersVisible ? 'ON' : 'OFF'));
 scheduleRefresh(); break;

 case 'starship':
 this.vrStarshipMode = !this.vrStarshipMode;
 if (this.vrStarshipMode) {
 this.updateVRStatus('🚀 STARSHIP MODE ENGAGED • 20× speed');
 this.triggerVRHaptic(0, 0.9, 220);
 this.triggerVRHaptic(1, 0.9, 220);
 } else {
 this.updateVRStatus('🛸 Starship mode OFF • normal speed');
 }
 scheduleRefresh(); break;

 case 'snapTurn':
 this.vrSnapTurn = !this.vrSnapTurn;
 this.updateVRStatus('🔄 Snap turn ' + (this.vrSnapTurn ? 'ON (30°)' : 'OFF (smooth)'));
 scheduleRefresh(); break;

 case 'reset':
 if (this.renderer.xr.isPresenting) {
 // In VR camera.position is owned by the HMD — move the dolly back to
 // the VR spawn point instead
 this.dolly.position.set(0, 0, 200);
 this.dolly.rotation.set(0, 0, 0);
 this.dolly.updateMatrixWorld(true);
 } else {
 this.resetCamera();
 }
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
 session?.end().catch(err => { if (DEBUG && DEBUG.enabled) console.error('[VR] Error ending session:', err); });
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

 /** Show or hide laser visuals on all controllers using cached refs. */
 _setLasersVisible(visible) {
 this.lasersVisible = visible;
 if (!this.controllers) return;
 for (const ctrl of this.controllers) {
 const l = ctrl.userData.laserMesh;
 const p = ctrl.userData.pointerMesh;
 const c = ctrl.userData.coneMesh;
 if (l) l.visible = visible;
 if (p) p.visible = visible;
 if (c) c.visible = visible;
 }
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
 if (!this.renderer.xr.isPresenting || !this.controllers || !this.lasersVisible) {
 if (this._vrReticle) this._vrReticle.visible = false;
 return;
 }

 // Keep full-rate raycasts while VR panel is open for responsive UI interaction;
 // otherwise raycast every other frame to reduce CPU/GC pressure on Quest/mobile.
 const uiOpen = !!(this.vrUIPanel && this.vrUIPanel.visible);
 const shouldRaycastThisFrame = uiOpen || ((this._vrLaserFrame++ & 1) === 0);

 // Detect sprint (trigger held on any controller)
 let sprintActive = false;
 const session = this.renderer.xr.getSession();
 if (session) {
 for (const src of session.inputSources) {
 if (src.gamepad?.buttons[0]?.pressed) { sprintActive = true; break; }
 }
 }

 const LASER_DEFAULT_LENGTH = 10;
 this._vrRaycaster.far = 2000; // limit to solar-system range

 for (const controller of this.controllers) {
 // Use cached refs — avoids getObjectByName graph traversal every frame
 const laser = controller.userData.laserMesh;
 const pointer = controller.userData.pointerMesh;
 const cone = controller.userData.coneMesh;

 if (!laser?.visible) continue;

 // Fallback state for frames where we intentionally skip raycasts
 if (controller.userData._laserVisualDist === undefined) {
 controller.userData._laserVisualDist = LASER_DEFAULT_LENGTH;
 controller.userData._laserHasHit = false;
 }

 // Aim raycaster along controller forward (reuse pre-allocated objects)
 this._vrTempMatrix.identity().extractRotation(controller.matrixWorld);
 this._vrRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
 this._vrRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(this._vrTempMatrix);

 let hasHit = controller.userData._laserHasHit;
 let visualDist = controller.userData._laserVisualDist;
 if (shouldRaycastThisFrame) {
 this._vrIntersections.length = 0;
 // Use pickableObjects (planets/moons/comets/satellites/spacecraft/sun) — avoids testing
 // ~400 meshes including galaxies, belt particles, constellation lines, orbit rings, etc.
 const ssm = window.app?.solarSystemModule;
 const allPick = ssm?.pickableObjects || ssm?.objects || this.scene.children;
 // Further narrow by distance: objects farther than 3000 units can't be usefully selected in VR
 const dollyPos = this.dolly ? this.dolly.position : this.camera.position;
 const MAX_PICK_DSQ = 3000 * 3000;
 const pickTargets = allPick.length > 80
 ? allPick.filter(o => o.visible && (o.position.distanceToSquared(dollyPos) < MAX_PICK_DSQ))
 : allPick;
 this._vrRaycaster.intersectObjects(pickTargets, true, this._vrIntersections);
 hasHit = this._vrIntersections.length > 0;
 visualDist = hasHit ? Math.min(this._vrIntersections[0].distance, LASER_DEFAULT_LENGTH) : LASER_DEFAULT_LENGTH;
 controller.userData._laserHasHit = hasHit;
 controller.userData._laserVisualDist = visualDist;
 }

 // Colour: magenta=hyperwarp, bright-cyan=starship, orange=sprint, green=hit, cyan=idle
 const col = (this.vrStarshipMode && sprintActive) ? 0xff00ff
 : this.vrStarshipMode ? 0x00ccff
 : sprintActive ? 0xff6600
 : hasHit ? 0x00ff00 : 0x00ffff;
 laser.material.color.setHex(col);
 if (pointer) pointer.material.color.setHex(col);
 if (cone) cone.material.color.setHex(col);

 // Teleport reticle: show only on the first controller that intersects an object
 if (this._vrReticle) {
 if (hasHit && shouldRaycastThisFrame && this._vrIntersections.length > 0) {
 const hit = this._vrIntersections[0];
 this._vrReticle.position.copy(hit.point);
 // Orient ring to face the camera (billboard yaw-only)
 this._vrReticle.lookAt(this.camera.position);
 this._vrReticle.visible = true;
 } else if (!hasHit) {
 this._vrReticle.visible = false;
 }
 }

 // Stretch beam and move dot to hit point
 laser.scale.y = visualDist / LASER_DEFAULT_LENGTH;
 laser.position.z = -(visualDist / 2);
 if (pointer) pointer.position.z = -visualDist;
 }

 this._vrRaycaster.far = Infinity; // restore default
 }
 
 updateXRMovement() {
 // Only update in VR/AR mode
 if (!this.renderer.xr.isPresenting) return;
 
 // Ensure dolly exists
 if (!this.dolly) {
 if (DEBUG && DEBUG.VR) console.warn('⚠️ Dolly not found!');
 return;
 }
 
 // Left GRIP = grab-to-rotate scene, Right GRIP = drag VR panel
 // Right thumbstick X-axis also provides turning
 
 // Get controller inputs for movement
 const session = this.renderer.xr.getSession();
 if (!session) return;
 
 const inputSources = session.inputSources;
 this._vrWarpTravel.set(0, 0, 0);
 
 // Use this.camera.getWorldDirection() — in VR mode Three.js updates this camera's
 // world pose from the HMD each frame, so it reliably reflects where the user looks.
 // renderer.xr.getCamera() returns an ArrayCamera group whose getWorldDirection
 // is less reliable (it's the combined stereo rig, not a single-eye pose).
 const cameraForward = this._vrCameraForward;
 this.camera.getWorldDirection(cameraForward);
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
 // Lazily expand the array if more sources appear after session start
 if (!this.previousButtonStates[i]) this.previousButtonStates[i] = {};

 if (!gamepad) continue;
 
 // ============================================
 // MENU TOGGLE (X on LEFT btn4, or A on RIGHT btn4)
 // Both buttons open/close the VR menu for reliability
 // ============================================
 const isMenuButton = (handedness === 'left' && gamepad.buttons[4]) ||
 (handedness === 'right' && gamepad.buttons[4]) ||
 (handedness === 'none' && gamepad.buttons[4]);
 if (isMenuButton) {
 const menuBtn = gamepad.buttons[4];
 if (menuBtn.pressed) {
 // Check if this is a new press (not held from previous frame)
 const prevState = this.previousButtonStates[i][4] || false;
 if (!prevState) {
 // NEW PRESS - Toggle VR menu
 if (!this.vrUIPanel) {
 if (DEBUG && DEBUG.VR) console.warn('⚠️ VR UI Panel not initialized!');
 } else {
 this.vrUIPanel.visible = !this.vrUIPanel.visible;
 
 // Position panel in front of user when showing
 if (this.vrUIPanel.visible) {
 // Return to controls page so Starship Mode / time controls are always immediately accessible.
 // (Page is left on 'info' after every navigation action.)
 if (this.vrNavState && this.vrNavState.currentPage === 'info') {
 this.vrNavState.currentPage = 'controls';
 }
 this._positionMenuAtEyeLevel();

 // Always force lasers ON when menu opens
 this._setLasersVisible(true);

 if (DEBUG.VR) console.log('📋 [VR] Menu TOGGLED (X button)');
 this.updateVRStatus('📋 VR Menu Active');
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
 // THUMBSTICK PRESS (Button 3)
 // LEFT : hold ≥8 frames → radial quick-nav wheel; short tap → pause
 // RIGHT: tap → pause toggle
 // ============================================
 const thumbstickButton = gamepad.buttons[3];
 if (thumbstickButton && thumbstickButton.pressed) {
 const prevState = this.previousButtonStates[i][3] || false;
 if (handedness === 'left') {
 this._vrRadialPressFrames = (this._vrRadialPressFrames || 0) + 1;
 if (this._vrRadialPressFrames === 8) {
 // Held long enough — show radial wheel
 this._showVRRadialWheel();
 }
 } else if (!prevState) {
 // Right thumbstick tap = pause toggle
 const app = window.app || this;
 if (app.timeSpeed === 0) { app.timeSpeed = 1; this.updateVRStatus('\u25B6 Playing'); }
 else { app.timeSpeed = 0; this.updateVRStatus('\u23F8 Paused'); }
 this.requestVRMenuRefresh();
 }
 this.previousButtonStates[i][3] = true;
 } else {
 if (handedness === 'left') {
 const wasHeld = (this._vrRadialPressFrames || 0) >= 8;
 if (wasHeld && this._vrRadialVisible) {
 // Released while wheel was showing — navigate to highlighted sector
 this._confirmVRRadialSelection();
 } else if ((this._vrRadialPressFrames || 0) > 0 && (this._vrRadialPressFrames || 0) < 8) {
 // Short tap — pause toggle
 const app = window.app || this;
 if (app.timeSpeed === 0) { app.timeSpeed = 1; this.updateVRStatus('\u25B6 Playing'); }
 else { app.timeSpeed = 0; this.updateVRStatus('\u23F8 Paused'); }
 this.requestVRMenuRefresh();
 }
 this._vrRadialPressFrames = 0;
 }
 this.previousButtonStates[i][3] = false;
 }
 
 // Check trigger (button 0 = trigger); track both-trigger for warp
 if (gamepad.buttons.length > 0 && gamepad.buttons[0].pressed) {
 sprintMultiplier = 3.0;
 }
 if (!this._vrTriggerPressed) this._vrTriggerPressed = {};
 this._vrTriggerPressed[handedness] = !!(gamepad.buttons[0]?.pressed);
 
 // Robustly read thumbstick axes — axis layout varies by Quest firmware / browser:
 // Some builds put thumbstick on axes[0,1]; others on axes[2,3].
 // When 4 axes are present, compare magnitudes and use whichever pair is active.
 let stickX = 0, stickY = 0;
 const ax = gamepad.axes;
 if (ax.length >= 4) {
 const mag01 = Math.abs(ax[0]) + Math.abs(ax[1]);
 const mag23 = Math.abs(ax[2]) + Math.abs(ax[3]);
 if (mag23 >= mag01) { stickX = ax[2]; stickY = ax[3]; }
 else { stickX = ax[0]; stickY = ax[1]; }
 } else if (ax.length >= 2) {
 stickX = ax[0]; stickY = ax[1];
 }
 
 const deadzone = 0.15;
 
 // ============================================
 // LEFT CONTROLLER: MOVEMENT (like FPS games)
 // ============================================
 if (handedness === 'left') {
 const starshipMult = this.vrStarshipMode ? 20.0 : 1.0;
 const baseSpeed = 0.40 * sprintMultiplier * starshipMult;

 // While radial wheel is open: use stick to select sector (no movement)
 if (this._vrRadialVisible) {
 const mag = Math.sqrt(stickX * stickX + stickY * stickY);
 const newHot = mag > 0.45
 ? Math.round((Math.atan2(stickX, -stickY) / (Math.PI * 2) + 1) * 8) % 8
 : -1;
 if (newHot !== this._vrRadialHot) {
 this._vrRadialHot = newHot;
 this._drawVRRadialWheel(); // Redraw highlight
 if (newHot >= 0) this.triggerVRHaptic(0, 0.08, 20); // Light tick
 }
 } else if (!this.grabRotateState.active &&
 (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone)) {
 // Forward/back: negate stickY (forward stick = negative Y on Quest)
 this._vrMoveScratch.copy(cameraForward).multiplyScalar(-stickY * baseSpeed);
 this.dolly.position.add(this._vrMoveScratch);
 this._vrWarpTravel.add(this._vrMoveScratch);
 // Strafe: right = +X
 this._vrMoveScratch.copy(cameraRight).multiplyScalar(stickX * baseSpeed);
 this.dolly.position.add(this._vrMoveScratch);
 this._vrWarpTravel.add(this._vrMoveScratch);
 }
 
 // UP/DOWN with Y button (X button now used for menu)
 if (gamepad.buttons[5] && gamepad.buttons[5].pressed) {
 // Y button: Toggle between UP/DOWN based on thumbstick Y
 if (Math.abs(stickY) > deadzone) {
 // Use thumbstick Y to control up/down when Y is held
 this._vrMoveScratch.set(0, -stickY * baseSpeed * 0.8, 0);
 this.dolly.position.add(this._vrMoveScratch);
 this._vrWarpTravel.add(this._vrMoveScratch);
 } else {
 // Default: Y button moves UP
 this._vrMoveScratch.set(0, baseSpeed * 0.8, 0);
 this.dolly.position.add(this._vrMoveScratch);
 this._vrWarpTravel.add(this._vrMoveScratch);
 }
 }
 }
 
 // ============================================
 // RIGHT CONTROLLER: TURN & VERTICAL
 // ============================================
 if (handedness === 'right') {
 const starshipMult = this.vrStarshipMode ? 20.0 : 1.0;
 const turnSpeed = 0.03;
 const vertSpeed = 0.25 * sprintMultiplier * starshipMult;
 
 // TURN LEFT/RIGHT (only if NOT grab-rotating)
 // vrSnapTurn (default on): 30° discrete snaps to prevent VR sickness.
 // Smooth turn available when vrSnapTurn=false.
 if (!this.grabRotateState.active && Math.abs(stickX) > deadzone) {
 if (this.vrSnapTurn) {
 const SNAP_ANGLE = Math.PI / 6; // 30°
 if (!this._vrSnapCooldown[i] && Math.abs(stickX) > 0.7) {
 this._vrTurnQuat.setFromAxisAngle(this._vrUpVector, -Math.sign(stickX) * SNAP_ANGLE);
 this.dolly.quaternion.premultiply(this._vrTurnQuat);
 this._vrSnapCooldown[i] = true;
 this.triggerVRHaptic(i, 0.1, 30);
 }
 if (Math.abs(stickX) < 0.3) this._vrSnapCooldown[i] = false; // reset when stick released
 } else {
 const turnSpeed = 0.03;
 this._vrTurnQuat.setFromAxisAngle(this._vrUpVector, -stickX * turnSpeed);
 this.dolly.quaternion.premultiply(this._vrTurnQuat);
 }
 }
 
 // VERTICAL MOVEMENT (Up/Down in world space)
 if (Math.abs(stickY) > deadzone) {
 // Negative Y = up, Positive Y = down (inverted for intuitive)
 this._vrMoveScratch.set(0, -stickY * vertSpeed, 0);
 this.dolly.position.add(this._vrMoveScratch);
 this._vrWarpTravel.add(this._vrMoveScratch);
 }
 
 // UP/DOWN with B button (A button is now menu toggle)
 if (gamepad.buttons[5] && gamepad.buttons[5].pressed) {
 // B button: Move UP
 this._vrMoveScratch.set(0, 0.2 * sprintMultiplier, 0);
 this.dolly.position.add(this._vrMoveScratch);
 this._vrWarpTravel.add(this._vrMoveScratch);
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
 
 // Horizontal rotation only via quaternion — no pitch.
 // Pitch (dolly.rotation.x) accumulated via Euler caused gimbal-lock
 // that flipped the perceived forward/backward direction after a few
 // combined grab-rotate + right-stick turn sequences.
 const rotationSensitivity = 2.5;
 this._vrTurnQuat.setFromAxisAngle(this._vrUpVector, -delta.x * rotationSensitivity);
 this.dolly.quaternion.premultiply(this._vrTurnQuat);
 
 // Update last position for next frame
 this.grabRotateState.lastPosition.copy(currentPosition);
 }
 }

 // ── Dynamic VR near-plane: prevent clipping when flying close to objects ──
 // Check distance to nearest planet/moon and lower near plane accordingly.
 // Throttled to every 10th frame to keep hot-path cheap.
 if ((this._vrLaserFrame & 0xF) === 0) { // every 16 frames
 const solarSystem = window.app?.solarSystemModule;
 if (solarSystem?.planets) {
 this.camera.getWorldPosition(this._vrNearCheckPos);
 let minDist = Infinity;
 // Check sun
 if (solarSystem.sun?.position) {
 solarSystem.sun.getWorldPosition(this._vrPosScratch);
 const d = this._vrNearCheckPos.distanceTo(this._vrPosScratch);
 const r = solarSystem.sun.userData?.radius || solarSystem.sun.geometry?.boundingSphere?.radius || 5;
 minDist = Math.max(d - r, 0.01);
 }
 // Check all planets and moons (use two separate passes to avoid allocating a wrapper array)
 if (solarSystem.planets) {
 for (const key in solarSystem.planets) {
 const mesh = solarSystem.planets[key];
 if (!mesh?.position) continue;
 mesh.getWorldPosition(this._vrPosScratch);
 const d = this._vrNearCheckPos.distanceTo(this._vrPosScratch);
 const r = mesh.userData?.radius || mesh.geometry?.boundingSphere?.radius || 1;
 const sd = Math.max(d - r, 0.01);
 if (sd < minDist) minDist = sd;
 }
 }
 if (solarSystem.moons) {
 for (const key in solarSystem.moons) {
 const mesh = solarSystem.moons[key];
 if (!mesh?.position) continue;
 mesh.getWorldPosition(this._vrPosScratch);
 const d = this._vrNearCheckPos.distanceTo(this._vrPosScratch);
 const r = mesh.userData?.radius || mesh.geometry?.boundingSphere?.radius || 1;
 const sd = Math.max(d - r, 0.01);
 if (sd < minDist) minDist = sd;
 }
 }
 // Near = 5% of surface distance, clamped 0.01–0.1.
 // Max MUST stay below the VR panel distance (2.2 m); 10.0 was clipping the
 // panel and any spacecraft right in front of the camera (e.g. Voyager 2).
 const newNear = Math.min(0.1, Math.max(0.01, minDist * 0.05));
 if (Math.abs(this.camera.near - newNear) > 0.005) {
 this.camera.near = newNear;
 this.camera.updateProjectionMatrix();
 }
 }
 }

 // ── Both-trigger warp: active while BOTH triggers held, off when released ─
 if (this.renderer.xr.isPresenting) {
 const bothTriggersHeld = !!(this._vrTriggerPressed?.left && this._vrTriggerPressed?.right);
 const wasWarp = this.vrStarshipMode;
 this.vrStarshipMode = bothTriggersHeld;
 if (bothTriggersHeld && !wasWarp) {
 // Just engaged — haptic + effect
 this.updateVRStatus('🚀 WARP DRIVE ENGAGED • 20× speed');
 this.triggerVRHaptic(0, 0.6, 120);
 this.triggerVRHaptic(1, 0.6, 120);
 this.requestVRMenuRefresh();
 } else if (!bothTriggersHeld && wasWarp) {
 // Just disengaged
 this.updateVRStatus('🛸 Warp disengaged');
 this._deactivateVRWarpEffect();
 this.requestVRMenuRefresh();
 }
 }

 // ── Warp effect update ────────────────────────────────────────────────
 if (this.vrStarshipMode && this._vrWarpTravel.lengthSq() > 0.0001) {
 this._activateVRWarpEffect();
 // Keep streaks centred on the HMD in dolly-local space and aligned to travel
 this._vrWarpEffect.position.copy(this.camera.position);
 this._alignVRWarpEffect(this._vrWarpTravel);
 this._updateVRWarpEffect();
 } else if (this._vrWarpEffect?.visible) {
 this._deactivateVRWarpEffect();
 }

 // ── Panel drag update (right grip held) — independent of grab-rotate ──
 if (this.vrPanelDrag?.active && this.vrUIPanel?.visible) {
 const ctrl = this.controllers[this.vrPanelDrag.controllerIndex];
 if (ctrl) {
 // Both panel and controller are children of dolly — simple offset in dolly space
 this.vrUIPanel.position.copy(ctrl.position).add(this._vrPanelDragOffset);
 this._billboardVRPanel();
 }
 }
 }

 onResize() {
 this.camera.aspect = window.innerWidth / window.innerHeight;
 this.camera.updateProjectionMatrix();
 this.renderer.setPixelRatio(this._adaptivePixelRatio);
 this.renderer.setSize(window.innerWidth, window.innerHeight);
 if (this.composer) {
 this.composer.setSize(window.innerWidth, window.innerHeight);
 }
 }

 clear() {
 // Properly dispose of all objects to prevent memory leaks
 const objectsToRemove = [];
 const lightObjects = new Set(Object.values(this.lights));
 
 // Build a set of dolly descendants to protect VR rig resources
 const dollyDescendants = new Set();
 if (this.dolly) {
 this.dolly.traverse(child => dollyDescendants.add(child));
 }
 
 this.scene.traverse((object) => {
 // Skip scene root, camera, dolly + all its children, and lights
 if (object === this.scene || object === this.camera || 
 dollyDescendants.has(object) || lightObjects.has(object)) {
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
 // Restore default zoom limits (focusOnObject may have changed them)
 this.controls.minDistance = CONFIG.CONTROLS.minDistance;
 this.controls.maxDistance = CONFIG.CONTROLS.maxDistance;
 // Restore default near clip plane (focusOnObject may have reduced it for small objects)
 this.camera.near = CONFIG.CAMERA.near;
 this.camera.updateProjectionMatrix();
 this.controls.update();
 }

 animate(callback) {
 let frameCount = 0;
 let vrErrorCount = 0;
 const VR_ERROR_LOG_LIMIT = 10; // Don't spam console after N errors
 this.renderer.setAnimationLoop(() => {
 // ── 0. Apply pending DPR resize (scheduled by previous frame's FPS check) ───
 // Doing this HERE (before render) means: canvas is cleared and immediately
 // re-drawn in the same JS tick — the user never sees a blank frame.
 if (this._pendingDprChange !== null) {
 const pr = this._pendingDprChange;
 this._pendingDprChange = null;
 this._adaptivePixelRatio = pr;
 this.renderer.setPixelRatio(pr);
 this.renderer.setSize(window.innerWidth, window.innerHeight, false);
 if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
 if (DEBUG.PERFORMANCE) console.log(`[Perf] Adaptive DPR applied -> ${pr.toFixed(2)}`);
 }
 // Run callback FIRST so updateCameraTracking() can set controls.target
 // to the planet's current world position BEFORE controls.update() reads it.
 // This ensures zoom/rotate always operate relative to the planet's
 // current orbital position, not last frame's position.
 try {
 callback();
 } catch (e) {
 // ALWAYS log VR errors to help diagnose black-screen issues
 if (this.renderer.xr.isPresenting || DEBUG.EMULATE_VR) {
 vrErrorCount++;
 if (vrErrorCount <= VR_ERROR_LOG_LIMIT) {
 console.error(`[VR] Frame error #${vrErrorCount}:`, e.message, e.stack);
 } else if (vrErrorCount === VR_ERROR_LOG_LIMIT + 1) {
 console.error(`[VR] Suppressing further errors (${VR_ERROR_LOG_LIMIT} logged)`);
 }
 } else if (DEBUG.enabled) {
 console.error('[Scene] Callback error:', e);
 }
 }

 // ── 2. Controls (after tracking so target is already at planet) ───────
 try {
 // Skip OrbitControls while XR is presenting - the XR session owns the
 // camera pose; running controls.update() would fight the headset tracking.
 // In emulate-vr mode, keep controls so user can look around from VR pos.
 if (!this.renderer.xr.isPresenting) {
 this.controls.update();
 }
 } catch (e) {
 if (DEBUG.enabled || DEBUG.VR) console.error('[Scene] controls.update error:', e);
 }

 // ── 2b. Material sanity check (frames 0 and 60 only) ────────────────
 // Two passes catches both synchronous-init and async-loaded objects
 // without burning 4 full traversals per session (was frameCount < 120 && % 30).
 if (frameCount === 0 || frameCount === 60) {
 this.scene.traverse((obj) => {
 if (!obj.isMesh && !obj.isSkinnedMesh) return;
 // Avoid allocating [mat] for single-material meshes (the common case)
 const matArr = obj.material;
 const mats = Array.isArray(matArr) ? matArr : null;
 const count = mats ? mats.length : 1;
 for (let mi = 0; mi < count; mi++) {
 const mat = mats ? mats[mi] : matArr;
 if (!mat || !mat.isMeshBasicMaterial) continue;
 for (let pi = 0; pi < BASIC_MAT_BANNED_PROPS.length; pi++) {
 const prop = BASIC_MAT_BANNED_PROPS[pi];
 if (mat[prop]) {
 if (DEBUG && DEBUG.enabled) console.warn(
 `[MaterialFix] Removed .${prop} from MeshBasicMaterial on ` +
 `"${obj.name || obj.userData?.name || '(unnamed)'}"`
 );
 delete mat[prop];
 mat.needsUpdate = true;
 }
 }
 }
 });
 }

 // ── 2c. VR menu redraw (dirty-flag driven, at most once per frame) ───
 if (this._vrMenuDirty && this.vrUIContext) {
 this._vrMenuDirty = false;
 this.drawVRMenu();
 }

 // ── 3. RENDER (must ALWAYS run, even if callback threw) ─────
 try {
 // Use EffectComposer (bloom + SMAA) in desktop non-VR mode.
 // Fall back to direct render inside WebXR — the XR compositor
 // does not support EffectComposer render targets.
 if (this.composer && !this.renderer.xr.isPresenting) {
 this.composer.render();
 } else {
 this.renderer.render(this.scene, this.camera);
 }
 } catch (e) {
 console.error('[Scene] render() FAILED:', e);
 // One-shot diagnostic: find the material causing the crash
 if (!this._renderDiagRan) {
 this._renderDiagRan = true;
 // Properties that MeshBasicMaterial does NOT support as uniforms
 // are listed in module-level BASIC_MAT_BANNED_PROPS.
 const unsupported = BASIC_MAT_BANNED_PROPS;
 this.scene.traverse((obj) => {
 if (!obj.isMesh && !obj.isSkinnedMesh) return;
 const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
 mats.forEach((mat) => {
 if (!mat || !mat.isMeshBasicMaterial) return;
 unsupported.forEach((prop) => {
 if (mat[prop]) {
 if (DEBUG.enabled) console.warn(
 `[Diag] MeshBasicMaterial on "${obj.name || obj.userData?.name || '(unnamed)'}" ` +
 `has unsupported .${prop}=${mat[prop]} — removing to fix crash`
 );
 delete mat[prop];
 mat.needsUpdate = true;
 }
 });
 });
 });
 }
 }

 // Adaptive DPR (desktop): lower DPR when FPS drops, raise when stable.
 // Schedule the resize for the START of the next frame (not applied here)
 // to prevent a blank-frame flash from canvas.width reassignment mid-session.
 if (CONFIG.PERFORMANCE.adaptivePixelRatio && !this.renderer.xr.isPresenting) {
 this._adaptiveFpsFrameCount++;
 const now = performance.now();
 const sampleElapsed = now - this._adaptiveFpsSampleStart;

 if (sampleElapsed >= CONFIG.PERFORMANCE.adaptivePixelRatioSampleMs) {
 const fps = (this._adaptiveFpsFrameCount * 1000) / sampleElapsed;
 let nextRatio = this._adaptivePixelRatio;

 if (fps < CONFIG.PERFORMANCE.adaptivePixelRatioFpsDownThreshold) {
 nextRatio -= CONFIG.PERFORMANCE.adaptivePixelRatioStepDown;
 } else if (fps > CONFIG.PERFORMANCE.adaptivePixelRatioFpsUpThreshold) {
 nextRatio += CONFIG.PERFORMANCE.adaptivePixelRatioStepUp;
 }

 const minRatio = CONFIG.PERFORMANCE.adaptivePixelRatioMin;
 const maxRatio = Math.min(window.devicePixelRatio, CONFIG.PERFORMANCE.adaptivePixelRatioMax);
 nextRatio = Math.max(minRatio, Math.min(maxRatio, nextRatio));

 if (Math.abs(nextRatio - this._adaptivePixelRatio) >= 0.049) {
 // Schedule — applied at the TOP of the next frame before rendering
 this._pendingDprChange = nextRatio;
 if (DEBUG.PERFORMANCE) {
 console.log(`[Perf] Adaptive DPR scheduled -> ${nextRatio.toFixed(2)} (fps ${fps.toFixed(1)})`);
 }
 }

 this._adaptiveFpsFrameCount = 0;
 this._adaptiveFpsSampleStart = now;
 }
 }


 // Debug first frame
 if (frameCount === 0 && (DEBUG.enabled || DEBUG.VR || DEBUG.EMULATE_VR)) {
 console.log(`[Scene] First frame: ${this.scene.children.length} children, canvas ${this.renderer.domElement.width}×${this.renderer.domElement.height}`);
 if (DEBUG.EMULATE_VR) {
 console.log('[VR-Emulate] Desktop VR emulation active — camera at VR start position');
 }
 }
 frameCount++;
 });
 }

 updateBrightness(multiplier) {
 if (this.lights.ambient) {
 this.lights.ambient.intensity = 0.02 + (multiplier * 0.1); // max ~0.12 at full brightness
 }
 if (this.lights.hemisphere) {
 this.lights.hemisphere.intensity = 0.01 + (multiplier * 0.06); // max ~0.07 at full brightness
 }
 if (this.lights.camera) {
 this.lights.camera.intensity = 0; // Camera light removed
 }
 }

 showError(message) {
 const loading = document.getElementById('loading');
 if (loading) {
 loading.querySelector('h2').textContent = '⚠️ Error';
 loading.querySelector('#loading-text').textContent = message;
 loading.classList.remove('hidden');
 }
 }

 dispose() {
 this._disposed = true;
 
 // Clean up resources
 this.clear();
 
 // Clear any pending timers
 if (this.vrFlashTimeout) {
 clearTimeout(this.vrFlashTimeout);
 this.vrFlashTimeout = null;
 }
 if (this._vrMenuRefreshTimer) {
 clearTimeout(this._vrMenuRefreshTimer);
 this._vrMenuRefreshTimer = null;
 }
 if (this._vrDebugHUDInterval) {
 clearInterval(this._vrDebugHUDInterval);
 this._vrDebugHUDInterval = null;
 }
 
 // End active XR session
 if (this.renderer?.xr?.isPresenting) {
 this.renderer.xr.getSession()?.end().catch((err) => {
 if (DEBUG && DEBUG.enabled) console.warn('[Dispose] XR session end error:', err);
 });
 }
 document.body.classList.remove('xr-active');
 
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

