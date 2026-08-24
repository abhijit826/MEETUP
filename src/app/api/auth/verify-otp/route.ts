import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoredOtp } from "@/lib/otpStore";
import { registerUser } from "@/lib/userStore";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, fullName, password } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and 6-digit code are required." },
        { status: 400 }
      );
    }

    // 1. Verify 6-digit code against OTP store
    const result = await verifyStoredOtp(email, code);

    if (!result.valid) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userPass = result.password || password || "StudentPass123!";
    const finalFullName = result.fullName || fullName || "Student";

    // 2. Register user account in user store for credential validation
    registerUser(normalizedEmail, userPass, finalFullName);

    const supabase = await createClient();

    // 3. Try to sign up user in Supabase
    await supabase.auth.signUp({
      email: normalizedEmail,
      password: userPass,
      options: {
        data: {
          full_name: fullName || "Student",
        },
      },
    });

    // 4. Try to sign in user in Supabase
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: userPass,
    });

    // 5. Set persistent session cookie (7 days)
    const sessionData = JSON.stringify({
      email: normalizedEmail,
      fullName: fullName || "Student",
      verifiedAt: Date.now(),
    });

    const cookieStore = await cookies();
    cookieStore.set("sm_user_session", sessionData, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // 6. Generate welcome notification
    try {
      const { addNotification } = await import("@/lib/notificationsStore");
      addNotification({
        type: "radar",
        title: "Welcome to Student Meetup! 🎉",
        message: "Your email has been verified. Welcome aboard, let's explore campus radar and meetup squads!",
        link: "/home",
        targetUserEmail: normalizedEmail,
      });
    } catch (e) {
      console.error("Welcome notification failed:", e);
    }

    return NextResponse.json({
      success: true,
      message: "OTP Verified Successfully!",
      user: {
        email: normalizedEmail,
        fullName: fullName || "Student",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
