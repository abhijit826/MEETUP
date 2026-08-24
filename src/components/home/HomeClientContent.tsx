"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, Variants } from "motion/react";
import {
  Compass,
  Users,
  Heart,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { HorizonHeroSection } from "@/components/home/HorizonHeroSection";
import { VapourTextEffect } from "@/components/ui/VapourTextEffect";

interface HomeClientContentProps {
  fullName: string;
  userEmail: string;
}

export default function HomeClientContent({ fullName, userEmail }: HomeClientContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [points, setPoints] = React.useState(50);

  React.useEffect(() => {
    if (!userEmail) return;
    const loadPoints = async () => {
      try {
        const res = await fetch(`/api/auth/points?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (data.success && typeof data.points === "number") {
          setPoints(data.points);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPoints();
    const interval = setInterval(loadPoints, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Parallax transform for hero background and title
  const heroY = useTransform(scrollY, [0, 300], [0, 45]);
  const opacityHero = useTransform(scrollY, [0, 250], [1, 0.85]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {/* 21st.dev Horizon Hero Section with Dynamic Parallax & 3D Student Characters */}
      <HorizonHeroSection userFullName={fullName} />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Campus Hub Features */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Welcome back, {fullName}! 👋</h2>
              <p className="text-xs text-gray-500 font-medium font-semibold">Campus Social Portal • Select a feature below</p>
            </div>

            <Link href="/messages">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="py-2 px-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition-all flex items-center gap-2 border border-indigo-200/80"
              >
                <MessageSquare size={15} /> Private Messages
              </motion.button>
            </Link>
          </div>

          {/* Staggered Cards Grid with Motion */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {/* 1. Campus Radar */}
            <motion.div variants={cardVariants}>
              <Link href="/radar" className="block h-full">
                <motion.div
                  whileHover={{ y: -6, scale: 1.015 }}
                  className="group relative h-full bg-white/90 backdrop-blur-md border border-purple-100 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl group-hover:bg-purple-100 transition-all pointer-events-none" />

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                      <Compass size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                      Live Map
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-2 tracking-tight group-hover:text-purple-700 transition-colors">
                      Campus Radar
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Interactive live map showing nearby student activities &amp; sports.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-black text-purple-600">
                    <span>Explore Live Map</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* 2. Meetups Hub */}
            <motion.div variants={cardVariants}>
              <Link href="/meetups" className="block h-full">
                <motion.div
                  whileHover={{ y: -6, scale: 1.015 }}
                  className="group relative h-full bg-white/90 backdrop-blur-md border border-amber-100 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-all pointer-events-none" />

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                      <Users size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                      Squad Meetups
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-2 tracking-tight group-hover:text-amber-700 transition-colors">
                      Meetups Hub
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Join study groups, chai catchups, chat, split bills &amp; run polls.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-black text-amber-600">
                    <span>Browse Meetup Squads</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* 3. Confessions Wall */}
            <motion.div variants={cardVariants}>
              <Link href="/confessions" className="block h-full">
                <motion.div
                  whileHover={{ y: -6, scale: 1.015 }}
                  className="group relative h-full bg-white/90 backdrop-blur-md border border-indigo-100 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-all pointer-events-none" />

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                      <Heart size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Anonymous Feed
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-2 tracking-tight group-hover:text-indigo-700 transition-colors">
                      Confessions Wall
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Share anonymous campus secrets, stories &amp; chat in safety.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-black text-indigo-600">
                    <span>Read Confessions</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* 4. Guru Ji */}
            <motion.div variants={cardVariants}>
              <Link href="/loveguru" className="block h-full">
                <motion.div
                  whileHover={{ y: -6, scale: 1.015 }}
                  className="group relative h-full bg-white/90 backdrop-blur-md border border-pink-100 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-pink-50 rounded-full blur-2xl group-hover:bg-pink-100 transition-all pointer-events-none" />

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                      <Sparkles size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
                      AI &amp; Campus Guru
                    </span>
                    <h3 className="text-lg font-black text-gray-900 mt-2 tracking-tight group-hover:text-pink-700 transition-colors">
                      Guru Ji
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Get anonymous dating advice, crush matches &amp; relationship tips.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-black text-pink-600">
                    <span>Ask Guru Ji</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column: User Sidebar & Quick Activity Launcher */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {/* User Account Card */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                <Zap size={16} className="text-amber-500" /> Active Session
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Student Email:</span>
                <span className="font-extrabold text-gray-800 truncate max-w-[150px]">{userEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Campus Reward Points:</span>
                <span className="font-black text-purple-700">{points} Points</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400 font-medium">Security &amp; AI Safety:</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <ShieldAlert size={12} /> Active Guard
                </span>
              </div>
            </div>
          </div>

          {/* Quick Host Callout Card */}
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-3 relative overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full border border-purple-400/20 pointer-events-none"
            />

            <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md inline-block">
              Quick Campus Host
            </span>
            <h4 className="font-black text-base leading-snug">
              Want to organize a quick study session or chai catchup near your hostel?
            </h4>
            <p className="text-xs text-purple-200">
              Host a live activity visible on the campus map in under 30 seconds.
            </p>

            <Link href="/meetups" className="block pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="w-full py-3 rounded-2xl bg-white text-purple-900 font-black text-xs shadow-md hover:bg-purple-50 transition-all"
              >
                + Create Meetup Squad
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
