import { NextResponse } from "next/server";
import {
  getNotificationsForUser,
  addNotification,
  markAsRead,
  markAllAsRead,
} from "@/lib/notificationsStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || undefined;
    const notifications = getNotificationsForUser(email);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch notifications";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, email, type, title, message, link, actorName } = body;

    if (action === "markRead" && id) {
      markAsRead(id);
      return NextResponse.json({ success: true });
    }

    if (action === "markAllRead") {
      markAllAsRead(email);
      return NextResponse.json({ success: true });
    }

    if (action === "create" && type && title && message && link) {
      const notification = addNotification({
        type,
        title,
        message,
        link,
        targetUserEmail: email || "all",
        actorName,
      });
      return NextResponse.json({ success: true, notification });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update notification";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
