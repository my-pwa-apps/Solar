# Solar System Modularization Plan

## Current Structure (main.js - 10,344 lines)
- **TextureCache** (lines 11-175): 165 lines - Texture caching system
- **Utils** (lines 176-256): 81 lines - DEBUG, CONFIG, IS_MOBILE
- **SceneManager** (lines 260-1651): 1,392 lines - Scene, camera, lighting, VR/XR
- **UIManager** (lines 1655-1868): 214 lines - UI elements, panels, buttons  
- **SolarSystemModule** (lines 1872-9277): 7,406 lines - Planets, moons, spacecraft, asteroids
- **TopicManager** (lines 9284-9607): 324 lines - Topic navigation
- **App** (lines 9611-end): ~733 lines - Main application orchestrator

## New Modular Structure

### src/modules/utils.js (✅ Created)
- DEBUG object
- CONFIG object
- IS_MOBILE, IS_LOW_POWER constants
- Console warning filters

### src/modules/TextureCache.js (✅ Created)
- TextureCache class
- TEXTURE_CACHE singleton
- warmupTextureCache()
- cachedTextureGeneration()

### src/modules/SceneManager.js (⏳ In Progress)
- SceneManager class
- Scene initialization
- Camera and controls setup
- VR/XR/AR support
- Controller handling
- VR UI menu system

### src/modules/UIManager.js (Pending)
- UIManager class
- Info panel management
- Button handlers
- Quick navigation
- Language switching

### src/modules/SolarSystemModule.js (Pending - LARGEST)
- SolarSystemModule class
- Planet creation methods
- Moon creation methods
- Satellite/spacecraft creation
- Asteroid belt
- Star field generation
- Object descriptions

### src/modules/TopicManager.js (Pending)
- TopicManager class
- Topic navigation logic
- Event handling

### src/main.js (Rewrite)
- Import statements for all modules
- App class (main orchestrator)
- Initialization logic
- Event loop

## Benefits of Modularization
1. **Reduced Token Usage**: Each module can be edited independently
2. **Better Organization**: Clear separation of concerns
3. **Easier Debugging**: Isolate issues to specific modules
4. **Improved Maintainability**: Changes to one system don't affect others
5. **Reusability**: Modules can be used in other projects

## Implementation Strategy
1. ✅ Create modules/ directory
2. ✅ Extract TextureCache → modules/TextureCache.js
3. ✅ Extract utils → modules/utils.js
4. ⏳ Extract SceneManager → modules/SceneManager.js (Large!)
5. Extract UIManager → modules/UIManager.js
6. Extract SolarSystemModule → modules/SolarSystemModule.js (VERY Large!)
7. Extract TopicManager → modules/TopicManager.js
8. Rewrite main.js with imports
9. Test all functionality
10. Verify no errors

## Token Savings Estimate
- **Before**: 10,344 lines in one file = ~40,000+ tokens per load
- **After**: 
  - main.js: ~800 lines = ~3,200 tokens
  - Individual modules: 200-1,500 lines each
  - **Average edit**: Load main.js (3.2k) + 1 module (1-6k) = 4-9k tokens
  - **Savings**: 75-80% reduction in tokens per edit!

## Dependencies Between Modules
- **utils.js**: No dependencies (base module)
- **TextureCache.js**: Depends on utils.js (DEBUG)
- **SceneManager.js**: Depends on utils.js (CONFIG, IS_MOBILE), THREE.js
- **UIManager.js**: Depends on utils.js, i18n.js
- **SolarSystemModule.js**: Depends on utils, TextureCache, THREE.js, i18n.js
- **TopicManager.js**: Depends on SolarSystemModule
- **main.js**: Imports all modules

## Testing Checklist
- [ ] App loads without errors
- [ ] 3D scene renders correctly
- [ ] VR/AR buttons work
- [ ] Planet navigation works
- [ ] Moon navigation works (recent fix)
- [ ] UI panels function
- [ ] Language switching works
- [ ] Time controls work
- [ ] Scale toggle works
- [ ] Orbit visibility toggle works
