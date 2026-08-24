"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Search,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Navigation,
  Sparkles,
  Trash2,
  Shield,
  Layers,
  Map as MapIcon,
  List,
  X,
  Compass,
  MessageSquare,
} from "lucide-react";
import { CampusActivity, RadarCategory } from "@/types/radar";
import ReportBlockModal from "@/components/ReportBlockModal";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "motion/react";

// Dynamic imports for Leaflet components (prevents SSR window undefined issue)
const RadarMap = dynamic(() => import("@/components/radar/RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 animate-pulse flex items-center justify-center text-xs font-bold text-purple-600 gap-2">
      <Compass className="animate-spin" size={18} /> Loading Interactive Radar Map...
    </div>
  ),
});

const LocationPickerMap = dynamic(() => import("@/components/radar/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-44 rounded-xl bg-purple-50 animate-pulse flex items-center justify-center text-xs font-bold text-purple-600 gap-2">
      <Compass className="animate-spin" size={16} /> Loading Location Picker...
    </div>
  ),
});

const CATEGORIES: { label: string; value: RadarCategory | "All"; emoji: string }[] = [
  { label: "All", value: "All", emoji: "✨" },
  { label: "Sports", value: "Sports", emoji: "⚽" },
  { label: "Study", value: "Study", emoji: "📚" },
  { label: "Food", value: "Food", emoji: "🍕" },
  { label: "Gaming", value: "Gaming", emoji: "🎮" },
  { label: "Events", value: "Events", emoji: "🎉" },
  { label: "Trips", value: "Trips", emoji: "🎒" },
  { label: "Clubs", value: "Clubs", emoji: "🏛️" },
  { label: "Personal", value: "Personal Meetups", emoji: "☕" },
  { label: "Others", value: "Others", emoji: "✨" },
];

