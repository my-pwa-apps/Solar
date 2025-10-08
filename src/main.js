// Scientific VR/AR Explorer - Optimized No-Build Version
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ===========================
// TEXTURE CACHE SYSTEM
// ===========================
class TextureCache {
    constructor() {
        this.cache = new Map();
        this.dbName = 'SolarSystemTextureCache';
        this.dbVersion = 1;
        this.storeName = 'textures';
        this.db = null;
        this.initPromise = this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async get(key) {
        // Check memory cache first
        if (this.cache.has(key)) {
            if (DEBUG.PERFORMANCE) console.log(`📦 Cache HIT (memory): ${key}`);
            return this.cache.get(key);
        }

        // Check IndexedDB
        try {
            await this.initPromise;
            const tx = this.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => {
                    if (request.result) {
                        if (DEBUG.PERFORMANCE) console.log(`📦 Cache HIT (IndexedDB): ${key}`);
                        this.cache.set(key, request.result); // Promote to memory cache
                        resolve(request.result);
                    } else {
                        if (DEBUG.PERFORMANCE) console.log(`📦 Cache MISS: ${key}`);
                        resolve(null);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    }

    async set(key, dataURL) {
        // Set in memory cache
        this.cache.set(key, dataURL);

        // Set in IndexedDB for persistence
        try {
            await this.initPromise;
            const tx = this.db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.put(dataURL, key);
                request.onsuccess = () => {
                    if (DEBUG.PERFORMANCE) console.log(`📦 Cache SET: ${key} (${(dataURL.length / 1024).toFixed(0)}KB)`);
                    resolve();
                };
                request.onerror = () => {
                    console.warn('Cache write error:', error);
                    resolve(); // Don't reject, just continue
                };
            });
        } catch (error) {
            console.warn('Cache write error:', error);
        }
    }

    async clear() {
        this.cache.clear();
        try {
            await this.initPromise;
            const tx = this.db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            await store.clear();
            console.log('🗑️ Texture cache cleared');
        } catch (error) {
            console.warn('Cache clear error:', error);
        }
    }
}

// Global texture cache instance
const TEXTURE_CACHE = new TextureCache();

// Warm up cache with essential textures (run in background)
async function warmupTextureCache() {
    const essentialTextures = [
        'earth_texture_4096',
        'moon_texture_2048',
        'mars_texture_2048'
    ];
    
    let cached = 0;
    for (const key of essentialTextures) {
        if (await TEXTURE_CACHE.get(key)) {
            cached++;
        }
    }
    
    if (DEBUG.PERFORMANCE) {
        console.log(`📦 Texture cache: ${cached}/${essentialTextures.length} essential textures cached`);
    }
    
    return cached === essentialTextures.length;
}

// Helper function to wrap texture generation with caching
async function cachedTextureGeneration(cacheKey, generatorFn) {
    // Try to load from cache
    const cachedDataURL = await TEXTURE_CACHE.get(cacheKey);
    if (cachedDataURL) {
        const startTime = performance.now();
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = img;
                const texture = new THREE.CanvasTexture(canvas);
                texture.needsUpdate = true;
                if (DEBUG.PERFORMANCE) {
                    console.log(`⚡ Loaded ${cacheKey} from cache in ${(performance.now() - startTime).toFixed(0)}ms`);
                }
                resolve(texture);
            };
            img.src = cachedDataURL;
        });
    }
    
    // Generate texture if not cached
    const startTime = performance.now();
    const { canvas, texture } = await generatorFn();
    
    // Cache for future use
    const dataURL = canvas.toDataURL('image/png');
    TEXTURE_CACHE.set(cacheKey, dataURL).catch(err => 
        console.warn('Failed to cache texture:', err)
    );
    
    if (DEBUG.PERFORMANCE) {
        console.log(`🎨 Generated ${cacheKey} in ${(performance.now() - startTime).toFixed(0)}ms`);
    }
    
    return texture;
}

// ===========================
// CONSTANTS & CONFIG
// ===========================

// Debug configuration - enable with URL parameters: ?debug=true&debug-vr=true&debug-textures=true
const DEBUG = {
    enabled: new URLSearchParams(window.location.search).has('debug'),
    VR: new URLSearchParams(window.location.search).has('debug-vr'),
    TEXTURES: new URLSearchParams(window.location.search).has('debug-textures'),
    PERFORMANCE: new URLSearchParams(window.location.search).has('debug-performance')
};

// Mobile & Performance Detection
const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const IS_LOW_POWER = navigator.hardwareConcurrency < 4;
const QUALITY_PRESET = (IS_MOBILE || IS_LOW_POWER) ? 'low' : 'high';

const CONFIG = {
    RENDERER: {
        antialias: !IS_MOBILE, // Disable AA on mobile for performance
        alpha: true,
        powerPreference: 'high-performance',
        maxPixelRatio: IS_MOBILE ? 1.5 : 2, // Lower on mobile
        logarithmicDepthBuffer: true
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
        maxDeltaTime: 0.1
    },
    QUALITY: {
        // Adaptive quality based on device
        textureSize: IS_MOBILE ? 1024 : 4096,
        sphereSegments: IS_MOBILE ? 32 : 128,
        lowPowerSegments: 32,
        particleSize: 2,
        particleCount: IS_MOBILE ? 1000 : 5000,
        shadows: !IS_MOBILE // Disable shadows on mobile
    }
};

// Suppress harmless WebGL shader validation warnings
const originalWarn = console.warn;
console.warn = function(...args) {
    const msg = args.join(' ');
    // Filter out known harmless WebGL shader warnings
    if (msg.includes('THREE.WebGLProgram') && msg.includes('VALIDATE_STATUS')) {
        // Suppress - this is a harmless validation warning that doesn't affect functionality
        return;
    }
    if (msg.includes('Vertex shader is not compiled')) {
        // Suppress - shader compiles successfully despite warning
        return;
    }
    originalWarn.apply(console, args);
};

