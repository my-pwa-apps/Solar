# Space Voyage - Product & Engineering Backlog

This backlog has been aggregated from the comprehensive pre-deployment review, engineering audit, and scientific QA audit of the Solar System PWA app.

## Summary

| Priority | Count |
|---|---:|
| Critical | 0 |
| High | 5 |
| Medium | 6 |
| Low | 4 |

---

## 🔴 Critical Issues

*No current critical blockages or data-loss risks.*

---

## 🟠 High Priority Issues

- [ ] [Priority: High]
  **Area:** Refactor
  **File(s):** [src/modules/SolarSystemModule.js](src/modules/SolarSystemModule.js)
  **Issue:** Monolithic architecture with more than 11,000 lines combining orbital computation, definitions, scene graph manipulation, and loaders.
  **Impact:** Extremely high maintenance risk, long file parsing times, and risk of regressions.
  **Suggested fix:** Split the module into specialized files under a modular directory pattern like `src/modules/solar-system/` covering physical data, geometry/mesh construction, orbital mechanics, texturing, and travel navigation.
  **Acceptance criteria:** [src/modules/SolarSystemModule.js](src/modules/SolarSystemModule.js) is under 500 lines and acts solely as a central coordinator.

- [ ] [Priority: High]
  **Area:** Performance
  **File(s):** [src/i18n.js](src/i18n.js)
  **Issue:** The huge 407 KB i18n dictionary is a render-blocking synchronous link in the document `<head>`, dramatically slowing down first paint.
  **Impact:** Degrades First Contentful Paint (FCP) and Time to Interactive (TTI), particularly on mobile or offline devices.
  **Suggested fix:** Create a tiny bootstrap vocabulary for language routing, then load the primary language dictionary asynchronously.
  **Acceptance criteria:** Language choices are loaded on-demand, reducing initial Head payload from 400KB+ to less than 20KB for routing.

