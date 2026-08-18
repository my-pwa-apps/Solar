/**
 * Terminal-failure surface.
 *
 * Before this existed, a throw during boot left the user staring at a loading
 * spinner forever: a hard failure was indistinguishable from a slow network,
 * there was no action to take, and nothing to quote in a bug report. The most
 * common real-world cause is a half-written service-worker cache after an
 * interrupted update, which is why "clear cache and reload" is offered as a
 * first-class action rather than buried in browser settings.
 *
 * Built entirely with DOM APIs (no innerHTML) so the error text — which can
 * contain arbitrary strings from a thrown value — can never be parsed as markup.
 */
import { APP_VERSION } from './utils.js';

const OVERLAY_ID = 'fatal-error';

const t = (key, fallback) => {
    const translated = window.t ? window.t(key) : key;
    return !translated || translated === key ? fallback : translated;
};

let shown = false;

async function clearAllStorage() {
    const jobs = [];

    if ('serviceWorker' in navigator) {
        jobs.push(
            navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
        );
    }

    if ('caches' in window) {
        jobs.push(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
    }

    if (window.indexedDB?.databases) {
        jobs.push(
            indexedDB
                .databases()
                .then((dbs) =>
                    Promise.all(dbs.map((db) => db.name && indexedDB.deleteDatabase(db.name)))
                )
        );
    }

    // A failure to clear one store must not block the reload — the user is
    // already in a broken state and a reload is the only way forward.
    await Promise.allSettled(jobs);
}

function button(label, onClick, variant) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = variant;
    el.textContent = label;
    el.addEventListener('click', onClick);
    return el;
}

/**
 * Replace the loading screen with an actionable failure report.
 * Safe to call more than once; only the first call is rendered.
 *
 * @param {string} message  Human-readable summary shown to the user.
 * @param {unknown} [cause] The thrown value, surfaced under "technical details".
 */
export function showFatalError(message, cause) {
    if (shown) return;
    shown = true;

    document.getElementById('loading')?.classList.add('hidden');
    document.getElementById(OVERLAY_ID)?.remove();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'fatal-error-title');

    const panel = document.createElement('div');
    panel.className = 'fatal-error-panel';

    const title = document.createElement('h2');
    title.id = 'fatal-error-title';
    title.textContent = t('errorLoading', 'Error loading Space Voyage');

    const body = document.createElement('p');
    body.textContent = message || t('errorMessage', 'Please refresh the page to try again.');

    const actions = document.createElement('div');
    actions.className = 'fatal-error-actions';
    actions.append(
        button(t('errorReload', 'Reload'), () => window.location.reload(), 'btn-primary'),
        button(
            t('errorClearCache', 'Clear cache and reload'),
            async (event) => {
                event.currentTarget.disabled = true;
                await clearAllStorage();
                window.location.reload();
            },
            'btn-secondary'
        )
    );

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = t('errorDetails', 'Technical details');
    const pre = document.createElement('pre');
    const detail = cause instanceof Error ? `${cause.message}\n${cause.stack || ''}` : String(cause ?? '');
    pre.textContent = `v${APP_VERSION}\n${navigator.userAgent}\n\n${detail}`.trim();
    details.append(summary, pre);

    panel.append(title, body, actions, details);
    overlay.append(panel);
    document.body.appendChild(overlay);

    // The overlay is the only thing the user can act on, so put focus on it
    // rather than leaving it on whatever the failed boot last touched.
    overlay.querySelector('button')?.focus();
}
