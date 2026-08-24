import { NextResponse } from "next/server";
import { calculateUserPoints } from "@/lib/pointsStore";

import { getSessionEmail } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    const sessionEmail = await getSessionEmail();
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: "Access Denied: Please log in first", points: 50 }, { status: 401 });
    }

    if (!email || email.trim().toLowerCase() !== sessionEmail) {
      return NextResponse.json({ success: false, error: "Access Denied: Unauthorized request", points: 50 }, { status: 403 });
    }

    const points = await calculateUserPoints(sessionEmail);
    return NextResponse.json({ success: true, points });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to calculate points";
    return NextResponse.json({ success: false, error: msg, points: 50 });
  }
}
