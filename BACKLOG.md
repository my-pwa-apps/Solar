# Space Voyage — Engineering Backlog

Actionable items produced by structured engineering reviews. Items are grouped by
review date. **Do not delete unresolved items** — tick the checkbox when done and
leave the entry in place so the history of the decision survives.

---

## Review — 2026-10-15 (branch `main`, v2.10.304)

Scope: third full-repository review across all 23 engineering review phases.
Unresolved items from 2026-08-18 and 2026-07-27 remain valid and are preserved
below without duplication; existing items whose root cause expanded (such as
CDN transitive dependencies and dead Time Machine code) are noted here and
cross-referenced.

### High

- [x] **Precache or self-host transitive Three.js addon modules so cold-install offline boot works**

  **Priority:** High  
  **Category:** Reliability  
  **Confidence:** High  
  **Area:** Service Worker / Offline module graph  
  **Affected files:** `sw.js`, `index.html`, `tests/static-regression.spec.js`  
  **Evidence:** `sw.js` lines 134–143 (`CDN_CACHE_FILES` lists 8 direct entrypoints; comment on line 131 states *"Transitive imports (Pass.js, shader chunks) are not listed here; they are picked up by the runtime cache-first handler"*); `UnrealBloomPass.js`, `SMAAPass.js`, `OutputPass.js`, `EffectComposer.js`, and `XRControllerModelFactory.js` import transitive modules (`Pass.js`, `MaskPass.js`, `CopyShader.js`, `LuminosityHighPassShader.js`, `SMAAShader.js`, `OutputShader.js`, `GLTFLoader.js`, `BufferGeometryUtils.js`, `motion-controllers.module.js`) that are never requested on mobile (`IS_MOBILE` returns early in `setupPostProcessing()`) or when WebXR is not entered during first session.  
  **Problem:** `sw.js` only precaches direct `three/addons/*` imports, relying on the runtime fetch handler to populate transitive ES module dependencies. On mobile devices (where `setupPostProcessing()` is skipped) or if a user installs the PWA and goes offline before all transitive modules are fetched, the module graph is incomplete in Cache Storage. Worse, if `sw.js` is not yet controlling the page during the initial boot fetch, transitive CDN requests bypass the SW runtime cache altogether and only enter the browser HTTP cache.  
  **Impact:** Offline launch on a fresh PWA install or after HTTP cache eviction can fail to resolve the ES module graph, triggering `FatalError` instead of booting offline.  
  **Recommended solution:** Complete the vendor self-hosting item (already partially started in `vendor/three@0.183.2/build/`) by vendoring the full closure of `three/addons/*` modules and their transitive imports into `vendor/three@0.183.2/`, or enumerate the full transitive closure in `CDN_CACHE_FILES` and verify the import graph recursively in `tests/static-regression.spec.js`.  
  **Regression considerations:** All desktop post-processing passes (`EffectComposer`, `UnrealBloomPass`, `SMAAPass`, `OutputPass`) and WebXR controller models must continue to resolve identically.  
  **Acceptance criteria:** A fresh context that waits for SW `activated`, goes offline immediately, and reloads in both desktop and mobile profiles boots to `_experienceStarted === true` with zero failed module requests.  
  **Validation:** Add an offline cold-reload Playwright test and extend `tests/static-regression.spec.js` to walk transitive `import` statements of all imported addons.  
  **Estimated effort:** Medium  
  **Business value:** High  
  **Technical debt reduction:** High

