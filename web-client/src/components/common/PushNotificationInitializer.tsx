"use client";

import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import envConfig from "@/config";
import http from "@/utils/api";
import { getFirebaseMessaging } from "@/utils/firebase";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { addNotification } from "@/stores/slices/notification.slice";

const FCM_TOKEN_KEY = "fcmToken";
const DEVICE_ID_KEY = "fcmDeviceId";
const SW_VERSION = "v3";

const buildServiceWorkerUrl = () => {
  const params = new URLSearchParams({
    apiKey: envConfig.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: envConfig.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: envConfig.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: envConfig.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: envConfig.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  });

  params.set("v", SW_VERSION);
  return `/firebase-messaging-sw.js?${params.toString()}`;
};

const parseMetadata = (value?: string) => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

export default function PushNotificationInitializer() {
  const dispatch = useAppDispatch();
  const { isAuth } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuth) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") return;

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

      if (permission !== "granted") return;

      let registration = await navigator.serviceWorker.getRegistration("/");
      if (!registration) {
        registration = await navigator.serviceWorker.register(
          buildServiceWorkerUrl(),
          { scope: "/" }
        );
      }

      // Ensure the service worker is active before requesting a token.
      registration = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey: envConfig.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        const existingDeviceId = localStorage.getItem(DEVICE_ID_KEY);
        const deviceId =
          existingDeviceId ||
          (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

        if (!existingDeviceId) {
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        localStorage.setItem(FCM_TOKEN_KEY, token);
        try {
          await http.post("/notification/notification/push/subscribe", {
            token,
            platform: "WEB",
            deviceId,
          });
        } catch (apiError) {
          console.warn("Failed to subscribe to push notifications:", apiError);
        }
      }

      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Heloo: ", payload);
        
        const data = payload.data || {};

        // Foreground: chi cap nhat UI, tranh bi dup thong bao trinh duyet.
        dispatch(
          addNotification({
            id: data.notificationId || payload.messageId || `${Date.now()}`,
            title: payload.notification?.title || data.title || "Thông báo mới",
            body: payload.notification?.body || data.body || "",
            isRead: false,
            createdAt: new Date().toISOString(),
            type: data.type || undefined,
            metadata: parseMetadata(data.metadata),
            actionUrl: data.actionUrl || undefined,
            priority: data.priority || undefined,
            icon: payload.notification?.icon || data.icon || "/logo.png",
          })
        );
      });
    };

    init().catch((error) => {
      console.error("Push init failed:", error);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch, isAuth]);

  return null;
}
