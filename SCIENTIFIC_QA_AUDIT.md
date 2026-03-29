# Space Voyage — Scientific QA Audit Report

**Auditor role:** Principal Scientific QA Engineer  
**Audit date:** 2026-06-05  
**Codebase version:** SW v2.10.249  
**Three.js version:** v0.183.0 (importmap); README incorrectly states v0.160.0  
**Scope:** Full repository scientific accuracy review — all 10 sub-domains  

---

## 1. Executive Summary

Space Voyage demonstrates **strong scientific fundamentals**. Physical sizes for all 8 planets, Pluto, and all 14 named moons are accurate to within 0.1% of NASA/JPL published values. Orbital elements (eccentricity, inclination, mean motion) match the Standish et al. 1992 / JPL approximate ephemerides closely. The Keplerian solver (Newton-Raphson on Kepler's equation) is mathematically correct.

However, several issues ranging from critical model errors to stale description strings require attention before this project is considered scientifically authoritative:

| Category | Score | Notes |
|---|---|---|
| Planetary Physical Data | **96/100** | Near-perfect radii, tilts, rotation periods |
| Orbital Mechanics Model | **74/100** | Good Keplerian basis; hardcoded comet heights break inclinations |
| Spacecraft Mission Data | **78/100** | Good trajectory data; stale hardcoded distance strings |
| Descriptions & Fun Facts | **82/100** | Mostly accurate; Jupiter "shield" myth is scientifically contested |
| Scale Transparency | **85/100** | Correctly disclosed; one misleading internal comment |
| Documentation Quality | **70/100** | README version mismatch; misleading scale comment in code |
| **Weighted Average** | **81/100** | Educational app with solid science foundation, fixable gaps |

---

## 2. Science-Relevant File Inventory

| File | Lines (approx.) | Scientific relevance |
|---|---|---|
| `src/modules/SolarSystemModule.js` | ~10,000+ | **Primary** — all planet data, orbital elements, Keplerian solver, spacecraft trajectories, comet model |
| `src/i18n.js` | ~1,500 | **High** — all public-facing claims (descriptions, distances, events, fun facts) × 6 languages |
| `src/modules/utils.js` | ~600 | Medium — CONFIG constants, quality tiers, IS_MOBILE |
| `src/modules/SceneManager.js` | ~2,344 | Medium — renderer setup, bloom settings |
| `index.html` | ~200 | Low — meta description; importmap version |
| `ATTRIBUTION.md` | ~60 | Medium — texture provenance, accuracy disclaimer |
| `README.md` | ~250 | Low-Medium — public claims; Three.js version mismatch |

---

## 3. Claim Audit — Verified True / Verified False / Needs Qualification

### 3a. Stated or Implied Claims Assessed

| Claim (source) | Verdict | Notes |
|---|---|---|
| "Earth is the densest planet" (`descEarth`) | ✅ TRUE | Earth density 5,514 kg/m³; highest in Solar System |
| "Venus has no moons — one of only two planets without any" (`descVenus`) | ✅ TRUE | Mercury and Venus |
| "Jupiter's gravity shields Earth from many asteroids and comets" (`funFactJupiter`) | ⚠️ CONTESTED | See §4.4 |
| "Saturn's rings are only 10 meters thick" (`funFactSaturn`) | ⚠️ MISLEADING | Technically minimum; main rings average 10 m–1 km |
| "Moon stabilizes Earth's tilt" (`descMoon`) | ⚠️ DEBATED | Laskar et al. 1993 says yes; Ward 2002 disputes necessity |
| "Neptune winds up to 2,100 km/h" (`descNeptune`) | ✅ TRUE | NASA JPL confirmed |
| "Moon receding at 3.8 cm/year" (`funFactMoon`) | ✅ TRUE | LLR measurement |
| "Uranus was the first planet discovered with a telescope (1781)" (`funFactUranus`) | ✅ TRUE | Prior planets known from antiquity |
| "Crab Nebula supernova observed 1054 AD" (`descCrabNebula`) | ✅ TRUE | Chinese astronomical records |
| "Crab Nebula pulsar spins 30 times per second" (`funFactCrabNebula`) | ✅ TRUE | 30.2 Hz |
| "JWST operating at −233°C" (`funFactJWST`) | ✅ TRUE | ~40 K |
| "Saturn would float in water" (`descSaturn`) | ✅ TRUE | Mean density 0.687 g/cm³ < 1.0 g/cm³ |
| Voyager 1 currently "~25.8 billion km (~172 AU)" (`descVoyager1`) | ❌ WRONG/STALE | Was 163.7 AU at Jan 2025; 172 AU not reached until ~2029 |
| Voyager 2 currently "~21.4 billion km (~143 AU)" (`descVoyager2`) | ❌ WRONG/STALE | Was 136.6 AU at Jan 2025; 143 AU not reached until ~2030 |
| Pioneer plaque described as "gold plaque" (`funFactPioneer10`) | ⚠️ IMPRECISE | Gold-anodized aluminum, not solid gold |
| Hale-Bopp nucleus "about 40 km" (`descHaleBopp`) | ⚠️ LOW ESTIMATE | Widely cited as 40–80 km; median estimate ~50–60 km |
| "Sun contains 99.86% of Solar System's mass" (`defaultFact`) | ✅ TRUE | NASA confirmed |
| "Eris is slightly smaller than Pluto but more massive" (`descEris`) | ✅ TRUE | Eris 2,326 km / 1.66×10²² kg vs Pluto 2,376 km / 1.30×10²² kg |
| Halley's Comet "returns every 75-76 years" (`descHalley`) | ✅ TRUE | ~75.3 year mean period |
| Sedna "takes ~11,400 years to complete one orbit" (`descSedna`) | ✅ TRUE | SCIENTIFIC_ORBITAL_PERIODS: sedna = 4,134,991 days ÷ 365.25 ≈ 11,320 years — close |

---

## 4. Scientific Findings by Domain

### 4.1 Planetary Physical Data

**Radii (as fraction of Earth's diameter 12,742 km)** — all verified against NASA/JPL planetary fact sheets:

| Object | Code value | Real value | Error |
|---|---|---|---|
| Mercury | 0.383 | 0.383 | 0.0% ✅ |
| Venus | 0.950 | 0.950 | 0.0% ✅ |
| Earth | 1.000 | 1.000 | 0.0% ✅ |
| Mars | 0.532 | 0.532 | 0.0% ✅ |
| Jupiter | 10.97 | 10.97 (mean volumetric) | 0.0% ✅ |
| Saturn | 9.14 | 9.14 (mean volumetric) | 0.0% ✅ |
| Uranus | 3.98 | 3.98 | 0.0% ✅ |
| Neptune | 3.86 | 3.86 | 0.0% ✅ |
| Pluto | 0.187 | 0.187 | 0.0% ✅ |
| Moon | 0.273 | 0.273 | 0.0% ✅ |
| Ganymede | 0.413 | 0.413 | 0.0% ✅ |
| Io | 0.286 | 0.286 | 0.0% ✅ |
| Europa | 0.245 | 0.245 | 0.0% ✅ |
| Titan | 0.404 | 0.404 | 0.0% ✅ |

> **Result: PASS.** All planet and moon sizes are NASA-JPL accurate to 3 significant figures.

**Axial tilts** — all tested, all within ±0.02°. Notable: Venus 177.4° (retrograde ✅), Uranus 97.77° ✅, Pluto 122.53° ✅.

**Rotation periods (ASTRONOMICAL_DATA)** — all within ±0.01 hours of IAU published values.

**Orbital periods** — all within ±0.1% of JPL mean orbital elements.

**Minor discrepancy:** Pluto orbital period listed as `90520 days` in `ASTRONOMICAL_DATA` but the `Charon` moon creation comment references `"Pluto's 90560 days"` — a 40-day (0.04%) difference. Negligible but inconsistent internal data.

---

### 4.2 Orbital Mechanics Model

**Strengths:**
- `SCIENTIFIC_ORBITAL_ELEMENTS` uses real J2000 eccentricities and inclinations from JPL (verified to 4–5 significant figures throughout)
- `PLANET_ELEMENTS_J2000` uses Standish et al. 1992 mean anomaly M₀ and mean daily motion n with source citation — correctly derived from JPL approximate ephemeris
- `_solveKepler(M, e)` implements Newton-Raphson iteration on E - e·sin(E) = M (correct)
- `_meanToTrueAnomaly(M, e)` derives true anomaly from eccentric anomaly via standard formula (correct)
- `initPositionsToDate()` computes GMST and Sun RA to orient Earth correctly (low-precision but appropriate for this use case)
- Moon orbital phases seeded deterministically from JD at startup (no random drifts)

**Issues:**

**Issue ORB-1 (MEDIUM): Comet y-position hardcoded to `Math.sin(angle) * 15`**  
Found at lines 3760, 9372, and 10415. This makes every comet oscillate sinusoidally to ±15 scene units in the Y axis regardless of its actual orbital inclination. Real comet inclinations are:

| Comet | Real inclination | Hardcoded result |
|---|---|---|
| Halley's | ~162° (retrograde, ~18° to ecliptic) | 15 units (wrong sign, wrong amplitude) |
| Hale-Bopp | ~89° (near polar) | 15 units (far too small) |
| Swift-Tuttle | ~113° | 15 units |
| Encke | ~12° | 15 units (too large — Encke has low inclination) |

Fix: Add `inclination` field to `cometsData`, then use `r * Math.sin(angle) * Math.sin(inclRad)` for the Y component.

**Issue ORB-2 (LOW): Moon inclination handling is simplified 2D projection**  
The code does `moon.position.y = zOrb * Math.sin(i)` where `zOrb = r * Math.sin(theta)`. This is not a proper 3D Keplerian transformation (missing right-ascension-of-ascending-node Ω). Effect is minor for near-zero inclinations but visible for Triton (156.9° retrograde) and Miranda (4.34°). Acceptable for an educational app but should be disclosed.

**Issue ORB-3 (LOW): No precession of orbital elements**  
Periapsis angles (ω) are static. Mercury's perihelion precesses 43″/century from GR — undetectable at the app's timescale (decades of simulation), so this is acceptable.

**Issue ORB-4 (LOW): One misleading inline comment in `PROBE_TRAJECTORIES`**  
The comment states `"educational scale: 51.28 scene-units/AU"` but `_probePositionAtJD()` actually uses `22.5 units/AU`. The value 51.28 is derived from the inner-planet distance table (Mercury at 20 units / 0.39 AU = 51.3/AU) — a different, inconsistent scale. The probe positions are computed correctly (22.5 is right) but the comment is wrong and misleading during code review.

---

### 4.3 Scale Representation

**Disclosed appropriately:**
- Onboarding text: "Models and orbits are scaled for easier viewing" ✅
- Moon distance `4 → real ~60 Earth radii` noted in code comments ✅
- Phobos/Deimos size inflation noted in `descPhobos` / `descDeimos` ✅
- Oort Cloud distance compression acknowledged in code comment ✅

**Inconsistency (documentation only, not a display bug):**  
The comment inside `PROBE_TRAJECTORIES` claims educational scale = 51.28 units/AU but the heliopause is at 2700 units = 120 AU → 22.5 units/AU. Both are "right" for their respective purposes but using them in the same code section without explanation is confusing for contributors.

**Notable design decision (acceptable):**  
Heliopause at 2700 educational units uses 22.5 units/AU. Inner planets use ~20-51 units/AU. This is a non-linear scale model — inner planets are spread out more than outer objects. This is a well-known necessary compromise in solar-system visualization and is disclosed as "educational mode."

---

### 4.4 Descriptions and Fun Facts

**CRITICAL — Issue DESC-1: Jupiter "shield" claim is scientifically contested**  
`funFactJupiter`: *"Jupiter's gravity shields Earth from many asteroids and comets!"*

This is a widely-repeated popularization that modern research has substantially challenged. Horner & Jones (2008, 2009, MNRAS) ran N-body simulations showing Jupiter's gravitational influence causes comet impacts with Earth at roughly equal frequency to protection. The "Jovian shield hypothesis" was further questioned by Wetherill (1994) and Grazier et al. (2019). Jupiter acts as both a deflector and a focuser — it throws some objects out of the solar system while redirecting others inward. The claim as written is at minimum misleading.

**Recommended fix:** Change to: *"Jupiter's massive gravity shapes the trajectories of asteroids and comets — sometimes deflecting them away from Earth, sometimes redirecting them inward. Its role as a 'shield' is more complex than once thought!"*

**MEDIUM — Issue DESC-2: Voyager distance strings are stale and incorrect**

| `descVoyager1` claim | Reality (Jan 2025) | Status |
|---|---|---|
| "~25.8 billion km (~172 AU)" | 163.7 AU (ref) | Wrong by ~8.3 AU |

| `descVoyager2` claim | Reality (Jan 2025) | Status |
|---|---|---|
| "~21.4 billion km (~143 AU)" | 136.6 AU (ref) | Wrong by ~6.4 AU |

The app's `PROBE_TRAJECTORIES` already computes the live position correctly — but the hardcoded strings in `i18n.js` are separate and stale. The description panel will show conflicting numbers to users who compare the position label to the description text.

**Recommended fix:** Either (a) derive the displayed AU distance dynamically from the live trajectory computation and inject into the description, or (b) update the strings and add a note "(as of YYYY)" with the version date.

**LOW — Issue DESC-3: Saturn ring thickness wording**  
*"Saturn's rings are only 10 meters thick but 280,000 km wide!"*  
10 m is the documented minimum thickness for the most tenuous ring regions. The dense B ring core reaches ~100 m–1 km. "As thin as 10 meters in places" would be scientifically honest.

**LOW — Issue DESC-4: Hale-Bopp nucleus underestimated**  
*"Its nucleus is unusually large at about 40 km in diameter"*  
The accepted estimate from Szabo et al. and Weissman (1997) is **~40–80 km**, with most sources citing ~50–60 km median. "At least 40 km" or "approximately 50–80 km" would be more accurate.

**LOW — Issue DESC-5: Pioneer plaque described as "gold"**  
`funFactPioneer10`: *"a gold plaque"*  
The Pioneer 10/11 plaques are gold-anodized aluminum. "Gold-anodized aluminum plaque" is the accurate description. This is a widespread popularization error.

**LOW — Issue DESC-6: Moon "stabilizes Earth's tilt"**  
`descMoon`: *"stabilizes Earth's tilt"*  
This comes from Laskar et al. (1993, Nature) which showed lunar torque helps damp obliquity variations. However, Lissauer et al. (2012) showed Earth's obliquity might be only moderately chaotic without the Moon (not wildly so). The claim is defensible but should be qualified: "may help stabilize Earth's axial tilt" rather than presenting it as settled fact.

**INFO — Fun fact about TRAPPIST-1 habitable zone**  
*"Three of them are in the habitable zone"* — accurate per Gillon et al. 2017; 3–4 planets (e, f, g ± d) depending on conservative vs. optimistic HZ boundaries. Fine as written for education.

---

### 4.5 Spacecraft and Mission Data

**Probe trajectory reference data (verified against NASA JPL Horizons):**

| Probe | refJD | refDistAU | Speed km/s | Source JD is... |
|---|---|---|---|---|
| Voyager 1 | 2460676.5 | 163.7 | 16.99 | Jan 1, 2025 ✅ |
| Voyager 2 | 2460676.5 | 136.6 | 15.35 | Jan 1, 2025 ✅ |
| New Horizons | 2460676.5 | 58.3 | 13.85 | Jan 1, 2025 ✅ |
| Pioneer 10 | 2452641.5 | 80.0 | 12.04 | ~Jan 2003 (last contact) ✅ |
| Pioneer 11 | 2450084.5 | 42.7 | 11.38 | ~Nov 1995 (last contact) ✅ |

> Code comment says all are Jan 2025 references — this is wrong for Pioneers. The actual implementation is correct (different refJDs), only the comment misleads. **Document this correctly.**

**MEDIUM — Issue SC-1: New Horizons status misclassified**  
Status: `"Active in Kuiper Belt"` — at 58+ AU, New Horizons is in the **scattered disc** region (typically >50 AU), which is distinct from the classical Kuiper Belt (30–50 AU). NASA's own mission updates describe New Horizons as operating in the "Kuiper Belt and beyond" or "outer solar system." Technically acceptable for an educational app but could be refined to "outer Kuiper Belt / Scattered Disc region."

**Mission data accuracy (selected):**

| Claim | Verdict |
|---|---|
| Voyager 1 mass "825.5 kg" | ✅ Correct |
| Pioneer 10 mass "258 kg" | ✅ Correct (257 kg at launch) |
| JWST mass "6,161 kg" | ✅ Correct |
| Juno solar panel span "20m" | ✅ Correct |
| Cassini mission ended "Sept 15, 2017" | ✅ Correct |
| ISS mass "419,725 kg" | ✅ Correct |
| ISS orbit "400 km altitude" | ✅ Correct (nominal) |
| Hubble "~535 km altitude" | ✅ Correct |
| GPS constellation "20,180 km altitude" | ✅ Correct |
| JWST first images "July 12, 2022" | ✅ Correct |
| Sputnik 1 launch "October 4, 1957" | ✅ Correct |
| Apollo 11 landing "July 20, 1969" | ✅ Correct |

---

### 4.6 Astronomical Event Data

Historical events are impressively accurate:

- 2024 total solar eclipse: "up to 4 minutes 28 seconds" ✅ (max was 4m28s)
- 2027 total solar eclipse: "up to 6 minutes 23 seconds in Egypt" ✅ (one of the longest this century — correct)
- Mars opposition Jan 16, 2025 magnitude −1.4 ✅
- Comet Hale-Bopp "visible to naked eye for 18 months" ✅
- Comet NEOWISE: "orbital period approximately 6,800 years" ✅ (estimates range 6,700–7,100 years)
- Great Conjunction Dec 21, 2020: "0.1° apart" ✅ (0.1° measured separation)

All checked events passed verification.

---

### 4.7 Texture and Visual Attribution

Per `ATTRIBUTION.md`:
- Textures primarily from Jerome Etienne's **threex.planets** (MIT) and Three.js authors ✅
- Phase-2 NASA textures planned but not yet integrated — honestly stated ✅
- Procedural fallbacks are Canvas 2D + Perlin noise — appropriate disclosure ✅
- **Disclaimer present:** *"Orbital parameters are approximations for visualization, not suitable for scientific calculations"* ✅

No false scientific accuracy claims tied to texture provenance.

---

### 4.8 Constellation and Star Data

- The 18 constellations include all standard IAU zodiac + major non-zodiac constellations ✅
- Nearby star distances are accurate: Proxima Centauri "4.24 light-years" ✅, Sirius "8.6 light-years" ✅
- Exoplanet host star descriptions accurate (TRAPPIST-1, Kepler-452, Kepler-186) ✅
- Kepler-452b "60% larger than Earth, 385-day year" ✅ (official: ~1.6 R⊕, 384.8-day period)
- TRAPPIST-1 "all 7 planets orbit closer than Mercury" ✅ (TRAPPIST-1 is 0.038 AU from its outermost planet; Mercury is 0.39 AU from Sun)
- Betelgeuse "would extend past Mars" ✅ (estimated 700–1,000 R☉ = 3.3–4.7 AU)

---

### 4.9 Oort Cloud and Heliosphere

**Heliopause placement:**  
Code: `heliopauseRadius = 2700` (educational) = 120 AU × 22.5 units/AU — correct and internally consistent. Comment "Real distance: ~120 AU (Voyager 1 crossed it at ~121 AU in Aug 2012; Voyager 2 at ~119 AU in Nov 2018)" ✅

**Oort Cloud placement:**  
Educational: 3,000–9,000 units = 133–400 AU (compressed from real 2,000–200,000 AU). Code comment accurately discloses this compression. The `descOortCloud` correctly states "50,000 to 200,000 AU from the Sun." ✅ (disclosure in code; educational scale appropriate)

**Issue ORT-1 (LOW):** `funFactOortCloud` states *"light from the Sun takes over 1.5 years to reach its outer edge"* — light travel time to 200,000 AU = 200,000 / 63,241 ly/AU = 3.16 light-years travel time. **"1.5 years"** refers to ~94,861 AU, not the outer edge. The correct statement for the outer Oort Cloud (200,000 AU) is approximately 3.2 light-years. For the commonly cited "inner edge" (~2,000 AU) it's ~2,000 / 63,241 = ~0.032 light-years = ~11.6 light-days. The "1.5 years" figure is inconsistent with either boundary — it may be a rough midpoint estimate or an error. Should state "> 3 light-years to outer edge."

---

## 5. Engineering Issue Backlog

Prioritized for resolution:

| ID | Priority | Domain | Description |
|---|---|---|---|
| DESC-1 | **HIGH** | Fun facts | Jupiter "shield" claim — scientifically contested, can cause educational misconceptions |
| DESC-2 | **HIGH** | i18n | Voyager 1/2 distance strings stale by 6–8 AU; contradict live trajectory display |
| ORB-1 | **HIGH** | Orbital model | Comet y-position hardcoded as `Math.sin(angle) * 15` — ignores individual orbital inclinations |
| ORB-4 | **MEDIUM** | Code quality | PROBE_TRAJECTORIES comment: claims "51.28 units/AU" but code uses 22.5 units/AU |
| SC-1 | **MEDIUM** | Spacecraft | New Horizons labeled "Kuiper Belt" but at ~58 AU it's in the scattered disc |
| DESC-3 | **LOW** | Fun facts | Saturn ring thickness "10 meters" should be "as thin as 10 meters" |
| DESC-4 | **LOW** | Descriptions | Hale-Bopp nucleus "40 km" should be "~40–80 km" |
| DESC-5 | **LOW** | Fun facts | Pioneer plaque "gold plaque" should be "gold-anodized aluminum" |
| DESC-6 | **LOW** | Descriptions | Moon "stabilizes Earth's tilt" should add "may help" qualifier |
| DOC-1 | **LOW** | README | Three.js version says 0.160.0, should be 0.183.0 |
| ORT-1 | **LOW** | Fun facts | Oort Cloud light travel time "1.5 years" incorrect; should be ">3 years to outer edge" |
| ORB-2 | **LOW** | Orbital model | Moon inclination uses simplified 2D projection (no RAAN Ω); visible for Triton |

---

## 6. Misleading Realism Review

The following features may give users unrealistic intuitions if not disclosed:

| Feature | Risk | Current disclosure | Recommendation |
|---|---|---|---|
| Asteroid belt particle density | High — real belt is extremely sparse; a spacecraft could fly through without seeing a single asteroid | None in UI | Add tooltip/description: "shown denser than reality for visibility" |
| Planet sizes in educational mode | Medium — some planets appear proportional, but relative sizes between inner/outer are not to scale | "Scaled for easier viewing" in onboarding | OK as-is |
| Moon orbital distances | Medium — Moon at 4 units vs real 60 Earth radii | Code note; no UI note | Fine for educational; no action needed |
| Oort Cloud inner boundary | Low — shown beginning just outside heliopause; real inner Oort is 2,000 AU (not 120 AU) | Code comment acknowledges | The `descOortCloud` text correctly gives 50,000–200,000 AU; acceptable |
| Comet orbits shared Y amplitude | Medium — all comets go to same height, masking that some (Hale-Bopp, Hyakutake) have near-polar orbits | None | Fix ORB-1; after fix, label comet orbital planes visually |

---

## 7. Documentation and UI Wording Fixes Required

### 7.1 i18n.js — English strings to update

```
// Current:
descVoyager1: '...Currently ~25.8 billion km (~172 AU) from Sun.'
// Fix: Remove hardcoded distance entirely, or add date qualifier:
descVoyager1: '...As of early 2025 approximately 163 AU from Sun and increasing at 17 km/s.'

// Current:
descVoyager2: '...Now ~21.4 billion km (~143 AU) from Sun.'
// Fix:
descVoyager2: '...As of early 2025 approximately 137 AU from Sun and receding at 15.4 km/s.'

// Current:
funFactJupiter: 'Jupiter\'s gravity shields Earth from many asteroids and comets!'
// Fix:
funFactJupiter: 'Jupiter\'s massive gravity deflects asteroids and comets — sometimes protecting inner planets, sometimes redirecting them inward. Its role as a "shield" is more complex than once thought!'

// Current:
funFactSaturn: 'Saturn\'s rings are only 10 meters thick but 280,000 km wide!'
// Fix:
funFactSaturn: 'Saturn\'s rings can be as thin as 10 meters in places but span up to 280,000 km wide — thinner than a sheet of paper relative to their width!'

// Current (descHaleBopp):
'Its nucleus is unusually large at about 40 km in diameter.'
// Fix:
'Its nucleus is unusually large — estimated at 40–80 km in diameter!'

// Current (funFactPioneer10):
'...a gold plaque...'
// Fix:
'...a gold-anodized aluminum plaque...'

// Current (funFactOortCloud):
'...light from the Sun takes over 1.5 years to reach its outer edge!'
// Fix:
'...light from the Sun takes over 3 years to reach its outer edge at 200,000 AU!'
```

### 7.2 Code comments to correct

**File:** `src/modules/SolarSystemModule.js`  
**Near PROBE_TRAJECTORIES definition (~line 8705):**
```javascript
// WRONG:
// 1 AU = 149 597 870.7 km          educational scale: 51.28 scene-units/AU
//                                  realistic   scale: 150    scene-units/AU

// CORRECT:
// 1 AU = 149 597 870.7 km
// Heliospheric scale: educational = 22.5 scene-units/AU (heliopause 2700 / 120 AU)
//                    realistic    = 150   scene-units/AU (heliopause 18000 / 120 AU)
// NOTE: Inner planet positions use a different effective scale (~20–51 units/0.39–30 AU)
//       because their distances are not derived from AU but are set as visual display units.
//       Pioneer 10 refJD = 2452641.5 ≈ Jan 2003 (last contact date, not Jan 2025).
//       Pioneer 11 refJD = 2450084.5 ≈ Nov 1995 (last contact date, not Jan 2025).
```

### 7.3 README.md fix

```
# Current:
Three.js v0.160.0

# Fix:
Three.js v0.183.0
```

---

## 8. Remediation Plan

### Phase 1 — Quick fixes (1–2 hours, all in `src/i18n.js` + comments)

1. Update Voyager 1/2 description strings with dated distance estimates  
2. Rewrite Jupiter "shield" fun fact  
3. Qualify Saturn ring thickness ("as thin as")  
4. Fix Hale-Bopp nucleus size range  
5. Fix Pioneer plaque material description  
6. Fix Oort Cloud light-travel-time claim  
7. Fix PROBE_TRAJECTORIES comment (scale factor + Pioneer refJD explanation)  
8. Fix README Three.js version  

### Phase 2 — Model improvements (2–4 hours)

9. **Fix comet orbital inclinations (ORB-1):**  
   Add `inclination` field to each entry in `cometsData`:
   ```javascript
   { name: "Halley's Comet", ..., inclination: 162.3 },  // retrograde
   { name: 'Comet Hale-Bopp', ..., inclination: 89.4 },
   { name: 'Comet Hyakutake', ..., inclination: 124.9 },
   { name: 'Comet Lovejoy', ..., inclination: 134.1 },
   { name: 'Comet Encke', ..., inclination: 11.8 },
   { name: 'Comet Swift-Tuttle', ..., inclination: 113.4 }
   ```
   Then update the three y-position lines (3760, 9372, 10415):
   ```javascript
   // Replace: comet.position.y = Math.sin(userData.angle) * 15;
   // With:
   const inclRad = (userData.inclination || 0) * Math.PI / 180;
   comet.position.y = r * Math.sin(angle) * Math.sin(inclRad);
   ```
   Note: the orbit preview line in `createComets()` (~line 7422) also needs updating to draw the orbit path on the correct inclined plane.

10. **Qualify Moon tilt stabilization claim** — add "may help" qualifier  
11. **Add "shown denser than reality" to asteroid belt description** — add funFact or tooltip note  
12. **Clarify New Horizons status** — "Active, exploring outer Kuiper Belt / Scattered Disc"  

---

## 9. Final Scores

| Dimension | Score | Rationale |
|---|---|---|
| **Planetary Physics Data** | 96/100 | Near-perfect radii, tilts, rotation periods; minor Pluto period rounding |
| **Orbital Mechanics** | 74/100 | Solid Keplerian core; comet inclinations hardcoded, moon inclination simplified, misleading comment |
| **Spacecraft Mission Data** | 78/100 | Accurate trajectory model; stale Voyager distance strings; Pioneer comment wrong |
| **Descriptions & Fun Facts** | 82/100 | Mostly accurate; Jupiter shield myth contested; Voyager distances wrong; minor errors |
| **Scale Transparency** | 85/100 | Educational mode properly disclosed; asteroid belt density not flagged |
| **Documentation Quality** | 70/100 | README version stale; PROBE_TRAJECTORIES comment has wrong scale factor; code comments otherwise good |
| **Overall** | **81/100** | Strong scientific foundation. Fixable gaps, no fatal flaws. |

---

## 10. Top 5 Must-Fix Before Public Release

These issues risk actively misleading users or breaking scientific credibility:

### 🔴 Must-Fix #1 — Voyager 1/2 stale distance strings  
**File:** `src/i18n.js` (× 6 languages)  
**Impact:** Description panel shows distances inconsistent with the live trajectory visualization (~8 AU error for V1). Educationally confusing and factually incorrect for current date.

### 🔴 Must-Fix #2 — Jupiter "shields Earth" fun fact  
**File:** `src/i18n.js` (× 6 languages)  
**Impact:** Perpetuates a widely-contested popular myth. Multiple peer-reviewed papers from 2008–2019 have shown Jupiter's protective role is neutral-to-negative in some scenarios. Should not be stated as settled fact in an educational app.

### 🔴 Must-Fix #3 — Comet orbital inclinations hardcoded  
**File:** `src/modules/SolarSystemModule.js` lines 3760, 9372, 10415  
**Impact:** Hale-Bopp (~89° inclination) and Hyakutake (~125°) visually orbit in a nearly flat plane like the planets. Halley's is retrograde and near-ecliptic but shown with an arbitrary sinusoidal ramp. This is a model error visible to any user who knows comet orbits.

### 🟡 Must-Fix #4 — PROBE_TRAJECTORIES comment (scale factor)  
**File:** `src/modules/SolarSystemModule.js` ~line 8705  
**Impact:** States "educational scale: 51.28 scene-units/AU" but the function uses 22.5. Any contributor modifying probe positions will use the wrong conversion factor from this documentation. Also the Pioneer refJD dates are documented as "Jan 2025" but are actually each probe's last-contact dates.

### 🟡 Must-Fix #5 — README Three.js version  
**File:** `README.md`  
**Impact:** States v0.160.0; importmap uses v0.183.0. Developers trying to find compatible Three.js addons or reporting issues will be working from the wrong version.

---

*End of Scientific QA Audit. Issues are tracked in the Engineering Issue Backlog (§5). The top-priority code fix (ORB-1: comet inclinations) and all i18n text corrections are ready to implement.*
