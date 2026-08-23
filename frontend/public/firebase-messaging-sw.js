// Firebase Cloud Messaging (FCM) Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
const firebaseConfig = {
  apiKey: 'AIzaSyA4GGmEvT2yApRrXdpj3Os8zpRDFoW7JTE',
  authDomain: 'lastmiledelivery-b0bdd.firebaseapp.com',
  projectId: 'lastmiledelivery-b0bdd',
  storageBucket: 'lastmiledelivery-b0bdd.firebasestorage.app',
  messagingSenderId: '596146850741',
  appId: '1:596146850741:web:2bb089d745f8059698a7fc',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Delivero Logistics Update';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New delivery update available.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open_order', title: '📦 View Consignment' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
