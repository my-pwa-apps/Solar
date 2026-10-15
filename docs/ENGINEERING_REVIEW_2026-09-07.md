# Space Voyage: Engineering Review

Date: 2026-09-07. Version: 2.10.324. Scope: current, already-modified worktree.
Review mode: no production code, dependency, configuration or test changes made.
Existing user changes and the historical [review](../ENGINEERING_REVIEW.md) remain intact.

## 1. Executive Summary

Space Voyage is an educational, static-hosted 3D astronomy PWA with a substantial
working exploration interface, scientific date/eclipsing controls, and WebXR support.
Its numerical tests and configured browser suite pass. The earlier assessment of
an untested, unsplit application is no longer representative of this worktree.

**Verdict: Not ready for an unrestricted production release.** The online desktop
experience is functional, but storage cleanup can delete sibling applications' data
and offline installation can succeed without its rendering engine. Release consistency
also needs a real-worker fixture before installed-app upgrades can be trusted.

The highest-value work is narrowly scoped lifecycle correctness and regression
protection, not a rewrite. Confidence is high in the demonstrated defects and medium
in the overall release assessment because deployment and physical XR were not tested.

## 2. Review Scope

### Repository and Critical Paths

| Surface | Current implementation and review emphasis |
|---|---|
| Product | Educational exploration of planets, moons, spacecraft and deep sky; not observation-planning software. Public copy qualifies display scales and eclipse tolerances. |
| Runtime | Native ES modules, JavaScript, CSS and HTML; self-hosted Three.js 0.183.2. No bundler or compilation step. |
| Bootstrap | [index.html](../index.html), [main.js](../src/main.js) and [bootstrap](../src/bootstrap/initManagers.js). Blocking i18n, IndexedDB warmup, manager construction, scene creation, first frame. |
| Rendering/XR | [SceneManager](../src/modules/SceneManager.js): camera/dolly, controls, WebXR, postprocessing, frame/error loop and disposal. |
| Domain | [SolarSystemModule](../src/modules/SolarSystemModule.js) composes five solar-system mixins; pure ephemeris/eclipse modules support UTC date changes. |
| UI | UIManager, AppFeatures, PanelManager, six-language i18n, search/navigation, date/speed controls, onboarding and recovery. |
| Persistence | LocalStorage preferences, IndexedDB texture data, versioned Cache Storage. No server database or account state. |
| Distribution | Documented GitHub Pages subpath on a shared origin; PWA manifests and worker. HTML mentions a paid Windows Store product, but packaging/release artifacts are not supplied here. |
| Validation | Node tests, Playwright desktop/mobile Chromium plus Firefox/WebKit smoke, ESLint, version/CSP checks and npm audit. |
| CI/release | Lockfile, Node 20, quality job plus four browser runners and aggregate gate; Dependabot; manual Quest checklist. Branch protection and actual deployment configuration were not queried. |
| Assets/tooling | Vendored engine, textures/icons, attribution, version/hash scripts and one-off extraction scripts. Test reports/results and dependencies are ignored generated output. |

Critical workflows reviewed: first visit and onboarding; navigation and information
display; UTC seeking and eclipse rendering; application installation/update/recovery;
cache persistence and quota behavior; keyboard access; controller initialization.

Source inspection was risk-weighted, not a claim to have audited every astronomical
constant, texture pixel or source line. Existing scientific and maintenance findings
were reused instead of duplicated. All conclusions apply to local files, not proof
that the live site serves this exact revision.

### Executed Validation

| Check | Result |
|---|---|
| `git status --short` | Extensive pre-existing modified/untracked work recorded and preserved. |
| `npm run lint` | Passed: 0 errors, 210 warnings. Counts independently summarized through ESLint's API. |
| `npm run test:unit` | 17 passed, 0 failed, about 236 ms. Includes eclipse geometry and eight-planet reference directions. |
| `npm test -- --reporter=line` | Version and CSP prechecks passed; 63 browser tests passed, 11 skipped, 29.4 minutes, all four configured projects. |
| `npm audit --audit-level=high` | No high/critical advisory; one moderate vulnerable dependency, qs. Command success is not a clean audit. |
| `npm explain qs` | Development-only `http-server > union > qs@6.15.3`. |
| Worker VM fault injection | Rejected required engine still installs; activation deletes sibling cache; HTTP 503 defeats cached shell; unscoped lookup returns old module for versioned request. |
| Recovery VM fault injection | Actual extracted recovery function requests deletion of fake sibling worker, cache and IndexedDB database. No real user data deleted. |
| Integrated Chromium | Live first-run keyboard probe reproduced onboarding focus escape; desktop screenshot and 64x64 canvas sample were nonblank (4,093/4,096 pixels above the selected brightness threshold). Factory path still points to jsDelivr. |
| Documentation checks | Required backlog fields and priority counts checked with Node assertions; final local-link validation recorded at completion. |

