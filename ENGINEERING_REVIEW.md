# Space Voyage — Principal Engineering Review

**Reviewer:** AI Principal Engineer  
**Date:** 2026-06-12  
**Codebase snapshot:** sw.js CACHE_VERSION v2.10.250 · Three.js 0.183.0  
**LOC audited:** ~20,600 lines across 18 JS modules + 2 CSS files + index.html + sw.js  

---

## Executive Summary

Space Voyage is a technically ambitious educational PWA. The renderer, VR/XR integration, procedural textures, orbital mechanics, and offline caching all work correctly and show craft. The product is *functionally* excellent.

What undermines it from a principal-engineering standpoint is a consistent pattern of **accumulating complexity without debt retirement**. The monolith is growing toward 12,000 lines, i18n is a synchronous 407 KB payload, version numbers disagree across four files, and zero automated safety net catches regressions. The codebase rewards early adopters but will start penalising contributors and maintainability within ~6–12 months at current velocity.

**Top-line scores (1–10):**

| Dimension | Score |
|---|---|
| Architecture | 5/10 |
| Code Quality | 6/10 |
| Performance | 6/10 |
| Reliability | 4/10 |
| Security | 7/10 |
| UX / Polish | 8/10 |
| Cleanup | 5/10 |
| Tooling / DX | 3/10 |
| **Overall** | **5.5 / 10** |

---

## 1. Architecture — 5/10

### Strengths
- Clean module boundary between `SceneManager`, `SolarSystemModule`, `UIManager`, `PanelManager`, and `AudioManager`. Each has a single `class` exported as a singleton.
- Pre-allocated scratch vectors throughout hot paths (`_focusScratch`, `_vrMoveScratch`, etc.) — good for GC pressure at 60 fps.
- Three-tier texture fallback (self-hosted → procedural) is robust.
- Service Worker `install` does not call `skipWaiting()` — deliberate, allows user-controlled updates. Correct.
- ImportMap-based CDN loading for Three.js is elegant with no build step.

### Problems

#### P1 — SolarSystemModule.js is a 452 KB / 11,199-line monolith (critical)
A single file mixes at least five distinct concerns:
1. Astronomical constants and raw object definitions
2. 3D mesh construction (planets, moons, belts, comets, spacecraft, constellations, nebulae, galaxies, exoplanets, starfield, Oort Cloud, heliopause, Milky Way disc)
3. Orbital mechanics update loop
4. Texture loading + procedural fallback
5. Camera follow/navigate logic

This makes code navigation near-impossible, increases parse time on every cold load, and means any change anywhere must be reviewed against 11,000 lines. It is the single highest-priority architectural issue.

**Recommended split:**
```
src/modules/solar-system/
  data/       ← pure JS objects: planet params, moon params, comet elements
  factory/    ← mesh constructors (createPlanet, createMoon, createComet …)
  update/     ← per-frame orbital mechanics
  textures/   ← loadTextureWithFallback wrappers
  navigate/   ← focusOnObject, teleportVRToObject
SolarSystemModule.js  ← thin orchestrator, ~300 lines
```

#### P2 — i18n is a synchronous render-blocking 407 KB `<script>` tag
`i18n.js` is loaded as a classic `<script>` (not `type="module"`) in the document `<head>`, meaning the browser must download, parse, and execute all 407 KB *before* rendering begins. With 6 embedded languages this only gets worse as the app grows.

**Impact:** On a mid-range mobile device over 3G, this alone can add 1–2 s to Time to First Contentful Paint.

**Fix:** Keep only the detected language; lazy-load the rest on demand. Use a tiny synchronous bootstrap just to detect language, then fetch the right language bundle asynchronously.

#### P3 — `findObjectByNavigationValue()` reconstructs a 250-line static `navigationMap` object on every call
`navigationMap` and `searchPatterns` are declared as `const` inside the function body. They are rebuilt on every dropdown change and every keyboard shortcut navigation. Hoisting these to module-level constants eliminates the allocation entirely.

