import test from 'node:test';
import assert from 'node:assert/strict';

import {
    solarEclipseAt,
    findNextSolarEclipse
} from '../../src/modules/astro/Eclipse.js';
import {
    julianDay,
    dateFromJulianDay,
    gmst,
    sunPosition,
    moonPosition,
    jdUTtoTT,
    deltaTSeconds,
    EARTH_RADIUS_KM
} from '../../src/modules/astro/Ephemeris.js';

/*
 * These modules are pure maths with no Three.js or DOM dependency, so they are
 * tested directly under Node rather than through a browser. Reference values are
 * the published circumstances of real eclipses (NASA SEcat / EclipseWise).
 *
 * The truncated Meeus lunar series is good to roughly 20 km on the ground,
 * amplified at grazing incidence, so tolerances are set to that rather than to
 * arcsecond precision.
 */

const POLAR_RADIUS_KM = 6356.752314245;
const E2 = 1 - (POLAR_RADIUS_KM ** 2) / (EARTH_RADIUS_KM ** 2);
const rad = (d) => d * Math.PI / 180;

/** Geodetic lat/lon -> geocentric equatorial rectangular (km). */
function geoToEquatorial(latDeg, lonDeg, jd) {
    const phi = rad(latDeg);
    const theta = rad(lonDeg) + gmst(jd);
    const N = EARTH_RADIUS_KM / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
    return {
        x: N * Math.cos(phi) * Math.cos(theta),
        y: N * Math.cos(phi) * Math.sin(theta),
        z: N * (1 - E2) * Math.sin(phi)
    };
}

/** Perpendicular distance from a point to the shadow axis, in km. */
function perpDistanceToAxis(p, eclipse) {
    const m = eclipse.moon;
    const d = eclipse.shadowAxis;
    const v = { x: p.x - m.x, y: p.y - m.y, z: p.z - m.z };
    const t = v.x * d.x + v.y * d.y + v.z * d.z;
    return Math.hypot(v.x - t * d.x, v.y - t * d.y, v.z - t * d.z);
}

test('Julian Day round-trips and matches the J2000 epoch', () => {
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    assert.ok(Math.abs(julianDay(j2000) - 2451545.0) < 1e-6);

    const d = new Date(Date.UTC(2026, 7, 12, 17, 47, 6));
    const back = dateFromJulianDay(julianDay(d));
    assert.ok(Math.abs(back.getTime() - d.getTime()) < 2);
});

test('deltaT is applied in the right direction and is plausible for 2026', () => {
    const jd = julianDay(new Date(Date.UTC(2026, 0, 1)));
    const dt = deltaTSeconds(jd);
    // Observed deltaT has sat near 69-70 s through the 2020s.
    assert.ok(dt > 60 && dt < 80, `deltaT ${dt} outside plausible range`);
    // TT runs ahead of UT, so the converted instant must be later.
    assert.ok(jdUTtoTT(jd) > jd);
});

test('GMST advances by roughly one sidereal day per solar day', () => {
    const jd = julianDay(new Date(Date.UTC(2026, 7, 12)));
    const a = gmst(jd);
    const b = gmst(jd + 1);
    let delta = b - a;
    while (delta < 0) delta += 2 * Math.PI;
    // A solar day advances sidereal time by ~360.9856 degrees, i.e. ~0.9856
    // degrees more than a full turn.
    assert.ok(Math.abs(delta - rad(0.9856)) < rad(0.01), `GMST delta ${delta}`);
});

test('solar declination follows the seasons', () => {
    const decOf = (m, d) => {
        const jd = jdUTtoTT(julianDay(new Date(Date.UTC(2026, m, d, 12))));
        const s = sunPosition(jd);
        // Ecliptic latitude is ~0; declination follows from obliquity.
        return Math.asin(Math.sin(rad(s.lonDeg)) * Math.sin(rad(23.44))) / rad(1);
    };
    assert.ok(Math.abs(decOf(5, 21) - 23.44) < 0.5, 'June solstice');
    assert.ok(Math.abs(decOf(11, 21) + 23.44) < 0.5, 'December solstice');
    assert.ok(Math.abs(decOf(2, 20)) < 1.5, 'March equinox');
});

test('the Moon stays within its real distance and latitude range', () => {
    let minD = Infinity, maxD = -Infinity, maxLat = 0;
    const start = julianDay(new Date(Date.UTC(2026, 0, 1)));
    for (let d = 0; d < 365; d += 0.5) {
        const m = moonPosition(jdUTtoTT(start + d));
        minD = Math.min(minD, m.distanceKm);
        maxD = Math.max(maxD, m.distanceKm);
        maxLat = Math.max(maxLat, Math.abs(m.latDeg));
    }
    // Perigee ~356,500 km, apogee ~406,700 km.
    assert.ok(minD > 355000 && minD < 362000, `perigee ${minD}`);
    assert.ok(maxD > 403000 && maxD < 408000, `apogee ${maxD}`);
    // The lunar orbit is inclined ~5.15 degrees to the ecliptic.
    assert.ok(maxLat > 4.9 && maxLat < 5.4, `max ecliptic latitude ${maxLat}`);
});

test('reproduces the 12 Aug 2026 total eclipse (Spain and Iceland)', () => {
    const e = solarEclipseAt(julianDay(new Date(Date.UTC(2026, 7, 12, 17, 47, 6))));
    assert.equal(e.type, 'total');
    // Published gamma 0.8977, magnitude 1.0386.
    assert.ok(Math.abs(e.gamma - 0.8977) < 0.005, `gamma ${e.gamma}`);
    assert.ok(Math.abs(e.magnitude - 1.0386) < 0.005, `magnitude ${e.magnitude}`);
    // Published greatest eclipse 65.2 N 25.2 W. Grazing geometry amplifies the
    // series error here, hence the wider bound.
    assert.ok(Math.abs(e.latDeg - 65.2) < 1.0, `lat ${e.latDeg}`);
    assert.ok(Math.abs(e.lonDeg + 25.2) < 1.0, `lon ${e.lonDeg}`);
});

