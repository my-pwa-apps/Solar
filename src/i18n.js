// Internationalization (i18n) - Multi-language support
// Space Voyage - Asymmetric dynamic language on-demand loading

window.i18n_translations = window.i18n_translations || { en: {}, nl: {}, fr: {}, de: {}, es: {}, pt: {} };
const translations = window.i18n_translations;

function loadLanguageResource(lang) {
    return new Promise((resolve) => {
        if (translations[lang] && Object.keys(translations[lang]).length > 0) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = `./src/i18n/${lang}.js?v=${I18N_ASSET_VERSION}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            console.error(`Failed to load translation file for ${lang}`);
            resolve(); // fallback gracefully
        };
        document.head.appendChild(script);
    });
}

// Fill any key missing from the active locale with the English string, so the UI
// can never fall back to a raw key such as "preparingJourney".
// Only the active language is filled - the other bundles are not even loaded.
function applyLocaleParityFallbacks(lang = getCurrentLanguage()) {
    const english = translations.en;
    const target = translations[lang];
    if (!english || !target || target === english) return;
    for (const key in english) {
        if (!(key in target)) target[key] = english[key];
    }
}

let resolveI18nReady;
window.i18nReady = new Promise((resolve) => {
    resolveI18nReady = resolve;
});

async function bootstrapI18n() {
    const lang = getCurrentLanguage();
    const promises = [loadLanguageResource('en')];
    if (lang !== 'en') {
        promises.push(loadLanguageResource(lang));
    }
    await Promise.all(promises);
    applyLocaleParityFallbacks(lang);
    initLanguage();
    resolveI18nReady();
}

const I18N_ASSET_VERSION = (() => {
    const script = document.currentScript || document.querySelector('script[src*="src/i18n.js"]');
    try {
        return new URL(script?.src || '', window.location.href).searchParams.get('v') || '2.10.312';
    } catch {
        return '2.10.310';
    }
})();

// Get current language from HTML lang attribute
function getCurrentLanguage() {
    return document.documentElement.lang || 'en';
}

// Get translation for current language
function t(key) {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || translations.en[key] || key;
}

// Apply translations to the page
function applyTranslations() {
    const lang = getCurrentLanguage();

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
    const supportedLanguages = ['en', 'nl', 'fr', 'de', 'es', 'pt'];
    if (!supportedLanguages.includes(lang)) {
        lang = 'en';
    }

    document.documentElement.lang = lang;
    try {
        localStorage.setItem('appLanguage', lang);
    } catch {
        // Ignore storage failures such as Safari private mode.
    }

    try {
        await loadLanguageResource(lang);
        applyLocaleParityFallbacks(lang);
    } catch (e) {
        console.error('Error loading language resources:', e);
    }

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
        manifestLink.href = `${manifestFiles[lang] || './manifest.json'}?v=${I18N_ASSET_VERSION}`;
    }

    applyTranslations();
    window.dispatchEvent(new CustomEvent('app-language-changed', { detail: { lang } }));
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
    document.addEventListener('DOMContentLoaded', bootstrapI18n);
} else {
    bootstrapI18n();
}
