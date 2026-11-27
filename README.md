# Space Voyage - Interactive 3D Solar System

An immersive, educational Progressive Web App for exploring our Solar System in stunning 3D with VR/AR support.

![Space Voyage](https://img.shields.io/badge/PWA-Ready-success)
![Three.js](https://img.shields.io/badge/Three.js-v0.186.1-blue)
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
- Works with Meta Quest, HTC Vive, and more

### Educational Features
- Detailed information panels for each object
- Scientifically accurate orbital mechanics
- Realistic day/night cycles
- Adjustable simulation speed: 1× is real time; the maximum is one year per minute
- Real astronomical data
- Educational scale mode with a compact solar corona that keeps Mercury clear of the glow
- Object info reports known mean orbital distances in AU, independent of the visualization scale
- Major moons, Haumea's triaxial shape and ring, and Quaoar's two rings are represented
- On shadow-capable devices, eclipse shadows are rendered for the focused planet–moon system rather than the whole overview; shadows are disabled on mobile and low-power devices.

### Progressive Web App
- ✅ **Works 100% offline** with intelligent caching
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

### Versioning is enforced

The service worker only invalidates its caches when `CACHE_VERSION` changes, and
that version is repeated in `package.json`, `sw.js`, `src/modules/utils.js`,
the entry imports in `src/main.js` and `src/bootstrap/startApp.js`, and the
`?v=` stamps in `index.html`.
Never edit them by hand:

```bash
npm run version:bump    # bump the patch version and stamp every file
npm run version:check   # fail if anything is out of sync (runs before npm test)
```

The app bootstrap initializes translations before loading the app entry, including
when an older service worker serves a cached version of the entry point.

The suite verifies version/cache consistency, service-worker cached file references, app boot, WebGL canvas creation, navigation dropdown behavior, core controls, keyboard shortcut scoping, modals, manifest loading, and service worker registration.

### Invariants the static regression suite enforces

`tests/static-regression.spec.js` fails the build — rather than shipping a subtly
broken offline experience — when any of these drift:

- **Version stamps** in `package.json`, `sw.js`, `src/modules/utils.js`,
  `src/main.js`, `src/bootstrap/startApp.js` and `index.html` disagree.
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
  - `[` / `]` - Move the simulation date back / forward one month
  - `N` - Return to the current date

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
│   ├── i18n.js                 # Locale loader and DOM translation helpers
│   ├── locales/                # One ES module per supported language
│   ├── bootstrap/              # Pre-module-load setup (language, install prompt)
│   ├── modules/
│   │   ├── SceneManager.js     # Three.js scene, camera, renderer, all WebXR
│   │   ├── SolarSystemModule.js# Celestial object construction and simulation
│   │   ├── solarSystemData.js  # Physical constants and orbital element tables
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

### Time Control
- Continuous speed control from paused to one simulated year per minute
- Pause/play functionality
- The speed panel shows the simulated UTC date, including when paused or collapsed.
- Comet information shows an approximate orbital semimajor axis, not a current
  distance: the visual orbits are compressed and do not represent physical distances.
- Moon diameters and nebula extents are approximate; nebulae and Solar System
  belts have diffuse boundaries. See [NASA's moon data](https://www.nasa.gov/wp-content/uploads/2009/12/solar_system_moons_lithograph_h.pdf),
  [NASA's Eagle Nebula data](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-16/),
  and [ESA's small-body overview](https://www.esa.int/media/small-objects-in-the-solar-system).
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
