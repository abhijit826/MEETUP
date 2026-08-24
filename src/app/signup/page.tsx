"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/getAppUrl";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setSuccessMsg("Google Sign-In successful! Connecting...");
        const email = session.user.email || "";
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email.split("@")[0] ||
          "Student";

        try {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, fullName }),
          });
        } catch {
          // ignore
        }

        setTimeout(() => {
          window.location.href = "/home?authenticated=1";
        }, 400);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const origin = getAppUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("provider is not enabled") || error.message.includes("Unsupported provider")) {
          setErrorMsg(
            "Google Provider is not enabled in Supabase yet. Please enable Google under Supabase Dashboard → Authentication → Providers, or sign up using OTP / Password below!"
          );
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Google sign in failed.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to send OTP verification code.");
      } else {
        setSuccessMsg("Generating 6-digit OTP code...");

        if (typeof window !== "undefined") {
          sessionStorage.setItem("sm_temp_pass", password);
        }

        setTimeout(() => {
          window.location.href = `/verify-otp?email=${encodeURIComponent(
            email.trim()
          )}&name=${encodeURIComponent(fullName.trim())}`;
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between px-4 sm:px-6 py-6 overflow-x-hidden select-none">
      {/* Ambient background lighting */}
      <div
        aria-hidden="true"
        className="absolute w-96 h-96 -top-20 -left-20 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #EC4899 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute w-80 h-80 -bottom-20 -right-20 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
      />

      {/* Header Bar */}
      <header className="w-full max-w-5xl mx-auto mb-6 flex items-center justify-between relative z-20">
        <Link href="/" className="inline-flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-md flex items-center justify-center bg-white transition-all">
            <img src="/logo.png" alt="MEETUP Monogram Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">
            MEETUP
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
        >
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <div className="w-full flex-1 flex items-center justify-center my-auto relative z-10">
        
        {/* Responsive Split Layout Card */}
        <div className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-300/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
          
          {/* LEFT COLUMN: Visual Branding & Character Stage (Desktop & Tablet) */}
          <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-8 xl:p-10 flex-col justify-between relative overflow-hidden text-white select-none">
            {/* Ambient Lighting */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none" />

            {/* Top Brand Pill */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-indigo-200 shadow-sm">
                <Sparkles size={14} className="text-amber-400" />
                <span>MEETUP Social Network</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-black tracking-tight mt-6 leading-tight text-white">
                Join the largest student community.
              </h2>
              <p className="text-sm text-indigo-200/80 mt-2 font-medium leading-relaxed">
                Create your student account to unlock campus radar, exclusive student meetups, and real confessions.
              </p>
            </div>

            {/* Center Character Display */}
            <div className="relative z-10 my-6 flex items-center justify-center min-h-[300px] xl:min-h-[340px]">
              {/* Radial glow */}
              <div className="absolute w-52 h-52 rounded-full bg-purple-500/30 blur-2xl pointer-events-none" />
              
              {/* Uploaded Girl Character */}
              <img
                src="/auth_girl.png"
                alt="MEETUP Girl Character"
                className="relative z-10 max-h-[300px] xl:max-h-[340px] w-auto object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105"
              />

              {/* Floating Pill 1 */}
              <div className="absolute top-4 right-2 bg-white/90 backdrop-blur-md text-slate-900 px-3.5 py-2 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2.5 animate-bounce [animation-duration:4s]">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <GraduationCap size={15} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold leading-none">Instant Student Pass</p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Free Registration</p>
                </div>
              </div>

              {/* Floating Pill 2 */}
              <div className="absolute bottom-4 left-2 bg-white/90 backdrop-blur-md text-slate-900 px-3.5 py-2 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2.5 animate-bounce [animation-duration:4.5s]">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold leading-none">Safe & Verified</p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">OTP Protected</p>
                </div>
              </div>
            </div>

            {/* Footer Copy */}
            <div className="relative z-10 text-xs text-indigo-300/70 font-semibold flex items-center justify-between">
              <span>© MEETUP</span>
              <span>Meet. Connect. Belong.</span>
            </div>
          </div>

          {/* RIGHT COLUMN / MOBILE CARD: Form */}
          <div className="col-span-1 lg:col-span-6 p-6 sm:p-10 xl:p-12 flex flex-col justify-center relative">
            
            {/* Mobile Character Top Banner (Visible ONLY on Mobile < lg) */}
            <div className="block lg:hidden text-center mb-4 pt-1">
              <div className="relative w-full py-2.5 px-3 bg-gradient-to-b from-purple-50/90 to-indigo-50/30 rounded-2xl border border-purple-100/80 flex flex-col items-center justify-center overflow-hidden shadow-xs">
                <div className="absolute -top-10 w-36 h-36 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />
                <img
                  src="/auth_girl.png"
                  alt="MEETUP Girl Character"
                  className="relative z-10 h-28 xs:h-36 sm:h-44 w-auto object-contain filter drop-shadow-md select-none"
                />
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-white border border-purple-100 text-[10px] sm:text-[11px] font-bold text-purple-700 shadow-2xs">
                  <Sparkles size={11} className="text-amber-500" />
                  <span>Join MEETUP Network</span>
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Create Your Account
              </h1>
              <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
                Join your campus community and get started.
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-3 animate-fade-in">
                <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium flex items-start gap-3 animate-fade-in">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Signup Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit} aria-label="Create account form">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-name" className="text-xs sm:text-sm font-bold text-slate-800">
                  Full name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    required
                    className="w-full h-12.5 pl-11 pr-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-email" className="text-xs sm:text-sm font-bold text-slate-800">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    autoComplete="email"
                    required
                    className="w-full h-12.5 pl-11 pr-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-password" className="text-xs sm:text-sm font-bold text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    required
                    className="w-full h-12.5 pl-11 pr-11 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <Button
                id="btn-create-account"
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="mt-2 h-12.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all"
              >
                Send OTP Code
              </Button>

              {/* Terms of Service */}
              <p className="text-xs text-center leading-relaxed text-slate-500">
                By signing up you agree to our{" "}
                <span className="font-semibold underline cursor-pointer text-slate-700">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="font-semibold underline cursor-pointer text-slate-700">
                  Privacy Policy
                </span>
                .
              </p>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                or continue with
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google OAuth Direct Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xs disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Footer Login Link */}
            <p className="text-center text-xs sm:text-sm font-medium text-slate-500 mt-6">
              Already have an account?{" "}
              <Link
                id="link-go-to-signup-login"
                href="/login"
                className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto mt-6 pt-4 text-center text-xs text-slate-400 font-medium">
        Social Ecosystem &bull; MEETUP
      </footer>
    </main>
  );
}
