// Drives the split so long member lists are not retyped on the command line.
import { execFileSync } from 'node:child_process';

const GROUPS = [
    ['src/modules/solar-system/texture-generator.js', 'textureGenerator', [
        'createProceduralTexture', 'createCloudTexture', 'createSunTextureReal',
        'loadPlanetTextureReal', '_configureSphericalSurfaceTexture', '_onPlanetTextureSuccess',
        '_applyProceduralPlanetTexture', 'createMercuryTextureReal', 'createVenusTextureReal',
        '_buildEarthOceanLandRoughnessMap', 'createEarthTextureRealFixed', 'createMarsTextureReal',
        'createJupiterTextureReal', 'createSaturnTextureReal', 'createUranusTextureReal',
        'createNeptuneTextureReal', 'createMoonTextureReal', 'createPlutoTextureReal',
        'createCeresTextureReal', 'createIoTextureReal', 'createEuropaTextureReal',
        'createGanymedeTextureReal', 'createCallistoTextureReal', 'createTitanTextureReal',
        'createEnceladusTextureReal', 'createRheaTextureReal', 'createPhobosTextureReal',
        'createDeimosTextureReal', 'createTritonTextureReal', 'createTitaniaTextureReal',
        'createMirandaTextureReal', 'createCharonTextureReal', 'createHaumeaTextureReal',
        'createMakemakeTextureReal', 'createErisTextureReal', 'createEarthTexture',
        'createEarthBumpMap', 'createEarthNormalMap', 'createEarthSpecularMap', 'createMoonTexture',
        'createMoonBumpMap', 'createMoonNormalMap', 'createMarsTexture', 'createMarsBumpMap',
        'createMarsNormalMap', 'createPhobosTexture', 'createDeimosTexture', 'createIoTexture',
        'createEuropaTexture', 'createTitanTexture', 'createMercuryTexture', 'createMercuryBumpMap',
        'createVenusTexture', 'createJupiterTexture', 'createJupiterBumpMap', 'createSaturnTexture',
        'createSaturnBumpMap', 'createUranusTexture', 'createNeptuneTexture', 'createPlutoTexture',
        'verifyTextureLoads', 'loadTextureWithFallback'
    ]],
    ['src/modules/solar-system/comets-spacecraft.js', 'cometsSpacecraft', [
        'createComets', 'createHyperrealisticHubble', 'createHyperrealisticJWST',
        'createHyperrealisticSputnik', 'createHyperrealisticPioneer', 'createHyperrealisticVoyager',
        'createHyperrealisticCassini', 'createHyperrealisticJuno', 'createHyperrealisticNewHorizons',
        'createHyperrealisticISS', 'createSatellites', 'createSpacecraft',
        'updateSpacecraftPositions', 'updateCometPositions', 'updateCometOrbitLines'
    ]],
    ['src/modules/solar-system/deep-space.js', 'deepSpace', [
        'createStarfield', 'createMilkyWay', '_createMilkyWayGalaxyDisc', '_generateProceduralMilkyWay',
        '_buildMilkyWayDisc', '_createMilkyWaySolarLocator', '_buildMilkyWaySolarLabelTexture',
        'createNebulae', 'createHyperrealisticNebula', 'createNebulaLayer', 'createDustLayer',
        'createFilaments', 'createCentralStar', 'createPulsar', 'createWhiteDwarf',
        'createConstellations', 'highlightConstellation', 'resetConstellationHighlight',
        '_addPolarisPointerLine', 'createGalaxies', '_createBackgroundGalaxies', '_loadDeepSkySprite',
        '_buildAndromedaCanvasTexture', '_buildEllipticalGalaxyCanvas', '_buildProceduralGalaxy',
        'createNearbyStars', 'createExoplanets', 'updateDeepSpaceObjects'
    ]],
    ['src/modules/solar-system/orbital-mechanics.js', 'orbitalMechanics', [
        'setScientificMode', 'applyScientificModeSpeeds', 'toJulianDate', '_sunRA', '_solveKepler',
        '_meanToTrueAnomaly', '_probePositionAtJD', '_initSpacecraftToDate', 'initPositionsToDate',
        'seekToDate', '_moonDirectionObjectSpace', '_updateEclipse', '_applyEarthOrientation',
        'update', 'updateScale', 'updateOrbitalPaths', 'updateBelts', 'createOrbitalPaths'
    ]],
    ['src/modules/solar-system/celestial-factory.js', 'celestialFactory', [
        'createSun', 'createInnerPlanets', 'createOuterPlanets', 'createDwarfPlanets',
        'createPlanetMaterial', 'createPlanet', 'createMoon', 'createAsteroidBelt',
        'createKuiperBelt', 'createHeliopause', 'createOortCloud'
    ]]
];

const only = process.argv[2];
for (const [file, name, members] of GROUPS) {
    if (only && !file.includes(only)) continue;
    execFileSync(process.execPath,
        ['scripts/extract-members.mjs', file, name, members.join(',')],
        { stdio: 'inherit' });
}
