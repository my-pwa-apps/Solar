// Internationalization (i18n) - Multi-language support
// Space Explorer - English & Dutch translations

const translations = {
    en: {
        // App title and header
        appTitle: "🚀 Space Explorer",
        subtitle: "Interactive 3D Solar System",
        
        // Navigation
        quickNavigation: "🚀 Quick Navigation",
        
        // Object categories
        ourStar: "☀️ Our Star",
        sun: "☀️ Sun",
        mercury: "☿ Mercury",
        venus: "♀ Venus",
        earthSystem: "🌍 Earth System",
        earth: "🌍 Earth",
        moon: "🌙 Moon",
        marsSystem: "♂ Mars System",
        mars: "♂ Mars",
        phobos: "🌑 Phobos",
        deimos: "🌑 Deimos",
        jupiterSystem: "♃ Jupiter System",
        jupiter: "♃ Jupiter",
        io: "🌋 Io",
        europa: "❄️ Europa",
        ganymede: "🌙 Ganymede",
        callisto: "🌙 Callisto",
        saturnSystem: "♄ Saturn System",
        saturn: "♄ Saturn",
        titan: "🌊 Titan",
        uranusSystem: "♅ Uranus System",
        uranus: "♅ Uranus",
        neptuneSystem: "♆ Neptune System",
        neptune: "♆ Neptune",
        
        // Control buttons
        toggleOrbits: "🛤️ Orbits",
        toggleConstellations: "⭐ Constellations",
        toggleScale: "📏 Educational Scale",
        toggleScaleRealistic: "📏 Realistic Scale",
        toggleLabels: "📊 Labels OFF",
        toggleLabelsOn: "📊 Labels ON",
        resetView: "🔄 Reset View",
        enterVR: "🥽 Enter VR",
        enterAR: "📱 Enter AR",
        
        // Speed control
        speedLabel: "⏱️ Speed:",
        paused: "Paused",
        realTime: "1x Real-time",
        
        // Info panel
        name: "Name",
        type: "Type",
        distance: "Distance",
        size: "Size",
        description: "Description",
        
        // Loading screen
        loading: "Loading...",
        initializing: "Initializing Space Explorer...",
        settingUpScene: "🎬 Setting up scene...",
        initializingControls: "🖱️ Initializing controls...",
        loadingSolarSystem: "🌌 Loading solar system...",
        creatingSun: "☀️ Creating Sun...",
        
        // Help modal
        help: "❓ Help",
        helpTitle: "Space Explorer - Controls & Features",
        controls: "Controls",
        mouseControls: "Mouse Controls:",
        leftClick: "Left Click + Drag: Rotate view",
        rightClick: "Right Click + Drag: Pan view",
        scroll: "Scroll: Zoom in/out",
        clickObject: "Click Object: View details",
        keyboardShortcuts: "Keyboard Shortcuts:",
        spaceKey: "Space: Pause/Resume",
        plusMinus: "+/-: Change speed",
        rKey: "R: Reset view",
        hKey: "H: Toggle help",
        lKey: "L: Toggle laser pointers (VR)",
        features: "Features",
        vrSupport: "VR/AR Support with WebXR",
        realisticOrbits: "Realistic orbital mechanics",
        educationalMode: "Educational and realistic scale modes",
        constellations: "Major constellations visible",
        spacecraft: "Historic spacecraft and satellites",
        
        // Update notification
        updateAvailable: "Update Available",
        updateMessage: "A new version is available!",
        updateButton: "Update Now",
        updateLater: "Later",
        
        // Offline notification
        offline: "Offline Mode",
        offlineMessage: "You're offline. Some features may be limited.",
        
        // Install prompt
        installTitle: "Install Space Explorer",
        installMessage: "Install Space Explorer as an app for a better experience!",
        installButton: "Install",
        installLater: "Maybe Later",
        
        // Errors
        errorLoading: "Error loading Space Explorer",
        errorMessage: "Please refresh the page to try again.",
        
        // Footer
        madeWith: "Made with",
        and: "and",
        by: "by"
    },
    
    nl: {
        // App titel en header
        appTitle: "🚀 Ruimte Verkenner",
        subtitle: "Interactief 3D Zonnestelsel",
        
        // Navigatie
        quickNavigation: "🚀 Snelle Navigatie",
        
        // Object categorieën
        ourStar: "☀️ Onze Ster",
        sun: "☀️ Zon",
        mercury: "☿ Mercurius",
        venus: "♀ Venus",
        earthSystem: "🌍 Aarde Systeem",
        earth: "🌍 Aarde",
        moon: "🌙 Maan",
        marsSystem: "♂ Mars Systeem",
        mars: "♂ Mars",
        phobos: "🌑 Phobos",
        deimos: "🌑 Deimos",
        jupiterSystem: "♃ Jupiter Systeem",
        jupiter: "♃ Jupiter",
        io: "🌋 Io",
        europa: "❄️ Europa",
        ganymede: "🌙 Ganymedes",
        callisto: "🌙 Callisto",
        saturnSystem: "♄ Saturnus Systeem",
        saturn: "♄ Saturnus",
        titan: "🌊 Titan",
        uranusSystem: "♅ Uranus Systeem",
        uranus: "♅ Uranus",
        neptuneSystem: "♆ Neptunus Systeem",
        neptune: "♆ Neptunus",
        
        // Bedieningsknoppen
        toggleOrbits: "🛤️ Banen",
        toggleConstellations: "⭐ Sterrenbeelden",
        toggleScale: "📏 Educatieve Schaal",
        toggleScaleRealistic: "📏 Realistische Schaal",
        toggleLabels: "📊 Labels UIT",
        toggleLabelsOn: "📊 Labels AAN",
        resetView: "🔄 Weergave Resetten",
        enterVR: "🥽 VR Starten",
        enterAR: "📱 AR Starten",
        
        // Snelheidsregeling
        speedLabel: "⏱️ Snelheid:",
        paused: "Gepauzeerd",
        realTime: "1x Real-time",
        
        // Info paneel
        name: "Naam",
        type: "Type",
        distance: "Afstand",
        size: "Grootte",
        description: "Beschrijving",
        
        // Laadscherm
        loading: "Laden...",
        initializing: "Ruimte Verkenner initialiseren...",
        settingUpScene: "🎬 Scène opzetten...",
        initializingControls: "🖱️ Besturing initialiseren...",
        loadingSolarSystem: "🌌 Zonnestelsel laden...",
        creatingSun: "☀️ Zon creëren...",
        
        // Help modal
        help: "❓ Hulp",
        helpTitle: "Ruimte Verkenner - Besturing & Functies",
        controls: "Besturing",
        mouseControls: "Muisbediening:",
        leftClick: "Linker Klik + Slepen: Draai weergave",
        rightClick: "Rechter Klik + Slepen: Verschuif weergave",
        scroll: "Scroll: Zoom in/uit",
        clickObject: "Klik Object: Bekijk details",
        keyboardShortcuts: "Toetsenbord Sneltoetsen:",
        spaceKey: "Spatie: Pauzeer/Hervat",
        plusMinus: "+/-: Verander snelheid",
        rKey: "R: Reset weergave",
        hKey: "H: Schakel hulp",
        lKey: "L: Schakel laserpointers (VR)",
        features: "Functies",
        vrSupport: "VR/AR Ondersteuning met WebXR",
        realisticOrbits: "Realistische baanmechanica",
        educationalMode: "Educatieve en realistische schaalmodi",
        constellations: "Belangrijkste sterrenbeelden zichtbaar",
        spacecraft: "Historische ruimtevaartuigen en satellieten",
        
        // Update melding
        updateAvailable: "Update Beschikbaar",
        updateMessage: "Een nieuwe versie is beschikbaar!",
        updateButton: "Nu Updaten",
        updateLater: "Later",
        
        // Offline melding
        offline: "Offline Modus",
        offlineMessage: "Je bent offline. Sommige functies kunnen beperkt zijn.",
        
        // Installatie prompt
        installTitle: "Installeer Ruimte Verkenner",
        installMessage: "Installeer Ruimte Verkenner als app voor een betere ervaring!",
        installButton: "Installeren",
        installLater: "Misschien Later",
        
        // Fouten
        errorLoading: "Fout bij laden Ruimte Verkenner",
        errorMessage: "Ververs de pagina om het opnieuw te proberen.",
        
        // Footer
        madeWith: "Gemaakt met",
        and: "en",
        by: "door"
    }
};

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
    console.log(`🌍 Applying ${lang === 'nl' ? 'Dutch' : 'English'} translations`);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        // Update text content or placeholder
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
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

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { t, applyTranslations, getCurrentLanguage, translations };
}

// Auto-apply translations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
    applyTranslations();
}