// Log configuration (only if debug enabled)
if (DEBUG.enabled) {
    console.log('🚀 Solar System Explorer - Debug Mode Enabled');
    console.log('📱 Device:', IS_MOBILE ? 'Mobile' : 'Desktop');
    console.log('⚡ Quality Preset:', QUALITY_PRESET);
    console.log('🎨 Texture Size:', CONFIG.QUALITY.textureSize);
    console.log('🔺 Sphere Segments:', CONFIG.QUALITY.sphereSegments);
}

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
        this.labelsVisible = false; // Initialize labels as hidden
        
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
        this.renderer.toneMappingExposure = 1.2; // Increased to brighten dark areas
        
        // Performance optimizations
        this.renderer.sortObjects = false; // Skip sorting for better performance
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Add WebGL context loss/restore handlers
        this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('⚠️ WebGL context lost - attempting recovery...');
            // Three.js setAnimationLoop handles this internally
        }, false);
        
        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            console.log('✅ WebGL context restored');
            // Three.js setAnimationLoop will automatically restart
        }, false);
        
        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            throw new Error('Canvas container not found');
        }
        
        // Setup CSS2D label renderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(this.labelRenderer.domElement);
        
        // Label visibility state - start hidden
        this.labelsVisible = false;
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
        // Ambient light - provides base illumination so dark sides are visible
        this.lights.ambient = new THREE.AmbientLight(0x444466, 0.6);
        this.scene.add(this.lights.ambient);

        // Hemisphere light for space lighting (starlight from above/below)
        this.lights.hemisphere = new THREE.HemisphereLight(0x5555aa, 0x222244, 0.4);
        this.scene.add(this.lights.hemisphere);

        // Camera light - helps viewing dark sides without overpowering
        this.lights.camera = new THREE.PointLight(0x8899dd, 0.8, 600);
        this.camera.add(this.lights.camera);
        this.scene.add(this.camera);
        
        if (DEBUG.enabled) {
            console.log('🌌 Scene ambient lighting: Enhanced (ambient 0.6, hemisphere 0.4, camera 0.8)');
            console.log('   - Dark sides clearly visible for navigation');
            console.log('   - Sun is still primary light source');
        }
    }

    setupXR() {
        try {
            console.log('🥽 Setting up XR...');
            console.log('📦 Scene children at XR setup:', this.scene?.children?.length || 0);
            
            // Create a dolly (rig) for VR movement (but don't add camera yet - only in VR mode)
            this.dolly = new THREE.Group();
            this.dolly.position.set(0, 50, 150); // Start away from Sun
            this.scene.add(this.dolly);
            
            // Store original camera parent for switching back
            this.cameraOriginalParent = this.camera.parent;
            
            console.log('🎥 Dolly created at:', this.dolly.position);
            
            // Initialize XR controllers
            this.controllers = [];
            this.controllerGrips = [];
            this.lasersVisible = true; // Toggle for laser pointers
            
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
                
                // Thin laser line - subtle and precise
                const laserGeometry = new THREE.CylinderGeometry(0.001, 0.001, 10, 6);
                const laserMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.6
                });
                
                const laser = new THREE.Mesh(laserGeometry, laserMaterial);
                laser.rotation.x = Math.PI / 2; // Rotate to point forward
                laser.position.set(0, 0, -5); // Position at center of 10m length
                laser.name = 'laser';
                laser.visible = true; // Can be toggled
                controller.add(laser);
                
                // Small, clear target point where laser hits
                const pointerGeometry = new THREE.SphereGeometry(0.01, 8, 8);
                const pointerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.8
                });
                const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
                pointer.position.set(0, 0, -10);
                pointer.name = 'pointer';
                pointer.visible = true; // Can be toggled
                controller.add(pointer);
                
                // Subtle outer ring for better visibility
                const glowGeometry = new THREE.SphereGeometry(0.015, 8, 8);
                const glowMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.2,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false // Don't block objects behind the glow
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                pointer.add(glow);
                
                // Add a cone at controller tip for direction indicator
                const coneGeometry = new THREE.ConeGeometry(0.02, 0.4, 8);
                const coneMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff
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
            
            // Custom VR Button - Explicitly request immersive-vr mode
            const vrButton = document.createElement('button');
            vrButton.id = 'VRButton';
            vrButton.style.cssText = 'position: fixed; bottom: 80px; right: 20px; width: 50px; height: 50px; cursor: pointer; padding: 0; border: 2px solid #fff; border-radius: 50%; background: rgba(0,0,0,0.8); color: #fff; font-size: 24px; text-align: center; line-height: 50px; opacity: 0.9; outline: none; z-index: 999; transition: all 0.3s;';
            vrButton.innerHTML = '🥽'; // VR headset emoji
            vrButton.title = 'Enter VR Mode';
            
            // Hover effect
            vrButton.onmouseenter = () => {
                vrButton.style.opacity = '1';
                vrButton.style.transform = 'scale(1.1)';
            };
            vrButton.onmouseleave = () => {
                vrButton.style.opacity = '0.9';
                vrButton.style.transform = 'scale(1)';
            };
            
            vrButton.onclick = async () => {
                if (navigator.xr) {
                    try {
                        // Explicitly request immersive-vr mode
                        const session = await navigator.xr.requestSession('immersive-vr', {
                            requiredFeatures: ['local-floor']
                        });
                        await this.renderer.xr.setSession(session);
                        console.log('✅ VR session started via custom button');
                    } catch (error) {
                        console.error('❌ Failed to start VR session:', error);
                        alert('Could not enter VR mode: ' + error.message);
                    }
                } else {
                    alert('WebXR not supported');
                }
            };
            
            const vrContainer = document.getElementById('vr-button');
            if (vrContainer) {
                vrContainer.appendChild(vrButton);
                vrContainer.classList.remove('hidden');
            }

            // Custom AR Button - Icon style
            const arButton = document.createElement('button');
            arButton.id = 'ARButton';
            arButton.style.cssText = 'position: fixed; bottom: 80px; right: 150px; width: 50px; height: 50px; cursor: pointer; padding: 0; border: 2px solid #fff; border-radius: 50%; background: rgba(0,0,0,0.8); color: #fff; font-size: 24px; text-align: center; line-height: 50px; opacity: 0.9; outline: none; z-index: 999; transition: all 0.3s;';
            arButton.innerHTML = '📱'; // Mobile device for AR
            arButton.title = 'Enter AR Mode';
            
            // Hover effect
            arButton.onmouseenter = () => {
                arButton.style.opacity = '1';
                arButton.style.transform = 'scale(1.1)';
            };
            arButton.onmouseleave = () => {
                arButton.style.opacity = '0.9';
                arButton.style.transform = 'scale(1)';
            };
            
            arButton.onclick = async () => {
                if (navigator.xr) {
                    try {
                        // Explicitly request immersive-ar mode
                        const session = await navigator.xr.requestSession('immersive-ar', {
                            requiredFeatures: ['local-floor'],
                            optionalFeatures: ['dom-overlay', 'hit-test']
                        });
                        await this.renderer.xr.setSession(session);
                        console.log('✅ AR session started via custom button');
                    } catch (error) {
                        console.error('❌ Failed to start AR session:', error);
                        alert('Could not enter AR mode: ' + error.message);
                    }
                } else {
                    alert('WebXR not supported');
                }
            };
            
            const arContainer = document.getElementById('ar-button');
            if (arContainer) {
                arContainer.appendChild(arButton);
                arContainer.classList.remove('hidden');
            }

            // Handle XR session start
            this.renderer.xr.addEventListener('sessionstart', () => {
                const session = this.renderer.xr.getSession();
                console.log('🥽 XR SESSION STARTED - Mode:', session.mode);
                console.log('🌐 Environment Blend Mode:', session.environmentBlendMode);
                
                if (session.mode === 'immersive-ar') {
                    console.warn('⚠️ AR mode detected! If you want VR, use the "ENTER VR" button.');
                } else if (session.mode === 'immersive-vr') {
                    console.log('✅ VR mode confirmed!');
                }
                
                // Move camera to dolly for VR
                if (this.dolly && this.camera) {
                    // Remove camera from scene
                    if (this.camera.parent) {
                        this.camera.parent.remove(this.camera);
                    }
                    // Add camera to dolly
                    this.dolly.add(this.camera);
                    // Reset camera local position
                    this.camera.position.set(0, 0, 0);
                    // Position dolly for good initial view
                    this.dolly.position.set(0, 50, 150);
                    console.log('🎥 Camera moved to dolly at:', this.dolly.position);
                }
                
                // Set background based on session type
                if (session.mode === 'immersive-ar' || 
                    session.environmentBlendMode === 'additive' || 
                    session.environmentBlendMode === 'alpha-blend') {
                    this.scene.background = null; // Transparent for AR
                    console.log('📱 AR MODE: Transparent background');
                } else {
                    // VR mode - keep starfield background
                    this.scene.background = new THREE.Color(0x000011);
                    console.log('🥽 VR MODE: Dark space background');
                }
                
                // Show welcome message and instructions
                if (DEBUG.enabled || DEBUG.VR) {
                    console.log('📋 CONTROLS:');
                    console.log('   🕹️ Left Stick: Move forward/back/strafe');
                    console.log('   🕹️ Right Stick: Turn left/right, move up/down');
                    console.log('   🎯 Trigger: Sprint mode (hold while moving)');
                    console.log('   🤏 Grip Button: Toggle VR menu (pause, controls, etc.)');
                    console.log('   👉 Point + Trigger: Select planets');
                    console.log('💡 TIP: Press GRIP BUTTON to open VR menu!');
                }
                
                // Hide VR UI panel initially - let user toggle with grip
                if (this.vrUIPanel) {
                    this.vrUIPanel.visible = false;
                }
                
                // Log scene state
                console.log('🌟 Scene children count:', this.scene.children.length);
                console.log('☀️ Sun in scene:', this.solarSystemModule?.sun ? 'YES' : 'NO');
            });

            // Handle XR session end
            this.renderer.xr.addEventListener('sessionend', () => {
                console.log('🥽 XR SESSION ENDED');
                
                // Restore camera to scene
                if (this.dolly && this.camera && this.camera.parent === this.dolly) {
                    this.dolly.remove(this.camera);
                    this.scene.add(this.camera);
                    // Restore camera position from dolly position
                    this.camera.position.copy(this.dolly.position);
                    console.log('🎥 Camera restored to scene at:', this.camera.position);
                }
                
                this.scene.background = new THREE.Color(0x000000);
                // Hide VR UI panel
                if (this.vrUIPanel) this.vrUIPanel.visible = false;
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Background
        ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
        ctx.fillRect(0, 0, 1024, 768);
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚀 Space Explorer VR', 512, 80);
        
        // Subtitle
        ctx.fillStyle = '#fff';
        ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.fillText('Use Triggers to Select Buttons', 512, 120);
        
        // Initialize pause mode state
        this.pauseMode = 'none'; // 'none', 'orbital', 'all'
        
        // Define buttons (canvas is 1024x768)
        this.vrButtons = [
            // Row 1: Playback controls
            { x: 50, y: 160, w: 150, h: 70, label: '⏸️ All', action: 'pauseall', color: '#e74c3c' },
            { x: 210, y: 160, w: 150, h: 70, label: '⏸️ Orbit', action: 'pauseorbit', color: '#e67e22' },
            { x: 370, y: 160, w: 150, h: 70, label: '▶️ Play', action: 'play', color: '#2ecc71' },
            { x: 530, y: 160, w: 140, h: 70, label: '⏪ Slower', action: 'speed--', color: '#9b59b6' },
            { x: 680, y: 160, w: 140, h: 70, label: '⏩ Faster', action: 'speed++', color: '#3498db' },
            { x: 830, y: 160, w: 140, h: 70, label: '⚡ 1x', action: 'speedreset', color: '#16a085' },
            
            // Row 2: Visual controls
            { x: 50, y: 250, w: 145, h: 70, label: '💡 +', action: 'brightup', color: '#f39c12' },
            { x: 205, y: 250, w: 145, h: 70, label: '💡 -', action: 'brightdown', color: '#d68910' },
            { x: 360, y: 250, w: 145, h: 70, label: '☄️ Tails', action: 'tails', color: '#1abc9c' },
            { x: 515, y: 250, w: 145, h: 70, label: '🎯 Lasers', action: 'togglelasers', color: '#3498db' },
            { x: 670, y: 250, w: 145, h: 70, label: '📏 Scale', action: 'scale', color: '#8e44ad' },
            { x: 825, y: 250, w: 145, h: 70, label: '🔄 Reset', action: 'reset', color: '#34495e' },
            
            // Row 3: Navigation
            { x: 50, y: 340, w: 460, h: 80, label: '🌍 Focus Earth', action: 'earth', color: '#16a085' },
            { x: 520, y: 340, w: 450, h: 80, label: '🏠 Reset View', action: 'reset', color: '#2980b9' },
            
            // Row 4: Menu control
            { x: 50, y: 450, w: 460, h: 80, label: '❌ Close Menu', action: 'hide', color: '#7f8c8d' },
            { x: 520, y: 450, w: 450, h: 80, label: '🚪 Exit VR', action: 'exitvr', color: '#c0392b' }
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
            ctx.font = 'bold 32px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 12);
        });
        
        // Time Speed Slider
        const sliderY = 560;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
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
        ctx.font = 'bold 28px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Mode: ▶️ Playing | Speed: 1x | Brightness: 50%', 512, 685);
        ctx.fillStyle = '#fff';
        ctx.font = '22px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.fillText('⏸️ All = Pause Everything | ⏸️ Orbit = Pause Solar Orbits Only', 512, 720);
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
        
        if (DEBUG.enabled || DEBUG.VR) {
            console.log('🥽 ✅ VR UI Panel created with', this.vrButtons.length, 'buttons');
            console.log('🥽 📊 Button layout:', this.vrButtons.map(b => `"${b.label}" at (${b.x},${b.y})`));
        }
    }
    
    onSelectStart(controller, index) {
        // Handle controller trigger press
        if (DEBUG.VR) console.log(`🥽 Controller ${index} trigger pressed`);
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
            if (DEBUG.VR) console.log('🥽 VR UI Panel is visible - checking for button clicks');
            const intersects = raycaster.intersectObject(this.vrUIPanel);
            
            if (intersects.length > 0) {
                const uv = intersects[0].uv;
                const x = uv.x * 1024;
                const y = (1 - uv.y) * 768;
                console.log(`🥽 VR UI clicked at pixel (${Math.round(x)}, ${Math.round(y)})`);
                
                // Check which button was clicked
                let buttonFound = false;
                this.vrButtons.forEach(btn => {
                    if (x >= btn.x && x <= btn.x + btn.w && 
                        y >= btn.y && y <= btn.y + btn.h) {
                        console.log(`🥽 ✅ VR Button clicked: "${btn.label}" - Action: ${btn.action}`);
                        this.handleVRAction(btn.action);
                        this.flashVRButton(btn);
                        buttonFound = true;
                    }
                });
                
                if (!buttonFound) {
                    console.log(`🥽 ⚠️ Clicked UI panel but no button at (${Math.round(x)}, ${Math.round(y)})`);
                }
                return; // Don't check for object selection if we clicked UI
            }
        }
        
        // If UI wasn't clicked, check for object selection (planets, moons, etc.)
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            if (DEBUG.VR) console.log('🥽 VR Selected object:', hitObject.name || hitObject.type);
            
            // Try to focus on the selected object
            const app = window.app || this;
            if (app.solarSystemModule) {
                const module = app.solarSystemModule;
                
                // Check if it's a planet or celestial body
                if (hitObject.name && module.focusOnObject) {
                    // If grip+trigger held, zoom VERY close for inspection
                    if (gripHeld) {
                        this.zoomToObject(hitObject, 'close');
                        if (DEBUG.VR) console.log('🥽 ZOOMING CLOSE to:', hitObject.name);
                        if (this.vrUIPanel) {
                            this.updateVRStatus(`🔍 Inspecting: ${hitObject.name}`);
                        }
                    } else {
                        // Normal focus
                        module.focusOnObject(hitObject, this.camera, this.controls);
                        if (DEBUG.VR) console.log('🥽 Focused on:', hitObject.name);
                        if (this.vrUIPanel) {
                            this.updateVRStatus(`✓ Selected: ${hitObject.name}`);
                        }
                    }
                }
            }
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
            
            // Position panel in front of user when showing
            if (this.vrUIPanel.visible) {
                // Place 2.5 meters in front, at eye level
                this.vrUIPanel.position.set(0, 1.6, -2.5);
                // Face the user (rotate to face +Z direction)
                this.vrUIPanel.rotation.set(0, 0, 0);
                
                // Always force lasers ON when menu opens
                // This ensures user can interact with the menu even if lasers were hidden
                this.lasersVisible = true;
                this.controllers.forEach(controller => {
                    const laser = controller.getObjectByName('laser');
                    const pointer = controller.getObjectByName('pointer');
                    if (laser) laser.visible = true;
                    if (pointer) pointer.visible = true;
                });
                
                if (DEBUG.VR) {
                    console.log('🎯 Lasers enabled for menu interaction');
                    console.log('🥽 VR Menu OPENED');
                    console.log('   Position:', this.vrUIPanel.position);
                    console.log('   Press grip button again to close');
                }
            } else {
                if (DEBUG.VR) console.log('🥽 VR Menu CLOSED');
                // Lasers keep their current state when menu closes (user may have toggled them in menu)
            }
            
            // Update status text on panel
            if (this.vrUIPanel.visible) {
                this.updateVRStatus('VR Menu Active - Use laser to interact');
            }
        } else if (triggerHeld) {
            if (DEBUG.VR) console.log('🥽 Grip+Trigger held - zoom mode (menu disabled)');
        } else if (!this.vrUIPanel) {
            console.warn('⚠️ VR UI Panel not initialized!');
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
        
        console.log(`?? VR Zoomed to ${object.userData?.name || 'object'} at distance ${distance.toFixed(2)}`);
    }
    
    handleVRAction(action) {
        console.log(`🥽 🎯 Executing VR Action: "${action}"`);
        
        // Get current app state
        const app = window.app || this;
        
        if (!app) {
            console.error('❌ VR Action failed: app not found');
            return;
        }
        
        switch(action) {
            case 'pauseall':
                // Pause everything - set timeSpeed to 0
                if (app) {
                    app.timeSpeed = 0;
                    this.updateVRStatus('⏸️ PAUSED - Everything Stopped');
                    this.updateVRUI();
                    console.log('⏸️ VR: Paused all motion');
                }
                break;
                
            case 'pauseorbit':
                // Pause solar orbits only (planets stop moving but keep rotating)
                if (app.solarSystemModule) {
                    const module = app.solarSystemModule;
                    if (module.pauseOrbits !== undefined) {
                        module.pauseOrbits = true;
                        this.updateVRStatus('⏸️ ORBITAL PAUSE - Planets Frozen in Orbit');
                        this.updateVRUI();
                        console.log('⏸️ VR: Paused orbital motion only');
                    }
                }
                break;
                
            case 'play':
                // Resume everything
                if (app) {
                    if (app.timeSpeed === 0) {
                        app.timeSpeed = 1;
                    }
                    if (app.solarSystemModule) {
                        app.solarSystemModule.pauseOrbits = false;
                    }
                    this.updateVRStatus('▶️ PLAYING - All Motion Active');
                    this.updateVRUI();
                    console.log('▶️ VR: Resumed motion');
                }
                break;
            case 'speed++':
            case 'speed--':
                if (app) {
                    // Toggle: Paused (0) <-> Animated (1)
                    if (app.timeSpeed === 0) {
                        app.timeSpeed = 1;
                        this.updateVRStatus('▶️ Animated');
                    } else {
                        app.timeSpeed = 0;
                        this.updateVRStatus('⏸️ Paused');
                    }
                    this.updateVRUI();
                    console.log(`⚡ VR: Speed mode: ${app.timeSpeed}x`);
                }
                break;
                
            case 'speedreset':
                if (app) {
                    app.timeSpeed = 1;
                    this.updateVRStatus('▶️ Animated');
                    this.updateVRUI();
                    console.log('⚡ VR: Speed reset to Educational (1x)');
                }
                break;
            case 'brightup':
                if (app) {
                    app.brightness = Math.min((app.brightness || 100) + 10, 200);
                    this.updateBrightness(app.brightness / 100);
                    this.updateVRStatus(`💡 Brightness: ${app.brightness}%`);
                }
                break;
            case 'brightdown':
                if (app) {
                    app.brightness = Math.max((app.brightness || 100) - 10, 20);
                    this.updateBrightness(app.brightness / 100);
                    this.updateVRStatus(`💡 Brightness: ${app.brightness}%`);
                }
                break;
            case 'tails':
                if (app.solarSystemModule) {
                    const module = app.solarSystemModule;
                    module.cometTailsVisible = !module.cometTailsVisible;
                    this.updateVRStatus(`☄️ Tails ${module.cometTailsVisible ? 'ON' : 'OFF'}`);
                }
                break;
            case 'togglelasers':
                this.lasersVisible = !this.lasersVisible;
                // Toggle visibility of all laser pointers
                this.controllers.forEach(controller => {
                    const laser = controller.getObjectByName('laser');
                    const pointer = controller.getObjectByName('pointer');
                    if (laser) laser.visible = this.lasersVisible;
                    if (pointer) pointer.visible = this.lasersVisible;
                });
                this.updateVRStatus(`🎯 Lasers ${this.lasersVisible ? 'ON' : 'OFF'}`);
                console.log(`🎯 VR Laser pointers ${this.lasersVisible ? 'visible' : 'hidden'}`);
                break;
            case 'scale':
                if (app.solarSystemModule) {
                    const module = app.solarSystemModule;
                    module.realisticScale = !module.realisticScale;
                    module.updateScale();
                    this.updateVRStatus(`📏 ${module.realisticScale ? 'Realistic' : 'Educational'} Scale`);
                }
                break;
            case 'reset':
                this.resetCamera();
                if (app.solarSystemModule) {
                    app.solarSystemModule.focusedObject = null;
                }
                this.updateVRStatus('🔄 View Reset');
                break;
            case 'earth':
                if (app.solarSystemModule) {
                    const earth = app.solarSystemModule.planets?.earth;
                    if (earth) {
                        app.solarSystemModule.focusOnObject(earth, this.camera, this.controls);
                        this.updateVRStatus('🌍 Focused on Earth');
                    }
                }
                break;
            case 'hide':
                if (DEBUG.VR) console.log('🥽 Hiding VR menu');
                if (this.vrUIPanel) {
                    this.vrUIPanel.visible = false;
                    if (DEBUG.VR) console.log('🥽 ✅ VR menu hidden');
                }
                break;
            case 'exitvr':
                if (DEBUG.VR) console.log('🥽 Exiting VR mode');
                // End the XR session
                if (this.renderer.xr.isPresenting) {
                    const session = this.renderer.xr.getSession();
                    if (session) {
                        session.end().then(() => {
                            console.log('🥽 ✅ VR session ended');
                        }).catch(err => {
                            console.error('🥽 ❌ Error ending VR session:', err);
                        });
                    }
                }
                break;
            default:
                console.warn(`🥽 ⚠️ Unknown VR action: "${action}"`);
                this.updateVRStatus(`⚠️ Unknown action: ${action}`);
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
        const speed = app.timeSpeed || 0;
        const brightness = app.brightness || 50;
        
        // Mode text
        let modeText = '▶️ Playing';
        if (this.pauseMode === 'all') modeText = '⏸️ Paused All';
        else if (this.pauseMode === 'orbital') modeText = '⏸️ Orbital Pause';
        
        // Status line
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 28px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Mode: ${modeText} | Speed: ${speed}x | Brightness: ${brightness}%`, 512, 685);
        
        // Info lines
        ctx.fillStyle = '#fff';
        ctx.font = '22px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.fillText(message || 'Ready', 512, 720);
        ctx.fillText('Use Laser to Click Buttons or Drag Slider', 512, 750);
        
        this.vrUIPanel.material.map.needsUpdate = true;
    }
    
    updateVRUI() {
        // Redraw speed mode selector with current speed
        const app = window.app || this;
        const speed = app.timeSpeed || 0;
        const ctx = this.vrUIContext;
        
        // Clear selector area
        const sliderY = 560;
        const sliderX = 280;
        const boxW = 200;
        const boxH = 60;
        const spacing = 20;
        
        ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
        ctx.fillRect(0, sliderY - 80, 1024, 140);
        
        // Redraw label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('⏱️ Speed Mode:', 50, sliderY - 20);
        
        // Two mode boxes
        const modes = [
            { label: '⏸️ Paused', value: 0, x: sliderX + boxW / 2 },
            { label: '▶️ Animated', value: 1, x: sliderX + (boxW * 1.5) + spacing }
        ];
        
        ctx.font = '24px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.textAlign = 'center';
        
        modes.forEach(mode => {
            const isActive = speed === mode.value;
            
            // Box background
            ctx.fillStyle = isActive ? '#3498db' : '#34495e';
            ctx.fillRect(mode.x, sliderY, boxW, boxH);
            
            // Box border
            ctx.strokeStyle = isActive ? '#fff' : '#7f8c8d';
            ctx.lineWidth = isActive ? 4 : 2;
            ctx.strokeRect(mode.x, sliderY, boxW, boxH);
            
            // Text
            ctx.fillStyle = '#fff';
            ctx.fillText(mode.label, mode.x + boxW / 2, sliderY + boxH / 2 + 8);
        });
        
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
            console.warn('?? Dolly not found!');
            return;
        }
        
        // Get controller inputs for movement
        const session = this.renderer.xr.getSession();
        if (!session) return;
        
        const inputSources = session.inputSources;
        
        // FIX: Use DOLLY rotation for consistent movement direction
        // Get dolly's forward direction (based on its rotation)
        const dollyForward = new THREE.Vector3(0, 0, -1);
        dollyForward.applyQuaternion(this.dolly.quaternion);
        dollyForward.y = 0; // Keep horizontal
        dollyForward.normalize();
        
        // Get dolly's right direction (perpendicular to forward)
        const dollyRight = new THREE.Vector3();
        dollyRight.crossVectors(dollyForward, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Track if trigger is held for sprint
        let sprintMultiplier = 1.0;
        
        for (let i = 0; i < inputSources.length; i++) {
            const inputSource = inputSources[i];
            const gamepad = inputSource.gamepad;
            const handedness = inputSource.handedness;
            
            if (!gamepad) {
                if (Math.random() < 0.01) {
                    console.warn(`?? No gamepad for controller ${i}`);
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
                    console.log(`?? ${handedness?.toUpperCase() || 'UNKNOWN'} pressed:`, pressed.join(', '));
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
                const baseSpeed = 0.25 * sprintMultiplier;
                
                // Forward/Backward & Strafe
                if (Math.abs(stickX) > deadzone || Math.abs(stickY) > deadzone) {
                    // FORWARD/BACKWARD: Push stick FORWARD to move FORWARD
                    // Use dolly's forward direction (not camera) for consistent movement
                    // In VR controllers, pushing stick forward gives NEGATIVE Y value
                    this.dolly.position.add(dollyForward.clone().multiplyScalar(-stickY * baseSpeed));
                    
                    // STRAFE LEFT/RIGHT: Use dolly's right direction
                    this.dolly.position.add(dollyRight.clone().multiplyScalar(stickX * baseSpeed));
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
        if (this.labelRenderer) {
            this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        }
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
            try {
                this.controls.update();
                callback();
                this.renderer.render(this.scene, this.camera);
                if (this.labelRenderer) {
                    this.labelRenderer.render(this.scene, this.camera);
                }
            } catch (error) {
                console.error('❌ ERROR in animation loop:', error);
                console.error('   Stack:', error.stack);
                // Don't stop the loop, just log the error
            }
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
            loading.querySelector('h2').textContent = '?? Error';
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
    
    setupSolarSystemUI(solarSystemModule, sceneManager) {
        // Setup explorer panel with Solar System content
        const focusCallback = (obj) => {
            if (obj) {
                const info = solarSystemModule.getObjectInfo(obj);
                this.updateInfoPanel(info);
                solarSystemModule.focusOnObject(obj, sceneManager.camera, sceneManager.controls);
            }
        };
        
        if (solarSystemModule && typeof solarSystemModule.getExplorerContent === 'function') {
            const explorerContent = solarSystemModule.getExplorerContent(focusCallback);
            if (explorerContent && Array.isArray(explorerContent)) {
                this.updateExplorer('🚀 Explore the Solar System', explorerContent);
            } else {
                console.error('❌ getExplorerContent returned invalid data:', explorerContent);
            }
        } else {
            console.error('❌ solarSystemModule or getExplorerContent method not found');
        }
        
        // Hide loading
        this.hideLoading();
    }
}

// ===========================
// APOLLO 11 MISSION ANIMATION
// ===========================
class Apollo11Animation {
    constructor(scene, camera, solarSystem) {
        this.scene = scene;
        this.camera = camera;
        this.solarSystem = solarSystem;
        this.isActive = false;
        this.progress = 0;
        this.phase = 0;
        this.rocket = null;
        this.stage1 = null;
        this.stage2 = null;
        this.stage3 = null;
        this.csm = null;
        this.lm = null;
        this.originalCameraParent = null;
        this.cameraMode = 0;
        this.cameraChangeTime = 0;
        this.cameraChangeDuration = 6; // Switch camera every 6 seconds (slower)
        this.hiddenObjects = null;
        
        // Mission phases with durations (in animation seconds)
        this.phases = [
            { name: 'Launch & Stage 1', duration: 12, start: 0 },
            { name: 'Stage 2 Separation', duration: 8, start: 12 },
            { name: 'Earth Orbit & Stage 3', duration: 10, start: 20 },
            { name: 'Trans-Lunar Injection', duration: 15, start: 30 },
            { name: 'CSM/LM Extraction', duration: 8, start: 45 },
            { name: 'Coast to Moon', duration: 25, start: 53 },
            { name: 'Lunar Orbit Insertion', duration: 12, start: 78 },
            { name: 'LM Separation', duration: 8, start: 90 },
            { name: 'Powered Descent', duration: 15, start: 98 },
            { name: 'Landing', duration: 7, start: 113 }
        ];
        
        this.totalDuration = 120; // Total animation in seconds
        
        // Camera viewpoints for cycling
        this.cameraViewpoints = [
            'wide_trajectory', // See the path from Earth to Moon
            'close_chase',     // Close follow
            'side_view',       // Side angle
            'front_view',      // Front view
            'orbital_overview' // Far overview
        ];
    }
    
    createRocket() {
        const rocket = new THREE.Group();
        rocket.name = 'SaturnV';
        
        // Saturn V dimensions (scaled for visibility at Earth-Moon distance)
        // Real Saturn V: 111m tall, but Earth-Moon distance is 384,400km
        // Need dramatic scaling to see rocket in trajectory shots
        const scale = 15.0; // Increased from 2.0 - makes rocket visible from wide camera angles
        
        // Reusable materials (optimization)
        const whiteMetal = new THREE.MeshStandardMaterial({ 
            color: 0xf5f5f5,
            metalness: 0.4,
            roughness: 0.6,
            envMapIntensity: 0.5
        });
        const blackMetal = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            metalness: 0.3,
            roughness: 0.7
        });
        const darkEngine = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.2
        });
        const goldFoil = new THREE.MeshStandardMaterial({ 
            color: 0xd4af37,
            metalness: 0.8,
            roughness: 0.4,
            envMapIntensity: 1.0
        });
        const brightGold = new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.5,
            envMapIntensity: 1.2
        });
        
        // First Stage (S-IC) - 42m tall, 10m diameter - Black and white checkerboard pattern
        const s1Group = new THREE.Group();
        s1Group.name = 'stage1';
        
        const s1Geometry = new THREE.CylinderGeometry(5 * scale, 5.5 * scale, 42 * scale, 24);
        const stage1Body = new THREE.Mesh(s1Geometry, whiteMetal);
        s1Group.add(stage1Body);
        
        // Add black stripes for detail (reuse geometry)
        const stripeGeometry = new THREE.CylinderGeometry(5.1 * scale, 5.6 * scale, 2 * scale, 24);
        for (let i = 0; i < 3; i++) {
            const stripe = new THREE.Mesh(stripeGeometry, blackMetal);
            stripe.position.y = -15 * scale + i * 15 * scale;
            s1Group.add(stripe);
        }
        
        // F-1 Engines (5 engines at base - reuse geometry)
        const f1EngineGeometry = new THREE.CylinderGeometry(1 * scale, 1.2 * scale, 3 * scale, 12);
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const engine = new THREE.Mesh(f1EngineGeometry, darkEngine);
            engine.position.set(
                Math.cos(angle) * 2.5 * scale,
                -22 * scale,
                Math.sin(angle) * 2.5 * scale
            );
            s1Group.add(engine);
        }
        
        s1Group.position.y = 21 * scale;
        rocket.add(s1Group);
        this.stage1 = s1Group;
        
        // Second Stage (S-II) - 25m tall - White with details
        const s2Group = new THREE.Group();
        s2Group.name = 'stage2';
        
        const s2Geometry = new THREE.CylinderGeometry(5 * scale, 5 * scale, 25 * scale, 24);
        const stage2Body = new THREE.Mesh(s2Geometry, whiteMetal);
        s2Group.add(stage2Body);
        
        // J-2 Engines (5 engines - reuse geometry)
        const j2EngineGeometry = new THREE.CylinderGeometry(0.6 * scale, 0.8 * scale, 2 * scale, 12);
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const engine = new THREE.Mesh(j2EngineGeometry, darkEngine);
            engine.position.set(
                Math.cos(angle) * 2 * scale,
                -13.5 * scale,
                Math.sin(angle) * 2 * scale
            );
            s2Group.add(engine);
        }
        
        s2Group.position.y = 54.5 * scale;
        rocket.add(s2Group);
        this.stage2 = s2Group;
        
        // Third Stage (S-IVB) - 18m tall - White
        const s3Group = new THREE.Group();
        s3Group.name = 'stage3';
        
        const s3Geometry = new THREE.CylinderGeometry(3.3 * scale, 3.3 * scale, 18 * scale, 24);
        const stage3Body = new THREE.Mesh(s3Geometry, whiteMetal);
        s3Group.add(stage3Body);
        
        // Single J-2 engine
        const s3EngineGeometry = new THREE.CylinderGeometry(0.8 * scale, 1 * scale, 2.5 * scale, 12);
        const s3Engine = new THREE.Mesh(s3EngineGeometry, darkEngine);
        s3Engine.position.y = -10 * scale;
        s3Group.add(s3Engine);
        
        s3Group.position.y = 76 * scale;
        rocket.add(s3Group);
        this.stage3 = s3Group;
        
        // Command/Service Module (CSM) - 11m tall - Silver and gold foil
        const csmGroup = new THREE.Group();
        csmGroup.name = 'csm';
        
        // Command Module (cone shape)
        const cmGeometry = new THREE.ConeGeometry(2 * scale, 4 * scale, 16);
        const silverMetal = new THREE.MeshStandardMaterial({ 
            color: 0xc0c0c0,
            metalness: 0.7,
            roughness: 0.3
        });
        const commandModule = new THREE.Mesh(cmGeometry, silverMetal);
        commandModule.position.y = 7 * scale;
        csmGroup.add(commandModule);
        
        // Service Module (cylinder with gold foil)
        const smGeometry = new THREE.CylinderGeometry(2 * scale, 2 * scale, 7 * scale, 16);
        const serviceModule = new THREE.Mesh(smGeometry, goldFoil);
        serviceModule.position.y = 2 * scale;
        csmGroup.add(serviceModule);
        
        // Service Propulsion Engine
        const speGeometry = new THREE.CylinderGeometry(0.7 * scale, 0.9 * scale, 2 * scale, 12);
        const spe = new THREE.Mesh(speGeometry, darkEngine);
        spe.position.y = -2.5 * scale;
        csmGroup.add(spe);
        
        csmGroup.position.y = 90.5 * scale;
        rocket.add(csmGroup);
        this.csm = csmGroup;
        
        // Lunar Module (LM) - Gold foil appearance
        const lmGroup = new THREE.Group();
        lmGroup.name = 'lm';
        
        // Descent stage (octagonal)
        const descentGeometry = new THREE.CylinderGeometry(2.5 * scale, 2.5 * scale, 2 * scale, 8);
        const descentStage = new THREE.Mesh(descentGeometry, brightGold);
        lmGroup.add(descentStage);
        
        // Ascent stage (smaller octagon on top)
        const ascentGeometry = new THREE.CylinderGeometry(1.8 * scale, 1.8 * scale, 2.5 * scale, 8);
        const ascentStage = new THREE.Mesh(ascentGeometry, brightGold);
        ascentStage.position.y = 2.25 * scale;
        lmGroup.add(ascentStage);
        
        // Landing legs (4 legs - reuse geometry)
        const legGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 3 * scale, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b7355,
            metalness: 0.6,
            roughness: 0.5
        });
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4 + Math.PI / 4;
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(
                Math.cos(angle) * 2 * scale,
                -2 * scale,
                Math.sin(angle) * 2 * scale
            );
            leg.rotation.z = Math.atan2(2, 2) * (i % 2 === 0 ? 1 : -1);
            lmGroup.add(leg);
        }
        
        // Descent engine
        const lmEngineGeometry = new THREE.CylinderGeometry(0.6 * scale, 0.8 * scale, 1.5 * scale, 12);
        const lmEngine = new THREE.Mesh(lmEngineGeometry, darkEngine);
        lmEngine.position.y = -1.75 * scale;
        lmGroup.add(lmEngine);
        
        lmGroup.position.y = 85 * scale;
        lmGroup.visible = false; // Hidden initially inside adapter
        rocket.add(lmGroup);
        this.lm = lmGroup;
        
        // Engine glow effects (multiple for different stages)
        const createEngineGlow = (radius, name) => {
            const glowGeometry = new THREE.CylinderGeometry(radius * scale, radius * 1.5 * scale, 8 * scale, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6600,
                transparent: true,
                opacity: 0,
                depthWrite: false
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.name = name;
            return glow;
        };
        
        const s1Glow = createEngineGlow(6, 'stage1Glow');
        s1Glow.position.y = -4 * scale;
        s1Group.add(s1Glow);
        
        const s2Glow = createEngineGlow(4, 'stage2Glow');
        s2Glow.position.y = -4 * scale;
        s2Group.add(s2Glow);
        
        const s3Glow = createEngineGlow(2, 'stage3Glow');
        s3Glow.position.y = -4 * scale;
        s3Group.add(s3Glow);
        
        const lmGlow = createEngineGlow(1.5, 'lmGlow');
        lmGlow.position.y = -1 * scale;
        lmGroup.add(lmGlow);
        
        // Enhanced exhaust particles (optimized with shared geometry)
        const exhaustGroup = new THREE.Group();
        exhaustGroup.name = 'exhaust';
        const particleGeometry = new THREE.SphereGeometry(0.3 * scale, 6, 6);
        const orangeParticleMat = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const yellowParticleMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        
        for (let i = 0; i < 100; i++) {
            const particle = new THREE.Mesh(
                particleGeometry, 
                i < 50 ? orangeParticleMat : yellowParticleMat
            );
            particle.userData.offset = Math.random() * Math.PI * 2;
            particle.userData.speed = 0.5 + Math.random() * 1.5;
            exhaustGroup.add(particle);
        }
        rocket.add(exhaustGroup);
        
        // Enable shadows for all rocket parts (for realistic lighting)
        rocket.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        return rocket;
    }
    
    start() {
        if (this.isActive) return;
        
        console.log('🚀 Starting Apollo 11 Mission Animation');
        this.isActive = true;
        this.progress = 0;
        this.phase = 0;
        this.cameraMode = 0;
        
        // Hide all celestial objects except Earth and Moon
        this.hiddenObjects = [];
        if (this.solarSystem.sun) {
            this.solarSystem.sun.visible = false;
            this.hiddenObjects.push(this.solarSystem.sun);
        }
        
        // Hide all planets except Earth
        for (const [name, planet] of Object.entries(this.solarSystem.planets)) {
            if (name !== 'earth' && planet) {
                planet.visible = false;
                this.hiddenObjects.push(planet);
            }
        }
        
        // Hide all moons except Moon
        for (const [name, moon] of Object.entries(this.solarSystem.moons)) {
            if (name !== 'moon' && moon) {
                moon.visible = false;
                this.hiddenObjects.push(moon);
            }
        }
        
        // Hide other objects (asteroids, comets, spacecraft, etc.)
        ['asteroidBelt', 'kuiperBelt', 'starfield'].forEach(prop => {
            if (this.solarSystem[prop]) {
                this.solarSystem[prop].visible = false;
                this.hiddenObjects.push(this.solarSystem[prop]);
            }
        });
        
        if (this.solarSystem.nebulae) {
            this.solarSystem.nebulae.forEach(obj => {
                if (obj) {
                    obj.visible = false;
                    this.hiddenObjects.push(obj);
                }
            });
        }
        
        if (this.solarSystem.galaxies) {
            this.solarSystem.galaxies.forEach(obj => {
                if (obj) {
                    obj.visible = false;
                    this.hiddenObjects.push(obj);
                }
            });
        }
        
        if (this.solarSystem.distantStars) {
            this.solarSystem.distantStars.forEach(obj => {
                if (obj) {
                    obj.visible = false;
                    this.hiddenObjects.push(obj);
                }
            });
        }
        
        console.log(`🙈 Hidden ${this.hiddenObjects.length} objects for Apollo mission`);
        
        // Create rocket
        this.rocket = this.createRocket();
        
        // Position at Kennedy Space Center (approximate)
        // All positions are relative to Earth's world position
        const earth = this.solarSystem.planets['earth'];
        if (earth) {
            const earthRadius = earth.userData.radius || 6.371;
            const launchPadAltitude = 0.01; // 10km above surface
            
            // Kennedy Space Center: 28.5°N, 80.5°W
            const lat = 28.5 * Math.PI / 180;
            const lon = -80.5 * Math.PI / 180;
            
            const r = earthRadius + launchPadAltitude;
            const localPos = new THREE.Vector3(
                r * Math.cos(lat) * Math.cos(lon),
                r * Math.sin(lat),
                r * Math.cos(lat) * Math.sin(lon)
            );
            
            // Position relative to Earth's world position
            this.rocket.position.copy(earth.position).add(localPos);
            
            // Point rocket away from Earth center (upward from surface)
            const upVector = localPos.clone().normalize();
            this.rocket.lookAt(
                this.rocket.position.x + upVector.x,
                this.rocket.position.y + upVector.y,
                this.rocket.position.z + upVector.z
            );
        }
        
        this.scene.add(this.rocket);
        
        // Store original camera state
        this.originalCameraParent = this.camera.parent;
        
        // Show mission UI
        this.showMissionUI();
    }
    
    stop() {
        if (!this.isActive) return;
        
        console.log('🛑 Stopping Apollo 11 Mission Animation');
        this.isActive = false;
        
        // Remove all separated stages from scene
        if (this.stage1 && this.stage1.parent === this.scene) {
            this.scene.remove(this.stage1);
        }
        if (this.stage2 && this.stage2.parent === this.scene) {
            this.scene.remove(this.stage2);
        }
        if (this.stage3 && this.stage3.parent === this.scene) {
            this.scene.remove(this.stage3);
        }
        
        // Remove rocket and all children
        if (this.rocket) {
            this.scene.remove(this.rocket);
            // Dispose geometries and materials to free memory
            this.rocket.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.rocket = null;
        }
        
        // Clear references
        this.stage1 = null;
        this.stage2 = null;
        this.stage3 = null;
        this.csm = null;
        this.lm = null;
        
        // Restore visibility of all hidden objects
        if (this.hiddenObjects) {
            this.hiddenObjects.forEach(obj => {
                if (obj) obj.visible = true;
            });
            console.log(`👁️ Restored visibility of ${this.hiddenObjects.length} objects`);
            this.hiddenObjects = null;
        }
        
        // Restore camera
        if (this.originalCameraParent) {
            this.originalCameraParent.add(this.camera);
            this.originalCameraParent = null;
        }
        
        // Hide mission UI
        this.hideMissionUI();
        
        // Reset button state
        const apolloButton = document.getElementById('apollo-button');
        if (apolloButton) {
            apolloButton.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
            apolloButton.innerHTML = '🚀 Apollo 11 Mission';
        }
    }
    
    update(deltaTime) {
        if (!this.isActive || !this.rocket) return;
        
        // Update progress
        this.progress += deltaTime;
        
        if (this.progress >= this.totalDuration) {
            this.stop();
            return;
        }
        
        // Determine current phase
        for (let i = 0; i < this.phases.length; i++) {
            if (this.progress >= this.phases[i].start && 
                (i === this.phases.length - 1 || this.progress < this.phases[i + 1].start)) {
                this.phase = i;
                break;
            }
        }
        
        // Update rocket position and camera based on phase
        const phaseProgress = (this.progress - this.phases[this.phase].start) / this.phases[this.phase].duration;
        
        // Slower camera cycling for smoother experience
        this.cameraChangeTime += deltaTime;
        if (this.cameraChangeTime >= this.cameraChangeDuration) {
            this.cameraChangeTime = 0;
            // Only cycle between trajectory and chase views during journey phases
            if (this.phase >= 3 && this.phase <= 6) {
                // During coast/approach, stick to wide trajectory view
                this.cameraMode = 0; // wide_trajectory
            } else {
                this.cameraMode = (this.cameraMode + 1) % 3; // Only first 3 viewpoints
            }
        }
        
        switch (this.phase) {
            case 0: // Launch & Stage 1
                this.updateLaunch(phaseProgress);
                break;
            case 1: // Stage 2 Separation
                this.updateStage2Separation(phaseProgress);
                break;
            case 2: // Earth Orbit & Stage 3
                this.updateEarthOrbit(phaseProgress);
                break;
            case 3: // Trans-Lunar Injection
                this.updateTLI(phaseProgress);
                break;
            case 4: // CSM/LM Extraction
                this.updateExtraction(phaseProgress);
                break;
            case 5: // Coast to Moon
                this.updateCoast(phaseProgress);
                break;
            case 6: // Lunar Orbit Insertion
                this.updateLunarOrbitInsertion(phaseProgress);
                break;
            case 7: // LM Separation
                this.updateLMSeparation(phaseProgress);
                break;
            case 8: // Powered Descent
                this.updateDescent(phaseProgress);
                break;
            case 9: // Landing
                this.updateLanding(phaseProgress);
                break;
        }
        
        // Update engine glow and exhaust
        this.updateEffects(phaseProgress);
        
        // Update mission UI
        this.updateMissionUI();
    }
    
    updateLaunch(progress) {
        const earth = this.solarSystem.planets['earth'];
        if (!earth) return;
        
        const earthRadius = earth.userData.radius || 6.371;
        // Real Apollo 11: Launch to 150km altitude in ~12 minutes at speeds up to 9,920 km/h
        const altitude = 0.01 + progress * 1.5; // Rise from surface to 150km (scaled units)
        
        // Kennedy Space Center position
        const lat = 28.5 * Math.PI / 180;
        const lon = -80.5 * Math.PI / 180;
        
        // Add pitch program (tilt eastward as it rises)
        const pitch = Math.min(progress * 1.3, 1.5); // Pitch over
        
        const r = earthRadius + altitude;
        const x = r * Math.cos(lat) * Math.cos(lon);
        const y = r * Math.sin(lat);
        const z = r * Math.cos(lat) * Math.sin(lon);
        
        // Position relative to Earth's world position (not absolute)
        const localPos = new THREE.Vector3(x, y, z);
        this.rocket.position.copy(earth.position).add(localPos);
        
        // Point rocket in direction of motion with pitch
        const upVector = new THREE.Vector3(x, y, z).normalize();
        const eastVector = new THREE.Vector3(-Math.sin(lon), 0, Math.cos(lon));
        const pitchVector = upVector.clone().multiplyScalar(Math.cos(pitch))
            .add(eastVector.multiplyScalar(Math.sin(pitch)));
        
        this.rocket.lookAt(
            this.rocket.position.x + pitchVector.x,
            this.rocket.position.y + pitchVector.y,
            this.rocket.position.z + pitchVector.z
        );
        
        // Multiple camera angles
        this.applyCameraView(this.rocket.position, earth.position);
    }
    
    updateStage2Separation(progress) {
        const earth = this.solarSystem.planets['earth'];
        if (!earth || !this.rocket) return;
        
        const earthRadius = earth.userData.radius || 6.371;
        const altitude = 1.51 + progress * 0.4; // 150km to 190km
        
        const lat = 28.5 * Math.PI / 180;
        const lon = -80.5 * Math.PI / 180 + progress * 0.3;
        
        const r = earthRadius + altitude;
        const localPos = new THREE.Vector3(
            r * Math.cos(lat) * Math.cos(lon),
            r * Math.sin(lat),
            r * Math.cos(lat) * Math.sin(lon)
        );
        
        // Position relative to Earth's world position
        this.rocket.position.copy(earth.position).add(localPos);
        
        // Orbital velocity direction
        const velocity = new THREE.Vector3(-Math.sin(lon), 0, Math.cos(lon));
        this.rocket.lookAt(
            this.rocket.position.x + velocity.x,
            this.rocket.position.y + velocity.y,
            this.rocket.position.z + velocity.z
        );
        
        // Stage 1 separation (only once)
        if (this.stage1 && progress > 0.2 && this.stage1.parent === this.rocket) {
            this.scene.add(this.stage1);
            const worldPos = new THREE.Vector3();
            this.stage1.getWorldPosition(worldPos);
            this.stage1.position.copy(worldPos);
            const worldQuat = new THREE.Quaternion();
            this.stage1.getWorldQuaternion(worldQuat);
            this.stage1.quaternion.copy(worldQuat);
            this.stage1.userData.separationVelocity = velocity.clone().multiplyScalar(-0.5);
            console.log('🚀 Stage 1 separated');
        }
        
        // Move separated stage
        if (this.stage1?.userData?.separationVelocity) {
            this.stage1.position.add(this.stage1.userData.separationVelocity.clone().multiplyScalar(0.02));
            this.stage1.rotation.x += 0.02;
        }
        
        this.applyCameraView(this.rocket.position, earth.position, true);
    }
    
    updateEarthOrbit(progress) {
        const earth = this.solarSystem.planets['earth'];
        if (!earth || !this.rocket) return;
        
        const earthRadius = earth.userData.radius || 6.371;
        const orbitRadius = earthRadius + 1.91; // 191km altitude parking orbit
        
        // Circular orbit
        const angle = progress * Math.PI * 3; // 1.5 orbits
        this.rocket.position.copy(earth.position).add(new THREE.Vector3(
            orbitRadius * Math.cos(angle),
            orbitRadius * Math.sin(angle) * 0.15, // Inclination
            orbitRadius * Math.sin(angle)
        ));
        
        // Point in direction of motion
        const velocity = new THREE.Vector3(
            -Math.sin(angle),
            Math.cos(angle) * 0.15,
            Math.cos(angle)
        ).normalize();
        
        this.rocket.lookAt(
            this.rocket.position.x + velocity.x,
            this.rocket.position.y + velocity.y,
            this.rocket.position.z + velocity.z
        );
        
        // Stage 2 separation near end (only once)
        if (this.stage2 && progress > 0.7 && this.stage2.parent === this.rocket) {
            this.scene.add(this.stage2);
            const worldPos = new THREE.Vector3();
            this.stage2.getWorldPosition(worldPos);
            this.stage2.position.copy(worldPos);
            const worldQuat = new THREE.Quaternion();
            this.stage2.getWorldQuaternion(worldQuat);
            this.stage2.quaternion.copy(worldQuat);
            this.stage2.userData.separationVelocity = velocity.clone().multiplyScalar(-0.3);
            console.log('🚀 Stage 2 separated');
        }
        
        if (this.stage2?.userData?.separationVelocity) {
            this.stage2.position.add(this.stage2.userData.separationVelocity.clone().multiplyScalar(0.01));
            this.stage2.rotation.y += 0.015;
        }
        
        this.applyCameraView(this.rocket.position, earth.position);
    }
    
    updateTLI(progress) {
        const earth = this.solarSystem.planets['earth'];
        const moon = this.solarSystem.moons['moon'];
        if (!earth || !moon || !this.rocket) return;
        
        const earthRadius = earth.userData.radius || 6.371;
        const startRadius = earthRadius + 1.91;
        
        // Start from orbit position, accelerate away from Earth
        const earthToMoon = moon.position.clone().sub(earth.position);
        const startPos = earth.position.clone().add(
            earthToMoon.clone().normalize().multiplyScalar(startRadius)
        );
        
        const distance = progress * 60; // Initial burn distance
        this.rocket.position.copy(startPos).add(
            earthToMoon.clone().normalize().multiplyScalar(distance)
        );
        
        // Point toward Moon
        const toMoon = moon.position.clone().sub(this.rocket.position).normalize();
        this.rocket.lookAt(
            this.rocket.position.x + toMoon.x,
            this.rocket.position.y + toMoon.y,
            this.rocket.position.z + toMoon.z
        );
        
        this.applyCameraView(this.rocket.position, earth.position, false, moon.position);
    }
    
    updateExtraction(progress) {
        const earth = this.solarSystem.planets['earth'];
        const moon = this.solarSystem.moons['moon'];
        if (!earth || !moon || !this.rocket) return;
        
        // Position continues on trajectory
        const earthToMoon = moon.position.clone().sub(earth.position);
        const travelDist = 60 + progress * 20;
        this.rocket.position.copy(earth.position).add(
            earthToMoon.clone().normalize().multiplyScalar(travelDist)
        );
        
        // Rotate CSM 180 degrees
        if (this.csm) {
            this.csm.rotation.y = progress * Math.PI;
        }
        
        // Extract LM (make visible and move forward)
        if (this.lm && progress > 0.3) {
            this.lm.visible = true;
            const extractDist = (progress - 0.3) * 10;
            this.lm.position.y = 85 * 0.35 + extractDist;
        }
        
        // Separate and discard Stage 3 (only once)
        if (this.stage3 && progress > 0.6 && this.stage3.parent === this.rocket) {
            this.scene.add(this.stage3);
            const worldPos = new THREE.Vector3();
            this.stage3.getWorldPosition(worldPos);
            this.stage3.position.copy(worldPos);
            const worldQuat = new THREE.Quaternion();
            this.stage3.getWorldQuaternion(worldQuat);
            this.stage3.quaternion.copy(worldQuat);
            this.stage3.userData.separationVelocity = earthToMoon.clone().normalize().multiplyScalar(-0.2);
            console.log('🚀 Stage 3 separated');
        }
        
        if (this.stage3?.userData?.separationVelocity) {
            this.stage3.position.add(this.stage3.userData.separationVelocity.clone().multiplyScalar(0.01));
            this.stage3.rotation.x += 0.01;
        }
        
        const toMoon = moon.position.clone().sub(this.rocket.position).normalize();
        this.rocket.lookAt(
            this.rocket.position.x + toMoon.x,
            this.rocket.position.y + toMoon.y,
            this.rocket.position.z + toMoon.z
        );
        
        // Close-up camera for extraction
        const sideOffset = new THREE.Vector3(15, 5, 0);
        this.camera.position.copy(this.rocket.position).add(sideOffset);
        this.camera.lookAt(this.rocket.position);
    }
    
    updateCoast(progress) {
        const earth = this.solarSystem.planets['earth'];
        const moon = this.solarSystem.moons['moon'];
        if (!earth || !moon) return;
        
        // Real Apollo 11: 3 days coast to Moon (384,400 km) at average speed ~5,500 km/h
        // Smooth interpolation from Earth orbit to Moon
        const earthToMoon = moon.position.clone().sub(earth.position);
        const startDist = 80 / earthToMoon.length(); // Normalized start position
        const endDist = 0.85; // Approach Moon
        const travelProgress = startDist + (endDist - startDist) * progress;
        
        this.rocket.position.copy(earth.position).add(
            earthToMoon.clone().multiplyScalar(travelProgress)
        );
        
        // Point toward Moon
        const toMoon = moon.position.clone().sub(this.rocket.position).normalize();
        this.rocket.lookAt(
            this.rocket.position.x + toMoon.x,
            this.rocket.position.y + toMoon.y,
            this.rocket.position.z + toMoon.z
        );
        
        // Wide trajectory view showing Earth to Moon path
        this.applyCameraView(this.rocket.position, earth.position, false, moon.position);
    }
    
    updateLunarOrbitInsertion(progress) {
        const moon = this.solarSystem.moons['moon'];
        if (!moon) return;
        
        const moonRadius = moon.userData.radius || 1.737;
        const approachDist = moonRadius + 5 - progress * 3.9; // Approach from 5 down to 1.1
        
        // Spiral approach
        const angle = progress * Math.PI * 3;
        this.rocket.position.copy(moon.position).add(new THREE.Vector3(
            approachDist * Math.cos(angle),
            approachDist * Math.sin(angle) * 0.3,
            approachDist * Math.sin(angle)
        ));
        
        // Point in direction of motion
        const velocity = new THREE.Vector3(
            -Math.sin(angle),
            Math.cos(angle) * 0.3,
            Math.cos(angle)
        ).normalize();
        
        this.rocket.lookAt(
            this.rocket.position.x + velocity.x,
            this.rocket.position.y + velocity.y,
            this.rocket.position.z + velocity.z
        );
        
        this.applyCameraView(this.rocket.position, moon.position);
    }
    
    updateLMSeparation(progress) {
        const moon = this.solarSystem.moons['moon'];
        if (!moon) return;
        
        const moonRadius = moon.userData.radius || 1.737;
        const orbitRadius = moonRadius + 1.1; // 110km altitude
        
        // Continue in lunar orbit
        const angle = progress * Math.PI * 2;
        this.rocket.position.copy(moon.position).add(new THREE.Vector3(
            orbitRadius * Math.cos(angle),
            orbitRadius * Math.sin(angle) * 0.2,
            orbitRadius * Math.sin(angle)
        ));
        
        // Separate LM from CSM
        if (this.lm && this.csm && progress > 0.4) {
            // Move LM away from CSM
            const separationDist = (progress - 0.4) * 5;
            const separationDir = new THREE.Vector3(
                Math.cos(angle + Math.PI / 2),
                0,
                Math.sin(angle + Math.PI / 2)
            );
            
            // LM moves to descent orbit
            const lmOrbitRadius = orbitRadius - (progress - 0.4) * 0.5;
            this.lm.position.copy(moon.position).add(new THREE.Vector3(
                lmOrbitRadius * Math.cos(angle),
                lmOrbitRadius * Math.sin(angle) * 0.2,
                lmOrbitRadius * Math.sin(angle)
            )).add(separationDir.multiplyScalar(separationDist));
        }
        
        // Point in direction of motion
        const velocity = new THREE.Vector3(
            -Math.sin(angle),
            Math.cos(angle) * 0.2,
            Math.cos(angle)
        ).normalize();
        
        this.rocket.lookAt(
            this.rocket.position.x + velocity.x,
            this.rocket.position.y + velocity.y,
            this.rocket.position.z + velocity.z
        );
        
        if (this.lm) {
            this.lm.lookAt(moon.position);
        }
        
        // Camera shows both spacecraft
        const midPoint = new THREE.Vector3();
        if (this.lm && progress > 0.4) {
            midPoint.copy(this.rocket.position).add(this.lm.position).multiplyScalar(0.5);
        } else {
            midPoint.copy(this.rocket.position);
        }
        
        const camOffset = new THREE.Vector3(0, orbitRadius * 1.5, orbitRadius * 2);
        this.camera.position.copy(midPoint).add(camOffset);
        this.camera.lookAt(midPoint);
    }
    
    updateDescent(progress) {
        const moon = this.solarSystem.moons['moon'];
        if (!moon || !this.lm) return;
        
        const moonRadius = moon.userData.radius || 1.737;
        const startAltitude = 0.15; // 15km powered descent
        const endAltitude = 0.002; // 2km
        
        const altitude = startAltitude - progress * (startAltitude - endAltitude);
        
        // Sea of Tranquility: 0.67°N, 23.47°E
        const lat = 0.67 * Math.PI / 180;
        const lon = 23.47 * Math.PI / 180;
        
        // Arcing descent trajectory
        const arcProgress = Math.sin(progress * Math.PI / 2); // Smooth arc
        const horizontalOffset = (1 - arcProgress) * 0.3;
        
        const r = moonRadius + altitude;
        this.lm.position.copy(moon.position).add(new THREE.Vector3(
            (r + horizontalOffset) * Math.cos(lat) * Math.cos(lon),
            r * Math.sin(lat),
            (r + horizontalOffset) * Math.cos(lat) * Math.sin(lon)
        ));
        
        // Tilt LM for landing
        const tiltAngle = progress * 0.3; // Slight tilt during descent
        this.lm.lookAt(moon.position);
        this.lm.rotation.x += tiltAngle;
        
        // Multiple camera angles during descent
        this.applyCameraViewLanding(this.lm.position, moon.position, altitude);
    }
    
    updateLanding(progress) {
        const moon = this.solarSystem.moons['moon'];
        if (!moon || !this.lm) return;
        
        const moonRadius = moon.userData.radius || 1.737;
        
        // Final touchdown
        const lat = 0.67 * Math.PI / 180;
        const lon = 23.47 * Math.PI / 180;
        
        // Small vertical movement for touchdown with dust kick-up effect
        const finalAltitude = 0.002 * (1 - progress);
        
        const r = moonRadius + finalAltitude;
        this.lm.position.copy(moon.position).add(new THREE.Vector3(
            r * Math.cos(lat) * Math.cos(lon),
            r * Math.sin(lat),
            r * Math.cos(lat) * Math.sin(lon)
        ));
        
        this.lm.lookAt(moon.position);
        
        // Rotate slowly to rest
        this.lm.rotation.z = Math.sin(progress * Math.PI) * 0.05;
        
        // Cinematic landing camera - multiple angles
        if (progress < 0.5) {
            // Side view
            const sideOffset = new THREE.Vector3(3, 1, 0);
            this.camera.position.copy(this.lm.position).add(sideOffset);
            this.camera.lookAt(this.lm.position);
        } else {
            // Ground-level view showing final touchdown
            const groundCam = this.lm.position.clone().add(new THREE.Vector3(2, 0.3, 2));
            this.camera.position.copy(groundCam);
            this.camera.lookAt(this.lm.position);
        }
    }
    
    applyCameraView(rocketPos, planetPos, showSeparation = false, targetPos = null) {
        if (!this.rocket) return;
        
        const earth = this.solarSystem.planets['earth'];
        const moon = this.solarSystem.moons['moon'];
        if (!earth || !moon) return;
        
        const viewpoint = this.cameraViewpoints[this.cameraMode];
        let cameraPos, lookAtTarget;
        
        switch (viewpoint) {
            case 'wide_trajectory':
                // Wide view showing full Earth-Moon trajectory
                if (targetPos) {
                    // Show full Earth to Moon path with rocket visible
                    const earthToMoon = targetPos.clone().sub(planetPos);
                    const distance = earthToMoon.length();
                    
                    // Calculate where rocket is on the journey (0 = Earth, 1 = Moon)
                    const rocketProgress = rocketPos.clone().sub(planetPos).length() / distance;
                    
                    // Dynamic camera position that follows the rocket along the trajectory
                    // Position camera perpendicular to Earth-Moon line, keeping all three objects in view
                    const up = new THREE.Vector3(0, 1, 0);
                    const earthToMoonDir = earthToMoon.clone().normalize();
                    const sideDir = new THREE.Vector3().crossVectors(earthToMoonDir, up).normalize();
                    
                    // Focus point moves with rocket but biased toward center of journey
                    const focusPoint = planetPos.clone().add(earthToMoon.clone().multiplyScalar(
                        Math.min(0.5, rocketProgress * 0.6 + 0.2) // Smooth transition from Earth to mid-point
                    ));
                    
                    // Camera distance scales with journey progress
                    const camDistance = distance * (0.35 + rocketProgress * 0.15);
                    
                    cameraPos = focusPoint.clone()
                        .add(sideDir.multiplyScalar(camDistance * 0.8))
                        .add(up.multiplyScalar(camDistance * 0.5));
                    
                    // Look at focus point (weighted average of rocket and journey center)
                    lookAtTarget = focusPoint;
                } else {
                    // Earth vicinity - keep Earth and rocket in view during launch/orbit
                    const dist = Math.max(rocketPos.distanceTo(planetPos), 50);
                    const earthToRocket = rocketPos.clone().sub(planetPos).normalize();
                    const up = new THREE.Vector3(0, 1, 0);
                    const sideDir = new THREE.Vector3().crossVectors(earthToRocket, up).normalize();
                    
                    // Position camera to show both Earth and rocket during early phases
                    cameraPos = planetPos.clone()
                        .add(earthToRocket.multiplyScalar(dist * 0.4))
                        .add(sideDir.multiplyScalar(dist * 1.2))
                        .add(up.multiplyScalar(dist * 0.7));
                    
                    // Look at point between Earth and rocket
                    lookAtTarget = planetPos.clone().add(earthToRocket.multiplyScalar(dist * 0.5));
                }
                break;
                
            case 'close_chase':
                // Close chase camera following rocket (adjusted for larger scale)
                const chaseOffset = new THREE.Vector3(0, 20, -80); // Scaled up for larger rocket
                chaseOffset.applyQuaternion(this.rocket.quaternion);
                cameraPos = rocketPos.clone().add(chaseOffset);
                
                // Look slightly ahead of rocket to show direction
                const forwardOffset = new THREE.Vector3(0, 0, 40); // Scaled up
                forwardOffset.applyQuaternion(this.rocket.quaternion);
                lookAtTarget = rocketPos.clone().add(forwardOffset);
                break;
                
            case 'side_view':
                // Side view showing rocket with Earth or Moon context (scaled for larger rocket)
                const contextPoint = targetPos || planetPos;
                const toContext = contextPoint.clone().sub(rocketPos).normalize();
                const up2 = new THREE.Vector3(0, 1, 0);
                const sideDir2 = new THREE.Vector3().crossVectors(toContext, up2).normalize();
                
                // Farther back to show context
                cameraPos = rocketPos.clone()
                    .add(sideDir2.multiplyScalar(100)) // Increased from 25
                    .add(up2.multiplyScalar(50)); // Increased from 10
                lookAtTarget = rocketPos;
                break;
                
            default:
                return;
        }
        
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(lookAtTarget);
    }
    
    applyCameraViewLanding(lmPos, moonPos, altitude) {
        const moon = this.solarSystem.moons['moon'];
        if (!moon) return;
        
        // Simple, focused landing camera
        // Position to see both Moon surface and LM descending
        const moonRadius = moon.userData.radius || 1.737;
        const distFromMoon = Math.max(altitude * 2, moonRadius * 1.5);
        
        // Camera positioned to side and slightly above
        const lmToMoon = moonPos.clone().sub(lmPos).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const sideDir = new THREE.Vector3().crossVectors(lmToMoon, up).normalize();
        
        const cameraPos = lmPos.clone()
            .add(sideDir.multiplyScalar(distFromMoon * 0.8))
            .add(up.multiplyScalar(distFromMoon * 0.4));
        
        this.camera.position.copy(cameraPos);
        
        // Look at a point between LM and Moon surface
        const lookAtPoint = lmPos.clone().add(lmToMoon.multiplyScalar(altitude * 0.3));
        this.camera.lookAt(lookAtPoint);
    }
    
    // Helper: Get optimal camera position avoiding Sun
    getCameraPositionAvoidingSun(focusPoint, referencePoint, distance) {
        const sun = this.solarSystem.sun;
        const sunPos = sun ? sun.position : new THREE.Vector3(0, 0, 0);
        
        // Calculate perpendicular to Sun-focus line
        const sunToFocus = focusPoint.clone().sub(sunPos).normalize();
        const perpendicular = new THREE.Vector3().crossVectors(
            sunToFocus,
            new THREE.Vector3(0, 1, 0)
        ).normalize();
        
        // Position camera perpendicular to Sun, elevated above
        return focusPoint.clone()
            .add(perpendicular.multiplyScalar(distance * 0.8))
            .add(new THREE.Vector3(0, distance * 0.5, 0));
    }
    
    updateEffects(phaseProgress) {
        // Determine which engines are firing
        let activeGlow = null;
        let glowIntensity = 0;
        
        switch (this.phase) {
            case 0: // Launch - Stage 1
                activeGlow = this.stage1?.getObjectByName('stage1Glow');
                glowIntensity = 0.9;
                break;
            case 1: // Stage 2 firing
                activeGlow = this.stage2?.getObjectByName('stage2Glow');
                glowIntensity = 0.8;
                break;
            case 2: // Earth orbit - Stage 3 occasional firing
                activeGlow = this.stage3?.getObjectByName('stage3Glow');
                glowIntensity = phaseProgress > 0.7 ? 0 : 0.3;
                break;
            case 3: // TLI - Stage 3 burn
                activeGlow = this.stage3?.getObjectByName('stage3Glow');
                glowIntensity = 0.85;
                break;
            case 6: // Lunar orbit insertion - CSM engine
                glowIntensity = 0.6;
                break;
            case 8: // LM descent
                activeGlow = this.lm?.getObjectByName('lmGlow');
                glowIntensity = 0.7;
                break;
            case 9: // Landing - reduced thrust
                activeGlow = this.lm?.getObjectByName('lmGlow');
                glowIntensity = 0.4 * (1 - phaseProgress); // Reduce as landing
                break;
        }
        
        // Update all glows
        [this.stage1, this.stage2, this.stage3, this.lm].forEach(stage => {
            if (stage) {
                ['stage1Glow', 'stage2Glow', 'stage3Glow', 'lmGlow'].forEach(glowName => {
                    const glow = stage.getObjectByName(glowName);
                    if (glow) {
                        if (glow === activeGlow) {
                            glow.material.opacity = glowIntensity;
                        } else {
                            glow.material.opacity = 0;
                        }
                    }
                });
            }
        });
        
        // Update exhaust particles
        const exhaust = this.rocket.getObjectByName('exhaust');
        if (exhaust && glowIntensity > 0) {
            exhaust.children.forEach((particle, i) => {
                const t = (this.progress * 15 + particle.userData.offset) % (Math.PI * 2);
                const speed = particle.userData.speed;
                particle.position.y = -15 - Math.sin(t) * 8 * speed;
                particle.position.x = Math.cos(t + i * 0.2) * 3 * speed;
                particle.position.z = Math.sin(t + i * 0.2) * 3 * speed;
                particle.material.opacity = Math.max(0, glowIntensity * 0.7 - Math.abs(Math.sin(t)) * 0.4);
                
                // Color variation - white hot to orange
                const heatColor = i < 50 ? 0xff6600 : 0xffaa00;
                particle.material.color.setHex(heatColor);
            });
        } else if (exhaust) {
            exhaust.children.forEach(particle => {
                particle.material.opacity = 0;
            });
        }
    }
    
    showMissionUI() {
        let ui = document.getElementById('apollo-mission-ui');
        if (!ui) {
            ui = document.createElement('div');
            ui.id = 'apollo-mission-ui';
            ui.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 15px 25px; border-radius: 10px; border: 2px solid #4a90e2; z-index: 1000; font-family: monospace;';
            ui.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">🚀 APOLLO 11 MISSION</div>
                    <div id="apollo-phase" style="font-size: 14px; margin-bottom: 5px;">Phase: Launch</div>
                    <div id="apollo-time" style="font-size: 12px; color: #4a90e2;">00:00:00</div>
                    <button id="apollo-stop" style="margin-top: 10px; padding: 5px 15px; background: #d32f2f; color: white; border: none; border-radius: 5px; cursor: pointer;">Stop Mission</button>
                </div>
            `;
            document.body.appendChild(ui);
            
            document.getElementById('apollo-stop').onclick = () => this.stop();
        }
        ui.style.display = 'block';
    }
    
    hideMissionUI() {
        const ui = document.getElementById('apollo-mission-ui');
        if (ui) {
            ui.style.display = 'none';
        }
    }
    
    updateMissionUI() {
        const phaseEl = document.getElementById('apollo-phase');
        const timeEl = document.getElementById('apollo-time');
        
        if (phaseEl) {
            const cameraViewName = this.cameraViewpoints[this.cameraMode] || 'trajectory';
            phaseEl.textContent = `Phase: ${this.phases[this.phase].name} | View: ${cameraViewName.replace('_', ' ')}`;
        }
        
        if (timeEl) {
            const minutes = Math.floor(this.progress / 60);
            const seconds = Math.floor(this.progress % 60);
            const ms = Math.floor((this.progress % 1) * 100);
            timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
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
        
        // Orbits visibility: true = visible by default
        this.orbitsVisible = true;
        
        // Geometry cache for reuse
        this.geometryCache = new Map();
        
        // Real astronomical data for day/night cycles
        this.ASTRONOMICAL_DATA = {
            mercury: {
                rotationPeriod: 1407.6,      // hours (58.6 Earth days)
                axialTilt: 0.034,            // degrees
                retrograde: false,
                orbitalPeriod: 88            // Earth days
            },
            venus: {
                rotationPeriod: 5832.5,      // hours (243 Earth days)
                axialTilt: 177.4,            // degrees (almost upside down)
                retrograde: true,            // rotates backwards!
                orbitalPeriod: 225           // Earth days
            },
            earth: {
                rotationPeriod: 23.93,       // hours
                axialTilt: 23.44,            // degrees
                retrograde: false,
                orbitalPeriod: 365.25        // Earth days (baseline)
            },
            mars: {
                rotationPeriod: 24.62,       // hours
                axialTilt: 25.19,            // degrees
                retrograde: false,
                orbitalPeriod: 687           // Earth days
            },
            jupiter: {
                rotationPeriod: 9.93,        // hours (fastest rotation!)
                axialTilt: 3.13,             // degrees
                retrograde: false,
                orbitalPeriod: 4333          // Earth days (~11.9 years)
            },
            saturn: {
                rotationPeriod: 10.66,       // hours
                axialTilt: 26.73,            // degrees
                retrograde: false,
                orbitalPeriod: 10759         // Earth days (~29.5 years)
            },
            uranus: {
                rotationPeriod: 17.24,       // hours
                axialTilt: 97.77,            // degrees (rotates on its side!)
                retrograde: true,
                orbitalPeriod: 30687         // Earth days (~84 years)
            },
            neptune: {
                rotationPeriod: 16.11,       // hours
                axialTilt: 28.32,            // degrees
                retrograde: false,
                orbitalPeriod: 60190         // Earth days (~165 years)
            },
            moon: {
                rotationPeriod: 655.7,       // hours (27.3 Earth days - tidally locked)
                axialTilt: 6.68,             // degrees
                retrograde: false,
                orbitalPeriod: 27.3          // Earth days
            }
        };
        
        // Time acceleration factor (1 = real-time, higher = faster)
        this.timeAcceleration = 360;  // 360x faster = 1 Earth day in 4 minutes
        this.realTimeStart = Date.now();
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
        const initStartTime = performance.now();
        
        // PHASE 1: Critical content - Sun and all planets (needed for navigation/animation)
        if (this.uiManager) this.uiManager.showLoading('Creating the Sun...');
        await this.createSun(scene);
        
        if (this.uiManager) this.uiManager.showLoading('Building inner planets...');
        await this.createInnerPlanets(scene);
        
        // CRITICAL: Create outer planets synchronously so they're clickable/navigable
        if (this.uiManager) this.uiManager.showLoading('Building outer planets...');
        await this.createOuterPlanets(scene);
        
        // PHASE 2: Decorative content (can load in background after planets are ready)
        // Use non-blocking setTimeout to allow rendering to start with all planets loaded
        setTimeout(async () => {
            await this.createAsteroidBelt(scene);
            await this.createKuiperBelt(scene);
            
            // PHASE 3: Background decorations
            this.createStarfield(scene);
            this.createOrbitalPaths(scene);
            this.createDistantStars(scene);
            this.createNebulae(scene);
            this.createConstellations(scene);
            this.createGalaxies(scene);
            
            // PHASE 4: Dynamic objects
            this.createComets(scene);
            this.createSatellites(scene);
            this.createSpacecraft(scene);
            this.createLabels();
            
            // Refresh navigation menu now that all objects are created (after async nebulae/galaxies load)
            if (this.uiManager && typeof this.refreshExplorerContent === 'function') {
                this.refreshExplorerContent();
            }
            
            const totalTime = performance.now() - initStartTime;
            if (DEBUG.PERFORMANCE) {
                console.log(`⚡ Full initialization completed in ${totalTime.toFixed(0)}ms`);
                console.log(`📦 Total objects: Planets=${Object.keys(this.planets).length}, Satellites=${this.satellites.length}, Spacecraft=${this.spacecraft.length}, Stars=${this.distantStars.length}, Nebulae=${this.nebulae.length}, Galaxies=${this.galaxies.length}`);
            }
        }, 10);
        
        // All planets are now loaded - safe to start animation
        return true;
    }

    createSun(scene) {
        // HYPERREALISTIC Sun with realistic size
        // Sun: 1,391,000 km / 12,742 km = 109.2 (should be MASSIVE)
        // But we'll scale it down to 15 for visibility while still being impressive
        const sunRadius = 15; // Compromise between realism and usability
        const sunGeometry = new THREE.SphereGeometry(sunRadius, 128, 128); // Higher detail
        
        // Load real NASA Sun texture (with procedural fallback)
        const sunTexture = this.createSunTextureReal(2048);
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
        
        // Sun lighting - PointLight from center with NO DECAY for realistic solar system lighting
        // In space, light doesn't decay with distance (inverse square law applies but over HUGE distances)
        // BALANCED: Reduced intensity to prevent washing out textures on sunny side
        const sunLight = new THREE.PointLight(0xFFFAE8, 9, 0, 0); // Warm white, reduced intensity (10→9)
        sunLight.name = 'sunLight';
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = CONFIG.QUALITY.shadows;
        sunLight.shadow.mapSize.width = 4096; // Higher resolution shadows
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 5000; // Increased for distant planets
        sunLight.shadow.bias = -0.0005; // Reduce shadow artifacts
        sunLight.shadow.radius = 2; // Softer shadows
        scene.add(sunLight);
        this.sun.userData.sunLight = sunLight;
        
        // Ambient light - significantly increased to see dark sides clearly
        const ambientLight = new THREE.AmbientLight(0x444466, 2.0); // Bright ambient for dark side visibility
        ambientLight.name = 'ambientLight';
        scene.add(ambientLight);
        
        if (DEBUG.enabled) {
            console.log('💡 Lighting: Sun intensity 9 (warm white), Ambient 2.0, Tone mapping 1.2');
            console.log('   - Enhanced dark side visibility with increased ambient light');
            console.log('   - Higher exposure prevents dark tone crushing');
            console.log('   - Ambient light makes dark sides clearly visible');
            console.log('   - Sun light reaches all planets without decay');
            console.log('   - Eclipses will cast 4K shadows');
        }
        
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
                blending: THREE.AdditiveBlending,
                depthWrite: false, // Don't block objects behind the glow
                depthTest: true    // But still respect depth for proper rendering
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
            description: '🔥 Mercury is the smallest planet and closest to the Sun. Its surface is covered with craters like our Moon. Temperature ranges from -180°C at night to 430°C during the day - the largest temperature swing in the solar system!',
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
            description: '🌋 Venus is the hottest planet with surface temperature of 465°C due to extreme greenhouse effect. Its atmosphere is 96% CO2 with clouds of sulfuric acid. Venus rotates backwards compared to most planets!',
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
            description: '🌕 Earth\'s Moon is the fifth largest moon in the solar system. It creates tides, stabilizes Earth\'s tilt, and was formed 4.5 billion years ago when a Mars-sized object hit Earth!',
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
            description: '🔴 Mars, the Red Planet, gets its color from iron oxide (rust). It has the largest volcano (Olympus Mons - 22 km high) and canyon (Valles Marineris - 4,000 km long) in the solar system. Water ice exists at its poles!',
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
            description: '🪐 Jupiter is the largest planet - all other planets could fit inside it! The Great Red Spot is a storm larger than Earth that has raged for at least 400 years. Jupiter has 95 known moons!',
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
            description: '🌙 Ganymede is the largest moon in the solar system, bigger than Mercury!'
        });
        // Callisto: 4,821 km / 12,742 km = 0.378
        this.createMoon(this.planets.jupiter, {
            name: 'Callisto',
            radius: 0.378,
            color: 0x777777,
            distance: 14,
            speed: 0.025,
            description: '🌙 Callisto is the most heavily cratered object in the solar system!'
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
            description: '💍 Saturn is famous for its spectacular ring system made of ice and rock particles. It\'s the least dense planet - it would float in water! Saturn has 146 known moons including Titan, which has a thick atmosphere.',
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
            description: '🌊 Titan has lakes and rivers of liquid methane - the only place besides Earth with liquid on its surface!'
        });
        // Enceladus: 504 km / 12,742 km = 0.040
        this.createMoon(this.planets.saturn, {
            name: 'Enceladus',
            radius: 0.040,
            color: 0xFFFFFF,
            distance: 7,
            speed: 0.05,
            description: '💦 Enceladus shoots water geysers into space from its subsurface ocean!'
        });
        // Rhea: 1,527 km / 12,742 km = 0.120
        this.createMoon(this.planets.saturn, {
            name: 'Rhea',
            radius: 0.120,
            color: 0xCCCCCC,
            distance: 12,
            speed: 0.025,
            description: '💫 Rhea may have its own ring system!'
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
            description: '🔵 Uranus is unique - it rotates on its side! This means its poles take turns facing the Sun during its 84-year orbit. Made of water, methane, and ammonia ices, it appears blue-green due to methane in its atmosphere.',
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
            description: '🏔️ Titania is Uranus\' largest moon with massive canyons!'
        });
        // Miranda: 472 km / 12,742 km = 0.037
        this.createMoon(this.planets.uranus, {
            name: 'Miranda',
            radius: 0.037,
            color: 0x999999,
            distance: 3.5,
            speed: 0.06,
            description: '🏔️ Miranda has the most dramatic terrain in the solar system with cliffs 20 km high!'
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
            description: '🌀 Neptune is the windiest planet with storms reaching 2,100 km/h! Its beautiful blue color comes from methane. Neptune has a large dark spot (storm) similar to Jupiter\'s Great Red Spot.',
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
            description: '? Pluto is a dwarf planet in the Kuiper Belt. It has a heart-shaped glacier (Tombaugh Regio), mountains of water ice, and five moons. Pluto and its largest moon Charon are tidally locked - they always show the same face to each other!',
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
            description: '🌙 Charon is so large relative to Pluto that they form a binary system!'
        });
    }

    createProceduralTexture(type, size = 512) {
        // Create canvas for procedural texture
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
    
    // ⚠️ REMOVED: createEarthNightLights() - was 105 lines of unused city lights code
    
    createEarthTextureReal(size) {
        // 🌃 Generate procedural city lights for Earth's night side
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Start with black (space/ocean)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, size, size);
        
        // Major populated regions (approximate coordinates on texture)
        const cityRegions = [
            // North America
            { x: 0.15, y: 0.35, w: 0.20, h: 0.15, density: 0.8, color: '#ffcc66' },
            // Europe
            { x: 0.52, y: 0.30, w: 0.12, h: 0.10, density: 0.9, color: '#ffdd77' },
            // East Asia (China, Japan, Korea)
            { x: 0.75, y: 0.35, w: 0.15, h: 0.12, density: 1.0, color: '#ffee88' },
            // India
            { x: 0.68, y: 0.42, w: 0.08, h: 0.08, density: 0.85, color: '#ffdd77' },
            // South America (Brazil)
            { x: 0.28, y: 0.62, w: 0.08, h: 0.12, density: 0.6, color: '#ffcc66' },
            // Australia (East Coast)
            { x: 0.82, y: 0.68, w: 0.08, h: 0.08, density: 0.5, color: '#ffcc66' },
            // Middle East
            { x: 0.58, y: 0.42, w: 0.08, h: 0.06, density: 0.5, color: '#ffcc66' },
            // Southeast Asia
            { x: 0.73, y: 0.50, w: 0.08, h: 0.08, density: 0.7, color: '#ffdd77' },
            // Africa (North)
            { x: 0.52, y: 0.50, w: 0.10, h: 0.08, density: 0.3, color: '#ffbb55' },
            // Southern Africa
            { x: 0.54, y: 0.68, w: 0.06, h: 0.06, density: 0.4, color: '#ffcc66' }
        ];
        
        // Draw city lights for each region
        cityRegions.forEach(region => {
            const centerX = region.x * size;
            const centerY = region.y * size;
            const width = region.w * size;
            const height = region.h * size;
            
            // Number of light clusters based on density
            const numClusters = Math.floor(width * height * region.density * 0.01);
            
            for (let i = 0; i < numClusters; i++) {
                // Random position within region
                const x = centerX + (Math.random() - 0.5) * width;
                const y = centerY + (Math.random() - 0.5) * height;
                
                // City cluster size
                const clusterSize = 2 + Math.random() * 6;
                const intensity = 0.5 + Math.random() * 0.5;
                
                // Create glow effect
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, clusterSize);
                gradient.addColorStop(0, region.color);
                gradient.addColorStop(0.5, `rgba(255, 204, 102, ${intensity * 0.5})`);
                gradient.addColorStop(1, 'rgba(255, 204, 102, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, clusterSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Add some individual bright spots (major cities)
                if (Math.random() < 0.1) {
                    ctx.fillStyle = '#ffffdd';
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
    }
    
    // ⚠️ REMOVED: createEarthNightLights() - was 105 lines of unused city lights code
    
    createEarthTextureReal(size) {
        // Create procedural texture as fallback first
        const proceduralTexture = this.createEarthTexture(size);
        
        // Try to load real NASA Earth texture and swap it in when ready
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        
        // Try multiple Earth texture sources (CORS-friendly, in order of quality)
        const textureURLs = [
            // GitHub CDN - Blue Marble 4K (WORKS! No CORS issues)
            'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
            // Alternative: 8K version (higher quality but larger)
            'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_8k.jpg',
            // Fallback: Another GitHub source
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
        ];
        
        let currentURLIndex = 0;
        
        const tryLoadTexture = () => {
            if (currentURLIndex >= textureURLs.length) {
                if (DEBUG.TEXTURES) console.warn('🌍 All NASA Earth texture sources failed, using procedural');
                return;
            }
            
            const url = textureURLs[currentURLIndex];
            if (DEBUG.TEXTURES) console.log(`🌍 Loading Earth texture from source ${currentURLIndex + 1}/${textureURLs.length}`);
            
            loader.load(
                url,
                (tex) => {
                    if (DEBUG.TEXTURES) console.log('✅ Real Earth texture loaded successfully!');
                    
                    // Apply proper texture settings for best quality
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = 16; // Maximum quality filtering
                    tex.needsUpdate = true;
                    
                    // Update the material's map to use the real texture
                    if (this.planets && this.planets.earth) {
                        this.planets.earth.material.map = tex;
                        this.planets.earth.material.needsUpdate = true;
                        if (DEBUG.TEXTURES) console.log('🌍 Earth material updated with real NASA texture');
                    }
                },
                (progress) => {
                    if (DEBUG.TEXTURES && progress.lengthComputable) {
                        const percent = (progress.loaded / progress.total * 100).toFixed(0);
                        console.log(`📥 Loading NASA Earth texture: ${percent}%`);
                    }
                },
                (err) => {
                    if (DEBUG.TEXTURES) console.warn(`⚠️ Source ${currentURLIndex + 1} failed, trying next...`);
                    currentURLIndex++;
                    tryLoadTexture(); // Try next URL
                }
            );
        };
        
        tryLoadTexture();
        
        // Return procedural texture immediately (real texture will swap in when loaded)
        return proceduralTexture;
    }
    
    // Generic planet texture loader with fallback
    loadPlanetTextureReal(planetName, textureURLs, proceduralFunction, size = 2048) {
        // Create procedural texture as fallback first
        const proceduralTexture = proceduralFunction.call(this, size);
        
        // Try to load real NASA texture and swap it in when ready
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        
        let currentURLIndex = 0;
        
        const tryLoadTexture = () => {
            if (currentURLIndex >= textureURLs.length) {
                console.warn(`?? All ${planetName} texture sources failed`);
                console.warn(`   Using beautiful procedural ${planetName} instead`);
                return;
            }
            
            const url = textureURLs[currentURLIndex];
            console.log(`?? Loading ${planetName} texture from source ${currentURLIndex + 1}/${textureURLs.length}...`);
            
            loader.load(
                url,
                (tex) => {
                    console.log(`? Real ${planetName} texture loaded successfully!`);
                    
                    // Apply proper texture settings
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = 16;
                    tex.needsUpdate = true;
                    
                    // Update the material's map to use the real texture
                    const planet = this.planets[planetName.toLowerCase()];
                    if (planet && planet.material) {
                        planet.material.map = tex;
                        planet.material.needsUpdate = true;
                        console.log(`?? ${planetName} material updated with real NASA texture!`);
                    }
                },
                undefined,
                (err) => {
                    console.warn(`?? ${planetName} source ${currentURLIndex + 1} failed, trying next...`);
                    currentURLIndex++;
                    tryLoadTexture();
                }
            );
        };
        
        tryLoadTexture();
        return proceduralTexture;
    }
    
    // Sun real texture loader
    createSunTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/sunmap.jpg'
        ];
        return this.loadPlanetTextureReal('Sun', textureURLs, this.createSunTexture, size);
    }
    
    // Mercury real texture loader
    createMercuryTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg'
        ];
        return this.loadPlanetTextureReal('Mercury', textureURLs, this.createMercuryTexture, size);
    }
    
    // Venus real texture loader
    createVenusTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg'
        ];
        return this.loadPlanetTextureReal('Venus', textureURLs, this.createVenusTexture, size);
    }
    
    // Mars real texture loader
    createMarsTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg'
        ];
        return this.loadPlanetTextureReal('Mars', textureURLs, this.createMarsTexture, size);
    }
    
    // Jupiter real texture loader
    createJupiterTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg'
        ];
        return this.loadPlanetTextureReal('Jupiter', textureURLs, this.createJupiterTexture, size);
    }
    
    // Saturn real texture loader
    createSaturnTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg'
        ];
        return this.loadPlanetTextureReal('Saturn', textureURLs, this.createSaturnTexture, size);
    }
    
    // Uranus real texture loader
    createUranusTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg'
        ];
        return this.loadPlanetTextureReal('Uranus', textureURLs, this.createUranusTexture, size);
    }
    
    // Neptune real texture loader
    createNeptuneTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg'
        ];
        return this.loadPlanetTextureReal('Neptune', textureURLs, this.createNeptuneTexture, size);
    }
    
    // Moon real texture loader
    createMoonTextureReal(size) {
        const textureURLs = [
            'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg',
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg'
        ];
        return this.loadPlanetTextureReal('Moon', textureURLs, this.createMoonTexture, size);
    }
    
    async createEarthTexture(size) {
        const cacheKey = `earth_texture_${size}`;
        
        // Try to load from cache
        const cachedDataURL = await TEXTURE_CACHE.get(cacheKey);
        if (cachedDataURL) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.needsUpdate = true;
                    resolve(texture);
                };
                img.src = cachedDataURL;
            });
        }
        
        // Generate texture if not cached
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
                const nx = x / size;
                const ny = y / size;
                
                // REALISTIC EARTH-LIKE CONTINENTS
                // Approximate major landmasses using mathematical patterns
                
                // Convert to normalized coordinates (0-1)
                const lonNorm = lon / (Math.PI * 2);  // 0 to 1
                const latNorm01 = (lat + Math.PI / 2) / Math.PI;  // 0 to 1
                
                // Americas (Western Hemisphere, lon ~0.75-0.95)
                const americas = Math.exp(-Math.pow((lonNorm - 0.85) * 6, 2)) * 
                                (1 - Math.abs(latNorm01 - 0.5) * 1.5);
                
                // Eurasia-Africa (Eastern Hemisphere, lon ~0-0.4)
                const eurasia = Math.exp(-Math.pow(lonNorm * 4, 2)) * 
                               (1 - Math.abs(latNorm01 - 0.55) * 1.2) * 1.2;
                const africa = Math.exp(-Math.pow((lonNorm - 0.15) * 8, 2)) * 
                              Math.exp(-Math.pow((latNorm01 - 0.35) * 4, 2)) * 1.5;
                
                // Australia (lon ~0.55-0.65, lat ~0.2-0.3)
                const australia = Math.exp(-Math.pow((lonNorm - 0.6) * 12, 2)) * 
                                 Math.exp(-Math.pow((latNorm01 - 0.25) * 8, 2)) * 0.8;
                
                // Antarctica (bottom, all longitudes)
                const antarctica = Math.exp(-Math.pow((latNorm01 - 0.05) * 8, 2)) * 0.9;
                
                // Greenland (lon ~0.95-1.0, lat ~0.75-0.85)
                const greenland = Math.exp(-Math.pow((lonNorm - 0.97) * 20, 2)) * 
                                 Math.exp(-Math.pow((latNorm01 - 0.8) * 10, 2)) * 0.7;
                
                // Combine all continents
                const continents = Math.max(americas, eurasia, africa, australia, antarctica, greenland);
                
                // Add mountain ranges and terrain detail
                const mountains = Math.sin(lon * 15 + lat * 8) * 0.15 * continents;
                const terrain = noise(nx * 10, ny * 10, 0) * 0.2 * continents;
                const details = noise(nx * 30, ny * 30, 1) * 0.1;
                
                // Final elevation: continents provide base, details add variation
                // Range: approximately -0.2 to +1.5
                const elevation = continents * 0.8 + mountains + terrain + details - 0.2;
                
                // DEBUG: Log elevation range and raw values
                if (x === 512 && y % 200 === 0) {
                    console.log(`?? Elevation: ${elevation.toFixed(4)} (continents:${continents.toFixed(3)}, details:${details.toFixed(3)}) at lat ${(lat * 180/Math.PI).toFixed(1)}� lon ${(lon * 180/Math.PI).toFixed(1)}�`);
                }
                
                // EXTRA DEBUG: Track min/max elevation
                if (!window._earthElevationStats) {
                    window._earthElevationStats = { min: Infinity, max: -Infinity, samples: 0 };
                }
                window._earthElevationStats.min = Math.min(window._earthElevationStats.min, elevation);
                window._earthElevationStats.max = Math.max(window._earthElevationStats.max, elevation);
                window._earthElevationStats.samples++;
                
                // Polar ice caps - Arctic and Antarctic
                if (latNorm > 0.92 || latNorm01 < 0.08) {
                    const iceVariation = noise(nx * 30, ny * 30, 1) * 20;
                    data[idx] = 240 + iceVariation;
                    data[idx + 1] = 250 + iceVariation;
                    data[idx + 2] = 255;
                }
                // Land areas - elevation ranges from -0.2 to +1.5
                // Use threshold of 0.15 for realistic ~30% land coverage
                else if (elevation > 0.15) {
                    const landHeight = (elevation - 0.15) * 2;
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
                // Shallow water - BRIGHT for visibility (between 0.05 and 0.15)
                else if (elevation > 0.05) {
                    const shallow = (elevation - 0.05) * 30;
                    data[idx] = 100 + shallow * 3; // Bright aqua
                    data[idx + 1] = 200 - shallow;
                    data[idx + 2] = 240 - shallow * 2;
                }
                // Deep ocean - BRIGHTER blues for visibility (below 0.05)
                else {
                    const depth = Math.max(0, 0.05 - elevation) * 2;
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
        if (DEBUG.TEXTURES) {
            console.log(`🌍 Earth texture: ${(landPixels/totalPixels*100).toFixed(1)}% land, ${(oceanPixels/totalPixels*100).toFixed(1)}% ocean, ${(icePixels/totalPixels*100).toFixed(1)}% ice`);
        }
        
        // Cache the texture for future use
        const dataURL = canvas.toDataURL('image/png');
        TEXTURE_CACHE.set(cacheKey, dataURL).catch(err => 
            console.warn('Failed to cache texture:', err)
        );
        
        // Create texture BEFORE adding clouds
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // DEBUG: Log elevation statistics (only if debug enabled)
        if (DEBUG.TEXTURES && window._earthElevationStats) {
            const stats = window._earthElevationStats;
            console.log(`🌍 Elevation: min=${stats.min.toFixed(4)}, max=${stats.max.toFixed(4)}`);
            console.log(`🌍 Continents: Americas, Eurasia, Africa, Australia, Antarctica`);
        }
        
        // ULTIMATE TEST: Create a downloadable preview
        if (DEBUG.TEXTURES) {
            try {
                console.log('??? TEXTURE PREVIEW: Right-click and "Open in new tab" to see the actual texture:');
                console.log(dataURL.substring(0, 100) + '...');
                console.log('   Copy this and paste in browser to view Earth texture:');
                console.log('   %c[VIEW EARTH TEXTURE]', 'color: #00ff00; font-size: 16px; font-weight: bold; background: #000; padding: 5px;');
                console.log('   Length:', dataURL.length, 'bytes');
                // Store for inspection
                window._earthTextureDataURL = dataURL;
                console.log('   Stored in: window._earthTextureDataURL');
            } catch (e) {
                console.error('? Failed to create texture preview:', e);
            }
        }
        
        return texture;
    }
    
    createEarthBumpMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        console.log(`?? Creating material for planet: "${name}" (original: "${config.name}")`);
        
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
                // Earth: ULTRA HYPER-REALISTIC with real NASA textures + procedural fallback
                const earthTexture = this.createEarthTextureReal(4096);  // 4K resolution!
                const earthBump = this.createEarthBumpMap(4096);
                const earthSpecular = this.createEarthSpecularMap(4096);
                const earthNormal = this.createEarthNormalMap(4096);
                
                // ULTRA realistic material with PBR (Physically Based Rendering)
                // NO emissive - planets don't emit light, they only reflect it
                const earthMaterial = new THREE.MeshStandardMaterial({
                    map: earthTexture,
                    
                    // Normal map for surface detail (mountains, valleys)
                    normalMap: earthNormal,
                    normalScale: new THREE.Vector2(1.2, 1.2),
                    
                    // Bump map for elevation
                    bumpMap: earthBump,
                    bumpScale: 0.08,
                    
                    // Roughness map (water = smooth/shiny, land = rough)
                    roughnessMap: earthSpecular,
                    roughness: 0.4, // Increased for better light response
                    
                    // Metalness (oceans have slight reflection)
                    metalness: 0.1, // Reduced - Earth is not metallic
                    
                    // NO emissive - let the sun's light create day/night naturally
                    emissive: 0x000000,
                    emissiveIntensity: 0,
                    
                    // Advanced rendering
                    envMapIntensity: 1.2,
                    transparent: false,
                    side: THREE.FrontSide,
                    flatShading: false,
                    toneMapped: true
                });
                
                return earthMaterial;
                
            case 'mars':
                // Mars: REAL NASA texture with rusty red surface with canyons, polar caps
                const marsTexture = this.createMarsTextureReal(2048);
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
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            case 'venus':
                // Venus: REAL NASA texture with thick yellowish sulfuric acid clouds
                const venusTexture = this.createVenusTextureReal(2048);
                return new THREE.MeshStandardMaterial({
                    map: venusTexture,
                    color: 0xe8c468,
                    roughness: 0.3,
                    metalness: 0.05,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            case 'mercury':
                // Mercury: REAL NASA texture heavily cratered surface
                const mercuryTexture = this.createMercuryTextureReal(2048);
                const mercuryBump = this.createMercuryBumpMap(2048);
                
                return new THREE.MeshStandardMaterial({
                    map: mercuryTexture,
                    bumpMap: mercuryBump,
                    bumpScale: 0.1,
                    roughness: 0.95,
                    metalness: 0.02,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            case 'jupiter':
                // Jupiter: REAL NASA texture with hyperrealistic bands and Great Red Spot
                const jupiterTexture = this.createJupiterTextureReal(2048);
                const jupiterBump = this.createJupiterBumpMap(1024);
                
                return new THREE.MeshStandardMaterial({
                    map: jupiterTexture,
                    bumpMap: jupiterBump,
                    bumpScale: 0.02,
                    roughness: 0.6,
                    metalness: 0.0,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            case 'saturn':
                // Saturn: REAL NASA texture with pale gold and detailed banding
                const saturnTexture = this.createSaturnTextureReal(2048);
                const saturnBump = this.createSaturnBumpMap(1024);
                
                return new THREE.MeshStandardMaterial({
                    map: saturnTexture,
                    bumpMap: saturnBump,
                    bumpScale: 0.015,
                    roughness: 0.55,
                    metalness: 0.0,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            case 'uranus':
                // Uranus: REAL NASA texture with cyan atmosphere and methane
                const uranusTexture = this.createUranusTextureReal(2048);
                return new THREE.MeshStandardMaterial({
                    map: uranusTexture,
                    roughness: 0.3,
                    metalness: 0.1,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            case 'neptune':
                // Neptune: REAL NASA texture with deep blue and Great Dark Spot
                const neptuneTexture = this.createNeptuneTextureReal(2048);
                return new THREE.MeshStandardMaterial({
                    map: neptuneTexture,
                    roughness: 0.3,
                    metalness: 0.1,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            case 'pluto':
                // Pluto: Hyperrealistic with Tombaugh Regio heart
                const plutoTexture = this.createPlutoTexture(2048);
                return new THREE.MeshStandardMaterial({
                    map: plutoTexture,
                    roughness: 0.85,
                    metalness: 0.0,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });
                
            default:
                // Default material
                console.warn(`?? DEFAULT MATERIAL CASE for planet "${name}" - using simple color: 0x${config.color?.toString(16)}`);
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
        planet.castShadow = false; // Planets don't cast shadows on each other (unrealistic at solar system scale)
        planet.receiveShadow = true; // But can receive shadows from moons
        planet.rotation.z = (config.tilt || 0) * Math.PI / 180;

        // Get real astronomical data for this planet
        const planetKey = config.name.toLowerCase();
        const astroData = this.ASTRONOMICAL_DATA[planetKey] || {};
        
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
            moons: [],
            
            // Real astronomical data for day/night cycle
            realRotationPeriod: astroData.rotationPeriod || 24, // hours
            axialTilt: astroData.axialTilt || 0,                // degrees
            retrograde: astroData.retrograde || false,          // rotation direction
            rotationPhase: Math.random() * Math.PI * 2          // starting rotation angle
        };

        // Add atmosphere for Earth with clouds
        if (config.atmosphere) {
            // TEMPORARILY DISABLED FOR DEBUGGING - Testing if clouds are causing blue sphere
            if (DEBUG.enabled) console.log('?? ATMOSPHERE DISABLED FOR DEBUGGING - If Earth shows continents now, clouds were the issue!');
            
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

        // NOTE: Great Red Spot removed - now included in Jupiter's NASA texture!
        // The procedurally generated 3D spot was redundant and looked odd
        // compared to the real NASA imagery which already shows the Great Red Spot
        
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
                metalness: 0.1,
                depthWrite: false // Don't block moons passing through rings
            });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            rings.castShadow = false; // Rings don't cast meaningful shadows at solar system scale
            rings.receiveShadow = true; // But can receive shadows from moons
            planet.add(rings);
        }

        scene.add(planet);
        this.objects.push(planet);
        
        // DIAGNOSTIC: Verify planet was added
        console.log(`? Planet "${config.name}" added to scene:`);
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
            // Earth's Moon: REAL NASA texture with deep craters and maria
            const moonTexture = this.createMoonTextureReal(2048);
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

        // Get real astronomical data for this moon
        const moonKey = config.name.toLowerCase();
        const astroData = this.ASTRONOMICAL_DATA[moonKey] || {};
        
        moon.userData = {
            name: config.name,
            type: 'Moon',
            parentPlanet: planet.userData.name,
            distance: config.distance,
            radius: config.radius,
            angle: Math.random() * Math.PI * 2,
            speed: config.speed,
            rotationSpeed: config.rotationSpeed || 0.001, // Add rotation
            description: config.description,
            
            // Real astronomical data for day/night cycle
            realRotationPeriod: astroData.rotationPeriod || 655.7, // hours (default: Moon's period)
            axialTilt: astroData.axialTilt || 0,
            retrograde: astroData.retrograde || false,
            rotationPhase: Math.random() * Math.PI * 2
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
            count: asteroidCount,
            radius: 40 // Effective radius for focus camera positioning (belt is at ~140 AU)
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
            count: kuiperCount,
            radius: 60  // Belt spans ~280-380 AU, radius for focus system
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

    async loadTextureWithFallback(url, fallbackColor) {
        // Try to load real imagery, fallback to color if it fails
        return new Promise((resolve) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (texture) => {
                    console.log(`✅ Loaded texture: ${url}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`⚠️ Failed to load ${url}, using fallback color`);
                    // Create circular gradient texture as fallback (no visible edges)
                    const canvas = document.createElement('canvas');
                    canvas.width = 128;
                    canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    
                    // Create radial gradient (bright center, fades to transparent)
                    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
                    gradient.addColorStop(0, fallbackColor);
                    gradient.addColorStop(0.5, fallbackColor + '80'); // 50% opacity
                    gradient.addColorStop(1, fallbackColor + '00'); // Transparent
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, 128, 128);
                    
                    const texture = new THREE.CanvasTexture(canvas);
                    resolve(texture);
                }
            );
        });
    }

    createDistantStars(scene) {
        // Create recognizable star systems and bright stars
        this.distantStars = [];
        
        const brightStars = [
            { name: 'Sirius', color: 0xFFFFFF, size: 8, distance: 8000, angle: 0, tilt: 0.5, description: '⭐ Sirius is the brightest star in Earth\'s night sky! It\'s actually a binary system with two stars orbiting each other. Located 8.6 light-years away in the constellation Canis Major.' },
            { name: 'Betelgeuse', color: 0xFF4500, size: 12, distance: 7500, angle: Math.PI / 3, tilt: 0.8, description: '⭐ Betelgeuse is a red supergiant star nearing the end of its life! It\'s so big that if placed at our Sun\'s position, it would extend past Mars. Will explode as a supernova someday!' },
            { name: 'Rigel', color: 0x87CEEB, size: 10, distance: 8500, angle: Math.PI * 2 / 3, tilt: -0.6, description: '⭐ Rigel is a blue supergiant, one of the most luminous stars visible to the naked eye! It\'s 40,000 times more luminous than our Sun and located 860 light-years away.' },
            { name: 'Vega', color: 0xF0F8FF, size: 7, distance: 7800, angle: Math.PI, tilt: 0.3, description: '⭐ Vega is one of the brightest stars in the northern sky! It was the North Star 12,000 years ago and will be again in 13,000 years due to Earth\'s axial precession.' },
            { name: 'Polaris', color: 0xFFFACD, size: 6, distance: 9000, angle: Math.PI * 1.5, tilt: 0.9, description: '⭐ Polaris, the North Star, has guided travelers for centuries! It\'s actually a triple star system and is currently very close to true north due to Earth\'s rotation axis.' }
        ];

        brightStars.forEach(async (starData) => {
            const geometry = new THREE.SphereGeometry(starData.size, 32, 32);
            
            // Use texture if provided, otherwise use color
            let material;
            if (starData.texture) {
                const texture = await this.loadTextureWithFallback(starData.texture, `#${starData.color.toString(16).padStart(6, '0')}`);
                material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.9
                });
            } else {
                material = new THREE.MeshBasicMaterial({
                    color: starData.color,
                    transparent: true,
                    opacity: 0.9
                });
            }
            
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
                side: THREE.BackSide,
                depthWrite: false // Don't block objects behind the glow
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
        // Create colorful nebulae with procedural generation
        this.nebulae = [];
        
        const nebulaeData = [
            { 
                name: 'Orion Nebula', 
                color: 0xFF69B4, 
                position: { x: 6000, y: 1000, z: 3000 }, 
                size: 400, 
                type: 'emission', // Star-forming region
                description: '🌟 The Orion Nebula is a stellar nursery where new stars are being born! It\'s 1,344 light-years away and is visible to the naked eye as a fuzzy patch in Orion\'s sword. Contains over 3,000 stars!'
            },
            { 
                name: 'Crab Nebula', 
                color: 0x87CEEB, 
                position: { x: -5500, y: -800, z: 4500 }, 
                size: 300, 
                type: 'supernova', // Supernova remnant with filaments
                description: '💥 The Crab Nebula is the remnant of a supernova explosion observed by Chinese astronomers in 1054 AD! At its center is a pulsar spinning 30 times per second!'
            },
            { 
                name: 'Ring Nebula', 
                color: 0x9370DB, 
                position: { x: 4500, y: 1500, z: -5000 }, 
                size: 250, 
                type: 'planetary', // Planetary nebula (ring shape)
                description: '💍 The Ring Nebula is a planetary nebula - the glowing remains of a dying Sun-like star! The star at its center has blown off its outer layers, creating this beautiful ring.'
            }
        ];

        for (const nebData of nebulaeData) {
            const group = new THREE.Group();
            
            // Create procedural nebula with particles
            const particleCount = 8000;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            
            const color = new THREE.Color(nebData.color);
            
            for (let i = 0; i < particleCount; i++) {
                let x, y, z;
                
                if (nebData.type === 'planetary') {
                    // Ring shape for planetary nebula
                    const angle = Math.random() * Math.PI * 2;
                    const radius = nebData.size * 0.4 + Math.random() * nebData.size * 0.3;
                    const thickness = (Math.random() - 0.5) * nebData.size * 0.15;
                    x = Math.cos(angle) * radius;
                    y = Math.sin(angle) * radius;
                    z = thickness;
                } else if (nebData.type === 'supernova') {
                    // Filamentary structure for supernova remnant
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    const r = Math.pow(Math.random(), 0.3) * nebData.size;
                    x = r * Math.sin(phi) * Math.cos(theta);
                    y = r * Math.sin(phi) * Math.sin(theta);
                    z = r * Math.cos(phi);
                } else {
                    // Cloudy emission nebula
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    const r = Math.pow(Math.random(), 0.5) * nebData.size;
                    x = r * Math.sin(phi) * Math.cos(theta);
                    y = r * Math.sin(phi) * Math.sin(theta);
                    z = r * Math.cos(phi);
                }
                
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
                
                // Color variation
                const colorVariation = 0.8 + Math.random() * 0.4;
                colors[i * 3] = color.r * colorVariation;
                colors[i * 3 + 1] = color.g * colorVariation;
                colors[i * 3 + 2] = color.b * colorVariation;
                
                sizes[i] = Math.random() * 3 + 1;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            const material = new THREE.PointsMaterial({
                size: 2,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                sizeAttenuation: true,
                depthWrite: false
            });
            
            const particles = new THREE.Points(geometry, material);
            group.add(particles);
            
            group.position.set(nebData.position.x, nebData.position.y, nebData.position.z);
            
            group.userData = {
                name: nebData.name,
                type: 'Nebula',
                radius: nebData.size,
                description: nebData.description,
                distance: 'Thousands of light-years',
                funFact: nebData.name === 'Orion Nebula' ? 'New stars are being born here right now!' :
                         nebData.name === 'Crab Nebula' ? 'It\'s expanding at 1,500 km/s!' :
                         'Planetary nebulae have nothing to do with planets - they just look round like planets through old telescopes!'
            };
            
            scene.add(group);
            this.objects.push(group);
            this.nebulae.push(group);
        }
    }

    createConstellations(scene) {
        // Create famous star constellations visible from Earth
        this.constellations = [];
        
        // Constellation data: star positions (RA/Dec converted to 3D) and connections
        const constellationsData = [
            {
                name: 'Orion (The Hunter)',
                description: '? Orion is one of the most recognizable constellations! Look for the three stars in a row forming Orion\'s Belt. The bright red star Betelgeuse marks his shoulder, and blue Rigel marks his foot.',
                stars: [
                    { name: 'Betelgeuse', ra: 88.8, dec: 7.4, mag: 0.5, color: 0xFF4500 },  // Red supergiant
                    { name: 'Rigel', ra: 78.6, dec: -8.2, mag: 0.1, color: 0x87CEEB },     // Blue supergiant
                    { name: 'Bellatrix', ra: 81.3, dec: 6.3, mag: 1.6, color: 0xB0C4DE },
                    { name: 'Alnitak', ra: 85.2, dec: -1.9, mag: 1.8, color: 0xE0FFFF },  // Belt star 1
                    { name: 'Alnilam', ra: 84.1, dec: -1.2, mag: 1.7, color: 0xE0FFFF },  // Belt star 2
                    { name: 'Mintaka', ra: 83.0, dec: -0.3, mag: 2.2, color: 0xE0FFFF },  // Belt star 3
                    { name: 'Saiph', ra: 86.9, dec: -9.7, mag: 2.1, color: 0xB0E0E6 }
                ],
                lines: [[0,2], [2,3], [3,4], [4,5], [5,1], [1,6], [6,3]]  // Connect stars
            },
            {
                name: 'Big Dipper (Ursa Major)',
                description: '✨ The Big Dipper is actually part of Ursa Major (Great Bear)! The two stars at the end of the "cup" point to Polaris, the North Star. Used for navigation for thousands of years!',
                stars: [
                    { name: 'Dubhe', ra: 165.9, dec: 61.8, mag: 1.8, color: 0xFFFFE0 },
                    { name: 'Merak', ra: 165.5, dec: 56.4, mag: 2.4, color: 0xFFFFF0 },
                    { name: 'Phecda', ra: 178.5, dec: 53.7, mag: 2.4, color: 0xFFFFF0 },
                    { name: 'Megrez', ra: 183.9, dec: 57.0, mag: 3.3, color: 0xFFFFF0 },
                    { name: 'Alioth', ra: 193.5, dec: 55.96, mag: 1.8, color: 0xFFFFE0 },
                    { name: 'Mizar', ra: 200.9, dec: 54.9, mag: 2.2, color: 0xFFFFF0 },
                    { name: 'Alkaid', ra: 206.9, dec: 49.3, mag: 1.9, color: 0xFFFFE0 }
                ],
                lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6]]  // Dipper shape
            },
            {
                name: 'Southern Cross (Crux)',
                description: '✨ The Southern Cross is the smallest constellation but one of the most famous in the Southern Hemisphere! Used for navigation, it points towards the South Celestial Pole.',
                stars: [
                    { name: 'Acrux', ra: 186.6, dec: -63.1, mag: 0.8, color: 0xE0FFFF },
                    { name: 'Mimosa', ra: 191.9, dec: -59.7, mag: 1.3, color: 0xE0FFFF },
                    { name: 'Gacrux', ra: 187.8, dec: -57.1, mag: 1.6, color: 0xFF6347 },  // Red giant
                    { name: 'Delta Crucis', ra: 183.8, dec: -58.7, mag: 2.8, color: 0xFFFFE0 }
                ],
                lines: [[2,0], [0,1], [3,1], [3,2]]  // Cross shape
            },
            {
                name: 'Cassiopeia (The Queen)',
                description: '✨ Cassiopeia looks like a W or M depending on the season! In Greek mythology, Cassiopeia was a vain queen. The constellation is circumpolar in northern latitudes, meaning it never sets.',
                stars: [
                    { name: 'Schedar', ra: 10.1, dec: 56.5, mag: 2.2, color: 0xFFA500 },
                    { name: 'Caph', ra: 2.3, dec: 59.1, mag: 2.3, color: 0xFFFFF0 },
                    { name: 'Gamma Cas', ra: 14.2, dec: 60.7, mag: 2.5, color: 0xE0FFFF },
                    { name: 'Ruchbah', ra: 21.5, dec: 60.2, mag: 2.7, color: 0xFFFFF0 },
                    { name: 'Segin', ra: 25.6, dec: 63.7, mag: 3.4, color: 0xFFFFE0 }
                ],
                lines: [[0,1], [1,2], [2,3], [3,4]]  // W shape
            },
            {
                name: 'Scorpius (The Scorpion)',
                description: '🦂 Scorpius represents the scorpion that killed Orion in Greek mythology! The bright red star Antares marks the scorpion\'s heart. Look for the curved tail with the stinger!',
                stars: [
                    { name: 'Antares', ra: 247.4, dec: -26.4, mag: 1.0, color: 0xFF4500 },  // Red supergiant
                    { name: 'Shaula', ra: 263.4, dec: -37.1, mag: 1.6, color: 0xE0FFFF },
                    { name: 'Sargas', ra: 264.3, dec: -43.0, mag: 1.9, color: 0xFFFFE0 },
                    { name: 'Dschubba', ra: 240.1, dec: -22.6, mag: 2.3, color: 0xE0FFFF },
                    { name: 'Graffias', ra: 241.4, dec: -19.8, mag: 2.6, color: 0xFFFFE0 }
                ],
                lines: [[4,3], [3,0], [0,1], [1,2]]  // Scorpion curve
            }
        ];
        
        constellationsData.forEach(constData => {
            const group = new THREE.Group();
            const starMeshes = [];
            
            // Convert RA/Dec to 3D positions at distance 10000
            constData.stars.forEach(star => {
                // Convert RA (0-360�) and Dec (-90 to +90�) to radians
                const raRad = (star.ra * Math.PI) / 180;
                const decRad = (star.dec * Math.PI) / 180;
                const distance = 10000;
                
                // Spherical to Cartesian coordinates
                const x = distance * Math.cos(decRad) * Math.cos(raRad);
                const y = distance * Math.sin(decRad);
                const z = distance * Math.cos(decRad) * Math.sin(raRad);
                
                // Create star
                const starSize = 15 * Math.pow(2.5, -star.mag);  // Brighter = larger
                const starGeom = new THREE.SphereGeometry(starSize, 8, 8);
                const starMat = new THREE.MeshBasicMaterial({
                    color: star.color,
                    transparent: true,
                    opacity: 0.9
                });
                
                const starMesh = new THREE.Mesh(starGeom, starMat);
                starMesh.position.set(x, y, z);
                group.add(starMesh);
                starMeshes.push(starMesh);
                
                // Add glow
                const glowGeom = new THREE.SphereGeometry(starSize * 2, 8, 8);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: star.color,
                    transparent: true,
                    opacity: 0.3,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false // Don't block objects behind the glow
                });
                const glow = new THREE.Mesh(glowGeom, glowMat);
                starMesh.add(glow);
            });
            
            // Draw constellation lines
            constData.lines.forEach(line => {
                const points = [
                    starMeshes[line[0]].position,
                    starMeshes[line[1]].position
                ];
                const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({
                    color: 0x4488FF,
                    transparent: true,
                    opacity: 0.4,
                    linewidth: 2
                });
                const lineMesh = new THREE.Line(lineGeom, lineMat);
                group.add(lineMesh);
            });
            
            // Add constellation metadata
            group.userData = {
                name: constData.name,
                type: 'Constellation',
                description: constData.description,
                distance: '100s to 1000s of light-years',
                starCount: constData.stars.length
            };
            
            scene.add(group);
            this.objects.push(group);
            this.constellations.push(group);
        });
        
        console.log(`? Created ${this.constellations.length} constellations with star patterns!`);
    }

    createGalaxies(scene) {
        // Create distant galaxies with procedural generation
        this.galaxies = [];
        
        const galaxiesData = [
            { 
                name: 'Andromeda Galaxy', 
                position: { x: 12000, y: 2000, z: -8000 }, 
                size: 600, 
                type: 'spiral', 
                description: '🌌 The Andromeda Galaxy is our nearest large galactic neighbor, 2.5 million light-years away! It contains 1 trillion stars and is on a collision course with the Milky Way (don\'t worry, collision in 4.5 billion years).'
            },
            { 
                name: 'Whirlpool Galaxy', 
                position: { x: -10000, y: -1500, z: -9000 }, 
                size: 400, 
                type: 'spiral', 
                description: '🌌 The Whirlpool Galaxy (M51) is famous for its beautiful spiral arms! It\'s interacting with a smaller companion galaxy, creating stunning tidal forces and new star formation.'
            },
            { 
                name: 'Sombrero Galaxy', 
                position: { x: -8000, y: 3000, z: 7000 }, 
                size: 350, 
                type: 'elliptical', 
                description: '🌌 The Sombrero Galaxy looks like a Mexican hat! It has a bright nucleus, an unusually large central bulge, and a prominent dust lane. Contains 2,000 globular clusters!'
            }
        ];

        for (const galData of galaxiesData) {
            const group = new THREE.Group();
            
            // Create procedural spiral or elliptical structure
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
        }
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
                blending: THREE.AdditiveBlending,
                depthWrite: false // Don't block objects behind the glow
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
                realSize: '109m � 73m � 20m, 419,725 kg',
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
                realSize: '13.2m long � 4.2m diameter, 11,110 kg',
                orbitTime: '95 minutes'
            },
            { 
                name: 'GPS Satellites', 
                distance: 3.5,  // Medium Earth Orbit (MEO): 20,180 km altitude (26,560 km from Earth center)
                speed: 2,  // Orbital velocity: 3.87 km/s, period: 11h 58min (2 orbits/day)
                size: 0.025,
                color: 0x00FF00,
                description: '📡 GPS (NAVSTAR) constellation: 31 operational satellites (as of Oct 2025) in 6 orbital planes, 55° inclination. Each satellite orbits at 20,180 km altitude. Transmits L-band signals (1.2-1.5 GHz). Rubidium/cesium atomic clocks accurate to 10⁻⁴ seconds.',
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
                description: '🔭 Launched Dec 25, 2021. Reached L2 point Jan 24, 2022. First images released July 12, 2022. Observes infrared (0.6-28.5 μm). 6.5m segmented beryllium mirror (18 hexagons) with 25 m² collecting area - 6x Hubble! Sunshield: 21.2m × 14.2m, 5 layers.',
                funFact: 'Operating at -233�C (-388�F)! Can detect heat signature of a bumblebee at Moon distance. Discovered earliest galaxies at z=14 (280 million years after Big Bang).',
                realSize: '6.5m mirror, 21.2m � 14.2m sunshield, 6,161 kg',
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
                realSize: 'V1.5: 260 kg, 2.8m � 1.4m � 0.12m flat',
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
                angle: Math.PI * 0.7, // Direction: 35� north of ecliptic plane
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
                description: '🚀 New Horizons gave us the first close-up images of Pluto on July 14, 2015! It revealed water ice mountains up to 3,500m tall, vast nitrogen glaciers, and the famous heart-shaped Tombaugh Regio. Now 59 AU from Sun, exploring Kuiper Belt.',
                funFact: 'New Horizons traveled 9.5 years and 5 billion km to reach Pluto at 58,536 km/h. It carries 1 oz of Clyde Tombaugh\'s ashes!',
                realSize: '478 kg, 0.7 � 2.1 � 2.7m (piano-sized)',
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
                description: '🚀 Parker Solar Probe is "touching" the Sun! Launched Aug 12, 2018, it flies through the Sun\'s corona. At closest approach (6.9 million km from surface), it reaches 192 km/s (690,000 km/h)! Heat shield withstands 1,377°C while instruments stay at 30°C.',
                funFact: 'Parker completed 21 orbits as of Oct 2025. Final perihelion in Dec 2025 will reach 6.9 million km - into the corona!',
                realSize: '685 kg, 3m tall, 2.3m heat shield',
                launched: 'August 12, 2018',
                status: 'Active, 7-year mission (ends 2025)'
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
                description: '🛰️ Juno entered Jupiter orbit July 4, 2016. Studies composition, gravity field, magnetic field, and polar auroras. Discovered Jupiter\'s core is larger and "fuzzy", massive polar cyclones, and atmospheric ammonia distribution. Extended mission until Sept 2025.',
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
                description: '🛰️ Cassini orbited Saturn June 30, 2004 - Sept 15, 2017 (13 years). Discovered liquid methane/ethane lakes on Titan, water geysers on Enceladus, new rings, 7 new moons. Huygens probe landed on Titan Jan 14, 2005. Ended with atmospheric entry "Grand Finale".',
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
            
            // Add glow marker - MUCH BIGGER for distant spacecraft!
            // For distant probes (distance > 100), make glow proportional to distance so they're visible
            const glowSize = craft.distance > 100 ? 
                Math.max(craft.size * 1.8, craft.distance * 0.03) : // Min 3% of distance for far objects
                craft.size * 1.8; // Normal size for nearby objects
            
            console.log(`?? ${craft.name} glow size: ${glowSize.toFixed(2)} (distance: ${craft.distance}, base size: ${craft.size})`);
            
            const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: craft.color,
                transparent: true,
                opacity: 0.25, // Increased from 0.15 for better visibility
                blending: THREE.AdditiveBlending,
                depthWrite: false // Don't block objects behind the glow
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
                isSpacecraft: true,
                radius: glowSize // Use glow size as radius for focusing
            };
            
            // Position spacecraft
            if (craft.orbitPlanet) {
                // Orbiter around planet
                const planet = this.planets[craft.orbitPlanet];
                if (planet) {
                    spacecraft.position.x = craft.distance * Math.cos(craft.angle);
                    spacecraft.position.z = craft.distance * Math.sin(craft.angle);
                    planet.add(spacecraft);
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
        
        console.log(`🚀 Created ${this.spacecraft.length} spacecraft and probes!`);
    }

    update(deltaTime, timeSpeed, camera, controls) {
        // Safety check for deltaTime
        if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
            console.warn('⚠️ Invalid deltaTime:', deltaTime, '- skipping frame');
            return;
        }
        
        // Get pause mode from sceneManager
        const app = window.app || {};
        const sceneManager = app.sceneManager || {};
        const pauseMode = sceneManager.pauseMode || 'none';
        
        // Calculate effective time speeds based on pause mode
        let orbitalSpeed = timeSpeed;
        let rotationSpeed = timeSpeed;
        let moonSpeed = timeSpeed;
        
        if (pauseMode === 'all') {
            // Pause everything
            orbitalSpeed = 0;
            rotationSpeed = 0;
            moonSpeed = 0;
        } else if (pauseMode === 'orbital') {
            // Pause only solar orbits, keep rotations and moon orbits
            orbitalSpeed = 0;
            rotationSpeed = timeSpeed;
            moonSpeed = timeSpeed;
        }
        // else 'none' - everything moves normally
        
        // Update all planets
        Object.values(this.planets).forEach(planet => {
            if (planet && planet.userData) {
                // Calculate angle increment based on speed
                const angleIncrement = planet.userData.speed * orbitalSpeed * deltaTime;
                
                // Safety check for angle increment
                if (isNaN(angleIncrement) || !isFinite(angleIncrement)) {
                    console.error('❌ Invalid angleIncrement for', planet.userData.name, ':', angleIncrement);
                    return;
                }
                
                // Solar orbit (affected by orbital pause)
                planet.userData.angle += angleIncrement;
                
                // Safety check for angle
                if (isNaN(planet.userData.angle) || !isFinite(planet.userData.angle)) {
                    console.error('❌ Invalid angle for', planet.userData.name, '- resetting to 0');
                    planet.userData.angle = 0;
                }
                
                planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
                planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
                
                // REALISTIC PLANET ROTATION based on real astronomical data
                if (planet.userData.realRotationPeriod && rotationSpeed > 0) {
                    // Calculate elapsed real time in hours
                    const elapsedMs = Date.now() - this.realTimeStart;
                    const elapsedHours = (elapsedMs / 1000 / 3600) * this.timeAcceleration;
                    
                    // Calculate rotation angle based on real rotation period
                    const rotationsComplete = elapsedHours / planet.userData.realRotationPeriod;
                    let rotationAngle = (rotationsComplete * Math.PI * 2) + planet.userData.rotationPhase;
                    
                    // Reverse rotation for retrograde planets (Venus, Uranus)
                    if (planet.userData.retrograde) {
                        rotationAngle = -rotationAngle;
                    }
                    
                    // Apply rotation
                    planet.rotation.y = rotationAngle;
                    
                    // Apply axial tilt (already set during creation, but ensure it stays)
                    planet.rotation.z = (planet.userData.axialTilt || 0) * Math.PI / 180;
                }
                
                // Rotate clouds slightly faster than planet for Earth
                if (planet.userData.clouds && rotationSpeed > 0) {
                    planet.userData.clouds.rotation.y = planet.rotation.y * 1.05; // 5% faster
                }

                // Update moons - orbit around their parent planet
                if (planet.userData.moons && planet.userData.moons.length > 0) {
                    planet.userData.moons.forEach(moon => {
                        if (moon.userData) {
                            // Calculate moon angle increment
                            const moonAngleIncrement = moon.userData.speed * moonSpeed * deltaTime;
                            
                            // Moons orbit their planet
                            moon.userData.angle += moonAngleIncrement;
                            
                            // IMPORTANT: Since moon is a child of planet (planet.add(moon)),
                            // these positions are RELATIVE to the planet's position, not world coordinates!
                            // This keeps the moon orbiting around its parent planet correctly.
                            moon.position.x = moon.userData.distance * Math.cos(moon.userData.angle);
                            moon.position.z = moon.userData.distance * Math.sin(moon.userData.angle);
                            moon.position.y = 0; // Keep moons in planet's equatorial plane
                            
                            // REALISTIC MOON ROTATION based on real astronomical data
                            if (moon.userData.realRotationPeriod && rotationSpeed > 0) {
                                // Calculate elapsed real time in hours
                                const elapsedMs = Date.now() - this.realTimeStart;
                                const elapsedHours = (elapsedMs / 1000 / 3600) * this.timeAcceleration;
                                
                                // Calculate rotation angle based on real rotation period
                                const rotationsComplete = elapsedHours / moon.userData.realRotationPeriod;
                                let rotationAngle = (rotationsComplete * Math.PI * 2) + moon.userData.rotationPhase;
                                
                                // Reverse rotation for retrograde moons
                                if (moon.userData.retrograde) {
                                    rotationAngle = -rotationAngle;
                                }
                                
                                // Apply rotation
                                moon.rotation.y = rotationAngle;
                                
                                // Apply axial tilt
                                moon.rotation.z = (moon.userData.axialTilt || 0) * Math.PI / 180;
                            }
                            
                            // Debug: Log moon position occasionally (Moon and Io)
                            if (DEBUG.enabled && Math.random() < 0.001) {
                                if (moon.userData.name === 'Moon' || moon.userData.name === 'Io') {
                                    const worldPos = new THREE.Vector3();
                                    moon.getWorldPosition(worldPos);
                                    console.log(`🌙 ${moon.userData.name} orbiting ${planet.userData.name}: angle=${moon.userData.angle.toFixed(2)}, local=(${moon.position.x.toFixed(1)}, ${moon.position.y.toFixed(1)}, ${moon.position.z.toFixed(1)}), world=(${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)}, ${worldPos.z.toFixed(1)}), planet at=(${planet.position.x.toFixed(1)}, ${planet.position.y.toFixed(1)}, ${planet.position.z.toFixed(1)})`);
                                }
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
        const effectiveTimeSpeed = timeSpeed;
        if (this.asteroidBelt) {
            const rotationIncrement = 0.0001 * effectiveTimeSpeed;
            if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
                this.asteroidBelt.rotation.y += rotationIncrement;
            }
        }
        if (this.kuiperBelt) {
            const rotationIncrement = 0.00005 * effectiveTimeSpeed;
            if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
                this.kuiperBelt.rotation.y += rotationIncrement;
            }
        }

        // Rotate sun and animate surface activity
        if (this.sun) {
            const rotationIncrement = 0.001 * effectiveTimeSpeed;
            if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
                this.sun.rotation.y += rotationIncrement;
            }
            
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
                const angleIncrement = userData.speed * effectiveTimeSpeed;
                if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
                    userData.angle += angleIncrement;
                }
                
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
                    const angleIncrement = userData.speed * effectiveTimeSpeed * 0.01; // Scale down for realistic orbit times
                    if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
                        userData.angle += angleIncrement;
                    }
                    
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
                    
                    // Debug: Log satellite positions for yellow/gold satellites
                    if (DEBUG.enabled && (satellite.material.color.getHex() === 0xFFFF00 || satellite.material.color.getHex() === 0xFFD700)) {
                        if (Math.random() < 0.001) {
                            console.log(`🛰️ ${userData.name}: Earth at (${earthPosition.x.toFixed(1)}, ${earthPosition.y.toFixed(1)}, ${earthPosition.z.toFixed(1)}), Satellite at (${satellite.position.x.toFixed(1)}, ${satellite.position.y.toFixed(1)}, ${satellite.position.z.toFixed(1)}), distance=${userData.distance}`);
                        }
                    }
                    
                    // Rotate satellite to face Earth
                    satellite.lookAt(earthPosition);
                }
            });
        }
        
        // Update spacecraft (Voyagers, probes, orbiters)
        if (this.spacecraft) {
            // Get numeric speed multiplier
            const effectiveTimeSpeed = timeSpeed;
            
            this.spacecraft.forEach(craft => {
                const userData = craft.userData;
                
                // Deep space probes keep moving away
                if (!userData.orbitPlanet && userData.speed) {
                    const angleIncrement = userData.speed * effectiveTimeSpeed * 0.001;
                    if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
                        userData.angle += angleIncrement;
                        craft.position.x = userData.distance * Math.cos(userData.angle);
                        craft.position.z = userData.distance * Math.sin(userData.angle);
                    }
                }
                
                // Orbiters around planets (Juno, Cassini legacy, etc)
                if (userData.orbitPlanet && userData.speed && userData.type === 'orbiter') {
                    const angleIncrement = userData.speed * effectiveTimeSpeed * 0.01;
                    if (!isNaN(angleIncrement) && isFinite(angleIncrement)) {
                        userData.angle += angleIncrement;
                        const radius = userData.distance;
                        craft.position.x = radius * Math.cos(userData.angle);
                        craft.position.z = radius * Math.sin(userData.angle);
                        craft.position.y = Math.sin(userData.angle * 2) * radius * 0.1; // Inclined orbit
                    }
                }
                
                // Rotate spacecraft slowly
                if (userData.type === 'probe' || userData.type === 'orbiter') {
                    const rotationIncrement = 0.002 * effectiveTimeSpeed;
                    if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
                        craft.rotation.y += rotationIncrement;
                    }
                }
            });
        }
        
        // Rotate nebulae slowly (optimized - pre-calculate time)
        if (this.nebulae) {
            const effectiveTimeSpeed = timeSpeed;
            const time = Date.now() * 0.0005;
            const scale = 1 + Math.sin(time) * 0.05;
            
            this.nebulae.forEach(nebula => {
                const rotationIncrement = 0.0001 * effectiveTimeSpeed;
                if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
                    nebula.rotation.y += rotationIncrement;
                }
                // Pulsing effect (shared calculation)
                nebula.scale.setScalar(scale);
            });
        }
        
        // Rotate galaxies
        if (this.galaxies) {
            const effectiveTimeSpeed = timeSpeed;
            this.galaxies.forEach(galaxy => {
                const rotationIncrement = 0.0002 * effectiveTimeSpeed;
                if (!isNaN(rotationIncrement) && isFinite(rotationIncrement)) {
                    galaxy.rotation.y += rotationIncrement;
                }
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
    
    toggleOrbits(visible) {
        this.orbitsVisible = visible;
        this.orbits.forEach(orbit => {
            orbit.visible = visible;
        });
        console.log(`🛤️ Orbit paths ${visible ? 'shown' : 'hidden'}`);
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
        
        // Safely format distance
        let distanceText;
        if (userData.distance === 0) {
            distanceText = 'Center of Solar System';
        } else if (userData.parentPlanet) {
            distanceText = `Orbits ${userData.parentPlanet}`;
        } else if (typeof userData.distance === 'number') {
            distanceText = `${userData.distance.toFixed(1)} million km from Sun`;
        } else {
            distanceText = 'Distance varies';
        }
        
        let info = {
            name: userData.name || 'Unknown',
            type: userData.type || 'Object',
            distance: distanceText,
            size: userData.realSize || (userData.radius ? `${userData.radius.toFixed(2)} units` : 'Unknown size'),
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
        if (!object || !object.userData) {
            console.warn('⚠️ Cannot focus on invalid object');
            return;
        }
        
        const radius = object.userData.radius || 10;
        const distance = Math.max(radius * 5, 10);
        const targetPosition = new THREE.Vector3();
        object.getWorldPosition(targetPosition);
        
        // Store reference for tracking
        this.focusedObject = object;
        console.log(`🎯 Focusing on ${object.userData.name} (radius: ${radius}, distance: ${distance})`);
        
        // Configure controls for focused object inspection
        const originalMinDistance = controls.minDistance;
        const originalMaxDistance = controls.maxDistance;
        
        // Set dynamic zoom limits based on object size - allow very close zoom
        const minDist = Math.max(radius * 0.5, 0.5); // Allow zooming to half the radius, minimum 0.5 units
        const maxDist = Math.max(radius * 100, 1000); // Allow zooming far out
        controls.minDistance = minDist;
        controls.maxDistance = maxDist;
        console.log(`  📏 Zoom limits: ${minDist.toFixed(1)} to ${maxDist.toFixed(1)}`);
        
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
                console.log(`?? Focused on ${object.userData.name} - Use mouse to rotate, scroll to zoom`);
            }
        };
        
        animate();
        
        // Store original limits to restore later if needed
        object.userData._originalMinDistance = originalMinDistance;
        object.userData._originalMaxDistance = originalMaxDistance;
    }

    createLabels() {
        // Create CSS2D labels for all major objects
        this.labels = [];
        
        // Helper function to create a label
        const createLabel = (object, text) => {
            if (!object || !object.userData) return;
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'object-label';
            labelDiv.textContent = text || object.userData.name;
            labelDiv.style.color = 'white';
            labelDiv.style.fontSize = '14px';
            labelDiv.style.fontFamily = "'Poppins', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
            labelDiv.style.padding = '2px 6px';
            labelDiv.style.background = 'rgba(0, 0, 0, 0.7)';
            labelDiv.style.borderRadius = '4px';
            labelDiv.style.pointerEvents = 'none';
            labelDiv.style.userSelect = 'none';
            
            const label = new CSS2DObject(labelDiv);
            label.position.set(0, object.userData.radius * 1.5 || 5, 0);
            label.visible = false; // Start hidden
            object.add(label);
            
            object.userData.label = label;
            this.labels.push(label);
        };
        
        // Add labels to Sun
        if (this.sun) {
            createLabel(this.sun, '☀️ Sun');
        }
        
        // Add labels to planets
        Object.entries(this.planets).forEach(([name, planet]) => {
            if (planet) {
                const emoji = {
                    'mercury': '☿️', 'venus': '♀️', 'earth': '🌍', 'mars': '🔴',
                    'jupiter': '🪐', 'saturn': '🪐', 'uranus': '💙', 'neptune': '💙'
                }[name.toLowerCase()] || '🌑';
                createLabel(planet, `${emoji} ${planet.userData.name}`);
                
                // Add labels to moons
                if (planet.userData.moons) {
                    planet.userData.moons.forEach(moon => {
                        createLabel(moon, `🌙 ${moon.userData.name}`);
                    });
                }
            }
        });
        
        // Add labels to spacecraft
        if (this.spacecraft) {
            this.spacecraft.forEach(craft => {
                createLabel(craft, `🛰️ ${craft.userData.name}`);
            });
        }
        
        // Add labels to satellites
        if (this.satellites) {
            this.satellites.forEach(sat => {
                createLabel(sat, `🛰️ ${sat.userData.name}`);
            });
        }
        
        // Add labels to distant stars
        if (this.distantStars) {
            this.distantStars.forEach(star => {
                createLabel(star, `⭐ ${star.userData.name}`);
            });
        }
        
        // Add labels to nebulae
        if (this.nebulae) {
            this.nebulae.forEach(nebula => {
                createLabel(nebula, `🌌 ${nebula.userData.name}`);
            });
        }
        
        // Add labels to constellations
        if (this.constellations) {
            this.constellations.forEach(constellation => {
                createLabel(constellation, `✨ ${constellation.userData.name}`);
            });
        }
    }

    toggleLabels(visible) {
        console.log(`🏷️ toggleLabels called with visible=${visible}, labels.length=${this.labels?.length || 0}`);
        
        if (!this.labels || this.labels.length === 0) {
            console.warn('⚠️ No labels to toggle - labels array is empty or undefined');
            console.log('   this.labels:', this.labels);
            return;
        }
        
        // Use the passed visibility state, or toggle based on first label's current state
        const newVisibility = visible !== undefined ? visible : !this.labels[0].visible;
        
        this.labels.forEach((label, index) => {
            label.visible = newVisibility;
            if (index < 3 && DEBUG.enabled) {
                console.log(`   Label ${index}: ${label.element?.textContent || 'no text'} -> visible=${newVisibility}`);
            }
        });
        
        console.log(`🏷️ Labels now: ${newVisibility ? 'VISIBLE ✅' : 'HIDDEN ❌'} (${this.labels.length} labels toggled)`);
    }

    getExplorerContent(focusCallback) {
        const categories = [
            {
                title: '☀️ The Sun',
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
                    { name: '🔴 Mars', onClick: () => focusCallback(this.planets.mars) },
                    { name: '🌑 Phobos', onClick: () => focusCallback(this.moons.phobos) },
                    { name: '🌑 Deimos', onClick: () => focusCallback(this.moons.deimos) }
                ]
            },
            {
                title: '🪨 Asteroid Belt',
                items: [
                    { name: '☄️ Asteroid Belt', onClick: () => focusCallback(this.asteroidBelt) }
                ]
            },
            {
                title: '🪐 Outer Planets (Gas Giants)',
                items: [
                    { name: '🪐 Jupiter', onClick: () => focusCallback(this.planets.jupiter) },
                    { name: '🌋 Io', onClick: () => focusCallback(this.moons.io) },
                    { name: '❄️ Europa', onClick: () => focusCallback(this.moons.europa) },
                    { name: '🌕 Ganymede', onClick: () => focusCallback(this.moons.ganymede) },
                    { name: '🌑 Callisto', onClick: () => focusCallback(this.moons.callisto) },
                    { name: '🪐 Saturn', onClick: () => focusCallback(this.planets.saturn) },
                    { name: '🟠 Titan', onClick: () => focusCallback(this.moons.titan) },
                    { name: '💎 Enceladus', onClick: () => focusCallback(this.moons.enceladus) },
                    { name: '🌕 Rhea', onClick: () => focusCallback(this.moons.rhea) }
                ]
            },
            {
                title: '❄️ Ice Giants',
                items: [
                    { name: '🔵 Uranus', onClick: () => focusCallback(this.planets.uranus) },
                    { name: '🌕 Titania', onClick: () => focusCallback(this.moons.titania) },
                    { name: '🌑 Miranda', onClick: () => focusCallback(this.moons.miranda) },
                    { name: '🔷 Neptune', onClick: () => focusCallback(this.planets.neptune) },
                    { name: '🌑 Triton', onClick: () => focusCallback(this.moons.triton) }
                ]
            },
            {
                title: '🧊 Kuiper Belt & Dwarf Planets',
                items: [
                    { name: '🪐 Pluto', onClick: () => focusCallback(this.planets.pluto) },
                    { name: '🌑 Charon', onClick: () => focusCallback(this.moons.charon) },
                    { name: '❄️ Kuiper Belt', onClick: () => focusCallback(this.kuiperBelt) }
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
                title: '🌌 Galaxies',
                items: this.galaxies.map(galaxy => ({
                    name: `🌌 ${galaxy.userData.name}`,
                    onClick: () => focusCallback(galaxy)
                }))
            }
        ];
        
        // Filter out categories with no items (empty arrays)
        return categories.filter(category => category.items && category.items.length > 0);
    }
    
    refreshExplorerContent() {
        // Refresh the explorer menu with all loaded objects
        if (!this.uiManager) return;
        
        const focusCallback = (obj) => {
            if (obj) {
                const info = this.getObjectInfo(obj);
                this.uiManager.updateInfoPanel(info);
                this.focusOnObject(obj, window.app?.sceneManager?.camera, window.app?.sceneManager?.controls);
            }
        };
        
        const explorerContent = this.getExplorerContent(focusCallback);
        if (explorerContent && Array.isArray(explorerContent)) {
            this.uiManager.updateExplorer('🚀 Explore the Solar System', explorerContent);
            console.log(`🔄 Explorer menu refreshed with ${explorerContent.length} categories`);
        }
    }
}

// ===========================
// QUANTUM MODULE - REMOVED (Focusing on Solar System only)
// ===========================
/* REMOVED - Quantum Module class deleted to focus on solar system exploration
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
            description: '⚛️ The nucleus is the tiny, dense center of an atom containing protons (+) and neutrons (no charge). It holds 99.9% of the atom\'s mass! Protons determine which element it is.\n\n👶 For Kids: The nucleus is like a tiny sun at the center - super small but super important!\n\n🎓 Advanced: Protons (up,up,down quarks) and neutrons (up,down,down quarks) are held together by the strong nuclear force, the strongest force in nature!',
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
                description: '? Electrons are negatively charged particles that orbit the nucleus in "clouds" called orbitals. They determine how atoms bond with each other to make molecules!\n\n?? For Kids: Electrons zip around the nucleus like planets around the sun, but much faster and in weird quantum ways!\n\n?? Advanced: Electrons exhibit wave-particle duality and exist in probability clouds. Their position follows the Heisenberg Uncertainty Principle!',
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
            description: '🌊 All matter has wave properties! This is called wave-particle duality. Electrons can behave like waves, creating interference patterns just like light waves.\n\n👶 For Kids: Imagine if you could be in two places at once - that\'s what particles can do when acting like waves!\n\n🎓 Advanced: The de Broglie wavelength λ = h/p shows all matter has wave properties. This is why electrons create diffraction patterns in the double-slit experiment!',
            funFact: 'You have a wavelength too! But it\'s so tiny (about 10?�5 m) we never notice it.'
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
            description: '💡 Photons are particles of light! They have no mass but carry energy. All electromagnetic radiation (radio waves, visible light, X-rays) is made of photons traveling at light speed (299,792 km/s).\n\n👶 For Kids: Light is made of tiny packets of energy called photons - like little light bullets!\n\n🎓 Advanced: Photons are the quantum of electromagnetic field, described by E = hf where h is Planck\'s constant. They exhibit both particle and wave properties!',
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
            description: '🎭 Superposition means a quantum particle can be in multiple states at once until measured! Like Schrödinger\'s famous cat being both alive and dead.\n\n👶 For Kids: Imagine flipping a coin - while it\'s spinning, it\'s both heads AND tails at the same time!\n\n🎓 Advanced: Quantum superposition is described by ψ = a|0⟩ + β|1⟩ where |a|² + |β|² = 1. Measurement causes wavefunction collapse to a definite state!',
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
            description: '🔗 Entangled particles are mysteriously connected! Measuring one instantly affects the other, even across the universe. Einstein called it "spooky action at a distance"!\n\n👶 For Kids: Imagine having a magic pair of dice - when you roll one, the other shows the opposite number instantly, no matter how far apart they are!\n\n🎓 Advanced: Entanglement violates Bell\'s inequalities, proving quantum mechanics is fundamentally non-local. Used in quantum teleportation and quantum cryptography!',
            funFact: 'Entanglement has been proven to work over 1,200 km using satellites!'
        };
        
        scene.add(entangleGroup);
        this.objects.push(entangleGroup);

        return true;
    }

    update(deltaTime, timeSpeed, camera, controls) {
        // Safety check for timeSpeed (handle 'realtime' string)
        const effectiveTimeSpeed = (typeof timeSpeed === 'string') ? 1 : timeSpeed;
        
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
            this.nucleus.rotation.y += 0.005 * effectiveTimeSpeed;
            this.nucleus.rotation.x += 0.003 * effectiveTimeSpeed;
        }

        // Orbit electrons
        this.orbitals.forEach((electron, index) => {
            electron.userData.angle += electron.userData.orbitalSpeed * effectiveTimeSpeed;
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
            
            electron.rotation.y += 0.1 * effectiveTimeSpeed;
        });

        // Animate wave
        if (this.wave) {
            this.wave.rotation.y += 0.01 * effectiveTimeSpeed;
            this.wave.rotation.z += 0.005 * effectiveTimeSpeed;
            this.wave.scale.x = 1 + Math.sin(Date.now() * 0.001) * 0.1;
            this.wave.scale.y = 1 + Math.cos(Date.now() * 0.001) * 0.1;
        }

        // Animate photon
        if (this.photon) {
            this.photon.rotation.y += 0.05 * effectiveTimeSpeed;
            this.photon.children.forEach((ray, i) => {
                ray.rotation.z = (i * Math.PI / 4) + Date.now() * 0.001;
            });
        }

        // Animate superposition (phase in/out)
        if (this.superposition) {
            this.superposition.rotation.x += 0.02 * effectiveTimeSpeed;
            this.superposition.rotation.y += 0.03 * effectiveTimeSpeed;
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
            distance: 'Quantum scale (10?�� m)',
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
                console.log(`?? Focused on ${object.userData.name} - Use mouse to rotate, scroll to zoom`);
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
                title: '?? Atomic Structure',
                items: [
                    { name: '?? Nucleus (Protons & Neutrons)', onClick: () => focusCallback(this.nucleus) },
                    { name: '? Electron Cloud', onClick: () => focusCallback(this.orbitals[0]) }
                ]
            },
            {
                title: '?? Wave-Particle Duality',
                items: [
                    { name: '?? Matter Wave', onClick: () => focusCallback(this.wave) },
                    { name: '?? Photon (Light Particle)', onClick: () => focusCallback(this.photon) }
                ]
            },
            {
                title: '?? Quantum Phenomena',
                items: [
                    { name: '?? Superposition', onClick: () => focusCallback(this.superposition) },
                    { name: '?? Quantum Entanglement', onClick: () => focusCallback(this.objects[this.objects.length - 1]) }
                ]
            }
        ];
    }
} END REMOVED QuantumModule */

// ===========================
// TOPIC MANAGER
// ===========================
// TOPIC MANAGER (UNUSED - Commented out for single-topic app)
// ===========================
/* UNUSED CLASS - Kept for reference if multi-topic support needed in future
class TopicManager {
    constructor(sceneManager, uiManager) {
        this.sceneManager = sceneManager;
        this.uiManager = uiManager;
        this.currentModule = null;
        this.currentTopicId = null;
        this.timeSpeed = 1;
        this.brightnessMultiplier = 0.5;
        this.clickTimeout = null;
        
        // Modules - Only Solar System (quantum removed)
        this.modules = {
            'solar-system': new SolarSystemModule(uiManager)
            // Other modules removed - focusing on solar system only
        };

        this.setupControls();
    }

    setupControls() {
        // Topic navigation with event delegation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleTopicChange(btn), { passive: true });
        });

        // Time speed control (dropdown selector)
        const timeSpeedSelect = document.getElementById('time-speed');
        if (timeSpeedSelect) {
            timeSpeedSelect.addEventListener('change', (e) => {
                this.timeSpeed = parseFloat(e.target.value);
                console.log(`⏱️ Speed mode changed to: ${e.target.options[e.target.selectedIndex].text} (${this.timeSpeed}x)`);
            }, { passive: true });
            
            // Set initial speed
            this.timeSpeed = parseFloat(timeSpeedSelect.value);
        }

        // Scale toggle button
        const scaleButton = document.getElementById('toggle-scale');
        if (scaleButton) {
            scaleButton.addEventListener('click', () => {
                if (this.solarSystemModule) {
                    this.solarSystemModule.realisticScale = !this.solarSystemModule.realisticScale;
                    scaleButton.classList.toggle('active');
                    scaleButton.textContent = this.solarSystemModule.realisticScale ? 
                        '?? Realistic Scale' : '?? Educational Scale';
                    
                    // Recalculate positions with new scale
                    this.solarSystemModule.updateScale();
                }
            }, { passive: true });
        }
        
        // Labels toggle button
        const labelsButton = document.getElementById('toggle-details');
        if (labelsButton) {
            // Set initial button state
            labelsButton.textContent = '📊 Labels OFF';
            labelsButton.classList.remove('toggle-on');
            
            labelsButton.addEventListener('click', () => {
                const currentModule = this.solarSystemModule || this.quantumModule;
                if (currentModule && currentModule.toggleLabels) {
                    // Toggle visibility using SceneManager's labelsVisible state
                    if (this.sceneManager) {
                        this.sceneManager.labelsVisible = !this.sceneManager.labelsVisible;
                        currentModule.toggleLabels(this.sceneManager.labelsVisible);
                        labelsButton.classList.toggle('toggle-on', this.sceneManager.labelsVisible);
                        labelsButton.textContent = this.sceneManager.labelsVisible ? 
                            '📊 Labels ON' : '📊 Labels OFF';
                        if (DEBUG.enabled) console.log(`🏷️ Labels toggled: ${this.sceneManager.labelsVisible ? 'ON' : 'OFF'}`);
                    }
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
                    `?? Explore ${topicId}`, 
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
*/ // END OF UNUSED TopicManager CLASS

// ===========================
// MAIN APPLICATION
// ===========================
class App {
    constructor() {
        this.sceneManager = null;
        this.uiManager = null;
        this.solarSystemModule = null;
        this.lastTime = 0;
        this.timeSpeed = 1.0;
        this.brightness = 100; // Default brightness percentage
        
        // Make this app instance globally accessible for VR and other modules
        window.app = this;
        
        this.init();
    }

    async init() {
        const appStartTime = performance.now();
        
        try {
            // Check cache status
            const cacheReady = await warmupTextureCache();
            if (cacheReady && DEBUG.PERFORMANCE) {
                console.log('⚡ Fast start: All essential textures cached');
            }
            
            // Initialize managers
            this.sceneManager = new SceneManager();
            this.uiManager = new UIManager();
            
            this.uiManager.showLoading('Initializing Space Explorer...');
            
            // Setup global UI functions
            this.setupGlobalFunctions();
            
            // Setup help button
            this.setupHelpButton();

            // Load Solar System module directly
            const moduleStartTime = performance.now();
            this.solarSystemModule = new SolarSystemModule(this.uiManager);
            await this.solarSystemModule.init(this.sceneManager.scene);
            
            if (DEBUG.PERFORMANCE) {
                console.log(`⚡ Module loaded in ${(performance.now() - moduleStartTime).toFixed(0)}ms`);
            }
            
            // Setup UI for Solar System
            this.uiManager.setupSolarSystemUI(this.solarSystemModule, this.sceneManager);
            
            // Setup Apollo 11 Animation
            this.apollo11Animation = new Apollo11Animation(
                this.sceneManager.scene,
                this.sceneManager.camera,
                this.solarSystemModule
            );
            
            // Setup controls
            this.setupControls();

            // Start animation loop
            console.log('🎬 About to start animation loop...');
            console.log('   - sceneManager exists:', !!this.sceneManager);
            console.log('   - sceneManager.animate exists:', !!(this.sceneManager && this.sceneManager.animate));
            console.log('   - solarSystemModule exists:', !!this.solarSystemModule);
            console.log('🎥 Camera position:', this.sceneManager.camera.position);
            console.log('🎥 Camera parent:', this.sceneManager.camera.parent?.type || 'Scene');
            console.log('🎯 Controls target:', this.sceneManager.controls?.target);
            console.log('☀️ Sun position:', this.solarSystemModule.sun?.position);
            console.log('🌍 Earth position:', this.solarSystemModule.planets?.earth?.position);
            console.log('💡 Lights in scene:', this.sceneManager.lights);
            
            this.sceneManager.animate(() => {
                // Initialize timing on first frame to avoid huge initial deltaTime
                if (!this.lastTime) {
                    this.lastTime = performance.now();
                    return; // Skip first frame, just initialize timing
                }
                
                const currentTime = performance.now();
                const deltaTime = Math.min((currentTime - this.lastTime) / 1000, CONFIG.PERFORMANCE.maxDeltaTime);
                this.lastTime = currentTime;
                
                // Update XR controller movement and laser pointers
                this.sceneManager.updateXRMovement();
                this.sceneManager.updateLaserPointers();
                
                // Update Apollo 11 animation if active
                if (this.apollo11Animation) {
                    this.apollo11Animation.update(deltaTime);
                }
                
                // Update Solar System module every frame
                if (this.solarSystemModule) {
                    this.solarSystemModule.update(deltaTime, this.timeSpeed, 
                        this.sceneManager.camera, this.sceneManager.controls);
                }
            });

            const totalTime = performance.now() - appStartTime;
            console.log(`🚀 Space Explorer initialized in ${totalTime.toFixed(0)}ms!`);
            console.log(`📊 Performance: ${this.sceneManager.renderer.info.memory.geometries} geometries, ${this.sceneManager.renderer.info.memory.textures} textures`);
            console.log(`🪐 Planets loaded: ${Object.keys(this.solarSystemModule.planets).length}`);
            console.log(`📦 Objects in scene: ${this.solarSystemModule.objects.length}`);
            console.log(`✅ Animation loop status: ${this.sceneManager.renderer.xr ? 'Active' : 'Unknown'}`);
            
            if (DEBUG.PERFORMANCE) {
                console.log(`⚡ Breakdown: Scene ${(moduleStartTime - appStartTime).toFixed(0)}ms | Module ${(performance.now() - moduleStartTime - totalTime).toFixed(0)}ms`);
                console.log(`💾 Storage: ${(await TEXTURE_CACHE.cache.size)} textures in memory`);
            }
        } catch (error) {
            console.error('❌ Failed to initialize Space Explorer:', error);
            this.sceneManager?.showError('Failed to start Space Explorer. Please refresh the page.');
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
                    <p>🖱️ <strong>Click & Drag:</strong> Rotate view around selected object</p>
                    <p>🖱️ <strong>Scroll:</strong> Zoom in/out (closer or farther from object)</p>
                    <p>🖱️ <strong>Right Click & Drag:</strong> Pan camera position</p>
                    <p>🖱️ <strong>Click Objects:</strong> Select and focus on object</p>
                    <p>🖱️ <strong>Explorer Panel:</strong> Click object names to jump to them</p>
                    
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <p>⌨️ <span class="keyboard-shortcut">H</span> Show this help</p>
                    <p>⌨️ <span class="keyboard-shortcut">R</span> Reset camera view</p>
                    <p>⌨️ <span class="keyboard-shortcut">O</span> Toggle orbital paths</p>
                    <p>⌨️ <span class="keyboard-shortcut">D</span> Toggle object labels</p>
                    <p>⌨️ <span class="keyboard-shortcut">S</span> Toggle realistic scale</p>
                    <p>⌨️ <span class="keyboard-shortcut">L</span> Toggle VR laser pointers (in VR)</p>
                    <p>⌨️ <span class="keyboard-shortcut">F</span> Toggle FPS counter</p>
                    <p>⌨️ <span class="keyboard-shortcut">+/-</span> Speed up/slow down time</p>
                    <p>⌨️ <span class="keyboard-shortcut">ESC</span> Close panels</p>
                    
                    <h3>🔍 Object Inspection</h3>
                    <p>👁️ <strong>After selecting an object:</strong></p>
                    <p>  - Drag to rotate camera around the object</p>
                    <p>  - Scroll to zoom in for close-up views</p>
                    <p>  - View object from all sides and angles</p>
                    <p>  - Camera stays focused as object moves in orbit</p>
                    
                    <h3>⚙️ Settings</h3>
                    <p>⏱️ <strong>Speed Slider:</strong> 0x to 10x animation speed</p>
                    <p>💡 <strong>Brightness Slider:</strong> Adjust lighting for dark objects</p>
                    <p>🔄 <strong>Reset Button:</strong> Return camera to starting position</p>
                    
                    <h3>🥽 VR Mode</h3>
                    <p>🥽 Click "Enter VR" button (bottom right)</p>
                    <p>🥽 Requires WebXR-compatible VR headset</p>
                    <p>🥽 <strong>VR Controls:</strong></p>
                    <p>  - Left stick: Move forward/backward/strafe</p>
                    <p>  - Right stick: Turn left/right, move up/down</p>
                    <p>  - Trigger (hold): Sprint mode while moving</p>
                    <p>  - Grip button: Toggle VR menu (pause, controls, etc.)</p>
                    <p>  - Point + Trigger: Select planets</p>
                    <p>  - L key or VR menu: Toggle laser pointers for better immersion</p>
                    
                    <h3>💡 Tips</h3>
                    <p>💡 Increase brightness to see dark sides of planets</p>
                    <p>💡 Use speed slider to watch orbits in fast-forward</p>
                    <p>💡 Click objects directly or use the explorer panel</p>
                    <p>💡 Zoom in close to see surface details and textures</p>
                    <p>💡 Rotate around objects to view from all angles</p>
                    
                    <h3>⚡ Performance</h3>
                    <p>⚡ Optimized for 60 FPS on modern devices</p>
                    <p>⚡ Adaptive quality for mobile devices</p>
                    <p>⚡ Hardware-accelerated WebGL rendering</p>
                    <p>⚡ Press <span class="keyboard-shortcut">F</span> to show FPS counter</p>
                    
                    <h3>🚀 Explore the Solar System!</h3>
                    <p>🪐 Navigate through our solar system</p>
                    <p>☀️ Learn about the Sun, planets, moons, and more</p>
                    <p>🌍 Discover fascinating facts about each celestial body</p>
                `);
            }, { passive: true });
        }
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup FPS counter
        this.setupFPSCounter();
    }
    
    setupControls() {
        // Time speed control (dropdown selector)
        const timeSpeedSelect = document.getElementById('time-speed');
        if (timeSpeedSelect) {
            timeSpeedSelect.addEventListener('change', (e) => {
                this.timeSpeed = parseFloat(e.target.value);
                console.log(`⏱️ Speed mode changed to: ${e.target.options[e.target.selectedIndex].text} (${this.timeSpeed}x)`);
            });
            
            // Set initial speed
            this.timeSpeed = parseFloat(timeSpeedSelect.value);
        }
        
        // Orbit toggle button
        const orbitsButton = document.getElementById('toggle-orbits');
        if (orbitsButton) {
            orbitsButton.addEventListener('click', () => {
                if (this.solarSystemModule) {
                    const visible = !this.solarSystemModule.orbitsVisible;
                    this.solarSystemModule.toggleOrbits(visible);
                    orbitsButton.classList.toggle('toggle-on', visible);
                    console.log(`🛤️ Orbits toggled: ${visible ? 'ON' : 'OFF'}`);
                }
            });
        }

        // Scale toggle button
        const scaleButton = document.getElementById('toggle-scale');
        if (scaleButton) {
            scaleButton.addEventListener('click', () => {
                if (this.solarSystemModule) {
                    this.solarSystemModule.realisticScale = !this.solarSystemModule.realisticScale;
                    scaleButton.classList.toggle('active');
                    scaleButton.textContent = this.solarSystemModule.realisticScale ? 
                        '📏 Realistic Scale' : '📏 Educational Scale';
                    
                    // Recalculate positions with new scale
                    this.solarSystemModule.updateScale();
                }
            });
        }
        
        // Labels toggle button
        const labelsButton = document.getElementById('toggle-details');
        if (labelsButton) {
            labelsButton.textContent = '📊 Labels OFF';
            labelsButton.classList.remove('toggle-on');
            
            labelsButton.addEventListener('click', () => {
                if (this.solarSystemModule && this.solarSystemModule.toggleLabels) {
                    if (this.sceneManager) {
                        this.sceneManager.labelsVisible = !this.sceneManager.labelsVisible;
                        this.solarSystemModule.toggleLabels(this.sceneManager.labelsVisible);
                        labelsButton.classList.toggle('toggle-on', this.sceneManager.labelsVisible);
                        labelsButton.textContent = this.sceneManager.labelsVisible ? 
                            '📊 Labels ON' : '📊 Labels OFF';
                        console.log(`🏷️ Labels toggled: ${this.sceneManager.labelsVisible ? 'ON' : 'OFF'}`);
                    }
                }
            });
        }
        
        // Reset view button
        const resetButton = document.getElementById('reset-view');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (this.solarSystemModule) {
                    this.solarSystemModule.focusedObject = null;
                }
                this.sceneManager.resetCamera();
            });
        }

        // Apollo 11 Mission button
        const apolloButton = document.getElementById('apollo-button');
        if (apolloButton) {
            apolloButton.addEventListener('click', () => {
                if (this.apollo11Animation) {
                    if (!this.apollo11Animation.isActive) {
                        apolloButton.style.background = 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)';
                        apolloButton.innerHTML = '⏹️ Stop Mission';
                        this.apollo11Animation.start();
                    } else {
                        apolloButton.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
                        apolloButton.innerHTML = '🚀 Apollo 11 Mission';
                        this.apollo11Animation.stop();
                    }
                }
            });
            
            // Hover effects
            apolloButton.addEventListener('mouseenter', () => {
                apolloButton.style.transform = 'scale(1.05)';
                apolloButton.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.4)';
            });
            apolloButton.addEventListener('mouseleave', () => {
                apolloButton.style.transform = 'scale(1)';
                apolloButton.style.boxShadow = 'none';
            });
        }
        
        // Canvas click for object selection
        this.sceneManager.renderer.domElement.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
    }
    
    handleCanvasClick(event) {
        console.log('🖱️ Canvas clicked!');
        if (!this.solarSystemModule) {
            console.warn('❌ No solar system module!');
            return;
        }
        
        console.log(`🔍 Checking ${this.solarSystemModule.objects.length} objects for intersection...`);
        
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.sceneManager.raycaster.setFromCamera(mouse, this.sceneManager.camera);
        const intersects = this.sceneManager.raycaster.intersectObjects(this.solarSystemModule.objects, true);

        console.log(`📍 Found ${intersects.length} intersections`);
        if (intersects.length > 0) {
            let target = intersects[0].object;
            while (target.parent && !target.userData.name) {
                target = target.parent;
            }

            if (target.userData && target.userData.name) {
                const info = this.solarSystemModule.getObjectInfo(target);
                this.uiManager.updateInfoPanel(info);
                this.solarSystemModule.focusOnObject(target, this.sceneManager.camera, this.sceneManager.controls);
            }
        }
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
                case 'f':
                    const fpsCounter = document.getElementById('fps-counter');
                    if (fpsCounter) {
                        fpsCounter.classList.toggle('hidden');
                    }
                    break;
                case 'l':
                    // Toggle VR laser pointers (only works in VR)
                    if (this.sceneManager.renderer.xr.isPresenting) {
                        this.sceneManager.lasersVisible = !this.sceneManager.lasersVisible;
                        this.sceneManager.controllers.forEach(controller => {
                            const laser = controller.getObjectByName('laser');
                            const pointer = controller.getObjectByName('pointer');
                            if (laser) laser.visible = this.sceneManager.lasersVisible;
                            if (pointer) pointer.visible = this.sceneManager.lasersVisible;
                        });
                        console.log(`🎯 Laser pointers ${this.sceneManager.lasersVisible ? 'visible' : 'hidden'}`);
                    }
                    break;
                case '+':
                case '=':
                    // Cycle speed modes forward: Paused -> Educational -> Realtime -> Paused
                    const speedSelect = document.getElementById('time-speed');
                    if (speedSelect) {
                        const currentIndex = speedSelect.selectedIndex;
                        const nextIndex = (currentIndex + 1) % speedSelect.options.length;
                        speedSelect.selectedIndex = nextIndex;
                        speedSelect.dispatchEvent(new Event('change'));
                    }
                    break;
                case '-':
                case '_':
                    // Cycle speed modes backward: Realtime -> Educational -> Paused -> Realtime
                    const speedSelectDown = document.getElementById('time-speed');
                    if (speedSelectDown) {
                        const currentIndex = speedSelectDown.selectedIndex;
                        const prevIndex = currentIndex === 0 ? speedSelectDown.options.length - 1 : currentIndex - 1;
                        speedSelectDown.selectedIndex = prevIndex;
                        speedSelectDown.dispatchEvent(new Event('change'));
                    }
                    break;
                case 'escape':
                    this.uiManager.closeInfoPanel();
                    this.uiManager.closeHelpModal();
                    break;
                case ' ':
                case 'space':
                    // SPACE = Toggle between Paused and Educational
                    e.preventDefault();
                    const spaceSpeedSelect = document.getElementById('time-speed');
                    if (spaceSpeedSelect) {
                        if (this.timeSpeed === 0) {
                            // If paused, go to Educational
                            spaceSpeedSelect.value = '1';
                            console.log('▶️ PLAY (Educational Speed)');
                        } else {
                            // If playing, pause
                            spaceSpeedSelect.value = '0';
                            console.log('⏸️ PAUSE');
                        }
                        spaceSpeedSelect.dispatchEvent(new Event('change'));
                    }
                    break;
                case 'i':
                    // Find and focus on ISS
                    if (this.solarSystemModule?.spacecraft) {
                        const iss = this.solarSystemModule.spacecraft.find(s => s.userData.name.includes('ISS'));
                        if (iss) {
                            this.solarSystemModule.focusOnObject(iss, this.sceneManager.camera, this.sceneManager.controls);
                            console.log('🛰️ Focusing on International Space Station');
                        }
                    }
                    break;
                case 'v':
                    // Cycle through Voyager probes
                    if (this.solarSystemModule?.spacecraft) {
                        const voyagers = this.solarSystemModule.spacecraft.filter(s => s.userData.name.includes('Voyager'));
                        if (voyagers.length > 0) {
                            this._voyagerIndex = ((this._voyagerIndex || 0) + 1) % voyagers.length;
                            this.solarSystemModule.focusOnObject(voyagers[this._voyagerIndex], this.sceneManager.camera, this.sceneManager.controls);
                            console.log(`🚀 Focusing on ${voyagers[this._voyagerIndex].userData.name}`);
                        }
                    }
                    break;
                case 'm':
                    // Cycle through Mars rovers
                    if (this.solarSystemModule?.spacecraft) {
                        const rovers = this.solarSystemModule.spacecraft.filter(s => s.userData.type === 'rover');
                        if (rovers.length > 0) {
                            this._roverIndex = ((this._roverIndex || 0) + 1) % rovers.length;
                            this.solarSystemModule.focusOnObject(rovers[this._roverIndex], this.sceneManager.camera, this.sceneManager.controls);
                            console.log(`🚙 Focusing on ${rovers[this._roverIndex].userData.name}`);
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
                            console.log(`??? Focusing on ${probes[this._probeIndex].userData.name}`);
                        }
                    }
                    break;
                case 'l':
                    // Find Apollo 11 landing site
                    if (this.spacecraft) {
                        const apollo = this.spacecraft.find(s => s.userData.name.includes('Apollo'));
                        if (apollo) {
                            this.focusOnObject(apollo, this.camera, this.controls);
                            if (DEBUG.enabled) console.log('?? Focusing on Apollo 11 Landing Site');
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



