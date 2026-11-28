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
     * Several controller changes during one page lifetime should not trigger
     * duplicate reloads. Only controllerchange proves this page is controlled
     * by the new worker; a skipWaiting acknowledgement can arrive earlier.
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
        if (this._updateListenerTarget !== this.registration) {
            this._updateListenerTarget = this.registration;
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                if (!newWorker) return;
                if (DEBUG && DEBUG.enabled) console.log('Service Worker update found');

                const onStateChange = () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                };
                newWorker.addEventListener('statechange', onStateChange);
                onStateChange();
            });
        }
        // The worker may have finished installing before register() or before
        // this page attached its updatefound listener.
        if (this.registration.waiting) this.showUpdateNotification();
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
                    if (DEBUG && DEBUG.enabled) console.log('[SW] Skip waiting requested; awaiting controller change');
                    break;
                case 'SW_CACHE_WRITE_FAILED':
                    // Report storage degradation even when debug logging is disabled.
                    console.warn('[SW] Cache write failed; online response was still served:', msg);
                    break;
                case 'SW_CACHE_READ_FAILED':
                    console.warn('[SW] Cache read failed; falling back to network:', msg);
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
        notification.setAttribute('aria-hidden', 'false');

        const reloadButton = document.getElementById('update-reload');
        const dismissButton = document.getElementById('update-dismiss');
        const cleanup = () => {
            reloadButton?.removeEventListener('click', onReload);
            dismissButton?.removeEventListener('click', onDismiss);
        };
        const onReload = () => {
            cleanup();
            const waiting = this.registration?.waiting;
            if (waiting) {
                waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                window.location.reload();
            }
        };
        const onDismiss = () => {
            cleanup();
            notification.classList.add('hidden');
            notification.setAttribute('aria-hidden', 'true');
            this._updateNotificationShown = false; // Allow showing again for future updates
        };
        reloadButton?.addEventListener('click', onReload);
        dismissButton?.addEventListener('click', onDismiss);
    }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

