import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifyUserCredentials } from "@/lib/userStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = await createClient();

    // 1. Try standard Supabase authentication
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (!signInError && signInData?.session) {
      const userPayload = {
        email: normalizedEmail,
        fullName: signInData.user?.user_metadata?.full_name || "Student",
        verifiedAt: Date.now(),
      };
      const sessionData = JSON.stringify(userPayload);

      const cookieStore = await cookies();
      cookieStore.set("sm_user_session", sessionData, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        message: "Signed in successfully!",
        session: userPayload,
      });
    }

    // 2. Strict User Store Credential Validation
    const storeValidation = verifyUserCredentials(normalizedEmail, password);

    if (!storeValidation.valid) {
      return NextResponse.json(
        { error: storeValidation.error || "Invalid email or password." },
        { status: 401 }
      );
    }

    const userPayload = {
      email: normalizedEmail,
      fullName: storeValidation.user?.fullName || normalizedEmail.split("@")[0] || "Student",
      verifiedAt: Date.now(),
    };
    const sessionData = JSON.stringify(userPayload);

    const cookieStore = await cookies();
    cookieStore.set("sm_user_session", sessionData, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Signed in successfully!",
      session: userPayload,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
