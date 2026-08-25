import { Conversation, DirectMessage } from "@/types/confessions";
import { fetchDbData, saveDbData } from "@/lib/supabaseStore";

interface MessagesDataStore {
  conversations: Conversation[];
  messages: Record<string, DirectMessage[]>;
}

let memoryMessagesData: MessagesDataStore | null = null;

export async function getDiskMessagesData(): Promise<MessagesDataStore> {
  if (memoryMessagesData !== null) {
    // Return cache immediately, sync in background
    fetchDbData<MessagesDataStore>("messages", { conversations: [], messages: {} }).then(res => {
      memoryMessagesData = res;
    }).catch(() => {});
    return memoryMessagesData;
  }
  const data = await fetchDbData<MessagesDataStore>("messages", { conversations: [], messages: {} });
  memoryMessagesData = data;
  return data;
}

async function saveDiskMessagesData(data: MessagesDataStore): Promise<void> {
  memoryMessagesData = data;
  await saveDbData<MessagesDataStore>("messages", data);
}

export async function getSharedConversationsForUser(userEmail?: string): Promise<Conversation[]> {
  const store = await getDiskMessagesData();
  if (!userEmail || !userEmail.trim()) return store.conversations;

  const normalized = userEmail.trim().toLowerCase();
  return store.conversations.filter((c) => {
    const p1 = c.participant1Id.toLowerCase();
    const p2 = c.participant2Id.toLowerCase();
    return p1.includes(normalized) || p2.includes(normalized);
  });
}

export async function getSharedMessagesForConv(convId: string): Promise<DirectMessage[]> {
  const store = await getDiskMessagesData();
  return store.messages[convId] || [];
}

export async function startSharedConversation(
  confessionId: string,
  confessionSnippet: string,
  authorId: string,
  authorName: string,
  authorIsAnonymous: boolean,
  currentUserId: string,
  currentUserName: string
): Promise<Conversation> {
  const store = await getDiskMessagesData();

  const p1Id = currentUserId ? `user-${currentUserId.trim().toLowerCase()}` : "user-current";
  const p2Id = authorId ? (authorId.startsWith("user-") ? authorId : `user-${authorId.trim().toLowerCase()}`) : `user-author-${Date.now()}`;

  // Check if conversation already exists between these 2 users for this confession
  const existing = store.conversations.find(
    (c) =>
      c.confessionId === confessionId &&
      ((c.participant1Id === p1Id && c.participant2Id === p2Id) ||
        (c.participant1Id === p2Id && c.participant2Id === p1Id))
  );

  if (existing) return existing;

  const newConv: Conversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    confessionId,
    confessionSnippet,
    participant1Id: p1Id,
    participant1Name: currentUserName || "Student",
    participant1College: "SRM ✓",
    participant1IsAnonymous: true, // Sender starts anonymous in private confession DM
    participant2Id: p2Id,
    participant2Name: authorName || "Student",
    participant2College: "SRM ✓",
    participant2IsAnonymous: authorIsAnonymous,
    participant2Avatar: authorIsAnonymous ? undefined : (authorName || "S").charAt(0).toUpperCase(),
    isIdentityRevealed: false,
    lastMessage: `Started a private chat regarding confession...`,
    lastMessageTimestamp: new Date().toISOString(),
    unreadCount: 1,
    isBlocked: false,
  };

  store.conversations = [newConv, ...store.conversations];
  if (!store.messages[newConv.id]) {
    store.messages[newConv.id] = [];
  }

  await saveDiskMessagesData(store);
  return newConv;
}

