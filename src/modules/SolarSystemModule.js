// ===========================
// SOLAR SYSTEM MODULE (coordinator)
//
// Holds construction, state and the object-level API. The bulk of the
// behaviour lives in ./solar-system/* and is mixed into the prototype at the
// bottom of this file.
// ===========================
import * as THREE from 'three';
// CSS2DObject removed — labels use THREE.Sprite (CanvasTexture) so they render in VR
import { CONFIG, DEBUG, prefersReducedMotion } from './utils.js';
import { EclipseRenderer } from './astro/EclipseRenderer.js';
import { textureGenerator } from './solar-system/texture-generator.js';
import { cometsSpacecraft } from './solar-system/comets-spacecraft.js';
import { deepSpace } from './solar-system/deep-space.js';
import { orbitalMechanics } from './solar-system/orbital-mechanics.js';
import { celestialFactory } from './solar-system/celestial-factory.js';

// i18n.js is loaded globally in index.html, access via window.t
// Late-binding: always delegate to window.t at call time (not captured at import time)
const t = (key) => (window.t || ((k) => k))(key);

export class SolarSystemModule {
 constructor(uiManager) {
 this.uiManager = uiManager;
 this.objects = [];
 this.planets = {};
 this.moons = {};
 this.sun = null;
 this.starfield = null;
 this.milkyWay = null;
 this.milkyWaySolarLocator = null;
 this.asteroidBelt = null;
 this.kuiperBelt = null;
 this.oortCloud = null;
 this.heliopause = null;
 this.orbits = [];
 this.focusedObject = null;
 this.nebulae = [];
 this.galaxies = [];
 this.comets = [];
 this.cometOrbits = [];
 this.satellites = [];
 this.spacecraft = [];
 this.constellations = [];
 this._focusScratch = {
 directionFromOrigin: new THREE.Vector3(),
 perpendicularVector: new THREE.Vector3(),
 earthPos: new THREE.Vector3(),
 issDirection: new THREE.Vector3(),
 moonDirection: new THREE.Vector3(),
 sunPosition: new THREE.Vector3(),
 cometToSunDir: new THREE.Vector3(),
 rightVector: new THREE.Vector3()
 };
 
 // Scale mode: false = educational (compressed), true = realistic (vast)
 this.realisticScale = false;

 // Scientific mode: use orbital speeds derived from real orbital periods
 // instead of hand-tuned visual speeds.
 this.scientificMode = false;
 
 // Comet tails visibility: shown by default
 this.cometTailsVisible = true;

 // Labels visibility — updated by toggleLabels()
 this.labelsVisible = false;

 // Pickable subset used by VR raycaster — planets, moons, comets, satellites, spacecraft, sun.
 // Populated during object creation; avoids raycasting against galaxies, nebulae, belt particles, etc.
 this.pickableObjects = [];
 
 // Orbits visibility: true = visible by default
 this.orbitMode = 'all'; // 'all' | 'planets' | 'comets' | 'none'
 this.orbitsVisible = true; // planet+moon orbits visible (derived from orbitMode)
 this.cometOrbitsVisible = true; // comet orbits visible (derived from orbitMode)
 
 // Constellations visibility: true = visible by default
 this.constellationsVisible = false;
 
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
 orbitalPeriod: 224.7 // Earth days
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
 orbitalPeriod: 60182 // Earth days (~164.8 years)
 },
 pluto: {
 rotationPeriod: 153.293, // hours (6.387 Earth days - retrograde)
 axialTilt: 122.53, // degrees
 retrograde: true,
 orbitalPeriod: 90520 // Earth days (~248 years)
 },
 moon: {
 rotationPeriod: 655.7, // hours (27.3 Earth days - tidally locked)
 axialTilt: 6.68, // degrees
 retrograde: false,
 orbitalPeriod: 27.3 // Earth days
 }
 };

 // Additional orbital periods (days) for objects not covered in ASTRONOMICAL_DATA
 // or where we want explicit moon period data for scientific-mode speed derivation.
 this.SCIENTIFIC_ORBITAL_PERIODS = {
 ceres: 1680.0,
 haumea: 103813.0,
 makemake: 113201.0,
 eris: 203830.0,
 orcus: 90441.0,
 quaoar: 104137.0,
 gonggong: 202780.0,
 sedna: 4134991.0,
 salacia: 100684.0,
 varda: 114305.0,
 varuna: 103018.0
 };

 this.SCIENTIFIC_MOON_ORBITAL_PERIODS = {
 moon: 27.321661,
 phobos: 0.31891,
 deimos: 1.26244,
 io: 1.769137786,
 europa: 3.551181,
 ganymede: 7.154553,
 callisto: 16.689018,
 enceladus: 1.370218,
 rhea: 4.518212,
 titan: 15.945421,
 titania: 8.706234,
 miranda: 1.413479,
 triton: 5.876854,
 charon: 6.38723
 };

 // Orbital elements used in scientific mode for non-circular / inclined orbits.
 // Angles are in degrees. We use a lightweight Keplerian approximation:
 // - true anomaly ≈ simulated angle
 // - static elements (no secular precession)
 this.SCIENTIFIC_ORBITAL_ELEMENTS = {
 mercury: { eccentricity: 0.20563, inclinationDeg: 7.00, periapsisDeg: 29.1 },
 venus: { eccentricity: 0.00677, inclinationDeg: 3.39, periapsisDeg: 54.9 },
 earth: { eccentricity: 0.01671, inclinationDeg: 0.00, periapsisDeg: 102.9 },
 mars: { eccentricity: 0.09339, inclinationDeg: 1.85, periapsisDeg: 286.5 },
 jupiter: { eccentricity: 0.04839, inclinationDeg: 1.30, periapsisDeg: 273.9 },
 saturn: { eccentricity: 0.05415, inclinationDeg: 2.49, periapsisDeg: 339.4 },
 uranus: { eccentricity: 0.04717, inclinationDeg: 0.77, periapsisDeg: 96.7 },
 neptune: { eccentricity: 0.00859, inclinationDeg: 1.77, periapsisDeg: 273.2 },
 pluto: { eccentricity: 0.24881, inclinationDeg: 17.16, periapsisDeg: 113.8 },
 ceres: { eccentricity: 0.07582, inclinationDeg: 10.59, periapsisDeg: 73.6 },
 haumea: { eccentricity: 0.18874, inclinationDeg: 28.19, periapsisDeg: 240.6 },
 makemake: { eccentricity: 0.15900, inclinationDeg: 29.00, periapsisDeg: 296.3 },
 eris: { eccentricity: 0.44068, inclinationDeg: 44.04, periapsisDeg: 151.6 },
 orcus: { eccentricity: 0.22700, inclinationDeg: 20.57, periapsisDeg: 73.1 },
 quaoar: { eccentricity: 0.03900, inclinationDeg: 8.00, periapsisDeg: 147.5 },
 gonggong: { eccentricity: 0.49900, inclinationDeg: 30.70, periapsisDeg: 207.7 },
 sedna: { eccentricity: 0.85491, inclinationDeg: 11.93, periapsisDeg: 311.3 },
 salacia: { eccentricity: 0.10600, inclinationDeg: 23.92, periapsisDeg: 278.3 },
 varda: { eccentricity: 0.14000, inclinationDeg: 21.50, periapsisDeg: 104.7 },
 varuna: { eccentricity: 0.05100, inclinationDeg: 17.20, periapsisDeg: 97.4 }
 };

 this.SCIENTIFIC_MOON_ORBITAL_ELEMENTS = {
 moon: { eccentricity: 0.05490, inclinationDeg: 5.15, periapsisDeg: 0.0 },
 phobos: { eccentricity: 0.01510, inclinationDeg: 1.09, periapsisDeg: 0.0 },
 deimos: { eccentricity: 0.00020, inclinationDeg: 1.79, periapsisDeg: 0.0 },
 io: { eccentricity: 0.00410, inclinationDeg: 0.04, periapsisDeg: 0.0 },
 europa: { eccentricity: 0.00940, inclinationDeg: 0.47, periapsisDeg: 0.0 },
 ganymede: { eccentricity: 0.00130, inclinationDeg: 0.20, periapsisDeg: 0.0 },
 callisto: { eccentricity: 0.00740, inclinationDeg: 0.28, periapsisDeg: 0.0 },
 enceladus: { eccentricity: 0.00470, inclinationDeg: 0.00, periapsisDeg: 0.0 },
 rhea: { eccentricity: 0.00100, inclinationDeg: 0.35, periapsisDeg: 0.0 },
 titan: { eccentricity: 0.02880, inclinationDeg: 0.35, periapsisDeg: 0.0 },
 titania: { eccentricity: 0.00110, inclinationDeg: 0.08, periapsisDeg: 0.0 },
 miranda: { eccentricity: 0.00130, inclinationDeg: 4.34, periapsisDeg: 0.0 },
 triton: { eccentricity: 0.00002, inclinationDeg: 156.90, periapsisDeg: 0.0 },
 charon: { eccentricity: 0.00020, inclinationDeg: 0.00, periapsisDeg: 0.0 }
 };

 // J2000.0 mean elements for accurate initial orbital positioning.
 // M0: mean anomaly at J2000 epoch (degrees); n: mean motion (degrees/day);
 // varpi: longitude of perihelion (degrees), i.e. the direction of perihelion
 // measured from the vernal equinox. Without varpi each planet's angle is
 // measured from its own perihelion, so the planets are individually correct
 // for the date but not aligned with one another.
 // Source: Standish et al. 1992 / JPL approximate solar system ephemeris.
 this.PLANET_ELEMENTS_J2000 = {
 mercury: { M0: 174.7943, n: 4.09233445, varpi: 77.4577 },
 venus: { M0: 50.4161, n: 1.60213034, varpi: 131.5637 },
 earth: { M0: 357.5291, n: 0.98560028, varpi: 102.9373 },
 mars: { M0: 19.3451, n: 0.52402068, varpi: 336.0602 },
 jupiter: { M0: 19.5976, n: 0.08308530, varpi: 14.7539 },
 saturn: { M0: 317.6459, n: 0.03344428, varpi: 92.4320 },
 uranus: { M0: 141.6220, n: 0.01172584, varpi: 170.9642 },
 neptune: { M0: 257.6634, n: 0.00598103, varpi: 44.9712 },
 pluto: { M0: 14.8740, n: 0.003975, varpi: 224.0689 },
 ceres: { M0: 95.9891, n: 0.21408, varpi: 153.8 },
 haumea: { M0: 198.0, n: 0.00347, varpi: 1.2 },
 makemake: { M0: 37.0, n: 0.00318, varpi: 13.9 },
 eris: { M0: 208.0, n: 0.00176, varpi: 187.1 },
 orcus: { M0: 112.0, n: 0.00398, varpi: 341.2 },
 quaoar: { M0: 147.0, n: 0.00346, varpi: 344.3 },
 gonggong: { M0: 207.0, n: 0.00177, varpi: 184.0 },
 sedna: { M0: 358.0, n: 0.0000861, varpi: 95.6 },
 salacia: { M0: 280.0, n: 0.00357 },
 varda: { M0: 104.0, n: 0.00352 },
 varuna: { M0: 97.0, n: 0.00352 }
 };

 // Current simulated Julian Date — drives the date display and seekToDate().
 // Initialised to J2000 epoch; updated to today inside initPositionsToDate().
 this.simulatedJD = 2451545.0;
 // Wall-clock timestamp of last simulatedDateChanged event dispatch (throttle)
 this._lastDateEventWall = 0;

 // Time acceleration factor (1 = real-time, higher = faster)
 this.timeAcceleration = 360; // 360x faster = 1 Earth day in 4 minutes
 // Accumulated simulated hours — advanced each frame by deltaTime * timeAcceleration * rotationSpeed.
 // Using this instead of a wall-clock anchor keeps planet self-rotation in sync with the
 // speed slider so moons never appear to reverse when the slider is set very low.
 this.simulatedHours = 0;

 // Real-ephemeris eclipse shadow, projected onto Earth's surface. The scene's
 // Moon orbit is visually exaggerated, so the shadow is computed from true
 // kilometres rather than from the rendered geometry.
 this.eclipseRenderer = new EclipseRenderer(THREE);
 this.currentEclipse = null;
 this._lastEclipseJD = null;
 this._eclipseEventDetail = { eclipse: null };
 this._eclipseEvent = new CustomEvent('eclipseStateChanged', { detail: this._eclipseEventDetail });

 // Scratch objects for _applyEarthOrientation — runs every frame.
 this._earthOrientScratchA = new THREE.Vector3();
 this._earthOrientScratchB = new THREE.Vector3();
 this._earthOrientScratchC = new THREE.Vector3();
 this._earthOrientScratchD = new THREE.Vector3();
 this._earthOrientScratchE = new THREE.Vector3();
 this._earthOrientScratchF = new THREE.Vector3();
 this._earthOrientQuatA = new THREE.Quaternion();
 this._earthOrientQuatB = new THREE.Quaternion();

 // Pre-allocated scratch vectors for update() hot path — avoids per-frame GC pressure
 this._trackTargetPos = new THREE.Vector3();
 this._trackOffset    = new THREE.Vector3();
 this._satEarthPos    = new THREE.Vector3();
 // Scratch vectors for updateCameraTracking() co-rotation mode
 this._camRadial      = new THREE.Vector3();
 this._camTangent     = new THREE.Vector3();
 this._camUp          = new THREE.Vector3();
 this._camPos         = new THREE.Vector3();
 this._camChaseDir    = new THREE.Vector3();
 this._camCurrentTgt  = new THREE.Vector3();
 // Track last focused-object world position for stable follow translation
 this._cameraFollowLastTargetPos = new THREE.Vector3();
 this._cameraFollowObject = null;
 // Focus transition state (fly-to animation) so user input can cleanly interrupt
 // and hand control back to stable follow tracking.
 this._focusTransitionToken = 0;
 this._focusTransitionActive = false;
 this._focusTransitionCancelRequested = false;

 // Pre-allocated CustomEvent for date-changed dispatch — avoids creating
 // 3 new objects every 200 ms in the update hot path.
 this._dateEventDetail = { jd: 0 };
 this._dateEvent = new CustomEvent('simulatedDateChanged', { detail: this._dateEventDetail });

 // Frame counters for throttled animations (initialised here, not lazily in update)
 this._sunFlareFrame    = 0;
 this._starTwinkleFrame = 0;

 // Scratch object for _probePositionAtJD — avoids per-call heap allocation
 this._probePosOut = { x: 0, y: 0, z: 0, distAU: 0 };
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

 // Define all loading steps with progress and tasks
 // Individual planet creation reports its own progress internally
 const loadingSteps = [
 { progress: 5,  message: t('creatingSun'),          task: async () => this.createSun(scene) },
 { progress: 10, message: t('creatingInnerPlanets'),  task: async () => await this.createInnerPlanets(scene) },
 { progress: 20, message: t('creatingOuterPlanets'),  task: async () => await this.createOuterPlanets(scene) },
 { progress: 30, message: t('creatingDwarfPlanets'),  task: async () => await this.createDwarfPlanets(scene) },
 { progress: 40, message: t('creatingAsteroidBelt'),  task: () => this.createAsteroidBelt(scene) },
 { progress: 50, message: t('creatingKuiperBelt'),    task: () => this.createKuiperBelt(scene) },
 { progress: 55, message: t('creatingHeliopause'),    task: () => this.createHeliopause(scene) },
 { progress: 58, message: t('creatingOortCloud'),     task: () => this.createOortCloud(scene) },
 { progress: 61, message: t('creatingStarfield'),     task: () => this.createStarfield(scene) },
 { progress: 64, message: t('creatingMilkyWay'),      task: () => this.createMilkyWay(scene) },
 { progress: 67, message: t('creatingOrbitalPaths'),  task: () => this.createOrbitalPaths(scene) },
 { progress: 70, message: t('creatingConstellations'),task: () => this.createConstellations(scene) },
 { progress: 75, message: t('creatingNebulae'),       task: () => this.createNebulae(scene) },
 { progress: 79, message: t('creatingGalaxies'),      task: () => this.createGalaxies(scene) },
 { progress: 83, message: t('creatingNearbyStars'),   task: () => this.createNearbyStars(scene) },
 { progress: 87, message: t('creatingExoplanets'),    task: () => this.createExoplanets(scene) },
 { progress: 90, message: t('creatingComets'),        task: () => this.createComets(scene) },
 { progress: 93, message: t('creatingSatellites'),    task: () => this.createSatellites(scene) },
 { progress: 96, message: t('creatingSpacecraft'),    task: () => this.createSpacecraft(scene) },
 { progress: 100, message: t('creatingLabels'),       task: () => this.createLabels() }
 ];

 // Execute steps sequentially with UI updates (iterative — avoids 20-frame deep
 // async-recursion stack that the previous executeStep pattern created)
 for (const step of loadingSteps) {
 if (this.uiManager) {
 this.uiManager.updateLoadingProgress(step.progress, step.message);
 }

 // Yield to browser to allow UI repaint
 await new Promise(resolve => requestAnimationFrame(resolve));

 // Execute the loading task
 try {
 await step.task();
 } catch (error) {
 if (DEBUG && DEBUG.enabled) console.error(`[SolarSystem] Error in loading step "${step.message}":`, error);
 }
 }

 // All steps complete
 const totalTime = performance.now() - initStartTime;
 if (DEBUG && DEBUG.PERFORMANCE) {
 console.log(`[SolarSystem] Initialized in ${totalTime.toFixed(0)}ms — Planets: ${Object.keys(this.planets).length}, Satellites: ${this.satellites.length}, Spacecraft: ${this.spacecraft.length}`);
 }

 // Ensure orbital speeds are aligned with the selected mode.
 this.applyScientificModeSpeeds();

 // Seed all planet positions from today's real astronomical positions.
 this.initPositionsToDate(new Date());

 // Signal that loading is complete
 if (window.app && typeof window.app.startExperience === 'function') {
 window.app.startExperience();
 }
 }

 

  

    

    

 
 
 // ===== HYPERREALISTIC TEXTURE GENERATORS =====
 
 

 // Advanced texture loader: attempts high-res sources, then plugin repo sources, then procedural generation.
 // Returns a placeholder texture immediately; replaces with remote if successful; generates procedural only if all remote fail.
 

 

 // Internal: apply successful remote texture
 

 // Internal: apply procedural texture after all remote failed
 
 
 // Mercury real texture loader
 
 
 // Venus real texture loader
 

 /**
  * Build an ocean/land roughness map for Earth from its loaded color texture.
  * Pixels where blue clearly dominates red+green are classified as ocean
  * (roughness ~0.35 for a sharp specular highlight); everything else is treated
  * as land (~0.95, fully matte). Resolves with a THREE.CanvasTexture ready to
  * assign as material.roughnessMap. Rejects if the source image is unusable.
  */
 
 
 // Earth real texture loader - Optimized with reliable fallback chain
 

 // Mars real texture loader
 
 
 // Jupiter real texture loader
 
 
 // Saturn real texture loader
 
 
 // Uranus real texture loader
 
 
 // Neptune real texture loader
 
 
 // Moon real texture loader - NASA LRO (Lunar Reconnaissance Orbiter) photorealistic textures
 

 // Pluto texture loader - self-hosted texture
 

 // Ceres texture loader - self-hosted texture (Dawn mission style cratered surface)
 

 // Io texture loader - Volcanic surface with sulfur deposits (NASA Voyager/Galileo)
 

 // Europa texture loader - NASA Galileo/Juno icy surface with reddish cracks
 

 // Ganymede texture loader - Largest moon in solar system (NASA Voyager/Galileo)
 

 // Callisto texture loader - Ancient cratered surface (NASA Voyager/Galileo)
 

 // Titan texture loader - Saturn's largest moon with thick orange atmosphere (NASA Cassini)
 

 // Enceladus texture loader - Saturn's icy geologically active moon (NASA Cassini)
 

 // Rhea texture loader - Saturn's second-largest moon (NASA Cassini)
 

