/**
 * ServiceWorkerManager - Handles service worker registration, updates, and messaging
 * Manages PWA caching and offline functionality
 */
import { DEBUG } from './utils.js';

export class ServiceWorkerManager {
    constructor() {
        this.registration = null;
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
            this.setupControllerChangeListener();
            this.setupMessageListener();
            
        } catch (error) {
            if (DEBUG && DEBUG.enabled) console.warn('Service Worker registration failed:', error);
        }
    }

    /**
     * Setup update detection
     */
    setupUpdateListener() {
        if (!this.registration) return;

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
                    window.location.reload();
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
        
        notification.classList.remove('hidden');
        
        // Update button - request immediate activation
        document.getElementById('update-reload')?.addEventListener('click', () => {
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            } else {
                window.location.reload();
            }
        }, { once: true });
        
        // Dismiss button
        document.getElementById('update-dismiss')?.addEventListener('click', () => {
            notification.classList.add('hidden');
        }, { once: true });
    }

    /**
     * Send message to service worker
     */
    sendMessage(message) {
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage(message);
        }
    }

    /**
     * Get registration object
     */
    getRegistration() {
        return this.registration;
    }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
