# Space Voyage - AI Coding Agent Instructions

## Project Overview

**Space Voyage** is an educational Progressive Web App providing an immersive 3D Solar System experience with VR/AR support. Built with vanilla ES6 modules and Three.js, it features 100+ celestial objects, scientifically accurate orbits, and complete offline functionality.

**Key Stats:** ~9,000 LOC | 10+ Web APIs | PWA Score 100/100 | Zero build tools required

## Architecture Principles

### 1. Pure ES6 Modules (No Build Step)
- **No bundlers:** Direct ES6 module imports, runs natively in browsers
- **ImportMap:** Three.js loaded via CDN importmap in `index.html`
- **Module structure:** Clear separation - each module is a singleton class
- Cache busting via query params: `?v=2.2.4` on static imports

### 2. Modular Design Pattern
All modules follow a consistent singleton pattern:

```javascript
class MyModule {
  constructor() { /* private initialization */ }
  init() { /* public setup, called explicitly */ }
}
export const myModule = new MyModule(); // singleton export
```

**Module Hierarchy:**
- `main.js` → Entry point, creates App class
- `SceneManager.js` → Three.js scene/camera/renderer/controls/XR
- `SolarSystemModule.js` → 8,874 lines - celestial objects, orbits, textures
- `UIManager.js` → UI controls, info panels, loading screens
- `TextureCache.js` → IndexedDB caching for textures
- `utils.js` → Shared constants, geometry factories, material factories
- `PanelManager.js` → Draggable panel logic
- `PWAManager.js` → Install prompts, platform detection, offline mode
- `ServiceWorkerManager.js` → SW registration, update detection
- `LanguageManager.js` → i18n detection, manifest switching (6 languages)

### 3. Texture Management Strategy
**Critical for performance:** Textures use a 3-tier fallback system:
1. **Self-hosted** (`./textures/planets/`) - Primary, cached by SW
2. **Procedural generation** (`TextureGeneratorUtils`) - Fallback for missing textures
3. **Cache-first:** IndexedDB + memory cache via `TextureCache.js`

**Never add external CDN textures** - project migrated to self-hosted for reliability (see `TEXTURE_MIGRATION_COMPLETE.md`).

### 4. Service Worker Caching (v2.2.6)
- **Strategy:** Cache-first for static assets, network-first for HTML
- **Version bumping:** Update `CACHE_VERSION` in `sw.js` when modifying cached files
- **Critical files:** All modules, textures (12 planets/moons), icons, styles
- **Testing:** Always test SW updates with hard refresh (Ctrl+Shift+R)

## Development Workflows