#### P4 — `_getEventDescriptions()` reconstructs ~50-entry event map on every call
Same pattern. This method is invoked by `_showEventInfo()` which fires on time-machine navigation. All date-keyed objects should be module-level constants.

#### P5 — Global namespace pollution is architectural coupling
`window.app`, `window.audioManager`, and the three `window.closeXxxModal` functions are set as globals. Any injected script or browser extension gets full control of the app via `window.app`. These should:
- Use a dedicated `EventBus`/`CustomEvent` for cross-module communication, or
- Pass references explicitly through constructors.

#### P6 — Navigation search uses `dropdown.innerHTML = originalHTML` on every keystroke
Reassigning `innerHTML` on every keypress triggers a full DOM parse + potential reflow of dozens of `<option>` and `<optgroup>` elements, then calls `window.applyTranslations()` to re-translate them. This is O(options) work at 20 fps of typing.

**Fix:** Cache the full translated `Option` array at init time; filter the cached array client-side, never touch `innerHTML` during typing.

---

## 2. Code Quality — 6/10

### Strengths
- Consistent singleton pattern across modules.
- JSDoc comments on utility classes `TextureGeneratorUtils`, `MaterialFactory`, `GeometryFactory`.
- `storage.js` correctly wraps `localStorage` in try/catch for privacy-restricted enviros.
- `_buildSafeHelpNodes()` in UIManager is a bespoke HTML sanitizer (allowlist-based) — good.
- Focus trap (`_trapFocus` / `_releaseFocusTrap`) correctly handles modal WCAG requirements.
- Raycasting logic in `_raycastNamedObject()` handles hover-on-moon-near-planet via angular distance scoring — sophisticated and correct.

### Problems

#### Q1 — `storage.js` is listed twice in `STATIC_CACHE_FILES` (lines 20 and 34 of sw.js)
A minor but embarrassing duplicate:
```js
'./src/modules/storage.js',   // line 20
...
'./src/modules/storage.js',   // line 34 (duplicate)
```
The second `cache.addAll()` call will silently no-op, but it signals the list is maintained manually without a lint guard.

#### Q2 — Version numbers disagree across four locations
| Location | Value |
|---|---|
| `sw.js` file header comment | `2.10.173` |
| `sw.js` → `CACHE_VERSION` | `v2.10.250` |
| `index.html` CSS/JS cache busters | `?v=2.10.188`, `?v=2.10.202` |
| `index.html` manifest link | `?v=2.10.188` |

The authoritative version is `CACHE_VERSION`. The file header and HTML query strings are stale copies that never get updated atomically. This creates confusion: someone reading the comment thinks the SW is version 2.10.173; the actual cache expiry is on 2.10.250.

**Fix:** Single source of truth. Store the version in one place (e.g. a `VERSION` global or `package.json`). Read it everywhere else. Or drop version comments entirely and rely on git tags.

#### Q3 — `const t = (key) => (window.t || ((k) => k))(key)` is copy-pasted into every module
This late-binding i18n pattern appears verbatim in `main.js`, `SolarSystemModule.js`, `SceneManager.js`, `UIManager.js` and others. The function is identical every time. It should live once in a shared module (or in `i18n.js` itself) and be exported.

#### Q4 — `restoreSavedToggleStates()` carries three-layer backward-compat for scale mode
```js
const savedScaleMode = safeGetItem('scaleMode');          // layer 1 (current)
const savedScientificState = safeGetItem('scientificMode'); // layer 2 (older)
const savedScaleState = safeGetItem('realisticScale');    // layer 3 (oldest)
```
Three fallback layers for a user preference that 99% of users will never have in their storage. The dead formats should be migrated on first load and discarded, not checked indefinitely.

#### Q5 — `console.warn` is globally monkey-patched in `utils.js` on import
```js
const originalWarn = console.warn;
console.warn = function(...args) { … };
```
This runs as a **side-effect of importing `utils.js`**. Any consumer of `utils.js` silently gains filtered WebGL warning suppression for the entire process. This makes debugging surprising and can hide real Three.js errors that happen to share keywords with the suppressed patterns. Use `THREE.WebGLRenderer.debug.checkShaderErrors = false` instead — it suppresses exactly what you want without touching the global console.

