// ADD THESE FUNCTIONS TO main.js BEFORE createHyperrealisticISS()

createHyperrealisticHubble(satData) {
    if (DEBUG.enabled) console.log('🔭 Creating hyperrealistic Hubble Space Telescope');
    const hubble = new THREE.Group();
    const scale = 0.002;
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9, emissive: 0x4A3000, emissiveIntensity: 0.1 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1, metalness: 0.5 });
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x0a1a3d, roughness: 0.2, metalness: 0.9, emissive: 0x051020, emissiveIntensity: 0.15 });
    
    // Main telescope tube (13.2m long × 4.2m diameter)
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(scale * 2.1, scale * 2.1, scale * 13.2, 32), bodyMat);
    tube.rotation.z = Math.PI / 2;
    hubble.add(tube);
    
    // Forward light shield
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(scale * 2.4, scale * 2.1, scale * 3, 32), bodyMat);
    shield.rotation.z = Math.PI / 2;
    shield.position.x = scale * 8;
    hubble.add(shield);
    
    // Primary mirror aperture (dark opening)
    const aperture = new THREE.Mesh(new THREE.CylinderGeometry(scale * 1.2, scale * 1.2, scale * 0.2, 32), darkMat);
    aperture.rotation.z = Math.PI / 2;
    aperture.position.x = scale * 9.6;
    hubble.add(aperture);
    
    // Aft shroud (gold foil section)
    const aft = new THREE.Mesh(new THREE.CylinderGeometry(scale * 2.1, scale * 2.1, scale * 2, 32), goldMat);
    aft.rotation.z = Math.PI / 2;
    aft.position.x = -scale * 7;
    hubble.add(aft);
    
    // Solar panels (2 wings, each 2.5m × 7.1m)
    const createPanel = (yPos) => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.1, scale * 2.5, scale * 7.1), panelMat);
        panel.position.y = yPos;
        
        // Add frame
        const frame1 = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.15, scale * 2.6, scale * 0.1), bodyMat);
        frame1.position.z = scale * 3.5;
        panel.add(frame1);
        
        const frame2 = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.15, scale * 2.6, scale * 0.1), bodyMat);
        frame2.position.z = -scale * 3.5;
        panel.add(frame2);
        
        // Grid lines
        for (let i = -3; i <= 3; i++) {
            const line = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.12, scale * 0.02, scale * 7.1), bodyMat);
            line.position.y = scale * i * 0.4;
            panel.add(line);
        }
        
        return panel;
    };
    
    hubble.add(createPanel(scale * 5));
    hubble.add(createPanel(-scale * 5));
    
    // High-gain antenna
    const antenna = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.8, scale * 1.5, 16), bodyMat);
    antenna.rotation.x = Math.PI / 2;
    antenna.position.set(-scale * 5, 0, scale * 3);
    hubble.add(antenna);
    
    // Low-gain antennas
    for (let i = 0; i < 2; i++) {
        const smallAntenna = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.1, scale * 0.1, scale * 0.8, 8), bodyMat);
        smallAntenna.position.set(-scale * 6, i === 0 ? scale * 1.5 : -scale * 1.5, scale * 2);
        hubble.add(smallAntenna);
    }
    
    // Equipment bay
    const bay = new THREE.Mesh(new THREE.BoxGeometry(scale * 1.5, scale * 1.5, scale * 2), goldMat);
    bay.position.set(-scale * 4, 0, -scale * 2.5);
    hubble.add(bay);
    
    // Radiators
    const radiatorGeom = new THREE.BoxGeometry(scale * 0.1, scale * 0.8, scale * 2);
    for (let i = 0; i < 3; i++) {
        const radiator = new THREE.Mesh(radiatorGeom, bodyMat);
        radiator.position.set(-scale * 2 + i * scale * 2, 0, scale * 2.8);
        hubble.add(radiator);
    }
    
    return hubble;
}

