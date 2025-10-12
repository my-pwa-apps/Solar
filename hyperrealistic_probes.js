
    createHyperrealisticPioneer(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic Pioneer probe');
        const pioneer = new THREE.Group();
        const scale = 0.002;
        
        // Materials
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
        
        // Main hexagonal bus (2.9m diameter)
        const busGeom = new THREE.CylinderGeometry(scale * 1.45, scale * 1.45, scale * 0.3, 6);
        const bus = new THREE.Mesh(busGeom, goldMat);
        bus.rotation.x = Math.PI / 2;
        pioneer.add(bus);
        
        // RTG power source (elongated)
        const rtg = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.2, scale * 0.2, scale * 1.5, 16), darkMat);
        rtg.position.set(0, -scale * 1, 0);
        pioneer.add(rtg);
        
        // 2.74m high-gain antenna dish
        const dish = new THREE.Mesh(new THREE.ConeGeometry(scale * 1.37, scale * 0.4, 32), silverMat);
        dish.position.z = scale * 0.5;
        pioneer.add(dish);
        
        // Medium-gain antenna
        const medAntenna = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.3, scale * 0.3, 16), silverMat);
        medAntenna.position.set(scale * 0.8, 0, scale * 0.3);
        pioneer.add(medAntenna);
        
        // Magnetometer boom (extended 6.6m)
        const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.02, scale * 0.02, scale * 6.6, 8), silverMat);
        magBoom.position.x = -scale * 3.3;
        magBoom.rotation.z = Math.PI / 2;
        pioneer.add(magBoom);
        
        // Magnetometer sensor at end
        const magSensor = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.1, 16, 16), darkMat);
        magSensor.position.x = -scale * 6.6;
        pioneer.add(magSensor);
        
        // Instruments (imaging photopolarimeter, etc)
        const instruments = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.4, scale * 0.4, scale * 0.3), darkMat);
        instruments.position.set(scale * 0.5, scale * 0.5, 0);
        pioneer.add(instruments);
        
        // Thruster module
        const thrusters = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.1, scale * 0.1, scale * 0.2, 8), silverMat);
        thrusters.position.set(0, scale * 1.2, -scale * 0.1);
        pioneer.add(thrusters);
        
        return pioneer;
    }

    createHyperrealisticVoyager(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic Voyager probe');
        const voyager = new THREE.Group();
        const scale = 0.0015;
        
        // Materials
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.9 });
        
        // 10-sided main bus (1.8m diameter)
        const busGeom = new THREE.CylinderGeometry(scale * 0.9, scale * 0.9, scale * 0.5, 10);
        const bus = new THREE.Mesh(busGeom, goldMat);
        bus.rotation.x = Math.PI / 2;
        voyager.add(bus);
        
        // 3.7m high-gain antenna (famous white dish)
        const dish = new THREE.Mesh(new THREE.ConeGeometry(scale * 1.85, scale * 0.5, 32), whiteMat);
        dish.position.z = scale * 0.6;
        voyager.add(dish);
        
        // Feed horn in center of dish
        const feedHorn = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.1, scale * 0.3, 16), darkMat);
        feedHorn.position.z = scale * 0.9;
        voyager.add(feedHorn);
        
        // Science boom (13m extended to the side)
        const scienceBoom = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.03, scale * 0.03, scale * 13, 8), silverMat);
        scienceBoom.position.x = scale * 6.5;
        scienceBoom.rotation.z = Math.PI / 2;
        voyager.add(scienceBoom);
        
        // Cameras and instruments at end of science boom
        const cameras = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.4, scale * 0.4, scale * 0.5), darkMat);
        cameras.position.x = scale * 13;
        voyager.add(cameras);
        
        // Magnetometer boom (opposite direction, 13m)
        const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.02, scale * 0.02, scale * 13, 8), silverMat);
        magBoom.position.x = -scale * 6.5;
        magBoom.rotation.z = Math.PI / 2;
        voyager.add(magBoom);
        
        // Magnetometer sensors
        for (let i = 0; i < 2; i++) {
            const magSensor = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.08, 16, 16), darkMat);
            magSensor.position.x = -scale * (10 + i * 3);
            voyager.add(magSensor);
        }
        
        // RTG power source (3 RTGs on boom below)
        const rtgBoom = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.04, scale * 0.04, scale * 4, 8), silverMat);
        rtgBoom.position.set(0, -scale * 2, 0);
        voyager.add(rtgBoom);
        
        // 3 RTG units
        for (let i = 0; i < 3; i++) {
            const rtg = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.2, scale * 0.2, scale * 0.5, 16), darkMat);
            rtg.position.set(scale * (i - 1) * 0.8, -scale * 4, 0);
            rtg.rotation.z = Math.PI / 2;
            voyager.add(rtg);
        }
        
        // Golden Record (iconic!)
        const record = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.15, scale * 0.15, scale * 0.02, 32), goldMat);
        record.position.set(-scale * 0.5, 0, scale * 0.3);
        record.rotation.x = Math.PI / 2;
        voyager.add(record);
        
        return voyager;
    }

    createHyperrealisticCassini(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic Cassini spacecraft');
        const cassini = new THREE.Group();
        const scale = 0.0012;
        
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

    createHyperrealisticJuno(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic Juno spacecraft');
        const juno = new THREE.Group();
        const scale = 0.0015;
        
        // Materials
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 });
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x0a1a3d, roughness: 0.2, metalness: 0.9, emissive: 0x051020, emissiveIntensity: 0.15 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
        
        // Hexagonal main body (3.5m diameter)
        const busGeom = new THREE.CylinderGeometry(scale * 1.75, scale * 1.75, scale * 1, 6);
        const bus = new THREE.Mesh(busGeom, goldMat);
        bus.rotation.x = Math.PI / 2;
        juno.add(bus);
        
        // Three massive 9m x 2.7m solar panels (iconic!)
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const panelGroup = new THREE.Group();
            
            // Solar panel
            const panel = new THREE.Mesh(new THREE.BoxGeometry(scale * 9, scale * 0.05, scale * 2.7), panelMat);
            panel.position.x = scale * 4.5;
            panelGroup.add(panel);
            
            // Panel frame
            const frame1 = new THREE.Mesh(new THREE.BoxGeometry(scale * 9, scale * 0.1, scale * 0.05), goldMat);
            frame1.position.set(scale * 4.5, 0, scale * 1.35);
            panelGroup.add(frame1);
            
            const frame2 = new THREE.Mesh(new THREE.BoxGeometry(scale * 9, scale * 0.1, scale * 0.05), goldMat);
            frame2.position.set(scale * 4.5, 0, -scale * 1.35);
            panelGroup.add(frame2);
            
            // Grid lines on panels
            for (let j = 0; j <= 8; j++) {
                const line = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.02, scale * 0.08, scale * 2.7), goldMat);
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
        const antenna = new THREE.Mesh(new THREE.ConeGeometry(scale * 1.25, scale * 0.4, 32), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.9 }));
        antenna.position.z = scale * 0.8;
        juno.add(antenna);
        
        // JunoCam (visible on side)
        const camera = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.2, scale * 0.2, scale * 0.15), darkMat);
        camera.position.set(scale * 1.5, 0, scale * 0.3);
        juno.add(camera);
        
        // Magnetometer boom (extends from one panel)
        const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.03, scale * 0.03, scale * 3, 8), goldMat);
        magBoom.position.set(scale * 8, scale * 1.75, 0);
        magBoom.rotation.z = Math.PI / 2;
        juno.add(magBoom);
        
        // Magnetometer sensor
        const magSensor = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.15, scale * 0.15, scale * 0.15), darkMat);
        magSensor.position.set(scale * 9.5, scale * 1.75, 0);
        juno.add(magSensor);
        
        // Microwave radiometer antennas (6 visible)
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const mwr = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.15, scale * 0.15, scale * 0.2), darkMat);
            mwr.position.set(
                Math.cos(angle) * scale * 1.6,
                Math.sin(angle) * scale * 1.6,
                -scale * 0.3
            );
            juno.add(mwr);
        }
        
        return juno;
    }

    createHyperrealisticNewHorizons(satData) {
        if (DEBUG.enabled) console.log(' Creating hyperrealistic New Horizons probe');
        const newHorizons = new THREE.Group();
        const scale = 0.002;
        
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
