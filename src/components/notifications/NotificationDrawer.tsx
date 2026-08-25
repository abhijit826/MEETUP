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
  const startXRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const DISMISS_THRESHOLD = 40; // 40px swipe triggers removal easily

  const handleStart = (clientX: number) => {
    startXRef.current = clientX;
    currentOffsetRef.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
    hasDraggedRef.current = false;
  };

  const handleMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const delta = clientX - startXRef.current;
    currentOffsetRef.current = delta;
    if (Math.abs(delta) > 5) {
      hasDraggedRef.current = true;
    }
    setOffsetX(delta);
  };

  const handleEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const finalOffset = currentOffsetRef.current;
    if (Math.abs(finalOffset) >= DISMISS_THRESHOLD) {
      const exitDirection = finalOffset > 0 ? 400 : -400;
      setOffsetX(exitDirection);
      setTimeout(() => {
        onDismiss();
      }, 180);
    } else {
      setOffsetX(0);
      currentOffsetRef.current = 0;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    handleStart(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    handleMove(e.clientX);
  };

  const onPointerUp = () => {
    handleEnd();
  };

  const onPointerCancel = () => {
    handleEnd();
  };

  const handleCaptureClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const isSwipingLeft = offsetX < -8;
  const isSwipingRight = offsetX > 8;

  return (
    <div className="relative overflow-hidden rounded-2xl select-none">
      <div
        className={`absolute inset-0 bg-red-500 text-white flex items-center justify-between px-4 transition-opacity duration-150 rounded-2xl ${
          Math.abs(offsetX) > 8 ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className={`flex items-center gap-1.5 font-extrabold text-xs ${isSwipingRight ? "opacity-100" : "opacity-40"}`}>
          <span>🗑 Remove</span>
        </div>
        <div className={`flex items-center gap-1.5 font-extrabold text-xs ${isSwipingLeft ? "opacity-100" : "opacity-40"}`}>
          <span>Remove 🗑</span>
        </div>
      </div>

      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          opacity: Math.max(0, 1 - Math.abs(offsetX) / 280),
          transition: isDragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
          touchAction: "pan-y",
          cursor: isDragging ? "grabbing" : "grab",
          position: "relative",
          willChange: "transform, opacity",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={handleCaptureClick}
      >
        {children}
      </div>
    </div>
  );
}

export default function NotificationDrawer({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | "all">("all");
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

  const handleMarkReadAndNavigate = (id: string, link: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setIsOpen(false);
    if (link) {
      router.push(link);
    }
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
    dismissedIds.current.add(id);
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === id);
      if (notif && !notif.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", id }),
      });
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

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-12 px-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl max-h-[82vh] flex flex-col border border-purple-100">
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
                    <div
                      onClick={() => handleMarkReadAndNavigate(n.id, n.link)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 w-full text-left outline-none ${
                        n.isRead
                          ? "bg-white border-gray-100 text-gray-500 hover:bg-gray-50/80"
                          : "bg-purple-50/70 border-purple-200/80 text-gray-900 shadow-sm hover:bg-purple-100/60"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.isRead ? "bg-gray-50 border border-gray-100" : "bg-white border border-gray-100"}`}>
                        {getIcon(n.type)}
                      </div>

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
                    </div>
                  </SwipeItem>
                ))
              )}
            </div>

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
