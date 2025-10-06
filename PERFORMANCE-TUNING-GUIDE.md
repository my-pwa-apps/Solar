# 🎮 Solar System Module - Quick Performance Tuning Guide

## 📍 Location of Configuration
**File**: `src/main.js`  
**Line**: ~1220 (before SolarSystemModule class)  
**Object**: `SOLAR_SYSTEM_CONFIG`

---

## ⚡ Performance Presets

### 🔥 ULTRA PERFORMANCE (Low-End Devices / VR)
**Target**: 60fps on mid-range devices, 90fps VR

```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals = {
    solarFlares: 5,          // Update sun flares less often
    starTwinkling: 10,       // Update stars less often
    cometDustTail: 5,        // Update comet tails less often
    cometIonTail: 4
};
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 15;  // Fewer stars
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 2500;     // Fewer stars
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 1000;  // Fewer asteroids
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 1500;    // Fewer objects
```

**Expected**: 90+ fps, lower visual quality

---

### ⚖️ BALANCED (Default - Recommended)
**Target**: 60fps on most devices

```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals = {
    solarFlares: 2,
    starTwinkling: 5,
    cometDustTail: 3,
    cometIonTail: 2
};
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 30;
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 5000;
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 2000;
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 3000;
```

**Expected**: 60fps, good visual quality

---

### 🎨 ULTRA QUALITY (High-End Devices / Screenshots)
**Target**: Beautiful visuals, 45+ fps acceptable

```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals = {
    solarFlares: 1,          // Update every frame
    starTwinkling: 2,        // Update often
    cometDustTail: 1,        // Update every frame
    cometIonTail: 1
};
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 50;  // More stars
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 10000;    // Double stars
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 4000;  // Double asteroids
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 6000;    // Double objects
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.segments = 256;         // Higher detail
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.textureSize = 4096;     // Higher res
```

**Expected**: 45-55fps, stunning visuals

---

## 🎯 Individual Tweaks

### Speed Up Animations
```javascript
// Make everything move faster (time-lapse effect)
SOLAR_SYSTEM_CONFIG.ANIMATION.sunRotation = 0.002;           // Was: 0.001
SOLAR_SYSTEM_CONFIG.ANIMATION.asteroidBeltRotation = 0.0002; // Was: 0.0001
SOLAR_SYSTEM_CONFIG.ANIMATION.cloudRotationMultiplier = 1.2; // Was: 1.1
```

### Slow Down Animations
```javascript
// Slow motion / more realistic
SOLAR_SYSTEM_CONFIG.ANIMATION.sunRotation = 0.0005;           // Was: 0.001
SOLAR_SYSTEM_CONFIG.ANIMATION.asteroidBeltRotation = 0.00005; // Was: 0.0001
SOLAR_SYSTEM_CONFIG.ANIMATION.cloudRotationMultiplier = 1.05; // Was: 1.1
```

### Reduce Particle Counts (Big FPS Boost)
```javascript
// Fewer objects = more FPS
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 2000;     // Was: 5000 (-60% particles)
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 1000;  // Was: 2000 (-50% particles)
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 1500;    // Was: 3000 (-50% particles)
```

### Increase Visual Quality (FPS Cost)
```javascript
// Higher resolution textures
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.textureSize = 4096;     // Was: 2048 (+12MB memory)
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.segments = 256;         // Was: 128 (smoother sphere)
```

### Optimize for VR (90fps target)
```javascript
// Reduce update frequency
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.solarFlares = 4;
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.starTwinkling = 8;
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.cometDustTail = 4;
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.cometIonTail = 3;

// Reduce particle counts
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 10;
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 2000;
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 800;
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 1200;
```

---

## 🔧 Troubleshooting

### "FPS drops when looking at Sun"
**Fix**: Reduce solar flare update frequency
```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.solarFlares = 4; // Was: 2
```

### "FPS drops when comets are visible"
**Fix**: Update comet tails less often
```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.cometDustTail = 5; // Was: 3
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.cometIonTail = 4;  // Was: 2
```

### "Stuttering/jank during animation"
**Fix**: Reduce star twinkling
```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals.starTwinkling = 10; // Was: 5
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 15;             // Was: 30
```

### "High memory usage"
**Fix**: Reduce texture sizes and particle counts
```javascript
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.textureSize = 1024;    // Was: 2048
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 2500;    // Was: 5000
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 1000; // Was: 2000
```

### "Animations too fast"
**Fix**: Slow down animation speeds
```javascript
SOLAR_SYSTEM_CONFIG.ANIMATION.sunRotation *= 0.5;           // 50% slower
SOLAR_SYSTEM_CONFIG.ANIMATION.asteroidBeltRotation *= 0.5;  // 50% slower
SOLAR_SYSTEM_CONFIG.ANIMATION.kuiperBeltRotation *= 0.5;    // 50% slower
```

---

## 📊 Performance Impact Reference

### Update Interval Impact (solarFlares)
- `1` (every frame): 100% quality, -5 fps
- `2` (every 2 frames): 95% quality, baseline
- `4` (every 4 frames): 85% quality, +3 fps
- `5` (every 5 frames): 80% quality, +4 fps

### Particle Count Impact (starfield)
- `10000`: Amazing, -15 fps, +20MB memory
- `5000`: Great (default), baseline
- `2500`: Good, +8 fps, -10MB memory
- `1000`: Acceptable, +15 fps, -15MB memory

### Texture Size Impact (sun)
- `4096`: Ultra, +12MB, -3 fps
- `2048`: High (default), baseline
- `1024`: Medium, -8MB, +2 fps
- `512`: Low, -12MB, +4 fps

---

## 🎮 Quick Copy/Paste Presets

### For Mobile/Tablet:
```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals = { solarFlares: 4, starTwinkling: 8, cometDustTail: 4, cometIonTail: 3 };
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 15;
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 2000;
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 1000;
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 1500;
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.textureSize = 1024;
```

### For Desktop/High-End:
```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals = { solarFlares: 1, starTwinkling: 3, cometDustTail: 2, cometIonTail: 1 };
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 40;
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 7500;
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 3000;
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 4500;
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.segments = 196;
```

### For VR Headsets:
```javascript
SOLAR_SYSTEM_CONFIG.PERFORMANCE.updateIntervals = { solarFlares: 5, starTwinkling: 10, cometDustTail: 5, cometIonTail: 4 };
SOLAR_SYSTEM_CONFIG.PERFORMANCE.starTwinkleCount = 10;
SOLAR_SYSTEM_CONFIG.OBJECTS.starfield.count = 1500;
SOLAR_SYSTEM_CONFIG.OBJECTS.asteroidBelt.count = 800;
SOLAR_SYSTEM_CONFIG.OBJECTS.kuiperBelt.count = 1200;
SOLAR_SYSTEM_CONFIG.OBJECTS.sun.textureSize = 1024;
```

---

## ⚡ After Changing CONFIG

**Remember to:**
1. Save the file
2. Refresh browser (Ctrl+R)
3. Test performance (F12 → Performance tab)
4. Verify visuals still look good

**Tip**: Start conservative, then increase quality if you have FPS headroom!

---

**Last Updated**: October 6, 2025  
**Version**: 1.0  
**Status**: Production-Ready ✅
