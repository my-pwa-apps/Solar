import * as THREE from 'three';
import { TEXTURE_CACHE } from '../TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from '../utils.js';

import { t } from '../i18n-t.js';

export function createNebulae(scene) {
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

export function createHyperrealisticNebula(group, nebData) {
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

export function createNebulaLayer(nebData, colorHex, particleCount, sizeScale, opacity, brightness) {
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

export function createDustLayer(nebData, particleCount) {
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

export function createFilaments(nebData, particleCount) {
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

export function createCentralStar(nebData, index) {
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

export function createPulsar(nebData) {
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

export function createWhiteDwarf(nebData) {
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

export function createConstellations(scene) {
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

export function highlightConstellation(focusedConstellation) {
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

export function resetConstellationHighlight() {
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

export function _addPolarisPointerLine() {
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

export function createGalaxies(scene) {
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

export function _createBackgroundGalaxies(scene) {
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

export function _loadDeepSkySprite(imagePath, onSuccess, onError) {
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

export function _buildAndromedaCanvasTexture() {
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

export function _buildEllipticalGalaxyCanvas(size, color = 0xFFEECC) {
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

export function _buildProceduralGalaxy(group, galData) {
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

export function createNearbyStars(scene) {
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

export function createExoplanets(scene) {
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