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
        descPluto: '🪐 Pluto is a dwarf planet in the Kuiper Belt. It has a heart-shaped glacier (Tombaugh Regio), mountains of water ice, and five moons. Pluto and its largest moon Charon are tidally locked - they always show the same face to each other!',
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
        descISS: 'ISS orbits at 400 km altitude, completing one orbit every 92.68 minutes (15.54 orbits/day). Launched Nov 20, 1998 (Zarya module). Assembly: 1998-2011 (42 flights: 36 Shuttle, 6 Russian). Mass: 419,725 kg. Pressurized volume: 1,000 mó. Continuous occupation since Nov 2, 2000 (24+ years, 9,000+ days). 280+ astronauts from 23 countries visited.',
        funFactISS: 'The ISS travels at 27,600 km/h! Astronauts see 16 sunrises/sunsets per day. It\'s been continuously occupied for 24+ years - longer than any other spacecraft!',
        descHubble: 'Launched April 24, 1990 on Space Shuttle Discovery. Orbits at ~535 km altitude. Made 1.6+ million observations as of Oct 2025. 2.4m primary mirror observes UV, visible, and near-IR. Five servicing missions (1993-2009) upgraded instruments.',
        funFactHubble: 'Can resolve objects 0.05 arcseconds apart - like seeing two fireflies 10,000 km away! Deepest image (eXtreme Deep Field) shows 5,500 galaxies, some 13.2 billion light-years away.',
        descGPS: 'GPS (NAVSTAR) constellation: 31 operational satellites (as of Oct 2025) in 6 orbital planes, 55° inclination. Each satellite orbits at 20,180 km altitude. Transmits L-band signals (1.2-1.5 GHz). Rubidium/cesium atomic clocks accurate to 10â»×¹â´ seconds.',
        funFactGPS: 'Need 4 satellites for 3D position fix (trilateration + clock correction). System provides 5-10m accuracy. Military signal (P/Y code) accurate to centimeters!',
        descJWST: 'Launched Dec 25, 2021. Reached L2 point Jan 24, 2022. First images released July 12, 2022. Observes infrared (0.6-28.5 μm). 6.5m segmented beryllium mirror (18 hexagons) with 25 m² collecting area - 6x Hubble! Sunshield: 21.2m ×— 14.2m, 5 layers.',
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
        navAsteroidBelt: "Astero×¯dengordel",
        navOuterPlanets: "Buitenste Planeten (Gasreuzen)",
        navIceGiants: "IJsreuzen",
        navKuiperBelt: "Kuipergordel & Dwergplaneten",
        navComets: "Kometen",
        navSatellites: "Satellieten & Ruimtestations",
        navSpacecraft: "Ruimtevaartuigen & Sondes",
        navDistantStars: "Verre Sterren",
        kuiperBelt: "Kuipergordel",
        asteroidBelt: "Astero×¯dengordel",
        
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
        creatingAsteroidBelt: 'Astero×¯dengordel maken...',
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
        funFactJupiter: 'De zwaartekracht van Jupiter beschermt de Aarde tegen veel astero×¯den en kometen!',
        funFactSaturn: 'De ringen van Saturnus zijn slechts 10 meter dik maar 280.000 km breed!',
        funFactUranus: 'Uranus was de eerste planeet die ontdekt werd met een telescoop (in 1781)!',
        funFactNeptune: 'Neptunus werd ontdekt door wiskundige berekeningen voordat hij gezien werd - zijn zwaartekracht be×¯nvloedde de baan van Uranus!',
        descPluto: '🪐 Pluto is een dwergplaneet in de Kuipergordel. Het heeft een hartvormige gletsjer (Tombaugh Regio), bergen van waterijs en vijf manen. Pluto en zijn grootste maan Charon zijn getijdengekoppeld - ze laten elkaar altijd hetzelfde gezicht zien!',
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
        descISS: 'ISS draait op 400 km hoogte en voltooit elke 92,68 minuten een baan (15,54 banen/dag). Gelanceerd 20 nov 1998 (Zarya-module). Assemblage: 1998-2011 (42 vluchten: 36 Shuttle, 6 Russisch). Massa: 419.725 kg. Volume onder druk: 1.000 mó. Continu bewoond sinds 2 nov 2000 (24+ jaar, 9.000+ dagen). 280+ astronauten uit 23 landen bezocht.',
        funFactISS: 'Het ISS reist met 27.600 km/u! Astronauten zien 16 zonsopgangen/ondergangen per dag. Het is al 24+ jaar continu bewoond - langer dan elk ander ruimtevaartuig!',
        descHubble: 'Gelanceerd 24 april 1990 met Space Shuttle Discovery. Draait op ~535 km hoogte. Heeft tot oktober 2025 1,6+ miljoen waarnemingen gedaan. 2,4m primaire spiegel observeert UV, zichtbaar licht en nabij-IR. Vijf onderhoudsmiâ€‹ssies (1993-2009) upgradeden de instrumenten.',
        funFactHubble: 'Kan objecten van 0,05 boogseconden onderscheiden - alsof je twee vuurvliegjes op 10.000 km afstand ziet! Diepste beeld (eXtreme Deep Field) toont 5.500 sterrenstelsels, sommige 13,2 miljard lichtjaar ver.',
        descGPS: 'GPS (NAVSTAR) constellatie: 31 operationele satellieten (per oktober 2025) in 6 baanvlakken, 55° inclinatie. Elke satelliet draait op 20.180 km hoogte. Zendt L-band signalen uit (1,2-1,5 GHz). Rubidium/cesium atoomklokken nauwkeurig tot 10â»×¹â´ seconden.',
        funFactGPS: 'Je hebt 4 satellieten nodig voor een 3D-positiebepaling (trilateratie + klok correctie). Het systeem geeft 5-10m nauwkeurigheid. Militair signaal (P/Y code) nauwkeurig tot centimeters!',
        descJWST: 'Gelanceerd 25 dec 2021. Bereikte L2-punt 24 jan 2022. Eerste beelden vrijgegeven 12 juli 2022. Observeert infrarood (0,6-28,5 μm). 6,5m gesegmenteerde berylliumspiegel (18 zeshoeken) met 25 m² oppervlak - 6x Hubble! Zonneschild: 21,2m ×— 14,2m, 5 lagen.',
        funFactJWST: 'Werkt bij -233°C (-388°F)! Kan de warmte van een hommel op maanafstand detecteren. Ontdekte de vroegste sterrenstelsels bij z=14 (280 miljoen jaar na de Oerknal).',
        
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
        funFactCassini: 'Ontdekte Enceladus\' ondergrondse oceaan! Watergeisers spuiten 250kg/s de ruimte in. Cassini vloog door pluimen, detecteerde H2, organische stoffen - ingrediënten voor leven!',
        descPioneer10: 'Pioneer 10 was het eerste ruimtevaartuig dat door de astero×¯dengordel reisde en als eerste Jupiter bezocht (3 dec 1973)! Gelanceerd 2 maart 1972, droeg het de beroemde Pioneer-plaquette met mensen en de locatie van de Aarde. Laatste contact: 23 jan 2003 op 12,2 miljard km.',
        funFactPioneer10: 'Pioneer 10 draagt een gouden plaquette ontworpen door Carl Sagan met een man, vrouw en de locatie van de Aarde - een boodschap voor aliens die het zouden vinden!',
        descPioneer11: 'Pioneer 11 was het eerste ruimtevaartuig dat Saturnus bezocht (1 sept 1979)! Vloog ook langs Jupiter (2 dec 1974). Gelanceerd 5 april 1973, ontdekte het Saturnus\' F-ring en een nieuwe maan. Draagt ook de Pioneer-plaquette. Laatste contact: 24 nov 1995 op 6,5 miljard km.',
        funFactPioneer11: 'Pioneer 11 gebruikte Jupiter\'s zwaartekracht voor de eerste planetaire zwaartekrachtondersteuning, besparend jaren reistijd naar Saturnus!',
        
        // Komeetbeschrijvingen
        descHalley: 'De Halley-komeet is de beroemdste komeet! Hij keert elke 75-76 jaar terug naar de Aarde. Laatst gezien in 1986, keert hij terug in 2061. Als je hem ziet, bekijk je een 4,6 miljard jaar oude kosmische sneeuwbal!',
        descHaleBopp: 'Hale-Bopp was een van de helderste kometen van de 20e eeuw, 18 maanden met het blote oog zichtbaar in 1996-1997! Zijn kern is ongewoon groot met 60 km diameter.',
        descNeowise: 'Komeet NEOWISE was een spectaculair gezicht in juli 2020! Hij keert pas over ongeveer 6.800 jaar terug. Kometen zijn "vuile sneeuwballen" van ijs, stof en rots uit de vorming van het zonnestelsel.'
    },
    
    fr: {
        // Titre et en-tête de l'application
        appTitle: "Voyage Spatial",
        subtitle: "Système Solaire 3D Interactif",
        
        // Navigation
        quickNavigation: "Navigation Rapide",
        
        // Catégories d'objets
        ourStar: "Notre ×‰toile",
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
        pluto: "Pluton",
        charon: "Charon",
        enceladus: "Encelade",
        rhea: "Rhéa",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Triton",
        
        // Sections du menu de navigation
        navOurStar: "Notre ×‰toile",
        navInnerPlanets: "Planètes Intérieures (Rocheuses)",
        navAsteroidBelt: "Ceinture d'Astéro×¯des",
        navOuterPlanets: "Planètes Extérieures (Géantes Gazeuses)",
        navIceGiants: "Géantes de Glace",
        navKuiperBelt: "Ceinture de Kuiper & Planètes Naines",
        navComets: "Comètes",
        navSatellites: "Satellites & Stations Spatiales",
        navSpacecraft: "Vaisseaux Spatiaux & Sondes",
        navDistantStars: "×‰toiles Lointaines",
        kuiperBelt: "Ceinture de Kuiper",
        asteroidBelt: "Ceinture d'Astéro×¯des",
        
        // Boutons de contrÃ´le
        toggleOrbits: "Orbites",
        toggleConstellations: "Constellations",
        toggleScale: "×‰chelle ×‰ducative",
        toggleScaleRealistic: "×‰chelle Réaliste",
        toggleLabels: "×‰tiquettes D×‰SACTIV×‰ES",
        toggleLabelsOn: "×‰tiquettes ACTIV×‰ES",
        resetView: "Réinitialiser",
        enterVR: "Entrer en RV",
        enterAR: "Entrer en RA",
        
        // ContrÃ´le de vitesse
        speedLabel: "Vitesse:",
        paused: "En pause",
        realTime: "1x Temps réel",
        
        // Panneau d'informations
        name: "Nom",
        type: "Type",
        distance: "Distance",
        size: "Taille",
        description: "Description",
        
        // ×‰cran de chargement
        loading: "Chargement...",
        initializing: "Initialisation...",
        settingUpScene: "Configuration de la scène...",
        initializingControls: "Initialisation des contrÃ´les...",
        loadingSolarSystem: "Chargement du système solaire...",
        creatingSun: "Création du Soleil...",
        selectObject: "Sélectionner un Objet",
        clickToExplore: "Cliquez sur les objets pour explorer et en savoir plus",
        
        // Aide
        help: "Aide",
        helpTitle: "Voyage Spatial - ContrÃ´les et Fonctionnalités",
        controls: "ContrÃ´les",
        mouseControls: "ContrÃ´les Souris:",
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
        typeStar: '×‰toile',
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
        descMars: 'Mars, la Planète Rouge, doit sa couleur à l\'oxyde de fer (rouille). Elle possède le plus grand volcan (Olympus Mons - 22 km de haut) et le plus long canyon (Valles Marineris - 4 000 km de long) du système solaire. De la glace d\'eau existe à ses pÃ´les!',
        descJupiter: 'Jupiter est la plus grande planète - toutes les autres planètes pourraient tenir à l\'intérieur! La Grande Tache Rouge est une tempête plus grande que la Terre qui fait rage depuis au moins 400 ans. Jupiter a 95 lunes connues!',
        descSaturn: 'Saturne est célèbre pour son spectaculaire système d\'anneaux composés de particules de glace et de roche. C\'est la planète la moins dense - elle flotterait dans l\'eau! Saturne a 146 lunes connues dont Titan qui possède une atmosphère épaisse.',
        descUranus: 'Uranus est unique - elle tourne sur le cÃ´té! Cela signifie que ses pÃ´les font face au Soleil à tour de rÃ´le pendant son orbite de 84 ans. Composée de glaces d\'eau, de méthane et d\'ammoniac, elle appara×®t bleu-vert en raison du méthane dans son atmosphère.',
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
        creatingAsteroidBelt: 'Création de la ceinture d\'astéro×¯des...',
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
        funFactMars: 'Mars a des saisons comme la Terre, et son jour ne dure que 37 minutes de plus que le nÃ´tre!',
        funFactJupiter: 'La gravité de Jupiter protège la Terre de nombreux astéro×¯des et comètes!',
        funFactSaturn: 'Les anneaux de Saturne ne font que 10 mètres d\'épaisseur mais 280 000 km de large!',
        funFactUranus: 'Uranus a été la première planète découverte avec un télescope (1781)!',
        funFactNeptune: 'Neptune a été découverte par les mathématiques avant d\'être vue - sa gravité affectait l\'orbite d\'Uranus!',
        descPluto: '🪐 Pluton est une planète naine dans la ceinture de Kuiper. Elle a un glacier en forme de cÅ"ur (Tombaugh Regio), des montagnes de glace d\'eau et cinq lunes. Pluton et sa plus grande lune Charon sont verrouillés par marée - ils montrent toujours la même face l\'un à  l\'autre!',
        funFactPluto: 'Une année sur Pluton dure 248 années terrestres! Elle n\'a pas complété une orbite depuis sa découverte en 1930.',
        
        // Descriptions des lunes
        descPhobos: 'Phobos orbite Mars plus vite que Mars ne tourne! Il se lève à l\'ouest et se couche à l\'est.',
        descDeimos: 'Deimos est la plus petite des deux lunes de Mars et met 30 heures pour orbiter.',
        descIo: 'Io est le corps le plus volcaniquement actif du système solaire!',
        descEuropa: 'Europe possède un océan global sous sa glace - un endroit potentiel pour la vie!',
        descGanymede: 'Ganymède est la plus grande lune du système solaire, plus grande que Mercure!',
        descCallisto: 'Callisto est l\'objet le plus criblé de cratères du système solaire!',
        descTitan: 'Titan possède des lacs et rivières de méthane liquide - le seul endroit avec du liquide en surface hormis la Terre!',
        descEnceladus: 'Encelade projette des geysers d\'eau dans l\'espace depuis son océan souterrain!',
        descRhea: 'Rhéa pourrait avoir son propre système d\'anneaux!',
        descTitania: 'Titania est la plus grande lune d\'Uranus avec des canyons massifs!',
        descMiranda: 'Miranda possède le terrain le plus dramatique du système solaire avec des falaises de 20 km de haut!',
        descTriton: 'Triton orbite à l\'envers et possède des geysers d\'azote! C\'est probablement un objet capturé de la ceinture de Kuiper.',
        descCharon: 'Charon est si grand par rapport à Pluton qu\'ils forment un système binaire!',
        
        // Descriptions et faits des satellites
        descISS: 'L\'ISS orbite à 400 km d\'altitude, complétant une orbite toutes les 92,68 minutes (15,54 orbites/jour). Lancée le 20 nov 1998 (module Zarya). Assemblage: 1998-2011 (42 vols: 36 Navette, 6 Russes). Masse: 419 725 kg. Volume pressurisé: 1 000 mó. Occupation continue depuis le 2 nov 2000 (24+ ans, 9 000+ jours). 280+ astronautes de 23 pays ont visité.',
        funFactISS: 'L\'ISS voyage à 27 600 km/h! Les astronautes voient 16 levers/couchers de soleil par jour. Elle est continuellement occupée depuis 24+ ans - plus longtemps que tout autre vaisseau spatial!',
        descHubble: 'Lancé le 24 avril 1990 par la navette Discovery. Orbite à ~535 km d\'altitude. A effectué 1,6+ million d\'observations en oct 2025. Miroir primaire de 2,4m observe UV, visible et proche IR. Cinq missions de maintenance (1993-2009) ont amélioré les instruments.',
        funFactHubble: 'Peut résoudre des objets séparés de 0,05 secondes d\'arc - comme voir deux lucioles à 10 000 km! L\'image la plus profonde (eXtreme Deep Field) montre 5 500 galaxies, certaines à 13,2 milliards d\'années-lumière.',
        descGPS: 'Constellation GPS (NAVSTAR): 31 satellites opérationnels (oct 2025) sur 6 plans orbitaux, inclinaison 55°. Chaque satellite orbite à 20 180 km d\'altitude. ×‰met des signaux bande L (1,2-1,5 GHz). Horloges atomiques rubidium/césium précises à 10â»×¹â´ secondes.',
        funFactGPS: 'Besoin de 4 satellites pour une position 3D (trilatération + correction d\'horloge). Le système fournit une précision de 5-10m. Le signal militaire (code P/Y) est précis au centimètre!',
        descJWST: 'Lancé le 25 déc 2021. Atteint le point L2 le 24 jan 2022. Premières images publiées le 12 juil 2022. Observe l\'infrarouge (0,6-28,5 μm). Miroir segmenté en béryllium de 6,5m (18 hexagones) avec 25 m² de surface collectrice - 6x Hubble! Bouclier solaire: 21,2m ×— 14,2m, 5 couches.',
        funFactJWST: 'Fonctionne à -233°C (-388°F)! Peut détecter la signature thermique d\'un bourdon à distance lunaire. A découvert les galaxies les plus anciennes à z=14 (280 millions d\'années après le Big Bang).',
        
        // Descriptions et faits des vaisseaux spatiaux
        descVoyager1: 'Voyager 1 est l\'objet fait par l\'homme le plus éloigné de la Terre! Lancée le 5 sept 1977, elle est entrée dans l\'espace interstellaire le 25 ao×»t 2012. Actuellement à 24,3 milliards de km (162 UA) du Soleil. Elle transporte le Disque d\'Or avec des sons et images de la Terre.',
        funFactVoyager1: 'Voyager 1 voyage à 17 km/s (61 200 km/h). Ses signaux radio mettent 22,5 heures pour atteindre la Terre!',
        descVoyager2: 'Voyager 2 est le seul vaisseau spatial à avoir visité les quatre planètes géantes! Jupiter (juil 1979), Saturne (ao×»t 1981), Uranus (jan 1986), Neptune (ao×»t 1989). Entrée dans l\'espace interstellaire le 5 nov 2018. Maintenant à 20,3 milliards de km (135 UA) du Soleil.',
        funFactVoyager2: 'Voyager 2 a découvert 16 lunes parmi les planètes géantes, la Grande Tache Sombre de Neptune et les geysers de Triton!',
        descNewHorizons: 'New Horizons nous a donné les premières images rapprochées de Pluton le 14 juillet 2015! Il a révélé des montagnes de glace d\'eau jusqu\'à 3 500m de haut, de vastes glaciers d\'azote et la célèbre Tombaugh Regio en forme de cÅ“ur. Maintenant à 59 UA du Soleil, explorant la ceinture de Kuiper.',
        funFactNewHorizons: 'New Horizons a voyagé 9,5 ans et 5 milliards de km pour atteindre Pluton à 58 536 km/h. Il transporte 28g des cendres de Clyde Tombaugh!',
        descJuno: 'Juno est entrée en orbite autour de Jupiter le 4 juillet 2016. ×‰tudie la composition, le champ gravitationnel, le champ magnétique et les aurores polaires. A découvert que le noyau de Jupiter est plus grand et "flou", des cyclones polaires massifs et la distribution d\'ammoniac atmosphérique. Mission prolongée jusqu\'en sept 2025.',
        funFactJuno: 'Premier vaisseau spatial à énergie solaire vers Jupiter! Trois panneaux solaires de 9m génèrent 500W. Transporte trois figurines LEGO: Galilée, Jupiter et Junon!',
        descCassini: 'Cassini a orbité Saturne du 30 juin 2004 au 15 sept 2017 (13 ans). A découvert des lacs de méthane/éthane liquide sur Titan, des geysers d\'eau sur Encelade, de nouveaux anneaux, 7 nouvelles lunes. La sonde Huygens a atterri sur Titan le 14 jan 2005. S\'est terminée par une entrée atmosphérique "Grand Finale".',
        funFactCassini: 'A découvert l\'océan souterrain d\'Encelade! Les geysers d\'eau projettent 250kg/s dans l\'espace. Cassini a traversé les panaches, détecté H2, composés organiques - ingrédients de la vie!',
        descPioneer10: 'Pioneer 10 fut le premier vaisseau spatial à traverser la ceinture d\'astéro×¯des et à visiter Jupiter (3 déc 1973)! Lancée le 2 mars 1972, elle portait la célèbre plaque Pioneer montrant les humains et la localisation de la Terre. Dernier contact: 23 jan 2003 à 12,2 milliards de km.',
        funFactPioneer10: 'Pioneer 10 porte une plaque dorée con×§ue par Carl Sagan montrant un homme, une femme et la localisation de la Terre - un message pour les extraterrestres qui pourraient la trouver!',
        descPioneer11: 'Pioneer 11 fut le premier vaisseau spatial à visiter Saturne (1er sept 1979)! A aussi survolé Jupiter (2 déc 1974). Lancée le 5 avril 1973, elle a découvert l\'anneau F de Saturne et une nouvelle lune. Porte aussi la plaque Pioneer. Dernier contact: 24 nov 1995 à 6,5 milliards de km.',
        funFactPioneer11: 'Pioneer 11 a utilisé la gravité de Jupiter pour la première assistance gravitationnelle planétaire, économisant des années de voyage vers Saturne!',
        
        // Descriptions des comètes
        descHalley: 'La comète de Halley est la plus célèbre! Elle revient près de la Terre tous les 75-76 ans. Vue pour la dernière fois en 1986, elle reviendra en 2061. Quand vous la voyez, vous observez une boule de neige cosmique vieille de 4,6 milliards d\'années!',
        descHaleBopp: 'Hale-Bopp fut l\'une des comètes les plus brillantes du 20e siècle, visible à l\'Å“il nu pendant 18 mois en 1996-1997! Son noyau est exceptionnellement grand avec 60 km de diamètre.',
        descNeowise: 'La comète NEOWISE fut un spectacle spectaculaire en juillet 2020! Elle ne reviendra pas avant environ 6 800 ans. Les comètes sont des "boules de neige sales" composées de glace, poussière et roche de la formation du système solaire.'
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
        
        // Navigationsmen×¼-Abschnitte
        navOurStar: "Unser Stern",
        navInnerPlanets: "Innere Planeten (Gesteinsplaneten)",
        navAsteroidBelt: "Asteroideng×¼rtel",
        navOuterPlanets: "×„u×Ÿere Planeten (Gasriesen)",
        navIceGiants: "Eisriesen",
        navKuiperBelt: "Kuiperg×¼rtel & Zwergplaneten",
        navComets: "Kometen",
        navSatellites: "Satelliten & Raumstationen",
        navSpacecraft: "Raumfahrzeuge & Sonden",
        navDistantStars: "Ferne Sterne",
        kuiperBelt: "Kuiperg×¼rtel",
        asteroidBelt: "Asteroideng×¼rtel",
        
        // Steuerungstasten
        toggleOrbits: "Umlaufbahnen",
        toggleConstellations: "Sternbilder",
        toggleScale: "P×¤dagogischer Ma×Ÿstab",
        toggleScaleRealistic: "Realistischer Ma×Ÿstab",
        toggleLabels: "Beschriftungen AUS",
        toggleLabelsOn: "Beschriftungen EIN",
        resetView: "Zur×¼cksetzen",
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
        size: "Gr×¶×Ÿe",
        description: "Beschreibung",
        
        // Ladebildschirm
        loading: "L×¤dt...",
        initializing: "Initialisierung...",
        settingUpScene: "Szene wird eingerichtet...",
        initializingControls: "Steuerung wird initialisiert...",
        loadingSolarSystem: "Sonnensystem wird geladen...",
        creatingSun: "Sonne wird erstellt...",
        selectObject: "Objekt Ausw×¤hlen",
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
        keyboardShortcuts: "Tastaturk×¼rzel:",
        spaceKey: "Leertaste: Pause/Fortsetzen",
        plusMinus: "+/-: Geschwindigkeit ×¤ndern",
        rKey: "R: Ansicht zur×¼cksetzen",
        hKey: "H: Hilfe umschalten",
        lKey: "L: Laserpointer umschalten (VR)",
        features: "Funktionen",
        vrSupport: "VR/AR-Unterst×¼tzung mit WebXR",
        realisticOrbits: "Realistische Orbitalmechanik",
        educationalMode: "P×¤dagogische und realistische Ma×Ÿstabsmodi",
        constellations: "Wichtige Sternbilder sichtbar",
        spacecraft: "Historische Raumfahrzeuge und Satelliten",
        
        // Benachrichtigungen
        updateAvailable: "Update Verf×¼gbar",
        updateMessage: "Eine neue Version ist verf×¼gbar!",
        updateButton: "Jetzt Aktualisieren",
        updateLater: "Sp×¤ter",
        offline: "Offline-Modus",
        offlineMessage: "Sie sind offline. Einige Funktionen k×¶nnen eingeschr×¤nkt sein.",
        installTitle: "Weltraumreise Installieren",
        installMessage: "Installieren Sie Weltraumreise als App f×¼r ein besseres Erlebnis!",
        installButton: "Installieren",
        installLater: "Vielleicht Sp×¤ter",
        errorLoading: "Fehler beim Laden der Weltraumreise",
        errorMessage: "Bitte aktualisieren Sie die Seite, um es erneut zu versuchen.",
        
        // Fu×Ÿzeile
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
        descSun: 'Die Sonne ist ein Hauptreihenstern vom Typ G (Gelber Zwerg), der 99,86% der Masse des Sonnensystems enth×¤lt. Oberfl×¤chentemperatur: 5.778 K. Alter: 4,6 Milliarden Jahre. Sie verschmilzt jede Sekunde 600 Millionen Tonnen Wasserstoff zu Helium!',
        descMercury: 'Merkur ist der kleinste Planet und der sonnenn×¤chste. Seine Oberfl×¤che ist wie unser Mond mit Kratern bedeckt. Die Temperatur reicht von -180°C nachts bis 430°C tags×¼ber - die gr×¶×Ÿte Temperaturspanne im Sonnensystem!',
        descVenus: 'Venus ist mit 465°C der hei×Ÿeste Planet aufgrund eines extremen Treibhauseffekts. Ihre Atmosph×¤re besteht zu 96% aus CO2 mit Wolken aus Schwefels×¤ure. Venus rotiert r×¼ckw×¤rts im Vergleich zu den meisten Planeten!',
        descEarth: 'Die Erde ist unser Zuhause, der einzige bekannte Planet mit Leben! 71% sind mit Wasser bedeckt, was die blaue Farbe aus dem Weltraum erzeugt. Die Atmosph×¤re sch×¼tzt uns vor sch×¤dlicher Strahlung und Meteoriten.',
        descMoon: 'Der Erdmond ist der f×¼nftgr×¶×Ÿte Mond im Sonnensystem. Er erzeugt Gezeiten, stabilisiert die Neigung der Erde und entstand vor 4,5 Milliarden Jahren, als ein marsgro×Ÿes Objekt die Erde traf!',
        descMars: 'Mars, der Rote Planet, verdankt seine Farbe Eisenoxid (Rost). Er hat den gr×¶×Ÿten Vulkan (Olympus Mons - 22 km hoch) und die l×¤ngste Schlucht (Valles Marineris - 4.000 km lang) im Sonnensystem. An seinen Polen existiert Wassereis!',
        descJupiter: 'Jupiter ist der gr×¶×Ÿte Planet - alle anderen Planeten w×¼rden hineinpassen! Der Gro×Ÿe Rote Fleck ist ein Sturm gr×¶×Ÿer als die Erde, der seit mindestens 400 Jahren tobt. Jupiter hat 95 bekannte Monde!',
        descSaturn: 'Saturn ist ber×¼hmt f×¼r sein spektakul×¤res Ringsystem aus Eis- und Gesteinpartikeln. Er ist der am wenigsten dichte Planet - er w×¼rde in Wasser schwimmen! Saturn hat 146 bekannte Monde, darunter Titan mit seiner dichten Atmosph×¤re.',
        descUranus: 'Uranus ist einzigartig - er rotiert auf der Seite! Das bedeutet, dass seine Pole w×¤hrend seiner 84-j×¤hrigen Umlaufbahn abwechselnd zur Sonne zeigen. Er besteht aus Wasser-, Methan- und Ammoniakeis und erscheint blaugr×¼n durch Methan in seiner Atmosph×¤re.',
        descNeptune: 'Neptun ist der windigste Planet mit St×¼rmen von bis zu 2.100 km/h! Er ist der am weitesten von der Sonne entfernte Planet und braucht 165 Erdjahre f×¼r eine Umlaufbahn. Seine blaue Farbe stammt von Methan in der Atmosph×¤re.',
        
        // Lademeldungen
        creatingMercury: 'Merkur wird erstellt...',
        creatingVenus: 'Venus wird erstellt...',
        creatingEarth: 'Erde wird erstellt...',
        creatingMars: 'Mars wird erstellt...',
        creatingJupiter: 'Jupiter wird erstellt...',
        creatingSaturn: 'Saturn wird erstellt...',
        creatingUranus: 'Uranus wird erstellt...',
        creatingNeptune: 'Neptun wird erstellt...',
        creatingAsteroidBelt: 'Asteroideng×¼rtel wird erstellt...',
        creatingKuiperBelt: 'Kuiperg×¼rtel wird erstellt...',
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
        noDescription: 'Keine Beschreibung verf×¼gbar',
        moonCount: 'Dieser Planet hat',
        majorMoon: 'gro×Ÿer Mond',
        majorMoons: 'gro×Ÿe Monde',
        shownHere: 'hier gezeigt (viele weitere kleine existieren!)',
        
        // Lustige Fakten
        funFactSun: 'Die Sonne ist so gro×Ÿ, dass 1,3 Millionen Erden hineinpassen w×¼rden!',
        funFactMercury: 'Ein Jahr auf Merkur (88 Erdtage) ist k×¼rzer als sein Tag (176 Erdtage)!',
        funFactVenus: 'Venus ist der hellste Planet an unserem Himmel und wird oft als "b×¶ser Zwilling" der Erde bezeichnet',
        funFactEarth: 'Die Erde ist der einzige Planet, der nicht nach einem Gott benannt ist. Sie reist mit 107.000 km/h um die Sonne!',
        funFactMoon: 'Der Mond entfernt sich langsam von der Erde mit 3,8 cm pro Jahr!',
        funFactMars: 'Mars hat wie die Erde Jahreszeiten, und sein Tag ist nur 37 Minuten l×¤nger als unserer!',
        funFactJupiter: 'Jupiters Schwerkraft sch×¼tzt die Erde vor vielen Asteroiden und Kometen!',
        funFactSaturn: 'Saturns Ringe sind nur 10 Meter dick, aber 280.000 km breit!',
        funFactUranus: 'Uranus war der erste Planet, der mit einem Teleskop entdeckt wurde (1781)!',
        funFactNeptune: 'Neptun wurde durch Mathematik entdeckt, bevor er gesehen wurde - seine Schwerkraft beeinflusste die Umlaufbahn von Uranus!',
        descPluto: '🪐 Pluto ist ein Zwergplanet im Kuipergürtel. Er hat einen herzförmigen Gletscher (Tombaugh Regio), Berge aus Wassereis und fünf Monde. Pluto und sein größter Mond Charon sind gezeitengebunden - sie zeigen einander immer die gleiche Seite!',
        funFactPluto: 'Ein Jahr auf Pluto dauert 248 Erdjahre! Er hat seit seiner Entdeckung 1930 noch keine Umlaufbahn vollendet.',
        
        // Mondbeschreibungen
        descPhobos: 'Phobos umkreist den Mars schneller als der Mars rotiert! Er geht im Westen auf und im Osten unter.',
        descDeimos: 'Deimos ist der kleinere der beiden Marsmonde und braucht 30 Stunden f×¼r eine Umkreisung.',
        descIo: 'Io ist der vulkanisch aktivste K×¶rper im Sonnensystem!',
        descEuropa: 'Europa hat einen globalen Ozean unter seinem Eis - ein potenzieller Ort f×¼r Leben!',
        descGanymede: 'Ganymed ist der gr×¶×Ÿte Mond im Sonnensystem, gr×¶×Ÿer als Merkur!',
        descCallisto: 'Callisto ist das am st×¤rksten verkraterte Objekt im Sonnensystem!',
        descTitan: 'Titan hat Seen und Fl×¼sse aus fl×¼ssigem Methan - der einzige Ort mit Oberfl×¤chenfl×¼ssigkeiten au×Ÿer der Erde!',
        descEnceladus: 'Enceladus spritzt Wasserfont×¤nen aus seinem unterirdischen Ozean ins All!',
        descRhea: 'Rhea k×¶nnte ein eigenes Ringsystem haben!',
        descTitania: 'Titania ist der gr×¶×Ÿte Mond von Uranus mit massiven Schluchten!',
        descMiranda: 'Miranda hat das dramatischste Gel×¤nde im Sonnensystem mit 20 km hohen Klippen!',
        descTriton: 'Triton umkreist r×¼ckw×¤rts und hat Stickstoffgeysire! Wahrscheinlich ein eingefangenes Objekt aus dem Kuiperg×¼rtel.',
        descCharon: 'Charon ist im Vergleich zu Pluto so gro×Ÿ, dass sie ein Doppelsystem bilden!',
        
        // Satellitenbeschreibungen und Fakten
        descISS: 'Die ISS umkreist in 400 km H×¶he und vollendet alle 92,68 Minuten eine Umlaufbahn (15,54 Uml×¤ufe/Tag). Gestartet am 20. Nov 1998 (Zarya-Modul). Montage: 1998-2011 (42 Fl×¼ge: 36 Shuttle, 6 russisch). Masse: 419.725 kg. Druckvolumen: 1.000 mó. Dauerhaft bewohnt seit 2. Nov 2000 (24+ Jahre, 9.000+ Tage). 280+ Astronauten aus 23 L×¤ndern haben sie besucht.',
        funFactISS: 'Die ISS reist mit 27.600 km/h! Astronauten sehen 16 Sonnenauf-/unterg×¤nge pro Tag. Sie ist seit 24+ Jahren dauerhaft bewohnt - l×¤nger als jedes andere Raumfahrzeug!',
        descHubble: 'Gestartet am 24. April 1990 mit der Discovery-F×¤hre. Umkreist in ~535 km H×¶he. Hat bis Okt 2025 1,6+ Millionen Beobachtungen durchgef×¼hrt. 2,4m Prim×¤rspiegel beobachtet UV, sichtbar und nahes IR. F×¼nf Wartungsmissionen (1993-2009) verbesserten die Instrumente.',
        funFactHubble: 'Kann Objekte aufl×¶sen, die 0,05 Bogensekunden getrennt sind - wie das Sehen zweier Gl×¼hw×¼rmchen in 10.000 km Entfernung! Das tiefste Bild (eXtreme Deep Field) zeigt 5.500 Galaxien, einige 13,2 Milliarden Lichtjahre entfernt.',
        descGPS: 'GPS-Konstellation (NAVSTAR): 31 operative Satelliten (Okt 2025) in 6 Bahnebenen, 55° Neigung. Jeder Satellit umkreist in 20.180 km H×¶he. Sendet L-Band-Signale (1,2-1,5 GHz). Rubidium/C×¤sium-Atomuhren genau auf 10â»×¹â´ Sekunden.',
        funFactGPS: 'Ben×¶tigt 4 Satelliten f×¼r 3D-Position (Trilateration + Uhrenkorrektur). Das System bietet 5-10m Genauigkeit. Das milit×¤rische Signal (P/Y-Code) ist zentimetergenau!',
        descJWST: 'Gestartet am 25. Dez 2021. Erreichte L2-Punkt am 24. Jan 2022. Erste Bilder ver×¶ffentlicht am 12. Jul 2022. Beobachtet Infrarot (0,6-28,5 μm). 6,5m segmentierter Beryllium-Spiegel (18 Sechsecke) mit 25 m² Sammelfl×¤che - 6x Hubble! Sonnenschild: 21,2m ×— 14,2m, 5 Schichten.',
        funFactJWST: 'Arbeitet bei -233°C (-388°F)! Kann die thermische Signatur einer Hummel in Mondentfernung erkennen. Hat die ×¤ltesten Galaxien bei z=14 entdeckt (280 Millionen Jahre nach dem Urknall).',
        
        // Raumfahrzeugbeschreibungen und Fakten
        descVoyager1: 'Voyager 1 ist das am weitesten von der Erde entfernte menschengemachte Objekt! Gestartet am 5. Sept 1977, trat am 25. Aug 2012 in den interstellaren Raum ein. Derzeit 24,3 Milliarden km (162 AE) von der Sonne entfernt. Tr×¤gt die Goldene Schallplatte mit Kl×¤ngen und Bildern der Erde.',
        funFactVoyager1: 'Voyager 1 reist mit 17 km/s (61.200 km/h). Seine Funksignale brauchen 22,5 Stunden zur Erde!',
        descVoyager2: 'Voyager 2 ist das einzige Raumfahrzeug, das alle vier Riesenplaneten besucht hat! Jupiter (Jul 1979), Saturn (Aug 1981), Uranus (Jan 1986), Neptun (Aug 1989). Trat am 5. Nov 2018 in den interstellaren Raum ein. Jetzt 20,3 Milliarden km (135 AE) von der Sonne entfernt.',
        funFactVoyager2: 'Voyager 2 entdeckte 16 Monde bei den Riesenplaneten, den Gro×Ÿen Dunklen Fleck des Neptun und die Geysire von Triton!',
        descNewHorizons: 'New Horizons gab uns am 14. Juli 2015 die ersten Nahaufnahmen von Pluto! Enth×¼llte Wassereis-Berge bis 3.500m H×¶he, riesige Stickstoffgletscher und die ber×¼hmte herzf×¶rmige Tombaugh Regio. Jetzt 59 AE von der Sonne entfernt, erkundet den Kuiperg×¼rtel.',
        funFactNewHorizons: 'New Horizons reiste 9,5 Jahre und 5 Milliarden km, um Pluto mit 58.536 km/h zu erreichen. Tr×¤gt 28g von Clyde Tombaughs Asche!',
        descJuno: 'Juno trat am 4. Juli 2016 in die Jupiter-Umlaufbahn ein. Untersucht Zusammensetzung, Gravitationsfeld, Magnetfeld und polare Polarlichter. Entdeckte, dass Jupiters Kern gr×¶×Ÿer und "unscharf" ist, massive polare Wirbelst×¼rme und atmosph×¤rische Ammoniakverteilung. Mission bis Sept 2025 verl×¤ngert.',
        funFactJuno: 'Erstes solarbetriebenes Raumfahrzeug zu Jupiter! Drei 9m Solarpanele erzeugen 500W. Tr×¤gt drei LEGO-Figuren: Galileo, Jupiter und Juno!',
        descCassini: 'Cassini umkreiste Saturn vom 30. Juni 2004 bis 15. Sept 2017 (13 Jahre). Entdeckte Methan/Ethan-Fl×¼ssigseen auf Titan, Wasserfont×¤nen auf Enceladus, neue Ringe, 7 neue Monde. Die Huygens-Sonde landete am 14. Jan 2005 auf Titan. Endete mit "Grand Finale" Atmosph×¤reneintritt.',
        funFactCassini: 'Entdeckte den unterirdischen Ozean von Enceladus! Wasserfont×¤nen spr×¼hen 250kg/s ins All. Cassini flog durch die Font×¤nen, entdeckte H2, organische Verbindungen - Zutaten f×¼r Leben!',
        descPioneer10: 'Pioneer 10 war das erste Raumfahrzeug, das den Asteroideng×¼rtel durchquerte und Jupiter besuchte (3. Dez 1973)! Gestartet am 2. M×¤rz 1972, trug die ber×¼hmte Pioneer-Plakette mit Menschen und Erdposition. Letzter Kontakt: 23. Jan 2003 bei 12,2 Milliarden km.',
        funFactPioneer10: 'Pioneer 10 tr×¤gt eine goldene Plakette von Carl Sagan, die einen Mann, eine Frau und die Erdposition zeigt - eine Botschaft f×¼r Au×Ÿerirdische, die sie finden k×¶nnten!',
        descPioneer11: 'Pioneer 11 war das erste Raumfahrzeug, das Saturn besuchte (1. Sept 1979)! Flog auch an Jupiter vorbei (2. Dez 1974). Gestartet am 5. April 1973, entdeckte Saturns F-Ring und einen neuen Mond. Tr×¤gt ebenfalls die Pioneer-Plakette. Letzter Kontakt: 24. Nov 1995 bei 6,5 Milliarden km.',
        funFactPioneer11: 'Pioneer 11 nutzte Jupiters Schwerkraft f×¼r das erste planetare Swing-by-Man×¶ver und sparte Jahre Reisezeit zum Saturn!',
        
        // Kometenbeschreibungen
        descHalley: 'Der Halleysche Komet ist der ber×¼hmteste! Er kehrt alle 75-76 Jahre zur Erde zur×¼ck. Zuletzt 1986 gesehen, wird er 2061 wiederkommen. Wenn Sie ihn sehen, beobachten Sie einen 4,6 Milliarden Jahre alten kosmischen Schneeball!',
        descHaleBopp: 'Hale-Bopp war einer der hellsten Kometen des 20. Jahrhunderts, 18 Monate lang 1996-1997 mit blo×Ÿem Auge sichtbar! Sein Kern ist au×Ÿergew×¶hnlich gro×Ÿ mit 60 km Durchmesser.',
        descNeowise: 'Komet NEOWISE war im Juli 2020 ein spektakul×¤rer Anblick! Er wird erst in etwa 6.800 Jahren wiederkommen. Kometen sind "schmutzige Schneeb×¤lle" aus Eis, Staub und Gestein von der Entstehung des Sonnensystems.'
    },
    
    es: {
        // T×­tulo y encabezado de la aplicación
        appTitle: "Viaje Espacial",
        subtitle: "Sistema Solar 3D Interactivo",
        
        // Navegación
        quickNavigation: "Navegación Rápida",
        
        // Categor×­as de objetos
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
        io: "×o",
        europa: "Europa",
        ganymede: "Gan×­medes",
        callisto: "Calisto",
        saturnSystem: "Sistema Saturniano",
        saturn: "Saturno",
        titan: "Titán",
        uranusSystem: "Sistema de Urano",
        uranus: "Urano",
        neptuneSystem: "Sistema Neptuniano",
        neptune: "Neptuno",
        pluto: "Plutón",
        charon: "Caronte",
        enceladus: "Encélado",
        rhea: "Rea",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Tritón",
        
        // Secciones del menú de navegación
        navOurStar: "Nuestra Estrella",
        navInnerPlanets: "Planetas Interiores (Rocosos)",
        navAsteroidBelt: "Cinturón de Asteroides",
        navOuterPlanets: "Planetas Exteriores (Gigantes Gaseosos)",
        navIceGiants: "Gigantes de Hielo",
        navKuiperBelt: "Cinturón de Kuiper y Planetas Enanos",
        navComets: "Cometas",
        navSatellites: "Satélites y Estaciones Espaciales",
        navSpacecraft: "Naves Espaciales y Sondas",
        navDistantStars: "Estrellas Distantes",
        kuiperBelt: "Cinturón de Kuiper",
        asteroidBelt: "Cinturón de Asteroides",
        
        // Botones de control
        toggleOrbits: "×“rbitas",
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
        size: "Tama×±o",
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
        updateMessage: "áUna nueva versión está disponible!",
        updateButton: "Actualizar Ahora",
        updateLater: "Más Tarde",
        offline: "Modo Sin Conexión",
        offlineMessage: "Estás sin conexión. Algunas funciones pueden estar limitadas.",
        installTitle: "Instalar Viaje Espacial",
        installMessage: "áInstala Viaje Espacial como aplicación para una mejor experiencia!",
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
        descSun: 'El Sol es una estrella de tipo G (enana amarilla) que contiene el 99,86% de la masa del Sistema Solar. Temperatura superficial: 5.778 K. Edad: 4,6 mil millones de a×±os. áFusiona 600 millones de toneladas de hidrógeno en helio cada segundo!',
        descMercury: 'Mercurio es el planeta más peque×±o y el más cercano al Sol. Su superficie está cubierta de cráteres como nuestra Luna. La temperatura var×­a de -180°C por la noche a 430°C durante el d×­a: áel mayor rango de temperatura en el sistema solar!',
        descVenus: 'Venus es el planeta más caliente con una temperatura superficial de 465°C debido a un efecto invernadero extremo. Su atmósfera es 96% CO2 con nubes de ácido sulfúrico. áVenus gira hacia atrás en comparación con la mayor×­a de los planetas!',
        descEarth: 'La Tierra es nuestro hogar, áel único planeta conocido con vida! El 71% está cubierto de agua, creando el color azul visible desde el espacio. La atmósfera nos protege de la radiación da×±ina y los meteoros.',
        descMoon: 'La Luna terrestre es la quinta luna más grande del sistema solar. Crea las mareas, estabiliza la inclinación de la Tierra y se formó hace 4,5 mil millones de a×±os cuando un objeto del tama×±o de Marte impactó la Tierra!',
        descMars: 'Marte, el Planeta Rojo, debe su color al óxido de hierro (óxido). Tiene el volcán más grande (Olympus Mons - 22 km de altura) y el ca×±ón más largo (Valles Marineris - 4.000 km de largo) del sistema solar. áExiste hielo de agua en sus polos!',
        descJupiter: 'Júpiter es el planeta más grande: átodos los demás planetas podr×­an caber dentro! La Gran Mancha Roja es una tormenta más grande que la Tierra que ha estado activa durante al menos 400 a×±os. áJúpiter tiene 95 lunas conocidas!',
        descSaturn: 'Saturno es famoso por su espectacular sistema de anillos compuestos de part×­culas de hielo y roca. áEs el planeta menos denso: flotar×­a en agua! Saturno tiene 146 lunas conocidas, incluida Titán, que tiene una atmósfera densa.',
        descUranus: 'Urano es único: ágira de lado! Esto significa que sus polos se turnan para mirar al Sol durante su órbita de 84 a×±os. Compuesto de hielos de agua, metano y amon×­aco, aparece de color azul verdoso debido al metano en su atmósfera.',
        descNeptune: 'Neptuno es el planeta más ventoso con tormentas que alcanzan á2.100 km/h! Es el planeta más lejano del Sol y tarda 165 a×±os terrestres en completar una órbita. Su color azul proviene del metano en la atmósfera.',
        
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
        distanceVaries: 'Distancia var×­a',
        noDescription: 'No hay descripción disponible',
        moonCount: 'Este planeta tiene',
        majorMoon: 'luna grande',
        majorMoons: 'lunas grandes',
        shownHere: 'mostradas aqu×­ (áexisten muchas más peque×±as!)',
        
        // Datos curiosos
        funFactSun: 'áEl Sol es tan grande que 1,3 millones de Tierras podr×­an caber dentro!',
        funFactMercury: 'áUn a×±o en Mercurio (88 d×­as terrestres) es más corto que su d×­a (176 d×­as terrestres)!',
        funFactVenus: 'Venus es el planeta más brillante en nuestro cielo y a menudo se le llama el "gemelo malvado" de la Tierra',
        funFactEarth: 'áLa Tierra es el único planeta que no lleva el nombre de un dios. Viaja a 107.000 km/h alrededor del Sol!',
        funFactMoon: 'áLa Luna se está alejando lentamente de la Tierra a 3,8 cm por a×±o!',
        funFactMars: 'áMarte tiene estaciones como la Tierra, y su d×­a es solo 37 minutos más largo que el nuestro!',
        funFactJupiter: 'áLa gravedad de Júpiter protege a la Tierra de muchos asteroides y cometas!',
        funFactSaturn: 'áLos anillos de Saturno tienen solo 10 metros de espesor pero 280.000 km de ancho!',
        funFactUranus: 'áUrano fue el primer planeta descubierto con un telescopio (1781)!',
        funFactNeptune: 'áNeptuno fue descubierto por matemáticas antes de ser visto: su gravedad afectaba la órbita de Urano!',
        descPluto: '🪐 Plutón es un planeta enano en el Cinturón de Kuiper. Tiene un glaciar en forma de corazón (Tombaugh Regio), montañas de hielo de agua y cinco lunas. Plutón y su luna más grande, Caronte, están bloqueados por mareas: ¡siempre se muestran la misma cara!',
        funFactPluto: 'áUn a×±o en Plutón dura 248 a×±os terrestres! No ha completado una órbita desde su descubrimiento en 1930.',
        
        // Descripciones de lunas
        descPhobos: 'áFobos orbita Marte más rápido de lo que Marte gira! Sale por el oeste y se pone por el este.',
        descDeimos: 'Deimos es la más peque×±a de las dos lunas de Marte y tarda 30 horas en orbitar.',
        descIo: 'á×o es el cuerpo más volcánicamente activo del sistema solar!',
        descEuropa: 'áEuropa tiene un océano global bajo su hielo: un lugar potencial para la vida!',
        descGanymede: 'áGan×­medes es la luna más grande del sistema solar, más grande que Mercurio!',
        descCallisto: 'áCalisto es el objeto más craterizado del sistema solar!',
        descTitan: 'áTitán tiene lagos y r×­os de metano l×­quido: el único lugar con l×­quidos superficiales aparte de la Tierra!',
        descEnceladus: 'áEncélado expulsa chorros de agua al espacio desde su océano subterráneo!',
        descRhea: 'áRea podr×­a tener su propio sistema de anillos!',
        descTitania: 'áTitania es la luna más grande de Urano con ca×±ones masivos!',
        descMiranda: 'áMiranda tiene el terreno más dramático del sistema solar con acantilados de 20 km de altura!',
        descTriton: 'áTritón orbita hacia atrás y tiene géiseres de nitrógeno! Probablemente es un objeto capturado del cinturón de Kuiper.',
        descCharon: 'áCaronte es tan grande comparado con Plutón que forman un sistema binario!',
        
        // Descripciones y datos de satélites
        descISS: 'La EEI orbita a 400 km de altitud, completando una órbita cada 92,68 minutos (15,54 órbitas/d×­a). Lanzada el 20 nov 1998 (módulo Zarya). Ensamblaje: 1998-2011 (42 vuelos: 36 Shuttle, 6 rusos). Masa: 419.725 kg. Volumen presurizado: 1.000 mó. Ocupación continua desde el 2 nov 2000 (24+ a×±os, 9.000+ d×­as). 280+ astronautas de 23 pa×­ses la han visitado.',
        funFactISS: 'áLa EEI viaja a 27.600 km/h! Los astronautas ven 16 amaneceres/atardeceres por d×­a. áHa estado continuamente ocupada durante 24+ a×±os, más que cualquier otra nave espacial!',
        descHubble: 'Lanzado el 24 abril 1990 por el transbordador Discovery. Orbita a ~535 km de altitud. Ha realizado 1,6+ millones de observaciones hasta oct 2025. Espejo primario de 2,4m observa UV, visible e IR cercano. Cinco misiones de servicio (1993-2009) mejoraron los instrumentos.',
        funFactHubble: 'áPuede resolver objetos separados por 0,05 segundos de arco: como ver dos luciérnagas a 10.000 km! La imagen más profunda (eXtreme Deep Field) muestra 5.500 galaxias, algunas a 13,2 mil millones de a×±os luz.',
        descGPS: 'Constelación GPS (NAVSTAR): 31 satélites operativos (oct 2025) en 6 planos orbitales, inclinación 55°. Cada satélite orbita a 20.180 km de altitud. Transmite se×±ales banda L (1,2-1,5 GHz). Relojes atómicos de rubidio/cesio precisos a 10â»×¹â´ segundos.',
        funFactGPS: 'áNecesita 4 satélites para posición 3D (trilateración + corrección de reloj). El sistema proporciona precisión de 5-10m. La se×±al militar (código P/Y) es precisa al cent×­metro!',
        descJWST: 'Lanzado el 25 dic 2021. Alcanzó el punto L2 el 24 ene 2022. Primeras imágenes publicadas el 12 jul 2022. Observa infrarrojo (0,6-28,5 μm). Espejo segmentado de berilio de 6,5m (18 hexágonos) con 25 m² de área colectora: á6x Hubble! Parasol: 21,2m ×— 14,2m, 5 capas.',
        funFactJWST: 'áOpera a -233°C (-388°F)! Puede detectar la firma térmica de un abejorro a distancia lunar. áHa descubierto las galaxias más antiguas en z=14 (280 millones de a×±os después del Big Bang)!',
        
        // Descripciones y datos de naves espaciales
        descVoyager1: 'áVoyager 1 es el objeto hecho por el hombre más lejano de la Tierra! Lanzada el 5 sept 1977, entró al espacio interestelar el 25 ago 2012. Actualmente a 24,3 mil millones de km (162 UA) del Sol. Lleva el Disco de Oro con sonidos e imágenes de la Tierra.',
        funFactVoyager1: 'áVoyager 1 viaja a 17 km/s (61.200 km/h). Sus se×±ales de radio tardan 22,5 horas en llegar a la Tierra!',
        descVoyager2: 'áVoyager 2 es la única nave espacial que ha visitado los cuatro planetas gigantes! Júpiter (jul 1979), Saturno (ago 1981), Urano (ene 1986), Neptuno (ago 1989). Entró al espacio interestelar el 5 nov 2018. Ahora a 20,3 mil millones de km (135 UA) del Sol.',
        funFactVoyager2: 'áVoyager 2 descubrió 16 lunas entre los planetas gigantes, la Gran Mancha Oscura de Neptuno y los géiseres de Tritón!',
        descNewHorizons: 'áNew Horizons nos dio las primeras imágenes cercanas de Plutón el 14 julio 2015! Reveló monta×±as de hielo de agua de hasta 3.500m de altura, vastos glaciares de nitrógeno y la famosa Tombaugh Regio en forma de corazón. Ahora a 59 UA del Sol, explorando el cinturón de Kuiper.',
        funFactNewHorizons: 'áNew Horizons viajó 9,5 a×±os y 5 mil millones de km para llegar a Plutón a 58.536 km/h. Lleva 28g de las cenizas de Clyde Tombaugh!',
        descJuno: 'Juno entró en órbita de Júpiter el 4 julio 2016. Estudia composición, campo gravitacional, campo magnético y auroras polares. Descubrió que el núcleo de Júpiter es más grande y "difuso", ciclones polares masivos y distribución de amon×­aco atmosférico. Misión extendida hasta sept 2025.',
        funFactJuno: 'áPrimera nave espacial solar a Júpiter! Tres paneles solares de 9m generan 500W. áLleva tres figuras LEGO: Galileo, Júpiter y Juno!',
        descCassini: 'Cassini orbitó Saturno del 30 junio 2004 al 15 sept 2017 (13 a×±os). Descubrió lagos de metano/etano l×­quido en Titán, géiseres de agua en Encélado, nuevos anillos, 7 lunas nuevas. La sonda Huygens aterrizó en Titán el 14 ene 2005. Terminó con entrada atmosférica "Gran Finale".',
        funFactCassini: 'áDescubrió el océano subterráneo de Encélado! Los géiseres de agua expulsan 250kg/s al espacio. áCassini voló a través de los penachos, detectó H2, compuestos orgánicos: ingredientes para la vida!',
        descPioneer10: 'áPioneer 10 fue la primera nave espacial en cruzar el cinturón de asteroides y visitar Júpiter (3 dic 1973)! Lanzada el 2 marzo 1972, llevaba la famosa placa Pioneer mostrando humanos y la ubicación de la Tierra. ×šltimo contacto: 23 ene 2003 a 12,2 mil millones de km.',
        funFactPioneer10: 'áPioneer 10 lleva una placa dorada dise×±ada por Carl Sagan mostrando un hombre, una mujer y la ubicación de la Tierra: un mensaje para extraterrestres que puedan encontrarla!',
        descPioneer11: 'áPioneer 11 fue la primera nave espacial en visitar Saturno (1 sept 1979)! También sobrevoló Júpiter (2 dic 1974). Lanzada el 5 abril 1973, descubrió el anillo F de Saturno y una nueva luna. También lleva la placa Pioneer. ×šltimo contacto: 24 nov 1995 a 6,5 mil millones de km.',
        funFactPioneer11: 'áPioneer 11 usó la gravedad de Júpiter para la primera asistencia gravitacional planetaria, ahorrando a×±os de viaje a Saturno!',
        
        // Descripciones de cometas
        descHalley: 'áEl cometa Halley es el más famoso! Regresa a las cercan×­as de la Tierra cada 75-76 a×±os. Visto por última vez en 1986, regresará en 2061. áCuando lo ves, estás observando una bola de nieve cósmica de 4,6 mil millones de a×±os!',
        descHaleBopp: 'áHale-Bopp fue uno de los cometas más brillantes del siglo XX, visible a simple vista durante 18 meses en 1996-1997! Su núcleo es excepcionalmente grande con 60 km de diámetro.',
        descNeowise: 'áEl cometa NEOWISE fue un espectáculo espectacular en julio 2020! No regresará hasta dentro de unos 6.800 a×±os. Los cometas son "bolas de nieve sucias" compuestas de hielo, polvo y roca de la formación del sistema solar.'
    },
    
    pt: {
        // T×­tulo e cabe×§alho do aplicativo
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
        pluto: "Plutão",
        charon: "Caronte",
        enceladus: "Encélado",
        rhea: "Reia",
        titania: "Tit×¢nia",
        miranda: "Miranda",
        triton: "Tritão",
        
        // Seções do menu de navegação
        navOurStar: "Nossa Estrela",
        navInnerPlanets: "Planetas Interiores (Rochosos)",
        navAsteroidBelt: "Cinturão de Asteroides",
        navOuterPlanets: "Planetas Exteriores (Gigantes Gasosos)",
        navIceGiants: "Gigantes de Gelo",
        navKuiperBelt: "Cinturão de Kuiper e Planetas Anões",
        navComets: "Cometas",
        navSatellites: "Satélites e Estações Espaciais",
        navSpacecraft: "Naves Espaciais e Sondas",
        navDistantStars: "Estrelas Distantes",
        kuiperBelt: "Cinturão de Kuiper",
        asteroidBelt: "Cinturão de Asteroides",
        
        // Botões de controle
        toggleOrbits: "×“rbitas",
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
        distance: "Dist×¢ncia",
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
        spaceKey: "Espa×§o: Pausar/Retomar",
        plusMinus: "+/-: Mudar velocidade",
        rKey: "R: Redefinir visualização",
        hKey: "H: Alternar ajuda",
        lKey: "L: Alternar ponteiros laser (RV)",
        features: "Recursos",
        vrSupport: "Suporte RV/RA com WebXR",
        realisticOrbits: "Mec×¢nica orbital realista",
        educationalMode: "Modos de escala educacional e realista",
        constellations: "Principais constelações vis×­veis",
        spacecraft: "Naves espaciais e satélites históricos",
        
        // Notificações
        updateAvailable: "Atualização Dispon×­vel",
        updateMessage: "Uma nova versão está dispon×­vel!",
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
        descSun: 'O Sol é uma estrela de tipo G (anã amarela) contendo 99,86% da massa do Sistema Solar. Temperatura da superf×­cie: 5.778 K. Idade: 4,6 bilhões de anos. Ele funde 600 milhões de toneladas de hidrogênio em hélio a cada segundo!',
        descMercury: 'Mercúrio é o menor planeta e o mais próximo do Sol. Sua superf×­cie é coberta com crateras como nossa Lua. A temperatura varia de -180°C à noite a 430°C durante o dia - a maior variação de temperatura no sistema solar!',
        descVenus: 'Vênus é o planeta mais quente com temperatura de superf×­cie de 465°C devido a um efeito estufa extremo. Sua atmosfera é 96% CO2 com nuvens de ácido sulfúrico. Vênus gira para trás em comparação com a maioria dos planetas!',
        descEarth: 'A Terra é nosso lar, o único planeta conhecido com vida! 71% é coberto por água, criando a cor azul vis×­vel do espa×§o. A atmosfera nos protege de radiação nociva e meteoros.',
        descMoon: 'A Lua da Terra é a quinta maior lua do sistema solar. Ela cria as marés, estabiliza a inclinação da Terra e foi formada há 4,5 bilhões de anos quando um objeto do tamanho de Marte colidiu com a Terra!',
        descMars: 'Marte, o Planeta Vermelho, deve sua cor ao óxido de ferro (ferrugem). Ele tem o maior vulcão (Olympus Mons - 22 km de altura) e o c×¢nion mais longo (Valles Marineris - 4.000 km de comprimento) do sistema solar. Existe gelo de água em seus polos!',
        descJupiter: 'Júpiter é o maior planeta - todos os outros planetas poderiam caber dentro dele! A Grande Mancha Vermelha é uma tempestade maior que a Terra que tem durado pelo menos 400 anos. Júpiter tem 95 luas conhecidas!',
        descSaturn: 'Saturno é famoso por seu espetacular sistema de anéis feito de part×­culas de gelo e rocha. ×‰ o planeta menos denso - flutuaria na água! Saturno tem 146 luas conhecidas, incluindo Titã, que tem uma atmosfera densa.',
        descUranus: 'Urano é único - ele gira de lado! Isso significa que seus polos se revezam voltados para o Sol durante sua órbita de 84 anos. Feito de gelos de água, metano e amÃ´nia, aparece azul-esverdeado devido ao metano em sua atmosfera.',
        descNeptune: 'Netuno é o planeta mais ventoso com tempestades alcan×§ando 2.100 km/h! ×‰ o planeta mais distante do Sol e leva 165 anos terrestres para completar uma órbita. Sua cor azul vem do metano na atmosfera.',
        
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
        distanceVaries: 'Dist×¢ncia varia',
        noDescription: 'Nenhuma descrição dispon×­vel',
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
        descPluto: '🪐 Plutão é um planeta anão no Cinturão de Kuiper. Ele tem uma geleira em forma de coração (Tombaugh Regio), montanhas de gelo de água e cinco luas. Plutão e sua maior lua, Caronte, estão travados por maré - sempre mostram a mesma face um ao outro!',
        funFactPluto: 'Um ano em Plutão dura 248 anos terrestres! Ele não completou uma órbita desde sua descoberta em 1930.',
        
        // Descrições de luas
        descPhobos: 'Fobos orbita Marte mais rápido do que Marte gira! Ele nasce no oeste e se põe no leste.',
        descDeimos: 'Deimos é a menor das duas luas de Marte e leva 30 horas para orbitar.',
        descIo: 'Io é o corpo mais vulcanicamente ativo do sistema solar!',
        descEuropa: 'Europa tem um oceano global sob seu gelo - um local potencial para vida!',
        descGanymede: 'Ganimedes é a maior lua do sistema solar, maior que Mercúrio!',
        descCallisto: 'Calisto é o objeto mais repleto de crateras no sistema solar!',
        descTitan: 'Titã tem lagos e rios de metano l×­quido - o único lugar com l×­quidos na superf×­cie além da Terra!',
        descEnceladus: 'Encélado expele jatos de água para o espa×§o de seu oceano subterr×¢neo!',
        descRhea: 'Reia pode ter seu próprio sistema de anéis!',
        descTitania: 'Tit×¢nia é a maior lua de Urano com c×¢nions maci×§os!',
        descMiranda: 'Miranda tem o terreno mais dramático do sistema solar com falésias de 20 km de altura!',
        descTriton: 'Tritão orbita para trás e tem gêiseres de nitrogênio! Provavelmente é um objeto capturado do cinturão de Kuiper.',
        descCharon: 'Caronte é tão grande comparado a Plutão que eles formam um sistema binário!',
        
        // Descrições e fatos de satélites
        descISS: 'A ISS orbita a 400 km de altitude, completando uma órbita a cada 92,68 minutos (15,54 órbitas/dia). Lan×§ada em 20 nov 1998 (módulo Zarya). Montagem: 1998-2011 (42 voos: 36 Shuttle, 6 russos). Massa: 419.725 kg. Volume pressurizado: 1.000 mó. Ocupação cont×­nua desde 2 nov 2000 (24+ anos, 9.000+ dias). 280+ astronautas de 23 pa×­ses a visitaram.',
        funFactISS: 'A ISS viaja a 27.600 km/h! Os astronautas veem 16 nascer/pÃ´r do sol por dia. Ela está continuamente ocupada há 24+ anos - mais do que qualquer outra nave espacial!',
        descHubble: 'Lan×§ado em 24 abril 1990 pelo Ã´nibus Discovery. Orbita a ~535 km de altitude. Realizou 1,6+ milhões de observações até out 2025. Espelho primário de 2,4m observa UV, vis×­vel e IV próximo. Cinco missões de servi×§o (1993-2009) melhoraram os instrumentos.',
        funFactHubble: 'Pode resolver objetos separados por 0,05 segundos de arco - como ver dois vaga-lumes a 10.000 km! A imagem mais profunda (eXtreme Deep Field) mostra 5.500 galáxias, algumas a 13,2 bilhões de anos-luz.',
        descGPS: 'Constelação GPS (NAVSTAR): 31 satélites operacionais (out 2025) em 6 planos orbitais, inclinação 55°. Cada satélite orbita a 20.180 km de altitude. Transmite sinais banda L (1,2-1,5 GHz). Relógios atÃ´micos de rub×­dio/césio precisos a 10â»×¹â´ segundos.',
        funFactGPS: 'Precisa de 4 satélites para posição 3D (trilateração + correção de relógio). O sistema fornece precisão de 5-10m. O sinal militar (código P/Y) é preciso ao cent×­metro!',
        descJWST: 'Lan×§ado em 25 dez 2021. Alcan×§ou o ponto L2 em 24 jan 2022. Primeiras imagens publicadas em 12 jul 2022. Observa infravermelho (0,6-28,5 μm). Espelho segmentado de ber×­lio de 6,5m (18 hexágonos) com 25 m² de área coletora - 6x Hubble! Protetor solar: 21,2m ×— 14,2m, 5 camadas.',
        funFactJWST: 'Opera a -233°C (-388°F)! Pode detectar a assinatura térmica de um zangão à dist×¢ncia lunar. Descobriu as galáxias mais antigas em z=14 (280 milhões de anos após o Big Bang)!',
        
        // Descrições e fatos de naves espaciais
        descVoyager1: 'Voyager 1 é o objeto feito pelo homem mais distante da Terra! Lan×§ada em 5 set 1977, entrou no espa×§o interestelar em 25 ago 2012. Atualmente a 24,3 bilhões de km (162 UA) do Sol. Carrega o Disco de Ouro com sons e imagens da Terra.',
        funFactVoyager1: 'Voyager 1 viaja a 17 km/s (61.200 km/h). Seus sinais de rádio levam 22,5 horas para chegar à Terra!',
        descVoyager2: 'Voyager 2 é a única nave espacial a visitar todos os quatro planetas gigantes! Júpiter (jul 1979), Saturno (ago 1981), Urano (jan 1986), Netuno (ago 1989). Entrou no espa×§o interestelar em 5 nov 2018. Agora a 20,3 bilhões de km (135 UA) do Sol.',
        funFactVoyager2: 'Voyager 2 descobriu 16 luas entre os planetas gigantes, a Grande Mancha Escura de Netuno e os gêiseres de Tritão!',
        descNewHorizons: 'New Horizons nos deu as primeiras imagens próximas de Plutão em 14 julho 2015! Revelou montanhas de gelo de água de até 3.500m de altura, vastas geleiras de nitrogênio e a famosa Tombaugh Regio em forma de coração. Agora a 59 UA do Sol, explorando o cinturão de Kuiper.',
        funFactNewHorizons: 'New Horizons viajou 9,5 anos e 5 bilhões de km para chegar a Plutão a 58.536 km/h. Carrega 28g das cinzas de Clyde Tombaugh!',
        descJuno: 'Juno entrou em órbita de Júpiter em 4 julho 2016. Estuda composição, campo gravitacional, campo magnético e auroras polares. Descobriu que o núcleo de Júpiter é maior e "difuso", ciclones polares maci×§os e distribuição de amÃ´nia atmosférica. Missão estendida até set 2025.',
        funFactJuno: 'Primeira nave espacial solar para Júpiter! Três painéis solares de 9m geram 500W. Carrega três figuras LEGO: Galileu, Júpiter e Juno!',
        descCassini: 'Cassini orbitou Saturno de 30 junho 2004 a 15 set 2017 (13 anos). Descobriu lagos de metano/etano l×­quido em Titã, gêiseres de água em Encélado, novos anéis, 7 novas luas. A sonda Huygens pousou em Titã em 14 jan 2005. Terminou com entrada atmosférica "Grand Finale".',
        funFactCassini: 'Descobriu o oceano subterr×¢neo de Encélado! Os gêiseres de água expelem 250kg/s para o espa×§o. Cassini voou através das plumas, detectou H2, compostos org×¢nicos - ingredientes para a vida!',
        descPioneer10: 'Pioneer 10 foi a primeira nave espacial a cruzar o cinturão de asteroides e visitar Júpiter (3 dez 1973)! Lan×§ada em 2 mar×§o 1972, carregava a famosa placa Pioneer mostrando humanos e a localização da Terra. ×šltimo contato: 23 jan 2003 a 12,2 bilhões de km.',
        funFactPioneer10: 'Pioneer 10 carrega uma placa dourada projetada por Carl Sagan mostrando um homem, uma mulher e a localização da Terra - uma mensagem para alien×­genas que possam encontrá-la!',
        descPioneer11: 'Pioneer 11 foi a primeira nave espacial a visitar Saturno (1 set 1979)! Também sobrevoou Júpiter (2 dez 1974). Lan×§ada em 5 abril 1973, descobriu o anel F de Saturno e uma nova lua. Também carrega a placa Pioneer. ×šltimo contato: 24 nov 1995 a 6,5 bilhões de km.',
        funFactPioneer11: 'Pioneer 11 usou a gravidade de Júpiter para a primeira assistência gravitacional planetária, economizando anos de viagem para Saturno!',
        
        // Descrições de cometas
        descHalley: 'O cometa Halley é o mais famoso! Ele retorna à s proximidades da Terra a cada 75-76 anos. Visto pela última vez em 1986, retornará em 2061. Quando você o vê, está observando uma bola de neve cósmica de 4,6 bilhões de anos!',
        descHaleBopp: 'Hale-Bopp foi um dos cometas mais brilhantes do século 20, vis×­vel a olho nu por 18 meses em 1996-1997! Seu núcleo é excepcionalmente grande com 60 km de di×¢metro.',
        descNeowise: 'O cometa NEOWISE foi um espetáculo espetacular em julho de 2020! Ele não voltará por cerca de 6.800 anos. Cometas são "bolas de neve sujas" compostas de gelo, poeira e rocha da formação do sistema solar.'
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
    
    const languageNames = { en: 'English', nl: 'Nederlands', fr: 'Fran×§ais', de: 'Deutsch', es: 'Espa×±ol', pt: 'Português' };
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

