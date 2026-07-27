import * as THREE from 'three';
import { TEXTURE_CACHE } from '../TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE, TextureGeneratorUtils, MaterialFactory, CoordinateUtils, ConstellationFactory, GeometryFactory } from '../utils.js';

import { t } from '../i18n-t.js';

export function createComets(scene) {
// Create comets with REALISTIC sizes (typically 1-60 km)
// All comets rendered with hyperrealistic nucleus, coma, and dual tails
this.comets = [];

const cometsData = [
// perihelionJD: Julian Date of most recent perihelion passage (from JPL/IAU MPC).
// initPositionsToDate() uses this so mean anomaly is 0 at perihelion, giving
// a correct orbital phase for any queried date.
// inclination: orbital inclination to the ecliptic in degrees (source: JPL Small-Body DB).
//   Values > 90° indicate retrograde orbits.

// Halley: last perihelion Feb 9, 1986 (JD 2446470.5); next ~Jul 28, 2061 (JD 2473621.5)
// Inclination 162.3° = retrograde, ~18° to ecliptic
{ name: 'Halley\'s Comet', distance: 1795, eccentricity: 0.967, inclination: 162.3, speed: 0.02, size: 0.002, description: t('descHalley'), orbitalPeriod: 27511, perihelionJD: 2446470.5 },
// Hale-Bopp: perihelion Apr 1, 1997 (JD 2450538.0); period ~2520 yr
// Inclination 89.4° = near-polar orbit
{ name: 'Comet Hale-Bopp', distance: 12820, eccentricity: 0.995, inclination: 89.4, speed: 0.015, size: 0.005, description: t('descHaleBopp'), orbitalPeriod: 925188, perihelionJD: 2450538.0 },
// Hyakutake: perihelion May 1, 1996 (JD 2450204.5); period ~70,000 yr (hyperbolic escapee)
// Inclination 124.9° = retrograde
{ name: 'Comet Hyakutake', distance: 1540, eccentricity: 0.999, inclination: 124.9, speed: 0.022, size: 0.0015, description: t('descHyakutake'), orbitalPeriod: 25567500, perihelionJD: 2450204.5 },
// Lovejoy (C/2011 W3): perihelion Dec 16, 2011 (JD 2455912.0); period ~622 yr
// Inclination 134.1° = retrograde sungrazer
{ name: 'Comet Lovejoy', distance: 770, eccentricity: 0.998, inclination: 134.1, speed: 0.04, size: 0.0008, description: t('descLovejoy'), orbitalPeriod: 227185, perihelionJD: 2455912.0 },
// Encke: most recent perihelion Oct 22, 2023 (JD 2460240.5); period 3.30 yr = 1205 d
// Inclination 11.8° = low-inclination prograde
{ name: 'Comet Encke', distance: 385, eccentricity: 0.847, inclination: 11.8, speed: 0.035, size: 0.0018, description: t('descEncke'), orbitalPeriod: 1205, perihelionJD: 2460240.5 },
// Swift-Tuttle: perihelion Dec 12, 1992 (JD 2448967.5); period 133.3 yr = 48680 d
// Inclination 113.4° = retrograde (source of Perseid meteor shower)
{ name: 'Comet Swift-Tuttle', distance: 2570, eccentricity: 0.963, inclination: 113.4, speed: 0.018, size: 0.003, description: t('descSwiftTuttle'), orbitalPeriod: 48680, perihelionJD: 2448967.5 }
];

// Shared coma textures — created once, reused for all comets.
// Canvas radial gradients give a smooth circular halo with zero polygon edges.
const _makeComaTexture = (canvasSize, colorStops) => {
const canvas = document.createElement('canvas');
canvas.width = canvasSize; canvas.height = canvasSize;
const ctx = canvas.getContext('2d');
const c = canvasSize / 2;
const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
colorStops.forEach(([pos, r, g, b, a]) => grad.addColorStop(pos, `rgba(${r},${g},${b},${a})`));
ctx.fillStyle = grad;
ctx.fillRect(0, 0, canvasSize, canvasSize);
return new THREE.CanvasTexture(canvas);
};
// Inner bright coma: warm white-blue core fading outward
const _innerComaTex = _makeComaTexture(128, [
[0.00, 255, 252, 240, 1.00],
[0.12, 210, 240, 255, 0.90],
[0.30, 140, 210, 255, 0.55],
[0.55, 80, 170, 255, 0.20],
[0.80, 50, 140, 255, 0.06],
[1.00, 30, 120, 255, 0.00],
]);
// Outer diffuse halo: large, faint greenish-blue (coma scatters sunlight)
const _outerComaTex = _makeComaTexture(64, [
[0.00, 160, 220, 200, 0.22],
[0.30, 120, 200, 180, 0.12],
[0.65, 80, 170, 160, 0.04],
[1.00, 60, 150, 140, 0.00],
]);

cometsData.forEach((cometData, index) => {
const cometGroup = new THREE.Group();

// ===== HYPER-REALISTIC NUCLEUS =====
// Irregular, potato-shaped icy-rocky core with surface details
const nucleusGeometry = new THREE.IcosahedronGeometry(cometData.size, 2);

// Deform vertices for irregular shape (inline — avoids Vector3 allocations)
const positions = nucleusGeometry.attributes.position.array;
for (let i = 0; i < positions.length; i += 3) {
const scale = 1.0 + 0.15 + Math.random() * 0.2;
positions[i] *= scale;
positions[i + 1] *= scale;
positions[i + 2] *= scale;
}
nucleusGeometry.attributes.position.needsUpdate = true;
nucleusGeometry.computeVertexNormals();

const nucleusMaterial = new THREE.MeshStandardMaterial({
color: 0x3a3a3a, // Dark gray-black (dirty ice + rock)
roughness: 0.95,
metalness: 0.05,
emissive: 0x6688aa, // Faint blue outgassing glow, visible when zoomed in
emissiveIntensity: 0.45
});

const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
cometGroup.add(nucleus);

// Surface ice patches (bright spots) - MORE realistic distribution
for (let i = 0; i < 15; i++) {
const patchSize = cometData.size * (0.1 + Math.random() * 0.15);
const patchGeometry = new THREE.SphereGeometry(patchSize, 6, 6);
const patchMaterial = new THREE.MeshStandardMaterial({
color: 0xf0f8ff, // Bright icy white
roughness: 0.4,
metalness: 0.2,
emissive: 0x88ccff,
emissiveIntensity: 0.5 + Math.random() * 0.3
});
const patch = new THREE.Mesh(patchGeometry, patchMaterial);
// Random position on surface
const theta = Math.random() * Math.PI * 2;
const phi = Math.random() * Math.PI;
const r = cometData.size * (0.9 + Math.random() * 0.2);
patch.position.set(
r * Math.sin(phi) * Math.cos(theta),
r * Math.sin(phi) * Math.sin(theta),
r * Math.cos(phi)
);
cometGroup.add(patch);
}

// Active gas jets (bright spots showing outgassing)
for (let i = 0; i < 5; i++) {
const jetGeometry = new THREE.SphereGeometry(cometData.size * 0.08, 8, 8);
const jetMaterial = new THREE.MeshBasicMaterial({
color: 0xffffff,
transparent: true,
opacity: 0.8,
blending: THREE.AdditiveBlending
});
const jet = new THREE.Mesh(jetGeometry, jetMaterial);
const theta = Math.random() * Math.PI * 2;
const phi = Math.random() * Math.PI;
const r = cometData.size * 1.1;
jet.position.set(
r * Math.sin(phi) * Math.cos(theta),
r * Math.sin(phi) * Math.sin(theta),
r * Math.cos(phi)
);
cometGroup.add(jet);
}

// Visual radius: visible in solar-system overview but not planet-sized (real coma ~100,000 km)
const visualRadius = Math.max(cometData.size * 400, 1.0);

// ===== REALISTIC COMA: layered smooth sprite halos =====
// Sprites always face the camera (no polygon edges) and use pre-built
// canvas radial gradients so the coma looks like a soft circular glow.
const innerComa = new THREE.Sprite(new THREE.SpriteMaterial({
map: _innerComaTex,
transparent: true,
blending: THREE.AdditiveBlending,
depthWrite: false,
opacity: 0.92
}));
innerComa.scale.set(visualRadius * 1.4, visualRadius * 1.4, 1);
cometGroup.add(innerComa);

const outerComa = new THREE.Sprite(new THREE.SpriteMaterial({
map: _outerComaTex,
transparent: true,
blending: THREE.AdditiveBlending,
depthWrite: false,
opacity: 0.70
}));
outerComa.scale.set(visualRadius * 3.5, visualRadius * 3.5, 1);
cometGroup.add(outerComa);

// ===== SPECTACULAR DUST TAIL =====
// Curved, broad, golden-yellow with turbulent structure
const dustParticles = 280; // Further reduced particle count for subtler tails
const dustTailGeometry = new THREE.BufferGeometry();
const dustTailPositions = new Float32Array(dustParticles * 3);
const dustTailColors = new Float32Array(dustParticles * 3);
const dustTailSizes = new Float32Array(dustParticles);

for (let i = 0; i < dustParticles; i++) {
const t = i / dustParticles;
const spread = t * 0.7; // Proportional spread
const curve = t * t * 1.0; // Curved tail
const turbulence = Math.sin(i * 0.5) * spread * 0.15; // Add turbulence

dustTailPositions[i * 3] = curve + turbulence + (Math.random() - 0.5) * spread * 0.3;
dustTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
dustTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8;

// Size decreases with distance, with variation
dustTailSizes[i] = (0.05 + Math.random() * 0.025) * (1 - t * 0.8);

// Gradient: bright white-yellow → orange-red → dark
const brightness = 0.45 - t * 0.3;
dustTailColors[i * 3] = Math.min(1, 0.9 + t * 0.3) * brightness; // R
dustTailColors[i * 3 + 1] = Math.max(0.3, 0.85 - t * 0.4) * brightness; // G 
dustTailColors[i * 3 + 2] = Math.max(0, 1.0 - t * 0.9) * brightness; // B
}

dustTailGeometry.setAttribute('position', new THREE.BufferAttribute(dustTailPositions, 3));
dustTailGeometry.setAttribute('color', new THREE.BufferAttribute(dustTailColors, 3));
dustTailGeometry.setAttribute('size', new THREE.BufferAttribute(dustTailSizes, 1));

const dustTailMaterial = new THREE.PointsMaterial({
vertexColors: true,
sizeAttenuation: true,
transparent: true,
opacity: 0.14, // More subtle dust tail
blending: THREE.AdditiveBlending,
depthWrite: false
});

const dustTail = new THREE.Points(dustTailGeometry, dustTailMaterial);
cometGroup.add(dustTail);

// Precomputed jitter seeds (hot-path optimization: avoid per-frame Math.random in animate loop)
const dustJitterA = new Float32Array(dustParticles);
const dustJitterB = new Float32Array(dustParticles);
for (let i = 0; i < dustParticles; i++) {
dustJitterA[i] = Math.random() - 0.5;
dustJitterB[i] = Math.random() - 0.5;
}

// ===== BRILLIANT ION TAIL =====
// Straight, narrow, electric blue plasma stream with wisps
const ionParticles = 180; // Further reduced particle count for subtle plasma tail
const ionTailGeometry = new THREE.BufferGeometry();
const ionTailPositions = new Float32Array(ionParticles * 3);
const ionTailColors = new Float32Array(ionParticles * 3);
const ionTailSizes = new Float32Array(ionParticles);

for (let i = 0; i < ionParticles; i++) {
const t = i / ionParticles;
const spread = t * 0.2; // Narrower than dust tail but with wisps
const length = t * 1.5; // Longer, straight ion tail
const wisp = Math.sin(i * 0.3) * spread * 0.2; // Wispy structure

ionTailPositions[i * 3] = length + wisp + (Math.random() - 0.5) * 0.015;
ionTailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
ionTailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.8;

// Size variation with brilliant streaks
const ionBrightness = Math.pow(1 - t, 0.4) * (0.6 + Math.random() * 0.3);
ionTailSizes[i] = (0.04 + Math.random() * 0.05) * ionBrightness;

// Electric blue plasma gradient - brilliant cyan-blue
const intensity = (1 - t * 0.5) * ionBrightness * 0.35; // Further dimmed ion emission
ionTailColors[i * 3] = 0.4 * intensity; // R - less red for purer blue
ionTailColors[i * 3 + 1] = 0.85 * intensity; // G - strong cyan
ionTailColors[i * 3 + 2] = 1.0 * intensity; // B - full blue
}

ionTailGeometry.setAttribute('position', new THREE.BufferAttribute(ionTailPositions, 3));
ionTailGeometry.setAttribute('color', new THREE.BufferAttribute(ionTailColors, 3));
ionTailGeometry.setAttribute('size', new THREE.BufferAttribute(ionTailSizes, 1));

const ionTailMaterial = new THREE.PointsMaterial({
vertexColors: true,
sizeAttenuation: true,
transparent: true,
opacity: 0.18, // More subtle ion tail
blending: THREE.AdditiveBlending,
depthWrite: false
});

const ionTail = new THREE.Points(ionTailGeometry, ionTailMaterial);
cometGroup.add(ionTail);

// Precomputed ion jitter seeds (hot-path optimization)
const ionJitter = new Float32Array(ionParticles);
for (let i = 0; i < ionParticles; i++) {
ionJitter[i] = Math.random() - 0.5;
}

// Clamp eccentricity so perihelion stays outside the sun (radius 15 + 30 safety margin = 45 units).
// Sungrazers like Hyakutake (e=0.999) and Lovejoy (e=0.998) would otherwise dive deep inside the sun mesh.
const MIN_PERIHELION = 45;
const safeEccentricity = Math.min(cometData.eccentricity, 1 - MIN_PERIHELION / cometData.distance);

cometGroup.userData = {
name: cometData.name,
type: 'comet',
radius: visualRadius, // Use visual coma radius for zoom/label sizing
actualSize: cometData.size, // True nucleus size
visualRadius: visualRadius,
distance: cometData.distance,
angle: 0, // true anomaly (derived from meanAnomaly via Kepler solver)
meanAnomaly: 0, // mean anomaly (advanced linearly with time)
speed: cometData.speed,
eccentricity: safeEccentricity, // Clamped to keep perihelion outside sun
originalEccentricity: cometData.eccentricity, // Stored for reclamping after scale changes
inclination: cometData.inclination || 0, // Orbital inclination to ecliptic in degrees (JPL Small-Body DB)
orbitalPeriod: cometData.orbitalPeriod,
perihelionJD: cometData.perihelionJD || null, // Real perihelion epoch (JD) for date-accurate phase
description: cometData.description,
realSize: '1-60 km nucleus',
funFact: t('funFactComets'),
dustTail: dustTail,
ionTail: ionTail,
dustParticles,
ionParticles,
dustJitterA,
dustJitterB,
ionJitter,
isComet: true, // Flag for special zoom handling
_sunDir: new THREE.Vector3(), // Pre-allocated for tail updates
_velDir: new THREE.Vector3(), // Pre-allocated for tail updates
// Pre-cached trig for inclination and Kepler sqrt — constant per comet
inclRad: (cometData.inclination || 0) * Math.PI / 180,
_cosIncl: Math.cos((cometData.inclination || 0) * Math.PI / 180),
_sinIncl: Math.sin((cometData.inclination || 0) * Math.PI / 180),
_keplerSqrtPlus: Math.sqrt(1 + safeEccentricity),
_keplerSqrtMinus: safeEccentricity < 1 ? Math.sqrt(1 - safeEccentricity) : 0
};

// ===== ELLIPTICAL ORBIT PATH =====
const orbitSegments = 256;
const orbitPoints = [];
const orbitA = cometData.distance;
const orbitE = safeEccentricity; // use same clamped value stored in userData
const orbitInclRad = (cometData.inclination || 0) * Math.PI / 180;
for (let j = 0; j <= orbitSegments; j++) {
const f = (j / orbitSegments) * Math.PI * 2;
const orbitR = orbitA * (1 - orbitE * orbitE) / (1 + orbitE * Math.cos(f));
orbitPoints.push(new THREE.Vector3(orbitR * Math.cos(f), orbitR * Math.sin(f) * Math.sin(orbitInclRad), orbitR * Math.sin(f) * Math.cos(orbitInclRad)));
}
const cometOrbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
const cometOrbitMat = new THREE.LineBasicMaterial({
color: 0xCC9955,
transparent: true,
opacity: 0.6,
depthWrite: false
});
const cometOrbitLine = new THREE.Line(cometOrbitGeo, cometOrbitMat);
cometOrbitLine.visible = this.cometOrbitsVisible;
cometOrbitLine.renderOrder = 1;
// Disable frustum culling: highly eccentric orbits have a bounding sphere
// centered far from the origin (focus), so Three.js incorrectly culls the
// near-perihelion arc even when it is inside the camera frustum.
cometOrbitLine.frustumCulled = false;
cometOrbitLine.userData = { type: 'orbit', comet: cometData.name };
scene.add(cometOrbitLine);
this.cometOrbits.push(cometOrbitLine);
cometGroup.userData.orbitLine = cometOrbitLine;

cometGroup.visible = true; // Ensure comet is visible
scene.add(cometGroup);
this.objects.push(cometGroup);
this.comets.push(cometGroup);
this.pickableObjects.push(cometGroup);

if (DEBUG.enabled) console.log(` ${cometData.name} created at distance ${cometData.distance}, visualRadius=${visualRadius.toFixed(2)}`);
});
}

