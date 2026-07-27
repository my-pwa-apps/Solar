import * as THREE from 'three';
import { TEXTURE_CACHE } from '../TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from '../utils.js';

import { t } from '../i18n-t.js';

export function createProceduralTexture(type, size = 512) {
// Use reusable utilities from TextureGeneratorUtils
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);
const noise = TextureGeneratorUtils.noise;
const fbm = TextureGeneratorUtils.fbm;

switch(type) {
case 'earth':
// Earth: Blue oceans, green/brown continents, white poles
for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size;
const ny = y / size;

// Latitude effect (poles are white)
const lat = Math.abs(ny - 0.5) * 2; // 0 at equator, 1 at poles

// Continent noise
const continentNoise = fbm(nx * 4, ny * 4, 6);

// Ice caps at poles
if (lat > 0.85) {
// Polar ice caps
const iceVariation = noise(nx * 20, ny * 20) * 30;
data[idx] = 240 + iceVariation; // R
data[idx + 1] = 248 + iceVariation; // G
data[idx + 2] = 255; // B
} else if (continentNoise > 0.52) {
// Land (green/brown)
const landVariation = noise(nx * 15, ny * 15) * 0.3;
const greenness = (1 - lat) * 0.4; // More green at equator
data[idx] = 100 + landVariation * 100; // R
data[idx + 1] = 80 + greenness * 100; // G
data[idx + 2] = 50 + landVariation * 50; // B
} else {
// Ocean (blue with depth variation)
const depth = (0.52 - continentNoise) * 2;
data[idx] = 20 + depth * 30; // R
data[idx + 1] = 50 + depth * 80; // G
data[idx + 2] = 120 + depth * 100; // B
}
data[idx + 3] = 255; // Alpha
}
}
break;

case 'mars':
// Mars: Red with darker regions (ancient seas), white poles
for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size;
const ny = y / size;
const lat = Math.abs(ny - 0.5) * 2;

const craterNoise = fbm(nx * 8, ny * 8, 5);

if (lat > 0.88) {
// Polar ice caps (CO2 and water ice)
const iceVar = noise(nx * 25, ny * 25) * 40;
data[idx] = 220 + iceVar;
data[idx + 1] = 200 + iceVar;
data[idx + 2] = 190 + iceVar;
} else {
// Rusty red surface with variation
const rust = craterNoise;
data[idx] = 150 + rust * 100; // R
data[idx + 1] = 70 + rust * 60; // G
data[idx + 2] = 30 + rust * 30; // B
}
data[idx + 3] = 255;
}
}
break;

case 'moon':
// Moon: Gray with craters
for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size;
const ny = y / size;

// Crater patterns
const craters = fbm(nx * 10, ny * 10, 6);
const gray = 120 + craters * 80;

data[idx] = gray;
data[idx + 1] = gray;
data[idx + 2] = gray * 0.95; // Slight brown tint
data[idx + 3] = 255;
}
}
break;

case 'jupiter':
// Jupiter: Horizontal bands
for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const ny = y / size;

// Horizontal bands with turbulence
const bandPattern = Math.sin(ny * Math.PI * 8) * 0.5 + 0.5;
const turbulence = fbm(x / size * 3, ny * 2, 4) * 0.3;
const band = bandPattern + turbulence;

if (band > 0.6) {
// Light bands (tan/cream)
data[idx] = 230 + turbulence * 20;
data[idx + 1] = 200 + turbulence * 30;
data[idx + 2] = 150 + turbulence * 20;
} else {
// Dark bands (orange/brown)
data[idx] = 180 + turbulence * 40;
data[idx + 1] = 120 + turbulence * 30;
data[idx + 2] = 60 + turbulence * 20;
}
data[idx + 3] = 255;
}
}
break;

case 'saturn':
// Saturn: Subtle pale bands
for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const ny = y / size;

const bandPattern = Math.sin(ny * Math.PI * 6) * 0.3 + 0.7;
const turbulence = fbm(x / size * 2, ny * 1.5, 3) * 0.2;

data[idx] = 240 * (bandPattern + turbulence);
data[idx + 1] = 210 * (bandPattern + turbulence);
data[idx + 2] = 160 * (bandPattern + turbulence);
data[idx + 3] = 255;
}
}
break;
}

ctx.putImageData(imageData, 0, 0);

