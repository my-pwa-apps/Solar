// ===========================
// SOLAR SYSTEM MODULE
// ===========================
import * as THREE from 'three';
// CSS2DObject removed — labels use THREE.Sprite (CanvasTexture) so they render in VR
import { TEXTURE_CACHE } from './TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from './utils.js';

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
 // M0: mean anomaly at J2000 epoch (degrees); n: mean motion (degrees/day).
 // Source: Standish et al. 1992 / JPL approximate solar system ephemeris.
 this.PLANET_ELEMENTS_J2000 = {
 mercury: { M0: 174.7943, n: 4.09233445 },
 venus: { M0: 50.4161, n: 1.60213034 },
 earth: { M0: 357.5291, n: 0.98560028 },
 mars: { M0: 19.3451, n: 0.52402068 },
 jupiter: { M0: 19.5976, n: 0.08308530 },
 saturn: { M0: 317.6459, n: 0.03344428 },
 uranus: { M0: 141.6220, n: 0.01172584 },
 neptune: { M0: 257.6634, n: 0.00598103 },
 pluto: { M0: 14.8740, n: 0.003975 },
 ceres: { M0: 95.9891, n: 0.21408 },
 haumea: { M0: 198.0, n: 0.00347 },
 makemake: { M0: 37.0, n: 0.00318 },
 eris: { M0: 208.0, n: 0.00176 },
 orcus: { M0: 112.0, n: 0.00398 },
 quaoar: { M0: 147.0, n: 0.00346 },
 gonggong: { M0: 207.0, n: 0.00177 },
 sedna: { M0: 358.0, n: 0.0000861 },
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

 createSun(scene) {
 // HYPERREALISTIC Sun with realistic size
 // Sun: 1,391,000 km / 12,742 km = 109.2 (should be MASSIVE)
 // But we'll scale it down to 15 for visibility while still being impressive
 const sunRadius = 15; // Compromise between realism and usability
 const sunGeometry = new THREE.SphereGeometry(sunRadius, CONFIG.QUALITY.sphereSegments, CONFIG.QUALITY.sphereSegments); // Quality-adaptive detail
 
 // Load real NASA Sun texture (with procedural fallback)
 const sunTexture = this.createSunTextureReal(CONFIG.QUALITY.textureSize);
 
 // MeshBasicMaterial — the sun is self-luminous; it doesn't react to scene lights
 const sunMaterial = new THREE.MeshBasicMaterial({
 map: sunTexture,
 toneMapped: false
 });
 
 this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.userData = {
            id: 'sun',
            name: 'sun',
            type: 'star',
            distance: 0,
            radius: sunRadius,
            description: t('descSun'),
            funFact: t('funFactSun'),
            realSize: '1,391,000 km diameter'
        };
        
        // Sun lighting - PointLight from center with NO DECAY for realistic solar system lighting
 // In space, light doesn't decay with distance (inverse square law applies but over HUGE distances)
 // BALANCED: Reduced intensity to prevent washing out textures on sunny side
 const sunLight = new THREE.PointLight(0xFFFAE8, 9, 0, 0); // Warm white, reduced intensity (10→9)
 sunLight.name = 'sunLight';
 sunLight.position.set(0, 0, 0);
 sunLight.castShadow = CONFIG.QUALITY.shadows;
 sunLight.shadow.mapSize.width = CONFIG.QUALITY.shadowMapSize;
 sunLight.shadow.mapSize.height = CONFIG.QUALITY.shadowMapSize;
 sunLight.shadow.camera.near = 1;
 sunLight.shadow.camera.far = 5000; // Increased for distant planets
 sunLight.shadow.bias = -0.0005; // Reduce shadow artifacts
 sunLight.shadow.radius = 3; // Softer shadows (PCFSoftShadowMap benefits from higher radius)
 scene.add(sunLight);
 this.sun.userData.sunLight = sunLight;
 
 // Ambient light - very faint fill for starlight/earthshine reflection
 // Keep LOW for realistic day/night contrast on planets
 const ambientLight = new THREE.AmbientLight(0x202030, 0.08); // Minimal starlight ambient
 ambientLight.name = 'ambientLight';
 scene.add(ambientLight);

 if (DEBUG && DEBUG.enabled) {
 console.log(' Lighting: Sun 9 (warm white), Ambient 0.4, Tone mapping 1.2');
 }
 
 // Multi-layer corona for realistic glow — inner bright core fading to a wispy outer halo.
 // Outer layers are kept warm (yellow-orange) at very low opacity to avoid hard red ring
 // artifacts, which occur because the sun sphere occludes each BackSide layer's centre.
 const coronaLayers = [
 { size: 11.5, color: 0xffdd88, opacity: 0.25 },
 { size: 13,   color: 0xffaa44, opacity: 0.18 },
 { size: 15,   color: 0xff8822, opacity: 0.12 },
 { size: 20,   color: 0xff9944, opacity: 0.018 } // very subtle warm outer halo
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
 this.pickableObjects.push(this.sun);
 }

 async createInnerPlanets(scene) {
 // REALISTIC SIZES (Earth radius = 1.0 as base)
 // Mercury: 4,879 km / 12,742 km = 0.383
 if (this.uiManager) this.uiManager.updateLoadingProgress(7, t('creatingMercury'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
 this.planets.mercury = this.createPlanet(scene, {
 id: 'mercury',
 name: t('mercury'),
 radius: 0.383,
 color: 0x8C7853,
 distance: 20,
 speed: 0.04,
            rotationSpeed: 0.004,
            tilt: 0.034,
            description: t('descMercury'),
            funFact: t('funFactMercury'),
            realSize: '4,879 km diameter',
            moons: 0
        }); // Venus: 12,104 km / 12,742 km = 0.950
 if (this.uiManager) this.uiManager.updateLoadingProgress(14, t('creatingVenus'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.venus = this.createPlanet(scene, {
            id: 'venus',
            name: t('venus'),
            radius: 0.950,
            color: 0xFFC649,
            distance: 37, // Educational scale (1.85x Mercury)
            speed: 0.015,
            rotationSpeed: -0.001,
            tilt: 177.4, // ASTRONOMICAL_DATA.venus.axialTilt (retrograde, nearly inverted)
            description: t('descVenus'),
            funFact: t('funFactVenus'),
            realSize: '12,104 km diameter',
            moons: 0,
            emissive: 0xFFC649,
            emissiveIntensity: 0.3
        }); // Earth: BASE = 1.0 (12,742 km) - Most complex texture generation
 if (this.uiManager) this.uiManager.updateLoadingProgress(21, t('creatingEarth'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.earth = this.createPlanet(scene, {
            id: 'earth',
            name: t('earth'),
            radius: 1.0,
            color: 0x2233FF,
            distance: 51, // Educational scale (2.56x Mercury)
            speed: 0.01,
            rotationSpeed: 0.02,
            tilt: 23.44,
            description: t('descEarth'),
            funFact: t('funFactEarth'),
            realSize: '12,742 km diameter',
            moons: 1
        });        // Moon: 3,474 km / 12,742 km = 0.273
        // Real distance: 384,400 km / Earth radius (6,371 km) = ~60 Earth radii
        // Real orbital period: 27.32 days vs Earth's 365.25 days = 13.37x faster
        this.createMoon(this.planets.earth, {
            id: 'moon',
            name: t('moon'),
            radius: 0.273,
            color: 0xAAAAAA,
            distance: 4, // Increased from 3 for better visibility
            speed: 0.1337, // 13.37x Earth's speed (0.01 * 13.37) - completes ~13 orbits per Earth year
            rotationSpeed: 0.004, // Moon rotates (tidally locked)
            description: t('descMoon'),
            funFact: t('funFactMoon')
        }); // Mars: 6,779 km / 12,742 km = 0.532
 if (this.uiManager) this.uiManager.updateLoadingProgress(31, t('creatingMars'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.mars = this.createPlanet(scene, {
            id: 'mars',
            name: t('mars'),
            radius: 0.532,
            color: 0xCD5C5C,
            distance: 78, // Educational scale (3.90x Mercury)
            speed: 0.008,
            rotationSpeed: 0.018,
            tilt: 25.19,
            description: t('descMars'),
            funFact: t('funFactMars'),
            realSize: '6,779 km diameter',
            moons: 2
        });        // Phobos: ~22 km / 12,742 km = 0.0017 (tiny in reality, scaled up for visibility)
        // Orbital period: 0.319 days (7.65 hours) vs Mars's 687 days = 2153x faster
        this.createMoon(this.planets.mars, {
            id: 'phobos',
            name: t('phobos'),
            radius: 0.08, // Scaled up for visibility (was 0.002)
            color: 0x666666,
            distance: 1.5,
            speed: 3.0, // Reduced from 17.22 for visual stability - still noticeably fast
            description: t('descPhobos')
        });
        // Deimos: ~12 km / 12,742 km = 0.0009 (tiny in reality, scaled up for visibility)
        // Orbital period: 1.263 days (30.3 hours) vs Mars's 687 days = 544x faster
        this.createMoon(this.planets.mars, {
            id: 'deimos',
            name: t('deimos'),
            radius: 0.06, // Scaled up for visibility (was 0.0015)
            color: 0x888888,
            distance: 2.5,
            speed: 0.75, // Slower than Phobos (30.3h vs 7.65h orbit) — ratio ~4:1
            description: t('descDeimos')
        });
    } async createOuterPlanets(scene) {
 // Jupiter: 139,820 km / 12,742 km = 10.97 (MASSIVE!)
 if (this.uiManager) this.uiManager.updateLoadingProgress(40, t('creatingJupiter'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.jupiter = this.createPlanet(scene, {
            id: 'jupiter',
            name: t('jupiter'),
            radius: 10.97,
            color: 0xDAA520,
            distance: 266, // Educational scale (13.3x Mercury)
            speed: 0.002,
            rotationSpeed: 0.04,
            tilt: 3.13,
            description: t('descJupiter'),
            funFact: t('funFactJupiter'),
            realSize: '139,820 km diameter',
            moons: 4
        }); // Jupiter's Galilean moons (realistic sizes)
        // Io: 3,643 km / 12,742 km = 0.286
        // Orbital period: 1.769 days vs Jupiter's 4333 days = 2449x faster
        this.createMoon(this.planets.jupiter, {
            id: 'io',
            name: t('io'),
            radius: 0.286,
            color: 0xFFFF00,
            distance: 12, // Increased from 8 for better visibility
            speed: 4.898, // 2449x Jupiter's speed (0.002 * 2449)
            description: t('descIo')
        });
        // Europa: 3,122 km / 12,742 km = 0.245
        // Orbital period: 3.551 days vs Jupiter's 4333 days = 1220x faster
        this.createMoon(this.planets.jupiter, {
            id: 'europa',
            name: t('europa'),
            radius: 0.245,
            color: 0xCCBB99,
            distance: 15, // Increased from 10
            speed: 2.44, // 1220x Jupiter's speed (0.002 * 1220)
            description: t('descEuropa')
        });
        // Ganymede: 5,268 km / 12,742 km = 0.413 (larger than Mercury!)
        // Orbital period: 7.155 days vs Jupiter's 4333 days = 606x faster
        this.createMoon(this.planets.jupiter, {
            id: 'ganymede',
            name: t('ganymede'),
            radius: 0.413,
            color: 0x996633,
            distance: 19, // Increased from 12
            speed: 1.212, // 606x Jupiter's speed (0.002 * 606)
            description: t('descGanymede')
        });
        // Callisto: 4,821 km / 12,742 km = 0.378
        // Orbital period: 16.689 days vs Jupiter's 4333 days = 260x faster
        this.createMoon(this.planets.jupiter, {
            id: 'callisto',
            name: t('callisto'),
            radius: 0.378,
            color: 0x777777,
            distance: 23, // Increased from 14
            speed: 0.52, // 260x Jupiter's speed (0.002 * 260)
            description: t('descCallisto')
        }); // Saturn: 116,460 km / 12,742 km = 9.14 (almost as big as Jupiter!)
 if (this.uiManager) this.uiManager.updateLoadingProgress(48, t('creatingSaturn'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.saturn = this.createPlanet(scene, {
            id: 'saturn',
            name: t('saturn'),
            radius: 9.14,
            color: 0xFAD5A5,
            distance: 490, // Educational scale (24.5x Mercury)
            speed: 0.0009,
            rotationSpeed: 0.038,
            tilt: 26.73,
            description: t('descSaturn'),
            funFact: t('funFactSaturn'),
            realSize: '116,460 km diameter',
            moons: 3,
            rings: true,
            prominentRings: true
        });
        // Enceladus: 504 km / 12,742 km = 0.040
        // Orbital period: 1.370 days vs Saturn's 10759 days = 7854x faster
        // Note: Reduced speed for visual stability (was 7.07, too fast causing visual artifacts)
        // Real orbit: 238,020 km = 3.95x Saturn's radius (60,268 km) = 36.1 scene units
        // Rings end at outerR = radius * 2.2 = 20.11 scene units — Enceladus orbits OUTSIDE rings
        this.createMoon(this.planets.saturn, {
            id: 'enceladus',
            name: t('enceladus'),
            radius: 0.040,
            color: 0xFFFFFF,
            distance: 22, // Just outside rings (rings end at 20.11); real ratio: 3.95x Saturn radius
            speed: 1.5, // Reduced from 7.07 for smoother visual orbit
            description: t('descEnceladus')
        });
        // Rhea: 1,527 km / 12,742 km = 0.120
        // Orbital period: 4.518 days vs Saturn's 10759 days = 2382x faster
        // Real orbit: 527,108 km = 8.75x Saturn's radius = 79.9 scene units
        this.createMoon(this.planets.saturn, {
            id: 'rhea',
            name: t('rhea'),
            radius: 0.120,
            color: 0xCCCCCC,
            distance: 28, // Outside rings with clear separation from Enceladus
            speed: 2.144, // 2382x Saturn's speed (0.0009 * 2382)
            description: t('descRhea')
        });
        // Titan: 5,150 km / 12,742 km = 0.404 (bigger than Mercury!)
        // Orbital period: 15.945 days vs Saturn's 10759 days = 675x faster
        // Real orbit: 1,221,870 km = 20.3x Saturn's radius = 185 scene units
        this.createMoon(this.planets.saturn, {
            id: 'titan',
            name: t('titan'),
            radius: 0.404,
            color: 0xFFAA33,
            distance: 38, // Well outside rings; scaled for visual clarity
            speed: 0.608, // 675x Saturn's speed (0.0009 * 675)
            description: t('descTitan')
        }); // Uranus: 50,724 km / 12,742 km = 3.98
 if (this.uiManager) this.uiManager.updateLoadingProgress(54, t('creatingUranus'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.uranus = this.createPlanet(scene, {
            id: 'uranus',
            name: t('uranus'),
            radius: 3.98,
            color: 0x4FD0E7,
            distance: 984, // Educational scale (49.2x Mercury)
            speed: 0.0004,
            rotationSpeed: 0.03,
            tilt: 97.77,
            description: t('descUranus'),
            funFact: t('funFactUranus'),
            realSize: '50,724 km diameter',
            moons: 2,
            rings: true
        });        // Titania: 1,578 km / 12,742 km = 0.124
        // Orbital period: 8.706 days vs Uranus's 30687 days = 3526x faster
        this.createMoon(this.planets.uranus, {
            id: 'titania',
            name: t('titania'),
            radius: 0.124,
            color: 0xAAAAAA,
            distance: 8, // Increased from 5: Uranus radius is 3.98, need clear visual separation
            speed: 1.410, // 3526x Uranus's speed (0.0004 * 3526)
            description: t('descTitania')
        });
        // Miranda: 472 km / 12,742 km = 0.037
        // Orbital period: 1.413 days vs Uranus's 30687 days = 21722x faster
        this.createMoon(this.planets.uranus, {
            id: 'miranda',
            name: t('miranda'),
            radius: 0.037,
            color: 0x999999,
            distance: 6, // Fixed from 3.5: was INSIDE Uranus (radius 3.98)! Now clearly outside.
            speed: 2.0, // Reduced from 8.689 for visual stability
            description: t('descMiranda')
        }); // Neptune: 49,244 km / 12,742 km = 3.86
 if (this.uiManager) this.uiManager.updateLoadingProgress(58, t('creatingNeptune'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.neptune = this.createPlanet(scene, {
            id: 'neptune',
            name: t('neptune'),
            radius: 3.86,
            color: 0x4169E1,
            distance: 1542, // Educational scale (77.1x Mercury)
            speed: 0.0001,
            rotationSpeed: 0.032,
            tilt: 28.32,
            description: t('descNeptune'),
            funFact: t('funFactNeptune'),
            realSize: '49,244 km diameter',
            moons: 1,
            rings: true
        });        // Triton: 2,707 km / 12,742 km = 0.212
        // Orbital period: 5.877 days (retrograde) vs Neptune's 60190 days = 10242x faster
        this.createMoon(this.planets.neptune, {
            id: 'triton',
            name: t('triton'),
            radius: 0.212,
            color: 0xFFCCCC,
            distance: 5,
            speed: -1.024, // -10242x Neptune's speed (negative for retrograde orbit)
            description: t('descTriton')
        }); // Pluto: 2,377 km / 12,742 km = 0.187
 this.planets.pluto = this.createPlanet(scene, {
 id: 'pluto',
 name: t('pluto'),
 radius: 0.187,
 color: 0xD4A373,
 distance: 2024, // Educational scale (101.2x Mercury)
 speed: 0.00004,
 rotationSpeed: 0.015,
 tilt: 122.53,
 description: t('descPluto'),
 funFact: t('funFactPluto'),
 realSize: '2,377 km diameter',
        moons: 1,
            dwarf: true
        });

        // Charon: 1,212 km / 12,742 km = 0.095 (half the size of Pluto!)
        // Orbital period: 6.387 days vs Pluto's 90560 days = 14178x faster
        this.createMoon(this.planets.pluto, {
            id: 'charon',
            name: t('charon'),
            radius: 0.095,
            color: 0xAAAAAA,
            distance: 1.2,
            speed: 0.567, // 14178x Pluto's speed (0.00004 * 14178)
            description: t('descCharon')
        });
    }

    async createDwarfPlanets(scene) {
        // Pluto already created; add others with texture loaders where available
        // Radii calculated as: diameter_km / 12742 (Earth's diameter in km)
        const catalog = [
            { name: 'Ceres', radius: 0.074, color: 0xC8C8B4, distance: 140, speed: 0.02, rotationSpeed: 0.02, tilt: 4, description: t('descCeres'), funFact: 'May host subsurface brines.', realSize: '939 km diameter', hasRemote: true },
            { name: 'Haumea', radius: 0.125, color: 0xE0D6C8, distance: 2139, speed: 0.00005, rotationSpeed: 0.08, tilt: 28, description: t('descHaumea'), funFact: 'Rotation period ~4 hours gives its triaxial ellipsoid shape.', realSize: '2322 × 1704 × 1026 km (triaxial diameters)' },
            { name: 'Makemake', radius: 0.112, color: 0xD4B48C, distance: 2279, speed: 0.000047, rotationSpeed: 0.01, tilt: 29, description: t('descMakemake'), funFact: 'Discovered near Easter, named after Rapa Nui deity.', realSize: '1430 km diameter' },
            { name: 'Eris', radius: 0.183, color: 0xD8D8D8, distance: 2483, speed: 0.00004, rotationSpeed: 0.01, tilt: 78, description: t('descEris'), funFact: 'Helped prompt Pluto reclassification.', realSize: '2326 km diameter' },
            { name: 'Orcus', radius: 0.071, color: 0xB0B0C0, distance: 2024, speed: 0.000052, rotationSpeed: 0.01, tilt: 20, description: t('descOrcus'), funFact: t('funFactOrcus'), realSize: '~910 km est.' },
            { name: 'Quaoar', radius: 0.087, color: 0xC8A088, distance: 2189, speed: 0.000051, rotationSpeed: 0.012, tilt: 15, description: t('descQuaoar'), funFact: t('funFactQuaoar'), realSize: '1110 km diameter' },
            { name: 'Gonggong', radius: 0.097, color: 0xBB7766, distance: 3457, speed: 0.000039, rotationSpeed: 0.008, tilt: 30, description: t('descGonggong'), funFact: t('funFactGonggong'), realSize: '~1230 km est.' },
            { name: 'Sedna', radius: 0.078, color: 0xCC6644, distance: 4500, speed: 0.000003, rotationSpeed: 0.006, tilt: 12, description: t('descSedna'), funFact: 'Takes ~11,400 years to orbit! Its reddish color rivals Mars.', realSize: '~995 km diameter' },
            { name: 'Salacia', radius: 0.067, color: 0x996655, distance: 2234, speed: 0.000048, rotationSpeed: 0.01, tilt: 18, description: t('descSalacia'), funFact: t('funFactSalacia'), realSize: '~850 km est.' },
            { name: 'Varda', radius: 0.057, color: 0xAA8866, distance: 2328, speed: 0.000046, rotationSpeed: 0.01, tilt: 10, description: t('descVarda'), funFact: t('funFactVarda'), realSize: '~720 km est.' },
            { name: 'Varuna', radius: 0.052, color: 0xAA7755, distance: 2139, speed: 0.000053, rotationSpeed: 0.04, tilt: 22, description: t('descVaruna'), funFact: t('funFactVaruna'), realSize: '~668 km est.' }
        ];

        catalog.forEach(cfg => {
            const key = cfg.name.toLowerCase();
            if (this.planets[key]) return;
            
            // Create planet and store in registry
            this.planets[key] = this.createPlanet(scene, {
                id: key,
                name: cfg.name,
                radius: cfg.radius,
                color: cfg.color,
                distance: cfg.distance,
                speed: cfg.speed,
                rotationSpeed: cfg.rotationSpeed,
                tilt: cfg.tilt,
                description: cfg.description,
                funFact: cfg.funFact,
                realSize: cfg.realSize,
                moons: 0,
                dwarf: true
            });
        });
    }

    createProceduralTexture(type, size = 512) {
 // Use reusable utilities from TextureGeneratorUtils
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 const noise = TextureGeneratorUtils.noise;
 const fbm = TextureGeneratorUtils.fbm;
 
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
 // Create wispy cloud patterns using reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Wispy cloud pattern using reusable FBM
 const cloud = TextureGeneratorUtils.fbm(nx * 6, ny * 6, 6);
 const cloudIntensity = Math.max(0, (cloud - 0.4) * 2);
 
 // White clouds
 const brightness = 255;
 data[idx] = brightness;
 data[idx + 1] = brightness;
 data[idx + 2] = brightness;
 data[idx + 3] = cloudIntensity * 255; // Alpha channel for transparency
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 // ===== HYPERREALISTIC TEXTURE GENERATORS =====
 
 createSunTextureReal(size) {
 // Request sun.webp - use a transparent tiny texture if it fails
 const primary = [
 './textures/planets/sun.webp'
 ];
 return this.loadPlanetTextureReal('Sun', primary, () => {
 const canvas = document.createElement('canvas');
 canvas.width = 2;
 canvas.height = 2;
 const ctx = canvas.getContext('2d');
 ctx.fillStyle = '#FFAE14';
 ctx.fillRect(0, 0, 2, 2);
 const texture = new THREE.CanvasTexture(canvas);
 return texture;
 }, size, []);
 }

 // Advanced texture loader: attempts high-res sources, then plugin repo sources, then procedural generation.
 // Returns a placeholder texture immediately; replaces with remote if successful; generates procedural only if all remote fail.
 loadPlanetTextureReal(planetName, primaryTextureURLs, proceduralFunction, size = 2048, pluginRepoURLs = []) {
    const planetKey = planetName.toLowerCase();
    if (!this._pendingTextureMeta) this._pendingTextureMeta = {};
    this._pendingTextureMeta[planetKey] = {
        attempted: true,
        primarySources: [...primaryTextureURLs],
        pluginSources: [...pluginRepoURLs],
        success: false,
        finalURL: null,
        phase: 'init',
        startedAt: performance.now(),
        proceduralGenerated: false,
        timeouts: 0,
        errors: []
    };

    // Create a tiny placeholder texture (mid-gray) so material has something immediately.
    const placeholderCanvas = document.createElement('canvas');
    placeholderCanvas.width = 2; placeholderCanvas.height = 2;
    const pctx = placeholderCanvas.getContext('2d');
    pctx.fillStyle = '#7f7f7f';
    pctx.fillRect(0,0,2,2);
    const placeholderTexture = new THREE.CanvasTexture(placeholderCanvas);
    placeholderTexture.needsUpdate = true;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    let phase = 'primary';
    let primaryIndex = 0;
    let pluginIndex = 0;
    let currentTimeout = null;
    let retryCount = 0;
    const MAX_RETRIES = 1;
    const LOAD_TIMEOUT = IS_MOBILE ? 15000 : 10000;
    
    const tryNext = async () => {
        const meta = this._pendingTextureMeta[planetKey];
        
        // Clear any existing timeout
        if (currentTimeout) {
            clearTimeout(currentTimeout);
            currentTimeout = null;
        }
        if (phase === 'primary') {
            if (primaryIndex < primaryTextureURLs.length) {
                const url = primaryTextureURLs[primaryIndex];
                
                meta.phase = 'primary';
                
                if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName}: loading from SW cache / network: ${url}`);
                // Timeout per texture load attempt (longer on mobile)
                let loadTimedOut = false;
                currentTimeout = setTimeout(() => {
                    loadTimedOut = true;
                    meta.timeouts++;
                    console.warn(`[TEX] ${planetName}: TIMEOUT after ${LOAD_TIMEOUT/1000}s: ${url}`);
                    meta.errors.push({ url, error: `Timeout after ${LOAD_TIMEOUT/1000}s`, phase: 'primary' });
                    primaryIndex++;
                    tryNext();
                }, LOAD_TIMEOUT);
                
                loader.load(
                    url, 
                    (tex) => {
                        if (!loadTimedOut) {
                            clearTimeout(currentTimeout);
                            currentTimeout = null;
                            if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName}: network load SUCCESS: ${url}`);
                            this._onPlanetTextureSuccess(planetName, tex, url, 'primary');
                        }
                    }, 
                    undefined, 
                    (error) => {
                        if (!loadTimedOut) {
                            clearTimeout(currentTimeout);
                            currentTimeout = null;
                            const errorMsg = error?.message || error?.type || 'Network or CORS issue';
                            console.warn(`[TEX] ${planetName}: network load FAILED: ${url} — ${errorMsg}`);
                            meta.errors.push({ url, error: errorMsg, phase: 'primary' });
                            primaryIndex++;
                            tryNext();
                        }
                    }
                );
                return;
            }
            // Move to plugin phase
            phase = 'plugin';
        }
        if (phase === 'plugin') {
            if (pluginIndex < pluginRepoURLs.length) {
                const url = pluginRepoURLs[pluginIndex];
                meta.phase = 'plugin';
                
                let loadTimedOut = false;
                currentTimeout = setTimeout(() => {
                    loadTimedOut = true;
                    meta.timeouts++;
                    if (DEBUG && DEBUG.TEXTURES) console.warn(`⚠️ ${planetName} plugin source ${pluginIndex + 1} timed out after ${LOAD_TIMEOUT/1000}s: ${url}`);
                    meta.errors.push({ url, error: `Timeout after ${LOAD_TIMEOUT/1000}s`, phase: 'plugin' });
                    pluginIndex++;
                    tryNext();
                }, LOAD_TIMEOUT);
                
                loader.load(
                    url, 
                    (tex) => {
                        if (!loadTimedOut) {
                            clearTimeout(currentTimeout);
                            currentTimeout = null;
                            this._onPlanetTextureSuccess(planetName, tex, url, 'plugin');
                        }
                    }, 
                    undefined, 
                    (error) => {
                        if (!loadTimedOut) {
                            clearTimeout(currentTimeout);
                            currentTimeout = null;
                            const errorMsg = error?.message || error?.type || 'Network or CORS issue';
                            if (DEBUG && DEBUG.TEXTURES) {
                                console.warn(`[TEX] ${planetName} plugin source ${pluginIndex + 1} failed: ${url}`);
                                console.warn(`   Error: ${errorMsg}`);
                            }
                            meta.errors.push({ url, error: errorMsg, phase: 'plugin' });
                            pluginIndex++;
                            tryNext();
                        }
                    }
                );
                return;
            }
            // All sources exhausted — retry once before falling to procedural
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                primaryIndex = 0;
                pluginIndex = 0;
                phase = 'primary';
                if (DEBUG && DEBUG.TEXTURES) console.log(`🔄 ${planetName} texture: retry ${retryCount}/${MAX_RETRIES}`);
                if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName}: retrying (${retryCount}/${MAX_RETRIES})`);
                // Brief delay before retry to let SW / network settle
                setTimeout(() => tryNext(), 1000);
                return;
            }
            phase = 'procedural';
        }
        if (phase === 'procedural') {
            console.warn(`[TEX] ${planetName}: ALL SOURCES FAILED → generating procedural. Errors:`, meta.errors);
            meta.phase = 'procedural';
            
            // Wrap procedural generation in try-catch for Quest safety
            try {
                const maybePromise = proceduralFunction.call(this, size);
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then((tex) => {
                        if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName} procedural texture generated successfully`);
                        this._applyProceduralPlanetTexture(planetName, tex);
                    }).catch((err) => {
                        if (DEBUG && DEBUG.enabled) console.error(`[TEX] ${planetName} procedural texture generation failed:`, err);
                        meta.errors.push({ error: err.message, phase: 'procedural' });
                        // Keep placeholder texture as last resort
                    });
                } else {
                    if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName} procedural texture generated successfully`);
                    this._applyProceduralPlanetTexture(planetName, maybePromise);
                }
            } catch (err) {
                if (DEBUG && DEBUG.enabled) console.error(`[TEX] ${planetName} procedural texture generation failed:`, err);
                meta.errors.push({ error: err.message, phase: 'procedural' });
                // Keep placeholder texture as last resort
            }
        }
    };

    // Kick off chain
    tryNext();
    return placeholderTexture; // caller receives placeholder; will be swapped later
 }

 _configureSphericalSurfaceTexture(tex, { colorSpace = null } = {}) {
    if (!tex) return tex;

    if (colorSpace) {
        tex.colorSpace = colorSpace;
    }

    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 16;

    const width = tex.image?.width || tex.source?.data?.width || 0;
    if (width > 1) {
        tex.offset.x = 0.5 / width;
    }

    tex.needsUpdate = true;
    return tex;
 }

 // Internal: apply successful remote texture
 _onPlanetTextureSuccess(planetName, tex, url, sourceType) {
    try {
        if (planetName.toLowerCase() === 'earth') {
            this._configureSphericalSurfaceTexture(tex, { colorSpace: THREE.SRGBColorSpace });
        } else {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 16;
            tex.needsUpdate = true;
        }
        
        // Cache the successfully loaded texture for future use (cache by planet name only)
        // NOTE: Planet textures are served from SW cache on every load — the IndexedDB
        // layer was removed because decoding a data URL via HTMLImageElement or createImageBitmap
        // produces subtly different GPU-uploaded values compared to THREE.TextureLoader loading
        // directly from the SW-cached file, causing lighting discrepancies on wide-gamut displays.
        
        // Find the object: check sun, planets, and moons
        const lowerName = planetName.toLowerCase();
        let planet;
        if (lowerName === 'sun') {
            planet = this.sun;
        } else if (this.planets[lowerName]) {
            planet = this.planets[lowerName];
        } else if (this.moons[lowerName]) {
            planet = this.moons[lowerName];
        }
        
        if (!planet) {
            if (DEBUG && DEBUG.enabled) console.warn(`[TEX] ${planetName} object not found when applying texture`);
            return;
        }
        
        if (!planet.material) {
            if (DEBUG && DEBUG.enabled) console.warn(`[TEX] ${planetName} has no material to apply texture to`);
            return;
        }
        
        planet.material.map = tex;
        // Note: Sun uses MeshBasicMaterial (inherently unlit/fullbright) — do NOT set
        // emissiveMap on it; MeshBasicMaterial has no emissiveMap uniform and Three.js
        // will crash in refreshUniformsCommon with "Cannot set properties of undefined".
        planet.material.needsUpdate = true;
        planet.userData.remoteTextureLoaded = true;
        planet.userData.remoteTextureURL = url;
        
        const meta = this._pendingTextureMeta?.[planetName.toLowerCase()];
        if (meta) {
            meta.success = true;
            meta.finalURL = url;
            meta.finishedAt = performance.now();
            meta.durationMs = meta.finishedAt - meta.startedAt;
            meta.remoteSourceType = sourceType;
            meta.phase = 'done';
        }
    } catch (err) {
        if (DEBUG && DEBUG.enabled) console.error(`[TEX] Error applying ${planetName} texture:`, err);
    }
 }

 // Internal: apply procedural texture after all remote failed
 _applyProceduralPlanetTexture(planetName, tex) {
    try {
        // Handle Sun specially (stored in this.sun, not this.planets)
        const planet = planetName.toLowerCase() === 'sun' ? this.sun : this.planets[planetName.toLowerCase()];
        
        if (!planet) {
            if (DEBUG && DEBUG.enabled) console.warn(`[TEX] ${planetName} object not found when applying procedural texture`);
            return;
        }
        
        if (!planet.material) {
            if (DEBUG && DEBUG.enabled) console.warn(`⚠️ ${planetName} has no material to apply procedural texture to`);
            return;
        }
        
        planet.material.map = tex;
        // Note: Sun uses MeshBasicMaterial (inherently unlit/fullbright) — do NOT set
        // emissiveMap on it; MeshBasicMaterial has no emissiveMap uniform and Three.js
        // will crash in refreshUniformsCommon with "Cannot set properties of undefined".
        planet.material.needsUpdate = true;
        
        const meta = this._pendingTextureMeta?.[planetName.toLowerCase()];
        if (meta) {
            meta.success = false;
            meta.finishedAt = performance.now();
            meta.durationMs = meta.finishedAt - meta.startedAt;
            meta.proceduralGenerated = true;
            meta.phase = 'proceduralApplied';
        }
    } catch (err) {
        if (DEBUG && DEBUG.enabled) console.error(`[TEX] Error applying ${planetName} procedural texture:`, err);
    }
 }
 
 // Mercury real texture loader
 createMercuryTextureReal(size) {
 const primary = [
 './textures/planets/mercury.webp'
 ];
 const pluginFallbacks = [];
 return this.loadPlanetTextureReal('Mercury', primary, this.createMercuryTexture, size, pluginFallbacks);
 }
 
 // Venus real texture loader
 createVenusTextureReal(size) {
 const primary = [
 './textures/planets/venus.webp'
 ];
 return this.loadPlanetTextureReal('Venus', primary, this.createVenusTexture, size, []);
 }
 
 // Earth real texture loader - Optimized with reliable fallback chain
 createEarthTextureRealFixed(size) {
 // Use local self-hosted textures.
 // NOTE: earth_atmos_2k is the atmosphere/cloud overlay — do NOT use it
 // as a color-map fallback; it would make Earth appear as an all-white cloud
 // ball. If the surface texture fails, fall through to the procedural generator.
 const primary = [
 './textures/planets/earth_1k.webp'
 ];
 // No external fallbacks - use procedural if local fails
 const pluginFallbacks = [];
 return this.loadPlanetTextureReal('Earth', primary, this.createEarthTexture, size, pluginFallbacks);
 }

 // Mars real texture loader
 createMarsTextureReal(size) {
 const primary = [
 './textures/planets/mars_1k.webp'
 ];
 return this.loadPlanetTextureReal('Mars', primary, this.createMarsTexture, size, []);
 }
 
 // Jupiter real texture loader
 createJupiterTextureReal(size) {
 const primary = [
 './textures/planets/jupiter.webp'
 ];
 return this.loadPlanetTextureReal('Jupiter', primary, this.createJupiterTexture, size, []);
 }
 
 // Saturn real texture loader
 createSaturnTextureReal(size) {
 const primary = [
 './textures/planets/saturn.webp'
 ];
 return this.loadPlanetTextureReal('Saturn', primary, this.createSaturnTexture, size, []);
 }
 
 // Uranus real texture loader
 createUranusTextureReal(size) {
 const primary = [
 './textures/planets/uranus.webp'
 ];
 return this.loadPlanetTextureReal('Uranus', primary, this.createUranusTexture, size, []);
 }
 
 // Neptune real texture loader
 createNeptuneTextureReal(size) {
 const primary = [
 './textures/planets/neptune.webp'
 ];
 return this.loadPlanetTextureReal('Neptune', primary, this.createNeptuneTexture, size, []);
 }
 
 // Moon real texture loader - NASA LRO (Lunar Reconnaissance Orbiter) photorealistic textures
 createMoonTextureReal(size) {
 const primary = [
 // Local self-hosted textures
 './textures/moons/moon_2k.webp',
 './textures/moons/moon_1k.webp',
 './textures/moons/moon_threejs_1k.webp'
 ];
 const pluginFallbacks = [];
 return this.loadPlanetTextureReal('Moon', primary, this.createMoonTexture, size, pluginFallbacks);
 }

 // Pluto texture loader - self-hosted texture
 createPlutoTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/pluto_2k.webp'
    ];
    return this.loadPlanetTextureReal('Pluto', primary, this.createPlutoTexture, size, []);
 }

 // Ceres texture loader - self-hosted texture (Dawn mission style cratered surface)
 createCeresTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/ceres_2k.webp'
    ];
    // Use Mercury-style cratered texture as fallback since Ceres is rocky and heavily cratered
    return this.loadPlanetTextureReal('Ceres', primary, this.createMercuryTexture, size, []);
 }

 // Io texture loader - Volcanic surface with sulfur deposits (NASA Voyager/Galileo)
 createIoTextureReal(size) {
    const primary = [
        './textures/moons/io_2k.webp'
    ];
    return this.loadPlanetTextureReal('Io', primary, this.createIoTexture, size, []);
 }

 // Europa texture loader - NASA Galileo/Juno icy surface with reddish cracks
 createEuropaTextureReal(size) {
    const primary = [
        './textures/moons/europa_2k.webp'
    ];
    return this.loadPlanetTextureReal('Europa', primary, this.createEuropaTexture, size, []);
 }

 // Ganymede texture loader - Largest moon in solar system (NASA Voyager/Galileo)
 createGanymedeTextureReal(size) {
    const primary = [
        './textures/moons/ganymede_2k.webp'
    ];
    return this.loadPlanetTextureReal('Ganymede', primary, this.createMoonTexture, size, []);
 }

 // Callisto texture loader - Ancient cratered surface (NASA Voyager/Galileo)
 createCallistoTextureReal(size) {
    const primary = [
        './textures/moons/callisto_2k.webp'
    ];
    return this.loadPlanetTextureReal('Callisto', primary, this.createMoonTexture, size, []);
 }

 // Titan texture loader - Saturn's largest moon with thick orange atmosphere (NASA Cassini)
 createTitanTextureReal(size) {
    const primary = [
        './textures/moons/titan_2k.webp'
    ];
    return this.loadPlanetTextureReal('Titan', primary, this.createTitanTexture, size, []);
 }

 // Enceladus texture loader - Saturn's icy geologically active moon (NASA Cassini)
 createEnceladusTextureReal(size) {
    const primary = [
        './textures/moons/enceladus_2k.webp'
    ];
    return this.loadPlanetTextureReal('Enceladus', primary, this.createMoonTexture, size, []);
 }

 // Rhea texture loader - Saturn's second-largest moon (NASA Cassini)
 createRheaTextureReal(size) {
    const primary = [
        './textures/moons/rhea_2k.webp'
    ];
    return this.loadPlanetTextureReal('Rhea', primary, this.createMoonTexture, size, []);
 }

// Phobos texture loader - Mars moon (NASA JPL PIA10368)
 createPhobosTextureReal(size) {
 const primary = [
 './textures/moons/phobos_2k.webp'
 ];
 return this.loadPlanetTextureReal('Phobos', primary, this.createPhobosTexture, size, []);
 }

 // Deimos texture loader - Mars moon (Wikimedia/NASA)
 createDeimosTextureReal(size) {
    const primary = [
        './textures/moons/deimos_2k.webp'
    ];
    return this.loadPlanetTextureReal('Deimos', primary, this.createDeimosTexture, size, []);
 }

 // Triton texture loader - Neptune's largest moon, retrograde orbit (NASA Voyager)
 createTritonTextureReal(size) {
    const primary = [
        './textures/moons/triton_2k.webp'
    ];
    return this.loadPlanetTextureReal('Triton', primary, this.createMoonTexture, size, []);
 }

 // Titania texture loader - Uranus's largest moon (NASA Voyager)
 createTitaniaTextureReal(size) {
    const primary = [
        './textures/moons/titania_2k.webp'
    ];
    return this.loadPlanetTextureReal('Titania', primary, this.createMoonTexture, size, []);
 }

 // Miranda texture loader - Uranus's smallest major moon with dramatic terrain (NASA Voyager)
 createMirandaTextureReal(size) {
    const primary = [
        './textures/moons/miranda_2k.webp'
    ];
    return this.loadPlanetTextureReal('Miranda', primary, this.createMoonTexture, size, []);
 }

 // Charon texture loader - Pluto's largest moon (NASA New Horizons)
 createCharonTextureReal(size) {
    const primary = [
        './textures/moons/charon_2k.webp'
    ];
    return this.loadPlanetTextureReal('Charon', primary, this.createMoonTexture, size, []);
 }

 // Haumea texture loader - Fast-spinning elongated dwarf planet (CC BY 4.0 Solar System Scope)
 createHaumeaTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/haumea_2k.webp'
    ];
    return this.loadPlanetTextureReal('Haumea', primary, this.createMoonTexture, size, []);
 }

 // Makemake texture loader - Bright Kuiper Belt dwarf planet (CC BY 4.0 Solar System Scope)
 createMakemakeTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/makemake_2k.webp'
    ];
    return this.loadPlanetTextureReal('Makemake', primary, this.createMoonTexture, size, []);
 }

 // Eris texture loader - Massive scattered disk dwarf planet (CC BY 4.0 Solar System Scope)
 createErisTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/eris_2k.webp'
    ];
    return this.loadPlanetTextureReal('Eris', primary, this.createMoonTexture, size, []);
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
 // Shift by 0.5 so u=0 aligns with the dateline (180°W),
 // matching the NASA equirectangular convention.
 const lonNorm = ((lon / (Math.PI * 2)) + 0.5) % 1.0; // 0 to 1, dateline at 0
 const latNorm01 = (lat + Math.PI / 2) / Math.PI; // 0 to 1
 
 // Americas (Western Hemisphere, lon ~0.25-0.45)
 const americas = Math.exp(-Math.pow((lonNorm - 0.35) * 6, 2)) * 
 (1 - Math.abs(latNorm01 - 0.5) * 1.5);
 
 // Eurasia-Africa (Eastern Hemisphere, lon ~0.5-0.9)
 const eurasia = Math.exp(-Math.pow((lonNorm - 0.5) * 4, 2)) * 
 (1 - Math.abs(latNorm01 - 0.55) * 1.2) * 1.2;
 const africa = Math.exp(-Math.pow((lonNorm - 0.65) * 8, 2)) * 
 Math.exp(-Math.pow((latNorm01 - 0.35) * 4, 2)) * 1.5;
 
 // Australia (lon ~1.05-1.15, wraps to ~0.05-0.15)
 const australia = Math.exp(-Math.pow((lonNorm - 0.1) * 12, 2)) * 
 Math.exp(-Math.pow((latNorm01 - 0.25) * 8, 2)) * 0.8;
 
 // Antarctica (bottom, all longitudes)
 const antarctica = Math.exp(-Math.pow((latNorm01 - 0.05) * 8, 2)) * 0.9;
 
 // Greenland (lon ~0.42-0.48, lat ~0.75-0.85)
 const greenland = Math.exp(-Math.pow((lonNorm - 0.47) * 20, 2)) * 
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

 // Cache the texture for future use
 const dataURL = canvas.toDataURL('image/png');
 TEXTURE_CACHE.set(cacheKey, dataURL).catch(() => {
 // Cache write failed - will regenerate next time
 });

 // Create texture BEFORE adding clouds
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 
 return texture;
 }
 
 createEarthBumpMap(size) {
 const cacheKey = `earth_bump_${size}`;
 const canvasCacheKey = `${cacheKey}_canvas`;
 
 // Check MEMORY cache for pre-generated canvas (synchronous, instant)
 if (TEXTURE_CACHE.cache.has(canvasCacheKey)) {
 const cachedCanvas = TEXTURE_CACHE.cache.get(canvasCacheKey);
 const texture = new THREE.CanvasTexture(cachedCanvas);
 texture.needsUpdate = true;
 if (DEBUG && DEBUG.TEXTURES) console.log(`✅ Earth bump map loaded from memory cache`);
 return texture;
 }
 
 // Generate texture (no cache hit)
 if (DEBUG && DEBUG.TEXTURES) console.log(`🎨 Generating Earth bump map (${size}x${size})...`);
 const startTime = performance.now();
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
 
 // Cache the canvas in memory for instant reuse (synchronous)
 TEXTURE_CACHE.cache.set(canvasCacheKey, canvas);
 
 // Also cache as data URL in IndexedDB for persistence (async, non-blocking)
 const dataURL = canvas.toDataURL('image/png');
 TEXTURE_CACHE.set(cacheKey, dataURL).catch((e) => { if (DEBUG && DEBUG.TEXTURES) console.warn('[TEX] Cache write failed:', e); });
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 if (DEBUG && DEBUG.TEXTURES) console.log(`⏱️ Earth bump map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
 return texture;
 }
 
    createEarthNormalMap(size) {
        const cacheKey = `earth_normal_${size}`;
        const canvasCacheKey = `${cacheKey}_canvas`;

        // Check MEMORY cache for pre-generated canvas (synchronous, instant)
        if (TEXTURE_CACHE.cache.has(canvasCacheKey)) {
            const cachedCanvas = TEXTURE_CACHE.cache.get(canvasCacheKey);
            const texture = new THREE.CanvasTexture(cachedCanvas);
            texture.needsUpdate = true;
            if (DEBUG && DEBUG.TEXTURES) console.log(`✅ Earth normal map loaded from memory cache`);
            return texture;
        }

        // Generate texture (no cache hit)
        if (DEBUG && DEBUG.TEXTURES) console.log(`🎨 Generating Earth normal map (${size}x${size})...`);
        const startTime = performance.now();
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

        // Calculate normals from height map with wrapped horizontal sampling so the
        // equirectangular seam does not create a lighting split on the sphere.
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const nx = x / size * 2, ny = y / size * 2;
                const leftX = (x - 1 + size) % size;
                const rightX = (x + 1) % size;
                const upY = Math.max(0, y - 1);
                const downY = Math.min(size - 1, y + 1);

                // Sample height at neighboring pixels
                const h = turbulence(nx, ny, 128) / 128;
                const hL = turbulence(leftX / size * 2, ny, 128) / 128;
                const hR = turbulence(rightX / size * 2, ny, 128) / 128;
                const hU = turbulence(nx, upY / size * 2, 128) / 128;
                const hD = turbulence(nx, downY / size * 2, 128) / 128;

                // Calculate gradients
                const dX = (hR - hL) * 2;
                const dY = (hD - hU) * 2;

                // Convert to normal map RGB (blue = up, red = x, green = y)
                data[idx] = Math.floor((dX + 1) * 127.5);     // R: -1 to 1 -> 0 to 255
                data[idx + 1] = Math.floor((dY + 1) * 127.5); // G: -1 to 1 -> 0 to 255
                data[idx + 2] = 200;                          // B: mostly pointing up
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Cache the canvas in memory for instant reuse (synchronous)
        TEXTURE_CACHE.cache.set(canvasCacheKey, canvas);

        // Also cache as data URL in IndexedDB for persistence (async, non-blocking)
        const dataURL = canvas.toDataURL('image/png');
        TEXTURE_CACHE.set(cacheKey, dataURL).catch((e) => { if (DEBUG && DEBUG.TEXTURES) console.warn('[TEX] Cache write failed:', e); });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        if (DEBUG && DEBUG.TEXTURES) console.log(`⏱️ Earth normal map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
        return texture;
    }

 createEarthSpecularMap(size) {
 const cacheKey = `earth_specular_${size}`;
 const canvasCacheKey = `${cacheKey}_canvas`;
 
 // Check MEMORY cache for pre-generated canvas (synchronous, instant)
 if (TEXTURE_CACHE.cache.has(canvasCacheKey)) {
 const cachedCanvas = TEXTURE_CACHE.cache.get(canvasCacheKey);
 const texture = new THREE.CanvasTexture(cachedCanvas);
 texture.needsUpdate = true;
 if (DEBUG && DEBUG.TEXTURES) console.log(`✅ Earth specular map loaded from memory cache`);
 return texture;
 }
 
 // Generate texture (no cache hit)
 if (DEBUG && DEBUG.TEXTURES) console.log(`🎨 Generating Earth specular map (${size}x${size})...`);
 const startTime = performance.now();
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
 
 // Cache the canvas in memory for instant reuse (synchronous)
 TEXTURE_CACHE.cache.set(canvasCacheKey, canvas);
 
 // Also cache as data URL in IndexedDB for persistence (async, non-blocking)
 const dataURL = canvas.toDataURL('image/png');
 TEXTURE_CACHE.set(cacheKey, dataURL).catch((e) => { if (DEBUG && DEBUG.TEXTURES) console.warn('[TEX] Cache write failed:', e); });
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 if (DEBUG && DEBUG.TEXTURES) console.log(`⏱️ Earth specular map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
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
 
 // ===== MOON TEXTURES =====
 
 createPhobosTexture(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Dark gray carbonaceous surface with reddish dust
 const gray = 80 + TextureGeneratorUtils.noise(nx * 30, ny * 30) * 50;
 
 data[idx] = gray * 0.85; // Slightly red-tinted
 data[idx + 1] = gray * 0.75;
 data[idx + 2] = gray * 0.70;
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 
 // Add large Stickney crater (about 1/3 diameter)
 const centerX = size * 0.4;
 const centerY = size * 0.5;
 const craterRadius = size * 0.15;
 const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, craterRadius);
 gradient.addColorStop(0, '#252525');
 gradient.addColorStop(0.7, '#404040');
 gradient.addColorStop(1, '#505050');
 ctx.fillStyle = gradient;
 ctx.beginPath();
 ctx.arc(centerX, centerY, craterRadius, 0, Math.PI * 2);
 ctx.fill();
 
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createDeimosTexture(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Lighter gray than Phobos, smoother surface
 const gray = 100 + TextureGeneratorUtils.noise(nx * 25, ny * 25) * 40;
 
 data[idx] = gray * 0.90;
 data[idx + 1] = gray * 0.85;
 data[idx + 2] = gray * 0.80;
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createIoTexture(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Volcanic yellow/orange/red surface
 const volcanic = TextureGeneratorUtils.noise(nx * 20, ny * 20);
 const sulfur = TextureGeneratorUtils.noise(nx * 10, ny * 10);
 
 let r, g, b;
 if (volcanic < 0.3) {
 // Dark lava flows
 r = 120 + sulfur * 40;
 g = 60 + sulfur * 30;
 b = 20;
 } else if (volcanic < 0.7) {
 // Yellow sulfur plains
 r = 255;
 g = 200 + sulfur * 40;
 b = 80 + sulfur * 60;
 } else {
 // Orange/red volcanic regions
 r = 255;
 g = 120 + sulfur * 60;
 b = 40;
 }
 
 data[idx] = r;
 data[idx + 1] = g;
 data[idx + 2] = b;
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createEuropaTexture(size) {
 // Use reusable utilities
 const { canvas, ctx } = TextureGeneratorUtils.createCanvas(size);
 
 // Icy white/cream base
 ctx.fillStyle = '#f5ede0';
 ctx.fillRect(0, 0, size, size);
 
 // Add crack patterns (reddish-brown lineae)
 ctx.strokeStyle = 'rgba(150, 100, 80, 0.4)';
 ctx.lineWidth = size / 200;
 for (let i = 0; i < 50; i++) {
 ctx.beginPath();
 const startX = Math.random() * size;
 const startY = Math.random() * size;
 ctx.moveTo(startX, startY);
 for (let j = 0; j < 5; j++) {
 ctx.lineTo(
 startX + (Math.random() - 0.5) * size * 0.5,
 startY + (Math.random() - 0.5) * size * 0.5
 );
 }
 ctx.stroke();
 }
 
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createTitanTexture(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Orange atmosphere with darker surface features
 const terrain = TextureGeneratorUtils.noise(nx * 15, ny * 15);
 const r = 255;
 const g = 140 + terrain * 60;
 const b = 50 + terrain * 30;
 
 data[idx] = r;
 data[idx + 1] = g;
 data[idx + 2] = b;
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createMercuryTexture(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Base gray-brown color
 let gray = 120 + TextureGeneratorUtils.noise(nx * 30, ny * 30) * 60;
 
 // Ray systems
 if (TextureGeneratorUtils.noise(nx * 100, ny * 100) > 0.92) {
 gray = Math.min(255, gray * 1.3);
 }
 
 data[idx] = gray;
 data[idx + 1] = gray * 0.9;
 data[idx + 2] = gray * 0.8;
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 
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
 
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createMercuryBumpMap(size) {
 // Use reusable utilities
 const { canvas, ctx } = TextureGeneratorUtils.createCanvas(size);
 
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
 
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createVenusTexture(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Swirling sulfuric acid clouds
 const cloudPattern = TextureGeneratorUtils.fbm(nx * 6, ny * 8, 6);
 const swirl = Math.sin(nx * Math.PI * 10 + cloudPattern * 3) * 0.5 + 0.5;
 
 const brightness = 180 + cloudPattern * 60 + swirl * 20;
 
 data[idx] = Math.min(255, brightness * 1.1); // R
 data[idx + 1] = Math.min(255, brightness * 0.85); // G
 data[idx + 2] = Math.min(255, brightness * 0.5); // B
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createJupiterTexture(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Horizontal bands with turbulence
 const bandY = ny * 12; // 12 major bands
 const bandPattern = Math.sin(bandY * Math.PI) * 0.5 + 0.5;
 const turbulence = TextureGeneratorUtils.fbm(nx * 8, ny * 4, 5) * 0.4;
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
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
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
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Subtle horizontal bands
 const bandY = ny * 15;
 const bandPattern = Math.sin(bandY * Math.PI) * 0.3 + 0.7;
 const turbulence = TextureGeneratorUtils.fbm(nx * 6, ny * 3, 4) * 0.2;
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
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createSaturnBumpMap(size) {
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size, ny = y / size;
 
 // Subtle atmospheric variation
 const elevation = TextureGeneratorUtils.noise(nx * 15, ny * 6) * 0.8 + TextureGeneratorUtils.noise(nx * 30, ny * 12) * 0.2;
 const gray = Math.floor(128 + elevation * 30);
 
 data[idx] = gray;
 data[idx + 1] = gray;
 data[idx + 2] = gray;
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }

 createUranusTexture(size) {
 // Uranus: Featureless cyan-blue atmosphere with subtle banding
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
 for (let y = 0; y < size; y++) {
 for (let x = 0; x < size; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size;
 const ny = y / size;
 
 // Latitude-based faint banding
 const latitude = ny;
 const band = Math.sin(latitude * Math.PI * 12) * 0.02;
 
 // Very subtle atmospheric variations
 const clouds = TextureGeneratorUtils.noise(nx * 8, ny * 8, 1) * 0.03;
 const detail = TextureGeneratorUtils.noise(nx * 20, ny * 20, 2) * 0.015;
 
 // Base cyan-blue color with methane tint
 const brightness = 0.65 + band + clouds + detail;
 data[idx] = Math.floor(79 * brightness); // R: Cyan-blue
 data[idx + 1] = Math.floor(212 * brightness); // G
 data[idx + 2] = Math.floor(232 * brightness); // B
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }

 createNeptuneTexture(size) {
 // Neptune: Deep blue atmosphere with Great Dark Spot and wind features
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
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
 const swirl = TextureGeneratorUtils.noise(nx * 12 + ny * 2, ny * 10, 1) * 0.06;
 const detail = TextureGeneratorUtils.noise(nx * 25, ny * 25, 2) * 0.03;
 
 // Deep blue with white clouds
 const brightness = 0.55 + band + wave + swirl + detail + darkSpot;
 data[idx] = Math.floor(46 * brightness); // R: Deep blue
 data[idx + 1] = Math.floor(95 * brightness); // G
 data[idx + 2] = Math.floor(181 * brightness); // B
 data[idx + 3] = 255;
 }
 }
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }

 createPlutoTexture(size) {
 // Pluto: Heart-shaped Tombaugh Regio, nitrogen ice, reddish-brown terrain
 // Use reusable utilities
 const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
 
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
 const terrain = TextureGeneratorUtils.noise(nx * 15, ny * 15, 1) * 0.4;
 const mountains = TextureGeneratorUtils.noise(nx * 30, ny * 30, 2) * 0.2;
 const detail = TextureGeneratorUtils.noise(nx * 50, ny * 50, 3) * 0.1;
 
 // Tholins (reddish-brown organic compounds)
 const tholin = terrain + mountains + detail;
 
 if (isHeart) {
 // Sputnik Planitia - bright nitrogen ice
 const iceBrightness = 0.9 + TextureGeneratorUtils.noise(nx * 40, ny * 40, 4) * 0.1;
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
 
 TextureGeneratorUtils.applyImageData(ctx, imageData);
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }

 createPlanetMaterial(config) {
 // Create HYPERREALISTIC materials with advanced texturing
 // Use config.id (language-independent) instead of config.name (translated)
 const id = (config.id || config.name).toLowerCase();
 if (DEBUG && DEBUG.TEXTURES) console.log(`[MAT] Creating material for: "${id}" (name: "${config.name}")`);

 // Base material properties
 let materialProps = {
 roughness: 0.9,
 metalness: 0.0,
 emissive: config.emissive || 0x000000,
 emissiveIntensity: config.emissiveIntensity || 0
 };

 // Planet-specific hyperrealistic materials with high-quality textures
 switch(id) {
 case 'earth': {
 // Earth: ULTRA HYPER-REALISTIC with real NASA textures + procedural fallback
 // Use quality-aware texture size: 1024 on mobile, 4096 on desktop
 const earthTexSize = CONFIG.QUALITY.textureSize;
 if (DEBUG.enabled) console.time('Earth Material Creation');
 const earthTexture = this._configureSphericalSurfaceTexture(
 this.createEarthTextureRealFixed(earthTexSize),
 { colorSpace: THREE.SRGBColorSpace }
 );
 const earthBump = this._configureSphericalSurfaceTexture(this.createEarthBumpMap(earthTexSize));
 if (DEBUG.enabled) console.timeEnd('Earth Material Creation');
 
 // ULTRA realistic material with PBR (Physically Based Rendering)
 const earthMaterial = new THREE.MeshStandardMaterial({
 map: earthTexture,
 
 // Bump map for elevation (normalMap removed — procedural version had bad gradients)
 bumpMap: earthBump,
 bumpScale: 0.08,
 
 // Uniform roughness — the procedural roughnessMap (createEarthSpecularMap) used
 // FBM noise that didn't align with the actual texture's oceans/continents, causing
 // a random shiny/matte split across the globe. A uniform value is far better.
 // ~0.3 keeps oceans visibly blue/specular; higher values make water look black.
 roughness: 0.3,
 
 // Metalness (Earth's surface is not metallic)
 metalness: 0.0,

 emissive: 0x000000,
 emissiveIntensity: 0,

 envMapIntensity: 0.2,
 transparent: false,
 side: THREE.FrontSide,
 flatShading: false,
 toneMapped: true
 });
 
 return earthMaterial;
 } // end case 'earth'

 case 'mars':
 // Mars: REAL NASA texture with rusty red surface with canyons, polar caps
 const marsTexture = this.createMarsTextureReal(CONFIG.QUALITY.textureSize);
 const marsBump = this.createMarsBumpMap(CONFIG.QUALITY.textureSize);
 const marsNormal = this.createMarsNormalMap(CONFIG.QUALITY.textureSize);
 
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
 const venusTexture = this.createVenusTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: venusTexture,
 color: 0xe8c468,
 roughness: 0.8,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'mercury':
 // Mercury: REAL NASA texture heavily cratered surface
 const mercuryTexture = this.createMercuryTextureReal(CONFIG.QUALITY.textureSize);
 const mercuryBump = this.createMercuryBumpMap(CONFIG.QUALITY.textureSize);
 
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
 const jupiterTexture = this.createJupiterTextureReal(CONFIG.QUALITY.textureSize);
 const jupiterBump = this.createJupiterBumpMap(Math.min(CONFIG.QUALITY.textureSize, 1024));
 
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
 const saturnTexture = this.createSaturnTextureReal(CONFIG.QUALITY.textureSize);
 const saturnBump = this.createSaturnBumpMap(Math.min(CONFIG.QUALITY.textureSize, 1024));
 
 return new THREE.MeshStandardMaterial({
 map: saturnTexture,
 bumpMap: saturnBump,
 bumpScale: 0.015,
 roughness: 0.65,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'uranus':
 // Uranus: REAL NASA texture with cyan atmosphere and methane
 const uranusTexture = this.createUranusTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: uranusTexture,
 roughness: 0.7,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'neptune':
 // Neptune: REAL NASA texture with deep blue and Great Dark Spot
 const neptuneTexture = this.createNeptuneTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: neptuneTexture,
 roughness: 0.7,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'pluto':
 // Pluto: Remote attempt (plugin) then procedural with Tombaugh Regio heart
 const plutoTexture = this.createPlutoTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: plutoTexture,
 roughness: 0.85,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'ceres':
 // Ceres: Dawn mission texture (NASA)
 const ceresTexture = this.createCeresTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: ceresTexture,
 roughness: 0.9,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'haumea':
 // Haumea: Fast-spinning elongated dwarf planet (CC BY 4.0 Solar System Scope)
 const haumeaTexture = this.createHaumeaTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: haumeaTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'makemake':
 // Makemake: Bright Kuiper Belt dwarf planet (CC BY 4.0 Solar System Scope)
 const makemakeTexture = this.createMakemakeTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: makemakeTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'eris':
 // Eris: Massive scattered disk dwarf planet (CC BY 4.0 Solar System Scope)
 const erisTexture = this.createErisTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: erisTexture,
 roughness: 0.8,
 metalness: 0.1,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 default:
 // Default material (for dwarf planets and others without specific loaders)
 if (config.dwarf) {
 // Dwarf planets: use Mercury-style cratered texture
 const dwarfTexture = this.createMercuryTexture(1024);
 return new THREE.MeshStandardMaterial({
 map: dwarfTexture,
 color: config.color,
 roughness: 0.9,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 }
 if (DEBUG && DEBUG.enabled) console.warn(`[MAT] DEFAULT MATERIAL for "${id}" - color: 0x${config.color?.toString(16)}`);
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
 planet.castShadow = CONFIG.QUALITY.shadows; // Enable eclipses on desktop; mobile stays off for performance
 planet.receiveShadow = true; // But can receive shadows from moons
 planet.rotation.z = (config.tilt || 0) * Math.PI / 180;

 // Get real astronomical data for this planet - USE ENGLISH KEY, NOT TRANSLATED NAME
 const planetKey = (config.id || config.name).toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[planetKey] || {};
 
 planet.userData = {
 id: config.id || config.name.toLowerCase(), // English key for lookups
 name: config.id || config.name, // English name for internal lookups; UI translates via t(name.toLowerCase())
 type: config.dwarf ? 'DwarfPlanet' : 'planet',
 distance: config.distance,
 radius: config.radius,
 angle: Math.random() * Math.PI * 2,
 speed: config.speed,
 visualBaseSpeed: config.speed,
 rotationSpeed: config.rotationSpeed,
 description: config.description,
 funFact: config.funFact,
 realSize: config.realSize,
 moonCount: config.moons || 0,
 moons: [],
 
 // Real astronomical data for day/night cycle
 realRotationPeriod: astroData.rotationPeriod || 24, // hours
 axialTilt: astroData.axialTilt ?? config.tilt ?? 0, // degrees
 retrograde: astroData.retrograde || false, // rotation direction
 rotationPhase: Math.random() * Math.PI * 2 // starting rotation angle
 };

 const orbitalElements = this.SCIENTIFIC_ORBITAL_ELEMENTS[planetKey] || { eccentricity: 0, inclinationDeg: 0, periapsisDeg: 0 };
 planet.userData.orbitalEccentricity = orbitalElements.eccentricity || 0;
 planet.userData.orbitalInclination = (orbitalElements.inclinationDeg || 0) * Math.PI / 180;
 planet.userData.orbitalPeriapsis = (orbitalElements.periapsisDeg || 0) * Math.PI / 180;
 // Pre-cached trig — inclination and sqrt(1±e) are constant per body
 planet.userData._sinOrbInc = Math.sin(planet.userData.orbitalInclination);
 planet.userData._cosOrbInc = Math.cos(planet.userData.orbitalInclination);
 const _pe = planet.userData.orbitalEccentricity;
 planet.userData._keplerSqrtPlus = Math.sqrt(1 + _pe);
 planet.userData._keplerSqrtMinus = _pe < 1 ? Math.sqrt(1 - _pe) : 0;

 // Cloud layer disabled — real NASA Earth texture already includes visible
 // cloud patterns; a separate cloud mesh caused a blue-tint artefact.

 // NOTE: Great Red Spot removed - now included in Jupiter's NASA texture!
 // The procedurally generated 3D spot was redundant and looked odd
 // compared to the real NASA imagery which already shows the Great Red Spot
 
 // Add rings for gas giants with realistic appearance
 if (config.rings) {
 // Ring radii vary by planet based on real proportions
 let ringInnerFactor = 1.3, ringOuterFactor = 2.2;
 if (config.id === 'uranus') { ringInnerFactor = 1.6; ringOuterFactor = 2.0; }
 else if (config.id === 'neptune') { ringInnerFactor = 1.7; ringOuterFactor = 2.5; }
 const innerR = config.radius * ringInnerFactor;
 const outerR = config.radius * ringOuterFactor;
 const ringGeometry = new THREE.RingGeometry(innerR, outerR, 128);

 // Three.js RingGeometry UVs are wrong for radial ring textures — remap them.
 // The ring texture (saturn_ring_alpha.webp) is a horizontal 1-D strip where
 // left edge = inner ring, right edge = outer ring. We need U to represent how
 // far a vertex is between inner and outer radius, and V to be the angle.
 const pos = ringGeometry.attributes.position;
 const uv = ringGeometry.attributes.uv;
 for (let i = 0; i < pos.count; i++) {
 const x = pos.getX(i), y = pos.getY(i);
 const r = Math.sqrt(x * x + y * y);
 uv.setXY(i, (r - innerR) / (outerR - innerR), 0.5);
 }
 uv.needsUpdate = true;
 
 // Create realistic ring material with color variation
 let ringColor = 0x888888;
 let ringOpacity = 0.3;
 
 if (config.prominentRings) {
 // Saturn's rings: use real texture if available, otherwise procedural
 ringColor = 0xd4c5b0;
 ringOpacity = 0.85;
 } else if (config.id === 'jupiter') {
 ringColor = 0x997755;
 ringOpacity = 0.2;
 } else if (config.id === 'uranus') {
 // Uranus: 13 narrow dark rings — real but nearly invisible; dark charcoal colour
 ringColor = 0x444444;
 ringOpacity = 0.07;
 } else if (config.id === 'neptune') {
 // Neptune: 5 faint dust arcs — extremely tenuous; deep dark blue-grey
 ringColor = 0x334455;
 ringOpacity = 0.05;
 }
 
 // For Saturn, try to load a real ring texture with transparency
 let ringMap = null;
 if (config.prominentRings) {
 const ringLoader = new THREE.TextureLoader();
 try {
 ringMap = ringLoader.load('./textures/rings/saturn_ring_alpha.webp');
 } catch(e) { ringMap = null; }
 }
 // Provide a 1×1 fallback so the sampler2D uniform is always a valid texture
 // (avoids driver issues on GPUs that evaluate both GLSL ternary branches)
 if (!ringMap) {
 ringMap = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
 ringMap.needsUpdate = true;
 }

 // Saturn ring material: forward-scatter shader simulates light shining through
 // dusty ring particles from behind — the iconic "dark side" ring brightening.
 // The sun is always at world origin (0,0,0) in this solar system simulation.
 const ringForwardScatterVert = /* glsl */`
 varying vec2 vUv;
 varying vec3 vWorldPos;
 void main() {
 vUv = uv;
 vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }
 `;
 const ringForwardScatterFrag = /* glsl */`
 uniform sampler2D ringMap;
 uniform bool useTexture;
 uniform vec3 ringColor;
 uniform float ringOpacity;
 varying vec2 vUv;
 varying vec3 vWorldPos;
 void main() {
 vec4 texSample = useTexture ? texture2D(ringMap, vUv) : vec4(ringColor, ringOpacity);
 if (texSample.a < 0.01) discard;
 // Forward-scatter: view looking toward the sun through the rings → brighten
 // Sun is at origin; dirToSun = normalize(-vWorldPos)
 vec3 dirToCamera = normalize(cameraPosition - vWorldPos);
 vec3 dirToSun = normalize(-vWorldPos);
 // Phase: 1.0 when camera behind rings looking at sun, 0.0 otherwise
 float phase = max(0.0, dot(dirToCamera, dirToSun));
 float scatter = 1.0 + pow(phase, 5.0) * 1.5;
 gl_FragColor = vec4(texSample.rgb * scatter, texSample.a);
 }
 `;

 const ringMaterial = new THREE.ShaderMaterial({
 uniforms: {
 ringMap: { value: ringMap },
 useTexture: { value: !!config.prominentRings },
 ringColor: { value: new THREE.Color(ringColor) },
 ringOpacity: { value: ringOpacity }
 },
 vertexShader: ringForwardScatterVert,
 fragmentShader: ringForwardScatterFrag,
 side: THREE.DoubleSide,
 transparent: true,
 depthWrite: false
 });
 const rings = new THREE.Mesh(ringGeometry, ringMaterial);
 rings.rotation.x = Math.PI / 2;
 rings.castShadow = false; // Rings don't cast meaningful shadows at solar system scale
 rings.receiveShadow = true; // But can receive shadows from moons
 planet.add(rings);
 }

 // Atmosphere glow — thin transparent sphere around planets with appreciable atmospheres.
 // Sun-aware: glow only appears on the sunlit limb, fading into darkness on the shadow side.
 if (config.atmosphere) {
 const atmosRadius = config.radius * 1.06;
 const atmosGeo = new THREE.SphereGeometry(atmosRadius, 48, 48);
 const atmosColor = config.atmosphereColor !== undefined ? config.atmosphereColor : 0x4466ff;
 const atmosOpacity = config.atmosphereOpacity !== undefined ? config.atmosphereOpacity : 0.15;
 const atmosColorVec = new THREE.Color(atmosColor);

 const atmosMat = new THREE.ShaderMaterial({
 uniforms: {
 glowColor: { value: atmosColorVec },
 glowOpacity: { value: atmosOpacity },
 sunDir: { value: new THREE.Vector3(1, 0, 0) } // updated each frame
 },
 vertexShader: /* glsl */`
 uniform vec3 sunDir;
 varying float vLimbFactor;
 varying float vSunDot;
 void main() {
 vec4 worldPos = modelMatrix * vec4(position, 1.0);
 vec3 outwardNormal = normalize(mat3(modelMatrix) * normalize(position));
 vec3 toCamera = normalize(cameraPosition - worldPos.xyz);
 float cosAngle = abs(dot(outwardNormal, toCamera));
 vLimbFactor = 1.0 - cosAngle;
 vSunDot = dot(outwardNormal, sunDir);
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }
 `,
 fragmentShader: /* glsl */`
 uniform vec3 glowColor;
 uniform float glowOpacity;
 varying float vLimbFactor;
 varying float vSunDot;
 void main() {
 float edge = pow(vLimbFactor, 1.6);
 // Fade glow on the shadow side; soft transition around the terminator.
 float sunFactor = smoothstep(-0.25, 0.4, vSunDot);
 gl_FragColor = vec4(glowColor, edge * glowOpacity * 1.6 * sunFactor);
 }
 `,
 transparent: true,
 side: THREE.BackSide,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });

 const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
 atmosMesh.name = 'atmosphere';
 atmosMesh.raycast = () => {}; // Never intercept pointer clicks — let the planet underneath receive them
 planet.add(atmosMesh);
 planet.userData.atmosphereMesh = atmosMesh;
 }

 scene.add(planet);
 this.objects.push(planet);
 this.pickableObjects.push(planet);

    // Merge any pending remote texture metadata captured before planet object existed
    const meta = this._pendingTextureMeta?.[config.name.toLowerCase()];
    if (meta) {
        planet.userData.remoteTextureAttempted = meta.attempted;
        planet.userData.remoteTextureSources = meta.sources;
        planet.userData.remoteTextureLoaded = meta.success;
        planet.userData.remoteTextureURL = meta.finalURL || null;
        planet.userData.remoteTextureLoadMs = meta.durationMs || null;
    }
 
 return planet;
 }

    // Verification utility: logs which solar system objects ended up with remote textures
    verifyTextureLoads(delayMs = 4000) {
        setTimeout(() => {
         if (DEBUG && DEBUG.TEXTURES) {
            console.group('[TEX] Texture Load Verification');
            const summary = { remoteSuccess: 0, remoteFailed: 0, proceduralOnly: 0 };
            Object.entries(this.planets).forEach(([key, planet]) => {
                const ud = planet.userData;
                const name = ud.name;
                const hasRemote = !!ud.remoteTextureLoaded;
                if (ud.remoteTextureAttempted) {
                    if (hasRemote) {
                        summary.remoteSuccess++;
                        if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${name}: remote texture loaded (${ud.remoteTextureURL}) in ${ud.remoteTextureLoadMs?.toFixed(0)}ms`);
                    } else {
                        summary.remoteFailed++;
                        if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${name}: remote texture attempted but fell back to procedural (${ud.remoteTextureSources?.length} sources)`);
                    }
                } else {
                    summary.proceduralOnly++;
                    if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${name}: procedural texture only (no remote attempt)`);
                }
            });
            // Moons
            Object.entries(this.moons).forEach(([key, moon]) => {
                const hasMap = !!moon.material?.map;
                const src = hasMap && moon.material.map.image?.src;
                if (src && typeof src === 'string' && /https?:\/\//.test(src)) {
                    if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${moon.userData.name}: has (possibly remote) texture map -> ${src}`);
                } else {
                    if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${moon.userData.name}: procedural/generated texture`);
                }
            });
            if (DEBUG && DEBUG.TEXTURES) console.log(`Summary: ${summary.remoteSuccess} remote loaded, ${summary.remoteFailed} remote failed, ${summary.proceduralOnly} procedural-only planets.`);
            console.groupEnd();
         }
        }, delayMs);
    }

 createMoon(planet, config) {
 const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
 
 // Enhanced moon materials based on specific moons
 // Use id (language-independent) for moon identification
 let moonMaterial;
 const moonId = (config.id || config.name).toLowerCase();
 
 if (moonId.includes('moon') && !moonId.includes('ganymede') && !moonId.includes('callisto')) {
 // Earth's Moon: REAL NASA LRO texture — no procedural normal/bump maps needed
 const moonTexture = this.createMoonTextureReal(2048);
 
 moonMaterial = new THREE.MeshStandardMaterial({
 map: moonTexture,
 roughness: 0.98, // Extremely rough - lunar regolith scatters light
 metalness: 0.0, // Zero metal - pure rock and dust
 // Critical for realistic moon phases - no ambient/emissive light
 emissive: 0x000000,
 emissiveIntensity: 0.0,
 envMapIntensity: 0.1
 });
 } else if (moonId.includes('phobos')) {
 // Phobos: Dark reddish-gray with Stickney crater
 const phobosTexture = this.createPhobosTextureReal(1024);
 moonMaterial = new THREE.MeshStandardMaterial({
 map: phobosTexture,
 roughness: 0.95,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Created Phobos texture (1024x1024)`);
 } else if (moonId.includes('deimos')) {
 // Deimos: Lighter gray, smoother surface
 const deimosTexture = this.createDeimosTextureReal(1024);
 moonMaterial = new THREE.MeshStandardMaterial({
 map: deimosTexture,
 roughness: 0.92,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Created Deimos texture (1024x1024)`);
 } else if (moonId.includes('io')) {
 // Io: NASA Galileo photorealistic volcanic surface - most volcanically active body
 const ioTexture = this.createIoTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: ioTexture,
 roughness: 0.75,
 metalness: 0.0,
 emissive: 0xff4400, // Subtle volcanic glow
 emissiveIntensity: 0.12 // Active volcanoes!
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Io photorealistic texture (2048)`);
 } else if (moonId.includes('europa')) {
 // Europa: NASA Galileo icy surface - smooth ice with reddish-brown cracks
 const europaTexture = this.createEuropaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: europaTexture,
 roughness: 0.65, // Icy but cracked surface, not mirror-smooth
 metalness: 0.0, // Ice is not metallic
 emissive: 0xccddff,
 emissiveIntensity: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Europa photorealistic texture (2048)`);
 } else if (moonId.includes('ganymede')) {
 // Ganymede: Largest moon in solar system, mix of old dark terrain and bright grooved terrain
 const ganymedeTexture = this.createGanymedeTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: ganymedeTexture,
 roughness: 0.85,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Ganymede photorealistic texture (2048)`);
 } else if (moonId.includes('callisto')) {
 // Callisto: Ancient, heavily cratered surface - oldest terrain in solar system
 const callistoTexture = this.createCallistoTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: callistoTexture,
 roughness: 0.92,
 metalness: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Callisto photorealistic texture (2048)`);
 } else if (moonId.includes('titan')) {
 // Titan: Saturn's largest moon with thick orange atmosphere (Cassini-Huygens)
 const titanTexture = this.createTitanTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: titanTexture,
 roughness: 0.95, // Thick hazy atmosphere
 metalness: 0.0,
 emissive: 0xff8844,
 emissiveIntensity: 0.08 // Subtle atmospheric glow
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Titan photorealistic texture (2048)`);
 } else if (moonId.includes('enceladus')) {
 // Enceladus: Bright icy moon with active geysers at south pole
 const enceladusTexture = this.createEnceladusTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: enceladusTexture,
 roughness: 0.7, // Icy but not mirror-smooth
 metalness: 0.0, // Ice is not metallic
 emissive: 0xeeffff,
 emissiveIntensity: 0.03 // Slight brightness for icy albedo
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Enceladus photorealistic texture (2048)`);
 } else if (moonId.includes('rhea')) {
 // Rhea: Saturn's second-largest moon - heavily cratered icy surface (NASA Cassini)
 const rheaTexture = this.createRheaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: rheaTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0xddddee,
 emissiveIntensity: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Rhea photorealistic texture (2048)`);
 } else if (moonId.includes('triton')) {
 // Triton: Neptune's captured moon - pinkish nitrogen ice, cryovolcanism (NASA Voyager)
 const tritonTexture = this.createTritonTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: tritonTexture,
 roughness: 0.35,
 metalness: 0.1,
 emissive: 0xffdddd,
 emissiveIntensity: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Triton photorealistic texture (2048)`);
 } else if (moonId.includes('titania')) {
 // Titania: Uranus's largest moon - cratered surface with canyons (NASA Voyager)
 const titaniaTexture = this.createTitaniaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: titaniaTexture,
 roughness: 0.88,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Titania photorealistic texture (2048)`);
 } else if (moonId.includes('miranda')) {
 // Miranda: Uranus's smallest major moon - dramatic geological features (NASA Voyager)
 const mirandaTexture = this.createMirandaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: mirandaTexture,
 roughness: 0.9,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Miranda photorealistic texture (2048)`);
 } else if (moonId.includes('charon')) {
 // Charon: Pluto's largest moon - dark reddish north pole (NASA New Horizons)
 const charonTexture = this.createCharonTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: charonTexture,
 roughness: 0.9,
 metalness: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Charon photorealistic texture (2048)`);
 } else {
 // Default moon material
 moonMaterial = MaterialFactory.createColoredMaterial(config.color, {
 roughness: 0.9,
 metalness: 0.1
 });
 }

 const moon = new THREE.Mesh(geometry, moonMaterial);
 moon.castShadow = true;
 moon.receiveShadow = true;
 
 // Verify texture is applied
 if (DEBUG.enabled) {
 console.log(`[Moon Material] "${config.name}" has texture map: ${moonMaterial.map?.isTexture ? 'YES' : 'NO'}`);
 }

 // Get real astronomical data for this moon (use id if available, otherwise name)
 const astroDataKey = (config.id || config.name).toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[astroDataKey] || {};
 
 // Real astronomical data for day/night cycle
 // Most moons are tidally locked — rotation period ≈ orbital period
 const moonOrbitalPeriodHours = (this.SCIENTIFIC_MOON_ORBITAL_PERIODS[astroDataKey] || 0) * 24;

 moon.userData = {
 id: config.id || config.name.toLowerCase(), // English key for lookups
 name: config.id || config.name, // English name for internal lookups; UI translates via t(name.toLowerCase())
 type: 'moon',
 distance: config.distance,
 radius: config.radius,
 angle: 0,
 speed: config.speed,
 visualBaseSpeed: config.speed,
 rotationSpeed: config.rotationSpeed || 0.001, // Add rotation
 description: config.description,
 
 // Tidally locked default: use orbital period; fallback to Earth Moon's 655.7h
 realRotationPeriod: astroData.rotationPeriod || moonOrbitalPeriodHours || 655.7, // hours
 axialTilt: astroData.axialTilt || 0,
 retrograde: astroData.retrograde || false,
 rotationPhase: Math.random() * Math.PI * 2,
 // All moons in this simulation are tidally locked (rotation period = orbital period)
 tidallyLocked: true
 };

 moon.userData.parentPlanet = planet.userData?.id || planet.userData?.name || null;
 const moonKey = (config.id || config.name).toLowerCase();
 const moonElements = this.SCIENTIFIC_MOON_ORBITAL_ELEMENTS[moonKey] || { eccentricity: 0, inclinationDeg: 0, periapsisDeg: 0 };
 moon.userData.orbitalEccentricity = moonElements.eccentricity || 0;
 moon.userData.orbitalInclination = (moonElements.inclinationDeg || 0) * Math.PI / 180;
 moon.userData.orbitalPeriapsis = (moonElements.periapsisDeg || 0) * Math.PI / 180;
 // Pre-cached trig — constant for each moon
 moon.userData._sinOrbInc = Math.sin(moon.userData.orbitalInclination);
 moon.userData._cosOrbInc = Math.cos(moon.userData.orbitalInclination);
 const _me = moon.userData.orbitalEccentricity;
 moon.userData._keplerSqrtPlus = Math.sqrt(1 + _me);
 moon.userData._keplerSqrtMinus = _me < 1 ? Math.sqrt(1 - _me) : 0;

 // Store moon reference using id (language-independent)
 const moonStorageKey = (config.id || config.name).trim().toLowerCase();
 this.moons[moonStorageKey] = moon;
 planet.userData.moons.push(moon);
 this.objects.push(moon);
 this.pickableObjects.push(moon);
 
 // Set initial position based on angle (IMPORTANT: must be done before adding to planet)
 moon.position.x = config.distance * Math.cos(moon.userData.angle);
 moon.position.z = config.distance * Math.sin(moon.userData.angle);
 moon.position.y = 0; // Keep in planet's equatorial plane
 
 planet.add(moon);
 
 if (DEBUG.enabled) console.log(`[Moon] Created "${config.name}" for ${planet.userData.name} at distance ${config.distance}, initial position (${moon.position.x.toFixed(2)}, ${moon.position.y.toFixed(2)}, ${moon.position.z.toFixed(2)})`);
 }

 setScientificMode(enabled) {
 this.scientificMode = !!enabled;
 this.applyScientificModeSpeeds();
 // Redraw orbit lines to match the new motion model
 // (circles for educational mode, Keplerian ellipses for scientific mode)
 this.updateOrbitalPaths();
 }

 applyScientificModeSpeeds() {
 // Cache baseline visual speeds once, and restore them when scientific mode is off.
 const earthVisualBase = this.planets?.earth?.userData?.visualBaseSpeed || 0.01;
 const earthOrbitalPeriod = this.ASTRONOMICAL_DATA.earth?.orbitalPeriod || 365.25;

 Object.values(this.planets).forEach((planet) => {
 if (!planet?.userData) return;
 const ud = planet.userData;
 if (ud.visualBaseSpeed === undefined) ud.visualBaseSpeed = ud.speed;

 if (!this.scientificMode) {
 ud.speed = ud.visualBaseSpeed;
 return;
 }

 const key = (ud.id || ud.name || '').toLowerCase();
 const period = this.SCIENTIFIC_ORBITAL_PERIODS[key] || this.ASTRONOMICAL_DATA[key]?.orbitalPeriod;
 if (!period || period <= 0) {
 ud.speed = ud.visualBaseSpeed;
 return;
 }

 ud.speed = earthVisualBase * (earthOrbitalPeriod / period);
 });

 Object.values(this.moons).forEach((moon) => {
 if (!moon?.userData) return;
 const ud = moon.userData;
 if (ud.visualBaseSpeed === undefined) ud.visualBaseSpeed = ud.speed;

 if (!this.scientificMode) {
 ud.speed = ud.visualBaseSpeed;
 return;
 }

 const moonKey = (ud.id || ud.name || '').toLowerCase();
 const moonPeriod = this.SCIENTIFIC_MOON_ORBITAL_PERIODS[moonKey] || this.ASTRONOMICAL_DATA[moonKey]?.orbitalPeriod;
 const parent = moon.parent;
 const parentKey = parent?.userData?.id?.toLowerCase() || parent?.userData?.name?.toLowerCase();
 const parentPeriod = parentKey ? (this.SCIENTIFIC_ORBITAL_PERIODS[parentKey] || this.ASTRONOMICAL_DATA[parentKey]?.orbitalPeriod) : null;
 const parentSpeed = parent?.userData?.speed;

 if (!moonPeriod || !parentPeriod || !parentSpeed) {
 ud.speed = ud.visualBaseSpeed;
 return;
 }

 const direction = ud.visualBaseSpeed < 0 ? -1 : 1;
 ud.speed = direction * Math.abs(parentSpeed) * (parentPeriod / moonPeriod);
 });

 if (this.comets) {
 this.comets.forEach(comet => {
 if (!comet?.userData) return;
 const ud = comet.userData;
 if (ud.visualBaseSpeed === undefined) ud.visualBaseSpeed = ud.speed;

 if (!this.scientificMode) {
 ud.speed = ud.visualBaseSpeed;
 return;
 }

 if (ud.orbitalPeriod) {
 ud.speed = earthVisualBase * (earthOrbitalPeriod / ud.orbitalPeriod);
 } else {
 ud.speed = ud.visualBaseSpeed;
 }
 });
 }

 if (DEBUG && DEBUG.enabled) {
 console.log(`[Scientific Mode] ${this.scientificMode ? 'ON' : 'OFF'} — orbital speeds ${this.scientificMode ? 'derived from orbital periods' : 'restored to visual tuning'}`);
 }
 }

 // ─────────────────────────────────────────────────────────────────────────────
 // TIME MACHINE: date ↔ orbit position utilities
 // ─────────────────────────────────────────────────────────────────────────────

 /** Convert a JavaScript Date to a Julian Date number. */
 toJulianDate(date) {
 const y = date.getUTCFullYear();
 const m = date.getUTCMonth() + 1;
 const d = date.getUTCDate()
 + (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()) / 86400;
 const A = Math.floor(m <= 2 ? y - 1 : y);
 const B = m <= 2 ? m + 12 : m;
 // Gregorian calendar correction (Meeus algorithm)
 // Without this, JD is off by ~13 days for modern dates
 const C = 2 - Math.floor(A / 100) + Math.floor(Math.floor(A / 100) / 4);
 return Math.floor(365.25 * (A + 4716)) + Math.floor(30.6001 * (B + 1)) + d + C - 1524.5;
 }

 /** Sun's right ascension in radians for a given days-since-J2000 value.
 * Uses low-precision solar coordinates (good to ~1°). */
 _sunRA(daysSinceJ2000) {
 const T = daysSinceJ2000 / 36525;
 const L0 = ((280.46646 + 36000.76983 * T) % 360 + 360) % 360;
 const M = ((357.52911 + 35999.05029 * T) % 360 + 360) % 360;
 const M_rad = M * Math.PI / 180;
 const C = (1.9146 - 0.004817 * T) * Math.sin(M_rad) + 0.019993 * Math.sin(2 * M_rad);
 const sunLon = (L0 + C) * Math.PI / 180;
 const eps = (23.439 - 0.00000036 * daysSinceJ2000) * Math.PI / 180;
 let ra = Math.atan2(Math.cos(eps) * Math.sin(sunLon), Math.cos(sunLon));
 if (ra < 0) ra += Math.PI * 2;
 return ra;
 }

 /** Solve Kepler's equation M = E - e·sin(E) via Newton-Raphson iteration. */
 _solveKepler(M_rad, e) {
 let E = M_rad + e * Math.sin(M_rad);
 for (let i = 0; i < 12; i++) {
 const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
 E += dE;
 if (Math.abs(dE) < 1e-10) break;
 }
 return E;
 }

 /** Mean anomaly (radians) → true anomaly (radians).
 * Pass pre-cached sqrtPlus = sqrt(1+e) and sqrtMinus = sqrt(1-e) to skip recomputing them. */
 _meanToTrueAnomaly(M_rad, e, sqrtPlus, sqrtMinus) {
 if (e < 1e-6) return M_rad; // circular — skip Kepler solver
 const E = this._solveKepler(M_rad, e);
 const sp = sqrtPlus || Math.sqrt(1 + e);
 const sm = sqrtMinus || Math.sqrt(1 - e);
 return 2 * Math.atan2(
 sp * Math.sin(E / 2),
 sm * Math.cos(E / 2)
 );
 }

 /**
 * Compute the scene-space position of a trajectory-based deep-space probe for a given JD.
 * Returns {x, y, z} in scene units (educational or realistic scale).
 * @param {object} traj - trajectory descriptor { refJD, refDistAU, speedKmps, eclLon, eclLat }
 * @param {number} jd   - target Julian Date
 * @returns {{x:number, y:number, z:number, distAU:number}}
 */
 _probePositionAtJD(traj, jd) {
 const AU_KM = 149597870.7;
 // Educational: 22.5 units/AU = heliopause 2700 / 120 AU, consistent with visual placement.
 // Realistic: 150 units/AU = heliopause 18000 / 120 AU.
 const scaleUnitsPerAU = this.realisticScale ? 150 : 22.5;
 const distAU = traj.refDistAU + traj.speedKmps * (jd - traj.refJD) * 86400 / AU_KM;
 const dist = Math.max(0, distAU) * scaleUnitsPerAU;
 const lonRad = traj.eclLon * Math.PI / 180;
 const latRad = traj.eclLat * Math.PI / 180;
 const out = this._probePosOut;
 out.x = dist * Math.cos(latRad) * Math.cos(lonRad);
 out.y = dist * Math.sin(latRad);
 out.z = dist * Math.cos(latRad) * Math.sin(lonRad);
 out.distAU = distAU;
 return out;
 }

 /**
 * Update all trajectory-based spacecraft to their correct positions for the given JD.
 * Called from initPositionsToDate and during scale changes.
 * @param {number} jd - Julian Date
 */
 _initSpacecraftToDate(jd) {
 if (!this.spacecraft) return;
 this.spacecraft.forEach(craft => {
 const ud = craft.userData;
 if (!ud || ud.orbitPlanet || !ud.trajectory) return;
 const pos = this._probePositionAtJD(ud.trajectory, jd);
 craft.position.set(pos.x, pos.y, pos.z);
 // Store for use by updateSpacecraftPositions (scale changes)
 ud.distanceAU = pos.distAU;
 ud.distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
 if (DEBUG.enabled) {
 console.log(` [Trajectory] ${ud.name}: ${pos.distAU.toFixed(2)} AU → scene (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)})`);
 }
 });
 }

 /**
 * Seek all planet positions to those matching the given JavaScript Date.
 * Works in both educational (circle) and scientific (Keplerian ellipse) modes.
 * Also seeds simulatedHours so planet self-rotations are consistent.
 * @param {Date} date
 */
 initPositionsToDate(date) {
 const jd = this.toJulianDate(date);
 const daysSinceJ2000 = jd - 2451545.0;
 const TWO_PI = Math.PI * 2;
 const normalizeAngle = (angle) => ((angle % TWO_PI) + TWO_PI) % TWO_PI;
 this.simulatedJD = jd;
 // Seed rotation clock from the same epoch
 this.simulatedHours = daysSinceJ2000 * 24;

 Object.entries(this.planets).forEach(([key, planet]) => {
 if (!planet?.userData) return;
 const el = this.PLANET_ELEMENTS_J2000[key];
 if (!el) return;

 // Mean anomaly at target date
 const M_deg = ((el.M0 + el.n * daysSinceJ2000) % 360 + 360) % 360;
 const M_rad = M_deg * Math.PI / 180;
 const e = planet.userData.orbitalEccentricity || 0;

 // True anomaly (= userData.angle the update loop uses as orbital phase)
 planet.userData.meanAnomaly = M_rad;
 planet.userData.angle = this._meanToTrueAnomaly(M_rad, e);

 // Also update planet.position immediately so focusOnObject / getWorldPosition
 // returns the correct epoch position without waiting for the next update() frame.
 if (this.scientificMode) {
 const i = planet.userData.orbitalInclination || 0;
 const w = planet.userData.orbitalPeriapsis || 0;
 const a = planet.userData.distance;
 const nu = planet.userData.angle;
 const r = (e > 0) ? (a * (1 - e * e) / (1 + e * Math.cos(nu))) : a;
 const theta = nu + w;
 planet.position.x = r * Math.cos(theta);
 planet.position.y = r * Math.sin(theta) * Math.sin(i);
 planet.position.z = r * Math.sin(theta) * Math.cos(i);
 } else {
 planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
 planet.position.y = 0;
 planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
 }
 });

 // Set Earth's self-rotation immediately so the correct face is visible
 // before the next animation frame (same formula as update loop).
 const earthPlanet = this.planets['earth'];
 if (earthPlanet) {
 const gmst = ((280.46061837 + 360.98564736629 * daysSinceJ2000) % 360 + 360) % 360 * Math.PI / 180;
 const sunRA = this._sunRA(daysSinceJ2000);
 const orbAngle = Math.atan2(earthPlanet.position.z, earthPlanet.position.x);
 earthPlanet.rotation.y = orbAngle + Math.PI + sunRA - gmst;
 }

 // Date-seed moon orbital phases (deterministic by JD, not random startup state)
 Object.values(this.moons).forEach((moon) => {
 if (!moon?.userData) return;

 const moonKey = (moon.userData.id || moon.userData.name || '').toLowerCase();
 const orbitalPeriodDays = this.SCIENTIFIC_MOON_ORBITAL_PERIODS[moonKey] || this.ASTRONOMICAL_DATA[moonKey]?.orbitalPeriod;
 if (!orbitalPeriodDays || orbitalPeriodDays <= 0) return;

 const meanAnomaly = normalizeAngle((daysSinceJ2000 / orbitalPeriodDays) * TWO_PI);
 moon.userData.meanAnomaly = meanAnomaly;
 moon.userData.angle = meanAnomaly;

 // Counter-rotate by parent's rotation.y so the moon's world-space
 // orbit is not dragged by the planet's self-rotation.
 const parentRotY = moon.parent ? (moon.parent.rotation.y || 0) : 0;
 if (this.scientificMode) {
 const e = moon.userData.orbitalEccentricity || 0;
 const i = moon.userData.orbitalInclination || 0;
 const w = moon.userData.orbitalPeriapsis || 0;
 const a = moon.userData.distance;
 const nu = moon.userData.angle;
 const r = (e > 0) ? (a * (1 - e * e) / (1 + e * Math.cos(nu))) : a;
 const theta = nu + w + parentRotY;
 const xOrb = r * Math.cos(theta);
 const zOrb = r * Math.sin(theta);
 moon.position.x = xOrb;
 moon.position.y = zOrb * moon.userData._sinOrbInc;
 moon.position.z = zOrb * moon.userData._cosOrbInc;
 } else {
 const adj = moon.userData.angle + parentRotY;
 moon.position.x = moon.userData.distance * Math.cos(adj);
 moon.position.y = 0;
 moon.position.z = moon.userData.distance * Math.sin(adj);
 }
 });

 // Date-seed comet orbital phases (deterministic by JD, not random startup state)
 if (this.comets) {
 this.comets.forEach((comet) => {
 const userData = comet?.userData;
 if (!userData) return;

 const orbitalPeriodDays = userData.orbitalPeriod;
 if (!orbitalPeriodDays || orbitalPeriodDays <= 0) return;

 // Seed mean anomaly linearly from JD; derive true anomaly via Kepler solver
        let elapsedD = daysSinceJ2000; if (userData.perihelionJD) { elapsedD = jd - userData.perihelionJD; }
        const meanAnomaly = normalizeAngle((elapsedD / orbitalPeriodDays) * TWO_PI);
 userData.meanAnomaly = meanAnomaly;
 const e = userData.eccentricity || 0;
 userData.angle = (e > 1e-6) ? this._meanToTrueAnomaly(meanAnomaly, e) : meanAnomaly;

 const a = userData.distance;
 const r = (e > 0) ? (a * (1 - e * e) / (1 + e * Math.cos(userData.angle))) : a;
 const inclRad = (userData.inclination || 0) * Math.PI / 180;
 comet.position.x = r * Math.cos(userData.angle);
 comet.position.y = r * Math.sin(userData.angle) * Math.sin(inclRad);
 comet.position.z = r * Math.sin(userData.angle) * Math.cos(inclRad);
 });
 }

 // Notify UI immediately
 window.dispatchEvent(new CustomEvent('simulatedDateChanged', { detail: { jd } }));

 // Update trajectory-based spacecraft positions (Voyagers, Pioneers, New Horizons)
 this._initSpacecraftToDate(jd);

 if (DEBUG.enabled) console.log(`[TimeMachine] Seeked to ${date.toUTCString().slice(0, 16)} (JD ${jd.toFixed(1)})`);
 }

 /**
 * Public shorthand: seek to a Date object or ISO-8601 string.
 * Silently ignores invalid date inputs to prevent orbital solver corruption.
 * @param {Date|string} input
 */
 seekToDate(input) {
 const date = input instanceof Date ? input : new Date(input);
 if (isNaN(date.getTime())) {
 if (DEBUG.enabled) console.warn('[TimeMachine] seekToDate: ignored invalid date input', input);
 return;
 }
 this.initPositionsToDate(date);
 }

 createAsteroidBelt(scene) {
 // ===== HYPER-REALISTIC ASTEROID BELT =====
 // Multiple size classes: dust, small, medium, large asteroids
 const asteroidBeltGroup = new THREE.Group();
 asteroidBeltGroup.name = 'asteroidBelt';
 
 // Asteroid belt is between Mars and Jupiter (2.2-3.2 AU real)
 // Educational scale: Mars=78, Jupiter=266, belt at 100-150 (125±25, ~2.7 AU × 51.28)
 // Realistic: Mars=227.9, Jupiter=778.6, so belt at ~350±150
 const baseDistance = this.realisticScale ? 350 : 125;
 const distanceSpread = this.realisticScale ? 150 : 25;
 
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
 size: 1.2,
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
 size: 0.6,
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
 size: 0.25,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.5
 });
 
 const dust = new THREE.Points(dustGeometry, dustMaterial);
 asteroidBeltGroup.add(dust);
 
 asteroidBeltGroup.userData = {
 name: 'asteroidBelt',
 type: 'asteroidBelt',
 description: t('descAsteroidBelt'),
 funFact: t('funFactAsteroidBelt'),
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
 
 // Kuiper belt is beyond Neptune (30-50 AU real, centered around 40 AU)
 // Real distances: Neptune=30 AU, Pluto=39.5 AU, Kuiper Belt main region=30-55 AU
 // Educational scale: Neptune=1542, Pluto=2024, so belt should be 1600-2400 (center ~2000)
 // Realistic scale: Neptune=4495, Pluto=5906, so belt should be 4500-8250 (center ~6000)
 const baseDistance = this.realisticScale ? 6000 : 2000;
 const distanceSpread = this.realisticScale ? 2250 : 400;
 
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
 name: 'kuiperBelt',
 type: 'kuiperBelt',
 description: t('descKuiperBelt'),
 funFact: t('funFactKuiperBelt'),
 count: largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount,
 radius: 60
 };
 
 scene.add(kuiperBeltGroup);
 this.kuiperBelt = kuiperBeltGroup;
 this.objects.push(kuiperBeltGroup);
 
 if (DEBUG.enabled) console.log(` Kuiper Belt: ${largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount} objects`);
 }

 createHeliopause(scene) {
 // ===== HELIOPAUSE =====
 // The boundary where the solar wind meets the interstellar medium
 // Real distance: ~120 AU (Voyager 1 crossed it at ~121 AU in Aug 2012)
 // Voyager 2 crossed at ~119 AU in Nov 2018
 const heliopauseRadius = 2700; // ~120 AU educational scale, inside Oort Cloud
 
 // Create a translucent sphere to mark the boundary
 const geometry = GeometryFactory.createSphere(heliopauseRadius, 64);
 const material = new THREE.MeshBasicMaterial({
 color: 0x4488cc,
 transparent: true,
 opacity: 0.03,
 side: THREE.BackSide,
 depthWrite: false
 });
 const heliopauseMesh = new THREE.Mesh(geometry, material);
 heliopauseMesh.name = 'heliopause';

 // Add a subtle wireframe ring at the equator for visibility
 const ringGeometry = new THREE.RingGeometry(heliopauseRadius - 2, heliopauseRadius + 2, 128);
 const ringMaterial = new THREE.MeshBasicMaterial({
 color: 0x6699dd,
 transparent: true,
 opacity: 0.15,
 side: THREE.BackSide,
 depthWrite: false
 });
 const equatorRing = new THREE.Mesh(ringGeometry, ringMaterial);
 equatorRing.rotation.x = Math.PI / 2;
 heliopauseMesh.add(equatorRing);

 heliopauseMesh.userData = {
 name: t('heliopause'),
 type: 'heliopause',
 description: t('descHeliopause'),
 funFact: t('funFactHeliopause'),
 radius: heliopauseRadius,
 baseRadius: heliopauseRadius, // educational-scale radius — used by updateScale()
 realSize: '~240 AU diameter (~36 billion km)'
 };

 scene.add(heliopauseMesh);
 this.heliopause = heliopauseMesh;
 // NOT added to this.objects — the giant sphere would intercept all raycasts
 // and show the "Heliopause" hover label everywhere. Navigation uses
 // this.heliopause directly via the navigationMap in main.js.
 
 if (DEBUG.enabled) console.log(`[HELIO] Heliopause sphere at radius ${heliopauseRadius}`);
 }

 createOortCloud(scene) {
 // ===== HYPER-REALISTIC OORT CLOUD =====
 // A spherical shell of icy planetesimals surrounding the entire solar system
 // Real distances: 50,000-200,000 AU (inner Oort cloud: 2,000-20,000 AU)
 // The Oort Cloud is the source of long-period comets
 
 const oortCloudGroup = new THREE.Group();
 oortCloudGroup.name = 'oortCloud';
 
 // Scale distances appropriately
 // Educational: Compressed to sit inside the constellation sphere (10,000 units)
 // Oort Cloud must encompass all spacecraft and stay inside the constellation sphere.
 // Range: 3,000–9,000 units (proportional — inner is 1.1× heliopause at 2700,
 // outer is 3.3× heliopause at 2700).
 //
 // Realistic: Proportionally scaled with the realistic heliopause (18,000 units):
 // inner = 18000 × 1.1 ≈ 20,000 units
 // outer = 18000 × 3.3 ≈ 60,000 units
 // (True AU values of 50k–200k AU would place particles millions of units away,
 // making them invisible before the galaxy transition; this compressed-but-proportional
 // scale preserves the relative journey through heliopause → Oort Cloud → galaxy.)
 const innerRadius = this.realisticScale ? 20000 : 3000;
 const outerRadius = this.realisticScale ? 60000 : 9000;
 
 // Inner Oort Cloud (Hills cloud) - denser concentration
 const innerOortCount = 800;
 const innerOortGeometry = new THREE.BufferGeometry();
 const innerOortPositions = new Float32Array(innerOortCount * 3);
 const innerOortColors = new Float32Array(innerOortCount * 3);
 const innerOortSizes = new Float32Array(innerOortCount);
 
 for (let i = 0; i < innerOortCount; i++) {
 // Spherical distribution
 const theta = Math.random() * Math.PI * 2; // Azimuth
 const phi = Math.acos(2 * Math.random() - 1); // Inclination (uniform sphere)
 const radius = innerRadius + Math.random() * (outerRadius - innerRadius) * 0.3; // Inner 30%
 
 innerOortPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 innerOortPositions[i * 3 + 1] = radius * Math.cos(phi);
 innerOortPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
 
 // Icy composition: pale white-blue
 const ice = 0.6 + Math.random() * 0.3;
 innerOortColors[i * 3] = ice * 0.85;
 innerOortColors[i * 3 + 1] = ice * 0.9;
 innerOortColors[i * 3 + 2] = ice;
 
 innerOortSizes[i] = 3 + Math.random() * 5;
 }
 
 innerOortGeometry.setAttribute('position', new THREE.BufferAttribute(innerOortPositions, 3));
 innerOortGeometry.setAttribute('color', new THREE.BufferAttribute(innerOortColors, 3));
 innerOortGeometry.setAttribute('size', new THREE.BufferAttribute(innerOortSizes, 1));
 
 const innerOortMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.7
 });
 
 const innerOort = new THREE.Points(innerOortGeometry, innerOortMaterial);
 oortCloudGroup.add(innerOort);
 
 // Outer Oort Cloud - sparse, spherical shell
 const outerOortCount = 1500;
 const outerOortGeometry = new THREE.BufferGeometry();
 const outerOortPositions = new Float32Array(outerOortCount * 3);
 const outerOortColors = new Float32Array(outerOortCount * 3);
 const outerOortSizes = new Float32Array(outerOortCount);
 
 for (let i = 0; i < outerOortCount; i++) {
 // Spherical distribution
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const radius = innerRadius + (outerRadius - innerRadius) * (0.3 + Math.random() * 0.7); // Outer 70%
 
 outerOortPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 outerOortPositions[i * 3 + 1] = radius * Math.cos(phi);
 outerOortPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
 
 // Very faint icy objects
 const faint = 0.5 + Math.random() * 0.25;
 outerOortColors[i * 3] = faint * 0.82;
 outerOortColors[i * 3 + 1] = faint * 0.88;
 outerOortColors[i * 3 + 2] = faint * 0.95;
 
 outerOortSizes[i] = 2 + Math.random() * 4;
 }
 
 outerOortGeometry.setAttribute('position', new THREE.BufferAttribute(outerOortPositions, 3));
 outerOortGeometry.setAttribute('color', new THREE.BufferAttribute(outerOortColors, 3));
 outerOortGeometry.setAttribute('size', new THREE.BufferAttribute(outerOortSizes, 1));
 
 const outerOortMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.5
 });
 
 const outerOort = new THREE.Points(outerOortGeometry, outerOortMaterial);
 oortCloudGroup.add(outerOort);
 
 // Sparse cometary nuclei - the source of long-period comets
 const cometaryCount = 400;
 const cometaryGeometry = new THREE.BufferGeometry();
 const cometaryPositions = new Float32Array(cometaryCount * 3);
 const cometaryColors = new Float32Array(cometaryCount * 3);
 const cometarySizes = new Float32Array(cometaryCount);
 
 for (let i = 0; i < cometaryCount; i++) {
 // Random spherical distribution
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
 
 cometaryPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 cometaryPositions[i * 3 + 1] = radius * Math.cos(phi);
 cometaryPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
 
 // Slightly brighter to represent larger nuclei
 const bright = 0.65 + Math.random() * 0.25;
 cometaryColors[i * 3] = bright * 0.88;
 cometaryColors[i * 3 + 1] = bright * 0.92;
 cometaryColors[i * 3 + 2] = bright;
 
 cometarySizes[i] = 4 + Math.random() * 6;
 }
 
 cometaryGeometry.setAttribute('position', new THREE.BufferAttribute(cometaryPositions, 3));
 cometaryGeometry.setAttribute('color', new THREE.BufferAttribute(cometaryColors, 3));
 cometaryGeometry.setAttribute('size', new THREE.BufferAttribute(cometarySizes, 1));
 
 const cometaryMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.7
 });
 
 const cometaryNuclei = new THREE.Points(cometaryGeometry, cometaryMaterial);
 oortCloudGroup.add(cometaryNuclei);
 
 oortCloudGroup.userData = {
 name: 'oortCloud',
 type: 'oortCloud',
 description: t('descOortCloud'),
 funFact: t('funFactOortCloud'),
 count: innerOortCount + outerOortCount + cometaryCount,
 radius: this.realisticScale ? 60000 : 9000
 };
 
 scene.add(oortCloudGroup);
 this.oortCloud = oortCloudGroup;
 this.objects.push(oortCloudGroup);
 
 if (DEBUG.enabled) console.log(`[OORT] ${innerOortCount + outerOortCount + cometaryCount} objects (${this.realisticScale ? 'Realistic (20k–60k units)' : 'Educational (3k–9k units)'} scale)`);
 }

 createOrbitalPaths(scene) {
 this.orbitsVisible = true; // Default
 this.cometOrbitsVisible = true; // Default
 this.orbits = [];
 
 const planetsToOrbit = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
 
 // Create empty line objects, we will update their geometry in updateOrbitalPaths()
 planetsToOrbit.forEach(planetName => {
 const planet = this.planets[planetName];
 if (planet && planet.userData) {
 const isDwarf = planet.userData.type === 'DwarfPlanet';
 const geometry = new THREE.BufferGeometry();
 const material = new THREE.LineBasicMaterial({
 color: isDwarf ? 0x9966CC : 0x4488CC,
 transparent: true,
 opacity: 0.5,
 depthWrite: false
 });
 
 const orbitLine = new THREE.Line(geometry, material);
 orbitLine.visible = this.orbitsVisible;
 orbitLine.renderOrder = 1; // Prevent z-fighting with transparent rings/glows
 orbitLine.userData = { type: 'orbit', planet: planetName, isDwarf: isDwarf };
 scene.add(orbitLine);
 this.orbits.push(orbitLine);
 }
 });
 
 // Moon orbital paths around their planets
 Object.values(this.planets).forEach(planet => {
 if (planet.userData.moons && planet.userData.moons.length > 0) {
 planet.userData.moons.forEach(moon => {
 const geometry = new THREE.BufferGeometry();
 const material = new THREE.LineBasicMaterial({
 color: 0xAADDFF,
 transparent: true,
 opacity: 0.5,
 depthWrite: false
 });

 const orbitLine = new THREE.Line(geometry, material);
 orbitLine.visible = this.orbitsVisible;
 orbitLine.renderOrder = 1;
 orbitLine.userData = { type: 'moonOrbit', moon: moon.userData.name, planet: planet.userData.name };
 planet.add(orbitLine);
 this.orbits.push(orbitLine);
 });
 }
 });

 // Fill the geometry using the unified tracing logic
 this.updateOrbitalPaths();
 }

 createStarfield(scene) {
 // Enhanced starfield based on real astronomical data
 // Uses Hertzsprung-Russell diagram for realistic stellar populations
 const starGeometry = new THREE.BufferGeometry();
 const starCount = IS_MOBILE ? 4000 : 20000; // Richer sky on desktop; lighter on mobile
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

 // Custom ShaderMaterial replaces PointsMaterial for circular glow sprites.
 // Each star renders as a circular disk with a bright core and soft halo,
 // creating the characteristic "star diffraction" look.
 // opacityFade uniform allows the galaxy-view fade logic to dim stars smoothly.
 const starMaterial = new THREE.ShaderMaterial({
 uniforms: { opacityFade: { value: 1.0 } },
 vertexShader: /* glsl */`
 attribute float size;
 attribute vec3 color;
 varying vec3 vColor;
 void main() {
 vColor = color;
 // Fixed pixel size (no perspective attenuation — stars are effectively at infinity)
 gl_PointSize = clamp(size * 1.6, 1.0, 6.0);
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }
 `,
 fragmentShader: /* glsl */`
 uniform float opacityFade;
 varying vec3 vColor;
 void main() {
 // gl_PointCoord is 0..1 within the point sprite; centre it at (0,0)
 vec2 uv = gl_PointCoord - vec2(0.5);
 float dist = length(uv);
 if (dist > 0.5) discard; // circular clipping
 // Bright core with exponential falloff + soft outer halo
 float core = 1.0 - smoothstep(0.0, 0.18, dist);
 float halo = pow(clamp(1.0 - dist * 2.0, 0.0, 1.0), 3.5) * 0.45;
 float alpha = clamp(core + halo, 0.0, 1.0) * opacityFade;
 gl_FragColor = vec4(vColor, alpha);
 }
 `,
 transparent: true,
 depthWrite: false,
 blending: THREE.AdditiveBlending
 });

 this.starfield = new THREE.Points(starGeometry, starMaterial);
 this.starfield.name = 'starfield';
 this.starfield.frustumCulled = false;
 scene.add(this.starfield);

 // Pre-compute twinkle jitter table so the hot path makes zero Math.random() calls.
 // 30 entries: 16-bit index (proportional 0–1) and float size (1–3).
 const twinkleCount = 30;
 this._starTwinkleRatios = new Float32Array(twinkleCount); // 0..1 ratios into sizes array
 this._starTwinkleSizes = new Float32Array(twinkleCount); // new size values
 for (let i = 0; i < twinkleCount; i++) {
 this._starTwinkleRatios[i] = Math.random();
 this._starTwinkleSizes[i] = 1 + Math.random() * 2;
 }
 this._starTwinklePtr = 0; // round-robin cursor through the table

 if (DEBUG.enabled) {
 const count = IS_MOBILE ? 4000 : 20000;
 console.log(` Starfield created with ${count} stars based on H-R diagram stellar distribution`);
 }
 }

 createMilkyWay(scene) {
 // The Milky Way band as seen from Earth — a dense river of stars across the sky.
 // Oriented using real astronomical coordinates (J2000 equatorial):
 //   Galactic north pole: RA 192.85°, Dec +27.13°
 //   Galactic centre:     RA 266.40°, Dec −29.00°

 const particleCount = IS_MOBILE ? 7000 : 14000;
 const positions = new Float32Array(particleCount * 3);
 const colors = new Float32Array(particleCount * 3);

 // Equatorial → Three.js Cartesian: x=cos(dec)cos(ra), y=sin(dec), z=−cos(dec)sin(ra)
 const toCart = (raDeg, decDeg) => {
 const ra = raDeg * Math.PI / 180;
 const dec = decDeg * Math.PI / 180;
 return new THREE.Vector3(
 Math.cos(dec) * Math.cos(ra),
 Math.sin(dec),
 -Math.cos(dec) * Math.sin(ra)
 ).normalize();
 };

 const galNormal = toCart(192.85, 27.13); // galactic north pole
 const galCenter = toCart(266.40, -29.00); // direction to galactic core (Sagittarius)
 // Build orthonormal basis in the galactic plane
 const galRight = new THREE.Vector3().crossVectors(galNormal, galCenter).normalize();
 const galForward = new THREE.Vector3().crossVectors(galRight, galNormal).normalize();

 // Box-Muller gaussian for band latitude spread
 const gaussian = () => {
 const u1 = Math.max(1e-10, Math.random());
 const u2 = Math.random();
 return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
 };

 for (let i = 0; i < particleCount; i++) {
 // Galactic longitude: uniform around the full circle
 const lon = Math.random() * 2 * Math.PI;
 // Galactic latitude: gaussian ±10° — the band is ~5–20° wide
 const lat = gaussian() * (10 * Math.PI / 180);

 // Orthonormal direction in galactic coordinates
 const inPlane = new THREE.Vector3(
 Math.cos(lon) * galForward.x + Math.sin(lon) * galRight.x,
 Math.cos(lon) * galForward.y + Math.sin(lon) * galRight.y,
 Math.cos(lon) * galForward.z + Math.sin(lon) * galRight.z
 );
 const dir = new THREE.Vector3(
 Math.cos(lat) * inPlane.x + Math.sin(lat) * galNormal.x,
 Math.cos(lat) * inPlane.y + Math.sin(lat) * galNormal.y,
 Math.cos(lat) * inPlane.z + Math.sin(lat) * galNormal.z
 ).normalize();

 // Place on far sphere (beyond the regular starfield at ~15k–25k)
 const radius = 17000 + (Math.random() - 0.5) * 2000;
 positions[i * 3] = dir.x * radius;
 positions[i * 3 + 1] = dir.y * radius;
 positions[i * 3 + 2] = dir.z * radius;

 // Density/colour boost toward galactic centre
 const coreAlign = Math.max(0, dir.dot(galCenter)); // 0 → 1
 const coreGlow = coreAlign * coreAlign;

 // Warm-white band: yellower near core, blue-white toward anti-centre
 const r = 0.65 + 0.35 * coreGlow;
 const g = 0.65 + 0.20 * coreGlow;
 const b = 0.55 - 0.15 * coreGlow;
 const brightness = 0.20 + 0.70 * coreGlow + Math.random() * 0.25;
 colors[i * 3] = Math.min(1, r * brightness);
 colors[i * 3 + 1] = Math.min(1, g * brightness);
 colors[i * 3 + 2] = Math.min(1, b * brightness);
 }

 const geometry = new THREE.BufferGeometry();
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

 const material = new THREE.PointsMaterial({
 size: 1.6,
 vertexColors: true,
 transparent: true,
 opacity: 0.65, // always visible
 sizeAttenuation: false,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });

 this.milkyWay = new THREE.Points(geometry, material);
 this.milkyWay.name = 'milkyWay';
 this.milkyWay.frustumCulled = false;
 scene.add(this.milkyWay);

 // ===== MILKY WAY GALAXY DISC (visible when zoomed far out) =====
 // A large spiral galaxy sprite that becomes visible when the camera
 // is beyond the constellation sphere, showing our solar system within
 // the Milky Way. Uses a procedurally generated spiral texture.
 this._createMilkyWayGalaxyDisc(scene);

 if (DEBUG.enabled) {
 console.log(` Milky Way created with ${particleCount} particles (galactic-plane orientation)`);
 }
 }

 _createMilkyWayGalaxyDisc(scene) {
 const texSize = IS_MOBILE ? 512 : 1024;

 // Try to load NASA Milky Way image, fall back to procedural generation
 const loader = new THREE.TextureLoader();
 loader.load(
 './textures/galaxies/milky_way_nasa.webp',
 (nasaTexture) => {
 if (DEBUG.TEXTURES) console.log(' Loaded NASA Milky Way texture');
 // The NASA illustration shows a face-on spiral centered in the image.
 // The Sun sits on the Orion Arm, ~26,000 ly from center (~58% out).
 // In this image the Sun is approximately at 67% right, 38% down.
 const solarX = texSize * 0.67;
 const solarY = texSize * 0.38;
 this._buildMilkyWayDisc(scene, nasaTexture, texSize, solarX, solarY);
 },
 undefined,
 () => {
 if (DEBUG.TEXTURES) console.warn(' NASA Milky Way texture failed, using procedural');
 const { texture, solarX, solarY } = this._generateProceduralMilkyWay(texSize);
 this._buildMilkyWayDisc(scene, texture, texSize, solarX, solarY);
 }
 );
 }

 _generateProceduralMilkyWay(texSize) {
 const canvas = document.createElement('canvas');
 canvas.width = texSize;
 canvas.height = texSize;
 const ctx = canvas.getContext('2d');

 // Black background (transparent edges)
 ctx.fillStyle = 'rgba(0,0,0,0)';
 ctx.fillRect(0, 0, texSize, texSize);

 const cx = texSize / 2;
 const cy = texSize / 2;
 const maxR = texSize * 0.45;

 // Draw galactic core glow
 const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.15);
 coreGrad.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
 coreGrad.addColorStop(0.5, 'rgba(255, 220, 160, 0.5)');
 coreGrad.addColorStop(1, 'rgba(200, 180, 140, 0)');
 ctx.fillStyle = coreGrad;
 ctx.fillRect(0, 0, texSize, texSize);

 // Draw spiral arms with many small dots
 const armCount = 4; // Milky Way has ~4 major arms
 const turns = 2.5;
 for (let arm = 0; arm < armCount; arm++) {
 const armOffset = (arm / armCount) * Math.PI * 2;
 for (let i = 0; i < 8000; i++) {
 const t = Math.random();
 const r = t * maxR;
 const theta = armOffset + t * turns * Math.PI * 2;
 // Add spread perpendicular to the arm
 const spread = (Math.random() - 0.5) * maxR * 0.12 * (0.3 + t * 0.7);
 const px = cx + Math.cos(theta) * r + Math.cos(theta + Math.PI / 2) * spread;
 const py = cy + Math.sin(theta) * r + Math.sin(theta + Math.PI / 2) * spread;

 // Color: warm at center, blue-white at edges
 const warmth = 1 - t;
 const brightness = (0.4 + Math.random() * 0.6) * (0.3 + warmth * 0.7);
 const red = Math.floor((180 + warmth * 75) * brightness);
 const green = Math.floor((180 + warmth * 50) * brightness);
 const blue = Math.floor((200 + t * 55) * brightness);

 ctx.fillStyle = `rgba(${red},${green},${blue},${0.15 + Math.random() * 0.25})`;
 const dotSize = 0.5 + Math.random() * 1.5;
 ctx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize);
 }
 }

 // Diffuse galactic glow
 const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
 outerGrad.addColorStop(0, 'rgba(200, 190, 170, 0.15)');
 outerGrad.addColorStop(0.4, 'rgba(180, 175, 165, 0.08)');
 outerGrad.addColorStop(1, 'rgba(100, 100, 120, 0)');
 ctx.fillStyle = outerGrad;
 ctx.fillRect(0, 0, texSize, texSize);

 // Mark solar system position (~26,000 ly from center, ~58% out)
 // Place the dot ON an arm by using the exact same spiral formula:
 // theta = armOffset + t * turns * 2π, with t = 0.58
 // Use arm index 1 (the Orion-Cygnus arm, between Sagittarius and Perseus)
 const solarT = 0.58;
 const solarArmOffset = (1 / armCount) * Math.PI * 2; // Arm #1
 const solarAngle = solarArmOffset + solarT * turns * Math.PI * 2;
 const solarR = maxR * solarT;
 const solarX = cx + Math.cos(solarAngle) * solarR;
 const solarY = cy + Math.sin(solarAngle) * solarR;
 ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
 ctx.beginPath();
 ctx.arc(solarX, solarY, 2, 0, Math.PI * 2);
 ctx.fill();
 // Tiny label
 ctx.fillStyle = 'rgba(150, 220, 255, 0.6)';
 ctx.font = `${Math.round(texSize / 80)}px sans-serif`;
 ctx.fillText('☉', solarX + 4, solarY + 1);

 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;

 return { texture, solarX, solarY };
 }

 _buildMilkyWayDisc(scene, texture, texSize, solarX, solarY) {
 // Create the disc as a large plane
 const discSize = 50000; // Very large, seen only from far out
 const discGeometry = new THREE.PlaneGeometry(discSize, discSize);
 const discMaterial = new THREE.MeshBasicMaterial({
 map: texture,
 transparent: true,
 opacity: 0, // Starts invisible, fades in with distance
 side: THREE.DoubleSide,
 depthWrite: false,
 blending: THREE.AdditiveBlending
 });

 this.milkyWayDisc = new THREE.Mesh(discGeometry, discMaterial);
 this.milkyWayDisc.name = 'milkyWayGalaxyDisc';

 // Tilt to match galactic plane (62.87° from celestial equator)
 this.milkyWayDisc.rotation.x = -Math.PI / 2; // Flat on ecliptic first
 this.milkyWayDisc.rotation.z = 62.87 * Math.PI / 180; // Galactic tilt

 // Compute the exact local position of the sun dot on the plane geometry
 const sunLocalX = (solarX / texSize - 0.5) * discSize;
 const sunLocalY = -(solarY / texSize - 0.5) * discSize; // Texture Y is down, Plane Y is up
 const sunLocalPos = new THREE.Vector3(sunLocalX, sunLocalY, 0);

 // Rotate that local position by the disc's orientation to get the world displacement
 sunLocalPos.applyEuler(this.milkyWayDisc.rotation);

 // Shift the entire disc by the inverse of that displacement
 // This perfectly anchors the sun dot to world origin (0, 0, 0)
 this.milkyWayDisc.position.copy(sunLocalPos).negate();

 this.milkyWayDisc.frustumCulled = false;
 this.milkyWayDisc.renderOrder = -1; // Behind everything

 this.milkyWayDisc.userData = {
 name: t('milkyWayGalaxy'),
 type: 'milkyWay',
 radius: 25000, // Half of discSize (50000) at educational scale
 description: t('descMilkyWay'),
 funFact: t('funFactMilkyWay'),
 realSize: '100,000 light-years diameter (~200,000 including halo)',
 basePosition: this.milkyWayDisc.position.clone() // stored for scale changes
 };

 // If scene is already in realistic mode at creation time, apply scale immediately
 if (this.realisticScale) {
 const s = 18000 / 2700; // ≈6.667
 this.milkyWayDisc.scale.setScalar(s);
 this.milkyWayDisc.position.multiplyScalar(s);
 }

 this._createMilkyWaySolarLocator(discSize, texSize, solarX, solarY);

 scene.add(this.milkyWayDisc);
 this.objects.push(this.milkyWayDisc);

 if (DEBUG.enabled) console.log('[MilkyWay] Galaxy disc created (fades in at distance)');
 }

 _createMilkyWaySolarLocator(discSize, texSize, solarX, solarY) {
 const localX = ((solarX / texSize) - 0.5) * discSize;
 const localY = (0.5 - (solarY / texSize)) * discSize;
 const locatorGroup = new THREE.Group();
 locatorGroup.name = 'milkyWaySolarLocator';
 locatorGroup.position.set(localX, localY, 0);

 const ring = new THREE.Mesh(
  new THREE.RingGeometry(420, 640, 48),
  new THREE.MeshBasicMaterial({
   color: 0x6FD6FF,
   transparent: true,
   opacity: 0.7,
   side: THREE.DoubleSide,
   depthWrite: false,
   blending: THREE.AdditiveBlending
  })
 );
 ring.renderOrder = 3;
 locatorGroup.add(ring);

 const beaconLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
   new THREE.Vector3(0, 0, -250),
   new THREE.Vector3(0, 0, 1800)
  ]),
  new THREE.LineBasicMaterial({
   color: 0x8FE7FF,
   transparent: true,
   opacity: 0.65,
   depthWrite: false,
   blending: THREE.AdditiveBlending
  })
 );
 beaconLine.renderOrder = 3;
 locatorGroup.add(beaconLine);

 const glowCanvas = document.createElement('canvas');
 glowCanvas.width = 128;
 glowCanvas.height = 128;
 const glowCtx = glowCanvas.getContext('2d');
 const glowGrad = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
 glowGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
 glowGrad.addColorStop(0.18, 'rgba(170,230,255,0.95)');
 glowGrad.addColorStop(0.45, 'rgba(90,200,255,0.4)');
 glowGrad.addColorStop(1, 'rgba(90,200,255,0)');
 glowCtx.fillStyle = glowGrad;
 glowCtx.fillRect(0, 0, 128, 128);
 const glowTexture = new THREE.CanvasTexture(glowCanvas);
 const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture,
  transparent: true,
  opacity: 0.9,
  depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true
 }));
 glowSprite.scale.set(1600, 1600, 1);
 glowSprite.position.set(0, 0, 150);
 glowSprite.renderOrder = 4;
 locatorGroup.add(glowSprite);

 const labelTexture = this._buildMilkyWaySolarLabelTexture();
 const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: labelTexture,
  transparent: true,
  opacity: 0.92,
  depthTest: false,
  depthWrite: false,
  sizeAttenuation: true
 }));
 labelSprite.scale.set(5200, 1080, 1);
 labelSprite.position.set(0, 0, 2750);
 labelSprite.renderOrder = 4;
 locatorGroup.add(labelSprite);

 locatorGroup.userData = {
  ring,
  beaconLine,
  glowSprite,
    labelSprite,
    labelTexture
 };

 this.milkyWayDisc.add(locatorGroup);
 this.milkyWaySolarLocator = locatorGroup;
 }

 _buildMilkyWaySolarLabelTexture() {
 const labelCanvas = document.createElement('canvas');
 labelCanvas.width = 768;
 labelCanvas.height = 160;
 const labelCtx = labelCanvas.getContext('2d');
 labelCtx.fillStyle = 'rgba(4, 12, 20, 0.82)';
 labelCtx.beginPath();
 if (labelCtx.roundRect) labelCtx.roundRect(8, 18, 752, 106, 24);
 else labelCtx.rect(8, 18, 752, 106);
 labelCtx.fill();
 labelCtx.strokeStyle = 'rgba(111, 214, 255, 0.7)';
 labelCtx.lineWidth = 3;
 labelCtx.stroke();
 labelCtx.fillStyle = 'rgba(220, 245, 255, 0.96)';
 labelCtx.font = 'bold 54px "Segoe UI", sans-serif';
 labelCtx.textAlign = 'center';
 labelCtx.textBaseline = 'middle';
 labelCtx.fillText(t('solarSystemMarker'), 384, 72);
 labelCtx.fillStyle = 'rgba(155, 216, 240, 0.9)';
 labelCtx.font = '28px "Segoe UI", sans-serif';
 labelCtx.fillText(t('solarSystemMarkerSubtext'), 384, 112);
 return new THREE.CanvasTexture(labelCanvas);
 }

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

 async loadTextureWithFallback(url, fallbackColor) {
 // Try to load real imagery, fallback to color if it fails
 return new Promise((resolve) => {
 const loader = new THREE.TextureLoader();
 loader.load(
 url,
 (texture) => {
 if (DEBUG.TEXTURES) console.log(` Loaded texture: ${url}`);
 resolve(texture);
 },
 undefined,
 (error) => {
 if (DEBUG.TEXTURES) console.warn(` Failed to load ${url}, using fallback color`);
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

 createNebulae(scene) {
 // Create colorful nebulae with procedural generation
 this.nebulae = [];
 
 const nebulaeData = [
 { 
 name: 'Orion Nebula', id: 'orionNebula',
 ra: 83.8, // 5h 35m - Located in Orion's sword
 dec: -5.4, // -5° 23' - Below Orion's belt
 size: 400, 
 type: 'emission', // Star-forming region
 // Spectral emission colors (astronomically accurate)
 colors: {
 hydrogen: 0xFF2244,    // H-alpha (656.3 nm) - Deep red
 oxygen: 0x00FF88,      // O-III (495.9, 500.7 nm) - Cyan-green
 sulfur: 0xFF6644,      // S-II (671.6, 673.1 nm) - Red-orange
 continuum: 0xCCDDFF    // Reflected starlight - Blue-white
 },
 brightness: 1.2,        // Orion is very bright
 density: 0.7,           // High density gas cloud
 turbulence: 0.4,        // Moderate turbulence
 centralStars: 4,        // Trapezium cluster
 description: t('descOrionNebula')
 },
 { 
 name: 'Crab Nebula', id: 'crabNebula',
 ra: 83.6, // 5h 34m - In Taurus constellation
 dec: 22.0, // +22° 01' - Near Taurus's northern horn
 size: 300, 
 type: 'supernova', // Supernova remnant with filaments
 colors: {
 hydrogen: 0xFF4422,    // H-alpha filaments - Orange-red
 synchrotron: 0x88CCFF, // Synchrotron radiation - Blue-white
 oxygen: 0x00DD66,      // O-III emission
 continuum: 0xAABBDD    // Background glow
 },
 brightness: 0.9,
 density: 0.3,           // Lower density, expanding shell
 turbulence: 0.8,        // High turbulence from explosion
 filaments: true,        // Distinct filamentary structure
 pulsar: true,           // Central pulsar (animated)
 expansionRate: 0.002,   // Expanding at 1,500 km/s
 description: t('descCrabNebula')
 },
 { 
 name: 'Ring Nebula', id: 'ringNebula',
 ra: 283.4, // 18h 53m - In Lyra constellation, near Vega
 dec: 33.0, // +33° 02' - Between Sheliak and Sulafat
 size: 250, 
 type: 'planetary', // Planetary nebula (ring shape)
 colors: {
 oxygen: 0x44DDAA,      // O-III inner ring - Blue-green
 hydrogen: 0xFF3355,    // H-alpha outer halo - Deep red
 helium: 0xFFAA66,      // He-II emission - Orange
 continuum: 0xEEEEFF    // Central star light
 },
 brightness: 0.7,
 density: 0.5,
 turbulence: 0.2,        // Low turbulence, symmetric
 ringStructure: true,    // Distinct ring/torus shape
 centralStar: true,      // White dwarf at center
 innerRadius: 0.4,       // Ring proportions
 outerRadius: 0.7,
 description: t('descRingNebula')
 },
 {
 name: 'Eagle Nebula', id: 'eagleNebula',
 ra: 274.7,  // 18h 18m - In Serpens Cauda, near Messier 16
 dec: -13.8, // -13° 47' - Southern equatorial sky
 size: 420,
 type: 'emission', // Star-forming emission nebula (Pillars of Creation)
 colors: {
 hydrogen: 0xFF2244,    // H-alpha - Deep red
 oxygen: 0x00CCAA,      // O-III - Teal-green
 sulfur: 0xFF8833,      // S-II - Orange
 continuum: 0xCCDDFF    // Young star light
 },
 brightness: 1.0,
 density: 0.65,
 turbulence: 0.5,
 centralStars: 8,
 description: t('descEagleNebula')
 },
 {
 name: 'Helix Nebula', id: 'helixNebula',
 ra: 337.4,  // 22h 29m - In Aquarius constellation
 dec: -20.8, // -20° 50' - Southern autumn sky
 size: 350,
 type: 'planetary', // Closest large planetary nebula — the 'Eye of God'
 colors: {
 oxygen: 0x00EEBB,     // O-III inner zone - Blue-green
 hydrogen: 0xFF3355,   // H-alpha outer ring - Red
 helium: 0xFFBB88,     // He-II - Orange
 continuum: 0xDDEEFF   // Central white dwarf
 },
 brightness: 0.8,
 density: 0.45,
 turbulence: 0.15,
 ringStructure: true,
 centralStar: true,
 innerRadius: 0.3,
 outerRadius: 0.65,
 description: t('descHelixNebula')
 },
 {
 name: 'Lagoon Nebula', id: 'lagoonNebula',
 ra: 271.1,  // 18h 03m - In Sagittarius constellation
 dec: -24.4, // -24° 23' - Southern summer sky, near galactic centre
 size: 450,
 type: 'emission', // Active star-forming region
 colors: {
 hydrogen: 0xFF2244,   // H-alpha - Deep red
 oxygen: 0x00CC88,     // O-III - Cyan-green
 sulfur: 0xFF7733,     // S-II - Orange-red
 continuum: 0xBBCCEE  // Background starlight
 },
 brightness: 1.1,
 density: 0.75,
 turbulence: 0.45,
 centralStars: 6,
 description: t('descLagoonNebula')
 },
 {
 name: 'Butterfly Nebula', id: 'butterflyNebula',
 ra: 261.0,  // 17h 13m - In Scorpius constellation
 dec: -37.1, // -37° 06' - Far southern sky
 size: 280,
 type: 'planetary', // Extreme bipolar planetary nebula (Bug / Butterfly)
 colors: {
 oxygen: 0x44DDCC,    // O-III hot lobes - Cyan
 hydrogen: 0xFF4422,  // H-alpha outer wings - Orange-red
 helium: 0xFFDD88,    // He-II - Yellow-orange
 continuum: 0xFFFFFF  // Extremely hot central star — one of Milky Way's hottest
 },
 brightness: 0.85,
 density: 0.4,
 turbulence: 0.55,
 ringStructure: false,
 centralStar: true,
 description: t('descButterflyNebula')
 }
 ];

 // Real image texture paths for nebulae (fall back to procedural if missing)
 const nebulaeTextures = {
 'Orion Nebula':     './textures/nebulae/orion_nebula.webp',
 'Crab Nebula':      './textures/nebulae/crab_nebula.webp',
 'Ring Nebula':      './textures/nebulae/ring_nebula.webp',
 'Eagle Nebula':     './textures/nebulae/eagle_nebula.webp',
 'Helix Nebula':     './textures/nebulae/helix_nebula.webp',
 'Lagoon Nebula':    './textures/nebulae/lagoon_nebula.webp',
 'Butterfly Nebula': './textures/nebulae/butterfly_nebula.webp'
 };

 for (const nebData of nebulaeData) {
 const group = new THREE.Group();
 const realTexturePath = nebulaeTextures[nebData.name];
 
 if (realTexturePath) {
 // Load and pixel-process: alpha = luminance_curve * radial_fade
 // Makes dark background fully transparent, bright nebula stays visible
 this._loadDeepSkySprite(
 realTexturePath,
 (processedTex) => {
 // Use a plain Mesh so it sits statically in world space.
 // THREE.Sprite auto-billboards every frame, making it appear
 // to "float" as the VR user turns their head.
 const nebMat = new THREE.MeshBasicMaterial({
 map: processedTex,
 transparent: true,
 opacity: 0.95,
 depthWrite: false,
 blending: THREE.AdditiveBlending,
 side: THREE.DoubleSide
 });
 const geo = new THREE.PlaneGeometry(nebData.size * 2, nebData.size * 2);
 const mesh = new THREE.Mesh(geo, nebMat);
 group.add(mesh);
 // Orient the plane toward the scene centre so it's visible from origin.
 group.updateMatrixWorld(true);
 mesh.lookAt(new THREE.Vector3(0, 0, 0));
 },
 () => { // onError: fall back to procedural
 this.createHyperrealisticNebula(group, nebData);
 }
 );
 } else {
 // Create hyperrealistic multi-layer nebula (procedural)
 this.createHyperrealisticNebula(group, nebData);
 }
 
 // Convert RA/Dec to 3D Cartesian coordinates (like constellations)
 // Nebulae should be positioned farther out than constellations
 const nebulaDistance = CONFIG.CONSTELLATION.DISTANCE * 1.5; // Place nebulae 1.5x farther than constellations
 const position = CoordinateUtils.sphericalToCartesian(
 nebData.ra,
 nebData.dec,
 nebulaDistance
 );
 
 group.position.set(position.x, position.y, position.z);
 
 group.userData = {
 name: nebData.id || nebData.name,
 type: 'nebula',
 radius: nebData.size,
 description: nebData.description,
 distance: 'Thousands of light-years',
 funFact: ({
 orionNebula:     t('funFactOrionNebula'),
 crabNebula:      t('funFactCrabNebula'),
 ringNebula:      t('funFactRingNebula'),
 eagleNebula:     t('funFactEagleNebula'),
 helixNebula:     t('funFactHelixNebula'),
 lagoonNebula:    t('funFactLagoonNebula'),
 butterflyNebula: t('funFactButterflyNebula'),
 })[nebData.id] || t('funFactRingNebula'),
 ra: nebData.ra,
 dec: nebData.dec,
 basePosition: { x: position.x, y: position.y, z: position.z }
 };
 
 scene.add(group);
 this.objects.push(group);
 this.nebulae.push(group);
 }
 }

 createHyperrealisticNebula(group, nebData) {
 // Create multi-layer hyperrealistic procedural nebula
 // Using spectral emission colors and volumetric rendering techniques
 
 const particleCount = 15000; // More particles for detail
 
 // === LAYER 1: Primary Emission (H-alpha) ===
 if (nebData.colors.hydrogen) {
 const hydrogenLayer = this.createNebulaLayer(
 nebData, 
 nebData.colors.hydrogen, 
 particleCount * 0.4, // 40% of particles
 1.0, // Full size
 0.7, // Opacity
 nebData.brightness * 0.8
 );
 group.add(hydrogenLayer);
 }
 
 // === LAYER 2: Oxygen Emission (O-III) ===
 if (nebData.colors.oxygen) {
 const oxygenLayer = this.createNebulaLayer(
 nebData, 
 nebData.colors.oxygen, 
 particleCount * 0.3, // 30% of particles
 0.85, // Slightly smaller
 0.6, // More transparent
 nebData.brightness * 0.6
 );
 group.add(oxygenLayer);
 }
 
 // === LAYER 3: Sulfur/Helium Emission ===
 if (nebData.colors.sulfur || nebData.colors.helium) {
 const tertiaryColor = nebData.colors.sulfur || nebData.colors.helium;
 const tertiaryLayer = this.createNebulaLayer(
 nebData, 
 tertiaryColor, 
 particleCount * 0.15, // 15% of particles
 0.95,
 0.5,
 nebData.brightness * 0.5
 );
 group.add(tertiaryLayer);
 }
 
 // === LAYER 4: Dust/Dark Regions ===
 const dustLayer = this.createDustLayer(nebData, particleCount * 0.1);
 group.add(dustLayer);
 
 // === LAYER 5: Bright Core/Stars ===
 if (nebData.colors.continuum) {
 const coreLayer = this.createNebulaLayer(
 nebData, 
 nebData.colors.continuum, 
 particleCount * 0.05, // 5% bright core
 0.3, // Small core
 0.9,
 nebData.brightness * 1.5 // Very bright
 );
 group.add(coreLayer);
 }
 
 // === Add Central Stars ===
 if (nebData.centralStars) {
 for (let i = 0; i < nebData.centralStars; i++) {
 const star = this.createCentralStar(nebData, i);
 group.add(star);
 }
 }
 
 // === Add Pulsar (for Crab Nebula) ===
 if (nebData.pulsar) {
 const pulsar = this.createPulsar(nebData);
 group.add(pulsar);
 // Store for animation
 group.userData.pulsar = pulsar;
 }
 
 // === Add Central White Dwarf (for Ring Nebula) ===
 if (nebData.centralStar) {
 const whiteDwarf = this.createWhiteDwarf(nebData);
 group.add(whiteDwarf);
 }
 
 // === Filamentary Structure (for supernova) ===
 if (nebData.filaments) {
 const filamentLayer = this.createFilaments(nebData, particleCount * 0.2);
 group.add(filamentLayer);
 }
 }
 
 createNebulaLayer(nebData, colorHex, particleCount, sizeScale, opacity, brightness) {
 // Create a single emission layer with spectral color
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(particleCount * 3);
 const colors = new Float32Array(particleCount * 3);
 const sizes = new Float32Array(particleCount);
 
 const color = new THREE.Color(colorHex);
 
 for (let i = 0; i < particleCount; i++) {
 let x, y, z, density;
 
 if (nebData.type === 'planetary' && nebData.ringStructure) {
 // Ring/torus structure for planetary nebulae
 const angle = Math.random() * Math.PI * 2;
 const vertAngle = (Math.random() - 0.5) * Math.PI * 0.3; // Thickness
 const radiusVariation = Math.random();
 const radius = nebData.size * (nebData.innerRadius + radiusVariation * (nebData.outerRadius - nebData.innerRadius));
 
 x = radius * Math.cos(angle);
 y = radius * Math.sin(angle);
 z = radius * Math.sin(vertAngle) * 0.3; // Barrel shape
 
 // Density falloff from ring
 density = 1.0 - Math.abs(radiusVariation - 0.5) * 2.0;
 
 } else if (nebData.type === 'supernova') {
 // Expanding shell with filaments
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.random() * Math.PI;
 const r = Math.pow(Math.random(), 0.25) * nebData.size * sizeScale; // Bias toward shell
 
 x = r * Math.sin(phi) * Math.cos(theta);
 y = r * Math.sin(phi) * Math.sin(theta);
 z = r * Math.cos(phi);
 
 // Shell density (hollow center, dense shell)
 const normalizedR = r / (nebData.size * sizeScale);
 density = Math.exp(-Math.pow((normalizedR - 0.7) / 0.2, 2)); // Gaussian around r=0.7
 
 } else {
 // Emission nebula - cloudy, turbulent structure
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.random() * Math.PI;
 const r = Math.pow(Math.random(), 0.5 + nebData.density * 0.5) * nebData.size * sizeScale;
 
 // Add turbulence
 const turbulence = nebData.turbulence || 0.3;
 const turbX = (Math.random() - 0.5) * nebData.size * turbulence * 0.3;
 const turbY = (Math.random() - 0.5) * nebData.size * turbulence * 0.3;
 const turbZ = (Math.random() - 0.5) * nebData.size * turbulence * 0.3;
 
 x = r * Math.sin(phi) * Math.cos(theta) + turbX;
 y = r * Math.sin(phi) * Math.sin(theta) + turbY;
 z = r * Math.cos(phi) + turbZ;
 
 // Core-to-edge density gradient
 density = Math.pow(1.0 - r / (nebData.size * sizeScale), 2);
 }
 
 positions[i * 3] = x;
 positions[i * 3 + 1] = y;
 positions[i * 3 + 2] = z;
 
 // Color with brightness variation based on density
 const brightnessVar = 0.7 + Math.random() * 0.3;
 const densityBrightness = Math.pow(density, 0.5) * brightness * brightnessVar;
 
 colors[i * 3] = color.r * densityBrightness;
 colors[i * 3 + 1] = color.g * densityBrightness;
 colors[i * 3 + 2] = color.b * densityBrightness;
 
 // Size variation based on density
 sizes[i] = (2 + Math.random() * 4) * Math.pow(density, 0.3);
 }
 
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
 
 const material = new THREE.PointsMaterial({
 size: 2.5,
 vertexColors: true,
 transparent: true,
 opacity: opacity,
 blending: THREE.AdditiveBlending,
 sizeAttenuation: true,
 depthWrite: false
 });
 
 return new THREE.Points(geometry, material);
 }
 
 createDustLayer(nebData, particleCount) {
 // Create dark dust lanes (absorption)
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(particleCount * 3);
 const colors = new Float32Array(particleCount * 3);
 const sizes = new Float32Array(particleCount);
 
 const dustColor = new THREE.Color(0x222244); // Dark blue-grey
 
 for (let i = 0; i < particleCount; i++) {
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.random() * Math.PI;
 const r = Math.pow(Math.random(), 0.4) * nebData.size * 0.6;
 
 positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
 positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
 positions[i * 3 + 2] = r * Math.cos(phi);
 
 // Darker dust color
 const darkness = 0.3 + Math.random() * 0.3;
 colors[i * 3] = dustColor.r * darkness;
 colors[i * 3 + 1] = dustColor.g * darkness;
 colors[i * 3 + 2] = dustColor.b * darkness;
 
 sizes[i] = 3 + Math.random() * 5; // Larger dust particles
 }
 
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
 
 const material = new THREE.PointsMaterial({
 size: 3,
 vertexColors: true,
 transparent: true,
 opacity: 0.4,
 blending: THREE.NormalBlending, // Normal blending for dust (not additive)
 sizeAttenuation: true,
 depthWrite: false
 });
 
 return new THREE.Points(geometry, material);
 }
 
 createFilaments(nebData, particleCount) {
 // Create filamentary structures for supernova remnants
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(particleCount * 3);
 const colors = new Float32Array(particleCount * 3);
 const sizes = new Float32Array(particleCount);
 
 const filamentColor = new THREE.Color(nebData.colors.hydrogen);
 const numFilaments = 12; // Number of filament strands
 
 for (let i = 0; i < particleCount; i++) {
 // Pick a filament strand
 const strand = Math.floor(Math.random() * numFilaments);
 const strandAngle = (strand / numFilaments) * Math.PI * 2;
 const strandPhi = Math.random() * Math.PI;
 
 // Position along filament with noise
 const t = Math.random(); // Position along strand
 const r = t * nebData.size * 0.9;
 const noise = (Math.random() - 0.5) * 30;
 
 positions[i * 3] = (r * Math.sin(strandPhi) * Math.cos(strandAngle)) + noise;
 positions[i * 3 + 1] = (r * Math.sin(strandPhi) * Math.sin(strandAngle)) + noise;
 positions[i * 3 + 2] = (r * Math.cos(strandPhi)) + noise * 0.5;
 
 // Bright filament color
 const brightness = 0.8 + Math.random() * 0.4;
 colors[i * 3] = filamentColor.r * brightness;
 colors[i * 3 + 1] = filamentColor.g * brightness;
 colors[i * 3 + 2] = filamentColor.b * brightness;
 
 sizes[i] = 1 + Math.random() * 2; // Thin filaments
 }
 
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
 
 const material = new THREE.PointsMaterial({
 size: 1.5,
 vertexColors: true,
 transparent: true,
 opacity: 0.9,
 blending: THREE.AdditiveBlending,
 sizeAttenuation: true,
 depthWrite: false
 });
 
 return new THREE.Points(geometry, material);
 }
 
 createCentralStar(nebData, index) {
 // Create bright stars at nebula center (e.g., Trapezium in Orion)
 const starGroup = new THREE.Group();
 const offset = (index - nebData.centralStars / 2) * 15;
 
 // Star core
 const coreGeo = new THREE.SphereGeometry(5, 16, 16);
 const coreMat = new THREE.MeshBasicMaterial({
 color: 0xFFFFFF,
 transparent: true,
 opacity: 1.0,
 toneMapped: false
 });
 const core = new THREE.Mesh(coreGeo, coreMat);
 core.position.set(offset, offset * 0.3, 0);
 starGroup.add(core);
 
 // Star glow
 const glowGeo = new THREE.SphereGeometry(15, 16, 16);
 const glowMat = new THREE.MeshBasicMaterial({
 color: 0xCCDDFF,
 transparent: true,
 opacity: 0.4,
 blending: THREE.AdditiveBlending
 });
 const glow = new THREE.Mesh(glowGeo, glowMat);
 glow.position.copy(core.position);
 starGroup.add(glow);
 
 return starGroup;
 }
 
 createPulsar(nebData) {
 // Create animated pulsar for Crab Nebula
 const pulsarGroup = new THREE.Group();
 
 // Pulsar core (will pulse)
 const coreGeo = new THREE.SphereGeometry(3, 16, 16);
 const coreMat = new THREE.MeshBasicMaterial({
 color: 0xFFFFFF,
 transparent: true,
 opacity: 1.0,
 toneMapped: false
 });
 const core = new THREE.Mesh(coreGeo, coreMat);
 pulsarGroup.add(core);
 
 // Store for animation
 pulsarGroup.userData.pulsarCore = core;
 pulsarGroup.userData.pulsarMaterial = coreMat;
 pulsarGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
 
 return pulsarGroup;
 }
 
 createWhiteDwarf(nebData) {
 // Create white dwarf star at center of planetary nebula
 const starGroup = new THREE.Group();
 
 // White dwarf core
 const coreGeo = new THREE.SphereGeometry(4, 16, 16);
 const coreMat = new THREE.MeshBasicMaterial({
 color: 0xEEFFFF,
 transparent: true,
 opacity: 1.0,
 toneMapped: false
 });
 const core = new THREE.Mesh(coreGeo, coreMat);
 starGroup.add(core);
 
 // Blue-white glow
 const glowGeo = new THREE.SphereGeometry(12, 16, 16);
 const glowMat = new THREE.MeshBasicMaterial({
 color: 0xDDEEFF,
 transparent: true,
 opacity: 0.5,
 blending: THREE.AdditiveBlending
 });
 const glow = new THREE.Mesh(glowGeo, glowMat);
 starGroup.add(glow);
 
 return starGroup;
 }

 createConstellations(scene) {
 // Create famous star constellations visible from Earth
 this.constellations = [];
 
 // Constellation data: star positions (RA/Dec converted to 3D) and connections
 const constellationsData = [
 // === ZODIAC CONSTELLATIONS (12 Signs) ===
 {
 name: 'Aries (The Ram)',
 description: t('descAries'),
 stars: [
 { name: 'Hamal', ra: 31.8, dec: 23.5, mag: 2.0, color: 0xFFA500 }, // 0 - The head
 { name: 'Sheratan', ra: 28.7, dec: 20.8, mag: 2.6, color: 0xFFFFE0 }, // 1 - First horn
 { name: 'Mesarthim', ra: 28.4, dec: 19.3, mag: 3.9, color: 0xFFFFF0 }, // 2 - Second horn
 { name: '41 Arietis', ra: 44.8, dec: 27.7, mag: 3.6, color: 0xFFFFE0 }, // 3 - Body
 { name: 'Bharani', ra: 40.2, dec: 27.6, mag: 4.7, color: 0xFFFFF0 } // 4 - Top of head (35 Ari)
 ],
 lines: [[4,0], [0,1], [1,2], [0,3]] // Ram's head with horns and body
 },
 {
 name: 'Taurus (The Bull)',
 description: t('descTaurus'),
 stars: [
 { name: 'Aldebaran', ra: 68.9, dec: 16.5, mag: 0.9, color: 0xFF6347 }, // 0 - Red giant (bull's eye)
 { name: 'Elnath', ra: 81.6, dec: 28.6, mag: 1.7, color: 0xE0FFFF }, // 1 - Northern horn tip
 { name: 'Gamma Tauri', ra: 64.9, dec: 15.6, mag: 3.6, color: 0xFFFFE0 }, // 2 - Hyades left side
 { name: 'Zeta Tauri', ra: 84.4, dec: 21.1, mag: 3.0, color: 0xFFFFE0 }, // 3 - Southern horn
 { name: 'Theta Tauri', ra: 67.2, dec: 15.9, mag: 3.4, color: 0xFFFFE0 }, // 4 - Hyades cluster
 { name: 'Epsilon Tauri', ra: 67.3, dec: 19.2, mag: 3.5, color: 0xFFA500 } // 5 - Hyades cluster
 ],
 lines: [[2,4], [4,0], [0,5], [0,1], [0,3]] // Hyades V-shaped face with horns to Elnath and Zeta Tauri
 },
 {
 name: 'Gemini (The Twins)',
 description: t('descGemini'),
 stars: [
 { name: 'Pollux', ra: 116.3, dec: 28.0, mag: 1.2, color: 0xFFA500 }, // 0 - Twin 1 head
 { name: 'Castor', ra: 113.6, dec: 31.9, mag: 1.6, color: 0xFFFFF0 }, // 1 - Twin 2 head
 { name: 'Wasat', ra: 110.0, dec: 22.0, mag: 3.5, color: 0xFFFFF0 }, // 2 - Center body
 { name: 'Mebsuta', ra: 101.0, dec: 25.1, mag: 3.0, color: 0xFFFFE0 }, // 3 - Left arm/shoulder
 { name: 'Mekbuda', ra: 106.0, dec: 24.4, mag: 3.8, color: 0xFFFFE0 }, // 4 - Right torso
 { name: 'Alhena', ra: 99.4, dec: 16.4, mag: 1.9, color: 0xFFFFF0 } // 5 - Foot
 ],
 lines: [[1,2], [2,5], [0,4], [4,3], [2,4]] // Two parallel twin figures sharing a central body connection
 },
 {
 name: 'Cancer (The Crab)',
 description: t('descCancer'),
 stars: [
 { name: 'Altarf', ra: 124.1, dec: 9.2, mag: 3.5, color: 0xFFA500 }, // 0 - Southern claw
 { name: 'Acubens', ra: 134.6, dec: 11.9, mag: 4.3, color: 0xFFFFF0 }, // 1 - Northern claw
 { name: 'Asellus Australis', ra: 130.1, dec: 18.2, mag: 3.9, color: 0xFFA500 }, // 2 - Southern donkey
 { name: 'Asellus Borealis', ra: 131.2, dec: 21.5, mag: 4.7, color: 0xFFFFF0 }, // 3 - Northern donkey
 { name: 'Iota Cancri', ra: 131.2, dec: 28.8, mag: 4.0, color: 0xFFFFE0 }, // 4 - Shell
 { name: 'Lambda Cancri', ra: 131.6, dec: 24.0, mag: 5.9, color: 0xFFFFF0 } // 5 - Body center
 ],
 lines: [[0,5], [5,1], [5,2], [2,3], [3,4], [4,5]] // Crab body with claws and legs
 },
 {
 name: 'Leo (The Lion)',
 description: t('descLeo'),
 stars: [
 { name: 'Regulus', ra: 152.1, dec: 11.9, mag: 1.4, color: 0xE0FFFF }, // 0 - Heart of the lion
 { name: 'Denebola', ra: 177.4, dec: 14.6, mag: 2.1, color: 0xFFFFF0 }, // 1 - Tail
 { name: 'Algieba', ra: 154.9, dec: 19.8, mag: 2.0, color: 0xFFA500 }, // 2 - Mane
 { name: 'Zosma', ra: 168.5, dec: 20.5, mag: 2.6, color: 0xFFFFF0 }, // 3 - Back
 { name: 'Eta Leonis', ra: 149.2, dec: 16.8, mag: 3.5, color: 0xFFFFE0 }, // 4 - Sickle
 { name: 'Chertan', ra: 168.6, dec: 15.4, mag: 3.3, color: 0xFFFFF0 } // 5 - Rear haunch
 ],
 lines: [[4,2], [2,0], [0,5], [5,1], [1,3], [3,2]] // Sickle head + triangle body
 },
 {
 name: 'Virgo (The Maiden)',
 description: t('descVirgo'),
 stars: [
 { name: 'Spica', ra: 201.3, dec: -11.2, mag: 1.0, color: 0xE0FFFF }, // 0 - Wheat/hand (brightest)
 { name: 'Vindemiatrix', ra: 195.5, dec: 10.9, mag: 2.8, color: 0xFFFFE0 }, // 1 - Grape gatherer
 { name: 'Porrima', ra: 190.4, dec: -1.4, mag: 2.7, color: 0xFFFFF0 }, // 2 - Body center
 { name: 'Zavijava', ra: 177.7, dec: 1.8, mag: 3.6, color: 0xFFFFF0 }, // 3 - Corner
 { name: 'Heze', ra: 211.7, dec: -0.7, mag: 3.4, color: 0xFFFFF0 }, // 4 - Arm
 { name: 'Minelauva', ra: 193.9, dec: 3.4, mag: 3.4, color: 0xFFFFE0 } // 5 - Robe
 ],
 lines: [[3,5], [5,1], [1,2], [2,4], [4,0]] // Y-shaped maiden figure with wheat
 },
 {
 name: 'Libra (The Scales)',
 description: t('descLibra'),
 stars: [
 { name: 'Zubeneschamali', ra: 229.3, dec: -9.4, mag: 2.6, color: 0xE0FFFF }, // 0 - Northern scale
 { name: 'Zubenelgenubi', ra: 222.7, dec: -16.0, mag: 2.8, color: 0xFFFFE0 }, // 1 - Southern scale
 { name: 'Brachium', ra: 233.9, dec: -25.3, mag: 3.3, color: 0xFFA500 }, // 2 - Scale base
 { name: 'Theta Librae', ra: 236.2, dec: -16.7, mag: 4.1, color: 0xFFFFF0 }, // 3 - Balance point
 { name: 'Upsilon Librae', ra: 234.3, dec: -28.1, mag: 3.6, color: 0xFFFFE0 } // 4 - Scale arm (υ Lib, RA 15h 37m = 234.3°)
 ],
 lines: [[0,1], [1,2], [0,3], [3,4]] // Scale balance with beam
 },
 {
 name: 'Scorpius (The Scorpion)',
 description: t('descScorpius'),
 stars: [
 { name: 'Antares',       ra: 247.35, dec: -26.43, mag: 1.0, color: 0xFF4500 }, // 0 - Heart (α Sco)
 { name: 'Graffias',      ra: 241.36, dec: -19.81, mag: 2.6, color: 0xFFFFE0 }, // 1 - Head top (β Sco)
 { name: 'Dschubba',      ra: 240.08, dec: -22.62, mag: 2.3, color: 0xE0FFFF }, // 2 - Head (δ Sco)
 { name: 'Tau Scorpii',   ra: 248.97, dec: -28.22, mag: 2.8, color: 0xE0FFFF }, // 3 - Upper body (τ Sco)
 { name: 'Epsilon Sco',   ra: 252.54, dec: -34.29, mag: 2.3, color: 0xFFA500 }, // 4 - Upper tail (ε Sco / Larawag)
 { name: 'Mu Scorpii',    ra: 252.97, dec: -37.99, mag: 3.0, color: 0xFFFFE0 }, // 5 - Mid tail (μ¹ Sco / Xamidimura)
 { name: 'Eta Scorpii',   ra: 258.04, dec: -43.24, mag: 3.3, color: 0xFFFFF0 }, // 6 - Lower tail (η Sco)
 { name: 'Sargas',        ra: 264.33, dec: -43.00, mag: 1.9, color: 0xFFFFE0 }, // 7 - Lower tail (θ Sco)
 { name: 'Iota Scorpii',  ra: 266.90, dec: -40.13, mag: 3.0, color: 0xFFFFF0 }, // 8 - Tail curve (ι¹ Sco)
 { name: 'Kappa Scorpii', ra: 265.62, dec: -39.03, mag: 2.4, color: 0xE0FFFF }, // 9 - Tail curve (κ Sco)
 { name: 'Lesath',        ra: 262.69, dec: -37.30, mag: 2.7, color: 0xE0FFFF }, // 10 - Stinger (υ Sco)
 { name: 'Shaula',        ra: 263.40, dec: -37.10, mag: 1.6, color: 0xE0FFFF }, // 11 - Stinger tip (λ Sco)
 ],
 lines: [[1,2],[2,0],[0,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]] // Head→heart→S-curve tail→stinger
 },
 {
 name: 'Sagittarius (The Archer)',
 description: t('descSagittarius'),
 stars: [
 { name: 'Kaus Australis', ra: 276.0, dec: -34.4, mag: 1.8, color: 0xE0FFFF }, // 0 - Teapot bottom (ε Sgr)
 { name: 'Nunki', ra: 283.8, dec: -26.3, mag: 2.0, color: 0xE0FFFF }, // 1 - Handle top / lid (σ Sgr)
 { name: 'Ascella', ra: 291.0, dec: -29.9, mag: 2.6, color: 0xFFFFF0 }, // 2 - Handle base (ζ Sgr)
 { name: 'Kaus Media', ra: 274.4, dec: -29.8, mag: 2.7, color: 0xFFA500 }, // 3 - Pot body left (δ Sgr)
 { name: 'Kaus Borealis', ra: 277.0, dec: -25.4, mag: 2.8, color: 0xFFA500 }, // 4 - Lid point (λ Sgr)
 { name: 'Phi Sagittarii', ra: 290.4, dec: -26.9, mag: 3.2, color: 0xFFFFF0 }, // 5 - Pot body right (φ Sgr)
 { name: 'Tau Sagittarii', ra: 290.7, dec: -27.7, mag: 3.3, color: 0xFFFFE0 }, // 6 - Handle middle (τ Sgr)
 { name: 'Alnasl', ra: 271.45, dec: -30.42, mag: 2.99, color: 0xFFA500 }  // 7 - Spout tip (γ² Sgr)
 ],
 lines: [[7,3],[3,0],[0,2],[2,6],[6,5],[5,1],[1,4],[4,3]] // Teapot: Alnasl(spout)→δ→ε→ζ→τ→φ→Nunki→λ→δ; Nunki properly in lid top
 },
 {
 name: 'Capricornus (The Sea-Goat)',
 description: t('descCapricornus'),
 stars: [
 { name: 'Algedi',           ra: 304.5, dec: -12.5, mag: 3.6, color: 0xFFFFE0 }, // 0 - Western horn (α Cap)
 { name: 'Dabih',            ra: 305.3, dec: -14.8, mag: 3.1, color: 0xFFA500 }, // 1 - Western head (β Cap)
 { name: 'Theta Capricorni', ra: 305.3, dec: -17.2, mag: 4.1, color: 0xFFFFE0 }, // 2 - Neck/shoulder (θ Cap) — western group, near α/β
 { name: 'Omega Capricorni', ra: 312.9, dec: -26.9, mag: 4.1, color: 0xFFFFF0 }, // 3 - Fish body lower (ω Cap) — southern apex of kite
 { name: 'Zeta Capricorni',  ra: 321.7, dec: -22.4, mag: 3.7, color: 0xFFFFF0 }, // 4 - Fish tail arc (ζ Cap)
 { name: 'Nashira',          ra: 325.0, dec: -16.7, mag: 3.7, color: 0xFFFFF0 }, // 5 - Eastern body (γ Cap)
 { name: 'Deneb Algedi',     ra: 326.8, dec: -16.1, mag: 2.9, color: 0xFFFFF0 }, // 6 - Eastern tail tip (δ Cap, brightest)
 ],
 lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]] // Closed kite/diamond — α→β→θ (down left), arc through ω/ζ (south), γ→δ (right), back to α
 },
 {
 name: 'Aquarius (The Water-Bearer)',
 description: t('descAquarius'),
 stars: [
 { name: 'Sadalsuud', ra: 322.9, dec: -5.6, mag: 2.9, color: 0xFFFFE0 }, // 0 - Lucky star of luckiest
 { name: 'Sadalmelik', ra: 331.4, dec: -0.3, mag: 3.0, color: 0xFFFFE0 }, // 1 - Lucky star of the king
 { name: 'Skat', ra: 346.2, dec: -15.8, mag: 3.3, color: 0xFFFFF0 }, // 2 - Shin/leg
 { name: 'Albali', ra: 315.9, dec: -9.5, mag: 3.8, color: 0xFFFFF0 }, // 3 - The swallower
 { name: 'Sadachbia', ra: 335.4, dec: -1.4, mag: 3.8, color: 0xFFFFF0 }, // 4 - Urn corner (γ Aqr)
 { name: 'Lambda Aquarii', ra: 343.2, dec: -7.6, mag: 3.7, color: 0xFFFFE0 }, // 5 - Water stream (λ Aqr, RA 22h 53m)
 { name: 'Phi Aquarii', ra: 359.6, dec: -6.0, mag: 4.2, color: 0xFFFFF0 }   // 6 - Water stream end (φ Aqr, RA 23h 58m)
 ],
 lines: [[3,0], [0,4], [4,1], [1,5], [5,6], [5,2]] // Urn shape with a descending water stream
 },
 {
 name: 'Pisces (The Fish)',
 description: t('descPisces'),
 stars: [
 { name: 'Alpherg', ra: 22.87, dec: 15.3, mag: 3.6, color: 0xFFFFE0 }, // 0 - Eastern fish (η Psc, RA 01h 31m)
 { name: 'Alrescha', ra: 30.9, dec: 2.8, mag: 3.8, color: 0xFFFFF0 }, // 1 - Knot (tie point, α Psc)
 { name: 'Fumalsamakah', ra: 345.97, dec: 3.8, mag: 4.5, color: 0xFFFFF0 }, // 2 - Western fish (β Psc, RA 23h 03m)
 { name: 'Delta Piscium', ra: 12.17, dec: 7.6, mag: 4.4, color: 0xFFFFF0 }, // 3 - Eastern fish body (δ Psc, RA 00h 48m)
 { name: 'Omega Piscium', ra: 359.3, dec: 6.9, mag: 4.0, color: 0xFFFFF0 }, // 4 - NE fish body (ω Psc, RA 23h 59m)
 { name: 'Gamma Piscium', ra: 349.29, dec: 3.2, mag: 3.7, color: 0xFFFFE0 }, // 5 - Western fish body (γ Psc, RA 23h 17m)
 { name: 'Kappa Piscium', ra: 351.73, dec: 1.2, mag: 4.9, color: 0xFFFFF0 } // 6 - Western fish tail (κ Psc, RA 23h 27m)
 ],
 lines: [[1,3], [3,0], [1,4], [4,5], [5,2], [2,6]] // Knot at Alrescha with eastern and western fish chains
 },
 
 // === FAMOUS NON-ZODIAC CONSTELLATIONS ===
 {
 name: 'Orion (The Hunter)',
 description: t('descOrion'),
 stars: [
 { name: 'Betelgeuse', ra: 88.8, dec: 7.4, mag: 0.5, color: 0xFF4500 }, // Red supergiant
 { name: 'Rigel', ra: 78.6, dec: -8.2, mag: 0.1, color: 0x87CEEB }, // Blue supergiant
 { name: 'Bellatrix', ra: 81.3, dec: 6.3, mag: 1.6, color: 0xB0C4DE },
 { name: 'Alnitak', ra: 85.2, dec: -1.9, mag: 1.8, color: 0xE0FFFF }, // Belt star 1
 { name: 'Alnilam', ra: 84.1, dec: -1.2, mag: 1.7, color: 0xE0FFFF }, // Belt star 2
 { name: 'Mintaka', ra: 83.0, dec: -0.3, mag: 2.2, color: 0xE0FFFF }, // Belt star 3
 { name: 'Saiph', ra: 86.9, dec: -9.7, mag: 2.1, color: 0xB0E0E6 }
 ],
 lines: [[2,0], [2,5], [5,4], [4,3], [3,6], [6,1], [1,5]] // Common shoulder-belt-leg Orion figure
 },
 {
 name: 'Orion\'s Belt',
 id: 'orionsBelt',
 description: t('descOrionsBelt'),
 stars: [
 { name: 'Alnitak', ra: 85.2, dec: -1.9, mag: 1.8, color: 0xE0FFFF }, // ζ Ori - Eastern belt star
 { name: 'Alnilam', ra: 84.1, dec: -1.2, mag: 1.7, color: 0xE0FFFF }, // ε Ori - Center belt star
 { name: 'Mintaka', ra: 83.0, dec: -0.3, mag: 2.2, color: 0xE0FFFF }  // δ Ori - Western belt star
 ],
 lines: [[0,1], [1,2]] // Three stars in a row
 },
 {
 name: 'Ursa Major (The Great Bear)',
 id: 'ursaMajor',
 description: t('descUrsaMajorFull'),
 stars: [
 { name: 'Muscida', ra: 127.6, dec: 60.7, mag: 3.4, color: 0xFFFFE0 },     // 0 - Nose
 { name: '23 UMa', ra: 142.9, dec: 63.1, mag: 3.7, color: 0xFFFFF0 },       // 1 - Top of head
 { name: 'Upsilon UMa', ra: 147.7, dec: 59.0, mag: 3.8, color: 0xFFFFF0 },  // 2 - Neck
 { name: 'Theta UMa', ra: 143.1, dec: 51.7, mag: 3.2, color: 0xFFFFE0 },    // 3 - Front shoulder
 { name: 'Talitha', ra: 134.8, dec: 48.0, mag: 3.1, color: 0xFFFFE0 },       // 4 - Front knee
 { name: 'Kappa UMa', ra: 135.9, dec: 47.2, mag: 3.6, color: 0xFFFFF0 },    // 5 - Front paw
 { name: 'Dubhe', ra: 165.9, dec: 61.8, mag: 1.8, color: 0xFFFFE0 },        // 6 - Bowl top-right (α)
 { name: 'Merak', ra: 165.5, dec: 56.4, mag: 2.4, color: 0xFFFFF0 },        // 7 - Bowl bottom-right (β)
 { name: 'Phecda', ra: 178.5, dec: 53.7, mag: 2.4, color: 0xFFFFF0 },       // 8 - Bowl bottom-left (γ)
 { name: 'Megrez', ra: 183.9, dec: 57.0, mag: 3.3, color: 0xFFFFF0 },       // 9 - Bowl top-left (δ)
 { name: 'Alioth', ra: 193.5, dec: 55.96, mag: 1.8, color: 0xFFFFE0 },      // 10 - Handle 1 (ε)
 { name: 'Mizar', ra: 200.9, dec: 54.9, mag: 2.2, color: 0xFFFFF0 },        // 11 - Handle 2 (ζ)
 { name: 'Alkaid', ra: 206.9, dec: 49.3, mag: 1.9, color: 0xFFFFE0 },       // 12 - Tail tip (η)
 { name: 'Psi UMa', ra: 167.4, dec: 44.5, mag: 3.0, color: 0xFFFFF0 },     // 13 - Hind hip
 { name: 'Tania Borealis', ra: 152.1, dec: 42.9, mag: 3.5, color: 0xFFFFF0 }, // 14 - Hind knee
 { name: 'Tania Australis', ra: 155.6, dec: 41.5, mag: 3.1, color: 0xFFFFE0 } // 15 - Hind paw
 ],
 lines: [
 [0,1], [1,2],          // Head & neck
 [2,6], [6,9],          // Neck into shoulders/back
 [9,8], [8,7],          // Back to lower body
 [2,3], [3,4], [4,5],   // Front legs
 [9,10], [10,11], [11,12], // Tail
 [8,13], [13,14], [14,15]  // Hind legs from rear body
 ]
 },
 {
 name: 'Big Dipper (Ursa Major)',
 id: 'bigDipper',
 description: t('descBigDipper'),
 stars: [
 { name: 'Dubhe', ra: 165.9, dec: 61.8, mag: 1.8, color: 0xFFFFE0 },
 { name: 'Merak', ra: 165.5, dec: 56.4, mag: 2.4, color: 0xFFFFF0 },
 { name: 'Phecda', ra: 178.5, dec: 53.7, mag: 2.4, color: 0xFFFFF0 },
 { name: 'Megrez', ra: 183.9, dec: 57.0, mag: 3.3, color: 0xFFFFF0 },
 { name: 'Alioth', ra: 193.5, dec: 55.96, mag: 1.8, color: 0xFFFFE0 },
 { name: 'Mizar', ra: 200.9, dec: 54.9, mag: 2.2, color: 0xFFFFF0 },
 { name: 'Alkaid', ra: 206.9, dec: 49.3, mag: 1.9, color: 0xFFFFE0 }
 ],
 lines: [[0,1], [1,2], [2,3], [3,0], [3,4], [4,5], [5,6]] // Dipper shape (closed bowl + handle)
 },
 {
 name: 'Little Dipper (Ursa Minor)',
 id: 'littleDipper',
 description: t('descUrsaMinor'),
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
 id: 'southernCross',
 description: t('descCrux'),
 stars: [
 { name: 'Acrux', ra: 186.6, dec: -63.1, mag: 0.8, color: 0xE0FFFF },
 { name: 'Mimosa', ra: 191.9, dec: -59.7, mag: 1.3, color: 0xE0FFFF },
 { name: 'Gacrux', ra: 187.8, dec: -57.1, mag: 1.6, color: 0xFF6347 }, // Red giant
 { name: 'Delta Crucis', ra: 183.8, dec: -58.7, mag: 2.8, color: 0xFFFFE0 }
 ],
 lines: [[2,0], [3,1]] // Cross shape - two intersecting lines
 },
 {
 name: 'Cassiopeia (The Queen)',
 description: t('descCassiopeia'),
 stars: [
 { name: 'Schedar', ra: 10.1, dec: 56.5, mag: 2.2, color: 0xFFA500 },
 { name: 'Caph', ra: 2.3, dec: 59.1, mag: 2.3, color: 0xFFFFF0 },
 { name: 'Gamma Cas', ra: 14.2, dec: 60.7, mag: 2.5, color: 0xE0FFFF },
 { name: 'Ruchbah', ra: 21.5, dec: 60.2, mag: 2.7, color: 0xFFFFF0 },
 { name: 'Segin', ra: 28.6, dec: 63.7, mag: 3.4, color: 0xFFFFE0 }
 ],
 lines: [[1,0], [0,2], [2,3], [3,4]] // W/M shape (Caph-Schedar-Gamma-Ruchbah-Segin)
 },
 {
 name: 'Cygnus (The Swan)',
 description: t('descCygnus'),
 stars: [
 { name: 'Deneb', ra: 310.4, dec: 45.3, mag: 1.3, color: 0xE0FFFF }, // 0 - Tail (supergiant)
 { name: 'Albireo', ra: 292.7, dec: 27.9, mag: 3.1, color: 0xFFA500 }, // 1 - Head (beautiful double star)
 { name: 'Sadr', ra: 305.6, dec: 40.3, mag: 2.2, color: 0xFFFFE0 }, // 2 - Center/breast
 { name: 'Aljanah', ra: 311.6, dec: 33.97, mag: 2.5, color: 0xFFA500 }, // 3 - Right wing (ε Cyg)
 { name: 'Delta Cygni', ra: 296.2, dec: 45.1, mag: 2.9, color: 0xE0FFFF }, // 4 - Left wing
 { name: 'Zeta Cygni', ra: 311.5, dec: 30.2, mag: 3.2, color: 0xFFFFE0 } // 5 - Right wing tip (ζ Cyg)
 ],
 lines: [[0,2], [2,1], [4,2], [2,3], [3,5]] // Cross/Swan: tail-body-head, two wings
 },
 {
 name: 'Lyra (The Lyre)',
 description: t('descLyra'),
 stars: [
 { name: 'Vega', ra: 279.2, dec: 38.8, mag: 0.0, color: 0xE0FFFF }, // Very bright!
 { name: 'Sheliak', ra: 282.5, dec: 33.4, mag: 3.5, color: 0xE0FFFF },
 { name: 'Sulafat', ra: 284.7, dec: 32.7, mag: 3.2, color: 0xE0FFFF },
 { name: 'Delta Lyrae', ra: 283.8, dec: 36.9, mag: 4.3, color: 0xE0FFFF }
 ],
 lines: [[0,3], [3,1], [1,2], [2,0]] // Parallelogram shape (traditional lyre/harp)
 },
 {
 name: 'Andromeda (The Princess)',
 id: 'andromedaConst',
 description: t('descAndromedaConst'),
 stars: [
 { name: 'Alpheratz', ra: 2.1, dec: 29.1, mag: 2.1, color: 0xE0FFFF }, // 0 - Head (shared with Pegasus)
 { name: 'Mirach', ra: 17.4, dec: 35.6, mag: 2.1, color: 0xFF6347 }, // 1 - Hip (red giant)
 { name: 'Almach', ra: 30.9, dec: 42.3, mag: 2.2, color: 0xFFA500 }, // 2 - Foot
 { name: 'Delta Andromedae', ra: 8.5, dec: 31.1, mag: 3.3, color: 0xFFFFF0 }, // 3 - Shoulder
 { name: 'Mu Andromedae', ra: 6.5, dec: 38.5, mag: 3.9, color: 0xFFFFF0 }, // 4 - Arm
 { name: 'Nu Andromedae', ra: 12.2, dec: 41.1, mag: 4.5, color: 0xFFFFE0 } // 5 - Chain
 ],
 lines: [[0,1], [1,2], [1,4], [4,5], [0,3]] // Main Andromeda chain with a secondary branch
 },
 {
 name: 'Perseus (The Hero)',
 description: t('descPerseus'),
 stars: [
 { name: 'Mirfak', ra: 51.1, dec: 49.9, mag: 1.8, color: 0xFFFFE0 }, // 0 - Shoulder
 { name: 'Algol', ra: 47.0, dec: 40.9, mag: 2.1, color: 0xE0FFFF }, // 1 - Medusa's head
 { name: 'Atik', ra: 59.5, dec: 31.9, mag: 2.9, color: 0xE0FFFF }, // 2 - Knee (ζ Per)
 { name: 'Gamma Persei', ra: 48.0, dec: 53.5, mag: 2.9, color: 0xFFFFE0 }, // 3 - Head
 { name: 'Delta Persei', ra: 57.3, dec: 47.8, mag: 3.0, color: 0xE0FFFF }, // 4 - Arm
 { name: 'Epsilon Persei', ra: 59.0, dec: 40.0, mag: 2.9, color: 0xE0FFFF } // 5 - Sword tip
 ],
 lines: [[1,0], [0,3], [0,4], [4,5], [5,2]] // Mirfak-centered hero figure with branching torso and sword arm
 },
 {
 name: 'Canis Major (The Great Dog)',
 id: 'canisMajor',
 description: t('descCanisMajor'),
 stars: [
 { name: 'Sirius', ra: 101.3, dec: -16.7, mag: -1.5, color: 0xFFFFFF },   // 0 - Brightest star in the sky!
 { name: 'Mirzam', ra: 95.7, dec: -17.9, mag: 2.0, color: 0xB0C4DE },     // 1 - β CMa
 { name: 'Wezen', ra: 107.1, dec: -26.4, mag: 1.8, color: 0xFFFFE0 },     // 2 - δ CMa
 { name: 'Adhara', ra: 104.7, dec: -28.9, mag: 1.5, color: 0xE0FFFF },    // 3 - ε CMa
 { name: 'Aludra', ra: 111.0, dec: -29.3, mag: 2.4, color: 0xE0FFFF },    // 4 - η CMa
 { name: 'Furud', ra: 95.1, dec: -30.1, mag: 3.0, color: 0xE0FFFF }       // 5 - ζ CMa
 ],
 lines: [[1,0], [0,2], [2,3], [3,5], [2,4]] // Dog body: head to tail
 },
 {
 name: 'Aquila (The Eagle)',
 id: 'aquila',
 description: t('descAquila'),
 stars: [
 { name: 'Altair', ra: 297.7, dec: 8.9, mag: 0.8, color: 0xFFFFFF },      // 0 - Summer Triangle star!
 { name: 'Tarazed', ra: 296.6, dec: 10.6, mag: 2.7, color: 0xFFA500 },    // 1 - γ Aql (orange giant)
 { name: 'Alshain', ra: 298.8, dec: 6.4, mag: 3.7, color: 0xFFFFE0 },     // 2 - β Aql
 { name: 'Theta Aquilae', ra: 302.8, dec: -0.8, mag: 3.2, color: 0xE0FFFF }, // 3 - θ Aql
 { name: 'Delta Aquilae', ra: 291.4, dec: 3.1, mag: 3.4, color: 0xFFFFF0 }, // 4 - δ Aql
 { name: 'Lambda Aquilae', ra: 286.6, dec: -4.9, mag: 3.4, color: 0xE0FFFF }, // 5 - λ Aql
 { name: 'Zeta Aquilae', ra: 286.4, dec: 13.9, mag: 3.0, color: 0xFFFFE0 }  // 6 - ζ Aql (head)
 ],
 lines: [[6,1], [1,0], [0,2], [0,4], [4,5], [2,3]] // Common Altair-centered eagle figure with wing and tail extensions
 },
 {
 name: 'Pegasus (The Winged Horse)',
 id: 'pegasus',
 description: t('descPegasus'),
 stars: [
 { name: 'Markab', ra: 346.2, dec: 15.2, mag: 2.5, color: 0xE0FFFF },      // 0 - α Peg (SW corner)
 { name: 'Scheat', ra: 345.9, dec: 28.1, mag: 2.4, color: 0xFF6347 },      // 1 - β Peg (NW corner, red giant)
 { name: 'Algenib', ra: 3.3, dec: 15.2, mag: 2.8, color: 0xE0FFFF },       // 2 - γ Peg (SE corner)
 { name: 'Enif', ra: 326.0, dec: 9.9, mag: 2.4, color: 0xFFA500 },         // 3 - ε Peg (nose)
 { name: 'Homam', ra: 340.4, dec: 10.8, mag: 3.4, color: 0xE0FFFF },       // 4 - ζ Peg
 { name: 'Matar', ra: 340.7, dec: 30.2, mag: 2.9, color: 0xFFFFE0 },       // 5 - η Peg
 { name: 'Biham', ra: 332.5, dec: 6.2, mag: 3.5, color: 0xFFFFE0 },         // 6 - θ Peg
 { name: 'Alpheratz', ra: 2.1, dec: 29.1, mag: 2.1, color: 0xE0FFFF }        // 7 - α And (NE corner, shared with Andromeda)
 ],
 lines: [[0,1], [1,7], [7,2], [0,2], [1,5], [0,4], [4,3], [3,6]] // Great Square (complete) + neck/head
 }
 ];
 
 constellationsData.forEach(constData => {
 const group = new THREE.Group();
 const starMeshes = [];
 
 // Create stars with optimized factory methods
 constData.stars.forEach(star => {
 // Convert RA/Dec to 3D Cartesian coordinates
 const position = CoordinateUtils.sphericalToCartesian(
 star.ra,
 star.dec,
 CONFIG.CONSTELLATION.DISTANCE
 );
 
 // Create star mesh using factory (with geometry caching)
 const starMesh = ConstellationFactory.createStar(star, position, this.geometryCache);
 // Full userData so the star is independently clickable and hoverable
 const constShortName = constData.name.split(/\s*\(/)[0].trim();
 starMesh.userData = {
 hoverLabel: star.name, // legacy, kept for line-hover fallback
 name: star.name,
 type: 'star',
 isConstellationStar: true,
 parentConstellation: constShortName,
 description: `A star in the ${constShortName} constellation.`,
 distance: 'Hundreds to thousands of light-years',
 };
 group.add(starMesh);
 starMeshes.push(starMesh);
 
 // Add glow effect using factory (with geometry caching)
 const rawSize = CONFIG.CONSTELLATION.STAR_BASE_SIZE * Math.pow(1.5, -star.mag);
 const starSize = Math.min(rawSize, CONFIG.CONSTELLATION.STAR_MAX_SIZE);
 const glow = ConstellationFactory.createGlow(star, starSize, this.geometryCache);
 starMesh.add(glow);
 });
 
 // Create constellation lines using factory
 constData.lines.forEach(line => {
 const lineMesh = ConstellationFactory.createLine(
 starMeshes[line[0]].position,
 starMeshes[line[1]].position
 );
 group.add(lineMesh);
 });
 
 // Calculate constellation center and bounding radius using factory method
 const { center, radius } = ConstellationFactory.calculateCenter(starMeshes);
 
 // Add constellation metadata
 group.userData = {
 name: constData.id || constData.name.split(/\s*\(/)[0].trim().toLowerCase(),
 type: 'constellation',
 description: constData.description,
 distance: '100s to 1000s of light-years',
 starCount: constData.stars.length,
 radius: radius || 500, // Pattern spread (bounding radius)
 centerPosition: { x: center.x, y: center.y, z: center.z }, // Center of star pattern
 distanceFromOrigin: CONFIG.CONSTELLATION.DISTANCE // All stars at this distance from origin
 };
 
 scene.add(group);
 this.objects.push(group);
 this.constellations.push(group);
 });

 // === POLARIS POINTER LINE ===
 // Astronomers find Polaris by extending a line from Merak → Dubhe (the "pointer stars"
 // on the outer edge of the Big Dipper's bowl) roughly 5× that gap northward.
 // Add a dashed guide line from Dubhe to Polaris, hidden by default.
 this._addPolarisPointerLine();
 
 if (DEBUG.enabled) console.log(`✓ Created ${this.constellations.length} constellations with star patterns!`);
 }
 
 highlightConstellation(focusedConstellation) {
 // Show only the focused constellation; completely hide all others
 if (!this.constellations) return;
 this.focusedConstellation = focusedConstellation;

 const isBigDipper = focusedConstellation?.userData?.name === 'bigDipper';
 
 this.constellations.forEach(constellation => {
 const isFocused = constellation === focusedConstellation;
 if (isFocused) {
 constellation.visible = true;
 // Ensure full brightness on all children
 constellation.traverse(child => {
 if (child.material) {
 child.visible = true;
 if (child.material.userData?.originalOpacity !== undefined) {
 child.material.opacity = child.material.userData.originalOpacity;
 }
 }
 });
 } else {
 // Hide group AND all children so the raycaster skips them
 // (Three.js raycaster recurses into children independently of parent visibility)
 constellation.visible = false;
 constellation.traverse(child => {
 child.visible = false;
 });

 // Special case: when focusing on Big Dipper, also show Polaris
 // from the Little Dipper so the user can see the pointer-star relationship
 if (isBigDipper && constellation.userData?.name === 'littleDipper') {
 // Show the constellation group but only make Polaris (first star) visible
 constellation.visible = true;
 constellation.traverse(child => {
 if (child.userData?.name === 'Polaris') {
 child.visible = true;
 // Also show its glow children
 child.traverse(c => { c.visible = true; });
 }
 });
 }
 }
 });

 // Show / hide the pointer line from Dubhe → Polaris
 if (this._polarisPointerLine) {
 this._polarisPointerLine.visible = isBigDipper;
 }
 }
 
 resetConstellationHighlight() {
 // Restore all constellations to the user's chosen visibility state
 if (!this.constellations) return;
 this.focusedConstellation = null;
 
 this.constellations.forEach(constellation => {
 constellation.visible = this.constellationsVisible;
 constellation.traverse(child => {
 child.visible = this.constellationsVisible;
 if (child.material && child.material.userData?.originalOpacity !== undefined) {
 child.material.opacity = child.material.userData.originalOpacity;
 }
 });
 });

 // Hide the Polaris pointer line when no constellation is focused
 if (this._polarisPointerLine) {
 this._polarisPointerLine.visible = false;
 }
 }

 /**
  * Create a dashed pointer line from Dubhe (Big Dipper) to Polaris (Little Dipper).
  * The line is added directly to the scene, hidden by default, and shown only when
  * the Big Dipper is the focused constellation.
  */
 _addPolarisPointerLine() {
 // Find Big Dipper and Little Dipper groups
 const bigDipper = this.constellations.find(c => c.userData.name === 'bigDipper');
 const littleDipper = this.constellations.find(c => c.userData.name === 'littleDipper');
 if (!bigDipper || !littleDipper) return;

 // Dubhe is star index 0 in Big Dipper (the outer-edge star closest to Polaris)
 // Polaris is star index 0 in Little Dipper
 let dubhePos = null;
 let polarisPos = null;

 bigDipper.traverse(child => {
 if (child.userData?.name === 'Dubhe' && child.isMesh) {
 dubhePos = child.position.clone();
 }
 });
 littleDipper.traverse(child => {
 if (child.userData?.name === 'Polaris' && child.isMesh) {
 polarisPos = child.position.clone();
 }
 });

 if (!dubhePos || !polarisPos) return;

 // Build a dashed line from Dubhe to Polaris
 const points = [dubhePos, polarisPos];
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineDashedMaterial({
 color: 0xFFD700, // Gold — stands out as a guide, distinct from constellation lines
 transparent: true,
 opacity: 0.6,
 dashSize: 40,
 gapSize: 20,
 linewidth: 2
 });
 material.userData = { originalOpacity: 0.6 };

 const line = new THREE.Line(geometry, material);
 line.computeLineDistances(); // Required for dashes to render
 line.visible = false; // Hidden until Big Dipper is focused
 line.userData = { isPolarisPointer: true };

 // Add to scene at root level (not inside either constellation group, so it persists
 // independently of group visibility toggling)
 const scene = bigDipper.parent; // scene reference
 if (scene) scene.add(line);
 this._polarisPointerLine = line;

 if (DEBUG.enabled) console.log(' ✓ Polaris pointer line added (Dubhe → Polaris)');
 }

 createGalaxies(scene) {
 // Create distant galaxies with procedural generation
 this.galaxies = [];
 
 const galaxiesData = [
 { 
 name: 'Andromeda Galaxy', id: 'andromedaGalaxy',
 ra: 10.7,    // 0h 42m 44s - In Andromeda constellation, near Mirach
 dec: 41.3,   // +41° 16' 09" - Northern hemisphere autumn sky
 size: 600, 
 type: 'spiral', 
 angularSize: 178, // 178 arcminutes - appears 6x larger than full moon!
 description: t('descAndromeda')
 },
 { 
 name: 'Whirlpool Galaxy', id: 'whirlpoolGalaxy',
 ra: 202.5,   // 13h 29m 53s - In Canes Venatici, below Big Dipper's handle
 dec: 47.2,   // +47° 11' 43" - Northern spring sky
 size: 400, 
 type: 'spiral',
 angularSize: 11, // 11 arcminutes
 description: t('descWhirlpool')
 },
 { 
 name: 'Sombrero Galaxy', id: 'sombreroGalaxy',
 ra: 189.99,  // 12h 39m 59s - In Virgo constellation, western edge
 dec: -11.6,  // -11° 37' 23" - Southern declination, visible from both hemispheres
 size: 350, 
 type: 'lenticular',
 angularSize: 9, // 9 arcminutes
 description: t('descSombrero')
 },
 {
 name: 'Triangulum Galaxy', id: 'triangulumGalaxy',
 ra: 23.46,   // 1h 33m 50.9s - In Triangulum constellation
 dec: 30.66,  // +30° 39' 37" - Northern autumn sky
 size: 500,
 type: 'spiral',
 angularSize: 73, // 73 arcminutes - almost as large as Andromeda!
 description: t('descTriangulum')
 },
 {
 name: 'Pinwheel Galaxy', id: 'pinwheelGalaxy',
 ra: 210.80,  // 14h 03m 12.6s - In Ursa Major, near Big Dipper handle
 dec: 54.35,  // +54° 20' 57" - Northern spring sky
 size: 420,
 type: 'spiral',
 angularSize: 29, // 28.8 arcminutes
 description: t('descPinwheel')
 },
 {
 name: "Bode's Galaxy", id: 'bodesGalaxy',
 ra: 148.89,  // 9h 55m 33.2s - In Ursa Major
 dec: 69.07,  // +69° 03' 55" - Far northern sky
 size: 380,
 type: 'spiral',
 angularSize: 27, // 26.9 arcminutes
 description: t('descBodesGalaxy')
 },
 {
 name: 'Cigar Galaxy', id: 'cigarGalaxy',
 ra: 148.97,  // 9h 55m 52.7s - In Ursa Major, companion to M81
 dec: 69.68,  // +69° 40' 47" - Far northern sky, very close to Bode's
 size: 320,
 type: 'starburst',
 angularSize: 11, // 11 arcminutes
 description: t('descCigarGalaxy')
 },
 {
 name: 'Sculptor Galaxy', id: 'sculptorGalaxy',
 ra: 11.89,   // 0h 47m 33.1s - In Sculptor constellation
 dec: -25.29, // -25° 17' 18" - Southern hemisphere sky
 size: 380,
 type: 'spiral',
 angularSize: 28, // 27.5 arcminutes - edge-on view
 description: t('descSculptor')
 },
 {
 name: 'Centaurus A', id: 'centaurusAGalaxy',
 ra: 201.37,  // 13h 25m 27.6s - In Centaurus constellation
 dec: -43.02, // -43° 01' 09" - Southern sky
 size: 420,
 type: 'radio',
 angularSize: 26, // 25.7 arcminutes
 description: t('descCentaurusA')
 },
 {
 name: 'Large Magellanic Cloud', id: 'largeMagellanicCloud',
 ra: 80.9,   // 5h 23m - In Dorado/Mensa constellations
 dec: -69.8, // -69° 45' - Far southern sky, circumpolar from southern hemisphere
 size: 700,
 type: 'irregular',
 angularSize: 650, // ~10.75° × 9.17° — largest angular extent of any galaxy
 description: t('descLargeMagellanicCloud')
 },
 {
 name: 'Small Magellanic Cloud', id: 'smallMagellanicCloud',
 ra: 13.2,   // 0h 52m - In Tucana constellation
 dec: -72.8, // -72° 49' - Far southern sky, circumpolar from southern hemisphere
 size: 500,
 type: 'irregular',
 angularSize: 318, // ~5.3° × 3.05°
 description: t('descSmallMagellanicCloud')
 }
 ];

 // Real image texture paths for galaxies (NASA public domain imagery)
 const galaxyTextures = {
 'Andromeda Galaxy':  './textures/galaxies/andromeda_galaxy.webp',
 'Whirlpool Galaxy':  './textures/galaxies/whirlpool_galaxy.webp',
 'Sombrero Galaxy':   './textures/galaxies/sombrero_galaxy.webp',
 'Triangulum Galaxy': './textures/galaxies/m33_triangulum_galaxy.webp',
 'Pinwheel Galaxy':   './textures/galaxies/m101_pinwheel_galaxy.webp',
 "Bode's Galaxy":     './textures/galaxies/m81_bodes_galaxy.webp',
 'Cigar Galaxy':      './textures/galaxies/m82_cigar_galaxy.webp',
 'Sculptor Galaxy':        './textures/galaxies/ngc253_sculptor_galaxy.webp',
 'Centaurus A':            './textures/galaxies/ngc5128_centaurus_a.webp',
 'Large Magellanic Cloud': './textures/galaxies/lmc_galaxy.webp',
 'Small Magellanic Cloud': './textures/galaxies/smc_galaxy.webp'
 };

 for (const galData of galaxiesData) {
 const group = new THREE.Group();
 const realTexturePath = galaxyTextures[galData.name];

 if (realTexturePath) {
 // Load and pixel-process: alpha = luminance_curve * radial_fade
 this._loadDeepSkySprite(
 realTexturePath,
 (processedTex) => {
 // Use a plain Mesh so it sits statically in world space.
 // THREE.Sprite auto-billboards every frame, making it appear
 // to "float" as the VR user turns their head.
 const gMat = new THREE.MeshBasicMaterial({
 map: processedTex,
 transparent: true,
 opacity: 0.95,
 depthWrite: false,
 blending: THREE.AdditiveBlending,
 side: THREE.DoubleSide
 });
 const geo = new THREE.PlaneGeometry(galData.size * 15, galData.size * 15);
 const mesh = new THREE.Mesh(geo, gMat);
 group.add(mesh);
 // Orient the plane toward the scene centre so it's visible from origin.
 // Ensure the group's world matrix is current before calling lookAt.
 group.updateMatrixWorld(true);
 mesh.lookAt(new THREE.Vector3(0, 0, 0));
 },
 () => { // onError: fall back to procedural
 this._buildProceduralGalaxy(group, galData);
 }
 );
 } else {
 this._buildProceduralGalaxy(group, galData);
 }

 // Convert RA/Dec to 3D Cartesian coordinates
 // Place galaxies at distances proportional to their real distances:
 // Andromeda: 2.5 Mly, Whirlpool: 23 Mly, Sombrero: 29.3 Mly
 // Scale: 1 Mly ≈ 20,000 units (MW disc = 50,000 units ≈ 100,000 ly)
 const realDistances = {
 'Andromeda Galaxy':  50000,   // 2.5 Mly  - closest large galaxy
 'Triangulum Galaxy': 60000,   // 2.73 Mly - third Local Group member
 'Whirlpool Galaxy':  130000,  // 23 Mly   - compressed from 460k for visibility
 'Sombrero Galaxy':   150000,  // 29.3 Mly - compressed from 586k for visibility
 "Bode's Galaxy":     110000,  // 11.7 Mly - compressed for visibility
 'Cigar Galaxy':      110500,  // 12 Mly   - slightly offset from Bode's companion
 'Sculptor Galaxy':   110000,  // 11.4 Mly - Silver Dollar galaxy
 'Pinwheel Galaxy':         125000,  // 21 Mly   - compressed for visibility
 'Centaurus A':             120000,  // 12 Mly   - closest radio galaxy
 'Large Magellanic Cloud':   35000,  // 160 kly  - Milky Way satellite
 'Small Magellanic Cloud':   38000   // 200 kly  - Milky Way satellite
 };
 const galaxyDistance = realDistances[galData.name] || 120000;
 const position = CoordinateUtils.sphericalToCartesian(
 galData.ra,
 galData.dec,
 galaxyDistance
 );
 
 group.position.set(position.x, position.y, position.z);
 group.rotation.x = Math.random() * Math.PI * 0.3;
 group.rotation.y = Math.random() * Math.PI * 2;
 
 group.userData = {
 name: galData.id || galData.name,
 type: 'galaxy',
 radius: galData.size,
 description: galData.description,
 distance: 'Millions of light-years',
 realSize: '100,000+ light-years across',
 angularSize: galData.angularSize, // Angular size in arcminutes
 ra: galData.ra,
 dec: galData.dec,
 funFact: ({
 andromedaGalaxy:  t('funFactAndromedaGalaxy'),
 whirlpoolGalaxy:  t('funFactWhirlpoolGalaxy'),
 sombreroGalaxy:   t('funFactSombreroGalaxy'),
 triangulumGalaxy: t('funFactTriangulumGalaxy'),
 pinwheelGalaxy:   t('funFactPinwheelGalaxy'),
 bodesGalaxy:      t('funFactBodesGalaxy'),
 cigarGalaxy:      t('funFactCigarGalaxy'),
 sculptorGalaxy:   t('funFactSculptorGalaxy'),
 centaurusAGalaxy:      t('funFactCentaurusA'),
 largeMagellanicCloud:  t('funFactLargeMagellanicCloud'),
 smallMagellanicCloud:  t('funFactSmallMagellanicCloud'),
 })[galData.id] || t('funFactSombreroGalaxy'),
 basePosition: { x: position.x, y: position.y, z: position.z }
 };
 
 scene.add(group);
 this.objects.push(group);
 this.galaxies.push(group);
 }

 // Add procedural background galaxies — scattered at intergalactic distances
 this._createBackgroundGalaxies(scene);
 }

 _createBackgroundGalaxies(scene) {
 // Create many small procedural galaxies at various distances to fill
 // the intergalactic void when zoomed out very far
 const bgGalaxyCount = IS_MOBILE ? 40 : 80;
 
 for (let i = 0; i < bgGalaxyCount; i++) {
 // Random spherical distribution at varying distances
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const dist = 80000 + Math.random() * 120000; // 80,000 to 200,000 units
 
 const x = dist * Math.sin(phi) * Math.cos(theta);
 const y = dist * Math.cos(phi);
 const z = dist * Math.sin(phi) * Math.sin(theta);
 
 // Generate a tiny galaxy sprite
 const canvasSize = 64;
 const canvas = document.createElement('canvas');
 canvas.width = canvasSize;
 canvas.height = canvasSize;
 const ctx = canvas.getContext('2d');
 
 const cx = canvasSize / 2;
 const cy = canvasSize / 2;
 const r = canvasSize * 0.35;
 
 // Random galaxy type
 const isSpiral = Math.random() > 0.4;
 
 if (isSpiral) {
 // Small spiral
 const arms = 2 + Math.floor(Math.random() * 3);
 for (let a = 0; a < arms; a++) {
 const armOff = (a / arms) * Math.PI * 2;
 for (let j = 0; j < 200; j++) {
 const t = Math.random();
 const angle = armOff + t * 2 * Math.PI;
 const spread = (Math.random() - 0.5) * r * 0.2;
 const px = cx + Math.cos(angle) * t * r + Math.cos(angle + Math.PI / 2) * spread;
 const py = cy + Math.sin(angle) * t * r + Math.sin(angle + Math.PI / 2) * spread;
 const b = 0.3 + Math.random() * 0.5;
 ctx.fillStyle = `rgba(${180 + Math.random() * 75}, ${180 + Math.random() * 50}, ${190 + Math.random() * 65}, ${b})`;
 ctx.fillRect(px, py, 1, 1);
 }
 }
 } else {
 // Elliptical glow
 const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
 grad.addColorStop(0, `rgba(255, 240, 200, 0.6)`);
 grad.addColorStop(0.5, `rgba(200, 190, 170, 0.2)`);
 grad.addColorStop(1, 'rgba(150, 140, 130, 0)');
 ctx.fillStyle = grad;
 ctx.fillRect(0, 0, canvasSize, canvasSize);
 }
 
 // Core glow for both types
 const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.2);
 coreGrad.addColorStop(0, 'rgba(255, 250, 230, 0.7)');
 coreGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
 ctx.fillStyle = coreGrad;
 ctx.fillRect(0, 0, canvasSize, canvasSize);
 
 const texture = new THREE.CanvasTexture(canvas);
 const size = 1500 + Math.random() * 4000; // Vary apparent sizes
 const geo = new THREE.PlaneGeometry(size, size);
 const mat = new THREE.MeshBasicMaterial({
 map: texture,
 transparent: true,
 opacity: 0.4 + Math.random() * 0.4,
 side: THREE.DoubleSide,
 depthWrite: false,
 blending: THREE.AdditiveBlending
 });
 
 const mesh = new THREE.Mesh(geo, mat);
 mesh.position.set(x, y, z);
 mesh.lookAt(0, 0, 0); // Face toward origin
 // Random rotation around face normal for variety
 mesh.rotation.z = Math.random() * Math.PI * 2;
 mesh.frustumCulled = false;
 mesh.userData = { type: 'backgroundGalaxy', basePosition: { x, y, z } };
 
 scene.add(mesh);
 this.galaxies.push(mesh);
 }
 
 if (DEBUG.enabled) console.log(`[Galaxies] Added ${bgGalaxyCount} background galaxies`);
 }

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
 _loadDeepSkySprite(imagePath, onSuccess, onError) {
 const img = new window.Image();
 img.crossOrigin = 'anonymous';
 img.onload = () => {
 const w = img.naturalWidth, h = img.naturalHeight;
 const canvas = document.createElement('canvas');
 canvas.width = w; canvas.height = h;
 const ctx = canvas.getContext('2d');
 ctx.drawImage(img, 0, 0, w, h);
 const imageData = ctx.getImageData(0, 0, w, h);
 const d = imageData.data;
 const cx = w / 2, cy = h / 2;
 const maxR = Math.sqrt(cx * cx + cy * cy);

 // --- Step 1: detect background colour from the four corners ---
 // Sample a small square patch (up to 24 px, min 4 px) at each corner.
 const s = Math.max(4, Math.min(24, Math.floor(Math.min(w, h) * 0.015)));
 let bgR = 0, bgG = 0, bgB = 0, bgN = 0;
 for (const [ox, oy] of [[0, 0], [w - s, 0], [0, h - s], [w - s, h - s]]) {
 for (let sy = oy; sy < oy + s; sy++) {
 for (let sx = ox; sx < ox + s; sx++) {
 const si = (sy * w + sx) << 2;
 bgR += d[si]; bgG += d[si + 1]; bgB += d[si + 2]; bgN++;
 }
 }
 }
 bgR /= bgN * 255; bgG /= bgN * 255; bgB /= bgN * 255;

 // --- Step 2: per-pixel alpha assignment ---
 // Black-point applied after background subtraction; with AdditiveBlending
 // the dark background won't add colour to the scene, so 0.10 is enough
 // to suppress JPEG compression artefacts while keeping faint halos.
 const blackPoint = 0.10;
 const whiteStretch = 1 / (1 - blackPoint);
 for (let py = 0; py < h; py++) {
 const dy = py - cy;
 const rowOff = py * w;
 for (let px = 0; px < w; px++) {
 const i = (rowOff + px) << 2;
 const dx = px - cx;
 // Subtract detected background colour → dark infrared glow → 0
 const r = Math.max(0, d[i]     / 255 - bgR);
 const g = Math.max(0, d[i + 1] / 255 - bgG);
 const b = Math.max(0, d[i + 2] / 255 - bgB);
 const lum = r * 0.299 + g * 0.587 + b * 0.114;
 const lumAdj = Math.max(0, lum - blackPoint) * whiteStretch;
 const lumAlpha = Math.pow(Math.min(1, lumAdj * 3.5), 1.4);
 // Radial fade: full inside 60% radius, smooth quadratic rolloff to 0
 const dist = Math.sqrt(dx * dx + dy * dy) / maxR;
 const radial = dist < 0.60 ? 1.0
 : Math.max(0, 1 - ((dist - 0.60) / 0.40) ** 2.0);
 d[i + 3] = Math.round(255 * lumAlpha * radial);
 }
 }
 ctx.putImageData(imageData, 0, 0);
 onSuccess(new THREE.CanvasTexture(canvas));
 };
 img.onerror = onError;
 img.src = imagePath;
 }

 // Procedurally generates a canvas texture of the Andromeda Galaxy (M31)
 // based on real photographic reference:
 // • Warm white-yellow central bulge (de Vaucouleurs r^1/4 profile)
 // • Beige/brown exponential disk with dark dust-lane bands
 // • Blue-purple outer stellar halo
 // • Blue star-forming knots along the spiral arms
 // • M32 companion handled separately as an overlay
 // Alpha channel = luminance, so pure-black pixels are transparent.
 _buildAndromedaCanvasTexture() {
 const W = 1024, H = 512;
 const canvas = document.createElement('canvas');
 canvas.width = W; canvas.height = H;
 const ctx = canvas.getContext('2d');
 const pix = new Float32Array(W * H * 4);
 const cx = W / 2, cy = H / 2;
 // Major/minor half-axes in pixels (galaxy fills ~90 % of canvas width)
 const a = W * 0.44; // major axis (left-right in canvas)
 const b = H * 0.28; // minor axis (top-bottom) — ~4:1 ratio
 // Position angle: Andromeda tilts NE-SW in the sky, ~37° from horizontal
 const tilt = -0.38; // radians (positive = clockwise)
 const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
 const gauss = (x, y, sx, sy) => Math.exp(-(x * x) / (2 * sx * sx) - (y * y) / (2 * sy * sy));
 for (let py = 0; py < H; py++) {
 for (let px = 0; px < W; px++) {
 // Rotate into galaxy frame
 const dx = px - cx, dy = py - cy;
 const rx = dx * cosT + dy * sinT; // along major axis
 const ry = -dx * sinT + dy * cosT; // along minor axis
 // ── Layer 1: Outer stellar halo (large, blue-purple, very faint) ──
 const halo = gauss(rx, ry, a * 0.72, b * 1.05) * 0.28;
 // ── Layer 2: Exponential disk ──
 const dR = Math.sqrt((rx / (a * 0.52)) ** 2 + (ry / (b * 0.42)) ** 2);
 const disk = Math.exp(-dR * 2.2) * 0.78;
 // ── Layer 3: Bulge (de Vaucouleurs r^1/4 profile) ──
 const bR = Math.sqrt((rx / (a * 0.13)) ** 2 + (ry / (b * 0.32)) ** 2);
 const bulge = bR < 0.01 ? 1.0 : Math.exp(-7.67 * (Math.pow(Math.max(0.001, bR), 0.25) - 1));
 // ── Dust lanes: two dark bands parallel to major axis ──
 const dustOff = b * 0.13;
 const dustW = b * 0.07;
 const dust1 = Math.exp(-((ry - dustOff) ** 2) / (2 * dustW ** 2)) * (1 - Math.exp(-dR * 1.5));
 const dust2 = Math.exp(-((ry + dustOff) ** 2) / (2 * dustW ** 2)) * (1 - Math.exp(-dR * 1.5));
 const dustMask = 1.0 - Math.min(1, (dust1 + dust2) * 0.65) * Math.max(0, 1 - bR * 0.6);
 // ── Combine luminosity ──
 const lum = Math.min(1, halo + disk * dustMask + Math.min(1, bulge * 0.95));
 // ── Colour model ──
 // Bulge proximity drives warm white-yellow, halo drives blue-purple
 const bFrac = Math.min(1, bulge * 0.6);
 const hFrac = Math.min(1, halo / 0.28);
 // Disk base: warm beige
 let R = 0.88 + bFrac * 0.12;
 let G = 0.76 + bFrac * 0.18;
 let B = 0.55 + bFrac * 0.15;
 // Add blue-purple halo tint
 R = R * (1 - hFrac * 0.45) + 0.52 * hFrac * 0.45;
 G = G * (1 - hFrac * 0.45) + 0.56 * hFrac * 0.45;
 B = B * (1 - hFrac * 0.45) + 0.95 * hFrac * 0.45;
 // Dust lanes pull toward reddish-brown
 const dustFade = (dust1 + dust2) * 0.4;
 R = R * (1 - dustFade) + 0.55 * dustFade;
 G = G * (1 - dustFade) + 0.38 * dustFade;
 B = B * (1 - dustFade) + 0.28 * dustFade;
 const idx = (py * W + px) * 4;
 pix[idx] = R * lum;
 pix[idx + 1] = G * lum;
 pix[idx + 2] = B * lum;
 pix[idx + 3] = lum; // alpha = luminosity → black is fully transparent
 }
 }
 // ── Blue star-forming knots along the spiral arms ──
 // Positions are in (rx, ry) galaxy frame, based on the reference photo
 const knots = [
 { rx: a * 0.32, ry: b * 0.18, r: a * 0.022, str: 0.65 },
 { rx: -a * 0.28, ry: -b * 0.17, r: a * 0.019, str: 0.58 },
 { rx: a * 0.52, ry: b * 0.20, r: a * 0.016, str: 0.48 },
 { rx: -a * 0.46, ry: -b * 0.20, r: a * 0.015, str: 0.45 },
 { rx: a * 0.22, ry: -b * 0.14, r: a * 0.014, str: 0.38 },
 { rx: -a * 0.18, ry: b * 0.13, r: a * 0.014, str: 0.35 },
 { rx: a * 0.68, ry: b * 0.22, r: a * 0.012, str: 0.32 },
 { rx: -a * 0.62, ry: -b * 0.22, r: a * 0.012, str: 0.30 },
 ];
 for (let py = 0; py < H; py++) {
 for (let px = 0; px < W; px++) {
 const dx = px - cx, dy = py - cy;
 const rx = dx * cosT + dy * sinT;
 const ry = -dx * sinT + dy * cosT;
 let kR = 0, kG = 0, kB = 0;
 for (const k of knots) {
 const d2 = (rx - k.rx) ** 2 + (ry - k.ry) ** 2;
 const g = Math.exp(-d2 / (2 * k.r * k.r)) * k.str;
 kR += g * 0.25; kG += g * 0.48; kB += g * 1.0;
 }
 if (kR + kG + kB < 0.001) continue;
 const idx = (py * W + px) * 4;
 pix[idx] = Math.min(1, pix[idx] + kR);
 pix[idx + 1] = Math.min(1, pix[idx + 1] + kG);
 pix[idx + 2] = Math.min(1, pix[idx + 2] + kB);
 const newLum = pix[idx] * 0.299 + pix[idx + 1] * 0.587 + pix[idx + 2] * 0.114;
 pix[idx + 3] = Math.max(pix[idx + 3], newLum);
 }
 }
 // Write float pixels → canvas ImageData
 const imgData = ctx.createImageData(W, H);
 const d = imgData.data;
 for (let i = 0; i < W * H; i++) {
 d[i * 4] = Math.round(Math.min(1, pix[i * 4]) * 255);
 d[i * 4 + 1] = Math.round(Math.min(1, pix[i * 4 + 1]) * 255);
 d[i * 4 + 2] = Math.round(Math.min(1, pix[i * 4 + 2]) * 255);
 d[i * 4 + 3] = Math.round(Math.min(1, pix[i * 4 + 3]) * 255);
 }
 ctx.putImageData(imgData, 0, 0);
 return new THREE.CanvasTexture(canvas);
 }

 // Generates a simple small elliptical galaxy canvas (for M32 companion etc.)
 _buildEllipticalGalaxyCanvas(size, color = 0xFFEECC) {
 const W = size * 2, H = size;
 const canvas = document.createElement('canvas');
 canvas.width = W; canvas.height = H;
 const ctx = canvas.getContext('2d');
 const imgData = ctx.createImageData(W, H);
 const d = imgData.data;
 const rr = ((color >> 16) & 0xff) / 255;
 const gg = ((color >> 8) & 0xff) / 255;
 const bb = (color & 0xff) / 255;
 const cx = W / 2, cy = H / 2;
 for (let py = 0; py < H; py++) {
 for (let px = 0; px < W; px++) {
 const dx = (px - cx) / (W * 0.4);
 const dy = (py - cy) / (H * 0.35);
 const r = Math.sqrt(dx * dx + dy * dy);
 const lum = r < 0.01 ? 1.0 : Math.min(1, Math.exp(-7.67 * (Math.pow(r, 0.25) - 1)) * 0.9);
 const idx = (py * W + px) * 4;
 d[idx] = Math.round(rr * lum * 255);
 d[idx + 1] = Math.round(gg * lum * 255);
 d[idx + 2] = Math.round(bb * lum * 255);
 d[idx + 3] = Math.round(lum * 255);
 }
 }
 ctx.putImageData(imgData, 0, 0);
 return new THREE.CanvasTexture(canvas);
 }

 // Procedural galaxy renderer (spiral particle cloud or elliptical point cloud)
 _buildProceduralGalaxy(group, galData) {
 if (galData.type === 'spiral') {
 const isAndromeda = galData.name === 'Andromeda Galaxy';
 if (isAndromeda) {
 // Render Andromeda as a procedurally-generated canvas sprite so the
 // background is guaranteed transparent (alpha = luminance, black = 0).
 // This reproduces the key features from real photos:
 // bright white-yellow core, warm beige/brown disk, dust lanes,
 // blue star-forming knots, and a diffuse blue-purple outer halo.
 const tex = this._buildAndromedaCanvasTexture();
 const mat = new THREE.SpriteMaterial({
 map: tex,
 transparent: true,
 depthWrite: false,
 blending: THREE.AdditiveBlending,
 opacity: 0.92
 });
 const sprite = new THREE.Sprite(mat);
 // Canvas is 2:1 (W×H), galaxy fills width → scale height by 0.5
 sprite.scale.set(galData.size * 2.2, galData.size * 1.1, 1);
 group.add(sprite);
 // Small companion galaxy M32 (bright elliptical, lower-left offset)
 const m32Tex = this._buildEllipticalGalaxyCanvas(64, 0xFFEECC);
 const m32Mat = new THREE.SpriteMaterial({
 map: m32Tex, transparent: true, depthWrite: false,
 blending: THREE.AdditiveBlending, opacity: 0.75
 });
 const m32 = new THREE.Sprite(m32Mat);
 m32.scale.set(galData.size * 0.18, galData.size * 0.13, 1);
 // Offset below and left of Andromeda centre (matches photo)
 m32.position.set(-galData.size * 0.35, -galData.size * 0.28, 0);
 group.add(m32);
 return; // no particle core needed
 }
 // ── Non-Andromeda spirals: particle cloud ──
 const spiralCount = 8000;
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(spiralCount * 3);
 const colors = new Float32Array(spiralCount * 3);
 for (let i = 0; i < spiralCount; i++) {
 const angle = (i / spiralCount) * Math.PI * 6;
 const distance = (i / spiralCount) * galData.size;
 positions[i * 3] = distance * Math.cos(angle) + (Math.random() - 0.5) * 30;
 positions[i * 3 + 1] = (Math.random() - 0.5) * galData.size * 0.1;
 positions[i * 3 + 2] = distance * Math.sin(angle) * 0.3 + (Math.random() - 0.5) * 30;
 const b = 0.7 + Math.random() * 0.3;
 colors[i * 3] = b; colors[i * 3 + 1] = b * 0.9; colors[i * 3 + 2] = b * 1.1;
 }
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 3, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })));
 } else {
 const ellipCount = 5000;
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(ellipCount * 3);
 const colors = new Float32Array(ellipCount * 3);
 for (let i = 0; i < ellipCount; i++) {
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const radius = Math.pow(Math.random(), 0.7) * galData.size;
 positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
 positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
 positions[i * 3 + 2] = radius * Math.cos(phi);
 const b = 0.8 + Math.random() * 0.2;
 colors[i * 3] = b; colors[i * 3 + 1] = b * 0.9; colors[i * 3 + 2] = b * 0.7;
 }
 geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
 geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
 group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 3, vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })));
 }
 // Bright core
 const coreGeo = new THREE.SphereGeometry(galData.size * 0.1, 32, 32);
 group.add(new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFDD, transparent: true, opacity: 0.9 })));
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
 name: 'alphaCentauriA',
 type: 'star',
 description: t('descAlphaCentauriA'),
 distance: '4.37 light-years',
 realSize: '1.22 times the Sun\'s diameter',
 funFact: t('funFactAlphaCentauriA'),
 basePosition: { x: 8000, y: 1000, z: -6000 }
 };
 
 alphaCentauriGroup.add(alphaA);
 
 // Proxima Centauri (red dwarf, technically closest star) - 4.24 light-years
 const proximaGeo = new THREE.SphereGeometry(6, 32, 32);
 const proximaMat = new THREE.MeshBasicMaterial({
 color: 0xFF6347,
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
 name: 'proximaCentauri',
 type: 'star',
 description: t('descProximaCentauri'),
 distance: '4.24 light-years (40 trillion km!)',
 realSize: '0.14 times the Sun\'s diameter',
 funFact: t('funFactProximaCentauri'),
 basePosition: { x: 8500, y: 800, z: -6200 }
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
 name: 'kepler452Star',
 type: 'star',
 description: t('descKepler452Star'),
 distance: '1,400 light-years',
 realSize: '1.11 times the Sun\'s diameter',
 funFact: t('funFactKepler452Star'),
 basePosition: { x: -9000, y: 2500, z: 8450 }
 };
 
 scene.add(kepler452);
 this.objects.push(kepler452);
 this.nearbyStars.push(kepler452);
 
 // TRAPPIST-1 (ultra-cool red dwarf) - 40 light-years away
 const trappist1Geo = new THREE.SphereGeometry(5, 32, 32);
 const trappist1Mat = new THREE.MeshBasicMaterial({
 color: 0xFF5533,
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
 name: 'trappist1Star',
 type: 'star',
 description: t('descTrappist1Star'),
 distance: '40 light-years',
 realSize: '0.12 times the Sun\'s diameter (barely larger than Jupiter!)',
 funFact: t('funFactTrappist1Star'),
 basePosition: { x: 7000, y: -3000, z: -8950 }
 };
 
 scene.add(trappist1);
 this.objects.push(trappist1);
 this.nearbyStars.push(trappist1);
 
 // Kepler-186 (red dwarf) - 500 light-years away
 const kepler186Geo = new THREE.SphereGeometry(7, 32, 32);
 const kepler186Mat = new THREE.MeshBasicMaterial({
 color: 0xFF6B4A,
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
 name: 'kepler186Star',
 type: 'star',
 description: t('descKepler186Star'),
 distance: '500 light-years',
 realSize: '0.54 times the Sun\'s diameter',
 funFact: t('funFactKepler186Star'),
 basePosition: { x: -8000, y: -2000, z: 9450 }
 };
 
 scene.add(kepler186);
 this.objects.push(kepler186);
 this.nearbyStars.push(kepler186);
 
 if (DEBUG.enabled) console.log(` Created ${this.nearbyStars.length} nearby stars and exoplanet host stars`);
 }

 createExoplanets(scene) {
 // Create famous discovered exoplanets with orbital motion around their host stars
 this.exoplanets = [];

 // Earth's orbital speed reference: ~0.0005 rad/frame at timeSpeed=1
 // Speed = EARTH_SPEED * (365.25 / orbitalPeriodDays)
 const EARTH_SPEED = 0.0005;

 const exoplanetsData = [
 {
 name: 'Proxima Centauri b',
 hostStarPosition: { x: 8500, y: 800, z: -6200 }, // Proxima Centauri
 orbitRadius: 28, // Visible orbit distance around host star
 orbitPeriodDays: 11.2, // 11.2-day year
 orbitTilt: 0.08, // Slight tilt for visual interest
 radius: 1.1,
 color: 0x4A7BA7,
 description: t('descProximaCentauriB'),
 distance: '4.24 light-years',
 realSize: '~1.17 Earth masses',
 funFact: t('funFactProximaCentauriB')
 },
 {
 name: 'Kepler-452b',
 hostStarPosition: { x: -9000, y: 2500, z: 8450 }, // Kepler-452
 orbitRadius: 45,
 orbitPeriodDays: 385, // 385-day year
 orbitTilt: 0.12,
 radius: 1.6,
 color: 0x5D8AA8,
 description: t('descKepler452b'),
 distance: '1,400 light-years',
 realSize: '1.6 times Earth\'s radius',
 funFact: t('funFactKepler452b')
 },
 {
 name: 'TRAPPIST-1e',
 hostStarPosition: { x: 7000, y: -3000, z: -8950 }, // TRAPPIST-1
 orbitRadius: 35,
 orbitPeriodDays: 6.1, // 6.1-day year — very fast!
 orbitTilt: 0.05,
 radius: 0.92,
 color: 0x3A7CA5,
 description: t('descTrappist1e'),
 distance: '40 light-years',
 realSize: '0.92 times Earth\'s radius',
 funFact: t('funFactTrappist1e')
 },
 {
 name: 'Kepler-186f',
 hostStarPosition: { x: -8000, y: -2000, z: 9450 }, // Kepler-186
 orbitRadius: 40,
 orbitPeriodDays: 130, // 130-day year
 orbitTilt: 0.1,
 radius: 1.1,
 color: 0x2E5F6F,
 description: t('descKepler186f'),
 distance: '500 light-years',
 realSize: '1.1 times Earth\'s radius',
 funFact: t('funFactKepler186f')
 }
 ];

 exoplanetsData.forEach(exoData => {
 const orbitSpeed = EARTH_SPEED * (365.25 / exoData.orbitPeriodDays);
 // Seed orbital phase from current JD so the position is deterministic and
 // consistent with the time machine. Mean anomaly = (daysSinceJ2000 / period) * 2π.
 const _exoDaysSinceJ2000 = this.simulatedJD - 2451545.0;
 const initialAngle = ((_exoDaysSinceJ2000 % exoData.orbitPeriodDays) / exoData.orbitPeriodDays) * Math.PI * 2;
 const { x: sx, y: sy, z: sz } = exoData.hostStarPosition;

 // --- Orbit ring ---
 const ringGeo = new THREE.RingGeometry(exoData.orbitRadius - 0.3, exoData.orbitRadius + 0.3, 96);
 const ringMat = new THREE.MeshBasicMaterial({
 color: 0x445566,
 side: THREE.DoubleSide,
 transparent: true,
 opacity: 0.35,
 depthWrite: false
 });
 const orbitRing = new THREE.Mesh(ringGeo, ringMat);
 orbitRing.position.set(sx, sy, sz);
 orbitRing.rotation.x = Math.PI / 2 + exoData.orbitTilt;
 scene.add(orbitRing);

 // --- Planet mesh ---
 const geometry = new THREE.SphereGeometry(exoData.radius, 32, 32);

 // Seeded canvas texture so it's consistent per planet
 const canvas = document.createElement('canvas');
 canvas.width = 512;
 canvas.height = 256;
 const ctx = canvas.getContext('2d');

 ctx.fillStyle = `rgb(${(exoData.color >> 16) & 255}, ${(exoData.color >> 8) & 255}, ${exoData.color & 255})`;
 ctx.fillRect(0, 0, 512, 256);

 // Land masses
 ctx.fillStyle = 'rgba(100, 140, 80, 0.7)';
 for (let i = 0; i < 8; i++) {
 ctx.beginPath();
 ctx.arc(64 + i * 55, 30 + (i % 3) * 80, 20 + (i % 4) * 10, 0, Math.PI * 2);
 ctx.fill();
 }

 // Clouds
 ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
 for (let i = 0; i < 15; i++) {
 ctx.beginPath();
 ctx.arc(30 + i * 32, 10 + (i % 5) * 44, 10 + (i % 3) * 7, 0, Math.PI * 2);
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

 // Set initial orbital position
 planet.position.set(
 sx + exoData.orbitRadius * Math.cos(initialAngle),
 sy,
 sz + exoData.orbitRadius * Math.sin(initialAngle)
 );

 // Glow
 const glowGeo = new THREE.SphereGeometry(exoData.radius * 1.2, 32, 32);
 const glowMat = new THREE.MeshBasicMaterial({
 color: 0x88AAFF,
 transparent: true,
 opacity: 0.15,
 blending: THREE.AdditiveBlending
 });
 planet.add(new THREE.Mesh(glowGeo, glowMat));

 planet.userData = {
 name: exoData.name,
 type: 'exoplanet',
 description: exoData.description,
 distance: exoData.distance,
 realSize: exoData.realSize,
 funFact: exoData.funFact,
 // Orbit data
 angle: initialAngle,
 orbitSpeed,
 orbitRadius: exoData.orbitRadius,
 hostStarPos: new THREE.Vector3(sx, sy, sz)
 };

 scene.add(planet);
 this.objects.push(planet);
 this.exoplanets.push(planet);
 });

 if (DEBUG.enabled) console.log(` Created ${this.exoplanets.length} exoplanets with orbital motion`);
 }

 createComets(scene) {
 // Create comets with REALISTIC sizes (typically 1-60 km)
 // All comets rendered with hyperrealistic nucleus, coma, and dual tails
 this.comets = [];
 
 const cometsData = [
 // perihelionJD: Julian Date of most recent perihelion passage (from JPL/IAU MPC).
 // initPositionsToDate() uses this so mean anomaly is 0 at perihelion, giving
 // a correct orbital phase for any queried date.
 // inclination: orbital inclination to the ecliptic in degrees (source: JPL Small-Body DB).
 //   Values > 90° indicate retrograde orbits.

 // Halley: last perihelion Feb 9, 1986 (JD 2446470.5); next ~Jul 28, 2061 (JD 2473621.5)
 // Inclination 162.3° = retrograde, ~18° to ecliptic
 { name: 'Halley\'s Comet', distance: 1795, eccentricity: 0.967, inclination: 162.3, speed: 0.02, size: 0.002, description: t('descHalley'), orbitalPeriod: 27511, perihelionJD: 2446470.5 },
 // Hale-Bopp: perihelion Apr 1, 1997 (JD 2450538.0); period ~2520 yr
 // Inclination 89.4° = near-polar orbit
 { name: 'Comet Hale-Bopp', distance: 12820, eccentricity: 0.995, inclination: 89.4, speed: 0.015, size: 0.005, description: t('descHaleBopp'), orbitalPeriod: 925188, perihelionJD: 2450538.0 },
 // Hyakutake: perihelion May 1, 1996 (JD 2450204.5); period ~70,000 yr (hyperbolic escapee)
 // Inclination 124.9° = retrograde
 { name: 'Comet Hyakutake', distance: 1540, eccentricity: 0.999, inclination: 124.9, speed: 0.022, size: 0.0015, description: t('descHyakutake'), orbitalPeriod: 25567500, perihelionJD: 2450204.5 },
 // Lovejoy (C/2011 W3): perihelion Dec 16, 2011 (JD 2455912.0); period ~622 yr
 // Inclination 134.1° = retrograde sungrazer
 { name: 'Comet Lovejoy', distance: 770, eccentricity: 0.998, inclination: 134.1, speed: 0.04, size: 0.0008, description: t('descLovejoy'), orbitalPeriod: 227185, perihelionJD: 2455912.0 },
 // Encke: most recent perihelion Oct 22, 2023 (JD 2460240.5); period 3.30 yr = 1205 d
 // Inclination 11.8° = low-inclination prograde
 { name: 'Comet Encke', distance: 385, eccentricity: 0.847, inclination: 11.8, speed: 0.035, size: 0.0018, description: t('descEncke'), orbitalPeriod: 1205, perihelionJD: 2460240.5 },
 // Swift-Tuttle: perihelion Dec 12, 1992 (JD 2448967.5); period 133.3 yr = 48680 d
 // Inclination 113.4° = retrograde (source of Perseid meteor shower)
 { name: 'Comet Swift-Tuttle', distance: 2570, eccentricity: 0.963, inclination: 113.4, speed: 0.018, size: 0.003, description: t('descSwiftTuttle'), orbitalPeriod: 48680, perihelionJD: 2448967.5 }
 ];

 // Shared coma textures — created once, reused for all comets.
 // Canvas radial gradients give a smooth circular halo with zero polygon edges.
 const _makeComaTexture = (canvasSize, colorStops) => {
 const canvas = document.createElement('canvas');
 canvas.width = canvasSize; canvas.height = canvasSize;
 const ctx = canvas.getContext('2d');
 const c = canvasSize / 2;
 const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
 colorStops.forEach(([pos, r, g, b, a]) => grad.addColorStop(pos, `rgba(${r},${g},${b},${a})`));
 ctx.fillStyle = grad;
 ctx.fillRect(0, 0, canvasSize, canvasSize);
 return new THREE.CanvasTexture(canvas);
 };
 // Inner bright coma: warm white-blue core fading outward
 const _innerComaTex = _makeComaTexture(128, [
 [0.00, 255, 252, 240, 1.00],
 [0.12, 210, 240, 255, 0.90],
 [0.30, 140, 210, 255, 0.55],
 [0.55, 80, 170, 255, 0.20],
 [0.80, 50, 140, 255, 0.06],
 [1.00, 30, 120, 255, 0.00],
 ]);
 // Outer diffuse halo: large, faint greenish-blue (coma scatters sunlight)
 const _outerComaTex = _makeComaTexture(64, [
 [0.00, 160, 220, 200, 0.22],
 [0.30, 120, 200, 180, 0.12],
 [0.65, 80, 170, 160, 0.04],
 [1.00, 60, 150, 140, 0.00],
 ]);

 cometsData.forEach((cometData, index) => {
 const cometGroup = new THREE.Group();

 // ===== HYPER-REALISTIC NUCLEUS =====
 // Irregular, potato-shaped icy-rocky core with surface details
 const nucleusGeometry = new THREE.IcosahedronGeometry(cometData.size, 2);
 
 // Deform vertices for irregular shape (inline — avoids Vector3 allocations)
 const positions = nucleusGeometry.attributes.position.array;
 for (let i = 0; i < positions.length; i += 3) {
 const scale = 1.0 + 0.15 + Math.random() * 0.2;
 positions[i] *= scale;
 positions[i + 1] *= scale;
 positions[i + 2] *= scale;
 }
 nucleusGeometry.attributes.position.needsUpdate = true;
 nucleusGeometry.computeVertexNormals();
 
 const nucleusMaterial = new THREE.MeshStandardMaterial({
 color: 0x3a3a3a, // Dark gray-black (dirty ice + rock)
 roughness: 0.95,
 metalness: 0.05,
 emissive: 0x6688aa, // Faint blue outgassing glow, visible when zoomed in
 emissiveIntensity: 0.45
 });
 
 const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
 cometGroup.add(nucleus);
 
 // Surface ice patches (bright spots) - MORE realistic distribution
 for (let i = 0; i < 15; i++) {
 const patchSize = cometData.size * (0.1 + Math.random() * 0.15);
 const patchGeometry = new THREE.SphereGeometry(patchSize, 6, 6);
 const patchMaterial = new THREE.MeshStandardMaterial({
 color: 0xf0f8ff, // Bright icy white
 roughness: 0.4,
 metalness: 0.2,
 emissive: 0x88ccff,
 emissiveIntensity: 0.5 + Math.random() * 0.3
 });
 const patch = new THREE.Mesh(patchGeometry, patchMaterial);
 // Random position on surface
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.random() * Math.PI;
 const r = cometData.size * (0.9 + Math.random() * 0.2);
 patch.position.set(
 r * Math.sin(phi) * Math.cos(theta),
 r * Math.sin(phi) * Math.sin(theta),
 r * Math.cos(phi)
 );
 cometGroup.add(patch);
 }
 
 // Active gas jets (bright spots showing outgassing)
 for (let i = 0; i < 5; i++) {
 const jetGeometry = new THREE.SphereGeometry(cometData.size * 0.08, 8, 8);
 const jetMaterial = new THREE.MeshBasicMaterial({
 color: 0xffffff,
 transparent: true,
 opacity: 0.8,
 blending: THREE.AdditiveBlending
 });
 const jet = new THREE.Mesh(jetGeometry, jetMaterial);
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.random() * Math.PI;
 const r = cometData.size * 1.1;
 jet.position.set(
 r * Math.sin(phi) * Math.cos(theta),
 r * Math.sin(phi) * Math.sin(theta),
 r * Math.cos(phi)
 );
 cometGroup.add(jet);
 }
 
 // Visual radius: visible in solar-system overview but not planet-sized (real coma ~100,000 km)
 const visualRadius = Math.max(cometData.size * 400, 1.0);

 // ===== REALISTIC COMA: layered smooth sprite halos =====
 // Sprites always face the camera (no polygon edges) and use pre-built
 // canvas radial gradients so the coma looks like a soft circular glow.
 const innerComa = new THREE.Sprite(new THREE.SpriteMaterial({
 map: _innerComaTex,
 transparent: true,
 blending: THREE.AdditiveBlending,
 depthWrite: false,
 opacity: 0.92
 }));
 innerComa.scale.set(visualRadius * 1.4, visualRadius * 1.4, 1);
 cometGroup.add(innerComa);

 const outerComa = new THREE.Sprite(new THREE.SpriteMaterial({
 map: _outerComaTex,
 transparent: true,
 blending: THREE.AdditiveBlending,
 depthWrite: false,
 opacity: 0.70
 }));
 outerComa.scale.set(visualRadius * 3.5, visualRadius * 3.5, 1);
 cometGroup.add(outerComa);
 
 // ===== SPECTACULAR DUST TAIL =====
 // Curved, broad, golden-yellow with turbulent structure
 const dustParticles = 280; // Further reduced particle count for subtler tails
 const dustTailGeometry = new THREE.BufferGeometry();
 const dustTailPositions = new Float32Array(dustParticles * 3);
 const dustTailColors = new Float32Array(dustParticles * 3);
 const dustTailSizes = new Float32Array(dustParticles);
 
 for (let i = 0; i < dustParticles; i++) {
 const t = i / dustParticles;
 const spread = t * 0.7; // Proportional spread
 const curve = t * t * 1.0; // Curved tail
 const turbulence = Math.sin(i * 0.5) * spread * 0.15; // Add turbulence
 
 dustTailPositions[i * 3] = curve + turbulence + (Math.random() - 0.5) * spread * 0.3;
 dustTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
 dustTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8;
 
 // Size decreases with distance, with variation
 dustTailSizes[i] = (0.05 + Math.random() * 0.025) * (1 - t * 0.8);
 
 // Gradient: bright white-yellow → orange-red → dark
 const brightness = 0.45 - t * 0.3;
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
 opacity: 0.14, // More subtle dust tail
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 
 const dustTail = new THREE.Points(dustTailGeometry, dustTailMaterial);
 cometGroup.add(dustTail);

 // Precomputed jitter seeds (hot-path optimization: avoid per-frame Math.random in animate loop)
 const dustJitterA = new Float32Array(dustParticles);
 const dustJitterB = new Float32Array(dustParticles);
 for (let i = 0; i < dustParticles; i++) {
 dustJitterA[i] = Math.random() - 0.5;
 dustJitterB[i] = Math.random() - 0.5;
 }
 
 // ===== BRILLIANT ION TAIL =====
 // Straight, narrow, electric blue plasma stream with wisps
 const ionParticles = 180; // Further reduced particle count for subtle plasma tail
 const ionTailGeometry = new THREE.BufferGeometry();
 const ionTailPositions = new Float32Array(ionParticles * 3);
 const ionTailColors = new Float32Array(ionParticles * 3);
 const ionTailSizes = new Float32Array(ionParticles);
 
 for (let i = 0; i < ionParticles; i++) {
 const t = i / ionParticles;
 const spread = t * 0.2; // Narrower than dust tail but with wisps
 const length = t * 1.5; // Longer, straight ion tail
 const wisp = Math.sin(i * 0.3) * spread * 0.2; // Wispy structure
 
 ionTailPositions[i * 3] = length + wisp + (Math.random() - 0.5) * 0.015;
 ionTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
 ionTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8;
 
 // Size variation with brilliant streaks
 const ionBrightness = Math.pow(1 - t, 0.4) * (0.6 + Math.random() * 0.3);
 ionTailSizes[i] = (0.04 + Math.random() * 0.05) * ionBrightness;
 
 // Electric blue plasma gradient - brilliant cyan-blue
 const intensity = (1 - t * 0.5) * ionBrightness * 0.35; // Further dimmed ion emission
 ionTailColors[i * 3] = 0.4 * intensity; // R - less red for purer blue
 ionTailColors[i * 3 + 1] = 0.85 * intensity; // G - strong cyan
 ionTailColors[i * 3 + 2] = 1.0 * intensity; // B - full blue
 }
 
 ionTailGeometry.setAttribute('position', new THREE.BufferAttribute(ionTailPositions, 3));
 ionTailGeometry.setAttribute('color', new THREE.BufferAttribute(ionTailColors, 3));
 ionTailGeometry.setAttribute('size', new THREE.BufferAttribute(ionTailSizes, 1));
 
 const ionTailMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.18, // More subtle ion tail
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 
 const ionTail = new THREE.Points(ionTailGeometry, ionTailMaterial);
 cometGroup.add(ionTail);

 // Precomputed ion jitter seeds (hot-path optimization)
 const ionJitter = new Float32Array(ionParticles);
 for (let i = 0; i < ionParticles; i++) {
 ionJitter[i] = Math.random() - 0.5;
 }
 
 // Clamp eccentricity so perihelion stays outside the sun (radius 15 + 30 safety margin = 45 units).
 // Sungrazers like Hyakutake (e=0.999) and Lovejoy (e=0.998) would otherwise dive deep inside the sun mesh.
 const MIN_PERIHELION = 45;
 const safeEccentricity = Math.min(cometData.eccentricity, 1 - MIN_PERIHELION / cometData.distance);

 cometGroup.userData = {
 name: cometData.name,
 type: 'comet',
 radius: visualRadius, // Use visual coma radius for zoom/label sizing
 actualSize: cometData.size, // True nucleus size
 visualRadius: visualRadius,
 distance: cometData.distance,
 angle: 0, // true anomaly (derived from meanAnomaly via Kepler solver)
 meanAnomaly: 0, // mean anomaly (advanced linearly with time)
 speed: cometData.speed,
 eccentricity: safeEccentricity, // Clamped to keep perihelion outside sun
 originalEccentricity: cometData.eccentricity, // Stored for reclamping after scale changes
 inclination: cometData.inclination || 0, // Orbital inclination to ecliptic in degrees (JPL Small-Body DB)
 orbitalPeriod: cometData.orbitalPeriod,
 perihelionJD: cometData.perihelionJD || null, // Real perihelion epoch (JD) for date-accurate phase
 description: cometData.description,
 realSize: '1-60 km nucleus',
 funFact: t('funFactComets'),
 dustTail: dustTail,
 ionTail: ionTail,
 dustParticles,
 ionParticles,
 dustJitterA,
 dustJitterB,
 ionJitter,
 isComet: true, // Flag for special zoom handling
 _sunDir: new THREE.Vector3(), // Pre-allocated for tail updates
 _velDir: new THREE.Vector3(), // Pre-allocated for tail updates
 // Pre-cached trig for inclination and Kepler sqrt — constant per comet
 inclRad: (cometData.inclination || 0) * Math.PI / 180,
 _cosIncl: Math.cos((cometData.inclination || 0) * Math.PI / 180),
 _sinIncl: Math.sin((cometData.inclination || 0) * Math.PI / 180),
 _keplerSqrtPlus: Math.sqrt(1 + safeEccentricity),
 _keplerSqrtMinus: safeEccentricity < 1 ? Math.sqrt(1 - safeEccentricity) : 0
 };
 
 // ===== ELLIPTICAL ORBIT PATH =====
 const orbitSegments = 256;
 const orbitPoints = [];
 const orbitA = cometData.distance;
 const orbitE = safeEccentricity; // use same clamped value stored in userData
 const orbitInclRad = (cometData.inclination || 0) * Math.PI / 180;
 for (let j = 0; j <= orbitSegments; j++) {
 const f = (j / orbitSegments) * Math.PI * 2;
 const orbitR = orbitA * (1 - orbitE * orbitE) / (1 + orbitE * Math.cos(f));
 orbitPoints.push(new THREE.Vector3(orbitR * Math.cos(f), orbitR * Math.sin(f) * Math.sin(orbitInclRad), orbitR * Math.sin(f) * Math.cos(orbitInclRad)));
 }
 const cometOrbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
 const cometOrbitMat = new THREE.LineBasicMaterial({
 color: 0xCC9955,
 transparent: true,
 opacity: 0.6,
 depthWrite: false
 });
 const cometOrbitLine = new THREE.Line(cometOrbitGeo, cometOrbitMat);
 cometOrbitLine.visible = this.cometOrbitsVisible;
 cometOrbitLine.renderOrder = 1;
 // Disable frustum culling: highly eccentric orbits have a bounding sphere
 // centered far from the origin (focus), so Three.js incorrectly culls the
 // near-perihelion arc even when it is inside the camera frustum.
 cometOrbitLine.frustumCulled = false;
 cometOrbitLine.userData = { type: 'orbit', comet: cometData.name };
 scene.add(cometOrbitLine);
 this.cometOrbits.push(cometOrbitLine);
 cometGroup.userData.orbitLine = cometOrbitLine;

 cometGroup.visible = true; // Ensure comet is visible
 scene.add(cometGroup);
 this.objects.push(cometGroup);
 this.comets.push(cometGroup);
 this.pickableObjects.push(cometGroup);
 
 if (DEBUG.enabled) console.log(` ${cometData.name} created at distance ${cometData.distance}, visualRadius=${visualRadius.toFixed(2)}`);
 });
 }

createHyperrealisticHubble(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic Hubble Space Telescope');
        const hubble = new THREE.Group();
        const scale = 0.002;
        
        // Use spacecraft material presets
        const bodyMat = MaterialFactory.createSpacecraftMaterial('silver');
        const goldMat = MaterialFactory.createSpacecraftMaterial('gold');
        const darkMat = MaterialFactory.createSpacecraftMaterial('dark');
        const panelMat = MaterialFactory.createSpacecraftMaterial('solarPanel');
        
        // Main tube with geometry caching
        const tube = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 2.1, scale * 2.1, scale * 13.2, 32, this.geometryCache),
            bodyMat
        );
        tube.rotation.z = Math.PI / 2;
        hubble.add(tube);
        
        // Aperture shield
        const shield = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 2.4, scale * 2.1, scale * 3, 32, this.geometryCache),
            bodyMat
        );
        shield.rotation.z = Math.PI / 2;
        shield.position.x = scale * 8;
        hubble.add(shield);
        
        // Aperture opening
        const aperture = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 1.2, scale * 1.2, scale * 0.2, 32, this.geometryCache),
            darkMat
        );
        aperture.rotation.z = Math.PI / 2;
        aperture.position.x = scale * 9.6;
        hubble.add(aperture);
        
        // Aft section
        const aft = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 2.1, scale * 2.1, scale * 2, 32, this.geometryCache),
            goldMat
        );
        aft.rotation.z = Math.PI / 2;
        aft.position.x = -scale * 7;
        hubble.add(aft);
        
        // Solar panel creation with geometry caching
        const createPanel = (yPos) => {
            const panel = new THREE.Mesh(
                GeometryFactory.createBox(scale * 0.1, scale * 2.5, scale * 7.1, this.geometryCache),
                panelMat
            );
            panel.position.y = yPos;
            
            const frame1 = new THREE.Mesh(
                GeometryFactory.createBox(scale * 0.15, scale * 2.6, scale * 0.1, this.geometryCache),
                bodyMat
            );
            frame1.position.z = scale * 3.5;
            panel.add(frame1);
            
            const frame2 = new THREE.Mesh(
                GeometryFactory.createBox(scale * 0.15, scale * 2.6, scale * 0.1, this.geometryCache),
                bodyMat
            );
            frame2.position.z = -scale * 3.5;
            panel.add(frame2);
            
            for (let i = -3; i <= 3; i++) {
                const line = new THREE.Mesh(
                    GeometryFactory.createBox(scale * 0.12, scale * 0.02, scale * 7.1, this.geometryCache),
                    bodyMat
                );
                line.position.y = scale * i * 0.4;
                panel.add(line);
            }
            
            return panel;
        };
        
        hubble.add(createPanel(scale * 5));
        hubble.add(createPanel(-scale * 5));
        
        // Communication antenna
        const antenna = new THREE.Mesh(
            GeometryFactory.createCone(scale * 0.8, scale * 1.5, 16, this.geometryCache),
            bodyMat
        );
        antenna.rotation.x = Math.PI / 2;
        antenna.position.set(-scale * 5, 0, scale * 3);
        hubble.add(antenna);
        
        // Small antennas
        for (let i = 0; i < 2; i++) {
            const smallAntenna = new THREE.Mesh(
                GeometryFactory.createCylinder(scale * 0.1, scale * 0.1, scale * 0.8, 8, this.geometryCache),
                bodyMat
            );
            smallAntenna.position.set(-scale * 6, i === 0 ? scale * 1.5 : -scale * 1.5, scale * 2);
            hubble.add(smallAntenna);
        }
        
        // Equipment bay with geometry caching
        const bay = new THREE.Mesh(
            GeometryFactory.createBox(scale * 1.5, scale * 1.5, scale * 2, this.geometryCache),
            goldMat
        );
        bay.position.set(-scale * 4, 0, -scale * 2.5);
        hubble.add(bay);
        
        // Radiators with geometry caching (reuse same geometry)
        const radiatorGeom = GeometryFactory.createBox(scale * 0.1, scale * 0.8, scale * 2, this.geometryCache);
        for (let i = 0; i < 3; i++) {
            const radiator = new THREE.Mesh(radiatorGeom, bodyMat);
            radiator.position.set(-scale * 2 + i * scale * 2, 0, scale * 2.8);
            hubble.add(radiator);
        }
        
        return hubble;
    }

    createHyperrealisticJWST(satData) {
        if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic James Webb Space Telescope');
        const jwst = new THREE.Group();
        // JWST geometry below uses many real-meter constants (e.g. 21.2m sunshield width).
        // Normalize those dimensions to the scene scale so JWST is not oversized
        // compared to other spacecraft models.
        const displaySize = satData.size || 0.03;
        const scale = displaySize / 21.2;

        const goldMat = MaterialFactory.createSpacecraftMaterial('goldBright');
        const shieldMat = MaterialFactory.createSpacecraftMaterial('shield');
        const structMat = MaterialFactory.createSpacecraftMaterial('structure');

        // --- Primary mirror: 18 hexagonal beryllium segments ---
        // Accurate 3-4-6-4-3 column layout matching real JWST deployment diagram (NASA)
        // Spacing s=1.5 hex-widths; columns centred on Y-axis, wings fold along Y
        const hexRadius = scale * 0.66;
        const createHex = () => {
            const shape = new THREE.Shape();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + Math.PI / 6; // flat-top orientation
                const x = hexRadius * Math.cos(angle);
                const y = hexRadius * Math.sin(angle);
                if (i === 0) shape.moveTo(x, y);
                else shape.lineTo(x, y);
            }
            shape.closePath();
            return new THREE.ExtrudeGeometry(shape, { depth: scale * 0.08, bevelEnabled: false });
        };
        const hexGeom = createHex();
        const s = 1.5; // grid spacing multiplier
        const h = s * Math.sqrt(3) / 2; // hex row offset
        // 18 positions in accurate JWST 3-4-6-4-3 column arrangement:
        const mirrorPos = [
            // Left folding wing (3 segments)
            [-3*s,  h], [-3*s, -h], [-2.5*s, 0],
            // Left inner column (4 segments)
            [-1.5*s,  h*2], [-1.5*s,  0], [-1.5*s, -h*2], [-2*s, -h],
            // Centre column (4 segments — top 2 and bottom 2, actual centre is 6 but scaled)
            [0, h*3], [0, h], [0, -h], [0, -h*3],
            // Right inner column (4 segments)
            [1.5*s, h*2], [1.5*s, 0], [1.5*s, -h*2], [2*s, h],
            // Right folding wing (3 segments)
            [3*s, h], [3*s, -h], [2.5*s, 0]
        ];
        mirrorPos.forEach(pos => {
            const hex = new THREE.Mesh(hexGeom, goldMat);
            hex.position.set(scale * pos[0], scale * pos[1], scale * 3);
            hex.rotation.x = Math.PI / 2;
            jwst.add(hex);
        });

        // --- Secondary mirror (0.74m diameter, hexagonal) ---
        const secMirror = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.37, scale * 0.37, scale * 0.08, 6, this.geometryCache),
            goldMat
        );
        secMirror.position.z = scale * 7.5;
        jwst.add(secMirror);

        // --- 3 secondary mirror support struts (tripod boom from primary edge) ---
        const strutGeom = GeometryFactory.createCylinder(scale * 0.04, scale * 0.04, scale * 5, 6, this.geometryCache);
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i + Math.PI / 6;
            const strut = new THREE.Mesh(strutGeom, structMat);
            strut.position.x = Math.cos(angle) * scale * 2.5;
            strut.position.y = Math.sin(angle) * scale * 2.5;
            strut.position.z = scale * 5;
            // Tilt struts inward toward secondary at z=7.5
            strut.rotation.x = Math.atan2(scale * 2.5, scale * 5) * 0.6;
            strut.rotation.z = -angle;
            jwst.add(strut);
        }

        // --- Spacecraft bus (~2.4m cube) ---
        const bus = new THREE.Mesh(
            GeometryFactory.createBox(scale * 2, scale * 2, scale * 1.5, this.geometryCache),
            MaterialFactory.createSpacecraftMaterial('body')
        );
        bus.position.z = scale * 1.2;
        jwst.add(bus);

        // --- Sunshield: 5 layers, KITE/DIAMOND shape (not rectangular!) ---
        // Real JWST sunshield is a 5-sided kite: wide centre (~14m), tapered to both ends
        // Aproximated as a hexagonal shape truncated top/bottom: width 21.2m, height 14.2m
        const createSunshieldShape = (wScale, hScale) => {
            const w = scale * 21.2 * wScale;
            const h2 = scale * 14.2 * hScale;
            const shape = new THREE.Shape();
            // Kite/pentagon: pointed left & right, flat top & bottom edges with chamfered corners
            shape.moveTo(0,  h2 * 0.2);           // top-centre
            shape.lineTo( w * 0.5, 0);            // right point
            shape.lineTo( w * 0.35, -h2 * 0.5);  // bottom-right
            shape.lineTo(-w * 0.35, -h2 * 0.5);  // bottom-left
            shape.lineTo(-w * 0.5, 0);            // left point
            shape.lineTo(-w * 0.35,  h2 * 0.5);  // top-left
            shape.lineTo( w * 0.35,  h2 * 0.5);  // top-right
            shape.closePath();
            return new THREE.ShapeGeometry(shape);
        };
        for (let layer = 0; layer < 5; layer++) {
            const reduction = 1 - layer * 0.015; // each layer slightly smaller
            const shieldGeom = createSunshieldShape(reduction, reduction);
            const shieldLayer = new THREE.Mesh(shieldGeom, shieldMat.clone());
            shieldLayer.material.color.setHex(0xE0E0D8 - layer * 0x080806);
            shieldLayer.material.side = THREE.DoubleSide;
            shieldLayer.position.z = -scale * (0.3 + layer * 0.25);
            jwst.add(shieldLayer);
        }

        // --- Sunshield support booms (2 deployable arms along X-axis) ---
        const boomGeom = GeometryFactory.createCylinder(scale * 0.07, scale * 0.07, scale * 21.2, 6, this.geometryCache);
        const boom = new THREE.Mesh(boomGeom, structMat);
        boom.position.set(0, 0, -scale * 0.8);
        boom.rotation.z = Math.PI / 2; // along X axis
        jwst.add(boom);

        // --- Solar array: single roughly-square panel on +Y side of bus ---
        // Real JWST: ~2.0m × 2.5m single body-mounted solar array
        const panel = new THREE.Mesh(
            GeometryFactory.createBox(scale * 2.5, scale * 2.0, scale * 0.05, this.geometryCache),
            MaterialFactory.createSpacecraftMaterial('solarPanel')
        );
        panel.position.set(0, scale * 2.2, scale * 1.2);
        jwst.add(panel);

        // --- High-gain antenna (gimballed dish, pointing sunward away from mirror) ---
        const antenna = new THREE.Mesh(
            GeometryFactory.createCone(scale * 0.8, scale * 0.4, 16, this.geometryCache),
            MaterialFactory.createSpacecraftMaterial('white')
        );
        antenna.position.set(scale * 1.2, -scale * 0.8, -scale * 1.8);
        antenna.rotation.x = Math.PI * 0.85;
        jwst.add(antenna);

        return jwst;
    }

    createHyperrealisticSputnik(satData) {
        if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Sputnik 1');
        const sputnik = new THREE.Group();
        const scale = satData.size || 0.02;
        const R = scale * 2.9; // sphere radius (58 cm real diameter → R = 29 cm)

        // ── Main spherical body ─────────────────────────────────────────────
        // Highly polished N1-Al aluminium alloy — near-mirror finish
        sputnik.add(new THREE.Mesh(
            GeometryFactory.createSphere(R, 64, 48, this.geometryCache),
            new THREE.MeshStandardMaterial({
                color: 0xD4D4D4,
                roughness: 0.03,
                metalness: 1.0,
                emissive: 0x282828,
                emissiveIntensity: 0.14
            })
        ));

        // ── Equatorial mating seam (two hemispheres bolted together) ────────
        const seamMat = new THREE.MeshStandardMaterial({
            color: 0x909090, metalness: 0.85, roughness: 0.25
        });
        const seam = new THREE.Mesh(
            new THREE.TorusGeometry(R, scale * 0.07, 12, 72),
            seamMat
        );
        seam.rotation.x = Math.PI / 2; // ring lies in XZ plane (equator)
        sputnik.add(seam);

        // 12 bolt heads evenly spaced around the equatorial seam
        const boltMat = new THREE.MeshStandardMaterial({
            color: 0x787878, metalness: 0.9, roughness: 0.2
        });
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const bolt = new THREE.Mesh(
                GeometryFactory.createSphere(scale * 0.09, 6, 6, this.geometryCache),
                boltMat
            );
            bolt.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); // in XZ plane
            sputnik.add(bolt);
        }

        // ── Four whip antennas — all trailing rearward (−Z direction) ───────
        // All antennas emerge from the rear hemisphere and trail behind the satellite.
        // Short pair (2.4 m real, ≈12 × scale): splayed ±35° in the X–Z plane.
        // Long  pair (2.9 m real, ≈14.5 × scale): splayed ±65° in the Y–Z plane.
        const antennaMat = new THREE.MeshStandardMaterial({
            color: 0xBCBCBC, roughness: 0.12, metalness: 0.95
        });
        const stubMat = new THREE.MeshStandardMaterial({
            color: 0x999999, metalness: 0.9, roughness: 0.2
        });
        // Y axis — used as the "up" axis of every CylinderGeometry for quaternion alignment
        const yAxis = new THREE.Vector3(0, 1, 0);

        const antennaConfig = [
            { sx:  1, sy:  0, tilt: 35, len: scale * 12   }, // short, +X spread
            { sx: -1, sy:  0, tilt: 35, len: scale * 12   }, // short, -X spread
            { sx:  0, sy:  1, tilt: 65, len: scale * 14.5 }, // long,  +Y spread
            { sx:  0, sy: -1, tilt: 65, len: scale * 14.5 }, // long,  -Y spread
        ];

        for (const cfg of antennaConfig) {
            const tiltRad = (cfg.tilt * Math.PI) / 180;
            // Unit direction vector pointing from sphere centre along this antenna.
            // sin/cos identity guarantees |dir| = 1 because sx and sy are ±1 or 0.
            const dir = new THREE.Vector3(
                cfg.sx * Math.sin(tiltRad),
                cfg.sy * Math.sin(tiltRad),
                -Math.cos(tiltRad)   // always trailing toward −Z
            );
            const len = cfg.len;

            // Tapered tube: wider at the root, thin at the tip
            const antenna = new THREE.Mesh(
                GeometryFactory.createCylinder(scale * 0.05, scale * 0.015, len, 8, this.geometryCache),
                antennaMat
            );
            // Place cylinder centre halfway along the antenna, starting from sphere surface
            antenna.position.copy(dir).multiplyScalar(R + len * 0.5);
            // Align the cylinder's Y axis with the antenna direction
            antenna.quaternion.setFromUnitVectors(yAxis, dir);
            sputnik.add(antenna);

            // Conical mounting stub where antenna exits the sphere skin
            const stub = new THREE.Mesh(
                GeometryFactory.createCylinder(scale * 0.14, scale * 0.05, scale * 0.3, 8, this.geometryCache),
                stubMat
            );
            stub.position.copy(dir).multiplyScalar(R + scale * 0.15);
            stub.quaternion.setFromUnitVectors(yAxis, dir);
            sputnik.add(stub);
        }

        return sputnik;
    }

    createHyperrealisticPioneer(satData) {
        if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Pioneer probe');
        const pioneer = new THREE.Group();
        // Scale based on the spacecraft's display size
        const scale = satData.size || 0.07;
        
        // Materials
        const goldMat = MaterialFactory.createSpacecraftMaterial('gold');
        const silverMat = MaterialFactory.createSpacecraftMaterial('silver');
        const darkMat = MaterialFactory.createSpacecraftMaterial('body');
        
        // Main hexagonal bus (2.9m diameter)
        const bus = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 1.45, scale * 1.45, scale * 0.3, 6, this.geometryCache),
            goldMat
        );
        bus.rotation.x = Math.PI / 2;
        pioneer.add(bus);
        
        // RTG power source (elongated)
        const rtg = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.2, scale * 0.2, scale * 1.5, 16, this.geometryCache),
            darkMat
        );
        rtg.position.set(0, -scale * 1, 0);
        pioneer.add(rtg);
        
        // 2.74m high-gain antenna dish
        const dish = new THREE.Mesh(
            GeometryFactory.createCone(scale * 1.37, scale * 0.4, 32, this.geometryCache),
            silverMat
        );
        dish.position.z = scale * 0.5;
        pioneer.add(dish);
        
        // Medium-gain antenna
        const medAntenna = new THREE.Mesh(
            GeometryFactory.createCone(scale * 0.3, scale * 0.3, 16, this.geometryCache),
            silverMat
        );
        medAntenna.position.set(scale * 0.8, 0, scale * 0.3);
        pioneer.add(medAntenna);
        
        // Magnetometer boom (extended 6.6m)
        const magBoom = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.02, scale * 0.02, scale * 6.6, 8, this.geometryCache),
            silverMat
        );
        magBoom.position.x = -scale * 3.3;
        magBoom.rotation.z = Math.PI / 2;
        pioneer.add(magBoom);
        
        // Magnetometer sensor at end
        const magSensor = new THREE.Mesh(
            GeometryFactory.createSphere(scale * 0.1, 16, 16, this.geometryCache),
            darkMat
        );
        magSensor.position.x = -scale * 6.6;
        pioneer.add(magSensor);
        
        // Instruments (imaging photopolarimeter, etc)
        const instruments = new THREE.Mesh(
            GeometryFactory.createBox(scale * 0.4, scale * 0.4, scale * 0.3, this.geometryCache),
            darkMat
        );
        instruments.position.set(scale * 0.5, scale * 0.5, 0);
        pioneer.add(instruments);
        
        // Thruster module
        const thrusters = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.1, scale * 0.1, scale * 0.2, 8, this.geometryCache),
            silverMat
        );
        thrusters.position.set(0, scale * 1.2, -scale * 0.1);
        pioneer.add(thrusters);
        
        return pioneer;
    }

    createHyperrealisticVoyager(satData) {
        if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Voyager probe');
        const voyager = new THREE.Group();
        // Scale based on the spacecraft's display size
        const scale = satData.size || 0.08;
        
        // Materials
        const goldMat = MaterialFactory.createSpacecraftMaterial('gold');
        const silverMat = MaterialFactory.createSpacecraftMaterial('silver');
        const darkMat = MaterialFactory.createSpacecraftMaterial('body');
        const whiteMat = MaterialFactory.createSpacecraftMaterial('white');
        
        // 10-sided main bus (1.8m diameter)
        const bus = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.9, scale * 0.9, scale * 0.5, 10, this.geometryCache),
            goldMat
        );
        bus.rotation.x = Math.PI / 2;
        voyager.add(bus);
        
        // 3.7m high-gain antenna (famous white dish)
        const dish = new THREE.Mesh(
            GeometryFactory.createCone(scale * 1.85, scale * 0.5, 32, this.geometryCache),
            whiteMat
        );
        dish.position.z = scale * 0.6;
        voyager.add(dish);
        
        // Feed horn in center of dish
        const feedHorn = new THREE.Mesh(
            GeometryFactory.createCone(scale * 0.1, scale * 0.3, 16, this.geometryCache),
            darkMat
        );
        feedHorn.position.z = scale * 0.9;
        voyager.add(feedHorn);
        
        // Science boom (13m extended to the side) - reusable geometry
        const boomGeom = GeometryFactory.createCylinder(scale * 0.03, scale * 0.03, scale * 13, 8, this.geometryCache);
        const scienceBoom = new THREE.Mesh(boomGeom, silverMat);
        scienceBoom.position.x = scale * 6.5;
        scienceBoom.rotation.z = Math.PI / 2;
        voyager.add(scienceBoom);
        
        // Cameras and instruments at end of science boom
        const cameras = new THREE.Mesh(
            GeometryFactory.createBox(scale * 0.4, scale * 0.4, scale * 0.5, this.geometryCache),
            darkMat
        );
        cameras.position.x = scale * 13;
        voyager.add(cameras);
        
        // Magnetometer boom (opposite direction, 13m) - reuse boom geometry
        const magBoomThin = GeometryFactory.createCylinder(scale * 0.02, scale * 0.02, scale * 13, 8, this.geometryCache);
        const magBoom = new THREE.Mesh(magBoomThin, silverMat);
        magBoom.position.x = -scale * 6.5;
        magBoom.rotation.z = Math.PI / 2;
        voyager.add(magBoom);
        
        // Magnetometer sensors - reuse geometry
        const magSensorGeom = GeometryFactory.createSphere(scale * 0.08, 16, 16, this.geometryCache);
        for (let i = 0; i < 2; i++) {
            const magSensor = new THREE.Mesh(magSensorGeom, darkMat);
            magSensor.position.x = -scale * (10 + i * 3);
            voyager.add(magSensor);
        }
        
        // RTG power source (3 RTGs on boom below)
        const rtgBoom = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.04, scale * 0.04, scale * 4, 8, this.geometryCache),
            silverMat
        );
        rtgBoom.position.set(0, -scale * 2, 0);
        voyager.add(rtgBoom);
        
        // 3 RTG units - reuse geometry
        const rtgGeom = GeometryFactory.createCylinder(scale * 0.2, scale * 0.2, scale * 0.5, 16, this.geometryCache);
        for (let i = 0; i < 3; i++) {
            const rtg = new THREE.Mesh(rtgGeom, darkMat);
            rtg.position.set(scale * (i - 1) * 0.8, -scale * 4, 0);
            rtg.rotation.z = Math.PI / 2;
            voyager.add(rtg);
        }
        
        // Golden Record (iconic!)
        const record = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.15, scale * 0.15, scale * 0.02, 32, this.geometryCache),
            goldMat
        );
        record.position.set(-scale * 0.5, 0, scale * 0.3);
        record.rotation.x = Math.PI / 2;
        voyager.add(record);
        
        return voyager;
    }

    createHyperrealisticCassini(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic Cassini spacecraft');
        const cassini = new THREE.Group();
        // Scale based on the spacecraft's display size
        const scale = satData.size || 0.06;
        
        // Materials
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
        
        // Main bus (massive - 6.8m tall)
        const bus = new THREE.Mesh(new THREE.CylinderGeometry(scale * 2, scale * 2, scale * 6.8, 12), goldMat);
        bus.rotation.x = Math.PI / 2;
        cassini.add(bus);
        
        // 4m high-gain antenna (large white dish)
        const dish = new THREE.Mesh(new THREE.ConeGeometry(scale * 2, scale * 0.6, 32), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.9 }));
        dish.position.x = scale * 4;
        dish.rotation.z = -Math.PI / 2;
        cassini.add(dish);
        
        // Feed assembly
        const feedAssembly = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.15, scale * 0.15, scale * 0.5, 16), darkMat);
        feedAssembly.position.x = scale * 4.5;
        feedAssembly.rotation.z = Math.PI / 2;
        cassini.add(feedAssembly);
        
        // 11m magnetometer boom
        const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.04, scale * 0.04, scale * 11, 8), silverMat);
        magBoom.position.x = -scale * 5.5;
        magBoom.rotation.z = Math.PI / 2;
        cassini.add(magBoom);
        
        // Magnetometer at end
        const magSensor = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.12, 16, 16), darkMat);
        magSensor.position.x = -scale * 11;
        cassini.add(magSensor);
        
        // 3 RTG units (each 16m long!)
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const rtg = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.15, scale * 0.15, scale * 16, 16), darkMat);
            rtg.position.set(
                -scale * 2 + Math.cos(angle) * scale * 1.2,
                Math.sin(angle) * scale * 1.2,
                0
            );
            rtg.rotation.z = Math.PI / 2;
            cassini.add(rtg);
        }
        
        // Science instruments platform
        const instruments = new THREE.Mesh(new THREE.BoxGeometry(scale * 1.5, scale * 1.5, scale * 1), darkMat);
        instruments.position.x = scale * 2;
        cassini.add(instruments);
        
        // Huygens probe (detached but iconic part)
        const huygens = new THREE.Mesh(new THREE.CylinderGeometry(scale * 1.35, scale * 1.35, scale * 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.4, metalness: 0.6 }));
        huygens.position.set(scale * 1, scale * 2.5, 0);
        cassini.add(huygens);
        
        // Reaction wheels and propulsion
        const propulsion = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.8, scale * 0.8, scale * 1.5, 8), silverMat);
        propulsion.position.x = -scale * 4;
        propulsion.rotation.z = Math.PI / 2;
        cassini.add(propulsion);
        
        return cassini;
    }

    createHyperrealisticJuno(satData) {
        if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Juno spacecraft');
        const juno = new THREE.Group();
        // Scale based on the spacecraft's display size (for orbiters, size from data)
        const scale = satData.size || 0.04;
        
        // Materials
        const goldMat = MaterialFactory.createSpacecraftMaterial('gold');
        const panelMat = MaterialFactory.createSpacecraftMaterial('solarPanel');
        const darkMat = MaterialFactory.createSpacecraftMaterial('body');
        const whiteMat = MaterialFactory.createSpacecraftMaterial('white');
        
        // Hexagonal main body (3.5m diameter)
        const bus = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 1.75, scale * 1.75, scale * 1, 6, this.geometryCache),
            goldMat
        );
        bus.rotation.x = Math.PI / 2;
        juno.add(bus);
        
        // Three massive 9m x 2.7m solar panels (iconic!) - reuse geometries
        const panelGeom = GeometryFactory.createBox(scale * 9, scale * 0.05, scale * 2.7, this.geometryCache);
        const frame1Geom = GeometryFactory.createBox(scale * 9, scale * 0.1, scale * 0.05, this.geometryCache);
        const frame2Geom = frame1Geom; // Same geometry
        const gridLineGeom = GeometryFactory.createBox(scale * 0.02, scale * 0.08, scale * 2.7, this.geometryCache);
        
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const panelGroup = new THREE.Group();
            
            // Solar panel - reuse geometry
            const panel = new THREE.Mesh(panelGeom, panelMat);
            panel.position.x = scale * 4.5;
            panelGroup.add(panel);
            
            // Panel frames - reuse geometry
            const frame1 = new THREE.Mesh(frame1Geom, goldMat);
            frame1.position.set(scale * 4.5, 0, scale * 1.35);
            panelGroup.add(frame1);
            
            const frame2 = new THREE.Mesh(frame2Geom, goldMat);
            frame2.position.set(scale * 4.5, 0, -scale * 1.35);
            panelGroup.add(frame2);
            
            // Grid lines on panels - reuse geometry
            for (let j = 0; j <= 8; j++) {
                const line = new THREE.Mesh(gridLineGeom, goldMat);
                line.position.set(scale * j, 0, 0);
                panelGroup.add(line);
            }
            
            panelGroup.position.set(
                Math.cos(angle) * scale * 1.75,
                Math.sin(angle) * scale * 1.75,
                0
            );
            panelGroup.rotation.z = angle;
            juno.add(panelGroup);
        }
        
        // High-gain antenna (2.5m diameter)
        const antenna = new THREE.Mesh(
            GeometryFactory.createCone(scale * 1.25, scale * 0.4, 32, this.geometryCache),
            whiteMat
        );
        antenna.position.z = scale * 0.8;
        juno.add(antenna);
        
        // JunoCam (visible on side)
        const camera = new THREE.Mesh(
            GeometryFactory.createBox(scale * 0.2, scale * 0.2, scale * 0.15, this.geometryCache),
            darkMat
        );
        camera.position.set(scale * 1.5, 0, scale * 0.3);
        juno.add(camera);
        
        // Magnetometer boom (extends from one panel)
        const magBoom = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.03, scale * 0.03, scale * 3, 8, this.geometryCache),
            goldMat
        );
        magBoom.position.set(scale * 8, scale * 1.75, 0);
        magBoom.rotation.z = Math.PI / 2;
        juno.add(magBoom);
        
        // Magnetometer sensor
        const magSensor = new THREE.Mesh(
            GeometryFactory.createBox(scale * 0.15, scale * 0.15, scale * 0.15, this.geometryCache),
            darkMat
        );
        magSensor.position.set(scale * 9.5, scale * 1.75, 0);
        juno.add(magSensor);
        
        // Microwave radiometer antennas (6 visible) - reuse geometry
        const mwrGeom = GeometryFactory.createBox(scale * 0.15, scale * 0.15, scale * 0.2, this.geometryCache);
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const mwr = new THREE.Mesh(mwrGeom, darkMat);
            mwr.position.set(
                Math.cos(angle) * scale * 1.6,
                Math.sin(angle) * scale * 1.6,
                -scale * 0.3
            );
            juno.add(mwr);
        }
        
        return juno;
    }

    createHyperrealisticNewHorizons(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic New Horizons probe');
        const newHorizons = new THREE.Group();
        // Scale based on the spacecraft's display size
        const scale = satData.size || 0.06;
        
        // Materials
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.9 });
        
        // Triangular main body (compact design)
        const bodyGeom = new THREE.CylinderGeometry(scale * 1.1, scale * 1.1, scale * 0.7, 3);
        const body = new THREE.Mesh(bodyGeom, goldMat);
        body.rotation.x = Math.PI / 2;
        newHorizons.add(body);
        
        // 2.1m high-gain antenna (white dish)
        const dish = new THREE.Mesh(new THREE.ConeGeometry(scale * 1.05, scale * 0.35, 32), whiteMat);
        dish.position.z = scale * 0.6;
        newHorizons.add(dish);
        
        // Feed assembly
        const feed = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.08, scale * 0.08, scale * 0.25, 16), darkMat);
        feed.position.z = scale * 0.8;
        newHorizons.add(feed);
        
        // RTG (single plutonium power source on side)
        const rtg = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.25, scale * 0.25, scale * 1.2, 16), darkMat);
        rtg.position.set(-scale * 1.2, 0, -scale * 0.2);
        rtg.rotation.z = Math.PI / 2;
        newHorizons.add(rtg);
        
        // Science instruments (LORRI telescope - long narrow cone)
        const lorri = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.1, scale * 0.15, scale * 0.8, 16), darkMat);
        lorri.position.set(scale * 0.5, 0, scale * 0.2);
        lorri.rotation.z = Math.PI / 2;
        newHorizons.add(lorri);
        
        // Ralph instrument (visible color camera)
        const ralph = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.25, scale * 0.25, scale * 0.2), darkMat);
        ralph.position.set(scale * 0.6, scale * 0.3, scale * 0.1);
        newHorizons.add(ralph);
        
        // Alice UV spectrometer
        const alice = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.05, scale * 0.05, scale * 0.4, 12), silverMat);
        alice.position.set(scale * 0.6, -scale * 0.3, scale * 0.1);
        alice.rotation.z = Math.PI / 2;
        newHorizons.add(alice);
        
        // Medium-gain antenna (on back)
        const medAntenna = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.15, scale * 0.15, 16), silverMat);
        medAntenna.position.set(-scale * 0.8, scale * 0.5, 0);
        newHorizons.add(medAntenna);
        
        // Low-gain antennas (2 small)
        for (let i = 0; i < 2; i++) {
            const lowAntenna = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.03, scale * 0.03, scale * 0.2, 8), silverMat);
            lowAntenna.position.set(-scale * 0.5, i === 0 ? scale * 0.7 : -scale * 0.7, -scale * 0.2);
            newHorizons.add(lowAntenna);
        }
        
        // Hydrazine fuel tank (visible sphere)
        const fuelTank = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.3, 16, 16), silverMat);
        fuelTank.position.set(-scale * 0.6, 0, -scale * 0.4);
        newHorizons.add(fuelTank);
        
        // Thrusters (small cones at various angles)
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const thruster = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.04, scale * 0.08, 8), darkMat);
            thruster.position.set(
                Math.cos(angle) * scale * 0.9,
                Math.sin(angle) * scale * 0.9,
                -scale * 0.5
            );
            newHorizons.add(thruster);
        }
        
        return newHorizons;
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
 color: 0xFFD700
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
 
 if (DEBUG.enabled) {
 console.log(` ISS created with ${moduleCount} mesh components (scale: ${scale})`);
 console.log(' - 17 pressurized modules, 8 solar arrays, 6 radiators, 3 robotic arms');
 }
 
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
 description: t('descISS'),
 funFact: t('funFactISS'),
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
 description: t('descHubble'),
 funFact: t('funFactHubble'),
 realSize: '13.2m long 4.2m diameter, 11,110 kg',
 orbitTime: '96 minutes'
 },
 {
 name: 'GPS Satellite (NAVSTAR)',
 distance: 4.17, // 20,180 km altitude; orbit radius from Earth center = (20,180 + 6,371) / 6,371 ≈ 4.17
 speed: 2.0,
 size: 0.015,
 color: 0x00FF00,
 description: t('descGPS'),
 funFact: t('funFactGPS'),
 realSize: 'GPS III: 2,161 kg, 7.8m solar span',
 orbitTime: '11h 58min'
 },
 {
 name: 'Sputnik 1',
 distance: 1.09, // Average orbit ~577 km altitude (215–939 km); distance 1.09 = safely above Earth surface (radius 1.0)
 speed: 14.9, // Orbital period 96.2 minutes, ~15 orbits/day
 size: 0.008, // Educationally scaled: visible when focused, proportional relative to Earth
 color: 0xC0C0C0,
 description: t('descSputnik1'),
 funFact: t('funFactSputnik1'),
 realSize: '58 cm diameter sphere, 83.6 kg',
 orbitTime: '96.2 minutes'
 }
 ];

 if (!this.planets.earth) {
 if (DEBUG.enabled) console.warn('Earth not found, cannot create satellites');
 return;
 }

 satellitesData.forEach((satData, index) => {
 let satellite;
 
 // Create hyperrealistic models for ISS, Hubble, JWST, and space probes
 if (satData.name.includes('ISS')) {
 satellite = this.createHyperrealisticISS(satData);
 } else if (satData.name.includes('Hubble')) {
 satellite = this.createHyperrealisticHubble(satData);
 } else if (satData.name.includes('James Webb')) {
 satellite = this.createHyperrealisticJWST(satData);
 } else if (satData.name.includes('Pioneer')) {
 satellite = this.createHyperrealisticPioneer(satData);
 } else if (satData.name.includes('Voyager')) {
 satellite = this.createHyperrealisticVoyager(satData);
 } else if (satData.name.includes('Cassini')) {
 satellite = this.createHyperrealisticCassini(satData);
 } else if (satData.name.includes('Juno')) {
 satellite = this.createHyperrealisticJuno(satData);
 } else if (satData.name.includes('New Horizons')) {
 satellite = this.createHyperrealisticNewHorizons(satData);
 } else if (satData.name.includes('Sputnik')) {
 satellite = this.createHyperrealisticSputnik(satData);
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
 if (satData.name.includes('GPS')) {
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
                type: 'satellite',
                radius: satData.size,
                actualSize: satData.size, // Use actual size for camera distance calculations
                distance: satData.distance,
                angle: (Math.PI * 2 / satellitesData.length) * index, // Spread them out
                speed: satData.speed,
                description: satData.description,
                funFact: satData.funFact,
                realSize: satData.realSize,
                orbitTime: satData.orbitTime,
                orbitPlanet: 'earth', // Consistent with spacecraft naming
                planet: this.planets.earth,
                isSpacecraft: true, // Mark as spacecraft for camera logic
                inclination: (index * 30) * Math.PI / 180 // Different orbital inclinations
            }; scene.add(satellite);
 this.objects.push(satellite);
 this.satellites.push(satellite);
 this.pickableObjects.push(satellite);
 });
 }

 createSpacecraft(scene) {
 // Deep space probes and interplanetary missions
 this.spacecraft = [];

 // ── Trajectory data for straight-line deep-space probes ──────────────────
 // Each probe travels in a fixed direction (ecliptic longitude + latitude) at
 // an approximately constant heliocentric speed. Positions are computed from a
 // published JPL/NASA reference epoch so they update correctly with the time machine.
 //
 // Coordinate convention (matches Three.js scene):
 //   X = ecliptic lon 0°  (vernal equinox)
 //   Z = ecliptic lon 90°
 //   Y = ecliptic north pole
 //
 // Formula:
 //   distAU = refDistAU + speedKmps * (jd - refJD) * 86400 / 149597870.7
 //   x = distSceneUnits * cos(lat) * cos(lon)
 //   z = distSceneUnits * cos(lat) * sin(lon)
 //   y = distSceneUnits * sin(lat)
 //
 // Reference epochs and heliocentric scale:
 //   Voyager 1/2, New Horizons: Jan 1 2025 (JD 2460676.5) from NASA JPL Horizons.
 //   Pioneer 10: ~Jan 2003 (JD 2452641.5) — last-contact date, not Jan 2025.
 //   Pioneer 11: ~Nov 1995 (JD 2450084.5) — last-contact date, not Jan 2025.
 //   Positions for all probes are linearly extrapolated from these reference epochs.
 //
 // Scale: _probePositionAtJD() converts distAU → scene units using:
 //   educational: 22.5 scene-units/AU  (heliopause 2,700 / 120 AU)
 //   realistic:  150   scene-units/AU  (heliopause 18,000 / 120 AU)
 // NOTE: Inner planet visual distances are NOT derived from AU — they use separate
 //   display units (e.g. Mercury at 20 units/0.39 AU ≈ 51.3 units/AU). Only the
 //   heliospheric probe model uses the 22.5/150 AU conversion above.
 const PROBE_TRAJECTORIES = {
 'Voyager 1':   { refJD: 2460676.5, refDistAU: 163.7,  speedKmps: 16.99, eclLon: 255.8, eclLat: 35.7  },
 'Voyager 2':   { refJD: 2460676.5, refDistAU: 136.6,  speedKmps: 15.35, eclLon: 208.0, eclLat: -31.9 },
 'New Horizons':{ refJD: 2460676.5, refDistAU:  58.3,  speedKmps: 13.85, eclLon: 305.7, eclLat: -7.3  },
 'Pioneer 10':  { refJD: 2452641.5, refDistAU:  80.0,  speedKmps: 12.04, eclLon:  79.5, eclLat:  3.0  },
 'Pioneer 11':  { refJD: 2450084.5, refDistAU:  42.7,  speedKmps: 11.38, eclLon: 311.5, eclLat: -17.0 }
 };

 const spacecraftData = [
 {
 name: 'Voyager 1',
 distance: 8307, // placeholder; overwritten by trajectory at init
 angle: Math.PI * 0.7,
 speed: 0, // not used — trajectory-based movement
 size: 0.08,
 color: 0xC0C0C0,
 type: 'probe',
 description: t('descVoyager1'),
 funFact: t('funFactVoyager1'),
 realSize: '825.5 kg, 3.7m antenna dish',
 launched: 'September 5, 1977',
 status: 'Active in Interstellar Space (since Aug 2012)'
 },
 {
 name: 'Voyager 2',
 distance: 6923, // placeholder; overwritten by trajectory at init
 angle: Math.PI * 1.2,
 speed: 0,
 size: 0.08,
 color: 0xB0B0B0,
 type: 'probe',
 description: t('descVoyager2'),
 funFact: t('funFactVoyager2'),
 realSize: '825.5 kg, 3.7m antenna dish',
 launched: 'August 20, 1977',
 status: 'Active in Interstellar Space (since Nov 2018)'
 },
 {
 name: 'New Horizons',
 distance: 3025, // placeholder; overwritten by trajectory at init
 angle: Math.PI * 0.3,
 speed: 0,
 size: 0.06,
 color: 0x4169E1,
 type: 'probe',
 description: t('descNewHorizons'),
 funFact: t('funFactNewHorizons'),
 realSize: '478 kg, 0.7 × 2.1 × 2.7m (piano-sized)',
 launched: 'January 19, 2006',
 status: 'Active in Kuiper Belt'
 },
 {
 name: 'James Webb Space Telescope',
 distance: 55, // At Sun-Earth L2 Lagrange point, ~1.01 AU from Sun (1.5 million km beyond Earth at 51 units)
 angle: Math.PI * 0.15, // Positioned near Earth's L2 point
 speed: 0.0003, // Halo orbit around L2, period synced with Earth (1 year)
 size: 0.03,
 color: 0xFFD700,
 type: 'observatory',
 description: t('descJWST'),
 funFact: t('funFactJWST'),
 realSize: '6.5m mirror, 21.2m × 14.2m sunshield, 6,161 kg',
 launched: 'December 25, 2021',
 status: 'Active at L2 Point'
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
 description: t('descJuno'),
 funFact: t('funFactJuno'),
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
 type: 'probe',
 description: t('descCassini'),
 funFact: t('funFactCassini'),
 realSize: '5,600 kg, 6.8m tall, 4m wide',
 launched: 'October 15, 1997',
 status: 'Mission Ended Sept 15, 2017 (Memorial)'
 },
 {
 name: 'Pioneer 10',
 distance: 7127, // placeholder; overwritten by trajectory at init
 angle: Math.PI * 0.5,
 speed: 0,
 size: 0.07,
 color: 0xA0A0A0,
 type: 'probe',
 description: t('descPioneer10'),
 funFact: t('funFactPioneer10'),
 realSize: '258 kg, 2.74m antenna dish',
 launched: 'March 2, 1972',
 status: 'Silent since Jan 2003 (Memorial)'
 },
 {
 name: 'Pioneer 11',
 distance: 5436, // placeholder; overwritten by trajectory at init
 angle: Math.PI * 1.4,
 speed: 0,
 size: 0.07,
 color: 0x909090,
 type: 'probe',
 description: t('descPioneer11'),
 funFact: t('funFactPioneer11'),
 realSize: '259 kg, 2.74m antenna dish',
 launched: 'April 5, 1973',
 status: 'Silent since Nov 1995 (Memorial)'
 }
 ];

 spacecraftData.forEach(craft => {
 let spacecraftGroup;
 
 // Check if this spacecraft has a hyperrealistic model
 if (craft.name.includes('Voyager')) {
 spacecraftGroup = this.createHyperrealisticVoyager(craft);
 } else if (craft.name.includes('Pioneer')) {
 spacecraftGroup = this.createHyperrealisticPioneer(craft);
 } else if (craft.name.includes('Juno')) {
 spacecraftGroup = this.createHyperrealisticJuno(craft);
 } else if (craft.name.includes('Cassini')) {
 spacecraftGroup = this.createHyperrealisticCassini(craft);
 } else if (craft.name.includes('James Webb')) {
 spacecraftGroup = this.createHyperrealisticJWST(craft);
 } else if (craft.name.includes('New Horizons')) {
 spacecraftGroup = this.createHyperrealisticNewHorizons(craft);
 } else {
 // Create GENERIC spacecraft with detailed geometry for others
 spacecraftGroup = new THREE.Group();
 
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
 } // End of generic spacecraft creation else block
 
 // Add subtle visibility glow - but NOT for hyperrealistic models (they have enough detail)
 const isHyperrealistic = craft.name.includes('Voyager') || craft.name.includes('Pioneer') || 
                          craft.name.includes('Juno') || craft.name.includes('Cassini') || 
                          craft.name.includes('James Webb') || craft.name.includes('New Horizons');
 
 if (!isHyperrealistic) {
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
 }
 
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
 radius: craft.size,
 // Trajectory data for date-accurate straight-line probes (null for orbiters)
 trajectory: PROBE_TRAJECTORIES[craft.name] || null
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
 this.pickableObjects.push(spacecraftGroup);
 });

 if (DEBUG.enabled) console.log(` Created ${this.spacecraft.length} spacecraft and probes!`);
 }

 update(deltaTime, timeSpeed, camera, controls) {
 // Safety check for deltaTime
 if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
 if (DEBUG.enabled) console.warn(' Invalid deltaTime:', deltaTime, '- skipping frame');
 return;
 }
 
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
 
 // Advance simulated time. Allow negative speeds so rewinding works correctly.
 this.simulatedHours += (deltaTime / 3600) * this.timeAcceleration * rotationSpeed;

 // Advance Julian Date for date display and seekToDate()
 this.simulatedJD += (deltaTime * this.timeAcceleration * orbitalSpeed) / 86400;
 // Throttled date-changed event (max once per 200 ms wall-clock)
 const _wallNow = Date.now();
 if (_wallNow - this._lastDateEventWall >= 200) {
 this._lastDateEventWall = _wallNow;
 this._dateEventDetail.jd = this.simulatedJD;
 window.dispatchEvent(this._dateEvent);
 }
 const now = performance.now();
 const elapsedHours = this.simulatedHours;
 
 // Update all planets (use cached array to avoid Object.values() allocation each frame)
 if (!this._planetArray || this._planetArrayDirty) {
 this._planetArray = Object.values(this.planets);
 this._planetArrayDirty = false;
 }
 this._planetArray.forEach(planet => {
 if (planet && planet.userData) {
 // Calculate angle increment based on speed
 const angleIncrement = planet.userData.speed * orbitalSpeed * deltaTime;
 
 // Safety check for angle increment
 if (isNaN(angleIncrement) || !isFinite(angleIncrement)) {
 if (DEBUG && DEBUG.enabled) console.error(' Invalid angleIncrement for', planet.userData.name, ':', angleIncrement);
 return;
 }
 
 // Solar orbit (affected by orbital pause)
 if (this.scientificMode) {
 // Kepler’s 2nd law: mean anomaly advances linearly, true anomaly derived via solver
 const e = planet.userData.orbitalEccentricity || 0;
 planet.userData.meanAnomaly = (planet.userData.meanAnomaly || 0) + angleIncrement;
 planet.userData.angle = (e > 1e-6) ? this._meanToTrueAnomaly(planet.userData.meanAnomaly, e, planet.userData._keplerSqrtPlus, planet.userData._keplerSqrtMinus) : planet.userData.meanAnomaly;
 } else {
 planet.userData.angle += angleIncrement;
 }
 
 // Safety check for angle
 if (isNaN(planet.userData.angle) || !isFinite(planet.userData.angle)) {
 if (DEBUG && DEBUG.enabled) console.error(' Invalid angle for', planet.userData.name, '- resetting to 0');
 planet.userData.angle = 0;
 }
 
 if (this.scientificMode) {
 const e = planet.userData.orbitalEccentricity || 0;
 const i = planet.userData.orbitalInclination || 0;
 const w = planet.userData.orbitalPeriapsis || 0;
 const a = planet.userData.distance;
 // angle = true anomaly ν; use ν for correct Keplerian r, then rotate by periapsis ω
 const nu = planet.userData.angle;
 const r = (e > 0) ? (a * (1 - e * e) / (1 + e * Math.cos(nu))) : a;
 const theta = nu + w;
 const cosTheta = Math.cos(theta);
 const sinTheta = Math.sin(theta);
 const xOrb = r * cosTheta;
 const zOrb = r * sinTheta;
 planet.position.x = xOrb;
 planet.position.y = zOrb * planet.userData._sinOrbInc;
 planet.position.z = zOrb * planet.userData._cosOrbInc;
 } else {
 planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
 planet.position.y = 0;
 planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
 }
 
 // REALISTIC PLANET ROTATION based on real astronomical data
 if (planet.userData.realRotationPeriod && rotationSpeed !== 0) {
 let rotationAngle;
 if (planet.userData.name === 'Earth') {
 // Compute Earth's rotation so the correct subsolar longitude faces the Sun.
 // Formula: rotation.y = orbital_angle + PI + SunRA - GMST
 // where orbital_angle = atan2(earth.z, earth.x) in the scene.
 const d = this.simulatedJD - 2451545.0;
 const gmst = ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360 * Math.PI / 180;
 const sunRA = this._sunRA(d);
 const orbAngle = Math.atan2(planet.position.z, planet.position.x);
 rotationAngle = orbAngle + Math.PI + sunRA - gmst;
 } else {
 const rotationsComplete = elapsedHours / planet.userData.realRotationPeriod;
 rotationAngle = (rotationsComplete * Math.PI * 2) + planet.userData.rotationPhase;
 }

 // Apply rotation — explicit retrograde handling for planets with tilt > 90°
 if (planet.userData.retrograde) {
 rotationAngle = -rotationAngle;
 }
 planet.rotation.y = rotationAngle;
 planet.rotation.z = (planet.userData.axialTilt || 0) * Math.PI / 180;
 }

 // Update atmosphere sun-direction uniform so glow only appears on the lit limb.
 // Sun is at world origin; planet.position points away from the sun.
 if (planet.userData.atmosphereMesh) {
 const atmosMat = planet.userData.atmosphereMesh.material;
 if (atmosMat?.uniforms?.sunDir) {
 atmosMat.uniforms.sunDir.value.copy(planet.position).negate().normalize();
 }
 }

 // Rotate clouds slightly faster than planet for Earth
 if (planet.userData.clouds && rotationSpeed !== 0) {
 planet.userData.clouds.rotation.y = planet.rotation.y * 1.05; // 5% faster
 }

 // Update moons - orbit around their parent planet
 if (planet.userData.moons && planet.userData.moons.length > 0) {
 planet.userData.moons.forEach(moon => {
 if (moon.userData) {
 // Calculate moon angle increment
 const moonAngleIncrement = moon.userData.speed * moonSpeed * deltaTime;
 
 // Moons orbit their planet
 if (this.scientificMode) {
 const e = moon.userData.orbitalEccentricity || 0;
 moon.userData.meanAnomaly = (moon.userData.meanAnomaly || 0) + moonAngleIncrement;
 moon.userData.angle = (e > 1e-6) ? this._meanToTrueAnomaly(moon.userData.meanAnomaly, e, moon.userData._keplerSqrtPlus, moon.userData._keplerSqrtMinus) : moon.userData.meanAnomaly;
 } else {
 moon.userData.angle += moonAngleIncrement;
 }
 
 // IMPORTANT: Since moon is a child of planet (planet.add(moon)),
 // these positions are RELATIVE to the planet's position, not world coordinates!
 // Counter-rotate by parent's rotation.y so the moon's world-space
 // orbit is not dragged by the planet's self-rotation.
 const parentRotY = planet.rotation.y || 0;
 let moonOrbitalAngle = 0; // used for tidal-lock rotation
 if (this.scientificMode) {
 const e = moon.userData.orbitalEccentricity || 0;
 const i = moon.userData.orbitalInclination || 0;
 const w = moon.userData.orbitalPeriapsis || 0;
 const a = moon.userData.distance;
 const nu = moon.userData.angle;
 const r = (e > 0) ? (a * (1 - e * e) / (1 + e * Math.cos(nu))) : a;
 const theta = nu + w + parentRotY;
 const cosTheta = Math.cos(theta);
 const sinTheta = Math.sin(theta);
 const xOrb = r * cosTheta;
 const zOrb = r * sinTheta;
 moon.position.x = xOrb;
 moon.position.y = zOrb * moon.userData._sinOrbInc;
 moon.position.z = zOrb * moon.userData._cosOrbInc;
 moonOrbitalAngle = theta;
 } else {
 const adj = moon.userData.angle + parentRotY;
 moon.position.x = moon.userData.distance * Math.cos(adj);
 moon.position.z = moon.userData.distance * Math.sin(adj);
 moon.position.y = 0;
 moonOrbitalAngle = adj;
 }
 
 // REALISTIC MOON ROTATION based on real astronomical data
 if (moon.userData.realRotationPeriod && rotationSpeed !== 0) {
 let rotationAngle;
 if (moon.userData.tidallyLocked) {
 // True tidal locking: enforce same face always toward parent planet.
 // With moon at position (dist*cos(α), 0, dist*sin(α)) in parent space,
 // rotation.y = π/2 - α makes the local -Z axis point at the planet origin.
 rotationAngle = Math.PI / 2 - moonOrbitalAngle;
 } else {
 // Non-tidally-locked: use real rotation period from astronomical data
 const rotationsComplete = elapsedHours / moon.userData.realRotationPeriod;
 rotationAngle = (rotationsComplete * Math.PI * 2) + moon.userData.rotationPhase;
 }

 // Apply rotation (retrograde is naturally handled by axial tilts > 90)
 moon.rotation.y = rotationAngle;
 moon.rotation.z = (moon.userData.axialTilt || 0) * Math.PI / 180;
 }
 
 // Debug: Log moon position occasionally (Moon and Io)
 if (DEBUG.enabled && Math.random() < 0.001) {
 if (moon.userData.name.includes('Moon') || moon.userData.name.includes('Io')) {
 moon.getWorldPosition(this._trackTargetPos);
 console.log(` ${moon.userData.name} orbiting ${planet.userData.name}: angle=${moon.userData.angle.toFixed(2)}, local=(${moon.position.x.toFixed(1)}, ${moon.position.y.toFixed(1)}, ${moon.position.z.toFixed(1)}), world=(${this._trackTargetPos.x.toFixed(1)}, ${this._trackTargetPos.y.toFixed(1)}, ${this._trackTargetPos.z.toFixed(1)}), planet at=(${planet.position.x.toFixed(1)}, ${planet.position.y.toFixed(1)}, ${planet.position.z.toFixed(1)})`);
 }
 }
 }
 });
 }
 }
 });
 
 // Camera tracking is handled by updateCameraTracking() called after all position updates.
 // Do NOT duplicate tracking logic here — it would overwrite the co-rotation chase-cam
 // and smooth tracking modes configured in focusOnObject().

 // Update camera tracking AFTER all object positions have been updated this frame
 this.updateCameraTracking(camera, controls);

 // Rotate asteroid and Kuiper belts slowly
 if (this.asteroidBelt) {
 const rotationIncrement = 0.0001 * rotationSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.asteroidBelt.rotation.y += rotationIncrement;
 }
 }
 if (this.kuiperBelt) {
 const rotationIncrement = 0.00005 * rotationSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.kuiperBelt.rotation.y += rotationIncrement;
 }
 }

 // Rotate sun and animate surface activity
 if (this.sun) {
 const rotationIncrement = 0.001 * rotationSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.sun.rotation.y += rotationIncrement;
 }
 
 // Animate solar flares (optimized - update every 2 frames)
 if (this.sun.userData.flares && (this._sunFlareFrame || 0) % 2 === 0) {
 const time = now * 0.001;
 const sizes = this.sun.userData.flares.geometry.attributes.size.array;
 const len = sizes.length;
 
 // Pre-calculate random values (less Math.random() calls)
 for (let i = 0; i < len; i++) {
 sizes[i] = 1 + Math.sin(time + i * 0.5) * 1.5 + (i % 3) * 0.2;
 }
 this.sun.userData.flares.geometry.attributes.size.needsUpdate = true;
 }
 this._sunFlareFrame += 1;
 }

 // Keep starfield and Milky Way band centred on the camera so their sphere
 // boundaries are never visible and they always appear around the observer.
 if (this.starfield && camera) {
 this.starfield.position.copy(camera.position);
 }
 if (this.milkyWay && camera) {
 this.milkyWay.position.copy(camera.position);
 }

 // Twinkle stars slightly (optimized - only every 5 frames)
 if (this.starfield && this._starTwinkleFrame % 5 === 0 && Math.random() < 0.3) {
 const sizes = this.starfield.geometry.attributes.size.array;
 const tbl = this._starTwinkleRatios;
 const szTbl = this._starTwinkleSizes;
 const tblLen = tbl ? tbl.length : 0;
 for (let i = 0; i < 30 && tblLen > 0; i++) {
 const ptr = (this._starTwinklePtr + i) % tblLen;
 const idx = Math.floor(tbl[ptr] * sizes.length);
 sizes[idx] = szTbl[ptr];
 }
 if (tblLen > 0) this._starTwinklePtr = (this._starTwinklePtr + 30) % tblLen;
 this.starfield.geometry.attributes.size.needsUpdate = true;
 }

 // Cull label sprites by distance to camera — run every 3 frames to avoid per-frame overhead.
 // Planets visible up to 5000 units; moons/craft up to 600; everything else up to 1200.
 if (this.labelsVisible && this.labels && camera && this._starTwinkleFrame % 3 === 0) {
 const camX = camera.position.x, camY = camera.position.y, camZ = camera.position.z;
 for (let _li = 0; _li < this.labels.length; _li++) {
 const lbl = this.labels[_li];
 if (!lbl || !lbl.parent) continue;
 const p = lbl.parent;
 // Use world position via parent's matrixWorld translation column
 const wx = p.matrixWorld.elements[12];
 const wy = p.matrixWorld.elements[13];
 const wz = p.matrixWorld.elements[14];
 const dSq = (wx - camX) ** 2 + (wy - camY) ** 2 + (wz - camZ) ** 2;
 const type = p.userData?.type;
 const maxDSq = (type === 'planet' || type === 'dwarf-planet') ? 5000 * 5000
 : (type === 'moon' || type === 'satellite' || type === 'spacecraft') ? 600 * 600
 : 1200 * 1200;
 lbl.visible = dSq < maxDSq;
 }
 }

 // Update comets with elliptical orbits — Kepler's 2nd law
 if (this.comets) {
 this.comets.forEach(comet => {
 const userData = comet.userData;
 // In scientific mode, comet speeds are derived from real orbital periods
 // (up to 70,000 years for Hyakutake), resulting in near-zero speeds.
 // Apply a large boost so they remain visible; scale with period length.
 let cometMotionMultiplier;
 if (this.scientificMode) {
 // Comets with longer periods need bigger boosts to remain visible
 const periodYears = (userData.orbitalPeriod || 365.25) / 365.25;
 cometMotionMultiplier = Math.max(5, Math.sqrt(periodYears) * 2);
 } else {
 cometMotionMultiplier = 1; // Educational mode uses visual base speeds
 }
 const meanAnomalyIncrement = userData.speed * orbitalSpeed * deltaTime * cometMotionMultiplier;
 if (!isNaN(meanAnomalyIncrement) && isFinite(meanAnomalyIncrement)) {
 userData.meanAnomaly = (userData.meanAnomaly || 0) + meanAnomalyIncrement;
 }
 
 // Convert mean anomaly → true anomaly via Kepler solver
 // This ensures comets spend more time near aphelion and whip through perihelion (Kepler's 2nd law)
 const e = userData.eccentricity;
 const M = userData.meanAnomaly || 0;
 userData.angle = (e > 1e-6) ? this._meanToTrueAnomaly(M, e, userData._keplerSqrtPlus, userData._keplerSqrtMinus) : M;
 
 const a = userData.distance;
 const angle = userData.angle;
 
 // Pre-calculate trig values (avoid redundant calculations)
 const cosAngle = Math.cos(angle);
 const sinAngle = Math.sin(angle);
 
 // Simplified elliptical orbit
 const r = a * (1 - e * e) / (1 + e * cosAngle);
 
 // Use cached inclination trig (computed once at comet creation)
 comet.position.x = r * cosAngle;
 comet.position.z = r * sinAngle * userData._cosIncl;
 comet.position.y = r * sinAngle * userData._sinIncl;

 if (userData.orbitLine) {
 userData.orbitLine.visible = this.cometOrbitsVisible;
 }
 
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
 
 // Cache direction vectors (reuse pre-allocated objects to avoid GC)
 userData._sunDir.set(comet.position.x, comet.position.y, comet.position.z).normalize();
 // Velocity direction = tangent to the inclined ellipse at true anomaly `angle`.
 // d/df [r·cos f, r·sin f·sin i, r·sin f·cos i] ≈ [-sin f, cos f·sin i, cos f·cos i]
 // cos(i) is negative for retrograde orbits (i > 90°), which naturally reverses
 // the XZ component — no separate retrograde flag needed.
 userData._velDir.set(
 -sinAngle,
 cosAngle * userData._sinIncl,
 cosAngle * userData._cosIncl
 ).normalize();
 
 // Dynamic tail transparency scaling: tails get invisible far from the sun but very bright close to perihelion
 const distanceToSun = Math.sqrt(comet.position.x ** 2 + comet.position.y ** 2 + comet.position.z ** 2);
 const sunProximityScale = Math.max(0.12, Math.min(1.0, 500 / distanceToSun)); // Keep tails dim when far from the sun

 // Update dust tail (only every 3 frames for performance)
 // Skip GPU buffer upload when comet is deep in aphelion (nearly invisible anyway)
 const tailsDim = sunProximityScale <= 0.14; // matches the Math.max(0.12,...) floor
 if (userData.dustTail && userData.frameCount % 3 === 0) {
 // Dynamically set material opacity based on sun distance
 if (userData.dustTail.material) {
 userData.dustTail.material.opacity = 0.14 * sunProximityScale;
 }
 
 if (!tailsDim) {
 const dustPositions = userData.dustTail.geometry.attributes.position.array;
 const dustSizes = userData.dustTail.geometry.attributes.size.array;
 
 const curveFactor = 0.3;
 const vr = userData.visualRadius || 2.0; // Scale tail proportional to visible coma size
 const dustTailLen = vr * 8; // Dust tail: 8× coma radius
 const dustParticleCount = userData.dustParticles || dustSizes.length;
 // Flowing animation: offset parametric position so particles appear to stream outward
 const dustFlow = (now * 0.00025) % 1.0;
 for (let i = 0; i < dustParticleCount; i++) {
 const tBase = i / dustParticleCount;
 const t = (tBase + dustFlow) % 1.0; // flowing position along tail
 const length = dustTailLen * t;
 
 // Dust tail curves BACKWARD (retrograde): dust shed at earlier positions
 // has different orbital velocity and lags behind the comet. Subtracting
 // _velDir (prograde direction) gives the correct rearward sweep.
 const dirX = userData._sunDir.x - userData._velDir.x * curveFactor * t;
 const dirY = userData._sunDir.y - userData._velDir.y * curveFactor * t;
 const dirZ = userData._sunDir.z - userData._velDir.z * curveFactor * t;
 const normFactor = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
 
 const jitterA = userData.dustJitterA ? userData.dustJitterA[i] : (Math.random() - 0.5);
 const jitterB = userData.dustJitterB ? userData.dustJitterB[i] : (Math.random() - 0.5);
 const spread = jitterA * vr * 1.0 * t;
 const spreadPerpendicular = jitterB * vr * 0.5 * t;
 
 dustPositions[i * 3] = dirX * normFactor * length + spread;
 dustPositions[i * 3 + 1] = dirY * normFactor * length + spreadPerpendicular;
 dustPositions[i * 3 + 2] = dirZ * normFactor * length + spread;
 
 // Vary size based on original index (not flowing t) so near particles stay large
 dustSizes[i] = vr * 0.10 * (1 - tBase * 0.7) * (0.9 + (i % 5) * 0.05);
 }
 userData.dustTail.geometry.attributes.position.needsUpdate = true;
 userData.dustTail.geometry.attributes.size.needsUpdate = true;
 }
 }
 
 // Update ion tail (only every 2 frames for performance)
 if (userData.ionTail && userData.frameCount % 2 === 0) {
 // Dynamically set material opacity based on sun distance
 if (userData.ionTail.material) {
 userData.ionTail.material.opacity = 0.18 * sunProximityScale;
 }

 if (!tailsDim) {
 const ionPositions = userData.ionTail.geometry.attributes.position.array;
 const sunDirX = userData._sunDir.x;
 const sunDirY = userData._sunDir.y;
 const sunDirZ = userData._sunDir.z;
 const vrIon = userData.visualRadius || 2.0;
 const ionTailLen = vrIon * 12; // Ion tail: 12× coma radius, longer than dust
 const ionParticleCount = userData.ionParticles || ionPositions.length / 3;
 // Faster flow for plasma stream effect
 const ionFlow = (now * 0.00075) % 1.0;
 
 for (let i = 0; i < ionParticleCount; i++) {
 const tBase = i / ionParticleCount;
 const t = (tBase + ionFlow) % 1.0;
 const length = ionTailLen * t;
 const ionJitterVal = userData.ionJitter ? userData.ionJitter[i] : (Math.random() - 0.5);
 const spreadIon = ionJitterVal * vrIon * 0.9 * t; // Wider fan so it looks like a stream, not a line
 const spreadIon2 = (userData.ionJitter ? userData.ionJitter[(i + 1) % ionParticleCount] : (Math.random() - 0.5)) * vrIon * 0.5 * t;
 
 ionPositions[i * 3] = sunDirX * length + spreadIon;
 ionPositions[i * 3 + 1] = sunDirY * length + spreadIon2;
 ionPositions[i * 3 + 2] = sunDirZ * length + spreadIon;
 }
 userData.ionTail.geometry.attributes.position.needsUpdate = true;
 }
 }
 
 userData.frameCount = (userData.frameCount || 0) + 1;
 });
 }
 
 // Update satellites orbiting Earth
 if (this.satellites) {
 this.satellites.forEach(satellite => {
 const userData = satellite.userData;
 if (userData.planet) {
 const angleIncrement = userData.speed * orbitalSpeed * deltaTime * 0.01; // Scale down for realistic orbit times
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 }
 
 // Get Earth's current world position (reuse pre-allocated scratch vector)
 userData.planet.getWorldPosition(this._satEarthPos);
 
 // Cache inclination trig once (inclination is static per satellite)
 if (userData._sinIncl === undefined || userData._cosIncl === undefined) {
 userData._cosIncl = Math.cos(userData.inclination);
 userData._sinIncl = Math.sin(userData.inclination);
 }

 // Calculate satellite position relative to Earth with inclination
 const cosAngle = Math.cos(userData.angle);
 const sinAngle = Math.sin(userData.angle);
 const cosIncl = userData._cosIncl;
 const sinIncl = userData._sinIncl;
 
 satellite.position.x = this._satEarthPos.x + userData.distance * cosAngle;
 satellite.position.y = this._satEarthPos.y + userData.distance * sinAngle * sinIncl;
 satellite.position.z = this._satEarthPos.z + userData.distance * sinAngle * cosIncl;
 
 // Calculate and store orbital velocity vector for camera co-rotation
 // Tangent to circular orbit (perpendicular to radial direction)
 const velocityX = -userData.distance * sinAngle;
 const velocityY = userData.distance * cosAngle * sinIncl;
 const velocityZ = userData.distance * cosAngle * cosIncl;
 
 if (!userData.orbitalVelocity) {
 userData.orbitalVelocity = new THREE.Vector3();
 }
 userData.orbitalVelocity.set(velocityX, velocityY, velocityZ).normalize();
 
 // Debug: Log satellite positions (especially ISS)
 if (DEBUG.enabled && Math.random() < 0.001) {
 if (userData.name.includes('ISS')) {
 console.log(` ISS: Earth at (${this._satEarthPos.x.toFixed(1)}, ${this._satEarthPos.y.toFixed(1)}, ${this._satEarthPos.z.toFixed(1)}), ISS at (${satellite.position.x.toFixed(1)}, ${satellite.position.y.toFixed(1)}, ${satellite.position.z.toFixed(1)}), distance=${userData.distance}, visible=${satellite.visible}, children=${satellite.children.length}`);
 }
 }
 
 // ISS: Maintain stable orientation (no rotation)
 // All satellites should be tidally locked to Earth (always facing Earth)
 // This is realistic - ISS maintains nadir-pointing orientation
 satellite.lookAt(this._satEarthPos);
 }
 });
 }
 
 // Update spacecraft (Voyagers, probes, orbiters)
 if (this.spacecraft) {
 this.spacecraft.forEach(craft => {
 const userData = craft.userData;

 // Trajectory-based probes: position derived from running simulatedJD
 if (!userData.orbitPlanet && userData.trajectory) {
 const pos = this._probePositionAtJD(userData.trajectory, this.simulatedJD);
 craft.position.set(pos.x, pos.y, pos.z);
 userData.distanceAU = pos.distAU;
 userData.distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
 }

 // Legacy angle-based probes (non-trajectory, e.g. JWST): keep simple orbit
 if (!userData.orbitPlanet && !userData.trajectory && userData.speed) {
 const angleIncrement = userData.speed * orbitalSpeed * deltaTime * 0.001;
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 craft.position.x = userData.distance * Math.cos(userData.angle);
 craft.position.z = userData.distance * Math.sin(userData.angle);
 }
 }

 // Orbiters around planets (Juno, Cassini legacy, etc)
 if (userData.orbitPlanet && userData.speed && userData.type === 'orbiter') {
 const angleIncrement = userData.speed * orbitalSpeed * deltaTime * 0.01;
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
 const rotationIncrement = 0.002 * rotationSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 craft.rotation.y += rotationIncrement;
 }
 }
 });
 }
 
 // Rotate nebulae slowly (optimized - pre-calculate time)
 if (this.nebulae) {
 const time = now * 0.0005;
 const scale = 1 + Math.sin(time) * 0.05;
 
 this.nebulae.forEach(nebula => {
 const rotationIncrement = 0.0001 * rotationSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 nebula.rotation.y += rotationIncrement;
 }
 // Pulsing effect (shared calculation)
 nebula.scale.setScalar(scale);
 });
 }
 
 // Rotate galaxies
 if (this.galaxies) {
 this.galaxies.forEach(galaxy => {
 const rotationIncrement = 0.0002 * rotationSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 galaxy.rotation.y += rotationIncrement;
 }
 });
 }

 // Orbit exoplanets around their host stars
 if (this.exoplanets) {
 this.exoplanets.forEach(planet => {
 const ud = planet.userData;
 if (!ud.orbitSpeed || !ud.hostStarPos) return;
 ud.angle += ud.orbitSpeed * orbitalSpeed * deltaTime;
 planet.position.x = ud.hostStarPos.x + ud.orbitRadius * Math.cos(ud.angle);
 planet.position.z = ud.hostStarPos.z + ud.orbitRadius * Math.sin(ud.angle);
 planet.rotation.y += 0.005 * rotationSpeed * deltaTime; // slow self-rotation
 });
 }
 
 // Milky Way galaxy disc fade: show when camera is far from origin
 // As we transition to intergalactic view, fade out everything that's
 // INSIDE the galaxy (stars, constellations, nebulae, starfield) and
 // fade in the galaxy disc. Only other galaxies remain visible.
 if (this.milkyWayDisc && camera) {
 const camDist = camera.position.length();
 // Phase 1: Fade out all solar system/galactic objects — thresholds scale with mode.
 // Educational: heliopause=2700, Oort outer=9000 → fade starts at 14k (1.56× Oort)
 // Realistic: heliopause=18000, Oort outer=60000 → fade starts at 70k (1.17× Oort)
 // The milkyWayDisc is scaled 6.667× in realistic mode, so it fills the same
 // apparent angular size at the new (proportionally shorter) transition distances.
 const realisticScale = this.realisticScale;
 const solarFadeStart = realisticScale ? 70000 : 14000;
 const solarFadeEnd = realisticScale ? 95000 : 22000;
 const galaxyFadeStart = realisticScale ? 95000 : 22000; // Disc appears only after everything is dark
 const galaxyFadeFull = realisticScale ? 140000 : 42000;

 // Calculate fade factors
 const solarFadeT = camDist < solarFadeStart ? 0 :
 Math.min((camDist - solarFadeStart) / (solarFadeEnd - solarFadeStart), 1);
 const solarFadeOut = 1 - solarFadeT;
 const galaxyT = camDist < galaxyFadeStart ? 0 :
 Math.min((camDist - galaxyFadeStart) / (galaxyFadeFull - galaxyFadeStart), 1);

 // Show/hide the galaxy disc
 if (galaxyT <= 0) {
 this.milkyWayDisc.material.opacity = 0;
 this.milkyWayDisc.visible = false;
 if (this.milkyWaySolarLocator) this.milkyWaySolarLocator.visible = false;
 } else {
 this.milkyWayDisc.visible = true;
 this.milkyWayDisc.material.opacity = galaxyT * 0.85;
 if (this.milkyWaySolarLocator) {
 this.milkyWaySolarLocator.visible = true;
 const pulse = 0.8 + Math.sin(now * 0.004) * 0.2;
 const locatorOpacity = galaxyT * pulse;
 const { ring, beaconLine, glowSprite, labelSprite } = this.milkyWaySolarLocator.userData;
 if (ring?.material) ring.material.opacity = 0.45 * locatorOpacity;
 if (beaconLine?.material) beaconLine.material.opacity = 0.55 * locatorOpacity;
 if (glowSprite?.material) glowSprite.material.opacity = 0.8 * locatorOpacity;
 if (labelSprite?.material) labelSprite.material.opacity = 0.9 * galaxyT;
 const ringScale = 1 + Math.sin(now * 0.0025) * 0.08;
 if (ring) ring.scale.set(ringScale, ringScale, 1);
 const glowScale = 1 + Math.sin(now * 0.0035) * 0.12;
 if (glowSprite) glowSprite.scale.set(1600 * glowScale, 1600 * glowScale, 1);
 }
 }

 if (camDist < solarFadeStart) {
 // Restore ALL solar system objects when inside the galaxy
 if (this.sun) this.sun.visible = true;
 this._planetArray.forEach(p => { if (p) p.visible = true; });
 if (this.comets) this.comets.forEach(c => { c.visible = true; });
 if (this.spacecraft) this.spacecraft.forEach(s => { s.visible = true; });
 if (this.satellites) this.satellites.forEach(s => { s.visible = true; });
 if (this.nearbyStars) this.nearbyStars.forEach(s => { s.visible = true; });
 if (this.exoplanets) this.exoplanets.forEach(p => { p.visible = true; });
 // Restore opacities that were faded to 0
 if (this.milkyWay) this.milkyWay.material.opacity = 0.65;
 if (this.starfield) this.starfield.material.uniforms.opacityFade.value = 1;
 if (this.constellations) this.constellations.forEach(c => {
 c.traverse(child => { if (child.material) child.material.opacity = 1; });
 });
 if (this.nebulae) this.nebulae.forEach(n => {
 n.traverse(child => { if (child.material) child.material.opacity = 0.95; });
 });
 if (this.oortCloud) this.oortCloud.traverse(child => {
 if (child.material) child.material.opacity = 0.7;
 });
 if (this.orbits) this.orbits.forEach(o => {
 if (o.material) o.material.opacity = 1;
 });
 if (this.cometOrbits) this.cometOrbits.forEach(o => {
 if (o.material) o.material.opacity = 1;
 });
 if (this.asteroidBelt) this.asteroidBelt.traverse(child => {
 if (child.material) child.material.opacity = 1;
 });
 if (this.kuiperBelt) this.kuiperBelt.traverse(child => {
 if (child.material) child.material.opacity = 1;
 });
 if (this.heliopause) this.heliopause.traverse(child => {
 if (child.material) child.material.opacity = 0.03;
 });
 } else {
 // Use solarFadeOut for all objects inside the galaxy (phase 1: 12k-20k)
 // The galaxy disc is handled separately above (phase 2: 20k-35k)

 // Milky Way particle band
 if (this.milkyWay) {
 this.milkyWay.material.opacity = 0.65 * solarFadeOut;
 }
 // Starfield (background stars)
 if (this.starfield) {
 this.starfield.material.uniforms.opacityFade.value = solarFadeOut;
 }
 // Constellation lines and stars
 if (this.constellations) {
 this.constellations.forEach(constellation => {
 constellation.traverse(child => {
 if (child.material) child.material.opacity = solarFadeOut;
 });
 });
 }
 // Nebulae: fade out as the galaxy fades in (opposite of galaxyT).
 // They are inside-our-galaxy objects and must disappear in intergalactic view.
 // Using (1 - galaxyT) means they're fully visible inside the solar system,
 // start fading when the galaxy disc starts appearing, and are gone by galaxyFadeFull.
 if (this.nebulae) {
 const nebulaAlpha = Math.max(0, 1 - galaxyT);
 this.nebulae.forEach(n => {
 n.traverse(child => { if (child.material) child.material.opacity = 0.95 * nebulaAlpha; });
 });
 }
 // Oort Cloud
 if (this.oortCloud) {
 this.oortCloud.traverse(child => {
 if (child.material) child.material.opacity = 0.7 * solarFadeOut;
 });
 }
 // Orbital paths (planet orbits, comet orbits)
 if (this.orbits) {
 this.orbits.forEach(orbit => {
 if (orbit.material) orbit.material.opacity = solarFadeOut;
 });
 }
 if (this.cometOrbits) {
 this.cometOrbits.forEach(orbit => {
 if (orbit.material) orbit.material.opacity = solarFadeOut;
 });
 }
 // Asteroid Belt
 if (this.asteroidBelt) {
 this.asteroidBelt.traverse(child => {
 if (child.material) child.material.opacity = solarFadeOut;
 });
 }
 // Kuiper Belt
 if (this.kuiperBelt) {
 this.kuiperBelt.traverse(child => {
 if (child.material) child.material.opacity = solarFadeOut;
 });
 }
 // Heliopause
 if (this.heliopause) {
 this.heliopause.traverse(child => {
 if (child.material) child.material.opacity = 0.03 * solarFadeOut;
 });
 }
 // Sun and planets (entire solar system)
 if (this.sun) this.sun.visible = solarFadeOut > 0.01;
 this._planetArray.forEach(planet => {
 if (planet) planet.visible = solarFadeOut > 0.01;
 });
 // Comets
 if (this.comets) {
 this.comets.forEach(comet => {
 comet.visible = solarFadeOut > 0.01;
 });
 }
 // Spacecraft
 if (this.spacecraft) {
 this.spacecraft.forEach(craft => {
 craft.visible = solarFadeOut > 0.01;
 });
 }
 if (this.satellites) {
 this.satellites.forEach(sat => {
 sat.visible = solarFadeOut > 0.01;
 });
 }
 // Nearby stars (exoplanet host stars: Alpha Centauri, TRAPPIST-1, etc.)
 if (this.nearbyStars) {
 this.nearbyStars.forEach(star => {
 star.visible = solarFadeOut > 0.01;
 });
 }
 // Exoplanets
 if (this.exoplanets) {
 this.exoplanets.forEach(planet => {
 planet.visible = solarFadeOut > 0.01;
 });
 }
 }
 }

 }

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


 updateScale() {
 // Update all planetary positions based on scale mode
 const scaleFactors = this.realisticScale ? {
 // Realistic scale (AU converted to scene units, using 51.28 units per AU)
 mercury: 57.9,    // 0.39 AU
 venus: 108.2,     // 0.72 AU
 earth: 150,       // 1.0 AU
 mars: 227.9,      // 1.52 AU
 jupiter: 778.6,   // 5.20 AU
 saturn: 1433.5,   // 9.54 AU
 uranus: 2872.5,   // 19.19 AU
 neptune: 4495.1,  // 30.07 AU
 pluto: 5906.4,    // 39.48 AU
 // Dwarf planets at realistic scale
 ceres: 142,       // 2.77 AU (asteroid belt)
 haumea: 2205,     // 43 AU (Kuiper belt)
 makemake: 2308,   // 45 AU (Kuiper belt)
 eris: 3436,       // 67 AU (scattered disk - perihelion, aphelion ~97.5 AU = 5000 units)
 orcus: 2010,      // 39.2 AU (Plutino)
 quaoar: 2226,     // 43.4 AU (Kuiper belt)
 gonggong: 3461,   // 67.5 AU (scattered disk)
 sedna: 25948,     // 506 AU (inner Oort cloud - semi-major axis, perihelion 76 AU, aphelion 937 AU)
 salacia: 2164,    // 42.2 AU (Kuiper belt)
 varda: 2195,      // 42.8 AU (Kuiper belt)
 varuna: 2169      // 42.3 AU (Kuiper belt)
 } : {
 // Educational scale - proportionally compressed but maintaining relative distances
 // Real AU ratios (Mercury = 1x): Venus 1.85x, Earth 2.56x, Mars 3.90x, 
 // Jupiter 13.3x, Saturn 24.5x, Uranus 49.2x, Neptune 77.1x, Pluto 101.2x
 // 
 // Scaled to fit with constraints:
 // - Asteroid belt: 100-150 (125 ± 25) - between Mars and Jupiter
 // - Kuiper belt: 1600-2400 (2000 ± 400) - beyond Neptune, includes Pluto
 // - Mars + moons (max +2.5) must be < 100
 // - Jupiter + moons (max +23) must be > 150
 // - All proportions maintained relative to real astronomical distances
 mercury: 20,   // Base unit (0.39 AU)
 venus: 37,     // 1.85x Mercury (0.72 AU) - was 30
 earth: 51,     // 2.56x Mercury (1.0 AU) - was 45
 mars: 78,      // 3.90x Mercury (1.52 AU) - was 55, Deimos at +2.5 = 80.5 (clears belt at 100)
 jupiter: 266,  // 13.3x Mercury (5.20 AU) - was 120, Callisto at +23 = 289 (clears belt at 150)
 saturn: 490,   // 24.5x Mercury (9.54 AU) - was 180, Rhea at +12 = 502
 uranus: 984,   // 49.2x Mercury (19.19 AU) - was 235, Titania at +5 = 989
 neptune: 1542, // 77.1x Mercury (30.07 AU) - was 270, Triton at +5 = 1547 (clears Kuiper at 700)
 pluto: 2024,   // 101.2x Mercury (39.48 AU) - was 340, inside Kuiper belt as it should be
 // Dwarf planets beyond Pluto
 ceres: 140,    // 2.77 AU - in asteroid belt
 haumea: 2139,  // ~43 AU - Kuiper belt
 makemake: 2279, // ~45 AU - Kuiper belt
 eris: 2483,    // ~67 AU - scattered disk (average distance)
 orcus: 2024,   // ~39 AU - similar to Pluto (2:3 resonance with Neptune)
 quaoar: 2189,  // ~43.4 AU - Kuiper belt
 gonggong: 3457, // ~67.5 AU - scattered disk
 sedna: 4500,   // ~87.7 AU equivalent in educational (actual: ~506 AU avg, but compressed to be visible beyond Kuiper belt yet before Oort cloud)
 salacia: 2234, // ~42.2 AU - Kuiper belt
 varda: 2328,   // ~42.8 AU - Kuiper belt
 varuna: 2139   // ~42.3 AU - Kuiper belt
 };
 
 // Update planet distances (including dwarf planets)
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

 // Update heliopause radius:
 // Educational: 2,700 units (~120 AU × 22.5 units/AU)
 // Realistic: 18,000 units (120 AU × 150 units/AU)
 if (this.heliopause) {
 const newRadius = this.realisticScale ? 18000 : 2700;
 this.heliopause.userData.radius = newRadius;
 this.heliopause.scale.setScalar(newRadius / this.heliopause.userData.baseRadius);
 }

 // Scale the Milky Way galaxy disc so it fills the same apparent angular size
 // at the new fade-in distance (proportional to heliopause ratio 18000/2700 ≈ 6.667).
 if (this.milkyWayDisc?.userData?.basePosition) {
 const discScale = this.realisticScale ? 18000 / 2700 : 1.0;
 const bp = this.milkyWayDisc.userData.basePosition;
 this.milkyWayDisc.scale.setScalar(discScale);
 this.milkyWayDisc.position.set(bp.x * discScale, bp.y * discScale, bp.z * discScale);
 }

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

 // Helper: generate orbit trace points.
 // In scientific mode, traces the actual Keplerian ellipse (Sun at focus) or the tilted ellipse.
 // In educational mode, generates a simple circle of radius `distance` on the XZ plane.
 const makeOrbitPoints = (distance, e, inc, w, segments) => {
 const pts = [];
 if (this.scientificMode) {
 const a = distance;
 for (let j = 0; j <= segments; j++) {
 const f = (j / segments) * Math.PI * 2; // true anomaly
 const r = (e > 0) ? (a * (1 - e * e) / (1 + e * Math.cos(f))) : a;
 const theta = f + w; // argument of periapsis rotates the ellipse
 const xOrb = r * Math.cos(theta);
 const zOrb = r * Math.sin(theta);
 pts.push(new THREE.Vector3(xOrb, zOrb * Math.sin(inc), zOrb * Math.cos(inc)));
 }
 } else {
 for (let j = 0; j <= segments; j++) {
 const angle = (j / segments) * Math.PI * 2;
 pts.push(new THREE.Vector3(distance * Math.cos(angle), 0, distance * Math.sin(angle)));
 }
 }
 return pts;
 };

 // Recreate orbital paths for all planets and dwarf planets
 Object.entries(this.planets).forEach(([planetName, planet]) => {
 if (!planet?.userData) return;
 const isDwarf = planet.userData.type === 'DwarfPlanet';
 const elem = this.SCIENTIFIC_ORBITAL_ELEMENTS[planetName];
 const e = elem?.eccentricity || 0;
 const inc = (elem?.inclinationDeg || 0) * Math.PI / 180;
 const w = (elem?.periapsisDeg || 0) * Math.PI / 180;
 const distance = planet.userData.distance;
 const segments = 128;
 const points = makeOrbitPoints(distance, e, inc, w, segments);
 
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: isDwarf ? 0x9966CC : 0x4488CC,
 transparent: true,
 opacity: 0.5,
 depthWrite: false
 });
 
 const orbit = new THREE.Line(geometry, material);
 orbit.visible = this.orbitsVisible;
 orbit.renderOrder = 1;
 orbit.userData = { type: 'orbit', planet: planetName, isDwarf: isDwarf };
 
 planet.parent.add(orbit);
 this.orbits.push(orbit);
 });
 
 // Recreate moon orbital paths
 Object.values(this.planets).forEach(planet => {
 if (planet.userData.moons && planet.userData.moons.length > 0) {
 if (DEBUG.enabled) console.log(`[Orbits] Recreating ${planet.userData.moons.length} moon orbit(s) for ${planet.userData.name}`);
 planet.userData.moons.forEach(moon => {
 const moonDistance = moon.userData.distance;
 const e = this.scientificMode ? (moon.userData.orbitalEccentricity || 0) : 0;
 const inc = this.scientificMode ? (moon.userData.orbitalInclination || 0) : 0;
 const w = this.scientificMode ? (moon.userData.orbitalPeriapsis || 0) : 0;
 
 const points = makeOrbitPoints(moonDistance, e, inc, w, 128);
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: 0xAADDFF, // Brighter cyan for better visibility
 transparent: true,
 opacity: 0.5,
 depthWrite: false
 });
 
 const orbitLine = new THREE.Line(geometry, material);
 // We do NOT need orbitLine.rotation.x = Math.PI / 2 because makeOrbitPoints generates Vector3s mapped to the correct planes directly!
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
 { base: 125, spread: 25 } : // We're switching FROM educational TO realistic
 { base: 350, spread: 150 }; // We're switching FROM realistic TO educational
 
 const newParams = this.realisticScale ? 
 { base: 350, spread: 150 } : // Switching TO realistic
 { base: 125, spread: 25 }; // Switching TO educational - proportionally scaled (was 75±15)
 
 this.asteroidBelt.children.forEach(particleSystem => {
 if (particleSystem.geometry && particleSystem.geometry.attributes.position) {
 const positions = particleSystem.geometry.attributes.position.array;
 const particleCount = positions.length / 3;
 
 for (let i = 0; i < particleCount; i++) {
 const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
 const currentDist = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 2] * positions[i * 3 + 2]);
 
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
 { base: 2000, spread: 400 } : // We're switching FROM educational TO realistic
 { base: 6000, spread: 2250 }; // We're switching FROM realistic TO educational
 
 const newParams = this.realisticScale ? 
 { base: 6000, spread: 2250 } : // Switching TO realistic (30-55 AU, centered at 40 AU)
 { base: 2000, spread: 400 }; // Switching TO educational (beyond Neptune at 1542, includes Pluto at 2024)
 
 this.kuiperBelt.children.forEach(particleSystem => {
 if (particleSystem.geometry && particleSystem.geometry.attributes.position) {
 const positions = particleSystem.geometry.attributes.position.array;
 const particleCount = positions.length / 3;
 
 for (let i = 0; i < particleCount; i++) {
 const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
 const currentDist = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 2] * positions[i * 3 + 2]);
 
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

 // Update Oort Cloud positions based on scale (spherical shell)
 // Educational: inner=3000, outer=9000
 // Realistic: inner=20000, outer=60000 (proportional to heliopause 18k, same ratio as educational)
 if (this.oortCloud && this.oortCloud.children) {
 // this.realisticScale is already the NEW state when updateScale() runs.
 const oldParams = this.realisticScale
 ? { inner: 3000, outer: 9000 } // was educational, now switching TO realistic
 : { inner: 20000, outer: 60000 }; // was realistic, now switching TO educational

 const newParams = this.realisticScale
 ? { inner: 20000, outer: 60000 } // TO realistic
 : { inner: 3000, outer: 9000 }; // TO educational
 
 this.oortCloud.children.forEach(particleSystem => {
 if (particleSystem.geometry && particleSystem.geometry.attributes.position) {
 const positions = particleSystem.geometry.attributes.position.array;
 const particleCount = positions.length / 3;
 
 for (let i = 0; i < particleCount; i++) {
 // Get current spherical coordinates
 const x = positions[i * 3];
 const y = positions[i * 3 + 1];
 const z = positions[i * 3 + 2];
 const currentRadius = Math.sqrt(x * x + y * y + z * z);
 
 // Calculate angles (theta and phi)
 const theta = Math.atan2(z, x);
 const phi = Math.acos(y / currentRadius);
 
 // Normalize radius from current scale to 0-1 range
 const normalizedRadius = Math.max(0, Math.min(1, (currentRadius - oldParams.inner) / (oldParams.outer - oldParams.inner)));
 
 // Apply to new scale
 const newRadius = newParams.inner + (normalizedRadius * (newParams.outer - newParams.inner));
 
 // Convert back to Cartesian coordinates
 positions[i * 3] = newRadius * Math.sin(phi) * Math.cos(theta);
 positions[i * 3 + 1] = newRadius * Math.cos(phi);
 positions[i * 3 + 2] = newRadius * Math.sin(phi) * Math.sin(theta);
 }
 
 particleSystem.geometry.attributes.position.needsUpdate = true;
 }
 });
 }
 
 if (DEBUG.enabled) console.log(`[SCALE] Belts updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }
 
 updateSpacecraftPositions() {
 // Update spacecraft positions based on scale mode
 if (!this.spacecraft || this.spacecraft.length === 0) return;

 // Trajectory-based probes: recompute from current simulatedJD with new scale
 // _probePositionAtJD reads this.realisticScale so calling after scale toggle is correct.
 this.spacecraft.forEach(spacecraft => {
 const ud = spacecraft.userData;
 if (!ud || ud.orbitPlanet || !ud.trajectory) return;
 const pos = this._probePositionAtJD(ud.trajectory, this.simulatedJD);
 spacecraft.position.set(pos.x, pos.y, pos.z);
 ud.distanceAU = pos.distAU;
 ud.distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
 });

 // JWST and other non-trajectory spacecraft: use legacy scale table for display distances
 const spacecraftScaleFactors = this.realisticScale ? {
 'James Webb Space Telescope': 155
 } : {
 'James Webb Space Telescope': 55
 };

 this.spacecraft.forEach(spacecraft => {
 const userData = spacecraft.userData;
 if (!userData || userData.orbitPlanet || userData.trajectory) return; // skip trajectory probes & orbiters

 const newDistance = spacecraftScaleFactors[userData.name];
 if (newDistance && userData.angle !== undefined) {
 userData.distance = newDistance;
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
 // Realistic scale using actual AU values * 51.28 units per AU
 'Halley\'s Comet': 1795,  // ~35 AU actual
 'Comet Hale-Bopp': 12820, // ~250 AU actual
 'Comet Hyakutake': 1540,  // ~30 AU actual
 'Comet Lovejoy': 770,     // ~15 AU actual (sungrazer)
 'Comet Encke': 385,       // ~7.5 AU actual (shortest period)
 'Comet Swift-Tuttle': 2570 // ~50 AU actual
 } : {
 // Educational scale - compressed so comet motion is easier to perceive
 'Halley\'s Comet': 950,
 'Comet Hale-Bopp': 3500,
 'Comet Hyakutake': 850,
 'Comet Lovejoy': 520,
 'Comet Encke': 260,
 'Comet Swift-Tuttle': 1300
 };
 
 this.comets.forEach(comet => {
 const userData = comet.userData;
 if (!userData || !userData.name) return;
 
 const newDistance = cometScaleFactors[userData.name];
 if (newDistance !== undefined) {
 // Update stored distance (semi-major axis)
 userData.distance = newDistance;
 // Reclamp eccentricity for the new distance so perihelion stays outside the sun
 const MIN_PERIHELION = 45;
 userData.eccentricity = Math.min(
 userData.originalEccentricity || userData.eccentricity,
 1 - MIN_PERIHELION / newDistance
 );

 // Recalculate position based on current angle and eccentricity
 const e = userData.eccentricity;
 const a = userData.distance;
 const angle = userData.angle || 0;
 
 const cosAngle = Math.cos(angle);
 const sinAngle = Math.sin(angle);
 
 // Elliptical orbit formula
 const r = a * (1 - e * e) / (1 + e * cosAngle);
 const inclRadScale = (userData.inclination || 0) * Math.PI / 180;
 comet.position.x = r * cosAngle;
 comet.position.z = r * sinAngle * Math.cos(inclRadScale);
 comet.position.y = r * sinAngle * Math.sin(inclRadScale);
 
 if (DEBUG.enabled) console.log(` ${userData.name}: ${newDistance} units (e=${e})`);
 }
 });
 
 if (DEBUG.enabled) console.log(` Comet positions updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);

 // Ensure comet orbit lines match updated scale/distances.
 this.updateCometOrbitLines();
 }

 updateCometOrbitLines() {
 if (!this.comets || this.comets.length === 0) return;

 const orbitSegments = 256;
 this.comets.forEach(comet => {
 const userData = comet?.userData;
 let orbitLine = userData?.orbitLine;

 // Recreate orbit line if reference was lost
 if (userData && !orbitLine) {
 const geo = new THREE.BufferGeometry();
 const mat = new THREE.LineBasicMaterial({
 color: 0xCC9955,
 transparent: true,
 opacity: 0.6,
 depthWrite: false
 });
 orbitLine = new THREE.Line(geo, mat);
 orbitLine.renderOrder = 1;
 orbitLine.frustumCulled = false;
 orbitLine.userData = { type: 'orbit', comet: userData.name };
 comet.parent?.add(orbitLine);
 this.cometOrbits.push(orbitLine);
 userData.orbitLine = orbitLine;
 if (DEBUG.enabled) console.warn(`[Comets] Recreated missing orbit line for ${userData.name}`);
 }
 if (!userData || !orbitLine) return;

 const a = userData.distance;
 const e = userData.eccentricity || 0;
 const inclRadRebuild = (userData.inclination || 0) * Math.PI / 180;
 const points = [];
 for (let j = 0; j <= orbitSegments; j++) {
 const f = (j / orbitSegments) * Math.PI * 2;
 const r = a * (1 - e * e) / (1 + e * Math.cos(f));
 points.push(new THREE.Vector3(r * Math.cos(f), r * Math.sin(f) * Math.sin(inclRadRebuild), r * Math.sin(f) * Math.cos(inclRadRebuild)));
 }

 orbitLine.geometry.setFromPoints(points);
 orbitLine.geometry.computeBoundingSphere();
 orbitLine.frustumCulled = false;
 orbitLine.visible = this.cometOrbitsVisible;
 });
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

 // Update nearby stars (exoplanet host stars: Alpha Centauri, TRAPPIST-1, etc.)
 // In realistic scale these move outward so they stay beyond the heliopause (18,000 units).
 if (this.nearbyStars && this.nearbyStars.length > 0) {
 this.nearbyStars.forEach(star => {
 if (star.userData && star.userData.basePosition) {
 star.position.x = star.userData.basePosition.x * deepSpaceScale;
 star.position.y = star.userData.basePosition.y * deepSpaceScale;
 star.position.z = star.userData.basePosition.z * deepSpaceScale;
 }
 });
 }

 // Update constellation positions for scale mode.
 // Each constellation is a THREE.Group at scene origin; its children (star meshes
 // and line meshes) are positioned at CONFIG.CONSTELLATION.DISTANCE (10,000 units).
 // Scaling the group by deepSpaceScale moves all children to 25,000 units in
 // realistic mode — well outside the realistic heliopause at 18,000 units.
 // userData.centerPosition (used by focusOnObject) is updated lazily from a cached
 // baseCenterPosition so camera targeting remains accurate after scale changes.
 if (this.constellations && this.constellations.length > 0) {
 this.constellations.forEach(group => {
 group.scale.setScalar(deepSpaceScale);
 if (group.userData && group.userData.centerPosition) {
 // Cache base on first call
 if (!group.userData.baseCenterPosition) {
 group.userData.baseCenterPosition = {
 x: group.userData.centerPosition.x,
 y: group.userData.centerPosition.y,
 z: group.userData.centerPosition.z,
 };
 }
 const base = group.userData.baseCenterPosition;
 group.userData.centerPosition.x = base.x * deepSpaceScale;
 group.userData.centerPosition.y = base.y * deepSpaceScale;
 group.userData.centerPosition.z = base.z * deepSpaceScale;
 }
 });
 }

 if (DEBUG.enabled) console.log(` Deep space objects updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }

 getObjectInfo(object) {
 const userData = object.userData;
 const t = window.t || ((key) => key);
 
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

 const duration = isFastOrbiter ? 1000 : 1500; // Faster transition for fast orbiters
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


