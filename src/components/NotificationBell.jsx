// src/components/NotificationBell.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Clock, Check, AlertCircle, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { getSocket } from "@/utils/socket";
import { toast } from "sonner";
import { requestNotificationPermissionAndGetToken, setupForegroundFCMListener } from "@/utils/firebase";

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [testingFCM, setTestingFCM] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_LIMIT = 15;

  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  // Fetch notifications from API with pagination
  const fetchNotifications = async (targetPage = 1, isAppend = false) => {
    try {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await apiClient.get(`/api/admin/notifications?page=${targetPage}&limit=${PAGE_LIMIT}`);
      if (res?.data?.success) {
        const fetchedList = res.data.data.notifications || [];
        const pagination = res.data.data.pagination;

        if (res.data.data.unreadCount !== undefined) {
          setUnreadCount(res.data.data.unreadCount);
        }

        if (isAppend) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const uniqueNew = fetchedList.filter((n) => !existingIds.has(n.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setNotifications(fetchedList);
        }

        setPage(targetPage);
        if (pagination) {
          setHasMore(pagination.hasMore ?? (targetPage < pagination.totalPages));
        } else {
          setHasMore(fetchedList.length >= PAGE_LIMIT);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      if (isAppend) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Scroll handler for infinite pagination inside dropdown
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (!loading && !loadingMore && hasMore) {
        fetchNotifications(page + 1, true);
      }
    }
  };

  // Refresh first page when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications(1, false);

    // Initialize Firebase Cloud Messaging & request token
    requestNotificationPermissionAndGetToken();

    // Listen for foreground FCM push notifications
    let unsubscribeFCM = () => {};
    setupForegroundFCMListener((payload) => {
      const data = payload.data || {};
      const newNotif = {
        id: data.id || `fcm_${Date.now()}`,
        target: data.target || "user",
        type: data.type || "general",
        link: data.link || null,
        description: payload.notification?.body || data.description || "New Notification",
        createdAt: new Date().toISOString(),
        is_read: false,
      };
      setNotifications((prev) => {
        if (data.id && prev.some((n) => n.id === data.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((c) => c + 1);
    }).then((unsub) => {
      if (typeof unsub === "function") unsubscribeFCM = unsub;
    });

    // Setup Socket.IO listener for real-time notifications
    const socket = getSocket();

    // Ensure user is joined to their socket room
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        socket.emit("join", { userId: u.id, role: u.role });
      }
    } catch (e) {}

    const handleNewNotification = (data) => {
      if (!data) return;

      let currentUser = null;
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) currentUser = JSON.parse(storedUser);
      } catch (e) {}

      if (!currentUser?.id) return;

      const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin";

      // 🔒 Rule 1: If notification is targeted to admins only, current user MUST be an admin
      if (data.target === "admin" && !isAdmin) {
        return;
      }

      // 🔒 Rule 2: If notification is targeted to a specific user, ensure user_id matches
      if (data.user_id && data.user_id !== currentUser.id && !isAdmin && data.target === "user") {
        return;
      }

      // 🔒 Rule 3: Deduplication - prevent duplicate notifications in state and duplicate toast
      setNotifications((prev) => {
        // If an item with the same ID already exists, do not duplicate
        if (data.id && prev.some((n) => n.id === data.id)) {
          return prev;
        }

        // Check if an identical notification was added in the last 4 seconds
        const isRecentDuplicate = prev.slice(0, 5).some(
          (n) => n.description === data.description &&
                 Math.abs(Date.now() - new Date(n.createdAt).getTime()) < 4000
        );
        if (isRecentDuplicate) {
          return prev;
        }

        // Show real-time toast alert EXACTLY ONCE
        const title =
          data.type === "online_days"
            ? "Online Work Days Assigned"
            : data.type === "task_status"
            ? "Task Status Updated"
            : "New Notification";

        toast.info(data.description, {
          description: title,
          duration: 6000,
        });

        setUnreadCount((c) => c + 1);

        const newNotif = {
          id: data.id || `notif_${Date.now()}`,
          target: data.target || "user",
          type: data.type || "general",
          link: data.link || null,
          description: data.description,
          createdAt: data.created_at || new Date().toISOString(),
          is_read: false,
        };

        return [newNotif, ...prev];
      });
    };

    socket.on("new_notification", handleNewNotification);

    // Expose test function for quick debugging from console if needed
    window.testFCMNotification = () => handleTestFCM();

    return () => {
      socket.off("new_notification", handleNewNotification);
      if (typeof unsubscribeFCM === "function") unsubscribeFCM();
      delete window.testFCMNotification;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark a single notification as read and navigate if link exists
  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      setIsOpen(false);
      navigate(notif.link);
    }
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.put(`/api/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put("/api/admin/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Delete notification
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.delete(`/api/admin/notifications/${id}`);
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id);
        if (item && !item.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Test Firebase FCM Push Notification
  const handleTestFCM = async (e) => {
    if (e) e.stopPropagation();
    try {
      setTestingFCM(true);
      const token = localStorage.getItem("fcm_token");
      const res = await apiClient.post("/api/admin/notifications/test-fcm", {
        token: token || undefined,
      });
      if (res?.data?.success) {
        toast.success("تم إرسال إشعار Firebase التجريبي بنجاح! 🚀", {
          description: "تحقق من وصول إشعار النظام لجهازك الآن",
        });
      } else {
        toast.error("فشل إرسال الإشعار: " + (res?.data?.message || "خطأ"));
      }
    } catch (err) {
      console.error("Test FCM error:", err);
      toast.error("خطأ أثناء تجربة الإشعار: " + (err?.response?.data?.message || err.message));
    } finally {
      setTestingFCM(false);
    }
  };

  // Helper for human readable time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="admin-topbar__icon-btn relative flex items-center justify-center transition-transform active:scale-95"
        title="Notifications"
        type="button"
      >
        <Bell className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestFCM}
                disabled={testingFCM}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                title="إرسال إشعار تجريبي عبر Firebase الآن"
              >
                {testingFCM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🔔 تجربة Firebase</span>}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List Content with Infinite Scroll Pagination */}
          <div 
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60"
          >
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  No notifications yet
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Task updates from leaders & engineers will appear here
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notif) => {
                  const isOnlineType = notif.type === "online_days";
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                        notif.is_read
                          ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 opacity-75"
                          : "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40"
                      }`}
                    >
                      {/* Status Indicator Icon */}
                      <div
                        className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          isOnlineType
                            ? notif.is_read
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-emerald-500 text-white shadow-sm"
                            : notif.is_read
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300"
                        }`}
                      >
                        {isOnlineType ? <CalendarDays className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>

                      {/* Text Description & Time */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                              notif.target === "admin"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {notif.target === "admin" ? "Admin" : "Employee"}
                          </span>
                        </div>
                        <p
                          className={`text-xs leading-relaxed break-words ${
                            notif.is_read ? "font-normal text-zinc-700 dark:text-zinc-300" : "font-semibold text-zinc-900 dark:text-white"
                          }`}
                        >
                          {notif.description}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(notif.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions / Dot */}
                      <div className="absolute right-3 top-3 flex items-center gap-1">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread" />
                        )}
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-opacity rounded"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Loading More Spinner on Scroll */}
                {loadingMore && (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/20">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading more notifications...</span>
                  </div>
                )}

                {/* All Caught Up Indicator */}
                {!hasMore && notifications.length > 10 && (
                  <div className="py-2.5 text-center text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50/30 dark:bg-zinc-900/20">
                    All notifications loaded
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
