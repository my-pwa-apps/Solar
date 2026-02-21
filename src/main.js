// ===========================
// SPACE VOYAGE - MODULAR VERSION
// Main Application Entry Point
// ===========================
import * as THREE from 'three';

// Import all modules
import { DEBUG, CONFIG } from './modules/utils.js';
import { TEXTURE_CACHE, warmupTextureCache } from './modules/TextureCache.js';
import { SceneManager } from './modules/SceneManager.js';
import { UIManager } from './modules/UIManager.js';
import { SolarSystemModule } from './modules/SolarSystemModule.js';
import { audioManager } from './modules/AudioManager.js';

// Make audio manager globally accessible
window.audioManager = audioManager;

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
 SCALE_BUTTON: 'toggle-scale',
 RESET_VIEW: 'reset-view',
 HELP_BUTTON: 'help-button',
 FPS_COUNTER: 'fps-counter',
 HOVER_LABEL: 'hover-label',
 DROPDOWN: 'object-dropdown',
 SPEED_SLIDER: 'time-speed'
};

// LocalStorage Keys
const STORAGE_KEYS = {
 ORBITS: 'orbitsVisible',
 CONSTELLATIONS: 'constellationsVisible',
 LABELS: 'labelsVisible',
 SCALE: 'realisticScale'
};

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
 this.brightness = 100; // Default brightness percentage

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
 this._voyagerIndex = 0;
 this._probeIndex = 0;

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
 this.sceneManager?.showError('Failed to start Space Voyage. Please refresh the page.');
 }
 }
 
 startExperience() {
 // Called by SolarSystemModule after all assets are loaded
 // Setup UI for Solar System
 this.uiManager.setupSolarSystemUI(this.solarSystemModule, this.sceneManager);
 
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
 this.setupOnboarding();
 this.setupRandomDiscovery();
 this.setupNavigationSearch();
 this.setupMobileGestureHints();
 this.setupSoundToggle();
 this.setupButtonSounds();

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
 this.solarSystemModule.update(deltaTime, this.timeSpeed, 
 this.sceneManager.camera, this.sceneManager.controls);
 }
 });
 }

 /**
  * Helper method to restore a single toggle state from localStorage
  * @private
  */
 _restoreToggleState(config) {
 const { storageKey, buttonId, toggleMethod, buttonClass = 'toggle-on', updateText } = config;
 const savedState = localStorage.getItem(storageKey);
 
 if (savedState !== null && this.solarSystemModule) {
 const value = savedState === 'true';
 
 // Call the toggle method
 toggleMethod.call(this.solarSystemModule, value);
 
 // Update button visual state
 const button = document.getElementById(buttonId);
 if (button) {
 button.classList.toggle(buttonClass, value);
 if (updateText) updateText(button, value);
 }
 }
 }

 restoreSavedToggleStates() {
 // Apply saved toggle states after solar system is fully initialized
 // This ensures toggleLabels(), toggleOrbits(), etc. can actually work
 
 // Restore orbits visibility
 this._restoreToggleState({
 storageKey: STORAGE_KEYS.ORBITS,
 buttonId: UI_ELEMENTS.ORBITS_BUTTON,
 toggleMethod: this.solarSystemModule.toggleOrbits
 });
 
 // Restore constellations visibility
 this._restoreToggleState({
 storageKey: STORAGE_KEYS.CONSTELLATIONS,
 buttonId: UI_ELEMENTS.CONSTELLATIONS_BUTTON,
 toggleMethod: this.solarSystemModule.toggleConstellations
 });
 
 // Restore labels visibility (special case: needs sceneManager property update)
 const savedLabelsState = localStorage.getItem(STORAGE_KEYS.LABELS);
 if (savedLabelsState !== null && this.solarSystemModule && this.sceneManager) {
 const labelsVisible = savedLabelsState === 'true';
 this.sceneManager.labelsVisible = labelsVisible;
 this.solarSystemModule.toggleLabels(labelsVisible);
 const labelsButton = document.getElementById(UI_ELEMENTS.LABELS_BUTTON);
 if (labelsButton) {
 labelsButton.classList.toggle('toggle-on', labelsVisible);
 const t = window.t || ((key) => key);
 const btnText = labelsButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = labelsVisible ? t('toggleLabelsOn') : t('toggleLabels');
 }
 }
 }
 
 // Restore scale mode (special case: uses 'active' class and updates text)
 const savedScaleState = localStorage.getItem(STORAGE_KEYS.SCALE);
 if (savedScaleState !== null && this.solarSystemModule) {
 const realisticScale = savedScaleState === 'true';
 this.solarSystemModule.realisticScale = realisticScale;
 this.solarSystemModule.updateScale();
 const scaleButton = document.getElementById(UI_ELEMENTS.SCALE_BUTTON);
 if (scaleButton) {
 scaleButton.classList.toggle('active', realisticScale);
 const t = window.t || ((key) => key);
 const btnText = scaleButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = realisticScale ? t('toggleScaleRealistic') : t('toggleScale');
 }
 }
 }
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
 this.uiManager.showHelp(`
 <h3>🖱️ Controls</h3>
 <p>🖱️ <strong>Click & Drag:</strong> Rotate view around selected object</p>
 <p>🖱️ <strong>Scroll:</strong> Zoom in/out (closer or farther from object)</p>
 <p>🖱️ <strong>Right Click & Drag:</strong> Pan camera position</p>
 <p>👆 <strong>Click Objects:</strong> Select and focus on object</p>
 <p>📋 <strong>Explorer Panel:</strong> Click object names to jump to them</p>
 
 <h3>⌨️ Keyboard Shortcuts</h3>
 <p>⌨️ <span class="keyboard-shortcut">H</span> Show this help</p>
 <p>⌨️ <span class="keyboard-shortcut">R</span> Reset camera view</p>
 <p>⌨️ <span class="keyboard-shortcut">O</span> Toggle orbital paths</p>
 <p>⌨️ <span class="keyboard-shortcut">C</span> Toggle constellations & stars</p>
 <p>⌨️ <span class="keyboard-shortcut">D</span> Toggle object labels</p>
 <p>⌨️ <span class="keyboard-shortcut">S</span> Toggle scale (compact/expanded)</p>
 <p>⌨️ <span class="keyboard-shortcut">Space</span> Pause / resume animation</p>
 <p>⌨️ <span class="keyboard-shortcut">I</span> Jump to ISS</p>
 <p>⌨️ <span class="keyboard-shortcut">V</span> Cycle Voyager probes</p>
 <p>⌨️ <span class="keyboard-shortcut">P</span> Cycle deep space probes</p>
 <p>⌨️ <span class="keyboard-shortcut">L</span> Toggle VR laser pointers (in VR)</p>
 <p>⌨️ <span class="keyboard-shortcut">F</span> Toggle FPS counter</p>
 <p>⌨️ <span class="keyboard-shortcut">+/-</span> Speed up/slow down time</p>
 <p>⌨️ <span class="keyboard-shortcut">ESC</span> Close panels</p>
 
 <h3>🔍 Object Inspection</h3>
 <p>🔍 <strong>After selecting an object:</strong></p>
 <p>• Drag to rotate camera around the object</p>
 <p>• Scroll to zoom in for close-up views</p>
 <p>• View object from all sides and angles</p>
 <p>• Camera stays focused as object moves in orbit</p>
 
 <h3>⚙️ Settings</h3>
 <p>🕐 <strong>Speed Slider:</strong> Paused to 100x animation speed</p>
 <p>🔄 <strong>Reset Button:</strong> Return camera to starting position</p>
 
 <h3>🥽 VR Mode</h3>
 <p>🥽 Click "Enter VR" button (bottom right)</p>
 <p>🥽 Requires WebXR-compatible VR headset</p>
 <p>🎮 <strong>VR Controls:</strong></p>
 <p>• Left stick: Move forward/backward/strafe</p>
 <p>• Right stick: Turn left/right, move up/down</p>
 <p>• Trigger (hold): Sprint mode while moving</p>
 <p>• Grip button: Toggle VR menu (pause, controls, etc.)</p>
 <p>• Point + Trigger: Select planets</p>
 <p>• L key or VR menu: Toggle laser pointers for better immersion</p>
 
 <h3>💡 Tips</h3>
 <p>⏩ Use speed slider to watch orbits in fast-forward</p>
 <p>👆 Click objects directly or use the explorer panel</p>
 <p>🔍 Zoom in close to see surface details and textures</p>
 <p>🔄 Rotate around objects to view from all angles</p>
 
 <h3>⚡ Performance</h3>
 <p>⚡ Optimized for 60 FPS on modern devices</p>
 <p>📱 Adaptive quality for mobile devices</p>
 <p>🎮 Hardware-accelerated WebGL rendering</p>
 <p>📊 Press <span class="keyboard-shortcut">F</span> to show FPS counter</p>
 
 <h3>🚀 Explore the Solar System!</h3>
 <p>🌍 Navigate through our solar system</p>
 <p>📚 Learn about the Sun, planets, moons, and more</p>
 <p>✨ Discover fascinating facts about each celestial body</p>
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
 // Note: Initial state is restored in restoreSavedToggleStates() after solar system is ready
 const orbitsButton = document.getElementById(UI_ELEMENTS.ORBITS_BUTTON);
 if (orbitsButton) {
 orbitsButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 const visible = !this.solarSystemModule.orbitsVisible;
 this.solarSystemModule.toggleOrbits(visible);
 orbitsButton.classList.toggle('toggle-on', visible);
 localStorage.setItem(STORAGE_KEYS.ORBITS, visible.toString());
 }
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
 localStorage.setItem(STORAGE_KEYS.CONSTELLATIONS, visible.toString());
 }
 });
 }

 // Scale toggle button
 // Note: Initial state is restored in restoreSavedToggleStates() after solar system is ready
 const scaleButton = document.getElementById(UI_ELEMENTS.SCALE_BUTTON);
 if (scaleButton) {
 scaleButton.addEventListener('click', () => {
 if (this.solarSystemModule) {
 const t = window.t || ((key) => key);
 this.solarSystemModule.realisticScale = !this.solarSystemModule.realisticScale;
 scaleButton.classList.toggle('active');
 const btnText = scaleButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = this.solarSystemModule.realisticScale ? 
 t('toggleScaleRealistic') : t('toggleScale');
 }
 
 localStorage.setItem(STORAGE_KEYS.SCALE, this.solarSystemModule.realisticScale.toString());
 
 // Recalculate positions with new scale
 this.solarSystemModule.updateScale();
 }
 });
 }
 
 // Labels toggle button
 // Note: Initial state is restored in restoreSavedToggleStates() after solar system is ready
 const labelsButton = document.getElementById(UI_ELEMENTS.LABELS_BUTTON);
 if (labelsButton) {
 labelsButton.addEventListener('click', () => {
 // Use translation function if available, otherwise fallback to English
 const t = window.t || ((key) => key);
 if (this.solarSystemModule && this.solarSystemModule.toggleLabels) {
 if (this.sceneManager) {
 this.sceneManager.labelsVisible = !this.sceneManager.labelsVisible;
 this.solarSystemModule.toggleLabels(this.sceneManager.labelsVisible);
 labelsButton.classList.toggle('toggle-on', this.sceneManager.labelsVisible);
 const btnText = labelsButton.querySelector('.btn-text');
 if (btnText) {
 btnText.textContent = this.sceneManager.labelsVisible ? 
 t('toggleLabelsOn') : t('toggleLabels');
 }
 localStorage.setItem(STORAGE_KEYS.LABELS, this.sceneManager.labelsVisible.toString());
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
 });
 }
 // Canvas click for object selection
 this.sceneManager.renderer.domElement.addEventListener('click', (e) => {
 this.handleCanvasClick(e);
 });

 // Canvas hover for object labels
 this.sceneManager.renderer.domElement.addEventListener('mousemove', (e) => {
 this.handleCanvasHover(e);
 });

 // Hide tooltip when mouse leaves canvas
 this.sceneManager.renderer.domElement.addEventListener('mouseleave', () => {
 this.hideHoverLabel();
 });

 // Track drag vs click — hide tooltip only on confirmed drag
 this.sceneManager.renderer.domElement.addEventListener('mousedown', (e) => {
 this._mouseDownPos = { x: e.clientX, y: e.clientY };
 this._isDragging = false;
 });
 this.sceneManager.renderer.domElement.addEventListener('mousemove', (e) => {
 if (this._mouseDownPos) {
 const dx = e.clientX - this._mouseDownPos.x;
 const dy = e.clientY - this._mouseDownPos.y;
 if (Math.sqrt(dx * dx + dy * dy) > 4) {
 this._isDragging = true;
 this.hideHoverLabel();
 }
 }
 }, { capture: true, passive: true });
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
 
 // Define navigation mapping with categories for easy maintenance
 const navigationMap = {
 // Sun and Planets (direct property access)
 'sun': () => this.solarSystemModule.sun,
 'mercury': () => this.solarSystemModule.planets.mercury,
 'venus': () => this.solarSystemModule.planets.venus,
 'earth': () => this.solarSystemModule.planets.earth,
 'mars': () => this.solarSystemModule.planets.mars,
 'jupiter': () => this.solarSystemModule.planets.jupiter,
 'saturn': () => this.solarSystemModule.planets.saturn,
 'uranus': () => this.solarSystemModule.planets.uranus,
 'neptune': () => this.solarSystemModule.planets.neptune,
 'pluto': () => this.solarSystemModule.planets.pluto,
 
 // Earth's Moon - always stored under fixed key 'moon' regardless of language
 'moon': () => this.solarSystemModule.moons['moon'],
 
 // Moons (direct moon registry access)
 'phobos': () => this.solarSystemModule.moons.phobos,
 'deimos': () => this.solarSystemModule.moons.deimos,
 'io': () => this.solarSystemModule.moons.io,
 'europa': () => this.solarSystemModule.moons.europa,
 'ganymede': () => this.solarSystemModule.moons.ganymede,
 'callisto': () => this.solarSystemModule.moons.callisto,
 'titan': () => this.solarSystemModule.moons.titan,
 'enceladus': () => this.solarSystemModule.moons.enceladus,
 'rhea': () => this.solarSystemModule.moons.rhea,
 'titania': () => this.solarSystemModule.moons.titania,
 'miranda': () => this.solarSystemModule.moons.miranda,
 'triton': () => this.solarSystemModule.moons.triton,
 'charon': () => this.solarSystemModule.moons.charon,
 
 // Oort Cloud (structure object)
 'oort-cloud': () => this.solarSystemModule.oortCloud,

 // Dwarf Planets (stored in planets registry)
 'ceres': () => this.solarSystemModule.planets.ceres,
 'haumea': () => this.solarSystemModule.planets.haumea,
 'makemake': () => this.solarSystemModule.planets.makemake,
 'eris': () => this.solarSystemModule.planets.eris,
 'orcus': () => this.solarSystemModule.planets.orcus,
 'quaoar': () => this.solarSystemModule.planets.quaoar,
 'gonggong': () => this.solarSystemModule.planets.gonggong,
 'sedna': () => this.solarSystemModule.planets.sedna,
 'salacia': () => this.solarSystemModule.planets.salacia,
 'varda': () => this.solarSystemModule.planets.varda,
 'varuna': () => this.solarSystemModule.planets.varuna,
 };
 
 // Check direct mapping first
 if (navigationMap[value]) {
 return navigationMap[value]();
 }
 
 // Pattern-based lookups for arrays (stars, exoplanets, spacecraft, etc.)
 const searchPatterns = [
 { prefix: 'constellation-', array: 'constellations', exactMatch: false, patterns: {
 'aries': ['aries'],
 'taurus': ['taurus'],
 'gemini': ['gemini'],
 'cancer': ['cancer'],
 'leo': ['leo'],
 'virgo': ['virgo'],
 'libra': ['libra'],
 'scorpius': ['scorpius'],
 'sagittarius': ['sagittarius'],
 'capricornus': ['capricornus'],
 'aquarius': ['aquarius'],
 'pisces': ['pisces'],
 'orion': ['orion'],
 'big-dipper': ['bigDipper'],
 'little-dipper': ['littleDipper'],
 'southern-cross': ['southernCross'],
 'cassiopeia': ['cassiopeia'],
 'cygnus': ['cygnus'],
 'lyra': ['lyra'],
 'andromeda': ['andromedaConst'], // Distinct from "andromeda galaxy"
 'perseus': ['perseus'],
 }},
 { prefix: '', array: 'satellites', patterns: {
 'iss': ['ISS', 'International Space Station'],
 'hubble': ['Hubble', 'Hubble Space Telescope'],
 'gps': ['GPS', 'NAVSTAR'],
 'gps-navstar': ['GPS', 'NAVSTAR'],
 }},
 { prefix: '', array: 'spacecraft', patterns: {
 'voyager-1': ['Voyager 1'],
 'voyager-2': ['Voyager 2'],
 'voyager': ['Voyager'],
 'new-horizons': ['New Horizons'],
 'jwst': ['James Webb'],
 'james-webb': ['James Webb'],
 'juno': ['Juno'],
 'cassini': ['Cassini'],
 'pioneer-10': ['Pioneer 10'],
 'pioneer-11': ['Pioneer 11'],
 'pioneer': ['Pioneer'],
 }},
 { prefix: '', array: 'nebulae', patterns: {
 'orion-nebula': ['orionNebula'],
 'crab-nebula': ['crabNebula'],
 'ring-nebula': ['ringNebula'],
 }},
 { prefix: '', array: 'galaxies', patterns: {
 'andromeda-galaxy': ['andromedaGalaxy'],
 'whirlpool-galaxy': ['whirlpoolGalaxy'],
 'sombrero-galaxy': ['sombreroGalaxy'],
 }},
 { prefix: '', array: 'objects', patterns: {
 'alpha-centauri': ['alphaCentauriA'],
 'proxima-centauri': ['proximaCentauri'],
 'proxima-b': ['proximaCentauri'],
 'kepler-452b': ['kepler452Star'],
 'trappist-1e': ['trappist1Star'],
 'kepler-186f': ['kepler186Star'],
 }},
 { prefix: '', array: 'comets', patterns: {
 'halley': ["Halley's Comet"],
 'hale-bopp': ["Hale-Bopp", "Comet Hale-Bopp"],
 'hyakutake': ["Hyakutake", "Comet Hyakutake"],
 'lovejoy': ["Lovejoy", "Comet Lovejoy"],
 'encke': ["Encke", "Comet Encke"],
 'swift-tuttle': ["Swift-Tuttle", "Comet Swift-Tuttle"],
 }},
 ];
 
 // Search through pattern-based lookups
 for (const category of searchPatterns) {
 const searchKey = category.prefix ? value.replace(category.prefix, '') : value;
 const patterns = category.patterns[searchKey];
 
 if (patterns && this.solarSystemModule[category.array]) {
 // Search using exact or flexible matching based on category
 const found = category.exactMatch
 ? this.solarSystemModule[category.array].find(obj => 
 patterns.some(pattern => obj.userData.name.startsWith(pattern)))
 : this.solarSystemModule[category.array].find(obj => 
 patterns.some(pattern => obj.userData.name.includes(pattern)));
 
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
 
 // Ensure world matrices are up-to-date for child objects (moons are children of planets)
 this.sceneManager.scene.updateMatrixWorld(true);
 
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

 // Throttle hover checks to avoid performance issues
 const now = Date.now();
 if (!this._lastHoverCheck) this._lastHoverCheck = 0;
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
 const t = window.t || ((key) => key);
 const nameKey = target.userData.name?.replace(/\s+/g, '');
 const displayName = (nameKey && window.t && window.t(nameKey) !== nameKey)
 ? t(nameKey)
 : target.userData.name;

 // Show hover label
 this._hoverLabel.textContent = displayName;
 this._hoverLabel.style.left = `${event.clientX + 15}px`;
 this._hoverLabel.style.top = `${event.clientY + 15}px`;
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
 case 'escape':
 this.uiManager.closeInfoPanel();
 this.uiManager.closeHelpModal();
 break;
 case ' ':
 case 'space': {
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
 
 // ===========================
 // UX IMPROVEMENTS v2.3
 // ===========================
 
 preSelectEarth() {
 // Pre-select Earth on first visit to show users what to expect
 const isFirstVisit = !localStorage.getItem('space_voyage_visited');
 
 if (isFirstVisit && this.solarSystemModule?.planets?.earth) {
 // Small delay to ensure everything is rendered
 setTimeout(() => {
 const earth = this.solarSystemModule.planets.earth;
 const info = this.solarSystemModule.getObjectInfo(earth);
 this.uiManager.updateInfoPanel(info);
 this.solarSystemModule.focusOnObject(earth, this.sceneManager.camera, this.sceneManager.controls);
 localStorage.setItem('space_voyage_visited', 'true');
 }, 500);
 }
 }
 
 setupOnboarding() {
 const overlay = document.getElementById('onboarding-overlay');
 const nextBtn = document.getElementById('onboarding-next');
 const startBtn = document.getElementById('onboarding-start');
 const skipBtn = document.getElementById('onboarding-skip');
 const dots = document.querySelectorAll('.onboarding-dots .dot');
 const steps = document.querySelectorAll('.onboarding-step');
 
 if (!overlay) return;
 
 // Check if first visit
 const hasSeenOnboarding = localStorage.getItem('space_voyage_onboarding_complete');
 
 if (!hasSeenOnboarding) {
 // Show onboarding after a brief delay
 setTimeout(() => {
 overlay.classList.remove('hidden');
 }, 1000);
 }
 
 let currentStep = 1;
 const totalSteps = 3;
 
 const updateStep = (step) => {
 currentStep = step;
 
 // Update steps
 steps.forEach(s => s.classList.remove('active'));
 const activeStep = document.querySelector(`.onboarding-step[data-step="${step}"]`);
 if (activeStep) activeStep.classList.add('active');
 
 // Update dots
 dots.forEach(d => d.classList.remove('active'));
 const activeDot = document.querySelector(`.onboarding-dots .dot[data-step="${step}"]`);
 if (activeDot) activeDot.classList.add('active');
 
 // Show/hide buttons
 if (step === totalSteps) {
 nextBtn?.classList.add('hidden');
 startBtn?.classList.remove('hidden');
 } else {
 nextBtn?.classList.remove('hidden');
 startBtn?.classList.add('hidden');
 }
 };
 
 const closeOnboarding = () => {
 overlay.classList.add('hidden');
 localStorage.setItem('space_voyage_onboarding_complete', 'true');
 };
 
 nextBtn?.addEventListener('click', () => {
 if (currentStep < totalSteps) {
 updateStep(currentStep + 1);
 }
 });
 
 startBtn?.addEventListener('click', closeOnboarding);
 skipBtn?.addEventListener('click', closeOnboarding);
 
 dots.forEach(dot => {
 dot.addEventListener('click', () => {
 const step = parseInt(dot.dataset.step, 10);
 if (step) updateStep(step);
 });
 });
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
 randomBtn.style.transform = 'rotate(360deg)';
 setTimeout(() => {
 randomBtn.style.transform = '';
 }, 500);
 
 const info = this.solarSystemModule.getObjectInfo(targetObject);
 this.uiManager.updateInfoPanel(info);
 this.solarSystemModule.focusOnObject(targetObject, this.sceneManager.camera, this.sceneManager.controls);

 // Play discovery fanfare after a slight delay
 setTimeout(() => audioManager.playDiscovery(), 300);
 }
 });
 }
 
 setupNavigationSearch() {
 const searchInput = document.getElementById('nav-search');
 const dropdown = document.getElementById('object-dropdown');
 
 if (!searchInput || !dropdown) return;
 
 // Store original options HTML for reset/filtering
 const originalHTML = dropdown.innerHTML;
 
 searchInput.addEventListener('input', (e) => {
 const query = e.target.value.toLowerCase().trim();

 if (!query) {
 // Restore original dropdown and re-apply current language
 dropdown.innerHTML = originalHTML;
 if (window.applyTranslations) window.applyTranslations();
 return;
 }

 // Restore full dropdown first so we can read current translated option text,
 // then filter. This ensures translated names (e.g. "Saturnus" in NL) match.
 dropdown.innerHTML = originalHTML;
 if (window.applyTranslations) window.applyTranslations();

 const currentOptions = Array.from(dropdown.querySelectorAll('option')).filter(o => o.value);
 const matchingOptions = currentOptions.filter(node =>
 node.textContent.toLowerCase().includes(query) ||
 node.value.toLowerCase().includes(query)
 );
 
 // Rebuild dropdown with matches
 dropdown.innerHTML = '';
 const placeholder = document.createElement('option');
 placeholder.value = '';
 placeholder.textContent = matchingOptions.length > 0 
 ? `${matchingOptions.length} results for "${query}"`
 : 'No results found';
 dropdown.appendChild(placeholder);
 
 matchingOptions.forEach(opt => dropdown.appendChild(opt));
 });
 
 // Clear search when dropdown is used
 dropdown.addEventListener('change', () => {
 if (dropdown.value) {
 searchInput.value = '';
 dropdown.innerHTML = originalHTML;
 if (window.applyTranslations) window.applyTranslations();
 }
 });
 }
 
 setupMobileGestureHints() {
 // Only show on touch devices
 const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
 const hasSeenHints = localStorage.getItem('space_voyage_gesture_hints_seen');
 
 if (!isTouchDevice || hasSeenHints) return;
 
 const hints = document.getElementById('gesture-hints');
 if (!hints) return;
 
 // Show hints after a delay
 setTimeout(() => {
 hints.classList.remove('hidden');
 
 // Auto-hide after 5 seconds
 setTimeout(() => {
 hints.classList.add('hidden');
 localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
 }, 5000);
 }, 2000);
 
 // Hide immediately on any touch
 document.addEventListener('touchstart', () => {
 hints.classList.add('hidden');
 localStorage.setItem('space_voyage_gesture_hints_seen', 'true');
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
 const soundEnabled = localStorage.getItem('space_voyage_sound') !== 'false';
 audioManager.enabled = soundEnabled;

 // Update button appearance
 const updateSoundButton = () => {
 const t = window.t || ((key) => key);
 const icon = soundToggle.querySelector('.btn-icon');
 const btnText = soundToggle.querySelector('.btn-text');
 if (audioManager.enabled) {
 soundToggle.classList.remove('muted');
 soundToggle.setAttribute('aria-pressed', 'true');
 if (icon) icon.textContent = '🔊';
 if (btnText) btnText.textContent = t('toggleSoundOn');
 soundToggle.title = t('toggleSoundOn');
 } else {
 soundToggle.classList.add('muted');
 soundToggle.setAttribute('aria-pressed', 'false');
 if (icon) icon.textContent = '🔇';
 if (btnText) btnText.textContent = t('toggleSoundOff');
 soundToggle.title = t('toggleSoundOff');
 }
 };

 updateSoundButton();

 soundToggle.addEventListener('click', () => {
 audioManager.toggle();
 localStorage.setItem('space_voyage_sound', audioManager.enabled);
 updateSoundButton();

 // Play a click to confirm sound is on
 if (audioManager.enabled) {
 audioManager.playClick();
 }
 });
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