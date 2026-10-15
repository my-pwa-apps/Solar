# Space Voyage — Engineering Backlog

Actionable items produced by structured engineering reviews. Items are grouped by
review date. **Do not delete unresolved items** — tick the checkbox when done and
leave the entry in place so the history of the decision survives.

---

## Review - 2026-09-07 (current worktree, v2.10.324)

The review below records v2.10.324. Implementation follow-up is v2.10.325;
existing uncommitted work and unresolved historical entries are preserved.
`npm run verify`: 26 unit tests and 73 browser tests passed, 13 intentional skips;
lint has 0 errors and 210 existing warnings. See
`docs/ENGINEERING_REVIEW_2026-09-07.md` for scope and remaining limitations.

- [x] **R1: Make vendored engine precaching mandatory**

      **Resolution (v2.10.325):** Engine graph is mandatory in the atomic install.
      Required/optional failure injection, failed real update and fresh offline
      full-app startup with decoded textures pass.

      **Priority:** High  
      **Category:** Reliability  
      **Confidence:** High  
      **Area:** Service-worker installation / offline startup  
      **Affected files:** `sw.js`, `tests/e2e/app.spec.js`  
      **Evidence:** CONFIRMED: a Node VM execution of the real install handler with
      `three.core.js` rejected still resolved installation and emitted `SW_INSTALLED`.
      `Promise.allSettled(CDN_CACHE_FILES...)` discards the rejection results.  
      **Problem:** A failed engine download does not fail installation, even though
      the engine has no offline fallback.  
      **Impact:** An apparently successful install can leave a blank/fatal startup
      on the next offline launch.  
      **Recommended solution:** Include the complete vendored module graph in the
      mandatory shell transaction; keep only optional media best effort.  
      **Regression considerations:** Optional texture failures must still permit
      installation; a failed update must leave the previous worker usable.  
      **Acceptance criteria:** Failure of any required engine request rejects the
      install and reports failure; a successful install boots offline.  
      **Validation:** Fault-inject one engine request and one optional texture
      request; test fresh offline boot and failed-update recovery.  
      **Estimated effort:** Small  
      **Business value:** High  
      **Technical debt reduction:** Medium

- [x] **R2: Isolate cache cleanup and recovery to Space Voyage**

      **Resolution (v2.10.325):** Cleanup filters owned cache names, exact worker
      scope and the texture database. Sibling browser sentinels survive; unit tests
      cover awaited success, denial, errors and bounded blocked deletion.

      **Priority:** High  
      **Category:** Data  
      **Confidence:** High  
      **Area:** Origin storage ownership  
      **Affected files:** `sw.js`, `src/modules/FatalError.js`  
      **Evidence:** CONFIRMED: fault-injected activation deleted `another-app-offline`;
      executing `clearAllStorage()` against fake sibling stores requested unregister,
      cache deletion and `OtherAppData` database deletion. Neither path filters owners.  
      **Problem:** Service-worker scopes do not isolate origin-wide Cache Storage or
      IndexedDB. Recovery also enumerates every service-worker registration.  
      **Impact:** At the documented shared GitHub Pages origin, another app can lose
      offline state or persisted user data. This is accidental destructive behavior,
      not a demonstrated cross-origin exploit.  
      **Recommended solution:** Filter caches by owned prefixes, unregister only the
      matching application scope, and delete only `SolarSystemTextureCache`; close
      its connection and await deletion success/error/blocked handling before reload.  
      **Regression considerations:** Preserve other applications and user preferences;
      failed storage cleanup must retain a usable reload action.  
      **Acceptance criteria:** Sibling worker/cache/database sentinels survive both
      activation and recovery; only owned state is cleared.  
      **Validation:** Browser fixture with two application scopes, open IndexedDB
      connections and sentinel data; mock denied/blocked deletion.  
      **Estimated effort:** Small  
      **Business value:** High  
      **Technical debt reduction:** Medium

- [x] **R3: Keep HTML and modules consistent across worker versions**

      **Resolution (v2.10.325):** Controlled navigation uses the installed shell and
      release-scoped modules. Real workers verify pending notification on reopen,
      failed upgrade survival, approved activation with one reload and rollback.

      **Priority:** High  
      **Category:** Deployment  
      **Confidence:** High  
      **Area:** PWA release consistency  
      **Affected files:** `sw.js`, `src/modules/ServiceWorkerManager.js`, `tests/e2e/app.spec.js`  
      **Evidence:** CONFIRMED mechanism: navigation returns network HTML, script keys
      discard `?v=`, and `caches.match()` searches all caches without a release name.
      A VM probe returned an old module for a next-version request. Registration only
      watches future `updatefound` events and does not inspect an existing `waiting`.  
      **Problem:** New HTML can run old modules before activation; global cache lookup
      can select old or partially installed release entries. A reopened tab can miss
      the notification for an already-waiting worker.  
      **Impact:** LIKELY release-only boot/API mismatches or users stranded on stale code;
      an actual two-version deployed upgrade was not run in this review.  
      **Recommended solution:** Choose an explicit release-consistent shell policy,
      scope lookups to the controlling release, retain version identity where needed,
      and announce an existing waiting worker. Use the reopened lifecycle test below.  
      **Regression considerations:** Preserve user-controlled activation and exactly
      one reload; failed installs must preserve the last working release.  
      **Acceptance criteria:** Two deliberately incompatible fixture releases never
      mix shell/modules; reopening a tab offers its pending update; rollback works.  
      **Validation:** Real worker installs, interrupted install, waiting worker,
      tab reopen, activation, offline reload and versioned module assertions.  
      **Estimated effort:** Medium  
      **Business value:** High  
      **Technical debt reduction:** High

- [x] **R4: Fall back to the cached shell on host errors and stalls**

      **Resolution (v2.10.325):** Installed navigation returns its paired shell
      immediately during 503/stalled hosting. Missing-shell network recovery has a
      five-second deadline; deliberate 4xx responses remain distinct.

      **Priority:** Medium  
      **Category:** Reliability  
      **Confidence:** High  
      **Area:** Navigation recovery  
      **Affected files:** `sw.js`, `tests/e2e/app.spec.js`  
      **Evidence:** CONFIRMED: a VM fetch-handler probe returned HTTP 503 despite a
      cached shell. The network-first branch falls back only when fetch rejects and
      has no deadline or AbortController.  
      **Problem:** An available HTTP error response or a stalled request bypasses or
      indefinitely postpones offline recovery.  
      **Impact:** Installed users cannot start the cached experience during an outage.  
      **Recommended solution:** Use an explicit navigation deadline and fall back
      on transient server errors; define intentional 4xx behavior separately.  
      **Regression considerations:** Healthy HTML update checks must continue; do not
      cache error documents as a successful shell. Coordinate the policy with R3.  
      **Acceptance criteria:** 503 and stalled navigation return a valid cached shell
      within the chosen deadline; cold-cache failure remains actionable.  
      **Validation:** Real-worker offline, HTTP 503, stalled-response and healthy-network tests.  
      **Estimated effort:** Small  
      **Business value:** High  
      **Technical debt reduction:** Medium

- [ ] **R5: Self-host XR input profiles and controller model assets**

      **Implementation complete; hardware validation pending (v2.10.325):** Pinned
      MIT-licensed profiles/models are local, mandatory-cached and attached to the
      controller grips. Both hands for seven profiles plus generic fallback decode
      online/offline without external requests. Assets add 13,364,513 bytes.
      Physical Quest controller interaction remains a release-checklist gate.

      **Priority:** Medium  
      **Category:** Compatibility  
      **Confidence:** High  
      **Area:** WebXR controller models  
      **Affected files:** `src/modules/SceneManager.js`, `vendor/three@0.183.2/examples/jsm/webxr/XRControllerModelFactory.js`, `sw.js`  
      **Evidence:** CONFIRMED: the live factory path is jsDelivr's input-profile URL;
      `SceneManager` never calls `setPath()`. The vendor connected handler calls
      `fetchProfile()` there, while the document has `connect-src 'self'`.  
      **Problem:** Vendoring Three.js did not vendor the runtime profile/model data.  
      **Impact:** Controller model loading conflicts with CSP and offline support.
      Headset impact was not hardware-tested; this does not establish broken locomotion.  
      **Recommended solution:** Vendor the supported profile index, JSON and model
      assets with attribution; configure a local path and cache that graph.  
      **Regression considerations:** Keep same-origin CSP, controller rays, handedness
      and generic input fallback; do not fix this by allowing a public CDN.  
      **Acceptance criteria:** Supported controller models decode online and offline
      without external requests or CSP violations.  
      **Validation:** Bounded synthetic connected-event fetch test plus the documented
      physical Quest release checklist.  
      **Estimated effort:** Medium  
      **Business value:** Medium  
      **Technical debt reduction:** Medium

- [x] **R6: Refresh the vulnerable development-server dependency**

      **Resolution (v2.10.325):** Compatible transitive update applied; clean
      `npm ci` and browser server tests pass, with zero reported vulnerabilities.

      **Priority:** Low  
      **Category:** Dependency  
      **Confidence:** High  
      **Area:** Local development supply chain  
      **Affected files:** `package-lock.json`, `package.json`  
      **Evidence:** CONFIRMED: `npm audit --audit-level=high` reports one moderate
      vulnerable dependency, `qs`; `npm explain qs` resolves `http-server > union >
      qs@6.15.3`. Advisories: GHSA-x5fp-wj9c-mxmx and GHSA-4mjr-xmp4-gh2g.  
      **Problem:** The lockfile retains an affected development-only parser.  
      **Impact:** Tooling exposure, not a shipped browser vulnerability. Both configured
      servers bind loopback; deployment contains no Node request handler.  
      **Recommended solution:** Apply the compatible audited transitive update and
      verify the lockfile and local server. Do not perform a forced major upgrade.  
      **Regression considerations:** Keep reproducible installs and browser fixtures.  
      **Acceptance criteria:** Audit reports no known qs advisory; clean install and
      local-server smoke test pass.  
      **Validation:** `npm ci`, `npm audit`, focused browser boot/static checks.  
      **Estimated effort:** Small  
      **Business value:** Low  
      **Technical debt reduction:** Low

---

## Review — 2026-08-18 (branch `opus5realtime`, v2.10.305)

Feature work: real-ephemeris date control and solar eclipse shadow.

### Resolved