// Phobos texture loader - Mars moon (NASA JPL PIA10368)
 

 // Deimos texture loader - Mars moon (Wikimedia/NASA)
 

 // Triton texture loader - Neptune's largest moon, retrograde orbit (NASA Voyager)
 

 // Titania texture loader - Uranus's largest moon (NASA Voyager)
 

 // Miranda texture loader - Uranus's smallest major moon with dramatic terrain (NASA Voyager)
 

 // Charon texture loader - Pluto's largest moon (NASA New Horizons)
 

 // Haumea texture loader - Fast-spinning elongated dwarf planet (CC BY 4.0 Solar System Scope)
 

 // Makemake texture loader - Bright Kuiper Belt dwarf planet (CC BY 4.0 Solar System Scope)
 

 // Eris texture loader - Massive scattered disk dwarf planet (CC BY 4.0 Solar System Scope)
 

 
 
 
 
    

 

 
 
 
 
 
 
 
 
 
 
 
 
 // ===== MOON TEXTURES =====
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 

 

 

 

 

    // Verification utility: logs which solar system objects ended up with remote textures
    

 

 

 

 // ─────────────────────────────────────────────────────────────────────────────
 // TIME MACHINE: date ↔ orbit position utilities
 // ─────────────────────────────────────────────────────────────────────────────

 /** Convert a JavaScript Date to a Julian Date number. */
 

 /** Sun's right ascension in radians for a given days-since-J2000 value.
 * Uses low-precision solar coordinates (good to ~1°). */
 

 /** Solve Kepler's equation M = E - e·sin(E) via Newton-Raphson iteration. */
 

 /** Mean anomaly (radians) → true anomaly (radians).
 * Pass pre-cached sqrtPlus = sqrt(1+e) and sqrtMinus = sqrt(1-e) to skip recomputing them. */
 

 /**
 * Compute the scene-space position of a trajectory-based deep-space probe for a given JD.
 * Returns {x, y, z} in scene units (educational or realistic scale).
 * @param {object} traj - trajectory descriptor { refJD, refDistAU, speedKmps, eclLon, eclLat }
 * @param {number} jd   - target Julian Date
 * @returns {{x:number, y:number, z:number, distAU:number}}
 */
 

 /**
 * Update all trajectory-based spacecraft to their correct positions for the given JD.
 * Called from initPositionsToDate and during scale changes.
 * @param {number} jd - Julian Date
 */
 

 /**
 * Seek all planet positions to those matching the given JavaScript Date.
 * Works in both educational (circle) and scientific (Keplerian ellipse) modes.
 * Also seeds simulatedHours so planet self-rotations are consistent.
 * @param {Date} date
 */
 

 /**
 * Public shorthand: seek to a Date object or ISO-8601 string.
 * Silently ignores invalid date inputs to prevent orbital solver corruption.
 * @param {Date|string} input
 */
 

 /**
  * Direction of the real Moon from Earth's centre, expressed in Earth's mesh
  * object space (the same Earth-fixed frame the eclipse shader uses).
  * @returns {{x:number,y:number,z:number}|null} unit vector
  */
 

 /**
  * Refresh the projected eclipse shadow. Throttled by simulated time: the
  * geometry changes slowly, and the ephemeris series are far too heavy to
  * evaluate on every frame of the render loop.
  * @param {boolean} [force] recompute even if the date has barely moved
  */
 

 /**
  * Orient Earth so that the true sub-solar point faces the Sun.
  *
  * The scene's orbital phase does not sit on the real ecliptic (planet angles
  * are seeded for looks, not for coordinates), so Earth's own rotation formula
  * puts the sub-solar point in the wrong hemisphere. Rather than re-basing the
  * whole scene, this makes the Earth-Moon-Sun subsystem internally correct:
  * the lit hemisphere, the terminator, the Moon's direction and the eclipse
  * shadow all agree with each other and with the real sky.
  *
  * The Sun direction is matched exactly; the remaining spin about that axis is
  * chosen to keep the pole as close to the scene's north as possible, which
  * reproduces the correct axial tilt and season.
  */
 

 

 

 

 

 

 

 

 

 

 

 

 

 refreshLocalizedAssets() {
 const labelSprite = this.milkyWaySolarLocator?.userData?.labelSprite;
 if (!labelSprite?.material) return;

 const nextTexture = this._buildMilkyWaySolarLabelTexture();
 const previousTexture = labelSprite.material.map;
 labelSprite.material.map = nextTexture;
 labelSprite.material.needsUpdate = true;
 this.milkyWaySolarLocator.userData.labelTexture = nextTexture;
 if (previousTexture) previousTexture.dispose();
 }

 

 

 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 

 /**
  * Create a dashed pointer line from Dubhe (Big Dipper) to Polaris (Little Dipper).
  * The line is added directly to the scene, hidden by default, and shown only when
  * the Big Dipper is the focused constellation.
  */
 

 

 

 // Loads a deep-sky image (nebula/galaxy) and post-processes it on a canvas:
 //   alpha = luminanceCurve(pixel) × radialFade(position)
 // Near-black backgrounds become fully transparent; bright nebula/galaxy
 // pixels stay visible; edges dissolve naturally into the starfield.
 //
 // Key improvements over a pure-luminance approach:
 //  1. Corner sampling: averages small patches at all 4 corners to detect the
 //     background colour (handles WISE/Spitzer false-colour infrared images
 //     whose backgrounds are not pure black but dark orange/teal/grey).
 //  2. Background subtraction: subtracts that colour before the luminance curve
 //     so infrared "glow" is neutralised before any transparency decision.
 //  3. Radial fade starts at 60% (was 70%) so edges dissolve over a wider
 //     band with a smoother quadratic rolloff — less hard "picture frame" edge.
 

 // Procedurally generates a canvas texture of the Andromeda Galaxy (M31)
 // based on real photographic reference:
 // • Warm white-yellow central bulge (de Vaucouleurs r^1/4 profile)
 // • Beige/brown exponential disk with dark dust-lane bands
 // • Blue-purple outer stellar halo
 // • Blue star-forming knots along the spiral arms
 // • M32 companion handled separately as an overlay
 // Alpha channel = luminance, so pure-black pixels are transparent.
 

 // Generates a simple small elliptical galaxy canvas (for M32 companion etc.)
 

 // Procedural galaxy renderer (spiral particle cloud or elliptical point cloud)
 

 

 

 



    

    

    

    

    

    

    
 

 

 

 

 cleanup(scene) {
 // Dispose materials and geometries for all objects (including group children)
 this.objects.forEach(obj => {
 obj.traverse(child => {
 if (child.geometry) child.geometry.dispose();
 if (child.material) {
 if (Array.isArray(child.material)) {
 child.material.forEach(mat => mat.dispose());
 } else {
 child.material.dispose();
 }
 }
 });
 scene.remove(obj);
 });
 
 // Clean up starfield
 if (this.starfield) {
 if (this.starfield.geometry) this.starfield.geometry.dispose();
 if (this.starfield.material) this.starfield.material.dispose();
 scene.remove(this.starfield);
 }

 // Clean up Milky Way
 if (this.milkyWay) {
 if (this.milkyWay.geometry) this.milkyWay.geometry.dispose();
 if (this.milkyWay.material) this.milkyWay.material.dispose();
 scene.remove(this.milkyWay);
 }

 // Clean up orbital paths
 this.orbits.forEach(orbit => {
 if (orbit.geometry) orbit.geometry.dispose();
 if (orbit.material) orbit.material.dispose();
 scene.remove(orbit);
 });

 // Clean up comet orbit lines (separate from planet orbits)
 if (this.cometOrbits) {
 this.cometOrbits.forEach(orbit => {
 if (orbit.geometry) orbit.geometry.dispose();
 if (orbit.material) orbit.material.dispose();
 scene.remove(orbit);
 });
 }

 // Remove sun light
 const sunLight = scene.getObjectByName('sunLight');
 if (sunLight) scene.remove(sunLight);

 // Clean up heliopause
 if (this.heliopause) {
 this.heliopause.traverse(child => {
 if (child.geometry) child.geometry.dispose();
 if (child.material) child.material.dispose();
 });
 scene.remove(this.heliopause);
 this.heliopause = null;
 }

 // Clean up Milky Way galaxy disc
 if (this.milkyWayDisc) {
 this.milkyWayDisc.traverse(child => {
 if (child === this.milkyWayDisc) return;
 if (child.geometry) child.geometry.dispose();
 if (child.material) {
 if (Array.isArray(child.material)) {
 child.material.forEach(mat => {
 if (mat.map) mat.map.dispose();
 mat.dispose();
 });
 } else {
 if (child.material.map) child.material.map.dispose();
 child.material.dispose();
 }
 }
 });
 if (this.milkyWayDisc.geometry) this.milkyWayDisc.geometry.dispose();
 if (this.milkyWayDisc.material) {
 if (this.milkyWayDisc.material.map) this.milkyWayDisc.material.map.dispose();
 this.milkyWayDisc.material.dispose();
 }
 scene.remove(this.milkyWayDisc);
 this.milkyWayDisc = null;
 }

 // Clean up galaxies (including procedural background galaxies)
 if (this.galaxies) {
 this.galaxies.forEach(galaxy => {
 galaxy.traverse(child => {
 if (child.geometry) child.geometry.dispose();
 if (child.material) {
 if (child.material.map) child.material.map.dispose();
 if (Array.isArray(child.material)) {
 child.material.forEach(mat => mat.dispose());
 } else {
 child.material.dispose();
 }
 }
 });
 scene.remove(galaxy);
 });
 }

 // Dispose cached geometries when fully cleaning up
 this.geometryCache.forEach(geo => geo.dispose());
 this.geometryCache.clear();

 this.objects = [];
 this.planets = {};
 this.moons = {};
 this.sun = null;
 this.starfield = null;
 this.milkyWay = null;
 this.milkyWaySolarLocator = null;
 this.asteroidBelt = null;
 this.kuiperBelt = null;
 this.oortCloud = null;
 this.orbits = [];
 this.cometOrbits = [];
 this.comets = [];
 this.satellites = [];
 this.spacecraft = [];
 this.constellations = [];
 this.nebulae = [];
 this.galaxies = [];
 this.nearbyStars = [];
 this.exoplanets = [];
 this.focusedComet = null;
 }

 getSelectableObjects() {
 return this.objects;
 }
 
 /**
 * Set which orbit paths are visible.
 * mode: 'all' | 'planets' | 'dwarfs' | 'moons' | 'comets' | 'none'
 */
 setOrbitMode(mode) {
 this.orbitMode = mode;
 const showPlanets = (mode === 'all' || mode === 'planets');
 const showDwarfs = (mode === 'all' || mode === 'dwarfs');
 const showMoons = (mode === 'all' || mode === 'moons');
 const showComets = (mode === 'all' || mode === 'comets');
 this.orbitsVisible = (mode === 'all'); // legacy flag: true only when everything is on
 this.cometOrbitsVisible = showComets;
 this.orbits.forEach(orbit => {
 const ud = orbit.userData;
 if (ud.type === 'moonOrbit') {
 orbit.visible = showMoons;
 } else if (ud.isDwarf) {
 orbit.visible = showDwarfs;
 } else {
 orbit.visible = showPlanets;
 }
 });
 if (this.cometOrbits) this.cometOrbits.forEach(orbit => { orbit.visible = showComets; });
 // comet orbit lines stored in userData also need updating
 if (this.comets) {
 this.comets.forEach(comet => {
 const orbitLine = comet?.userData?.orbitLine;
 if (orbitLine) orbitLine.visible = showComets;
 });
 }
 if (DEBUG.enabled) console.log(` Orbit mode: ${mode}`);
 }

 // Backward-compat: old boolean toggle maps to all/none
 toggleOrbits(visible) {
 this.setOrbitMode(visible ? 'all' : 'none');
 }
 
 toggleConstellations(visible) {
 this.constellationsVisible = visible;
 if (visible) {
 // Clear any highlight focus when toggling on, to restore all constellations
 this.focusedConstellation = null;
 }
 this.constellations.forEach(constellation => {
 constellation.visible = visible;
 if (visible) {
 // Restore visibility of all children (may have been hidden by highlightConstellation)
 constellation.traverse(child => {
 child.visible = true;
 if (child.material && child.material.userData?.originalOpacity !== undefined) {
 child.material.opacity = child.material.userData.originalOpacity;
 }
 });
 }
 });
 // Also hide the Polaris pointer line when constellations are toggled off
 if (this._polarisPointerLine) {
 this._polarisPointerLine.visible = false;
 }
 if (DEBUG.enabled) console.log(` Constellations ${visible ? 'shown' : 'hidden'}`);
 }


 
 
 

 
 
 
 
 

 
 
 

 getObjectInfo(object) {
 const userData = object.userData;
 
 // Translate object name
 const nameKey = userData.name?.replace(/\s+/g, '');
 let translatedName = userData.name || 'Unknown';
 if (nameKey && window.t && window.t(nameKey) !== nameKey) {
 translatedName = t(nameKey);
 }
 
 // Translate object type
 const typeKey = 'type' + (userData.type ? userData.type.charAt(0).toUpperCase() + userData.type.slice(1) : '');
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
 distanceText = `${userData.distance.toFixed(1)} ${t('scaledUnitsFromSun')}`;
 } else {
 distanceText = t('distanceVaries');
 }
 
 // Get translated description based on object name
 let description = userData.description || t('noDescription');
 // Build PascalCase key segment: lowercase ids like 'mercury' become 'Mercury',
 // multi-word names like 'Comet Encke' become 'CometEncke'.
 const keyName = (userData.name || '').replace(/(?:^|\s)(\S)/g, (_, c) => c.toUpperCase()).replace(/\s+/g, '');
 const descKey = 'desc' + keyName;
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
 const funFactKey = 'funFact' + keyName;
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
 // Store controls reference so onControlsInteractionStart can stop auto-orbit
 this._activeControls = controls;
 // Re-enable damping for the fly-in animation (smooth landing feel).
 // finalizeFocusTransition will disable it again if follow-mode is active.
 controls.enableDamping = true;
 // Start a new focus transition scope; this invalidates any previous in-flight
 // focus animation loop and allows clean user-interrupt handling.
 const transitionToken = ++this._focusTransitionToken;
 this._focusTransitionActive = true;
 this._focusTransitionCancelRequested = false;

 if (!object || !object.userData) {
 if (DEBUG.enabled) console.warn(' Cannot focus on invalid object');
 return;
 }

 const previousFocusedObject = this.focusedObject;
 
 if (DEBUG.enabled) {
 console.log(` [Focus] Focusing on: ${object.userData.name}, type: ${object.userData.type}, isComet: ${object.userData.isComet}`);
 }
 
 // Determine actual object size (not inflated glow size)
 const userData = object.userData;
 
