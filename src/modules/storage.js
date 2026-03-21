export function safeGetItem(key) {
 try {
  return localStorage.getItem(key);
 } catch {
  return null;
 }
}

export function safeSetItem(key, value) {
 try {
  localStorage.setItem(key, value);
 } catch {
  // Ignore storage failures in privacy-restricted environments.
 }
}

export function safeRemoveItem(key) {
 try {
  localStorage.removeItem(key);
 } catch {
  // Ignore storage failures in privacy-restricted environments.
 }
}
