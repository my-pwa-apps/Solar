// ===========================
// SPACE VOYAGE - MODULAR VERSION
// Main Application Entry Point
// ===========================
import * as THREE from 'three';

// Import all modules
import { DEBUG, CONFIG, IS_MOBILE, APP_VERSION } from './modules/utils.js';
import { warmupTextureCache } from './modules/TextureCache.js';
import { SceneManager } from './modules/SceneManager.js';
import { UIManager } from './modules/UIManager.js';
import { SolarSystemModule } from './modules/SolarSystemModule.js';
import { audioManager } from './modules/AudioManager.js';
import { safeGetItem, safeSetItem, safeRemoveItem } from './modules/storage.js';
import { setupOnboarding } from './modules/AppFeatures.js';

// Make audio manager globally accessible
window.audioManager = audioManager;
window.APP_VERSION = APP_VERSION;

// i18n.js is loaded globally in index.html. Use a late-binding wrapper so calls always use
// the fully-initialised translation function rather than capturing window.t at import time.
const t = (key) => (window.t || ((k) => k))(key);

// ===========================
// CONSTANTS
// ===========================

// UI Element IDs
const UI_ELEMENTS = {
 ORBITS_BUTTON: 'toggle-orbits',
 CONSTELLATIONS_BUTTON: 'toggle-constellations',
 LABELS_BUTTON: 'toggle-details',
 BLOOM_BUTTON: 'toggle-bloom',
 SCALE_BUTTON: 'toggle-scale',
 RESET_VIEW: 'reset-view',
 HELP_BUTTON: 'help-button',
 SETTINGS_BUTTON: 'settings-button',
 FPS_COUNTER: 'fps-counter',
 HOVER_LABEL: 'hover-label',
 DROPDOWN: 'object-dropdown',
 SPEED_SLIDER: 'time-speed'
};

// Utility: Julian Date → JavaScript Date
function jdToDate(jd) {
 return new Date((jd - 2440587.5) * 86400000);
}

// LocalStorage Keys
const STORAGE_KEYS = {
 ORBITS: 'orbitsVisible',
 CONSTELLATIONS: 'constellationsVisible',
 LABELS: 'labelsVisible',
 SCALE: 'realisticScale',
 SCALE_MODE: 'scaleMode',
 SCIENTIFIC: 'scientificMode'
};

// ===========================
// MODULE-LEVEL STATIC DATA
// ===========================

// Pattern-based navigation lookups for array-stored objects.
// Pure static data — hoisted here so it is never reallocated per call.
const _NAV_SEARCH_PATTERNS = [
 { prefix: 'constellation-', array: 'constellations', exactMatch: 'exact', patterns: {
 'aries': ['aries'], 'taurus': ['taurus'], 'gemini': ['gemini'],
 'cancer': ['cancer'], 'leo': ['leo'], 'virgo': ['virgo'],
 'libra': ['libra'], 'scorpius': ['scorpius'], 'sagittarius': ['sagittarius'],
 'capricornus': ['capricornus'], 'aquarius': ['aquarius'], 'pisces': ['pisces'],
 'orion': ['orion'], 'orions-belt': ['orionsBelt'],
 'ursa-major': ['ursaMajor'], 'big-dipper': ['bigDipper'], 'little-dipper': ['littleDipper'],
 'southern-cross': ['southernCross'], 'cassiopeia': ['cassiopeia'],
 'cygnus': ['cygnus'], 'lyra': ['lyra'],
 'andromeda': ['andromedaConst'], // Distinct from "andromeda galaxy"
 'perseus': ['perseus'], 'canis-major': ['canisMajor'],
 'aquila': ['aquila'], 'pegasus': ['pegasus'],
 }},
 { prefix: '', array: 'satellites', patterns: {
 'iss': ['ISS', 'International Space Station'],
 'hubble': ['Hubble', 'Hubble Space Telescope'],
 'gps': ['GPS', 'NAVSTAR'],
 'gps-navstar': ['GPS', 'NAVSTAR'],
 'sputnik': ['Sputnik'],
 'sputnik-1': ['Sputnik 1'],
 }},
 { prefix: '', array: 'spacecraft', patterns: {
 'voyager-1': ['Voyager 1'], 'voyager-2': ['Voyager 2'], 'voyager': ['Voyager'],
 'new-horizons': ['New Horizons'],
 'jwst': ['James Webb'], 'james-webb': ['James Webb'],
 'juno': ['Juno'], 'cassini': ['Cassini'],
 'pioneer-10': ['Pioneer 10'], 'pioneer-11': ['Pioneer 11'], 'pioneer': ['Pioneer'],
 }},
 { prefix: '', array: 'nebulae', exactMatch: 'exact', patterns: {
 'orion-nebula':     ['orionNebula'],
 'crab-nebula':      ['crabNebula'],
 'ring-nebula':      ['ringNebula'],
 'eagle-nebula':     ['eagleNebula'],
 'helix-nebula':     ['helixNebula'],
 'lagoon-nebula':    ['lagoonNebula'],
 'butterfly-nebula': ['butterflyNebula'],
 }},
 { prefix: '', array: 'galaxies', exactMatch: 'exact', patterns: {
 'andromeda-galaxy':       ['andromedaGalaxy'],
 'triangulum-galaxy':      ['triangulumGalaxy'],
 'whirlpool-galaxy':       ['whirlpoolGalaxy'],
 'sombrero-galaxy':        ['sombreroGalaxy'],
 'pinwheel-galaxy':        ['pinwheelGalaxy'],
 'bodes-galaxy':           ['bodesGalaxy'],
 'cigar-galaxy':           ['cigarGalaxy'],
 'sculptor-galaxy':        ['sculptorGalaxy'],
 'centaurus-a':            ['centaurusAGalaxy'],
 'large-magellanic-cloud': ['largeMagellanicCloud'],
 'small-magellanic-cloud': ['smallMagellanicCloud'],
 }},
 { prefix: '', array: 'exoplanets', patterns: {
 'proxima-b':   ['Proxima Centauri b'],
 'kepler-452b': ['Kepler-452b'],
 'trappist-1e': ['TRAPPIST-1e'],
 'kepler-186f': ['Kepler-186f'],
 }},
 { prefix: '', array: 'nearbyStars', exactMatch: 'exact', patterns: {
 'alpha-centauri':   ['alphaCentauriA'],
 'proxima-centauri': ['proximaCentauri'],
 'kepler-452-star':  ['kepler452Star'],
 'trappist-1-star':  ['trappist1Star'],
 'kepler-186-star':  ['kepler186Star'],
 }},
 { prefix: '', array: 'comets', patterns: {
 'halley':       ["Halley's Comet"],
 'hale-bopp':    ["Hale-Bopp", "Comet Hale-Bopp"],
 'hyakutake':    ["Hyakutake", "Comet Hyakutake"],
 'lovejoy':      ["Lovejoy", "Comet Lovejoy"],
 'encke':        ["Encke", "Comet Encke"],
 'swift-tuttle': ["Swift-Tuttle", "Comet Swift-Tuttle"],
 }},
];

// ===========================
// APP CLASS
// ===========================

class App {
 constructor() {
 this.sceneManager = null;
 this.uiManager = null;
 this.solarSystemModule = null;
 this.lastTime = 0;
 this.timeSpeed = 1; // Default to 1x real-time
 this.isTimeReversed = false; // Time Machine: reverse playback flag

 // Pre-allocate reusable objects for raycast hot path (avoid per-hover GC)
 this._mouseVec = new THREE.Vector2();
 this._objCentre = new THREE.Vector3();
 this._toObj = new THREE.Vector3();
 this._crossVec = new THREE.Vector3();

 // Hover / drag state (initialised here to avoid scattered lazy-init)
 this._hoverLabel = null;
 this._currentHoveredObject = null;
 this._lastHoverCheck = 0;
 this._isDragging = false;
 this._mouseDownPos = null;

 // Keyboard shortcut cycle indices
 this._voyagerIndex = -1;
 this._probeIndex = -1;

 // One-shot VR error log flags
 this._vrMoveErrLogged = false;
 this._vrLaserErrLogged = false;

 // Make this app instance globally accessible for VR and other modules
 window.app = this;
 
 this.init();
 }

 async init() {
 const appStartTime = performance.now();
 
 try {
 // ALWAYS warm up cache from IndexedDB (loads cached textures into memory)
 const cacheReady = await warmupTextureCache();
 if (cacheReady && DEBUG && DEBUG.PERFORMANCE) {
 console.log('⚡ Fast start: All essential textures cached');
 }
 
 // Initialize managers
 this.sceneManager = new SceneManager();
 this.uiManager = new UIManager();
 
 this.uiManager.showLoading(t('initializing'));
 this.uiManager.updateLoadingProgress(0, t('settingUpScene'));
 
 // Start cycling fun facts immediately (before any loading work begins)
 this.setupSpaceFacts();
 
 // Setup global UI functions
 this.setupGlobalFunctions();
 this.uiManager.updateLoadingProgress(10, t('initializingControls'));
 
 // Setup help button
 this.setupHelpButton();
 this.uiManager.updateLoadingProgress(15, t('loadingSolarSystem'));

 // Load Solar System module
 this.solarSystemModule = new SolarSystemModule(this.uiManager);
 this.uiManager.updateLoadingProgress(20, t('creatingSun'));
 
 // Init handles async loading and calls startExperience() when done
 // Safety timeout: if loading stalls for 30s, force-start anyway
 this._loadingTimeout = setTimeout(() => {
 if (!this._experienceStarted) {
 if (DEBUG && DEBUG.enabled) console.warn('[App] Loading timeout — force-starting experience');
 this.startExperience();
 }
 }, 30000);
 await this.solarSystemModule.init(this.sceneManager.scene);

 // Schedule verification of remote texture loads
 if (this.solarSystemModule?.verifyTextureLoads) {
	 this.solarSystemModule.verifyTextureLoads(5000);
 }
 
 if (DEBUG && DEBUG.PERFORMANCE) {
 console.log(`📦 Loaded in ${(performance.now() - appStartTime).toFixed(0)}ms`);
 }
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.error('[App] Failed to initialize Space Voyage:', error);
 this.sceneManager?.showError(t('errorLoading') + '. ' + t('errorMessage'));
 }
 }
 
