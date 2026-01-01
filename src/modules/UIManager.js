// ===========================
// UI MANAGER MODULE
// ===========================
// i18n.js is loaded globally in index.html, access via window.t
const t = window.t || ((key) => key);

export class UIManager {
 constructor() {
 // Cache DOM elements
 this.elements = {
 loading: document.getElementById('loading'),
 infoPanel: document.getElementById('info-panel'),
 controls: document.getElementById('controls'),
 explorer: document.getElementById('object-list'),
 helpModal: document.getElementById('help-modal'),
 objectName: document.getElementById('object-name'),
 objectType: document.getElementById('object-type'),
 objectDistance: document.getElementById('object-distance'),
 objectSize: document.getElementById('object-size'),
 objectDescription: document.getElementById('object-description'),
 explorerTitle: document.getElementById('explorer-title'),
 explorerContent: document.getElementById('explorer-content'),
 helpContent: document.getElementById('help-content'),
 loadingText: document.getElementById('loading-text'),
 loadingProgressBar: document.getElementById('loading-progress-bar'),
 loadingPercentage: document.getElementById('loading-percentage')
 };
 
 this.validateElements();
 }

 validateElements() {
 const missing = [];
 for (const [key, element] of Object.entries(this.elements)) {
 if (!element) missing.push(key);
 }
 if (missing.length > 0) {
 console.warn('Missing UI elements:', missing);
 }
 }

 showLoading(message = 'Loading...') {
 if (this.elements.loadingText) {
 this.elements.loadingText.textContent = message;
 }
 if (this.elements.loading) {
 this.elements.loading.classList.remove('hidden');
 }
 }

 updateLoadingProgress(progress, message = null) {
 // Update progress bar (0-100)
 if (this.elements.loadingProgressBar) {
 this.elements.loadingProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
 }
 
 // Update percentage text
 if (this.elements.loadingPercentage) {
 this.elements.loadingPercentage.textContent = `${Math.round(progress)}%`;
 }
 
 // Update message if provided
 if (message && this.elements.loadingText) {
 this.elements.loadingText.textContent = message;
 }
 }

 hideLoading() {
 if (this.elements.loading) {
 this.elements.loading.classList.add('hidden');
 }
 // Show controls and info panel (explorer removed - using header dropdown instead)
 ['infoPanel', 'controls'].forEach(key => {
 if (this.elements[key]) {
 this.elements[key].classList.remove('hidden');
 }
 });
 }

 updateInfoPanel(info) {
 const updates = {
 objectName: info.name,
 objectType: info.type,
 objectDistance: info.distance,
 objectSize: info.size,
 objectDescription: info.description
 };

 for (const [key, value] of Object.entries(updates)) {
 if (this.elements[key]) {
 this.elements[key].textContent = value;
 }
 }

 if (this.elements.infoPanel) {
 this.elements.infoPanel.classList.remove('hidden');
 }
 }

 updateExplorer(title, categories) {
 if (this.elements.explorerTitle) {
 this.elements.explorerTitle.textContent = title;
 }

 if (!this.elements.explorerContent) return;

 // Use DocumentFragment for better performance
 const fragment = document.createDocumentFragment();
 
 categories.forEach(category => {
 const categoryDiv = document.createElement('div');
 categoryDiv.className = 'object-category';
 
 const header = document.createElement('h4');
 header.textContent = category.title;
 categoryDiv.appendChild(header);
 
 category.items.forEach(item => {
 const itemDiv = document.createElement('div');
 itemDiv.className = 'object-item';
 itemDiv.textContent = item.name;
 itemDiv.onclick = item.onClick;
 categoryDiv.appendChild(itemDiv);
 });
 
 fragment.appendChild(categoryDiv);
 });

 this.elements.explorerContent.innerHTML = '';
 this.elements.explorerContent.appendChild(fragment);
 }

 showHelp(content) {
 if (this.elements.helpContent) {
 this.elements.helpContent.innerHTML = content;
 }
 if (this.elements.helpModal) {
 this.elements.helpModal.classList.remove('hidden');
 }
 }

 closeInfoPanel() {
 if (this.elements.infoPanel) {
 this.elements.infoPanel.classList.add('hidden');
 }
 }

 closeHelpModal() {
 if (this.elements.helpModal) {
 this.elements.helpModal.classList.add('hidden');
 }
 }
 
 setupSolarSystemUI(solarSystemModule, sceneManager) {
 // Setup explorer panel with Solar System content
 const focusCallback = (obj) => {
 if (obj) {
 const info = solarSystemModule.getObjectInfo(obj);
 this.updateInfoPanel(info);
 solarSystemModule.focusOnObject(obj, sceneManager.camera, sceneManager.controls);
 }
 };
 
 if (solarSystemModule && typeof solarSystemModule.getExplorerContent === 'function') {
 const explorerContent = solarSystemModule.getExplorerContent(focusCallback);
 if (explorerContent && Array.isArray(explorerContent)) {
 this.updateExplorer('🌌 Explore the Solar System', explorerContent);
 }
 }
 
 // Setup time speed control
 this.setupTimeSpeedControl();
 
 // Setup speed panel collapse
 this.setupSpeedPanelToggle();
 
 // Hide loading
 this.hideLoading();
 }
 
