// EarthZoomManager.js - Seamless zoom from 3D Earth to OpenStreetMap
// Handles automatic transition between Three.js Earth and Leaflet map view based on camera distance

import * as THREE from 'three';
import { DEBUG } from './utils.js';

class EarthZoomManager {
    constructor() {
        this.map = null;
        this.mapContainer = null;
        this.isMapVisible = false;
        this.isInitialized = false;
        this.earthObject = null;
        this.camera = null;
        this.controls = null;
        this.scene = null;
        
        // Zoom thresholds (in scene units - Earth radius is 1.0)
        // Camera default distance for Earth is ~10 units (5x radius)
        // Start transition only when extremely close to the surface
        this.THRESHOLDS = {
            START_FADE: 2.5,           // Start fading in map overlay (very close to surface)
            FULL_MAP: 1.8,             // Full map view (nearly touching)
            EARTH_RADIUS: 1.0          // Earth radius in scene units
        };
        
        // Current state
        this.currentZoomLevel = 'space';  // 'space', 'transition', 'map'
        this.currentLatLng = { lat: 0, lng: 0 };
        this.transitionProgress = 0;      // 0 = full 3D, 1 = full map

        // Track in-flight animation frame so it can be cancelled
        this._animFrameId = null;
    }
    
    /**
     * Initialize the Earth Zoom Manager
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        this.earthObject = options.earthObject;
        this.camera = options.camera;
        this.controls = options.controls;
        this.scene = options.scene;

        if (!this.earthObject) {
            if (DEBUG && DEBUG.enabled) console.warn('[EarthZoomManager] No Earth object provided');
            return;
        }

        this.createMapContainer();
        this.initLeafletMap();
        this.setupEventListeners();

        this.isInitialized = true;
    }

    /**
     * Create the map container element with transition styling
     */
    createMapContainer() {
        // Create container for Leaflet map (starts invisible with hidden class)
        this.mapContainer = document.createElement('div');
        this.mapContainer.id = 'earth-map-container';
        this.mapContainer.className = 'earth-map-container hidden';
        this.mapContainer.innerHTML = `
            <div class="earth-map-header">
                <span class="earth-map-title">🌍 Earth Surface View</span>
                <div class="earth-map-coords" id="earth-map-coords">0°N, 0°E</div>
                <button class="earth-map-close" id="earth-map-close" title="Return to Space (Escape)">✕</button>
            </div>
            <div id="leaflet-map"></div>
            <div class="earth-map-controls">
                <button id="earth-map-satellite" class="earth-map-btn active" title="Satellite View">🛰️</button>
                <button id="earth-map-terrain" class="earth-map-btn" title="Terrain View">🏔️</button>
                <button id="earth-map-streets" class="earth-map-btn" title="Street Map">🗺️</button>
                <span class="earth-map-zoom-level" id="earth-map-zoom-level">Zoom: 3</span>
            </div>
            <div class="earth-map-hint" id="earth-map-hint">
                <span>🔍 Zoom out or press Escape to return to space</span>
            </div>
        `;
        document.body.appendChild(this.mapContainer);
        
        // Create zoom indicator that shows during transition
        this.zoomIndicator = document.createElement('div');
        this.zoomIndicator.id = 'earth-zoom-indicator';
        this.zoomIndicator.className = 'earth-zoom-indicator';
        this.zoomIndicator.innerHTML = `
            <div class="zoom-progress-ring">
                <svg viewBox="0 0 100 100">
                    <circle class="zoom-progress-bg" cx="50" cy="50" r="45"/>
                    <circle class="zoom-progress-fill" cx="50" cy="50" r="45" id="zoom-progress-circle"/>
                </svg>
                <span class="zoom-progress-text" id="zoom-progress-text">🌍</span>
            </div>
            <div class="zoom-progress-label" id="zoom-progress-label">Approaching Earth...</div>
        `;
        document.body.appendChild(this.zoomIndicator);
    }
    
