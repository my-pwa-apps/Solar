/**
 * Ephemeris — real astronomical positions for the Sun and Moon.
 *
 * Algorithms follow Jean Meeus, "Astronomical Algorithms" (2nd ed.):
 *   - Sun:  chapter 25 (geometric + apparent longitude)
 *   - Moon: chapter 47 (ELP-2000/82 truncated series, tables 47.A / 47.B)
 *   - Sidereal time: chapter 12
 *
 * Accuracy of the truncated lunar series is ~10" in longitude and ~4" in
 * latitude, which places the eclipse shadow on Earth to within a few tens of
 * kilometres — well inside the ~300 km umbra this is used to draw.
 *
 * All angles are radians unless a name ends in `Deg`. Distances are kilometres.
 */

const DEG = Math.PI / 180;
const J2000 = 2451545.0;

export const AU_KM = 149597870.7;
export const EARTH_RADIUS_KM = 6378.137;
export const MOON_RADIUS_KM = 1737.4;
export const SUN_RADIUS_KM = 696000.0;

const norm360 = (d) => ((d % 360) + 360) % 360;

/** Julian Day from a JS Date (UTC). */
export function julianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
}

/** JS Date (UTC) from a Julian Day. */
export function dateFromJulianDay(jd) {
    return new Date((jd - 2440587.5) * 86400000);
}

/** Julian centuries since J2000.0. */
export function julianCenturies(jd) {
    return (jd - J2000) / 36525;
}

/**
 * Difference between Terrestrial Time and UT1, in seconds.
 *
 * The Meeus series are expressed in TT while Earth's rotation angle is tied to
 * UT, so an eclipse computed without this correction lands roughly 70 s of
 * shadow motion away from the truth. Polynomials from Espenak & Meeus,
 * "Five Millennium Canon of Solar Eclipses" (NASA/TP-2006-214141).
 */
export function deltaTSeconds(jd) {
    // Decimal year, good enough for selecting the polynomial branch.
    const y = 2000 + (jd - J2000) / 365.25;

    if (y >= 2005 && y < 2050) {
        const t = y - 2000;
        return 62.92 + 0.32217 * t + 0.005589 * t * t;
    }
    if (y >= 1986 && y < 2005) {
        const t = y - 2000;
        return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t
            + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
    }
    if (y >= 2050 && y < 2150) {
        const u = (y - 1820) / 100;
        return -20 + 32 * u * u - 0.5628 * (2150 - y);
    }
    // Long-term parabolic fit outside the tabulated range.
    const u = (y - 1820) / 100;
    return -20 + 32 * u * u;
}

/** Convert a UT Julian Day to the Terrestrial Time scale the series expect. */
export function jdUTtoTT(jdUT) {
    return jdUT + deltaTSeconds(jdUT) / 86400;
}

/**
 * Nutation in longitude (Meeus 22.1, principal terms), in degrees.
 *
 * Both the Sun and the Moon must carry this term for their longitudes to be
 * apparent coordinates referred to the true equinox of date, which is what the
 * true obliquity returned by `obliquity()` assumes.
 */
export function nutationInLongitude(jd) {
    const T = julianCenturies(jd);
    const omega = (125.04452 - 1934.136261 * T) * DEG;
    const L = (280.4665 + 36000.7698 * T) * DEG;   // Sun's mean longitude
    const Lp = (218.3165 + 481267.8813 * T) * DEG; // Moon's mean longitude

    const arcsec = -17.20 * Math.sin(omega)
        - 1.32 * Math.sin(2 * L)
        - 0.23 * Math.sin(2 * Lp)
        + 0.21 * Math.sin(2 * omega);
    return arcsec / 3600;
}

/**
 * Mean obliquity of the ecliptic plus the nutation term that matters at this
 * precision (Meeus 22.2 / 25.8). Returns radians.
 */
export function obliquity(jd) {
    const T = julianCenturies(jd);
    const omega = (125.04452 - 1934.136261 * T) * DEG;
    const eps0 = 23.439291111
        - 0.0130041667 * T
        - 1.638889e-7 * T * T
        + 5.036111e-7 * T * T * T;
    return (eps0 + 0.00256 * Math.cos(omega)) * DEG;
}

/**
 * Greenwich Mean Sidereal Time (Meeus 12.4). Returns radians in [0, 2pi).
 */
export function gmst(jd) {
    const T = julianCenturies(jd);
    const theta = 280.46061837
        + 360.98564736629 * (jd - J2000)
        + 0.000387933 * T * T
        - (T * T * T) / 38710000;
    return norm360(theta) * DEG;
}

/**
 * Geocentric apparent position of the Sun (Meeus ch. 25).
 * @returns {{lonDeg:number, latDeg:number, distanceKm:number}} ecliptic of date
 */
export function sunPosition(jd) {
    const T = julianCenturies(jd);

    const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;

    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
        + 0.000289 * Math.sin(3 * M);

    const trueLon = L0 + C;
    const trueAnomaly = M + C * DEG;
    const R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));

    // Apparent longitude: aberration of light plus nutation in longitude
    const apparentLon = trueLon - 0.00569 + nutationInLongitude(jd);

    return {
        lonDeg: norm360(apparentLon),
        latDeg: 0,
        distanceKm: R * AU_KM
    };
}

