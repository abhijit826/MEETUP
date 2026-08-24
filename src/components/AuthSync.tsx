"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthSync() {
  useEffect(() => {
    const supabase = createClient();
    
    // 1. Initial check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSessionCookie(session.user);
      }
    });

    // 2. Listen for auth state revisions (sign in, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncSessionCookie(session.user);
      } else {
        // If logged out from Supabase, clean up the custom cookie to avoid stale middleware
        if (event === "SIGNED_OUT") {
          document.cookie = "sm_user_session=; path=/; max-age=0; SameSite=Lax";
          try {
            localStorage.removeItem("sm_user_session");
          } catch {}
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

function syncSessionCookie(user: any) {
  const email = user.email || "";
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split("@")[0] ||
    "Student";

  const sessionPayload = {
    email: email.trim().toLowerCase(),
    fullName: fullName.trim(),
    verifiedAt: Date.now(),
  };
  const sessionStr = JSON.stringify(sessionPayload);

  // Set cookie for Next.js Middleware path validation
  document.cookie = `sm_user_session=${encodeURIComponent(sessionStr)}; path=/; max-age=604800; SameSite=Lax`;
  try {
    localStorage.setItem("sm_user_session", sessionStr);
  } catch {}
}