export function createHyperrealisticJWST(satData) {
    if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic James Webb Space Telescope');
    const jwst = new THREE.Group();
    // JWST geometry below uses many real-meter constants (e.g. 21.2m sunshield width).
    // Normalize those dimensions to the scene scale so JWST is not oversized
    // compared to other spacecraft models.
    const displaySize = satData.size || 0.03;
    const scale = displaySize / 21.2;

    const goldMat = MaterialFactory.createSpacecraftMaterial('goldBright');
    const shieldMat = MaterialFactory.createSpacecraftMaterial('shield');
    const structMat = MaterialFactory.createSpacecraftMaterial('structure');

    // --- Primary mirror: 18 hexagonal beryllium segments ---
    // Accurate 3-4-6-4-3 column layout matching real JWST deployment diagram (NASA)
    // Spacing s=1.5 hex-widths; columns centred on Y-axis, wings fold along Y
    const hexRadius = scale * 0.66;
    const createHex = () => {
        const shape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + Math.PI / 6; // flat-top orientation
            const x = hexRadius * Math.cos(angle);
            const y = hexRadius * Math.sin(angle);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: scale * 0.08, bevelEnabled: false });
    };
    const hexGeom = createHex();
    const s = 1.5; // grid spacing multiplier
    const h = s * Math.sqrt(3) / 2; // hex row offset
    // 18 positions in accurate JWST 3-4-6-4-3 column arrangement:
    const mirrorPos = [
        // Left folding wing (3 segments)
        [-3*s,  h], [-3*s, -h], [-2.5*s, 0],
        // Left inner column (4 segments)
        [-1.5*s,  h*2], [-1.5*s,  0], [-1.5*s, -h*2], [-2*s, -h],
        // Centre column (4 segments — top 2 and bottom 2, actual centre is 6 but scaled)
        [0, h*3], [0, h], [0, -h], [0, -h*3],
        // Right inner column (4 segments)
        [1.5*s, h*2], [1.5*s, 0], [1.5*s, -h*2], [2*s, h],
        // Right folding wing (3 segments)
        [3*s, h], [3*s, -h], [2.5*s, 0]
    ];
    mirrorPos.forEach(pos => {
        const hex = new THREE.Mesh(hexGeom, goldMat);
        hex.position.set(scale * pos[0], scale * pos[1], scale * 3);
        hex.rotation.x = Math.PI / 2;
        jwst.add(hex);
    });

    // --- Secondary mirror (0.74m diameter, hexagonal) ---
    const secMirror = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.37, scale * 0.37, scale * 0.08, 6, this.geometryCache),
        goldMat
    );
    secMirror.position.z = scale * 7.5;
    jwst.add(secMirror);

    // --- 3 secondary mirror support struts (tripod boom from primary edge) ---
    const strutGeom = GeometryFactory.createCylinder(scale * 0.04, scale * 0.04, scale * 5, 6, this.geometryCache);
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i + Math.PI / 6;
        const strut = new THREE.Mesh(strutGeom, structMat);
        strut.position.x = Math.cos(angle) * scale * 2.5;
        strut.position.y = Math.sin(angle) * scale * 2.5;
        strut.position.z = scale * 5;
        // Tilt struts inward toward secondary at z=7.5
        strut.rotation.x = Math.atan2(scale * 2.5, scale * 5) * 0.6;
        strut.rotation.z = -angle;
        jwst.add(strut);
    }

    // --- Spacecraft bus (~2.4m cube) ---
    const bus = new THREE.Mesh(
        GeometryFactory.createBox(scale * 2, scale * 2, scale * 1.5, this.geometryCache),
        MaterialFactory.createSpacecraftMaterial('body')
    );
    bus.position.z = scale * 1.2;
    jwst.add(bus);

    // --- Sunshield: 5 layers, KITE/DIAMOND shape (not rectangular!) ---
    // Real JWST sunshield is a 5-sided kite: wide centre (~14m), tapered to both ends
    // Aproximated as a hexagonal shape truncated top/bottom: width 21.2m, height 14.2m
    const createSunshieldShape = (wScale, hScale) => {
        const w = scale * 21.2 * wScale;
        const h2 = scale * 14.2 * hScale;
        const shape = new THREE.Shape();
        // Kite/pentagon: pointed left & right, flat top & bottom edges with chamfered corners
        shape.moveTo(0,  h2 * 0.2);           // top-centre
        shape.lineTo( w * 0.5, 0);            // right point
        shape.lineTo( w * 0.35, -h2 * 0.5);  // bottom-right
        shape.lineTo(-w * 0.35, -h2 * 0.5);  // bottom-left
        shape.lineTo(-w * 0.5, 0);            // left point
        shape.lineTo(-w * 0.35,  h2 * 0.5);  // top-left
        shape.lineTo( w * 0.35,  h2 * 0.5);  // top-right
        shape.closePath();
        return new THREE.ShapeGeometry(shape);
    };
    for (let layer = 0; layer < 5; layer++) {
        const reduction = 1 - layer * 0.015; // each layer slightly smaller
        const shieldGeom = createSunshieldShape(reduction, reduction);
        const shieldLayer = new THREE.Mesh(shieldGeom, shieldMat.clone());
        shieldLayer.material.color.setHex(0xE0E0D8 - layer * 0x080806);
        shieldLayer.material.side = THREE.DoubleSide;
        shieldLayer.position.z = -scale * (0.3 + layer * 0.25);
        jwst.add(shieldLayer);
    }

    // --- Sunshield support booms (2 deployable arms along X-axis) ---
    const boomGeom = GeometryFactory.createCylinder(scale * 0.07, scale * 0.07, scale * 21.2, 6, this.geometryCache);
    const boom = new THREE.Mesh(boomGeom, structMat);
    boom.position.set(0, 0, -scale * 0.8);
    boom.rotation.z = Math.PI / 2; // along X axis
    jwst.add(boom);

    // --- Solar array: single roughly-square panel on +Y side of bus ---
    // Real JWST: ~2.0m × 2.5m single body-mounted solar array
    const panel = new THREE.Mesh(
        GeometryFactory.createBox(scale * 2.5, scale * 2.0, scale * 0.05, this.geometryCache),
        MaterialFactory.createSpacecraftMaterial('solarPanel')
    );
    panel.position.set(0, scale * 2.2, scale * 1.2);
    jwst.add(panel);

    // --- High-gain antenna (gimballed dish, pointing sunward away from mirror) ---
    const antenna = new THREE.Mesh(
        GeometryFactory.createCone(scale * 0.8, scale * 0.4, 16, this.geometryCache),
        MaterialFactory.createSpacecraftMaterial('white')
    );
    antenna.position.set(scale * 1.2, -scale * 0.8, -scale * 1.8);
    antenna.rotation.x = Math.PI * 0.85;
    jwst.add(antenna);

    return jwst;
}

