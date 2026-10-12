import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <App />
);

// ─── PWA Service Worker Update Handling ───────────────────────────────────────
// Registers the service worker and monitors for waiting updates.
// When a new version is detected, an update notification is shown.
// The user can apply it immediately, or dismiss and it applies on next tab open.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Track whether a reload has already been triggered to prevent loops.
        let reloadPending = false;

        const applyUpdate = (worker: ServiceWorker) => {
          if (reloadPending) return;
          reloadPending = true;
          worker.postMessage({ type: 'SKIP_WAITING' });
        };

        const showUpdateBanner = (worker: ServiceWorker) => {
          // Remove any existing banner first.
          const existing = document.getElementById('pwa-update-banner');
          if (existing) existing.remove();

          const banner = document.createElement('div');
          banner.id = 'pwa-update-banner';
          banner.setAttribute('role', 'status');
          banner.setAttribute('aria-live', 'polite');
          Object.assign(banner.style, {
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#0f172a',
            color: '#f1f5f9',
            padding: '12px 20px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            fontSize: '13px',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: '420px',
            width: 'calc(100% - 32px)',
          });

          const msg = document.createElement('span');
          msg.textContent = '🔄 A new version of Notsopedia is available.';

          const updateBtn = document.createElement('button');
          updateBtn.textContent = 'Update now';
          Object.assign(updateBtn.style, {
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            flexShrink: '0',
          });
          updateBtn.addEventListener('click', () => {
            banner.remove();
            applyUpdate(worker);
          });

          const dismissBtn = document.createElement('button');
          dismissBtn.textContent = '✕';
          dismissBtn.setAttribute('aria-label', 'Dismiss update notification');
          Object.assign(dismissBtn.style, {
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px',
            flexShrink: '0',
            padding: '0 4px',
          });
          dismissBtn.addEventListener('click', () => banner.remove());

          banner.appendChild(msg);
          banner.appendChild(updateBtn);
          banner.appendChild(dismissBtn);
          document.body.appendChild(banner);
        };

        // Handle a worker that is already waiting when the page loads.
        if (registration.waiting) {
          showUpdateBanner(registration.waiting);
        }

        // Handle a new worker that enters the waiting state later.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW is installed and waiting. Show the update prompt.
              showUpdateBanner(newWorker);
            }
          });
        });

        // When the SW takes control (after skipWaiting), reload the page once.
        let isRefreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!isRefreshing) {
            isRefreshing = true;
            window.location.reload();
          }
        });
      })
      .catch((error) => {
        console.error('Notsopedia service worker registration failed:', error);
      });
  });
}
