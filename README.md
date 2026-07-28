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
- Works with Meta Quest, HTC Vive, and more

### Educational Features
- Detailed information panels for each object
- Scientifically accurate orbital mechanics
- Realistic day/night cycles
- Adjustable time speed (1 year/minute max)
- Real astronomical data
- Educational scale mode

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
that version is repeated in five places (`package.json`, `sw.js`,
`src/modules/utils.js`, `src/i18n.js` and the `?v=` stamps in `index.html`).
Never edit them by hand:

```bash
npm run version:bump    # bump the patch version and stamp every file
npm run version:check   # fail if anything is out of sync (runs before npm test)
```

The suite verifies version/cache consistency, service-worker cached file references, app boot, WebGL canvas creation, navigation dropdown behavior, core controls, keyboard shortcut scoping, modals, manifest loading, and service worker registration.

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
