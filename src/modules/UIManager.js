// ===========================
// UI MANAGER MODULE
// ===========================
import { DEBUG } from './utils.js';

export class UIManager {
 constructor() {
 // Cache DOM elements
 this.elements = {
 loading: document.getElementById('loading'),
 infoPanel: document.getElementById('info-panel'),
 helpModal: document.getElementById('help-modal'),
 objectName: document.getElementById('object-name'),
 objectType: document.getElementById('object-type'),
 objectDistance: document.getElementById('object-distance'),
 objectSize: document.getElementById('object-size'),
 objectDescription: document.getElementById('object-description'),
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
 if (DEBUG && DEBUG.enabled) console.warn('Missing UI elements:', missing);
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
 const pct = Math.min(100, Math.max(0, progress));
 // Update progress bar (0-100)
 if (this.elements.loadingProgressBar) {
 this.elements.loadingProgressBar.style.width = `${pct}%`;
 // Update ARIA progressbar value on container
 const progressContainer = this.elements.loadingProgressBar.parentElement;
 if (progressContainer) progressContainer.setAttribute('aria-valuenow', Math.round(pct));
 }
 
 // Update percentage text
 if (this.elements.loadingPercentage) {
 this.elements.loadingPercentage.textContent = `${Math.round(pct)}%`;
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
 this.elements.infoPanel.setAttribute('aria-hidden', 'false');
 }
 }

 showHelp(content) {
 if (this.elements.helpContent) {
 this.elements.helpContent.innerHTML = content;
 }
 if (this.elements.helpModal) {
 this.elements.helpModal.classList.remove('hidden');
 this.elements.helpModal.setAttribute('aria-hidden', 'false');
 this._trapFocus(this.elements.helpModal);
 }
 }

 closeInfoPanel() {
 if (this.elements.infoPanel) {
 this.elements.infoPanel.classList.add('hidden');
 this.elements.infoPanel.setAttribute('aria-hidden', 'true');
 }
 }

 closeHelpModal() {
 if (this.elements.helpModal) {
 this.elements.helpModal.classList.add('hidden');
 this.elements.helpModal.setAttribute('aria-hidden', 'true');
 this._releaseFocusTrap();
 }
 }

 /**
 * Trap focus within a modal dialog (WCAG 2.4.3).
 * Stores the previously focused element and restores it on release.
 */
 _trapFocus(container) {
 this._focusTrapPrev = document.activeElement;
 this._focusTrapContainer = container;
 const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 if (focusable.length) focusable[0].focus();
 this._focusTrapHandler = (e) => {
 if (e.key !== 'Tab') return;
 const focusableEls = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 if (!focusableEls.length) return;
 const first = focusableEls[0];
 const last = focusableEls[focusableEls.length - 1];
 if (e.shiftKey) {
 if (document.activeElement === first) { e.preventDefault(); last.focus(); }
 } else {
 if (document.activeElement === last) { e.preventDefault(); first.focus(); }
 }
 };
 document.addEventListener('keydown', this._focusTrapHandler);
 }

 _releaseFocusTrap() {
 if (this._focusTrapHandler) {
 document.removeEventListener('keydown', this._focusTrapHandler);
 this._focusTrapHandler = null;
 }
 if (this._focusTrapPrev && typeof this._focusTrapPrev.focus === 'function') {
 this._focusTrapPrev.focus();
 this._focusTrapPrev = null;
 }
 this._focusTrapContainer = null;
 }
 
 setupSolarSystemUI() {
 // Setup time speed control
 this.setupTimeSpeedControl();
 
 // Setup speed panel collapse
 this.setupSpeedPanelToggle();
 // Note: loading screen is hidden by App.startExperience() after all setup is complete
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
 if (speed <= 0.01) return 1; // Clamp tiny speeds to minimum slider position
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
 if (DEBUG && DEBUG.enabled) console.warn('Time speed controls not found');
 return;
 }
 
 // Logarithmic speed scale for balanced slow/fast control
 const updateSpeed = (sliderValue) => {
 const speed = this.sliderToSpeed(sliderValue);
 
 // Update app timeSpeed
 if (window.app) {
 window.app.timeSpeed = speed;
 
 // Reset reverse if speed becomes paused
 if (speed === 0 && window.app.isTimeReversed) {
 window.app.isTimeReversed = false;
 const revBtn = document.getElementById('time-reverse');
 if (revBtn) {
 revBtn.setAttribute('aria-pressed', 'false');
 revBtn.classList.remove('active');
 }
 }
 }
 
 // Update labels
 const label = this.formatSpeed(speed);
 timeSpeedLabel.textContent = label;
 timeSpeedSlider.setAttribute('aria-valuenow', speed.toFixed(2));
 timeSpeedSlider.setAttribute('aria-valuetext', label);
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
 
 // Safe localStorage helpers — Safari private mode, quota exceeded, or disabled storage
 const safeGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
 const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* ignore */ } };
 
 // Load collapsed state from localStorage
 const isCollapsed = safeGet('speed_panel_collapsed') === 'true';
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
 safeSet('speed_panel_collapsed', !wasCollapsed);

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
