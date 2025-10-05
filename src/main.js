// Scientific VR/AR Explorer - Optimized No-Build Version
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

// ===========================
// CONSTANTS & CONFIG
// ===========================
const CONFIG = {
    RENDERER: {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        maxPixelRatio: 2,
        logarithmicDepthBuffer: true // Better depth precision for large scenes
    },
    CAMERA: {
        fov: 75,
        near: 0.1,
        far: 50000,
        startPos: { x: 0, y: 50, z: 100 }
    },
    CONTROLS: {
        dampingFactor: 0.05,
        minDistance: 5,
        maxDistance: 10000,
        enablePan: true,
        zoomSpeed: 1.2
    },
    PERFORMANCE: {
        targetFPS: 60,
        frameTime: 1000 / 60,
        maxDeltaTime: 0.1 // Prevent huge jumps
    },
    QUALITY: {
        sphereSegments: 128, // Increased for better normal/bump map detail
        lowPowerSegments: 32,
        particleSize: 2
    }
};

// ===========================
// SCENE MANAGER
// ===========================
class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.CAMERA.near,
            CONFIG.CAMERA.far
        );
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.lights = {};
        this.resizeTimeout = null;
        
        // Track previous button states for VR controllers to detect press (not hold)
        this.previousButtonStates = [
            {}, // Controller 0
            {}  // Controller 1
        ];
        
        this.init();
    }

    init() {
        try {
            this.setupRenderer();
            this.setupCamera();
            this.setupControls();
            this.setupLighting();
            this.setupXR();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing scene:', error);
            this.showError('Failed to initialize 3D scene. Please refresh the page.');
        }
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer(CONFIG.RENDERER);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.RENDERER.maxPixelRatio));
        this.renderer.xr.enabled = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Performance optimizations
        this.renderer.sortObjects = false; // Skip sorting for better performance
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            throw new Error('Canvas container not found');
        }
    }

    setupCamera() {
        const { x, y, z } = CONFIG.CAMERA.startPos;
        this.camera.position.set(x, y, z);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = CONFIG.CONTROLS.dampingFactor;
        this.controls.minDistance = CONFIG.CONTROLS.minDistance;
        this.controls.maxDistance = CONFIG.CONTROLS.maxDistance;
        this.controls.enablePan = CONFIG.CONTROLS.enablePan;
        this.controls.zoomSpeed = CONFIG.CONTROLS.zoomSpeed;
        this.controls.rotateSpeed = 0.5;
        this.controls.update();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.onResize(), 150);
        }, { passive: true });
    }

    setupLighting() {
        // Increased ambient light for better planet visibility
        this.lights.ambient = new THREE.AmbientLight(0x505050, 1.2);
        this.scene.add(this.lights.ambient);

        // Hemisphere light for realistic space lighting
        this.lights.hemisphere = new THREE.HemisphereLight(0xffffee, 0x222222, 0.6);
        this.scene.add(this.lights.hemisphere);

        // Camera light for viewing objects on dark side - INCREASED for better visibility
        this.lights.camera = new THREE.PointLight(0xffffff, 1.5, 1000); // Increased from 0.8 to 1.5
        this.camera.add(this.lights.camera);
        this.scene.add(this.camera);
        console.log('💡 Camera light increased to 1.5 intensity for better Earth visibility');
    }

    setupXR() {
        try {
            // Create a dolly (rig) for VR movement
            this.dolly = new THREE.Group();
            this.dolly.position.set(0, 0, 0);
            this.scene.add(this.dolly);
            this.dolly.add(this.camera);
            
            // Initialize XR controllers
            this.controllers = [];
            this.controllerGrips = [];
            
            // Setup two controllers
            for (let i = 0; i < 2; i++) {
                // Controller for pointing/selecting
                const controller = this.renderer.xr.getController(i);
                controller.addEventListener('selectstart', () => this.onSelectStart(controller, i));
                controller.addEventListener('selectend', () => this.onSelectEnd(controller, i));
                controller.addEventListener('squeezestart', () => this.onSqueezeStart(controller, i));
                controller.userData.index = i;
                this.dolly.add(controller);
                this.controllers.push(controller);
                
                // Controller grip for models
                const controllerGrip = this.renderer.xr.getControllerGrip(i);
                
                // Add a SUPER VISIBLE laser beam - using cylinder for thickness
                const laserGeometry = new THREE.CylinderGeometry(0.005, 0.005, 10, 8);
                const laserMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    transparent: false,
                    opacity: 1.0,
                    emissive: 0x00ffff,
                    emissiveIntensity: 1.0
                });
                
                const laser = new THREE.Mesh(laserGeometry, laserMaterial);
                laser.rotation.x = Math.PI / 2; // Rotate to point forward
                laser.position.set(0, 0, -5); // Position at center of 10m length
                laser.name = 'laser';
                controller.add(laser);
                
                // Add a BRIGHT glowing sphere at the end
                const pointerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
                const pointerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    emissive: 0x00ffff,
                    emissiveIntensity: 2.0
                });
                const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
                pointer.position.set(0, 0, -10);
                pointer.name = 'pointer';
                controller.add(pointer);
                
                // Add outer glow to pointer
                const glowGeometry = new THREE.SphereGeometry(0.08, 16, 16);
                const glowMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.3,
                    blending: THREE.AdditiveBlending
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                pointer.add(glow);
                
                // Add a cone at controller tip for direction indicator
                const coneGeometry = new THREE.ConeGeometry(0.02, 0.4, 8);
                const coneMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    emissive: 0x00ffff,
                    emissiveIntensity: 1.0
                });
                const cone = new THREE.Mesh(coneGeometry, coneMaterial);
                cone.rotation.x = Math.PI / 2; // Point forward
                cone.position.set(0, 0, -0.2);
                cone.name = 'cone';
                controller.add(cone);
                
                this.dolly.add(controllerGrip);
                this.controllerGrips.push(controllerGrip);
            }
            
            // Setup VR UI Panel
            this.setupVRUI();
            
            // VR Button
            const vrButton = VRButton.createButton(this.renderer);
            const vrContainer = document.getElementById('vr-button');
            if (vrContainer) {
                vrContainer.appendChild(vrButton);
                vrContainer.classList.remove('hidden');
            }

            // AR Button
            const arButton = ARButton.createButton(this.renderer, {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
                domOverlay: { root: document.body }
            });
            const arContainer = document.getElementById('ar-button');
            if (arContainer) {
                arContainer.appendChild(arButton);
                arContainer.classList.remove('hidden');
            }

            // Handle XR session start
            this.renderer.xr.addEventListener('sessionstart', () => {
                const session = this.renderer.xr.getSession();
                if (session.environmentBlendMode === 'additive' || 
                    session.environmentBlendMode === 'alpha-blend') {
                    this.scene.background = null; // Transparent for AR
                }
                // DON'T show VR UI panel automatically - let user toggle with grip
                if (this.vrUIPanel) this.vrUIPanel.visible = false;
                console.log('✅ XR session started - Press GRIP buttons to show/hide menu');
                console.log('🎮 Left stick = Move | Right stick = Rotate | Trigger = Select');
            });

            // Handle XR session end
            this.renderer.xr.addEventListener('sessionend', () => {
                this.scene.background = new THREE.Color(0x000000);
                // Hide VR UI panel
                if (this.vrUIPanel) this.vrUIPanel.visible = false;
                console.log('XR session ended');
            });
        } catch (error) {
            console.warn('WebXR not supported:', error);
        }
    }
    
    setupVRUI() {
        // Create a floating VR control panel
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 768;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
        ctx.fillRect(0, 0, 1024, 768);
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🌌 Space Explorer VR', 512, 80);
        
        // Subtitle
        ctx.fillStyle = '#fff';
        ctx.font = '28px Arial';
        ctx.fillText('Use Triggers to Select Buttons', 512, 120);
        
        // Initialize pause mode state
        this.pauseMode = 'none'; // 'none', 'orbital', 'all'
        
        // Define buttons
        this.vrButtons = [
            // Row 1: Time controls
            { x: 50, y: 160, w: 160, h: 80, label: '⏸️ All', action: 'pauseall', color: '#e74c3c' },
            { x: 220, y: 160, w: 160, h: 80, label: '🌍 Orbit', action: 'pauseorbit', color: '#e67e22' },
            { x: 390, y: 160, w: 160, h: 80, label: '▶️ Play', action: 'play', color: '#2ecc71' },
            { x: 560, y: 160, w: 110, h: 80, label: '<<', action: 'speed--', color: '#9b59b6' },
            { x: 680, y: 160, w: 110, h: 80, label: '>>', action: 'speed++', color: '#3498db' },
            { x: 800, y: 160, w: 140, h: 80, label: '1x', action: 'speedreset', color: '#16a085' },
            
            // Row 2: View controls
            { x: 50, y: 260, w: 160, h: 80, label: '🔆+', action: 'brightup', color: '#f39c12' },
            { x: 220, y: 260, w: 160, h: 80, label: '🔅-', action: 'brightdown', color: '#e67e22' },
            { x: 390, y: 260, w: 160, h: 80, label: '☄️ Tails', action: 'tails', color: '#1abc9c' },
            { x: 560, y: 260, w: 190, h: 80, label: '� Scale', action: 'scale', color: '#8e44ad' },
            { x: 760, y: 260, w: 180, h: 80, label: '� Reset', action: 'reset', color: '#34495e' },
            
            // Row 3: Navigation
            { x: 50, y: 360, w: 290, h: 80, label: '🌍 Focus Earth', action: 'earth', color: '#16a085' },
            { x: 350, y: 360, w: 290, h: 80, label: '🪐 Solar System', action: 'solar', color: '#2980b9' },
            { x: 650, y: 360, w: 290, h: 80, label: '⚛️ Quantum', action: 'quantum', color: '#c0392b' },
            
            // Row 4: Help
            { x: 312, y: 460, w: 400, h: 70, label: '❌ Close Menu', action: 'hide', color: '#7f8c8d' }
        ];
        
        // Draw buttons
        this.vrButtons.forEach(btn => {
            // Button shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(btn.x + 5, btn.y + 5, btn.w, btn.h);
            
            // Button background
            ctx.fillStyle = btn.color;
            ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
            
            // Button border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
            
            // Button text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 12);
        });
        
        // Time Speed Slider
        const sliderY = 560;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('⏱️ Time Speed:', 50, sliderY);
        
        // Slider track
        const sliderX = 280;
        const sliderW = 660;
        const sliderH = 20;
        ctx.fillStyle = '#34495e';
        ctx.fillRect(sliderX, sliderY - 15, sliderW, sliderH);
        
        // Slider markers (0, 1x, 5x, 10x)
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('0', sliderX, sliderY + 45);
        ctx.fillText('1x', sliderX + sliderW * 0.1, sliderY + 45);
        ctx.fillText('5x', sliderX + sliderW * 0.5, sliderY + 45);
        ctx.fillText('10x', sliderX + sliderW, sliderY + 45);
        
        // Slider handle (will update dynamically)
        const speed = 1; // Default
        const handleX = sliderX + (sliderW * (speed / 10));
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(handleX, sliderY - 5, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Store slider info for interaction
        this.vrSlider = {
            x: sliderX,
            y: sliderY - 15,
            w: sliderW,
            h: sliderH,
            min: 0,
            max: 10
        };
        
        // Status bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 640, 1024, 128);
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mode: ▶️ Playing | Speed: 1x | Brightness: 50%', 512, 685);
        ctx.fillStyle = '#fff';
        ctx.font = '22px Arial';
        ctx.fillText('⏸️ All = Pause Everything | 🌍 Orbit = Pause Solar Orbits Only', 512, 720);
        ctx.fillText('Use Laser to Click Buttons or Drag Slider', 512, 750);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create plane
        const geometry = new THREE.PlaneGeometry(3, 2.25);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.vrUIPanel = new THREE.Mesh(geometry, material);
        this.vrUIPanel.position.set(0, 1.6, -2.5);
        this.vrUIPanel.visible = false;
        this.dolly.add(this.vrUIPanel);
        
        // Store canvas for updates
        this.vrUICanvas = canvas;
        this.vrUIContext = ctx;
        
        console.log('✅ VR UI Panel created with', this.vrButtons.length, 'buttons');
    }
    
    onSelectStart(controller, index) {
        // Handle controller trigger press
        console.log(`🎯 Controller ${index} trigger pressed`);
        controller.userData.selecting = true;
        
        // Check if grip button is also held for zoom
        const session = this.renderer.xr.getSession();
        let gripHeld = false;
        if (session) {
            const inputSources = session.inputSources;
            for (let i = 0; i < inputSources.length; i++) {
                const gamepad = inputSources[i].gamepad;
                if (gamepad && gamepad.buttons[1] && gamepad.buttons[1].pressed) {
                    gripHeld = true;
                    break;
                }
            }
        }
        
        // Setup raycaster for pointing
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        
        // First, check for VR UI interaction
        if (this.vrUIPanel && this.vrUIPanel.visible) {
            console.log('🎨 VR UI Panel is visible - checking for button clicks');
            const intersects = raycaster.intersectObject(this.vrUIPanel);
            
            if (intersects.length > 0) {
                const uv = intersects[0].uv;
                const x = uv.x * 1024;
                const y = (1 - uv.y) * 768;
                console.log(`📍 VR UI clicked at UV (${uv.x.toFixed(3)}, ${uv.y.toFixed(3)}) = pixel (${x.toFixed(0)}, ${y.toFixed(0)})`);
                
                // Check which button was clicked
                let buttonFound = false;
                this.vrButtons.forEach(btn => {
                    if (x >= btn.x && x <= btn.x + btn.w && 
                        y >= btn.y && y <= btn.y + btn.h) {
                        console.log(`✅ VR Button clicked: "${btn.label}" action="${btn.action}"`);
                        this.handleVRAction(btn.action);
                        this.flashVRButton(btn);
                        buttonFound = true;
                    }
                });
                if (!buttonFound) {
                    console.log('⚠️ Click was on UI panel but not on any button');
                }
                return; // Don't check for object selection if we clicked UI
            } else {
                console.log('❌ VR UI Panel visible but raycast missed it');
            }
        } else {
            console.log(`ℹ️ VR UI Panel: exists=${!!this.vrUIPanel}, visible=${this.vrUIPanel?.visible}`);
        }
        
        // If UI wasn't clicked, check for object selection (planets, moons, etc.)
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            console.log('🎯 VR Selected object:', hitObject.name || hitObject.type);
            
            // Try to focus on the selected object
            const app = window.app || this;
            if (app.topicManager && app.topicManager.currentModule) {
                const module = app.topicManager.currentModule;
                
                // Check if it's a planet or celestial body
                if (hitObject.name && module.focusOnObject) {
                    // If grip+trigger held, zoom VERY close for inspection
                    if (gripHeld) {
                        this.zoomToObject(hitObject, 'close');
                        console.log('🔍 ZOOMING CLOSE to:', hitObject.name);
                        if (this.vrUIPanel) {
                            this.updateVRStatus(`🔍 Inspecting: ${hitObject.name}`);
                        }
                    } else {
                        // Normal focus
                        module.focusOnObject(hitObject, this.camera, this.controls);
                        console.log('✅ Focused on:', hitObject.name);
                        if (this.vrUIPanel) {
                            this.updateVRStatus(`🎯 Selected: ${hitObject.name}`);
                        }
                    }
                }
            }
        } else {
            console.log('❌ No object hit by raycast');
        }
    }
    
    onSelectEnd(controller, index) {
        // Handle controller trigger release
        controller.userData.selecting = false;
    }
    
    onSqueezeStart(controller, index) {
        // Toggle VR UI with grip button (when not holding trigger)
        const session = this.renderer.xr.getSession();
        let triggerHeld = false;
        if (session) {
            const inputSources = session.inputSources;
            for (let i = 0; i < inputSources.length; i++) {
                const gamepad = inputSources[i].gamepad;
                if (gamepad && gamepad.buttons[0] && gamepad.buttons[0].pressed) {
                    triggerHeld = true;
                    break;
                }
            }
        }
        
        // Only toggle menu if trigger not held (grip alone = menu, grip+trigger = zoom)
        if (!triggerHeld && this.vrUIPanel) {
            this.vrUIPanel.visible = !this.vrUIPanel.visible;
            console.log(`🎨 VR Menu toggled - now ${this.vrUIPanel.visible ? 'VISIBLE' : 'HIDDEN'}`);
            console.log(`📍 Menu position:`, this.vrUIPanel.position);
            console.log(`📐 Menu parent:`, this.vrUIPanel.parent?.constructor.name);
        } else if (triggerHeld) {
            console.log('⚠️ Grip pressed but trigger also held - no menu toggle');
        } else if (!this.vrUIPanel) {
            console.log('❌ Grip pressed but vrUIPanel does not exist!');
        }
    }
    
    zoomToObject(object, zoomLevel = 'normal') {
        // VR zoom function - moves dolly close to object
        if (!this.dolly || !object) return;
        
        const targetPosition = new THREE.Vector3();
        object.getWorldPosition(targetPosition);
        
        // Calculate distance based on object size and zoom level
        let objectRadius = 1;
        if (object.userData && object.userData.radius) {
            objectRadius = object.userData.radius;
        } else if (object.geometry && object.geometry.boundingSphere) {
            object.geometry.computeBoundingSphere();
            objectRadius = object.geometry.boundingSphere.radius;
        }
        
        // Distance multipliers
        let distanceMultiplier;
        switch(zoomLevel) {
            case 'close':
                distanceMultiplier = 2.5; // Very close for inspection
                break;
            case 'medium':
                distanceMultiplier = 5;
                break;
            case 'far':
            default:
                distanceMultiplier = 10;
                break;
        }
        
        const distance = objectRadius * distanceMultiplier;
        
        // Get camera direction
        const xrCamera = this.renderer.xr.getCamera();
        const cameraDirection = new THREE.Vector3();
        xrCamera.getWorldDirection(cameraDirection);
        
        // Move dolly to position behind object (from camera perspective)
        const newPosition = targetPosition.clone().sub(
            cameraDirection.multiplyScalar(distance)
        );
        
        // Smoothly move dolly
        this.dolly.position.copy(newPosition);
        
        console.log(`📍 VR Zoomed to ${object.userData?.name || 'object'} at distance ${distance.toFixed(2)}`);
    }
    
    handleVRAction(action) {
        console.log(`🎬 handleVRAction called with action="${action}"`);
        
        // Get current app state
        const app = window.app || this;
        
        switch(action) {
            case 'pauseall':
                // Pause everything
                this.pauseMode = 'all';
                if (app.topicManager) {
                    app.topicManager.timeSpeed = 0;
                }
                this.updateVRStatus('⏸️ PAUSED - Everything Stopped');
                this.updateVRUI();
                break;
            case 'pauseorbit':
                // Pause solar orbits, but keep rotations and moon orbits
                this.pauseMode = 'orbital';
                if (app.topicManager && app.topicManager.timeSpeed === 0) {
                    app.topicManager.timeSpeed = 1; // Resume if paused
                }
                this.updateVRStatus('🌍 ORBITAL PAUSE - Planets Frozen, Still Rotating');
                this.updateVRUI();
                break;
            case 'play':
                // Play everything
                this.pauseMode = 'none';
                if (app.topicManager) {
                    app.topicManager.timeSpeed = app.topicManager.timeSpeed || 1;
                }
                this.updateVRStatus('▶️ PLAYING - All Motion Active');
                this.updateVRUI();
                break;
            case 'speed++':
                if (app.topicManager) {
                    app.topicManager.timeSpeed = Math.min(app.topicManager.timeSpeed + 1, 10);
                    this.updateVRStatus(`⏩ Speed: ${app.topicManager.timeSpeed}x`);
                    this.updateVRUI();
                }
                break;
            case 'speed--':
                if (app.topicManager) {
                    app.topicManager.timeSpeed = Math.max(app.topicManager.timeSpeed - 1, 0);
                    if (app.topicManager.timeSpeed === 0) {
                        this.pauseMode = 'all';
                    }
                    this.updateVRStatus(`⏪ Speed: ${app.topicManager.timeSpeed}x`);
                    this.updateVRUI();
                }
                break;
            case 'speedreset':
                if (app.topicManager) {
                    app.topicManager.timeSpeed = 1;
                    this.updateVRStatus('⏱️ Speed Reset to 1x');
                    this.updateVRUI();
                }
                break;
            case 'brightup':
                app.topicManager.brightness = Math.min((app.topicManager.brightness || 50) + 10, 100);
                this.updateBrightness(app.topicManager.brightness / 100);
                this.updateVRStatus(`🔆 Brightness: ${app.topicManager.brightness}%`);
                break;
            case 'brightdown':
                app.topicManager.brightness = Math.max((app.topicManager.brightness || 50) - 10, 0);
                this.updateBrightness(app.topicManager.brightness / 100);
                this.updateVRStatus(`🔅 Brightness: ${app.topicManager.brightness}%`);
                break;
            case 'tails':
                if (app.topicManager && app.topicManager.solarSystemModule) {
                    const module = app.topicManager.solarSystemModule;
                    module.cometTailsVisible = !module.cometTailsVisible;
                    this.updateVRStatus(`☄️ Tails ${module.cometTailsVisible ? 'ON' : 'OFF'}`);
                }
                break;
            case 'scale':
                if (app.topicManager && app.topicManager.solarSystemModule) {
                    const module = app.topicManager.solarSystemModule;
                    module.realisticScale = !module.realisticScale;
                    module.updateScale();
                    this.updateVRStatus(`📏 ${module.realisticScale ? 'Realistic' : 'Educational'} Scale`);
                }
                break;
            case 'reset':
                this.resetCamera();
                this.updateVRStatus('🔄 View Reset');
                break;
            case 'earth':
                if (app.topicManager && app.topicManager.currentModule) {
                    const earth = app.topicManager.currentModule.planets?.earth;
                    if (earth) {
                        app.topicManager.currentModule.focusOnObject(earth, this.camera, this.controls);
                        this.updateVRStatus('🌍 Focused on Earth');
                    }
                }
                break;
            case 'solar':
                if (app.topicManager) {
                    app.topicManager.loadTopic('solar-system');
                    this.updateVRStatus('🪐 Loading Solar System...');
                }
                break;
            case 'quantum':
                if (app.topicManager) {
                    app.topicManager.loadTopic('quantum');
                    this.updateVRStatus('⚛️ Loading Quantum Physics...');
                }
                break;
            case 'hide':
                if (this.vrUIPanel) {
                    this.vrUIPanel.visible = false;
                }
                break;
        }
    }
    
    flashVRButton(btn) {
        const ctx = this.vrUIContext;
        
        // Flash white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        this.vrUIPanel.material.map.needsUpdate = true;
        
        // Restore after 150ms
        setTimeout(() => {
            this.setupVRUI();
        }, 150);
    }
    
    updateVRStatus(message) {
        const ctx = this.vrUIContext;
        
        // Clear status bar area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 640, 1024, 128);
        
        // Get current state
        const app = window.app || this;
        const speed = app.topicManager?.timeSpeed || 0;
        const brightness = app.topicManager?.brightness || 50;
        
        // Mode text
        let modeText = '▶️ Playing';
        if (this.pauseMode === 'all') modeText = '⏸️ Paused All';
        else if (this.pauseMode === 'orbital') modeText = '🌍 Orbital Pause';
        
        // Status line
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Mode: ${modeText} | Speed: ${speed}x | Brightness: ${brightness}%`, 512, 685);
        
        // Info lines
        ctx.fillStyle = '#fff';
        ctx.font = '22px Arial';
        ctx.fillText(message || 'Ready', 512, 720);
        ctx.fillText('Use Laser to Click Buttons or Drag Slider', 512, 750);
        
        this.vrUIPanel.material.map.needsUpdate = true;
        
        console.log('🎮 VR Status:', message);
    }
    
    updateVRUI() {
        // Redraw slider with current speed
        const app = window.app || this;
        const speed = app.topicManager?.timeSpeed || 0;
        const ctx = this.vrUIContext;
        
        // Clear slider area
        const sliderY = 560;
        const sliderX = 280;
        const sliderW = 660;
        const sliderH = 20;
        
        ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
        ctx.fillRect(0, sliderY - 60, 1024, 120);
        
        // Redraw slider label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('⏱️ Time Speed:', 50, sliderY);
        
        // Slider track
        ctx.fillStyle = '#34495e';
        ctx.fillRect(sliderX, sliderY - 15, sliderW, sliderH);
        
        // Slider markers
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('0', sliderX, sliderY + 45);
        ctx.fillText('1x', sliderX + sliderW * 0.1, sliderY + 45);
        ctx.fillText('5x', sliderX + sliderW * 0.5, sliderY + 45);
        ctx.fillText('10x', sliderX + sliderW, sliderY + 45);
        
        // Slider handle at current speed
        const handleX = sliderX + (sliderW * (speed / 10));
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(handleX, sliderY - 5, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Update status bar
        this.updateVRStatus();
        
        this.vrUIPanel.material.map.needsUpdate = true;
    }
    
    updateLaserPointers() {
        // Update laser pointer colors based on what they're pointing at
        if (!this.renderer.xr.isPresenting || !this.controllers) return;
        
        // Check if sprint mode is active (check trigger buttons)
        let sprintActive = false;
        const session = this.renderer.xr.getSession();
        if (session) {
            const inputSources = session.inputSources;
            for (let i = 0; i < inputSources.length; i++) {
                const gamepad = inputSources[i].gamepad;
                if (gamepad && gamepad.buttons.length > 0 && gamepad.buttons[0].pressed) {
                    sprintActive = true;
                    break;
                }
            }
        }
        
        this.controllers.forEach((controller, index) => {
            const laser = controller.getObjectByName('laser');
            const pointer = controller.getObjectByName('pointer');
            const cone = controller.getObjectByName('cone');
            
            if (!laser) return;
            
            // Setup raycaster
            const raycaster = new THREE.Raycaster();
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(controller.matrixWorld);
            
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
            
            // Check what we're pointing at
            const intersects = raycaster.intersectObjects(this.scene.children, true);
            
            // Change color based on sprint mode and what we're hitting
            if (sprintActive) {
                // SPRINT MODE - ORANGE/RED laser
                laser.material.color.setHex(0xff6600);
                if (pointer) pointer.material.color.setHex(0xff6600);
                if (cone) cone.material.color.setHex(0xff6600);
            } else if (intersects.length > 0 && intersects[0].distance < 10) {
                // Pointing at something - make it GREEN
                laser.material.color.setHex(0x00ff00);
                if (pointer) pointer.material.color.setHex(0x00ff00);
                if (cone) cone.material.color.setHex(0x00ff00);
            } else {
                // Not pointing at anything - CYAN
                laser.material.color.setHex(0x00ffff);
                if (pointer) pointer.material.color.setHex(0x00ffff);
                if (cone) cone.material.color.setHex(0x00ffff);
            }
            
            // Update pointer position
            if (intersects.length > 0 && intersects[0].distance < 10) {
                const hitDistance = Math.min(intersects[0].distance, 10);
                if (pointer) pointer.position.set(0, 0, -hitDistance);
            } else {
                if (pointer) pointer.position.set(0, 0, -10);
            }
        });
    }
    
    updateXRMovement() {
        // Only update in VR/AR mode
        if (!this.renderer.xr.isPresenting) return;
        
        // Ensure dolly exists
        if (!this.dolly) {
            console.warn('⚠️ Dolly not found!');
            return;
        }
        
        // Get controller inputs for movement
        const session = this.renderer.xr.getSession();
        if (!session) return;
        
        const inputSources = session.inputSources;
        const xrCamera = this.renderer.xr.getCamera();
        
        // Get camera direction vectors for INTUITIVE movement
        const cameraDirection = new THREE.Vector3();
        xrCamera.getWorldDirection(cameraDirection);
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
        
        const cameraUp = new THREE.Vector3(0, 1, 0);
        
        // Track if trigger is held for sprint
        let sprintMultiplier = 1.0;
        
        for (let i = 0; i < inputSources.length; i++) {
            const inputSource = inputSources[i];
            const gamepad = inputSource.gamepad;
            const handedness = inputSource.handedness;
            
            if (!gamepad) {
                if (Math.random() < 0.01) {
                    console.warn(`⚠️ No gamepad for controller ${i}`);
                }
                continue;
            }
            
            // DEBUG: Log ALL button presses to identify Quest 3S button mapping
            if (Math.random() < 0.01) { // 1% chance = logs frequently
                const pressed = [];
                for (let b = 0; b < gamepad.buttons.length; b++) {
                    if (gamepad.buttons[b].pressed) {
                        pressed.push(`Button ${b}`);
                    }
                }
                if (pressed.length > 0) {
                    console.log(`🎮 ${handedness?.toUpperCase() || 'UNKNOWN'} pressed:`, pressed.join(', '));
                }
            }
            
            // Check trigger for sprint (button 0 = trigger)
            if (gamepad.buttons.length > 0 && gamepad.buttons[0].pressed) {
                sprintMultiplier = 3.0;
            }
            
            // ============================================
            // GRIP BUTTON PAUSE REMOVED
            // Reason: Conflicts with menu toggle in onSqueezeStart()
            // Grip (button 1) is now ONLY used for menu toggle
            // Use VR menu buttons for time control instead
            // ============================================
            
            // Get thumbstick axes (Quest uses axes 2 & 3)
            let stickX = 0, stickY = 0;
            if (gamepad.axes.length >= 4) {
                stickX = gamepad.axes[2];
                stickY = gamepad.axes[3];
            } else if (gamepad.axes.length >= 2) {
                stickX = gamepad.axes[0];
                stickY = gamepad.axes[1];
            }
            
            const deadzone = 0.15;
            
            // ============================================
            // LEFT CONTROLLER: MOVEMENT (like FPS games)
            // ============================================
            if (handedness === 'left') {
                const baseSpeed = 0.25 * sprintMultiplier; // Increased for better feel
                
                // Forward/Backward & Strafe
                if (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone) {
                    // FORWARD/BACKWARD: Push stick FORWARD to move FORWARD
                    // In VR controllers, pushing stick forward gives NEGATIVE Y value
                    const forwardMovement = cameraDirection.clone();
                    forwardMovement.y = 0; // Stay horizontal
                    forwardMovement.normalize();
                    
                    // INVERTED: Negative stickY = forward (intuitive like FPS)
                    this.dolly.position.add(forwardMovement.multiplyScalar(-stickY * baseSpeed));
                    
                    // STRAFE LEFT/RIGHT
                    const strafeMovement = cameraRight.clone();
                    strafeMovement.y = 0;
                    strafeMovement.normalize();
                    this.dolly.position.add(strafeMovement.multiplyScalar(stickX * baseSpeed));
                }
                
                // UP/DOWN with X/Y buttons
                if (gamepad.buttons[4] && gamepad.buttons[4].pressed) {
                    // X button: Move DOWN
                    this.dolly.position.y -= baseSpeed * 0.8;
                }
                if (gamepad.buttons[5] && gamepad.buttons[5].pressed) {
                    // Y button: Move UP
                    this.dolly.position.y += baseSpeed * 0.8;
                }
            }
            
            // ============================================
            // RIGHT CONTROLLER: TURN & VERTICAL
            // ============================================
            if (handedness === 'right') {
                const turnSpeed = 0.03;
                const vertSpeed = 0.25 * sprintMultiplier;
                
                // TURN LEFT/RIGHT
                if (Math.abs(stickX) > deadzone) {
                    this.dolly.rotation.y -= stickX * turnSpeed;
                }
                
                // VERTICAL MOVEMENT
                if (Math.abs(stickY) > deadzone) {
                    // Negative Y = up, Positive Y = down (inverted for intuitive)
                    this.dolly.position.y += -stickY * vertSpeed;
                }
                
                // UP/DOWN with A/B buttons
                if (gamepad.buttons[4] && gamepad.buttons[4].pressed) {
                    // A button: Move DOWN
                    this.dolly.position.y -= 0.2 * sprintMultiplier;
                }
                if (gamepad.buttons[5] && gamepad.buttons[5].pressed) {
                    // B button: Move UP
                    this.dolly.position.y += 0.2 * sprintMultiplier;
                }
            }
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    clear() {
        // Properly dispose of all objects to prevent memory leaks
        const objectsToRemove = [];
        this.scene.traverse((object) => {
            if (object !== this.camera && !Object.values(this.lights).includes(object)) {
                objectsToRemove.push(object);
            }
        });

        objectsToRemove.forEach(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        });
    }

    resetCamera() {
        const { x, y, z } = CONFIG.CAMERA.startPos;
        this.camera.position.set(x, y, z);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    animate(callback) {
        this.renderer.setAnimationLoop(() => {
            this.controls.update();
            callback();
            this.renderer.render(this.scene, this.camera);
        });
    }

    updateBrightness(multiplier) {
        if (this.lights.ambient) {
            this.lights.ambient.intensity = 0.3 + (multiplier * 1.5);
        }
        if (this.lights.hemisphere) {
            this.lights.hemisphere.intensity = 0.2 + (multiplier * 0.8);
        }
        if (this.lights.camera) {
            this.lights.camera.intensity = multiplier * 2;
        }
    }

    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.querySelector('h2').textContent = '⚠️ Error';
            loading.querySelector('#loading-text').textContent = message;
            loading.classList.remove('hidden');
        }
    }

    dispose() {
        // Clean up resources
        this.clear();
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.controls) {
            this.controls.dispose();
        }
        window.removeEventListener('resize', this.onResize);
    }
}

// ===========================
// UI MANAGER
// ===========================
class UIManager {
    constructor() {
        // Cache DOM elements
        this.elements = {
            loading: document.getElementById('loading'),
            infoPanel: document.getElementById('info-panel'),
            controls: document.getElementById('controls'),
            explorer: document.getElementById('object-list'),
            helpModal: document.getElementById('help-modal'),
            objectName: document.getElementById('object-name'),
            objectType: document.getElementById('object-type'),
            objectDistance: document.getElementById('object-distance'),
            objectSize: document.getElementById('object-size'),
            objectDescription: document.getElementById('object-description'),
            explorerTitle: document.getElementById('explorer-title'),
            explorerContent: document.getElementById('explorer-content'),
            helpContent: document.getElementById('help-content'),
            loadingText: document.getElementById('loading-text')
        };
        
        this.validateElements();
    }

    validateElements() {
        const missing = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) missing.push(key);
        }
        if (missing.length > 0) {
            console.warn('Missing UI elements:', missing);
        }
    }

    showLoading(message = 'Loading...') {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = message;
        }
        if (this.elements.loading) {
            this.elements.loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('hidden');
        }
        ['infoPanel', 'controls', 'explorer'].forEach(key => {
            if (this.elements[key]) {
                this.elements[key].classList.remove('hidden');
            }
        });
    }

    updateInfoPanel(info) {
        const updates = {
            objectName: info.name,
            objectType: info.type,
            objectDistance: info.distance,
            objectSize: info.size,
            objectDescription: info.description
        };

        for (const [key, value] of Object.entries(updates)) {
            if (this.elements[key]) {
                this.elements[key].textContent = value;
            }
        }

        if (this.elements.infoPanel) {
            this.elements.infoPanel.classList.remove('hidden');
        }
    }

    updateExplorer(title, categories) {
        if (this.elements.explorerTitle) {
            this.elements.explorerTitle.textContent = title;
        }

        if (!this.elements.explorerContent) return;

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'object-category';
            
            const header = document.createElement('h4');
            header.textContent = category.title;
            categoryDiv.appendChild(header);
            
            category.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'object-item';
                itemDiv.textContent = item.name;
                itemDiv.onclick = item.onClick;
                categoryDiv.appendChild(itemDiv);
            });
            
            fragment.appendChild(categoryDiv);
        });

        this.elements.explorerContent.innerHTML = '';
        this.elements.explorerContent.appendChild(fragment);
    }

    showHelp(content) {
        if (this.elements.helpContent) {
            this.elements.helpContent.innerHTML = content;
        }
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.remove('hidden');
        }
    }

    closeInfoPanel() {
        if (this.elements.infoPanel) {
            this.elements.infoPanel.classList.add('hidden');
        }
    }

    closeHelpModal() {
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.add('hidden');
        }
    }
}

// ===========================
// SOLAR SYSTEM MODULE
// ===========================
class SolarSystemModule {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.objects = [];
        this.planets = {};
        this.moons = {};
        this.sun = null;
        this.starfield = null;
        this.asteroidBelt = null;
        this.kuiperBelt = null;
        this.orbits = [];
        this.focusedObject = null;
        this.distantStars = [];
        this.nebulae = [];
        this.galaxies = [];
        this.comets = [];
        this.satellites = [];
        this.spacecraft = [];
        
        // Scale mode: false = educational (compressed), true = realistic (vast)
        this.realisticScale = false;
        
        // Comet tails visibility: false = hidden (better for VR/AR)
        this.cometTailsVisible = false;
        
        // Geometry cache for reuse
        this.geometryCache = new Map();
    }
    
    getGeometry(type, ...params) {
        const key = `${type}_${params.join('_')}`;
        if (!this.geometryCache.has(key)) {
            let geometry;
            if (type === 'sphere') {
                geometry = new THREE.SphereGeometry(...params);
            } else if (type === 'ring') {
                geometry = new THREE.RingGeometry(...params);
            }
            this.geometryCache.set(key, geometry);
        }
        return this.geometryCache.get(key);
    }

    async init(scene) {
        if (this.uiManager) this.uiManager.showLoading('Creating the Sun...');
        await this.createSun(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Building inner planets...');
        await this.createInnerPlanets(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Creating asteroid belt...');
        await this.createAsteroidBelt(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Building outer planets...');
        await this.createOuterPlanets(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Adding Kuiper Belt objects...');
        await this.createKuiperBelt(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Creating starfield...');
        this.createStarfield(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Adding orbital paths...');
        this.createOrbitalPaths(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Adding distant stars...');
        this.createDistantStars(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Creating nebulae...');
        this.createNebulae(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Adding galaxies...');
        this.createGalaxies(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Generating comets...');
        this.createComets(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Creating satellites...');
        this.createSatellites(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Creating spacecraft & rovers...');
        this.createSpacecraft(scene);
        
        return true;
    }

    createSun(scene) {
        // HYPERREALISTIC Sun with realistic size
        // Sun: 1,391,000 km / 12,742 km = 109.2 (should be MASSIVE)
        // But we'll scale it down to 15 for visibility while still being impressive
        const sunRadius = 15; // Compromise between realism and usability
        const sunGeometry = new THREE.SphereGeometry(sunRadius, 128, 128); // Higher detail
        
        // Create advanced sun texture with sunspots and granulation
        const sunTexture = this.createSunTexture(2048);
        const sunBumpMap = this.createSunBumpMap(2048);
        
        const sunMaterial = new THREE.MeshStandardMaterial({
            map: sunTexture,
            bumpMap: sunBumpMap,
            bumpScale: 0.5,
            emissive: 0xff6600,
            emissiveMap: sunTexture,
            emissiveIntensity: 2.5,
            toneMapped: false,
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.userData = {
            name: 'Sun',
            type: 'Star',
            distance: 0,
            radius: sunRadius,
            description: '☀️ The Sun is a G-type main-sequence star (yellow dwarf) containing 99.86% of the Solar System\'s mass. Surface temperature: 5,778K. Age: 4.6 billion years. It fuses 600 million tons of hydrogen into helium every second!',
            funFact: 'The Sun is so big that 1.3 million Earths could fit inside it!',
            realSize: '1,391,000 km diameter'
        };
        
        // Add sun light (increased for educational visibility)
        const sunLight = new THREE.PointLight(0xFFFFE0, 8, 0, 1.2); // Increased from 5 to 8
        sunLight.name = 'sunLight';
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 5000;
        scene.add(sunLight);
        
        // Add ambient light for better visibility of all planets
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // INCREASED: Bright white ambient for visibility
        ambientLight.name = 'ambientLight';
        scene.add(ambientLight);
        console.log('💡 Ambient light increased to 1.2 intensity for Earth visibility');
        
        // Multi-layer corona for realistic glow
        const coronaLayers = [
            { size: 11.5, color: 0xffdd88, opacity: 0.25 },
            { size: 13, color: 0xffaa44, opacity: 0.18 },
            { size: 15, color: 0xff8822, opacity: 0.12 },
            { size: 18, color: 0xff6600, opacity: 0.06 }
        ];
        
        coronaLayers.forEach(layer => {
            const coronaGeometry = new THREE.SphereGeometry(layer.size, 32, 32);
            const coronaMaterial = new THREE.MeshBasicMaterial({
                color: layer.color,
                transparent: true,
                opacity: layer.opacity,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
            this.sun.add(corona);
        });
        
        // Add solar flare particles
        const flareGeometry = new THREE.BufferGeometry();
        const flareCount = 200;
        const flarePositions = new Float32Array(flareCount * 3);
        const flareSizes = new Float32Array(flareCount);
        
        for (let i = 0; i < flareCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 10.5 + Math.random() * 2;
            
            flarePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            flarePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            flarePositions[i * 3 + 2] = r * Math.cos(phi);
            flareSizes[i] = 1 + Math.random() * 3;
        }
        
        flareGeometry.setAttribute('position', new THREE.BufferAttribute(flarePositions, 3));
        flareGeometry.setAttribute('size', new THREE.BufferAttribute(flareSizes, 1));
        
        const flareMaterial = new THREE.PointsMaterial({
            color: 0xffff00,
            size: 2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false
        });
        
        const flares = new THREE.Points(flareGeometry, flareMaterial);
        this.sun.add(flares);
        this.sun.userData.flares = flares;
        
        scene.add(this.sun);
        this.objects.push(this.sun);
    }

    createInnerPlanets(scene) {
        // REALISTIC SIZES (Earth radius = 1.0 as base)
        // Mercury: 4,879 km / 12,742 km = 0.383
        this.planets.mercury = this.createPlanet(scene, {
            name: 'Mercury',
            radius: 0.383,
            color: 0x8C7853,
            distance: 20,
            speed: 0.04,
            rotationSpeed: 0.004,
            tilt: 0.034,
            description: '☿️ Mercury is the smallest planet and closest to the Sun. Its surface is covered with craters like our Moon. Temperature ranges from -180°C at night to 430°C during the day - the largest temperature swing in the solar system!',
            funFact: 'A year on Mercury (88 Earth days) is shorter than its day (176 Earth days)!',
            realSize: '4,879 km diameter',
            moons: 0
        });

        // Venus: 12,104 km / 12,742 km = 0.950
        this.planets.venus = this.createPlanet(scene, {
            name: 'Venus',
            radius: 0.950,
            color: 0xFFC649,
            distance: 30,
            speed: 0.015,
            rotationSpeed: -0.001,
            tilt: 2.64,
            description: '♀️ Venus is the hottest planet with surface temperature of 465°C due to extreme greenhouse effect. Its atmosphere is 96% CO2 with clouds of sulfuric acid. Venus rotates backwards compared to most planets!',
            funFact: 'Venus is the brightest planet in our sky and is often called Earth\'s "evil twin"',
            realSize: '12,104 km diameter',
            moons: 0,
            emissive: 0xFFC649,
            emissiveIntensity: 0.3
        });

        // Earth: BASE = 1.0 (12,742 km)
        this.planets.earth = this.createPlanet(scene, {
            name: 'Earth',
            radius: 1.0,
            color: 0x2233FF,
            distance: 45,
            speed: 0.01,
            rotationSpeed: 0.02,
            tilt: 23.44,
            description: '🌍 Earth is our home, the only known planet with life! 71% is covered by water, creating the blue color visible from space. The atmosphere protects us from harmful radiation and meteors.',
            funFact: 'Earth is the only planet not named after a god. It travels at 107,000 km/h around the Sun!',
            realSize: '12,742 km diameter',
            moons: 1,
            atmosphere: true
        });

        // Moon: 3,474 km / 12,742 km = 0.273
        // Real distance: 384,400 km / Earth radius (6,371 km) = ~60 Earth radii
        this.createMoon(this.planets.earth, {
            name: 'Moon',
            radius: 0.273,
            color: 0xAAAAAA,
            distance: 4, // Increased from 3 for better visibility
            speed: 0.05, // Increased from 0.03 for visible orbit
            rotationSpeed: 0.004, // Moon rotates (tidally locked)
            description: '🌙 Earth\'s Moon is the fifth largest moon in the solar system. It creates tides, stabilizes Earth\'s tilt, and was formed 4.5 billion years ago when a Mars-sized object hit Earth!',
            funFact: 'The Moon is slowly moving away from Earth at 3.8 cm per year!'
        });

        // Mars: 6,779 km / 12,742 km = 0.532
        this.planets.mars = this.createPlanet(scene, {
            name: 'Mars',
            radius: 0.532,
            color: 0xCD5C5C,
            distance: 60,
            speed: 0.008,
            rotationSpeed: 0.018,
            tilt: 25.19,
            description: '♂️ Mars, the Red Planet, gets its color from iron oxide (rust). It has the largest volcano (Olympus Mons - 22 km high) and canyon (Valles Marineris - 4,000 km long) in the solar system. Water ice exists at its poles!',
            funFact: 'Mars has seasons like Earth, and its day is only 37 minutes longer than ours!',
            realSize: '6,779 km diameter',
            moons: 2
        });

        // Phobos: ~22 km / 12,742 km = 0.0017 (tiny!)
        this.createMoon(this.planets.mars, {
            name: 'Phobos',
            radius: 0.002, // Minimum visible size
            color: 0x666666,
            distance: 1.5,
            speed: 0.08,
            description: '🌑 Phobos orbits Mars faster than Mars rotates! It rises in the west and sets in the east.'
        });
        // Deimos: ~12 km / 12,742 km = 0.0009
        this.createMoon(this.planets.mars, {
            name: 'Deimos',
            radius: 0.0015, // Minimum visible size
            color: 0x888888,
            distance: 2.5,
            speed: 0.04,
            description: '🌑 Deimos is the smaller of Mars\' two moons and takes 30 hours to orbit.'
        });
    }

    createOuterPlanets(scene) {
        // Jupiter: 139,820 km / 12,742 km = 10.97 (MASSIVE!)
        this.planets.jupiter = this.createPlanet(scene, {
            name: 'Jupiter',
            radius: 10.97,
            color: 0xDAA520,
            distance: 100,
            speed: 0.002,
            rotationSpeed: 0.04,
            tilt: 3.13,
            description: '♃ Jupiter is the largest planet - all other planets could fit inside it! The Great Red Spot is a storm larger than Earth that has raged for at least 400 years. Jupiter has 95 known moons!',
            funFact: 'Jupiter\'s gravity shields Earth from many asteroids and comets!',
            realSize: '139,820 km diameter',
            moons: 4,
            rings: true
        });

        // Jupiter's Galilean moons (realistic sizes)
        // Io: 3,643 km / 12,742 km = 0.286
        this.createMoon(this.planets.jupiter, {
            name: 'Io',
            radius: 0.286,
            color: 0xFFFF00,
            distance: 8,
            speed: 0.06,
            description: '🌋 Io is the most volcanically active body in the solar system!'
        });
        // Europa: 3,122 km / 12,742 km = 0.245
        this.createMoon(this.planets.jupiter, {
            name: 'Europa',
            radius: 0.245,
            color: 0xCCBB99,
            distance: 10,
            speed: 0.045,
            description: '❄️ Europa has a global ocean beneath its ice - a potential place for life!'
        });
        // Ganymede: 5,268 km / 12,742 km = 0.413 (larger than Mercury!)
        this.createMoon(this.planets.jupiter, {
            name: 'Ganymede',
            radius: 0.413,
            color: 0x996633,
            distance: 12,
            speed: 0.035,
            description: '🌕 Ganymede is the largest moon in the solar system, bigger than Mercury!'
        });
        // Callisto: 4,821 km / 12,742 km = 0.378
        this.createMoon(this.planets.jupiter, {
            name: 'Callisto',
            radius: 0.378,
            color: 0x777777,
            distance: 14,
            speed: 0.025,
            description: '🌑 Callisto is the most heavily cratered object in the solar system!'
        });

        // Saturn: 116,460 km / 12,742 km = 9.14 (almost as big as Jupiter!)
        this.planets.saturn = this.createPlanet(scene, {
            name: 'Saturn',
            radius: 9.14,
            color: 0xFAD5A5,
            distance: 150,
            speed: 0.0009,
            rotationSpeed: 0.038,
            tilt: 26.73,
            description: '♄ Saturn is famous for its spectacular ring system made of ice and rock particles. It\'s the least dense planet - it would float in water! Saturn has 146 known moons including Titan, which has a thick atmosphere.',
            funFact: 'Saturn\'s rings are only 10 meters thick but 280,000 km wide!',
            realSize: '116,460 km diameter',
            moons: 3,
            rings: true,
            prominentRings: true
        });

        // Titan: 5,150 km / 12,742 km = 0.404 (bigger than Mercury!)
        this.createMoon(this.planets.saturn, {
            name: 'Titan',
            radius: 0.404,
            color: 0xFFAA33,
            distance: 10,
            speed: 0.03,
            description: '🔶 Titan has lakes and rivers of liquid methane - the only place besides Earth with liquid on its surface!'
        });
        // Enceladus: 504 km / 12,742 km = 0.040
        this.createMoon(this.planets.saturn, {
            name: 'Enceladus',
            radius: 0.040,
            color: 0xFFFFFF,
            distance: 7,
            speed: 0.05,
            description: '💧 Enceladus shoots water geysers into space from its subsurface ocean!'
        });
        // Rhea: 1,527 km / 12,742 km = 0.120
        this.createMoon(this.planets.saturn, {
            name: 'Rhea',
            radius: 0.120,
            color: 0xCCCCCC,
            distance: 12,
            speed: 0.025,
            description: '🌑 Rhea may have its own ring system!'
        });

        // Uranus: 50,724 km / 12,742 km = 3.98
        this.planets.uranus = this.createPlanet(scene, {
            name: 'Uranus',
            radius: 3.98,
            color: 0x4FD0E7,
            distance: 200,
            speed: 0.0004,
            rotationSpeed: 0.03,
            tilt: 97.77,
            description: '♅ Uranus is unique - it rotates on its side! This means its poles take turns facing the Sun during its 84-year orbit. Made of water, methane, and ammonia ices, it appears blue-green due to methane in its atmosphere.',
            funFact: 'Uranus was the first planet discovered with a telescope (1781)!',
            realSize: '50,724 km diameter',
            moons: 2,
            rings: true
        });

        // Titania: 1,578 km / 12,742 km = 0.124
        this.createMoon(this.planets.uranus, {
            name: 'Titania',
            radius: 0.124,
            color: 0xAAAAAA,
            distance: 5,
            speed: 0.04,
            description: '🌑 Titania is Uranus\' largest moon with massive canyons!'
        });
        // Miranda: 472 km / 12,742 km = 0.037
        this.createMoon(this.planets.uranus, {
            name: 'Miranda',
            radius: 0.037,
            color: 0x999999,
            distance: 3.5,
            speed: 0.06,
            description: '🎢 Miranda has the most dramatic terrain in the solar system with cliffs 20 km high!'
        });

        // Neptune: 49,244 km / 12,742 km = 3.86
        this.planets.neptune = this.createPlanet(scene, {
            name: 'Neptune',
            radius: 3.86,
            color: 0x4169E1,
            distance: 250,
            speed: 0.0001,
            rotationSpeed: 0.032,
            tilt: 28.32,
            description: '♆ Neptune is the windiest planet with storms reaching 2,100 km/h! Its beautiful blue color comes from methane. Neptune has a large dark spot (storm) similar to Jupiter\'s Great Red Spot.',
            funFact: 'Neptune was discovered by math before being seen - its gravity affected Uranus\'s orbit!',
            realSize: '49,244 km diameter',
            moons: 1,
            rings: true
        });

        // Triton: 2,707 km / 12,742 km = 0.212
        this.createMoon(this.planets.neptune, {
            name: 'Triton',
            radius: 0.212,
            color: 0xFFCCCC,
            distance: 5,
            speed: -0.05,
            description: '❄️ Triton orbits backwards and has nitrogen geysers! It\'s likely a captured Kuiper Belt object.'
        });

        // Pluto: 2,377 km / 12,742 km = 0.187
        this.planets.pluto = this.createPlanet(scene, {
            name: 'Pluto',
            radius: 0.187,
            color: 0xD4A373,
            distance: 300,
            speed: 0.00004,
            rotationSpeed: 0.015,
            tilt: 122.53,
            description: '♇ Pluto is a dwarf planet in the Kuiper Belt. It has a heart-shaped glacier (Tombaugh Regio), mountains of water ice, and five moons. Pluto and its largest moon Charon are tidally locked - they always show the same face to each other!',
            funFact: 'A year on Pluto lasts 248 Earth years! It hasn\'t completed one orbit since its discovery in 1930.',
            realSize: '2,377 km diameter',
            moons: 1,
            dwarf: true
        });

        // Charon: 1,212 km / 12,742 km = 0.095 (half the size of Pluto!)
        this.createMoon(this.planets.pluto, {
            name: 'Charon',
            radius: 0.095,
            color: 0xAAAAAA,
            distance: 1.2,
            speed: 0.02,
            description: '🌗 Charon is so large relative to Pluto that they form a binary system!'
        });
    }

    createProceduralTexture(type, size = 512) {
        // Create canvas for procedural texture
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Simple noise function (deterministic pseudo-random)
        const noise = (x, y, seed = 0) => {
            const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
            return n - Math.floor(n);
        };
        
        // Multi-octave noise for more natural patterns
        const fbm = (x, y, octaves = 4) => {
            let value = 0;
            let amplitude = 1;
            let frequency = 1;
            let maxValue = 0;
            
            for (let i = 0; i < octaves; i++) {
                value += noise(x * frequency, y * frequency, i) * amplitude;
                maxValue += amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            return value / maxValue;
        };
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
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
                            data[idx] = 240 + iceVariation;     // R
                            data[idx + 1] = 248 + iceVariation; // G
                            data[idx + 2] = 255;                // B
                        } else if (continentNoise > 0.52) {
                            // Land (green/brown)
                            const landVariation = noise(nx * 15, ny * 15) * 0.3;
                            const greenness = (1 - lat) * 0.4; // More green at equator
                            data[idx] = 100 + landVariation * 100;      // R
                            data[idx + 1] = 80 + greenness * 100;       // G
                            data[idx + 2] = 50 + landVariation * 50;    // B
                        } else {
                            // Ocean (blue with depth variation)
                            const depth = (0.52 - continentNoise) * 2;
                            data[idx] = 20 + depth * 30;      // R
                            data[idx + 1] = 50 + depth * 80;  // G
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
                            data[idx] = 150 + rust * 100;     // R
                            data[idx + 1] = 70 + rust * 60;   // G
                            data[idx + 2] = 30 + rust * 30;   // B
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

    createCloudTexture(size = 512) {
        // Create wispy cloud patterns
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const noise = (x, y, seed = 0) => {
            const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
            return n - Math.floor(n);
        };
        
        const fbm = (x, y, octaves = 4) => {
            let value = 0;
            let amplitude = 1;
            let frequency = 1;
            let maxValue = 0;
            
            for (let i = 0; i < octaves; i++) {
                value += noise(x * frequency, y * frequency, i) * amplitude;
                maxValue += amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            return value / maxValue;
        };
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const nx = x / size;
                const ny = y / size;
                
                // Wispy cloud pattern
                const cloud = fbm(nx * 6, ny * 6, 6);
                const cloudIntensity = Math.max(0, (cloud - 0.4) * 2);
                
                // White clouds
                const brightness = 255;
                data[idx] = brightness;
                data[idx + 1] = brightness;
                data[idx + 2] = brightness;
                data[idx + 3] = cloudIntensity * 255; // Alpha channel for transparency
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    // ===== HYPERREALISTIC TEXTURE GENERATORS =====
    
    createSunTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Gradient from core to edge
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.5, '#FFCC00');
        gradient.addColorStop(1, '#FF8800');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Add granulation (convection cells)
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 2 + Math.random() * 4;
            const brightness = 0.85 + Math.random() * 0.15;
            
            ctx.fillStyle = `rgba(255, ${Math.floor(200 * brightness)}, 0, 0.3)`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add sunspots (cooler, darker regions)
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 10 + Math.random() * 30;
            
            // Sunspot umbra (dark center)
            const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            spotGradient.addColorStop(0, 'rgba(30, 20, 0, 0.8)');
            spotGradient.addColorStop(0.6, 'rgba(100, 60, 0, 0.4)');
            spotGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
            
            ctx.fillStyle = spotGradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createSunBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Base gray
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, size, size);
        
        // Add granulation bumps
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 2 + Math.random() * 3;
            const height = Math.random();
            
            const gray = Math.floor(128 + height * 80);
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createEarthTexture(size) {
        console.log(`🌍 Creating Earth texture at ${size}x${size} resolution...`);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
                const nx = x / size * 2;
                const ny = y / size * 2;
                
                // Large-scale continents - MAXIMUM AMPLIFICATION
                // Turbulence returns 0-size, so multiply to get bigger values
                const continents = turbulence(nx * 4, ny * 4, 128) * 3.0;  // TRIPLE IT!
                const mountains = turbulence(nx * 8, ny * 8, 64) * 1.5;    // TRIPLE from 0.5
                const details = turbulence(nx * 16, ny * 16, 32) * 0.75;   // TRIPLE from 0.25
                
                // Now max: (128*3 + 64*1.5 + 32*0.75) = 504
                // Divide by 80 to get range 0 to ~6.3
                const elevation = (continents + mountains + details) / 80;
                
                // DEBUG: Log elevation range and raw values
                if (x === 512 && y % 200 === 0) {
                    console.log(`📊 Elevation: ${elevation.toFixed(4)} (cont:${continents.toFixed(1)}, mtn:${mountains.toFixed(1)}, det:${details.toFixed(1)}) at lat ${(lat * 180/Math.PI).toFixed(1)}°`);
                }
                
                // EXTRA DEBUG: Track min/max elevation
                if (!window._earthElevationStats) {
                    window._earthElevationStats = { min: Infinity, max: -Infinity, samples: 0 };
                }
                window._earthElevationStats.min = Math.min(window._earthElevationStats.min, elevation);
                window._earthElevationStats.max = Math.max(window._earthElevationStats.max, elevation);
                window._earthElevationStats.samples++;
                
                // 🎨 FORCE LAND TEST: Create simple stripe pattern to verify land rendering works
                // This will show alternating ocean/land stripes
                const forcePattern = Math.floor(y / 100) % 2;  // Alternating every 100 rows
                const forceLand = forcePattern === 0 && latNorm < 0.92;  // Stripes, except poles
                
                // Polar ice caps
                if (latNorm > 0.92) {
                    const iceVariation = noise(nx * 30, ny * 30, 1) * 20;
                    data[idx] = 240 + iceVariation;
                    data[idx + 1] = 250 + iceVariation;
                    data[idx + 2] = 255;
                }
                // Land areas - FORCED TEST or elevation threshold
                // Force land in stripes to verify land rendering works
                else if (forceLand || elevation > 1.0) {
                    const landHeight = (elevation - 1.0) * 2;
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
                // Shallow water - BRIGHT for visibility (between 0.8 and 1.0)
                else if (elevation > 0.8) {
                    const shallow = (elevation - 0.8) * 25;
                    data[idx] = 110 + shallow * 2; // Bright aqua
                    data[idx + 1] = 200 - shallow;
                    data[idx + 2] = 240 - shallow * 2;
                }
                // Deep ocean - BRIGHTER blues for visibility (below 0.8)
                else {
                    const depth = (0.8 - elevation) * 0.5;
                    data[idx] = Math.max(40, 70 - depth * 10); // Much brighter base
                    data[idx + 1] = Math.max(80, 130 - depth * 30);
                    data[idx + 2] = Math.max(150, 200 - depth * 30);
                }
                
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // DEBUG: Count land vs ocean pixels
        let landPixels = 0, oceanPixels = 0, icePixels = 0, forcedLandPixels = 0;
        let greenestPixel = { r: 0, g: 0, b: 0, idx: 0 };
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            if (r > 200 && g > 200 && b > 200) {
                icePixels++;
            } else if (g > b && g > 100) {
                landPixels++;
                // Track greenest pixel (should be forest)
                if (g > greenestPixel.g) {
                    greenestPixel = { r, g, b, idx: i/4 };
                }
            } else {
                oceanPixels++;
            }
        }
        const totalPixels = size * size;
        console.log(`🌍 Earth texture generated: ${(landPixels/totalPixels*100).toFixed(1)}% land, ${(oceanPixels/totalPixels*100).toFixed(1)}% ocean, ${(icePixels/totalPixels*100).toFixed(1)}% ice`);
        console.log(`🌲 Greenest land pixel found: RGB(${greenestPixel.r}, ${greenestPixel.g}, ${greenestPixel.b}) at pixel ${greenestPixel.idx}`);
        
        // ⚠️ CRITICAL FIX: Create texture BEFORE adding clouds
        // Otherwise clouds overwrite the surface texture!
        console.log('🌍 Creating THREE.js texture from canvas (BEFORE clouds)...');
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // DEBUG: Log final elevation statistics
        if (window._earthElevationStats) {
            console.log(`📊 Earth elevation stats: min=${window._earthElevationStats.min.toFixed(4)}, max=${window._earthElevationStats.max.toFixed(4)}`);
            console.log(`📊 AMPLIFIED CONTINENTS: 3x continents, 1.5x mountains, 0.75x details`);
            console.log(`📊 Land threshold: 1.0, Shallow threshold: 0.8 (adjusted for new 0-6 range)`);
            console.log(`📊 Elevation divisor: /80 with 3x amplification = MAXIMUM visibility`);
            const range = window._earthElevationStats.max - window._earthElevationStats.min;
            const landPercent = window._earthElevationStats.max > 1.0 ? 
                ((window._earthElevationStats.max - 1.0) / range * 100).toFixed(1) : 0;
            console.log(`📊 Elevation range: ${range.toFixed(4)}, expected ${landPercent}% pixels above land threshold`);
        }
        
        // CRITICAL TEST: Verify canvas actually has color data
        console.log('🎨 Canvas verification:');
        console.log('   - Canvas size:', canvas.width, 'x', canvas.height);
        console.log('   - Canvas context:', canvas.getContext('2d') ? 'OK' : 'FAILED');
        
        // Sample some pixels to verify colors
        const testCtx = canvas.getContext('2d');
        const samples = [
            testCtx.getImageData(512, 512, 1, 1).data,    // Center
            testCtx.getImageData(1024, 512, 1, 1).data,   // Right
            testCtx.getImageData(512, 100, 1, 1).data,    // Top (should be ice)
            testCtx.getImageData(512, 1900, 1, 1).data    // Bottom (should be ice)
        ];
        console.log('   - Sample pixel colors:');
        samples.forEach((pixel, i) => {
            const locations = ['center', 'right', 'north pole', 'south pole'];
            console.log(`     ${locations[i]}: RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);
        });
        
        // ULTIMATE TEST: Create a downloadable preview
        try {
            const dataURL = canvas.toDataURL('image/png');
            console.log('🖼️ TEXTURE PREVIEW: Right-click and "Open in new tab" to see the actual texture:');
            console.log(dataURL.substring(0, 100) + '...');
            console.log('   Copy this and paste in browser to view Earth texture:');
            console.log('   %c[VIEW EARTH TEXTURE]', 'color: #00ff00; font-size: 16px; font-weight: bold; background: #000; padding: 5px;');
            console.log('   Length:', dataURL.length, 'bytes');
            // Store for inspection
            window._earthTextureDataURL = dataURL;
            console.log('   Stored in: window._earthTextureDataURL');
        } catch (e) {
            console.error('❌ Failed to create texture preview:', e);
        }
        
        return texture;
    }
    
    createEarthBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createEarthNormalMap(size) {
        // Normal map for mountain ranges and ocean trenches
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
        
        // Calculate normals from height map
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const idx = (y * size + x) * 4;
                const nx = x / size * 2, ny = y / size * 2;
                
                // Sample height at neighboring pixels
                const h = turbulence(nx, ny, 128) / 128;
                const hL = turbulence((x - 1) / size * 2, ny, 128) / 128;
                const hR = turbulence((x + 1) / size * 2, ny, 128) / 128;
                const hU = turbulence(nx, (y - 1) / size * 2, 128) / 128;
                const hD = turbulence(nx, (y + 1) / size * 2, 128) / 128;
                
                // Calculate gradients
                const dX = (hR - hL) * 2;
                const dY = (hD - hU) * 2;
                
                // Convert to normal map RGB (blue = up, red = x, green = y)
                data[idx] = Math.floor((dX + 1) * 127.5);     // R: -1 to 1 -> 0 to 255
                data[idx + 1] = Math.floor((dY + 1) * 127.5); // G: -1 to 1 -> 0 to 255
                data[idx + 2] = 200;                           // B: mostly pointing up
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createEarthSpecularMap(size) {
        // Oceans are shiny, land is rough
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createMoonTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
    
    createMoonBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
    
    createMoonNormalMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
    
    createMarsTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
    
    createMarsBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
    
    createMarsNormalMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#8080FF';
        ctx.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createMercuryTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
                
                // Base gray-brown color
                let gray = 120 + noise(nx * 30, ny * 30) * 60;
                
                // Ray systems
                if (noise(nx * 100, ny * 100) > 0.92) {
                    gray = Math.min(255, gray * 1.3);
                }
                
                data[idx] = gray;
                data[idx + 1] = gray * 0.9;
                data[idx + 2] = gray * 0.8;
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
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
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createMercuryBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createVenusTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const noise = (x, y) => {
            const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return n - Math.floor(n);
        };
        
        const fbm = (x, y, octaves = 5) => {
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
                
                // Swirling sulfuric acid clouds
                const cloudPattern = fbm(nx * 6, ny * 8, 6);
                const swirl = Math.sin(nx * Math.PI * 10 + cloudPattern * 3) * 0.5 + 0.5;
                
                const brightness = 180 + cloudPattern * 60 + swirl * 20;
                
                data[idx] = Math.min(255, brightness * 1.1);      // R
                data[idx + 1] = Math.min(255, brightness * 0.85); // G
                data[idx + 2] = Math.min(255, brightness * 0.5);  // B
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createJupiterTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const noise = (x, y) => {
            const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return n - Math.floor(n);
        };
        
        const fbm = (x, y, octaves = 4) => {
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
                
                // Horizontal bands with turbulence
                const bandY = ny * 12; // 12 major bands
                const bandPattern = Math.sin(bandY * Math.PI) * 0.5 + 0.5;
                const turbulence = fbm(nx * 8, ny * 4, 5) * 0.4;
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
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createJupiterBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
    
    createSaturnTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const noise = (x, y) => {
            const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return n - Math.floor(n);
        };
        
        const fbm = (x, y, octaves = 4) => {
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
                
                // Subtle horizontal bands
                const bandY = ny * 15;
                const bandPattern = Math.sin(bandY * Math.PI) * 0.3 + 0.7;
                const turbulence = fbm(nx * 6, ny * 3, 4) * 0.2;
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
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createSaturnBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
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
                
                // Subtle atmospheric variation
                const elevation = noise(nx * 15, ny * 6) * 0.8 + noise(nx * 30, ny * 12) * 0.2;
                const gray = Math.floor(128 + elevation * 30);
                
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

    createUranusTexture(size) {
        // Uranus: Featureless cyan-blue atmosphere with subtle banding
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const noise = (x, y, seed) => {
            const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
            return n - Math.floor(n);
        };
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const nx = x / size;
                const ny = y / size;
                
                // Latitude-based faint banding
                const latitude = ny;
                const band = Math.sin(latitude * Math.PI * 12) * 0.02;
                
                // Very subtle atmospheric variations
                const clouds = noise(nx * 8, ny * 8, 1) * 0.03;
                const detail = noise(nx * 20, ny * 20, 2) * 0.015;
                
                // Base cyan-blue color with methane tint
                const brightness = 0.65 + band + clouds + detail;
                data[idx] = Math.floor(79 * brightness); // R: Cyan-blue
                data[idx + 1] = Math.floor(212 * brightness); // G
                data[idx + 2] = Math.floor(232 * brightness); // B
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createNeptuneTexture(size) {
        // Neptune: Deep blue atmosphere with Great Dark Spot and wind features
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const noise = (x, y, seed) => {
            const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
            return n - Math.floor(n);
        };
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
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
                const swirl = noise(nx * 12 + ny * 2, ny * 10, 1) * 0.06;
                const detail = noise(nx * 25, ny * 25, 2) * 0.03;
                
                // Deep blue with white clouds
                const brightness = 0.55 + band + wave + swirl + detail + darkSpot;
                data[idx] = Math.floor(46 * brightness); // R: Deep blue
                data[idx + 1] = Math.floor(95 * brightness); // G
                data[idx + 2] = Math.floor(181 * brightness); // B
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createPlutoTexture(size) {
        // Pluto: Heart-shaped Tombaugh Regio, nitrogen ice, reddish-brown terrain
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const noise = (x, y, seed) => {
            const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
            return n - Math.floor(n);
        };
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
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
                const terrain = noise(nx * 15, ny * 15, 1) * 0.4;
                const mountains = noise(nx * 30, ny * 30, 2) * 0.2;
                const detail = noise(nx * 50, ny * 50, 3) * 0.1;
                
                // Tholins (reddish-brown organic compounds)
                const tholin = terrain + mountains + detail;
                
                if (isHeart) {
                    // Sputnik Planitia - bright nitrogen ice
                    const iceBrightness = 0.9 + noise(nx * 40, ny * 40, 4) * 0.1;
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
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createPlanetMaterial(config) {
        // Create HYPERREALISTIC materials with advanced texturing
        const name = config.name.toLowerCase();
        console.log(`🎨 Creating material for planet: "${name}" (original: "${config.name}")`);
        
        // Base material properties
        let materialProps = {
            roughness: 0.9,
            metalness: 0.0,
            emissive: config.emissive || 0x000000,
            emissiveIntensity: config.emissiveIntensity || 0
        };

        // Planet-specific hyperrealistic materials with high-quality textures
        switch(name) {
            case 'earth':
                console.log('🌍 ✅ EARTH CASE MATCHED - Creating hyperrealistic Earth material...');
                // Earth: Photorealistic blue oceans, continents, clouds, city lights
                const earthTexture = this.createEarthTexture(2048);
                const earthBump = this.createEarthBumpMap(2048);
                const earthSpecular = this.createEarthSpecularMap(2048);
                const earthNormal = this.createEarthNormalMap(2048);
                
                console.log('🌍 Earth material created with texture:', earthTexture);
                console.log('🌍 Earth texture size:', earthTexture.image?.width, 'x', earthTexture.image?.height);
                
                // Use MeshBasicMaterial with texture - always visible, ignores lighting
                console.log('🌍 Using MeshBasicMaterial with texture - always visible!');
                
                const earthMaterial = new THREE.MeshBasicMaterial({
                    map: earthTexture
                });
                
                /* ORIGINAL MeshStandardMaterial - DISABLED FOR TESTING
                const earthMaterial = new THREE.MeshStandardMaterial({
                    map: earthTexture,
                    normalMap: earthNormal,
                    normalScale: new THREE.Vector2(0.5, 0.5),
                    bumpMap: earthBump,
                    bumpScale: 0.04,
                    roughnessMap: earthSpecular,
                    roughness: 0.25,
                    metalness: 0.15,
                    emissive: 0x111111,
                    emissiveIntensity: 0.05
                });
                */
                
                console.log('🌍 Earth material map:', earthMaterial.map);
                console.log('🌍 Earth material type:', earthMaterial.type);
                return earthMaterial;
                
            case 'mars':
                // Mars: Hyperrealistic rusty red surface with canyons, polar caps
                const marsTexture = this.createMarsTexture(2048);
                const marsBump = this.createMarsBumpMap(2048);
                const marsNormal = this.createMarsNormalMap(2048);
                
                return new THREE.MeshStandardMaterial({
                    map: marsTexture,
                    normalMap: marsNormal,
                    normalScale: new THREE.Vector2(1.2, 1.2),
                    bumpMap: marsBump,
                    bumpScale: 0.08,
                    roughness: 0.95,
                    metalness: 0.0,
                    emissive: 0x3d1505,
                    emissiveIntensity: 0.01
                });
                
            case 'venus':
                // Venus: Thick yellowish sulfuric acid clouds
                const venusTexture = this.createVenusTexture(2048);
                return new THREE.MeshStandardMaterial({
                    map: venusTexture,
                    color: 0xe8c468,
                    roughness: 0.3,
                    metalness: 0.05,
                    emissive: 0xffc649,
                    emissiveIntensity: 0.25
                });
                
            case 'mercury':
                // Mercury: Heavily cratered like the Moon
                const mercuryTexture = this.createMercuryTexture(2048);
                const mercuryBump = this.createMercuryBumpMap(2048);
                
                return new THREE.MeshStandardMaterial({
                    map: mercuryTexture,
                    bumpMap: mercuryBump,
                    bumpScale: 0.1,
                    roughness: 0.95,
                    metalness: 0.02,
                    emissive: 0x2d2520,
                    emissiveIntensity: 0.01
                });
                
            case 'jupiter':
                // Jupiter: Hyperrealistic bands with Great Red Spot
                const jupiterTexture = this.createJupiterTexture(2048);
                const jupiterBump = this.createJupiterBumpMap(1024);
                
                return new THREE.MeshStandardMaterial({
                    map: jupiterTexture,
                    bumpMap: jupiterBump,
                    bumpScale: 0.02,
                    roughness: 0.6,
                    metalness: 0.0,
                    emissive: 0x3d2a15,
                    emissiveIntensity: 0.03
                });
                
            case 'saturn':
                // Saturn: Pale gold with detailed banding
                const saturnTexture = this.createSaturnTexture(2048);
                const saturnBump = this.createSaturnBumpMap(1024);
                
                return new THREE.MeshStandardMaterial({
                    map: saturnTexture,
                    bumpMap: saturnBump,
                    bumpScale: 0.015,
                    roughness: 0.55,
                    metalness: 0.0,
                    emissive: 0x4d3820,
                    emissiveIntensity: 0.02
                });
                
            case 'uranus':
                // Uranus: Hyperrealistic cyan atmosphere with methane
                const uranusTexture = this.createUranusTexture(2048);
                return new THREE.MeshStandardMaterial({
                    map: uranusTexture,
                    roughness: 0.3,
                    metalness: 0.1,
                    emissive: 0x1a4d5a,
                    emissiveIntensity: 0.12
                });
                
            case 'neptune':
                // Neptune: Hyperrealistic deep blue with Great Dark Spot
                const neptuneTexture = this.createNeptuneTexture(2048);
                return new THREE.MeshStandardMaterial({
                    map: neptuneTexture,
                    roughness: 0.3,
                    metalness: 0.1,
                    emissive: 0x0f1f3d,
                    emissiveIntensity: 0.18
                });
                
            case 'pluto':
                // Pluto: Hyperrealistic with Tombaugh Regio heart
                const plutoTexture = this.createPlutoTexture(2048);
                return new THREE.MeshStandardMaterial({
                    map: plutoTexture,
                    roughness: 0.85,
                    metalness: 0.0,
                    emissive: 0x3d2f20,
                    emissiveIntensity: 0.05
                });
                
            default:
                // Default material
                console.warn(`⚠️ DEFAULT MATERIAL CASE for planet "${name}" - using simple color: 0x${config.color?.toString(16)}`);
                return new THREE.MeshStandardMaterial({
                    color: config.color,
                    ...materialProps
                });
        }
    }

    createPlanet(scene, config) {
        // Use cached geometry or create new
        const segments = CONFIG.QUALITY.sphereSegments;
        const geometry = this.getGeometry('sphere', config.radius, segments, segments);
        
        // Create hyperrealistic material based on planet type
        const material = this.createPlanetMaterial(config);

        const planet = new THREE.Mesh(geometry, material);
        planet.position.set(config.distance, 0, 0);
        planet.castShadow = true;
        planet.receiveShadow = true;
        planet.rotation.z = (config.tilt || 0) * Math.PI / 180;

        planet.userData = {
            name: config.name,
            type: config.dwarf ? 'Dwarf Planet' : 'Planet',
            distance: config.distance,
            radius: config.radius,
            angle: Math.random() * Math.PI * 2,
            speed: config.speed,
            rotationSpeed: config.rotationSpeed,
            description: config.description,
            funFact: config.funFact,
            realSize: config.realSize,
            moonCount: config.moons || 0,
            moons: []
        };

        // Add atmosphere for Earth with clouds
        if (config.atmosphere) {
            // TEMPORARILY DISABLED FOR DEBUGGING - Testing if clouds are causing blue sphere
            console.log('🌍 ATMOSPHERE DISABLED FOR DEBUGGING - If Earth shows continents now, clouds were the issue!');
            
            /* DISABLED CLOUD LAYER - TESTING
            // Cloud layer with procedural patterns - VERY subtle
            const cloudGeometry = new THREE.SphereGeometry(config.radius * 1.015, 32, 32);
            const cloudTexture = this.createCloudTexture(512);
            const cloudMaterial = new THREE.MeshStandardMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.15, // Very subtle - was 0.25
                roughness: 0.9,
                metalness: 0.0,
                side: THREE.FrontSide,
                alphaMap: cloudTexture,
                depthWrite: false // Don't block view of surface
            });
            const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            clouds.userData.isCloud = true;
            planet.add(clouds);
            planet.userData.clouds = clouds;
            */
        }

        // Add Great Red Spot for Jupiter
        if (config.name === 'Jupiter') {
            const spotGeometry = new THREE.SphereGeometry(config.radius * 0.15, 16, 16);
            const spotMaterial = new THREE.MeshStandardMaterial({
                color: 0xff4444,
                roughness: 0.7,
                metalness: 0.0,
                emissive: 0x661111,
                emissiveIntensity: 0.3
            });
            const redSpot = new THREE.Mesh(spotGeometry, spotMaterial);
            redSpot.position.set(config.radius * 0.95, 0, config.radius * 0.3);
            planet.add(redSpot);
        }
        
        // Add rings for gas giants with realistic appearance
        if (config.rings) {
            const ringGeometry = new THREE.RingGeometry(
                config.radius * 1.3,
                config.radius * 2.2,
                128
            );
            
            // Create realistic ring material with color variation
            let ringColor = 0x888888;
            let ringOpacity = 0.3;
            
            if (config.prominentRings) {
                // Saturn's rings: ice and rock particles (tan/beige)
                ringColor = 0xd4c5b0;
                ringOpacity = 0.85;
            } else if (config.name === 'Jupiter') {
                ringColor = 0x997755;
                ringOpacity = 0.2;
            } else if (config.name === 'Uranus') {
                ringColor = 0x6688aa;
                ringOpacity = 0.3;
            } else if (config.name === 'Neptune') {
                ringColor = 0x5577aa;
                ringOpacity = 0.25;
            }
            
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: ringColor,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: ringOpacity,
                roughness: 0.8,
                metalness: 0.1
            });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            rings.castShadow = true;
            rings.receiveShadow = true;
            planet.add(rings);
        }

        scene.add(planet);
        this.objects.push(planet);
        
        // DIAGNOSTIC: Verify planet was added
        console.log(`✅ Planet "${config.name}" added to scene:`);
        console.log(`   - Position: (${planet.position.x}, ${planet.position.y}, ${planet.position.z})`);
        console.log(`   - Radius: ${config.radius}`);
        console.log(`   - Material type: ${planet.material.type}`);
        console.log(`   - Material color: 0x${planet.material.color?.getHexString()}`);
        console.log(`   - Has texture map: ${!!planet.material.map}`);
        console.log(`   - Visible: ${planet.visible}`);
        console.log(`   - In scene: ${planet.parent === scene}`);
        
        return planet;
    }

    createMoon(planet, config) {
        const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
        
        // Enhanced moon materials based on specific moons
        let moonMaterial;
        const moonName = config.name.toLowerCase();
        
        if (moonName === 'moon') {
            // Earth's Moon: HYPERREALISTIC with deep craters and maria
            const moonTexture = this.createMoonTexture(2048);
            const moonBump = this.createMoonBumpMap(2048);
            const moonNormal = this.createMoonNormalMap(2048);
            
            moonMaterial = new THREE.MeshStandardMaterial({
                map: moonTexture,
                normalMap: moonNormal,
                normalScale: new THREE.Vector2(2.0, 2.0), // Deep craters!
                bumpMap: moonBump,
                bumpScale: 0.15, // Pronounced elevation
                roughness: 0.98,
                metalness: 0.02
            });
        } else if (moonName === 'io') {
            // Io: Yellow/orange volcanic surface
            moonMaterial = new THREE.MeshStandardMaterial({
                color: 0xffdd44,
                roughness: 0.7,
                metalness: 0.0,
                emissive: 0xff6600,
                emissiveIntensity: 0.15
            });
        } else if (moonName === 'europa') {
            // Europa: Icy white/cream with blue tint
            moonMaterial = new THREE.MeshStandardMaterial({
                color: 0xeeddcc,
                roughness: 0.3,
                metalness: 0.2
            });
        } else if (moonName === 'titan') {
            // Titan: Orange atmosphere
            moonMaterial = new THREE.MeshStandardMaterial({
                color: 0xffa033,
                roughness: 0.6,
                metalness: 0.0,
                emissive: 0x663300,
                emissiveIntensity: 0.1
            });
        } else if (moonName === 'enceladus') {
            // Enceladus: Bright white ice
            moonMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.2,
                metalness: 0.3
            });
        } else if (moonName === 'triton') {
            // Triton: Pinkish nitrogen ice
            moonMaterial = new THREE.MeshStandardMaterial({
                color: 0xffcccc,
                roughness: 0.4,
                metalness: 0.1
            });
        } else {
            // Default moon material
            moonMaterial = new THREE.MeshStandardMaterial({
                color: config.color,
                roughness: 0.9,
                metalness: 0.1
            });
        }

        const moon = new THREE.Mesh(geometry, moonMaterial);
        moon.castShadow = true;
        moon.receiveShadow = true;

        moon.userData = {
            name: config.name,
            type: 'Moon',
            parentPlanet: planet.userData.name,
            distance: config.distance,
            radius: config.radius,
            angle: Math.random() * Math.PI * 2,
            speed: config.speed,
            rotationSpeed: config.rotationSpeed || 0.001, // Add rotation
            description: config.description
        };

        // Store moon reference
        this.moons[config.name.toLowerCase()] = moon;
        planet.userData.moons.push(moon);
        this.objects.push(moon);
        planet.add(moon);
    }

    createAsteroidBelt(scene) {
        const asteroidCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(asteroidCount * 3);
        const colors = new Float32Array(asteroidCount * 3);

        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 75 + Math.random() * 15;
            const height = (Math.random() - 0.5) * 3;

            positions[i * 3] = distance * Math.cos(angle);
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = distance * Math.sin(angle);

            const gray = 0.4 + Math.random() * 0.3;
            colors[i * 3] = gray;
            colors[i * 3 + 1] = gray * 0.9;
            colors[i * 3 + 2] = gray * 0.8;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });

        this.asteroidBelt = new THREE.Points(geometry, material);
        this.asteroidBelt.name = 'asteroidBelt';
        this.asteroidBelt.userData = {
            name: 'Asteroid Belt',
            type: 'Asteroid Belt',
            description: '☄️ The asteroid belt contains millions of rocky objects between Mars and Jupiter. Ceres, the largest object here, is a dwarf planet! Most asteroids are leftover material from the formation of the solar system 4.6 billion years ago.',
            funFact: 'Despite what movies show, asteroids are very far apart - spacecraft can pass through safely!',
            count: asteroidCount
        };
        scene.add(this.asteroidBelt);
        this.objects.push(this.asteroidBelt);
    }

    createKuiperBelt(scene) {
        const kuiperCount = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(kuiperCount * 3);
        const colors = new Float32Array(kuiperCount * 3);

        for (let i = 0; i < kuiperCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 280 + Math.random() * 100;
            const height = (Math.random() - 0.5) * 30;

            positions[i * 3] = distance * Math.cos(angle);
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = distance * Math.sin(angle);

            const iceColor = 0.7 + Math.random() * 0.3;
            colors[i * 3] = iceColor * 0.9;
            colors[i * 3 + 1] = iceColor * 0.95;
            colors[i * 3 + 2] = iceColor;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });

        this.kuiperBelt = new THREE.Points(geometry, material);
        this.kuiperBelt.name = 'kuiperBelt';
        this.kuiperBelt.userData = {
            name: 'Kuiper Belt',
            type: 'Kuiper Belt',
            description: '🧊 The Kuiper Belt is a region beyond Neptune filled with icy bodies and dwarf planets including Pluto! It\'s like a giant donut of frozen objects left over from the solar system\'s formation. Short-period comets come from here!',
            funFact: 'The Kuiper Belt is 20 times wider than the asteroid belt and contains billions of objects!',
            count: kuiperCount
        };
        scene.add(this.kuiperBelt);
        this.objects.push(this.kuiperBelt);
    }

    createOrbitalPaths(scene) {
        const orbitalData = [
            { distance: 20, color: 0x888888 },   // Mercury
            { distance: 30, color: 0x888888 },   // Venus
            { distance: 45, color: 0x4488FF },   // Earth
            { distance: 60, color: 0x888888 },   // Mars
            { distance: 100, color: 0x888888 },  // Jupiter
            { distance: 150, color: 0x888888 },  // Saturn
            { distance: 200, color: 0x888888 },  // Uranus
            { distance: 250, color: 0x888888 },  // Neptune
            { distance: 300, color: 0x666666 }   // Pluto
        ];

        orbitalData.forEach(orbit => {
            const curve = new THREE.EllipseCurve(
                0, 0,
                orbit.distance, orbit.distance,
                0, 2 * Math.PI,
                false,
                0
            );

            const points = curve.getPoints(128);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: orbit.color,
                transparent: true,
                opacity: 0.2
            });

            const orbitLine = new THREE.Line(geometry, material);
            orbitLine.rotation.x = Math.PI / 2;
            scene.add(orbitLine);
            this.orbits.push(orbitLine);
        });
    }

    createStarfield(scene) {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 15000 + Math.random() * 10000;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Realistic star colors (red, yellow, white, blue)
            const starType = Math.random();
            if (starType < 0.2) {
                // Red stars
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 0.3 + Math.random() * 0.3;
                colors[i * 3 + 2] = 0.1;
            } else if (starType < 0.5) {
                // Yellow stars
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 2] = 0.5 + Math.random() * 0.3;
            } else if (starType < 0.85) {
                // White stars
                const white = 0.9 + Math.random() * 0.1;
                colors[i * 3] = white;
                colors[i * 3 + 1] = white;
                colors[i * 3 + 2] = white;
            } else {
                // Blue stars
                colors[i * 3] = 0.6 + Math.random() * 0.2;
                colors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
                colors[i * 3 + 2] = 1;
            }

            sizes[i] = 1 + Math.random() * 2;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: false,
            blending: THREE.AdditiveBlending
        });

        this.starfield = new THREE.Points(starGeometry, starMaterial);
        this.starfield.name = 'starfield';
        this.starfield.frustumCulled = false;
        scene.add(this.starfield);
    }

    createDistantStars(scene) {
        // Create recognizable star systems and bright stars
        this.distantStars = [];
        
        const brightStars = [
            { name: 'Sirius', color: 0xFFFFFF, size: 8, distance: 8000, angle: 0, tilt: 0.5, description: '⭐ Sirius is the brightest star in Earth\'s night sky! It\'s actually a binary system with two stars orbiting each other. Located 8.6 light-years away in the constellation Canis Major.' },
            { name: 'Betelgeuse', color: 0xFF4500, size: 12, distance: 7500, angle: Math.PI / 3, tilt: 0.8, description: '🔴 Betelgeuse is a red supergiant star nearing the end of its life! It\'s so big that if placed at our Sun\'s position, it would extend past Mars. Will explode as a supernova someday!' },
            { name: 'Rigel', color: 0x87CEEB, size: 10, distance: 8500, angle: Math.PI * 2 / 3, tilt: -0.6, description: '💙 Rigel is a blue supergiant, one of the most luminous stars visible to the naked eye! It\'s 40,000 times more luminous than our Sun and located 860 light-years away.' },
            { name: 'Vega', color: 0xF0F8FF, size: 7, distance: 7800, angle: Math.PI, tilt: 0.3, description: '🌟 Vega is one of the brightest stars in the northern sky! It was the North Star 12,000 years ago and will be again in 13,000 years due to Earth\'s axial precession.' },
            { name: 'Polaris', color: 0xFFFACD, size: 6, distance: 9000, angle: Math.PI * 1.5, tilt: 0.9, description: '🧭 Polaris, the North Star, has guided travelers for centuries! It\'s actually a triple star system and is currently very close to true north due to Earth\'s rotation axis.' }
        ];

        brightStars.forEach(starData => {
            const geometry = new THREE.SphereGeometry(starData.size, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: starData.color,
                transparent: true,
                opacity: 0.9
            });
            
            const star = new THREE.Mesh(geometry, material);
            const x = starData.distance * Math.cos(starData.angle);
            const z = starData.distance * Math.sin(starData.angle);
            const y = starData.distance * starData.tilt;
            star.position.set(x, y, z);
            
            // Add glow
            const glowGeo = new THREE.SphereGeometry(starData.size * 1.5, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: starData.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            star.add(glow);
            
            star.userData = {
                name: starData.name,
                type: 'Distant Star',
                radius: starData.size,
                description: starData.description,
                distance: 'Light-years away',
                realSize: `${starData.size} solar radii`,
                funFact: starData.name === 'Betelgeuse' ? 'Betelgeuse could go supernova any day now (astronomically speaking - could be tomorrow or 100,000 years!)' : 
                         starData.name === 'Sirius' ? 'Sirius is actually getting closer to us - it will be at its closest in about 60,000 years!' :
                         'This star is visible to the naked eye from Earth!'
            };
            
            scene.add(star);
            this.objects.push(star);
            this.distantStars.push(star);
        });
    }

    createNebulae(scene) {
        // Create colorful nebulae
        this.nebulae = [];
        
        const nebulaeData = [
            { name: 'Orion Nebula', color: 0xFF69B4, position: { x: 6000, y: 1000, z: 3000 }, size: 400, description: '🌌 The Orion Nebula is a stellar nursery where new stars are being born! It\'s 1,344 light-years away and is visible to the naked eye as a fuzzy patch in Orion\'s sword. Contains over 3,000 stars!' },
            { name: 'Crab Nebula', color: 0x87CEEB, position: { x: -5500, y: -800, z: 4500 }, size: 300, description: '🦀 The Crab Nebula is the remnant of a supernova explosion observed by Chinese astronomers in 1054 AD! At its center is a pulsar spinning 30 times per second!' },
            { name: 'Ring Nebula', color: 0x9370DB, position: { x: 4500, y: 1500, z: -5000 }, size: 250, description: '💍 The Ring Nebula is a planetary nebula - the glowing remains of a dying Sun-like star! The star at its center has blown off its outer layers, creating this beautiful ring.' }
        ];

        nebulaeData.forEach(nebData => {
            // Create particle cloud for nebula
            const particleCount = 2000;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            
            const color = new THREE.Color(nebData.color);
            
            for (let i = 0; i < particleCount; i++) {
                // Spherical distribution
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const radius = nebData.size * (0.5 + Math.random() * 0.5);
                
                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);
                
                // Vary colors slightly
                const colorVariation = 0.8 + Math.random() * 0.2;
                colors[i * 3] = color.r * colorVariation;
                colors[i * 3 + 1] = color.g * colorVariation;
                colors[i * 3 + 2] = color.b * colorVariation;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const material = new THREE.PointsMaterial({
                size: 5,
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const nebula = new THREE.Points(geometry, material);
            nebula.position.set(nebData.position.x, nebData.position.y, nebData.position.z);
            
            nebula.userData = {
                name: nebData.name,
                type: 'Nebula',
                radius: nebData.size,
                description: nebData.description,
                distance: 'Thousands of light-years',
                funFact: nebData.name === 'Orion Nebula' ? 'New stars are being born here right now!' :
                         nebData.name === 'Crab Nebula' ? 'It\'s expanding at 1,500 km/s!' :
                         'Planetary nebulae have nothing to do with planets - they just look round like planets through old telescopes!'
            };
            
            scene.add(nebula);
            this.objects.push(nebula);
            this.nebulae.push(nebula);
        });
    }

    createGalaxies(scene) {
        // Create distant galaxies
        this.galaxies = [];
        
        const galaxiesData = [
            { name: 'Andromeda Galaxy', position: { x: 12000, y: 2000, z: -8000 }, size: 600, type: 'spiral', description: '🌀 The Andromeda Galaxy is our nearest large galactic neighbor, 2.5 million light-years away! It contains 1 trillion stars and is on a collision course with the Milky Way (don\'t worry, collision in 4.5 billion years).' },
            { name: 'Whirlpool Galaxy', position: { x: -10000, y: -1500, z: -9000 }, size: 400, type: 'spiral', description: '🌊 The Whirlpool Galaxy (M51) is famous for its beautiful spiral arms! It\'s interacting with a smaller companion galaxy, creating stunning tidal forces and new star formation.' },
            { name: 'Sombrero Galaxy', position: { x: -8000, y: 3000, z: 7000 }, size: 350, type: 'elliptical', description: '🎩 The Sombrero Galaxy looks like a Mexican hat! It has a bright nucleus, an unusually large central bulge, and a prominent dust lane. Contains 2,000 globular clusters!' }
        ];

        galaxiesData.forEach(galData => {
            const group = new THREE.Group();
            
            // Create spiral or elliptical structure
            if (galData.type === 'spiral') {
                // Spiral arms
                const spiralCount = 8000;
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(spiralCount * 3);
                const colors = new Float32Array(spiralCount * 3);
                
                for (let i = 0; i < spiralCount; i++) {
                    const angle = (i / spiralCount) * Math.PI * 6; // Multiple spirals
                    const distance = (i / spiralCount) * galData.size;
                    const spiral = 0.3;
                    
                    positions[i * 3] = distance * Math.cos(angle) + (Math.random() - 0.5) * 30;
                    positions[i * 3 + 1] = (Math.random() - 0.5) * galData.size * 0.1;
                    positions[i * 3 + 2] = distance * Math.sin(angle) * spiral + (Math.random() - 0.5) * 30;
                    
                    const brightness = 0.7 + Math.random() * 0.3;
                    colors[i * 3] = brightness;
                    colors[i * 3 + 1] = brightness * 0.9;
                    colors[i * 3 + 2] = brightness * 1.1;
                }
                
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                
                const material = new THREE.PointsMaterial({
                    size: 3,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending
                });
                
                const spiral = new THREE.Points(geometry, material);
                group.add(spiral);
            } else {
                // Elliptical galaxy
                const ellipCount = 5000;
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(ellipCount * 3);
                const colors = new Float32Array(ellipCount * 3);
                
                for (let i = 0; i < ellipCount; i++) {
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const radius = Math.pow(Math.random(), 0.7) * galData.size;
                    
                    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
                    positions[i * 3 + 2] = radius * Math.cos(phi);
                    
                    const brightness = 0.8 + Math.random() * 0.2;
                    colors[i * 3] = brightness * 1.0;
                    colors[i * 3 + 1] = brightness * 0.9;
                    colors[i * 3 + 2] = brightness * 0.7;
                }
                
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                
                const material = new THREE.PointsMaterial({
                    size: 3,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending
                });
                
                const elliptical = new THREE.Points(geometry, material);
                group.add(elliptical);
            }
            
            // Core
            const coreGeo = new THREE.SphereGeometry(galData.size * 0.1, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xFFFFDD,
                transparent: true,
                opacity: 0.9
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            group.add(core);
            
            group.position.set(galData.position.x, galData.position.y, galData.position.z);
            group.rotation.x = Math.random() * Math.PI * 0.3;
            group.rotation.y = Math.random() * Math.PI * 2;
            
            group.userData = {
                name: galData.name,
                type: 'Galaxy',
                radius: galData.size,
                description: galData.description,
                distance: 'Millions of light-years',
                realSize: '100,000+ light-years across',
                funFact: galData.name === 'Andromeda Galaxy' ? 'Andromeda is approaching us at 110 km/s!' :
                         galData.name === 'Whirlpool Galaxy' ? 'You can see this galaxy with a good pair of binoculars!' :
                         'Despite billions of stars, galaxies are mostly empty space!'
            };
            
            scene.add(group);
            this.objects.push(group);
            this.galaxies.push(group);
        });
    }

    createComets(scene) {
        // Create comets with REALISTIC sizes (typically 1-60 km)
        // Halley: ~15 km, Hale-Bopp: ~60 km, NEOWISE: ~5 km
        this.comets = [];
        
        const cometsData = [
            // Halley: 15 km / 12,742 km = 0.0012
            { name: 'Halley\'s Comet', distance: 200, eccentricity: 0.967, speed: 0.001, size: 0.002, description: '☄️ Halley\'s Comet is the most famous comet! It returns to Earth\'s vicinity every 75-76 years. Last seen in 1986, it will return in 2061. When you see it, you\'re viewing a 4.6 billion year old cosmic snowball!' },
            // Hale-Bopp: 60 km / 12,742 km = 0.0047
            { name: 'Comet Hale-Bopp', distance: 250, eccentricity: 0.995, speed: 0.0008, size: 0.005, description: '☄️ Hale-Bopp was one of the brightest comets of the 20th century, visible to the naked eye for 18 months in 1996-1997! Its nucleus is unusually large at 60 km in diameter.' },
            // NEOWISE: 5 km / 12,742 km = 0.0004
            { name: 'Comet NEOWISE', distance: 180, eccentricity: 0.999, speed: 0.0012, size: 0.001, description: '☄️ Comet NEOWISE was a spectacular sight in July 2020! It won\'t return for about 6,800 years. Comets are \"dirty snowballs\" made of ice, dust, and rock from the solar system\'s formation.' }
        ];

        cometsData.forEach((cometData, index) => {
            // Comet nucleus - icy, rocky core
            const geometry = new THREE.SphereGeometry(cometData.size, 24, 24);
            const material = new THREE.MeshStandardMaterial({
                color: 0xe8f4f8, // Icy white-blue
                roughness: 0.8,
                metalness: 0.2,
                emissive: 0x4488cc,
                emissiveIntensity: 0.2
            });
            
            const comet = new THREE.Mesh(geometry, material);
            
            // Coma - glowing cloud of gas around nucleus
            const comaGeo = new THREE.SphereGeometry(cometData.size * 3, 32, 32);
            const comaMat = new THREE.MeshBasicMaterial({
                color: 0x88ddff,
                transparent: true,
                opacity: 0.15,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const coma = new THREE.Mesh(comaGeo, comaMat);
            comet.add(coma);
            
            // Inner glow
            const glowGeo = new THREE.SphereGeometry(cometData.size * 1.8, 24, 24);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xccffff,
                transparent: true,
                opacity: 0.4,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            comet.add(glow);
            
            // Main tail (dust tail) - curved, yellowish
            const dustTailGeometry = new THREE.BufferGeometry();
            const dustTailPositions = new Float32Array(200 * 3);
            const dustTailColors = new Float32Array(200 * 3);
            const dustTailSizes = new Float32Array(200);
            
            for (let i = 0; i < 200; i++) {
                const t = i / 200;
                dustTailSizes[i] = 3 * (1 - t * 0.7); // Decrease size along tail
                // Color gradient from white-blue to orange-yellow
                dustTailColors[i * 3] = 0.8 + t * 0.2;     // R
                dustTailColors[i * 3 + 1] = 0.9 - t * 0.3; // G  
                dustTailColors[i * 3 + 2] = 1.0 - t * 0.6; // B
            }
            
            dustTailGeometry.setAttribute('position', new THREE.BufferAttribute(dustTailPositions, 3));
            dustTailGeometry.setAttribute('color', new THREE.BufferAttribute(dustTailColors, 3));
            dustTailGeometry.setAttribute('size', new THREE.BufferAttribute(dustTailSizes, 1));
            
            const dustTailMaterial = new THREE.PointsMaterial({
                vertexColors: true,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const dustTail = new THREE.Points(dustTailGeometry, dustTailMaterial);
            comet.add(dustTail);
            
            // Ion tail - straight, blue-white
            const ionTailGeometry = new THREE.BufferGeometry();
            const ionTailPositions = new Float32Array(150 * 3);
            const ionTailSizes = new Float32Array(150);
            
            for (let i = 0; i < 150; i++) {
                const t = i / 150;
                ionTailSizes[i] = 2 * (1 - t * 0.8);
            }
            
            ionTailGeometry.setAttribute('position', new THREE.BufferAttribute(ionTailPositions, 3));
            ionTailGeometry.setAttribute('size', new THREE.BufferAttribute(ionTailSizes, 1));
            
            const ionTailMaterial = new THREE.PointsMaterial({
                color: 0x88ccff,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            const ionTail = new THREE.Points(ionTailGeometry, ionTailMaterial);
            comet.add(ionTail);
            
            comet.userData = {
                name: cometData.name,
                type: 'Comet',
                radius: cometData.size,
                distance: cometData.distance,
                angle: Math.random() * Math.PI * 2,
                speed: cometData.speed,
                eccentricity: cometData.eccentricity,
                description: cometData.description,
                realSize: '1-10 km nucleus',
                funFact: 'Comets have two tails: a curved dust tail (yellowish) and a straight ion tail (blue) - both always point away from the Sun!',
                dustTail: dustTail,
                ionTail: ionTail
            };
            
            scene.add(comet);
            this.objects.push(comet);
            this.comets.push(comet);
        });
    }

    createSatellites(scene) {
        // Create Earth satellites (ISS and important satellites)
        this.satellites = [];
        
        const satellitesData = [
            { 
                name: 'ISS (International Space Station)', 
                distance: 1.05,  // Orbital altitude: 408-410 km above Earth's surface (scaled)
                speed: 15.5,  // Orbital velocity: 7.66 km/s (27,576 km/h), completes 15.5 orbits/day
                size: 0.03,
                color: 0xCCCCCC,
                description: '🛰️ ISS orbits at 408 km altitude, traveling at 7.66 km/s (27,576 km/h). One orbit takes 92.68 minutes. Continuously inhabited since Nov 2, 2000 (25 years!). Collaboration of NASA, Roscosmos, ESA, JAXA, CSA. Completed 180,000+ orbits as of Oct 2025.',
                funFact: 'ISS is 109m long, 73m wide, masses 419,725 kg. Pressurized volume equals a Boeing 747! Visible to naked eye as brightest "star" after Venus.',
                realSize: '109m × 73m × 20m, 419,725 kg',
                orbitTime: '92.68 minutes'
            },
            { 
                name: 'Hubble Space Telescope', 
                distance: 1.08,  // Orbital altitude: ~535 km (varies due to atmospheric drag)
                speed: 15.1, // Orbital velocity: 7.59 km/s (27,300 km/h)
                size: 0.02,
                color: 0x4169E1,
                description: '🔭 Launched April 24, 1990 on Space Shuttle Discovery. Orbits at ~535 km altitude. Made 1.6+ million observations as of Oct 2025. 2.4m primary mirror observes UV, visible, and near-IR. Five servicing missions (1993-2009) upgraded instruments.',
                funFact: 'Can resolve objects 0.05 arcseconds apart - like seeing two fireflies 10,000 km away! Deepest image (eXtreme Deep Field) shows 5,500 galaxies, some 13.2 billion light-years away.',
                realSize: '13.2m long × 4.2m diameter, 11,110 kg',
                orbitTime: '95 minutes'
            },
            { 
                name: 'GPS Satellites', 
                distance: 3.5,  // Medium Earth Orbit (MEO): 20,180 km altitude (26,560 km from Earth center)
                speed: 2,  // Orbital velocity: 3.87 km/s, period: 11h 58min (2 orbits/day)
                size: 0.025,
                color: 0x00FF00,
                description: '📡 GPS (NAVSTAR) constellation: 31 operational satellites (as of Oct 2025) in 6 orbital planes, 55° inclination. Each satellite orbits at 20,180 km altitude. Transmits L-band signals (1.2-1.5 GHz). Rubidium/cesium atomic clocks accurate to 10⁻¹⁴ seconds.',
                funFact: 'Need 4 satellites for 3D position fix (trilateration + clock correction). System provides 5-10m accuracy. Military signal (P/Y code) accurate to centimeters!',
                realSize: 'GPS III: 2,161 kg, 7.8m solar span',
                orbitTime: '11h 58min'
            },
            { 
                name: 'James Webb Space Telescope', 
                distance: 250,  // At Sun-Earth L2 Lagrange point, 1.5 million km from Earth (scaled)
                speed: 0.01,  // Halo orbit around L2, period synced with Earth (1 year)
                size: 0.04,
                color: 0xFFD700,
                description: '🔬 Launched Dec 25, 2021. Reached L2 point Jan 24, 2022. First images released July 12, 2022. Observes infrared (0.6-28.5 μm). 6.5m segmented beryllium mirror (18 hexagons) with 25 m² collecting area - 6x Hubble! Sunshield: 21.2m × 14.2m, 5 layers.',
                funFact: 'Operating at -233°C (-388°F)! Can detect heat signature of a bumblebee at Moon distance. Discovered earliest galaxies at z=14 (280 million years after Big Bang).',
                realSize: '6.5m mirror, 21.2m × 14.2m sunshield, 6,161 kg',
                orbitTime: 'L2 halo orbit: ~6 months period'
            },
            { 
                name: 'Starlink Constellation', 
                distance: 1.09,  // Multiple shells: 340 km, 550 km, 570 km, 1,150 km, 1,275 km
                speed: 15, // Orbital velocity: ~7.6 km/s at 550 km altitude
                size: 0.015,
                color: 0xFF6B6B,
                description: '🛰️ SpaceX Starlink: 5,400+ operational satellites as of Oct 2025 (largest constellation ever). Provides broadband internet globally. Ku/Ka-band phased array antennas. Ion thrusters for station-keeping and deorbit. Gen2 satellites: 1,250 kg, laser inter-satellite links.',
                funFact: 'Launches 20-23 satellites per Falcon 9 flight. Over 300 launches! FCC approved up to 42,000 satellites. Each satellite deorbits after 5-7 years.',
                realSize: 'V1.5: 260 kg, 2.8m × 1.4m × 0.12m flat',
                orbitTime: '95 minutes (550 km shell)'
            }
        ];

        if (!this.planets.earth) {
            console.warn('Earth not found, cannot create satellites');
            return;
        }

        satellitesData.forEach((satData, index) => {
            // Satellite body
            const geometry = new THREE.BoxGeometry(satData.size, satData.size * 0.5, satData.size * 0.3);
            const material = new THREE.MeshStandardMaterial({
                color: satData.color,
                roughness: 0.4,
                metalness: 0.8,
                emissive: satData.color,
                emissiveIntensity: 0.3
            });
            
            const satellite = new THREE.Mesh(geometry, material);
            
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
            if (satData.name.includes('GPS') || satData.name.includes('Starlink')) {
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
            
            satellite.userData = {
                name: satData.name,
                type: 'Satellite',
                radius: satData.size,
                distance: satData.distance,
                angle: (Math.PI * 2 / satellitesData.length) * index, // Spread them out
                speed: satData.speed,
                description: satData.description,
                funFact: satData.funFact,
                realSize: satData.realSize,
                orbitTime: satData.orbitTime,
                planet: this.planets.earth,
                inclination: (index * 30) * Math.PI / 180 // Different orbital inclinations
            };
            
            scene.add(satellite);
            this.objects.push(satellite);
            this.satellites.push(satellite);
        });
    }

    createSpacecraft(scene) {
        // Deep space probes and interplanetary missions
        this.spacecraft = [];
        
        const spacecraftData = [
            {
                name: 'Voyager 1',
                distance: 300, // ~24.3 billion km from Sun as of Oct 2025 (162 AU) - scaled for visualization
                angle: Math.PI * 0.7, // Direction: 35° north of ecliptic plane
                speed: 0.0001, // Traveling at 17 km/s relative to Sun
                size: 0.08,
                color: 0xC0C0C0,
                type: 'probe',
                description: '🚀 Voyager 1 is the farthest human-made object from Earth! Launched Sept 5, 1977, it entered interstellar space on Aug 25, 2012. Currently 24.3 billion km (162 AU) from Sun. It carries the Golden Record with sounds and images of Earth.',
                funFact: 'Voyager 1 travels at 17 km/s (61,200 km/h). Its radio signals take 22.5 hours to reach Earth!',
                realSize: '825.5 kg, 3.7m antenna dish',
                launched: 'September 5, 1977',
                status: 'Active in Interstellar Space (since Aug 2012)'
            },
            {
                name: 'Voyager 2',
                distance: 280, // ~20.3 billion km from Sun as of Oct 2025 (135 AU) - scaled
                angle: Math.PI * 1.2, // Direction: Different trajectory than V1
                speed: 0.0001, // Traveling at 15.4 km/s relative to Sun
                size: 0.08,
                color: 0xB0B0B0,
                type: 'probe',
                description: '🚀 Voyager 2 is the only spacecraft to visit all four giant planets! Jupiter (Jul 1979), Saturn (Aug 1981), Uranus (Jan 1986), Neptune (Aug 1989). Entered interstellar space Nov 5, 2018. Now 20.3 billion km (135 AU) from Sun.',
                funFact: 'Voyager 2 discovered 16 moons across the giant planets, Neptune\'s Great Dark Spot, and Triton\'s geysers!',
                realSize: '825.5 kg, 3.7m antenna dish',
                launched: 'August 20, 1977',
                status: 'Active in Interstellar Space (since Nov 2018)'
            },
            {
                name: 'New Horizons',
                distance: 85, // ~8.9 billion km from Sun as of Oct 2025 (59 AU) - beyond Pluto orbit
                angle: Math.PI * 0.3,
                speed: 0.0002, // Traveling at 14.31 km/s relative to Sun
                size: 0.06,
                color: 0x4169E1,
                type: 'probe',
                description: '🪐 New Horizons gave us the first close-up images of Pluto on July 14, 2015! It revealed water ice mountains up to 3,500m tall, vast nitrogen glaciers, and the famous heart-shaped Tombaugh Regio. Now 59 AU from Sun, exploring Kuiper Belt.',
                funFact: 'New Horizons traveled 9.5 years and 5 billion km to reach Pluto at 58,536 km/h. It carries 1 oz of Clyde Tombaugh\'s ashes!',
                realSize: '478 kg, 0.7 × 2.1 × 2.7m (piano-sized)',
                launched: 'January 19, 2006',
                status: 'Active in Kuiper Belt'
            },
            {
                name: 'Parker Solar Probe',
                distance: 12, // Highly elliptical orbit: 6.9 million km (perihelion) to 108 million km (aphelion)
                angle: 0,
                speed: 0.5, // Peak velocity: 192 km/s (690,000 km/h) at perihelion - fastest human-made object
                size: 0.05,
                color: 0xFF6B35,
                type: 'probe',
                description: '☀️ Parker Solar Probe is "touching" the Sun! Launched Aug 12, 2018, it flies through the Sun\'s corona. At closest approach (6.9 million km from surface), it reaches 192 km/s (690,000 km/h)! Heat shield withstands 1,377°C while instruments stay at 30°C.',
                funFact: 'Parker completed 21 orbits as of Oct 2025. Final perihelion in Dec 2025 will reach 6.9 million km - into the corona!',
                realSize: '685 kg, 3m tall, 2.3m heat shield',
                launched: 'August 12, 2018',
                status: 'Active, 7-year mission (ends 2025)'
            },
            {
                name: 'Perseverance Rover (Mars)',
                orbitPlanet: 'mars',
                distance: 1.001, // On Mars surface at Jezero Crater (18.38°N 77.58°E)
                angle: 0.5,
                speed: 0,
                size: 0.04,
                color: 0xFF4500,
                type: 'rover',
                description: '🤖 Perseverance landed in Jezero Crater on Feb 18, 2021. Searching for biosignatures of ancient microbial life in a former lake delta. Has 23 cameras, 7 instruments, collects core samples for Mars Sample Return mission. Ingenuity helicopter completed 66+ flights!',
                funFact: 'First spacecraft to record sounds on Mars! MOXIE experiment produces oxygen from CO2 atmosphere. Has driven 28+ km as of Oct 2025.',
                realSize: '1,025 kg, 3m long × 2.7m wide × 2.2m tall',
                launched: 'July 30, 2020',
                status: 'Active on Mars Surface (1,352+ sols)'
            },
            {
                name: 'Curiosity Rover (Mars)',
                orbitPlanet: 'mars',
                distance: 1.001, // On Mars surface at Gale Crater, climbing Mount Sharp (4.5°S 137.4°E)
                angle: 0.8,
                speed: 0,
                size: 0.04,
                color: 0xDC143C,
                type: 'rover',
                description: '🤖 Curiosity landed in Gale Crater on Aug 6, 2012. Climbing Mount Sharp (Aeolis Mons), studying rock layers. Confirmed ancient Mars had water, organic molecules, and habitable conditions. Has 17 cameras, 10 science instruments, plutonium power source.',
                funFact: 'ChemCam laser can vaporize rocks from 7m away! Has driven 32+ km and climbed 625+ meters as of Oct 2025. Still going strong after 4,780+ sols!',
                realSize: '899 kg, 3m long × 2.8m wide × 2.1m tall',
                launched: 'November 26, 2011',
                status: 'Active on Mars Surface (4,780+ sols)'
            },
            {
                name: 'Apollo 11 Landing Site (Moon)',
                orbitPlanet: 'earth',
                isMoon: true,
                distance: 0.273, // On Moon surface
                angle: 1.2,
                speed: 0,
                size: 0.02,
                color: 0xFFD700,
                type: 'landing-site',
                description: '🌕 The historic Apollo 11 landing site where Neil Armstrong took "one small step for man" on July 20, 1969! The lunar module\'s descent stage, flag, and astronaut footprints remain preserved in the Sea of Tranquility.',
                funFact: 'The footprints will last millions of years because there\'s no wind or water on the Moon!',
                realSize: 'Tranquility Base',
                launched: '1969',
                status: 'Historic Site'
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
                description: '🪐 Juno entered Jupiter orbit July 4, 2016. Studies composition, gravity field, magnetic field, and polar auroras. Discovered Jupiter\'s core is larger and "fuzzy", massive polar cyclones, and atmospheric ammonia distribution. Extended mission until Sept 2025.',
                funFact: 'First solar-powered spacecraft at Jupiter! Three 9m solar panels generate 500W. Carries three LEGO figurines: Galileo, Jupiter, and Juno!',
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
                type: 'memorial',
                description: '🪐 Cassini orbited Saturn June 30, 2004 - Sept 15, 2017 (13 years). Discovered liquid methane/ethane lakes on Titan, water geysers on Enceladus, new rings, 7 new moons. Huygens probe landed on Titan Jan 14, 2005. Ended with atmospheric entry "Grand Finale".',
                funFact: 'Discovered Enceladus\' subsurface ocean! Water geysers shoot 250kg/s into space. Cassini flew through plumes, detected H2, organics - ingredients for life!',
                realSize: '5,600 kg, 6.8m tall, 4m wide',
                launched: 'October 15, 1997',
                status: 'Mission Ended Sept 15, 2017 (Memorial)'
            }
        ];

        spacecraftData.forEach(craft => {
            // Create spacecraft body
            let geometry, material;
            
            if (craft.type === 'probe' || craft.type === 'orbiter') {
                // Classic probe shape with antenna
                geometry = new THREE.SphereGeometry(craft.size * 0.5, 16, 16);
                material = new THREE.MeshStandardMaterial({
                    color: craft.color,
                    roughness: 0.7,
                    metalness: 0.6,
                    emissive: craft.color,
                    emissiveIntensity: 0.2
                });
            } else if (craft.type === 'rover') {
                // Box shape for rovers
                geometry = new THREE.BoxGeometry(craft.size, craft.size * 0.6, craft.size * 0.8);
                material = new THREE.MeshStandardMaterial({
                    color: craft.color,
                    roughness: 0.8,
                    metalness: 0.4,
                    emissive: craft.color,
                    emissiveIntensity: 0.15
                });
            } else if (craft.type === 'landing-site') {
                // Marker for landing site
                geometry = new THREE.CylinderGeometry(craft.size, craft.size * 1.5, craft.size * 2, 8);
                material = new THREE.MeshStandardMaterial({
                    color: craft.color,
                    roughness: 0.3,
                    metalness: 0.9,
                    emissive: craft.color,
                    emissiveIntensity: 0.5
                });
            } else {
                // Memorial/generic
                geometry = new THREE.OctahedronGeometry(craft.size * 0.6);
                material = new THREE.MeshStandardMaterial({
                    color: craft.color,
                    roughness: 0.5,
                    metalness: 0.7,
                    emissive: craft.color,
                    emissiveIntensity: 0.3
                });
            }
            
            const spacecraft = new THREE.Mesh(geometry, material);
            
            // Add antenna dish for probes
            if (craft.type === 'probe' || craft.type === 'orbiter') {
                const dishGeometry = new THREE.CylinderGeometry(craft.size * 1.2, craft.size * 1.5, craft.size * 0.1, 16);
                const dishMaterial = new THREE.MeshStandardMaterial({
                    color: 0xE0E0E0,
                    roughness: 0.3,
                    metalness: 0.9
                });
                const dish = new THREE.Mesh(dishGeometry, dishMaterial);
                dish.rotation.x = Math.PI / 2;
                dish.position.y = craft.size * 0.5;
                spacecraft.add(dish);
                
                // Add support boom
                const boomGeometry = new THREE.CylinderGeometry(craft.size * 0.05, craft.size * 0.05, craft.size * 2);
                const boomMaterial = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    roughness: 0.6,
                    metalness: 0.8
                });
                const boom = new THREE.Mesh(boomGeometry, boomMaterial);
                boom.position.x = craft.size * 0.8;
                spacecraft.add(boom);
            }
            
            // Add wheels for rovers
            if (craft.type === 'rover') {
                for (let i = 0; i < 4; i++) {
                    const wheelGeometry = new THREE.CylinderGeometry(craft.size * 0.2, craft.size * 0.2, craft.size * 0.15, 12);
                    const wheelMaterial = new THREE.MeshStandardMaterial({
                        color: 0x404040,
                        roughness: 0.9,
                        metalness: 0.3
                    });
                    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.x = (i % 2 === 0 ? 1 : -1) * craft.size * 0.5;
                    wheel.position.z = (i < 2 ? 1 : -1) * craft.size * 0.4;
                    wheel.position.y = -craft.size * 0.3;
                    spacecraft.add(wheel);
                }
            }
            
            // Add glow marker - MUCH BIGGER for distant spacecraft!
            // For distant probes (distance > 100), make glow proportional to distance so they're visible
            const glowSize = craft.distance > 100 ? 
                Math.max(craft.size * 1.8, craft.distance * 0.03) : // Min 3% of distance for far objects
                craft.size * 1.8; // Normal size for nearby objects
            
            console.log(`🔆 ${craft.name} glow size: ${glowSize.toFixed(2)} (distance: ${craft.distance}, base size: ${craft.size})`);
            
            const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: craft.color,
                transparent: true,
                opacity: 0.25, // Increased from 0.15 for better visibility
                blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            spacecraft.add(glow);
            
            spacecraft.userData = {
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
                isSpacecraft: true
            };
            
            // Position spacecraft
            if (craft.orbitPlanet) {
                // Position relative to planet
                const planet = this.planets[craft.orbitPlanet];
                if (planet) {
                    if (craft.isMoon && planet.userData.moons && planet.userData.moons[0]) {
                        // Position on Moon surface
                        const moon = planet.userData.moons[0];
                        const moonDist = moon.userData.distance;
                        spacecraft.position.x = moonDist * Math.cos(craft.angle);
                        spacecraft.position.z = moonDist * Math.sin(craft.angle);
                        spacecraft.position.y = craft.size * 2; // Slightly above surface
                        moon.add(spacecraft);
                    } else {
                        // Position relative to planet
                        spacecraft.position.x = craft.distance * Math.cos(craft.angle);
                        spacecraft.position.z = craft.distance * Math.sin(craft.angle);
                        planet.add(spacecraft);
                    }
                }
            } else {
                // Deep space probe - position in solar system
                spacecraft.position.x = craft.distance * Math.cos(craft.angle);
                spacecraft.position.z = craft.distance * Math.sin(craft.angle);
                scene.add(spacecraft);
            }
            
            this.objects.push(spacecraft);
            this.spacecraft.push(spacecraft);
        });
        
        console.log(`✨ Created ${this.spacecraft.length} spacecraft, rovers, and landing sites!`);
    }

    update(deltaTime, timeSpeed, camera, controls) {
        // Get pause mode from sceneManager
        const app = window.app || {};
        const sceneManager = app.sceneManager || {};
        const pauseMode = sceneManager.pauseMode || 'none';
        
        // Calculate effective time speeds based on pause mode
        let orbitalSpeed = timeSpeed; // Solar system orbits
        let rotationSpeed = timeSpeed; // Planet rotations
        let moonSpeed = timeSpeed; // Moon orbits
        
        if (pauseMode === 'all') {
            // Pause everything
            orbitalSpeed = 0;
            rotationSpeed = 0;
            moonSpeed = 0;
        } else if (pauseMode === 'orbital') {
            // Pause only solar orbits, keep rotations and moon orbits
            orbitalSpeed = 0; // Freeze planets in their solar orbit
            rotationSpeed = timeSpeed; // Keep planets rotating
            moonSpeed = timeSpeed; // Keep moons orbiting their planets
        }
        // else 'none' - everything moves normally
        
        // Update all planets
        Object.values(this.planets).forEach(planet => {
            if (planet && planet.userData) {
                // Solar orbit (affected by orbital pause)
                planet.userData.angle += planet.userData.speed * orbitalSpeed;
                planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
                planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
                
                // Planet rotation (affected by rotation speed)
                planet.rotation.y += planet.userData.rotationSpeed * rotationSpeed;
                
                // Rotate clouds slightly faster than planet for Earth
                if (planet.userData.clouds) {
                    planet.userData.clouds.rotation.y += planet.userData.rotationSpeed * rotationSpeed * 1.1;
                }

                // Update moons - orbit around their parent planet
                if (planet.userData.moons && planet.userData.moons.length > 0) {
                    planet.userData.moons.forEach(moon => {
                        if (moon.userData) {
                            // Moons orbit their planet (affected by moonSpeed)
                            moon.userData.angle += moon.userData.speed * moonSpeed;
                            moon.position.x = moon.userData.distance * Math.cos(moon.userData.angle);
                            moon.position.z = moon.userData.distance * Math.sin(moon.userData.angle);
                            moon.position.y = 0; // Keep moons in planet's equatorial plane
                            
                            // Rotate moon on its axis
                            if (moon.userData.rotationSpeed) {
                                moon.rotation.y += moon.userData.rotationSpeed * rotationSpeed;
                            }
                            
                            // Debug: Log moon position occasionally
                            if (Math.random() < 0.001 && moon.userData.name === 'Moon') {
                                console.log(`🌙 Moon orbiting Earth: angle=${moon.userData.angle.toFixed(2)}, x=${moon.position.x.toFixed(1)}, z=${moon.position.z.toFixed(1)}`);
                            }
                        }
                    });
                }
            }
        });
        
        // Keep camera focused on selected object if it's moving
        if (this.focusedObject && camera && controls) {
            const targetPosition = new THREE.Vector3();
            this.focusedObject.getWorldPosition(targetPosition);
            
            // Calculate the offset from target to camera
            const cameraOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
            
            // Update both target and camera position to maintain relative view
            controls.target.copy(targetPosition);
            camera.position.copy(targetPosition).add(cameraOffset);
            
            controls.update();
        }

        // Rotate asteroid and Kuiper belts slowly
        if (this.asteroidBelt) {
            this.asteroidBelt.rotation.y += 0.0001 * timeSpeed;
        }
        if (this.kuiperBelt) {
            this.kuiperBelt.rotation.y += 0.00005 * timeSpeed;
        }

        // Rotate sun and animate surface activity
        if (this.sun) {
            this.sun.rotation.y += 0.001 * timeSpeed;
            
            // Animate solar flares (optimized - update every 2 frames)
            if (this.sun.userData.flares && (this._sunFlareFrame || 0) % 2 === 0) {
                const time = Date.now() * 0.001;
                const sizes = this.sun.userData.flares.geometry.attributes.size.array;
                const len = sizes.length;
                
                // Pre-calculate random values (less Math.random() calls)
                for (let i = 0; i < len; i++) {
                    sizes[i] = 1 + Math.sin(time + i * 0.5) * 1.5 + (i % 3) * 0.2;
                }
                this.sun.userData.flares.geometry.attributes.size.needsUpdate = true;
            }
            this._sunFlareFrame = (this._sunFlareFrame || 0) + 1;
        }

        // Twinkle stars slightly (optimized - only every 5 frames)
        if (this.starfield && this._starTwinkleFrame % 5 === 0 && Math.random() < 0.3) {
            const sizes = this.starfield.geometry.attributes.size.array;
            // Reduce updates to 30 stars instead of 50
            for (let i = 0; i < 30; i++) {
                const idx = Math.floor(Math.random() * sizes.length);
                sizes[idx] = 1 + Math.random() * 2;
            }
            this.starfield.geometry.attributes.size.needsUpdate = true;
        }
        this._starTwinkleFrame = (this._starTwinkleFrame || 0) + 1;
        
        // Update comets with elliptical orbits (optimized)
        if (this.comets) {
            this.comets.forEach(comet => {
                const userData = comet.userData;
                userData.angle += userData.speed * timeSpeed;
                
                // Elliptical orbit calculation
                const e = userData.eccentricity;
                const a = userData.distance;
                const angle = userData.angle;
                
                // Pre-calculate trig values (avoid redundant calculations)
                const cosAngle = Math.cos(angle);
                const sinAngle = Math.sin(angle);
                
                // Simplified elliptical orbit
                const r = a * (1 - e * e) / (1 + e * cosAngle);
                comet.position.x = r * cosAngle;
                comet.position.z = r * sinAngle;
                comet.position.y = Math.sin(angle * 0.5) * 20;
                
                // Show/hide comet tails based on toggle
                if (userData.dustTail) {
                    userData.dustTail.visible = this.cometTailsVisible;
                }
                if (userData.ionTail) {
                    userData.ionTail.visible = this.cometTailsVisible;
                }
                
                // Only update tails if they're visible
                if (!this.cometTailsVisible) {
                    userData.frameCount = (userData.frameCount || 0) + 1;
                    return;
                }
                
                // Cache direction vectors (reuse objects to avoid GC)
                if (!userData._sunDir) userData._sunDir = new THREE.Vector3();
                if (!userData._velDir) userData._velDir = new THREE.Vector3();
                
                userData._sunDir.set(-comet.position.x, -comet.position.y, -comet.position.z).normalize();
                userData._velDir.set(Math.cos(angle + Math.PI/2), 0, Math.sin(angle + Math.PI/2)).normalize();
                
                // Update dust tail (only every 3 frames for performance)
                if (userData.dustTail && userData.frameCount % 3 === 0) {
                    const dustPositions = userData.dustTail.geometry.attributes.position.array;
                    const dustSizes = userData.dustTail.geometry.attributes.size.array;
                    
                    const curveFactor = 0.3;
                    for (let i = 0; i < 200; i++) {
                        const t = i / 200;
                        const length = 80 * t;
                        
                        // Curve effect - pre-calculated
                        const dirX = userData._sunDir.x + userData._velDir.x * curveFactor * t;
                        const dirY = userData._sunDir.y + userData._velDir.y * curveFactor * t;
                        const dirZ = userData._sunDir.z + userData._velDir.z * curveFactor * t;
                        const normFactor = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
                        
                        // Add spread
                        const spread = (Math.random() - 0.5) * 15 * t;
                        const spreadPerpendicular = (Math.random() - 0.5) * 8 * t;
                        
                        dustPositions[i * 3] = dirX * normFactor * length + spread;
                        dustPositions[i * 3 + 1] = dirY * normFactor * length + spreadPerpendicular;
                        dustPositions[i * 3 + 2] = dirZ * normFactor * length + spread;
                        
                        // Vary size (less random() calls)
                        dustSizes[i] = 3 * (1 - t * 0.7) * (0.9 + (i % 5) * 0.05);
                    }
                    userData.dustTail.geometry.attributes.position.needsUpdate = true;
                    userData.dustTail.geometry.attributes.size.needsUpdate = true;
                }
                
                // Update ion tail (only every 2 frames for performance)
                if (userData.ionTail && userData.frameCount % 2 === 0) {
                    const ionPositions = userData.ionTail.geometry.attributes.position.array;
                    const sunDirX = userData._sunDir.x;
                    const sunDirY = userData._sunDir.y;
                    const sunDirZ = userData._sunDir.z;
                    
                    for (let i = 0; i < 150; i++) {
                        const t = i / 150;
                        const length = 120 * t;
                        const spread = (Math.random() - 0.5) * 3 * t;
                        
                        ionPositions[i * 3] = sunDirX * length + spread;
                        ionPositions[i * 3 + 1] = sunDirY * length + spread;
                        ionPositions[i * 3 + 2] = sunDirZ * length + spread;
                    }
                    userData.ionTail.geometry.attributes.position.needsUpdate = true;
                }
                
                userData.frameCount = (userData.frameCount || 0) + 1;
            });
        }
        
        // Update satellites orbiting Earth
        if (this.satellites) {
            this.satellites.forEach(satellite => {
                const userData = satellite.userData;
                if (userData.planet) {
                    userData.angle += userData.speed * timeSpeed * 0.01; // Scale down for realistic orbit times
                    
                    // Get Earth's world position
                    const earthPosition = new THREE.Vector3();
                    userData.planet.getWorldPosition(earthPosition);
                    
                    // Calculate satellite position relative to Earth with inclination
                    const cosAngle = Math.cos(userData.angle);
                    const sinAngle = Math.sin(userData.angle);
                    const cosIncl = Math.cos(userData.inclination);
                    const sinIncl = Math.sin(userData.inclination);
                    
                    satellite.position.x = earthPosition.x + userData.distance * cosAngle;
                    satellite.position.y = earthPosition.y + userData.distance * sinAngle * sinIncl;
                    satellite.position.z = earthPosition.z + userData.distance * sinAngle * cosIncl;
                    
                    // Rotate satellite to face Earth
                    satellite.lookAt(earthPosition);
                }
            });
        }
        
        // Update spacecraft (Voyagers, probes, orbiters)
        if (this.spacecraft) {
            this.spacecraft.forEach(craft => {
                const userData = craft.userData;
                
                // Deep space probes keep moving away
                if (!userData.orbitPlanet && userData.speed) {
                    userData.angle += userData.speed * timeSpeed * 0.001;
                    craft.position.x = userData.distance * Math.cos(userData.angle);
                    craft.position.z = userData.distance * Math.sin(userData.angle);
                }
                
                // Orbiters around planets (Juno, Cassini legacy, etc)
                if (userData.orbitPlanet && userData.speed && userData.type === 'orbiter') {
                    userData.angle += userData.speed * timeSpeed * 0.01;
                    const radius = userData.distance;
                    craft.position.x = radius * Math.cos(userData.angle);
                    craft.position.z = radius * Math.sin(userData.angle);
                    craft.position.y = Math.sin(userData.angle * 2) * radius * 0.1; // Inclined orbit
                }
                
                // Rotate spacecraft slowly
                if (userData.type === 'probe' || userData.type === 'orbiter') {
                    craft.rotation.y += 0.002 * timeSpeed;
                }
            });
        }
        
        // Rotate nebulae slowly (optimized - pre-calculate time)
        if (this.nebulae) {
            const time = Date.now() * 0.0005;
            const scale = 1 + Math.sin(time) * 0.05;
            
            this.nebulae.forEach(nebula => {
                nebula.rotation.y += 0.0001 * timeSpeed;
                // Pulsing effect (shared calculation)
                nebula.scale.setScalar(scale);
            });
        }
        
        // Rotate galaxies
        if (this.galaxies) {
            this.galaxies.forEach(galaxy => {
                galaxy.rotation.y += 0.0002 * timeSpeed;
            });
        }
        
        // Twinkle distant stars
        if (this.distantStars) {
            this.distantStars.forEach(star => {
                if (Math.random() < 0.01) {
                    const scale = 0.9 + Math.random() * 0.2;
                    star.scale.setScalar(scale);
                }
            });
        }
    }

    cleanup(scene) {
        // Dispose materials only (geometries are cached and reused)
        this.objects.forEach(obj => {
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            scene.remove(obj);
        });
        
        // Clean up starfield
        if (this.starfield) {
            if (this.starfield.geometry) this.starfield.geometry.dispose();
            if (this.starfield.material) this.starfield.material.dispose();
            scene.remove(this.starfield);
        }

        // Clean up orbital paths
        this.orbits.forEach(orbit => {
            if (orbit.geometry) orbit.geometry.dispose();
            if (orbit.material) orbit.material.dispose();
            scene.remove(orbit);
        });

        // Remove sun light
        const sunLight = scene.getObjectByName('sunLight');
        if (sunLight) scene.remove(sunLight);

        // Dispose cached geometries when fully cleaning up
        this.geometryCache.forEach(geo => geo.dispose());
        this.geometryCache.clear();

        this.objects = [];
        this.planets = {};
        this.moons = {};
        this.sun = null;
        this.starfield = null;
        this.asteroidBelt = null;
        this.kuiperBelt = null;
        this.orbits = [];
    }

    getSelectableObjects() {
        return this.objects;
    }
    
    updateScale() {
        // Update all planetary positions based on scale mode
        const scaleFactors = this.realisticScale ? {
            // Realistic scale (AU converted to scene units, 1 AU = 150 units)
            mercury: 57.9,
            venus: 108.2,
            earth: 150,
            mars: 227.9,
            jupiter: 778.6,
            saturn: 1433.5,
            uranus: 2872.5,
            neptune: 4495.1,
            pluto: 5906.4
        } : {
            // Educational scale (compressed for visibility)
            mercury: 20,
            venus: 30,
            earth: 45,
            mars: 60,
            jupiter: 100,
            saturn: 150,
            uranus: 200,
            neptune: 250,
            pluto: 300
        };
        
        // Update planet distances
        Object.entries(this.planets).forEach(([name, planet]) => {
            if (planet && planet.userData) {
                const newDistance = scaleFactors[name];
                if (newDistance) {
                    planet.userData.distance = newDistance;
                }
            }
        });
        
        console.log(`Scale mode: ${this.realisticScale ? 'Realistic' : 'Educational'}`);
    }

    getObjectInfo(object) {
        const userData = object.userData;
        let info = {
            name: userData.name || 'Unknown',
            type: userData.type || 'Object',
            distance: userData.distance === 0 ? 'Center of Solar System' : 
                      userData.parentPlanet ? `Orbits ${userData.parentPlanet}` :
                      `${userData.distance.toFixed(1)} million km from Sun`,
            size: userData.realSize || `${userData.radius?.toFixed(2)} units`,
            description: userData.description || 'No description available'
        };

        // Add fun facts for kids
        if (userData.funFact) {
            info.description += `\n\n💡 ${userData.funFact}`;
        }

        // Add moon count for planets
        if (userData.moonCount > 0) {
            info.description += `\n\n🌙 This planet has ${userData.moonCount} major moon${userData.moonCount > 1 ? 's' : ''} shown here (many more small ones exist!)`;
        }

        return info;
    }

    focusOnObject(object, camera, controls) {
        const distance = Math.max(object.userData.radius * 5, 10);
        const targetPosition = new THREE.Vector3();
        object.getWorldPosition(targetPosition);
        
        // Store reference for tracking
        this.focusedObject = object;
        
        // Configure controls for focused object inspection
        const originalMinDistance = controls.minDistance;
        const originalMaxDistance = controls.maxDistance;
        
        // Set dynamic zoom limits based on object size
        controls.minDistance = object.userData.radius * 1.5; // Can zoom in close
        controls.maxDistance = object.userData.radius * 50;  // Can zoom out far
        
        // Enable full rotation around object
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.autoRotate = false;
        
        // Smooth camera transition
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const endPos = new THREE.Vector3(
            targetPosition.x,
            targetPosition.y + distance * 0.3,
            targetPosition.z + distance
        );
        
        const duration = 1500;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            // Update target position if object is moving
            if (object.userData.angle !== undefined) {
                object.getWorldPosition(targetPosition);
            }
            
            camera.position.lerpVectors(startPos, endPos, eased);
            controls.target.copy(targetPosition);
            controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - controls are now centered on object
                // User can now freely rotate, zoom, and pan around the focused object
                console.log(`🎯 Focused on ${object.userData.name} - Use mouse to rotate, scroll to zoom`);
            }
        };
        
        animate();
        
        // Store original limits to restore later if needed
        object.userData._originalMinDistance = originalMinDistance;
        object.userData._originalMaxDistance = originalMaxDistance;
    }

    getExplorerContent(focusCallback) {
        const categories = [
            {
                title: '⭐ The Sun',
                items: [
                    { name: '☀️ Sun', onClick: () => focusCallback(this.sun) }
                ]
            },
            {
                title: '🪨 Inner Planets (Rocky)',
                items: [
                    { name: '☿️ Mercury', onClick: () => focusCallback(this.planets.mercury) },
                    { name: '♀️ Venus', onClick: () => focusCallback(this.planets.venus) },
                    { name: '🌍 Earth', onClick: () => focusCallback(this.planets.earth) },
                    { name: '🌙 Moon', onClick: () => focusCallback(this.moons.moon) },
                    { name: '♂️ Mars', onClick: () => focusCallback(this.planets.mars) },
                    { name: '🌑 Phobos', onClick: () => focusCallback(this.moons.phobos) },
                    { name: '🌑 Deimos', onClick: () => focusCallback(this.moons.deimos) }
                ]
            },
            {
                title: '☄️ Asteroid Belt',
                items: [
                    { name: '💫 Asteroid Belt', onClick: () => focusCallback(this.asteroidBelt) }
                ]
            },
            {
                title: '🌌 Outer Planets (Gas Giants)',
                items: [
                    { name: '♃ Jupiter', onClick: () => focusCallback(this.planets.jupiter) },
                    { name: '🌋 Io', onClick: () => focusCallback(this.moons.io) },
                    { name: '❄️ Europa', onClick: () => focusCallback(this.moons.europa) },
                    { name: '🌕 Ganymede', onClick: () => focusCallback(this.moons.ganymede) },
                    { name: '🌑 Callisto', onClick: () => focusCallback(this.moons.callisto) },
                    { name: '♄ Saturn', onClick: () => focusCallback(this.planets.saturn) },
                    { name: '🔶 Titan', onClick: () => focusCallback(this.moons.titan) },
                    { name: '💧 Enceladus', onClick: () => focusCallback(this.moons.enceladus) },
                    { name: '🌑 Rhea', onClick: () => focusCallback(this.moons.rhea) }
                ]
            },
            {
                title: '❄️ Ice Giants',
                items: [
                    { name: '♅ Uranus', onClick: () => focusCallback(this.planets.uranus) },
                    { name: '🌑 Titania', onClick: () => focusCallback(this.moons.titania) },
                    { name: '🎢 Miranda', onClick: () => focusCallback(this.moons.miranda) },
                    { name: '♆ Neptune', onClick: () => focusCallback(this.planets.neptune) },
                    { name: '❄️ Triton', onClick: () => focusCallback(this.moons.triton) }
                ]
            },
            {
                title: '🧊 Kuiper Belt & Dwarf Planets',
                items: [
                    { name: '♇ Pluto', onClick: () => focusCallback(this.planets.pluto) },
                    { name: '🌗 Charon', onClick: () => focusCallback(this.moons.charon) },
                    { name: '🧊 Kuiper Belt', onClick: () => focusCallback(this.kuiperBelt) }
                ]
            },
            {
                title: '☄️ Comets',
                items: this.comets.map(comet => ({
                    name: `☄️ ${comet.userData.name}`,
                    onClick: () => focusCallback(comet)
                }))
            },
            {
                title: '🛰️ Satellites & Space Stations',
                items: this.satellites.map(sat => ({
                    name: `🛰️ ${sat.userData.name}`,
                    onClick: () => focusCallback(sat)
                }))
            },
            {
                title: '🚀 Spacecraft & Probes',
                items: this.spacecraft.map(craft => ({
                    name: `🚀 ${craft.userData.name}`,
                    onClick: () => focusCallback(craft)
                }))
            },
            {
                title: '⭐ Distant Stars',
                items: this.distantStars.map(star => ({
                    name: `⭐ ${star.userData.name}`,
                    onClick: () => focusCallback(star)
                }))
            },
            {
                title: '🌌 Nebulae',
                items: this.nebulae.map(nebula => ({
                    name: `🌌 ${nebula.userData.name}`,
                    onClick: () => focusCallback(nebula)
                }))
            },
            {
                title: '🌀 Galaxies',
                items: this.galaxies.map(galaxy => ({
                    name: `🌀 ${galaxy.userData.name}`,
                    onClick: () => focusCallback(galaxy)
                }))
            }
        ];
        
        // Filter out categories with no items (empty arrays)
        return categories.filter(category => category.items && category.items.length > 0);
    }
}

// ===========================
// QUANTUM MODULE
// ===========================
class QuantumModule {
    constructor() {
        this.objects = [];
        this.electron = null;
        this.wave = null;
        this.photon = null;
        this.atom = null;
        this.orbitals = [];
        this.nucleus = null;
    }

    async init(scene) {
        // Create Nucleus (Protons + Neutrons)
        const nucleusGroup = new THREE.Group();
        
        // Add protons (red)
        for (let i = 0; i < 3; i++) {
            const protonGeo = new THREE.SphereGeometry(0.5, 32, 32);
            const protonMat = new THREE.MeshStandardMaterial({
                color: 0xFF3333,
                emissive: 0xFF0000,
                emissiveIntensity: 0.4,
                roughness: 0.4,
                metalness: 0.6
            });
            const proton = new THREE.Mesh(protonGeo, protonMat);
            const angle = (i / 3) * Math.PI * 2;
            proton.position.set(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0);
            nucleusGroup.add(proton);
        }
        
        // Add neutrons (gray)
        for (let i = 0; i < 3; i++) {
            const neutronGeo = new THREE.SphereGeometry(0.5, 32, 32);
            const neutronMat = new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.4,
                metalness: 0.6
            });
            const neutron = new THREE.Mesh(neutronGeo, neutronMat);
            const angle = (i / 3) * Math.PI * 2 + Math.PI / 3;
            neutron.position.set(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0.2);
            nucleusGroup.add(neutron);
        }
        
        this.nucleus = nucleusGroup;
        this.nucleus.userData = {
            name: 'Atomic Nucleus',
            type: 'Nucleus',
            radius: 0.5,
            description: '⚛️ The nucleus is the tiny, dense center of an atom containing protons (+) and neutrons (no charge). It holds 99.9% of the atom\'s mass! Protons determine which element it is.\n\n💡 For Kids: The nucleus is like a tiny sun at the center - super small but super important!\n\n🔬 Advanced: Protons (up,up,down quarks) and neutrons (up,down,down quarks) are held together by the strong nuclear force, the strongest force in nature!',
            funFact: 'If an atom were the size of a football stadium, the nucleus would be the size of a pea at the center!'
        };
        scene.add(this.nucleus);
        this.objects.push(this.nucleus);

        // Create Electron Cloud (multiple electrons in orbitals)
        for (let i = 0; i < 6; i++) {
            const electronGeo = new THREE.SphereGeometry(0.3, 32, 32);
            const electronMat = new THREE.MeshStandardMaterial({
                color: 0x00FFFF,
                emissive: 0x00FFFF,
                emissiveIntensity: 0.8,
                metalness: 0.3,
                roughness: 0.3
            });
            const electron = new THREE.Mesh(electronGeo, electronMat);
            
            electron.userData = {
                name: `Electron ${i + 1}`,
                type: 'Particle',
                radius: 0.3,
                orbitalRadius: 3 + Math.floor(i / 2) * 1.5,
                orbitalSpeed: 0.02 - i * 0.002,
                angle: (i * Math.PI) / 3,
                description: '⚡ Electrons are negatively charged particles that orbit the nucleus in "clouds" called orbitals. They determine how atoms bond with each other to make molecules!\n\n💡 For Kids: Electrons zip around the nucleus like planets around the sun, but much faster and in weird quantum ways!\n\n🔬 Advanced: Electrons exhibit wave-particle duality and exist in probability clouds. Their position follows the Heisenberg Uncertainty Principle!',
                funFact: 'Electrons are so light that it takes 1,836 electrons to equal the mass of one proton!'
            };
            
            scene.add(electron);
            this.objects.push(electron);
            this.orbitals.push(electron);
        }

        // Create Wave-Particle Visualization
        const waveGeometry = new THREE.TorusGeometry(4, 0.3, 16, 100);
        const waveMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF00FF,
            wireframe: true,
            emissive: 0xFF00FF,
            emissiveIntensity: 0.5,
            opacity: 0.7,
            transparent: true
        });
        this.wave = new THREE.Mesh(waveGeometry, waveMaterial);
        this.wave.position.set(15, 0, 0);
        this.wave.userData = {
            name: 'Matter Wave',
            type: 'Wave',
            radius: 4,
            description: '〰️ All matter has wave properties! This is called wave-particle duality. Electrons can behave like waves, creating interference patterns just like light waves.\n\n💡 For Kids: Imagine if you could be in two places at once - that\'s what particles can do when acting like waves!\n\n🔬 Advanced: The de Broglie wavelength λ = h/p shows all matter has wave properties. This is why electrons create diffraction patterns in the double-slit experiment!',
            funFact: 'You have a wavelength too! But it\'s so tiny (about 10⁻³⁵ m) we never notice it.'
        };
        scene.add(this.wave);
        this.objects.push(this.wave);

        // Create Photon (Light Particle)
        const photonGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const photonMat = new THREE.MeshStandardMaterial({
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 2,
            toneMapped: false
        });
        this.photon = new THREE.Mesh(photonGeo, photonMat);
        this.photon.position.set(-12, 0, 0);
        
        // Add light rays
        const rayGeometry = new THREE.ConeGeometry(0.1, 2, 8);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.6
        });
        for (let i = 0; i < 8; i++) {
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            ray.rotation.z = (i * Math.PI) / 4;
            this.photon.add(ray);
        }
        
        this.photon.userData = {
            name: 'Photon',
            type: 'Light Particle',
            radius: 0.5,
            description: '💡 Photons are particles of light! They have no mass but carry energy. All electromagnetic radiation (radio waves, visible light, X-rays) is made of photons traveling at light speed (299,792 km/s).\n\n💡 For Kids: Light is made of tiny packets of energy called photons - like little light bullets!\n\n🔬 Advanced: Photons are the quantum of electromagnetic field, described by E = hf where h is Planck\'s constant. They exhibit both particle and wave properties!',
            funFact: 'Photons from the Sun take 8 minutes to reach Earth, but they spent 100,000 years bouncing around inside the Sun before escaping!'
        };
        scene.add(this.photon);
        this.objects.push(this.photon);

        // Create Quantum Superposition visualization
        const superpositionGeo = new THREE.BoxGeometry(2, 2, 2);
        const superpositionMat = new THREE.MeshStandardMaterial({
            color: 0x00FF00,
            wireframe: true,
            emissive: 0x00FF00,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.5
        });
        this.superposition = new THREE.Mesh(superpositionGeo, superpositionMat);
        this.superposition.position.set(0, 10, 0);
        this.superposition.userData = {
            name: 'Superposition',
            type: 'Quantum State',
            radius: 2,
            description: '🎭 Superposition means a quantum particle can be in multiple states at once until measured! Like Schrödinger\'s famous cat being both alive and dead.\n\n💡 For Kids: Imagine flipping a coin - while it\'s spinning, it\'s both heads AND tails at the same time!\n\n🔬 Advanced: Quantum superposition is described by ψ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1. Measurement causes wavefunction collapse to a definite state!',
            funFact: 'Quantum computers use superposition to process multiple calculations simultaneously!'
        };
        scene.add(this.superposition);
        this.objects.push(this.superposition);

        // Create Quantum Entanglement visualization
        const entangleGeo = new THREE.SphereGeometry(0.6, 32, 32);
        const entangleMat1 = new THREE.MeshStandardMaterial({
            color: 0xFF0088,
            emissive: 0xFF0088,
            emissiveIntensity: 0.6
        });
        const entangleMat2 = new THREE.MeshStandardMaterial({
            color: 0x0088FF,
            emissive: 0x0088FF,
            emissiveIntensity: 0.6
        });
        
        this.entangled1 = new THREE.Mesh(entangleGeo, entangleMat1);
        this.entangled1.position.set(-20, 0, 2);
        this.entangled2 = new THREE.Mesh(entangleGeo, entangleMat2);
        this.entangled2.position.set(-20, 0, -2);
        
        // Connection line
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 2),
            new THREE.Vector3(0, 0, -2)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.8
        });
        this.entangleLink = new THREE.Line(lineGeo, lineMat);
        this.entangleLink.position.set(-20, 0, 0);
        
        const entangleGroup = new THREE.Group();
        entangleGroup.add(this.entangled1);
        entangleGroup.add(this.entangled2);
        entangleGroup.add(this.entangleLink);
        entangleGroup.userData = {
            name: 'Quantum Entanglement',
            type: 'Quantum Connection',
            radius: 2,
            description: '🔗 Entangled particles are mysteriously connected! Measuring one instantly affects the other, even across the universe. Einstein called it "spooky action at a distance"!\n\n💡 For Kids: Imagine having a magic pair of dice - when you roll one, the other shows the opposite number instantly, no matter how far apart they are!\n\n🔬 Advanced: Entanglement violates Bell\'s inequalities, proving quantum mechanics is fundamentally non-local. Used in quantum teleportation and quantum cryptography!',
            funFact: 'Entanglement has been proven to work over 1,200 km using satellites!'
        };
        
        scene.add(entangleGroup);
        this.objects.push(entangleGroup);

        return true;
    }

    update(deltaTime, timeSpeed, camera, controls) {
        // Keep camera focused on selected object if it's moving
        if (this.focusedObject && camera && controls) {
            const targetPosition = new THREE.Vector3();
            this.focusedObject.getWorldPosition(targetPosition);
            
            // Calculate the offset from target to camera
            const cameraOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
            
            // Update both target and camera position to maintain relative view
            controls.target.copy(targetPosition);
            camera.position.copy(targetPosition).add(cameraOffset);
            
            controls.update();
        }
        
        // Rotate nucleus
        if (this.nucleus) {
            this.nucleus.rotation.y += 0.005 * timeSpeed;
            this.nucleus.rotation.x += 0.003 * timeSpeed;
        }

        // Orbit electrons
        this.orbitals.forEach((electron, index) => {
            electron.userData.angle += electron.userData.orbitalSpeed * timeSpeed;
            const r = electron.userData.orbitalRadius;
            const a = electron.userData.angle;
            
            // Different orbital shapes
            if (index < 2) {
                // S orbital (spherical)
                electron.position.x = r * Math.cos(a);
                electron.position.y = r * Math.sin(a);
                electron.position.z = 0;
            } else if (index < 4) {
                // P orbital (dumbbell)
                electron.position.x = r * Math.cos(a);
                electron.position.y = 0;
                electron.position.z = r * Math.sin(a);
            } else {
                // D orbital (complex)
                electron.position.x = r * Math.cos(a) * Math.cos(a * 0.5);
                electron.position.y = r * Math.sin(a) * Math.cos(a * 0.5);
                electron.position.z = r * Math.sin(a * 0.5);
            }
            
            electron.rotation.y += 0.1 * timeSpeed;
        });

        // Animate wave
        if (this.wave) {
            this.wave.rotation.y += 0.01 * timeSpeed;
            this.wave.rotation.z += 0.005 * timeSpeed;
            this.wave.scale.x = 1 + Math.sin(Date.now() * 0.001) * 0.1;
            this.wave.scale.y = 1 + Math.cos(Date.now() * 0.001) * 0.1;
        }

        // Animate photon
        if (this.photon) {
            this.photon.rotation.y += 0.05 * timeSpeed;
            this.photon.children.forEach((ray, i) => {
                ray.rotation.z = (i * Math.PI / 4) + Date.now() * 0.001;
            });
        }

        // Animate superposition (phase in/out)
        if (this.superposition) {
            this.superposition.rotation.x += 0.02 * timeSpeed;
            this.superposition.rotation.y += 0.03 * timeSpeed;
            this.superposition.material.opacity = 0.3 + Math.sin(Date.now() * 0.002) * 0.2;
        }

        // Animate entangled particles
        if (this.entangled1 && this.entangled2) {
            const phase = Date.now() * 0.003;
            this.entangled1.rotation.y = phase;
            this.entangled2.rotation.y = -phase; // Opposite rotation
            this.entangled1.scale.setScalar(1 + Math.sin(phase) * 0.2);
            this.entangled2.scale.setScalar(1 - Math.sin(phase) * 0.2); // Opposite scale
        }
    }

    cleanup(scene) {
        this.objects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            scene.remove(obj);
        });
        this.objects = [];
        this.orbitals = [];
        this.electron = null;
        this.wave = null;
        this.photon = null;
        this.nucleus = null;
    }

    getSelectableObjects() {
        return this.objects;
    }

    getObjectInfo(object) {
        const userData = object.userData;
        let info = {
            name: userData.name || 'Unknown',
            type: userData.type || 'Object',
            distance: 'Quantum scale (10⁻¹⁰ m)',
            size: `${userData.radius} units (subatomic)`,
            description: userData.description || 'Quantum object'
        };

        if (userData.funFact) {
            info.description += `\n\n${userData.funFact}`;
        }

        return info;
    }

    focusOnObject(object, camera, controls) {
        const targetPosition = new THREE.Vector3();
        object.getWorldPosition(targetPosition);
        
        // Store reference for tracking
        this.focusedObject = object;
        
        const distance = Math.max(object.userData.radius * 6, 8);
        
        // Configure controls for focused object inspection
        const originalMinDistance = controls.minDistance;
        const originalMaxDistance = controls.maxDistance;
        
        // Set dynamic zoom limits based on object size
        controls.minDistance = object.userData.radius * 1.5; // Can zoom in close
        controls.maxDistance = object.userData.radius * 50;  // Can zoom out far
        
        // Enable full rotation around object
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.autoRotate = false;
        
        const startPos = camera.position.clone();
        const endPos = new THREE.Vector3(
            targetPosition.x,
            targetPosition.y + distance * 0.5,
            targetPosition.z + distance
        );
        
        const duration = 1500;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            
            // Update target position if object is moving
            if (object.userData.angle !== undefined || object.userData.orbitalSpeed !== undefined) {
                object.getWorldPosition(targetPosition);
            }
            
            camera.position.lerpVectors(startPos, endPos, eased);
            controls.target.copy(targetPosition);
            controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - controls are now centered on object
                console.log(`🎯 Focused on ${object.userData.name} - Use mouse to rotate, scroll to zoom`);
            }
        };
        
        animate();
        
        // Store original limits to restore later if needed
        object.userData._originalMinDistance = originalMinDistance;
        object.userData._originalMaxDistance = originalMaxDistance;
    }

    getExplorerContent(focusCallback) {
        return [
            {
                title: '⚛️ Atomic Structure',
                items: [
                    { name: '🔴 Nucleus (Protons & Neutrons)', onClick: () => focusCallback(this.nucleus) },
                    { name: '⚡ Electron Cloud', onClick: () => focusCallback(this.orbitals[0]) }
                ]
            },
            {
                title: '🌊 Wave-Particle Duality',
                items: [
                    { name: '〰️ Matter Wave', onClick: () => focusCallback(this.wave) },
                    { name: '💡 Photon (Light Particle)', onClick: () => focusCallback(this.photon) }
                ]
            },
            {
                title: '🎭 Quantum Phenomena',
                items: [
                    { name: '🎭 Superposition', onClick: () => focusCallback(this.superposition) },
                    { name: '🔗 Quantum Entanglement', onClick: () => focusCallback(this.objects[this.objects.length - 1]) }
                ]
            }
        ];
    }
}