export async function sendSharedMessage(
  convId: string,
  content: string,
  senderId: string,
  senderName: string,
  isAnonymousSender: boolean
): Promise<DirectMessage> {
  const store = await getDiskMessagesData();
  const conv = store.conversations.find((c) => c.id === convId);

  let isAnon = isAnonymousSender;
  let resolvedName = senderName;

  if (conv) {
    const cleanSender = (senderId || "").replace("user-", "").trim().toLowerCase();
    const p1Clean = conv.participant1Id.replace("user-", "").trim().toLowerCase();
    if (cleanSender && (cleanSender.includes(p1Clean) || p1Clean.includes(cleanSender))) {
      isAnon = conv.participant1IsAnonymous ?? true;
      resolvedName = conv.participant1IsAnonymous ? "Anonymous" : (conv.participant1Name || senderName);
    } else {
      isAnon = conv.participant2IsAnonymous ?? true;
      resolvedName = conv.participant2IsAnonymous ? "Anonymous" : (conv.participant2Name || senderName);
    }
  }

  const newMsg: DirectMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId: convId,
    senderId,
    senderName: isAnon ? "Anonymous" : resolvedName,
    isAnonymousSender: isAnon,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    isRead: true,
  };

  const currentMsgs = store.messages[convId] || [];
  store.messages[convId] = [...currentMsgs, newMsg];

  // Update conversation lastMessage preview
  store.conversations = store.conversations.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      lastMessage: content.trim(),
      lastMessageTimestamp: new Date().toISOString(),
      unreadCount: (c.unreadCount || 0) + 1,
    };
  });

  await saveDiskMessagesData(store);
  return newMsg;
}

export async function toggleSharedIdentity(
  convId: string,
  userEmail?: string,
  realName?: string
): Promise<Conversation[]> {
  const store = await getDiskMessagesData();
  const normalizedEmail = (userEmail || "").trim().toLowerCase();

  store.conversations = store.conversations.map((c) => {
    if (c.id !== convId) return c;

    const p1Clean = c.participant1Id.replace("user-", "").trim().toLowerCase();
    const p2Clean = c.participant2Id.replace("user-", "").trim().toLowerCase();

    // Check if the toggling user is Participant 1 or Participant 2
    const isP1 = normalizedEmail
      ? p1Clean.includes(normalizedEmail) || normalizedEmail.includes(p1Clean)
      : true;

    if (isP1) {
      // Toggle Participant 1's identity status ONLY
      const currentlyAnon = c.participant1IsAnonymous ?? true;
      const nextAnon = !currentlyAnon;
      const updatedName = realName || c.participant1Name || "Student";
      return {
        ...c,
        participant1Name: updatedName,
        participant1IsAnonymous: nextAnon,
        participant1Avatar: nextAnon ? undefined : updatedName.charAt(0).toUpperCase(),
        isIdentityRevealed: !nextAnon || !c.participant2IsAnonymous,
      };
    } else {
      // Toggle Participant 2's identity status ONLY
      const currentlyAnon = c.participant2IsAnonymous ?? true;
      const nextAnon = !currentlyAnon;
      const updatedName = realName || c.participant2Name || "Student";
      return {
        ...c,
        participant2Name: updatedName,
        participant2IsAnonymous: nextAnon,
        participant2Avatar: nextAnon ? undefined : updatedName.charAt(0).toUpperCase(),
        isIdentityRevealed: !c.participant1IsAnonymous || !nextAnon,
      };
    }
  });
  await saveDiskMessagesData(store);
  return store.conversations;
}

export async function toggleSharedBlockUser(convId: string): Promise<Conversation[]> {
  const store = await getDiskMessagesData();
  store.conversations = store.conversations.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      isBlocked: !c.isBlocked,
    };
  });
  await saveDiskMessagesData(store);
  return store.conversations;
}

export async function getSharedConversationById(convId: string): Promise<Conversation | null> {
  const store = await getDiskMessagesData();
  return store.conversations.find((c) => c.id === convId) || null;
}

export async function markSharedConversationAsRead(convId: string): Promise<Conversation[]> {
  const store = await getDiskMessagesData();
  store.conversations = store.conversations.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      unreadCount: 0,
    };
  });
  await saveDiskMessagesData(store);
  return store.conversations;
}

