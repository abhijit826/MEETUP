import { fetchDbData, saveDbData } from "@/lib/supabaseStore";

export interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number; // timestamp in ms
  password?: string;
  fullName?: string;
}

let memoryOtps: Record<string, OtpRecord> = {};

async function getLiveOtps(): Promise<Record<string, OtpRecord>> {
  const data = await fetchDbData<Record<string, OtpRecord>>("otps", {});
  memoryOtps = data || {};
  return memoryOtps;
}

async function saveLiveOtps(data: Record<string, OtpRecord>): Promise<void> {
  memoryOtps = data;
  await saveDbData<Record<string, OtpRecord>>("otps", data);
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
export async function saveOtp(
  email: string,
  code: string,
  password?: string,
  fullName?: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  const otps = await getLiveOtps();
  otps[normalizedEmail] = {
    email: normalizedEmail,
    code,
    expiresAt,
    password,
    fullName,
  };
  await saveLiveOtps(otps);
}

/**
 * Verify if an OTP code is valid for an email.
 */
export async function verifyStoredOtp(
  email: string,
  code: string
): Promise<{
  valid: boolean;
  message: string;
  password?: string;
  fullName?: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  const otps = await getLiveOtps();
  const record = otps[normalizedEmail];

  if (!record) {
    return {
      valid: false,
      message: "No OTP found for this email. Please request a new code.",
    };
  }

  if (Date.now() > record.expiresAt) {
    delete otps[normalizedEmail];
    await saveLiveOtps(otps);
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

  const { password, fullName } = record;

  // Code is valid! Clean up
  delete otps[normalizedEmail];
  await saveLiveOtps(otps);
  return {
    valid: true,
    message: "OTP verified successfully!",
    password,
    fullName,
  };
}
