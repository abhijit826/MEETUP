import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import HomeClientContent from "@/components/home/HomeClientContent";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const customSessionVal = cookieStore.get("sm_user_session")?.value;
  let customUser: { email?: string; fullName?: string } | null = null;

  if (customSessionVal) {
    try {
      const decoded = decodeURIComponent(customSessionVal);
      customUser = JSON.parse(decoded);
    } catch {
      try {
        customUser = JSON.parse(customSessionVal);
      } catch {
        customUser = null;
      }
    }
  }

  const currentUser = supabaseUser || customUser;

  if (!currentUser) {
    redirect("/login");
  }

  const fullName =
    supabaseUser?.user_metadata?.full_name || customUser?.fullName || "Student";
  const userEmail = supabaseUser?.email || customUser?.email || "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 md:pb-8 transition-colors duration-200">
      {/* Top Desktop & Mobile Navigation Bar */}
      <Navbar userEmail={userEmail} userFullName={fullName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <HomeClientContent fullName={fullName} userEmail={userEmail} />
      </main>

      <footer className="mt-auto border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-gray-400 dark:text-slate-500 font-medium">
        MEETUP &copy; 2026
      </footer>
    </div>
  );
}
