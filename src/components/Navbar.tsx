"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Users,
  Heart,
  Sparkles,
  Home,
  LogOut,
  ShieldCheck,
  Award,
  Menu,
  X,
} from "lucide-react";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  userEmail?: string;
  userFullName?: string;
}

export default function Navbar({ userEmail, userFullName }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionName, setSessionName] = useState(userFullName || "");
  const [sessionEmail, setSessionEmail] = useState(userEmail || "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionStr = document.cookie
        .split("; ")
        .find((r) => r.startsWith("sm_user_session="))
        ?.split("=")[1];
      if (sessionStr) {
        try {
          const p = JSON.parse(decodeURIComponent(sessionStr));
          if (p.fullName && !sessionName) setSessionName(p.fullName);
          if (p.email && !sessionEmail) setSessionEmail(p.email);
        } catch { /* ignore */ }
      }
    }
  }, [sessionName, sessionEmail]);

  const navLinks = [
    { label: "Dashboard", href: "/home", icon: Home },
    { label: "Campus Radar", href: "/radar", icon: Compass },
    { label: "Meetups Hub", href: "/meetups", icon: Users },
    { label: "Confessions", href: "/confessions", icon: Heart },
    { label: "Guru Ji", href: "/loveguru", icon: Sparkles },
  ];

  const handleSignOut = async () => {
    try {
      // 1. Clear session cookies
      document.cookie = "sm_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sm_user_session=; path=/; max-age=0; SameSite=Lax";
      
      // 2. Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("sm_user_session");
        localStorage.clear();
      }

      // 3. Supabase Auth Sign Out
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      // 4. Force hard redirect to login page
      window.location.href = "/login";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-md py-2 sm:py-3 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo with Motion Hover */}
          <Link href="/home" className="flex items-center gap-3.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shadow-md flex items-center justify-center bg-white transition-all"
            >
              <img src="/logo.png" alt="MEETUP Monogram Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div>
              <span className="font-lora font-bold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 bg-clip-text text-transparent">
                MEETUP
              </span>
              <span className="hidden sm:block text-[11px] font-extrabold text-gray-500 tracking-wide uppercase -mt-0.5">
                Social Ecosystem
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links with Motion Layout Indicator */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50/90 p-1.5 rounded-2xl border border-gray-200/60 shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 z-10"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-desktop-pill"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-purple-100/80 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={15}
                    className={isActive ? "text-purple-600" : "text-gray-400 group-hover:text-purple-600"}
                  />
                  <span className={isActive ? "text-purple-700 font-extrabold" : "text-gray-600 hover:text-purple-600"}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Badges, Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* Points Badge */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-xs font-black shadow-2xs"
            >
              <Award size={14} className="text-amber-500" />
              <span>245 Points</span>
            </motion.div>

            {/* Notifications Drawer */}
            <NotificationDrawer userEmail={sessionEmail} />

            {/* User Profile / Logout (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-200">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
              >
                {(sessionName || "S")[0].toUpperCase()}
              </motion.div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-gray-800 leading-tight max-w-[100px] truncate">
                  {sessionName || "Student"}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck size={10} /> Verified Student
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSignOut}
                className="ml-1 p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Sign Out"
              >
                <LogOut size={16} />
              </motion.button>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Drawer Navigation with AnimatePresence */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2 overflow-hidden"
            >
              {navLinks.map((link, idx) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                        isActive
                          ? "bg-purple-50 text-purple-700 border border-purple-100"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-purple-600" : "text-gray-400"} />
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Signed in as {sessionName || "Student"}</span>
                <button
                  onClick={handleSignOut}
                  className="py-1 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1"
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed to bottom of screen on mobile with Motion) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/90 shadow-[0_-6px_25px_rgba(0,0,0,0.12)] px-2 py-1.5 flex items-center justify-around">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-2xl relative"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`p-1.5 rounded-xl transition-all relative ${
                  isActive
                    ? "bg-purple-100/90 text-purple-700 shadow-xs"
                    : "bg-transparent text-gray-400"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mobile-bottom-pill"
                    className="absolute inset-0 bg-purple-100 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <Icon size={20} className={isActive ? "text-purple-700 stroke-[2.5]" : "stroke-[1.8]"} />
              </motion.div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? "font-black text-purple-700" : "font-medium text-gray-500"}`}>
                {link.label.replace(" Hub", "").replace(" AI", "").replace("Campus ", "")}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