// ===========================
// TOPIC MANAGER
// ===========================
class TopicManager {
    constructor(sceneManager, uiManager) {
        this.sceneManager = sceneManager;
        this.uiManager = uiManager;
        this.currentModule = null;
        this.currentTopicId = null;
        this.timeSpeed = 1;
        this.brightnessMultiplier = 0.5;
        this.clickTimeout = null;
        
        // Lazy load modules
        this.modules = {
            'solar-system': new SolarSystemModule(uiManager),
            'quantum': new QuantumModule(),
            'relativity': null,
            'atoms': null,
            'dna': null
        };

        this.setupControls();
    }

    setupControls() {
        // Topic navigation with event delegation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleTopicChange(btn), { passive: true });
        });

        // Time speed control
        const timeSpeedSlider = document.getElementById('time-speed');
        const speedValue = document.getElementById('speed-value');
        if (timeSpeedSlider && speedValue) {
            timeSpeedSlider.addEventListener('input', (e) => {
                this.timeSpeed = parseFloat(e.target.value) / 10;
                speedValue.textContent = `${this.timeSpeed.toFixed(1)}x`;
            }, { passive: true });
        }

        // Brightness control
        const brightnessSlider = document.getElementById('brightness');
        const brightnessValue = document.getElementById('brightness-value');
        if (brightnessSlider && brightnessValue) {
            brightnessSlider.addEventListener('input', (e) => {
                this.brightnessMultiplier = parseFloat(e.target.value) / 100;
                brightnessValue.textContent = `${e.target.value}%`;
                this.sceneManager.updateBrightness(this.brightnessMultiplier);
            }, { passive: true });
        }

        // Scale toggle button
        const scaleButton = document.getElementById('toggle-scale');
        if (scaleButton) {
            scaleButton.addEventListener('click', () => {
                if (this.solarSystemModule) {
                    this.solarSystemModule.realisticScale = !this.solarSystemModule.realisticScale;
                    scaleButton.classList.toggle('active');
                    scaleButton.textContent = this.solarSystemModule.realisticScale ? 
                        '🔬 Realistic Scale' : '📏 Educational Scale';
                    
                    // Recalculate positions with new scale
                    this.solarSystemModule.updateScale();
                }
            }, { passive: true });
        }
        
        // Comet tails toggle button
        const cometTailsButton = document.getElementById('toggle-comet-tails');
        if (cometTailsButton) {
            cometTailsButton.addEventListener('click', () => {
                if (this.solarSystemModule) {
                    this.solarSystemModule.cometTailsVisible = !this.solarSystemModule.cometTailsVisible;
                    cometTailsButton.classList.toggle('toggle-on');
                    cometTailsButton.textContent = this.solarSystemModule.cometTailsVisible ? 
                        '☄️ Tails ON' : '☄️ Tails OFF';
                    console.log(`Comet tails ${this.solarSystemModule.cometTailsVisible ? 'enabled' : 'disabled'}`);
                }
            }, { passive: true });
        }
        
        // Reset view button
        const resetButton = document.getElementById('reset-view');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                // Clear focus from any object
                if (this.solarSystemModule) {
                    this.solarSystemModule.focusedObject = null;
                }
                if (this.quantumModule) {
                    this.quantumModule.focusedObject = null;
                }
                this.sceneManager.resetCamera();
            }, { passive: true });
        }

        // Canvas click for object selection (debounced)
        this.sceneManager.renderer.domElement.addEventListener('click', (e) => {
            if (this.clickTimeout) return;
            this.clickTimeout = setTimeout(() => {
                this.clickTimeout = null;
            }, 300);
            this.handleCanvasClick(e);
        });
    }

    handleTopicChange(btn) {
        const topic = btn.dataset.topic;
        if (topic === this.currentTopicId) return; // Already loaded
        
        this.loadTopic(topic);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    async loadTopic(topicId) {
        try {
            this.uiManager.showLoading(`Loading ${topicId}...`);

            // Cleanup current module
            if (this.currentModule) {
                this.currentModule.cleanup(this.sceneManager.scene);
            }

            // Clear scene
            this.sceneManager.clear();

            // Load new module
            const module = this.modules[topicId];
            if (module) {
                await module.init(this.sceneManager.scene);
                this.currentModule = module;
                this.currentTopicId = topicId;
                
                // Update explorer with focus callback
                const focusCallback = (obj) => {
                    if (obj) {
                        const info = module.getObjectInfo(obj);
                        this.uiManager.updateInfoPanel(info);
                        module.focusOnObject(obj, this.sceneManager.camera, this.sceneManager.controls);
                    }
                };
                
                this.uiManager.updateExplorer(
                    `🌍 Explore ${topicId}`, 
                    module.getExplorerContent(focusCallback)
                );
            } else {
                console.warn(`Module ${topicId} not yet implemented`);
                this.uiManager.showLoading(`${topicId} coming soon!`);
                setTimeout(() => this.loadTopic('solar-system'), 2000);
                return;
            }

            this.uiManager.hideLoading();
            // Don't reset camera automatically - user might have an object focused
            // this.sceneManager.resetCamera();
            this.sceneManager.updateBrightness(this.brightnessMultiplier);
        } catch (error) {
            console.error('Error loading topic:', error);
            this.uiManager.showLoading('Error loading topic. Please refresh.');
        }
    }

    handleCanvasClick(event) {
        if (!this.currentModule || event.target.tagName !== 'CANVAS') return;

        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.sceneManager.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.sceneManager.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.sceneManager.raycaster.setFromCamera(this.sceneManager.mouse, this.sceneManager.camera);
        const intersects = this.sceneManager.raycaster.intersectObjects(
            this.currentModule.getSelectableObjects(), 
            false
        );

        if (intersects.length > 0) {
            const object = intersects[0].object;
            const info = this.currentModule.getObjectInfo(object);
            this.uiManager.updateInfoPanel(info);
            this.currentModule.focusOnObject(object, this.sceneManager.camera, this.sceneManager.controls);
        }
    }

    update(deltaTime) {
        if (this.currentModule) {
            this.currentModule.update(deltaTime, this.timeSpeed, this.sceneManager.camera, this.sceneManager.controls);
        }
    }
}

