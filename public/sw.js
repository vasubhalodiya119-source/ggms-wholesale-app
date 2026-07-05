const CACHE_NAME = 'ggms-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'GGM&S Wholesale', body: 'નવું notification', url: '/', requireInteraction: false, tag: 'default' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const isNewOrder = data.tag === 'new-order';

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
      vibrate: isNewOrder
        ? [400, 100, 400, 100, 400, 100, 600]  // long-short-long pattern for new orders
        : [200, 100, 200],
      requireInteraction: isNewOrder,
      tag: data.tag || 'default',
      renotify: true,
      silent: false,
    })
  );
});

// Notification click - open the correct page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app already open, navigate it
      for (const client of clientList) {
        if ('navigate' in client && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open fresh window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
