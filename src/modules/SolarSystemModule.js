// =====================================
// SOLAR SYSTEM MODULE (Coordinator)
// =====================================
import * as THREE from 'three';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from './utils.js';
import { TEXTURE_CACHE } from './TextureCache.js';

// Celestial Constants
import {
  ASTRONOMICAL_DATA,
  SCIENTIFIC_ORBITAL_PERIODS,
  SCIENTIFIC_MOON_ORBITAL_PERIODS,
  SCIENTIFIC_ORBITAL_ELEMENTS,
  SCIENTIFIC_MOON_ORBITAL_ELEMENTS,
  PLANET_ELEMENTS_J2000
} from './solar-system/celestial-data.js';

// Submodules prototypes
import * as textureGenerator from './solar-system/texture-generator.js';
import * as celestialFactory from './solar-system/celestial-factory.js';
import * as deepSpace from './solar-system/deep-space.js';
import * as cometsSpacecraft from './solar-system/comets-spacecraft.js';
import * as orbitalMechanics from './solar-system/orbital-mechanics.js';

// i18n
import { t } from './i18n-t.js';

export class SolarSystemModule {
  constructor(uiManager, app) {
    this.uiManager = uiManager;
    this.app = app; // INJECTED EXPLICIT REFERENCE

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

    // Scientific mode
    this.scientificMode = false;

    // Comet tails
    this.cometTailsVisible = true;

    // Labels
    this.labelsVisible = false;

    this.pickableObjects = [];

    this.orbitMode = 'all';
    this.orbitsVisible = true;
    this.cometOrbitsVisible = true;

    this.constellationsVisible = false;

    this.geometryCache = new Map();

    // Map constants into instance
    this.ASTRONOMICAL_DATA = ASTRONOMICAL_DATA;
    this.SCIENTIFIC_ORBITAL_PERIODS = SCIENTIFIC_ORBITAL_PERIODS;
    this.SCIENTIFIC_MOON_ORBITAL_PERIODS = SCIENTIFIC_MOON_ORBITAL_PERIODS;
    this.SCIENTIFIC_ORBITAL_ELEMENTS = SCIENTIFIC_ORBITAL_ELEMENTS;
    this.SCIENTIFIC_MOON_ORBITAL_ELEMENTS = SCIENTIFIC_MOON_ORBITAL_ELEMENTS;
    this.PLANET_ELEMENTS_J2000 = PLANET_ELEMENTS_J2000;

    this.simulatedJD = 2451545.0;
    this.timeAcceleration = 360;
    this.simulatedHours = 0;

    // Scratch vectors for update() hot path
    this._trackTargetPos = new THREE.Vector3();
    this._trackOffset    = new THREE.Vector3();
    this._satEarthPos    = new THREE.Vector3();
    this._camRadial      = new THREE.Vector3();
    this._camTangent     = new THREE.Vector3();
    this._camUp          = new THREE.Vector3();
    this._camPos         = new THREE.Vector3();
    this._camChaseDir    = new THREE.Vector3();
    this._camCurrentTgt  = new THREE.Vector3();
    this._cameraFollowLastTargetPos = new THREE.Vector3();
    this._cameraFollowObject = null;

    this._focusTransitionToken = 0;
    this._focusTransitionActive = false;
    this._focusTransitionCancelRequested = false;

    this._sunFlareFrame    = 0;
    this._starTwinkleFrame = 0;

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

    for (const step of loadingSteps) {
      if (this.uiManager) {
        this.uiManager.updateLoadingProgress(step.progress, step.message);
      }

      await new Promise(resolve => requestAnimationFrame(resolve));

      try {
        await step.task();
      } catch (error) {
        if (DEBUG && DEBUG.enabled) console.error(`[SolarSystem] Error in loading step "${step.message}":`, error);
      }
    }

    const totalTime = performance.now() - initStartTime;
    if (DEBUG && DEBUG.PERFORMANCE) {
      console.log(`[SolarSystem] Initialized in ${totalTime.toFixed(0)}ms — Planets: ${Object.keys(this.planets).length}, Satellites: ${this.satellites.length}, Spacecraft: ${this.spacecraft.length}`);
    }

    this.applyScientificModeSpeeds();
    this.initPositionsToDate(new Date());

    if (this.app && typeof this.app.startExperience === 'function') {
      this.app.startExperience();
    }
  }
}

// Assign prototype methods from decoupled submodules
Object.assign(SolarSystemModule.prototype, textureGenerator);
Object.assign(SolarSystemModule.prototype, celestialFactory);
Object.assign(SolarSystemModule.prototype, deepSpace);
Object.assign(SolarSystemModule.prototype, cometsSpacecraft);
Object.assign(SolarSystemModule.prototype, orbitalMechanics);
