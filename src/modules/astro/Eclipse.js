/**
 * Eclipse — solar eclipse geometry derived from real Sun/Moon ephemeris.
 *
 * The scene deliberately draws the Moon at ~4 Earth radii instead of the true
 * ~60, so a correct shadow cannot emerge from the rendered geometry. Everything
 * here is therefore computed analytically in real kilometres from the ephemeris
 * and only afterwards projected onto the Earth mesh for display.
 *
 * Method: build the shadow axis as the ray from the Sun's centre through the
 * Moon's centre, intersect it with Earth's sphere, then size the umbral and
 * penumbral cones at that intersection.
 */

import {
    EARTH_RADIUS_KM,
    MOON_RADIUS_KM,
    SUN_RADIUS_KM,
    gmst,
    sunMoonVectors
} from './Ephemeris.js';

const DEG = Math.PI / 180;

// WGS-84. The shadow axis meets Earth at a very shallow angle during a large
// eclipse, so the 21 km difference between the equatorial and polar radii moves
// the intersection point by the better part of a degree. A sphere is not good
// enough here.
const EARTH_POLAR_RADIUS_KM = 6356.752314245;
const E_SQ = 1 - (EARTH_POLAR_RADIUS_KM * EARTH_POLAR_RADIUS_KM)
    / (EARTH_RADIUS_KM * EARTH_RADIUS_KM);

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a) => Math.hypot(a.x, a.y, a.z);
const scale = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const unit = (a) => scale(a, 1 / len(a));

/**
 * Smallest positive ray parameter where `origin + t*dir` meets the WGS-84
 * ellipsoid, or null if it misses. `dir` must be a unit vector; `t` is then in
 * kilometres along the ray.
 */
function intersectEllipsoid(origin, dir) {
    const a = EARTH_RADIUS_KM;
    const b = EARTH_POLAR_RADIUS_KM;

    // Squash z so the ellipsoid becomes a unit sphere; t is unchanged.
    const ox = origin.x / a, oy = origin.y / a, oz = origin.z / b;
    const dx = dir.x / a, dy = dir.y / a, dz = dir.z / b;

    const A = dx * dx + dy * dy + dz * dz;
    const B = ox * dx + oy * dy + oz * dz;
    const C = ox * ox + oy * oy + oz * oz - 1;

    const disc = B * B - A * C;
    if (disc < 0) return null;

    const t = (-B - Math.sqrt(disc)) / A;
    return t >= 0 ? t : null;
}

/**
 * Full solar-eclipse state at a given Julian Day.
 *
 * @param {number} jd Julian Day (UTC)
 * @returns {{
 *   isEclipse: boolean,
 *   type: 'none'|'partial'|'total'|'annular',
 *   latDeg: number|null, lonDeg: number|null,
 *   umbraRadiusKm: number, penumbraRadiusKm: number,
 *   magnitude: number, gamma: number,
 *   shadowAxis: {x:number,y:number,z:number},
 *   shadowPoint: {x:number,y:number,z:number}|null,
 *   sun: object, moon: object
 * }}
 */
export function solarEclipseAt(jd) {
    const { sun, moon } = sunMoonVectors(jd);

    // Shadow axis: from the Sun's centre through the Moon's centre, pointing
    // away from the Sun (i.e. down-shadow towards Earth).
    const sunToMoon = sub(moon, sun);
    const axis = unit(sunToMoon);
    const sunMoonDistKm = len(sunToMoon);

    // Perpendicular distance from Earth's centre to the axis. `gamma` is this
    // distance in Earth radii, the standard eclipse parameter.
    const tClosest = -dot(moon, axis);
    const closestPoint = add(moon, scale(axis, tClosest));
    const axisMissKm = len(closestPoint);
    const gamma = axisMissKm / EARTH_RADIUS_KM;

    // Umbral and penumbral cone vertex distances measured from the Moon.
    const umbraVertexKm = (MOON_RADIUS_KM * sunMoonDistKm) / (SUN_RADIUS_KM - MOON_RADIUS_KM);
    const penumbraVertexKm = (MOON_RADIUS_KM * sunMoonDistKm) / (SUN_RADIUS_KM + MOON_RADIUS_KM);

    const result = {
        isEclipse: false,
        type: 'none',
        latDeg: null,
        lonDeg: null,
        umbraRadiusKm: 0,
        penumbraRadiusKm: 0,
        magnitude: 0,
        gamma,
        shadowAxis: axis,
        shadowPoint: null,
        sun,
        moon
    };

    // The Moon must be between the Sun and Earth for a solar eclipse; if the
    // Moon is beyond Earth along the axis there is nothing to draw.
    if (tClosest < 0) return result;

    const tHit = intersectEllipsoid(moon, axis);

    // Radii of the two cones where they cross Earth's centre plane. Used both
    // for the central case and to decide whether a partial eclipse occurs.
    const penumbraAtClosest = MOON_RADIUS_KM * (1 + tClosest / penumbraVertexKm);

    if (tHit === null) {
        // Axis misses Earth. A partial eclipse still occurs if the penumbra
        // sweeps the limb.
        if (axisMissKm < EARTH_RADIUS_KM + penumbraAtClosest) {
            result.isEclipse = true;
            result.type = 'partial';
            result.penumbraRadiusKm = penumbraAtClosest;
            result.magnitude = Math.max(0,
                (EARTH_RADIUS_KM + penumbraAtClosest - axisMissKm) / (2 * EARTH_RADIUS_KM));
            // Report the closest approach direction so the penumbra can still
            // be drawn grazing the limb.
            const dir = unit(closestPoint);
            const surface = scale(dir, EARTH_RADIUS_KM);
            result.shadowPoint = surface;
            Object.assign(result, subPointOf(surface, jd));
        }
        return result;
    }

    const t = tHit;
    const surface = add(moon, scale(axis, t));

    // Cone radii at the point where the axis meets the surface.
    const umbraRadiusKm = MOON_RADIUS_KM * (1 - t / umbraVertexKm);
    const penumbraRadiusKm = MOON_RADIUS_KM * (1 + t / penumbraVertexKm);

    result.isEclipse = true;
    // A negative umbral radius means the axis passed the cone vertex before
    // reaching the surface: the Moon is too far to cover the Sun, so an
    // annular eclipse (antumbra) is seen instead of a total one.
    result.type = umbraRadiusKm >= 0 ? 'total' : 'annular';
    result.umbraRadiusKm = Math.abs(umbraRadiusKm);
    result.penumbraRadiusKm = penumbraRadiusKm;
    result.shadowPoint = surface;

    // Ratio of apparent angular diameters at the sub-solar point.
    const moonDistAtSurface = t;
    const sunDistAtSurface = len(sub(surface, sun));
    result.magnitude = (MOON_RADIUS_KM / moonDistAtSurface) / (SUN_RADIUS_KM / sunDistAtSurface);

    Object.assign(result, subPointOf(surface, jd));
    return result;
}

