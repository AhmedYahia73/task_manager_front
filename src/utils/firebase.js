// src/utils/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "taskito-50aee.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "taskito-50aee",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "taskito-50aee.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

let messagingInstance = null;

/**
 * 🔒 Initialize Firebase Messaging if supported by the browser and keys are provided
 */
export const getFirebaseMessaging = async () => {
  if (messagingInstance) return messagingInstance;

  try {
    const supported = await isSupported();
    if (!supported) {
      return null;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return null;
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error("[Firebase FCM] Initialization error:", error);
    return null;
  }
};

/**
 * 🔔 Request Notification Permission and register device token with backend
 */
export const requestNotificationPermissionAndGetToken = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    if (!firebaseConfig.apiKey) {
      return null;
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[Firebase FCM] Notification permission was not granted:", permission);
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 2. Register service worker with config params and wait for it to be active
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(firebaseConfig.apiKey)}&projectId=${encodeURIComponent(firebaseConfig.projectId)}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId)}&appId=${encodeURIComponent(firebaseConfig.appId)}`;
    await navigator.serviceWorker.register(swUrl, { scope: "/" });
    
    // Wait until service worker is fully active and ready before subscribing
    const readyRegistration = await navigator.serviceWorker.ready;

    // Additional safeguard: ensure active worker exists
    if (!readyRegistration.active) {
      let attempts = 0;
      while (!readyRegistration.active && attempts < 25) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
    }

    // 3. Retrieve FCM device token with graceful fallback
    let token = null;
    const cleanVapidKey = vapidKey ? String(vapidKey).trim().replace(/^["']|["']$/g, "").trim() : "";
    const isValidVapidFormat = cleanVapidKey.length > 70 && cleanVapidKey.startsWith("B");

    if (isValidVapidFormat) {
      try {
        token = await getToken(messaging, {
          vapidKey: cleanVapidKey,
          serviceWorkerRegistration: readyRegistration,
        });
      } catch (vapidErr) {
        console.warn("[Firebase FCM] getToken with vapidKey failed, attempting fallback:", vapidErr.message);
        try {
          token = await getToken(messaging, { serviceWorkerRegistration: readyRegistration });
        } catch (fbErr) {
          console.error("[Firebase FCM] Fallback getToken failed:", fbErr);
        }
      }
    } else {
      if (cleanVapidKey && !isValidVapidFormat) {
        console.warn("[Firebase FCM] Notice: VITE_FIREBASE_VAPID_KEY is not a valid 88-char Web Push Key Pair. Using default certificate.");
      }
      try {
        token = await getToken(messaging, { serviceWorkerRegistration: readyRegistration });
      } catch (fbErr) {
        console.error("[Firebase FCM] getToken failed:", fbErr);
      }
    }

    if (!token) {
      console.warn("[Firebase FCM] No registration token returned.");
      return null;
    }

    console.log("[Firebase FCM] 📲 Device Token received:", token.substring(0, 15) + "...");

    // 4. Send token to backend if not already sent or token updated
    const savedToken = localStorage.getItem("fcm_token");
    if (savedToken !== token) {
      try {
        await apiClient.post("/api/admin/notifications/fcm-token", { token });
        localStorage.setItem("fcm_token", token);
        console.log("[Firebase FCM] ✅ Token registered with backend successfully.");
      } catch (apiErr) {
        console.error("[Firebase FCM] Failed to save token to backend:", apiErr);
      }
    }

    return token;
  } catch (error) {
    console.error("[Firebase FCM] Error requesting permission/token:", error);
    return null;
  }
};

/**
 * 💬 Setup Foreground Notification Listener
 */
export const setupForegroundFCMListener = async (onNotificationReceived) => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[Firebase FCM] 📩 Foreground message received:", payload);
      const title = payload.notification?.title || payload.data?.title || "New Notification";
      const body = payload.notification?.body || payload.data?.body || payload.data?.description || "";

      // Show toast
      toast.info(body || title, {
        description: title,
        duration: 5000,
      });

      if (onNotificationReceived) {
        onNotificationReceived(payload);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("[Firebase FCM] Foreground listener setup error:", error);
    return () => {};
  }
};
