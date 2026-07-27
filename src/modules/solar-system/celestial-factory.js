import * as THREE from 'three';
import { TEXTURE_CACHE } from '../TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from '../utils.js';

import { t } from '../i18n-t.js';

export function createSun(scene) {
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

export async function createInnerPlanets(scene) {
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
   }

export async function createOuterPlanets(scene) {
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

export async function createDwarfPlanets(scene) {
    // Pluto already created; add others with texture loaders where available
    // Radii calculated as: diameter_km / 12742 (Earth's diameter in km)
    const catalog = [
        { name: 'Ceres', radius: 0.074, color: 0xC8C8B4, distance: 140, speed: 0.02, rotationSpeed: 0.02, tilt: 4, description: t('descCeres'), funFact: 'May host subsurface brines.', realSize: '939 km diameter', hasRemote: true },
        { name: 'Haumea', radius: 0.125, color: 0xE0D6C8, distance: 2139, speed: 0.00005, rotationSpeed: 0.08, tilt: 28, description: t('descHaumea'), funFact: 'Rotation period ~4 hours gives its triaxial ellipsoid shape.', realSize: '2322 × 1704 × 1026 km (triaxial diameters)' },
        { name: 'Makemake', radius: 0.112, color: 0xD4B48C, distance: 2279, speed: 0.000047, rotationSpeed: 0.01, tilt: 29, description: t('descMakemake'), funFact: 'Discovered near Easter, named after Rapa Nui deity.', realSize: '1430 km diameter' },
        { name: 'Eris', radius: 0.183, color: 0xD8D8D8, distance: 3430, speed: 0.00004, rotationSpeed: 0.01, tilt: 78, description: t('descEris'), funFact: 'Helped prompt Pluto reclassification.', realSize: '2326 km diameter' },
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

export function createPlanetMaterial(config) {
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

// Roughness: continents are matte, oceans get a sharp specular highlight.
// The actual ocean/land roughness map is generated from the loaded color
// texture in _onPlanetTextureSuccess (oceans → ~0.35, land → 0.95). Until
// that map arrives we render fully matte so land never looks plastic.
roughness: 0.95,

// Metalness (Earth's surface is not metallic)
metalness: 0.0,

emissive: 0x000000,
emissiveIntensity: 0,

// No scene.environment is assigned anywhere, so envMapIntensity is a no-op.
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

export function createPlanet(scene, config) {
// Use cached geometry or create new
const segments = CONFIG.QUALITY.sphereSegments;
const geometry = this.getGeometry('sphere', config.radius, segments, segments);

// Create hyperrealistic material based on planet type
const material = this.createPlanetMaterial(config);

const planet = new THREE.Mesh(geometry, material);
planet.position.set(config.distance, 0, 0);
planet.castShadow = false;
planet.receiveShadow = false;
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

export function verifyTextureLoads(delayMs = 4000) {
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

export function createMoon(planet, config) {
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
moon.castShadow = false;
moon.receiveShadow = false;

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
// Tidal locking: defaults to true because every moon currently in the catalog
// (Earth's Moon, Phobos/Deimos, the Galilean moons, Titan/Enceladus/Rhea,
// Titania/Miranda, Triton, Charon) is genuinely tidally locked. Add
// `tidallyLocked: false` to the createMoon config for any irregular or
// chaotic moons (e.g., Hyperion, Phoebe, Nereid) added later.
tidallyLocked: config.tidallyLocked !== undefined ? !!config.tidallyLocked : true
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