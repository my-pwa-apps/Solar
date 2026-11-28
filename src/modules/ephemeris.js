/** Convert a JavaScript Date to a Julian Date number. */
export function toJulianDate(date) {
 const y = date.getUTCFullYear();
 const m = date.getUTCMonth() + 1;
 // Preserve Date milliseconds; double-precision JD conversion can still round
 // a millisecond when converted back through a Unix-epoch timestamp.
 const d = date.getUTCDate()
 + (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()
 + date.getUTCMilliseconds() / 1000) / 86400;
 const A = Math.floor(m <= 2 ? y - 1 : y);
 const B = m <= 2 ? m + 12 : m;
 const C = 2 - Math.floor(A / 100) + Math.floor(Math.floor(A / 100) / 4);
 return Math.floor(365.25 * (A + 4716)) + Math.floor(30.6001 * (B + 1)) + d + C - 1524.5;
}

/** Sun's right ascension in radians for days since J2000. */
export function sunRightAscension(daysSinceJ2000) {
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

/**
 * Solve Kepler's equation M = E - e·sin(E) for an elliptic orbit.
 * The returned anomaly retains the input revolution count.
 */
export function solveKepler(M_rad, e) {
 if (!Number.isFinite(M_rad)) throw new RangeError('Mean anomaly must be finite');
 if (!Number.isFinite(e) || e < 0 || e >= 1) {
  throw new RangeError('Eccentricity must be finite and satisfy 0 <= e < 1');
 }
 if (e === 0) return M_rad;

 const twoPi = Math.PI * 2;
 const reducedM = ((M_rad + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
 const revolutionOffset = M_rad - reducedM;
 let lower = -Math.PI;
 let upper = Math.PI;
 let E = e < 0.8
  ? reducedM + e * Math.sin(reducedM)
  : reducedM + Math.sign(reducedM || 1) * 0.85 * e;
 E = Math.max(lower, Math.min(upper, E));

 // Safeguarded Newton converges quickly for ordinary cases; every step stays
 // inside the monotonic elliptic root bracket, with bisection as the fallback.
 for (let i = 0; i < 32; i++) {
  const residual = E - e * Math.sin(E) - reducedM;
  if (residual === 0) return E + revolutionOffset;
  if (residual < 0) lower = E;
  else upper = E;

  const derivative = 1 - e * Math.cos(E);
  const newtonCandidate = E - residual / derivative;
  const candidate = Number.isFinite(newtonCandidate) && newtonCandidate > lower && newtonCandidate < upper
   ? newtonCandidate
   : (lower + upper) / 2;
  if (candidate === E) break;
  E = candidate;
 }

 // Rare fallback path guarantees convergence even for near-parabolic inputs.
 for (let i = 0; i < 80; i++) {
  E = (lower + upper) / 2;
  const residual = E - e * Math.sin(E) - reducedM;
  if (Math.abs(residual) <= 2e-15 || upper - lower <= 2e-15) {
   return E + revolutionOffset;
  }
  if (residual < 0) lower = E;
  else upper = E;
 }
 return (lower + upper) / 2 + revolutionOffset;
}

/** Convert mean anomaly to true anomaly; optional square roots can be pre-cached. */
export function meanToTrueAnomaly(M_rad, e, sqrtPlus, sqrtMinus) {
 if (!Number.isFinite(M_rad)) throw new RangeError('Mean anomaly must be finite');
 if (!Number.isFinite(e) || e < 0 || e >= 1) {
  throw new RangeError('Eccentricity must be finite and satisfy 0 <= e < 1');
 }
 if (e < 1e-6) return M_rad;
 const E = solveKepler(M_rad, e);
 const sp = sqrtPlus || Math.sqrt(1 + e);
 const sm = sqrtMinus || Math.sqrt(1 - e);
 return 2 * Math.atan2(
  sp * Math.sin(E / 2),
  sm * Math.cos(E / 2)
 );
}

/**
 * Position in the app's x/y/z frame (astronomical ecliptic x/y/z maps to
 * scene x/z/y). Inclination is measured from the reference plane, with the
 * node and periapsis angles measured in that plane.
 */
export function keplerianPosition(
 semiMajorAxis,
 eccentricity,
 trueAnomaly,
 inclination = 0,
 ascendingNode = 0,
 argumentOfPeriapsis = 0,
 out = {}
) {
 if (!Number.isFinite(semiMajorAxis) || semiMajorAxis < 0) {
  throw new RangeError('Semi-major axis must be finite and non-negative');
 }
 if (!Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) {
  throw new RangeError('Eccentricity must be finite and satisfy 0 <= e < 1');
 }
 if (!Number.isFinite(trueAnomaly)
  || !Number.isFinite(inclination)
  || !Number.isFinite(ascendingNode)
  || !Number.isFinite(argumentOfPeriapsis)) {
  throw new RangeError('Orbital angles must be finite');
 }

 const radius = semiMajorAxis * (1 - eccentricity * eccentricity)
  / (1 + eccentricity * Math.cos(trueAnomaly));
 const theta = trueAnomaly + argumentOfPeriapsis;
 const cosTheta = Math.cos(theta);
 const sinTheta = Math.sin(theta);
 const cosNode = Math.cos(ascendingNode);
 const sinNode = Math.sin(ascendingNode);
 const cosInclination = Math.cos(inclination);
 const sinInclination = Math.sin(inclination);

 out.x = radius * (cosNode * cosTheta - sinNode * sinTheta * cosInclination);
 out.y = radius * sinTheta * sinInclination;
 out.z = radius * (sinNode * cosTheta + cosNode * sinTheta * cosInclination);
 return out;
}
