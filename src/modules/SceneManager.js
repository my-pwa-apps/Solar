// ===========================
// SCENE MANAGER MODULE
// ===========================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
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

 // Post-processing composer (desktop only)
 this.composer = null;
 this.bloomPass = null;

 // Adaptive pixel ratio runtime state
 this._adaptivePixelRatio = Math.min(window.devicePixelRatio, CONFIG.RENDERER.maxPixelRatio);
 this._adaptiveFpsFrameCount = 0;
 this._adaptiveFpsSampleStart = performance.now();

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
 
 // Setup CSS2D label renderer
 this.labelRenderer = new CSS2DRenderer();
 this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
 this.labelRenderer.domElement.style.position = 'absolute';
 this.labelRenderer.domElement.style.top = '0px';
 this.labelRenderer.domElement.style.pointerEvents = 'none';
 container.appendChild(this.labelRenderer.domElement);

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
 console.warn('[PostFX] Failed to initialise post-processing, falling back to direct render:', e);
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
 this.vrStarshipMode = false; // Starship mode: 20× speed boost
 
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
 starshipMode: this.vrStarshipMode
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

 // ✕ close button — always visible in top-right of title bar
 btn('\u2715', 'hide', W - 74, 8, 58, 58, { danger: true, font: 'bold 26px Arial' });

 // Grab hint (tiny, right side of title bar, left of close button)
 ctx.fillStyle = 'rgba(70,110,160,0.65)';
 ctx.font = '12px Arial'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
 ctx.fillText('\uD83E\uDD1A right grip: move', W - 84, 60);

 // glowing title divider
 const divGrad = ctx.createLinearGradient(0, 74, W, 74);
 divGrad.addColorStop(0, 'rgba(74,144,217,0)');
 divGrad.addColorStop(0.3, 'rgba(74,144,217,0.9)');
 divGrad.addColorStop(0.7, 'rgba(123,184,245,0.9)');
 divGrad.addColorStop(1, 'rgba(74,144,217,0)');
 ctx.fillStyle = divGrad; ctx.fillRect(0, 74, W, 2);

 // ─────────────────── page tabs ─────────────────────────────
 // (_VR_TABS is a module-level constant — not reallocated each redraw)
 const TW = Math.floor(W / _VR_TABS.length);
 _VR_TABS.forEach((tab, i) => {
 const active = state.currentPage === tab.id;
 const tabBg = ctx.createLinearGradient(i * TW, 80, i * TW, 152);
 if (active) { tabBg.addColorStop(0, '#0f2640'); tabBg.addColorStop(1, '#0a1a2e'); }
 else        { tabBg.addColorStop(0, '#080f1a'); tabBg.addColorStop(1, '#060c14'); }
 ctx.fillStyle = tabBg;
 ctx.fillRect(i * TW, 80, TW - 2, 72);

 if (active) {
 ctx.save();
 const glowGrad = ctx.createLinearGradient(i * TW, 148, (i + 1) * TW - 2, 148);
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
 ctx.fillText(tab.label, i * TW + TW / 2, 116);
 this.vrButtons.push({ x: i * TW, y: 80, w: TW - 2, h: 68, label: tab.label, action: `page:${tab.id}` });
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

 // ── LOCOMOTION: Starship Mode (full-width warp-drive button) ──────────
 sectionLabel('LOCOMOTION', EDGE, rowY(3) - 22, W - EDGE * 2);
 {
 const shipX = colX(0), shipY = rowY(3);
 const shipW = 4 * COL_W + 3 * COL_GAP, shipH = BTN_H;
 const shipActive = state.starshipMode;
 ctx.save();

 // Background
 const shipBg = ctx.createLinearGradient(shipX, shipY, shipX + shipW, shipY + shipH);
 if (shipActive) {
 shipBg.addColorStop(0, '#031828'); shipBg.addColorStop(0.35, '#052535');
 shipBg.addColorStop(0.65, '#062030'); shipBg.addColorStop(1, '#031828');
 } else {
 shipBg.addColorStop(0, '#080c14'); shipBg.addColorStop(0.5, '#0a1218'); shipBg.addColorStop(1, '#080c14');
 }
 ctx.fillStyle = shipBg;
 ctx.beginPath(); ctx.roundRect(shipX, shipY, shipW, shipH, 10); ctx.fill();

 if (shipActive) {
 // Warp-speed streak lines (deterministic seeded LCG)
 ctx.save();
 ctx.beginPath(); ctx.roundRect(shipX, shipY, shipW, shipH, 10); ctx.clip();
 let ws = 443271; const wr = () => { ws = (ws * 1103515245 + 12345) & 0x7fffffff; return ws / 0x7fffffff; };
 for (let si = 0; si < 28; si++) {
 const ly = shipY + wr() * shipH;
 const len = 30 + wr() * 220;
 const lx = shipX + wr() * (shipW - len);
 const alpha = 0.06 + wr() * 0.25;
 ctx.strokeStyle = `rgba(0,229,255,${alpha.toFixed(2)})`; ctx.lineWidth = wr() < 0.25 ? 2 : 1;
 ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + len, ly); ctx.stroke();
 }
 // Radial warp-core glow
 const rg = ctx.createRadialGradient(shipX + shipW * 0.5, shipY + shipH * 0.5, 0, shipX + shipW * 0.5, shipY + shipH * 0.5, shipW * 0.38);
 rg.addColorStop(0, 'rgba(0,180,230,0.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = rg; ctx.fillRect(shipX, shipY, shipW, shipH);
 ctx.restore();
 }

 // Border
 if (shipActive) {
 ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 26; ctx.strokeStyle = '#00CCFF'; ctx.lineWidth = 2;
 } else {
 ctx.strokeStyle = '#1e4860'; ctx.lineWidth = 1;
 }
 ctx.beginPath(); ctx.roundRect(shipX, shipY, shipW, shipH, 10); ctx.stroke();
 ctx.shadowBlur = 0;

 // Text
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 const midSX = shipX + shipW / 2, midSY = shipY + shipH / 2;
 if (shipActive) {
 ctx.fillStyle = '#00E5FF'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 14;
 ctx.font = 'bold 28px Arial';
 ctx.fillText('\uD83D\uDE80  STARSHIP MODE', midSX, midSY - 12, shipW - 60);
 ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,220,255,0.82)'; ctx.font = '15px Arial';
 ctx.fillText('20\u00D7 WARP DRIVE ENGAGED  \u2022  hold trigger for 60\u00D7 hyperwarp', midSX, midSY + 16, shipW - 60);
 } else {
 ctx.fillStyle = '#4a8aa8'; ctx.font = 'bold 26px Arial';
 ctx.fillText('\uD83D\uDE80  STARSHIP MODE', midSX, midSY - 10, shipW - 60);
 ctx.fillStyle = 'rgba(100,160,190,0.65)'; ctx.font = '15px Arial';
 ctx.fillText('OFF  \u2022  press to unlock 20\u00D7 speed boost  \u2022  trigger = 60\u00D7 hyperwarp', midSX, midSY + 14, shipW - 60);
 }
 ctx.restore();
 this.vrButtons.push({ x: shipX, y: shipY, w: shipW, h: shipH, label: '\uD83D\uDE80 STARSHIP MODE', action: 'starship' });
 }
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
 
 const RESET_Y = PAG_Y + BTN_H + 20;
 btn('\uD83D\uDE80 Reset to Solar System View', 'reset', EDGE, RESET_Y, W - EDGE*2, 70, { bg: '#1a2a40', bg2: '#0e1828', border: '#3a6a9a', font: 'bold 22px Arial' });
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
 if (tl.includes('star')) return { icon: '⭐', accent: '#FFD700', dim:'#3d2e00', badge:'#2a1e00' };
 if (tl.includes('gas'))  return { icon: '🪐', accent: '#88AAEE', dim:'#1a1e40', badge:'#0e1428' };
 if (tl.includes('moon')) return { icon: '🌙', accent: '#AAAACC', dim:'#1e1e30', badge:'#12121e' };
 if (tl.includes('exoplanet')) return { icon: '🌍', accent: '#55EE99', dim:'#0a2a18', badge:'#061a10' };
 if (tl.includes('planet')) return { icon: '🌍', accent: '#44CC88', dim:'#0e2a1a', badge:'#081a10' };
 if (tl.includes('dwarf')) return { icon: '🔴', accent: '#CC8844', dim:'#2a1a0a', badge:'#1a1006' };
 if (tl.includes('comet')) return { icon: '☄️', accent: '#88CCFF', dim:'#0a2030', badge:'#061520' };
 if (tl.includes('nebula')) return { icon: '🌋', accent: '#CC88FF', dim:'#1e0a30', badge:'#120620' };
 if (tl.includes('galaxy')) return { icon: '🌀', accent: '#FF88CC', dim:'#2a0a1a', badge:'#1a0610' };
 if (tl.includes('constellation')) return { icon: '✨', accent: '#FFCC88', dim:'#2a1e00', badge:'#1a1200' };
 if (tl.includes('spacecraft') || tl.includes('station')) return { icon: '🛸', accent: '#80CCFF', dim:'#0a1e30', badge:'#061220' };
 return { icon: '•', accent: '#70B0E0', dim:'#0a1a2a', badge:'#060e1a' };
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

 // Info page footer — Navigate to go back, ✕ to close the overlay
 this.vrButtons = this.vrButtons.filter(b => b.action !== 'hide' && b.action !== 'exitvr');
 btn('\uD83E\uDDED Navigate', 'page:navigate', EDGE, FOOT_Y, closeW, BTN_H, { success: true });
 btn('\u2715 Close', 'hide', EDGE + closeW + COL_GAP, FOOT_Y, closeW, BTN_H, { danger: true });
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
 let buttonFound = false;
 for (const btn of this.vrButtons) {
 if (x >= btn.x && x <= btn.x + btn.w && 
 y >= btn.y && y <= btn.y + btn.h) {
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

 // Rotate dolly so the user faces the object
 const dx = targetPos.x - newDollyPos.x;
 const dz = targetPos.z - newDollyPos.z;
 const facing = Math.atan2(dx, dz);

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
 */
 _billboardVRPanel() {
 if (!this.vrUIPanel) return;
 // Panel is a child of dolly, so use dolly-local camera position for lookAt
 const camLocalPos = this._vrBillboardPos;
 camLocalPos.copy(this.camera.position); // camera.position is already dolly-local in XR
 this.vrUIPanel.lookAt(camLocalPos);
 // Strip pitch/roll so panel stays vertical
 const yRot = this.vrUIPanel.rotation.y;
 this.vrUIPanel.rotation.set(0, yRot, 0);
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
 if (!this.renderer.xr.isPresenting || !this.controllers || !this.lasersVisible) return;

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
 this._vrRaycaster.intersectObjects(this.scene.children, true, this._vrIntersections);
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
 this.updateVRStatus('▶ Playing');
 if (DEBUG.VR) console.log('[VR] Thumbstick pressed - PLAY');
 } else {
 app.timeSpeed = 0;
 this.updateVRStatus('⏸ Paused');
 if (DEBUG.VR) console.log('[VR] Thumbstick pressed - PAUSE');
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
 const baseSpeed = 0.40 * sprintMultiplier * starshipMult; // Increased from 0.25 for more responsive locomotion
 
 // Forward/Backward & Strafe (only if NOT grab-rotating)
 if (!this.grabRotateState.active &&
 (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone)) {
 // Forward/back: negate stickY (forward stick = negative Y on Quest)
 this._vrMoveScratch.copy(cameraForward).multiplyScalar(-stickY * baseSpeed);
 this.dolly.position.add(this._vrMoveScratch);
 // Strafe: right = +X
 this._vrMoveScratch.copy(cameraRight).multiplyScalar(stickX * baseSpeed);
 this.dolly.position.add(this._vrMoveScratch);
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
 const starshipMult = this.vrStarshipMode ? 20.0 : 1.0;
 const turnSpeed = 0.03;
 const vertSpeed = 0.25 * sprintMultiplier * starshipMult;
 
 // TURN LEFT/RIGHT (only if NOT grab-rotating)
 // Use quaternion premultiply around world-Y so Euler order never
 // causes a direction flip after combined pitch+yaw accumulation.
 if (!this.grabRotateState.active && Math.abs(stickX) > deadzone) {
 this._vrTurnQuat.setFromAxisAngle(this._vrUpVector, -stickX * turnSpeed);
 this.dolly.quaternion.premultiply(this._vrTurnQuat);
 }
 
 // VERTICAL MOVEMENT (Up/Down in world space)
 if (Math.abs(stickY) > deadzone) {
 // Negative Y = up, Positive Y = down (inverted for intuitive)
 this.dolly.position.y += -stickY * vertSpeed;
 }
 
 // UP/DOWN with B button (A button is now menu toggle)
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
 // Near = 5% of surface distance, clamped between 0.01 and 10.0
 const newNear = Math.min(10.0, Math.max(0.01, minDist * 0.05));
 if (Math.abs(this.camera.near - newNear) > 0.005) {
 this.camera.near = newNear;
 this.camera.updateProjectionMatrix();
 }
 }
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
 if (this.labelRenderer) {
 this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
 }
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
 // ── 1. App callback (update logic) ──────────────
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
 this._adaptivePixelRatio = nextRatio;
 this.renderer.setPixelRatio(this._adaptivePixelRatio);
 this.renderer.setSize(window.innerWidth, window.innerHeight, false);
 if (DEBUG.PERFORMANCE) {
 console.log(`[Perf] Adaptive DPR -> ${this._adaptivePixelRatio.toFixed(2)} (fps ${fps.toFixed(1)})`);
 }
 }

 this._adaptiveFpsFrameCount = 0;
 this._adaptiveFpsSampleStart = now;
 }
 }

 try {
 // CSS2D labels replaced with Sprite labels — labelRenderer kept for any
 // remaining CSS2D objects but skipped in XR (DOM elements can't appear in headset)
 if (this.labelRenderer && !this.renderer.xr.isPresenting) {
 this.labelRenderer.render(this.scene, this.camera);
 }
 } catch (_) { /* label render is non-critical */ }

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

