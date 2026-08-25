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
  User,
  Sun,
  Moon,
} from "lucide-react";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/providers/ThemeProvider";

interface NavbarProps {
  userEmail?: string;
  userFullName?: string;
}

export default function Navbar({ userEmail, userFullName }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionName, setSessionName] = useState(userFullName || "");
  const [sessionEmail, setSessionEmail] = useState(userEmail || "");
  const [userPoints, setUserPoints] = useState(50);
  const prevPointsRef = React.useRef<number | null>(null);

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

  useEffect(() => {
    if (!sessionEmail) return;
    const fetchPoints = async () => {
      try {
        const res = await fetch(`/api/auth/points?email=${encodeURIComponent(sessionEmail)}`);
        const data = await res.json();
        if (data.success && typeof data.points === "number") {
          const oldPoints = prevPointsRef.current;
          const newPoints = data.points;

          if (oldPoints !== null && newPoints !== oldPoints) {
            const diff = newPoints - oldPoints;
            const title = diff > 0 ? "Points Earned! 🚀" : "Points Updated";
            const message = diff > 0
              ? `Congratulations! You just earned +${diff} Campus Reward Points. Keep syncing!`
              : `Your rewards balance changed to ${newPoints} points.`;

            // Securely create notifications
            fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create",
                email: sessionEmail,
                type: "radar",
                title,
                message,
                link: "/home",
                actorName: "Reward Engine",
              }),
            }).catch((err) => console.error(err));
          }

          prevPointsRef.current = newPoints;
          setUserPoints(newPoints);
        }
      } catch (err) {
        console.error("Failed to load user points:", err);
      }
    };
    fetchPoints();
    const interval = setInterval(fetchPoints, 5000);
    return () => clearInterval(interval);
  }, [sessionEmail]);

  const navLinks = [
    { label: "Dashboard", href: "/home", icon: Home },
    { label: "Campus Radar", href: "/radar", icon: Compass },
    { label: "Meetups Hub", href: "/meetups", icon: Users },
    { label: "Confessions", href: "/confessions", icon: Heart },
    { label: "Guru Ji", href: "/loveguru", icon: Sparkles },
    { label: "Profile", href: "/profile", icon: User },
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
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/80 shadow-md py-2 sm:py-3 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo with Motion Hover */}
          <Link href="/home" className="flex items-center gap-3.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md flex items-center justify-center bg-white dark:bg-slate-800 transition-all"
            >
              <img src="/logo.png" alt="MEETUP Monogram Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div>
              <span className="font-lora font-bold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-300 bg-clip-text text-transparent">
                MEETUP
              </span>
              <span className="hidden sm:block text-[11px] font-extrabold text-gray-500 dark:text-slate-400 tracking-wide uppercase -mt-0.5">
                Social Ecosystem
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links with Motion Layout Indicator */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-gray-200/60 dark:border-slate-700/60 shadow-inner">
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
                      className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs border border-purple-100/80 dark:border-slate-600 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={15}
                    className={isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-slate-400 group-hover:text-purple-600"}
                  />
                  <span className={isActive ? "text-purple-700 dark:text-purple-300 font-extrabold" : "text-gray-600 dark:text-slate-300 hover:text-purple-600"}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Badges, Theme Toggle, Notifications & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all border border-gray-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark/Light Theme"
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
            </motion.button>

            {/* Points Badge */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-black shadow-2xs"
            >
              <Award size={14} className="text-amber-500" />
              <span>{userPoints} Points</span>
            </motion.div>

            {/* Notifications Drawer */}
            <NotificationDrawer userEmail={sessionEmail} />

            {/* User Profile / Logout (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-800">
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
                >
                  {(sessionName || "S")[0].toUpperCase()}
                </motion.div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-950 dark:text-white leading-tight max-w-[100px] truncate">
                    {sessionName || "Student"}
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <ShieldCheck size={10} /> Verified Student
                  </p>
                </div>
              </Link>

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
              className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-2 overflow-hidden"
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
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50"
                          : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-slate-400"} />
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Signed in as {sessionName || "Student"}</span>
                <button
                  onClick={handleSignOut}
                  className="py-1 px-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1"
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed to bottom of screen on mobile with Motion) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/90 dark:border-slate-800/90 shadow-[0_-6px_25px_rgba(0,0,0,0.12)] px-2 py-1.5 flex items-center justify-around">
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
                    ? "bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs"
                    : "bg-transparent text-gray-400 dark:text-slate-400"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mobile-bottom-pill"
                    className="absolute inset-0 bg-purple-100 dark:bg-purple-900/50 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <Icon size={20} className={isActive ? "text-purple-700 dark:text-purple-300 stroke-[2.5]" : "stroke-[1.8]"} />
              </motion.div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? "font-black text-purple-700 dark:text-purple-300" : "font-medium text-gray-500 dark:text-slate-400"}`}>
                {link.label.replace(" Hub", "").replace(" AI", "").replace("Campus ", "")}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
