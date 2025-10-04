# 🚀 Quick Start Guide

## Running the Application

### Method 1: Using VS Code Live Server (Easiest)

1. **Install Live Server Extension**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Live Server"
   - Install by Ritwick Dey

2. **Run the Application**:
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Browser will open automatically

### Method 2: Using Python (if installed)

```bash
# Navigate to project folder
cd "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar"

# Python 3
python -m http.server 8000

# Open browser to:
# http://localhost:8000
```

### Method 3: Using Node.js (if installed)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to:
# http://localhost:5173
```

## First Time Setup

1. **Open in VS Code**:
   ```bash
   code "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar"
   ```

2. **View the Structure**:
   - `index.html` - Main page
   - `src/` - All source code
   - `src/styles/` - CSS files
   - `src/modules/` - Scientific topics

3. **Choose a Method Above** to run the server

## 🎮 Using the Application

### Navigation
- Click topic buttons at top to switch experiences:
  - 🪐 Solar System
  - ⚛️ Quantum Physics
  - 🌌 Relativity
  - 🧪 Atomic Structure
  - 🧬 DNA & Genetics

### Controls
- **Mouse**: Click and drag to rotate view
- **Scroll**: Zoom in/out
- **Click Objects**: Select and view information
- **Time Speed Slider**: Control animation speed
- **Brightness Slider**: Adjust lighting
- **Reset Button**: Return to starting view

### VR/AR
- Click "Enter VR" or "Enter AR" buttons (bottom right)
- Requires compatible device (Meta Quest, etc.)

## 🔧 Troubleshooting

### Module Errors
If you see "Cannot load module" errors:
- ✅ **Solution**: Run with a local server (Methods 1-3 above)
- ❌ **Won't Work**: Opening `index.html` directly in browser

### TypeScript Errors in Editor
- These are normal during development
- Won't affect runtime
- Install Node.js and run `npm install` to fix

### Three.js Not Loading
- Check internet connection (uses CDN in HTML)
- Or install dependencies with npm

## 📝 Making Changes

### Adding a New Scientific Topic

1. **Create Module File**:
   ```typescript
   // src/modules/MyTopicModule.ts
   export class MyTopicModule implements ExperienceModule {
       async init(scene, camera) {
           // Create 3D objects
       }
       // ... other methods
   }
   ```

2. **Register in TopicManager**:
   ```typescript
   // src/core/TopicManager.ts
   case 'my-topic':
       return new MyTopicModule();
   ```

3. **Add Navigation Button**:
   ```html
   <!-- index.html -->
   <button class="nav-btn" data-topic="my-topic">
       <span class="icon">🎯</span>
       <span class="label">My Topic</span>
   </button>
   ```

### Modifying Styles
- Edit `src/styles/ui.css` for UI components
- Edit `src/styles/main.css` for global styles

### Changing Controls
- Edit `src/core/UIManager.ts` for UI behavior
- Edit `src/core/TopicManager.ts` for control logic

## 🎯 Next Steps

1. ✅ Choose a running method above
2. ✅ Launch the application
3. ✅ Explore different topics
4. ✅ Try VR/AR mode (if you have device)
5. ✅ Customize and add your own topics!

## 📚 Documentation

- **README.md**: Full project documentation
- **IMPLEMENTATION.md**: Architecture details
- **This file**: Quick start guide

---

**Need Help?** Check the Help button (❓) in the application for usage instructions!
