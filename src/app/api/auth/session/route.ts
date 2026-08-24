import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const sessionData = JSON.stringify({
      email: email.trim().toLowerCase(),
      fullName: fullName || email.split("@")[0] || "Student",
      verifiedAt: Date.now(),
    });

    const cookieStore = await cookies();
    cookieStore.set("sm_user_session", sessionData, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Session error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