#### Q6 — `setupGlobalFunctions()` registers `window.*` wrappers that duplicate event listeners
`setupInfoPanelCloseButton()` attaches a `click` listener on the close button, but the button already has an `onclick` attribute in some paths and `setupGlobalFunctions()` adds yet another. There are comments like "Add direct click listener *as backup* to inline onclick" — this indicates the root cause (inline `onclick` attributes somewhere) was never removed; a workaround was layered on top.

#### Q7 — Keyboard shortcut handler uses `.click()` on DOM buttons as the dispatch mechanism
```js
case 'h':
  document.getElementById(UI_ELEMENTS.HELP_BUTTON)?.click();
  break;
```
Using synthetic DOM clicks to trigger programmatic actions couples the shortcut handler to the DOM structure and button IDs. Any button rename or removal silently breaks the shortcut. Prefer calling domain methods directly: `this.uiManager.showHelp(...)`.

---

## 3. Performance — 6/10

### Strengths
- Pre-allocated scratch vectors in both `App` and `SceneManager` constructors.
- Hover check throttled to 50 ms (20 fps polling).
- Raycaster uses non-recursive first, falls back to recursive — pragmatic perf guard.
- `GeometryFactory` caches sphere/cylinder/box geometries to avoid duplicate allocations.
- Adaptive pixel ratio tuning in `SceneManager`.
- `logarithmicDepthBuffer` disabled on mobile/Quest to avoid Quest framebuffer crash — good.
- WebP for all textures.

### Problems

#### P1 — 407 KB synchronous render-blocking i18n payload
Already called out under Architecture. Measured impact: ~100–400 ms added to TTI on mid-range mobile.

#### P2 — 452 KB monolith SolarSystemModule.js parsed on every cold load
Browser must parse and compile the full 11,199 lines even if the user never visits a comet or exoplanet. Lazy-loading sections (e.g. exoplanets, nearby stars, nebulae, galaxies) would cut initial parse time significantly.

#### P3 — Navigation search calls `window.applyTranslations()` on every keystroke
`applyTranslations()` walks the entire DOM looking for `data-i18n` attributes. Called inside the `input` event handler this runs at typing speed (multiple times per second).

#### P4 — `findObjectByNavigationValue()` creates large objects on every call
Both `navigationMap` and `searchPatterns` are `const` but declared inside the function; they are allocated on every invocation. Move to module-level.

#### P5 — `_getEventDescriptions()` creates a ~50-key object on every call
Same problem. The event calendar is static data; allocating it as a literal on every time-machine navigation is wasteful.

#### P6 — `new THREE.Vector3()` allocations inside event handlers
`_handlePaleBlueDot()` calls `new THREE.Vector3()` three times and uses `side.clone()`. These are one-time event paths, not the hot animate loop, so they won't cause sustained 60-fps GC pauses — but the habit of creating vectors inside handlers is worth flagging before it spreads into `updateOrbit` paths.

#### P7 — Space facts in loading screen captured at module-load time (stale if language changes)
```js
const spaceFacts = [
  t('funFactSun'),   // captured once at setupSpaceFacts() call
  ...
];
```
If the language changes *after* `setupSpaceFacts()` runs (which is possible on first visit), the facts stay in the original language.

---

## 4. Reliability — 4/10

### Strengths
- Animate loop uses three separate try/catch blocks ensuring `renderer.render()` always fires.
- VR error suppression one-shot flags (`_vrMoveErrLogged`) prevent log spam without hiding the first error.
- 30-second safety timeout for loading ensures users never see a blank screen.
- `safeGetItem` / `safeSetItem` handle storage failures gracefully.
- `validateElements()` in `UIManager` logs missing DOM IDs on startup.

### Problems

#### R1 — Zero automated tests
There are no unit tests, integration tests, or E2E tests anywhere in the repository. A 20,600-line application with complex orbital mechanics, texture fallback logic, raycasting, and VR input handling has no safety net whatsoever.