export function createHyperrealisticHubble(satData) {
    if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Hubble Space Telescope');
    const hubble = new THREE.Group();

    // Real HST: 13.2 m long, 4.2 m diameter, 2 solar arrays of 2.6 m x 7.1 m.
    // Normalise those metre constants to the scene display size, the same way
    // createHyperrealisticJWST() does, so Hubble is not oversized next to the ISS.
    const displaySize = satData.size || 0.02;
    const scale = displaySize / 13.2;

    const whiteMat = MaterialFactory.createSpacecraftMaterial('white');
    const silverMat = MaterialFactory.createSpacecraftMaterial('silver');
    const darkMat = MaterialFactory.createSpacecraftMaterial('dark');
    const structMat = MaterialFactory.createSpacecraftMaterial('structure');
    const panelMat = MaterialFactory.createSpacecraftMaterial('solarPanel');

    const bodyRadius = scale * 2.1;

    // --- Main optical tube assembly (forward, aluminium/white thermal blanket) ---
    const forwardShell = new THREE.Mesh(
        GeometryFactory.createCylinder(bodyRadius, bodyRadius, scale * 8.4, 32, this.geometryCache),
        silverMat
    );
    forwardShell.rotation.x = Math.PI / 2; // cylinder axis Y -> telescope axis Z
    forwardShell.position.z = scale * 2.4;
    hubble.add(forwardShell);

    // --- Aft shroud (slightly wider, houses the science instruments) ---
    const aftShroud = new THREE.Mesh(
        GeometryFactory.createCylinder(bodyRadius * 1.02, bodyRadius * 1.02, scale * 4.8, 32, this.geometryCache),
        whiteMat
    );
    aftShroud.rotation.x = Math.PI / 2;
    aftShroud.position.z = -scale * 3.6;
    hubble.add(aftShroud);

    // --- Aft bulkhead cap ---
    const aftCap = new THREE.Mesh(
        GeometryFactory.createCylinder(bodyRadius * 1.02, bodyRadius * 0.9, scale * 0.4, 32, this.geometryCache),
        darkMat
    );
    aftCap.rotation.x = Math.PI / 2;
    aftCap.position.z = -scale * 6.2;
    hubble.add(aftCap);

    // --- Open aperture: dark interior disc so the tube reads as hollow ---
    const aperture = new THREE.Mesh(
        GeometryFactory.createCylinder(bodyRadius * 0.94, bodyRadius * 0.94, scale * 0.1, 32, this.geometryCache),
        darkMat
    );
    aperture.rotation.x = Math.PI / 2;
    aperture.position.z = scale * 6.5;
    hubble.add(aperture);

    // --- Aperture door, hinged open at ~105 degrees (its signature silhouette) ---
    const door = new THREE.Mesh(
        GeometryFactory.createCylinder(bodyRadius, bodyRadius, scale * 0.12, 32, this.geometryCache),
        whiteMat
    );
    door.rotation.x = Math.PI / 2 - 1.83; // ~105 deg open
    door.position.set(0, bodyRadius * 1.05, scale * 7.3);
    hubble.add(door);

    // --- Solar arrays: two rigid wings on +/-X ---
    const arrayGeom = GeometryFactory.createBox(scale * 2.6, scale * 0.08, scale * 7.1, this.geometryCache);
    const boomGeom = GeometryFactory.createCylinder(scale * 0.12, scale * 0.12, scale * 1.6, 8, this.geometryCache);
    for (const side of [1, -1]) {
        const boom = new THREE.Mesh(boomGeom, structMat);
        boom.rotation.z = Math.PI / 2;
        boom.position.set(side * (bodyRadius + scale * 0.8), 0, -scale * 1.2);
        hubble.add(boom);

        const array = new THREE.Mesh(arrayGeom, panelMat);
        array.position.set(side * (bodyRadius + scale * 3.0), 0, -scale * 1.2);
        hubble.add(array);
    }

    // --- Two high-gain antenna dishes on booms, +/-Y ---
    const dishGeom = GeometryFactory.createCone(scale * 0.9, scale * 0.35, 16, this.geometryCache);
    const dishBoomGeom = GeometryFactory.createCylinder(scale * 0.1, scale * 0.1, scale * 2.2, 8, this.geometryCache);
    for (const [side, z] of [[1, scale * 1.8], [-1, -scale * 2.6]]) {
        const dishBoom = new THREE.Mesh(dishBoomGeom, structMat);
        dishBoom.position.set(0, side * (bodyRadius + scale * 1.1), z);
        hubble.add(dishBoom);

        const dish = new THREE.Mesh(dishGeom, whiteMat);
        dish.position.set(0, side * (bodyRadius + scale * 2.4), z);
        dish.rotation.x = side > 0 ? Math.PI : 0;
        hubble.add(dish);
    }

    // --- Forward light-shield banding (thermal blanket seams) ---
    const bandGeom = GeometryFactory.createCylinder(bodyRadius * 1.01, bodyRadius * 1.01, scale * 0.15, 32, this.geometryCache);
    for (const z of [scale * 5.4, scale * 3.2, scale * 1.0]) {
        const band = new THREE.Mesh(bandGeom, structMat);
        band.rotation.x = Math.PI / 2;
        band.position.z = z;
        hubble.add(band);
    }

    return hubble;
}

export function createHyperrealisticSputnik(satData) {
    if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Sputnik 1');
    const sputnik = new THREE.Group();
    const scale = satData.size || 0.02;
    const R = scale * 2.9; // sphere radius (58 cm real diameter → R = 29 cm)

    // ── Main spherical body ─────────────────────────────────────────────
    // Highly polished N1-Al aluminium alloy — near-mirror finish
    sputnik.add(new THREE.Mesh(
        GeometryFactory.createSphere(R, 64, 48, this.geometryCache),
        new THREE.MeshStandardMaterial({
            color: 0xD4D4D4,
            roughness: 0.03,
            metalness: 1.0,
            emissive: 0x282828,
            emissiveIntensity: 0.14
        })
    ));

    // ── Equatorial mating seam (two hemispheres bolted together) ────────
    const seamMat = new THREE.MeshStandardMaterial({
        color: 0x909090, metalness: 0.85, roughness: 0.25
    });
    const seam = new THREE.Mesh(
        new THREE.TorusGeometry(R, scale * 0.07, 12, 72),
        seamMat
    );
    seam.rotation.x = Math.PI / 2; // ring lies in XZ plane (equator)
    sputnik.add(seam);

    // 12 bolt heads evenly spaced around the equatorial seam
    const boltMat = new THREE.MeshStandardMaterial({
        color: 0x787878, metalness: 0.9, roughness: 0.2
    });
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const bolt = new THREE.Mesh(
            GeometryFactory.createSphere(scale * 0.09, 6, 6, this.geometryCache),
            boltMat
        );
        bolt.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); // in XZ plane
        sputnik.add(bolt);
    }

    // ── Four whip antennas — all trailing rearward (−Z direction) ───────
    // All antennas emerge from the rear hemisphere and trail behind the satellite.
    // Short pair (2.4 m real, ≈12 × scale): splayed ±35° in the X–Z plane.
    // Long  pair (2.9 m real, ≈14.5 × scale): splayed ±65° in the Y–Z plane.
    const antennaMat = new THREE.MeshStandardMaterial({
        color: 0xBCBCBC, roughness: 0.12, metalness: 0.95
    });
    const stubMat = new THREE.MeshStandardMaterial({
        color: 0x999999, metalness: 0.9, roughness: 0.2
    });
    // Y axis — used as the "up" axis of every CylinderGeometry for quaternion alignment
    const yAxis = new THREE.Vector3(0, 1, 0);

    const antennaConfig = [
        { sx:  1, sy:  0, tilt: 35, len: scale * 12   }, // short, +X spread
        { sx: -1, sy:  0, tilt: 35, len: scale * 12   }, // short, -X spread
        { sx:  0, sy:  1, tilt: 65, len: scale * 14.5 }, // long,  +Y spread
        { sx:  0, sy: -1, tilt: 65, len: scale * 14.5 }, // long,  -Y spread
    ];

    for (const cfg of antennaConfig) {
        const tiltRad = (cfg.tilt * Math.PI) / 180;
        // Unit direction vector pointing from sphere centre along this antenna.
        // sin/cos identity guarantees |dir| = 1 because sx and sy are ±1 or 0.
        const dir = new THREE.Vector3(
            cfg.sx * Math.sin(tiltRad),
            cfg.sy * Math.sin(tiltRad),
            -Math.cos(tiltRad)   // always trailing toward −Z
        );
        const len = cfg.len;

        // Tapered tube: wider at the root, thin at the tip
        const antenna = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.05, scale * 0.015, len, 8, this.geometryCache),
            antennaMat
        );
        // Place cylinder centre halfway along the antenna, starting from sphere surface
        antenna.position.copy(dir).multiplyScalar(R + len * 0.5);
        // Align the cylinder's Y axis with the antenna direction
        antenna.quaternion.setFromUnitVectors(yAxis, dir);
        sputnik.add(antenna);

        // Conical mounting stub where antenna exits the sphere skin
        const stub = new THREE.Mesh(
            GeometryFactory.createCylinder(scale * 0.14, scale * 0.05, scale * 0.3, 8, this.geometryCache),
            stubMat
        );
        stub.position.copy(dir).multiplyScalar(R + scale * 0.15);
        stub.quaternion.setFromUnitVectors(yAxis, dir);
        sputnik.add(stub);
    }

    return sputnik;
}

