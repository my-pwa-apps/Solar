// Internationalization (i18n) - Multi-language support
// Space Voyage - English & Dutch translations

const translations = {
    en: {
        // App title and header
        appTitle: "Space Voyage",
        subtitle: "Interactive 3D Solar System",
        
        // Navigation
        quickNavigation: "Quick Navigation",
        
        // Object categories
        ourStar: "Our Star",
        sun: "Sun",
        mercury: "Mercury",
        venus: "Venus",
        earthSystem: "Earth System",
        earth: "Earth",
        moon: "Moon",
        marsSystem: "Mars System",
        mars: "Mars",
        phobos: "Phobos",
        deimos: "Deimos",
        jupiterSystem: "Jupiter System",
        jupiter: "Jupiter",
        io: "Io",
        europa: "Europa",
        ganymede: "Ganymede",
        callisto: "Callisto",
        saturnSystem: "Saturn System",
        saturn: "Saturn",
        titan: "Titan",
        uranusSystem: "Uranus System",
        uranus: "Uranus",
        neptuneSystem: "Neptune System",
        neptune: "Neptune",
        
        // Control buttons
        toggleOrbits: "Orbits",
        toggleConstellations: "Constellations",
        toggleScale: "Educational Scale",
        toggleScaleRealistic: "Realistic Scale",
        toggleLabels: "Labels OFF",
        toggleLabelsOn: "Labels ON",
        resetView: "Reset",
        enterVR: "Enter VR",
        enterAR: "Enter AR",
        
        // Speed control
        speedLabel: "Speed:",
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
        initializing: "Initializing...",
        settingUpScene: "Setting up scene...",
        initializingControls: "Initializing controls...",
        loadingSolarSystem: "Loading solar system...",
        creatingSun: "Creating Sun...",
        
        // Info panel
        selectObject: "Select an Object",
        clickToExplore: "Click on objects to explore and learn more",
        
        // Help modal
        help: "Help",
        helpTitle: "Space Voyage - Controls & Features",
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
        installTitle: "Install Space Voyage",
        installMessage: "Install Space Voyage as an app for a better experience!",
        installButton: "Install",
        installLater: "Maybe Later",
        
        // Errors
        errorLoading: "Error loading Space Voyage",
        errorMessage: "Please refresh the page to try again.",
        
        // Footer
        madeWith: "Made with",
        and: "and",
        by: "by",
        
        // Object Types
        typeStar: 'Star',
        typePlanet: 'Planet',
        typeMoon: 'Moon',
        typeSpacecraft: 'Spacecraft',
        typeDwarfPlanet: 'Dwarf Planet',
        typeNebula: 'Nebula',
        typeGalaxy: 'Galaxy',
        typeStar: 'Star',
        
        // Object Descriptions
        descSun: 'The Sun is a G-type main-sequence star (yellow dwarf) containing 99.86% of the Solar System\'s mass. Surface temperature: 5,778K. Age: 4.6 billion years. It fuses 600 million tons of hydrogen into helium every second!',
        descMercury: 'Mercury is the smallest planet and closest to the Sun. Its surface is covered with craters like our Moon. Temperature ranges from -180°C at night to 430°C during the day - the largest temperature swing in the solar system!',
        descVenus: 'Venus is the hottest planet with surface temperature of 465°C due to extreme greenhouse effect. Its atmosphere is 96% CO2 with clouds of sulfuric acid. Venus rotates backwards compared to most planets!',
        descEarth: 'Earth is our home, the only known planet with life! 71% is covered by water, creating the blue color visible from space. The atmosphere protects us from harmful radiation and meteors.',
        descMoon: 'Earth\'s Moon is the fifth largest moon in the solar system. It creates tides, stabilizes Earth\'s tilt, and was formed 4.5 billion years ago when a Mars-sized object hit Earth!',
        descMars: 'Mars, the Red Planet, gets its color from iron oxide (rust). It has the largest volcano (Olympus Mons - 22 km high) and canyon (Valles Marineris - 4,000 km long) in the solar system. Water ice exists at its poles!',
        descJupiter: 'Jupiter is the largest planet - all other planets could fit inside it! The Great Red Spot is a storm larger than Earth that has raged for at least 400 years. Jupiter has 95 known moons!',
        descSaturn: 'Saturn is famous for its spectacular ring system made of ice and rock particles. It\'s the least dense planet - it would float in water! Saturn has 146 known moons including Titan, which has a thick atmosphere.',
        descUranus: 'Uranus is unique - it rotates on its side! This means its poles take turns facing the Sun during its 84-year orbit. Made of water, methane, and ammonia ices, it appears blue-green due to methane in its atmosphere.',
        descNeptune: 'Neptune is the windiest planet with storms reaching 2,100 km/h! It\'s the farthest planet from the Sun and takes 165 Earth years to complete one orbit. Its blue color comes from methane in the atmosphere.',
        
        // Loading messages
        creatingMercury: 'Creating Mercury...',
        creatingVenus: 'Creating Venus...',
        creatingEarth: 'Creating Earth...',
        creatingMars: 'Creating Mars...',
        creatingJupiter: 'Creating Jupiter...',
        creatingSaturn: 'Creating Saturn...',
        creatingUranus: 'Creating Uranus...',
        creatingNeptune: 'Creating Neptune...',
        creatingAsteroidBelt: 'Creating asteroid belt...',
        creatingKuiperBelt: 'Creating Kuiper belt...',
        creatingStarfield: 'Creating starfield...',
        creatingOrbitalPaths: 'Creating orbital paths...',
        creatingConstellations: 'Creating constellations...',
        creatingDistantStars: 'Creating distant stars...',
        creatingNebulae: 'Creating nebulae...',
        creatingGalaxies: 'Creating galaxies...',
        creatingNearbyStars: 'Creating nearby stars...',
        creatingExoplanets: 'Creating exoplanets...',
        creatingComets: 'Creating comets...',
        creatingLabels: 'Creating labels...',
        creatingSatellites: 'Creating satellites...',
        creatingSpacecraft: 'Creating spacecraft...',
        
        // System text
        centerSolarSystem: 'Center of Solar System',
        orbitsParent: 'Orbits',
        millionKmFromSun: 'million km from Sun',
        distanceVaries: 'Distance varies',
        noDescription: 'No description available',
        moonCount: 'This planet has',
        majorMoon: 'major moon',
        majorMoons: 'major moons',
        shownHere: 'shown here (many more small ones exist!)',
        
        // Fun Facts
        funFactSun: 'The Sun is so big that 1.3 million Earths could fit inside it!',
        funFactMercury: 'A year on Mercury (88 Earth days) is shorter than its day (176 Earth days)!',
        funFactVenus: 'Venus is the brightest planet in our sky and is often called Earth\'s "evil twin"',
        funFactEarth: 'Earth is the only planet not named after a god. It travels at 107,000 km/h around the Sun!',
        funFactMoon: 'The Moon is slowly moving away from Earth at 3.8 cm per year!',
        funFactMars: 'Mars has seasons like Earth, and its day is only 37 minutes longer than ours!',
        funFactJupiter: 'Jupiter\'s gravity shields Earth from many asteroids and comets!',
        funFactSaturn: 'Saturn\'s rings are only 10 meters thick but 280,000 km wide!',
        funFactUranus: 'Uranus was the first planet discovered with a telescope (1781)!',
        funFactNeptune: 'Neptune was discovered by math before being seen - its gravity affected Uranus\'s orbit!',
        funFactPluto: 'A year on Pluto lasts 248 Earth years! It hasn\'t completed one orbit since its discovery in 1930.'
    },
    
    nl: {
        // App titel en header
        appTitle: "Ruimtereis",
        subtitle: "Interactief 3D Zonnestelsel",
        
        // Navigatie
        quickNavigation: "Snelle Navigatie",
        
        // Object categorieën
        ourStar: "Onze Ster",
        sun: "Zon",
        mercury: "Mercurius",
        venus: "Venus",
        earthSystem: "Aarde Systeem",
        earth: "Aarde",
        moon: "Maan",
        marsSystem: "Mars Systeem",
        mars: "Mars",
        phobos: "Phobos",
        deimos: "Deimos",
        jupiterSystem: "Jupiter Systeem",
        jupiter: "Jupiter",
        io: "Io",
        europa: "Europa",
        ganymede: "Ganymedes",
        callisto: "Callisto",
        saturnSystem: "Saturnus Systeem",
        saturn: "Saturnus",
        titan: "Titan",
        uranusSystem: "Uranus Systeem",
        uranus: "Uranus",
        neptuneSystem: "Neptunus Systeem",
        neptune: "Neptunus",
        
        // Bedieningsknoppen
        toggleOrbits: "Banen",
        toggleConstellations: "Sterrenbeelden",
        toggleScale: "Educatieve schaal",
        toggleScaleRealistic: "Op schaal",
        toggleLabels: "Labels uit",
        toggleLabelsOn: "Labels aan",
        resetView: "Reset",
        enterVR: "VR Starten",
        enterAR: "AR Starten",
        
        // Snelheidsregeling
        speedLabel: "Snelheid:",
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
        initializing: "Initialiseren...",
        settingUpScene: "Scène opzetten...",
        initializingControls: "Besturing initialiseren...",
        loadingSolarSystem: "Zonnestelsel laden...",
        creatingSun: "Zon creëren...",
        
        // Info paneel
        selectObject: "Selecteer een Object",
        clickToExplore: "Klik op objecten om te verkennen en meer te leren",
        
        // Help modal
        help: "Hulp",
        helpTitle: "Ruimtereis - Besturing & Functies",
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
        installTitle: "Installeer Ruimtereis",
        installMessage: "Installeer Ruimtereis als app voor een betere ervaring!",
        installButton: "Installeren",
        installLater: "Misschien Later",
        
        // Fouten
        errorLoading: "Fout bij laden Ruimtereis",
        errorMessage: "Ververs de pagina om het opnieuw te proberen.",
        
        // Footer
        madeWith: "Gemaakt met",
        and: "en",
        by: "door",
        
        // Object Types (Nederlands)
        typeStar: 'Ster',
        typePlanet: 'Planeet',
        typeMoon: 'Maan',
        typeSpacecraft: 'Ruimtevaartuig',
        typeDwarfPlanet: 'Dwergplaneet',
        typeNebula: 'Nevel',
        typeGalaxy: 'Sterrenstelsel',
        
        // Object Beschrijvingen
        descSun: 'De Zon is een gele dwergster (G-type hoofdreeksster) met 99,86% van alle massa in ons zonnestelsel. Oppervlaktetemperatuur: 5.778K. Leeftijd: 4,6 miljard jaar. Elke seconde smelt de Zon 600 miljoen ton waterstof samen tot helium!',
        descMercury: 'Mercurius is de kleinste planeet en staat het dichtst bij de Zon. Het oppervlak zit vol kraters, net als onze Maan. De temperatuur schommelt tussen -180°C \'s nachts en 430°C overdag - de grootste temperatuurverschillen in ons zonnestelsel!',
        descVenus: 'Venus is met 465°C de heetste planeet door een extreem broeikaseffect. De atmosfeer bestaat voor 96% uit CO2 en heeft wolken van zwavelzuur. Venus draait bovendien de andere kant op dan de meeste planeten!',
        descEarth: 'De Aarde is ons thuis en de enige bekende planeet met leven! 71% van het oppervlak bestaat uit water, wat onze planeet de blauwe kleur geeft vanuit de ruimte. De atmosfeer beschermt ons tegen gevaarlijke straling en meteorieten.',
        descMoon: 'Onze Maan is de vijfde grootste maan in het zonnestelsel. De Maan zorgt voor eb en vloed, stabiliseert de aardas, en ontstond 4,5 miljard jaar geleden toen een object zo groot als Mars op de Aarde insloeg!',
        descMars: 'Mars, de Rode Planeet, dankt zijn kleur aan ijzeroxide (roest). Mars heeft de hoogste vulkaan (Olympus Mons - 22 km hoog) en de langste kloof (Valles Marineris - 4.000 km lang) in ons zonnestelsel. Bij de polen ligt waterijs!',
        descJupiter: 'Jupiter is veruit de grootste planeet - alle andere planeten passen er samen in! De Grote Rode Vlek is een storm groter dan de Aarde die al minstens 400 jaar raast. Jupiter heeft maar liefst 95 bekende manen!',
        descSaturn: 'Saturnus is beroemd om zijn spectaculaire ringen van ijs- en rotsdeeltjes. Het is de lichtste planeet - lichter dan water, dus Saturnus zou blijven drijven! Saturnus heeft 146 bekende manen, waaronder Titan met zijn dikke atmosfeer.',
        descUranus: 'Uranus is bijzonder - de planeet ligt op zijn zij! Hierdoor wijzen de polen om de beurt naar de Zon tijdens een baan van 84 jaar. Door het methaan in de atmosfeer lijkt Uranus blauwgroen. De planeet bestaat uit water, methaan en ammoniakijs.',
        descNeptune: 'Neptunus is de stormachtigste planeet met windsnelheden tot 2.100 km/u! Het is de verste planeet vanaf de Zon en doet er 165 aardse jaren over om één ronde te maken. De blauwe kleur komt door methaan in de atmosfeer.',
        
        // Laadberichten
        creatingMercury: 'Mercurius maken...',
        creatingVenus: 'Venus maken...',
        creatingEarth: 'Aarde maken...',
        creatingMars: 'Mars maken...',
        creatingJupiter: 'Jupiter maken...',
        creatingSaturn: 'Saturnus maken...',
        creatingUranus: 'Uranus maken...',
        creatingNeptune: 'Neptunus maken...',
        creatingAsteroidBelt: 'Asteroïdengordel maken...',
        creatingKuiperBelt: 'Kuipergordel maken...',
        creatingStarfield: 'Sterrenveld maken...',
        creatingOrbitalPaths: 'Baanpaden maken...',
        creatingConstellations: 'Sterrenbeelden maken...',
        creatingDistantStars: 'Verre sterren plaatsen...',
        creatingNebulae: 'Nevels maken...',
        creatingGalaxies: 'Sterrenstelsels toevoegen...',
        creatingNearbyStars: 'Nabije sterren plaatsen...',
        creatingExoplanets: 'Exoplaneten ontdekken...',
        creatingComets: 'Kometen maken...',
        creatingLabels: 'Labels maken...',
        creatingSatellites: 'Satellieten maken...',
        creatingSpacecraft: 'Ruimtevaartuigen maken...',
        
        // Systeem tekst
        centerSolarSystem: 'Centrum van Zonnestelsel',
        orbitsParent: 'Draait om',
        millionKmFromSun: 'miljoen km van de Zon',
        distanceVaries: 'Afstand varieert',
        noDescription: 'Geen beschrijving beschikbaar',
        moonCount: 'Deze planeet heeft',
        majorMoon: 'grote maan',
        majorMoons: 'grote manen',
        shownHere: 'hier weergegeven (er bestaan nog veel meer kleine manen!)',
        
        // Wetenswaardigheden
        funFactSun: 'De Zon is zo groot dat er 1,3 miljoen Aardes in passen!',
        funFactMercury: 'Een jaar op Mercurius (88 aardse dagen) is korter dan een dag op Mercurius (176 aardse dagen)!',
        funFactVenus: 'Venus is de helderste planeet aan onze hemel en wordt vaak de "kwaadaardige tweeling" van de Aarde genoemd',
        funFactEarth: 'De Aarde is de enige planeet die niet naar een god is vernoemd. We reizen met 107.000 km/u om de Zon!',
        funFactMoon: 'De Maan beweegt elk jaar 3,8 cm verder van de Aarde vandaan!',
        funFactMars: 'Mars heeft seizoenen net als de Aarde, en een dag op Mars duurt maar 37 minuten langer dan een aardse dag!',
        funFactJupiter: 'De zwaartekracht van Jupiter beschermt de Aarde tegen veel asteroïden en kometen!',
        funFactSaturn: 'De ringen van Saturnus zijn slechts 10 meter dik maar 280.000 km breed!',
        funFactUranus: 'Uranus was de eerste planeet die ontdekt werd met een telescoop (in 1781)!',
        funFactNeptune: 'Neptunus werd ontdekt door wiskundige berekeningen voordat hij gezien werd - zijn zwaartekracht beïnvloedde de baan van Uranus!',
        funFactPluto: 'Een jaar op Pluto duurt 248 aardse jaren! Pluto heeft nog geen hele baan voltooid sinds de ontdekking in 1930.'
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
        
        // Update text content, placeholder, or label
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else if (element.tagName === 'OPTGROUP') {
            // For optgroups, update the label attribute
            element.setAttribute('label', translation);
        } else {
            // For all other elements, update text content
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

// Make translation function globally available
window.t = t;
window.applyTranslations = applyTranslations;
window.getCurrentLanguage = getCurrentLanguage;

// Auto-apply translations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
    applyTranslations();
}