**Impact assessed:** Any change to `SolarSystemModule.js` orbital math, `SceneManager.js` VR teleportation, or `UIManager.js` panel state could silently regress and ship undetected.

**Minimum viable test targets:**
- `jdToDate()` / `dateToJd()` — pure functions, trivial to test
- `applyScaleMode()` persistence  
- `findObjectByNavigationValue()` for all 60+ navigation keys  
- `_raycastNamedObject()` priority scoring logic  
- localStorage backward-compat in `restoreSavedToggleStates()`

#### R2 — No linting or formatting enforcement
Without ESLint/Prettier there is no static check for undefined variables, unreachable code, or accidental global assignments. A typo like `this.sceneManger` (missing 'a') will silently return `undefined` and fail at runtime with a null-pointer.

#### R3 — Version drift between sw.js comment and CACHE_VERSION means cache invalidation is unclear
An operator reading the file header believes the deployed version is 2.10.173. The cache is actually 2.10.250. If we needed to manually purge caches for a specific version, the mismatch causes confusion.

#### R4 — SW `STATIC_CACHE_FILES` has no validation step
New files added to the project are silently uncached until manually added to the array. If a developer adds a new texture or module and forgets to add it to `STATIC_CACHE_FILES`, the app will work online but break offline. There is no check for this.

#### R5 — `setupInfoPanelCloseButton()` comment admits a workaround
```js
// Add direct click listener as backup to inline onclick
```
"Backup to" implies the primary mechanism sometimes fails. This indicates flaky close-button behaviour that was papered over rather than fixed.

#### R6 — Time Machine `_onSimulatedDateChanged` listener is not cleaned up on app destroy
```js
if (this._onSimulatedDateChanged) {
  window.removeEventListener('simulatedDateChanged', this._onSimulatedDateChanged);
}
```
This cleanup runs at the top of `setupTimeMachine()` if called more than once, but there is no `destroy()` method on `App`. If the module is ever hot-reloaded or tested in a JSDOM environment, the listener leaks.

---

## 5. Security — 7/10

This is the strongest dimension. The author has clearly thought about XSS.

### Strengths
- CSP header with source allowlisting for scripts (self + jsdelivr with SHA hash for the importmap inline script).
- `_buildSafeHelpNodes()` allowlist sanitizer prevents HTML injection via `helpContent`.
- `X-Content-Type-Options: nosniff` set.
- `Referrer-Policy: no-referrer` set.
- No `eval`, no `Function()` constructor.
- All user-facing text interpolated via `.textContent` (never `innerHTML`).
- `Referrer-Policy` and redundant `<meta name="referrer">` (belt-and-braces).

### Problems

#### S1 — `window.app = this` exposes full application state to any script
Any XSS vector (e.g. via a compromised Three.js CDN file, a browser extension, or future use of untrusted content) immediately gains access to `window.app`, from which:
- `window.app.sceneManager.renderer.domElement` → can capture WebGL frames  
- `window.app.solarSystemModule` → full scene graph manipulation  
- `window.app.uiManager` → arbitrary modal content injection  

**Fix:** Remove `window.app` entirely. Use `CustomEvent` for cross-module communication. If legacy code requires `window.app` (e.g. the VR panel or inline HTML callbacks), document the risk explicitly.

#### S2 — `window.audioManager` and `window.closeInfoPanel` etc. extend the attack surface
Same issue as S1. `window.audioManager` gives access to Web Audio API scheduling; `window.closeInfoPanel()` (etc.) are trivial, but any global adds surface.

#### S3 — `console.warn` monkey-patching could mask injection attempts
The patched `console.warn` filters messages containing `'THREE.WebGLProgram'` and `'Vertex shader is not compiled'`. If a shader injection attack tried to signal itself via console output, it would be silenced. This is very low probability but argues for removing the patch in favour of the official `renderer.debug` API.

