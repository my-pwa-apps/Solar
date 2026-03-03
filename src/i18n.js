// Internationalization (i18n) - Multi-language support
// Space Voyage - English & Dutch translations

const translations = {
    en: {
        // App title and header
        appTitle: "Space Voyage",
        subtitle: "Interactive 3D Solar System",
        
        // Navigation
        quickNavigation: "Navigation",
        search: "Search...",
        
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
        // Dwarf planets
        ceres: 'Ceres', haumea: 'Haumea', makemake: 'Makemake', eris: 'Eris',
        orcus: 'Orcus', quaoar: 'Quaoar', gonggong: 'Gonggong', sedna: 'Sedna',
        salacia: 'Salacia', varda: 'Varda', varuna: 'Varuna',
        // Comets
        halley: "Halley's Comet", haleBopp: 'Hale-Bopp', hyakutake: 'Hyakutake',
        lovejoy: 'Lovejoy', encke: 'Encke', swiftTuttle: 'Swift-Tuttle',
        // Nearby stars
        alphaCentauri: 'Alpha Centauri',
        // Exoplanets
        proximaB: 'Proxima Centauri b', kepler452b: 'Kepler-452b',
        trappist1e: 'TRAPPIST-1e', kepler186f: 'Kepler-186f',
        // Other constellations
        bigDipper: 'Big Dipper', littleDipper: 'Little Dipper', southernCross: 'Southern Cross',
        orionsBelt: 'Orion\'s Belt', ursaMajor: 'Ursa Major',
        canisMajor: 'Canis Major', aquila: 'Aquila', pegasus: 'Pegasus',
        // Spacecraft
        iss: 'ISS', hubble: 'Hubble',
        jwst: 'James Webb Space Telescope', gpsNavstar: 'GPS Satellite (NAVSTAR)',
        voyager1: 'Voyager 1', voyager2: 'Voyager 2', newHorizons: 'New Horizons',
        juno: 'Juno (Jupiter)', cassini: 'Cassini (Saturn)', pioneer10: 'Pioneer 10', pioneer11: 'Pioneer 11',
        
        // Navigation menu sections
        jupiterSystem: "Jupiter System",
        saturnSystem: "Saturn System",
        uranusSystem: "Uranus System",
        neptuneSystem: "Neptune System",
        plutoSystem: "Pluto System",
        nearbyStars: "Nearby Stars",
        exoplanets: "Exoplanets",
        nebulae: "Nebulae",
        galaxies: "Galaxies",
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
        oortCloud: "Oort Cloud",
        asteroidBelt: "Asteroid Belt",
        // Nebulae names
        orionNebula: 'Orion Nebula',
        crabNebula: 'Crab Nebula',
        ringNebula: 'Ring Nebula',
        // Galaxy names
        andromedaGalaxy: 'Andromeda Galaxy',
        whirlpoolGalaxy: 'Whirlpool Galaxy',
        sombreroGalaxy: 'Sombrero Galaxy',
        // Constellation names (Latin astronomical names)
        aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
        leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpius: 'Scorpius',
        sagittarius: 'Sagittarius', capricornus: 'Capricornus', aquarius: 'Aquarius',
        pisces: 'Pisces', orion: 'Orion', cassiopeia: 'Cassiopeia',
        cygnus: 'Cygnus', lyra: 'Lyra', andromeda: 'Andromeda', andromedaConst: 'Andromeda', perseus: 'Perseus',
        // Nearby stars & exoplanet hosts
        alphaCentauriA: 'Alpha Centauri A',
        proximaCentauri: 'Proxima Centauri',
        kepler452Star: 'Kepler-452',
        trappist1Star: 'TRAPPIST-1',
        kepler186Star: 'Kepler-186',
        
        // Control buttons
        toggleOrbits: "Orbits",
        toggleConstellations: "Constellations",
        toggleScale: "Compact",
        toggleScaleRealistic: "Expanded",
        toggleScaleScientific: "Scientific",
        toggleLabels: "Labels OFF",
        toggleLabelsOn: "Labels ON",
        toggleSoundOn: "Sound ON",
        toggleSoundOff: "Sound OFF",
        resetView: "Reset",
        enterVR: "Enter VR",
        enterAR: "Enter AR",
        randomDiscovery: "Discover",

        // Bottom bar tooltips
        tooltipOrbits: "Show/hide orbital paths (O)",
        tooltipConstellations: "Show/hide star constellations (C)",
        tooltipLabels: "Toggle object labels (D)",
        tooltipScale: "Cycle compact, expanded, and scientific modes (S)",
        tooltipSound: "Toggle sound effects",
        tooltipReset: "Reset camera to default view (R)",
        tooltipDiscover: "Surprise me! Jump to a random object",
        tooltipHelp: "Show controls and features (H)",
        
        // Onboarding
        welcomeToSpace: "🚀 Welcome to Space Voyage!",
        skip: "Skip",
        next: "Next",
        startExploring: "Start Exploring! 🌟",
        onboardingNav: "Navigate the Universe",
        onboardingNavDesc: "Drag to rotate • Scroll to zoom • Right-click to pan",
        onboardingExplore: "Explore Objects",
        onboardingExploreDesc: "Click any planet, moon, or star to learn fascinating facts!",
        onboardingQuickNav: "Quick Navigation",
        onboardingQuickNavDesc: "Use the dropdown menu to jump directly to any object",
        
        // Mobile gestures
        pinchToZoom: "Pinch to zoom",
        dragToRotate: "Drag to rotate",
        
        // Loading
        preparingJourney: "Preparing your space journey...",
        defaultFact: "The Sun contains 99.86% of the Solar System's mass!",
        
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
        install: "Install",
        installLater: "Maybe Later",
        notNow: "Not Now",
        offlineMode: "You're offline",
        update: "Update",
        outerSolarSystem: "Outer Solar System",
        comets: "Comets",
        dwarfPlanets: "Dwarf Planets & Candidates",
        constellationsZodiac: "Constellations (Zodiac)",
        constellationsOther: "Constellations (Other)",
        
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
        typeComet: 'Comet',
        typeAsteroidBelt: 'Asteroid Belt',
        typeKuiperBelt: 'Kuiper Belt',
        typeOortCloud: 'Oort Cloud',
        typeConstellation: 'Constellation',
        typeExoplanet: 'Exoplanet',
        typeDistantStar: 'Distant Star',
        typeSatellite: 'Satellite',
        typeProbe: 'Space Probe',
        typeOrbiter: 'Orbiter',
        typeObservatory: 'Space Observatory',
        
        // Object Descriptions
        descSun: 'The Sun is a G-type main-sequence star (yellow dwarf) containing 99.86% of the Solar System\'s mass. Surface temperature: 5,778K. Age: 4.6 billion years. It fuses 600 million tons of hydrogen into helium every second!',
        descMercury: 'Mercury is the smallest planet and closest to the Sun. Its surface is covered with craters like our Moon. Temperature ranges from -180°C at night to 430°C during the day - the largest temperature swing in the solar system!',
        descVenus: 'Venus is the hottest planet with surface temperature of 465°C due to extreme greenhouse effect. Its atmosphere is 96% CO2 with clouds of sulfuric acid. Venus rotates backwards and has no moons - one of only two planets without any!',
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
        creatingOortCloud: 'Creating Oort cloud...',
        creatingStarfield: 'Creating starfield...',
        creatingMilkyWay: 'Creating Milky Way...',
        creatingOrbitalPaths: 'Creating orbital paths...',
        creatingConstellations: 'Creating constellations...',
        creatingDistantStars: 'Creating distant stars...',
        creatingNebulae: 'Creating nebulae...',
        creatingGalaxies: 'Creating galaxies...',
        creatingNearbyStars: 'Creating nearby stars...',
        creatingExoplanets: 'Creating exoplanets...',
        creatingComets: 'Creating comets...',
        creatingDwarfPlanets: 'Creating dwarf planets...',
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
        descISS: 'ISS orbits at 400 km altitude, completing one orbit every 92.68 minutes (15.54 orbits/day). Launched Nov 20, 1998 (Zarya module). Assembly: 1998-2011 (42 flights: 36 Shuttle, 6 Russian). Mass: 419,725 kg. Pressurized volume: 1,000 m³. Continuous occupation since Nov 2, 2000 (24+ years, 9,000+ days). 280+ astronauts from 23 countries visited.',
        funFactISS: 'The ISS travels at 27,600 km/h! Astronauts see 16 sunrises/sunsets per day. It\'s been continuously occupied for 24+ years - longer than any other spacecraft!',
        descHubble: 'Launched April 24, 1990 on Space Shuttle Discovery. Orbits at ~535 km altitude. Made 1.6+ million observations as of Oct 2025. 2.4m primary mirror observes UV, visible, and near-IR. Five servicing missions (1993-2009) upgraded instruments.',
        funFactHubble: 'Can resolve objects 0.05 arcseconds apart - like seeing two fireflies 10,000 km away! Deepest image (eXtreme Deep Field) shows 5,500 galaxies, some 13.2 billion light-years away.',
        descGPS: 'GPS (NAVSTAR) constellation: 31 operational satellites (as of Oct 2025) in 6 orbital planes, 55° inclination. Each satellite orbits at 20,180 km altitude. Transmits L-band signals (1.2-1.5 GHz). Rubidium/cesium atomic clocks accurate to 10⁻¹⁴ seconds.',
        funFactGPS: 'Need 4 satellites for 3D position fix (trilateration + clock correction). System provides 5-10m accuracy. Military signal (P/Y code) accurate to centimeters!',
        descJWST: 'Launched Dec 25, 2021. Reached L2 point Jan 24, 2022. First images released July 12, 2022. Observes infrared (0.6-28.5 μm). 6.5m segmented beryllium mirror (18 hexagons) with 25 m² collecting area - 6x Hubble! Sunshield: 21.2m × 14.2m, 5 layers.',
        funFactJWST: 'Operating at -233C (-388F)! Can detect heat signature of a bumblebee at Moon distance. Discovered earliest galaxies at z=14 (280 million years after Big Bang).',
        
        // Spacecraft descriptions and fun facts
        descVoyager1: 'Voyager 1 is the farthest human-made object from Earth! Launched Sept 5, 1977, it entered interstellar space on Aug 25, 2012. Currently 24.3 billion km (162 AU) from Sun. It carries the Golden Record with sounds and images of Earth.',
        funFactVoyager1: 'Voyager 1 travels at 17 km/s (61,200 km/h). Its radio signals take 22.5 hours to reach Earth!',
        descVoyager2: 'Voyager 2 is the only spacecraft to visit all four giant planets! Jupiter (Jul 1979), Saturn (Aug 1981), Uranus (Jan 1986), Neptune (Aug 1989). Entered interstellar space Nov 5, 2018. Now 20.3 billion km (135 AU) from Sun.',
        funFactVoyager2: 'Voyager 2 discovered 16 moons across the giant planets, Neptune\'s Great Dark Spot, and Triton\'s geysers!',
        descNewHorizons: 'New Horizons gave us the first close-up images of Pluto on July 14, 2015! It revealed water ice mountains up to 3,500m tall, vast nitrogen glaciers, and the famous heart-shaped Tombaugh Regio. Now 59 AU from Sun, exploring Kuiper Belt.',
        funFactNewHorizons: 'New Horizons traveled 9.5 years and 5 billion km to reach Pluto at 58,536 km/h. It carries 1 oz of Clyde Tombaugh\'s ashes!',
        descJuno: 'Juno entered Jupiter orbit July 4, 2016. Studies composition, gravity field, magnetic field, and polar auroras. Discovered Jupiter\'s core is larger and "fuzzy", massive polar cyclones, and atmospheric ammonia distribution. Extended mission ongoing since 2021.',
        funFactJuno: 'First solar-powered spacecraft at Jupiter! Three 9m solar panels generate 500W. Carries three LEGO figurines: Galileo, Jupiter, and Juno!',
        descCassini: 'Cassini orbited Saturn June 30, 2004 - Sept 15, 2017 (13 years). Discovered liquid methane/ethane lakes on Titan, water geysers on Enceladus, new rings, 7 new moons. Huygens probe landed on Titan Jan 14, 2005. Ended with atmospheric entry "Grand Finale".',
        funFactCassini: 'Discovered Enceladus\' subsurface ocean! Water geysers shoot 250kg/s into space. Cassini flew through plumes, detected H2, organics - ingredients for life!',
        descPioneer10: 'Pioneer 10 was the first spacecraft to travel through the asteroid belt and first to visit Jupiter (Dec 3, 1973)! Launched March 2, 1972, it carried the famous Pioneer plaque showing humans and Earth\'s location. Last contact: Jan 23, 2003 at 12.2 billion km.',
        funFactPioneer10: 'Pioneer 10 carries a gold plaque designed by Carl Sagan showing a man, woman, and Earth\'s location - a message to any aliens who might find it!',
        descPioneer11: 'Pioneer 11 was the first spacecraft to visit Saturn (Sept 1, 1979)! Also flew by Jupiter (Dec 3, 1974). Launched April 5, 1973, it discovered Saturn\'s F ring and a new moon. Also carries the Pioneer plaque. Last contact: Nov 24, 1995 at 6.5 billion km.',
        funFactPioneer11: 'Pioneer 11 used Jupiter\'s gravity for a daring gravity assist, saving years of travel time to Saturn!',
        
        // Comet descriptions
        descHalley: 'Halley\'s Comet is the most famous comet! It returns to Earth\'s vicinity every 75-76 years. Last seen in 1986, it will return in 2061. When you see it, you\'re viewing a 4.6 billion year old cosmic snowball!',
        descHaleBopp: 'Hale-Bopp was one of the brightest comets of the 20th century, visible to the naked eye for 18 months in 1996-1997! Its nucleus is unusually large at about 40 km in diameter.',
        descNeowise: 'Comet NEOWISE was a spectacular sight in July 2020! It won\'t return for about 6,800 years. Comets are "dirty snowballs" made of ice, dust, and rock from the solar system\'s formation.',

        // Galaxy descriptions
        descAndromeda: ' The Andromeda Galaxy is our nearest large galactic neighbor, 2.5 million light-years away! It contains 1 trillion stars and is on a collision course with the Milky Way (don\'t worry, collision in 4.5 billion years).',
        descWhirlpool: ' The Whirlpool Galaxy (M51) is famous for its beautiful spiral arms! It\'s interacting with a smaller companion galaxy, creating stunning tidal forces and new star formation.',
        descSombrero: ' The Sombrero Galaxy looks like a Mexican hat! It has a bright nucleus, an unusually large central bulge, and a prominent dust lane. Contains 2,000 globular clusters!',

        // Nebula descriptions
        descOrionNebula: ' The Orion Nebula is a stellar nursery where new stars are being born! It\'s 1,344 light-years away and is visible to the naked eye as a fuzzy patch in Orion\'s sword. Contains over 3,000 stars!',
        descCrabNebula: ' The Crab Nebula is the remnant of a supernova explosion observed by Chinese astronomers in 1054 AD! At its center is a pulsar spinning 30 times per second!',
        descRingNebula: ' The Ring Nebula is a planetary nebula - the glowing remains of a dying Sun-like star! The star at its center has blown off its outer layers, creating this beautiful ring.',

        // Constellation descriptions
        descAries: ' Aries is the first sign of the zodiac! Look for the bright stars Hamal and Sheratan. In Greek mythology, Aries represents the golden ram that saved Phrixus and Helle.',
        descTaurus: ' Taurus contains the bright red star Aldebaran, the bull\'s eye! Also home to the Pleiades star cluster. In mythology, Zeus transformed into a bull to win Europa.',
        descGemini: ' Gemini features the bright twins Castor and Pollux! In mythology, they were inseparable brothers, the Dioscuri, known for their bond and bravery.',
        descCancer: ' Cancer is faint but contains the beautiful Beehive Cluster (M44)! In mythology, Cancer was the crab sent by Hera to distract Hercules during his battle.',
        descLeo: ' Leo is home to the bright star Regulus! The "Sickle" asterism forms the lion\'s head. In mythology, Leo represents the Nemean Lion slain by Hercules.',
        descVirgo: ' Virgo is the second largest constellation! The bright star Spica represents wheat in the maiden\'s hand. Home to thousands of galaxies in the Virgo Cluster.',
        descLibra: ' Libra represents the scales of justice! Its brightest stars are Zubenelgenubi and Zubeneschamali, meaning "southern claw" and "northern claw" in Arabic.',
        descScorpius: ' Scorpius represents the scorpion that killed Orion in Greek mythology! The bright red star Antares marks the scorpion\'s heart. Look for the curved tail with the stinger!',
        descSagittarius: ' Sagittarius aims his arrow at the heart of Scorpius! The "Teapot" asterism is easy to spot. Points toward the center of our Milky Way galaxy!',
        descCapricornus: ' Capricornus is one of the oldest constellations! Represents a creature with the head of a goat and tail of a fish. Associated with the god Pan in Greek mythology.',
        descAquarius: ' Aquarius represents the water-bearer pouring from his urn! Home to several famous deep-sky objects including the Helix Nebula. One of the oldest named constellations.',
        descPisces: ' Pisces shows two fish tied together! Represents Aphrodite and Eros who transformed into fish to escape the monster Typhon. Contains the vernal equinox point!',
        descOrion: ' Orion is one of the most recognizable constellations! Look for the three stars in a row forming Orion\'s Belt. The bright red star Betelgeuse marks his shoulder, and blue Rigel marks his foot.',
        descUrsaMajor: ' The Big Dipper is actually part of Ursa Major (Great Bear)! The two stars at the end of the "cup" point to Polaris, the North Star. Used for navigation for thousands of years!',
        descUrsaMajorFull: ' Ursa Major (the Great Bear) is the third-largest constellation in the sky! It contains the famous Big Dipper asterism which forms the bear\'s back and tail. With 16 main stars tracing a bear shape including head, body and legs, it has been recognized by cultures worldwide for thousands of years. Dubhe and Merak are the "pointer stars" that lead to Polaris!',
        descUrsaMinor: ' The Little Dipper contains Polaris, the North Star! Polaris marks the end of the Little Dipper\'s handle and stays nearly fixed in the northern sky. Essential for celestial navigation!',
        descCrux: ' The Southern Cross is the smallest constellation but one of the most famous in the Southern Hemisphere! Used for navigation, it points towards the South Celestial Pole.',
        descBigDipper: ' The Big Dipper is the most recognized asterism in the northern sky! Seven bright stars form a ladle shape — the "pointer stars" Dubhe and Merak at the cup\'s end aim straight at Polaris, the North Star. Used for navigation for thousands of years!',
        descLittleDipper: ' The Little Dipper contains Polaris, the North Star! Polaris marks the end of the Little Dipper\'s handle and stays nearly fixed in the northern sky. Essential for celestial navigation!',
        descSouthernCross: ' The Southern Cross is the smallest constellation but one of the most famous in the Southern Hemisphere! Used for navigation, it points towards the South Celestial Pole.',
        descCassiopeia: ' Cassiopeia looks like a W or M depending on the season! In Greek mythology, Cassiopeia was a vain queen. The constellation is circumpolar in northern latitudes, meaning it never sets.',
        descCygnus: ' Cygnus the Swan flies along the Milky Way! Also called the Northern Cross. In mythology, Zeus disguised himself as a swan. Home to many deep-sky objects!',
        descLyra: ' Lyra represents the lyre of Orpheus! Contains Vega, the 5th brightest star in the night sky. Also home to the Ring Nebula, a famous planetary nebula!',
        descAndromedaConst: ' Andromeda was the princess chained to a rock and rescued by Perseus! This constellation contains the Andromeda Galaxy (M31), our nearest large galaxy neighbor!',
        descPerseus: ' Perseus the hero who slayed Medusa! Home to the bright star Mirfak and the famous variable star Algol ("Demon Star"). Contains the Double Cluster!',
        descOrionsBelt: ' Orion\'s Belt is one of the most recognizable asterisms in the night sky! Three bright stars — Alnitak, Alnilam and Mintaka — form a nearly perfect line. Ancient Egyptians aligned the Great Pyramids of Giza to mirror these three stars!',
        descCanisMajor: ' Canis Major is home to Sirius, the brightest star in the entire night sky! Known as the "Dog Star," Sirius has been important to civilizations throughout history. The ancient Egyptians based their calendar on its rising. The constellation represents one of Orion\'s hunting dogs.',
        descAquila: ' Aquila the Eagle soars along the Milky Way! Its brightest star Altair completes the famous Summer Triangle with Vega (Lyra) and Deneb (Cygnus). Altair spins so fast it bulges at its equator! In mythology, Aquila carried Zeus\'s thunderbolts.',
        descPegasus: ' Pegasus the Winged Horse features the Great Square of Pegasus — one of autumn\'s most recognizable star patterns! In Greek mythology, Pegasus sprang from Medusa when Perseus slayed her. The star Enif marks the horse\'s nose.',

        // Nearby star descriptions
        descSirius: ' Sirius is the brightest star in Earth\'s night sky! It\'s actually a binary system with two stars orbiting each other. Located 8.6 light-years away in the constellation Canis Major.',
        descBetelgeuse: ' Betelgeuse is a red supergiant star nearing the end of its life! It\'s so big that if placed at our Sun\'s position, it would extend past Mars. Will explode as a supernova someday!',
        descRigel: ' Rigel is a blue supergiant, one of the most luminous stars visible to the naked eye! It\'s 40,000 times more luminous than our Sun and located 860 light-years away.',
        descVega: ' Vega is one of the brightest stars in the northern sky! It was the North Star 12,000 years ago and will be again in 13,000 years due to Earth\'s axial precession.',
        descPolaris: ' Polaris, the North Star, has guided travelers for centuries! It\'s actually a triple star system and is currently very close to true north due to Earth\'s rotation axis.',
        descAlphaCentauriA: ' Alpha Centauri A is very similar to our Sun! It\'s part of a triple star system that is our closest stellar neighbor at 4.37 light-years away. With its companion Alpha Centauri B, they orbit each other every 80 years.',
        descProximaCentauri: ' Proxima Centauri is a small red dwarf star and the closest star to our Solar System at just 4.24 light-years! It\'s much cooler and dimmer than our Sun, but it has at least two planets, including potentially habitable Proxima Centauri b.',

        // Exoplanet host star descriptions
        descKepler452Star: ' Kepler-452 is a Sun-like star that hosts Earth\'s "cousin" planet Kepler-452b! It\'s 1.5 billion years older than our Sun and 20% brighter. The star is 1,400 light-years away in the constellation Cygnus.',
        descTrappist1Star: ' TRAPPIST-1 is an ultra-cool red dwarf with 7 Earth-sized planets! Three of them are in the habitable zone. The entire system is so compact that all 7 planets orbit closer to their star than Mercury does to our Sun.',
        descKepler186Star: ' Kepler-186 is a red dwarf star with 5 known planets! Kepler-186f was the first Earth-sized planet discovered in the habitable zone of another star. The star is cooler than our Sun, giving it an orange-red glow.',

        // Exoplanet descriptions
        descProximaCentauriB: ' Proxima Centauri b is the closest known exoplanet to Earth! It orbits in the habitable zone of Proxima Centauri, meaning liquid water could exist on its surface. Discovered in 2016, it\'s only 4.24 light-years away.',
        descKepler452b: ' Kepler-452b is called "Earth\'s cousin"! It\'s about 60% larger than Earth and orbits a Sun-like star in the habitable zone. Its year is 385 days long. Could it have life? We don\'t know yet!',
        descTrappist1e: ' TRAPPIST-1e is part of an amazing system with 7 Earth-sized planets! It orbits a cool red dwarf star and is in the habitable zone. The system is so compact that all 7 planets would fit inside Mercury\'s orbit!',
        descKepler186f: ' Kepler-186f was the first Earth-sized planet discovered in another star\'s habitable zone! It receives about one-third the light Earth gets from the Sun, so plants there (if any!) might appear black or red instead of green.',

        // Dwarf planet descriptions
        descCeres: ' Ceres is the largest object in the asteroid belt and a dwarf planet! NASA\'s Dawn spacecraft revealed mysterious bright spots in Occator Crater - they turned out to be salt deposits from ancient brines.',
        descHaumea: ' Haumea spins so fast (once every 4 hours) that it has been squashed into an egg shape! It also has two moons and a ring system, making it very unusual among dwarf planets.',
        descMakemake: ' Makemake is a bright, reddish world in the Kuiper Belt discovered near Easter 2005, named after the creator god of the Rapa Nui people of Easter Island.',
        descEris: ' Eris is slightly smaller than Pluto but more massive! Its discovery in 2005 directly led to Pluto being reclassified as a dwarf planet. It has one moon, Dysnomia.',
        descSedna: ' Sedna has one of the most extreme elliptical orbits in the solar system, ranging from 76 to 937 AU. It takes about 11,400 years to complete one orbit and is so red it rivals Mars in color!',

        // Extra comet descriptions
        descHyakutake: ' Comet Hyakutake passed extremely close to Earth in 1996, becoming one of the brightest comets in decades with a tail stretching across half the sky!',
        descLovejoy: ' Comet Lovejoy (C/2011 W3) survived a close pass through the Sun\'s corona! It\'s part of the Kreutz sungrazers - fragments of a giant comet that broke up centuries ago.',
        descEncke: ' Comet Encke has the shortest orbital period of any known comet - only 3.3 years! It\'s named after Johann Franz Encke who calculated its orbit in 1819.',
        descSwiftTuttle: ' Comet Swift-Tuttle is the parent body of the spectacular Perseid meteor shower! With a 26 km nucleus, it\'s the largest object that regularly passes near Earth.',

        // Asteroid belt / Kuiper belt / Oort cloud
        descAsteroidBelt: ' The asteroid belt contains millions of rocky objects between Mars and Jupiter. Ceres, the largest object here, is a dwarf planet! Most asteroids are leftover material from the formation of the solar system 4.6 billion years ago.',
        descKuiperBelt: ' The Kuiper Belt is a region beyond Neptune filled with icy bodies and dwarf planets including Pluto! It\'s like a giant donut of frozen objects left over from the solar system\'s formation. Short-period comets come from here!',
        descOortCloud: ' The Oort Cloud is a vast spherical shell of icy objects surrounding our entire solar system! It extends from about 50,000 to 200,000 AU from the Sun. Long-period comets like Hale-Bopp originate from this distant realm.',

        // Fun facts for additional objects
        funFactAsteroidBelt: 'Despite what movies show, asteroids are very far apart - spacecraft can pass through safely!',
        funFactKuiperBelt: 'The Kuiper Belt is 20 times wider than the asteroid belt and contains billions of objects!',
        funFactOortCloud: 'The Oort Cloud is so far away that light from the Sun takes over 1.5 years to reach its outer edge! It would take Voyager 1 about 300 years to reach the inner edge.',
        funFactCeres: 'Ceres may host subsurface liquid water - making it a top candidate for finding life!',
        funFactHaumea: 'Rotation period ~4 hours gives Haumea its unique egg-like triaxial ellipsoid shape!',
        funFactMakemake: 'Discovered near Easter 2005, Makemake is named after the Rapa Nui creator deity!',
        funFactEris: 'Eris\'s discovery directly led to Pluto\'s reclassification as a dwarf planet in 2006!',
        funFactSedna: 'Sedna takes 11,400 years to complete one orbit - it may be influenced by an unseen Planet Nine!',
        funFactAlphaCentauriA: 'Alpha Centauri is visible from the Southern Hemisphere and is the third brightest star in our night sky!',
        funFactProximaCentauri: 'Despite being our closest star, Proxima is too dim to see with the naked eye!',
        funFactSirius: 'Sirius is actually getting closer to us - it will be at its closest in about 60,000 years!',
        funFactBetelgeuse: 'Betelgeuse could go supernova any day now (astronomically speaking - could be tomorrow or 100,000 years!)!',
        funFactDefaultStar: 'This star is visible to the naked eye from Earth!',
        funFactOrionNebula: 'New stars are being born in the Orion Nebula right now!',
        funFactCrabNebula: 'The Crab Nebula\'s pulsar spins 30 times per second and is expanding at 1,500 km/s!',
        funFactRingNebula: 'Planetary nebulae have nothing to do with planets - they just look round like planets through old telescopes!',
        funFactAndromedaGalaxy: 'The Andromeda Galaxy is approaching us at 110 km/s!',
        funFactWhirlpoolGalaxy: 'You can see the Whirlpool Galaxy with a good pair of binoculars!',
        funFactSombreroGalaxy: 'Despite billions of stars, galaxies are mostly empty space - the Sombrero included!',
        funFactTrappist1Star: 'TRAPPIST-1 is named after the telescope that discovered it - The TRAnsiting Planets and PlanetesImals Small Telescope!',
        funFactKepler452Star: 'Kepler-452 is 6 billion years old - it shows us what our Sun might be like in 1.5 billion years!',
        funFactKepler186Star: 'Plants on Kepler-186f would likely photosynthesize using infrared light and appear dark red or black!',
        funFactProximaCentauriB: 'With current technology, it would take 6,300 years to reach Proxima b!',
        funFactKepler452b: 'Kepler-452b is 6 billion years old - 1.5 billion years older than Earth!',
        funFactTrappist1e: 'From TRAPPIST-1e, you could see the other planets as large as our Moon in the sky!',
        funFactKepler186f: 'Kepler-186f orbits a red dwarf, so its sky would glow orange-red!',
        funFactComets: 'Comets have two tails: a curved dust tail (yellowish) and a straight ion tail (blue) - both always point away from the Sun!',
        descOrcus: 'Orcus is a large Kuiper Belt object in a 2:3 orbital resonance with Neptune, just like Pluto. It has its own moon named Vanth.',
        funFactOrcus: 'Orcus is sometimes called anti-Pluto — their orbits are almost perfect mirror images of each other on opposite sides of the Sun!',
        descQuaoar: 'Quaoar is a large Kuiper Belt object with its own moon Weywot. Remarkably, it has a ring system — the first ring ever discovered around a Kuiper Belt object.',
        funFactQuaoar: 'Quaoar\'s ring orbits far beyond its Roche limit, where rings shouldn\'t be able to exist — a mystery that challenges our understanding of ring formation!',
        descGonggong: 'Gonggong (formerly 2007 OR10) is a distant scattered disc object with a reddish surface caused by radiation-altered methane ice. It has a moon called Xiangliu.',
        funFactGonggong: 'Gonggong is named after a Chinese water god who, according to myth, tilted the Earth by crashing into a pillar holding up the sky!',
        descSalacia: 'Salacia is a dark Kuiper Belt object with a moon named Actaea. It is one of the largest trans-Neptunian objects that has not yet been classified as a dwarf planet.',
        funFactSalacia: 'Salacia is named after the Roman goddess of the sea and wife of Neptune — fitting for an icy world orbiting in the realm of the outermost planets!',
        descVarda: 'Varda is a binary Kuiper Belt object paired with its large moon Ilmarë. By measuring their mutual orbit, scientists can precisely calculate the system\'s combined mass.',
        funFactVarda: 'Varda is named after the Queen of the Stars in Tolkien\'s mythology — the deity who fashioned the stars and placed them in the sky of Middle-earth!',
        descVaruna: 'Varuna is a classical Kuiper Belt object known for its extremely fast rotation — completing a full spin every 6.3 hours, one of the fastest in the outer solar system.',
        funFactVaruna: 'Varuna spins so fast it bulges at the equator, making it shaped like a squashed ball — its equatorial diameter is noticeably larger than its polar diameter!'
    },
    
    nl: {
        // App titel en header
        appTitle: "Ruimtereis",
        subtitle: "Interactief 3D Zonnestelsel",
        
        // Navigatie
        quickNavigation: "Navigatie",
        search: "Zoeken...",
        searchObjects: "🔍 Objecten zoeken...",
        
        // Object categorieën
        ourStar: "Onze Ster",
        sun: "Zon",
        mercury: "Mercurius",
        venus: "Venus",
        earthSystem: "Aardesysteem",
        earth: "Aarde",
        moon: "Maan",
        marsSystem: "Marssysteem",
        mars: "Mars",
        phobos: "Phobos",
        deimos: "Deimos",
        jupiterSystem: "Jupitersysteem",
        jupiter: "Jupiter",
        io: "Io",
        europa: "Europa",
        ganymede: "Ganymedes",
        callisto: "Callisto",
        saturnSystem: "Saturnussysteem",
        saturn: "Saturnus",
        titan: "Titan",
        uranusSystem: "Uranussysteem",
        uranus: "Uranus",
        neptuneSystem: "Neptunussysteem",
        neptune: "Neptunus",
        pluto: "Pluto",
        plutoSystem: "Plutosysteem",
        charon: "Charon",
        enceladus: "Enceladus",
        rhea: "Rhea",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Triton",
        // Dwergplaneten
        ceres: 'Ceres', haumea: 'Haumea', makemake: 'Makemake', eris: 'Eris',
        orcus: 'Orcus', quaoar: 'Quaoar', gonggong: 'Gonggong', sedna: 'Sedna',
        salacia: 'Salacia', varda: 'Varda', varuna: 'Varuna',
        // Kometen
        halley: 'Komeet Halley', haleBopp: 'Hale-Bopp', hyakutake: 'Hyakutake',
        lovejoy: 'Lovejoy', encke: 'Encke', swiftTuttle: 'Swift-Tuttle',
        // Nabije sterren
        alphaCentauri: 'Alpha Centauri',
        // Exoplaneten
        proximaB: 'Proxima Centauri b', kepler452b: 'Kepler-452b',
        trappist1e: 'TRAPPIST-1e', kepler186f: 'Kepler-186f',
        // Andere sterrenbeelden
        bigDipper: 'Grote Beer', littleDipper: 'Kleine Beer', southernCross: 'Zuiderkruis',
        orionsBelt: 'Gordel van Orion', ursaMajor: 'Ursa Major',
        canisMajor: 'Grote Hond', aquila: 'Adelaar', pegasus: 'Pegasus',
        // Ruimtevaartuigen
        iss: 'ISS', hubble: 'Hubble',
        jwst: 'James Webb-ruimtetelescoop', gpsNavstar: 'GPS-satelliet (NAVSTAR)',
        voyager1: 'Voyager 1', voyager2: 'Voyager 2', newHorizons: 'New Horizons',
        juno: 'Juno (Jupiter)', cassini: 'Cassini (Saturnus)', pioneer10: 'Pioneer 10', pioneer11: 'Pioneer 11',
        
        // Navigatiemenu secties
        nearbyStars: "Nabije Sterren",
        exoplanets: "Exoplaneten",
        nebulae: "Nevels",
        galaxies: "Sterrenstelsels",
        navOurStar: "Onze Ster",
        navInnerPlanets: "Binnenste Planeten (Rotsachtig)",
        navAsteroidBelt: "Asteroïdengordel",
        navOuterPlanets: "Buitenste Planeten (Gasreuzen)",
        navIceGiants: "IJsreuzen",
        navKuiperBelt: "Kuipergordel & Dwergplaneten",
        navComets: "Kometen",
        navSatellites: "Satellieten & Ruimtestations",
        navSpacecraft: "Ruimtevaartuigen & Sondes",
        navDistantStars: "Verre Sterren",
        kuiperBelt: "Kuipergordel",
        oortCloud: "Oortwolk",
        asteroidBelt: "Asteroïdengordel",
        // Nevels
        orionNebula: 'Orionnevel',
        crabNebula: 'Krabnevel',
        ringNebula: 'Ringnevel',
        // Melkwegstelsels
        andromedaGalaxy: 'Andromedastelsel',
        whirlpoolGalaxy: 'Wervelstormstelsel',
        sombreroGalaxy: 'Sombrerostelsel',
        // Sterrenbeelden
        aries: 'Ram', taurus: 'Stier', gemini: 'Tweelingen', cancer: 'Kreeft',
        leo: 'Leeuw', virgo: 'Maagd', libra: 'Weegschaal', scorpius: 'Schorpioen',
        sagittarius: 'Boogschutter', capricornus: 'Steenbok', aquarius: 'Waterman',
        pisces: 'Vissen', orion: 'Orion', cassiopeia: 'Cassiopeia',
        cygnus: 'Zwaan', lyra: 'Lier', andromeda: 'Andromeda', andromedaConst: 'Andromeda', perseus: 'Perseus',
        // Nabije sterren & exoplaneetsterren
        alphaCentauriA: 'Alpha Centauri A',
        proximaCentauri: 'Proxima Centauri',
        kepler452Star: 'Kepler-452',
        trappist1Star: 'TRAPPIST-1',
        kepler186Star: 'Kepler-186',
        outerSolarSystem: "Buitenste Zonnestelsel",
        comets: "Kometen",
        dwarfPlanets: "Dwergplaneten & Kandidaten",
        constellationsZodiac: "Sterrenbeelden (Dierenriem)",
        constellationsOther: "Sterrenbeelden (Overig)",
        
        // Bedieningsknoppen
        toggleOrbits: "Banen",
        toggleConstellations: "Sterrenbeelden",
        toggleScale: "Compact",
        toggleScaleRealistic: "Uitgebreid",
        toggleScaleScientific: "Wetenschappelijk",
        toggleLabels: "Labels uit",
        toggleLabelsOn: "Labels aan",
        toggleSoundOn: "Geluid AAN",
        toggleSoundOff: "Geluid UIT",
        resetView: "Reset",
        enterVR: "VR Starten",
        enterAR: "AR Starten",
        randomDiscovery: "Ontdekken",

        // Knopinfo onderste balk
        tooltipOrbits: "Orbitale paden tonen/verbergen (O)",
        tooltipConstellations: "Sterrenbeelden tonen/verbergen (C)",
        tooltipLabels: "Objectlabels in-/uitschakelen (D)",
        tooltipScale: "Cyclisch wisselen tussen compact, uitgebreid en wetenschappelijk (S)",
        tooltipSound: "Geluidseffecten in-/uitschakelen",
        tooltipReset: "Camera terugzetten naar standaardweergave (R)",
        tooltipDiscover: "Verras me! Spring naar een willekeurig object",
        tooltipHelp: "Bedieningselementen en functies tonen (H)",
        
        // Onboarding
        welcomeToSpace: "🚀 Welkom bij Ruimtereis!",
        skip: "Overslaan",
        next: "Volgende",
        startExploring: "Begin met verkennen! 🌟",
        onboardingNav: "Navigeer het Universum",
        onboardingNavDesc: "Slepen om te draaien • Scrollen om in/uit te zoomen • Rechts klikken om te verschuiven",
        onboardingExplore: "Verken Objecten",
        onboardingExploreDesc: "Klik op een planeet, maan of ster om fascinerende feiten te leren!",
        onboardingQuickNav: "Snelle Navigatie",
        onboardingQuickNavDesc: "Gebruik het vervolgkeuzemenu om direct naar elk object te springen",
        
        // Mobiele gebaren
        pinchToZoom: "Knijpen om te zoomen",
        dragToRotate: "Slepen om te draaien",
        
        // Laden
        preparingJourney: "Uw ruimtereis voorbereiden...",
        defaultFact: "De Zon bevat 99,86% van de massa van het Zonnestelsel!",
        
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
        install: "Installeren",
        installLater: "Misschien Later",
        notNow: "Niet Nu",
        offlineMode: "U bent offline",
        update: "Bijwerken",
        
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
        typeComet: 'Komeet',
        typeAsteroidBelt: 'Asteroïdengordel',
        typeKuiperBelt: 'Kuipergordel',
        typeOortCloud: 'Oortwolk',
        typeConstellation: 'Sterrenbeeld',
        typeExoplanet: 'Exoplaneet',
        typeDistantStar: 'Verre Ster',
        typeSatellite: 'Satelliet',
        typeProbe: 'Ruimtesonde',
        typeOrbiter: 'Baanruimtevaartuig',
        typeObservatory: 'Ruimteobservatorium',
        
        // Object Beschrijvingen
        descSun: 'De Zon is een gele dwergster (G-type hoofdreeksster) met 99,86% van alle massa in ons zonnestelsel. Oppervlaktetemperatuur: 5.778K. Leeftijd: 4,6 miljard jaar. Elke seconde smelt de Zon 600 miljoen ton waterstof samen tot helium!',
        descMercury: 'Mercurius is de kleinste planeet en staat het dichtst bij de Zon. Het oppervlak zit vol kraters, net als onze Maan. De temperatuur schommelt tussen -180°C \'s nachts en 430°C overdag - de grootste temperatuurverschillen in ons zonnestelsel!',
        descVenus: 'Venus is met 465°C de heetste planeet door een extreem broeikaseffect. De atmosfeer bestaat voor 96% uit CO2 met wolken van zwavelzuur. Venus draait achteruit en heeft geen manen - een van slechts twee planeten zonder!',
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
        creatingOortCloud: 'Oortwolk maken...',
        creatingStarfield: 'Sterrenveld maken...',
        creatingMilkyWay: 'Melkweg maken...',
        creatingOrbitalPaths: 'Baanpaden maken...',
        creatingConstellations: 'Sterrenbeelden maken...',
        creatingDistantStars: 'Verre sterren plaatsen...',
        creatingNebulae: 'Nevels maken...',
        creatingGalaxies: 'Sterrenstelsels toevoegen...',
        creatingNearbyStars: 'Nabije sterren plaatsen...',
        creatingExoplanets: 'Exoplaneten ontdekken...',
        creatingComets: 'Kometen maken...',
        creatingDwarfPlanets: 'Dwergplaneten maken...',
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
        descISS: 'ISS draait op 400 km hoogte en voltooit elke 92,68 minuten een baan (15,54 banen/dag). Gelanceerd 20 nov 1998 (Zarya-module). Assemblage: 1998-2011 (42 vluchten: 36 Shuttle, 6 Russisch). Massa: 419.725 kg. Volume onder druk: 1.000 m³. Continu bewoond sinds 2 nov 2000 (24+ jaar, 9.000+ dagen). 280+ astronauten uit 23 landen bezocht.',
        funFactISS: 'Het ISS reist met 27.600 km/u! Astronauten zien 16 zonsopgangen/ondergangen per dag. Het is al 24+ jaar continu bewoond - langer dan elk ander ruimtevaartuig!',
        descHubble: 'Gelanceerd 24 april 1990 met Space Shuttle Discovery. Draait op ~535 km hoogte. Heeft tot oktober 2025 1,6+ miljoen waarnemingen gedaan. 2,4m primaire spiegel observeert UV, zichtbaar licht en nabij-IR. Vijf onderhoudsmissions (1993-2009) upgradeden de instrumenten.',
        funFactHubble: 'Kan objecten van 0,05 boogseconden onderscheiden - alsof je twee vuurvliegjes op 10.000 km afstand ziet! Diepste beeld (eXtreme Deep Field) toont 5.500 sterrenstelsels, sommige 13,2 miljard lichtjaar ver.',
        descGPS: 'GPS (NAVSTAR) constellatie: 31 operationele satellieten (per oktober 2025) in 6 baanvlakken, 55° inclinatie. Elke satelliet draait op 20.180 km hoogte. Zendt L-band signalen uit (1,2-1,5 GHz). Rubidium/cesium atoomklokken nauwkeurig tot 10⁻¹⁴ seconden.',
        funFactGPS: 'Je hebt 4 satellieten nodig voor een 3D-positiebepaling (trilateratie + klok correctie). Het systeem geeft 5-10m nauwkeurigheid. Militair signaal (P/Y code) nauwkeurig tot centimeters!',
        descJWST: 'Gelanceerd 25 dec 2021. Bereikte L2-punt 24 jan 2022. Eerste beelden vrijgegeven 12 juli 2022. Observeert infrarood (0,6-28,5 μm). 6,5m gesegmenteerde berylliumspiegel (18 zeshoeken) met 25 m² oppervlak - 6x Hubble! Zonneschild: 21,2m × 14,2m, 5 lagen.',
        funFactJWST: 'Werkt bij -233°C (-388°F)! Kan de warmte van een hommel op maanafstand detecteren. Ontdekte de vroegste sterrenstelsels bij z=14 (280 miljoen jaar na de Oerknal).',
        
        // Ruimtevaartuigbeschrijvingen en wetenswaardigheden
        descVoyager1: 'Voyager 1 is het verst door mensen gemaakte object vanaf de Aarde! Gelanceerd 5 sept 1977, kwam het op 25 aug 2012 in de interstellaire ruimte. Momenteel 24,3 miljard km (162 AU) van de Zon. Draagt de Gouden Plaat met geluiden en beelden van de Aarde.',
        funFactVoyager1: 'Voyager 1 reist met 17 km/s (61.200 km/u). Radiosignalen doen er 22,5 uur over om de Aarde te bereiken!',
        descVoyager2: 'Voyager 2 is het enige ruimtevaartuig dat alle vier reuzenplaneten bezocht! Jupiter (juli 1979), Saturnus (aug 1981), Uranus (jan 1986), Neptunus (aug 1989). Kwam 5 nov 2018 in de interstellaire ruimte. Nu 20,3 miljard km (135 AU) van de Zon.',
        funFactVoyager2: 'Voyager 2 ontdekte 16 manen bij de reuzenplaneten, de Grote Donkere Vlek van Neptunus, en geisers op Triton!',
        descNewHorizons: 'New Horizons gaf ons de eerste close-up beelden van Pluto op 14 juli 2015! Het onthulde waterijsbergen tot 3.500m hoog, enorme stikstofgletsjers, en de beroemde hartvormige Tombaugh Regio. Nu 59 AU van de Zon, verkent de Kuipergordel.',
        funFactNewHorizons: 'New Horizons reisde 9,5 jaar en 5 miljard km om Pluto te bereiken met 58.536 km/u. Het draagt 28 gram van Clyde Tombaugh\'s as!',
        descJuno: 'Juno kwam op 4 juli 2016 in een baan om Jupiter. Bestudeert samenstelling, zwaartekrachtveld, magnetisch veld en poolaurora\'s. Ontdekte dat Jupiter\'s kern groter en "vaag" is, massieve poolcyclonen, en atmosferische ammoniakverdeling. Verlengde missie sinds 2021.',
        funFactJuno: 'Eerste zonne-aangedreven ruimtevaartuig bij Jupiter! Drie 9m zonnepanelen genereren 500W. Draagt drie LEGO-poppetjes: Galileo, Jupiter en Juno!',
        descCassini: 'Cassini draaide om Saturnus van 30 juni 2004 - 15 sept 2017 (13 jaar). Ontdekte vloeibare methaan/ethaan meren op Titan, watergeisers op Enceladus, nieuwe ringen, 7 nieuwe manen. Huygens-sonde landde op Titan op 14 jan 2005. Eindigde met atmosferische intrede "Grand Finale".',
        funFactCassini: 'Ontdekte Enceladus\' ondergrondse oceaan! Watergeisers spuiten 250kg/s de ruimte in. Cassini vloog door pluimen, detecteerde H2, organische stoffen - ingrediënten voor leven!',
        descPioneer10: 'Pioneer 10 was het eerste ruimtevaartuig dat door de asteroïdengordel reisde en als eerste Jupiter bezocht (3 dec 1973)! Gelanceerd 2 maart 1972, droeg het de beroemde Pioneer-plaquette met mensen en de locatie van de Aarde. Laatste contact: 23 jan 2003 op 12,2 miljard km.',
        funFactPioneer10: 'Pioneer 10 draagt een gouden plaquette ontworpen door Carl Sagan met een man, vrouw en de locatie van de Aarde - een boodschap voor aliens die het zouden vinden!',
        descPioneer11: 'Pioneer 11 was het eerste ruimtevaartuig dat Saturnus bezocht (1 sept 1979)! Vloog ook langs Jupiter (3 dec 1974). Gelanceerd 5 april 1973, ontdekte het Saturnus\' F-ring en een nieuwe maan. Draagt ook de Pioneer-plaquette. Laatste contact: 24 nov 1995 op 6,5 miljard km.',
        funFactPioneer11: 'Pioneer 11 gebruikte Jupiter\'s zwaartekracht voor een gedurfde zwaartekrachtondersteuning, besparend jaren reistijd naar Saturnus!',
        
        // Komeetbeschrijvingen
        descHalley: 'De Halley-komeet is de beroemdste komeet! Hij keert elke 75-76 jaar terug naar de Aarde. Laatst gezien in 1986, keert hij terug in 2061. Als je hem ziet, bekijk je een 4,6 miljard jaar oude kosmische sneeuwbal!',
        descHaleBopp: 'Hale-Bopp was een van de helderste kometen van de 20e eeuw, 18 maanden met het blote oog zichtbaar in 1996-1997! Zijn kern is ongewoon groot met 40 km diameter.',
        descNeowise: 'Komeet NEOWISE was een spectaculair gezicht in juli 2020! Hij keert pas over ongeveer 6.800 jaar terug. Kometen zijn "vuile sneeuwballen" van ijs, stof en rots uit de vorming van het zonnestelsel.',

        // Sterrenstelsels
        descAndromeda: ' Het Andromedastelsel is ons dichtstbijzijnde grote buursterrenstelsel op 2,5 miljoen lichtjaar! Het bevat 1 biljoen sterren en is op ramkoers met de Melkweg (maak je geen zorgen, botsing over 4,5 miljard jaar).',
        descWhirlpool: ' Het Wervelwindsterrenstelsel (M51) is beroemd om zijn prachtige spiraalarms! Het is in wisselwerking met een kleiner begeleidend sterrenstelsel, wat voor verbluffende getijdenkrachten en nieuwe stervorming zorgt.',
        descSombrero: ' Het Sombrerostelsel ziet eruit als een Mexicaanse hoed! Het heeft een heldere kern, een uitzonderlijk grote centrale bol en een prominente stofbaan. Bevat 2.000 bolvormige sterrenhopen!',

        // Nevels
        descOrionNebula: ' De Orionnevel is een sterrencrèche waar nieuwe sterren geboren worden! Hij staat op 1.344 lichtjaar en is met het blote oog zichtbaar als een vaag vlekje in het zwaard van Orion. Bevat meer dan 3.000 sterren!',
        descCrabNebula: ' De Krabnevel is het overblijfsel van een supernova-explosie die Chinese astronomen in 1054 n.Chr. waarnamen! In het midden zit een pulsar die 30 keer per seconde roteert!',
        descRingNebula: ' De Ringnevel is een planetaire nevel — de gloeiende overblijfselen van een stervende zonachtige ster! De ster in het centrum heeft zijn buitenste lagen weggeblazen en zo deze prachtige ring gecreëerd.',

        // Sterrenbeelden
        descAries: ' Ram is het eerste teken van de dierenriem! Zoek naar de heldere sterren Hamal en Sheratan. In de Griekse mythologie vertegenwoordigt Ram de gouden ram die Phrixus en Helle redde.',
        descTaurus: ' Stier bevat de heldere rode ster Aldebaran, het oog van de stier! Ook de thuisbasis van de Pleiaden-sterrenhoop. In de mythologie veranderde Zeus in een stier om Europa te verleiden.',
        descGemini: ' Tweelingen heeft de heldere tweelingen Castor en Pollux! In de mythologie waren zij onafscheidelijke broers, de Dioscuren, bekend om hun band en dapperheid.',
        descCancer: ' Kreeft is zwak maar bevat de prachtige Bijenkorfcluster (M44)! In de mythologie was Kreeft de krab die Hera stuurde om Hercules af te leiden tijdens zijn gevecht.',
        descLeo: ' Leeuw heeft de heldere ster Regulus! De "Sikkel"-asterisme vormt het hoofd van de leeuw. In de mythologie vertegenwoordigt Leeuw de Nemeïsche Leeuw die door Hercules werd gedood.',
        descVirgo: ' Maagd is het op één na grootste sterrenbeeld! De heldere ster Spica stelt tarwe voor in de hand van de maagd. Thuisbasis van duizenden sterrenstelsels in de Virgo-cluster.',
        descLibra: ' Weegschaal stelt de weegschaal van de rechtvaardigheid voor! De helderste sterren zijn Zubenelgenubi en Zubeneschamali, wat "zuidelijke klauw" en "noordelijke klauw" betekent in het Arabisch.',
        descScorpius: ' Schorpioen stelt de schorpioen voor die Orion doodde in de Griekse mythologie! De heldere rode ster Antares markeert het hart van de schorpioen. Zoek de gebogen staart met angel!',
        descSagittarius: ' Schutter richt zijn pijl op het hart van Schorpioen! Het "Theepot"-asterisme is gemakkelijk te herkennen. Wijst naar het midden van onze Melkweg!',
        descCapricornus: ' Steenbok is een van de oudste sterrenbeelden! Stelt een wezen voor met het hoofd van een geit en de staart van een vis. In de Griekse mythologie geassocieerd met de god Pan.',
        descAquarius: ' Waterman stelt de waterdrager voor die uit zijn kan giet! Thuisbasis van verschillende beroemde deep-sky objecten waaronder de Helixnevel. Een van de oudst benoemde sterrenbeelden.',
        descPisces: ' Vissen toont twee vissen die aan elkaar vastgebonden zijn! Stelt Aphrodite en Eros voor die zich in vissen veranderden om het monster Typhon te ontvluchten. Bevat het lentepunt!',
        descOrion: ' Orion is een van de meest herkenbare sterrenbeelden! Zoek naar de drie sterren op een rij die de Gordel van Orion vormen. De heldere rode ster Betelgeuze markeert zijn schouder en blauwe Rigel zijn voet.',
        descUrsaMajor: ' De Grote Beer (Grote Steelpan) is een van de bekendste sterrenbeelden! De twee sterren aan het einde van de "bak" wijzen naar Polaris, de Poolster. Duizenden jaren gebruikt voor navigatie!',
        descUrsaMajorFull: ' Ursa Major (de Grote Beer) is het derde grootste sterrenbeeld aan de hemel! Het bevat het beroemde Steelpannetje dat de rug en staart van de beer vormt. Met 16 hoofdsterren die een berenvorm tekenen inclusief kop, lichaam en poten, wordt het al duizenden jaren door culturen wereldwijd herkend. Dubhe en Merak zijn de "aanwijssterren" die naar Polaris leiden!',
        descUrsaMinor: ' De Kleine Beer bevat Polaris, de Poolster! Polaris markeert het uiteinde van de steel van de Kleine Beer en staat bijna vast aan de noordelijke hemel. Essentieel voor hemelnavigatie!',
        descCrux: ' Het Zuiderkruis is het kleinste sterrenbeeld maar een van de bekendste op het zuidelijk halfrond! Gebruikt voor navigatie, wijst het naar de Zuidelijke Hemelpool.',
        descBigDipper: ' De Grote Steelpan is het meest herkenbare asterisme aan de noordelijke hemel! Zeven heldere sterren vormen een steelpanvorm — de "aanwijssterren" Dubhe en Merak aan het uiteinde van de bak wijzen recht naar Polaris, de Poolster. Duizenden jaren gebruikt voor navigatie!',
        descLittleDipper: ' De Kleine Beer bevat Polaris, de Poolster! Polaris markeert het uiteinde van de steel van de Kleine Beer en staat bijna vast aan de noordelijke hemel. Essentieel voor hemelnavigatie!',
        descSouthernCross: ' Het Zuiderkruis is het kleinste sterrenbeeld maar een van de bekendste op het zuidelijk halfrond! Gebruikt voor navigatie, wijst het naar de Zuidelijke Hemelpool.',
        descCassiopeia: ' Cassiopeia lijkt op een W of M afhankelijk van het seizoen! In de Griekse mythologie was Cassiopeia een ijdele koningin. Het sterrenbeeld is circumpolair op noordelijke breedtegraden.',
        descCygnus: ' Cygnus de Zwaan vliegt langs de Melkweg! Ook wel het Noordelijk Kruis genoemd. In de mythologie verkleedde Zeus zich als zwaan. Thuisbasis van veel deep-sky objecten!',
        descLyra: ' Lyra stelt de lier van Orpheus voor! Bevat Vega, de 5e helderste ster aan de nachtelijke hemel. Ook de thuisbasis van de Ringnevel, een beroemde planetaire nevel!',
        descAndromedaConst: ' Andromeda was de prinses die aan een rots werd geketend en door Perseus werd gered! Dit sterrenbeeld bevat het Andromedastelsel (M31), ons dichtstbijzijnde grote buursterrenstelsel!',
        descPerseus: ' Perseus de held die Medusa versloeg! Thuisbasis van de heldere ster Mirfak en de beroemde veranderlijke ster Algol ("Duivelster"). Bevat de Dubbelcluster!',
        descOrionsBelt: ' De Gordel van Orion is een van de meest herkenbare asterismen aan de nachtelijke hemel! Drie heldere sterren — Alnitak, Alnilam en Mintaka — vormen een bijna perfecte lijn. De oude Egyptenaren richtten de Grote Piramiden van Gizeh uit op deze drie sterren!',
        descCanisMajor: ' De Grote Hond is de thuisbasis van Sirius, de helderste ster aan de gehele nachtelijke hemel! Bekend als de "Hondsster" is Sirius door de hele geschiedenis belangrijk geweest. De oude Egyptenaren baseerden hun kalender op de opkomst ervan. Het sterrenbeeld stelt een van Orions jachthonden voor.',
        descAquila: ' Aquila de Adelaar zweeft langs de Melkweg! De helderste ster Altair voltooit de beroemde Zomerdriehoek samen met Vega (Lyra) en Deneb (Zwaan). Altair draait zo snel dat hij uitpuilt aan zijn evenaar! In de mythologie droeg Aquila de bliksemschichten van Zeus.',
        descPegasus: ' Pegasus het Gevleugelde Paard bevat het Grote Vierkant van Pegasus — een van de meest herkenbare sterrenpatronen van de herfst! In de Griekse mythologie ontspronk Pegasus uit Medusa toen Perseus haar versloeg. De ster Enif markeert de neus van het paard.',

        // Nabije sterren
        descSirius: ' Sirius is de helderste ster aan de aardenachtelijke hemel! Het is eigenlijk een dubbelster. Op 8,6 lichtjaar in het sterrenbeeld Grote Hond.',
        descBetelgeuse: ' Betelgeuze is een rode superreus die het einde van zijn leven nadert! Hij is zo groot dat het Mars zou voorbijsteken op de plek van onze Zon. Ooit zal hij als supernova exploderen!',
        descRigel: ' Rigel is een blauwe superreus, een van de meest lichtgevende sterren zichtbaar met het blote oog! Hij is 40.000 keer helderder dan onze Zon en staat op 860 lichtjaar.',
        descVega: ' Vega is een van de helderste sterren aan de noordelijke hemel! Het was 12.000 jaar geleden de Poolster en zal dat over 13.000 jaar opnieuw zijn door de precessie van de Aardas.',
        descPolaris: ' Polaris, de Poolster, heeft reizigers eeuwenlang geleid! Het is eigenlijk een driedubbel stersysteem en staat momenteel zeer dicht bij het ware noorden door de rotatie-as van de Aarde.',
        descAlphaCentauriA: ' Alpha Centauri A lijkt sterk op onze Zon! Het maakt deel uit van een driedubbel stersysteem dat ons dichtstbijzijnde sterrenbuur is op 4,37 lichtjaar. Met begeleider Alpha Centauri B draaien ze elke 80 jaar om elkaar.',
        descProximaCentauri: ' Proxima Centauri is een kleine rode dwergster en de dichtstbijzijnde ster bij ons zonnestelsel op slechts 4,24 lichtjaar! Hij is minder warm en minder helder dan onze Zon, maar heeft minstens twee planeten waaronder mogelijk bewoonbare Proxima Centauri b.',

        // Sterren met exoplaneten
        descKepler452Star: ' Kepler-452 is een zonachtige ster die het planeet "neefje van de Aarde", Kepler-452b, herbergt! Hij is 1,5 miljard jaar ouder dan onze Zon en 20% helderder. De ster staat op 1.400 lichtjaar in Cygnus.',
        descTrappist1Star: ' TRAPPIST-1 is een ultrakoele rode dwerg met 7 aardgrootte planeten! Drie ervan bevinden zich in de bewoonbare zone. Het hele systeem is zo compact dat alle 7 planeten dichter bij hun ster draaien dan Mercurius bij onze Zon.',
        descKepler186Star: ' Kepler-186 is een rode dwergster met 5 bekende planeten! Kepler-186f was de eerste aardgrote planeet ontdekt in de bewoonbare zone van een andere ster. De ster is koeler dan onze Zon, waardoor hij een oranje-rode gloed heeft.',

        // Exoplaneten
        descProximaCentauriB: ' Proxima Centauri b is de dichtstbijzijnde bekende exoplaneet bij de Aarde! Hij cirkelt in de bewoonbare zone van Proxima Centauri, wat betekent dat vloeibaar water op het oppervlak kan bestaan. Ontdekt in 2016, slechts 4,24 lichtjaar verwijderd.',
        descKepler452b: ' Kepler-452b wordt "het neefje van de Aarde" genoemd! Hij is ongeveer 60% groter dan de Aarde en cirkelt in de bewoonbare zone van een zonachtige ster. Zijn jaar duurt 385 dagen.',
        descTrappist1e: ' TRAPPIST-1e maakt deel uit van een verbazingwekkend stelsel met 7 aardgrootte planeten! Het cirkelt om een koele rode dwergster en ligt in de bewoonbare zone.',
        descKepler186f: ' Kepler-186f was de eerste aardgrootte planeet ontdekt in de bewoonbare zone van een andere ster! Het ontvangt ongeveer een derde van het licht dat de Aarde van de Zon krijgt.',

        // Dwergplaneten
        descCeres: ' Ceres is het grootste object in de asteroïdengordel en een dwergplaneet! De Dawn-ruimtesonde van NASA onthulde mysterieuze heldere vlekken in de Occatorkrater — het bleken zoutafzettingen van oud zout water te zijn.',
        descHaumea: ' Haumea draait zo snel (eens per 4 uur) dat hij is platgedrukt tot een eivorm! Hij heeft ook twee manen en een ringssysteem, waardoor hij uniek is onder de dwergplaneten.',
        descMakemake: ' Makemake is een heldere, roodachtige wereld in de Kuipergordel, ontdekt rond Pasen 2005, vernoemd naar de scheppingsgod van het Rapa Nui-volk van Paaseiland.',
        descEris: ' Eris is iets kleiner dan Pluto maar zwaarder! De ontdekking in 2005 leidde direct tot de herclassificatie van Pluto als dwergplaneet. Hij heeft één maan, Dysnomia.',
        descSedna: ' Sedna heeft een van de meest extreme elliptische banen in het zonnestelsel, van 76 tot 937 AE. Een omloop duurt ongeveer 11.400 jaar en hij is zo rood dat hij concurreert met Mars!',

        // Extra kometen
        descHyakutake: ' Komeet Hyakutake passeerde in 1996 extreem dichtbij de Aarde en was een van de helderste kometen in decennia met een staart die de halve hemel besloeg!',
        descLovejoy: ' Komeet Lovejoy (C/2011 W3) overleefde een nauwe passage door de corona van de Zon! Hij maakt deel uit van de Kreutz-zongrazer — fragmenten van een reuzenkomeet die eeuwen geleden uiteen is gevallen.',
        descEncke: ' Komeet Encke heeft de kortste omlooptijd van alle bekende kometen — slechts 3,3 jaar! Hij is vernoemd naar Johann Franz Encke die zijn baan in 1819 berekende.',
        descSwiftTuttle: ' Komeet Swift-Tuttle is het moederlichaam van de spectaculaire Perseïden-meteorenregen! Met een kern van 26 km is het het grootste object dat regelmatig in de buurt van de Aarde passeert.',

        // Asteroïdengordel / Kuipergordel / Oortwolk
        descAsteroidBelt: ' De asteroïdengordel bevat miljoenen rotsachtige objecten tussen Mars en Jupiter. Ceres, het grootste object hier, is een dwergplaneet! De meeste asteroïden zijn overgebleven materiaal van de vorming van het zonnestelsel 4,6 miljard jaar geleden.',
        descKuiperBelt: ' De Kuipergordel is een gebied voorbij Neptunus vol ijzige lichamen en dwergplaneten waaronder Pluto! Het is als een gigantische donut van bevroren objecten overgebleven van de vorming van het zonnestelsel. Kortperiodieke kometen komen hiervandaan!',
        descOortCloud: ' De Oortwolk is een uitgestrekte bolvormige schil van ijzige objecten die ons hele zonnestelsel omgeeft! Hij strekt zich uit van ongeveer 50.000 tot 200.000 AE van de Zon. Langperiodieke kometen zoals Hale-Bopp komen uit dit verre gebied.',

        // Wetenswaardigheden voor extra objecten
        funFactAsteroidBelt: 'In tegenstelling tot films zijn asteroïden heel ver van elkaar - ruimtevaartuigen kunnen er veilig doorheen vliegen!',
        funFactKuiperBelt: 'De Kuipergordel is 20 keer breder dan de asteroïdengordel en bevat miljarden objecten!',
        funFactOortCloud: 'De Oortwolk is zo ver weg dat licht van de Zon er meer dan 1,5 jaar over doet om de buitenrand te bereiken! Voyager 1 zou er zo\'n 300 jaar over doen om de binnenrand te bereiken.',
        funFactCeres: 'Ceres heeft mogelijk vloeibaar water onder het oppervlak - een topkandidaat voor leven!',
        funFactHaumea: 'Een rotatieperiode van ~4 uur geeft Haumea zijn unieke eivormige triaxiale ellipsoïdevorm!',
        funFactMakemake: 'Ontdekt rond Pasen 2005, is Makemake vernoemd naar de scheppingsgod van de Rapa Nui!',
        funFactEris: 'De ontdekking van Eris leidde er direct toe dat Pluto in 2006 werd herclassificeerd als dwergplaneet!',
        funFactSedna: 'Sedna doet er 11.400 jaar over om één baan te voltooien - mogelijk beïnvloed door een onzichtbare Planeet Negen!',
        funFactAlphaCentauriA: 'Alpha Centauri is zichtbaar vanuit het zuidelijk halfrond en is de op twee na helderste ster aan onze nachtelijke hemel!',
        funFactProximaCentauri: 'Ondanks dat Proxima onze dichtstbijzijnde ster is, is hij te zwak om met het blote oog te zien!',
        funFactSirius: 'Sirius beweegt eigenlijk steeds dichter naar ons toe - over ~60.000 jaar zal hij het dichtst bij zijn!',
        funFactBetelgeuse: 'Betelgeuze kan elk moment als supernova ontploffen (astronomisch gezien - morgen of over 100.000 jaar)!',
        funFactDefaultStar: 'Deze ster is met het blote oog zichtbaar vanaf de Aarde!',
        funFactOrionNebula: 'In de Orionnevel worden nu op dit moment nieuwe sterren geboren!',
        funFactCrabNebula: 'De pulsar in de Krabnevel draait 30 keer per seconde en breidt uit met 1.500 km/s!',
        funFactRingNebula: 'Planetaire nevels hebben niets met planeten te maken - ze zien er alleen maar rond uit als planeten door oude telescopen!',
        funFactAndromedaGalaxy: 'Het Andromedastelsel nadert ons met 110 km/s!',
        funFactWhirlpoolGalaxy: 'Je kunt het Wervelwindsterrenstelsel zien met een goede verrekijker!',
        funFactSombreroGalaxy: 'Ondanks miljarden sterren is ook het Sombrerostelsel grotendeels leeg!',
        funFactTrappist1Star: 'TRAPPIST-1 is vernoemd naar de telescoop die het ontdekte - The TRAnsiting Planets and PlanetesImals Small Telescope!',
        funFactKepler452Star: 'Kepler-452 is 6 miljard jaar oud - het laat zien hoe onze Zon er over 1,5 miljard jaar uitziet!',
        funFactKepler186Star: 'Planten op Kepler-186f zouden waarschijnlijk fotosynthetiseren met infrarood licht en donkerrood of zwart lijken!',
        funFactProximaCentauriB: 'Met de huidige technologie zou het 6.300 jaar duren om Proxima b te bereiken!',
        funFactKepler452b: 'Kepler-452b is 6 miljard jaar oud - 1,5 miljard jaar ouder dan de Aarde!',
        funFactTrappist1e: 'Vanuit TRAPPIST-1e zou je de andere planeten zo groot als onze Maan aan de hemel zien!',
        funFactKepler186f: 'Kepler-186f cirkelt om een rode dwerg, dus zijn lucht zou oranje-rood gloeien!',
        funFactComets: 'Kometen hebben twee staarten: een gebogen stofstaart (gelig) en een rechte ionenstaart (blauw) - beide wijzen altijd van de Zon af!',
        descOrcus: 'Orcus is een groot Kuipergordel-object in een 2:3-baanresonantie met Neptunus, net als Pluto. Het heeft een eigen maan genaamd Vanth.',
        funFactOrcus: 'Orcus wordt soms anti-Pluto genoemd — hun banen zijn bijna perfecte spiegelbeelden van elkaar aan tegenovergestelde kanten van de Zon!',
        descQuaoar: 'Quaoar is een groot Kuipergordel-object met zijn eigen maan Weywot. Opmerkelijk genoeg heeft het een ringsysteem — de eerste ring ooit ontdekt rond een Kuipergordel-object.',
        funFactQuaoar: 'De ring van Quaoar cirkelt ver voorbij zijn Roche-limiet, waar ringen niet zouden mogen bestaan — een mysterie dat ons begrip van ringvorming uitdaagt!',
        descGonggong: 'Gonggong (voorheen 2007 OR10) is een ver verstrooide schijfobject met een roodachtig oppervlak veroorzaakt door straling die methaanijs heeft aangetast. Het heeft een maan genaamd Xiangliu.',
        funFactGonggong: 'Gonggong is vernoemd naar een Chinese watergod die, volgens de mythe, de aarde deed kantelen door tegen een pijler te botsen die de hemel ondersteunde!',
        descSalacia: 'Salacia is een donker Kuipergordel-object met een maan genaamd Actaea. Het is een van de grootste trans-Neptuniaanse objecten die nog niet als dwergplaneet zijn geclassificeerd.',
        funFactSalacia: 'Salacia is vernoemd naar de Romeinse godin van de zee en vrouw van Neptunus — passend voor een ijzige wereld die in het rijk van de buitenste planeten omloopt!',
        descVarda: 'Varda is een binair Kuipergordel-object dat samen met zijn grote maan Ilmarë bestaat. Door hun wederzijdse baan te meten, kunnen wetenschappers de gecombineerde massa van het systeem nauwkeurig berekenen.',
        funFactVarda: 'Varda is vernoemd naar de Koningin der Sterren in de mythologie van Tolkien — de godheid die de sterren vormde en aan de hemel van Midden-aarde plaatste!',
        descVaruna: 'Varuna is een klassiek Kuipergordel-object dat bekendstaat om zijn extreem snelle rotatie — een volledige omwenteling in slechts 6,3 uur, een van de snelste in het buitenste zonnestelsel.',
        funFactVaruna: 'Varuna draait zo snel dat het bij de evenaar uitpuilt en de vorm heeft van een platgedrukte bal — zijn equatoriale diameter is merkbaar groter dan zijn polaire diameter!'
    },
    
    fr: {
        // Titre et en-tête de l'application
        appTitle: "Voyage Spatial",
        subtitle: "Système Solaire 3D Interactif",
        
        // Navigation
        quickNavigation: "Navigation",
        search: "Rechercher...",
        searchObjects: "🔍 Rechercher des objets...",
        
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
        pluto: "Pluton",
        charon: "Charon",
        enceladus: "Encelade",
        rhea: "Rhéa",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Triton",
        // Planètes naines
        ceres: 'Cérès', haumea: 'Hauméa', makemake: 'Makémaké', eris: 'Éris',
        orcus: 'Orcus', quaoar: 'Quaoar', gonggong: 'Gonggong', sedna: 'Sedna',
        salacia: 'Salacia', varda: 'Varda', varuna: 'Varuna',
        // Comètes
        halley: 'Comète de Halley', haleBopp: 'Hale-Bopp', hyakutake: 'Hyakutake',
        lovejoy: 'Lovejoy', encke: 'Encke', swiftTuttle: 'Swift-Tuttle',
        // Étoiles proches
        alphaCentauri: 'Alpha du Centaure',
        // Exoplanètes
        proximaB: 'Proxima du Centaure b', kepler452b: 'Kepler-452b',
        trappist1e: 'TRAPPIST-1e', kepler186f: 'Kepler-186f',
        // Autres constellations
        bigDipper: 'Grande Ourse', littleDipper: 'Petite Ourse', southernCross: 'Croix du Sud',
        orionsBelt: 'Ceinture d\'Orion', ursaMajor: 'Ursa Major',
        canisMajor: 'Grand Chien', aquila: 'Aigle', pegasus: 'Pégase',
        // Engins spatiaux
        iss: 'ISS', hubble: 'Hubble',
        jwst: 'Télescope spatial James-Webb', gpsNavstar: 'Satellite GPS (NAVSTAR)',
        voyager1: 'Voyager 1', voyager2: 'Voyager 2', newHorizons: 'New Horizons',
        juno: 'Juno (Jupiter)', cassini: 'Cassini (Saturne)', pioneer10: 'Pioneer 10', pioneer11: 'Pioneer 11',
        
        // Sections du menu de navigation
        navOurStar: "Notre Étoile",
        navInnerPlanets: "Planètes Intérieures (Rocheuses)",
        navAsteroidBelt: "Ceinture d'Astéroïdes",
        navOuterPlanets: "Planètes Extérieures (Géantes Gazeuses)",
        navIceGiants: "Géantes de Glace",
        navKuiperBelt: "Ceinture de Kuiper & Planètes Naines",
        navComets: "Comètes",
        navSatellites: "Satellites & Stations Spatiales",
        navSpacecraft: "Vaisseaux Spatiaux & Sondes",
        navDistantStars: "Étoiles Lointaines",
        kuiperBelt: "Ceinture de Kuiper",
        oortCloud: "Nuage d'Oort",
        asteroidBelt: "Ceinture d'Astéroïdes",
        // Nébuleuses
        orionNebula: "Nébuleuse d'Orion",
        crabNebula: 'Nébuleuse du Crabe',
        ringNebula: 'Nébuleuse de la Lyre',
        // Galaxies
        andromedaGalaxy: "Galaxie d'Andromède",
        whirlpoolGalaxy: 'Galaxie du Tourbillon',
        sombreroGalaxy: 'Galaxie du Sombrero',
        // Constellations
        aries: 'Bélier', taurus: 'Taureau', gemini: 'Gémeaux', cancer: 'Cancer',
        leo: 'Lion', virgo: 'Vierge', libra: 'Balance', scorpius: 'Scorpion',
        sagittarius: 'Sagittaire', capricornus: 'Capricorne', aquarius: 'Verseau',
        pisces: 'Poissons', orion: 'Orion', cassiopeia: 'Cassiopée',
        cygnus: 'Cygne', lyra: 'Lyre', andromeda: 'Andromède', andromedaConst: 'Andromède', perseus: 'Persée',
        // Étoiles proches & hôtes exoplanètes
        alphaCentauriA: 'Alpha Centauri A',
        proximaCentauri: 'Proxima Centauri',
        kepler452Star: 'Kepler-452',
        trappist1Star: 'TRAPPIST-1',
        kepler186Star: 'Kepler-186',
        plutoSystem: "Système Plutonien",
        outerSolarSystem: "Système Solaire Extérieur",
        comets: "Comètes",
        dwarfPlanets: "Planètes Naines & Candidats",
        constellationsZodiac: "Constellations (Zodiaque)",
        constellationsOther: "Constellations (Autres)",
        
        // Boutons de contrôle
        toggleOrbits: "Orbites",
        toggleConstellations: "Constellations",
        toggleScale: "Compact",
        toggleScaleRealistic: "Étendu",
        toggleScaleScientific: "Scientifique",
        toggleLabels: "Étiquettes DÉSACTIVÉES",
        toggleLabelsOn: "Étiquettes ACTIVÉES",
        toggleSoundOn: "Son ACTIVÉ",
        toggleSoundOff: "Son DÉSACTIVÉ",
        resetView: "Réinitialiser",
        enterVR: "Entrer en RV",
        enterAR: "Entrer en RA",
        randomDiscovery: "Découvrir",

        // Infobulles barre du bas
        tooltipOrbits: "Afficher/masquer les orbites (O)",
        tooltipConstellations: "Afficher/masquer les constellations (C)",
        tooltipLabels: "Basculer les étiquettes d'objets (D)",
        tooltipScale: "Parcourir les modes compact, étendu et scientifique (S)",
        tooltipSound: "Activer/désactiver les effets sonores",
        tooltipReset: "Réinitialiser la caméra (R)",
        tooltipDiscover: "Surprenez-moi ! Saut vers un objet aléatoire",
        tooltipHelp: "Afficher les commandes et fonctionnalités (H)",
        
        // Embarquement
        welcomeToSpace: "🚀 Bienvenue dans Voyage Spatial!",
        skip: "Passer",
        next: "Suivant",
        startExploring: "Commencer à explorer! 🌟",
        onboardingNav: "Naviguer dans l'Univers",
        onboardingNavDesc: "Faire glisser pour tourner • Faire défiler pour zoomer • Clic droit pour déplacer",
        onboardingExplore: "Explorer les Objets",
        onboardingExploreDesc: "Cliquez sur une planète, une lune ou une étoile pour apprendre des faits fascinants!",
        onboardingQuickNav: "Navigation Rapide",
        onboardingQuickNavDesc: "Utilisez le menu déroulant pour accéder directement à n'importe quel objet",
        
        // Gestes mobiles
        pinchToZoom: "Pincer pour zoomer",
        dragToRotate: "Faire glisser pour tourner",
        
        // Chargement
        preparingJourney: "Préparation de votre voyage spatial...",
        defaultFact: "Le Soleil contient 99,86% de la masse du Système Solaire !",
        
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
        install: "Installer",
        installLater: "Peut-être Plus Tard",
        notNow: "Pas Maintenant",
        offlineMode: "Vous êtes hors ligne",
        update: "Mettre à jour",
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
        typeComet: 'Comète',
        typeAsteroidBelt: 'Ceinture d\'Astéroïdes',
        typeKuiperBelt: 'Ceinture de Kuiper',
        typeOortCloud: 'Nuage d\'Oort',
        typeConstellation: 'Constellation',
        typeExoplanet: 'Exoplanète',
        typeDistantStar: 'Étoile Lointaine',
        typeSatellite: 'Satellite',
        typeProbe: 'Sonde Spatiale',
        typeOrbiter: 'Orbiteur',
        typeObservatory: 'Observatoire Spatial',
        
        // Descriptions d'objets
        descSun: 'Le Soleil est une étoile de type G (naine jaune) contenant 99,86% de la masse du Système Solaire. Température de surface: 5 778 K. Âge: 4,6 milliards d\'années. Il fusionne 600 millions de tonnes d\'hydrogène en hélium chaque seconde!',
        descMercury: 'Mercure est la plus petite planète et la plus proche du Soleil. Sa surface est couverte de cratères comme notre Lune. La température varie de -180°C la nuit à 430°C le jour - la plus grande variation de température du système solaire!',
        descVenus: 'Vénus est la planète la plus chaude avec une température de surface de 465°C due à un effet de serre extrême. Son atmosphère est composée à 96% de CO2 avec des nuages d\'acide sulfurique. Vénus tourne à l\'envers et n\'a pas de lunes - l\'une des deux seules planètes sans!',
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
        creatingOortCloud: 'Création du nuage d\'Oort...',
        creatingStarfield: 'Création du champ d\'étoiles...',
        creatingMilkyWay: 'Création de la Voie lactée...',
        creatingOrbitalPaths: 'Création des trajectoires orbitales...',
        creatingConstellations: 'Création des constellations...',
        creatingDistantStars: 'Création des étoiles lointaines...',
        creatingNebulae: 'Création des nébuleuses...',
        creatingGalaxies: 'Création des galaxies...',
        creatingNearbyStars: 'Création des étoiles proches...',
        creatingExoplanets: 'Création des exoplanètes...',
        creatingComets: 'Création des comètes...',
        creatingDwarfPlanets: 'Création des planètes naines...',
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
        descPluto: '🪐 Pluton est une planète naine dans la ceinture de Kuiper. Elle a un glacier en forme de cœur (Tombaugh Regio), des montagnes de glace d\'eau et cinq lunes. Pluton et sa plus grande lune Charon sont verrouillés par marée - ils montrent toujours la même face l\'un à l\'autre!',
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
        descISS: 'L\'ISS orbite à 400 km d\'altitude, complétant une orbite toutes les 92,68 minutes (15,54 orbites/jour). Lancée le 20 nov 1998 (module Zarya). Assemblage: 1998-2011 (42 vols: 36 Navette, 6 Russes). Masse: 419 725 kg. Volume pressurisé: 1 000 m³. Occupation continue depuis le 2 nov 2000 (24+ ans, 9 000+ jours). 280+ astronautes de 23 pays ont visité.',
        funFactISS: 'L\'ISS voyage à 27 600 km/h! Les astronautes voient 16 levers/couchers de soleil par jour. Elle est continuellement occupée depuis 24+ ans - plus longtemps que tout autre vaisseau spatial!',
        descHubble: 'Lancé le 24 avril 1990 par la navette Discovery. Orbite à ~535 km d\'altitude. A effectué 1,6+ million d\'observations en oct 2025. Miroir primaire de 2,4m observe UV, visible et proche IR. Cinq missions de maintenance (1993-2009) ont amélioré les instruments.',
        funFactHubble: 'Peut résoudre des objets séparés de 0,05 secondes d\'arc - comme voir deux lucioles à 10 000 km! L\'image la plus profonde (eXtreme Deep Field) montre 5 500 galaxies, certaines à 13,2 milliards d\'années-lumière.',
        descGPS: 'Constellation GPS (NAVSTAR): 31 satellites opérationnels (oct 2025) sur 6 plans orbitaux, inclinaison 55°. Chaque satellite orbite à 20 180 km d\'altitude. Émet des signaux bande L (1,2-1,5 GHz). Horloges atomiques rubidium/césium précises à 10⁻¹⁴ secondes.',
        funFactGPS: 'Besoin de 4 satellites pour une position 3D (trilatération + correction d\'horloge). Le système fournit une précision de 5-10m. Le signal militaire (code P/Y) est précis au centimètre!',
        descJWST: 'Lancé le 25 déc 2021. Atteint le point L2 le 24 jan 2022. Premières images publiées le 12 juil 2022. Observe l\'infrarouge (0,6-28,5 μm). Miroir segmenté en béryllium de 6,5m (18 hexagones) avec 25 m² de surface collectrice - 6x Hubble! Bouclier solaire: 21,2m × 14,2m, 5 couches.',
        funFactJWST: 'Fonctionne à -233°C (-388°F)! Peut détecter la signature thermique d\'un bourdon à distance lunaire. A découvert les galaxies les plus anciennes à z=14 (280 millions d\'années après le Big Bang).',
        
        // Descriptions et faits des vaisseaux spatiaux
        descVoyager1: 'Voyager 1 est l\'objet fait par l\'homme le plus éloigné de la Terre! Lancée le 5 sept 1977, elle est entrée dans l\'espace interstellaire le 25 août 2012. Actuellement à 24,3 milliards de km (162 UA) du Soleil. Elle transporte le Disque d\'Or avec des sons et images de la Terre.',
        funFactVoyager1: 'Voyager 1 voyage à 17 km/s (61 200 km/h). Ses signaux radio mettent 22,5 heures pour atteindre la Terre!',
        descVoyager2: 'Voyager 2 est le seul vaisseau spatial à avoir visité les quatre planètes géantes! Jupiter (juil 1979), Saturne (août 1981), Uranus (jan 1986), Neptune (août 1989). Entrée dans l\'espace interstellaire le 5 nov 2018. Maintenant à 20,3 milliards de km (135 UA) du Soleil.',
        funFactVoyager2: 'Voyager 2 a découvert 16 lunes parmi les planètes géantes, la Grande Tache Sombre de Neptune et les geysers de Triton!',
        descNewHorizons: 'New Horizons nous a donné les premières images rapprochées de Pluton le 14 juillet 2015! Il a révélé des montagnes de glace d\'eau jusqu\'à 3 500m de haut, de vastes glaciers d\'azote et la célèbre Tombaugh Regio en forme de cœur. Maintenant à 59 UA du Soleil, explorant la ceinture de Kuiper.',
        funFactNewHorizons: 'New Horizons a voyagé 9,5 ans et 5 milliards de km pour atteindre Pluton à 58 536 km/h. Il transporte 28g des cendres de Clyde Tombaugh!',
        descJuno: 'Juno est entrée en orbite autour de Jupiter le 4 juillet 2016. Étudie la composition, le champ gravitationnel, le champ magnétique et les aurores polaires. A découvert que le noyau de Jupiter est plus grand et "flou", des cyclones polaires massifs et la distribution d\'ammoniac atmosphérique. Mission prolongée depuis 2021.',
        funFactJuno: 'Premier vaisseau spatial à énergie solaire vers Jupiter! Trois panneaux solaires de 9m génèrent 500W. Transporte trois figurines LEGO: Galilée, Jupiter et Junon!',
        descCassini: 'Cassini a orbité Saturne du 30 juin 2004 au 15 sept 2017 (13 ans). A découvert des lacs de méthane/éthane liquide sur Titan, des geysers d\'eau sur Encelade, de nouveaux anneaux, 7 nouvelles lunes. La sonde Huygens a atterri sur Titan le 14 jan 2005. S\'est terminée par une entrée atmosphérique "Grand Finale".',
        funFactCassini: 'A découvert l\'océan souterrain d\'Encelade! Les geysers d\'eau projettent 250kg/s dans l\'espace. Cassini a traversé les panaches, détecté H2, composés organiques - ingrédients de la vie!',
        descPioneer10: 'Pioneer 10 fut le premier vaisseau spatial à traverser la ceinture d\'astéroïdes et à visiter Jupiter (3 déc 1973)! Lancée le 2 mars 1972, elle portait la célèbre plaque Pioneer montrant les humains et la localisation de la Terre. Dernier contact: 23 jan 2003 à 12,2 milliards de km.',
        funFactPioneer10: 'Pioneer 10 porte une plaque dorée conçue par Carl Sagan montrant un homme, une femme et la localisation de la Terre - un message pour les extraterrestres qui pourraient la trouver!',
        descPioneer11: 'Pioneer 11 fut le premier vaisseau spatial à visiter Saturne (1er sept 1979)! A aussi survolé Jupiter (3 déc 1974). Lancée le 5 avril 1973, elle a découvert l\'anneau F de Saturne et une nouvelle lune. Porte aussi la plaque Pioneer. Dernier contact: 24 nov 1995 à 6,5 milliards de km.',
        funFactPioneer11: 'Pioneer 11 a utilisé la gravité de Jupiter pour une audacieuse assistance gravitationnelle, économisant des années de voyage vers Saturne!',
        
        // Descriptions des comètes
        descHalley: 'La comète de Halley est la plus célèbre! Elle revient près de la Terre tous les 75-76 ans. Vue pour la dernière fois en 1986, elle reviendra en 2061. Quand vous la voyez, vous observez une boule de neige cosmique vieille de 4,6 milliards d\'années!',
        descHaleBopp: 'Hale-Bopp fut l\'une des comètes les plus brillantes du 20e siècle, visible à l\'œil nu pendant 18 mois en 1996-1997! Son noyau est exceptionnellement grand avec 40 km de diamètre.',
        descNeowise: 'La comète NEOWISE fut un spectacle spectaculaire en juillet 2020! Elle ne reviendra pas avant environ 6 800 ans. Les comètes sont des "boules de neige sales" composées de glace, poussière et roche de la formation du système solaire.',

        // Galaxies
        descAndromeda: ' La galaxie d\'Andromède est notre plus proche grande voisine galactique, à 2,5 millions d\'années-lumière! Elle contient 1 billion d\'étoiles et est en route de collision avec la Voie lactée (pas d\'inquiétude, collision dans 4,5 milliards d\'années).',
        descWhirlpool: ' La galaxie du Tourbillon (M51) est célèbre pour ses beaux bras spiraux! Elle interagit avec une galaxie compagne plus petite, créant de magnifiques forces de marée et une nouvelle formation d\'étoiles.',
        descSombrero: ' La galaxie du Sombrero ressemble à un chapeau mexicain! Elle a un noyau lumineux, un renflement central exceptionnellement grand et une lane de poussière proéminente. Contient 2 000 amas globulaires!',

        // Nébuleuses
        descOrionNebula: ' La nébuleuse d\'Orion est une pépinière stellaire où de nouvelles étoiles naissent! Elle est à 1 344 années-lumière et est visible à l\'œil nu comme une tache floue dans l\'épée d\'Orion. Contient plus de 3 000 étoiles!',
        descCrabNebula: ' La nébuleuse du Crabe est le vestige d\'une explosion de supernova observée par des astronomes chinois en 1054 après J.-C.! En son centre se trouve un pulsar tournant 30 fois par seconde!',
        descRingNebula: ' La nébuleuse de l\'Anneau est une nébuleuse planétaire — les restes lumineux d\'une étoile mourante semblable au Soleil! L\'étoile en son centre a soufflé ses couches externes, créant ce magnifique anneau.',

        // Constellations
        descAries: ' Le Bélier est le premier signe du zodiaque! Repérez les étoiles brillantes Hamal et Sheratan. Dans la mythologie grecque, le Bélier représente le bélier d\'or qui sauva Phrixus et Hellé.',
        descTaurus: ' Le Taureau contient la brillante étoile rouge Aldébaran, l\'œil du taureau! Aussi demeure des Pléiades. Dans la mythologie, Zeus se transforma en taureau pour séduire Europe.',
        descGemini: ' Les Gémeaux ont les brillants jumeaux Castor et Pollux! Dans la mythologie, ils étaient des frères inséparables, les Dioscures, connus pour leur lien et leur bravoure.',
        descCancer: ' Le Cancer est faible mais contient le beau Cluster de la Ruche (M44)! Dans la mythologie, le Cancer était le crabe envoyé par Héra pour distraire Hercule pendant son combat.',
        descLeo: ' Le Lion a l\'étoile brillante Régulus! L\'astérisme de la "Faucille" forme la tête du lion. Dans la mythologie, le Lion représente le lion de Némée tué par Hercule.',
        descVirgo: ' La Vierge est la deuxième plus grande constellation! L\'étoile brillante Spica représente du blé dans la main de la vierge. Demeure de milliers de galaxies dans l\'amas de la Vierge.',
        descLibra: ' La Balance représente les balances de la justice! Ses étoiles les plus brillantes sont Zubenelgenubi et Zubeneschamali, signifiant "griffe du sud" et "griffe du nord" en arabe.',
        descScorpius: ' Le Scorpion représente le scorpion qui tua Orion dans la mythologie grecque! L\'étoile rouge brillante Antarès marque le cœur du scorpion. Cherchez la queue courbée avec le dard!',
        descSagittarius: ' Le Sagittaire pointe sa flèche vers le cœur du Scorpion! L\'astérisme de la "Théière" est facile à repérer. Pointe vers le centre de notre galaxie Voie lactée!',
        descCapricornus: ' Le Capricorne est l\'une des plus anciennes constellations! Représente une créature avec la tête d\'une chèvre et la queue d\'un poisson. Associé au dieu Pan dans la mythologie grecque.',
        descAquarius: ' Le Verseau représente le porteur d\'eau versant de son urne! Demeure de plusieurs objets du ciel profond célèbres dont la nébuleuse Hélix. L\'une des constellations nommées les plus anciennes.',
        descPisces: ' Les Poissons montrent deux poissons attachés ensemble! Représente Aphrodite et Éros qui se transformèrent en poissons pour échapper au monstre Typhon. Contient le point équinoxial vernal!',
        descOrion: ' Orion est l\'une des constellations les plus reconnaissables! Cherchez les trois étoiles en ligne formant la Ceinture d\'Orion. La brillante étoile rouge Bételgeuse marque son épaule, et le bleu Rigel marque son pied.',
        descUrsaMajor: ' La Grande Ourse (Grande Casserole) est l\'une des constellations les plus connues! Les deux étoiles au bout de la "tasse" pointent vers Polaris, l\'Étoile Polaire. Utilisée pour la navigation depuis des millénaires!',
        descUrsaMajorFull: ' Ursa Major (la Grande Ourse) est la troisième plus grande constellation du ciel! Elle contient le célèbre astérisme de la Grande Casserole qui forme le dos et la queue de l\'ours. Avec 16 étoiles principales traçant une forme d\'ours incluant tête, corps et pattes, elle est reconnue par les cultures du monde entier depuis des millénaires. Dubhe et Merak sont les "étoiles pointeuses" qui mènent à Polaris!',
        descUrsaMinor: ' La Petite Ourse contient Polaris, l\'Étoile Polaire! Polaris marque l\'extrémité du manche de la Petite Ourse et reste presque fixe dans le ciel du nord. Essentielle pour la navigation céleste!',
        descCrux: ' La Croix du Sud est la plus petite constellation mais l\'une des plus célèbres dans l\'hémisphère sud! Utilisée pour la navigation, elle pointe vers le pôle céleste sud.',
        descBigDipper: ' La Grande Casserole est l\'astérisme le plus reconnu du ciel nord! Sept étoiles brillantes forment une louche — les "étoiles pointeuses" Dubhe et Merak au bout de la tasse visent droit vers Polaris, l\'Étoile Polaire. Utilisée pour la navigation depuis des millénaires!',
        descLittleDipper: ' La Petite Ourse contient Polaris, l\'Étoile Polaire! Polaris marque l\'extrémité du manche de la Petite Ourse et reste presque fixe dans le ciel du nord. Essentielle pour la navigation céleste!',
        descSouthernCross: ' La Croix du Sud est la plus petite constellation mais l\'une des plus célèbres dans l\'hémisphère sud! Utilisée pour la navigation, elle pointe vers le pôle céleste sud.',
        descCassiopeia: ' Cassiopée ressemble à un W ou M selon la saison! Dans la mythologie grecque, Cassiopée était une reine vaniteuse. La constellation est circumpolaire aux latitudes nord.',
        descCygnus: ' Cygnus le Cygne vole le long de la Voie lactée! Aussi appelé la Croix du Nord. Dans la mythologie, Zeus se déguisa en cygne. Demeure de nombreux objets du ciel profond!',
        descLyra: ' La Lyre représente la lyre d\'Orphée! Contient Véga, la 5e étoile la plus brillante dans le ciel nocturne. Aussi demeure de la nébuleuse de l\'Anneau, une célèbre nébuleuse planétaire!',
        descAndromedaConst: ' Andromède était la princesse enchaînée à un rocher et sauvée par Persée! Cette constellation contient la galaxie d\'Andromède (M31), notre plus proche grande galaxie voisine!',
        descPerseus: ' Persée le héros qui tua Méduse! Demeure de l\'étoile brillante Mirfak et de la célèbre étoile variable Algol ("Étoile Démon"). Contient le Double Amas!',
        descOrionsBelt: ' La Ceinture d\'Orion est l\'un des astérismes les plus reconnaissables du ciel nocturne! Trois étoiles brillantes — Alnitak, Alnilam et Mintaka — forment une ligne presque parfaite. Les anciens Égyptiens ont aligné les grandes pyramides de Gizeh pour refléter ces trois étoiles!',
        descCanisMajor: ' Le Grand Chien abrite Sirius, l\'étoile la plus brillante du ciel nocturne! Connue comme l\'"Étoile du Chien," Sirius a été importante pour les civilisations à travers l\'histoire. Les anciens Égyptiens basèrent leur calendrier sur son lever. La constellation représente l\'un des chiens de chasse d\'Orion.',
        descAquila: ' Aquila l\'Aigle plane le long de la Voie lactée! Son étoile la plus brillante Altaïr complète le fameux Triangle d\'été avec Véga (Lyre) et Deneb (Cygne). Altaïr tourne si vite qu\'elle se renfle à son équateur! Dans la mythologie, Aquila portait les foudres de Zeus.',
        descPegasus: ' Pégase le Cheval Ailé arbore le Grand Carré de Pégase — l\'un des motifs stellaires les plus reconnaissables de l\'automne! Dans la mythologie grecque, Pégase jaillit de Méduse quand Persée la tua. L\'étoile Enif marque le nez du cheval.',

        // Étoiles proches
        descSirius: ' Sirius est l\'étoile la plus brillante du ciel nocturne terrestre! C\'est en fait un système binaire. Situé à 8,6 années-lumière dans la constellation du Grand Chien.',
        descBetelgeuse: ' Bételgeuse est une supergéante rouge en fin de vie! Elle est si grande que si elle était placée à la position de notre Soleil, elle s\'étendrait au-delà de Mars. Elle explosera un jour en supernova!',
        descRigel: ' Rigel est une supergéante bleue, l\'une des étoiles les plus lumineuses visibles à l\'œil nu! Elle est 40 000 fois plus lumineuse que notre Soleil et est à 860 années-lumière.',
        descVega: ' Véga est l\'une des étoiles les plus brillantes du ciel du nord! Elle était l\'Étoile Polaire il y a 12 000 ans et le sera à nouveau dans 13 000 ans en raison de la précession axiale de la Terre.',
        descPolaris: ' Polaris, l\'Étoile Polaire, a guidé les voyageurs pendant des siècles! C\'est en fait un système triple d\'étoiles et est actuellement très proche du vrai nord.',
        descAlphaCentauriA: ' Alpha Centauri A est très similaire à notre Soleil! Elle fait partie d\'un système triple d\'étoiles qui est notre voisin stellaire le plus proche à 4,37 années-lumière. Avec son compagnon Alpha Centauri B, ils s\'orbitent mutuellement toutes les 80 ans.',
        descProximaCentauri: ' Proxima du Centaure est une petite étoile naine rouge et l\'étoile la plus proche de notre Système solaire à seulement 4,24 années-lumière! Elle est bien plus froide et moins brillante que notre Soleil, mais elle a au moins deux planètes, dont potentiellement habitable Proxima Centauri b.',

        // Étoiles avec exoplanètes
        descKepler452Star: ' Kepler-452 est une étoile semblable au Soleil qui héberge la planète "cousine de la Terre" Kepler-452b! Elle est 1,5 milliard d\'années plus âgée que notre Soleil et 20% plus brillante.',
        descTrappist1Star: ' TRAPPIST-1 est une naine rouge ultra-froide avec 7 planètes de la taille de la Terre! Trois d\'entre elles sont dans la zone habitable. Tout le système est si compact que les 7 planètes orbitent plus près de leur étoile que Mercure de notre Soleil.',
        descKepler186Star: ' Kepler-186 est une étoile naine rouge avec 5 planètes connues! Kepler-186f est la première planète de la taille de la Terre découverte dans la zone habitable d\'une autre étoile. L\'étoile est plus froide que notre Soleil, lui donnant une teinte orange-rouge.',

        // Exoplanètes
        descProximaCentauriB: ' Proxima Centauri b est l\'exoplanète connue la plus proche de la Terre! Elle orbite dans la zone habitable de Proxima du Centaure, ce qui signifie que l\'eau liquide pourrait exister à sa surface.',
        descKepler452b: ' Kepler-452b est appelée "la cousine de la Terre"! Elle est environ 60% plus grande que la Terre et orbite une étoile semblable au Soleil dans la zone habitable. Son année dure 385 jours.',
        descTrappist1e: ' TRAPPIST-1e fait partie d\'un système incroyable avec 7 planètes de la taille de la Terre! Elle orbite une naine rouge froide et est dans la zone habitable.',
        descKepler186f: ' Kepler-186f était la première planète de la taille de la Terre découverte dans la zone habitable d\'une autre étoile! Elle reçoit environ un tiers de la lumière que la Terre reçoit du Soleil.',

        // Planètes naines
        descCeres: ' Cérès est le plus grand objet de la ceinture d\'astéroïdes et une planète naine! La sonde Dawn de la NASA a révélé de mystérieuses taches brillantes dans le cratère Occator — il s\'est avéré que c\'était des dépôts de sel d\'anciennes saumures.',
        descHaumea: ' Hauméa tourne si vite (une fois toutes les 4 heures) qu\'elle a été aplatie en forme d\'œuf! Elle possède également deux lunes et un système d\'anneaux, la rendant très inhabituelle parmi les planètes naines.',
        descMakemake: ' Makemake est un monde brillant et rougeâtre dans la Ceinture de Kuiper découvert près de Pâques 2005, nommé d\'après le dieu créateur du peuple Rapa Nui de l\'île de Pâques.',
        descEris: ' Éris est légèrement plus petite que Pluton mais plus massive! Sa découverte en 2005 a directement conduit à la reclassification de Pluton en planète naine. Elle a une lune, Dysnomia.',
        descSedna: ' Sedna a l\'une des orbites elliptiques les plus extrêmes du système solaire, allant de 76 à 937 UA. Elle met environ 11 400 ans à compléter une orbite et est si rouge qu\'elle rivalise avec Mars en couleur!',

        // Comètes supplémentaires
        descHyakutake: ' La comète Hyakutake est passée extrêmement près de la Terre en 1996, devenant l\'une des comètes les plus brillantes des dernières décennies avec une queue traversant la moitié du ciel!',
        descLovejoy: ' La comète Lovejoy (C/2011 W3) a survécu à un passage proche à travers la couronne du Soleil! Elle fait partie des raseurs de Soleil Kreutz — fragments d\'une géante comète qui s\'est fragmentée il y a des siècles.',
        descEncke: ' La comète Encke a la période orbitale la plus courte de toutes les comètes connues — seulement 3,3 ans! Elle est nommée d\'après Johann Franz Encke qui a calculé son orbite en 1819.',
        descSwiftTuttle: ' La comète Swift-Tuttle est le corps parent du spectaculaire essaim de météores des Perséides! Avec un noyau de 26 km, c\'est le plus grand objet qui passe régulièrement près de la Terre.',

        // Ceinture d\'astéroïdes / Ceinture de Kuiper / Nuage de Oort
        descAsteroidBelt: ' La ceinture d\'astéroïdes contient des millions d\'objets rocheux entre Mars et Jupiter. Cérès, le plus grand objet ici, est une planète naine! La plupart des astéroïdes sont des matériaux résiduels de la formation du système solaire il y a 4,6 milliards d\'années.',
        descKuiperBelt: ' La Ceinture de Kuiper est une région au-delà de Neptune remplie de corps glacés et de planètes naines dont Pluton! C\'est comme un gigantesque beignet d\'objets gelés restants de la formation du système solaire. Les comètes à courte période viennent d\'ici!',
        descOortCloud: ' Le nuage de Oort est une vaste enveloppe sphérique d\'objets glacés entourant tout notre système solaire! Il s\'étend d\'environ 50 000 à 200 000 UA du Soleil. Les comètes à longue période comme Hale-Bopp proviennent de ce domaine lointain.',

        // Faits amusants pour les objets supplémentaires
        funFactAsteroidBelt: 'Contrairement aux films, les astéroïdes sont très éloignés - les sondes spatiales peuvent les traverser sans danger!',
        funFactKuiperBelt: 'La ceinture de Kuiper est 20 fois plus large que la ceinture d\'astéroïdes et contient des milliards d\'objets!',
        funFactOortCloud: 'Le nuage de Oort est si loin que la lumière du Soleil met plus d\'1,5 an pour atteindre sa lisière externe! Voyager 1 mettrait environ 300 ans pour atteindre la lisière interne.',
        funFactCeres: 'Cérès pourrait abriter de l\'eau liquide souterraine - un candidat de premier plan pour la vie!',
        funFactHaumea: 'Une période de rotation de ~4 heures donne à Hauméa sa forme unique d\'ellipsoïde triaxial en œuf!',
        funFactMakemake: 'Découverte près de Pâques 2005, Makemake est nommée d\'après le dieu créateur du peuple Rapa Nui!',
        funFactEris: 'La découverte d\'Éris a directement conduit à la reclassification de Pluton en planète naine en 2006!',
        funFactSedna: 'Sedna met 11 400 ans pour compléter une orbite - peut-être influencée par une Planète Neuf invisible!',
        funFactAlphaCentauriA: 'Alpha du Centaure est visible depuis l\'hémisphère sud et est la troisième étoile la plus brillante de notre ciel nocturne!',
        funFactProximaCentauri: 'Bien qu\'elle soit l\'étoile la plus proche, Proxima est trop faible pour être vue à l\'œil nu!',
        funFactSirius: 'Sirius se rapproche en réalité de nous - elle sera à sa distance minimale dans environ 60 000 ans!',
        funFactBetelgeuse: 'Bételgeuse pourrait exploser en supernova à tout moment (dans le sens astronomique - demain ou dans 100 000 ans)!',
        funFactDefaultStar: 'Cette étoile est visible à l\'œil nu depuis la Terre!',
        funFactOrionNebula: 'De nouvelles étoiles naissent en ce moment même dans la nébuleuse d\'Orion!',
        funFactCrabNebula: 'Le pulsar de la nébuleuse du Crabe tourne 30 fois par seconde et s\'étend à 1 500 km/s!',
        funFactRingNebula: 'Les nébuleuses planétaires n\'ont rien à voir avec les planètes - elles ressemblent juste à des planètes rondes à travers les vieux télescopes!',
        funFactAndromedaGalaxy: 'La galaxie d\'Andromède s\'approche de nous à 110 km/s!',
        funFactWhirlpoolGalaxy: 'Vous pouvez voir la galaxie du Tourbillon avec une bonne paire de jumelles!',
        funFactSombreroGalaxy: 'Malgré des milliards d\'étoiles, la galaxie du Sombrero est aussi surtout de l\'espace vide!',
        funFactTrappist1Star: 'TRAPPIST-1 est nommé d\'après le télescope qui l\'a découvert - The TRAnsiting Planets and PlanetesImals Small Telescope!',
        funFactKepler452Star: 'Kepler-452 a 6 milliards d\'années - elle nous montre à quoi pourrait ressembler notre Soleil dans 1,5 milliard d\'années!',
        funFactKepler186Star: 'Les plantes sur Kepler-186f effectueraient probablement la photosynthèse avec la lumière infrarouge et paraîtraient rouge foncé ou noires!',
        funFactProximaCentauriB: 'Avec la technologie actuelle, il faudrait 6 300 ans pour atteindre Proxima b!',
        funFactKepler452b: 'Kepler-452b a 6 milliards d\'années - 1,5 milliard de plus que la Terre!',
        funFactTrappist1e: 'Depuis TRAPPIST-1e, vous pourriez voir les autres planètes aussi grandes que notre Lune dans le ciel!',
        funFactKepler186f: 'Kepler-186f orbite autour d\'une naine rouge, donc son ciel brillerait d\'orange-rouge!',
        funFactComets: 'Les comètes ont deux queues: une queue de poussière courbée (jaunâtre) et une queue ionique droite (bleue) - les deux pointent toujours à l\'opposé du Soleil!',
        descOrcus: 'Orcus est un grand objet de la Ceinture de Kuiper en résonance orbitale 2:3 avec Neptune, tout comme Pluton. Il possède sa propre lune nommée Vanth.',
        funFactOrcus: 'Orcus est parfois appelé l\'anti-Pluton — leurs orbites sont presque des images miroir parfaites de l\'une de l\'autre, de part et d\'autre du Soleil!',
        descQuaoar: 'Quaoar est un grand objet de la Ceinture de Kuiper avec sa propre lune Weywot. Il possède remarquablement un système d\'anneaux — le premier jamais découvert autour d\'un objet de la Ceinture de Kuiper.',
        funFactQuaoar: 'L\'anneau de Quaoar orbite bien au-delà de sa limite de Roche, là où les anneaux ne devraient pas pouvoir exister — un mystère qui remet en question notre compréhension de la formation des anneaux!',
        descGonggong: 'Gonggong (anciennement 2007 OR10) est un objet lointain du disque dispersé avec une surface rougeâtre causée par de la glace de méthane altérée par les radiations. Il possède une lune appelée Xiangliu.',
        funFactGonggong: 'Gonggong est nommé d\'après un dieu de l\'eau chinois qui, selon la mythologie, a incliné la Terre en percutant un pilier soutenant le ciel!',
        descSalacia: 'Salacia est un objet sombre de la Ceinture de Kuiper avec une lune nommée Actaea. C\'est l\'un des plus grands objets trans-neptuniens qui n\'a pas encore été classé comme planète naine.',
        funFactSalacia: 'Salacia est nommée d\'après la déesse romaine de la mer et épouse de Neptune — approprié pour un monde glacé orbitant dans le royaume des planètes les plus éloignées!',
        descVarda: 'Varda est un objet binaire de la Ceinture de Kuiper associé à sa grande lune Ilmarë. En mesurant leur orbite mutuelle, les scientifiques peuvent calculer précisément la masse combinée du système.',
        funFactVarda: 'Varda est nommée d\'après la Reine des Étoiles dans la mythologie de Tolkien — la divinité qui a façonné les étoiles et les a placées dans le ciel de la Terre du Milieu!',
        descVaruna: 'Varuna est un objet classique de la Ceinture de Kuiper connu pour sa rotation extrêmement rapide — effectuant un tour complet en seulement 6,3 heures, l\'une des plus rapides du système solaire externe.',
        funFactVaruna: 'Varuna tourne si vite qu\'il se renfle à l\'équateur, lui donnant la forme d\'une balle aplatie — son diamètre équatorial est sensiblement plus grand que son diamètre polaire!'
    },
    
    de: {
        // App-Titel und Kopfzeile
        appTitle: "Weltraumreise",
        subtitle: "Interaktives 3D-Sonnensystem",
        
        // Navigation
        quickNavigation: "Navigation",
        search: "Suchen...",
        searchObjects: "🔍 Objekte suchen...",
        
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
        // Zwergplaneten
        ceres: 'Ceres', haumea: 'Haumea', makemake: 'Makemake', eris: 'Eris',
        orcus: 'Orcus', quaoar: 'Quaoar', gonggong: 'Gonggong', sedna: 'Sedna',
        salacia: 'Salacia', varda: 'Varda', varuna: 'Varuna',
        // Kometen
        halley: 'Halleyscher Komet', haleBopp: 'Hale-Bopp', hyakutake: 'Hyakutake',
        lovejoy: 'Lovejoy', encke: 'Encke', swiftTuttle: 'Swift-Tuttle',
        // Nahe Sterne
        alphaCentauri: 'Alpha Centauri',
        // Exoplaneten
        proximaB: 'Proxima Centauri b', kepler452b: 'Kepler-452b',
        trappist1e: 'TRAPPIST-1e', kepler186f: 'Kepler-186f',
        // Andere Sternbilder
        bigDipper: 'Großer Wagen', littleDipper: 'Kleiner Wagen', southernCross: 'Kreuz des Südens',
        orionsBelt: 'Gürtel des Orion', ursaMajor: 'Ursa Major',
        canisMajor: 'Großer Hund', aquila: 'Adler', pegasus: 'Pegasus',
        // Raumfahrzeuge
        iss: 'ISS', hubble: 'Hubble',
        jwst: 'James-Webb-Weltraumteleskop', gpsNavstar: 'GPS-Satellit (NAVSTAR)',
        voyager1: 'Voyager 1', voyager2: 'Voyager 2', newHorizons: 'New Horizons',
        juno: 'Juno (Jupiter)', cassini: 'Cassini (Saturn)', pioneer10: 'Pioneer 10', pioneer11: 'Pioneer 11',
        
        // Navigationsmenü-Abschnitte
        navOurStar: "Unser Stern",
        navInnerPlanets: "Innere Planeten (Gesteinsplaneten)",
        navAsteroidBelt: "Asteroidengürtel",
        navOuterPlanets: "Äußere Planeten (Gasriesen)",
        navIceGiants: "Eisriesen",
        navKuiperBelt: "Kuipergürtel & Zwergplaneten",
        navComets: "Kometen",
        navSatellites: "Satelliten & Raumstationen",
        navSpacecraft: "Raumfahrzeuge & Sonden",
        navDistantStars: "Ferne Sterne",
        kuiperBelt: "Kuipergürtel",
        oortCloud: "Oort-Wolke",
        asteroidBelt: "Asteroidengürtel",
        // Nebel
        orionNebula: 'Orionnebel',
        crabNebula: 'Krabnebel',
        ringNebula: 'Ringnebel',
        // Galaxien
        andromedaGalaxy: 'Andromedagalaxie',
        whirlpoolGalaxy: 'Strudelgalaxie',
        sombreroGalaxy: 'Sombrero-Galaxie',
        // Sternbilder
        aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs',
        leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpius: 'Skorpion',
        sagittarius: 'Schütze', capricornus: 'Steinbock', aquarius: 'Wassermann',
        pisces: 'Fische', orion: 'Orion', cassiopeia: 'Kassiopeia',
        cygnus: 'Schwan', lyra: 'Leier', andromeda: 'Andromeda', andromedaConst: 'Andromeda', perseus: 'Perseus',
        // Nahe Sterne & Exoplaneten-Wirte
        alphaCentauriA: 'Alpha Centauri A',
        proximaCentauri: 'Proxima Centauri',
        kepler452Star: 'Kepler-452',
        trappist1Star: 'TRAPPIST-1',
        kepler186Star: 'Kepler-186',
        plutoSystem: "Plutosystem",
        outerSolarSystem: "Äußeres Sonnensystem",
        comets: "Kometen",
        dwarfPlanets: "Zwergplaneten & Kandidaten",
        constellationsZodiac: "Sternbilder (Tierkreis)",
        constellationsOther: "Sternbilder (Sonstige)",
        
        // Steuerungstasten
        toggleOrbits: "Umlaufbahnen",
        toggleConstellations: "Sternbilder",
        toggleScale: "Kompakt",
        toggleScaleRealistic: "Erweitert",
        toggleScaleScientific: "Wissenschaftlich",
        toggleLabels: "Beschriftungen AUS",
        toggleLabelsOn: "Beschriftungen EIN",
        toggleSoundOn: "Ton EIN",
        toggleSoundOff: "Ton AUS",
        resetView: "Zurücksetzen",
        enterVR: "VR Starten",
        enterAR: "AR Starten",
        randomDiscovery: "Entdecken",

        // Tooltips untere Leiste
        tooltipOrbits: "Umlaufbahnen ein-/ausblenden (O)",
        tooltipConstellations: "Sternbilder ein-/ausblenden (C)",
        tooltipLabels: "Objektbeschriftungen umschalten (D)",
        tooltipScale: "Zwischen kompakt, erweitert und wissenschaftlich wechseln (S)",
        tooltipSound: "Soundeffekte ein-/ausschalten",
        tooltipReset: "Kamera zurücksetzen (R)",
        tooltipDiscover: "Überrasch mich! Zu einem zufälligen Objekt springen",
        tooltipHelp: "Steuerung und Funktionen anzeigen (H)",
        
        // Onboarding
        welcomeToSpace: "🚀 Willkommen bei Weltraumreise!",
        skip: "Überspringen",
        next: "Weiter",
        startExploring: "Erkunden beginnen! 🌟",
        onboardingNav: "Das Universum navigieren",
        onboardingNavDesc: "Ziehen zum Drehen • Scrollen zum Zoomen • Rechtsklick zum Verschieben",
        onboardingExplore: "Objekte erkunden",
        onboardingExploreDesc: "Klicken Sie auf einen Planeten, Mond oder Stern, um faszinierende Fakten zu lernen!",
        onboardingQuickNav: "Schnellnavigation",
        onboardingQuickNavDesc: "Verwenden Sie das Dropdown-Menü, um direkt zu einem beliebigen Objekt zu springen",
        
        // Mobile Gesten
        pinchToZoom: "Zum Zoomen zusammenkneifen",
        dragToRotate: "Zum Drehen ziehen",
        
        // Laden
        preparingJourney: "Ihre Weltraumreise wird vorbereitet...",
        defaultFact: "Die Sonne enthält 99,86% der Masse des Sonnensystems!",
        
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
        install: "Installieren",
        installLater: "Vielleicht Später",
        notNow: "Nicht Jetzt",
        offlineMode: "Sie sind offline",
        update: "Aktualisieren",
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
        typeComet: 'Komet',
        typeAsteroidBelt: 'Asteroidengürtel',
        typeKuiperBelt: 'Kuipergürtel',
        typeOortCloud: 'Oortsche Wolke',
        typeConstellation: 'Sternbild',
        typeExoplanet: 'Exoplanet',
        typeDistantStar: 'Ferner Stern',
        typeSatellite: 'Satellit',
        typeProbe: 'Raumsonde',
        typeOrbiter: 'Orbiter',
        typeObservatory: 'Weltraumobservatorium',
        
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
        creatingOortCloud: 'Oortsche Wolke wird erstellt...',
        creatingStarfield: 'Sternfeld wird erstellt...',
        creatingMilkyWay: 'Milchstraße wird erstellt...',
        creatingOrbitalPaths: 'Umlaufbahnen werden erstellt...',
        creatingConstellations: 'Sternbilder werden erstellt...',
        creatingDistantStars: 'Ferne Sterne werden erstellt...',
        creatingNebulae: 'Nebel werden erstellt...',
        creatingGalaxies: 'Galaxien werden erstellt...',
        creatingNearbyStars: 'Nahe Sterne werden erstellt...',
        creatingExoplanets: 'Exoplaneten werden erstellt...',
        creatingComets: 'Kometen werden erstellt...',
        creatingDwarfPlanets: 'Zwergplaneten werden erstellt...',
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
        descPluto: '🪐 Pluto ist ein Zwergplanet im Kuipergürtel. Er hat einen herzförmigen Gletscher (Tombaugh Regio), Berge aus Wassereis und fünf Monde. Pluto und sein größter Mond Charon sind gezeitengebunden - sie zeigen einander immer die gleiche Seite!',
        funFactPluto: 'Ein Jahr auf Pluto dauert 248 Erdjahre! Er hat seit seiner Entdeckung 1930 noch keine Umlaufbahn vollendet.',
        
        // Mondbeschreibungen
        descPhobos: 'Phobos umkreist den Mars schneller als der Mars rotiert! Er geht im Westen auf und im Osten unter.',
        descDeimos: 'Deimos ist der kleinere der beiden Marsmonde und braucht 30 Stunden für eine Umkreisung.',
        descIo: 'Io ist der vulkanisch aktivste Körper im Sonnensystem!',
        descEuropa: 'Europa hat einen globalen Ozean unter seinem Eis - ein potenzieller Ort für Leben!',
        descGanymede: 'Ganymed ist der größte Mond im Sonnensystem, größer als Merkur!',
        descCallisto: 'Callisto ist das am stärksten verkraterte Objekt im Sonnensystem!',
        descTitan: 'Titan hat Seen und Flüsse aus flüssigem Methan - der einzige Ort mit Oberflächenflüssigkeiten außer der Erde!',
        descEnceladus: 'Enceladus spritzt Wasserfontänen aus seinem unterirdischen Ozean ins All!',
        descRhea: 'Rhea könnte ein eigenes Ringsystem haben!',
        descTitania: 'Titania ist der größte Mond von Uranus mit massiven Schluchten!',
        descMiranda: 'Miranda hat das dramatischste Gelände im Sonnensystem mit 20 km hohen Klippen!',
        descTriton: 'Triton umkreist rückwärts und hat Stickstoffgeysire! Wahrscheinlich ein eingefangenes Objekt aus dem Kuipergürtel.',
        descCharon: 'Charon ist im Vergleich zu Pluto so groß, dass sie ein Doppelsystem bilden!',
        
        // Satellitenbeschreibungen und Fakten
        descISS: 'Die ISS umkreist in 400 km Höhe und vollendet alle 92,68 Minuten eine Umlaufbahn (15,54 Umläufe/Tag). Gestartet am 20. Nov 1998 (Zarya-Modul). Montage: 1998-2011 (42 Flüge: 36 Shuttle, 6 russisch). Masse: 419.725 kg. Druckvolumen: 1.000 m³. Dauerhaft bewohnt seit 2. Nov 2000 (24+ Jahre, 9.000+ Tage). 280+ Astronauten aus 23 Ländern haben sie besucht.',
        funFactISS: 'Die ISS reist mit 27.600 km/h! Astronauten sehen 16 Sonnenauf-/untergänge pro Tag. Sie ist seit 24+ Jahren dauerhaft bewohnt - länger als jedes andere Raumfahrzeug!',
        descHubble: 'Gestartet am 24. April 1990 mit der Discovery-Fähre. Umkreist in ~535 km Höhe. Hat bis Okt 2025 1,6+ Millionen Beobachtungen durchgeführt. 2,4m Primärspiegel beobachtet UV, sichtbar und nahes IR. Fünf Wartungsmissionen (1993-2009) verbesserten die Instrumente.',
        funFactHubble: 'Kann Objekte auflösen, die 0,05 Bogensekunden getrennt sind - wie das Sehen zweier Glühwürmchen in 10.000 km Entfernung! Das tiefste Bild (eXtreme Deep Field) zeigt 5.500 Galaxien, einige 13,2 Milliarden Lichtjahre entfernt.',
        descGPS: 'GPS-Konstellation (NAVSTAR): 31 operative Satelliten (Okt 2025) in 6 Bahnebenen, 55° Neigung. Jeder Satellit umkreist in 20.180 km Höhe. Sendet L-Band-Signale (1,2-1,5 GHz). Rubidium/Cäsium-Atomuhren genau auf 10⁻¹⁴ Sekunden.',
        funFactGPS: 'Benötigt 4 Satelliten für 3D-Position (Trilateration + Uhrenkorrektur). Das System bietet 5-10m Genauigkeit. Das militärische Signal (P/Y-Code) ist zentimetergenau!',
        descJWST: 'Gestartet am 25. Dez 2021. Erreichte L2-Punkt am 24. Jan 2022. Erste Bilder veröffentlicht am 12. Jul 2022. Beobachtet Infrarot (0,6-28,5 μm). 6,5m segmentierter Beryllium-Spiegel (18 Sechsecke) mit 25 m² Sammelfläche - 6x Hubble! Sonnenschild: 21,2m × 14,2m, 5 Schichten.',
        funFactJWST: 'Arbeitet bei -233°C (-388°F)! Kann die thermische Signatur einer Hummel in Mondentfernung erkennen. Hat die ältesten Galaxien bei z=14 entdeckt (280 Millionen Jahre nach dem Urknall).',
        
        // Raumfahrzeugbeschreibungen und Fakten
        descVoyager1: 'Voyager 1 ist das am weitesten von der Erde entfernte menschengemachte Objekt! Gestartet am 5. Sept 1977, trat am 25. Aug 2012 in den interstellaren Raum ein. Derzeit 24,3 Milliarden km (162 AE) von der Sonne entfernt. Trägt die Goldene Schallplatte mit Klängen und Bildern der Erde.',
        funFactVoyager1: 'Voyager 1 reist mit 17 km/s (61.200 km/h). Seine Funksignale brauchen 22,5 Stunden zur Erde!',
        descVoyager2: 'Voyager 2 ist das einzige Raumfahrzeug, das alle vier Riesenplaneten besucht hat! Jupiter (Jul 1979), Saturn (Aug 1981), Uranus (Jan 1986), Neptun (Aug 1989). Trat am 5. Nov 2018 in den interstellaren Raum ein. Jetzt 20,3 Milliarden km (135 AE) von der Sonne entfernt.',
        funFactVoyager2: 'Voyager 2 entdeckte 16 Monde bei den Riesenplaneten, den Großen Dunklen Fleck des Neptun und die Geysire von Triton!',
        descNewHorizons: 'New Horizons gab uns am 14. Juli 2015 die ersten Nahaufnahmen von Pluto! Enthüllte Wassereis-Berge bis 3.500m Höhe, riesige Stickstoffgletscher und die berühmte herzförmige Tombaugh Regio. Jetzt 59 AE von der Sonne entfernt, erkundet den Kuipergürtel.',
        funFactNewHorizons: 'New Horizons reiste 9,5 Jahre und 5 Milliarden km, um Pluto mit 58.536 km/h zu erreichen. Trägt 28g von Clyde Tombaughs Asche!',
        descJuno: 'Juno trat am 4. Juli 2016 in die Jupiter-Umlaufbahn ein. Untersucht Zusammensetzung, Gravitationsfeld, Magnetfeld und polare Polarlichter. Entdeckte, dass Jupiters Kern größer und "unscharf" ist, massive polare Wirbelstürme und atmosphärische Ammoniakverteilung. Mission seit 2021 verlängert.',
        funFactJuno: 'Erstes solarbetriebenes Raumfahrzeug zu Jupiter! Drei 9m Solarpanele erzeugen 500W. Trägt drei LEGO-Figuren: Galileo, Jupiter und Juno!',
        descCassini: 'Cassini umkreiste Saturn vom 30. Juni 2004 bis 15. Sept 2017 (13 Jahre). Entdeckte Methan/Ethan-Flüssigseen auf Titan, Wasserfontänen auf Enceladus, neue Ringe, 7 neue Monde. Die Huygens-Sonde landete am 14. Jan 2005 auf Titan. Endete mit "Grand Finale" Atmosphäreneintritt.',
        funFactCassini: 'Entdeckte den unterirdischen Ozean von Enceladus! Wasserfontänen sprühen 250kg/s ins All. Cassini flog durch die Fontänen, entdeckte H2, organische Verbindungen - Zutaten für Leben!',
        descPioneer10: 'Pioneer 10 war das erste Raumfahrzeug, das den Asteroidengürtel durchquerte und Jupiter besuchte (3. Dez 1973)! Gestartet am 2. März 1972, trug die berühmte Pioneer-Plakette mit Menschen und Erdposition. Letzter Kontakt: 23. Jan 2003 bei 12,2 Milliarden km.',
        funFactPioneer10: 'Pioneer 10 trägt eine goldene Plakette von Carl Sagan, die einen Mann, eine Frau und die Erdposition zeigt - eine Botschaft für Außerirdische, die sie finden könnten!',
        descPioneer11: 'Pioneer 11 war das erste Raumfahrzeug, das Saturn besuchte (1. Sept 1979)! Flog auch an Jupiter vorbei (3. Dez 1974). Gestartet am 5. April 1973, entdeckte Saturns F-Ring und einen neuen Mond. Trägt ebenfalls die Pioneer-Plakette. Letzter Kontakt: 24. Nov 1995 bei 6,5 Milliarden km.',
        funFactPioneer11: 'Pioneer 11 nutzte Jupiters Schwerkraft für ein gewagtes Swing-by-Manöver und sparte Jahre Reisezeit zum Saturn!',
        
        // Kometenbeschreibungen
        descHalley: 'Der Halleysche Komet ist der berühmteste! Er kehrt alle 75-76 Jahre zur Erde zurück. Zuletzt 1986 gesehen, wird er 2061 wiederkommen. Wenn Sie ihn sehen, beobachten Sie einen 4,6 Milliarden Jahre alten kosmischen Schneeball!',
        descHaleBopp: 'Hale-Bopp war einer der hellsten Kometen des 20. Jahrhunderts, 18 Monate lang 1996-1997 mit bloßem Auge sichtbar! Sein Kern ist außergewöhnlich groß mit 40 km Durchmesser.',
        descNeowise: 'Komet NEOWISE war im Juli 2020 ein spektakulärer Anblick! Er wird erst in etwa 6.800 Jahren wiederkommen. Kometen sind "schmutzige Schneebälle" aus Eis, Staub und Gestein von der Entstehung des Sonnensystems.',

        // Galaxien
        descAndromeda: ' Die Andromeda-Galaxie ist unsere nächste große galaktische Nachbarin, 2,5 Millionen Lichtjahre entfernt! Sie enthält 1 Billion Sterne und ist auf Kollisionskurs mit der Milchstraße (keine Sorge, Kollision in 4,5 Milliarden Jahren).',
        descWhirlpool: ' Die Whirlpool-Galaxie (M51) ist berühmt für ihre wunderschönen Spiralarme! Sie interagiert mit einer kleineren Begleitgalaxie und erzeugt atemberaubende Gezeitenkräfte und neue Sternentstehung.',
        descSombrero: ' Die Sombrero-Galaxie sieht aus wie ein mexikanischer Hut! Sie hat einen hellen Kern, einen ungewöhnlich großen zentralen Bulge und eine prominente Staubbahn. Enthält 2.000 Kugelsternhaufen!',

        // Nebel
        descOrionNebula: ' Der Orionnebel ist eine Sternenkinderstube, in der neue Sterne entstehen! Er ist 1.344 Lichtjahre entfernt und mit bloßem Auge als verschwommener Fleck in Orions Schwert sichtbar. Enthält über 3.000 Sterne!',
        descCrabNebula: ' Der Krebsnebel ist das Überbleibsel einer Supernova-Explosion, die chinesische Astronomen 1054 n. Chr. beobachteten! In seinem Zentrum befindet sich ein Pulsar, der 30 Mal pro Sekunde rotiert!',
        descRingNebula: ' Der Ringnebel ist ein planetarischer Nebel — die leuchtenden Überreste eines sterbenden sonnenähnlichen Sterns! Der Stern in seinem Zentrum hat seine äußeren Schichten weggeblasen und diesen schönen Ring geschaffen.',

        // Sternbilder
        descAries: ' Widder ist das erste Zeichen des Tierkreises! Achten Sie auf die hellen Sterne Hamal und Sheratan. In der griechischen Mythologie repräsentiert Widder den goldenen Widder, der Phrixus und Helle rettete.',
        descTaurus: ' Stier enthält den hellen roten Stern Aldebaran, das Auge des Stiers! Auch Heimat des Plejaden-Sternhaufens. In der Mythologie verwandelte sich Zeus in einen Stier, um Europa zu gewinnen.',
        descGemini: ' Zwillinge haben die hellen Zwillinge Kastor und Pollux! In der Mythologie waren sie untrennbare Brüder, die Dioskuren, bekannt für ihre Bindung und Tapferkeit.',
        descCancer: ' Krebs ist schwach, enthält aber den wunderschönen Bienenkorb-Cluster (M44)! In der Mythologie war Krebs die Krabbe, die Hera schickte, um Herkules während seines Kampfes abzulenken.',
        descLeo: ' Löwe hat den hellen Stern Regulus! Das "Sichel"-Asterismus bildet den Kopf des Löwen. In der Mythologie repräsentiert Löwe den Nemeischen Löwen, der von Herkules getötet wurde.',
        descVirgo: ' Jungfrau ist das zweitgrößte Sternbild! Der helle Stern Spika stellt Weizen in der Hand der Jungfrau dar. Heimat von Tausenden von Galaxien im Jungfrau-Cluster.',
        descLibra: ' Waage repräsentiert die Gerechtigkeitswaage! Ihre hellsten Sterne sind Zubenelgenubi und Zubeneschamali, was auf Arabisch "südliche Klaue" und "nördliche Klaue" bedeutet.',
        descScorpius: ' Skorpion repräsentiert den Skorpion, der Orion in der griechischen Mythologie tötete! Der helle rote Stern Antares markiert das Herz des Skorpions. Suchen Sie den gebogenen Schwanz mit dem Stachel!',
        descSagittarius: ' Schütze richtet seinen Pfeil auf das Herz des Skorpions! Das "Teekanne"-Asterismus ist leicht zu erkennen. Zeigt auf das Zentrum unserer Milchstraße!',
        descCapricornus: ' Steinbock ist eines der ältesten Sternbilder! Stellt ein Wesen mit dem Kopf einer Ziege und dem Schwanz eines Fisches dar. In der griechischen Mythologie mit dem Gott Pan assoziiert.',
        descAquarius: ' Wassermann stellt den Wasserträger dar, der aus seinem Krug gießt! Heimat mehrerer berühmter Tiefenhimmelobjekte einschließlich des Helixnebels. Eines der ältesten benannten Sternbilder.',
        descPisces: ' Fische zeigt zwei zusammengebundene Fische! Stellt Aphrodite und Eros dar, die sich in Fische verwandelten, um dem Monster Typhon zu entkommen. Enthält den Frühlingspunkt!',
        descOrion: ' Orion ist eines der bekanntesten Sternbilder! Achten Sie auf die drei in einer Reihe stehenden Sterne, die Orions Gürtel bilden. Der helle rote Stern Beteigeuze markiert seine Schulter und das blaue Rigel seinen Fuß.',
        descUrsaMajor: ' Der Große Bär (Großer Wagen) ist eines der bekanntesten Sternbilder! Die zwei Sterne am Ende der "Tasse" zeigen auf Polaris, den Nordstern. Jahrtausende lang zur Navigation verwendet!',
        descUrsaMajorFull: ' Ursa Major (der Große Bär) ist das drittgrößte Sternbild am Himmel! Es enthält den berühmten Großen Wagen, der den Rücken und Schwanz des Bären bildet. Mit 16 Hauptsternen, die eine Bärenform mit Kopf, Körper und Beinen zeichnen, wird es seit Jahrtausenden von Kulturen weltweit erkannt. Dubhe und Merak sind die "Zeigersterne", die zu Polaris führen!',
        descUrsaMinor: ' Der Kleine Bär enthält Polaris, den Nordstern! Polaris markiert das Ende des Stiels des Kleinen Bären und bleibt am nördlichen Himmel nahezu fest. Unverzichtbar für die Himmelsnavigation!',
        descCrux: ' Das Kreuz des Südens ist das kleinste Sternbild, aber eines der bekanntesten auf der Südhalbkugel! Es wird zur Navigation verwendet und zeigt zum Südlichen Himmelspol.',
        descBigDipper: ' Der Große Wagen ist der bekannteste Asterismus am nördlichen Himmel! Sieben helle Sterne bilden eine Schöpfkellenform — die "Zeigersterne" Dubhe und Merak am Ende der Tasse zeigen direkt auf Polaris, den Nordstern. Jahrtausende lang zur Navigation verwendet!',
        descLittleDipper: ' Der Kleine Bär enthält Polaris, den Nordstern! Polaris markiert das Ende des Stiels des Kleinen Bären und bleibt am nördlichen Himmel nahezu fest. Unverzichtbar für die Himmelsnavigation!',
        descSouthernCross: ' Das Kreuz des Südens ist das kleinste Sternbild, aber eines der bekanntesten auf der Südhalbkugel! Es wird zur Navigation verwendet und zeigt zum Südlichen Himmelspol.',
        descCassiopeia: ' Kassiopeia sieht je nach Jahreszeit wie ein W oder M aus! In der griechischen Mythologie war Kassiopeia eine eitle Königin. Das Sternbild ist in nördlichen Breiten zirkumpolar.',
        descCygnus: ' Schwan fliegt entlang der Milchstraße! Auch Nordliches Kreuz genannt. In der Mythologie verkleidete sich Zeus als Schwan. Heimat vieler Tiefenhimmelobjekte!',
        descLyra: ' Leier stellt die Leier des Orpheus dar! Enthält Wega, den 5. hellsten Stern am Nachthimmel. Auch Heimat des Ringnebels, eines berühmten planetarischen Nebels!',
        descAndromedaConst: ' Andromeda war die Prinzessin, die an einen Felsen gekettet und von Perseus gerettet wurde! Dieses Sternbild enthält die Andromeda-Galaxie (M31), unsere nächste große Nachbargalaxie!',
        descPerseus: ' Perseus der Held, der Medusa erschlug! Heimat des hellen Sterns Mirfak und des berühmten veränderlichen Sterns Algol ("Dämonenstern"). Enthält den Doppelcluster!',
        descOrionsBelt: ' Der Gürtel des Orion ist einer der bekanntesten Asterismen am Nachthimmel! Drei helle Sterne — Alnitak, Alnilam und Mintaka — bilden eine nahezu perfekte Linie. Die alten Ägypter richteten die Großen Pyramiden von Gizeh nach diesen drei Sternen aus!',
        descCanisMajor: ' Der Große Hund beherbergt Sirius, den hellsten Stern am gesamten Nachthimmel! Bekannt als der "Hundsstern" war Sirius für Zivilisationen durch die Geschichte hindurch wichtig. Die alten Ägypter basierten ihren Kalender auf seinem Aufgang. Das Sternbild stellt einen von Orions Jagdhunden dar.',
        descAquila: ' Aquila der Adler schwebt entlang der Milchstraße! Sein hellster Stern Altair vervollständigt das berühmte Sommerdreieck mit Wega (Leier) und Deneb (Schwan). Altair dreht sich so schnell, dass er sich an seinem Äquator ausbeult! In der Mythologie trug Aquila die Blitze des Zeus.',
        descPegasus: ' Pegasus das geflügelte Pferd zeigt das Große Quadrat des Pegasus — eines der bekanntesten Sternmuster des Herbstes! In der griechischen Mythologie entsprang Pegasus der Medusa, als Perseus sie erschlug. Der Stern Enif markiert die Nase des Pferdes.',

        // Nahe Sterne
        descSirius: ' Sirius ist der hellste Stern am Erden-Nachthimmel! Es ist tatsächlich ein Doppelsternsystem. Befindet sich 8,6 Lichtjahre entfernt im Sternbild Großer Hund.',
        descBetelgeuse: ' Beteigeuze ist ein roter Überriese, der sich dem Ende seines Lebens nähert! Er ist so groß, dass er, wenn er an der Position unserer Sonne platziert würde, über den Mars hinausgehen würde. Wird eines Tages als Supernova explodieren!',
        descRigel: ' Rigel ist ein blauer Überriese, einer der leuchtstärksten Sterne, die mit bloßem Auge sichtbar sind! Er ist 40.000 Mal leuchtstärker als unsere Sonne und 860 Lichtjahre entfernt.',
        descVega: ' Wega ist einer der hellsten Sterne am Nordhimmel! Sie war vor 12.000 Jahren der Nordstern und wird es aufgrund der Erdachsenneigung in 13.000 Jahren wieder sein.',
        descPolaris: ' Polaris, der Nordstern, hat Reisende seit Jahrhunderten geleitet! Es ist tatsächlich ein Dreifach-Sternsystem und ist derzeit aufgrund der Rotationsachse der Erde sehr nah am wahren Norden.',
        descAlphaCentauriA: ' Alpha Centauri A ähnelt sehr unserer Sonne! Sie ist Teil eines Dreifach-Sternsystems, das mit 4,37 Lichtjahren unser nächster Sternnachbar ist. Mit ihrem Begleiter Alpha Centauri B umkreisen sie sich gegenseitig alle 80 Jahre.',
        descProximaCentauri: ' Proxima Centauri ist ein kleiner roter Zwerg und der nächstgelegene Stern zu unserem Sonnensystem mit nur 4,24 Lichtjahren! Er ist viel kühler und dunkler als unsere Sonne, hat aber mindestens zwei Planeten, darunter möglicherweise bewohnbares Proxima Centauri b.',

        // Sterne mit Exoplaneten
        descKepler452Star: ' Kepler-452 ist ein sonnenähnlicher Stern, der den "Cousin der Erde" Kepler-452b beherbergt! Er ist 1,5 Milliarden Jahre älter als unsere Sonne und 20% heller.',
        descTrappist1Star: ' TRAPPIST-1 ist ein ultrakalter roter Zwerg mit 7 erdgroßen Planeten! Drei davon befinden sich in der bewohnbaren Zone. Das gesamte System ist so kompakt, dass alle 7 Planeten näher an ihrem Stern kreisen als Merkur an unserer Sonne.',
        descKepler186Star: ' Kepler-186 ist ein roter Zwerg mit 5 bekannten Planeten! Kepler-186f war der erste erdgroße Planet, der in der bewohnbaren Zone eines anderen Sterns entdeckt wurde.',

        // Exoplaneten
        descProximaCentauriB: ' Proxima Centauri b ist der nächstgelegene bekannte Exoplanet zur Erde! Er umkreist die bewohnbare Zone von Proxima Centauri, was bedeutet, dass flüssiges Wasser auf seiner Oberfläche existieren könnte.',
        descKepler452b: ' Kepler-452b wird "Cousin der Erde" genannt! Er ist etwa 60% größer als die Erde und umkreist einen sonnenähnlichen Stern in der bewohnbaren Zone. Sein Jahr dauert 385 Tage.',
        descTrappist1e: ' TRAPPIST-1e ist Teil eines erstaunlichen Systems mit 7 erdgroßen Planeten! Er umkreist einen kühlen roten Zwerg und befindet sich in der bewohnbaren Zone.',
        descKepler186f: ' Kepler-186f war der erste erdgroße Planet, der in der bewohnbaren Zone eines anderen Sterns entdeckt wurde! Er empfängt etwa ein Drittel des Lichts, das die Erde von der Sonne bekommt.',

        // Zwergplaneten
        descCeres: ' Ceres ist das größte Objekt im Asteroidengürtel und ein Zwergplanet! Die Dawn-Raumsonde der NASA enthüllte mysteriöse helle Flecken im Occator-Krater — sie erwiesen sich als Salzablagerungen aus alten Solen.',
        descHaumea: ' Haumea dreht sich so schnell (einmal alle 4 Stunden), dass sie zu einer Eiform abgeflacht wurde! Sie hat auch zwei Monde und ein Ringsystem, was sie unter den Zwergplaneten sehr ungewöhnlich macht.',
        descMakemake: ' Makemake ist eine helle, rötliche Welt im Kuiper-Gürtel, entdeckt nahe Ostern 2005, nach dem Schöpfergott des Rapa-Nui-Volkes von der Osterinsel benannt.',
        descEris: ' Eris ist etwas kleiner als Pluto, aber massereicher! Ihre Entdeckung im Jahr 2005 führte direkt zur Neueinstufung von Pluto als Zwergplanet. Sie hat einen Mond, Dysnomia.',
        descSedna: ' Sedna hat eine der extremsten elliptischen Umlaufbahnen im Sonnensystem, von 76 bis 937 AE. Eine Umlaufbahn dauert etwa 11.400 Jahre und sie ist so rot, dass sie mit Mars in der Farbe konkurriert!',

        // Weitere Kometen
        descHyakutake: ' Komet Hyakutake passierte 1996 extrem nah an der Erde und wurde einer der hellsten Kometen seit Jahrzehnten mit einem Schweif, der sich über die halbe Himmelskugel erstreckte!',
        descLovejoy: ' Komet Lovejoy (C/2011 W3) überlebte einen nahen Durchgang durch die Korona der Sonne! Er ist Teil der Kreutz-Sonnenstreifer — Fragmente eines Riesenkometen, der vor Jahrhunderten zerbrach.',
        descEncke: ' Komet Encke hat die kürzeste Umlaufzeit aller bekannten Kometen — nur 3,3 Jahre! Er ist nach Johann Franz Encke benannt, der seine Umlaufbahn 1819 berechnete.',
        descSwiftTuttle: ' Komet Swift-Tuttle ist der Mutterkörper des spektakulären Perseiden-Meteorstroms! Mit einem 26 km großen Kern ist es das größte Objekt, das regelmäßig in Erdnähe gerät.',

        // Asteroidengürtel / Kuiper-Gürtel / Oort-Wolke
        descAsteroidBelt: ' Der Asteroidengürtel enthält Millionen felsiger Objekte zwischen Mars und Jupiter. Ceres, das größte Objekt hier, ist ein Zwergplanet! Die meisten Asteroiden sind übrig gebliebenes Material aus der Entstehung des Sonnensystems vor 4,6 Milliarden Jahren.',
        descKuiperBelt: ' Der Kuiper-Gürtel ist eine Region jenseits von Neptun, gefüllt mit eisigen Körpern und Zwergplaneten, einschließlich Pluto! Es ist wie ein riesiger Donut gefrorener Objekte aus der Entstehung des Sonnensystems. Kurzperiodische Kometen kommen von hier!',
        descOortCloud: ' Die Oort-Wolke ist eine riesige kugelförmige Hülle aus eisigen Objekten, die unser gesamtes Sonnensystem umgibt! Sie erstreckt sich von etwa 50.000 bis 200.000 AE von der Sonne. Langperiodische Kometen wie Hale-Bopp stammen aus diesem fernen Reich.',

        // Wissenswertes für zusätzliche Objekte
        funFactAsteroidBelt: 'Entgegen Filmdarstellungen sind Asteroiden sehr weit voneinander entfernt - Raumfahrzeuge können sicher hindurchfliegen!',
        funFactKuiperBelt: 'Der Kuiper-Gürtel ist 20-mal breiter als der Asteroidengürtel und enthält Milliarden von Objekten!',
        funFactOortCloud: 'Die Oort-Wolke ist so weit entfernt, dass Licht der Sonne über 1,5 Jahre braucht, um ihren Außenrand zu erreichen! Voyager 1 würde etwa 300 Jahre brauchen, um den Innenrand zu erreichen.',
        funFactCeres: 'Ceres könnte unterirdisches flüssiges Wasser beherbergen - ein Spitzenkandidat für Leben!',
        funFactHaumea: 'Eine Rotationsperiode von ~4 Stunden verleiht Haumea seine einzigartige eiförmige dreiachsige Ellipsoidform!',
        funFactMakemake: 'In der Nähe von Ostern 2005 entdeckt, ist Makemake nach dem Schöpfergott des Rapa-Nui-Volkes benannt!',
        funFactEris: 'Die Entdeckung von Eris führte direkt zur Neueinstufung von Pluto als Zwergplanet im Jahr 2006!',
        funFactSedna: 'Sedna braucht 11.400 Jahre für eine Umlaufbahn - möglicherweise beeinflusst von einem unsichtbaren Planeten Neun!',
        funFactAlphaCentauriA: 'Alpha Centauri ist von der Südhalbkugel aus sichtbar und ist der dritthellste Stern an unserem Nachthimmel!',
        funFactProximaCentauri: 'Obwohl Proxima unser nächster Stern ist, ist er zu schwach, um mit bloßem Auge gesehen zu werden!',
        funFactSirius: 'Sirius nähert sich uns tatsächlich - er wird in etwa 60.000 Jahren am nächsten sein!',
        funFactBetelgeuse: 'Beteigeuze könnte jederzeit als Supernova explodieren (astronomisch gesehen - morgen oder in 100.000 Jahren)!',
        funFactDefaultStar: 'Dieser Stern ist von der Erde aus mit bloßem Auge sichtbar!',
        funFactOrionNebula: 'Im Orionnebel werden gerade jetzt neue Sterne geboren!',
        funFactCrabNebula: 'Der Pulsar im Krebsnebel dreht sich 30 Mal pro Sekunde und dehnt sich mit 1.500 km/s aus!',
        funFactRingNebula: 'Planetarische Nebel haben nichts mit Planeten zu tun - sie sehen durch alte Teleskope nur rund wie Planeten aus!',
        funFactAndromedaGalaxy: 'Die Andromeda-Galaxie nähert sich uns mit 110 km/s!',
        funFactWhirlpoolGalaxy: 'Die Whirlpool-Galaxie ist mit einem guten Fernglas zu sehen!',
        funFactSombreroGalaxy: 'Trotz Milliarden von Sternen besteht auch die Sombrero-Galaxie größtenteils aus leerem Raum!',
        funFactTrappist1Star: 'TRAPPIST-1 ist nach dem Teleskop benannt, das es entdeckte - The TRAnsiting Planets and PlanetesImals Small Telescope!',
        funFactKepler452Star: 'Kepler-452 ist 6 Milliarden Jahre alt - es zeigt uns, wie unsere Sonne in 1,5 Milliarden Jahren aussehen könnte!',
        funFactKepler186Star: 'Pflanzen auf Kepler-186f würden wahrscheinlich mit Infrarotlicht photosynthetisieren und dunkelrot oder schwarz erscheinen!',
        funFactProximaCentauriB: 'Mit aktueller Technologie würde es 6.300 Jahre dauern, Proxima b zu erreichen!',
        funFactKepler452b: 'Kepler-452b ist 6 Milliarden Jahre alt - 1,5 Milliarden Jahre älter als die Erde!',
        funFactTrappist1e: 'Von TRAPPIST-1e aus könnten Sie die anderen Planeten so groß wie unseren Mond am Himmel sehen!',
        funFactKepler186f: 'Kepler-186f umkreist einen roten Zwerg, also würde sein Himmel orangerot leuchten!',
        funFactComets: 'Kometen haben zwei Schweife: einen gebogenen Staubschweif (gelblich) und einen geraden Ionenschweif (blau) - beide zeigen immer von der Sonne weg!',
        descOrcus: 'Orcus ist ein großes Kuipergürtel-Objekt in einer 2:3-Bahnresonanz mit Neptun, genau wie Pluto. Es hat seinen eigenen Mond namens Vanth.',
        funFactOrcus: 'Orcus wird manchmal Anti-Pluto genannt — ihre Bahnen sind fast perfekte Spiegelbilder voneinander auf gegenüberliegenden Seiten der Sonne!',
        descQuaoar: 'Quaoar ist ein großes Kuipergürtel-Objekt mit seinem eigenen Mond Weywot. Bemerkenswerterweise besitzt es ein Ringsystem — der erste Ring, der je um ein Kuipergürtel-Objekt entdeckt wurde.',
        funFactQuaoar: 'Quaoars Ring umkreist weit jenseits seiner Roche-Grenze, wo Ringe nicht existieren sollten — ein Rätsel, das unser Verständnis der Ringbildung in Frage stellt!',
        descGonggong: 'Gonggong (früher 2007 OR10) ist ein weit entferntes Streuscheiben-Objekt mit einer rötlichen Oberfläche, die durch strahlungsverändertes Methaneis verursacht wird. Es hat einen Mond namens Xiangliu.',
        funFactGonggong: 'Gonggong ist nach einem chinesischen Wassergott benannt, der laut Mythologie die Erde neigte, indem er gegen eine Säule rammte, die den Himmel stützte!',
        descSalacia: 'Salacia ist ein dunkles Kuipergürtel-Objekt mit einem Mond namens Actaea. Es ist eines der größten transneptunischen Objekte, das noch nicht als Zwergplanet klassifiziert wurde.',
        funFactSalacia: 'Salacia ist nach der römischen Meeresgöttin und Frau von Neptun benannt — passend für eine eisige Welt, die im Reich der äußersten Planeten umkreist!',
        descVarda: 'Varda ist ein binäres Kuipergürtel-Objekt, das mit seinem großen Mond Ilmarë gepaart ist. Durch die Messung ihrer gegenseitigen Umlaufbahn können Wissenschaftler die kombinierte Masse des Systems genau berechnen.',
        funFactVarda: 'Varda ist nach der Königin der Sterne in Tolkiens Mythologie benannt — der Gottheit, die die Sterne formte und an den Himmel von Mittelerde setzte!',
        descVaruna: 'Varuna ist ein klassisches Kuipergürtel-Objekt, das für seine extrem schnelle Rotation bekannt ist — eine vollständige Drehung in nur 6,3 Stunden, eine der schnellsten im äußeren Sonnensystem.',
        funFactVaruna: 'Varuna rotiert so schnell, dass es am Äquator aufgebaucht ist und wie ein abgeflachter Ball geformt ist — sein äquatorialer Durchmesser ist merklich größer als sein polarer Durchmesser!'
    },
    
    es: {
        // Título y encabezado de la aplicación
        appTitle: "Viaje Espacial",
        subtitle: "Sistema Solar 3D Interactivo",
        
        // Navegación
        quickNavigation: "Navegación",
        search: "Buscar...",
        searchObjects: "🔍 Buscar objetos...",
        
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
        io: "Io",
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
        pluto: "Plutón",
        charon: "Caronte",
        enceladus: "Encélado",
        rhea: "Rea",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Tritón",
        // Planetas enanos
        ceres: 'Ceres', haumea: 'Haumea', makemake: 'Makemake', eris: 'Eris',
        orcus: 'Orcus', quaoar: 'Quaoar', gonggong: 'Gonggong', sedna: 'Sedna',
        salacia: 'Salacia', varda: 'Varda', varuna: 'Varuna',
        // Cometas
        halley: 'Cometa Halley', haleBopp: 'Hale-Bopp', hyakutake: 'Hyakutake',
        lovejoy: 'Lovejoy', encke: 'Encke', swiftTuttle: 'Swift-Tuttle',
        // Estrellas cercanas
        alphaCentauri: 'Alfa Centauri',
        // Exoplanetas
        proximaB: 'Próxima Centauri b', kepler452b: 'Kepler-452b',
        trappist1e: 'TRAPPIST-1e', kepler186f: 'Kepler-186f',
        // Otras constelaciones
        bigDipper: 'Osa Mayor', littleDipper: 'Osa Menor', southernCross: 'Cruz del Sur',
        orionsBelt: 'Cinturón de Orión', ursaMajor: 'Ursa Major',
        canisMajor: 'Can Mayor', aquila: 'Águila', pegasus: 'Pegaso',
        // Naves espaciales
        iss: 'ISS', hubble: 'Hubble',
        jwst: 'Telescopio Espacial James Webb', gpsNavstar: 'Satélite GPS (NAVSTAR)',
        voyager1: 'Voyager 1', voyager2: 'Voyager 2', newHorizons: 'New Horizons',
        juno: 'Juno (Júpiter)', cassini: 'Cassini (Saturno)', pioneer10: 'Pioneer 10', pioneer11: 'Pioneer 11',
        
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
        oortCloud: "Nube de Oort",
        asteroidBelt: "Cinturón de Asteroides",
        // Nebulosas
        orionNebula: 'Nebulosa de Orión',
        crabNebula: 'Nebulosa del Cangrejo',
        ringNebula: 'Nebulosa del Anillo',
        // Galaxias
        andromedaGalaxy: 'Galaxia de Andrómeda',
        whirlpoolGalaxy: 'Galaxia del Remolino',
        sombreroGalaxy: 'Galaxia del Sombrero',
        // Constelaciones
        aries: 'Aries', taurus: 'Tauro', gemini: 'Géminis', cancer: 'Cáncer',
        leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpius: 'Escorpio',
        sagittarius: 'Sagitario', capricornus: 'Capricornio', aquarius: 'Acuario',
        pisces: 'Piscis', orion: 'Orión', cassiopeia: 'Casiopea',
        cygnus: 'Cisne', lyra: 'Lyra', andromeda: 'Andrómeda', andromedaConst: 'Andrómeda', perseus: 'Perseo',
        // Estrellas cercanas y anfitrionas de exoplanetas
        alphaCentauriA: 'Alpha Centauri A',
        proximaCentauri: 'Proxima Centauri',
        kepler452Star: 'Kepler-452',
        trappist1Star: 'TRAPPIST-1',
        kepler186Star: 'Kepler-186',
        plutoSystem: "Sistema Plutoniano",
        outerSolarSystem: "Sistema Solar Exterior",
        comets: "Cometas",
        dwarfPlanets: "Planetas Enanos y Candidatos",
        constellationsZodiac: "Constelaciones (Zodíaco)",
        constellationsOther: "Constelaciones (Otras)",
        
        // Botones de control
        toggleOrbits: "Órbitas",
        toggleConstellations: "Constelaciones",
        toggleScale: "Compacto",
        toggleScaleRealistic: "Expandido",
        toggleScaleScientific: "Científico",
        toggleLabels: "Etiquetas DESACTIVADAS",
        toggleLabelsOn: "Etiquetas ACTIVADAS",
        toggleSoundOn: "Sonido ACTIVADO",
        toggleSoundOff: "Sonido DESACTIVADO",
        resetView: "Restablecer",
        enterVR: "Entrar en RV",
        enterAR: "Entrar en RA",
        randomDiscovery: "Descubrir",

        // Información sobre herramientas barra inferior
        tooltipOrbits: "Mostrar/ocultar trayectorias orbitales (O)",
        tooltipConstellations: "Mostrar/ocultar constelaciones (C)",
        tooltipLabels: "Alternar etiquetas de objetos (D)",
        tooltipScale: "Alternar entre modos compacto, expandido y científico (S)",
        tooltipSound: "Activar/desactivar efectos de sonido",
        tooltipReset: "Restablecer cámara a vista predeterminada (R)",
        tooltipDiscover: "¡Sorpréndeme! Saltar a un objeto aleatorio",
        tooltipHelp: "Mostrar controles y funciones (H)",
        
        // Incorporación
        welcomeToSpace: "🚀 ¡Bienvenido a Viaje Espacial!",
        skip: "Omitir",
        next: "Siguiente",
        startExploring: "¡Comenzar a explorar! 🌟",
        onboardingNav: "Navegar el Universo",
        onboardingNavDesc: "Arrastrar para rotar • Desplazar para hacer zoom • Clic derecho para desplazar",
        onboardingExplore: "Explorar Objetos",
        onboardingExploreDesc: "¡Haz clic en cualquier planeta, luna o estrella para aprender datos fascinantes!",
        onboardingQuickNav: "Navegación Rápida",
        onboardingQuickNavDesc: "Usa el menú desplegable para saltar directamente a cualquier objeto",
        
        // Gestos móviles
        pinchToZoom: "Pellizcar para hacer zoom",
        dragToRotate: "Arrastrar para rotar",
        
        // Carga
        preparingJourney: "Preparando tu viaje espacial...",
        defaultFact: "¡El Sol contiene el 99,86% de la masa del Sistema Solar!",
        
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
        updateLater: "más Tarde",
        offline: "Modo Sin Conexión",
        offlineMessage: "Estás sin conexión. Algunas funciones pueden estar limitadas.",
        installTitle: "Instalar Viaje Espacial",
        installMessage: "¡Instala Viaje Espacial como aplicación para una mejor experiencia!",
        installButton: "Instalar",
        install: "Instalar",
        installLater: "Quizás más Tarde",
        notNow: "Ahora No",
        offlineMode: "Estás desconectado",
        update: "Actualizar",
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
        typeComet: 'Cometa',
        typeAsteroidBelt: 'Cinturón de Asteroides',
        typeKuiperBelt: 'Cinturón de Kuiper',
        typeOortCloud: 'Nube de Oort',
        typeConstellation: 'Constelación',
        typeExoplanet: 'Exoplaneta',
        typeDistantStar: 'Estrella Lejana',
        typeSatellite: 'Satélite',
        typeProbe: 'Sonda Espacial',
        typeOrbiter: 'Orbitador',
        typeObservatory: 'Observatorio Espacial',
        
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
        creatingOortCloud: 'Creando nube de Oort...',
        creatingStarfield: 'Creando campo estelar...',
        creatingMilkyWay: 'Creando la Vía Láctea...',
        creatingOrbitalPaths: 'Creando trayectorias orbitales...',
        creatingConstellations: 'Creando constelaciones...',
        creatingDistantStars: 'Creando estrellas distantes...',
        creatingNebulae: 'Creando nebulosas...',
        creatingGalaxies: 'Creando galaxias...',
        creatingNearbyStars: 'Creando estrellas cercanas...',
        creatingExoplanets: 'Creando exoplanetas...',
        creatingComets: 'Creando cometas...',
        creatingDwarfPlanets: 'Creando planetas enanos...',
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
        descPluto: '🪐 Plutón es un planeta enano en el Cinturón de Kuiper. Tiene un glaciar en forma de corazón (Tombaugh Regio), montañas de hielo de agua y cinco lunas. Plutón y su luna más grande, Caronte, están bloqueados por mareas: ¡siempre se muestran la misma cara!',
        funFactPluto: '¡Un año en Plutón dura 248 años terrestres! No ha completado una órbita desde su descubrimiento en 1930.',
        
        // Descripciones de lunas
        descPhobos: '¡Fobos orbita Marte más rápido de lo que Marte gira! Sale por el oeste y se pone por el este.',
        descDeimos: 'Deimos es la más pequeña de las dos lunas de Marte y tarda 30 horas en orbitar.',
        descIo: '¡Io es el cuerpo más volcánicamente activo del sistema solar!',
        descEuropa: '¡Europa tiene un océano global bajo su hielo: un lugar potencial para la vida!',
        descGanymede: '¡Ganímedes es la luna más grande del sistema solar, más grande que Mercurio!',
        descCallisto: '¡Calisto es el objeto más craterizado del sistema solar!',
        descTitan: '¡Titán tiene lagos y ríos de metano líquido: el único lugar con líquidos superficiales aparte de la Tierra!',
        descEnceladus: '¡Encélado expulsa chorros de agua al espacio desde su océano subterráneo!',
        descRhea: '¡Rea podría tener su propio sistema de anillos!',
        descTitania: '¡Titania es la luna más grande de Urano con cañones masivos!',
        descMiranda: '¡Miranda tiene el terreno más dramático del sistema solar con acantilados de 20 km de altura!',
        descTriton: '¡Tritón orbita hacia atrás y tiene géiseres de nitrógeno! Probablemente es un objeto capturado del cinturón de Kuiper.',
        descCharon: '¡Caronte es tan grande comparado con Plutón que forman un sistema binario!',
        
        // Descripciones y datos de satélites
        descISS: 'La EEI orbita a 400 km de altitud, completando una órbita cada 92,68 minutos (15,54 órbitas/día). Lanzada el 20 nov 1998 (módulo Zarya). Ensamblaje: 1998-2011 (42 vuelos: 36 Shuttle, 6 rusos). Masa: 419.725 kg. Volumen presurizado: 1.000 m³. Ocupación continua desde el 2 nov 2000 (24+ años, 9.000+ días). 280+ astronautas de 23 países la han visitado.',
        funFactISS: '¡La EEI viaja a 27.600 km/h! Los astronautas ven 16 amaneceres/atardeceres por día. ¡Ha estado continuamente ocupada durante 24+ años, más que cualquier otra nave espacial!',
        descHubble: 'Lanzado el 24 abril 1990 por el transbordador Discovery. Orbita a ~535 km de altitud. Ha realizado 1,6+ millones de observaciones hasta oct 2025. Espejo primario de 2,4m observa UV, visible e IR cercano. Cinco misiones de servicio (1993-2009) mejoraron los instrumentos.',
        funFactHubble: '¡Puede resolver objetos separados por 0,05 segundos de arco: como ver dos luciérnagas a 10.000 km! La imagen más profunda (eXtreme Deep Field) muestra 5.500 galaxias, algunas a 13,2 mil millones de años luz.',
        descGPS: 'Constelación GPS (NAVSTAR): 31 satélites operativos (oct 2025) en 6 planos orbitales, inclinación 55°. Cada satélite orbita a 20.180 km de altitud. Transmite señales banda L (1,2-1,5 GHz). Relojes atómicos de rubidio/cesio precisos a 10⁻¹⁴ segundos.',
        funFactGPS: '¡Necesita 4 satélites para posición 3D (trilateración + corrección de reloj). El sistema proporciona precisión de 5-10m. La señal militar (código P/Y) es precisa al centímetro!',
        descJWST: 'Lanzado el 25 dic 2021. Alcanzó el punto L2 el 24 ene 2022. Primeras imágenes publicadas el 12 jul 2022. Observa infrarrojo (0,6-28,5 μm). Espejo segmentado de berilio de 6,5m (18 hexágonos) con 25 m² de área colectora: ¡6x Hubble! Parasol: 21,2m × 14,2m, 5 capas.',
        funFactJWST: '¡Opera a -233°C (-388°F)! Puede detectar la firma térmica de un abejorro a distancia lunar. ¡Ha descubierto las galaxias más antiguas en z=14 (280 millones de años después del Big Bang)!',
        
        // Descripciones y datos de naves espaciales
        descVoyager1: '¡Voyager 1 es el objeto hecho por el hombre más lejano de la Tierra! Lanzada el 5 sept 1977, entró al espacio interestelar el 25 ago 2012. Actualmente a 24,3 mil millones de km (162 UA) del Sol. Lleva el Disco de Oro con sonidos e imágenes de la Tierra.',
        funFactVoyager1: '¡Voyager 1 viaja a 17 km/s (61.200 km/h). Sus señales de radio tardan 22,5 horas en llegar a la Tierra!',
        descVoyager2: '¡Voyager 2 es la única nave espacial que ha visitado los cuatro planetas gigantes! Júpiter (jul 1979), Saturno (ago 1981), Urano (ene 1986), Neptuno (ago 1989). Entró al espacio interestelar el 5 nov 2018. Ahora a 20,3 mil millones de km (135 UA) del Sol.',
        funFactVoyager2: '¡Voyager 2 descubrió 16 lunas entre los planetas gigantes, la Gran Mancha Oscura de Neptuno y los géiseres de Tritón!',
        descNewHorizons: '¡New Horizons nos dio las primeras imágenes cercanas de Plutón el 14 julio 2015! Reveló montañas de hielo de agua de hasta 3.500m de altura, vastos glaciares de nitrógeno y la famosa Tombaugh Regio en forma de corazón. Ahora a 59 UA del Sol, explorando el cinturón de Kuiper.',
        funFactNewHorizons: '¡New Horizons viajó 9,5 años y 5 mil millones de km para llegar a Plutón a 58.536 km/h. Lleva 28g de las cenizas de Clyde Tombaugh!',
        descJuno: 'Juno entró en órbita de Júpiter el 4 julio 2016. Estudia composición, campo gravitacional, campo magnético y auroras polares. Descubrió que el núcleo de Júpiter es más grande y "difuso", ciclones polares masivos y distribución de amoníaco atmosférico. Misión extendida desde 2021.',
        funFactJuno: '¡Primera nave espacial solar a Júpiter! Tres paneles solares de 9m generan 500W. ¡Lleva tres figuras LEGO: Galileo, Júpiter y Juno!',
        descCassini: 'Cassini orbitó Saturno del 30 junio 2004 al 15 sept 2017 (13 años). Descubrió lagos de metano/etano líquido en Titán, géiseres de agua en Encélado, nuevos anillos, 7 lunas nuevas. La sonda Huygens aterrizó en Titán el 14 ene 2005. Terminó con entrada atmosférica "Gran Finale".',
        funFactCassini: '¡Descubrió el océano subterráneo de Encélado! Los géiseres de agua expulsan 250kg/s al espacio. ¡Cassini voló a través de los penachos, detectó H2, compuestos orgánicos: ingredientes para la vida!',
        descPioneer10: '¡Pioneer 10 fue la primera nave espacial en cruzar el cinturón de asteroides y visitar Júpiter (3 dic 1973)! Lanzada el 2 marzo 1972, llevaba la famosa placa Pioneer mostrando humanos y la ubicación de la Tierra. Último contacto: 23 ene 2003 a 12,2 mil millones de km.',
        funFactPioneer10: '¡Pioneer 10 lleva una placa dorada diseñada por Carl Sagan mostrando un hombre, una mujer y la ubicación de la Tierra: un mensaje para extraterrestres que puedan encontrarla!',
        descPioneer11: '¡Pioneer 11 fue la primera nave espacial en visitar Saturno (1 sept 1979)! También sobrevoló Júpiter (3 dic 1974). Lanzada el 5 abril 1973, descubrió el anillo F de Saturno y una nueva luna. También lleva la placa Pioneer. Último contacto: 24 nov 1995 a 6,5 mil millones de km.',
        funFactPioneer11: '¡Pioneer 11 usó la gravedad de Júpiter para una audaz asistencia gravitacional, ahorrando años de viaje a Saturno!',
        
        // Descripciones de cometas
        descHalley: '¡El cometa Halley es el más famoso! Regresa a las cercanías de la Tierra cada 75-76 años. Visto por última vez en 1986, regresará en 2061. ¡Cuando lo ves, estás observando una bola de nieve cósmica de 4,6 mil millones de años!',
        descHaleBopp: '¡Hale-Bopp fue uno de los cometas más brillantes del siglo XX, visible a simple vista durante 18 meses en 1996-1997! Su núcleo es excepcionalmente grande con 40 km de diámetro.',
        descNeowise: '¡El cometa NEOWISE fue un espectáculo espectacular en julio 2020! No regresará hasta dentro de unos 6.800 años. Los cometas son "bolas de nieve sucias" compuestas de hielo, polvo y roca de la formación del sistema solar.',

        // Galaxias
        descAndromeda: ' ¡La galaxia de Andrómeda es nuestra gran vecina galáctica más cercana, a 2,5 millones de años luz! Contiene 1 billón de estrellas y está en curso de colisión con la Vía Láctea (no te preocupes, colisión en 4,5 mil millones de años).',
        descWhirlpool: ' ¡La galaxia del Remolino (M51) es famosa por sus hermosos brazos espirales! Está interactuando con una galaxia compañera más pequeña, creando impresionantes fuerzas de marea y nueva formación de estrellas.',
        descSombrero: ' ¡La galaxia del Sombrero parece un sombrero mexicano! Tiene un núcleo brillante, un bulbo central inusualmente grande y una banda de polvo prominente. ¡Contiene 2.000 cúmulos globulares!',

        // Nebulosas
        descOrionNebula: ' ¡La nebulosa de Orión es una guardería estelar donde nacen nuevas estrellas! Está a 1.344 años luz y es visible a simple vista como una mancha borrosa en la espada de Orión. ¡Contiene más de 3.000 estrellas!',
        descCrabNebula: ' ¡La nebulosa del Cangrejo es el remanente de una explosión de supernova observada por astrónomos chinos en 1054 d.C.! En su centro hay un pulsar que gira 30 veces por segundo!',
        descRingNebula: ' ¡La nebulosa del Anillo es una nebulosa planetaria — los restos luminosos de una estrella moribunda similar al Sol! La estrella en su centro ha soplado sus capas externas, creando este hermoso anillo.',

        // Constelaciones
        descAries: ' ¡Aries es el primer signo del zodiaco! Busca las estrellas brillantes Hamal y Sheratan. En la mitología griega, Aries representa el carnero dorado que salvó a Frixo y Hele.',
        descTaurus: ' ¡Tauro contiene la brillante estrella roja Aldebarán, el ojo del toro! También hogar del cúmulo de las Pléyades. En la mitología, Zeus se transformó en toro para conquistar a Europa.',
        descGemini: ' ¡Géminis tiene los brillantes gemelos Cástor y Pólux! En la mitología, eran hermanos inseparables, los Dióscuros, conocidos por su vínculo y valentía.',
        descCancer: ' ¡Cáncer es débil pero contiene el hermoso Cúmulo de la Colmena (M44)! En la mitología, Cáncer era el cangrejo enviado por Hera para distraer a Heracles durante su batalla.',
        descLeo: ' ¡Leo tiene la brillante estrella Régulo! El asterismo de la "Hoz" forma la cabeza del león. En la mitología, Leo representa al León de Nemea matado por Heracles.',
        descVirgo: ' ¡Virgo es la segunda constelación más grande! La brillante estrella Espiga representa trigo en la mano de la doncella. ¡Hogar de miles de galaxias en el Cúmulo de Virgo!',
        descLibra: ' ¡Libra representa las balanzas de la justicia! Sus estrellas más brillantes son Zubenelgenubi y Zubeneschamali, que significan "garra del sur" y "garra del norte" en árabe.',
        descScorpius: ' ¡Escorpio representa el escorpión que mató a Orión en la mitología griega! La brillante estrella roja Antares marca el corazón del escorpión. ¡Busca la cola curvada con el aguijón!',
        descSagittarius: ' ¡Sagitario apunta su flecha al corazón de Escorpio! El asterismo de la "Tetera" es fácil de detectar. ¡Apunta hacia el centro de nuestra galaxia Vía Láctea!',
        descCapricornus: ' ¡Capricornio es una de las constelaciones más antiguas! Representa una criatura con cabeza de cabra y cola de pez. Asociado con el dios Pan en la mitología griega.',
        descAquarius: ' ¡Acuario representa al portador de agua vertiendo de su urna! Hogar de varios famosos objetos de cielo profundo incluyendo la Nebulosa Hélice. Una de las constelaciones nombradas más antiguas.',
        descPisces: ' ¡Piscis muestra dos peces atados juntos! Representa a Afrodita y Eros que se transformaron en peces para escapar del monstruo Tifón. ¡Contiene el punto equinoccial vernal!',
        descOrion: ' ¡Orión es una de las constelaciones más reconocibles! Busca las tres estrellas en fila formando el Cinturón de Orión. La brillante estrella roja Betelgeuse marca su hombro y el azul Rigel su pie.',
        descUrsaMajor: ' ¡La Osa Mayor (Carro Mayor) es una de las constelaciones más conocidas! Las dos estrellas al final de la "taza" apuntan a Polaris, la Estrella Polar. ¡Usada para navegación durante miles de años!',
        descUrsaMajorFull: ' ¡Ursa Major (la Osa Mayor) es la tercera constelación más grande del cielo! Contiene el famoso asterismo del Carro Mayor que forma el lomo y la cola del oso. Con 16 estrellas principales trazando una forma de oso incluyendo cabeza, cuerpo y patas, ha sido reconocida por culturas de todo el mundo durante miles de años. ¡Dubhe y Merak son las "estrellas apuntadoras" que guían hacia Polaris!',
        descUrsaMinor: ' ¡La Osa Menor contiene Polaris, la Estrella Polar! Polaris marca el extremo del mango de la Osa Menor y permanece casi fijo en el cielo norte. ¡Esencial para la navegación celeste!',
        descCrux: ' ¡La Cruz del Sur es la constelación más pequeña pero una de las más famosas en el hemisferio sur! Usada para navegación, apunta hacia el Polo Celeste Sur.',
        descBigDipper: ' ¡El Carro Mayor es el asterismo más reconocido del cielo norte! Siete estrellas brillantes forman una forma de cazo — las "estrellas apuntadoras" Dubhe y Merak en el extremo de la taza apuntan directamente a Polaris, la Estrella Polar. ¡Usado para navegación durante miles de años!',
        descLittleDipper: ' ¡La Osa Menor contiene Polaris, la Estrella Polar! Polaris marca el extremo del mango de la Osa Menor y permanece casi fijo en el cielo norte. ¡Esencial para la navegación celeste!',
        descSouthernCross: ' ¡La Cruz del Sur es la constelación más pequeña pero una de las más famosas en el hemisferio sur! Usada para navegación, apunta hacia el Polo Celeste Sur.',
        descCassiopeia: ' ¡Casiopea parece una W o M según la estación! En la mitología griega, Casiopea era una reina vanidosa. La constelación es circumpolar en latitudes norteñas.',
        descCygnus: ' ¡Cisne el Cisne vuela a lo largo de la Vía Láctea! También llamado la Cruz del Norte. En la mitología, Zeus se disfrazó de cisne. ¡Hogar de muchos objetos de cielo profundo!',
        descLyra: ' ¡Lira representa la lira de Orfeo! Contiene Vega, la 5ª estrella más brillante en el cielo nocturno. ¡También hogar de la Nebulosa del Anillo, una famosa nebulosa planetaria!',
        descAndromedaConst: ' ¡Andrómeda era la princesa encadenada a una roca y rescatada por Perseo! Esta constelación contiene la Galaxia de Andrómeda (M31), nuestra gran galaxia vecina más cercana!',
        descPerseus: ' ¡Perseo el héroe que mató a Medusa! Hogar de la brillante estrella Mirfak y la famosa estrella variable Algol ("Estrella Demonio"). ¡Contiene el Doble Cúmulo!',
        descOrionsBelt: ' ¡El Cinturón de Orión es uno de los asterismos más reconocibles del cielo nocturno! Tres estrellas brillantes — Alnitak, Alnilam y Mintaka — forman una línea casi perfecta. ¡Los antiguos egipcios alinearon las Grandes Pirámides de Guiza para reflejar estas tres estrellas!',
        descCanisMajor: ' ¡Can Mayor alberga a Sirio, la estrella más brillante de todo el cielo nocturno! Conocida como la "Estrella del Perro," Sirio ha sido importante para las civilizaciones a lo largo de la historia. Los antiguos egipcios basaron su calendario en su aparición. ¡La constelación representa uno de los perros de caza de Orión!',
        descAquila: ' ¡Aquila el Águila se eleva a lo largo de la Vía Láctea! Su estrella más brillante Altair completa el famoso Triángulo de Verano con Vega (Lira) y Deneb (Cisne). ¡Altair gira tan rápido que se abulta en su ecuador! En la mitología, Aquila llevaba los rayos de Zeus.',
        descPegasus: ' ¡Pegaso el Caballo Alado presenta el Gran Cuadrado de Pegaso — uno de los patrones estelares más reconocibles del otoño! En la mitología griega, Pegaso surgió de Medusa cuando Perseo la mató. La estrella Enif marca la nariz del caballo.',

        // Estrellas cercanas
        descSirius: ' ¡Sirio es la estrella más brillante en el cielo nocturno de la Tierra! En realidad es un sistema binario de dos estrellas. Ubicada a 8,6 años luz en la constelación del Can Mayor.',
        descBetelgeuse: ' ¡Betelgeuse es una supergigante roja que se acerca al final de su vida! Es tan grande que si se colocara en la posición de nuestro Sol, se extendería más allá de Marte. ¡Algún día explotará como supernova!',
        descRigel: ' ¡Rigel es una supergigante azul, una de las estrellas más luminosas visibles a simple vista! Es 40.000 veces más luminosa que nuestro Sol y está a 860 años luz.',
        descVega: ' ¡Vega es una de las estrellas más brillantes en el cielo del norte! Fue la Estrella Polar hace 12.000 años y lo será nuevamente en 13.000 años debido a la precesión axial de la Tierra.',
        descPolaris: ' ¡Polaris, la Estrella Polar, ha guiado a los viajeros por siglos! En realidad es un sistema triple de estrellas y actualmente está muy cerca del norte verdadero.',
        descAlphaCentauriA: ' ¡Alfa Centauri A es muy similar a nuestro Sol! Forma parte de un sistema triple de estrellas que es nuestro vecino estelar más cercano a 4,37 años luz. Con su compañera Alfa Centauri B, se orbitan mutuamente cada 80 años.',
        descProximaCentauri: ' ¡Próxima Centauri es una pequeña enana roja y la estrella más cercana a nuestro Sistema Solar a solo 4,24 años luz! Es mucho más fría y tenue que nuestro Sol, pero tiene al menos dos planetas, incluyendo el potencialmente habitable Próxima Centauri b.',

        // Estrellas con exoplanetas
        descKepler452Star: ' ¡Kepler-452 es una estrella similar al Sol que alberga el planeta "primo de la Tierra" Kepler-452b! Es 1.500 millones de años más vieja que nuestro Sol y 20% más brillante.',
        descTrappist1Star: ' ¡TRAPPIST-1 es una enana roja ultrafría con 7 planetas del tamaño de la Tierra! Tres de ellos están en la zona habitable. Todo el sistema es tan compacto que los 7 planetas orbitan más cerca de su estrella que Mercurio de nuestro Sol.',
        descKepler186Star: ' ¡Kepler-186 es una enana roja con 5 planetas conocidos! Kepler-186f fue el primer planeta del tamaño de la Tierra descubierto en la zona habitable de otra estrella.',

        // Exoplanetas
        descProximaCentauriB: ' ¡Próxima Centauri b es el exoplaneta conocido más cercano a la Tierra! Orbita en la zona habitable de Próxima Centauri, lo que significa que podría existir agua líquida en su superficie.',
        descKepler452b: ' ¡Kepler-452b se llama "el primo de la Tierra"! Es aproximadamente un 60% más grande que la Tierra y orbita una estrella similar al Sol en la zona habitable. Su año dura 385 días.',
        descTrappist1e: ' ¡TRAPPIST-1e es parte de un sistema increíble con 7 planetas del tamaño de la Tierra! Orbita una fría enana roja y está en la zona habitable.',
        descKepler186f: ' ¡Kepler-186f fue el primer planeta del tamaño de la Tierra descubierto en la zona habitable de otra estrella! Recibe aproximadamente un tercio de la luz que la Tierra obtiene del Sol.',

        // Planetas enanos
        descCeres: ' ¡Ceres es el objeto más grande del cinturón de asteroides y un planeta enano! La sonda Dawn de la NASA reveló misteriosas manchas brillantes en el cráter Occator — resultaron ser depósitos de sal de antiguas salmueras.',
        descHaumea: ' ¡Haumea gira tan rápido (una vez cada 4 horas) que ha sido aplastada hasta tener forma de huevo! También tiene dos lunas y un sistema de anillos, lo que la hace muy inusual entre los planetas enanos.',
        descMakemake: ' ¡Makemake es un mundo brillante y rojizo en el Cinturón de Kuiper descubierto cerca de la Pascua de 2005, nombrado por el dios creador del pueblo Rapa Nui de la Isla de Pascua.',
        descEris: ' ¡Eris es ligeramente más pequeña que Plutón pero más masiva! Su descubrimiento en 2005 llevó directamente a la reclasificación de Plutón como planeta enano. Tiene una luna, Disnomia.',
        descSedna: ' ¡Sedna tiene una de las órbitas elípticas más extremas del sistema solar, que va de 76 a 937 UA. Tarda unos 11.400 años en completar una órbita y es tan roja que rivaliza con Marte en color!',

        // Cometas adicionales
        descHyakutake: ' ¡El cometa Hyakutake pasó extremadamente cerca de la Tierra en 1996, convirtiéndose en uno de los cometas más brillantes en décadas con una cola que se extendía por la mitad del cielo!',
        descLovejoy: ' ¡El cometa Lovejoy (C/2011 W3) sobrevivió un paso cercano a través de la corona del Sol! Es parte de los rasadores solares de Kreutz — fragmentos de un enorme cometa que se fragmentó hace siglos.',
        descEncke: ' ¡El cometa Encke tiene el período orbital más corto de todos los cometas conocidos — solo 3,3 años! Lleva el nombre de Johann Franz Encke, quien calculó su órbita en 1819.',
        descSwiftTuttle: ' ¡El cometa Swift-Tuttle es el cuerpo padre del espectacular lluvia de meteoritos de las Perseidas! Con un núcleo de 26 km, es el objeto más grande que pasa regularmente cerca de la Tierra.',

        // Cinturón de asteroides / Cinturón de Kuiper / Nube de Oort
        descAsteroidBelt: ' ¡El cinturón de asteroides contiene millones de objetos rocosos entre Marte y Júpiter. ¡Ceres, el objeto más grande aquí, es un planeta enano! La mayoría de los asteroides son material residual de la formación del sistema solar hace 4.600 millones de años.',
        descKuiperBelt: ' ¡El Cinturón de Kuiper es una región más allá de Neptuno llena de cuerpos helados y planetas enanos incluyendo Plutón! Es como una enorme dona de objetos congelados sobrantes de la formación del sistema solar. ¡Los cometas de período corto vienen de aquí!',
        descOortCloud: ' ¡La Nube de Oort es una vasta envoltura esférica de objetos helados que rodea todo nuestro sistema solar! Se extiende desde aproximadamente 50.000 hasta 200.000 UA del Sol. ¡Los cometas de período largo como Hale-Bopp se originan en este reino distante.',

        // Datos curiosos para objetos adicionales
        funFactAsteroidBelt: '¡Al contrario de lo que muestran las películas, los asteroides están muy lejos unos de otros - las naves espaciales pueden atravesarlos con seguridad!',
        funFactKuiperBelt: '¡El cinturón de Kuiper es 20 veces más ancho que el cinturón de asteroides y contiene miles de millones de objetos!',
        funFactOortCloud: '¡La nube de Oort está tan lejos que la luz del Sol tarda más de 1,5 años en alcanzar su borde exterior! Voyager 1 tardaría unos 300 años en alcanzar el borde interior.',
        funFactCeres: '¡Ceres podría albergar agua líquida subterránea - un candidato principal para la vida!',
        funFactHaumea: '¡Un período de rotación de ~4 horas le da a Haumea su forma única de elipsoide triaxial como un huevo!',
        funFactMakemake: '¡Descubierto cerca de la Pascua de 2005, Makemake lleva el nombre del dios creador del pueblo Rapa Nui!',
        funFactEris: '¡El descubrimiento de Eris llevó directamente a la reclasificación de Plutón como planeta enano en 2006!',
        funFactSedna: '¡Sedna tarda 11.400 años en completar una órbita - posiblemente influenciada por un Planeta Nueve invisible!',
        funFactAlphaCentauriA: '¡Alfa Centauri es visible desde el hemisferio sur y es la tercera estrella más brillante en nuestro cielo nocturno!',
        funFactProximaCentauri: '¡A pesar de ser nuestra estrella más cercana, Próxima es demasiado tenue para verla a simple vista!',
        funFactSirius: '¡Sirio se está acercando a nosotros - estará más cerca en unos 60.000 años!',
        funFactBetelgeuse: '¡Betelgeuse podría explotar como supernova en cualquier momento (hablando astronómicamente - mañana o en 100.000 años)!',
        funFactDefaultStar: '¡Esta estrella es visible a simple vista desde la Tierra!',
        funFactOrionNebula: '¡En la nebulosa de Orión están naciendo nuevas estrellas ahora mismo!',
        funFactCrabNebula: '¡El púlsar de la Nebulosa del Cangrejo gira 30 veces por segundo y se expande a 1.500 km/s!',
        funFactRingNebula: '¡Las nebulosas planetarias no tienen nada que ver con los planetas - solo parecen redondas como planetas a través de telescopios antiguos!',
        funFactAndromedaGalaxy: '¡La galaxia de Andrómeda se aproxima a nosotros a 110 km/s!',
        funFactWhirlpoolGalaxy: '¡Puedes ver la galaxia del Remolino con unos buenos prismáticos!',
        funFactSombreroGalaxy: '¡A pesar de miles de millones de estrellas, la galaxia del Sombrero también es principalmente espacio vacío!',
        funFactTrappist1Star: '¡TRAPPIST-1 lleva el nombre del telescopio que lo descubrió - The TRAnsiting Planets and PlanetesImals Small Telescope!',
        funFactKepler452Star: '¡Kepler-452 tiene 6 mil millones de años - nos muestra cómo podría ser nuestro Sol en 1.500 millones de años!',
        funFactKepler186Star: '¡Las plantas en Kepler-186f probablemente realizarían la fotosíntesis usando luz infrarroja y aparecerían de color rojo oscuro o negro!',
        funFactProximaCentauriB: '¡Con la tecnología actual, tomaría 6.300 años llegar a Próxima b!',
        funFactKepler452b: '¡Kepler-452b tiene 6 mil millones de años - 1.500 millones más que la Tierra!',
        funFactTrappist1e: '¡Desde TRAPPIST-1e, podrías ver los otros planetas tan grandes como nuestra Luna en el cielo!',
        funFactKepler186f: '¡Kepler-186f orbita una enana roja, así que su cielo brillaría con un tono anaranjado-rojizo!',
        funFactComets: '¡Los cometas tienen dos colas: una cola de polvo curva (amarillenta) y una cola iónica recta (azul) - ambas siempre apuntan alejándose del Sol!',
        descOrcus: 'Orcus es un gran objeto del Cinturón de Kuiper en resonancia orbital 2:3 con Neptuno, igual que Plutón. Tiene su propia luna llamada Vanth.',
        funFactOrcus: '¡Orcus a veces se llama anti-Plutón — sus órbitas son casi imágenes especulares perfectas entre sí, en lados opuestos del Sol!',
        descQuaoar: 'Quaoar es un gran objeto del Cinturón de Kuiper con su propia luna Weywot. Notablemente, posee un sistema de anillos — el primero descubierto alrededor de un objeto del Cinturón de Kuiper.',
        funFactQuaoar: '¡El anillo de Quaoar orbita mucho más allá de su límite de Roche, donde los anillos no deberían poder existir — un misterio que desafía nuestra comprensión de la formación de anillos!',
        descGonggong: 'Gonggong (antes 2007 OR10) es un objeto distante del disco disperso con una superficie rojiza causada por hielo de metano alterado por radiación. Tiene una luna llamada Xiangliu.',
        funFactGonggong: '¡Gonggong lleva el nombre de un dios del agua chino que, según la mitología, inclinó la Tierra al chocar contra un pilar que sostenía el cielo!',
        descSalacia: 'Salacia es un objeto oscuro del Cinturón de Kuiper con una luna llamada Actaea. Es uno de los objetos transneptunianos más grandes que aún no ha sido clasificado como planeta enano.',
        funFactSalacia: '¡Salacia lleva el nombre de la diosa romana del mar y esposa de Neptuno — apropiado para un mundo helado que orbita en el reino de los planetas más lejanos!',
        descVarda: 'Varda es un objeto binario del Cinturón de Kuiper emparejado con su gran luna Ilmarë. Midiendo su órbita mutua, los científicos pueden calcular con precisión la masa combinada del sistema.',
        funFactVarda: '¡Varda lleva el nombre de la Reina de las Estrellas en la mitología de Tolkien — la deidad que moldeó las estrellas y las colocó en el cielo de la Tierra Media!',
        descVaruna: 'Varuna es un objeto clásico del Cinturón de Kuiper conocido por su rotación extremadamente rápida — completando una vuelta completa en solo 6,3 horas, una de las más rápidas del sistema solar exterior.',
        funFactVaruna: '¡Varuna gira tan rápido que se abomba en el ecuador, dándole la forma de una pelota aplastada — su diámetro ecuatorial es notablemente mayor que su diámetro polar!'
    },
    
    pt: {
        // Título e cabeçalho do aplicativo
        appTitle: "Viagem Espacial",
        subtitle: "Sistema Solar 3D Interativo",
        
        // Navegação
        quickNavigation: "Navegação",
        search: "Pesquisar...",
        searchObjects: "🔍 Pesquisar objetos...",
        
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
        neptuneSystem: "Sistema Neptuniano",
        neptune: "Netuno",
        pluto: "Plutão",
        charon: "Caronte",
        enceladus: "Encélado",
        rhea: "Reia",
        titania: "Titania",
        miranda: "Miranda",
        triton: "Tritão",
        // Planetas anões
        ceres: 'Ceres', haumea: 'Haumea', makemake: 'Makemake', eris: 'Éris',
        orcus: 'Orcus', quaoar: 'Quaoar', gonggong: 'Gonggong', sedna: 'Sedna',
        salacia: 'Salacia', varda: 'Varda', varuna: 'Varuna',
        // Cometas
        halley: 'Cometa Halley', haleBopp: 'Hale-Bopp', hyakutake: 'Hyakutake',
        lovejoy: 'Lovejoy', encke: 'Encke', swiftTuttle: 'Swift-Tuttle',
        // Estrelas próximas
        alphaCentauri: 'Alfa do Centauro',
        // Exoplanetas
        proximaB: 'Próxima Centauri b', kepler452b: 'Kepler-452b',
        trappist1e: 'TRAPPIST-1e', kepler186f: 'Kepler-186f',
        // Outras constelações
        bigDipper: 'Ursa Maior', littleDipper: 'Ursa Menor', southernCross: 'Cruzeiro do Sul',
        orionsBelt: 'Cinturão de Órion', ursaMajor: 'Ursa Major',
        canisMajor: 'Cão Maior', aquila: 'Águia', pegasus: 'Pégaso',
        // Naves espaciais
        iss: 'ISS', hubble: 'Hubble',
        jwst: 'Telescópio Espacial James Webb', gpsNavstar: 'Satélite GPS (NAVSTAR)',
        voyager1: 'Voyager 1', voyager2: 'Voyager 2', newHorizons: 'New Horizons',
        juno: 'Juno (Júpiter)', cassini: 'Cassini (Saturno)', pioneer10: 'Pioneer 10', pioneer11: 'Pioneer 11',
        
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
        oortCloud: "Nuvem de Oort",
        asteroidBelt: "Cinturão de Asteroides",
        // Nebulosas
        orionNebula: 'Nebulosa de Órion',
        crabNebula: 'Nebulosa do Caranguejo',
        ringNebula: 'Nebulosa do Anel',
        // Galáxias
        andromedaGalaxy: 'Galáxia de Andrômeda',
        whirlpoolGalaxy: 'Galáxia do Redemoinho',
        sombreroGalaxy: 'Galáxia do Sombrero',
        // Constelações
        aries: 'Áries', taurus: 'Touro', gemini: 'Gêmeos', cancer: 'Câncer',
        leo: 'Leão', virgo: 'Virgem', libra: 'Libra', scorpius: 'Escorpião',
        sagittarius: 'Sagitário', capricornus: 'Capricórnio', aquarius: 'Aquário',
        pisces: 'Peixes', orion: 'Órion', cassiopeia: 'Cassiopeia',
        cygnus: 'Cisne', lyra: 'Lira', andromeda: 'Andrômeda', andromedaConst: 'Andrômeda', perseus: 'Perseu',
        // Estrelas próximas e hospedeiras de exoplanetas
        alphaCentauriA: 'Alpha Centauri A',
        proximaCentauri: 'Proxima Centauri',
        kepler452Star: 'Kepler-452',
        trappist1Star: 'TRAPPIST-1',
        kepler186Star: 'Kepler-186',
        plutoSystem: "Sistema de Plutão",
        outerSolarSystem: "Sistema Solar Exterior",
        comets: "Cometas",
        dwarfPlanets: "Planetas Anões e Candidatos",
        constellationsZodiac: "Constelações (Zodíaco)",
        constellationsOther: "Constelações (Outras)",
        
        // Botões de controle
        toggleOrbits: "Órbitas",
        toggleConstellations: "Constelações",
        toggleScale: "Compacto",
        toggleScaleRealistic: "Expandido",
        toggleScaleScientific: "Científico",
        toggleLabels: "Rótulos DESLIGADOS",
        toggleLabelsOn: "Rótulos LIGADOS",
        toggleSoundOn: "Som LIGADO",
        toggleSoundOff: "Som DESLIGADO",
        resetView: "Redefinir",
        enterVR: "Entrar em RV",
        enterAR: "Entrar em RA",
        randomDiscovery: "Descobrir",

        // Dicas da barra inferior
        tooltipOrbits: "Mostrar/ocultar trajetórias orbitais (O)",
        tooltipConstellations: "Mostrar/ocultar constelações (C)",
        tooltipLabels: "Alternar etiquetas de objetos (D)",
        tooltipScale: "Alternar entre modos compacto, expandido e científico (S)",
        tooltipSound: "Ativar/desativar efeitos sonoros",
        tooltipReset: "Redefinir câmera para vista padrão (R)",
        tooltipDiscover: "Surpreenda-me! Saltar para um objeto aleatório",
        tooltipHelp: "Mostrar controles e funcionalidades (H)",
        
        // Integração
        welcomeToSpace: "🚀 Bem-vindo à Viagem Espacial!",
        skip: "Pular",
        next: "Próximo",
        startExploring: "Começar a explorar! 🌟",
        onboardingNav: "Navegar pelo Universo",
        onboardingNavDesc: "Arrastar para girar • Rolar para dar zoom • Clicar com botão direito para deslocar",
        onboardingExplore: "Explorar Objetos",
        onboardingExploreDesc: "Clique em qualquer planeta, lua ou estrela para aprender fatos fascinantes!",
        onboardingQuickNav: "Navegação Rápida",
        onboardingQuickNavDesc: "Use o menu suspenso para ir diretamente a qualquer objeto",
        
        // Gestos móveis
        pinchToZoom: "Beliscar para dar zoom",
        dragToRotate: "Arrastar para girar",
        
        // Carregamento
        preparingJourney: "Preparando sua viagem espacial...",
        defaultFact: "O Sol contém 99,86% da massa do Sistema Solar!",
        
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
        install: "Instalar",
        installLater: "Talvez Mais Tarde",
        notNow: "Agora Não",
        offlineMode: "Você está offline",
        update: "Atualizar",
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
        typeComet: 'Cometa',
        typeAsteroidBelt: 'Cinturão de Asteroides',
        typeKuiperBelt: 'Cinturão de Kuiper',
        typeOortCloud: 'Nuvem de Oort',
        typeConstellation: 'Constelação',
        typeExoplanet: 'Exoplaneta',
        typeDistantStar: 'Estrela Distante',
        typeSatellite: 'Satélite',
        typeProbe: 'Sonda Espacial',
        typeOrbiter: 'Orbitador',
        typeObservatory: 'Observatório Espacial',
        
        // Descrições de objetos
        descSun: 'O Sol é uma estrela de tipo G (anã amarela) contendo 99,86% da massa do Sistema Solar. Temperatura da superfície: 5.778 K. Idade: 4,6 bilhões de anos. Ele funde 600 milhões de toneladas de hidrogênio em hélio a cada segundo!',
        descMercury: 'Mercúrio é o menor planeta e o mais próximo do Sol. Sua superfície é coberta com crateras como nossa Lua. A temperatura varia de -180°C à noite a 430°C durante o dia - a maior variação de temperatura no sistema solar!',
        descVenus: 'Vênus é o planeta mais quente com temperatura de superfície de 465°C devido a um efeito estufa extremo. Sua atmosfera é 96% CO2 com nuvens de ácido sulfúrico. Vênus gira para trás e não tem luas - um dos únicos dois planetas sem nenhuma!',
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
        creatingOortCloud: 'Criando nuvem de Oort...',
        creatingStarfield: 'Criando campo estelar...',
        creatingMilkyWay: 'Criando a Via Láctea...',
        creatingOrbitalPaths: 'Criando trajetórias orbitais...',
        creatingConstellations: 'Criando constelações...',
        creatingDistantStars: 'Criando estrelas distantes...',
        creatingNebulae: 'Criando nebulosas...',
        creatingGalaxies: 'Criando galáxias...',
        creatingNearbyStars: 'Criando estrelas próximas...',
        creatingExoplanets: 'Criando exoplanetas...',
        creatingComets: 'Criando cometas...',
        creatingDwarfPlanets: 'Criando planetas anões...',
        creatingLabels: 'Criando rótulos...',
        creatingSatellites: 'Criando satélites...',
        creatingSpacecraft: 'Criando naves espaciais...',
        
        // Texto do sistema
        centerSolarSystem: 'Centro do Sistema Solar',
        orbitsParent: 'Órbita',
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
        descPluto: '🪐 Plutão é um planeta anão no Cinturão de Kuiper. Ele tem uma geleira em forma de coração (Tombaugh Regio), montanhas de gelo de água e cinco luas. Plutão e sua maior lua, Caronte, estão travados por maré - sempre mostram a mesma face um ao outro!',
        funFactPluto: 'Um ano em Plutão dura 248 anos terrestres! Ele não completou uma órbita desde sua descoberta em 1930.',
        
        // Descrições de luas
        descPhobos: 'Fobos orbita Marte mais rápido do que Marte gira! Ele nasce no oeste e se põe no leste.',
        descDeimos: 'Deimos é a menor das duas luas de Marte e leva 30 horas para orbitar.',
        descIo: 'Io é o corpo mais vulcanicamente ativo do sistema solar!',
        descEuropa: 'Europa tem um oceano global sob seu gelo - um local potencial para vida!',
        descGanymede: 'Ganimedes é a maior lua do sistema solar, maior que Mercúrio!',
        descCallisto: 'Calisto é o objeto mais repleto de crateras no sistema solar!',
        descTitan: 'Titã tem lagos e rios de metano líquido - o único lugar com líquidos na superfície além da Terra!',
        descEnceladus: 'Encélado expele jatos de água para o espaço de seu oceano subterrâneo!',
        descRhea: 'Reia pode ter seu próprio sistema de anéis!',
        descTitania: 'Titania é a maior lua de Urano com cânions maciços!',
        descMiranda: 'Miranda tem o terreno mais dramático do sistema solar com falésias de 20 km de altura!',
        descTriton: 'Tritão orbita para trás e tem gêiseres de nitrogênio! Provavelmente é um objeto capturado do cinturão de Kuiper.',
        descCharon: 'Caronte é tão grande comparado a Plutão que eles formam um sistema binário!',
        
        // Descrições e fatos de satélites
        descISS: 'A ISS orbita a 400 km de altitude, completando uma órbita a cada 92,68 minutos (15,54 órbitas/dia). Lançada em 20 nov 1998 (módulo Zarya). Montagem: 1998-2011 (42 voos: 36 Shuttle, 6 russos). Massa: 419.725 kg. Volume pressurizado: 1.000 m³. Ocupação contínua desde 2 nov 2000 (24+ anos, 9.000+ dias). 280+ astronautas de 23 países a visitaram.',
        funFactISS: 'A ISS viaja a 27.600 km/h! Os astronautas veem 16 nascer/pôr do sol por dia. Ela está continuamente ocupada há 24+ anos - mais do que qualquer outra nave espacial!',
        descHubble: 'Lançado em 24 abril 1990 pelo ônibus Discovery. Orbita a ~535 km de altitude. Realizou 1,6+ milhões de observações até out 2025. Espelho primário de 2,4m observa UV, visível e IV próximo. Cinco missões de serviço (1993-2009) melhoraram os instrumentos.',
        funFactHubble: 'Pode resolver objetos separados por 0,05 segundos de arco - como ver dois vaga-lumes a 10.000 km! A imagem mais profunda (eXtreme Deep Field) mostra 5.500 galáxias, algumas a 13,2 bilhões de anos-luz.',
        descGPS: 'Constelação GPS (NAVSTAR): 31 satélites operacionais (out 2025) em 6 planos orbitais, inclinação 55°. Cada satélite orbita a 20.180 km de altitude. Transmite sinais banda L (1,2-1,5 GHz). Relógios atômicos de rubídio/césio precisos a 10⁻¹⁴ segundos.',
        funFactGPS: 'Precisa de 4 satélites para posição 3D (trilateração + correção de relógio). O sistema fornece precisão de 5-10m. O sinal militar (código P/Y) é preciso ao centímetro!',
        descJWST: 'Lançado em 25 dez 2021. Alcançou o ponto L2 em 24 jan 2022. Primeiras imagens publicadas em 12 jul 2022. Observa infravermelho (0,6-28,5 μm). Espelho segmentado de berílio de 6,5m (18 hexágonos) com 25 m² de área coletora - 6x Hubble! Protetor solar: 21,2m × 14,2m, 5 camadas.',
        funFactJWST: 'Opera a -233°C (-388°F)! Pode detectar a assinatura térmica de um zangão à distância lunar. Descobriu as galáxias mais antigas em z=14 (280 milhões de anos após o Big Bang)!',
        
        // Descrições e fatos de naves espaciais
        descVoyager1: 'Voyager 1 é o objeto feito pelo homem mais distante da Terra! Lançada em 5 set 1977, entrou no espaço interestelar em 25 ago 2012. Atualmente a 24,3 bilhões de km (162 UA) do Sol. Carrega o Disco de Ouro com sons e imagens da Terra.',
        funFactVoyager1: 'Voyager 1 viaja a 17 km/s (61.200 km/h). Seus sinais de rádio levam 22,5 horas para chegar à Terra!',
        descVoyager2: 'Voyager 2 é a única nave espacial a visitar todos os quatro planetas gigantes! Júpiter (jul 1979), Saturno (ago 1981), Urano (jan 1986), Netuno (ago 1989). Entrou no espaço interestelar em 5 nov 2018. Agora a 20,3 bilhões de km (135 UA) do Sol.',
        funFactVoyager2: 'Voyager 2 descobriu 16 luas entre os planetas gigantes, a Grande Mancha Escura de Netuno e os gêiseres de Tritão!',
        descNewHorizons: 'New Horizons nos deu as primeiras imagens próximas de Plutão em 14 julho 2015! Revelou montanhas de gelo de água de até 3.500m de altura, vastas geleiras de nitrogênio e a famosa Tombaugh Regio em forma de coração. Agora a 59 UA do Sol, explorando o cinturão de Kuiper.',
        funFactNewHorizons: 'New Horizons viajou 9,5 anos e 5 bilhões de km para chegar a Plutão a 58.536 km/h. Carrega 28g das cinzas de Clyde Tombaugh!',
        descJuno: 'Juno entrou em órbita de Júpiter em 4 julho 2016. Estuda composição, campo gravitacional, campo magnético e auroras polares. Descobriu que o núcleo de Júpiter é maior e "difuso", ciclones polares maciços e distribuição de amônia atmosférica. Missão estendida desde 2021.',
        funFactJuno: 'Primeira nave espacial solar para Júpiter! Três painéis solares de 9m geram 500W. Carrega três figuras LEGO: Galileu, Júpiter e Juno!',
        descCassini: 'Cassini orbitou Saturno de 30 junho 2004 a 15 set 2017 (13 anos). Descobriu lagos de metano/etano líquido em Titã, gêiseres de água em Encélado, novos anéis, 7 novas luas. A sonda Huygens pousou em Titã em 14 jan 2005. Terminou com entrada atmosférica "Grand Finale".',
        funFactCassini: 'Descobriu o oceano subterrâneo de Encélado! Os gêiseres de água expelem 250kg/s para o espaço. Cassini voou através das plumas, detectou H2, compostos orgânicos - ingredientes para a vida!',
        descPioneer10: 'Pioneer 10 foi a primeira nave espacial a cruzar o cinturão de asteroides e visitar Júpiter (3 dez 1973)! Lançada em 2 março 1972, carregava a famosa placa Pioneer mostrando humanos e a localização da Terra. Último contato: 23 jan 2003 a 12,2 bilhões de km.',
        funFactPioneer10: 'Pioneer 10 carrega uma placa dourada projetada por Carl Sagan mostrando um homem, uma mulher e a localização da Terra - uma mensagem para alienígenas que possam encontrá-la!',
        descPioneer11: 'Pioneer 11 foi a primeira nave espacial a visitar Saturno (1 set 1979)! Também sobrevoou Júpiter (3 dez 1974). Lançada em 5 abril 1973, descobriu o anel F de Saturno e uma nova lua. Também carrega a placa Pioneer. Último contato: 24 nov 1995 a 6,5 bilhões de km.',
        funFactPioneer11: 'Pioneer 11 usou a gravidade de Júpiter para uma ousada assistência gravitacional, economizando anos de viagem para Saturno!',
        
        // Descrições de cometas
        descHalley: 'O cometa Halley é o mais famoso! Ele retorna às proximidades da Terra a cada 75-76 anos. Visto pela última vez em 1986, retornará em 2061. Quando você o vê, está observando uma bola de neve cósmica de 4,6 bilhões de anos!',
        descHaleBopp: 'Hale-Bopp foi um dos cometas mais brilhantes do século 20, visível a olho nu por 18 meses em 1996-1997! Seu núcleo é excepcionalmente grande com 40 km de diâmetro.',
        descNeowise: 'O cometa NEOWISE foi um espetáculo espetacular em julho de 2020! Ele não voltará por cerca de 6.800 anos. Cometas são "bolas de neve sujas" compostas de gelo, poeira e rocha da formação do sistema solar.',

        // Galáxias
        descAndromeda: ' A Galáxia de Andrômeda é nossa grande vizinha galáctica mais próxima, a 2,5 milhões de anos-luz! Ela contém 1 trilhão de estrelas e está em curso de colisão com a Via Láctea (não se preocupe, colisão em 4,5 bilhões de anos).',
        descWhirlpool: ' A Galáxia do Redemoinho (M51) é famosa por seus belos braços espirais! Está interagindo com uma galáxia companheira menor, criando forças de maré impressionantes e nova formação de estrelas.',
        descSombrero: ' A Galáxia do Sombrero parece um chapéu mexicano! Tem um núcleo brilhante, um bulbo central invulgarmente grande e uma faixa de poeira proeminente. Contém 2.000 aglomerados globulares!',

        // Nebulosas
        descOrionNebula: ' A Nebulosa de Órion é um berçário estelar onde novas estrelas nascem! Está a 1.344 anos-luz e é visível a olho nu como uma névoa na espada de Órion. Contém mais de 3.000 estrelas!',
        descCrabNebula: ' A Nebulosa do Caranguejo é o remanescente de uma explosão de supernova observada por astrônomos chineses em 1054 d.C.! Em seu centro há um pulsar girando 30 vezes por segundo!',
        descRingNebula: ' A Nebulosa do Anel é uma nebulosa planetária — os restos brilhantes de uma estrela semelhante ao Sol em extinção! A estrela em seu centro soprou suas camadas externas, criando esse belo anel.',

        // Constelações
        descAries: ' Áries é o primeiro signo do zodíaco! Procure as estrelas brilhantes Hamal e Sheratan. Na mitologia grega, Áries representa o carneiro dourado que salvou Frixo e Hele.',
        descTaurus: ' Touro contém a brilhante estrela vermelha Aldebaran, o olho do touro! Também lar das Plêiades. Na mitologia, Zeus se transformou em touro para conquistar Europa.',
        descGemini: ' Gêmeos tem os brilhantes gêmeos Cástor e Pólux! Na mitologia, eles eram irmãos inseparáveis, os Dióscuros, conhecidos por seu vínculo e bravura.',
        descCancer: ' Câncer é fraco mas contém o lindo Aglomerado da Colmeia (M44)! Na mitologia, Câncer era o caranguejo enviado por Hera para distrair Hércules durante sua batalha.',
        descLeo: ' Leão tem a brilhante estrela Régulo! O asterismo da "Foice" forma a cabeça do leão. Na mitologia, Leão representa o Leão de Nemeia morto por Hércules.',
        descVirgo: ' Virgem é a segunda maior constelação! A brilhante estrela Spica representa trigo na mão da donzela. Lar de milhares de galáxias no Aglomerado de Virgem.',
        descLibra: ' Libra representa as balanças da justiça! Suas estrelas mais brilhantes são Zubenelgenubi e Zubeneschamali, que significam "garra do sul" e "garra do norte" em árabe.',
        descScorpius: ' Escorpião representa o escorpião que matou Órion na mitologia grega! A estrela vermelha brilhante Antares marca o coração do escorpião. Procure a cauda curvada com o ferrão!',
        descSagittarius: ' Sagitário aponta sua flecha para o coração de Escorpião! O asterismo da "Bule de Chá" é fácil de detectar. Aponta para o centro de nossa galáxia Via Láctea!',
        descCapricornus: ' Capricórnio é uma das constelações mais antigas! Representa uma criatura com cabeça de cabra e cauda de peixe. Associado ao deus Pã na mitologia grega.',
        descAquarius: ' Aquário representa o portador de água vertendo de sua urna! Lar de vários famosos objetos do céu profundo, incluindo a Nebulosa Hélice. Uma das constelações nomeadas mais antigas.',
        descPisces: ' Peixes mostra dois peixes amarrados juntos! Representa Afrodite e Eros que se transformaram em peixes para escapar do monstro Tifão. Contém o ponto vernal equinocial!',
        descOrion: ' Órion é uma das constelações mais reconhecíveis! Procure as três estrelas em fila formando o Cinturão de Órion. A brilhante estrela vermelha Betelgeuse marca seu ombro e o azul Rigel seu pé.',
        descUrsaMajor: ' A Ursa Maior (Grande Carro) é uma das constelações mais conhecidas! As duas estrelas no final da "taça" apontam para Polaris, a Estrela do Norte. Usada para navegação por milhares de anos!',
        descUrsaMajorFull: ' Ursa Major (a Ursa Maior) é a terceira maior constelação do céu! Contém o famoso asterismo do Grande Carro que forma o dorso e a cauda do urso. Com 16 estrelas principais traçando uma forma de urso incluindo cabeça, corpo e patas, é reconhecida por culturas de todo o mundo há milhares de anos. Dubhe e Merak são as "estrelas apontadoras" que guiam até Polaris!',
        descUrsaMinor: ' A Ursa Menor contém Polaris, a Estrela do Norte! Polaris marca o extremo do cabo da Ursa Menor e permanece quase fixo no céu do norte. Essencial para a navegação celeste!',
        descCrux: ' O Cruzeiro do Sul é a menor constelação, mas uma das mais famosas no hemisfério sul! Usado para navegação, aponta para o Polo Celeste Sul.',
        descBigDipper: ' O Grande Carro é o asterismo mais reconhecido do céu norte! Sete estrelas brilhantes formam uma concha — as "estrelas apontadoras" Dubhe e Merak na extremidade da taça apontam diretamente para Polaris, a Estrela do Norte. Usado para navegação por milhares de anos!',
        descLittleDipper: ' A Ursa Menor contém Polaris, a Estrela do Norte! Polaris marca o extremo do cabo da Ursa Menor e permanece quase fixo no céu do norte. Essencial para a navegação celeste!',
        descSouthernCross: ' O Cruzeiro do Sul é a menor constelação, mas uma das mais famosas no hemisfério sul! Usado para navegação, aponta para o Polo Celeste Sul.',
        descCassiopeia: ' Cassiopeia parece um W ou M dependendo da estação! Na mitologia grega, Cassiopeia era uma rainha vaidosa. A constelação é circumpolar em latitudes do norte.',
        descCygnus: ' Cygnus o Cisne voa ao longo da Via Láctea! Também chamada de Cruz do Norte. Na mitologia, Zeus se disfarçou de cisne. Lar de muitos objetos do céu profundo!',
        descLyra: ' Lyra representa a lira de Orfeu! Contém Vega, a 5ª estrela mais brilhante no céu noturno. Também lar da Nebulosa do Anel, uma famosa nebulosa planetária!',
        descAndromedaConst: ' Andrômeda era a princesa acorrentada a uma rocha e resgatada por Perseu! Esta constelação contém a Galáxia de Andrômeda (M31), nossa grande galáxia vizinha mais próxima!',
        descPerseus: ' Perseu o herói que matou Medusa! Lar da estrela brilhante Mirfak e da famosa estrela variável Algol ("Estrela Demônio"). Contém o Aglomerado Duplo!',
        descOrionsBelt: ' O Cinturão de Órion é um dos asterismos mais reconhecíveis do céu noturno! Três estrelas brilhantes — Alnitak, Alnilam e Mintaka — formam uma linha quase perfeita. Os antigos egípcios alinharam as Grandes Pirâmides de Gizé para espelhar essas três estrelas!',
        descCanisMajor: ' O Cão Maior abriga Sírius, a estrela mais brilhante de todo o céu noturno! Conhecida como a "Estrela do Cão," Sírius tem sido importante para civilizações ao longo da história. Os antigos egípcios basearam seu calendário em seu nascer. A constelação representa um dos cães de caça de Órion.',
        descAquila: ' Aquila a Águia voa ao longo da Via Láctea! Sua estrela mais brilhante Altair completa o famoso Triângulo de Verão com Vega (Lyra) e Deneb (Cisne). Altair gira tão rápido que se projeta em seu equador! Na mitologia, Aquila carregava os raios de Zeus.',
        descPegasus: ' Pégaso o Cavalo Alado apresenta o Grande Quadrado de Pégaso — um dos padrões estelares mais reconhecíveis do outono! Na mitologia grega, Pégaso surgiu de Medusa quando Perseu a matou. A estrela Enif marca o nariz do cavalo.',

        // Estrelas próximas
        descSirius: ' Sírius é a estrela mais brilhante no céu noturno da Terra! Na verdade é um sistema binário de duas estrelas. Localizado a 8,6 anos-luz na constelação do Cão Maior.',
        descBetelgeuse: ' Betelgeuse é uma supergigante vermelha se aproximando do fim de sua vida! É tão grande que se colocada na posição do nosso Sol, se estenderia além de Marte. Um dia vai explodir como supernova!',
        descRigel: ' Rigel é uma supergigante azul, uma das estrelas mais luminosas visíveis a olho nu! É 40.000 vezes mais luminosa que o nosso Sol e está a 860 anos-luz.',
        descVega: ' Vega é uma das estrelas mais brilhantes no céu do norte! Era a Estrela do Norte há 12.000 anos e será novamente em 13.000 anos devido à precessão do eixo terrestre.',
        descPolaris: ' Polaris, a Estrela do Norte, guiou viajantes por séculos! Na verdade é um sistema triplo de estrelas e atualmente está muito próximo do norte verdadeiro.',
        descAlphaCentauriA: ' Alfa Centauri A é muito similar ao nosso Sol! Faz parte de um sistema triplo de estrelas que é nosso vizinho estelar mais próximo a 4,37 anos-luz. Com seu companheiro Alfa Centauri B, orbitam um ao outro a cada 80 anos.',
        descProximaCentauri: ' Proxima Centauri é uma pequena anã vermelha e a estrela mais próxima do nosso Sistema Solar a apenas 4,24 anos-luz! É muito mais fria e menos brilhante que o nosso Sol, mas tem pelo menos dois planetas, incluindo o potencialmente habitável Proxima Centauri b.',

        // Estrelas com exoplanetas
        descKepler452Star: ' Kepler-452 é uma estrela semelhante ao Sol que hospeda o planeta "primo da Terra" Kepler-452b! É 1,5 bilhão de anos mais velha que o nosso Sol e 20% mais brilhante.',
        descTrappist1Star: ' TRAPPIST-1 é uma anã vermelha ultrafria com 7 planetas do tamanho da Terra! Três deles estão na zona habitável. Todo o sistema é tão compacto que todos os 7 planetas orbitam mais perto de sua estrela do que Mercúrio do nosso Sol.',
        descKepler186Star: ' Kepler-186 é uma anã vermelha com 5 planetas conhecidos! Kepler-186f foi o primeiro planeta do tamanho da Terra descoberto na zona habitável de outra estrela.',

        // Exoplanetas
        descProximaCentauriB: ' Proxima Centauri b é o exoplaneta conhecido mais próximo da Terra! Ele orbita na zona habitável de Proxima Centauri, o que significa que água líquida poderia existir em sua superfície.',
        descKepler452b: ' Kepler-452b é chamado de "primo da Terra"! É aproximadamente 60% maior que a Terra e orbita uma estrela semelhante ao Sol na zona habitável. Seu ano dura 385 dias.',
        descTrappist1e: ' TRAPPIST-1e faz parte de um sistema incrível com 7 planetas do tamanho da Terra! Orbita uma anã vermelha fria e está na zona habitável.',
        descKepler186f: ' Kepler-186f foi o primeiro planeta do tamanho da Terra descoberto na zona habitável de outra estrela! Recebe cerca de um terço da luz que a Terra recebe do Sol.',

        // Planetas anões
        descCeres: ' Ceres é o maior objeto no cinturão de asteroides e um planeta anão! A sonda Dawn da NASA revelou misteriosas manchas brilhantes na cratera Occator — descobriu-se que eram depósitos de sal de antigas salmouras.',
        descHaumea: ' Haumea gira tão rápido (uma vez a cada 4 horas) que foi achatada em formato de ovo! Também tem duas luas e um sistema de anéis, tornando-a muito incomum entre os planetas anões.',
        descMakemake: ' Makemake é um mundo brilhante e avermelhado no Cinturão de Kuiper descoberto perto da Páscoa de 2005, nomeado em homenagem ao deus criador do povo Rapa Nui da Ilha de Páscoa.',
        descEris: ' Éris é um pouco menor que Plutão, mas mais massiva! Sua descoberta em 2005 levou diretamente à reclassificação de Plutão como planeta anão. Tem uma lua, Disnômia.',
        descSedna: ' Sedna tem uma das órbitas elípticas mais extremas do sistema solar, variando de 76 a 937 UA. Leva cerca de 11.400 anos para completar uma órbita e é tão vermelha que rivaliza com Marte em cor!',

        // Cometas adicionais
        descHyakutake: ' O cometa Hyakutake passou extremamente perto da Terra em 1996, tornando-se um dos cometas mais brilhantes em décadas com uma cauda se estendendo por metade do céu!',
        descLovejoy: ' O cometa Lovejoy (C/2011 W3) sobreviveu a uma passagem próxima pela coroa do Sol! Faz parte dos raspadores solares de Kreutz — fragmentos de um cometa gigante que se fragmentou há séculos.',
        descEncke: ' O cometa Encke tem o período orbital mais curto de todos os cometas conhecidos — apenas 3,3 anos! Recebeu o nome de Johann Franz Encke, que calculou sua órbita em 1819.',
        descSwiftTuttle: ' O cometa Swift-Tuttle é o corpo-pai do espetacular enxame de meteoros das Perseidas! Com um núcleo de 26 km, é o maior objeto que passa regularmente perto da Terra.',

        // Cinturão de asteroides / Cinturão de Kuiper / Nuvem de Oort
        descAsteroidBelt: ' O cinturão de asteroides contém milhões de objetos rochosos entre Marte e Júpiter. Ceres, o maior objeto aqui, é um planeta anão! A maioria dos asteroides são materiais residuais da formação do sistema solar há 4,6 bilhões de anos.',
        descKuiperBelt: ' O Cinturão de Kuiper é uma região além de Netuno repleta de corpos gelados e planetas anões, incluindo Plutão! É como uma enorme rosca de objetos congelados restantes da formação do sistema solar. Cometas de período curto vêm daqui!',
        descOortCloud: ' A Nuvem de Oort é uma vasta concha esférica de objetos gelados que envolve todo o nosso sistema solar! Ela se estende de aproximadamente 50.000 a 200.000 UA do Sol. Cometas de longo período como Hale-Bopp se originam neste reino distante.',

        // Fatos divertidos para objetos adicionais
        funFactAsteroidBelt: 'Ao contrário do que os filmes mostram, os asteroides estão muito distantes uns dos outros - sondas espaciais podem passar com segurança!',
        funFactKuiperBelt: 'O cinturão de Kuiper é 20 vezes mais largo que o cinturão de asteroides e contém bilhões de objetos!',
        funFactOortCloud: 'A nuvem de Oort está tão distante que a luz do Sol leva mais de 1,5 ano para alcançar sua borda externa! A Voyager 1 levaria cerca de 300 anos para alcançar a borda interna.',
        funFactCeres: 'Ceres pode abrigar água líquida subterrânea - um candidato de topo para a vida!',
        funFactHaumea: 'Um período de rotação de ~4 horas dá a Haumea sua forma única de elipsoide triaxial semelhante a um ovo!',
        funFactMakemake: 'Descoberto perto da Páscoa de 2005, Makemake recebeu o nome do deus criador do povo Rapa Nui!',
        funFactEris: 'A descoberta de Éris levou diretamente à reclassificação de Plutão como planeta anão em 2006!',
        funFactSedna: 'Sedna leva 11.400 anos para completar uma órbita - possivelmente influenciada por um Planeta Nove invisível!',
        funFactAlphaCentauriA: 'Alfa Centauri é visível do hemisfério sul e é a terceira estrela mais brilhante em nosso céu noturno!',
        funFactProximaCentauri: 'Apesar de ser nossa estrela mais próxima, Proxima é muito tênue para ser vista a olho nu!',
        funFactSirius: 'Sírius está na verdade se aproximando de nós - estará mais próxima em cerca de 60.000 anos!',
        funFactBetelgeuse: 'Betelgeuse poderia explodir como supernova a qualquer momento (astronomicamente falando - amanhã ou em 100.000 anos)!',
        funFactDefaultStar: 'Esta estrela é visível a olho nu da Terra!',
        funFactOrionNebula: 'Novas estrelas estão nascendo na Nebulosa de Órion agora mesmo!',
        funFactCrabNebula: 'O pulsar na Nebulosa do Caranguejo gira 30 vezes por segundo e se expande a 1.500 km/s!',
        funFactRingNebula: 'Nebulosas planetárias não têm nada a ver com planetas - elas só parecem redondas como planetas através de telescópios antigos!',
        funFactAndromedaGalaxy: 'A Galáxia de Andrômeda está se aproximando de nós a 110 km/s!',
        funFactWhirlpoolGalaxy: 'Você pode ver a Galáxia do Redemoinho com um bom par de binóculos!',
        funFactSombreroGalaxy: 'Apesar de bilhões de estrelas, a Galáxia do Sombrero também é principalmente espaço vazio!',
        funFactTrappist1Star: 'TRAPPIST-1 recebeu o nome do telescópio que o descobriu - The TRAnsiting Planets and PlanetesImals Small Telescope!',
        funFactKepler452Star: 'Kepler-452 tem 6 bilhões de anos - nos mostra como nosso Sol pode ser daqui a 1,5 bilhão de anos!',
        funFactKepler186Star: 'Plantas em Kepler-186f provavelmente realizariam fotossíntese usando luz infravermelha e pareceriam vermelho escuro ou pretas!',
        funFactProximaCentauriB: 'Com a tecnologia atual, levaria 6.300 anos para chegar a Proxima b!',
        funFactKepler452b: 'Kepler-452b tem 6 bilhões de anos - 1,5 bilhão de anos mais velho que a Terra!',
        funFactTrappist1e: 'De TRAPPIST-1e, você poderia ver os outros planetas tão grandes quanto nossa Lua no céu!',
        funFactKepler186f: 'Kepler-186f orbita uma anã vermelha, então seu céu brilharia em laranja-avermelhado!',
        funFactComets: 'Os cometas têm duas caudas: uma cauda de poeira curva (amarelada) e uma cauda iônica reta (azul) - ambas sempre apontam para longe do Sol!',
        descOrcus: 'Orcus é um grande objeto do Cinturão de Kuiper em ressonância orbital 2:3 com Netuno, assim como Plutão. Tem sua própria lua chamada Vanth.',
        funFactOrcus: 'Orcus às vezes é chamado de anti-Plutão — suas órbitas são quase imagens espelhadas perfeitas uma da outra, em lados opostos do Sol!',
        descQuaoar: 'Quaoar é um grande objeto do Cinturão de Kuiper com sua própria lua Weywot. Notavelmente, possui um sistema de anéis — o primeiro descoberto ao redor de um objeto do Cinturão de Kuiper.',
        funFactQuaoar: 'O anel de Quaoar orbita muito além do seu limite de Roche, onde os anéis não deveriam conseguir existir — um mistério que desafia nossa compreensão sobre a formação de anéis!',
        descGonggong: 'Gonggong (anteriormente 2007 OR10) é um objeto distante do disco disperso com uma superfície avermelhada causada por gelo de metano alterado por radiação. Tem uma lua chamada Xiangliu.',
        funFactGonggong: 'Gonggong leva o nome de um deus da água chinês que, segundo a mitologia, inclinou a Terra ao se chocar contra um pilar que sustentava o céu!',
        descSalacia: 'Salacia é um objeto escuro do Cinturão de Kuiper com uma lua chamada Actaea. É um dos maiores objetos trans-neptunianos que ainda não foi classificado como planeta anão.',
        funFactSalacia: 'Salacia leva o nome da deusa romana do mar e esposa de Netuno — apropriado para um mundo gelado em órbita no reino dos planetas mais distantes!',
        descVarda: 'Varda é um objeto binário do Cinturão de Kuiper emparelhado com sua grande lua Ilmarë. Medindo sua órbita mútua, os cientistas podem calcular com precisão a massa combinada do sistema.',
        funFactVarda: 'Varda leva o nome da Rainha das Estrelas na mitologia de Tolkien — a divindade que moldou as estrelas e as colocou no céu da Terra Média!',
        descVaruna: 'Varuna é um objeto clássico do Cinturão de Kuiper conhecido por sua rotação extremamente rápida — completando uma volta completa em apenas 6,3 horas, uma das mais rápidas do sistema solar externo.',
        funFactVaruna: 'Varuna gira tão rápido que se expande no equador, dando-lhe a forma de uma bola achatada — seu diâmetro equatorial é visivelmente maior que seu diâmetro polar!'
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
        lang = 'en';
    }

    document.documentElement.lang = lang;
    localStorage.setItem('appLanguage', lang);

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

    applyTranslations();
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

        selector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
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