/**
 * ServiceWorkerManager - Handles service worker registration, updates, and messaging
 * Manages PWA caching and offline functionality
 */
import { DEBUG } from './utils.js';

const t = (key) => (window.t || ((value) => value))(key);

export class ServiceWorkerManager {
    constructor({ reloadPage = () => window.location.reload() } = {}) {
        this.registration = null;
        this._listenersBound = false;
        this._reloadTriggered = false;
        this._reloadPage = reloadPage;
        this.activeVersion = null;
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
        this._reloadPage();
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
        if (this.registration.waiting && navigator.serviceWorker.controller) {
            this.showUpdateNotification();
        }
        // register() resolves to the same registration object for a given scope,
        // so a retry would otherwise stack a second 'updatefound' handler.
        if (this._updateListenerTarget === this.registration) return;
        this._updateListenerTarget = this.registration;

        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            if (!newWorker) return;
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
        let hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (DEBUG && DEBUG.enabled) console.log('New Service Worker activated');
            if (!hadController) {
                hadController = true;
                return;
            }
            this._reloadOnce();
        });
    }

    /**
     * Setup message listener for SW communication
     */
    setupMessageListener() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleMessage(event.data);
        });
    }

    handleMessage(msg) {
        if (!msg || !msg.type) return;

        switch (msg.type) {
            case 'SW_INSTALLED':
                if (DEBUG && DEBUG.enabled) console.log('[SW] Installed version', msg.version);
                break;
            case 'SW_ACTIVATED':
                this.activeVersion = msg.version || null;
                if (DEBUG && DEBUG.enabled) console.log('[SW] Activated version', msg.version);
                break;
            case 'SW_SKIP_WAITING_COMPLETE':
                if (DEBUG && DEBUG.enabled) console.log('[SW] Activation requested; waiting for controllerchange');
                break;
            case 'SW_INSTALL_FAILED':
                console.error('[SW] Offline setup failed:', msg.message || 'Unknown error');
                this.showInstallFailure();
                break;
            case 'SW_STORAGE_STATUS':
                this.storageStatus = msg.storage || null;
                break;
            case 'SW_QUOTA_EXCEEDED':
                this.storageStatus = msg.storage || null;
                console.warn('[SW] Storage quota exhausted; continuing without caching');
                this.showStoragePressure();
                break;
        }
    }

    /**
     * Show update notification UI
     */
    showUpdateNotification() {
        this._showNotification({
            message: t('updateAvailable'),
            icon: '🔄',
            actionLabel: t('update'),
            onAction: () => {
                const waiting = this.registration?.waiting;
                if (waiting) {
                    waiting.postMessage({ type: 'SKIP_WAITING' });
                } else {
                    window.location.reload();
                }
            }
        });
    }

    showInstallFailure() {
        this._showNotification({
            message: t('offlineSetupFailed'),
            icon: '⚠',
            actionLabel: t('errorReload'),
            onAction: () => window.location.reload()
        });
    }

    showStoragePressure() {
        this._showNotification({
            message: t('storagePressure'),
            icon: '⚠',
            actionLabel: t('errorReload'),
            onAction: () => this._reloadPage()
        });
    }

    _showNotification({ message, icon, actionLabel, onAction }) {
        const notification = document.getElementById('update-notification');
        if (!notification) return;

        // Guard against stacking listeners from repeated calls
        if (this._updateNotificationShown) return;
        this._updateNotificationShown = true;
        this._notificationListeners?.abort();
        this._notificationListeners = new AbortController();
        const { signal } = this._notificationListeners;

        this._notificationPreviousFocus = document.activeElement;
        const messageElement = notification.querySelector('.update-text');
        const iconElement = notification.querySelector('.update-icon');
        const actionButton = document.getElementById('update-reload');
        if (messageElement) messageElement.textContent = message;
        if (iconElement) iconElement.textContent = icon;
        if (actionButton) actionButton.textContent = actionLabel;

        notification.classList.remove('hidden');
        notification.setAttribute('aria-hidden', 'false');
        actionButton?.focus();

        actionButton?.addEventListener('click', () => {
            this._notificationListeners.abort();
            onAction();
        }, { once: true, signal });

        // Dismiss button
        document.getElementById('update-dismiss')?.addEventListener('click', () => {
            this._notificationListeners.abort();
            notification.classList.add('hidden');
            notification.setAttribute('aria-hidden', 'true');
            this._updateNotificationShown = false; // Allow showing again for future updates
            if (this._notificationPreviousFocus instanceof HTMLElement) {
                this._notificationPreviousFocus.focus();
            }
        }, { once: true, signal });
    }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

