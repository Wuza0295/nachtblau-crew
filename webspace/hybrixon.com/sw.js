/* Hybrixon service worker — Web Push + background-loaded static shell */
const STATIC_CACHE = 'hybrixon-static-v4';
const STATIC_PREFIX = 'hybrixon-static-';
const STATIC_ASSETS = [
  '/manifest.json',
  '/assets/css/style.css?v=113',
  '/assets/js/app.js?v=122',
  '/assets/img/logo-avatar.png',
  '/assets/img/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.allSettled(
        STATIC_ASSETS.map(async (url) => {
          const response = await fetch(new Request(url, { cache: 'reload' }));
          if (response.ok) await cache.put(url, response);
        })
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(STATIC_PREFIX) && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isStatic = url.pathname.startsWith('/assets/')
    || url.pathname === '/manifest.json';
  if (!isStatic) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const update = fetch(request)
        .then(async (response) => {
          if (response.ok && response.status === 200) {
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(update);
        return cached;
      }
      return (await update) || Response.error();
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Hybrixon', body: 'Neue Benachrichtigung', url: '/notifications.php' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        data = Object.assign(data, parsed);
      }
    }
  } catch (_) {
    try {
      const text = event.data ? event.data.text() : '';
      if (text) data.body = text;
    } catch (_) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Hybrixon', {
      body: data.body || '',
      icon: data.icon || '/assets/img/logo-avatar.png',
      badge: '/assets/img/favicon.svg',
      data: { url: data.url || '/notifications.php' },
      vibrate: [120, 60, 120],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/notifications.php';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
      return undefined;
    })
  );
});
