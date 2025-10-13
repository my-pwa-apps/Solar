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
        pluto: "Pluto",
        charon: "Charon",
        enceladus: "Enceladus",
        rhea: "Rhea",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Triton",
        
        // Navigation menu sections
        navOurStar: "Our Star",
        navInnerPlanets: "Inner Planets (Rocky)",
        navAsteroidBelt: "Asteroid Belt",
        navOuterPlanets: "Outer Planets (Gas Giants)",
        navIceGiants: "Ice Giants",
        navKuiperBelt: "Kuiper Belt & Dwarf Planets",
        navComets: "Comets",
        navSatellites: "Satellites & Space Stations",
        navSpacecraft: "Spacecraft & Probes",
        navDistantStars: "Distant Stars",
        kuiperBelt: "Kuiper Belt",
        asteroidBelt: "Asteroid Belt",
        
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
        descMercury: 'Mercury is the smallest planet and closest to the Sun. Its surface is covered with craters like our Moon. Temperature ranges from -180Â°C at night to 430Â°C during the day - the largest temperature swing in the solar system!',
        descVenus: 'Venus is the hottest planet with surface temperature of 465Â°C due to extreme greenhouse effect. Its atmosphere is 96% CO2 with clouds of sulfuric acid. Venus rotates backwards compared to most planets!',
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
        funFactPluto: 'A year on Pluto lasts 248 Earth years! It hasn\'t completed one orbit since its discovery in 1930.',
        
        // Moon descriptions
        descPhobos: 'Phobos orbits Mars faster than Mars rotates! It rises in the west and sets in the east.',
        descDeimos: 'Deimos is the smaller of Mars\' two moons and takes 30 hours to orbit.',
        descIo: 'Io is the most volcanically active body in the solar system!',
        descEuropa: 'Europa has a global ocean beneath its ice - a potential place for life!',
        descGanymede: 'Ganymede is the largest moon in the solar system, bigger than Mercury!',
        descCallisto: 'Callisto is the most heavily cratered object in the solar system!',
        descTitan: 'Titan has lakes and rivers of liquid methane - the only place besides Earth with liquid on its surface!',
        descEnceladus: 'Enceladus shoots water geysers into space from its subsurface ocean!',
        descRhea: 'Rhea may have its own ring system!',
        descTitania: 'Titania is Uranus\' largest moon with massive canyons!',
        descMiranda: 'Miranda has the most dramatic terrain in the solar system with cliffs 20 km high!',
        descTriton: 'Triton orbits backwards and has nitrogen geysers! It\'s likely a captured Kuiper Belt object.',
        descCharon: 'Charon is so large relative to Pluto that they form a binary system!',
        
        // Satellite descriptions and fun facts
        descISS: 'ISS orbits at 400 km altitude, completing one orbit every 92.68 minutes (15.54 orbits/day). Launched Nov 20, 1998 (Zarya module). Assembly: 1998-2011 (42 flights: 36 Shuttle, 6 Russian). Mass: 419,725 kg. Pressurized volume: 1,000 mÂ³. Continuous occupation since Nov 2, 2000 (24+ years, 9,000+ days). 280+ astronauts from 23 countries visited.',
        funFactISS: 'The ISS travels at 27,600 km/h! Astronauts see 16 sunrises/sunsets per day. It\'s been continuously occupied for 24+ years - longer than any other spacecraft!',
        descHubble: 'Launched April 24, 1990 on Space Shuttle Discovery. Orbits at ~535 km altitude. Made 1.6+ million observations as of Oct 2025. 2.4m primary mirror observes UV, visible, and near-IR. Five servicing missions (1993-2009) upgraded instruments.',
        funFactHubble: 'Can resolve objects 0.05 arcseconds apart - like seeing two fireflies 10,000 km away! Deepest image (eXtreme Deep Field) shows 5,500 galaxies, some 13.2 billion light-years away.',
        descGPS: 'GPS (NAVSTAR) constellation: 31 operational satellites (as of Oct 2025) in 6 orbital planes, 55Â° inclination. Each satellite orbits at 20,180 km altitude. Transmits L-band signals (1.2-1.5 GHz). Rubidium/cesium atomic clocks accurate to 10â»Â¹â´ seconds.',
        funFactGPS: 'Need 4 satellites for 3D position fix (trilateration + clock correction). System provides 5-10m accuracy. Military signal (P/Y code) accurate to centimeters!',
        descJWST: 'Launched Dec 25, 2021. Reached L2 point Jan 24, 2022. First images released July 12, 2022. Observes infrared (0.6-28.5 Î¼m). 6.5m segmented beryllium mirror (18 hexagons) with 25 mÂ² collecting area - 6x Hubble! Sunshield: 21.2m Ã— 14.2m, 5 layers.',
        funFactJWST: 'Operating at -233C (-388F)! Can detect heat signature of a bumblebee at Moon distance. Discovered earliest galaxies at z=14 (280 million years after Big Bang).',
        
        // Spacecraft descriptions and fun facts
        descVoyager1: 'Voyager 1 is the farthest human-made object from Earth! Launched Sept 5, 1977, it entered interstellar space on Aug 25, 2012. Currently 24.3 billion km (162 AU) from Sun. It carries the Golden Record with sounds and images of Earth.',
        funFactVoyager1: 'Voyager 1 travels at 17 km/s (61,200 km/h). Its radio signals take 22.5 hours to reach Earth!',
        descVoyager2: 'Voyager 2 is the only spacecraft to visit all four giant planets! Jupiter (Jul 1979), Saturn (Aug 1981), Uranus (Jan 1986), Neptune (Aug 1989). Entered interstellar space Nov 5, 2018. Now 20.3 billion km (135 AU) from Sun.',
        funFactVoyager2: 'Voyager 2 discovered 16 moons across the giant planets, Neptune\'s Great Dark Spot, and Triton\'s geysers!',
        descNewHorizons: 'New Horizons gave us the first close-up images of Pluto on July 14, 2015! It revealed water ice mountains up to 3,500m tall, vast nitrogen glaciers, and the famous heart-shaped Tombaugh Regio. Now 59 AU from Sun, exploring Kuiper Belt.',
        funFactNewHorizons: 'New Horizons traveled 9.5 years and 5 billion km to reach Pluto at 58,536 km/h. It carries 1 oz of Clyde Tombaugh\'s ashes!',
        descJuno: 'Juno entered Jupiter orbit July 4, 2016. Studies composition, gravity field, magnetic field, and polar auroras. Discovered Jupiter\'s core is larger and "fuzzy", massive polar cyclones, and atmospheric ammonia distribution. Extended mission until Sept 2025.',
        funFactJuno: 'First solar-powered spacecraft at Jupiter! Three 9m solar panels generate 500W. Carries three LEGO figurines: Galileo, Jupiter, and Juno!',
        descCassini: 'Cassini orbited Saturn June 30, 2004 - Sept 15, 2017 (13 years). Discovered liquid methane/ethane lakes on Titan, water geysers on Enceladus, new rings, 7 new moons. Huygens probe landed on Titan Jan 14, 2005. Ended with atmospheric entry "Grand Finale".',
        funFactCassini: 'Discovered Enceladus\' subsurface ocean! Water geysers shoot 250kg/s into space. Cassini flew through plumes, detected H2, organics - ingredients for life!',
        descPioneer10: 'Pioneer 10 was the first spacecraft to travel through the asteroid belt and first to visit Jupiter (Dec 3, 1973)! Launched March 2, 1972, it carried the famous Pioneer plaque showing humans and Earth\'s location. Last contact: Jan 23, 2003 at 12.2 billion km.',
        funFactPioneer10: 'Pioneer 10 carries a gold plaque designed by Carl Sagan showing a man, woman, and Earth\'s location - a message to any aliens who might find it!',
        descPioneer11: 'Pioneer 11 was the first spacecraft to visit Saturn (Sept 1, 1979)! Also flew by Jupiter (Dec 2, 1974). Launched April 5, 1973, it discovered Saturn\'s F ring and a new moon. Also carries the Pioneer plaque. Last contact: Nov 24, 1995 at 6.5 billion km.',
        funFactPioneer11: 'Pioneer 11 used Jupiter\'s gravity for the first planetary gravity assist, saving years of travel time to Saturn!',
        
        // Comet descriptions
        descHalley: 'Halley\'s Comet is the most famous comet! It returns to Earth\'s vicinity every 75-76 years. Last seen in 1986, it will return in 2061. When you see it, you\'re viewing a 4.6 billion year old cosmic snowball!',
        descHaleBopp: 'Hale-Bopp was one of the brightest comets of the 20th century, visible to the naked eye for 18 months in 1996-1997! Its nucleus is unusually large at 60 km in diameter.',
        descNeowise: 'Comet NEOWISE was a spectacular sight in July 2020! It won\'t return for about 6,800 years. Comets are "dirty snowballs" made of ice, dust, and rock from the solar system\'s formation.'
    },
    
    nl: {
        // App titel en header
        appTitle: "Ruimtereis",
        subtitle: "Interactief 3D Zonnestelsel",
        
        // Navigatie
        quickNavigation: "Snelle Navigatie",
        
        // Object categorieÃ«n
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
        pluto: "Pluto",
        charon: "Charon",
        enceladus: "Enceladus",
        rhea: "Rhea",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Triton",
        
        // Navigatiemenu secties
        navOurStar: "Onze Ster",
        navInnerPlanets: "Binnenste Planeten (Rotsachtig)",
        navAsteroidBelt: "AsteroÃ¯dengordel",
        navOuterPlanets: "Buitenste Planeten (Gasreuzen)",
        navIceGiants: "IJsreuzen",
        navKuiperBelt: "Kuipergordel & Dwergplaneten",
        navComets: "Kometen",
        navSatellites: "Satellieten & Ruimtestations",
        navSpacecraft: "Ruimtevaartuigen & Sondes",
        navDistantStars: "Verre Sterren",
        kuiperBelt: "Kuipergordel",
        asteroidBelt: "AsteroÃ¯dengordel",
        
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
        settingUpScene: "ScÃ¨ne opzetten...",
        initializingControls: "Besturing initialiseren...",
        loadingSolarSystem: "Zonnestelsel laden...",
        creatingSun: "Zon creÃ«ren...",
        
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
        descMercury: 'Mercurius is de kleinste planeet en staat het dichtst bij de Zon. Het oppervlak zit vol kraters, net als onze Maan. De temperatuur schommelt tussen -180Â°C \'s nachts en 430Â°C overdag - de grootste temperatuurverschillen in ons zonnestelsel!',
        descVenus: 'Venus is met 465Â°C de heetste planeet door een extreem broeikaseffect. De atmosfeer bestaat voor 96% uit CO2 en heeft wolken van zwavelzuur. Venus draait bovendien de andere kant op dan de meeste planeten!',
        descEarth: 'De Aarde is ons thuis en de enige bekende planeet met leven! 71% van het oppervlak bestaat uit water, wat onze planeet de blauwe kleur geeft vanuit de ruimte. De atmosfeer beschermt ons tegen gevaarlijke straling en meteorieten.',
        descMoon: 'Onze Maan is de vijfde grootste maan in het zonnestelsel. De Maan zorgt voor eb en vloed, stabiliseert de aardas, en ontstond 4,5 miljard jaar geleden toen een object zo groot als Mars op de Aarde insloeg!',
        descMars: 'Mars, de Rode Planeet, dankt zijn kleur aan ijzeroxide (roest). Mars heeft de hoogste vulkaan (Olympus Mons - 22 km hoog) en de langste kloof (Valles Marineris - 4.000 km lang) in ons zonnestelsel. Bij de polen ligt waterijs!',
        descJupiter: 'Jupiter is veruit de grootste planeet - alle andere planeten passen er samen in! De Grote Rode Vlek is een storm groter dan de Aarde die al minstens 400 jaar raast. Jupiter heeft maar liefst 95 bekende manen!',
        descSaturn: 'Saturnus is beroemd om zijn spectaculaire ringen van ijs- en rotsdeeltjes. Het is de lichtste planeet - lichter dan water, dus Saturnus zou blijven drijven! Saturnus heeft 146 bekende manen, waaronder Titan met zijn dikke atmosfeer.',
        descUranus: 'Uranus is bijzonder - de planeet ligt op zijn zij! Hierdoor wijzen de polen om de beurt naar de Zon tijdens een baan van 84 jaar. Door het methaan in de atmosfeer lijkt Uranus blauwgroen. De planeet bestaat uit water, methaan en ammoniakijs.',
        descNeptune: 'Neptunus is de stormachtigste planeet met windsnelheden tot 2.100 km/u! Het is de verste planeet vanaf de Zon en doet er 165 aardse jaren over om Ã©Ã©n ronde te maken. De blauwe kleur komt door methaan in de atmosfeer.',
        
        // Laadberichten
        creatingMercury: 'Mercurius maken...',
        creatingVenus: 'Venus maken...',
        creatingEarth: 'Aarde maken...',
        creatingMars: 'Mars maken...',
        creatingJupiter: 'Jupiter maken...',
        creatingSaturn: 'Saturnus maken...',
        creatingUranus: 'Uranus maken...',
        creatingNeptune: 'Neptunus maken...',
        creatingAsteroidBelt: 'AsteroÃ¯dengordel maken...',
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
        funFactJupiter: 'De zwaartekracht van Jupiter beschermt de Aarde tegen veel asteroÃ¯den en kometen!',
        funFactSaturn: 'De ringen van Saturnus zijn slechts 10 meter dik maar 280.000 km breed!',
        funFactUranus: 'Uranus was de eerste planeet die ontdekt werd met een telescoop (in 1781)!',
        funFactNeptune: 'Neptunus werd ontdekt door wiskundige berekeningen voordat hij gezien werd - zijn zwaartekracht beÃ¯nvloedde de baan van Uranus!',
        funFactPluto: 'Een jaar op Pluto duurt 248 aardse jaren! Pluto heeft nog geen hele baan voltooid sinds de ontdekking in 1930.',
        
        // Maanbeschrijvingen
        descPhobos: 'Phobos draait sneller om Mars dan Mars om zijn as draait! Hij komt op in het westen en gaat onder in het oosten.',
        descDeimos: 'Deimos is de kleinste van de twee Marsmanen en doet er 30 uur over om rond te draaien.',
        descIo: 'Io is het vulkanisch actiefste hemellichaam in het zonnestelsel!',
        descEuropa: 'Europa heeft een wereldwijde oceaan onder zijn ijskorst - een mogelijke plek voor leven!',
        descGanymede: 'Ganymedes is de grootste maan in het zonnestelsel, groter dan Mercurius!',
        descCallisto: 'Callisto is het meest gekraterde object in het zonnestelsel!',
        descTitan: 'Titan heeft meren en rivieren van vloeibaar methaan - de enige plek naast de Aarde met vloeistof op het oppervlak!',
        descEnceladus: 'Enceladus spuit watergeisers de ruimte in vanuit zijn ondergrondse oceaan!',
        descRhea: 'Rhea heeft mogelijk zijn eigen ringensysteem!',
        descTitania: 'Titania is de grootste maan van Uranus met massieve kloven!',
        descMiranda: 'Miranda heeft het meest dramatische terrein in het zonnestelsel met kliffen van 20 km hoog!',
        descTriton: 'Triton draait achterstevoren en heeft stikstofgeisers! Het is waarschijnlijk een gevangen Kuipergordelobject.',
        descCharon: 'Charon is zo groot ten opzichte van Pluto dat ze een dubbelsysteem vormen!',
        
        // Satellietbeschrijvingen en wetenswaardigheden
        descISS: 'ISS draait op 400 km hoogte en voltooit elke 92,68 minuten een baan (15,54 banen/dag). Gelanceerd 20 nov 1998 (Zarya-module). Assemblage: 1998-2011 (42 vluchten: 36 Shuttle, 6 Russisch). Massa: 419.725 kg. Volume onder druk: 1.000 mÂ³. Continu bewoond sinds 2 nov 2000 (24+ jaar, 9.000+ dagen). 280+ astronauten uit 23 landen bezocht.',
        funFactISS: 'Het ISS reist met 27.600 km/u! Astronauten zien 16 zonsopgangen/ondergangen per dag. Het is al 24+ jaar continu bewoond - langer dan elk ander ruimtevaartuig!',
        descHubble: 'Gelanceerd 24 april 1990 met Space Shuttle Discovery. Draait op ~535 km hoogte. Heeft tot oktober 2025 1,6+ miljoen waarnemingen gedaan. 2,4m primaire spiegel observeert UV, zichtbaar licht en nabij-IR. Vijf onderhoudsmiâ€‹ssies (1993-2009) upgradeden de instrumenten.',
        funFactHubble: 'Kan objecten van 0,05 boogseconden onderscheiden - alsof je twee vuurvliegjes op 10.000 km afstand ziet! Diepste beeld (eXtreme Deep Field) toont 5.500 sterrenstelsels, sommige 13,2 miljard lichtjaar ver.',
        descGPS: 'GPS (NAVSTAR) constellatie: 31 operationele satellieten (per oktober 2025) in 6 baanvlakken, 55Â° inclinatie. Elke satelliet draait op 20.180 km hoogte. Zendt L-band signalen uit (1,2-1,5 GHz). Rubidium/cesium atoomklokken nauwkeurig tot 10â»Â¹â´ seconden.',
        funFactGPS: 'Je hebt 4 satellieten nodig voor een 3D-positiebepaling (trilateratie + klok correctie). Het systeem geeft 5-10m nauwkeurigheid. Militair signaal (P/Y code) nauwkeurig tot centimeters!',
        descJWST: 'Gelanceerd 25 dec 2021. Bereikte L2-punt 24 jan 2022. Eerste beelden vrijgegeven 12 juli 2022. Observeert infrarood (0,6-28,5 Î¼m). 6,5m gesegmenteerde berylliumspiegel (18 zeshoeken) met 25 mÂ² oppervlak - 6x Hubble! Zonneschild: 21,2m Ã— 14,2m, 5 lagen.',
        funFactJWST: 'Werkt bij -233Â°C (-388Â°F)! Kan de warmte van een hommel op maanafstand detecteren. Ontdekte de vroegste sterrenstelsels bij z=14 (280 miljoen jaar na de Oerknal).',
        
        // Ruimtevaartuigbeschrijvingen en wetenswaardigheden
        descVoyager1: 'Voyager 1 is het verst door mensen gemaakte object vanaf de Aarde! Gelanceerd 5 sept 1977, kwam het op 25 aug 2012 in de interstellaire ruimte. Momenteel 24,3 miljard km (162 AU) van de Zon. Draagt de Gouden Plaat met geluiden en beelden van de Aarde.',
        funFactVoyager1: 'Voyager 1 reist met 17 km/s (61.200 km/u). Radiosignalen doen er 22,5 uur over om de Aarde te bereiken!',
        descVoyager2: 'Voyager 2 is het enige ruimtevaartuig dat alle vier reuzenplaneten bezocht! Jupiter (juli 1979), Saturnus (aug 1981), Uranus (jan 1986), Neptunus (aug 1989). Kwam 5 nov 2018 in de interstellaire ruimte. Nu 20,3 miljard km (135 AU) van de Zon.',
        funFactVoyager2: 'Voyager 2 ontdekte 16 manen bij de reuzenplaneten, de Grote Donkere Vlek van Neptunus, en geisers op Triton!',
        descNewHorizons: 'New Horizons gaf ons de eerste close-up beelden van Pluto op 14 juli 2015! Het onthulde waterijsbergen tot 3.500m hoog, enorme stikstofgletsjers, en de beroemde hartvormige Tombaugh Regio. Nu 59 AU van de Zon, verkent de Kuipergordel.',
        funFactNewHorizons: 'New Horizons reisde 9,5 jaar en 5 miljard km om Pluto te bereiken met 58.536 km/u. Het draagt 28 gram van Clyde Tombaugh\'s as!',
        descJuno: 'Juno kwam op 4 juli 2016 in een baan om Jupiter. Bestudeert samenstelling, zwaartekrachtveld, magnetisch veld en poolaurora\'s. Ontdekte dat Jupiter\'s kern groter en "vaag" is, massieve poolcyclonen, en atmosferische ammoniakverdeling. Verlengde missie tot sept 2025.',
        funFactJuno: 'Eerste zonne-aangedreven ruimtevaartuig bij Jupiter! Drie 9m zonnepanelen genereren 500W. Draagt drie LEGO-poppetjes: Galileo, Jupiter en Juno!',
        descCassini: 'Cassini draaide om Saturnus van 30 juni 2004 - 15 sept 2017 (13 jaar). Ontdekte vloeibare methaan/ethaan meren op Titan, watergeisers op Enceladus, nieuwe ringen, 7 nieuwe manen. Huygens-sonde landde op Titan op 14 jan 2005. Eindigde met atmosferische intrede "Grand Finale".',
        funFactCassini: 'Ontdekte Enceladus\' ondergrondse oceaan! Watergeisers spuiten 250kg/s de ruimte in. Cassini vloog door pluimen, detecteerde H2, organische stoffen - ingrediÃ«nten voor leven!',
        descPioneer10: 'Pioneer 10 was het eerste ruimtevaartuig dat door de asteroÃ¯dengordel reisde en als eerste Jupiter bezocht (3 dec 1973)! Gelanceerd 2 maart 1972, droeg het de beroemde Pioneer-plaquette met mensen en de locatie van de Aarde. Laatste contact: 23 jan 2003 op 12,2 miljard km.',
        funFactPioneer10: 'Pioneer 10 draagt een gouden plaquette ontworpen door Carl Sagan met een man, vrouw en de locatie van de Aarde - een boodschap voor aliens die het zouden vinden!',
        descPioneer11: 'Pioneer 11 was het eerste ruimtevaartuig dat Saturnus bezocht (1 sept 1979)! Vloog ook langs Jupiter (2 dec 1974). Gelanceerd 5 april 1973, ontdekte het Saturnus\' F-ring en een nieuwe maan. Draagt ook de Pioneer-plaquette. Laatste contact: 24 nov 1995 op 6,5 miljard km.',
        funFactPioneer11: 'Pioneer 11 gebruikte Jupiter\'s zwaartekracht voor de eerste planetaire zwaartekrachtondersteuning, besparend jaren reistijd naar Saturnus!',
        
        // Komeetbeschrijvingen
        descHalley: 'De Halley-komeet is de beroemdste komeet! Hij keert elke 75-76 jaar terug naar de Aarde. Laatst gezien in 1986, keert hij terug in 2061. Als je hem ziet, bekijk je een 4,6 miljard jaar oude kosmische sneeuwbal!',
        descHaleBopp: 'Hale-Bopp was een van de helderste kometen van de 20e eeuw, 18 maanden met het blote oog zichtbaar in 1996-1997! Zijn kern is ongewoon groot met 60 km diameter.',
        descNeowise: 'Komeet NEOWISE was een spectaculair gezicht in juli 2020! Hij keert pas over ongeveer 6.800 jaar terug. Kometen zijn "vuile sneeuwballen" van ijs, stof en rots uit de vorming van het zonnestelsel.'
    },
    
    fr: {
        // Titre et en-tÃªte de l'application
        appTitle: "Voyage Spatial",
        subtitle: "SystÃ¨me Solaire 3D Interactif",
        
        // Navigation
        quickNavigation: "Navigation Rapide",
        
        // CatÃ©gories d'objets
        ourStar: "Notre Ã‰toile",
        sun: "Soleil",
        mercury: "Mercure",
        venus: "VÃ©nus",
        earthSystem: "SystÃ¨me Terrestre",
        earth: "Terre",
        moon: "Lune",
        marsSystem: "SystÃ¨me Martien",
        mars: "Mars",
        phobos: "Phobos",
        deimos: "Deimos",
        jupiterSystem: "SystÃ¨me Jovien",
        jupiter: "Jupiter",
        io: "Io",
        europa: "Europe",
        ganymede: "GanymÃ¨de",
        callisto: "Callisto",
        saturnSystem: "SystÃ¨me Saturnien",
        saturn: "Saturne",
        titan: "Titan",
        uranusSystem: "SystÃ¨me d'Uranus",
        uranus: "Uranus",
        neptuneSystem: "SystÃ¨me Neptunien",
        neptune: "Neptune",
        pluto: "Pluton",
        charon: "Charon",
        enceladus: "Encelade",
        rhea: "RhÃ©a",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Triton",
        
        // Sections du menu de navigation
        navOurStar: "Notre Ã‰toile",
        navInnerPlanets: "PlanÃ¨tes IntÃ©rieures (Rocheuses)",
        navAsteroidBelt: "Ceinture d'AstÃ©roÃ¯des",
        navOuterPlanets: "PlanÃ¨tes ExtÃ©rieures (GÃ©antes Gazeuses)",
        navIceGiants: "GÃ©antes de Glace",
        navKuiperBelt: "Ceinture de Kuiper & PlanÃ¨tes Naines",
        navComets: "ComÃ¨tes",
        navSatellites: "Satellites & Stations Spatiales",
        navSpacecraft: "Vaisseaux Spatiaux & Sondes",
        navDistantStars: "Ã‰toiles Lointaines",
        kuiperBelt: "Ceinture de Kuiper",
        asteroidBelt: "Ceinture d'AstÃ©roÃ¯des",
        
        // Boutons de contrÃ´le
        toggleOrbits: "Orbites",
        toggleConstellations: "Constellations",
        toggleScale: "Ã‰chelle Ã‰ducative",
        toggleScaleRealistic: "Ã‰chelle RÃ©aliste",
        toggleLabels: "Ã‰tiquettes DÃ‰SACTIVÃ‰ES",
        toggleLabelsOn: "Ã‰tiquettes ACTIVÃ‰ES",
        resetView: "RÃ©initialiser",
        enterVR: "Entrer en RV",
        enterAR: "Entrer en RA",
        
        // ContrÃ´le de vitesse
        speedLabel: "Vitesse:",
        paused: "En pause",
        realTime: "1x Temps rÃ©el",
        
        // Panneau d'informations
        name: "Nom",
        type: "Type",
        distance: "Distance",
        size: "Taille",
        description: "Description",
        
        // Ã‰cran de chargement
        loading: "Chargement...",
        initializing: "Initialisation...",
        settingUpScene: "Configuration de la scÃ¨ne...",
        initializingControls: "Initialisation des contrÃ´les...",
        loadingSolarSystem: "Chargement du systÃ¨me solaire...",
        creatingSun: "CrÃ©ation du Soleil...",
        selectObject: "SÃ©lectionner un Objet",
        clickToExplore: "Cliquez sur les objets pour explorer et en savoir plus",
        
        // Aide
        help: "Aide",
        helpTitle: "Voyage Spatial - ContrÃ´les et FonctionnalitÃ©s",
        controls: "ContrÃ´les",
        mouseControls: "ContrÃ´les Souris:",
        leftClick: "Clic Gauche + Glisser: Rotation de la vue",
        rightClick: "Clic Droit + Glisser: DÃ©placer la vue",
        scroll: "Molette: Zoom avant/arriÃ¨re",
        clickObject: "Clic Objet: Voir les dÃ©tails",
        keyboardShortcuts: "Raccourcis Clavier:",
        spaceKey: "Espace: Pause/Reprise",
        plusMinus: "+/-: Changer la vitesse",
        rKey: "R: RÃ©initialiser la vue",
        hKey: "H: Basculer l'aide",
        lKey: "L: Basculer les pointeurs laser (RV)",
        features: "FonctionnalitÃ©s",
        vrSupport: "Support RV/RA avec WebXR",
        realisticOrbits: "MÃ©canique orbitale rÃ©aliste",
        educationalMode: "Modes d'Ã©chelle Ã©ducatif et rÃ©aliste",
        constellations: "Principales constellations visibles",
        spacecraft: "Engins spatiaux et satellites historiques",
        
        // Notifications
        updateAvailable: "Mise Ã  Jour Disponible",
        updateMessage: "Une nouvelle version est disponible!",
        updateButton: "Mettre Ã  Jour",
        updateLater: "Plus tard",
        offline: "Mode Hors Ligne",
        offlineMessage: "Vous Ãªtes hors ligne. Certaines fonctionnalitÃ©s peuvent Ãªtre limitÃ©es.",
        installTitle: "Installer Voyage Spatial",
        installMessage: "Installez Voyage Spatial comme application pour une meilleure expÃ©rience!",
        installButton: "Installer",
        installLater: "Peut-Ãªtre Plus Tard",
        errorLoading: "Erreur de chargement de Voyage Spatial",
        errorMessage: "Veuillez actualiser la page pour rÃ©essayer.",
        
        // Pied de page
        madeWith: "Fait avec",
        and: "et",
        by: "par",
        
        // Types d'objets
        typeStar: 'Ã‰toile',
        typePlanet: 'PlanÃ¨te',
        typeMoon: 'Lune',
        typeSpacecraft: 'Vaisseau Spatial',
        typeDwarfPlanet: 'PlanÃ¨te Naine',
        typeNebula: 'NÃ©buleuse',
        typeGalaxy: 'Galaxie',
        
        // Descriptions d'objets
        descSun: 'Le Soleil est une Ã©toile de type G (naine jaune) contenant 99,86% de la masse du SystÃ¨me Solaire. TempÃ©rature de surface: 5 778 K. Ã‚ge: 4,6 milliards d\'annÃ©es. Il fusionne 600 millions de tonnes d\'hydrogÃ¨ne en hÃ©lium chaque seconde!',
        descMercury: 'Mercure est la plus petite planÃ¨te et la plus proche du Soleil. Sa surface est couverte de cratÃ¨res comme notre Lune. La tempÃ©rature varie de -180Â°C la nuit Ã  430Â°C le jour - la plus grande variation de tempÃ©rature du systÃ¨me solaire!',
        descVenus: 'VÃ©nus est la planÃ¨te la plus chaude avec une tempÃ©rature de surface de 465Â°C due Ã  un effet de serre extrÃªme. Son atmosphÃ¨re est composÃ©e Ã  96% de CO2 avec des nuages d\'acide sulfurique. VÃ©nus tourne dans le sens inverse de la plupart des planÃ¨tes!',
        descEarth: 'La Terre est notre foyer, la seule planÃ¨te connue avec la vie! 71% est couvert d\'eau, crÃ©ant la couleur bleue visible depuis l\'espace. L\'atmosphÃ¨re nous protÃ¨ge des radiations nocives et des mÃ©tÃ©orites.',
        descMoon: 'La Lune terrestre est la cinquiÃ¨me plus grande lune du systÃ¨me solaire. Elle crÃ©e les marÃ©es, stabilise l\'inclinaison de la Terre et s\'est formÃ©e il y a 4,5 milliards d\'annÃ©es lorsqu\'un objet de la taille de Mars a percutÃ© la Terre!',
        descMars: 'Mars, la PlanÃ¨te Rouge, doit sa couleur Ã  l\'oxyde de fer (rouille). Elle possÃ¨de le plus grand volcan (Olympus Mons - 22 km de haut) et le plus long canyon (Valles Marineris - 4 000 km de long) du systÃ¨me solaire. De la glace d\'eau existe Ã  ses pÃ´les!',
        descJupiter: 'Jupiter est la plus grande planÃ¨te - toutes les autres planÃ¨tes pourraient tenir Ã  l\'intÃ©rieur! La Grande Tache Rouge est une tempÃªte plus grande que la Terre qui fait rage depuis au moins 400 ans. Jupiter a 95 lunes connues!',
        descSaturn: 'Saturne est cÃ©lÃ¨bre pour son spectaculaire systÃ¨me d\'anneaux composÃ©s de particules de glace et de roche. C\'est la planÃ¨te la moins dense - elle flotterait dans l\'eau! Saturne a 146 lunes connues dont Titan qui possÃ¨de une atmosphÃ¨re Ã©paisse.',
        descUranus: 'Uranus est unique - elle tourne sur le cÃ´tÃ©! Cela signifie que ses pÃ´les font face au Soleil Ã  tour de rÃ´le pendant son orbite de 84 ans. ComposÃ©e de glaces d\'eau, de mÃ©thane et d\'ammoniac, elle apparaÃ®t bleu-vert en raison du mÃ©thane dans son atmosphÃ¨re.',
        descNeptune: 'Neptune est la planÃ¨te la plus venteuse avec des tempÃªtes atteignant 2 100 km/h! C\'est la planÃ¨te la plus Ã©loignÃ©e du Soleil et il lui faut 165 annÃ©es terrestres pour complÃ©ter une orbite. Sa couleur bleue provient du mÃ©thane dans l\'atmosphÃ¨re.',
        
        // Messages de chargement
        creatingMercury: 'CrÃ©ation de Mercure...',
        creatingVenus: 'CrÃ©ation de VÃ©nus...',
        creatingEarth: 'CrÃ©ation de la Terre...',
        creatingMars: 'CrÃ©ation de Mars...',
        creatingJupiter: 'CrÃ©ation de Jupiter...',
        creatingSaturn: 'CrÃ©ation de Saturne...',
        creatingUranus: 'CrÃ©ation d\'Uranus...',
        creatingNeptune: 'CrÃ©ation de Neptune...',
        creatingAsteroidBelt: 'CrÃ©ation de la ceinture d\'astÃ©roÃ¯des...',
        creatingKuiperBelt: 'CrÃ©ation de la ceinture de Kuiper...',
        creatingStarfield: 'CrÃ©ation du champ d\'Ã©toiles...',
        creatingOrbitalPaths: 'CrÃ©ation des trajectoires orbitales...',
        creatingConstellations: 'CrÃ©ation des constellations...',
        creatingDistantStars: 'CrÃ©ation des Ã©toiles lointaines...',
        creatingNebulae: 'CrÃ©ation des nÃ©buleuses...',
        creatingGalaxies: 'CrÃ©ation des galaxies...',
        creatingNearbyStars: 'CrÃ©ation des Ã©toiles proches...',
        creatingExoplanets: 'CrÃ©ation des exoplanÃ¨tes...',
        creatingComets: 'CrÃ©ation des comÃ¨tes...',
        creatingLabels: 'CrÃ©ation des Ã©tiquettes...',
        creatingSatellites: 'CrÃ©ation des satellites...',
        creatingSpacecraft: 'CrÃ©ation des vaisseaux spatiaux...',
        
        // Texte systÃ¨me
        centerSolarSystem: 'Centre du SystÃ¨me Solaire',
        orbitsParent: 'Orbite',
        millionKmFromSun: 'millions de km du Soleil',
        distanceVaries: 'Distance variable',
        noDescription: 'Aucune description disponible',
        moonCount: 'Cette planÃ¨te a',
        majorMoon: 'grande lune',
        majorMoons: 'grandes lunes',
        shownHere: 'affichÃ©es ici (beaucoup plus de petites lunes existent!)',
        
        // Faits amusants
        funFactSun: 'Le Soleil est si grand que 1,3 million de Terres pourraient tenir Ã  l\'intÃ©rieur!',
        funFactMercury: 'Une annÃ©e sur Mercure (88 jours terrestres) est plus courte que son jour (176 jours terrestres)!',
        funFactVenus: 'VÃ©nus est la planÃ¨te la plus brillante dans notre ciel et est souvent appelÃ©e le "jumeau malÃ©fique" de la Terre',
        funFactEarth: 'La Terre est la seule planÃ¨te qui ne porte pas le nom d\'un dieu. Elle voyage Ã  107 000 km/h autour du Soleil!',
        funFactMoon: 'La Lune s\'Ã©loigne lentement de la Terre de 3,8 cm par an!',
        funFactMars: 'Mars a des saisons comme la Terre, et son jour ne dure que 37 minutes de plus que le nÃ´tre!',
        funFactJupiter: 'La gravitÃ© de Jupiter protÃ¨ge la Terre de nombreux astÃ©roÃ¯des et comÃ¨tes!',
        funFactSaturn: 'Les anneaux de Saturne ne font que 10 mÃ¨tres d\'Ã©paisseur mais 280 000 km de large!',
        funFactUranus: 'Uranus a Ã©tÃ© la premiÃ¨re planÃ¨te dÃ©couverte avec un tÃ©lescope (1781)!',
        funFactNeptune: 'Neptune a Ã©tÃ© dÃ©couverte par les mathÃ©matiques avant d\'Ãªtre vue - sa gravitÃ© affectait l\'orbite d\'Uranus!',
        funFactPluto: 'Une annÃ©e sur Pluton dure 248 annÃ©es terrestres! Elle n\'a pas complÃ©tÃ© une orbite depuis sa dÃ©couverte en 1930.',
        
        // Descriptions des lunes
        descPhobos: 'Phobos orbite Mars plus vite que Mars ne tourne! Il se lÃ¨ve Ã  l\'ouest et se couche Ã  l\'est.',
        descDeimos: 'Deimos est la plus petite des deux lunes de Mars et met 30 heures pour orbiter.',
        descIo: 'Io est le corps le plus volcaniquement actif du systÃ¨me solaire!',
        descEuropa: 'Europe possÃ¨de un ocÃ©an global sous sa glace - un endroit potentiel pour la vie!',
        descGanymede: 'GanymÃ¨de est la plus grande lune du systÃ¨me solaire, plus grande que Mercure!',
        descCallisto: 'Callisto est l\'objet le plus criblÃ© de cratÃ¨res du systÃ¨me solaire!',
        descTitan: 'Titan possÃ¨de des lacs et riviÃ¨res de mÃ©thane liquide - le seul endroit avec du liquide en surface hormis la Terre!',
        descEnceladus: 'Encelade projette des geysers d\'eau dans l\'espace depuis son ocÃ©an souterrain!',
        descRhea: 'RhÃ©a pourrait avoir son propre systÃ¨me d\'anneaux!',
        descTitania: 'Titania est la plus grande lune d\'Uranus avec des canyons massifs!',
        descMiranda: 'Miranda possÃ¨de le terrain le plus dramatique du systÃ¨me solaire avec des falaises de 20 km de haut!',
        descTriton: 'Triton orbite Ã  l\'envers et possÃ¨de des geysers d\'azote! C\'est probablement un objet capturÃ© de la ceinture de Kuiper.',
        descCharon: 'Charon est si grand par rapport Ã  Pluton qu\'ils forment un systÃ¨me binaire!',
        
        // Descriptions et faits des satellites
        descISS: 'L\'ISS orbite Ã  400 km d\'altitude, complÃ©tant une orbite toutes les 92,68 minutes (15,54 orbites/jour). LancÃ©e le 20 nov 1998 (module Zarya). Assemblage: 1998-2011 (42 vols: 36 Navette, 6 Russes). Masse: 419 725 kg. Volume pressurisÃ©: 1 000 mÂ³. Occupation continue depuis le 2 nov 2000 (24+ ans, 9 000+ jours). 280+ astronautes de 23 pays ont visitÃ©.',
        funFactISS: 'L\'ISS voyage Ã  27 600 km/h! Les astronautes voient 16 levers/couchers de soleil par jour. Elle est continuellement occupÃ©e depuis 24+ ans - plus longtemps que tout autre vaisseau spatial!',
        descHubble: 'LancÃ© le 24 avril 1990 par la navette Discovery. Orbite Ã  ~535 km d\'altitude. A effectuÃ© 1,6+ million d\'observations en oct 2025. Miroir primaire de 2,4m observe UV, visible et proche IR. Cinq missions de maintenance (1993-2009) ont amÃ©liorÃ© les instruments.',
        funFactHubble: 'Peut rÃ©soudre des objets sÃ©parÃ©s de 0,05 secondes d\'arc - comme voir deux lucioles Ã  10 000 km! L\'image la plus profonde (eXtreme Deep Field) montre 5 500 galaxies, certaines Ã  13,2 milliards d\'annÃ©es-lumiÃ¨re.',
        descGPS: 'Constellation GPS (NAVSTAR): 31 satellites opÃ©rationnels (oct 2025) sur 6 plans orbitaux, inclinaison 55Â°. Chaque satellite orbite Ã  20 180 km d\'altitude. Ã‰met des signaux bande L (1,2-1,5 GHz). Horloges atomiques rubidium/cÃ©sium prÃ©cises Ã  10â»Â¹â´ secondes.',
        funFactGPS: 'Besoin de 4 satellites pour une position 3D (trilatÃ©ration + correction d\'horloge). Le systÃ¨me fournit une prÃ©cision de 5-10m. Le signal militaire (code P/Y) est prÃ©cis au centimÃ¨tre!',
        descJWST: 'LancÃ© le 25 dÃ©c 2021. Atteint le point L2 le 24 jan 2022. PremiÃ¨res images publiÃ©es le 12 juil 2022. Observe l\'infrarouge (0,6-28,5 Î¼m). Miroir segmentÃ© en bÃ©ryllium de 6,5m (18 hexagones) avec 25 mÂ² de surface collectrice - 6x Hubble! Bouclier solaire: 21,2m Ã— 14,2m, 5 couches.',
        funFactJWST: 'Fonctionne Ã  -233Â°C (-388Â°F)! Peut dÃ©tecter la signature thermique d\'un bourdon Ã  distance lunaire. A dÃ©couvert les galaxies les plus anciennes Ã  z=14 (280 millions d\'annÃ©es aprÃ¨s le Big Bang).',
        
        // Descriptions et faits des vaisseaux spatiaux
        descVoyager1: 'Voyager 1 est l\'objet fait par l\'homme le plus Ã©loignÃ© de la Terre! LancÃ©e le 5 sept 1977, elle est entrÃ©e dans l\'espace interstellaire le 25 aoÃ»t 2012. Actuellement Ã  24,3 milliards de km (162 UA) du Soleil. Elle transporte le Disque d\'Or avec des sons et images de la Terre.',
        funFactVoyager1: 'Voyager 1 voyage Ã  17 km/s (61 200 km/h). Ses signaux radio mettent 22,5 heures pour atteindre la Terre!',
        descVoyager2: 'Voyager 2 est le seul vaisseau spatial Ã  avoir visitÃ© les quatre planÃ¨tes gÃ©antes! Jupiter (juil 1979), Saturne (aoÃ»t 1981), Uranus (jan 1986), Neptune (aoÃ»t 1989). EntrÃ©e dans l\'espace interstellaire le 5 nov 2018. Maintenant Ã  20,3 milliards de km (135 UA) du Soleil.',
        funFactVoyager2: 'Voyager 2 a dÃ©couvert 16 lunes parmi les planÃ¨tes gÃ©antes, la Grande Tache Sombre de Neptune et les geysers de Triton!',
        descNewHorizons: 'New Horizons nous a donnÃ© les premiÃ¨res images rapprochÃ©es de Pluton le 14 juillet 2015! Il a rÃ©vÃ©lÃ© des montagnes de glace d\'eau jusqu\'Ã  3 500m de haut, de vastes glaciers d\'azote et la cÃ©lÃ¨bre Tombaugh Regio en forme de cÅ“ur. Maintenant Ã  59 UA du Soleil, explorant la ceinture de Kuiper.',
        funFactNewHorizons: 'New Horizons a voyagÃ© 9,5 ans et 5 milliards de km pour atteindre Pluton Ã  58 536 km/h. Il transporte 28g des cendres de Clyde Tombaugh!',
        descJuno: 'Juno est entrÃ©e en orbite autour de Jupiter le 4 juillet 2016. Ã‰tudie la composition, le champ gravitationnel, le champ magnÃ©tique et les aurores polaires. A dÃ©couvert que le noyau de Jupiter est plus grand et "flou", des cyclones polaires massifs et la distribution d\'ammoniac atmosphÃ©rique. Mission prolongÃ©e jusqu\'en sept 2025.',
        funFactJuno: 'Premier vaisseau spatial Ã  Ã©nergie solaire vers Jupiter! Trois panneaux solaires de 9m gÃ©nÃ¨rent 500W. Transporte trois figurines LEGO: GalilÃ©e, Jupiter et Junon!',
        descCassini: 'Cassini a orbitÃ© Saturne du 30 juin 2004 au 15 sept 2017 (13 ans). A dÃ©couvert des lacs de mÃ©thane/Ã©thane liquide sur Titan, des geysers d\'eau sur Encelade, de nouveaux anneaux, 7 nouvelles lunes. La sonde Huygens a atterri sur Titan le 14 jan 2005. S\'est terminÃ©e par une entrÃ©e atmosphÃ©rique "Grand Finale".',
        funFactCassini: 'A dÃ©couvert l\'ocÃ©an souterrain d\'Encelade! Les geysers d\'eau projettent 250kg/s dans l\'espace. Cassini a traversÃ© les panaches, dÃ©tectÃ© H2, composÃ©s organiques - ingrÃ©dients de la vie!',
        descPioneer10: 'Pioneer 10 fut le premier vaisseau spatial Ã  traverser la ceinture d\'astÃ©roÃ¯des et Ã  visiter Jupiter (3 dÃ©c 1973)! LancÃ©e le 2 mars 1972, elle portait la cÃ©lÃ¨bre plaque Pioneer montrant les humains et la localisation de la Terre. Dernier contact: 23 jan 2003 Ã  12,2 milliards de km.',
        funFactPioneer10: 'Pioneer 10 porte une plaque dorÃ©e conÃ§ue par Carl Sagan montrant un homme, une femme et la localisation de la Terre - un message pour les extraterrestres qui pourraient la trouver!',
        descPioneer11: 'Pioneer 11 fut le premier vaisseau spatial Ã  visiter Saturne (1er sept 1979)! A aussi survolÃ© Jupiter (2 dÃ©c 1974). LancÃ©e le 5 avril 1973, elle a dÃ©couvert l\'anneau F de Saturne et une nouvelle lune. Porte aussi la plaque Pioneer. Dernier contact: 24 nov 1995 Ã  6,5 milliards de km.',
        funFactPioneer11: 'Pioneer 11 a utilisÃ© la gravitÃ© de Jupiter pour la premiÃ¨re assistance gravitationnelle planÃ©taire, Ã©conomisant des annÃ©es de voyage vers Saturne!',
        
        // Descriptions des comÃ¨tes
        descHalley: 'La comÃ¨te de Halley est la plus cÃ©lÃ¨bre! Elle revient prÃ¨s de la Terre tous les 75-76 ans. Vue pour la derniÃ¨re fois en 1986, elle reviendra en 2061. Quand vous la voyez, vous observez une boule de neige cosmique vieille de 4,6 milliards d\'annÃ©es!',
        descHaleBopp: 'Hale-Bopp fut l\'une des comÃ¨tes les plus brillantes du 20e siÃ¨cle, visible Ã  l\'Å“il nu pendant 18 mois en 1996-1997! Son noyau est exceptionnellement grand avec 60 km de diamÃ¨tre.',
        descNeowise: 'La comÃ¨te NEOWISE fut un spectacle spectaculaire en juillet 2020! Elle ne reviendra pas avant environ 6 800 ans. Les comÃ¨tes sont des "boules de neige sales" composÃ©es de glace, poussiÃ¨re et roche de la formation du systÃ¨me solaire.'
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
        pluto: "Pluto",
        charon: "Charon",
        enceladus: "Enceladus",
        rhea: "Rhea",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Triton",
        
        // NavigationsmenÃ¼-Abschnitte
        navOurStar: "Unser Stern",
        navInnerPlanets: "Innere Planeten (Gesteinsplaneten)",
        navAsteroidBelt: "AsteroidengÃ¼rtel",
        navOuterPlanets: "Ã„uÃŸere Planeten (Gasriesen)",
        navIceGiants: "Eisriesen",
        navKuiperBelt: "KuipergÃ¼rtel & Zwergplaneten",
        navComets: "Kometen",
        navSatellites: "Satelliten & Raumstationen",
        navSpacecraft: "Raumfahrzeuge & Sonden",
        navDistantStars: "Ferne Sterne",
        kuiperBelt: "KuipergÃ¼rtel",
        asteroidBelt: "AsteroidengÃ¼rtel",
        
        // Steuerungstasten
        toggleOrbits: "Umlaufbahnen",
        toggleConstellations: "Sternbilder",
        toggleScale: "PÃ¤dagogischer MaÃŸstab",
        toggleScaleRealistic: "Realistischer MaÃŸstab",
        toggleLabels: "Beschriftungen AUS",
        toggleLabelsOn: "Beschriftungen EIN",
        resetView: "ZurÃ¼cksetzen",
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
        size: "GrÃ¶ÃŸe",
        description: "Beschreibung",
        
        // Ladebildschirm
        loading: "LÃ¤dt...",
        initializing: "Initialisierung...",
        settingUpScene: "Szene wird eingerichtet...",
        initializingControls: "Steuerung wird initialisiert...",
        loadingSolarSystem: "Sonnensystem wird geladen...",
        creatingSun: "Sonne wird erstellt...",
        selectObject: "Objekt AuswÃ¤hlen",
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
        keyboardShortcuts: "TastaturkÃ¼rzel:",
        spaceKey: "Leertaste: Pause/Fortsetzen",
        plusMinus: "+/-: Geschwindigkeit Ã¤ndern",
        rKey: "R: Ansicht zurÃ¼cksetzen",
        hKey: "H: Hilfe umschalten",
        lKey: "L: Laserpointer umschalten (VR)",
        features: "Funktionen",
        vrSupport: "VR/AR-UnterstÃ¼tzung mit WebXR",
        realisticOrbits: "Realistische Orbitalmechanik",
        educationalMode: "PÃ¤dagogische und realistische MaÃŸstabsmodi",
        constellations: "Wichtige Sternbilder sichtbar",
        spacecraft: "Historische Raumfahrzeuge und Satelliten",
        
        // Benachrichtigungen
        updateAvailable: "Update VerfÃ¼gbar",
        updateMessage: "Eine neue Version ist verfÃ¼gbar!",
        updateButton: "Jetzt Aktualisieren",
        updateLater: "SpÃ¤ter",
        offline: "Offline-Modus",
        offlineMessage: "Sie sind offline. Einige Funktionen kÃ¶nnen eingeschrÃ¤nkt sein.",
        installTitle: "Weltraumreise Installieren",
        installMessage: "Installieren Sie Weltraumreise als App fÃ¼r ein besseres Erlebnis!",
        installButton: "Installieren",
        installLater: "Vielleicht SpÃ¤ter",
        errorLoading: "Fehler beim Laden der Weltraumreise",
        errorMessage: "Bitte aktualisieren Sie die Seite, um es erneut zu versuchen.",
        
        // FuÃŸzeile
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
        descSun: 'Die Sonne ist ein Hauptreihenstern vom Typ G (Gelber Zwerg), der 99,86% der Masse des Sonnensystems enthÃ¤lt. OberflÃ¤chentemperatur: 5.778 K. Alter: 4,6 Milliarden Jahre. Sie verschmilzt jede Sekunde 600 Millionen Tonnen Wasserstoff zu Helium!',
        descMercury: 'Merkur ist der kleinste Planet und der sonnennÃ¤chste. Seine OberflÃ¤che ist wie unser Mond mit Kratern bedeckt. Die Temperatur reicht von -180Â°C nachts bis 430Â°C tagsÃ¼ber - die grÃ¶ÃŸte Temperaturspanne im Sonnensystem!',
        descVenus: 'Venus ist mit 465Â°C der heiÃŸeste Planet aufgrund eines extremen Treibhauseffekts. Ihre AtmosphÃ¤re besteht zu 96% aus CO2 mit Wolken aus SchwefelsÃ¤ure. Venus rotiert rÃ¼ckwÃ¤rts im Vergleich zu den meisten Planeten!',
        descEarth: 'Die Erde ist unser Zuhause, der einzige bekannte Planet mit Leben! 71% sind mit Wasser bedeckt, was die blaue Farbe aus dem Weltraum erzeugt. Die AtmosphÃ¤re schÃ¼tzt uns vor schÃ¤dlicher Strahlung und Meteoriten.',
        descMoon: 'Der Erdmond ist der fÃ¼nftgrÃ¶ÃŸte Mond im Sonnensystem. Er erzeugt Gezeiten, stabilisiert die Neigung der Erde und entstand vor 4,5 Milliarden Jahren, als ein marsgroÃŸes Objekt die Erde traf!',
        descMars: 'Mars, der Rote Planet, verdankt seine Farbe Eisenoxid (Rost). Er hat den grÃ¶ÃŸten Vulkan (Olympus Mons - 22 km hoch) und die lÃ¤ngste Schlucht (Valles Marineris - 4.000 km lang) im Sonnensystem. An seinen Polen existiert Wassereis!',
        descJupiter: 'Jupiter ist der grÃ¶ÃŸte Planet - alle anderen Planeten wÃ¼rden hineinpassen! Der GroÃŸe Rote Fleck ist ein Sturm grÃ¶ÃŸer als die Erde, der seit mindestens 400 Jahren tobt. Jupiter hat 95 bekannte Monde!',
        descSaturn: 'Saturn ist berÃ¼hmt fÃ¼r sein spektakulÃ¤res Ringsystem aus Eis- und Gesteinpartikeln. Er ist der am wenigsten dichte Planet - er wÃ¼rde in Wasser schwimmen! Saturn hat 146 bekannte Monde, darunter Titan mit seiner dichten AtmosphÃ¤re.',
        descUranus: 'Uranus ist einzigartig - er rotiert auf der Seite! Das bedeutet, dass seine Pole wÃ¤hrend seiner 84-jÃ¤hrigen Umlaufbahn abwechselnd zur Sonne zeigen. Er besteht aus Wasser-, Methan- und Ammoniakeis und erscheint blaugrÃ¼n durch Methan in seiner AtmosphÃ¤re.',
        descNeptune: 'Neptun ist der windigste Planet mit StÃ¼rmen von bis zu 2.100 km/h! Er ist der am weitesten von der Sonne entfernte Planet und braucht 165 Erdjahre fÃ¼r eine Umlaufbahn. Seine blaue Farbe stammt von Methan in der AtmosphÃ¤re.',
        
        // Lademeldungen
        creatingMercury: 'Merkur wird erstellt...',
        creatingVenus: 'Venus wird erstellt...',
        creatingEarth: 'Erde wird erstellt...',
        creatingMars: 'Mars wird erstellt...',
        creatingJupiter: 'Jupiter wird erstellt...',
        creatingSaturn: 'Saturn wird erstellt...',
        creatingUranus: 'Uranus wird erstellt...',
        creatingNeptune: 'Neptun wird erstellt...',
        creatingAsteroidBelt: 'AsteroidengÃ¼rtel wird erstellt...',
        creatingKuiperBelt: 'KuipergÃ¼rtel wird erstellt...',
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
        noDescription: 'Keine Beschreibung verfÃ¼gbar',
        moonCount: 'Dieser Planet hat',
        majorMoon: 'groÃŸer Mond',
        majorMoons: 'groÃŸe Monde',
        shownHere: 'hier gezeigt (viele weitere kleine existieren!)',
        
        // Lustige Fakten
        funFactSun: 'Die Sonne ist so groÃŸ, dass 1,3 Millionen Erden hineinpassen wÃ¼rden!',
        funFactMercury: 'Ein Jahr auf Merkur (88 Erdtage) ist kÃ¼rzer als sein Tag (176 Erdtage)!',
        funFactVenus: 'Venus ist der hellste Planet an unserem Himmel und wird oft als "bÃ¶ser Zwilling" der Erde bezeichnet',
        funFactEarth: 'Die Erde ist der einzige Planet, der nicht nach einem Gott benannt ist. Sie reist mit 107.000 km/h um die Sonne!',
        funFactMoon: 'Der Mond entfernt sich langsam von der Erde mit 3,8 cm pro Jahr!',
        funFactMars: 'Mars hat wie die Erde Jahreszeiten, und sein Tag ist nur 37 Minuten lÃ¤nger als unserer!',
        funFactJupiter: 'Jupiters Schwerkraft schÃ¼tzt die Erde vor vielen Asteroiden und Kometen!',
        funFactSaturn: 'Saturns Ringe sind nur 10 Meter dick, aber 280.000 km breit!',
        funFactUranus: 'Uranus war der erste Planet, der mit einem Teleskop entdeckt wurde (1781)!',
        funFactNeptune: 'Neptun wurde durch Mathematik entdeckt, bevor er gesehen wurde - seine Schwerkraft beeinflusste die Umlaufbahn von Uranus!',
        funFactPluto: 'Ein Jahr auf Pluto dauert 248 Erdjahre! Er hat seit seiner Entdeckung 1930 noch keine Umlaufbahn vollendet.',
        
        // Mondbeschreibungen
        descPhobos: 'Phobos umkreist den Mars schneller als der Mars rotiert! Er geht im Westen auf und im Osten unter.',
        descDeimos: 'Deimos ist der kleinere der beiden Marsmonde und braucht 30 Stunden fÃ¼r eine Umkreisung.',
        descIo: 'Io ist der vulkanisch aktivste KÃ¶rper im Sonnensystem!',
        descEuropa: 'Europa hat einen globalen Ozean unter seinem Eis - ein potenzieller Ort fÃ¼r Leben!',
        descGanymede: 'Ganymed ist der grÃ¶ÃŸte Mond im Sonnensystem, grÃ¶ÃŸer als Merkur!',
        descCallisto: 'Callisto ist das am stÃ¤rksten verkraterte Objekt im Sonnensystem!',
        descTitan: 'Titan hat Seen und FlÃ¼sse aus flÃ¼ssigem Methan - der einzige Ort mit OberflÃ¤chenflÃ¼ssigkeiten auÃŸer der Erde!',
        descEnceladus: 'Enceladus spritzt WasserfontÃ¤nen aus seinem unterirdischen Ozean ins All!',
        descRhea: 'Rhea kÃ¶nnte ein eigenes Ringsystem haben!',
        descTitania: 'Titania ist der grÃ¶ÃŸte Mond von Uranus mit massiven Schluchten!',
        descMiranda: 'Miranda hat das dramatischste GelÃ¤nde im Sonnensystem mit 20 km hohen Klippen!',
        descTriton: 'Triton umkreist rÃ¼ckwÃ¤rts und hat Stickstoffgeysire! Wahrscheinlich ein eingefangenes Objekt aus dem KuipergÃ¼rtel.',
        descCharon: 'Charon ist im Vergleich zu Pluto so groÃŸ, dass sie ein Doppelsystem bilden!',
        
        // Satellitenbeschreibungen und Fakten
        descISS: 'Die ISS umkreist in 400 km HÃ¶he und vollendet alle 92,68 Minuten eine Umlaufbahn (15,54 UmlÃ¤ufe/Tag). Gestartet am 20. Nov 1998 (Zarya-Modul). Montage: 1998-2011 (42 FlÃ¼ge: 36 Shuttle, 6 russisch). Masse: 419.725 kg. Druckvolumen: 1.000 mÂ³. Dauerhaft bewohnt seit 2. Nov 2000 (24+ Jahre, 9.000+ Tage). 280+ Astronauten aus 23 LÃ¤ndern haben sie besucht.',
        funFactISS: 'Die ISS reist mit 27.600 km/h! Astronauten sehen 16 Sonnenauf-/untergÃ¤nge pro Tag. Sie ist seit 24+ Jahren dauerhaft bewohnt - lÃ¤nger als jedes andere Raumfahrzeug!',
        descHubble: 'Gestartet am 24. April 1990 mit der Discovery-FÃ¤hre. Umkreist in ~535 km HÃ¶he. Hat bis Okt 2025 1,6+ Millionen Beobachtungen durchgefÃ¼hrt. 2,4m PrimÃ¤rspiegel beobachtet UV, sichtbar und nahes IR. FÃ¼nf Wartungsmissionen (1993-2009) verbesserten die Instrumente.',
        funFactHubble: 'Kann Objekte auflÃ¶sen, die 0,05 Bogensekunden getrennt sind - wie das Sehen zweier GlÃ¼hwÃ¼rmchen in 10.000 km Entfernung! Das tiefste Bild (eXtreme Deep Field) zeigt 5.500 Galaxien, einige 13,2 Milliarden Lichtjahre entfernt.',
        descGPS: 'GPS-Konstellation (NAVSTAR): 31 operative Satelliten (Okt 2025) in 6 Bahnebenen, 55Â° Neigung. Jeder Satellit umkreist in 20.180 km HÃ¶he. Sendet L-Band-Signale (1,2-1,5 GHz). Rubidium/CÃ¤sium-Atomuhren genau auf 10â»Â¹â´ Sekunden.',
        funFactGPS: 'BenÃ¶tigt 4 Satelliten fÃ¼r 3D-Position (Trilateration + Uhrenkorrektur). Das System bietet 5-10m Genauigkeit. Das militÃ¤rische Signal (P/Y-Code) ist zentimetergenau!',
        descJWST: 'Gestartet am 25. Dez 2021. Erreichte L2-Punkt am 24. Jan 2022. Erste Bilder verÃ¶ffentlicht am 12. Jul 2022. Beobachtet Infrarot (0,6-28,5 Î¼m). 6,5m segmentierter Beryllium-Spiegel (18 Sechsecke) mit 25 mÂ² SammelflÃ¤che - 6x Hubble! Sonnenschild: 21,2m Ã— 14,2m, 5 Schichten.',
        funFactJWST: 'Arbeitet bei -233Â°C (-388Â°F)! Kann die thermische Signatur einer Hummel in Mondentfernung erkennen. Hat die Ã¤ltesten Galaxien bei z=14 entdeckt (280 Millionen Jahre nach dem Urknall).',
        
        // Raumfahrzeugbeschreibungen und Fakten
        descVoyager1: 'Voyager 1 ist das am weitesten von der Erde entfernte menschengemachte Objekt! Gestartet am 5. Sept 1977, trat am 25. Aug 2012 in den interstellaren Raum ein. Derzeit 24,3 Milliarden km (162 AE) von der Sonne entfernt. TrÃ¤gt die Goldene Schallplatte mit KlÃ¤ngen und Bildern der Erde.',
        funFactVoyager1: 'Voyager 1 reist mit 17 km/s (61.200 km/h). Seine Funksignale brauchen 22,5 Stunden zur Erde!',
        descVoyager2: 'Voyager 2 ist das einzige Raumfahrzeug, das alle vier Riesenplaneten besucht hat! Jupiter (Jul 1979), Saturn (Aug 1981), Uranus (Jan 1986), Neptun (Aug 1989). Trat am 5. Nov 2018 in den interstellaren Raum ein. Jetzt 20,3 Milliarden km (135 AE) von der Sonne entfernt.',
        funFactVoyager2: 'Voyager 2 entdeckte 16 Monde bei den Riesenplaneten, den GroÃŸen Dunklen Fleck des Neptun und die Geysire von Triton!',
        descNewHorizons: 'New Horizons gab uns am 14. Juli 2015 die ersten Nahaufnahmen von Pluto! EnthÃ¼llte Wassereis-Berge bis 3.500m HÃ¶he, riesige Stickstoffgletscher und die berÃ¼hmte herzfÃ¶rmige Tombaugh Regio. Jetzt 59 AE von der Sonne entfernt, erkundet den KuipergÃ¼rtel.',
        funFactNewHorizons: 'New Horizons reiste 9,5 Jahre und 5 Milliarden km, um Pluto mit 58.536 km/h zu erreichen. TrÃ¤gt 28g von Clyde Tombaughs Asche!',
        descJuno: 'Juno trat am 4. Juli 2016 in die Jupiter-Umlaufbahn ein. Untersucht Zusammensetzung, Gravitationsfeld, Magnetfeld und polare Polarlichter. Entdeckte, dass Jupiters Kern grÃ¶ÃŸer und "unscharf" ist, massive polare WirbelstÃ¼rme und atmosphÃ¤rische Ammoniakverteilung. Mission bis Sept 2025 verlÃ¤ngert.',
        funFactJuno: 'Erstes solarbetriebenes Raumfahrzeug zu Jupiter! Drei 9m Solarpanele erzeugen 500W. TrÃ¤gt drei LEGO-Figuren: Galileo, Jupiter und Juno!',
        descCassini: 'Cassini umkreiste Saturn vom 30. Juni 2004 bis 15. Sept 2017 (13 Jahre). Entdeckte Methan/Ethan-FlÃ¼ssigseen auf Titan, WasserfontÃ¤nen auf Enceladus, neue Ringe, 7 neue Monde. Die Huygens-Sonde landete am 14. Jan 2005 auf Titan. Endete mit "Grand Finale" AtmosphÃ¤reneintritt.',
        funFactCassini: 'Entdeckte den unterirdischen Ozean von Enceladus! WasserfontÃ¤nen sprÃ¼hen 250kg/s ins All. Cassini flog durch die FontÃ¤nen, entdeckte H2, organische Verbindungen - Zutaten fÃ¼r Leben!',
        descPioneer10: 'Pioneer 10 war das erste Raumfahrzeug, das den AsteroidengÃ¼rtel durchquerte und Jupiter besuchte (3. Dez 1973)! Gestartet am 2. MÃ¤rz 1972, trug die berÃ¼hmte Pioneer-Plakette mit Menschen und Erdposition. Letzter Kontakt: 23. Jan 2003 bei 12,2 Milliarden km.',
        funFactPioneer10: 'Pioneer 10 trÃ¤gt eine goldene Plakette von Carl Sagan, die einen Mann, eine Frau und die Erdposition zeigt - eine Botschaft fÃ¼r AuÃŸerirdische, die sie finden kÃ¶nnten!',
        descPioneer11: 'Pioneer 11 war das erste Raumfahrzeug, das Saturn besuchte (1. Sept 1979)! Flog auch an Jupiter vorbei (2. Dez 1974). Gestartet am 5. April 1973, entdeckte Saturns F-Ring und einen neuen Mond. TrÃ¤gt ebenfalls die Pioneer-Plakette. Letzter Kontakt: 24. Nov 1995 bei 6,5 Milliarden km.',
        funFactPioneer11: 'Pioneer 11 nutzte Jupiters Schwerkraft fÃ¼r das erste planetare Swing-by-ManÃ¶ver und sparte Jahre Reisezeit zum Saturn!',
        
        // Kometenbeschreibungen
        descHalley: 'Der Halleysche Komet ist der berÃ¼hmteste! Er kehrt alle 75-76 Jahre zur Erde zurÃ¼ck. Zuletzt 1986 gesehen, wird er 2061 wiederkommen. Wenn Sie ihn sehen, beobachten Sie einen 4,6 Milliarden Jahre alten kosmischen Schneeball!',
        descHaleBopp: 'Hale-Bopp war einer der hellsten Kometen des 20. Jahrhunderts, 18 Monate lang 1996-1997 mit bloÃŸem Auge sichtbar! Sein Kern ist auÃŸergewÃ¶hnlich groÃŸ mit 60 km Durchmesser.',
        descNeowise: 'Komet NEOWISE war im Juli 2020 ein spektakulÃ¤rer Anblick! Er wird erst in etwa 6.800 Jahren wiederkommen. Kometen sind "schmutzige SchneebÃ¤lle" aus Eis, Staub und Gestein von der Entstehung des Sonnensystems.'
    },
    
    es: {
        // TÃ­tulo y encabezado de la aplicaciÃ³n
        appTitle: "Viaje Espacial",
        subtitle: "Sistema Solar 3D Interactivo",
        
        // NavegaciÃ³n
        quickNavigation: "NavegaciÃ³n RÃ¡pida",
        
        // CategorÃ­as de objetos
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
        jupiter: "JÃºpiter",
        io: "Ão",
        europa: "Europa",
        ganymede: "GanÃ­medes",
        callisto: "Calisto",
        saturnSystem: "Sistema Saturniano",
        saturn: "Saturno",
        titan: "TitÃ¡n",
        uranusSystem: "Sistema de Urano",
        uranus: "Urano",
        neptuneSystem: "Sistema Neptuniano",
        neptune: "Neptuno",
        pluto: "PlutÃ³n",
        charon: "Caronte",
        enceladus: "EncÃ©lado",
        rhea: "Rea",
        titania: "Titania",
        miranda: "Miranda",
        triton: "TritÃ³n",
        
        // Secciones del menÃº de navegaciÃ³n
        navOurStar: "Nuestra Estrella",
        navInnerPlanets: "Planetas Interiores (Rocosos)",
        navAsteroidBelt: "CinturÃ³n de Asteroides",
        navOuterPlanets: "Planetas Exteriores (Gigantes Gaseosos)",
        navIceGiants: "Gigantes de Hielo",
        navKuiperBelt: "CinturÃ³n de Kuiper y Planetas Enanos",
        navComets: "Cometas",
        navSatellites: "SatÃ©lites y Estaciones Espaciales",
        navSpacecraft: "Naves Espaciales y Sondas",
        navDistantStars: "Estrellas Distantes",
        kuiperBelt: "CinturÃ³n de Kuiper",
        asteroidBelt: "CinturÃ³n de Asteroides",
        
        // Botones de control
        toggleOrbits: "Ã“rbitas",
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
        
        // Panel de informaciÃ³n
        name: "Nombre",
        type: "Tipo",
        distance: "Distancia",
        size: "TamaÃ±o",
        description: "DescripciÃ³n",
        
        // Pantalla de carga
        loading: "Cargando...",
        initializing: "Inicializando...",
        settingUpScene: "Configurando escena...",
        initializingControls: "Inicializando controles...",
        loadingSolarSystem: "Cargando sistema solar...",
        creatingSun: "Creando el Sol...",
        selectObject: "Seleccionar un Objeto",
        clickToExplore: "Haz clic en los objetos para explorar y aprender mÃ¡s",
        
        // Ayuda
        help: "Ayuda",
        helpTitle: "Viaje Espacial - Controles y Funciones",
        controls: "Controles",
        mouseControls: "Controles del RatÃ³n:",
        leftClick: "Clic Izquierdo + Arrastrar: Rotar vista",
        rightClick: "Clic Derecho + Arrastrar: Mover vista",
        scroll: "Rueda: Acercar/Alejar",
        clickObject: "Clic en Objeto: Ver detalles",
        keyboardShortcuts: "Atajos de Teclado:",
        spaceKey: "Espacio: Pausar/Reanudar",
        plusMinus: "+/-: Cambiar velocidad",
        rKey: "R: Restablecer vista",
        hKey: "H: Alternar ayuda",
        lKey: "L: Alternar punteros lÃ¡ser (RV)",
        features: "Funciones",
        vrSupport: "Soporte RV/RA con WebXR",
        realisticOrbits: "MecÃ¡nica orbital realista",
        educationalMode: "Modos de escala educativo y realista",
        constellations: "Principales constelaciones visibles",
        spacecraft: "Naves espaciales y satÃ©lites histÃ³ricos",
        
        // Notificaciones
        updateAvailable: "ActualizaciÃ³n Disponible",
        updateMessage: "Â¡Una nueva versiÃ³n estÃ¡ disponible!",
        updateButton: "Actualizar Ahora",
        updateLater: "MÃ¡s Tarde",
        offline: "Modo Sin ConexiÃ³n",
        offlineMessage: "EstÃ¡s sin conexiÃ³n. Algunas funciones pueden estar limitadas.",
        installTitle: "Instalar Viaje Espacial",
        installMessage: "Â¡Instala Viaje Espacial como aplicaciÃ³n para una mejor experiencia!",
        installButton: "Instalar",
        installLater: "QuizÃ¡s MÃ¡s Tarde",
        errorLoading: "Error al cargar Viaje Espacial",
        errorMessage: "Por favor, actualiza la pÃ¡gina para intentarlo de nuevo.",
        
        // Pie de pÃ¡gina
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
        descSun: 'El Sol es una estrella de tipo G (enana amarilla) que contiene el 99,86% de la masa del Sistema Solar. Temperatura superficial: 5.778 K. Edad: 4,6 mil millones de aÃ±os. Â¡Fusiona 600 millones de toneladas de hidrÃ³geno en helio cada segundo!',
        descMercury: 'Mercurio es el planeta mÃ¡s pequeÃ±o y el mÃ¡s cercano al Sol. Su superficie estÃ¡ cubierta de crÃ¡teres como nuestra Luna. La temperatura varÃ­a de -180Â°C por la noche a 430Â°C durante el dÃ­a: Â¡el mayor rango de temperatura en el sistema solar!',
        descVenus: 'Venus es el planeta mÃ¡s caliente con una temperatura superficial de 465Â°C debido a un efecto invernadero extremo. Su atmÃ³sfera es 96% CO2 con nubes de Ã¡cido sulfÃºrico. Â¡Venus gira hacia atrÃ¡s en comparaciÃ³n con la mayorÃ­a de los planetas!',
        descEarth: 'La Tierra es nuestro hogar, Â¡el Ãºnico planeta conocido con vida! El 71% estÃ¡ cubierto de agua, creando el color azul visible desde el espacio. La atmÃ³sfera nos protege de la radiaciÃ³n daÃ±ina y los meteoros.',
        descMoon: 'La Luna terrestre es la quinta luna mÃ¡s grande del sistema solar. Crea las mareas, estabiliza la inclinaciÃ³n de la Tierra y se formÃ³ hace 4,5 mil millones de aÃ±os cuando un objeto del tamaÃ±o de Marte impactÃ³ la Tierra!',
        descMars: 'Marte, el Planeta Rojo, debe su color al Ã³xido de hierro (Ã³xido). Tiene el volcÃ¡n mÃ¡s grande (Olympus Mons - 22 km de altura) y el caÃ±Ã³n mÃ¡s largo (Valles Marineris - 4.000 km de largo) del sistema solar. Â¡Existe hielo de agua en sus polos!',
        descJupiter: 'JÃºpiter es el planeta mÃ¡s grande: Â¡todos los demÃ¡s planetas podrÃ­an caber dentro! La Gran Mancha Roja es una tormenta mÃ¡s grande que la Tierra que ha estado activa durante al menos 400 aÃ±os. Â¡JÃºpiter tiene 95 lunas conocidas!',
        descSaturn: 'Saturno es famoso por su espectacular sistema de anillos compuestos de partÃ­culas de hielo y roca. Â¡Es el planeta menos denso: flotarÃ­a en agua! Saturno tiene 146 lunas conocidas, incluida TitÃ¡n, que tiene una atmÃ³sfera densa.',
        descUranus: 'Urano es Ãºnico: Â¡gira de lado! Esto significa que sus polos se turnan para mirar al Sol durante su Ã³rbita de 84 aÃ±os. Compuesto de hielos de agua, metano y amonÃ­aco, aparece de color azul verdoso debido al metano en su atmÃ³sfera.',
        descNeptune: 'Neptuno es el planeta mÃ¡s ventoso con tormentas que alcanzan Â¡2.100 km/h! Es el planeta mÃ¡s lejano del Sol y tarda 165 aÃ±os terrestres en completar una Ã³rbita. Su color azul proviene del metano en la atmÃ³sfera.',
        
        // Mensajes de carga
        creatingMercury: 'Creando Mercurio...',
        creatingVenus: 'Creando Venus...',
        creatingEarth: 'Creando la Tierra...',
        creatingMars: 'Creando Marte...',
        creatingJupiter: 'Creando JÃºpiter...',
        creatingSaturn: 'Creando Saturno...',
        creatingUranus: 'Creando Urano...',
        creatingNeptune: 'Creando Neptuno...',
        creatingAsteroidBelt: 'Creando cinturÃ³n de asteroides...',
        creatingKuiperBelt: 'Creando cinturÃ³n de Kuiper...',
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
        creatingSatellites: 'Creando satÃ©lites...',
        creatingSpacecraft: 'Creando naves espaciales...',
        
        // Texto del sistema
        centerSolarSystem: 'Centro del Sistema Solar',
        orbitsParent: 'Orbita',
        millionKmFromSun: 'millones de km del Sol',
        distanceVaries: 'Distancia varÃ­a',
        noDescription: 'No hay descripciÃ³n disponible',
        moonCount: 'Este planeta tiene',
        majorMoon: 'luna grande',
        majorMoons: 'lunas grandes',
        shownHere: 'mostradas aquÃ­ (Â¡existen muchas mÃ¡s pequeÃ±as!)',
        
        // Datos curiosos
        funFactSun: 'Â¡El Sol es tan grande que 1,3 millones de Tierras podrÃ­an caber dentro!',
        funFactMercury: 'Â¡Un aÃ±o en Mercurio (88 dÃ­as terrestres) es mÃ¡s corto que su dÃ­a (176 dÃ­as terrestres)!',
        funFactVenus: 'Venus es el planeta mÃ¡s brillante en nuestro cielo y a menudo se le llama el "gemelo malvado" de la Tierra',
        funFactEarth: 'Â¡La Tierra es el Ãºnico planeta que no lleva el nombre de un dios. Viaja a 107.000 km/h alrededor del Sol!',
        funFactMoon: 'Â¡La Luna se estÃ¡ alejando lentamente de la Tierra a 3,8 cm por aÃ±o!',
        funFactMars: 'Â¡Marte tiene estaciones como la Tierra, y su dÃ­a es solo 37 minutos mÃ¡s largo que el nuestro!',
        funFactJupiter: 'Â¡La gravedad de JÃºpiter protege a la Tierra de muchos asteroides y cometas!',
        funFactSaturn: 'Â¡Los anillos de Saturno tienen solo 10 metros de espesor pero 280.000 km de ancho!',
        funFactUranus: 'Â¡Urano fue el primer planeta descubierto con un telescopio (1781)!',
        funFactNeptune: 'Â¡Neptuno fue descubierto por matemÃ¡ticas antes de ser visto: su gravedad afectaba la Ã³rbita de Urano!',
        funFactPluto: 'Â¡Un aÃ±o en PlutÃ³n dura 248 aÃ±os terrestres! No ha completado una Ã³rbita desde su descubrimiento en 1930.',
        
        // Descripciones de lunas
        descPhobos: 'Â¡Fobos orbita Marte mÃ¡s rÃ¡pido de lo que Marte gira! Sale por el oeste y se pone por el este.',
        descDeimos: 'Deimos es la mÃ¡s pequeÃ±a de las dos lunas de Marte y tarda 30 horas en orbitar.',
        descIo: 'Â¡Ão es el cuerpo mÃ¡s volcÃ¡nicamente activo del sistema solar!',
        descEuropa: 'Â¡Europa tiene un ocÃ©ano global bajo su hielo: un lugar potencial para la vida!',
        descGanymede: 'Â¡GanÃ­medes es la luna mÃ¡s grande del sistema solar, mÃ¡s grande que Mercurio!',
        descCallisto: 'Â¡Calisto es el objeto mÃ¡s craterizado del sistema solar!',
        descTitan: 'Â¡TitÃ¡n tiene lagos y rÃ­os de metano lÃ­quido: el Ãºnico lugar con lÃ­quidos superficiales aparte de la Tierra!',
        descEnceladus: 'Â¡EncÃ©lado expulsa chorros de agua al espacio desde su ocÃ©ano subterrÃ¡neo!',
        descRhea: 'Â¡Rea podrÃ­a tener su propio sistema de anillos!',
        descTitania: 'Â¡Titania es la luna mÃ¡s grande de Urano con caÃ±ones masivos!',
        descMiranda: 'Â¡Miranda tiene el terreno mÃ¡s dramÃ¡tico del sistema solar con acantilados de 20 km de altura!',
        descTriton: 'Â¡TritÃ³n orbita hacia atrÃ¡s y tiene gÃ©iseres de nitrÃ³geno! Probablemente es un objeto capturado del cinturÃ³n de Kuiper.',
        descCharon: 'Â¡Caronte es tan grande comparado con PlutÃ³n que forman un sistema binario!',
        
        // Descripciones y datos de satÃ©lites
        descISS: 'La EEI orbita a 400 km de altitud, completando una Ã³rbita cada 92,68 minutos (15,54 Ã³rbitas/dÃ­a). Lanzada el 20 nov 1998 (mÃ³dulo Zarya). Ensamblaje: 1998-2011 (42 vuelos: 36 Shuttle, 6 rusos). Masa: 419.725 kg. Volumen presurizado: 1.000 mÂ³. OcupaciÃ³n continua desde el 2 nov 2000 (24+ aÃ±os, 9.000+ dÃ­as). 280+ astronautas de 23 paÃ­ses la han visitado.',
        funFactISS: 'Â¡La EEI viaja a 27.600 km/h! Los astronautas ven 16 amaneceres/atardeceres por dÃ­a. Â¡Ha estado continuamente ocupada durante 24+ aÃ±os, mÃ¡s que cualquier otra nave espacial!',
        descHubble: 'Lanzado el 24 abril 1990 por el transbordador Discovery. Orbita a ~535 km de altitud. Ha realizado 1,6+ millones de observaciones hasta oct 2025. Espejo primario de 2,4m observa UV, visible e IR cercano. Cinco misiones de servicio (1993-2009) mejoraron los instrumentos.',
        funFactHubble: 'Â¡Puede resolver objetos separados por 0,05 segundos de arco: como ver dos luciÃ©rnagas a 10.000 km! La imagen mÃ¡s profunda (eXtreme Deep Field) muestra 5.500 galaxias, algunas a 13,2 mil millones de aÃ±os luz.',
        descGPS: 'ConstelaciÃ³n GPS (NAVSTAR): 31 satÃ©lites operativos (oct 2025) en 6 planos orbitales, inclinaciÃ³n 55Â°. Cada satÃ©lite orbita a 20.180 km de altitud. Transmite seÃ±ales banda L (1,2-1,5 GHz). Relojes atÃ³micos de rubidio/cesio precisos a 10â»Â¹â´ segundos.',
        funFactGPS: 'Â¡Necesita 4 satÃ©lites para posiciÃ³n 3D (trilateraciÃ³n + correcciÃ³n de reloj). El sistema proporciona precisiÃ³n de 5-10m. La seÃ±al militar (cÃ³digo P/Y) es precisa al centÃ­metro!',
        descJWST: 'Lanzado el 25 dic 2021. AlcanzÃ³ el punto L2 el 24 ene 2022. Primeras imÃ¡genes publicadas el 12 jul 2022. Observa infrarrojo (0,6-28,5 Î¼m). Espejo segmentado de berilio de 6,5m (18 hexÃ¡gonos) con 25 mÂ² de Ã¡rea colectora: Â¡6x Hubble! Parasol: 21,2m Ã— 14,2m, 5 capas.',
        funFactJWST: 'Â¡Opera a -233Â°C (-388Â°F)! Puede detectar la firma tÃ©rmica de un abejorro a distancia lunar. Â¡Ha descubierto las galaxias mÃ¡s antiguas en z=14 (280 millones de aÃ±os despuÃ©s del Big Bang)!',
        
        // Descripciones y datos de naves espaciales
        descVoyager1: 'Â¡Voyager 1 es el objeto hecho por el hombre mÃ¡s lejano de la Tierra! Lanzada el 5 sept 1977, entrÃ³ al espacio interestelar el 25 ago 2012. Actualmente a 24,3 mil millones de km (162 UA) del Sol. Lleva el Disco de Oro con sonidos e imÃ¡genes de la Tierra.',
        funFactVoyager1: 'Â¡Voyager 1 viaja a 17 km/s (61.200 km/h). Sus seÃ±ales de radio tardan 22,5 horas en llegar a la Tierra!',
        descVoyager2: 'Â¡Voyager 2 es la Ãºnica nave espacial que ha visitado los cuatro planetas gigantes! JÃºpiter (jul 1979), Saturno (ago 1981), Urano (ene 1986), Neptuno (ago 1989). EntrÃ³ al espacio interestelar el 5 nov 2018. Ahora a 20,3 mil millones de km (135 UA) del Sol.',
        funFactVoyager2: 'Â¡Voyager 2 descubriÃ³ 16 lunas entre los planetas gigantes, la Gran Mancha Oscura de Neptuno y los gÃ©iseres de TritÃ³n!',
        descNewHorizons: 'Â¡New Horizons nos dio las primeras imÃ¡genes cercanas de PlutÃ³n el 14 julio 2015! RevelÃ³ montaÃ±as de hielo de agua de hasta 3.500m de altura, vastos glaciares de nitrÃ³geno y la famosa Tombaugh Regio en forma de corazÃ³n. Ahora a 59 UA del Sol, explorando el cinturÃ³n de Kuiper.',
        funFactNewHorizons: 'Â¡New Horizons viajÃ³ 9,5 aÃ±os y 5 mil millones de km para llegar a PlutÃ³n a 58.536 km/h. Lleva 28g de las cenizas de Clyde Tombaugh!',
        descJuno: 'Juno entrÃ³ en Ã³rbita de JÃºpiter el 4 julio 2016. Estudia composiciÃ³n, campo gravitacional, campo magnÃ©tico y auroras polares. DescubriÃ³ que el nÃºcleo de JÃºpiter es mÃ¡s grande y "difuso", ciclones polares masivos y distribuciÃ³n de amonÃ­aco atmosfÃ©rico. MisiÃ³n extendida hasta sept 2025.',
        funFactJuno: 'Â¡Primera nave espacial solar a JÃºpiter! Tres paneles solares de 9m generan 500W. Â¡Lleva tres figuras LEGO: Galileo, JÃºpiter y Juno!',
        descCassini: 'Cassini orbitÃ³ Saturno del 30 junio 2004 al 15 sept 2017 (13 aÃ±os). DescubriÃ³ lagos de metano/etano lÃ­quido en TitÃ¡n, gÃ©iseres de agua en EncÃ©lado, nuevos anillos, 7 lunas nuevas. La sonda Huygens aterrizÃ³ en TitÃ¡n el 14 ene 2005. TerminÃ³ con entrada atmosfÃ©rica "Gran Finale".',
        funFactCassini: 'Â¡DescubriÃ³ el ocÃ©ano subterrÃ¡neo de EncÃ©lado! Los gÃ©iseres de agua expulsan 250kg/s al espacio. Â¡Cassini volÃ³ a travÃ©s de los penachos, detectÃ³ H2, compuestos orgÃ¡nicos: ingredientes para la vida!',
        descPioneer10: 'Â¡Pioneer 10 fue la primera nave espacial en cruzar el cinturÃ³n de asteroides y visitar JÃºpiter (3 dic 1973)! Lanzada el 2 marzo 1972, llevaba la famosa placa Pioneer mostrando humanos y la ubicaciÃ³n de la Tierra. Ãšltimo contacto: 23 ene 2003 a 12,2 mil millones de km.',
        funFactPioneer10: 'Â¡Pioneer 10 lleva una placa dorada diseÃ±ada por Carl Sagan mostrando un hombre, una mujer y la ubicaciÃ³n de la Tierra: un mensaje para extraterrestres que puedan encontrarla!',
        descPioneer11: 'Â¡Pioneer 11 fue la primera nave espacial en visitar Saturno (1 sept 1979)! TambiÃ©n sobrevolÃ³ JÃºpiter (2 dic 1974). Lanzada el 5 abril 1973, descubriÃ³ el anillo F de Saturno y una nueva luna. TambiÃ©n lleva la placa Pioneer. Ãšltimo contacto: 24 nov 1995 a 6,5 mil millones de km.',
        funFactPioneer11: 'Â¡Pioneer 11 usÃ³ la gravedad de JÃºpiter para la primera asistencia gravitacional planetaria, ahorrando aÃ±os de viaje a Saturno!',
        
        // Descripciones de cometas
        descHalley: 'Â¡El cometa Halley es el mÃ¡s famoso! Regresa a las cercanÃ­as de la Tierra cada 75-76 aÃ±os. Visto por Ãºltima vez en 1986, regresarÃ¡ en 2061. Â¡Cuando lo ves, estÃ¡s observando una bola de nieve cÃ³smica de 4,6 mil millones de aÃ±os!',
        descHaleBopp: 'Â¡Hale-Bopp fue uno de los cometas mÃ¡s brillantes del siglo XX, visible a simple vista durante 18 meses en 1996-1997! Su nÃºcleo es excepcionalmente grande con 60 km de diÃ¡metro.',
        descNeowise: 'Â¡El cometa NEOWISE fue un espectÃ¡culo espectacular en julio 2020! No regresarÃ¡ hasta dentro de unos 6.800 aÃ±os. Los cometas son "bolas de nieve sucias" compuestas de hielo, polvo y roca de la formaciÃ³n del sistema solar.'
    },
    
    pt: {
        // TÃ­tulo e cabeÃ§alho do aplicativo
        appTitle: "Viagem Espacial",
        subtitle: "Sistema Solar 3D Interativo",
        
        // NavegaÃ§Ã£o
        quickNavigation: "NavegaÃ§Ã£o RÃ¡pida",
        
        // Categorias de objetos
        ourStar: "Nossa Estrela",
        sun: "Sol",
        mercury: "MercÃºrio",
        venus: "VÃªnus",
        earthSystem: "Sistema Terrestre",
        earth: "Terra",
        moon: "Lua",
        marsSystem: "Sistema Marciano",
        mars: "Marte",
        phobos: "Fobos",
        deimos: "Deimos",
        jupiterSystem: "Sistema Joviano",
        jupiter: "JÃºpiter",
        io: "Io",
        europa: "Europa",
        ganymede: "Ganimedes",
        callisto: "Calisto",
        saturnSystem: "Sistema Saturniano",
        saturn: "Saturno",
        titan: "TitÃ£",
        uranusSystem: "Sistema de Urano",
        uranus: "Urano",
        neptuneSystem: "Sistema Netuniano",
        neptune: "Netuno",
        pluto: "PlutÃ£o",
        charon: "Caronte",
        enceladus: "EncÃ©lado",
        rhea: "Reia",
        titania: "TitÃ¢nia",
        miranda: "Miranda",
        triton: "TritÃ£o",
        
        // SeÃ§Ãµes do menu de navegaÃ§Ã£o
        navOurStar: "Nossa Estrela",
        navInnerPlanets: "Planetas Interiores (Rochosos)",
        navAsteroidBelt: "CinturÃ£o de Asteroides",
        navOuterPlanets: "Planetas Exteriores (Gigantes Gasosos)",
        navIceGiants: "Gigantes de Gelo",
        navKuiperBelt: "CinturÃ£o de Kuiper e Planetas AnÃµes",
        navComets: "Cometas",
        navSatellites: "SatÃ©lites e EstaÃ§Ãµes Espaciais",
        navSpacecraft: "Naves Espaciais e Sondas",
        navDistantStars: "Estrelas Distantes",
        kuiperBelt: "CinturÃ£o de Kuiper",
        asteroidBelt: "CinturÃ£o de Asteroides",
        
        // BotÃµes de controle
        toggleOrbits: "Ã“rbitas",
        toggleConstellations: "ConstelaÃ§Ãµes",
        toggleScale: "Escala Educacional",
        toggleScaleRealistic: "Escala Realista",
        toggleLabels: "RÃ³tulos DESLIGADOS",
        toggleLabelsOn: "RÃ³tulos LIGADOS",
        resetView: "Redefinir",
        enterVR: "Entrar em RV",
        enterAR: "Entrar em RA",
        
        // Controle de velocidade
        speedLabel: "Velocidade:",
        paused: "Pausado",
        realTime: "1x Tempo real",
        
        // Painel de informaÃ§Ãµes
        name: "Nome",
        type: "Tipo",
        distance: "DistÃ¢ncia",
        size: "Tamanho",
        description: "DescriÃ§Ã£o",
        
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
        leftClick: "Clique Esquerdo + Arrastar: Girar visualizaÃ§Ã£o",
        rightClick: "Clique Direito + Arrastar: Mover visualizaÃ§Ã£o",
        scroll: "Scroll: Aproximar/Afastar",
        clickObject: "Clique no Objeto: Ver detalhes",
        keyboardShortcuts: "Atalhos do Teclado:",
        spaceKey: "EspaÃ§o: Pausar/Retomar",
        plusMinus: "+/-: Mudar velocidade",
        rKey: "R: Redefinir visualizaÃ§Ã£o",
        hKey: "H: Alternar ajuda",
        lKey: "L: Alternar ponteiros laser (RV)",
        features: "Recursos",
        vrSupport: "Suporte RV/RA com WebXR",
        realisticOrbits: "MecÃ¢nica orbital realista",
        educationalMode: "Modos de escala educacional e realista",
        constellations: "Principais constelaÃ§Ãµes visÃ­veis",
        spacecraft: "Naves espaciais e satÃ©lites histÃ³ricos",
        
        // NotificaÃ§Ãµes
        updateAvailable: "AtualizaÃ§Ã£o DisponÃ­vel",
        updateMessage: "Uma nova versÃ£o estÃ¡ disponÃ­vel!",
        updateButton: "Atualizar Agora",
        updateLater: "Mais Tarde",
        offline: "Modo Offline",
        offlineMessage: "VocÃª estÃ¡ offline. Alguns recursos podem estar limitados.",
        installTitle: "Instalar Viagem Espacial",
        installMessage: "Instale Viagem Espacial como aplicativo para uma melhor experiÃªncia!",
        installButton: "Instalar",
        installLater: "Talvez Mais Tarde",
        errorLoading: "Erro ao carregar Viagem Espacial",
        errorMessage: "Por favor, atualize a pÃ¡gina para tentar novamente.",
        
        // RodapÃ©
        madeWith: "Feito com",
        and: "e",
        by: "por",
        
        // Tipos de objetos
        typeStar: 'Estrela',
        typePlanet: 'Planeta',
        typeMoon: 'Lua',
        typeSpacecraft: 'Nave Espacial',
        typeDwarfPlanet: 'Planeta AnÃ£o',
        typeNebula: 'Nebulosa',
        typeGalaxy: 'GalÃ¡xia',
        
        // DescriÃ§Ãµes de objetos
        descSun: 'O Sol Ã© uma estrela de tipo G (anÃ£ amarela) contendo 99,86% da massa do Sistema Solar. Temperatura da superfÃ­cie: 5.778 K. Idade: 4,6 bilhÃµes de anos. Ele funde 600 milhÃµes de toneladas de hidrogÃªnio em hÃ©lio a cada segundo!',
        descMercury: 'MercÃºrio Ã© o menor planeta e o mais prÃ³ximo do Sol. Sua superfÃ­cie Ã© coberta com crateras como nossa Lua. A temperatura varia de -180Â°C Ã  noite a 430Â°C durante o dia - a maior variaÃ§Ã£o de temperatura no sistema solar!',
        descVenus: 'VÃªnus Ã© o planeta mais quente com temperatura de superfÃ­cie de 465Â°C devido a um efeito estufa extremo. Sua atmosfera Ã© 96% CO2 com nuvens de Ã¡cido sulfÃºrico. VÃªnus gira para trÃ¡s em comparaÃ§Ã£o com a maioria dos planetas!',
        descEarth: 'A Terra Ã© nosso lar, o Ãºnico planeta conhecido com vida! 71% Ã© coberto por Ã¡gua, criando a cor azul visÃ­vel do espaÃ§o. A atmosfera nos protege de radiaÃ§Ã£o nociva e meteoros.',
        descMoon: 'A Lua da Terra Ã© a quinta maior lua do sistema solar. Ela cria as marÃ©s, estabiliza a inclinaÃ§Ã£o da Terra e foi formada hÃ¡ 4,5 bilhÃµes de anos quando um objeto do tamanho de Marte colidiu com a Terra!',
        descMars: 'Marte, o Planeta Vermelho, deve sua cor ao Ã³xido de ferro (ferrugem). Ele tem o maior vulcÃ£o (Olympus Mons - 22 km de altura) e o cÃ¢nion mais longo (Valles Marineris - 4.000 km de comprimento) do sistema solar. Existe gelo de Ã¡gua em seus polos!',
        descJupiter: 'JÃºpiter Ã© o maior planeta - todos os outros planetas poderiam caber dentro dele! A Grande Mancha Vermelha Ã© uma tempestade maior que a Terra que tem durado pelo menos 400 anos. JÃºpiter tem 95 luas conhecidas!',
        descSaturn: 'Saturno Ã© famoso por seu espetacular sistema de anÃ©is feito de partÃ­culas de gelo e rocha. Ã‰ o planeta menos denso - flutuaria na Ã¡gua! Saturno tem 146 luas conhecidas, incluindo TitÃ£, que tem uma atmosfera densa.',
        descUranus: 'Urano Ã© Ãºnico - ele gira de lado! Isso significa que seus polos se revezam voltados para o Sol durante sua Ã³rbita de 84 anos. Feito de gelos de Ã¡gua, metano e amÃ´nia, aparece azul-esverdeado devido ao metano em sua atmosfera.',
        descNeptune: 'Netuno Ã© o planeta mais ventoso com tempestades alcanÃ§ando 2.100 km/h! Ã‰ o planeta mais distante do Sol e leva 165 anos terrestres para completar uma Ã³rbita. Sua cor azul vem do metano na atmosfera.',
        
        // Mensagens de carregamento
        creatingMercury: 'Criando MercÃºrio...',
        creatingVenus: 'Criando VÃªnus...',
        creatingEarth: 'Criando a Terra...',
        creatingMars: 'Criando Marte...',
        creatingJupiter: 'Criando JÃºpiter...',
        creatingSaturn: 'Criando Saturno...',
        creatingUranus: 'Criando Urano...',
        creatingNeptune: 'Criando Netuno...',
        creatingAsteroidBelt: 'Criando cinturÃ£o de asteroides...',
        creatingKuiperBelt: 'Criando cinturÃ£o de Kuiper...',
        creatingStarfield: 'Criando campo estelar...',
        creatingOrbitalPaths: 'Criando trajetÃ³rias orbitais...',
        creatingConstellations: 'Criando constelaÃ§Ãµes...',
        creatingDistantStars: 'Criando estrelas distantes...',
        creatingNebulae: 'Criando nebulosas...',
        creatingGalaxies: 'Criando galÃ¡xias...',
        creatingNearbyStars: 'Criando estrelas prÃ³ximas...',
        creatingExoplanets: 'Criando exoplanetas...',
        creatingComets: 'Criando cometas...',
        creatingLabels: 'Criando rÃ³tulos...',
        creatingSatellites: 'Criando satÃ©lites...',
        creatingSpacecraft: 'Criando naves espaciais...',
        
        // Texto do sistema
        centerSolarSystem: 'Centro do Sistema Solar',
        orbitsParent: 'Orbita',
        millionKmFromSun: 'milhÃµes de km do Sol',
        distanceVaries: 'DistÃ¢ncia varia',
        noDescription: 'Nenhuma descriÃ§Ã£o disponÃ­vel',
        moonCount: 'Este planeta tem',
        majorMoon: 'lua grande',
        majorMoons: 'luas grandes',
        shownHere: 'mostradas aqui (muitas mais pequenas existem!)',
        
        // Fatos divertidos
        funFactSun: 'O Sol Ã© tÃ£o grande que 1,3 milhÃ£o de Terras poderiam caber dentro dele!',
        funFactMercury: 'Um ano em MercÃºrio (88 dias terrestres) Ã© mais curto que seu dia (176 dias terrestres)!',
        funFactVenus: 'VÃªnus Ã© o planeta mais brilhante em nosso cÃ©u e Ã© frequentemente chamado de "gÃªmeo maligno" da Terra',
        funFactEarth: 'A Terra Ã© o Ãºnico planeta que nÃ£o tem o nome de um deus. Ela viaja a 107.000 km/h ao redor do Sol!',
        funFactMoon: 'A Lua estÃ¡ lentamente se afastando da Terra a 3,8 cm por ano!',
        funFactMars: 'Marte tem estaÃ§Ãµes como a Terra, e seu dia Ã© apenas 37 minutos mais longo que o nosso!',
        funFactJupiter: 'A gravidade de JÃºpiter protege a Terra de muitos asteroides e cometas!',
        funFactSaturn: 'Os anÃ©is de Saturno tÃªm apenas 10 metros de espessura, mas 280.000 km de largura!',
        funFactUranus: 'Urano foi o primeiro planeta descoberto com um telescÃ³pio (1781)!',
        funFactNeptune: 'Netuno foi descoberto pela matemÃ¡tica antes de ser visto - sua gravidade afetava a Ã³rbita de Urano!',
        funFactPluto: 'Um ano em PlutÃ£o dura 248 anos terrestres! Ele nÃ£o completou uma Ã³rbita desde sua descoberta em 1930.',
        
        // DescriÃ§Ãµes de luas
        descPhobos: 'Fobos orbita Marte mais rÃ¡pido do que Marte gira! Ele nasce no oeste e se pÃµe no leste.',
        descDeimos: 'Deimos Ã© a menor das duas luas de Marte e leva 30 horas para orbitar.',
        descIo: 'Io Ã© o corpo mais vulcanicamente ativo do sistema solar!',
        descEuropa: 'Europa tem um oceano global sob seu gelo - um local potencial para vida!',
        descGanymede: 'Ganimedes Ã© a maior lua do sistema solar, maior que MercÃºrio!',
        descCallisto: 'Calisto Ã© o objeto mais repleto de crateras no sistema solar!',
        descTitan: 'TitÃ£ tem lagos e rios de metano lÃ­quido - o Ãºnico lugar com lÃ­quidos na superfÃ­cie alÃ©m da Terra!',
        descEnceladus: 'EncÃ©lado expele jatos de Ã¡gua para o espaÃ§o de seu oceano subterrÃ¢neo!',
        descRhea: 'Reia pode ter seu prÃ³prio sistema de anÃ©is!',
        descTitania: 'TitÃ¢nia Ã© a maior lua de Urano com cÃ¢nions maciÃ§os!',
        descMiranda: 'Miranda tem o terreno mais dramÃ¡tico do sistema solar com falÃ©sias de 20 km de altura!',
        descTriton: 'TritÃ£o orbita para trÃ¡s e tem gÃªiseres de nitrogÃªnio! Provavelmente Ã© um objeto capturado do cinturÃ£o de Kuiper.',
        descCharon: 'Caronte Ã© tÃ£o grande comparado a PlutÃ£o que eles formam um sistema binÃ¡rio!',
        
        // DescriÃ§Ãµes e fatos de satÃ©lites
        descISS: 'A ISS orbita a 400 km de altitude, completando uma Ã³rbita a cada 92,68 minutos (15,54 Ã³rbitas/dia). LanÃ§ada em 20 nov 1998 (mÃ³dulo Zarya). Montagem: 1998-2011 (42 voos: 36 Shuttle, 6 russos). Massa: 419.725 kg. Volume pressurizado: 1.000 mÂ³. OcupaÃ§Ã£o contÃ­nua desde 2 nov 2000 (24+ anos, 9.000+ dias). 280+ astronautas de 23 paÃ­ses a visitaram.',
        funFactISS: 'A ISS viaja a 27.600 km/h! Os astronautas veem 16 nascer/pÃ´r do sol por dia. Ela estÃ¡ continuamente ocupada hÃ¡ 24+ anos - mais do que qualquer outra nave espacial!',
        descHubble: 'LanÃ§ado em 24 abril 1990 pelo Ã´nibus Discovery. Orbita a ~535 km de altitude. Realizou 1,6+ milhÃµes de observaÃ§Ãµes atÃ© out 2025. Espelho primÃ¡rio de 2,4m observa UV, visÃ­vel e IV prÃ³ximo. Cinco missÃµes de serviÃ§o (1993-2009) melhoraram os instrumentos.',
        funFactHubble: 'Pode resolver objetos separados por 0,05 segundos de arco - como ver dois vaga-lumes a 10.000 km! A imagem mais profunda (eXtreme Deep Field) mostra 5.500 galÃ¡xias, algumas a 13,2 bilhÃµes de anos-luz.',
        descGPS: 'ConstelaÃ§Ã£o GPS (NAVSTAR): 31 satÃ©lites operacionais (out 2025) em 6 planos orbitais, inclinaÃ§Ã£o 55Â°. Cada satÃ©lite orbita a 20.180 km de altitude. Transmite sinais banda L (1,2-1,5 GHz). RelÃ³gios atÃ´micos de rubÃ­dio/cÃ©sio precisos a 10â»Â¹â´ segundos.',
        funFactGPS: 'Precisa de 4 satÃ©lites para posiÃ§Ã£o 3D (trilateraÃ§Ã£o + correÃ§Ã£o de relÃ³gio). O sistema fornece precisÃ£o de 5-10m. O sinal militar (cÃ³digo P/Y) Ã© preciso ao centÃ­metro!',
        descJWST: 'LanÃ§ado em 25 dez 2021. AlcanÃ§ou o ponto L2 em 24 jan 2022. Primeiras imagens publicadas em 12 jul 2022. Observa infravermelho (0,6-28,5 Î¼m). Espelho segmentado de berÃ­lio de 6,5m (18 hexÃ¡gonos) com 25 mÂ² de Ã¡rea coletora - 6x Hubble! Protetor solar: 21,2m Ã— 14,2m, 5 camadas.',
        funFactJWST: 'Opera a -233Â°C (-388Â°F)! Pode detectar a assinatura tÃ©rmica de um zangÃ£o Ã  distÃ¢ncia lunar. Descobriu as galÃ¡xias mais antigas em z=14 (280 milhÃµes de anos apÃ³s o Big Bang)!',
        
        // DescriÃ§Ãµes e fatos de naves espaciais
        descVoyager1: 'Voyager 1 Ã© o objeto feito pelo homem mais distante da Terra! LanÃ§ada em 5 set 1977, entrou no espaÃ§o interestelar em 25 ago 2012. Atualmente a 24,3 bilhÃµes de km (162 UA) do Sol. Carrega o Disco de Ouro com sons e imagens da Terra.',
        funFactVoyager1: 'Voyager 1 viaja a 17 km/s (61.200 km/h). Seus sinais de rÃ¡dio levam 22,5 horas para chegar Ã  Terra!',
        descVoyager2: 'Voyager 2 Ã© a Ãºnica nave espacial a visitar todos os quatro planetas gigantes! JÃºpiter (jul 1979), Saturno (ago 1981), Urano (jan 1986), Netuno (ago 1989). Entrou no espaÃ§o interestelar em 5 nov 2018. Agora a 20,3 bilhÃµes de km (135 UA) do Sol.',
        funFactVoyager2: 'Voyager 2 descobriu 16 luas entre os planetas gigantes, a Grande Mancha Escura de Netuno e os gÃªiseres de TritÃ£o!',
        descNewHorizons: 'New Horizons nos deu as primeiras imagens prÃ³ximas de PlutÃ£o em 14 julho 2015! Revelou montanhas de gelo de Ã¡gua de atÃ© 3.500m de altura, vastas geleiras de nitrogÃªnio e a famosa Tombaugh Regio em forma de coraÃ§Ã£o. Agora a 59 UA do Sol, explorando o cinturÃ£o de Kuiper.',
        funFactNewHorizons: 'New Horizons viajou 9,5 anos e 5 bilhÃµes de km para chegar a PlutÃ£o a 58.536 km/h. Carrega 28g das cinzas de Clyde Tombaugh!',
        descJuno: 'Juno entrou em Ã³rbita de JÃºpiter em 4 julho 2016. Estuda composiÃ§Ã£o, campo gravitacional, campo magnÃ©tico e auroras polares. Descobriu que o nÃºcleo de JÃºpiter Ã© maior e "difuso", ciclones polares maciÃ§os e distribuiÃ§Ã£o de amÃ´nia atmosfÃ©rica. MissÃ£o estendida atÃ© set 2025.',
        funFactJuno: 'Primeira nave espacial solar para JÃºpiter! TrÃªs painÃ©is solares de 9m geram 500W. Carrega trÃªs figuras LEGO: Galileu, JÃºpiter e Juno!',
        descCassini: 'Cassini orbitou Saturno de 30 junho 2004 a 15 set 2017 (13 anos). Descobriu lagos de metano/etano lÃ­quido em TitÃ£, gÃªiseres de Ã¡gua em EncÃ©lado, novos anÃ©is, 7 novas luas. A sonda Huygens pousou em TitÃ£ em 14 jan 2005. Terminou com entrada atmosfÃ©rica "Grand Finale".',
        funFactCassini: 'Descobriu o oceano subterrÃ¢neo de EncÃ©lado! Os gÃªiseres de Ã¡gua expelem 250kg/s para o espaÃ§o. Cassini voou atravÃ©s das plumas, detectou H2, compostos orgÃ¢nicos - ingredientes para a vida!',
        descPioneer10: 'Pioneer 10 foi a primeira nave espacial a cruzar o cinturÃ£o de asteroides e visitar JÃºpiter (3 dez 1973)! LanÃ§ada em 2 marÃ§o 1972, carregava a famosa placa Pioneer mostrando humanos e a localizaÃ§Ã£o da Terra. Ãšltimo contato: 23 jan 2003 a 12,2 bilhÃµes de km.',
        funFactPioneer10: 'Pioneer 10 carrega uma placa dourada projetada por Carl Sagan mostrando um homem, uma mulher e a localizaÃ§Ã£o da Terra - uma mensagem para alienÃ­genas que possam encontrÃ¡-la!',
        descPioneer11: 'Pioneer 11 foi a primeira nave espacial a visitar Saturno (1 set 1979)! TambÃ©m sobrevoou JÃºpiter (2 dez 1974). LanÃ§ada em 5 abril 1973, descobriu o anel F de Saturno e uma nova lua. TambÃ©m carrega a placa Pioneer. Ãšltimo contato: 24 nov 1995 a 6,5 bilhÃµes de km.',
        funFactPioneer11: 'Pioneer 11 usou a gravidade de JÃºpiter para a primeira assistÃªncia gravitacional planetÃ¡ria, economizando anos de viagem para Saturno!',
        
        // DescriÃ§Ãµes de cometas
        descHalley: 'O cometa Halley Ã© o mais famoso! Ele retorna Ã s proximidades da Terra a cada 75-76 anos. Visto pela Ãºltima vez em 1986, retornarÃ¡ em 2061. Quando vocÃª o vÃª, estÃ¡ observando uma bola de neve cÃ³smica de 4,6 bilhÃµes de anos!',
        descHaleBopp: 'Hale-Bopp foi um dos cometas mais brilhantes do sÃ©culo 20, visÃ­vel a olho nu por 18 meses em 1996-1997! Seu nÃºcleo Ã© excepcionalmente grande com 60 km de diÃ¢metro.',
        descNeowise: 'O cometa NEOWISE foi um espetÃ¡culo espetacular em julho de 2020! Ele nÃ£o voltarÃ¡ por cerca de 6.800 anos. Cometas sÃ£o "bolas de neve sujas" compostas de gelo, poeira e rocha da formaÃ§Ã£o do sistema solar.'
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
    
    const languageNames = { en: 'English', nl: 'Nederlands', fr: 'FranÃ§ais', de: 'Deutsch', es: 'EspaÃ±ol', pt: 'PortuguÃªs' };
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

// Note: Functions are available globally via window.t, window.applyTranslations, etc.
// ES6 imports in modules will use: import { t } from './i18n.js'
// The functions are also attached to window for backwards compatibility

