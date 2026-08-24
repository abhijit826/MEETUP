import fs from "fs";
import path from "path";
import { Conversation, DirectMessage } from "@/types/confessions";

const MESSAGES_FILE_PATH = path.join(process.cwd(), "src", "data", "messages.json");

interface MessagesDataStore {
  conversations: Conversation[];
  messages: Record<string, DirectMessage[]>;
}

function ensureMessagesFile() {
  try {
    const dir = path.dirname(MESSAGES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(MESSAGES_FILE_PATH)) {
      const initial: MessagesDataStore = { conversations: [], messages: {} };
      fs.writeFileSync(MESSAGES_FILE_PATH, JSON.stringify(initial, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error ensuring messages data file:", err);
  }
}

export function getDiskMessagesData(): MessagesDataStore {
  ensureMessagesFile();
  try {
    const fileData = fs.readFileSync(MESSAGES_FILE_PATH, "utf-8");
    if (!fileData.trim()) return { conversations: [], messages: {} };
    return JSON.parse(fileData) as MessagesDataStore;
  } catch (err) {
    console.error("Error reading messages.json:", err);
    return { conversations: [], messages: {} };
  }
}

function saveDiskMessagesData(data: MessagesDataStore): void {
  ensureMessagesFile();
  try {
    fs.writeFileSync(MESSAGES_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to messages.json:", err);
  }
}

export function getSharedConversationsForUser(userEmail?: string): Conversation[] {
  const store = getDiskMessagesData();
  if (!userEmail || !userEmail.trim()) return store.conversations;

  const normalized = userEmail.trim().toLowerCase();
  return store.conversations.filter((c) => {
    const p1 = c.participant1Id.toLowerCase();
    const p2 = c.participant2Id.toLowerCase();
    return p1.includes(normalized) || p2.includes(normalized);
  });
}

export function getSharedMessagesForConv(convId: string): DirectMessage[] {
  const store = getDiskMessagesData();
  return store.messages[convId] || [];
}

export function startSharedConversation(
  confessionId: string,
  confessionSnippet: string,
  authorId: string,
  authorName: string,
  authorIsAnonymous: boolean,
  currentUserId: string,
  currentUserName: string
): Conversation {
  const store = getDiskMessagesData();

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
    participant1IsAnonymous: false,
    participant2Id: p2Id,
    participant2Name: authorIsAnonymous ? "Anonymous" : authorName || "Student",
    participant2College: "SRM ✓",
    participant2IsAnonymous: authorIsAnonymous,
    participant2Avatar: authorIsAnonymous ? undefined : (authorName || "S").charAt(0).toUpperCase(),
    isIdentityRevealed: false,
    lastMessage: `Started a private chat regarding confession...`,
    lastMessageTimestamp: "Just now",
    unreadCount: 1,
    isBlocked: false,
  };

  store.conversations = [newConv, ...store.conversations];
  if (!store.messages[newConv.id]) {
    store.messages[newConv.id] = [];
  }

  saveDiskMessagesData(store);
  return newConv;
}

export function sendSharedMessage(
  convId: string,
  content: string,
  senderId: string,
  senderName: string,
  isAnonymousSender: boolean
): DirectMessage {
  const store = getDiskMessagesData();

  const newMsg: DirectMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId: convId,
    senderId,
    senderName: isAnonymousSender ? "Anonymous" : senderName,
    isAnonymousSender,
    content: content.trim(),
    timestamp: "Just now",
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
      lastMessageTimestamp: "Just now",
      unreadCount: (c.unreadCount || 0) + 1,
    };
  });

  saveDiskMessagesData(store);
  return newMsg;
}

export function revealSharedIdentity(convId: string, realName: string): Conversation[] {
  const store = getDiskMessagesData();
  store.conversations = store.conversations.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      participant2Name: realName,
      participant2IsAnonymous: false,
      participant2Avatar: realName.charAt(0).toUpperCase(),
      isIdentityRevealed: true,
    };
  });
  saveDiskMessagesData(store);
  return store.conversations;
}

export function toggleSharedBlockUser(convId: string): Conversation[] {
  const store = getDiskMessagesData();
  store.conversations = store.conversations.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      isBlocked: !c.isBlocked,
    };
  });
  saveDiskMessagesData(store);
  return store.conversations;
}
