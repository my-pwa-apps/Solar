# Earth Zoom Feature - OpenStreetMap/Leaflet Integration

## Overview

This feature adds seamless zoom transitions from the 3D Earth in the Solar System view to an interactive 2D map powered by OpenStreetMap/Leaflet. Users can double-click or Shift+click on Earth to open a detailed map view of the clicked location.

## How to Use

1. **Navigate to Earth** in the Solar System view
2. **Double-click** (or **Shift+click**) on Earth's surface
3. The map will open showing the clicked geographic location
4. Use the map controls to:
   - 🛰️ Switch to **Satellite View** (Esri World Imagery)
   - 🏔️ Switch to **Terrain View** (OpenTopoMap)
   - 🗺️ Switch to **Street Map** (OpenStreetMap)
5. Press **Escape** or click the **✕** button to return to space

## Files Changed

| File | Changes |
|------|---------|
| `src/modules/EarthZoomManager.js` | **NEW** - Main module handling map transitions |
| `src/main.js` | Added import, `setupEarthZoom()`, modified `handleCanvasClick()` |
| `src/styles/ui.css` | Added Earth map container styles (~200 lines) |
| `index.html` | Added Leaflet CSS and JS CDN links |
| `sw.js` | Bumped to v2.5.11, added EarthZoomManager to cache |

## Technical Details

### Coordinate Conversion

The module converts 3D click positions on the Earth sphere to latitude/longitude using spherical coordinate math:

```javascript
pointToLatLng(point, earthMesh) {
    const localPoint = point.clone().sub(earthMesh.position);
    const normalized = localPoint.normalize();
    
    // Three.js uses Y-up coordinate system
    const lat = Math.asin(normalized.y) * (180 / Math.PI);
    const lng = Math.atan2(normalized.x, normalized.z) * (180 / Math.PI);
    
    return { lat, lng };
}
```

### Tile Layers

| Layer | Provider | Max Zoom |
|-------|----------|----------|
| Satellite | Esri World Imagery | 19 |
| Terrain | OpenTopoMap | 17 |
| Streets | OpenStreetMap | 19 |

### UI Features

- Animated transition overlay (fade effect)
- Coordinate display (e.g., "51.50°N, 0.12°W")
- Zoom level indicator
- Mobile-responsive design
- Keyboard shortcut (Escape to close)

## Dependencies

- **Leaflet 1.9.4** - Loaded via CDN (unpkg.com)
  - CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
  - JS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

## Future Enhancements

- [ ] Google Street View integration (requires API key)
- [ ] Automatic zoom transition based on camera distance
- [ ] 3D terrain view using Mapbox GL
- [ ] Location search within map view
- [ ] Pin locations of interest (ISS position, etc.)
- [ ] Integration with real-time weather data

## Testing

1. Start local server: `python -m http.server 8000`
2. Open http://localhost:8000
3. Navigate to Earth
4. Double-click on different parts of Earth's surface
5. Verify coordinates match expected locations
6. Test all three tile layers
7. Test Escape key and close button
8. Test on mobile devices

## Version

- **Feature Version:** 1.0.0
- **App Version:** 2.5.11
- **Date:** January 2025
