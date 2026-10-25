// src/utils/socket.js

import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    // Strip trailing slashes or subpaths if any
    const socketUrl = rawUrl.replace(/\/api\/?$/, "");

    socket = io(socketUrl, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      // Auto join if user exists in localStorage
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          socket.emit("join", { userId: user.id, role: user.role });
        }
      } catch (e) {
        console.error("Socket join error:", e);
      }
    });
  }

  return socket;
};
