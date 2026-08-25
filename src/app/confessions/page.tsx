"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  MessageCircle,
  Share2,
  Flag,
  ShieldCheck,
  User,
  Heart,
  GraduationCap,
  PartyPopper,
  Plane,
  Briefcase,
  Users,
  MessageSquare,
  Sparkles,
  Check,
  Send,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { ConfessionItem, CategoryType, ReactionType } from "@/types/confessions";
import { getSharedConversationsForUser } from "@/lib/messagesStore";
import { CreateConfessionModal } from "@/components/confessions/CreateConfessionModal";
import { CommentsModal } from "@/components/confessions/CommentsModal";
import { ReportModal } from "@/components/confessions/ReportModal";
import { Badge } from "@/components/ui/Badge";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES: { label: string; value: CategoryType | "All"; icon: React.ReactNode }[] = [
  { label: "All", value: "All", icon: <Sparkles size={13} /> },
  { label: "Love", value: "Love", icon: <Heart size={13} className="text-red-500" /> },
  { label: "Campus", value: "Campus", icon: <GraduationCap size={13} className="text-purple-500" /> },
  { label: "Events", value: "Events", icon: <PartyPopper size={13} className="text-pink-500" /> },
  { label: "Trips", value: "Trips", icon: <Plane size={13} className="text-blue-500" /> },
  { label: "Careers", value: "Careers", icon: <Briefcase size={13} className="text-amber-500" /> },
  { label: "Friendships", value: "Friendships", icon: <Users size={13} className="text-emerald-500" /> },
  { label: "General", value: "General", icon: <MessageSquare size={13} className="text-gray-500" /> },
];