/**
 * Earth-centred equatorial point -> geodetic latitude / east longitude.
 *
 * Published eclipse coordinates are geodetic, which differs from the geocentric
 * value by up to ~0.19 degrees at mid latitudes.
 */
function subPointOf(vec, jd) {
    const p = Math.hypot(vec.x, vec.y);
    // Exact for a point lying on the ellipsoid surface.
    const latGeodetic = Math.atan2(vec.z, (1 - E_SQ) * p);
    const ra = Math.atan2(vec.y, vec.x);
    let lon = (ra - gmst(jd)) / DEG;
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    return { latDeg: latGeodetic / DEG, lonDeg: lon };
}

/**
 * Scan forward (or backward) for the moment of greatest eclipse.
 *
 * Uses a coarse sweep on the axis-miss distance to bracket a minimum, then a
 * golden-section refinement. Returns null if nothing is found in the window.
 *
 * @param {number} startJd Julian Day to start from
 * @param {number} [searchDays=400] how far to look; negative searches backwards
 * @returns {{jd:number, eclipse:object}|null}
 */
export function findNextSolarEclipse(startJd, searchDays = 400) {
    const dir = Math.sign(searchDays) || 1;
    const span = Math.abs(searchDays);
    const coarseStep = 0.25; // days

    // Sliding window of three samples so each instant is evaluated once. The
    // lunar series is expensive and this runs synchronously on the main thread.
    let jdA = startJd;
    let a = axisMiss(jdA);
    let jdB = startJd + dir * coarseStep;
    let b = axisMiss(jdB);

    for (let d = 2 * coarseStep; d <= span + coarseStep; d += coarseStep) {
        const jdC = startJd + dir * d;
        const c = axisMiss(jdC);

        // Local minimum of the axis-miss distance, close enough to be an eclipse.
        if (b < a && b < c && b < 2.0) {
            const refined = refineMinimum(jdA, jdC);
            const eclipse = solarEclipseAt(refined);
            if (eclipse.isEclipse) return { jd: refined, eclipse };
        }

        jdA = jdB; a = b;
        jdB = jdC; b = c;
    }
    return null;
}

/** Axis-miss distance in Earth radii (the eclipse `gamma`). */
function axisMiss(jd) {
    const { sun, moon } = sunMoonVectors(jd);
    const axis = unit(sub(moon, sun));
    const tClosest = -dot(moon, axis);
    if (tClosest < 0) return Number.POSITIVE_INFINITY;
    return len(add(moon, scale(axis, tClosest))) / EARTH_RADIUS_KM;
}

/** Golden-section search for the minimum of axisMiss on [a, b]. */
function refineMinimum(a, b) {
    const phi = (Math.sqrt(5) - 1) / 2;
    let lo = Math.min(a, b);
    let hi = Math.max(a, b);
    let c = hi - phi * (hi - lo);
    let d = lo + phi * (hi - lo);
    let fc = axisMiss(c);
    let fd = axisMiss(d);

    // ~1 second precision is far finer than the shadow can be drawn.
    for (let i = 0; i < 60 && (hi - lo) > 1e-5; i++) {
        if (fc < fd) {
            hi = d; d = c; fd = fc;
            c = hi - phi * (hi - lo);
            fc = axisMiss(c);
        } else {
            lo = c; c = d; fc = fd;
            d = lo + phi * (hi - lo);
            fd = axisMiss(d);
        }
    }
    return (lo + hi) / 2;
}
