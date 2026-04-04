/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker — must live at /firebase-messaging-sw.js (root of the deployed site).
// Version must stay aligned with the `firebase` package in package.json (see importScripts URLs below).

importScripts(
  'https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyDtP6gF7fR0MPMqJDufCEl7ifxlLgUYn8k',
  authDomain: 'justathannotifications.firebaseapp.com',
  projectId: 'justathannotifications',
  storageBucket: 'justathannotifications.firebasestorage.app',
  messagingSenderId: '82916304795',
  appId: '1:82916304795:web:452a1a41864e23773e633e',
  measurementId: 'G-NLP8ETW45N',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title || payload.data?.title || 'Prayer notification';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || '/logo192.png',
    data: payload.data || {},
  };
  return self.registration.showNotification(title, options);
});