- [x] **Three.js is no longer loaded from a third-party CDN.** *(Closes the
      Critical item carried since 2026-07-27.)* Vendored to
      `vendor/three@0.183.2/`. Recursively resolving the addons' imports turned up
      **20** required files, not the 8 that were precached — `three.core.js`,
      `Pass.js`, `GLTFLoader.js`, `motion-controllers.module.js` and four shader
      modules were all missing, so a cold offline start could never have worked.
      `cdn.jsdelivr.net` is now absent from the CSP, the importmap, the
      preconnect hints and `sw.js`; the static regression test asserts it stays
      that way and that every precached vendor file exists on disk.
- [x] **CSP inline-script hashes are now generated, not hand-maintained.** New
      `scripts/update-csp-hash.mjs` (`npm run csp:sync` / `csp:check`, wired into
      `pretest`). While building it, a genuine trap surfaced: the HTML parser
      normalises CRLF to LF before the CSP hash is computed, but `index.html` is
      CRLF on disk — hashing the raw bytes yields a digest the browser never
      sees, and the failure mode is a silent hang on the loading screen with no
      obvious cause.
- [x] **The pure astronomy is now tested under Node.** `npm run test:unit` runs
      14 assertions in ~0.5 s against code that previously needed a five-minute
      Playwright run. Added coverage that did not exist before: annular
      classification, rejection when the Moon is anti-solar, lunar perigee/apogee
      and inclination bounds, GMST rate, and far-future stability.
- [x] **Removed the dead Earth rotation branch.** Guarded by
      `planet.userData.name === 'Earth'` while the field holds `'earth'`, it had
      never executed. Earth is now explicitly excluded from the generic rotation
      path, since `_applyEarthOrientation()` owns its orientation.
- [x] **Earth's Moon was never actually repositioned.** The guard read
      `planet.userData.name === 'Earth'`, but that field holds `'earth'`, so the
      ephemeris override never ran and the Moon stayed on its decorative circular
      orbit — 120° away from the Sun during totality, while the shadow was drawn
      from the real ephemeris. Now compared by object identity
      (`planet === this.planets.earth`). Caught by a user, not by the tests; a
      regression test was added.
- [x] **The full lunar series ran twice per frame.** `_applyEarthOrientation()`
      and `_moonDirectionObjectSpace()` each called `sunMoonVectors()` with the
      same instant, evaluating ~120 periodic terms twice every frame.
      `sunMoonVectors()` now memoises on the exact Julian Day.
- [x] **The eclipse finder sampled every instant twice.** Replaced the
      look-ahead with a three-sample sliding window, halving a synchronous
      main-thread scan that spans up to 400 days.
- [x] **`EclipseRenderer.attach()` could return a permanently inert renderer.**
      It reported success on an already-patched material without restoring
      `this.uniforms`, so a second instance would silently never draw. It now
      recovers the uniforms from `material.userData`.
- [x] **The eclipse readout froze at first contact.** The state event only fired
      on transitions, so the displayed coordinates never followed the moving
      shadow. It now also fires while an eclipse is active.
- [x] **The Time Machine was dead code.** `setupTimeMachine()` in `src/main.js` was
      fully implemented — date stepping, reverse, "Now", a throttled
      `simulatedDateChanged` event — but not one of its DOM elements existed in
      `index.html`, so every `getElementById` returned null and the whole feature
      silently no-opped. Added the panel markup, a `datetime-local` input, an
      eclipse readout and a "Next eclipse" jump, plus styles, i18n for all six
      locales, drag support and a collapse toggle.
- [x] **Earth's orientation did not match the sky.** The scene put the sub-solar
      point at 21.5°S 24.6°E when the true one was 14.8°N 96.1°W.
      `_applyEarthOrientation()` now aligns the true sub-solar point with the
      scene's Sun, fixing the lit hemisphere, the terminator and the seasons.

### New

- [x] Remove the dead `userData.name === 'Earth'` rotation branch — **done 2026-08-18**

Priority: Medium
Category: Cleanup
Area: `SolarSystemModule`
Affected files: `src/modules/SolarSystemModule.js`
Problem: The planet update loop has a carefully written Earth special case that
computes GMST and the Sun's right ascension to derive the sub-solar longitude. It
is guarded by `planet.userData.name === 'Earth'`, but the field holds `'earth'`,
so the branch has never executed — Earth silently fell through to the generic
rotation path. This is the same class of defect that left the Moon misplaced.
Impact: Roughly 20 lines of plausible-looking dead code that a future maintainer
will read as authoritative. `_applyEarthOrientation()` now supersedes it entirely,
so leaving both invites a contradictory "fix".
Recommended solution: Delete the branch and the now-unused `_sunRA()` helper if
nothing else references it. Audit for other string comparisons against
`userData.name`, which is a localised display value.
Acceptance criteria: No comparison of `userData.name` against a hardcoded English
name remains; a test asserts Earth's orientation still tracks the sub-solar point.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Medium

- [ ] Give celestial objects a stable, non-localised identity

Priority: High
Category: Technical Debt
Area: `SolarSystemModule`
Affected files: `src/modules/SolarSystemModule.js`, `src/main.js`
Problem: `userData.name` is used both as a display string and as an identity key,
and its casing is inconsistent (`'earth'` for planets, `'Earth'` assumed by
comparisons, translated values elsewhere). Two real bugs in this branch alone
traced back to it. Object lookups elsewhere match on English display names, which
breaks under translation.
Impact: Silent, hard-to-spot failures where a guard simply never fires. Nothing
throws; the feature just does not happen.
Recommended solution: Introduce `userData.id` on every object as a lowercase,
stable, never-translated key, and use it for all comparisons and lookups. Reserve
`userData.name` strictly for display.
Acceptance criteria: No behavioural code compares `userData.name`; switching
language does not change any lookup result. Merges with the existing Low-priority
item on keying lookups by stable id.
Estimated effort: Medium
Business value: High
Technical debt reduction: High

- [x] Move the eclipse search off the main thread — **done 2026-08-19**

Priority: Low
Category: Performance
Area: `src/modules/astro/Eclipse.js`
Affected files: `src/modules/astro/Eclipse.js`, `src/main.js`
Problem: "Next eclipse" runs a synchronous scan of up to 1,600 quarter-day steps,
each evaluating the ~120-term lunar series, then a 60-iteration golden-section
refinement. The sliding-window change halved it, but it still blocks the render
loop for a visible pause.
Impact: A frame hitch on desktop and a longer stall on mobile, during an
interaction that is meant to feel instant.
Recommended solution: Move the scan into a Web Worker, or yield to
`requestIdleCallback` between coarse steps. A precomputed table of central
eclipses for 1900-2100 would be smaller than one texture and effectively free.
Acceptance criteria: Pressing "Next eclipse" never blocks the main thread for
more than 16 ms.
Estimated effort: Medium
Business value: Low
Technical debt reduction: Low

- [x] Test the astronomy without booting the whole 3D app — **done 2026-08-18**

Priority: Medium
Category: Testing
Area: Test suite
Affected files: `tests/e2e/eclipse.spec.js`, `package.json`
Problem: `src/modules/astro/*` is pure, dependency-free maths, but every
assertion about it runs through Playwright: launch Chromium, load Three.js,
build a 213-object scene, wait for textures. The ephemeris suite takes over five
minutes to test code that would run in milliseconds under Node.
Impact: Slow feedback discourages running the tests, which is precisely how the
misplaced-Moon bug reached a user.
Recommended solution: Add a Node test runner (`node --test`) for the pure modules
and keep Playwright for rendering and DOM behaviour. The modules are already
plain ESM and import nothing from Three.js.
Acceptance criteria: Ephemeris and eclipse-geometry assertions run under Node in
under two seconds via `npm test`; Playwright retains only the rendering tests.
Estimated effort: Small
Business value: High
Technical debt reduction: Medium

- [x] Keep Earth's rotation axis fixed in inertial space — **done 2026-08-19**

Priority: High
Category: Bug
Area: `solar-system/orbital-mechanics.js`
Affected files: `src/modules/solar-system/orbital-mechanics.js`
Problem: `_applyEarthOrientation()` maps the object-space sub-solar direction onto the
scene Sun direction, then rotates about that axis to bring the pole as close to scene
+Y as possible. That leaves the pole in the plane spanned by the Sun direction and +Y,
so as Earth orbits the axis swings with the Sun instead of pointing at a fixed
celestial point. Earth's true axis is inertially fixed at ecliptic latitude 66.56 deg,
longitude 90 deg. Found by an independent model audit (Gemini 3.1 Pro), confirmed by
inspection.
Impact: Solar declination and the sub-solar point are still exact, so eclipse
placement is unaffected (Earth verified to 0.2 deg, city test 9/9). What is wrong is
the azimuthal orientation of the tilt: Earth's visual lean is wrong through the year
and its alignment against the star field does not hold.
Recommended solution: Replace the "closest to +Y" heuristic with the true pole
direction. In a scene whose XZ plane is the ecliptic, the celestial north pole sits at
(0, cos eps, sin eps) once the scene frame is aligned to the ecliptic. Build the
orientation from the fixed pole plus a sidereal spin angle rather than from a
shortest-arc fit to the Sun.
Acceptance criteria: Earth's world-space axis direction is constant to within 0.01 deg
across a full simulated year; sub-solar latitude and longitude remain accurate to the
current tolerances; the eclipse regression tests still pass.
Estimated effort: Medium
Business value: High
Technical debt reduction: Medium

- [x] Make eclipse `gamma` signed — **done 2026-08-19**

Priority: Medium
Category: Bug
Area: `src/modules/astro/Eclipse.js`
Affected files: `src/modules/astro/Eclipse.js`, `tests/unit/astro.test.mjs`
Problem: `gamma` is computed as `len(closestPoint) / EARTH_RADIUS_KM` and is therefore
always positive. The published parameter is signed, positive when the axis passes
north of Earth's centre. Found by an independent model audit (GPT-5.5).
Impact: The 2026 test passes only because that eclipse's gamma happens to be positive.
A southern-node eclipse would disagree with published values and the test would not
catch it, so the assertion is weaker than it appears.
Recommended solution: Project the closest-approach point onto the fundamental plane
and take the sign from its north component, then assert a signed value in the tests
using an eclipse with negative gamma as well.
Acceptance criteria: `gamma` matches published sign and magnitude for one positive and
one negative gamma eclipse.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Low