The VM checks execute repository handlers with controlled platform doubles. They
demonstrate control flow, not full browser installation scheduling. The successful
browser suite contains useful application integration, pixel/eclipse and quota tests;
it does not negate failures outside those scenarios.

Not executed: a fresh `npm ci`, hosted deployment/rollback, real two-version worker
upgrade, complete fresh offline launch, physical phone/headset tests, screen-reader
or automated axe audit, sustained GPU/memory soak, and comprehensive license provenance
verification. Chrome DevTools trace tools were unavailable; no Lighthouse, INP/LCP/CLS
or field-performance result is claimed. A synthetic XR connection probe did not yield
conclusive browser evidence and was cancelled by navigation.

Not applicable: backend authentication/authorization, multi-tenant APIs, SQL migrations,
server transactions, containers, payment processing and server secret management.
No backend or user-account system was found in the reviewed runtime.

## 3. Critical Findings

No new Critical-severity finding. This does not mean release readiness: the High
data-isolation and incomplete-install defects are release blockers for this product.
Old Critical ratings for file size and locale packaging were reduced to Medium and
High respectively; neither demonstrates a catastrophic failure.

## 4. High-Priority Findings

1. **R2: Cross-application storage destruction. CONFIRMED.**
   [Worker activation](../sw.js#L210) deletes every cache except its three current
   names. [Fatal recovery](../src/modules/FatalError.js#L25) unregisters all workers
   and deletes all caches/databases on the origin. Both were reproduced using fake
   sibling stores. Scope cleanup to owned names and registration; await bounded
   IndexedDB deletion. Small effort, high user value. A sibling application actually
   being installed is a deployment condition, not something this review assumes exists.
2. **R1: Successful install can omit the rendering engine. CONFIRMED.**
   [Install handler](../sw.js#L186) swallows required vendor failures through
   `allSettled`; rejected `three.core.js` still produced `SW_INSTALLED` in the probe.
   Make the engine module graph mandatory while leaving optional textures best effort.
   Small effort, high offline-reliability value.
3. **R3: Release assets are not isolated. CONFIRMED mechanism; LIKELY release failures.**
   [Fetch handling](../sw.js#L374) combines fresh HTML with version-normalized,
   origin-wide module lookup. [Update registration](../src/modules/ServiceWorkerManager.js#L79)
   does not announce an already-waiting worker. A cache double demonstrated stale
   module selection, but an incompatible real release was not deployed. Choose a
   coherent release policy and validate it with two real workers. Medium effort.
4. **Existing modal finding: hidden tab stops break onboarding. CONFIRMED.**
   [Focus trap](../src/modules/UIManager.js#L227) counts hidden Start as its final
   control. Actual Tab from visible Next leaves the modal; reverse wrap from Skip
   fails. Filter tabbable controls and protect fatal/stacked dialogs too. Small effort.
5. **Existing lifecycle coverage: marked complete without real upgrades. CONFIRMED.**
   [Lifecycle test](../tests/e2e/app.spec.js#L244) fabricates EventTargets and calls
   the reload guard directly. Keep this useful manager test, but reopen the original
   two-version acceptance criteria. This is the regression work for R1-R4, not another
   independent runtime defect.

Existing high-value backlog work remains: bounded binary texture persistence and
stable celestial identity. [TextureCache](../src/modules/TextureCache.js#L86) also
bypasses its 200-entry memory cap on persistent-cache hits and direct canvas promotion;
that evidence was merged into the cache-budget item. Display-key migration must remain
incremental because planets/moons already have some stable IDs.

## 5. Medium/Low Findings

| Finding | Evidence, effect and next change |
|---|---|
| R4, Medium, CONFIRMED | Worker returned HTTP 503 despite cached HTML; no navigation deadline exists. Use cached-shell fallback for transient errors/stalls, with an explicit healthy-update policy. |
| R5, Medium, CONFIRMED configuration conflict | [Factory](../src/modules/SceneManager.js#L348) uses [external profile data](../vendor/three@0.183.2/examples/jsm/webxr/XRControllerModelFactory.js#L16) under same-origin CSP. Vendor supported profile/model assets. No claim that locomotion fails. |
| R6, Low, CONFIRMED | qs@6.15.3 has two advisory records: GHSA-x5fp-wj9c-mxmx and GHSA-4mjr-xmp4-gh2g. It is development-only and both configured servers bind loopback. Apply a compatible lockfile update, not a forced major upgrade. |
| Existing performance gate, Medium, CONFIRMED | [First-frame marking](../src/modules/SceneManager.js#L3182) occurs after the render catch; measurement starts after blocking imports and samples mismatched windows. Reopened rather than duplicated. |

No speculative defect has been added to the backlog.

## 6. Highest-Value Improvements

| Rank | Investment | User value / risk reduction | Effort |
|---|---|---|---|
| 1 | Own and isolate recovery/storage | Prevent sibling data loss | Small |
| 2 | Mandatory engine install plus real-worker update/offline tests | Reliable installed-app launch and release rollback | Medium |
| 3 | Repair keyboard modal boundaries with real input tests | Restore first-visit accessibility | Small |
| 4 | Correct measurement windows, then optimize measured startup costs | Make performance regressions visible and prioritize real savings | Medium |
| 5 | Bound texture storage through one owner | Reduce constrained-device storage/memory risk | Medium |

These reuse existing capabilities. No new framework, event bus or build tool is
required for the first four improvements.

## 7. Cleanup and Simplification

The historical unsplit-monolith and absent-test claims are superseded. Preserve their
decision history but use current evidence, as the backlog now does. Eight existing
entries were refreshed rather than spawning equivalent tickets.

The one-off split scripts still name superseded members such as `_sunRA`; they were
not executed. Treat them as migration artifacts, not supported regeneration commands.
No asset or helper was deleted merely because a text search did not find it: procedural
fallbacks, dynamic navigation, worker imports and offline manifests make that unsafe.
Generated test output is already ignored. No demonstrated unused npm package warrants
removal. Existing documentation-consolidation and warning-cleanup items cover further
housekeeping; do not prioritize it over R1-R4.

## 8. Architecture and Refactoring

Native modules remain appropriate for a static educational application. The five-way
solar-system split and pure astronomy modules are real improvements. Remaining owners
are large: main 2,046 lines, SolarSystemModule 2,104, SceneManager 3,305 and deep-space
2,713. Prototype composition shares implicit `this` state across those files.

Keep the facade and extract one state-owning domain at a time when changing it:
navigation identity, texture ownership or XR lifecycle. Prefer explicit dependencies
at those boundaries; do not mechanically replace every global with an event bus.
Benefits are smaller test fixtures and clearer mutation ownership; the trade-off is
migration risk in shared scene state. Protect navigation, date seeks, scale changes,
Earth/eclipse pixels and offline module registration before each extraction.

## 9. Security, Privacy, Reliability and Data

R2 is an origin-ownership/data-loss issue with a deterministic destructive path when
sibling stores exist. It does not cross browser origins and requires no attacker.
R1/R3/R4 are reliability and delivery issues. Required failure tests must include
partially installed caches and denied/blocked storage, not just offline flags.

Positive controls: same-origin script/connect policy, hashed inline importmap,
safe text rendering, an allowlist help sanitizer, and lint rules against unsafe HTML
assignment/eval. No exploitable input-to-XSS chain was established. Preference reads
handle storage denial. No account data or analytics transmission was identified in
the reviewed runtime; debug details remain local. The external XR dependency should
be self-hosted rather than accommodated by weakening CSP.

The dependency audit does not scan manually vendored Three.js or establish complete
asset provenance. Attribution contains MIT license text, so missing MIT text is not
a finding. Product licensing/Store packaging requires maintainer evidence beyond this
source review. No credentials or production resources were accessed.

## 10. Performance

Observed artifacts from this single Windows run:

| Metric | Desktop Chromium | Emulated mobile Chromium |
|---|---:|---:|
| App initialization to marked first frame | 6,213 ms | 6,946 ms |
| First-frame mark relative to navigation time origin | 6,416 ms | 7,337 ms |
| Reported encoded bytes | 4,908,370 | 4,908,370 |
| Collected long-task duration | 10,435 ms | 10,336 ms |
| Current first-frame limit | 60,000 ms | 90,000 ms |

The long-task sums exceed the first-frame timestamps: they include subsequent work
because the test collects until evaluation, not a common cutoff. The CDP session
counts page traffic, not a complete worker precache inventory. These are diagnostic
artifacts, not validated Core Web Vitals or proof of total offline transfer size.

The classic locale script is 426,567 bytes and blocks parsing. Reducing locale payload
is credible high-value work, but no trace isolated milliseconds saved; do not promise
a numeric speedup. Existing adaptive DPR and scratch vectors are useful. Sustained
FPS, allocation growth, battery cost and physical mobile thermal behavior remain unmeasured.

## 11. Testing

The 17 fast numerical tests and passing browser integration are meaningful regression
protection, especially for UTC planet directions and eclipse rendering. The browser
suite also exercises a real Chromium quota override. Firefox/WebKit smoke deliberately
blocks workers, so its success is not offline compatibility evidence.

The biggest gap is behavioral failure testing: real upgrades, stale HTML/module pairs,
required asset failure, sibling storage isolation and modal keyboard boundaries.
Some UI tests force clicks or dispatch events, which cannot prove pointer actionability.
The 7.2-minute all-controls sweep and 900-second test ceiling remain the existing
test-ergonomics issue. Split by workflow and bound individual actions; retain serial
execution on a shared GPU. CI already isolates browser projects on separate runners.

## 12. UX and Accessibility

The full exploration/control sweep passes. The reviewed desktop scene and textures
are visibly nonblank; labels, navigation, date controls and information panels provide
the core educational workflow. Skip-link, reduced-motion, keyboard-shortcut scoping
and recovery tests exist. The first-run keyboard escape is a concrete accessibility
regression despite those passes. Repair it before subjective visual redesign.

No WCAG conformance statement is justified: automated accessibility scanning,
screen-reader testing and physical touch/headset review were not performed. Existing
accessibility audit and stable-identity/i18n backlog items remain the right owners.

## 13. Deployment, Operations and Dependencies

Version/CSP synchronization and a committed lockfile are enforced. CI has a quality
job, four browser runners, retained failure artifacts and a final aggregate gate.
Dependency updates are configured. Repository evidence cannot confirm branch
protection, whether deployment waits for that gate, or a completed Quest release record.

The most important release changes are R1-R4. [Release checklist](RELEASE_CHECKLIST.md)
documents required headset checks but has no completed release record. No production
deployment was made. `npm audit` passing at a High threshold must not be described as
zero vulnerabilities. Vendored XR data remains outside npm dependency reporting.

## 14. Maintainability and Developer Experience

Setup and version/hash commands match package scripts and passed when exercised.
The no-build workflow is straightforward. Warning debt is 210, not a failing lint
gate; use a warning ratchet while keeping unexpected production errors visible.
The obsolete recommendation to suppress every error outside debug mode was corrected.

Current implementation differs from old architecture documentation and agent notes.
This dated report and refreshed backlog establish current evidence without rewriting
all historical prose. Automated size/registration checks and fast focused fixtures are
more valuable than an unprotected broad formatting or module rewrite.

## 15. Future Risks

For the next three years, rank investment as: (1) release/storage lifecycle tests,
(2) stable domain and cache ownership, (3) trustworthy performance budgets and physical
device baselines, (4) incremental locale and large-module separation. These reduce
actual change risk and maintenance cost. No hypothetical backend, database or
multi-tenant scaling redesign is warranted for this static application.

## 16. Backlog Summary

[BACKLOG.md](../BACKLOG.md) updated, preserving unresolved history.

| Scope | Critical | High | Medium | Low | Total |
|---|---:|---:|---:|---:|---:|
| New findings R1-R6 | 0 | 3 | 2 | 1 | 6 |
| All open checkbox entries after review | 0 | 13 | 20 | 8 | 41 |

Eight pre-existing items updated: cache budget, logging/lint, modal focus, long tests,
module split, locale loading, performance measurement and worker lifecycle. The last
two were reopened because their acceptance criteria remain unmet; implemented marks,
artifacts and manager-level tests are explicitly retained as partial progress.

No item was marked newly resolved. Eight duplicate tickets were avoided by updating
their existing owners. Runtime R1-R4 share the reopened worker fixture rather than
each getting a duplicate test-gap ticket. Whole-file counts include historical entries
already labeled superseded and do not claim 41 independent, newly validated defects.

## 17. Engineering Assessment

Scores describe inspected evidence, not certification or a statistically calibrated
benchmark. Every score below 8 names its limiting factor.

| Dimension | Score / 10 | Evidence or limiting factor |
|---|---:|---|
| Architecture | 7 | Good native-module fit and pure astronomy; oversized shared-state mixins remain. |
| Correctness | 7 | Numerical and browser tests pass; deterministic lifecycle/focus defects remain. |
| Code quality | 7 | Bug-catching lint passes; 210 warnings and large control-flow owners. |
| Maintainability | 6 | Several 2,000-3,000-line owners and implicit global/mixin contracts. |
| Performance | 6 | Multi-second local startup; success/window gaps in the performance gate. |
| Security | 8 | Restricted CSP and safe DOM paths; no exploit demonstrated. Vendored advisory coverage limited. |
| Privacy | 8 | No account/telemetry collection identified; preferences and diagnostics are local. |
| Reliability | 5 | Missing mandatory engine, HTTP error fallback and release consistency. |
| Data integrity | 5 | Origin-wide destructive recovery and insufficient cache ownership. |
| Testing | 7 | 17 unit and 63 browser passes; real upgrades, offline faults and keyboard boundaries missing. |
| Documentation | 7 | Useful setup/release docs; dated claims and prematurely closed acceptance criteria. |
| Developer experience | 7 | Working automation, but 29.4-minute serial suite and warning noise. |
| User experience | 7 | Broad working exploration; first-run focus and offline recovery failures. |
| Accessibility | 6 | Useful targeted tests; confirmed modal escape and no comprehensive audit. |
| Operability | 6 | Strong CI/version gates; unsafe recovery, untested release transitions and incomplete device record. |
| Scalability | N/A | No backend/concurrency capacity requirement to assess; static delivery and client limits covered above. |
| Overall product quality | 7 | Useful working product with concrete data-safety and installed-app release blockers. |

## 18. Final Verdict

**Not ready. Overall confidence: Medium; confirmed defect confidence: High.**
Release blockers are unsafe storage ownership and incomplete mandatory precaching;
release-consistent upgrades also need protection before promoting this worktree.
The absence of a physical Quest result limits any WebXR readiness claim.

Top three next actions:
1. Scope activation and recovery to owned application state and test sibling sentinels.
2. Make engine installation atomic and implement real two-version/offline fixtures,
   using them to repair release consistency and navigation recovery.
3. Fix onboarding/modal tab boundaries with unforced keyboard tests, then record
   the physical-device release checklist before claiming full supported-device readiness.

## Implementation Follow-Up - v2.10.325

The review above remains a historical snapshot. At the user's request, R1-R4 and
R6 are now fixed, along with modal focus containment and real-worker lifecycle
coverage. Controlled pages retain the installed HTML/module release until approved
activation. Recovery only clears owned application state and has bounded database
deletion handling. No sibling application data or user preferences are cleared.

R5's code is implemented: seven pinned local XR profiles, generic fallback and
embedded models are precached with MIT attribution (13,364,513 bytes). Inspection
also found that the existing factory was never attached to controller grips; that
attachment is now present. Automated connected-event tests decode both hands online
and offline without external requests. Physical Quest interaction is still untested,
so the hardware release gate and backlog entry remain open.

Startup measurement now records only successful rendering from navigation start,
including blocking imports, with bounded long-task accounting and nonblank canvas
checks. App-only timing is retained separately. Page transfer totals exclude worker
precache and unfinished requests. Repeated-run warm/cold budget calibration remains
open; these measurements are not physical-device or Core Web Vitals certification.

Validation: `npm run verify` passed with 26 unit tests, 73 browser tests and 13
intentional skips (39.7 minutes for browser execution). Desktop/mobile Chromium
coverage includes fresh offline full-app boot with decoded textures; Firefox and
WebKit smoke tests pass. ESLint reports zero errors and 210 existing warnings.
`npm ci` succeeded with zero reported vulnerabilities. Version and CSP checks pass.

Two initial desktop workflow failures were addressed by restoring normal Playwright
stability checks for animated modal close buttons and allowing adequate time for
long software-rendered interaction checks. The full controls sweep subsequently
passed. Playwright discovery is now restricted to browser specs so Node-only test
modules cannot interrupt browser collection.

The confirmed storage and installation release blockers are resolved. This is not
an unconditional supported-device release approval: physical Quest checks and the
unrelated historical backlog remain outstanding. No deployment or commit was made.