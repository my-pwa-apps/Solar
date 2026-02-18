// ===========================
// SOLAR SYSTEM MODULE
// ===========================
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { TEXTURE_CACHE, cachedTextureGeneration } from './TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from './utils.js';

// i18n.js is loaded globally in index.html, access via window.t
const t = window.t || ((key) => key);

export class SolarSystemModule {
 constructor(uiManager) {
 this.uiManager = uiManager;
 this.objects = [];
 this.planets = {};
 this.moons = {};
 this.sun = null;
 this.starfield = null;
 this.asteroidBelt = null;
 this.kuiperBelt = null;
 this.orbits = [];
 this.focusedObject = null;
 this.distantStars = [];
 this.nebulae = [];
 this.galaxies = [];
 this.comets = [];
 this.satellites = [];
 this.spacecraft = [];
 this.constellations = [];
 
 // Scale mode: false = educational (compressed), true = realistic (vast)
 this.realisticScale = false;
 
 // Comet tails visibility: false = hidden (better visual performance)
 this.cometTailsVisible = false;
 
 // Orbits visibility: true = visible by default
 this.orbitsVisible = true;
 
 // Constellations visibility: true = visible by default
 this.constellationsVisible = true;
 
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
 orbitalPeriod: 60190 // Earth days (~164.8 years)
 },
 pluto: {
 rotationPeriod: 153.293, // hours (6.387 Earth days - retrograde)
 axialTilt: 122.53, // degrees
 retrograde: true,
 orbitalPeriod: 90560 // Earth days (~248 years)
 },
 moon: {
 rotationPeriod: 655.7, // hours (27.3 Earth days - tidally locked)
 axialTilt: 6.68, // degrees
 retrograde: false,
 orbitalPeriod: 27.3 // Earth days
 }
 };
 
 // Time acceleration factor (1 = real-time, higher = faster)
 this.timeAcceleration = 360; // 360x faster = 1 Earth day in 4 minutes
 this.realTimeStart = Date.now();
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
 const t = window.t || ((key) => key);
 
 // Define all loading steps with progress and tasks
 // Individual planet creation reports its own progress internally
 const loadingSteps = [
 { progress: 3, message: t('creatingSun'), task: async () => this.createSun(scene) },
 { progress: 5, message: t('creatingInnerPlanets'), task: async () => await this.createInnerPlanets(scene) },
 { progress: 38, message: t('creatingOuterPlanets'), task: async () => await this.createOuterPlanets(scene) },
    { progress: 50, message: t('creatingDwarfPlanets'), task: async () => await this.createDwarfPlanets(scene) },
 { progress: 62, message: t('creatingAsteroidBelt'), task: () => this.createAsteroidBelt(scene) },
 { progress: 65, message: t('creatingKuiperBelt'), task: () => this.createKuiperBelt(scene) },
 { progress: 67, message: t('creatingOortCloud'), task: () => this.createOortCloud(scene) },
 { progress: 69, message: t('creatingStarfield'), task: () => this.createStarfield(scene) },
 { progress: 71, message: t('creatingOrbitalPaths'), task: () => this.createOrbitalPaths(scene) },
 { progress: 74, message: t('creatingConstellations'), task: () => this.createConstellations(scene) },
 { progress: 77, message: t('creatingDistantStars'), task: () => this.createDistantStars(scene) },
 { progress: 80, message: t('creatingNebulae'), task: () => this.createNebulae(scene) },
 { progress: 83, message: t('creatingGalaxies'), task: () => this.createGalaxies(scene) },
 { progress: 86, message: t('creatingNearbyStars'), task: () => this.createNearbyStars(scene) },
 { progress: 89, message: t('creatingExoplanets'), task: () => this.createExoplanets(scene) },
 { progress: 91, message: t('creatingComets'), task: () => this.createComets(scene) },
 { progress: 93, message: t('creatingSatellites'), task: () => this.createSatellites(scene) },
 { progress: 95, message: t('creatingSpacecraft'), task: () => this.createSpacecraft(scene) },
 { progress: 100, message: t('creatingLabels'), task: () => this.createLabels() }
 ];

 // Execute steps sequentially with UI updates
 const executeStep = async (stepIndex) => {
 if (stepIndex >= loadingSteps.length) {
 // All steps complete
 const totalTime = performance.now() - initStartTime;
 if (DEBUG.PERFORMANCE) {
 console.log(` Full initialization completed in ${totalTime.toFixed(0)}ms`);
 console.log(` Total objects: Planets=${Object.keys(this.planets).length}, Satellites=${this.satellites.length}, Spacecraft=${this.spacecraft.length}`);
 }
 
 // Signal that loading is complete
 if (window.app && typeof window.app.startExperience === 'function') {
 window.app.startExperience();
 }
 return;
 }

 const step = loadingSteps[stepIndex];

 // Update UI first
 if (this.uiManager) {
 this.uiManager.updateLoadingProgress(step.progress, step.message);
 }

 // Yield to browser to allow UI repaint
 await new Promise(resolve => requestAnimationFrame(resolve));

 // Execute the loading task
 try {
 await step.task();
 } catch (error) {
 console.error(` Error in loading step ${stepIndex}:`, error);
 }

 // Move to next step
 await executeStep(stepIndex + 1);
 };

 // Start the loading sequence
 await executeStep(0);
 }

 createSun(scene) {
 // HYPERREALISTIC Sun with realistic size
 // Sun: 1,391,000 km / 12,742 km = 109.2 (should be MASSIVE)
 // But we'll scale it down to 15 for visibility while still being impressive
 const sunRadius = 15; // Compromise between realism and usability
 const sunGeometry = new THREE.SphereGeometry(sunRadius, 128, 128); // Higher detail
 
 // Load real NASA Sun texture (with procedural fallback)
 const sunTexture = this.createSunTextureReal(2048);
 const sunBumpMap = this.createSunBumpMap(2048);
 
 const sunMaterial = new THREE.MeshStandardMaterial({
 map: sunTexture,
 bumpMap: sunBumpMap,
 bumpScale: 0.5,
 emissive: 0xff6600,
 emissiveMap: sunTexture,
 emissiveIntensity: 2.5,
 toneMapped: false,
 roughness: 1.0,
 metalness: 0.0
 });
 
 this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.userData = {
            id: 'sun',
            name: t('sun'),
            type: t('typeStar'),
            distance: 0,
            radius: sunRadius,
            description: t('descSun'),
            funFact: t('funFactSun'),
            realSize: '1,391,000 km diameter'
        }; // Sun lighting - PointLight from center with NO DECAY for realistic solar system lighting
 // In space, light doesn't decay with distance (inverse square law applies but over HUGE distances)
 // BALANCED: Reduced intensity to prevent washing out textures on sunny side
 const sunLight = new THREE.PointLight(0xFFFAE8, 9, 0, 0); // Warm white, reduced intensity (10→9)
 sunLight.name = 'sunLight';
 sunLight.position.set(0, 0, 0);
 sunLight.castShadow = CONFIG.QUALITY.shadows;
 sunLight.shadow.mapSize.width = 4096; // Higher resolution shadows
 sunLight.shadow.mapSize.height = 4096;
 sunLight.shadow.camera.near = 1;
 sunLight.shadow.camera.far = 5000; // Increased for distant planets
 sunLight.shadow.bias = -0.0005; // Reduce shadow artifacts
 sunLight.shadow.radius = 2; // Softer shadows
 scene.add(sunLight);
 this.sun.userData.sunLight = sunLight;
 
 // Ambient light - subtle fill light for starlight reflection (not too bright!)
 // Lower value = more dramatic moon phases and realistic planet shadows
 const ambientLight = new THREE.AmbientLight(0x404050, 0.4); // Subtle starlight ambient
 ambientLight.name = 'ambientLight';
 scene.add(ambientLight);
 
 if (DEBUG.enabled) {
 console.log(' Lighting: Sun intensity 9 (warm white), Ambient 0.4 (subtle), Tone mapping 1.2');
 console.log(' - Subtle ambient simulates starlight reflection');
 console.log(' - Realistic moon phases with proper shadow terminator');
 console.log(' - Dramatic day/night contrast on planets');
 console.log(' - Sun light reaches all planets without decay');
 console.log(' - Eclipses will cast 4K shadows');
 }
 
 // Multi-layer corona for realistic glow
 const coronaLayers = [
 { size: 11.5, color: 0xffdd88, opacity: 0.25 },
 { size: 13, color: 0xffaa44, opacity: 0.18 },
 { size: 15, color: 0xff8822, opacity: 0.12 },
 { size: 18, color: 0xff6600, opacity: 0.06 }
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
            moons: 1,
            atmosphere: true
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
            name: t('deimos'),
            radius: 0.06, // Scaled up for visibility (was 0.0015)
            color: 0x888888,
            distance: 2.5,
            speed: 4.35, // 544x Mars's speed (0.008 * 544)
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
            moons: 4,
            rings: true
        }); // Jupiter's Galilean moons (realistic sizes)
        // Io: 3,643 km / 12,742 km = 0.286
        // Orbital period: 1.769 days vs Jupiter's 4333 days = 2449x faster
        this.createMoon(this.planets.jupiter, {
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
        // Orbits inside rings (rings: 11.88-20.11)
        this.createMoon(this.planets.saturn, {
            name: t('enceladus'),
            radius: 0.040,
            color: 0xFFFFFF,
            distance: 15, // Inside rings - between Saturn (9.14) and ring edge (20.11)
            speed: 1.5, // Reduced from 7.07 for smoother visual orbit
            description: t('descEnceladus')
        });
        // Rhea: 1,527 km / 12,742 km = 0.120
        // Orbital period: 4.518 days vs Saturn's 10759 days = 2382x faster
        // Orbits outside rings
        this.createMoon(this.planets.saturn, {
            name: t('rhea'),
            radius: 0.120,
            color: 0xCCCCCC,
            distance: 23, // Outside rings (rings end at 20.11)
            speed: 2.144, // 2382x Saturn's speed (0.0009 * 2382)
            description: t('descRhea')
        });
        // Titan: 5,150 km / 12,742 km = 0.404 (bigger than Mercury!)
        // Orbital period: 15.945 days vs Saturn's 10759 days = 675x faster
        // Orbits well outside rings
        this.createMoon(this.planets.saturn, {
            name: t('titan'),
            radius: 0.404,
            color: 0xFFAA33,
            distance: 28, // Well outside rings for clear separation
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
            name: t('titania'),
            radius: 0.124,
            color: 0xAAAAAA,
            distance: 5,
            speed: 1.410, // 3526x Uranus's speed (0.0004 * 3526)
            description: t('descTitania')
        });
        // Miranda: 472 km / 12,742 km = 0.037
        // Orbital period: 1.413 days vs Uranus's 30687 days = 21722x faster
        this.createMoon(this.planets.uranus, {
            name: t('miranda'),
            radius: 0.037,
            color: 0x999999,
            distance: 3.5,
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
            { name: 'Ceres', radius: 0.074, color: 0xC8C8B4, distance: 140, speed: 0.02, rotationSpeed: 0.02, tilt: 4, description: 'Largest object in asteroid belt; classified as dwarf planet.', funFact: 'May host subsurface brines.', realSize: '939 km diameter', hasRemote: true },
            { name: 'Haumea', radius: 0.086, color: 0xE0D6C8, distance: 2139, speed: 0.00005, rotationSpeed: 0.08, tilt: 28, description: 'Fast-spinning elongated dwarf planet.', funFact: 'Rotation period ~4 hours gives ellipsoid shape.', realSize: '~1632 x 996 x 760 km' },
            { name: 'Makemake', radius: 0.112, color: 0xD4B48C, distance: 2279, speed: 0.000047, rotationSpeed: 0.01, tilt: 29, description: 'Bright Kuiper Belt dwarf planet.', funFact: 'Discovered near Easter, named after Rapa Nui deity.', realSize: '1430 km diameter' },
            { name: 'Eris', radius: 0.183, color: 0xD8D8D8, distance: 2483, speed: 0.00004, rotationSpeed: 0.01, tilt: 44, description: 'Massive scattered disk dwarf planet.', funFact: 'Helped prompt Pluto reclassification.', realSize: '2326 km diameter' },
            { name: 'Orcus', radius: 0.071, color: 0xB0B0C0, distance: 2024, speed: 0.000052, rotationSpeed: 0.01, tilt: 20, description: 'Pluto companion in 2:3 resonance.', funFact: 'Sometimes called anti-Pluto.', realSize: '~910 km est.' },
            { name: 'Quaoar', radius: 0.087, color: 0xC8A088, distance: 2189, speed: 0.000051, rotationSpeed: 0.012, tilt: 15, description: 'Large Kuiper Belt object; possible ring.', funFact: 'Ring is unusually far out.', realSize: '1110 km diameter' },
            { name: 'Gonggong', radius: 0.097, color: 0xBB7766, distance: 3457, speed: 0.000039, rotationSpeed: 0.008, tilt: 30, description: 'Distant slow-rotating object (2007 OR10).', funFact: 'Named after Chinese water god.', realSize: '~1230 km est.' },
            { name: 'Sedna', radius: 0.078, color: 0xCC6644, distance: 4500, speed: 0.000003, rotationSpeed: 0.006, tilt: 12, description: 'Inner Oort Cloud object with extreme elliptical orbit (76-937 AU). One of the most distant known solar system bodies.', funFact: 'Takes ~11,400 years to orbit! Its reddish color rivals Mars.', realSize: '~995 km diameter' },
            { name: 'Salacia', radius: 0.067, color: 0x996655, distance: 2234, speed: 0.000048, rotationSpeed: 0.01, tilt: 18, description: 'Dark Kuiper Belt object.', funFact: 'Named after Roman sea goddess.', realSize: '~850 km est.' },
            { name: 'Varda', radius: 0.057, color: 0xAA8866, distance: 2328, speed: 0.000046, rotationSpeed: 0.01, tilt: 10, description: 'Binary with moon Ilmarë.', funFact: 'Its satellite aids mass calculation.', realSize: '~720 km est.' },
            { name: 'Varuna', radius: 0.052, color: 0xAA7755, distance: 2139, speed: 0.000053, rotationSpeed: 0.04, tilt: 22, description: 'Rapidly rotating classical KBO.', funFact: 'Fast spin may make it oblate.', realSize: '~668 km est.' }
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
 
 createSunTexture(size) {
 // Use reusable utilities
 const { canvas, ctx } = TextureGeneratorUtils.createCanvas(size);
 
 // Gradient from core to edge
 const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
 gradient.addColorStop(0, '#FFFF00');
 gradient.addColorStop(0.5, '#FFCC00');
 gradient.addColorStop(1, '#FF8800');
 ctx.fillStyle = gradient;
 ctx.fillRect(0, 0, size, size);
 
 // Add granulation (convection cells)
 for (let i = 0; i < 5000; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 2 + Math.random() * 4;
 const brightness = 0.85 + Math.random() * 0.15;
 
 ctx.fillStyle = `rgba(255, ${Math.floor(200 * brightness)}, 0, 0.3)`;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 // Add sunspots (cooler, darker regions)
 for (let i = 0; i < 30; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 10 + Math.random() * 30;
 
 // Sunspot umbra (dark center)
 const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
 spotGradient.addColorStop(0, 'rgba(30, 20, 0, 0.8)');
 spotGradient.addColorStop(0.6, 'rgba(100, 60, 0, 0.4)');
 spotGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
 
 ctx.fillStyle = spotGradient;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 createSunBumpMap(size) {
 // Use reusable utilities
 const { canvas, ctx } = TextureGeneratorUtils.createCanvas(size);
 
 // Base gray
 ctx.fillStyle = '#808080';
 ctx.fillRect(0, 0, size, size);
 
 // Add granulation bumps
 for (let i = 0; i < 3000; i++) {
 const x = Math.random() * size;
 const y = Math.random() * size;
 const radius = 2 + Math.random() * 3;
 const height = Math.random();
 
 const gray = Math.floor(128 + height * 80);
 ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
 ctx.beginPath();
 ctx.arc(x, y, radius, 0, Math.PI * 2);
 ctx.fill();
 }
 
 return TextureGeneratorUtils.finalizeTexture(canvas);
 }
 
 // REMOVED: createEarthNightLights() - was 105 lines of unused city lights code
 
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
                
                // Check cache first (cache by planet name only, not URL)
                const cacheKey = `${planetName.toLowerCase()}_texture_remote`;
                const cachedDataURL = await TEXTURE_CACHE.get(cacheKey);
                if (cachedDataURL) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        const tex = new THREE.Texture(img);
                        tex.needsUpdate = true;
                        this._onPlanetTextureSuccess(planetName, tex, url, 'cached');
                    };
                    img.onerror = () => {
                        // Cached texture is corrupted, clear it and try loading fresh
                        TEXTURE_CACHE.set(cacheKey, null).catch(() => {});
                        primaryIndex++;
                        tryNext();
                    };
                    img.src = cachedDataURL;
                    return;
                }
                meta.phase = 'primary';
                
                // Set timeout for Quest VR (10 seconds max per texture)
                let loadTimedOut = false;
                currentTimeout = setTimeout(() => {
                    loadTimedOut = true;
                    meta.timeouts++;
                    console.warn(`?? ${planetName} primary source ${primaryIndex + 1} timed out after 10s: ${url}`);
                    meta.errors.push({ url, error: 'Timeout after 10s', phase: 'primary' });
                    primaryIndex++;
                    tryNext();
                }, 10000);
                
                loader.load(
                    url, 
                    (tex) => {
                        if (!loadTimedOut) {
                            clearTimeout(currentTimeout);
                            currentTimeout = null;
                            this._onPlanetTextureSuccess(planetName, tex, url, 'primary');
                        }
                    }, 
                    undefined, 
                    (error) => {
                        if (!loadTimedOut) {
                            clearTimeout(currentTimeout);
                            currentTimeout = null;
                            const errorMsg = error?.message || error?.type || 'Network or CORS issue';
                            console.warn(`?? ${planetName} primary source ${primaryIndex + 1} failed: ${url}`);
                            console.warn(`   Error: ${errorMsg}`);
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
                
                // Set timeout for Quest VR (10 seconds max per texture)
                let loadTimedOut = false;
                currentTimeout = setTimeout(() => {
                    loadTimedOut = true;
                    meta.timeouts++;
                    console.warn(`?? ${planetName} plugin source ${pluginIndex + 1} timed out after 10s: ${url}`);
                    meta.errors.push({ url, error: 'Timeout after 10s', phase: 'plugin' });
                    pluginIndex++;
                    tryNext();
                }, 10000);
                
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
                            console.warn(`?? ${planetName} plugin source ${pluginIndex + 1} failed: ${url}`);
                            console.warn(`   Error: ${errorMsg}`);
                            meta.errors.push({ url, error: errorMsg, phase: 'plugin' });
                            pluginIndex++;
                            tryNext();
                        }
                    }
                );
                return;
            }
            // All remote attempts failed ° generate procedural now
            phase = 'procedural';
        }
        if (phase === 'procedural') {
            console.warn(`?? All remote texture sources for ${planetName} failed. Generating procedural texture...`);
            console.warn(`   Total errors: ${meta.errors.length}, Timeouts: ${meta.timeouts}`);
            meta.phase = 'procedural';
            
            // Wrap procedural generation in try-catch for Quest safety
            try {
                const maybePromise = proceduralFunction.call(this, size);
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then((tex) => {
                        if (DEBUG.TEXTURES) console.log(`? ${planetName} procedural texture generated successfully`);
                        this._applyProceduralPlanetTexture(planetName, tex);
                    }).catch((err) => {
                        console.error(`? ${planetName} procedural texture generation failed:`, err);
                        meta.errors.push({ error: err.message, phase: 'procedural' });
                        // Keep placeholder texture as last resort
                    });
                } else {
                    if (DEBUG.TEXTURES) console.log(`? ${planetName} procedural texture generated successfully`);
                    this._applyProceduralPlanetTexture(planetName, maybePromise);
                }
            } catch (err) {
                console.error(`? ${planetName} procedural texture generation failed:`, err);
                meta.errors.push({ error: err.message, phase: 'procedural' });
                // Keep placeholder texture as last resort
            }
        }
    };

    // Kick off chain
    tryNext();
    return placeholderTexture; // caller receives placeholder; will be swapped later
 }

 // Internal: apply successful remote texture
 _onPlanetTextureSuccess(planetName, tex, url, sourceType) {
    try {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        
        // Cache the successfully loaded texture for future use (cache by planet name only)
        // Don't include URL in cache key so texture persists across language changes
        const cacheKey = `${planetName.toLowerCase()}_texture_remote`;
        if (tex.image && tex.image instanceof HTMLImageElement && sourceType !== 'cached') {
            // Convert image to data URL and cache it (skip if already from cache)
            const canvas = document.createElement('canvas');
            canvas.width = tex.image.width;
            canvas.height = tex.image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tex.image, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.95);
            TEXTURE_CACHE.set(cacheKey, dataURL).catch(() => {
                // Cache write failed - texture will be reloaded next time
            });
            if (DEBUG.TEXTURES) {
                console.log(`?? Cached ${planetName} texture: ${(dataURL.length / 1024 / 1024).toFixed(2)}MB`);
            }
        }
        
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
            console.warn(`?? ${planetName} object not found when applying texture`);
            return;
        }
        
        if (!planet.material) {
            console.warn(`?? ${planetName} has no material to apply texture to`);
            return;
        }
        
        planet.material.map = tex;
        // Also update emissiveMap for the Sun to show the texture in its glow
        if (planetName.toLowerCase() === 'sun') {
            planet.material.emissiveMap = tex;
        }
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
        console.error(`? Error applying ${planetName} texture:`, err);
    }
 }

 // Internal: apply procedural texture after all remote failed
 _applyProceduralPlanetTexture(planetName, tex) {
    try {
        // Handle Sun specially (stored in this.sun, not this.planets)
        const planet = planetName.toLowerCase() === 'sun' ? this.sun : this.planets[planetName.toLowerCase()];
        
        if (!planet) {
            console.warn(`?? ${planetName} object not found when applying procedural texture`);
            return;
        }
        
        if (!planet.material) {
            console.warn(`?? ${planetName} has no material to apply procedural texture to`);
            return;
        }
        
        planet.material.map = tex;
        // Also update emissiveMap for the Sun to show the texture in its glow
        if (planetName.toLowerCase() === 'sun') {
            planet.material.emissiveMap = tex;
        }
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
        console.error(`? Error applying ${planetName} procedural texture:`, err);
    }
 }
 
 // Sun real texture loader
 createSunTextureReal(size) {
 const primary = [
 './textures/planets/sun.jpg'
 ];
 const pluginFallbacks = []; // already using plugin as primary
 return this.loadPlanetTextureReal('Sun', primary, this.createSunTexture, size, pluginFallbacks);
 }
 
 // Mercury real texture loader
 createMercuryTextureReal(size) {
 const primary = [
 './textures/planets/mercury.jpg'
 ];
 const pluginFallbacks = [];
 return this.loadPlanetTextureReal('Mercury', primary, this.createMercuryTexture, size, pluginFallbacks);
 }
 
 // Venus real texture loader
 createVenusTextureReal(size) {
 const primary = [
 './textures/planets/venus.jpg'
 ];
 return this.loadPlanetTextureReal('Venus', primary, this.createVenusTexture, size, []);
 }
 
 // Earth real texture loader - Optimized with reliable fallback chain
 createEarthTextureRealFixed(size) {
 // Use local self-hosted textures
 const primary = [
 './textures/planets/earth_1k.jpg',
 './textures/planets/earth_atmos_2k.jpg'
 ];
 // No external fallbacks - use procedural if local fails
 const pluginFallbacks = [];
 return this.loadPlanetTextureReal('Earth', primary, this.createEarthTexture, size, pluginFallbacks);
 }
 
 // Mars real texture loader
 createMarsTextureReal(size) {
 const primary = [
 './textures/planets/mars_1k.jpg'
 ];
 return this.loadPlanetTextureReal('Mars', primary, this.createMarsTexture, size, []);
 }
 
 // Jupiter real texture loader
 createJupiterTextureReal(size) {
 const primary = [
 './textures/planets/jupiter.jpg'
 ];
 return this.loadPlanetTextureReal('Jupiter', primary, this.createJupiterTexture, size, []);
 }
 
 // Saturn real texture loader
 createSaturnTextureReal(size) {
 const primary = [
 './textures/planets/saturn.jpg'
 ];
 return this.loadPlanetTextureReal('Saturn', primary, this.createSaturnTexture, size, []);
 }
 
 // Uranus real texture loader
 createUranusTextureReal(size) {
 const primary = [
 './textures/planets/uranus.jpg'
 ];
 return this.loadPlanetTextureReal('Uranus', primary, this.createUranusTexture, size, []);
 }
 
 // Neptune real texture loader
 createNeptuneTextureReal(size) {
 const primary = [
 './textures/planets/neptune.jpg'
 ];
 return this.loadPlanetTextureReal('Neptune', primary, this.createNeptuneTexture, size, []);
 }
 
 // Moon real texture loader - NASA LRO (Lunar Reconnaissance Orbiter) photorealistic textures
 createMoonTextureReal(size) {
 const primary = [
 // Local self-hosted textures
 './textures/moons/moon_1k.jpg',
 './textures/moons/moon_threejs_1k.jpg'
 ];
 const pluginFallbacks = [];
 return this.loadPlanetTextureReal('Moon', primary, this.createMoonTexture, size, pluginFallbacks);
 }

 // Pluto texture loader - self-hosted texture
 createPlutoTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/pluto_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Pluto', primary, this.createPlutoTexture, size, []);
 }

 // Ceres texture loader - self-hosted texture (Dawn mission style cratered surface)
 createCeresTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/ceres_2k.jpg'
    ];
    // Use Mercury-style cratered texture as fallback since Ceres is rocky and heavily cratered
    return this.loadPlanetTextureReal('Ceres', primary, this.createMercuryTexture, size, []);
 }

 // Io texture loader - Volcanic surface with sulfur deposits (NASA Voyager/Galileo)
 createIoTextureReal(size) {
    const primary = [
        './textures/moons/io_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Io', primary, this.createIoTexture, size, []);
 }

 // Europa texture loader - NASA Galileo/Juno icy surface with reddish cracks
 createEuropaTextureReal(size) {
    const primary = [
        './textures/moons/europa_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Europa', primary, this.createEuropaTexture, size, []);
 }

 // Ganymede texture loader - Largest moon in solar system (NASA Voyager/Galileo)
 createGanymedeTextureReal(size) {
    const primary = [
        './textures/moons/ganymede_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Ganymede', primary, this.createMoonTexture, size, []);
 }

 // Callisto texture loader - Ancient cratered surface (NASA Voyager/Galileo)
 createCallistoTextureReal(size) {
    const primary = [
        './textures/moons/callisto_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Callisto', primary, this.createMoonTexture, size, []);
 }

 // Titan texture loader - Saturn's largest moon with thick orange atmosphere (NASA Cassini)
 createTitanTextureReal(size) {
    const primary = [
        './textures/moons/titan_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Titan', primary, this.createTitanTexture, size, []);
 }

 // Enceladus texture loader - Saturn's icy geologically active moon (NASA Cassini)
 createEnceladusTextureReal(size) {
    const primary = [
        './textures/moons/enceladus_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Enceladus', primary, this.createMoonTexture, size, []);
 }

 // Rhea texture loader - Saturn's second-largest moon (NASA Cassini)
 createRheaTextureReal(size) {
    const primary = [
        './textures/moons/rhea_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Rhea', primary, this.createMoonTexture, size, []);
 }

 // Phobos texture loader - Mars moon (Wikimedia/NASA)
 createPhobosTextureReal(size) {
    const primary = [
        './textures/moons/phobos_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Phobos', primary, this.createPhobosTexture, size, []);
 }

 // Deimos texture loader - Mars moon (Wikimedia/NASA)
 createDeimosTextureReal(size) {
    const primary = [
        './textures/moons/deimos_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Deimos', primary, this.createDeimosTexture, size, []);
 }

 // Triton texture loader - Neptune's largest moon, retrograde orbit (NASA Voyager)
 createTritonTextureReal(size) {
    const primary = [
        './textures/moons/triton_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Triton', primary, this.createMoonTexture, size, []);
 }

 // Titania texture loader - Uranus's largest moon (NASA Voyager)
 createTitaniaTextureReal(size) {
    const primary = [
        './textures/moons/titania_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Titania', primary, this.createMoonTexture, size, []);
 }

 // Miranda texture loader - Uranus's smallest major moon with dramatic terrain (NASA Voyager)
 createMirandaTextureReal(size) {
    const primary = [
        './textures/moons/miranda_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Miranda', primary, this.createMoonTexture, size, []);
 }

 // Charon texture loader - Pluto's largest moon (NASA New Horizons)
 createCharonTextureReal(size) {
    const primary = [
        './textures/moons/charon_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Charon', primary, this.createMoonTexture, size, []);
 }

 // Haumea texture loader - Fast-spinning elongated dwarf planet (CC BY 4.0 Solar System Scope)
 createHaumeaTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/haumea_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Haumea', primary, this.createMoonTexture, size, []);
 }

 // Makemake texture loader - Bright Kuiper Belt dwarf planet (CC BY 4.0 Solar System Scope)
 createMakemakeTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/makemake_2k.jpg'
    ];
    return this.loadPlanetTextureReal('Makemake', primary, this.createMoonTexture, size, []);
 }

 // Eris texture loader - Massive scattered disk dwarf planet (CC BY 4.0 Solar System Scope)
 createErisTextureReal(size) {
    const primary = [
        './textures/dwarf-planets/eris_2k.jpg'
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
 const lonNorm = lon / (Math.PI * 2); // 0 to 1
 const latNorm01 = (lat + Math.PI / 2) / Math.PI; // 0 to 1
 
 // Americas (Western Hemisphere, lon ~0.75-0.95)
 const americas = Math.exp(-Math.pow((lonNorm - 0.85) * 6, 2)) * 
 (1 - Math.abs(latNorm01 - 0.5) * 1.5);
 
 // Eurasia-Africa (Eastern Hemisphere, lon ~0-0.4)
 const eurasia = Math.exp(-Math.pow(lonNorm * 4, 2)) * 
 (1 - Math.abs(latNorm01 - 0.55) * 1.2) * 1.2;
 const africa = Math.exp(-Math.pow((lonNorm - 0.15) * 8, 2)) * 
 Math.exp(-Math.pow((latNorm01 - 0.35) * 4, 2)) * 1.5;
 
 // Australia (lon ~0.55-0.65, lat ~0.2-0.3)
 const australia = Math.exp(-Math.pow((lonNorm - 0.6) * 12, 2)) * 
 Math.exp(-Math.pow((latNorm01 - 0.25) * 8, 2)) * 0.8;
 
 // Antarctica (bottom, all longitudes)
 const antarctica = Math.exp(-Math.pow((latNorm01 - 0.05) * 8, 2)) * 0.9;
 
 // Greenland (lon ~0.95-1.0, lat ~0.75-0.85)
 const greenland = Math.exp(-Math.pow((lonNorm - 0.97) * 20, 2)) * 
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
 
 // DEBUG: Log elevation range and raw values
 if (DEBUG.TEXTURES && x === 512 && y % 200 === 0) {
 console.log(`?? Elevation: ${elevation.toFixed(4)} (continents:${continents.toFixed(3)}, details:${details.toFixed(3)}) at lat ${(lat * 180/Math.PI).toFixed(1)} lon ${(lon * 180/Math.PI).toFixed(1)}`);
 }
 
 // EXTRA DEBUG: Track min/max elevation
 if (DEBUG.TEXTURES) {
 if (!window._earthElevationStats) {
 window._earthElevationStats = { min: Infinity, max: -Infinity, samples: 0 };
 }
 window._earthElevationStats.min = Math.min(window._earthElevationStats.min, elevation);
 window._earthElevationStats.max = Math.max(window._earthElevationStats.max, elevation);
 window._earthElevationStats.samples++;
 }
 
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
 
 // DEBUG: Count land vs ocean pixels
 let landPixels = 0, oceanPixels = 0, icePixels = 0, forcedLandPixels = 0;
 let greenestPixel = { r: 0, g: 0, b: 0, idx: 0 };
 for (let i = 0; i < data.length; i += 4) {
 const r = data[i], g = data[i+1], b = data[i+2];
 if (r > 200 && g > 200 && b > 200) {
 icePixels++;
 } else if (g > b && g > 100) {
 landPixels++;
 // Track greenest pixel (should be forest)
 if (g > greenestPixel.g) {
 greenestPixel = { r, g, b, idx: i/4 };
 }
 } else {
 oceanPixels++;
 }
 }
 const totalPixels = size * size;
 if (DEBUG.TEXTURES) {
 console.log(` Earth texture: ${(landPixels/totalPixels*100).toFixed(1)}% land, ${(oceanPixels/totalPixels*100).toFixed(1)}% ocean, ${(icePixels/totalPixels*100).toFixed(1)}% ice`);
 }
 
 // Cache the texture for future use
 const dataURL = canvas.toDataURL('image/png');
 TEXTURE_CACHE.set(cacheKey, dataURL).catch(() => {
 // Cache write failed - will regenerate next time
 });
 
 // Create texture BEFORE adding clouds
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 
 // DEBUG: Log elevation statistics (only if debug enabled)
 if (DEBUG.TEXTURES && window._earthElevationStats) {
 const stats = window._earthElevationStats;
 console.log(` Elevation: min=${stats.min.toFixed(4)}, max=${stats.max.toFixed(4)}`);
 console.log(` Continents: Americas, Eurasia, Africa, Australia, Antarctica`);
 }
 
 // ULTIMATE TEST: Create a downloadable preview
 if (DEBUG.TEXTURES) {
 try {
 console.log('??? TEXTURE PREVIEW: Right-click and "Open in new tab" to see the actual texture:');
 console.log(dataURL.substring(0, 100) + '...');
 console.log(' Copy this and paste in browser to view Earth texture:');
 console.log(' %c[VIEW EARTH TEXTURE]', 'color: #00ff00; font-size: 16px; font-weight: bold; background: #000; padding: 5px;');
 console.log(' Length:', dataURL.length, 'bytes');
 // Store for inspection
 window._earthTextureDataURL = dataURL;
 console.log(' Stored in: window._earthTextureDataURL');
 } catch (e) {
 console.error('? Failed to create texture preview:', e);
 }
 }
 
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
 if (DEBUG.TEXTURES) console.log(`✅ Earth bump map loaded from memory cache`);
 return texture;
 }
 
 // Generate texture (no cache hit)
 if (DEBUG.TEXTURES) console.log(`🎨 Generating Earth bump map (${size}x${size})...`);
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
 TEXTURE_CACHE.set(cacheKey, dataURL).catch(() => {});
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 if (DEBUG.TEXTURES) console.log(`⏱️ Earth bump map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
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
 if (DEBUG.TEXTURES) console.log(`✅ Earth normal map loaded from memory cache`);
 return texture;
 }
 
 // Generate texture (no cache hit)
 if (DEBUG.TEXTURES) console.log(`🎨 Generating Earth normal map (${size}x${size})...`);
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
 
 // Calculate normals from height map
 for (let y = 1; y < size - 1; y++) {
 for (let x = 1; x < size - 1; x++) {
 const idx = (y * size + x) * 4;
 const nx = x / size * 2, ny = y / size * 2;
 
 // Sample height at neighboring pixels
 const h = turbulence(nx, ny, 128) / 128;
 const hL = turbulence((x - 1) / size * 2, ny, 128) / 128;
 const hR = turbulence((x + 1) / size * 2, ny, 128) / 128;
 const hU = turbulence(nx, (y - 1) / size * 2, 128) / 128;
 const hD = turbulence(nx, (y + 1) / size * 2, 128) / 128;
 
 // Calculate gradients
 const dX = (hR - hL) * 2;
 const dY = (hD - hU) * 2;
 
 // Convert to normal map RGB (blue = up, red = x, green = y)
 data[idx] = Math.floor((dX + 1) * 127.5); // R: -1 to 1 -> 0 to 255
 data[idx + 1] = Math.floor((dY + 1) * 127.5); // G: -1 to 1 -> 0 to 255
 data[idx + 2] = 200; // B: mostly pointing up
 data[idx + 3] = 255;
 }
 }
 
 ctx.putImageData(imageData, 0, 0);
 
 // Cache the canvas in memory for instant reuse (synchronous)
 TEXTURE_CACHE.cache.set(canvasCacheKey, canvas);
 
 // Also cache as data URL in IndexedDB for persistence (async, non-blocking)
 const dataURL = canvas.toDataURL('image/png');
 TEXTURE_CACHE.set(cacheKey, dataURL).catch(() => {});
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 if (DEBUG.TEXTURES) console.log(`⏱️ Earth normal map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
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
 if (DEBUG.TEXTURES) console.log(`✅ Earth specular map loaded from memory cache`);
 return texture;
 }
 
 // Generate texture (no cache hit)
 if (DEBUG.TEXTURES) console.log(`🎨 Generating Earth specular map (${size}x${size})...`);
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
 TEXTURE_CACHE.set(cacheKey, dataURL).catch(() => {});
 
 const texture = new THREE.CanvasTexture(canvas);
 texture.needsUpdate = true;
 if (DEBUG.TEXTURES) console.log(`⏱️ Earth specular map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
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
 if (DEBUG.TEXTURES) console.log(`?? Creating material for: "${id}" (name: "${config.name}")`);

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
 console.time('⏱️ Total Earth Material Creation');
 const earthTexture = this.createEarthTextureRealFixed(earthTexSize);
 const earthBump = this.createEarthBumpMap(earthTexSize);
 const earthSpecular = this.createEarthSpecularMap(earthTexSize);
 const earthNormal = this.createEarthNormalMap(earthTexSize);
 console.timeEnd('⏱️ Total Earth Material Creation');
 
 // ULTRA realistic material with PBR (Physically Based Rendering)
 // NO emissive - planets don't emit light, they only reflect it
 const earthMaterial = new THREE.MeshStandardMaterial({
 map: earthTexture,
 
 // Normal map for surface detail (mountains, valleys)
 normalMap: earthNormal,
 normalScale: new THREE.Vector2(1.2, 1.2),
 
 // Bump map for elevation
 bumpMap: earthBump,
 bumpScale: 0.08,
 
 // Roughness map (water = smooth/shiny, land = rough)
 roughnessMap: earthSpecular,
 roughness: 0.4, // Increased for better light response
 
 // Metalness (oceans have slight reflection)
 metalness: 0.1, // Reduced - Earth is not metallic
 
 // NO emissive - let the sun's light create day/night naturally
 emissive: 0x000000,
 emissiveIntensity: 0,
 
 // Advanced rendering
 envMapIntensity: 1.2,
 transparent: false,
 side: THREE.FrontSide,
 flatShading: false,
 toneMapped: true
 });
 
 return earthMaterial;
 } // end case 'earth'

 case 'mars':
 // Mars: REAL NASA texture with rusty red surface with canyons, polar caps
 const marsTexture = this.createMarsTextureReal(2048);
 const marsBump = this.createMarsBumpMap(2048);
 const marsNormal = this.createMarsNormalMap(2048);
 
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
 const venusTexture = this.createVenusTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: venusTexture,
 color: 0xe8c468,
 roughness: 0.3,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'mercury':
 // Mercury: REAL NASA texture heavily cratered surface
 const mercuryTexture = this.createMercuryTextureReal(2048);
 const mercuryBump = this.createMercuryBumpMap(2048);
 
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
 const jupiterTexture = this.createJupiterTextureReal(2048);
 const jupiterBump = this.createJupiterBumpMap(1024);
 
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
 const saturnTexture = this.createSaturnTextureReal(2048);
 const saturnBump = this.createSaturnBumpMap(1024);
 
 return new THREE.MeshStandardMaterial({
 map: saturnTexture,
 bumpMap: saturnBump,
 bumpScale: 0.015,
 roughness: 0.55,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'uranus':
 // Uranus: REAL NASA texture with cyan atmosphere and methane
 const uranusTexture = this.createUranusTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: uranusTexture,
 roughness: 0.3,
 metalness: 0.1,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'neptune':
 // Neptune: REAL NASA texture with deep blue and Great Dark Spot
 const neptuneTexture = this.createNeptuneTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: neptuneTexture,
 roughness: 0.3,
 metalness: 0.1,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'pluto':
 // Pluto: Remote attempt (plugin) then procedural with Tombaugh Regio heart
 const plutoTexture = this.createPlutoTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: plutoTexture,
 roughness: 0.85,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'ceres':
 // Ceres: Dawn mission texture (NASA)
 const ceresTexture = this.createCeresTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: ceresTexture,
 roughness: 0.9,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'haumea':
 // Haumea: Fast-spinning elongated dwarf planet (CC BY 4.0 Solar System Scope)
 const haumeaTexture = this.createHaumeaTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: haumeaTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'makemake':
 // Makemake: Bright Kuiper Belt dwarf planet (CC BY 4.0 Solar System Scope)
 const makemakeTexture = this.createMakemakeTextureReal(2048);
 return new THREE.MeshStandardMaterial({
 map: makemakeTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'eris':
 // Eris: Massive scattered disk dwarf planet (CC BY 4.0 Solar System Scope)
 const erisTexture = this.createErisTextureReal(2048);
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
 console.warn(`?? DEFAULT MATERIAL for "${id}" - color: 0x${config.color?.toString(16)}`);
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
 planet.castShadow = false; // Planets don't cast shadows on each other (unrealistic at solar system scale)
 planet.receiveShadow = true; // But can receive shadows from moons
 planet.rotation.z = (config.tilt || 0) * Math.PI / 180;

 // Get real astronomical data for this planet - USE ENGLISH KEY, NOT TRANSLATED NAME
 const planetKey = (config.id || config.name).toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[planetKey] || {};
 
 planet.userData = {
 id: config.id || config.name.toLowerCase(), // English key for lookups
 name: config.name, // Translated display name
 type: config.dwarf ? t('typeDwarfPlanet') : t('typePlanet'),
 distance: config.distance,
 radius: config.radius,
 angle: Math.random() * Math.PI * 2,
 speed: config.speed,
 rotationSpeed: config.rotationSpeed,
 description: config.description,
 funFact: config.funFact,
 realSize: config.realSize,
 moonCount: config.moons || 0,
 moons: [],
 
 // Real astronomical data for day/night cycle
 realRotationPeriod: astroData.rotationPeriod || 24, // hours
 axialTilt: astroData.axialTilt || 0, // degrees
 retrograde: astroData.retrograde || false, // rotation direction
 rotationPhase: Math.random() * Math.PI * 2 // starting rotation angle
 };

 // Add atmosphere for Earth with clouds
 if (config.atmosphere) {
 // TEMPORARILY DISABLED FOR DEBUGGING - Testing if clouds are causing blue sphere
 if (DEBUG.enabled) console.log('?? ATMOSPHERE DISABLED FOR DEBUGGING - If Earth shows continents now, clouds were the issue!');
 
 /* DISABLED CLOUD LAYER - TESTING
 // Cloud layer with procedural patterns - VERY subtle
 const cloudGeometry = new THREE.SphereGeometry(config.radius * 1.015, 32, 32);
 const cloudTexture = this.createCloudTexture(512);
 const cloudMaterial = new THREE.MeshStandardMaterial({
 map: cloudTexture,
 transparent: true,
 opacity: 0.15, // Very subtle - was 0.25
 roughness: 0.9,
 metalness: 0.0,
 side: THREE.FrontSide,
 alphaMap: cloudTexture,
 depthWrite: false // Don't block view of surface
 });
 const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
 clouds.userData.isCloud = true;
 planet.add(clouds);
 planet.userData.clouds = clouds;
 */
 }

 // NOTE: Great Red Spot removed - now included in Jupiter's NASA texture!
 // The procedurally generated 3D spot was redundant and looked odd
 // compared to the real NASA imagery which already shows the Great Red Spot
 
 // Add rings for gas giants with realistic appearance
 if (config.rings) {
 const ringGeometry = new THREE.RingGeometry(
 config.radius * 1.3,
 config.radius * 2.2,
 128
 );
 
 // Create realistic ring material with color variation
 let ringColor = 0x888888;
 let ringOpacity = 0.3;
 
 if (config.prominentRings) {
 // Saturn's rings: use real texture if available, otherwise procedural
 ringColor = 0xd4c5b0;
 ringOpacity = 0.85;
 } else if (config.name === 'Jupiter') {
 ringColor = 0x997755;
 ringOpacity = 0.2;
 } else if (config.name === 'Uranus') {
 ringColor = 0x6688aa;
 ringOpacity = 0.3;
 } else if (config.name === 'Neptune') {
 ringColor = 0x5577aa;
 ringOpacity = 0.25;
 }
 
 // For Saturn, try to load a real ring texture with transparency
 let ringMap = null;
 if (config.prominentRings) {
 const ringLoader = new THREE.TextureLoader();
 try {
 ringMap = ringLoader.load('./textures/rings/saturn_ring_alpha.png');
 } catch(e) { ringMap = null; }
 }
 const ringMaterial = ringMap
 ? new THREE.MeshBasicMaterial({
 map: ringMap,
 alphaMap: ringMap,
 side: THREE.DoubleSide,
 transparent: true,
 opacity: 1.0,
 depthWrite: false
 })
 : new THREE.MeshStandardMaterial({
 color: ringColor,
 side: THREE.DoubleSide,
 transparent: true,
 opacity: ringOpacity,
 roughness: 0.8,
 metalness: 0.1,
 depthWrite: false
 });
 const rings = new THREE.Mesh(ringGeometry, ringMaterial);
 rings.rotation.x = Math.PI / 2;
 rings.castShadow = false; // Rings don't cast meaningful shadows at solar system scale
 rings.receiveShadow = true; // But can receive shadows from moons
 planet.add(rings);
 }

 scene.add(planet);
 this.objects.push(planet);

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
         if (DEBUG.TEXTURES) {
            console.group('?? Texture Load Verification');
            const summary = { remoteSuccess: 0, remoteFailed: 0, proceduralOnly: 0 };
            Object.entries(this.planets).forEach(([key, planet]) => {
                const ud = planet.userData;
                const name = ud.name;
                const hasRemote = !!ud.remoteTextureLoaded;
                if (ud.remoteTextureAttempted) {
                    if (hasRemote) {
                        summary.remoteSuccess++;
                        console.log(`? ${name}: remote texture loaded (${ud.remoteTextureURL}) in ${ud.remoteTextureLoadMs?.toFixed(0)}ms`);
                    } else {
                        summary.remoteFailed++;
                        console.log(`?? ${name}: remote texture attempted but fell back to procedural (${ud.remoteTextureSources?.length} sources)`);
                    }
                } else {
                    summary.proceduralOnly++;
                    console.log(`?? ${name}: procedural texture only (no remote attempt)`);
                }
            });
            // Moons
            Object.entries(this.moons).forEach(([key, moon]) => {
                const hasMap = !!moon.material?.map;
                const src = hasMap && moon.material.map.image?.src;
                if (src && typeof src === 'string' && /https?:\/\//.test(src)) {
                    console.log(`?? ${moon.userData.name}: has (possibly remote) texture map -> ${src}`);
                } else {
                    console.log(`?? ${moon.userData.name}: procedural/generated texture`);
                }
            });
            console.log(`Summary: ${summary.remoteSuccess} remote loaded, ${summary.remoteFailed} remote failed, ${summary.proceduralOnly} procedural-only planets.`);
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
 // Earth's Moon: REAL NASA LRO texture with photorealistic craters and maria
 const moonTexture = this.createMoonTextureReal(2048);
 const moonBumpMap = this.createMoonBumpMap(2048); // Procedural crater depth
 const moonNormalMap = this.createMoonNormalMap(2048); // Procedural normals
 
 moonMaterial = new THREE.MeshStandardMaterial({
 map: moonTexture,
 normalMap: moonNormalMap,
 normalScale: new THREE.Vector2(2.5, 2.5), // Realistic crater depth
 bumpMap: moonBumpMap,
 bumpScale: 0.015,
 roughness: 0.98, // Extremely rough - lunar regolith scatters light
 metalness: 0.0, // Zero metal - pure rock and dust
 // Critical for realistic moon phases - no ambient/emissive light
 emissive: 0x000000,
 emissiveIntensity: 0.0,
 // Enhanced physical properties for accurate light scattering
 envMapIntensity: 0.1, // Minimal environment reflection
 aoMapIntensity: 1.0 // Accurate shadowing in craters
 });
 } else if (moonId.includes('phobos')) {
 // Phobos: Dark reddish-gray with Stickney crater
 const phobosTexture = this.createPhobosTextureReal(1024);
 moonMaterial = new THREE.MeshStandardMaterial({
 map: phobosTexture,
 roughness: 0.95,
 metalness: 0.05
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Created Phobos texture (1024x1024)`);
 } else if (moonId.includes('deimos')) {
 // Deimos: Lighter gray, smoother surface
 const deimosTexture = this.createDeimosTextureReal(1024);
 moonMaterial = new THREE.MeshStandardMaterial({
 map: deimosTexture,
 roughness: 0.92,
 metalness: 0.05
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Created Deimos texture (1024x1024)`);
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
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Io photorealistic texture (2048)`);
 } else if (moonId.includes('europa')) {
 // Europa: NASA Galileo icy surface - smooth ice with reddish-brown cracks
 const europaTexture = this.createEuropaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: europaTexture,
 roughness: 0.25, // Very smooth ice surface
 metalness: 0.15, // Ice has slight reflectivity
 emissive: 0xccddff,
 emissiveIntensity: 0.02 // Very subtle ice glow
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Europa photorealistic texture (2048)`);
 } else if (moonId.includes('ganymede')) {
 // Ganymede: Largest moon in solar system, mix of old dark terrain and bright grooved terrain
 const ganymedeTexture = this.createGanymedeTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: ganymedeTexture,
 roughness: 0.85,
 metalness: 0.05
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Ganymede photorealistic texture (2048)`);
 } else if (moonId.includes('callisto')) {
 // Callisto: Ancient, heavily cratered surface - oldest terrain in solar system
 const callistoTexture = this.createCallistoTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: callistoTexture,
 roughness: 0.92,
 metalness: 0.02
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Callisto photorealistic texture (2048)`);
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
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Titan photorealistic texture (2048)`);
 } else if (moonId.includes('enceladus')) {
 // Enceladus: Bright icy moon with active geysers at south pole
 const enceladusTexture = this.createEnceladusTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: enceladusTexture,
 roughness: 0.2, // Extremely smooth fresh ice
 metalness: 0.2, // Reflective ice surface
 emissive: 0xeeffff,
 emissiveIntensity: 0.05 // Bright reflective ice
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Enceladus photorealistic texture (2048)`);
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
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Rhea photorealistic texture (2048)`);
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
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Triton photorealistic texture (2048)`);
 } else if (moonId.includes('titania')) {
 // Titania: Uranus's largest moon - cratered surface with canyons (NASA Voyager)
 const titaniaTexture = this.createTitaniaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: titaniaTexture,
 roughness: 0.88,
 metalness: 0.05
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Titania photorealistic texture (2048)`);
 } else if (moonId.includes('miranda')) {
 // Miranda: Uranus's smallest major moon - dramatic geological features (NASA Voyager)
 const mirandaTexture = this.createMirandaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: mirandaTexture,
 roughness: 0.9,
 metalness: 0.05
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Miranda photorealistic texture (2048)`);
 } else if (moonId.includes('charon')) {
 // Charon: Pluto's largest moon - dark reddish north pole (NASA New Horizons)
 const charonTexture = this.createCharonTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: charonTexture,
 roughness: 0.9,
 metalness: 0.02
 });
 if (DEBUG.enabled) console.log(`[Moon Texture] Loading Charon photorealistic texture (2048)`);
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
 if (DEBUG.enabled && moonMaterial.map) {
 console.log(`[Moon Material] "${config.name}" has texture map: ${moonMaterial.map.isTexture ? 'YES' : 'NO'}`);
 }

 // Get real astronomical data for this moon (use id if available, otherwise name)
 const astroDataKey = (config.id || config.name).toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[astroDataKey] || {};
 
 moon.userData = {
 name: config.name,
 type: 'Moon',
 parentPlanet: planet.userData.name,
 distance: config.distance,
 radius: config.radius,
 angle: Math.random() * Math.PI * 2,
 speed: config.speed,
 rotationSpeed: config.rotationSpeed || 0.001, // Add rotation
 description: config.description,
 
 // Real astronomical data for day/night cycle
 realRotationPeriod: astroData.rotationPeriod || 655.7, // hours (default: Moon's period)
 axialTilt: astroData.axialTilt || 0,
 retrograde: astroData.retrograde || false,
 rotationPhase: Math.random() * Math.PI * 2
 };

 // Store moon reference using id (language-independent)
 const moonStorageKey = (config.id || config.name).trim().toLowerCase();
 this.moons[moonStorageKey] = moon;
 planet.userData.moons.push(moon);
 this.objects.push(moon);
 
 // Set initial position based on angle (IMPORTANT: must be done before adding to planet)
 moon.position.x = config.distance * Math.cos(moon.userData.angle);
 moon.position.z = config.distance * Math.sin(moon.userData.angle);
 moon.position.y = 0; // Keep in planet's equatorial plane
 
 planet.add(moon);
 
 if (DEBUG.enabled) console.log(`[Moon] Created "${config.name}" for ${planet.userData.name} at distance ${config.distance}, initial position (${moon.position.x.toFixed(2)}, ${moon.position.y.toFixed(2)}, ${moon.position.z.toFixed(2)})`);
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
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.5
 });
 
 const dust = new THREE.Points(dustGeometry, dustMaterial);
 asteroidBeltGroup.add(dust);
 
 asteroidBeltGroup.userData = {
 name: 'Asteroid Belt',
 type: 'Asteroid Belt',
 description: ' The asteroid belt contains millions of rocky objects between Mars and Jupiter. Ceres, the largest object here, is a dwarf planet! Most asteroids are leftover material from the formation of the solar system 4.6 billion years ago.',
 funFact: 'Despite what movies show, asteroids are very far apart - spacecraft can pass through safely!',
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
 name: 'Kuiper Belt',
 type: 'Kuiper Belt',
 description: ' The Kuiper Belt is a region beyond Neptune filled with icy bodies and dwarf planets including Pluto! It\'s like a giant donut of frozen objects left over from the solar system\'s formation. Short-period comets come from here!',
 funFact: 'The Kuiper Belt is 20 times wider than the asteroid belt and contains billions of objects!',
 count: largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount,
 radius: 60
 };
 
 scene.add(kuiperBeltGroup);
 this.kuiperBelt = kuiperBeltGroup;
 this.objects.push(kuiperBeltGroup);
 
 if (DEBUG.enabled) console.log(` Kuiper Belt: ${largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount} objects`);
 }

 createOortCloud(scene) {
 // ===== HYPER-REALISTIC OORT CLOUD =====
 // A spherical shell of icy planetesimals surrounding the entire solar system
 // Real distances: 50,000-200,000 AU (inner Oort cloud: 2,000-20,000 AU)
 // The Oort Cloud is the source of long-period comets
 
 const oortCloudGroup = new THREE.Group();
 oortCloudGroup.name = 'oortCloud';
 
 // Scale distances appropriately
 // Realistic scale: 50,000 AU = 2,564,000 units, 200,000 AU = 10,256,000 units
 // Educational scale: Compressed to 5,000-15,000 units (far beyond Kuiper Belt at 2400)
 // Using spherical shell distribution rather than disk
 const innerRadius = this.realisticScale ? 2564000 : 5000;
 const outerRadius = this.realisticScale ? 10256000 : 15000;
 
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
 
 innerOortSizes[i] = 0.4 + Math.random() * 0.6;
 }
 
 innerOortGeometry.setAttribute('position', new THREE.BufferAttribute(innerOortPositions, 3));
 innerOortGeometry.setAttribute('color', new THREE.BufferAttribute(innerOortColors, 3));
 innerOortGeometry.setAttribute('size', new THREE.BufferAttribute(innerOortSizes, 1));
 
 const innerOortMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.5
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
 
 outerOortSizes[i] = 0.25 + Math.random() * 0.4;
 }
 
 outerOortGeometry.setAttribute('position', new THREE.BufferAttribute(outerOortPositions, 3));
 outerOortGeometry.setAttribute('color', new THREE.BufferAttribute(outerOortColors, 3));
 outerOortGeometry.setAttribute('size', new THREE.BufferAttribute(outerOortSizes, 1));
 
 const outerOortMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.35
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
 
 cometarySizes[i] = 0.5 + Math.random() * 0.8;
 }
 
 cometaryGeometry.setAttribute('position', new THREE.BufferAttribute(cometaryPositions, 3));
 cometaryGeometry.setAttribute('color', new THREE.BufferAttribute(cometaryColors, 3));
 cometaryGeometry.setAttribute('size', new THREE.BufferAttribute(cometarySizes, 1));
 
 const cometaryMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.55
 });
 
 const cometaryNuclei = new THREE.Points(cometaryGeometry, cometaryMaterial);
 oortCloudGroup.add(cometaryNuclei);
 
 oortCloudGroup.userData = {
 name: 'Oort Cloud',
 type: 'Oort Cloud',
 description: '??? The Oort Cloud is a vast spherical shell of icy objects surrounding our entire solar system! It extends from about 50,000 to 200,000 AU from the Sun. Long-period comets like Hale-Bopp originate from this distant realm. The Oort Cloud contains trillions of icy bodies and marks the gravitational boundary of our solar system!',
 funFact: 'The Oort Cloud is so far away that light from the Sun takes over 1.5 years to reach its outer edge! It would take Voyager 1 about 300 years to reach the inner edge.',
 count: innerOortCount + outerOortCount + cometaryCount,
 radius: this.realisticScale ? 10256000 : 15000
 };
 
 scene.add(oortCloudGroup);
 this.oortCloud = oortCloudGroup;
 this.objects.push(oortCloudGroup);
 
 if (DEBUG.enabled) console.log(`?? Oort Cloud: ${innerOortCount + outerOortCount + cometaryCount} objects (${this.realisticScale ? 'Realistic' : 'Educational'} scale)`);
 }

 createOrbitalPaths(scene) {
 // Planet orbital paths around the Sun
 const orbitalData = [
 { distance: 20, color: 0x6688AA }, // Mercury
 { distance: 37, color: 0x6688AA }, // Venus (educational scale)
 { distance: 51, color: 0x6688AA }, // Earth (educational scale)
 { distance: 78, color: 0x6688AA }, // Mars (educational scale)
 { distance: 266, color: 0x6688AA }, // Jupiter (educational scale)
 { distance: 490, color: 0x6688AA }, // Saturn (educational scale)
 { distance: 984, color: 0x6688AA }, // Uranus (educational scale)
 { distance: 1542, color: 0x6688AA }, // Neptune (educational scale)
 { distance: 2024, color: 0x6688AA } // Pluto (educational scale)
 ];

 orbitalData.forEach(orbit => {
 const curve = new THREE.EllipseCurve(
 0, 0,
 orbit.distance, orbit.distance,
 0, 2 * Math.PI,
 false,
 0
 );

 const points = curve.getPoints(128);
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: orbit.color,
 transparent: true,
 opacity: 0.5 // Increased from 0.2 for better visibility
 });

 const orbitLine = new THREE.Line(geometry, material);
 orbitLine.rotation.x = Math.PI / 2;
 orbitLine.visible = this.orbitsVisible; // Respect initial visibility setting
 scene.add(orbitLine);
 this.orbits.push(orbitLine);
 });
 
        // Moon orbital paths around their planets
        Object.values(this.planets).forEach(planet => {
            if (planet.userData.moons && planet.userData.moons.length > 0) {
                if (DEBUG.enabled) console.log(`Creating orbital paths for ${planet.userData.moons.length} moon(s) of ${planet.userData.name}`);
                planet.userData.moons.forEach(moon => {
                    const moonDistance = moon.userData.distance;
                    if (DEBUG.enabled) console.log(`  - Creating orbit for ${moon.userData.name} at distance ${moonDistance}`);
                    
                    const curve = new THREE.EllipseCurve(
                        0, 0,
                        moonDistance, moonDistance,
                        0, 2 * Math.PI,
                        false,
                        0
                    );

                    const points = curve.getPoints(128); // More points for smoother orbits
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({
                        color: 0xAADDFF, // Brighter cyan for better visibility
                        transparent: true,
                        opacity: 0.7, // Increased from 0.4 for better visibility
                        linewidth: 2, // Thicker lines (note: may not work on all platforms)
                        depthTest: true,
                        depthWrite: false // Prevent z-fighting
                    });

                    const orbitLine = new THREE.Line(geometry, material);
                    orbitLine.rotation.x = Math.PI / 2;
                    orbitLine.visible = this.orbitsVisible; // Respect initial visibility setting
                    orbitLine.renderOrder = 1; // Render after planets to prevent z-fighting
                    planet.add(orbitLine); // Add to planet so it moves with the planet
                    this.orbits.push(orbitLine);
 });
 }
 });
 }

 createStarfield(scene) {
 // Enhanced starfield based on real astronomical data
 // Uses Hertzsprung-Russell diagram for realistic stellar populations
 const starGeometry = new THREE.BufferGeometry();
 const starCount = 8000; // Increased for richer sky
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

 const starMaterial = new THREE.PointsMaterial({
 size: 2,
 vertexColors: true,
 transparent: true,
 opacity: 0.9,
 sizeAttenuation: false,
 blending: THREE.AdditiveBlending
 });

 this.starfield = new THREE.Points(starGeometry, starMaterial);
 this.starfield.name = 'starfield';
 this.starfield.frustumCulled = false;
 scene.add(this.starfield);

 if (DEBUG.enabled) {
 console.log(' Starfield created with 8,000 stars based on H-R diagram stellar distribution');
 }
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

 createDistantStars(scene) {
 // Create recognizable star systems and bright stars
 this.distantStars = [];
 
 const brightStars = [
 { name: 'Sirius', color: 0xFFFFFF, size: 8, distance: 8000, angle: 0, tilt: 0.5, description: ' Sirius is the brightest star in Earth\'s night sky! It\'s actually a binary system with two stars orbiting each other. Located 8.6 light-years away in the constellation Canis Major.' },
 { name: 'Betelgeuse', color: 0xFF4500, size: 12, distance: 7500, angle: Math.PI / 3, tilt: 0.8, description: ' Betelgeuse is a red supergiant star nearing the end of its life! It\'s so big that if placed at our Sun\'s position, it would extend past Mars. Will explode as a supernova someday!' },
 { name: 'Rigel', color: 0x87CEEB, size: 10, distance: 8500, angle: Math.PI * 2 / 3, tilt: -0.6, description: ' Rigel is a blue supergiant, one of the most luminous stars visible to the naked eye! It\'s 40,000 times more luminous than our Sun and located 860 light-years away.' },
 { name: 'Vega', color: 0xF0F8FF, size: 7, distance: 7800, angle: Math.PI, tilt: 0.3, description: ' Vega is one of the brightest stars in the northern sky! It was the North Star 12,000 years ago and will be again in 13,000 years due to Earth\'s axial precession.' },
 { name: 'Polaris', color: 0xFFFACD, size: 6, distance: 9000, angle: Math.PI * 1.5, tilt: 0.9, description: ' Polaris, the North Star, has guided travelers for centuries! It\'s actually a triple star system and is currently very close to true north due to Earth\'s rotation axis.' }
 ];

 brightStars.forEach(async (starData) => {
 const geometry = new THREE.SphereGeometry(starData.size, 32, 32);
 
 // Use texture if provided, otherwise use color
 let material;
 if (starData.texture) {
 const texture = await this.loadTextureWithFallback(starData.texture, `#${starData.color.toString(16).padStart(6, '0')}`);
 material = new THREE.MeshBasicMaterial({
 map: texture,
 transparent: true,
 opacity: 0.9
 });
 } else {
 material = new THREE.MeshBasicMaterial({
 color: starData.color,
 transparent: true,
 opacity: 0.9
 });
 }
 
 const star = new THREE.Mesh(geometry, material);
 const x = starData.distance * Math.cos(starData.angle);
 const z = starData.distance * Math.sin(starData.angle);
 const y = starData.distance * starData.tilt;
 star.position.set(x, y, z);
 
 // Add glow
 const glowGeo = new THREE.SphereGeometry(starData.size * 1.5, 16, 16);
 const glowMat = new THREE.MeshBasicMaterial({
 color: starData.color,
 transparent: true,
 opacity: 0.3,
 side: THREE.BackSide,
 depthWrite: false // Don't block objects behind the glow
 });
 const glow = new THREE.Mesh(glowGeo, glowMat);
 star.add(glow);
 
 star.userData = {
 name: starData.name,
 type: 'Distant Star',
 radius: starData.size,
 description: starData.description,
 distance: 'Light-years away',
 realSize: `${starData.size} solar radii`,
 funFact: starData.name === 'Betelgeuse' ? 'Betelgeuse could go supernova any day now (astronomically speaking - could be tomorrow or 100,000 years!)' : 
 starData.name === 'Sirius' ? 'Sirius is actually getting closer to us - it will be at its closest in about 60,000 years!' :
 'This star is visible to the naked eye from Earth!'
 };
 
 scene.add(star);
 this.objects.push(star);
 this.distantStars.push(star);
 });
 }

 createNebulae(scene) {
 // Create colorful nebulae with procedural generation
 this.nebulae = [];
 
 const nebulaeData = [
 { 
 name: 'Orion Nebula', 
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
 description: ' The Orion Nebula is a stellar nursery where new stars are being born! It\'s 1,344 light-years away and is visible to the naked eye as a fuzzy patch in Orion\'s sword. Contains over 3,000 stars!'
 },
 { 
 name: 'Crab Nebula', 
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
 description: ' The Crab Nebula is the remnant of a supernova explosion observed by Chinese astronomers in 1054 AD! At its center is a pulsar spinning 30 times per second!'
 },
 { 
 name: 'Ring Nebula', 
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
 description: ' The Ring Nebula is a planetary nebula - the glowing remains of a dying Sun-like star! The star at its center has blown off its outer layers, creating this beautiful ring.'
 }
 ];

 // Real image texture paths for nebulae (fall back to procedural if missing)
 const nebulaeTextures = {
 'Orion Nebula': './textures/nebulae/orion_nebula.jpg',
 'Crab Nebula':  './textures/nebulae/crab_nebula.jpg',
 'Ring Nebula':  './textures/nebulae/ring_nebula.jpg'
 };

 for (const nebData of nebulaeData) {
 const group = new THREE.Group();
 const realTexturePath = nebulaeTextures[nebData.name];
 
 if (realTexturePath) {
 // Use a flat sprite with the real Hubble image (AdditiveBlending makes black transparent)
 const spriteMap = new THREE.TextureLoader().load(
 realTexturePath,
 undefined,
 undefined,
 () => { // onError: fall back to procedural
 group.clear();
 this.createHyperrealisticNebula(group, nebData);
 }
 );
 const spriteMat = new THREE.SpriteMaterial({
 map: spriteMap,
 blending: THREE.AdditiveBlending,
 transparent: true,
 opacity: 0.85,
 depthWrite: false
 });
 const sprite = new THREE.Sprite(spriteMat);
 sprite.scale.set(nebData.size * 2, nebData.size * 2, 1);
 group.add(sprite);
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
 name: nebData.name,
 type: 'Nebula',
 radius: nebData.size,
 description: nebData.description,
 distance: 'Thousands of light-years',
 funFact: nebData.name === 'Orion Nebula' ? 'New stars are being born here right now!' :
 nebData.name === 'Crab Nebula' ? 'It\'s expanding at 1,500 km/s!' :
 'Planetary nebulae have nothing to do with planets - they just look round like planets through old telescopes!',
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
 description: ' Aries is the first sign of the zodiac! Look for the bright stars Hamal and Sheratan. In Greek mythology, Aries represents the golden ram that saved Phrixus and Helle.',
 stars: [
 { name: 'Hamal', ra: 31.8, dec: 23.5, mag: 2.0, color: 0xFFA500 }, // 0 - The head
 { name: 'Sheratan', ra: 28.7, dec: 20.8, mag: 2.6, color: 0xFFFFE0 }, // 1 - First horn
 { name: 'Mesarthim', ra: 28.4, dec: 19.3, mag: 3.9, color: 0xFFFFF0 }, // 2 - Second horn
 { name: '41 Arietis', ra: 44.8, dec: 27.7, mag: 3.6, color: 0xFFFFE0 }, // 3 - Body
 { name: 'Bharani', ra: 27.1, dec: 27.3, mag: 3.6, color: 0xFFFFF0 } // 4 - Top of head
 ],
 lines: [[4,0], [0,1], [1,2], [0,3]] // Ram's head with horns and body
 },
 {
 name: 'Taurus (The Bull)',
 description: ' Taurus contains the bright red star Aldebaran, the bull\'s eye! Also home to the Pleiades star cluster. In mythology, Zeus transformed into a bull to win Europa.',
 stars: [
 { name: 'Aldebaran', ra: 68.9, dec: 16.5, mag: 0.9, color: 0xFF6347 }, // 0 - Red giant (bull's eye)
 { name: 'Elnath', ra: 81.6, dec: 28.6, mag: 1.7, color: 0xE0FFFF }, // 1 - Northern horn tip
 { name: 'Alcyone', ra: 56.9, dec: 24.1, mag: 2.9, color: 0xE0FFFF }, // 2 - Pleiades brightest
 { name: 'Zeta Tauri', ra: 84.4, dec: 21.1, mag: 3.0, color: 0xFFFFE0 }, // 3 - Southern horn
 { name: 'Theta Tauri', ra: 67.2, dec: 15.9, mag: 3.4, color: 0xFFFFE0 }, // 4 - Hyades cluster
 { name: 'Epsilon Tauri', ra: 67.3, dec: 19.2, mag: 3.5, color: 0xFFA500 } // 5 - Hyades cluster
 ],
 lines: [[2,5], [5,0], [0,4], [0,1], [1,3]] // V-shaped face (Hyades) with horns
 },
 {
 name: 'Gemini (The Twins)',
 description: ' Gemini features the bright twins Castor and Pollux! In mythology, they were inseparable brothers, the Dioscuri, known for their bond and bravery.',
 stars: [
 { name: 'Pollux', ra: 116.3, dec: 28.0, mag: 1.2, color: 0xFFA500 },
 { name: 'Castor', ra: 113.6, dec: 31.9, mag: 1.6, color: 0xFFFFF0 },
 { name: 'Alhena', ra: 99.4, dec: 16.4, mag: 1.9, color: 0xFFFFF0 },
 { name: 'Mebsuta', ra: 100.0, dec: 25.1, mag: 3.0, color: 0xFFFFE0 }
 ],
 lines: [[1,0], [0,2], [2,3], [3,1]] // Rectangle pattern showing the twin figures
 },
 {
 name: 'Cancer (The Crab)',
 description: ' Cancer is faint but contains the beautiful Beehive Cluster (M44)! In mythology, Cancer was the crab sent by Hera to distract Hercules during his battle.',
 stars: [
 { name: 'Altarf', ra: 124.1, dec: 9.2, mag: 3.5, color: 0xFFA500 }, // 0 - Southern claw
 { name: 'Acubens', ra: 134.6, dec: 11.9, mag: 4.3, color: 0xFFFFF0 }, // 1 - Northern claw
 { name: 'Asellus Australis', ra: 130.1, dec: 18.2, mag: 3.9, color: 0xFFA500 }, // 2 - Southern donkey
 { name: 'Asellus Borealis', ra: 131.2, dec: 21.5, mag: 4.7, color: 0xFFFFF0 }, // 3 - Northern donkey
 { name: 'Iota Cancri', ra: 131.2, dec: 28.8, mag: 4.0, color: 0xFFFFE0 }, // 4 - Shell
 { name: 'Lambda Cancri', ra: 122.8, dec: 24.0, mag: 5.9, color: 0xFFFFF0 } // 5 - Body center
 ],
 lines: [[0,5], [5,1], [5,2], [2,3], [3,4], [4,5]] // Crab body with claws and legs
 },
 {
 name: 'Leo (The Lion)',
 description: ' Leo is home to the bright star Regulus! The "Sickle" asterism forms the lion\'s head. In mythology, Leo represents the Nemean Lion slain by Hercules.',
 stars: [
 { name: 'Regulus', ra: 152.1, dec: 11.9, mag: 1.4, color: 0xE0FFFF }, // 0 - Heart of the lion
 { name: 'Denebola', ra: 177.4, dec: 14.6, mag: 2.1, color: 0xFFFFF0 }, // 1 - Tail
 { name: 'Algieba', ra: 154.9, dec: 19.8, mag: 2.0, color: 0xFFA500 }, // 2 - Mane
 { name: 'Zosma', ra: 168.5, dec: 20.5, mag: 2.6, color: 0xFFFFF0 }, // 3 - Back
 { name: 'Eta Leonis', ra: 149.2, dec: 16.8, mag: 3.5, color: 0xFFFFE0 }, // 4 - Sickle
 { name: 'Chertan', ra: 168.6, dec: 14.6, mag: 3.3, color: 0xFFFFF0 } // 5 - Rear haunch
 ],
 lines: [[4,2], [2,0], [0,5], [5,1], [1,3], [3,2]] // Sickle head + triangle body
 },
 {
 name: 'Virgo (The Maiden)',
 description: ' Virgo is the second largest constellation! The bright star Spica represents wheat in the maiden\'s hand. Home to thousands of galaxies in the Virgo Cluster.',
 stars: [
 { name: 'Spica', ra: 201.3, dec: -11.2, mag: 1.0, color: 0xE0FFFF }, // 0 - Wheat/hand (brightest)
 { name: 'Vindemiatrix', ra: 195.5, dec: 10.9, mag: 2.8, color: 0xFFFFE0 }, // 1 - Grape gatherer
 { name: 'Porrima', ra: 190.4, dec: -1.4, mag: 2.7, color: 0xFFFFF0 }, // 2 - Body center
 { name: 'Zavijava', ra: 177.7, dec: 1.8, mag: 3.6, color: 0xFFFFF0 }, // 3 - Corner
 { name: 'Heze', ra: 211.7, dec: -0.7, mag: 3.4, color: 0xFFFFF0 }, // 4 - Arm
 { name: 'Minelauva', ra: 184.9, dec: 3.4, mag: 3.4, color: 0xFFFFE0 } // 5 - Robe
 ],
 lines: [[3,5], [5,1], [1,2], [2,4], [4,0]] // Y-shaped maiden figure with wheat
 },
 {
 name: 'Libra (The Scales)',
 description: ' Libra represents the scales of justice! Its brightest stars are Zubenelgenubi and Zubeneschamali, meaning "southern claw" and "northern claw" in Arabic.',
 stars: [
 { name: 'Zubeneschamali', ra: 229.3, dec: -9.4, mag: 2.6, color: 0xE0FFFF }, // 0 - Northern scale
 { name: 'Zubenelgenubi', ra: 222.7, dec: -16.0, mag: 2.8, color: 0xFFFFE0 }, // 1 - Southern scale
 { name: 'Brachium', ra: 233.9, dec: -25.3, mag: 3.3, color: 0xFFA500 }, // 2 - Scale base
 { name: 'Theta Librae', ra: 236.2, dec: -16.7, mag: 4.1, color: 0xFFFFF0 }, // 3 - Balance point
 { name: 'Upsilon Librae', ra: 243.6, dec: -28.1, mag: 3.6, color: 0xFFFFE0 } // 4 - Scale arm
 ],
 lines: [[0,1], [1,2], [0,3], [3,4]] // Scale balance with beam
 },
 {
 name: 'Scorpius (The Scorpion)',
 description: ' Scorpius represents the scorpion that killed Orion in Greek mythology! The bright red star Antares marks the scorpion\'s heart. Look for the curved tail with the stinger!',
 stars: [
 { name: 'Antares', ra: 247.4, dec: -26.4, mag: 1.0, color: 0xFF4500 }, // 0 - Red supergiant (heart)
 { name: 'Shaula', ra: 263.4, dec: -37.1, mag: 1.6, color: 0xE0FFFF }, // 1 - Stinger
 { name: 'Sargas', ra: 264.3, dec: -43.0, mag: 1.9, color: 0xFFFFE0 }, // 2 - Stinger tip
 { name: 'Dschubba', ra: 240.1, dec: -22.6, mag: 2.3, color: 0xE0FFFF }, // 3 - Head
 { name: 'Graffias', ra: 241.4, dec: -19.8, mag: 2.6, color: 0xFFFFE0 }, // 4 - Claws
 { name: 'Lesath', ra: 262.7, dec: -37.3, mag: 2.7, color: 0xE0FFFF }, // 5 - Tail curve
 { name: 'Tau Scorpii', ra: 248.9, dec: -28.2, mag: 2.8, color: 0xE0FFFF } // 6 - Body
 ],
 lines: [[4,3], [3,0], [0,6], [6,5], [5,1], [1,2]] // Head-heart-body-curved tail-stinger
 },
 {
 name: 'Sagittarius (The Archer)',
 description: ' Sagittarius aims his arrow at the heart of Scorpius! The "Teapot" asterism is easy to spot. Points toward the center of our Milky Way galaxy!',
 stars: [
 { name: 'Kaus Australis', ra: 276.0, dec: -34.4, mag: 1.8, color: 0xE0FFFF }, // 0 - Teapot base
 { name: 'Nunki', ra: 283.8, dec: -26.3, mag: 2.0, color: 0xE0FFFF }, // 1 - Spout
 { name: 'Ascella', ra: 290.7, dec: -29.9, mag: 2.6, color: 0xFFFFF0 }, // 2 - Spout tip
 { name: 'Kaus Media', ra: 274.4, dec: -29.8, mag: 2.7, color: 0xFFA500 }, // 3 - Bottom
 { name: 'Kaus Borealis', ra: 276.9, dec: -25.4, mag: 2.8, color: 0xFFA500 }, // 4 - Top
 { name: 'Phi Sagittarii', ra: 290.4, dec: -26.9, mag: 3.2, color: 0xFFFFF0 }, // 5 - Lid
 { name: 'Zeta Sagittarii', ra: 285.7, dec: -29.9, mag: 2.6, color: 0xFFFFF0 }, // 6 - Handle
 { name: 'Tau Sagittarii', ra: 286.7, dec: -27.7, mag: 3.3, color: 0xFFFFE0 }, // 7 - Handle top
 { name: 'Lambda Sagittarii', ra: 276.9, dec: -25.4, mag: 2.8, color: 0xFFA500 } // 8 - Kaus Borealis (bow top, same as 4 for closure)
 ],
 lines: [[3,0], [0,6], [6,2], [2,1], [1,5], [5,7], [7,4], [4,3]] // Complete teapot with spout, handle
 },
 {
 name: 'Capricornus (The Sea-Goat)',
 description: ' Capricornus is one of the oldest constellations! Represents a creature with the head of a goat and tail of a fish. Associated with the god Pan in Greek mythology.',
 stars: [
 { name: 'Deneb Algedi', ra: 326.8, dec: -16.1, mag: 2.9, color: 0xFFFFF0 }, // 0 - Tail tip
 { name: 'Dabih', ra: 305.3, dec: -14.8, mag: 3.1, color: 0xFFA500 }, // 1 - Goat head
 { name: 'Nashira', ra: 325.0, dec: -16.7, mag: 3.7, color: 0xFFFFF0 }, // 2 - Body center
 { name: 'Algedi', ra: 304.5, dec: -12.5, mag: 3.6, color: 0xFFFFE0 }, // 3 - Horn
 { name: 'Iota Capricorni', ra: 328.5, dec: -16.8, mag: 4.3, color: 0xE0FFFF }, // 4 - Fish tail
 { name: 'Theta Capricorni', ra: 326.0, dec: -17.2, mag: 4.1, color: 0xFFFFE0 } // 5 - Tail curve
 ],
 lines: [[1,3], [1,2], [2,5], [5,4], [4,0], [5,0]] // Sea-goat with fish tail
 },
 {
 name: 'Aquarius (The Water-Bearer)',
 description: ' Aquarius represents the water-bearer pouring from his urn! Home to several famous deep-sky objects including the Helix Nebula. One of the oldest named constellations.',
 stars: [
 { name: 'Sadalsuud', ra: 322.9, dec: -5.6, mag: 2.9, color: 0xFFFFE0 }, // 0 - Lucky star of luckiest
 { name: 'Sadalmelik', ra: 331.4, dec: -0.3, mag: 3.0, color: 0xFFFFE0 }, // 1 - Lucky star of the king
 { name: 'Skat', ra: 346.2, dec: -15.8, mag: 3.3, color: 0xFFFFF0 }, // 2 - Shin/leg
 { name: 'Albali', ra: 315.9, dec: -9.5, mag: 3.8, color: 0xFFFFF0 }, // 3 - The swallower
 { name: 'Lambda Aquarii', ra: 352.2, dec: -7.6, mag: 3.7, color: 0xFFFFE0 }, // 4 - Water jar
 { name: 'Phi Aquarii', ra: 353.7, dec: -6.0, mag: 4.2, color: 0xFFFFF0 } // 5 - Water stream
 ],
 lines: [[3,0], [0,1], [1,4], [4,5], [5,2]] // Water bearer with flowing water
 },
 {
 name: 'Pisces (The Fish)',
 description: ' Pisces shows two fish tied together! Represents Aphrodite and Eros who transformed into fish to escape the monster Typhon. Contains the vernal equinox point!',
 stars: [
 { name: 'Alpherg', ra: 2.0, dec: 2.8, mag: 3.8, color: 0xFFFFE0 }, // 0 - Eastern fish
 { name: 'Alrescha', ra: 8.0, dec: 2.8, mag: 3.8, color: 0xFFFFF0 }, // 1 - Knot (tie point)
 { name: 'Fumalsamakah', ra: 351.0, dec: 6.9, mag: 4.5, color: 0xFFFFF0 }, // 2 - Western fish
 { name: 'Delta Piscium', ra: 357.5, dec: 7.6, mag: 4.4, color: 0xFFFFF0 }, // 3 - Fish body
 { name: 'Eta Piscium', ra: 21.5, dec: 15.3, mag: 3.6, color: 0xFFA500 }, // 4 - Eastern fish tail
 { name: 'Gamma Piscium', ra: 352.5, dec: 3.2, mag: 3.7, color: 0xFFFFE0 }, // 5 - Western fish body
 { name: 'Kappa Piscium', ra: 347.5, dec: 1.2, mag: 4.9, color: 0xFFFFF0 } // 6 - Western fish tail
 ],
 lines: [[4,0], [0,1], [1,5], [5,2], [2,6], [5,3]] // Two fish with connecting cord
 },
 
 // === FAMOUS NON-ZODIAC CONSTELLATIONS ===
 {
 name: 'Orion (The Hunter)',
 description: '? Orion is one of the most recognizable constellations! Look for the three stars in a row forming Orion\'s Belt. The bright red star Betelgeuse marks his shoulder, and blue Rigel marks his foot.',
 stars: [
 { name: 'Betelgeuse', ra: 88.8, dec: 7.4, mag: 0.5, color: 0xFF4500 }, // Red supergiant
 { name: 'Rigel', ra: 78.6, dec: -8.2, mag: 0.1, color: 0x87CEEB }, // Blue supergiant
 { name: 'Bellatrix', ra: 81.3, dec: 6.3, mag: 1.6, color: 0xB0C4DE },
 { name: 'Alnitak', ra: 85.2, dec: -1.9, mag: 1.8, color: 0xE0FFFF }, // Belt star 1
 { name: 'Alnilam', ra: 84.1, dec: -1.2, mag: 1.7, color: 0xE0FFFF }, // Belt star 2
 { name: 'Mintaka', ra: 83.0, dec: -0.3, mag: 2.2, color: 0xE0FFFF }, // Belt star 3
 { name: 'Saiph', ra: 86.9, dec: -9.7, mag: 2.1, color: 0xB0E0E6 }
 ],
 lines: [[2,0], [0,4], [4,1], [1,6], [6,5], [5,4], [4,3]] // Hourglass/bowtie shape with belt
 },
 {
 name: 'Big Dipper (Ursa Major)',
 description: ' The Big Dipper is actually part of Ursa Major (Great Bear)! The two stars at the end of the "cup" point to Polaris, the North Star. Used for navigation for thousands of years!',
 stars: [
 { name: 'Dubhe', ra: 165.9, dec: 61.8, mag: 1.8, color: 0xFFFFE0 },
 { name: 'Merak', ra: 165.5, dec: 56.4, mag: 2.4, color: 0xFFFFF0 },
 { name: 'Phecda', ra: 178.5, dec: 53.7, mag: 2.4, color: 0xFFFFF0 },
 { name: 'Megrez', ra: 183.9, dec: 57.0, mag: 3.3, color: 0xFFFFF0 },
 { name: 'Alioth', ra: 193.5, dec: 55.96, mag: 1.8, color: 0xFFFFE0 },
 { name: 'Mizar', ra: 200.9, dec: 54.9, mag: 2.2, color: 0xFFFFF0 },
 { name: 'Alkaid', ra: 206.9, dec: 49.3, mag: 1.9, color: 0xFFFFE0 }
 ],
 lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6]] // Dipper shape
 },
 {
 name: 'Little Dipper (Ursa Minor)',
 description: ' The Little Dipper contains Polaris, the North Star! Polaris marks the end of the Little Dipper\'s handle and stays nearly fixed in the northern sky. Essential for celestial navigation!',
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
 description: ' The Southern Cross is the smallest constellation but one of the most famous in the Southern Hemisphere! Used for navigation, it points towards the South Celestial Pole.',
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
 description: ' Cassiopeia looks like a W or M depending on the season! In Greek mythology, Cassiopeia was a vain queen. The constellation is circumpolar in northern latitudes, meaning it never sets.',
 stars: [
 { name: 'Schedar', ra: 10.1, dec: 56.5, mag: 2.2, color: 0xFFA500 },
 { name: 'Caph', ra: 2.3, dec: 59.1, mag: 2.3, color: 0xFFFFF0 },
 { name: 'Gamma Cas', ra: 14.2, dec: 60.7, mag: 2.5, color: 0xE0FFFF },
 { name: 'Ruchbah', ra: 21.5, dec: 60.2, mag: 2.7, color: 0xFFFFF0 },
 { name: 'Segin', ra: 25.6, dec: 63.7, mag: 3.4, color: 0xFFFFE0 }
 ],
 lines: [[1,0], [0,2], [2,3], [3,4]] // W/M shape (Caph-Schedar-Gamma-Ruchbah-Segin)
 },
 {
 name: 'Cygnus (The Swan)',
 description: ' Cygnus the Swan flies along the Milky Way! Also called the Northern Cross. In mythology, Zeus disguised himself as a swan. Home to many deep-sky objects!',
 stars: [
 { name: 'Deneb', ra: 310.4, dec: 45.3, mag: 1.3, color: 0xE0FFFF }, // 0 - Tail (supergiant)
 { name: 'Albireo', ra: 292.7, dec: 27.9, mag: 3.1, color: 0xFFA500 }, // 1 - Head (beautiful double star)
 { name: 'Sadr', ra: 305.6, dec: 40.3, mag: 2.2, color: 0xFFFFE0 }, // 2 - Center/breast
 { name: 'Gienah', ra: 312.3, dec: 33.9, mag: 2.5, color: 0xFFFFF0 }, // 3 - Right wing
 { name: 'Delta Cygni', ra: 296.2, dec: 45.1, mag: 2.9, color: 0xE0FFFF }, // 4 - Left wing
 { name: 'Epsilon Cygni', ra: 310.9, dec: 33.9, mag: 2.5, color: 0xFFA500 } // 5 - Wing tip
 ],
 lines: [[0,2], [2,1], [2,4], [2,3], [3,5]] // Cross/Swan with extended wing
 },
 {
 name: 'Lyra (The Lyre)',
 description: ' Lyra represents the lyre of Orpheus! Contains Vega, the 5th brightest star in the night sky. Also home to the Ring Nebula, a famous planetary nebula!',
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
 description: ' Andromeda was the princess chained to a rock and rescued by Perseus! This constellation contains the Andromeda Galaxy (M31), our nearest large galaxy neighbor!',
 stars: [
 { name: 'Alpheratz', ra: 2.1, dec: 29.1, mag: 2.1, color: 0xE0FFFF }, // 0 - Head (shared with Pegasus)
 { name: 'Mirach', ra: 17.4, dec: 35.6, mag: 2.1, color: 0xFF6347 }, // 1 - Hip (red giant)
 { name: 'Almach', ra: 30.9, dec: 42.3, mag: 2.2, color: 0xFFA500 }, // 2 - Foot
 { name: 'Delta Andromedae', ra: 8.5, dec: 31.1, mag: 3.3, color: 0xFFFFF0 }, // 3 - Shoulder
 { name: 'Mu Andromedae', ra: 6.5, dec: 38.5, mag: 3.9, color: 0xFFFFF0 }, // 4 - Arm
 { name: 'Nu Andromedae', ra: 12.2, dec: 41.1, mag: 4.5, color: 0xFFFFE0 } // 5 - Chain
 ],
 lines: [[0,3], [3,4], [4,5], [5,1], [1,2]] // Princess chained figure
 },
 {
 name: 'Perseus (The Hero)',
 description: ' Perseus the hero who slayed Medusa! Home to the bright star Mirfak and the famous variable star Algol ("Demon Star"). Contains the Double Cluster!',
 stars: [
 { name: 'Mirfak', ra: 51.1, dec: 49.9, mag: 1.8, color: 0xFFFFE0 }, // 0 - Shoulder
 { name: 'Algol', ra: 47.0, dec: 40.9, mag: 2.1, color: 0xE0FFFF }, // 1 - Medusa's head
 { name: 'Atik', ra: 54.1, dec: 32.3, mag: 2.9, color: 0xE0FFFF }, // 2 - Knee
 { name: 'Gamma Persei', ra: 48.0, dec: 53.5, mag: 2.9, color: 0xFFFFE0 }, // 3 - Head
 { name: 'Delta Persei', ra: 57.3, dec: 47.8, mag: 3.0, color: 0xE0FFFF }, // 4 - Arm
 { name: 'Epsilon Persei', ra: 59.0, dec: 40.0, mag: 2.9, color: 0xE0FFFF } // 5 - Sword tip
 ],
 lines: [[3,0], [0,4], [4,5], [5,2], [0,1]] // Hero with sword and Medusa's head
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
 group.add(starMesh);
 starMeshes.push(starMesh);
 
 // Add glow effect using factory (with geometry caching)
 const starSize = CONFIG.CONSTELLATION.STAR_BASE_SIZE * Math.pow(2.5, -star.mag);
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
 name: constData.name,
 type: 'Constellation',
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
 
 if (DEBUG.enabled) console.log(`✓ Created ${this.constellations.length} constellations with star patterns!`);
 }
 
 highlightConstellation(focusedConstellation) {
 // Highlight the focused constellation and dim all others
 if (!this.constellations) return;
 
 this.constellations.forEach(constellation => {
 const isFocused = constellation === focusedConstellation;
 
 // Traverse all children (stars, lines, etc.)
 constellation.traverse(child => {
 if (child.material) {
 // Store original opacity if not already stored
 if (!child.material.userData?.originalOpacity) {
 child.material.userData = child.material.userData || {};
 child.material.userData.originalOpacity = child.material.opacity;
 }
 
 if (isFocused) {
 // Brighten focused constellation - boost opacity beyond original for extra brightness
 const originalOpacity = child.material.userData.originalOpacity;
 child.material.opacity = Math.min(originalOpacity * 1.3, 1.0); // 30% brighter
 child.visible = true;
 } else {
 // Dim other constellations significantly
 child.material.opacity = 0.05; // Very dim
 }
 }
 });
 });
 }
 
 resetConstellationHighlight() {
 // Reset all constellations to normal visibility
 if (!this.constellations) return;
 
 this.constellations.forEach(constellation => {
 constellation.traverse(child => {
 if (child.material && child.material.userData?.originalOpacity) {
 child.material.opacity = child.material.userData.originalOpacity;
 }
 });
 });
 }

 createGalaxies(scene) {
 // Create distant galaxies with procedural generation
 this.galaxies = [];
 
 const galaxiesData = [
 { 
 name: 'Andromeda Galaxy', 
 ra: 10.7,    // 0h 42m 44s - In Andromeda constellation, near Mirach
 dec: 41.3,   // +41° 16' 09" - Northern hemisphere autumn sky
 size: 600, 
 type: 'spiral', 
 angularSize: 178, // 178 arcminutes - appears 6x larger than full moon!
 description: ' The Andromeda Galaxy is our nearest large galactic neighbor, 2.5 million light-years away! It contains 1 trillion stars and is on a collision course with the Milky Way (don\'t worry, collision in 4.5 billion years).'
 },
 { 
 name: 'Whirlpool Galaxy', 
 ra: 202.5,   // 13h 29m 53s - In Canes Venatici, below Big Dipper's handle
 dec: 47.2,   // +47° 11' 43" - Northern spring sky
 size: 400, 
 type: 'spiral',
 angularSize: 11, // 11 arcminutes
 description: ' The Whirlpool Galaxy (M51) is famous for its beautiful spiral arms! It\'s interacting with a smaller companion galaxy, creating stunning tidal forces and new star formation.'
 },
 { 
 name: 'Sombrero Galaxy', 
 ra: 189.5,   // 12h 39m 59s - In Virgo constellation, western edge
 dec: -11.6,  // -11° 37' 23" - Southern declination, visible from both hemispheres
 size: 350, 
 type: 'elliptical',
 angularSize: 9, // 9 arcminutes
 description: ' The Sombrero Galaxy looks like a Mexican hat! It has a bright nucleus, an unusually large central bulge, and a prominent dust lane. Contains 2,000 globular clusters!'
 }
 ];

 // Real image texture paths for galaxies
 const galaxyTextures = {
 'Andromeda Galaxy':  './textures/galaxies/andromeda_galaxy.jpg',
 'Whirlpool Galaxy':  './textures/galaxies/whirlpool_galaxy.jpg',
 'Sombrero Galaxy':   './textures/galaxies/sombrero_galaxy.jpg'
 };

 for (const galData of galaxiesData) {
 const group = new THREE.Group();
 const realTexturePath = galaxyTextures[galData.name];

 if (realTexturePath) {
 // Flat sprite with real Hubble image — AdditiveBlending makes black transparent
 const gMap = new THREE.TextureLoader().load(
 realTexturePath,
 undefined,
 undefined,
 () => { // onError: fall back to procedural
 group.clear();
 this._buildProceduralGalaxy(group, galData);
 }
 );
 const gMat = new THREE.SpriteMaterial({
 map: gMap,
 blending: THREE.AdditiveBlending,
 transparent: true,
 opacity: 0.9,
 depthWrite: false
 });
 const sprite = new THREE.Sprite(gMat);
 sprite.scale.set(galData.size * 2.5, galData.size * 2.5, 1);
 group.add(sprite);
 } else {
 this._buildProceduralGalaxy(group, galData);
 }

 // Convert RA/Dec to 3D Cartesian coordinates (same as nebulae and constellations)
 // Galaxies should be positioned even farther out than nebulae
 const galaxyDistance = CONFIG.CONSTELLATION.DISTANCE * 2.0; // 2x constellation distance, 1.33x nebula distance
 const position = CoordinateUtils.sphericalToCartesian(
 galData.ra,
 galData.dec,
 galaxyDistance
 );
 
 group.position.set(position.x, position.y, position.z);
 group.rotation.x = Math.random() * Math.PI * 0.3;
 group.rotation.y = Math.random() * Math.PI * 2;
 
 group.userData = {
 name: galData.name,
 type: 'Galaxy',
 radius: galData.size,
 description: galData.description,
 distance: 'Millions of light-years',
 realSize: '100,000+ light-years across',
 angularSize: galData.angularSize, // Angular size in arcminutes
 ra: galData.ra,
 dec: galData.dec,
 funFact: galData.name === 'Andromeda Galaxy' ? 'Andromeda is approaching us at 110 km/s!' :
 galData.name === 'Whirlpool Galaxy' ? 'You can see this galaxy with a good pair of binoculars!' :
 'Despite billions of stars, galaxies are mostly empty space!',
 basePosition: { x: position.x, y: position.y, z: position.z }
 };
 
 scene.add(group);
 this.objects.push(group);
 this.galaxies.push(group);
 }
 }

 // Procedural galaxy fallback (spiral or elliptical point cloud)
 _buildProceduralGalaxy(group, galData) {
 if (galData.type === 'spiral') {
 const spiralCount = 8000;
 const geometry = new THREE.BufferGeometry();
 const positions = new Float32Array(spiralCount * 3);
 const colors = new Float32Array(spiralCount * 3);
 for (let i = 0; i < spiralCount; i++) {
 const angle = (i / spiralCount) * Math.PI * 6;
 const distance = (i / spiralCount) * galData.size;
 positions[i * 3]     = distance * Math.cos(angle) + (Math.random() - 0.5) * 30;
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
 name: ' Alpha Centauri A',
 type: 'Star',
 description: ' Alpha Centauri A is very similar to our Sun! It\'s part of a triple star system that is our closest stellar neighbor at 4.37 light-years away. With its companion Alpha Centauri B, they orbit each other every 80 years.',
 distance: '4.37 light-years',
 realSize: '1.22 times the Sun\'s diameter',
 funFact: 'Alpha Centauri is visible from the Southern Hemisphere and is the third brightest star in our night sky!'
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
 name: ' Proxima Centauri',
 type: 'Red Dwarf Star',
 description: ' Proxima Centauri is a small red dwarf star and the closest star to our Solar System at just 4.24 light-years! It\'s much cooler and dimmer than our Sun, but it has at least two planets, including potentially habitable Proxima Centauri b.',
 distance: '4.24 light-years (40 trillion km!)',
 realSize: '0.14 times the Sun\'s diameter',
 funFact: 'Despite being our closest star, Proxima is too dim to see with the naked eye!'
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
 name: ' Kepler-452 (Sun-like Star)',
 type: 'G-type Star',
 description: ' Kepler-452 is a Sun-like star that hosts Earth\'s "cousin" planet Kepler-452b! It\'s 1.5 billion years older than our Sun and 20% brighter. The star is 1,400 light-years away in the constellation Cygnus.',
 distance: '1,400 light-years',
 realSize: '1.11 times the Sun\'s diameter',
 funFact: 'Kepler-452 is 6 billion years old - it shows us what our Sun might be like in 1.5 billion years!'
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
 name: ' TRAPPIST-1 (Red Dwarf)',
 type: 'Ultra-cool Red Dwarf',
 description: ' TRAPPIST-1 is an ultra-cool red dwarf with 7 Earth-sized planets! Three of them are in the habitable zone. The entire system is so compact that all 7 planets orbit closer to their star than Mercury does to our Sun.',
 distance: '40 light-years',
 realSize: '0.12 times the Sun\'s diameter (barely larger than Jupiter!)',
 funFact: 'TRAPPIST-1 is named after the telescope that discovered it - The TRAnsiting Planets and PlanetesImals Small Telescope!'
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
 name: ' Kepler-186 (Red Dwarf)',
 type: 'M-type Red Dwarf',
 description: ' Kepler-186 is a red dwarf star with 5 known planets! Kepler-186f was the first Earth-sized planet discovered in the habitable zone of another star. The star is cooler than our Sun, giving it an orange-red glow.',
 distance: '500 light-years',
 realSize: '0.54 times the Sun\'s diameter',
 funFact: 'Plants on Kepler-186f would likely photosynthesize using infrared light and appear dark red or black!'
 };
 
 scene.add(kepler186);
 this.objects.push(kepler186);
 this.nearbyStars.push(kepler186);
 
 if (DEBUG.enabled) console.log(` Created ${this.nearbyStars.length} nearby stars and exoplanet host stars`);
 }

 createExoplanets(scene) {
 // Create famous discovered exoplanets
 this.exoplanets = [];
 
 const exoplanetsData = [
 {
 name: ' Proxima Centauri b',
 position: { x: 8520, y: 800, z: -6200 },
 radius: 1.1,
 color: 0x4A7BA7,
 description: ' Proxima Centauri b is the closest known exoplanet to Earth! It orbits in the habitable zone of Proxima Centauri, meaning liquid water could exist on its surface. Discovered in 2016, it\'s only 4.24 light-years away.',
 distance: '4.24 light-years',
 realSize: '~1.17 Earth masses',
 funFact: 'With current technology, it would take 6,300 years to reach Proxima b!'
 },
 {
 name: ' Kepler-452b',
 position: { x: -9000, y: 2500, z: 8500 },
 radius: 1.6,
 color: 0x5D8AA8,
 description: ' Kepler-452b is called "Earth\'s cousin"! It\'s about 60% larger than Earth and orbits a Sun-like star in the habitable zone. Its year is 385 days long. Could it have life? We don\'t know yet!',
 distance: '1,400 light-years',
 realSize: '1.6 times Earth\'s radius',
 funFact: 'Kepler-452b is 6 billion years old - 1.5 billion years older than Earth!'
 },
 {
 name: ' TRAPPIST-1e',
 position: { x: 7000, y: -3000, z: -9000 },
 radius: 0.92,
 color: 0x3A7CA5,
 description: ' TRAPPIST-1e is part of an amazing system with 7 Earth-sized planets! It orbits a cool red dwarf star and is in the habitable zone. The system is so compact that all 7 planets would fit inside Mercury\'s orbit!',
 distance: '40 light-years',
 realSize: '0.92 times Earth\'s radius',
 funFact: 'From TRAPPIST-1e, you could see the other planets as large as our Moon in the sky!'
 },
 {
 name: ' Kepler-186f',
 position: { x: -8000, y: -2000, z: 9500 },
 radius: 1.1,
 color: 0x2E5F6F,
 description: ' Kepler-186f was the first Earth-sized planet discovered in another star\'s habitable zone! It receives about one-third the light Earth gets from the Sun, so plants there (if any!) might appear black or red instead of green.',
 distance: '500 light-years',
 realSize: '1.1 times Earth\'s radius',
 funFact: 'Kepler-186f orbits a red dwarf, so its sky would glow orange-red!'
 }
 ];
 
 exoplanetsData.forEach(exoData => {
 const geometry = new THREE.SphereGeometry(exoData.radius, 32, 32);
 
 // Create Earth-like texture for exoplanets
 const canvas = document.createElement('canvas');
 canvas.width = 512;
 canvas.height = 256;
 const ctx = canvas.getContext('2d');
 
 // Base ocean color
 ctx.fillStyle = `rgb(${(exoData.color >> 16) & 255}, ${(exoData.color >> 8) & 255}, ${exoData.color & 255})`;
 ctx.fillRect(0, 0, 512, 256);
 
 // Add some land masses
 ctx.fillStyle = 'rgba(100, 140, 80, 0.7)';
 for (let i = 0; i < 8; i++) {
 ctx.beginPath();
 ctx.arc(Math.random() * 512, Math.random() * 256, 20 + Math.random() * 40, 0, Math.PI * 2);
 ctx.fill();
 }
 
 // Add clouds
 ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
 for (let i = 0; i < 15; i++) {
 ctx.beginPath();
 ctx.arc(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 20, 0, Math.PI * 2);
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
 planet.position.set(exoData.position.x, exoData.position.y, exoData.position.z);
 
 // Add subtle glow
 const glowGeo = new THREE.SphereGeometry(exoData.radius * 1.2, 32, 32);
 const glowMat = new THREE.MeshBasicMaterial({
 color: 0x88AAFF,
 transparent: true,
 opacity: 0.15,
 blending: THREE.AdditiveBlending
 });
 const glow = new THREE.Mesh(glowGeo, glowMat);
 planet.add(glow);
 
 planet.userData = {
 name: exoData.name,
 type: 'Exoplanet',
 description: exoData.description,
 distance: exoData.distance,
 realSize: exoData.realSize,
 funFact: exoData.funFact
 };
 
 scene.add(planet);
 this.objects.push(planet);
 this.exoplanets.push(planet);
 });
 
 if (DEBUG.enabled) console.log(` Created ${this.exoplanets.length} famous exoplanets!`);
 }

 createComets(scene) {
 // Create comets with REALISTIC sizes (typically 1-60 km)
 // All comets rendered with hyperrealistic nucleus, coma, and dual tails
 this.comets = [];
 
 const cometsData = [
 // Halley: 15 km nucleus, 35 AU orbit
 { name: 'Halley\'s Comet', distance: 1795, eccentricity: 0.967, speed: 0.001, size: 0.002, description: t('descHalley') },
 // Hale-Bopp: 60 km nucleus (massive!), ~250 AU orbit
 { name: 'Comet Hale-Bopp', distance: 12820, eccentricity: 0.995, speed: 0.0008, size: 0.005, description: t('descHaleBopp') },
 // Hyakutake: 4 km nucleus, spectacular in 1996
 { name: 'Comet Hyakutake', distance: 1540, eccentricity: 0.999, speed: 0.0011, size: 0.0015, description: 'Comet Hyakutake passed extremely close to Earth in 1996, becoming one of the brightest comets in decades with a tail stretching across half the sky!' },
 // Lovejoy: ~500m nucleus, Kreutz sungrazer
 { name: 'Comet Lovejoy', distance: 770, eccentricity: 0.998, speed: 0.0015, size: 0.0008, description: 'Comet Lovejoy (C/2011 W3) survived a close pass through the Sun\'s corona! It\'s part of the Kreutz sungrazers - fragments of a giant comet that broke up centuries ago.' },
 // Encke: 4.8 km nucleus, shortest period (3.3 years)
 { name: 'Comet Encke', distance: 385, eccentricity: 0.847, speed: 0.002, size: 0.0018, description: 'Comet Encke has the shortest orbital period of any known comet - only 3.3 years! It\'s named after Johann Franz Encke who calculated its orbit in 1819.' },
 // Swift-Tuttle: 26 km nucleus, source of Perseid meteor shower
 { name: 'Comet Swift-Tuttle', distance: 2570, eccentricity: 0.963, speed: 0.0009, size: 0.003, description: 'Comet Swift-Tuttle is the parent body of the spectacular Perseid meteor shower! With a 26 km nucleus, it\'s the largest object that regularly passes near Earth.' }
 ];

 cometsData.forEach((cometData, index) => {
 const cometGroup = new THREE.Group();
 
 // ===== HYPER-REALISTIC NUCLEUS =====
 // Irregular, potato-shaped icy-rocky core with surface details
 const nucleusGeometry = new THREE.IcosahedronGeometry(cometData.size, 2);
 
 // Deform vertices for irregular shape
 const positions = nucleusGeometry.attributes.position.array;
 for (let i = 0; i < positions.length; i += 3) {
 const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
 const distortion = 0.15 + Math.random() * 0.2; // Irregular shape
 vertex.multiplyScalar(distortion + 1.0);
 positions[i] = vertex.x;
 positions[i + 1] = vertex.y;
 positions[i + 2] = vertex.z;
 }
 nucleusGeometry.attributes.position.needsUpdate = true;
 nucleusGeometry.computeVertexNormals();
 
 const nucleusMaterial = new THREE.MeshStandardMaterial({
 color: 0x3a3a3a, // Dark gray-black (dirty ice + rock)
 roughness: 0.95,
 metalness: 0.05,
 emissive: 0x1a1a1a,
 emissiveIntensity: 0.1
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
 
 // HYPERREALISTIC COMA - Multi-layered glowing atmosphere
 const comaLayers = 6; // More layers for depth
 for (let layer = 0; layer < comaLayers; layer++) {
 const layerSize = cometData.size * (3 + layer * 2); // Larger, more dramatic coma
 const layerOpacity = 0.3 * (1 - layer / comaLayers) * (0.8 + Math.random() * 0.4);
 const comaGeo = new THREE.SphereGeometry(layerSize, 32, 32);
 
 // Color gradient: bright cyan-white ? blue ? cyan
 let comaColor;
 if (layer === 0) comaColor = 0xf0ffff; // Brightest white-cyan core
 else if (layer === 1) comaColor = 0xccf0ff;
 else if (layer === 2) comaColor = 0xaaddff;
 else comaColor = 0x88bbee; // Outer layers more blue
 
 const comaMat = new THREE.MeshBasicMaterial({
 color: comaColor,
 transparent: true,
 opacity: layerOpacity,
 side: THREE.BackSide,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 const coma = new THREE.Mesh(comaGeo, comaMat);
 cometGroup.add(coma);
 }
 
 // Inner bright core (nucleus glow)
 const nucleusGlowGeo = new THREE.SphereGeometry(cometData.size * 1.5, 32, 32);
 const nucleusGlowMat = new THREE.MeshBasicMaterial({
 color: 0xffffff,
 transparent: true,
 opacity: 0.6,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 const nucleusGlow = new THREE.Mesh(nucleusGlowGeo, nucleusGlowMat);
 cometGroup.add(nucleusGlow);
 
 // ===== SPECTACULAR DUST TAIL =====
 // Curved, broad, golden-yellow with turbulent structure
 const dustParticles = 800; // More particles for density
 const dustTailGeometry = new THREE.BufferGeometry();
 const dustTailPositions = new Float32Array(dustParticles * 3);
 const dustTailColors = new Float32Array(dustParticles * 3);
 const dustTailSizes = new Float32Array(dustParticles);
 
 for (let i = 0; i < dustParticles; i++) {
 const t = i / dustParticles;
 const spread = t * 20; // Wider, more dramatic spread
 const curve = t * t * 25; // Longer, more curved tail
 const turbulence = Math.sin(i * 0.5) * spread * 0.15; // Add turbulence
 
 dustTailPositions[i * 3] = curve + turbulence + (Math.random() - 0.5) * spread * 0.3;
 dustTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
 dustTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8;
 
 // Size decreases with distance, with variation
 dustTailSizes[i] = (4 + Math.random() * 2) * (1 - t * 0.8);
 
 // Gradient: bright white-yellow → orange-red → dark
 const brightness = 1 - t * 0.7;
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
 opacity: 0.75,
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 
 const dustTail = new THREE.Points(dustTailGeometry, dustTailMaterial);
 cometGroup.add(dustTail);
 
 // ===== BRILLIANT ION TAIL =====
 // Straight, narrow, electric blue plasma stream with wisps
 const ionParticles = 600; // More particles for brilliant effect
 const ionTailGeometry = new THREE.BufferGeometry();
 const ionTailPositions = new Float32Array(ionParticles * 3);
 const ionTailColors = new Float32Array(ionParticles * 3);
 const ionTailSizes = new Float32Array(ionParticles);
 
 for (let i = 0; i < ionParticles; i++) {
 const t = i / ionParticles;
 const spread = t * 6; // Narrower than dust tail but with wisps
 const length = t * 35; // Longer, more dramatic ion tail
 const wisp = Math.sin(i * 0.3) * spread * 0.2; // Wispy structure
 
 ionTailPositions[i * 3] = length + wisp + (Math.random() - 0.5) * 0.3;
 ionTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
 ionTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8;
 
 // Size variation with brilliant streaks
 const ionBrightness = Math.pow(1 - t, 0.4) * (0.8 + Math.random() * 0.4);
 ionTailSizes[i] = (3 + Math.random() * 3) * ionBrightness;
 
 // Electric blue plasma gradient - brilliant cyan-blue
 const intensity = (1 - t * 0.5) * ionBrightness;
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
 opacity: 0.85, // Higher opacity for brilliant plasma effect
 blending: THREE.AdditiveBlending,
 depthWrite: false
 });
 
 const ionTail = new THREE.Points(ionTailGeometry, ionTailMaterial);
 cometGroup.add(ionTail);
 
 cometGroup.userData = {
 name: cometData.name,
 type: 'Comet',
 radius: cometData.size,
 actualSize: cometData.size, // Store actual size for zoom calculations
 distance: cometData.distance,
 angle: Math.random() * Math.PI * 2,
 speed: cometData.speed,
 eccentricity: cometData.eccentricity,
 description: cometData.description,
 realSize: '1-60 km nucleus',
 funFact: 'Comets have two tails: a curved dust tail (yellowish) and a straight ion tail (blue) - both always point away from the Sun!',
 dustTail: dustTail,
 ionTail: ionTail,
 isComet: true // Flag for special zoom handling
 };
 
 cometGroup.visible = true; // Ensure comet is visible
 scene.add(cometGroup);
 this.objects.push(cometGroup);
 this.comets.push(cometGroup);
 
 if (DEBUG.enabled) console.log(` ${cometData.name} created at distance ${cometData.distance}`);
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
        if (DEBUG.enabled) console.log('?? Creating hyperrealistic James Webb Space Telescope');
        const jwst = new THREE.Group();
        // Scale based on the spacecraft's display size
        const scale = satData.size || 0.04;
        
        // Use spacecraft material presets
        const goldMat = MaterialFactory.createSpacecraftMaterial('goldBright');
        const shieldMat = MaterialFactory.createSpacecraftMaterial('shield');
        const structMat = MaterialFactory.createSpacecraftMaterial('structure');
        
        const hexRadius = scale * 0.66;
        const createHex = () => {
            const shape = new THREE.Shape();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const x = hexRadius * Math.cos(angle);
                const y = hexRadius * Math.sin(angle);
                if (i === 0) shape.moveTo(x, y);
                else shape.lineTo(x, y);
            }
            shape.closePath();
            return new THREE.ExtrudeGeometry(shape, { depth: scale * 0.1, bevelEnabled: false });
        };
        
        const hexGeom = createHex();
        
        const mirrorPos = [
            [0, 0],
            [1.5, 0], [-0.75, 1.3], [-0.75, -1.3], [-1.5, 0], [0.75, 1.3], [0.75, -1.3],
            [3, 0], [2.25, 1.3], [0.75, 2.6], [-0.75, 2.6], [-2.25, 1.3],
            [-3, 0], [-2.25, -1.3], [-0.75, -2.6], [0.75, -2.6], [2.25, -1.3], [1.5, 2.6]
        ];
        
        // Create all mirror segments
        mirrorPos.forEach(pos => {
            const hex = new THREE.Mesh(hexGeom, goldMat);
            hex.position.set(scale * pos[0], scale * pos[1], scale * 3);
            hex.rotation.x = Math.PI / 2;
            jwst.add(hex);
        });
        
        // Secondary mirror with geometry caching
        const secMirror = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.35, scale * 0.35, scale * 0.1, 32, this.geometryCache),
            goldMat
        );
        secMirror.position.z = scale * 7;
        jwst.add(secMirror);
        
        // Support struts with geometry caching
        const strutGeom = GeometryFactory.createCylinder(scale * 0.05, scale * 0.05, scale * 4, 8, this.geometryCache);
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const strut = new THREE.Mesh(strutGeom, structMat);
            strut.position.x = Math.cos(angle) * scale * 2;
            strut.position.y = Math.sin(angle) * scale * 2;
            strut.position.z = scale * 5;
            strut.rotation.x = Math.atan2(1, 4);
            jwst.add(strut);
        }
        
        // Spacecraft bus with geometry caching
        const bus = new THREE.Mesh(
            GeometryFactory.createBox(scale * 2, scale * 2, scale * 1.5, this.geometryCache),
            MaterialFactory.createSpacecraftMaterial('body')
        );
        bus.position.z = scale * 1.5;
        jwst.add(bus);
        
        // Sunshield layers (5 layers with varying shades)
        for (let layer = 0; layer < 5; layer++) {
            const shieldLayer = new THREE.Mesh(new THREE.PlaneGeometry(scale * 21.2, scale * 14.2), shieldMat.clone());
            shieldLayer.material.color.setHex(0xE8E8E8 - layer * 0x0a0a0a);
            shieldLayer.position.z = -scale * (0.5 + layer * 0.3);
            jwst.add(shieldLayer);
        }
        
        // Sunshield support beams with geometry caching
        const beamGeom = GeometryFactory.createCylinder(scale * 0.08, scale * 0.08, scale * 14.2, 8, this.geometryCache);
        for (let i = -1; i <= 1; i++) {
            const beam = new THREE.Mesh(beamGeom, structMat);
            beam.position.set(scale * i * 10, 0, -scale * 1);
            beam.rotation.x = Math.PI / 2;
            jwst.add(beam);
        }
        
        // Solar panel with geometry caching
        const panel = new THREE.Mesh(
            GeometryFactory.createBox(scale * 2.5, scale * 0.05, scale * 6, this.geometryCache),
            MaterialFactory.createSpacecraftMaterial('solarPanel')
        );
        panel.position.set(scale * 3, 0, -scale * 1);
        panel.rotation.y = Math.PI / 2;
        jwst.add(panel);
        
        // High-gain antenna with geometry caching
        const antenna = new THREE.Mesh(
            GeometryFactory.createCone(scale * 1, scale * 0.5, 32, this.geometryCache),
            MaterialFactory.createSpacecraftMaterial('white')
        );
        antenna.position.z = -scale * 2;
        antenna.rotation.x = Math.PI;
        jwst.add(antenna);
        
        return jwst;
    }

    createHyperrealisticPioneer(satData) {
        if (DEBUG.enabled) console.log('?? Creating hyperrealistic Pioneer probe');
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
        if (DEBUG.enabled) console.log('?? Creating hyperrealistic Voyager probe');
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
        if (DEBUG.enabled) console.log('?? Creating hyperrealistic Juno spacecraft');
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
 orbitTime: '95 minutes'
 },
 {
 name: 'GPS Satellite (NAVSTAR)',
 distance: 3.16, // 20,180 km altitude = 3.16x Earth radius (more accurate)
 speed: 2.0,
 size: 0.015,
 color: 0x00FF00,
 description: ' GPS (NAVSTAR) constellation: 31 operational satellites (as of Oct 2025) in 6 orbital planes, 55° inclination. Each satellite orbits at 20,180 km altitude. Transmits L-band signals (1.2-1.5 GHz). Rubidium/cesium atomic clocks accurate to 10⁻¹⁴ seconds.',
 funFact: 'Need 4 satellites for 3D position fix (trilateration + clock correction). System provides 5-10m accuracy. Military signal (P/Y code) accurate to centimeters!',
 realSize: 'GPS III: 2,161 kg, 7.8m solar span',
 orbitTime: '11h 58min'
 }
 ];

 if (!this.planets.earth) {
 console.warn('Earth not found, cannot create satellites');
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
                type: 'Satellite',
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
 });
 }

 createSpacecraft(scene) {
 // Deep space probes and interplanetary missions
 this.spacecraft = [];
 
 const spacecraftData = [
 {
 name: 'Voyager 1',
 distance: 8307, // ~24.3 billion km from Sun as of Oct 2025 (162 AU) - educational scale (162 × 51.28)
 angle: Math.PI * 0.7, // Direction: 35 north of ecliptic plane
 speed: 0.0001, // Traveling at 17 km/s relative to Sun
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
 distance: 6923, // ~20.3 billion km from Sun as of Oct 2025 (135 AU) - educational scale (135 × 51.28)
 angle: Math.PI * 1.2, // Direction: Different trajectory than V1
 speed: 0.0001, // Traveling at 15.4 km/s relative to Sun
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
 distance: 3025, // ~8.9 billion km from Sun as of Oct 2025 (59 AU) - educational scale (59 × 51.28)
 angle: Math.PI * 0.3,
 speed: 0.0002, // Traveling at 14.31 km/s relative to Sun
 size: 0.06,
 color: 0x4169E1,
 type: 'probe',
 description: t('descNewHorizons'),
 funFact: t('funFactNewHorizons'),
 realSize: '478 kg, 0.7 2.1 2.7m (piano-sized)',
 launched: 'January 19, 2006',
 status: 'Active in Kuiper Belt'
 },
 {
 name: 'James Webb Space Telescope',
 distance: 55, // At Sun-Earth L2 Lagrange point, ~1.01 AU from Sun (1.5 million km beyond Earth at 51 units)
 angle: Math.PI * 0.15, // Positioned near Earth's L2 point
 speed: 0.0003, // Halo orbit around L2, period synced with Earth (1 year)
 size: 0.08,
 color: 0xFFD700,
 type: 'observatory',
 description: '🔭 James Webb Space Telescope (JWST) is the most powerful space telescope ever built! Launched Dec 25, 2021, it orbits the Sun-Earth L2 point (1.5 million km from Earth). Observes infrared (0.6-28.5 μm) with a 6.5m segmented beryllium mirror - 6× larger than Hubble!',
 funFact: 'JWST operates at -233°C (-388°F) behind a tennis court-sized sunshield! It can see the first galaxies formed just 280 million years after the Big Bang.',
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
 type: 'memorial',
 description: t('descCassini'),
 funFact: t('funFactCassini'),
 realSize: '5,600 kg, 6.8m tall, 4m wide',
 launched: 'October 15, 1997',
 status: 'Mission Ended Sept 15, 2017 (Memorial)'
 },
 {
 name: 'Pioneer 10',
 distance: 7127, // ~20.5 billion km from Sun (139 AU) - educational scale (139 × 51.28)
 angle: Math.PI * 0.5, // Direction: toward Aldebaran in Taurus
 speed: 0.00009, // Traveling at 12.2 km/s relative to Sun
 size: 0.07,
 color: 0xA0A0A0,
 type: 'memorial',
 description: t('descPioneer10'),
 funFact: t('funFactPioneer10'),
 realSize: '258 kg, 2.74m antenna dish',
 launched: 'March 2, 1972',
 status: 'Silent since Jan 2003 (Memorial)'
 },
 {
 name: 'Pioneer 11',
 distance: 5436, // ~15.9 billion km from Sun (106 AU) - educational scale (106 × 51.28)
 angle: Math.PI * 1.4, // Direction: toward constellation Aquila
 speed: 0.00008, // Traveling at 11.4 km/s relative to Sun
 size: 0.07,
 color: 0x909090,
 type: 'memorial',
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
 radius: craft.size
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
 });
 
 if (DEBUG.enabled) console.log(` Created ${this.spacecraft.length} spacecraft and probes!`);
 }

 update(deltaTime, timeSpeed, camera, controls) {
 // Safety check for deltaTime
 if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
 if (DEBUG.enabled) console.warn(' Invalid deltaTime:', deltaTime, '- skipping frame');
 return;
 }
 
 // Update camera tracking for focused objects (before other updates)
 this.updateCameraTracking(camera, controls);
 
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
 
 // Pre-calculate elapsed time for rotation (shared by all planets and moons)
 const elapsedMs = Date.now() - this.realTimeStart;
 const elapsedHours = (elapsedMs / 1000 / 3600) * this.timeAcceleration;
 
 // Update all planets
 Object.values(this.planets).forEach(planet => {
 if (planet && planet.userData) {
 // Calculate angle increment based on speed
 const angleIncrement = planet.userData.speed * orbitalSpeed * deltaTime;
 
 // Safety check for angle increment
 if (isNaN(angleIncrement) || !isFinite(angleIncrement)) {
 console.error(' Invalid angleIncrement for', planet.userData.name, ':', angleIncrement);
 return;
 }
 
 // Solar orbit (affected by orbital pause)
 planet.userData.angle += angleIncrement;
 
 // Safety check for angle
 if (isNaN(planet.userData.angle) || !isFinite(planet.userData.angle)) {
 console.error(' Invalid angle for', planet.userData.name, '- resetting to 0');
 planet.userData.angle = 0;
 }
 
 planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
 planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
 
 // REALISTIC PLANET ROTATION based on real astronomical data
 if (planet.userData.realRotationPeriod && rotationSpeed > 0) {
 // Calculate elapsed real time in hours (use shared value from outer scope)
 const rotationsComplete = elapsedHours / planet.userData.realRotationPeriod;
 let rotationAngle = (rotationsComplete * Math.PI * 2) + planet.userData.rotationPhase;
 
 // Reverse rotation for retrograde planets (Venus, Uranus)
 if (planet.userData.retrograde) {
 rotationAngle = -rotationAngle;
 }
 
 // Apply rotation
 planet.rotation.y = rotationAngle;
 
 // Apply axial tilt (already set during creation, but ensure it stays)
 planet.rotation.z = (planet.userData.axialTilt || 0) * Math.PI / 180;
 }
 
 // Rotate clouds slightly faster than planet for Earth
 if (planet.userData.clouds && rotationSpeed > 0) {
 planet.userData.clouds.rotation.y = planet.rotation.y * 1.05; // 5% faster
 }

 // Update moons - orbit around their parent planet
 if (planet.userData.moons && planet.userData.moons.length > 0) {
 planet.userData.moons.forEach(moon => {
 if (moon.userData) {
 // Calculate moon angle increment
 const moonAngleIncrement = moon.userData.speed * moonSpeed * deltaTime;
 
 // Moons orbit their planet
 moon.userData.angle += moonAngleIncrement;
 
 // IMPORTANT: Since moon is a child of planet (planet.add(moon)),
 // these positions are RELATIVE to the planet's position, not world coordinates!
 // This keeps the moon orbiting around its parent planet correctly.
 moon.position.x = moon.userData.distance * Math.cos(moon.userData.angle);
 moon.position.z = moon.userData.distance * Math.sin(moon.userData.angle);
 moon.position.y = 0; // Keep moons in planet's equatorial plane
 
 // REALISTIC MOON ROTATION based on real astronomical data
 if (moon.userData.realRotationPeriod && rotationSpeed > 0) {
 // Calculate rotation angle based on real rotation period (use shared value from outer scope)
 const rotationsComplete = elapsedHours / moon.userData.realRotationPeriod;
 let rotationAngle = (rotationsComplete * Math.PI * 2) + moon.userData.rotationPhase;
 
 // Reverse rotation for retrograde moons
 if (moon.userData.retrograde) {
 rotationAngle = -rotationAngle;
 }
 
 // Apply rotation
 moon.rotation.y = rotationAngle;
 
 // Apply axial tilt
 moon.rotation.z = (moon.userData.axialTilt || 0) * Math.PI / 180;
 }
 
 // Debug: Log moon position occasionally (Moon and Io)
 if (DEBUG.enabled && Math.random() < 0.001) {
 if (moon.userData.name.includes('Moon') || moon.userData.name.includes('Io')) {
 const worldPos = new THREE.Vector3();
 moon.getWorldPosition(worldPos);
 console.log(` ${moon.userData.name} orbiting ${planet.userData.name}: angle=${moon.userData.angle.toFixed(2)}, local=(${moon.position.x.toFixed(1)}, ${moon.position.y.toFixed(1)}, ${moon.position.z.toFixed(1)}), world=(${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)}, ${worldPos.z.toFixed(1)}), planet at=(${planet.position.x.toFixed(1)}, ${planet.position.y.toFixed(1)}, ${planet.position.z.toFixed(1)})`);
 }
 }
 }
 });
 }
 }
 });
 
 // Keep camera focused on selected object if it's moving
 if (this.focusedObject && camera && controls) {
 const targetPosition = new THREE.Vector3();
 this.focusedObject.getWorldPosition(targetPosition);
 
 // Calculate the offset from target to camera
 const cameraOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
 
 // Update both target and camera position to maintain relative view
 controls.target.copy(targetPosition);
 camera.position.copy(targetPosition).add(cameraOffset);
 
 controls.update();
 }

 // Rotate asteroid and Kuiper belts slowly
 const effectiveTimeSpeed = timeSpeed;
 if (this.asteroidBelt) {
 const rotationIncrement = 0.0001 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.asteroidBelt.rotation.y += rotationIncrement;
 }
 }
 if (this.kuiperBelt) {
 const rotationIncrement = 0.00005 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.kuiperBelt.rotation.y += rotationIncrement;
 }
 }

 // Rotate sun and animate surface activity
 if (this.sun) {
 const rotationIncrement = 0.001 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 this.sun.rotation.y += rotationIncrement;
 }
 
 // Animate solar flares (optimized - update every 2 frames)
 if (this.sun.userData.flares && (this._sunFlareFrame || 0) % 2 === 0) {
 const time = Date.now() * 0.001;
 const sizes = this.sun.userData.flares.geometry.attributes.size.array;
 const len = sizes.length;
 
 // Pre-calculate random values (less Math.random() calls)
 for (let i = 0; i < len; i++) {
 sizes[i] = 1 + Math.sin(time + i * 0.5) * 1.5 + (i % 3) * 0.2;
 }
 this.sun.userData.flares.geometry.attributes.size.needsUpdate = true;
 }
 this._sunFlareFrame = (this._sunFlareFrame || 0) + 1;
 }

 // Twinkle stars slightly (optimized - only every 5 frames)
 if (this.starfield && this._starTwinkleFrame % 5 === 0 && Math.random() < 0.3) {
 const sizes = this.starfield.geometry.attributes.size.array;
 // Reduce updates to 30 stars instead of 50
 for (let i = 0; i < 30; i++) {
 const idx = Math.floor(Math.random() * sizes.length);
 sizes[idx] = 1 + Math.random() * 2;
 }
 this.starfield.geometry.attributes.size.needsUpdate = true;
 }
 this._starTwinkleFrame = (this._starTwinkleFrame || 0) + 1;
 
 // Update comets with elliptical orbits (optimized)
 if (this.comets) {
 this.comets.forEach(comet => {
 const userData = comet.userData;
 const angleIncrement = userData.speed * effectiveTimeSpeed;
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 }
 
 // Elliptical orbit calculation
 const e = userData.eccentricity;
 const a = userData.distance;
 const angle = userData.angle;
 
 // Pre-calculate trig values (avoid redundant calculations)
 const cosAngle = Math.cos(angle);
 const sinAngle = Math.sin(angle);
 
 // Simplified elliptical orbit
 const r = a * (1 - e * e) / (1 + e * cosAngle);
 
 // Check if this comet is in "detail view" mode (when focused)
 if (userData.detailView) {
 // Store the real orbital position
 userData.orbitPosition = {
 x: r * cosAngle,
 y: Math.sin(angle * 0.5) * 20,
 z: r * sinAngle
 };
 // Position at viewable distance from sun (200 units)
 const detailDistance = 200;
 const orbitDirection = Math.sqrt(
 userData.orbitPosition.x ** 2 + 
 userData.orbitPosition.z ** 2
 );
 if (orbitDirection > 0) {
 comet.position.x = (userData.orbitPosition.x / orbitDirection) * detailDistance;
 comet.position.z = (userData.orbitPosition.z / orbitDirection) * detailDistance;
 } else {
 comet.position.x = detailDistance;
 comet.position.z = 0;
 }
 comet.position.y = userData.orbitPosition.y;
 } else {
 // Normal orbital position
 comet.position.x = r * cosAngle;
 comet.position.z = r * sinAngle;
 comet.position.y = Math.sin(angle * 0.5) * 20;
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
 
 // Cache direction vectors (reuse objects to avoid GC)
 if (!userData._sunDir) userData._sunDir = new THREE.Vector3();
 if (!userData._velDir) userData._velDir = new THREE.Vector3();
 
 userData._sunDir.set(-comet.position.x, -comet.position.y, -comet.position.z).normalize();
 userData._velDir.set(Math.cos(angle + Math.PI/2), 0, Math.sin(angle + Math.PI/2)).normalize();
 
 // Update dust tail (only every 3 frames for performance)
 if (userData.dustTail && userData.frameCount % 3 === 0) {
 const dustPositions = userData.dustTail.geometry.attributes.position.array;
 const dustSizes = userData.dustTail.geometry.attributes.size.array;
 
 const curveFactor = 0.3;
 for (let i = 0; i < 200; i++) {
 const t = i / 200;
 const length = 80 * t;
 
 // Curve effect - pre-calculated
 const dirX = userData._sunDir.x + userData._velDir.x * curveFactor * t;
 const dirY = userData._sunDir.y + userData._velDir.y * curveFactor * t;
 const dirZ = userData._sunDir.z + userData._velDir.z * curveFactor * t;
 const normFactor = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
 
 // Add spread
 const spread = (Math.random() - 0.5) * 15 * t;
 const spreadPerpendicular = (Math.random() - 0.5) * 8 * t;
 
 dustPositions[i * 3] = dirX * normFactor * length + spread;
 dustPositions[i * 3 + 1] = dirY * normFactor * length + spreadPerpendicular;
 dustPositions[i * 3 + 2] = dirZ * normFactor * length + spread;
 
 // Vary size (less random() calls)
 dustSizes[i] = 3 * (1 - t * 0.7) * (0.9 + (i % 5) * 0.05);
 }
 userData.dustTail.geometry.attributes.position.needsUpdate = true;
 userData.dustTail.geometry.attributes.size.needsUpdate = true;
 }
 
 // Update ion tail (only every 2 frames for performance)
 if (userData.ionTail && userData.frameCount % 2 === 0) {
 const ionPositions = userData.ionTail.geometry.attributes.position.array;
 const sunDirX = userData._sunDir.x;
 const sunDirY = userData._sunDir.y;
 const sunDirZ = userData._sunDir.z;
 
 for (let i = 0; i < 150; i++) {
 const t = i / 150;
 const length = 120 * t;
 const spread = (Math.random() - 0.5) * 3 * t;
 
 ionPositions[i * 3] = sunDirX * length + spread;
 ionPositions[i * 3 + 1] = sunDirY * length + spread;
 ionPositions[i * 3 + 2] = sunDirZ * length + spread;
 }
 userData.ionTail.geometry.attributes.position.needsUpdate = true;
 }
 
 userData.frameCount = (userData.frameCount || 0) + 1;
 });
 }
 
 // Update satellites orbiting Earth
 if (this.satellites) {
 this.satellites.forEach(satellite => {
 const userData = satellite.userData;
 if (userData.planet) {
 const angleIncrement = userData.speed * effectiveTimeSpeed * 0.01; // Scale down for realistic orbit times
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 }
 
 // Get Earth's world position
 const earthPosition = new THREE.Vector3();
 userData.planet.getWorldPosition(earthPosition);
 
 // Calculate satellite position relative to Earth with inclination
 const cosAngle = Math.cos(userData.angle);
 const sinAngle = Math.sin(userData.angle);
 const cosIncl = Math.cos(userData.inclination);
 const sinIncl = Math.sin(userData.inclination);
 
 satellite.position.x = earthPosition.x + userData.distance * cosAngle;
 satellite.position.y = earthPosition.y + userData.distance * sinAngle * sinIncl;
 satellite.position.z = earthPosition.z + userData.distance * sinAngle * cosIncl;
 
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
 console.log(` ISS: Earth at (${earthPosition.x.toFixed(1)}, ${earthPosition.y.toFixed(1)}, ${earthPosition.z.toFixed(1)}), ISS at (${satellite.position.x.toFixed(1)}, ${satellite.position.y.toFixed(1)}, ${satellite.position.z.toFixed(1)}), distance=${userData.distance}, visible=${satellite.visible}, children=${satellite.children.length}`);
 }
 }
 
 // ISS: Maintain stable orientation (no rotation)
 // All satellites should be tidally locked to Earth (always facing Earth)
 // This is realistic - ISS maintains nadir-pointing orientation
 satellite.lookAt(earthPosition);
 }
 });
 }
 
 // Update spacecraft (Voyagers, probes, orbiters)
 if (this.spacecraft) {
 // Get numeric speed multiplier
 const effectiveTimeSpeed = timeSpeed;
 
 this.spacecraft.forEach(craft => {
 const userData = craft.userData;
 
 // Deep space probes keep moving away
 if (!userData.orbitPlanet && userData.speed) {
 const angleIncrement = userData.speed * effectiveTimeSpeed * 0.001;
 if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
 userData.angle += angleIncrement;
 craft.position.x = userData.distance * Math.cos(userData.angle);
 craft.position.z = userData.distance * Math.sin(userData.angle);
 }
 }
 
 // Orbiters around planets (Juno, Cassini legacy, etc)
 if (userData.orbitPlanet && userData.speed && userData.type === 'orbiter') {
 const angleIncrement = userData.speed * effectiveTimeSpeed * 0.01;
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
 const rotationIncrement = 0.002 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 craft.rotation.y += rotationIncrement;
 }
 }
 });
 }
 
 // Rotate nebulae slowly (optimized - pre-calculate time)
 if (this.nebulae) {
 const effectiveTimeSpeed = timeSpeed;
 const time = Date.now() * 0.0005;
 const scale = 1 + Math.sin(time) * 0.05;
 
 this.nebulae.forEach(nebula => {
 const rotationIncrement = 0.0001 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 nebula.rotation.y += rotationIncrement;
 }
 // Pulsing effect (shared calculation)
 nebula.scale.setScalar(scale);
 });
 }
 
 // Rotate galaxies
 if (this.galaxies) {
 const effectiveTimeSpeed = timeSpeed;
 this.galaxies.forEach(galaxy => {
 const rotationIncrement = 0.0002 * effectiveTimeSpeed;
 if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
 galaxy.rotation.y += rotationIncrement;
 }
 });
 }
 
 // Twinkle distant stars
 if (this.distantStars) {
 this.distantStars.forEach(star => {
 if (Math.random() < 0.01) {
 const scale = 0.9 + Math.random() * 0.2;
 star.scale.setScalar(scale);
 }
 });
 }
 }

 cleanup(scene) {
 // Dispose materials only (geometries are cached and reused)
 this.objects.forEach(obj => {
 if (obj.material) {
 if (Array.isArray(obj.material)) {
 obj.material.forEach(mat => mat.dispose());
 } else {
 obj.material.dispose();
 }
 }
 scene.remove(obj);
 });
 
 // Clean up starfield
 if (this.starfield) {
 if (this.starfield.geometry) this.starfield.geometry.dispose();
 if (this.starfield.material) this.starfield.material.dispose();
 scene.remove(this.starfield);
 }

 // Clean up orbital paths
 this.orbits.forEach(orbit => {
 if (orbit.geometry) orbit.geometry.dispose();
 if (orbit.material) orbit.material.dispose();
 scene.remove(orbit);
 });

 // Remove sun light
 const sunLight = scene.getObjectByName('sunLight');
 if (sunLight) scene.remove(sunLight);

 // Dispose cached geometries when fully cleaning up
 this.geometryCache.forEach(geo => geo.dispose());
 this.geometryCache.clear();

 this.objects = [];
 this.planets = {};
 this.moons = {};
 this.sun = null;
 this.starfield = null;
 this.asteroidBelt = null;
 this.kuiperBelt = null;
 this.orbits = [];
 }

 getSelectableObjects() {
 return this.objects;
 }
 
 toggleOrbits(visible) {
 this.orbitsVisible = visible;
 this.orbits.forEach(orbit => {
 orbit.visible = visible;
 });
 if (DEBUG.enabled) console.log(` Orbit paths ${visible ? 'shown' : 'hidden'}`);
 }
 
 toggleConstellations(visible) {
 this.constellationsVisible = visible;
 this.constellations.forEach(constellation => {
 constellation.visible = visible;
 });
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
 
 // Recreate orbital paths for all planets
 const planetsToOrbit = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
 
 planetsToOrbit.forEach(planetName => {
 const planet = this.planets[planetName];
 if (planet && planet.userData) {
 const distance = planet.userData.distance;
 const points = [];
 const segments = 128;
 
 for (let i = 0; i <= segments; i++) {
 const angle = (i / segments) * Math.PI * 2;
 points.push(new THREE.Vector3(
 distance * Math.cos(angle),
 0,
 distance * Math.sin(angle)
 ));
 }
 
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: 0x6688AA,
 transparent: true,
 opacity: 0.5
 });
 
 const orbit = new THREE.Line(geometry, material);
 orbit.visible = this.orbitsVisible;
 orbit.userData = { type: 'orbit', planet: planetName };
 
 planet.parent.add(orbit);
 this.orbits.push(orbit);
 }
 });
 
 // Also update Pluto if it exists
 if (this.planets.pluto && this.planets.pluto.userData) {
 const distance = this.planets.pluto.userData.distance;
 const points = [];
 const segments = 128;
 
 for (let i = 0; i <= segments; i++) {
 const angle = (i / segments) * Math.PI * 2;
 points.push(new THREE.Vector3(
 distance * Math.cos(angle),
 0,
 distance * Math.sin(angle)
 ));
 }
 
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: 0x6688AA,
 transparent: true,
 opacity: 0.5
 });
 
 const orbit = new THREE.Line(geometry, material);
 orbit.visible = this.orbitsVisible;
 orbit.userData = { type: 'orbit', planet: 'pluto' };
 
 this.planets.pluto.parent.add(orbit);
 this.orbits.push(orbit);
 }
 
 // Recreate moon orbital paths
 Object.values(this.planets).forEach(planet => {
 if (planet.userData.moons && planet.userData.moons.length > 0) {
 if (DEBUG.enabled) console.log(`[Orbits] Recreating ${planet.userData.moons.length} moon orbit(s) for ${planet.userData.name}`);
 planet.userData.moons.forEach(moon => {
 const moonDistance = moon.userData.distance;
 
 const curve = new THREE.EllipseCurve(
 0, 0,
 moonDistance, moonDistance,
 0, 2 * Math.PI,
 false,
 0
 );
 
 const points = curve.getPoints(128);
 const geometry = new THREE.BufferGeometry().setFromPoints(points);
 const material = new THREE.LineBasicMaterial({
 color: 0xAADDFF, // Brighter cyan for better visibility
 transparent: true,
 opacity: 0.7,
 linewidth: 2,
 depthTest: true,
 depthWrite: false
 });
 
 const orbitLine = new THREE.Line(geometry, material);
 orbitLine.rotation.x = Math.PI / 2;
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
 if (this.oortCloud && this.oortCloud.children) {
 // Define scale parameters for both modes
 const oldParams = this.realisticScale ? 
 { inner: 5000, outer: 15000 } : // We're switching FROM educational TO realistic
 { inner: 2564000, outer: 10256000 }; // We're switching FROM realistic TO educational
 
 const newParams = this.realisticScale ? 
 { inner: 2564000, outer: 10256000 } : // Switching TO realistic (50,000-200,000 AU)
 { inner: 5000, outer: 15000 }; // Switching TO educational (far beyond Kuiper Belt)
 
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
 
 if (DEBUG.enabled) console.log(`?? Belts updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }
 
 updateSpacecraftPositions() {
 // Update spacecraft positions based on scale mode
 if (!this.spacecraft || this.spacecraft.length === 0) return;
 
 // Scale factors for spacecraft distances
 const spacecraftScaleFactors = this.realisticScale ? {
 // Realistic scale - use much larger distances
 'Voyager 1': 4500, // 162 AU - way beyond planets
 'Voyager 2': 4200, // 135 AU
 'New Horizons': 2950, // 59 AU - beyond Neptune 
 'James Webb Space Telescope': 155, // At Earth's L2 point (~1.01 AU from Sun)
 'Pioneer 10': 5000, // 139 AU
 'Pioneer 11': 4400 // 106 AU
 } : {
 // Educational scale - proportionally compressed
 // Using Mercury (0.39 AU) = 20 as base scale factor = 51.28 units per AU
 'Voyager 1': 8307,  // 162 AU * 51.28 (was 300)
 'Voyager 2': 6923,  // 135 AU * 51.28 (was 280)
 'New Horizons': 3025, // 59 AU * 51.28 (was 85)
 'James Webb Space Telescope': 55, // At Earth's L2 point (~1.01 AU from Sun, just beyond Earth at 51)
 'Pioneer 10': 7127,  // 139 AU * 51.28
 'Pioneer 11': 5436   // 106 AU * 51.28 (was 290)
 };
 
 this.spacecraft.forEach(spacecraft => {
 const userData = spacecraft.userData;
 if (!userData || userData.orbitPlanet) return; // Skip orbiters - they stay relative to planet
 
 const newDistance = spacecraftScaleFactors[userData.name];
 if (newDistance && userData.angle !== undefined) {
 // Update stored distance
 userData.distance = newDistance;
 
 // Update position
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
 // Educational scale - same distances (comets use educational scale by default in creation)
 'Halley\'s Comet': 1795,  // 35 AU
 'Comet Hale-Bopp': 12820, // 250 AU
 'Comet Hyakutake': 1540,  // 30 AU
 'Comet Lovejoy': 770,     // 15 AU
 'Comet Encke': 385,       // 7.5 AU
 'Comet Swift-Tuttle': 2570 // 50 AU
 };
 
 this.comets.forEach(comet => {
 const userData = comet.userData;
 if (!userData || !userData.name) return;
 
 const newDistance = cometScaleFactors[userData.name];
 if (newDistance !== undefined) {
 // Update stored distance (semi-major axis)
 userData.distance = newDistance;
 
 // Recalculate position based on current angle and eccentricity
 const e = userData.eccentricity;
 const a = userData.distance;
 const angle = userData.angle || 0;
 
 const cosAngle = Math.cos(angle);
 const sinAngle = Math.sin(angle);
 
 // Elliptical orbit formula
 const r = a * (1 - e * e) / (1 + e * cosAngle);
 comet.position.x = r * cosAngle;
 comet.position.z = r * sinAngle;
 comet.position.y = Math.sin(angle * 0.5) * 20;
 
 if (DEBUG.enabled) console.log(` ${userData.name}: ${newDistance} units (e=${e})`);
 }
 });
 
 if (DEBUG.enabled) console.log(` Comet positions updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
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
 
 if (DEBUG.enabled) console.log(` Deep space objects updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
 }

 getObjectInfo(object) {
 const userData = object.userData;
 const t = window.t || ((key) => key);
 
 // Translate object name
 const nameKey = userData.name?.toLowerCase().replace(/\s+/g, '');
 let translatedName = userData.name || 'Unknown';
 if (nameKey && window.t && window.t(nameKey) !== nameKey) {
 translatedName = t(nameKey);
 }
 
 // Translate object type
 const typeKey = 'type' + userData.type?.replace(/\s+/g, '');
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
 distanceText = `${userData.distance.toFixed(1)} ${t('millionKmFromSun')}`;
 } else {
 distanceText = t('distanceVaries');
 }
 
 // Get translated description based on object name
 let description = userData.description || t('noDescription');
 const descKey = 'desc' + userData.name?.replace(/\s+/g, '');
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
 const funFactKey = 'funFact' + userData.name?.replace(/\s+/g, '');
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
 if (!object || !object.userData) {
 console.warn(' Cannot focus on invalid object');
 return;
 }
 
 if (DEBUG.enabled) {
 console.log(` [Focus] Focusing on: ${object.userData.name}, type: ${object.userData.type}, isComet: ${object.userData.isComet}`);
 }
 
 // Determine actual object size (not inflated glow size)
 const userData = object.userData;
 
 // Disable detail view for previously focused comet when focusing on non-comet
 if (!userData.isComet && this.focusedComet) {
 this.focusedComet.userData.detailView = false;
 this.focusedComet.scale.set(1, 1, 1); // Reset scale
 this.focusedComet.rotation.y = 0; // Reset rotation
 this.focusedComet = null;
 if (DEBUG.enabled) console.log(' [Detail View] Disabled - focusing on non-comet object');
 }
 let actualRadius;
 
 if (userData.isSpacecraft || userData.isComet) {
 // Use actual size for spacecraft and comets, not glow/tail size
 actualRadius = userData.actualSize || 0.1;
 } else if (userData.type === 'Constellation') {
 // Constellations: use calculated radius (star pattern spread)
 actualRadius = userData.radius || 500;
 } else if (userData.type === 'Galaxy' || userData.type === 'Nebula') {
 // Distant deep-sky objects
 actualRadius = userData.radius || 300;
 } else {
 actualRadius = userData.radius || 10;
 }
 
 // Calculate appropriate viewing distance based on object type
 let distance;
 if (userData.type === 'Constellation') {
 // Constellations: Position camera to view the star pattern
 // They're at distance ~10000, so we need to be relatively close but not inside
 distance = actualRadius * 3; // View from 3x the pattern size
 } else if (userData.type === 'Galaxy') {
 // Galaxies: Distant objects, zoom to appreciate structure
 distance = actualRadius * 4;
 } else if (userData.type === 'Nebula') {
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
 } else if (userData.type === 'Moon' && userData.parentPlanet) {
 // Moons: Close chase-cam to see moon details and parent planet surface
 distance = Math.max(actualRadius * 4, 2);
 if (DEBUG.enabled) console.log(` [Moon Chase-Cam] Close distance: ${distance.toFixed(2)} for "${userData.name}" around ${userData.parentPlanet}`);
 } else if (userData.isSpacecraft) {
 // Other spacecraft: moderate zoom
 distance = Math.max(actualRadius * 8, 3);
 } else if (userData.isComet) {
 // Comets: zoom to see nucleus, coma, and LONG tails
 // Comets have tiny nucleus (0.0008-0.005) but tails extend 30-100+ units
 // Position camera far enough back to see the full spectacle
 distance = 80; // Fixed distance to capture nucleus + coma + full tails
 if (DEBUG.enabled) console.log(` [Comet] Camera distance: ${distance.toFixed(2)} for ${userData.name} (nucleus size: ${actualRadius.toFixed(4)})`);
 } else {
 // Regular objects: standard zoom
 distance = Math.max(actualRadius * 5, 10);
 }
 
 const targetPosition = new THREE.Vector3();
 
 // Special handling for comets - move to detail view position FIRST
 if (userData.isComet) {
 // Enable "detail view" mode to bring comet to viewable distance
 if (this.focusedComet && this.focusedComet !== object) {
 // Disable detail view for previously focused comet
 this.focusedComet.userData.detailView = false;
 }
 this.focusedComet = object;
 object.userData.detailView = true;
 
 if (DEBUG.enabled) console.log(` [Comet Detail View] Enabling for ${userData.name} - bringing to viewable distance`);
 
 // IMMEDIATELY move comet to detail view position
 const detailDistance = 200;
 const currentPos = object.position.clone();
 const orbitDirection = Math.sqrt(currentPos.x ** 2 + currentPos.z ** 2);
 if (orbitDirection > 0) {
 object.position.x = (currentPos.x / orbitDirection) * detailDistance;
 object.position.z = (currentPos.z / orbitDirection) * detailDistance;
 // Keep Y position (vertical wobble)
 }
 
 // Orient comet so tails point away from sun
 // Tails are built along positive X axis, so rotate to point away from sun
 const sunPosition = this.sun ? this.sun.position : new THREE.Vector3(0, 0, 0);
 const cometToSun = sunPosition.clone().sub(object.position);
 const angleToSun = Math.atan2(cometToSun.z, cometToSun.x);
 object.rotation.y = angleToSun + Math.PI; // Rotate so +X points away from sun
 
 // Scale up comet to be visible (nucleus is tiny - only 0.002-0.005 units!)
 // With enhanced tails (25-35 units), scale of 15x gives perfect visibility
 const detailViewScale = 15.0; // Sweet spot: visible but not overwhelming
 object.scale.set(detailViewScale, detailViewScale, detailViewScale);
 
 if (DEBUG.enabled) {
 console.log(`   Moved from distance ${orbitDirection.toFixed(1)} to ${detailDistance} units`);
 console.log(`   New position: (${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})`);
 console.log(`   Tail rotation: ${(object.rotation.y * 180 / Math.PI).toFixed(1)}° (pointing away from sun)`);
 console.log(`   Scale: ${detailViewScale}x for visibility`);
 }
 }
 
 // Special handling for constellations - use center of star pattern
 if (userData.type === 'Constellation' && userData.centerPosition) {
 targetPosition.set(
 userData.centerPosition.x,
 userData.centerPosition.y,
 userData.centerPosition.z
 );
 
 // Highlight this constellation and dim others
 this.highlightConstellation(object);
 } else {
 // Reset constellation highlighting if focusing on non-constellation
 this.resetConstellationHighlight();
 object.getWorldPosition(targetPosition);
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
 
 if (userData.type === 'Constellation') {
     // Constellations: never follow
     this.cameraFollowMode = false;
     this.cameraCoRotateMode = false;
 } else if ((userData.orbitPlanet || userData.parentPlanet) && !isPlanetOrbitingSun) {
     // All objects orbiting a planet (spacecraft, moons, etc.): enable chase-cam
     this.cameraFollowMode = true;
     this.cameraCoRotateMode = true; // Chase-cam mode: camera orbits WITH object
     const objectType = userData.isSpacecraft ? 'spacecraft' : userData.type || 'orbiter';
     if (DEBUG.enabled) console.log(` Chase-cam co-rotation enabled for ${object.userData.name} (${objectType})`);
 } else if (isOrbiter) {
     // Other orbiters (planets around sun, comets): traditional tracking
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
         if (DEBUG.enabled) console.log(` [Time Speed] Reduced to 0.1x for orbital spacecraft observation`);
     }
 } else if (userData.type === 'planet' || userData.isPlanet) {
     // Planets: return to normal 1x speed
     if (window.app && window.app.timeSpeed !== 0 && window.app.timeSpeed !== 1) {
         window.app.timeSpeed = 1;
         if (DEBUG.enabled) console.log(` [Time Speed] Restored to 1x for planet observation`);
     }
 }
 
 // Configure controls for focused object inspection
 let minDist, maxDist;
 
 if (userData.type === 'Constellation') {
 // Constellations: large viewing range since they're at distance 10000
 minDist = 100; // Don't get too close or you'll be inside stars
 maxDist = 20000; // Allow zooming far out
 } else if (userData.isSpacecraft && userData.orbitPlanet) {
 // ISS and orbital satellites: allow close inspection and wide zoom range
 minDist = 0.2; // Get close to see module details
 maxDist = 100; // Zoom out to see Earth + satellite in context
 if (DEBUG.enabled) console.log(` [ISS/Satellite Zoom] min: ${minDist}, max: ${maxDist}`);
 } else {
 minDist = Math.max(actualRadius * 0.5, 0.5); // Allow zooming to half the radius
 maxDist = Math.max(actualRadius * 100, 1000); // Allow zooming far out
 }
 
 controls.minDistance = minDist;
 controls.maxDistance = maxDist;
 
 // Configure controls based on object type
 controls.enableRotate = true;
 controls.enableZoom = true;
 // Disable panning for ISS/satellites to keep them centered (Earth stays in view)
 controls.enablePan = (userData.isSpacecraft && userData.orbitPlanet) ? false : true;
 controls.autoRotate = false;
 
 if (userData.isSpacecraft && userData.orbitPlanet) {
 if (DEBUG.enabled) console.log(` [ISS Controls] Panning disabled to keep ISS centered and Earth in view`);
 }
 
 // Smooth camera transition
 const startPos = camera.position.clone();
 const startTarget = controls.target.clone();
 
 // For fast orbiters (like ISS), do NOT use relative offset if isSpacecraft
 let useRelativeOffset = false;
 let parentPlanet = null;
 let relativeOffset = null;

 if (isFastOrbiter && userData.orbitPlanet && !userData.isSpacecraft) {
     parentPlanet = this.planets[userData.orbitPlanet.toLowerCase()];
     if (parentPlanet) {
         useRelativeOffset = true;
         relativeOffset = targetPosition.clone().sub(parentPlanet.position);
         if (DEBUG.enabled) console.log(` Fast orbiter: using relative offset from ${userData.orbitPlanet}`);
     }
 }
 
 // Calculate camera end position based on object type
 let endPos;

 if (userData.type === 'Constellation' || userData.type === 'Galaxy' || userData.type === 'Nebula') {
     // For distant objects: Position camera OUTSIDE solar system, looking AT the constellation
     // Strategy: Place camera on a sphere around the constellation, ensuring line of sight
     // doesn't pass through the solar system at origin
     
     // Direction from origin to constellation
     const directionFromOrigin = targetPosition.clone().normalize();
     
     // Position camera slightly to the SIDE of the direct line from origin to constellation
     // This ensures the solar system (at origin) is not in the line of sight
     
     // Create a perpendicular vector (90 degrees from the origin-constellation line)
     const perpendicularVector = new THREE.Vector3(-directionFromOrigin.z, 0, directionFromOrigin.x).normalize();
     
     // Calculate camera position:
     // 1. Start at constellation center
     // 2. Move perpendicular to avoid origin being in line of sight
     // 3. Move slightly backward (toward origin direction) for better angle
     const sideOffset = 1000; // Move 1000 units to the side
     const backOffset = distance; // Viewing distance
     
     endPos = targetPosition.clone()
         .add(perpendicularVector.clone().multiplyScalar(sideOffset)) // Move to the side
         .add(directionFromOrigin.clone().multiplyScalar(-backOffset * 0.5)); // Pull back slightly for viewing angle
     
     // Ensure camera is far from origin (outside solar system sphere of ~300 units)
     const distanceFromOrigin = endPos.length();
     if (distanceFromOrigin < 500) {
         // If too close to origin, push camera further out in perpendicular direction
         endPos.add(perpendicularVector.clone().multiplyScalar(500));
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
         const earthPos = new THREE.Vector3();
         parentPlanet.getWorldPosition(earthPos);
         const issDirection = targetPosition.clone().sub(earthPos).normalize();
         
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
 } else if (userData.type === 'Moon' && userData.parentPlanet) {
     // Moons: Chase-cam perspective showing moon and parent planet surface
     parentPlanet = this.planets[userData.parentPlanet.toLowerCase()];
     if (parentPlanet) {
         // Calculate moon direction from planet
         const moonDirection = targetPosition.clone().sub(parentPlanet.position).normalize();
         
         // Position camera behind and slightly above moon for chase-cam effect
         const offsetDistance = distance;
         endPos = new THREE.Vector3(
             targetPosition.x - moonDirection.x * offsetDistance * 0.5, // Behind moon
             targetPosition.y + offsetDistance * 0.3, // Above
             targetPosition.z - moonDirection.z * offsetDistance * 0.5
         );
         
         controls.target.copy(targetPosition); // Look at moon
         if (DEBUG.enabled) console.log(` [Moon Chase-Cam] Camera positioned behind ${userData.name} for parent planet flyover`);
     } else {
         // Fallback: static angle
         const angle = Math.random() * Math.PI * 2;
         const elevation = 0.4;
         endPos = new THREE.Vector3(
             targetPosition.x + Math.cos(angle) * distance,
             targetPosition.y + distance * elevation,
             targetPosition.z + Math.sin(angle) * distance
         );
         controls.target.copy(targetPosition);
     }
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
     const sunPosition = this.sun ? this.sun.position : new THREE.Vector3(0, 0, 0);
     const cometToSunDir = sunPosition.clone().sub(targetPosition).normalize();
     
     // Position camera at 45° angle from sun-comet line, elevated for cinematic view
     // This shows: nucleus (center), coma (glow), and tails streaming AWAY from camera toward us
     const rightVector = new THREE.Vector3(-cometToSunDir.z, 0, cometToSunDir.x).normalize();
     
     // Camera offset: 
     // - 70% along sun direction (slightly toward sun for lighting)
     // - 50% to the side (perpendicular for better view)  
     // - 40% elevated (cinematic angle from above)
     endPos = targetPosition.clone()
         .add(cometToSunDir.clone().multiplyScalar(distance * 0.7))
         .add(rightVector.multiplyScalar(distance * 0.5))
         .add(new THREE.Vector3(0, distance * 0.4, 0));
     
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
 if (userData.type === 'Constellation' || userData.type === 'Galaxy' || userData.type === 'Nebula') {
     camera.lookAt(targetPosition); // Immediately orient camera toward target
     controls.update(); // Apply the change
     if (DEBUG.enabled) console.log(` [${userData.type}] Pre-animation: Camera oriented to look at target`);
 }
 
 const duration = isFastOrbiter ? 1000 : 1500; // Faster transition for fast orbiters
 const startTime = performance.now();
 
 const animate = () => {
 const elapsed = performance.now() - startTime;
 const progress = Math.min(elapsed / duration, 1);
 const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
 
 // Update target position differently based on object type
 if (userData.type === 'Constellation') {
 // Constellations: keep static target (don't update position)
 // targetPosition already set to constellation center
 } else if (useRelativeOffset && progress < 1) {
 // For fast orbiters during transition: maintain relative offset from parent
 const planetPos = parentPlanet.position.clone();
 targetPosition.copy(planetPos).add(relativeOffset);
 endPos.set(
 targetPosition.x,
 targetPosition.y + distance * 0.3,
 targetPosition.z + distance
 );
 } else if (progress < 1) {
 // For regular objects or final frame: use actual position
 object.getWorldPosition(targetPosition);
 }
 
 camera.position.lerpVectors(startPos, endPos, eased);
 
 // Always set target first, then update controls
 controls.target.copy(targetPosition);
 
 // For constellations and distant objects, ensure camera orientation is maintained
 if (userData.type === 'Constellation' || userData.type === 'Galaxy' || userData.type === 'Nebula') {
 camera.lookAt(targetPosition); // Force camera to look at target during animation
 }
 
 controls.update();
 
 if (progress < 1) {
 requestAnimationFrame(animate);
 } else {
 // Transition complete - enable smooth following
 if (isOrbiter) {
 this.cameraFollowMode = true;
 if (DEBUG.enabled) console.log(` Camera follow mode ENABLED for ${object.userData.name}`);
 }
 }
 };
 
 animate();
 }
 
 updateCameraTracking(camera, controls) {
 // TRACKING INDICATOR REMOVED - it was distracting
 
 // Exit if no focused object or tracking disabled
 if (!this.focusedObject || !this.cameraFollowMode) {
 return;
 }
 
 const object = this.focusedObject;
 const userData = object.userData;
 const targetPosition = new THREE.Vector3();
 object.getWorldPosition(targetPosition);
 
 if (this.cameraCoRotateMode && userData.orbitPlanet) {
 // CO-ROTATION MODE: Camera orbits WITH the spacecraft (ISS, Hubble, etc.)
 // Camera maintains fixed relative position in the spacecraft's orbital frame
 
 const parentPlanet = this.planets[userData.orbitPlanet.toLowerCase()];
 if (parentPlanet) {
 const offsetDistance = this.focusedObjectDistance || 3;
 
 // Get vector from planet to ISS (radial direction)
 const radialDirection = targetPosition.clone().sub(parentPlanet.position);
 const orbitRadius = radialDirection.length();
 radialDirection.normalize();
 
 // Calculate tangent direction (perpendicular to radial, in orbital plane)
 // For a counter-clockwise orbit when viewed from above (standard), tangent is:
 // cross product of radial with up vector (0, 1, 0)
 const up = new THREE.Vector3(0, 1, 0);
 const tangentDirection = new THREE.Vector3().crossVectors(up, radialDirection).normalize();
 
 // If orbit is inclined significantly, use actual orbital motion
 if (userData.orbitalVelocity) {
 tangentDirection.copy(userData.orbitalVelocity).normalize();
 }
 
 // Cinematic co-rotation: Add subtle variation over time for more dynamic view
 const time = performance.now() * 0.0001; // Slow oscillation
 const breathingFactor = Math.sin(time) * 0.1; // ±10% distance variation
 const adjustedDistance = offsetDistance * (1.0 + breathingFactor);
 
 // ULTRA-CLOSE chase-cam: Position camera very close behind and slightly above ISS
 // This creates a dramatic view with Earth surface rushing by below
 const cameraPosition = targetPosition.clone()
 .add(tangentDirection.clone().multiplyScalar(-adjustedDistance * 0.4)) // Close behind (40% of distance)
 .add(radialDirection.clone().multiplyScalar(adjustedDistance * 0.15)) // Minimal outward (15%)
 .add(up.multiplyScalar(adjustedDistance * 0.25)); // Slightly above (25%)
 
 camera.position.copy(cameraPosition);
 
 // Always look at ISS
 controls.target.copy(targetPosition);
 controls.update();
 }
 } else {
 // TRADITIONAL TRACKING MODE: Camera follows but doesn't co-rotate
 
 // Determine smooth factor based on object speed
 const isFastOrbiter = userData.orbitPlanet && userData.speed && userData.speed > 0.5;
 const smoothFactor = isFastOrbiter ? 0.25 : 0.1;
 
 // Smoothly update controls target to follow the object
 const currentTarget = controls.target.clone();
 controls.target.lerpVectors(currentTarget, targetPosition, smoothFactor);
 
 // Calculate offset from target to camera
 const offset = camera.position.clone().sub(currentTarget);
 
 // Move camera to maintain the same relative position
 camera.position.copy(targetPosition).add(offset);
 
 controls.update();
 }
 }

 createLabels() {
 // Create CSS2D labels for all major objects
 this.labels = [];
 
 // Helper function to create a label
 const createLabel = (object, text) => {
 if (!object || !object.userData) return;
 
 const labelDiv = document.createElement('div');
 labelDiv.className = 'object-label';
 labelDiv.textContent = text || object.userData.name;
 labelDiv.style.color = 'white';
 labelDiv.style.fontSize = '14px';
 labelDiv.style.fontFamily = "'Poppins', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
 labelDiv.style.padding = '2px 6px';
 labelDiv.style.background = 'rgba(0, 0, 0, 0.7)';
 labelDiv.style.borderRadius = '4px';
 labelDiv.style.pointerEvents = 'none';
 labelDiv.style.userSelect = 'none';
 
 const label = new CSS2DObject(labelDiv);
 label.position.set(0, object.userData.radius * 1.5 || 5, 0);
 label.visible = false; // Start hidden
 object.add(label);
 
 object.userData.label = label;
 this.labels.push(label);
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
 
 // Add labels to distant stars
 if (this.distantStars) {
 this.distantStars.forEach(star => {
 createLabel(star, ` ${star.userData.name}`);
 });
 }
 
 // Add labels to nebulae
 if (this.nebulae) {
 this.nebulae.forEach(nebula => {
 createLabel(nebula, ` ${nebula.userData.name}`);
 });
 }
 
 // Add labels to constellations
 if (this.constellations) {
 this.constellations.forEach(constellation => {
 createLabel(constellation, ` ${constellation.userData.name}`);
 });
 }
 }

 toggleLabels(visible) {
 if (DEBUG.enabled) console.log(` toggleLabels called with visible=${visible}, labels.length=${this.labels?.length || 0}`);
 
 if (!this.labels || this.labels.length === 0) {
 console.warn(' No labels to toggle - labels array is empty or undefined');
 if (DEBUG.enabled) console.log(' this.labels:', this.labels);
 return;
 }
 
 // Use the passed visibility state, or toggle based on first label's current state
 const newVisibility = visible !== undefined ? visible : !this.labels[0].visible;
 
 this.labels.forEach((label, index) => {
 label.visible = newVisibility;
 if (index < 3 && DEBUG.enabled) {
 console.log(` Label ${index}: ${label.element?.textContent || 'no text'} -> visible=${newVisibility}`);
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