export function createHyperrealisticPioneer(satData) {
    if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Pioneer probe');
    const pioneer = new THREE.Group();
    // Scale based on the spacecraft's display size
    const scale = satData.size || 0.07;
    
    // Materials
    const goldMat = MaterialFactory.createSpacecraftMaterial('gold');
    const silverMat = MaterialFactory.createSpacecraftMaterial('silver');
    const darkMat = MaterialFactory.createSpacecraftMaterial('body');
    
    // Main hexagonal bus (2.9m diameter)
    const bus = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 1.45, scale * 1.45, scale * 0.3, 6, this.geometryCache),
        goldMat
    );
    bus.rotation.x = Math.PI / 2;
    pioneer.add(bus);
    
    // RTG power source (elongated)
    const rtg = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.2, scale * 0.2, scale * 1.5, 16, this.geometryCache),
        darkMat
    );
    rtg.position.set(0, -scale * 1, 0);
    pioneer.add(rtg);
    
    // 2.74m high-gain antenna dish
    const dish = new THREE.Mesh(
        GeometryFactory.createCone(scale * 1.37, scale * 0.4, 32, this.geometryCache),
        silverMat
    );
    dish.position.z = scale * 0.5;
    pioneer.add(dish);
    
    // Medium-gain antenna
    const medAntenna = new THREE.Mesh(
        GeometryFactory.createCone(scale * 0.3, scale * 0.3, 16, this.geometryCache),
        silverMat
    );
    medAntenna.position.set(scale * 0.8, 0, scale * 0.3);
    pioneer.add(medAntenna);
    
    // Magnetometer boom (extended 6.6m)
    const magBoom = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.02, scale * 0.02, scale * 6.6, 8, this.geometryCache),
        silverMat
    );
    magBoom.position.x = -scale * 3.3;
    magBoom.rotation.z = Math.PI / 2;
    pioneer.add(magBoom);
    
    // Magnetometer sensor at end
    const magSensor = new THREE.Mesh(
        GeometryFactory.createSphere(scale * 0.1, 16, 16, this.geometryCache),
        darkMat
    );
    magSensor.position.x = -scale * 6.6;
    pioneer.add(magSensor);
    
    // Instruments (imaging photopolarimeter, etc)
    const instruments = new THREE.Mesh(
        GeometryFactory.createBox(scale * 0.4, scale * 0.4, scale * 0.3, this.geometryCache),
        darkMat
    );
    instruments.position.set(scale * 0.5, scale * 0.5, 0);
    pioneer.add(instruments);
    
    // Thruster module
    const thrusters = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.1, scale * 0.1, scale * 0.2, 8, this.geometryCache),
        silverMat
    );
    thrusters.position.set(0, scale * 1.2, -scale * 0.1);
    pioneer.add(thrusters);
    
    return pioneer;
}

export function createHyperrealisticVoyager(satData) {
    if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Voyager probe');
    const voyager = new THREE.Group();
    // Scale based on the spacecraft's display size
    const scale = satData.size || 0.08;
    
    // Materials
    const goldMat = MaterialFactory.createSpacecraftMaterial('gold');
    const silverMat = MaterialFactory.createSpacecraftMaterial('silver');
    const darkMat = MaterialFactory.createSpacecraftMaterial('body');
    const whiteMat = MaterialFactory.createSpacecraftMaterial('white');
    
    // 10-sided main bus (1.8m diameter)
    const bus = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.9, scale * 0.9, scale * 0.5, 10, this.geometryCache),
        goldMat
    );
    bus.rotation.x = Math.PI / 2;
    voyager.add(bus);
    
    // 3.7m high-gain antenna (famous white dish)
    const dish = new THREE.Mesh(
        GeometryFactory.createCone(scale * 1.85, scale * 0.5, 32, this.geometryCache),
        whiteMat
    );
    dish.position.z = scale * 0.6;
    voyager.add(dish);
    
    // Feed horn in center of dish
    const feedHorn = new THREE.Mesh(
        GeometryFactory.createCone(scale * 0.1, scale * 0.3, 16, this.geometryCache),
        darkMat
    );
    feedHorn.position.z = scale * 0.9;
    voyager.add(feedHorn);
    
    // Science boom (13m extended to the side) - reusable geometry
    const boomGeom = GeometryFactory.createCylinder(scale * 0.03, scale * 0.03, scale * 13, 8, this.geometryCache);
    const scienceBoom = new THREE.Mesh(boomGeom, silverMat);
    scienceBoom.position.x = scale * 6.5;
    scienceBoom.rotation.z = Math.PI / 2;
    voyager.add(scienceBoom);
    
    // Cameras and instruments at end of science boom
    const cameras = new THREE.Mesh(
        GeometryFactory.createBox(scale * 0.4, scale * 0.4, scale * 0.5, this.geometryCache),
        darkMat
    );
    cameras.position.x = scale * 13;
    voyager.add(cameras);
    
    // Magnetometer boom (opposite direction, 13m) - reuse boom geometry
    const magBoomThin = GeometryFactory.createCylinder(scale * 0.02, scale * 0.02, scale * 13, 8, this.geometryCache);
    const magBoom = new THREE.Mesh(magBoomThin, silverMat);
    magBoom.position.x = -scale * 6.5;
    magBoom.rotation.z = Math.PI / 2;
    voyager.add(magBoom);
    
    // Magnetometer sensors - reuse geometry
    const magSensorGeom = GeometryFactory.createSphere(scale * 0.08, 16, 16, this.geometryCache);
    for (let i = 0; i < 2; i++) {
        const magSensor = new THREE.Mesh(magSensorGeom, darkMat);
        magSensor.position.x = -scale * (10 + i * 3);
        voyager.add(magSensor);
    }
    
    // RTG power source (3 RTGs on boom below)
    const rtgBoom = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.04, scale * 0.04, scale * 4, 8, this.geometryCache),
        silverMat
    );
    rtgBoom.position.set(0, -scale * 2, 0);
    voyager.add(rtgBoom);
    
    // 3 RTG units - reuse geometry
    const rtgGeom = GeometryFactory.createCylinder(scale * 0.2, scale * 0.2, scale * 0.5, 16, this.geometryCache);
    for (let i = 0; i < 3; i++) {
        const rtg = new THREE.Mesh(rtgGeom, darkMat);
        rtg.position.set(scale * (i - 1) * 0.8, -scale * 4, 0);
        rtg.rotation.z = Math.PI / 2;
        voyager.add(rtg);
    }
    
    // Golden Record (iconic!)
    const record = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.15, scale * 0.15, scale * 0.02, 32, this.geometryCache),
        goldMat
    );
    record.position.set(-scale * 0.5, 0, scale * 0.3);
    record.rotation.x = Math.PI / 2;
    voyager.add(record);
    
    return voyager;
}

export function createHyperrealisticCassini(satData) {
    if (DEBUG.enabled) console.log(' Creating hyperrealistic Cassini spacecraft');
    const cassini = new THREE.Group();
    // Scale based on the spacecraft's display size
    const scale = satData.size || 0.06;
    
    // Materials
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
    
    // Main bus (massive - 6.8m tall)
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(scale * 2, scale * 2, scale * 6.8, 12), goldMat);
    bus.rotation.x = Math.PI / 2;
    cassini.add(bus);
    
    // 4m high-gain antenna (large white dish)
    const dish = new THREE.Mesh(new THREE.ConeGeometry(scale * 2, scale * 0.6, 32), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.9 }));
    dish.position.x = scale * 4;
    dish.rotation.z = -Math.PI / 2;
    cassini.add(dish);
    
    // Feed assembly
    const feedAssembly = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.15, scale * 0.15, scale * 0.5, 16), darkMat);
    feedAssembly.position.x = scale * 4.5;
    feedAssembly.rotation.z = Math.PI / 2;
    cassini.add(feedAssembly);
    
    // 11m magnetometer boom
    const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.04, scale * 0.04, scale * 11, 8), silverMat);
    magBoom.position.x = -scale * 5.5;
    magBoom.rotation.z = Math.PI / 2;
    cassini.add(magBoom);
    
    // Magnetometer at end
    const magSensor = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.12, 16, 16), darkMat);
    magSensor.position.x = -scale * 11;
    cassini.add(magSensor);
    
    // 3 RTG units (each 16m long!)
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i;
        const rtg = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.15, scale * 0.15, scale * 16, 16), darkMat);
        rtg.position.set(
            -scale * 2 + Math.cos(angle) * scale * 1.2,
            Math.sin(angle) * scale * 1.2,
            0
        );
        rtg.rotation.z = Math.PI / 2;
        cassini.add(rtg);
    }
    
    // Science instruments platform
    const instruments = new THREE.Mesh(new THREE.BoxGeometry(scale * 1.5, scale * 1.5, scale * 1), darkMat);
    instruments.position.x = scale * 2;
    cassini.add(instruments);
    
    // Huygens probe (detached but iconic part)
    const huygens = new THREE.Mesh(new THREE.CylinderGeometry(scale * 1.35, scale * 1.35, scale * 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.4, metalness: 0.6 }));
    huygens.position.set(scale * 1, scale * 2.5, 0);
    cassini.add(huygens);
    
    // Reaction wheels and propulsion
    const propulsion = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.8, scale * 0.8, scale * 1.5, 8), silverMat);
    propulsion.position.x = -scale * 4;
    propulsion.rotation.z = Math.PI / 2;
    cassini.add(propulsion);
    
    return cassini;
}

