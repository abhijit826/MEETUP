"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VapourTextEffect } from "@/components/ui/VapourTextEffect";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/getAppUrl";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const registeredEmail = searchParams.get("registered") || "";
  const isVerifiedParam = searchParams.get("verified") === "true";

  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showVapourSplash, setShowVapourSplash] = useState(false);

  useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
    if (isVerifiedParam) {
      setInfoMsg("Email verified successfully! Please sign in.");
    }

    // Detect Google OAuth error from URL hash fragment (#error=...)
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("error=")) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const errorDesc = params.get("error_description") || params.get("error") || "";
        const decoded = decodeURIComponent(decodeURIComponent(errorDesc));

        if (decoded.includes("Unable to exchange external code")) {
          setErrorMsg(
            "Google Sign-In: Supabase could not exchange the authorization code. Please verify that Client ID AND Secret match in Supabase Dashboard."
          );
        } else if (decoded) {
          setErrorMsg(`Google Sign-In error: ${decoded}`);
        }

        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setInfoMsg("Google Authentication successful! Redirecting to campus hub...");
        const email = session.user.email || "";
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email.split("@")[0] ||
          "Student";

        const sessionPayload = { email, fullName, verifiedAt: Date.now() };
        const sessionStr = JSON.stringify(sessionPayload);

        if (typeof window !== "undefined") {
          document.cookie = `sm_user_session=${encodeURIComponent(sessionStr)}; path=/; max-age=604800; SameSite=Lax`;
          try {
            localStorage.setItem("sm_user_session", sessionStr);
          } catch {
            // ignore
          }
        }

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
        }, 300);
      }
    });

    return () => subscription.unsubscribe();
  }, [registeredEmail, isVerifiedParam]);

  const handleModeSwitch = (mode: "password" | "otp", e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAuthMode(mode);
    setErrorMsg(null);
    setInfoMsg(null);
  };

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
            "Google Provider is not enabled in Supabase yet. Please enable Google under Supabase Dashboard → Authentication → Providers, or sign in using OTP / Password below!"
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
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (authMode === "password") {
        if (!password) {
          setErrorMsg("Please enter your password.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setErrorMsg(data.error || "Invalid email or password.");
          setLoading(false);
        } else {
          setInfoMsg("Signed in successfully! Redirecting to campus hub...");

          if (data.session && typeof window !== "undefined") {
            const sessionStr = JSON.stringify(data.session);
            document.cookie = `sm_user_session=${encodeURIComponent(sessionStr)}; path=/; max-age=604800; SameSite=Lax`;
            try {
              localStorage.setItem("sm_user_session", sessionStr);
            } catch {
              // ignore
            }
          }

          setShowVapourSplash(true);
          setTimeout(() => {
            window.location.href = "/home?authenticated=1";
          }, 1800);
        }
      } else {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setErrorMsg(data.error || "Could not send OTP code.");
          setLoading(false);
        } else {
          setTimeout(() => {
            window.location.href = `/verify-otp?email=${encodeURIComponent(email.trim())}`;
          }, 400);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred during sign in.");
      setLoading(false);
    }
  };

  return (
    <>
      {showVapourSplash && (
        <VapourTextEffect
          text="WELCOME BACK!"
          subtext="Entering MEETUP Campus Social Hub..."
        />
      )}

      {/* Main Responsive Split Layout Card */}
      <div className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-300/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        
        {/* LEFT COLUMN: Visual Branding & Character Area (Desktop & Tablet) */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 xl:p-10 flex-col justify-between relative overflow-hidden text-white select-none">
          {/* Ambient Glow Effects */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-indigo-200 shadow-sm">
              <Sparkles size={14} className="text-amber-400" />
              <span>MEETUP Social Network</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight mt-6 leading-tight text-white">
              Ready to jump back into campus life?
            </h2>
            <p className="text-sm text-indigo-200/80 mt-2 font-medium leading-relaxed">
              Sign in to catch up with friends, discover local campus meetups, and share real student stories.
            </p>
          </div>

          {/* Center Character Art Display */}
          <div className="relative z-10 my-6 flex items-center justify-center min-h-[300px] xl:min-h-[340px]">
            {/* Soft backdrop radial shadow */}
            <div className="absolute w-52 h-52 rounded-full bg-indigo-500/30 blur-2xl pointer-events-none" />
            
            {/* Uploaded Boy Character */}
            <img
              src="/auth_boy.png"
              alt="MEETUP Boy Character"
              className="relative z-10 max-h-[300px] xl:max-h-[340px] w-auto object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105"
            />

            {/* Floating Info Pill 1 */}
            <div className="absolute top-4 left-2 bg-white/90 backdrop-blur-md text-slate-900 px-3.5 py-2 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2.5 animate-bounce [animation-duration:4s]">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Users size={15} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold leading-none">2,400+ Students</p>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Active right now</p>
              </div>
            </div>

            {/* Floating Info Pill 2 */}
            <div className="absolute bottom-4 right-2 bg-white/90 backdrop-blur-md text-slate-900 px-3.5 py-2 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2.5 animate-bounce [animation-duration:4.5s]">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={15} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold leading-none">Verified Access</p>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Official Student Portal</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer note */}
          <div className="relative z-10 text-xs text-indigo-300/70 font-semibold flex items-center justify-between">
            <span>© MEETUP</span>
            <span>Meet. Connect. Belong.</span>
          </div>
        </div>

        {/* RIGHT COLUMN / MOBILE CARD: Auth Form */}
        <div className="col-span-1 lg:col-span-6 p-6 sm:p-10 xl:p-12 flex flex-col justify-center relative">
          
          {/* Mobile Character Top Banner (Visible ONLY on Mobile < lg) */}
          <div className="block lg:hidden text-center mb-4 pt-1">
            <div className="relative w-full py-2.5 px-3 bg-gradient-to-b from-indigo-50/90 to-purple-50/30 rounded-2xl border border-indigo-100/80 flex flex-col items-center justify-center overflow-hidden shadow-xs">
              <div className="absolute -top-10 w-36 h-36 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />
              <img
                src="/auth_boy.png"
                alt="MEETUP Character"
                className="relative z-10 h-28 xs:h-36 sm:h-44 w-auto object-contain filter drop-shadow-md select-none"
              />
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-white border border-indigo-100 text-[10px] sm:text-[11px] font-bold text-indigo-700 shadow-2xs">
                <Sparkles size={11} className="text-amber-500" />
                <span>MEETUP Campus Portal</span>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Welcome back 👋
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
              Sign in to continue to your campus experience.
            </p>
          </div>

          {/* Auth mode toggle tabs (Password vs OTP) */}
          <div className="flex p-1 mb-6 rounded-2xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={(e) => handleModeSwitch("password", e)}
              onTouchEnd={(e) => handleModeSwitch("password", e)}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                authMode === "password"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={(e) => handleModeSwitch("otp", e)}
              onTouchEnd={(e) => handleModeSwitch("otp", e)}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                authMode === "otp"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              OTP Code
            </button>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-3 animate-fade-in">
              <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium flex items-start gap-3 animate-fade-in">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{infoMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} aria-label="Sign in form">
            
            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs sm:text-sm font-bold text-slate-800">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="login-email"
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

            {/* Password Input */}
            {authMode === "password" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs sm:text-sm font-bold text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    id="btn-forgot-password"
                    onClick={() => router.push("/forgot-password")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required={authMode === "password"}
                    className="w-full h-12.5 pl-11 pr-11 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    id="btn-toggle-password"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me Option */}
            {authMode === "password" && (
              <div className="flex items-center gap-2 my-0.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                  Remember me on this device
                </label>
              </div>
            )}

            {/* Submit Button */}
            <Button
              id="btn-submit-login"
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2 h-12.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all"
            >
              {authMode === "password" ? "Sign in to Account" : "Send 6-digit OTP code"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              or continue with
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Sign-In */}
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

          {/* Footer Signup Link */}
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              id="link-go-to-signup"
              href="/signup"
              className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between px-4 sm:px-6 py-6 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="absolute w-96 h-96 -top-20 -right-20 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute w-80 h-80 -bottom-20 -left-20 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #EC4899 0%, transparent 70%)" }}
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
        <Suspense fallback={<div className="text-center font-bold text-slate-400 py-12">Loading login interface...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto mt-6 pt-4 text-center text-xs text-slate-400 font-medium">
        Social Ecosystem &bull; MEETUP
      </footer>
    </main>
  );
}