- [x] Reposition the Moon mesh inside `seekToDate` — **done 2026-08-19**

Priority: Low
Category: Bug
Area: `solar-system/orbital-mechanics.js`
Affected files: `src/modules/solar-system/orbital-mechanics.js`
Problem: `seekToDate()` calls `_applyEarthOrientation()` and `_updateEclipse(true)` but
never applies `_moonDirectionObjectSpace()`, so the Moon mesh keeps its previous
position until the next animation frame runs the planet loop.
Impact: Immediately after a date jump the Moon is visibly in the wrong place while the
shadow is already correct. Tests must wait two frames to observe the Moon, which is a
workaround for the bug rather than a property of the app.
Recommended solution: Set Earth's Moon position directly in `seekToDate`, reusing the
same code path as the update loop.
Acceptance criteria: Immediately after `seekToDate` to a totality instant, and before
any frame is rendered, the Moon lies within 2 deg of the Earth-Sun line.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [x] Reconcile planet radii and moon orbital distances onto one scale — **done 2026-08-19**

Priority: High
Category: Business Logic
Area: `solar-system/celestial-factory.js`
Affected files: `src/modules/solar-system/celestial-factory.js`
Problem: Planet radii use true size ratios (Jupiter = 10.97 scene units) while moon
distances were compressed to fit the composition. Jupiter's Galilean moons orbit at
1.1-2.1 Jupiter radii against a true 6.0-26.9, so Io appears to skim the cloud tops
and the 1:2:4 Laplace resonance spacing is invisible. The two quantities sit on
incompatible scales, so no distance value satisfies correct ratios, moons outside the
planet, and the current visual envelope at once: true ratios put Callisto at ~295
units, beyond Jupiter's own orbital radius of 266.
Impact: The most visible remaining scientific inaccuracy. It also produced a
misleading artifact — an over-large moon shadow is indistinguishable from a rendering
fault, which is what prompted this investigation.
Recommended solution: Pick one scale and apply it consistently. Either reduce planet
radii so a true-ratio moon halo fits, or expand the halo and widen `focusOnObject`
framing for gas giants. Drive it from the existing educational/scientific toggle so
the exaggeration is explicit rather than hidden, and state the active mode in the UI.
Acceptance criteria: In scientific mode every moon's orbital radius expressed in
planet radii matches reality within 10%; no moon intersects its planet in either
mode; a regression test asserts both.
Estimated effort: Medium
Business value: High
Technical debt reduction: Medium

- [ ] Restore moon transit shadows analytically

Priority: Low
Category: Feature
Area: Rendering
Affected files: `src/modules/solar-system/celestial-factory.js`, `src/modules/astro/`
Problem: `sunLight.castShadow` was disabled in v2.10.311 because a point-light cube
shadow with a 1024px map and `far = 5000` spans the whole solar system; each texel
covers an enormous volume and the depth comparison degenerates into hard-edged black
discs that appear even with no moon in front of the planet.
Impact: Galilean moon transits — a genuinely striking real phenomenon — are no longer
drawn at all.
Recommended solution: Reuse the analytic approach already proven for solar eclipses:
compute the shadow cone in real kilometres and project it in the planet's shader.
`astro/Eclipse.js` generalises to any occluder/primary pair.
Acceptance criteria: A known Io transit date shows a shadow at the correct longitude;
no shadow appears when no moon lies between the Sun and the planet.
Estimated effort: Medium
Business value: Medium
Technical debt reduction: Low

- [x] Re-base the scene's orbital frame onto the true ecliptic — **done 2026-08-19**

Priority: High
Category: Correctness
Area: `SolarSystemModule`
Affected files: `src/modules/SolarSystemModule.js`
Problem: Planet orbital angles are seeded for appearance, not coordinates. Earth's
scene angle is 216.7° when its true heliocentric ecliptic longitude is 320.1° — a
103° error. Every planet is affected, so "today's configuration" is only genuinely
correct for the Earth-Moon-Sun subsystem, which this branch aligns explicitly.
Impact: Planetary alignments, conjunctions and the relative geometry of the outer
planets are decorative rather than accurate, which undercuts the educational claim.
Recommended solution: Seed each planet's mean longitude from its VSOP87 elements at
the simulated epoch and map scene azimuth directly to ecliptic longitude. Then
`_applyEarthOrientation()` reduces to a plain sidereal spin.
Acceptance criteria: For any date, every planet's scene azimuth matches its true
heliocentric ecliptic longitude within 1°; a regression test asserts this for all
eight planets on three separate dates.
Estimated effort: Large
Business value: High
Technical debt reduction: High

- [x] Make the umbra discoverable without extreme zoom — **done 2026-08-19**

Priority: Medium
Category: UX
Area: Eclipse rendering
Affected files: `src/modules/astro/EclipseRenderer.js`
Problem: The umbra is drawn at its true size — about 110 km across on a 12,742 km
globe, under 1% of Earth's width. At any normal viewing distance it is a couple of
pixels, so users are unlikely to find the very thing the feature exists to show.
Impact: The headline feature is effectively invisible unless the camera is placed
within roughly 1,000 km of the shadow.
Recommended solution: Draw a thin ring or crosshair at the shadow centre that holds
a minimum screen size, and offer a "fly to the shadow" action from the eclipse
readout. Keep the shaded area itself physically exact.
Acceptance criteria: From a default Earth view the shadow location is visible; the
shaded region's angular size is unchanged.
Estimated effort: Medium
Business value: High
Technical debt reduction: Low

- [x] Draw partial (non-central) eclipses — **done 2026-08-19**

Priority: Low
Category: Feature
Area: Eclipse rendering
Affected files: `src/modules/astro/EclipseRenderer.js`, `src/modules/astro/Eclipse.js`
Problem: `EclipseRenderer.update()` deliberately skips events where the shadow axis
misses Earth. `Eclipse.js` already classifies these as partial and computes the
penumbra, but a penumbra covering most of a hemisphere reads as a rendering fault
rather than an eclipse, so nothing is drawn.
Impact: Partial solar eclipses — the majority of events — produce no visual at all.
Recommended solution: Render the penumbra with a much shallower curve and label it
in the readout so the dimming is clearly intentional.
Acceptance criteria: A known partial eclipse produces visible, clearly-labelled
limb dimming.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [ ] Model eclipse timing to better than a minute

Priority: Low
Category: Correctness
Area: `src/modules/astro/Ephemeris.js`
Problem: The truncated Meeus lunar series places the shadow within about 20 km of
the truth, rising to ~60 km at grazing incidence. Gamma and magnitude match
published values to ~5e-4, but the along-track position drifts by 40–80 s, and the
ΔT polynomial over-estimates by ~6 s for the 2020s.
Impact: Contact times for a specific location can be a minute out. Fine for showing
where the shadow falls; not adequate for planning an observation.
Recommended solution: Add the remaining ELP terms or adopt a compact VSOP87/ELP
implementation, and use a measured ΔT table for 2000-2030.
Acceptance criteria: Greatest-eclipse position within 10 km for gamma below 0.5.
Estimated effort: Medium
Business value: Low
Technical debt reduction: Low

---

## Review — 2026-08-18 (branch `main`, v2.10.304)

Scope: second full-repository review. Findings from the 2026-07-27 pass that are
still open are **not** repeated here — see that section below. This pass focused on
areas the first review did not reach: the third-party dependency supply chain, the
offline module graph, PWA manifest parity, IndexedDB behaviour, accessibility, and
the failure surface. Items fixed during this pass are listed at the bottom.

Three findings from the previous review were re-verified and turned out to be
**inaccurate**, and are struck through in that section: `SceneManager` already has a
`dispose()`, `optgroup` labels *are* translated by `applyTranslations()`, and
`document.documentElement.lang` *is* updated by `setLanguage()`.

---

### Critical

- [x] Self-host Three.js instead of loading the 3D engine from a public CDN — **done 2026-08-18**

Priority: Critical
Category: Security
Area: Dependency supply chain / first-load reliability
Affected files: `index.html`, `sw.js`, `package.json`, `vendor/` (new)
Problem: The entire rendering engine — `three@0.183.2` plus eight `three/addons/*`
modules — is fetched at runtime from `cdn.jsdelivr.net`, listed in an importmap and
allowed by `script-src` in the CSP. There is no Subresource Integrity (importmap
entries cannot carry one), and `three` appears in no dependency manifest, so
`npm audit`, Dependabot and every SCA tool are blind to it.
Impact: Two distinct risks. (1) Supply chain: a jsdelivr compromise or a mutated
package executes arbitrary script with full DOM access in every user's browser, and
nothing in the repository would detect it. (2) Availability: a first-time visitor
behind a firewall that blocks jsdelivr, or on a network where the CDN is slow, gets a
permanently blank screen — the app cannot boot at all, and its own stated design
principle ("fully self-hosted for offline reliability") is violated by its single
largest dependency.
Recommended solution: Vendor the pinned build and the addons actually imported into
`vendor/three/`, point the importmap at those relative paths, drop `cdn.jsdelivr.net`
from the CSP `script-src`, add the vendored files to `CORE_CACHE_FILES`, and record
the version in `package.json` so tooling can see it. Recompute the CSP hash for the
inline importmap in the same commit. Keep the update procedure in `CONTRIBUTING.md`.
Acceptance criteria: The app boots with `cdn.jsdelivr.net` blocked at the network
level; CSP `script-src` is `'self'` plus the importmap hash only; `npm ls three`
reports the same version the importmap serves; the static regression spec asserts it.
Estimated effort: Medium
Business value: High
Technical debt reduction: High

---

### High

- [ ] Bound the IndexedDB texture cache and store binary instead of data URLs

2026-09-07 revalidation: CONFIRMED by inspection. The 200-entry memory limit is
also bypassed by `get()` promotions and direct warmup canvas insertions. Route
every insertion through one bounded owner and test more than 200 persistent hits.
Worker quota diagnostics do not cover IndexedDB `set()` failures. Retain this
entry rather than adding a duplicate cache-budget finding.