export function createHyperrealisticJuno(satData) {
    if (DEBUG.enabled) console.log('[MODEL] Creating hyperrealistic Juno spacecraft');
    const juno = new THREE.Group();
    // Scale based on the spacecraft's display size (for orbiters, size from data)
    const scale = satData.size || 0.04;
    
    // Materials
    const goldMat = MaterialFactory.createSpacecraftMaterial('gold');
    const panelMat = MaterialFactory.createSpacecraftMaterial('solarPanel');
    const darkMat = MaterialFactory.createSpacecraftMaterial('body');
    const whiteMat = MaterialFactory.createSpacecraftMaterial('white');
    
    // Hexagonal main body (3.5m diameter)
    const bus = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 1.75, scale * 1.75, scale * 1, 6, this.geometryCache),
        goldMat
    );
    bus.rotation.x = Math.PI / 2;
    juno.add(bus);
    
    // Three massive 9m x 2.7m solar panels (iconic!) - reuse geometries
    const panelGeom = GeometryFactory.createBox(scale * 9, scale * 0.05, scale * 2.7, this.geometryCache);
    const frame1Geom = GeometryFactory.createBox(scale * 9, scale * 0.1, scale * 0.05, this.geometryCache);
    const frame2Geom = frame1Geom; // Same geometry
    const gridLineGeom = GeometryFactory.createBox(scale * 0.02, scale * 0.08, scale * 2.7, this.geometryCache);
    
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i;
        const panelGroup = new THREE.Group();
        
        // Solar panel - reuse geometry
        const panel = new THREE.Mesh(panelGeom, panelMat);
        panel.position.x = scale * 4.5;
        panelGroup.add(panel);
        
        // Panel frames - reuse geometry
        const frame1 = new THREE.Mesh(frame1Geom, goldMat);
        frame1.position.set(scale * 4.5, 0, scale * 1.35);
        panelGroup.add(frame1);
        
        const frame2 = new THREE.Mesh(frame2Geom, goldMat);
        frame2.position.set(scale * 4.5, 0, -scale * 1.35);
        panelGroup.add(frame2);
        
        // Grid lines on panels - reuse geometry
        for (let j = 0; j <= 8; j++) {
            const line = new THREE.Mesh(gridLineGeom, goldMat);
            line.position.set(scale * j, 0, 0);
            panelGroup.add(line);
        }
        
        panelGroup.position.set(
            Math.cos(angle) * scale * 1.75,
            Math.sin(angle) * scale * 1.75,
            0
        );
        panelGroup.rotation.z = angle;
        juno.add(panelGroup);
    }
    
    // High-gain antenna (2.5m diameter)
    const antenna = new THREE.Mesh(
        GeometryFactory.createCone(scale * 1.25, scale * 0.4, 32, this.geometryCache),
        whiteMat
    );
    antenna.position.z = scale * 0.8;
    juno.add(antenna);
    
    // JunoCam (visible on side)
    const camera = new THREE.Mesh(
        GeometryFactory.createBox(scale * 0.2, scale * 0.2, scale * 0.15, this.geometryCache),
        darkMat
    );
    camera.position.set(scale * 1.5, 0, scale * 0.3);
    juno.add(camera);
    
    // Magnetometer boom (extends from one panel)
    const magBoom = new THREE.Mesh(
        GeometryFactory.createCylinder(scale * 0.03, scale * 0.03, scale * 3, 8, this.geometryCache),
        goldMat
    );
    magBoom.position.set(scale * 8, scale * 1.75, 0);
    magBoom.rotation.z = Math.PI / 2;
    juno.add(magBoom);
    
    // Magnetometer sensor
    const magSensor = new THREE.Mesh(
        GeometryFactory.createBox(scale * 0.15, scale * 0.15, scale * 0.15, this.geometryCache),
        darkMat
    );
    magSensor.position.set(scale * 9.5, scale * 1.75, 0);
    juno.add(magSensor);
    
    // Microwave radiometer antennas (6 visible) - reuse geometry
    const mwrGeom = GeometryFactory.createBox(scale * 0.15, scale * 0.15, scale * 0.2, this.geometryCache);
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const mwr = new THREE.Mesh(mwrGeom, darkMat);
        mwr.position.set(
            Math.cos(angle) * scale * 1.6,
            Math.sin(angle) * scale * 1.6,
            -scale * 0.3
        );
        juno.add(mwr);
    }
    
    return juno;
}

export function createHyperrealisticNewHorizons(satData) {
    if (DEBUG.enabled) console.log(' Creating hyperrealistic New Horizons probe');
    const newHorizons = new THREE.Group();
    // Scale based on the spacecraft's display size
    const scale = satData.size || 0.06;
    
    // Materials
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.9 });
    
    // Triangular main body (compact design)
    const bodyGeom = new THREE.CylinderGeometry(scale * 1.1, scale * 1.1, scale * 0.7, 3);
    const body = new THREE.Mesh(bodyGeom, goldMat);
    body.rotation.x = Math.PI / 2;
    newHorizons.add(body);
    
    // 2.1m high-gain antenna (white dish)
    const dish = new THREE.Mesh(new THREE.ConeGeometry(scale * 1.05, scale * 0.35, 32), whiteMat);
    dish.position.z = scale * 0.6;
    newHorizons.add(dish);
    
    // Feed assembly
    const feed = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.08, scale * 0.08, scale * 0.25, 16), darkMat);
    feed.position.z = scale * 0.8;
    newHorizons.add(feed);
    
    // RTG (single plutonium power source on side)
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.25, scale * 0.25, scale * 1.2, 16), darkMat);
    rtg.position.set(-scale * 1.2, 0, -scale * 0.2);
    rtg.rotation.z = Math.PI / 2;
    newHorizons.add(rtg);
    
    // Science instruments (LORRI telescope - long narrow cone)
    const lorri = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.1, scale * 0.15, scale * 0.8, 16), darkMat);
    lorri.position.set(scale * 0.5, 0, scale * 0.2);
    lorri.rotation.z = Math.PI / 2;
    newHorizons.add(lorri);
    
    // Ralph instrument (visible color camera)
    const ralph = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.25, scale * 0.25, scale * 0.2), darkMat);
    ralph.position.set(scale * 0.6, scale * 0.3, scale * 0.1);
    newHorizons.add(ralph);
    
    // Alice UV spectrometer
    const alice = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.05, scale * 0.05, scale * 0.4, 12), silverMat);
    alice.position.set(scale * 0.6, -scale * 0.3, scale * 0.1);
    alice.rotation.z = Math.PI / 2;
    newHorizons.add(alice);
    
    // Medium-gain antenna (on back)
    const medAntenna = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.15, scale * 0.15, 16), silverMat);
    medAntenna.position.set(-scale * 0.8, scale * 0.5, 0);
    newHorizons.add(medAntenna);
    
    // Low-gain antennas (2 small)
    for (let i = 0; i < 2; i++) {
        const lowAntenna = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.03, scale * 0.03, scale * 0.2, 8), silverMat);
        lowAntenna.position.set(-scale * 0.5, i === 0 ? scale * 0.7 : -scale * 0.7, -scale * 0.2);
        newHorizons.add(lowAntenna);
    }
    
    // Hydrazine fuel tank (visible sphere)
    const fuelTank = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.3, 16, 16), silverMat);
    fuelTank.position.set(-scale * 0.6, 0, -scale * 0.4);
    newHorizons.add(fuelTank);
    
    // Thrusters (small cones at various angles)
    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        const thruster = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.04, scale * 0.08, 8), darkMat);
        thruster.position.set(
            Math.cos(angle) * scale * 0.9,
            Math.sin(angle) * scale * 0.9,
            -scale * 0.5
        );
        newHorizons.add(thruster);
    }
    
    return newHorizons;
}

