/**
 * Approximate heliocentric ecliptic positions for the eight planets.
 *
 * Elements and secular rates are the JPL 1800-2050 approximation. Returned
 * coordinates use the scene convention: X/Z are the J2000 ecliptic plane and
 * +Y is ecliptic north. Distances are in astronomical units.
 */

const J2000 = 2451545.0;
const DAYS_PER_CENTURY = 36525;
const DEG = Math.PI / 180;

// Each pair is [value at J2000, rate per Julian century]. Angles are degrees.
const ELEMENTS = Object.freeze({
    mercury: {
        a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906],
        i: [7.00497902, -0.00594749], L: [252.25032350, 149472.67411175],
        perihelion: [77.45779628, 0.16047689], node: [48.33076593, -0.12534081]
    },
    venus: {
        a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107],
        i: [3.39467605, -0.00078890], L: [181.97909950, 58517.81538729],
        perihelion: [131.60246718, 0.00268329], node: [76.67984255, -0.27769418]
    },
    earth: {
        a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392],
        i: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981],
        perihelion: [102.93768193, 0.32327364], node: [0, 0]
    },
    mars: {
        a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882],
        i: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499],
        perihelion: [-23.94362959, 0.44441088], node: [49.55953891, -0.29257343]
    },
    jupiter: {
        a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253],
        i: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775],
        perihelion: [14.72847983, 0.21252668], node: [100.47390909, 0.20469106]
    },
    saturn: {
        a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991],
        i: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201],
        perihelion: [92.59887831, -0.41897216], node: [113.66242448, -0.28867794]
    },
    uranus: {
        a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397],
        i: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785],
        perihelion: [170.95427630, 0.40805281], node: [74.01692503, 0.04240589]
    },
    neptune: {
        a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105],
        i: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325],
        perihelion: [44.96476227, -0.32241464], node: [131.78422574, -0.00508664]
    }
});

const atCentury = (pair, centuries) => pair[0] + pair[1] * centuries;
const normalizeRadians = (angle) => {
    const turn = Math.PI * 2;
    return ((angle % turn) + turn) % turn;
};

function solveEccentricAnomaly(meanAnomaly, eccentricity) {
    let eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly);
    for (let iteration = 0; iteration < 12; iteration++) {
        const correction = (meanAnomaly - eccentricAnomaly
            + eccentricity * Math.sin(eccentricAnomaly))
            / (1 - eccentricity * Math.cos(eccentricAnomaly));
        eccentricAnomaly += correction;
        if (Math.abs(correction) < 1e-12) break;
    }
    return eccentricAnomaly;
}

function elementsAt(planetId, jd) {
    const source = ELEMENTS[planetId];
    if (!source || !Number.isFinite(jd)) return null;
    const centuries = (jd - J2000) / DAYS_PER_CENTURY;
    return {
        semiMajorAxis: atCentury(source.a, centuries),
        eccentricity: atCentury(source.e, centuries),
        inclination: atCentury(source.i, centuries) * DEG,
        meanLongitude: atCentury(source.L, centuries) * DEG,
        longitudePerihelion: atCentury(source.perihelion, centuries) * DEG,
        ascendingNode: atCentury(source.node, centuries) * DEG
    };
}

function positionAtMeanAnomaly(elements, meanAnomaly) {
    const {
        semiMajorAxis, eccentricity, inclination,
        longitudePerihelion, ascendingNode
    } = elements;
    const normalizedMeanAnomaly = normalizeRadians(meanAnomaly);
    const argumentPerihelion = longitudePerihelion - ascendingNode;
    const eccentricAnomaly = solveEccentricAnomaly(normalizedMeanAnomaly, eccentricity);
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );

    const orbitalX = semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity);
    const orbitalY = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity)
        * Math.sin(eccentricAnomaly);
    const cosArgument = Math.cos(argumentPerihelion);
    const sinArgument = Math.sin(argumentPerihelion);
    const cosNode = Math.cos(ascendingNode);
    const sinNode = Math.sin(ascendingNode);
    const cosInclination = Math.cos(inclination);
    const sinInclination = Math.sin(inclination);

    const eclipticX = (cosArgument * cosNode - sinArgument * sinNode * cosInclination) * orbitalX
        + (-sinArgument * cosNode - cosArgument * sinNode * cosInclination) * orbitalY;
    const eclipticY = (cosArgument * sinNode + sinArgument * cosNode * cosInclination) * orbitalX
        + (-sinArgument * sinNode + cosArgument * cosNode * cosInclination) * orbitalY;
    const eclipticZ = sinArgument * sinInclination * orbitalX
        + cosArgument * sinInclination * orbitalY;

    return {
        x: eclipticX,
        y: eclipticZ,
        z: -eclipticY,
        radiusAu: Math.hypot(eclipticX, eclipticY, eclipticZ),
        semiMajorAxisAu: semiMajorAxis,
        meanAnomaly: normalizedMeanAnomaly,
        trueAnomaly
    };
}

/**
 * Return a planet's heliocentric position in the scene's J2000 ecliptic frame.
 *
 * @param {string} planetId lowercase planet id
 * @param {number} jd Julian Day
 * @returns {{x:number,y:number,z:number,radiusAu:number,semiMajorAxisAu:number,meanAnomaly:number,trueAnomaly:number}|null}
 */
export function planetEclipticPosition(planetId, jd) {
    const elements = elementsAt(planetId, jd);
    if (!elements) return null;
    return positionAtMeanAnomaly(
        elements,
        elements.meanLongitude - elements.longitudePerihelion
    );
}

export function planetEclipticOrbitPosition(planetId, jd, meanAnomaly) {
    const elements = elementsAt(planetId, jd);
    return elements ? positionAtMeanAnomaly(elements, meanAnomaly) : null;
}

export const PLANET_IDS = Object.freeze(Object.keys(ELEMENTS));
