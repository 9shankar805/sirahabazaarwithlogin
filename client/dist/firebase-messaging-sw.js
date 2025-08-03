// Firebase Cloud Messaging Service Worker
// This file handles background push notifications for Siraha Bazaar

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: "AIzaSyCUDoNuJ5hUKzwnZJe8hp5Rbt_Ja1MCDpw",
  authDomain: "sirahabazaar-bc62f.firebaseapp.com",
  projectId: "sirahabazaar-bc62f",
  storageBucket: "sirahabazaar-bc62f.firebasestorage.app",
  messagingSenderId: "898667729116",
  appId: "1:898667729116:web:bf417c13c2651c0bc26419",
  measurementId: "G-SK3VBMNR5N"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Siraha Bazaar';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: payload.notification?.imageUrl,
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: false,
    tag: payload.data?.type || 'general',
    silent: false,
    vibrate: [200, 100, 200], // For mobile devices
    timestamp: Date.now()
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle different notification types
  const data = event.notification.data;
  let urlToOpen = '/';

  if (data) {
    switch (data.type) {
      case 'order_update':
        urlToOpen = `/orders/${data.orderId}`;
        break;
      case 'delivery_assignment':
        urlToOpen = `/delivery/${data.orderId}`;
        break;
      case 'promotion':
        urlToOpen = '/promotions';
        break;
      case 'new_order':
        urlToOpen = '/seller/orders';
        break;
      default:
        urlToOpen = '/';
    }
  }

  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: data,
            url: urlToOpen
          });
          return;
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + urlToOpen);
      }
    })
  );
});

// Handle push event directly (for better mobile support)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload:', payload);
    
    const notificationTitle = payload.notification?.title || 'Siraha Bazaar';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      image: payload.notification?.imageUrl,
      data: payload.data,
      requireInteraction: false,
      tag: payload.data?.type || 'general',
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      actions: [
        {
          action: 'open',
          title: 'Open'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('Error processing push event:', error);
  }
});