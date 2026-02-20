```instructions
# Space Voyage - AI Coding Agent Instructions

## Project Overview

**Space Voyage** is an educational Progressive Web App providing an immersive 3D Solar System experience with VR/AR support. Built with vanilla ES6 modules and Three.js, it features 100+ celestial objects, scientifically accurate orbits, and complete offline functionality.

**Key Stats:** ~12,000 LOC | 10+ Web APIs | PWA Score 100/100 | Zero build tools required

## Architecture Principles

### 1. Pure ES6 Modules (No Build Step)
- **No bundlers:** Direct ES6 module imports, runs natively in browsers
- **ImportMap:** Three.js v0.160.0 loaded via CDN importmap in `index.html` — **do not upgrade**
- **Module structure:** Each module is an exported singleton class
- Cache busting via URL version params on static imports

### 2. Module Hierarchy
- `main.js` → Entry point; creates `App` class; sets `window.app = this` for cross-module access
- `SceneManager.js` (~2,277 lines) → Three.js scene/camera/renderer/OrbitControls/WebXR; all VR logic
- `SolarSystemModule.js` (~8,900 lines) → All celestial objects, orbits, textures
- `UIManager.js` → UI controls, info panels, loading screens
- `TextureCache.js` → IndexedDB + memory cache for textures
- `utils.js` → `DEBUG`, `CONFIG`, `IS_MOBILE`, `IS_LOW_POWER`, `MaterialFactory`, `GeometryFactory`
- `AudioManager.js`, `PanelManager.js`, `PWAManager.js`, `ServiceWorkerManager.js`, `LanguageManager.js`

All modules follow the same singleton pattern:
```javascript
class MyModule {
  constructor() { /* init */ }
  init()        { /* public setup */ }
}
export const myModule = new MyModule();
```

### 3. Service Worker Caching (current: v2.6.3)
- **Strategy:** Cache-first for static assets, network-first for HTML
- **Always bump `CACHE_VERSION` in `sw.js`** whenever ANY cached file is modified (modules, CSS, textures, icons)
- Add new files to `STATIC_CACHE_FILES` array in `sw.js`
- Verify with hard refresh → DevTools → Application → Service Workers

### 4. Texture Strategy (3-tier fallback)
1. **Self-hosted** (`./textures/planets/`, `./textures/moons/`, etc.) — primary, SW-cached
2. **Procedural** (`TextureGeneratorUtils` in `utils.js`) — fallback when file is missing
3. **Never use external CDN textures** — project is fully self-hosted for offline reliability

```javascript
createEarthTextureReal(size) {
  return this.loadTextureWithFallback(
    ['./textures/planets/earth_1k.jpg'],
    () => TextureGeneratorUtils.generateEarthTexture(size)
  );
}
```

## VR/XR Architecture — Critical Rules

### Dolly Pattern (MUST follow)
The XR session **owns `camera.position` every frame** — any direct camera moves are silently overwritten.
All VR movement and teleportation goes through the **dolly** (`this.dolly` in `SceneManager`, a `THREE.Group` at scene root; `this.camera` is a child of it):

```javascript
// WRONG — overwritten by XR runtime each frame
this.camera.position.set(x, y, z);