const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createCloudTexture(size = 512) {
// Create wispy cloud patterns using reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size;
const ny = y / size;

// Wispy cloud pattern using reusable FBM
const cloud = TextureGeneratorUtils.fbm(nx * 6, ny * 6, 6);
const cloudIntensity = Math.max(0, (cloud - 0.4) * 2);

// White clouds
const brightness = 255;
data[idx] = brightness;
data[idx + 1] = brightness;
data[idx + 2] = brightness;
data[idx + 3] = cloudIntensity * 255; // Alpha channel for transparency
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createSunTextureReal(size) {
// Request sun.webp - use a transparent tiny texture if it fails
const primary = [
'./textures/planets/sun.webp'
];
return this.loadPlanetTextureReal('Sun', primary, () => {
const canvas = document.createElement('canvas');
canvas.width = 2;
canvas.height = 2;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#FFAE14';
ctx.fillRect(0, 0, 2, 2);
const texture = new THREE.CanvasTexture(canvas);
return texture;
}, size, []);
}

export function loadPlanetTextureReal(planetName, primaryTextureURLs, proceduralFunction, size = 2048, pluginRepoURLs = []) {
   const planetKey = planetName.toLowerCase();
   if (!this._pendingTextureMeta) this._pendingTextureMeta = {};
   this._pendingTextureMeta[planetKey] = {
       attempted: true,
       primarySources: [...primaryTextureURLs],
       pluginSources: [...pluginRepoURLs],
       success: false,
       finalURL: null,
       phase: 'init',
       startedAt: performance.now(),
       proceduralGenerated: false,
       timeouts: 0,
       errors: []
   };

   // Create a tiny placeholder texture (mid-gray) so material has something immediately.
   const placeholderCanvas = document.createElement('canvas');
   placeholderCanvas.width = 2; placeholderCanvas.height = 2;
   const pctx = placeholderCanvas.getContext('2d');
   pctx.fillStyle = '#7f7f7f';
   pctx.fillRect(0,0,2,2);
   const placeholderTexture = new THREE.CanvasTexture(placeholderCanvas);
   placeholderTexture.needsUpdate = true;

   const loader = new THREE.TextureLoader();
   loader.setCrossOrigin('anonymous');

   let phase = 'primary';
   let primaryIndex = 0;
   let pluginIndex = 0;
   let currentTimeout = null;
   let retryCount = 0;
   const MAX_RETRIES = 1;
   const LOAD_TIMEOUT = IS_MOBILE ? 15000 : 10000;
   
   const tryNext = async () => {
       const meta = this._pendingTextureMeta[planetKey];
       
       // Clear any existing timeout
       if (currentTimeout) {
           clearTimeout(currentTimeout);
           currentTimeout = null;
       }
       if (phase === 'primary') {
           if (primaryIndex < primaryTextureURLs.length) {
               const url = primaryTextureURLs[primaryIndex];
               
               meta.phase = 'primary';
               
               if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName}: loading from SW cache / network: ${url}`);
               // Timeout per texture load attempt (longer on mobile)
               let loadTimedOut = false;
               currentTimeout = setTimeout(() => {
                   loadTimedOut = true;
                   meta.timeouts++;
                   console.warn(`[TEX] ${planetName}: TIMEOUT after ${LOAD_TIMEOUT/1000}s: ${url}`);
                   meta.errors.push({ url, error: `Timeout after ${LOAD_TIMEOUT/1000}s`, phase: 'primary' });
                   primaryIndex++;
                   tryNext();
               }, LOAD_TIMEOUT);
               
               loader.load(
                   url, 
                   (tex) => {
                       if (!loadTimedOut) {
                           clearTimeout(currentTimeout);
                           currentTimeout = null;
                           if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName}: network load SUCCESS: ${url}`);
                           this._onPlanetTextureSuccess(planetName, tex, url, 'primary');
                       }
                   }, 
                   undefined, 
                   (error) => {
                       if (!loadTimedOut) {
                           clearTimeout(currentTimeout);
                           currentTimeout = null;
                           const errorMsg = error?.message || error?.type || 'Network or CORS issue';
                           console.warn(`[TEX] ${planetName}: network load FAILED: ${url} — ${errorMsg}`);
                           meta.errors.push({ url, error: errorMsg, phase: 'primary' });
                           primaryIndex++;
                           tryNext();
                       }
                   }
               );
               return;
           }
           // Move to plugin phase
           phase = 'plugin';
       }
       if (phase === 'plugin') {
           if (pluginIndex < pluginRepoURLs.length) {
               const url = pluginRepoURLs[pluginIndex];
               meta.phase = 'plugin';
               
               let loadTimedOut = false;
               currentTimeout = setTimeout(() => {
                   loadTimedOut = true;
                   meta.timeouts++;
                   if (DEBUG && DEBUG.TEXTURES) console.warn(`⚠️ ${planetName} plugin source ${pluginIndex + 1} timed out after ${LOAD_TIMEOUT/1000}s: ${url}`);
                   meta.errors.push({ url, error: `Timeout after ${LOAD_TIMEOUT/1000}s`, phase: 'plugin' });
                   pluginIndex++;
                   tryNext();
               }, LOAD_TIMEOUT);
               
               loader.load(
                   url, 
                   (tex) => {
                       if (!loadTimedOut) {
                           clearTimeout(currentTimeout);
                           currentTimeout = null;
                           this._onPlanetTextureSuccess(planetName, tex, url, 'plugin');
                       }
                   }, 
                   undefined, 
                   (error) => {
                       if (!loadTimedOut) {
                           clearTimeout(currentTimeout);
                           currentTimeout = null;
                           const errorMsg = error?.message || error?.type || 'Network or CORS issue';
                           if (DEBUG && DEBUG.TEXTURES) {
                               console.warn(`[TEX] ${planetName} plugin source ${pluginIndex + 1} failed: ${url}`);
                               console.warn(`   Error: ${errorMsg}`);
                           }
                           meta.errors.push({ url, error: errorMsg, phase: 'plugin' });
                           pluginIndex++;
                           tryNext();
                       }
                   }
               );
               return;
           }
           // All sources exhausted — retry once before falling to procedural
           if (retryCount < MAX_RETRIES) {
               retryCount++;
               primaryIndex = 0;
               pluginIndex = 0;
               phase = 'primary';
               if (DEBUG && DEBUG.TEXTURES) console.log(`🔄 ${planetName} texture: retry ${retryCount}/${MAX_RETRIES}`);
               if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName}: retrying (${retryCount}/${MAX_RETRIES})`);
               // Brief delay before retry to let SW / network settle
               setTimeout(() => tryNext(), 1000);
               return;
           }
           phase = 'procedural';
       }
       if (phase === 'procedural') {
           console.warn(`[TEX] ${planetName}: ALL SOURCES FAILED → generating procedural. Errors:`, meta.errors);
           meta.phase = 'procedural';
           
           // Wrap procedural generation in try-catch for Quest safety
           try {
               const maybePromise = proceduralFunction.call(this, size);
               if (maybePromise && typeof maybePromise.then === 'function') {
                   maybePromise.then((tex) => {
                       if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName} procedural texture generated successfully`);
                       this._applyProceduralPlanetTexture(planetName, tex);
                   }).catch((err) => {
                       if (DEBUG && DEBUG.enabled) console.error(`[TEX] ${planetName} procedural texture generation failed:`, err);
                       meta.errors.push({ error: err.message, phase: 'procedural' });
                       // Keep placeholder texture as last resort
                   });
               } else {
                   if (DEBUG && DEBUG.TEXTURES) console.log(`[TEX] ${planetName} procedural texture generated successfully`);
                   this._applyProceduralPlanetTexture(planetName, maybePromise);
               }
           } catch (err) {
               if (DEBUG && DEBUG.enabled) console.error(`[TEX] ${planetName} procedural texture generation failed:`, err);
               meta.errors.push({ error: err.message, phase: 'procedural' });
               // Keep placeholder texture as last resort
           }
       }
   };

   // Kick off chain
   tryNext();
   return placeholderTexture; // caller receives placeholder; will be swapped later
}

export function _configureSphericalSurfaceTexture(tex, { colorSpace = null } = {}) {
   if (!tex) return tex;

   if (colorSpace) {
       tex.colorSpace = colorSpace;
   }

   tex.wrapS = THREE.RepeatWrapping;
   tex.wrapT = THREE.ClampToEdgeWrapping;
   tex.anisotropy = 16;

   const width = tex.image?.width || tex.source?.data?.width || 0;
   if (width > 1) {
       tex.offset.x = 0.5 / width;
   }

   tex.needsUpdate = true;
   return tex;
}

export function _onPlanetTextureSuccess(planetName, tex, url, sourceType) {
   try {
       if (planetName.toLowerCase() === 'earth') {
           this._configureSphericalSurfaceTexture(tex, { colorSpace: THREE.SRGBColorSpace });
       } else {
           tex.colorSpace = THREE.SRGBColorSpace;
           tex.anisotropy = 16;
           tex.needsUpdate = true;
       }
       
       // Cache the successfully loaded texture for future use (cache by planet name only)
       // NOTE: Planet textures are served from SW cache on every load — the IndexedDB
       // layer was removed because decoding a data URL via HTMLImageElement or createImageBitmap
       // produces subtly different GPU-uploaded values compared to THREE.TextureLoader loading
       // directly from the SW-cached file, causing lighting discrepancies on wide-gamut displays.
       
       // Find the object: check sun, planets, and moons
       const lowerName = planetName.toLowerCase();
       let planet;
       if (lowerName === 'sun') {
           planet = this.sun;
       } else if (this.planets[lowerName]) {
           planet = this.planets[lowerName];
       } else if (this.moons[lowerName]) {
           planet = this.moons[lowerName];
       }
       
       if (!planet) {
           if (DEBUG && DEBUG.enabled) console.warn(`[TEX] ${planetName} object not found when applying texture`);
           return;
       }
       
       if (!planet.material) {
           if (DEBUG && DEBUG.enabled) console.warn(`[TEX] ${planetName} has no material to apply texture to`);
           return;
       }
       
       planet.material.map = tex;
       // Note: Sun uses MeshBasicMaterial (inherently unlit/fullbright) — do NOT set
       // emissiveMap on it; MeshBasicMaterial has no emissiveMap uniform and Three.js
       // will crash in refreshUniformsCommon with "Cannot set properties of undefined".
       planet.material.needsUpdate = true;
       planet.userData.remoteTextureLoaded = true;
       planet.userData.remoteTextureURL = url;

// Earth: derive an ocean/land roughness map from the loaded color image so
// oceans get a sharp specular highlight while continents stay matte.
if (lowerName === 'earth' && planet.material.isMeshStandardMaterial) {
this._buildEarthOceanLandRoughnessMap(tex).then((roughnessMap) => {
if (!planet.material) return;
planet.material.roughnessMap = roughnessMap;
// With a roughness map, the scalar `roughness` is multiplied per-pixel,
// so reset it to 1.0 to use the map values directly.
planet.material.roughness = 1.0;
planet.material.needsUpdate = true;
}).catch(() => { /* keep matte fallback */ });
}

       const meta = this._pendingTextureMeta?.[lowerName];
       if (meta) {
           meta.success = true;
           meta.finishedAt = performance.now();
           meta.durationMs = meta.finishedAt - meta.startedAt;
           meta.remoteURL = url;
           meta.remoteSourceType = sourceType;
           meta.phase = 'done';
       }
   } catch (err) {
       if (DEBUG && DEBUG.enabled) console.error(`[TEX] Error applying ${planetName} texture:`, err);
   }
}

