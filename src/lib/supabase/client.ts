import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const env = process.env as Record<string, string | undefined>;
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