export function createHyperrealisticISS(satData) {
if (DEBUG.enabled) console.log(' Creating ISS with all modules');

// Complete ISS model with ALL modules as of October 2025
// Real ISS: 109m long × 73m wide × 20m tall, 419,725 kg
// 16 pressurized modules + truss + solar arrays + radiators
const iss = new THREE.Group();
const scale = 0.001; // Increased from 0.0003 for better visibility when zoomed in

// Materials
const moduleMaterial = new THREE.MeshStandardMaterial({
color: 0xE8E8E8, // White/silver modules
roughness: 0.5,
metalness: 0.7
});

const russianMaterial = new THREE.MeshStandardMaterial({
color: 0xD4AF37, // Gold/bronze (Russian modules)
roughness: 0.4,
metalness: 0.8
});

const solarPanelMaterial = new THREE.MeshStandardMaterial({
color: 0x1a3d5c, // Dark blue solar panels
roughness: 0.2,
metalness: 0.9,
emissive: 0x0a1a2e,
emissiveIntensity: 0.1
});

const trussMaterial = new THREE.MeshStandardMaterial({
color: 0x8B8B8B, // Gray truss
roughness: 0.6,
metalness: 0.8
});

// Helper function to create a module
const createModule = (length, diameter, material, name) => {
const geometry = new THREE.CylinderGeometry(scale * diameter, scale * diameter, scale * length, 16);
const module = new THREE.Mesh(geometry, material);
module.name = name;
return module;
};

// ========== INTEGRATED TRUSS STRUCTURE (ITS) ==========
// Main backbone - 109m long
const mainTrussGeometry = new THREE.BoxGeometry(scale * 109, scale * 0.5, scale * 0.5);
const mainTruss = new THREE.Mesh(mainTrussGeometry, trussMaterial);
mainTruss.position.set(0, 0, 0);
mainTruss.name = 'Main Truss';
iss.add(mainTruss);

// ========== RUSSIAN SEGMENT (launched 1998-2021) ==========
// 1. Zarya (FGB) - First module, launched Nov 20, 1998
const zarya = createModule(12.6, 4.1, russianMaterial, 'Zarya (FGB)');
zarya.rotation.z = Math.PI / 2;
zarya.position.set(-scale * 20, 0, 0);
iss.add(zarya);

// 2. Zvezda - Service module, launched Jul 12, 2000
const zvezda = createModule(13.1, 4.15, russianMaterial, 'Zvezda');
zvezda.rotation.z = Math.PI / 2;
zvezda.position.set(-scale * 30, 0, 0);
iss.add(zvezda);

// 3. Pirs - Docking compartment, launched Sep 14, 2001 (deorbited Jul 2021)
// Now replaced by Nauka

// 4. Poisk (MRM-2) - Docking module, launched Nov 10, 2009
const poisk = createModule(4.0, 2.55, russianMaterial, 'Poisk (MRM-2)');
poisk.position.set(-scale * 30, scale * 5, 0);
iss.add(poisk);

// 5. Rassvet (MRM-1) - Mini research module, launched May 14, 2010
const rassvet = createModule(6.0, 2.35, russianMaterial, 'Rassvet (MRM-1)');
rassvet.position.set(-scale * 20, -scale * 4, 0);
iss.add(rassvet);

// 6. Nauka - Multipurpose laboratory, launched Jul 21, 2021
const nauka = createModule(13.0, 4.25, russianMaterial, 'Nauka');
nauka.rotation.z = Math.PI / 2;
nauka.position.set(-scale * 38, 0, scale * 2);
iss.add(nauka);

// 7. Prichal - Docking module, launched Nov 24, 2021
const prichal = createModule(3.0, 2.0, russianMaterial, 'Prichal');
prichal.position.set(-scale * 38, -scale * 4, scale * 2);
iss.add(prichal);

// ========== US SEGMENT ==========
// 8. Unity (Node 1) - First US module, launched Dec 4, 1998
const unity = createModule(5.5, 4.57, moduleMaterial, 'Unity (Node 1)');
unity.rotation.z = Math.PI / 2;
unity.position.set(-scale * 10, 0, 0);
iss.add(unity);

// 9. Destiny - US Laboratory, launched Feb 7, 2001
const destiny = createModule(8.5, 4.27, moduleMaterial, 'Destiny Lab');
destiny.rotation.z = Math.PI / 2;
destiny.position.set(-scale * 2, 0, 0);
iss.add(destiny);

// 10. Quest - Airlock, launched Jul 12, 2001
const quest = createModule(5.5, 4.0, moduleMaterial, 'Quest Airlock');
quest.position.set(-scale * 10, 0, -scale * 5);
iss.add(quest);

// 11. Harmony (Node 2) - Connecting module, launched Oct 23, 2007
const harmony = createModule(7.2, 4.4, moduleMaterial, 'Harmony (Node 2)');
harmony.rotation.z = Math.PI / 2;
harmony.position.set(scale * 8, 0, 0);
iss.add(harmony);

// 12. Tranquility (Node 3) - Life support, launched Feb 8, 2010
const tranquility = createModule(6.7, 4.48, moduleMaterial, 'Tranquility (Node 3)');
tranquility.position.set(scale * 8, 0, -scale * 6);
iss.add(tranquility);

// 13. Cupola - Observation module, launched Feb 8, 2010
const cupolaGeometry = new THREE.ConeGeometry(scale * 2.0, scale * 1.5, 8);
const cupola = new THREE.Mesh(cupolaGeometry, moduleMaterial);
cupola.position.set(scale * 8, -scale * 5, -scale * 6);
cupola.name = 'Cupola';
iss.add(cupola);

// 14. Leonardo (PMM) - Permanent Multipurpose Module, launched Feb 24, 2011
const leonardo = createModule(6.4, 4.57, moduleMaterial, 'Leonardo (PMM)');
leonardo.position.set(scale * 8, scale * 4, 0);
iss.add(leonardo);

// ========== INTERNATIONAL PARTNER MODULES ==========
// 15. Columbus - European laboratory, launched Feb 7, 2008
const columbus = createModule(6.9, 4.48, moduleMaterial, 'Columbus (ESA)');
columbus.rotation.x = Math.PI / 2;
columbus.position.set(scale * 8, 0, scale * 6);
iss.add(columbus);

// 16. Kibo (JEM) - Japanese Experiment Module, launched Mar 11 & May 31, 2008
const kiboMain = createModule(11.2, 4.4, moduleMaterial, 'Kibo PM');
kiboMain.rotation.x = Math.PI / 2;
kiboMain.position.set(scale * 12, 0, -scale * 10);
iss.add(kiboMain);

// Kibo Logistics Module
const kiboLogistics = createModule(4.2, 4.4, moduleMaterial, 'Kibo ELM');
kiboLogistics.position.set(scale * 12, scale * 4, -scale * 10);
iss.add(kiboLogistics);

// Kibo External Facility
const kiboExternal = new THREE.BoxGeometry(scale * 5, scale * 0.3, scale * 4);
const kiboExt = new THREE.Mesh(kiboExternal, moduleMaterial);
kiboExt.position.set(scale * 12, -scale * 3.5, -scale * 10);
kiboExt.name = 'Kibo EF';
iss.add(kiboExt);

// ========== COMMERCIAL MODULES ==========
// 17. BEAM (Bigelow Expandable Activity Module) - launched Apr 8, 2016
const beam = createModule(4.0, 3.2, moduleMaterial, 'BEAM');
beam.position.set(scale * 8, -scale * 4, -scale * 6);
iss.add(beam);

// ========== SOLAR ARRAYS ==========
// 8 solar arrays (4 pairs) - 73m total wingspan
const solarArrayGeometry = new THREE.BoxGeometry(scale * 11.58, scale * 0.05, scale * 34.2);

// Port arrays (P4/P6)
const p6_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
p6_1.position.set(-scale * 40, scale * 8, 0);
p6_1.name = 'P6 Array 1';
iss.add(p6_1);

const p6_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
p6_2.position.set(-scale * 40, -scale * 8, 0);
p6_2.name = 'P6 Array 2';
iss.add(p6_2);

const p4_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
p4_1.position.set(-scale * 25, scale * 8, 0);
p4_1.name = 'P4 Array 1';
iss.add(p4_1);

const p4_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
p4_2.position.set(-scale * 25, -scale * 8, 0);
p4_2.name = 'P4 Array 2';
iss.add(p4_2);

// Starboard arrays (S4/S6)
const s4_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
s4_1.position.set(scale * 25, scale * 8, 0);
s4_1.name = 'S4 Array 1';
iss.add(s4_1);

const s4_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
s4_2.position.set(scale * 25, -scale * 8, 0);
s4_2.name = 'S4 Array 2';
iss.add(s4_2);

const s6_1 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
s6_1.position.set(scale * 40, scale * 8, 0);
s6_1.name = 'S6 Array 1';
iss.add(s6_1);

const s6_2 = new THREE.Mesh(solarArrayGeometry, solarPanelMaterial);
s6_2.position.set(scale * 40, -scale * 8, 0);
s6_2.name = 'S6 Array 2';
iss.add(s6_2);

// ========== RADIATORS ==========
// Heat dissipation panels
const radiatorGeometry = new THREE.BoxGeometry(scale * 15, scale * 0.05, scale * 4.5);
const radiatorMaterial = new THREE.MeshStandardMaterial({
color: 0xC0C0C0,
roughness: 0.3,
metalness: 0.9
});

for (let i = 0; i < 6; i++) {
const radiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
radiator.position.set(-scale * 35 + i * scale * 12, 0, scale * 8);
radiator.name = `Radiator ${i + 1}`;
iss.add(radiator);
}

// ========== ROBOTIC ARMS ==========
// Canadarm2 - 17.6m long
const canadarmGeometry = new THREE.CylinderGeometry(scale * 0.35, scale * 0.35, scale * 17.6, 12);
const canadarm = new THREE.Mesh(canadarmGeometry, trussMaterial);
canadarm.rotation.z = Math.PI / 4;
canadarm.position.set(scale * 5, scale * 10, 0);
canadarm.name = 'Canadarm2';
iss.add(canadarm);

// Dextre (Special Purpose Dexterous Manipulator)
const dextreGeometry = new THREE.BoxGeometry(scale * 3.5, scale * 1.5, scale * 1.5);
const dextre = new THREE.Mesh(dextreGeometry, trussMaterial);
dextre.position.set(scale * 5, scale * 18, 0);
dextre.name = 'Dextre';
iss.add(dextre);

// Japanese robotic arm (on Kibo)
const jemRMSGeometry = new THREE.CylinderGeometry(scale * 0.25, scale * 0.25, scale * 10, 10);
const jemRMS = new THREE.Mesh(jemRMSGeometry, trussMaterial);
jemRMS.rotation.x = Math.PI / 3;
jemRMS.position.set(scale * 12, scale * 5, -scale * 10);
jemRMS.name = 'JEM RMS';
iss.add(jemRMS);

// ========== VISIBILITY AIDS ==========
// Larger glow for distance visibility
const glowGeometry = new THREE.SphereGeometry(scale * 10, 16, 16);
const glowMaterial = new THREE.MeshBasicMaterial({
color: 0xFFFFFF,
transparent: true,
opacity: 0.5
});
const glow = new THREE.Mesh(glowGeometry, glowMaterial);
glow.name = 'Visibility Glow';
iss.add(glow);

// Larger center marker
const markerGeometry = new THREE.SphereGeometry(scale * 3, 8, 8);
const markerMaterial = new THREE.MeshBasicMaterial({
color: 0xFFD700
});
const marker = new THREE.Mesh(markerGeometry, markerMaterial);
marker.name = 'Center Marker';
iss.add(marker);

// Enable shadows for all meshes
iss.traverse((child) => {
if (child instanceof THREE.Mesh) {
child.castShadow = true;
child.receiveShadow = true;
}
});

// Count all children for verification
let moduleCount = 0;
iss.traverse((child) => {
if (child instanceof THREE.Mesh) {
moduleCount++;
}
});

if (DEBUG.enabled) {
console.log(` ISS created with ${moduleCount} mesh components (scale: ${scale})`);
console.log(' - 17 pressurized modules, 8 solar arrays, 6 radiators, 3 robotic arms');
}

return iss;
}

