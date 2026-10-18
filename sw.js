/**
 * Офлайн-режим Kamron APP.
 *
 * Имя кэша привязано к версии из package.json и переписывается сборкой
 * (tools/build.mjs), поэтому после обновления старые файлы не остаются
 * у пользователя. Все кэши с префиксом kamron-app- и другой версией
 * удаляются при активации.
 *
 * Стратегия — сеть вперёд: опубликованные изменения доходят сразу,
 * а кэш выручает только когда сети нет.
 */
const CACHE = 'kamron-app-v1.2.4';
const PREFIX = 'kamron-app-';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Отдельные запросы: один недоступный файл не должен отменить весь кэш.
      .then(cache => Promise.all(ASSETS.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy).catch(() => {}));
        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
  );
});

/** Тап по напоминанию открывает приложение, а не новую вкладку. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) if ('focus' in client) return client.focus();
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
      return undefined;
    })
  );
});
