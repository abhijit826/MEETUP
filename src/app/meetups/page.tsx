"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
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
  MessageSquare,
  Send,
  DollarSign,
  Vote,
  Award,
  Compass,
  X,
  ChevronRight,
  ShieldAlert,
  Shield,
  Trash2,
} from "lucide-react";
import { MeetupItem, MeetupCategory } from "@/types/meetups";
import ReportBlockModal from "@/components/ReportBlockModal";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "motion/react";

// Dynamic import for Leaflet LocationPicker Map
const LocationPickerMap = dynamic(() => import("@/components/radar/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-44 rounded-xl bg-purple-50 animate-pulse flex items-center justify-center text-xs font-bold text-purple-600 gap-2">
      <Compass className="animate-spin" size={16} /> Loading Location Picker...
    </div>
  ),
});

const RadarMap = dynamic(() => import("@/components/radar/RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-60 rounded-2xl bg-purple-50 animate-pulse flex items-center justify-center text-xs font-bold text-purple-600 gap-2">
      <Compass className="animate-spin" size={18} /> Loading Meetups Map...
    </div>
  ),
});

const CATEGORIES: { label: string; value: MeetupCategory | "All"; emoji: string }[] = [
  { label: "All", value: "All", emoji: "✨" },
  { label: "Chai & Snacks", value: "Chai & Snacks", emoji: "☕" },
  { label: "Study", value: "Study", emoji: "📚" },
  { label: "Sports", value: "Sports", emoji: "⚽" },
  { label: "Trips", value: "Trips", emoji: "🎒" },
  { label: "Gaming", value: "Gaming", emoji: "🎮" },
  { label: "Other", value: "Other", emoji: "✨" },
];

