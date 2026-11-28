// Internationalization (i18n) - Multi-language support
// Space Voyage - lazy-loaded language bundles

import { languageManager } from './modules/LanguageManager.js';
import { APP_VERSION } from './modules/utils.js';
import { safeSetItem } from './modules/storage.js';

const supportedLanguages = ['en', 'nl', 'fr', 'de', 'es', 'pt'];
const localeLoaders = {
    en: () => import('./locales/en.js'),
    nl: () => import('./locales/nl.js'),
    fr: () => import('./locales/fr.js'),
    de: () => import('./locales/de.js'),
    es: () => import('./locales/es.js'),
    pt: () => import('./locales/pt.js')
};
const localeCache = new Map();
let currentLanguage = supportedLanguages.includes(document.documentElement.lang)
    ? document.documentElement.lang
    : 'en';
let currentTranslations;
let languageRequest = 0;

async function loadLocale(language) {
    if (localeCache.has(language)) return localeCache.get(language);

    const localeModule = await localeLoaders[language]();
    if (!localeModule.default || typeof localeModule.default !== 'object') {
        throw new Error(`Locale module "${language}" has no translation table.`);
    }

    localeCache.set(language, localeModule.default);
    return localeModule.default;
}

const englishTranslations = await loadLocale('en');
if (currentLanguage === 'en') {
    currentTranslations = englishTranslations;
} else {
    try {
        currentTranslations = await loadLocale(currentLanguage);
    } catch (error) {
        console.error(`[i18n] Failed to load "${currentLanguage}" translations; using English.`, error);
        currentLanguage = 'en';
        document.documentElement.lang = currentLanguage;
        currentTranslations = englishTranslations;
        languageManager.setManifest(currentLanguage);
        safeSetItem('appLanguage', currentLanguage);
    }
}

// Get current language from HTML lang attribute
function getCurrentLanguage() {
    return currentLanguage;
}

// Get translation for current language
function t(key) {
    return currentTranslations[key] || englishTranslations[key] || key;
}

// Apply translations to the page
function applyTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else if (element.tagName === 'OPTGROUP') {
            element.setAttribute('label', translation);
        } else {
            const btnText = element.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = translation;
            } else {
                element.textContent = translation;
            }
        }
    });

    // Update placeholder attributes via data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Update data-tooltip attributes via data-i18n-tooltip
    document.querySelectorAll('[data-i18n-tooltip]').forEach(element => {
        const key = element.getAttribute('data-i18n-tooltip');
        const translation = t(key);
        if (translation && translation !== key) {
            element.setAttribute('data-tooltip', translation);
        }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria-label');
        const translation = t(key);
        if (translation && translation !== key) {
            element.setAttribute('aria-label', translation);
        }
    });

    // Update document title
    document.title = t('appTitle') + ' - ' + t('subtitle');

    // Update meta tags
    const metaTags = {
        'description': t('subtitle'),
        'og:title': t('appTitle') + ' - ' + t('subtitle'),
        'twitter:title': t('appTitle') + ' - ' + t('subtitle')
    };

    Object.entries(metaTags).forEach(([name, content]) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        if (meta) {
            meta.setAttribute('content', content);
        }
    });
}

// Function to change language
async function setLanguage(lang) {
    if (!supportedLanguages.includes(lang)) {
        lang = 'en';
    }

    const request = ++languageRequest;
    let nextTranslations;
    try {
        nextTranslations = await loadLocale(lang);
    } catch (error) {
        console.error(`[i18n] Failed to load "${lang}" translations; keeping "${currentLanguage}".`, error);
        if (request === languageRequest) {
            const selector = document.getElementById('language-selector');
            if (selector) selector.value = currentLanguage;
        }
        return false;
    }

    if (request !== languageRequest) return false;
    currentLanguage = lang;
    currentTranslations = nextTranslations;
    document.documentElement.lang = lang;
    const selector = document.getElementById('language-selector');
    if (selector) selector.value = lang;
    safeSetItem('appLanguage', lang);

    const manifestFiles = {
        'en': './manifest.json',
        'nl': './manifest.nl.json',
        'fr': './manifest.fr.json',
        'de': './manifest.de.json',
        'es': './manifest.es.json',
        'pt': './manifest.pt.json'
    };

    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        manifestLink.href = `${manifestFiles[lang] || './manifest.json'}?v=${APP_VERSION}`;
    }

    applyTranslations();
    window.dispatchEvent(new CustomEvent('app-language-changed', { detail: { lang } }));
    return true;
}

// Flag emojis for languages (only shown on mobile - Windows doesn't support flag emojis)
const languageFlags = {
    en: '🇬🇧',
    nl: '🇳🇱',
    fr: '🇫🇷',
    de: '🇩🇪',
    es: '🇪🇸',
    pt: '🇵🇹'
};

function shouldShowFlagEmojis() {
    const isWindows = navigator.platform.indexOf('Win') > -1 ||
                      navigator.userAgent.indexOf('Windows') > -1;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile || !isWindows;
}

function initLanguage() {
    const lang = getCurrentLanguage();

    const selector = document.getElementById('language-selector');
    if (selector) {
        selector.value = lang;

        if (shouldShowFlagEmojis()) {
            Array.from(selector.options).forEach(option => {
                const flag = languageFlags[option.value];
                if (flag && !option.textContent.includes(flag)) {
                    option.textContent = `${flag} ${option.textContent}`;
                }
            });
        }

        if (!selector.dataset.languageBound) {
            selector.addEventListener('change', (e) => {
                setLanguage(e.target.value);
            });
            selector.dataset.languageBound = 'true';
        }
    }

    applyTranslations();
}

// Make translation function globally available
window.t = t;
window.applyTranslations = applyTranslations;
window.getCurrentLanguage = getCurrentLanguage;
window.setLanguage = setLanguage;

// Auto-apply translations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
} else {
    initLanguage();
}
