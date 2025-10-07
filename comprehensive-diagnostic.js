// 🔍 COMPREHENSIVE ANIMATION & SELECTION DIAGNOSTIC
// Copy and paste this ENTIRE file into browser console after loading the page

console.log('%c🔍 COMPREHENSIVE DIAGNOSTIC TEST', 'color: #00ff00; font-size: 24px; font-weight: bold');
console.log('='.repeat(80));

// ============================================================================
// TEST 1: Check if app exists and is initialized
// ============================================================================
console.log('\n%c📦 TEST 1: App Initialization', 'color: #ffff00; font-size: 16px; font-weight: bold');
if (!window.app) {
    console.error('❌ CRITICAL: window.app does not exist!');
    console.log('   → The app has not initialized or initialization failed');
    console.log('   → Check browser console for JavaScript errors');
} else {
    console.log('✅ window.app exists');
    console.log(`   - timeSpeed: ${window.app.timeSpeed}`);
    console.log(`   - brightness: ${window.app.brightness}`);
}

// ============================================================================
// TEST 2: Check SceneManager
// ============================================================================
console.log('\n%c🎬 TEST 2: SceneManager', 'color: #ffff00; font-size: 16px; font-weight: bold');
if (!window.app?.sceneManager) {
    console.error('❌ CRITICAL: sceneManager does not exist!');
} else {
    const sm = window.app.sceneManager;
    console.log('✅ sceneManager exists');
    console.log(`   - Renderer exists: ${!!sm.renderer}`);
    console.log(`   - Scene exists: ${!!sm.scene}`);
    console.log(`   - Camera exists: ${!!sm.camera}`);
    console.log(`   - Controls exists: ${!!sm.controls}`);
    console.log(`   - Raycaster exists: ${!!sm.raycaster}`);
    
    if (sm.scene) {
        console.log(`   - Objects in scene: ${sm.scene.children.length}`);
    }
}

// ============================================================================
// TEST 3: Check SolarSystemModule
// ============================================================================
console.log('\n%c🪐 TEST 3: SolarSystemModule', 'color: #ffff00; font-size: 16px; font-weight: bold');
if (!window.app?.solarSystemModule) {
    console.error('❌ CRITICAL: solarSystemModule does not exist!');
} else {
    const ssm = window.app.solarSystemModule;
    console.log('✅ solarSystemModule exists');
    
    const planetCount = Object.keys(ssm.planets).length;
    const objectCount = ssm.objects.length;
    
    console.log(`   - Planets object keys: ${planetCount}`);
    console.log(`   - Objects array length: ${objectCount}`);
    
    if (planetCount === 0) {
        console.error('   ❌ NO PLANETS LOADED!');
    } else {
        console.log(`   ✅ ${planetCount} planets loaded`);
        console.log('\n   Planet Details:');
        Object.entries(ssm.planets).forEach(([name, planet]) => {
            if (planet && planet.userData) {
                console.log(`   - ${name}:`);
                console.log(`      Position: (${planet.position.x.toFixed(1)}, ${planet.position.y.toFixed(1)}, ${planet.position.z.toFixed(1)})`);
                console.log(`      Distance: ${planet.userData.distance}, Speed: ${planet.userData.speed}`);
                console.log(`      Angle: ${planet.userData.angle?.toFixed(3) || 'undefined'}`);
                console.log(`      Visible: ${planet.visible}`);
                console.log(`      In scene: ${planet.parent === window.app.sceneManager.scene}`);
            } else {
                console.error(`      ❌ ${name} is null or missing userData!`);
            }
        });
    }
    
    if (objectCount === 0) {
        console.error('   ❌ NO OBJECTS IN SELECTABLE ARRAY!');
        console.log('   → Planets were not added to objects array');
        console.log('   → Selection will not work');
    } else {
        console.log(`   ✅ ${objectCount} selectable objects`);
    }
}

