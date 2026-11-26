// Shared physical and orbital data used by the solar system simulation.
export const SEMI_MAJOR_AXIS_AU = Object.freeze({
 mercury: 0.387,
 venus: 0.723,
 earth: 1,
 mars: 1.524,
 jupiter: 5.203,
 saturn: 9.537,
 uranus: 19.19,
 neptune: 30.07,
 pluto: 39.48,
 ceres: 2.77,
 haumea: 43.13,
 makemake: 45.43,
 eris: 67.67,
 orcus: 39.2,
 quaoar: 43.69,
 gonggong: 67.4,
 sedna: 506,
 salacia: 42.2,
 varda: 43.14,
 varuna: 43.17
});

export const ASTRONOMICAL_DATA = {
 mercury: {
 rotationPeriod: 1407.6, // hours (58.6 Earth days)
 axialTilt: 0.034, // degrees
 retrograde: false,
 orbitalPeriod: 88 // Earth days
 },
 venus: {
 rotationPeriod: 5832.5, // hours (243 Earth days)
 axialTilt: 177.4, // degrees (almost upside down)
 retrograde: true, // rotates backwards!
 orbitalPeriod: 224.7 // Earth days
 },
 earth: {
 rotationPeriod: 23.93, // hours
 axialTilt: 23.44, // degrees
 retrograde: false,
 orbitalPeriod: 365.25 // Earth days (baseline)
 },
 mars: {
 rotationPeriod: 24.62, // hours
 axialTilt: 25.19, // degrees
 retrograde: false,
 orbitalPeriod: 687 // Earth days
 },
 jupiter: {
 rotationPeriod: 9.93, // hours (fastest rotation!)
 axialTilt: 3.13, // degrees
 retrograde: false,
 orbitalPeriod: 4333 // Earth days (~11.9 years)
 },
 saturn: {
 rotationPeriod: 10.66, // hours
 axialTilt: 26.73, // degrees
 retrograde: false,
 orbitalPeriod: 10759 // Earth days (~29.5 years)
 },
 uranus: {
 rotationPeriod: 17.24, // hours
 axialTilt: 97.77, // degrees (rotates on its side!)
 retrograde: true,
 orbitalPeriod: 30687 // Earth days (~84 years)
 },
 neptune: {
 rotationPeriod: 16.11, // hours
 axialTilt: 28.32, // degrees
 retrograde: false,
 orbitalPeriod: 60182 // Earth days (~164.8 years)
 },
 pluto: {
 rotationPeriod: 153.293, // hours (6.387 Earth days - retrograde)
 axialTilt: 122.53, // degrees
 retrograde: true,
 orbitalPeriod: 90520 // Earth days (~248 years)
 },
 moon: {
 rotationPeriod: 655.7, // hours (27.3 Earth days - tidally locked)
 axialTilt: 6.68, // degrees
 retrograde: false,
 orbitalPeriod: 27.3 // Earth days
 },
 ceres: { rotationPeriod: 9.074 },
 haumea: { rotationPeriod: 3.915 },
 makemake: { rotationPeriod: 7.77 },
 eris: { rotationPeriod: 25.9 },
 orcus: { rotationPeriod: 10.5 },
 quaoar: { rotationPeriod: 17.678 },
 gonggong: { rotationPeriod: 22.4 },
 sedna: { rotationPeriod: 10.27 },
 salacia: { rotationPeriod: 6.09 },
 varda: { rotationPeriod: 5.56 },
 varuna: { rotationPeriod: 6.3436 }
 };

export const SCIENTIFIC_ORBITAL_PERIODS = {
 ceres: 1680.0,
 haumea: 103813.0,
 makemake: 113201.0,
 eris: 203830.0,
 orcus: 90441.0,
 quaoar: 104137.0,
 gonggong: 202780.0,
 sedna: 4134991.0,
 salacia: 100684.0,
 varda: 114305.0,
 varuna: 103018.0
 };

export const SCIENTIFIC_MOON_ORBITAL_PERIODS = {
 moon: 27.321661,
 phobos: 0.31891,
 deimos: 1.26244,
 io: 1.769137786,
 europa: 3.551181,
 ganymede: 7.154553,
 callisto: 16.689018,
 mimas: 0.9424218,
 enceladus: 1.370218,
 rhea: 4.518212,
 titan: 15.945421,
 iapetus: 79.3215,
 ariel: 2.52038,
 umbriel: 4.14418,
 titania: 8.706234,
 oberon: 13.4632,
 miranda: 1.413479,
 triton: 5.876854,
 charon: 6.38723
 };