- [x] **Wire PWA manifest shortcut URL parameters (`?planet=`, `?vr=true`) into application startup**

  **Priority:** High  
  **Category:** Bug  
  **Confidence:** High  
  **Area:** PWA shortcuts / Startup navigation  
  **Affected files:** `src/modules/PWAManager.js`, `src/main.js`, `manifest*.json`  
  **Evidence:** `manifest.json` lines 318–357 define three OS app shortcuts (`./?planet=earth`, `./?planet=mars`, `./?vr=true`); `src/modules/PWAManager.js` lines 277–291 parse `?planet=` and `?vr=true` into `window.startupPlanet` and `window.startupVR = true`; grep across the entire repository shows zero reads of `window.startupPlanet` or `window.startupVR`. Meanwhile `src/main.js:preSelectEarth()` unconditionally focuses Earth on first visit or does nothing on repeat visits.  
  **Problem:** The PWA manifest advertises OS jump-list / home-screen shortcuts ("View Earth", "View Mars", "Enter VR Mode"), and `PWAManager.handleURLShortcuts()` captures the query parameters onto `window`, but `App.startExperience()` never reads `window.startupPlanet` or `window.startupVR`. Launching the "View Mars" shortcut never navigates to Mars.  
  **Impact:** Broken user-facing PWA feature advertised in all 6 localized manifests and `README.md`. Users clicking "View Mars" from the OS taskbar/home-screen shortcut land on the default view or Earth.  
  **Recommended solution:** In `App.startExperience()` (in `src/main.js`), check `window.startupPlanet` before `preSelectEarth()`: if set, resolve via `this.findObjectByNavigationValue(window.startupPlanet)`, update the info panel, and call `focusOnObject()`. If `window.startupVR` is set, surface or highlight the VR entry affordance (note: WebXR `requestSession` requires a user gesture, so auto-entering without a click will reject unless triggered by gesture).  
  **Regression considerations:** Normal first-visit `preSelectEarth()` behavior must remain unchanged when no `?planet=` query parameter is present.  
  **Acceptance criteria:** Navigating to `/?planet=mars` focuses Mars and opens the Mars info panel on both first and repeat visits; covered by an E2E test.  
  **Validation:** Playwright test opening `/?planet=mars` and asserting `window.app.solarSystemModule.focusedObject.userData.name` and `#object-name` equal `'Mars'`.  
  **Estimated effort:** Small  
  **Business value:** High  
  **Technical debt reduction:** Low

- [x] **Resolve 3 `npm audit` dependency vulnerabilities in `package-lock.json`**

  **Priority:** High  
  **Category:** Dependency  
  **Confidence:** High  
  **Area:** Build / Dev toolchain security  
  **Affected files:** `package-lock.json`, `eslint.config.js`  
  **Evidence:** `npm audit` reports 3 vulnerabilities (2 high, 1 moderate): `brace-expansion <=1.1.20` (GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895, GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p — High), `js-yaml 4.0.0 - 4.3.1` (GHSA-5p4m-2wfm-xmqj, GHSA-2883-xcg3-v3hh — High), and `qs 2.2.5 - 6.15.3` (GHSA-q8mj-m7cp-5q26, GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g — Moderate). Also `vendor/**` is not ignored in `eslint.config.js`, causing ESLint to scan 33,449 lines of `vendor/three@0.183.2/build/three.core.js` and emit a warning.  
  **Problem:** Transitive devDependencies in `package-lock.json` have known DoS advisories with upstream fixes available via `npm audit fix`, and `eslint.config.js` lacks `'vendor/**'` in its `ignores` list.  
  **Impact:** Known vulnerabilities in local dev server (`http-server` -> `qs`) and lint/test tooling (`eslint` -> `js-yaml`, `brace-expansion`); slow ESLint runs scanning vendored Three.js core.  
  **Recommended solution:** Run `npm audit fix`, verify `npm test` and `npm run lint`, and add `'vendor/**'` to the `ignores` array in `eslint.config.js`.  
  **Regression considerations:** `npm run lint` and `npm test` must continue to pass with identical behavior.  
  **Acceptance criteria:** `npm audit` reports 0 vulnerabilities; `eslint` no longer scans `vendor/`.  
  **Validation:** `npm audit`, `npm run lint`, `npm run test:basic`.  
  **Estimated effort:** Small  
  **Business value:** Medium  
  **Technical debt reduction:** Medium

---

### Medium