// ============================================================================
// TEST 4: Animation Loop Test
// ============================================================================
console.log('\n%c🎬 TEST 4: Animation Loop', 'color: #ffff00; font-size: 16px; font-weight: bold');

if (window.app?.solarSystemModule) {
    // Store initial positions
    const initialState = {};
    Object.entries(window.app.solarSystemModule.planets).forEach(([name, planet]) => {
        if (planet) {
            initialState[name] = {
                x: planet.position.x,
                z: planet.position.z,
                angle: planet.userData.angle
            };
        }
    });
    
    console.log('🔄 Calling update() manually...');
    
    // Call update
    try {
        window.app.solarSystemModule.update(
            0.016, // deltaTime (16ms = 60fps)
            window.app.timeSpeed || 1.0,
            window.app.sceneManager.camera,
            window.app.sceneManager.controls
        );
        
        console.log('✅ update() executed without errors');
        
        // Check for changes
        let changesDetected = 0;
        console.log('\n📊 Position changes:');
        Object.entries(window.app.solarSystemModule.planets).forEach(([name, planet]) => {
            if (planet && initialState[name]) {
                const initial = initialState[name];
                const deltaX = Math.abs(planet.position.x - initial.x);
                const deltaZ = Math.abs(planet.position.z - initial.z);
                const deltaAngle = Math.abs(planet.userData.angle - initial.angle);
                
                if (deltaX > 0.0001 || deltaZ > 0.0001 || deltaAngle > 0.0001) {
                    console.log(`   ✅ ${name} MOVED`);
                    console.log(`      Δposition: (${deltaX.toFixed(6)}, ${deltaZ.toFixed(6)})`);
                    console.log(`      Δangle: ${deltaAngle.toFixed(6)}`);
                    changesDetected++;
                } else {
                    console.warn(`   ⚠️  ${name} did NOT move`);
                    console.log(`      Speed: ${planet.userData.speed}`);
                    console.log(`      Angle: ${planet.userData.angle}`);
                }
            }
        });
        
        if (changesDetected === 0) {
            console.error('\n❌ NO MOVEMENT DETECTED!');
            console.log('Possible causes:');
            console.log('1. timeSpeed is 0');
            console.log('2. Planet speeds are all 0');
            console.log('3. Pause mode is active');
            console.log('4. Update logic is broken');
        } else {
            console.log(`\n✅ ${changesDetected} planets moved correctly`);
        }
        
    } catch (error) {
        console.error('❌ Error during update():', error);
        console.error(error.stack);
    }
} else {
    console.error('❌ Cannot test animation - solarSystemModule missing');
}

// ============================================================================
// TEST 5: Click Detection Test
// ============================================================================
console.log('\n%c🖱️  TEST 5: Click Detection', 'color: #ffff00; font-size: 16px; font-weight: bold');

if (window.app?.sceneManager && window.app?.solarSystemModule) {
    console.log('Testing raycasting on first planet...');
    
    const firstPlanet = Object.values(window.app.solarSystemModule.planets)[0];
    if (firstPlanet) {
        const raycaster = window.app.sceneManager.raycaster;
        const camera = window.app.sceneManager.camera;
        
        // Test from camera to planet
        const direction = new THREE.Vector3();
        direction.subVectors(firstPlanet.position, camera.position).normalize();
        raycaster.set(camera.position, direction);
        
        const intersects = raycaster.intersectObjects(window.app.solarSystemModule.objects, true);
        
        console.log(`   Objects to test: ${window.app.solarSystemModule.objects.length}`);
        console.log(`   Intersections found: ${intersects.length}`);
        
        if (intersects.length > 0) {
            console.log('   ✅ Raycasting works!');
            console.log(`   Hit: ${intersects[0].object.userData?.name || 'unnamed'}`);
        } else {
            console.warn('   ⚠️  No intersections found');
            console.log('   This could mean:');
            console.log('   - Objects are not in the selectable array');
            console.log('   - Objects are not visible');
            console.log('   - Camera is positioned oddly');
        }
    }
} else {
    console.error('❌ Cannot test click detection - missing components');
}