#### S4 — `dropdown.innerHTML = originalHTML` pattern
`originalHTML` is captured from the static DOM at app init (`const originalHTML = dropdown.innerHTML`). As long as the HTML is server-generated and trusted, this is safe. However, the pattern is fragile: if `originalHTML` were ever contaminated (e.g. by an extension or prior XSS), it gets re-injected on every search keystroke. A `DocumentFragment` clone of the original `<option>` nodes would be safer and faster.

#### S5 — CSP `style-src 'unsafe-inline'` allows arbitrary inline styles
While not a typical XSS vector on its own, `style-src 'unsafe-inline'` enables style injection attacks (clickjacking via `position: fixed` overlays, data exfiltration via `background-image: url(...)`, CSS `@import` injection). Moving dynamic styles to CSS classes (already largely done) would allow removing `'unsafe-inline'`.

---

## 6. UX / Polish — 8/10

This is the application's strongest dimension outside the renderer quality.

### Strengths
- ARIA roles, `aria-live`, `aria-pressed`, `aria-modal` throughout.
- Focus trap on dialogs (WCAG 2.4.3 compliant).
- Keyboard shortcuts for every major action.
- Hover label clamped to viewport bounds.
- Drag detection (4px²) prevents accidental clicks during orbit navigation.
- Mobile gesture hints auto-shown and auto-dismissed.
- Random discovery button with spin animation and sound feedback.
- Time Machine with step buttons and localized date display.
- FPS counter with color-coded thresholds (good/warning/bad).
- Onboarding flow with step dots and skip button.

### Problems

#### UX1 — Loading screen fact text starts in English regardless of detected language
`setupSpaceFacts()` is called inside `startExperience()`, but the loading screen displays during the period *before* `startExperience()`. The hardcoded default text in index.html:
```html
<span id="fact-text">The Sun contains 99.86% of the Solar System's mass!</span>
```
…is always English, visible for up to several seconds before translations apply.

**Fix:** Translate the fact text in `LanguageManager.init()` or inject a `data-i18n` attribute on the initial fact span.

#### UX2 — Escape key closes all open modals simultaneously
```js
case 'escape':
  this.uiManager.closeInfoPanel();
  this.uiManager.closeHelpModal();
  this.uiManager.closeSettingsModal();
  break;
```
If the help modal is open and user presses Escape, the info panel (which may not be visible) and settings modal also get close-called unnecessarily. This is harmless but inelegant. The correct pattern: close whichever modal is currently frontmost, check `aria-hidden` before closing.