// ===========================
// MAIN APPLICATION
// ===========================
class App {
    constructor() {
        this.sceneManager = null;
        this.uiManager = null;
        this.topicManager = null;
        this.lastTime = 0;
        
        this.init();
    }

    async init() {
        try {
            // Initialize managers
            this.sceneManager = new SceneManager();
            this.uiManager = new UIManager();
            this.topicManager = new TopicManager(this.sceneManager, this.uiManager);

            this.uiManager.showLoading('Initializing application...');
            
            // Setup global UI functions
            this.setupGlobalFunctions();
            
            // Setup help button
            this.setupHelpButton();

            // Load initial topic
            await this.topicManager.loadTopic('solar-system');

            // Start animation loop with frame limiting
            this.sceneManager.animate(() => {
                const currentTime = performance.now();
                const deltaTime = Math.min((currentTime - this.lastTime) / 1000, CONFIG.PERFORMANCE.maxDeltaTime);
                
                // Update XR controller movement and laser pointers
                this.sceneManager.updateXRMovement();
                this.sceneManager.updateLaserPointers();
                
                // Limit to ~60 FPS and prevent huge jumps
                if (deltaTime >= CONFIG.PERFORMANCE.frameTime / 1000) {
                    this.lastTime = currentTime;
                    this.topicManager.update(deltaTime);
                }
            });

            console.log('✅ Scientific Explorer initialized successfully!');
            console.log(`📊 Performance: ${this.sceneManager.renderer.info.memory.geometries} geometries, ${this.sceneManager.renderer.info.memory.textures} textures`);
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.sceneManager?.showError('Failed to start application. Please refresh the page.');
        }
    }

