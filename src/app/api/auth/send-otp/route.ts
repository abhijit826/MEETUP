import { NextResponse } from "next/server";
import { saveOtp } from "@/lib/otpStore";
import { sendOtpViaGmail } from "@/lib/nodemailerClient";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    saveOtp(normalizedEmail, code);

    let emailSent = false;
    let deliveryNotice = "";

    // 1. Try Gmail SMTP first if GMAIL_USER and GMAIL_APP_PASSWORD are provided
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const gmailResult = await sendOtpViaGmail(normalizedEmail, code);
      if (gmailResult.success) {
        emailSent = true;
      } else {
        deliveryNotice = `Gmail SMTP Notice: ${gmailResult.error}`;
      }
    }

    // 2. Try Resend API if Gmail was not configured or failed
    if (!emailSent && process.env.RESEND_API_KEY?.startsWith("re_")) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MEETUP <onboarding@resend.dev>",
            to: [normalizedEmail],
            subject: `${code} is your MEETUP verification code`,
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: sans-serif; padding: 20px;">
                  <h2>Verify your email</h2>
                  <p>Your MEETUP code: <strong>${code}</strong></p>
                </body>
              </html>
            `,
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok && resendData?.id) {
          emailSent = true;
        } else {
          deliveryNotice = resendData?.message || "Resend free tier recipient restriction";
        }
      } catch (err: unknown) {
        deliveryNotice = err instanceof Error ? err.message : "Resend dispatch failed";
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      devOtp: code,
      message: emailSent
        ? "6-digit OTP code sent to your email inbox!"
        : `OTP Code: ${code}`,
      deliveryNotice: deliveryNotice || undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate OTP";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
