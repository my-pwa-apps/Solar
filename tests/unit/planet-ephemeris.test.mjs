import test from 'node:test';
import assert from 'node:assert/strict';

import {
    PLANET_IDS,
    planetEclipticPosition
} from '../../src/modules/astro/PlanetEphemeris.js';

// NASA/JPL Horizons geometric heliocentric vectors in the J2000 ecliptic
// frame. Queries used CENTER=500@10, REF_PLANE=ECLIPTIC and planet IDs
// 199..899 (Mars barycenter 4), sampled at the three JDTDB values below.
const HORIZONS_VECTORS = {
    2460310.5: {
        mercury: [-4.108411877039495e7, 2.997375954154480e7, 6.217890408222714e6],
        venus: [-1.069987422398024e8, -1.145572515113905e7, 6.016588327139664e6],
        earth: [-2.481099325965390e7, 1.449948612736719e8, -8.215203670851886e3],
        mars: [-4.388577457389553e7, -2.170849264747288e8, -3.473007284527391e6],
        jupiter: [5.225708576244547e8, 5.318268827721269e8, -1.390073285881653e7],
        saturn: [1.345793242617223e9, -5.559294178115252e8, -4.389262609579784e7],
        uranus: [1.835713428554630e9, 2.288891005963313e9, -1.529862525596797e7],
        neptune: [4.464446702837073e9, -2.679157710675750e8, -9.736547156118314e7]
    },
    2461271.5: {
        mercury: [-1.302336407949485e7, 4.489389706978536e7, 4.863361567563538e6],
        venus: [2.890441319202798e7, -1.049132237144714e8, -3.109146259507492e6],
        earth: [1.250605521435626e8, -8.535447434535676e7, 4.808855373375118e3],
        mars: [1.017566624990186e8, 2.004889282350336e8, 1.706408334811717e6],
        jupiter: [-4.840689291504081e8, 6.265299665257243e8, 8.227761034934759e6],
        saturn: [1.393415545009309e9, 2.290513056552942e8, -5.945532678546465e7],
        uranus: [1.358666807647990e9, 2.572810910952651e9, -8.061604082685232e6],
        neptune: [4.464692954009270e9, 1.861894867098230e8, -1.067213569493982e8]
    },
    2462502.5: {
        mercury: [-1.021589209662214e7, 4.540346229775665e7, 4.647644962244308e6],
        venus: [-1.284148615067068e7, 1.068149506760519e8, 2.209453622705944e6],
        earth: [-2.600847757810495e7, 1.447900488833384e8, -9.532206645891070e3],
        mars: [1.912791417331397e8, -7.798058850782205e7, -6.323760608081851e6],
        jupiter: [-6.010761224783534e8, -5.443627449282622e8, 1.571096906257430e7],
        saturn: [8.234220392755462e8, 1.087255875817960e9, -5.170394514569098e7],
        uranus: [6.775020498233269e8, 2.794318862015718e9, 1.592801679577231e6],
        neptune: [4.399119497101191e9, 7.631868517577286e8, -1.171074087972822e8]
    }
};

function angularSeparationDeg(actual, expected) {
    // Horizons uses X/Y as the ecliptic plane and Z as north; the scene uses
    // X/Z as its plane and Y as north.
    const expectedScene = { x: expected[0], y: expected[2], z: -expected[1] };
    const actualLength = Math.hypot(actual.x, actual.y, actual.z);
    const expectedLength = Math.hypot(expectedScene.x, expectedScene.y, expectedScene.z);
    const cosine = (actual.x * expectedScene.x + actual.y * expectedScene.y + actual.z * expectedScene.z)
        / (actualLength * expectedLength);
    return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

test('supports all eight planets', () => {
    assert.deepEqual(PLANET_IDS, [
        'mercury', 'venus', 'earth', 'mars',
        'jupiter', 'saturn', 'uranus', 'neptune'
    ]);
});

test('matches JPL Horizons heliocentric directions across three dates', () => {
    for (const [jdText, vectors] of Object.entries(HORIZONS_VECTORS)) {
        const jd = Number(jdText);
        for (const planetId of PLANET_IDS) {
            const actual = planetEclipticPosition(planetId, jd);
            assert.ok(actual, `${planetId} should have an ephemeris at JD ${jd}`);
            const error = angularSeparationDeg(actual, vectors[planetId]);
            assert.ok(error < 1,
                `${planetId} direction at JD ${jd} differs from Horizons by ${error.toFixed(3)} deg`);
        }
    }
});
