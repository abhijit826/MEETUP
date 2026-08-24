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

    // Block inspection keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && ["U", "u"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Disable right click menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    window.addEventListener("contextmenu", handleContextMenu);

    // Override console output to prevent data leakage in devtools
    if (typeof window !== "undefined" && (process.env.NODE_ENV === "production" || window.location.hostname !== "localhost")) {
      const emptyFn = () => {};
      window.console.log = emptyFn;
      window.console.warn = emptyFn;
      window.console.info = emptyFn;
      window.console.debug = emptyFn;
      window.console.error = emptyFn;
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
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