Priority: High
Category: Performance
Area: `TextureCache`
Affected files: `src/modules/TextureCache.js`
Problem: The memory cache evicts past 200 entries, but the IndexedDB store has no
eviction policy at all — it only ever grows, and is cleared wholesale on an
`APP_VERSION` change. Entries are base64 **data URLs**, which are ~33% larger than the
bytes they encode and must be decoded on the main thread on every read.
Impact: On the mobile devices the app explicitly targets, a handful of 4096px maps can
exhaust the origin quota. When it is exhausted every write fails silently
(`request.onerror` resolves rather than surfacing `QuotaExceededError`), so the app
permanently loses persistence with no diagnostic and re-downloads everything forever.
Recommended solution: Store `Blob`s rather than data URLs and read them back with
`createImageBitmap`, which removes the base64 overhead and the main-thread decode.
Add an LRU index (a second object store keyed by `lastAccess`) and trim to a byte
budget derived from `navigator.storage.estimate()`. Detect `QuotaExceededError`
specifically and trim-then-retry once before giving up.
Acceptance criteria: Cache size stays under an explicit byte budget across a session
that visits every object; a simulated quota error triggers a trim and a successful
retry; texture reads no longer decode base64.
Estimated effort: Medium
Business value: High
Technical debt reduction: Medium

- [ ] Route production diagnostics through a logger and enforce a clean lint baseline

Priority: Medium
Category: Technical Debt
Area: Lint / observability
Affected files: `src/**/*.js`, `sw.js`, `eslint.config.js`, `package.json`
Problem: 2026-09-07 lint reports 0 errors and 210 warnings. Existing bug-catching
rules remain useful, but warning volume makes new warnings hard to distinguish.
Impact: Reduced diagnostic signal and avoidable review noise, not evidence that
the linter catches nothing or that every warning is a production defect.
Recommended solution: Add `src/modules/logger.js` exposing `debug/info/warn/error`
with debug/info gated and unexpected failures always visible; migrate incrementally
and enforce a ratcheting warning budget before moving to `--max-warnings=0`.
Acceptance criteria: `npm run lint -- --max-warnings=0` exits 0; a production load
with no debug URL parameter has no routine debug output; injected failures remain
observable without enabling debug flags.
Estimated effort: Medium
Business value: Medium
Technical debt reduction: High

- [x] **Trap only visible enabled controls and cover every modal**

      **Resolution (v2.10.325):** Shared stacked focus ownership filters current
      visible/enabled controls. Real keyboard tests cover all onboarding steps,
      fatal recovery, zero/one controls and restoration; Help/Settings pointer
      closure and the full controls sweep pass without forced close clicks.

      **Priority:** High  
      **Category:** Accessibility  
      **Confidence:** High  
      **Area:** Modal dialogs  
      **Affected files:** `src/modules/AppFeatures.js`, `src/modules/UIManager.js`, `src/modules/FatalError.js`, `tests/e2e/accessibility.spec.js`  
      **Evidence:** CONFIRMED on 2026-09-07 in Chromium: Tab from onboarding's visible
      `onboarding-next` left the modal; Shift+Tab from `onboarding-skip` did not wrap.
      `_trapFocus()` includes hidden `onboarding-start` as its last element.  
      **Problem:** Hidden/disabled elements are treated as tab stops. FatalError also
      declares a modal but installs no containment. The earlier claims that onboarding
      is visible before reveal and that focus restoration is absent are superseded.  
      **Impact:** Keyboard users leave the active dialog and operate obscured controls.  
      **Recommended solution:** Recompute genuinely tabbable elements per key event,
      handle zero/one control and focus outside the dialog, and share modal ownership
      with fatal recovery. Preserve the existing restore-focus behavior.  
      **Regression considerations:** Dynamic onboarding steps, nested overlays,
      notification focus, Escape behavior and normal page shortcuts.  
      **Acceptance criteria:** Forward/backward tab cycles stay within every visible
      modal at every onboarding step; closing restores the opener.  
      **Validation:** Real keyboard input without force clicks; hidden/disabled
      boundary controls; fatal and stacked dialogs.  
      **Estimated effort:** Small  
      **Business value:** Medium  
      **Technical debt reduction:** Medium

---

### Medium

- [ ] Stop long-timeout Playwright tests from masking hard failures as slowness

2026-09-07 revalidation: all 63 executed browser tests passed, but the serial
four-project run took 29.4 minutes and this sweep took 7.2 minutes. CI uses
isolated runners, so these figures do not prove a CI timeout. Keep bounded actions
and independently diagnosable workflows as the target, not parallel GPU contention.

Priority: Medium
Category: Testing
Area: E2E test suite
Affected files: `tests/e2e/full-functionality.spec.js`, `playwright.config.js`
Problem: `full-functionality.spec.js` sets `test.setTimeout(900_000)` for a single
mega-test. A genuine actionability failure — `setChecked('#sound-toggle')` against an
input that `ui.css` declares `display: none` — sat in the actionability retry loop for
the full 15 minutes before reporting. The suite looked "slow", not "broken". A single
900 s test also means one failure costs a quarter of an hour of feedback. (The
`setChecked` call itself was fixed during this review by clicking the visible label.)
Impact: Real regressions are indistinguishable from a slow machine, so the signal is
routinely ignored; contributors are discouraged from running the suite at all.
Recommended solution: Split the mega-test into per-concern tests (navigation sweep,
controls, modals, mobile layout) so each carries a normal timeout; add
`expect: { timeout: 10_000 }` and a per-action `actionTimeout` in `playwright.config.js`
so an unactionable element fails in seconds rather than at the test ceiling.
Acceptance criteria: No individual test exceeds a 120 s timeout; an intentionally
unactionable locator fails the suite in under 30 s.
Estimated effort: Medium
Business value: Medium
Technical debt reduction: Medium

- [x] Handle storage-quota failures in the service worker instead of reporting "offline" — **done 2026-08-19**

Priority: Medium
Category: Reliability
Area: Service worker
Affected files: `sw.js`
Problem: `caches.open()` and `cache.put()` are called without dedicated error handling.
A `QuotaExceededError` propagates to the single outer `catch`, which is written for the
offline case and therefore serves the offline page.
Impact: A user who is fully online but out of storage is told they are offline. The
real cause is invisible, and the condition is self-perpetuating because nothing evicts.
Recommended solution: Wrap the cache writes, distinguish `QuotaExceededError`, trim the
runtime and image caches and retry once, and broadcast a distinct `SW_QUOTA_EXCEEDED`
message so the client can surface a real explanation.
Acceptance criteria: With the quota artificially exhausted the app still serves from
network and reports a storage problem rather than an offline state.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Low

- [ ] Replace FIFO cache trimming with recency-aware eviction

Priority: Medium
Category: Performance
Area: Service worker
Affected files: `sw.js`
Problem: `trimCache()` deletes by insertion order. `cache.keys()` order has nothing to
do with how useful an entry is.
Impact: The most-visited textures are evicted as readily as ones fetched once, so the
50-item image cache thrashes and re-downloads assets the user looks at constantly.
Recommended solution: Record `lastAccess` per cache key in a small IndexedDB index
updated from the fetch handler, and evict the least recently used. If that is judged
too heavy, at minimum exempt precached paths from trimming.
Acceptance criteria: Repeatedly visiting a small set of objects stops producing network
requests for their textures once cached.
Estimated effort: Medium
Business value: Medium
Technical debt reduction: Low

- [ ] Give language configuration a single source of truth

Priority: Medium
Category: Refactor
Area: Internationalisation
Affected files: `src/i18n.js`, `src/modules/LanguageManager.js`
Problem: The supported-language list and the language→manifest map are declared twice,
once in `LanguageManager` and again inside `setLanguage()` in `i18n.js`. `i18n.js` also
writes `localStorage` directly instead of using the `safeSetItem` wrapper that exists
specifically to survive Safari private mode.
Impact: Adding a seventh language requires edits in two unrelated places, and missing
one produces a half-supported locale that validates. The direct `localStorage` write
throws in exactly the environment `storage.js` was written to protect against — it is
caught by a bare `try {} catch {}`, so the preference silently fails to persist.
Recommended solution: Export the language table from one module, import it in the
other, and route the write through `safeSetItem`.
Acceptance criteria: `supportedLanguages` and the manifest map each appear exactly
once; no module writes `localStorage` outside `storage.js`.
Estimated effort: Small
Business value: Low
Technical debt reduction: Medium

- [ ] Release Web Audio nodes after they finish

Priority: Medium
Category: Performance
Area: `AudioManager`
Affected files: `src/modules/AudioManager.js`
Problem: Every sound builds fresh `OscillatorNode`/`GainNode`/`BiquadFilterNode`
objects, calls `stop()`, and never disconnects them from `masterGain`.
Impact: The graph attached to `masterGain` grows for the lifetime of the page. In a
long session with frequent UI sounds this is a steady, unbounded leak on the audio
thread.
Recommended solution: Attach `source.onended = () => { source.disconnect(); gain.disconnect(); }`
in a small `_playVoice()` helper and route all seven generators through it — which also
removes the duplicated create/connect/schedule boilerplate.
Acceptance criteria: Playing 1,000 sounds leaves the node count attached to
`masterGain` flat; each generator is under 20 lines.
Estimated effort: Small
Business value: Low
Technical debt reduction: Medium

- [ ] Introduce z-index tokens

Priority: Medium
Category: Maintainability
Area: CSS
Affected files: `src/styles/ui.css`, `src/styles/main.css`
Problem: Fourteen distinct `z-index` literals span 90–20000, and four unrelated
components (header, footer, install prompt, XR buttons) all sit at exactly 100, so
their stacking is decided by document order.
Impact: Every new overlay is a guess, and overlaps are discovered by users rather than
by review.
Recommended solution: Define a `--z-*` custom-property scale in `:root` with one token
per layer and replace every literal.
Acceptance criteria: No bare `z-index` literal remains outside the token definitions.
Estimated effort: Small
Business value: Low
Technical debt reduction: Medium

- [ ] Extract the triplicated belt-rescaling loop

Priority: Medium
Category: Refactor
Area: `SolarSystemModule.updateBelts()`
Affected files: `src/modules/SolarSystemModule.js`
Problem: The asteroid belt, Kuiper belt and Oort cloud each carry a near-identical
~40-line loop that reprojects particle positions when the scale mode changes; only the
radial parameters and cylindrical-vs-spherical projection differ.
Impact: ~100 lines of duplication in the largest file in the repository. A fix applied
to one copy has twice been needed in the others.
Recommended solution: Extract `_rescaleParticleSystem(system, oldParams, newParams, { spherical })`
and call it three times.
Acceptance criteria: The three call sites are one line each; belt geometry is
pixel-identical before and after a scale toggle.
Estimated effort: Small
Business value: Low
Technical debt reduction: Medium

