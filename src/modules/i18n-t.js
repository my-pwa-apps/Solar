// ===========================
// SHARED i18n TRANSLATION SHIM
// ===========================
// i18n.js is loaded globally (classic script) in index.html and sets window.t once
// translations are ready. This late-binding wrapper lets ES modules call t() at any
// time without capturing window.t at import time (before it exists). Single source of
// truth — import this instead of redefining the shim in every module.
export const t = (key) => (window.t || ((k) => k))(key);