export function _applyProceduralPlanetTexture(planetName, tex) {
   try {
       // Handle Sun specially (stored in this.sun, not this.planets)
       const planet = planetName.toLowerCase() === 'sun' ? this.sun : this.planets[planetName.toLowerCase()];
       
       if (!planet) {
           if (DEBUG && DEBUG.enabled) console.warn(`[TEX] ${planetName} object not found when applying procedural texture`);
           return;
       }
       
       if (!planet.material) {
           if (DEBUG && DEBUG.enabled) console.warn(`⚠️ ${planetName} has no material to apply procedural texture to`);
           return;
       }
       
       planet.material.map = tex;
       // Note: Sun uses MeshBasicMaterial (inherently unlit/fullbright) — do NOT set
       // emissiveMap on it; MeshBasicMaterial has no emissiveMap uniform and Three.js
       // will crash in refreshUniformsCommon with "Cannot set properties of undefined".
       planet.material.needsUpdate = true;
       
       const meta = this._pendingTextureMeta?.[planetName.toLowerCase()];
       if (meta) {
           meta.success = false;
           meta.finishedAt = performance.now();
           meta.durationMs = meta.finishedAt - meta.startedAt;
           meta.proceduralGenerated = true;
           meta.phase = 'proceduralApplied';
       }
   } catch (err) {
       if (DEBUG && DEBUG.enabled) console.error(`[TEX] Error applying ${planetName} procedural texture:`, err);
   }
}

export function createMercuryTextureReal(size) {
const primary = [
'./textures/planets/mercury.webp'
];
const pluginFallbacks = [];
return this.loadPlanetTextureReal('Mercury', primary, this.createMercuryTexture, size, pluginFallbacks);
}

export function createVenusTextureReal(size) {
const primary = [
'./textures/planets/venus.webp'
];
return this.loadPlanetTextureReal('Venus', primary, this.createVenusTexture, size, []);
}

export function _buildEarthOceanLandRoughnessMap(colorTexture) {
    return new Promise((resolve, reject) => {
        const img = colorTexture?.image;
        if (!img) { reject(new Error('no image')); return; }

        const build = () => {
            try {
                const W = 512, H = 256; // downsampled — roughness map doesn't need full res
                const canvas = document.createElement('canvas');
                canvas.width = W; canvas.height = H;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, W, H);
                const imgData = ctx.getImageData(0, 0, W, H);
                const data = imgData.data;
                const OCEAN = 0x59; // ~0.35 * 255
                const LAND = 0xF2;  // ~0.95 * 255
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    // Ocean heuristic: blue notably exceeds red and green, and the pixel
                    // isn't near-white (clouds/ice). Cheap and robust on the NASA Blue Marble.
                    const isOcean = (b > r + 12) && (b > g + 6) && (r + g + b < 600);
                    const v = isOcean ? OCEAN : LAND;
                    data[i] = data[i + 1] = data[i + 2] = v;
                    data[i + 3] = 255;
                }
                ctx.putImageData(imgData, 0, 0);
                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                tex.anisotropy = 8;
                tex.needsUpdate = true;
                resolve(tex);
            } catch (err) {
                reject(err);
            }
        };

        if (img.complete && img.naturalWidth > 0) {
            build();
        } else if (typeof img.addEventListener === 'function') {
            img.addEventListener('load', build, { once: true });
            img.addEventListener('error', () => reject(new Error('image load failed')), { once: true });
        } else {
            // ImageBitmap or already-decoded source
            build();
        }
    });
}

export function createEarthTextureRealFixed(size) {
// Use local self-hosted textures.
// NOTE: earth_atmos_2k is the atmosphere/cloud overlay — do NOT use it
// as a color-map fallback; it would make Earth appear as an all-white cloud
// ball. If the surface texture fails, fall through to the procedural generator.
const primary = [
'./textures/planets/earth_1k.webp'
];
// No external fallbacks - use procedural if local fails
const pluginFallbacks = [];
return this.loadPlanetTextureReal('Earth', primary, this.createEarthTexture, size, pluginFallbacks);
}

export function createMarsTextureReal(size) {
const primary = [
'./textures/planets/mars_1k.webp'
];
return this.loadPlanetTextureReal('Mars', primary, this.createMarsTexture, size, []);
}

export function createJupiterTextureReal(size) {
const primary = [
'./textures/planets/jupiter.webp'
];
return this.loadPlanetTextureReal('Jupiter', primary, this.createJupiterTexture, size, []);
}

export function createSaturnTextureReal(size) {
const primary = [
'./textures/planets/saturn.webp'
];
return this.loadPlanetTextureReal('Saturn', primary, this.createSaturnTexture, size, []);
}

export function createUranusTextureReal(size) {
const primary = [
'./textures/planets/uranus.webp'
];
return this.loadPlanetTextureReal('Uranus', primary, this.createUranusTexture, size, []);
}

export function createNeptuneTextureReal(size) {
const primary = [
'./textures/planets/neptune.webp'
];
return this.loadPlanetTextureReal('Neptune', primary, this.createNeptuneTexture, size, []);
}

export function createMoonTextureReal(size) {
const primary = [
// Local self-hosted textures
'./textures/moons/moon_2k.webp',
'./textures/moons/moon_1k.webp',
'./textures/moons/moon_threejs_1k.webp'
];
const pluginFallbacks = [];
return this.loadPlanetTextureReal('Moon', primary, this.createMoonTexture, size, pluginFallbacks);
}

export function createPlutoTextureReal(size) {
   const primary = [
       './textures/dwarf-planets/pluto_2k.webp'
   ];
   return this.loadPlanetTextureReal('Pluto', primary, this.createPlutoTexture, size, []);
}

