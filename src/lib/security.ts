// ============================================================
// Student Meetup — Cyber Security & Input Sanitization Engine
// Protects against XSS Injection, Malicious Script Payloads & Data Abuse
// ============================================================

/**
 * Sanitizes string input to prevent XSS script injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, "")
    .replace(/onerror=/gi, "")
    .replace(/onload=/gi, "");
}

/**
 * Removes html tags completely
 */
export function stripHtml(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>?/gm, "").trim();
}

/**
 * Validates whether string is safe email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
