import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSentry } from './config/sentry';
import './styles/globals.css';

// Handle stale Vite dynamic chunk preload errors following new deployments
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const reloadKey = 'mentor_vite_preload_reload';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

window.addEventListener('error', (event) => {
  if (
    event.message &&
    /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      event.message
    )
  ) {
    const reloadKey = 'mentor_vite_module_reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
    }
  }
});

// Initialize Sentry error monitoring
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
