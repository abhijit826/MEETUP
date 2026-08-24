import { ConfessionItem, CategoryType, ReactionType, PublicComment } from "@/types/confessions";
import { fetchDbData, saveDbData } from "@/lib/supabaseStore";

// Read confessions from Supabase (with memory caching fallback)
let memoryConfessions: ConfessionItem[] | null = null;

export async function getSharedConfessions(): Promise<ConfessionItem[]> {
  if (memoryConfessions !== null) {
    // Return local cache for super fast UI performance, but sync in background
    fetchDbData<ConfessionItem[]>("confessions", []).then(res => {
      memoryConfessions = res;
    }).catch(() => {});
    return memoryConfessions;
  }
  const confessions = await fetchDbData<ConfessionItem[]>("confessions", []);
  memoryConfessions = confessions;
  return confessions;
}

// Save confessions to Supabase
async function saveConfessionsToDisk(confessions: ConfessionItem[]): Promise<void> {
  memoryConfessions = confessions;
  await saveDbData<ConfessionItem[]>("confessions", confessions);
}

export async function addSharedConfession(
  content: string,
  category: CategoryType,
  isAnonymous: boolean,
  userFullName: string,
  imageUrl?: string,
  userEmail?: string
): Promise<ConfessionItem> {
  const currentList = await getSharedConfessions();

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
    createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    reactions: { heart: 0, relatable: 0, mindblown: 0, support: 0 },
    userReactions: {},
    commentsCount: 0,
    comments: [],
    moderationStatus: "approved",
  };

  const updatedList = [newConfession, ...currentList];
  await saveConfessionsToDisk(updatedList);
  return newConfession;
}

export async function toggleSharedReaction(
  confessionId: string,
  reaction: ReactionType,
  userEmail?: string
): Promise<ConfessionItem[]> {
  const currentList = await getSharedConfessions();

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

  await saveConfessionsToDisk(updatedList);
  return updatedList;
}

export async function addSharedComment(
  confessionId: string,
  content: string,
  authorName: string,
  isAnonymous: boolean
): Promise<ConfessionItem[]> {
  const currentList = await getSharedConfessions();

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

  await saveConfessionsToDisk(updatedList);
  return updatedList;
}

export async function deleteSharedConfession(confessionId: string): Promise<ConfessionItem[]> {
  const currentList = await getSharedConfessions();
  const updatedList = currentList.filter((item) => item.id !== confessionId);
  await saveConfessionsToDisk(updatedList);
  return updatedList;
}
