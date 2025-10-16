# Attribution and Licenses

## Planetary Textures

This project uses planetary textures from multiple sources, all properly licensed for use in this open-source project.

---

## Current Texture Sources

### Phase 1: External Repository Backup (Downloaded October 2025)

All textures have been downloaded and self-hosted to ensure reliability and offline functionality.

#### threex.planets by Jerome Etienne
- **License:** MIT License
- **Repository:** https://github.com/jeromeetienne/threex.planets
- **Textures Used:**
  - Sun (`sun.jpg`)
  - Mercury (`mercury.jpg`)
  - Venus (`venus.jpg`)
  - Earth 1K (`earth_1k.jpg`)
  - Mars 1K (`mars_1k.jpg`)
  - Jupiter (`jupiter.jpg`)
  - Saturn (`saturn.jpg`)
  - Uranus (`uranus.jpg`)
  - Neptune (`neptune.jpg`)
  - Moon 1K (`moon_1k.jpg`)
- **Credit:** Jerome Etienne - https://github.com/jeromeetienne
- **Notes:** Excellent starter textures from the threex.planets extension for Three.js

#### three.js by Mr.doob and contributors
- **License:** MIT License
- **Repository:** https://github.com/mrdoob/three.js
- **Textures Used:**
  - Earth Atmosphere 2K (`earth_atmos_2k.jpg`)
  - Moon 1K (`moon_threejs_1k.jpg`)
- **Credit:** three.js authors - https://threejs.org
- **Notes:** High-quality example textures from the official Three.js repository

---

## Planned: NASA Public Domain Sources

### NASA/JPL/USGS Textures (Future Enhancement)

We plan to supplement or replace current textures with NASA public domain imagery for improved quality and scientific accuracy.

#### NASA Solar System Exploration
- **URL:** https://solarsystem.nasa.gov/resources/
- **License:** Public Domain (unless otherwise noted)
- **Quality:** 2K-8K resolution
- **Credit:** NASA/JPL-Caltech

#### USGS Astrogeology Science Center
- **URL:** https://astrogeology.usgs.gov/search
- **License:** Public Domain
- **Quality:** Scientific-grade planetary maps
- **Credit:** USGS Astrogeology Science Center

#### NASA 3D Resources
- **URL:** https://nasa3d.arc.nasa.gov/
- **License:** Public Domain
- **Quality:** Professional CGI models and textures
- **Credit:** NASA

#### NASA Visible Earth (Earth Textures)
- **URL:** https://visibleearth.nasa.gov/
- **License:** Public Domain
- **Quality:** Up to 21600x10800 (Blue Marble)
- **Credit:** NASA Earth Observatory

---

## License Compliance

### MIT License (threex.planets & three.js)

Both threex.planets and three.js are licensed under the MIT License, which permits:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

**Requirements:**
- Include copyright notice (done in this file)
- Include license text (done in this file)

#### MIT License Text

```
MIT License

Copyright (c) 2011-2024 Jerome Etienne (threex.planets)
Copyright (c) 2010-2024 three.js authors (three.js)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### NASA Public Domain

NASA media (images, videos, audio files) are generally in the public domain and may be used for educational or informational purposes without explicit permission. However, proper credit should be given.

**NASA Media Usage Guidelines:**
- ✅ Free to use for educational, informational, and non-commercial purposes
- ✅ Credit NASA and specific mission (e.g., "NASA/JPL-Caltech")
- ✅ No endorsement implied
- ⚠️ Check individual images - some may have restrictions if from international partners

**Recommended Credit Format:**
```
Planetary textures courtesy of NASA/JPL-Caltech and USGS Astrogeology Science Center.
```

---

## Credits by Planet/Object

### Current Sources

| Planet/Object | Source | Creator | License |
|--------------|--------|---------|---------|
| Sun | threex.planets | Jerome Etienne | MIT |
| Mercury | threex.planets | Jerome Etienne | MIT |
| Venus | threex.planets | Jerome Etienne | MIT |
| Earth (1K) | threex.planets | Jerome Etienne | MIT |
| Earth Atmosphere (2K) | three.js | Mr.doob et al. | MIT |
| Mars (1K) | threex.planets | Jerome Etienne | MIT |
| Jupiter | threex.planets | Jerome Etienne | MIT |
| Saturn | threex.planets | Jerome Etienne | MIT |
| Uranus | threex.planets | Jerome Etienne | MIT |
| Neptune | threex.planets | Jerome Etienne | MIT |
| Moon (1K) | threex.planets | Jerome Etienne | MIT |
| Moon (1K alt) | three.js | Mr.doob et al. | MIT |

### Future NASA Sources (Planned)

| Planet/Object | Mission/Source | Credit | License |
|--------------|----------------|--------|---------|
| Sun | SDO | NASA/SDO | Public Domain |
| Mercury | MESSENGER | NASA/JHU APL/USGS | Public Domain |
| Venus | Magellan | NASA/JPL | Public Domain |
| Earth | Blue Marble | NASA/GSFC | Public Domain |
| Moon | LRO | NASA/GSFC/ASU | Public Domain |
| Mars | Viking/MGS/MRO | NASA/JPL/USGS | Public Domain |
| Jupiter | Juno/Cassini | NASA/JPL-Caltech/SwRI | Public Domain |
| Saturn | Cassini | NASA/JPL-Caltech/SSI | Public Domain |
| Uranus | Voyager 2 | NASA/JPL-Caltech | Public Domain |
| Neptune | Voyager 2 | NASA/JPL-Caltech | Public Domain |

---

## Procedural Textures

In addition to photographic textures, this project includes procedurally generated textures created by the application itself using:
- **Three.js** (MIT License) - WebGL rendering
- **Canvas API** - Procedural generation algorithms
- **Custom algorithms** - Fractal noise, Perlin noise, etc.

These procedural textures serve as fallbacks when network textures fail to load or for planets without photographic data.

---

## Other Assets

### Three.js Library
- **License:** MIT License
- **Repository:** https://github.com/mrdoob/three.js
- **Usage:** 3D rendering engine
- **Credit:** three.js authors

### Font Awesome Icons (if used)
- **License:** Font Awesome Free License
- **URL:** https://fontawesome.com/
- **Usage:** UI icons

---

## How to Credit This Project

If you use or modify this project, please include:

```
Solar System Visualization
Original by: [Your Name/Organization]
Planetary textures: Jerome Etienne (threex.planets), three.js authors, NASA/JPL-Caltech
License: [Your chosen license]
```

---

## Disclaimer

This is an educational visualization project. Planetary data and textures are used for educational and informational purposes. No endorsement by NASA, JPL, USGS, or other organizations is implied.

Orbital parameters and physical properties are approximations for visualization purposes and should not be used for scientific calculations.

---

## Updates and Changes

### October 2025
- ✅ Downloaded and self-hosted all external textures
- ✅ Documented current sources and licenses
- 📋 Planned NASA texture integration for higher quality

### Future
- Replace with NASA public domain textures where quality improvements exist
- Add higher resolution variants (2K, 4K) for capable devices
- Implement adaptive texture loading based on device capabilities

---

## Contact

For questions about texture licensing or attribution, please open an issue on the project repository.

For NASA media usage questions, visit: https://www.nasa.gov/multimedia/guidelines/index.html

---

**Last Updated:** October 16, 2025