- [ ] [Priority: High]
  **Area:** Scientific Accuracy
  **File(s):** [src/modules/SolarSystemModule.js](src/modules/SolarSystemModule.js#L10528)
  **Issue:** Comet Y-position calculations are hardcoded to a fixed sinusoidal amplitude of 15, neglecting actual orbital inclinations to the ecliptic plane.
  **Impact:** Causes scientifically inaccurate representations of highly inclined comets (e.g., Comet Hale-Bopp has near-polar inclinations of 89.4° while Encke is only 11.8°).
  **Suggested fix:** Add real `inclination` properties directly inside `cometsData` and calculate 3D component coordinates using real inclination values.
  **Acceptance criteria:** Comets reflect their true orbital plane slopes relative to the solar ecliptic.

- [ ] [Priority: High]
  **Area:** Business Logic / Scientific Accuracy
  **File(s):** [src/i18n.js](src/i18n.js#L262)
  **Issue:** The fun fact claim that Jupiter's gravity strictly acts as a shield protecting Earth from comets/asteroids is disputed by modern astrophysical simulations.
  **Impact:** Spreads inaccurate or outdated simplified science to users.
  **Suggested fix:** Soften the wording to explain that Jupiter's massive gravity deflects some threats but directs others inward.
  **Acceptance criteria:** Text is updated in [src/i18n.js](src/i18n.js) across all supported translation tables.

- [ ] [Priority: High]
  **Area:** Business Logic / Scientific Accuracy
  **File(s):** [src/i18n.js](src/i18n.js#L391)
  **Issue:** Voyager 1 and Voyager 2 distance descriptions contain static hardcoded km and AU estimates which are stale compared to real position dynamics computed in the model.
  **Impact:** Displays contradictory values between the dynamic simulation panel and the static textual summary descriptions.
  **Suggested fix:** Inject live distance values calculated by `PROBE_TRAJECTORIES` dynamically into description template binders or append dated boundaries explicitly (e.g. "As of early 2025...").
  **Acceptance criteria:** Voyager descriptions references and simulation metrics matches to within 1 AU.

---

## 🟡 Medium Priority Issues

- [ ] [Priority: Medium]
  **Area:** Security
  **File(s):** [src/main.js](src/main.js)
  **Issue:** Exposing the main class instance directly on the global `window.app` object pollutes global namespaces and creates potential XSS attack surfaces.
  **Impact:** Client-side exploits or malicious browser scripts could easily control the entire WebGL rendering pipeline or manipulate DOM elements.
  **Suggested fix:** Remove the global application bindings and implement custom event triggers or modular interface parameters for communications.
  **Acceptance criteria:** Global `window.app` is eliminated, and modules communicate purely via exports or event dispatchers.

- [ ] [Priority: Medium]
  **Area:** UX / Correctness
  **File(s):** [src/main.js](src/main.js)
  **Issue:** `preSelectEarth()` uses a hardcoded 500ms timeout mechanism during initialization to run UI camera motions.
  **Impact:** Creates race conditions on slower devices and causes visual lagging on faster setups.
  **Suggested fix:** Transition to an event listener pattern triggered by key lifecycle hooks once the canvas and geometries are verified ready.
  **Acceptance criteria:** Earth transition triggers instantly as soon as initialization is complete without arbitrary delays.

- [ ] [Priority: Medium]
  **Area:** Performance
  **File(s):** [src/main.js](src/main.js)
  **Issue:** Rebuilding large static lookup maps like `navigationMap` and search patterns continuously inside `findObjectByNavigationValue()` allocates unused memory footprints on every keyboard focus or dropdown selection.
  **Impact:** Triggers garbage collection overhead during interactive navigation.
  **Suggested fix:** Extract static patterns as module-level constants outside the method bodies.
  **Acceptance criteria:** Internal search lookups do not allocate new objects on each key loop.

- [ ] [Priority: Medium]
  **Area:** Refactor
  **File(s):** [src/modules/utils.js](src/modules/utils.js)
  **Issue:** Overriding the global `console.warn` as a module side-effect breaks diagnostic outputs of unrelated libraries.
  **Impact:** Shader debugging becomes complex and hides potentially fatal errors on specific browser runtimes.
  **Suggested fix:** Suppress exact WebGL diagnostics by setting `renderer.debug.checkShaderErrors = false` rather than patching global logging.
  **Acceptance criteria:** Standard `console.warn` is kept fully native.

- [ ] [Priority: Medium]
  **Area:** Scientific Accuracy
  **File(s):** [src/modules/SolarSystemModule.js](src/modules/SolarSystemModule.js)
  **Issue:** Moon orbital coordinates utilize a simplified 2D height projection instead of true Keplerian transformations.
  **Impact:** Low accuracy for highly inclined retrogrades or orbital objects (e.g. Triton).
  **Suggested fix:** Integrate standard Keplerian calculations utilizing Right Ascension of Ascending Node (RAAN Ω) elements in the orbit update engine.
  **Acceptance criteria:** Highly tilted secondary orbital planes match Keplerian mechanics profiles.

- [ ] [Priority: Medium]
  **Area:** Refactor
  **File(s):** [src/modules/PanelManager.js](src/modules/PanelManager.js), [src/modules/storage.js](src/modules/storage.js)
  **Issue:** Large variations of indentation spacing and styles (e.g. mix of tabs and spaces, varying indent configurations) throughout core source files.
  **Impact:** Reduces code readability and results in dirty future commit histories.
  **Suggested fix:** Establish `.editorconfig` parameters and enforce uniform formatting via a single Prettier run.
  **Acceptance criteria:** All modules show homogenous spacing structure.

---

## 🟢 Low Priority Issues

- [ ] [Priority: Low]
  **Area:** UX / Polish
  **File(s):** [index.html](index.html#L119)
  **Issue:** Static loading screen fun facts show strictly in English initially, regardless of the system language detection.
  **Impact:** Creates visual language translation transitions on startup for international audiences.
  **Suggested fix:** Inject a language binder hook on the initial fact banner or read translation bundles during initial language evaluation.
  **Acceptance criteria:** Startup fun facts show in the matching localized system language on first paint.

- [ ] [Priority: Low]
  **Area:** UX / Polish
  **File(s):** [src/main.js](src/main.js)
  **Issue:** Key combination handler for the Escape key blindly invokes close commands on every panel.
  **Impact:** Closes non-visible layers and causes redundant UI resets.
  **Suggested fix:** Query element configurations first (checking `aria-hidden`) or utilize a focus-tracker stack to close only the topmost viewport.
  **Acceptance criteria:** Escape key specifically dismisses active menus layer-by-layer.

- [ ] [Priority: Low]
  **Area:** Scientific Accuracy
  **File(s):** [src/i18n.js](src/i18n.js)
  **Issue:** Oort cloud fact dictionary claims it takes "1.5 years" for sunlight to reach the outer edge.
  **Impact:** Inaccurate scale representation; real sunlight transit times to the outer limit of ~200,000 AU is approximately 3.2 light-years.
  **Suggested fix:** Update text mappings to convey "> 3 years" to outer edge.
  **Acceptance criteria:** Accurate values appear across all six matching files.

- [ ] [Priority: Low]
  **Area:** Documentation
  **File(s):** [README.md](README.md)
  **Issue:** Stated Three.js dependencies list version 0.160.0 in the document, despite the HTML and Service Worker assets utilizing 0.183.x.
  **Impact:** Misleads external contributions regarding dependencies and features.
  **Suggested fix:** Direct reference within the documentation back to the importmap and real-time engine structures.
  **Acceptance criteria:** README reports version 0.183.x.