    /**
     * Initialize Leaflet map
     */
    initLeafletMap() {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            if (DEBUG && DEBUG.enabled) console.warn('[EarthZoomManager] Leaflet not loaded yet, deferring initialization');
            return;
        }
        
        // Create map instance
        this.map = L.map('leaflet-map', {
            center: [0, 0],
            zoom: 3,
            minZoom: 2,
            maxZoom: 19,
            zoomControl: true,
            attributionControl: true
        });
        
        // Define tile layers
        this.tileLayers = {
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy; Esri, Maxar, Earthstar Geographics',
                maxZoom: 19
            }),
            terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenTopoMap contributors',
                maxZoom: 17
            }),
            streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            })
        };
        
        // Set default layer
        this.currentTileLayer = 'satellite';
        this.tileLayers.satellite.addTo(this.map);
        
        // Update coordinates display on map move
        this.map.on('move', () => this.updateCoordsDisplay());
        this.map.on('zoomend', () => this.updateZoomDisplay());
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        document.getElementById('earth-map-close')?.addEventListener('click', () => {
            this.zoomOutFromMap();
        });
        
        // Tile layer buttons
        document.getElementById('earth-map-satellite')?.addEventListener('click', () => {
            this.switchTileLayer('satellite');
        });
        document.getElementById('earth-map-terrain')?.addEventListener('click', () => {
            this.switchTileLayer('terrain');
        });
        document.getElementById('earth-map-streets')?.addEventListener('click', () => {
            this.switchTileLayer('streets');
        });
        
        // Keyboard shortcut (Escape to close)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMapVisible) {
                this.zoomOutFromMap();
            }
        });
        
        // Listen for mouse wheel to detect zoom out while in map
        this.mapContainer.addEventListener('wheel', (e) => {
            // If scrolling up (zoom out) at minimum map zoom, transition back to 3D
            if (this.map && e.deltaY > 0 && this.map.getZoom() <= this.map.getMinZoom()) {
                e.preventDefault();
                this.zoomOutFromMap();
            }
        }, { passive: false });
    }
    
    /**
     * Zoom out from map back to 3D Earth view
     */
    zoomOutFromMap() {
        if (!this.controls || !this.earthObject) return;
        
        // Animate camera back
        const earthPos = this.earthObject.position.clone();
        const targetDistance = this.THRESHOLDS.START_FADE + 2;
        
        // Calculate target camera position (move away from Earth)
        const direction = this.camera.position.clone().sub(earthPos).normalize();
        const targetPosition = earthPos.clone().add(direction.multiplyScalar(targetDistance + this.THRESHOLDS.EARTH_RADIUS));
        
        // Smoothly move camera
        this.animateCameraTo(targetPosition, earthPos, 1000);
        
        if (DEBUG && DEBUG.enabled) console.log('[EarthZoomManager] Zooming out from map');
    }
    
    /**
     * Animate camera to a target position (cancels any in-flight animation)
     * @param {THREE.Vector3} targetPosition
     * @param {THREE.Vector3} lookAt
     * @param {number} duration - milliseconds
     */
    animateCameraTo(targetPosition, lookAt, duration = 1000) {
        // Cancel any previous animation
        if (this._animFrameId !== null) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }

        const startPosition = this.camera.position.clone();
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            // Interpolate position
            this.camera.position.lerpVectors(startPosition, targetPosition, eased);

            // Update controls target
            if (this.controls) {
                this.controls.target.copy(lookAt);
                this.controls.update();
            }

            if (progress < 1) {
                this._animFrameId = requestAnimationFrame(animate);
            } else {
                this._animFrameId = null;
            }
        };

        this._animFrameId = requestAnimationFrame(animate);
    }

    /**
     * Switch tile layer
     * @param {string} layerName - Layer name ('satellite', 'terrain', 'streets')
     */
    switchTileLayer(layerName) {
        if (!this.map || !this.tileLayers[layerName]) return;
        
        // Remove current layer
        if (this.tileLayers[this.currentTileLayer]) {
            this.map.removeLayer(this.tileLayers[this.currentTileLayer]);
        }
        
        // Add new layer
        this.tileLayers[layerName].addTo(this.map);
        this.currentTileLayer = layerName;
        
        // Update button states
        document.querySelectorAll('.earth-map-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`earth-map-${layerName}`)?.classList.add('active');
    }
    
    /**
     * Convert UV coordinates on Earth sphere to lat/lng
     * @param {Object} uv - UV coordinates {u, v}
     * @returns {Object} - {lat, lng}
     */
    uvToLatLng(uv) {
        // UV coordinates: u = 0-1 (longitude), v = 0-1 (latitude)
        // Longitude: 0 = -180°, 1 = 180°
        // Latitude: 0 = -90° (south pole), 1 = 90° (north pole)
        const lng = (uv.u * 360) - 180;
        const lat = (uv.v * 180) - 90;
        return { lat, lng };
    }
    
    /**
     * Convert 3D point on Earth to lat/lng
     * Accounts for Earth's rotation to map correctly to real-world coordinates
     * @param {THREE.Vector3} point - Point on Earth surface
     * @returns {Object} - {lat, lng}
     */
    pointToLatLng(point) {
        if (!this.earthObject) return { lat: 0, lng: 0 };
        
        // Get local coordinates relative to Earth center
        const earthPos = this.earthObject.position;
        const localPoint = point.clone().sub(earthPos);
        
        // Account for Earth's rotation - transform point into Earth's local space
        // Create inverse rotation matrix from Earth's rotation
        const earthRotation = this.earthObject.rotation.y;
        const cosR = Math.cos(-earthRotation);
        const sinR = Math.sin(-earthRotation);
        
        // Rotate the local point back by Earth's rotation (around Y axis)
        const rotatedX = localPoint.x * cosR - localPoint.z * sinR;
        const rotatedZ = localPoint.x * sinR + localPoint.z * cosR;
        const rotatedY = localPoint.y;
        
        // Normalize to get direction
        const length = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY + rotatedZ * rotatedZ);
        const nx = rotatedX / length;
        const ny = rotatedY / length;
        const nz = rotatedZ / length;
        
        // Convert to spherical coordinates (Three.js uses Y-up)
        // Latitude: angle from equator (-90 to 90)
        const lat = Math.asin(ny) * (180 / Math.PI);
        
        // Longitude: angle around Y axis (-180 to 180)
        // Standard Earth texture mapping: +X = 0°, +Z = 90°E (or -90°W)
        let lng = Math.atan2(nx, nz) * (180 / Math.PI);
        
        return { lat, lng };
    }
    
    /**
     * Get lat/lng that camera is looking at on Earth
     * Uses ray-sphere intersection to find the exact point on Earth's surface
     * @returns {Object} - {lat, lng}
     */
    getCameraLookAtLatLng() {
        if (!this.camera || !this.earthObject) return { lat: 0, lng: 0 };
        
        const earthPos = this.earthObject.position;
        const earthRadius = this.THRESHOLDS.EARTH_RADIUS;
        
        // Get camera's look direction (center of screen)
        const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const cameraPos = this.camera.position.clone();
        
        // Ray-sphere intersection
        // Ray: P = cameraPos + t * cameraDir
        // Sphere: |P - earthPos|^2 = earthRadius^2
        const oc = cameraPos.clone().sub(earthPos);
        const a = cameraDir.dot(cameraDir);
        const b = 2.0 * oc.dot(cameraDir);
        const c = oc.dot(oc) - earthRadius * earthRadius;
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            // Ray doesn't intersect Earth, use direction to center as fallback
            const direction = earthPos.clone().sub(cameraPos).normalize();
            const surfacePoint = earthPos.clone().add(direction.multiplyScalar(-earthRadius));
            return this.pointToLatLng(surfacePoint);
        }
        
        // Find the nearest intersection point (front of sphere)
        const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
        const intersectionPoint = cameraPos.clone().add(cameraDir.clone().multiplyScalar(t));
        
        return this.pointToLatLng(intersectionPoint);
    }
    
    /**
     * Update map position based on camera view
     */
    updateMapFromCamera() {
        if (!this.map || !this.isMapVisible) return;
        
        const { lat, lng } = this.getCameraLookAtLatLng();
        
        // Only update if significantly changed
        const currentCenter = this.map.getCenter();
        const distance = Math.sqrt(
            Math.pow(currentCenter.lat - lat, 2) + 
            Math.pow(currentCenter.lng - lng, 2)
        );
        
        if (distance > 5) { // Only update if moved more than 5 degrees
            this.map.setView([lat, lng], this.map.getZoom(), { animate: false });
        }
    }
    
    /**
     * Calculate map zoom level based on camera surface distance
     * @param {number} surfaceDist - Distance from camera to Earth surface (center dist − radius)
     * @returns {number} - Leaflet zoom level (1 = whole Earth, 12 = city level)
     */
    calculateMapZoom(surfaceDist) {
        // Convert centre-distance thresholds to surface-distance thresholds
        const startFadeSurf = this.THRESHOLDS.START_FADE - this.THRESHOLDS.EARTH_RADIUS; // 1.5
        const fullMapSurf   = this.THRESHOLDS.FULL_MAP   - this.THRESHOLDS.EARTH_RADIUS; // 0.8
        const range = startFadeSurf - fullMapSurf; // 0.7
        // t = 0 when camera is at START_FADE surface distance, 1 when at FULL_MAP
        const t = 1 - Math.min(Math.max((surfaceDist - fullMapSurf) / range, 0), 1);
        return Math.round(1 + t * 11);
    }
    
    /**
     * Main update function - call this every frame for seamless transitions
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.earthObject || !this.camera) {
            // Safety: always ensure controls are enabled if we can't run
            if (this.controls) this.controls.enabled = true;
            return;
        }
        
        // SAFETY: Always ensure controls are enabled by default
        // Will be disabled only at end of updateTransitionUI if needed
        if (this.controls && !this.controls.enabled && this.transitionProgress < 0.99) {
            if (DEBUG && DEBUG.enabled) console.log('[EarthZoomManager] Safety: Re-enabling stuck controls');
            this.controls.enabled = true;
        }
        
        // Get distance from camera to Earth center
        const earthPos = this.earthObject.position;
        const cameraDistance = this.camera.position.distanceTo(earthPos);
        const surfaceDistance = cameraDistance - this.THRESHOLDS.EARTH_RADIUS;
        
        // Check if camera is looking at Earth (using controls target for accuracy)
        let lookingAtEarth = false;
        if (this.controls && this.controls.target) {
            // Check if controls are targeting Earth (within Earth's radius)
            const targetToEarth = this.controls.target.distanceTo(earthPos);
            lookingAtEarth = targetToEarth < this.THRESHOLDS.EARTH_RADIUS * 2;
        }
        
        // Determine transition progress (0 = space view, 1 = full map)
        let targetProgress = 0;
        
        // Only trigger transition when BOTH looking at Earth AND very close
        if (lookingAtEarth && surfaceDistance < this.THRESHOLDS.START_FADE) {
            if (surfaceDistance <= this.THRESHOLDS.FULL_MAP) {
                targetProgress = 1;
            } else {
                // Gradual transition between START_FADE and FULL_MAP
                const range = this.THRESHOLDS.START_FADE - this.THRESHOLDS.FULL_MAP;
                targetProgress = 1 - ((surfaceDistance - this.THRESHOLDS.FULL_MAP) / range);
            }
        }
        
        // Smooth the transition (faster when zooming out)
        const transitionSpeed = targetProgress < this.transitionProgress ? 5.0 : 3.0;
        this.transitionProgress += (targetProgress - this.transitionProgress) * Math.min(deltaTime * transitionSpeed, 1);
        
        // Clamp to prevent floating point issues
        if (this.transitionProgress < 0.01) this.transitionProgress = 0;
        if (this.transitionProgress > 0.99) this.transitionProgress = 1;
        
        // Update UI based on transition progress
        this.updateTransitionUI(surfaceDistance);
        
        // Update zoom indicator
        this.updateZoomIndicator(surfaceDistance, targetProgress);
    }
    
    /**
     * Update UI elements during transition
     * @param {number} surfaceDistance - Distance from Earth surface
     */
    updateTransitionUI(surfaceDistance) {
        const progress = this.transitionProgress;
        
        // NOTE: Controls enable/disable is handled at the END of this function
        // to ensure we always have a single point of truth
        
        // Update map container opacity and visibility
        if (progress > 0) {
            this.mapContainer.style.opacity = progress.toString();
            this.mapContainer.style.pointerEvents = progress > 0.3 ? 'auto' : 'none';
            this.mapContainer.classList.remove('hidden');
            this.currentZoomLevel = progress < 0.99 ? 'transition' : 'map';

            if (!this.isMapVisible && progress > 0.5) {
                this.isMapVisible = true;
                
                // Force map to recalculate its size after becoming visible
                setTimeout(() => {
                    this.map?.invalidateSize();
                }, 100);
                
                // Set initial map position
                const { lat, lng } = this.getCameraLookAtLatLng();
                const zoom = this.calculateMapZoom(surfaceDistance);
                this.map?.setView([lat, lng], zoom);
                
                this.updateCoordsDisplay();
                this.updateZoomDisplay();
                
                if (DEBUG && DEBUG.enabled) console.log(`[EarthZoomManager] Map visible at ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
            }
        } else {
            this.mapContainer.style.opacity = '0';
            this.mapContainer.style.pointerEvents = 'none';
            
            if (this.isMapVisible) {
                this.isMapVisible = false;
                this.currentZoomLevel = 'space';
                if (DEBUG && DEBUG.enabled) console.log('[EarthZoomManager] Map hidden');
            }
        }
        
        // CRITICAL: Always ensure controls match the expected state
        // Only disable when fully in map view (progress >= 0.99)
        if (this.controls) {
            const shouldBeEnabled = progress < 0.99;
            if (this.controls.enabled !== shouldBeEnabled) {
                this.controls.enabled = shouldBeEnabled;
                if (DEBUG && DEBUG.enabled) console.log(`[EarthZoomManager] Controls ${shouldBeEnabled ? 'enabled' : 'disabled'}, progress: ${progress.toFixed(2)}`);
            }
        }
        
        // Update map zoom level based on camera distance
        if (this.isMapVisible && this.map) {
            const targetZoom = this.calculateMapZoom(surfaceDistance);
            const currentZoom = this.map.getZoom();
            
            if (Math.abs(targetZoom - currentZoom) >= 1) {
                this.map.setZoom(targetZoom, { animate: false });
            }
            
            // Update map center
            this.updateMapFromCamera();
        }
    }
    
    /**
     * Update the zoom indicator during approach
     * @param {number} surfaceDistance - Distance from Earth surface
     * @param {number} targetProgress - Target transition progress
     */
    updateZoomIndicator(surfaceDistance, targetProgress) {
        const indicator = this.zoomIndicator;
        if (!indicator) return;
        
        // Show indicator during transition (but not at full map)
        if (targetProgress > 0 && targetProgress < 1) {
            indicator.classList.add('visible');
            
            // Update progress ring
            const circle = document.getElementById('zoom-progress-circle');
            if (circle) {
                const circumference = 2 * Math.PI * 45;
                const offset = circumference * (1 - targetProgress);
                circle.style.strokeDasharray = `${circumference}`;
                circle.style.strokeDashoffset = `${offset}`;
            }
            
            // Update label
            const label = document.getElementById('zoom-progress-label');
            if (label) {
                const percent = Math.round(targetProgress * 100);
                label.textContent = `Approaching Earth... ${percent}%`;
            }
        } else {
            indicator.classList.remove('visible');
        }
    }

    /**
     * Imperatively show the map at specific coordinates.
     * Uses the same opacity-driven container as the automatic transition.
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Initial zoom level
     */
    showMap(lat = 0, lng = 0, zoom = 5) {
        if (!this.map) {
            this.initLeafletMap();
            if (!this.map) {
                if (DEBUG && DEBUG.enabled) console.error('[EarthZoomManager] Cannot show map - Leaflet not initialized');
                return;
            }
        }

        this.currentLatLng = { lat, lng };
        this.transitionProgress = 1;
        this.currentZoomLevel = 'map';

        this.mapContainer.classList.remove('hidden');
        this.mapContainer.style.opacity = '1';
        this.mapContainer.style.pointerEvents = 'auto';
        this.isMapVisible = true;

        this.map.setView([lat, lng], zoom);

        // Force map resize after container becomes visible
        setTimeout(() => {
            this.map?.invalidateSize();
            this.updateCoordsDisplay();
            this.updateZoomDisplay();
        }, 100);

        if (DEBUG && DEBUG.enabled) console.log(`[EarthZoomManager] Showing map at ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
    }

    /**
     * Hide map and return to 3D view
     */
    hideMap() {
        this.zoomOutFromMap();
        if (DEBUG && DEBUG.enabled) console.log('[EarthZoomManager] Returning to space view');
    }
    
    /**
     * Update coordinates display
     */
    updateCoordsDisplay() {
        if (!this.map) return;
        
        const center = this.map.getCenter();
        const latDir = center.lat >= 0 ? 'N' : 'S';
        const lngDir = center.lng >= 0 ? 'E' : 'W';
        
        const coordsEl = document.getElementById('earth-map-coords');
        if (coordsEl) {
            coordsEl.textContent = `${Math.abs(center.lat).toFixed(2)}°${latDir}, ${Math.abs(center.lng).toFixed(2)}°${lngDir}`;
        }
    }
    
    /**
     * Update zoom level display
     */
    updateZoomDisplay() {
        if (!this.map) return;
        
        const zoomEl = document.getElementById('earth-map-zoom-level');
        if (zoomEl) {
            zoomEl.textContent = `Zoom: ${this.map.getZoom()}`;
        }
    }
    
    /**
     * Handle click on Earth in 3D view (for quick jump to location)
     * @param {Object} intersection - Three.js raycaster intersection
     */
    handleEarthClick(intersection) {
        if (!intersection || !intersection.point) return;
        
        // Convert click point to lat/lng
        const { lat, lng } = this.pointToLatLng(intersection.point);
        
        // If already in map view, just pan to location
        if (this.isMapVisible && this.map) {
            this.map.setView([lat, lng], Math.max(this.map.getZoom(), 8), { animate: true });
            return;
        }
        
        // Zoom camera toward click point
        this.zoomToLocation(intersection.point, lat, lng);
    }
    
    /**
     * Zoom camera to a specific point on Earth
     * @param {THREE.Vector3} point - Point on Earth surface
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    zoomToLocation(point, lat, lng) {
        if (!this.camera || !this.controls || !this.earthObject) return;
        
        const earthPos = this.earthObject.position;
        
        // Calculate target camera position (close to surface, looking at point)
        const direction = point.clone().sub(earthPos).normalize();
        const targetDistance = this.THRESHOLDS.FULL_MAP + 0.2;
        const targetPosition = earthPos.clone().add(direction.multiplyScalar(this.THRESHOLDS.EARTH_RADIUS + targetDistance));
        
        // Animate to position
        this.animateCameraTo(targetPosition, point, 1500);
        
        // Set map view to location
        if (this.map) {
            setTimeout(() => {
                this.map.setView([lat, lng], 8);
            }, 1000);
        }
        
        if (DEBUG && DEBUG.enabled) console.log(`[EarthZoomManager] Zooming to ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
    }
    
    /**
     * Check if map is currently visible
     * @returns {boolean}
     */
    isActive() {
        return this.isMapVisible;
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        if (this._animFrameId !== null) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }

        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        this.mapContainer?.remove();
        this.zoomIndicator?.remove();
    }
}

// Export singleton instance
export const earthZoomManager = new EarthZoomManager();
