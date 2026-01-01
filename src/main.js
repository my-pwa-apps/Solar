// ===========================
// SPACE VOYAGE - MODULAR VERSION
// Main Application Entry Point
// ===========================

// Import THREE.js
import * as THREE from 'three';

// Import all modules
import { DEBUG, CONFIG } from './modules/utils.js';
import { TEXTURE_CACHE, warmupTextureCache } from './modules/TextureCache.js';
import { SceneManager } from './modules/SceneManager.js';
import { UIManager } from './modules/UIManager.js';
import { SolarSystemModule } from './modules/SolarSystemModule.js';

// i18n.js is loaded globally in index.html, access via window.t
const t = window.t || ((key) => key);

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
 this.timeSpeed = 1; // Default to 1x real-time (original default)
 this.brightness = 100; // Default brightness percentage
 
 // Make this app instance globally accessible for VR and other modules
 window.app = this;
 
 this.init();
 }

 async init() {
 const appStartTime = performance.now();
 
 try {
 // ALWAYS warm up cache from IndexedDB (loads cached textures into memory)
 const cacheReady = await warmupTextureCache();
 if (cacheReady && DEBUG.PERFORMANCE) {
 console.log('⚡ Fast start: All essential textures cached');
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

 // Load Solar System module
 this.solarSystemModule = new SolarSystemModule(this.uiManager);
 this.uiManager.updateLoadingProgress(20, t('creatingSun'));
 
 // Init handles async loading and calls startExperience() when done
 await this.solarSystemModule.init(this.sceneManager.scene);

 // Schedule verification of remote texture loads
 if (this.solarSystemModule?.verifyTextureLoads) {
	 this.solarSystemModule.verifyTextureLoads(5000);
 }
 
 if (DEBUG.PERFORMANCE) {
 console.log(`📦 Loaded in ${(performance.now() - appStartTime).toFixed(0)}ms`);
 }
 } catch (error) {
 console.error(' Failed to initialize Space Voyage:', error);
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
 this.setupSpaceFacts();
 
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
 this.sceneManager.updateXRMovement();
 this.sceneManager.updateLaserPointers();
 
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
 labelsButton.textContent = labelsVisible ? t('toggleLabelsOn') : t('toggleLabels');
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
 scaleButton.textContent = realisticScale ? t('toggleScaleRealistic') : t('toggleScale');
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
 <h3> Controls</h3>
 <p> <strong>Click & Drag:</strong> Rotate view around selected object</p>
 <p> <strong>Scroll:</strong> Zoom in/out (closer or farther from object)</p>
 <p> <strong>Right Click & Drag:</strong> Pan camera position</p>
 <p> <strong>Click Objects:</strong> Select and focus on object</p>
 <p> <strong>Explorer Panel:</strong> Click object names to jump to them</p>
 
 <h3>âŒ¨ Keyboard Shortcuts</h3>
 <p>âŒ¨ <span class="keyboard-shortcut">H</span> Show this help</p>
 <p>âŒ¨ <span class="keyboard-shortcut">R</span> Reset camera view</p>
 <p>âŒ¨ <span class="keyboard-shortcut">O</span> Toggle orbital paths</p>
 <p>âŒ¨ <span class="keyboard-shortcut">D</span> Toggle object labels</p>
 <p>âŒ¨ <span class="keyboard-shortcut">S</span> Toggle realistic scale</p>
 <p>âŒ¨ <span class="keyboard-shortcut">L</span> Toggle VR laser pointers (in VR)</p>
 <p>âŒ¨ <span class="keyboard-shortcut">F</span> Toggle FPS counter</p>
 <p>âŒ¨ <span class="keyboard-shortcut">+/-</span> Speed up/slow down time</p>
 <p>âŒ¨ <span class="keyboard-shortcut">ESC</span> Close panels</p>
 
 <h3> Object Inspection</h3>
 <p> <strong>After selecting an object:</strong></p>
 <p> - Drag to rotate camera around the object</p>
 <p> - Scroll to zoom in for close-up views</p>
 <p> - View object from all sides and angles</p>
 <p> - Camera stays focused as object moves in orbit</p>
 
 <h3> Settings</h3>
 <p>â± <strong>Speed Slider:</strong> 0x to 10x animation speed</p>
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
 scaleButton.textContent = this.solarSystemModule.realisticScale ? 
 t('toggleScaleRealistic') : t('toggleScale');
 
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
 labelsButton.textContent = this.sceneManager.labelsVisible ? 
 t('toggleLabelsOn') : t('toggleLabels');
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

 // Hide tooltip on interactions (click, drag start)
 this.sceneManager.renderer.domElement.addEventListener('mousedown', () => {
 this.hideHoverLabel();
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
 
 // Earth's Moon (special case - translated name)
 'moon': () => this.solarSystemModule.moons[t('moon').toLowerCase()],
 
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
 { prefix: 'constellation-', array: 'constellations', exactMatch: true, patterns: {
 'aries': ['Aries (The Ram)'],
 'taurus': ['Taurus (The Bull)'],
 'gemini': ['Gemini (The Twins)'],
 'cancer': ['Cancer (The Crab)'],
 'leo': ['Leo (The Lion)'],
 'virgo': ['Virgo (The Maiden)'],
 'libra': ['Libra (The Scales)'],
 'scorpius': ['Scorpius (The Scorpion)'],
 'sagittarius': ['Sagittarius (The Archer)'],
 'capricornus': ['Capricornus (The Sea-Goat)'],
 'aquarius': ['Aquarius (The Water-Bearer)'],
 'pisces': ['Pisces (The Fish)'],
 'orion': ['Orion (The Hunter)'],
 'big-dipper': ['Big Dipper (Ursa Major)'],
 'little-dipper': ['Little Dipper (Ursa Minor)'],
 'southern-cross': ['Southern Cross (Crux)'],
 'cassiopeia': ['Cassiopeia (The Queen)'],
 'cygnus': ['Cygnus (The Swan)'],
 'lyra': ['Lyra (The Lyre)'],
 'andromeda': ['Andromeda (The Princess)'], // Distinct from "Andromeda Galaxy"
 'perseus': ['Perseus (The Hero)'],
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
 'orion-nebula': ['Orion'],
 'crab-nebula': ['Crab'],
 'ring-nebula': ['Ring'],
 }},
 { prefix: '', array: 'galaxies', patterns: {
 'andromeda-galaxy': ['Andromeda'],
 'whirlpool-galaxy': ['Whirlpool'],
 'sombrero-galaxy': ['Sombrero'],
 }},
 { prefix: '', array: 'objects', patterns: {
 'alpha-centauri': [' Alpha Centauri A'],
 'proxima-centauri': [' Proxima Centauri'],
 'proxima-b': [' Proxima Centauri b'],
 'kepler-452b': [' Kepler-452b'],
 'trappist-1e': [' TRAPPIST-1e'],
 'kepler-186f': [' Kepler-186f'],
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
 const mouseVec = new THREE.Vector2(mouse.x, mouse.y);
 
 this.sceneManager.raycaster.setFromCamera(mouseVec, this.sceneManager.camera);
 
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
 
 // PRIORITY: Always prefer moons over planets when both are hit
 // This handles cases where orbit lines (children of planets) are hit first
 
 // First, check if there's a moon in the hit list
 const moonHit = namedObjects.find(n => n.object.userData?.type === 'Moon');
 if (moonHit) {
 // Check if the moon's parent planet was also hit - prefer moon over parent
 const parentName = moonHit.object.userData?.parentPlanet;
 const parentHit = namedObjects.find(n => n.object.userData?.name === parentName);
 if (parentHit || !parentName) {
 // Moon hit with parent also hit, or moon without parent tracking
 return moonHit.object;
 }
 // Moon is hit but not its parent, just return the moon
 return moonHit.object;
 }
 
 // No moon hit, return the first (closest) named object
 return namedObjects[0].object;
 }
 
 // ===========================
 // EVENT HANDLERS
 // ===========================
 
 handleCanvasClick(event) {
 const target = this._raycastNamedObject(event, true);
 
 if (target) {
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
 
 // Translate object name
 const t = window.t || ((key) => key);
 const nameKey = target.userData.name.toLowerCase().replace(/\s+/g, '');
 const translatedName = (nameKey && window.t && window.t(nameKey) !== nameKey) 
 ? t(nameKey) 
 : target.userData.name;
 
 // Show hover label with translated name
 this._hoverLabel.textContent = translatedName;
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
 case 'd':
 document.getElementById(UI_ELEMENTS.LABELS_BUTTON)?.click();
 break;
 case 's':
 document.getElementById(UI_ELEMENTS.SCALE_BUTTON)?.click();
 break;
 case 'f':
 const fpsCounter = document.getElementById(UI_ELEMENTS.FPS_COUNTER);
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
 }
 break;
 case '+':
 case '=':
 // Increase speed
 const speedSliderUp = document.getElementById(UI_ELEMENTS.SPEED_SLIDER);
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
 const speedSliderDown = document.getElementById(UI_ELEMENTS.SPEED_SLIDER);
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
 const spaceSpeedSlider = document.getElementById(UI_ELEMENTS.SPEED_SLIDER);
 if (spaceSpeedSlider) {
 if (this.timeSpeed === 0) {
 // If paused, go to normal (5 = 1x speed)
 spaceSpeedSlider.value = '5';
 } else {
 // If playing, pause
 spaceSpeedSlider.value = '0';
 }
 spaceSpeedSlider.dispatchEvent(new Event('input'));
 }
 break;
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
 this._voyagerIndex = ((this._voyagerIndex || 0) + 1) % voyagers.length;
 this.solarSystemModule.focusOnObject(voyagers[this._voyagerIndex], this.sceneManager.camera, this.sceneManager.controls);
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
 }
 });
 }
 
 setupNavigationSearch() {
 const searchInput = document.getElementById('nav-search');
 const dropdown = document.getElementById('object-dropdown');
 
 if (!searchInput || !dropdown) return;
 
 // Store original options
 const allOptions = Array.from(dropdown.querySelectorAll('option, optgroup'));
 const originalHTML = dropdown.innerHTML;
 
 searchInput.addEventListener('input', (e) => {
 const query = e.target.value.toLowerCase().trim();
 
 if (!query) {
 // Restore original dropdown
 dropdown.innerHTML = originalHTML;
 return;
 }
 
 // Filter options
 const matchingOptions = [];
 dropdown.querySelectorAll('option').forEach(option => {
 if (option.value && option.textContent.toLowerCase().includes(query)) {
 matchingOptions.push(option.cloneNode(true));
 }
 });
 
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
 }, { once: true });
 }
 
 setupSpaceFacts() {
 const factText = document.getElementById('fact-text');
 if (!factText) return;
 
 const spaceFacts = [
 "The Sun contains 99.86% of the Solar System's mass!",
 "A day on Venus is longer than its year!",
 "Jupiter's Great Red Spot is larger than Earth!",
 "Saturn would float if you could find a big enough bathtub!",
 "One million Earths could fit inside the Sun!",
 "The Moon is slowly drifting away from Earth at 3.8 cm per year!",
 "Neptune's winds can reach speeds of 2,100 km/h!",
 "Mars has the largest volcano in the Solar System - Olympus Mons!",
 "Uranus rotates on its side, making it unique among planets!",
 "Mercury has ice at its poles despite being closest to the Sun!",
 "Europa may have more water than all of Earth's oceans!",
 "Titan is the only moon with a thick atmosphere!",
 "The Voyager 1 probe is the farthest human-made object from Earth!",
 "A year on Pluto lasts 248 Earth years!",
 "The asteroid belt contains millions of rocky objects!"
 ];
 
 let factIndex = 0;
 
 // Rotate facts every 4 seconds during loading
 const factInterval = setInterval(() => {
 factIndex = (factIndex + 1) % spaceFacts.length;
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
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', () => new App());
} else {
 new App();
}