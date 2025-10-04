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
        sphereSegments: 64,
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

        // Camera light for viewing objects on dark side
        this.lights.camera = new THREE.PointLight(0xffffff, 0.8, 1000);
        this.camera.add(this.lights.camera);
        this.scene.add(this.camera);
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
                
                // Add a simple line to show controller direction
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 0, -1)
                ]);
                const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x00ffff }));
                line.name = 'line';
                line.scale.z = 5;
                controller.add(line);
                
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
                // Show VR UI panel
                if (this.vrUIPanel) this.vrUIPanel.visible = true;
                console.log('✅ XR session started - Use grip buttons to show/hide menu');
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
        
        // Define buttons
        this.vrButtons = [
            // Row 1: Time controls
            { x: 50, y: 160, w: 220, h: 90, label: '⏸️ Pause', action: 'pause', color: '#e74c3c' },
            { x: 290, y: 160, w: 220, h: 90, label: '▶️ Play', action: 'play', color: '#2ecc71' },
            { x: 530, y: 160, w: 220, h: 90, label: '⏩ Speed+', action: 'speedup', color: '#3498db' },
            { x: 770, y: 160, w: 220, h: 90, label: '⏪ Speed-', action: 'speeddown', color: '#9b59b6' },
            
            // Row 2: View controls
            { x: 50, y: 270, w: 220, h: 90, label: '🔆 Bright+', action: 'brightup', color: '#f39c12' },
            { x: 290, y: 270, w: 220, h: 90, label: '🔅 Bright-', action: 'brightdown', color: '#e67e22' },
            { x: 530, y: 270, w: 220, h: 90, label: '☄️ Tails', action: 'tails', color: '#1abc9c' },
            { x: 770, y: 270, w: 220, h: 90, label: '🔄 Reset', action: 'reset', color: '#34495e' },
            
            // Row 3: Scale and navigation
            { x: 170, y: 380, w: 330, h: 90, label: '📏 Educational Scale', action: 'scale', color: '#8e44ad' },
            { x: 520, y: 380, w: 330, h: 90, label: '🌍 Focus Earth', action: 'earth', color: '#16a085' },
            
            // Row 4: Topics
            { x: 170, y: 490, w: 330, h: 90, label: '🪐 Solar System', action: 'solar', color: '#2980b9' },
            { x: 520, y: 490, w: 330, h: 90, label: '⚛️ Quantum Physics', action: 'quantum', color: '#c0392b' },
            
            // Row 5: Help
            { x: 312, y: 600, w: 400, h: 90, label: '❓ Hide Menu (Grip)', action: 'hide', color: '#7f8c8d' }
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
        
        // Status bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 700, 1024, 68);
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Speed: 1x | Brightness: 50% | Controls Active', 512, 740);
        
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
        console.log(`Controller ${index} trigger pressed`);
        controller.userData.selecting = true;
        
        // Check for VR UI interaction
        if (this.vrUIPanel && this.vrUIPanel.visible) {
            const raycaster = new THREE.Raycaster();
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(controller.matrixWorld);
            
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
            
            const intersects = raycaster.intersectObject(this.vrUIPanel);
            
            if (intersects.length > 0) {
                const uv = intersects[0].uv;
                const x = uv.x * 1024;
                const y = (1 - uv.y) * 768;
                
                // Check which button was clicked
                this.vrButtons.forEach(btn => {
                    if (x >= btn.x && x <= btn.x + btn.w && 
                        y >= btn.y && y <= btn.y + btn.h) {
                        console.log('✅ VR Button clicked:', btn.action);
                        this.handleVRAction(btn.action);
                        this.flashVRButton(btn);
                    }
                });
            }
        }
    }
    
    onSelectEnd(controller, index) {
        // Handle controller trigger release
        controller.userData.selecting = false;
    }
    
    onSqueezeStart(controller, index) {
        // Toggle VR UI with grip button
        if (this.vrUIPanel) {
            this.vrUIPanel.visible = !this.vrUIPanel.visible;
            console.log(`VR Menu ${this.vrUIPanel.visible ? 'shown' : 'hidden'}`);
        }
    }
    
    handleVRAction(action) {
        // Get current app state
        const app = window.app || this;
        
        switch(action) {
            case 'pause':
                if (app.topicManager) {
                    app.topicManager.timeSpeed = 0;
                    this.updateVRStatus('⏸️ PAUSED');
                }
                break;
            case 'play':
                if (app.topicManager) {
                    app.topicManager.timeSpeed = 1;
                    this.updateVRStatus('▶️ PLAYING at 1x');
                }
                break;
            case 'speedup':
                if (app.topicManager) {
                    app.topicManager.timeSpeed = Math.min(app.topicManager.timeSpeed + 1, 10);
                    this.updateVRStatus(`⏩ Speed: ${app.topicManager.timeSpeed}x`);
                }
                break;
            case 'speeddown':
                if (app.topicManager) {
                    app.topicManager.timeSpeed = Math.max(app.topicManager.timeSpeed - 1, 0);
                    this.updateVRStatus(`⏪ Speed: ${app.topicManager.timeSpeed}x`);
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
        
        // Clear status bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 700, 1024, 68);
        
        // Draw status
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, 512, 740);
        
        this.vrUIPanel.material.map.needsUpdate = true;
        
        console.log('🎮 VR Status:', message);
    }
    
    updateXRMovement() {
        // Only update in VR/AR mode
        if (!this.renderer.xr.isPresenting) return;
        
        // Ensure dolly exists
        if (!this.dolly) return;
        
        // Get controller inputs for movement
        const session = this.renderer.xr.getSession();
        if (session) {
            const inputSources = session.inputSources;
            
            for (let i = 0; i < inputSources.length; i++) {
                const inputSource = inputSources[i];
                const gamepad = inputSource.gamepad;
                
                if (gamepad && gamepad.axes.length >= 2) {
                    // Left stick: Movement (axes 0 and 1)
                    const moveX = gamepad.axes[0];
                    const moveZ = gamepad.axes[1];
                    
                    if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
                        // FIXED: Move dolly (not XR camera directly)
                        const moveSpeed = 0.05;
                        const xrCamera = this.renderer.xr.getCamera();
                        const cameraDirection = new THREE.Vector3();
                        xrCamera.getWorldDirection(cameraDirection);
                        cameraDirection.y = 0; // Keep movement horizontal
                        cameraDirection.normalize();
                        
                        const rightVector = new THREE.Vector3();
                        rightVector.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
                        
                        // Apply movement to DOLLY (this is the fix!)
                        this.dolly.position.add(rightVector.multiplyScalar(moveX * moveSpeed));
                        this.dolly.position.add(cameraDirection.multiplyScalar(-moveZ * moveSpeed));
                    }
                    
                    // Right stick: Rotation (axes 2 and 3) if available
                    if (gamepad.axes.length >= 4) {
                        const rotateX = gamepad.axes[2];
                        const rotateY = gamepad.axes[3];
                        
                        if (Math.abs(rotateX) > 0.1) {
                            // FIXED: Rotate dolly (not XR camera directly)
                            this.dolly.rotation.y -= rotateX * 0.02;
                        }
                    }
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
        
        return true;
    }

    createSun(scene) {
        // Hyperrealistic Sun with detailed surface
        const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
        const sunMaterial = new THREE.MeshStandardMaterial({
            color: 0xffa500, // Bright orange
            emissive: 0xff8800,
            emissiveIntensity: 3.0,
            toneMapped: false,
            roughness: 0.9
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.userData = {
            name: 'Sun',
            type: 'Star',
            distance: 0,
            radius: 10,
            description: '☀️ The Sun is a G-type main-sequence star (yellow dwarf) containing 99.86% of the Solar System\'s mass. Surface temperature: 5,778K. Age: 4.6 billion years. It fuses 600 million tons of hydrogen into helium every second!',
            funFact: 'The Sun is so big that 1.3 million Earths could fit inside it!',
            realSize: '1,391,000 km diameter'
        };
        
        // Add sun light
        const sunLight = new THREE.PointLight(0xFFFFE0, 5, 0, 1.5);
        sunLight.name = 'sunLight';
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 5000;
        scene.add(sunLight);
        
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
        // Mercury
        this.planets.mercury = this.createPlanet(scene, {
            name: 'Mercury',
            radius: 0.38,
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

        // Venus
        this.planets.venus = this.createPlanet(scene, {
            name: 'Venus',
            radius: 0.95,
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

        // Earth with Moon
        this.planets.earth = this.createPlanet(scene, {
            name: 'Earth',
            radius: 1,
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

        // Create Earth's Moon
        this.createMoon(this.planets.earth, {
            name: 'Moon',
            radius: 0.27,
            color: 0xAAAAAA,
            distance: 3,
            speed: 0.03,
            description: '🌙 Earth\'s Moon is the fifth largest moon in the solar system. It creates tides, stabilizes Earth\'s tilt, and was formed 4.5 billion years ago when a Mars-sized object hit Earth!',
            funFact: 'The Moon is slowly moving away from Earth at 3.8 cm per year!'
        });

        // Mars with moons
        this.planets.mars = this.createPlanet(scene, {
            name: 'Mars',
            radius: 0.53,
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

        // Mars moons: Phobos and Deimos
        this.createMoon(this.planets.mars, {
            name: 'Phobos',
            radius: 0.08,
            color: 0x666666,
            distance: 1.5,
            speed: 0.08,
            description: '🌑 Phobos orbits Mars faster than Mars rotates! It rises in the west and sets in the east.'
        });
        this.createMoon(this.planets.mars, {
            name: 'Deimos',
            radius: 0.06,
            color: 0x888888,
            distance: 2.5,
            speed: 0.04,
            description: '🌑 Deimos is the smaller of Mars\' two moons and takes 30 hours to orbit.'
        });
    }

    createOuterPlanets(scene) {
        // Jupiter with Great Red Spot
        this.planets.jupiter = this.createPlanet(scene, {
            name: 'Jupiter',
            radius: 5,
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

        // Jupiter's Galilean moons
        this.createMoon(this.planets.jupiter, {
            name: 'Io',
            radius: 0.3,
            color: 0xFFFF00,
            distance: 8,
            speed: 0.06,
            description: '🌋 Io is the most volcanically active body in the solar system!'
        });
        this.createMoon(this.planets.jupiter, {
            name: 'Europa',
            radius: 0.25,
            color: 0xCCBB99,
            distance: 10,
            speed: 0.045,
            description: '❄️ Europa has a global ocean beneath its ice - a potential place for life!'
        });
        this.createMoon(this.planets.jupiter, {
            name: 'Ganymede',
            radius: 0.35,
            color: 0x996633,
            distance: 12,
            speed: 0.035,
            description: '🌕 Ganymede is the largest moon in the solar system, bigger than Mercury!'
        });
        this.createMoon(this.planets.jupiter, {
            name: 'Callisto',
            radius: 0.32,
            color: 0x777777,
            distance: 14,
            speed: 0.025,
            description: '🌑 Callisto is the most heavily cratered object in the solar system!'
        });

        // Saturn with prominent rings
        this.planets.saturn = this.createPlanet(scene, {
            name: 'Saturn',
            radius: 4.5,
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

        this.createMoon(this.planets.saturn, {
            name: 'Titan',
            radius: 0.4,
            color: 0xFFAA33,
            distance: 10,
            speed: 0.03,
            description: '🔶 Titan has lakes and rivers of liquid methane - the only place besides Earth with liquid on its surface!'
        });
        this.createMoon(this.planets.saturn, {
            name: 'Enceladus',
            radius: 0.15,
            color: 0xFFFFFF,
            distance: 7,
            speed: 0.05,
            description: '💧 Enceladus shoots water geysers into space from its subsurface ocean!'
        });
        this.createMoon(this.planets.saturn, {
            name: 'Rhea',
            radius: 0.2,
            color: 0xCCCCCC,
            distance: 12,
            speed: 0.025,
            description: '🌑 Rhea may have its own ring system!'
        });

        // Uranus
        this.planets.uranus = this.createPlanet(scene, {
            name: 'Uranus',
            radius: 2,
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

        this.createMoon(this.planets.uranus, {
            name: 'Titania',
            radius: 0.2,
            color: 0xAAAAAA,
            distance: 5,
            speed: 0.04,
            description: '🌑 Titania is Uranus\' largest moon with massive canyons!'
        });
        this.createMoon(this.planets.uranus, {
            name: 'Miranda',
            radius: 0.12,
            color: 0x999999,
            distance: 3.5,
            speed: 0.06,
            description: '🎢 Miranda has the most dramatic terrain in the solar system with cliffs 20 km high!'
        });

        // Neptune
        this.planets.neptune = this.createPlanet(scene, {
            name: 'Neptune',
            radius: 1.9,
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

        this.createMoon(this.planets.neptune, {
            name: 'Triton',
            radius: 0.25,
            color: 0xFFCCCC,
            distance: 5,
            speed: -0.05,
            description: '❄️ Triton orbits backwards and has nitrogen geysers! It\'s likely a captured Kuiper Belt object.'
        });

        // Dwarf planets
        this.planets.pluto = this.createPlanet(scene, {
            name: 'Pluto',
            radius: 0.18,
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

        this.createMoon(this.planets.pluto, {
            name: 'Charon',
            radius: 0.09,
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

    createPlanetMaterial(config) {
        // Create hyperrealistic materials based on latest planetary data
        const name = config.name.toLowerCase();
        
        // Base material properties
        let materialProps = {
            roughness: 0.9,
            metalness: 0.0,
            emissive: config.emissive || 0x000000,
            emissiveIntensity: config.emissiveIntensity || 0
        };

        // Planet-specific hyperrealistic materials with procedural textures
        switch(name) {
            case 'earth':
                // Earth: Blue oceans, green/brown continents, white poles
                const earthTexture = this.createProceduralTexture('earth', 1024);
                return new THREE.MeshStandardMaterial({
                    map: earthTexture,
                    roughness: 0.6,
                    metalness: 0.2,
                    emissive: 0x0a2f4f,
                    emissiveIntensity: 0.05
                });
                
            case 'mars':
                // Mars: Rusty red surface with darker regions and polar caps
                const marsTexture = this.createProceduralTexture('mars', 1024);
                return new THREE.MeshStandardMaterial({
                    map: marsTexture,
                    roughness: 0.95,
                    metalness: 0.0,
                    emissive: 0x3d1505,
                    emissiveIntensity: 0.02
                });
                
            case 'venus':
                // Venus: Yellowish clouds with sulfuric acid
                return new THREE.MeshStandardMaterial({
                    color: 0xe8c468, // Pale yellow
                    roughness: 0.4,
                    metalness: 0.1,
                    emissive: 0xffc649,
                    emissiveIntensity: 0.3
                });
                
            case 'mercury':
                // Mercury: Gray cratered surface like the Moon
                return new THREE.MeshStandardMaterial({
                    color: 0x8c7853, // Gray-brown
                    roughness: 0.95,
                    metalness: 0.05,
                    emissive: 0x2d2520,
                    emissiveIntensity: 0.01
                });
                
            case 'jupiter':
                // Jupiter: Banded atmosphere with Great Red Spot
                const jupiterTexture = this.createProceduralTexture('jupiter', 1024);
                return new THREE.MeshStandardMaterial({
                    map: jupiterTexture,
                    roughness: 0.5,
                    metalness: 0.0,
                    emissive: 0x3d2a15,
                    emissiveIntensity: 0.05
                });
                
            case 'saturn':
                // Saturn: Pale gold with subtle banding
                const saturnTexture = this.createProceduralTexture('saturn', 1024);
                return new THREE.MeshStandardMaterial({
                    map: saturnTexture,
                    roughness: 0.5,
                    metalness: 0.0,
                    emissive: 0x4d3820,
                    emissiveIntensity: 0.03
                });
                
            case 'uranus':
                // Uranus: Cyan/turquoise from methane
                return new THREE.MeshStandardMaterial({
                    color: 0x4fd4e8, // Cyan-blue
                    roughness: 0.3,
                    metalness: 0.1,
                    emissive: 0x1a4d5a,
                    emissiveIntensity: 0.1
                });
                
            case 'neptune':
                // Neptune: Deep blue from methane
                return new THREE.MeshStandardMaterial({
                    color: 0x2e5fb5, // Deep blue
                    roughness: 0.3,
                    metalness: 0.1,
                    emissive: 0x0f1f3d,
                    emissiveIntensity: 0.15
                });
                
            case 'pluto':
                // Pluto: Reddish-brown with bright regions
                return new THREE.MeshStandardMaterial({
                    color: 0xd4a373, // Light brown
                    roughness: 0.9,
                    metalness: 0.0,
                    emissive: 0x3d2f20,
                    emissiveIntensity: 0.02
                });
                
            default:
                // Default material
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
            // Atmosphere glow
            const atmoGeometry = new THREE.SphereGeometry(config.radius * 1.05, 32, 32);
            const atmoMaterial = new THREE.MeshBasicMaterial({
                color: 0x6699ff,
                transparent: true,
                opacity: 0.15,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmoGeometry, atmoMaterial);
            planet.add(atmosphere);
            
            // Cloud layer with procedural patterns
            const cloudGeometry = new THREE.SphereGeometry(config.radius * 1.02, 32, 32);
            const cloudTexture = this.createCloudTexture(512);
            const cloudMaterial = new THREE.MeshStandardMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.6,
                roughness: 0.9,
                metalness: 0.0,
                side: THREE.FrontSide,
                alphaMap: cloudTexture
            });
            const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            clouds.userData.isCloud = true;
            planet.add(clouds);
            planet.userData.clouds = clouds;
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
        return planet;
    }

    createMoon(planet, config) {
        const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
        
        // Enhanced moon materials based on specific moons
        let moonMaterial;
        const moonName = config.name.toLowerCase();
        
        if (moonName === 'moon') {
            // Earth's Moon: gray with crater-like appearance
            const moonTexture = this.createProceduralTexture('moon', 512);
            moonMaterial = new THREE.MeshStandardMaterial({
                map: moonTexture,
                roughness: 0.95,
                metalness: 0.05
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
        // Create comets with orbits
        this.comets = [];
        
        const cometsData = [
            { name: 'Halley\'s Comet', distance: 200, eccentricity: 0.967, speed: 0.001, size: 0.5, description: '☄️ Halley\'s Comet is the most famous comet! It returns to Earth\'s vicinity every 75-76 years. Last seen in 1986, it will return in 2061. When you see it, you\'re viewing a 4.6 billion year old cosmic snowball!' },
            { name: 'Comet Hale-Bopp', distance: 250, eccentricity: 0.995, speed: 0.0008, size: 0.6, description: '☄️ Hale-Bopp was one of the brightest comets of the 20th century, visible to the naked eye for 18 months in 1996-1997! Its nucleus is unusually large at 60 km in diameter.' },
            { name: 'Comet NEOWISE', distance: 180, eccentricity: 0.999, speed: 0.0012, size: 0.4, description: '☄️ Comet NEOWISE was a spectacular sight in July 2020! It won\'t return for about 6,800 years. Comets are \"dirty snowballs\" made of ice, dust, and rock from the solar system\'s formation.' }
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
                distance: 1.05,  // About 408 km above Earth scaled
                speed: 15.5,  // ISS orbits Earth ~15.5 times per day
                size: 0.03,
                color: 0xCCCCCC,
                description: '🛰️ The ISS is a habitable space station orbiting Earth at ~408 km altitude. It travels at 27,600 km/h and completes one orbit every 90 minutes! Inhabited continuously since 2000, it\'s a collaboration of 5 space agencies.',
                funFact: 'The ISS is as long as a football field and can be seen with the naked eye from Earth!',
                realSize: '109m × 73m',
                orbitTime: '90 minutes'
            },
            { 
                name: 'Hubble Space Telescope', 
                distance: 1.08,  // About 547 km above Earth
                speed: 15.1,
                size: 0.02,
                color: 0x4169E1,
                description: '🔭 Hubble has been observing the universe since 1990, capturing breathtaking images of distant galaxies, nebulae, and planets. It orbits at 547 km altitude and has made over 1.5 million observations!',
                funFact: 'Hubble can see objects 13.4 billion light-years away - almost to the beginning of time!',
                realSize: '13.2m long, 4.2m diameter',
                orbitTime: '95 minutes'
            },
            { 
                name: 'GPS Satellites', 
                distance: 3.5,  // ~20,200 km altitude
                speed: 2,  // GPS satellites orbit twice per day
                size: 0.025,
                color: 0x00FF00,
                description: '📡 The GPS constellation consists of at least 24 satellites orbiting at 20,200 km altitude. They provide positioning data to billions of devices worldwide. Each satellite contains atomic clocks accurate to nanoseconds!',
                funFact: 'Your phone connects to at least 4 GPS satellites to determine your exact location!',
                realSize: '5m wingspan',
                orbitTime: '12 hours'
            },
            { 
                name: 'James Webb Space Telescope', 
                distance: 250,  // At L2 point, ~1.5 million km from Earth (scaled)
                speed: 0.01,  // Orbits sun at L2 point with Earth
                size: 0.04,
                color: 0xFFD700,
                description: '🔬 JWST is the most powerful space telescope ever built! Launched in 2021, it orbits the Sun at the L2 Lagrange point, 1.5 million km from Earth. Its infrared vision can see the first galaxies formed after the Big Bang!',
                funFact: 'JWST\'s mirror is 6.5m wide - about 3x larger than Hubble\'s! Its sunshield is as big as a tennis court.',
                realSize: '6.5m mirror diameter',
                orbitTime: 'Synced with Earth (1 year)'
            },
            { 
                name: 'Starlink Constellation', 
                distance: 1.09,  // ~550 km altitude
                speed: 15,
                size: 0.015,
                color: 0xFF6B6B,
                description: '🛰️ Starlink is SpaceX\'s satellite internet constellation with over 5,000 satellites in low Earth orbit! They provide high-speed internet to remote areas. Each satellite weighs about 260 kg.',
                funFact: 'SpaceX launches up to 60 Starlink satellites at a time and plans for 42,000 total!',
                realSize: '2.8m × 1.4m',
                orbitTime: '95 minutes'
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

    update(deltaTime, timeSpeed, camera, controls) {
        // Update all planets
        Object.values(this.planets).forEach(planet => {
            if (planet && planet.userData) {
                planet.userData.angle += planet.userData.speed * timeSpeed;
                planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
                planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
                planet.rotation.y += planet.userData.rotationSpeed * timeSpeed;
                
                // Rotate clouds slightly faster than planet for Earth
                if (planet.userData.clouds) {
                    planet.userData.clouds.rotation.y += planet.userData.rotationSpeed * timeSpeed * 1.1;
                }

                // Update moons
                if (planet.userData.moons) {
                    planet.userData.moons.forEach(moon => {
                        if (moon.userData) {
                            moon.userData.angle += moon.userData.speed * timeSpeed;
                            moon.position.x = moon.userData.distance * Math.cos(moon.userData.angle);
                            moon.position.z = moon.userData.distance * Math.sin(moon.userData.angle);
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
        return [
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
                
                // Update XR controller movement
                this.sceneManager.updateXRMovement();
                
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


