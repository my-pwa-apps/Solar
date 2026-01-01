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
 
 // Hide loading
 this.hideLoading();
 }
 
 setupTimeSpeedControl() {
 const timeSpeedSlider = document.getElementById('time-speed');
 const timeSpeedLabel = document.getElementById('time-speed-label');
 
 if (!timeSpeedSlider || !timeSpeedLabel) {
 console.warn('Time speed controls not found');
 return;
 }
 
 // Original speed scale: 0 to 10 with 0.5 increments (matches keyboard shortcuts)
 const updateSpeed = (value) => {
 const speed = parseFloat(value);
 
 // Update app timeSpeed
 if (window.app) {
 window.app.timeSpeed = speed;
 }
 
 // Update label
 if (speed === 0) {
 timeSpeedLabel.textContent = 'Paused';
 } else if (speed === 1) {
 timeSpeedLabel.textContent = '1x Real-time';
 } else {
 timeSpeedLabel.textContent = `${speed}x`;
 }
 };
 
 // Add event listener
 timeSpeedSlider.addEventListener('input', (e) => {
 updateSpeed(e.target.value);
 });
 
 // Initialize with current slider value
 updateSpeed(timeSpeedSlider.value);
 }
}

