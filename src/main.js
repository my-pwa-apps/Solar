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
import { t } from './i18n.js';

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
 console.log('🚀 Starting experience...');
 console.log('📦 SceneManager exists:', !!this.sceneManager);
 console.log('📦 SolarSystemModule exists:', !!this.solarSystemModule);
 console.log('📦 Scene exists:', !!this.sceneManager?.scene);
 console.log('📦 Renderer exists:', !!this.sceneManager?.renderer);
 console.log('📦 Camera exists:', !!this.sceneManager?.camera);
 
 // Setup UI for Solar System
 this.uiManager.setupSolarSystemUI(this.solarSystemModule, this.sceneManager);
 
 // Setup controls
 this.setupControls();
 
 // Hide loading screen
 this.uiManager.hideLoading();
 
 console.log('🎬 Starting animation loop...');
 console.log('☀️ Sun position:', this.solarSystemModule.sun?.position);
 console.log('🌍 Earth position:', this.solarSystemModule.planets?.earth?.position);
 console.log('🖼️ Canvas in DOM:', !!document.querySelector('canvas'));
 console.log('🖼️ Canvas parent:', this.sceneManager.renderer?.domElement?.parentElement?.id);
 console.log('🎨 Scene background:', this.sceneManager.scene?.background);
 console.log('📊 Scene children count:', this.sceneManager.scene?.children?.length);
 
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
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === t('moon'));
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
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === 'Io');
 break;
 case 'europa':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === 'Europa');
 break;
 case 'ganymede':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === 'Ganymede');
 break;
 case 'callisto':
 targetObject = this.solarSystemModule.objects.find(obj => obj.userData.name === 'Callisto');
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
 case 'jwst':
 case 'james-webb':
 targetObject = this.solarSystemModule.spacecraft?.find(s => s.userData.name.includes('James Webb'));
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
 if (DEBUG.enabled) console.log(` [Nav Debug] Gemini search result:`, targetObject ? targetObject.userData.name : 'NOT FOUND', `(total constellations: ${this.solarSystemModule.constellations?.length || 0})`);
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
 if (DEBUG.enabled) console.log(` [Nav Debug] Scorpius search result:`, targetObject ? targetObject.userData.name : 'NOT FOUND', `(total constellations: ${this.solarSystemModule.constellations?.length || 0})`);
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
 default:
 console.warn(` [Nav] âœ— No case match for value: "${value}"`);
 break;
 }
 
 console.log(` [Nav] Navigation dropdown value: "${value}"`);
 console.log(` [Nav] After switch - targetObject:`, targetObject ? `Found: ${targetObject.userData?.name}` : 'NULL');
 
 if (targetObject) {
 const info = this.solarSystemModule.getObjectInfo(targetObject);
 this.uiManager.updateInfoPanel(info);
 console.log(` [Nav] âœ“ Found and navigating to: ${info.name} (type: ${targetObject.userData.type || 'planet'})`);
 this.solarSystemModule.focusOnObject(targetObject, this.sceneManager.camera, this.sceneManager.controls);
 } else {
 console.warn(` [Nav] âœ— Object not found for value: "${value}"`);
 console.warn(` [Nav] Available constellations:`, this.solarSystemModule.constellations?.map(c => c.userData.name) || []);
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
 console.log('â¸ PAUSE');
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




// ===========================
// INITIALIZE APPLICATION
// ===========================
const app = new App();