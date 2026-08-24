import { NextResponse } from "next/server";
import {
  getSharedConversationsForUser,
  getSharedMessagesForConv,
  startSharedConversation,
  sendSharedMessage,
  revealSharedIdentity,
  toggleSharedBlockUser,
  getSharedConversationById,
} from "@/lib/messagesStore";

// GET /api/messages — Retrieves conversations for a user or messages for a conversation
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const convId = searchParams.get("convId");
    const userId = searchParams.get("userId");

    if (convId) {
      if (!userId) {
        return NextResponse.json(
          { error: "Access Denied: authentication userId required" },
          { status: 401 }
        );
      }

      const conv = await getSharedConversationById(convId);
      if (!conv) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      const normalizedUserId = userId.trim().toLowerCase();
      const p1 = conv.participant1Id.replace("user-", "").trim().toLowerCase();
      const p2 = conv.participant2Id.replace("user-", "").trim().toLowerCase();

      if (normalizedUserId !== p1 && normalizedUserId !== p2) {
        return NextResponse.json(
          { error: "Access Denied: You are not authorized to view these messages" },
          { status: 403 }
        );
      }

      const messages = await getSharedMessagesForConv(convId);
      return NextResponse.json({ success: true, messages });
    }

    const conversations = await getSharedConversationsForUser(email || undefined);
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
      const conversation = await startSharedConversation(
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
      const message = await sendSharedMessage(
        convId,
        content,
        senderId || "user-current",
        senderName || "Student",
        !!isAnonymousSender
      );

      // Trigger notification
      try {
        const conv = await getSharedConversationById(convId);
        if (conv) {
          const cleanSenderId = (senderId || "").trim().toLowerCase();
          const p1 = conv.participant1Id.replace("user-", "").trim().toLowerCase();
          const p2 = conv.participant2Id.replace("user-", "").trim().toLowerCase();
          const recipientEmail = cleanSenderId.includes(p1) ? p2 : p1;

          const { addNotification } = await import("@/lib/notificationsStore");
          addNotification({
            type: "message",
            title: "💬 New Direct Message",
            message: `${senderName}: ${content.length > 40 ? content.substring(0, 40) + "..." : content}`,
            link: `/messages?convId=${convId}`,
            actorName: senderName,
            targetUserEmail: recipientEmail,
          });
        }
      } catch { /* ignore */ }

      const messages = await getSharedMessagesForConv(convId);
      const conversations = await getSharedConversationsForUser(senderId);
      return NextResponse.json({ success: true, message, messages, conversations });
    }

    // 3. Action: Reveal Identity
    if (action === "reveal") {
      if (!convId || !realName) {
        return NextResponse.json({ error: "convId and realName required" }, { status: 400 });
      }
      const conversations = await revealSharedIdentity(convId, realName);
      return NextResponse.json({ success: true, conversations });
    }

    // 4. Action: Block User
    if (action === "block") {
      if (!convId) {
        return NextResponse.json({ error: "convId required" }, { status: 400 });
      }
      const conversations = await toggleSharedBlockUser(convId);
      return NextResponse.json({ success: true, conversations });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process message action";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