- [x] **Remove orphaned Time Machine dead code, dead event tables, and dead CSS after UI removal**

  **Priority:** Medium  
  **Category:** Cleanup  
  **Confidence:** High  
  **Area:** `main.js` / `SolarSystemModule.js` / `i18n.js` / `ui.css`  
  **Affected files:** `src/main.js`, `src/modules/SolarSystemModule.js`, `src/modules/UIManager.js`, `src/i18n.js`, `src/styles/ui.css`  
  **Evidence:** Commits `c15ecc6` and `29f6fd5` removed the Time Machine HTML controls (`#sim-date-display`, `#time-reverse`, `#time-now`, `#time-step-*`, `.tm-events-select`), but left behind: (1) `App.setupTimeMachine()`, `showEventToast()`, `_getEventDescriptions()`, `_showEventInfo()`, and `_handlePaleBlueDot()` (~260 lines in `src/main.js` lines 1392–1660) — none of the DOM IDs exist in `index.html`, and `_showEventInfo`, `showEventToast`, and `_handlePaleBlueDot` have zero callers in the repository; (2) `SolarSystemModule.update()` lines 9157–9162 dispatching `window.dispatchEvent(this._dateEvent)` every 200 ms to a listener whose `updateDateDisplay` immediately returns because `dateDisplay` is `null`; (3) ~30 `event*` translation keys × 6 languages in `src/i18n.js` plus `localeParityFallbackKeys`; (4) ~175 lines of `.time-machine`, `.tm-*`, and `.event-toast` rules in `src/styles/ui.css` (lines 930–1105, 2253–2315). Note: keyboard shortcuts `[` and `]` in `src/main.js` lines 1228–1246 still call `ssm.seekToDate(d)` directly, while `case 'n'` (line 1172) calls `document.getElementById('time-now')?.click()` which is now a silent no-op because `#time-now` was removed from `index.html`.  
  **Problem:** When the Time Machine UI was removed from `index.html`, only the HTML markup was deleted. Hundreds of lines of JS methods, 200 ms timer-throttled CustomEvent dispatches, ~180 localized event strings, and CSS rules remain as dead weight, while the `N` ("jump to Now") keyboard shortcut silently broke because it relied on clicking `#time-now`.  
  **Impact:** Dead payload across JS, CSS, and `i18n.js`; wasted per-200ms event dispatch in the animation loop; broken `N` keyboard shortcut; confusion for maintainers and test authors (e.g., an earlier backlog item asked to write E2E tests for Time Machine buttons that no longer exist in `index.html`).  
  **Recommended solution:** Decide whether Time Machine UI is permanently removed or slated to return. If permanently removed: delete `_getEventDescriptions`, `_showEventInfo`, `_handlePaleBlueDot`, `showEventToast`, `setupTimeMachine`, the `simulatedDateChanged` event dispatch, the unused `.tm-*`/`.event-toast` CSS, and the `event*` i18n strings; make `case 'n'` call `this.solarSystemModule?.seekToDate(new Date())` directly instead of clicking the non-existent `#time-now` button.  
  **Regression considerations:** `initPositionsToDate(new Date())` on boot and `[` / `]` / `N` keyboard shortcuts (if retained) must continue to position planets accurately for the target date.  
  **Acceptance criteria:** Pressing `N` resets `simulatedJD` to today without needing `#time-now` in the DOM; zero unreferenced methods or dead DOM ID lookups remain in `src/main.js`.  
  **Validation:** Unit/E2E test pressing `[` then `n` and verifying `window.app.solarSystemModule.simulatedJD` returns to current JD; `npm run verify`.  
  **Estimated effort:** Small  
  **Business value:** Medium  
  **Technical debt reduction:** High

