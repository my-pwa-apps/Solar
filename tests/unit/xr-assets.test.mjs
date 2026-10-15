import { readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

test('local XR profile graph and embedded GLBs are complete and mandatory offline assets', () => {
    const root = resolve('vendor/xr-input-profiles@1.0.20/dist/profiles');
    const profiles = JSON.parse(readFileSync(resolve(root, 'profilesList.json')));
    const worker = readFileSync('sw.js', 'utf8');
    const core = worker.match(/const CORE_CACHE_FILES = \[([\s\S]*?)\];/)[1];
    assert.ok(profiles['generic-trigger']);
    for (const [profileId, entry] of Object.entries(profiles)) {
        const profilePath = resolve(root, entry.path);
        const profile = JSON.parse(readFileSync(profilePath));
        assert.equal(profile.profileId, profileId);
        assert.ok(core.includes(relative('.', profilePath).replaceAll('\\', '/')));
        for (const layout of Object.values(profile.layouts)) {
            const modelPath = resolve(dirname(profilePath), layout.assetPath);
            assert.ok(core.includes(relative('.', modelPath).replaceAll('\\', '/')));
            const model = readFileSync(modelPath);
            assert.equal(model.toString('ascii', 0, 4), 'glTF');
            assert.equal(model.readUInt32LE(8), model.length);
            const json = JSON.parse(model.toString('utf8', 20, 20 + model.readUInt32LE(12)));
            assert.ok((json.buffers || []).every(buffer => !buffer.uri));
            assert.ok((json.images || []).every(image => !image.uri));
        }
    }
});