export function createSatellites(scene) {
// Create Earth satellites (ISS and important satellites)
this.satellites = [];

const satellitesData = [
{ 
name: 'ISS (International Space Station)', 
distance: 1.05, // Orbital altitude: 408-410 km above Earth's surface (scaled)
speed: 15.5, // REAL SPEED: 7.66 km/s (27,576 km/h), 15.5 orbits/day, 92.68 min/orbit
// Animation: speed * timeSpeed * 0.01 = angle increment
// At timeSpeed=1: 15.5 * 1 * 0.01 = 0.155 rad/frame = realistic orbital motion
size: 0.03,
color: 0xCCCCCC,
description: t('descISS'),
funFact: t('funFactISS'),
realSize: '109m × 73m × 20m, 419,725 kg',
orbitTime: '92.68 minutes',
modules: '17 pressurized modules: Zarya, Unity, Zvezda, Destiny, Quest, Harmony, Columbus, Kibo (3 parts), Poisk, Tranquility, Cupola, Rassvet, Leonardo, BEAM, Nauka, Prichal. Plus 8 solar arrays, 6 radiators, 3 robotic arms (Canadarm2, Dextre, JEM RMS).'
},
{ 
name: 'Hubble Space Telescope', 
distance: 1.08, // Orbital altitude: ~535 km (varies due to atmospheric drag)
speed: 15.1, // Orbital velocity: 7.59 km/s (27,300 km/h)
size: 0.02,
color: 0x4169E1,
description: t('descHubble'),
funFact: t('funFactHubble'),
realSize: '13.2m long 4.2m diameter, 11,110 kg',
orbitTime: '96 minutes'
},
{
name: 'GPS Satellite (NAVSTAR)',
distance: 4.17, // 20,180 km altitude; orbit radius from Earth center = (20,180 + 6,371) / 6,371 ≈ 4.17
speed: 2.0,
size: 0.015,
color: 0x00FF00,
description: t('descGPS'),
funFact: t('funFactGPS'),
realSize: 'GPS III: 2,161 kg, 7.8m solar span',
orbitTime: '11h 58min'
},
{
name: 'Sputnik 1',
distance: 1.09, // Average orbit ~577 km altitude (215–939 km); distance 1.09 = safely above Earth surface (radius 1.0)
speed: 14.9, // Orbital period 96.2 minutes, ~15 orbits/day
size: 0.008, // Educationally scaled: visible when focused, proportional relative to Earth
color: 0xC0C0C0,
description: t('descSputnik1'),
funFact: t('funFactSputnik1'),
realSize: '58 cm diameter sphere, 83.6 kg',
orbitTime: '96.2 minutes'
}
];

if (!this.planets.earth) {
if (DEBUG.enabled) console.warn('Earth not found, cannot create satellites');
return;
}

satellitesData.forEach((satData, index) => {
let satellite;

// Build each model in isolation. A throw here used to abort the whole forEach,
// which silently removed every satellite defined after the failing one.
try {
// Create hyperrealistic models for ISS, Hubble, JWST, and space probes
if (satData.name.includes('ISS')) {
satellite = this.createHyperrealisticISS(satData);
} else if (satData.name.includes('Hubble')) {
satellite = this.createHyperrealisticHubble(satData);
} else if (satData.name.includes('James Webb')) {
satellite = this.createHyperrealisticJWST(satData);
} else if (satData.name.includes('Pioneer')) {
satellite = this.createHyperrealisticPioneer(satData);
} else if (satData.name.includes('Voyager')) {
satellite = this.createHyperrealisticVoyager(satData);
} else if (satData.name.includes('Cassini')) {
satellite = this.createHyperrealisticCassini(satData);
} else if (satData.name.includes('Juno')) {
satellite = this.createHyperrealisticJuno(satData);
} else if (satData.name.includes('New Horizons')) {
satellite = this.createHyperrealisticNewHorizons(satData);
} else if (satData.name.includes('Sputnik')) {
satellite = this.createHyperrealisticSputnik(satData);
} else {
// Simple satellite body for others
const geometry = new THREE.BoxGeometry(satData.size, satData.size * 0.5, satData.size * 0.3);
const material = new THREE.MeshStandardMaterial({
color: satData.color,
roughness: 0.4,
metalness: 0.8,
emissive: satData.color,
emissiveIntensity: 0.3
});

satellite = new THREE.Mesh(geometry, material);

// Add solar panels for most satellites
if (satData.name !== 'Starlink Constellation') {
const panelGeometry = new THREE.BoxGeometry(satData.size * 2, satData.size * 0.02, satData.size * 0.8);
const panelMaterial = new THREE.MeshStandardMaterial({
color: 0x1a3d5c,
roughness: 0.2,
metalness: 0.9
});

const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
panel1.position.x = satData.size * 1.2;
satellite.add(panel1);

const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
panel2.position.x = -satData.size * 1.2;
satellite.add(panel2);
}

// Add antenna for communication satellites
if (satData.name.includes('GPS')) {
const antennaGeometry = new THREE.CylinderGeometry(0.005, 0.005, satData.size * 0.8);
const antennaMaterial = new THREE.MeshStandardMaterial({
color: 0x888888,
roughness: 0.3,
metalness: 0.9
});
const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
antenna.position.y = satData.size * 0.6;
satellite.add(antenna);
}
}
} catch (e) {
console.error(`[Satellites] Failed to build "${satData.name}", skipping:`, e);
return;
}

           satellite.userData = {
               name: satData.name,
               type: 'satellite',
               radius: satData.size,
               actualSize: satData.size, // Use actual size for camera distance calculations
               distance: satData.distance,
               angle: (Math.PI * 2 / satellitesData.length) * index, // Spread them out
               speed: satData.speed,
               description: satData.description,
               funFact: satData.funFact,
               realSize: satData.realSize,
               orbitTime: satData.orbitTime,
               orbitPlanet: 'earth', // Consistent with spacecraft naming
               planet: this.planets.earth,
               isSpacecraft: true, // Mark as spacecraft for camera logic
               inclination: (index * 30) * Math.PI / 180 // Different orbital inclinations
           }; scene.add(satellite);
this.objects.push(satellite);
this.satellites.push(satellite);
this.pickableObjects.push(satellite);
});
}