// ============================================================================
// TEST 6: Code Version Check
// ============================================================================
console.log('\n%c🔎 TEST 6: Code Version Check', 'color: #ffff00; font-size: 16px; font-weight: bold');
console.log('Checking for known bugs in loaded code...');

fetch('./src/main.js')
    .then(r => r.text())
    .then(code => {
        // Check for frame limiter bug
        if (code.includes('if (deltaTime >= CONFIG.PERFORMANCE.frameTime')) {
            console.error('🔴 FRAME LIMITER BUG DETECTED!');
            console.log('   The faulty frame limiter is still in the code');
            console.log('   This will prevent animation from working');
            console.log('   ACTION: Hard refresh (Ctrl+Shift+R) to reload');
        } else {
            console.log('✅ Frame limiter bug fix confirmed');
        }
        
        // Check if planets are added to scene
        if (code.includes('scene.add(planet)')) {
            console.log('✅ Planets are added to scene');
        } else {
            console.error('❌ Planet scene addition code missing!');
        }
        
        // Check if planets are added to objects array
        if (code.includes('this.objects.push(planet)')) {
            console.log('✅ Planets are added to objects array');
        } else {
            console.error('❌ Planet objects array code missing!');
        }
        
        // Check for diagnostic console.logs
        const diagnosticCount = (code.match(/console\.log\(`🎬 Animation frame/g) || []).length;
        if (diagnosticCount > 0) {
            console.log(`✅ Animation diagnostic code present (${diagnosticCount} instances)`);
        } else {
            console.warn('⚠️  Animation diagnostic code not found');
        }
    })
    .catch(err => {
        console.error('❌ Could not fetch source code:', err);
    });

// ============================================================================
// TEST 7: Browser Console Check
// ============================================================================
console.log('\n%c📋 TEST 7: Recent Console Messages', 'color: #ffff00; font-size: 16px; font-weight: bold');
console.log('Look for these messages in the console:');
console.log('  - 🎬 Animation frame 1, 2, 3, 4, 5');
console.log('  - 🚀 Space Explorer initialized');
console.log('  - 🪐 Planets loaded: X');
console.log('  - 📦 Objects in scene: X');
console.log('  - ? Planet "X" added to scene');
console.log('\nIf you don\'t see these, the init phase failed!');

// ============================================================================
// SUMMARY
// ============================================================================
setTimeout(() => {
    console.log('\n%c📊 DIAGNOSTIC SUMMARY', 'color: #00ff00; font-size: 20px; font-weight: bold');
    console.log('='.repeat(80));
    
    const checks = {
        app: !!window.app,
        sceneManager: !!window.app?.sceneManager,
        solarSystemModule: !!window.app?.solarSystemModule,
        planets: (Object.keys(window.app?.solarSystemModule?.planets || {}).length > 0),
        objects: (window.app?.solarSystemModule?.objects?.length > 0),
        renderer: !!window.app?.sceneManager?.renderer
    };
    
    const passedChecks = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;
    
    console.log(`Status: ${passedChecks}/${totalChecks} checks passed\n`);
    
    Object.entries(checks).forEach(([name, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${name}`);
    });
    
    if (passedChecks === totalChecks) {
        console.log('\n%c✅ ALL CHECKS PASSED!', 'color: #00ff00; font-size: 18px');
        console.log('If animation still doesn\'t work:');
        console.log('1. Check if you see 🎬 Animation frame messages');
        console.log('2. Try moving the time speed slider');
        console.log('3. Check if pause mode is active');
        console.log('4. Look for JavaScript errors in console');
    } else {
        console.log('\n%c❌ ISSUES DETECTED!', 'color: #ff0000; font-size: 18px');
        console.log('Fix the failed checks above');
    }
    
    console.log('\n' + '='.repeat(80));
}, 500);
