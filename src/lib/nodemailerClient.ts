import nodemailer from "nodemailer";

export async function sendOtpViaGmail(
  toEmail: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const env = process.env as Record<string, string | undefined>;
  const gmailUser = env.GMAIL_USER;
  const rawPass = env.GMAIL_APP_PASSWORD || "";
  const gmailAppPass = rawPass.replace(/\s+/g, "");

  if (!gmailUser || !gmailAppPass) {
    return {
      success: false,
      error: "GMAIL_USER or GMAIL_APP_PASSWORD not configured in .env.local",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"MEETUP" <${gmailUser}>`,
      to: toEmail,
      subject: `🎓 ${code} is your MEETUP verification code`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MEETUP Verification</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px;">
            <div style="max-width: 440px; margin: 0 auto; background: #FFFFFF; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;">
              <!-- Brand Header -->
              <div style="margin-bottom: 24px; text-align: center;">
                <div style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #EF4444, #4F46E5); border-radius: 14px; color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">
                  🎓 MEETUP
                </div>
              </div>

              <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; text-align: center;">
                Verify Your Email
              </h2>
              <p style="font-size: 14px; color: #64748B; margin: 0 0 24px 0; text-align: center; line-height: 1.5;">
                Enter the 6-digit verification code below to access your MEETUP account:
              </p>

              <!-- OTP Code Display -->
              <div style="background: #F1F5F9; border: 2px dashed #4F46E5; border-radius: 18px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #4F46E5;">
                  ${code}
                </span>
              </div>

              <p style="font-size: 12px; color: #94A3B8; margin: 0; text-align: center;">
                ⏱️ Code expires in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("✅ [Gmail Nodemailer Sent] Message ID:", info.messageId);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gmail SMTP delivery failed";
    console.error("❌ [Gmail Nodemailer Error]:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