let actualRadius;
 
 if (userData.isSpacecraft || userData.isComet) {
 // Use actual size for spacecraft and comets, not glow/tail size
 actualRadius = userData.actualSize || 0.1;
 } else if (userData.isConstellationStar) {
 // Individual constellation star: treat as a small point of light
 actualRadius = 1;
 } else if (userData.type === 'constellation') {
 // Constellations: use calculated radius (star pattern spread)
 // Ensure minimum radius for small asterisms (e.g., Orion's Belt = 3 close stars)
 actualRadius = Math.max(userData.radius || 500, 300);
 } else if (userData.type === 'galaxy' || userData.type === 'nebula') {
 // Distant deep-sky objects
 actualRadius = userData.radius || 300;
 } else {
 actualRadius = userData.radius || 10;
 }
 
 // Calculate appropriate viewing distance based on object type
 let distance;
 if (userData.type === 'constellation') {
 // Constellations: Position camera to view the star pattern
 // They're at distance ~10000, so we need to be relatively close but not inside
 distance = actualRadius * 3; // View from 3x the pattern size
 } else if (userData.isConstellationStar) {
 // Individual star: zoom in close but not absurdly so
 distance = 120;
 } else if (userData.type === 'galaxy') {
 // Galaxies: Distant objects, zoom to appreciate structure
 distance = actualRadius * 4;
 } else if (userData.type === 'nebula') {
 // Nebulae: Clouds in space, zoom to show details
 distance = actualRadius * 3.5;
 } else if (userData.isSpacecraft && userData.distance > 100) {
 // Distant spacecraft: zoom in close enough to see them clearly
 distance = Math.max(actualRadius * 10, 5);
 } else if (userData.isSpacecraft && userData.orbitPlanet) {
 // ISS and orbital satellites: Close enough to see details but not too close
 // For tiny objects like ISS (size ~0.03), position camera at reasonable distance (1.0 units minimum)
 distance = Math.max(actualRadius * 15, 1.0);
 if (DEBUG.enabled) console.log(` [Satellite Chase-Cam] Camera distance: ${distance.toFixed(2)} (${actualRadius.toFixed(3)} × 15, min 1.0) for ISS viewing`);
 } else if (userData.type === 'moon' && userData.parentPlanet) {
 // Moons: View showing moon with parent planet visible in background.
 // Problem: moonOrbitDistance * 0.15 dominates for small moons like Enceladus
 // (radius=0.04, orbit=22 → gives 3.3 = 82× radius, moon appears as a speck).
 // Fix: cap the orbit-distance contribution to actualRadius * 12 so tiny moons
 // are always zoomed in relative to their own size (same experience as Ganymede).
 const moonOrbitDistance = userData.distance || 4;
 const orbitFactor = Math.min(moonOrbitDistance * 0.15, actualRadius * 12);
 distance = Math.max(orbitFactor, actualRadius * 8, 0.3);
 if (DEBUG.enabled) console.log(` [Moon Chase-Cam] Close distance: ${distance.toFixed(2)} for "${userData.name}" (orbit: ${moonOrbitDistance}, radius: ${actualRadius.toFixed(3)}, orbitFactor: ${orbitFactor.toFixed(2)}) around ${userData.parentPlanet}`);
 } else if (userData.isSpacecraft) {
 // Other spacecraft: moderate zoom
 distance = Math.max(actualRadius * 8, 3);
 } else if (userData.isComet) {
 // Comets: zoom to see nucleus, coma, and LONG tails
 // Comets have tiny nucleus (0.0008-0.005) but tails extend 30-100+ units
 // Position camera far enough back to see the full spectacle
 distance = 80; // Fixed distance to capture nucleus + coma + full tails
 if (DEBUG.enabled) console.log(` [Comet] Camera distance: ${distance.toFixed(2)} for ${userData.name} (nucleus size: ${actualRadius.toFixed(4)})`);
 } else if (userData.type === 'DwarfPlanet') {
 // Dwarf planets: tiny radii (0.05-0.19) need much closer initial zoom
 // At standard 5x multiplier they'd all hit the min=10 floor, way too far
 distance = Math.max(actualRadius * 3, 0.6);
 if (DEBUG.enabled) console.log(` [Dwarf Planet] Camera distance: ${distance.toFixed(2)} for ${userData.name} (radius: ${actualRadius.toFixed(3)})`);
 } else if (userData.type === 'asteroidBelt') {
 // Asteroid Belt outer edge: educational ~150 units, realistic ~500 units
 distance = this.realisticScale ? 600 : 170;
 } else if (userData.type === 'kuiperBelt') {
 // Kuiper Belt outer edge: educational ~2400 units, realistic ~8250 units
 distance = this.realisticScale ? 9000 : 2800;
 } else if (userData.type === 'oortCloud') {
 // Navigate to just outside the Oort Cloud outer edge (scale-aware)
 distance = this.realisticScale ? 65000 : 9500;
 } else if (userData.type === 'heliopause') {
 // Heliopause view distance (scale-aware)
 distance = this.realisticScale ? 20000 : 3200;
 } else if (userData.type === 'milkyWay') {
 // Milky Way: zoom out to see the entire galaxy disc
 // In realistic mode the disc is 6.667× larger, so stand proportionally further back
 distance = this.realisticScale ? 55000 * (18000 / 2700) : 55000;
 } else {
 // Regular objects: standard zoom
 distance = Math.max(actualRadius * 5, 10);
 }
 
 const targetPosition = new THREE.Vector3();

 // Special handling for constellations - use center of star pattern
 if (userData.type === 'constellation' && userData.centerPosition) {
 targetPosition.set(
 userData.centerPosition.x,
 userData.centerPosition.y,
 userData.centerPosition.z
 );
 
 // Highlight this constellation and dim others
 this.highlightConstellation(object);
 } else if (userData.isConstellationStar && object.parent) {
 // Individual star: fly to its world position, highlight the parent constellation
 object.getWorldPosition(targetPosition);
 this.highlightConstellation(object.parent);
 } else {
 // Reset constellation highlighting if focusing on non-constellation
 this.resetConstellationHighlight();
 object.getWorldPosition(targetPosition);
 // For Milky Way: targetPosition = origin (solar system) so the
 // camera look-at always tracks through the anchor point.
 if (userData.type === 'milkyWay') {
 targetPosition.set(0, 0, 0);
 }
 }