- [x] **Fix dual conflicting drag handlers attached to `#speed-control`**

  **Priority:** Medium  
  **Category:** Bug  
  **Confidence:** High  
  **Area:** Draggable panels (`PanelManager` vs `UIManager`)  
  **Affected files:** `src/modules/PanelManager.js`, `src/modules/UIManager.js`, `index.html`  
  **Evidence:** `PanelManager.init()` (`src/modules/PanelManager.js:24-31`) calls `this.makeDraggable(speedControlElement)`, which looks for `.drag-handle` (absent on `#speed-control`, so `makeDraggable` returns early at line 50 — meaning `PanelManager` never saves or restores `#speed-control`'s position, even though `PanelManager.handleResize()` calls `resetPanelPosition(speedControlElement)` on every window resize!). Meanwhile, `UIManager.setupSpeedPanelToggle()` (`src/modules/UIManager.js:393-449`) attaches its own separate `_setupPanelDrag()` to `#speed-control .panel-header` with **no viewport boundary constraints** and **no localStorage persistence**, and registers global `mousemove`/`touchmove`/`mouseup`/`touchend` listeners permanently on `document`. Worse, on window resize, `PanelManager.resetPanelPosition(speedControlElement)` sees `#speed-control` is not in `this.manuallyDraggedPanels` and wipes out `style.left`/`style.top` that `UIManager._setupPanelDrag` set, snapping the user's dragged speed panel back to the top-right corner and applying `PanelManager.applyCSSDefaults()` which forces `minTop: 100` (moving `#speed-control` from its CSS `top: 72px` down to `100px`!).  
  **Problem:** Two different classes (`PanelManager` and `UIManager`) half-manage `#speed-control`. `UIManager` implements an unconstrained, non-persistent drag handler, while `PanelManager` fails to attach its drag handler (missing `.drag-handle` class) yet still resets `#speed-control` on every window resize to `y >= 100px` (overriding CSS `top: 72px`).  
  **Impact:** (1) Dragging the speed panel off-screen has no viewport clamping; (2) resizing the browser window resets any manual drag of `#speed-control` and shifts it 28px lower than its initial CSS position (`top: 72px` -> `100px`); (3) duplicate drag logic across two modules.  
  **Recommended solution:** Remove `_setupPanelDrag` from `UIManager.js`, add `.drag-handle` to `#speed-control .panel-header` in `index.html` (with the click-suppression guard when `dragMoved` is true), and adjust `PanelManager.constraints.minTop` to `64` so `top: 72px` is respected as valid.  
  **Regression considerations:** Clicking `#speed-toggle` without dragging must still collapse/expand the speed panel; dragging the header must not trigger collapse/expand on mouseup.  
  **Acceptance criteria:** `#speed-control` can be dragged within viewport bounds, persists its position across reloads, does not jump from `72px` to `100px` on window resize, and only one drag implementation exists in the codebase.  
  **Validation:** E2E test dragging `#speed-control`, resizing the viewport, and asserting its position stays constrained and does not jump.  
  **Estimated effort:** Small  
  **Business value:** Medium  
  **Technical debt reduction:** Medium

- [x] **Sync desktop UI state and info panel when actions or selections happen in VR**

  **Priority:** Medium  
  **Category:** Bug  
  **Confidence:** High  
  **Area:** WebXR / Desktop state synchronization  
  **Affected files:** `src/modules/SceneManager.js`  
  **Evidence:** (1) In `SceneManager.onSelectStart()` (`src/modules/SceneManager.js:1808-1816`), raycasting against `this.scene.children` checks `if (hitObject.name && module.focusOnObject)`, whereas `App._raycastNamedObject()` traverses up via `_findNamedParent()` looking for `userData.name`. Most planet/moon/spacecraft meshes store their identifier on `object.userData.name` (or a parent `THREE.Group`'s `userData.name`), NOT `hitObject.name` (which is `""` on standard meshes created in `SolarSystemModule.js`!). As a result, pointing and pulling the trigger on a 3D planet or spacecraft in VR fails the `if (hitObject.name)` check and does nothing! (2) In `SceneManager.handleVRAction()` (`src/modules/SceneManager.js:2356-2374`), `speed0`/`speed1`/`speed10`/`speed100` set `app.timeSpeed` directly without updating `#time-speed` slider or `#time-speed-label`, and `case 'sound'` toggles `audioManager.enabled` without updating `#sound-toggle` checkbox or label. (3) In `getVRMenuState()` (line 798), `orbitsVisible: module?.orbitsVisible ?? true` reads the legacy boolean (which is `false` for `'planets'`, `'dwarfs'`, `'moons'`, `'comets'`) instead of `module?.orbitMode !== 'none'`.  
  **Problem:** VR trigger object selection checks `hitObject.name` (empty string on nearly all scene meshes except `'laser'`/`'pointer'`/`'cone'`/`'sunLight'`) instead of resolving the named ancestor via `userData.name` against `pickableObjects`. Additionally, VR menu speed/sound/orbit controls bypass UI state synchronization.  
  **Impact:** Pointing at a planet, moon, or spacecraft in VR and pressing the trigger fails to select or teleport to it (`hitObject.name` is `""`), breaking one of the headline VR interactions ("Point + Trigger: Select objects").  
  **Recommended solution:** In `SceneManager.onSelectStart()`, raycast against `module.pickableObjects` (consistent with `updateLaserPointers`) and walk up the parent chain to find the object with `obj.userData?.name` (reusing `app._findNamedParent(hitObject)`). Route VR speed and sound changes through `UIManager` / `App` helper methods so DOM controls and VR state stay in sync, and check `module.orbitMode !== 'none'` in `getVRMenuState()`.  
  **Regression considerations:** VR UI panel clicks must still take priority over 3D scene object selection when the panel is visible and intersected.  
  **Acceptance criteria:** Trigger-selecting a planet or multi-mesh spacecraft group in VR resolves the root named `Object3D`, updates `vrLastObjectInfo` and the info panel, and calls `teleportVRToObject(target)`.  
  **Validation:** Automated test invoking `onSelectStart` with a controller aimed at Earth and at a multi-mesh spacecraft (e.g. ISS or Voyager 1) and verifying `focusedObject` and dolly position update.  
  **Estimated effort:** Small  
  **Business value:** High  
  **Technical debt reduction:** Medium

- [x] **Prevent `updateOrbitalPaths()` from resetting orbit visibility to `'all'` when switching scale or scientific mode**

  **Priority:** Medium  
  **Category:** Bug  
  **Confidence:** High  
  **Area:** `SolarSystemModule` orbit visibility state  
  **Affected files:** `src/modules/SolarSystemModule.js`  
  **Evidence:** `SolarSystemModule.updateOrbitalPaths()` (`src/modules/SolarSystemModule.js:10275, 10305`) creates new `THREE.Line` objects for planets, dwarf planets, and moons with `orbit.visible = this.orbitsVisible`. However, `this.orbitsVisible` is only `true` when `this.orbitMode === 'all'` (line 10064: `this.orbitsVisible = (mode === 'all')`). When the user has selected `'planets'`, `'dwarfs'`, or `'moons'` orbit mode (`this.orbitsVisible === false`) and then toggles Scale Mode (`S` key / `#toggle-scale`), `applyScaleMode()` calls `setScientificMode()` and `updateScale()`, both of which call `updateOrbitalPaths()`. This recreates all planet, dwarf, and moon orbit lines with `orbit.visible = false` (hiding the orbits the user had visible!) and furthermore calls `updateOrbitalPaths()` **twice** in a single scale toggle (once in `setScientificMode` at line 3507 and again in `updateScale` at line 10188), creating and immediately disposing ~35 `BufferGeometry` + `LineBasicMaterial` instances redundantly.  
  **Problem:** Toggling Scale Mode while in `'planets'`, `'dwarfs'`, or `'moons'` orbit mode wipes out the visible orbit lines because `updateOrbitalPaths()` assigns `orbit.visible = this.orbitsVisible` instead of re-applying `this.setOrbitMode(this.orbitMode)`, and `applyScaleMode()` triggers `updateOrbitalPaths()` twice back-to-back.  
  **Impact:** User-visible bug: selecting "Planets", "Dwarf Planets", or "Moons" orbits and then toggling Scale Mode causes all planet/dwarf/moon orbit lines to disappear while the Orbits button still claims that mode is active. Also doubles geometry allocation work on every scale toggle.  
  **Recommended solution:** At the end of `updateOrbitalPaths()`, call `this.setOrbitMode(this.orbitMode)` so per-category visibility (`planets`, `dwarfs`, `moons`, `comets`, `none`, `all`) is preserved. In `applyScaleMode()`, avoid calling `updateOrbitalPaths()` twice by letting `updateScale()` perform the single rebuild after both `realisticScale` and `scientificMode` are updated.  
  **Regression considerations:** Orbit geometry must still switch between circular (educational) and Keplerian elliptical (scientific) paths when scale mode changes.  
  **Acceptance criteria:** Setting orbit mode to `'planets'`, `'dwarfs'`, or `'moons'` and toggling Scale Mode preserves the exact visibility of each orbit category and calls `updateOrbitalPaths()` only once per toggle.  
  **Validation:** Playwright test cycling `#toggle-orbits` to `'planets'`, clicking `#toggle-scale`, and asserting planet orbit lines remain `visible === true` while dwarf/moon orbit lines remain `visible === false`.  
  **Estimated effort:** Small  
  **Business value:** High  
  **Technical debt reduction:** Low

---

### Low

- [ ] **Sync `README.md`, `ATTRIBUTION.md`, and `.github/copilot-instructions.md` with current repository state**

  **Priority:** Low  
  **Category:** Documentation  
  **Confidence:** High  
  **Area:** Documentation accuracy  
  **Affected files:** `README.md`, `ATTRIBUTION.md`, `.github/copilot-instructions.md`  
  **Evidence:** (1) `README.md` line 25 lists "Parker Solar Probe" under Space Missions, and line 7 states `Three.js-v0.183.0` (actual pinned version is `0.183.2`; Sputnik 1 and GPS NAVSTAR are implemented, not Parker Solar Probe). (2) `ATTRIBUTION.md` lines 22–38 list `.jpg` filenames (`sun.jpg`, `earth_1k.jpg`, etc.), whereas all textures in `./textures/` were converted to `.webp` and expanded to 51 files including dwarf planets, moons, nebulae, and galaxies. (3) `.github/copilot-instructions.md` cites SW version `v2.10.1` / `2.10.33`, `earth_1k.jpg`, `STATIC_CACHE_FILES` (now split into `CORE_CACHE_FILES` and `ASSET_CACHE_FILES`), and omits `npm run version:bump` / `scripts/sync-version.mjs`.  
  **Problem:** Key contributor and user documentation describes outdated filenames (`.jpg` vs `.webp`), a spacecraft that does not exist in the codebase ("Parker Solar Probe"), an older Three.js patch version (`0.183.0` vs `0.183.2`), and manual SW cache-version editing instead of `npm run version:bump`.  
  **Impact:** Misleads users about included spacecraft and misleads contributors or coding agents into editing version stamps by hand or referencing `.jpg` textures.  
  **Recommended solution:** Update `README.md` (replace Parker Solar Probe with Sputnik 1 / JWST / GPS NAVSTAR; update Three.js badge to `0.183.2`), update `ATTRIBUTION.md` texture extensions to `.webp` and document the full set, and update `.github/copilot-instructions.md` to reference `npm run version:bump` and `CORE_CACHE_FILES` / `ASSET_CACHE_FILES`.  
  **Regression considerations:** Documentation-only change.  
  **Acceptance criteria:** All filenames, spacecraft lists, and workflow commands in `README.md`, `ATTRIBUTION.md`, and `.github/copilot-instructions.md` match the actual codebase.  
  **Validation:** Manual review + `npm run version:check`.  
  **Estimated effort:** Small  
  **Business value:** Low  
  **Technical debt reduction:** Low

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

- [x] Self-host Three.js instead of loading the 3D engine from a public CDN

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

Priority: High
Category: Technical Debt
Area: Lint / observability
Affected files: `src/**/*.js`, `sw.js`, `eslint.config.js`, `package.json`
Problem: 209 ESLint warnings persist, overwhelmingly `no-console`. (Carried forward
and **re-prioritised from Medium to High**: a warning baseline that survives two
consecutive reviews is a baseline nobody will ever clear, and it now hides genuinely
ungated calls — one unguarded `console.warn` on the *expected* texture-fallback path
was found and fixed in this pass precisely because it was buried in the noise.)
Impact: Lint output is ignored, so it no longer catches anything. Real production
console spam ships undetected.
Recommended solution: Add `src/modules/logger.js` exposing `debug/info/warn/error`
that no-op unless the matching `DEBUG` flag is set, mechanically replace the call
sites, then set `no-console` and `prefer-const` to `error` and add `--max-warnings=0`
to the `lint` script so CI enforces it.
Acceptance criteria: `npm run lint -- --max-warnings=0` exits 0; a production load
with no debug URL parameter produces zero console output.
Estimated effort: Medium
Business value: Medium
Technical debt reduction: High

- [ ] Trap focus and restore it for every modal, and stop delaying the onboarding trap

Priority: High
Category: Accessibility
Area: Modal dialogs
Affected files: `src/modules/AppFeatures.js`, `src/modules/UIManager.js`, `index.html`
Problem: `setupOnboarding()` reveals the overlay and installs the focus trap inside the
same `setTimeout(…, 1000)`, but the overlay is a real, focusable subtree the whole time
— during that window a keyboard user can tab behind the modal. There is also no
documented restore-focus-on-close behaviour, so dismissing a dialog drops focus to
`<body>`.
Impact: Fails WCAG 2.4.3 (Focus Order) and 2.1.2 (No Keyboard Trap escape contract).
Keyboard and screen-reader users lose their place after every dialog.
Recommended solution: Make the overlay genuinely inert until shown (`inert` attribute
or `display:none`), install the trap in the same tick as the reveal, and have
`_trapFocus`/`_releaseFocusTrap` record and restore the previously focused element.
Acceptance criteria: A spec tabs 20 times with each dialog open and asserts focus never
leaves the dialog; closing any dialog returns focus to the control that opened it.
Estimated effort: Small
Business value: Medium
Technical debt reduction: Low

---

### Medium

- [ ] Stop long-timeout Playwright tests from masking hard failures as slowness

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

- [ ] Handle storage-quota failures in the service worker instead of reporting "offline"

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

- [ ] Enable automated dependency and action updates

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

- [ ] Add `type="button"` to every non-submit button

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

- [ ] Remove the redundant nested `aria-live` on the loading percentage

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

- [ ] Name the star-twinkle batch size

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

- [ ] Correct the throttle comment on the VR laser update

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

- [ ] Remove dead VR state left over from earlier iterations

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

- [ ] Retain CI artefacts long enough to investigate flakes

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

### Critical

- [ ] Split `SolarSystemModule.js` (11,000+ lines / ~470 KB) into cohesive modules

Priority: Critical
Category: Architecture
Area: Solar system domain layer
Affected files: `src/modules/SolarSystemModule.js`, `sw.js`, `index.html`
Problem: A single class file holds astronomical data tables, ~40 procedural texture
generators, mesh construction for planets/moons/rings/comets/spacecraft/deep-sky
objects, the per-frame orbital integration loop, camera focus logic, and info-panel
data assembly. It is impossible to reason about in isolation, impossible to test in
units, and every change forces the whole 470 KB file back over the wire.
Impact: Highest change-risk file in the repository. Merge conflicts are near-certain
on any parallel work. New contributors cannot locate behaviour. First-load transfer
is dominated by this one file.
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

Priority: Critical
Category: Performance
Area: Internationalisation / first paint
Affected files: `src/i18n.js`, `index.html`, `src/modules/LanguageManager.js`, `sw.js`
Problem: `src/i18n.js` inlines every string for en/nl/fr/de/es/pt and is loaded as a
synchronous, render-blocking `<script>` in `<head>`. A user only ever needs one
language, so ~83% of the payload is dead weight, and it blocks first paint.
Impact: Directly delays First Contentful Paint on every visit, worst on the mobile
and low-power devices this app explicitly targets. Dominates the critical path.
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

- [ ] Mark `ENGINEERING_REVIEW.md` as superseded

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