 startExperience() {
 if (this._experienceStarted) return; // Prevent double-start from timeout + normal flow
 this._experienceStarted = true;
 if (this._loadingTimeout) { clearTimeout(this._loadingTimeout); this._loadingTimeout = null; }
 // Called by SolarSystemModule after all assets are loaded
 // Setup UI for Solar System
 this.uiManager.setupSolarSystemUI();
 
 // Setup controls
 this.setupControls();
 
 // Restore saved toggle states now that solar system is fully initialized
 this.restoreSavedToggleStates();
 
 // Hide tooltip when camera controls are used
 if (this.sceneManager?.controls) {
 this.sceneManager.controls.addEventListener('start', () => {
 this.hideHoverLabel();
 });
 }
 
 // Hide loading screen
 this.uiManager.hideLoading();
 
 // Setup new UX features
 setupOnboarding(this.uiManager);
 this.setupRandomDiscovery();
 this.setupNavigationSearch();
 this.setupMobileGestureHints();
 this.setupSoundToggle();
 this.setupButtonSounds();
 this.setupTimeMachine();
 this.syncLocalizedControlStates();

 window.addEventListener('app-language-changed', () => {
 this.syncLocalizedControlStates();
 if (this.solarSystemModule?.refreshLocalizedAssets) {
 this.solarSystemModule.refreshLocalizedAssets();
 }
 if (!this.uiManager?.elements?.helpModal?.classList.contains('hidden')) {
 this.uiManager.showHelp(t('helpContent'));
 }
 });

 // Pre-select Earth on first load for better first impression
 this.preSelectEarth();
 
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
 // Each wrapped separately so one failure doesn't block the others
 try {
 this.sceneManager.updateXRMovement();
 } catch (e) {
 if (!this._vrMoveErrLogged) {
 console.error('[VR] updateXRMovement crashed:', e.message, e.stack);
 this._vrMoveErrLogged = true;
 }
 }
 try {
 this.sceneManager.updateLaserPointers();
 } catch (e) {
 if (!this._vrLaserErrLogged) {
 console.error('[VR] updateLaserPointers crashed:', e.message, e.stack);
 this._vrLaserErrLogged = true;
 }
 }
 
 // Update Solar System module every frame
 if (this.solarSystemModule) {
 const effectiveSpeed = this.isTimeReversed ? -this.timeSpeed : this.timeSpeed;
 this.solarSystemModule.update(deltaTime, effectiveSpeed,
 this.sceneManager.camera, this.sceneManager.controls);
 }

 // Update FPS counter (driven by main render loop, not a separate rAF)
 this.updateFPSCounter();
 });
 }

 /**
  * Helper method to restore a single toggle state from localStorage
  * @private
  */
 _restoreToggleState(config) {
 const { storageKey, buttonId, toggleMethod, buttonClass = 'toggle-on', updateText } = config;
 const savedState = safeGetItem(storageKey);
 
 if (savedState !== null && this.solarSystemModule) {
 const value = savedState === 'true';
 
 // Call the toggle method
 toggleMethod.call(this.solarSystemModule, value);
 
 // Update button visual state
 const button = document.getElementById(buttonId);
 if (button) {
 button.classList.toggle(buttonClass, value);
 button.setAttribute('aria-pressed', value.toString());
 if (updateText) updateText(button, value);
 }
 }
 }

 restoreSavedToggleStates() {
 // Apply saved toggle states after solar system is fully initialized
 // This ensures toggleLabels(), toggleOrbits(), etc. can actually work
 
 // Restore orbit mode (supports legacy 'true'/'false' values and new mode strings)
 const savedOrbitMode = safeGetItem(STORAGE_KEYS.ORBITS);
 if (savedOrbitMode !== null && this.solarSystemModule) {
 this.applyOrbitMode(savedOrbitMode, { persist: false });
 } else {
 // Default on first load: orbits off for a cleaner initial view
 this.applyOrbitMode('none', { persist: false });
 }
 
 // Restore constellations visibility
 const savedConstellationsState = safeGetItem(STORAGE_KEYS.CONSTELLATIONS);
 if (savedConstellationsState !== null) {
 this._restoreToggleState({
 storageKey: STORAGE_KEYS.CONSTELLATIONS,
 buttonId: UI_ELEMENTS.CONSTELLATIONS_BUTTON,
 toggleMethod: this.solarSystemModule.toggleConstellations
 });
 } else {
 const defaultConstellationsVisible = this.solarSystemModule?.constellationsVisible ?? false;
 // Sync scene state (THREE.js objects default to visible=true)
 if (this.solarSystemModule) this.solarSystemModule.toggleConstellations(defaultConstellationsVisible);
 const constellationsButton = document.getElementById(UI_ELEMENTS.CONSTELLATIONS_BUTTON);
 if (constellationsButton) {
 constellationsButton.classList.toggle('toggle-on', defaultConstellationsVisible);
 constellationsButton.setAttribute('aria-pressed', defaultConstellationsVisible.toString());
 }
 }

 // Restore labels visibility (special case: needs sceneManager property update)
 const savedLabelsState = safeGetItem(STORAGE_KEYS.LABELS);
 if (savedLabelsState !== null && this.solarSystemModule && this.sceneManager) {
 const labelsVisible = savedLabelsState === 'true';
 this.sceneManager.labelsVisible = labelsVisible;
 this.solarSystemModule.toggleLabels(labelsVisible);
 const labelsButton = document.getElementById(UI_ELEMENTS.LABELS_BUTTON);
 if (labelsButton) {
 labelsButton.classList.toggle('toggle-on', labelsVisible);
 labelsButton.setAttribute('aria-pressed', labelsVisible.toString());
 const btnText = labelsButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = labelsVisible ? t('toggleLabelsOn') : t('toggleLabels');
 }
 }
 } else if (this.sceneManager) {
 const labelsVisible = this.sceneManager.labelsVisible;
 const labelsButton = document.getElementById(UI_ELEMENTS.LABELS_BUTTON);
 if (labelsButton) {
 labelsButton.classList.toggle('toggle-on', labelsVisible);
 labelsButton.setAttribute('aria-pressed', labelsVisible.toString());
 const btnText = labelsButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = labelsVisible ? t('toggleLabelsOn') : t('toggleLabels');
 }
 }
 }
 
 // Restore scale mode (special case: uses 'active' class and updates text)
 // One-time migration: convert legacy two-key storage to the unified 'scaleMode' key.
 let savedScaleMode = safeGetItem(STORAGE_KEYS.SCALE_MODE);
 if (!savedScaleMode) {
 const legacyScientific = safeGetItem(STORAGE_KEYS.SCIENTIFIC);
 const legacyScale = safeGetItem(STORAGE_KEYS.SCALE);
 if (legacyScientific === 'true' || legacyScale === 'true') {
 savedScaleMode = 'scientific';
 } else if (legacyScientific === 'false' || legacyScale === 'false') {
 savedScaleMode = 'educational';
 }
 if (savedScaleMode) {
 safeSetItem(STORAGE_KEYS.SCALE_MODE, savedScaleMode);
 }
 // Remove stale legacy keys regardless so this path is never traversed again.
 if (legacyScientific !== null) safeRemoveItem(STORAGE_KEYS.SCIENTIFIC);
 if (legacyScale !== null) safeRemoveItem(STORAGE_KEYS.SCALE);
 }

 if (savedScaleMode && this.solarSystemModule) {
 this.applyScaleMode(savedScaleMode, { persist: false });
 } else {
 const scaleMode = this.getCurrentScaleMode();
 const scientificMode = scaleMode === 'scientific';
 const scaleButton = document.getElementById(UI_ELEMENTS.SCALE_BUTTON);
 if (scaleButton) {
 scaleButton.classList.toggle('active', scientificMode);
 scaleButton.setAttribute('aria-pressed', scientificMode.toString());
 const btnText = scaleButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = this.getScaleModeLabel(scaleMode);
 }
 }
 }
 }

 getScaleModeLabel(mode) {
 if (mode === 'scientific') return t('toggleScaleScientific');
 return t('toggleScale');
 }

 getCurrentScaleMode() {
 if (!this.solarSystemModule) return 'educational';
 if (this.solarSystemModule.scientificMode) return 'scientific';
 return 'educational';
 }

 applyScaleMode(mode, { persist = true } = {}) {
 if (!this.solarSystemModule) return;

 const normalizedMode = mode === 'scientific' ? 'scientific' : 'educational';
 const realisticScale = normalizedMode === 'scientific';
 const scientificMode = normalizedMode === 'scientific';

 this.solarSystemModule.realisticScale = realisticScale;
 if (typeof this.solarSystemModule.setScientificMode === 'function') {
 this.solarSystemModule.setScientificMode(scientificMode);
 } else {
 this.solarSystemModule.scientificMode = scientificMode;
 }

 this.solarSystemModule.updateScale();

 // Realistic mode milkyWay navigate target ≈ 366,667 units and the galaxy disc extends
 // to ~333k radius. With the camera at ~366k the far edge of the disc is >700k units from
 // the camera — beyond the default camera.far (500k) causing parts of the galaxy to be
 // clipped. Expand both the controls zoom limit and camera frustum far plane.
 if (this.sceneManager?.controls) {
 this.sceneManager.controls.maxDistance = realisticScale ? 800000 : CONFIG.CONTROLS.maxDistance;
 }
 if (this.sceneManager?.camera) {
 this.sceneManager.camera.far = realisticScale ? 2000000 : CONFIG.CAMERA.far;
 this.sceneManager.camera.updateProjectionMatrix();
 }

 const scaleButton = document.getElementById(UI_ELEMENTS.SCALE_BUTTON);
 if (scaleButton) {
 scaleButton.classList.toggle('active', realisticScale);
 scaleButton.setAttribute('aria-pressed', realisticScale.toString());
 const btnText = scaleButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = this.getScaleModeLabel(normalizedMode);
 }
 }

 if (persist) {
 safeSetItem(STORAGE_KEYS.SCALE_MODE, normalizedMode);
 safeSetItem(STORAGE_KEYS.SCALE, realisticScale.toString());
 safeSetItem(STORAGE_KEYS.SCIENTIFIC, scientificMode.toString());
 }
 }

 cycleScaleMode() {
 const currentMode = this.getCurrentScaleMode();
 const nextMode = currentMode === 'scientific' ? 'educational' : 'scientific';
 this.applyScaleMode(nextMode);
 }

 // Orbit mode cycling: 'all' → 'planets' → 'dwarfs' → 'moons' → 'comets' → 'none' → 'all'
 _orbitModeNext(current) {
 const cycle = { 'all': 'planets', 'planets': 'dwarfs', 'dwarfs': 'moons', 'moons': 'comets', 'comets': 'none', 'none': 'all' };
 return cycle[current] || 'all';
 }

 _orbitModeLabel(mode) {
 const t = window.t || (k => k);
 const labels = {
 'all': t('orbitModeAll') || 'All Orbits',
 'planets': t('orbitModePlanets') || 'Planets',
 'dwarfs': t('orbitModeDwarfs') || 'Dwarf Planets',
 'moons': t('orbitModeMoons') || 'Moons',
 'comets': t('orbitModeComets') || 'Comets',
 'none': t('orbitModeNone') || 'Orbits'
 };
 return labels[mode] || 'Orbits';
 }

 _updateOrbitButton(mode) {
 const orbitsButton = document.getElementById(UI_ELEMENTS.ORBITS_BUTTON);
 if (!orbitsButton) return;
 const active = (mode !== 'none');
 orbitsButton.classList.toggle('toggle-on', active);
 orbitsButton.setAttribute('aria-pressed', active.toString());
 const btnText = orbitsButton.querySelector('.btn-text');
 if (btnText) btnText.textContent = this._orbitModeLabel(mode);
 }

 applyOrbitMode(mode, { persist = true } = {}) {
 if (!this.solarSystemModule) return;
 // Map legacy boolean strings to mode names
 if (mode === 'true') mode = 'all';
 if (mode === 'false') mode = 'none';
 const validModes = ['all', 'planets', 'dwarfs', 'moons', 'comets', 'none'];
 if (!validModes.includes(mode)) mode = 'all';
 this.solarSystemModule.setOrbitMode(mode);
 this._updateOrbitButton(mode);
 if (persist) safeSetItem(STORAGE_KEYS.ORBITS, mode);
 }

 cycleOrbitMode() {
 const current = this.solarSystemModule?.orbitMode || 'all';
 this.applyOrbitMode(this._orbitModeNext(current));
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

 // Close settings modal
 window.closeSettingsModal = () => {
 this.uiManager.closeSettingsModal();
 };

 // Wire up help close button (replaces inline onclick)
 const helpCloseBtn = document.getElementById('help-close-btn');
 if (helpCloseBtn) {
 helpCloseBtn.addEventListener('click', () => this.uiManager.closeHelpModal());
 }

 const settingsCloseBtn = document.getElementById('settings-close-btn');
 if (settingsCloseBtn) {
 settingsCloseBtn.addEventListener('click', () => this.uiManager.closeSettingsModal());
 }
 
 // Setup info panel close button with proper event listener
 this.setupInfoPanelCloseButton();
 }
 
 setupInfoPanelCloseButton() {
 const infoPanel = document.getElementById('info-panel');
 if (!infoPanel) return;
 
 const closeBtn = infoPanel.querySelector('.close-btn');
 if (!closeBtn) return;
 
 // Add direct click listener as backup to inline onclick
 closeBtn.addEventListener('click', (e) => {
 e.stopPropagation();
 this.uiManager.closeInfoPanel();
 });
 
 // Ensure touch events work properly on mobile
 closeBtn.addEventListener('touchend', (e) => {
 e.preventDefault();
 e.stopPropagation();
 this.uiManager.closeInfoPanel();
 }, { passive: false });
 }

 setupHelpButton() {
 const helpButton = document.getElementById('help-button');
 if (helpButton) {
 helpButton.addEventListener('click', () => {
 this.uiManager.showHelp(t('helpContent'));
 }, { passive: true });
 }

 const settingsButton = document.getElementById(UI_ELEMENTS.SETTINGS_BUTTON);
 if (settingsButton) {
 settingsButton.addEventListener('click', () => {
 this.uiManager.showSettings();
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
 
 // Orbit mode cycle button: planets+moons → comets → all → none → ...
 const orbitsButton = document.getElementById(UI_ELEMENTS.ORBITS_BUTTON);
 if (orbitsButton) {
 orbitsButton.addEventListener('click', () => {
 if (this.solarSystemModule) this.cycleOrbitMode();
 });
 }
 
 // Constellation toggle button
 // Note: Initial state is restored in restoreSavedToggleStates() after solar system is ready
 const constellationsButton = document.getElementById(UI_ELEMENTS.CONSTELLATIONS_BUTTON);
 if (constellationsButton) {
 constellationsButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 const visible = !this.solarSystemModule.constellationsVisible;
 this.solarSystemModule.toggleConstellations(visible);
 constellationsButton.classList.toggle('toggle-on', visible);
 constellationsButton.setAttribute('aria-pressed', visible.toString());
 safeSetItem(STORAGE_KEYS.CONSTELLATIONS, visible.toString());
 }
 });
 }

 // Bloom toggle button — desktop only (mobile hides it; on desktop always show
 // regardless of whether EffectComposer initialized, so the button is never
 // silently absent due to a post-processing init failure).
 const bloomButton = document.getElementById(UI_ELEMENTS.BLOOM_BUTTON);
 if (bloomButton) {
 if (IS_MOBILE) {
 bloomButton.classList.add('hidden');
 } else {
 // Restore bloom state from localStorage (default: off)
 const savedBloom = safeGetItem('bloomEnabled');
 const bloomOn = savedBloom === 'true';
 if (!bloomOn && this.sceneManager.composer) {
 this.sceneManager.toggleBloom(false);
 }
 bloomButton.classList.toggle('toggle-on', bloomOn);
 bloomButton.setAttribute('aria-pressed', bloomOn.toString());

 bloomButton.addEventListener('click', () => {
 if (!this.sceneManager.composer) return; // post-processing not available
 const enabled = bloomButton.getAttribute('aria-pressed') !== 'true';
 this.sceneManager.toggleBloom(enabled);
 bloomButton.setAttribute('aria-pressed', enabled.toString());
 bloomButton.classList.toggle('toggle-on', enabled);
 safeSetItem('bloomEnabled', enabled.toString());
 });
 }
 }

 // Scale toggle button
 // Note: Initial state is restored in restoreSavedToggleStates() after solar system is ready
 const scaleButton = document.getElementById(UI_ELEMENTS.SCALE_BUTTON);
 if (scaleButton) {
 scaleButton.addEventListener('click', () => {
 this.cycleScaleMode();
 });
 }
 
 // Labels toggle button
 // Note: Initial state is restored in restoreSavedToggleStates() after solar system is ready
 const labelsButton = document.getElementById(UI_ELEMENTS.LABELS_BUTTON);
 if (labelsButton) {
 labelsButton.addEventListener('click', () => {
 if (this.solarSystemModule && this.solarSystemModule.toggleLabels) {
 if (this.sceneManager) {
 this.sceneManager.labelsVisible = !this.sceneManager.labelsVisible;
 this.solarSystemModule.toggleLabels(this.sceneManager.labelsVisible);
 labelsButton.classList.toggle('toggle-on', this.sceneManager.labelsVisible);
 labelsButton.setAttribute('aria-pressed', this.sceneManager.labelsVisible.toString());
 const btnText = labelsButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = this.sceneManager.labelsVisible ? 
 t('toggleLabelsOn') : t('toggleLabels');
 }
 safeSetItem(STORAGE_KEYS.LABELS, this.sceneManager.labelsVisible.toString());
 }
 }
 });
 }
 
 // Reset view button
 const resetButton = document.getElementById(UI_ELEMENTS.RESET_VIEW);
 if (resetButton) {
 resetButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 this.solarSystemModule.focusedObject = null;
 this.solarSystemModule.resetConstellationHighlight();
 }
 this.sceneManager.resetCamera();
 // Keep the scale-appropriate limits after reset
 if (this.solarSystemModule?.realisticScale) {
 if (this.sceneManager?.controls) this.sceneManager.controls.maxDistance = 800000;
 if (this.sceneManager?.camera) {
 this.sceneManager.camera.far = 2000000;
 this.sceneManager.camera.updateProjectionMatrix();
 }
 }
 });
 }
 // Canvas click for object selection
 this.sceneManager.renderer.domElement.addEventListener('click', (e) => {
 this.handleCanvasClick(e);
 });

 // Canvas hover + drag detection (single listener for efficiency)
 this.sceneManager.renderer.domElement.addEventListener('mousemove', (e) => {
 // Drag detection
 if (this._mouseDownPos) {
 const dx = e.clientX - this._mouseDownPos.x;
 const dy = e.clientY - this._mouseDownPos.y;
 if (dx * dx + dy * dy > 16) { // 4px threshold squared
 this._isDragging = true;
 this.hideHoverLabel();
 return;
 }
 }
 // Hover (skip during drag — handleCanvasHover has its own guard too)
 if (!this._isDragging) {
 this.handleCanvasHover(e);
 }
 }, { passive: true });

 // Hide tooltip when mouse leaves canvas
 this.sceneManager.renderer.domElement.addEventListener('mouseleave', () => {
 this.hideHoverLabel();
 this._mouseDownPos = null;
 this._isDragging = false;
 });

 // Track drag vs click
 this.sceneManager.renderer.domElement.addEventListener('mousedown', (e) => {
 this._mouseDownPos = { x: e.clientX, y: e.clientY };
 this._isDragging = false;
 });
 this.sceneManager.renderer.domElement.addEventListener('mouseup', () => {
 this._mouseDownPos = null;
 });
 
 // Navigation dropdown
 const dropdown = document.getElementById(UI_ELEMENTS.DROPDOWN);
 if (dropdown) {
 dropdown.addEventListener('change', (e) => {
 const value = e.target.value;
 if (!value) return; // Ignore the placeholder option
 
 // Reset dropdown to placeholder
 dropdown.value = '';
 
 // Find and focus on the selected object
 if (this.solarSystemModule) {
 const targetObject = this.findObjectByNavigationValue(value);
 
 if (targetObject) {
 const info = this.solarSystemModule.getObjectInfo(targetObject);
 this.uiManager.updateInfoPanel(info);
 this.solarSystemModule.focusOnObject(targetObject, this.sceneManager.camera, this.sceneManager.controls);
 }
 }
 });
 }
 }
 
 findObjectByNavigationValue(value) {
 if (!this.solarSystemModule) return null;

 // Build navigationMap once per App instance (lambdas close over solarSystemModule).
 if (!this._navigationMap) {
 const ssm = this.solarSystemModule;
 this._navigationMap = {
 'sun': () => ssm.sun,
 'mercury': () => ssm.planets.mercury,
 'venus': () => ssm.planets.venus,
 'earth': () => ssm.planets.earth,
 'mars': () => ssm.planets.mars,
 'jupiter': () => ssm.planets.jupiter,
 'saturn': () => ssm.planets.saturn,
 'uranus': () => ssm.planets.uranus,
 'neptune': () => ssm.planets.neptune,
 'pluto': () => ssm.planets.pluto,
 // Earth's Moon - always stored under fixed key 'moon' regardless of language
 'moon': () => ssm.moons['moon'],
 // Moons (direct moon registry access)
 'phobos': () => ssm.moons.phobos,
 'deimos': () => ssm.moons.deimos,
 'io': () => ssm.moons.io,
 'europa': () => ssm.moons.europa,
 'ganymede': () => ssm.moons.ganymede,
 'callisto': () => ssm.moons.callisto,
 'titan': () => ssm.moons.titan,
 'enceladus': () => ssm.moons.enceladus,
 'rhea': () => ssm.moons.rhea,
 'titania': () => ssm.moons.titania,
 'miranda': () => ssm.moons.miranda,
 'triton': () => ssm.moons.triton,
 'charon': () => ssm.moons.charon,
 // Belts
 'asteroid-belt': () => ssm.asteroidBelt,
 'kuiper-belt': () => ssm.kuiperBelt,
 // Oort Cloud
 'oort-cloud': () => ssm.oortCloud,
 // Heliopause
 'heliopause': () => ssm.heliopause,
 // Milky Way Galaxy
 'milky-way': () => ssm.milkyWayDisc,
 // Dwarf Planets (stored in planets registry)
 'ceres': () => ssm.planets.ceres,
 'haumea': () => ssm.planets.haumea,
 'makemake': () => ssm.planets.makemake,
 'eris': () => ssm.planets.eris,
 'orcus': () => ssm.planets.orcus,
 'quaoar': () => ssm.planets.quaoar,
 'gonggong': () => ssm.planets.gonggong,
 'sedna': () => ssm.planets.sedna,
 'salacia': () => ssm.planets.salacia,
 'varda': () => ssm.planets.varda,
 'varuna': () => ssm.planets.varuna,
 };
 }

 // Check direct mapping first
 if (this._navigationMap[value]) {
 return this._navigationMap[value]();
 }

 // Pattern-based lookups use the module-level _NAV_SEARCH_PATTERNS constant.
 for (const category of _NAV_SEARCH_PATTERNS) {
 const searchKey = category.prefix ? value.replace(category.prefix, '') : value;
 const patterns = category.patterns[searchKey];
 
 if (patterns && this.solarSystemModule[category.array]) {
 // Use exact equality for constellation/nebula/galaxy IDs, includes for display names
 const matchFn = category.exactMatch === 'exact'
 ? (name, pattern) => name === pattern
 : (name, pattern) => name.includes(pattern);
 const found = this.solarSystemModule[category.array].find(obj => 
 patterns.some(pattern => matchFn(obj.userData.name, pattern)));
 
 if (found) return found;
 }
 }
 
 return null;
 }

 // ===========================
 // HELPER METHODS
 // ===========================

 /**
  * Calculate normalized mouse coordinates from a click/hover event
  * @param {MouseEvent} event - The mouse event
  * @returns {{x: number, y: number}} Normalized coordinates (-1 to 1)
  */
 _getMouseCoordinates(event) {
 const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
 return {
 x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
 y: -((event.clientY - rect.top) / rect.height) * 2 + 1
 };
 }

 /**
  * Find the first named object in the parent chain
  * @param {THREE.Object3D} object - Starting object
  * @returns {THREE.Object3D|null} The first object with userData.name
  */
 _findNamedParent(object) {
 let current = object;
 while (current && current !== this.sceneManager.scene) {
 if (current.userData && current.userData.name) {
 return current;
 }
 current = current.parent;
 }
 return null;
 }

 /**
  * Check if an object and all its ancestors are visible.
  * Three.js raycaster does NOT check visibility, so we must filter manually.
  */
 _isVisibleInHierarchy(object) {
 let current = object;
 while (current) {
 if (current.visible === false) return false;
 current = current.parent;
 }
 return true;
 }

 /**
  * Perform raycasting and find the closest named object
  * @param {MouseEvent} event - The mouse event
  * @param {boolean} recursiveFirst - Whether to check recursively first
  * @returns {THREE.Object3D|null} The intersected named object
  */
 _raycastNamedObject(event, recursiveFirst = false) {
 if (!this.solarSystemModule) return null;

 const mouse = this._getMouseCoordinates(event);
 this._mouseVec.set(mouse.x, mouse.y);
 
 this.sceneManager.raycaster.setFromCamera(this._mouseVec, this.sceneManager.camera);
 
 // World matrices are already updated by renderer.render() each frame — no need to force update
 
 let intersects;
 if (recursiveFirst) {
 intersects = this.sceneManager.raycaster.intersectObjects(this.solarSystemModule.objects, true);
 } else {
 // Try non-recursive first for better performance
 intersects = this.sceneManager.raycaster.intersectObjects(this.solarSystemModule.objects, false);
 if (intersects.length === 0) {
 intersects = this.sceneManager.raycaster.intersectObjects(this.solarSystemModule.objects, true);
 }
 }
 
 // Collect all named objects from intersections (scan more for moon detection)
 const namedObjects = [];
 for (let i = 0; i < Math.min(intersects.length, 30); i++) {
 const candidate = intersects[i].object;

 // Skip objects that are invisible or belong to a hidden parent group
 // (Three.js raycaster does NOT check visibility — only the renderer does)
 if (!this._isVisibleInHierarchy(candidate)) continue;
 
 if (candidate.userData && candidate.userData.name) {
 if (!namedObjects.some(n => n.object === candidate)) {
 namedObjects.push({ object: candidate, distance: intersects[i].distance });
 }
 } else {
 // Traverse up to find the named parent
 const named = this._findNamedParent(candidate);
 if (named && !namedObjects.some(n => n.object === named)) {
 namedObjects.push({ object: named, distance: intersects[i].distance });
 }
 }
 }
 
 if (namedObjects.length === 0) return null;
 if (namedObjects.length === 1) return namedObjects[0].object;

 // Sort all hits by ray-hit distance (closest first)
 namedObjects.sort((a, b) => a.distance - b.distance);

 // Build a deduplicated list of candidates, preferring objects whose bounding
 // sphere centre is angularly closest to the ray (avoids orbit-ring / glow
 // sphere stealing the hit from the actual body).
 const ray = this.sceneManager.raycaster.ray;
 const scored = namedObjects.map(({ object, distance }) => {
 // Angular distance from ray to object world-space centre
 object.getWorldPosition(this._objCentre);
 this._toObj.copy(this._objCentre).sub(ray.origin).normalize();
 this._crossVec.crossVectors(ray.direction, this._toObj);
 const angularDist = this._crossVec.length(); // sin(angle) ≈ angle for small values

 // Type weights — comets score below all other named objects because their
 // large coma/tail meshes can clip the ray even when hovering over a different
 // object. We detect comets via the explicit isComet flag or the hardcoded
 // English type string 'Comet' (never translated). All other named objects
 // (planets, moons, stars, dwarf planets, exoplanets, etc.) get priority 0
 // regardless of what translated string their `type` field contains — the
 // previous isSolidBody check used hardcoded English names which broke in
 // Dutch ('Planeet'), French ('Planète'), etc., causing comets to win over
 // planets in non-English UIs.
 const isComet = object.userData?.isComet === true || object.userData?.type === 'comet';
 const typeWeight = isComet ? 0.5 : 0;

 return { object, distance, angularDist, typeWeight };
 });

 // Sort: body-type first, then closest angular distance
 scored.sort((a, b) => {
 if (a.typeWeight !== b.typeWeight) return a.typeWeight - b.typeWeight;
 return a.angularDist - b.angularDist;
 });

 // Among body-type candidates that are very close angularly, prefer Moon over
 // its own parent planet (the user deliberately hovered the small body).
 const bodies = scored.filter(s => s.typeWeight === 0);
 if (bodies.length >= 2) {
 const first = bodies[0];
 const second = bodies[1];
 const angularDiff = second.angularDist - first.angularDist;
 // If two bodies are within 0.05 rad (~3°) of each other and one is a moon
 // of the other, prefer the moon.
 if (angularDiff < 0.05) {
 // Moon type is hardcoded 'Moon'; use parentPlanet presence as fallback
 const moonCandidate = [first, second].find(
 s => s.object.userData?.type === 'moon' || s.object.userData?.parentPlanet
 );
 // Planet candidate is the non-moon that the moon orbits
 const planetCandidate = [first, second].find(
 s => s !== moonCandidate && !s.object.userData?.parentPlanet
 );
 if (moonCandidate && planetCandidate &&
 moonCandidate.object.userData?.parentPlanet === planetCandidate.object.userData?.name) {
 return moonCandidate.object;
 }
 }
 }

 return scored[0].object;
 }
 
 // ===========================
 // EVENT HANDLERS
 // ===========================
 
 handleCanvasClick(event) {
 // Ignore clicks that were actually drags (orbit/pan gestures)
 if (this._isDragging) {
 this._isDragging = false;
 return;
 }
 const target = this._raycastNamedObject(event, true);
 
 if (target) {
 // Play selection sound
 audioManager.playSelect();

 const info = this.solarSystemModule.getObjectInfo(target);
 this.uiManager.updateInfoPanel(info);
 this.solarSystemModule.focusOnObject(target, this.sceneManager.camera, this.sceneManager.controls);
 }
 }

 hideHoverLabel() {
 if (this._hoverLabel) {
 this._hoverLabel.classList.remove('visible');
 }
 if (this.sceneManager?.renderer?.domElement) {
 this.sceneManager.renderer.domElement.style.cursor = 'default';
 }
 this._currentHoveredObject = null;
 }

 handleCanvasHover(event) {
 if (!this.solarSystemModule) return;
 if (this._isDragging) return;

 // Throttle hover checks to avoid performance issues
 const now = Date.now();
 if (now - this._lastHoverCheck < 50) return; // Check max every 50ms (20fps)
 this._lastHoverCheck = now;

 // Cache hover label element
 if (!this._hoverLabel) {
 this._hoverLabel = document.getElementById(UI_ELEMENTS.HOVER_LABEL);
 }
 if (!this._hoverLabel) return;

 // Use recursive=true for hover to properly detect child objects (moons, orbits, etc.)
 const target = this._raycastNamedObject(event, true);
 
 if (target) {
 // Store current hovered object
 this._currentHoveredObject = target;

 // Translate object name (star meshes and constellation groups both have userData.name)
 const nameKey = target.userData.name?.replace(/\s+/g, '');
 const displayName = (nameKey && window.t && window.t(nameKey) !== nameKey)
 ? t(nameKey)
 : target.userData.name;

 // Show hover label
 this._hoverLabel.textContent = displayName;
 // Clamp tooltip to viewport so it never clips off the right or bottom edge
 const labelW = this._hoverLabel.offsetWidth || 180;
 const labelH = this._hoverLabel.offsetHeight || 36;
 const tx = Math.min(event.clientX + 15, window.innerWidth  - labelW - 8);
 const ty = Math.min(event.clientY + 15, window.innerHeight - labelH - 8);
 // Use transform:translate (GPU-composited, no layout) instead of left/top
 this._hoverLabel.style.transform = `translate(${tx}px, ${ty}px)`;
 this._hoverLabel.classList.add('visible');
 this.sceneManager.renderer.domElement.style.cursor = 'pointer';
 } else {
 // Hide label if no object hovered
 this.hideHoverLabel();
 }
 }
 
 setupKeyboardShortcuts() {
 document.addEventListener('keydown', (e) => {
 // Ignore if typing in input
 if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
 
 switch(e.key.toLowerCase()) {
 case 'h':
 document.getElementById(UI_ELEMENTS.HELP_BUTTON)?.click();
 break;
 case 'n':
 // N = jump to Now (today's real date)
 document.getElementById('time-now')?.click();
 break;
 case 'r':
 document.getElementById(UI_ELEMENTS.RESET_VIEW)?.click();
 break;
 case 'o':
 document.getElementById(UI_ELEMENTS.ORBITS_BUTTON)?.click();
 break;
 case 'c':
 document.getElementById(UI_ELEMENTS.CONSTELLATIONS_BUTTON)?.click();
 break;
 case 'd':
 document.getElementById(UI_ELEMENTS.LABELS_BUTTON)?.click();
 break;
 case 'b':
 document.getElementById(UI_ELEMENTS.BLOOM_BUTTON)?.click();
 break;
 case 's':
 document.getElementById(UI_ELEMENTS.SCALE_BUTTON)?.click();
 break;
 case 'f': {
 const fpsCounter = document.getElementById(UI_ELEMENTS.FPS_COUNTER);
 if (fpsCounter) fpsCounter.classList.toggle('hidden');
 break;
 }
 case 'l':
 // Toggle VR laser pointers via the dedicated helper (no getObjectByName in hot path)
 if (this.sceneManager.renderer.xr.isPresenting) {
 this.sceneManager._setLasersVisible(!this.sceneManager.lasersVisible);
 }
 break;
 case '+':
 case '=': {
 // Increase speed (slider 0-100)
 const speedSliderUp = document.getElementById(UI_ELEMENTS.SPEED_SLIDER);
 if (speedSliderUp) {
 speedSliderUp.value = Math.min(100, parseFloat(speedSliderUp.value) + 5);
 speedSliderUp.dispatchEvent(new Event('input'));
 audioManager.playSpeedTick();
 }
 break;
 }
 case '-':
 case '_': {
 // Decrease speed (slider 0-100)
 const speedSliderDown = document.getElementById(UI_ELEMENTS.SPEED_SLIDER);
 if (speedSliderDown) {
 speedSliderDown.value = Math.max(0, parseFloat(speedSliderDown.value) - 5);
 speedSliderDown.dispatchEvent(new Event('input'));
 audioManager.playSpeedTick();
 }
 break;
 }
 case '[': {
 // Step Time Machine back 1 month
 const ssmBack = this.solarSystemModule;
 if (ssmBack) {
 const d = jdToDate(ssmBack.simulatedJD);
 d.setUTCMonth(d.getUTCMonth() - 1);
 ssmBack.seekToDate(d);
 audioManager.playSpeedTick();
 }
 break;
 }
 case ']': {
 // Step Time Machine forward 1 month
 const ssmFwd = this.solarSystemModule;
 if (ssmFwd) {
 const d = jdToDate(ssmFwd.simulatedJD);
 d.setUTCMonth(d.getUTCMonth() + 1);
 ssmFwd.seekToDate(d);
 audioManager.playSpeedTick();
 }
 break;
 }
 case 'escape':
 this.uiManager.closeInfoPanel();
 this.uiManager.closeHelpModal();
 this.uiManager.closeSettingsModal();
 break;
 case ',':
 // Comma = open Settings (matches tooltip hint)
 document.getElementById(UI_ELEMENTS.SETTINGS_BUTTON)?.click();
 break;
 case ' ': {
 // SPACE = Toggle between Paused and Normal speed (50 = 1x)
 e.preventDefault();
 const spaceSpeedSlider = document.getElementById(UI_ELEMENTS.SPEED_SLIDER);
 if (spaceSpeedSlider) {
 spaceSpeedSlider.value = this.timeSpeed === 0 ? '50' : '0';
 spaceSpeedSlider.dispatchEvent(new Event('input'));
 audioManager.playClick();
 }
 break;
 }
 case 'i':
 // Find and focus on ISS
 if (this.solarSystemModule?.satellites) {
 const iss = this.solarSystemModule.satellites.find(s => 
 s.userData.name && s.userData.name.includes('ISS'));
 if (iss) {
 this.solarSystemModule.focusOnObject(iss, this.sceneManager.camera, this.sceneManager.controls);
 }
 }
 break;
 case 'v':
 // Cycle through Voyager probes
 if (this.solarSystemModule?.spacecraft) {
 const voyagers = this.solarSystemModule.spacecraft.filter(s =>
 s.userData.name && s.userData.name.includes('Voyager'));
 if (voyagers.length > 0) {
 this._voyagerIndex = (this._voyagerIndex + 1) % voyagers.length;
 this.solarSystemModule.focusOnObject(voyagers[this._voyagerIndex], this.sceneManager.camera, this.sceneManager.controls);
 }
 }
 break;
 case 'p':
 // Cycle through deep space probes
 if (this.solarSystemModule?.spacecraft) {
 const probes = this.solarSystemModule.spacecraft.filter(s => s.userData.type === 'probe');
 if (probes.length > 0) {
 this._probeIndex = (this._probeIndex + 1) % probes.length;
 this.solarSystemModule.focusOnObject(probes[this._probeIndex], this.sceneManager.camera, this.sceneManager.controls);
 }
 }
 break;
 }
 });
 }
 
 setupFPSCounter() {
 this._fpsFrameCount = 0;
 this._fpsLastTime = performance.now();
 this._fpsValueEl = document.getElementById('fps-value');
 this._fpsCounterEl = document.getElementById('fps-counter');
 }

 updateFPSCounter() {
 this._fpsFrameCount++;
 const currentTime = performance.now();

 if (currentTime >= this._fpsLastTime + 1000) {
 const fps = Math.round((this._fpsFrameCount * 1000) / (currentTime - this._fpsLastTime));
 if (this._fpsValueEl) {
 this._fpsValueEl.textContent = fps;
 }

 // Update color based on FPS
 if (this._fpsCounterEl) {
 this._fpsCounterEl.classList.remove('good', 'warning', 'bad');
 if (fps >= 55) {
 this._fpsCounterEl.classList.add('good');
 } else if (fps >= 30) {
 this._fpsCounterEl.classList.add('warning');
 } else {
 this._fpsCounterEl.classList.add('bad');
 }
 }

 this._fpsFrameCount = 0;
 this._fpsLastTime = currentTime;
 }
 }
 
 // ===========================
 // UX IMPROVEMENTS v2.3
 // ===========================
 
 preSelectEarth() {
 // Pre-select Earth on first visit to show users what to expect
 const isFirstVisit = !safeGetItem('space_voyage_visited');
 
 if (isFirstVisit && this.solarSystemModule?.planets?.earth) {
 // Small delay to ensure everything is rendered
 setTimeout(() => {
 // Skip if user already interacted with something
 if (this.solarSystemModule.focusedObject) return;
 const earth = this.solarSystemModule.planets.earth;
 const info = this.solarSystemModule.getObjectInfo(earth);
 this.uiManager.updateInfoPanel(info);
 this.solarSystemModule.focusOnObject(earth, this.sceneManager.camera, this.sceneManager.controls);
 safeSetItem('space_voyage_visited', 'true');
 }, 500);
 }
 }
 
 setupRandomDiscovery() {
 const randomBtn = document.getElementById('random-discovery');
 if (!randomBtn || !this.solarSystemModule) return;
 
 // Curated list of interesting objects for discovery
 const discoveryObjects = [
 'sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn',
 'uranus', 'neptune', 'pluto', 'io', 'europa', 'titan', 'enceladus',
 'triton', 'ganymede', 'callisto', 'ceres', 'eris', 'haumea'
 ];
 
 randomBtn.addEventListener('click', () => {
 // Play whoosh sound for discovery
 audioManager.playWhoosh();

 // Pick a random object
 const randomValue = discoveryObjects[Math.floor(Math.random() * discoveryObjects.length)];
 const targetObject = this.findObjectByNavigationValue(randomValue);
 
 if (targetObject) {
 // Add a fun spin animation before focusing
 randomBtn.classList.add('spinning');
 setTimeout(() => randomBtn.classList.remove('spinning'), 500);
 
 const info = this.solarSystemModule.getObjectInfo(targetObject);
 this.uiManager.updateInfoPanel(info);
 this.solarSystemModule.focusOnObject(targetObject, this.sceneManager.camera, this.sceneManager.controls);

 // Play discovery fanfare after a slight delay
 setTimeout(() => audioManager.playDiscovery(), 300);
 }
 });
 }

 setupTimeMachine() {
 const ssm = this.solarSystemModule;
 if (!ssm) return;

 const dateDisplay = document.getElementById('sim-date-display');
 const reverseBtn = document.getElementById('time-reverse');
 const nowBtn = document.getElementById('time-now');

 // Prevent duplicate listeners if setup is ever invoked more than once
 if (this._onSimulatedDateChanged) {
 window.removeEventListener('simulatedDateChanged', this._onSimulatedDateChanged);
 this._onSimulatedDateChanged = null;
 }

 // Formatter rebuilt lazily whenever <html lang> changes (language switch mid-session)
 let _fmtLocale = '';
 let _fmtObj = null;
 let lastIsoDate = '';
 const _getDateFormatter = () => {
 const locale = document.documentElement?.lang || navigator.language || 'en-US';
 if (locale !== _fmtLocale) {
 _fmtLocale = locale;
 _fmtObj = new Intl.DateTimeFormat(locale, {
 year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
 });
 lastIsoDate = ''; // force re-render with new locale even if date unchanged
 }
 return _fmtObj;
 };

 // ── Date display updater ──────────────────────────────────────────────
 const updateDateDisplay = (jd) => {
 if (!dateDisplay) return;
 const d = jdToDate(jd);
 const iso = d.toISOString().slice(0, 10);
 if (iso === lastIsoDate) return;
 lastIsoDate = iso;

 dateDisplay.textContent = _getDateFormatter().format(d);
 };

 // Listen for the date-changed event emitted by SolarSystemModule
 this._onSimulatedDateChanged = (e) => {
 const jd = e?.detail?.jd;
 if (typeof jd !== 'number' || !Number.isFinite(jd)) return;
 updateDateDisplay(jd);
 };
 window.addEventListener('simulatedDateChanged', this._onSimulatedDateChanged);
 // Trigger once immediately so the display isn't blank
 updateDateDisplay(ssm.simulatedJD);

 // ── Step helper ───────────────────────────────────────────────────────
 // Steps always match button labels: −10y always goes 10 yrs back.
 // isTimeReversed only affects auto-play direction, not manual jumps.
 const stepDate = (years, months, days) => {
 const current = jdToDate(ssm.simulatedJD);
 if (years) current.setUTCFullYear(current.getUTCFullYear() + years);
 if (months) current.setUTCMonth(current.getUTCMonth() + months);
 if (days) current.setUTCDate(current.getUTCDate() + days);
 ssm.seekToDate(current);
 audioManager.playClick();
 };

 // ── Step buttons ──────────────────────────────────────────────────────
 const steps = [
 ['time-step-back-decade', -10, 0, 0],
 ['time-step-back-year', -1, 0, 0],
 ['time-step-back-month', 0, -1, 0],
 ['time-step-fwd-month', 0, 1, 0],
 ['time-step-fwd-year', 1, 0, 0],
 ['time-step-fwd-decade', 10, 0, 0],
 ];
 steps.forEach(([id, y, mo, d]) => {
 const btn = document.getElementById(id);
 if (!btn) return;
 btn.addEventListener('click', () => stepDate(y, mo, d));
 });

 // ── Reverse toggle ────────────────────────────────────────────────────
 if (reverseBtn) {
 reverseBtn.addEventListener('click', () => {
 this.isTimeReversed = !this.isTimeReversed;
 reverseBtn.setAttribute('aria-pressed', this.isTimeReversed.toString());
 reverseBtn.classList.toggle('active', this.isTimeReversed);
 audioManager.playSpeedTick();
 });
 }

 // ── Now button ────────────────────────────────────────────────────────
 if (nowBtn) {
 nowBtn.addEventListener('click', () => {
 this.isTimeReversed = false;
 if (reverseBtn) {
 reverseBtn.setAttribute('aria-pressed', 'false');
 reverseBtn.classList.remove('active');
 }
 ssm.seekToDate(new Date());
 });
 }

 }

 showEventToast(text) {
 const existing = document.getElementById('event-toast');
 if (existing) existing.remove();
 const toast = document.createElement('div');
 toast.id = 'event-toast';
 toast.className = 'event-toast';
 toast.textContent = text;
 document.body.appendChild(toast);
 requestAnimationFrame(() => toast.classList.add('event-toast--visible'));
 clearTimeout(this._toastTimer);
 this._toastTimer = setTimeout(() => {
 toast.classList.remove('event-toast--visible');
 setTimeout(() => toast.remove(), 400);
 }, 3500);
 }

 // Notable event descriptions keyed by ISO date value.
 // The outer object is allocated once and cached on the instance.
 _getEventDescriptions() {
 if (this._cachedEventDescriptions) return this._cachedEventDescriptions;
 this._cachedEventDescriptions = {
 // Solar Eclipses
 '2024-04-08': { name: 'Total Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2024' },
 '2025-03-29': { name: 'Partial Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2025Mar' },
 '2026-02-17': { name: 'Annular Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2026Feb' },
 '2026-08-12': { name: 'Total Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2026Aug' },
 '2027-08-02': { name: 'Total Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2027' },
 '2028-07-22': { name: 'Total Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2028' },
 '2030-06-01': { name: 'Annular Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2030Jun' },
 '2030-11-25': { name: 'Total Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2030Nov' },
 '2033-03-30': { name: 'Total Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2033' },
 '2035-09-02': { name: 'Total Solar Eclipse', type: '🌑 Solar Eclipse', i18nKey: 'eventSolarEclipse2035' },
 // Mars Oppositions
 '2025-01-16': { name: 'Mars at Opposition', type: '🔴 Mars Opposition', i18nKey: 'eventMarsOpposition2025' },
 '2027-02-19': { name: 'Mars at Opposition', type: '🔴 Mars Opposition', i18nKey: 'eventMarsOpposition2027' },
 '2029-03-29': { name: 'Mars at Opposition', type: '🔴 Mars Opposition', i18nKey: 'eventMarsOpposition2029' },
 '2031-05-04': { name: 'Mars at Opposition (Perihelic)', type: '🔴 Mars Opposition', i18nKey: 'eventMarsOpposition2031' },
 // Outer Planet Oppositions
 '2024-11-16': { name: 'Uranus at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventUranusOpposition' },
 '2025-09-21': { name: 'Saturn at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventSaturnOpposition' },
 '2025-09-23': { name: 'Neptune at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventNeptuneOpposition' },
 '2025-11-05': { name: 'Jupiter at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventJupiterOpposition' },
 '2025-11-21': { name: 'Uranus at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventUranusOpposition' },
 '2026-09-24': { name: 'Neptune at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventNeptuneOpposition' },
 '2026-10-04': { name: 'Saturn at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventSaturnOpposition' },
 '2026-12-02': { name: 'Uranus at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventUranusOpposition' },
 '2026-12-07': { name: 'Jupiter at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventJupiterOpposition' },
 '2027-10-17': { name: 'Saturn at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventSaturnOpposition' },
 '2028-01-10': { name: 'Jupiter at Opposition', type: '🟤 Outer Planet Opposition', i18nKey: 'eventJupiterOpposition' },
 // Conjunctions & Alignments
 '2020-12-21': { name: 'Great Jupiter–Saturn Conjunction', type: '✨ Conjunction', i18nKey: 'eventGreatConjunction2020' },
 '2022-06-24': { name: '5-Planet Alignment', type: '✨ Alignment', i18nKey: 'eventPlanetAlignment2022' },
 '2023-03-01': { name: 'Jupiter–Venus Conjunction', type: '✨ Conjunction', i18nKey: 'eventJupiterVenus2023' },
 '2024-08-14': { name: 'Mars–Jupiter Conjunction', type: '✨ Conjunction', i18nKey: 'eventMarsJupiter2024' },
 '2025-02-01': { name: 'Venus–Saturn Close Conjunction', type: '✨ Conjunction', i18nKey: 'eventVenusSaturn2025' },
 '2025-08-12': { name: 'Venus–Jupiter Close Conjunction', type: '✨ Conjunction', i18nKey: 'eventVenusJupiter2025' },
 '2040-10-31': { name: 'Jupiter–Saturn Great Conjunction', type: '✨ Conjunction', i18nKey: 'eventGreatConjunction2040' },
 // Famous Comets
 '1910-04-20': { name: "Halley's Comet Perihelion", type: '☄️ Comet', i18nKey: 'eventHalley1910' },
 '1986-02-09': { name: "Halley's Comet Perihelion", type: '☄️ Comet', i18nKey: 'eventHalley1986' },
 '1997-03-22': { name: 'Comet Hale-Bopp Perihelion', type: '☄️ Comet', i18nKey: 'eventHaleBopp1997' },
 '2020-07-23': { name: 'Comet NEOWISE Closest Approach', type: '☄️ Comet', i18nKey: 'eventNeowise2020' },
 '2024-10-12': { name: 'Comet Tsuchinshan-ATLAS', type: '☄️ Comet', i18nKey: 'eventTsuchinshan2024' },
 '2061-07-28': { name: "Halley's Comet Next Perihelion", type: '☄️ Comet', i18nKey: 'eventHalley2061' },
 // Space Age Milestones
 '1957-10-04': { name: 'Sputnik 1', type: '🚀 Space Milestone', i18nKey: 'eventSputnik1957' },
 '1961-04-12': { name: 'Yuri Gagarin — First Human in Space', type: '🚀 Space Milestone', i18nKey: 'eventGagarin1961' },
 '1969-07-20': { name: 'Apollo 11 — First Moon Landing', type: '🚀 Space Milestone', i18nKey: 'eventApollo111969' },
 '1972-12-07': { name: 'Apollo 17 — Last Moon Landing', type: '🚀 Space Milestone', i18nKey: 'eventApollo171972' },
 '1977-09-05': { name: 'Voyager 1 Launch', type: '🚀 Space Milestone', i18nKey: 'eventVoyager1Launch' },
 '1990-02-14': { name: 'Voyager 1 — "Pale Blue Dot" Photo', type: '🚀 Space Milestone', i18nKey: 'eventPaleBlueDot' },
 '1994-07-16': { name: 'Shoemaker-Levy 9 Impacts Jupiter', type: '🚀 Space Milestone', i18nKey: 'eventShoemakerLevy1994' },
 '2006-01-19': { name: 'New Horizons Launch toward Pluto', type: '🚀 Space Milestone', i18nKey: 'eventNewHorizonsLaunch' },
 '2015-07-14': { name: 'New Horizons — Pluto Flyby', type: '🚀 Space Milestone', i18nKey: 'eventNewHorizonsFlyby' },
 '2021-02-18': { name: 'Perseverance Rover — Mars Landing', type: '🚀 Space Milestone', i18nKey: 'eventPerseverance2021' },
 // Historic Discoveries
 '1543-05-24': { name: 'Copernicus Publishes Heliocentric Model', type: '📜 Historic Discovery', i18nKey: 'eventCopernicus1543' },
 '1066-04-24': { name: "Halley's Comet — Battle of Hastings Era", type: '📜 Historic Discovery', i18nKey: 'eventHalley1066' },
 '1610-01-07': { name: "Galileo Discovers Jupiter's Moons", type: '📜 Historic Discovery', i18nKey: 'eventGalileo1610' },
 '1655-03-25': { name: 'Huygens Discovers Titan', type: '📜 Historic Discovery', i18nKey: 'eventHuygens1655' },
 '1781-03-13': { name: 'Herschel Discovers Uranus', type: '📜 Historic Discovery', i18nKey: 'eventHerschel1781' },
 '1846-09-23': { name: 'Discovery of Neptune', type: '📜 Historic Discovery', i18nKey: 'eventNeptune1846' },
 '1930-02-18': { name: 'Tombaugh Discovers Pluto', type: '📜 Historic Discovery', i18nKey: 'eventPluto1930' },
 '1979-03-05': { name: 'Voyager 1 — Jupiter Flyby', type: '📜 Historic Discovery', i18nKey: 'eventVoyager1Jupiter1979' },
 };
 return this._cachedEventDescriptions;
 }

 _showEventInfo(dateValue, eventLabel, focusKey) {
 const t = window.t || ((key) => key);
 const eventDescs = this._getEventDescriptions();
 // Try composite key (date|focus) first, then date-only fallback
 const eventData = eventDescs[`${dateValue}|${focusKey}`] || eventDescs[dateValue];

 if (eventData) {
 const descKey = eventData.i18nKey;
 const translatedDesc = (window.t && t(descKey) !== descKey) ? t(descKey) : eventData.name;
 const dateObj = new Date(dateValue + 'T12:00:00Z');
 const dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
 this.uiManager.updateInfoPanel({
 name: eventData.name,
 type: eventData.type,
 distance: dateStr,
 size: '',
 description: translatedDesc
 });
 } else if (focusKey) {
 // Fallback: show focused object info
 const focusTarget = this.findObjectByNavigationValue(focusKey);
 if (focusTarget) {
 const info = this.solarSystemModule.getObjectInfo(focusTarget);
 if (info) this.uiManager.updateInfoPanel(info);
 }
 }
 }

 _handlePaleBlueDot(ssm) {
 // Voyager 1 took the Pale Blue Dot photo on Feb 14, 1990 at ~6 billion km (40 AU) from Earth.
 // Position the camera at Voyager 1's location, looking back toward Earth.
 const voyager1 = this.findObjectByNavigationValue('voyager-1');
 const earth = this.findObjectByNavigationValue('earth');
 if (!voyager1 || !earth) {
 // Fallback: focus on Earth
 if (earth) {
 this.solarSystemModule.focusOnObject(earth, this.sceneManager.camera, this.sceneManager.controls);
 }
 return;
 }

 const camera = this.sceneManager.camera;
 const controls = this.sceneManager.controls;

 // Get Voyager 1 and Earth world positions
 const voyagerPos = new THREE.Vector3();
 const earthPos = new THREE.Vector3();
 voyager1.getWorldPosition(voyagerPos);
 earth.getWorldPosition(earthPos);

 // Position camera near Voyager 1, slightly offset so the spacecraft is visible
 const dirToEarth = new THREE.Vector3().subVectors(earthPos, voyagerPos).normalize();
 // Offset camera slightly to the side so Voyager 1 is in the corner of the view
 const side = new THREE.Vector3().crossVectors(dirToEarth, new THREE.Vector3(0, 1, 0)).normalize();
 const cameraOffset = 3; // Small offset from Voyager
 camera.position.copy(voyagerPos).add(side.clone().multiplyScalar(cameraOffset)).add(new THREE.Vector3(0, 1, 0));

 // Look toward Earth (the pale blue dot in the distance)
 controls.target.copy(earthPos);
 controls.update();

 // Disable tracking/follow so camera stays fixed at this dramatic viewpoint
 this.solarSystemModule.cameraFollowMode = false;
 this.solarSystemModule.cameraCoRotateMode = false;
 this.solarSystemModule.focusedObject = voyager1;

 // Set zoom limits appropriate for this extreme distance
 controls.minDistance = 1;
 controls.maxDistance = 50000;

 if (DEBUG.enabled) console.log(' [Pale Blue Dot] Camera at Voyager 1 position, looking back at Earth');
 }

 setupNavigationSearch() {
 const searchInput = document.getElementById('nav-search');
 const dropdown = document.getElementById('object-dropdown');
 
 if (!searchInput || !dropdown) return;
 
 // Preserve original nodes for restoring the complete grouped dropdown.
 const originalNodes = Array.from(dropdown.children).map((child) => child.cloneNode(true));

 // Translated option data — built lazily on the first keystroke so that
 // window.applyTranslations() has already run by then. Invalidated on restore.
 let _cachedOptions = null;
 const getOptions = () => {
 if (!_cachedOptions) {
 _cachedOptions = Array.from(dropdown.querySelectorAll('option'))
 .filter(o => o.value)
 .map(o => ({ value: o.value, text: o.textContent }));
 }
 return _cachedOptions;
 };

 const restoreDropdown = () => {
 dropdown.replaceChildren(...originalNodes.map((child) => child.cloneNode(true)));
 // Re-apply translations only once on restore (this is a rare event).
 if (window.applyTranslations) window.applyTranslations();
 _cachedOptions = null; // invalidate so next filter re-reads translated text
 };
 
 searchInput.addEventListener('input', (e) => {
 const query = e.target.value.toLowerCase().trim();

 if (!query) {
 restoreDropdown();
 return;
 }

 // Filter against cached translated text — no full DOM rebuild per keystroke.
 const matches = getOptions().filter(o =>
 o.text.toLowerCase().includes(query) ||
 o.value.toLowerCase().includes(query)
 );
 
 // Rebuild dropdown with matches (no optgroups during search).
 const placeholder = document.createElement('option');
 placeholder.value = '';
 const t = window.t || ((k) => k);
 placeholder.textContent = matches.length > 0
 ? (matches.length === 1 ? t('searchResults') : t('searchResultsPlural')).replace('{n}', matches.length)
 : t('searchNoResults');
 dropdown.replaceChildren(placeholder);
 
 matches.forEach(({ value, text }) => {
 const opt = document.createElement('option');
 opt.value = value;
 opt.textContent = text;
 dropdown.appendChild(opt);
 });
 });
 
 // Clear search when dropdown is used
 dropdown.addEventListener('change', () => {
 if (dropdown.value) {
 searchInput.value = '';
 restoreDropdown();
 }
 });
 }
 
 setupMobileGestureHints() {
 // Only show on touch devices
 const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
 const hasSeenHints = safeGetItem('space_voyage_gesture_hints_seen');
 
 if (!isTouchDevice || hasSeenHints) return;
 
 const hints = document.getElementById('gesture-hints');
 if (!hints) return;
 
 // Show hints after a delay
 setTimeout(() => {
 hints.classList.remove('hidden');
 
 // Auto-hide after 5 seconds
 setTimeout(() => {
 hints.classList.add('hidden');
 safeSetItem('space_voyage_gesture_hints_seen', 'true');
 }, 5000);
 }, 2000);

 // Hide immediately on any touch
 document.addEventListener('touchstart', () => {
 hints.classList.add('hidden');
 safeSetItem('space_voyage_gesture_hints_seen', 'true');
 }, { once: true, passive: true });
 }
 
 setupSpaceFacts() {
 const factText = document.getElementById('fact-text');
 if (!factText) return;

 // t() late-binds to the fully-initialised translation function so facts match the active language
 const spaceFacts = [
 t('funFactSun'),
 t('funFactMercury'),
 t('funFactVenus'),
 t('funFactEarth'),
 t('funFactMoon'),
 t('funFactMars'),
 t('funFactJupiter'),
 t('funFactSaturn'),
 t('funFactUranus'),
 t('funFactNeptune'),
 t('funFactPluto'),
 t('funFactVoyager1'),
 t('funFactCassini'),
 t('funFactJWST'),
 t('funFactISS')
 ];
 
 let factIndex = Math.floor(Math.random() * spaceFacts.length);
 // Set first fact immediately (don't wait 4s for first cycle)
 factText.textContent = spaceFacts[factIndex];

 // Rotate facts every 4 seconds during loading, picking randomly
 const factInterval = setInterval(() => {
 let nextIndex;
 do { nextIndex = Math.floor(Math.random() * spaceFacts.length); }
 while (nextIndex === factIndex && spaceFacts.length > 1);
 factIndex = nextIndex;
 factText.style.opacity = '0';
 setTimeout(() => {
 factText.textContent = spaceFacts[factIndex];
 factText.style.opacity = '1';
 }, 200);
 }, 4000);
 
 // Stop rotating when loading is done
 const loadingElement = document.getElementById('loading');
 if (loadingElement) {
 const observer = new MutationObserver((mutations) => {
 mutations.forEach((mutation) => {
 if (mutation.target.classList.contains('hidden')) {
 clearInterval(factInterval);
 observer.disconnect();
 }
 });
 });
 observer.observe(loadingElement, { attributes: true, attributeFilter: ['class'] });
 }
 }

 /**
  * Setup sound toggle button in speed panel
  */
 setupSoundToggle() {
 const soundToggle = document.getElementById('sound-toggle');
 if (!soundToggle) return;

 // Load saved preference
 const soundEnabled = safeGetItem('space_voyage_sound') !== 'false';
 audioManager.enabled = soundEnabled;
 soundToggle.checked = soundEnabled;

 const updateLabel = () => {
 const label = soundToggle.closest('.settings-toggle')?.querySelector('.settings-toggle-label');
 if (label) label.textContent = audioManager.enabled ? t('toggleSoundOn') : t('toggleSoundOff');
 };
 updateLabel();

 soundToggle.addEventListener('change', () => {
 audioManager.enabled = soundToggle.checked;
 safeSetItem('space_voyage_sound', audioManager.enabled);
 updateLabel();
 if (audioManager.enabled) audioManager.playClick();
 });
 }

 syncLocalizedControlStates() {
 this._updateOrbitButton(this.solarSystemModule?.orbitMode || 'all');

 const labelsButton = document.getElementById(UI_ELEMENTS.LABELS_BUTTON);
 if (labelsButton && this.sceneManager) {
 const labelsVisible = this.sceneManager.labelsVisible;
 labelsButton.classList.toggle('toggle-on', labelsVisible);
 labelsButton.setAttribute('aria-pressed', labelsVisible.toString());
 const btnText = labelsButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = labelsVisible ? t('toggleLabelsOn') : t('toggleLabels');
 }
 }

 const scaleMode = this.getCurrentScaleMode();
 const scaleButton = document.getElementById(UI_ELEMENTS.SCALE_BUTTON);
 if (scaleButton) {
 const scientificMode = scaleMode === 'scientific';
 scaleButton.classList.toggle('active', scientificMode);
 scaleButton.setAttribute('aria-pressed', scientificMode.toString());
 const btnText = scaleButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = this.getScaleModeLabel(scaleMode);
 }
 }

 const soundToggle = document.getElementById('sound-toggle');
 if (soundToggle) {
 const label = soundToggle.closest('.settings-toggle')?.querySelector('.settings-toggle-label');
 if (label) label.textContent = audioManager.enabled ? t('toggleSoundOn') : t('toggleSoundOff');
 }
 }

 /**
  * Add click sounds to footer buttons
  */
 setupButtonSounds() {
 // Add click sounds to all footer buttons (except random-discovery which has its own)
 const footerButtons = document.querySelectorAll('#main-footer button:not(#random-discovery)');

 footerButtons.forEach(btn => {
 btn.addEventListener('click', () => {
 audioManager.playClick();
 });
 });

 // Add sound to navigation dropdown
 const dropdown = document.getElementById('object-dropdown');
 if (dropdown) {
 dropdown.addEventListener('change', () => {
 if (dropdown.value) {
 audioManager.playSelect();
 }
 });
 }

 // Initialize audio context on first user interaction (covers mouse, touch and keyboard)
 document.addEventListener('pointerdown', () => audioManager.init(), { once: true });
 document.addEventListener('keydown', () => audioManager.init(), { once: true });
 }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', () => new App());
} else {
 new App();
}

