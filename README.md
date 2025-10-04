# Scientific VR/AR Explorer

An interactive, modular scientific visualization platform supporting both desktop and VR/AR experiences.

## 🚀 Features

- **Multi-Topic Learning**: Switch between different scientific topics:
  - 🪐 Solar System (planets, moons, stars, galaxies)
  - ⚛️ Quantum Physics (wave-particle duality, superposition)
  - 🌌 Relativity (space-time curvature, time dilation)
  - 🧪 Atomic Structure (atoms, molecules, bonds)
  - 🧬 DNA & Genetics (DNA helix, base pairs, proteins)

- **VR/AR Support**: Full WebXR support for immersive experiences
- **Interactive Controls**: Intuitive UI for all ages
- **Modular Architecture**: Clean separation of concerns
- **TypeScript**: Type-safe codebase
- **Performance Optimized**: Efficient rendering and animations

## 📁 Project Structure

```
Solar/
├── src/
│   ├── core/              # Core application logic
│   │   ├── SceneManager.ts    # Three.js scene management
│   │   ├── UIManager.ts       # UI state management
│   │   └── TopicManager.ts    # Topic switching logic
│   ├── modules/           # Scientific topic modules
│   │   ├── SolarSystemModule.ts
│   │   ├── QuantumModule.ts
│   │   ├── RelativityModule.ts
│   │   ├── AtomicModule.ts
│   │   └── DNAModule.ts
│   ├── utils/             # Utility functions
│   ├── styles/            # CSS stylesheets
│   │   ├── main.css
│   │   └── ui.css
│   ├── types.ts           # TypeScript type definitions
│   └── main.ts            # Application entry point
├── index.html             # Main HTML file
├── package.json
├── tsconfig.json
└── vite.config.ts (optional)

## 🛠️ Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 🎮 Usage

### Desktop
- **Rotate View**: Click and drag
- **Zoom**: Scroll wheel
- **Select Objects**: Click on objects
- **Controls**: Use bottom control panel

### VR/AR
- Click "Enter VR" or "Enter AR" buttons
- Requires compatible VR/AR device
- Use controllers or gaze for interaction

## 🔬 Adding New Topics

1. Create a new module in `src/modules/`
2. Implement the `ExperienceModule` interface
3. Add topic to `TopicManager.createModule()`
4. Add navigation button in `index.html`

## 📝 Module Interface

```typescript
interface ExperienceModule {
    init(scene: THREE.Scene, camera: THREE.Camera): Promise<void>;
    update(deltaTime: number, timeSpeed: number): void;
    cleanup(): void;
    getSelectableObjects(): THREE.Object3D[];
    getObjectInfo(object: THREE.Object3D): ObjectInfo | null;
    focusOnObject(object: THREE.Object3D, camera: THREE.Camera, controls: any): void;
    getExplorerContent(): ExplorerCategory[];
}
```

## 🎨 Customization

### Styling
- Edit `src/styles/main.css` for global styles
- Edit `src/styles/ui.css` for UI component styles

### Controls
- Modify `src/core/UIManager.ts` for UI behavior
- Modify `src/core/TopicManager.ts` for control logic

## 📦 Technologies

- **Three.js**: 3D rendering
- **TypeScript**: Type safety
- **Vite**: Build tool
- **WebXR**: VR/AR support
- **CSS3**: Modern styling

## 🤝 Contributing

Contributions welcome! Please follow the modular architecture and maintain TypeScript type safety.

## 📄 License

MIT License - feel free to use for educational purposes!
