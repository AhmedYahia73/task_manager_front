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

    // 4. Send token to backend if not already sent or user changed
    const savedToken = localStorage.getItem("fcm_token");
    const savedUserId = localStorage.getItem("fcm_user_id");

    let currentUserId = null;
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) currentUserId = JSON.parse(storedUser)?.id;
    } catch (e) {}

    if (savedToken !== token || (currentUserId && savedUserId !== currentUserId)) {
      try {
        await apiClient.post("/api/admin/notifications/fcm-token", { token });
        localStorage.setItem("fcm_token", token);
        if (currentUserId) {
          localStorage.setItem("fcm_user_id", currentUserId);
        }
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
      const data = payload.data || {};

      // 🔒 Strict Client Authorization Filter (Matches Socket.IO exactly)
      let currentUser = null;
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) currentUser = JSON.parse(storedUser);
      } catch (e) {}

      if (!currentUser?.id) return;

      const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin";

      // 🔒 Rule 1: If notification is targeted to admins only, current user MUST be an admin
      if (data.target === "admin" && !isAdmin) {
        console.log("[Firebase FCM] ⛔ Filtered out admin notification for non-admin user");
        return;
      }

      // 🔒 Rule 2: If notification is targeted to a specific user, ensure user_id matches
      if (data.user_id && data.user_id !== currentUser.id && !isAdmin && data.target === "user") {
        console.log("[Firebase FCM] ⛔ Filtered out notification for different user");
        return;
      }

      const title = payload.notification?.title || data.title || "New Notification";
      const body = payload.notification?.body || data.body || data.description || "";

      // 🔔 Trigger native OS notification banner ONLY if the window is NOT currently focused
      // (If user is actively focused on the tab, the in-app notification UI is already displayed)
      const isWindowFocused = typeof document !== "undefined" && document.hasFocus() && document.visibilityState === "visible";
      if (!isWindowFocused && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const notifTag = data.id || data.task_id || `taskito_${data.type || 'notif'}`;
          const browserNotif = new Notification(title, {
            body: body,
            icon: "/logo.png",
            badge: "/favicon.svg",
            tag: notifTag,
            renotify: false,
            data: data,
          });

          browserNotif.onclick = () => {
            window.focus();
            if (data.link) {
              window.location.href = data.link;
            }
          };
        } catch (e) {
          console.warn("[Firebase FCM] Native notification display warning:", e);
        }
      }

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
