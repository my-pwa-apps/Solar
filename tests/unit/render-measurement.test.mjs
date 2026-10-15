import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

test('failed rendering cannot mark a successful first frame; recovery can', () => {
    const source = readFileSync(new URL('../../src/modules/SceneManager.js', import.meta.url), 'utf8');
    const method = source.slice(source.indexOf(' animate(callback) {'), source.indexOf(' updateBrightness(multiplier) {'));
    const marks = [];
    const measures = [];
    const Manager = vm.runInNewContext(`(class { ${method} })`, {
        performance: { mark: name => marks.push(name), measure: (...args) => measures.push(args) },
        console: { error() {} }, DEBUG: {}, CONFIG: { PERFORMANCE: {} }, BASIC_MAT_BANNED_PROPS: []
    });
    let frame;
    let failed = true;
    const manager = new Manager();
    Object.assign(manager, {
        _pendingDprChange: null, scene: { traverse() {} }, controls: { update() {} },
        renderer: { xr: { isPresenting: false }, setAnimationLoop(callback) { frame = callback; }, render() { if (failed) throw new Error('Injected GPU error'); } }
    });
    manager.animate(() => {});
    frame();
    assert.deepEqual(marks, ['render-error']);
    failed = false;
    frame();
    frame();
    assert.deepEqual(marks, ['render-error', 'first-frame']);
    const navigation = measures.find(args => args[0] === 'navigation-to-first-frame');
    assert.equal(navigation[1].start, 0);
    assert.equal(navigation[1].end, 'first-frame');
});