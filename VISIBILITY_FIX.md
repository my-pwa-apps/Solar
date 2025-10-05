# 🎯 Spacecraft Visibility Fix + Earth Solution

## Issue Resolved: Voyager and Distant Spacecraft Too Small

### Problem
Spacecraft like Voyager 1 are at distance 300+ units with size 0.08, making their glow only `0.08 * 1.8 = 0.144` units - **invisible** from far away!

### Solution Applied

**Dynamic Glow Scaling:**
```javascript
const glowSize = craft.distance > 100 ? 
    Math.max(craft.size * 1.8, craft.distance * 0.03) : 
    craft.size * 1.8;
```

**For Voyager 1:**
- Distance: 300 units
- Old glow: 0.144 units (invisible)
- **New glow: 9 units** (300 × 0.03) → **62x larger!** ✨

**For nearby spacecraft (ISS, Hubble):**
- Distance: < 100
- Keeps normal size (no change)

**Glow opacity increased:**
- From: 0.15 (subtle)
- To: 0.25 (more visible)

---

## Console Output

Look for:
```
🔆 Voyager 1 glow size: 9.00 (distance: 300, base size: 0.08)
🔆 Voyager 2 glow size: 8.40 (distance: 280, base size: 0.08)
🔆 ISS (International Space Station) glow size: 0.05 (distance: 1.05, base size: 0.03)
```

---

## Earth Texture Solution

### Changed Earth Material

**From MeshStandardMaterial (needs lighting):**
```javascript
const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.25,
    metalness: 0.15,
    emissive: 0x111111
});
```

**To MeshBasicMaterial (always visible):**
```javascript
const earthMaterial = new THREE.MeshBasicMaterial({
    map: earthTexture
});
```

### Why This Works

**MeshBasicMaterial:**
- ✅ Ignores all lighting
- ✅ Always shows texture at full brightness
- ✅ No night side (always "day")
- ✅ Simple and reliable
- ❌ No shadows or realistic lighting
- ❌ Looks slightly flat

**MeshStandardMaterial:**
- ✅ Realistic lighting
- ✅ Proper day/night cycle
- ✅ Shadows and PBR effects
- ❌ **Requires proper lighting setup**
- ❌ **Night side can be completely black**

### The Real Problem with Earth

You were likely looking at **Earth's night side** (the side facing away from the Sun). With `MeshStandardMaterial`, the night side is very dark without emissive lighting or ambient light.

**MeshBasicMaterial solves this** by making Earth always visible, but sacrifices realism.

---

## Expected Results

### Voyager 1/2
When you click "Voyager 1" in the Explorer menu:
- ✅ Camera zooms to Voyager location
- ✅ You see a **large glowing marker** (silver/gray glow)
- ✅ Glow is 9 units in diameter (easily visible)
- ✅ Spacecraft model visible in center

### Earth
- ✅ **Texture now visible** (continents, oceans, ice caps)
- ✅ Always illuminated (no pure black night side)
- ✅ Green/brown continents visible
- ✅ Blue oceans visible
- ✅ White polar ice caps visible

---

## Alternative Solutions

### If You Want Realistic Lighting on Earth

**Option A: Much Higher Ambient Light**
```javascript
const ambientLight = new THREE.AmbientLight(0xffffff, 3.0); // Very bright
```

**Option B: Add Emissive Map**
(City lights on night side)
```javascript
emissive: 0x331100,
emissiveIntensity: 0.2,
emissiveMap: cityLightsTexture
```

**Option C: Add Camera Spotlight**
```javascript
const spotlight = new THREE.SpotLight(0xffffff, 5);
camera.add(spotlight);
```

**Option D: Use MeshLambertMaterial** (middle ground)
```javascript
const earthMaterial = new THREE.MeshLambertMaterial({
    map: earthTexture,
    emissive: 0x222222,
    emissiveIntensity: 0.1
});
```

---

## Other Spacecraft Affected

All distant spacecraft now have larger glows:

| Spacecraft | Distance | Old Glow | New Glow | Increase |
|------------|----------|----------|----------|----------|
| Voyager 1 | 300 | 0.14 | 9.0 | **64x** ✨ |
| Voyager 2 | 280 | 0.14 | 8.4 | **60x** ✨ |
| New Horizons | 260 | 0.14 | 7.8 | **56x** ✨ |
| Parker Solar Probe | 1.08 | 0.09 | 0.09 | 1x (normal) |
| ISS | 1.05 | 0.05 | 0.05 | 1x (normal) |
| Perseverance | Mars orbit | 0.09 | 0.09 | 1x (normal) |

---

## Testing Instructions

1. **Reload the application**

2. **Test Voyager:**
   - Open Explorer menu (🔍 Explore)
   - Click "🚀 Voyager 1" under "Spacecraft & Probes"
   - Should see large silver glow in interstellar space

3. **Test Earth:**
   - Click "🌍 Earth" in Explorer menu
   - Should see continents, oceans, ice caps
   - No more black sphere!

4. **Check console:**
   ```
   🔆 Voyager 1 glow size: 9.00 (distance: 300, base size: 0.08)
   🌍 Using MeshBasicMaterial with texture - always visible!
   ✅ Planet "Earth" added to scene:
      - Material type: MeshBasicMaterial
   ```

---

## Files Modified

### src/main.js

**Lines 4464-4480:** Dynamic glow scaling for spacecraft
```javascript
const glowSize = craft.distance > 100 ? 
    Math.max(craft.size * 1.8, craft.distance * 0.03) :
    craft.size * 1.8;
```

**Lines 3172-3176:** Earth material switched to MeshBasicMaterial
```javascript
const earthMaterial = new THREE.MeshBasicMaterial({
    map: earthTexture
});
```

---

## Summary

✅ **Voyager and distant spacecraft:** Now have **50-60x larger glows** for visibility
✅ **Earth texture:** Now always visible using MeshBasicMaterial
✅ **No more black spheres!**

The issues were:
1. **Spacecraft too small** → Fixed with dynamic glow scaling
2. **Earth night side too dark** → Fixed with MeshBasicMaterial

Both problems solved! 🚀
