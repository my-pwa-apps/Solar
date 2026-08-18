// Extracted from SolarSystemModule.js — methods are mixed into its prototype.
import * as THREE from 'three';
import { DEBUG } from '../utils.js';
import { sunMoonVectors, gmst as astroGmst, subPoint as astroSubPoint } from '../astro/Ephemeris.js';

export const orbitalMechanics = {
setScientificMode(enabled) {
 this.scientificMode = !!enabled;
 this.applyScientificModeSpeeds();
 // Redraw orbit lines to match the new motion model
 // (circles for educational mode, Keplerian ellipses for scientific mode)
 this.updateOrbitalPaths();
 },

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
 },

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
 },

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
 },

_solveKepler(M_rad, e) {
 let E = M_rad + e * Math.sin(M_rad);
 for (let i = 0; i < 12; i++) {
 const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
 E += dE;
 if (Math.abs(dE) < 1e-10) break;
 }
 return E;
 },

_meanToTrueAnomaly(M_rad, e, sqrtPlus, sqrtMinus) {
 if (e < 1e-6) return M_rad; // circular — skip Kepler solver
 const E = this._solveKepler(M_rad, e);
 const sp = sqrtPlus || Math.sqrt(1 + e);
 const sm = sqrtMinus || Math.sqrt(1 - e);
 return 2 * Math.atan2(
 sp * Math.sin(E / 2),
 sm * Math.cos(E / 2)
 );
 },

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
 },

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
 },

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

 // True anomaly is measured from this planet's own perihelion, so without
 // the longitude of perihelion every orbit uses a different zero direction
 // and the planets are not aligned with each other.
 planet.userData.perihelionLon = ((el.varpi || 0) % 360) * Math.PI / 180;

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
 // Add the longitude of perihelion so every orbit shares the vernal
 // equinox as its zero direction; without it each planet's angle is
 // measured from its own perihelion and they do not line up.
 const theta = planet.userData.angle + (planet.userData.perihelionLon || 0);
 planet.position.x = planet.userData.distance * Math.cos(theta);
 planet.position.y = 0;
 planet.position.z = planet.userData.distance * Math.sin(theta);
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
 },

seekToDate(input) {
 const date = input instanceof Date ? input : new Date(input);
 if (isNaN(date.getTime())) {
 if (DEBUG.enabled) console.warn('[TimeMachine] seekToDate: ignored invalid date input', input);
 return;
 }
 this.initPositionsToDate(date);
 // Recompute immediately so a seek that lands on an eclipse shows the
 // shadow before the next animation frame.
 this._applyEarthOrientation(this.simulatedJD);
 this._updateEclipse(true);
 },

_moonDirectionObjectSpace(jd) {
 try {
 const { moon } = sunMoonVectors(jd);
 const g = astroGmst(jd);
 const cosG = Math.cos(g);
 const sinG = Math.sin(g);
 const x = moon.x * cosG + moon.y * sinG;
 const y = moon.z;
 const z = moon.x * sinG - moon.y * cosG;
 const len = Math.hypot(x, y, z);
 if (!len || !isFinite(len)) return null;
 return { x: x / len, y: y / len, z: z / len };
 } catch (err) {
 if (DEBUG.enabled) console.warn('[Eclipse] moon direction failed', err);
 return null;
 }
 },

_updateEclipse(force = false) {
 if (!this.eclipseRenderer) return;

 // Attach lazily; Earth's material does not exist until textures resolve.
 if (!this.eclipseRenderer.uniforms) {
 const earth = this.planets && this.planets.earth;
 if (!earth) return;
 if (!this.eclipseRenderer.attach(earth)) return;
 }

 // ~4 simulated minutes is well under the time the umbra needs to move one
 // of its own diameters, so the shadow still tracks smoothly.
 const jd = this.simulatedJD;
 if (!force && this._lastEclipseJD !== null
 && Math.abs(jd - this._lastEclipseJD) < 0.003) {
 return;
 }
 this._lastEclipseJD = jd;

 try {
 const eclipse = this.eclipseRenderer.update(jd);
 const wasActive = !!(this.currentEclipse && this.currentEclipse.umbraRadiusKm > 0);
 const isActive = !!(eclipse && eclipse.umbraRadiusKm > 0);
 this.currentEclipse = eclipse;

 // Fire on entry, on exit, and while active so the readout's coordinates
 // track the shadow instead of freezing at wherever it first appeared.
 if (wasActive !== isActive || isActive) {
 this._eclipseEventDetail.eclipse = isActive ? eclipse : null;
 window.dispatchEvent(this._eclipseEvent);
 }
 } catch (err) {
 if (DEBUG.enabled) console.warn('[Eclipse] update failed', err);
 }
 },