export default function MeetupsPage() {
  const [meetups, setMeetups] = useState<MeetupItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MeetupCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMeetup, setActiveMeetup] = useState<MeetupItem | null>(null);
  const [showHostModal, setShowHostModal] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "map">("feed");

  // User state & real-time GPS
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("Student");
  const [userId, setUserId] = useState("anon-user");
  const [userLat, setUserLat] = useState(12.82247);
  const [userLng, setUserLng] = useState(80.02622);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Real-time GPS watch
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => console.log("GPS note:", err.message),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(id);
    }
  }, []);

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [safetyModal, setSafetyModal] = useState<{
    targetUserId: string;
    targetUserName: string;
    targetId: string;
  } | null>(null);

  // Fetch Session & Blocked Users
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

  const activeMeetupIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeMeetupIdRef.current = activeMeetup?.id || null;
  }, [activeMeetup]);

  // Fetch Meetups with polling
  const fetchMeetups = useCallback(async () => {
    try {
      let url = "/api/meetups";
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const fetchedList = data.meetups || [];
        setMeetups(fetchedList);

        // Auto open if deep linked via ?openId=
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const openId = urlParams.get("openId");
          if (openId && !activeMeetupIdRef.current) {
            const target = fetchedList.find((m: MeetupItem) => m.id === openId);
            if (target) setActiveMeetup(target);
          }
        }

        const currentActiveId = activeMeetupIdRef.current;
        if (currentActiveId) {
          const updated = fetchedList.find((m: MeetupItem) => m.id === currentActiveId);
          if (updated) setActiveMeetup(updated);
        }
      }
    } catch { /* ignore */ }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchMeetups();
    const interval = setInterval(fetchMeetups, 3000);
    return () => clearInterval(interval);
  }, [fetchMeetups]);

  // Join / Leave Toggle
  const handleJoinToggle = async (meetupId: string) => {
    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", meetupId, userId, userName: userFullName }),
      });
      const data = await res.json();
      if (data.success) {
        setMeetups((prev) => prev.map((m) => (m.id === meetupId ? data.meetup : m)));
        if (activeMeetup?.id === meetupId) setActiveMeetup(data.meetup);
        triggerToast(data.joined ? "🎉 Joined Meetup!" : "Left Meetup");
      } else {
        triggerToast(`❌ ${data.error || "Failed"}`);
      }
    } catch {
      triggerToast("❌ Action failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 text-gray-900 flex flex-col pb-20">
      <Navbar userEmail={userEmail} userFullName={userFullName} />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-gray-900/90 backdrop-blur-md text-white text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Main Responsive App Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6">
        {/* Header Controls Bar */}
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
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
                  <h1 className="font-black text-lg tracking-tight text-gray-900">MEETUP Hub</h1>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500">
                  Join campus study squads, chai catchups &amp; sports meetups
                </p>
              </div>
            </div>

            {/* Feed / Map View Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setViewMode("feed")}
                className={`py-1.5 px-3 rounded-xl text-xs transition-all font-bold ${
                  viewMode === "feed" ? "bg-white text-purple-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Feed Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`py-1.5 px-3 rounded-xl text-xs transition-all font-bold ${
                  viewMode === "map" ? "bg-white text-purple-700 shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Radar Map
              </button>
            </div>
          </div>

          {/* Search & Categories Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chai meetups, study pods, turf games..."
                className="w-full py-2 pl-10 pr-3 text-xs bg-gray-50 rounded-2xl border border-gray-200 focus:border-purple-500 focus:bg-white outline-none transition-all"
              />
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

        {/* Content View */}
        <div className="flex-1 space-y-4">
          {viewMode === "map" ? (
            <div className="h-[calc(100vh-230px)] min-h-[450px] rounded-3xl overflow-hidden border border-purple-200 shadow-lg">
              <RadarMap
                activities={meetups.map((m) => ({
                  id: m.id,
                  title: m.title,
                  description: m.description,
                  category: m.category as any,
                  locationName: m.locationName,
                  approxDistance: "~100m",
                  latitude: m.latitude,
                  longitude: m.longitude,
                  time: m.time,
                  hostId: m.hostId,
                  hostName: m.hostName,
                  isAnonymousHost: false,
                  maxParticipants: m.maxParticipants,
                  participantIds: m.participantIds,
                  participantCount: m.participantIds.length,
                  createdAt: m.createdAt,
                  tags: [],
                }))}
                selectedActivityId={activeMeetup?.id || null}
                onSelectActivity={(act) => {
                  const m = meetups.find((item) => item.id === act.id);
                  if (m) setActiveMeetup(m);
                }}
                userLat={userLat}
                userLng={userLng}
              />
            </div>
          ) : (
            /* Feed List — Multi-Column Responsive Grid on Desktop */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  {meetups.length} Active MEETUP Squads
                </span>
                <span className="text-xs text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-purple-200">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                  Live GPS Synced
                </span>
              </div>

              {meetups.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8 space-y-3 shadow-xs">
                  <Compass size={36} className="mx-auto text-purple-400 animate-spin" />
                  <h3 className="font-extrabold text-base text-gray-800">No meetups found</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Be the first to host a chai catchup, study squad, or sports meetup near campus!
                  </p>
                  <button
                    onClick={() => setShowHostModal(true)}
                    className="mt-2 py-2.5 px-5 rounded-2xl bg-purple-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md hover:bg-purple-700 transition-all"
                  >
                    <Plus size={16} /> Host Meetup Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {meetups.map((m) => {
                    const isJoined = m.participantIds.includes(userId);
                    return (
                      <article
                        key={m.id}
                        onClick={() => setActiveMeetup(m)}
                        className="rounded-3xl bg-white border border-gray-100 hover:border-purple-300 p-5 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                      >
                        {/* Top Bar */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                            {m.category}
                          </span>
                          <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                            👥 {m.participantIds.length} {m.maxParticipants ? `/ ${m.maxParticipants}` : ""} Attending
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-black text-base text-gray-900 leading-snug group-hover:text-purple-700 transition-colors">
                            {m.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                            {m.description}
                          </p>
                        </div>

                        {/* Location & Time Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={14} className="text-purple-500 shrink-0" />
                            <span className="truncate">{m.locationName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock size={14} className="text-purple-500 shrink-0" />
                            <span className="truncate">{m.time}</span>
                          </div>
                        </div>

                        {/* Interactive Badges & Action Bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-100">
                              <Award size={11} /> {m.checkIns.length} Checked In
                            </span>
                            {m.expenses.length > 0 && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-100">
                                <DollarSign size={11} /> Split Bill
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinToggle(m.id);
                            }}
                            className={`py-1.5 px-3.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                              isJoined
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-purple-600 text-white shadow-xs hover:bg-purple-700"
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
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Host Button */}
        <button
          onClick={() => setShowHostModal(true)}
          className="fixed bottom-6 right-6 z-40 py-3 px-5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-extrabold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/40"
        >
          <Plus size={18} /> Host MEETUP Squad
        </button>

        {/* Host Meetup Modal */}
        {showHostModal && (
          <HostMeetupModal
            userId={userId}
            userFullName={userFullName}
            initialLat={userLat}
            initialLng={userLng}
            onClose={() => setShowHostModal(false)}
            onCreated={(newMeetup) => {
              setMeetups((prev) => [newMeetup, ...prev]);
              setShowHostModal(false);
              triggerToast("🚀 Meetup published live!");
            }}
          />
        )}

        {/* Meetup Detail Modal */}
        {activeMeetup && (
          <MeetupDetailModal
            meetup={activeMeetup}
            userId={userId}
            userName={userFullName}
            userLat={userLat}
            userLng={userLng}
            onClose={() => setActiveMeetup(null)}
            onUpdate={(updated) => setActiveMeetup(updated)}
            triggerToast={triggerToast}
            onReportBlockHost={() => setSafetyModal({
              targetUserId: activeMeetup.hostId,
              targetUserName: activeMeetup.hostName,
              targetId: activeMeetup.id,
            })}
          />
        )}

        {/* Report / Block Modal */}
        {safetyModal && (
          <ReportBlockModal
            currentUserId={userId}
            targetUserId={safetyModal.targetUserId}
            targetUserName={safetyModal.targetUserName}
            targetId={safetyModal.targetId}
            targetType="meetup"
            onClose={() => setSafetyModal(null)}
            onSuccess={(action) => {
              if (action === "blocked") {
                setBlockedUserIds((prev) => [...prev, safetyModal.targetUserId]);
                setActiveMeetup(null);
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

// ====== HOST MEETUP MODAL ======
function HostMeetupModal({
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
  onCreated: (meetup: MeetupItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MeetupCategory>("Chai & Snacks");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number>(initialLat);
  const [longitude, setLongitude] = useState<number>(initialLng);
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim() || !time.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/meetups", {
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
        }),
      });

      const data = await res.json();
      if (data.success && data.meetup) {
        onCreated(data.meetup);
      } else {
        alert(data.error || "Failed to create meetup");
      }
    } catch {
      alert("Failed to create meetup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl cursor-default"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900">Host MEETUP Squad</h3>
              <p className="text-[10px] text-purple-600 font-bold">Live GPS pin &amp; automated split-bill</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MeetupCategory)}
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white font-medium outline-none focus:border-purple-500"
            >
              <option value="Chai & Snacks">☕ Chai &amp; Snacks Catchup</option>
              <option value="Study">📚 Study Squad &amp; Doubts</option>
              <option value="Sports">⚽ Sports &amp; Turf Game</option>
              <option value="Trips">🎒 Trips &amp; Weekend Outings</option>
              <option value="Gaming">🎮 Gaming &amp; Esports</option>
              <option value="Other">✨ Other Campus Event</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Meetup Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chai & Samosa Study Session ☕"
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
            />
          </div>

          {/* Interactive Map Picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Pin Exact Location on Map
            </label>
            <LocationPickerMap
              lat={latitude}
              lng={longitude}
              onPick={(pickedLat, pickedLng, name) => {
                setLatitude(pickedLat);
                setLongitude(pickedLng);
                if (name && !locationName) setLocationName(name);
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Building / Landmark</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. SRM Tech Park Canteen Outdoor Tables"
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Time</label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. Today @ 5:00 PM"
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Max Capacity</label>
              <input
                type="number"
                min="2"
                max="50"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="e.g. 10"
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the meetup plan, topic, or gear needed..."
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={15} /> Publish Live Meetup
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ====== MEETUP DETAIL MODAL (Chat, Geofenced Check-In, Split-Bill, Polls) ======
function MeetupDetailModal({
  meetup,
  userId,
  userName,
  userLat,
  userLng,
  onClose,
  onUpdate,
  triggerToast,
  onReportBlockHost,
}: {
  meetup: MeetupItem;
  userId: string;
  userName: string;
  userLat: number;
  userLng: number;
  onClose: () => void;
  onUpdate: (m: MeetupItem) => void;
  triggerToast: (msg: string) => void;
  onReportBlockHost?: () => void;
}) {
  const [tab, setTab] = useState<"chat" | "checkin" | "expenses" | "polls">("chat");
  const [chatText, setChatText] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOption1, setPollOption1] = useState("");
  const [pollOption2, setPollOption2] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isJoined = meetup.participantIds.includes(userId);
  const isCheckedIn = meetup.checkIns.some((c) => c.userId === userId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [meetup.chatMessages]);

  // Send Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          meetupId: meetup.id,
          senderId: userId,
          senderName: userName,
          text: chatText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.meetup) {
        onUpdate(data.meetup);
        setChatText("");
      }
    } catch { /* ignore */ }
  };

  // Geofenced Check-In
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkin",
          meetupId: meetup.id,
          userId,
          userName,
          userLat,
          userLng,
        }),
      });
      const data = await res.json();
      if (data.success && data.meetup) {
        onUpdate(data.meetup);
        triggerToast("🏅 Checked in! Earned Campus Socialite Badge!");
      }
    } catch {
      triggerToast("❌ Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  // Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount.trim()) return;

    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "expense",
          meetupId: meetup.id,
          title: expenseTitle.trim(),
          totalAmount: parseFloat(expenseAmount),
          paidBy: userId,
          paidByName: userName,
        }),
      });
      const data = await res.json();
      if (data.success && data.meetup) {
        onUpdate(data.meetup);
        setExpenseTitle("");
        setExpenseAmount("");
        triggerToast("💰 Split bill added!");
      }
    } catch {
      triggerToast("❌ Action failed");
    }
  };

  // Add Poll
  const handleAddPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()) return;

    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "poll_create",
          meetupId: meetup.id,
          question: pollQuestion.trim(),
          options: [pollOption1.trim(), pollOption2.trim()],
        }),
      });
      const data = await res.json();
      if (data.success && data.meetup) {
        onUpdate(data.meetup);
        setPollQuestion("");
        setPollOption1("");
        setPollOption2("");
        triggerToast("📊 Poll created!");
      }
    } catch {
      triggerToast("❌ Action failed");
    }
  };

  // Vote Poll Option
  const handleVotePoll = async (pollId: string, optionId: string) => {
    try {
      const res = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "poll_vote",
          meetupId: meetup.id,
          pollId,
          optionId,
          userId,
        }),
      });
      const data = await res.json();
      if (data.success && data.meetup) {
        onUpdate(data.meetup);
        triggerToast("✅ Vote submitted!");
      }
    } catch {
      triggerToast("❌ Action failed");
    }
  };

  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${meetup.latitude},${meetup.longitude}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] flex flex-col shadow-2xl cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
              {meetup.category}
            </span>
            <h2 className="font-black text-base text-gray-900 leading-snug mt-1">{meetup.title}</h2>
            <p className="text-[11px] text-gray-500 font-medium">📍 {meetup.locationName}</p>
          </div>
          <div className="flex items-center gap-1">
            {meetup.hostId === userId && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (
                    confirm(
                      "Are you sure you want to delete this Meetup squad and its synced Radar activity?"
                    )
                  ) {
                    try {
                      const res = await fetch("/api/radar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "delete",
                          activityId: meetup.id,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        triggerToast("🗑️ Meetup squad deleted successfully!");
                        onClose();
                      } else {
                        alert(data.error || "Failed to delete meetup");
                      }
                    } catch {
                      alert("Error deleting meetup");
                    }
                  }
                }}
                className="p-1.5 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                title="Delete Meetup Squad"
              >
                <Trash2 size={18} />
              </button>
            )}
            {meetup.hostId !== userId && onReportBlockHost && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReportBlockHost();
                }}
                className="p-1.5 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                title="Report or Block Host"
              >
                <Shield size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            onClick={() => setTab("chat")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              tab === "chat" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <MessageSquare size={13} /> Chat ({meetup.chatMessages.length})
          </button>
          <button
            onClick={() => setTab("checkin")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              tab === "checkin" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <Award size={13} /> Check-In ({meetup.checkIns.length})
          </button>
          <button
            onClick={() => setTab("expenses")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              tab === "expenses" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <DollarSign size={13} /> Split ({meetup.expenses.length})
          </button>
          <button
            onClick={() => setTab("polls")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              tab === "polls" ? "bg-white text-pink-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <Vote size={13} /> Polls ({meetup.polls.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[340px]">
          {/* TAB 1: GROUP CHAT ROOM */}
          {tab === "chat" && (
            <div className="flex flex-col h-full space-y-2">
              {!isJoined ? (
                <div className="p-4 bg-purple-50 rounded-2xl text-center space-y-2">
                  <ShieldAlert size={24} className="mx-auto text-purple-600" />
                  <p className="text-xs font-bold text-purple-900">Join meetup to chat with attendees</p>
                  <p className="text-[10px] text-purple-600">
                    Coordinate meet spots, ETAs &amp; plan details in real time.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {meetup.chatMessages.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No messages yet. Say hi to the meetup squad! 👋
                      </div>
                    ) : (
                      meetup.chatMessages.map((msg) => {
                        const isMe = msg.senderId === userId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[9px] font-bold text-gray-400 px-1">
                              {msg.senderName}
                            </span>
                            <div
                              className={`p-2.5 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                                isMe
                                  ? "bg-purple-600 text-white rounded-br-none"
                                  : "bg-gray-100 text-gray-800 rounded-bl-none"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Type a message to meetup squad..."
                      className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* TAB 2: GEOFENSED CHECK-IN */}
          {tab === "checkin" && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <Award size={28} className="mx-auto text-emerald-600" />
                <h4 className="font-extrabold text-xs text-emerald-900">Geofenced Live Check-In</h4>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Verify your physical presence at 📍 {meetup.locationName} to earn your Campus Socialite badge!
                </p>
                {isCheckedIn ? (
                  <div className="py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> You are Checked In!
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    {loading ? "Verifying GPS..." : "📍 Check In Now"}
                  </button>
                )}
              </div>

              <div>
                <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                  Checked-In Attendees ({meetup.checkIns.length})
                </h5>
                <div className="space-y-1">
                  {meetup.checkIns.map((c, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-gray-800">🏅 {c.userName}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPLIT-BILL EXPENSE CALCULATOR */}
          {tab === "expenses" && (
            <div className="space-y-3">
              <form onSubmit={handleAddExpense} className="p-3 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-xs text-blue-900 flex items-center gap-1">
                  <DollarSign size={14} /> Add Chai / Snack Expense
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="Item (e.g. Chai & Samosa)"
                    className="py-1.5 px-2.5 rounded-lg border border-blue-200 text-xs outline-none bg-white font-medium"
                  />
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Total ₹ (e.g. 150)"
                    className="py-1.5 px-2.5 rounded-lg border border-blue-200 text-xs outline-none bg-white font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all"
                >
                  Calculate Equal Split
                </button>
              </form>

              <div className="space-y-2">
                {meetup.expenses.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-4">No expenses added yet.</p>
                ) : (
                  meetup.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-gray-900">{exp.title}</span>
                        <span className="font-black text-xs text-blue-600">Total: ₹{exp.totalAmount}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-600">
                        <span>Paid by: {exp.paidByName}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Each pays: ₹{exp.perPerson}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE POLLS */}
          {tab === "polls" && (
            <div className="space-y-3">
              <form onSubmit={handleAddPoll} className="p-3 bg-pink-50 border border-pink-100 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-xs text-pink-900 flex items-center gap-1">
                  <Vote size={14} /> Create Quick Poll
                </h4>
                <input
                  type="text"
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Question (e.g. Chai or Cold Coffee?)"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-pink-200 text-xs outline-none bg-white font-medium"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={pollOption1}
                    onChange={(e) => setPollOption1(e.target.value)}
                    placeholder="Option 1"
                    className="py-1.5 px-2.5 rounded-lg border border-pink-200 text-xs outline-none bg-white font-medium"
                  />
                  <input
                    type="text"
                    required
                    value={pollOption2}
                    onChange={(e) => setPollOption2(e.target.value)}
                    placeholder="Option 2"
                    className="py-1.5 px-2.5 rounded-lg border border-pink-200 text-xs outline-none bg-white font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 transition-all"
                >
                  Publish Poll
                </button>
              </form>

              <div className="space-y-3">
                {meetup.polls.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-4">No active polls.</p>
                ) : (
                  meetup.polls.map((poll) => {
                    const totalVotes = poll.options.reduce((acc, o) => acc + o.voterIds.length, 0);
                    return (
                      <div key={poll.id} className="p-3 rounded-2xl border border-gray-200 bg-white space-y-2">
                        <h5 className="font-extrabold text-xs text-gray-900">{poll.question}</h5>
                        <div className="space-y-1.5">
                          {poll.options.map((opt) => {
                            const hasVoted = opt.voterIds.includes(userId);
                            const pct = totalVotes > 0 ? Math.round((opt.voterIds.length / totalVotes) * 100) : 0;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleVotePoll(poll.id, opt.id)}
                                className={`w-full p-2 rounded-xl text-left border transition-all text-xs relative overflow-hidden ${
                                  hasVoted ? "border-purple-500 bg-purple-50/70" : "border-gray-100 bg-gray-50"
                                }`}
                              >
                                <div
                                  className="absolute left-0 top-0 bottom-0 bg-purple-200/50 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative z-10 flex items-center justify-between font-medium">
                                  <span>{opt.text}</span>
                                  <span className="font-bold text-[10px] text-purple-700">{pct}% ({opt.voterIds.length})</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Button */}
        <div className="pt-2 border-t flex items-center gap-2">
          <a
            href={googleNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Navigation size={14} /> Open Google Maps Directions
          </a>
        </div>
      </div>
    </div>
  );
}
