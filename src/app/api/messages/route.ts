import { NextResponse } from "next/server";
import {
  getSharedConversationsForUser,
  getSharedMessagesForConv,
  startSharedConversation,
  sendSharedMessage,
  revealSharedIdentity,
  toggleSharedBlockUser,
} from "@/lib/messagesStore";

// GET /api/messages — Retrieves conversations for a user or messages for a conversation
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const convId = searchParams.get("convId");

    if (convId) {
      const messages = getSharedMessagesForConv(convId);
      return NextResponse.json({ success: true, messages });
    }

    const conversations = getSharedConversationsForUser(email || undefined);
    return NextResponse.json({ success: true, conversations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load messages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/messages — Sends message, starts conversation, or modifies conversation state
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, confessionId, confessionSnippet, authorId, authorName, authorIsAnonymous, currentUserId, currentUserName, convId, content, senderId, senderName, isAnonymousSender, realName } = body;

    // 1. Action: Start Conversation
    if (action === "start") {
      if (!confessionId) {
        return NextResponse.json({ error: "confessionId is required" }, { status: 400 });
      }
      const conversation = startSharedConversation(
        confessionId,
        confessionSnippet || "",
        authorId || "",
        authorName || "Anonymous",
        !!authorIsAnonymous,
        currentUserId || "anon-user",
        currentUserName || "Student"
      );
      return NextResponse.json({ success: true, conversation });
    }

    // 2. Action: Send Direct Message
    if (action === "send") {
      if (!convId || !content || !content.trim()) {
        return NextResponse.json({ error: "convId and content are required" }, { status: 400 });
      }
      const message = sendSharedMessage(
        convId,
        content,
        senderId || "user-current",
        senderName || "Student",
        !!isAnonymousSender
      );

      // Trigger notification
      try {
        const { addNotification } = await import("@/lib/notificationsStore");
        addNotification({
          type: "message",
          title: "💬 New Direct Message",
          message: `${senderName}: ${content.length > 40 ? content.substring(0, 40) + "..." : content}`,
          link: `/messages?convId=${convId}`,
          actorName: senderName,
        });
      } catch { /* ignore */ }

      const messages = getSharedMessagesForConv(convId);
      const conversations = getSharedConversationsForUser(senderId);
      return NextResponse.json({ success: true, message, messages, conversations });
    }

    // 3. Action: Reveal Identity
    if (action === "reveal") {
      if (!convId || !realName) {
        return NextResponse.json({ error: "convId and realName required" }, { status: 400 });
      }
      const conversations = revealSharedIdentity(convId, realName);
      return NextResponse.json({ success: true, conversations });
    }

    // 4. Action: Block User
    if (action === "block") {
      if (!convId) {
        return NextResponse.json({ error: "convId required" }, { status: 400 });
      }
      const conversations = toggleSharedBlockUser(convId);
      return NextResponse.json({ success: true, conversations });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process message action";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
