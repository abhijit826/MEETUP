import fs from "fs";
import path from "path";
import { ConfessionItem, CategoryType, ReactionType, PublicComment } from "@/types/confessions";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "confessions.json");

// Helper to ensure the data file exists
function ensureDataFile() {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE_PATH)) {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error ensuring confessions data file:", err);
  }
}

let memoryConfessions: ConfessionItem[] | null = null;

// Read confessions from disk storage
export function getSharedConfessions(): ConfessionItem[] {
  if (memoryConfessions !== null) {
    return memoryConfessions;
  }
  ensureDataFile();
  try {
    const fileData = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    if (!fileData.trim()) return [];
    memoryConfessions = JSON.parse(fileData) as ConfessionItem[];
    return memoryConfessions;
  } catch (err) {
    console.error("Error reading confessions.json:", err);
    return [];
  }
}

// Save confessions to disk storage
function saveConfessionsToDisk(confessions: ConfessionItem[]): void {
  memoryConfessions = confessions;
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(confessions, null, 2), "utf-8");
  } catch (err) {
    console.warn("Writing to confessions.json failed, falling back to memory storage:", err);
  }
}

export function addSharedConfession(
  content: string,
  category: CategoryType,
  isAnonymous: boolean,
  userFullName: string,
  imageUrl?: string,
  userEmail?: string
): ConfessionItem {
  const currentList = getSharedConfessions();

  const newConfession: ConfessionItem = {
    id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    content: content.trim(),
    imageUrl,
    category,
    isAnonymous,
    authorId: userEmail ? `user-${userEmail}` : (isAnonymous ? `user-anon-${Date.now()}` : `user-real-${Date.now()}`),
    authorName: isAnonymous ? "Anonymous" : userFullName || "Student",
    authorCollege: "SRM ✓",
    authorAvatar: isAnonymous ? undefined : (userFullName || "S").charAt(0).toUpperCase(),
    createdAt: "Just now",
    reactions: { heart: 0, relatable: 0, mindblown: 0, support: 0 },
    userReactions: {},
    commentsCount: 0,
    comments: [],
    moderationStatus: "approved",
  };

  const updatedList = [newConfession, ...currentList];
  saveConfessionsToDisk(updatedList);
  return newConfession;
}

export function toggleSharedReaction(
  confessionId: string,
  reaction: ReactionType,
  userEmail?: string
): ConfessionItem[] {
  const currentList = getSharedConfessions();

  const updatedList = currentList.map((item) => {
    if (item.id !== confessionId) return item;

    const hasReacted = !!item.userReactions[reaction];
    const newCount = Math.max(
      0,
      item.reactions[reaction] + (hasReacted ? -1 : 1)
    );

    return {
      ...item,
      reactions: {
        ...item.reactions,
        [reaction]: newCount,
      },
      userReactions: {
        ...item.userReactions,
        [reaction]: !hasReacted,
      },
    };
  });

  saveConfessionsToDisk(updatedList);
  return updatedList;
}

export function addSharedComment(
  confessionId: string,
  content: string,
  authorName: string,
  isAnonymous: boolean
): ConfessionItem[] {
  const currentList = getSharedConfessions();

  const updatedList = currentList.map((item) => {
    if (item.id !== confessionId) return item;

    const newComment: PublicComment = {
      id: `c-${Date.now()}`,
      confessionId,
      authorName: isAnonymous ? "Anonymous" : authorName || "Student",
      authorCollege: "SRM ✓",
      isAnonymous,
      content: content.trim(),
      createdAt: "Just now",
      likes: 0,
    };

    return {
      ...item,
      commentsCount: item.commentsCount + 1,
      comments: [newComment, ...(item.comments || [])],
    };
  });

  saveConfessionsToDisk(updatedList);
  return updatedList;
}

export function deleteSharedConfession(confessionId: string): ConfessionItem[] {
  const currentList = getSharedConfessions();
  const updatedList = currentList.filter((item) => item.id !== confessionId);
  saveConfessionsToDisk(updatedList);
  return updatedList;
}
