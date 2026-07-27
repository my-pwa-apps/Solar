import * as THREE from 'three';
import { TEXTURE_CACHE } from '../TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from '../utils.js';

import { t } from '../i18n-t.js';

export function setScientificMode(enabled) {
this.scientificMode = !!enabled;
this.applyScientificModeSpeeds();
// Redraw orbit lines to match the new motion model
// (circles for educational mode, Keplerian ellipses for scientific mode)
this.updateOrbitalPaths();
}

export function applyScientificModeSpeeds() {
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

export function toJulianDate(date) {
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

export function _sunRA(daysSinceJ2000) {
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

export function _solveKepler(M_rad, e) {
let E = M_rad + e * Math.sin(M_rad);
for (let i = 0; i < 12; i++) {
const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
E += dE;
if (Math.abs(dE) < 1e-10) break;
}
return E;
}

export function _meanToTrueAnomaly(M_rad, e, sqrtPlus, sqrtMinus) {
if (e < 1e-6) return M_rad; // circular — skip Kepler solver
const E = this._solveKepler(M_rad, e);
const sp = sqrtPlus || Math.sqrt(1 + e);
const sm = sqrtMinus || Math.sqrt(1 - e);
return 2 * Math.atan2(
sp * Math.sin(E / 2),
sm * Math.cos(E / 2)
);
}

export function _probePositionAtJD(traj, jd) {
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

export function _initSpacecraftToDate(jd) {
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

export function initPositionsToDate(date) {
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

// Update trajectory-based spacecraft positions (Voyagers, Pioneers, New Horizons)
this._initSpacecraftToDate(jd);

if (DEBUG.enabled) console.log(`[Ephemeris] Positions initialised to ${date.toUTCString().slice(0, 16)} (JD ${jd.toFixed(1)})`);
}

export function createAsteroidBelt(scene) {
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

export function createKuiperBelt(scene) {
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

export function createHeliopause(scene) {
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

export function createOortCloud(scene) {
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

export function createOrbitalPaths(scene) {
this.orbitsVisible = true; // Default
this.cometOrbitsVisible = true; // Default
this.orbits = [];

const planetsToOrbit = Object.keys(this.planets).filter(k => {
// Only draw a heliocentric orbit for bodies that actually orbit the sun.
// Guards against future entries (barycenters, system roots, etc.) that
// happen to be stored in this.planets but have no real heliocentric path.
const ud = this.planets[k]?.userData;
return ud && typeof ud.distance === 'number' && ud.distance > 0;
});

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

export function createStarfield(scene) {
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

export function createMilkyWay(scene) {
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

export function _createMilkyWayGalaxyDisc(scene) {
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

export function _generateProceduralMilkyWay(texSize) {
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

export function _buildMilkyWayDisc(scene, texture, texSize, solarX, solarY) {
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

export function _createMilkyWaySolarLocator(discSize, texSize, solarX, solarY) {
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

export function _buildMilkyWaySolarLabelTexture() {
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

export function refreshLocalizedAssets() {
const labelSprite = this.milkyWaySolarLocator?.userData?.labelSprite;
if (!labelSprite?.material) return;

const nextTexture = this._buildMilkyWaySolarLabelTexture();
const previousTexture = labelSprite.material.map;
labelSprite.material.map = nextTexture;
labelSprite.material.needsUpdate = true;
this.milkyWaySolarLocator.userData.labelTexture = nextTexture;
if (previousTexture) previousTexture.dispose();
}

export function update(deltaTime, timeSpeed, camera, controls) {
// Safety check for deltaTime
if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
if (DEBUG.enabled) console.warn(' Invalid deltaTime:', deltaTime, '- skipping frame');
return;
}

// Get pause mode from sceneManager (this.app is injected via SolarSystemModule constructor)
const app = this.app || {};
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

// Advance the simulated Julian Date. Consumed by initPositionsToDate() callers
// and available for future date read-outs; no per-frame event is dispatched
// because nothing listens for one (the Time Machine UI was removed).
this.simulatedJD += (deltaTime * this.timeAcceleration * orbitalSpeed) / 86400;
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
// Use the post-tilt world-XZ azimuth so tidal lock stays correct for
// inclined orbits (Triton ~157°, Miranda ~4°, Moon ~5°). Pre-tilt theta
// would drift the locked face off the planet for any non-zero inclination.
moonOrbitalAngle = Math.atan2(moon.position.z, moon.position.x);
} else {
const adj = moon.userData.angle + parentRotY;
moon.position.x = moon.userData.distance * Math.cos(adj);
moon.position.z = moon.userData.distance * Math.sin(adj);
moon.position.y = 0;
moonOrbitalAngle = adj;
}

// REALISTIC MOON ROTATION based on real astronomical data.
// Tidally-locked moons are evaluated even when rotationSpeed === 0 (paused
// sim) so the locked face stays oriented toward the parent planet.
if (moon.userData.tidallyLocked || (moon.userData.realRotationPeriod && rotationSpeed !== 0)) {
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

// Rotate asteroid and Kuiper belts so they orbit WITH the dwarf planets
// embedded in them. Use the same orbital formula (orbitalSpeed * deltaTime,
// pause-aware) as the planet loop, keyed to a representative member:
//   - Asteroid belt  ↔ Ceres   (speed 0.02)   so Ceres stays in the belt
//   - Kuiper belt     ↔ Pluto   (speed 0.00004) so Pluto/KBOs stay embedded
// A rigid group rotation can't reproduce true differential motion across the
// belt width, but matching the dominant member keeps focus-tracked dwarf
// planets visually locked to their belt instead of sliding past it.
if (this.asteroidBelt) {
const rotationIncrement = 0.02 * orbitalSpeed * deltaTime;
if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
this.asteroidBelt.rotation.y += rotationIncrement;
}
}
if (this.kuiperBelt) {
const rotationIncrement = 0.00004 * orbitalSpeed * deltaTime;
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

// Special handling for James Webb Space Telescope: keep it at Sun-Earth L2 Lagrange point
if (userData.name === 'James Webb Space Telescope') {
const earth = this.planets.earth;
if (earth) {
const earthDist = earth.userData.distance || (this.realisticScale ? 150 : 51);
const jwstDist = this.realisticScale ? 155 : 55;
const ratio = jwstDist / earthDist;
craft.position.copy(earth.position).multiplyScalar(ratio);
userData.distance = jwstDist;
userData.angle = earth.userData.angle || Math.atan2(earth.position.z, earth.position.x);

// Face JWST directly away from the Sun (so sunshield faces Sun, mirror faces deep space)
const sunDirection = this._camRadial.copy(craft.position).normalize();
const targetLook = this._camTangent.copy(craft.position).add(sunDirection);
craft.lookAt(targetLook);
}
}
// Legacy angle-based probes (non-trajectory, e.g. JWST): keep simple orbit
else if (!userData.orbitPlanet && !userData.trajectory && userData.speed) {
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

// Update camera tracking AFTER all object positions have been updated this frame.
// Keeping this after spacecraft avoids a one-frame focus lag that is very visible
// at JWST's close inspection distance.
this.updateCameraTracking(camera, controls);

// Keep starfield and Milky Way band centred on the camera so their sphere
// boundaries are never visible and they always appear around the observer.
if (this.starfield && camera) {
this.starfield.position.copy(camera.position);
}
if (this.milkyWay && camera) {
this.milkyWay.position.copy(camera.position);
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

export function cleanup(scene) {
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

export function getSelectableObjects() {
return this.objects;
}

export function setOrbitMode(mode) {
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

export function toggleOrbits(visible) {
this.setOrbitMode(visible ? 'all' : 'none');
}

export function toggleConstellations(visible) {
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

export function updateScale() {
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
eris: 3430,    // ~67 AU - scattered disk (semi-major axis ~67.9 AU); matches Gonggong's ~67.5 AU placement
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

export function updateOrbitalPaths() {
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
// Scale segment count so arc-chord deviation stays below ~0.1× planet radius
// (20 units per segment arc gives ~0.025 units deviation at Pluto's scale)
const segments = Math.min(1024, Math.max(128, Math.round(2 * Math.PI * distance / 20)));
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

export function updateBelts() {
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

export function updateSpacecraftPositions() {
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

if (userData.name === 'James Webb Space Telescope') {
const earth = this.planets.earth;
if (earth) {
const earthDist = earth.userData.distance || (this.realisticScale ? 150 : 51);
const jwstDist = this.realisticScale ? 155 : 55;
const ratio = jwstDist / earthDist;
spacecraft.position.copy(earth.position).multiplyScalar(ratio);
userData.distance = jwstDist;
userData.angle = earth.userData.angle || Math.atan2(earth.position.z, earth.position.x);

const sunDirection = spacecraft.position.clone().normalize();
const targetLook = spacecraft.position.clone().add(sunDirection);
spacecraft.lookAt(targetLook);
if (DEBUG.enabled) console.log(` ${userData.name}: aligned at L2 Lagrange point`);
}
} else {
const newDistance = spacecraftScaleFactors[userData.name];
if (newDistance && userData.angle !== undefined) {
userData.distance = newDistance;
spacecraft.position.x = newDistance * Math.cos(userData.angle);
spacecraft.position.z = newDistance * Math.sin(userData.angle);
if (DEBUG.enabled) console.log(` ${userData.name}: ${newDistance} units`);
}
}
});

if (DEBUG.enabled) console.log(` Spacecraft positions updated for ${this.realisticScale ? 'realistic' : 'educational'} scale`);
}

export function updateCometPositions() {
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

export function updateCometOrbitLines() {
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

export function updateDeepSpaceObjects() {
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

export function getObjectInfo(object) {
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

export function focusOnObject(object, camera, controls) {
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
 distance = Math.max(actualRadius * 15, 0.45);
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
 distance = Math.max(actualRadius * 15, 0.45);
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

 // Adjust time speed based on object type (this.app is injected via SolarSystemModule constructor)
 // Fast-moving orbital objects (ISS, satellites) need slower time for observation
 const app = this.app;
 if (userData.isSpacecraft && userData.orbitPlanet && !isPlanetOrbitingSun) {
     // Orbital spacecraft (ISS, satellites): slow to 0.1x for detailed observation
     if (app && app.timeSpeed !== 0) {
         app.timeSpeed = 0.1;
         // Sync speed slider UI
         const sl = document.getElementById('time-speed');
         if (sl && app.uiManager) { sl.value = app.uiManager.speedToSlider(0.1); sl.dispatchEvent(new Event('input')); }
         if (DEBUG.enabled) console.log(` [Time Speed] Reduced to 0.1x for orbital spacecraft observation`);
     }
 } else if (userData.type === 'planet' || userData.type === 'DwarfPlanet' || userData.isPlanet) {
     if (app && app.timeSpeed !== 0 && app.timeSpeed !== 1) {
         app.timeSpeed = 1;
         // Sync speed slider UI
         const sl = document.getElementById('time-speed');
         if (sl && app.uiManager) { sl.value = app.uiManager.speedToSlider(1); sl.dispatchEvent(new Event('input')); }
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
     if (userData.name === 'James Webb Space Telescope') {
         // Cinematic three-quarter viewing offset to view the golden primary mirror
         // The mirror faces away from the Sun (direction of sunVector). We want to position the camera
         // in that hemisphere (so it looks back at the mirror grid) but rotated slightly to the side (three-quarter view)
         // and elevated.
         const sunVector = new THREE.Vector3().copy(targetPosition).normalize(); // pointing away from Sun
         const skyNormal = new THREE.Vector3(0, 1, 0);
         const sideVector = new THREE.Vector3().crossVectors(skyNormal, sunVector).normalize();
         
         // Combine sunVector (projecting forward from the instrument side) and sideVector for cinematic 3/4 view
         const viewDir = new THREE.Vector3()
             .addScaledVector(sunVector, 0.707)
             .addScaledVector(sideVector, 0.707)
             .normalize();
             
         endPos = new THREE.Vector3().copy(targetPosition)
             .addScaledVector(viewDir, distance)
             .addScaledVector(skyNormal, distance * 0.4); // slightly elevated
             
         controls.target.copy(targetPosition);
         
         // Enable chase-cam following for smooth, jitter-free JWST tracking
         this.cameraFollowMode = true;
         this.cameraCoRotateMode = true;
         
         if (DEBUG.enabled) console.log(` [JWST Cinematic View] Target position: (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)}), Camera position: (${endPos.x.toFixed(2)}, ${endPos.y.toFixed(2)}, ${endPos.z.toFixed(2)}), distance: ${distance.toFixed(3)}`);
     } else {
         // Other spacecraft without orbit: position camera at a fixed offset
         endPos = new THREE.Vector3(
             targetPosition.x,
             targetPosition.y + distance * 0.3,
             targetPosition.z + distance
         );
         controls.target.copy(targetPosition);
     }
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
export function onControlsInteractionStart() {
if (this._focusTransitionActive) {
this._focusTransitionCancelRequested = true;
}
// User grabbed manual control — stop auto-orbit so camera doesn't fight the drag.
// cameraFollowMode stays true so the target keeps tracking the focused object.
if (this._activeControls) {
this._activeControls.autoRotate = false;
}
}

export function onControlsZoom() {
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

export function updateCameraTracking(camera, controls) {
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

if (this.cameraCoRotateMode) {
// CO-ROTATION MODE: Camera orbits WITH objects that orbit a parent body (or Sun as center)
// while preserving user zoom and pan input.

const parentKey = (userData.orbitPlanet || userData.parentPlanet || '').toLowerCase();
const parentPlanet = this.planets[parentKey];
const parentPosition = parentPlanet ? parentPlanet.position : this._focusScratch.sunPosition.set(0, 0, 0);

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
const radialDirection = this._camRadial.copy(targetPosition).sub(parentPosition);
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

// Keep looking at the object plus user pan offset.
controls.target.copy(targetPosition).add(panOffset);
this._cameraFollowObject = object;
this._cameraFollowLastTargetPos.copy(targetPosition);
// No controls.update() here; SceneManager.animate() calls it once per frame.
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

export function createLabels() {
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

export function toggleLabels(visible) {
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

export function getQuickNavTargets() {
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
