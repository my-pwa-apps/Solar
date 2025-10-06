# 🌗 Lighting Balance Adjustment - October 6, 2025

## User Feedback
**Issue**: "The daylight is a bit too bright. It causes the textures to be too bright and visibility is worse. On the dark side it should be not completely dark, so the planets are still visible, but dark"

## Problem Analysis

### Before (Too Bright)
- ☀️ **Sun intensity**: 25 (too bright, washed out textures)
- 🌙 **Ambient light**: 0.15 (dark sides TOO dark)
- 🎨 **Tone mapping exposure**: 1.5 (overexposed)
- **Result**: 
  - Day sides: Textures washed out, too much glare
  - Night sides: Too dark, hard to see planets
  - Overall: Poor visibility

## Solution: Balanced Lighting

### After (Balanced)
```javascript
// Sun Light (Primary)
const sunLight = new THREE.PointLight(0xFFFAE8, 15, 0, 0);
// Color: Warm white (0xFFFAE8) instead of bright yellow
// Intensity: 15 (down from 25 = -40%)

// Ambient Light (Dark sides)
const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.35);
// Color: Dark blue-grey (space environment)
// Intensity: 0.35 (up from 0.15 = +133%)

// Scene Lighting
ambient: 0x1a1a28, intensity 0.08 (up from 0.05)
hemisphere: 0x2a2a44/0x0a0a0f, intensity 0.05 (up from 0.02)
camera: 0x5577bb, intensity 0.3 (up from 0.2)

// Tone Mapping
toneMappingExposure: 1.2 (down from 1.5 = -20%)
```

## Changes Summary

### ✅ 1. Sun Light - Reduced Brightness
```javascript
// BEFORE:
const sunLight = new THREE.PointLight(0xFFFFE0, 25, 0, 0);

// AFTER:
const sunLight = new THREE.PointLight(0xFFFAE8, 15, 0, 0);
```
**Changes:**
- ⬇️ **Intensity: 25 → 15** (-40% brightness)
- 🎨 **Color: 0xFFFFE0 → 0xFFFAE8** (bright yellow → warm white)
- **Impact**: Textures more visible, less washed out

### ✅ 2. Ambient Light - Increased Visibility
```javascript
// BEFORE:
const ambientLight = new THREE.AmbientLight(0x111122, 0.15);

// AFTER:
const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.35);
```
**Changes:**
- ⬆️ **Intensity: 0.15 → 0.35** (+133% more light)
- 🎨 **Color: 0x111122 → 0x1a1a2e** (very dark → dark blue-grey)
- **Impact**: Dark sides visible but still clearly dark

### ✅ 3. Scene Lighting - Enhanced Subtly
```javascript
// BEFORE:
ambient: new THREE.AmbientLight(0x0a0a0f, 0.05)
hemisphere: new THREE.HemisphereLight(0x111122, 0x000000, 0.02)
camera: new THREE.PointLight(0x4466ff, 0.2, 500)

// AFTER:
ambient: new THREE.AmbientLight(0x1a1a28, 0.08)
hemisphere: new THREE.HemisphereLight(0x2a2a44, 0x0a0a0f, 0.05)
camera: new THREE.PointLight(0x5577bb, 0.3, 600)
```
**Changes:**
- ⬆️ **Scene ambient: 0.05 → 0.08** (+60%)
- ⬆️ **Hemisphere: 0.02 → 0.05** (+150%)
- ⬆️ **Camera light: 0.2 → 0.3** (+50%)
- ⬆️ **Camera range: 500 → 600** (+20%)
- **Impact**: Better navigation, dark sides visible

### ✅ 4. Tone Mapping - Reduced Exposure
```javascript
// BEFORE:
this.renderer.toneMappingExposure = 1.5;

// AFTER:
this.renderer.toneMappingExposure = 1.2;
```
**Changes:**
- ⬇️ **Exposure: 1.5 → 1.2** (-20%)
- **Impact**: Less overexposure, better texture detail

## Expected Results

### 🌍 Day Side (Lit by Sun)
- ✅ **Brightness**: Moderate, not washed out
- ✅ **Textures**: Clearly visible with detail
- ✅ **Colors**: Rich and saturated
- ✅ **Contrast**: Good depth and dimensionality
- ✅ **No glare**: Comfortable to view

### 🌑 Night Side (Dark Side)
- ✅ **Visibility**: Can see planet shape and features
- ✅ **Darkness**: Still clearly darker than day side
- ✅ **Navigation**: Easy to rotate camera around
- ✅ **Not black**: Subtle blue-grey ambient glow
- ✅ **Realistic**: Looks like space with starlight

### 🌗 Terminator Line (Day/Night Border)
- ✅ **Clear boundary**: Visible transition
- ✅ **Gradual**: Natural falloff
- ✅ **3D effect**: Shows planet curvature
- ✅ **Shadows**: Proper depth perception

### 🌑 Eclipses & Shadows
- ✅ **Still work**: 4K shadow maps remain
- ✅ **Visible**: Can see eclipse shadows clearly
- ✅ **Contrast**: Dark enough to be dramatic
- ✅ **Navigation**: Can still see affected planets

## Lighting Breakdown

### Total Light Contributions (Approximate)

**Day Side:**
- Sun direct light: **15** (primary)
- Ambient: **0.35**
- Scene ambient: **0.08**
- Hemisphere sky: **0.05**
- Camera light: **0.3** (when close)
- **Total day side: ~15.78** (mostly from sun)