createHyperrealisticJWST(satData) {
    if (DEBUG.enabled) console.log('🔭 Creating hyperrealistic James Webb Space Telescope');
    const jwst = new THREE.Group();
    const scale = 0.003;
    
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.1, metalness: 1.0, emissive: 0xFFAA00, emissiveIntensity: 0.2 });
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.2, metalness: 0.5, side: THREE.DoubleSide });
    const structMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.8 });
    
    // Create hexagon mirror segments (18 total in honeycomb pattern)
    const hexRadius = scale * 0.66;
    const createHex = () => {
        const shape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = hexRadius * Math.cos(angle);
            const y = hexRadius * Math.sin(angle);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: scale * 0.1, bevelEnabled: false });
    };
    
    const hexGeom = createHex();
    
    // 18 hexagonal mirror positions
    const mirrorPos = [
        [0, 0], // Center
        [1.5, 0], [-0.75, 1.3], [-0.75, -1.3], [-1.5, 0], [0.75, 1.3], [0.75, -1.3], // Inner ring
        [3, 0], [2.25, 1.3], [0.75, 2.6], [-0.75, 2.6], [-2.25, 1.3], // Outer ring part 1
        [-3, 0], [-2.25, -1.3], [-0.75, -2.6], [0.75, -2.6], [2.25, -1.3], [1.5, 2.6] // Outer ring part 2
    ];
    
    mirrorPos.forEach(pos => {
        const hex = new THREE.Mesh(hexGeom, goldMat);
        hex.position.set(scale * pos[0], scale * pos[1], scale * 3);
        hex.rotation.x = Math.PI / 2;
        jwst.add(hex);
    });
    
    // Secondary mirror
    const secMirror = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.35, scale * 0.35, scale * 0.1, 32), goldMat);
    secMirror.position.z = scale * 7;
    jwst.add(secMirror);
    
    // Tripod support struts
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i;
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.05, scale * 0.05, scale * 4, 8), structMat);
        strut.position.x = Math.cos(angle) * scale * 2;
        strut.position.y = Math.sin(angle) * scale * 2;
        strut.position.z = scale * 5;
        strut.rotation.x = Math.atan2(1, 4);
        jwst.add(strut);
    }
    
    // Spacecraft bus
    const bus = new THREE.Mesh(new THREE.BoxGeometry(scale * 2, scale * 2, scale * 1.5), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 }));
    bus.position.z = scale * 1.5;
    jwst.add(bus);
    
    // Sunshield (5 layers, 21.2m × 14.2m)
    for (let layer = 0; layer < 5; layer++) {
        const shieldLayer = new THREE.Mesh(new THREE.PlaneGeometry(scale * 21.2, scale * 14.2), shieldMat.clone());
        shieldLayer.material.color.setHex(0xE8E8E8 - layer * 0x0a0a0a);
        shieldLayer.position.z = -scale * (0.5 + layer * 0.3);
        jwst.add(shieldLayer);
    }
    
    // Sunshield support beams
    for (let i = -1; i <= 1; i++) {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.08, scale * 0.08, scale * 14.2, 8), structMat);
        beam.position.set(scale * i * 10, 0, -scale * 1);
        beam.rotation.x = Math.PI / 2;
        jwst.add(beam);
    }
    
    // Solar panel
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x0a1a3d, roughness: 0.2, metalness: 0.9, emissive: 0x051020, emissiveIntensity: 0.15 });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(scale * 2.5, scale * 0.05, scale * 6), solarMat);
    panel.position.set(scale * 3, 0, -scale * 1);
    panel.rotation.y = Math.PI / 2;
    jwst.add(panel);
    
    // High-gain antenna
    const antenna = new THREE.Mesh(new THREE.ConeGeometry(scale * 1, scale * 0.5, 32), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.9 }));
    antenna.position.z = -scale * 2;
    antenna.rotation.x = Math.PI;
    jwst.add(antenna);
    
    return jwst;
}