/*
 * Meeus table 47.A — periodic terms for the Moon's longitude (sine, 1e-6 deg)
 * and distance (cosine, 1e-3 km). Columns: D, M, M', F, coeffL, coeffR.
 */
const MOON_LON_DIST = [
    [0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111],
    [2, 0, 0, 0, 658314, -2955968], [0, 0, 2, 0, 213618, -569925],
    [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138],
    [2, 0, 1, 0, 53322, -170733], [2, -1, 0, 0, 45758, -204586],
    [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321],
    [0, 0, 1, 2, -12528, 0], [0, 0, 1, -2, 10980, 79661],
    [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208],
    [2, 1, 0, 0, -6766, 30824], [1, 0, -1, 0, -5163, -8379],
    [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
    [2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650],
    [2, 0, -3, 0, 3665, 14403], [0, 1, -2, 0, -2689, -7003],
    [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056],
    [1, 0, 1, 0, -2348, 6322], [2, -2, 0, 0, 2236, -9884],
    [0, 1, 2, 0, -2120, 5751], [0, 2, 0, 0, -2069, 0],
    [2, -2, -1, 0, 2048, -4950], [2, 0, 1, -2, -1773, 4130],
    [2, 0, 0, 2, -1595, 0], [4, -1, -1, 0, 1215, -3958],
    [0, 0, 2, 2, -1110, 0], [3, 0, -1, 0, -892, 3258],
    [2, 1, 1, 0, -810, 2616], [4, -1, -2, 0, 759, -1897],
    [0, 2, -1, 0, -713, -2117], [2, 2, -1, 0, -700, 2354],
    [2, 1, -2, 0, 691, 0], [2, -1, 0, -2, 596, 0],
    [4, 0, 1, 0, 549, -1423], [0, 0, 4, 0, 537, -1117],
    [4, -1, 0, 0, 520, -1571], [1, 0, -2, 0, -487, -1739],
    [2, 1, 0, -2, -399, 0], [0, 0, 2, -2, -381, -4421],
    [1, 1, 1, 0, 351, 0], [3, 0, -2, 0, -340, 0],
    [4, 0, -3, 0, 330, 0], [2, -1, 2, 0, 327, 0],
    [0, 2, 1, 0, -323, 1165], [1, 1, -1, 0, 299, 0],
    [2, 0, 3, 0, 294, 0], [2, 0, -1, -2, 0, 8752]
];

/* Meeus table 47.B — periodic terms for the Moon's latitude (sine, 1e-6 deg). */
const MOON_LAT = [
    [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693],
    [2, 0, 0, -1, 173237], [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271],
    [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198], [2, 0, 1, -1, 9266],
    [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
    [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463],
    [2, -1, 0, 1, 2211], [2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870],
    [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794], [0, 0, 0, 3, -1749],
    [0, 1, -1, 1, -1565], [1, 0, 0, 1, -1491], [0, 1, 1, 1, -1475],
    [0, 1, 1, -1, -1410], [0, 1, 0, -1, -1344], [1, 0, 0, -1, -1335],
    [0, 0, 3, 1, 1107], [4, 0, 0, -1, 1021], [4, 0, -1, 1, 833],
    [0, 0, 1, -3, 777], [4, 0, -2, 1, 671], [2, 0, 0, -3, 607],
    [2, 0, 2, -1, 596], [2, -1, 1, -1, 491], [2, 0, -2, 1, -451],
    [0, 0, 3, -1, 439], [2, 0, 2, 1, 422], [2, 0, -3, -1, 421],
    [2, 1, -1, 1, -366], [2, 1, 0, 1, -351], [4, 0, 0, 1, 331],
    [2, -1, 1, 1, 315], [2, -2, 0, -1, 302], [0, 0, 1, 3, -283],
    [2, 1, 1, -1, -229], [1, 1, 0, -1, 223], [1, 1, 0, 1, 223],
    [0, 1, -2, -1, -220], [2, 1, -1, -1, -220], [1, 0, 1, 1, -185],
    [2, -1, -2, -1, 181], [0, 1, 2, 1, -177], [4, 0, -2, -1, 176],
    [4, -1, -1, -1, 166], [1, 0, 1, -1, -164], [4, 0, 1, -1, 132],
    [1, 0, -1, -1, -119], [4, -1, 0, -1, 115], [2, -2, 0, 1, 107]
];

/**
 * Geocentric position of the Moon (Meeus ch. 47).
 * @returns {{lonDeg:number, latDeg:number, distanceKm:number}} ecliptic of date
 */
export function moonPosition(jd) {
    const T = julianCenturies(jd);
    const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

    // Moon's mean longitude
    const Lp = norm360(218.3164477 + 481267.88123421 * T
        - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000);
    // Mean elongation
    const D = norm360(297.8501921 + 445267.1114034 * T
        - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000);
    // Sun's mean anomaly
    const M = norm360(357.5291092 + 35999.0502909 * T
        - 0.0001536 * T2 + T3 / 24490000);
    // Moon's mean anomaly
    const Mp = norm360(134.9633964 + 477198.8675055 * T
        + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000);
    // Argument of latitude
    const F = norm360(93.2720950 + 483202.0175233 * T
        - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000);

    const A1 = norm360(119.75 + 131.849 * T);
    const A2 = norm360(53.09 + 479264.290 * T);
    const A3 = norm360(313.45 + 481266.484 * T);

    // Eccentricity correction for terms involving the Sun's anomaly
    const E = 1 - 0.002516 * T - 0.0000074 * T2;

    let sumL = 0, sumR = 0, sumB = 0;

    for (let i = 0; i < MOON_LON_DIST.length; i++) {
        const [cd, cm, cmp, cf, cl, cr] = MOON_LON_DIST[i];
        const arg = (cd * D + cm * M + cmp * Mp + cf * F) * DEG;
        const ecc = cm === 0 ? 1 : (Math.abs(cm) === 1 ? E : E * E);
        sumL += cl * ecc * Math.sin(arg);
        sumR += cr * ecc * Math.cos(arg);
    }

    for (let i = 0; i < MOON_LAT.length; i++) {
        const [cd, cm, cmp, cf, cb] = MOON_LAT[i];
        const arg = (cd * D + cm * M + cmp * Mp + cf * F) * DEG;
        const ecc = cm === 0 ? 1 : (Math.abs(cm) === 1 ? E : E * E);
        sumB += cb * ecc * Math.sin(arg);
    }

    // Additive terms from Venus, Jupiter and the flattening of the Earth
    sumL += 3958 * Math.sin(A1 * DEG)
        + 1962 * Math.sin((Lp - F) * DEG)
        + 318 * Math.sin(A2 * DEG);

    sumB += -2235 * Math.sin(Lp * DEG)
        + 382 * Math.sin(A3 * DEG)
        + 175 * Math.sin((A1 - F) * DEG)
        + 175 * Math.sin((A1 + F) * DEG)
        + 127 * Math.sin((Lp - Mp) * DEG)
        - 115 * Math.sin((Lp + Mp) * DEG);

    return {
        lonDeg: norm360(Lp + sumL / 1e6 + nutationInLongitude(jd)),
        latDeg: sumB / 1e6,
        distanceKm: 385000.56 + sumR / 1000
    };
}

/**
 * Ecliptic (of date) spherical -> geocentric equatorial rectangular, in km.
 * @returns {{x:number, y:number, z:number}}
 */
export function eclipticToEquatorial(lonDeg, latDeg, distanceKm, eps) {
    const lon = lonDeg * DEG;
    const lat = latDeg * DEG;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const cosLon = Math.cos(lon);
    const sinLon = Math.sin(lon);
    const cosEps = Math.cos(eps);
    const sinEps = Math.sin(eps);

    return {
        x: distanceKm * cosLat * cosLon,
        y: distanceKm * (cosEps * cosLat * sinLon - sinEps * sinLat),
        z: distanceKm * (sinEps * cosLat * sinLon + cosEps * sinLat)
    };
}

/**
 * Geocentric equatorial vector -> the point on Earth's surface directly beneath
 * it (the sub-solar or sub-lunar point).
 * @returns {{latDeg:number, lonDeg:number}} lonDeg is east-positive, -180..180
 */
export function subPoint(vec, jd) {
    const r = Math.hypot(vec.x, vec.y, vec.z);
    const dec = Math.asin(vec.z / r);
    const ra = Math.atan2(vec.y, vec.x);
    let lon = (ra - gmst(jd)) / DEG;
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    return { latDeg: dec / DEG, lonDeg: lon };
}

/**
 * Convenience: geocentric equatorial rectangular Sun and Moon vectors (km).
 *
 * Memoised on the exact Julian Day. The lunar series is ~120 periodic terms and
 * this is called more than once per animation frame (Earth's orientation and
 * the Moon's placement both need it), always with the same instant, so a
 * single-entry cache halves the per-frame cost without any staleness.
 *
 * @param {number} jdUT Julian Day on the UT scale. The periodic series are
 *   evaluated at the corresponding TT instant; callers that need Earth's
 *   rotation must still use `gmst(jdUT)`.
 */
let _svCacheJd = NaN;
let _svCacheValue = null;

export function sunMoonVectors(jdUT) {
    if (jdUT === _svCacheJd && _svCacheValue) return _svCacheValue;

    const jdTT = jdUTtoTT(jdUT);
    const eps = obliquity(jdTT);
    const s = sunPosition(jdTT);
    const m = moonPosition(jdTT);

    _svCacheJd = jdUT;
    _svCacheValue = {
        eps,
        sun: eclipticToEquatorial(s.lonDeg, s.latDeg, s.distanceKm, eps),
        moon: eclipticToEquatorial(m.lonDeg, m.latDeg, m.distanceKm, eps),
        sunSpherical: s,
        moonSpherical: m
    };
    return _svCacheValue;
}
