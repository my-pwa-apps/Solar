/**
 * ServiceWorkerManager - Handles service worker registration, updates, and messaging
 * Manages PWA caching and offline functionality
 */
import { DEBUG } from './utils.js';

export class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this._listenersBound = false;
        this._reloadTriggered = false;
    }

    /**
     * Reload exactly once.
     *
     * Activating a waiting worker fires BOTH `controllerchange` and the worker's
     * own SW_SKIP_WAITING_COMPLETE broadcast. Each used to call reload()
     * independently, so clicking "Update" reloaded the page twice — the second
     * reload landing mid-boot of the first.
     */
    _reloadOnce() {
        if (this._reloadTriggered) return;
        this._reloadTriggered = true;
        window.location.reload();
    }

    /**
     * Initialize service worker if supported
     */
    async init() {
        if (!('serviceWorker' in navigator)) {
            if (DEBUG && DEBUG.enabled) console.warn('Service Workers not supported in this browser');
            return;
        }

        // Handle case where load event already fired
        if (document.readyState === 'complete') {
            await this.register();
        } else {
            window.addEventListener('load', async () => {
                await this.register();
            });
        }
    }

    /**
     * Register service worker
     */
    async register() {
        try {
            this.registration = await navigator.serviceWorker.register('./sw.js', {
                scope: './'
            });
            
            if (DEBUG && DEBUG.enabled) console.log('Service Worker registered successfully:', this.registration.scope);
            
            this.setupUpdateListener();
            // Bound to navigator.serviceWorker rather than the registration, so they
            // must survive (and not be duplicated by) a repeated register() call.
            if (!this._listenersBound) {
                this._listenersBound = true;
                this.setupControllerChangeListener();
                this.setupMessageListener();
            }
            
        } catch (error) {
            if (DEBUG && DEBUG.enabled) console.warn('Service Worker registration failed:', error);
        }
    }

    /**
     * Setup update detection
     */
    setupUpdateListener() {
        if (!this.registration) return;
        // register() resolves to the same registration object for a given scope,
        // so a retry would otherwise stack a second 'updatefound' handler.
        if (this._updateListenerTarget === this.registration) return;
        this._updateListenerTarget = this.registration;

        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            if (DEBUG && DEBUG.enabled) console.log('Service Worker update found');
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Show update notification
                    this.showUpdateNotification();
                }
            });
        });
    }

    /**
     * Setup controller change listener
     */
    setupControllerChangeListener() {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (DEBUG && DEBUG.enabled) console.log('New Service Worker activated');
            this._reloadOnce();
        });
    }

    /**
     * Setup message listener for SW communication
     */
    setupMessageListener() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const msg = event.data;
            if (!msg || !msg.type) return;
            
            switch (msg.type) {
                case 'SW_INSTALLED':
                    if (DEBUG && DEBUG.enabled) console.log('[SW] Installed version', msg.version);
                    break;
                case 'SW_ACTIVATED':
                    if (DEBUG && DEBUG.enabled) console.log('[SW] Activated version', msg.version);
                    break;
                case 'SW_SKIP_WAITING_COMPLETE':
                    if (DEBUG && DEBUG.enabled) console.log('[SW] Skip waiting complete; reloading');
                    this._reloadOnce();
                    break;
            }
        });
    }

    /**
     * Show update notification UI
     */
    showUpdateNotification() {
        const notification = document.getElementById('update-notification');
        if (!notification) return;
        
        // Guard against stacking listeners from repeated calls
        if (this._updateNotificationShown) return;
        this._updateNotificationShown = true;
        
        notification.classList.remove('hidden');
        
        // Update button - request the waiting worker to activate
        document.getElementById('update-reload')?.addEventListener('click', () => {
            const waiting = this.registration?.waiting;
            if (waiting) {
                waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                window.location.reload();
            }
        }, { once: true });
        
        // Dismiss button
        document.getElementById('update-dismiss')?.addEventListener('click', () => {
            notification.classList.add('hidden');
            this._updateNotificationShown = false; // Allow showing again for future updates
        }, { once: true });
    }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

