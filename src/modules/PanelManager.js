/**
 * PanelManager - Handles draggable panel functionality
 * Manages panel positioning, drag events, localStorage persistence, and window resize handling
 */

export class PanelManager {
    constructor() {
        this.manuallyDraggedPanels = new Set();
        this.resizeTimeout = null;
        this.constraints = {
            edgePadding: 10,
            minTop: 100 // Below header
        };
    }

    /**
     * Initialize all draggable panels
     */
    init() {
        const initPanels = () => {
            const infoPanelElement = document.getElementById('info-panel');
            const speedControlElement = document.getElementById('speed-control');
            
            if (infoPanelElement) {
                this.makeDraggable(infoPanelElement);
            }
            if (speedControlElement) {
                this.makeDraggable(speedControlElement);
            }

            // Ensure close buttons work on touch devices
            this.setupCloseButtonTouchHandlers();
        };

        // Handle case where load event already fired
        if (document.readyState === 'complete') {
            initPanels();
        } else {
            window.addEventListener('load', initPanels);
        }

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Make a panel draggable
     * @param {HTMLElement} panelElement - The panel element to make draggable
     */
    makeDraggable(panelElement) {
        const handle = panelElement.querySelector('.drag-handle');
        if (!handle) return;

        let isDragging = false;
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let dragPanelWidth = 0;
        let dragPanelHeight = 0;

        // Restore saved position from localStorage
        const panelId = panelElement.id;
        const savedPosition = localStorage.getItem(`panel-position-${panelId}`);
        
        // Try to restore saved position for ALL panels (including info-panel)
        if (savedPosition) {
            this.restoreSavedPosition(panelElement, savedPosition, (x, y) => {
                currentX = x;
                currentY = y;
            });
        } else {
            // Use CSS defaults
            const position = this.applyCSSDefaults(panelElement);
            currentX = position.x;
            currentY = position.y;
        }

        handle.style.cursor = 'move';

        const dragStart = (e) => {
            // Don't start dragging if clicking on close button, collapse button, or other interactive elements
            if (e.target.classList.contains('close-btn') || 
                e.target.closest('.close-btn') ||
                e.target.classList.contains('collapse-btn') ||
                e.target.closest('.collapse-btn') ||
                e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'INPUT') {
                return;
            }
            
            // Only allow left mouse button
            if (e.type === 'mousedown' && e.button !== 0) return;

            e.preventDefault();
            isDragging = true;
            panelElement.style.transition = 'none';
            
            // Cache panel dimensions at drag start to avoid repeated reflows
            const rect = panelElement.getBoundingClientRect();
            dragPanelWidth = rect.width;
            dragPanelHeight = rect.height;

            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - currentX;
                initialY = e.touches[0].clientY - currentY;
            } else {
                initialX = e.clientX - currentX;
                initialY = e.clientY - currentY;
            }

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', dragEnd);
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            currentX = clientX - initialX;
            currentY = clientY - initialY;

            // Apply constraints using cached dimensions
            const constrained = this.applyConstraints(panelElement, currentX, currentY, dragPanelWidth, dragPanelHeight);
            currentX = constrained.x;
            currentY = constrained.y;

            panelElement.style.left = currentX + 'px';
            panelElement.style.top = currentY + 'px';
            panelElement.style.right = 'auto';
            panelElement.style.bottom = 'auto';
        };

        const dragEnd = () => {
            isDragging = false;
            panelElement.style.transition = '';
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', dragEnd);

            // Mark panel as manually dragged
            this.manuallyDraggedPanels.add(panelId);

            // Save position to localStorage
            this.savePosition(panelId, currentX, currentY);
        };

        handle.addEventListener('mousedown', dragStart);
        handle.addEventListener('touchstart', dragStart, { passive: false });
    }

