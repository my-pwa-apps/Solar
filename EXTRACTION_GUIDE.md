# Modularization Extraction Guide

## Files Created So Far:
✅ src/modules/utils.js
✅ src/modules/TextureCache.js

## Remaining Files to Create:

### 1. src/modules/SceneManager.js
**Lines:** 257-1651 (1,395 lines)
**Exports:** SceneManager class
**Imports:** THREE, OrbitControls, VRButton, ARButton, CSS2DRenderer, CSS2DObject, utils, XRControllerModelFactory

### 2. src/modules/UIManager.js  
**Lines:** 1652-1868 (217 lines)
**Exports:** UIManager class
**Imports:** i18n (t function)

### 3. src/modules/SolarSystemModule.js (LARGEST)
**Lines:** 1869-9277 (7,408 lines)
**Exports:** SolarSystemModule class
**Imports:** THREE, TextureCache, utils, i18n

### 4. src/modules/TopicManager.js
**Lines:** 9278-9607 (330 lines)  
**Exports:** TopicManager class (currently commented out/unused)
**Note:** May skip this if unused

### 5. src/main.js (NEW - Orchestrator Only)
**Lines:** Import all modules + App class + initialization
**Estimated:** 100-150 lines
**Imports:** All modules above

## Extraction Steps:

### Step 1: Create SceneManager.js
```javascript
// Header imports
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONFIG, DEBUG, IS_MOBILE } from './utils.js';

export class SceneManager {
  // ... class content from lines 260-1651
}
```

### Step 2: Create UIManager.js
```javascript
import { t } from '../i18n.js';

export class UIManager {
  // ... class content from lines 1655-1868
}
```

### Step 3: Create SolarSystemModule.js
```javascript
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { TEXTURE_CACHE, cachedTextureGeneration } from './TextureCache.js';
import { CONFIG, DEBUG, IS_MOBILE } from './utils.js';
import { t } from '../i18n.js';

export class SolarSystemModule {
  // ... class content from lines 1872-9277 (7,400+ lines!)
}
```

### Step 4: Rewrite main.js
```javascript
// Import THREE.js
import * as THREE from 'three';

// Import modules
import { DEBUG, CONFIG } from './modules/utils.js';
import { TEXTURE_CACHE, warmupTextureCache } from './modules/TextureCache.js';
import { SceneManager } from './modules/SceneManager.js';
import { UIManager } from './modules/UIManager.js';
import { SolarSystemModule } from './modules/SolarSystemModule.js';
import { t } from './i18n.js';

// App class (lines 9611-end)
class App {
  // ... existing App class code
}

// Initialize
const app = new App();
```

## Testing Checklist After Modularization:
- [ ] No console errors on load
- [ ] 3D scene renders
- [ ] Planets visible
- [ ] Click interactions work
- [ ] VR button appears (if supported)
- [ ] Navigation menu works
- [ ] Time controls functional
- [ ] Scale toggle works
- [ ] Language switcher works
- [ ] Moon navigation works (recent fix)

## Key Benefits:
1. **Token Efficiency**: Load only needed modules (e.g., fixing moon nav = load main.js + SolarSystemModule instead of entire 10K file)
2. **Parallel Development**: Multiple features can be worked on simultaneously
3. **Clear Boundaries**: Each module has defined responsibilities
4. **Easier Testing**: Test modules in isolation
5. **Better Git Diffs**: Changes are isolated to relevant files