export function createCeresTextureReal(size) {
   const primary = [
       './textures/dwarf-planets/ceres_2k.webp'
   ];
   // Use Mercury-style cratered texture as fallback since Ceres is rocky and heavily cratered
   return this.loadPlanetTextureReal('Ceres', primary, this.createMercuryTexture, size, []);
}

export function createIoTextureReal(size) {
   const primary = [
       './textures/moons/io_2k.webp'
   ];
   return this.loadPlanetTextureReal('Io', primary, this.createIoTexture, size, []);
}

export function createEuropaTextureReal(size) {
   const primary = [
       './textures/moons/europa_2k.webp'
   ];
   return this.loadPlanetTextureReal('Europa', primary, this.createEuropaTexture, size, []);
}

export function createGanymedeTextureReal(size) {
   const primary = [
       './textures/moons/ganymede_2k.webp'
   ];
   return this.loadPlanetTextureReal('Ganymede', primary, this.createMoonTexture, size, []);
}

export function createCallistoTextureReal(size) {
   const primary = [
       './textures/moons/callisto_2k.webp'
   ];
   return this.loadPlanetTextureReal('Callisto', primary, this.createMoonTexture, size, []);
}

export function createTitanTextureReal(size) {
   const primary = [
       './textures/moons/titan_2k.webp'
   ];
   return this.loadPlanetTextureReal('Titan', primary, this.createTitanTexture, size, []);
}

export function createEnceladusTextureReal(size) {
   const primary = [
       './textures/moons/enceladus_2k.webp'
   ];
   return this.loadPlanetTextureReal('Enceladus', primary, this.createMoonTexture, size, []);
}

export function createRheaTextureReal(size) {
   const primary = [
       './textures/moons/rhea_2k.webp'
   ];
   return this.loadPlanetTextureReal('Rhea', primary, this.createMoonTexture, size, []);
}

export function createPhobosTextureReal(size) {
const primary = [
'./textures/moons/phobos_2k.webp'
];
return this.loadPlanetTextureReal('Phobos', primary, this.createPhobosTexture, size, []);
}

export function createDeimosTextureReal(size) {
   const primary = [
       './textures/moons/deimos_2k.webp'
   ];
   return this.loadPlanetTextureReal('Deimos', primary, this.createDeimosTexture, size, []);
}

export function createTritonTextureReal(size) {
   const primary = [
       './textures/moons/triton_2k.webp'
   ];
   return this.loadPlanetTextureReal('Triton', primary, this.createMoonTexture, size, []);
}

export function createTitaniaTextureReal(size) {
   const primary = [
       './textures/moons/titania_2k.webp'
   ];
   return this.loadPlanetTextureReal('Titania', primary, this.createMoonTexture, size, []);
}

export function createMirandaTextureReal(size) {
   const primary = [
       './textures/moons/miranda_2k.webp'
   ];
   return this.loadPlanetTextureReal('Miranda', primary, this.createMoonTexture, size, []);
}

export function createCharonTextureReal(size) {
   const primary = [
       './textures/moons/charon_2k.webp'
   ];
   return this.loadPlanetTextureReal('Charon', primary, this.createMoonTexture, size, []);
}

export function createHaumeaTextureReal(size) {
   const primary = [
       './textures/dwarf-planets/haumea_2k.webp'
   ];
   return this.loadPlanetTextureReal('Haumea', primary, this.createMoonTexture, size, []);
}

export function createMakemakeTextureReal(size) {
   const primary = [
       './textures/dwarf-planets/makemake_2k.webp'
   ];
   return this.loadPlanetTextureReal('Makemake', primary, this.createMoonTexture, size, []);
}

export function createErisTextureReal(size) {
   const primary = [
       './textures/dwarf-planets/eris_2k.webp'
   ];
   return this.loadPlanetTextureReal('Eris', primary, this.createMoonTexture, size, []);
}

export async function createEarthTexture(size) {
const cacheKey = `earth_texture_${size}`;

// Try to load from cache
const cachedDataURL = await TEXTURE_CACHE.get(cacheKey);
if (cachedDataURL) {
return new Promise((resolve) => {
const img = new Image();
img.onload = () => {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
resolve(texture);
};
img.src = cachedDataURL;
});
}

// Generate texture if not cached
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Enhanced Perlin-like noise with seed variations
const noise = (x, y, seed = 0) => {
const angle = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
return Math.abs(angle - Math.floor(angle));
};

// Turbulent fractal brownian motion
const turbulence = (x, y, size) => {
let value = 0, initialSize = size;
while (size >= 1) {
value += noise(x / size, y / size) * size;
size /= 2.0;
}
return value / initialSize;
};

const imageData = ctx.createImageData(size, size);
const data = imageData.data;

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;

// Convert to spherical coordinates for realistic mapping
const lon = (x / size) * Math.PI * 2;
const lat = (y / size) * Math.PI - Math.PI / 2;

// Distance from poles
const latNorm = Math.abs(lat) / (Math.PI / 2);

// Multi-frequency continent generation
const nx = x / size;
const ny = y / size;

// REALISTIC EARTH-LIKE CONTINENTS
// Approximate major landmasses using mathematical patterns

// Convert to normalized coordinates (0-1)
// Shift by 0.5 so u=0 aligns with the dateline (180°W),
// matching the NASA equirectangular convention.
const lonNorm = ((lon / (Math.PI * 2)) + 0.5) % 1.0; // 0 to 1, dateline at 0
const latNorm01 = (lat + Math.PI / 2) / Math.PI; // 0 to 1

// Americas (Western Hemisphere, lon ~0.25-0.45)
const americas = Math.exp(-Math.pow((lonNorm - 0.35) * 6, 2)) * 
(1 - Math.abs(latNorm01 - 0.5) * 1.5);

// Eurasia-Africa (Eastern Hemisphere, lon ~0.5-0.9)
const eurasia = Math.exp(-Math.pow((lonNorm - 0.5) * 4, 2)) * 
(1 - Math.abs(latNorm01 - 0.55) * 1.2) * 1.2;
const africa = Math.exp(-Math.pow((lonNorm - 0.65) * 8, 2)) * 
Math.exp(-Math.pow((latNorm01 - 0.35) * 4, 2)) * 1.5;

// Australia (lon ~1.05-1.15, wraps to ~0.05-0.15)
const australia = Math.exp(-Math.pow((lonNorm - 0.1) * 12, 2)) * 
Math.exp(-Math.pow((latNorm01 - 0.25) * 8, 2)) * 0.8;

// Antarctica (bottom, all longitudes)
const antarctica = Math.exp(-Math.pow((latNorm01 - 0.05) * 8, 2)) * 0.9;

// Greenland (lon ~0.42-0.48, lat ~0.75-0.85)
const greenland = Math.exp(-Math.pow((lonNorm - 0.47) * 20, 2)) * 
Math.exp(-Math.pow((latNorm01 - 0.8) * 10, 2)) * 0.7;

// Combine all continents
const continents = Math.max(americas, eurasia, africa, australia, antarctica, greenland);

// Add mountain ranges and terrain detail
const mountains = Math.sin(lon * 15 + lat * 8) * 0.15 * continents;
const terrain = noise(nx * 10, ny * 10, 0) * 0.2 * continents;
const details = noise(nx * 30, ny * 30, 1) * 0.1;

// Final elevation: continents provide base, details add variation
// Range: approximately -0.2 to +1.5
const elevation = continents * 0.8 + mountains + terrain + details - 0.2;

// Polar ice caps - Arctic and Antarctic
if (latNorm > 0.92 || latNorm01 < 0.08) {
const iceVariation = noise(nx * 30, ny * 30, 1) * 20;
data[idx] = 240 + iceVariation;
data[idx + 1] = 250 + iceVariation;
data[idx + 2] = 255;
}
// Land areas - elevation ranges from -0.2 to +1.5
// Use threshold of 0.15 for realistic ~30% land coverage
else if (elevation > 0.15) {
const landHeight = (elevation - 0.15) * 2;
const climate = (1 - latNorm) * 0.7; // Warmer at equator
const precipitation = turbulence(nx * 6, ny * 6, 64) / 100;

// Snow-capped mountains
if (landHeight > 0.7) {
const snowMix = Math.min(1, (landHeight - 0.7) * 5);
data[idx] = 140 + snowMix * 100;
data[idx + 1] = 130 + snowMix * 110;
data[idx + 2] = 120 + snowMix * 120;
}
// Deserts
else if (precipitation < 0.3 || latNorm > 0.7) {
const sandVar = noise(nx * 40, ny * 40, 2) * 30;
data[idx] = 194 + sandVar;
data[idx + 1] = 178 + sandVar * 0.8;
data[idx + 2] = 128 + sandVar * 0.5;
}
// Forests - BRIGHTER greens
else if (climate > 0.4 && precipitation > 0.5) {
const forestVar = noise(nx * 25, ny * 25, 3) * 40;
data[idx] = 60 + forestVar * 0.8; // Brighter green
data[idx + 1] = 180 - forestVar * 0.3; // Brighter
data[idx + 2] = 60 + forestVar * 0.5;
}
// Grasslands/plains - BRIGHTER
else {
const grassVar = noise(nx * 30, ny * 30, 4) * 35;
data[idx] = 130 + grassVar; // Brighter base
data[idx + 1] = 170 - grassVar * 0.3;
data[idx + 2] = 50 + grassVar * 0.8;
}
}
// Shallow water - BRIGHT for visibility (between 0.05 and 0.15)
else if (elevation > 0.05) {
const shallow = (elevation - 0.05) * 30;
data[idx] = 100 + shallow * 3; // Bright aqua
data[idx + 1] = 200 - shallow;
data[idx + 2] = 240 - shallow * 2;
}
// Deep ocean - BRIGHTER blues for visibility (below 0.05)
else {
const depth = Math.max(0, 0.05 - elevation) * 2;
data[idx] = Math.max(40, 70 - depth * 10); // Much brighter base
data[idx + 1] = Math.max(80, 130 - depth * 30);
data[idx + 2] = Math.max(150, 200 - depth * 30);
}

data[idx + 3] = 255;
}
}

