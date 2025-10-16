# Texture Migration Plan - Self-Hosting Strategy

## Current External Dependencies (Audit - October 2025)

### 🔴 HIGH RISK - Unmaintained/Personal Repos

| Planet/Object | Current Source | Status | Size Est. |
|---------------|----------------|--------|-----------|
| Sun | jeromeetienne/threex.planets | ⚠️ Archived | ~500KB |
| Mercury | jeromeetienne/threex.planets | ⚠️ Archived | ~200KB |
| Venus | jeromeetienne/threex.planets | ⚠️ Archived | ~300KB |
| Earth (1K) | jeromeetienne/threex.planets | ⚠️ Archived | ~400KB |
| Mars | jeromeetienne/threex.planets | ⚠️ Archived | ~400KB |
| Jupiter | jeromeetienne/threex.planets | ⚠️ Archived | ~600KB |
| Saturn | jeromeetienne/threex.planets | ⚠️ Archived | ~500KB |
| Uranus | jeromeetienne/threex.planets | ⚠️ Archived | ~300KB |
| Neptune | jeromeetienne/threex.planets | ⚠️ Archived | ~300KB |
| Moon | jeromeetienne/threex.planets | ⚠️ Archived | ~400KB |

### 🟡 MEDIUM RISK - Active but Third-Party

| Planet/Object | Current Source | Status | Size Est. |
|---------------|----------------|--------|-----------|
| Earth (2K atmos) | mrdoob/three.js | ✅ Active | ~800KB |
| Moon (1K) | mrdoob/three.js | ✅ Active | ~400KB |
| Earth (4K) | turban/webgl-earth | ⚠️ Personal | ~2MB |
| Earth (8K) | turban/webgl-earth | ⚠️ Personal | ~8MB |

### 🔴 CRITICAL RISK - Commercial Site

| Planet/Object | Current Source | Status | Size Est. |
|---------------|----------------|--------|-----------|
| Moon (2K) | solarsystemscope.com | ⚠️ Commercial | ~1MB |

**Total Size Estimate:** ~15-20MB for all textures

---

## NASA/JPL Free Texture Sources

### Official NASA Resources:

#### 1. **NASA Solar System Exploration** (CGI Assets)
- **URL:** https://solarsystem.nasa.gov/resources/
- **License:** Public Domain (most assets)
- **Quality:** 2K-8K resolution
- **Coverage:** All planets, major moons
- **Format:** JPG, PNG, TIF

#### 2. **NASA 3D Resources**
- **URL:** https://nasa3d.arc.nasa.gov/
- **License:** Public Domain
- **Quality:** Professional grade
- **Coverage:** Planets, spacecraft, missions

#### 3. **JPL Photojournal**
- **URL:** https://photojournal.jpl.nasa.gov/
- **License:** Public Domain (unless noted)
- **Quality:** High-resolution scientific images
- **Coverage:** Raw planetary imagery

#### 4. **NASA Visible Earth**
- **URL:** https://visibleearth.nasa.gov/
- **License:** Public Domain
- **Quality:** Up to 21600x21600 (Blue Marble)
- **Coverage:** Earth only

#### 5. **USGS Astrogeology** (Best for Planetary Textures)
- **URL:** https://astrogeology.usgs.gov/search
- **License:** Public Domain
- **Quality:** Multiple resolutions (1K-16K)
- **Coverage:** All planets, moons, asteroids
- **Format:** GeoTIFF, PNG, JPG

---

## Migration Strategy

### Phase 1: Download & Backup Current Textures (IMMEDIATE)
1. Download all existing textures from external repos
2. Store in `/textures/planets/` and `/textures/moons/`
3. Maintain original filenames for tracking
4. Document sources in this file

### Phase 2: NASA Source Replacement (QUALITY UPGRADE)
1. **Priority 1:** Earth, Moon (most viewed)
2. **Priority 2:** Mars, Jupiter, Saturn (iconic)
3. **Priority 3:** Other planets
4. Download higher quality NASA/USGS alternatives
5. Test visual quality vs file size

### Phase 3: Code Migration (UPDATE REFERENCES)
1. Update `SolarSystemModule.js` texture loaders
2. Change URLs from external to relative paths
3. Maintain fallback to procedural generation
4. Update Service Worker cache list

### Phase 4: Optimization (PERFORMANCE)
1. Compress textures (lossy JPEG optimization)
2. Create multiple resolutions (1K/2K/4K)
3. Implement adaptive loading based on device
4. Update texture cache strategy

---

## Recommended NASA Sources by Planet

### ☀️ Sun
- **NASA Source:** SDO (Solar Dynamics Observatory) imagery
- **URL:** https://sdo.gsfc.nasa.gov/assets/img/browse/
- **Quality:** 4K realtime solar surface
- **License:** Public Domain

### ☿️ Mercury
- **NASA Source:** MESSENGER mission
- **USGS:** https://astrogeology.usgs.gov/search/map/Mercury/Messenger/Global/Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_665m
- **Quality:** Global mosaic
- **License:** Public Domain

### ♀️ Venus
- **NASA Source:** Magellan mission
- **USGS:** https://astrogeology.usgs.gov/search/map/Venus/Magellan/RadarProperties/Venus_Magellan_Topography_Global_4641m
- **Quality:** Radar topography
- **License:** Public Domain

### 🌍 Earth
- **NASA Source:** Blue Marble (best quality)
- **URL:** https://visibleearth.nasa.gov/images/73909/december-blue-marble-next-generation-w-topography-and-bathymetry
- **Quality:** 21600x10800 (8K equirectangular)
- **License:** Public Domain
- **Alternative:** NASA Earth Observatory