export const SCIENTIFIC_ORBITAL_ELEMENTS = {
 mercury: { eccentricity: 0.20563, inclinationDeg: 7.00, periapsisDeg: 29.1 },
 venus: { eccentricity: 0.00677, inclinationDeg: 3.39, periapsisDeg: 54.9 },
 earth: { eccentricity: 0.01671, inclinationDeg: 0.00, periapsisDeg: 102.9 },
 mars: { eccentricity: 0.09339, inclinationDeg: 1.85, periapsisDeg: 286.5 },
 jupiter: { eccentricity: 0.04839, inclinationDeg: 1.30, periapsisDeg: 273.9 },
 saturn: { eccentricity: 0.05415, inclinationDeg: 2.49, periapsisDeg: 339.4 },
 uranus: { eccentricity: 0.04717, inclinationDeg: 0.77, periapsisDeg: 96.7 },
 neptune: { eccentricity: 0.00859, inclinationDeg: 1.77, periapsisDeg: 273.2 },
 pluto: { eccentricity: 0.24881, inclinationDeg: 17.16, periapsisDeg: 113.8 },
 ceres: { eccentricity: 0.07582, inclinationDeg: 10.59, periapsisDeg: 73.6 },
 haumea: { eccentricity: 0.18874, inclinationDeg: 28.19, periapsisDeg: 240.6 },
 makemake: { eccentricity: 0.15900, inclinationDeg: 29.00, periapsisDeg: 296.3 },
 eris: { eccentricity: 0.44068, inclinationDeg: 44.04, periapsisDeg: 151.6 },
 orcus: { eccentricity: 0.22700, inclinationDeg: 20.57, periapsisDeg: 73.1 },
 quaoar: { eccentricity: 0.03900, inclinationDeg: 8.00, periapsisDeg: 147.5 },
 gonggong: { eccentricity: 0.49900, inclinationDeg: 30.70, periapsisDeg: 207.7 },
 sedna: { eccentricity: 0.85491, inclinationDeg: 11.93, periapsisDeg: 311.3 },
 salacia: { eccentricity: 0.10600, inclinationDeg: 23.92, periapsisDeg: 278.3 },
 varda: { eccentricity: 0.14000, inclinationDeg: 21.50, periapsisDeg: 104.7 },
 varuna: { eccentricity: 0.05100, inclinationDeg: 17.20, periapsisDeg: 97.4 }
 };

export const SCIENTIFIC_MOON_ORBITAL_ELEMENTS = {
 moon: { eccentricity: 0.05490, inclinationDeg: 5.15, periapsisDeg: 0.0 },
 phobos: { eccentricity: 0.01510, inclinationDeg: 1.09, periapsisDeg: 0.0 },
 deimos: { eccentricity: 0.00020, inclinationDeg: 1.79, periapsisDeg: 0.0 },
 io: { eccentricity: 0.00410, inclinationDeg: 0.04, periapsisDeg: 0.0 },
 europa: { eccentricity: 0.00940, inclinationDeg: 0.47, periapsisDeg: 0.0 },
 ganymede: { eccentricity: 0.00130, inclinationDeg: 0.20, periapsisDeg: 0.0 },
 callisto: { eccentricity: 0.00740, inclinationDeg: 0.28, periapsisDeg: 0.0 },
 mimas: { eccentricity: 0.01960, inclinationDeg: 1.57, periapsisDeg: 0.0 },
 enceladus: { eccentricity: 0.00470, inclinationDeg: 0.00, periapsisDeg: 0.0 },
 rhea: { eccentricity: 0.00100, inclinationDeg: 0.35, periapsisDeg: 0.0 },
 titan: { eccentricity: 0.02880, inclinationDeg: 0.35, periapsisDeg: 0.0 },
 iapetus: { eccentricity: 0.02830, inclinationDeg: 15.47, periapsisDeg: 0.0 },
 ariel: { eccentricity: 0.00120, inclinationDeg: 0.26, periapsisDeg: 0.0 },
 umbriel: { eccentricity: 0.00390, inclinationDeg: 0.13, periapsisDeg: 0.0 },
 titania: { eccentricity: 0.00110, inclinationDeg: 0.08, periapsisDeg: 0.0 },
 oberon: { eccentricity: 0.00140, inclinationDeg: 0.07, periapsisDeg: 0.0 },
 miranda: { eccentricity: 0.00130, inclinationDeg: 4.34, periapsisDeg: 0.0 },
 triton: { eccentricity: 0.00002, inclinationDeg: 156.90, periapsisDeg: 0.0 },
 charon: { eccentricity: 0.00020, inclinationDeg: 0.00, periapsisDeg: 0.0 }
 };

// J2000.0 mean elements: mean anomaly (degrees) and mean motion (degrees/day).
export const PLANET_ELEMENTS_J2000 = {
 mercury: { M0: 174.7943, n: 4.09233445 },
 venus: { M0: 50.4161, n: 1.60213034 },
 earth: { M0: 357.5291, n: 0.98560028 },
 mars: { M0: 19.3451, n: 0.52402068 },
 jupiter: { M0: 19.5976, n: 0.08308530 },
 saturn: { M0: 317.6459, n: 0.03344428 },
 uranus: { M0: 141.6220, n: 0.01172584 },
 neptune: { M0: 257.6634, n: 0.00598103 },
 pluto: { M0: 14.8740, n: 0.003975 },
 ceres: { M0: 95.9891, n: 0.21408 },
 haumea: { M0: 198.0, n: 0.00347 },
 makemake: { M0: 37.0, n: 0.00318 },
 eris: { M0: 208.0, n: 0.00176 },
 orcus: { M0: 112.0, n: 0.00398 },
 quaoar: { M0: 147.0, n: 0.00346 },
 gonggong: { M0: 207.0, n: 0.00177 },
 sedna: { M0: 358.0, n: 0.0000861 },
 salacia: { M0: 280.0, n: 0.00357 },
 varda: { M0: 104.0, n: 0.00352 },
 varuna: { M0: 97.0, n: 0.00352 }
 };