_applyEarthOrientation(jd) {
 const earth = this.planets && this.planets.earth;
 if (!earth) return;

 try {
 const { sun } = sunMoonVectors(jd);
 const sub = astroSubPoint(sun, jd);

 const lat = sub.latDeg * Math.PI / 180;
 const lon = sub.lonDeg * Math.PI / 180;
 const cosLat = Math.cos(lat);
 // Object-space direction of the sub-solar point, matching the
 // equirectangular convention used by the eclipse shader.
 const sObj = this._earthOrientScratchA.set(
 cosLat * Math.cos(lon),
 Math.sin(lat),
 -cosLat * Math.sin(lon)
 );

 // Scene-space direction from Earth to the Sun (the Sun sits at the origin).
 const sWorld = this._earthOrientScratchB.copy(earth.position).negate();
 if (sWorld.lengthSq() < 1e-9) return;
 sWorld.normalize();

 const q1 = this._earthOrientQuatA.setFromUnitVectors(sObj, sWorld);

 // Where the pole ends up after that shortest-arc rotation.
 const pole = this._earthOrientScratchC.set(0, 1, 0).applyQuaternion(q1);

 // Remove the component along the Sun axis from both the actual and the
 // desired pole, then rotate about the Sun axis to line them up. This
 // preserves the solar declination while fixing which way Earth leans.
 const along = pole.dot(sWorld);
 const polePerp = this._earthOrientScratchD
 .copy(pole).addScaledVector(sWorld, -along);
 const wantPerp = this._earthOrientScratchE
 .set(0, 1, 0).addScaledVector(sWorld, -sWorld.y);

 if (polePerp.lengthSq() > 1e-8 && wantPerp.lengthSq() > 1e-8) {
 polePerp.normalize();
 wantPerp.normalize();
 let angle = Math.acos(Math.min(1, Math.max(-1, polePerp.dot(wantPerp))));
 // Signed rotation about the Sun axis.
 if (this._earthOrientScratchF.crossVectors(polePerp, wantPerp).dot(sWorld) < 0) {
 angle = -angle;
 }
 const q2 = this._earthOrientQuatB.setFromAxisAngle(sWorld, angle);
 earth.quaternion.copy(q2.multiply(q1));
 } else {
 earth.quaternion.copy(q1);
 }
 } catch (err) {
 if (DEBUG.enabled) console.warn('[Eclipse] Earth orientation failed', err);
 }
 },

createOrbitalPaths(scene) {
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
 },

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

 this._updateEclipse();
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
 // Shared zero direction for all orbits (see initPositionsToDate).
 const theta = planet.userData.angle + (planet.userData.perihelionLon || 0);
 planet.position.x = planet.userData.distance * Math.cos(theta);
 planet.position.y = 0;
 planet.position.z = planet.userData.distance * Math.sin(theta);
 }
 
 // REALISTIC PLANET ROTATION based on real astronomical data.
 // Earth is deliberately excluded: _applyEarthOrientation() sets its full
 // orientation from the ephemeris after this loop, so anything written here
 // would be discarded. (The old Earth branch here compared userData.name to
 // 'Earth' while the field holds 'earth', so it never ran at all.)
 if (planet.userData.realRotationPeriod && rotationSpeed !== 0
 && planet !== this.planets.earth) {
 const rotationsComplete = elapsedHours / planet.userData.realRotationPeriod;
 let rotationAngle = (rotationsComplete * Math.PI * 2) + planet.userData.rotationPhase;

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

 // Earth's Moon is steered by the real ephemeris so that its direction
 // from Earth is truthful and eclipses line up with the projected
 // shadow. The orbital *radius* stays exaggerated for legibility.
 // Compared by identity: userData.name is a localised display string.
 if (planet === this.planets.earth && moon.userData.id === 'moon') {
 const dir = this._moonDirectionObjectSpace(this.simulatedJD);
 if (dir) {
 const d = moon.userData.distance;
 moon.position.set(dir.x * d, dir.y * d, dir.z * d);
 moonOrbitalAngle = Math.atan2(moon.position.z, moon.position.x);
 }
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

 // Must run after the loop above, which would otherwise overwrite Earth's
 // orientation with the scene's own (non-ecliptic) rotation formula.
 this._applyEarthOrientation(this.simulatedJD);
 
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

 },

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
 },

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
 },

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
};