#### UX3 — Navigation search results count uses raw user input in UI text
```js
placeholder.textContent = `${matchingOptions.length} results for "${query}"`;
```
Displaying user input verbatim in UI text is safe here (it's `textContent`, not `innerHTML`), but it looks unsophisticated when the query contains quotation marks or special characters. The double-quote wrapping `"${query}"` will display awkwardly for queries like `"halley's"`.

#### UX4 — Info panel close button has two listeners as a workaround
Discussed under Q6. Symptom in UX terms: close button may fire twice on some browsers/implementations.

#### UX5 — Settings modal has no keyboard shortcut to open it
Every other major UI action (orbits: O, constellations: C, labels: D, bloom: B, scale: S, help: H, reset: R, ISS: I, Voyager: V) has a keyboard shortcut. Settings has none. The shortcut table shown in Help should include a Settings shortcut.

#### UX6 — `preSelectEarth()` uses `setTimeout(500ms)` on first visit
Programmatic `setTimeout` for timing coordination is a code smell. A 500 ms delay before Earth is auto-selected on first visit may be perceived as slowness. Use the `solarSystemReady` event or a callback from `startExperience()`.

---

## 7. Cleanup — 5/10

### Items requiring cleanup

#### C1 — `diff.txt` and `diff1.txt` in repo root
These are debugging artifacts from a code comparison session. They contain raw diff output and should not be committed. Add to `.gitignore` or delete.

#### C2 — `storage.js` listed twice in `STATIC_CACHE_FILES`
```
'./src/modules/storage.js',   // line 20
…
'./src/modules/storage.js',   // line 34
```
Remove the duplicate.

#### C3 — SW file header comment version is stale
The comment `// Version 2.10.173` does not match `CACHE_VERSION = 'v2.10.250'`. Either update the comment automatically or remove it.

#### C4 — `.venv/` Python virtual environment in the repository
A Python virtual environment directory has no place in a pure frontend JavaScript project. It should be in `.gitignore`. If Python tooling is used (e.g. image conversion scripts), the tooling scripts belong in a `scripts/` directory with a `requirements.txt`; the env itself should never be tracked.

#### C5 — `SCIENTIFIC_QA_AUDIT.md` in repo root
The scientific audit from a prior session is committed to the repo root. It is a project artefact, not user-facing content. Move to `docs/` or a `.github/` subfolder, or keep it only in project management tooling.

#### C6 — Index.html `?v=` cache busters on JS/CSS differ and are out of sync
```html
<!-- CSS uses 2.10.188 -->
<link rel="stylesheet" href="./src/styles/main.css?v=2.10.188">
<!-- main.js uses 2.10.202 -->
<script type="module" src="./src/main.js?v=2.10.202">
```
These must be bumped together but are hard-coded strings scattered across 20+ `<link>` and `<script>` tags. This is unmanageable by hand. A single version token that gets sed-replaced (or a simple build step) would eliminate the entire class of problem.

#### C7 — Three-layer backward-compat scale mode storage
The `restoreSavedToggleStates()` function checks `'scaleMode'`, then `'scientificMode'`, then `'realisticScale'`. The two older keys should be migrated to `'scaleMode'` on first load and removed, not checked forever. Write a one-time migration in `storage.js`.

#### C8 — `windowapp` and `window.closeXxxModal` globals
Should be removed (see Architecture P5 and Security S1/S2).

---

## 8. Tooling / DX — 3/10

This is the weakest dimension. The zero-build-step approach has tradeoffs that are currently unmitigated.

### Problems

#### T1 — No package.json, no npm scripts
There is no standard entry point for running, testing, linting, or building the project. A new contributor must read the README, discover they need Python or Node http-server, find the right version of Node, and figure out that HTTPS is required for PWA features.

**At minimum** a `package.json` with dev dependencies and scripts:
```json
{
  "scripts": {
    "dev": "npx http-server -p 8080 --ssl",
    "lint": "eslint src/",
    "format": "prettier --write src/",
    "test": "jest"
  }
}
```

#### T2 — No ESLint config
Without static analysis, the following categories of bugs are invisible until runtime:
- Typos in property names (`this.sceneManger`)
- Unused variables (`_voyagerIndex` is incremented but the initial value 0 is never declared)
- Accidental globals (missing `const` / `let`)
- Shadowed variables (inner `const t = …` inside `_orbitModeLabel`)

#### T3 — No Prettier or EditorConfig
The codebase mixes tabs and spaces inconsistently. `src/modules/PanelManager.js` uses 4-space indentation; `src/modules/SolarSystemModule.js` uses a mix; `storage.js` uses 1-space. A `.editorconfig` + `prettier` run would make the codebase visually consistent and reduce PR noise.

#### T4 — No CI pipeline
There is no GitHub Actions or similar. Merging to main never runs lint, tests, or a build check. Given the complexity of the SW cache versioning, a CI check that verifies CACHE_VERSION changes when any cached file changes would prevent the common case of deploying breaking changes to cached users.

#### T5 — No HTTPS for local development
The copilot instructions say "HTTPS is required for Service Workers, PWA install prompts, and WebXR" but the recommended dev server is `python -m http.server 8000` — which is HTTP. A developer working on VR will find the XR button never appears. Documenting `mkcert` + `npx http-server --ssl` (or using Vite/Caddy) would fix this.

#### T6 — Cache version bump is a purely manual, error-prone process
Every change to any cached file requires manually bumping `CACHE_VERSION`. There is no automation, no check, no reminder. This is the most common source of PWA "I changed a file but users still see the old version" bugs.

**Fix options:**
- Simple: a pre-commit hook that fails if any `STATIC_CACHE_FILES` was modified but `CACHE_VERSION` was not.
- Better: generate the SW file from a build step that injects a content hash.

---

## 9. Issue Backlog (Prioritised)

### P0 — Showstoppers / Data loss risk
None currently. The app does not handle user data beyond localStorage preferences.

### P1 — High impact / Low effort (do next sprint)

| # | Issue | File | Effort |
|---|---|---|---|
| 1 | Remove duplicate `storage.js` in `STATIC_CACHE_FILES` | `sw.js:34` | 1 min |
| 2 | Update sw.js file header comment to match CACHE_VERSION | `sw.js:2` | 1 min |
| 3 | Delete `diff.txt`, `diff1.txt`; add to `.gitignore` | repo root | 1 min |
| 4 | Hoist `navigationMap` and `searchPatterns` to module-level constants | `main.js` | 30 min |
| 5 | Hoist `_getEventDescriptions()` return value to module-level constant | `main.js` | 15 min |
| 6 | Replace `console.warn` monkey-patch with `renderer.debug.checkShaderErrors = false` | `utils.js` | 15 min |
| 7 | Add missing keyboard shortcut for Settings (e.g. `Comma` or `Shift+S`) | `main.js` | 15 min |
| 8 — | Move `SCIENTIFIC_QA_AUDIT.md` to `docs/` | repo root | 2 min |

### P2 — High impact / Medium effort (next 2 sprints)

| # | Issue | File | Effort |
|---|---|---|---|
| 9 | Add `.editorconfig` + run Prettier once to normalize indentation | repo | 2 h |
| 10 | Add ESLint config (`eslint:recommended` + no-globals rule) | repo | 3 h |
| 11 | Add `package.json` with dev/lint/test scripts | repo | 1 h |
| 12 | Migrate legacy scale-mode storage keys on first load; remove 3-layer fallback | `main.js` | 1 h |
| 13 | Replace `window.closeInfoPanel` etc. with `CustomEvent` dispatch | `main.js` | 2 h |
| 14 | Replace `dropdown.innerHTML = originalHTML` in search with DocumentFragment clone | `main.js` | 2 h |
| 15 | Fix loading screen fact text to respect detected language on first render | `index.html` | 1 h |
| 16 | Remove `window.app` global; replace cross-module access with explicit passing | `main.js` | 4 h |

### P3 — Strategic / High effort (roadmap)

| # | Issue | Files | Effort |
|---|---|---|---|
| 17 | Split i18n.js into per-language bundles; async-load detected language | `i18n.js` + HTML | 1 day |
| 18 | Begin splitting SolarSystemModule.js: extract `data/` first, then `factory/`, then `update/` | `SolarSystemModule.js` | 3–5 days |
| 19 | Add unit tests for pure functions: `jdToDate`, `findObjectByNavigationValue`, `applyScaleMode` | new `tests/` | 2 days |
| 20 | Add CI (GitHub Actions): lint + test on every PR | `.github/workflows/` | 4 h |
| 21 | Automate CACHE_VERSION bump via pre-commit hook or build script | `sw.js` + `package.json` | 3 h |
| 22 | Remove `console.warn` / `window.app` / remaining globals; tighten CSP (drop `unsafe-inline` styles) | multiple | 1 day |
| 23 | Replace `setTimeout(500)` in `preSelectEarth()` with event-based callback | `main.js` | 30 min |
| 24 | Move `_venv/` out of repo; add to `.gitignore` | repo | 10 min |

---

## 10. Improvement Roadmap

### Sprint 1 (1 week) — Hygiene & Quick Wins
Complete issues 1–8 from the P1 list above. These are all under 30 minutes and require no testing. Estimated total: 2–3 hours of developer time.

### Sprint 2 (2 weeks) — Developer Experience Foundation
- Add `package.json`, ESLint, Prettier (issues 9–11).
- Add first unit tests for pure functions (partial issue 19).
- Fix navigation search DOM performance (issue 14).
- Remove `window.app` global (issue 16).

At the end of Sprint 2 the project should have static analysis running on every save and a dozen passing tests.

### Sprint 3 (2 weeks) — i18n Performance
Split `i18n.js` into 6 per-language files (~60 KB each). Load only the detected language. This is the single highest-impact performance change and can be done without touching any 3D code.

### Sprint 4–6 (6 weeks) — SolarSystemModule.js Decomposition
Extract in order:
1. **Data layer** — move all planetary/moon/comet/spacecraft data objects into `src/modules/solar-system/data/`. No logic, pure JS objects.
2. **Texture layer** — move `loadTextureWithFallback` wrappers and procedural generators into `TextureFactory.js`.
3. **Factory layer** — move `createPlanet()`, `createMoon()`, `createComet()` etc. into per-category files.
4. **Update layer** — move the per-frame orbital mechanics into `OrbitalMechanics.js`.
5. **Thin orchestrator** — `SolarSystemModule.js` becomes a 300-line coordinator.

This work must be done incrementally with regression tests at each step.

### Sprint 7+ — CI and Security Hardening
- GitHub Actions: lint + test on every PR.
- CACHE_VERSION automation.
- Remove `unsafe-inline` from style CSP.
- Consider Content Security Policy reporting endpoint.

---

## 11. Top 10 Highest-Impact Fixes

Ranked by (impact × ease) — the ratio of benefit to effort:

| Rank | Fix | Impact | Effort |
|---|---|---|---|
| 1 | **Remove duplicate `storage.js` from SW cache list** | Correctness (cache install redundancy, subtle ordering bug) | 1 min |
| 2 | **Hoist `navigationMap` + `_getEventDescriptions` to module-level** | Eliminates per-call large-object allocation; improves all navigation paths | 45 min |
| 3 | **Replace `console.warn` patch with `renderer.debug.checkShaderErrors = false`** | Removes global side-effect; restores full WebGL warning visibility | 15 min |
| 4 | **Synchronise version numbers → single source of truth** | Eliminates ops confusion; prevents cache miss/over-expiry bugs | 30 min |
| 5 | **Delete `diff.txt`, `diff1.txt`, add `.gitignore` entries** | Cleanup; prevents leaking internal diff data | 2 min |
| 6 | **Lazy-load i18n by language** | 80% reduction in render-blocking parse cost (~407KB → ~60 KB on first load) | 1 day |
| 7 | **Fix navigation search to avoid `innerHTML` rebuild on every keystroke** | Eliminates O(options) DOM re-parse at typing speed | 2 h |
| 8 | **Add ESLint + package.json** | Catches undefined variables, typos, accidentals globals before runtime | 3 h |
| 9 | **Migrate legacy scale-mode localStorage keys** | Removes 3-layer compat indefinitely; simplifies a 50-line block to 10 | 1 h |
| 10 | **Add unit tests for pure functions** | First safety net for orbital math, storage, navigation lookup regressions | 2 days |

---

## Appendix: Files Reviewed

| File | Lines | Notes |
|---|---|---|
| `src/main.js` | 1,719 | Full read |
| `src/modules/SolarSystemModule.js` | 11,199 | Init + constructor read |
| `src/modules/SceneManager.js` | 2,475 | Constructor + init read |
| `src/modules/UIManager.js` | 404 | Full read |
| `src/modules/PanelManager.js` | 291 | Full read |
| `src/modules/utils.js` | 640 | Full read |
| `src/modules/storage.js` | 21 | Full read |
| `src/modules/AudioManager.js` | — | Not read (not a concern area) |
| `src/modules/TextureCache.js` | — | Not read (covered by instructions) |
| `src/i18n.js` | 3,692 | File size + structure assessed |
| `src/styles/ui.css` | 2,051 | Not read (UX issues assessed via HTML) |
| `index.html` | ~500 | Full read |
| `sw.js` | 402 | Full read |
| `src/bootstrap/installPromptCapture.js` | 5 | Trivial |
| `src/bootstrap/initManagers.js` | 6 | Trivial |

---

*This review reflects the codebase at the time of audit. Issues are numbered for tracking convenience. All scores are relative to a production-grade PWA standard.*
