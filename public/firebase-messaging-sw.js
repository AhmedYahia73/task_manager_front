// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Fast activation: skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get('apiKey') || '';
const projectId = urlParams.get('projectId') || 'taskito-50aee';
const messagingSenderId = urlParams.get('messagingSenderId') || '';
const appId = urlParams.get('appId') || '';

if (apiKey && projectId) {
  try {
    firebase.initializeApp({
      apiKey,
      projectId,
      messagingSenderId,
      appId,
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || payload.data?.description || '',
        icon: '/logo.png',
        badge: '/favicon.svg',
        data: payload.data || {},
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (e) {
    console.error('[firebase-messaging-sw.js] Init error:', e);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
    })
  );
});
