import { NextResponse } from "next/server";
import {
  getNotificationsForUser,
  addNotification,
  markAsRead,
  markAllAsRead,
  dismissNotification,
} from "@/lib/notificationsStore";

import { getSessionEmail } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    const sessionEmail = await getSessionEmail();
    if (!sessionEmail) {
      return NextResponse.json({ error: "Access Denied: Please log in first" }, { status: 401 });
    }

    if (!email || email.trim().toLowerCase() !== sessionEmail) {
      return NextResponse.json({ error: "Access Denied: Unauthorized request" }, { status: 403 });
    }

    const notifications = getNotificationsForUser(sessionEmail);
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

    const sessionEmail = await getSessionEmail();
    if (!sessionEmail) {
      return NextResponse.json({ error: "Access Denied: Please log in first" }, { status: 401 });
    }

    // Mark notifications read must check ownership
    if ((action === "markRead" || action === "markAllRead") && email) {
      if (email.trim().toLowerCase() !== sessionEmail) {
        return NextResponse.json({ error: "Access Denied: Unauthorized request" }, { status: 403 });
      }
    }

    if (action === "markRead" && id) {
      markAsRead(id);
      return NextResponse.json({ success: true });
    }

    if (action === "markAllRead") {
      markAllAsRead(sessionEmail);
      return NextResponse.json({ success: true });
    }

    if (action === "dismiss" && id) {
      dismissNotification(id);
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
