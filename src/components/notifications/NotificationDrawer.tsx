"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCheck, MapPin, MessageSquare, Heart, MessageCircle, Sparkles } from "lucide-react";
import { SystemNotification, NotificationType } from "@/types/notifications";

function formatNotifTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

interface SwipeItemProps {
  children: React.ReactNode;
  onDismiss: () => void;
}

function SwipeItem({ children, onDismiss }: SwipeItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startXRef = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);
  const DISMISS_THRESHOLD = 100;

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
    hasDraggedRef.current = false;
    if (itemRef.current) itemRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 5) {
      hasDraggedRef.current = true;
    }
    setOffsetX(delta);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (Math.abs(offsetX) >= DISMISS_THRESHOLD) {
      // Animate out then dismiss
      setDismissed(true);
      setTimeout(onDismiss, 300);
    } else {
      // Snap back
      setOffsetX(0);
    }
  };

  const handleCaptureClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  if (dismissed) return null;

  return (
    <div
      ref={itemRef}
      style={{
        transform: dismissed
          ? `translateX(${offsetX > 0 ? "100%" : "-100%"})`
          : `translateX(${offsetX}px)`,
        opacity: dismissed ? 0 : Math.max(0, 1 - Math.abs(offsetX) / 200),
        transition: isDragging ? "none" : "transform 0.28s ease, opacity 0.28s ease",
        touchAction: "pan-y",
        userSelect: "none",
        cursor: "grab",
        position: "relative",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleCaptureClick}
    >
      {children}
    </div>
  );
}

export default function NotificationDrawer({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | "all">("all");
  // Track IDs dismissed this session — prevents polls from resurrecting them
  const dismissedIds = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const url = userEmail
        ? `/api/notifications?email=${encodeURIComponent(userEmail)}`
        : "/api/notifications";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const fresh: SystemNotification[] = (data.notifications || []).filter(
          (n: SystemNotification) => !dismissedIds.current.has(n.id)
        );
        setNotifications(fresh);
        setUnreadCount(fresh.filter((n) => !n.isRead).length);
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

  const handleMarkRead = (id: string) => {
    // Optimistic UI updates
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setIsOpen(false);

    // Call API in the background silently
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", id }),
    }).catch(() => {});
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

  const handleDismiss = async (id: string) => {
    // Register in session-local dismissed set so polls never bring it back
    dismissedIds.current.add(id);
    // Remove from UI immediately
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === id);
      if (notif && !notif.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
    // Permanently delete from server so it never comes back even after re-login
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", id }),
      });
    } catch {
      /* ignore – session guard already prevents re-appearance */
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
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-12 px-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
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
                    Swipe left/right to dismiss · Tap to open
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
              {(["all", "radar", "message", "loveguru", "confession"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f as NotificationType | "all")}
                  className={`py-1 px-3 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap ${
                    selectedFilter === f
                      ? "bg-purple-600 text-white border-transparent shadow-sm"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {f === "all" && `All (${notifications.length})`}
                  {f === "radar" && "📡 Radar"}
                  {f === "message" && "💬 DMs"}
                  {f === "loveguru" && "❤️ Guru Ji"}
                  {f === "confession" && "🤫 Confess"}
                </button>
              ))}
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
                  <SwipeItem key={n.id} onDismiss={() => handleDismiss(n.id)}>
                    <Link
                      href={n.link}
                      onClick={() => handleMarkRead(n.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 block w-full text-left outline-none ${
                        n.isRead
                          ? "bg-white border-gray-100 text-gray-500"
                          : "bg-purple-50/70 border-purple-200/80 text-gray-900 shadow-sm"
                      }`}
                    >
                      {/* Left icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.isRead ? "bg-gray-50 border border-gray-100" : "bg-white border border-gray-100"}`}>
                        {getIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-extrabold text-xs leading-tight truncate ${n.isRead ? "text-gray-600" : "text-gray-900"}`}>
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${n.isRead ? "text-gray-400" : "text-gray-600"}`}>
                          {n.message}
                        </p>
                        <span className="text-[9px] font-semibold text-gray-400 block pt-0.5">
                          {formatNotifTime(n.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </SwipeItem>
                ))
              )}
            </div>

            {/* Footer hint */}
            {filteredNotifs.length > 0 && (
              <p className="text-center text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-50">
                ← Swipe to remove · Tap to open →
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
