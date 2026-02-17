# Startup VR & Texture Warmup Optimization (v2.5.15)

## Problem

Two quality issues remained after the previous cleanup pass:

1. `?vr=true` shortcut was parsed by `PWAManager` (`window.startupVR = true`) but never consumed by the app flow.
2. Texture warmup eagerly loaded Earth 4K bump/normal/specular canvases into memory, which can create large upfront RAM pressure on mobile and low-power devices.

## Solution

### 1) Startup VR shortcut wiring
- Added handling for `window.startupVR` in `App.startExperience()`.
- Implemented `handleStartupVRShortcut()` in `src/main.js`.
- The method retries discovery of `#VRButton` briefly and triggers the same VR entry flow as the UI button.

### 2) Texture warmup memory optimization
- Updated `src/modules/TextureCache.js` to import `IS_MOBILE` and `IS_LOW_POWER`.
- `warmupTextureCache()` now only preloads the heavy Earth bump/normal/specular 4K entries on non-mobile, non-low-power devices.
- Core textures (`earth_texture_4096`, `moon_texture_2048`, `mars_texture_2048`) are still warmed on all devices.

### 3) Cache/version consistency
- Bumped app cache/version markers from `2.5.14` to `2.5.15` in:
  - `sw.js`
  - `index.html`
  - `src/modules/LanguageManager.js`

## Files Changed

- `src/main.js`
- `src/modules/TextureCache.js`
- `src/modules/LanguageManager.js`
- `index.html`
- `sw.js`
- `STARTUP_VR_AND_TEXTURE_WARMUP_OPTIMIZATION.md` (new)

## Testing Steps

1. Start local server and open app.
2. Verify normal startup and loading behavior.
3. Open with `?planet=mars` and confirm navigation still works.
4. Open with `?vr=true` on an XR-capable browser/device and confirm VR entry is requested.
5. On mobile/low-power devices, verify app starts without extra heavy 4K map warmup logs.
6. Hard refresh (`Ctrl+Shift+R`) and confirm new Service Worker version `2.5.15` activates.

## Expected Impact

- Better startup behavior for VR shortcut users.
- Lower startup memory pressure on constrained devices.
- Correct cache invalidation for all updated assets.