// CORRECT — move the dolly; camera follows
this.dolly.position.set(x, y, z);
this.dolly.rotation.y = Math.atan2(dx, dz); // face target
```

Navigation calls `teleportVRToObject(object)`, which applies per-type distance rules (moon, spacecraft, dwarf planet, constellation, etc.) and sets `dolly.position` + `dolly.rotation.y`.

### VR UI Panel
`vrUIPanel` is a `THREE.Mesh(PlaneGeometry, MeshBasicMaterial{DoubleSide})` child of `dolly`, driven by a 1400×1000 Canvas 2D texture. Pages: `'controls'`, `'navigate'`, `'info'`.

Key methods in `SceneManager`:
- `_positionMenuAtEyeLevel()` — reads `camera.position.y` + HMD forward direction; no hardcoded y-offset
- `_billboardVRPanel()` — `lookAt` + strip pitch/roll so panel stays vertical (yaw only)
- `_showVRInfoOverlay()` — switch to info page, reposition panel to user's right side after nav
- X-button toggle calls `_positionMenuAtEyeLevel()` (not a hardcoded position)
- Right grip drags the panel (`vrPanelDrag` state); `updateXRMovement` moves panel while grip held; `onSqueezeEnd` re-billboards

### VR Controller Layout (Meta Quest)
- Left: btn0=trigger, btn1=grip, btn3=thumbstick, btn4=X, btn5=Y
- Right: btn0=trigger, btn1=grip, btn3=thumbstick, btn4=A, btn5=B
- **X button:** menu toggle | **Left grip:** grab-to-rotate scene | **Right grip:** drag UI panel (if visible)

### Hot-Path Performance
Pre-allocated scratch vectors live in the `SceneManager` constructor — **never call `.clone()` inside the animate loop**:
```javascript
this._vrMoveScratch.copy(cameraForward).multiplyScalar(-stickY * speed);
this.dolly.position.add(this._vrMoveScratch);
```
Controller mesh refs are stored in `controller.userData.laserMesh / pointerMesh / coneMesh` at init time — **never call `getObjectByName` in `updateLaserPointers`**. Use `_setLasersVisible(visible)` helper.

### Render Loop Safety
`animate(callback)` uses **three separate try/catch blocks** (controls update, callback, render) so `renderer.render()` always runs even if the callback throws. VR errors always log regardless of `DEBUG.enabled`.

### Critical Gotchas
- `logarithmicDepthBuffer` is **disabled on mobile/Quest** (see `CONFIG.RENDERER`) — `EXT_frag_depth` fails inside the WebXR framebuffer on Quest, making all objects render black
- `previousButtonStates` resets at XR `sessionstart` (not per-frame) to handle hand-tracking adding >2 input sources mid-session
- `focusOnObject()` in `SolarSystemModule` animates `camera.position` — in VR this is ignored; call `teleportVRToObject()` in addition

## Debug URL Parameters
| Param | Effect |
|---|---|
| `?debug` | General verbose logging |
| `?debug-vr` | VR event + locomotion logs; checked via `DEBUG.VR` |
| `?debug-textures` | Texture load/fallback details |
| `?debug-performance` | FPS counter, cache hit/miss stats |
| `?emulate-vr` | Desktop VR emulation — camera at headset spawn, diagnostic HUD overlay |

## Development Workflows

### Running Locally
```powershell
python -m http.server 8000        # or: npx http-server -p 8000
```
HTTPS is required for Service Workers, PWA install prompts, and WebXR. Use Netlify/Vercel for full PWA+VR testing (configs: `netlify.toml`, `vercel.json`).

### File Change Impact Matrix
| Change Type | Required Action |
|---|---|
| Any `.js` / `.css` module | Bump `CACHE_VERSION` in `sw.js` |
| New texture file | Add path to `STATIC_CACHE_FILES` in `sw.js` |
| New JS module | Import in `index.html`, add to SW cache |
| i18n text changes | Update all 6 `manifest.*.json` files |
| New icons | Update `browserconfig.xml` + all manifests |

## Code Conventions

### Coordinate Systems
- **Cartesian (x, y, z):** Three.js 3D space
- **Spherical (RA, Dec):** Astronomical — RA 0–360° eastward, Dec −90° to +90°
- Convert: `CoordinateUtils.sphericalToCartesian(ra, dec, distance)`

### Astronomical Data
Use real values from NASA JPL:
```javascript
earth: { rotationPeriod: 23.93, axialTilt: 23.44, orbitalPeriod: 365.25 }
```

### Material & Geometry Factories (`utils.js`) — always use these, not raw constructors
```javascript
MaterialFactory.createEmissiveMaterial(color, intensity) // Stars, Sun
MaterialFactory.createReflectiveMaterial(texture)        // Planets
GeometryFactory.getSphereGeometry(radius, segments)      // Cached — prevents leaks
```

### Mobile / Quality Adaptation
```javascript
CONFIG.QUALITY.textureSize    // IS_MOBILE ? 1024 : 4096
CONFIG.QUALITY.sphereSegments // IS_MOBILE ? 32 : 128
Math.min(deltaTime, CONFIG.PERFORMANCE.maxDeltaTime) // Prevent spiral of death
```

### i18n Pattern
- Translations: `src/i18n.js` (6 languages: en, nl, fr, de, es, pt)
- HTML: `data-i18n="keyName"` attributes
- JS: `const t = window.t || ((key) => key);`
- Escape apostrophes in single-quoted strings: `l\'envers`, `n\'a`, `qu\'il`

## Adding a New Celestial Object
1. Add orbital/physical data in `SolarSystemModule.js`
2. Create `createXTextureReal(size)` using `loadTextureWithFallback`
3. Add procedural fallback to `TextureGeneratorUtils` in `utils.js`
4. Add to navigation dropdown in `index.html`
5. Bump SW cache version in `sw.js`

## Encoding Rules
- **All files: UTF-8 without BOM**
- PowerShell write: `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`
- Watch for garbled patterns in `src/i18n.js`: `Ã©`→`é`, `Ã¼`→`ü`, `cÅ"ur`→`cœur`, `â»×¹â´`→`⁻¹⁴`

## Pre-Coding Checklist
1. Touching a cached file? → bump `CACHE_VERSION` in `sw.js`
2. VR movement/teleport? → use `dolly`, never `camera.position`
3. In the animate hot path? → use pre-allocated scratch vectors, no `.clone()`
4. New texture? → self-hosted + procedural fallback, never CDN
5. Works on mobile/Quest? → check `IS_MOBILE`; avoid `logarithmicDepthBuffer` side-effects
6. i18n text with special chars? → verify UTF-8, escape apostrophes

---

**Last Updated:** February 20, 2026 | **SW Version:** 2.6.3 | **Three.js:** v0.160.0
```