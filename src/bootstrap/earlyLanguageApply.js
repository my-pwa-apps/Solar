// Runs synchronously inside #loading, before the i18n bundles have loaded.
//
// Its ONLY job is to set <html lang> so the correct locale is active by the time
// bootstrapI18n() -> initLanguage() -> applyTranslations() runs.
//
// It must NOT call window.applyTranslations(): at this point the dictionaries are
// still empty (bundles load asynchronously), so t(key) returns the raw key and the
// hand-written English defaults in index.html get overwritten with literal keys
// ("preparingJourney", "initializing", ...) on the very first paint.
(function () {
    try {
        const supported = ['en', 'nl', 'fr', 'de', 'es', 'pt'];
        // Same priority order as LanguageManager.detectAndSetLanguage().
        const storedLang = localStorage.getItem('appLanguage');
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        const userLang = navigator.language || navigator.userLanguage || 'en';
        const lang = storedLang || urlLang || userLang.toLowerCase().split('-')[0];
        document.documentElement.lang = supported.includes(lang) ? lang : 'en';
    } catch {
        document.documentElement.lang = 'en';
    }
})();