ctx.putImageData(imageData, 0, 0);

// Cache the texture for future use
const dataURL = canvas.toDataURL('image/png');
TEXTURE_CACHE.set(cacheKey, dataURL).catch(() => {
// Cache write failed - will regenerate next time
});

// Create texture BEFORE adding clouds
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;

return texture;
}

export function createEarthBumpMap(size) {
const cacheKey = `earth_bump_${size}`;
const canvasCacheKey = `${cacheKey}_canvas`;

// Check MEMORY cache for pre-generated canvas (synchronous, instant)
if (TEXTURE_CACHE.cache.has(canvasCacheKey)) {
const cachedCanvas = TEXTURE_CACHE.cache.get(canvasCacheKey);
const texture = new THREE.CanvasTexture(cachedCanvas);
texture.needsUpdate = true;
if (DEBUG && DEBUG.TEXTURES) console.log(`✅ Earth bump map loaded from memory cache`);
return texture;
}

// Generate texture (no cache hit)
if (DEBUG && DEBUG.TEXTURES) console.log(`🎨 Generating Earth bump map (${size}x${size})...`);
const startTime = performance.now();
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const noise = (x, y, seed = 0) => {
const angle = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
return Math.abs(angle - Math.floor(angle));
};

const turbulence = (x, y, size) => {
let value = 0, initialSize = size;
while (size >= 1) {
value += noise(x / size, y / size) * size;
size /= 2.0;
}
return value / initialSize;
};

const imageData = ctx.createImageData(size, size);
const data = imageData.data;

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size * 2, ny = y / size * 2;

// Match land areas from main texture
const continents = turbulence(nx * 4, ny * 4, 128);
const mountains = turbulence(nx * 8, ny * 8, 64) * 0.5;
const details = turbulence(nx * 16, ny * 16, 32) * 0.25;
const elevation = (continents + mountains + details) / 200;

let gray;
if (elevation > 0.48) {
// Land: higher elevation (LOWERED from 0.53 to 0.48)
const landHeight = (elevation - 0.48) * 10;
const mountainNoise = turbulence(nx * 12, ny * 12, 128) / 100;
gray = Math.floor(140 + landHeight * 80 + mountainNoise * 60);
} else {
// Ocean: lower elevation
gray = Math.floor(100 - (0.48 - elevation) * 80);
}

data[idx] = Math.max(0, Math.min(255, gray));
data[idx + 1] = Math.max(0, Math.min(255, gray));
data[idx + 2] = Math.max(0, Math.min(255, gray));
data[idx + 3] = 255;
}
}

ctx.putImageData(imageData, 0, 0);

// Cache the canvas in memory for instant reuse (synchronous)
TEXTURE_CACHE.cache.set(canvasCacheKey, canvas);

// Also cache as data URL in IndexedDB for persistence (async, non-blocking)
const dataURL = canvas.toDataURL('image/png');
TEXTURE_CACHE.set(cacheKey, dataURL).catch((e) => { if (DEBUG && DEBUG.TEXTURES) console.warn('[TEX] Cache write failed:', e); });