    setupGlobalFunctions() {
        // Close info panel
        window.closeInfoPanel = () => {
            this.uiManager.closeInfoPanel();
        };
        
        // Close help modal
        window.closeHelpModal = () => {
            this.uiManager.closeHelpModal();
        };
    }

    setupHelpButton() {
        const helpButton = document.getElementById('help-button');
        if (helpButton) {
            helpButton.addEventListener('click', () => {
                this.uiManager.showHelp(`
                    <h3>🎮 Controls</h3>
                    <p>• <strong>Click & Drag:</strong> Rotate view around selected object</p>
                    <p>• <strong>Scroll:</strong> Zoom in/out (closer or farther from object)</p>
                    <p>• <strong>Right Click & Drag:</strong> Pan camera position</p>
                    <p>• <strong>Click Objects:</strong> Select and focus on object</p>
                    <p>• <strong>Explorer Panel:</strong> Click object names to jump to them</p>
                    
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <p>• <span class="keyboard-shortcut">H</span> Show this help</p>
                    <p>• <span class="keyboard-shortcut">R</span> Reset camera view</p>
                    <p>• <span class="keyboard-shortcut">O</span> Toggle orbital paths</p>
                    <p>• <span class="keyboard-shortcut">D</span> Toggle object details</p>
                    <p>• <span class="keyboard-shortcut">C</span> Toggle comet tails (off for VR/AR)</p>
                    <p>• <span class="keyboard-shortcut">S</span> Toggle realistic scale</p>
                    <p>• <span class="keyboard-shortcut">F</span> Toggle FPS counter</p>
                    <p>• <span class="keyboard-shortcut">+/-</span> Speed up/slow down time</p>
                    <p>• <span class="keyboard-shortcut">ESC</span> Close panels</p>
                    
                    <h3>🔍 Object Inspection</h3>
                    <p>• <strong>After selecting an object:</strong></p>
                    <p>  - Drag to rotate camera around the object</p>
                    <p>  - Scroll to zoom in for close-up views</p>
                    <p>  - View object from all sides and angles</p>
                    <p>  - Camera stays focused as object moves in orbit</p>
                    
                    <h3>⚙️ Settings</h3>
                    <p>• <strong>Speed Slider:</strong> 0x to 10x animation speed</p>
                    <p>• <strong>Brightness Slider:</strong> Adjust lighting for dark objects</p>
                    <p>• <strong>Reset Button:</strong> Return camera to starting position</p>
                    
                    <h3>🪐 Topics</h3>
                    <p>• <strong>Solar System:</strong> Explore our solar system</p>
                    <p>• <strong>Quantum Physics:</strong> Visualize particle-wave duality</p>
                    <p>• <strong>More topics:</strong> Coming soon!</p>
                    
                    <h3>🥽 VR/AR Mode</h3>
                    <p>• Click "Enter VR" or "Enter AR" buttons (bottom right)</p>
                    <p>• Requires WebXR-compatible device</p>
                    <p>• AR mode uses passthrough for mixed reality</p>
                    <p>• <strong>VR Controls:</strong></p>
                    <p>  - Left stick: Move forward/backward/strafe</p>
                    <p>  - Right stick: Rotate camera view</p>
                    <p>  - Trigger: Select objects</p>
                    <p>• <strong>Tip:</strong> Turn OFF comet tails (press C) before entering VR/AR to avoid visual flicker</p>
                    
                    <h3>💡 Tips</h3>
                    <p>• Increase brightness to see dark sides of planets</p>
                    <p>• Use speed slider to watch orbits in fast-forward</p>
                    <p>• Click objects directly or use the explorer panel</p>
                    <p>• Zoom in close to see surface details</p>
                    <p>• Rotate around objects to view from all angles</p>
                    
                    <h3>⚡ Performance</h3>
                    <p>• Optimized for 60 FPS on modern devices</p>
                    <p>• Reduced geometry for better mobile performance</p>
                    <p>• Hardware-accelerated WebGL rendering</p>
                    <p>• Press <span class="keyboard-shortcut">F</span> to show FPS counter</p>
                `);
            }, { passive: true });
        }
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup FPS counter
        this.setupFPSCounter();
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'h':
                    document.getElementById('help-button')?.click();
                    break;
                case 'r':
                    document.getElementById('reset-view')?.click();
                    break;
                case 'o':
                    document.getElementById('toggle-orbits')?.click();
                    break;
                case 'd':
                    document.getElementById('toggle-details')?.click();
                    break;
                case 's':
                    document.getElementById('toggle-scale')?.click();
                    break;
                case 'c':
                    document.getElementById('toggle-comet-tails')?.click();
                    break;
                case 'f':
                    const fpsCounter = document.getElementById('fps-counter');
                    if (fpsCounter) {
                        fpsCounter.classList.toggle('hidden');
                    }
                    break;
                case '+':
                case '=':
                    const speedSlider = document.getElementById('time-speed');
                    if (speedSlider) {
                        speedSlider.value = Math.min(100, parseInt(speedSlider.value) + 10);
                        speedSlider.dispatchEvent(new Event('input'));
                    }
                    break;
                case '-':
                case '_':
                    const speedSliderDown = document.getElementById('time-speed');
                    if (speedSliderDown) {
                        speedSliderDown.value = Math.max(0, parseInt(speedSliderDown.value) - 10);
                        speedSliderDown.dispatchEvent(new Event('input'));
                    }
                    break;
                case 'escape':
                    this.uiManager.closeInfoPanel();
                    this.uiManager.closeHelpModal();
                    break;
                case ' ':
                case 'space':
                    // SPACE = Pause/Play (works in VR too!)
                    if (this.topicManager) {
                        if (this.topicManager.timeSpeed === 0) {
                            this.topicManager.timeSpeed = 1;
                            console.log('▶️ PLAY');
                        } else {
                            this.topicManager.timeSpeed = 0;
                            console.log('⏸️ PAUSE');
                        }
                    }
                    break;
                case 'i':
                    // Find and focus on ISS
                    if (this.spacecraft) {
                        const iss = this.spacecraft.find(s => s.userData.name.includes('ISS'));
                        if (iss) {
                            this.focusOnObject(iss, this.camera, this.controls);
                            console.log('🛰️ Focusing on International Space Station');
                        }
                    }
                    break;
                case 'v':
                    // Cycle through Voyager probes
                    if (this.spacecraft) {
                        const voyagers = this.spacecraft.filter(s => s.userData.name.includes('Voyager'));
                        if (voyagers.length > 0) {
                            this._voyagerIndex = ((this._voyagerIndex || 0) + 1) % voyagers.length;
                            this.focusOnObject(voyagers[this._voyagerIndex], this.camera, this.controls);
                            console.log(`🚀 Focusing on ${voyagers[this._voyagerIndex].userData.name}`);
                        }
                    }
                    break;
                case 'm':
                    // Cycle through Mars rovers
                    if (this.spacecraft) {
                        const rovers = this.spacecraft.filter(s => s.userData.type === 'rover');
                        if (rovers.length > 0) {
                            this._roverIndex = ((this._roverIndex || 0) + 1) % rovers.length;
                            this.focusOnObject(rovers[this._roverIndex], this.camera, this.controls);
                            console.log(`🤖 Focusing on ${rovers[this._roverIndex].userData.name}`);
                        }
                    }
                    break;
                case 'p':
                    // Cycle through deep space probes
                    if (this.spacecraft) {
                        const probes = this.spacecraft.filter(s => s.userData.type === 'probe');
                        if (probes.length > 0) {
                            this._probeIndex = ((this._probeIndex || 0) + 1) % probes.length;
                            this.focusOnObject(probes[this._probeIndex], this.camera, this.controls);
                            console.log(`🛰️ Focusing on ${probes[this._probeIndex].userData.name}`);
                        }
                    }
                    break;
                case 'l':
                    // Find Apollo 11 landing site
                    if (this.spacecraft) {
                        const apollo = this.spacecraft.find(s => s.userData.name.includes('Apollo'));
                        if (apollo) {
                            this.focusOnObject(apollo, this.camera, this.controls);
                            console.log('🌕 Focusing on Apollo 11 Landing Site');
                        }
                    }
                    break;
            }
        }, { passive: true });
    }
    
    setupFPSCounter() {
        let frameCount = 0;
        let lastTime = performance.now();
        const fpsValue = document.getElementById('fps-value');
        const fpsCounter = document.getElementById('fps-counter');
        
        const updateFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                if (fpsValue) {
                    fpsValue.textContent = fps;
                }
                
                // Update color based on FPS
                if (fpsCounter) {
                    fpsCounter.classList.remove('good', 'warning', 'bad');
                    if (fps >= 55) {
                        fpsCounter.classList.add('good');
                    } else if (fps >= 30) {
                        fpsCounter.classList.add('warning');
                    } else {
                        fpsCounter.classList.add('bad');
                    }
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        updateFPS();
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}