// Store reference for tracking
 this.focusedObject = object;
 this.focusedObjectDistance = distance;
 this.focusedObjectStartTime = performance.now();

 if (DEBUG.enabled) console.log(` Focus: ${object.userData.name} (r:${actualRadius.toFixed(2)}, d:${distance.toFixed(2)})`);

 // Determine if this is a fast-moving object that needs special tracking
 const isOrbiter = userData.orbitPlanet || (userData.isSpacecraft && userData.speed);
 const isFastOrbiter = isOrbiter && userData.speed > 0.5;

 // Enable chase-cam co-rotation for ALL orbiting objects except planets
 // Camera will orbit WITH the object (spacecraft, moons, etc.)
 const isPlanetOrbitingSun = (userData.type === 'planet' || userData.isPlanet) && userData.orbitPlanet?.toLowerCase() === 'sun';
 
 if (userData.type === 'constellation') {
     // Constellations: never follow
     this.cameraFollowMode = false;
     this.cameraCoRotateMode = false;
 } else if ((userData.orbitPlanet || userData.parentPlanet) && !isPlanetOrbitingSun) {
     // All objects orbiting a planet (spacecraft, moons, etc.): traditional tracking.
     // Only controls.target follows the object each frame; OrbitControls maintains
     // camera radius/angle relative to it so the user can still tilt/zoom/pan freely.
     // Co-rotation (camera.position overwritten each frame) blocked user interaction
     // and caused a position snap when the fly-in ended, so it is not used here.
     this.cameraFollowMode = true;
     this.cameraCoRotateMode = false;
     const objectType = userData.isSpacecraft ? 'spacecraft' : userData.type || 'orbiter';
     if (DEBUG.enabled) console.log(` Traditional tracking enabled for ${object.userData.name} (${objectType})`);
 } else if (userData.type === 'planet' || userData.type === 'DwarfPlanet' || userData.isPlanet) {
     // Planets and dwarf planets orbiting the sun: traditional follow
     // isOrbiter is false — handle explicitly so camera tracks the orbit)
     this.cameraFollowMode = true;
     this.cameraCoRotateMode = false;
     if (DEBUG.enabled) console.log(` Traditional tracking enabled for planet ${object.userData.name}`);
 } else if (isOrbiter) {
     // Other orbiters (comets, etc.): traditional tracking
     this.cameraFollowMode = true;
     this.cameraCoRotateMode = false;
     if (DEBUG.enabled) console.log(` Traditional tracking enabled for ${object.userData.name}`);
 } else {
     this.cameraFollowMode = false;
     this.cameraCoRotateMode = false;
 }

 // Adjust time speed based on object type
 // Fast-moving orbital objects (ISS, satellites) need slower time for observation
 if (userData.isSpacecraft && userData.orbitPlanet && !isPlanetOrbitingSun) {
     // Orbital spacecraft (ISS, satellites): slow to 0.1x for detailed observation
     if (window.app && window.app.timeSpeed !== 0) {
         window.app.timeSpeed = 0.1;
         // Sync speed slider UI
         const sl = document.getElementById('time-speed');
         if (sl && window.app.uiManager) { sl.value = window.app.uiManager.speedToSlider(0.1); sl.dispatchEvent(new Event('input')); }
         if (DEBUG.enabled) console.log(` [Time Speed] Reduced to 0.1x for orbital spacecraft observation`);
     }
 } else if (userData.type === 'planet' || userData.type === 'DwarfPlanet' || userData.isPlanet) {
     if (window.app && window.app.timeSpeed !== 0 && window.app.timeSpeed !== 1) {
         window.app.timeSpeed = 1;
         // Sync speed slider UI
         const sl = document.getElementById('time-speed');
         if (sl && window.app.uiManager) { sl.value = window.app.uiManager.speedToSlider(1); sl.dispatchEvent(new Event('input')); }
         if (DEBUG.enabled) console.log(` [Time Speed] Restored to 1x for planet observation`);
     }
 }
 
 // Configure controls for focused object inspection
 let minDist, maxDist;
 
 if (userData.type === 'constellation') {
 // Constellations: allow getting very close to see individual stars
 minDist = 20; // Allow close inspection of star pattern
 maxDist = 20000; // Allow zooming far out to see whole pattern
 } else if (userData.isConstellationStar) {
 // Individual constellation star: allow zooming out far enough to see the full constellation
 const parentGroup = object.parent;
 const constellationRadius = (parentGroup && parentGroup.userData && parentGroup.userData.radius) || 500;
 minDist = 5; // Close enough to inspect the star
 maxDist = constellationRadius * 5; // Far enough to see entire constellation
 } else if (userData.isSpacecraft && userData.orbitPlanet) {
 // ISS and orbital satellites: allow close inspection and wide zoom range
 minDist = 0.2; // Get close to see module details
 maxDist = 100; // Zoom out to see Earth + satellite in context
 if (DEBUG.enabled) console.log(` [ISS/Satellite Zoom] min: ${minDist}, max: ${maxDist}`);
 } else if (userData.type === 'planet' || userData.isPlanet) {
 // Planets: allow very close surface inspection (just above the surface)
 minDist = actualRadius * 0.15; // ~15% of radius — tight orbit view
 maxDist = Math.max(actualRadius * 100, 1000);
 } else if (userData.type === 'nebula' || userData.type === 'galaxy') {
 // Deep-sky objects: allow zooming all the way back to the solar system.
 // They are placed at 15 000–37 500 units from origin and the camera ends
 // up just outside their radius, so minDist must be near 0 not actualRadius.
 minDist = CONFIG.CONTROLS.minDistance;
 maxDist = Math.max(distance * 2, CONFIG.CONTROLS.maxDistance);
 } else if (userData.type === 'milkyWay') {
 // Milky Way: allow zooming all the way back into the solar system
 minDist = CONFIG.CONTROLS.minDistance;
 maxDist = Math.max(actualRadius * 4, CONFIG.CONTROLS.maxDistance);
 } else if (userData.type === 'oortCloud' || userData.type === 'kuiperBelt'
 || userData.type === 'asteroidBelt' || userData.type === 'heliopause') {
 // Shell/ring structures centred on the Sun — must allow zooming all the way back to the origin
 minDist = CONFIG.CONTROLS.minDistance;
 maxDist = Math.max(distance * 2, CONFIG.CONTROLS.maxDistance);
 } else {
 // Scale floor proportionally so small objects (Enceladus r=0.04) are reachable
 // Large objects keep the 0.5 floor; small moons get a floor of ~3× their radius
 minDist = Math.max(actualRadius * 0.5, Math.min(0.5, actualRadius * 3));
 maxDist = Math.max(actualRadius * 100, 1000); // Allow zooming far out
 }
 
 controls.minDistance = minDist;
 // Always allow zooming out to the global maximum (intergalactic view)
 // even when focused on a specific object
 controls.maxDistance = Math.max(maxDist, CONFIG.CONTROLS.maxDistance);
 
 // Adjust camera near clip plane for small objects to prevent "donut" clipping
 // Default near=0.1 clips through objects smaller than ~0.1 radius when zoomed in close
 const nearForObject = Math.min(0.1, actualRadius * 0.1);
 camera.near = Math.max(nearForObject, 0.001); // Never below 0.001 (depth buffer precision)
 camera.updateProjectionMatrix();
 
 // Configure controls based on object type
 controls.enableRotate = true;
 controls.enableZoom = true;
 // Allow panning even for ISS/satellites; co-rotation path now preserves pan offset.
 controls.enablePan = true;
 controls.autoRotate = false;
 
 if (userData.isSpacecraft && userData.orbitPlanet) {
 if (DEBUG.enabled) console.log(` [ISS Controls] Pan + zoom enabled while keeping orbital follow`);
 }
 
 // Smooth camera transition
 const startPos = new THREE.Vector3().copy(camera.position);
 const startTarget = new THREE.Vector3().copy(controls.target);
 const focusScratch = this._focusScratch;
 const requiresSolarAnchorTransit = userData.type === 'milkyWay' || previousFocusedObject?.userData?.type === 'milkyWay';
 const solarAnchorTarget = new THREE.Vector3(0, 0, 0);
 const solarAnchorCameraPos = new THREE.Vector3();
 
 // For fast orbiters (like ISS), do NOT use relative offset if isSpacecraft
 let useRelativeOffset = false;
 let parentPlanet = null;
 let relativeOffset = null;

 if (isFastOrbiter && userData.orbitPlanet && !userData.isSpacecraft) {
     parentPlanet = this.planets[userData.orbitPlanet.toLowerCase()];
     if (parentPlanet) {
         useRelativeOffset = true;
         relativeOffset = new THREE.Vector3().copy(targetPosition).sub(parentPlanet.position);
         if (DEBUG.enabled) console.log(` Fast orbiter: using relative offset from ${userData.orbitPlanet}`);
     }
 }
 
 // Calculate camera end position based on object type
 let endPos;

 if (userData.type === 'constellation' || userData.type === 'galaxy' || userData.type === 'nebula') {
     // For distant objects: Position camera OUTSIDE solar system, looking AT the constellation
     // Strategy: Place camera on a sphere around the constellation, ensuring line of sight
     // doesn't pass through the solar system at origin
     
     // Direction from origin to constellation
    const directionFromOrigin = focusScratch.directionFromOrigin.copy(targetPosition).normalize();
     
     // Position camera slightly to the SIDE of the direct line from origin to constellation
     // This ensures the solar system (at origin) is not in the line of sight
     
     // Create a perpendicular vector (90 degrees from the origin-constellation line)
    const perpendicularVector = focusScratch.perpendicularVector.set(-directionFromOrigin.z, 0, directionFromOrigin.x).normalize();
     
     // Scale side offset proportionally to constellation size
     // Small constellations (Orion's Belt radius ~200) get a smaller offset for closer viewing
     const sideOffset = Math.max(actualRadius * 0.8, 200); // Proportional, min 200 (tighter framing)
     const backOffset = distance; // Viewing distance
     
     endPos = new THREE.Vector3().copy(targetPosition)
         .addScaledVector(perpendicularVector, sideOffset) // Move to the side
         .addScaledVector(directionFromOrigin, -backOffset * 0.3); // Pull back slightly for viewing angle
     
     // Ensure camera is far from origin (outside solar system sphere of ~300 units)
     const distanceFromOrigin = endPos.length();
     if (distanceFromOrigin < 500) {
         // If too close to origin, push camera further out in perpendicular direction
         endPos.addScaledVector(perpendicularVector, 500);
         if (DEBUG.enabled) console.log(` [${userData.type}] Camera repositioned further from solar system`);
     }
     
     // Set controls target to constellation center - camera will look directly at it
     controls.target.copy(targetPosition);
     
     if (DEBUG.enabled) console.log(` [${userData.type}] Camera at ${distanceFromOrigin.toFixed(0)} units from origin, looking at constellation at ${targetPosition.length().toFixed(0)} units`);
 } else if (userData.isSpacecraft && userData.orbitPlanet) {
     // For ISS and other spacecraft: position camera to see BOTH ISS and Earth
     parentPlanet = this.planets[userData.orbitPlanet.toLowerCase()];
     if (parentPlanet) {
         // Get direction from Earth to ISS (radial direction)
         const earthPos = focusScratch.earthPos;
         parentPlanet.getWorldPosition(earthPos);
         const issDirection = focusScratch.issDirection.copy(targetPosition).sub(earthPos).normalize();
         
         // Position camera OUTSIDE the orbit, looking inward at both ISS and Earth
         // This ensures Earth is always visible as backdrop
         const cameraDistance = distance * 1.5; // Further out to see both
         endPos = new THREE.Vector3(
             targetPosition.x + issDirection.x * cameraDistance, // Outside the orbit
             targetPosition.y + cameraDistance * 0.4, // Elevated view
             targetPosition.z + issDirection.z * cameraDistance
         );
         
         controls.target.copy(targetPosition); // Look at ISS (Earth will be behind it)
     } else {
         // Fallback: simple positioning
         const angle = Math.random() * Math.PI * 2;
         endPos = new THREE.Vector3(
             targetPosition.x + Math.cos(angle) * distance,
             targetPosition.y + distance * 0.3,
             targetPosition.z + Math.sin(angle) * distance
         );
         controls.target.copy(targetPosition);
     }
 } else if (userData.isSpacecraft) {
     // Other spacecraft without orbit: position camera at a fixed offset
     endPos = new THREE.Vector3(
         targetPosition.x,
         targetPosition.y + distance * 0.3,
         targetPosition.z + distance
     );
     controls.target.copy(targetPosition);
 } else if (userData.type === 'moon' && userData.parentPlanet) {
     // Moons: position camera at a simple consistent offset relative to moon world position.
     // We avoid computing a moonDirection vector entirely — any normalize() on a zero-length
     // vector (e.g. if world matrices are stale at call time) would produce NaN in endPos,
     // breaking both the animation and OrbitControls zoom. A fixed angular offset is safe
     // and centers the moon the same way planets are centered.
     endPos = new THREE.Vector3(
         targetPosition.x + distance * 0.6,
         targetPosition.y + distance * 0.5,
         targetPosition.z + distance * 0.8
     );
     controls.target.copy(targetPosition); // Look at moon
     if (DEBUG.enabled) console.log(` [Moon Chase-Cam] Camera at fixed offset from ${userData.name}, distance=${distance.toFixed(3)}}`);
 } else if (userData.type === 'planet' || userData.isPlanet) {
     // Planets: Cinematic angles that showcase their features
     const planetName = (userData.id || userData.name).toLowerCase();
     let angleOffset = 0;
     let elevationFactor = 0.4;
     let distanceMultiplier = 1.0;
     
     // Customize camera angle per planet for best feature showcase
     if (planetName === 'saturn') {
         // Saturn: View rings at a dramatic angle
         elevationFactor = 0.25; // Lower angle to see rings better
         angleOffset = Math.PI * 0.3; // 54 degrees for ring visibility
         distanceMultiplier = 1.2; // Pull back a bit to see full ring system
         if (DEBUG.enabled) console.log(` [Saturn] Ring showcase view`);
     } else if (planetName === 'jupiter') {
         // Jupiter: Slight elevation to show bands and Great Red Spot
         elevationFactor = 0.35;
         angleOffset = Math.PI * 0.15; // 27 degrees
         if (DEBUG.enabled) console.log(` [Jupiter] Band showcase view`);
     } else if (planetName === 'mars') {
         // Mars: Medium elevation to show polar caps
         elevationFactor = 0.45;
         angleOffset = Math.PI * 0.25; // 45 degrees
         if (DEBUG.enabled) console.log(` [Mars] Polar cap view`);
     } else if (planetName === 'earth') {
         // Earth: Beautiful oblique angle
         elevationFactor = 0.5;
         angleOffset = Math.PI * 0.2; // 36 degrees
         if (DEBUG.enabled) console.log(` [Earth] Oblique orbital view`);
     } else if (planetName === 'venus' || planetName === 'mercury') {
         // Inner planets: Higher elevation
         elevationFactor = 0.55;
         angleOffset = Math.PI * 0.3;
         if (DEBUG.enabled) console.log(` [${planetName}] High angle view`);
     } else if (planetName === 'uranus' || planetName === 'neptune') {
         // Ice giants: Moderate angle with slight randomness
         elevationFactor = 0.4 + Math.random() * 0.2;
         angleOffset = Math.PI * 0.25;
         if (DEBUG.enabled) console.log(` [${planetName}] Ice giant showcase`);
     } else {
         // Default planet view
         elevationFactor = 0.4;
         angleOffset = Math.PI * 0.3;
     }
     
     const adjustedDistance = distance * distanceMultiplier;
     endPos = new THREE.Vector3(
         targetPosition.x + Math.cos(angleOffset) * adjustedDistance,
         targetPosition.y + adjustedDistance * elevationFactor,
         targetPosition.z + Math.sin(angleOffset) * adjustedDistance
     );
     controls.target.copy(targetPosition);
 } else if (userData.isComet) {
     // Comets: Chase camera positioned to see nucleus, coma, and spectacular tails
     // (Detail view positioning already done above before getWorldPosition)
     // Tails point away from sun - position camera to show the full majesty
    const sunPosition = focusScratch.sunPosition.copy(this.sun ? this.sun.position : { x: 0, y: 0, z: 0 });
    const cometToSunDir = focusScratch.cometToSunDir.copy(sunPosition).sub(targetPosition).normalize();
     
     // Position camera at 45° angle from sun-comet line, elevated for cinematic view
     // This shows: nucleus (center), coma (glow), and tails streaming AWAY from camera toward us
    const rightVector = focusScratch.rightVector.set(-cometToSunDir.z, 0, cometToSunDir.x).normalize();
     
     // Camera offset: 
     // - 70% along sun direction (slightly toward sun for lighting)
     // - 50% to the side (perpendicular for better view)  
     // - 40% elevated (cinematic angle from above)
     endPos = new THREE.Vector3().copy(targetPosition)
         .addScaledVector(cometToSunDir, distance * 0.7)
         .addScaledVector(rightVector, distance * 0.5)
         .setY(targetPosition.y + (cometToSunDir.y * distance * 0.7) + (rightVector.y * distance * 0.5) + (distance * 0.4));
     
     controls.target.copy(targetPosition); // Look at comet nucleus
     
     // Enable chase-cam following for smooth comet tracking
     this.cameraFollowMode = true;
     this.cameraCoRotateMode = true;
     
     if (DEBUG.enabled) {
         const distFromSun = Math.sqrt(targetPosition.x**2 + targetPosition.y**2 + targetPosition.z**2);
         console.log(` [Comet Chase-Cam] ${userData.name}:`);
         console.log(`   Comet position: (${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
         console.log(`   Distance from Sun: ${distFromSun.toFixed(1)} units`);
         console.log(`   Camera position: (${endPos.x.toFixed(1)}, ${endPos.y.toFixed(1)}, ${endPos.z.toFixed(1)})`);
         console.log(`   Camera distance from comet: ${distance} units`);
     }
 } else if (userData.type === 'asteroid') {
     // Asteroids: Close dramatic angle to show irregular shape
     const angle = Math.random() * Math.PI * 2;
     const elevation = 0.3 + Math.random() * 0.2; // Lower angle (0.3-0.5) for drama
     endPos = new THREE.Vector3(
         targetPosition.x + Math.cos(angle) * distance * 0.8,
         targetPosition.y + distance * elevation,
         targetPosition.z + Math.sin(angle) * distance * 0.8
     );
     controls.target.copy(targetPosition);
     if (DEBUG.enabled) console.log(` [Asteroid] Close dramatic angle for irregular shape showcase`);
 } else if (userData.type === 'milkyWay') {
     // Milky Way: ascend from the solar system (world origin) along the
     // disc's face normal so the transition feels like rising out of /
     // descending back into our position in the galaxy.
     // PlaneGeometry faces local +Z; apply the disc's rotation to get the
     // world-space normal pointing "up" from the disc surface.
     const discNormal = new THREE.Vector3(0, 0, 1);
     discNormal.applyQuaternion(this.milkyWayDisc.quaternion).normalize();
     // Camera placed exactly above the solar system (origin) along disc normal,
     // so we strictly enter and exit precisely at the star anchor rather than
     // slanted towards the galaxy center.
     endPos = new THREE.Vector3(
         discNormal.x * distance * 0.8,
         discNormal.y * distance * 0.8,
         discNormal.z * distance * 0.8
     );
     // Look at the solar system (origin) — the anchor point
     controls.target.set(0, 0, 0);
     if (DEBUG.enabled) console.log(` [milkyWay] Solar-system anchor exit along disc normal at distance ${distance.toFixed(0)}`);
 } else if (userData.type === 'asteroidBelt' || userData.type === 'kuiperBelt' || userData.type === 'oortCloud' || userData.type === 'heliopause') {
     // Structural objects centered at origin: position camera OUTSIDE looking inward
     // Pick a viewing angle elevated above the ecliptic for a good overview
     const viewAngle = Math.PI * 0.35; // ~63 degrees around
     endPos = new THREE.Vector3(
         targetPosition.x + Math.cos(viewAngle) * distance,
         targetPosition.y + distance * 0.45, // Elevated view above ecliptic
         targetPosition.z + Math.sin(viewAngle) * distance
     );
     controls.target.copy(targetPosition); // Look toward the actual solar-system anchor
     if (DEBUG.enabled) console.log(` [${userData.type}] Outside-in view at distance ${distance.toFixed(0)}`);
 } else {
     // Other objects: Dynamic positioning with slight variation
     const variation = Math.random() * 0.2 - 0.1; // -0.1 to +0.1 variation
     endPos = new THREE.Vector3(
         targetPosition.x + distance * variation,
         targetPosition.y + distance * (0.3 + variation),
         targetPosition.z + distance * (1.0 + variation)
     );
     controls.target.copy(targetPosition); // Ensure target is set
 }
 
 // For constellations, immediately set up the camera orientation before animation
 if (userData.type === 'constellation' || userData.type === 'galaxy' || userData.type === 'nebula') {
     camera.lookAt(targetPosition); // Immediately orient camera toward target
     controls.update(); // Apply the change
     if (DEBUG.enabled) console.log(` [${userData.type}] Pre-animation: Camera oriented to look at target`);
 }
 
 // Snapshot desired follow-mode; disable tracking during fly-in so updateCameraTracking
 // doesn't fight the lerp animation (re-enabled on completion).
 const _desiredFollowMode = this.cameraFollowMode;
 const _desiredCoRotateMode = this.cameraCoRotateMode;
 this.cameraFollowMode = false;
 this.cameraCoRotateMode = false;

 // For moving objects: capture the camera-end offset once so we can update endPos every
 // frame as the object moves, preventing a stale landing position.
 const isStaticTarget = (userData.type === 'constellation' || userData.type === 'galaxy' || userData.type === 'nebula' || userData.type === 'milkyWay');
 const endOffset = isStaticTarget ? null : new THREE.Vector3().copy(endPos).sub(targetPosition);

 if (requiresSolarAnchorTransit) {
 const isLeaving = userData.type === 'milkyWay';
 const anchorDirection = new THREE.Vector3();
 if (isLeaving) {
 anchorDirection.copy(endPos);
 } else {
 anchorDirection.copy(startPos);
 }
 if (anchorDirection.lengthSq() < 1e-6) {
 anchorDirection.set(0, 1, 0);
 }
 anchorDirection.normalize();
 // Position anchor close to solar system so zoom starts near the sun
 solarAnchorCameraPos.copy(anchorDirection).multiplyScalar(1200);
 }

 // A swooping fly-to across the Solar System is exactly the kind of large-field
 // optical flow that triggers vestibular discomfort, so cut straight to the target
 // when the user has asked the OS for reduced motion. 1ms rather than 0 keeps the
 // progress calculation (elapsed / duration) away from 0/0 = NaN on the first frame.
 const duration = prefersReducedMotion() ? 1 : (isFastOrbiter ? 1000 : 1500); // Faster transition for fast orbiters
 const startTime = performance.now();

 const finalizeFocusTransition = () => {
 if (this._focusTransitionToken !== transitionToken) return;
 this._focusTransitionActive = false;
 this._focusTransitionCancelRequested = false;
 // Transition complete — restore the desired follow/co-rotate modes now that
 // updateCameraTracking can take over cleanly from a well-placed camera.
 this.cameraFollowMode = _desiredFollowMode;
 this.cameraCoRotateMode = _desiredCoRotateMode;
 this._cameraFollowObject = object;
 object.getWorldPosition(this._cameraFollowLastTargetPos);
 if (DEBUG.enabled) console.log(` Camera follow mode RESTORED: follow=${_desiredFollowMode}, coRotate=${_desiredCoRotateMode} for ${object.userData.name}`);

 // Do NOT enable autoRotate — the camera must maintain its relative position
 // to the focused object after the fly-in. User zoom/pan/tilt sets a deliberate
 // viewing angle that should be preserved until the user changes it again.
 controls.autoRotate = false;

 // Disable OrbitControls damping for the duration of follow-mode tracking.
 // With damping enabled, every user interaction (scroll, drag) accumulates
 // sphericalDelta that decays over ~100 frames. At high time speeds those
 // frames represent large ISS movement, making residual rotation very visible.
 // With damping disabled, sphericalDelta is applied fully in one frame and
 // immediately reset to zero — no drift at any speed. Damping is re-enabled
 // at the next focusOnObject() call (fly-in).
 controls.enableDamping = !_desiredFollowMode;
 };
 
 const animate = () => {
 if (this._focusTransitionToken !== transitionToken) return;

 // If user interacts (zoom/rotate/pan) during fly-to, immediately re-anchor
 // the current camera offset to the object's latest world position and hand
 // control to steady follow tracking. This prevents zoom detach.
 if (this._focusTransitionCancelRequested) {
 if (userData.type === 'milkyWay') {
 targetPosition.set(0, 0, 0);
 } else {
 object.getWorldPosition(targetPosition);
 }
 const userOffset = this._trackOffset.copy(camera.position).sub(controls.target);
 controls.target.copy(targetPosition);
 camera.position.copy(targetPosition).add(userOffset);
 finalizeFocusTransition();
 return;
 }

 const elapsed = performance.now() - startTime;
 const progress = Math.min(elapsed / duration, 1);
 const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
 
 // Update target position differently based on object type
 if (isStaticTarget) {
 // Static targets keep their precomputed targetPosition for the full animation.
 // For Milky Way this must remain at the solar-system anchor (world origin).
 } else if (useRelativeOffset) {
 // For fast orbiters during transition: maintain relative offset from parent
 targetPosition.copy(parentPlanet.position).add(relativeOffset);
 endPos.set(
 targetPosition.x,
 targetPosition.y + distance * 0.3,
 targetPosition.z + distance
 );
 } else {
 // For all moving objects incl. final frame: use fresh world position.
 // CRITICAL: must also run at progress===1 (the last frame) so that the
 // camera lands on the object's CURRENT position, not one frame stale.
 // For fast small moons (Enceladus speed=1.5, orbit=22) one stale frame
 // = 0.53 units of error, larger than the total camera-offset of 0.48,
 // which points the camera 45° away from the moon after landing.
 object.getWorldPosition(targetPosition);
 if (endOffset) endPos.copy(targetPosition).add(endOffset);
 }
 
 if (requiresSolarAnchorTransit) {
 // Use the global 'eased' value (0 to 1) to ensure continuous apparent speed
 // without stopping at the anchor point.
 const t = eased;
 let segmentT;

 if (t < 0.5) {
 segmentT = t * 2;
 camera.position.lerpVectors(startPos, solarAnchorCameraPos, segmentT);
 controls.target.lerpVectors(startTarget, solarAnchorTarget, segmentT);
 } else {
 segmentT = (t - 0.5) * 2;
 camera.position.lerpVectors(solarAnchorCameraPos, endPos, segmentT);
 controls.target.lerpVectors(solarAnchorTarget, targetPosition, segmentT);
 }
 } else {
 camera.position.lerpVectors(startPos, endPos, eased);

 // Smoothly interpolate controls target from start to current target position
 controls.target.lerpVectors(startTarget, targetPosition, eased);
 }
 
 // For constellations and distant objects, ensure camera orientation is maintained
 if (userData.type === 'constellation' || userData.type === 'galaxy' || userData.type === 'nebula') {
 camera.lookAt(targetPosition); // Force camera to look at target during animation
 }
 
 controls.update();
 
 if (progress < 1) {
 requestAnimationFrame(animate);
 } else {
 finalizeFocusTransition();
 }
 };
 
 animate();
 }

 onControlsInteractionStart() {
 if (this._focusTransitionActive) {
 this._focusTransitionCancelRequested = true;
 }
 // User grabbed manual control — stop auto-orbit so camera doesn't fight the drag.
 // cameraFollowMode stays true so the target keeps tracking the focused object.
 if (this._activeControls) {
 this._activeControls.autoRotate = false;
 }
 }

 // Called when the user zooms via scroll wheel (distinct from drag/pan).
 onControlsZoom() {
 if (this._focusTransitionActive) {
 this._focusTransitionCancelRequested = true;
 }
 // Stop any auto-orbit so the zoomed viewing angle is preserved.
 if (this._activeControls) {
 this._activeControls.autoRotate = false;
 }
 if (this._activeControls && this.focusedObject) {
 // Update tracked distance so co-rotation frame is consistent
 this.focusedObjectDistance = this._activeControls.object.position.distanceTo(
 this._activeControls.target
 );
 }
 }
 
 updateCameraTracking(camera, controls) {
 // TRACKING INDICATOR REMOVED - it was distracting

 // Defensive: if a planet is focused, always keep follow enabled so zooming
 // and other controls interactions cannot accidentally detach tracking.
 if (this.focusedObject) {
 const focusedData = this.focusedObject.userData || {};
 const focusedIsPlanet = focusedData.type === 'planet' || focusedData.isPlanet;
 if (focusedIsPlanet && !this.cameraFollowMode) {
 this.cameraFollowMode = true;
 this.cameraCoRotateMode = false;
 }
 }
 
 // Exit if no focused object or tracking disabled
 if (!this.focusedObject || !this.cameraFollowMode) {
 this._cameraFollowObject = null;
 return;
 }
 
 const object = this.focusedObject;
 const userData = object.userData;
 const targetPosition = this._trackTargetPos;
 object.getWorldPosition(targetPosition);
 
 if (this.cameraCoRotateMode && (userData.orbitPlanet || userData.parentPlanet)) {
 // CO-ROTATION MODE: Camera orbits WITH objects that orbit a parent planet
 // (spacecraft, satellites, moons) while preserving user zoom and pan input.
 
 const parentKey = (userData.orbitPlanet || userData.parentPlanet || '').toLowerCase();
 const parentPlanet = this.planets[parentKey];
 if (parentPlanet) {
 // Keep user zoom changes while in co-rotation by sampling current camera radius.
 // This prevents snap-back to a stale chase-cam distance after wheel/touch zoom.
 const currentZoomDistance = camera.position.distanceTo(controls.target);
 if (isFinite(currentZoomDistance) && currentZoomDistance > 0.05) {
 this.focusedObjectDistance = currentZoomDistance;
 }
 const offsetDistance = this.focusedObjectDistance || 3;

 // Initialize last known target position if tracking just started
 if (this._cameraFollowObject !== object) {
 this._cameraFollowLastTargetPos.copy(targetPosition);
 }

 // Preserve user panning as an offset from the tracked object so pan input doesn't
 // get overwritten when controls.target is re-anchored each frame.
 // IMPORTANT: Calculate offset relative to the LAST KNOWN position to avoid absorbing movement!
 const panOffset = this._camCurrentTgt.copy(controls.target).sub(this._cameraFollowLastTargetPos);
 
 // Get vector from parent body to tracked object (radial direction)
 const radialDirection = this._camRadial.copy(targetPosition).sub(parentPlanet.position);
 const radialLength = radialDirection.length();
 if (radialLength < 1e-6) {
 // Fallback if object is extremely close to parent center; avoid NaNs.
 radialDirection.set(0, 1, 0);
 } else {
 radialDirection.multiplyScalar(1 / radialLength);
 }
 
 // Calculate tangent direction (perpendicular to radial, in orbital plane)
 const up = this._camUp.set(0, 1, 0);
 const tangentDirection = this._camTangent.crossVectors(up, radialDirection).normalize();
 
 // If orbit is inclined significantly, use actual orbital motion
 if (userData.orbitalVelocity) {
 tangentDirection.copy(userData.orbitalVelocity).normalize();
 }
 
 // Build a stable chase direction and keep camera distance EXACTLY at offsetDistance
 // so wheel zoom remains responsive and predictable.
 const chaseDirection = this._camChaseDir
 .copy(tangentDirection)
 .multiplyScalar(-0.8)
 .addScaledVector(radialDirection, 0.3);
 chaseDirection.y += 0.5;
 if (chaseDirection.lengthSq() < 1e-9) {
 chaseDirection.set(0, 0.4, 1);
 }
 chaseDirection.normalize();

 // Stable chase-cam: keep exact distance from target object.
 const cameraPosition = this._camPos.copy(targetPosition);
 cameraPosition.addScaledVector(chaseDirection, offsetDistance);

 // Apply user pan offset in world space.
 cameraPosition.add(panOffset);
 
 camera.position.copy(cameraPosition);
 
 // Keep looking at the ISS plus user pan offset.
 controls.target.copy(targetPosition).add(panOffset);
 this._cameraFollowObject = object;
 this._cameraFollowLastTargetPos.copy(targetPosition);
 // No controls.update() here; SceneManager.animate() calls it once per frame.
 } else {
 // Fallback if parent lookup fails: keep standard target tracking instead of freezing.
 controls.target.copy(targetPosition);
 this._cameraFollowObject = object;
 this._cameraFollowLastTargetPos.copy(targetPosition);
 }
 } else {
 // TRADITIONAL TRACKING MODE: Move both camera.position and controls.target by
 // the same delta as the object moved since the previous frame.
 // This locks the camera's relative position to the tracked object — fixing the
 // drift bug where the camera stayed fixed in world space while the planet/moon
 // orbited away from it.
 // Moving BOTH by the same delta preserves OrbitControls' internal spherical
 // state (zoom distance, tilt, azimuth) AND any user pan offset unchanged.

 // Guard: initialize last-known position on the very first tracking frame
 // (also triggered when focus switches to a different object).
 if (this._cameraFollowObject !== object) {
 this._cameraFollowLastTargetPos.copy(targetPosition);
 }

 // How much did the object move since the last frame?
 const delta = this._trackOffset.copy(targetPosition).sub(this._cameraFollowLastTargetPos);

 // Apply the same translation to both camera and target so relative position
 // (zoom distance, viewing angle, pan offset) is fully preserved.
 camera.position.add(delta);
 controls.target.add(delta);

 this._cameraFollowObject = object;
 this._cameraFollowLastTargetPos.copy(targetPosition);
 // No controls.update() here; SceneManager.animate() calls it after this callback.
 }
 }

 createLabels() {
 // Create CSS2D labels for all major objects
 this.labels = [];
 
 // Helper function to create a sprite label (works in both desktop and VR/WebXR)
 const createLabel = (object, text) => {
 if (!object || !object.userData) return;
 
 const labelText = text || object.userData.name || '';
 
 // Render text onto a canvas → CanvasTexture → SpriteMaterial
 // Sprites are rendered by the main WebGL renderer, so they appear in VR headsets
 const canvas = document.createElement('canvas');
 canvas.width = 512;
 canvas.height = 64;
 const ctx = canvas.getContext('2d');
 
 ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
 ctx.beginPath();
 if (ctx.roundRect) ctx.roundRect(2, 2, 508, 60, 7);
 else ctx.rect(2, 2, 508, 60);
 ctx.fill();
 
 ctx.fillStyle = 'white';
 ctx.font = 'bold 26px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(labelText, 256, 32);
 
 const texture = new THREE.CanvasTexture(canvas);
 // GPU copy is taken — shrink the canvas backing to 1×1 to free the pixel buffer (150+ labels × 128KB each)
 canvas.width = 1; canvas.height = 1;
 const material = new THREE.SpriteMaterial({
 map: texture,
 transparent: true,
 depthTest: false,
 sizeAttenuation: true
 });
 const sprite = new THREE.Sprite(material);
 
 // Scale in world units — clamp so Sun labels aren't enormous and craft labels aren't invisible
 const r = object.userData.radius || 0.5;
 const isDistantObject = object.userData.type === 'constellation' || 
 object.userData.type === 'galaxy' || object.userData.type === 'nebula';
 let h;
 if (isDistantObject) {
 // Constellations/galaxies/nebulae are at ~10,000 units — need much larger labels
 h = Math.min(Math.max(r * 0.3, 50), 200);
 } else {
 h = Math.min(Math.max(r * 0.6, 0.3), 6);
 }
 sprite.scale.set(h * 4.5, h, 1);
 sprite.position.set(0, r * 1.5 + h * 0.5, 0);
 sprite.visible = false;
 sprite.renderOrder = 999; // Always draw on top
 
 object.add(sprite);
 object.userData.label = sprite;
 this.labels.push(sprite);
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
 
 // Add labels to nebulae
 if (this.nebulae) {
 this.nebulae.forEach(nebula => {
 createLabel(nebula, ` ${nebula.userData.name}`);
 });
 }
 
 // Constellations: labels NOT created here — shown only on hover or when focused
 // (constellation labels at 10,000 units distance would clutter the view)
 }

 toggleLabels(visible) {
 if (DEBUG.enabled) console.log(` toggleLabels called with visible=${visible}, labels.length=${this.labels?.length || 0}`);
 
 if (!this.labels || this.labels.length === 0) {
 if (DEBUG && DEBUG.enabled) console.warn(' No labels to toggle - labels array is empty or undefined');
 if (DEBUG.enabled) console.log(' this.labels:', this.labels);
 return;
 }
 
 // Use the passed visibility state, or toggle based on first label's current state
 const newVisibility = visible !== undefined ? visible : !this.labels[0].visible;
 this.labelsVisible = newVisibility; // keep flag in sync for distance-culling loop
 
 this.labels.forEach((label, index) => {
 label.visible = newVisibility;
 if (index < 3 && DEBUG.enabled) {
 // Sprites don't have .element — access name via the parent object's userData
 const name = label.parent?.userData?.name || 'unknown';
 console.log(` Label ${index}: ${name} -> visible=${newVisibility}`);
 }
 });
 
 if (DEBUG.enabled) console.log(` Labels now: ${newVisibility ? 'VISIBLE ' : 'HIDDEN '} (${this.labels.length} labels toggled)`);
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
}

// ---- prototype mixins ----
// Method groups live in ./solar-system/* to keep this coordinator readable.
Object.assign(SolarSystemModule.prototype, textureGenerator);
Object.assign(SolarSystemModule.prototype, cometsSpacecraft);
Object.assign(SolarSystemModule.prototype, deepSpace);
Object.assign(SolarSystemModule.prototype, orbitalMechanics);
Object.assign(SolarSystemModule.prototype, celestialFactory);
