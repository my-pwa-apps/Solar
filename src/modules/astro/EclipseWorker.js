import { findNextSolarEclipse } from './Eclipse.js';

self.addEventListener('message', (event) => {
  const { startJd, searchDays } = event.data || {};
  try {
    const result = findNextSolarEclipse(startJd, searchDays);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
});