- [ ] Add an automated accessibility audit to CI

Priority: Medium
Category: Testing
Area: CI
Affected files: `.github/workflows/ci.yml`, `tests/e2e/accessibility.spec.js`, `package.json`
Problem: Accessibility is now asserted by three hand-written specs. Nothing scans for
the whole class of regressions (contrast, name/role/value, landmark structure).
Impact: Each a11y defect has to be found by a human before it can be tested for.
Recommended solution: Add `@axe-core/playwright`, run it against the booted app and
against each dialog, and fail on serious/critical violations with an explicit,
shrinking allowlist for known issues.
Acceptance criteria: CI fails on a newly introduced serious axe violation; the
allowlist is empty or itemised with a backlog link per entry.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Low

- [x] Enable automated dependency and action updates — **done 2026-08-18**

Priority: Medium
Category: Security
Area: Supply chain
Affected files: `.github/dependabot.yml` (new)
Problem: There is no Dependabot or Renovate configuration, so neither npm devDependencies
nor the pinned GitHub Actions are ever updated automatically.
Impact: Security patches for the toolchain land only when someone remembers. Combined
with the un-declared CDN copy of Three.js, effectively nothing in this project is
monitored for vulnerabilities.
Recommended solution: Add a `dependabot.yml` covering the `npm` and `github-actions`
ecosystems, weekly, grouped.
Acceptance criteria: Dependabot opens grouped update PRs; CI gates them.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Low

---

### Low

- [x] Add `type="button"` to every non-submit button — **done 2026-08-19**

Priority: Low
Category: Bug
Area: `index.html`
Affected files: `index.html`
Problem: None of the ~30 `<button>` elements declare a type, so they default to
`submit`.
Impact: Latent only — there is no `<form>` in the document today. It becomes a real
defect the moment one is added (e.g. a feedback or settings form).
Recommended solution: Add `type="button"` throughout and assert it in the static
regression spec.
Acceptance criteria: No `<button>` without an explicit `type` remains.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [x] Remove the redundant nested `aria-live` on the loading percentage — **done 2026-08-19**

Priority: Low
Category: Accessibility
Area: Loading screen
Affected files: `index.html`
Problem: `#loading` is `role="status"` (implicitly `aria-live="polite"`) and contains
`#loading-percentage` with its own `aria-live="polite"`.
Impact: Screen readers announce the same progress update twice during boot.
Recommended solution: Drop the inner attribute and let it inherit.
Acceptance criteria: One announcement per progress change.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [ ] Key object lookups by a stable id rather than the English display name

Priority: Low
Category: Technical Debt
Area: `SolarSystemModule`
Affected files: `src/modules/SolarSystemModule.js`, `src/main.js`
Problem: `spacecraftScaleFactors` is keyed by `'James Webb Space Telescope'`, and the
`i`/`v`/`p` keyboard shortcuts locate objects with `userData.name.includes('ISS')`,
`.includes('Voyager')` and so on. This is correct **today** only because
`userData.name` is never reassigned — translation happens at render time.
Impact: Latent. The first change that localises `userData.name` in place silently
breaks scaling and three keyboard shortcuts, with no error.
Recommended solution: Give every object a language-independent `userData.id` at
creation and key all lookups off it.
Acceptance criteria: No lookup in the codebase matches on a human-readable name.
Estimated effort: Medium
Business value: Low
Technical debt reduction: Medium

- [x] Name the star-twinkle batch size — **done 2026-08-19**

Priority: Low
Category: Cleanup
Area: `SolarSystemModule`
Affected files: `src/modules/SolarSystemModule.js`
Problem: `for (let i = 0; i < 30 && tblLen > 0; i++)` and the matching
`(this._starTwinklePtr + 30) % tblLen` use a bare literal in two places.
Impact: Changing the twinkle density means finding both copies.
Recommended solution: Hoist to a named constant.
Acceptance criteria: The literal appears once, named.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [x] Correct the throttle comment on the VR laser update — **done 2026-08-19**

Priority: Low
Category: Documentation
Area: `SceneManager`
Affected files: `src/modules/SceneManager.js`
Problem: The comment says "throttled to every 10th frame"; `(this._vrLaserFrame & 0xF) === 0`
is every 16th.
Impact: Misleads anyone tuning VR pointer responsiveness.
Recommended solution: Fix the comment.
Acceptance criteria: Comment matches the mask.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [x] Remove dead VR state left over from earlier iterations — **done 2026-08-19**

Priority: Low
Category: Cleanup
Area: `SceneManager`
Affected files: `src/modules/SceneManager.js`
Problem: `this._vrWarpLocalDir` and `this._vrWarpInverseQuat` are allocated in the
constructor and never read. `grabRotateState.startDollyRotation` is written on grab
start and never consulted — grab-to-rotate is purely delta-driven.
Impact: Suggests behaviour that does not exist; the next reader will try to preserve it.
Recommended solution: Delete all three.
Acceptance criteria: No unread instance field remains in the VR state block.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [ ] Match haptics to controller handedness rather than input-source order

Priority: Low
Category: Bug
Area: VR input
Affected files: `src/modules/SceneManager.js`
Problem: `triggerVRHaptic()` walks `session.inputSources` and counts to
`controllerIndex`, assuming index 0/1 are the two controllers.
Impact: With hand tracking active, or any transient input source, the pulse can be sent
to the wrong device or to none. The codebase already documents that hand tracking adds
input sources mid-session — that is why `previousButtonStates` is reset on `sessionstart`.
Recommended solution: Select by `inputSource.handedness`.
Acceptance criteria: Haptics fire on the correct controller with hand tracking enabled.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [x] Retain CI artefacts long enough to investigate flakes — **done 2026-08-19**

Priority: Low
Category: Developer Experience
Area: CI
Affected files: `.github/workflows/ci.yml`
Problem: The Playwright report is kept for 7 days and `test-results/` (traces, videos)
is not uploaded at all.
Impact: A flake noticed a week later has no evidence left, and traces — the only useful
artefact for a 3D/WebGL failure — are never captured.
Recommended solution: Upload `test-results/` on failure with 30-day retention.
Acceptance criteria: A failed run leaves a downloadable trace.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

---

### Resolved during this review

Found, fixed and covered by tests in this pass.

- [x] **The "full functionality" E2E test could never pass.** `setChecked('#sound-toggle')`
      targets an input that `ui.css` declares `display: none` (it is driven by its
      `<label class="settings-toggle">`), so Playwright's actionability check never
      resolved and the test burned its entire 900 s timeout on every run. The suite's
      15-minute runtime was almost entirely this one dead wait. Now clicks the label the
      user actually clicks.
- [x] **Mobile bump/normal/specular maps were three-quarters blank.** `warmupTextureCache()`
      sized the restored canvas with `key.includes('4096') ? 4096 : 2048`, but cache keys
      carry the *configured* texture size — 1024 on mobile. Every mobile device drew a
      1024px image into a 2048px canvas and cached the result as the object's surface
      detail map. Now sized from `img.naturalWidth`.
- [x] **Clicking "Update" reloaded the page twice.** Activating the waiting worker fires
      both `controllerchange` and the worker's own `SW_SKIP_WAITING_COMPLETE` broadcast;
      each called `window.location.reload()` independently, the second landing mid-boot
      of the first. Both now route through a single `_reloadOnce()` guard.
- [x] Repeated `register()` calls stacked duplicate `updatefound`, `controllerchange` and
      `message` listeners, multiplying update prompts. Registration is now idempotent.
- [x] **Five of the eight CDN modules the app imports were never precached**, while one
      that is precached (`CSS2DRenderer`) has not been imported since labels moved to
      sprites. The postprocessing chain (`EffectComposer`, `RenderPass`, `UnrealBloomPass`,
      `OutputPass`, `SMAAPass`) is now in `CDN_CACHE_FILES`, and a static regression test
      fails the build whenever the import list and the precache list diverge, or the
      pinned three.js version drifts between `index.html` and `sw.js`.
- [x] **The German, Spanish and Portuguese manifests had silently lost `features`,
      `handle_links`, `launch_handler` and `display_override`**, so installed apps in those
      three languages did not capture links and had no display fallback. All six manifests
      are now identical in shape, enforced by a test.
- [x] `share_target` advertised a `./share` endpoint that does not exist and that the
      service worker explicitly skips (non-GET). The OS offered the app as a share target
      and the share then failed. Removed from all manifests until it is implemented.
- [x] **`TextureCache.get()` rejected on an IndexedDB read error from inside a returned
      promise**, escaping the surrounding `try/catch` and surfacing as an unhandled
      rejection in every texture-loading path. A read failure is now a cache miss.
- [x] `initDB()` rejected when IndexedDB is unavailable (Safari private mode, sandboxed
      iframe, enterprise policy), producing an unhandled rejection on boot for a condition
      the app is designed to tolerate. It now resolves and records `unavailableReason`.
- [x] The texture-cache version check cleared the store and stamped the new version in
      two separate transactions; a tab closed in between left an emptied store still
      tagged with the old version, forcing a redundant clear and re-download on next boot.
- [x] **No recovery path from a boot failure.** A throw during `init()` left the user on a
      spinner forever with nothing to report. Added `src/modules/FatalError.js`: an
      accessible `alertdialog` with the app version, user agent and stack under "technical
      details", plus Reload and Clear-cache-and-reload actions (the latter unregisters the
      service worker and deletes all caches and IndexedDB databases). Built with DOM APIs
      only, so an arbitrary thrown value can never be parsed as markup.
- [x] An unguarded `console.warn` fired on the *expected* procedural-texture fallback path
      for every object shipped without a photographic map.
- [x] **No `prefers-reduced-motion` support** in an app whose core interaction is
      continuous 3D motion. Camera fly-to now cuts straight to the target, and all CSS
      transitions and animations are suppressed, when the OS preference is set. Verified by
      a spec that also asserts the default path still animates, so it cannot go vacuous.
- [x] **No keyboard bypass** for the header and footer control clusters (WCAG 2.4.1). Added
      a translated skip link, tested as the first tab stop.
- [x] All ten decorative SVG icons were exposed to assistive technology as unlabelled
      graphics; now `aria-hidden="true"`, enforced by a test.
