import { audioManager } from './AudioManager.js';
import { safeGetItem, safeSetItem } from './storage.js';

export function setupOnboarding(uiManager) {
    const overlay = document.getElementById('onboarding-overlay');
    const nextBtn = document.getElementById('onboarding-next');
    const startBtn = document.getElementById('onboarding-start');
    const skipBtn = document.getElementById('onboarding-skip');
    const dots = document.querySelectorAll('.onboarding-dots .dot');
    const steps = document.querySelectorAll('.onboarding-step');

    if (!overlay) return;

    // Check if first visit
    const hasSeenOnboarding = safeGetItem('space_voyage_onboarding_complete');

    if (!hasSeenOnboarding) {
        // Show onboarding after a brief delay
        setTimeout(() => {
            overlay.classList.remove('hidden');
            if (uiManager && typeof uiManager._trapFocus === 'function') {
                uiManager._trapFocus(overlay);
            }
        }, 1000);
    }

    let currentStep = 1;
    const totalSteps = 3;

    const updateStep = (step) => {
        currentStep = step;

        // Update steps
        steps.forEach(s => s.classList.remove('active'));
        const activeStep = document.querySelector(`.onboarding-step[data-step="${step}"]`);
        if (activeStep) activeStep.classList.add('active');

        // Update dots
        dots.forEach(d => d.classList.remove('active'));
        const activeDot = document.querySelector(`.onboarding-dots .dot[data-step="${step}"]`);
        if (activeDot) activeDot.classList.add('active');

        // Show/hide buttons
        if (step === totalSteps) {
            nextBtn?.classList.add('hidden');
            startBtn?.classList.remove('hidden');
        } else {
            nextBtn?.classList.remove('hidden');
            startBtn?.classList.add('hidden');
        }
    };

    const closeOnboarding = () => {
        overlay.classList.add('hidden');
        if (uiManager && typeof uiManager._releaseFocusTrap === 'function') {
            uiManager._releaseFocusTrap();
        }
        safeSetItem('space_voyage_onboarding_complete', 'true');
    };

    nextBtn?.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            updateStep(currentStep + 1);
        }
    });

    startBtn?.addEventListener('click', closeOnboarding);
    skipBtn?.addEventListener('click', closeOnboarding);

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const step = parseInt(dot.dataset.step, 10);
            if (step) updateStep(step);
        });
    });
}
