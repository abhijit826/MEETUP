export function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const env = (process.env as Record<string, string | undefined>);
  return env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
