/** Convert a JavaScript Date to a Julian Date number. */
export function toJulianDate(date) {
 const y = date.getUTCFullYear();
 const m = date.getUTCMonth() + 1;
 const d = date.getUTCDate()
 + (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()) / 86400;
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

/** Solve Kepler's equation M = E - e·sin(E) with Newton-Raphson iteration. */
export function solveKepler(M_rad, e) {
 let E = M_rad + e * Math.sin(M_rad);
 for (let i = 0; i < 12; i++) {
  const dE = (M_rad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
  E += dE;
  if (Math.abs(dE) < 1e-10) break;
 }
 return E;
}

/** Convert mean anomaly to true anomaly; optional square roots can be pre-cached. */
export function meanToTrueAnomaly(M_rad, e, sqrtPlus, sqrtMinus) {
 if (e < 1e-6) return M_rad;
 const E = solveKepler(M_rad, e);
 const sp = sqrtPlus || Math.sqrt(1 + e);
 const sm = sqrtMinus || Math.sqrt(1 - e);
 return 2 * Math.atan2(
  sp * Math.sin(E / 2),
  sm * Math.cos(E / 2)
 );
}
