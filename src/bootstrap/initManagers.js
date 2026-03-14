import { panelManager } from '../modules/PanelManager.js';
import { serviceWorkerManager } from '../modules/ServiceWorkerManager.js';
import { pwaManager } from '../modules/PWAManager.js';

panelManager.init();
serviceWorkerManager.init();
pwaManager.init();