    /**
     * Restore saved position with validation
     */
    restoreSavedPosition(panelElement, savedPosition, callback) {
        const panelId = panelElement.id;
        
        try {
            const { x, y } = JSON.parse(savedPosition);
            const rect = panelElement.getBoundingClientRect();
            
            // Validate saved position against constraints
            const { edgePadding, minTop } = this.constraints;
            const minLeft = edgePadding;
            const maxX = window.innerWidth - rect.width - edgePadding;
            const maxY = window.innerHeight - rect.height - edgePadding;
            
            const isValidPosition = y >= minTop && x >= minLeft && x <= maxX && y <= maxY;
            
            if (isValidPosition) {
                // Restore saved position
                panelElement.style.left = x + 'px';
                panelElement.style.top = y + 'px';
                panelElement.style.right = 'auto';
                panelElement.style.bottom = 'auto';
                callback(x, y);
            } else {
                // Invalid saved position - clear and use CSS default
                console.warn(`Invalid saved position for ${panelId} (x: ${x}, y: ${y}). Resetting.`);
                localStorage.removeItem(`panel-position-${panelId}`);
                const position = this.applyCSSDefaults(panelElement);
                callback(position.x, position.y);
            }
        } catch (e) {
            console.warn(`Failed to restore position for ${panelId}:`, e.message);
            const position = this.applyCSSDefaults(panelElement);
            callback(position.x, position.y);
        }
    }

    /**
     * Apply CSS default positioning with constraints
     */
    applyCSSDefaults(panelElement) {
        const rect = panelElement.getBoundingClientRect();
        let x = rect.left;
        let y = rect.top;
        
        // Apply constraints
        const constrained = this.applyConstraints(panelElement, x, y);
        
        panelElement.style.left = constrained.x + 'px';
        panelElement.style.top = constrained.y + 'px';
        panelElement.style.right = 'auto';
        panelElement.style.bottom = 'auto';
        
        return constrained;
    }

    /**
     * Apply viewport constraints to position
     * @param {HTMLElement} panelElement - The panel element
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} [cachedWidth] - Cached panel width (avoids reflow during drag)
     * @param {number} [cachedHeight] - Cached panel height (avoids reflow during drag)
     */
    applyConstraints(panelElement, x, y, cachedWidth, cachedHeight) {
        const width = cachedWidth ?? panelElement.getBoundingClientRect().width;
        const height = cachedHeight ?? panelElement.getBoundingClientRect().height;
        const { edgePadding, minTop } = this.constraints;
        const minLeft = edgePadding;
        const maxX = window.innerWidth - width - edgePadding;
        const maxY = window.innerHeight - height - edgePadding;

        return {
            x: Math.max(minLeft, Math.min(x, maxX)),
            y: Math.max(minTop, Math.min(y, maxY))
        };
    }

    /**
     * Save panel position to localStorage
     */
    savePosition(panelId, x, y) {
        try {
            localStorage.setItem(`panel-position-${panelId}`, JSON.stringify({ x, y }));
        } catch (e) {
            console.warn(`Failed to save position for ${panelId}:`, e);
        }
    }

    /**
     * Reset panel to CSS position (used on resize)
     */
    resetPanelPosition(panelElement) {
        const panelId = panelElement.id;
        
        // Don't reset if manually dragged
        if (this.manuallyDraggedPanels.has(panelId)) {
            return;
        }
        
        // Remove inline styles to use CSS positioning
        panelElement.style.left = '';
        panelElement.style.top = '';
        panelElement.style.right = '';
        panelElement.style.bottom = '';
        
        // Force reflow
        panelElement.offsetHeight;
        
        // Apply CSS defaults with constraints
        this.applyCSSDefaults(panelElement);
    }

    /**
     * Handle window resize with debounce
     */
    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            const infoPanelElement = document.getElementById('info-panel');
            const speedControlElement = document.getElementById('speed-control');
            
            if (infoPanelElement) {
                this.resetPanelPosition(infoPanelElement);
            }
            if (speedControlElement) {
                this.resetPanelPosition(speedControlElement);
            }
        }, 150);
    }

    /**
     * Setup touch handlers for close buttons
     */
    setupCloseButtonTouchHandlers() {
        document.querySelectorAll('.close-btn').forEach(btn => {
            // Prevent drag handler from capturing close button touches
            btn.addEventListener('touchstart', (e) => {
                e.stopPropagation(); // Stop event from reaching drag handler
            }, { passive: false });
            
            // Handle touch end to trigger close
            btn.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent ghost clicks
                e.stopPropagation(); // Stop event from reaching drag handler
                
                // Dispatch a click event instead of using eval
                btn.click();
            }, { passive: false });
            
            // Also handle click event as fallback
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent any interference from parent elements
            });
        });
    }
}

// Create singleton instance
export const panelManager = new PanelManager();
