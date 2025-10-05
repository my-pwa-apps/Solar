# 🎯 Earth Stripe Test - Forcing Land Visibility

## New Diagnostic Test

Since amplifying the elevation didn't work, I've added **forced horizontal stripes** to definitively test if land rendering works at all.

## What You Should See

When you reload Earth, you should see:
- ✅ **Horizontal green/brown stripes** every 100 pixels
- ✅ These alternate with blue ocean stripes
- ✅ White poles at top and bottom

**This pattern is FORCED** - it ignores elevation values completely for the stripes.

## Why This Test?

This will tell us:

### If You See Stripes:
✅ Land rendering code WORKS
✅ Colors are correct (green, brown, tan)
✅ The problem is the elevation calculation or turbulence function
❌ But NOT the rendering itself

### If You Don't See Stripes:
❌ Something is wrong AFTER the texture generation
❌ Possibly texture not updating
❌ Possibly material override
❌ Possibly caching issue

## The Code

```javascript
// Force land in alternating horizontal stripes
const forcePattern = Math.floor(y / 100) % 2;
const forceLand = forcePattern === 0 && latNorm < 0.92;

// Land areas - FORCED TEST or elevation threshold
else if (forceLand || elevation > 1.0) {
    // Render land (green/brown)
}
```

**Result:**
- Rows 0-99: LAND (green/brown)
- Rows 100-199: OCEAN (blue)
- Rows 200-299: LAND (green/brown)
- Rows 300-399: OCEAN (blue)
- ... repeating pattern
- Top/bottom poles: ICE (white)

## Expected Console Output

Look for:
```
🌍 Earth texture generated: 50.0% land, 47.0% ocean, 3.0% ice
🌲 Greenest land pixel found: RGB(60, 180, 60) at pixel XXXX
📊 Earth elevation stats: min=X.XX, max=X.XX
```

**Key metric:** Land should be ~50% (forced stripes = half the surface)

## What This Tells Us

### Scenario A: You See Horizontal Stripes ✅
**Diagnosis:** Land rendering works perfectly!
**Problem:** The turbulence function or elevation calculation is producing values that never exceed the threshold
**Solution:** Need to investigate why turbulence() returns such low values, or use a completely different terrain generation approach

### Scenario B: No Stripes, Still All Blue ❌
**Diagnosis:** Something is breaking AFTER texture generation
**Possible causes:**
1. Canvas data gets cleared/reset
2. Texture doesn't update on GPU
3. Material gets overridden
4. Browser caching old texture

**Solution:** Need to debug texture application, not terrain generation

## If You See Stripes - Next Steps

If stripes appear, it means we need to completely replace the turbulence-based terrain generation. Options:

### Option 1: Use Simplex Noise (Better Algorithm)
```javascript
// Real Perlin/Simplex noise library
// More reliable than our custom turbulence function
```

### Option 2: Use Bitmap Image
```javascript
// Load actual Earth surface texture from file
// Guaranteed to work, most realistic
```

### Option 3: Simple Math-Based Continents
```javascript
// Use sine/cosine patterns
const elevation = 
    Math.sin(lon * 3) * 0.5 +      // 3 major continental masses
    Math.cos(lat * 2) * 0.3 +      // North-south variation
    Math.sin(lon * 20) * 0.1;      // Detail
```

### Option 4: Pre-defined Continent Shapes
```javascript
// Manually define rough continent boundaries
// Draw them as polygons/shapes
```

## If No Stripes - Debug Steps

Run in console:
```javascript
// Check the canvas directly
const canvas = window._earthTextureCanvas;
console.log('Canvas:', canvas);
console.log('Canvas size:', canvas?.width, 'x', canvas?.height);

// Get pixel data at row 50 (should be green land)
const ctx = canvas.getContext('2d');
const testPixel = ctx.getImageData(1024, 50, 1, 1).data;
console.log('Row 50 pixel (should be land):', testPixel);

// Get pixel data at row 150 (should be blue ocean)
const testPixel2 = ctx.getImageData(1024, 150, 1, 1).data;
console.log('Row 150 pixel (should be ocean):', testPixel2);

// Force material update
const earth = window.app?.topicManager?.currentModule?.planets?.earth;
if (earth?.material?.map) {
    earth.material.map.needsUpdate = true;
    earth.material.needsUpdate = true;
}
```

## Summary

**Forced stripe test** will definitively answer:
- ✅ Does land rendering code work? (green/brown colors)
- ✅ Does the texture pipeline work? (canvas → texture → material)
- ❌ Or is there a deeper issue with texture application?

**If stripes appear:** Problem is turbulence/elevation math
**If no stripes:** Problem is texture system itself

This is the ultimate diagnostic! 🎯