### Running Locally
```powershell
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server -p 8000

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

**HTTPS Required for:**
- Service Workers
- PWA install prompts
- WebXR (VR/AR) features

Use Netlify/Vercel for testing PWA features (configs included: `netlify.toml`, `vercel.json`).

### Testing Checklist
1. **Console:** Check for errors, verify SW version logs
2. **Textures:** Inspect planets (Sun → Neptune) for texture loading
3. **Offline:** Load page, disconnect network, hard refresh
4. **Performance:** Enable FPS counter with `?debug-performance=true`
5. **Mobile:** Test responsive UI, touch controls
6. **VR:** Test in Meta Quest browser if available

### Debug Modes (URL Parameters)
- `?debug=true` - General debug logging
- `?debug-vr=true` - VR/XR-specific logs
- `?debug-textures=true` - Texture loading details
- `?debug-performance=true` - Performance metrics, cache hits/misses

### Documentation Pattern
**Every significant change requires a markdown summary:**
- Place in root directory with descriptive name (e.g., `TEXTURE_MIGRATION_COMPLETE.md`)
- Include: Problem, Solution, Files Changed, Testing Steps, Before/After metrics
- See existing docs as templates: `ASTRONOMICAL_ACCURACY_FIX.md`, `COMPLETE_MODULARIZATION_SUMMARY.md`

## Code Conventions

### Coordinate Systems
1. **Cartesian (x, y, z):** Three.js 3D positions
2. **Spherical (RA, Dec):** Astronomical coordinates for stars/constellations/nebulae
   - RA (Right Ascension): 0-360°, eastward angle
   - Dec (Declination): -90° to +90°, north/south angle
   - Convert via `CoordinateUtils.sphericalToCartesian(ra, dec, distance)`

**Example:**
```javascript
// Orion Nebula positioned in Orion's sword
{ name: 'Orion Nebula', ra: 83.8, dec: -5.4, size: 400 }
// Converted to 3D at CONSTELLATION.DISTANCE * 1.5
```

### Material & Geometry Factories
**Always use factory functions from `utils.js`:**
- `MaterialFactory.createEmissiveMaterial(color, emissiveIntensity)` - Stars, Sun
- `MaterialFactory.createReflectiveMaterial(texture)` - Planets
- `GeometryFactory.getSphereGeometry(radius, segments)` - Cached geometries

**Why:** Prevents memory leaks through geometry/material reuse.

### Astronomical Data Structure
Planetary data uses real astronomical values:
```javascript
this.ASTRONOMICAL_DATA = {
  earth: {
    rotationPeriod: 23.93,  // hours (day length)
    axialTilt: 23.44,       // degrees
    retrograde: false,
    orbitalPeriod: 365.25   // Earth days
  }
}
```
**Source accuracy matters** - verify against NASA JPL when adding objects.

### i18n Pattern
- Translations in `src/i18n.js` with 6 languages (en, nl, fr, de, es, pt)
- HTML elements use `data-i18n="keyName"` attributes
- JavaScript: `const t = window.t || ((key) => key);`
- Language-specific manifests: `manifest.en.json`, `manifest.nl.json`, etc.

## Common Tasks

### Adding a New Celestial Object
1. Add data to appropriate section in `SolarSystemModule.js` (planets/moons/dwarf planets)
2. Create texture method: `createXTextureReal(size)` with self-hosted path
3. Add procedural fallback in utils.js `TextureGeneratorUtils`
4. Add to navigation dropdown in `index.html`
5. Test texture loading and info panel display

### Modifying Service Worker
1. Update version: `const CACHE_VERSION = '2.2.7';`
2. Add new files to `STATIC_CACHE_FILES` array
3. Test: Hard refresh, check console for new version activation
4. Verify: DevTools → Application → Service Workers

### Performance Optimization
- **Mobile detection:** `IS_MOBILE`, `IS_LOW_POWER` constants adjust quality
- **Adaptive quality:** Lower texture sizes, geometry segments on mobile
- **Geometry caching:** Use `this.geometryCache.get(key)` to reuse geometries
- **Delta time clamping:** `Math.min(deltaTime, CONFIG.PERFORMANCE.maxDeltaTime)` prevents spiral of death

### VR/XR Features
- XR setup in `SceneManager.js` via `setupWebXR()`
- Controllers use factory models from Three.js
- Movement via thumbsticks: forward/back/strafe/turn
- Laser pointer raycasting for object selection
- Test URL param: `?vr=true` for direct VR entry

## Project-Specific Gotchas

1. **Three.js version locked:** v0.160.0 - Don't upgrade without extensive testing
2. **Windows PowerShell scripts:** `.ps1` files for texture downloads (e.g., `download-textures.ps1`)
3. **Search engine blocking:** `<meta name="robots" content="noindex">` - Paid app in Microsoft Store
4. **Favicon complexity:** Uses Windows 11 unplated icons for taskbar, multiple sizes for compatibility
5. **Educational vs Realistic scale:** Two distance modes - toggle affects camera limits and object spacing
6. **Procedural textures run on first frame:** Lazy generation via `cachedTextureGeneration(key, fn)`

## File Change Impact Matrix

| Change Type | Update Required |
|-------------|-----------------|
| Module code | Bump `sw.js` cache version |
| Texture files | Add to `STATIC_CACHE_FILES` in `sw.js` |
| New module | Import in `index.html`, add to SW cache |
| CSS changes | Cache version bump in `sw.js` |
| i18n updates | Update all 6 `manifest.*.json` files |
| New icons | Update `browserconfig.xml` + manifests |

## Examples from Codebase

### Pattern: Astronomical Accuracy
When positioning nebulae/stars, use real RA/Dec coordinates:
```javascript
// From ASTRONOMICAL_ACCURACY_FIX.md
// Orion Nebula (M42) in Orion's sword
{ name: 'Orion Nebula', ra: 83.8, dec: -5.4 }
// Near Orion's belt stars (RA ~83-85°, Dec ~-1°)
```

### Pattern: Texture Loading with Fallback
```javascript
createEarthTextureReal(size) {
  const primary = ['./textures/planets/earth_1k.jpg'];
  return this.loadTextureWithFallback(
    primary,
    () => TextureGeneratorUtils.generateEarthTexture(size)
  );
}
```

### Pattern: Configuration Adaptation
```javascript
export const CONFIG = {
  QUALITY: {
    textureSize: IS_MOBILE ? 1024 : 4096,
    sphereSegments: IS_MOBILE ? 32 : 128,
    particleCount: IS_MOBILE ? 1000 : 5000
  }
};
```

## Resources

- **Three.js Docs:** https://threejs.org/docs/
- **WebXR Spec:** https://immersiveweb.dev/
- **PWA Checklist:** https://www.pwabuilder.com/
- **NASA JPL Data:** https://ssd.jpl.nasa.gov/ (orbital elements)
- **Astronomical Coords:** https://en.wikipedia.org/wiki/Equatorial_coordinate_system

## Encoding & Character Guidelines

### File Encoding
- **All files must be UTF-8 without BOM**
- Use PowerShell to verify/fix: `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`

### i18n.js Special Characters
The translation file (`src/i18n.js`) contains 6 languages with special characters. Watch for:

**Garbled Character Patterns (encoding corruption):**
| Corrupted | Correct | Description |
|-----------|---------|-------------|
| `â»×¹â´` | `⁻¹⁴` | Superscript -14 (scientific notation) |
| `cÅ"ur` | `cœur` | French œ ligature (heart) |
| `Å"il` | `œil` | French œ ligature (eye) |
| `Ã©` | `é` | French/Spanish accented e |
| `Ã¨` | `è` | French accented e |
| `Ã¼` | `ü` | German umlaut |
| `Ã¶` | `ö` | German umlaut |
| `Ã¤` | `ä` | German umlaut |
| `Ã±` | `ñ` | Spanish ñ |
| `Ã§` | `ç` | French/Portuguese cedilla |

