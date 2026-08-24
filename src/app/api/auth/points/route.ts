import { NextResponse } from "next/server";
import { calculateUserPoints } from "@/lib/pointsStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: true, points: 50 });
    }

    const points = await calculateUserPoints(email);
    return NextResponse.json({ success: true, points });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to calculate points";
    return NextResponse.json({ success: false, error: msg, points: 50 });
  }
}
