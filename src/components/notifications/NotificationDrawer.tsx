"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCheck, MapPin, MessageSquare, Heart, MessageCircle, Sparkles } from "lucide-react";
import { SystemNotification, NotificationType } from "@/types/notifications";

export default function NotificationDrawer({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | "all">("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const url = userEmail
        ? `/api/notifications?email=${encodeURIComponent(userEmail)}`
        : "/api/notifications";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      /* ignore */
    }
  }, [userEmail]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string, link: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setIsOpen(false);
      router.push(link);
    } catch {
      router.push(link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead", email: userEmail }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const filteredNotifs =
    selectedFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === selectedFilter);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "radar":
        return <MapPin size={15} className="text-purple-600" />;
      case "message":
        return <MessageSquare size={15} className="text-blue-600" />;
      case "loveguru":
        return <Heart size={15} className="text-pink-600" />;
      case "confession":
        return <MessageCircle size={15} className="text-indigo-600" />;
      default:
        return <Sparkles size={15} className="text-purple-600" />;
    }
  };

  return (
    <>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all border border-purple-200/60 shadow-sm flex items-center justify-center"
        title="Campus Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black shadow-md animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-12 px-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl max-h-[82vh] flex flex-col border border-purple-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900">Notifications Hub</h3>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Real-time updates across Campus Radar, DMs &amp; Guru Ji
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-0.5"
                    title="Mark all as read"
                  >
                    <CheckCheck size={12} /> Mark read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`py-1 px-3 rounded-full text-[11px] font-bold border transition-all ${
                  selectedFilter === "all"
                    ? "bg-purple-600 text-white border-transparent shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setSelectedFilter("radar")}
                className={`py-1 px-3 rounded-full text-[11px] font-bold border transition-all ${
                  selectedFilter === "radar"
                    ? "bg-purple-600 text-white border-transparent shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                📡 Radar
              </button>
              <button
                onClick={() => setSelectedFilter("message")}
                className={`py-1 px-3 rounded-full text-[11px] font-bold border transition-all ${
                  selectedFilter === "message"
                    ? "bg-purple-600 text-white border-transparent shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                💬 DMs
              </button>
              <button
                onClick={() => setSelectedFilter("loveguru")}
                className={`py-1 px-3 rounded-full text-[11px] font-bold border transition-all ${
                  selectedFilter === "loveguru"
                    ? "bg-purple-600 text-white border-transparent shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                ❤️ Guru Ji
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {filteredNotifs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-1">
                  <Bell size={28} className="mx-auto text-gray-300" />
                  <p className="text-xs font-bold">No notifications found</p>
                  <p className="text-[10px]">You are all caught up!</p>
                </div>
              ) : (
                filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id, n.link)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      n.isRead
                        ? "bg-gray-50/60 border-gray-100 text-gray-600"
                        : "bg-purple-50/70 border-purple-200/80 text-gray-900 font-medium shadow-sm"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-xs">
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-gray-900 leading-tight">
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[9px] font-semibold text-gray-400 block pt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