export default function ConfessionsPage() {
  const router = useRouter();
  const [confessions, setConfessions] = useState<ConfessionItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFullName, setUserFullName] = useState("Student User");
  const [userEmail, setUserEmail] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeCommentConfession, setActiveCommentConfession] = useState<ConfessionItem | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSharedConfessions = useCallback(async () => {
    try {
      const res = await fetch("/api/confessions");
      const data = await res.json();
      if (data.success && Array.isArray(data.confessions)) {
        setConfessions(data.confessions);
      }
    } catch (err) {
      console.warn("Failed to sync shared confessions:", err);
    }
  }, []);

  const fetchUnreadDmCount = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const d = await res.json();
      if (d.success && Array.isArray(d.conversations)) {
        const totalUnread = d.conversations.reduce(
          (acc: number, c: { unreadCount?: number }) => acc + (c.unreadCount || 0),
          0
        );
        setUnreadDmCount(totalUnread);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // 1. Initial Fetch
    fetchSharedConfessions();
    fetchUnreadDmCount();

    // 2. Extract user session info from cookies
    if (typeof window !== "undefined") {
      const sessionStr = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sm_user_session="))
        ?.split("=")[1];
      if (sessionStr) {
        try {
          const parsed = JSON.parse(decodeURIComponent(sessionStr));
          if (parsed.fullName) setUserFullName(parsed.fullName);
          if (parsed.email) setUserEmail(parsed.email);
        } catch {
          // default
        }
      }
    }

    // 3. Set up cross-device real-time sync polling (every 3 seconds)
    const interval = setInterval(() => {
      fetchSharedConfessions();
      fetchUnreadDmCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchSharedConfessions, fetchUnreadDmCount]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchSharedConfessions(), fetchUnreadDmCount()]);
    triggerToast("🔄 Feed synced in real-time!");
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Reaction handler (syncs to server)
  const handleReaction = async (id: string, reaction: ReactionType) => {
    // Optimistic UI update
    setConfessions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const hasReacted = !!item.userReactions[reaction];
        return {
          ...item,
          reactions: {
            ...item.reactions,
            [reaction]: Math.max(0, item.reactions[reaction] + (hasReacted ? -1 : 1)),
          },
          userReactions: {
            ...item.userReactions,
            [reaction]: !hasReacted,
          },
        };
      })
    );

    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "react",
          confessionId: id,
          reaction,
          userEmail,
        }),
      });
      const data = await res.json();
      if (data.success && data.confessions) {
        setConfessions(data.confessions);
      }
    } catch {
      // fallback
    }
  };

  // Create Confession handler (Posts to shared server API)
  const handleCreateConfession = async (
    content: string,
    category: CategoryType,
    isAnonymous: boolean,
    imageUrl?: string
  ) => {
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          category,
          isAnonymous,
          userFullName,
          userEmail,
          imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        triggerToast(`⚠️ ${data.error || "Moderation check failed"}`);
        return;
      }

      if (data.success && data.confessions) {
        setConfessions(data.confessions);
        triggerToast("✨ Confession posted & visible to all students!");
      }
    } catch {
      triggerToast("❌ Failed to post confession.");
    }
  };

  // Delete Confession Handler (Syncs deletion to shared server)
  const handleDeletePost = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this confession post?")) {
      try {
        const res = await fetch(`/api/confessions?id=${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success && data.confessions) {
          setConfessions(data.confessions);
          triggerToast("🗑️ Post deleted successfully!");
        }
      } catch {
        triggerToast("❌ Could not delete post.");
      }
    }
  };

  // Public Comment handler (Syncs comment to shared server)
  const handleAddComment = async (confessionId: string, text: string, isAnonymous: boolean) => {
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          confessionId,
          content: text,
          userFullName,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (data.success && data.confessions) {
        setConfessions(data.confessions);
        if (activeCommentConfession) {
          const currentConf = data.confessions.find((c: ConfessionItem) => c.id === confessionId) || null;
          setActiveCommentConfession(currentConf);
        }
        triggerToast("💬 Comment added!");
      }
    } catch {
      triggerToast("❌ Comment failed.");
    }
  };

  // Share handler
  const handleShare = (confession: ConfessionItem) => {
    if (navigator.share) {
      navigator
        .share({
          title: "MEETUP Confession",
          text: `"${confession.content.slice(0, 80)}..."`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("🔗 Confession link copied to clipboard!");
    }
  };

  // Message Privately handler (API-backed for real cross-device DMs)
  const handleMessagePrivately = async (confession: ConfessionItem) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          confessionId: confession.id,
          confessionSnippet: confession.content.slice(0, 80),
          authorId: confession.authorId,
          authorName: confession.authorName,
          authorIsAnonymous: confession.isAnonymous,
          currentUserId: userEmail || "user-current",
          currentUserName: userFullName,
        }),
      });

      const data = await res.json();
      if (data.success && data.conversation) {
        triggerToast(
          `💬 Private conversation opened with ${
            confession.isAnonymous ? "Anonymous • Student ✓" : confession.authorName
          }`
        );

        setTimeout(() => {
          window.location.href = `/messages?convId=${data.conversation.id}`;
        }, 300);
      } else {
        triggerToast("❌ Could not start private chat.");
      }
    } catch {
      triggerToast("❌ Could not start private chat.");
    }
  };

  // Filter confessions
  const filteredConfessions = confessions.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 text-gray-900 flex flex-col pb-24">
      <Navbar userEmail={userEmail} userFullName={userFullName} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gray-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check size={15} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive App Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6">
        {/* Navigation & Controls Bar */}
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className="w-9 h-9 rounded-2xl bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-700 transition-all border border-indigo-100"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                  Campus Confessions
                  <span className="text-xs py-0.5 px-2.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Live Synced
                  </span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Shared anonymous campus feed for all students (AI Moderated)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                className={`p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all border border-gray-200 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                title="Sync Feed"
              >
                <RefreshCw size={18} />
              </button>

              <Link
                href="/messages"
                className="relative py-2 px-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all flex items-center gap-2 border border-indigo-200"
              >
                <MessageSquare size={16} />
                <span className="hidden sm:inline">Private Messages</span>
                {unreadDmCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                    {unreadDmCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

        {/* Search & New Post Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search confessions, advice..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 shadow-xs"
            />
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="py-2.5 px-4 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#EF4444]/20 transition-all shrink-0 active:scale-95"
          >
            <Plus size={16} />
            <span>Post</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.value)}
              className={`relative py-1.5 px-3.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.value
                  ? "bg-[#111827] text-white border-[#111827] shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Confessions Feed — Multi-Column Responsive Grid on Desktop */}
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredConfessions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm px-4 col-span-full">
              <Sparkles size={36} className="mx-auto text-gray-300 mb-2 animate-bounce" />
              <h3 className="font-bold text-gray-800 text-sm">No confessions found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-[220px] mx-auto">
                Be the first student to post a story or advice under this category!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 py-2 px-4 rounded-xl bg-[#4F46E5] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Post Confession
              </motion.button>
            </div>
          ) : (
            filteredConfessions.map((item, index) => {
              const isOwner =
                (userEmail && item.authorId?.includes(userEmail)) ||
                (!item.isAnonymous && item.authorName === userFullName);

              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col gap-3.5 transition-shadow hover:shadow-md"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {item.isAnonymous ? (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                          <User size={16} />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
                          {item.authorAvatar || item.authorName.charAt(0)}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-gray-900">
                            {item.isAnonymous ? "Anonymous Student" : item.authorName}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                            {item.authorCollege || "Student ✓"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {item.createdAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" size="sm" className="text-[10px] font-bold">
                        {item.category}
                      </Badge>

                      {isOwner && (
                        <button
                          onClick={() => handleDeletePost(item.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all ml-1"
                          title="Delete Post"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confession Content */}
                  <p className="text-xs font-normal text-gray-800 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>

                  {/* Attached Image if present */}
                  {item.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-gray-100 max-h-64 mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt="Campus confession photo"
                        className="w-full h-auto object-cover max-h-64"
                      />
                    </div>
                  )}

                  {/* Reaction Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReaction(item.id, "heart")}
                        className={`py-1 px-2 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                          item.userReactions.heart
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Heart
                          size={13}
                          className={item.userReactions.heart ? "fill-red-500 text-red-500" : ""}
                        />
                        <span>{item.reactions.heart}</span>
                      </button>

                      <button
                        onClick={() => handleReaction(item.id, "relatable")}
                        className={`py-1 px-2 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                          item.userReactions.relatable
                            ? "bg-purple-50 text-purple-600 border border-purple-200"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span>🤝</span>
                        <span>{item.reactions.relatable}</span>
                      </button>

                      <button
                        onClick={() => handleReaction(item.id, "support")}
                        className={`py-1 px-2 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                          item.userReactions.support
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span>💭</span>
                        <span>{item.reactions.support}</span>
                      </button>
                    </div>

                    {/* Comment & Private DM Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveCommentConfession(item)}
                        className="py-1 px-2 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-1 transition-all"
                      >
                        <MessageCircle size={13} />
                        <span>{item.commentsCount}</span>
                      </button>

                      <button
                        onClick={() => handleMessagePrivately(item)}
                        className="py-1 px-2 rounded-xl text-[11px] font-bold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 transition-all"
                        title="Private Chat"
                      >
                        <Send size={12} />
                        <span>DM</span>
                      </button>

                      <button
                        onClick={() => handleShare(item)}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                        title="Share"
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Create Modal */}
      <CreateConfessionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateConfession}
        userFullName={userFullName}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={!!activeCommentConfession}
        onClose={() => setActiveCommentConfession(null)}
        confession={activeCommentConfession}
        onAddComment={handleAddComment}
        userFullName={userFullName}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        confessionId={null}
        onReportSubmitted={() => triggerToast("🛡️ Report submitted for moderator review")}
      />
      </div>
    </div>
  );
}
