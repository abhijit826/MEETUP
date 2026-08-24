import { NextResponse } from "next/server";
import { moderateContent } from "@/lib/aiModerationEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, image } = body;

    if (!text && !image) {
      return NextResponse.json(
        { error: "Text or image payload is required for moderation." },
        { status: 400 }
      );
    }

    // Only pass image to scanner if it's a valid data URL (not a filename)
    const imageForScan = image && image.startsWith("data:image/") ? image : undefined;

    const moderationResult = await moderateContent(text || "", imageForScan);

    // Return both field naming conventions so modal's !result.isSafe works
    return NextResponse.json({
      ...moderationResult,
      isSafe: !moderationResult.flagged,
      flaggedCategory: moderationResult.category,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Moderation check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
