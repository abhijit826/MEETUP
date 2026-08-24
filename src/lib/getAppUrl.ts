export function getAppUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (host.includes("192.168.") || host.includes("10.") || host.includes("172.")) {
      return `${window.location.protocol}//${host}`;
    }
    return "http://localhost:3000";
  }
  const env = (process.env as Record<string, string | undefined>);
  return env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
