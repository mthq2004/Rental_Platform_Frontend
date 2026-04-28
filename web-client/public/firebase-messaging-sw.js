/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
  measurementId: params.get("measurementId"),
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage((payload) => {
  console.log("heloo ajL : ", payload);

  if (payload.notification && payload.data?.forceShow !== "1") {
    return;
  }

  const title = payload.data?.title || payload.notification?.title || "Thông báo mới";
  const body = payload.data?.body || payload.notification?.body || "Bạn có thông báo mới.";
  const url = payload.data?.actionUrl || "";
  const rawIcon = payload.data?.icon || payload.notification?.icon || "/logo.png";
  const icon = rawIcon.startsWith("/")
    ? `${self.location.origin}${rawIcon}`
    : rawIcon;
  const badge = icon;

  const notificationOptions = {
    body,
    icon,
    badge,
    data: { url }
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url;
  if (!url) return;

  const targetUrl = url.startsWith("/") ? `${self.location.origin}${url}` : url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
