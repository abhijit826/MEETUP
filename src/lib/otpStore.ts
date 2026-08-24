// ============================================================
// Student Meetup — In-Memory & Database OTP Store
// ============================================================

export interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number; // timestamp in ms
}

// Global in-memory store for development & server runtime
const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, OtpRecord>;
};

export const otpStore =
  globalForOtp.otpStore || new Map<string, OtpRecord>();

if ((process.env as Record<string, string | undefined>).NODE_ENV !== "production") {
  globalForOtp.otpStore = otpStore;
}

/**
 * Generate a random 6-digit numerical OTP code.
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store an OTP for an email with a 10-minute expiration window.
 */
export function saveOtp(email: string, code: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(normalizedEmail, { email: normalizedEmail, code, expiresAt });
}

/**
 * Verify if an OTP code is valid for an email.
 */
export function verifyStoredOtp(email: string, code: string): {
  valid: boolean;
  message: string;
} {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return {
      valid: false,
      message: "No OTP found for this email. Please request a new code.",
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      message: "OTP code has expired. Please request a new one.",
    };
  }

  if (record.code !== code.trim()) {
    return {
      valid: false,
      message: "Invalid OTP code. Please check your email and try again.",
    };
  }

  // Code is valid! Clean up
  otpStore.delete(normalizedEmail);
  return { valid: true, message: "OTP verified successfully!" };
}
