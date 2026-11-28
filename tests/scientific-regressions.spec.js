import { expect, test } from '@playwright/test';
import {
  keplerianPosition,
  solveKepler,
  toJulianDate
} from '../src/modules/ephemeris.js';
import {
  PLANET_ELEMENTS_J2000,
  SCIENTIFIC_ORBITAL_ELEMENTS
} from '../src/modules/solarSystemData.js';

const TWO_PI = Math.PI * 2;

function independentKeplerBisection(meanAnomaly, eccentricity) {
  const reduced = ((meanAnomaly + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  const offset = meanAnomaly - reduced;
  let low = -Math.PI;
  let high = Math.PI;
  for (let iteration = 0; iteration < 100; iteration++) {
    const midpoint = (low + high) / 2;
    if (midpoint - eccentricity * Math.sin(midpoint) < reduced) low = midpoint;
    else high = midpoint;
  }
  return (low + high) / 2 + offset;
}

function referenceJplVector(row, julianDate) {
  const centuries = (julianDate - 2451545) / 36525;
  const [
    a0, aRate, e0, eRate, inclination0, inclinationRate,
    longitude0, longitudeRate, perihelion0, perihelionRate, node0, nodeRate
  ] = row;
  const a = a0 + aRate * centuries;
  const e = e0 + eRate * centuries;
  const inclination = (inclination0 + inclinationRate * centuries) * Math.PI / 180;
  const argumentOfPerihelion = (perihelion0 - node0
    + (perihelionRate - nodeRate) * centuries) * Math.PI / 180;
  const node = (node0 + nodeRate * centuries) * Math.PI / 180;
  const meanAnomaly = (longitude0 - perihelion0
    + (longitudeRate - perihelionRate) * centuries) * Math.PI / 180;
  const E = independentKeplerBisection(meanAnomaly, e);
  const xOrbit = a * (Math.cos(E) - e);
  const yOrbit = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(argumentOfPerihelion);
  const sw = Math.sin(argumentOfPerihelion);
  const co = Math.cos(node);
  const so = Math.sin(node);
  const ci = Math.cos(inclination);
  const si = Math.sin(inclination);
  const x = (cw * co - sw * so * ci) * xOrbit
    + (-sw * co - cw * so * ci) * yOrbit;
  const y = (cw * so + sw * co * ci) * xOrbit
    + (-sw * so + cw * co * ci) * yOrbit;
  const z = sw * si * xOrbit + cw * si * yOrbit;
  return { x, y, z, a };
}

const JPL_TABLE_1 = {
  mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
  earth: [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
  mars: [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  saturn: [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794]
};

test('safeguarded Kepler solver matches independent bisection over comet-like eccentricities', ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Numerical regression checks run once.');
  for (const eccentricity of [0, 0.855, 0.967, 0.995, 0.999]) {
    for (let index = 0; index <= 2000; index++) {
      const meanAnomaly = -12 * Math.PI + index * 24 * Math.PI / 2000;
      const actual = solveKepler(meanAnomaly, eccentricity);
      const residual = actual - eccentricity * Math.sin(actual) - meanAnomaly;
      expect(Math.abs(residual), `e=${eccentricity}, M=${meanAnomaly}`).toBeLessThan(1e-10);
      if (eccentricity > 0) {
        const expected = independentKeplerBisection(meanAnomaly, eccentricity);
        expect(Math.abs(actual - expected), `e=${eccentricity}, M=${meanAnomaly}`).toBeLessThan(1e-10);
      } else {
        expect(actual).toBe(meanAnomaly);
      }
    }
  }

  const pathologicalMeanAnomaly = 6.2489419472554575;
  expect(Math.abs(
    solveKepler(pathologicalMeanAnomaly, 0.995)
      - 0.995 * Math.sin(solveKepler(pathologicalMeanAnomaly, 0.995))
      - pathologicalMeanAnomaly
  )).toBeLessThan(1e-10);
  for (const eccentricity of [-0.01, 1, Number.NaN]) {
    expect(() => solveKepler(0, eccentricity)).toThrow(RangeError);
  }
  expect(() => solveKepler(Number.POSITIVE_INFINITY, 0.5)).toThrow(RangeError);
});

test('Julian-date conversion retains JavaScript Date milliseconds', ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Numerical regression checks run once.');
  const date = new Date('2025-01-01T00:00:00.123Z');
  const julianDate = toJulianDate(date);
  const convertedBack = new Date((julianDate - 2440587.5) * 86400000);
  expect(julianDate).not.toBe(toJulianDate(new Date('2025-01-01T00:00:00.000Z')));
  expect(Math.abs(convertedBack.getTime() - date.getTime())).toBeLessThanOrEqual(1);
});

test('J2000 and 2025 planetary vectors agree with an independent JPL Table 1 transform', ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Numerical regression checks run once.');
  const references = [
    { jd: 2451545, longitude: { mercury: 253.7836784833, earth: 100.3801802246, mars: 359.4483026242, saturn: 45.5785899557 } },
    { jd: 2460676.5, longitude: { mercury: 202.6643002812, earth: 100.4700478785, mars: 108.8868068217, saturn: 349.5084437715 } }
  ];

  for (const { jd, longitude } of references) {
    const days = jd - 2451545;
    const centuries = days / 36525;
    for (const [planet, row] of Object.entries(JPL_TABLE_1)) {
      const expected = referenceJplVector(row, jd);
      const elements = SCIENTIFIC_ORBITAL_ELEMENTS[planet];
      const meanElements = PLANET_ELEMENTS_J2000[planet];
      const eccentricity = elements.eccentricity + elements.eccentricityRatePerCentury * centuries;
      const inclination = (elements.inclinationDeg + elements.inclinationRateDegPerCentury * centuries) * Math.PI / 180;
      const argumentOfPeriapsis = (elements.periapsisDeg + elements.periapsisRateDegPerCentury * centuries) * Math.PI / 180;
      const ascendingNode = (elements.ascendingNodeDeg + elements.ascendingNodeRateDegPerCentury * centuries) * Math.PI / 180;
      const meanAnomaly = (meanElements.M0 + meanElements.n * days) * Math.PI / 180;
      const E = solveKepler(meanAnomaly, eccentricity);
      const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
      );
      const actual = keplerianPosition(1, eccentricity, trueAnomaly, inclination, ascendingNode, argumentOfPeriapsis);
      const expectedScene = { x: expected.x / expected.a, y: expected.z / expected.a, z: expected.y / expected.a };
      const error = Math.hypot(
        actual.x - expectedScene.x,
        actual.y - expectedScene.y,
        actual.z - expectedScene.z
      );
      expect(error, `${planet} at JD ${jd} vector error`).toBeLessThan(2e-8);
      if (jd === 2451545) {
        const actualLongitude = (Math.atan2(actual.z, actual.x) * 180 / Math.PI + 360) % 360;
        const difference = Math.atan2(
          Math.sin((actualLongitude - longitude[planet]) * Math.PI / 180),
          Math.cos((actualLongitude - longitude[planet]) * Math.PI / 180)
        );
        expect(Math.abs(difference), `${planet} J2000 longitude error`).toBeLessThan(1e-8);
      }
    }
  }
});

test('Triton orbital inclination encodes retrograde motion once in the parent-equatorial frame', ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Numerical regression checks run once.');
  const inclination = 156.9 * Math.PI / 180;
  const positionAt = trueAnomaly => keplerianPosition(1, 0, trueAnomaly, inclination);
  const before = positionAt(0);
  const after = positionAt(1e-5);
  const angularMomentumY = before.z * after.x - before.x * after.z;
  const progradeReferenceY = -Math.sin(1e-5);
  expect(angularMomentumY).toBeGreaterThan(0);
  expect(progradeReferenceY).toBeLessThan(0);
  expect(Math.abs(angularMomentumY / -progradeReferenceY + Math.cos(inclination))).toBeLessThan(1e-5);

  const reversed = positionAt(-1e-5);
  expect(before.z * reversed.x - before.x * reversed.z).toBeLessThan(0);
});
