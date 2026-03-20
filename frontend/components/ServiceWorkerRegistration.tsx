'use client'; // This component runs only on the client side

// Registers or unregisters the service worker depending on environment
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * ServiceWorkerRegistration component
 * 
 * Registers the service worker in production for PWA features.
 * 
 * Unregisters any existing service workers in development to avoid caching issues.
 * 
 * @example
 * <ServiceWorkerRegistration />
 * 
 * @returns null
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only run in browser and if service workers are supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Production: register service worker for PWA features
      if (process.env.NODE_ENV !== 'development') {
        let refreshing = false;
        // Reload page when a new service worker takes control
        const handleControllerChange = () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        };

        // Register service worker from /sw.js
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            logger.info('Service Worker registered:', registration.scope);

            // Listen for updates to the service worker
            const handleUpdateFound = () => {
              const newWorker = registration.installing;
              if (newWorker) {
                // When new service worker is installed and ready
                const handleStateChange = () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Prompt user to reload for new version
                    logger.info('New Service Worker available');

                    if (confirm('Nuova versione disponibile! Ricaricare la pagina?')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      setTimeout(() => {
                        window.location.reload();
                      }, 100);
                    }
                  }
                };
                newWorker.addEventListener('statechange', handleStateChange);
              }
            };

            registration.addEventListener('updatefound', handleUpdateFound);
          })
          .catch((error) => {
            // Log registration errors
            logger.error('Service Worker registration failed:', error);
          });

        // Listen for controller changes to trigger reload
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        // Cleanup event listener on unmount
        return () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
      } else {
        // Development: unregister all service workers to avoid caching issues
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
            logger.info('Service Worker unregistered in development');
          });
        });
      }
    }
  }, []);

  // This component does not render anything
  return null;
}
