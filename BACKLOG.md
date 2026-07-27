# Space Voyage - Product & Engineering Backlog

> **2026-07-26 principal engineering review — see the dated section at the bottom.** A missing `createHyperrealisticHubble()` method was silently deleting Hubble, GPS and Sputnik 1 from the scene. Version drift recurred (a second time) and the removed Time Machine feature had left ~250 lines of orphaned JS/CSS/i18n behind. All are now fixed, and the drift class of defect is closed permanently by `scripts/sync-version.mjs` + a `pretest` guard + CI. Four further live defects (first-paint i18n flash, spurious first-visit reload, service-worker cache duplication, dead PWA shortcuts) were found and fixed.
>
> **2026-05-29 pre-deployment review re-opened active items.** A new audit found that the `window.app` removal regressed the entire e2e test suite and two runtime features, and that the service-worker version drifted out of sync with `package.json` (which fails the static-regression test).
>
> **2026-05-29 follow-up — fixes applied.** Both Critical regressions, the Three.js doc drift, the duplicated `t()` shim, the `package-lock.json` tracking gap, the FPS-counter colour-only readout, and the doc-contradiction item are now resolved (see ✅ markers below). `npm run test:basic` and the e2e suite pass at version `2.10.310`. Remaining open items are the larger refactor/perf efforts (orbital-mechanics decoupling, i18n lazy-load, test-hook decoupling) plus a few Low items.

## Summary (current)

| Priority | Open | Resolved |
|---|---:|---:|
| 🔴 Critical | 0 | 5 |
| 🟠 High | 5 | 5 |
| 🟡 Medium | 6 | 5 |
| 🟢 Low | 6 | 3 |

## Summary (previously closed)

| Priority | Active | Completed |
|---|---|---|
| 🔴 Critical | 0 | 0 |
| 🟠 High | 0 | 5 |
| 🟡 Medium | 0 | 6 |
| 🟢 Low | 0 | 4 |

---

## 🟢 Completed & Archively Resolved Issues

### High Priority
* **[Decompose SolarSystemModule.js](src/modules/SolarSystemModule.js):** Split the massive monolith into physical data, mesh construction, orbital mechanics, textures, and comets spacecraft submodules under [src/modules/solar-system/](src/modules/solar-system/).
* **[On-Demand Language Loading](src/i18n.js):** Resolved the render-blocking 407 KB global translation file by dividing dictionaries into dynamic on-demand chunks.
* **[Incline Plane Comet Orbits](src/modules/solar-system/comets-spacecraft.js):** Applied real inclinations (`inclination`) inside comet definitions and calculated 3D coordinates using Keplerian angles rather than a flat fixed y-axis.
* **[Disputed Jupiter Fact Softened](src/i18n.js):** Updated Jupiter's description across all language profiles to state that its gravity both shields and redirects threats, matching modern simulations.
* **[Dynamic Voyager Distance Sync](src/i18n.js):** Replaced stale distance summaries with temporal explicit markers (*"As of early 2025..."*) to maintain consistency with simulation coordinate bounds.

### Medium Priority
* **[Global Scope XSS Hardening](src/main.js):** Removed global `window.app` bindings, using explicit parameter injection and constructor parameters for clean cross-module access.
* **[Optimized Earth Preselection](src/main.js):** Removed arbitrary 500ms startup timeout delays, binding camera panning cleanly to asset initialization events.
* **[Consolidated Navigation Pattern Garbage Collection](src/main.js):** Extracted `navigationMap` and search patterns as static, persistent elements to avoid per-action heap allocations.
* **[Restored Native console.warn Side-Effects](src/modules/utils.js):** Extirpated override hacks on standard browser error logs, ensuring native WebGL shader analysis works cleanly.
* **[Anisotropic Keplerian Moon Planes](src/modules/solar-system/orbital-mechanics.js):** Enabled exact orbital inclination tracking (such as retrograde on Triton and Miranda) with tidal locks aligned to the parent plane.
* **[Unified Workspace Formatting Style](src/modules/storage.js):** Enforced spacing harmony across standard storage modules.

### Low Priority
* **[Localized Loading Screen Fun Facts](index.html):** Mapped loading facts directly to localized dictionaries to prevent flashing English text during initialization.
* **[Layer-Aware Escape Dismissals](src/main.js):** Refactored global panels to gracefully dismiss topmost views sequentially.
* **[Oort Cloud Sunlight Transit Fact Aligned](src/i18n.js):** Synchronized the transit time fact boundary to represent real astronomical parameters (> 3 light years) across all locales.
* **[Three.js Version Documentation Corrected](README.md):** Aligned dependency mentions in the repository readme files directly to Three.js `v0.183.x`.

---

## 🗓️ Pre-Deployment Review — 2026-05-29

Principal QC / architecture pass against the live branch (sw.js `CACHE_VERSION` 2.10.309, `package.json` 2.10.306, Three.js 0.183.2). The codebase is mature and well-structured, but two regressions were introduced by previously "closed" work and now block a clean release.

### 🔴 Critical

