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
        creatingInnerPlanets: 'Creating inner planets...',
        creatingOuterPlanets: 'Creating outer planets...',
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
    },
    
    fr: {
        // Titre et en-tête de l'application
        appTitle: "Voyage Spatial",
        subtitle: "Système Solaire 3D Interactif",
        
        // Navigation
        quickNavigation: "Navigation Rapide",
        
        // Catégories d'objets
        ourStar: "Notre Étoile",
        sun: "Soleil",
        mercury: "Mercure",
        venus: "Vénus",
        earthSystem: "Système Terrestre",
        earth: "Terre",
        moon: "Lune",
        marsSystem: "Système Martien",
        mars: "Mars",
        phobos: "Phobos",
        deimos: "Deimos",
        jupiterSystem: "Système Jovien",
        jupiter: "Jupiter",
        io: "Io",
        europa: "Europe",
        ganymede: "Ganymède",
        callisto: "Callisto",
        saturnSystem: "Système Saturnien",
        saturn: "Saturne",
        titan: "Titan",
        uranusSystem: "Système d'Uranus",
        uranus: "Uranus",
        neptuneSystem: "Système Neptunien",
        neptune: "Neptune",
        
        // Boutons de contrôle
        toggleOrbits: "Orbites",
        toggleConstellations: "Constellations",
        toggleScale: "Échelle Éducative",
        toggleScaleRealistic: "Échelle Réaliste",
        toggleLabels: "Étiquettes DÉSACTIVÉES",
        toggleLabelsOn: "Étiquettes ACTIVÉES",
        resetView: "Réinitialiser",
        enterVR: "Entrer en RV",
        enterAR: "Entrer en RA",
        
        // Contrôle de vitesse
        speedLabel: "Vitesse:",
        paused: "En pause",
        realTime: "1x Temps réel",
        
        // Panneau d'informations
        name: "Nom",
        type: "Type",
        distance: "Distance",
        size: "Taille",
        description: "Description",
        
        // Écran de chargement
        loading: "Chargement...",
        initializing: "Initialisation...",
        settingUpScene: "Configuration de la scène...",
        initializingControls: "Initialisation des contrôles...",
        loadingSolarSystem: "Chargement du système solaire...",
        creatingSun: "Création du Soleil...",
        selectObject: "Sélectionner un Objet",
        clickToExplore: "Cliquez sur les objets pour explorer et en savoir plus",
        
        // Aide
        help: "Aide",
        helpTitle: "Voyage Spatial - Contrôles et Fonctionnalités",
        controls: "Contrôles",
        mouseControls: "Contrôles Souris:",
        leftClick: "Clic Gauche + Glisser: Rotation de la vue",
        rightClick: "Clic Droit + Glisser: Déplacer la vue",
        scroll: "Molette: Zoom avant/arrière",
        clickObject: "Clic Objet: Voir les détails",
        keyboardShortcuts: "Raccourcis Clavier:",
        spaceKey: "Espace: Pause/Reprise",
        plusMinus: "+/-: Changer la vitesse",
        rKey: "R: Réinitialiser la vue",
        hKey: "H: Basculer l'aide",
        lKey: "L: Basculer les pointeurs laser (RV)",
        features: "Fonctionnalités",
        vrSupport: "Support RV/RA avec WebXR",
        realisticOrbits: "Mécanique orbitale réaliste",
        educationalMode: "Modes d'échelle éducatif et réaliste",
        constellations: "Principales constellations visibles",
        spacecraft: "Engins spatiaux et satellites historiques",
        
        // Notifications
        updateAvailable: "Mise à Jour Disponible",
        updateMessage: "Une nouvelle version est disponible!",
        updateButton: "Mettre à Jour",
        updateLater: "Plus tard",
        offline: "Mode Hors Ligne",
        offlineMessage: "Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.",
        installTitle: "Installer Voyage Spatial",
        installMessage: "Installez Voyage Spatial comme application pour une meilleure expérience!",
        installButton: "Installer",
        installLater: "Peut-être Plus Tard",
        errorLoading: "Erreur de chargement de Voyage Spatial",
        errorMessage: "Veuillez actualiser la page pour réessayer.",
        
        // Pied de page
        madeWith: "Fait avec",
        and: "et",
        by: "par",
        
        // Types d'objets
        typeStar: 'Étoile',
        typePlanet: 'Planète',
        typeMoon: 'Lune',
        typeSpacecraft: 'Vaisseau Spatial',
        typeDwarfPlanet: 'Planète Naine',
        typeNebula: 'Nébuleuse',
        typeGalaxy: 'Galaxie',
        
        // Descriptions d'objets
        descSun: 'Le Soleil est une étoile de type G (naine jaune) contenant 99,86% de la masse du Système Solaire. Température de surface: 5 778 K. Âge: 4,6 milliards d\'années. Il fusionne 600 millions de tonnes d\'hydrogène en hélium chaque seconde!',
        descMercury: 'Mercure est la plus petite planète et la plus proche du Soleil. Sa surface est couverte de cratères comme notre Lune. La température varie de -180°C la nuit à 430°C le jour - la plus grande variation de température du système solaire!',
        descVenus: 'Vénus est la planète la plus chaude avec une température de surface de 465°C due à un effet de serre extrême. Son atmosphère est composée à 96% de CO2 avec des nuages d\'acide sulfurique. Vénus tourne dans le sens inverse de la plupart des planètes!',
        descEarth: 'La Terre est notre foyer, la seule planète connue avec la vie! 71% est couvert d\'eau, créant la couleur bleue visible depuis l\'espace. L\'atmosphère nous protège des radiations nocives et des météorites.',
        descMoon: 'La Lune terrestre est la cinquième plus grande lune du système solaire. Elle crée les marées, stabilise l\'inclinaison de la Terre et s\'est formée il y a 4,5 milliards d\'années lorsqu\'un objet de la taille de Mars a percuté la Terre!',
        descMars: 'Mars, la Planète Rouge, doit sa couleur à l\'oxyde de fer (rouille). Elle possède le plus grand volcan (Olympus Mons - 22 km de haut) et le plus long canyon (Valles Marineris - 4 000 km de long) du système solaire. De la glace d\'eau existe à ses pôles!',
        descJupiter: 'Jupiter est la plus grande planète - toutes les autres planètes pourraient tenir à l\'intérieur! La Grande Tache Rouge est une tempête plus grande que la Terre qui fait rage depuis au moins 400 ans. Jupiter a 95 lunes connues!',
        descSaturn: 'Saturne est célèbre pour son spectaculaire système d\'anneaux composés de particules de glace et de roche. C\'est la planète la moins dense - elle flotterait dans l\'eau! Saturne a 146 lunes connues dont Titan qui possède une atmosphère épaisse.',
        descUranus: 'Uranus est unique - elle tourne sur le côté! Cela signifie que ses pôles font face au Soleil à tour de rôle pendant son orbite de 84 ans. Composée de glaces d\'eau, de méthane et d\'ammoniac, elle apparaît bleu-vert en raison du méthane dans son atmosphère.',
        descNeptune: 'Neptune est la planète la plus venteuse avec des tempêtes atteignant 2 100 km/h! C\'est la planète la plus éloignée du Soleil et il lui faut 165 années terrestres pour compléter une orbite. Sa couleur bleue provient du méthane dans l\'atmosphère.',
        
        // Messages de chargement
        creatingMercury: 'Création de Mercure...',
        creatingVenus: 'Création de Vénus...',
        creatingEarth: 'Création de la Terre...',
        creatingMars: 'Création de Mars...',
        creatingJupiter: 'Création de Jupiter...',
        creatingSaturn: 'Création de Saturne...',
        creatingUranus: 'Création d\'Uranus...',
        creatingNeptune: 'Création de Neptune...',
        creatingAsteroidBelt: 'Création de la ceinture d\'astéroïdes...',
        creatingKuiperBelt: 'Création de la ceinture de Kuiper...',
        creatingStarfield: 'Création du champ d\'étoiles...',
        creatingOrbitalPaths: 'Création des trajectoires orbitales...',
        creatingConstellations: 'Création des constellations...',
        creatingDistantStars: 'Création des étoiles lointaines...',
        creatingNebulae: 'Création des nébuleuses...',
        creatingGalaxies: 'Création des galaxies...',
        creatingNearbyStars: 'Création des étoiles proches...',
        creatingExoplanets: 'Création des exoplanètes...',
        creatingComets: 'Création des comètes...',
        creatingLabels: 'Création des étiquettes...',
        creatingSatellites: 'Création des satellites...',
        creatingSpacecraft: 'Création des vaisseaux spatiaux...',
        
        // Texte système
        centerSolarSystem: 'Centre du Système Solaire',
        orbitsParent: 'Orbite',
        millionKmFromSun: 'millions de km du Soleil',
        distanceVaries: 'Distance variable',
        noDescription: 'Aucune description disponible',
        moonCount: 'Cette planète a',
        majorMoon: 'grande lune',
        majorMoons: 'grandes lunes',
        shownHere: 'affichées ici (beaucoup plus de petites lunes existent!)',
        
        // Faits amusants
        funFactSun: 'Le Soleil est si grand que 1,3 million de Terres pourraient tenir à l\'intérieur!',
        funFactMercury: 'Une année sur Mercure (88 jours terrestres) est plus courte que son jour (176 jours terrestres)!',
        funFactVenus: 'Vénus est la planète la plus brillante dans notre ciel et est souvent appelée le "jumeau maléfique" de la Terre',
        funFactEarth: 'La Terre est la seule planète qui ne porte pas le nom d\'un dieu. Elle voyage à 107 000 km/h autour du Soleil!',
        funFactMoon: 'La Lune s\'éloigne lentement de la Terre de 3,8 cm par an!',
        funFactMars: 'Mars a des saisons comme la Terre, et son jour ne dure que 37 minutes de plus que le nôtre!',
        funFactJupiter: 'La gravité de Jupiter protège la Terre de nombreux astéroïdes et comètes!',
        funFactSaturn: 'Les anneaux de Saturne ne font que 10 mètres d\'épaisseur mais 280 000 km de large!',
        funFactUranus: 'Uranus a été la première planète découverte avec un télescope (1781)!',
        funFactNeptune: 'Neptune a été découverte par les mathématiques avant d\'être vue - sa gravité affectait l\'orbite d\'Uranus!',
        funFactPluto: 'Une année sur Pluton dure 248 années terrestres! Elle n\'a pas complété une orbite depuis sa découverte en 1930.'
    },
    
    de: {
        // App-Titel und Kopfzeile
        appTitle: "Weltraumreise",
        subtitle: "Interaktives 3D-Sonnensystem",
        
        // Navigation
        quickNavigation: "Schnellnavigation",
        
        // Objektkategorien
        ourStar: "Unser Stern",
        sun: "Sonne",
        mercury: "Merkur",
        venus: "Venus",
        earthSystem: "Erdsystem",
        earth: "Erde",
        moon: "Mond",
        marsSystem: "Marssystem",
        mars: "Mars",
        phobos: "Phobos",
        deimos: "Deimos",
        jupiterSystem: "Jupitersystem",
        jupiter: "Jupiter",
        io: "Io",
        europa: "Europa",
        ganymede: "Ganymed",
        callisto: "Kallisto",
        saturnSystem: "Saturnsystem",
        saturn: "Saturn",
        titan: "Titan",
        uranusSystem: "Uranussystem",
        uranus: "Uranus",
        neptuneSystem: "Neptunsystem",
        neptune: "Neptun",
        
        // Steuerungstasten
        toggleOrbits: "Umlaufbahnen",
        toggleConstellations: "Sternbilder",
        toggleScale: "Pädagogischer Maßstab",
        toggleScaleRealistic: "Realistischer Maßstab",
        toggleLabels: "Beschriftungen AUS",
        toggleLabelsOn: "Beschriftungen EIN",
        resetView: "Zurücksetzen",
        enterVR: "VR Starten",
        enterAR: "AR Starten",
        
        // Geschwindigkeitssteuerung
        speedLabel: "Geschwindigkeit:",
        paused: "Pausiert",
        realTime: "1x Echtzeit",
        
        // Info-Panel
        name: "Name",
        type: "Typ",
        distance: "Entfernung",
        size: "Größe",
        description: "Beschreibung",
        
        // Ladebildschirm
        loading: "Lädt...",
        initializing: "Initialisierung...",
        settingUpScene: "Szene wird eingerichtet...",
        initializingControls: "Steuerung wird initialisiert...",
        loadingSolarSystem: "Sonnensystem wird geladen...",
        creatingSun: "Sonne wird erstellt...",
        selectObject: "Objekt Auswählen",
        clickToExplore: "Klicken Sie auf Objekte, um sie zu erkunden und mehr zu erfahren",
        
        // Hilfe
        help: "Hilfe",
        helpTitle: "Weltraumreise - Steuerung & Funktionen",
        controls: "Steuerung",
        mouseControls: "Maussteuerung:",
        leftClick: "Linksklick + Ziehen: Ansicht drehen",
        rightClick: "Rechtsklick + Ziehen: Ansicht verschieben",
        scroll: "Scrollen: Hinein-/Herauszoomen",
        clickObject: "Objekt klicken: Details anzeigen",
        keyboardShortcuts: "Tastaturkürzel:",
        spaceKey: "Leertaste: Pause/Fortsetzen",
        plusMinus: "+/-: Geschwindigkeit ändern",
        rKey: "R: Ansicht zurücksetzen",
        hKey: "H: Hilfe umschalten",
        lKey: "L: Laserpointer umschalten (VR)",
        features: "Funktionen",
        vrSupport: "VR/AR-Unterstützung mit WebXR",
        realisticOrbits: "Realistische Orbitalmechanik",
        educationalMode: "Pädagogische und realistische Maßstabsmodi",
        constellations: "Wichtige Sternbilder sichtbar",
        spacecraft: "Historische Raumfahrzeuge und Satelliten",
        
        // Benachrichtigungen
        updateAvailable: "Update Verfügbar",
        updateMessage: "Eine neue Version ist verfügbar!",
        updateButton: "Jetzt Aktualisieren",
        updateLater: "Später",
        offline: "Offline-Modus",
        offlineMessage: "Sie sind offline. Einige Funktionen können eingeschränkt sein.",
        installTitle: "Weltraumreise Installieren",
        installMessage: "Installieren Sie Weltraumreise als App für ein besseres Erlebnis!",
        installButton: "Installieren",
        installLater: "Vielleicht Später",
        errorLoading: "Fehler beim Laden der Weltraumreise",
        errorMessage: "Bitte aktualisieren Sie die Seite, um es erneut zu versuchen.",
        
        // Fußzeile
        madeWith: "Erstellt mit",
        and: "und",
        by: "von",
        
        // Objekttypen
        typeStar: 'Stern',
        typePlanet: 'Planet',
        typeMoon: 'Mond',
        typeSpacecraft: 'Raumfahrzeug',
        typeDwarfPlanet: 'Zwergplanet',
        typeNebula: 'Nebel',
        typeGalaxy: 'Galaxie',
        
        // Objektbeschreibungen
        descSun: 'Die Sonne ist ein Hauptreihenstern vom Typ G (Gelber Zwerg), der 99,86% der Masse des Sonnensystems enthält. Oberflächentemperatur: 5.778 K. Alter: 4,6 Milliarden Jahre. Sie verschmilzt jede Sekunde 600 Millionen Tonnen Wasserstoff zu Helium!',
        descMercury: 'Merkur ist der kleinste Planet und der sonnennächste. Seine Oberfläche ist wie unser Mond mit Kratern bedeckt. Die Temperatur reicht von -180°C nachts bis 430°C tagsüber - die größte Temperaturspanne im Sonnensystem!',
        descVenus: 'Venus ist mit 465°C der heißeste Planet aufgrund eines extremen Treibhauseffekts. Ihre Atmosphäre besteht zu 96% aus CO2 mit Wolken aus Schwefelsäure. Venus rotiert rückwärts im Vergleich zu den meisten Planeten!',
        descEarth: 'Die Erde ist unser Zuhause, der einzige bekannte Planet mit Leben! 71% sind mit Wasser bedeckt, was die blaue Farbe aus dem Weltraum erzeugt. Die Atmosphäre schützt uns vor schädlicher Strahlung und Meteoriten.',
        descMoon: 'Der Erdmond ist der fünftgrößte Mond im Sonnensystem. Er erzeugt Gezeiten, stabilisiert die Neigung der Erde und entstand vor 4,5 Milliarden Jahren, als ein marsgroßes Objekt die Erde traf!',
        descMars: 'Mars, der Rote Planet, verdankt seine Farbe Eisenoxid (Rost). Er hat den größten Vulkan (Olympus Mons - 22 km hoch) und die längste Schlucht (Valles Marineris - 4.000 km lang) im Sonnensystem. An seinen Polen existiert Wassereis!',
        descJupiter: 'Jupiter ist der größte Planet - alle anderen Planeten würden hineinpassen! Der Große Rote Fleck ist ein Sturm größer als die Erde, der seit mindestens 400 Jahren tobt. Jupiter hat 95 bekannte Monde!',
        descSaturn: 'Saturn ist berühmt für sein spektakuläres Ringsystem aus Eis- und Gesteinpartikeln. Er ist der am wenigsten dichte Planet - er würde in Wasser schwimmen! Saturn hat 146 bekannte Monde, darunter Titan mit seiner dichten Atmosphäre.',
        descUranus: 'Uranus ist einzigartig - er rotiert auf der Seite! Das bedeutet, dass seine Pole während seiner 84-jährigen Umlaufbahn abwechselnd zur Sonne zeigen. Er besteht aus Wasser-, Methan- und Ammoniakeis und erscheint blaugrün durch Methan in seiner Atmosphäre.',
        descNeptune: 'Neptun ist der windigste Planet mit Stürmen von bis zu 2.100 km/h! Er ist der am weitesten von der Sonne entfernte Planet und braucht 165 Erdjahre für eine Umlaufbahn. Seine blaue Farbe stammt von Methan in der Atmosphäre.',
        
        // Lademeldungen
        creatingMercury: 'Merkur wird erstellt...',
        creatingVenus: 'Venus wird erstellt...',
        creatingEarth: 'Erde wird erstellt...',
        creatingMars: 'Mars wird erstellt...',
        creatingJupiter: 'Jupiter wird erstellt...',
        creatingSaturn: 'Saturn wird erstellt...',
        creatingUranus: 'Uranus wird erstellt...',
        creatingNeptune: 'Neptun wird erstellt...',
        creatingAsteroidBelt: 'Asteroidengürtel wird erstellt...',
        creatingKuiperBelt: 'Kuipergürtel wird erstellt...',
        creatingStarfield: 'Sternfeld wird erstellt...',
        creatingOrbitalPaths: 'Umlaufbahnen werden erstellt...',
        creatingConstellations: 'Sternbilder werden erstellt...',
        creatingDistantStars: 'Ferne Sterne werden erstellt...',
        creatingNebulae: 'Nebel werden erstellt...',
        creatingGalaxies: 'Galaxien werden erstellt...',
        creatingNearbyStars: 'Nahe Sterne werden erstellt...',
        creatingExoplanets: 'Exoplaneten werden erstellt...',
        creatingComets: 'Kometen werden erstellt...',
        creatingLabels: 'Beschriftungen werden erstellt...',
        creatingSatellites: 'Satelliten werden erstellt...',
        creatingSpacecraft: 'Raumfahrzeuge werden erstellt...',
        
        // Systemtext
        centerSolarSystem: 'Zentrum des Sonnensystems',
        orbitsParent: 'Umkreist',
        millionKmFromSun: 'Millionen km von der Sonne',
        distanceVaries: 'Entfernung variiert',
        noDescription: 'Keine Beschreibung verfügbar',
        moonCount: 'Dieser Planet hat',
        majorMoon: 'großer Mond',
        majorMoons: 'große Monde',
        shownHere: 'hier gezeigt (viele weitere kleine existieren!)',
        
        // Lustige Fakten
        funFactSun: 'Die Sonne ist so groß, dass 1,3 Millionen Erden hineinpassen würden!',
        funFactMercury: 'Ein Jahr auf Merkur (88 Erdtage) ist kürzer als sein Tag (176 Erdtage)!',
        funFactVenus: 'Venus ist der hellste Planet an unserem Himmel und wird oft als "böser Zwilling" der Erde bezeichnet',
        funFactEarth: 'Die Erde ist der einzige Planet, der nicht nach einem Gott benannt ist. Sie reist mit 107.000 km/h um die Sonne!',
        funFactMoon: 'Der Mond entfernt sich langsam von der Erde mit 3,8 cm pro Jahr!',
        funFactMars: 'Mars hat wie die Erde Jahreszeiten, und sein Tag ist nur 37 Minuten länger als unserer!',
        funFactJupiter: 'Jupiters Schwerkraft schützt die Erde vor vielen Asteroiden und Kometen!',
        funFactSaturn: 'Saturns Ringe sind nur 10 Meter dick, aber 280.000 km breit!',
        funFactUranus: 'Uranus war der erste Planet, der mit einem Teleskop entdeckt wurde (1781)!',
        funFactNeptune: 'Neptun wurde durch Mathematik entdeckt, bevor er gesehen wurde - seine Schwerkraft beeinflusste die Umlaufbahn von Uranus!',
        funFactPluto: 'Ein Jahr auf Pluto dauert 248 Erdjahre! Er hat seit seiner Entdeckung 1930 noch keine Umlaufbahn vollendet.'
    },
    
    es: {
        // Título y encabezado de la aplicación
        appTitle: "Viaje Espacial",
        subtitle: "Sistema Solar 3D Interactivo",
        
        // Navegación
        quickNavigation: "Navegación Rápida",
        
        // Categorías de objetos
        ourStar: "Nuestra Estrella",
        sun: "Sol",
        mercury: "Mercurio",
        venus: "Venus",
        earthSystem: "Sistema Terrestre",
        earth: "Tierra",
        moon: "Luna",
        marsSystem: "Sistema Marciano",
        mars: "Marte",
        phobos: "Fobos",
        deimos: "Deimos",
        jupiterSystem: "Sistema Joviano",
        jupiter: "Júpiter",
        io: "Ío",
        europa: "Europa",
        ganymede: "Ganímedes",
        callisto: "Calisto",
        saturnSystem: "Sistema Saturniano",
        saturn: "Saturno",
        titan: "Titán",
        uranusSystem: "Sistema de Urano",
        uranus: "Urano",
        neptuneSystem: "Sistema Neptuniano",
        neptune: "Neptuno",
        
        // Botones de control
        toggleOrbits: "Órbitas",
        toggleConstellations: "Constelaciones",
        toggleScale: "Escala Educativa",
        toggleScaleRealistic: "Escala Realista",
        toggleLabels: "Etiquetas DESACTIVADAS",
        toggleLabelsOn: "Etiquetas ACTIVADAS",
        resetView: "Restablecer",
        enterVR: "Entrar en RV",
        enterAR: "Entrar en RA",
        
        // Control de velocidad
        speedLabel: "Velocidad:",
        paused: "En pausa",
        realTime: "1x Tiempo real",
        
        // Panel de información
        name: "Nombre",
        type: "Tipo",
        distance: "Distancia",
        size: "Tamaño",
        description: "Descripción",
        
        // Pantalla de carga
        loading: "Cargando...",
        initializing: "Inicializando...",
        settingUpScene: "Configurando escena...",
        initializingControls: "Inicializando controles...",
        loadingSolarSystem: "Cargando sistema solar...",
        creatingSun: "Creando el Sol...",
        selectObject: "Seleccionar un Objeto",
        clickToExplore: "Haz clic en los objetos para explorar y aprender más",
        
        // Ayuda
        help: "Ayuda",
        helpTitle: "Viaje Espacial - Controles y Funciones",
        controls: "Controles",
        mouseControls: "Controles del Ratón:",
        leftClick: "Clic Izquierdo + Arrastrar: Rotar vista",
        rightClick: "Clic Derecho + Arrastrar: Mover vista",
        scroll: "Rueda: Acercar/Alejar",
        clickObject: "Clic en Objeto: Ver detalles",
        keyboardShortcuts: "Atajos de Teclado:",
        spaceKey: "Espacio: Pausar/Reanudar",
        plusMinus: "+/-: Cambiar velocidad",
        rKey: "R: Restablecer vista",
        hKey: "H: Alternar ayuda",
        lKey: "L: Alternar punteros láser (RV)",
        features: "Funciones",
        vrSupport: "Soporte RV/RA con WebXR",
        realisticOrbits: "Mecánica orbital realista",
        educationalMode: "Modos de escala educativo y realista",
        constellations: "Principales constelaciones visibles",
        spacecraft: "Naves espaciales y satélites históricos",
        
        // Notificaciones
        updateAvailable: "Actualización Disponible",
        updateMessage: "¡Una nueva versión está disponible!",
        updateButton: "Actualizar Ahora",
        updateLater: "Más Tarde",
        offline: "Modo Sin Conexión",
        offlineMessage: "Estás sin conexión. Algunas funciones pueden estar limitadas.",
        installTitle: "Instalar Viaje Espacial",
        installMessage: "¡Instala Viaje Espacial como aplicación para una mejor experiencia!",
        installButton: "Instalar",
        installLater: "Quizás Más Tarde",
        errorLoading: "Error al cargar Viaje Espacial",
        errorMessage: "Por favor, actualiza la página para intentarlo de nuevo.",
        
        // Pie de página
        madeWith: "Hecho con",
        and: "y",
        by: "por",
        
        // Tipos de objetos
        typeStar: 'Estrella',
        typePlanet: 'Planeta',
        typeMoon: 'Luna',
        typeSpacecraft: 'Nave Espacial',
        typeDwarfPlanet: 'Planeta Enano',
        typeNebula: 'Nebulosa',
        typeGalaxy: 'Galaxia',
        
        // Descripciones de objetos
        descSun: 'El Sol es una estrella de tipo G (enana amarilla) que contiene el 99,86% de la masa del Sistema Solar. Temperatura superficial: 5.778 K. Edad: 4,6 mil millones de años. ¡Fusiona 600 millones de toneladas de hidrógeno en helio cada segundo!',
        descMercury: 'Mercurio es el planeta más pequeño y el más cercano al Sol. Su superficie está cubierta de cráteres como nuestra Luna. La temperatura varía de -180°C por la noche a 430°C durante el día: ¡el mayor rango de temperatura en el sistema solar!',
        descVenus: 'Venus es el planeta más caliente con una temperatura superficial de 465°C debido a un efecto invernadero extremo. Su atmósfera es 96% CO2 con nubes de ácido sulfúrico. ¡Venus gira hacia atrás en comparación con la mayoría de los planetas!',
        descEarth: 'La Tierra es nuestro hogar, ¡el único planeta conocido con vida! El 71% está cubierto de agua, creando el color azul visible desde el espacio. La atmósfera nos protege de la radiación dañina y los meteoros.',
        descMoon: 'La Luna terrestre es la quinta luna más grande del sistema solar. Crea las mareas, estabiliza la inclinación de la Tierra y se formó hace 4,5 mil millones de años cuando un objeto del tamaño de Marte impactó la Tierra!',
        descMars: 'Marte, el Planeta Rojo, debe su color al óxido de hierro (óxido). Tiene el volcán más grande (Olympus Mons - 22 km de altura) y el cañón más largo (Valles Marineris - 4.000 km de largo) del sistema solar. ¡Existe hielo de agua en sus polos!',
        descJupiter: 'Júpiter es el planeta más grande: ¡todos los demás planetas podrían caber dentro! La Gran Mancha Roja es una tormenta más grande que la Tierra que ha estado activa durante al menos 400 años. ¡Júpiter tiene 95 lunas conocidas!',
        descSaturn: 'Saturno es famoso por su espectacular sistema de anillos compuestos de partículas de hielo y roca. ¡Es el planeta menos denso: flotaría en agua! Saturno tiene 146 lunas conocidas, incluida Titán, que tiene una atmósfera densa.',
        descUranus: 'Urano es único: ¡gira de lado! Esto significa que sus polos se turnan para mirar al Sol durante su órbita de 84 años. Compuesto de hielos de agua, metano y amoníaco, aparece de color azul verdoso debido al metano en su atmósfera.',
        descNeptune: 'Neptuno es el planeta más ventoso con tormentas que alcanzan ¡2.100 km/h! Es el planeta más lejano del Sol y tarda 165 años terrestres en completar una órbita. Su color azul proviene del metano en la atmósfera.',
        
        // Mensajes de carga
        creatingMercury: 'Creando Mercurio...',
        creatingVenus: 'Creando Venus...',
        creatingEarth: 'Creando la Tierra...',
        creatingMars: 'Creando Marte...',
        creatingJupiter: 'Creando Júpiter...',
        creatingSaturn: 'Creando Saturno...',
        creatingUranus: 'Creando Urano...',
        creatingNeptune: 'Creando Neptuno...',
        creatingAsteroidBelt: 'Creando cinturón de asteroides...',
        creatingKuiperBelt: 'Creando cinturón de Kuiper...',
        creatingStarfield: 'Creando campo estelar...',
        creatingOrbitalPaths: 'Creando trayectorias orbitales...',
        creatingConstellations: 'Creando constelaciones...',
        creatingDistantStars: 'Creando estrellas distantes...',
        creatingNebulae: 'Creando nebulosas...',
        creatingGalaxies: 'Creando galaxias...',
        creatingNearbyStars: 'Creando estrellas cercanas...',
        creatingExoplanets: 'Creando exoplanetas...',
        creatingComets: 'Creando cometas...',
        creatingLabels: 'Creando etiquetas...',
        creatingSatellites: 'Creando satélites...',
        creatingSpacecraft: 'Creando naves espaciales...',
        
        // Texto del sistema
        centerSolarSystem: 'Centro del Sistema Solar',
        orbitsParent: 'Orbita',
        millionKmFromSun: 'millones de km del Sol',
        distanceVaries: 'Distancia varía',
        noDescription: 'No hay descripción disponible',
        moonCount: 'Este planeta tiene',
        majorMoon: 'luna grande',
        majorMoons: 'lunas grandes',
        shownHere: 'mostradas aquí (¡existen muchas más pequeñas!)',
        
        // Datos curiosos
        funFactSun: '¡El Sol es tan grande que 1,3 millones de Tierras podrían caber dentro!',
        funFactMercury: '¡Un año en Mercurio (88 días terrestres) es más corto que su día (176 días terrestres)!',
        funFactVenus: 'Venus es el planeta más brillante en nuestro cielo y a menudo se le llama el "gemelo malvado" de la Tierra',
        funFactEarth: '¡La Tierra es el único planeta que no lleva el nombre de un dios. Viaja a 107.000 km/h alrededor del Sol!',
        funFactMoon: '¡La Luna se está alejando lentamente de la Tierra a 3,8 cm por año!',
        funFactMars: '¡Marte tiene estaciones como la Tierra, y su día es solo 37 minutos más largo que el nuestro!',
        funFactJupiter: '¡La gravedad de Júpiter protege a la Tierra de muchos asteroides y cometas!',
        funFactSaturn: '¡Los anillos de Saturno tienen solo 10 metros de espesor pero 280.000 km de ancho!',
        funFactUranus: '¡Urano fue el primer planeta descubierto con un telescopio (1781)!',
        funFactNeptune: '¡Neptuno fue descubierto por matemáticas antes de ser visto: su gravedad afectaba la órbita de Urano!',
        funFactPluto: '¡Un año en Plutón dura 248 años terrestres! No ha completado una órbita desde su descubrimiento en 1930.'
    },
    
    pt: {
        // Título e cabeçalho do aplicativo
        appTitle: "Viagem Espacial",
        subtitle: "Sistema Solar 3D Interativo",
        
        // Navegação
        quickNavigation: "Navegação Rápida",
        
        // Categorias de objetos
        ourStar: "Nossa Estrela",
        sun: "Sol",
        mercury: "Mercúrio",
        venus: "Vênus",
        earthSystem: "Sistema Terrestre",
        earth: "Terra",
        moon: "Lua",
        marsSystem: "Sistema Marciano",
        mars: "Marte",
        phobos: "Fobos",
        deimos: "Deimos",
        jupiterSystem: "Sistema Joviano",
        jupiter: "Júpiter",
        io: "Io",
        europa: "Europa",
        ganymede: "Ganimedes",
        callisto: "Calisto",
        saturnSystem: "Sistema Saturniano",
        saturn: "Saturno",
        titan: "Titã",
        uranusSystem: "Sistema de Urano",
        uranus: "Urano",
        neptuneSystem: "Sistema Netuniano",
        neptune: "Netuno",
        
        // Botões de controle
        toggleOrbits: "Órbitas",
        toggleConstellations: "Constelações",
        toggleScale: "Escala Educacional",
        toggleScaleRealistic: "Escala Realista",
        toggleLabels: "Rótulos DESLIGADOS",
        toggleLabelsOn: "Rótulos LIGADOS",
        resetView: "Redefinir",
        enterVR: "Entrar em RV",
        enterAR: "Entrar em RA",
        
        // Controle de velocidade
        speedLabel: "Velocidade:",
        paused: "Pausado",
        realTime: "1x Tempo real",
        
        // Painel de informações
        name: "Nome",
        type: "Tipo",
        distance: "Distância",
        size: "Tamanho",
        description: "Descrição",
        
        // Tela de carregamento
        loading: "Carregando...",
        initializing: "Inicializando...",
        settingUpScene: "Configurando cena...",
        initializingControls: "Inicializando controles...",
        loadingSolarSystem: "Carregando sistema solar...",
        creatingSun: "Criando o Sol...",
        selectObject: "Selecionar um Objeto",
        clickToExplore: "Clique nos objetos para explorar e aprender mais",
        
        // Ajuda
        help: "Ajuda",
        helpTitle: "Viagem Espacial - Controles e Recursos",
        controls: "Controles",
        mouseControls: "Controles do Mouse:",
        leftClick: "Clique Esquerdo + Arrastar: Girar visualização",
        rightClick: "Clique Direito + Arrastar: Mover visualização",
        scroll: "Scroll: Aproximar/Afastar",
        clickObject: "Clique no Objeto: Ver detalhes",
        keyboardShortcuts: "Atalhos do Teclado:",
        spaceKey: "Espaço: Pausar/Retomar",
        plusMinus: "+/-: Mudar velocidade",
        rKey: "R: Redefinir visualização",
        hKey: "H: Alternar ajuda",
        lKey: "L: Alternar ponteiros laser (RV)",
        features: "Recursos",
        vrSupport: "Suporte RV/RA com WebXR",
        realisticOrbits: "Mecânica orbital realista",
        educationalMode: "Modos de escala educacional e realista",
        constellations: "Principais constelações visíveis",
        spacecraft: "Naves espaciais e satélites históricos",
        
        // Notificações
        updateAvailable: "Atualização Disponível",
        updateMessage: "Uma nova versão está disponível!",
        updateButton: "Atualizar Agora",
        updateLater: "Mais Tarde",
        offline: "Modo Offline",
        offlineMessage: "Você está offline. Alguns recursos podem estar limitados.",
        installTitle: "Instalar Viagem Espacial",
        installMessage: "Instale Viagem Espacial como aplicativo para uma melhor experiência!",
        installButton: "Instalar",
        installLater: "Talvez Mais Tarde",
        errorLoading: "Erro ao carregar Viagem Espacial",
        errorMessage: "Por favor, atualize a página para tentar novamente.",
        
        // Rodapé
        madeWith: "Feito com",
        and: "e",
        by: "por",
        
        // Tipos de objetos
        typeStar: 'Estrela',
        typePlanet: 'Planeta',
        typeMoon: 'Lua',
        typeSpacecraft: 'Nave Espacial',
        typeDwarfPlanet: 'Planeta Anão',
        typeNebula: 'Nebulosa',
        typeGalaxy: 'Galáxia',
        
        // Descrições de objetos
        descSun: 'O Sol é uma estrela de tipo G (anã amarela) contendo 99,86% da massa do Sistema Solar. Temperatura da superfície: 5.778 K. Idade: 4,6 bilhões de anos. Ele funde 600 milhões de toneladas de hidrogênio em hélio a cada segundo!',
        descMercury: 'Mercúrio é o menor planeta e o mais próximo do Sol. Sua superfície é coberta com crateras como nossa Lua. A temperatura varia de -180°C à noite a 430°C durante o dia - a maior variação de temperatura no sistema solar!',
        descVenus: 'Vênus é o planeta mais quente com temperatura de superfície de 465°C devido a um efeito estufa extremo. Sua atmosfera é 96% CO2 com nuvens de ácido sulfúrico. Vênus gira para trás em comparação com a maioria dos planetas!',
        descEarth: 'A Terra é nosso lar, o único planeta conhecido com vida! 71% é coberto por água, criando a cor azul visível do espaço. A atmosfera nos protege de radiação nociva e meteoros.',
        descMoon: 'A Lua da Terra é a quinta maior lua do sistema solar. Ela cria as marés, estabiliza a inclinação da Terra e foi formada há 4,5 bilhões de anos quando um objeto do tamanho de Marte colidiu com a Terra!',
        descMars: 'Marte, o Planeta Vermelho, deve sua cor ao óxido de ferro (ferrugem). Ele tem o maior vulcão (Olympus Mons - 22 km de altura) e o cânion mais longo (Valles Marineris - 4.000 km de comprimento) do sistema solar. Existe gelo de água em seus polos!',
        descJupiter: 'Júpiter é o maior planeta - todos os outros planetas poderiam caber dentro dele! A Grande Mancha Vermelha é uma tempestade maior que a Terra que tem durado pelo menos 400 anos. Júpiter tem 95 luas conhecidas!',
        descSaturn: 'Saturno é famoso por seu espetacular sistema de anéis feito de partículas de gelo e rocha. É o planeta menos denso - flutuaria na água! Saturno tem 146 luas conhecidas, incluindo Titã, que tem uma atmosfera densa.',
        descUranus: 'Urano é único - ele gira de lado! Isso significa que seus polos se revezam voltados para o Sol durante sua órbita de 84 anos. Feito de gelos de água, metano e amônia, aparece azul-esverdeado devido ao metano em sua atmosfera.',
        descNeptune: 'Netuno é o planeta mais ventoso com tempestades alcançando 2.100 km/h! É o planeta mais distante do Sol e leva 165 anos terrestres para completar uma órbita. Sua cor azul vem do metano na atmosfera.',
        
        // Mensagens de carregamento
        creatingMercury: 'Criando Mercúrio...',
        creatingVenus: 'Criando Vênus...',
        creatingEarth: 'Criando a Terra...',
        creatingMars: 'Criando Marte...',
        creatingJupiter: 'Criando Júpiter...',
        creatingSaturn: 'Criando Saturno...',
        creatingUranus: 'Criando Urano...',
        creatingNeptune: 'Criando Netuno...',
        creatingAsteroidBelt: 'Criando cinturão de asteroides...',
        creatingKuiperBelt: 'Criando cinturão de Kuiper...',
        creatingStarfield: 'Criando campo estelar...',
        creatingOrbitalPaths: 'Criando trajetórias orbitais...',
        creatingConstellations: 'Criando constelações...',
        creatingDistantStars: 'Criando estrelas distantes...',
        creatingNebulae: 'Criando nebulosas...',
        creatingGalaxies: 'Criando galáxias...',
        creatingNearbyStars: 'Criando estrelas próximas...',
        creatingExoplanets: 'Criando exoplanetas...',
        creatingComets: 'Criando cometas...',
        creatingLabels: 'Criando rótulos...',
        creatingSatellites: 'Criando satélites...',
        creatingSpacecraft: 'Criando naves espaciais...',
        
        // Texto do sistema
        centerSolarSystem: 'Centro do Sistema Solar',
        orbitsParent: 'Orbita',
        millionKmFromSun: 'milhões de km do Sol',
        distanceVaries: 'Distância varia',
        noDescription: 'Nenhuma descrição disponível',
        moonCount: 'Este planeta tem',
        majorMoon: 'lua grande',
        majorMoons: 'luas grandes',
        shownHere: 'mostradas aqui (muitas mais pequenas existem!)',
        
        // Fatos divertidos
        funFactSun: 'O Sol é tão grande que 1,3 milhão de Terras poderiam caber dentro dele!',
        funFactMercury: 'Um ano em Mercúrio (88 dias terrestres) é mais curto que seu dia (176 dias terrestres)!',
        funFactVenus: 'Vênus é o planeta mais brilhante em nosso céu e é frequentemente chamado de "gêmeo maligno" da Terra',
        funFactEarth: 'A Terra é o único planeta que não tem o nome de um deus. Ela viaja a 107.000 km/h ao redor do Sol!',
        funFactMoon: 'A Lua está lentamente se afastando da Terra a 3,8 cm por ano!',
        funFactMars: 'Marte tem estações como a Terra, e seu dia é apenas 37 minutos mais longo que o nosso!',
        funFactJupiter: 'A gravidade de Júpiter protege a Terra de muitos asteroides e cometas!',
        funFactSaturn: 'Os anéis de Saturno têm apenas 10 metros de espessura, mas 280.000 km de largura!',
        funFactUranus: 'Urano foi o primeiro planeta descoberto com um telescópio (1781)!',
        funFactNeptune: 'Netuno foi descoberto pela matemática antes de ser visto - sua gravidade afetava a órbita de Urano!',
        funFactPluto: 'Um ano em Plutão dura 248 anos terrestres! Ele não completou uma órbita desde sua descoberta em 1930.'
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
    const languageNames = { en: 'English', nl: 'Nederlands', fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese' };
    console.log(`[i18n] Applying ${languageNames[lang] || lang} translations`);
    
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

// Function to change language
function setLanguage(lang) {
    const supportedLanguages = ['en', 'nl', 'fr', 'de', 'es', 'pt'];
    if (!supportedLanguages.includes(lang)) {
        console.warn('[i18n] Invalid language:', lang, '- using English');
        lang = 'en';
    }
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Store preference
    localStorage.setItem('appLanguage', lang);
    
    // Update manifest link
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
        manifestLink.href = manifestFiles[lang] || './manifest.json';
    }
    
    // Re-apply translations
    applyTranslations();
    
    const languageNames = { en: 'English', nl: 'Nederlands', fr: 'Français', de: 'Deutsch', es: 'Español', pt: 'Português' };
    console.log('[i18n] Language changed to:', languageNames[lang] || lang);
}

// Initialize language UI on page load
// Note: Language detection is already handled by index.html inline script
// This function just updates the UI to match the detected language
function initLanguage() {
    const lang = getCurrentLanguage();
    
    // Update language selector to match current language
    const selector = document.getElementById('language-selector');
    if (selector) {
        selector.value = lang;
        
        // Add change event listener
        selector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
    
    // Apply translations
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
