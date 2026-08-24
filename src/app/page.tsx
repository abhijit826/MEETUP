"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "motion/react";
import { Heart, Shield, Users, Star, ArrowRight, Sparkles, CheckCircle2, MessageCircle, MapPin, Calendar, Zap } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { Badge } from "@/components/ui/Badge";

// Helper component for count-up animated statistics
function CountUpStat({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1400;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="flex flex-col items-center justify-center p-1 sm:p-1.5">
      <span className="text-base sm:text-xl xl:text-2xl font-black text-slate-900 tracking-tight leading-none">
        {count}
        {suffix}
      </span>
      <span className="text-[8px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5 sm:mt-1">
        {label}
      </span>
    </div>
  );
}

export default function WelcomePage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"love" | "meetups" | "verified" | null>(null);

  // Crossover scroll animations are always active to guarantee premium signature moments play across all profiles & devices
  const prefersReducedMotion = false;

  // Track overall scroll progress inside the tall 250vh container
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 25,
    restDelta: 0.001,
  });

  // ── DESKTOP "STUDENTS MEET & EXCHANGE PLACES" ANIMATION ──
  // Keyframe Milestones: [0.0 (Start), 0.20 (Idle), 0.45 (Approach), 0.55 (Meet), 0.85 (Exchange), 1.0 (Settle)]

  // Girl X: Starts Left (-42vw) -> Approaches (-24vw) -> Meets (-18vw) -> EXCHANGES to Right (+38vw) -> Settles (+42vw)
  const girlXDesktop = useTransform(
    smoothProgress,
    [0, 0.2, 0.45, 0.55, 0.85, 1],
    ["-42vw", "-40vw", "-24vw", "-18vw", "38vw", "42vw"]
  );

  // Girl Y Arc: Curves upward during approach, downward during crossover dance to protect text
  const girlYDesktop = useTransform(
    smoothProgress,
    [0, 0.2, 0.45, 0.55, 0.7, 0.85, 1],
    ["0px", "-12px", "-28px", "0px", "32px", "0px", "0px"]
  );

  // Girl Rotate: Subtle character body tilt
  const girlRotateDesktop = useTransform(
    smoothProgress,
    [0, 0.2, 0.45, 0.55, 0.7, 0.85, 1],
    ["0deg", "-3deg", "3deg", "-1deg", "3deg", "-1deg", "0deg"]
  );

  // Boy X: Starts Right (+42vw) -> Approaches (+24vw) -> Meets (+18vw) -> EXCHANGES to Left (-38vw) -> Settles (-42vw)
  const boyXDesktop = useTransform(
    smoothProgress,
    [0, 0.2, 0.45, 0.55, 0.85, 1],
    ["42vw", "40vw", "24vw", "18vw", "-38vw", "-42vw"]
  );

  // Boy Y Arc: Curves downward during approach, upward during crossover dance to protect text
  const boyYDesktop = useTransform(
    smoothProgress,
    [0, 0.2, 0.45, 0.55, 0.7, 0.85, 1],
    ["0px", "12px", "28px", "0px", "-32px", "0px", "0px"]
  );

  // Boy Rotate: Subtle character body tilt
  const boyRotateDesktop = useTransform(
    smoothProgress,
    [0, 0.2, 0.45, 0.55, 0.7, 0.85, 1],
    ["0deg", "3deg", "-3deg", "1deg", "-3deg", "1deg", "0deg"]
  );

  // Character meeting scale pulse around 1.0
  const meetingScale = useTransform(
    smoothProgress,
    [0, 0.4, 0.5, 0.6, 0.85, 1],
    [1, 1, 1.06, 1, 1, 1]
  );

  // Meeting Burst & Badge Opacity
  const meetingBurstOpacity = useTransform(smoothProgress, [0.35, 0.45, 0.85, 1], [0, 1, 1, 0.7]);
  const floatPillsOpacity = useTransform(smoothProgress, [0.15, 0.3, 1], [0, 1, 1]);

  // ── MOBILE ANIMATIONS (< lg) — DIAGONAL EDGE SWEEP & FULL VERTICAL EXCHANGE ──
  // Girl Y Mobile: Top (-210px) -> Approaches (-80px) -> Sweeps down (+80px) -> Settles at Bottom (+245px)
  const girlYMobile = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 0.85, 1],
    ["-210px", "-180px", "-80px", "80px", "235px", "245px"]
  );

  // Girl X Mobile: Sweeps along RIGHT margin (125px) while passing text to guarantee ZERO text overlap!
  const girlXMobile = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 0.85, 1],
    ["0px", "0px", "125px", "125px", "0px", "0px"]
  );

  // Girl Rotate Mobile
  const girlRotateMobile = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 0.85, 1],
    ["0deg", "-4deg", "4deg", "-4deg", "0deg", "0deg"]
  );

  // Boy Y Mobile: Bottom (+245px) -> Approaches (+80px) -> Sweeps up (-80px) -> Settles at Top (-210px)
  const boyYMobile = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 0.85, 1],
    ["245px", "215px", "80px", "-80px", "-200px", "-210px"]
  );

  // Boy X Mobile: Sweeps along LEFT margin (-125px) while passing text to guarantee ZERO text overlap!
  const boyXMobile = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 0.85, 1],
    ["0px", "0px", "-125px", "-125px", "0px", "0px"]
  );

  // Boy Rotate Mobile
  const boyRotateMobile = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 0.85, 1],
    ["0deg", "4deg", "-4deg", "4deg", "0deg", "0deg"]
  );

  return (
    <div
      ref={sectionRef}
      id="welcome-page"
      className="relative h-[250vh] w-full bg-[#FAF9F6] text-slate-900 selection:bg-purple-500 selection:text-white"
    >
      {/* ── STICKY VIEWPORT CONTAINER (TRANSPARENT BACKGROUND — NO LARGE WHITE BOX) ── */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between items-center px-3 sm:px-6 py-3 sm:py-6 overflow-hidden select-none">

        {/* Ambient Glowing Background Mesh & Dot Pattern (100% VISIBLE) */}
        <div className="absolute w-[550px] h-[550px] -top-36 -left-36 rounded-full bg-gradient-to-br from-red-400/25 via-purple-400/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute w-[550px] h-[550px] -bottom-36 -right-36 rounded-full bg-gradient-to-tr from-indigo-400/25 via-pink-400/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-45 pointer-events-none" />

        {/* ── TOP HEADER NAVIGATION BAR ── */}
        <header className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-40 py-6 sm:py-8 px-4 transition-all">
          <Link href="/" className="inline-flex items-center gap-3.5 group">
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shadow-md flex items-center justify-center bg-white"
            >
              <img src="/logo.png" alt="MEETUP Monogram Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div className="flex flex-col select-none">
              <span className="font-lora text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 bg-clip-text text-transparent">
                MEETUP
              </span>
              <span className="hidden sm:block text-[11px] font-extrabold text-gray-500 tracking-wide uppercase mt-0.5">
                Social Ecosystem
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              id="link-header-login"
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-purple-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-colors"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <button className="text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Get Started
              </button>
            </Link>
          </div>
        </header>

        {/* ── CENTER STAGE (NO LARGE WHITE BOX — OPEN & SPACIOUS) ── */}
        <div className="relative w-full max-w-6xl mx-auto my-auto flex-1 flex items-center justify-center z-20">

          {/* ── DESKTOP GIRL CHARACTER (Left → Center → EXCHANGES TO RIGHT) ── */}
          <motion.div
            style={
              prefersReducedMotion
                ? { x: "-24vw" }
                : {
                  x: girlXDesktop,
                  y: girlYDesktop,
                  rotate: girlRotateDesktop,
                  scale: meetingScale,
                }
            }
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center z-20 pointer-events-none will-change-transform"
          >
            <div className="relative flex flex-col items-center">
              <div className="absolute w-48 h-48 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />
              <img
                src="/auth_girl.png"
                alt="Student Girl Character"
                className="relative z-10 h-[310px] xl:h-[360px] w-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)]"
              />
            </div>
          </motion.div>

          {/* ── DESKTOP BOY CHARACTER (Right → Center → EXCHANGES TO LEFT) ── */}
          <motion.div
            style={
              prefersReducedMotion
                ? { x: "24vw" }
                : {
                  x: boyXDesktop,
                  y: boyYDesktop,
                  rotate: boyRotateDesktop,
                  scale: meetingScale,
                }
            }
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center z-20 pointer-events-none will-change-transform"
          >
            <div className="relative flex flex-col items-center">
              <div className="absolute w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
              <img
                src="/auth_boy.png"
                alt="Student Boy Character"
                className="relative z-10 h-[310px] xl:h-[360px] w-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)]"
              />
            </div>
          </motion.div>

          {/* ── FLOATING COMMUNITY PILLS (PAGE BACKGROUND ACCENTS) ── */}
          <motion.div style={{ opacity: floatPillsOpacity }} className="absolute inset-0 z-10 pointer-events-none hidden sm:block">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-2 left-2 xl:left-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-purple-100 flex items-center gap-2 text-xs font-bold text-slate-800"
            >
              <MessageCircle size={14} className="text-purple-600" />
              <span>SRM Campus Confessions</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 right-2 xl:right-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-indigo-100 flex items-center gap-2 text-xs font-bold text-slate-800"
            >
              <Calendar size={14} className="text-indigo-600" />
              <span>Turf Football • Today</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-4 left-4 xl:left-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-emerald-100 flex items-center gap-2 text-xs font-bold text-slate-800"
            >
              <Shield size={14} className="text-emerald-600" />
              <span>100% Verified Students</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-6 right-4 xl:right-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-pink-100 flex items-center gap-2 text-xs font-bold text-slate-800"
            >
              <MapPin size={14} className="text-pink-600" />
              <span>SRMIST HOSTELS Meetups</span>
            </motion.div>
          </motion.div>

          {/* ── MOBILE CHARACTERS STAGE (< lg) — DIAGONAL MARGIN SWEEP & VERTICAL EXCHANGE ── */}
          <div className="block lg:hidden absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <motion.div
              style={
                prefersReducedMotion
                  ? {}
                  : {
                    x: girlXMobile,
                    y: girlYMobile,
                    rotate: girlRotateMobile,
                    scale: meetingScale,
                  }
              }
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center will-change-transform z-20"
            >
              <img
                src="/auth_girl.png"
                alt="Student Girl Character"
                className="h-16 xs:h-20 sm:h-24 w-auto object-contain filter drop-shadow-md"
              />
            </motion.div>

            <motion.div
              style={
                prefersReducedMotion
                  ? {}
                  : {
                    x: boyXMobile,
                    y: boyYMobile,
                    rotate: boyRotateMobile,
                    scale: meetingScale,
                  }
              }
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center will-change-transform z-20"
            >
              <img
                src="/auth_boy.png"
                alt="Student Boy Character"
                className="h-16 xs:h-20 sm:h-24 w-auto object-contain filter drop-shadow-md"
              />
            </motion.div>
          </div>

          {/* ── CENTER CONTENT (TRANSPARENT — NO SOLID WHITE BOX CONTAINER) ── */}
          <div className="relative w-full max-w-[420px] mx-auto text-center flex flex-col items-center justify-center z-30 px-3 py-1">

            {/* CELEBRATORY MEETING BURST BADGE INSIDE CENTER STACK */}
            <motion.div
              style={{ opacity: meetingBurstOpacity }}
              className="pointer-events-none flex items-center justify-center mb-1.5"
            >
              <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-pink-200 text-pink-600 text-[11px] sm:text-xs font-black animate-bounce">
                <Heart size={13} className="fill-pink-500 text-pink-500" />
                <span>They Found Each Other!</span>
                <Sparkles size={13} className="text-amber-500" />
              </div>
            </motion.div>

            {/* 1. MEETUP SECTION BADGE */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-red-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200/80 text-[10px] sm:text-xs font-black tracking-[0.2em] text-purple-700 uppercase mb-2 shadow-2xs">
              <Sparkles size={12} className="text-red-500 animate-pulse" />
              <span>slide to meet</span>
            </div>

            {/* 2. HEADLINES & SUBHEADLINES (CLEAN STACK — NO TEXT OVERLAP) */}
            <h1 className="font-lora text-2xl sm:text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-slate-900 mb-1">
              Meet people.{" "}
              <span className="font-lora text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-600 to-indigo-600">
                Share stories.
              </span>
            </h1>

            <h2 className="font-lora text-xl sm:text-2xl xl:text-3xl font-bold text-slate-900 tracking-tight my-0.5">
              Find your{" "}
              <span className="font-lora text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-red-500">
                people.
              </span>
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-2 max-w-sm leading-relaxed">
              A verified social space for student life — friendships, advice, events and real meetups.
            </p>

            {/* 3. "Your campus, your community." SUB-CARD (GLASS PILL) */}
            <div className="w-full bg-white/70 backdrop-blur-md border border-purple-100/90 rounded-2xl p-2.5 sm:p-3 my-1.5 text-center shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Star size={12} className="fill-purple-600 text-purple-600" />
                <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Your campus, your community.
                </p>
              </div>

              {/* Interactive Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "love" ? null : "love")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${activeTab === "love"
                    ? "bg-pink-500 text-white shadow-xs"
                    : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200/80"
                    }`}
                >
                  <Heart size={12} className={activeTab === "love" ? "fill-white" : "text-pink-500"} />
                  <span>Love &amp; advice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "meetups" ? null : "meetups")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${activeTab === "meetups"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200/80"
                    }`}
                >
                  <Users size={12} className={activeTab === "meetups" ? "fill-white" : "text-amber-500"} />
                  <span>Meetups</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "verified" ? null : "verified")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${activeTab === "verified"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200/80"
                    }`}
                >
                  <Shield size={12} className={activeTab === "verified" ? "fill-white" : "text-emerald-500"} />
                  <span>Verified</span>
                </button>
              </div>

              {/* Micro-description popup for active tab */}
              <AnimatePresence mode="wait">
                {activeTab && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full p-1.5 rounded-xl bg-purple-50/90 border border-purple-200 text-xs font-semibold text-purple-900 mt-1.5 text-center"
                  >
                    {activeTab === "love" && "Connect with relationship gurus & share anonymous campus secrets."}
                    {activeTab === "meetups" && "Join sports matches, coffee meetups, and hostel study squads."}
                    {activeTab === "verified" && "Connect safely with verified students from your campus."}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. STATISTICS ROW */}
            <div className="w-full grid grid-cols-3 gap-1 py-1 border-y border-slate-200/80 my-1.5 bg-white/40 backdrop-blur-xs rounded-xl">
              <CountUpStat end={10} suffix="K+" label="Students" />
              <div className="border-x border-slate-200/80">
                <CountUpStat end={50} suffix="+" label="Campuses" />
              </div>
              <CountUpStat end={200} suffix="+" label="Meetups/wk" />
            </div>

            {/* 5. CTA BUTTON & SIGN IN LINK */}
            <div className="w-full flex flex-col items-center gap-1 mt-1">
              <Link href="/signup" className="w-full">
                <Button3D
                  id="btn-get-started"
                  variant="danger"
                  size="lg"
                  fullWidth
                  glow
                  className="h-11 rounded-2xl text-xs sm:text-sm font-black tracking-wide uppercase"
                >
                  <span>Join the community</span>
                  <ArrowRight size={16} />
                </Button3D>
              </Link>

              <p className="text-[14px] sm:text-base font-bold text-slate-600 mt-2.5">
                Already a  SRM student?{" "}
                <Link
                  id="link-sign-in"
                  href="/login"
                  className="font-black text-purple-700 hover:text-purple-900 underline underline-offset-4 transition-all hover:scale-105 inline-block"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>

        <footer className="w-full max-w-7xl mx-auto text-center pt-2.5 border-t border-slate-200/60 relative z-40 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-slate-400 font-medium">
          <p>Built Specially for SRM students</p>
          <div className="flex items-center gap-2">
            <span>MEETUP</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
