import { NextResponse } from "next/server";
import {
  blockUser,
  unblockUser,
  getBlockedUserIds,
  reportUserOrContent,
  getReports,
} from "@/lib/userSafetyStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const blockedIds = getBlockedUserIds(userId);
    return NextResponse.json({ success: true, blockedIds });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch safety status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, blockerId, blockedId, reporterId, reportedUserId, reportedUserName, targetId, targetType, reason, details } = body;

    if (action === "block") {
      if (!blockerId || !blockedId) {
        return NextResponse.json({ error: "blockerId and blockedId are required" }, { status: 400 });
      }
      const success = blockUser(blockerId, blockedId);
      return NextResponse.json({ success, message: "User blocked successfully" });
    }

    if (action === "unblock") {
      if (!blockerId || !blockedId) {
        return NextResponse.json({ error: "blockerId and blockedId are required" }, { status: 400 });
      }
      const success = unblockUser(blockerId, blockedId);
      return NextResponse.json({ success, message: "User unblocked successfully" });
    }

    if (action === "report") {
      if (!reporterId || !reportedUserId || !reason) {
        return NextResponse.json({ error: "reporterId, reportedUserId, and reason are required" }, { status: 400 });
      }

      const report = reportUserOrContent({
        reporterId,
        reportedUserId,
        reportedUserName,
        targetId,
        targetType: targetType || "user",
        reason,
        details,
      });

      return NextResponse.json({ success: true, report, message: "Report submitted successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Safety action failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
