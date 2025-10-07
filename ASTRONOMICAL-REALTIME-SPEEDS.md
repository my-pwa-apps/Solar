# Astronomical Realtime Speed Implementation

## Overview
Implemented accurate astronomical orbital speeds for "Realtime" mode based on real orbital periods.

## How It Works

### Speed Modes
1. **Paused (0)**: Everything frozen
2. **Educational (1)**: Arbitrary speeds optimized for visualization and learning
3. **Realtime**: Astronomically accurate speeds where Earth completes 1 orbit in 1 real-world day

### Realtime Mode Details

**Base Multiplier**: 365.25x
- Compresses 365.25 Earth days into 1 real-world day
- Earth completes one full orbit around the Sun in 24 hours

**Speed Calculations**:
Each planet's speed is calculated as:
```
speed = (Earth's orbital period / Planet's orbital period) × base multiplier
```

### Orbital Periods (in Earth days)

| Body | Orbital Period | Relative Speed | Real-time Observation |
|------|---------------|----------------|----------------------|
| Mercury | 88 days | 4.15× Earth | Completes orbit in ~5.8 hours |
| Venus | 225 days | 1.62× Earth | Completes orbit in ~14.8 hours |
| **Earth** | 365.25 days | **1.0× (baseline)** | **Completes orbit in 24 hours** |
| Moon | 27.3 days | 13.38× Earth | Orbits Earth in ~1.8 hours |
| Mars | 687 days | 0.53× Earth | Completes orbit in ~45 hours |
| Jupiter | 4,333 days | 0.084× Earth | Completes orbit in ~11.9 days |
| Saturn | 10,759 days | 0.034× Earth | Completes orbit in ~29.5 days |
| Uranus | 30,687 days | 0.012× Earth | Completes orbit in ~84 days |
| Neptune | 60,190 days | 0.006× Earth | Completes orbit in ~165 days |
| Pluto | 90,560 days | 0.004× Earth | Completes orbit in ~248 days |

### Example: Watching Earth and Moon
In Realtime mode, you can:
- **Watch Earth orbit the Sun**: Complete orbit in exactly 24 hours
- **See Moon orbit Earth**: Complete lunar month (27.3 days) compressed to 1.8 hours
- **Observe planetary motion**: Mercury moves fastest, outer planets move very slowly

### Implementation Details

#### 1. Data Structure (lines 1635-1685)
Added `orbitalPeriod` property to `ASTRONOMICAL_DATA`:
```javascript
earth: {
    rotationPeriod: 23.93,    // hours
    axialTilt: 23.44,         // degrees
    orbitalPeriod: 365.25     // Earth days (baseline)
}
```

#### 2. Control Handler (lines 7000-7018)
Updated `setupControls()` to recognize "realtime" as a string value:
```javascript
const value = e.target.value;
if (value === 'realtime') {
    this.timeSpeed = 'realtime';
} else {
    this.timeSpeed = parseFloat(value);
}
```

#### 3. Speed Calculation (lines 5412-5452)
In `SolarSystemModule.update()`, calculate planet-specific speeds:
```javascript
if (timeSpeed === 'realtime' && planet.userData.name) {
    const planetName = planet.userData.name.toLowerCase();
    const astroData = this.ASTRONOMICAL_DATA[planetName];
    if (astroData && astroData.orbitalPeriod) {
        const earthPeriod = this.ASTRONOMICAL_DATA.earth.orbitalPeriod;
        const speedRatio = earthPeriod / astroData.orbitalPeriod;
        planetOrbitalSpeed = speedRatio * orbitalSpeed;
    }
}
```

#### 4. Moon Speeds (lines 5496-5512)
Moons also use astronomical periods (e.g., Moon orbits in 27.3 days):
```javascript
if (timeSpeed === 'realtime' && moon.userData.name) {
    const moonName = moon.userData.name.toLowerCase();
    const astroData = this.ASTRONOMICAL_DATA[moonName];
    if (astroData && astroData.orbitalPeriod) {
        const earthPeriod = this.ASTRONOMICAL_DATA.earth.orbitalPeriod;
        const speedRatio = earthPeriod / astroData.orbitalPeriod;
        moonOrbitalSpeed = speedRatio * moonSpeed;
    }
}
```

#### 5. VR Controls (lines 937-975)
Updated VR menu buttons to cycle through modes including "realtime":
```javascript
case 'speed++':
    if (app.timeSpeed === 0) {
        app.timeSpeed = 1;  // Paused → Educational
    } else if (app.timeSpeed === 1) {
        app.timeSpeed = 'realtime';  // Educational → Realtime
    } else {
        app.timeSpeed = 0;  // Realtime → Paused
    }
```

#### 6. VR UI Display (lines 1098-1158)
Updated visual mode selector to recognize "realtime" string:
```javascript
const modes = [
    { label: '⏸️ Paused', value: 0, x: sliderX },
    { label: '📚 Educational', value: 1, x: sliderX + boxW + spacing },
    { label: '⏱️ Realtime', value: 'realtime', x: sliderX + (boxW + spacing) * 2 }
];
```

### User Interface

#### Desktop Controls
- **Dropdown Menu**: Three options: Paused, Educational, Realtime
- **Keyboard Shortcuts**: 
  - `+` or `=`: Cycle modes forward
  - `-`: Cycle modes backward
  - `Space`: Toggle between Paused and Educational

#### VR Controls
- **Speed++** button: Cycle forward through modes
- **Speed--** button: Cycle backward through modes
- **Speed Reset** button: Return to Educational mode
- **Visual Indicator**: Three boxes showing current mode (highlighted in blue)

## Educational Value

### What Students Can Learn

1. **Orbital Mechanics**:
   - Inner planets (Mercury, Venus, Earth, Mars) orbit much faster than outer planets
   - The further from the Sun, the slower the orbit (Kepler's Third Law)

2. **Time Scales**:
   - Outer planets take decades to centuries to orbit the Sun
   - Jupiter: ~12 years, Saturn: ~30 years, Neptune: ~165 years

3. **Lunar Motion**:
   - Moon completes ~13 orbits around Earth in the time Earth orbits the Sun
   - This is why we have ~12-13 full moons per year

4. **Comparative Astronomy**:
   - Mercury zips around the Sun 4× faster than Earth
   - Neptune crawls at 0.6% of Earth's speed

## Technical Notes

### Why Not 1:1 Real Time?
True 1:1 real-time would require:
- Earth taking 365.25 real days to orbit
- Impossibly slow for observation and learning

Our "Realtime" mode compresses 1 year into 1 day (365.25× acceleration) while maintaining accurate relative speeds between planets.

### Precision
- All orbital periods are accurate to real astronomical data
- Speed ratios maintain correct proportions
- Moon's 27.3-day period produces ~13 orbits per Earth year

## Testing

### Verification Steps
1. **Start in Realtime mode**
2. **Focus on Earth**: Should complete one full orbit in 24 hours
3. **Watch Moon**: Should orbit Earth ~13× in the time Earth orbits Sun
4. **Observe Mercury**: Moves noticeably faster than Earth (~4×)
5. **Check Neptune**: Barely moves (would take 165 real days for full orbit)

### Expected Behavior
- ✅ Inner planets visibly orbit at different speeds
- ✅ Moon orbits Earth quickly but not unrealistically fast
- ✅ Outer planets move very slowly
- ✅ All speeds maintain correct proportions to Earth

## Credits
Implementation based on real astronomical data from NASA/JPL and IAU sources.