const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
if (DEBUG && DEBUG.TEXTURES) console.log(`⏱️ Earth bump map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
return texture;
}

export function createEarthNormalMap(size) {
    const cacheKey = `earth_normal_${size}`;
    const canvasCacheKey = `${cacheKey}_canvas`;

    // Check MEMORY cache for pre-generated canvas (synchronous, instant)
    if (TEXTURE_CACHE.cache.has(canvasCacheKey)) {
        const cachedCanvas = TEXTURE_CACHE.cache.get(canvasCacheKey);
        const texture = new THREE.CanvasTexture(cachedCanvas);
        texture.needsUpdate = true;
        if (DEBUG && DEBUG.TEXTURES) console.log(`✅ Earth normal map loaded from memory cache`);
        return texture;
    }

    // Generate texture (no cache hit)
    if (DEBUG && DEBUG.TEXTURES) console.log(`🎨 Generating Earth normal map (${size}x${size})...`);
    const startTime = performance.now();
    // Normal map for mountain ranges and ocean trenches
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const noise = (x, y, seed = 0) => {
        const angle = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
        return Math.abs(angle - Math.floor(angle));
    };

    const turbulence = (x, y, size) => {
        let value = 0, initialSize = size;
        while (size >= 1) {
            value += noise(x / size, y / size) * size;
            size /= 2.0;
        }
        return value / initialSize;
    };

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Calculate normals from height map with wrapped horizontal sampling so the
    // equirectangular seam does not create a lighting split on the sphere.
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const nx = x / size * 2, ny = y / size * 2;
            const leftX = (x - 1 + size) % size;
            const rightX = (x + 1) % size;
            const upY = Math.max(0, y - 1);
            const downY = Math.min(size - 1, y + 1);

            // Sample height at neighboring pixels
            const h = turbulence(nx, ny, 128) / 128;
            const hL = turbulence(leftX / size * 2, ny, 128) / 128;
            const hR = turbulence(rightX / size * 2, ny, 128) / 128;
            const hU = turbulence(nx, upY / size * 2, 128) / 128;
            const hD = turbulence(nx, downY / size * 2, 128) / 128;

            // Calculate gradients
            const dX = (hR - hL) * 2;
            const dY = (hD - hU) * 2;

            // Convert to normal map RGB (blue = up, red = x, green = y)
            data[idx] = Math.floor((dX + 1) * 127.5);     // R: -1 to 1 -> 0 to 255
            data[idx + 1] = Math.floor((dY + 1) * 127.5); // G: -1 to 1 -> 0 to 255
            data[idx + 2] = 200;                          // B: mostly pointing up
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Cache the canvas in memory for instant reuse (synchronous)
    TEXTURE_CACHE.cache.set(canvasCacheKey, canvas);

    // Also cache as data URL in IndexedDB for persistence (async, non-blocking)
    const dataURL = canvas.toDataURL('image/png');
    TEXTURE_CACHE.set(cacheKey, dataURL).catch((e) => { if (DEBUG && DEBUG.TEXTURES) console.warn('[TEX] Cache write failed:', e); });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    if (DEBUG && DEBUG.TEXTURES) console.log(`⏱️ Earth normal map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
    return texture;
}

export function createEarthSpecularMap(size) {
const cacheKey = `earth_specular_${size}`;
const canvasCacheKey = `${cacheKey}_canvas`;

// Check MEMORY cache for pre-generated canvas (synchronous, instant)
if (TEXTURE_CACHE.cache.has(canvasCacheKey)) {
const cachedCanvas = TEXTURE_CACHE.cache.get(canvasCacheKey);
const texture = new THREE.CanvasTexture(cachedCanvas);
texture.needsUpdate = true;
if (DEBUG && DEBUG.TEXTURES) console.log(`✅ Earth specular map loaded from memory cache`);
return texture;
}

// Generate texture (no cache hit)
if (DEBUG && DEBUG.TEXTURES) console.log(`🎨 Generating Earth specular map (${size}x${size})...`);
const startTime = performance.now();
// Oceans are shiny, land is rough
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const noise = (x, y) => {
const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
return n - Math.floor(n);
};

const fbm = (x, y) => {
return noise(x * 6, y * 6) * 0.6 + noise(x * 12, y * 12) * 0.4;
};

const imageData = ctx.createImageData(size, size);
const data = imageData.data;

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

const continentNoise = fbm(nx, ny);

// Ocean = dark (smooth/shiny), Land = light (rough)
const roughness = continentNoise > 0.48 ? 200 : 50;

data[idx] = roughness;
data[idx + 1] = roughness;
data[idx + 2] = roughness;
data[idx + 3] = 255;
}
}

ctx.putImageData(imageData, 0, 0);

// Cache the canvas in memory for instant reuse (synchronous)
TEXTURE_CACHE.cache.set(canvasCacheKey, canvas);

// Also cache as data URL in IndexedDB for persistence (async, non-blocking)
const dataURL = canvas.toDataURL('image/png');
TEXTURE_CACHE.set(cacheKey, dataURL).catch((e) => { if (DEBUG && DEBUG.TEXTURES) console.warn('[TEX] Cache write failed:', e); });

const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
if (DEBUG && DEBUG.TEXTURES) console.log(`⏱️ Earth specular map generated in ${(performance.now() - startTime).toFixed(0)}ms`);
return texture;
}

export function createMoonTexture(size) {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const noise = (x, y) => {
const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
return n - Math.floor(n);
};

const imageData = ctx.createImageData(size, size);
const data = imageData.data;

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Base regolith color (gray)
let gray = 100 + noise(nx * 40, ny * 40) * 60;

// Maria (dark basalt plains)
const maria = noise(nx * 5, ny * 5);
if (maria < 0.3) {
gray *= 0.6; // Darker regions
}

// Ray systems (bright ejecta)
const rays = noise(nx * 80, ny * 80);
if (rays > 0.9) {
gray = Math.min(255, gray * 1.4);
}

data[idx] = gray;
data[idx + 1] = gray * 0.98;
data[idx + 2] = gray * 0.96;
data[idx + 3] = 255;
}
}

ctx.putImageData(imageData, 0, 0);

// Add craters
for (let i = 0; i < 200; i++) {
const x = Math.random() * size;
const y = Math.random() * size;
const radius = 5 + Math.random() * 40;

// Crater shadow
const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
craterGradient.addColorStop(0, 'rgba(20, 20, 20, 0.8)');
craterGradient.addColorStop(0.3, 'rgba(80, 80, 80, 0.4)');
craterGradient.addColorStop(0.7, 'rgba(140, 140, 140, 0.2)');
craterGradient.addColorStop(1, 'rgba(160, 160, 160, 0)');

ctx.fillStyle = craterGradient;
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
}

const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createMoonBumpMap(size) {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

ctx.fillStyle = '#808080';
ctx.fillRect(0, 0, size, size);

// Add crater depth
for (let i = 0; i < 200; i++) {
const x = Math.random() * size;
const y = Math.random() * size;
const radius = 5 + Math.random() * 40;

// Dark center (depression)
const depthGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
depthGradient.addColorStop(0, '#202020');
depthGradient.addColorStop(0.5, '#606060');
depthGradient.addColorStop(0.9, '#A0A0A0');
depthGradient.addColorStop(1, '#808080');

ctx.fillStyle = depthGradient;
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
}

const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createMoonNormalMap(size) {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

ctx.fillStyle = '#8080FF';
ctx.fillRect(0, 0, size, size);

// Add crater rim normals
for (let i = 0; i < 200; i++) {
const x = Math.random() * size;
const y = Math.random() * size;
const radius = 5 + Math.random() * 40;

// Draw crater rim with normal variation
ctx.strokeStyle = `rgba(255, 128, 200, 0.3)`;
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.stroke();
}

const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createMarsTexture(size) {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const noise = (x, y) => {
const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
return n - Math.floor(n);
};

const fbm = (x, y, octaves = 6) => {
let value = 0, amp = 1, freq = 1, maxVal = 0;
for (let i = 0; i < octaves; i++) {
value += noise(x * freq, y * freq) * amp;
maxVal += amp;
amp *= 0.5;
freq *= 2;
}
return value / maxVal;
};

const imageData = ctx.createImageData(size, size);
const data = imageData.data;

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;
const lat = Math.abs(ny - 0.5) * 2;

// Polar ice caps
if (lat > 0.9) {
data[idx] = 255;
data[idx + 1] = 240;
data[idx + 2] = 230;
} else {
// Rusty red surface with canyons
const terrain = fbm(nx * 8, ny * 8, 7);
const canyon = fbm(nx * 15, ny * 15, 3);

// Olympus Mons and Valles Marineris simulation
const r = 150 + terrain * 80 - (canyon < 0.3 ? 40 : 0);
const g = 70 + terrain * 50 - (canyon < 0.3 ? 30 : 0);
const b = 30 + terrain * 30 - (canyon < 0.3 ? 20 : 0);

data[idx] = Math.max(0, Math.min(255, r));
data[idx + 1] = Math.max(0, Math.min(255, g));
data[idx + 2] = Math.max(0, Math.min(255, b));
}
data[idx + 3] = 255;
}
}

ctx.putImageData(imageData, 0, 0);
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createMarsBumpMap(size) {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const noise = (x, y) => {
const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
return n - Math.floor(n);
};

const imageData = ctx.createImageData(size, size);
const data = imageData.data;

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Mountains and canyons
const elevation = noise(nx * 20, ny * 20) * 0.5 + noise(nx * 40, ny * 40) * 0.5;
const gray = Math.floor(128 + elevation * 100);

data[idx] = gray;
data[idx + 1] = gray;
data[idx + 2] = gray;
data[idx + 3] = 255;
}
}