test('reproduces the 8 Apr 2024 total eclipse, where geometry is less sensitive', () => {
    const e = solarEclipseAt(julianDay(new Date(Date.UTC(2024, 3, 8, 18, 17, 16))));
    assert.equal(e.type, 'total');
    assert.ok(Math.abs(e.gamma - 0.3431) < 0.005, `gamma ${e.gamma}`);
    assert.ok(Math.abs(e.magnitude - 1.0566) < 0.005, `magnitude ${e.magnitude}`);
    assert.ok(Math.abs(e.latDeg - 25.3) < 0.5, `lat ${e.latDeg}`);
    assert.ok(Math.abs(e.lonDeg + 104.1) < 0.5, `lon ${e.lonDeg}`);
});

test('reproduces the 2 Aug 2027 total eclipse', () => {
    const e = solarEclipseAt(julianDay(new Date(Date.UTC(2027, 7, 2, 10, 7, 50))));
    assert.equal(e.type, 'total');
    assert.ok(Math.abs(e.gamma - 0.1421) < 0.005, `gamma ${e.gamma}`);
    assert.ok(Math.abs(e.magnitude - 1.0790) < 0.005, `magnitude ${e.magnitude}`);
});

test('places totality over northern Spain and excludes Madrid and Barcelona', () => {
    const cities = {
        'A Coruna': [43.362, -8.412, true],
        Bilbao: [43.263, -2.935, true],
        Leon: [42.599, -5.567, true],
        Zaragoza: [41.649, -0.888, true],
        Palma: [39.570, 2.650, true],
        Madrid: [40.417, -3.704, false],
        Barcelona: [41.385, 2.173, false],
        Lisbon: [38.722, -9.139, false],
        Paris: [48.857, 2.352, false]
    };

    const best = {};
    for (const name of Object.keys(cities)) best[name] = { d: Infinity, umbra: 0 };

    const base = Date.UTC(2026, 7, 12, 17, 30, 0);
    for (let s = 0; s <= 5400; s += 4) {
        const jd = julianDay(new Date(base + s * 1000));
        const e = solarEclipseAt(jd);
        // Only meaningful while the umbra is on the globe; this is a sunset
        // eclipse, so the axis departs before eastern sites reach their
        // geometric closest approach.
        if (e.umbraRadiusKm <= 0) continue;
        for (const [name, coords] of Object.entries(cities)) {
            const p = geoToEquatorial(coords[0], coords[1], jd);
            const dist = perpDistanceToAxis(p, e);
            if (dist < best[name].d) best[name] = { d: dist, umbra: e.umbraRadiusKm };
        }
    }

    for (const [name, coords] of Object.entries(cities)) {
        const inside = best[name].d <= best[name].umbra;
        assert.equal(inside, coords[2],
            `${name}: perp ${best[name].d.toFixed(0)} km vs umbra ${best[name].umbra.toFixed(0)} km`);
    }
});

test('reports no central eclipse on an ordinary day', () => {
    const e = solarEclipseAt(julianDay(new Date(Date.UTC(2026, 7, 20))));
    assert.equal(e.isEclipse, false);
    assert.equal(e.umbraRadiusKm, 0);
});

test('never reports an eclipse when the Moon is behind the Earth', () => {
    // Full moon a fortnight after the August 2026 new moon: the Moon is on the
    // anti-solar side, so the shadow axis must be rejected outright.
    const e = solarEclipseAt(julianDay(new Date(Date.UTC(2026, 7, 28, 4, 12))));
    assert.equal(e.umbraRadiusKm, 0);
});

test('the eclipse finder locates the August 2026 event and then moves past it', () => {
    const first = findNextSolarEclipse(julianDay(new Date(Date.UTC(2026, 7, 1))), 30);
    assert.ok(first, 'expected to find the 2026-08-12 eclipse');
    assert.equal(first.eclipse.type, 'total');
    const iso = dateFromJulianDay(first.jd).toISOString();
    assert.equal(iso.slice(0, 10), '2026-08-12');
    const mins = Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16));
    // Published greatest eclipse 17:47 UTC; the gamma minimum is very flat.
    assert.ok(mins > 17 * 60 + 40 && mins < 17 * 60 + 55, `found at ${iso}`);

    // Searching again from just after must not return the same event.
    const second = findNextSolarEclipse(first.jd + 1, 400);
    assert.ok(second, 'expected a subsequent eclipse');
    assert.ok(second.jd > first.jd + 20, 'finder returned the same eclipse again');
});

test('classifies an annular eclipse distinctly from a total one', () => {
    // 17 Feb 2026 annular eclipse over Antarctica.
    const e = solarEclipseAt(julianDay(new Date(Date.UTC(2026, 1, 17, 12, 12, 0))));
    assert.equal(e.type, 'annular');
    // Annular means the Moon fails to cover the Sun.
    assert.ok(e.magnitude < 1, `magnitude ${e.magnitude} should be below 1`);
});

test('handles a far-future date without producing NaN', () => {
    const e = solarEclipseAt(julianDay(new Date(Date.UTC(2099, 5, 1))));
    assert.ok(Number.isFinite(e.gamma));
    assert.ok(Number.isFinite(e.shadowAxis.x));
});
