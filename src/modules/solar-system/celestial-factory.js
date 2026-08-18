// Extracted from SolarSystemModule.js — methods are mixed into its prototype.
import * as THREE from 'three';
import { CONFIG, DEBUG, MaterialFactory, GeometryFactory } from '../utils.js';

const t = (key) => (window.t || ((k) => k))(key);

export const celestialFactory = {
createSun(scene) {
 // HYPERREALISTIC Sun with realistic size
 // Sun: 1,391,000 km / 12,742 km = 109.2 (should be MASSIVE)
 // But we'll scale it down to 15 for visibility while still being impressive
 const sunRadius = 15; // Compromise between realism and usability
 const sunGeometry = new THREE.SphereGeometry(sunRadius, CONFIG.QUALITY.sphereSegments, CONFIG.QUALITY.sphereSegments); // Quality-adaptive detail
 
 // Load real NASA Sun texture (with procedural fallback)
 const sunTexture = this.createSunTextureReal(CONFIG.QUALITY.textureSize);
 
 // MeshBasicMaterial — the sun is self-luminous; it doesn't react to scene lights
 const sunMaterial = new THREE.MeshBasicMaterial({
 map: sunTexture,
 toneMapped: false
 });
 
 this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.userData = {
            id: 'sun',
            name: 'sun',
            type: 'star',
            distance: 0,
            radius: sunRadius,
            description: t('descSun'),
            funFact: t('funFactSun'),
            realSize: '1,391,000 km diameter'
        };
        
        // Sun lighting - PointLight from center with NO DECAY for realistic solar system lighting
 // In space, light doesn't decay with distance (inverse square law applies but over HUGE distances)
 // BALANCED: Reduced intensity to prevent washing out textures on sunny side
 const sunLight = new THREE.PointLight(0xFFFAE8, 9, 0, 0); // Warm white, reduced intensity (10→9)
 sunLight.name = 'sunLight';
 sunLight.position.set(0, 0, 0);
 // Shadow mapping is off deliberately. A point-light cube shadow spanning the
 // whole solar system gives each texel an enormous volume, and the depth
 // comparison collapses into hard-edged black discs on planets — the artifact
 // looks like a moon transit but appears with no moon in front of the planet.
 // Eclipses are drawn analytically instead (see astro/EclipseRenderer.js).
 sunLight.castShadow = false;
 scene.add(sunLight);
 this.sun.userData.sunLight = sunLight;
 
 // Ambient light - very faint fill for starlight/earthshine reflection
 // Keep LOW for realistic day/night contrast on planets
 const ambientLight = new THREE.AmbientLight(0x202030, 0.08); // Minimal starlight ambient
 ambientLight.name = 'ambientLight';
 scene.add(ambientLight);

 if (DEBUG && DEBUG.enabled) {
 console.log(' Lighting: Sun 9 (warm white), Ambient 0.4, Tone mapping 1.2');
 }
 
 // Multi-layer corona for realistic glow — inner bright core fading to a wispy outer halo.
 // Outer layers are kept warm (yellow-orange) at very low opacity to avoid hard red ring
 // artifacts, which occur because the sun sphere occludes each BackSide layer's centre.
 const coronaLayers = [
 { size: 11.5, color: 0xffdd88, opacity: 0.25 },
 { size: 13,   color: 0xffaa44, opacity: 0.18 },
 { size: 15,   color: 0xff8822, opacity: 0.12 },
 { size: 20,   color: 0xff9944, opacity: 0.018 } // very subtle warm outer halo
 ];
 
 coronaLayers.forEach(layer => {
 const coronaGeometry = new THREE.SphereGeometry(layer.size, 32, 32);
 const coronaMaterial = new THREE.MeshBasicMaterial({
 color: layer.color,
 transparent: true,
 opacity: layer.opacity,
 side: THREE.BackSide,
 blending: THREE.AdditiveBlending,
 depthWrite: false, // Don't block objects behind the glow
 depthTest: true // But still respect depth for proper rendering
 });
 const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
 this.sun.add(corona);
 });
 
 // Add solar flare particles
 const flareGeometry = new THREE.BufferGeometry();
 const flareCount = 200;
 const flarePositions = new Float32Array(flareCount * 3);
 const flareSizes = new Float32Array(flareCount);
 
 for (let i = 0; i < flareCount; i++) {
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const r = 10.5 + Math.random() * 2;
 
 flarePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
 flarePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
 flarePositions[i * 3 + 2] = r * Math.cos(phi);
 flareSizes[i] = 1 + Math.random() * 3;
 }
 
 flareGeometry.setAttribute('position', new THREE.BufferAttribute(flarePositions, 3));
 flareGeometry.setAttribute('size', new THREE.BufferAttribute(flareSizes, 1));
 
 const flareMaterial = new THREE.PointsMaterial({
 color: 0xffff00,
 size: 2,
 transparent: true,
 opacity: 0.8,
 blending: THREE.AdditiveBlending,
 sizeAttenuation: false
 });
 
 const flares = new THREE.Points(flareGeometry, flareMaterial);
 this.sun.add(flares);
 this.sun.userData.flares = flares;
 
 scene.add(this.sun);
 this.objects.push(this.sun);
 this.pickableObjects.push(this.sun);
 },

async createInnerPlanets(scene) {
 // REALISTIC SIZES (Earth radius = 1.0 as base)
 // Mercury: 4,879 km / 12,742 km = 0.383
 if (this.uiManager) this.uiManager.updateLoadingProgress(7, t('creatingMercury'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
 this.planets.mercury = this.createPlanet(scene, {
 id: 'mercury',
 name: t('mercury'),
 radius: 0.383,
 color: 0x8C7853,
 distance: 20,
 speed: 0.04,
            rotationSpeed: 0.004,
            tilt: 0.034,
            description: t('descMercury'),
            funFact: t('funFactMercury'),
            realSize: '4,879 km diameter',
            moons: 0
        }); // Venus: 12,104 km / 12,742 km = 0.950
 if (this.uiManager) this.uiManager.updateLoadingProgress(14, t('creatingVenus'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.venus = this.createPlanet(scene, {
            id: 'venus',
            name: t('venus'),
            radius: 0.950,
            color: 0xFFC649,
            distance: 37, // Educational scale (1.85x Mercury)
            speed: 0.015,
            rotationSpeed: -0.001,
            tilt: 177.4, // ASTRONOMICAL_DATA.venus.axialTilt (retrograde, nearly inverted)
            description: t('descVenus'),
            funFact: t('funFactVenus'),
            realSize: '12,104 km diameter',
            moons: 0,
            emissive: 0xFFC649,
            emissiveIntensity: 0.3
        }); // Earth: BASE = 1.0 (12,742 km) - Most complex texture generation
 if (this.uiManager) this.uiManager.updateLoadingProgress(21, t('creatingEarth'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.earth = this.createPlanet(scene, {
            id: 'earth',
            name: t('earth'),
            radius: 1.0,
            color: 0x2233FF,
            distance: 51, // Educational scale (2.56x Mercury)
            speed: 0.01,
            rotationSpeed: 0.02,
            tilt: 23.44,
            description: t('descEarth'),
            funFact: t('funFactEarth'),
            realSize: '12,742 km diameter',
            moons: 1
        });        // Moon: 3,474 km / 12,742 km = 0.273
        // Real distance: 384,400 km / Earth radius (6,371 km) = ~60 Earth radii
        // Real orbital period: 27.32 days vs Earth's 365.25 days = 13.37x faster
        this.createMoon(this.planets.earth, {
            id: 'moon',
            name: t('moon'),
            radius: 0.273,
            color: 0xAAAAAA,
            distance: 4, // Increased from 3 for better visibility
            speed: 0.1337, // 13.37x Earth's speed (0.01 * 13.37) - completes ~13 orbits per Earth year
            rotationSpeed: 0.004, // Moon rotates (tidally locked)
            description: t('descMoon'),
            funFact: t('funFactMoon')
        }); // Mars: 6,779 km / 12,742 km = 0.532
 if (this.uiManager) this.uiManager.updateLoadingProgress(31, t('creatingMars'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.mars = this.createPlanet(scene, {
            id: 'mars',
            name: t('mars'),
            radius: 0.532,
            color: 0xCD5C5C,
            distance: 78, // Educational scale (3.90x Mercury)
            speed: 0.008,
            rotationSpeed: 0.018,
            tilt: 25.19,
            description: t('descMars'),
            funFact: t('funFactMars'),
            realSize: '6,779 km diameter',
            moons: 2
        });        // Phobos: ~22 km / 12,742 km = 0.0017 (tiny in reality, scaled up for visibility)
        // Orbital period: 0.319 days (7.65 hours) vs Mars's 687 days = 2153x faster
        this.createMoon(this.planets.mars, {
            id: 'phobos',
            name: t('phobos'),
            radius: 0.08, // Scaled up for visibility (was 0.002)
            color: 0x666666,
            distance: 1.5,
            speed: 3.0, // Reduced from 17.22 for visual stability - still noticeably fast
            description: t('descPhobos')
        });
        // Deimos: ~12 km / 12,742 km = 0.0009 (tiny in reality, scaled up for visibility)
        // Orbital period: 1.263 days (30.3 hours) vs Mars's 687 days = 544x faster
        this.createMoon(this.planets.mars, {
            id: 'deimos',
            name: t('deimos'),
            radius: 0.06, // Scaled up for visibility (was 0.0015)
            color: 0x888888,
            distance: 2.5,
            speed: 0.75, // Slower than Phobos (30.3h vs 7.65h orbit) — ratio ~4:1
            description: t('descDeimos')
        });
    },

async createOuterPlanets(scene) {
 // Jupiter: 139,820 km / 12,742 km = 10.97 (MASSIVE!)
 if (this.uiManager) this.uiManager.updateLoadingProgress(40, t('creatingJupiter'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.jupiter = this.createPlanet(scene, {
            id: 'jupiter',
            name: t('jupiter'),
            radius: 10.97,
            color: 0xDAA520,
            distance: 266, // Educational scale (13.3x Mercury)
            speed: 0.002,
            rotationSpeed: 0.04,
            tilt: 3.13,
            description: t('descJupiter'),
            funFact: t('funFactJupiter'),
            realSize: '139,820 km diameter',
            moons: 4
        }); // Jupiter's Galilean moons (realistic sizes)
        // Io: 3,643 km / 12,742 km = 0.286
        // Orbital period: 1.769 days vs Jupiter's 4333 days = 2449x faster
        this.createMoon(this.planets.jupiter, {
            id: 'io',
            name: t('io'),
            radius: 0.286,
            color: 0xFFFF00,
            distance: 12, // Increased from 8 for better visibility
            speed: 4.898, // 2449x Jupiter's speed (0.002 * 2449)
            description: t('descIo')
        });
        // Europa: 3,122 km / 12,742 km = 0.245
        // Orbital period: 3.551 days vs Jupiter's 4333 days = 1220x faster
        this.createMoon(this.planets.jupiter, {
            id: 'europa',
            name: t('europa'),
            radius: 0.245,
            color: 0xCCBB99,
            distance: 15, // Increased from 10
            speed: 2.44, // 1220x Jupiter's speed (0.002 * 1220)
            description: t('descEuropa')
        });
        // Ganymede: 5,268 km / 12,742 km = 0.413 (larger than Mercury!)
        // Orbital period: 7.155 days vs Jupiter's 4333 days = 606x faster
        this.createMoon(this.planets.jupiter, {
            id: 'ganymede',
            name: t('ganymede'),
            radius: 0.413,
            color: 0x996633,
            distance: 19, // Increased from 12
            speed: 1.212, // 606x Jupiter's speed (0.002 * 606)
            description: t('descGanymede')
        });
        // Callisto: 4,821 km / 12,742 km = 0.378
        // Orbital period: 16.689 days vs Jupiter's 4333 days = 260x faster
        this.createMoon(this.planets.jupiter, {
            id: 'callisto',
            name: t('callisto'),
            radius: 0.378,
            color: 0x777777,
            distance: 23, // Increased from 14
            speed: 0.52, // 260x Jupiter's speed (0.002 * 260)
            description: t('descCallisto')
        }); // Saturn: 116,460 km / 12,742 km = 9.14 (almost as big as Jupiter!)
 if (this.uiManager) this.uiManager.updateLoadingProgress(48, t('creatingSaturn'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.saturn = this.createPlanet(scene, {
            id: 'saturn',
            name: t('saturn'),
            radius: 9.14,
            color: 0xFAD5A5,
            distance: 490, // Educational scale (24.5x Mercury)
            speed: 0.0009,
            rotationSpeed: 0.038,
            tilt: 26.73,
            description: t('descSaturn'),
            funFact: t('funFactSaturn'),
            realSize: '116,460 km diameter',
            moons: 3,
            rings: true,
            prominentRings: true
        });
        // Enceladus: 504 km / 12,742 km = 0.040
        // Orbital period: 1.370 days vs Saturn's 10759 days = 7854x faster
        // Note: Reduced speed for visual stability (was 7.07, too fast causing visual artifacts)
        // Real orbit: 238,020 km = 3.95x Saturn's radius (60,268 km) = 36.1 scene units
        // Rings end at outerR = radius * 2.2 = 20.11 scene units — Enceladus orbits OUTSIDE rings
        this.createMoon(this.planets.saturn, {
            id: 'enceladus',
            name: t('enceladus'),
            radius: 0.040,
            color: 0xFFFFFF,
            distance: 22, // Just outside rings (rings end at 20.11); real ratio: 3.95x Saturn radius
            speed: 1.5, // Reduced from 7.07 for smoother visual orbit
            description: t('descEnceladus')
        });
        // Rhea: 1,527 km / 12,742 km = 0.120
        // Orbital period: 4.518 days vs Saturn's 10759 days = 2382x faster
        // Real orbit: 527,108 km = 8.75x Saturn's radius = 79.9 scene units
        this.createMoon(this.planets.saturn, {
            id: 'rhea',
            name: t('rhea'),
            radius: 0.120,
            color: 0xCCCCCC,
            distance: 28, // Outside rings with clear separation from Enceladus
            speed: 2.144, // 2382x Saturn's speed (0.0009 * 2382)
            description: t('descRhea')
        });
        // Titan: 5,150 km / 12,742 km = 0.404 (bigger than Mercury!)
        // Orbital period: 15.945 days vs Saturn's 10759 days = 675x faster
        // Real orbit: 1,221,870 km = 20.3x Saturn's radius = 185 scene units
        this.createMoon(this.planets.saturn, {
            id: 'titan',
            name: t('titan'),
            radius: 0.404,
            color: 0xFFAA33,
            distance: 38, // Well outside rings; scaled for visual clarity
            speed: 0.608, // 675x Saturn's speed (0.0009 * 675)
            description: t('descTitan')
        }); // Uranus: 50,724 km / 12,742 km = 3.98
 if (this.uiManager) this.uiManager.updateLoadingProgress(54, t('creatingUranus'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.uranus = this.createPlanet(scene, {
            id: 'uranus',
            name: t('uranus'),
            radius: 3.98,
            color: 0x4FD0E7,
            distance: 984, // Educational scale (49.2x Mercury)
            speed: 0.0004,
            rotationSpeed: 0.03,
            tilt: 97.77,
            description: t('descUranus'),
            funFact: t('funFactUranus'),
            realSize: '50,724 km diameter',
            moons: 2,
            rings: true
        });        // Titania: 1,578 km / 12,742 km = 0.124
        // Orbital period: 8.706 days vs Uranus's 30687 days = 3526x faster
        this.createMoon(this.planets.uranus, {
            id: 'titania',
            name: t('titania'),
            radius: 0.124,
            color: 0xAAAAAA,
            distance: 8, // Increased from 5: Uranus radius is 3.98, need clear visual separation
            speed: 1.410, // 3526x Uranus's speed (0.0004 * 3526)
            description: t('descTitania')
        });
        // Miranda: 472 km / 12,742 km = 0.037
        // Orbital period: 1.413 days vs Uranus's 30687 days = 21722x faster
        this.createMoon(this.planets.uranus, {
            id: 'miranda',
            name: t('miranda'),
            radius: 0.037,
            color: 0x999999,
            distance: 6, // Fixed from 3.5: was INSIDE Uranus (radius 3.98)! Now clearly outside.
            speed: 2.0, // Reduced from 8.689 for visual stability
            description: t('descMiranda')
        }); // Neptune: 49,244 km / 12,742 km = 3.86
 if (this.uiManager) this.uiManager.updateLoadingProgress(58, t('creatingNeptune'));
 await new Promise(resolve => requestAnimationFrame(resolve));
 
        this.planets.neptune = this.createPlanet(scene, {
            id: 'neptune',
            name: t('neptune'),
            radius: 3.86,
            color: 0x4169E1,
            distance: 1542, // Educational scale (77.1x Mercury)
            speed: 0.0001,
            rotationSpeed: 0.032,
            tilt: 28.32,
            description: t('descNeptune'),
            funFact: t('funFactNeptune'),
            realSize: '49,244 km diameter',
            moons: 1,
            rings: true
        });        // Triton: 2,707 km / 12,742 km = 0.212
        // Orbital period: 5.877 days (retrograde) vs Neptune's 60190 days = 10242x faster
        this.createMoon(this.planets.neptune, {
            id: 'triton',
            name: t('triton'),
            radius: 0.212,
            color: 0xFFCCCC,
            distance: 5,
            speed: -1.024, // -10242x Neptune's speed (negative for retrograde orbit)
            description: t('descTriton')
        }); // Pluto: 2,377 km / 12,742 km = 0.187
 this.planets.pluto = this.createPlanet(scene, {
 id: 'pluto',
 name: t('pluto'),
 radius: 0.187,
 color: 0xD4A373,
 distance: 2024, // Educational scale (101.2x Mercury)
 speed: 0.00004,
 rotationSpeed: 0.015,
 tilt: 122.53,
 description: t('descPluto'),
 funFact: t('funFactPluto'),
 realSize: '2,377 km diameter',
        moons: 1,
            dwarf: true
        });

        // Charon: 1,212 km / 12,742 km = 0.095 (half the size of Pluto!)
        // Orbital period: 6.387 days vs Pluto's 90560 days = 14178x faster
        this.createMoon(this.planets.pluto, {
            id: 'charon',
            name: t('charon'),
            radius: 0.095,
            color: 0xAAAAAA,
            distance: 1.2,
            speed: 0.567, // 14178x Pluto's speed (0.00004 * 14178)
            description: t('descCharon')
        });
    },

async createDwarfPlanets(scene) {
        // Pluto already created; add others with texture loaders where available
        // Radii calculated as: diameter_km / 12742 (Earth's diameter in km)
        const catalog = [
            { name: 'Ceres', radius: 0.074, color: 0xC8C8B4, distance: 140, speed: 0.02, rotationSpeed: 0.02, tilt: 4, description: t('descCeres'), funFact: 'May host subsurface brines.', realSize: '939 km diameter', hasRemote: true },
            { name: 'Haumea', radius: 0.125, color: 0xE0D6C8, distance: 2139, speed: 0.00005, rotationSpeed: 0.08, tilt: 28, description: t('descHaumea'), funFact: 'Rotation period ~4 hours gives its triaxial ellipsoid shape.', realSize: '2322 × 1704 × 1026 km (triaxial diameters)' },
            { name: 'Makemake', radius: 0.112, color: 0xD4B48C, distance: 2279, speed: 0.000047, rotationSpeed: 0.01, tilt: 29, description: t('descMakemake'), funFact: 'Discovered near Easter, named after Rapa Nui deity.', realSize: '1430 km diameter' },
            { name: 'Eris', radius: 0.183, color: 0xD8D8D8, distance: 2483, speed: 0.00004, rotationSpeed: 0.01, tilt: 78, description: t('descEris'), funFact: 'Helped prompt Pluto reclassification.', realSize: '2326 km diameter' },
            { name: 'Orcus', radius: 0.071, color: 0xB0B0C0, distance: 2024, speed: 0.000052, rotationSpeed: 0.01, tilt: 20, description: t('descOrcus'), funFact: t('funFactOrcus'), realSize: '~910 km est.' },
            { name: 'Quaoar', radius: 0.087, color: 0xC8A088, distance: 2189, speed: 0.000051, rotationSpeed: 0.012, tilt: 15, description: t('descQuaoar'), funFact: t('funFactQuaoar'), realSize: '1110 km diameter' },
            { name: 'Gonggong', radius: 0.097, color: 0xBB7766, distance: 3457, speed: 0.000039, rotationSpeed: 0.008, tilt: 30, description: t('descGonggong'), funFact: t('funFactGonggong'), realSize: '~1230 km est.' },
            { name: 'Sedna', radius: 0.078, color: 0xCC6644, distance: 4500, speed: 0.000003, rotationSpeed: 0.006, tilt: 12, description: t('descSedna'), funFact: 'Takes ~11,400 years to orbit! Its reddish color rivals Mars.', realSize: '~995 km diameter' },
            { name: 'Salacia', radius: 0.067, color: 0x996655, distance: 2234, speed: 0.000048, rotationSpeed: 0.01, tilt: 18, description: t('descSalacia'), funFact: t('funFactSalacia'), realSize: '~850 km est.' },
            { name: 'Varda', radius: 0.057, color: 0xAA8866, distance: 2328, speed: 0.000046, rotationSpeed: 0.01, tilt: 10, description: t('descVarda'), funFact: t('funFactVarda'), realSize: '~720 km est.' },
            { name: 'Varuna', radius: 0.052, color: 0xAA7755, distance: 2139, speed: 0.000053, rotationSpeed: 0.04, tilt: 22, description: t('descVaruna'), funFact: t('funFactVaruna'), realSize: '~668 km est.' }
        ];

        catalog.forEach(cfg => {
            const key = cfg.name.toLowerCase();
            if (this.planets[key]) return;
            
            // Create planet and store in registry
            this.planets[key] = this.createPlanet(scene, {
                id: key,
                name: cfg.name,
                radius: cfg.radius,
                color: cfg.color,
                distance: cfg.distance,
                speed: cfg.speed,
                rotationSpeed: cfg.rotationSpeed,
                tilt: cfg.tilt,
                description: cfg.description,
                funFact: cfg.funFact,
                realSize: cfg.realSize,
                moons: 0,
                dwarf: true
            });
        });
    },

createPlanetMaterial(config) {
 // Create HYPERREALISTIC materials with advanced texturing
 // Use config.id (language-independent) instead of config.name (translated)
 const id = (config.id || config.name).toLowerCase();
 if (DEBUG && DEBUG.TEXTURES) console.log(`[MAT] Creating material for: "${id}" (name: "${config.name}")`);

 // Base material properties
 let materialProps = {
 roughness: 0.9,
 metalness: 0.0,
 emissive: config.emissive || 0x000000,
 emissiveIntensity: config.emissiveIntensity || 0
 };

 // Planet-specific hyperrealistic materials with high-quality textures
 switch(id) {
 case 'earth': {
 // Earth: ULTRA HYPER-REALISTIC with real NASA textures + procedural fallback
 // Use quality-aware texture size: 1024 on mobile, 4096 on desktop
 const earthTexSize = CONFIG.QUALITY.textureSize;
 if (DEBUG.enabled) console.time('Earth Material Creation');
 const earthTexture = this._configureSphericalSurfaceTexture(
 this.createEarthTextureRealFixed(earthTexSize),
 { colorSpace: THREE.SRGBColorSpace }
 );
 const earthBump = this._configureSphericalSurfaceTexture(this.createEarthBumpMap(earthTexSize));
 if (DEBUG.enabled) console.timeEnd('Earth Material Creation');
 
 // ULTRA realistic material with PBR (Physically Based Rendering)
 const earthMaterial = new THREE.MeshStandardMaterial({
 map: earthTexture,
 
 // Bump map for elevation (normalMap removed — procedural version had bad gradients)
 bumpMap: earthBump,
 bumpScale: 0.08,
 
 // Roughness: continents are matte, oceans get a sharp specular highlight.
 // The actual ocean/land roughness map is generated from the loaded color
 // texture in _onPlanetTextureSuccess (oceans → ~0.35, land → 0.95). Until
 // that map arrives we render fully matte so land never looks plastic.
 roughness: 0.95,
 
 // Metalness (Earth's surface is not metallic)
 metalness: 0.0,

 emissive: 0x000000,
 emissiveIntensity: 0,

 // No scene.environment is assigned anywhere, so envMapIntensity is a no-op.
 transparent: false,
 side: THREE.FrontSide,
 flatShading: false,
 toneMapped: true
 });
 
 return earthMaterial;
 } // end case 'earth'

 case 'mars':
 // Mars: REAL NASA texture with rusty red surface with canyons, polar caps
 const marsTexture = this.createMarsTextureReal(CONFIG.QUALITY.textureSize);
 const marsBump = this.createMarsBumpMap(CONFIG.QUALITY.textureSize);
 const marsNormal = this.createMarsNormalMap(CONFIG.QUALITY.textureSize);
 
 return new THREE.MeshStandardMaterial({
 map: marsTexture,
 normalMap: marsNormal,
 normalScale: new THREE.Vector2(1.2, 1.2),
 bumpMap: marsBump,
 bumpScale: 0.08,
 roughness: 0.95,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'venus':
 // Venus: REAL NASA texture with thick yellowish sulfuric acid clouds
 const venusTexture = this.createVenusTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: venusTexture,
 color: 0xe8c468,
 roughness: 0.8,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'mercury':
 // Mercury: REAL NASA texture heavily cratered surface
 const mercuryTexture = this.createMercuryTextureReal(CONFIG.QUALITY.textureSize);
 const mercuryBump = this.createMercuryBumpMap(CONFIG.QUALITY.textureSize);
 
 return new THREE.MeshStandardMaterial({
 map: mercuryTexture,
 bumpMap: mercuryBump,
 bumpScale: 0.1,
 roughness: 0.95,
 metalness: 0.02,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'jupiter':
 // Jupiter: REAL NASA texture with hyperrealistic bands and Great Red Spot
 const jupiterTexture = this.createJupiterTextureReal(CONFIG.QUALITY.textureSize);
 const jupiterBump = this.createJupiterBumpMap(Math.min(CONFIG.QUALITY.textureSize, 1024));
 
 return new THREE.MeshStandardMaterial({
 map: jupiterTexture,
 bumpMap: jupiterBump,
 bumpScale: 0.02,
 roughness: 0.6,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'saturn':
 // Saturn: REAL NASA texture with pale gold and detailed banding
 const saturnTexture = this.createSaturnTextureReal(CONFIG.QUALITY.textureSize);
 const saturnBump = this.createSaturnBumpMap(Math.min(CONFIG.QUALITY.textureSize, 1024));
 
 return new THREE.MeshStandardMaterial({
 map: saturnTexture,
 bumpMap: saturnBump,
 bumpScale: 0.015,
 roughness: 0.65,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'uranus':
 // Uranus: REAL NASA texture with cyan atmosphere and methane
 const uranusTexture = this.createUranusTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: uranusTexture,
 roughness: 0.7,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'neptune':
 // Neptune: REAL NASA texture with deep blue and Great Dark Spot
 const neptuneTexture = this.createNeptuneTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: neptuneTexture,
 roughness: 0.7,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 case 'pluto':
 // Pluto: Remote attempt (plugin) then procedural with Tombaugh Regio heart
 const plutoTexture = this.createPlutoTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: plutoTexture,
 roughness: 0.85,
 metalness: 0.0,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'ceres':
 // Ceres: Dawn mission texture (NASA)
 const ceresTexture = this.createCeresTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: ceresTexture,
 roughness: 0.9,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'haumea':
 // Haumea: Fast-spinning elongated dwarf planet (CC BY 4.0 Solar System Scope)
 const haumeaTexture = this.createHaumeaTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: haumeaTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'makemake':
 // Makemake: Bright Kuiper Belt dwarf planet (CC BY 4.0 Solar System Scope)
 const makemakeTexture = this.createMakemakeTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: makemakeTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });

 case 'eris':
 // Eris: Massive scattered disk dwarf planet (CC BY 4.0 Solar System Scope)
 const erisTexture = this.createErisTextureReal(CONFIG.QUALITY.textureSize);
 return new THREE.MeshStandardMaterial({
 map: erisTexture,
 roughness: 0.8,
 metalness: 0.1,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 
 default:
 // Default material (for dwarf planets and others without specific loaders)
 if (config.dwarf) {
 // Dwarf planets: use Mercury-style cratered texture
 const dwarfTexture = this.createMercuryTexture(1024);
 return new THREE.MeshStandardMaterial({
 map: dwarfTexture,
 color: config.color,
 roughness: 0.9,
 metalness: 0.05,
 emissive: 0x000000,
 emissiveIntensity: 0
 });
 }
 if (DEBUG && DEBUG.enabled) console.warn(`[MAT] DEFAULT MATERIAL for "${id}" - color: 0x${config.color?.toString(16)}`);
 return new THREE.MeshStandardMaterial({
 color: config.color,
 ...materialProps
 });
 }
 },

createPlanet(scene, config) {
 // Use cached geometry or create new
 const segments = CONFIG.QUALITY.sphereSegments;
 const geometry = this.getGeometry('sphere', config.radius, segments, segments);
 
 // Create hyperrealistic material based on planet type
 const material = this.createPlanetMaterial(config);

 const planet = new THREE.Mesh(geometry, material);
 planet.position.set(config.distance, 0, 0);
 planet.castShadow = CONFIG.QUALITY.shadows; // Enable eclipses on desktop; mobile stays off for performance
 planet.receiveShadow = true; // But can receive shadows from moons
 planet.rotation.z = (config.tilt || 0) * Math.PI / 180;

 // Get real astronomical data for this planet - USE ENGLISH KEY, NOT TRANSLATED NAME
 const planetKey = (config.id || config.name).toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[planetKey] || {};
 
 planet.userData = {
 id: config.id || config.name.toLowerCase(), // English key for lookups
 name: config.id || config.name, // English name for internal lookups; UI translates via t(name.toLowerCase())
 type: config.dwarf ? 'DwarfPlanet' : 'planet',
 distance: config.distance,
 radius: config.radius,
 angle: Math.random() * Math.PI * 2,
 speed: config.speed,
 visualBaseSpeed: config.speed,
 rotationSpeed: config.rotationSpeed,
 description: config.description,
 funFact: config.funFact,
 realSize: config.realSize,
 moonCount: config.moons || 0,
 moons: [],
 
 // Real astronomical data for day/night cycle
 realRotationPeriod: astroData.rotationPeriod || 24, // hours
 axialTilt: astroData.axialTilt ?? config.tilt ?? 0, // degrees
 retrograde: astroData.retrograde || false, // rotation direction
 rotationPhase: Math.random() * Math.PI * 2 // starting rotation angle
 };

 const orbitalElements = this.SCIENTIFIC_ORBITAL_ELEMENTS[planetKey] || { eccentricity: 0, inclinationDeg: 0, periapsisDeg: 0 };
 planet.userData.orbitalEccentricity = orbitalElements.eccentricity || 0;
 planet.userData.orbitalInclination = (orbitalElements.inclinationDeg || 0) * Math.PI / 180;
 planet.userData.orbitalPeriapsis = (orbitalElements.periapsisDeg || 0) * Math.PI / 180;
 // Pre-cached trig — inclination and sqrt(1±e) are constant per body
 planet.userData._sinOrbInc = Math.sin(planet.userData.orbitalInclination);
 planet.userData._cosOrbInc = Math.cos(planet.userData.orbitalInclination);
 const _pe = planet.userData.orbitalEccentricity;
 planet.userData._keplerSqrtPlus = Math.sqrt(1 + _pe);
 planet.userData._keplerSqrtMinus = _pe < 1 ? Math.sqrt(1 - _pe) : 0;

 // Cloud layer disabled — real NASA Earth texture already includes visible
 // cloud patterns; a separate cloud mesh caused a blue-tint artefact.

 // NOTE: Great Red Spot removed - now included in Jupiter's NASA texture!
 // The procedurally generated 3D spot was redundant and looked odd
 // compared to the real NASA imagery which already shows the Great Red Spot
 
 // Add rings for gas giants with realistic appearance
 if (config.rings) {
 // Ring radii vary by planet based on real proportions
 let ringInnerFactor = 1.3, ringOuterFactor = 2.2;
 if (config.id === 'uranus') { ringInnerFactor = 1.6; ringOuterFactor = 2.0; }
 else if (config.id === 'neptune') { ringInnerFactor = 1.7; ringOuterFactor = 2.5; }
 const innerR = config.radius * ringInnerFactor;
 const outerR = config.radius * ringOuterFactor;
 const ringGeometry = new THREE.RingGeometry(innerR, outerR, 128);

 // Three.js RingGeometry UVs are wrong for radial ring textures — remap them.
 // The ring texture (saturn_ring_alpha.webp) is a horizontal 1-D strip where
 // left edge = inner ring, right edge = outer ring. We need U to represent how
 // far a vertex is between inner and outer radius, and V to be the angle.
 const pos = ringGeometry.attributes.position;
 const uv = ringGeometry.attributes.uv;
 for (let i = 0; i < pos.count; i++) {
 const x = pos.getX(i), y = pos.getY(i);
 const r = Math.sqrt(x * x + y * y);
 uv.setXY(i, (r - innerR) / (outerR - innerR), 0.5);
 }
 uv.needsUpdate = true;
 
 // Create realistic ring material with color variation
 let ringColor = 0x888888;
 let ringOpacity = 0.3;
 
 if (config.prominentRings) {
 // Saturn's rings: use real texture if available, otherwise procedural
 ringColor = 0xd4c5b0;
 ringOpacity = 0.85;
 } else if (config.id === 'jupiter') {
 ringColor = 0x997755;
 ringOpacity = 0.2;
 } else if (config.id === 'uranus') {
 // Uranus: 13 narrow dark rings — real but nearly invisible; dark charcoal colour
 ringColor = 0x444444;
 ringOpacity = 0.07;
 } else if (config.id === 'neptune') {
 // Neptune: 5 faint dust arcs — extremely tenuous; deep dark blue-grey
 ringColor = 0x334455;
 ringOpacity = 0.05;
 }
 
 // For Saturn, try to load a real ring texture with transparency
 let ringMap = null;
 if (config.prominentRings) {
 const ringLoader = new THREE.TextureLoader();
 try {
 ringMap = ringLoader.load('./textures/rings/saturn_ring_alpha.webp');
 } catch { ringMap = null; }
 }
 // Provide a 1×1 fallback so the sampler2D uniform is always a valid texture
 // (avoids driver issues on GPUs that evaluate both GLSL ternary branches)
 if (!ringMap) {
 ringMap = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
 ringMap.needsUpdate = true;
 }

 // Saturn ring material: forward-scatter shader simulates light shining through
 // dusty ring particles from behind — the iconic "dark side" ring brightening.
 // The sun is always at world origin (0,0,0) in this solar system simulation.
 const ringForwardScatterVert = /* glsl */`
 varying vec2 vUv;
 varying vec3 vWorldPos;
 void main() {
 vUv = uv;
 vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
 }
 `;
 const ringForwardScatterFrag = /* glsl */`
 uniform sampler2D ringMap;
 uniform bool useTexture;
 uniform vec3 ringColor;
 uniform float ringOpacity;
 varying vec2 vUv;
 varying vec3 vWorldPos;
 void main() {
 vec4 texSample = useTexture ? texture2D(ringMap, vUv) : vec4(ringColor, ringOpacity);
 if (texSample.a < 0.01) discard;
 // Forward-scatter: view looking toward the sun through the rings → brighten
 // Sun is at origin; dirToSun = normalize(-vWorldPos)
 vec3 dirToCamera = normalize(cameraPosition - vWorldPos);
 vec3 dirToSun = normalize(-vWorldPos);
 // Phase: 1.0 when camera behind rings looking at sun, 0.0 otherwise
 float phase = max(0.0, dot(dirToCamera, dirToSun));
 float scatter = 1.0 + pow(phase, 5.0) * 1.5;
 gl_FragColor = vec4(texSample.rgb * scatter, texSample.a);
 }
 `;

 const ringMaterial = new THREE.ShaderMaterial({
 uniforms: {
 ringMap: { value: ringMap },
 useTexture: { value: !!config.prominentRings },
 ringColor: { value: new THREE.Color(ringColor) },
 ringOpacity: { value: ringOpacity }
 },
 vertexShader: ringForwardScatterVert,
 fragmentShader: ringForwardScatterFrag,
 side: THREE.DoubleSide,
 transparent: true,
 depthWrite: false
 });
 const rings = new THREE.Mesh(ringGeometry, ringMaterial);
 rings.rotation.x = Math.PI / 2;
 rings.castShadow = false; // Rings don't cast meaningful shadows at solar system scale
 rings.receiveShadow = true; // But can receive shadows from moons
 planet.add(rings);
 }

 scene.add(planet);
 this.objects.push(planet);
 this.pickableObjects.push(planet);

    // Merge any pending remote texture metadata captured before planet object existed
    const meta = this._pendingTextureMeta?.[config.name.toLowerCase()];
    if (meta) {
        planet.userData.remoteTextureAttempted = meta.attempted;
        planet.userData.remoteTextureSources = meta.sources;
        planet.userData.remoteTextureLoaded = meta.success;
        planet.userData.remoteTextureURL = meta.finalURL || null;
        planet.userData.remoteTextureLoadMs = meta.durationMs || null;
    }
 
 return planet;
 },

createMoon(planet, config) {
 const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
 
 // Enhanced moon materials based on specific moons
 // Use id (language-independent) for moon identification
 let moonMaterial;
 const moonId = (config.id || config.name).toLowerCase();
 
 if (moonId.includes('moon') && !moonId.includes('ganymede') && !moonId.includes('callisto')) {
 // Earth's Moon: REAL NASA LRO texture — no procedural normal/bump maps needed
 const moonTexture = this.createMoonTextureReal(2048);
 
 moonMaterial = new THREE.MeshStandardMaterial({
 map: moonTexture,
 roughness: 0.98, // Extremely rough - lunar regolith scatters light
 metalness: 0.0, // Zero metal - pure rock and dust
 // Critical for realistic moon phases - no ambient/emissive light
 emissive: 0x000000,
 emissiveIntensity: 0.0,
 envMapIntensity: 0.1
 });
 } else if (moonId.includes('phobos')) {
 // Phobos: Dark reddish-gray with Stickney crater
 const phobosTexture = this.createPhobosTextureReal(1024);
 moonMaterial = new THREE.MeshStandardMaterial({
 map: phobosTexture,
 roughness: 0.95,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Created Phobos texture (1024x1024)`);
 } else if (moonId.includes('deimos')) {
 // Deimos: Lighter gray, smoother surface
 const deimosTexture = this.createDeimosTextureReal(1024);
 moonMaterial = new THREE.MeshStandardMaterial({
 map: deimosTexture,
 roughness: 0.92,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Created Deimos texture (1024x1024)`);
 } else if (moonId.includes('io')) {
 // Io: NASA Galileo photorealistic volcanic surface - most volcanically active body
 const ioTexture = this.createIoTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: ioTexture,
 roughness: 0.75,
 metalness: 0.0,
 emissive: 0xff4400, // Subtle volcanic glow
 emissiveIntensity: 0.12 // Active volcanoes!
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Io photorealistic texture (2048)`);
 } else if (moonId.includes('europa')) {
 // Europa: NASA Galileo icy surface - smooth ice with reddish-brown cracks
 const europaTexture = this.createEuropaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: europaTexture,
 roughness: 0.65, // Icy but cracked surface, not mirror-smooth
 metalness: 0.0, // Ice is not metallic
 emissive: 0xccddff,
 emissiveIntensity: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Europa photorealistic texture (2048)`);
 } else if (moonId.includes('ganymede')) {
 // Ganymede: Largest moon in solar system, mix of old dark terrain and bright grooved terrain
 const ganymedeTexture = this.createGanymedeTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: ganymedeTexture,
 roughness: 0.85,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Ganymede photorealistic texture (2048)`);
 } else if (moonId.includes('callisto')) {
 // Callisto: Ancient, heavily cratered surface - oldest terrain in solar system
 const callistoTexture = this.createCallistoTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: callistoTexture,
 roughness: 0.92,
 metalness: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Callisto photorealistic texture (2048)`);
 } else if (moonId.includes('titan')) {
 // Titan: Saturn's largest moon with thick orange atmosphere (Cassini-Huygens)
 const titanTexture = this.createTitanTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: titanTexture,
 roughness: 0.95, // Thick hazy atmosphere
 metalness: 0.0,
 emissive: 0xff8844,
 emissiveIntensity: 0.08 // Subtle atmospheric glow
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Titan photorealistic texture (2048)`);
 } else if (moonId.includes('enceladus')) {
 // Enceladus: Bright icy moon with active geysers at south pole
 const enceladusTexture = this.createEnceladusTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: enceladusTexture,
 roughness: 0.7, // Icy but not mirror-smooth
 metalness: 0.0, // Ice is not metallic
 emissive: 0xeeffff,
 emissiveIntensity: 0.03 // Slight brightness for icy albedo
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Enceladus photorealistic texture (2048)`);
 } else if (moonId.includes('rhea')) {
 // Rhea: Saturn's second-largest moon - heavily cratered icy surface (NASA Cassini)
 const rheaTexture = this.createRheaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: rheaTexture,
 roughness: 0.85,
 metalness: 0.05,
 emissive: 0xddddee,
 emissiveIntensity: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Rhea photorealistic texture (2048)`);
 } else if (moonId.includes('triton')) {
 // Triton: Neptune's captured moon - pinkish nitrogen ice, cryovolcanism (NASA Voyager)
 const tritonTexture = this.createTritonTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: tritonTexture,
 roughness: 0.35,
 metalness: 0.1,
 emissive: 0xffdddd,
 emissiveIntensity: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Triton photorealistic texture (2048)`);
 } else if (moonId.includes('titania')) {
 // Titania: Uranus's largest moon - cratered surface with canyons (NASA Voyager)
 const titaniaTexture = this.createTitaniaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: titaniaTexture,
 roughness: 0.88,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Titania photorealistic texture (2048)`);
 } else if (moonId.includes('miranda')) {
 // Miranda: Uranus's smallest major moon - dramatic geological features (NASA Voyager)
 const mirandaTexture = this.createMirandaTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: mirandaTexture,
 roughness: 0.9,
 metalness: 0.05
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Miranda photorealistic texture (2048)`);
 } else if (moonId.includes('charon')) {
 // Charon: Pluto's largest moon - dark reddish north pole (NASA New Horizons)
 const charonTexture = this.createCharonTextureReal(2048);
 moonMaterial = MaterialFactory.createStandardMaterial({
 map: charonTexture,
 roughness: 0.9,
 metalness: 0.02
 });
 if (DEBUG && DEBUG.enabled) console.log(`[Moon Texture] Loading Charon photorealistic texture (2048)`);
 } else {
 // Default moon material
 moonMaterial = MaterialFactory.createColoredMaterial(config.color, {
 roughness: 0.9,
 metalness: 0.1
 });
 }

 const moon = new THREE.Mesh(geometry, moonMaterial);
 moon.castShadow = true;
 moon.receiveShadow = true;
 
 // Verify texture is applied
 if (DEBUG.enabled) {
 console.log(`[Moon Material] "${config.name}" has texture map: ${moonMaterial.map?.isTexture ? 'YES' : 'NO'}`);
 }

 // Get real astronomical data for this moon (use id if available, otherwise name)
 const astroDataKey = (config.id || config.name).toLowerCase();
 const astroData = this.ASTRONOMICAL_DATA[astroDataKey] || {};
 
 // Real astronomical data for day/night cycle
 // Most moons are tidally locked — rotation period ≈ orbital period
 const moonOrbitalPeriodHours = (this.SCIENTIFIC_MOON_ORBITAL_PERIODS[astroDataKey] || 0) * 24;

 moon.userData = {
 id: config.id || config.name.toLowerCase(), // English key for lookups
 name: config.id || config.name, // English name for internal lookups; UI translates via t(name.toLowerCase())
 type: 'moon',
 distance: config.distance,
 radius: config.radius,
 angle: 0,
 speed: config.speed,
 visualBaseSpeed: config.speed,
 rotationSpeed: config.rotationSpeed || 0.001, // Add rotation
 description: config.description,
 
 // Tidally locked default: use orbital period; fallback to Earth Moon's 655.7h
 realRotationPeriod: astroData.rotationPeriod || moonOrbitalPeriodHours || 655.7, // hours
 axialTilt: astroData.axialTilt || 0,
 retrograde: astroData.retrograde || false,
 rotationPhase: Math.random() * Math.PI * 2,
 // Tidal locking: defaults to true because every moon currently in the catalog
 // (Earth's Moon, Phobos/Deimos, the Galilean moons, Titan/Enceladus/Rhea,
 // Titania/Miranda, Triton, Charon) is genuinely tidally locked. Add
 // `tidallyLocked: false` to the createMoon config for any irregular or
 // chaotic moons (e.g., Hyperion, Phoebe, Nereid) added later.
 tidallyLocked: config.tidallyLocked !== undefined ? !!config.tidallyLocked : true
 };

 moon.userData.parentPlanet = planet.userData?.id || planet.userData?.name || null;
 const moonKey = (config.id || config.name).toLowerCase();
 const moonElements = this.SCIENTIFIC_MOON_ORBITAL_ELEMENTS[moonKey] || { eccentricity: 0, inclinationDeg: 0, periapsisDeg: 0 };
 moon.userData.orbitalEccentricity = moonElements.eccentricity || 0;
 moon.userData.orbitalInclination = (moonElements.inclinationDeg || 0) * Math.PI / 180;
 moon.userData.orbitalPeriapsis = (moonElements.periapsisDeg || 0) * Math.PI / 180;
 // Pre-cached trig — constant for each moon
 moon.userData._sinOrbInc = Math.sin(moon.userData.orbitalInclination);
 moon.userData._cosOrbInc = Math.cos(moon.userData.orbitalInclination);
 const _me = moon.userData.orbitalEccentricity;
 moon.userData._keplerSqrtPlus = Math.sqrt(1 + _me);
 moon.userData._keplerSqrtMinus = _me < 1 ? Math.sqrt(1 - _me) : 0;

 // Store moon reference using id (language-independent)
 const moonStorageKey = (config.id || config.name).trim().toLowerCase();
 this.moons[moonStorageKey] = moon;
 planet.userData.moons.push(moon);
 this.objects.push(moon);
 this.pickableObjects.push(moon);
 
 // Set initial position based on angle (IMPORTANT: must be done before adding to planet)
 moon.position.x = config.distance * Math.cos(moon.userData.angle);
 moon.position.z = config.distance * Math.sin(moon.userData.angle);
 moon.position.y = 0; // Keep in planet's equatorial plane
 
 planet.add(moon);
 
 if (DEBUG.enabled) console.log(`[Moon] Created "${config.name}" for ${planet.userData.name} at distance ${config.distance}, initial position (${moon.position.x.toFixed(2)}, ${moon.position.y.toFixed(2)}, ${moon.position.z.toFixed(2)})`);
 },

createAsteroidBelt(scene) {
 // ===== HYPER-REALISTIC ASTEROID BELT =====
 // Multiple size classes: dust, small, medium, large asteroids
 const asteroidBeltGroup = new THREE.Group();
 asteroidBeltGroup.name = 'asteroidBelt';
 
 // Asteroid belt is between Mars and Jupiter (2.2-3.2 AU real)
 // Educational scale: Mars=78, Jupiter=266, belt at 100-150 (125±25, ~2.7 AU × 51.28)
 // Realistic: Mars=227.9, Jupiter=778.6, so belt at ~350±150
 const baseDistance = this.realisticScale ? 350 : 125;
 const distanceSpread = this.realisticScale ? 150 : 25;
 
 // Large asteroids (visible as small irregular rocks)
 const largeCount = 150;
 const largeGeometry = new THREE.BufferGeometry();
 const largePositions = new Float32Array(largeCount * 3);
 const largeColors = new Float32Array(largeCount * 3);
 const largeSizes = new Float32Array(largeCount);
 
 for (let i = 0; i < largeCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = baseDistance + Math.random() * distanceSpread;
 const height = (Math.random() - 0.5) * 4;
 
 largePositions[i * 3] = distance * Math.cos(angle);
 largePositions[i * 3 + 1] = height;
 largePositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Varied rocky colors: dark gray, brown, reddish
 const colorType = Math.random();
 if (colorType < 0.4) {
 // C-type: dark carbonaceous
 const gray = 0.25 + Math.random() * 0.15;
 largeColors[i * 3] = gray;
 largeColors[i * 3 + 1] = gray * 0.95;
 largeColors[i * 3 + 2] = gray * 0.9;
 } else if (colorType < 0.7) {
 // S-type: stony, gray-brown
 const base = 0.4 + Math.random() * 0.2;
 largeColors[i * 3] = base;
 largeColors[i * 3 + 1] = base * 0.85;
 largeColors[i * 3 + 2] = base * 0.7;
 } else {
 // M-type: metallic, lighter gray
 const metal = 0.5 + Math.random() * 0.25;
 largeColors[i * 3] = metal * 0.95;
 largeColors[i * 3 + 1] = metal;
 largeColors[i * 3 + 2] = metal * 0.9;
 }
 
 largeSizes[i] = 0.5 + Math.random() * 0.8; // Varied sizes
 }
 
 largeGeometry.setAttribute('position', new THREE.BufferAttribute(largePositions, 3));
 largeGeometry.setAttribute('color', new THREE.BufferAttribute(largeColors, 3));
 largeGeometry.setAttribute('size', new THREE.BufferAttribute(largeSizes, 1));
 
 const largeMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 size: 1.2,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.9
 });
 
 const largeAsteroids = new THREE.Points(largeGeometry, largeMaterial);
 asteroidBeltGroup.add(largeAsteroids);
 
 // Medium asteroids (more numerous, smaller)
 const mediumCount = 800;
 const mediumGeometry = new THREE.BufferGeometry();
 const mediumPositions = new Float32Array(mediumCount * 3);
 const mediumColors = new Float32Array(mediumCount * 3);
 const mediumSizes = new Float32Array(mediumCount);
 
 for (let i = 0; i < mediumCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 2) + Math.random() * (distanceSpread + 4); // Wider spread
 const height = (Math.random() - 0.5) * 5;
 
 mediumPositions[i * 3] = distance * Math.cos(angle);
 mediumPositions[i * 3 + 1] = height;
 mediumPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 const gray = 0.35 + Math.random() * 0.25;
 const brownTint = Math.random() * 0.15;
 mediumColors[i * 3] = gray;
 mediumColors[i * 3 + 1] = gray * (0.9 - brownTint);
 mediumColors[i * 3 + 2] = gray * (0.85 - brownTint * 1.5);
 
 mediumSizes[i] = 0.25 + Math.random() * 0.4;
 }
 
 mediumGeometry.setAttribute('position', new THREE.BufferAttribute(mediumPositions, 3));
 mediumGeometry.setAttribute('color', new THREE.BufferAttribute(mediumColors, 3));
 mediumGeometry.setAttribute('size', new THREE.BufferAttribute(mediumSizes, 1));
 
 const mediumMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 size: 0.6,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.75
 });
 
 const mediumAsteroids = new THREE.Points(mediumGeometry, mediumMaterial);
 asteroidBeltGroup.add(mediumAsteroids);
 
 // Dust and small debris (very numerous, creates density)
 const dustCount = 2500;
 const dustGeometry = new THREE.BufferGeometry();
 const dustPositions = new Float32Array(dustCount * 3);
 const dustColors = new Float32Array(dustCount * 3);
 const dustSizes = new Float32Array(dustCount);
 
 for (let i = 0; i < dustCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 5) + Math.random() * (distanceSpread + 10); // Widest spread
 const height = (Math.random() - 0.5) * 6;
 
 dustPositions[i * 3] = distance * Math.cos(angle);
 dustPositions[i * 3 + 1] = height;
 dustPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 const brightness = 0.3 + Math.random() * 0.3;
 dustColors[i * 3] = brightness;
 dustColors[i * 3 + 1] = brightness * 0.9;
 dustColors[i * 3 + 2] = brightness * 0.85;
 
 dustSizes[i] = 0.1 + Math.random() * 0.15;
 }
 
 dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
 dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
 dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
 
 const dustMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 size: 0.25,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.5
 });
 
 const dust = new THREE.Points(dustGeometry, dustMaterial);
 asteroidBeltGroup.add(dust);
 
 asteroidBeltGroup.userData = {
 name: 'asteroidBelt',
 type: 'asteroidBelt',
 description: t('descAsteroidBelt'),
 funFact: t('funFactAsteroidBelt'),
 count: largeCount + mediumCount + dustCount,
 radius: 40
 };
 
 scene.add(asteroidBeltGroup);
 this.asteroidBelt = asteroidBeltGroup;
 this.objects.push(asteroidBeltGroup);
 
 if (DEBUG.enabled) console.log(` Asteroid belt: ${largeCount + mediumCount + dustCount} particles`);
 },

createKuiperBelt(scene) {
 // ===== HYPER-REALISTIC KUIPER BELT =====
 // Icy worlds with varied compositions: water ice, methane ice, nitrogen ice
 const kuiperBeltGroup = new THREE.Group();
 kuiperBeltGroup.name = 'kuiperBelt';
 
 // Kuiper belt is beyond Neptune (30-50 AU real, centered around 40 AU)
 // Real distances: Neptune=30 AU, Pluto=39.5 AU, Kuiper Belt main region=30-55 AU
 // Educational scale: Neptune=1542, Pluto=2024, so belt should be 1600-2400 (center ~2000)
 // Realistic scale: Neptune=4495, Pluto=5906, so belt should be 4500-8250 (center ~6000)
 const baseDistance = this.realisticScale ? 6000 : 2000;
 const distanceSpread = this.realisticScale ? 2250 : 400;
 
 // Large Kuiper Belt Objects (KBOs) - Pluto-like dwarf planets
 const largeKBOCount = 200;
 const largeKBOGeometry = new THREE.BufferGeometry();
 const largeKBOPositions = new Float32Array(largeKBOCount * 3);
 const largeKBOColors = new Float32Array(largeKBOCount * 3);
 const largeKBOSizes = new Float32Array(largeKBOCount);
 
 for (let i = 0; i < largeKBOCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = baseDistance + Math.random() * distanceSpread;
 const height = (Math.random() - 0.5) * 35; // Larger vertical spread
 
 largeKBOPositions[i * 3] = distance * Math.cos(angle);
 largeKBOPositions[i * 3 + 1] = height;
 largeKBOPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Varied icy compositions
 const iceType = Math.random();
 if (iceType < 0.4) {
 // Water ice: white-gray
 const ice = 0.7 + Math.random() * 0.25;
 largeKBOColors[i * 3] = ice * 0.9;
 largeKBOColors[i * 3 + 1] = ice * 0.95;
 largeKBOColors[i * 3 + 2] = ice;
 } else if (iceType < 0.7) {
 // Methane ice: reddish-brown (like Pluto)
 const base = 0.6 + Math.random() * 0.2;
 largeKBOColors[i * 3] = base;
 largeKBOColors[i * 3 + 1] = base * 0.75;
 largeKBOColors[i * 3 + 2] = base * 0.6;
 } else {
 // Nitrogen/CO ice: bluish-white
 const blue = 0.75 + Math.random() * 0.2;
 largeKBOColors[i * 3] = blue * 0.85;
 largeKBOColors[i * 3 + 1] = blue * 0.9;
 largeKBOColors[i * 3 + 2] = blue;
 }
 
 largeKBOSizes[i] = 0.6 + Math.random() * 1.0; // Larger than asteroids
 }
 
 largeKBOGeometry.setAttribute('position', new THREE.BufferAttribute(largeKBOPositions, 3));
 largeKBOGeometry.setAttribute('color', new THREE.BufferAttribute(largeKBOColors, 3));
 largeKBOGeometry.setAttribute('size', new THREE.BufferAttribute(largeKBOSizes, 1));
 
 const largeKBOMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.85
 });
 
 const largeKBOs = new THREE.Points(largeKBOGeometry, largeKBOMaterial);
 kuiperBeltGroup.add(largeKBOs);
 
 // Medium icy bodies (cubewanos, classical KBOs)
 const mediumKBOCount = 1200;
 const mediumKBOGeometry = new THREE.BufferGeometry();
 const mediumKBOPositions = new Float32Array(mediumKBOCount * 3);
 const mediumKBOColors = new Float32Array(mediumKBOCount * 3);
 const mediumKBOSizes = new Float32Array(mediumKBOCount);
 
 for (let i = 0; i < mediumKBOCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 5) + Math.random() * (distanceSpread + 15);
 const height = (Math.random() - 0.5) * 40;
 
 mediumKBOPositions[i * 3] = distance * Math.cos(angle);
 mediumKBOPositions[i * 3 + 1] = height;
 mediumKBOPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Mostly water ice with some variation
 const ice = 0.65 + Math.random() * 0.25;
 const tint = Math.random() * 0.1;
 mediumKBOColors[i * 3] = ice * (0.9 - tint);
 mediumKBOColors[i * 3 + 1] = ice * (0.92 + tint * 0.5);
 mediumKBOColors[i * 3 + 2] = ice * (0.95 + tint);
 
 mediumKBOSizes[i] = 0.35 + Math.random() * 0.5;
 }
 
 mediumKBOGeometry.setAttribute('position', new THREE.BufferAttribute(mediumKBOPositions, 3));
 mediumKBOGeometry.setAttribute('color', new THREE.BufferAttribute(mediumKBOColors, 3));
 mediumKBOGeometry.setAttribute('size', new THREE.BufferAttribute(mediumKBOSizes, 1));
 
 const mediumKBOMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.7
 });
 
 const mediumKBOs = new THREE.Points(mediumKBOGeometry, mediumKBOMaterial);
 kuiperBeltGroup.add(mediumKBOs);
 
 // Small icy debris and cometary nuclei
 const smallKBOCount = 3000;
 const smallKBOGeometry = new THREE.BufferGeometry();
 const smallKBOPositions = new Float32Array(smallKBOCount * 3);
 const smallKBOColors = new Float32Array(smallKBOCount * 3);
 const smallKBOSizes = new Float32Array(smallKBOCount);
 
 for (let i = 0; i < smallKBOCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance - 10) + Math.random() * (distanceSpread + 30); // Widest spread
 const height = (Math.random() - 0.5) * 45;
 
 smallKBOPositions[i * 3] = distance * Math.cos(angle);
 smallKBOPositions[i * 3 + 1] = height;
 smallKBOPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Faint icy particles
 const brightness = 0.6 + Math.random() * 0.3;
 smallKBOColors[i * 3] = brightness * 0.88;
 smallKBOColors[i * 3 + 1] = brightness * 0.93;
 smallKBOColors[i * 3 + 2] = brightness * 0.98;
 
 smallKBOSizes[i] = 0.15 + Math.random() * 0.25;
 }
 
 smallKBOGeometry.setAttribute('position', new THREE.BufferAttribute(smallKBOPositions, 3));
 smallKBOGeometry.setAttribute('color', new THREE.BufferAttribute(smallKBOColors, 3));
 smallKBOGeometry.setAttribute('size', new THREE.BufferAttribute(smallKBOSizes, 1));
 
 const smallKBOMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.55
 });
 
 const smallKBOs = new THREE.Points(smallKBOGeometry, smallKBOMaterial);
 kuiperBeltGroup.add(smallKBOs);
 
 // Scattered disk objects (highly eccentric, distant)
 const scatteredCount = 600;
 const scatteredGeometry = new THREE.BufferGeometry();
 const scatteredPositions = new Float32Array(scatteredCount * 3);
 const scatteredColors = new Float32Array(scatteredCount * 3);
 const scatteredSizes = new Float32Array(scatteredCount);
 
 for (let i = 0; i < scatteredCount; i++) {
 const angle = Math.random() * Math.PI * 2;
 const distance = (baseDistance + 70) + Math.random() * (distanceSpread * 0.8); // Further out
 const height = (Math.random() - 0.5) * 60; // Much larger inclination
 
 scatteredPositions[i * 3] = distance * Math.cos(angle);
 scatteredPositions[i * 3 + 1] = height;
 scatteredPositions[i * 3 + 2] = distance * Math.sin(angle);
 
 // Very faint, distant objects with subtle blue tint
 const faint = 0.5 + Math.random() * 0.25;
 scatteredColors[i * 3] = faint * 0.85;
 scatteredColors[i * 3 + 1] = faint * 0.9;
 scatteredColors[i * 3 + 2] = faint;
 
 scatteredSizes[i] = 0.3 + Math.random() * 0.4;
 }
 
 scatteredGeometry.setAttribute('position', new THREE.BufferAttribute(scatteredPositions, 3));
 scatteredGeometry.setAttribute('color', new THREE.BufferAttribute(scatteredColors, 3));
 scatteredGeometry.setAttribute('size', new THREE.BufferAttribute(scatteredSizes, 1));
 
 const scatteredMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.45
 });
 
 const scatteredObjects = new THREE.Points(scatteredGeometry, scatteredMaterial);
 kuiperBeltGroup.add(scatteredObjects);
 
 kuiperBeltGroup.userData = {
 name: 'kuiperBelt',
 type: 'kuiperBelt',
 description: t('descKuiperBelt'),
 funFact: t('funFactKuiperBelt'),
 count: largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount,
 radius: 60
 };
 
 scene.add(kuiperBeltGroup);
 this.kuiperBelt = kuiperBeltGroup;
 this.objects.push(kuiperBeltGroup);
 
 if (DEBUG.enabled) console.log(` Kuiper Belt: ${largeKBOCount + mediumKBOCount + smallKBOCount + scatteredCount} objects`);
 },

createHeliopause(scene) {
 // ===== HELIOPAUSE =====
 // The boundary where the solar wind meets the interstellar medium
 // Real distance: ~120 AU (Voyager 1 crossed it at ~121 AU in Aug 2012)
 // Voyager 2 crossed at ~119 AU in Nov 2018
 const heliopauseRadius = 2700; // ~120 AU educational scale, inside Oort Cloud
 
 // Create a translucent sphere to mark the boundary
 const geometry = GeometryFactory.createSphere(heliopauseRadius, 64);
 const material = new THREE.MeshBasicMaterial({
 color: 0x4488cc,
 transparent: true,
 opacity: 0.03,
 side: THREE.BackSide,
 depthWrite: false
 });
 const heliopauseMesh = new THREE.Mesh(geometry, material);
 heliopauseMesh.name = 'heliopause';

 // Add a subtle wireframe ring at the equator for visibility
 const ringGeometry = new THREE.RingGeometry(heliopauseRadius - 2, heliopauseRadius + 2, 128);
 const ringMaterial = new THREE.MeshBasicMaterial({
 color: 0x6699dd,
 transparent: true,
 opacity: 0.15,
 side: THREE.BackSide,
 depthWrite: false
 });
 const equatorRing = new THREE.Mesh(ringGeometry, ringMaterial);
 equatorRing.rotation.x = Math.PI / 2;
 heliopauseMesh.add(equatorRing);

 heliopauseMesh.userData = {
 name: t('heliopause'),
 type: 'heliopause',
 description: t('descHeliopause'),
 funFact: t('funFactHeliopause'),
 radius: heliopauseRadius,
 baseRadius: heliopauseRadius, // educational-scale radius — used by updateScale()
 realSize: '~240 AU diameter (~36 billion km)'
 };

 scene.add(heliopauseMesh);
 this.heliopause = heliopauseMesh;
 // NOT added to this.objects — the giant sphere would intercept all raycasts
 // and show the "Heliopause" hover label everywhere. Navigation uses
 // this.heliopause directly via the navigationMap in main.js.
 
 if (DEBUG.enabled) console.log(`[HELIO] Heliopause sphere at radius ${heliopauseRadius}`);
 },

createOortCloud(scene) {
 // ===== HYPER-REALISTIC OORT CLOUD =====
 // A spherical shell of icy planetesimals surrounding the entire solar system
 // Real distances: 50,000-200,000 AU (inner Oort cloud: 2,000-20,000 AU)
 // The Oort Cloud is the source of long-period comets
 
 const oortCloudGroup = new THREE.Group();
 oortCloudGroup.name = 'oortCloud';
 
 // Scale distances appropriately
 // Educational: Compressed to sit inside the constellation sphere (10,000 units)
 // Oort Cloud must encompass all spacecraft and stay inside the constellation sphere.
 // Range: 3,000–9,000 units (proportional — inner is 1.1× heliopause at 2700,
 // outer is 3.3× heliopause at 2700).
 //
 // Realistic: Proportionally scaled with the realistic heliopause (18,000 units):
 // inner = 18000 × 1.1 ≈ 20,000 units
 // outer = 18000 × 3.3 ≈ 60,000 units
 // (True AU values of 50k–200k AU would place particles millions of units away,
 // making them invisible before the galaxy transition; this compressed-but-proportional
 // scale preserves the relative journey through heliopause → Oort Cloud → galaxy.)
 const innerRadius = this.realisticScale ? 20000 : 3000;
 const outerRadius = this.realisticScale ? 60000 : 9000;
 
 // Inner Oort Cloud (Hills cloud) - denser concentration
 const innerOortCount = 800;
 const innerOortGeometry = new THREE.BufferGeometry();
 const innerOortPositions = new Float32Array(innerOortCount * 3);
 const innerOortColors = new Float32Array(innerOortCount * 3);
 const innerOortSizes = new Float32Array(innerOortCount);
 
 for (let i = 0; i < innerOortCount; i++) {
 // Spherical distribution
 const theta = Math.random() * Math.PI * 2; // Azimuth
 const phi = Math.acos(2 * Math.random() - 1); // Inclination (uniform sphere)
 const radius = innerRadius + Math.random() * (outerRadius - innerRadius) * 0.3; // Inner 30%
 
 innerOortPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 innerOortPositions[i * 3 + 1] = radius * Math.cos(phi);
 innerOortPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
 
 // Icy composition: pale white-blue
 const ice = 0.6 + Math.random() * 0.3;
 innerOortColors[i * 3] = ice * 0.85;
 innerOortColors[i * 3 + 1] = ice * 0.9;
 innerOortColors[i * 3 + 2] = ice;
 
 innerOortSizes[i] = 3 + Math.random() * 5;
 }
 
 innerOortGeometry.setAttribute('position', new THREE.BufferAttribute(innerOortPositions, 3));
 innerOortGeometry.setAttribute('color', new THREE.BufferAttribute(innerOortColors, 3));
 innerOortGeometry.setAttribute('size', new THREE.BufferAttribute(innerOortSizes, 1));
 
 const innerOortMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.7
 });
 
 const innerOort = new THREE.Points(innerOortGeometry, innerOortMaterial);
 oortCloudGroup.add(innerOort);
 
 // Outer Oort Cloud - sparse, spherical shell
 const outerOortCount = 1500;
 const outerOortGeometry = new THREE.BufferGeometry();
 const outerOortPositions = new Float32Array(outerOortCount * 3);
 const outerOortColors = new Float32Array(outerOortCount * 3);
 const outerOortSizes = new Float32Array(outerOortCount);
 
 for (let i = 0; i < outerOortCount; i++) {
 // Spherical distribution
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const radius = innerRadius + (outerRadius - innerRadius) * (0.3 + Math.random() * 0.7); // Outer 70%
 
 outerOortPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 outerOortPositions[i * 3 + 1] = radius * Math.cos(phi);
 outerOortPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
 
 // Very faint icy objects
 const faint = 0.5 + Math.random() * 0.25;
 outerOortColors[i * 3] = faint * 0.82;
 outerOortColors[i * 3 + 1] = faint * 0.88;
 outerOortColors[i * 3 + 2] = faint * 0.95;
 
 outerOortSizes[i] = 2 + Math.random() * 4;
 }
 
 outerOortGeometry.setAttribute('position', new THREE.BufferAttribute(outerOortPositions, 3));
 outerOortGeometry.setAttribute('color', new THREE.BufferAttribute(outerOortColors, 3));
 outerOortGeometry.setAttribute('size', new THREE.BufferAttribute(outerOortSizes, 1));
 
 const outerOortMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.5
 });
 
 const outerOort = new THREE.Points(outerOortGeometry, outerOortMaterial);
 oortCloudGroup.add(outerOort);
 
 // Sparse cometary nuclei - the source of long-period comets
 const cometaryCount = 400;
 const cometaryGeometry = new THREE.BufferGeometry();
 const cometaryPositions = new Float32Array(cometaryCount * 3);
 const cometaryColors = new Float32Array(cometaryCount * 3);
 const cometarySizes = new Float32Array(cometaryCount);
 
 for (let i = 0; i < cometaryCount; i++) {
 // Random spherical distribution
 const theta = Math.random() * Math.PI * 2;
 const phi = Math.acos(2 * Math.random() - 1);
 const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
 
 cometaryPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
 cometaryPositions[i * 3 + 1] = radius * Math.cos(phi);
 cometaryPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
 
 // Slightly brighter to represent larger nuclei
 const bright = 0.65 + Math.random() * 0.25;
 cometaryColors[i * 3] = bright * 0.88;
 cometaryColors[i * 3 + 1] = bright * 0.92;
 cometaryColors[i * 3 + 2] = bright;
 
 cometarySizes[i] = 4 + Math.random() * 6;
 }
 
 cometaryGeometry.setAttribute('position', new THREE.BufferAttribute(cometaryPositions, 3));
 cometaryGeometry.setAttribute('color', new THREE.BufferAttribute(cometaryColors, 3));
 cometaryGeometry.setAttribute('size', new THREE.BufferAttribute(cometarySizes, 1));
 
 const cometaryMaterial = new THREE.PointsMaterial({
 vertexColors: true,
 sizeAttenuation: true,
 transparent: true,
 opacity: 0.7
 });
 
 const cometaryNuclei = new THREE.Points(cometaryGeometry, cometaryMaterial);
 oortCloudGroup.add(cometaryNuclei);
 
 oortCloudGroup.userData = {
 name: 'oortCloud',
 type: 'oortCloud',
 description: t('descOortCloud'),
 funFact: t('funFactOortCloud'),
 count: innerOortCount + outerOortCount + cometaryCount,
 radius: this.realisticScale ? 60000 : 9000
 };
 
 scene.add(oortCloudGroup);
 this.oortCloud = oortCloudGroup;
 this.objects.push(oortCloudGroup);
 
 if (DEBUG.enabled) console.log(`[OORT] ${innerOortCount + outerOortCount + cometaryCount} objects (${this.realisticScale ? 'Realistic (20k–60k units)' : 'Educational (3k–9k units)'} scale)`);
 }
};
