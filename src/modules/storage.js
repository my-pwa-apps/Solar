/**
 * localStorage wrappers that never throw.
 *
 * Access can fail for reasons the app cannot control: Safari private browsing,
 * third-party-cookie blocking in an iframe, enterprise policy, or a full quota.
 * Every failure is non-fatal (settings simply do not persist), but swallowing
 * them without a trace made "my settings don't stick" impossible to diagnose,
 * so failures are surfaced when debugging is enabled.
 */
import { DEBUG } from './utils.js';

function report(operation, key, error) {
 if (DEBUG && DEBUG.enabled) {
  console.warn(`[storage] ${operation}("${key}") failed:`, error);
 }
}

export function safeGetItem(key) {
 try {
  return localStorage.getItem(key);
 } catch (error) {
  report('getItem', key, error);
  return null;
 }
}

export function safeSetItem(key, value) {
 try {
  localStorage.setItem(key, value);
  return true;
 } catch (error) {
  report('setItem', key, error);
  return false;
 }
}

export function safeRemoveItem(key) {
 try {
  localStorage.removeItem(key);
  return true;
 } catch (error) {
  report('removeItem', key, error);
  return false;
 }
}