### 🌙 Moon
- **NASA Source:** LRO (Lunar Reconnaissance Orbiter)
- **USGS:** https://astrogeology.usgs.gov/search/map/Moon/LRO/LROC_WAC/Lunar_LRO_LROC-WAC_Mosaic_global_100m_June2013
- **Quality:** Global mosaic, 100m/pixel
- **License:** Public Domain

### ♂️ Mars
- **NASA Source:** MGS, MRO missions
- **USGS:** https://astrogeology.usgs.gov/search/map/Mars/Viking/MDIM21/Mars_Viking_MDIM21_ClrMosaic_global_232m
- **Quality:** Color mosaic
- **License:** Public Domain

### ♃ Jupiter
- **NASA Source:** Cassini, Juno missions
- **URL:** https://solarsystem.nasa.gov/resources/626/jupiters-great-red-spot/
- **Quality:** 2K-4K
- **License:** Public Domain

### ♄ Saturn
- **NASA Source:** Cassini mission
- **URL:** https://solarsystem.nasa.gov/resources/
- **Quality:** High-resolution mosaics
- **License:** Public Domain

### ♅ Uranus
- **NASA Source:** Voyager 2
- **URL:** https://solarsystem.nasa.gov/resources/
- **Quality:** Best available
- **License:** Public Domain

### ♆ Neptune
- **NASA Source:** Voyager 2
- **URL:** https://solarsystem.nasa.gov/resources/
- **Quality:** Best available
- **License:** Public Domain

---

## Download Script Strategy

```powershell
# Phase 1: Backup existing textures
$urls = @{
    "sunmap.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/sunmap.jpg"
    "mercurymap.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg"
    "venusmap.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg"
    "earthmap1k.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthmap1k.jpg"
    "marsmap1k.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg"
    "jupitermap.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg"
    "saturnmap.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg"
    "uranusmap.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg"
    "neptunemap.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg"
    "moonmap1k.jpg" = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg"
    "earth_atmos_2048.jpg" = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg"
    "moon_1024.jpg" = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg"
}

foreach ($file in $urls.Keys) {
    $url = $urls[$file]
    $destination = "textures/planets/$file"
    Write-Host "Downloading $file..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $destination -ErrorAction Stop
        Write-Host "✓ Downloaded $file" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to download $file - $_" -ForegroundColor Red
    }
}
```

---

## File Size Budget Analysis

### Current External Dependencies
- **Bandwidth per user:** ~15-20MB first load
- **After Service Worker cache:** 0MB
- **Risk:** External services down = broken app

### Self-Hosted Strategy
- **Repo size increase:** ~15-20MB
- **Bandwidth per user:** ~15-20MB first load (same)
- **After Service Worker cache:** 0MB
- **Risk:** None - complete control

### Benefits of Self-Hosting
1. ✅ No external dependencies
2. ✅ Works offline immediately
3. ✅ Faster loads (same origin, HTTP/2)
4. ✅ Control over compression and quality
5. ✅ No CORS issues
6. ✅ Reliable availability

### GitHub Repo Size Limits
- **Recommended max:** 1GB
- **Current Solar repo:** ~2MB
- **After textures:** ~20-25MB
- **Status:** Well within limits ✅

---

## Implementation Checklist

### Immediate Tasks
- [ ] Create `/textures/planets/` and `/textures/moons/` directories
- [ ] Run download script for existing textures
- [ ] Verify all downloads successful
- [ ] Document sources in README
- [ ] Test local texture loading

### NASA Integration Tasks
- [ ] Research and document NASA USGS texture URLs
- [ ] Download NASA alternatives for comparison
- [ ] Create quality comparison (visual + file size)
- [ ] Choose best source per planet
- [ ] Document licenses and attributions

### Code Migration Tasks
- [ ] Update `SolarSystemModule.js` texture paths
- [ ] Change `createXTextureReal()` methods
- [ ] Update from `https://raw.githubusercontent.com/...` to `./textures/planets/...`
- [ ] Maintain procedural fallbacks
- [ ] Test all planets load correctly

### Service Worker Tasks
- [ ] Add texture directory to SW cache
- [ ] Update cache strategy for large files
- [ ] Consider cache-first for textures
- [ ] Bump SW version to 2.2.6
- [ ] Test offline functionality

### Optimization Tasks
- [ ] Compress JPEGs (80-85% quality)
- [ ] Create 1K/2K/4K variants
- [ ] Implement device-based adaptive loading
- [ ] Preload critical textures (Earth, Moon)
- [ ] Lazy-load outer planets

### Documentation Tasks
- [ ] Add ATTRIBUTION.md for NASA sources
- [ ] Update README with texture sources
- [ ] Document texture optimization process
- [ ] Add texture replacement guide
- [ ] Credit original threex.planets project

---

## License & Attribution

### Current Sources (to be credited)
- **threex.planets** by Jerome Etienne (MIT License)
- **three.js** by Mr.doob (MIT License)

### Future Sources
- **NASA/JPL/USGS:** Public Domain (no attribution required, but recommended)
- **Credit format:** "Planetary textures courtesy of NASA/JPL-Caltech/USGS"

---

## Next Steps

1. **Run download script** to backup all current textures
2. **Audit NASA sources** - verify quality and availability
3. **Create comparison document** - current vs NASA quality
4. **Update code** - migrate to local paths
5. **Test & validate** - ensure all planets render correctly
6. **Commit & deploy** - push to GitHub Pages

**Estimated Timeline:** 2-3 hours for complete migration
**Risk Level:** Low (procedural fallbacks exist)
**Impact:** High (eliminates all external dependencies)

---

## Success Criteria

✅ All textures hosted in repo  
✅ No external texture dependencies  
✅ App works offline  
✅ Visual quality maintained or improved  
✅ Load times unchanged or faster  
✅ Service Worker caches all textures  
✅ Proper attribution to NASA/original sources  