**JavaScript String Escaping:**
- Always escape apostrophes in single-quoted strings: `l\'envers` not `l'envers`
- French text is especially prone to this: `n\'a`, `l\'une`, `qu\'il`

**Verification Commands (PowerShell):**
```powershell
# Check for garbled patterns
$content = [System.IO.File]::ReadAllText("src/i18n.js")
$content.Contains("â»×¹â´")  # Should be False
$content.Contains("Å""")     # Should be False

# Fix garbled text (example)
$content = $content.Replace("â»×¹â´", "⁻¹⁴")
[System.IO.File]::WriteAllText("src/i18n.js", $content, [System.Text.UTF8Encoding]::new($false))
```

**Valid Special Characters in Project:**
- `°` (degree symbol) - temperatures, coordinates
- `œ` (French ligature) - cœur, œil
- `⁻¹⁴` (superscript) - scientific notation
- `×` (multiplication) - dimensions
- `μ` (micro) - micrometers
- `²` `³` (superscripts) - area, volume

## Questions to Ask Before Coding

1. **Does this change require a Service Worker version bump?** (Yes if modifying cached files)
2. **Is this scientifically accurate?** (Check NASA JPL for orbital data)
3. **Will this work offline?** (Textures must be self-hosted or procedural)
4. **Does this work on mobile?** (Test touch controls, performance)
5. **Is there existing documentation to update?** (Check root `.md` files)
6. **Does i18n text contain special characters?** (Verify encoding, escape apostrophes)

---

**Last Updated:** January 16, 2026 | **Project Version:** 2.2.6 | **AI Agent:** GitHub Copilot