export function createSpacecraft(scene) {
// Deep space probes and interplanetary missions
this.spacecraft = [];

// ── Trajectory data for straight-line deep-space probes ──────────────────
// Each probe travels in a fixed direction (ecliptic longitude + latitude) at
// an approximately constant heliocentric speed. Positions are computed from a
// published JPL/NASA reference epoch so they update correctly with the time machine.
//
// Coordinate convention (matches Three.js scene):
//   X = ecliptic lon 0°  (vernal equinox)
//   Z = ecliptic lon 90°
//   Y = ecliptic north pole
//
// Formula:
//   distAU = refDistAU + speedKmps * (jd - refJD) * 86400 / 149597870.7
//   x = distSceneUnits * cos(lat) * cos(lon)
//   z = distSceneUnits * cos(lat) * sin(lon)
//   y = distSceneUnits * sin(lat)
//
// Reference epochs and heliocentric scale:
//   Voyager 1/2, New Horizons: Jan 1 2025 (JD 2460676.5) from NASA JPL Horizons.
//   Pioneer 10: ~Jan 2003 (JD 2452641.5) — last-contact date, not Jan 2025.
//   Pioneer 11: ~Nov 1995 (JD 2450084.5) — last-contact date, not Jan 2025.
//   Positions for all probes are linearly extrapolated from these reference epochs.
//
// Scale: _probePositionAtJD() converts distAU → scene units using:
//   educational: 22.5 scene-units/AU  (heliopause 2,700 / 120 AU)
//   realistic:  150   scene-units/AU  (heliopause 18,000 / 120 AU)
// NOTE: Inner planet visual distances are NOT derived from AU — they use separate
//   display units (e.g. Mercury at 20 units/0.39 AU ≈ 51.3 units/AU). Only the
//   heliospheric probe model uses the 22.5/150 AU conversion above.
const PROBE_TRAJECTORIES = {
'Voyager 1':   { refJD: 2460676.5, refDistAU: 163.7,  speedKmps: 16.99, eclLon: 255.8, eclLat: 35.7  },
'Voyager 2':   { refJD: 2460676.5, refDistAU: 136.6,  speedKmps: 15.35, eclLon: 208.0, eclLat: -31.9 },
'New Horizons':{ refJD: 2460676.5, refDistAU:  58.3,  speedKmps: 13.85, eclLon: 305.7, eclLat: -7.3  },
'Pioneer 10':  { refJD: 2452641.5, refDistAU:  80.0,  speedKmps: 12.04, eclLon:  79.5, eclLat:  3.0  },
'Pioneer 11':  { refJD: 2450084.5, refDistAU:  42.7,  speedKmps: 11.38, eclLon: 311.5, eclLat: -17.0 }
};

const spacecraftData = [
{
name: 'Voyager 1',
distance: 8307, // placeholder; overwritten by trajectory at init
angle: Math.PI * 0.7,
speed: 0, // not used — trajectory-based movement
size: 0.08,
color: 0xC0C0C0,
type: 'probe',
description: t('descVoyager1'),
funFact: t('funFactVoyager1'),
realSize: '825.5 kg, 3.7m antenna dish',
launched: 'September 5, 1977',
status: 'Active in Interstellar Space (since Aug 2012)'
},
{
name: 'Voyager 2',
distance: 6923, // placeholder; overwritten by trajectory at init
angle: Math.PI * 1.2,
speed: 0,
size: 0.08,
color: 0xB0B0B0,
type: 'probe',
description: t('descVoyager2'),
funFact: t('funFactVoyager2'),
realSize: '825.5 kg, 3.7m antenna dish',
launched: 'August 20, 1977',
status: 'Active in Interstellar Space (since Nov 2018)'
},
{
name: 'New Horizons',
distance: 3025, // placeholder; overwritten by trajectory at init
angle: Math.PI * 0.3,
speed: 0,
size: 0.06,
color: 0x4169E1,
type: 'probe',
description: t('descNewHorizons'),
funFact: t('funFactNewHorizons'),
realSize: '478 kg, 0.7 × 2.1 × 2.7m (piano-sized)',
launched: 'January 19, 2006',
status: 'Active in Kuiper Belt'
},
{
name: 'James Webb Space Telescope',
distance: 55, // At Sun-Earth L2 Lagrange point, ~1.01 AU from Sun (1.5 million km beyond Earth at 51 units)
angle: Math.PI * 0.15, // Positioned near Earth's L2 point
speed: 0.0003, // Halo orbit around L2, period synced with Earth (1 year)
size: 0.03,
color: 0xFFD700,
type: 'observatory',
description: t('descJWST'),
funFact: t('funFactJWST'),
realSize: '6.5m mirror, 21.2m × 14.2m sunshield, 6,161 kg',
launched: 'December 25, 2021',
status: 'Active at L2 Point'
},
{
name: 'Juno (Jupiter)',
orbitPlanet: 'jupiter',
distance: 11.5, // Highly elliptical polar orbit: 4,200 km to 8.1 million km from Jupiter's cloud tops
angle: 0,
speed: 3.0, // Orbital period: 53.5 days
size: 0.05,
color: 0xFFD700,
type: 'orbiter',
description: t('descJuno'),
funFact: t('funFactJuno'),
realSize: '3,625 kg, 20m solar panel span',
launched: 'August 5, 2011',
status: 'Active in Jupiter Orbit (63+ orbits)'
},
{
name: 'Cassini-Huygens Legacy (Saturn)',
orbitPlanet: 'saturn',
distance: 9.6, // Orbited Saturn 294 times before Grand Finale
angle: 0,
speed: 2.5,
size: 0.06,
color: 0xDAA520,
type: 'probe',
description: t('descCassini'),
funFact: t('funFactCassini'),
realSize: '5,600 kg, 6.8m tall, 4m wide',
launched: 'October 15, 1997',
status: 'Mission Ended Sept 15, 2017 (Memorial)'
},
{
name: 'Pioneer 10',
distance: 7127, // placeholder; overwritten by trajectory at init
angle: Math.PI * 0.5,
speed: 0,
size: 0.07,
color: 0xA0A0A0,
type: 'probe',
description: t('descPioneer10'),
funFact: t('funFactPioneer10'),
realSize: '258 kg, 2.74m antenna dish',
launched: 'March 2, 1972',
status: 'Silent since Jan 2003 (Memorial)'
},
{
name: 'Pioneer 11',
distance: 5436, // placeholder; overwritten by trajectory at init
angle: Math.PI * 1.4,
speed: 0,
size: 0.07,
color: 0x909090,
type: 'probe',
description: t('descPioneer11'),
funFact: t('funFactPioneer11'),
realSize: '259 kg, 2.74m antenna dish',
launched: 'April 5, 1973',
status: 'Silent since Nov 1995 (Memorial)'
}
];

spacecraftData.forEach(craft => {
let spacecraftGroup;

// Check if this spacecraft has a hyperrealistic model
if (craft.name.includes('Voyager')) {
spacecraftGroup = this.createHyperrealisticVoyager(craft);
} else if (craft.name.includes('Pioneer')) {
spacecraftGroup = this.createHyperrealisticPioneer(craft);
} else if (craft.name.includes('Juno')) {
spacecraftGroup = this.createHyperrealisticJuno(craft);
} else if (craft.name.includes('Cassini')) {
spacecraftGroup = this.createHyperrealisticCassini(craft);
} else if (craft.name.includes('James Webb')) {
spacecraftGroup = this.createHyperrealisticJWST(craft);
} else if (craft.name.includes('New Horizons')) {
spacecraftGroup = this.createHyperrealisticNewHorizons(craft);
} else {
// Create GENERIC spacecraft with detailed geometry for others
spacecraftGroup = new THREE.Group();

// Main body - octagonal/box shape for probes
if (craft.type === 'probe' || craft.type === 'orbiter') {
// Central bus/body - box shape
const bodyGeometry = new THREE.BoxGeometry(craft.size * 0.8, craft.size * 0.6, craft.size * 0.8);
const bodyMaterial = new THREE.MeshStandardMaterial({
color: craft.color,
roughness: 0.4,
metalness: 0.7,
emissive: craft.color,
emissiveIntensity: 0.1
});
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
spacecraftGroup.add(body);

// High-gain antenna dish - realistic parabolic shape
const dishGeometry = new THREE.CylinderGeometry(craft.size * 1.5, craft.size * 1.8, craft.size * 0.15, 24);
const dishMaterial = new THREE.MeshStandardMaterial({
color: 0xF0F0F0,
roughness: 0.2,
metalness: 0.95,
envMapIntensity: 1.5
});
const dish = new THREE.Mesh(dishGeometry, dishMaterial);
dish.rotation.x = Math.PI / 2;
dish.position.set(0, craft.size * 0.4, 0);
spacecraftGroup.add(dish);

// Dish support struts - tripod
for (let i = 0; i < 3; i++) {
const angle = (i / 3) * Math.PI * 2;
const strutGeometry = new THREE.CylinderGeometry(craft.size * 0.02, craft.size * 0.02, craft.size * 0.5);
const strutMaterial = new THREE.MeshStandardMaterial({
color: 0x404040,
roughness: 0.7,
metalness: 0.9
});
const strut = new THREE.Mesh(strutGeometry, strutMaterial);
strut.position.set(
Math.cos(angle) * craft.size * 0.5,
craft.size * 0.15,
Math.sin(angle) * craft.size * 0.5
);
strut.rotation.x = Math.PI / 2;
strut.rotation.z = angle;
spacecraftGroup.add(strut);
}

// RTG (Radioisotope Thermoelectric Generator) boom - characteristic long boom
const rtgBoomGeometry = new THREE.CylinderGeometry(craft.size * 0.04, craft.size * 0.04, craft.size * 2.5);
const rtgBoomMaterial = new THREE.MeshStandardMaterial({
color: 0x606060,
roughness: 0.6,
metalness: 0.85
});
const rtgBoom = new THREE.Mesh(rtgBoomGeometry, rtgBoomMaterial);
rtgBoom.position.set(craft.size * 1.2, 0, 0);
rtgBoom.rotation.z = Math.PI / 2;
spacecraftGroup.add(rtgBoom);

// RTG unit at end of boom - cylindrical
const rtgGeometry = new THREE.CylinderGeometry(craft.size * 0.15, craft.size * 0.15, craft.size * 0.4, 8);
const rtgMaterial = new THREE.MeshStandardMaterial({
color: 0x2A2A2A,
roughness: 0.5,
metalness: 0.8,
emissive: 0xFF4400,
emissiveIntensity: 0.3 // RTGs glow slightly from heat
});
const rtg = new THREE.Mesh(rtgGeometry, rtgMaterial);
rtg.position.set(craft.size * 2.4, 0, 0);
rtg.rotation.z = Math.PI / 2;
spacecraftGroup.add(rtg);

// Science instruments boom on opposite side
const scienceBoomGeometry = new THREE.CylinderGeometry(craft.size * 0.03, craft.size * 0.03, craft.size * 1.8);
const scienceBoomMaterial = new THREE.MeshStandardMaterial({
color: 0x505050,
roughness: 0.7,
metalness: 0.8
});
const scienceBoom = new THREE.Mesh(scienceBoomGeometry, scienceBoomMaterial);
scienceBoom.position.set(-craft.size * 0.9, 0, 0);
scienceBoom.rotation.z = Math.PI / 2;
spacecraftGroup.add(scienceBoom);

// Instruments cluster - small boxes
for (let i = 0; i < 2; i++) {
const instGeometry = new THREE.BoxGeometry(craft.size * 0.12, craft.size * 0.12, craft.size * 0.08);
const instMaterial = new THREE.MeshStandardMaterial({
color: 0x808080,
roughness: 0.5,
metalness: 0.7
});
const inst = new THREE.Mesh(instGeometry, instMaterial);
inst.position.set(-craft.size * 1.8, i * craft.size * 0.15 - craft.size * 0.07, 0);
spacecraftGroup.add(inst);
}

} else {
// Memorial/generic - still make it detailed
const bodyGeometry = new THREE.OctahedronGeometry(craft.size * 0.7);
const bodyMaterial = new THREE.MeshStandardMaterial({
color: craft.color,
roughness: 0.4,
metalness: 0.8,
emissive: craft.color,
emissiveIntensity: 0.2
});
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
spacecraftGroup.add(body);

// Add some detail
const panelGeometry = new THREE.BoxGeometry(craft.size * 0.3, craft.size * 0.05, craft.size * 1.0);
const panelMaterial = new THREE.MeshStandardMaterial({
color: 0x1A1A2E,
roughness: 0.3,
metalness: 0.9
});
const panel = new THREE.Mesh(panelGeometry, panelMaterial);
panel.position.set(craft.size * 0.5, 0, 0);
spacecraftGroup.add(panel);
}
} // End of generic spacecraft creation else block

// Add subtle visibility glow - but NOT for hyperrealistic models (they have enough detail)
const isHyperrealistic = craft.name.includes('Voyager') || craft.name.includes('Pioneer') || 
                         craft.name.includes('Juno') || craft.name.includes('Cassini') || 
                         craft.name.includes('James Webb') || craft.name.includes('New Horizons');

if (!isHyperrealistic) {
    const glowSize = craft.size * 2.5; // Subtle glow for visibility
    const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: craft.color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    spacecraftGroup.add(glow);
}

// Add small bright navigation marker for distant spacecraft
if (craft.distance > 200) {
const markerGeometry = new THREE.SphereGeometry(craft.size * 0.5, 8, 8);
const markerMaterial = new THREE.MeshBasicMaterial({
color: 0xFFFFFF,
transparent: true,
opacity: 0.95,
blending: THREE.AdditiveBlending
});
const marker = new THREE.Mesh(markerGeometry, markerMaterial);
spacecraftGroup.add(marker);
}

spacecraftGroup.userData = {
name: craft.name,
type: craft.type,
description: craft.description,
funFact: craft.funFact,
realSize: craft.realSize,
launched: craft.launched,
status: craft.status,
distance: craft.distance,
angle: craft.angle,
speed: craft.speed,
orbitPlanet: craft.orbitPlanet,
isMoon: craft.isMoon || false,
isSpacecraft: true,
actualSize: craft.size,
radius: craft.size,
// Trajectory data for date-accurate straight-line probes (null for orbiters)
trajectory: PROBE_TRAJECTORIES[craft.name] || null
};

if (DEBUG.enabled) console.log(` ${craft.name} created`);

// Position spacecraft
if (craft.orbitPlanet) {
// Orbiter around planet
const planet = this.planets[craft.orbitPlanet];
if (planet) {
spacecraftGroup.position.x = craft.distance * Math.cos(craft.angle);
spacecraftGroup.position.z = craft.distance * Math.sin(craft.angle);
planet.add(spacecraftGroup);
}
} else {
// Deep space probe - position in solar system
spacecraftGroup.position.x = craft.distance * Math.cos(craft.angle);
spacecraftGroup.position.z = craft.distance * Math.sin(craft.angle);
scene.add(spacecraftGroup);
}

this.objects.push(spacecraftGroup);
this.spacecraft.push(spacecraftGroup);
this.pickableObjects.push(spacecraftGroup);
});

if (DEBUG.enabled) console.log(` Created ${this.spacecraft.length} spacecraft and probes!`);
}