**Night Side:**
- Sun direct light: **0** (blocked)
- Ambient: **0.35**
- Scene ambient: **0.08**
- Hemisphere ground: **~0.01**
- Camera light: **0.3** (when close)
- **Total night side: ~0.74** (dim but visible)

**Day/Night Ratio: ~21:1** (strong contrast but both visible)

## Technical Details

### Light Source Configuration

1. **Sun PointLight** (Primary Light)
   - Position: (0, 0, 0) - center of solar system
   - Color: 0xFFFAE8 (warm white, 5000K)
   - Intensity: 15
   - Decay: 0 (no distance falloff)
   - Shadow maps: 4096x4096 PCF Soft
   - Purpose: Main illumination, day/night cycle

2. **Solar System Ambient** (Fill Light)
   - Color: 0x1a1a2e (dark blue-grey)
   - Intensity: 0.35
   - Purpose: Make dark sides visible

3. **Scene Ambient** (Base Level)
   - Color: 0x1a1a28 (very dark blue)
   - Intensity: 0.08
   - Purpose: Prevent pure black

4. **Hemisphere Light** (Sky/Space)
   - Sky color: 0x2a2a44 (dark blue)
   - Ground color: 0x0a0a0f (nearly black)
   - Intensity: 0.05
   - Purpose: Simulate space environment

5. **Camera Light** (Viewer Fill)
   - Color: 0x5577bb (blue-tinted)
   - Intensity: 0.3
   - Distance: 600 units
   - Purpose: Close-up viewing assistance

### Tone Mapping
- **Type**: ACESFilmicToneMapping
- **Exposure**: 1.2
- **Purpose**: Natural color rendering, prevents overexposure

## Performance Impact

**No change** - lighting adjustments are intensity/color only:
- Same number of lights
- Same shadow quality (4096x4096)
- Same render passes
- **FPS**: Identical to previous version

## Validation Checklist

Test these scenarios:

### Texture Visibility
- [ ] Earth: Continents, oceans clearly visible on day side
- [ ] Mars: Red surface detail not washed out
- [ ] Jupiter: Cloud bands visible with good contrast
- [ ] Saturn: Rings show texture detail

### Dark Side Visibility
- [ ] Can see planet shape/silhouette on dark side
- [ ] Can rotate camera without losing planet
- [ ] Not completely black - subtle blue glow
- [ ] Still clearly darker than day side

### Overall Balance
- [ ] Day side bright but not glaring
- [ ] Night side dark but not invisible
- [ ] Comfortable to view for extended periods
- [ ] Colors look natural and realistic

### Contrast & Depth
- [ ] Clear terminator line (day/night border)
- [ ] 3D appearance - not flat
- [ ] Shadows look natural
- [ ] Eclipses still dramatic

## Comparison Table

| Property | Too Bright (Before) | Balanced (After) | Change |
|----------|-------------------|------------------|---------|
| **Sun Intensity** | 25 | 15 | -40% ⬇️ |
| **Sun Color** | 0xFFFFE0 (yellow) | 0xFFFAE8 (warm white) | Warmer 🎨 |
| **Ambient Intensity** | 0.15 | 0.35 | +133% ⬆️ |
| **Ambient Color** | 0x111122 | 0x1a1a2e | Lighter 🎨 |
| **Scene Ambient** | 0.05 | 0.08 | +60% ⬆️ |
| **Hemisphere** | 0.02 | 0.05 | +150% ⬆️ |
| **Camera Light** | 0.2 | 0.3 | +50% ⬆️ |
| **Tone Exposure** | 1.5 | 1.2 | -20% ⬇️ |
| **Day/Night Ratio** | ~167:1 | ~21:1 | Better balance ✅ |

## Debug Logging

Add `?debug=true` to URL for detailed info:

```
💡 Lighting: Sun intensity 15 (warm white), Ambient 0.35, Tone mapping 1.2
   - Balanced brightness: textures visible, not washed out
   - Dark sides visible but still clearly dark
   - Sun light reaches all planets without decay
   - Eclipses will cast 4K shadows

🌌 Scene ambient lighting: Subtle (ambient 0.08, hemisphere 0.05, camera 0.3)
   - Dark sides remain visible for navigation
   - Sun is still primary light source
```

## Files Modified

**src/main.js**:
1. Line ~1499: Sun light (intensity 25→15, color change)
2. Line ~1513: Ambient light (intensity 0.15→0.35, color change)
3. Line ~173-181: Scene lights (increased intensities)
4. Line ~122: Tone mapping exposure (1.5→1.2)
5. Line ~1517: Updated debug logging

## Design Philosophy

**Balance Goals:**
1. ✅ **Realism**: Space is dark but not pitch black (starlight exists)
2. ✅ **Usability**: Users can navigate without frustration
3. ✅ **Education**: Clear day/night contrast for learning
4. ✅ **Aesthetics**: Beautiful and comfortable to view
5. ✅ **Texture detail**: Planet surfaces clearly visible

**Lighting Principle:**
> "Bright enough to see detail, dark enough to feel space, balanced enough to be comfortable."

---

**Status**: ✅ COMPLETE  
**Date**: October 6, 2025  
**Impact**: Improved usability and texture visibility while maintaining day/night contrast  
**User Satisfaction**: Addresses "too bright" and "dark side invisible" feedback