ctx.putImageData(imageData, 0, 0);
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createMarsNormalMap(size) {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

ctx.fillStyle = '#8080FF';
ctx.fillRect(0, 0, size, size);

const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createPhobosTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Dark gray carbonaceous surface with reddish dust
const gray = 80 + TextureGeneratorUtils.noise(nx * 30, ny * 30) * 50;

data[idx] = gray * 0.85; // Slightly red-tinted
data[idx + 1] = gray * 0.75;
data[idx + 2] = gray * 0.70;
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);

// Add large Stickney crater (about 1/3 diameter)
const centerX = size * 0.4;
const centerY = size * 0.5;
const craterRadius = size * 0.15;
const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, craterRadius);
gradient.addColorStop(0, '#252525');
gradient.addColorStop(0.7, '#404040');
gradient.addColorStop(1, '#505050');
ctx.fillStyle = gradient;
ctx.beginPath();
ctx.arc(centerX, centerY, craterRadius, 0, Math.PI * 2);
ctx.fill();

return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createDeimosTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Lighter gray than Phobos, smoother surface
const gray = 100 + TextureGeneratorUtils.noise(nx * 25, ny * 25) * 40;

data[idx] = gray * 0.90;
data[idx + 1] = gray * 0.85;
data[idx + 2] = gray * 0.80;
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createIoTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Volcanic yellow/orange/red surface
const volcanic = TextureGeneratorUtils.noise(nx * 20, ny * 20);
const sulfur = TextureGeneratorUtils.noise(nx * 10, ny * 10);

let r, g, b;
if (volcanic < 0.3) {
// Dark lava flows
r = 120 + sulfur * 40;
g = 60 + sulfur * 30;
b = 20;
} else if (volcanic < 0.7) {
// Yellow sulfur plains
r = 255;
g = 200 + sulfur * 40;
b = 80 + sulfur * 60;
} else {
// Orange/red volcanic regions
r = 255;
g = 120 + sulfur * 60;
b = 40;
}

data[idx] = r;
data[idx + 1] = g;
data[idx + 2] = b;
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createEuropaTexture(size) {
// Use reusable utilities
const { canvas, ctx } = TextureGeneratorUtils.createCanvas(size);

// Icy white/cream base
ctx.fillStyle = '#f5ede0';
ctx.fillRect(0, 0, size, size);

// Add crack patterns (reddish-brown lineae)
ctx.strokeStyle = 'rgba(150, 100, 80, 0.4)';
ctx.lineWidth = size / 200;
for (let i = 0; i < 50; i++) {
ctx.beginPath();
const startX = Math.random() * size;
const startY = Math.random() * size;
ctx.moveTo(startX, startY);
for (let j = 0; j < 5; j++) {
ctx.lineTo(
startX + (Math.random() - 0.5) * size * 0.5,
startY + (Math.random() - 0.5) * size * 0.5
);
}
ctx.stroke();
}

return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createTitanTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Orange atmosphere with darker surface features
const terrain = TextureGeneratorUtils.noise(nx * 15, ny * 15);
const r = 255;
const g = 140 + terrain * 60;
const b = 50 + terrain * 30;

data[idx] = r;
data[idx + 1] = g;
data[idx + 2] = b;
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createMercuryTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Base gray-brown color
let gray = 120 + TextureGeneratorUtils.noise(nx * 30, ny * 30) * 60;

// Ray systems
if (TextureGeneratorUtils.noise(nx * 100, ny * 100) > 0.92) {
gray = Math.min(255, gray * 1.3);
}

data[idx] = gray;
data[idx + 1] = gray * 0.9;
data[idx + 2] = gray * 0.8;
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);

// Add craters
for (let i = 0; i < 300; i++) {
const x = Math.random() * size;
const y = Math.random() * size;
const radius = 3 + Math.random() * 25;

const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
craterGradient.addColorStop(0, 'rgba(30, 25, 20, 0.7)');
craterGradient.addColorStop(0.5, 'rgba(100, 90, 80, 0.3)');
craterGradient.addColorStop(1, 'rgba(140, 130, 120, 0)');

ctx.fillStyle = craterGradient;
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
}

return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createMercuryBumpMap(size) {
// Use reusable utilities
const { canvas, ctx } = TextureGeneratorUtils.createCanvas(size);

ctx.fillStyle = '#808080';
ctx.fillRect(0, 0, size, size);

// Crater depressions
for (let i = 0; i < 300; i++) {
const x = Math.random() * size;
const y = Math.random() * size;
const radius = 3 + Math.random() * 25;

const depthGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
depthGradient.addColorStop(0, '#303030');
depthGradient.addColorStop(0.7, '#606060');
depthGradient.addColorStop(1, '#808080');

ctx.fillStyle = depthGradient;
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
}

return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createVenusTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Swirling sulfuric acid clouds
const cloudPattern = TextureGeneratorUtils.fbm(nx * 6, ny * 8, 6);
const swirl = Math.sin(nx * Math.PI * 10 + cloudPattern * 3) * 0.5 + 0.5;

const brightness = 180 + cloudPattern * 60 + swirl * 20;

data[idx] = Math.min(255, brightness * 1.1); // R
data[idx + 1] = Math.min(255, brightness * 0.85); // G
data[idx + 2] = Math.min(255, brightness * 0.5); // B
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createJupiterTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Horizontal bands with turbulence
const bandY = ny * 12; // 12 major bands
const bandPattern = Math.sin(bandY * Math.PI) * 0.5 + 0.5;
const turbulence = TextureGeneratorUtils.fbm(nx * 8, ny * 4, 5) * 0.4;
const combined = bandPattern + turbulence;

let r, g, b;

// Great Red Spot (around 20% from top, 30% from left)
const spotDist = Math.sqrt(Math.pow(nx - 0.3, 2) + Math.pow(ny - 0.35, 2));
if (spotDist < 0.08) {
const spotIntensity = 1 - (spotDist / 0.08);
r = 200 + spotIntensity * 40;
g = 80 + spotIntensity * 30;
b = 60 + spotIntensity * 20;
} else if (combined > 0.6) {
// Light cream bands
r = 220 + turbulence * 30;
g = 200 + turbulence * 25;
b = 160 + turbulence * 20;
} else if (combined > 0.4) {
// Medium orange bands
r = 190 + turbulence * 40;
g = 140 + turbulence * 30;
b = 80 + turbulence * 25;
} else {
// Dark brown bands
r = 140 + turbulence * 30;
g = 90 + turbulence * 20;
b = 50 + turbulence * 15;
}

data[idx] = Math.min(255, r);
data[idx + 1] = Math.min(255, g);
data[idx + 2] = Math.min(255, b);
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createJupiterBumpMap(size) {
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const noise = (x, y) => {
const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
return n - Math.floor(n);
};

const imageData = ctx.createImageData(size, size);
const data = imageData.data;

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Atmospheric turbulence
const elevation = noise(nx * 20, ny * 8) * 0.7 + noise(nx * 40, ny * 16) * 0.3;
const gray = Math.floor(128 + elevation * 40);

data[idx] = gray;
data[idx + 1] = gray;
data[idx + 2] = gray;
data[idx + 3] = 255;
}
}

