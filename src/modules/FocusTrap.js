const traps = [];
const selector = 'button, [href], input, select, textarea, summary, [tabindex]';

function tabbable(container) {
    return [...container.querySelectorAll(selector)].filter(element =>
        element.tabIndex >= 0 && !element.matches(':disabled') &&
        !element.closest('[inert], [hidden]') && element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility === 'visible');
}

function focusInside(trap) {
    const target = tabbable(trap.container)[0] || trap.container;
    if (!target.hasAttribute('tabindex') && target === trap.container) target.tabIndex = -1;
    target.focus();
}

function onKeyDown(event) {
    const trap = traps.at(-1);
    if (!trap || event.key !== 'Tab') return;
    const controls = tabbable(trap.container);
    event.preventDefault();
    if (!controls.length) { focusInside(trap); return; }
    const current = controls.indexOf(document.activeElement);
    const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0)
        : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    controls[next].focus();
}

function onFocusIn(event) {
    const trap = traps.at(-1);
    if (trap && !trap.container.contains(event.target)) focusInside(trap);
}

export function trapFocus(container) {
    const trap = { container, previous: document.activeElement };
    if (!traps.length) {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('focusin', onFocusIn);
    }
    traps.push(trap);
    focusInside(trap);
    return () => {
        const index = traps.indexOf(trap);
        if (index < 0) return;
        const wasTop = index === traps.length - 1;
        traps.splice(index, 1);
        if (!traps.length) {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('focusin', onFocusIn);
        }
        if (wasTop) {
            if (trap.previous?.isConnected && trap.previous.getClientRects().length) trap.previous.focus();
            const current = traps.at(-1);
            if (current && !current.container.contains(document.activeElement)) focusInside(current);
        }
    };
}