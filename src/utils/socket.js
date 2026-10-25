// src/utils/socket.js

import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    // Strip trailing slashes or subpaths if any
    const socketUrl = rawUrl.replace(/\/api\/?$/, "");

    socket = io(socketUrl, {
      path: "/socket.io/",
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected successfully with ID:", socket.id);
      // Auto join if user exists in localStorage
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          socket.emit("join", { userId: user.id, role: user.role });
          console.log(`[Socket.IO] Joined room for user: ${user.name || user.id}`);
        }
      } catch (e) {
        console.error("Socket join error:", e);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket.IO] Connection Error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[Socket.IO] Disconnected:", reason);
    });
  }

  return socket;
};
