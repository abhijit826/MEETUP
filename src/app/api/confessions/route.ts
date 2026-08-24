import { NextResponse } from "next/server";
import {
  getSharedConfessions,
  addSharedConfession,
  deleteSharedConfession,
  toggleSharedReaction,
  addSharedComment,
} from "@/lib/confessionsStore";
import { moderateContent } from "@/lib/aiModerationEngine";

// GET /api/confessions — Returns shared feed across all connected students/devices
export async function GET() {
  const confessions = getSharedConfessions();
  return NextResponse.json({ success: true, confessions });
}

// POST /api/confessions — Validates AI Moderation and broadcasts new post to all students
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, content, category, isAnonymous, userFullName, imageUrl, userEmail, confessionId, reaction } = body;

    // Handle Reaction action
    if (action === "react") {
      if (!confessionId || !reaction) {
        return NextResponse.json({ error: "Missing reaction params" }, { status: 400 });
      }
      const updated = toggleSharedReaction(confessionId, reaction, userEmail);
      return NextResponse.json({ success: true, confessions: updated });
    }

    // Handle Comment action
    if (action === "comment") {
      if (!confessionId || !content) {
        return NextResponse.json({ error: "Comment content required" }, { status: 400 });
      }
      const updated = addSharedComment(confessionId, content, userFullName, isAnonymous);
      return NextResponse.json({ success: true, confessions: updated });
    }

    // Handle Create Post action
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Post content cannot be empty." }, { status: 400 });
    }

    // 1. Run AI Moderation Scan (HuggingFace + Pattern Scanner)
    const moderation = await moderateContent(content, imageUrl);
    if (moderation.flagged) {
      return NextResponse.json(
        {
          error: moderation.reason || "Content flagged by AI moderation safety rules.",
          details: moderation.details,
          flagged: true,
          category: moderation.category,
        },
        { status: 422 }
      );
    }

    // 2. Add to global shared feed
    const newConfession = addSharedConfession(
      content,
      category || "General",
      !!isAnonymous,
      userFullName || "Student",
      imageUrl,
      userEmail
    );

    const confessions = getSharedConfessions();
    return NextResponse.json({ success: true, confession: newConfession, confessions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process confession";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/confessions — Deletes a confession by ID from the shared feed
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Confession ID is required" }, { status: 400 });
    }

    const updated = deleteSharedConfession(id);
    return NextResponse.json({ success: true, confessions: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete confession";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