ctx.putImageData(imageData, 0, 0);
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

export function createSaturnTexture(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Subtle horizontal bands
const bandY = ny * 15;
const bandPattern = Math.sin(bandY * Math.PI) * 0.3 + 0.7;
const turbulence = TextureGeneratorUtils.fbm(nx * 6, ny * 3, 4) * 0.2;
const combined = bandPattern + turbulence;

// Pale gold/cream colors
const r = 210 + combined * 40;
const g = 190 + combined * 35;
const b = 140 + combined * 30;

data[idx] = Math.min(255, r);
data[idx + 1] = Math.min(255, g);
data[idx + 2] = Math.min(255, b);
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createSaturnBumpMap(size) {
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size, ny = y / size;

// Subtle atmospheric variation
const elevation = TextureGeneratorUtils.noise(nx * 15, ny * 6) * 0.8 + TextureGeneratorUtils.noise(nx * 30, ny * 12) * 0.2;
const gray = Math.floor(128 + elevation * 30);

data[idx] = gray;
data[idx + 1] = gray;
data[idx + 2] = gray;
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createUranusTexture(size) {
// Uranus: Featureless cyan-blue atmosphere with subtle banding
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size;
const ny = y / size;

// Latitude-based faint banding
const latitude = ny;
const band = Math.sin(latitude * Math.PI * 12) * 0.02;

// Very subtle atmospheric variations
const clouds = TextureGeneratorUtils.noise(nx * 8, ny * 8, 1) * 0.03;
const detail = TextureGeneratorUtils.noise(nx * 20, ny * 20, 2) * 0.015;

// Base cyan-blue color with methane tint
const brightness = 0.65 + band + clouds + detail;
data[idx] = Math.floor(79 * brightness); // R: Cyan-blue
data[idx + 1] = Math.floor(212 * brightness); // G
data[idx + 2] = Math.floor(232 * brightness); // B
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createNeptuneTexture(size) {
// Neptune: Deep blue atmosphere with Great Dark Spot and wind features
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size;
const ny = y / size;

// Dynamic cloud bands
const latitude = ny;
const band = Math.sin(latitude * Math.PI * 15) * 0.08;
const wave = Math.sin((nx * 5 + ny * 2) * Math.PI) * 0.04;

// Great Dark Spot (similar to Jupiter's Red Spot)
const spotX = 0.3, spotY = 0.35;
const distToSpot = Math.sqrt(Math.pow((nx - spotX) * 2, 2) + Math.pow(ny - spotY, 2));
const darkSpot = distToSpot < 0.15 ? -0.25 * (1 - distToSpot / 0.15) : 0;

// Swirling atmospheric features
const swirl = TextureGeneratorUtils.noise(nx * 12 + ny * 2, ny * 10, 1) * 0.06;
const detail = TextureGeneratorUtils.noise(nx * 25, ny * 25, 2) * 0.03;

// Deep blue with white clouds
const brightness = 0.55 + band + wave + swirl + detail + darkSpot;
data[idx] = Math.floor(46 * brightness); // R: Deep blue
data[idx + 1] = Math.floor(95 * brightness); // G
data[idx + 2] = Math.floor(181 * brightness); // B
data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export function createPlutoTexture(size) {
// Pluto: Heart-shaped Tombaugh Regio, nitrogen ice, reddish-brown terrain
// Use reusable utilities
const { canvas, ctx, imageData, data } = TextureGeneratorUtils.createCanvas(size);

for (let y = 0; y < size; y++) {
for (let x = 0; x < size; x++) {
const idx = (y * size + x) * 4;
const nx = x / size;
const ny = y / size;

// Create the famous "heart" (Tombaugh Regio)
const heartCenterX = 0.4, heartCenterY = 0.45;
const toCenter = {
x: (nx - heartCenterX) * 1.8,
y: (ny - heartCenterY) * 1.2
};

// Heart shape equation
const heartDist = Math.pow(toCenter.x * toCenter.x + toCenter.y * toCenter.y - 0.04, 3) - 
toCenter.x * toCenter.x * toCenter.y * toCenter.y * toCenter.y * 200;
const isHeart = heartDist < 0;

// Base terrain variations
const terrain = TextureGeneratorUtils.noise(nx * 15, ny * 15, 1) * 0.4;
const mountains = TextureGeneratorUtils.noise(nx * 30, ny * 30, 2) * 0.2;
const detail = TextureGeneratorUtils.noise(nx * 50, ny * 50, 3) * 0.1;

// Tholins (reddish-brown organic compounds)
const tholin = terrain + mountains + detail;

if (isHeart) {
// Sputnik Planitia - bright nitrogen ice
const iceBrightness = 0.9 + TextureGeneratorUtils.noise(nx * 40, ny * 40, 4) * 0.1;
data[idx] = Math.floor(240 * iceBrightness);
data[idx + 1] = Math.floor(235 * iceBrightness);
data[idx + 2] = Math.floor(220 * iceBrightness);
} else {
// Reddish-brown terrain with tholins
const baseBrightness = 0.5 + tholin;
data[idx] = Math.floor(212 * baseBrightness); // R: Reddish-brown
data[idx + 1] = Math.floor(163 * baseBrightness); // G
data[idx + 2] = Math.floor(115 * baseBrightness); // B
}

data[idx + 3] = 255;
}
}

TextureGeneratorUtils.applyImageData(ctx, imageData);
return TextureGeneratorUtils.finalizeTexture(canvas);
}

export async function loadTextureWithFallback(url, fallbackColor) {
// Try to load real imagery, fallback to color if it fails
return new Promise((resolve) => {
const loader = new THREE.TextureLoader();
loader.load(
url,
(texture) => {
if (DEBUG.TEXTURES) console.log(` Loaded texture: ${url}`);
resolve(texture);
},
undefined,
(error) => {
if (DEBUG.TEXTURES) console.warn(` Failed to load ${url}, using fallback color`);
// Create circular gradient texture as fallback (no visible edges)
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');

// Create radial gradient (bright center, fades to transparent)
const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
gradient.addColorStop(0, fallbackColor);
gradient.addColorStop(0.5, fallbackColor + '80'); // 50% opacity
gradient.addColorStop(1, fallbackColor + '00'); // Transparent

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 128, 128);

const texture = new THREE.CanvasTexture(canvas);
resolve(texture);
}
);
});
}