# Space Voyage — Engineering Backlog

Actionable items produced by structured engineering reviews. Items are grouped by
review date. **Do not delete unresolved items** — tick the checkbox when done and
leave the entry in place so the history of the decision survives.

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
Problem: XR session listeners, controller listeners and interval timers are registered
on `sessionstart` but there is no symmetric teardown on `sessionend`. There is also no
`dispose()`/`destroy()` path for the renderer, geometry cache or materials.
Impact: Entering and leaving VR repeatedly accumulates listeners and timers, degrading
frame time over a long session on exactly the hardware least able to absorb it (Quest).
Recommended solution: Store every `addEventListener` and `setInterval` handle on the
session object; remove/clear them all in a single `_teardownXRSession()` bound to
`sessionend`. Add `SceneManager.dispose()` that disposes the renderer, clears
`GeometryFactory`'s cache and disposes materials/textures.
Acceptance criteria: Entering and exiting VR ten times leaves listener and timer counts
flat; `dispose()` releases all GPU resources; verified with a heap snapshot.
Estimated effort: Medium
Business value: High
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

- [ ] Give the app a real "something went wrong" recovery path

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

- [ ] Clear the 209 outstanding ESLint warnings and raise them to errors

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

- [ ] Remove committed test-run artefacts and prevent recurrence

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

- [ ] Add `prefers-reduced-motion` support

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