- [x] `case 'l'` in the keyboard handler dereferenced `this.sceneManager.renderer.xr`
      without guards.

---

## Review — 2026-07-27 (branch `opus5`, v2.10.303)

Scope: full-repository product, architecture, code, performance, security,
reliability, testing, maintainability and documentation review. Defects that
were fixed during the review itself are listed at the bottom under
"Resolved during this review" and are not repeated as open items.

---

### Architecture and Startup (Reprioritized 2026-09-07)

- [ ] Split `SolarSystemModule.js` into cohesive modules - partially implemented

Priority: Medium
Category: Architecture
Area: Solar system domain layer
Affected files: `src/modules/SolarSystemModule.js`, `sw.js`, `index.html`
Problem: The original 11,000-line monolith has been split into five prototype
mixins. As of 2026-09-07, the facade is 2,104 lines and deep-space is 2,713 lines;
SceneManager is 3,305 lines and main is 2,046. Astronomy now has pure unit tests.
The old unsplit-file description no longer applies, but implicit shared `this`
contracts and the original size acceptance criterion remain unresolved.
Impact: Changes still require reasoning across large owners and implicit mixin
dependencies. This is maintainability work, not a demonstrated release blocker.
Recommended solution: Extract in dependency order, one module per commit, keeping the
public `SolarSystemModule` facade intact: (1) `data/celestial-data.js` — pure data
tables, no Three.js import; (2) `textures/procedural/*.js` — one file per generator
family; (3) `orbital-mechanics.js` — the Keplerian position/rotation math as pure
functions; (4) `factories/*.js` — mesh builders. Compose with explicit imports rather
than prototype mixins so the dependency graph stays statically analysable.
Acceptance criteria: No single source file exceeds 1,500 lines; the orbital-mechanics
module has zero Three.js imports and is unit-tested; `npm test` passes unchanged; new
files are added to `CORE_CACHE_FILES` in `sw.js`.
Estimated effort: Large
Business value: High
Technical debt reduction: High

- [ ] Stop shipping all six languages as a render-blocking 400 KB classic script

Priority: High
Category: Performance
Area: Internationalisation / first paint
Affected files: `src/i18n.js`, `index.html`, `src/modules/LanguageManager.js`, `sw.js`
Problem: `src/i18n.js` inlines every string for en/nl/fr/de/es/pt and is loaded as a
synchronous, render-blocking `<script>` in `<head>`. A user only ever needs one
language, so ~83% of the payload is dead weight, and it blocks first paint.
Impact: Adds blocking download/parse work on constrained devices. On 2026-09-07
the file measures 426,567 bytes. The isolated time saved has not been measured;
do not describe it as the dominant startup cost without a trace. The existing
app-start performance mark excludes this phase.
Recommended solution: Split into `src/i18n/{en,nl,fr,de,es,pt}.js` (the directory
already exists) each exporting a default object. Ship `en` as the inline default and
`import()` the selected locale from `LanguageManager`. Keep a synchronous fallback so
`window.t` is never undefined during boot. Precache only the shipped default plus the
user's chosen locale.
Acceptance criteria: Initial HTML + blocking JS transfer drops by >300 KB; language
switching still works without reload; no flash of untranslated content; all six
locales still reachable offline once visited.
Estimated effort: Large
Business value: High
Technical debt reduction: Medium

---

### High

- [ ] Replace the `window.app` global and synthetic `.click()` dispatch with an explicit event bus

Priority: High
Category: Architecture
Area: Cross-module communication
Affected files: `src/main.js`, `src/modules/SceneManager.js`, `src/modules/UIManager.js`
Problem: `main.js` publishes `window.app = this`, and `SceneManager` reads it in ~10
places. Worse, ~15 keyboard shortcuts and several VR actions invoke behaviour by
calling `document.getElementById('toggle-orbits')?.click()` — routing application
logic through a DOM button that may not exist.
Impact: Hidden coupling that no tooling can trace; renaming a DOM id silently breaks
VR and keyboard input with no error. Makes the app untestable without a full DOM.
Recommended solution: Introduce a tiny `EventBus` (`on`/`off`/`emit`). Have `UIManager`
expose intent methods (`toggleOrbits()`, `toggleLabels()`, …) that the button handlers,
keyboard handler and VR handler all call directly. Retire `window.app` once
`SceneManager` receives its collaborators via constructor injection.
Acceptance criteria: `window.app` is referenced only by tests; zero `.click()` calls
remain in `main.js` shortcut handling; each toggle has exactly one implementation.
Estimated effort: Large
Business value: Medium
Technical debt reduction: High

- [ ] Audit and fix WebXR / animation-loop resource leaks

Priority: High
Category: Bug
Area: VR/XR lifecycle
Affected files: `src/modules/SceneManager.js`
**Correction (2026-08-18):** this item overstated the problem. `SceneManager.dispose()`
*does* exist and already clears `vrFlashTimeout`, `_vrMenuRefreshTimer` and
`_vrDebugHUDInterval`, ends the XR session, and disposes the renderer and controls.
The `sessionstart`/`sessionend` listeners are bound once to `renderer.xr`, not per
session, so they do not accumulate either. What remains genuinely open is narrower:
there is no symmetric `_teardownXRSession()` for per-session state (controller input
listeners, `previousButtonStates`, the VR panel drag state and the VR UI canvas
texture), and `GeometryFactory`'s cache is never cleared by `dispose()`.
Problem: Entering and leaving VR repeatedly leaves per-session state and the VR UI
canvas texture in place; `dispose()` does not release cached geometry.
Impact: Long multi-session VR use accumulates state on exactly the hardware least able
to absorb it (Quest). Not the unbounded listener leak originally described.
Recommended solution: Add `_teardownXRSession()` bound to `sessionend` that resets
per-session state and disposes the VR panel texture, and have `dispose()` clear
`GeometryFactory`'s cache.
Acceptance criteria: Entering and exiting VR ten times leaves listener, timer and GPU
resource counts flat, verified with a heap snapshot.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Medium

- [ ] Break up `SceneManager.drawVRMenu()` (600+ lines of imperative canvas drawing)

Priority: High
Category: Refactor
Area: VR UI
Affected files: `src/modules/SceneManager.js`
Problem: A single method performs all layout and painting for every VR menu page on a
1400×1000 canvas, with layout constants inlined at their point of use.
Impact: Any VR UI change requires reading 600 lines to find the right coordinate.
Positioning bugs are common and hard to attribute.
Recommended solution: Extract a small `VRMenuRenderer` with a declarative layout
descriptor (rows of `{ label, value, action, bounds }`) and one `drawPage(page)` that
walks it. Hit-testing then reads the same descriptor instead of duplicating geometry.
Acceptance criteria: No VR drawing method exceeds 120 lines; hit regions are derived
from the same source as the drawn regions; VR menu is visually unchanged.
Estimated effort: Medium
Business value: Medium
Technical debt reduction: High

- [ ] Add automated test coverage for the untested majority of the UI

Priority: High
Category: Testing
Area: Test suite
Affected files: `tests/e2e/*.spec.js`
Problem: Existing specs cover smoke boot and a subset of controls. There is no coverage
for: focus-trap Tab cycling in modals, Time Machine date stepping, hover labels, camera
drag/pan, the onboarding flow, the PWA install prompt, language switching, or the
service-worker update prompt.
Impact: Regressions in these areas reach users. The suite currently gives more
confidence than it earns.
Recommended solution: Add one focused spec per area. Prefer asserting on observable
app state (`window.app.*`) plus DOM classes rather than screenshots, to stay stable.
Acceptance criteria: Each listed area has at least one passing spec; suite runtime
stays under 10 minutes on CI.
Estimated effort: Large
Business value: High
Technical debt reduction: Medium

- [ ] Give the app a real "something went wrong" recovery path — **superseded 2026-08-18**

**Status:** largely delivered by `src/modules/FatalError.js` (see the 2026-08-18
"Resolved" list). What remains open is only the second half: the `unhandledrejection`
handler still logs without surfacing anything, and the 30-second force-start path does
not record which stage stalled.

Priority: High
Category: Reliability
Area: Boot / error handling
Affected files: `src/main.js`, `index.html`
Problem: If `init()` throws, the user is left on the loading screen. A 30-second safety
timeout force-starts the experience, which can leave a partially constructed scene.
Global handlers now log the failure but nothing is shown to the user.
Impact: A hard failure is indistinguishable from a slow network. Users have no action
to take and no information to report.
Recommended solution: Add a dedicated error overlay with the message, the app version,
and Reload / Clear cache and reload actions. Route the `unhandledrejection` handler and
the boot `catch` into it. Make the force-start path explicitly log which stage stalled.
Acceptance criteria: Simulating a thrown error during init shows the overlay instead of
a stuck spinner; "Clear cache and reload" unregisters the SW and reloads.
Estimated effort: Medium
Business value: High
Technical debt reduction: Low

---

### Medium

- [ ] Reformat the codebase to the `.editorconfig` convention and enforce it

Priority: Medium
Category: Cleanup
Area: Whole repository
Affected files: `src/**/*.js`
Problem: Most JS files use a single space per indent level, which is not a convention
any editor produces by default. `.editorconfig` now declares 4 spaces, but the existing
code has not been converted.
Impact: Every editor fights the file. Diffs are noisy because contributors' editors
re-indent surrounding lines. Nesting depth is visually unreadable at 1 space.
Recommended solution: Add Prettier, run it once across `src/`, `sw.js` and `tests/` in a
single clearly-labelled commit (add the hash to `.git-blame-ignore-revs`), then add a
`format:check` step to CI.
Acceptance criteria: `npx prettier --check .` passes; the reformat is isolated in one
commit; CI fails on unformatted code.
Estimated effort: Medium
Business value: Low
Technical debt reduction: High

- [ ] Clear the 209 outstanding ESLint warnings and raise them to errors — **superseded 2026-08-18**

**Status:** re-raised to High in the 2026-08-18 section; see "Route production
diagnostics through a logger and enforce a clean lint baseline".

