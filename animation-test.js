// EMERGENCY ANIMATION FIX TEST
// Add this to browser console to diagnose animation issues

console.log('🔍 ANIMATION DIAGNOSTIC TEST');
console.log('============================\n');

// Test 1: Check if app exists
if (window.app) {
    console.log('✅ window.app exists');
    
    // Test 2: Check animation loop
    if (window.app.sceneManager) {
        console.log('✅ sceneManager exists');
        console.log(`   Animation loop active: ${window.app.sceneManager.renderer ? 'YES' : 'NO'}`);
    } else {
        console.log('❌ sceneManager is undefined!');
    }
    
    // Test 3: Check solar system module
    if (window.app.solarSystemModule) {
        console.log('✅ solarSystemModule exists');
        const planetsCount = Object.keys(window.app.solarSystemModule.planets).length;
        console.log(`   Planets loaded: ${planetsCount}`);
        console.log(`   Objects in scene: ${window.app.solarSystemModule.objects.length}`);
        
        // List planets
        if (planetsCount > 0) {
            console.log('\n🪐 Loaded Planets:');
            Object.entries(window.app.solarSystemModule.planets).forEach(([name, planet]) => {
                if (planet && planet.userData) {
                    console.log(`   - ${name}: distance=${planet.userData.distance}, angle=${planet.userData.angle.toFixed(2)}, speed=${planet.userData.speed}`);
                    console.log(`     Position: (${planet.position.x.toFixed(1)}, ${planet.position.y.toFixed(1)}, ${planet.position.z.toFixed(1)})`);
                }
            });
        }
        
        // Test update method
        console.log('\n🎬 Testing update method...');
        const testDeltaTime = 0.016;
        const testTimeSpeed = 1.0;
        
        try {
            // Store initial positions
            const initialPositions = {};
            Object.entries(window.app.solarSystemModule.planets).forEach(([name, planet]) => {
                if (planet) {
                    initialPositions[name] = {
                        x: planet.position.x,
                        z: planet.position.z,
                        angle: planet.userData.angle
                    };
                }
            });
            
            // Call update manually
            window.app.solarSystemModule.update(
                testDeltaTime, 
                testTimeSpeed,
                window.app.sceneManager.camera,
                window.app.sceneManager.controls
            );
            
            // Check if positions changed
            console.log('\n📊 Position Changes After Manual Update:');
            let changesDetected = false;
            Object.entries(window.app.solarSystemModule.planets).forEach(([name, planet]) => {
                if (planet && initialPositions[name]) {
                    const oldPos = initialPositions[name];
                    const deltaX = Math.abs(planet.position.x - oldPos.x);
                    const deltaZ = Math.abs(planet.position.z - oldPos.z);
                    const deltaAngle = Math.abs(planet.userData.angle - oldPos.angle);
                    
                    if (deltaX > 0.0001 || deltaZ > 0.0001 || deltaAngle > 0.0001) {
                        console.log(`   ✅ ${name} MOVED!`);
                        console.log(`      Position change: Δx=${deltaX.toFixed(4)}, Δz=${deltaZ.toFixed(4)}`);
                        console.log(`      Angle change: Δθ=${deltaAngle.toFixed(4)}`);
                        changesDetected = true;
                    } else {
                        console.log(`   ⚠️  ${name} did NOT move`);
                    }
                }
            });
            
            if (!changesDetected) {
                console.log('\n❌ NO MOVEMENT DETECTED!');
                console.log('   Possible causes:');
                console.log('   1. timeSpeed = 0 (check pause mode)');
                console.log('   2. Planet speeds are 0');
                console.log('   3. Update logic is broken');
            } else {
                console.log('\n✅ MOVEMENT CONFIRMED! Update method works.');
            }
            
        } catch (error) {
            console.log(`❌ Error calling update: ${error.message}`);
            console.error(error);
        }
        
    } else {
        console.log('❌ solarSystemModule is undefined!');
    }
    
    // Test 4: Check pause mode
    if (window.app.sceneManager && window.app.sceneManager.pauseMode) {
        console.log(`\n⏸️  Pause Mode: ${window.app.sceneManager.pauseMode}`);
        if (window.app.sceneManager.pauseMode !== 'none') {
            console.log('   ⚠️  Animation is PAUSED!');
        }
    }
    
    // Test 5: Check timeSpeed
    console.log(`\n⏱️  Time Speed: ${window.app.timeSpeed}`);
    if (window.app.timeSpeed === 0) {
        console.log('   ❌ timeSpeed is 0 - animation is FROZEN!');
    }
    
} else {
    console.log('❌ window.app is undefined!');
    console.log('   App has not initialized yet, or initialization failed.');
}

console.log('\n============================');
console.log('🎯 Diagnostic complete!');
console.log('\nIf planets exist but don\'t move:');
console.log('1. Check if timeSpeed > 0');
console.log('2. Check if pauseMode is "none"');
console.log('3. Check if update() is being called in animation loop');
console.log('4. Press F12 and look for 🎬 messages in console');
