/* Hybrixon service worker — Web Push + lightweight offline shell */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