export default function RadarPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<CampusActivity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RadarCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "map" | "list">("split");

  // User state & real-time GPS
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("Student");
  const [userId, setUserId] = useState("anon-user");
  const [userLat, setUserLat] = useState(28.6012);
  const [userLng, setUserLng] = useState(77.2181);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Real-time Browser Geolocation watch
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => console.log("GPS note:", err.message),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [safetyModal, setSafetyModal] = useState<{
    targetUserId: string;
    targetUserName: string;
    targetId: string;
  } | null>(null);

  // Fetch session & blocked users
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionStr = document.cookie
        .split("; ")
        .find((r) => r.startsWith("sm_user_session="))
        ?.split("=")[1];
      if (sessionStr) {
        try {
          const p = JSON.parse(decodeURIComponent(sessionStr));
          if (p.email) setUserEmail(p.email);
          if (p.fullName) setUserFullName(p.fullName);
          if (p.email) {
            setUserId(p.email);
            fetch(`/api/safety?userId=${encodeURIComponent(p.email)}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && Array.isArray(data.blockedIds)) {
                  setBlockedUserIds(data.blockedIds);
                }
              })
              .catch(() => {});
          }
        } catch { /* ignore */ }
      }
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      let url = "/api/radar";
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const fetchedList = data.activities || [];
        setActivities(fetchedList);

        // Auto select activity if deep linked via ?openId=
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const openId = urlParams.get("openId");
          if (openId && !selectedActivityId) {
            setSelectedActivityId(openId);
          }
        }
      }
    } catch { /* ignore */ }
  }, [selectedCategory, searchQuery]);

  // Real-time polling every 3 seconds
  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // Handlers
  const handleJoinToggle = async (activityId: string) => {
    try {
      const res = await fetch("/api/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", activityId, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? data.activity : a))
        );
        if (data.joined) {
          triggerToast("🎉 Joined activity! +5 Meetup Points");
        } else {
          triggerToast("Left activity");
        }
      } else {
        triggerToast(`❌ ${data.error || "Failed to update"}`);
      }
    } catch {
      triggerToast("❌ Action failed");
    }
  };

  const handleChatHost = async (act: CampusActivity) => {
    try {
      triggerToast("💬 Opening chat with host...");
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          confessionId: act.id,
          confessionSnippet: `Campus Radar: ${act.title}`,
          authorId: act.hostId,
          authorName: act.hostName,
          authorIsAnonymous: act.isAnonymousHost,
          currentUserId: userId,
          currentUserName: userFullName,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        router.push(`/messages?convId=${data.conversation.id}`);
      } else {
        triggerToast("❌ Could not start chat");
      }
    } catch {
      triggerToast("❌ Action failed");
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this campus activity?")) return;
    try {
      const res = await fetch("/api/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", activityId }),
      });
      const data = await res.json();
      if (data.success) {
        setActivities((prev) => prev.filter((a) => a.id !== activityId));
        triggerToast("🗑️ Activity deleted");
      }
    } catch {
      triggerToast("❌ Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 text-gray-900 flex flex-col pb-20">
      <Navbar userEmail={userEmail} userFullName={userFullName} />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-gray-900/90 backdrop-blur-md text-white text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Main Responsive Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-4">
        {/* Top Controls Header Bar */}
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className="w-9 h-9 rounded-2xl bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-700 transition-all border border-purple-100"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-lg tracking-tight text-gray-900">Campus Radar Map</h1>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500">
                  Real-time GPS activity pinpoints near your location
                </p>
              </div>
            </div>

            {/* View Mode Switches (Mobile / Desktop) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 ${
                  viewMode === "split" ? "bg-white text-purple-700 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
                }`}
                title="Split View"
              >
                <Layers size={14} />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 ${
                  viewMode === "map" ? "bg-white text-purple-700 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
                }`}
                title="Map View"
              >
                <MapIcon size={14} />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 ${
                  viewMode === "list" ? "bg-white text-purple-700 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
                }`}
                title="List View"
              >
                <List size={14} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 pt-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities, landmarks, topics..."
                className="w-full py-2 pl-10 pr-3 text-xs bg-gray-50 rounded-2xl border border-gray-200 focus:border-purple-500 focus:bg-white outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`shrink-0 flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold border transition-all ${
                    selectedCategory === cat.value
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area — Responsive Desktop Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Interactive Radar Map (Takes 7 cols on Desktop) */}
          {(viewMode === "split" || viewMode === "map") && (
            <div className={`lg:col-span-7 rounded-3xl overflow-hidden shadow-lg border border-purple-100 ${
              viewMode === "map" ? "h-[calc(100vh-230px)]" : "h-80 lg:h-[calc(100vh-230px)] min-h-[400px]"
            }`}>
              <RadarMap
                activities={activities}
                selectedActivityId={selectedActivityId}
                onSelectActivity={(act) => setSelectedActivityId(act.id)}
                userLat={userLat}
                userLng={userLng}
              />
            </div>
          )}

          {/* Right Column: Activity Cards Feed (Takes 5 cols on Desktop or 12 cols in List View) */}
          {(viewMode === "split" || viewMode === "list") && (
            <div className={`${
              viewMode === "list" ? "lg:col-span-12" : "lg:col-span-5"
            } space-y-3.5 overflow-y-auto max-h-[calc(100vh-230px)] pr-1`}>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  {activities.length} Live Campus Activities
                </span>
                <span className="text-[11px] text-green-700 font-bold bg-green-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                  Real-time GPS Pinpoint
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 p-6 space-y-2">
                  <Compass size={32} className="mx-auto text-purple-300 animate-spin" />
                  <h3 className="font-extrabold text-sm text-gray-800">No activities found</h3>
                  <p className="text-xs text-gray-400">
                    Be the first to host a meetup, study group, or game session near campus!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 py-2 px-4 rounded-xl bg-purple-600 text-white text-xs font-bold inline-flex items-center gap-1 shadow-md hover:bg-purple-700 transition-all"
                  >
                    <Plus size={14} /> Host Activity Now
                  </button>
                </div>
              ) : (
                activities.map((act) => {
                  const isHost = act.hostId === userId || act.hostId === userEmail;
                  const isJoined = act.participantIds.includes(userId);
                  const isSelected = selectedActivityId === act.id;
                  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${act.latitude},${act.longitude}`;

                  return (
                    <article
                      key={act.id}
                      onClick={() => setSelectedActivityId(act.id)}
                      className={`rounded-2xl bg-white border p-4 shadow-sm space-y-3 transition-all cursor-pointer ${
                        isSelected
                          ? "border-purple-500 ring-2 ring-purple-200 shadow-md"
                          : "border-gray-100 hover:border-purple-200"
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {act.category}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            📍 {act.approxDistance}
                          </span>
                        </div>

                        {isHost && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(act.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-all"
                            title="Delete Activity"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900 leading-snug">{act.title}</h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{act.description}</p>
                      </div>

                      {/* Location & Time Info */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-gray-600 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-purple-500 shrink-0" />
                          <span className="truncate">{act.locationName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock size={13} className="text-purple-500 shrink-0" />
                          <span className="truncate">{act.time}</span>
                        </div>
                      </div>

                      {/* Host & Participants Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-black">
                            {act.isAnonymousHost ? <Shield size={10} /> : act.hostName.charAt(0)}
                          </div>
                          <span className="text-[11px] font-semibold text-gray-700">
                            Host: {act.hostName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                          <Users size={13} />
                          <span>
                            {act.participantCount} {act.maxParticipants ? `/ ${act.maxParticipants}` : ""} Interested
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinToggle(act.id);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isJoined
                              ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
                          }`}
                        >
                          {isJoined ? (
                            <>
                              <CheckCircle2 size={13} /> Joined
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Join
                            </>
                          )}
                        </button>

                        {!isHost && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChatHost(act);
                              }}
                              className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all flex items-center gap-1 border border-purple-200 shadow-sm"
                              title="Direct Message Host"
                            >
                              <MessageSquare size={13} /> DM Host
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSafetyModal({
                                  targetUserId: act.hostId,
                                  targetUserName: act.hostName,
                                  targetId: act.id,
                                });
                              }}
                              className="py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center gap-1 border border-red-200 shadow-xs shrink-0"
                              title="Report or Block Host"
                            >
                              <Shield size={13} />
                            </button>
                          </>
                        )}

                        <Link
                          href={`/meetups?openId=${act.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold transition-all flex items-center gap-1 border border-amber-200 shadow-xs shrink-0"
                          title="Open Squad Hub (Chat, Split Bill, Polls)"
                        >
                          ☕ Meetup Hub
                        </Link>

                        <a
                          href={navUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-2 px-2.5 rounded-xl bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-purple-700 text-xs font-bold transition-all flex items-center gap-1 border border-gray-200 shrink-0"
                        >
                          <Navigation size={13} /> Nav
                        </a>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Floating Host Activity Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 py-3 px-5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-extrabold text-xs shadow-2xl hover:shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/40 backdrop-blur-md"
        >
          <Plus size={18} /> Host Campus Activity
        </button>

        {/* Create Activity Modal */}
        {showCreateModal && (
          <CreateActivityModal
            userId={userId}
            userFullName={userFullName}
            initialLat={userLat}
            initialLng={userLng}
            onClose={() => setShowCreateModal(false)}
            onCreated={(newAct) => {
              setActivities((prev) => [newAct, ...prev]);
              setShowCreateModal(false);
              triggerToast("🚀 Activity hosted on Campus Radar!");
            }}
          />
        )}

        {/* Report / Block Modal */}
        {safetyModal && (
          <ReportBlockModal
            currentUserId={userId}
            targetUserId={safetyModal.targetUserId}
            targetUserName={safetyModal.targetUserName}
            targetId={safetyModal.targetId}
            targetType="activity"
            onClose={() => setSafetyModal(null)}
            onSuccess={(action) => {
              if (action === "blocked") {
                setBlockedUserIds((prev) => [...prev, safetyModal.targetUserId]);
                triggerToast("⛔ User blocked successfully");
              } else {
                triggerToast("🛡️ Report submitted to AI Safety");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// ====== CREATE ACTIVITY MODAL ======
function CreateActivityModal({
  userId,
  userFullName,
  initialLat,
  initialLng,
  onClose,
  onCreated,
}: {
  userId: string;
  userFullName: string;
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  onCreated: (act: CampusActivity) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RadarCategory>("Sports");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number>(initialLat);
  const [longitude, setLongitude] = useState<number>(initialLng);
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymousHost, setIsAnonymousHost] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim() || !time.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          category,
          locationName: locationName.trim(),
          latitude,
          longitude,
          time: time.trim(),
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
          description: description.trim(),
          hostId: userId,
          hostName: userFullName,
          isAnonymousHost,
        }),
      });

      const data = await res.json();
      if (data.success && data.activity) {
        onCreated(data.activity);
      } else {
        alert(data.error || "Failed to create activity");
      }
    } catch {
      alert("Failed to create activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900">Host Campus Activity</h3>
              <p className="text-[10px] text-purple-600 font-bold">Pinpoint exact event location on live map</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RadarCategory)}
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white font-medium outline-none focus:border-purple-500"
            >
              <option value="Sports">⚽ Sports & Fitness</option>
              <option value="Study">📚 Study & Exams</option>
              <option value="Food">🍕 Food & Chai Catchup</option>
              <option value="Gaming">🎮 Gaming & Esports</option>
              <option value="Events">🎉 Events & Jam Sessions</option>
              <option value="Trips">🎒 Trips & Outings</option>
              <option value="Clubs">🏛️ Clubs & Tech Sprints</option>
              <option value="Personal Meetups">☕ Personal Meetups</option>
              <option value="Others">✨ Others</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Activity Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5v5 Turf Football Match ⚽"
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
            />
          </div>

          {/* Interactive Map Location Picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
              <span>Pin Exact Location on Map</span>
              <span className="text-[10px] text-purple-600 font-semibold">
                ({latitude.toFixed(4)}, {longitude.toFixed(4)})
              </span>
            </label>
            <LocationPickerMap
              lat={latitude}
              lng={longitude}
              onPick={(pickedLat, pickedLng, name) => {
                setLatitude(pickedLat);
                setLongitude(pickedLng);
                if (name && !locationName) {
                  setLocationName(name);
                }
              }}
            />
          </div>

          {/* Location Landmark */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Landmark / Building Name
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Central Library 2nd Floor Study Pods"
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
            />
          </div>

          {/* Time & Max Participants */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Time</label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. Today @ 5:30 PM"
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Max Capacity (Optional)</label>
              <input
                type="number"
                min="2"
                max="100"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="e.g. 10"
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the plans? Who can join? Any gear or prep needed?"
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Host Anonymously Toggle */}
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 cursor-pointer">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Shield size={14} className="text-purple-600" /> Host Anonymously
            </span>
            <input
              type="checkbox"
              checked={isAnonymousHost}
              onChange={(e) => setIsAnonymousHost(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={15} /> Publish to Live Campus Radar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
