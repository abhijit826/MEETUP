"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  ShieldCheck,
  Award,
  Compass,
  Users,
  Heart,
  MessageSquare,
  Sparkles,
  LogOut,
  Edit3,
  CheckCircle2,
  Lock,
  Mail,
  School,
  Tag,
  ChevronRight,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [sessionEmail, setSessionEmail] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [college, setCollege] = useState("Campus Social Hub");
  const [bio, setBio] = useState("Exploring campus life, coding, and networking! 🚀");
  const [userPoints, setUserPoints] = useState(50);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Selected hobbies / tags
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Tech & Coding",
    "Campus Events",
    "Coffee & Chill",
  ]);

  const availableTags = [
    "Tech & Coding",
    "Campus Events",
    "Coffee & Chill",
    "Music & Jamming",
    "Fitness & Sports",
    "Gaming Sockets",
    "Photography",
    "Late Night Chats",
  ];

  // Extract user session from cookie / localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionStr = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sm_user_session="))
        ?.split("=")[1];
      if (sessionStr) {
        try {
          const parsed = JSON.parse(decodeURIComponent(sessionStr));
          if (parsed.email) setSessionEmail(parsed.email);
          if (parsed.fullName) setSessionName(parsed.fullName);
        } catch {
          // default
        }
      }

      const savedBio = localStorage.getItem("sm_user_bio");
      if (savedBio) setBio(savedBio);

      const savedCollege = localStorage.getItem("sm_user_college");
      if (savedCollege) setCollege(savedCollege);

      const savedTags = localStorage.getItem("sm_user_tags");
      if (savedTags) {
        try {
          setSelectedTags(JSON.parse(savedTags));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Fetch points balance
  useEffect(() => {
    if (!sessionEmail) return;
    fetch(`/api/auth/points?email=${encodeURIComponent(sessionEmail)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && typeof d.points === "number") {
          setUserPoints(d.points);
        }
      })
      .catch(() => {});
  }, [sessionEmail]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
        triggerToast("⚠️ Maximum 5 interests allowed.");
        return;
      }
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update session cookie
      if (sessionEmail && sessionName) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sessionEmail, fullName: sessionName }),
        });
      }

      // 2. Persist bio & preferences to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("sm_user_bio", bio);
        localStorage.setItem("sm_user_college", college);
        localStorage.setItem("sm_user_tags", JSON.stringify(selectedTags));
      }

      triggerToast("✅ Profile updated successfully!");
    } catch {
      triggerToast("❌ Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      document.cookie = "sm_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sm_user_session=; path=/; max-age=0; SameSite=Lax";
      if (typeof window !== "undefined") {
        localStorage.removeItem("sm_user_session");
        localStorage.clear();
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const displayName = sessionName || (sessionEmail ? sessionEmail.split("@")[0] : "Student");
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans pb-24 md:pb-12">
      {/* Navigation Header */}
      <Navbar userEmail={sessionEmail} userFullName={sessionName} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-5 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full space-y-6">
        {/* HERO PROFILE CARD - NAVY BLUE & LIGHT GRAY THEME */}
        <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg">
          {/* Cover Banner: Deep Navy Blue Gradient */}
          <div className="h-36 sm:h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl" />
          </div>

          {/* Profile Header Details */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Avatar: Deep Navy */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-900 text-white font-black text-4xl sm:text-5xl flex items-center justify-center border-4 border-white shadow-xl shrink-0"
              >
                {initial}
              </motion.div>

              <div className="space-y-1 pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    {displayName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1 border border-emerald-200">
                    <ShieldCheck size={12} /> Verified Student
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center sm:justify-start gap-1.5">
                  <School size={14} className="text-slate-800 shrink-0" />
                  <span>{college}</span>
                </p>

                <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1">
                  <Mail size={12} className="shrink-0 text-slate-400" />
                  <span>{sessionEmail || "student@meetup.edu"}</span>
                </p>
              </div>
            </div>

            {/* Reward Points Badge Card */}
            <div className="flex items-center justify-center sm:justify-end gap-3 pt-2 sm:pt-0">
              <div className="px-4 py-2.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-inner shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-amber-900">{userPoints}</span>
                    <span className="text-[10px] font-bold uppercase text-amber-700">Pts</span>
                  </div>
                  <p className="text-[10px] font-bold text-amber-600">Campus Rewards Rank</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS DASHBOARD GRID */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          <Link href="/messages" className="group">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct DMs</p>
                <p className="text-sm font-black text-slate-900 truncate">Active Chats</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/meetups" className="group">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meetup Squads</p>
                <p className="text-sm font-black text-slate-900 truncate">Campus Events</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/confessions" className="group">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                <Heart size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confessions</p>
                <p className="text-sm font-black text-slate-900 truncate">Feed Posts</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/radar" className="group">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                <Compass size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Radar</p>
                <p className="text-sm font-black text-slate-900 truncate">Live Nearby</p>
              </div>
            </motion.div>
          </Link>
        </section>

        {/* TWO COLUMN EDITABLE PROFILE & ACTIONS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1 & 2: EDIT PROFILE FORM */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-slate-800" />
                <h2 className="text-lg font-black text-slate-900">Personal Account Info</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">Public & Campus Profile</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name Input */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-slate-800 focus:outline-none bg-slate-50/70 text-slate-900"
                  />
                </div>

                {/* College Input */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    College / Campus Name
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-slate-800 focus:outline-none bg-slate-50/70 text-slate-900"
                  />
                </div>
              </div>

              {/* Verified Email (Read-Only) */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Registered Student Email</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <Lock size={10} /> Verified Account
                  </span>
                </label>
                <input
                  type="email"
                  value={sessionEmail}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 bg-slate-100/90 cursor-not-allowed"
                />
              </div>

              {/* Bio TextArea */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Campus Bio & Status Motto
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a quick line about yourself..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-slate-800 focus:outline-none bg-slate-50/70 text-slate-900 resize-none"
                />
              </div>

              {/* Interests & Tags Picker */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} className="text-slate-800" />
                  <span>Campus Interests & Badges</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((t) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80"
                        }`}
                      >
                        {isSelected ? `✓ ${t}` : `+ ${t}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  <span>{isSaving ? "Saving Changes..." : "Save Profile Updates"}</span>
                </motion.button>
              </div>
            </form>
          </div>

          {/* COLUMN 3: QUICK LINKS & ACCOUNT SECURITY */}
          <div className="space-y-6">
            {/* Quick Ecosystem Launcher */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                Campus Ecosystem Shortcuts
              </h3>

              <div className="space-y-2">
                <Link
                  href="/loveguru"
                  className="p-3 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 transition-all flex items-center justify-between text-slate-900 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-slate-800" />
                    <span className="text-xs font-extrabold">Ask Guru Ji AI</span>
                  </div>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-500" />
                </Link>

                <Link
                  href="/messages"
                  className="p-3 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 transition-all flex items-center justify-between text-slate-900 group"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare size={16} className="text-slate-800" />
                    <span className="text-xs font-extrabold">Private Messages (DMs)</span>
                  </div>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-500" />
                </Link>

                <Link
                  href="/meetups"
                  className="p-3 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 transition-all flex items-center justify-between text-slate-900 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-slate-800" />
                    <span className="text-xs font-extrabold">Host or Join Meetups</span>
                  </div>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-500" />
                </Link>
              </div>
            </div>

            {/* Account Sign Out Card */}
            <div className="bg-red-50/60 rounded-3xl p-5 border border-red-100 shadow-xs space-y-3">
              <div>
                <h4 className="text-xs font-black text-red-900">Session & Security</h4>
                <p className="text-[11px] text-red-700/80 font-medium">
                  Logged in as {sessionEmail || "Verified Student"}.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                <span>Sign Out of Account</span>
              </motion.button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