Priority: Medium
Category: Technical Debt
Area: Lint
Affected files: `src/**/*.js`, `sw.js`, `eslint.config.js`
Problem: The newly added ESLint config reports 0 errors but 209 warnings, dominated by
`no-console` and `prefer-const`.
Impact: A warning baseline that nobody clears trains the team to ignore lint output,
which erodes the value of the tool that was just added.
Recommended solution: Fix `prefer-const` mechanically with `--fix`. For `no-console`,
route diagnostics through a small `logger` module that is a no-op unless the matching
`DEBUG` flag is set. Then flip both rules to `error` and add `--max-warnings=0` to the
`lint` script.
Acceptance criteria: `npm run lint` exits 0 with `--max-warnings=0`; production console
output is silent unless a debug URL parameter is present.
Estimated effort: Medium
Business value: Low
Technical debt reduction: High

- [ ] Extract VR and rendering magic numbers into `CONFIG`

Priority: Medium
Category: Maintainability
Area: VR / rendering tuning
Affected files: `src/modules/SceneManager.js`, `src/modules/utils.js`
Problem: Teleport distances per object type, thumbstick deadzones, snap-turn angle,
movement speeds, sprint multipliers and bloom parameters are literals scattered through
the code, often duplicated.
Impact: Tuning VR comfort requires hunting through a 2,000-line file, and duplicated
constants drift apart.
Recommended solution: Add `CONFIG.VR` and `CONFIG.BLOOM` blocks in `utils.js` with named,
commented values, and reference them everywhere.
Acceptance criteria: No bare numeric literal remains in VR locomotion or teleport code;
each constant is defined exactly once.
Estimated effort: Small
Business value: Low
Technical debt reduction: Medium

- [ ] Hoist per-call data tables to module scope

Priority: Medium
Category: Performance
Area: `main.js`
Affected files: `src/main.js`
Problem: `_navigationMap` is built lazily inside `findObjectByNavigationValue` from
100+ closures, and `spaceFacts` is rebuilt each time `setupSpaceFacts()` runs.
Impact: Unnecessary allocation and closure creation; the data is static and belongs
next to the other module constants.
Recommended solution: Move both to module-scope `const` tables. Where entries need
translation, store keys and resolve through `t()` at read time.
Acceptance criteria: No large object/array literal is constructed inside a method that
runs more than once; behaviour unchanged.
Estimated effort: Small
Business value: Low
Technical debt reduction: Medium

- [ ] Remove the `setTimeout`-based sequencing in the boot and hint paths

Priority: Medium
Category: Reliability
Area: Startup sequencing
Affected files: `src/main.js`
Problem: `preSelectEarth()` waits on a hardcoded `setTimeout(…, 500)`, and
`setupMobileGestureHints()` chains 2,000 ms / 5,000 ms timers.
Impact: On a slow device the 500 ms assumption is wrong and Earth is not selected; on a
fast device it is wasted latency. Timers are never cleared if the user navigates away.
Recommended solution: Await the actual readiness promise instead of guessing, and store
every timer handle so it can be cleared in a `destroy()` path.
Acceptance criteria: No `setTimeout` is used to wait for a condition that can be
awaited; all remaining timers are tracked and cleared.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Medium

- [ ] Add a `destroy()` lifecycle to the App and its managers

Priority: Medium
Category: Architecture
Area: Lifecycle
Affected files: `src/main.js`, `src/modules/*.js`
Problem: Nothing in the app can be torn down. Listeners, timers, the animation loop and
GPU resources live for the lifetime of the document.
Impact: Blocks any future embedding, hot-reload, or multi-scene work, and makes leak
testing impossible.
Recommended solution: Give each manager a `destroy()` that reverses exactly what its
`init()` did, and have `App.destroy()` call them in reverse order.
Acceptance criteria: Calling `window.app.destroy()` removes every listener and timer and
stops the render loop with no console errors.
Estimated effort: Medium
Business value: Low
Technical debt reduction: High

- [ ] Deduplicate the remaining translation helper and formalise the i18n contract

Priority: Medium
Category: Refactor
Area: Internationalisation
Affected files: `src/main.js`, `src/modules/SolarSystemModule.js`, `src/modules/UIManager.js`
Problem: Translation is reached through `window.t`, guarded by ad-hoc fallbacks at each
call site. Modules cannot import it, so there is no static guarantee it exists.
Impact: Any module that forgets the guard crashes if it runs before i18n loads; missing
keys silently render as the raw key with no way to detect them.
Recommended solution: Add `src/modules/i18n-t.js` exporting a single late-binding `t`,
import it everywhere, and add a debug-only warning for unknown keys. Register the new
file in `CORE_CACHE_FILES`.
Acceptance criteria: No module reads `window.t` directly; a missing key logs once under
`?debug`; all six locales still resolve.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Medium

- [ ] Verify and document the `pickableObjects` registration path

Priority: Medium
Category: Bug
Area: Object picking
Affected files: `src/modules/SolarSystemModule.js`
Problem: `this.pickableObjects` is populated for the Sun and planets only. Moons, dwarf
planets, comets and spacecraft appear to rely on a different traversal for hit-testing.
Impact: If the array is the intended single source of truth, several object classes are
silently unpickable; if it is not, it is misleading dead state.
Recommended solution: Determine the intended contract, then either register every
selectable object or delete the array and document the traversal that is actually used.
Acceptance criteria: A test clicks one object of each category and asserts the info
panel opens with the correct name.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Medium

---

### Low

- [ ] Consolidate top-level documentation into `docs/`

Priority: Low
Category: Documentation
Area: Repository root
Affected files: `README.md`, `ENGINEERING_REVIEW.md`, `SCIENTIFIC_QA_AUDIT.md`, `ATTRIBUTION.md`, `BACKLOG.md`
Problem: Review artefacts, audits and attribution sit alongside application code in the
repository root.
Impact: The root listing does not communicate what the project is or where to start.
Recommended solution: Move everything except `README.md` into `docs/` and link from the
README.
Acceptance criteria: Root contains only `README.md` plus code and config; all internal
links resolve.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [x] Mark `ENGINEERING_REVIEW.md` as superseded — **done 2026-08-19**

Priority: Low
Category: Documentation
Area: Docs
Affected files: `ENGINEERING_REVIEW.md`
Problem: The 2026-06-12 review (v2.10.250) lists many findings that have since been
fixed — version drift, the `console.warn` monkey-patch, the duplicated `storage.js`
cache entry, `innerHTML` in navigation search, missing `package.json`, missing tests.
Impact: A reader acting on it will chase problems that no longer exist and will
under-rate the current state of the codebase.
Recommended solution: Add a header noting the document is a historical snapshot, and
tick or strike the resolved findings.
Acceptance criteria: The document states its supersession date and no longer presents
resolved items as open.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [x] Remove committed test-run artefacts and prevent recurrence — **done 2026-07-27**

Priority: Low
Category: Cleanup
Area: Repository root
Affected files: `e2e-out.txt`, `full-run.txt`, `test-results/`, `playwright-report/`
Problem: Playwright console dumps are committed at the repository root.
Impact: Noise in diffs and in the root listing; the files are stale the moment they land.
Recommended solution: Delete them and add `e2e-out.txt` / `full-run.txt` to `.gitignore`
(`playwright-report/` and `test-results/` are already ignored).
Acceptance criteria: `git status` is clean after a full test run.
Estimated effort: Small
Business value: Low
Technical debt reduction: Low

- [ ] Add a Content-Security-Policy report-only endpoint or drop `style-src 'unsafe-inline'`

Priority: Low
Category: Security
Area: CSP
Affected files: `index.html`, `src/**/*.js`
Problem: The CSP is otherwise strict but allows `style-src 'unsafe-inline'`, which is
needed because several modules set `element.style.*` and inject style attributes.
Impact: Weakens the strongest available defence against injected-style attacks. Low
practical risk here (no user-generated content), but it is the one soft spot.
Recommended solution: Move dynamic styling to CSS custom properties set via
`setProperty`, or class toggles, until `'unsafe-inline'` can be removed. Verify with a
report-only policy first.
Acceptance criteria: The app renders correctly under a policy without
`style-src 'unsafe-inline'`.
Estimated effort: Medium
Business value: Low
Technical debt reduction: Low

- [x] Add `prefers-reduced-motion` support — **done 2026-08-18**

Priority: Low
Category: Accessibility
Area: Animation
Affected files: `src/styles/*.css`, `src/main.js`, `src/modules/SceneManager.js`
Problem: Camera fly-to animations, orbital motion and UI transitions run at full
amplitude regardless of the user's reduced-motion preference.
Impact: Can cause discomfort or nausea for motion-sensitive users — a real concern for
an app whose core interaction is continuous 3D motion.
Recommended solution: Read `matchMedia('(prefers-reduced-motion: reduce)')`, and when
set: shorten or skip camera transitions, disable UI transition animations, and default
the simulation to paused.
Acceptance criteria: With the OS preference enabled, no camera fly-to animation plays
and CSS transitions are disabled.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Low

- [ ] Add a `docs`/`CONTRIBUTING.md` describing the no-build-step constraint

Priority: Low
Category: Developer Experience
Area: Onboarding
Affected files: `CONTRIBUTING.md` (new)
Problem: The deliberate architectural decision to ship un-bundled ES modules with a CDN
importmap — and the CSP hash that constrains it — is only recorded in agent
instructions, not in contributor-facing documentation.
Impact: A new contributor's first instinct will be to add a bundler, which would break
the CSP hash and the service-worker precache strategy.
Recommended solution: Document the constraint, the version-sync requirement, the CSP
hash, and the `npm run verify` gate.
Acceptance criteria: A new contributor can make and validate a change using only the
README and CONTRIBUTING.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Low

---

### Resolved during this review

These were found and fixed in this pass; listed for traceability.

