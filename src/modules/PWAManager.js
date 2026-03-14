/**
 * PWAManager - Handles Progressive Web App functionality
 * Manages installation prompts, offline detection, shortcuts, and platform-specific behaviors
 */
import { DEBUG } from './utils.js';

export class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.installPromptShown = false;
        this.INSTALL_DELAY_MS = 30000; // 30s delay before auto showing prompt (desktop)
        this.INSTALL_DELAY_ANDROID_MS = 10000; // 10s delay for Android
        
        // Platform detection
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        this.platform = {
            isIOS: /iPhone|iPad|iPod/i.test(ua) && !window.MSStream,
            isAndroid: /Android/i.test(ua),
            isWindows: /Windows NT/i.test(ua),
            isEdge: /Edg\//i.test(ua),
            isSafari: /^((?!chrome|android).)*safari/i.test(ua)
        };
    }

    /**
     * Initialize PWA functionality
     */
    init() {
        this.setupOfflineDetection();
        this.setupInstallPrompt();
        this.handleURLShortcuts();
        this.handlePWAMode();
    }

    /**
     * Check if running as installed PWA
     */
    isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    /**
     * Setup offline/online detection
     */
    setupOfflineDetection() {
        const updateOnlineStatus = () => {
            const offlineIndicator = document.getElementById('offline-indicator');
            if (!offlineIndicator) return;
            
            if (!navigator.onLine) {
                offlineIndicator.classList.remove('hidden');
            } else {
                offlineIndicator.classList.add('hidden');
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        // Check initial status immediately if page already loaded, else wait for load
        if (document.readyState === 'complete') {
            updateOnlineStatus();
        } else {
            window.addEventListener('load', updateOnlineStatus);
        }
    }

    /**
     * Check if app is already installed via getInstalledRelatedApps API.
     * Detects Windows Store installs and PWA installs from Edge.
     */
    async isAppAlreadyInstalled() {
        if (!('getInstalledRelatedApps' in navigator)) return false;
        try {
            const relatedApps = await navigator.getInstalledRelatedApps();
            if (relatedApps.length > 0) {
                if (DEBUG && DEBUG.enabled) {
                    console.log('[PWA] Related apps found:', relatedApps.map(a => `${a.platform}:${a.id || a.url}`));
                }
                return true;
            }
        } catch (e) {
            if (DEBUG && DEBUG.enabled) console.warn('[PWA] getInstalledRelatedApps() failed:', e);
        }
        return false;
    }

    /**
     * Schedule the install prompt with platform-appropriate delay.
     * Called when we have a valid deferred prompt and want to show it.
     */
    scheduleInstallPrompt() {
        if (localStorage.getItem('installPromptDismissed')) return;
        const delay = this.platform.isAndroid ? this.INSTALL_DELAY_ANDROID_MS : this.INSTALL_DELAY_MS;
        if (DEBUG && DEBUG.enabled) console.log(`[PWA] Scheduling install prompt in ${delay}ms`);
        setTimeout(() => this.showInstallPrompt(), delay);
    }

    /**
     * Process a beforeinstallprompt event (whether captured early or via listener).
     */
    async processInstallPromptEvent(e) {
        if (DEBUG && DEBUG.enabled) console.log('[PWA] Processing beforeinstallprompt event');
        this.deferredPrompt = e;

        if (this.isPWA()) {
            if (DEBUG && DEBUG.enabled) console.log('[PWA] Already running as installed PWA, skipping prompt');
            return;
        }

        // On Windows, check if app is already installed from the Windows Store
        if (this.platform.isWindows || this.platform.isEdge) {
            const alreadyInstalled = await this.isAppAlreadyInstalled();
            if (alreadyInstalled) {
                if (DEBUG && DEBUG.enabled) console.log('[PWA] App already installed (Windows Store/Edge PWA), skipping prompt');
                return;
            }
        }

        this.scheduleInstallPrompt();
    }

    /**
     * Setup install prompt handling.
     * Picks up early-captured event from index.html and listens for future events.
     */
    setupInstallPrompt() {
        // Check if beforeinstallprompt was captured by the early inline script
        // (fires before module scripts finish loading, especially on slow connections)
        if (window.__deferredInstallPrompt) {
            if (DEBUG && DEBUG.enabled) console.log('[PWA] Using early-captured beforeinstallprompt event');
            this.processInstallPromptEvent(window.__deferredInstallPrompt);
            window.__deferredInstallPrompt = null;
        }

        // Listen for future events (e.g. if user re-visits after dismissing)
        window.addEventListener('beforeinstallprompt', (e) => {
            if (DEBUG && DEBUG.enabled) console.log('[PWA] beforeinstallprompt fired (listener)');
            e.preventDefault();
            this.processInstallPromptEvent(e);
        });

        // Handle iOS manually (beforeinstallprompt never fires on iOS)
        if (this.platform.isIOS && !this.isPWA() && !localStorage.getItem('installPromptDismissed')) {
            setTimeout(() => this.showIOSInstructions(), this.INSTALL_DELAY_MS);
        }

        // Track installation
        window.addEventListener('appinstalled', () => {
            if (DEBUG && DEBUG.enabled) console.log('[PWA] App was installed successfully');
            const promptElement = document.getElementById('install-prompt');
            if (promptElement) {
                promptElement.classList.add('hidden');
            }
            this.deferredPrompt = null;
            
            if (window.gtag) {
                gtag('event', 'pwa_installed', {
                    event_category: 'engagement',
                    event_label: 'PWA Installation'
                });
            }
        });

        // Expose public function
        window.showInstallPromotion = () => this.showInstallPrompt();
    }

    /**
     * Show install prompt UI
     */
    showInstallPrompt() {
        // For iOS display instructions
        if (this.platform.isIOS) {
            this.showIOSInstructions();
            return;
        }
        
        if (this.installPromptShown || this.isPWA()) return;
        
        // Must have a deferred prompt event to trigger native install
        if (!this.deferredPrompt) return;
        
        const promptElement = document.getElementById('install-prompt');
        if (!promptElement) return;
        
        this.installPromptShown = true;
        promptElement.classList.remove('hidden');
        
        // Accept button
        const acceptBtn = document.getElementById('install-accept');
        if (acceptBtn) {
            acceptBtn.textContent = this.platform.isWindows || this.platform.isEdge 
                ? 'Install (Add to apps)' 
                : acceptBtn.textContent;
            
            acceptBtn.addEventListener('click', async () => {
                promptElement.classList.add('hidden');
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const { outcome } = await this.deferredPrompt.userChoice;
                    if (DEBUG && DEBUG.enabled) console.log('[PWA] UserChoice:', outcome);
                    this.deferredPrompt = null;
                }
            }, { once: true });
        }
        
        // Dismiss button
        document.getElementById('install-dismiss')?.addEventListener('click', () => {
            promptElement.classList.add('hidden');
            localStorage.setItem('installPromptDismissed', 'true');
            this.installPromptShown = false;
        }, { once: true });
    }

    /**
     * Show iOS-specific instructions
     */
    showIOSInstructions() {
        if (this.installPromptShown || this.isPWA()) return;
        
        this.installPromptShown = true;
        const promptElement = document.getElementById('install-prompt');
        if (!promptElement) return;
        
        promptElement.classList.remove('hidden');
        
        const iconDiv = promptElement.querySelector('.install-icon');
        if (iconDiv) iconDiv.textContent = '🧭';
        
        const title = document.getElementById('install-title');
        if (title) title.textContent = 'Add to Home Screen';
        
        const msgP = promptElement.querySelector('p');
        if (msgP) {
            msgP.textContent = 'Tap the Share icon \u25b5 then choose "Add to Home Screen" to install.';
        }
        
        const buttons = promptElement.querySelector('.install-buttons');
        if (buttons) {
            const dismiss = document.getElementById('install-dismiss');
            const accept = document.getElementById('install-accept');
            if (accept) accept.style.display = 'none';
            if (dismiss) dismiss.textContent = 'Got it';
        }
    }

    /**
     * Handle URL parameters for shortcuts
     */
    handleURLShortcuts() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('planet')) {
            const planet = params.get('planet');
            if (DEBUG && DEBUG.enabled) console.log(`Shortcut: Navigating to ${planet}`);
            window.startupPlanet = planet;
        }
        
        if (params.has('vr') && params.get('vr') === 'true') {
            if (DEBUG && DEBUG.enabled) console.log('Shortcut: VR mode requested');
            window.startupVR = true;
        }
    }

    /**
     * Handle PWA mode setup
     */
    handlePWAMode() {
        if (this.isPWA()) {
            if (DEBUG && DEBUG.enabled) console.log('Running as installed PWA');
            document.body.classList.add('pwa-mode');
            
            // Hide install prompt if somehow visible
            const installPrompt = document.getElementById('install-prompt');
            if (installPrompt) {
                installPrompt.classList.add('hidden');
            }
            
            // Track PWA usage
            if (window.gtag) {
                gtag('event', 'pwa_used', {
                    event_category: 'engagement',
                    event_label: 'PWA Active Session'
                });
            }
        }
    }

    /**
     * Get platform information
     */
    getPlatformInfo() {
        return this.platform;
    }
}

// Create singleton instance
export const pwaManager = new PWAManager();
