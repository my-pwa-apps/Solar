/**
 * LanguageManager - Handles language detection and manifest switching
 * This module must load before other modules to set document.lang correctly
 */
import { DEBUG } from './utils.js';
import { safeGetItem, safeSetItem } from './storage.js';

class LanguageManager {
    constructor() {
        this.supportedLanguages = ['en', 'nl', 'fr', 'de', 'es', 'pt'];
        this.languageNames = {
            en: 'English',
            nl: 'Nederlands',
            fr: 'Français',
            de: 'Deutsch',
            es: 'Español',
            pt: 'Português'
        };
        this.manifestFiles = {
            'en': './manifest.json',
            'nl': './manifest.nl.json',
            'fr': './manifest.fr.json',
            'de': './manifest.de.json',
            'es': './manifest.es.json',
            'pt': './manifest.pt.json'
        };
    }

    /**
     * Detect and set the appropriate language
     * Priority: 1) Stored preference, 2) URL parameter, 3) Browser/OS language
     */
    detectAndSetLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        const storedLang = safeGetItem('appLanguage');
        const userLang = navigator.language || navigator.userLanguage;
        
        let langCode;
        if (storedLang) {
            // Use stored preference (from installation or user choice)
            langCode = storedLang;
        } else if (urlLang) {
            // Use URL parameter
            langCode = urlLang;
        } else {
            // Use browser/OS language
            langCode = userLang.toLowerCase().split('-')[0];
        }
        
        // Validate against supported languages
        if (!this.supportedLanguages.includes(langCode)) {
            langCode = 'en'; // Default to English
        }
        
        // Store the language preference for future sessions
        if (!storedLang) {
            safeSetItem('appLanguage', langCode);
        }
        
        // Set HTML lang attribute
        document.documentElement.lang = langCode;
        
        // Set the manifest file
        this.setManifest(langCode);
        
        // Log detection
        const source = storedLang ? 'Stored' : urlLang ? 'URL' : 'OS/Browser';
        if (DEBUG && DEBUG.enabled) console.log('[Language] Detected:', this.languageNames[langCode] || langCode, '| Source:', source);
        
        return langCode;
    }

    /**
     * Set the manifest file based on language
     */
    setManifest(langCode) {
        const manifestLink = document.getElementById('pwa-manifest');
        if (manifestLink) {
            const manifestFile = this.manifestFiles[langCode] || './manifest.json';
            manifestLink.href = manifestFile + '?v=2.10.478';
        }
    }
}

// Create singleton instance and auto-detect language
const languageManager = new LanguageManager();
languageManager.detectAndSetLanguage();

export { languageManager };
