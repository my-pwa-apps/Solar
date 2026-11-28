class FocusTrap {
 constructor() {
 this.traps = [];
 this.handleKeyDown = this.handleKeyDown.bind(this);
 }

 get topContainer() {
 return this.traps[this.traps.length - 1]?.container ?? null;
 }

 getFocusable(container) {
 return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]'))
 .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') &&
 !element.closest('[inert]') && element.getClientRects().length > 0 &&
 getComputedStyle(element).visibility === 'visible');
 }

 focusContainer(container) {
 const first = this.getFocusable(container)[0];
 if (first) first.focus();
 else {
 if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
 container.focus();
 }
 }

 handleKeyDown(event) {
 if (event.key !== 'Tab') return;
 const container = this.topContainer;
 if (!container) return;
 const focusable = this.getFocusable(container);
 if (!focusable.length) {
 event.preventDefault();
 this.focusContainer(container);
 return;
 }
 const first = focusable[0];
 const last = focusable[focusable.length - 1];
 if (!focusable.includes(document.activeElement)) {
 event.preventDefault();
 (event.shiftKey ? last : first).focus();
 } else if (event.shiftKey && document.activeElement === first) {
 event.preventDefault();
 last.focus();
 } else if (!event.shiftKey && document.activeElement === last) {
 event.preventDefault();
 first.focus();
 }
 }

 open(container) {
 if (this.traps.some(trap => trap.container === container)) return;
 if (!this.traps.length) document.addEventListener('keydown', this.handleKeyDown);
 const previousZIndex = container.style.zIndex;
 const topZIndex = Number.parseInt(getComputedStyle(this.topContainer || container).zIndex, 10);
 const containerZIndex = Number.parseInt(getComputedStyle(container).zIndex, 10);
 if (this.topContainer && Number.isFinite(topZIndex) && Number.isFinite(containerZIndex) && containerZIndex <= topZIndex) {
 container.style.zIndex = String(topZIndex + 1);
 }
 this.traps.push({ container, previous: document.activeElement, previousZIndex });
 this.focusContainer(container);
 }

 close(container) {
 const index = container ? this.traps.findIndex(trap => trap.container === container) : this.traps.length - 1;
 if (index < 0) return;
 const wasTop = index === this.traps.length - 1;
 const [removed] = this.traps.splice(index, 1);
 removed.container.style.zIndex = removed.previousZIndex;
 for (const trap of this.traps.slice(index)) {
 if (removed.container.contains(trap.previous)) trap.previous = removed.previous;
 }
 if (!this.traps.length) document.removeEventListener('keydown', this.handleKeyDown);
 if (wasTop) {
 const active = this.traps[this.traps.length - 1]?.container;
 if (removed.previous?.isConnected && (!active || active.contains(removed.previous))) {
 removed.previous.focus();
 }
 if (active && !active.contains(document.activeElement)) this.focusContainer(active);
 }
 }
}

export const focusTrap = new FocusTrap();