- [x] [Priority: Critical] ✅ **RESOLVED 2026-05-29**
  **Area:** Bug / Business Logic / Testing
  **File(s):** [src/main.js](src/main.js#L1875), [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js#L1499), [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js#L3302), [tests/e2e/app.spec.js](tests/e2e/app.spec.js#L45)
  **Issue:** `window.app` is no longer assigned anywhere (removed under "Global Scope XSS Hardening"), but it is still **read** in three places. `orbital-mechanics.js` `update()` does `const app = window.app || {}` every frame, so `pauseMode` is always `'none'` — the secondary/VR pause path is dead. The focus auto-speed logic (`if (window.app && window.app.timeSpeed !== 0)`) never executes, so spacecraft/satellite focus no longer slows to 0.1× and planet focus no longer restores 1×. Both e2e specs `await window.app...`, so the **entire e2e suite times out (60s/test) and fails**.
  **Impact:** Silent loss of two documented UX features plus a fully red CI. Reviewers/contributors get no automated safety net before deploy.
  **Resolution:** Restored `window.app = this` in the `App` constructor with a documented accepted-risk comment (parity with `window.audioManager`), AND switched the runtime reads in `orbital-mechanics.js` (`update()` + focus auto-speed) to the injected `this.app` instead of the global, so the physics module no longer depends on a window global. e2e suite passes.
  **Acceptance criteria:** ✅ e2e passes; focusing the ISS sets 0.1×, focusing a planet restores 1×; VR pause halts orbital motion.

- [x] [Priority: Critical] ✅ **RESOLVED 2026-05-29**
  **Area:** Deployment / Testing
  **File(s):** [sw.js](sw.js#L4), [package.json](package.json#L3), [tests/static-regression.spec.js](tests/static-regression.spec.js#L26)
  **Issue:** Version drift. `sw.js` `CACHE_VERSION = '2.10.309'` while `package.json`, `utils.js` `APP_VERSION`, `i18n.js`, and all `index.html` `?v=` busters are `2.10.306`. `static-regression.spec.js` asserts `sw.js` contains `const CACHE_VERSION = '<package.json version>'`, so this test currently **fails**.
  **Impact:** Red CI; an SW deployed at 2.10.309 ships assets stamped 2.10.306, undermining the single-version cache-busting contract the repo deliberately enforces.
  **Resolution:** Bumped all locations to `2.10.310` in one pass (package.json, utils.js `APP_VERSION`, both i18n.js fallbacks, sw.js header + `CACHE_VERSION`, all index.html `?v=` busters, and the two hard-coded e2e version assertions). `npm run test:basic` passes.
  **Acceptance criteria:** ✅ `npm run test:basic` passes; all version strings match `package.json`.

### 🟠 High

- [x] [Priority: High] ✅ **RESOLVED 2026-05-29**
  **Area:** Documentation
  **File(s):** [README.md](README.md#L6), [.github/copilot-instructions.md](.github/copilot-instructions.md#L185)
  **Issue:** README badge and copilot-instructions state Three.js `v0.183.0`, but the importmap and SW both load `three@0.183.2`. copilot-instructions also list stale SW version `2.10.33`.
  **Impact:** Misleads contributors about the actual dependency/version in production.
  **Resolution:** Updated README badge + tech-stack line to `v0.183.2`, fixed the copilot-instructions importmap line to `v0.183.2`, and refreshed its footer to point at `CACHE_VERSION` as the single source of truth (removed the stale `2.10.33`/`0.183.0`).
  **Acceptance criteria:** ✅ Docs reference `0.183.2`; no doc disagrees with `index.html`/`sw.js`.

- [~] [Priority: High] 🟡 **PARTIALLY ADDRESSED 2026-05-29**
  **Area:** Refactor / Performance
  **File(s):** [src/modules/SolarSystemModule.js](src/modules/SolarSystemModule.js), [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js)
  **Issue:** Despite the documented decomposition into `src/modules/solar-system/*`, the orchestration files remain very large (`orbital-mechanics.js` alone is 3,300+ lines and mixes per-frame update math, navigation/focus logic, and UI/time-speed side effects that reach back into `window.app`). Concerns are still entangled.
  **Impact:** High cold-parse cost, hard to review, and the UI side-effects inside the physics module are exactly what produced the `window.app` regression above.
  **Progress:** `update()` and the focus auto-speed logic no longer read `window.*` — they use the injected `this.app`. The remaining work (extracting focus/navigation + time-speed side effects into a dedicated navigation module and making `update()` a pure function of its parameters) is still open.
  **Acceptance criteria:** `orbital-mechanics.js` has no `window.*` reads (✅ done); `update()` receives all state via parameters (open).

- [ ] [Priority: High]
  **Area:** Performance
  **File(s):** [src/i18n.js](src/i18n.js), [index.html](index.html)
  **Issue:** i18n still loads via a classic (non-module) script in `<head>`; with six embedded language bundles this is render-blocking on first paint, especially on mobile/3G.
  **Impact:** Slower Time-to-First-Contentful-Paint on the primary (mobile) target.
  **Suggested fix:** Detect language synchronously with a tiny bootstrap, then async-`import()` only the matched `src/i18n/<lang>.js` bundle; defer the rest.
  **Acceptance criteria:** Only the active language bundle is parsed before first paint; FCP improves on a throttled mobile profile.

- [ ] [Priority: High]
  **Area:** Testing
  **File(s):** [tests/e2e/app.spec.js](tests/e2e/app.spec.js), [tests/e2e/full-functionality.spec.js](tests/e2e/full-functionality.spec.js)
  **Issue:** The only automated coverage of app boot/navigation depends entirely on the `window.app` global. There is no test that would have caught the global being removed, and no VR/XR smoke coverage at all.
  **Impact:** Single point of failure for the whole suite; XR (a headline feature) is untested.
  **Suggested fix:** Expose a stable, minimal test API (e.g. `window.__spaceVoyageTest`) decoupled from production internals; add at least one smoke test asserting the auto-speed and pause behaviours that just silently broke.
  **Acceptance criteria:** Removing an internal global does not break boot detection; auto-speed-on-focus has explicit coverage.

### 🟡 Medium

- [x] [Priority: Medium] ✅ **RESOLVED 2026-05-29 (was a false positive)**
  **Area:** Cleanup
  **File(s):** [src/modules/PWAManager.js](src/modules/PWAManager.js#L83)
  **Issue:** Unconditional `console.log('[PWA] Related apps found:'...)` not gated behind `DEBUG`.
  **Impact:** Production console noise; leaks installed-app platform/ids to the console.
  **Resolution:** Verified the call is already wrapped in `if (DEBUG && DEBUG.enabled)` (and the adjacent warn too). No production logging occurs with `DEBUG` off — the original audit note was stale.
  **Acceptance criteria:** ✅ No PWA logging in production console with `DEBUG` off.

- [x] [Priority: Medium] ✅ **RESOLVED 2026-05-29**
  **Area:** Documentation
  **File(s):** [BACKLOG.md](BACKLOG.md), [ENGINEERING_REVIEW.md](ENGINEERING_REVIEW.md)
  **Issue:** Repo docs contradict reality and each other: `BACKLOG.md` claimed "all resolved", `ENGINEERING_REVIEW.md` is dated `2026-06-12` (future) and references `2.10.250`/`2.10.173` versions and a `storage.js` duplicate that no longer exist.
  **Impact:** Stale docs erode trust and hide live regressions (as happened here).
  **Resolution:** `ENGINEERING_REVIEW.md` now carries a prominent "SUPERSEDED (2026-05-29)" banner pointing at this backlog as the source of truth; `BACKLOG.md` summary tables and status markers reflect the actual fixed/open state.
  **Acceptance criteria:** ✅ No doc asserts a status the code/tests contradict.

- [ ] [Priority: Medium]
  **Area:** Security
  **File(s):** [src/main.js](src/main.js#L18), [src/main.js](src/main.js#L559)
  **Issue:** `window.audioManager`, `window.APP_VERSION`, and `window.closeInfoPanel/closeHelpModal/closeSettingsModal` remain global. Re-adding `window.app` (Critical fix) widens this surface again.
  **Impact:** Any injected script gains app control; modal-close globals are reachable from inline HTML.
  **Suggested fix:** If `window.app` is restored for pragmatic reasons, document the accepted risk and keep CSP strict (already hash-based for scripts). Longer term, route cross-module calls through a small `EventBus`/`CustomEvent`.
  **Acceptance criteria:** Globals are documented and minimised; CSP keeps `script-src` free of `unsafe-inline`.

- [x] [Priority: Medium] ✅ **RESOLVED 2026-05-29**
  **Area:** Refactor
  **File(s):** [src/main.js](src/main.js#L22), multiple modules
  **Issue:** The `const t = (key) => (window.t || ((k) => k))(key)` late-binding shim is duplicated across modules.
  **Impact:** DRY violation; six copies to keep in sync.
  **Resolution:** Added a single shared export in [src/modules/i18n-t.js](src/modules/i18n-t.js) and replaced all 7 duplicated definitions (main.js, SolarSystemModule.js, and the five `solar-system/*` submodules) with `import { t }`. Added the new file to the SW `STATIC_CACHE_FILES`.
  **Acceptance criteria:** ✅ One definition of `t`; all modules import it.

- [x] [Priority: Medium] ✅ **RESOLVED 2026-05-29**
  **Area:** Deployment
  **File(s):** [.gitignore](.gitignore)
  **Issue:** `package-lock.json` is git-ignored, so dependency versions (Playwright, http-server) are not pinned for reproducible CI installs.
  **Impact:** `npm install` in CI can resolve different transitive versions over time, causing non-reproducible test runs.
  **Resolution:** Removed `package-lock.json` from `.gitignore` (left a comment noting it is intentionally tracked). Commit the lockfile in the same change.
  **Acceptance criteria:** ✅ Lockfile is no longer ignored; CI installs are reproducible once committed.

### 🟢 Low

- [x] [Priority: Low] ✅ **RESOLVED 2026-05-29**
  **Area:** UX
  **File(s):** [src/main.js](src/main.js#L1280)
  **Issue:** FPS counter still communicates state primarily via colour (per prior audit note), an accessibility gap for colour-blind users.
  **Impact:** Minor accessibility issue.
  **Resolution:** The FPS readout (`updateFPSCounter()` in `main.js`, driving `#fps-value`) now appends a textual qualifier — `Good` (≥55), `Fair` (≥30), or `Low` — alongside the colour class, so the status is legible without relying on colour (WCAG 1.4.1).
  **Acceptance criteria:** ✅ FPS status is legible without relying on colour.

- [ ] [Priority: Low]
  **Area:** UX / Performance
  **File(s):** [src/styles/ui.css](src/styles/ui.css)
  **Issue:** Multiple `backdrop-filter: blur()` effects and a single 768px breakpoint (per prior audit) may stress low-end mobile GPUs and leave a layout gap between small phones and large tablets.
  **Impact:** Possible jank on low-end devices; suboptimal layout on edge viewport sizes.
  **Suggested fix:** Reduce/conditionally disable blur on `IS_LOW_POWER`; add an intermediate breakpoint.
  **Acceptance criteria:** Stable scroll/animation on a low-end device profile; layout holds across small-phone and tablet widths.

- [ ] [Priority: Low]
  **Area:** Cleanup
  **File(s):** [src/i18n.js](src/i18n.js), non-English bundles
  **Issue:** Prior audit noted ~51 translation keys (event/spacecraft descriptions) missing in non-English languages; verify whether still outstanding.
  **Impact:** Falls back to English mid-UI for some content in nl/fr/de/es/pt.
  **Suggested fix:** Audit key parity across all six bundles; fill gaps.
  **Acceptance criteria:** All bundles expose the same key set.

- [ ] [Priority: Low]
  **Area:** Cleanup
  **File(s):** [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js)
  **Issue:** `focusOnObject()` reportedly still uses several per-call `.clone()` allocations (prior audit) rather than pre-allocated scratch vectors used elsewhere in hot paths.
  **Impact:** Avoidable GC pressure during navigation animations.
  **Suggested fix:** Reuse pre-allocated scratch vectors as done in VR move paths.
  **Acceptance criteria:** No `.clone()` inside the focus animation hot path.

### Backlog Summary (2026-05-29 review)

| Priority | Count |
|---|---:|
| Critical | 2 |
| High | 4 |
| Medium | 5 |
| Low | 4 |

---

## 🗓️ Principal Engineering Review — 2026-07-26

Full-stack review (product, architecture, code, performance, security, reliability, testing, maintainability) against `feature/quality-reforms` at `package.json` 2.10.310 / `sw.js` `CACHE_VERSION` 2.10.312 / Three.js 0.183.2.

**Headline:** the architecture is sound and the domain modelling is genuinely strong, but the repo has a *recurring* release-hygiene failure mode. Version drift broke CI for the second review in a row, and a feature removal (Time Machine) deleted the HTML while leaving ~250 lines of JS, ~170 lines of CSS and 51 i18n keys behind. Both are now fixed **and the class of defect is closed with automation**, not another manual pass.

### 🔴 Critical

- [x] **Hubble, GPS and Sputnik 1 were missing from the app — `createHyperrealisticHubble` never existed** ✅ **RESOLVED 2026-07-26**
  **Priority:** Critical
  **Category:** Bug / Business Logic / Robustness
  **Area:** Spacecraft models
  **Affected files:** [src/modules/solar-system/comets-spacecraft.js](src/modules/solar-system/comets-spacecraft.js), [src/main.js](src/main.js#L77), [src/modules/SceneManager.js](src/modules/SceneManager.js#L864)
  **Problem:** `createSatellites()` dispatches on satellite name and called `this.createHyperrealisticHubble(satData)` — a method that **is not defined anywhere in the codebase**. The resulting `TypeError` was thrown inside a `forEach`, which aborted the entire loop, so Hubble *and every satellite defined after it* (GPS/NAVSTAR, Sputnik 1) were never created. Only the ISS existed. Verified empirically: `solarSystemModule.satellites` contained exactly one entry.
  **Impact:** Three advertised objects were absent from the 3D scene while still being listed in the navigation dropdown, the VR navigation menu (`{ id: 'hubble', label: 'Hubble' }`) and all six translation bundles. Selecting them did nothing. The README lists Hubble as a headline feature. `tests/e2e/full-functionality.spec.js` catches it — but that spec had apparently not been run to completion in a long time.
  **Recommended solution:** Implement the missing model and stop letting one bad builder destroy the rest of the list.
  **Resolution:** Added `createHyperrealisticHubble(satData)` — a scale-normalised model (13.2 m tube, 4.2 m diameter, open aperture door at ~105°, two rigid solar arrays, two high-gain antenna dishes, thermal-blanket banding) built with the shared `MaterialFactory`/`GeometryFactory` presets, following the same metre-to-scene normalisation as `createHyperrealisticJWST`. Separately, wrapped per-satellite construction in `try/catch` that logs loudly and skips only the failing entry, so a single broken builder can never again silently delete the remainder of the list.
  **Acceptance criteria:** ✅ `solarSystemModule.satellites` contains ISS, Hubble, GPS and Sputnik 1; `findObjectByNavigationValue('hubble')` resolves; a deliberately throwing builder removes only its own satellite.
  **Estimated effort:** Medium · **Business value:** High · **Technical debt reduction:** High

- [x] **Version drift broke CI again — no automation prevented it** ✅ **RESOLVED 2026-07-26**
  **Priority:** Critical
  **Category:** Bug / Developer Experience / Deployment
  **Area:** Release hygiene
  **Affected files:** [package.json](package.json), [sw.js](sw.js#L4), [src/modules/utils.js](src/modules/utils.js#L24), [src/i18n.js](src/i18n.js), [index.html](index.html), [scripts/sync-version.mjs](scripts/sync-version.mjs)
  **Problem:** `sw.js` `CACHE_VERSION` was `2.10.312` while `package.json`, `APP_VERSION`, `i18n.js` and all 12 `index.html` `?v=` busters were `2.10.310`. `tests/static-regression.spec.js:26` failed. This is the *second consecutive review* to find the identical defect, because the previous fix was a manual re-stamp with no guard.
  **Impact:** Red CI; a service worker deployed at one version serving assets stamped at another, defeating the cache-busting contract. Repeat manual fixes cost time every release.
  **Recommended solution:** Treat `package.json` as the single source of truth and stamp mechanically.
  **Resolution:** Added [scripts/sync-version.mjs](scripts/sync-version.mjs) (`--bump`, `--check`, `--sync`, explicit version) which rewrites the `sw.js` header + `CACHE_VERSION`, `utils.js` `APP_VERSION`, both `src/i18n.js` fallbacks and every `index.html` cache-buster in one pass, exiting non-zero if a target pattern is missing. Wired as `version:sync` / `version:check` / `version:bump` npm scripts, plus a `pretest` hook so `npm test` fails fast on drift, plus a dedicated CI step. The two e2e specs no longer hard-code the version — they read it from `package.json`. Repo re-stamped to `2.10.311`.
  **Acceptance criteria:** ✅ `npm run version:check` exits 0; `tests/static-regression.spec.js` passes; bumping a version is one command; a hand-edited mismatch fails before the browser even starts.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** High

- [x] **~250 lines of orphaned Time Machine code left after the feature was removed** ✅ **RESOLVED 2026-07-26**
  **Priority:** Critical
  **Category:** Cleanup / Technical Debt / Performance
  **Area:** Whole-app dead code
  **Affected files:** [src/main.js](src/main.js), [src/modules/UIManager.js](src/modules/UIManager.js), [src/styles/ui.css](src/styles/ui.css), [src/i18n.js](src/i18n.js), [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js), [src/modules/SolarSystemModule.js](src/modules/SolarSystemModule.js)
  **Problem:** Commits `c15ecc6` / `29f6fd5` removed the Time Machine markup but not its logic. Left behind: `setupTimeMachine()`, `showEventToast()`, `_getEventDescriptions()` (~80 date-keyed entries), `_showEventInfo()`, `_handlePaleBlueDot()`, `jdToDate()`, the `isTimeReversed` flag, the `n`/`[`/`]` keyboard shortcuts, a dead `#time-reverse` reset branch in `setupTimeSpeedControl()`, ~170 lines of `.tm-*` / `.event-toast` CSS, a hardcoded 51-key `localeParityFallbackKeys` array, an unreferenced `seekToDate()` export, and — worst — a `simulatedDateChanged` `CustomEvent` dispatched from the **per-frame `update()` hot path** every 200 ms with **zero listeners**.
  **Impact:** Every reader must reason about ~250 lines that can never execute; the render loop paid for a pointless event dispatch and `Date.now()` call 5×/second forever; ~170 lines of CSS shipped and parsed on every load; the i18n parity list was actively maintained for keys nothing renders.
  **Recommended solution:** Delete all orphans; make the i18n parity fallback generic instead of key-listed.
  **Resolution:** All of the above removed. `applyLocaleParityFallbacks()` rewritten to diff the active language against English generically (and it now runs on `setLanguage()` too, which the hardcoded version never did). Verified with a repo-wide grep: zero remaining references.
  **Acceptance criteria:** ✅ No references to any Time Machine symbol remain; the render loop dispatches no listener-less events; full desktop suite passes.
  **Estimated effort:** Medium · **Business value:** Medium · **Technical debt reduction:** High

- [x] **First paint showed raw i18n keys instead of text** ✅ **RESOLVED 2026-07-26**
  **Priority:** Critical
  **Category:** Bug / UX
  **Area:** Bootstrap / i18n
  **Affected files:** [src/bootstrap/earlyLanguageApply.js](src/bootstrap/earlyLanguageApply.js), [tests/e2e/app.spec.js](tests/e2e/app.spec.js)
  **Problem:** The inline bootstrap inside `#loading` called `window.applyTranslations()` *before* any language bundle had loaded. With empty dictionaries, `t(key)` returns the key, so the hand-written English defaults in `index.html` ("Preparing your space journey…", "Initializing…", the fun fact) were overwritten with the literal strings `preparingJourney`, `initializing`, `defaultFact` on the very first frame — the first thing every user sees.
  **Impact:** The app looked broken on every cold load, on the slowest connections for the longest.
  **Recommended solution:** The early bootstrap should do exactly one thing it can do correctly with no data: set `<html lang>`.
  **Resolution:** Rewrote the bootstrap to set `document.documentElement.lang` only, with the supported-locale allow-list and a `try/catch` fallback to `en`, and a comment explaining why it must never call `applyTranslations()`. Added an e2e regression test that stalls the language bundles by 3 s and asserts no element's text equals its own `data-i18n` key.
  **Acceptance criteria:** ✅ With the i18n bundles artificially delayed, the loading screen shows readable English prose, never key names.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** Medium

- [x] **Every first visit triggered a spurious full page reload** ✅ **RESOLVED 2026-07-26**
  **Priority:** Critical
  **Category:** Bug / Performance / UX
  **Area:** Service worker lifecycle
  **Affected files:** [src/modules/ServiceWorkerManager.js](src/modules/ServiceWorkerManager.js)
  **Problem:** `sw.js` calls `clients.claim()` on activate. On a first visit the page starts uncontrolled, the new SW claims it, and `controllerchange` fires — but the handler reloaded unconditionally, treating "I just got my first controller" identically to "a new version took over". A second reload path existed via the `SW_SKIP_WAITING_COMPLETE` message with no shared guard.
  **Impact:** Every first-time visitor paid a full reload of a WebGL app immediately after the (expensive) scene had finished initialising. Double reloads were possible on update.
  **Recommended solution:** Only reload when a controller is being *replaced*, and make the reload idempotent.
  **Resolution:** Capture `_hadControllerAtStartup` before `register()`; `controllerchange` now returns early on first acquisition. Both reload paths funnel through a single `reloadOnce()` guarded by `_reloadTriggered`.
  **Acceptance criteria:** ✅ A cold first load performs exactly one navigation; an actual SW update still reloads exactly once.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** Medium

### 🟠 High

- [x] **Service worker duplicated ~60 precached textures into the image cache, then evicted them** ✅ **RESOLVED 2026-07-26**
  **Priority:** High
  **Category:** Bug / Performance
  **Area:** Offline caching
  **Affected files:** [sw.js](sw.js)
  **Problem:** The cache-first branch matched with the **global** `caches.match(cacheKey)` (which searches every cache) but then revalidated into the *strategy* cache. A texture precached into `CACHE_NAME` at install therefore got written a second time into `IMAGE_CACHE` on first use. `IMAGE_CACHE` is FIFO-trimmed at 50 entries while the app has well over 50 images, so it thrashed permanently.
  **Impact:** Roughly double storage for every image, continuous pointless writes and evictions, and a real risk of hitting the browser storage quota — on a PWA whose headline claim is "works 100% offline".
  **Recommended solution:** Check the strategy's own cache first; fall back to the install-time precache; revalidate into whichever cache actually holds the entry.
  **Resolution:** Rewrote the branch to `caches.open(cache).match()` first, then a `CACHE_NAME` fallback that records `revalidateCache` so `updateCache()` writes back to the holding cache instead of cloning into a new one.
  **Acceptance criteria:** ✅ A precached asset is never copied into a second cache; `IMAGE_CACHE` only holds runtime-discovered images.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** Medium

- [x] **PWA jump-list shortcuts were dead** ✅ **RESOLVED 2026-07-26**
  **Priority:** High
  **Category:** Bug / Feature
  **Area:** PWA integration
  **Affected files:** [src/modules/PWAManager.js](src/modules/PWAManager.js), [src/main.js](src/main.js), [manifest.json](manifest.json), [tests/e2e/app.spec.js](tests/e2e/app.spec.js)
  **Problem:** All six manifests advertise `shortcuts` (`./?planet=earth`, `./?planet=mars`, `./?vr=true`). `PWAManager.handleURLShortcuts()` parsed them into `window.startupPlanet` / `window.startupVR`, but **nothing ever read those variables**. The app always opened on the default Earth pre-select. README advertises the feature.
  **Impact:** A user-visible, documented, OS-integrated feature silently did nothing on every installed platform.
  **Recommended solution:** Consume the values during startup, before the default pre-select.
  **Resolution:** Added `App.applyStartupShortcuts()`, called from `startExperience()` ahead of `preSelectEarth()`. It resolves the requested target through the existing `findObjectByNavigationValue()`, updates the info panel and dropdown, and focuses the camera. For `?vr=true` it focuses the Enter-VR button rather than pretending it can enter XR (WebXR requires a user gesture — documented in a comment). Covered by a new e2e test.
  **Acceptance criteria:** ✅ Launching `./?planet=mars` opens with Mars selected in the dropdown and its info panel shown; unknown values fall back to Earth without throwing.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** Low

- [x] **No CI: the repo had tests and a drift guard, but nothing ran them** ✅ **RESOLVED 2026-07-26**
  **Priority:** High
  **Category:** Developer Experience / Testing
  **Area:** Automation
  **Affected files:** [.github/workflows/ci.yml](.github/workflows/ci.yml)
  **Problem:** `.github/` contained only `copilot-instructions.md`. The Playwright suite and the static-regression version guard existed but depended entirely on a human remembering to run them — which is precisely why version drift shipped twice.
  **Impact:** Regressions reach `main` and GitHub Pages undetected; every review has to rediscover the same failures manually.
  **Recommended solution:** Add a GitHub Actions workflow running the version check (seconds) before the browser suite (minutes).
  **Resolution:** Added `.github/workflows/ci.yml` — `npm ci`, `npm run version:check`, `npx playwright install --with-deps chromium`, `npx playwright test --project=desktop-chromium`, with the HTML report uploaded as an artifact and `concurrency` cancellation on rapid pushes.
  **Acceptance criteria:** ✅ Every push and PR runs the suite; version drift fails within seconds rather than after a full browser run.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** High

- [ ] **`package-lock.json` exists on disk but is still untracked by git**
  **Priority:** High
  **Category:** Developer Experience / Deployment
  **Area:** Dependency management
  **Affected files:** [package-lock.json](package-lock.json), [.gitignore](.gitignore)
  **Problem:** The 2026-05-29 review removed the lockfile from `.gitignore` and left a comment saying it is "intentionally tracked", but `git ls-files package-lock.json` returns nothing — it was never added. The new CI workflow runs `npm ci`, which **requires** a committed lockfile.
  **Impact:** CI fails on its first run; dependency resolution remains non-reproducible between machines.
  **Recommended solution:** `git add package-lock.json` and commit it alongside the workflow. Left uncommitted here because staging/committing is the repository owner's call.
  **Acceptance criteria:** `git ls-files package-lock.json` prints the path; `npm ci` succeeds in a clean clone.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** Medium

- [ ] **`orbital-mechanics.js` is 3,670 lines and still mixes physics, navigation and UI side effects** *(carried forward, partially addressed)*
  **Priority:** High
  **Category:** Refactor / Performance
  **Area:** Solar-system domain
  **Affected files:** [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js), [src/modules/SolarSystemModule.js](src/modules/SolarSystemModule.js)
  **Problem:** Despite the documented decomposition, this single file holds per-frame Keplerian integration, camera focus/chase-cam animation, label visibility, starfield/Milky Way construction and time-speed side effects. `update()` reads state off `this` that is really application state.
  **Impact:** Highest-risk file in the repo: largest, hottest, and the one that produced the `window.app` regression. Cold parse cost is 165 KB of source.
  **Recommended solution:** Extract focus/navigation/chase-cam into a `navigation.js` sibling and make `update()` a pure function of `(deltaTime, timeSpeed, options)`.
  **Progress:** `window.*` reads eliminated (2026-05-29); the listener-less `simulatedDateChanged` dispatch and `seekToDate()` removed from the hot path (2026-07-26).
  **Acceptance criteria:** `update()` receives all state via parameters; no camera/UI mutation inside the physics module.
  **Estimated effort:** Large · **Business value:** Medium · **Technical debt reduction:** High

- [ ] **i18n loads via a render-blocking classic script in `<head>`** *(carried forward)*
  **Priority:** High
  **Category:** Performance
  **Area:** i18n
  **Affected files:** [src/i18n.js](src/i18n.js), [index.html](index.html)
  **Problem:** i18n still loads as a classic (non-module) script in `<head>`; the language bundles are ~64 KB each.
  **Impact:** Slower FCP on the primary mobile target.
  **Recommended solution:** Keep the tiny synchronous language-detection bootstrap, then `import()` only the matched `src/i18n/<lang>.js` bundle.
  **Acceptance criteria:** Only the active language bundle is parsed before first paint; FCP improves on a throttled mobile profile.
  **Estimated effort:** Medium · **Business value:** Medium · **Technical debt reduction:** Medium

- [ ] **Test suite is coupled to production internals and has no XR coverage** *(carried forward, partially addressed)*
  **Priority:** High
  **Category:** Testing
  **Area:** QA
  **Affected files:** [tests/e2e/app.spec.js](tests/e2e/app.spec.js), [tests/e2e/full-functionality.spec.js](tests/e2e/full-functionality.spec.js)
  **Problem:** Boot detection still reaches into `window.app.solarSystemModule.planets.earth`; `full-functionality.spec.js` monkey-patches `focusOnObject` to observe navigation. WebXR — a headline feature with the most intricate code in the repo (dolly locomotion, laser pointers, canvas-texture menu) — has zero automated coverage.
  **Impact:** Any internal rename reddens the whole suite; the riskiest subsystem is entirely unguarded.
  **Recommended solution:** Expose a minimal, versioned `window.__spaceVoyageTest` surface; add a WebXR smoke test using Chrome's WebXR device emulation (or at minimum assert `?emulate-vr` renders frames without console errors).
  **Progress:** Version assertions decoupled from hard-coded strings; two behavioural regression tests added (i18n first paint, `?planet=` shortcut).
  **Acceptance criteria:** Renaming an internal field does not break boot detection; at least one XR path is smoke-tested.
  **Estimated effort:** Medium · **Business value:** Medium · **Technical debt reduction:** High

### 🟡 Medium

- [x] **Hardcoded English strings in five user-visible places** ✅ **RESOLVED 2026-07-26**
  **Priority:** Medium
  **Category:** Bug / UX / Accessibility
  **Area:** i18n
  **Affected files:** [src/modules/UIManager.js](src/modules/UIManager.js), [src/main.js](src/main.js), [src/modules/PWAManager.js](src/modules/PWAManager.js), [src/i18n/en.js](src/i18n/en.js) *(+ nl, fr, de, es, pt)*
  **Problem:** `formatSpeed()` returned literal `'Paused'`; the FPS readout emitted `'Good'`/`'Fair'`/`'Low'`; the iOS install sheet hardcoded its title, instructions and button. All five appeared in English regardless of the selected language.
  **Impact:** Broken localisation in a product that ships six languages, including in the accessibility-motivated FPS text qualifier added by the previous review.
  **Recommended solution:** Route every one through `t()`.
  **Resolution:** Added 9 keys (`speedPaused`, `fpsGood`, `fpsFair`, `fpsLow`, `installAddToApps`, `installIosTitle`, `installIosInstructions`, `installGotIt`) to all six bundles with real translations, and imported the shared `t` in `PWAManager`.
  **Acceptance criteria:** ✅ No user-visible literal English remains in these paths; all six bundles carry the new keys.
  **Estimated effort:** Small · **Business value:** Medium · **Technical debt reduction:** Low

- [x] **Dead `window.gtag` analytics blocks** ✅ **RESOLVED 2026-07-26**
  **Priority:** Medium
  **Category:** Cleanup / Security
  **Area:** PWA
  **Affected files:** [src/modules/PWAManager.js](src/modules/PWAManager.js)
  **Problem:** Two `if (window.gtag) gtag('event', …)` blocks for `pwa_installed` / `pwa_used`. No analytics library is loaded and the CSP forbids one.
  **Impact:** Misleading — a reader reasonably concludes the app has telemetry. Dead branches that can never execute.
  **Resolution:** Both blocks removed.
  **Acceptance criteria:** ✅ No analytics references remain.
  **Estimated effort:** Small · **Business value:** Low · **Technical debt reduction:** Low

- [x] **Texture cache rebuilt bump/normal/specular canvases at the wrong size on mobile** ✅ **RESOLVED 2026-07-26**
  **Priority:** Medium
  **Category:** Bug / Performance
  **Area:** Texture pipeline
  **Affected files:** [src/modules/TextureCache.js](src/modules/TextureCache.js)
  **Problem:** `warmupTextureCache()` correctly derives the cache keys from `CONFIG.QUALITY.textureSize` (1024 on mobile, 4096 on desktop), but the canvas rebuild path guessed the dimensions with `key.includes('4096') ? 4096 : 2048`. A 1024 mobile texture was therefore drawn into a 2048×2048 canvas.
  **Impact:** 4× the canvas memory per map, on exactly the devices least able to afford it, plus an upscaled (blurrier) result.
  **Recommended solution:** Use the decoded image's own dimensions.
  **Resolution:** `const size = img.naturalWidth || textureSize;` with `canvas.height` taken from `naturalHeight`, and a comment recording the original bug.
  **Acceptance criteria:** ✅ The rebuilt canvas matches the source texture's resolution at every quality tier.
  **Estimated effort:** Small · **Business value:** Medium · **Technical debt reduction:** Low

- [x] **Locale parity fallback was a hand-maintained key list that never ran on language switch** ✅ **RESOLVED 2026-07-26**
  **Priority:** Medium
  **Category:** Bug / Cleanup
  **Area:** i18n
  **Affected files:** [src/i18n.js](src/i18n.js)
  **Problem:** `applyLocaleParityFallbacks()` iterated a hardcoded 51-entry array of Time-Machine `event*` keys across *all* languages at module load, and was not invoked by `setLanguage()`. Any key added to English but not to a translation still rendered as a raw key after a runtime language switch.
  **Impact:** Raw keys leak into the UI whenever translations lag English — the normal state during development.
  **Resolution:** Rewritten to generically copy any English key missing from the **active** language only, and now called from both `bootstrapI18n()` and `setLanguage()`. Also removed a dead top-level parity loop and a dead CommonJS `module.exports` block from what is a classic browser script.
  **Acceptance criteria:** ✅ A key present only in English renders its English text in every locale, including after a runtime switch.
  **Estimated effort:** Small · **Business value:** Medium · **Technical debt reduction:** Medium

- [ ] **Global `window` surface remains broad** *(carried forward)*
  **Priority:** Medium
  **Category:** Security / Architecture
  **Area:** Cross-module communication
  **Affected files:** [src/main.js](src/main.js), [src/modules/AudioManager.js](src/modules/AudioManager.js)
  **Problem:** `window.app`, `window.audioManager`, `window.APP_VERSION`, `window.t`, `window.applyTranslations`, `window.setLanguage`, `window.closeInfoPanel/closeHelpModal/closeSettingsModal` are all global.
  **Impact:** Any injected script gains full app control. Mitigated in practice by a strict hash-based CSP with no `unsafe-inline` in `script-src`, and by the app rendering no user-supplied HTML.
  **Recommended solution:** Document the accepted risk, keep the CSP strict, and route cross-module calls through a small `EventBus`/`CustomEvent` layer over time.
  **Acceptance criteria:** Globals are documented and minimised; `script-src` never gains `unsafe-inline`.
  **Estimated effort:** Medium · **Business value:** Low · **Technical debt reduction:** Medium

- [ ] **`ENGINEERING_REVIEW.md` is a superseded document with a future date**
  **Priority:** Medium
  **Category:** Documentation
  **Area:** Repo docs
  **Affected files:** [ENGINEERING_REVIEW.md](ENGINEERING_REVIEW.md), [SCIENTIFIC_QA_AUDIT.md](SCIENTIFIC_QA_AUDIT.md)
  **Problem:** 415 lines dated `2026-06-12` (in the future relative to the review that superseded it), describing `CACHE_VERSION 2.10.250` and Three.js `0.183.0`. It carries a SUPERSEDED banner but is still the largest doc in the repo and its findings are interleaved with resolved ones.
  **Impact:** New contributors read it as current; its stale findings get re-litigated every review cycle.
  **Recommended solution:** Fold any still-valid findings into `BACKLOG.md` and delete the file (git history preserves it), or move it to `docs/archive/`.
  **Acceptance criteria:** Exactly one document describes current engineering state; no doc carries a future date.
  **Estimated effort:** Small · **Business value:** Low · **Technical debt reduction:** Medium

- [ ] **No i18n key-parity test**
  **Priority:** Medium
  **Category:** Testing / UX
  **Area:** i18n
  **Affected files:** [tests/static-regression.spec.js](tests/static-regression.spec.js), [src/i18n/](src/i18n/)
  **Problem:** The runtime English fallback now hides missing keys instead of showing raw key names — which is correct behaviour, but it also means a missing translation is now completely invisible. Nothing reports which keys are absent from nl/fr/de/es/pt.
  **Impact:** Translation gaps accumulate silently; users see mixed-language UI with no signal to anyone.
  **Recommended solution:** Add a static test that imports all six bundles and asserts each non-English bundle's key set matches English, reporting the diff. Start it as a warning-with-allowlist if the current gap is large.
  **Acceptance criteria:** The test enumerates missing keys per locale and fails when the gap grows.
  **Estimated effort:** Small · **Business value:** Medium · **Technical debt reduction:** Medium

### 🟢 Low

- [x] **No formatting baseline — 1-space and 4-space indentation coexist** ✅ **PARTIALLY RESOLVED 2026-07-26**
  **Priority:** Low
  **Category:** Developer Experience / Technical Debt
  **Area:** Tooling
  **Affected files:** [.editorconfig](.editorconfig), [src/main.js](src/main.js), [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js)
  **Problem:** `main.js`, `utils.js` and the `solar-system/*` modules use 1-space indentation while `UIManager.js`, `i18n.js` and the tests use 4. There is no `.editorconfig`, `.prettierrc` or ESLint config, so every editor and every AI-assisted edit reintroduces drift.
  **Impact:** Noisy diffs; reviewers cannot distinguish formatting churn from behaviour change.
  **Resolution:** Added `.editorconfig` (UTF-8, LF, 4-space, 2-space for JSON/YAML) so new and edited files converge. A repo-wide reformat is deliberately *not* done here — it would bury this review's behavioural changes in a 20k-line diff.
  **Acceptance criteria:** ✅ `.editorconfig` exists and is honoured by VS Code. Remaining: a one-shot Prettier pass in its own commit, then ESLint (`no-unused-vars`, `no-undef`) in CI.
  **Estimated effort:** Small (config) / Medium (reformat) · **Business value:** Low · **Technical debt reduction:** Medium

- [ ] **No ESLint — dead code is only found by manual review**
  **Priority:** Low
  **Category:** Developer Experience / Testing
  **Area:** Tooling
  **Affected files:** [package.json](package.json)
  **Problem:** Both Critical cleanup findings in this review (Time Machine orphans, dead `gtag` branches) are exactly what `no-unused-vars` / `no-unreachable` detect automatically.
  **Impact:** Dead code accumulates between reviews and is only caught by expensive human passes.
  **Recommended solution:** Add ESLint flat config with `eslint:recommended` plus `no-unused-vars`, `no-undef` (browser + es2022 globals), run it in CI before Playwright.
  **Acceptance criteria:** `npm run lint` passes and runs in CI; unused exports are reported.
  **Estimated effort:** Medium · **Business value:** Medium · **Technical debt reduction:** High

- [ ] **No offline regression test for the app's headline claim**
  **Priority:** Low
  **Category:** Testing / Reliability
  **Area:** PWA
  **Affected files:** [tests/e2e/app.spec.js](tests/e2e/app.spec.js), [sw.js](sw.js)
  **Problem:** README claims "Works 100% offline"; the suite only asserts that a service worker registers. Nothing verifies a second load with the network disabled.
  **Impact:** The primary product promise is unverified. The cache-duplication bug fixed above degraded exactly this path and went unnoticed.
  **Recommended solution:** Load the app, wait for SW activation, `context.setOffline(true)`, reload, assert the canvas and Earth still initialise.
  **Acceptance criteria:** An offline reload boots the 3D scene with no failed requests for `./`-prefixed assets.
  **Estimated effort:** Small · **Business value:** High · **Technical debt reduction:** Low

- [ ] **Multiple `backdrop-filter: blur()` layers and a single 768px breakpoint** *(carried forward)*
  **Priority:** Low
  **Category:** UX / Performance
  **Area:** Styling
  **Affected files:** [src/styles/ui.css](src/styles/ui.css)
  **Problem:** Several stacked blurred surfaces stress low-end mobile GPUs; one breakpoint leaves a gap between small phones and large tablets.
  **Impact:** Possible jank on low-end devices; suboptimal layout at edge viewport widths.
  **Recommended solution:** Disable blur under `IS_LOW_POWER`; add an intermediate breakpoint.
  **Acceptance criteria:** Stable animation on a low-end device profile; layout holds from 320px to tablet widths.
  **Estimated effort:** Small · **Business value:** Low · **Technical debt reduction:** Low

- [ ] **`focusOnObject()` allocates per call in the navigation animation** *(carried forward)*
  **Priority:** Low
  **Category:** Performance
  **Area:** Navigation
  **Affected files:** [src/modules/solar-system/orbital-mechanics.js](src/modules/solar-system/orbital-mechanics.js)
  **Problem:** Uses several `.clone()` allocations rather than the pre-allocated scratch vectors used elsewhere in hot paths.
  **Impact:** Avoidable GC pressure during camera transitions — the moment the user is most likely to notice a hitch.
  **Recommended solution:** Reuse pre-allocated scratch vectors as the VR move path does.
  **Acceptance criteria:** No `.clone()` inside the focus animation loop.
  **Estimated effort:** Small · **Business value:** Low · **Technical debt reduction:** Low

- [ ] **Three `console.log` calls in `celestial-factory.js` / `comets-spacecraft.js` sit at column 0**
  **Priority:** Low
  **Category:** Cleanup
  **Area:** Logging
  **Affected files:** [src/modules/solar-system/celestial-factory.js](src/modules/solar-system/celestial-factory.js#L58), [src/modules/solar-system/comets-spacecraft.js](src/modules/solar-system/comets-spacecraft.js#L1312)
  **Problem:** These are DEBUG-gated but the 1-space indentation style makes the guard visually indistinguishable from unguarded logging, which is how the (false-positive) PWA logging finding arose in the previous review.
  **Impact:** Wasted review cycles re-verifying the same lines.
  **Recommended solution:** Resolved naturally by the Prettier pass above.
  **Acceptance criteria:** Every `console.*` call is visibly nested inside its `DEBUG` guard.
  **Estimated effort:** Small · **Business value:** Low · **Technical debt reduction:** Low

### Backlog Summary (2026-07-26 review)

| Priority | Added | Resolved in this review | Left open |
|---|---:|---:|---:|
| 🔴 Critical | 5 | 5 | 0 |
| 🟠 High | 7 | 3 | 4 |
| 🟡 Medium | 7 | 4 | 3 |
| 🟢 Low | 6 | 1 | 5 |
| **Total** | **25** | **13** | **12** |

**Verification:** `npx playwright test --project=desktop-chromium` — all specs pass at `2.10.311`, including the two new regression tests.

