// Service Worker para habilitar la instalación de la aplicación web (PWA)
const CACHE_NAME = 'smartcaja-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Manejador simple de fetch para cumplir con los requisitos de instalación PWA de Google Chrome y Safari
  event.respondWith(fetch(event.request));
});