 /**
  * Convert slider position (0-100) to actual speed using logarithmic scale
  * This gives more control at slower speeds and less at faster speeds
  * 
  * Scale breakdown:
  * - Slider 0 = 0x (paused)
  * - Slider 1-25 = 0.01x to 0.5x (slow motion - fine control)
  * - Slider 25-50 = 0.5x to 1x (approaching real-time - fine control)
  * - Slider 50 = 1x (real-time - center point)
  * - Slider 50-75 = 1x to 5x (moderate fast-forward)
  * - Slider 75-100 = 5x to 100x (extreme fast-forward)
  */
 sliderToSpeed(sliderValue) {
 const pos = parseFloat(sliderValue);
 
 if (pos === 0) return 0; // Paused
 
 if (pos <= 25) {
 // 1-25 maps to 0.01-0.5 (logarithmic for fine control)
 // Using exponential curve for more control at very slow speeds
 const t = pos / 25; // 0 to 1
 return 0.01 + (0.49 * Math.pow(t, 2)); // Quadratic for slower ramp
 } else if (pos <= 50) {
 // 25-50 maps to 0.5-1.0 (linear, easy to hit 1x)
 const t = (pos - 25) / 25; // 0 to 1
 return 0.5 + (0.5 * t);
 } else if (pos <= 75) {
 // 50-75 maps to 1-5 (moderate acceleration)
 const t = (pos - 50) / 25; // 0 to 1
 return 1 + (4 * t);
 } else {
 // 75-100 maps to 5-100 (exponential for extreme speeds)
 const t = (pos - 75) / 25; // 0 to 1
 return 5 + (95 * Math.pow(t, 2)); // Quadratic for fast ramp
 }
 }
 
 /**
  * Convert actual speed back to slider position (for programmatic updates)
  */
 speedToSlider(speed) {
 if (speed === 0) return 0;
 if (speed <= 0.5) {
 // Inverse of quadratic: t = sqrt((speed - 0.01) / 0.49)
 const t = Math.sqrt((speed - 0.01) / 0.49);
 return t * 25;
 } else if (speed <= 1) {
 const t = (speed - 0.5) / 0.5;
 return 25 + (t * 25);
 } else if (speed <= 5) {
 const t = (speed - 1) / 4;
 return 50 + (t * 25);
 } else {
 const t = Math.sqrt((speed - 5) / 95);
 return 75 + (t * 25);
 }
 }
 
 /**
  * Format speed value for display
  */
 formatSpeed(speed) {
 if (speed === 0) return 'Paused';
 if (speed === 1) return '1x';
 if (speed < 0.1) return `${speed.toFixed(2)}x`;
 if (speed < 1) return `${speed.toFixed(1)}x`;
 if (speed < 10) return `${speed.toFixed(1)}x`;
 return `${Math.round(speed)}x`;
 }
 
 setupTimeSpeedControl() {
 const timeSpeedSlider = document.getElementById('time-speed');
 const timeSpeedLabel = document.getElementById('time-speed-label');
 const speedCompactLabel = document.getElementById('speed-compact-label');
 
 if (!timeSpeedSlider || !timeSpeedLabel) {
 console.warn('Time speed controls not found');
 return;
 }
 
 // Logarithmic speed scale for balanced slow/fast control
 const updateSpeed = (sliderValue) => {
 const speed = this.sliderToSpeed(sliderValue);
 
 // Update app timeSpeed
 if (window.app) {
 window.app.timeSpeed = speed;
 }
 
 // Update labels
 const label = this.formatSpeed(speed);
 timeSpeedLabel.textContent = label;
 if (speedCompactLabel) {
 speedCompactLabel.textContent = label;
 }
 };
 
 // Add event listener
 timeSpeedSlider.addEventListener('input', (e) => {
 updateSpeed(e.target.value);
 });
 
 // Initialize with slider at center (1x real-time)
 timeSpeedSlider.value = 50;
 updateSpeed(50);
 }
 
 setupSpeedPanelToggle() {
 const speedToggle = document.getElementById('speed-toggle');
 const speedPanelContent = document.getElementById('speed-panel-content');
 const speedControl = document.getElementById('speed-control');
 
 if (!speedToggle || !speedPanelContent) return;
 
 // Load collapsed state from localStorage
 const isCollapsed = localStorage.getItem('speed_panel_collapsed') === 'true';
 if (isCollapsed) {
 speedPanelContent.classList.add('collapsed');
 speedControl?.classList.add('collapsed');
 speedToggle.setAttribute('aria-expanded', 'false');
 }
 
 speedToggle.addEventListener('click', () => {
 const wasCollapsed = speedPanelContent.classList.contains('collapsed');
 speedPanelContent.classList.toggle('collapsed');
 speedControl?.classList.toggle('collapsed');
 speedToggle.setAttribute('aria-expanded', wasCollapsed ? 'true' : 'false');
 
 // Save state
 localStorage.setItem('speed_panel_collapsed', !wasCollapsed);
 
 // Play audio feedback
 if (window.audioManager) {
 if (wasCollapsed) {
 window.audioManager.playExpand();
 } else {
 window.audioManager.playCollapse();
 }
 }
 });
 }
}
