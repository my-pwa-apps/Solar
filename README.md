# Space Voyage - Interactive 3D Solar System

An immersive, educational Progressive Web App for exploring our Solar System in stunning 3D with VR/AR support.

![Space Voyage](https://img.shields.io/badge/PWA-Ready-success)
![Three.js](https://img.shields.io/badge/Three.js-v0.183.0-blue)
![WebXR](https://img.shields.io/badge/WebXR-Supported-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Comprehensive Solar System
- All 8 planets with scientifically accurate textures
- Major moons (Moon, Io, Europa, Ganymede, Titan, and more)
- Asteroid Belt and Kuiper Belt
- Comets with dynamic tails
- Distant stars, nebulae, and galaxies
- Constellations with accurate star positions

### Space Missions
- International Space Station (ISS)
- Hubble Space Telescope
- Voyager 1 & 2
- Parker Solar Probe
- Juno (Jupiter)
- Cassini (Saturn)
- Pioneer 10 & 11
- New Horizons

### VR/AR Support
- Full WebXR implementation
- Realistic VR controller models
- Haptic feedback
- Intuitive movement controls
- Interactive VR menu
- Tested on current Meta Quest Browser; other WebXR runtimes are best effort

### Educational Features
- Detailed information panels for each object
- Ephemeris-based Earth-Moon-Sun eclipse geometry
- Keplerian planetary motion with educational visualization scales
- Realistic day/night cycles
- Adjustable time speed (1 year/minute max)
- Real astronomical data
- Educational scale mode

### Scientific scope and tolerances

Space Voyage is an educational visualization, not an observation-planning tool.
Planet and moon physical data use published NASA/JPL values, and the eclipse engine
is validated against published circumstances. For central eclipses in the current
test set, gamma and magnitude agree to about `5e-4`; the ground track is typically
within about 20 km and can differ by roughly 60 km near grazing incidence. Contact
timing may differ by 40-80 seconds.

The wider scene deliberately adjusts scale for usability. All eight planets use JPL
approximate elements in the J2000 ecliptic frame and follow the selected UTC instant;
tests compare their directions with JPL Horizons at three dates. Educational mode
keeps compact circular spacing, while scientific mode preserves eccentric radial
variation and each moon's real orbital-radius ratio to its parent body. Body sizes,
interplanetary distances and deep-space distances still use separate display scales.
The application should not be used for navigation, eclipse safety decisions or
precise observing plans.

### Progressive Web App
- ✅ **Offline app shell** after one successful online load; optional media is cached best effort
- ✅ **Installable** on desktop and mobile devices
- ✅ **Native app experience** with standalone mode
- ✅ **Smart install prompt** with beautiful UI
- ✅ **Offline indicator** shows connection status
- ✅ **Update notifications** when new versions available
- ✅ **Fast loading** with cache-first strategy
- ✅ **Auto-updates** with background sync
- ✅ **App shortcuts** to Earth, Mars, and VR mode
- ✅ **Security headers** and best practices

## Quick Start

### Option 1: Visit Live Demo

**https://my-pwa-apps.github.io/Solar/**

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/my-pwa-apps/Solar.git
cd Solar

# Serve locally (requires Node.js)
npm install
npm run dev

# Open in browser
# Navigate to: http://localhost:8000
```

> **HTTPS is required** for service-worker registration, PWA install prompts and
> WebXR. `http://localhost` is treated as a secure origin by browsers, so local
> development works, but testing on a headset or phone needs a real HTTPS origin.

## Development Workflow

```bash
# Install dependencies once (uses the committed lockfile)
npm ci

# Static analysis
npm run lint

# Run the full regression suite after changes
npm test

# Lint + tests, the same gate CI runs
npm run verify

# Optional: debug tests in a visible browser
npm run test:headed
```

`npm run verify` is intentionally serial on a developer workstation so multiple
WebGL browsers do not compete for one GPU, server port and service-worker profile.
CI runs the same repository gate on five isolated runners in parallel: one
quality/security agent and four browser agents (desktop Chromium, mobile Chromium,
Firefox and WebKit). The `Repository gate` job aggregates those results and is the
single check to require in branch protection.

### Versioning is enforced

The service worker only invalidates its caches when `CACHE_VERSION` changes, and
that version is repeated in five places (`package.json`, `sw.js`,
`src/modules/utils.js`, `src/i18n.js` and the `?v=` stamps in `index.html`).
Never edit them by hand:

```bash
npm run version:bump    # bump the patch version and stamp every file
npm run version:check   # fail if anything is out of sync (runs before npm test)
```

The suite verifies version/cache consistency, service-worker cached file references, app boot, WebGL canvas creation, navigation dropdown behavior, core controls, keyboard shortcut scoping, modals, manifest loading, and service worker registration.

### Invariants the static regression suite enforces

`tests/static-regression.spec.js` fails the build — rather than shipping a subtly
broken offline experience — when any of these drift:

- **Version stamps** in `package.json`, `sw.js`, `src/modules/utils.js`,
  `src/i18n.js` and `index.html` disagree.
- **Precache manifest** entries in `sw.js` point at files that do not exist, or
  contain duplicates.
- **Three.js module graph:** every `three/addons/*` module imported anywhere in
  `src/` must appear in `CDN_CACHE_FILES`, and nothing may appear there that is
  not imported. `index.html` and `sw.js` must agree on exactly one pinned version.
- **Manifest parity:** all six `manifest*.json` files must declare the same
  top-level fields, so an installed app behaves identically in every language.
  `share_target` is explicitly rejected until a `./share` route actually exists.

### Accessibility

`prefers-reduced-motion` is honoured on both sides: `prefersReducedMotion()` in
`src/modules/utils.js` short-circuits the camera fly-to, and the matching
`@media` block in `src/styles/main.css` suppresses CSS animation. The simulation
itself keeps running. `tests/e2e/accessibility.spec.js` covers this, the skip
link and the `aria-hidden` state of decorative icons.

### Failure handling

A throw during boot renders the recovery dialog in `src/modules/FatalError.js`
instead of leaving the user on the loading spinner. It shows the app version,
user agent and stack under "technical details", and offers Reload plus
Clear-cache-and-reload (which unregisters the service worker and deletes all
caches and IndexedDB databases) — the usual fix for a half-written cache after
an interrupted update.

### Option 3: Install as PWA
1. Visit the deployed app (requires HTTPS)
2. Click the "Install" button in your browser
3. App installs like a native application

## Supported Platforms

| Platform | Support level | Automated release coverage |
|---|---|---|
| Chromium 120+ on Windows, macOS, Linux | Supported | Full desktop suite |
| Chrome 120+ on Android | Supported | Pixel 7 mobile emulation |
| Firefox 120+ desktop | Supported for non-XR exploration | Boot and keyboard-access smoke test |
| Safari 17+ / current iOS Safari | Supported for non-XR exploration | WebKit boot and keyboard-access smoke test |
| Meta Quest Browser (current stable) | Supported for immersive VR | Manual headset release checklist |
| Other OpenXR/WebXR headsets | Best effort | No hardware release gate |

WebXR availability depends on browser, headset, secure-origin and runtime support.
HTC Vive and other PC-connected headsets are best effort unless their current browser
runtime passes the checklist in [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

## Performance Baseline

The Playwright cold-load budget records time to the first rendered frame, encoded
network bytes through that point, and cumulative Long Task time. Baselines recorded
on the development machine on 2026-08-19 were 10.6 s / 4.15 MB / 13.5 s on desktop
and 3.6 s / 4.60 MB / 4.3 s under mobile emulation. CI budgets allow 60 s / 25 MiB /
30 s on desktop and 90 s / 25 MiB / 45 s under mobile emulation to accommodate
shared-runner variance while still catching stalled boots or runaway precaching.
Results are uploaded as `performance-budgets` artifacts.

As of v2.10.325, the enforced duration is **navigation start to the first successful
render**, including blocking script loading and parsing. The app-only duration is
retained separately. Render exceptions fail the gate; a canvas color/pixel check
rejects blank output. Long tasks are clipped to the first-frame boundary. Transfer
bytes use Resource Timing for page requests completed by that boundary, including
navigation; they exclude worker-owned precaching and unfinished requests. The older
numbers above used different measurement windows and are not comparable baselines.
One focused 2026-09-07 run measured 10.75 s desktop and 8.79 s emulated mobile with
zero render errors. Keep the broad CI limits until repeated-run variance supports
tighter limits; mobile emulation is not physical-device performance evidence.

## Offline Release Policy

An installed worker serves HTML and required modules from its own release cache.
New HTML is adopted with the replacement worker, after the user accepts the update;
the page does not combine fresh HTML with old modules. An update already waiting
when a tab opens is announced. First-time worker activation does not reload the page;
replacement activation reloads once, on `controllerchange`.

Shell, Three.js and supported XR profile/model assets are cached in one mandatory
installation transaction. Optional images remain best effort. A failed install leaves
the previous worker usable. Controlled navigation uses the installed shell even when
the host stalls or returns 503; without that shell the network attempt has a five-second
deadline. Recovery clears only Space Voyage cache names, its worker scope and its
texture database, preserving sibling applications on the same origin and preferences.

Quest controller profiles and a generic fallback are pinned to
`@webxr-input-profiles/assets` 1.0.20 and self-hosted (about 13.36 MB including models).
Both hands decode in online/offline browser tests; physical Quest interaction remains
a required [release checklist](docs/RELEASE_CHECKLIST.md) step.

## Controls

### Desktop
- **Mouse Drag:** Rotate view
- **Scroll:** Zoom in/out
- **Right Click + Drag:** Pan camera
- **Click Objects:** Select and view information
- **Keyboard Shortcuts:**
  - `H` - Help
  - `O` - Toggle orbits
  - `C` - Toggle constellations
  - `D` - Toggle labels
  - `S` - Toggle scale mode
  - `R` - Reset view
  - `Space` - Pause/Play
  - `+/-` - Adjust time speed

### VR Mode
- **Left Stick:** Move forward/back/strafe
- **Right Stick:** Turn left/right, move up/down
- **Trigger:** Sprint mode
- **X Button (left controller):** Toggle VR menu
- **Left Grip:** Grab and rotate the scene
- **Right Grip:** Drag the VR menu panel
- **Point + Trigger:** Select objects

### Mobile
- **Touch Drag:** Rotate view
- **Pinch:** Zoom
- **Two-finger Drag:** Pan
- **Tap Objects:** Select

## PWA Setup

To deploy as a Progressive Web App and pass PWABuilder certification:

### 1. Generate Icons (Required)
Visit [PWABuilder Image Generator](https://www.pwabuilder.com/imageGenerator), upload a 512x512 PNG, and place the generated icons in the `/icons` folder.

### 2. Deploy to HTTPS (Required)
Deploy to any HTTPS-enabled host:
- GitHub Pages (free) ← **currently used**
- Azure Static Web Apps (free tier)

### 3. Validate
Test your PWA at [PWABuilder.com](https://www.pwabuilder.com/) with your deployed URL.

## Technology Stack

- **3D Graphics:** Three.js v0.183.0
- **VR/AR:** WebXR Device API
- **Offline Support:** Service Workers
- **UI Framework:** Custom CSS with Fluent Design
- **Module System:** ES6 Modules
- **No Build Tools:** Pure JavaScript (no bundler required)

## Project Structure

```
Solar/
├── index.html                  # Shell, CSP, importmap, all UI markup
├── manifest*.json              # PWA manifests (one per supported language)
├── sw.js                       # Service worker: precache + runtime caching
├── eslint.config.js            # Flat ESLint config
├── playwright.config.js        # Regression suite config
├── .github/workflows/ci.yml    # Lint + version check + Playwright on every push
├── scripts/
│   └── sync-version.mjs        # Single-source-of-truth version stamping
├── src/
│   ├── main.js                 # App entry point, controls, shortcuts, navigation
│   ├── i18n.js                 # Translations (6 languages)
│   ├── bootstrap/              # Pre-module-load setup (language, install prompt)
│   ├── modules/
│   │   ├── SceneManager.js     # Three.js scene, camera, renderer, all WebXR
│   │   ├── SolarSystemModule.js# Celestial objects, orbits, textures
│   │   ├── UIManager.js        # Panels, modals, loading, speed controls
│   │   ├── TextureCache.js     # IndexedDB + in-memory texture cache
│   │   ├── utils.js            # DEBUG/CONFIG flags, material & geometry factories
│   │   └── …                   # Audio, PWA, service worker, language, panels
│   └── styles/
│       ├── main.css            # Core styles
│       └── ui.css              # UI component styles
├── textures/                   # Self-hosted planet/moon/ring/deep-sky textures
├── icons/                      # PWA icons
├── tests/                      # Playwright specs
├── BACKLOG.md                  # Prioritised engineering backlog
└── README.md                   # This file
```

## Features in Detail

### Date Control and Solar Eclipses

The app opens at **today's date** (`initPositionsToDate(new Date())`) and the Time
Machine panel shows the simulated date, steps it by month/year/decade, accepts a
date directly, and returns to the present with **Now**.

Eclipses are computed from a real ephemeris in `src/modules/astro/`:

| Module | Responsibility |
|---|---|
| `Ephemeris.js` | Sun and Moon positions (Meeus ch. 25 / 47), obliquity, nutation, GMST, ΔT |
| `Eclipse.js` | Shadow-cone geometry intersected with the WGS-84 ellipsoid |
| `EclipseRenderer.js` | Projects the umbra and penumbra onto Earth in a shader |

Two things are worth knowing before changing this code:

- **The shadow is not a shadow map.** Educational mode draws the Moon at ~4 Earth
  radii instead of the true ~60 used by scientific mode, and a 1024px shadow map
  spanning the solar system
  cannot resolve a ~110 km umbra on a 12,742 km globe. The shadow is computed
  analytically in real kilometres and projected onto Earth's surface. The shader
  measures each fragment's perpendicular distance to the true 3D shadow axis,
  which produces the correct *elliptical* footprint at oblique incidence for free.
- **Earth's orientation is driven by the ephemeris.** `_applyEarthOrientation()`
  combines sidereal rotation with the fixed J2000 celestial pole, so the true
  sub-solar point faces the scene's Sun while Earth's axis remains inertially fixed.
  All eight planet positions share the same right-handed J2000 ecliptic frame.

Central eclipses render their true-size umbra and penumbra; partial eclipses use a
clearly labelled, shallow penumbral treatment. Clicking the eclipse readout flies to
the footprint without enlarging it. The next-eclipse scan runs in a module Worker so
the render loop remains responsive.

**Accuracy.** Validated against published NASA/EclipseWise circumstances for the
2024-04-08, 2026-08-12 and 2027-08-02 total eclipses: gamma and magnitude match to
~5×10⁻⁴, and the shadow lands within ~20 km of the published track (up to ~60 km at
grazing incidence, where the truncated lunar series is amplified). That is well
inside the width of the path of totality, but contact times for a single site can
be up to a minute out. `tests/e2e/eclipse.spec.js` locks this in, including the
check that totality covers A Coruña, Bilbao, León, Zaragoza and Palma while
correctly excluding Madrid and Barcelona.

### Time Control
- 13 speed levels from real-time to 1 year/minute
- Pause/play functionality
- Perfect for observing:
  - Planetary rotations
  - Orbital mechanics
  - Moon phases
  - Seasonal changes

### Scale Modes
- **Educational Mode:** Compressed distances for easy navigation
- **Realistic Mode:** True astronomical distances (vast!)

### Object Information
Click any object to view:
- Name and type
- Distance from Sun
- Size (radius/diameter)
- Scientific description
- Fun facts

### Navigation
- Quick navigation dropdown
- Search by object type (planets, moons, spacecraft, etc.)
- Camera auto-focus
- Smooth transitions

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile) - Full support
- ✅ Firefox (Desktop & Mobile) - Full support
- ✅ Safari (Desktop & Mobile) - Full support (limited VR)
- ✅ Samsung Internet - Full support

### VR/AR Requirements
- WebXR-capable browser (Chrome, Edge)
- VR headset (Meta Quest, HTC Vive, etc.)
- For AR: ARCore/ARKit compatible device

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## License

This project is licensed under the MIT License.

## Acknowledgments

- **NASA:** Planetary textures and scientific data
- **Three.js:** Amazing 3D graphics library
- **PWABuilder:** Progressive Web App tools
- **WebXR Community:** VR/AR standards

## Support

- 📖 Documentation: See markdown files in root directory
- 🐛 Issues: Use GitHub Issues
- 💬 Community: PWABuilder Discord

## Future Enhancements

- [ ] More exoplanets and star systems
- [ ] Planetary weather visualization
- [ ] Spacecraft trajectory visualization
- [ ] Multiplayer exploration mode
- [ ] AR marker mode for education
- [ ] Voice navigation
- [ ] Quiz mode
- [ ] Bookmark favorite views

## Project Stats

- **Objects:** 100+ celestial bodies and spacecraft
- **Lines of Code:** ~9,000+
- **Technologies:** 10+ web APIs
- **PWA Score:** 100/100 (once icons and HTTPS are set up)

---

Made with passion for space enthusiasts and educators worldwide.