- [x] Keyboard shortcuts fired while Ctrl/Cmd/Alt was held, hijacking `Ctrl+R`, `Ctrl+S`, `Ctrl+F`, `Ctrl+D` and `Ctrl+P`.
- [x] Keyboard shortcuts fired while a form control had focus, so typing in the navigation search or using `<select>` type-ahead toggled scale, orbits and labels.
- [x] `Escape` closed all three overlays at once instead of only the frontmost.
- [x] Dead `window.closeInfoPanel` / `closeHelpModal` / `closeSettingsModal` globals with zero consumers.
- [x] Service-worker install used a single atomic `cache.addAll()`, so one missing texture aborted the entire offline install. Split into a required app shell plus best-effort assets.
- [x] Service worker re-downloaded the whole app shell and every texture in the background on every page load. Precached, version-scoped assets are now treated as immutable.
- [x] Service-worker install failures were swallowed by a commented-out `console.error`, making them undiagnosable. Now logged, broadcast to clients, and rethrown.
- [x] Inline `onclick` in the service-worker offline fallback page (CSP-hostile).
- [x] Two ungated `console.warn` calls on the expected texture-fallback path spammed production consoles.
- [x] Unreachable Google Analytics `gtag` calls that the app's own CSP makes impossible to execute.
- [x] `UIManager.formatSpeed()` returned a hardcoded English `'Paused'` despite a `paused` key existing in all six locales.
- [x] `storage.js` swallowed every localStorage failure with no diagnostics.
- [x] No global `unhandledrejection` / `error` handler, so failures escaping local try/catch were invisible.
- [x] Five redundant dead locals and unused catch bindings, including three `orbitalInclination` reads that duplicated the precomputed `_sinOrbInc`/`_cosOrbInc` pair.
- [x] Four duplicated local `t` translation shims shadowing an identical module-scope helper.
- [x] Twelve redundant per-crawler `noindex` meta tags.
- [x] `package-lock.json` was git-ignored, making `npm ci` and reproducible installs impossible.
- [x] No lint, no formatting convention, no CI, and no automated version-sync despite the version being repeated in five files.

---

## Review — 2026-08-18 (production-readiness pass, v2.10.314)

Scope: product, architecture, correctness, security, reliability, performance,
accessibility, test strategy, operations and developer experience. Existing open
items were revalidated and not duplicated. In particular, the current priorities
remain the locale split, stable celestial identities and true ecliptic coordinates,
bounded binary texture caching, removal of `window.app`, lifecycle teardown,
WebXR coverage, automated accessibility scans, and a clean lint baseline.

### New

- [ ] **Measure successful first rendering from navigation start**

      **Measurement fixed; calibration pending (v2.10.325):** Marks now follow a
      successful render, include blocking imports and delimit long tasks at that
      frame. Render-failure injection, delayed-i18n and nonblank desktop/mobile
      checks pass. Transfer totals explicitly exclude worker precache/incomplete
      resources. Repeated warm/cold variance and budget tightening remain open.

      **Priority:** Medium  
      **Category:** Performance  
      **Confidence:** High  
      **Area:** Startup measurement  
      **Affected files:** `src/main.js`, `src/modules/SceneManager.js`, `tests/e2e/performance.spec.js`, `README.md`  
      **Evidence:** CONFIRMED by code and artifacts, reopened 2026-09-07. Marks,
      budgets and CI artifacts were added on 2026-08-19, but `app-start` occurs after
      blocking imports; `first-frame` is emitted even after render throws. Long tasks
      are collected until evaluation, not filtered at the frame boundary.  
      **Problem:** Passing budgets do not prove successful navigation-to-usable-render
      timing. Current limits are 60/90 seconds versus measured 6.21/6.95 seconds from
      app initialization, and transfer totals omit worker-owned download accounting.  
      **Impact:** Blank rendering and costly pre-initialization work can escape the
      intended gate; incompatible measurement windows make comparisons misleading.  
      **Recommended solution:** Retain the artifacts; add navigation-to-successful-frame
      timing, nonblank pixel/error assertions and fixed-window task/network accounting.
      Report app payload separately from offline precache, then calibrate CI budgets.  
      **Regression considerations:** Preserve desktop/mobile comparison without treating
      emulated mobile as physical-device or Core Web Vitals evidence.  
      **Acceptance criteria:** Forced render failure fails the gate; a delayed blocking
      script increases the measured startup time; all metrics state their boundaries.  
      **Validation:** Render-error and delayed-i18n injection, desktop/mobile cold and
      warm samples, and repeated-run variance before tightening thresholds.  
      **Estimated effort:** Medium  
      **Business value:** High  
      **Technical debt reduction:** Medium

- [x] **Test the complete service-worker update lifecycle with real workers**

      **Resolution (v2.10.325):** Actual HTTP fixture and workers cover required
      install failure, two releases, reopen/waiting notification, one approved
      reload, rollback, offline documents, 503/stalls and sibling storage.

      **Priority:** High  
      **Category:** Testing  
      **Confidence:** High  
      **Area:** PWA updates; regression protection for R1-R4  
      **Affected files:** `tests/e2e/app.spec.js`, `src/modules/ServiceWorkerManager.js`, `sw.js`  
      **Evidence:** CONFIRMED, reopened 2026-09-07: the passing lifecycle test creates
      `EventTarget` registrations and workers, invokes `_reloadOnce()` directly and
      injects `SW_ACTIVATED`; no changed worker bytes are ever installed.  
      **Problem:** The 2026-08-19 implementation validates manager wiring but does not
      satisfy the existing two-release fixture acceptance criteria.  
      **Impact:** Cache consistency, real activation ordering, offline boot and waiting
      updates can regress while the named lifecycle test remains green.  
      **Recommended solution:** Keep the manager-level test and add a fixture serving
      two actual worker versions with distinguishable HTML/modules.  
      **Regression considerations:** Exactly one reload, user approval, previous-release
      survival after failed install, no clearing unrelated origin data.  
      **Acceptance criteria:** Observe actual waiting/active version changes, one
      activation message and one navigation; reopened tabs offer pending updates;
      verify a fresh offline document renders after activation.  
      **Validation:** Run the fixture in Chromium desktop/mobile with service workers
      enabled; include failed required assets and offline reloads.  
      **Estimated effort:** Medium  
      **Business value:** High  
      **Technical debt reduction:** High

- [x] Align public scientific-accuracy claims with verified behavior — **done 2026-08-19**

Priority: High
Category: Documentation
Area: Product positioning
Affected files: `README.md`, `index.html`, `SCIENTIFIC_QA_AUDIT.md`
Problem: The product describes its orbits as scientifically accurate while the open
scientific backlog documents decorative planetary azimuths, compressed moon-distance
scales, a non-inertial Earth axis and approximate eclipse timing. The Earth-Moon-Sun
eclipse subsystem is substantially more accurate than the wider scene.
Impact: Educators and learners can reasonably infer accuracy the implementation does
not currently provide, reducing trust in otherwise strong educational work.
Recommended solution: Until the coordinate and scale work is complete, distinguish
"ephemeris-based Earth-Moon-Sun eclipse geometry" from "educationally scaled planetary
visualization" in user-facing copy. Publish tested tolerances and the active scale mode.
Acceptance criteria: No unqualified scientific-accuracy claim remains; documented
tolerances match automated tests; scientific mode clearly identifies every deliberate
visual exaggeration.
Estimated effort: Small
Business value: High
Technical debt reduction: Low

- [x] Surface persistent-cache availability and storage pressure in diagnostics — **done 2026-08-19**

Priority: Medium
Category: Reliability
Area: Offline storage
Affected files: `src/modules/TextureCache.js`, `src/modules/UIManager.js`, `sw.js`
Problem: `TextureCache.unavailableReason` records IndexedDB failure but no user-visible
diagnostic consumes it. Service-worker quota failures can still be misreported as
offline, covered by the existing quota-handling item.
Impact: A user can repeatedly download textures or lose offline persistence with no
way to distinguish browser policy, private mode, quota exhaustion or a network issue.
Recommended solution: Add a diagnostics row showing persistent-cache availability and
estimated usage/quota from `navigator.storage.estimate()`. Connect quota errors to the
existing recoverable notification surface without exposing sensitive details.
Acceptance criteria: Simulated IndexedDB denial and quota exhaustion produce distinct,
actionable diagnostics while the app continues with memory/runtime caching.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Medium

- [x] Define and test the supported browser and device matrix — **done 2026-08-19**

Priority: Medium
Category: Developer Experience
Area: Compatibility and release readiness
Affected files: `README.md`, `playwright.config.js`, `.github/workflows/ci.yml`
Problem: The README claims support across desktop, mobile and multiple XR headsets,
while automated browser coverage is Chromium-only and XR hardware behavior is not part
of a recorded release check.
Impact: Compatibility regressions in Safari/iOS, Firefox or headset browsers may ship
undetected, and maintainers cannot tell whether a failure is unsupported or a defect.
Recommended solution: Publish a minimum supported matrix, add Firefox and WebKit smoke
projects where APIs permit, and maintain a short manual Quest release checklist for
WebXR interactions that browser emulation cannot validate.
Acceptance criteria: Supported versions are documented; each non-XR browser has a CI
boot/accessibility smoke test; every release records the Quest checklist result.
Estimated effort: Medium
Business value: High
Technical debt reduction: Medium

### Resolved During This Pass

- [x] Added app-owned startup marks and enforced desktop/mobile cold-load budgets for
      first frame, encoded transfer bytes and cumulative Long Task time. CI uploads
      machine-readable JSON artifacts, and the README records measured baselines.
- [x] Added deterministic coverage for update discovery, the waiting-worker activation
      request, active-version reporting and the one-reload guard across both completion
      signals.
- [x] Qualified public scientific claims with tested eclipse tolerances and explicit
      educational-scale limits; the scale control now discloses remaining size and
      moon-distance adjustments in every locale.
- [x] Added localized persistent-cache availability/usage diagnostics. Runtime cache
      writes now trim and retry once under quota pressure, preserve successful network
      responses, and broadcast a distinct warning. A Chromium quota-override test
      exercises the real worker failure path.
- [x] Added Firefox and WebKit boot/keyboard smoke projects, documented support tiers,
      and added a release checklist for Meta Quest behavior that automation cannot
      emulate.

- [x] Service-worker installation failures now produce a localized, recoverable status
      banner instead of being discarded by the client. The banner synchronizes
      `aria-hidden`, moves focus to the action, restores prior focus on dismissal, and
      aborts stale listeners before redisplay. Covered by a focused browser test.
- [x] The service-worker status banner is now above the fixed mobile footer. Its
      dismiss button was visible but untouchable because the footer intercepted
      pointer events; the mobile browser regression now passes.
- [x] Removed the superseded `_sunRA` Earth-rotation path. Initial date setup now uses
      `_applyEarthOrientation()`, the same authority as the render loop and date seeks.
      All five eclipse rendering/date-control tests pass.
- [x] Remediated two high-severity and one moderate transitive dependency advisory;
      `npm audit` reports zero vulnerabilities. CI now fails on high-severity findings.
- [x] Added grouped weekly Dependabot updates for npm and GitHub Actions.
- [x] Added the 14-test pure astronomy suite to CI before browser installation.
