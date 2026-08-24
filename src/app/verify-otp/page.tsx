"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { createClient } from "@/lib/supabase/client";

function VerifyOtpForm() {
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const nameParam = searchParams.get("name") || "";
  const devOtpParam = searchParams.get("devOtp") || "";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);

  // Countdown timer for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length < 6) {
      setErrorMsg("Please enter the full 6-digit code sent to your email.");
      return;
    }

    if (!emailParam) {
      setErrorMsg("Missing email address. Please return to sign up.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const tempPass =
        typeof window !== "undefined"
          ? sessionStorage.getItem("sm_temp_pass") || "StudentPass123!"
          : "StudentPass123!";

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailParam,
          code: code.trim(),
          fullName: nameParam,
          password: tempPass,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Verification failed.");
        setLoading(false);
      } else {
        setSuccessMsg("OTP Verified! Connecting to campus hub...");

        if (typeof window !== "undefined") {
          const sessionPayload = {
            email: emailParam.trim().toLowerCase(),
            fullName: nameParam || emailParam.split("@")[0] || "Student",
            verifiedAt: Date.now(),
          };
          const sessionStr = JSON.stringify(sessionPayload);
          document.cookie = `sm_user_session=${encodeURIComponent(sessionStr)}; path=/; max-age=604800; SameSite=Lax`;
          try {
            localStorage.setItem("sm_user_session", sessionStr);
          } catch {
            // ignore
          }
        }

        try {
          const supabase = createClient();
          await supabase.auth.signInWithPassword({
            email: emailParam,
            password: tempPass,
          });
        } catch (e) {
          console.warn("Client side Supabase sign in bypassed for mobile", e);
        }

        setTimeout(() => {
          window.location.href = "/home?authenticated=1";
        }, 300);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || resending || !emailParam) return;

    setResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const tempPass =
        typeof window !== "undefined"
          ? sessionStorage.getItem("sm_temp_pass") || "StudentPass123!"
          : "StudentPass123!";

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailParam,
          password: tempPass,
          fullName: nameParam,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Could not resend OTP code.");
      } else {
        setSuccessMsg(
          data.devOtp
            ? `New 6-digit OTP code generated: ${data.devOtp}`
            : "A new 6-digit OTP code has been dispatched to your email!"
        );
        setTimer(60);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative w-full max-w-[430px] mx-auto">
      {/* Back link */}
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 mb-8 text-sm font-semibold transition-opacity hover:opacity-60"
        style={{ color: "var(--color-fg-muted)" }}
      >
        <ArrowLeft size={16} />
        Back to signup
      </Link>

      {/* Icon & Title */}
      <div className="text-center mb-6 animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg"
          style={{ background: "var(--color-secondary-light)" }}
        >
          <ShieldCheck size={32} style={{ color: "var(--color-secondary)" }} />
        </div>

        <h1
          className="text-2xl font-black tracking-tight mb-2"
          style={{ color: "var(--color-fg)" }}
        >
          Enter verification code
        </h1>

        <p className="text-sm font-medium leading-relaxed px-2" style={{ color: "var(--color-fg-muted)" }}>
          We sent a 6-digit OTP verification code to:
          <br />
          <span className="font-bold text-[#111827]">{emailParam || "your email"}</span>
        </p>
      </div>



      {/* Alert notifications */}
      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fade-in">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-2.5 animate-fade-in">
          <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* OTP Input component */}
      <div className="animate-fade-in-up delay-100">
        <OtpInput
          length={6}
          disabled={loading}
          onComplete={(code) => {
            setOtpCode(code);
            handleVerify(code);
          }}
        />
      </div>

      {/* Verify Button */}
      <div className="mt-4 animate-fade-in-up delay-200">
        <Button
          id="btn-verify-otp"
          onClick={() => handleVerify()}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          className="font-bold"
        >
          Verify OTP &amp; Continue
        </Button>
      </div>

      {/* Resend timer */}
      <div className="text-center mt-6 animate-fade-in-up delay-300">
        {timer > 0 ? (
          <p className="text-xs font-medium" style={{ color: "var(--color-fg-muted)" }}>
            Resend code in <span className="font-bold text-[#4F46E5]">{timer}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-xs font-bold underline transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: "var(--color-secondary)" }}
          >
            <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
            Didn&apos;t receive code? Resend OTP
          </button>
        )}
      </div>

      {/* Change email option */}
      <div className="text-center mt-8 pt-6 border-t border-[var(--color-border-light)]">
        <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
          Wrong email address?{" "}
          <Link
            href="/signup"
            className="font-bold underline underline-offset-2"
            style={{ color: "var(--color-fg)" }}
          >
            Change email
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden px-5 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Background blobs */}
      <div
        aria-hidden="true"
        className="absolute w-64 h-64 -top-12 -left-16 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute w-56 h-56 -bottom-10 -right-12 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #EF4444 0%, transparent 70%)" }}
      />

      <Suspense fallback={<div className="text-center">Loading OTP screen...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </main>
  );
}
