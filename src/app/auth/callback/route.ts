import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const origin = url.origin.replace("0.0.0.0", "localhost") || "http://localhost:3000";
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const email = data.session.user.email || "";
      const fullName =
        data.session.user.user_metadata?.full_name ||
        data.session.user.user_metadata?.name ||
        email.split("@")[0] ||
        "Student";

      const sessionData = JSON.stringify({
        email,
        fullName,
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

      return NextResponse.redirect(`${origin}${next}?authenticated=1`);
    }
  }

  return NextResponse.redirect(`${origin}/home`);
}
